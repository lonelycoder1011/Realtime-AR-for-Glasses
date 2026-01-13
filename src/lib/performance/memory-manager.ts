// Efficient memory management system

import * as THREE from 'three';

export interface MemoryPool<T> {
  available: T[];
  inUse: Set<T>;
  factory: () => T;
  reset: (item: T) => void;
  maxSize: number;
}

export interface MemoryStats {
  geometries: number;
  textures: number;
  materials: number;
  renderTargets: number;
  totalMemoryUsage: number;
  poolStats: Map<string, { available: number; inUse: number }>;
}

export class MemoryManager {
  private geometryPool: MemoryPool<THREE.BufferGeometry>;
  private materialPool: MemoryPool<THREE.Material>;
  private texturePool: MemoryPool<THREE.Texture>;
  private renderTargetPool: MemoryPool<THREE.WebGLRenderTarget>;
  
  private disposalQueue: Set<THREE.Object3D> = new Set();
  private lastCleanupTime: number = 0;
  private cleanupInterval: number = 5000; // 5 seconds
  private memoryThreshold: number = 100 * 1024 * 1024; // 100MB
  
  private trackedObjects: WeakMap<object, string> = new WeakMap();
  private memoryUsage: Map<string, number> = new Map();

  constructor() {
    this.geometryPool = this.createGeometryPool();
    this.materialPool = this.createMaterialPool();
    this.texturePool = this.createTexturePool();
    this.renderTargetPool = this.createRenderTargetPool();

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Create geometry object pool
   */
  private createGeometryPool(): MemoryPool<THREE.BufferGeometry> {
    return {
      available: [],
      inUse: new Set(),
      maxSize: 50,
      factory: () => new THREE.BufferGeometry(),
      reset: (geometry) => {
        geometry.dispose();
        geometry.attributes = {};
        geometry.index = null;
        geometry.groups = [];
        geometry.boundingBox = null;
        geometry.boundingSphere = null;
      },
    };
  }

  /**
   * Create material object pool
   */
  private createMaterialPool(): MemoryPool<THREE.Material> {
    return {
      available: [],
      inUse: new Set(),
      maxSize: 30,
      factory: () => new THREE.MeshStandardMaterial(),
      reset: (material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.map = null;
          material.normalMap = null;
          material.roughnessMap = null;
          material.metalnessMap = null;
          material.envMap = null;
          material.color.setHex(0xffffff);
          material.metalness = 0;
          material.roughness = 1;
          material.transparent = false;
          material.opacity = 1;
        }
      },
    };
  }

  /**
   * Create texture object pool
   */
  private createTexturePool(): MemoryPool<THREE.Texture> {
    return {
      available: [],
      inUse: new Set(),
      maxSize: 20,
      factory: () => new THREE.Texture(),
      reset: (texture) => {
        texture.dispose();
        texture.image = null;
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
      },
    };
  }

  /**
   * Create render target object pool
   */
  private createRenderTargetPool(): MemoryPool<THREE.WebGLRenderTarget> {
    return {
      available: [],
      inUse: new Set(),
      maxSize: 10,
      factory: () => new THREE.WebGLRenderTarget(512, 512),
      reset: (renderTarget) => {
        renderTarget.dispose();
        renderTarget.setSize(512, 512);
      },
    };
  }

  /**
   * Get object from pool
   */
  getFromPool<T>(pool: MemoryPool<T>): T {
    let item: T;

    if (pool.available.length > 0) {
      item = pool.available.pop()!;
    } else {
      item = pool.factory();
    }

    pool.inUse.add(item);
    this.trackObject(item, `pool_${pool.constructor.name}`);
    
    return item;
  }

  /**
   * Return object to pool
   */
  returnToPool<T>(pool: MemoryPool<T>, item: T): void {
    if (pool.inUse.has(item)) {
      pool.inUse.delete(item);
      
      if (pool.available.length < pool.maxSize) {
        pool.reset(item);
        pool.available.push(item);
      } else {
        // Pool is full, dispose the item
        this.disposeObject(item);
      }
      
      this.untrackObject(item);
    }
  }

  /**
   * Get geometry from pool
   */
  getGeometry(): THREE.BufferGeometry {
    return this.getFromPool(this.geometryPool);
  }

  /**
   * Return geometry to pool
   */
  returnGeometry(geometry: THREE.BufferGeometry): void {
    this.returnToPool(this.geometryPool, geometry);
  }

