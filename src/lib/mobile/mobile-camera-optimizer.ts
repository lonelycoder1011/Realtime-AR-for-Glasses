// Mobile camera optimization system

export interface MobileCameraConfig {
  preferredResolution: { width: number; height: number };
  maxResolution: { width: number; height: number };
  minResolution: { width: number; height: number };
  frameRate: number;
  facingMode: 'user' | 'environment';
  enableAutoFocus: boolean;
  enableTorch: boolean;
  enableZoom: boolean;
  optimizeForPerformance: boolean;
}

export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
  browserVersion: string;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasTouchScreen: boolean;
}

export class MobileCameraOptimizer {
  private config: MobileCameraConfig;
  private deviceInfo: MobileDeviceInfo;
  private currentStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private constraints: MediaStreamConstraints | null = null;

  constructor(config: Partial<MobileCameraConfig> = {}) {
    this.deviceInfo = this.detectDeviceInfo();
    this.config = this.createOptimizedConfig(config);
  }

  /**
   * Detect mobile device information
   */
  private detectDeviceInfo(): MobileDeviceInfo {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);

    // Detect browser
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || '';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
    }

    return {
      isMobile,
      isTablet,
      isIOS,
      isAndroid,
      browserName,
      browserVersion,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      hasGyroscope: 'DeviceOrientationEvent' in window,
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  }

  /**
   * Create optimized camera configuration for mobile
   */
  private createOptimizedConfig(userConfig: Partial<MobileCameraConfig>): MobileCameraConfig {
    const defaultConfig: MobileCameraConfig = {
      preferredResolution: { width: 640, height: 480 },
      maxResolution: { width: 1280, height: 720 },
      minResolution: { width: 320, height: 240 },
      frameRate: 30,
      facingMode: 'user',
      enableAutoFocus: true,
      enableTorch: false,
      enableZoom: false,
      optimizeForPerformance: true,
    };

    // Adjust defaults based on device capabilities
    if (this.deviceInfo.isMobile) {
      // Lower resolution for mobile devices
      defaultConfig.preferredResolution = { width: 480, height: 360 };
      defaultConfig.maxResolution = { width: 720, height: 540 };
      defaultConfig.frameRate = 24; // Lower frame rate for better performance
    }

    if (this.deviceInfo.isIOS) {
      // iOS-specific optimizations
      defaultConfig.enableAutoFocus = true;
      defaultConfig.optimizeForPerformance = true;
    }

    if (this.deviceInfo.isAndroid) {
      // Android-specific optimizations
      defaultConfig.preferredResolution = { width: 640, height: 480 };
      defaultConfig.frameRate = 30;
    }

    // Low-end device detection
    if (this.isLowEndDevice()) {
      defaultConfig.preferredResolution = { width: 320, height: 240 };
      defaultConfig.maxResolution = { width: 480, height: 360 };
      defaultConfig.frameRate = 15;
    }

    return { ...defaultConfig, ...userConfig };
  }

  /**
   * Detect if device is low-end
   */
  private isLowEndDevice(): boolean {
    // Simple heuristics for low-end device detection
    const memoryGB = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const pixelRatio = this.deviceInfo.devicePixelRatio;

    return (
      memoryGB <= 2 ||
      cores <= 2 ||
      (this.deviceInfo.isMobile && pixelRatio <= 1.5)
    );
  }

  /**
   * Get optimized camera constraints
   */
  getOptimizedConstraints(): MediaStreamConstraints {
    const videoConstraints: MediaTrackConstraints = {
      facingMode: this.config.facingMode,
      width: {
        ideal: this.config.preferredResolution.width,
        max: this.config.maxResolution.width,
        min: this.config.minResolution.width,
      },
      height: {
        ideal: this.config.preferredResolution.height,
        max: this.config.maxResolution.height,
        min: this.config.minResolution.height,
      },
      frameRate: {
        ideal: this.config.frameRate,
        max: this.config.frameRate,
      },
    };

    // Add mobile-specific constraints
    if (this.deviceInfo.isMobile) {
      // Prefer hardware acceleration on mobile
      (videoConstraints as any).resizeMode = 'crop-and-scale';
      
      // Enable auto-focus if supported
      if (this.config.enableAutoFocus) {
        (videoConstraints as any).focusMode = 'continuous';
      }

      // iOS-specific constraints
      if (this.deviceInfo.isIOS) {
        (videoConstraints as any).aspectRatio = 4/3; // iOS cameras work better with 4:3
      }

      // Android-specific constraints
      if (this.deviceInfo.isAndroid) {
        (videoConstraints as any).aspectRatio = 16/9; // Android prefers 16:9
      }
    }

    this.constraints = {
      video: videoConstraints,
      audio: false, // Disable audio for AR applications
    };

    return this.constraints;
  }

  /**
   * Initialize camera with mobile optimizations
   */
  async initializeCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    this.videoElement = videoElement;

    try {
      // Request permissions first on mobile
      if (this.deviceInfo.isMobile) {
        await this.requestCameraPermissions();
      }

      const constraints = this.getOptimizedConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.currentStream = stream;
      
      // Apply mobile-specific video element optimizations
      this.optimizeVideoElement(videoElement, stream);
      
      return stream;
    } catch (error) {
      console.error('Failed to initialize mobile camera:', error);
      
      // Fallback to lower quality if initial request fails
      if (this.config.preferredResolution.width > 320) {
        console.log('Trying fallback resolution...');
        return this.initializeFallbackCamera(videoElement);
      }
      
      throw error;
    }
  }

  /**
   * Initialize fallback camera with lower quality
   */
  private async initializeFallbackCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    const fallbackConstraints: MediaStreamConstraints = {
      video: {
        facingMode: this.config.facingMode,
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    this.currentStream = stream;
    this.optimizeVideoElement(videoElement, stream);
    
    return stream;
  }

  /**
   * Request camera permissions with proper mobile handling
   */
  private async requestCameraPermissions(): Promise<void> {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permission.state === 'denied') {
          throw new Error('Camera permission denied');
        }
      }
    } catch (error) {
      console.warn('Could not check camera permissions:', error);
      // Continue anyway, getUserMedia will handle permissions
    }
  }

  /**
   * Optimize video element for mobile
   */
  private optimizeVideoElement(videoElement: HTMLVideoElement, stream: MediaStream): void {
    videoElement.srcObject = stream;
    
    // Mobile-specific video optimizations
    videoElement.setAttribute('playsinline', 'true'); // Prevent fullscreen on iOS
    videoElement.setAttribute('webkit-playsinline', 'true'); // iOS Safari
    videoElement.muted = true; // Prevent audio issues
    videoElement.autoplay = true;
    
    // Optimize for performance
    if (this.config.optimizeForPerformance) {
      videoElement.style.transform = 'translateZ(0)'; // Hardware acceleration
      videoElement.style.backfaceVisibility = 'hidden';
      videoElement.style.perspective = '1000px';
    }

    // Handle orientation changes
    this.setupOrientationHandling(videoElement);
  }

  /**
   * Setup orientation change handling
   */
  private setupOrientationHandling(videoElement: HTMLVideoElement): void {
    const handleOrientationChange = () => {
      setTimeout(() => {
        const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        if (newOrientation !== this.deviceInfo.orientation) {
          this.deviceInfo.orientation = newOrientation;
          this.adjustForOrientation(videoElement);
        }
      }, 100); // Small delay to ensure dimensions are updated
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
  }

  /**
   * Adjust camera for orientation changes
   */
  private adjustForOrientation(videoElement: HTMLVideoElement): void {
    if (!this.currentStream) return;

    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return;

    // Get current capabilities
    const capabilities = track.getCapabilities();
    
    // Adjust resolution based on orientation
    const settings = track.getSettings();
    let newWidth = settings.width || this.config.preferredResolution.width;
    let newHeight = settings.height || this.config.preferredResolution.height;

    if (this.deviceInfo.orientation === 'landscape') {
      // Landscape: prefer wider aspect ratio
      if (newHeight > newWidth) {
        [newWidth, newHeight] = [newHeight, newWidth];
      }
    } else {
      // Portrait: prefer taller aspect ratio
      if (newWidth > newHeight) {
        [newWidth, newHeight] = [newHeight, newWidth];
      }
    }

    // Apply new constraints if supported
    if (capabilities.width && capabilities.height) {
      track.applyConstraints({
        width: { ideal: newWidth },
        height: { ideal: newHeight },
      }).catch(error => {
        console.warn('Could not adjust camera for orientation:', error);
      });
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<MediaStream> {
    if (!this.videoElement) {
      throw new Error('Video element not initialized');
    }

    // Stop current stream
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }

    // Switch facing mode
    this.config.facingMode = this.config.facingMode === 'user' ? 'environment' : 'user';

    // Initialize with new facing mode
    return this.initializeCamera(this.videoElement);
  }

  /**
   * Adjust camera settings for performance
   */
  async adjustForPerformance(targetFPS: number): Promise<void> {
    if (!this.currentStream) return;

    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return;

    try {
      // Reduce resolution if FPS is too low
      if (targetFPS < 20) {
        await track.applyConstraints({
          width: { ideal: Math.max(320, this.config.preferredResolution.width * 0.75) },
          height: { ideal: Math.max(240, this.config.preferredResolution.height * 0.75) },
          frameRate: { ideal: Math.max(15, targetFPS) },
        });
      } else if (targetFPS > 25) {
        // Increase quality if performance allows
        await track.applyConstraints({
          width: { ideal: this.config.preferredResolution.width },
          height: { ideal: this.config.preferredResolution.height },
          frameRate: { ideal: this.config.frameRate },
        });
      }
    } catch (error) {
      console.warn('Could not adjust camera for performance:', error);
    }
  }

  /**
   * Enable/disable torch (flashlight)
   */
  async setTorch(enabled: boolean): Promise<void> {
    if (!this.currentStream || !this.config.enableTorch) return;

    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities();
    
    if ('torch' in capabilities) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: enabled } as any],
        });
      } catch (error) {
        console.warn('Could not control torch:', error);
      }
    }
  }

  /**
   * Set zoom level
   */
  async setZoom(zoomLevel: number): Promise<void> {
    if (!this.currentStream || !this.config.enableZoom) return;

    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities();
    
    if ('zoom' in capabilities) {
      const maxZoom = (capabilities as any).zoom?.max || 1;
      const minZoom = (capabilities as any).zoom?.min || 1;
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));

      try {
        await track.applyConstraints({
          advanced: [{ zoom: clampedZoom } as any],
        });
      } catch (error) {
        console.warn('Could not set zoom:', error);
      }
    }
  }

  /**
   * Get current camera capabilities
   */
  getCameraCapabilities(): MediaTrackCapabilities | null {
    if (!this.currentStream) return null;

    const track = this.currentStream.getVideoTracks()[0];
    return track ? track.getCapabilities() : null;
  }

  /**
   * Get current camera settings
   */
  getCameraSettings(): MediaTrackSettings | null {
    if (!this.currentStream) return null;

    const track = this.currentStream.getVideoTracks()[0];
    return track ? track.getSettings() : null;
  }

  /**
   * Get device information
   */
  getDeviceInfo(): MobileDeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get current configuration
   */
  getConfig(): MobileCameraConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MobileCameraConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.currentStream !== null && this.currentStream.active;
  }

  /**
   * Stop camera
   */
  stop(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('orientationchange', this.adjustForOrientation);
    window.removeEventListener('resize', this.adjustForOrientation);
  }
}
