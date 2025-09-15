// src/components/Performance/ImageOptimizer.tsx
/**
 * Image Optimizer Component
 * Responsive image optimization with WebP/AVIF support, CDN integration,
 * and adaptive loading based on device capabilities and network conditions
 * @module components/Performance/ImageOptimizer
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { clsx } from 'clsx';

/**
 * Image format support
 */
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'gif' | 'svg';

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  // Format optimization
  formats: ImageFormat[];
  quality: number;
  progressive: boolean;
  
  // Responsive sizing
  breakpoints: number[];
  sizes: string;
  densities: number[];
  
  // CDN configuration
  cdnUrl?: string;
  cdnParams?: Record<string, string>;
  
  // Adaptive loading
  enableAdaptiveLoading: boolean;
  enableNetworkAdaptation: boolean;
  enableBatteryOptimization: boolean;
  
  // Performance settings
  enablePreloading: boolean;
  enableLazyLoading: boolean;
  enableBlurUp: boolean;
  blurDataURL?: string;
}

/**
 * Image source configuration
 */
export interface ImageSource {
  src: string;
  srcSet?: string;
  sizes?: string;
  type?: string;
  media?: string;
}

/**
 * Image optimizer props
 */
export interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  config?: Partial<ImageOptimizationConfig>;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  ariaLabel?: string;
  loading?: 'lazy' | 'eager' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * Image loading state
 */
export interface ImageLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  progress: number;
  currentSrc: string;
  currentFormat: ImageFormat;
  loadTime?: number;
  error?: Error;
}

/**
 * CDN image transformation parameters
 */
interface CdnTransformParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  progressive?: boolean;
  blur?: number;
}

/**
 * Image Optimizer Component
 * Provides comprehensive image optimization with modern formats and adaptive loading
 * 
 * @example
 * ```tsx
 * const config: ImageOptimizationConfig = {
 *   formats: ['avif', 'webp', 'jpeg'],
 *   quality: 85,
 *   breakpoints: [640, 768, 1024, 1280],
 *   enableAdaptiveLoading: true,
 *   cdnUrl: 'https://cdn.example.com',
 * };
 * 
 * <ImageOptimizer
 *   src="/images/photo.jpg"
 *   alt="Optimized photo"
 *   width={800}
 *   height={600}
 *   config={config}
 *   enableZoom={true}
 * />
 * ```
 */