  /**
   * Get material from pool
   */
  getMaterial(): THREE.Material {
    return this.getFromPool(this.materialPool);
  }

  /**
   * Return material to pool
   */
  returnMaterial(material: THREE.Material): void {
    this.returnToPool(this.materialPool, material);
  }

  /**
   * Get texture from pool
   */
  getTexture(): THREE.Texture {
    return this.getFromPool(this.texturePool);
  }

  /**
   * Return texture to pool
   */
  returnTexture(texture: THREE.Texture): void {
    this.returnToPool(this.texturePool, texture);
  }

  /**
   * Get render target from pool
   */
  getRenderTarget(width: number = 512, height: number = 512): THREE.WebGLRenderTarget {
    const renderTarget = this.getFromPool(this.renderTargetPool);
    renderTarget.setSize(width, height);
    return renderTarget;
  }

  /**
   * Return render target to pool
   */
  returnRenderTarget(renderTarget: THREE.WebGLRenderTarget): void {
    this.returnToPool(this.renderTargetPool, renderTarget);
  }

  /**
   * Track object memory usage
   */
  trackObject(obj: any, category: string): void {
    this.trackedObjects.set(obj, category);
    
    let size = 0;
    if (obj instanceof THREE.BufferGeometry) {
      size = this.estimateGeometrySize(obj);
    } else if (obj instanceof THREE.Texture) {
      size = this.estimateTextureSize(obj);
    } else if (obj instanceof THREE.Material) {
      size = this.estimateMaterialSize(obj);
    } else if (obj instanceof THREE.WebGLRenderTarget) {
      size = this.estimateRenderTargetSize(obj);
    }

    const currentUsage = this.memoryUsage.get(category) || 0;
    this.memoryUsage.set(category, currentUsage + size);
  }

  /**
   * Untrack object memory usage
   */
  untrackObject(obj: any): void {
    const category = this.trackedObjects.get(obj);
    if (category) {
      let size = 0;
      if (obj instanceof THREE.BufferGeometry) {
        size = this.estimateGeometrySize(obj);
      } else if (obj instanceof THREE.Texture) {
        size = this.estimateTextureSize(obj);
      } else if (obj instanceof THREE.Material) {
        size = this.estimateMaterialSize(obj);
      } else if (obj instanceof THREE.WebGLRenderTarget) {
        size = this.estimateRenderTargetSize(obj);
      }

      const currentUsage = this.memoryUsage.get(category) || 0;
      this.memoryUsage.set(category, Math.max(0, currentUsage - size));
      this.trackedObjects.delete(obj);
    }
  }

  /**
   * Estimate geometry memory size
   */
  private estimateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0;
    
    Object.values(geometry.attributes).forEach(attribute => {
      if (attribute && attribute.array) {
        size += attribute.array.byteLength;
      }
    });
    
    if (geometry.index) {
      size += geometry.index.array.byteLength;
    }
    
    return size;
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 0;
    
    const width = texture.image.width || 512;
    const height = texture.image.height || 512;
    const channels = 4; // RGBA
    const bytesPerChannel = 1; // 8-bit
    
    let size = width * height * channels * bytesPerChannel;
    
    // Account for mipmaps
    if (texture.generateMipmaps) {
      size *= 1.33; // Approximate mipmap overhead
    }
    
