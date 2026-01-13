'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { POSITIONING_ALGORITHMS } from '@/types/glasses-positioning';
import { PBRMaterialProperties } from '@/types/lighting-materials';
import * as THREE from 'three';

interface EnhancedCameraWithPerformanceOptimizationProps {
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
  onPerformanceUpdate?: (metrics: any) => void;
}

export const EnhancedCameraWithPerformanceOptimization: React.FC<EnhancedCameraWithPerformanceOptimizationProps> = ({
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
  onPerformanceUpdate,
}) => {
  const { state: cameraState } = useCameraContext();
  const { state: faceState, startDetection, stopDetection, isReady } = useFaceDetectionContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [threeContext, setThreeContext] = useState<any>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  
  // Refs to access latest state in interval callbacks (avoid stale closures)
  const faceStateRef = useRef(faceState);
  const threeContextRef = useRef(threeContext);
  faceStateRef.current = faceState;
  threeContextRef.current = threeContext;

  // Performance timing tracking
  const performanceTimers = useRef({
    faceDetection: 0,
    coordinateMapping: 0,
    positioning: 0,
    rendering: 0,
  });

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

  // Performance optimization system
  const {
    metrics: performanceMetrics,
    deviceCapabilities,
    currentQualityLevel,
    recordFaceDetectionTime,
    recordCoordinateMappingTime,
    recordPositioningTime,
    recordRenderingTime,
    createLODObject,
    isReady: performanceReady,
  } = usePerformanceOptimization(
    threeContext?.renderer || null,
    threeContext?.scene || null,
    threeContext?.camera || null,
    {
      enableAdaptiveQuality: true,
      enableLOD: true,
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
  const handleSceneReady = useCallback((context: any) => {
    if (!threeContext) {
      setThreeContext(context);
    }
  }, [threeContext]);

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

  // Set active glasses model with LOD optimization
  useEffect(() => {
    console.log('[EnhancedCamera] activeGlassesId changed:', activeGlassesId);
    console.log('[EnhancedCamera] Models in collection:', Array.from(glassesCollection.models.keys()));
    console.log('[EnhancedCamera] Has model:', activeGlassesId ? glassesCollection.models.has(activeGlassesId) : 'N/A');
    
    if (activeGlassesId && glassesCollection.models.has(activeGlassesId)) {
      console.log('[EnhancedCamera] Setting active model:', activeGlassesId);
      setActiveModel(activeGlassesId);
      
      // Create LOD version of the glasses model for performance
      const model = glassesCollection.models.get(activeGlassesId);
      if (model && performanceReady && createLODObject) {
        // Extract geometry from model components
        if (model.components.frame && model.components.frame.geometry) {
          createLODObject(
            `glasses_frame_${activeGlassesId}`,
            model.components.frame.geometry,
            model.components.frame.material,
            model.mesh.position
          );
        }
      }
    } else if (activeGlassesId === null) {
      setActiveModel(null);
    } else if (activeGlassesId) {
      console.warn('[EnhancedCamera] Model not found in collection:', activeGlassesId);
    }
  }, [activeGlassesId, glassesCollection.models, setActiveModel, performanceReady, createLODObject]);

  // Update positioning algorithm
  useEffect(() => {
    if (positioningAlgorithm && setPositioningAlgorithm) {
      setPositioningAlgorithm(positioningAlgorithm as any);
    }
  }, [positioningAlgorithm, setPositioningAlgorithm]);

  // Update materials when properties change with performance tracking
  useEffect(() => {
    const activeModel = getActiveModel();
    if (!activeModel || !materialsReady) return;

    const updateModelMaterials = async () => {
      const startTime = performance.now();
      
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
      
      // Record material update time as part of rendering
      const materialUpdateTime = performance.now() - startTime;
      recordRenderingTime(materialUpdateTime);
    };

    updateModelMaterials();
  }, [frameProperties, lensProperties, getActiveModel, materialsReady, createFrameMaterial, createLensMaterial, recordRenderingTime]);

  // Use ref to track last processed detection to avoid infinite loops
  const lastProcessedDetectionRef = useRef<any>(null);
  const processingIntervalRef = useRef<number | null>(null);
  
  // Refs for functions to use in interval (avoid stale closures)
  const processFaceDetectionRef = useRef(processFaceDetection);
  const updateGlassesPositionRef = useRef(updateGlassesPosition);
  const updateFaceLightingRef = useRef(updateFaceLighting);
  const getActiveModelRef = useRef(getActiveModel);
  const positionModelRef = useRef(positionModel);
  
  // Update refs on each render
  processFaceDetectionRef.current = processFaceDetection;
  updateGlassesPositionRef.current = updateGlassesPosition;
  updateFaceLightingRef.current = updateFaceLighting;
  getActiveModelRef.current = getActiveModel;
  positionModelRef.current = positionModel;

  // Simple screen-space positioning for glasses overlay
  const positionGlassesOnFace = useCallback((detection: any) => {
    const activeModel = getActiveModelRef.current();
    if (!activeModel) {
      return; // No model selected
    }
    if (!threeContextRef.current?.camera) {
      console.warn('[positionGlassesOnFace] No camera available');
      return;
    }

    const landmarks = detection.landmarks;
    if (!landmarks || landmarks.length < 200) {
      console.warn('[positionGlassesOnFace] Invalid landmarks:', landmarks?.length);
      return;
    }

    // Key face landmarks for glasses positioning
    const leftEye = landmarks[33];  // Left eye inner corner
    const rightEye = landmarks[263]; // Right eye inner corner
    const leftEyeOuter = landmarks[133]; // Left eye outer corner
    const rightEyeOuter = landmarks[362]; // Right eye outer corner
    const noseBridge = landmarks[168] || landmarks[6]; // Nose bridge
    
    if (!leftEye || !rightEye || !noseBridge) return;

    // Calculate glasses position - use eye center with small offset down
    const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const eyeCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const faceCenterY = eyeCenterY + 0.09; // Move glasses further down toward nose bridge
    
    // Calculate inter-pupillary distance for scaling
    const eyeDistance = Math.sqrt(
      Math.pow(rightEyeOuter.x - leftEyeOuter.x, 2) + 
      Math.pow(rightEyeOuter.y - leftEyeOuter.y, 2)
    );

    // Canvas is already mirrored with scaleX(-1), so no need to flip X here
    // Convert from normalized (0-1) to NDC (-1 to 1)
    const ndcX = (faceCenterX - 0.5) * 2;  // Don't flip - canvas handles mirroring
    const ndcY = -(faceCenterY - 0.5) * 2; // Flip Y back - screen coords are inverted

    // Position glasses in front of camera
    const camera = threeContextRef.current.camera;
    const distanceFromCamera = 3; // Distance from camera to glasses plane
    
    // Calculate world position from NDC
    const fov = camera.fov * Math.PI / 180;
    const heightAtDistance = 2 * Math.tan(fov / 2) * distanceFromCamera;
    const widthAtDistance = heightAtDistance * camera.aspect;
    
    const worldX = ndcX * widthAtDistance / 2;
    const worldY = ndcY * heightAtDistance / 2;
    const worldZ = camera.position.z - distanceFromCamera;

    // DEBUG: Log coordinate transformations to find the issue
    console.log('[DEBUG] Coordinate chain:');
    console.log('  faceCenterY (normalized):', faceCenterY.toFixed(3));
    console.log('  ndcY (after flip):', ndcY.toFixed(3));
    console.log('  worldY (final):', worldY.toFixed(3));
    console.log('  heightAtDistance:', heightAtDistance.toFixed(3));

    // Calculate target width in world units based on eye distance
    // eyeDistance is normalized (0-1), typically 0.15-0.25 for a face
    // Glasses should be ~1.5x the eye distance to cover temples
    const targetWorldWidth = eyeDistance * widthAtDistance * 5;
    
    // Use stored bounding box from model data (calculated once at load time)
    // This prevents feedback loop from recalculating bbox after scale changes
    const modelWidth = Math.max(activeModel.boundingBox.getSize(new THREE.Vector3()).x, 0.001);
    
    // Calculate scale to achieve target width
    const scale = targetWorldWidth / modelWidth;
    
    // Calculate head tilt from eye positions
    const eyeAngle = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y, 
      rightEyeOuter.x - leftEyeOuter.x
    );

    // Apply transforms to model
    activeModel.mesh.position.set(worldX, worldY, worldZ);
    // GLB models typically face +Z or -Z, try without Y rotation first
    activeModel.mesh.rotation.set(0, 0, -eyeAngle);
    activeModel.mesh.scale.setScalar(scale);
    activeModel.mesh.visible = true;
    
    console.log('[positionGlassesOnFace] FINAL POSITION:', activeModel.id);
    console.log('  mesh.position:', worldX.toFixed(3), worldY.toFixed(3), worldZ.toFixed(3));
    console.log('  scale:', scale.toFixed(6));
    console.log('  camera.position:', camera.position.x.toFixed(3), camera.position.y.toFixed(3), camera.position.z.toFixed(3));
  }, []);

  // Process face detection with throttled interval
  useEffect(() => {
    const processDetection = () => {
      const detection = faceStateRef.current?.lastDetection;
      const currentThreeContext = threeContextRef.current;
      
      if (!detection || !currentThreeContext?.scene) {
        return;
      }

      // Skip if same detection
      if (lastProcessedDetectionRef.current === detection) {
        return;
      }
      lastProcessedDetectionRef.current = detection;

      try {
        // Use simple screen-space positioning
        positionGlassesOnFace(detection);
      } catch (error) {
        console.error('Error processing face detection:', error);
      }
    };

    // Process at 30fps
    processingIntervalRef.current = window.setInterval(processDetection, 33);

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []); // No dependencies - uses refs

  // Update glasses model position with performance optimization
  const updateGlassesModelPosition = (positioningResult: any) => {
    const renderingStart = performance.now();
    const activeModel = getActiveModel();
    
    console.log('[updateGlassesModelPosition] Called, activeModel:', activeModel?.id, 'result:', positioningResult);
    
    if (!activeModel) {
      console.warn('[updateGlassesModelPosition] No active model found!');
      return;
    }

    try {
      // Apply advanced positioning result
      positionModel(
        activeModel.id,
        positioningResult.position,
        positioningResult.rotation,
        positioningResult.scale.x
      );

      // Apply dynamic material effects based on performance level
      applyPerformanceBasedEffects(activeModel, positioningResult);
      
    } catch (error) {
      console.error('Error updating glasses position:', error);
    }
    
    const renderingTime = performance.now() - renderingStart;
    recordRenderingTime(renderingTime);
  };

  // Apply performance-based effects
  const applyPerformanceBasedEffects = (model: any, positioningResult: any) => {
    const stabilityFactor = positioningResult.confidence;
    const qualityFactor = Math.max(0.3, stabilityFactor);

    // Adjust effects based on current quality level
    if (currentQualityLevel < 2) {
      // Low quality - reduce effects
      if (model.components.leftLens?.material && model.components.rightLens?.material) {
        model.components.leftLens.material.envMapIntensity = 0.2;
        model.components.rightLens.material.envMapIntensity = 0.2;
      }
    } else {
      // High quality - full effects
      if (model.components.leftLens?.material && model.components.rightLens?.material) {
        const baseOpacity = lensProperties?.transmission || 0.1;
        const dynamicOpacity = baseOpacity * qualityFactor;
        
        model.components.leftLens.material.opacity = dynamicOpacity;
        model.components.rightLens.material.opacity = dynamicOpacity;
        model.components.leftLens.material.envMapIntensity = 1.0;
        model.components.rightLens.material.envMapIntensity = 1.0;
      }
    }

    // Apply frame effects based on quality
    if (model.components.frame?.material) {
      if (currentQualityLevel >= 3) {
        // High quality - enable clearcoat
        if (model.components.frame.material.clearcoat !== undefined) {
          model.components.frame.material.clearcoat = frameProperties?.clearcoat || 0;
        }
      } else {
        // Lower quality - disable expensive effects
        if (model.components.frame.material.clearcoat !== undefined) {
          model.components.frame.material.clearcoat = 0;
        }
      }
    }
  };

  // Direct camera fallback if CameraProvider stream is not available
  const [directStream, setDirectStream] = useState<MediaStream | null>(null);
  const directVideoRef = useRef<HTMLVideoElement>(null);
  const directStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // If camera is not active after 2 seconds, try direct access with HP camera
    const timer = setTimeout(async () => {
      if (!cameraState.isActive && !cameraState.stream && !directStreamRef.current) {
        console.log('EnhancedCamera: CameraProvider not active, trying direct camera access');
        try {
          // First get permission and enumerate devices
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          tempStream.getTracks().forEach(t => t.stop());
          
          // Find HP camera
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
          
          // Find HP camera (not DroidCam)
          let hpCamera = videoDevices.find(d => d.label.toLowerCase().includes('hp'));
          if (!hpCamera) {
            hpCamera = videoDevices.find(d => 
              (d.label.toLowerCase().includes('integrated') || d.label.toLowerCase().includes('webcam')) &&
              !d.label.toLowerCase().includes('droid')
            );
          }
          if (!hpCamera) {
            hpCamera = videoDevices.find(d => !d.label.toLowerCase().includes('droid'));
          }
          
          const deviceId = hpCamera?.deviceId;
          console.log('EnhancedCamera: Using camera:', hpCamera?.label || 'default');
          
          // Get stream with HP camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId 
              ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          
          directStreamRef.current = stream;
          setDirectStream(stream);
          if (directVideoRef.current) {
            directVideoRef.current.srcObject = stream;
            await directVideoRef.current.play();
            console.log('EnhancedCamera: Direct camera started successfully');
          }
        } catch (err) {
          console.error('EnhancedCamera: Direct camera failed:', err);
        }
      }
    }, 2000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [cameraState.isActive, cameraState.stream]);
  
  // Cleanup direct stream on unmount
  useEffect(() => {
    return () => {
      if (directStreamRef.current) {
        directStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px', backgroundColor: '#000000' }}>
      {/* Video Display - use direct video if CameraProvider fails */}
      {cameraState.stream ? (
        <VideoDisplay 
          ref={videoRef}
          onLoadedMetadata={handleVideoMetadata}
          className="w-full h-full"
        />
      ) : (
        <video
          ref={directVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            backgroundColor: '#000000',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Face Detection Overlay */}
      {showFaceOverlay && cameraState.isActive && (
        <FaceDetectionOverlay
          videoRef={videoRef}
          showLandmarks={showLandmarks}
          showBoundingBox={showBoundingBox}
          showKeyPoints={showKeyPoints}
        />
      )}

      {/* Three.js 3D Scene Overlay - z-index 10 to be above video */}
      {show3DScene && cameraState.isActive && (
        <ThreeJSOverlay
          ref={threeCanvasRef}
          onSceneReady={handleSceneReady}
          autoStart={true}
          className="absolute inset-0"
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

      {/* Performance Status Indicators */}
      <div className="absolute top-4 right-4 space-y-1">
        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
            <span>FPS: {performanceMetrics.fps.toFixed(0)}</span>
            <span className={`${performanceMetrics.fps >= 55 ? 'text-green-400' : performanceMetrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>●</span>
          </div>
        )}
        
        {/* Quality Level */}
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
          Quality: Level {currentQualityLevel}
        </div>
        
        {/* Device Tier */}
        {deviceCapabilities && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
            Device: {deviceCapabilities.tier.toUpperCase()}
          </div>
        )}
        
        {/* Positioning Status */}
        {positioningState && (
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
            <span>Tracking: {Math.round(positioningQuality.overallScore * 100)}%</span>
            {positioningState.isStable && <span className="text-green-400">●</span>}
          </div>
        )}
      </div>
    </div>
  );
};
