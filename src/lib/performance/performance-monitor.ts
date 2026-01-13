// Real-time performance monitoring system

import * as THREE from 'three';
import { PerformanceMetrics, DeviceCapabilities } from '@/types/performance-optimization';

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;
  private updateInterval: number = 1000; // Update every second
  private lastUpdateTime: number = 0;
  private renderer: THREE.WebGLRenderer | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;

  // Performance tracking
  private faceDetectionTimes: number[] = [];
  private coordinateMappingTimes: number[] = [];
  private positioningTimes: number[] = [];
  private renderingTimes: number[] = [];

  constructor(renderer?: THREE.WebGLRenderer) {
    this.renderer = renderer || null;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastUpdateTime = this.startTime;

    this.metrics = {
      fps: 0,
      averageFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      memoryUsage: {
        geometries: 0,
        textures: 0,
        programs: 0,
        total: 0,
      },
      gpuMemory: 0,
      gpuUtilization: 0,
      faceDetectionTime: 0,
      coordinateMappingTime: 0,
      positioningTime: 0,
      renderingTime: 0,
      lodLevel: 0,
      textureQuality: 1.0,
      shadowQuality: 1.0,
      devicePixelRatio: window.devicePixelRatio || 1,
      canvasSize: { width: 0, height: 0 },
      isLowEndDevice: false,
    };

    this.detectDeviceCapabilities();
  }

  /**
   * Update performance metrics (call once per frame)
   */
  update(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    this.frameHistory.push(deltaTime);
    
    // Keep only last 60 frames for FPS calculation
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }

    // Update frame time
    this.metrics.frameTime = deltaTime;

    // Calculate FPS
    if (deltaTime > 0) {
      const currentFps = 1000 / deltaTime;
      this.metrics.fps = currentFps;
      
      // Update min/max FPS
      this.metrics.minFps = Math.min(this.metrics.minFps, currentFps);
      this.metrics.maxFps = Math.max(this.metrics.maxFps, currentFps);
    }

    // Calculate average FPS
    if (this.frameHistory.length > 0) {
      const avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length;
      this.metrics.averageFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    // Update renderer metrics if available
    if (this.renderer) {
      this.updateRendererMetrics();
    }

    // Update canvas size
    if (this.renderer?.domElement) {
      this.metrics.canvasSize = {
        width: this.renderer.domElement.width,
        height: this.renderer.domElement.height,
      };
    }

    this.lastFrameTime = currentTime;

    // Periodic updates (less frequent)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.updateMemoryMetrics();
      this.lastUpdateTime = currentTime;
    }
  }

  /**
   * Update renderer-specific metrics
   */
  private updateRendererMetrics(): void {
    if (!this.renderer) return;

    const info = this.renderer.info;
    
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    this.metrics.vertices = info.render.points;
    this.metrics.geometries = info.memory.geometries;
    this.metrics.textures = info.memory.textures;
    this.metrics.programs = info.programs?.length || 0;
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryMetrics(): void {
    if (!this.renderer) return;

    const info = this.renderer.info;
    
    // Estimate memory usage (rough approximation)
    this.metrics.memoryUsage = {
      geometries: info.memory.geometries * 1024, // Rough estimate
      textures: info.memory.textures * 512 * 512 * 4, // Rough estimate for average texture
      programs: (info.programs?.length || 0) * 1024,
      total: 0,
    };

    this.metrics.memoryUsage.total = 
      this.metrics.memoryUsage.geometries + 
      this.metrics.memoryUsage.textures + 
      this.metrics.memoryUsage.programs;

    // GPU memory estimation
    this.estimateGPUMemory();
  }

  /**
   * Estimate GPU memory usage
   */
  private estimateGPUMemory(): void {
    // This is a rough estimation since WebGL doesn't provide direct GPU memory access
    const baseMemory = this.metrics.memoryUsage.total;
    const shadowMaps = 1024 * 1024 * 4; // Estimate for shadow maps
    const framebuffers = this.metrics.canvasSize.width * this.metrics.canvasSize.height * 4;
    
    this.metrics.gpuMemory = baseMemory + shadowMaps + framebuffers;
  }

  /**
   * Record face detection timing
   */
  recordFaceDetectionTime(time: number): void {
    this.faceDetectionTimes.push(time);
    if (this.faceDetectionTimes.length > 30) {
      this.faceDetectionTimes.shift();
    }
    
    this.metrics.faceDetectionTime = this.faceDetectionTimes.reduce((sum, t) => sum + t, 0) / this.faceDetectionTimes.length;
  }

  /**
   * Record coordinate mapping timing
   */
  recordCoordinateMappingTime(time: number): void {
    this.coordinateMappingTimes.push(time);
    if (this.coordinateMappingTimes.length > 30) {
      this.coordinateMappingTimes.shift();
    }
    
    this.metrics.coordinateMappingTime = this.coordinateMappingTimes.reduce((sum, t) => sum + t, 0) / this.coordinateMappingTimes.length;
  }

  /**
   * Record positioning timing
   */
  recordPositioningTime(time: number): void {
    this.positioningTimes.push(time);
    if (this.positioningTimes.length > 30) {
      this.positioningTimes.shift();
    }
    
    this.metrics.positioningTime = this.positioningTimes.reduce((sum, t) => sum + t, 0) / this.positioningTimes.length;
  }

  /**
   * Record rendering timing
   */
  recordRenderingTime(time: number): void {
    this.renderingTimes.push(time);
    if (this.renderingTimes.length > 30) {
      this.renderingTimes.shift();
    }
    
    this.metrics.renderingTime = this.renderingTimes.reduce((sum, t) => sum + t, 0) / this.renderingTimes.length;
  }

  /**
   * Update quality settings
   */
  updateQualityMetrics(lodLevel: number, textureQuality: number, shadowQuality: number): void {
    this.metrics.lodLevel = lodLevel;
    this.metrics.textureQuality = textureQuality;
    this.metrics.shadowQuality = shadowQuality;
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      this.metrics.isLowEndDevice = true;
      return;
    }

    // Get GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

    // Get WebGL capabilities
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    const maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);

    // Check extensions
    const extensions = gl.getSupportedExtensions() || [];
    const floatTextures = extensions.includes('OES_texture_float') || extensions.includes('EXT_color_buffer_float');
    const depthTextures = extensions.includes('WEBGL_depth_texture');

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone|tablet/.test(userAgent);
    const isTablet = /tablet|ipad/.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    // Get device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Calculate performance tier
    let tier: 'low' | 'medium' | 'high' = 'medium';
    let score = 0;

    // GPU scoring (simplified)
    if (gpu.toLowerCase().includes('intel')) {
      score += isMobile ? 20 : 40;
    } else if (gpu.toLowerCase().includes('amd')) {
      score += 60;
    } else if (gpu.toLowerCase().includes('nvidia')) {
      score += 80;
    } else {
      score += 30;
    }

    // Memory scoring
    score += Math.min(deviceMemory * 10, 40);

    // CPU scoring
    score += Math.min(hardwareConcurrency * 5, 20);

    // Mobile penalty
    if (isMobile) {
      score *= 0.7;
    }

    if (score < 40) {
      tier = 'low';
    } else if (score > 70) {
      tier = 'high';
    }

    this.deviceCapabilities = {
      gpu,
      maxTextureSize,
      maxVertexUniforms,
      maxFragmentUniforms,
      maxVaryingVectors,
      webglVersion: gl instanceof WebGL2RenderingContext ? 2 : 1,
      extensions,
      maxAnisotropy: 1, // Will be updated if extension is available
      floatTextures,
      depthTextures,
      tier,
      score,
      isMobile,
      isTablet,
      isDesktop,
      deviceMemory,
      hardwareConcurrency,
    };

    // Check anisotropic filtering
    const anisotropyExt = gl.getExtension('EXT_texture_filter_anisotropic');
    if (anisotropyExt) {
      this.deviceCapabilities.maxAnisotropy = gl.getParameter(anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }

    // Update low-end device flag
    this.metrics.isLowEndDevice = tier === 'low' || isMobile;

    // Cleanup
    canvas.remove();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities ? { ...this.deviceCapabilities } : null;
  }

  /**
   * Check if performance is below target
   */
  isPerformanceBelowTarget(targetFps: number, threshold: number = 5): boolean {
    return this.metrics.averageFps < (targetFps - threshold);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): string {
    const metrics = this.metrics;
    return `FPS: ${metrics.fps.toFixed(1)} (avg: ${metrics.averageFps.toFixed(1)}) | ` +
           `Draw calls: ${metrics.drawCalls} | ` +
           `Triangles: ${metrics.triangles.toLocaleString()} | ` +
           `Memory: ${(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)}MB`;
  }

  /**
   * Reset performance statistics
   */
  reset(): void {
    this.frameHistory = [];
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastUpdateTime = this.startTime;
    
    this.metrics.minFps = Infinity;
    this.metrics.maxFps = 0;
    this.metrics.averageFps = 0;
    
    this.faceDetectionTimes = [];
    this.coordinateMappingTimes = [];
    this.positioningTimes = [];
    this.renderingTimes = [];
  }

  /**
   * Set renderer for metrics collection
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Get frame time percentiles
   */
  getFrameTimePercentiles(): { p50: number; p90: number; p95: number; p99: number } {
    if (this.frameHistory.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.frameHistory].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  /**
   * Export performance data for analysis
   */
  exportData(): any {
    return {
      metrics: this.getMetrics(),
      deviceCapabilities: this.getDeviceCapabilities(),
      frameTimePercentiles: this.getFrameTimePercentiles(),
      timestamp: Date.now(),
      sessionDuration: performance.now() - this.startTime,
    };
  }
}