    return size;
  }

  /**
   * Estimate material memory size
   */
  private estimateMaterialSize(material: THREE.Material): number {
    // Base material size
    let size = 1024; // Base material overhead
    
    // Add texture sizes
    if (material instanceof THREE.MeshStandardMaterial) {
      const textures = [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
        material.aoMap,
        material.envMap,
      ].filter(Boolean);
      
      textures.forEach(texture => {
        if (texture) {
          size += this.estimateTextureSize(texture);
        }
      });
    }
    
    return size;
  }

  /**
   * Estimate render target memory size
   */
  private estimateRenderTargetSize(renderTarget: THREE.WebGLRenderTarget): number {
    const width = renderTarget.width;
    const height = renderTarget.height;
    const channels = 4; // RGBA
    const bytesPerChannel = renderTarget.type === THREE.FloatType ? 4 : 1;
    
    return width * height * channels * bytesPerChannel;
  }

  /**
   * Schedule object for disposal
   */
  scheduleDisposal(object: THREE.Object3D): void {
    this.disposalQueue.add(object);
  }

  /**
   * Dispose object immediately
   */
  disposeObject(obj: any): void {
    if (obj instanceof THREE.BufferGeometry) {
      obj.dispose();
    } else if (obj instanceof THREE.Texture) {
      obj.dispose();
    } else if (obj instanceof THREE.Material) {
      obj.dispose();
    } else if (obj instanceof THREE.WebGLRenderTarget) {
      obj.dispose();
    } else if (obj instanceof THREE.Object3D) {
      this.disposeObject3D(obj);
    }
    
    this.untrackObject(obj);
  }

  /**
   * Dispose Object3D and its resources
   */
  private disposeObject3D(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          this.returnGeometry(child.geometry);
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.returnMaterial(material));
          } else {
            this.returnMaterial(child.material);
          }
        }
      }
    });
    
    // Remove from parent
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Perform garbage collection
   */
  performGarbageCollection(): void {
    // Process disposal queue
    this.disposalQueue.forEach(object => {
      this.disposeObject(object);
    });
    this.disposalQueue.clear();

    // Check memory usage and free resources if needed
    const totalMemory = this.getTotalMemoryUsage();
    if (totalMemory > this.memoryThreshold) {
      this.emergencyCleanup();
    }

    // Clean up pools
    this.cleanupPools();
  }

  /**
   * Emergency cleanup when memory threshold is exceeded
   */
  private emergencyCleanup(): void {
    console.warn('Memory threshold exceeded, performing emergency cleanup');
    
    // Clear half of each pool
    [this.geometryPool, this.materialPool, this.texturePool, this.renderTargetPool].forEach(pool => {
      const itemsToDispose = pool.available.splice(0, Math.floor(pool.available.length / 2));
      itemsToDispose.forEach(item => this.disposeObject(item));
    });
  }

  /**
   * Clean up pools by removing excess items
   */
  private cleanupPools(): void {
    [this.geometryPool, this.materialPool, this.texturePool, this.renderTargetPool].forEach(pool => {
      // Keep only half of max size in available pool
      const targetSize = Math.floor(pool.maxSize / 2);
      if (pool.available.length > targetSize) {
        const itemsToDispose = pool.available.splice(targetSize);
        itemsToDispose.forEach(item => this.disposeObject(item));
      }
    });
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    const cleanup = () => {
      const now = performance.now();
      if (now - this.lastCleanupTime > this.cleanupInterval) {
        this.performGarbageCollection();
        this.lastCleanupTime = now;
      }
      
      requestAnimationFrame(cleanup);
    };
    
    cleanup();
  }

  /**
   * Get total memory usage
   */
  getTotalMemoryUsage(): number {
    let total = 0;
    this.memoryUsage.forEach(usage => {
      total += usage;
    });
    return total;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    const poolStats = new Map();
    
    poolStats.set('geometry', {
      available: this.geometryPool.available.length,
      inUse: this.geometryPool.inUse.size,
    });
    
    poolStats.set('material', {
      available: this.materialPool.available.length,
      inUse: this.materialPool.inUse.size,
    });
    
    poolStats.set('texture', {
      available: this.texturePool.available.length,
      inUse: this.texturePool.inUse.size,
    });
    
    poolStats.set('renderTarget', {
      available: this.renderTargetPool.available.length,
      inUse: this.renderTargetPool.inUse.size,
    });

    return {
      geometries: this.memoryUsage.get('geometry') || 0,
      textures: this.memoryUsage.get('texture') || 0,
      materials: this.memoryUsage.get('material') || 0,
      renderTargets: this.memoryUsage.get('renderTarget') || 0,
      totalMemoryUsage: this.getTotalMemoryUsage(),
      poolStats,
    };
  }

  /**
   * Set memory threshold
   */
  setMemoryThreshold(threshold: number): void {
    this.memoryThreshold = threshold;
  }

  /**
   * Set cleanup interval
   */
  setCleanupInterval(interval: number): void {
    this.cleanupInterval = interval;
  }

  /**
   * Force immediate cleanup
   */
  forceCleanup(): void {
    this.performGarbageCollection();
  }

  /**
   * Clear all pools and tracked objects
   */
  dispose(): void {
    // Dispose all pool items
    [this.geometryPool, this.materialPool, this.texturePool, this.renderTargetPool].forEach(pool => {
      [...pool.available, ...pool.inUse].forEach(item => {
        this.disposeObject(item);
      });
      pool.available.length = 0;
      pool.inUse.clear();
    });

    // Clear disposal queue
    this.disposalQueue.forEach(object => {
      this.disposeObject(object);
    });
    this.disposalQueue.clear();

    // Clear tracking
    this.memoryUsage.clear();
  }
}
