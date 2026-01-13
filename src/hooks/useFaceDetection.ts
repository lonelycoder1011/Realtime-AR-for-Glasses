import { useState, useRef, useCallback, useEffect } from 'react';
import { FaceDetectionState, FaceDetectionResult, FaceDetectionConfig, MediaPipeResults } from '@/types/face-detection';
import { extractFaceFeatures, smoothLandmarks, validateFaceDetection } from '@/lib/mediapipe/face-mesh-utils';
import { APP_CONFIG } from '@/lib/config';

// MediaPipe imports - proper import structure
import type { FaceMesh, Results } from '@mediapipe/face_mesh';

const initialState: FaceDetectionState = {
  isInitialized: false,
  isProcessing: false,
  lastDetection: null,
  error: null,
  frameCount: 0,
  fps: 0,
  detectionHistory: [],
};

const defaultConfig: FaceDetectionConfig = {
  maxNumFaces: APP_CONFIG.mediapipe.maxNumFaces,
  refineLandmarks: APP_CONFIG.mediapipe.refineLandmarks,
  minDetectionConfidence: APP_CONFIG.mediapipe.minDetectionConfidence,
  minTrackingConfidence: APP_CONFIG.mediapipe.minTrackingConfidence,
  smoothingFactor: APP_CONFIG.ar.smoothingFactor,
  maxHistorySize: 5,
};

export const useFaceDetection = (config: Partial<FaceDetectionConfig> = {}) => {
  const [state, setState] = useState<FaceDetectionState>(initialState);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const lastStateUpdateRef = useRef(Date.now());
  const stateUpdateIntervalMs = 500; // Update React state every 500ms max to prevent infinite loops
  const configRef = useRef({ ...defaultConfig, ...config });
  const lastDetectionRef = useRef<FaceDetectionResult | null>(null);
  const detectionHistoryRef = useRef<FaceDetectionResult[]>([]);

  const processResults = useCallback((results: Results) => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTimeRef.current;
    
    frameCountRef.current++;
    lastFrameTimeRef.current = currentTime;

    try {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        lastDetectionRef.current = null;
        return;
      }

      // Process the first detected face
      const faceLandmarks = results.multiFaceLandmarks[0];
      if (!faceLandmarks) {
        return;
      }

      // Convert MediaPipe landmarks to our format
      const landmarks = faceLandmarks.map((landmark: any) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z || 0,
      }));

      // Apply smoothing if we have previous landmarks
      const smoothedLandmarks = smoothLandmarks(
        landmarks,
        lastDetectionRef.current?.landmarks || null,
        configRef.current.smoothingFactor
      );

      // Extract face features
      const faceFeatures = extractFaceFeatures(smoothedLandmarks);
      
      // Create detection result with confidence (simplified for now)
      const detectionResult: FaceDetectionResult = {
        ...faceFeatures,
        confidence: 0.9, // MediaPipe doesn't provide direct confidence, using high value
      };

      // Validate detection quality
      const isValid = validateFaceDetection(detectionResult);
      
      if (isValid) {
        lastDetectionRef.current = detectionResult;
        
        // Update history in ref
        detectionHistoryRef.current.push(detectionResult);
        if (detectionHistoryRef.current.length > configRef.current.maxHistorySize) {
          detectionHistoryRef.current.shift();
        }
        
        // Throttle React state updates by time instead of frame count
        const now = Date.now();
        if (now - lastStateUpdateRef.current > stateUpdateIntervalMs) {
          lastStateUpdateRef.current = now;
          const fps = Math.round(1000 / Math.max(deltaTime, 1));
          setState(prev => ({
            ...prev,
            isProcessing: false,
            lastDetection: detectionResult,
            detectionHistory: [...detectionHistoryRef.current],
            frameCount: frameCountRef.current,
            fps,
            error: null,
          }));
        }
      } else {
        lastDetectionRef.current = null;
      }
    } catch (error) {
      console.error('Face detection processing error:', error);
    }
  }, []);

  const initializeFaceMesh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitialized: false, error: null }));

      // Dynamic import to avoid SSR issues
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: configRef.current.maxNumFaces,
        refineLandmarks: configRef.current.refineLandmarks,
        minDetectionConfidence: configRef.current.minDetectionConfidence,
        minTrackingConfidence: configRef.current.minTrackingConfidence,
      });

      faceMesh.onResults(processResults);
      faceMeshRef.current = faceMesh;

      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        error: null,
      }));

    } catch (error) {
      console.error('Failed to initialize FaceMesh:', error);
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: 'Failed to initialize face detection',
      }));
    }
  }, [processResults]);

  const processFrame = useCallback(async () => {
    if (faceMeshRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      try {
        await faceMeshRef.current.send({ image: videoRef.current });
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    }
    
    if (animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!faceMeshRef.current) {
      await initializeFaceMesh();
    }

    if (!faceMeshRef.current) {
      throw new Error('FaceMesh not initialized');
    }

    try {
      videoRef.current = videoElement;
      
      // Start frame processing loop
      animationFrameRef.current = requestAnimationFrame(processFrame);

      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      console.error('Failed to start face detection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start face detection',
      }));
      throw error;
    }
  }, [initializeFaceMesh, processFrame]);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    videoRef.current = null;
    frameCountRef.current = 0;

    setState(prev => ({
      ...prev,
      isProcessing: false,
      lastDetection: null,
      frameCount: 0,
      fps: 0,
    }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<FaceDetectionConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
    
    if (faceMeshRef.current) {
      faceMeshRef.current.setOptions({
        maxNumFaces: configRef.current.maxNumFaces,
        refineLandmarks: configRef.current.refineLandmarks,
        minDetectionConfidence: configRef.current.minDetectionConfidence,
        minTrackingConfidence: configRef.current.minTrackingConfidence,
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [stopDetection]);

  // Initialize on mount
  useEffect(() => {
    initializeFaceMesh();
  }, [initializeFaceMesh]);

  return {
    state,
    startDetection,
    stopDetection,
    updateConfig,
    isReady: state.isInitialized && !state.error,
  };
};