export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  config = {},
  className,
  style,
  onLoad,
  onError,
  onProgress,
  placeholder,
  errorFallback,
  enableZoom = false,
  enableFullscreen = false,
  ariaLabel,
  loading = 'auto',
  decoding = 'async',
}) => {
  const { isMobile, isTouch, device, viewport } = useResponsive();
  const { performanceMetrics } = usePerformanceMonitor();
  const { preloadImage, isImageCached } = useImagePreloader();
  
  // State management
  const [loadingState, setLoadingState] = useState<ImageLoadingState>({
    isLoading: true,
    isLoaded: false,
    isError: false,
    progress: 0,
    currentSrc: '',
    currentFormat: 'jpeg',
  });

  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState({ x: 0, y: 0 });

  // Merge configuration with defaults
  const mergedConfig = useMemo<ImageOptimizationConfig>(() => ({
    formats: ['avif', 'webp', 'jpeg'],
    quality: 85,
    progressive: true,
    breakpoints: [640, 768, 1024, 1280, 1536],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    densities: [1, 2],
    enableAdaptiveLoading: true,
    enableNetworkAdaptation: true,
    enableBatteryOptimization: true,
    enablePreloading: false,
    enableLazyLoading: true,
    enableBlurUp: true,
    ...config,
  }), [config]);

  /**
   * Generate optimized image sources
   */
  const generateImageSources = useCallback((): ImageSource[] => {
    const sources: ImageSource[] = [];
    const formats = getSupportedFormats();
    
    // Generate sources for each format
    formats.forEach(format => {
      const srcSet = generateSrcSet(format);
      const type = getMimeType(format);
      
      sources.push({
        srcSet,
        type,
        media: getMediaQuery(format),
      });
    });

    return sources;
  }, [mergedConfig, isMobile, viewport]);

  /**
   * Get supported image formats
   */
  const getSupportedFormats = useCallback((): ImageFormat[] => {
    const formats = [...mergedConfig.formats];
    
    // Adapt to network conditions
    if (mergedConfig.enableNetworkAdaptation) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          // Prefer smaller formats on slow connections
          return formats.filter(f => f === 'webp' || f === 'jpeg');
        }
      }
    }
    
    // Adapt to device capabilities
    if (mergedConfig.enableBatteryOptimization && device.isMobile) {
      // Remove heavy formats on mobile
      return formats.filter(f => f !== 'avif' || supportsAvif());
    }
    
    return formats;
  }, [mergedConfig, device]);

  /**
   * Generate srcSet for responsive images
   */
  const generateSrcSet = useCallback((format: ImageFormat): string => {
    const sources: string[] = [];
    const { breakpoints, densities, cdnUrl, quality } = mergedConfig;
    
    breakpoints.forEach(breakpoint => {
      densities.forEach(density => {
        const width = Math.min(breakpoint, viewport.width);
        const height = width * (height ? height / width : 0.75);
        
        const params: CdnTransformParams = {
          width: width * density,
          height: height * density,
          quality,
          format,
          progressive: mergedConfig.progressive,
        };
        
        const url = buildImageUrl(src, params, cdnUrl);
        sources.push(`${url} ${width}w`);
      });
    });
    
    return sources.join(', ');
  }, [mergedConfig, viewport, src, height]);

  /**
   * Build optimized image URL
   */
  const buildImageUrl = useCallback((src: string, params: CdnTransformParams, cdnUrl?: string): string => {
    if (!cdnUrl) return src;
    
    const searchParams = new URLSearchParams();
    
    if (params.width) searchParams.set('w', params.width.toString());
    if (params.height) searchParams.set('h', params.height.toString());
    if (params.quality) searchParams.set('q', params.quality.toString());
    if (params.format) searchParams.set('f', params.format);
    if (params.progressive) searchParams.set('fl', 'progressive');
    if (params.blur) searchParams.set('blur', params.blur.toString());
    
    // Add custom CDN parameters
    if (mergedConfig.cdnParams) {
      Object.entries(mergedConfig.cdnParams).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }
    
    return `${cdnUrl}${src}?${searchParams.toString()}`;
  }, [mergedConfig]);

  /**
   * Load image with progressive enhancement
   */
  const loadImage = useCallback(async (): Promise<void> => {
    if (disabled) return;
    
    setLoadingState(prev => ({ ...prev, isLoading: true, isError: false }));
    
    try {
      const sources = generateImageSources();
      const bestSource = selectBestSource(sources);
      
      if (!bestSource) {
        throw new Error('No suitable image source found');
      }
      
      // Start loading
      const loadStartTime = performance.now();
      
      // Load with progress tracking
      await loadImageWithProgress(bestSource);
      
      const loadTime = performance.now() - loadStartTime;
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        loadTime,
        currentSrc: bestSource.srcSet || src,
        currentFormat: extractFormatFromSource(bestSource),
      }));
      
      onLoad?.();
      
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error as Error,
      }));
      
      onError?.(error as Error);
    }
  }, [disabled, generateImageSources, src, onLoad, onError]);

  /**
   * Select best image source based on conditions
   */
  const selectBestSource = useCallback((sources: ImageSource[]): ImageSource | null => {
    // Prioritize based on format support
    const supportedSources = sources.filter(source => {
      if (!source.type) return true;
      return supportsFormat(source.type as ImageFormat);
    });
    
    if (supportedSources.length === 0) return null;
    
    // Select based on viewport size
    const appropriateSource = supportedSources.find(source => {
      if (!source.media) return true;
      return window.matchMedia(source.media).matches;
    }) || supportedSources[supportedSources.length - 1];
    
    return appropriateSource;
  }, []);

  /**
   * Load image with progress tracking
   */
  const loadImageWithProgress = useCallback(async (source: ImageSource): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Progress tracking
      let loadedBytes = 0;
      let totalBytes = 0;
      
      img.onload = () => {
        setLoadingState(prev => ({ ...prev, progress: 100 }));
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${source.srcSet || src}`));
      };
      
      img.onprogress = (e) => {
        if (e.lengthComputable) {
          loadedBytes = e.loaded;
          totalBytes = e.total;
          const progress = Math.round((loadedBytes / totalBytes) * 100);
          setLoadingState(prev => ({ ...prev, progress }));
          onProgress?.(progress);
        }
      };
      
      // Set image source
      img.src = source.srcSet || src;
      img.srcset = source.srcSet || '';
      img.sizes = source.sizes || '';
      
      // Trigger load
      if (img.complete) {
        resolve();
      }
    });
  }, [src, onProgress]);

  /**
   * Handle zoom functionality
   */
  const handleZoom = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTransformOrigin({ x, y });
    setIsZoomed(!isZoomed);
  }, [enableZoom, isZoomed]);

  /**
   * Handle fullscreen functionality
   */
  const handleFullscreen = useCallback(async () => {
    if (!enableFullscreen) return;
    
    const element = document.documentElement;
    
    if (!document.fullscreenElement) {
      try {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  }, [enableFullscreen]);

  /**
   * Check format support
   */
  const supportsFormat = useCallback((format: ImageFormat): boolean => {
    if (format === 'webp') return supportsWebP();
    if (format === 'avif') return supportsAvif();
    return true;
  }, []);

  /**
   * Check WebP support
   */
  const supportsWebP = useCallback((): boolean => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);

  /**
   * Check AVIF support
   */
  const supportsAvif = useCallback((): boolean => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }, []);

  /**
   * Get MIME type for format
   */
  const getMimeType = useCallback((format: ImageFormat): string => {
    const mimeTypes: Record<ImageFormat, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };
    return mimeTypes[format];
  }, []);

  /**
   * Get media query for format
   */
  const getMediaQuery = useCallback((format: ImageFormat): string => {
    if (format === 'avif' && !supportsAvif()) return 'not all';
    if (format === 'webp' && !supportsWebP()) return 'not all';
    return '';
  }, [supportsAvif, supportsWebP]);

  /**
   * Extract format from source
   */
  const extractFormatFromSource = useCallback((source: ImageSource): ImageFormat => {
    if (!source.type) return 'jpeg';
    return source.type.split('/')[1] as ImageFormat;
  }, []);

  /**
   * Load image on mount or when conditions change
   */
  useEffect(() => {
    if (loading === 'eager' || (loading === 'auto' && isIntersecting)) {
      loadImage();
    }
  }, [loading, isIntersecting, loadImage]);

  /**
   * Preload image if enabled
   */
  useEffect(() => {
    if (mergedConfig.enablePreloading && !loadingState.isLoaded) {
      preloadImage(src);
    }
  }, [src, mergedConfig.enablePreloading, preloadImage, loadingState.isLoaded]);

  const baseClasses = clsx(
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
    {
      'cursor-zoom-in': enableZoom,
      'cursor-pointer': enableFullscreen,
    },
    className
  );

  return (
    <div className={baseClasses} style={style}>
      {/* Image sources for browser optimization */}
      <picture>
        {generateImageSources().map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            type={source.type}
            media={source.media}
          />
        ))}
        
        {/* Fallback image */}
        <img
          src={loadingState.currentSrc || src}
          alt={alt}
          width={width}
          height={height}
          className={clsx(
            'w-full h-full object-cover',
            'transition-opacity duration-300',
            {
              'opacity-0': loadingState.isLoading,
              'opacity-100': loadingState.isLoaded,
            }
          )}
          loading={loading}
          decoding={decoding}
          onClick={handleZoom}
          onDoubleClick={handleFullscreen}
          aria-label={ariaLabel || alt}
        />
      </picture>
      
      {/* Loading placeholder */}
      {loadingState.isLoading && placeholder && (
        <div className="absolute inset-0">
          {typeof placeholder === 'function' ? placeholder(loadingState) : placeholder}
        </div>
      )}
      
      {/* Error fallback */}
      {loadingState.isError && errorFallback && (
        <div className="absolute inset-0">
          {typeof errorFallback === 'function' ? errorFallback(loadingState.error!) : errorFallback}
        </div>
      )}
      
      {/* Progress indicator */}
      {loadingState.isLoading && loadingState.progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${loadingState.progress}%` }}
          />
        </div>
      )}
      
      {/* Zoom overlay */}
      {enableZoom && isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={loadingState.currentSrc || src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(2)`,
              transformOrigin: `${transformOrigin.x}% ${transformOrigin.y}%`,
            }}
          />
        </div>
      )}
      
      {/* Fullscreen controls */}
      {enableFullscreen && (
        <button
          onClick={handleFullscreen}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      )}
    </div>
  );
};

/**
 * Image gallery component with optimization
 */
export const ImageGallery: React.FC<{
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  config?: Partial<ImageOptimizationConfig>;
  className?: string;
}> = ({ images, config = {}, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className={clsx('relative', className)}>
      <div className="flex overflow-x-auto space-x-4">
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0 w-80">
            <ImageOptimizer
              {...image}
              config={config}
              enableZoom={true}
              enableFullscreen={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageOptimizer;
