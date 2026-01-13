// Geometry optimization and LOD system for 3D models

import * as THREE from 'three';

export interface GeometryLOD {
  distance: number;
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  triangleCount: number;
}

export interface OptimizationConfig {
  enableLOD: boolean;
  enableInstancing: boolean;
  enableFrustumCulling: boolean;
  enableOcclusionCulling: boolean;
  maxInstanceCount: number;
  lodDistances: number[];
  simplificationRatio: number[];
}

export class GeometryOptimizer {
  private lodCache: Map<string, GeometryLOD[]> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private config: OptimizationConfig;
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();

  constructor(config: OptimizationConfig) {
    this.config = config;
  }

  /**
   * Create LOD levels for a geometry
   */
  createLODLevels(
    originalGeometry: THREE.BufferGeometry,
    geometryId: string
  ): GeometryLOD[] {
    if (this.lodCache.has(geometryId)) {
      return this.lodCache.get(geometryId)!;
    }

    const lodLevels: GeometryLOD[] = [];
    
    // Original geometry (highest detail)
    lodLevels.push({
      distance: this.config.lodDistances[0] || 0,
      geometry: originalGeometry.clone(),
      vertexCount: this.getVertexCount(originalGeometry),
      triangleCount: this.getTriangleCount(originalGeometry),
    });

    // Generate simplified versions
    for (let i = 1; i < this.config.lodDistances.length; i++) {
      const simplificationRatio = this.config.simplificationRatio[i - 1] || 0.5;
      const simplifiedGeometry = this.simplifyGeometry(originalGeometry, simplificationRatio);
      
      lodLevels.push({
        distance: this.config.lodDistances[i],
        geometry: simplifiedGeometry,
        vertexCount: this.getVertexCount(simplifiedGeometry),
        triangleCount: this.getTriangleCount(simplifiedGeometry),
      });
    }

    this.lodCache.set(geometryId, lodLevels);
    return lodLevels;
  }

