// Bundle size and loading optimization system

import * as THREE from 'three';

export interface AssetLoadingConfig {
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  maxConcurrentLoads: number;
  loadingPriority: 'high' | 'medium' | 'low';
  chunkSize: number;
}

export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string;
  estimatedTimeRemaining: number;
}

export interface AssetManifest {
  models: Array<{
    id: string;
    url: string;
    size: number;
    priority: number;
    dependencies: string[];
  }>;
  textures: Array<{
    id: string;
    url: string;
    size: number;
    priority: number;
    format: string;
  }>;
  shaders: Array<{
    id: string;
    vertex: string;
    fragment: string;
    size: number;
  }>;
}

export class BundleOptimizer {
  private config: AssetLoadingConfig;
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private loadedAssets: Map<string, any> = new Map();
  private assetCache: Map<string, ArrayBuffer> = new Map();
  private loadingProgress: LoadingProgress;
  private activeLoads: number = 0;
  private loadStartTimes: Map<string, number> = new Map();

  constructor(config: AssetLoadingConfig) {
    this.config = config;
    this.loadingProgress = {
      loaded: 0,
      total: 0,
      percentage: 0,
      currentAsset: '',
      estimatedTimeRemaining: 0,
    };

    this.setupServiceWorker();
  }

  /**
   * Setup service worker for caching
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && this.config.enableCaching) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
    }
  }

  /**
   * Load asset manifest
   */
  async loadManifest(manifestUrl: string): Promise<AssetManifest> {
    try {
      const response = await fetch(manifestUrl);
      const manifest: AssetManifest = await response.json();
      
      // Sort assets by priority
      manifest.models.sort((a, b) => b.priority - a.priority);
      manifest.textures.sort((a, b) => b.priority - a.priority);
      
      return manifest;
    } catch (error) {
      console.error('Failed to load asset manifest:', error);
      throw error;
    }
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets(manifest: AssetManifest): Promise<void> {
    if (!this.config.enablePreloading) return;

    const criticalAssets = [
      ...manifest.models.filter(asset => asset.priority >= 8),
      ...manifest.textures.filter(asset => asset.priority >= 8),
    ];

    this.loadingProgress.total = criticalAssets.length;
    this.loadingProgress.loaded = 0;

    const loadPromises = criticalAssets.map(asset => 
      this.loadAssetWithProgress(asset.url, asset.id)
    );

    await Promise.all(loadPromises);
  }

  /**
   * Load asset with progress tracking
   */
  private async loadAssetWithProgress(url: string, assetId: string): Promise<any> {
    if (this.loadedAssets.has(assetId)) {
      return this.loadedAssets.get(assetId);
    }

    // Check if already loading
    if (this.loadingQueue.has(assetId)) {
      return this.loadingQueue.get(assetId);
    }

    // Wait for available slot
    while (this.activeLoads >= this.config.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeLoads++;
    this.loadStartTimes.set(assetId, performance.now());
    this.loadingProgress.currentAsset = assetId;

    const loadPromise = this.loadAsset(url, assetId);
    this.loadingQueue.set(assetId, loadPromise);

    try {
      const asset = await loadPromise;
      this.loadedAssets.set(assetId, asset);
      this.loadingProgress.loaded++;
      this.updateLoadingProgress();
      return asset;
    } finally {
      this.activeLoads--;
      this.loadingQueue.delete(assetId);
      this.loadStartTimes.delete(assetId);
    }
  }

  /**
   * Load individual asset
   */
  private async loadAsset(url: string, assetId: string): Promise<any> {
    // Check cache first
    if (this.assetCache.has(url)) {
      return this.processAssetData(this.assetCache.get(url)!, assetId);
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Cache the raw data
      if (this.config.enableCaching) {
        this.assetCache.set(url, arrayBuffer);
      }

      return this.processAssetData(arrayBuffer, assetId);
    } catch (error) {
      console.error(`Failed to load asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Process asset data based on type
   */
  private async processAssetData(arrayBuffer: ArrayBuffer, assetId: string): Promise<any> {
    const extension = this.getFileExtension(assetId);

    switch (extension) {
      case 'glb':
      case 'gltf':
        return this.loadGLTFModel(arrayBuffer);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return this.loadTexture(arrayBuffer);
      case 'json':
        return this.loadJSON(arrayBuffer);
      default:
        return arrayBuffer;
    }
  }

  /**
   * Load GLTF model from array buffer
   */
  private async loadGLTFModel(arrayBuffer: ArrayBuffer): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      
      loader.parse(arrayBuffer, '', (gltf) => {
        // Optimize the loaded model
        this.optimizeModel(gltf.scene);
        resolve(gltf.scene);
      }, reject);
    });
  }

  /**
   * Load texture from array buffer
   */
  private async loadTexture(arrayBuffer: ArrayBuffer): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);
      
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        // Optimize texture
        this.optimizeTexture(texture);
        URL.revokeObjectURL(url);
        resolve(texture);
      }, undefined, reject);
    });
  }

  /**
   * Load JSON from array buffer
   */
  private loadJSON(arrayBuffer: ArrayBuffer): any {
    const text = new TextDecoder().decode(arrayBuffer);
    return JSON.parse(text);
  }

  /**
   * Optimize loaded model
   */
  private optimizeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
          
          // Remove unused attributes
          this.removeUnusedAttributes(child.geometry);
        }

        // Optimize materials
        if (child.material) {
          this.optimizeMaterial(child.material);
        }

        // Enable frustum culling
        child.frustumCulled = true;
      }
    });
  }

  /**
   * Remove unused geometry attributes
   */
  private removeUnusedAttributes(geometry: THREE.BufferGeometry): void {
    const requiredAttributes = ['position', 'normal', 'uv'];
    const attributesToRemove: string[] = [];

    Object.keys(geometry.attributes).forEach(attributeName => {
      if (!requiredAttributes.includes(attributeName)) {
        // Check if attribute is actually used
        const attribute = geometry.attributes[attributeName];
        if (this.isAttributeUnused(attribute)) {
          attributesToRemove.push(attributeName);
        }
      }
    });

    attributesToRemove.forEach(attributeName => {
      geometry.deleteAttribute(attributeName);
    });
  }

  /**
   * Check if geometry attribute is unused
   */
  private isAttributeUnused(attribute: THREE.BufferAttribute): boolean {
    // Simple check - if all values are zero or default, consider unused
    const array = attribute.array;
    for (let i = 0; i < array.length; i++) {
      if (array[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Optimize material properties
   */
  private optimizeMaterial(material: THREE.Material | THREE.Material[]): void {
    const materials = Array.isArray(material) ? material : [material];

    materials.forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        // Enable texture compression if supported
        if (mat.map) {
          this.optimizeTexture(mat.map);
        }
        if (mat.normalMap) {
          this.optimizeTexture(mat.normalMap);
        }
        if (mat.roughnessMap) {
          this.optimizeTexture(mat.roughnessMap);
        }
        if (mat.metalnessMap) {
          this.optimizeTexture(mat.metalnessMap);
        }

        // Optimize material flags
        mat.transparent = mat.opacity < 1.0;
        mat.alphaTest = mat.transparent ? 0.1 : 0;
      }
    });
  }

  /**
   * Optimize texture properties
   */
  private optimizeTexture(texture: THREE.Texture): void {
    // Set appropriate filtering
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // Enable anisotropic filtering if supported
    texture.anisotropy = Math.min(4, THREE.WebGLRenderer.prototype.capabilities?.getMaxAnisotropy() || 1);
    
    // Generate mipmaps
    texture.generateMipmaps = true;
    
    // Set appropriate wrapping
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }

  /**
   * Lazy load asset when needed
   */
  async lazyLoadAsset(assetId: string, url: string): Promise<any> {
    if (!this.config.enableLazyLoading) {
      return this.loadAssetWithProgress(url, assetId);
    }

    // Check if already loaded
    if (this.loadedAssets.has(assetId)) {
      return this.loadedAssets.get(assetId);
    }

    // Load with lower priority
    return this.loadAssetWithProgress(url, assetId);
  }

  /**
   * Preload assets based on user interaction
   */
  async preloadBasedOnInteraction(interactionData: any): Promise<void> {
    // Predict which assets might be needed next
    const predictedAssets = this.predictNextAssets(interactionData);
    
    // Preload predicted assets with low priority
    const preloadPromises = predictedAssets.map(assetId => {
      const url = this.getAssetUrl(assetId);
      if (url) {
        return this.lazyLoadAsset(assetId, url);
      }
    }).filter(Boolean);

    // Don't wait for completion, just start loading
    Promise.all(preloadPromises).catch(error => {
      console.warn('Preloading failed:', error);
    });
  }

  /**
   * Predict next assets based on user interaction
   */
  private predictNextAssets(interactionData: any): string[] {
    // Simple prediction logic - in a real app this would be more sophisticated
    const predictedAssets: string[] = [];

    if (interactionData.hoveredGlasses) {
      predictedAssets.push(`glasses_${interactionData.hoveredGlasses}_model`);
      predictedAssets.push(`glasses_${interactionData.hoveredGlasses}_texture`);
    }

    if (interactionData.selectedCategory) {
      // Preload popular items in category
      predictedAssets.push(`category_${interactionData.selectedCategory}_popular`);
    }

    return predictedAssets;
  }

  /**
   * Get asset URL by ID
   */
  private getAssetUrl(assetId: string): string | null {
    // This would typically come from the manifest
    // For now, return a constructed URL
    return `/assets/${assetId}`;
  }

  /**
   * Update loading progress
   */
  private updateLoadingProgress(): void {
    this.loadingProgress.percentage = this.loadingProgress.total > 0 
      ? (this.loadingProgress.loaded / this.loadingProgress.total) * 100 
      : 0;

    // Estimate remaining time based on average load time
    const averageLoadTime = this.calculateAverageLoadTime();
    const remainingAssets = this.loadingProgress.total - this.loadingProgress.loaded;
    this.loadingProgress.estimatedTimeRemaining = remainingAssets * averageLoadTime;
  }

  /**
   * Calculate average load time
   */
  private calculateAverageLoadTime(): number {
    if (this.loadStartTimes.size === 0) return 1000; // Default 1 second

    const currentTime = performance.now();
    let totalTime = 0;
    let count = 0;

    this.loadStartTimes.forEach(startTime => {
      totalTime += currentTime - startTime;
      count++;
    });

    return count > 0 ? totalTime / count : 1000;
  }

  /**
   * Get file extension from asset ID or URL
   */
  private getFileExtension(assetId: string): string {
    const parts = assetId.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Compress assets for storage
   */
  async compressAsset(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.config.enableCompression) return data;

    try {
      // Use CompressionStream if available
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(data);
        writer.close();

        const chunks: Uint8Array[] = [];
        let result = await reader.read();
        
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        
        chunks.forEach(chunk => {
          compressed.set(chunk, offset);
          offset += chunk.length;
        });

        return compressed.buffer;
      }
    } catch (error) {
      console.warn('Compression failed, using original data:', error);
    }

    return data;
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(): LoadingProgress {
    return { ...this.loadingProgress };
  }

  /**
   * Get loaded asset
   */
  getAsset(assetId: string): any | null {
    return this.loadedAssets.get(assetId) || null;
  }

  /**
   * Check if asset is loaded
   */
  isAssetLoaded(assetId: string): boolean {
    return this.loadedAssets.has(assetId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedAssets: number;
    cacheSize: number;
    loadedAssets: number;
    activeLoads: number;
  } {
    let cacheSize = 0;
    this.assetCache.forEach(buffer => {
      cacheSize += buffer.byteLength;
    });

    return {
      cachedAssets: this.assetCache.size,
      cacheSize,
      loadedAssets: this.loadedAssets.size,
      activeLoads: this.activeLoads,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.assetCache.clear();
    this.loadedAssets.clear();
    this.loadingQueue.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AssetLoadingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Dispose loaded assets
    this.loadedAssets.forEach(asset => {
      if (asset && typeof asset.dispose === 'function') {
        asset.dispose();
      }
    });

    this.clearCache();
  }
}
