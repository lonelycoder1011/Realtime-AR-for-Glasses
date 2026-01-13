'use client';

import React, { useRef, useEffect } from 'react';
import { VideoDisplay } from './VideoDisplay';
import { useCameraContext } from './CameraProvider';
import { useFaceDetectionContext } from '@/components/ar/FaceDetectionProvider';
import { FaceDetectionOverlay } from '@/components/ar/FaceDetectionOverlay';

interface CameraWithFaceDetectionProps {
  className?: string;
  showOverlay?: boolean;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  showKeyPoints?: boolean;
}

export const CameraWithFaceDetection: React.FC<CameraWithFaceDetectionProps> = ({
  className = '',
  showOverlay = true,
  showLandmarks = false,
  showBoundingBox = true,
  showKeyPoints = true,
}) => {
  const { state: cameraState } = useCameraContext();
  const { startDetection, stopDetection, isReady } = useFaceDetectionContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start face detection when camera becomes active
  useEffect(() => {
    const video = videoRef.current;
    
    if (cameraState.isActive && video && isReady) {
      startDetection(video).catch((error) => {
        console.error('Failed to start face detection:', error);
      });
    } else if (!cameraState.isActive) {
      stopDetection();
    }

    return () => {
      if (!cameraState.isActive) {
        stopDetection();
      }
    };
  }, [cameraState.isActive, isReady, startDetection, stopDetection]);

  return (
    <div className={`relative ${className}`}>
      <VideoDisplay 
        ref={videoRef}
        onLoadedMetadata={() => {
          // Video is ready, face detection will start via useEffect
        }}
      />
      
      {showOverlay && cameraState.isActive && (
        <FaceDetectionOverlay
          videoRef={videoRef}
          showLandmarks={showLandmarks}
          showBoundingBox={showBoundingBox}
          showKeyPoints={showKeyPoints}
        />
      )}
    </div>
  );
};
