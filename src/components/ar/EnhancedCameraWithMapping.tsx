'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VideoDisplay } from '@/components/camera/VideoDisplay';
import { useCameraContext } from '@/components/camera/CameraProvider';
import { useFaceDetectionContext } from './FaceDetectionProvider';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { ThreeJSOverlay } from './ThreeJSOverlay';
import { CoordinateDebugOverlay } from './CoordinateDebugOverlay';
import { useEnhancedCoordinateMapping } from '@/hooks/useEnhancedCoordinateMapping';
import * as THREE from 'three';

interface EnhancedCameraWithMappingProps {
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
}

export const EnhancedCameraWithMapping: React.FC<EnhancedCameraWithMappingProps> = ({
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
    worldToScreen,
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

  // Process face detection with enhanced coordinate mapping
  useEffect(() => {
    if (faceState.lastDetection && mappingReady) {
      const mappingResult = processFaceDetection(faceState.lastDetection);
      
      if (mappingResult && threeContext?.scene) {
        updateSceneObjects(mappingResult);
      }
    }
  }, [faceState.lastDetection, mappingReady, processFaceDetection, threeContext]);

  // Update 3D scene objects based on coordinate mapping
  const updateSceneObjects = (mappingResult: any) => {
    if (!threeContext?.scene) return;

    // Find or create test objects
    let testCube = threeContext.scene.getObjectByName('testCube');
    let glassesFrame = threeContext.scene.getObjectByName('glassesFrame');

    // Create test cube if it doesn't exist
    if (!testCube) {
      const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.8 
      });
      testCube = new THREE.Mesh(geometry, material);
      testCube.name = 'testCube';
      threeContext.scene.add(testCube);
    }

    // Create glasses frame wireframe if it doesn't exist
    if (!glassesFrame && mappingResult.glassesAnchors) {
      const frameGeometry = createGlassesFrameGeometry(mappingResult.glassesAnchors);
      const frameMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      glassesFrame = new THREE.LineSegments(frameGeometry, frameMaterial);
      glassesFrame.name = 'glassesFrame';
      threeContext.scene.add(glassesFrame);
    }

    // Update test cube position
    if (testCube && mappingResult.headPose) {
      testCube.position.copy(mappingResult.headPose.position);
      testCube.quaternion.copy(mappingResult.headPose.quaternion);
      testCube.scale.setScalar(mappingResult.headPose.scale);
    }

    // Update glasses frame
    if (glassesFrame && mappingResult.glassesAnchors) {
      updateGlassesFrameGeometry(glassesFrame, mappingResult.glassesAnchors);
    }
  };

  // Create glasses frame geometry from anchor points
  const createGlassesFrameGeometry = (anchors: any) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Left lens outline (approximate circle)
    const leftCenter = anchors.leftLensCenter;
    const lensRadius = anchors.lensWidth / 2;
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      vertices.push(
        leftCenter.x + Math.cos(angle) * lensRadius,
        leftCenter.y + Math.sin(angle) * lensRadius * 0.8, // Slightly oval
        leftCenter.z
      );
    }

    // Right lens outline
    const rightCenter = anchors.rightLensCenter;
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      vertices.push(
        rightCenter.x + Math.cos(angle) * lensRadius,
        rightCenter.y + Math.sin(angle) * lensRadius * 0.8,
        rightCenter.z
      );
    }

    // Bridge connection
    vertices.push(
      leftCenter.x + lensRadius, leftCenter.y, leftCenter.z,
      rightCenter.x - lensRadius, rightCenter.y, rightCenter.z
    );

    // Temple arms
    vertices.push(
      anchors.leftTempleStart.x, anchors.leftTempleStart.y, anchors.leftTempleStart.z,
      anchors.leftTempleStart.x - 0.1, anchors.leftTempleStart.y, anchors.leftTempleStart.z - 0.05
    );
    
    vertices.push(
      anchors.rightTempleStart.x, anchors.rightTempleStart.y, anchors.rightTempleStart.z,
      anchors.rightTempleStart.x + 0.1, anchors.rightTempleStart.y, anchors.rightTempleStart.z - 0.05
    );

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  };

  // Update glasses frame geometry
  const updateGlassesFrameGeometry = (frameObject: any, anchors: any) => {
    // For simplicity, recreate the geometry
    const newGeometry = createGlassesFrameGeometry(anchors);
    frameObject.geometry.dispose();
    frameObject.geometry = newGeometry;
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
