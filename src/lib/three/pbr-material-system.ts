// Advanced PBR material system for realistic glasses rendering

import * as THREE from 'three';
import {
  PBRMaterialProperties,
  LensMaterialProperties,
  FrameMaterialProperties,
  MaterialPreset,
  LensPreset,
  FRAME_MATERIAL_PRESETS,
  LENS_MATERIAL_PRESETS,
} from '@/types/lighting-materials';

export class PBRMaterialSystem {
  private textureLoader: THREE.TextureLoader;
  private cubeTextureLoader: THREE.CubeTextureLoader;
  private materialCache: Map<string, THREE.Material> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
  }

  /**
   * Create advanced frame material with PBR properties
   */
  createFrameMaterial(properties: FrameMaterialProperties, preset?: MaterialPreset): THREE.MeshPhysicalMaterial {
    const cacheKey = this.generateMaterialCacheKey('frame', properties);
    
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshPhysicalMaterial;
    }

    const material = new THREE.MeshPhysicalMaterial({
      // Base properties
      color: new THREE.Color(properties.color),
      metalness: properties.metalness,
      roughness: properties.roughness,
      
      // Advanced properties
      clearcoat: properties.clearcoat,
      clearcoatRoughness: properties.clearcoatRoughness,
      transmission: properties.transmission,
      thickness: properties.thickness,
      ior: properties.ior,
      
      // Environment mapping
      envMapIntensity: properties.envMapIntensity,
      
      // Emission
      emissive: new THREE.Color(properties.emissive),
      emissiveIntensity: properties.emissiveIntensity,
      
      // Surface properties
      normalScale: new THREE.Vector2(properties.normalScale, properties.normalScale),
      
      // Enable features for realistic rendering
      transparent: properties.transmission > 0,
      side: THREE.DoubleSide,
    });

    // Add anisotropy for brushed metals
    if (properties.anisotropy > 0) {
      material.anisotropy = properties.anisotropy;
      material.anisotropyRotation = properties.anisotropyRotation;
    }

    // Load textures based on material category
    if (preset) {
      this.loadFrameTextures(material, preset);
    }

    // Add wear and aging effects
    this.applyWearEffects(material, properties.wearFactor, properties.scratchIntensity);

    this.materialCache.set(cacheKey, material);
    return material;
  }

  /**
   * Create advanced lens material with refraction and transmission
   */
  createLensMaterial(properties: LensMaterialProperties, preset?: LensPreset): THREE.MeshPhysicalMaterial {
    const cacheKey = this.generateMaterialCacheKey('lens', properties);
    
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey) as THREE.MeshPhysicalMaterial;
    }

    const material = new THREE.MeshPhysicalMaterial({
      // Base properties
      color: new THREE.Color(properties.color),
      metalness: properties.metalness,
      roughness: properties.roughness,
      
      // Transmission properties
      transmission: properties.transmission,
      thickness: properties.thickness,
      ior: properties.ior,
      
      // Transparency
      transparent: true,
      opacity: properties.transparency,
      
      // Environment mapping for reflections
      envMapIntensity: properties.envMapIntensity,
      
      // Double-sided for proper refraction
      side: THREE.DoubleSide,
      
      // Enable transmission for realistic glass
      transmissionMap: null, // Will be set if needed
    });

    // Apply Fresnel effects
    this.applyFresnelEffects(material, properties);

    // Apply lens tinting
    if (properties.tintIntensity > 0) {
      const tintColor = new THREE.Color(properties.tintColor);
      material.color.lerp(tintColor, properties.tintIntensity);
    }

    // Load lens-specific textures
    if (preset) {
      this.loadLensTextures(material, preset);
    }

    // Apply optical effects
    this.applyOpticalEffects(material, properties);

    this.materialCache.set(cacheKey, material);
    return material;
  }

  /**
   * Load frame-specific textures
   */
  private async loadFrameTextures(material: THREE.MeshPhysicalMaterial, preset: MaterialPreset): Promise<void> {
    const basePath = `/textures/frames/${preset.category}/${preset.id}`;
    
    try {
      // Load normal map for surface detail
      const normalMap = await this.loadTexture(`${basePath}/normal.jpg`);
      if (normalMap) {
        material.normalMap = normalMap;
        normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(2, 2);
      }

      // Load roughness map for material variation
      const roughnessMap = await this.loadTexture(`${basePath}/roughness.jpg`);
      if (roughnessMap) {
        material.roughnessMap = roughnessMap;
        roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
        roughnessMap.repeat.set(2, 2);
      }

      // Load metalness map for metal materials
      if (preset.category === 'metal' || preset.category === 'titanium') {
        const metalnessMap = await this.loadTexture(`${basePath}/metalness.jpg`);
        if (metalnessMap) {
          material.metalnessMap = metalnessMap;
          metalnessMap.wrapS = metalnessMap.wrapT = THREE.RepeatWrapping;
          metalnessMap.repeat.set(2, 2);
        }
      }

      // Load bump map for surface texture
      const bumpMap = await this.loadTexture(`${basePath}/bump.jpg`);
      if (bumpMap) {
        material.bumpMap = bumpMap;
        material.bumpScale = 0.02;
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        bumpMap.repeat.set(4, 4);
      }

    } catch (error) {
      console.warn(`Failed to load textures for ${preset.id}:`, error);
      // Continue without textures - material will still work with base properties
    }
  }

  /**
   * Load lens-specific textures
   */
  private async loadLensTextures(material: THREE.MeshPhysicalMaterial, preset: LensPreset): Promise<void> {
    const basePath = `/textures/lenses/${preset.category}/${preset.id}`;
    
    try {
      // Load transmission map for lens effects
      if (preset.category !== 'clear') {
        const transmissionMap = await this.loadTexture(`${basePath}/transmission.jpg`);
        if (transmissionMap) {
          material.transmissionMap = transmissionMap;
        }
      }

      // Load normal map for lens imperfections
      const normalMap = await this.loadTexture(`${basePath}/normal.jpg`);
      if (normalMap) {
        material.normalMap = normalMap;
        material.normalScale.set(0.1, 0.1); // Subtle lens imperfections
      }

    } catch (error) {
      console.warn(`Failed to load lens textures for ${preset.id}:`, error);
    }
  }

  /**
   * Apply Fresnel effects to lens materials
   */
  private applyFresnelEffects(material: THREE.MeshPhysicalMaterial, properties: LensMaterialProperties): void {
    // Create custom shader for advanced Fresnel effects
    material.onBeforeCompile = (shader) => {
      // Add Fresnel uniforms
      shader.uniforms.fresnelBias = { value: properties.fresnelBias };
      shader.uniforms.fresnelScale = { value: properties.fresnelScale };
      shader.uniforms.fresnelPower = { value: properties.fresnelPower };

      // Modify vertex shader to pass view direction
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vViewDirection;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        vViewDirection = normalize(-mvPosition.xyz);
        `
      );

      // Modify fragment shader for Fresnel calculation
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float fresnelBias;
        uniform float fresnelScale;
        uniform float fresnelPower;
        varying vec3 vViewDirection;
        
        float fresnel(vec3 viewDirection, vec3 normal) {
          return fresnelBias + fresnelScale * pow(1.0 + dot(viewDirection, normal), fresnelPower);
        }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <transmission_fragment>',
        `
        #include <transmission_fragment>
        
        // Apply Fresnel effect to transmission
        float fresnelFactor = fresnel(vViewDirection, normal);
        material.transmission *= (1.0 - fresnelFactor);
        `
      );
    };
  }

  /**
   * Apply optical effects to lens materials
   */
  private applyOpticalEffects(material: THREE.MeshPhysicalMaterial, properties: LensMaterialProperties): void {
    if (properties.chromaticAberration > 0 || properties.distortion > 0) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.chromaticAberration = { value: properties.chromaticAberration };
        shader.uniforms.distortion = { value: properties.distortion };

        // Add chromatic aberration and distortion effects
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <transmission_fragment>',
          `
          #include <transmission_fragment>
          
          // Apply chromatic aberration
          if (chromaticAberration > 0.0) {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec2 center = vec2(0.5);
            vec2 offset = (uv - center) * chromaticAberration;
            
            // Separate RGB channels slightly
            material.transmission *= vec3(
              texture2D(transmissionMap, uv - offset * 0.5).r,
              texture2D(transmissionMap, uv).g,
              texture2D(transmissionMap, uv + offset * 0.5).b
            ).g;
          }
          `
        );
      };
    }
  }

  /**
   * Apply wear and aging effects to frame materials
   */
  private applyWearEffects(material: THREE.MeshPhysicalMaterial, wearFactor: number, scratchIntensity: number): void {
    if (wearFactor > 0 || scratchIntensity > 0) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.wearFactor = { value: wearFactor };
        shader.uniforms.scratchIntensity = { value: scratchIntensity };

        // Add wear effects to roughness
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <roughnessmap_fragment>',
          `
          #include <roughnessmap_fragment>
          
          // Apply wear effects
          if (wearFactor > 0.0) {
            vec3 worldPos = (modelMatrix * vec4(vUv, 0.0, 1.0)).xyz;
            float wear = sin(worldPos.x * 50.0) * sin(worldPos.y * 50.0) * wearFactor;
            roughnessFactor += wear * 0.3;
          }
          
          // Add scratch effects
          if (scratchIntensity > 0.0) {
            float scratches = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
            if (scratches > 0.95) {
              roughnessFactor += scratchIntensity;
            }
          }
          `
        );
      };
    }
  }

  /**
   * Load texture with caching
   */
  private async loadTexture(url: string): Promise<THREE.Texture | null> {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    try {
      const texture = await this.textureLoader.loadAsync(url);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      this.textureCache.set(url, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture: ${url}`);
      return null;
    }
  }

  /**
   * Generate cache key for materials
   */
  private generateMaterialCacheKey(type: string, properties: any): string {
    return `${type}_${JSON.stringify(properties)}`;
  }

  /**
   * Update material properties dynamically
   */
  updateMaterialProperties(material: THREE.MeshPhysicalMaterial, properties: Partial<PBRMaterialProperties>): void {
    if (properties.color) material.color.setHex(parseInt(properties.color.replace('#', '0x')));
    if (properties.metalness !== undefined) material.metalness = properties.metalness;
    if (properties.roughness !== undefined) material.roughness = properties.roughness;
    if (properties.clearcoat !== undefined) material.clearcoat = properties.clearcoat;
    if (properties.clearcoatRoughness !== undefined) material.clearcoatRoughness = properties.clearcoatRoughness;
    if (properties.transmission !== undefined) material.transmission = properties.transmission;
    if (properties.thickness !== undefined) material.thickness = properties.thickness;
    if (properties.ior !== undefined) material.ior = properties.ior;
    if (properties.envMapIntensity !== undefined) material.envMapIntensity = properties.envMapIntensity;
    
    if (properties.emissive) material.emissive.setHex(parseInt(properties.emissive.replace('#', '0x')));
    if (properties.emissiveIntensity !== undefined) material.emissiveIntensity = properties.emissiveIntensity;
    
    material.needsUpdate = true;
  }

  /**
   * Get material preset by ID
   */
  getFramePreset(id: string): MaterialPreset | undefined {
    return FRAME_MATERIAL_PRESETS.find(preset => preset.id === id);
  }

  /**
   * Get lens preset by ID
   */
  getLensPreset(id: string): LensPreset | undefined {
    return LENS_MATERIAL_PRESETS.find(preset => preset.id === id);
  }

  /**
   * Get all frame presets
   */
  getFramePresets(): MaterialPreset[] {
    return [...FRAME_MATERIAL_PRESETS];
  }

  /**
   * Get all lens presets
   */
  getLensPresets(): LensPreset[] {
    return [...LENS_MATERIAL_PRESETS];
  }

  /**
   * Create material from preset
   */
  createMaterialFromPreset(presetId: string, type: 'frame' | 'lens'): THREE.MeshPhysicalMaterial | null {
    if (type === 'frame') {
      const preset = this.getFramePreset(presetId);
      return preset ? this.createFrameMaterial(preset.properties, preset) : null;
    } else {
      const preset = this.getLensPreset(presetId);
      return preset ? this.createLensMaterial(preset.properties, preset) : null;
    }
  }

  /**
   * Dispose of cached resources
   */
  dispose(): void {
    // Dispose materials
    this.materialCache.forEach(material => {
      material.dispose();
    });
    this.materialCache.clear();

    // Dispose textures
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();
  }

  /**
   * Get material cache statistics
   */
  getCacheStats(): { materials: number; textures: number } {
    return {
      materials: this.materialCache.size,
      textures: this.textureCache.size,
    };
  }
}
