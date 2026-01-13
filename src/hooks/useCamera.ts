import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraState, CameraDevice, CameraConstraints, CameraError, CameraErrorInfo } from '@/types/camera';
import { APP_CONFIG } from '@/lib/config';

const initialState: CameraState = {
  isActive: false,
  isLoading: false,
  stream: null,
  error: null,
  devices: [],
  selectedDeviceId: null,
  constraints: {
    width: APP_CONFIG.camera.defaultWidth,
    height: APP_CONFIG.camera.defaultHeight,
    frameRate: APP_CONFIG.camera.frameRate,
    facingMode: APP_CONFIG.camera.facingMode,
  },
  hasPermission: false,
  permissionState: 'unknown',
};

export const useCamera = () => {
  const [state, setState] = useState<CameraState>(initialState);
  const streamRef = useRef<MediaStream | null>(null);
  const selectedDeviceIdRef = useRef<string | null>(null);
  
  // Keep ref in sync with state
  selectedDeviceIdRef.current = state.selectedDeviceId;

  const createCameraError = (error: unknown): CameraErrorInfo => {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return {
            type: 'PERMISSION_DENIED',
            message: 'Camera permission denied',
            details: 'Please allow camera access to use the AR try-on feature',
          };
        case 'NotFoundError':
          return {
            type: 'DEVICE_NOT_FOUND',
            message: 'No camera device found',
            details: 'Please ensure a camera is connected to your device',
          };
        case 'ConstraintNotSatisfiedError':
          return {
            type: 'CONSTRAINT_NOT_SATISFIED',
            message: 'Camera constraints not supported',
            details: 'Your camera does not support the required video quality',
          };
        case 'OverconstrainedError':
          return {
            type: 'OVERCONSTRAINED',
            message: 'Camera settings too restrictive',
            details: 'Please try with different camera settings',
          };
        default:
          return {
            type: 'UNKNOWN_ERROR',
            message: error.message || 'Unknown camera error',
            details: 'An unexpected error occurred while accessing the camera',
          };
      }
    }

    return {
      type: 'UNKNOWN_ERROR',
      message: 'Failed to access camera',
      details: 'An unexpected error occurred',
    };
  };

  const getAvailableDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device): device is MediaDeviceInfo & { kind: 'videoinput' } => 
          device.kind === 'videoinput'
        )
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
        }));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request basic camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Stop the temporary stream
      stream.getTracks().forEach(track => track.stop());

      // Get available devices after permission is granted
      const devices = await getAvailableDevices();
      
      // Auto-select HP camera first (priority order)
      // 1. Try HP camera specifically
      let selectedDevice = devices.find(d => 
        d.label.toLowerCase().includes('hp')
      );
      
      // 2. Try integrated webcam (not DroidCam)
      if (!selectedDevice) {
        selectedDevice = devices.find(d => 
          (d.label.toLowerCase().includes('integrated') || d.label.toLowerCase().includes('webcam')) &&
          !d.label.toLowerCase().includes('droid')
        );
      }
      
      // 3. Try any non-DroidCam device
      if (!selectedDevice) {
        selectedDevice = devices.find(d => !d.label.toLowerCase().includes('droid'));
      }
      
      // 4. Fallback to first device
      if (!selectedDevice && devices.length > 0) {
        selectedDevice = devices[0];
      }
      
      console.log('useCamera: Selected device:', selectedDevice?.label);

      setState(prev => ({
        ...prev,
        hasPermission: true,
        permissionState: 'granted',
        devices,
        selectedDeviceId: selectedDevice?.deviceId || null,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      const cameraError = createCameraError(error);
      setState(prev => ({
        ...prev,
        hasPermission: false,
        permissionState: 'denied',
        error: cameraError.message,
        isLoading: false,
      }));
      return false;
    }
  }, [getAvailableDevices]);

  const startCamera = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Use ref to get latest deviceId (avoids stale closure)
      const deviceId = selectedDeviceIdRef.current;
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: state.constraints.width },
          height: { ideal: state.constraints.height },
          frameRate: { ideal: state.constraints.frameRate },
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: state.constraints.facingMode }),
        },
        audio: false,
      };

      console.log('Starting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Log stream info
      const videoTrack = stream.getVideoTracks()[0];
      console.log('Camera started:', videoTrack.label);

      setState(prev => ({
        ...prev,
        isActive: true,
        isLoading: false,
        stream,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to start camera:', error);
      const cameraError = createCameraError(error);
      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
        stream: null,
        error: cameraError.message,
      }));
      throw error;
    }
  }, [state.constraints]);

  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      stream: null,
    }));
  }, []);

  const switchDevice = useCallback(async (deviceId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      selectedDeviceId: deviceId,
    }));

    if (state.isActive) {
      await startCamera();
    }
  }, [state.isActive, startCamera]);

  const updateConstraints = useCallback((newConstraints: Partial<CameraConstraints>): void => {
    setState(prev => ({
      ...prev,
      constraints: { ...prev.constraints, ...newConstraints },
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Check initial permission state
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((permission) => {
          setState(prev => ({
            ...prev,
            permissionState: permission.state,
            hasPermission: permission.state === 'granted',
          }));

          permission.addEventListener('change', () => {
            setState(prev => ({
              ...prev,
              permissionState: permission.state,
              hasPermission: permission.state === 'granted',
            }));
          });
        })
        .catch(() => {
          // Permissions API not supported
          setState(prev => ({ ...prev, permissionState: 'unknown' }));
        });
    }
  }, []);

  return {
    state,
    startCamera,
    stopCamera,
    switchDevice,
    requestPermission,
    updateConstraints,
  };
};
