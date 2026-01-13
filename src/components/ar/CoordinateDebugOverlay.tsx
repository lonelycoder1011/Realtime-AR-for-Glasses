'use client';

import React, { useRef, useEffect } from 'react';
import { HeadPose, FaceGeometry, GlassesAnchorPoints, MappingQuality } from '@/types/coordinate-mapping';
import * as THREE from 'three';

interface CoordinateDebugOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  headPose: HeadPose | null;
  faceGeometry: FaceGeometry | null;
  glassesAnchors: GlassesAnchorPoints | null;
  quality: MappingQuality | null;
  camera: THREE.PerspectiveCamera | null;
  showPose?: boolean;
  showGeometry?: boolean;
  showAnchors?: boolean;
  showQuality?: boolean;
  className?: string;
}

export const CoordinateDebugOverlay: React.FC<CoordinateDebugOverlayProps> = ({
  videoRef,
  headPose,
  faceGeometry,
  glassesAnchors,
  quality,
  camera,
  showPose = true,
  showGeometry = true,
  showAnchors = true,
  showQuality = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Project 3D point to screen coordinates
  const projectToScreen = (point: THREE.Vector3): { x: number; y: number } | null => {
    if (!camera || !canvasRef.current) return null;

    const vector = point.clone();
    vector.project(camera);

    // Convert from NDC to canvas coordinates
    const canvas = canvasRef.current;
    const x = (vector.x + 1) / 2 * canvas.width;
    const y = (-vector.y + 1) / 2 * canvas.height;

    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw coordinate system origin
    if (showPose && headPose && camera) {
      const origin = projectToScreen(headPose.position);
      if (origin) {
        // Draw coordinate axes
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        
        // X axis (red)
        const xAxis = headPose.position.clone().add(new THREE.Vector3(0.05, 0, 0));
        const xAxisScreen = projectToScreen(xAxis);
        if (xAxisScreen) {
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(xAxisScreen.x, xAxisScreen.y);
          ctx.stroke();
        }

        // Y axis (green)
        ctx.strokeStyle = '#00ff00';
        const yAxis = headPose.position.clone().add(new THREE.Vector3(0, 0.05, 0));
        const yAxisScreen = projectToScreen(yAxis);
        if (yAxisScreen) {
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(yAxisScreen.x, yAxisScreen.y);
          ctx.stroke();
        }

        // Z axis (blue)
        ctx.strokeStyle = '#0000ff';
        const zAxis = headPose.position.clone().add(new THREE.Vector3(0, 0, 0.05));
        const zAxisScreen = projectToScreen(zAxis);
        if (zAxisScreen) {
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(zAxisScreen.x, zAxisScreen.y);
          ctx.stroke();
        }

        // Draw origin point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw face geometry
    if (showGeometry && faceGeometry && camera) {
      // Draw eye positions
      const leftEyeScreen = projectToScreen(faceGeometry.leftEye);
      const rightEyeScreen = projectToScreen(faceGeometry.rightEye);
      
      if (leftEyeScreen && rightEyeScreen) {
        // Eye points
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(leftEyeScreen.x, leftEyeScreen.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeScreen.x, rightEyeScreen.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Eye line
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftEyeScreen.x, leftEyeScreen.y);
        ctx.lineTo(rightEyeScreen.x, rightEyeScreen.y);
        ctx.stroke();
      }

      // Draw nose bridge and tip
      const noseBridgeScreen = projectToScreen(faceGeometry.noseBridge);
      const noseTipScreen = projectToScreen(faceGeometry.noseTip);
      
      if (noseBridgeScreen && noseTipScreen) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(noseBridgeScreen.x, noseBridgeScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(noseTipScreen.x, noseTipScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Nose line
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(noseBridgeScreen.x, noseBridgeScreen.y);
        ctx.lineTo(noseTipScreen.x, noseTipScreen.y);
        ctx.stroke();
      }

      // Draw temples
      const leftTempleScreen = projectToScreen(faceGeometry.leftTemple);
      const rightTempleScreen = projectToScreen(faceGeometry.rightTemple);
      
      if (leftTempleScreen && rightTempleScreen) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(leftTempleScreen.x, leftTempleScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightTempleScreen.x, rightTempleScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw glasses anchor points
    if (showAnchors && glassesAnchors && camera) {
      // Bridge center
      const bridgeCenterScreen = projectToScreen(glassesAnchors.bridgeCenter);
      if (bridgeCenterScreen) {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(bridgeCenterScreen.x, bridgeCenterScreen.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Lens centers
      const leftLensScreen = projectToScreen(glassesAnchors.leftLensCenter);
      const rightLensScreen = projectToScreen(glassesAnchors.rightLensCenter);
      
      if (leftLensScreen && rightLensScreen) {
        ctx.fillStyle = '#8800ff';
        ctx.beginPath();
        ctx.arc(leftLensScreen.x, leftLensScreen.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightLensScreen.x, rightLensScreen.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw lens outlines (approximate)
        const lensWidthPixels = glassesAnchors.lensWidth * 1000; // Scale for visibility
        const lensHeightPixels = glassesAnchors.lensHeight * 1000;
        
        ctx.strokeStyle = '#8800ff';
        ctx.lineWidth = 2;
        
        // Left lens
        ctx.beginPath();
        ctx.ellipse(leftLensScreen.x, leftLensScreen.y, lensWidthPixels/2, lensHeightPixels/2, 0, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Right lens
        ctx.beginPath();
        ctx.ellipse(rightLensScreen.x, rightLensScreen.y, lensWidthPixels/2, lensHeightPixels/2, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Temple start points
      const leftTempleStartScreen = projectToScreen(glassesAnchors.leftTempleStart);
      const rightTempleStartScreen = projectToScreen(glassesAnchors.rightTempleStart);
      
      if (leftTempleStartScreen && rightTempleStartScreen) {
        ctx.fillStyle = '#88ff00';
        ctx.beginPath();
        ctx.arc(leftTempleStartScreen.x, leftTempleStartScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightTempleStartScreen.x, rightTempleStartScreen.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw quality information
    if (showQuality && quality) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 120);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(`Confidence: ${(quality.confidence * 100).toFixed(1)}%`, 15, 30);
      ctx.fillText(`Stability: ${(quality.stability * 100).toFixed(1)}%`, 15, 50);
      ctx.fillText(`Accuracy: ${(quality.accuracy * 100).toFixed(1)}%`, 15, 70);
      ctx.fillText(`Tracking Loss: ${(quality.trackingLoss * 100).toFixed(1)}%`, 15, 90);
      
      // Quality indicator
      const overallQuality = (quality.confidence + quality.stability + quality.accuracy) / 3;
      ctx.fillStyle = overallQuality > 0.8 ? '#00ff00' : overallQuality > 0.6 ? '#ffff00' : '#ff0000';
      ctx.fillRect(15, 100, overallQuality * 180, 10);
    }

    // Draw pose information
    if (showPose && headPose) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvas.width - 220, 10, 210, 140);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('Head Pose:', canvas.width - 215, 30);
      ctx.fillText(`X: ${headPose.position.x.toFixed(3)}`, canvas.width - 215, 50);
      ctx.fillText(`Y: ${headPose.position.y.toFixed(3)}`, canvas.width - 215, 70);
      ctx.fillText(`Z: ${headPose.position.z.toFixed(3)}`, canvas.width - 215, 90);
      ctx.fillText(`Pitch: ${(headPose.rotation.x * 180/Math.PI).toFixed(1)}°`, canvas.width - 215, 110);
      ctx.fillText(`Yaw: ${(headPose.rotation.y * 180/Math.PI).toFixed(1)}°`, canvas.width - 215, 130);
      ctx.fillText(`Roll: ${(headPose.rotation.z * 180/Math.PI).toFixed(1)}°`, canvas.width - 215, 150);
    }

    // Draw face geometry measurements
    if (showGeometry && faceGeometry) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, canvas.height - 120, 200, 110);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('Face Geometry:', 15, canvas.height - 100);
      ctx.fillText(`Eye Dist: ${(faceGeometry.eyeDistance * 1000).toFixed(1)}mm`, 15, canvas.height - 80);
      ctx.fillText(`Face Width: ${(faceGeometry.faceWidth * 1000).toFixed(1)}mm`, 15, canvas.height - 60);
      ctx.fillText(`Face Height: ${(faceGeometry.faceHeight * 1000).toFixed(1)}mm`, 15, canvas.height - 40);
      ctx.fillText(`Nose Length: ${(faceGeometry.noseLength * 1000).toFixed(1)}mm`, 15, canvas.height - 20);
    }

  }, [headPose, faceGeometry, glassesAnchors, quality, camera, showPose, showGeometry, showAnchors, showQuality, videoRef, projectToScreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        transform: 'scaleX(-1)', // Mirror to match video
      }}
    />
  );
};
