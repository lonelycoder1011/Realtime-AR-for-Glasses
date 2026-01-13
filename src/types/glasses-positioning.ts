// Real-time glasses positioning types and interfaces

import * as THREE from 'three';
import { HeadPose, FaceGeometry, GlassesAnchorPoints } from '@/types/coordinate-mapping';

export interface GlassesPositionState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  confidence: number;
  isStable: boolean;
  lastUpdate: number;
}

export interface PositioningConfig {
  // Smoothing parameters
  positionSmoothingFactor: number;
  rotationSmoothingFactor: number;
  scaleSmoothingFactor: number;
  
  // Stability filters
  stabilityThreshold: number;
  jitterReductionFactor: number;
  outlierDetectionThreshold: number;
  
  // Scaling parameters
  baseScale: number;
  minScale: number;
  maxScale: number;
  scaleAdaptationRate: number;
  
  // Position offsets
  positionOffset: THREE.Vector3;
  rotationOffset: THREE.Euler;
  
  // Tracking parameters
  trackingLossTimeout: number;
  recoveryFrames: number;
}

export interface KalmanFilterState {
  // State vector [x, y, z, vx, vy, vz]
  state: Float32Array;
  // Covariance matrix
  covariance: Float32Array;
  // Process noise
  processNoise: number;
  // Measurement noise
  measurementNoise: number;
  // Time delta
  dt: number;
}

export interface TrackingHistory {
  positions: THREE.Vector3[];
  rotations: THREE.Euler[];
  scales: number[];
  timestamps: number[];
  confidences: number[];
  maxHistorySize: number;
}

export interface PositioningQuality {
  stability: number;
  accuracy: number;
  smoothness: number;
  responsiveness: number;
  overallScore: number;
}

export interface GlassesTransform {
  // World transform
  worldMatrix: THREE.Matrix4;
  // Local transforms for components
  frameTransform: THREE.Matrix4;
  leftLensTransform: THREE.Matrix4;
  rightLensTransform: THREE.Matrix4;
  leftTempleTransform: THREE.Matrix4;
  rightTempleTransform: THREE.Matrix4;
  bridgeTransform: THREE.Matrix4;
}

export interface PositioningAlgorithm {
  name: string;
  description: string;
  process: (
    headPose: HeadPose,
    faceGeometry: FaceGeometry,
    glassesAnchors: GlassesAnchorPoints,
    previousState?: GlassesPositionState
  ) => GlassesPositionState;
}

export interface AdaptiveScaling {
  // Face measurements for scaling
  eyeDistance: number;
  faceWidth: number;
  faceHeight: number;
  
  // Scaling factors
  horizontalScale: number;
  verticalScale: number;
  depthScale: number;
  
  // Adaptation parameters
  adaptationSpeed: number;
  stabilityFactor: number;
}

export interface JitterReduction {
  // Moving average filters
  positionFilter: MovingAverageFilter;
  rotationFilter: MovingAverageFilter;
  scaleFilter: MovingAverageFilter;
  
  // Outlier detection
  outlierThreshold: number;
  consecutiveOutliers: number;
  maxOutliers: number;
}

export interface MovingAverageFilter {
  values: number[];
  windowSize: number;
  currentIndex: number;
  sum: number;
  isInitialized: boolean;
}

// Default positioning configuration
export const DEFAULT_POSITIONING_CONFIG: PositioningConfig = {
  // Smoothing parameters
  positionSmoothingFactor: 0.7,
  rotationSmoothingFactor: 0.8,
  scaleSmoothingFactor: 0.6,
  
  // Stability filters
  stabilityThreshold: 0.85,
  jitterReductionFactor: 0.3,
  outlierDetectionThreshold: 0.1,
  
  // Scaling parameters
  baseScale: 1.0,
  minScale: 0.5,
  maxScale: 2.0,
  scaleAdaptationRate: 0.1,
  
  // Position offsets
  positionOffset: new THREE.Vector3(0, 0.005, 0), // 5mm up
  rotationOffset: new THREE.Euler(0, 0, 0),
  
  // Tracking parameters
  trackingLossTimeout: 1000, // 1 second
  recoveryFrames: 5,
};

// Positioning algorithm types
export const POSITIONING_ALGORITHMS = {
  BASIC: 'basic',
  KALMAN: 'kalman',
  ADAPTIVE: 'adaptive',
  HYBRID: 'hybrid',
} as const;

export type PositioningAlgorithmType = typeof POSITIONING_ALGORITHMS[keyof typeof POSITIONING_ALGORITHMS];
