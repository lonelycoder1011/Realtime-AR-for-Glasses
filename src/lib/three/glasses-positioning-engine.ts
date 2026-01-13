// Advanced glasses positioning engine with multiple algorithms

import * as THREE from 'three';
import { KalmanFilter } from './kalman-filter';
import { HeadPose, FaceGeometry, GlassesAnchorPoints } from '@/types/coordinate-mapping';
import {
  GlassesPositionState,
  PositioningConfig,
  TrackingHistory,
  PositioningQuality,
  GlassesTransform,
  AdaptiveScaling,
  JitterReduction,
  MovingAverageFilter,
  PositioningAlgorithmType,
  POSITIONING_ALGORITHMS,
  DEFAULT_POSITIONING_CONFIG,
} from '@/types/glasses-positioning';

export class GlassesPositioningEngine {
  private config: PositioningConfig;
  private currentState: GlassesPositionState | null = null;
  private history: TrackingHistory;
  private kalmanPosition: KalmanFilter;
  private kalmanRotation: KalmanFilter;
  private kalmanScale: KalmanFilter;
  private jitterReduction: JitterReduction;
  private adaptiveScaling: AdaptiveScaling;
  private algorithm: PositioningAlgorithmType = POSITIONING_ALGORITHMS.HYBRID;
  private lastUpdateTime: number = 0;
  private trackingLossStartTime: number = 0;
  private isTrackingLost: boolean = false;

  constructor(config: Partial<PositioningConfig> = {}) {
    this.config = { ...DEFAULT_POSITIONING_CONFIG, ...config };
    
    // Initialize tracking history
    this.history = {
      positions: [],
      rotations: [],
      scales: [],
      timestamps: [],
      confidences: [],
      maxHistorySize: 30, // 1 second at 30fps
    };

    // Initialize Kalman filters
    this.kalmanPosition = new KalmanFilter(0.01, 0.1);
    this.kalmanRotation = new KalmanFilter(0.005, 0.05);
    this.kalmanScale = new KalmanFilter(0.001, 0.02, new THREE.Vector3(1, 1, 1));

    // Initialize jitter reduction
    this.jitterReduction = {
      positionFilter: this.createMovingAverageFilter(5),
      rotationFilter: this.createMovingAverageFilter(3),
      scaleFilter: this.createMovingAverageFilter(7),
      outlierThreshold: this.config.outlierDetectionThreshold,
      consecutiveOutliers: 0,
      maxOutliers: 3,
    };

    // Initialize adaptive scaling
    this.adaptiveScaling = {
      eyeDistance: 0.063, // Default 63mm
      faceWidth: 0.14,    // Default 140mm
      faceHeight: 0.18,   // Default 180mm
      horizontalScale: 1.0,
      verticalScale: 1.0,
      depthScale: 1.0,
      adaptationSpeed: this.config.scaleAdaptationRate,
      stabilityFactor: 0.95,
    };
  }

  /**
   * Main positioning update function
   */
  updatePosition(
    headPose: HeadPose,
    faceGeometry: FaceGeometry,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number
  ): GlassesPositionState {
    const currentTime = performance.now();
    const deltaTime = this.lastUpdateTime > 0 ? (currentTime - this.lastUpdateTime) / 1000 : 1/30;
    this.lastUpdateTime = currentTime;

    // Check for tracking loss
    if (confidence < 0.5) {
      this.handleTrackingLoss(currentTime);
      if (this.currentState) {
        return this.currentState;
      }
    } else {
      this.isTrackingLost = false;
      this.trackingLossStartTime = 0;
    }

    // Update adaptive scaling
    this.updateAdaptiveScaling(faceGeometry);

    // Apply positioning algorithm
    let newState: GlassesPositionState;
    switch (this.algorithm) {
      case POSITIONING_ALGORITHMS.KALMAN:
        newState = this.applyKalmanPositioning(headPose, glassesAnchors, confidence, deltaTime);
        break;
      case POSITIONING_ALGORITHMS.ADAPTIVE:
        newState = this.applyAdaptivePositioning(headPose, glassesAnchors, confidence);
        break;
      case POSITIONING_ALGORITHMS.HYBRID:
        newState = this.applyHybridPositioning(headPose, glassesAnchors, confidence, deltaTime);
        break;
      default:
        newState = this.applyBasicPositioning(headPose, glassesAnchors, confidence);
    }

    // Apply jitter reduction
    newState = this.applyJitterReduction(newState);

    // Apply position offsets
    newState = this.applyPositionOffsets(newState);

    // Update history
    this.updateHistory(newState, currentTime);

    // Update current state
    this.currentState = newState;

    return newState;
  }

