// Adaptive quality system based on device performance

import * as THREE from 'three';
import { PerformanceMonitor } from './performance-monitor';
import { ShaderOptimizer, ShaderOptimizationConfig } from './shader-optimizer';
import { GeometryOptimizer, OptimizationConfig } from './geometry-optimizer';

export interface QualityLevel {
  name: string;
  targetFPS: number;
  renderScale: number;
  shadowMapSize: number;
  maxLights: number;
  enablePostProcessing: boolean;
  enableAntialiasing: boolean;
  enableBloom: boolean;
  enableSSAO: boolean;
  lodBias: number;
  textureQuality: number;
  geometryQuality: number;
  shaderOptimization: ShaderOptimizationConfig;
  geometryOptimization: OptimizationConfig;
}

export interface DeviceProfile {
  tier: 'low' | 'medium' | 'high' | 'ultra';
  gpu: string;
  memory: number;
  cores: number;
  webglVersion: number;
  maxTextureSize: number;
  score: number;
}

export class AdaptiveQualitySystem {
  private performanceMonitor: PerformanceMonitor;
  private shaderOptimizer: ShaderOptimizer;
  private geometryOptimizer: GeometryOptimizer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  private currentQualityLevel: number = 2; // Start with medium quality
  private qualityLevels: QualityLevel[];
  private deviceProfile: DeviceProfile;
  private adaptiveEnabled: boolean = true;
  private lastAdjustmentTime: number = 0;
  private adjustmentCooldown: number = 2000; // 2 seconds
  private frameTimeHistory: number[] = [];
  private targetFrameTime: number = 33.33; // 30 FPS

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.performanceMonitor = new PerformanceMonitor(renderer);
    this.shaderOptimizer = new ShaderOptimizer(renderer, this.getDefaultShaderConfig());
    this.geometryOptimizer = new GeometryOptimizer(this.getDefaultGeometryConfig());