  /**
   * Simplify geometry by reducing vertex count
   */
  private simplifyGeometry(
    geometry: THREE.BufferGeometry,
    ratio: number
  ): THREE.BufferGeometry {
    const simplified = geometry.clone();
    
    // Get position attribute
    const positions = simplified.attributes.position;
    const normals = simplified.attributes.normal;
    const uvs = simplified.attributes.uv;
    const indices = simplified.index;

    if (!positions || !indices) {
      return simplified;
    }

    const originalVertexCount = positions.count;
    const targetVertexCount = Math.floor(originalVertexCount * ratio);
    
    if (targetVertexCount >= originalVertexCount) {
      return simplified;
    }

    // Simple decimation algorithm
    const step = Math.ceil(originalVertexCount / targetVertexCount);
    
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUvs: number[] = [];
    const newIndices: number[] = [];
    const vertexMap: Map<number, number> = new Map();

    // Decimate vertices
    for (let i = 0; i < originalVertexCount; i += step) {
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
      
      const newA = this.findNearestVertex(a, vertexMap, step);
      const newB = this.findNearestVertex(b, vertexMap, step);
      const newC = this.findNearestVertex(c, vertexMap, step);
      
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
   * Find nearest vertex in vertex map
   */
  private findNearestVertex(
    originalIndex: number,
    vertexMap: Map<number, number>,
    step: number
  ): number | undefined {
    // Find the closest decimated vertex
    const baseIndex = Math.floor(originalIndex / step) * step;
    return vertexMap.get(baseIndex);
  }

  /**
   * Create instanced mesh for repeated geometries
   */
  createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxCount: number,
    meshId: string
  ): THREE.InstancedMesh {
    if (this.instancedMeshes.has(meshId)) {
      return this.instancedMeshes.get(meshId)!;
    }

    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    this.instancedMeshes.set(meshId, instancedMesh);
    return instancedMesh;
  }

  /**
   * Update instanced mesh transforms
   */
  updateInstancedMesh(
    meshId: string,
    transforms: THREE.Matrix4[],
    colors?: THREE.Color[]
  ): void {
    const instancedMesh = this.instancedMeshes.get(meshId);
    if (!instancedMesh) return;

    // Update transforms
    transforms.forEach((transform, index) => {
      instancedMesh.setMatrixAt(index, transform);
    });

    // Update colors if provided
    if (colors && instancedMesh.instanceColor) {
      colors.forEach((color, index) => {
        instancedMesh.setColorAt(index, color);
      });
      instancedMesh.instanceColor.needsUpdate = true;
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.count = transforms.length;
  }

  /**
   * Perform frustum culling
   */
  performFrustumCulling(
    objects: THREE.Object3D[],
    camera: THREE.Camera
  ): THREE.Object3D[] {
    if (!this.config.enableFrustumCulling) {
      return objects;
    }

    // Update frustum
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);

    return objects.filter(object => {
      // Update world matrix
      object.updateMatrixWorld();
      
      // Check if object is in frustum
      const boundingBox = new THREE.Box3().setFromObject(object);
      return this.frustum.intersectsBox(boundingBox);
    });
  }

  /**
   * Perform occlusion culling (simplified)
   */
  performOcclusionCulling(
    objects: THREE.Object3D[],
    camera: THREE.Camera,
    occluders: THREE.Object3D[] = []
  ): THREE.Object3D[] {
    if (!this.config.enableOcclusionCulling || occluders.length === 0) {
      return objects;
    }

    const raycaster = new THREE.Raycaster();
    const cameraPosition = camera.position;

    return objects.filter(object => {
      const objectPosition = new THREE.Vector3();
      object.getWorldPosition(objectPosition);
      
      // Cast ray from camera to object
      const direction = objectPosition.clone().sub(cameraPosition).normalize();
      raycaster.set(cameraPosition, direction);
      
      // Check for intersections with occluders
      const intersections = raycaster.intersectObjects(occluders, true);
      
      // If no intersections or object is closer than occluders, it's visible
      const distanceToObject = cameraPosition.distanceTo(objectPosition);
      return intersections.length === 0 || intersections[0].distance > distanceToObject;
    });
  }

  /**
   * Select appropriate LOD level based on distance
   */
  selectLODLevel(
    lodLevels: GeometryLOD[],
    distanceToCamera: number
  ): GeometryLOD {
    for (let i = lodLevels.length - 1; i >= 0; i--) {
      if (distanceToCamera >= lodLevels[i].distance) {
        return lodLevels[i];
      }
    }
    return lodLevels[0]; // Return highest detail if distance is very small
  }

  /**
   * Optimize scene for rendering
   */
  optimizeScene(
    scene: THREE.Scene,
    camera: THREE.Camera
  ): {
    visibleObjects: THREE.Object3D[];
    culledObjects: number;
    lodSwitches: number;
  } {
    let culledObjects = 0;
    let lodSwitches = 0;
    let visibleObjects: THREE.Object3D[] = [];

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        visibleObjects.push(object);
      }
    });

    // Perform culling
    const originalCount = visibleObjects.length;
    visibleObjects = this.performFrustumCulling(visibleObjects, camera);
    visibleObjects = this.performOcclusionCulling(visibleObjects, camera);
    culledObjects = originalCount - visibleObjects.length;

    // Update LOD levels
    visibleObjects.forEach(object => {
      if (object.userData.geometryId && object instanceof THREE.Mesh) {
        const lodLevels = this.lodCache.get(object.userData.geometryId);
        if (lodLevels) {
          const distance = camera.position.distanceTo(object.position);
          const selectedLOD = this.selectLODLevel(lodLevels, distance);
          
          if (object.geometry !== selectedLOD.geometry) {
            object.geometry = selectedLOD.geometry;
            lodSwitches++;
          }
        }
      }
    });

    return {
      visibleObjects,
      culledObjects,
      lodSwitches,
    };
  }

  /**
   * Get vertex count from geometry
   */
  private getVertexCount(geometry: THREE.BufferGeometry): number {
    const positions = geometry.attributes.position;
    return positions ? positions.count : 0;
  }

  /**
   * Get triangle count from geometry
   */
  private getTriangleCount(geometry: THREE.BufferGeometry): number {
    const indices = geometry.index;
    return indices ? indices.count / 3 : this.getVertexCount(geometry) / 3;
  }

  /**
   * Merge geometries for batching
   */
  mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 0) {
      return new THREE.BufferGeometry();
    }

    if (geometries.length === 1) {
      return geometries[0];
    }

    // Use Three.js built-in geometry merging
    return THREE.BufferGeometryUtils.mergeGeometries(geometries);
  }

  /**
   * Create texture atlas from multiple textures
   */
  createTextureAtlas(
    textures: THREE.Texture[],
    atlasSize: number = 1024
  ): {
    atlas: THREE.Texture;
    uvTransforms: THREE.Matrix3[];
  } {
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d')!;

    const uvTransforms: THREE.Matrix3[] = [];
    const tilesPerRow = Math.ceil(Math.sqrt(textures.length));
    const tileSize = atlasSize / tilesPerRow;

    textures.forEach((texture, index) => {
      const row = Math.floor(index / tilesPerRow);
      const col = index % tilesPerRow;
      const x = col * tileSize;
      const y = row * tileSize;

      // Draw texture to atlas
      if (texture.image) {
        ctx.drawImage(texture.image, x, y, tileSize, tileSize);
      }

      // Calculate UV transform
      const transform = new THREE.Matrix3();
      transform.setUvTransform(
        x / atlasSize,
        y / atlasSize,
        tileSize / atlasSize,
        tileSize / atlasSize,
        0,
        0,
        0
      );
      uvTransforms.push(transform);
    });

    const atlas = new THREE.CanvasTexture(canvas);
    atlas.needsUpdate = true;

    return { atlas, uvTransforms };
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    lodCacheSize: number;
    instancedMeshCount: number;
    totalVerticesReduced: number;
    memoryUsage: number;
  } {
    let totalVerticesReduced = 0;
    
    this.lodCache.forEach(lodLevels => {
      if (lodLevels.length > 1) {
        const originalVertices = lodLevels[0].vertexCount;
        const reducedVertices = lodLevels[lodLevels.length - 1].vertexCount;
        totalVerticesReduced += originalVertices - reducedVertices;
      }
    });

    return {
      lodCacheSize: this.lodCache.size,
      instancedMeshCount: this.instancedMeshes.size,
      totalVerticesReduced,
      memoryUsage: this.lodCache.size * 1024 + this.instancedMeshes.size * 512, // Rough estimate
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    // Dispose geometries in LOD cache
    this.lodCache.forEach(lodLevels => {
      lodLevels.forEach(lod => {
        lod.geometry.dispose();
      });
    });
    
    // Dispose instanced meshes
    this.instancedMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });

    this.lodCache.clear();
    this.instancedMeshes.clear();
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
