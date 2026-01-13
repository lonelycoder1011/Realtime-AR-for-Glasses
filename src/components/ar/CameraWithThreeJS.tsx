'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VideoDisplay } from '@/components/camera/VideoDisplay';
import { useCameraContext } from '@/components/camera/CameraProvider';
import { useFaceDetectionContext } from './FaceDetectionProvider';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { ThreeJSOverlay } from './ThreeJSOverlay';
import { CoordinateMapper } from '@/lib/three/coordinate-mapper';
import * as THREE from 'three';

interface CameraWithThreeJSProps {
  className?: string;
  showFaceOverlay?: boolean;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  showKeyPoints?: boolean;
  show3DScene?: boolean;
}

export const CameraWithThreeJS: React.FC<CameraWithThreeJSProps> = ({
  className = '',
  showFaceOverlay = true,
  showLandmarks = false,
  showBoundingBox = true,
  showKeyPoints = true,
  show3DScene = true,
}) => {
  const { state: cameraState } = useCameraContext();
  const { state: faceState, startDetection, stopDetection, isReady } = useFaceDetectionContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [coordinateMapper, setCoordinateMapper] = useState<CoordinateMapper | null>(null);
  const [threeContext, setThreeContext] = useState<any>(null);

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

  // Initialize coordinate mapper when Three.js scene is ready
  const handleSceneReady = (context: any) => {
    setThreeContext(context);
    
    if (context?.camera && videoRef.current) {
      const video = videoRef.current;
      const mapper = new CoordinateMapper(
        context.camera,
        video.videoWidth || 1280,
        video.videoHeight || 720
      );
      setCoordinateMapper(mapper);
    }
  };

  // Update coordinate mapper when video dimensions change
  useEffect(() => {
    const video = videoRef.current;
    if (video && coordinateMapper && threeContext?.camera) {
      const handleLoadedMetadata = () => {
        coordinateMapper.updateDimensions(
          threeContext.camera,
          video.videoWidth,
          video.videoHeight
        );
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [coordinateMapper, threeContext]);

  // Add a simple test cube to the scene when ready
  useEffect(() => {
    if (!threeContext?.scene) return;

    // Create a simple test cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.7 
    });
    const cube = new THREE.Mesh(geometry, material);
    
    // Position the cube in front of the camera
    cube.position.set(0, 0, -5);
    
    threeContext.scene.add(cube);

    // Animate the cube
    const animate = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
    };

    const interval = setInterval(animate, 16); // ~60fps

    return () => {
      clearInterval(interval);
      threeContext.scene.remove(cube);
      geometry.dispose();
      material.dispose();
    };
  }, [threeContext]);

  // Update cube position based on face detection
  useEffect(() => {
    if (!threeContext?.scene || !coordinateMapper || !faceState.lastDetection) return;

    const cube = threeContext.scene.children.find((child: any) => 
      child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry
    );

    if (cube) {
      try {
        const face3D = coordinateMapper.faceToWorldCoordinates(faceState.lastDetection);
        
        // Position cube at face center
        cube.position.copy(face3D.faceCenter);
        
        // Apply face rotation
        cube.quaternion.copy(face3D.faceRotation);
        
        // Scale based on face size
        const scale = Math.max(0.5, Math.min(2.0, face3D.faceScale));
        cube.scale.setScalar(scale);
        
      } catch (error) {
        console.error('Error updating cube position:', error);
      }
    }
  }, [faceState.lastDetection, coordinateMapper, threeContext]);

  return (
    <div className={`relative ${className}`}>
      {/* Video Display */}
      <VideoDisplay 
        ref={videoRef}
        onLoadedMetadata={() => {
          // Video is ready, face detection will start via useEffect
        }}
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
    </div>
  );
};
