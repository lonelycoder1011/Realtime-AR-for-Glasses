import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { EnhancedCoordinateMapper } from '@/lib/three/enhanced-coordinate-mapper';
import { FaceDetectionResult } from '@/types/face-detection';
import {
  HeadPose,
  FaceGeometry,
  GlassesAnchorPoints,
  CoordinateTransform,
  MappingQuality,
  CalibrationData,
} from '@/types/coordinate-mapping';

interface CoordinateMappingState {
  isInitialized: boolean;
  currentPose: HeadPose | null;
  faceGeometry: FaceGeometry | null;
  glassesAnchors: GlassesAnchorPoints | null;
  transform: CoordinateTransform | null;
  quality: MappingQuality | null;
  error: string | null;
}

interface UseEnhancedCoordinateMappingOptions {
  calibration?: Partial<CalibrationData>;
  smoothingEnabled?: boolean;
  qualityThreshold?: number;
}

export const useEnhancedCoordinateMapping = (
  camera: THREE.PerspectiveCamera | null,
  videoWidth: number,
  videoHeight: number,
  options: UseEnhancedCoordinateMappingOptions = {}
) => {
  const [state, setState] = useState<CoordinateMappingState>({
    isInitialized: false,
    currentPose: null,
    faceGeometry: null,
    glassesAnchors: null,
    transform: null,
    quality: null,
    error: null,
  });

  const mapperRef = useRef<EnhancedCoordinateMapper | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const stateUpdateIntervalMs = 200; // Only update React state every 200ms
  const lastResultRef = useRef<any>(null);
  const { calibration, smoothingEnabled = true, qualityThreshold = 0.7 } = options;

  // Initialize mapper when camera is available (only once)
  useEffect(() => {
    // Skip if already initialized or missing required params
    if (state.isInitialized || !camera || videoWidth <= 0 || videoHeight <= 0) {
      return;
    }
    
    try {
      mapperRef.current = new EnhancedCoordinateMapper(
        camera,
        videoWidth,
        videoHeight,
        calibration
      );

      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: `Failed to initialize coordinate mapper: ${error}`,
      }));
    }
    // Only run once when camera becomes available - don't include calibration as dep
  }, [camera, videoWidth, videoHeight, state.isInitialized]);

  // Update mapper dimensions when they change (skip state updates)
  useEffect(() => {
    if (mapperRef.current && camera && state.isInitialized) {
      mapperRef.current.updateDimensions(camera, videoWidth, videoHeight);
    }
  }, [videoWidth, videoHeight, state.isInitialized]);

  // Process face detection result - returns result immediately but throttles React state updates
  const processFaceDetection = useCallback((faceResult: FaceDetectionResult) => {
    if (!mapperRef.current || !state.isInitialized) {
      return null;
    }

    try {
      const result = mapperRef.current.mapFaceTo3D(faceResult);

      // Store result in ref for immediate access
      lastResultRef.current = result;

      // Check quality threshold
      if (result.quality.confidence < qualityThreshold) {
        // Only update state periodically for low quality warnings
        const now = Date.now();
        if (now - lastStateUpdateRef.current > stateUpdateIntervalMs) {
          lastStateUpdateRef.current = now;
          setState(prev => ({
            ...prev,
            quality: result.quality,
            error: 'Low tracking quality',
          }));
        }
        return null;
      }

      // Throttle React state updates to prevent infinite loops
      const now = Date.now();
      if (now - lastStateUpdateRef.current > stateUpdateIntervalMs) {
        lastStateUpdateRef.current = now;
        setState(prev => ({
          ...prev,
          currentPose: result.headPose,
          faceGeometry: result.faceGeometry,
          glassesAnchors: result.glassesAnchors,
          transform: result.transform,
          quality: result.quality,
          error: null,
        }));
      }

      // Always return result for immediate use (even if state wasn't updated)
      return result;
    } catch (error) {
      console.error('Coordinate mapping failed:', error);
      return null;
    }
  }, [state.isInitialized, qualityThreshold]);

  // Update calibration
  const updateCalibration = useCallback((newCalibration: Partial<CalibrationData>) => {
    if (mapperRef.current) {
      mapperRef.current.updateCalibration(newCalibration);
    }
  }, []);

  // Reset tracking
  const resetTracking = useCallback(() => {
    if (mapperRef.current) {
      mapperRef.current.reset();
      setState(prev => ({
        ...prev,
        currentPose: null,
        faceGeometry: null,
        glassesAnchors: null,
        transform: null,
        quality: null,
      }));
    }
  }, []);

  // Get pose history
  const getPoseHistory = useCallback(() => {
    if (!mapperRef.current) return [];
    return mapperRef.current.getPoseHistory();
  }, []);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldPosition: THREE.Vector3): { x: number; y: number } | null => {
    if (!camera) return null;

    const vector = worldPosition.clone();
    vector.project(camera);

    // Convert from NDC to screen coordinates
    const x = (vector.x + 1) / 2 * videoWidth;
    const y = (-vector.y + 1) / 2 * videoHeight;

    return { x, y };
  }, [camera, videoWidth, videoHeight]);

  // Convert screen coordinates to world ray
  const screenToWorldRay = useCallback((screenX: number, screenY: number): THREE.Ray | null => {
    if (!camera) return null;

    // Convert screen to NDC
    const x = (screenX / videoWidth) * 2 - 1;
    const y = -(screenY / videoHeight) * 2 + 1;

    // Create ray from camera through screen point
    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);

    const direction = vector.sub(camera.position).normalize();
    return new THREE.Ray(camera.position, direction);
  }, [camera, videoWidth, videoHeight]);

  return {
    state,
    processFaceDetection,
    updateCalibration,
    resetTracking,
    getPoseHistory,
    worldToScreen,
    screenToWorldRay,
    isReady: state.isInitialized && !state.error,
  };
};
