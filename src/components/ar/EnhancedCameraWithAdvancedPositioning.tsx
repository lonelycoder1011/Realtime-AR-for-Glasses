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
import { useGlassesPositioning } from '@/hooks/useGlassesPositioning';
import { POSITIONING_ALGORITHMS } from '@/types/glasses-positioning';
import * as THREE from 'three';

interface EnhancedCameraWithAdvancedPositioningProps {
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
  positioningAlgorithm?: string;
  onPositioningStateChange?: (state: any) => void;
}

export const EnhancedCameraWithAdvancedPositioning: React.FC<EnhancedCameraWithAdvancedPositioningProps> = ({
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
  positioningAlgorithm = POSITIONING_ALGORITHMS.HYBRID,
  onPositioningStateChange,
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

  // Advanced glasses positioning
  const {
    currentState: positioningState,
    quality: positioningQuality,
    updatePosition: updateGlassesPosition,
    setAlgorithm: setPositioningAlgorithm,
    isEnabled: positioningEnabled,
  } = useGlassesPositioning({
    algorithm: positioningAlgorithm as any,
    config: {
      positionSmoothingFactor: 0.7,
      rotationSmoothingFactor: 0.8,
      scaleSmoothingFactor: 0.6,
      stabilityThreshold: 0.85,
      jitterReductionFactor: 0.3,
    },
    enabled: true,
  });

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

  // Update positioning algorithm
  useEffect(() => {
    if (positioningAlgorithm && setPositioningAlgorithm) {
      setPositioningAlgorithm(positioningAlgorithm as any);
    }
  }, [positioningAlgorithm, setPositioningAlgorithm]);

  // Process face detection with advanced positioning
  useEffect(() => {
    if (faceState.lastDetection && mappingReady && positioningEnabled) {
      const mappingResult = processFaceDetection(faceState.lastDetection);
      
      if (mappingResult && mappingResult.headPose && mappingResult.faceGeometry && mappingResult.glassesAnchors) {
        // Update glasses positioning with advanced algorithms
        const positioningResult = updateGlassesPosition(
          mappingResult.headPose,
          mappingResult.faceGeometry,
          mappingResult.glassesAnchors,
          mappingResult.quality.confidence
        );

        if (positioningResult && threeContext?.scene) {
          updateGlassesModelPosition(positioningResult);
        }

        // Notify parent component of positioning state changes
        if (onPositioningStateChange && positioningResult) {
          onPositioningStateChange({
            position: positioningResult,
            quality: positioningQuality,
            mapping: mappingResult,
          });
        }
      }
    }
  }, [
    faceState.lastDetection, 
    mappingReady, 
    positioningEnabled, 
    processFaceDetection, 
    updateGlassesPosition, 
    threeContext,
    onPositioningStateChange,
    positioningQuality
  ]);

  // Update glasses model position with advanced positioning
  const updateGlassesModelPosition = (positioningResult: any) => {
    const activeModel = getActiveModel();
    if (!activeModel) return;

    try {
      // Apply advanced positioning result
      positionModel(
        activeModel.id,
        positioningResult.position,
        positioningResult.rotation,
        positioningResult.scale.x
      );

      // Fine-tune individual components if needed
      adjustGlassesComponentsAdvanced(activeModel, positioningResult);
      
    } catch (error) {
      console.error('Error updating glasses position with advanced positioning:', error);
    }
  };

  // Advanced component adjustment
  const adjustGlassesComponentsAdvanced = (model: any, positioningResult: any) => {
    // Apply component-specific transformations based on positioning state
    if (model.components.leftLens && positioningResult.isStable) {
      // Apply subtle adjustments for stable tracking
      const stabilityFactor = positioningResult.confidence;
      model.components.leftLens.material.opacity = 0.1 + (stabilityFactor * 0.05);
    }

    if (model.components.rightLens && positioningResult.isStable) {
      const stabilityFactor = positioningResult.confidence;
      model.components.rightLens.material.opacity = 0.1 + (stabilityFactor * 0.05);
    }

    // Adjust frame visibility based on tracking quality
    if (model.components.frame) {
      const qualityFactor = Math.max(0.3, positioningResult.confidence);
      model.components.frame.material.opacity = qualityFactor;
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

      {/* Positioning Quality Indicator */}
      {positioningState && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
          Quality: {Math.round(positioningQuality.overallScore * 100)}%
          {positioningState.isStable && <span className="ml-2 text-green-400">●</span>}
        </div>
      )}
    </div>
  );
};
