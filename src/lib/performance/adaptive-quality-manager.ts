// Adaptive quality management system

import * as THREE from 'three';
import { PerformanceMonitor } from './performance-monitor';
import {
  PerformanceConfig,
  AdaptiveQualitySettings,
  PerformanceProfile,
  PERFORMANCE_PROFILES,
  ADAPTIVE_QUALITY_SETTINGS,
} from '@/types/performance-optimization';

export class AdaptiveQualityManager {
  private performanceMonitor: PerformanceMonitor;
  private config: PerformanceConfig;
  private qualitySettings: AdaptiveQualitySettings;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  
  // Quality adjustment tracking
  private lastAdjustmentTime: number = 0;
  private adjustmentCooldown: number = 2000; // 2 seconds
  private consecutiveFrameDrops: number = 0;
  private targetFpsBuffer: number = 5; // FPS buffer before adjusting
  
  // Quality level callbacks
  private onQualityChange?: (level: number, settings: any) => void;

  constructor(
    performanceMonitor: PerformanceMonitor,
    config: PerformanceConfig,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene
  ) {
    this.performanceMonitor = performanceMonitor;
    this.config = config;
    this.qualitySettings = { ...ADAPTIVE_QUALITY_SETTINGS };
    this.renderer = renderer || null;
    this.scene = scene || null;

    // Auto-select initial quality profile based on device capabilities
    this.selectOptimalProfile();
  }

  /**
   * Update adaptive quality system (call once per frame)
   */
  update(): void {
    if (!this.config.adaptiveQuality) return;

    const currentTime = performance.now();
    const metrics = this.performanceMonitor.getMetrics();
    
    // Check if we need to adjust quality
    if (this.shouldAdjustQuality(metrics, currentTime)) {
      this.adjustQuality(metrics);
      this.lastAdjustmentTime = currentTime;
    }

    // Apply quality settings if they've changed
    this.applyQualitySettings();
  }

  /**
   * Check if quality adjustment is needed
   */
  private shouldAdjustQuality(metrics: any, currentTime: number): boolean {
    // Cooldown check
    if (currentTime - this.lastAdjustmentTime < this.adjustmentCooldown) {
      return false;
    }

    // Check for performance issues
    const targetFps = this.config.targetFps;
    const currentFps = metrics.averageFps;
    const fpsDeficit = targetFps - currentFps;

    // Count consecutive frame drops
    if (fpsDeficit > this.targetFpsBuffer) {
      this.consecutiveFrameDrops++;
    } else if (fpsDeficit < -this.targetFpsBuffer) {
      this.consecutiveFrameDrops = Math.max(0, this.consecutiveFrameDrops - 1);
    }

    // Adjust if we have consistent performance issues or improvements
    return this.consecutiveFrameDrops >= 3 || (fpsDeficit < -this.targetFpsBuffer * 2);
  }

  /**
   * Adjust quality based on performance metrics
   */
  private adjustQuality(metrics: any): void {
    const targetFps = this.config.targetFps;
    const currentFps = metrics.averageFps;
    const fpsDeficit = targetFps - currentFps;

    let targetLevel = this.qualitySettings.currentLevel;

    if (fpsDeficit > this.targetFpsBuffer) {
      // Performance is poor, reduce quality
      targetLevel = Math.max(0, targetLevel - 1);
      this.consecutiveFrameDrops = 0;
    } else if (fpsDeficit < -this.targetFpsBuffer * 2) {
      // Performance is good, increase quality
      targetLevel = Math.min(this.qualitySettings.levels.length - 1, targetLevel + 1);
    }

    if (targetLevel !== this.qualitySettings.currentLevel) {
      this.setQualityLevel(targetLevel);
      console.log(`Quality adjusted to level ${targetLevel} (FPS: ${currentFps.toFixed(1)}/${targetFps})`);
    }
  }

  /**
   * Set specific quality level
   */
  setQualityLevel(level: number): void {
    level = Math.max(0, Math.min(this.qualitySettings.levels.length - 1, level));
    
    if (level !== this.qualitySettings.currentLevel) {
      this.qualitySettings.currentLevel = level;
      this.qualitySettings.targetLevel = level;
      
      // Notify callback
      if (this.onQualityChange) {
        const settings = this.qualitySettings.levels[level];
        this.onQualityChange(level, settings);
      }
    }
  }

  /**
   * Apply current quality settings to renderer and scene
   */
  private applyQualitySettings(): void {
    if (!this.renderer || !this.scene) return;

    const level = this.qualitySettings.currentLevel;
    const settings = this.qualitySettings.levels[level];

    // Apply texture quality
    this.applyTextureQuality(settings.textureQuality);

    // Apply shadow quality
    this.applyShadowQuality(settings.shadowQuality);

    // Apply LOD bias
    this.applyLODBias(settings.lodBias);

    // Apply effects quality
    this.applyEffectsQuality(settings.effectsQuality);

    // Update performance monitor
    this.performanceMonitor.updateQualityMetrics(
      level,
      settings.textureQuality,
      settings.shadowQuality
    );
  }