  /**
   * Basic positioning algorithm
   */
  private applyBasicPositioning(
    headPose: HeadPose,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number
  ): GlassesPositionState {
    const position = glassesAnchors.bridgeCenter.clone();
    const rotation = headPose.rotation.clone();
    const scale = new THREE.Vector3().setScalar(
      Math.max(this.config.minScale, Math.min(this.config.maxScale, headPose.scale))
    );

    // Apply smoothing if we have previous state
    if (this.currentState) {
      position.lerp(this.currentState.position, this.config.positionSmoothingFactor);
      rotation.x = THREE.MathUtils.lerp(rotation.x, this.currentState.rotation.x, this.config.rotationSmoothingFactor);
      rotation.y = THREE.MathUtils.lerp(rotation.y, this.currentState.rotation.y, this.config.rotationSmoothingFactor);
      rotation.z = THREE.MathUtils.lerp(rotation.z, this.currentState.rotation.z, this.config.rotationSmoothingFactor);
      scale.lerp(this.currentState.scale, this.config.scaleSmoothingFactor);
    }

    return {
      position,
      rotation,
      scale,
      confidence,
      isStable: this.assessStability(confidence),
      lastUpdate: performance.now(),
    };
  }

  /**
   * Kalman filter positioning algorithm
   */
  private applyKalmanPositioning(
    headPose: HeadPose,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number,
    deltaTime: number
  ): GlassesPositionState {
    // Predict step
    this.kalmanPosition.predict(deltaTime);
    this.kalmanRotation.predict(deltaTime);
    this.kalmanScale.predict(deltaTime);

    // Update step with measurements
    this.kalmanPosition.update(glassesAnchors.bridgeCenter);
    
    // Convert rotation to vector for Kalman filtering
    const rotationVector = new THREE.Vector3(headPose.rotation.x, headPose.rotation.y, headPose.rotation.z);
    this.kalmanRotation.update(rotationVector);
    
    const scaleVector = new THREE.Vector3().setScalar(headPose.scale);
    this.kalmanScale.update(scaleVector);

    // Get filtered results
    const position = this.kalmanPosition.getPosition();
    const rotationVec = this.kalmanRotation.getPosition();
    const rotation = new THREE.Euler(rotationVec.x, rotationVec.y, rotationVec.z);
    const scale = this.kalmanScale.getPosition();

    // Clamp scale
    scale.x = Math.max(this.config.minScale, Math.min(this.config.maxScale, scale.x));
    scale.y = scale.z = scale.x;

    return {
      position,
      rotation,
      scale,
      confidence,
      isStable: this.assessStability(confidence),
      lastUpdate: performance.now(),
    };
  }

