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
import { useAdvancedLighting } from '@/hooks/useAdvancedLighting';
import { usePBRMaterials } from '@/hooks/usePBRMaterials';
import { POSITIONING_ALGORITHMS } from '@/types/glasses-positioning';
import { PBRMaterialProperties } from '@/types/lighting-materials';
import * as THREE from 'three';

interface EnhancedCameraWithAdvancedMaterialsProps {
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
  frameProperties?: PBRMaterialProperties;
  lensProperties?: PBRMaterialProperties;
  onPositioningStateChange?: (state: any) => void;
  onMaterialChange?: (type: 'frame' | 'lens', properties: PBRMaterialProperties) => void;
}

export const EnhancedCameraWithAdvancedMaterials: React.FC<EnhancedCameraWithAdvancedMaterialsProps> = ({
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
  frameProperties,
  lensProperties,
  onPositioningStateChange,
  onMaterialChange,
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
        averageEyeDistance: 0.063,
        averageFaceWidth: 0.14,
        averageFaceHeight: 0.18,
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

  // Advanced lighting system
  const {
    lightingConfig,
    updateConfig: updateLightingConfig,
    updateFaceLighting,
    isReady: lightingReady,
  } = useAdvancedLighting(
    threeContext?.scene || null,
    threeContext?.renderer || null,
    {
      autoLoadEnvironment: true,
      defaultEnvironment: 'studio',
    }
  );

  // PBR materials system
  const {
    createFrameMaterial,
    createLensMaterial,
    updateMaterialProperties,
    isReady: materialsReady,
  } = usePBRMaterials({
    autoLoadTextures: true,
    enableCaching: true,
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

  // Update materials when properties change
  useEffect(() => {
    const activeModel = getActiveModel();
    if (!activeModel || !materialsReady) return;

    const updateModelMaterials = async () => {
      try {
        // Update frame material
        if (frameProperties && activeModel.components.frame) {
          const frameMaterial = await createFrameMaterial(frameProperties as any);
          if (frameMaterial) {
            activeModel.components.frame.material = frameMaterial;
          }
        }

        // Update lens materials
        if (lensProperties) {
          const lensMaterial = await createLensMaterial(lensProperties as any);
          if (lensMaterial) {
            if (activeModel.components.leftLens) {
              activeModel.components.leftLens.material = lensMaterial;
            }
            if (activeModel.components.rightLens) {
              activeModel.components.rightLens.material = lensMaterial.clone();
            }
          }
        }
      } catch (error) {
        console.error('Failed to update materials:', error);
      }
    };

    updateModelMaterials();
  }, [frameProperties, lensProperties, getActiveModel, materialsReady, createFrameMaterial, createLensMaterial]);

  // Process face detection with advanced positioning and lighting
  useEffect(() => {
    if (faceState.lastDetection && mappingReady && positioningEnabled) {
      const mappingResult = processFaceDetection(faceState.lastDetection);
      
      if (mappingResult && mappingResult.headPose && mappingResult.faceGeometry && mappingResult.glassesAnchors) {
        // Update glasses positioning
        const positioningResult = updateGlassesPosition(
          mappingResult.headPose,
          mappingResult.faceGeometry,
          mappingResult.glassesAnchors,
          mappingResult.quality.confidence
        );

        if (positioningResult && threeContext?.scene) {
          updateGlassesModelPosition(positioningResult);
        }

        // Update face lighting based on face position and orientation
        if (lightingReady && updateFaceLighting) {
          const facePosition = mappingResult.headPose.position;
          const faceNormal = new THREE.Vector3(0, 0, 1).applyEuler(mappingResult.headPose.rotation);
          updateFaceLighting(facePosition, faceNormal);
        }

        // Notify parent component
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
    lightingReady,
    processFaceDetection,
    updateGlassesPosition,
    updateFaceLighting,
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

      // Apply dynamic material effects based on lighting and positioning
      applyDynamicMaterialEffects(activeModel, positioningResult);
      
    } catch (error) {
      console.error('Error updating glasses position:', error);
    }
  };

  // Apply dynamic material effects based on positioning and lighting
  const applyDynamicMaterialEffects = (model: any, positioningResult: any) => {
    const stabilityFactor = positioningResult.confidence;
    const qualityFactor = Math.max(0.3, stabilityFactor);

    // Adjust lens opacity based on tracking quality
    if (model.components.leftLens?.material && model.components.rightLens?.material) {
      const baseOpacity = lensProperties?.transmission || 0.1;
      const dynamicOpacity = baseOpacity * qualityFactor;
      
      model.components.leftLens.material.opacity = dynamicOpacity;
      model.components.rightLens.material.opacity = dynamicOpacity;
    }

    // Adjust frame material based on stability
    if (model.components.frame?.material) {
      const baseMetal = frameProperties?.metalness || 0.5;
      const dynamicMetal = baseMetal * (0.8 + stabilityFactor * 0.2);
      
      if (model.components.frame.material.metalness !== undefined) {
        model.components.frame.material.metalness = dynamicMetal;
      }
    }

    // Apply subtle emission for high-quality tracking
    if (stabilityFactor > 0.9 && model.components.frame?.material) {
      if (model.components.frame.material.emissiveIntensity !== undefined) {
        model.components.frame.material.emissiveIntensity = 0.02 * (stabilityFactor - 0.9) * 10;
      }
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

      {/* Advanced Status Indicators */}
      <div className="absolute top-4 right-4 space-y-1">
        {/* Positioning Quality */}
        {positioningState && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
            <span>Positioning: {Math.round(positioningQuality.overallScore * 100)}%</span>
            {positioningState.isStable && <span className="text-green-400">●</span>}
          </div>
        )}
        
        {/* Lighting Status */}
        {lightingReady && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
            Lighting: Active
          </div>
        )}
        
        {/* Materials Status */}
        {materialsReady && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
            PBR Materials: Ready
          </div>
        )}
      </div>
    </div>
  );
};
