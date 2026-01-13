import { useState, useRef, useCallback, useEffect } from 'react';
import { PerformanceMonitor } from '@/lib/performance/performance-monitor';
import { AdaptiveQualityManager } from '@/lib/performance/adaptive-quality-manager';
import { LODManager } from '@/lib/performance/lod-manager';
import {
  PerformanceMetrics,
  PerformanceConfig,
  DeviceCapabilities,
  DEFAULT_PERFORMANCE_CONFIG,
  LOD_LEVELS,
} from '@/types/performance-optimization';
import * as THREE from 'three';

interface UsePerformanceOptimizationOptions {
  config?: Partial<PerformanceConfig>;
  enableAdaptiveQuality?: boolean;
  enableLOD?: boolean;
}

export const usePerformanceOptimization = (
  renderer: THREE.WebGLRenderer | null,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  options: UsePerformanceOptimizationOptions = {}
) => {
  const { 
    config = {}, 
    enableAdaptiveQuality = true, 
    enableLOD = true 
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentQualityLevel, setCurrentQualityLevel] = useState(3);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const qualityManagerRef = useRef<AdaptiveQualityManager | null>(null);
  const lodManagerRef = useRef<LODManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const finalConfig: PerformanceConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };

  // Initialize performance systems
  useEffect(() => {
    if (!renderer) return;

    try {
      // Initialize performance monitor
      performanceMonitorRef.current = new PerformanceMonitor(renderer);
      const capabilities = performanceMonitorRef.current.getDeviceCapabilities();
      setDeviceCapabilities(capabilities);

      // Initialize adaptive quality manager
      if (enableAdaptiveQuality) {
        qualityManagerRef.current = new AdaptiveQualityManager(
          performanceMonitorRef.current,
          finalConfig,
          renderer,
          scene || undefined
        );

        // Set quality change callback
        qualityManagerRef.current.onQualityLevelChange((level, settings) => {
          setCurrentQualityLevel(level);
          console.log(`Quality level changed to ${level}:`, settings);
        });
      }

      // Initialize LOD manager
      if (enableLOD && scene && camera) {
        lodManagerRef.current = new LODManager(scene, camera, LOD_LEVELS);
      }

      setIsInitialized(true);
      startPerformanceLoop();

    } catch (error) {
      console.error('Failed to initialize performance optimization:', error);
    }

    return () => {
      stopPerformanceLoop();
    };
  }, [renderer, scene, camera, enableAdaptiveQuality, enableLOD]);

  // Start performance monitoring loop
  const startPerformanceLoop = useCallback(() => {
    let frameCount = 0;
    
    const updateLoop = () => {
      frameCount++;
      
      if (performanceMonitorRef.current) {
        // Update performance monitor
        performanceMonitorRef.current.update();
        
        // Only update React state every 60 frames to prevent infinite loops
        if (frameCount % 60 === 0) {
          const currentMetrics = performanceMonitorRef.current.getMetrics();
          setMetrics(currentMetrics);
        }

        // Update adaptive quality manager
        if (qualityManagerRef.current) {
          qualityManagerRef.current.update();
        }

        // Update LOD manager
        if (lodManagerRef.current) {
          lodManagerRef.current.update();
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop();
  }, []);

  // Stop performance monitoring loop
  const stopPerformanceLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Record timing for face detection
  const recordFaceDetectionTime = useCallback((time: number) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.recordFaceDetectionTime(time);
    }
  }, []);

  // Record timing for coordinate mapping
  const recordCoordinateMappingTime = useCallback((time: number) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.recordCoordinateMappingTime(time);
    }
  }, []);

  // Record timing for positioning
  const recordPositioningTime = useCallback((time: number) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.recordPositioningTime(time);
    }
  }, []);

  // Record timing for rendering
  const recordRenderingTime = useCallback((time: number) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.recordRenderingTime(time);
    }
  }, []);

  // Create LOD object
  const createLODObject = useCallback((
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    position?: THREE.Vector3
  ): THREE.LOD | null => {
    if (!lodManagerRef.current) return null;
    return lodManagerRef.current.createLODObject(id, geometry, material, position);
  }, []);

  // Remove LOD object
  const removeLODObject = useCallback((id: string) => {
    if (lodManagerRef.current) {
      lodManagerRef.current.removeLODObject(id);
    }
  }, []);

  // Set quality level manually
  const setQualityLevel = useCallback((level: number) => {
    if (qualityManagerRef.current) {
      qualityManagerRef.current.forceQualityLevel(level);
      setCurrentQualityLevel(level);
    }
  }, []);

  // Enable/disable adaptive quality
  const setAdaptiveQuality = useCallback((enabled: boolean) => {
    if (qualityManagerRef.current) {
      if (enabled) {
        qualityManagerRef.current.enableAdaptiveQuality();
      } else {
        qualityManagerRef.current.disableAdaptiveQuality();
      }
    }
  }, []);

  // Set LOD bias
  const setLODBias = useCallback((bias: number) => {
    if (lodManagerRef.current) {
      lodManagerRef.current.setBias(bias);
    }
  }, []);

  // Enable/disable LOD
  const setLODEnabled = useCallback((enabled: boolean) => {
    if (lodManagerRef.current) {
      lodManagerRef.current.setEnabled(enabled);
    }
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback((): string => {
    if (!performanceMonitorRef.current) return 'Performance monitor not initialized';
    return performanceMonitorRef.current.getPerformanceSummary();
  }, []);

  // Get LOD statistics
  const getLODStats = useCallback(() => {
    if (!lodManagerRef.current) return null;
    return lodManagerRef.current.getLODStats();
  }, []);

  // Get quality manager statistics
  const getQualityStats = useCallback(() => {
    if (!qualityManagerRef.current) return null;
    return qualityManagerRef.current.getPerformanceStats();
  }, []);

  // Optimize for mobile devices
  const optimizeForMobile = useCallback(() => {
    if (!qualityManagerRef.current || !deviceCapabilities) return;

    setIsOptimizing(true);

    // Force lower quality settings for mobile
    if (deviceCapabilities.isMobile) {
      setQualityLevel(1); // Low-medium quality
      
      // Reduce texture sizes
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      }

      // Reduce shadow quality
      scene?.traverse((object) => {
        if (object instanceof THREE.Light) {
          object.castShadow = false;
        }
      });
    }

    setTimeout(() => setIsOptimizing(false), 1000);
  }, [deviceCapabilities, renderer, scene, setQualityLevel]);

  // Optimize for low-end devices
  const optimizeForLowEnd = useCallback(() => {
    if (!qualityManagerRef.current || !deviceCapabilities) return;

    setIsOptimizing(true);

    if (deviceCapabilities.tier === 'low') {
      setQualityLevel(0); // Lowest quality
      
      // Disable expensive features
      if (renderer) {
        renderer.shadowMap.enabled = false;
        renderer.setPixelRatio(1);
      }

      // Simplify materials
      scene?.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.normalMap = null;
              material.roughnessMap = null;
              material.metalnessMap = null;
              material.envMapIntensity = 0;
            }
          });
        }
      });
    }

    setTimeout(() => setIsOptimizing(false), 1000);
  }, [deviceCapabilities, renderer, scene, setQualityLevel]);

  // Reset performance statistics
  const resetStats = useCallback(() => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.reset();
    }
    if (qualityManagerRef.current) {
      qualityManagerRef.current.reset();
    }
  }, []);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    if (!performanceMonitorRef.current) return null;
    
    return {
      ...performanceMonitorRef.current.exportData(),
      qualityStats: getQualityStats(),
      lodStats: getLODStats(),
    };
  }, [getQualityStats, getLODStats]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    if (qualityManagerRef.current) {
      qualityManagerRef.current.updateConfig(newConfig);
    }
  }, []);

  return {
    // State
    metrics,
    deviceCapabilities,
    isInitialized,
    currentQualityLevel,
    isOptimizing,

    // Performance recording
    recordFaceDetectionTime,
    recordCoordinateMappingTime,
    recordPositioningTime,
    recordRenderingTime,

    // LOD management
    createLODObject,
    removeLODObject,
    setLODBias,
    setLODEnabled,
    getLODStats,

    // Quality management
    setQualityLevel,
    setAdaptiveQuality,
    getQualityStats,

    // Optimization
    optimizeForMobile,
    optimizeForLowEnd,
    updateConfig,

    // Statistics
    getPerformanceSummary,
    resetStats,
    exportPerformanceData,

    // Status
    isReady: isInitialized && metrics !== null,
  };
};
