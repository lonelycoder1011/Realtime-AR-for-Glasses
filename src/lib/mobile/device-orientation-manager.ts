// Device orientation and motion handling for mobile AR

export interface OrientationData {
  alpha: number; // Z-axis rotation (0-360°)
  beta: number;  // X-axis rotation (-180° to 180°)
  gamma: number; // Y-axis rotation (-90° to 90°)
  absolute: boolean;
}

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  interval: number;
}

export interface DeviceOrientationConfig {
  enableOrientationTracking: boolean;
  enableMotionTracking: boolean;
  smoothingFactor: number;
  calibrationSamples: number;
  autoCalibrate: boolean;
  orientationThreshold: number;
  motionThreshold: number;
}

export class DeviceOrientationManager {
  private config: DeviceOrientationConfig;
  private isSupported: boolean = false;
  private isPermissionGranted: boolean = false;
  private isCalibrated: boolean = false;
  
  private currentOrientation: OrientationData | null = null;
  private currentMotion: MotionData | null = null;
  private calibrationOffset: OrientationData = { alpha: 0, beta: 0, gamma: 0, absolute: false };
  
  private orientationCallbacks: Set<(data: OrientationData) => void> = new Set();
  private motionCallbacks: Set<(data: MotionData) => void> = new Set();
  
  private smoothedOrientation: OrientationData | null = null;
  private calibrationSamples: OrientationData[] = [];
  
  private boundOrientationHandler: (event: DeviceOrientationEvent) => void;
  private boundMotionHandler: (event: DeviceMotionEvent) => void;

  constructor(config: Partial<DeviceOrientationConfig> = {}) {
    this.config = {
      enableOrientationTracking: true,
      enableMotionTracking: true,
      smoothingFactor: 0.8,
      calibrationSamples: 30,
      autoCalibrate: true,
      orientationThreshold: 1.0,
      motionThreshold: 0.1,
      ...config,
    };

    this.boundOrientationHandler = this.handleOrientationChange.bind(this);
    this.boundMotionHandler = this.handleMotionChange.bind(this);

    this.checkSupport();
  }

  /**
   * Check device support for orientation and motion
   */
  private checkSupport(): void {
    this.isSupported = (
      'DeviceOrientationEvent' in window ||
      'DeviceMotionEvent' in window
    );

    if (!this.isSupported) {
      console.warn('Device orientation/motion not supported');
    }
  }

  /**
   * Request permissions for iOS 13+
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      // iOS 13+ requires permission for device orientation
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const orientationPermission = await (DeviceOrientationEvent as any).requestPermission();
        
        if (orientationPermission !== 'granted') {
          console.warn('Device orientation permission denied');
          return false;
        }
      }

      // iOS 13+ requires permission for device motion
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const motionPermission = await (DeviceMotionEvent as any).requestPermission();
        
        if (motionPermission !== 'granted') {
          console.warn('Device motion permission denied');
          return false;
        }
      }

      this.isPermissionGranted = true;
      return true;
    } catch (error) {
      console.error('Failed to request device orientation permissions:', error);
      return false;
    }
  }

  /**
   * Initialize orientation tracking
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    // Request permissions first
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    // Start tracking
    this.startTracking();

    // Auto-calibrate if enabled
    if (this.config.autoCalibrate) {
      await this.calibrate();
    }

    return true;
  }

  /**
   * Start orientation and motion tracking
   */
  private startTracking(): void {
    if (this.config.enableOrientationTracking) {
      window.addEventListener('deviceorientation', this.boundOrientationHandler, true);
    }

    if (this.config.enableMotionTracking) {
      window.addEventListener('devicemotion', this.boundMotionHandler, true);
    }
  }

  /**
   * Stop orientation and motion tracking
   */
  private stopTracking(): void {
    window.removeEventListener('deviceorientation', this.boundOrientationHandler, true);
    window.removeEventListener('devicemotion', this.boundMotionHandler, true);
  }

