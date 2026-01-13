import { useState, useRef, useCallback, useEffect } from 'react';
import { GlassesPositioningEngine } from '@/lib/three/glasses-positioning-engine';
import { HeadPose, FaceGeometry, GlassesAnchorPoints } from '@/types/coordinate-mapping';
import {
  GlassesPositionState,
  PositioningConfig,
  PositioningQuality,
  PositioningAlgorithmType,
  POSITIONING_ALGORITHMS,
} from '@/types/glasses-positioning';

interface UseGlassesPositioningOptions {
  config?: Partial<PositioningConfig>;
  algorithm?: PositioningAlgorithmType;
  enabled?: boolean;
}

export const useGlassesPositioning = (options: UseGlassesPositioningOptions = {}) => {
  const { config, algorithm = POSITIONING_ALGORITHMS.HYBRID, enabled = true } = options;

  const [currentState, setCurrentState] = useState<GlassesPositionState | null>(null);
  const [quality, setQuality] = useState<PositioningQuality>({
    stability: 0,
    accuracy: 0,
    smoothness: 0,
    responsiveness: 0,
    overallScore: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<GlassesPositioningEngine | null>(null);
  const initializedRef = useRef(false);
  const algorithmRef = useRef(algorithm);

  // Initialize positioning engine only once
  useEffect(() => {
    if (initializedRef.current) return;
    
    try {
      engineRef.current = new GlassesPositioningEngine(config);
      engineRef.current.setAlgorithm(algorithm);
      initializedRef.current = true;
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(`Failed to initialize positioning engine: ${err}`);
      setIsInitialized(false);
    }
  }, []); // Empty deps - initialize only once

  // Update algorithm when it changes
  useEffect(() => {
    if (engineRef.current && algorithm !== algorithmRef.current) {
      algorithmRef.current = algorithm;
      engineRef.current.setAlgorithm(algorithm);
    }
  }, [algorithm]);

  // Track last state update time to prevent too frequent React updates
  const lastStateUpdateRef = useRef<number>(0);
  const stateUpdateIntervalMs = 100; // Update React state every 100ms max
  const currentStateRef = useRef<GlassesPositionState | null>(null);

  // Update position based on face detection
  const updatePosition = useCallback((
    headPose: HeadPose,
    faceGeometry: FaceGeometry,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number
  ): GlassesPositionState | null => {
    if (!engineRef.current || !enabled || !isInitialized) {
      return null;
    }

    try {
      const newState = engineRef.current.updatePosition(
        headPose,
        faceGeometry,
        glassesAnchors,
        confidence
      );

      // Store in ref for immediate access
      currentStateRef.current = newState;

      // Throttle React state updates to prevent infinite loops
      const now = Date.now();
      if (now - lastStateUpdateRef.current > stateUpdateIntervalMs) {
        lastStateUpdateRef.current = now;
        setCurrentState(newState);

        // Update quality metrics periodically
        if (Math.random() < 0.1) {
          const newQuality = engineRef.current.getPositioningQuality();
          setQuality(newQuality);
        }
      }

      return newState;
    } catch (err) {
      console.error(`Positioning update failed: ${err}`);
      return null;
    }
  }, [enabled, isInitialized]);

  // Set positioning algorithm
  const setAlgorithm = useCallback((newAlgorithm: PositioningAlgorithmType) => {
    if (!engineRef.current) return;

    try {
      engineRef.current.setAlgorithm(newAlgorithm);
      setError(null);
    } catch (err) {
      setError(`Failed to set algorithm: ${err}`);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<PositioningConfig>) => {
    if (!engineRef.current) return;

    try {
      engineRef.current.updateConfig(newConfig);
      setError(null);
    } catch (err) {
      setError(`Failed to update config: ${err}`);
    }
  }, []);

  // Get tracking history
  const getHistory = useCallback(() => {
    if (!engineRef.current) return null;
    return engineRef.current.getHistory();
  }, []);

  // Reset positioning
  const reset = useCallback(() => {
    if (!engineRef.current) return;

    try {
      // Reinitialize the engine
      engineRef.current = new GlassesPositioningEngine(config);
      engineRef.current.setAlgorithm(algorithm);
      setCurrentState(null);
      setQuality({
        stability: 0,
        accuracy: 0,
        smoothness: 0,
        responsiveness: 0,
        overallScore: 0,
      });
      setError(null);
    } catch (err) {
      setError(`Failed to reset positioning: ${err}`);
    }
  }, [config, algorithm]);

  return {
    currentState,
    quality,
    isInitialized,
    error,
    updatePosition,
    setAlgorithm,
    updateConfig,
    getHistory,
    reset,
    isEnabled: enabled && isInitialized && !error,
  };
};