  /**
   * Adaptive positioning algorithm
   */
  private applyAdaptivePositioning(
    headPose: HeadPose,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number
  ): GlassesPositionState {
    const position = glassesAnchors.bridgeCenter.clone();
    const rotation = headPose.rotation.clone();
    
    // Apply adaptive scaling
    const adaptiveScale = this.calculateAdaptiveScale();
    const scale = new THREE.Vector3(
      adaptiveScale.horizontalScale,
      adaptiveScale.verticalScale,
      adaptiveScale.depthScale
    );

    // Dynamic smoothing based on confidence
    const dynamicSmoothingFactor = this.config.positionSmoothingFactor * confidence;
    
    if (this.currentState) {
      position.lerp(this.currentState.position, dynamicSmoothingFactor);
      
      // Adaptive rotation smoothing
      const rotationSmoothingFactor = this.config.rotationSmoothingFactor * (confidence * 0.8 + 0.2);
      rotation.x = THREE.MathUtils.lerp(rotation.x, this.currentState.rotation.x, rotationSmoothingFactor);
      rotation.y = THREE.MathUtils.lerp(rotation.y, this.currentState.rotation.y, rotationSmoothingFactor);
      rotation.z = THREE.MathUtils.lerp(rotation.z, this.currentState.rotation.z, rotationSmoothingFactor);
      
      scale.lerp(this.currentState.scale, this.config.scaleSmoothingFactor * confidence);
    }

    return {
      position,
      rotation,
      scale,
      confidence,
      isStable: this.assessStability(confidence),
      lastUpdate: performance.now(),
    };
  }

  /**
   * Hybrid positioning algorithm (combines Kalman + Adaptive)
   */
  private applyHybridPositioning(
    headPose: HeadPose,
    glassesAnchors: GlassesAnchorPoints,
    confidence: number,
    deltaTime: number
  ): GlassesPositionState {
    // Use Kalman for position (smooth tracking)
    this.kalmanPosition.predict(deltaTime);
    this.kalmanPosition.update(glassesAnchors.bridgeCenter);
    const position = this.kalmanPosition.getPosition();

    // Use adaptive smoothing for rotation
    const rotation = headPose.rotation.clone();
    if (this.currentState) {
      const rotationSmoothingFactor = this.config.rotationSmoothingFactor * (confidence * 0.7 + 0.3);
      rotation.x = THREE.MathUtils.lerp(rotation.x, this.currentState.rotation.x, rotationSmoothingFactor);
      rotation.y = THREE.MathUtils.lerp(rotation.y, this.currentState.rotation.y, rotationSmoothingFactor);
      rotation.z = THREE.MathUtils.lerp(rotation.z, this.currentState.rotation.z, rotationSmoothingFactor);
    }

    // Use adaptive scaling
    const adaptiveScale = this.calculateAdaptiveScale();
    const scale = new THREE.Vector3(
      adaptiveScale.horizontalScale,
      adaptiveScale.verticalScale,
      adaptiveScale.depthScale
    );

    if (this.currentState) {
      scale.lerp(this.currentState.scale, this.config.scaleSmoothingFactor);
    }

    return {
      position,
      rotation,
      scale,
      confidence,
      isStable: this.assessStability(confidence),
      lastUpdate: performance.now(),
    };
  }

  /**
   * Apply jitter reduction filters
   */
  private applyJitterReduction(state: GlassesPositionState): GlassesPositionState {
    // Check for outliers
    if (this.currentState && this.isOutlier(state, this.currentState)) {
      this.jitterReduction.consecutiveOutliers++;
      
      if (this.jitterReduction.consecutiveOutliers < this.jitterReduction.maxOutliers) {
        // Reject outlier, return smoothed previous state
        return {
          ...this.currentState,
          confidence: state.confidence * 0.8, // Reduce confidence
          lastUpdate: state.lastUpdate,
        };
      }
    } else {
      this.jitterReduction.consecutiveOutliers = 0;
    }

    // Apply moving average filters
    const filteredPosition = new THREE.Vector3(
      this.updateMovingAverage(this.jitterReduction.positionFilter, state.position.x),
      this.updateMovingAverage(this.jitterReduction.positionFilter, state.position.y),
      this.updateMovingAverage(this.jitterReduction.positionFilter, state.position.z)
    );

    return {
      ...state,
      position: filteredPosition,
    };
  }

