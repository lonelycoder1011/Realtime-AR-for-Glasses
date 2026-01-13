// Core types for the glasses AR application

export interface GlassesModel {
  id: string;
  name: string;
  brand: string;
  price: number;
  modelPath: string;
  thumbnailPath: string;
  category: 'sunglasses' | 'eyeglasses' | 'reading';
  frameMaterial: 'metal' | 'plastic' | 'acetate' | 'titanium';
  lensType: 'clear' | 'tinted' | 'prescription';
  frameColor: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface HeadPose {
  rotation: {
    x: number; // pitch
    y: number; // yaw
    z: number; // roll
  };
  translation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface CameraConfig {
  width: number;
  height: number;
  frameRate: number;
  facingMode: 'user' | 'environment';
}

export interface GlassesPosition {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface ARSession {
  isActive: boolean;
  selectedGlasses: GlassesModel | null;
  cameraStream: MediaStream | null;
  faceLandmarks: FaceLandmarks | null;
  glassesPosition: GlassesPosition | null;
}
