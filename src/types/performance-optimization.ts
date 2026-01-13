// Performance optimization types and interfaces

export interface PerformanceMetrics {
  // Frame rate metrics
  fps: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  
  // Rendering metrics
  drawCalls: number;
  triangles: number;
  vertices: number;
  geometries: number;
  textures: number;
  programs: number;
  
  // Memory metrics
  memoryUsage: {
    geometries: number;
    textures: number;
    programs: number;
    total: number;
  };
  
  // GPU metrics
  gpuMemory: number;
  gpuUtilization: number;
  
  // Processing metrics
  faceDetectionTime: number;
  coordinateMappingTime: number;
  positioningTime: number;
  renderingTime: number;
  
  // Quality metrics
  lodLevel: number;
  textureQuality: number;
  shadowQuality: number;
  
  // Device metrics
  devicePixelRatio: number;
  canvasSize: { width: number; height: number };
  isLowEndDevice: boolean;
}

export interface PerformanceConfig {
  // Target performance
  targetFps: number;
  minFps: number;
  adaptiveQuality: boolean;
  
  // LOD settings
  lodEnabled: boolean;
  lodDistances: number[];
  lodBias: number;
  
  // Texture settings
  maxTextureSize: number;
  textureCompression: boolean;
  mipmapGeneration: boolean;
  anisotropicFiltering: number;
  
  // Rendering settings
  shadowMapSize: number;
  shadowCascades: number;
  antialiasing: boolean;
  postProcessing: boolean;
  
  // Face detection optimization
  faceDetectionInterval: number;
  landmarkSmoothing: number;
  confidenceThreshold: number;
  
  // Memory management
  texturePoolSize: number;
  geometryPoolSize: number;
  garbageCollectionInterval: number;
  
  // Mobile optimizations
  reducedPrecision: boolean;
  simplifiedShaders: boolean;
  reducedParticles: boolean;
}

export interface LODLevel {
  distance: number;
  vertexCount: number;
  textureSize: number;
  materialComplexity: 'low' | 'medium' | 'high';
  shadowCasting: boolean;
  reflections: boolean;
}

export interface TextureCompressionOptions {
  format: 'DXT1' | 'DXT5' | 'ETC1' | 'ETC2' | 'ASTC' | 'PVRTC';
  quality: number;
  generateMipmaps: boolean;
  maxSize: number;
}

export interface RenderingOptimizations {
  // Culling
  frustumCulling: boolean;
  occlusionCulling: boolean;
  backfaceCulling: boolean;
  
  // Batching
  instancedRendering: boolean;
  geometryMerging: boolean;
  texturePacking: boolean;
  
  // Shaders
  shaderOptimization: boolean;
  uniformBuffers: boolean;
  shaderCaching: boolean;
  
  // Post-processing
  bloomEnabled: boolean;
  ssaoEnabled: boolean;
  fxaaEnabled: boolean;
  temporalAA: boolean;
}

export interface DeviceCapabilities {
  // Hardware info
  gpu: string;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  maxVaryingVectors: number;
  
  // WebGL capabilities
  webglVersion: number;
  extensions: string[];
  maxAnisotropy: number;
  floatTextures: boolean;
  depthTextures: boolean;
  
  // Performance tier
  tier: 'low' | 'medium' | 'high';
  score: number;
  
  // Device type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Memory
  deviceMemory: number;
  hardwareConcurrency: number;
}

export interface PerformanceProfile {
  name: string;
  description: string;
  config: PerformanceConfig;
  minRequirements: Partial<DeviceCapabilities>;
}

export interface AdaptiveQualitySettings {
  enabled: boolean;
  fpsThreshold: number;
  adjustmentSpeed: number;
  
  // Quality levels
  levels: {
    textureQuality: number;
    shadowQuality: number;
    lodBias: number;
    effectsQuality: number;
  }[];
  
  currentLevel: number;
  targetLevel: number;
}

