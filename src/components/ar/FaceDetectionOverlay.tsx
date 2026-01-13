'use client';

import React, { useRef, useEffect } from 'react';
import { useFaceDetectionContext } from './FaceDetectionProvider';
import { denormalizeLandmarks } from '@/lib/mediapipe/face-mesh-utils';
import { FACE_LANDMARKS } from '@/types/face-detection';

interface FaceDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  showKeyPoints?: boolean;
  className?: string;
}

export const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({
  videoRef,
  showLandmarks = false,
  showBoundingBox = true,
  showKeyPoints = true,
  className = '',
}) => {
  const { state } = useFaceDetectionContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !state.lastDetection) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { lastDetection } = state;
    
    // Convert normalized coordinates to canvas coordinates
    const landmarks = denormalizeLandmarks(
      lastDetection.landmarks,
      canvas.width,
      canvas.height
    );

    // Draw bounding box
    if (showBoundingBox) {
      const bbox = lastDetection.boundingBox;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        bbox.x * canvas.width,
        bbox.y * canvas.height,
        bbox.width * canvas.width,
        bbox.height * canvas.height
      );
    }

    // Draw key points for glasses positioning
    if (showKeyPoints) {
      ctx.fillStyle = '#ff0000';
      
      // Eye centers
      const leftEye = landmarks[FACE_LANDMARKS.LEFT_EYE_CENTER] || lastDetection.eyePositions.left;
      const rightEye = landmarks[FACE_LANDMARKS.RIGHT_EYE_CENTER] || lastDetection.eyePositions.right;
      
      if (leftEye && rightEye) {
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw line between eyes
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftEye.x, leftEye.y);
        ctx.lineTo(rightEye.x, rightEye.y);
        ctx.stroke();
      }

      // Nose bridge
      ctx.fillStyle = '#0000ff';
      const noseBridgeTop = landmarks[FACE_LANDMARKS.NOSE_BRIDGE_TOP];
      const noseBridgeMid = landmarks[FACE_LANDMARKS.NOSE_BRIDGE_MID];
      
      if (noseBridgeTop) {
        ctx.beginPath();
        ctx.arc(noseBridgeTop.x, noseBridgeTop.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      if (noseBridgeMid) {
        ctx.beginPath();
        ctx.arc(noseBridgeMid.x, noseBridgeMid.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Temple points
      ctx.fillStyle = '#ffff00';
      const leftTemple = landmarks[FACE_LANDMARKS.LEFT_TEMPLE];
      const rightTemple = landmarks[FACE_LANDMARKS.RIGHT_TEMPLE];
      
      if (leftTemple) {
        ctx.beginPath();
        ctx.arc(leftTemple.x, leftTemple.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      if (rightTemple) {
        ctx.beginPath();
        ctx.arc(rightTemple.x, rightTemple.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw all landmarks (debug mode)
    if (showLandmarks) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw face center
    const faceCenter = {
      x: lastDetection.faceCenter.x * canvas.width,
      y: lastDetection.faceCenter.y * canvas.height,
    };
    
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(faceCenter.x, faceCenter.y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw confidence and info text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`Confidence: ${(lastDetection.confidence * 100).toFixed(1)}%`, 10, 25);
    ctx.fillText(`Eye Distance: ${lastDetection.eyeDistance.toFixed(3)}`, 10, 45);
    ctx.fillText(`FPS: ${state.fps}`, 10, 65);

  }, [state.lastDetection, state.fps, showLandmarks, showBoundingBox, showKeyPoints, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        transform: 'scaleX(-1)', // Mirror to match video
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 5,
      }}
    />
  );
};
