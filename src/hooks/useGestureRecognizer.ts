// src/hooks/useGestureRecognizer.ts
/**
 * Advanced Gesture Recognizer Hook
 * Provides complex gesture pattern recognition including shapes, symbols,
 * and multi-stroke gestures with machine learning-like pattern matching
 * @module hooks/useGestureRecognizer
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Gesture pattern point
 */
export interface GesturePoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

/**
 * Gesture pattern
 */
export interface GesturePattern {
  id: string;
  name: string;
  points: GesturePoint[];
  direction?: number;
  scale?: number;
  confidence: number;
}

/**
 * Recognized gesture result
 */
export interface RecognizedGesture {
  pattern: GesturePattern;
  confidence: number;
  score: number;
  matches: PatternMatch[];
}

/**
 * Pattern match information
 */
export interface PatternMatch {
  patternId: string;
  confidence: number;
  similarity: number;
  transformation: {
    scale: number;
    rotation: number;
    translation: { x: number; y: number };
  };
}

/**
 * Gesture recognizer configuration
 */
export interface GestureRecognizerConfig {
  minPoints: number;
  maxPoints: number;
  similarityThreshold: number;
  scaleTolerance: number;
  rotationTolerance: number;
  positionTolerance: number;
  smoothingFactor: number;
  normalizationSize: number;
}

/**
 * Default gesture patterns
 */
export const DEFAULT_PATTERNS: GesturePattern[] = [
  {
    id: 'checkmark',
    name: 'Checkmark',
    points: [
      { x: 0.2, y: 0.6, timestamp: 0 },
      { x: 0.4, y: 0.8, timestamp: 100 },
      { x: 0.8, y: 0.2, timestamp: 200 },
    ],
    confidence: 0.9,
  },
  {
    id: 'circle',
    name: 'Circle',
    points: [
      { x: 0.5, y: 0.1, timestamp: 0 },
      { x: 0.9, y: 0.5, timestamp: 250 },
      { x: 0.5, y: 0.9, timestamp: 500 },
      { x: 0.1, y: 0.5, timestamp: 750 },
      { x: 0.5, y: 0.1, timestamp: 1000 },
    ],
    confidence: 0.95,
  },
  {
    id: 'x-mark',
    name: 'X Mark',
    points: [
      { x: 0.2, y: 0.2, timestamp: 0 },
      { x: 0.8, y: 0.8, timestamp: 200 },
      { x: 0.8, y: 0.2, timestamp: 400 },
      { x: 0.2, y: 0.8, timestamp: 600 },
    ],
    confidence: 0.9,
  },
  {
    id: 'arrow-right',
    name: 'Right Arrow',
    points: [
      { x: 0.2, y: 0.5, timestamp: 0 },
      { x: 0.8, y: 0.5, timestamp: 200 },
      { x: 0.6, y: 0.3, timestamp: 300 },
      { x: 0.8, y: 0.5, timestamp: 400 },
      { x: 0.6, y: 0.7, timestamp: 500 },
    ],
    confidence: 0.85,
  },
];

/**
 * Default recognizer configuration
 */
const DEFAULT_CONFIG: GestureRecognizerConfig = {
  minPoints: 3,
  maxPoints: 100,
  similarityThreshold: 0.7,
  scaleTolerance: 0.3,
  rotationTolerance: 30,
  positionTolerance: 0.2,
  smoothingFactor: 0.8,
  normalizationSize: 100,
};

/**
 * Hook for advanced gesture pattern recognition
 * @param patterns - Custom gesture patterns to recognize
 * @param config - Recognition configuration
 * @returns Gesture recognition utilities and state
 * 
 * @example
 * ```tsx
 * const { startRecording, stopRecording, recognizedGesture } = useGestureRecognizer(
 *   customPatterns,
 *   { similarityThreshold: 0.8 }
 * );
 * 
 * return (
 *   <div 
 *     onMouseDown={startRecording}
 *     onMouseUp={stopRecording}
 *     onMouseMove={(e) => isRecording && addPoint({ x: e.clientX, y: e.clientY })}
 *   >
 *     {recognizedGesture && <div>Recognized: {recognizedGesture.pattern.name}</div>}
 *   </div>
 * );
 * ```
 */
