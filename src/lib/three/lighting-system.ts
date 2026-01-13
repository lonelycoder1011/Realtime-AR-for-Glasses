// Advanced lighting system for realistic glasses rendering

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { 
  LightingConfig, 
  EnvironmentMap, 
  ShadowConfig, 
  AmbientOcclusionConfig,
  DEFAULT_LIGHTING_CONFIG 
} from '@/types/lighting-materials';

export class AdvancedLightingSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private config: LightingConfig;
  
  // Lights
  private directionalLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private faceLight: THREE.PointLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;
  
  // Environment
  private environmentMap: THREE.Texture | null = null;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  
  // Shadow and AO
  private shadowConfig: ShadowConfig = {
    enabled: true,
    type: 'pcfsoft',
    mapSize: 2048,
    bias: -0.0001,
    normalBias: 0.02,
    radius: 4,
    blurSamples: 25,
  };

  private aoConfig: AmbientOcclusionConfig = {
    enabled: true,
    intensity: 0.5,
    radius: 0.1,
    samples: 16,
    rings: 4,
    distanceExponent: 2,
    bias: 0.01,
  };

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, config: Partial<LightingConfig> = {}) {
    this.scene = scene;
    this.renderer = renderer;
    this.config = { ...DEFAULT_LIGHTING_CONFIG, ...config };
    
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    this.initializeLighting();
    this.setupShadows();
  }

  /**
   * Initialize all lighting components
   */
  private initializeLighting(): void {
    this.createDirectionalLight();
    this.createAmbientLight();
    this.createFaceLight();
    this.createRimLight();
  }

  /**
   * Create main directional light
   */
  private createDirectionalLight(): void {
    const config = this.config.directional;
    
    this.directionalLight = new THREE.DirectionalLight(
      new THREE.Color(config.color),
      config.intensity
    );
    
    this.directionalLight.position.copy(config.position);
    this.directionalLight.castShadow = config.castShadow;
    
    if (config.castShadow) {
      this.directionalLight.shadow.mapSize.width = config.shadowMapSize;
      this.directionalLight.shadow.mapSize.height = config.shadowMapSize;
      this.directionalLight.shadow.camera.near = config.shadowCameraNear;
      this.directionalLight.shadow.camera.far = config.shadowCameraFar;
      this.directionalLight.shadow.bias = config.shadowBias;
      
      // Set shadow camera bounds for face area
      this.directionalLight.shadow.camera.left = -0.5;
      this.directionalLight.shadow.camera.right = 0.5;
      this.directionalLight.shadow.camera.top = 0.5;
      this.directionalLight.shadow.camera.bottom = -0.5;
    }
    
    this.scene.add(this.directionalLight);
  }

  /**
   * Create ambient light
   */
  private createAmbientLight(): void {
    const config = this.config.ambient;
    
    this.ambientLight = new THREE.AmbientLight(
      new THREE.Color(config.color),
      config.intensity
    );
    
    this.scene.add(this.ambientLight);
  }

  /**
   * Create face illumination light
   */
  private createFaceLight(): void {
    const config = this.config.faceLight;
    
    this.faceLight = new THREE.PointLight(
      new THREE.Color(config.color),
      config.intensity,
      config.distance,
      config.decay
    );
    
    // Position in front of face
    this.faceLight.position.set(0, 0, 0.3);
    this.scene.add(this.faceLight);
  }

  /**
   * Create rim lighting for glasses edges
   */
  private createRimLight(): void {
    const config = this.config.rimLight;
    
    this.rimLight = new THREE.DirectionalLight(
      new THREE.Color(config.color),
      config.intensity
    );
    
    this.rimLight.position.copy(config.position);
    this.scene.add(this.rimLight);
  }

  /**
   * Setup shadow rendering
   */
  private setupShadows(): void {
    this.renderer.shadowMap.enabled = this.shadowConfig.enabled;
    
    switch (this.shadowConfig.type) {
      case 'basic':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'pcf':
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'pcfsoft':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'vsm':
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        break;
    }
  }

  /**
   * Load and apply environment map
   */
  async loadEnvironmentMap(environmentMap: EnvironmentMap): Promise<void> {
    try {
      // Skip HDRI loading for now and use basic lighting
      console.log('Skipping HDRI loading, using basic environment');
      
      // IMPORTANT: Set background to null for transparency (so video shows through)
      const scene = this.scene;
      scene.background = null;
      scene.environment = null;
      
      // Add basic ambient lighting
      if (!scene.getObjectByName('fallback-ambient')) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        ambientLight.name = 'fallback-ambient';
        scene.add(ambientLight);
      }
      
      this.environmentMap = null;
    } catch (error) {
      console.error('Failed to load environment map:', error);
      // Fallback to basic environment
      this.createFallbackEnvironment();
    }
  }

  /**
   * Create fallback environment when HDRI loading fails
   */
  private createFallbackEnvironment(): void {
    // Keep background null for transparency
    this.scene.background = null;
    this.scene.environment = null;
    
    // Just add basic lighting
    if (!this.scene.getObjectByName('fallback-ambient')) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      ambientLight.name = 'fallback-ambient';
      this.scene.add(ambientLight);
    }
  }

  /**
   * Update face light position based on face detection
   */
  updateFaceLighting(facePosition: THREE.Vector3, faceNormal: THREE.Vector3): void {
    if (this.faceLight) {
      // Position light slightly in front of face
      const lightPosition = facePosition.clone().add(faceNormal.clone().multiplyScalar(0.2));
      this.faceLight.position.copy(lightPosition);
    }
  }

  /**
   * Update lighting configuration
   */
  updateConfig(newConfig: Partial<LightingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update directional light
    if (this.directionalLight && newConfig.directional) {
      const config = newConfig.directional;
      if (config.intensity !== undefined) this.directionalLight.intensity = config.intensity;
      if (config.color) this.directionalLight.color.setHex(parseInt(config.color.replace('#', '0x')));
      if (config.position) this.directionalLight.position.copy(config.position);
    }
    
    // Update ambient light
    if (this.ambientLight && newConfig.ambient) {
      const config = newConfig.ambient;
      if (config.intensity !== undefined) this.ambientLight.intensity = config.intensity;
      if (config.color) this.ambientLight.color.setHex(parseInt(config.color.replace('#', '0x')));
    }
    
    // Update face light
    if (this.faceLight && newConfig.faceLight) {
      const config = newConfig.faceLight;
      if (config.intensity !== undefined) this.faceLight.intensity = config.intensity;
      if (config.color) this.faceLight.color.setHex(parseInt(config.color.replace('#', '0x')));
      if (config.distance !== undefined) this.faceLight.distance = config.distance;
      if (config.decay !== undefined) this.faceLight.decay = config.decay;
    }
    
    // Update rim light
    if (this.rimLight && newConfig.rimLight) {
      const config = newConfig.rimLight;
      if (config.intensity !== undefined) this.rimLight.intensity = config.intensity;
      if (config.color) this.rimLight.color.setHex(parseInt(config.color.replace('#', '0x')));
      if (config.position) this.rimLight.position.copy(config.position);
    }
  }

  /**
   * Update shadow configuration
   */
  updateShadowConfig(newConfig: Partial<ShadowConfig>): void {
    this.shadowConfig = { ...this.shadowConfig, ...newConfig };
    
    this.renderer.shadowMap.enabled = this.shadowConfig.enabled;
    
    if (this.directionalLight?.shadow) {
      this.directionalLight.shadow.mapSize.setScalar(this.shadowConfig.mapSize);
      this.directionalLight.shadow.bias = this.shadowConfig.bias;
      this.directionalLight.shadow.normalBias = this.shadowConfig.normalBias;
      this.directionalLight.shadow.radius = this.shadowConfig.radius;
    }
    
    this.setupShadows();
  }

  /**
   * Create realistic lighting for different environments
   */
  setEnvironmentPreset(preset: 'studio' | 'outdoor' | 'indoor' | 'dramatic'): void {
    switch (preset) {
      case 'studio':
        this.updateConfig({
          directional: {
            ...this.config.directional,
            intensity: 2.5,
            color: '#ffffff',
            position: new THREE.Vector3(2, 3, 2),
          },
          ambient: {
            intensity: 0.6,
            color: '#f0f0f0',
          },
          faceLight: {
            ...this.config.faceLight,
            intensity: 1.0,
          },
        });
        break;
        
      case 'outdoor':
        this.updateConfig({
          directional: {
            ...this.config.directional,
            intensity: 3.0,
            color: '#fff8e1',
            position: new THREE.Vector3(5, 8, 3),
          },
          ambient: {
            intensity: 0.8,
            color: '#87ceeb',
          },
          faceLight: {
            ...this.config.faceLight,
            intensity: 0.5,
          },
        });
        break;
        
      case 'indoor':
        this.updateConfig({
          directional: {
            ...this.config.directional,
            intensity: 1.5,
            color: '#fff3e0',
            position: new THREE.Vector3(1, 2, 1),
          },
          ambient: {
            intensity: 0.4,
            color: '#ffffff',
          },
          faceLight: {
            ...this.config.faceLight,
            intensity: 1.2,
          },
        });
        break;
        
      case 'dramatic':
        this.updateConfig({
          directional: {
            ...this.config.directional,
            intensity: 4.0,
            color: '#ffffff',
            position: new THREE.Vector3(-3, 5, 2),
          },
          ambient: {
            intensity: 0.2,
            color: '#1a1a1a',
          },
          rimLight: {
            ...this.config.rimLight,
            intensity: 2.0,
          },
        });
        break;
    }
  }

  /**
   * Enable/disable specific lighting features
   */
  toggleFeature(feature: 'shadows' | 'environment' | 'faceLight' | 'rimLight', enabled: boolean): void {
    switch (feature) {
      case 'shadows':
        this.updateShadowConfig({ enabled });
        break;
        
      case 'environment':
        if (enabled && this.environmentMap) {
          this.scene.environment = this.environmentMap;
        } else {
          this.scene.environment = null;
        }
        break;
        
      case 'faceLight':
        if (this.faceLight) {
          this.faceLight.visible = enabled;
        }
        break;
        
      case 'rimLight':
        if (this.rimLight) {
          this.rimLight.visible = enabled;
        }
        break;
    }
  }

  /**
   * Get current lighting configuration
   */
  getConfig(): LightingConfig {
    return { ...this.config };
  }

  /**
   * Get shadow configuration
   */
  getShadowConfig(): ShadowConfig {
    return { ...this.shadowConfig };
  }

  /**
   * Dispose of lighting system resources
   */
  dispose(): void {
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    
    if (this.environmentMap) {
      this.environmentMap.dispose();
    }
    
    // Remove lights from scene
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
    if (this.faceLight) {
      this.scene.remove(this.faceLight);
    }
    if (this.rimLight) {
      this.scene.remove(this.rimLight);
    }
  }

  /**
   * Update lighting based on time of day (for dynamic environments)
   */
  updateTimeOfDay(hour: number): void {
    // Simulate natural lighting changes throughout the day
    const normalizedHour = hour / 24;
    
    // Sun position based on time
    const sunAngle = (normalizedHour - 0.25) * Math.PI * 2; // Noon at 0.5
    const sunHeight = Math.sin(sunAngle) * 0.5 + 0.5;
    
    // Update directional light
    if (this.directionalLight) {
      const sunX = Math.cos(sunAngle) * 5;
      const sunY = sunHeight * 8 + 1;
      const sunZ = Math.sin(sunAngle) * 5;
      
      this.directionalLight.position.set(sunX, sunY, sunZ);
      
      // Color temperature changes
      if (sunHeight < 0.2) {
        // Night - cooler, dimmer
        this.directionalLight.color.setHex(0x4169e1);
        this.directionalLight.intensity = 0.5;
      } else if (sunHeight < 0.4) {
        // Dawn/dusk - warmer
        this.directionalLight.color.setHex(0xff6b35);
        this.directionalLight.intensity = 1.5;
      } else {
        // Day - neutral white
        this.directionalLight.color.setHex(0xffffff);
        this.directionalLight.intensity = 2.5;
      }
    }
    
    // Update ambient light
    if (this.ambientLight) {
      this.ambientLight.intensity = Math.max(0.2, sunHeight * 0.8);
    }
  }
}
