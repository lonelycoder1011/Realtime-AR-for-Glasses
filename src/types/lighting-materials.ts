// Advanced lighting and materials types

import * as THREE from 'three';

export interface LightingConfig {
  // Environment lighting
  environmentIntensity: number;
  environmentRotation: number;
  
  // Directional lighting
  directional: {
    intensity: number;
    color: string;
    position: THREE.Vector3;
    castShadow: boolean;
    shadowMapSize: number;
    shadowCameraNear: number;
    shadowCameraFar: number;
    shadowBias: number;
  };
  
  // Ambient lighting
  ambient: {
    intensity: number;
    color: string;
  };
  
  // Point lights for face illumination
  faceLight: {
    intensity: number;
    color: string;
    distance: number;
    decay: number;
  };
  
  // Rim lighting for glasses edges
  rimLight: {
    intensity: number;
    color: string;
    position: THREE.Vector3;
  };
}

export interface PBRMaterialProperties {
  // Base properties
  color: string;
  metalness: number;
  roughness: number;
  
  // Advanced properties
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number; // Index of refraction
  
  // Texture properties
  normalScale: number;
  envMapIntensity: number;
  
  // Emission
  emissive: string;
  emissiveIntensity: number;
}

export interface LensMaterialProperties extends PBRMaterialProperties {
  // Lens-specific properties
  transparency: number;
  refractionRatio: number;
  fresnelBias: number;
  fresnelScale: number;
  fresnelPower: number;
  
  // Lens effects
  chromaticAberration: number;
  distortion: number;
  
  // Tinting
  tintColor: string;
  tintIntensity: number;
}

export interface FrameMaterialProperties extends PBRMaterialProperties {
  // Frame-specific properties
  anisotropy: number;
  anisotropyRotation: number;
  
  // Surface properties
  bumpScale: number;
  displacementScale: number;
  
  // Wear and aging
  wearFactor: number;
  scratchIntensity: number;
}

export interface MaterialPreset {
  id: string;
  name: string;
  category: 'metal' | 'plastic' | 'acetate' | 'titanium' | 'wood' | 'carbon';
  properties: FrameMaterialProperties;
  thumbnailColor: string;
}

export interface LensPreset {
  id: string;
  name: string;
  category: 'clear' | 'tinted' | 'polarized' | 'photochromic' | 'blue-light';
  properties: LensMaterialProperties;
  thumbnailColor: string;
}

export interface EnvironmentMap {
  id: string;
  name: string;
  url: string;
  intensity: number;
  rotation: number;
  type: 'hdr' | 'exr' | 'cube';
}

export interface ShadowConfig {
  enabled: boolean;
  type: 'basic' | 'pcf' | 'pcfsoft' | 'vsm';
  mapSize: number;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
}

export interface AmbientOcclusionConfig {
  enabled: boolean;
  intensity: number;
  radius: number;
  samples: number;
  rings: number;
  distanceExponent: number;
  bias: number;
}

export interface RenderingEffects {
  bloom: {
    enabled: boolean;
    strength: number;
    radius: number;
    threshold: number;
  };
  
  toneMappingExposure: number;
  toneMappingType: 'linear' | 'reinhard' | 'cineon' | 'aces';
  
  colorGrading: {
    enabled: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
  };
}

// Default configurations
export const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  environmentIntensity: 1.0,
  environmentRotation: 0,
  
  directional: {
    intensity: 2.0,
    color: '#ffffff',
    position: new THREE.Vector3(5, 5, 5),
    castShadow: true,
    shadowMapSize: 2048,
    shadowCameraNear: 0.5,
    shadowCameraFar: 50,
    shadowBias: -0.0001,
  },
  
  ambient: {
    intensity: 0.4,
    color: '#404040',
  },
  
  faceLight: {
    intensity: 0.8,
    color: '#ffffff',
    distance: 2,
    decay: 2,
  },
  
  rimLight: {
    intensity: 1.5,
    color: '#ffffff',
    position: new THREE.Vector3(-2, 2, 2),
  },
};

