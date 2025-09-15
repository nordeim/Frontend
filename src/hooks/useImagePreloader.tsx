// src/hooks/useImagePreloader.tsx
/**
 * Image Preloader Hook
 * Advanced image preloading with progress tracking, priority queues,
 * and performance optimization for enterprise applications
 * @module hooks/useImagePreloader
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Image preload configuration
 */
export interface ImagePreloadConfig {
  concurrency: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableWebP: boolean;
  enableAVIF: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Image preload state
 */
export interface ImagePreloadState {
  isLoaded: boolean;
  isLoading: boolean;
  isError: boolean;
  loadProgress: number;
  loadTime: number;
  retryCount: number;
  error?: Error;
}

/**
 * Image preload item
 */
export interface ImagePreloadItem {
  id: string;
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  fallbackSrc: string;
  alt: string;
  config?: Partial<ImagePreloadConfig>;
  state: ImagePreloadState;
  callbacks?: {
    onLoad?: (img: HTMLImageElement) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: number) => void;
  };
}

/**
 * Image preloader return type
 */
export interface UseImagePreloaderReturn {
  preloadImage: (item: Omit<ImagePreloadItem, 'state' | 'id'>) => Promise<HTMLImageElement>;
  preloadImages: (items: Omit<ImagePreloadItem, 'state' | 'id'>[]) => Promise<HTMLImageElement[]>;
  getImageState: (src: string) => ImagePreloadState | undefined;
  getLoadingProgress: () => number;
  cancelPreload: (src: string) => void;
  cancelAllPreloads: () => void;
  isSupported: (format: 'webp' | 'avif') => boolean;
  preloadedImages: Map<string, HTMLImageElement>;
  loadingQueue: ImagePreloadItem[];
  loadingProgress: number;
}

/**
 * Image preloader hook
 * Provides advanced image preloading with format support and progress tracking
 * 
 * @example
 * ```tsx
 * const { preloadImage, getImageState, isSupported } = useImagePreloader({
 *   concurrency: 4,
 *   enableWebP: true,
 *   enableAVIF: true,
 * });
 * 
 * const handleImageLoad = async () => {
 *   const img = await preloadImage({
 *     src: 'image.jpg',
 *     webpSrc: 'image.webp',
 *     avifSrc: 'image.avif',
 *     fallbackSrc: 'image.jpg',
 *     alt: 'Description',
 *   });
 * };
 * ```
 */
