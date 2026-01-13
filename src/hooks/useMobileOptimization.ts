import { useState, useRef, useCallback, useEffect } from 'react';
import { MobileCameraOptimizer, MobileDeviceInfo } from '@/lib/mobile/mobile-camera-optimizer';
import { TouchGestureHandler, GestureEvent } from '@/lib/mobile/touch-gesture-handler';
import { DeviceOrientationManager, OrientationData, MotionData } from '@/lib/mobile/device-orientation-manager';

interface UseMobileOptimizationOptions {
  enableCamera?: boolean;
  enableGestures?: boolean;
  enableOrientation?: boolean;
  autoInitialize?: boolean;
  gestureConfig?: any;
  cameraConfig?: any;
  orientationConfig?: any;
}

export const useMobileOptimization = (
  videoElement: HTMLVideoElement | null,
  gestureElement: HTMLElement | null,
  options: UseMobileOptimizationOptions = {}
) => {
  const {
    enableCamera = true,
    enableGestures = true,
    enableOrientation = true,
    autoInitialize = true,
    gestureConfig = {},
    cameraConfig = {},
    orientationConfig = {},
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentOrientation, setCurrentOrientation] = useState<OrientationData | null>(null);
  const [currentMotion, setCurrentMotion] = useState<MotionData | null>(null);
  const [isOrientationCalibrated, setIsOrientationCalibrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const cameraOptimizerRef = useRef<MobileCameraOptimizer | null>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler | null>(null);
  const orientationManagerRef = useRef<DeviceOrientationManager | null>(null);

  // Gesture callbacks
  const [gestureCallbacks, setGestureCallbacks] = useState<Map<string, (event: GestureEvent) => void>>(new Map());

  // Initialize mobile optimization systems
  useEffect(() => {
    if (!autoInitialize) return;

    initializeMobileOptimization();

    return () => {
      dispose();
    };
  }, [videoElement, gestureElement, autoInitialize]);

  // Initialize all mobile optimization systems
  const initializeMobileOptimization = useCallback(async () => {
    try {
      setError(null);

      // Initialize camera optimizer
      if (enableCamera && videoElement) {
        await initializeCamera();
      }

      // Initialize gesture handler
      if (enableGestures && gestureElement) {
        initializeGestures();
      }

      // Initialize orientation manager
      if (enableOrientation) {
        await initializeOrientation();
      }

      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mobile optimization initialization failed';
      setError(errorMessage);
      console.error('Mobile optimization initialization failed:', err);
    }
  }, [videoElement, gestureElement, enableCamera, enableGestures, enableOrientation]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoElement) return;

    try {
      cameraOptimizerRef.current = new MobileCameraOptimizer({
        preferredResolution: { width: 640, height: 480 },
        maxResolution: { width: 1280, height: 720 },
        frameRate: 30,
        facingMode: 'user',
        enableAutoFocus: true,
        optimizeForPerformance: true,
        ...cameraConfig,
      });

      const optimizer = cameraOptimizerRef.current;
      setDeviceInfo(optimizer.getDeviceInfo());

      const stream = await optimizer.initializeCamera(videoElement);
      setCameraStream(stream);

      return stream;
    } catch (err) {
      console.error('Camera initialization failed:', err);
      throw err;
    }
  }, [videoElement, cameraConfig]);

  // Initialize gestures
  const initializeGestures = useCallback(() => {
    if (!gestureElement) return;

    gestureHandlerRef.current = new TouchGestureHandler(gestureElement, {
      enablePinchZoom: true,
      enableSwipeGestures: true,
      enableTapGestures: true,
      enableRotationGestures: true,
      pinchSensitivity: 1.0,
      swipeSensitivity: 1.0,
      ...gestureConfig,
    });

    // Setup gesture callbacks
    gestureCallbacks.forEach((callback, gestureType) => {
      gestureHandlerRef.current?.on(gestureType, callback);
    });
  }, [gestureElement, gestureConfig, gestureCallbacks]);

  // Initialize orientation
  const initializeOrientation = useCallback(async () => {
    try {
      orientationManagerRef.current = new DeviceOrientationManager({
        enableOrientationTracking: true,
        enableMotionTracking: true,
        smoothingFactor: 0.8,
        autoCalibrate: true,
        ...orientationConfig,
      });

      const manager = orientationManagerRef.current;

      // Setup orientation callbacks
      manager.onOrientationChange((orientation) => {
        setCurrentOrientation(orientation);
      });

      manager.onMotionChange((motion) => {
        setCurrentMotion(motion);
      });

      const success = await manager.initialize();
      if (success) {
        // Auto-calibrate if enabled
        if (orientationConfig.autoCalibrate !== false) {
          await manager.calibrate();
          setIsOrientationCalibrated(true);
        }
      }

      return success;
    } catch (err) {
      console.error('Orientation initialization failed:', err);
      throw err;
    }
  }, [orientationConfig]);

  // Camera controls
  const switchCamera = useCallback(async () => {
    if (!cameraOptimizerRef.current) return null;

    try {
      const stream = await cameraOptimizerRef.current.switchCamera();
      setCameraStream(stream);
      return stream;
    } catch (err) {
      console.error('Camera switch failed:', err);
      throw err;
    }
  }, []);

  const setTorch = useCallback(async (enabled: boolean) => {
    if (!cameraOptimizerRef.current) return;

    try {
      await cameraOptimizerRef.current.setTorch(enabled);
    } catch (err) {
      console.warn('Torch control failed:', err);
    }
  }, []);

  const setZoom = useCallback(async (zoomLevel: number) => {
    if (!cameraOptimizerRef.current) return;

    try {
      await cameraOptimizerRef.current.setZoom(zoomLevel);
    } catch (err) {
      console.warn('Zoom control failed:', err);
    }
  }, []);

  const adjustCameraForPerformance = useCallback(async (targetFPS: number) => {
    if (!cameraOptimizerRef.current) return;

    try {
      await cameraOptimizerRef.current.adjustForPerformance(targetFPS);
    } catch (err) {
      console.warn('Camera performance adjustment failed:', err);
    }
  }, []);

  // Gesture controls
  const addGestureListener = useCallback((gestureType: string, callback: (event: GestureEvent) => void) => {
    setGestureCallbacks(prev => {
      const newCallbacks = new Map(prev);
      newCallbacks.set(gestureType, callback);
      return newCallbacks;
    });

    // Add to existing handler if available
    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.on(gestureType, callback);
    }
  }, []);

  const removeGestureListener = useCallback((gestureType: string) => {
    setGestureCallbacks(prev => {
      const newCallbacks = new Map(prev);
      newCallbacks.delete(gestureType);
      return newCallbacks;
    });

    // Remove from existing handler if available
    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.off(gestureType);
    }
  }, []);

  const isGestureActive = useCallback((gestureType: string): boolean => {
    return gestureHandlerRef.current?.isGestureActive(gestureType) || false;
  }, []);

  const getActiveTouchCount = useCallback((): number => {
    return gestureHandlerRef.current?.getActiveTouchCount() || 0;
  }, []);

  // Orientation controls
  const calibrateOrientation = useCallback(async () => {
    if (!orientationManagerRef.current) return;

    try {
      await orientationManagerRef.current.calibrate();
      setIsOrientationCalibrated(true);
    } catch (err) {
      console.error('Orientation calibration failed:', err);
      throw err;
    }
  }, []);

  const resetOrientationCalibration = useCallback(() => {
    if (!orientationManagerRef.current) return;

    orientationManagerRef.current.resetCalibration();
    setIsOrientationCalibrated(false);
  }, []);

  const getOrientationEulerAngles = useCallback(() => {
    if (!orientationManagerRef.current) return { x: 0, y: 0, z: 0 };

    return orientationManagerRef.current.toEulerAngles();
  }, []);

  const getTiltAngle = useCallback((): number => {
    if (!orientationManagerRef.current) return 0;

    return orientationManagerRef.current.getTiltAngle();
  }, []);

  const isDeviceStable = useCallback((threshold: number = 5): boolean => {
    if (!orientationManagerRef.current) return true;

    return orientationManagerRef.current.isDeviceStable(threshold);
  }, []);

  // Device information
  const getDeviceInfo = useCallback((): MobileDeviceInfo | null => {
    return deviceInfo;
  }, [deviceInfo]);

  const isMobileDevice = useCallback((): boolean => {
    return deviceInfo?.isMobile || false;
  }, [deviceInfo]);

  const isTabletDevice = useCallback((): boolean => {
    return deviceInfo?.isTablet || false;
  }, [deviceInfo]);

  const getScreenOrientation = useCallback(() => {
    return orientationManagerRef.current?.getScreenOrientation() || 'portrait';
  }, []);

  // Camera information
  const getCameraSettings = useCallback(() => {
    return cameraOptimizerRef.current?.getCameraSettings() || null;
  }, []);

  const getCameraCapabilities = useCallback(() => {
    return cameraOptimizerRef.current?.getCameraCapabilities() || null;
  }, []);

  const isCameraActive = useCallback((): boolean => {
    return cameraOptimizerRef.current?.isActive() || false;
  }, []);

  // Orientation information
  const getCalibrationStatus = useCallback(() => {
    return orientationManagerRef.current?.getCalibrationStatus() || null;
  }, []);

  const hasOrientationPermissions = useCallback((): boolean => {
    return orientationManagerRef.current?.hasPermissions() || false;
  }, []);

  // Performance optimization
  const optimizeForMobile = useCallback(() => {
    // Reduce camera quality for better performance
    if (cameraOptimizerRef.current) {
      cameraOptimizerRef.current.updateConfig({
        preferredResolution: { width: 480, height: 360 },
        frameRate: 24,
        optimizeForPerformance: true,
      });
    }

    // Reduce gesture sensitivity
    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.updateConfig({
        pinchSensitivity: 0.8,
        swipeSensitivity: 0.8,
      });
    }

    // Increase orientation smoothing
    if (orientationManagerRef.current) {
      orientationManagerRef.current.updateConfig({
        smoothingFactor: 0.9,
      });
    }
  }, []);

  const optimizeForTablet = useCallback(() => {
    // Higher quality for tablets
    if (cameraOptimizerRef.current) {
      cameraOptimizerRef.current.updateConfig({
        preferredResolution: { width: 720, height: 540 },
        frameRate: 30,
        optimizeForPerformance: false,
      });
    }

    // Normal gesture sensitivity
    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.updateConfig({
        pinchSensitivity: 1.0,
        swipeSensitivity: 1.0,
      });
    }

    // Normal orientation smoothing
    if (orientationManagerRef.current) {
      orientationManagerRef.current.updateConfig({
        smoothingFactor: 0.8,
      });
    }
  }, []);

  // Cleanup
  const dispose = useCallback(() => {
    if (cameraOptimizerRef.current) {
      cameraOptimizerRef.current.dispose();
      cameraOptimizerRef.current = null;
    }

    if (gestureHandlerRef.current) {
      gestureHandlerRef.current.dispose();
      gestureHandlerRef.current = null;
    }

    if (orientationManagerRef.current) {
      orientationManagerRef.current.dispose();
      orientationManagerRef.current = null;
    }

    setCameraStream(null);
    setCurrentOrientation(null);
    setCurrentMotion(null);
    setIsOrientationCalibrated(false);
    setIsInitialized(false);
  }, []);

  // Manual initialization
  const initialize = useCallback(async () => {
    await initializeMobileOptimization();
  }, [initializeMobileOptimization]);

  return {
    // State
    isInitialized,
    deviceInfo,
    cameraStream,
    currentOrientation,
    currentMotion,
    isOrientationCalibrated,
    error,

    // Camera controls
    switchCamera,
    setTorch,
    setZoom,
    adjustCameraForPerformance,

    // Gesture controls
    addGestureListener,
    removeGestureListener,
    isGestureActive,
    getActiveTouchCount,

    // Orientation controls
    calibrateOrientation,
    resetOrientationCalibration,
    getOrientationEulerAngles,
    getTiltAngle,
    isDeviceStable,

    // Information getters
    getDeviceInfo,
    isMobileDevice,
    isTabletDevice,
    getScreenOrientation,
    getCameraSettings,
    getCameraCapabilities,
    isCameraActive,
    getCalibrationStatus,
    hasOrientationPermissions,

    // Performance optimization
    optimizeForMobile,
    optimizeForTablet,

    // Lifecycle
    initialize,
    dispose,

    // Status
    isReady: isInitialized && !error,
    hasCamera: !!cameraStream,
    hasOrientation: !!currentOrientation,
  };
};