  /**
   * Apply position and rotation offsets
   */
  private applyPositionOffsets(state: GlassesPositionState): GlassesPositionState {
    const position = state.position.clone().add(this.config.positionOffset);
    const rotation = state.rotation.clone();
    rotation.x += this.config.rotationOffset.x;
    rotation.y += this.config.rotationOffset.y;
    rotation.z += this.config.rotationOffset.z;

    return {
      ...state,
      position,
      rotation,
    };
  }

  /**
   * Update adaptive scaling parameters
   */
  private updateAdaptiveScaling(faceGeometry: FaceGeometry): void {
    const targetEyeDistance = faceGeometry.eyeDistance;
    const targetFaceWidth = faceGeometry.faceWidth;
    const targetFaceHeight = faceGeometry.faceHeight;

    // Smooth adaptation
    const adaptationRate = this.adaptiveScaling.adaptationSpeed;
    this.adaptiveScaling.eyeDistance = THREE.MathUtils.lerp(
      this.adaptiveScaling.eyeDistance,
      targetEyeDistance,
      adaptationRate
    );
    this.adaptiveScaling.faceWidth = THREE.MathUtils.lerp(
      this.adaptiveScaling.faceWidth,
      targetFaceWidth,
      adaptationRate
    );
    this.adaptiveScaling.faceHeight = THREE.MathUtils.lerp(
      this.adaptiveScaling.faceHeight,
      targetFaceHeight,
      adaptationRate
    );
  }

  /**
   * Calculate adaptive scale factors
   */
  private calculateAdaptiveScale(): AdaptiveScaling {
    const baseEyeDistance = 0.063; // 63mm standard
    const baseFaceWidth = 0.14;    // 140mm standard
    const baseFaceHeight = 0.18;   // 180mm standard

    const horizontalScale = this.adaptiveScaling.eyeDistance / baseEyeDistance;
    const verticalScale = this.adaptiveScaling.faceHeight / baseFaceHeight;
    const depthScale = (horizontalScale + verticalScale) / 2;

    // Apply stability factor
    const stabilityFactor = this.adaptiveScaling.stabilityFactor;
    
    return {
      ...this.adaptiveScaling,
      horizontalScale: THREE.MathUtils.lerp(1.0, horizontalScale, stabilityFactor),
      verticalScale: THREE.MathUtils.lerp(1.0, verticalScale, stabilityFactor),
      depthScale: THREE.MathUtils.lerp(1.0, depthScale, stabilityFactor),
    };
  }

  /**
   * Handle tracking loss
   */
  private handleTrackingLoss(currentTime: number): void {
    if (!this.isTrackingLost) {
      this.isTrackingLost = true;
      this.trackingLossStartTime = currentTime;
    }

    // If tracking has been lost for too long, reset filters
    if (currentTime - this.trackingLossStartTime > this.config.trackingLossTimeout) {
      this.resetFilters();
    }
  }

  /**
   * Assess position stability
   */
  private assessStability(confidence: number): boolean {
    if (confidence < this.config.stabilityThreshold) {
      return false;
    }

    if (this.history.positions.length < 5) {
      return false;
    }

    // Check position variance over recent history
    const recentPositions = this.history.positions.slice(-5);
    const variance = this.calculatePositionVariance(recentPositions);
    
    return variance < 0.01; // 1cm variance threshold
  }

  /**
   * Check if current state is an outlier
   */
  private isOutlier(current: GlassesPositionState, previous: GlassesPositionState): boolean {
    const positionDiff = current.position.distanceTo(previous.position);
    const rotationDiff = Math.abs(current.rotation.x - previous.rotation.x) +
                        Math.abs(current.rotation.y - previous.rotation.y) +
                        Math.abs(current.rotation.z - previous.rotation.z);

    return positionDiff > this.jitterReduction.outlierThreshold ||
           rotationDiff > this.jitterReduction.outlierThreshold * 10; // Rotation in radians
  }

