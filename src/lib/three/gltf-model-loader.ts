// GLTF/GLB model loader for glasses

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  GlassesModelData,
  GlassesModel3D,
  MaterialProperties,
} from '@/types/glasses-models';

export class GLTFModelLoader {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private loadingManager: THREE.LoadingManager;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.loader = new GLTFLoader(this.loadingManager);
    
    // Setup DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Load GLTF/GLB model from URL
   */
  async loadGLTFModel(modelData: GlassesModelData): Promise<GlassesModel3D> {
    if (!modelData.modelUrl) {
      throw new Error('Model URL not provided');
    }

    console.log('[GLTFLoader] Loading model:', modelData.id, 'from:', modelData.modelUrl);

    return new Promise((resolve, reject) => {
      this.loader.load(
        modelData.modelUrl!,
        (gltf) => {
          try {
            console.log('[GLTFLoader] Model loaded successfully:', modelData.id);
            const model = this.processGLTFModel(gltf, modelData);
            console.log('[GLTFLoader] Model processed:', modelData.id, 'mesh children:', model.mesh.children.length);
            resolve(model);
          } catch (error) {
            console.error('[GLTFLoader] Error processing model:', modelData.id, error);
            reject(error);
          }
        },
        (progress) => {
          if (progress.total > 0) {
            console.log('[GLTFLoader] Loading progress:', modelData.id, (progress.loaded / progress.total * 100).toFixed(1) + '%');
          }
        },
        (error: any) => {
          console.error('[GLTFLoader] Failed to load model:', modelData.id, error);
          reject(new Error(`Failed to load GLTF model ${modelData.id}: ${error?.message || error}`));
        }
      );
    });
  }

  /**
   * Process loaded GLTF model
   */
  private processGLTFModel(gltf: any, modelData: GlassesModelData): GlassesModel3D {
    const scene = gltf.scene;
    scene.name = `glasses-${modelData.id}`;

    // Extract components by name or type
    const components = this.extractGlassesComponents(scene);

    // Setup materials
    const materials = this.setupGLTFMaterials(scene, modelData);

    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(scene);

    // Skip normalization - positioning will handle scale based on face detection
    // Store original bounding box for reference
    const bbox = new THREE.Box3().setFromObject(scene);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    
    // Center the model at origin (important for rotation)
    scene.position.sub(center);
    
    console.log('[GLTFLoader] Model original size:', size, '- centered at origin');

    const model: GlassesModel3D = {
      id: modelData.id,
      data: modelData,
      mesh: scene,
      components,
      materials,
      boundingBox,
      isLoaded: true,
    };

    return model;
  }

