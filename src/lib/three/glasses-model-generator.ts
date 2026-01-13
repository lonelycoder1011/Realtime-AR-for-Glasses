// Procedural 3D glasses model generator

import * as THREE from 'three';
import {
  GlassesModelData,
  GlassesModel3D,
  MaterialProperties,
  MATERIAL_PRESETS,
  LENS_MATERIAL_PRESETS,
} from '@/types/glasses-models';

export class GlassesModelGenerator {
  private scene: THREE.Scene;
  private textureLoader: THREE.TextureLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Create a procedural glasses model from data
   */
  createGlassesModel(modelData: GlassesModelData): GlassesModel3D {
    const group = new THREE.Group();
    group.name = `glasses-${modelData.id}`;

    // Create materials
    const frameMaterial = this.createFrameMaterial(modelData);
    const lensMaterial = this.createLensMaterial(modelData);
    const templeMaterial = frameMaterial.clone(); // Same as frame for now

    // Create geometry components
    const components = this.createGlassesComponents(modelData, frameMaterial, lensMaterial, templeMaterial);

    // Add components to group
    Object.values(components).forEach(component => {
      if (component) {
        group.add(component);
      }
    });

    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(group);

    const model: GlassesModel3D = {
      id: modelData.id,
      data: modelData,
      mesh: group,
      components,
      materials: {
        frame: frameMaterial,
        lens: lensMaterial,
        temple: templeMaterial,
      },
      boundingBox,
      isLoaded: true,
    };

    return model;
  }

