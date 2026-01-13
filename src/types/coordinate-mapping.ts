// Enhanced coordinate mapping types and interfaces

import * as THREE from 'three';
import { FaceLandmark } from '@/types/face-detection';

export interface HeadPose {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  scale: number;
}

export interface FaceGeometry {
  // Key facial measurements
  eyeDistance: number;
  faceWidth: number;
  faceHeight: number;
  noseLength: number;
  templeWidth: number;
  
  // 3D positions of key points
  leftEye: THREE.Vector3;
  rightEye: THREE.Vector3;
  noseBridge: THREE.Vector3;
  noseTip: THREE.Vector3;
  leftTemple: THREE.Vector3;
  rightTemple: THREE.Vector3;
  
  // Face orientation vectors
  eyeVector: THREE.Vector3;
  noseVector: THREE.Vector3;
  faceNormal: THREE.Vector3;
}

export interface GlassesAnchorPoints {
  // Primary anchor points for glasses positioning
  bridgeCenter: THREE.Vector3;
  leftLensCenter: THREE.Vector3;
  rightLensCenter: THREE.Vector3;
  leftTempleStart: THREE.Vector3;
  rightTempleStart: THREE.Vector3;
  
  // Frame dimensions
  lensWidth: number;
  lensHeight: number;
  bridgeWidth: number;
  templeLength: number;
}

export interface CoordinateTransform {
  // Transformation matrices
  faceToWorld: THREE.Matrix4;
  worldToFace: THREE.Matrix4;
  
  // Camera projection
  viewMatrix: THREE.Matrix4;
  projectionMatrix: THREE.Matrix4;
  
  // Viewport transformation
  viewportMatrix: THREE.Matrix4;
}

export interface CalibrationData {
  // Camera calibration
  focalLength: number;
  principalPoint: THREE.Vector2;
  distortion: number[];
  
  // Face calibration
  averageEyeDistance: number;
  averageFaceWidth: number;
  averageFaceHeight: number;
  
  // Depth estimation parameters
  depthScale: number;
  depthOffset: number;
}

export interface MappingQuality {
  confidence: number;
  stability: number;
  accuracy: number;
  trackingLoss: number;
}

// Enhanced landmark indices with more precision
export const ENHANCED_FACE_LANDMARKS = {
  // Eye region (more detailed)
  LEFT_EYE: {
    CENTER: 468,
    INNER_CORNER: 133,
    OUTER_CORNER: 33,
    TOP: 159,
    BOTTOM: 145,
    PUPIL: 468, // Approximated
  },
  RIGHT_EYE: {
    CENTER: 473,
    INNER_CORNER: 362,
    OUTER_CORNER: 263,
    TOP: 386,
    BOTTOM: 374,
    PUPIL: 473, // Approximated
  },
  
  // Nose region (detailed)
  NOSE: {
    TIP: 1,
    BRIDGE_TOP: 6,
    BRIDGE_MID: 168,
    BRIDGE_BOTTOM: 8,
    LEFT_NOSTRIL: 2,
    RIGHT_NOSTRIL: 5,
    LEFT_WING: 31,
    RIGHT_WING: 35,
  },
  
  // Eyebrow region
  LEFT_EYEBROW: {
    INNER: 70,
    MID: 107,
    OUTER: 46,
  },
  RIGHT_EYEBROW: {
    INNER: 300,
    MID: 336,
    OUTER: 276,
  },
  
  // Temple/ear region
  TEMPLE: {
    LEFT: 234,
    RIGHT: 454,
    LEFT_TOP: 162,
    RIGHT_TOP: 389,
  },
  
  // Face outline (more points)
  FACE_OUTLINE: {
    LEFT_EDGE: 172,
    RIGHT_EDGE: 397,
    TOP: 10,
    BOTTOM: 152,
    LEFT_CHEEK: 116,
    RIGHT_CHEEK: 345,
    CHIN: 18,
  },
  
  // Forehead region
  FOREHEAD: {
    CENTER: 9,
    LEFT: 21,
    RIGHT: 251,
  },
} as const;