  /**
   * Extract glasses components from GLTF scene
   */
  private extractGlassesComponents(scene: THREE.Group) {
    const components = {
      frame: null as THREE.Mesh | null,
      leftLens: null as THREE.Mesh | null,
      rightLens: null as THREE.Mesh | null,
      leftTemple: null as THREE.Mesh | null,
      rightTemple: null as THREE.Mesh | null,
      bridge: null as THREE.Mesh | null,
    };

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        
        // Match component names
        if (name.includes('frame') && !name.includes('lens')) {
          components.frame = child;
        } else if (name.includes('lens')) {
          if (name.includes('left') || name.includes('l_')) {
            components.leftLens = child;
          } else if (name.includes('right') || name.includes('r_')) {
            components.rightLens = child;
          }
        } else if (name.includes('temple')) {
          if (name.includes('left') || name.includes('l_')) {
            components.leftTemple = child;
          } else if (name.includes('right') || name.includes('r_')) {
            components.rightTemple = child;
          }
        } else if (name.includes('bridge') || name.includes('nose')) {
          components.bridge = child;
        }
      }
    });

    return components;
  }

  /**
   * Setup materials for GLTF model
   */
  private setupGLTFMaterials(scene: THREE.Group, modelData: GlassesModelData) {
    let frameMaterial: THREE.Material = new THREE.MeshPhysicalMaterial();
    let lensMaterial: THREE.Material = new THREE.MeshPhysicalMaterial();
    let templeMaterial: THREE.Material = new THREE.MeshPhysicalMaterial();

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        const name = child.name.toLowerCase();

        if (name.includes('lens')) {
          // Convert to lens material
          lensMaterial = this.createLensMaterial(modelData, material);
          child.material = lensMaterial;
        } else if (name.includes('frame') || name.includes('temple') || name.includes('bridge')) {
          // Convert to frame material
          frameMaterial = this.createFrameMaterial(modelData, material);
          templeMaterial = frameMaterial.clone();
          child.material = frameMaterial;
        }
      }
    });

    return {
      frame: frameMaterial,
      lens: lensMaterial,
      temple: templeMaterial,
    };
  }

  /**
   * Create frame material from existing material
   */
  private createFrameMaterial(modelData: GlassesModelData, baseMaterial: THREE.Material): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial();
    
    // Copy base properties if available
    if (baseMaterial instanceof THREE.MeshStandardMaterial) {
      material.map = baseMaterial.map;
      material.normalMap = baseMaterial.normalMap;
      material.roughnessMap = baseMaterial.roughnessMap;
      material.metalnessMap = baseMaterial.metalnessMap;
    }

    // Apply model-specific properties
    material.color.setHex(parseInt(modelData.frameColor.replace('#', '0x')));
    
    // Set material properties based on frame material type
    switch (modelData.frameMaterial) {
      case 'metal':
        material.metalness = 0.8;
        material.roughness = 0.2;
        break;
      case 'plastic':
        material.metalness = 0.0;
        material.roughness = 0.4;
        break;
      case 'acetate':
        material.metalness = 0.1;
        material.roughness = 0.3;
        break;
      case 'titanium':
        material.metalness = 0.9;
        material.roughness = 0.1;
        break;
      default:
        material.metalness = 0.2;
        material.roughness = 0.3;
    }

    return material;
  }

  /**
   * Create lens material from existing material
   */
  private createLensMaterial(modelData: GlassesModelData, baseMaterial: THREE.Material): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial();
    
    // Copy base properties if available
    if (baseMaterial instanceof THREE.MeshStandardMaterial) {
      material.map = baseMaterial.map;
      material.normalMap = baseMaterial.normalMap;
    }

    // Apply lens-specific properties
    material.color.setHex(parseInt(modelData.lensColor.replace('#', '0x')));
    material.metalness = 0.0;
    material.roughness = 0.0;
    
    // Set transparency based on lens type
    switch (modelData.lensType) {
      case 'clear':
        material.transparent = true;
        material.opacity = 0.1;
        material.transmission = 0.9;
        break;
      case 'tinted':
        material.transparent = true;
        material.opacity = 0.8;
        material.transmission = 0.2;
        break;
      case 'polarized':
        material.transparent = true;
        material.opacity = 0.9;
        material.transmission = 0.1;
        break;
      default:
        material.transparent = true;
        material.opacity = 0.1;
        material.transmission = 0.9;
    }

    return material;
  }

  /**
   * Normalize model size to match expected dimensions
   */
  private normalizeModelSize(scene: THREE.Group, targetDimensions: any): void {
    const boundingBox = new THREE.Box3().setFromObject(scene);
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    
    console.log('[GLTFLoader] Model bounding box - size:', size, 'center:', center);
    
    // Calculate scale factor based on frame width
    // Target is in meters (e.g., 0.15 = 15cm)
    // GLB models might be in different units
    const currentWidth = Math.max(size.x, 0.001); // Avoid division by zero
    const targetWidth = targetDimensions.frameWidth || 0.15;
    
    // If model is very large (> 1 unit), it's probably in cm or mm
    let scaleFactor = targetWidth / currentWidth;
    
    // Sanity check - if scale is extreme, model units might be wrong
    if (scaleFactor < 0.0001 || scaleFactor > 100) {
      console.warn('[GLTFLoader] Extreme scale factor detected:', scaleFactor, '- using default');
      scaleFactor = 1; // Don't pre-scale, let positioning handle it
    }
    
    console.log('[GLTFLoader] Normalizing model - currentWidth:', currentWidth, 'targetWidth:', targetWidth, 'scaleFactor:', scaleFactor);
    
    scene.scale.setScalar(scaleFactor);
    
    // Center the model at origin
    scene.position.sub(center.multiplyScalar(scaleFactor));
  }

  /**
   * Optimize GLTF model for performance
   */
  optimizeGLTFModel(model: GlassesModel3D): void {
    model.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Merge geometries where possible
        if (child.geometry instanceof THREE.BufferGeometry) {
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }

        // Enable frustum culling
        child.frustumCulled = true;

        // Set render order for transparency
        if (child.material instanceof THREE.Material && child.material.transparent) {
          child.renderOrder = 1;
        }
      }
    });
  }

  /**
   * Create texture from color
   */
  private createColorTexture(color: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Dispose of loader resources
   */
  dispose(): void {
    this.dracoLoader.dispose();
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(): number {
    return this.loadingManager.itemsLoaded / this.loadingManager.itemsTotal;
  }

  /**
   * Check if loader is currently loading
   */
  isLoading(): boolean {
    return this.loadingManager.itemsLoaded < this.loadingManager.itemsTotal;
  }
}