  /**
   * Update tracking history
   */
  private updateHistory(state: GlassesPositionState, timestamp: number): void {
    this.history.positions.push(state.position.clone());
    this.history.rotations.push(state.rotation.clone());
    this.history.scales.push(state.scale.x);
    this.history.timestamps.push(timestamp);
    this.history.confidences.push(state.confidence);

    // Maintain history size
    while (this.history.positions.length > this.history.maxHistorySize) {
      this.history.positions.shift();
      this.history.rotations.shift();
      this.history.scales.shift();
      this.history.timestamps.shift();
      this.history.confidences.shift();
    }
  }

  /**
   * Calculate position variance
   */
  private calculatePositionVariance(positions: THREE.Vector3[]): number {
    if (positions.length < 2) return 0;

    const mean = positions.reduce((sum, pos) => sum.add(pos), new THREE.Vector3()).divideScalar(positions.length);
    const variance = positions.reduce((sum, pos) => {
      const diff = pos.clone().sub(mean);
      return sum + diff.lengthSq();
    }, 0) / positions.length;

    return Math.sqrt(variance);
  }

  /**
   * Create moving average filter
   */
  private createMovingAverageFilter(windowSize: number): MovingAverageFilter {
    return {
      values: new Array(windowSize).fill(0),
      windowSize,
      currentIndex: 0,
      sum: 0,
      isInitialized: false,
    };
  }

  /**
   * Update moving average filter
   */
  private updateMovingAverage(filter: MovingAverageFilter, newValue: number): number {
    if (!filter.isInitialized) {
      filter.values.fill(newValue);
      filter.sum = newValue * filter.windowSize;
      filter.isInitialized = true;
      return newValue;
    }

    filter.sum -= filter.values[filter.currentIndex];
    filter.values[filter.currentIndex] = newValue;
    filter.sum += newValue;
    filter.currentIndex = (filter.currentIndex + 1) % filter.windowSize;

    return filter.sum / filter.windowSize;
  }

  /**
   * Reset all filters
   */
  private resetFilters(): void {
    if (this.currentState) {
      this.kalmanPosition.reset(this.currentState.position);
      this.kalmanRotation.reset(new THREE.Vector3(
        this.currentState.rotation.x,
        this.currentState.rotation.y,
        this.currentState.rotation.z
      ));
      this.kalmanScale.reset(this.currentState.scale);
    }

    this.jitterReduction.consecutiveOutliers = 0;
    this.history.positions = [];
    this.history.rotations = [];
    this.history.scales = [];
    this.history.timestamps = [];
    this.history.confidences = [];
  }

  /**
   * Get current positioning quality
   */
  getPositioningQuality(): PositioningQuality {
    if (!this.currentState || this.history.positions.length < 5) {
      return {
        stability: 0,
        accuracy: 0,
        smoothness: 0,
        responsiveness: 0,
        overallScore: 0,
      };
    }

    const stability = this.currentState.isStable ? 1.0 : 0.5;
    const accuracy = this.currentState.confidence;
    const smoothness = 1.0 - Math.min(1.0, this.calculatePositionVariance(this.history.positions.slice(-5)) * 100);
    const responsiveness = Math.min(1.0, this.kalmanPosition.getVelocity().length() * 10);
    const overallScore = (stability + accuracy + smoothness + responsiveness) / 4;

    return {
      stability,
      accuracy,
      smoothness,
      responsiveness,
      overallScore,
    };
  }

  /**
   * Set positioning algorithm
   */
  setAlgorithm(algorithm: PositioningAlgorithmType): void {
    this.algorithm = algorithm;
    this.resetFilters();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PositioningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current state
   */
  getCurrentState(): GlassesPositionState | null {
    return this.currentState;
  }

  /**
   * Get tracking history
   */
  getHistory(): TrackingHistory {
    return { ...this.history };
  }
}