  /**
   * Handle device orientation change
   */
  private handleOrientationChange(event: DeviceOrientationEvent): void {
    if (event.alpha === null || event.beta === null || event.gamma === null) {
      return;
    }

    const rawOrientation: OrientationData = {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute || false,
    };

    // Apply calibration offset
    const calibratedOrientation = this.applyCalibratedOffset(rawOrientation);

    // Apply smoothing
    this.currentOrientation = this.applySmoothing(calibratedOrientation);

    // Notify callbacks
    this.orientationCallbacks.forEach(callback => {
      callback(this.currentOrientation!);
    });
  }

  /**
   * Handle device motion change
   */
  private handleMotionChange(event: DeviceMotionEvent): void {
    if (!event.acceleration || !event.accelerationIncludingGravity || !event.rotationRate) {
      return;
    }

    this.currentMotion = {
      acceleration: {
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0,
      },
      accelerationIncludingGravity: {
        x: event.accelerationIncludingGravity.x || 0,
        y: event.accelerationIncludingGravity.y || 0,
        z: event.accelerationIncludingGravity.z || 0,
      },
      rotationRate: {
        alpha: event.rotationRate.alpha || 0,
        beta: event.rotationRate.beta || 0,
        gamma: event.rotationRate.gamma || 0,
      },
      interval: event.interval || 16,
    };

    // Notify callbacks
    this.motionCallbacks.forEach(callback => {
      callback(this.currentMotion!);
    });
  }

  /**
   * Apply calibration offset to orientation data
   */
  private applyCalibratedOffset(orientation: OrientationData): OrientationData {
    if (!this.isCalibrated) {
      return orientation;
    }

    return {
      alpha: this.normalizeAngle(orientation.alpha - this.calibrationOffset.alpha),
      beta: this.normalizeAngle(orientation.beta - this.calibrationOffset.beta),
      gamma: this.normalizeAngle(orientation.gamma - this.calibrationOffset.gamma),
      absolute: orientation.absolute,
    };
  }

  /**
   * Apply smoothing to orientation data
   */
  private applySmoothing(orientation: OrientationData): OrientationData {
    if (!this.smoothedOrientation) {
      this.smoothedOrientation = { ...orientation };
      return this.smoothedOrientation;
    }

    const factor = this.config.smoothingFactor;

    this.smoothedOrientation = {
      alpha: this.smoothAngle(this.smoothedOrientation.alpha, orientation.alpha, factor),
      beta: this.smoothAngle(this.smoothedOrientation.beta, orientation.beta, factor),
      gamma: this.smoothAngle(this.smoothedOrientation.gamma, orientation.gamma, factor),
      absolute: orientation.absolute,
    };

    return this.smoothedOrientation;
  }

  /**
   * Smooth angle values considering circular nature
   */
  private smoothAngle(current: number, target: number, factor: number): number {
    let delta = target - current;
    
    // Handle circular nature of angles
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    return this.normalizeAngle(current + delta * (1 - factor));
  }