// Material presets
export const FRAME_MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'brushed-metal',
    name: 'Brushed Metal',
    category: 'metal',
    properties: {
      color: '#C0C0C0',
      metalness: 0.9,
      roughness: 0.3,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      transmission: 0.0,
      thickness: 0.0,
      ior: 1.5,
      normalScale: 1.0,
      envMapIntensity: 1.0,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      anisotropy: 0.8,
      anisotropyRotation: 0,
      bumpScale: 0.02,
      displacementScale: 0.0,
      wearFactor: 0.1,
      scratchIntensity: 0.05,
    },
    thumbnailColor: '#C0C0C0',
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    category: 'plastic',
    properties: {
      color: '#1a1a1a',
      metalness: 0.0,
      roughness: 0.8,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      transmission: 0.0,
      thickness: 0.0,
      ior: 1.5,
      normalScale: 0.5,
      envMapIntensity: 0.3,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      anisotropy: 0.0,
      anisotropyRotation: 0,
      bumpScale: 0.01,
      displacementScale: 0.0,
      wearFactor: 0.05,
      scratchIntensity: 0.02,
    },
    thumbnailColor: '#1a1a1a',
  },
  {
    id: 'tortoiseshell',
    name: 'Tortoiseshell',
    category: 'acetate',
    properties: {
      color: '#8B4513',
      metalness: 0.1,
      roughness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transmission: 0.0,
      thickness: 0.0,
      ior: 1.5,
      normalScale: 0.8,
      envMapIntensity: 0.7,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      anisotropy: 0.0,
      anisotropyRotation: 0,
      bumpScale: 0.03,
      displacementScale: 0.0,
      wearFactor: 0.15,
      scratchIntensity: 0.08,
    },
    thumbnailColor: '#8B4513',
  },
];

export const LENS_MATERIAL_PRESETS: LensPreset[] = [
  {
    id: 'clear-glass',
    name: 'Clear Glass',
    category: 'clear',
    properties: {
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      transmission: 1.0,
      thickness: 0.5,
      ior: 1.52, // Glass IOR
      normalScale: 0.0,
      envMapIntensity: 1.0,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      transparency: 0.95,
      refractionRatio: 0.98,
      fresnelBias: 0.1,
      fresnelScale: 1.0,
      fresnelPower: 2.0,
      chromaticAberration: 0.01,
      distortion: 0.0,
      tintColor: '#ffffff',
      tintIntensity: 0.0,
    },
    thumbnailColor: '#f0f0f0',
  },
  {
    id: 'gray-tint',
    name: 'Gray Tint',
    category: 'tinted',
    properties: {
      color: '#808080',
      metalness: 0.0,
      roughness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      transmission: 0.3,
      thickness: 0.5,
      ior: 1.52,
      normalScale: 0.0,
      envMapIntensity: 0.8,
      emissive: '#000000',
      emissiveIntensity: 0.0,
      transparency: 0.7,
      refractionRatio: 0.98,
      fresnelBias: 0.1,
      fresnelScale: 1.0,
      fresnelPower: 2.0,
      chromaticAberration: 0.005,
      distortion: 0.0,
      tintColor: '#808080',
      tintIntensity: 0.3,
    },
    thumbnailColor: '#808080',
  },
];

export const ENVIRONMENT_MAPS: EnvironmentMap[] = [
  {
    id: 'studio',
    name: 'Studio',
    url: '/hdri/studio.hdr',
    intensity: 1.0,
    rotation: 0,
    type: 'hdr',
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    url: '/hdri/outdoor.hdr',
    intensity: 1.2,
    rotation: 0,
    type: 'hdr',
  },
  {
    id: 'indoor',
    name: 'Indoor',
    url: '/hdri/indoor.hdr',
    intensity: 0.8,
    rotation: 0,
    type: 'hdr',
  },
];