  /**
   * Apply texture quality settings
   */
  private applyTextureQuality(quality: number): void {
    if (!this.renderer) return;

    // Calculate texture size based on quality
    const baseSize = this.config.maxTextureSize;
    const targetSize = Math.floor(baseSize * quality);
    
    // Apply to existing textures
    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhysicalMaterial) {
            
            // Adjust texture filtering based on quality
            const textures = [
              material.map,
              material.normalMap,
              material.roughnessMap,
              material.metalnessMap,
            ].filter(Boolean);

            textures.forEach((texture) => {
              if (texture && texture instanceof THREE.Texture) {
                if (quality < 0.5) {
                  texture.minFilter = THREE.LinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.generateMipmaps = false;
                } else if (quality < 0.8) {
                  texture.minFilter = THREE.LinearMipmapLinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.generateMipmaps = true;
                } else {
                  texture.minFilter = THREE.LinearMipmapLinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.generateMipmaps = true;
                }
                texture.needsUpdate = true;
              }
            });
          }
        });
      }
    });
  }

  /**
   * Apply shadow quality settings
   */
  private applyShadowQuality(quality: number): void {
    if (!this.renderer) return;

    // Calculate shadow map size based on quality
    const baseSize = this.config.shadowMapSize;
    const targetSize = Math.floor(baseSize * quality);
    
    // Update shadow map size
    this.renderer.shadowMap.enabled = quality > 0;
    
    if (quality > 0) {
      // Find directional lights and update shadow map size
      this.scene?.traverse((object) => {
        if (object instanceof THREE.DirectionalLight && object.shadow) {
          object.shadow.mapSize.setScalar(targetSize);
          object.shadow.needsUpdate = true;
        }
      });

      // Adjust shadow type based on quality
      if (quality < 0.3) {
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
      } else if (quality < 0.7) {
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
      } else {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }
  }

  /**
   * Apply LOD bias settings
   */
  private applyLODBias(bias: number): void {
    if (!this.scene) return;

    // Apply LOD bias to LOD objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.LOD) {
        // Adjust LOD distances based on bias
        const levels = object.levels;
        levels.forEach((level, index) => {
          level.distance = level.distance * (1 + bias);
        });
      }
    });
  }

  /**
   * Apply effects quality settings
   */
  private applyEffectsQuality(quality: number): void {
    // This would control post-processing effects, bloom, etc.
    // Implementation depends on the specific effects pipeline
    
    // For now, we'll just disable/enable certain material features
    if (!this.scene) return;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach((material) => {
          if (material instanceof THREE.MeshPhysicalMaterial) {
            // Adjust material complexity based on effects quality
            if (quality < 0.3) {
              material.clearcoat = 0;
              material.transmission = 0;
            } else if (quality < 0.7) {
              material.clearcoat *= 0.5;
              material.transmission *= 0.5;
            }
            // Full quality uses original values
          }
        });
      }
    });
  }

  /**
   * Select optimal performance profile based on device capabilities
   */
  private selectOptimalProfile(): void {
    const capabilities = this.performanceMonitor.getDeviceCapabilities();
    if (!capabilities) return;

    // Find the best matching profile
    let selectedProfile = PERFORMANCE_PROFILES[2]; // Default to medium

    for (const profile of PERFORMANCE_PROFILES) {
      const requirements = profile.minRequirements;
      let matches = true;

      // Check tier requirement
      if (requirements.tier) {
        const tierOrder = { low: 0, medium: 1, high: 2 };
        if (tierOrder[capabilities.tier] < tierOrder[requirements.tier]) {
          matches = false;
        }
      }

      // Check WebGL version
      if (requirements.webglVersion && capabilities.webglVersion < requirements.webglVersion) {
        matches = false;
      }

      // Check device memory
      if (requirements.deviceMemory && capabilities.deviceMemory < requirements.deviceMemory) {
        matches = false;
      }

      if (matches) {
        selectedProfile = profile;
      }
    }

    // Apply selected profile
    this.config = { ...this.config, ...selectedProfile.config };
    
    // Set initial quality level based on profile
    const profileIndex = PERFORMANCE_PROFILES.indexOf(selectedProfile);
    const initialQualityLevel = Math.max(0, Math.min(3, profileIndex));
    this.setQualityLevel(initialQualityLevel);

    console.log(`Selected performance profile: ${selectedProfile.name} (Quality Level: ${initialQualityLevel})`);
  }

  /**
   * Force quality level (disable adaptive)
   */
  forceQualityLevel(level: number): void {
    this.config.adaptiveQuality = false;
    this.setQualityLevel(level);
  }

  /**
   * Enable adaptive quality
   */
  enableAdaptiveQuality(): void {
    this.config.adaptiveQuality = true;
  }

  /**
   * Disable adaptive quality
   */
  disableAdaptiveQuality(): void {
    this.config.adaptiveQuality = false;
  }

  /**
   * Set quality change callback
   */
  onQualityLevelChange(callback: (level: number, settings: any) => void): void {
    this.onQualityChange = callback;
  }

  /**
   * Get current quality level
   */
  getCurrentQualityLevel(): number {
    return this.qualitySettings.currentLevel;
  }

  /**
   * Get current quality settings
   */
  getCurrentQualitySettings(): any {
    return this.qualitySettings.levels[this.qualitySettings.currentLevel];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set renderer and scene
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    return {
      currentQualityLevel: this.qualitySettings.currentLevel,
      targetFps: this.config.targetFps,
      actualFps: this.performanceMonitor.getMetrics().averageFps,
      consecutiveFrameDrops: this.consecutiveFrameDrops,
      adaptiveQualityEnabled: this.config.adaptiveQuality,
      lastAdjustmentTime: this.lastAdjustmentTime,
    };
  }

  /**
   * Reset adaptive quality system
   */
  reset(): void {
    this.consecutiveFrameDrops = 0;
    this.lastAdjustmentTime = 0;
    this.qualitySettings = { ...ADAPTIVE_QUALITY_SETTINGS };
  }
}
