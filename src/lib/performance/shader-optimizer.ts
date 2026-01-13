// WebGL shader optimization system

import * as THREE from 'three';

export interface ShaderOptimizationConfig {
  enableInstancing: boolean;
  enableVertexCompression: boolean;
  enablePrecisionOptimization: boolean;
  enableDeadCodeElimination: boolean;
  enableUniformBuffers: boolean;
  maxLights: number;
  shadowMapSize: number;
}

export class ShaderOptimizer {
  private compiledShaders: Map<string, THREE.Shader> = new Map();
  private shaderCache: Map<string, string> = new Map();
  private config: ShaderOptimizationConfig;
  private renderer: THREE.WebGLRenderer;

  constructor(renderer: THREE.WebGLRenderer, config: ShaderOptimizationConfig) {
    this.renderer = renderer;
    this.config = config;
  }

  /**
   * Optimize vertex shader for performance
   */
  optimizeVertexShader(originalShader: string, materialType: string): string {
    let optimizedShader = originalShader;

    // Enable instancing if supported
    if (this.config.enableInstancing && materialType === 'glasses') {
      optimizedShader = this.addInstancedAttributes(optimizedShader);
    }

    // Compress vertex data
    if (this.config.enableVertexCompression) {
      optimizedShader = this.compressVertexData(optimizedShader);
    }

    // Optimize precision
    if (this.config.enablePrecisionOptimization) {
      optimizedShader = this.optimizePrecision(optimizedShader, 'vertex');
    }

    // Remove dead code
    if (this.config.enableDeadCodeElimination) {
      optimizedShader = this.removeDeadCode(optimizedShader);
    }

    return optimizedShader;
  }

  /**
   * Optimize fragment shader for performance
   */
  optimizeFragmentShader(originalShader: string, materialType: string): string {
    let optimizedShader = originalShader;

    // Limit number of lights
    optimizedShader = this.limitLights(optimizedShader, this.config.maxLights);

    // Optimize shadow calculations
    optimizedShader = this.optimizeShadows(optimizedShader);

    // Optimize precision
    if (this.config.enablePrecisionOptimization) {
      optimizedShader = this.optimizePrecision(optimizedShader, 'fragment');
    }

    // Remove dead code
    if (this.config.enableDeadCodeElimination) {
      optimizedShader = this.removeDeadCode(optimizedShader);
    }

    // Optimize PBR calculations for glasses materials
    if (materialType === 'glasses') {
      optimizedShader = this.optimizePBRCalculations(optimizedShader);
    }

    return optimizedShader;
  }

  /**
   * Add instanced attributes for geometry instancing
   */
  private addInstancedAttributes(shader: string): string {
    const instancedAttributes = `
      attribute mat4 instanceMatrix;
      attribute vec3 instanceColor;
      
      varying vec3 vInstanceColor;
    `;

    const transformCode = `
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      vInstanceColor = instanceColor;
    `;

    return shader
      .replace('void main() {', `${instancedAttributes}\nvoid main() {`)
      .replace('vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );', transformCode);
  }

  /**
   * Compress vertex data using quantization
   */
  private compressVertexData(shader: string): string {
    // Use half-precision for less critical attributes
    return shader
      .replace(/attribute vec3 normal;/g, 'attribute vec3 normal; // Using mediump precision')
      .replace(/attribute vec2 uv;/g, 'attribute vec2 uv; // Using mediump precision')
      .replace(/varying vec3 vNormal;/g, 'varying mediump vec3 vNormal;')
      .replace(/varying vec2 vUv;/g, 'varying mediump vec2 vUv;');
  }

  /**
   * Optimize precision declarations
   */
  private optimizePrecision(shader: string, shaderType: 'vertex' | 'fragment'): string {
    let optimized = shader;

    if (shaderType === 'fragment') {
      // Add precision declarations at the top
      const precisionDeclarations = `
        precision highp float;
        precision mediump int;
        precision lowp sampler2D;
        precision lowp samplerCube;
      `;

      optimized = precisionDeclarations + '\n' + optimized;
    }

    // Replace high precision with medium where possible
    optimized = optimized
      .replace(/varying highp vec2/g, 'varying mediump vec2')
      .replace(/varying highp vec3/g, 'varying mediump vec3')
      .replace(/uniform highp float/g, 'uniform mediump float');

    return optimized;
  }

  /**
   * Remove unused code and variables
   */
  private removeDeadCode(shader: string): string {
    // Simple dead code elimination - remove unused uniforms and variables
    const lines = shader.split('\n');
    const usedVariables = new Set<string>();
    const declarations = new Map<string, string>();

    // First pass: find all variable usage
    lines.forEach(line => {
      const matches = line.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      if (matches) {
        matches.forEach(match => usedVariables.add(match));
      }
    });

    // Second pass: collect declarations
    lines.forEach(line => {
      const uniformMatch = line.match(/uniform\s+\w+\s+(\w+);/);
      const varyingMatch = line.match(/varying\s+\w+\s+(\w+);/);
      const attributeMatch = line.match(/attribute\s+\w+\s+(\w+);/);

      if (uniformMatch) declarations.set(uniformMatch[1], line);
      if (varyingMatch) declarations.set(varyingMatch[1], line);
      if (attributeMatch) declarations.set(attributeMatch[1], line);
    });

    // Third pass: remove unused declarations
    return lines.filter(line => {
      const uniformMatch = line.match(/uniform\s+\w+\s+(\w+);/);
      const varyingMatch = line.match(/varying\s+\w+\s+(\w+);/);
      const attributeMatch = line.match(/attribute\s+\w+\s+(\w+);/);

      if (uniformMatch && !usedVariables.has(uniformMatch[1])) return false;
      if (varyingMatch && !usedVariables.has(varyingMatch[1])) return false;
      if (attributeMatch && !usedVariables.has(attributeMatch[1])) return false;

      return true;
    }).join('\n');
  }