  /**
   * Normalize angle to 0-360 range
   */
  private normalizeAngle(angle: number): number {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  /**
   * Calibrate device orientation
   */
  async calibrate(): Promise<void> {
    if (!this.isSupported || !this.isPermissionGranted) {
      throw new Error('Device orientation not supported or permission not granted');
    }

    return new Promise((resolve) => {
      this.calibrationSamples = [];
      this.isCalibrated = false;

      const collectSample = (orientation: OrientationData) => {
        this.calibrationSamples.push({ ...orientation });

        if (this.calibrationSamples.length >= this.config.calibrationSamples) {
          this.calculateCalibrationOffset();
          this.isCalibrated = true;
          this.orientationCallbacks.delete(collectSample);
          resolve();
        }
      };

      this.orientationCallbacks.add(collectSample);
    });
  }

  /**
   * Calculate calibration offset from samples
   */
  private calculateCalibrationOffset(): void {
    if (this.calibrationSamples.length === 0) {
      return;
    }

    // Calculate average of calibration samples
    let alphaSum = 0;
    let betaSum = 0;
    let gammaSum = 0;

    this.calibrationSamples.forEach(sample => {
      alphaSum += sample.alpha;
      betaSum += sample.beta;
      gammaSum += sample.gamma;
    });

    this.calibrationOffset = {
      alpha: alphaSum / this.calibrationSamples.length,
      beta: betaSum / this.calibrationSamples.length,
      gamma: gammaSum / this.calibrationSamples.length,
      absolute: false,
    };

    console.log('Device orientation calibrated:', this.calibrationOffset);
  }

  /**
   * Reset calibration
   */
  resetCalibration(): void {
    this.isCalibrated = false;
    this.calibrationOffset = { alpha: 0, beta: 0, gamma: 0, absolute: false };
    this.calibrationSamples = [];
    this.smoothedOrientation = null;
  }

  /**
   * Get current orientation
   */
  getCurrentOrientation(): OrientationData | null {
    return this.currentOrientation ? { ...this.currentOrientation } : null;
  }

  /**
   * Get current motion
   */
  getCurrentMotion(): MotionData | null {
    return this.currentMotion ? { ...this.currentMotion } : null;
  }

  /**
   * Add orientation change listener
   */
  onOrientationChange(callback: (data: OrientationData) => void): void {
    this.orientationCallbacks.add(callback);
  }

  /**
   * Remove orientation change listener
   */
  offOrientationChange(callback: (data: OrientationData) => void): void {
    this.orientationCallbacks.delete(callback);
  }

  /**
   * Add motion change listener
   */
  onMotionChange(callback: (data: MotionData) => void): void {
    this.motionCallbacks.add(callback);
  }

  /**
   * Remove motion change listener
   */
  offMotionChange(callback: (data: MotionData) => void): void {
    this.motionCallbacks.delete(callback);
  }

  /**
   * Check if orientation tracking is supported
   */
  isOrientationSupported(): boolean {
    return 'DeviceOrientationEvent' in window;
  }

  /**
   * Check if motion tracking is supported
   */
  isMotionSupported(): boolean {
    return 'DeviceMotionEvent' in window;
  }

  /**
   * Check if device is in portrait mode
   */
  isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Get screen orientation
   */
  getScreenOrientation(): 'portrait' | 'landscape' | 'portrait-flipped' | 'landscape-flipped' {
    const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
    
    if (orientation) {
      if (orientation.angle === 0) return 'portrait';
      if (orientation.angle === 90) return 'landscape';
      if (orientation.angle === 180) return 'portrait-flipped';
      if (orientation.angle === 270) return 'landscape-flipped';
    }

    // Fallback based on dimensions
    return this.isPortrait() ? 'portrait' : 'landscape';
  }

  /**
   * Convert orientation to Three.js Euler angles
   */
  toEulerAngles(orientation?: OrientationData): { x: number; y: number; z: number } {
    const data = orientation || this.currentOrientation;
    
    if (!data) {
      return { x: 0, y: 0, z: 0 };
    }

    // Convert degrees to radians and adjust for Three.js coordinate system
    return {
      x: (data.beta * Math.PI) / 180,   // Pitch
      y: (data.gamma * Math.PI) / 180,  // Roll
      z: (data.alpha * Math.PI) / 180,  // Yaw
    };
  }

  /**
   * Get device tilt angle
   */
  getTiltAngle(): number {
    if (!this.currentOrientation) {
      return 0;
    }

    // Calculate tilt based on beta and gamma
    const beta = this.currentOrientation.beta;
    const gamma = this.currentOrientation.gamma;
    
    return Math.sqrt(beta * beta + gamma * gamma);
  }

  /**
   * Check if device is stable (not moving much)
   */
  isDeviceStable(threshold: number = 5): boolean {
    const tilt = this.getTiltAngle();
    return tilt < threshold;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DeviceOrientationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DeviceOrientationConfig {
    return { ...this.config };
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus(): {
    isCalibrated: boolean;
    samplesCollected: number;
    samplesNeeded: number;
    offset: OrientationData;
  } {
    return {
      isCalibrated: this.isCalibrated,
      samplesCollected: this.calibrationSamples.length,
      samplesNeeded: this.config.calibrationSamples,
      offset: { ...this.calibrationOffset },
    };
  }

  /**
   * Check if permissions are granted
   */
  hasPermissions(): boolean {
    return this.isPermissionGranted;
  }

  /**
   * Dispose orientation manager
   */
  dispose(): void {
    this.stopTracking();
    this.orientationCallbacks.clear();
    this.motionCallbacks.clear();
    this.calibrationSamples = [];
    this.currentOrientation = null;
    this.currentMotion = null;
    this.smoothedOrientation = null;
  }
}
