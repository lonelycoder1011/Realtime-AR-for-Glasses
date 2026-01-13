// Face detection types and interfaces

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceDetectionResult {
  landmarks: FaceLandmark[];
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  faceCenter: {
    x: number;
    y: number;
  };
  eyeDistance: number;
  noseBridge: {
    top: FaceLandmark;
    bottom: FaceLandmark;
  };
  eyePositions: {
    left: FaceLandmark;
    right: FaceLandmark;
  };
}

export interface FaceDetectionState {
  isInitialized: boolean;
  isProcessing: boolean;
  lastDetection: FaceDetectionResult | null;
  error: string | null;
  frameCount: number;
  fps: number;
  detectionHistory: FaceDetectionResult[];
}

export interface FaceDetectionConfig {
  maxNumFaces: number;
  refineLandmarks: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  smoothingFactor: number;
  maxHistorySize: number;
}

export interface MediaPipeResults {
  multiFaceLandmarks?: Array<{
    landmark: Array<{ x: number; y: number; z: number }>;
  }>;
}

// Key landmark indices for glasses positioning
export const FACE_LANDMARKS = {
  // Eye landmarks
  LEFT_EYE_CENTER: 468,
  RIGHT_EYE_CENTER: 473,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  
  // Nose bridge landmarks
  NOSE_TIP: 1,
  NOSE_BRIDGE_TOP: 6,
  NOSE_BRIDGE_MID: 168,
  
  // Temple/ear landmarks
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  
  // Face outline
  FACE_LEFT: 172,
  FACE_RIGHT: 397,
  FACE_TOP: 10,
  FACE_BOTTOM: 152,
  
  // Eyebrow landmarks
  LEFT_EYEBROW_INNER: 70,
  LEFT_EYEBROW_OUTER: 46,
  RIGHT_EYEBROW_INNER: 300,
  RIGHT_EYEBROW_OUTER: 276,
} as const;
