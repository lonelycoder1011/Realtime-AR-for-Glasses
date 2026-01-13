'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VideoDisplay } from '@/components/camera/VideoDisplay';
import { useCameraContext } from '@/components/camera/CameraProvider';
import { useFaceDetectionContext } from './FaceDetectionProvider';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { ThreeJSOverlay } from './ThreeJSOverlay';
import { CoordinateDebugOverlay } from './CoordinateDebugOverlay';
import { useEnhancedCoordinateMapping } from '@/hooks/useEnhancedCoordinateMapping';
import { useGlassesModels } from '@/hooks/useGlassesModels';
import * as THREE from 'three';

interface EnhancedCameraWithGlassesProps {
  className?: string;
  showFaceOverlay?: boolean;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  showKeyPoints?: boolean;
  show3DScene?: boolean;
  showCoordinateDebug?: boolean;
  showPoseDebug?: boolean;
  showGeometryDebug?: boolean;
  showAnchorsDebug?: boolean;
  showQualityDebug?: boolean;
  activeGlassesId?: string | null;
}

export const EnhancedCameraWithGlasses: React.FC<EnhancedCameraWithGlassesProps> = ({
  className = '',
  showFaceOverlay = true,
  showLandmarks = false,
  showBoundingBox = true,
  showKeyPoints = true,
  show3DScene = true,
  showCoordinateDebug = false,
  showPoseDebug = true,
  showGeometryDebug = true,
  showAnchorsDebug = true,
  showQualityDebug = true,
  activeGlassesId = null,
}) => {
  const { state: cameraState } = useCameraContext();
  const { state: faceState, startDetection, stopDetection, isReady } = useFaceDetectionContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [threeContext, setThreeContext] = useState<any>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });

  // Enhanced coordinate mapping
  const {
    state: mappingState,
    processFaceDetection,
    isReady: mappingReady,
  } = useEnhancedCoordinateMapping(
    threeContext?.camera || null,
    videoSize.width,
    videoSize.height,
    {
      calibration: {
        averageEyeDistance: 0.063, // 63mm
        averageFaceWidth: 0.14,    // 140mm
        averageFaceHeight: 0.18,   // 180mm
      },
      smoothingEnabled: true,
      qualityThreshold: 0.6,
    }
  );

  // Glasses models management
  const {
    collection: glassesCollection,
    setActiveModel,
    getActiveModel,
    positionModel,
  } = useGlassesModels({
    scene: threeContext?.scene || undefined,
    autoLoadTemplates: true,
  });

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

  // Initialize coordinate mapping when Three.js scene is ready
  const handleSceneReady = (context: any) => {
    setThreeContext(context);
  };

  // Update video dimensions when metadata loads
  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setVideoSize({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });
    }
  };

  // Set active glasses model
  useEffect(() => {
    if (activeGlassesId && glassesCollection.models.has(activeGlassesId)) {
      setActiveModel(activeGlassesId);
    } else if (activeGlassesId === null) {
      setActiveModel(null);
    }
  }, [activeGlassesId, glassesCollection.models, setActiveModel]);

  // Process face detection with enhanced coordinate mapping and glasses positioning
  useEffect(() => {
    if (faceState.lastDetection && mappingReady) {
      const mappingResult = processFaceDetection(faceState.lastDetection);
      
      if (mappingResult && threeContext?.scene) {
        updateGlassesPosition(mappingResult);
      }
    }
  }, [faceState.lastDetection, mappingReady, processFaceDetection, threeContext]);

  // Update glasses position based on coordinate mapping
  const updateGlassesPosition = (mappingResult: any) => {
    const activeModel = getActiveModel();
    if (!activeModel || !mappingResult.glassesAnchors) return;

    try {
      // Position glasses at the bridge center
      const position = mappingResult.glassesAnchors.bridgeCenter.clone();
      
      // Apply head pose rotation
      const rotation = mappingResult.headPose.rotation;
      
      // Apply face scale
      const scale = Math.max(0.8, Math.min(1.5, mappingResult.headPose.scale));
      
      // Update glasses model position
      positionModel(activeModel.id, position, rotation, scale);
      
      // Fine-tune positioning based on glasses anchor points
      adjustGlassesComponents(activeModel, mappingResult.glassesAnchors);
      
    } catch (error) {
      console.error('Error updating glasses position:', error);
    }
  };

  // Adjust individual glasses components
  const adjustGlassesComponents = (model: any, anchors: any) => {
    // Position left lens
    if (model.components.leftLens) {
      const leftLensOffset = anchors.leftLensCenter.clone().sub(anchors.bridgeCenter);
      model.components.leftLens.position.copy(leftLensOffset);
    }

    // Position right lens
    if (model.components.rightLens) {
      const rightLensOffset = anchors.rightLensCenter.clone().sub(anchors.bridgeCenter);
      model.components.rightLens.position.copy(rightLensOffset);
    }

    // Position temples
    if (model.components.leftTemple) {
      const leftTempleOffset = anchors.leftTempleStart.clone().sub(anchors.bridgeCenter);
      model.components.leftTemple.position.copy(leftTempleOffset);
    }

    if (model.components.rightTemple) {
      const rightTempleOffset = anchors.rightTempleStart.clone().sub(anchors.bridgeCenter);
      model.components.rightTemple.position.copy(rightTempleOffset);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Video Display */}
      <VideoDisplay 
        ref={videoRef}
        onLoadedMetadata={handleVideoMetadata}
      />
      
      {/* Face Detection Overlay */}
      {showFaceOverlay && cameraState.isActive && (
        <FaceDetectionOverlay
          videoRef={videoRef}
          showLandmarks={showLandmarks}
          showBoundingBox={showBoundingBox}
          showKeyPoints={showKeyPoints}
        />
      )}

      {/* Three.js 3D Scene Overlay */}
      {show3DScene && cameraState.isActive && (
        <ThreeJSOverlay
          ref={threeCanvasRef}
          onSceneReady={handleSceneReady}
          autoStart={true}
        />
      )}

      {/* Enhanced Coordinate Debug Overlay */}
      {showCoordinateDebug && cameraState.isActive && mappingState.currentPose && (
        <CoordinateDebugOverlay
          videoRef={videoRef}
          headPose={mappingState.currentPose}
          faceGeometry={mappingState.faceGeometry}
          glassesAnchors={mappingState.glassesAnchors}
          quality={mappingState.quality}
          camera={threeContext?.camera || null}
          showPose={showPoseDebug}
          showGeometry={showGeometryDebug}
          showAnchors={showAnchorsDebug}
          showQuality={showQualityDebug}
        />
      )}
    </div>
  );
};
