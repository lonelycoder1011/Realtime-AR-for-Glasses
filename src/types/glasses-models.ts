// Glasses 3D model types and interfaces

import * as THREE from 'three';

export interface GlassesModelData {
  id: string;
  name: string;
  brand: string;
  category: 'sunglasses' | 'eyeglasses' | 'reading' | 'safety';
  frameMaterial: 'metal' | 'plastic' | 'acetate' | 'titanium' | 'wood';
  lensType: 'clear' | 'tinted' | 'prescription' | 'polarized';
  frameColor: string;
  lensColor: string;
  price: number;
  thumbnailUrl: string;
  modelUrl?: string; // For GLTF/GLB files
  dimensions: {
    lensWidth: number;
    lensHeight: number;
    bridgeWidth: number;
    templeLength: number;
    frameWidth: number;
  };
}

export interface GlassesModel3D {
  id: string;
  data: GlassesModelData;
  mesh: THREE.Group;
  components: {
    frame: THREE.Mesh | null;
    leftLens: THREE.Mesh | null;
    rightLens: THREE.Mesh | null;
    leftTemple: THREE.Mesh | null;
    rightTemple: THREE.Mesh | null;
    bridge: THREE.Mesh | null;
  };
  materials: {
    frame: THREE.Material;
    lens: THREE.Material;
    temple: THREE.Material;
  };
  boundingBox: THREE.Box3;
  isLoaded: boolean;
}

export interface MaterialProperties {
  metallic: number;
  roughness: number;
  color: string;
  opacity: number;
  transparent: boolean;
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
}

export interface GlassesModelLoader {
  loadModel: (modelData: GlassesModelData) => Promise<GlassesModel3D>;
  createProceduralModel: (modelData: GlassesModelData) => GlassesModel3D;
  updateMaterials: (model: GlassesModel3D, materials: Partial<MaterialProperties>) => void;
  disposeModel: (model: GlassesModel3D) => void;
}

export interface GlassesCollection {
  models: Map<string, GlassesModel3D>;
  activeModel: string | null;
  loadingStates: Map<string, boolean>;
  errors: Map<string, string>;
}

// Predefined glasses model templates
export const GLASSES_TEMPLATES: GlassesModelData[] = [
  {
    id: 'classic-aviator',
    name: 'Classic Aviator',
    brand: 'AR Glasses',
    category: 'sunglasses',
    frameMaterial: 'metal',
    lensType: 'tinted',
    frameColor: '#C0C0C0', // Silver
    lensColor: '#404040', // Dark gray
    price: 129.99,
    thumbnailUrl: '/models/aviator-thumb.jpg',
    dimensions: {
      lensWidth: 0.055, // 55mm
      lensHeight: 0.048, // 48mm
      bridgeWidth: 0.019, // 19mm
      templeLength: 0.145, // 145mm
      frameWidth: 0.140, // 140mm
    },
  },
  {
    id: 'modern-rectangular',
    name: 'Modern Rectangular',
    brand: 'AR Glasses',
    category: 'eyeglasses',
    frameMaterial: 'acetate',
    lensType: 'clear',
    frameColor: '#2C2C2C', // Dark gray
    lensColor: '#F0F0F0', // Light gray (clear)
    price: 89.99,
    thumbnailUrl: '/models/rectangular-thumb.jpg',
    dimensions: {
      lensWidth: 0.052, // 52mm
      lensHeight: 0.038, // 38mm
      bridgeWidth: 0.018, // 18mm
      templeLength: 0.140, // 140mm
      frameWidth: 0.135, // 135mm
    },
  },
  {
    id: 'round-vintage',
    name: 'Round Vintage',
    brand: 'AR Glasses',
    category: 'eyeglasses',
    frameMaterial: 'metal',
    lensType: 'clear',
    frameColor: '#B8860B', // Dark goldenrod
    lensColor: '#F5F5F5', // White smoke (clear)
    price: 109.99,
    thumbnailUrl: '/models/round-thumb.jpg',
    dimensions: {
      lensWidth: 0.048, // 48mm
      lensHeight: 0.048, // 48mm (round)
      bridgeWidth: 0.020, // 20mm
      templeLength: 0.142, // 142mm
      frameWidth: 0.130, // 130mm
    },
  },
  {
    id: 'sport-wraparound',
    name: 'Sport Wraparound',
    brand: 'AR Glasses',
    category: 'sunglasses',
    frameMaterial: 'plastic',
    lensType: 'polarized',
    frameColor: '#FF4500', // Orange red
    lensColor: '#1C1C1C', // Very dark gray
    price: 159.99,
    thumbnailUrl: '/models/sport-thumb.jpg',
    dimensions: {
      lensWidth: 0.065, // 65mm
      lensHeight: 0.045, // 45mm
      bridgeWidth: 0.015, // 15mm
      templeLength: 0.135, // 135mm
      frameWidth: 0.145, // 145mm
    },
  },
  {
    id: 'cat-eye-retro',
    name: 'Cat Eye Retro',
    brand: 'AR Glasses',
    category: 'sunglasses',
    frameMaterial: 'acetate',
    lensType: 'tinted',
    frameColor: '#8B4513', // Saddle brown
    lensColor: '#8B4513', // Brown tint
    price: 119.99,
    thumbnailUrl: '/models/cateye-thumb.jpg',
    dimensions: {
      lensWidth: 0.056, // 56mm
      lensHeight: 0.042, // 42mm
      bridgeWidth: 0.017, // 17mm
      templeLength: 0.140, // 140mm
      frameWidth: 0.138, // 138mm
    },
  },
];

// Material presets for different frame materials
export const MATERIAL_PRESETS: Record<string, MaterialProperties> = {
  metal: {
    metallic: 0.8,
    roughness: 0.2,
    color: '#C0C0C0',
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 1.0,
  },
  plastic: {
    metallic: 0.0,
    roughness: 0.4,
    color: '#2C2C2C',
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 0.5,
  },
  acetate: {
    metallic: 0.1,
    roughness: 0.3,
    color: '#8B4513',
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 0.7,
  },
  titanium: {
    metallic: 0.9,
    roughness: 0.1,
    color: '#708090',
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 1.2,
  },
  wood: {
    metallic: 0.0,
    roughness: 0.8,
    color: '#8B4513',
    opacity: 1.0,
    transparent: false,
    envMapIntensity: 0.3,
  },
};

// Lens material presets
export const LENS_MATERIAL_PRESETS: Record<string, MaterialProperties> = {
  clear: {
    metallic: 0.0,
    roughness: 0.0,
    color: '#FFFFFF',
    opacity: 0.1,
    transparent: true,
    envMapIntensity: 1.0,
  },
  tinted: {
    metallic: 0.0,
    roughness: 0.0,
    color: '#404040',
    opacity: 0.8,
    transparent: true,
    envMapIntensity: 0.8,
  },
  polarized: {
    metallic: 0.0,
    roughness: 0.0,
    color: '#1C1C1C',
    opacity: 0.9,
    transparent: true,
    envMapIntensity: 0.6,
  },
  prescription: {
    metallic: 0.0,
    roughness: 0.0,
    color: '#F0F0F0',
    opacity: 0.05,
    transparent: true,
    envMapIntensity: 1.2,
  },
};