    this.deviceProfile = this.detectDeviceProfile();
    this.qualityLevels = this.createQualityLevels();
    this.selectInitialQualityLevel();
  }

  /**
   * Create quality levels based on device capabilities
   */
  private createQualityLevels(): QualityLevel[] {
    return [
      // Ultra Low Quality (Emergency fallback)
      {
        name: 'Ultra Low',
        targetFPS: 20,
        renderScale: 0.5,
        shadowMapSize: 256,
        maxLights: 1,
        enablePostProcessing: false,
        enableAntialiasing: false,
        enableBloom: false,
        enableSSAO: false,
        lodBias: 2.0,
        textureQuality: 0.25,
        geometryQuality: 0.25,
        shaderOptimization: {
          enableInstancing: false,
          enableVertexCompression: true,
          enablePrecisionOptimization: true,
          enableDeadCodeElimination: true,
          enableUniformBuffers: false,
          maxLights: 1,
          shadowMapSize: 256,
        },
        geometryOptimization: {
          enableLOD: true,
          enableInstancing: false,
          enableFrustumCulling: true,
          enableOcclusionCulling: false,
          maxInstanceCount: 10,
          lodDistances: [0.5, 1.0, 3.0],
          simplificationRatio: [0.7, 0.4, 0.2],
        },
      },
      // Low Quality
      {
        name: 'Low',
        targetFPS: 30,
        renderScale: 0.75,
        shadowMapSize: 512,
        maxLights: 2,
        enablePostProcessing: false,
        enableAntialiasing: false,
        enableBloom: false,
        enableSSAO: false,
        lodBias: 1.5,
        textureQuality: 0.5,
        geometryQuality: 0.5,
        shaderOptimization: {
          enableInstancing: true,
          enableVertexCompression: true,
          enablePrecisionOptimization: true,
          enableDeadCodeElimination: true,
          enableUniformBuffers: false,
          maxLights: 2,
          shadowMapSize: 512,
        },
        geometryOptimization: {
          enableLOD: true,
          enableInstancing: true,
          enableFrustumCulling: true,
          enableOcclusionCulling: false,
          maxInstanceCount: 50,
          lodDistances: [0.5, 1.5, 4.0],
          simplificationRatio: [0.8, 0.6, 0.3],
        },
      },
      // Medium Quality
      {
        name: 'Medium',
        targetFPS: 30,
        renderScale: 1.0,
        shadowMapSize: 1024,
        maxLights: 4,
        enablePostProcessing: true,
        enableAntialiasing: true,
        enableBloom: false,
        enableSSAO: false,
        lodBias: 1.0,
        textureQuality: 0.75,
        geometryQuality: 0.75,
        shaderOptimization: {
          enableInstancing: true,
          enableVertexCompression: false,
          enablePrecisionOptimization: true,
          enableDeadCodeElimination: true,
          enableUniformBuffers: true,
          maxLights: 4,
          shadowMapSize: 1024,
        },
        geometryOptimization: {
          enableLOD: true,
          enableInstancing: true,
          enableFrustumCulling: true,
          enableOcclusionCulling: true,
          maxInstanceCount: 100,
          lodDistances: [1.0, 2.0, 5.0],
          simplificationRatio: [0.9, 0.7, 0.4],
        },
      },
      // High Quality
      {
        name: 'High',
        targetFPS: 30,
        renderScale: 1.0,
        shadowMapSize: 2048,
        maxLights: 6,
        enablePostProcessing: true,
        enableAntialiasing: true,
        enableBloom: true,
        enableSSAO: false,
        lodBias: 0.5,
        textureQuality: 1.0,
        geometryQuality: 1.0,
        shaderOptimization: {
          enableInstancing: true,
          enableVertexCompression: false,
          enablePrecisionOptimization: false,
          enableDeadCodeElimination: true,
          enableUniformBuffers: true,
          maxLights: 6,
          shadowMapSize: 2048,
        },
        geometryOptimization: {
          enableLOD: true,
          enableInstancing: true,
          enableFrustumCulling: true,
          enableOcclusionCulling: true,
          maxInstanceCount: 200,
          lodDistances: [1.5, 3.0, 8.0],
          simplificationRatio: [0.95, 0.8, 0.5],
        },
      },
      // Ultra Quality
      {
        name: 'Ultra',
        targetFPS: 60,
        renderScale: 1.0,
        shadowMapSize: 4096,
        maxLights: 8,
        enablePostProcessing: true,
        enableAntialiasing: true,
        enableBloom: true,
        enableSSAO: true,
        lodBias: 0.0,
        textureQuality: 1.0,
        geometryQuality: 1.0,
        shaderOptimization: {
          enableInstancing: true,
          enableVertexCompression: false,
          enablePrecisionOptimization: false,
          enableDeadCodeElimination: false,
          enableUniformBuffers: true,
          maxLights: 8,
          shadowMapSize: 4096,
        },
        geometryOptimization: {
          enableLOD: false,
          enableInstancing: true,
          enableFrustumCulling: true,
          enableOcclusionCulling: true,
          maxInstanceCount: 500,
          lodDistances: [2.0, 5.0, 15.0],
          simplificationRatio: [1.0, 0.9, 0.7],
        },
      },
    ];
  }

  /**
   * Detect device performance profile
   */
  private detectDeviceProfile(): DeviceProfile {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return {
        tier: 'low',
        gpu: 'Unknown',
        memory: 2,
        cores: 2,
        webglVersion: 1,
        maxTextureSize: 1024,
        score: 10,
      };
    }

    // Get GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const webglVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;

    // Get device info
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    // Calculate performance score
    let score = 0;

    // GPU scoring
    const gpuLower = gpu.toLowerCase();
    if (gpuLower.includes('nvidia')) {
      if (gpuLower.includes('rtx') || gpuLower.includes('gtx 1060') || gpuLower.includes('gtx 1070')) {
        score += 80;
      } else if (gpuLower.includes('gtx')) {
        score += 60;
      } else {
        score += 40;
      }
    } else if (gpuLower.includes('amd') || gpuLower.includes('radeon')) {
      if (gpuLower.includes('rx 580') || gpuLower.includes('rx 6')) {
        score += 70;
      } else {
        score += 50;
      }
    } else if (gpuLower.includes('intel')) {
      if (gpuLower.includes('iris') || gpuLower.includes('xe')) {
        score += 40;
      } else {
        score += 20;
      }
    } else {
      score += 30; // Unknown GPU
    }

    // Memory scoring
    score += Math.min(memory * 8, 32);

    // CPU scoring
    score += Math.min(cores * 5, 20);

    // WebGL version bonus
    if (webglVersion === 2) {
      score += 10;
    }

    // Texture size bonus
    if (maxTextureSize >= 4096) {
      score += 10;
    }

    // Mobile penalty
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      score *= 0.6;
    }

    // Determine tier
    let tier: 'low' | 'medium' | 'high' | 'ultra';
    if (score < 40) {
      tier = 'low';
    } else if (score < 70) {
      tier = 'medium';
    } else if (score < 100) {
      tier = 'high';
    } else {
      tier = 'ultra';
    }

    canvas.remove();

    return {
      tier,
      gpu,
      memory,
      cores,
      webglVersion,
      maxTextureSize,
      score,
    };
  }

  /**
   * Select initial quality level based on device profile
   */
  private selectInitialQualityLevel(): void {
    switch (this.deviceProfile.tier) {
      case 'low':
        this.currentQualityLevel = 1;
        break;
      case 'medium':
        this.currentQualityLevel = 2;
        break;
      case 'high':
        this.currentQualityLevel = 3;
        break;
      case 'ultra':
        this.currentQualityLevel = 4;
        break;
    }

    this.applyQualityLevel(this.currentQualityLevel);
  }

  /**
   * Update adaptive quality system
   */
  update(): void {
    if (!this.adaptiveEnabled) return;

    this.performanceMonitor.update();
    const metrics = this.performanceMonitor.getMetrics();
    
    // Track frame times
    this.frameTimeHistory.push(metrics.frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Check if adjustment is needed
    const currentTime = performance.now();
    if (currentTime - this.lastAdjustmentTime > this.adjustmentCooldown) {
      this.evaluatePerformance(metrics);
    }
  }

  /**
   * Evaluate performance and adjust quality if needed
   */
  private evaluatePerformance(metrics: any): void {
    const currentQuality = this.qualityLevels[this.currentQualityLevel];
    const targetFrameTime = 1000 / currentQuality.targetFPS;
    
    // Calculate average frame time over last 60 frames
    const avgFrameTime = this.frameTimeHistory.length > 0 
      ? this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length
      : metrics.frameTime;

    const performanceRatio = avgFrameTime / targetFrameTime;

    // Determine if quality adjustment is needed
    if (performanceRatio > 1.2 && this.currentQualityLevel > 0) {
      // Performance is poor, reduce quality
      this.setQualityLevel(this.currentQualityLevel - 1);
      console.log(`Quality reduced to ${this.qualityLevels[this.currentQualityLevel].name} (Frame time: ${avgFrameTime.toFixed(1)}ms)`);
    } else if (performanceRatio < 0.8 && this.currentQualityLevel < this.qualityLevels.length - 1) {
      // Performance is good, try increasing quality
      this.setQualityLevel(this.currentQualityLevel + 1);
      console.log(`Quality increased to ${this.qualityLevels[this.currentQualityLevel].name} (Frame time: ${avgFrameTime.toFixed(1)}ms)`);
    }
  }

  /**
   * Set specific quality level
   */
  setQualityLevel(level: number): void {
    level = Math.max(0, Math.min(this.qualityLevels.length - 1, level));
    
    if (level !== this.currentQualityLevel) {
      this.currentQualityLevel = level;
      this.applyQualityLevel(level);
      this.lastAdjustmentTime = performance.now();
    }
  }

  /**
   * Apply quality level settings
   */
  private applyQualityLevel(level: number): void {
    const quality = this.qualityLevels[level];

    // Update render scale
    const canvas = this.renderer.domElement;
    const pixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(pixelRatio * quality.renderScale);

    // Update shadow settings
    this.renderer.shadowMap.enabled = quality.shadowMapSize > 0;
    if (quality.shadowMapSize > 0) {
      this.updateShadowMapSize(quality.shadowMapSize);
    }

    // Update antialiasing
    if (quality.enableAntialiasing !== this.renderer.capabilities.antialias) {
      // Note: Antialiasing can't be changed after renderer creation
      console.warn('Antialiasing setting requires renderer recreation');
    }

    // Update shader optimizer
    this.shaderOptimizer.updateConfig(quality.shaderOptimization);

    // Update geometry optimizer
    this.geometryOptimizer.updateConfig(quality.geometryOptimization);

    // Update scene lighting
    this.updateSceneLighting(quality.maxLights);

    // Update post-processing effects
    this.updatePostProcessing(quality);
  }

  /**
   * Update shadow map size for all lights
   */
  private updateShadowMapSize(size: number): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight || 
          object instanceof THREE.SpotLight || 
          object instanceof THREE.PointLight) {
        if (object.shadow) {
          object.shadow.mapSize.setScalar(size);
          object.shadow.needsUpdate = true;
        }
      }
    });
  }

  /**
   * Update scene lighting based on quality
   */
  private updateSceneLighting(maxLights: number): void {
    let lightCount = 0;
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && !(object instanceof THREE.AmbientLight)) {
        if (lightCount < maxLights) {
          object.visible = true;
          lightCount++;
        } else {
          object.visible = false;
        }
      }
    });
  }

  /**
   * Update post-processing effects
   */
  private updatePostProcessing(quality: QualityLevel): void {
    // This would integrate with a post-processing pipeline
    // For now, we'll just log the settings
    console.log('Post-processing settings:', {
      enablePostProcessing: quality.enablePostProcessing,
      enableBloom: quality.enableBloom,
      enableSSAO: quality.enableSSAO,
    });
  }

  /**
   * Get default shader configuration
   */
  private getDefaultShaderConfig(): ShaderOptimizationConfig {
    return {
      enableInstancing: true,
      enableVertexCompression: false,
      enablePrecisionOptimization: true,
      enableDeadCodeElimination: true,
      enableUniformBuffers: true,
      maxLights: 4,
      shadowMapSize: 1024,
    };
  }

  /**
   * Get default geometry configuration
   */
  private getDefaultGeometryConfig(): OptimizationConfig {
    return {
      enableLOD: true,
      enableInstancing: true,
      enableFrustumCulling: true,
      enableOcclusionCulling: false,
      maxInstanceCount: 100,
      lodDistances: [1.0, 2.0, 5.0],
      simplificationRatio: [0.8, 0.6, 0.4],
    };
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveEnabled(enabled: boolean): void {
    this.adaptiveEnabled = enabled;
  }

  /**
   * Get current quality level info
   */
  getCurrentQuality(): QualityLevel {
    return this.qualityLevels[this.currentQualityLevel];
  }

  /**
   * Get device profile
   */
  getDeviceProfile(): DeviceProfile {
    return this.deviceProfile;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    currentQualityLevel: number;
    qualityName: string;
    targetFPS: number;
    actualFPS: number;
    frameTime: number;
    adaptiveEnabled: boolean;
    deviceTier: string;
  } {
    const metrics = this.performanceMonitor.getMetrics();
    const quality = this.qualityLevels[this.currentQualityLevel];

    return {
      currentQualityLevel: this.currentQualityLevel,
      qualityName: quality.name,
      targetFPS: quality.targetFPS,
      actualFPS: metrics.fps,
      frameTime: metrics.frameTime,
      adaptiveEnabled: this.adaptiveEnabled,
      deviceTier: this.deviceProfile.tier,
    };
  }

  /**
   * Force quality level for testing
   */
  forceQualityLevel(level: number): void {
    this.setAdaptiveEnabled(false);
    this.setQualityLevel(level);
  }

  /**
   * Reset to adaptive mode
   */
  resetToAdaptive(): void {
    this.setAdaptiveEnabled(true);
    this.selectInitialQualityLevel();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.shaderOptimizer.clearCache();
    this.geometryOptimizer.clearCache();
  }
}
