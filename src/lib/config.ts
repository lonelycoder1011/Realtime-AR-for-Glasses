// Application configuration
export const APP_CONFIG = {
  camera: {
    defaultWidth: 1280,
    defaultHeight: 720,
    frameRate: 30,
    facingMode: 'user' as const,
  },
  ar: {
    targetFPS: 30,
    faceDetectionConfidence: 0.7,
    maxFaces: 1,
    smoothingFactor: 0.8,
  },
  three: {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance' as const,
  },
  mediapipe: {
    modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
} as const;

export const GLASSES_CATEGORIES = [
  'sunglasses',
  'eyeglasses', 
  'reading',
] as const;

export const FRAME_MATERIALS = [
  'metal',
  'plastic',
  'acetate',
  'titanium',
] as const;

export const LENS_TYPES = [
  'clear',
  'tinted',
  'prescription',
] as const;