export const useGestureRecognizer = (
  patterns: GesturePattern[] = DEFAULT_PATTERNS,
  config: Partial<GestureRecognizerConfig> = {}
) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State for gesture recognition
  const [isRecording, setIsRecording] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GesturePoint[]>([]);
  const [recognizedGesture, setRecognizedGesture] = useState<RecognizedGesture | null>(null);
  const [gestureHistory, setGestureHistory] = useState<RecognizedGesture[]>([]);
  
  // Refs for recording state
  const recordingStartRef = useRef<number>(0);
  const lastPointRef = useRef<GesturePoint | null>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Smooth gesture points using moving average
   */
  const smoothPoints = useCallback((points: GesturePoint[]): GesturePoint[] => {
    if (points.length < 3) return points;
    
    const smoothed: GesturePoint[] = [];
    const smoothingFactor = mergedConfig.smoothingFactor;
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      smoothed.push({
        x: prev.x * (1 - smoothingFactor) + curr.x * smoothingFactor,
        y: prev.y * (1 - smoothingFactor) + curr.y * smoothingFactor,
        timestamp: curr.timestamp,
        pressure: curr.pressure,
      });
    }
    
    return [points[0], ...smoothed, points[points.length - 1]];
  }, [mergedConfig.smoothingFactor]);

  /**
   * Normalize gesture points to standard size
   */
  const normalizePoints = useCallback((points: GesturePoint[]): GesturePoint[] => {
    if (points.length === 0) return [];
    
    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height) || 1;
    
    // Normalize to standard size
    return points.map(point => ({
      x: ((point.x - minX) / scale) * mergedConfig.normalizationSize,
      y: ((point.y - minY) / scale) * mergedConfig.normalizationSize,
      timestamp: point.timestamp - points[0].timestamp,
      pressure: point.pressure,
    }));
  }, [mergedConfig.normalizationSize]);

  /**
   * Resample gesture points to fixed number
   */
  const resamplePoints = useCallback((points: GesturePoint[], targetCount: number = 32): GesturePoint[] => {
    if (points.length <= targetCount) return points;
    
    const step = (points.length - 1) / (targetCount - 1);
    const resampled: GesturePoint[] = [];
    
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      resampled.push(points[index]);
    }
    
    return resampled;
  }, []);

  /**
   * Calculate gesture features (direction, scale, rotation)
   */
  const calculateFeatures = useCallback((points: GesturePoint[]) => {
    if (points.length < 2) return { direction: 0, scale: 1, rotation: 0 };
    
    const startVector = {
      x: points[1].x - points[0].x,
      y: points[1].y - points[0].y,
    };
    
    const endVector = {
      x: points[points.length - 1].x - points[points.length - 2].x,
      y: points[points.length - 1].y - points[points.length - 2].y,
    };
    
    const direction = Math.atan2(startVector.y, startVector.x) * 180 / Math.PI;
    const scale = Math.sqrt(endVector.x ** 2 + endVector.y ** 2) / 
                  Math.sqrt(startVector.x ** 2 + startVector.y ** 2) || 1;
    
    const rotation = Math.atan2(endVector.y, endVector.x) - Math.atan2(startVector.y, startVector.x);
    
    return {
      direction: direction * 180 / Math.PI,
      scale,
      rotation: rotation * 180 / Math.PI,
    };
  }, []);

  /**
   * Compare gesture with pattern using dynamic time warping (DTW)
   */
  const compareWithPattern = useCallback((gesture: GesturePoint[], pattern: GesturePoint[]): number => {
    const distanceMatrix: number[][] = Array.from({ length: gesture.length }, () => 
      Array(pattern.length).fill(Infinity)
    );
    
    for (let i = 0; i < gesture.length; i++) {
      for (let j = 0; j < pattern.length; j++) {
        const dx = gesture[i].x - pattern[j].x;
        const dy = gesture[i].y - pattern[j].y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        
        if (i === 0 && j === 0) {
          distanceMatrix[i][j] = distance;
        } else if (i === 0) {
          distanceMatrix[i][j] = distance + distanceMatrix[i][j - 1];
        } else if (j === 0) {
          distanceMatrix[i][j] = distance + distanceMatrix[i - 1][j];
        } else {
          distanceMatrix[i][j] = distance + Math.min(
            distanceMatrix[i - 1][j],    // Insertion
            distanceMatrix[i][j - 1],    // Deletion
            distanceMatrix[i - 1][j - 1] // Match
          );
        }
      }
    }
    
    return distanceMatrix[gesture.length - 1][pattern.length - 1];
  }, []);

  /**
   * Recognize gesture pattern
   */
  const recognizePattern = useCallback((gesture: GesturePoint[]): RecognizedGesture | null => {
    if (gesture.length < mergedConfig.minPoints) return null;
    
    const normalizedGesture = normalizePoints(smoothPoints(gesture));
    const resampledGesture = resamplePoints(normalizedGesture);
    
    const features = calculateFeatures(resampledGesture);
    
    let bestMatch: PatternMatch | null = null;
    let bestScore = Infinity;
    
    patterns.forEach(pattern => {
      const normalizedPattern = normalizePoints(smoothPoints(pattern.points));
      const resampledPattern = resamplePoints(normalizedPattern);
      
      const distance = compareWithPattern(resampledGesture, resampledPattern);
      const similarity = 1 - distance / (mergedConfig.normalizationSize * resampledGesture.length);
      
      if (similarity >= mergedConfig.similarityThreshold && similarity > bestScore) {
        bestMatch = {
          patternId: pattern.id,
          confidence: pattern.confidence,
          similarity,
          transformation: {
            scale: features.scale,
            rotation: features.rotation,
            translation: { x: 0, y: 0 },
          },
        };
        bestScore = similarity;
      }
    });
    
    if (!bestMatch) return null;
    
    return {
      pattern: patterns.find(p => p.id === bestMatch.patternId)!,
      confidence: bestMatch.confidence,
      score: bestScore,
      matches: [bestMatch],
    };
  }, [mergedConfig, normalizePoints, smoothPoints, resamplePoints, calculateFeatures, compareWithPattern]);

  /**
   * Start recording gesture
   */
  const startRecording = useCallback(() => {
    setIsRecording(true);
    recordingStartRef.current = Date.now();
    lastPointRef.current = null;
    setCurrentGesture([]);
    setRecognizedGesture(null);
  }, []);

  /**
   * Add point to current gesture
   */
  const addPoint = useCallback((point: GesturePoint) => {
    if (!isRecording) return;
    
    const now = Date.now();
    const timestamp = now - recordingStartRef.current;
    
    const newPoint = { ...point, timestamp };
    
    if (lastPointRef.current) {
      const dx = newPoint.x - lastPointRef.current.x;
      const dy = newPoint.y - lastPointRef.current.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);
      
      if (distance < 1) return; // Filter out close points
    }
    
    lastPointRef.current = newPoint;
    setCurrentGesture(prev => [...prev, newPoint]);
  }, [isRecording]);

  /**
   * Stop recording and recognize gesture
   */
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    if (currentGesture.length < mergedConfig.minPoints) {
      setRecognizedGesture(null);
      return;
    }
    
    const recognition = recognizePattern(currentGesture);
    setRecognizedGesture(recognition);
    
    // Add to history
    if (recognition) {
      setGestureHistory(prev => [...prev, recognition]);
    }
    
    // Reset state
    setCurrentGesture([]);
    lastPointRef.current = null;
  }, [currentGesture, mergedConfig.minPoints, recognizePattern]);

  /**
   * Clear gesture history
   */
  const clearHistory = useCallback(() => {
    setGestureHistory([]);
  }, []);

  /**
   * Get gesture history
   */
  const getGestureHistory = useCallback((limit: number = 10): RecognizedGesture[] => {
    return gestureHistory.slice(-limit);
  }, [gestureHistory]);

  /**
   * Set custom patterns
   */
  const setPatterns = useCallback((newPatterns: GesturePattern[]) => {
    patterns.length = 0;
    patterns.push(...newPatterns);
  }, []);

  /**
   * Add new pattern
   */
  const addPattern = useCallback((newPattern: GesturePattern) => {
    patterns.push(newPattern);
  }, []);

  /**
   * Remove pattern by ID
   */
  const removePattern = useCallback((patternId: string) => {
    const index = patterns.findIndex(p => p.id === patternId);
    if (index !== -1) {
      patterns.splice(index, 1);
    }
  }, []);

  return {
    isRecording,
    currentGesture,
    recognizedGesture,
    gestureHistory,
    
    startRecording,
    addPoint,
    stopRecording,
    clearHistory,
    getGestureHistory,
    setPatterns,
    addPattern,
    removePattern,
  };
};

// Default export
export default useGestureRecognizer;
