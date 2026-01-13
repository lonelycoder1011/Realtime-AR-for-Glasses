import { useState, useRef, useCallback, useEffect } from 'react';
import { AdaptiveQualitySystem } from '@/lib/performance/adaptive-quality-system';
import { MemoryManager } from '@/lib/performance/memory-manager';
import { BundleOptimizer, AssetLoadingConfig } from '@/lib/performance/bundle-optimizer';
import { GeometryOptimizer } from '@/lib/performance/geometry-optimizer';
import { ShaderOptimizer } from '@/lib/performance/shader-optimizer';
import * as THREE from 'three';

interface UseAdvancedPerformanceOptimizationOptions {
  targetFPS?: number;
  enableAdaptiveQuality?: boolean;
  enableMemoryManagement?: boolean;
  enableAssetOptimization?: boolean;
  assetLoadingConfig?: Partial<AssetLoadingConfig>;
}

export const useAdvancedPerformanceOptimization = (
  renderer: THREE.WebGLRenderer | null,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  options: UseAdvancedPerformanceOptimizationOptions = {}
) => {
  const {
    targetFPS = 30,
    enableAdaptiveQuality = true,
    enableMemoryManagement = true,
    enableAssetOptimization = true,
    assetLoadingConfig = {},
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentQualityLevel, setCurrentQualityLevel] = useState(2);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const adaptiveQualityRef = useRef<AdaptiveQualitySystem | null>(null);
  const memoryManagerRef = useRef<MemoryManager | null>(null);
  const bundleOptimizerRef = useRef<BundleOptimizer | null>(null);
  const geometryOptimizerRef = useRef<GeometryOptimizer | null>(null);
  const shaderOptimizerRef = useRef<ShaderOptimizer | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  // Initialize performance systems
  useEffect(() => {
    if (!renderer || !scene || !camera) return;

    try {
      // Initialize adaptive quality system
      if (enableAdaptiveQuality) {
        adaptiveQualityRef.current = new AdaptiveQualitySystem(renderer, scene, camera);
      }

      // Initialize memory manager
      if (enableMemoryManagement) {
        memoryManagerRef.current = new MemoryManager();
      }

      // Initialize bundle optimizer
      if (enableAssetOptimization) {
        const defaultConfig: AssetLoadingConfig = {
          enableLazyLoading: true,
          enablePreloading: true,
          enableCompression: true,
          enableCaching: true,
          maxConcurrentLoads: 3,
          loadingPriority: 'medium',
          chunkSize: 1024 * 1024, // 1MB
        };
        
        bundleOptimizerRef.current = new BundleOptimizer({
          ...defaultConfig,
          ...assetLoadingConfig,
        });
      }

      // Initialize geometry optimizer
      geometryOptimizerRef.current = new GeometryOptimizer({
        enableLOD: true,
        enableInstancing: true,
        enableFrustumCulling: true,
        enableOcclusionCulling: false,
        maxInstanceCount: 100,
        lodDistances: [1.0, 2.0, 5.0],
        simplificationRatio: [0.8, 0.6, 0.4],
      });

      // Initialize shader optimizer
      shaderOptimizerRef.current = new ShaderOptimizer(renderer, {
        enableInstancing: true,
        enableVertexCompression: false,
        enablePrecisionOptimization: true,
        enableDeadCodeElimination: true,
        enableUniformBuffers: true,
        maxLights: 4,
        shadowMapSize: 1024,
      });

      setIsInitialized(true);
      startOptimizationLoop();

    } catch (error) {
      console.error('Failed to initialize performance optimization:', error);
    }

    return () => {
      stopOptimizationLoop();
      dispose();
    };
  }, [renderer, scene, camera, enableAdaptiveQuality, enableMemoryManagement, enableAssetOptimization]);

  // Start optimization loop
  const startOptimizationLoop = useCallback(() => {
    const updateLoop = (currentTime: number) => {
      // Throttle updates to avoid excessive processing
      if (currentTime - lastUpdateTime.current >= 16) { // ~60fps update rate
        updatePerformanceSystems();
        lastUpdateTime.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop(performance.now());
  }, []);

  // Stop optimization loop
  const stopOptimizationLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Update all performance systems
  const updatePerformanceSystems = useCallback(() => {
    try {
      // Update adaptive quality system
      if (adaptiveQualityRef.current) {
        adaptiveQualityRef.current.update();
        const stats = adaptiveQualityRef.current.getPerformanceStats();
        setPerformanceStats(stats);
        setCurrentQualityLevel(stats.currentQualityLevel);
      }

      // Update memory manager
      if (memoryManagerRef.current) {
        const memStats = memoryManagerRef.current.getMemoryStats();
        setMemoryStats(memStats);
      }

      // Update bundle optimizer progress
      if (bundleOptimizerRef.current) {
        const progress = bundleOptimizerRef.current.getLoadingProgress();
        setLoadingProgress(progress);
      }

    } catch (error) {
      console.error('Error updating performance systems:', error);
    }
  }, []);

  // Optimize scene geometry
  const optimizeSceneGeometry = useCallback(() => {
    if (!geometryOptimizerRef.current || !scene || !camera) return;

    setIsOptimizing(true);
    
    try {
      const result = geometryOptimizerRef.current.optimizeScene(scene, camera);
      console.log('Scene optimization result:', result);
      return result;
    } catch (error) {
      console.error('Scene optimization failed:', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [scene, camera]);

  // Create optimized material
  const createOptimizedMaterial = useCallback((properties: any) => {
    if (!shaderOptimizerRef.current) return null;

    try {
      return shaderOptimizerRef.current.createOptimizedGlassesMaterial(properties);
    } catch (error) {
      console.error('Failed to create optimized material:', error);
      return null;
    }
  }, []);

  // Create LOD object
  const createLODObject = useCallback((
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    geometryId: string
  ) => {
    if (!geometryOptimizerRef.current) return null;

    try {
      const lodLevels = geometryOptimizerRef.current.createLODLevels(geometry, geometryId);
      
      const lod = new THREE.LOD();
      lodLevels.forEach(level => {
        const mesh = new THREE.Mesh(level.geometry, material);
        lod.addLevel(mesh, level.distance);
      });

      return lod;
    } catch (error) {
      console.error('Failed to create LOD object:', error);
      return null;
    }
  }, []);

  // Get geometry from memory pool
  const getPooledGeometry = useCallback(() => {
    if (!memoryManagerRef.current) return new THREE.BufferGeometry();
    return memoryManagerRef.current.getGeometry();
  }, []);

  // Return geometry to memory pool
  const returnPooledGeometry = useCallback((geometry: THREE.BufferGeometry) => {
    if (memoryManagerRef.current) {
      memoryManagerRef.current.returnGeometry(geometry);
    }
  }, []);

  // Get material from memory pool
  const getPooledMaterial = useCallback(() => {
    if (!memoryManagerRef.current) return new THREE.MeshStandardMaterial();
    return memoryManagerRef.current.getMaterial();
  }, []);

  // Return material to memory pool
  const returnPooledMaterial = useCallback((material: THREE.Material) => {
    if (memoryManagerRef.current) {
      memoryManagerRef.current.returnMaterial(material);
    }
  }, []);

  // Load asset with optimization
  const loadOptimizedAsset = useCallback(async (assetId: string, url: string) => {
    if (!bundleOptimizerRef.current) {
      throw new Error('Bundle optimizer not initialized');
    }

    try {
      return await bundleOptimizerRef.current.lazyLoadAsset(assetId, url);
    } catch (error) {
      console.error(`Failed to load asset ${assetId}:`, error);
      throw error;
    }
  }, []);

  // Preload assets based on interaction
  const preloadAssets = useCallback(async (interactionData: any) => {
    if (bundleOptimizerRef.current) {
      await bundleOptimizerRef.current.preloadBasedOnInteraction(interactionData);
    }
  }, []);

  // Set quality level manually
  const setQualityLevel = useCallback((level: number) => {
    if (adaptiveQualityRef.current) {
      adaptiveQualityRef.current.setQualityLevel(level);
    }
  }, []);

  // Enable/disable adaptive quality
  const setAdaptiveQuality = useCallback((enabled: boolean) => {
    if (adaptiveQualityRef.current) {
      adaptiveQualityRef.current.setAdaptiveEnabled(enabled);
    }
  }, []);

  // Force memory cleanup
  const forceMemoryCleanup = useCallback(() => {
    if (memoryManagerRef.current) {
      memoryManagerRef.current.forceCleanup();
    }
  }, []);

  // Schedule object for disposal
  const scheduleDisposal = useCallback((object: THREE.Object3D) => {
    if (memoryManagerRef.current) {
      memoryManagerRef.current.scheduleDisposal(object);
    }
  }, []);

  // Get comprehensive performance stats
  const getComprehensiveStats = useCallback(() => {
    const stats: any = {
      adaptive: performanceStats,
      memory: memoryStats,
      loading: loadingProgress,
    };

    if (geometryOptimizerRef.current) {
      stats.geometry = geometryOptimizerRef.current.getOptimizationStats();
    }

    if (shaderOptimizerRef.current) {
      stats.shader = shaderOptimizerRef.current.getCompilationStats();
    }

    if (bundleOptimizerRef.current) {
      stats.cache = bundleOptimizerRef.current.getCacheStats();
    }

    return stats;
  }, [performanceStats, memoryStats, loadingProgress]);

  // Optimize for mobile devices
  const optimizeForMobile = useCallback(() => {
    if (adaptiveQualityRef.current) {
      // Force lower quality for mobile
      adaptiveQualityRef.current.forceQualityLevel(1);
    }

    if (memoryManagerRef.current) {
      // Reduce memory thresholds for mobile
      memoryManagerRef.current.setMemoryThreshold(50 * 1024 * 1024); // 50MB
      memoryManagerRef.current.setCleanupInterval(3000); // More frequent cleanup
    }
  }, []);

  // Optimize for desktop
  const optimizeForDesktop = useCallback(() => {
    if (adaptiveQualityRef.current) {
      // Allow higher quality for desktop
      adaptiveQualityRef.current.resetToAdaptive();
    }

    if (memoryManagerRef.current) {
      // Higher memory thresholds for desktop
      memoryManagerRef.current.setMemoryThreshold(200 * 1024 * 1024); // 200MB
      memoryManagerRef.current.setCleanupInterval(10000); // Less frequent cleanup
    }
  }, []);

  // Dispose all resources
  const dispose = useCallback(() => {
    if (adaptiveQualityRef.current) {
      adaptiveQualityRef.current.dispose();
      adaptiveQualityRef.current = null;
    }

    if (memoryManagerRef.current) {
      memoryManagerRef.current.dispose();
      memoryManagerRef.current = null;
    }

    if (bundleOptimizerRef.current) {
      bundleOptimizerRef.current.dispose();
      bundleOptimizerRef.current = null;
    }

    if (geometryOptimizerRef.current) {
      geometryOptimizerRef.current.clearCache();
      geometryOptimizerRef.current = null;
    }

    if (shaderOptimizerRef.current) {
      shaderOptimizerRef.current.clearCache();
      shaderOptimizerRef.current = null;
    }
  }, []);

  return {
    // State
    isInitialized,
    currentQualityLevel,
    performanceStats,
    memoryStats,
    loadingProgress,
    isOptimizing,

    // Scene optimization
    optimizeSceneGeometry,
    createLODObject,

    // Material optimization
    createOptimizedMaterial,

    // Memory management
    getPooledGeometry,
    returnPooledGeometry,
    getPooledMaterial,
    returnPooledMaterial,
    forceMemoryCleanup,
    scheduleDisposal,

    // Asset loading
    loadOptimizedAsset,
    preloadAssets,

    // Quality control
    setQualityLevel,
    setAdaptiveQuality,

    // Device optimization
    optimizeForMobile,
    optimizeForDesktop,

    // Statistics
    getComprehensiveStats,

    // Cleanup
    dispose,

    // Status
    isReady: isInitialized && !isOptimizing,
  };
};