export function useImagePreloader(
  config: Partial<ImagePreloadConfig> = {}
): UseImagePreloaderReturn {
  const [preloadedImages, setPreloadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [loadingQueue, setLoadingQueue] = useState<ImagePreloadItem[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Configuration with defaults
  const mergedConfig = useRef<ImagePreloadConfig>({
    concurrency: 4,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableWebP: true,
    enableAVIF: true,
    priority: 'medium',
    crossOrigin: undefined,
    ...config,
  });

  // Active loading management
  const activeLoadsRef = useRef<Map<string, Promise<HTMLImageElement>>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const loadStartTimesRef = useRef<Map<string, number>>(new Map());

  /**
   * Check if image format is supported
   */
  const isSupported = useCallback((format: 'webp' | 'avif'): boolean => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    if (format === 'webp') {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    if (format === 'avif') {
      // AVIF support detection is more complex and may not be reliable
      return 'createImageBitmap' in window && 'avif' in createImageBitmap;
    }
    
    return false;
  }, []);

  /**
   * Get optimal image source based on browser support
   */
  const getOptimalImageSource = useCallback((item: Omit<ImagePreloadItem, 'state' | 'id'>): string => {
    const { src, webpSrc, avifSrc, fallbackSrc } = item;
    
    // Try AVIF first if enabled and supported
    if (mergedConfig.current.enableAVIF && avifSrc && isSupported('avif')) {
      return avifSrc;
    }
    
    // Try WebP second if enabled and supported
    if (mergedConfig.current.enableWebP && webpSrc && isSupported('webp')) {
      return webpSrc;
    }
    
    // Fall back to original source
    return src || fallbackSrc;
  }, [isSupported]);

  /**
   * Create image element with proper configuration
   */
  const createImageElement = useCallback((item: Omit<ImagePreloadItem, 'state' | 'id'>): HTMLImageElement => {
    const img = new Image();
    
    // Set cross-origin if specified
    if (mergedConfig.current.crossOrigin) {
      img.crossOrigin = mergedConfig.current.crossOrigin;
    }
    
    // Set decoding attribute for better performance
    img.decoding = 'async';
    
    // Set loading attribute
    img.loading = 'eager'; // Since we're preloading
    
    // Set alt text
    img.alt = item.alt || '';
    
    return img;
  }, [mergedConfig.current.crossOrigin]);

  /**
   * Load single image with retry logic
   */
  const loadImage = useCallback(async (item: ImagePreloadItem): Promise<HTMLImageElement> => {
    const { id, src, webpSrc, avifSrc, fallbackSrc, callbacks, config: itemConfig } = item;
    const finalConfig = { ...mergedConfig.current, ...itemConfig };
    
    // Check if already loaded
    if (preloadedImages.has(src)) {
      return preloadedImages.get(src)!;
    }
    
    // Check if already loading
    if (activeLoadsRef.current.has(src)) {
      return activeLoadsRef.current.get(src)!;
    }
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllersRef.current.set(src, abortController);
    
    // Record start time
    loadStartTimesRef.current.set(src, performance.now());
    
    // Create loading promise
    const loadPromise = (async (): Promise<HTMLImageElement> => {
      let attempts = 0;
      let lastError: Error | null = null;
      
      while (attempts <= finalConfig.retryAttempts) {
        if (abortController.signal.aborted) {
          throw new Error('Image loading aborted');
        }
        
        try {
          const optimalSrc = getOptimalImageSource(item);
          const img = createImageElement(item);
          
          // Create loading promise
          const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Image loading timeout: ${finalConfig.timeout}ms`));
            }, finalConfig.timeout);
            
            img.onload = () => {
              clearTimeout(timeoutId);
              
              // Calculate load time
              const loadStartTime = loadStartTimesRef.current.get(src);
              const loadTime = loadStartTime ? performance.now() - loadStartTime : 0;
              
              // Update progress
              updateLoadingProgress();
              
              // Store preloaded image
              setPreloadedImages(prev => new Map(prev).set(src, img));
              
              // Call success callback
              callbacks?.onLoad?.(img);
              
              resolve(img);
            };
            
            img.onerror = (error) => {
              clearTimeout(timeoutId);
              const errorMessage = `Failed to load image: ${optimalSrc}`;
              const errorObj = new Error(errorMessage);
              
              callbacks?.onError?.(errorObj);
              reject(errorObj);
            };
            
            // Set image source
            img.src = optimalSrc;
          });
          
          return await loadPromise;
          
        } catch (error) {
          lastError = error as Error;
          attempts++;
          
          if (attempts <= finalConfig.retryAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          }
        }
      }
      
      throw lastError || new Error(`Failed to load image after ${finalConfig.retryAttempts} attempts`);
    })();
    
    // Store active load
    activeLoadsRef.current.set(src, loadPromise);
    
    try {
      const result = await loadPromise;
      return result;
    } finally {
      // Cleanup
      activeLoadsRef.current.delete(src);
      abortControllersRef.current.delete(src);
      loadStartTimesRef.current.delete(src);
    }
  }, [preloadedImages, getOptimalImageSource, createImageElement, updateLoadingProgress]);

  /**
   * Update loading progress
   */
  const updateLoadingProgress = useCallback(() => {
    const totalQueue = loadingQueue.length;
    const completedLoads = preloadedImages.size;
    const activeLoads = activeLoadsRef.current.size;
    
    const progress = totalQueue > 0 ? (completedLoads / (totalQueue + activeLoads)) * 100 : 0;
    setLoadingProgress(Math.min(100, Math.max(0, progress)));
  }, [loadingQueue.length, preloadedImages.size]);

  /**
   * Preload single image
   */
  const preloadImage = useCallback(async (item: Omit<ImagePreloadItem, 'state' | 'id'>): Promise<HTMLImageElement> => {
    const id = `img-${Math.random().toString(36).substr(2, 9)}`;
    const imageItem: ImagePreloadItem = {
      ...item,
      id,
      state: {
        isLoaded: false,
        isLoading: true,
        isError: false,
        loadProgress: 0,
        loadTime: 0,
        retryCount: 0,
      },
    };
    
    // Add to loading queue
    setLoadingQueue(prev => [...prev, imageItem]);
    
    try {
      const img = await loadImage(imageItem);
      
      // Update item state
      setLoadingQueue(prev => prev.map(item => 
        item.id === id 
          ? { ...item, state: { ...item.state, isLoaded: true, isLoading: false } }
          : item
      ));
      
      return img;
    } catch (error) {
      // Update item state with error
      setLoadingQueue(prev => prev.map(item => 
        item.id === id 
          ? { ...item, state: { ...item.state, isError: true, isLoading: false, error: error as Error } }
          : item
      ));
      
      throw error;
    }
  }, [loadImage]);

  /**
   * Preload multiple images
   */
  const preloadImages = useCallback(async (items: Omit<ImagePreloadItem, 'state' | 'id'>[]): Promise<HTMLImageElement[]> => {
    // Sort by priority
    const sortedItems = [...items].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = a.config?.priority || mergedConfig.current.priority;
      const bPriority = b.config?.priority || mergedConfig.current.priority;
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });
    
    // Limit concurrent loads based on configuration
    const concurrency = mergedConfig.current.concurrency;
    const results: HTMLImageElement[] = [];
    
    // Process in batches
    for (let i = 0; i < sortedItems.length; i += concurrency) {
      const batch = sortedItems.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(item => preloadImage(item))
      );
      
      // Collect successful results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }
    
    return results;
  }, [preloadImage, mergedConfig.current.concurrency, mergedConfig.current.priority]);

  /**
   * Get image preload state
   */
  const getImageState = useCallback((src: string): ImagePreloadState | undefined => {
    const item = loadingQueue.find(item => item.src === src);
    return item?.state;
  }, [loadingQueue]);

  /**
   * Get overall loading progress
   */
  const getLoadingProgress = useCallback((): number => {
    return loadingProgress;
  }, [loadingProgress]);

  /**
   * Cancel specific image preload
   */
  const cancelPreload = useCallback((src: string) => {
    const abortController = abortControllersRef.current.get(src);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(src);
    }
    
    const loadPromise = activeLoadsRef.current.get(src);
    if (loadPromise) {
      activeLoadsRef.current.delete(src);
    }
    
    // Remove from loading queue
    setLoadingQueue(prev => prev.filter(item => item.src !== src));
  }, []);

  /**
   * Cancel all image preloads
   */
  const cancelAllPreloads = useCallback(() => {
    // Abort all active loads
    abortControllersRef.current.forEach((controller, src) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    
    // Clear active loads
    activeLoadsRef.current.clear();
    
    // Clear loading queue
    setLoadingQueue([]);
    setLoadingProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllPreloads();
    };
  }, [cancelAllPreloads]);

  return {
    preloadImage,
    preloadImages,
    getImageState,
    getLoadingProgress,
    cancelPreload,
    cancelAllPreloads,
    isSupported,
    preloadedImages,
    loadingQueue,
    loadingProgress,
  };
}

export default useImagePreloader;
