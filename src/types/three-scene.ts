// Three.js scene types and interfaces

import * as THREE from 'three';

export interface SceneConfig {
  antialias: boolean;
  alpha: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
  preserveDrawingBuffer: boolean;
}

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: {
      x: number;
      y: number;
      z: number;
    };
    castShadow: boolean;
  };
}

export interface SceneState {
  isInitialized: boolean;
  isRendering: boolean;
  error: string | null;
  frameCount: number;
  fps: number;
  lastFrameTime: number;
  renderTime: number;
}

export interface ThreeJSContext {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  canvas: HTMLCanvasElement | null;
  animationId: number | null;
}

export interface RenderStats {
  fps: number;
  frameCount: number;
  renderTime: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

export interface ViewportDimensions {
  width: number;
  height: number;
  aspect: number;
  pixelRatio: number;
}

export interface SceneObject {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
}

// Default configurations
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
};

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: {
    x: 0,
    y: 0,
    z: 5,
  },
};

export const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    color: '#404040',
    intensity: 0.6,
  },
  directional: {
    color: '#ffffff',
    intensity: 0.8,
    position: {
      x: 1,
      y: 1,
      z: 1,
    },
    castShadow: true,
  },
};
