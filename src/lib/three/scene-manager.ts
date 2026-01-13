// Three.js Scene Manager - Core 3D scene setup and management

import * as THREE from 'three';
import {
  SceneConfig,
  CameraConfig,
  LightingConfig,
  SceneState,
  ThreeJSContext,
  RenderStats,
  ViewportDimensions,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_LIGHTING_CONFIG,
} from '@/types/three-scene';

export class SceneManager {
  private context: ThreeJSContext = {
    scene: null,
    camera: null,
    renderer: null,
    canvas: null,
    animationId: null,
  };

  private state: SceneState = {
    isInitialized: false,
    isRendering: false,
    error: null,
    frameCount: 0,
    fps: 0,
    lastFrameTime: 0,
    renderTime: 0,
  };

  private config: {
    scene: SceneConfig;
    camera: CameraConfig;
    lighting: LightingConfig;
  };

  private lights: {
    ambient: THREE.AmbientLight | null;
    directional: THREE.DirectionalLight | null;
  } = {
    ambient: null,
    directional: null,
  };

  private renderCallback?: () => void;
  private statsCallback?: (stats: RenderStats) => void;

  constructor(
    sceneConfig: Partial<SceneConfig> = {},
    cameraConfig: Partial<CameraConfig> = {},
    lightingConfig: Partial<LightingConfig> = {}
  ) {
    this.config = {
      scene: { ...DEFAULT_SCENE_CONFIG, ...sceneConfig },
      camera: { ...DEFAULT_CAMERA_CONFIG, ...cameraConfig },
      lighting: { ...DEFAULT_LIGHTING_CONFIG, ...lightingConfig },
    };
  }

  /**
   * Initialize the Three.js scene, camera, and renderer
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.context.canvas = canvas;

      // Create scene
      this.context.scene = new THREE.Scene();
      this.context.scene.background = null; // Transparent background for AR overlay

      // Create camera
      const { fov, near, far, position } = this.config.camera;
      this.context.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
      this.context.camera.position.set(position.x, position.y, position.z);

      // Create renderer
      this.context.renderer = new THREE.WebGLRenderer({
        canvas,
        ...this.config.scene,
      });

      // Configure renderer
      this.context.renderer.setPixelRatio(window.devicePixelRatio);
      this.context.renderer.setClearColor(0x000000, 0); // Transparent clear color
      this.context.renderer.shadowMap.enabled = true;
      this.context.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.context.renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Setup lighting
      this.setupLighting();

      // Update state
      this.state.isInitialized = true;
      this.state.error = null;
      this.state.lastFrameTime = performance.now();

    } catch (error) {
      this.state.error = `Failed to initialize Three.js scene: ${error}`;
      this.state.isInitialized = false;
      throw error;
    }
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    if (!this.context.scene) return;

    const { ambient, directional } = this.config.lighting;

    // Ambient light
    this.lights.ambient = new THREE.AmbientLight(ambient.color, ambient.intensity);
    this.context.scene.add(this.lights.ambient);

    // Directional light
    this.lights.directional = new THREE.DirectionalLight(directional.color, directional.intensity);
    this.lights.directional.position.set(
      directional.position.x,
      directional.position.y,
      directional.position.z
    );
    this.lights.directional.castShadow = directional.castShadow;

    if (directional.castShadow) {
      this.lights.directional.shadow.mapSize.width = 2048;
      this.lights.directional.shadow.mapSize.height = 2048;
      this.lights.directional.shadow.camera.near = 0.5;
      this.lights.directional.shadow.camera.far = 500;
    }

    this.context.scene.add(this.lights.directional);
  }

  /**
   * Update viewport dimensions and camera aspect ratio
   */
  updateViewport(dimensions: ViewportDimensions): void {
    if (!this.context.renderer || !this.context.camera) return;

    this.context.renderer.setSize(dimensions.width, dimensions.height);
    this.context.camera.aspect = dimensions.aspect;
    this.context.camera.updateProjectionMatrix();
  }

  /**
   * Start the render loop
   */
  startRendering(callback?: () => void): void {
    if (!this.state.isInitialized || this.state.isRendering) return;

    this.renderCallback = callback;
    this.state.isRendering = true;
    this.animate();
  }

  /**
   * Stop the render loop
   */
  stopRendering(): void {
    if (this.context.animationId) {
      cancelAnimationFrame(this.context.animationId);
      this.context.animationId = null;
    }
    this.state.isRendering = false;
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.state.isRendering) return;

    this.context.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = currentTime - this.state.lastFrameTime;

    // Update frame count and FPS
    this.state.frameCount++;
    if (this.state.frameCount % 60 === 0) {
      this.state.fps = Math.round(60000 / deltaTime);
    }

    // Render the scene
    const renderStart = performance.now();
    this.render();
    this.state.renderTime = performance.now() - renderStart;

    // Skip render callback to prevent React infinite loops
    // The callback was causing setState on every frame

    // Update stats callback
    if (this.statsCallback && this.state.frameCount % 30 === 0) {
      this.statsCallback(this.getRenderStats());
    }

    this.state.lastFrameTime = currentTime;
  };

  /**
   * Render the scene
   */
  private render(): void {
    if (!this.context.renderer || !this.context.scene || !this.context.camera) return;

    this.context.renderer.render(this.context.scene, this.context.camera);
  }

  /**
   * Add an object to the scene
   */
  addObject(object: THREE.Object3D): void {
    if (!this.context.scene) return;
    this.context.scene.add(object);
  }

  /**
   * Remove an object from the scene
   */
  removeObject(object: THREE.Object3D): void {
    if (!this.context.scene) return;
    this.context.scene.remove(object);
  }

  /**
   * Get render statistics
   */
  getRenderStats(): RenderStats {
    const info = this.context.renderer?.info;
    return {
      fps: this.state.fps,
      frameCount: this.state.frameCount,
      renderTime: this.state.renderTime,
      triangles: info?.render.triangles || 0,
      geometries: info?.memory.geometries || 0,
      textures: info?.memory.textures || 0,
      programs: info?.programs?.length || 0,
    };
  }

  /**
   * Set stats callback for performance monitoring
   */
  setStatsCallback(callback: (stats: RenderStats) => void): void {
    this.statsCallback = callback;
  }

  /**
   * Update lighting configuration
   */
  updateLighting(config: Partial<LightingConfig>): void {
    this.config.lighting = { ...this.config.lighting, ...config };

    if (this.lights.ambient && config.ambient) {
      this.lights.ambient.color.setHex(parseInt(config.ambient.color.replace('#', '0x')));
      this.lights.ambient.intensity = config.ambient.intensity;
    }

    if (this.lights.directional && config.directional) {
      this.lights.directional.color.setHex(parseInt(config.directional.color.replace('#', '0x')));
      this.lights.directional.intensity = config.directional.intensity;
      
      if (config.directional.position) {
        this.lights.directional.position.set(
          config.directional.position.x,
          config.directional.position.y,
          config.directional.position.z
        );
      }
    }
  }

  /**
   * Get current state
   */
  getState(): SceneState {
    return { ...this.state };
  }

  /**
   * Get Three.js context objects
   */
  getContext(): Readonly<ThreeJSContext> {
    return this.context;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stopRendering();

    // Dispose of renderer
    if (this.context.renderer) {
      this.context.renderer.dispose();
    }

    // Clear scene
    if (this.context.scene) {
      this.context.scene.clear();
    }

    // Reset context
    this.context = {
      scene: null,
      camera: null,
      renderer: null,
      canvas: null,
      animationId: null,
    };

    // Reset state
    this.state.isInitialized = false;
    this.state.isRendering = false;
  }
}