// Default configurations
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  // Target performance
  targetFps: 60,
  minFps: 30,
  adaptiveQuality: true,
  
  // LOD settings
  lodEnabled: true,
  lodDistances: [0.5, 2.0, 5.0],
  lodBias: 0.0,
  
  // Texture settings
  maxTextureSize: 1024,
  textureCompression: true,
  mipmapGeneration: true,
  anisotropicFiltering: 4,
  
  // Rendering settings
  shadowMapSize: 1024,
  shadowCascades: 2,
  antialiasing: true,
  postProcessing: true,
  
  // Face detection optimization
  faceDetectionInterval: 33, // ~30fps
  landmarkSmoothing: 0.7,
  confidenceThreshold: 0.6,
  
  // Memory management
  texturePoolSize: 50,
  geometryPoolSize: 20,
  garbageCollectionInterval: 5000,
  
  // Mobile optimizations
  reducedPrecision: false,
  simplifiedShaders: false,
  reducedParticles: false,
};

export const PERFORMANCE_PROFILES: PerformanceProfile[] = [
  {
    name: 'Ultra',
    description: 'Maximum quality for high-end devices',
    config: {
      ...DEFAULT_PERFORMANCE_CONFIG,
      targetFps: 60,
      maxTextureSize: 2048,
      shadowMapSize: 2048,
      anisotropicFiltering: 16,
      postProcessing: true,
    },
    minRequirements: {
      tier: 'high',
      webglVersion: 2,
      deviceMemory: 8,
    },
  },
  {
    name: 'High',
    description: 'High quality for mid-range devices',
    config: {
      ...DEFAULT_PERFORMANCE_CONFIG,
      targetFps: 60,
      maxTextureSize: 1024,
      shadowMapSize: 1024,
      anisotropicFiltering: 8,
    },
    minRequirements: {
      tier: 'medium',
      webglVersion: 2,
      deviceMemory: 4,
    },
  },
  {
    name: 'Medium',
    description: 'Balanced quality and performance',
    config: {
      ...DEFAULT_PERFORMANCE_CONFIG,
      targetFps: 30,
      maxTextureSize: 512,
      shadowMapSize: 512,
      anisotropicFiltering: 4,
      postProcessing: false,
    },
    minRequirements: {
      tier: 'medium',
      webglVersion: 1,
      deviceMemory: 2,
    },
  },
  {
    name: 'Low',
    description: 'Optimized for low-end devices',
    config: {
      ...DEFAULT_PERFORMANCE_CONFIG,
      targetFps: 30,
      minFps: 20,
      maxTextureSize: 256,
      shadowMapSize: 256,
      anisotropicFiltering: 1,
      antialiasing: false,
      postProcessing: false,
      reducedPrecision: true,
      simplifiedShaders: true,
    },
    minRequirements: {
      tier: 'low',
      webglVersion: 1,
      deviceMemory: 1,
    },
  },
];

export const LOD_LEVELS: LODLevel[] = [
  {
    distance: 0.5,
    vertexCount: 10000,
    textureSize: 1024,
    materialComplexity: 'high',
    shadowCasting: true,
    reflections: true,
  },
  {
    distance: 2.0,
    vertexCount: 5000,
    textureSize: 512,
    materialComplexity: 'medium',
    shadowCasting: true,
    reflections: false,
  },
  {
    distance: 5.0,
    vertexCount: 1000,
    textureSize: 256,
    materialComplexity: 'low',
    shadowCasting: false,
    reflections: false,
  },
];

export const ADAPTIVE_QUALITY_SETTINGS: AdaptiveQualitySettings = {
  enabled: true,
  fpsThreshold: 5, // Adjust when FPS drops below target by this amount
  adjustmentSpeed: 0.1,
  
  levels: [
    // Level 0 - Lowest quality
    {
      textureQuality: 0.25,
      shadowQuality: 0.25,
      lodBias: 2.0,
      effectsQuality: 0.0,
    },
    // Level 1 - Low quality
    {
      textureQuality: 0.5,
      shadowQuality: 0.5,
      lodBias: 1.0,
      effectsQuality: 0.25,
    },
    // Level 2 - Medium quality
    {
      textureQuality: 0.75,
      shadowQuality: 0.75,
      lodBias: 0.5,
      effectsQuality: 0.5,
    },
    // Level 3 - High quality
    {
      textureQuality: 1.0,
      shadowQuality: 1.0,
      lodBias: 0.0,
      effectsQuality: 1.0,
    },
  ],
  
  currentLevel: 3,
  targetLevel: 3,
};