  /**
   * Create frame material based on model data
   */
  private createFrameMaterial(modelData: GlassesModelData): THREE.MeshPhysicalMaterial {
    const preset = MATERIAL_PRESETS[modelData.frameMaterial] || MATERIAL_PRESETS.plastic;
    
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(modelData.frameColor),
      metalness: preset.metallic,
      roughness: preset.roughness,
      transparent: preset.transparent,
      opacity: preset.opacity,
    });

    // Add environment map intensity if available
    if (preset.envMapIntensity !== undefined) {
      material.envMapIntensity = preset.envMapIntensity;
    }

    // Add clearcoat for certain materials
    if (preset.clearcoat !== undefined) {
      material.clearcoat = preset.clearcoat;
      material.clearcoatRoughness = preset.clearcoatRoughness || 0.1;
    }

    return material;
  }

  /**
   * Create lens material based on model data
   */
  private createLensMaterial(modelData: GlassesModelData): THREE.MeshPhysicalMaterial {
    const preset = LENS_MATERIAL_PRESETS[modelData.lensType] || LENS_MATERIAL_PRESETS.clear;
    
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(modelData.lensColor),
      metalness: preset.metallic,
      roughness: preset.roughness,
      transparent: preset.transparent,
      opacity: preset.opacity,
      transmission: modelData.lensType === 'clear' ? 0.9 : 0.0, // High transmission for clear lenses
    });

    if (preset.envMapIntensity !== undefined) {
      material.envMapIntensity = preset.envMapIntensity;
    }

    return material;
  }

  /**
   * Create all glasses components
   */
  private createGlassesComponents(
    modelData: GlassesModelData,
    frameMaterial: THREE.Material,
    lensMaterial: THREE.Material,
    templeMaterial: THREE.Material
  ) {
    const { dimensions } = modelData;

    // Create frame based on category
    let frame: THREE.Mesh | null = null;
    switch (modelData.category) {
      case 'sunglasses':
        frame = this.createAviatorFrame(dimensions, frameMaterial);
        break;
      case 'eyeglasses':
        frame = this.createRectangularFrame(dimensions, frameMaterial);
        break;
      default:
        frame = this.createRectangularFrame(dimensions, frameMaterial);
    }

    // Create lenses
    const leftLens = this.createLens(dimensions, lensMaterial, 'left');
    const rightLens = this.createLens(dimensions, lensMaterial, 'right');

    // Create temples
    const leftTemple = this.createTemple(dimensions, templeMaterial, 'left');
    const rightTemple = this.createTemple(dimensions, templeMaterial, 'right');

    // Create bridge
    const bridge = this.createBridge(dimensions, frameMaterial);

    return {
      frame,
      leftLens,
      rightLens,
      leftTemple,
      rightTemple,
      bridge,
    };
  }

  /**
   * Create aviator-style frame
   */
  private createAviatorFrame(dimensions: any, material: THREE.Material): THREE.Mesh {
    const frameGroup = new THREE.Group();

    // Create teardrop-shaped frame outline
    const frameShape = new THREE.Shape();
    const lensRadius = dimensions.lensWidth / 2;
    
    // Left lens frame (teardrop shape)
    frameShape.moveTo(-dimensions.frameWidth / 2 + lensRadius, 0);
    frameShape.absarc(-dimensions.frameWidth / 2 + lensRadius, 0, lensRadius, 0, Math.PI, false);
    frameShape.lineTo(-dimensions.frameWidth / 2, -lensRadius * 0.3);
    frameShape.quadraticCurveTo(-dimensions.frameWidth / 2 + lensRadius * 0.3, -lensRadius * 1.2, -dimensions.frameWidth / 2 + lensRadius, 0);

    const extrudeSettings = {
      depth: 0.002,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 3,
    };

    const frameGeometry = new THREE.ExtrudeGeometry(frameShape, extrudeSettings);
    const leftFrame = new THREE.Mesh(frameGeometry, material);
    leftFrame.position.set(-dimensions.bridgeWidth / 2 - lensRadius, 0, 0);

    // Right lens frame (mirror of left)
    const rightFrame = leftFrame.clone();
    rightFrame.scale.x = -1;
    rightFrame.position.set(dimensions.bridgeWidth / 2 + lensRadius, 0, 0);

    frameGroup.add(leftFrame);
    frameGroup.add(rightFrame);

    return new THREE.Mesh(new THREE.BufferGeometry(), material); // Placeholder, return group as mesh
  }

  /**
   * Create rectangular frame
   */
  private createRectangularFrame(dimensions: any, material: THREE.Material): THREE.Mesh {
    const frameGroup = new THREE.Group();

    // Create rectangular frame outline
    const frameThickness = 0.003; // 3mm frame thickness
    
    // Left lens frame
    const leftFrameGeometry = new THREE.RingGeometry(
      dimensions.lensWidth / 2 - frameThickness,
      dimensions.lensWidth / 2,
      8,
      1
    );
    const leftFrame = new THREE.Mesh(leftFrameGeometry, material);
    leftFrame.position.set(-dimensions.bridgeWidth / 2 - dimensions.lensWidth / 2, 0, 0);

    // Right lens frame
    const rightFrame = leftFrame.clone();
    rightFrame.position.set(dimensions.bridgeWidth / 2 + dimensions.lensWidth / 2, 0, 0);

    frameGroup.add(leftFrame);
    frameGroup.add(rightFrame);

    return leftFrame; // Return one frame as representative
  }

  /**
   * Create lens geometry
   */
  private createLens(dimensions: any, material: THREE.Material, side: 'left' | 'right'): THREE.Mesh {
    const lensGeometry = new THREE.CircleGeometry(dimensions.lensWidth / 2 - 0.001, 32);
    const lens = new THREE.Mesh(lensGeometry, material);
    
    const xOffset = side === 'left' 
      ? -dimensions.bridgeWidth / 2 - dimensions.lensWidth / 2
      : dimensions.bridgeWidth / 2 + dimensions.lensWidth / 2;
    
    lens.position.set(xOffset, 0, 0.001); // Slightly in front of frame
    lens.name = `${side}-lens`;

    return lens;
  }

  /**
   * Create temple arm
   */
  private createTemple(dimensions: any, material: THREE.Material, side: 'left' | 'right'): THREE.Mesh {
    const templeGeometry = new THREE.BoxGeometry(
      dimensions.templeLength,
      0.004, // 4mm height
      0.002  // 2mm thickness
    );
    
    const temple = new THREE.Mesh(templeGeometry, material);
    
    const xOffset = side === 'left' 
      ? -dimensions.frameWidth / 2 - dimensions.templeLength / 2
      : dimensions.frameWidth / 2 + dimensions.templeLength / 2;
    
    temple.position.set(xOffset, 0, 0);
    temple.name = `${side}-temple`;

    // Add slight curve to temple
    temple.rotation.y = side === 'left' ? -0.1 : 0.1;

    return temple;
  }

  /**
   * Create nose bridge
   */
  private createBridge(dimensions: any, material: THREE.Material): THREE.Mesh {
    const bridgeGeometry = new THREE.CylinderGeometry(
      0.002, // top radius
      0.002, // bottom radius
      dimensions.bridgeWidth,
      8
    );
    
    const bridge = new THREE.Mesh(bridgeGeometry, material);
    bridge.rotation.z = Math.PI / 2; // Rotate to horizontal
    bridge.position.set(0, 0, 0);
    bridge.name = 'bridge';

    return bridge;
  }

  /**
   * Update model materials
   */
  updateModelMaterials(model: GlassesModel3D, frameColor?: string, lensColor?: string): void {
    if (frameColor && model.materials.frame instanceof THREE.MeshPhysicalMaterial) {
      model.materials.frame.color.setHex(parseInt(frameColor.replace('#', '0x')));
    }

    if (lensColor && model.materials.lens instanceof THREE.MeshPhysicalMaterial) {
      model.materials.lens.color.setHex(parseInt(lensColor.replace('#', '0x')));
    }

    // Update temple material to match frame
    if (frameColor && model.materials.temple instanceof THREE.MeshPhysicalMaterial) {
      model.materials.temple.color.setHex(parseInt(frameColor.replace('#', '0x')));
    }
  }

  /**
   * Dispose of model resources
   */
  disposeModel(model: GlassesModel3D): void {
    // Dispose geometries
    model.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
      }
    });

    // Dispose materials
    Object.values(model.materials).forEach(material => {
      if (material) {
        material.dispose();
      }
    });

    // Remove from scene
    if (model.mesh.parent) {
      model.mesh.parent.remove(model.mesh);
    }
  }

  /**
   * Create optimized LOD (Level of Detail) versions
   */
  createLODModel(model: GlassesModel3D): THREE.LOD {
    const lod = new THREE.LOD();

    // High detail (close up)
    lod.addLevel(model.mesh, 0);

    // Medium detail (medium distance)
    const mediumDetail = model.mesh.clone();
    this.reduceMeshDetail(mediumDetail, 0.5);
    lod.addLevel(mediumDetail, 2);

    // Low detail (far distance)
    const lowDetail = model.mesh.clone();
    this.reduceMeshDetail(lowDetail, 0.2);
    lod.addLevel(lowDetail, 5);

    return lod;
  }

  /**
   * Reduce mesh detail for LOD
   */
  private reduceMeshDetail(mesh: THREE.Object3D, factor: number): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Simplify geometry (basic implementation)
        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          const positions = geometry.attributes.position;
          if (positions) {
            const newCount = Math.floor(positions.count * factor);
            const newPositions = new Float32Array(newCount * 3);
            
            for (let i = 0; i < newCount; i++) {
              const sourceIndex = Math.floor(i / factor) * 3;
              newPositions[i * 3] = positions.array[sourceIndex];
              newPositions[i * 3 + 1] = positions.array[sourceIndex + 1];
              newPositions[i * 3 + 2] = positions.array[sourceIndex + 2];
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
          }
        }
      }
    });
  }
}