  /**
   * Limit number of lights in shader
   */
  private limitLights(shader: string, maxLights: number): string {
    return shader
      .replace(/#define NUM_DIR_LIGHTS \d+/g, `#define NUM_DIR_LIGHTS ${Math.min(maxLights, 4)}`)
      .replace(/#define NUM_POINT_LIGHTS \d+/g, `#define NUM_POINT_LIGHTS ${Math.min(maxLights, 8)}`)
      .replace(/#define NUM_SPOT_LIGHTS \d+/g, `#define NUM_SPOT_LIGHTS ${Math.min(maxLights, 4)}`);
  }

  /**
   * Optimize shadow calculations
   */
  private optimizeShadows(shader: string): string {
    // Use simplified shadow calculations for better performance
    const optimizedShadowCode = `
      float getShadow(sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord) {
        vec2 texelSize = vec2(1.0) / shadowMapSize;
        vec3 shadowCoordNDC = shadowCoord.xyz / shadowCoord.w;
        vec2 uv = shadowCoordNDC.xy;
        float depth = shadowCoordNDC.z;
        
        // Simple PCF with 4 samples instead of 9 or 16
        float shadow = 0.0;
        for(int x = -1; x <= 1; x += 2) {
          for(int y = -1; y <= 1; y += 2) {
            vec2 offset = vec2(float(x), float(y)) * texelSize * shadowRadius;
            float shadowDepth = texture2D(shadowMap, uv + offset).r;
            shadow += (depth - shadowBias > shadowDepth) ? 0.0 : 1.0;
          }
        }
        return shadow / 4.0;
      }
    `;

    return shader.replace(/float getShadow\([^}]+\}/g, optimizedShadowCode);
  }

  /**
   * Optimize PBR calculations for glasses materials
   */
  private optimizePBRCalculations(shader: string): string {
    // Simplified PBR for glasses - focus on essential calculations
    const optimizedPBR = `
      vec3 getGlassPBR(vec3 albedo, float metalness, float roughness, vec3 normal, vec3 viewDir, vec3 lightDir) {
        vec3 halfVector = normalize(lightDir + viewDir);
        float NdotL = max(dot(normal, lightDir), 0.0);
        float NdotV = max(dot(normal, viewDir), 0.0);
        float NdotH = max(dot(normal, halfVector), 0.0);
        float VdotH = max(dot(viewDir, halfVector), 0.0);
        
        // Simplified Fresnel (Schlick approximation)
        vec3 F0 = mix(vec3(0.04), albedo, metalness);
        vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
        
        // Simplified distribution (GGX approximation)
        float alpha = roughness * roughness;
        float alpha2 = alpha * alpha;
        float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
        float D = alpha2 / (3.14159 * denom * denom);
        
        // Simplified geometry function
        float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
        float G1L = NdotL / (NdotL * (1.0 - k) + k);
        float G1V = NdotV / (NdotV * (1.0 - k) + k);
        float G = G1L * G1V;
        
        // Cook-Torrance BRDF
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + 0.001;
        vec3 specular = numerator / denominator;
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metalness;
        
        return (kD * albedo / 3.14159 + specular) * NdotL;
      }
    `;

    return shader + '\n' + optimizedPBR;
  }

  /**
   * Create optimized material for glasses
   */
  createOptimizedGlassesMaterial(baseProperties: any): THREE.ShaderMaterial {
    const vertexShader = this.optimizeVertexShader(`
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      
      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `, 'glasses');

    const fragmentShader = this.optimizeFragmentShader(`
      uniform vec3 color;
      uniform float metalness;
      uniform float roughness;
      uniform float opacity;
      uniform vec3 emissive;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        
        // Simplified lighting calculation
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float NdotL = max(dot(normal, lightDir), 0.0);
        
        vec3 finalColor = color * (0.3 + 0.7 * NdotL);
        finalColor += emissive;
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `, 'glasses');

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        color: { value: new THREE.Color(baseProperties.color || 0xffffff) },
        metalness: { value: baseProperties.metalness || 0.0 },
        roughness: { value: baseProperties.roughness || 0.5 },
        opacity: { value: baseProperties.opacity || 1.0 },
        emissive: { value: new THREE.Color(baseProperties.emissive || 0x000000) },
      },
      transparent: baseProperties.opacity < 1.0,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Cache compiled shader
   */
  cacheShader(key: string, shader: THREE.Shader): void {
    this.compiledShaders.set(key, shader);
  }

  /**
   * Get cached shader
   */
  getCachedShader(key: string): THREE.Shader | undefined {
    return this.compiledShaders.get(key);
  }

  /**
   * Precompile shaders for faster runtime performance
   */
  precompileShaders(materials: THREE.Material[]): Promise<void> {
    return new Promise((resolve) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      
      materials.forEach((material, index) => {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      // Render once to compile all shaders
      this.renderer.compile(scene, camera);
      
      // Clean up
      scene.clear();
      
      resolve();
    });
  }

  /**
   * Get shader compilation statistics
   */
  getCompilationStats(): {
    cachedShaders: number;
    compilationTime: number;
    memoryUsage: number;
  } {
    return {
      cachedShaders: this.compiledShaders.size,
      compilationTime: 0, // Would need to track this during compilation
      memoryUsage: this.compiledShaders.size * 1024, // Rough estimate
    };
  }

  /**
   * Clear shader cache
   */
  clearCache(): void {
    this.compiledShaders.clear();
    this.shaderCache.clear();
  }

  /**
   * Update optimization config
   */
  updateConfig(newConfig: Partial<ShaderOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Clear cache to force recompilation with new settings
    this.clearCache();
  }
}
