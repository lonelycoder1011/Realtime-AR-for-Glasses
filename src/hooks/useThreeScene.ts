import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { SceneManager } from '@/lib/three/scene-manager';
import {
  SceneConfig,
  CameraConfig,
  LightingConfig,
  SceneState,
  RenderStats,
  ViewportDimensions,
} from '@/types/three-scene';

interface UseThreeSceneOptions {
  sceneConfig?: Partial<SceneConfig>;
  cameraConfig?: Partial<CameraConfig>;
  lightingConfig?: Partial<LightingConfig>;
  autoStart?: boolean;
}

export const useThreeScene = (options: UseThreeSceneOptions = {}) => {
  const [state, setState] = useState<SceneState>({
    isInitialized: false,
    isRendering: false,
    error: null,
    frameCount: 0,
    fps: 0,
    lastFrameTime: 0,
    renderTime: 0,
  });

  const [renderStats, setRenderStats] = useState<RenderStats>({
    fps: 0,
    frameCount: 0,
    renderTime: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
  });

  const sceneManagerRef = useRef<SceneManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastStatsUpdateRef = useRef<number>(0);
  const statsUpdateIntervalMs = 500; // Update stats every 500ms to prevent infinite loops

  const { sceneConfig, cameraConfig, lightingConfig, autoStart = false } = options;

  // Initialize scene manager
  const initializeScene = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Create scene manager if it doesn't exist
      if (!sceneManagerRef.current) {
        sceneManagerRef.current = new SceneManager(
          sceneConfig,
          cameraConfig,
          lightingConfig
        );

        // Set up stats callback with throttling to prevent infinite loops
        sceneManagerRef.current.setStatsCallback((stats) => {
          const now = Date.now();
          if (now - lastStatsUpdateRef.current > statsUpdateIntervalMs) {
            lastStatsUpdateRef.current = now;
            setRenderStats(stats);
          }
        });
      }

      // Initialize the scene
      await sceneManagerRef.current.initialize(canvas);
      canvasRef.current = canvas;

      // Update state
      const newState = sceneManagerRef.current.getState();
      setState(newState);

      // Auto-start rendering if enabled
      if (autoStart) {
        startRendering();
      }

    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
      setState(prev => ({
        ...prev,
        error: `Scene initialization failed: ${error}`,
        isInitialized: false,
      }));
    }
  }, [sceneConfig, cameraConfig, lightingConfig, autoStart]);

  // Start rendering
  const startRendering = useCallback(() => {
    if (!sceneManagerRef.current) return;

    // Start rendering without callback to prevent infinite loops
    sceneManagerRef.current.startRendering();
    
    // Update rendering state once
    setState(prev => ({ ...prev, isRendering: true }));
  }, []);

  // Stop rendering
  const stopRendering = useCallback(() => {
    if (!sceneManagerRef.current) return;

    sceneManagerRef.current.stopRendering();
    setState(prev => ({ ...prev, isRendering: false }));
  }, []);

  // Update viewport dimensions
  const updateViewport = useCallback((dimensions: ViewportDimensions) => {
    if (!sceneManagerRef.current) return;

    sceneManagerRef.current.updateViewport(dimensions);
  }, []);

  // Add object to scene
  const addObject = useCallback((object: THREE.Object3D) => {
    if (!sceneManagerRef.current) return;

    sceneManagerRef.current.addObject(object);
  }, []);

  // Remove object from scene
  const removeObject = useCallback((object: THREE.Object3D) => {
    if (!sceneManagerRef.current) return;

    sceneManagerRef.current.removeObject(object);
  }, []);

  // Update lighting
  const updateLighting = useCallback((config: Partial<LightingConfig>) => {
    if (!sceneManagerRef.current) return;

    sceneManagerRef.current.updateLighting(config);
  }, []);

  // Get scene context
  const getContext = useCallback(() => {
    if (!sceneManagerRef.current) return null;

    return sceneManagerRef.current.getContext();
  }, []);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    const dimensions: ViewportDimensions = {
      width: rect.width,
      height: rect.height,
      aspect: rect.width / rect.height,
      pixelRatio,
    };

    updateViewport(dimensions);
  }, [updateViewport]);

  // Set up resize observer
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvasRef.current);

    // Initial resize
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
    };
  }, []);

  return {
    state,
    renderStats,
    initializeScene,
    startRendering,
    stopRendering,
    updateViewport,
    addObject,
    removeObject,
    updateLighting,
    getContext,
    handleResize,
    isReady: state.isInitialized && !state.error,
  };
};
