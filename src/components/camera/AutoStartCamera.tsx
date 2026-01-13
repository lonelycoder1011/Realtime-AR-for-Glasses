'use client';

import React, { useEffect, useRef } from 'react';
import { useCameraContext } from './CameraProvider';

interface AutoStartCameraProps {
  children: React.ReactNode;
}

export const AutoStartCamera: React.FC<AutoStartCameraProps> = ({ children }) => {
  const { state, startCamera, requestPermission } = useCameraContext();
  const hasInitializedRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Initial permission request
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const initializeCamera = async () => {
      try {
        console.log('AutoStartCamera: Requesting permission...');
        console.log('AutoStartCamera: Current state:', {
          isActive: state.isActive,
          isLoading: state.isLoading,
          hasPermission: state.hasPermission,
          selectedDeviceId: state.selectedDeviceId,
          error: state.error
        });
        
        const granted = await requestPermission();
        if (!granted) {
          console.log('AutoStartCamera: Permission denied');
        } else {
          console.log('AutoStartCamera: Permission granted, devices:', state.devices?.length || 0);
        }
      } catch (error) {
        console.error('AutoStartCamera: Failed to get permission:', error);
      }
    };

    // Auto-start camera after a short delay to ensure components are mounted
    const timer = setTimeout(initializeCamera, 500);
    return () => clearTimeout(timer);
  }, [requestPermission]);

  // Start camera when we have permission and a selected device
  useEffect(() => {
    console.log('AutoStartCamera: Start effect triggered:', {
      hasStarted: hasStartedRef.current,
      hasPermission: state.hasPermission,
      selectedDeviceId: state.selectedDeviceId,
      isActive: state.isActive,
      isLoading: state.isLoading
    });
    
    if (hasStartedRef.current) return;
    if (!state.hasPermission) {
      console.log('AutoStartCamera: No permission yet');
      return;
    }
    if (!state.selectedDeviceId) {
      console.log('AutoStartCamera: No device selected yet');
      return;
    }
    if (state.isActive) {
      console.log('AutoStartCamera: Camera already active');
      return;
    }
    if (state.isLoading) {
      console.log('AutoStartCamera: Camera is loading');
      return;
    }
    
    hasStartedRef.current = true;
    
    const start = async () => {
      try {
        console.log('AutoStartCamera: Starting camera with device:', state.selectedDeviceId);
        await startCamera();
        console.log('AutoStartCamera: Camera started successfully');
      } catch (error) {
        console.error('AutoStartCamera: Failed to start camera:', error);
        hasStartedRef.current = false; // Allow retry
      }
    };
    
    start();
  }, [state.hasPermission, state.selectedDeviceId, state.isActive, state.isLoading, startCamera]);

  return <>{children}</>;
};
