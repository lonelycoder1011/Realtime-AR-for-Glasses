// Level-of-Detail (LOD) management system

import * as THREE from 'three';
import { LODLevel } from '@/types/performance-optimization';

export class LODManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private lodObjects: Map<string, THREE.LOD> = new Map();
  private lodLevels: LODLevel[];
  private enabled: boolean = true;
  private bias: number = 0.0;
  private hysteresis: number = 0.1; // Prevent LOD flickering

  constructor(scene: THREE.Scene, camera: THREE.Camera, lodLevels: LODLevel[]) {
    this.scene = scene;
    this.camera = camera;
    this.lodLevels = lodLevels;
  }

  /**
   * Create LOD object from base geometry
   */
  createLODObject(
    id: string,
    baseGeometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    position: THREE.Vector3 = new THREE.Vector3()
  ): THREE.LOD {
    const lod = new THREE.LOD();
    lod.name = `lod_${id}`;
    lod.position.copy(position);

    // Generate LOD levels
    this.lodLevels.forEach((level, index) => {
      const lodGeometry = this.generateLODGeometry(baseGeometry, level);
      const lodMaterial = this.generateLODMaterial(material, level);
      const mesh = new THREE.Mesh(lodGeometry, lodMaterial);
      
      // Configure mesh based on LOD level
      mesh.castShadow = level.shadowCasting;
      mesh.receiveShadow = true;
      
      lod.addLevel(mesh, level.distance + this.bias);
    });

    this.lodObjects.set(id, lod);
    this.scene.add(lod);
    
    return lod;
  }

  /**
   * Generate simplified geometry for LOD level
   */
  private generateLODGeometry(baseGeometry: THREE.BufferGeometry, level: LODLevel): THREE.BufferGeometry {
    const geometry = baseGeometry.clone();
    
    // Simplify geometry based on vertex count target
    if (level.vertexCount < this.getVertexCount(baseGeometry)) {
      return this.simplifyGeometry(geometry, level.vertexCount);
    }
    
    return geometry;
  }

  /**
   * Generate material for LOD level
   */
  private generateLODMaterial(baseMaterial: THREE.Material | THREE.Material[], level: LODLevel): THREE.Material | THREE.Material[] {
    const materials = Array.isArray(baseMaterial) ? baseMaterial : [baseMaterial];
    
    return materials.map(material => {
      const lodMaterial = material.clone();
      
      if (lodMaterial instanceof THREE.MeshStandardMaterial || 
          lodMaterial instanceof THREE.MeshPhysicalMaterial) {
        
        // Adjust material complexity based on LOD level
        switch (level.materialComplexity) {
          case 'low':
            this.applyLowComplexityMaterial(lodMaterial);
            break;
          case 'medium':
            this.applyMediumComplexityMaterial(lodMaterial);
            break;
          case 'high':
            // Keep original material
            break;
        }

        // Disable reflections for distant LODs
        if (!level.reflections) {
          lodMaterial.envMapIntensity = 0;
        }
      }
      
      return lodMaterial;
    });
  }

  /**
   * Apply low complexity material settings
   */
  private applyLowComplexityMaterial(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial): void {
    // Remove expensive textures
    material.normalMap = null;
    material.roughnessMap = null;
    material.metalnessMap = null;
    material.aoMap = null;
    
    // Simplify material properties
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat = 0;
      material.transmission = 0;
      material.thickness = 0;
    }
    
    material.envMapIntensity = 0;
  }

  /**
   * Apply medium complexity material settings
   */
  private applyMediumComplexityMaterial(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial): void {
    // Keep basic textures but reduce others
    material.aoMap = null;
    
    // Reduce material complexity
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat *= 0.5;
      material.transmission *= 0.5;
    }
    
    material.envMapIntensity *= 0.5;
  }

  /**
   * Simplify geometry by reducing vertex count
   */
  private simplifyGeometry(geometry: THREE.BufferGeometry, targetVertexCount: number): THREE.BufferGeometry {
    const currentVertexCount = this.getVertexCount(geometry);
    
    if (currentVertexCount <= targetVertexCount) {
      return geometry;
    }

    // Simple decimation - remove every nth vertex
    const ratio = targetVertexCount / currentVertexCount;
    const step = Math.floor(1 / ratio);
    
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uvs = geometry.attributes.uv;
    const indices = geometry.index;

    if (!positions || !indices) {
      return geometry;
    }

    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUvs: number[] = [];
    const newIndices: number[] = [];
    const vertexMap: Map<number, number> = new Map();

    // Decimate vertices
    for (let i = 0; i < positions.count; i += step) {
      const newIndex = newPositions.length / 3;
      vertexMap.set(i, newIndex);
      
      // Copy position
      newPositions.push(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      
      // Copy normal if available
      if (normals) {
        newNormals.push(
          normals.getX(i),
          normals.getY(i),
          normals.getZ(i)
        );
      }
      
      // Copy UV if available
      if (uvs) {
        newUvs.push(
          uvs.getX(i),
          uvs.getY(i)
        );
      }
    }

    // Rebuild indices
    for (let i = 0; i < indices.count; i += 3) {
      const a = indices.getX(i);
      const b = indices.getX(i + 1);
      const c = indices.getX(i + 2);
      
      const newA = vertexMap.get(Math.floor(a / step) * step);
      const newB = vertexMap.get(Math.floor(b / step) * step);
      const newC = vertexMap.get(Math.floor(c / step) * step);
      
      if (newA !== undefined && newB !== undefined && newC !== undefined && 
          newA !== newB && newB !== newC && newA !== newC) {
        newIndices.push(newA, newB, newC);
      }
    }

    // Create new geometry
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    
    if (newNormals.length > 0) {
      newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    } else {
      newGeometry.computeVertexNormals();
    }
    
    if (newUvs.length > 0) {
      newGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
    }
    
    newGeometry.setIndex(newIndices);
    
    return newGeometry;
  }

  /**
   * Get vertex count from geometry
   */
  private getVertexCount(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position;
    return positions ? positions.count : 0;
  }

  /**
   * Update LOD system (call once per frame)
   */
  update(): void {
    if (!this.enabled) return;

    // Update LOD objects
    this.lodObjects.forEach((lod) => {
      lod.update(this.camera);
    });
  }

  /**
   * Set LOD bias
   */
  setBias(bias: number): void {
    this.bias = bias;
    
    // Update existing LOD objects
    this.lodObjects.forEach((lod) => {
      lod.levels.forEach((level, index) => {
        if (index < this.lodLevels.length) {
          level.distance = this.lodLevels[index].distance + bias;
        }
      });
    });
  }

  /**
   * Enable/disable LOD system
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled) {
      // Force highest LOD for all objects
      this.lodObjects.forEach((lod) => {
        if (lod.levels.length > 0) {
          lod.levels.forEach((level, index) => {
            level.object.visible = index === 0;
          });
        }
      });
    }
  }

  /**
   * Get LOD object by ID
   */
  getLODObject(id: string): THREE.LOD | undefined {
    return this.lodObjects.get(id);
  }

  /**
   * Remove LOD object
   */
  removeLODObject(id: string): void {
    const lod = this.lodObjects.get(id);
    if (lod) {
      this.scene.remove(lod);
      
      // Dispose geometry and materials
      lod.levels.forEach((level) => {
        const mesh = level.object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      
      this.lodObjects.delete(id);
    }
  }

  /**
   * Get current LOD level for object
   */
  getCurrentLODLevel(id: string): number {
    const lod = this.lodObjects.get(id);
    if (!lod) return -1;

    // Find currently visible level
    for (let i = 0; i < lod.levels.length; i++) {
      if (lod.levels[i].object.visible) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Get LOD statistics
   */
  getLODStats(): {
    totalObjects: number;
    activeLevel0: number;
    activeLevel1: number;
    activeLevel2: number;
    averageDistance: number;
  } {
    let activeLevel0 = 0;
    let activeLevel1 = 0;
    let activeLevel2 = 0;
    let totalDistance = 0;
    let objectCount = 0;

    this.lodObjects.forEach((lod) => {
      const distance = lod.position.distanceTo(this.camera.position);
      totalDistance += distance;
      objectCount++;

      const currentLevel = this.getCurrentLODLevel(lod.name);
      switch (currentLevel) {
        case 0: activeLevel0++; break;
        case 1: activeLevel1++; break;
        case 2: activeLevel2++; break;
      }
    });

    return {
      totalObjects: this.lodObjects.size,
      activeLevel0,
      activeLevel1,
      activeLevel2,
      averageDistance: objectCount > 0 ? totalDistance / objectCount : 0,
    };
  }

  /**
   * Update LOD levels configuration
   */
  updateLODLevels(newLevels: LODLevel[]): void {
    this.lodLevels = newLevels;
    
    // Recreate all LOD objects with new levels
    const objectsToRecreate: Array<{id: string, position: THREE.Vector3}> = [];
    
    this.lodObjects.forEach((lod, id) => {
      objectsToRecreate.push({
        id,
        position: lod.position.clone(),
      });
    });
    
    // Clear existing objects
    objectsToRecreate.forEach(({ id }) => {
      this.removeLODObject(id);
    });
    
    // Note: This would require access to original geometries and materials
    // In practice, you'd want to store these references for recreation
  }

  /**
   * Dispose of all LOD objects
   */
  dispose(): void {
    const ids = Array.from(this.lodObjects.keys());
    ids.forEach(id => this.removeLODObject(id));
  }

  /**
   * Set camera for distance calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage(): {
    geometries: number;
    materials: number;
    textures: number;
    total: number;
  } {
    let geometries = 0;
    let materials = 0;
    let textures = 0;

    this.lodObjects.forEach((lod) => {
      lod.levels.forEach((level) => {
        const mesh = level.object as THREE.Mesh;
        
        if (mesh.geometry) {
          geometries++;
        }
        
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            materials += mesh.material.length;
            mesh.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                if (mat.map) textures++;
                if (mat.normalMap) textures++;
                if (mat.roughnessMap) textures++;
                if (mat.metalnessMap) textures++;
              }
            });
          } else {
            materials++;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              if (mesh.material.map) textures++;
              if (mesh.material.normalMap) textures++;
              if (mesh.material.roughnessMap) textures++;
              if (mesh.material.metalnessMap) textures++;
            }
          }
        }
      });
    });

    return {
      geometries,
      materials,
      textures,
      total: geometries + materials + textures,
    };
  }
}
