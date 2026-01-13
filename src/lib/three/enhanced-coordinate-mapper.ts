// Enhanced coordinate mapping system for precise face-to-3D transformations

import * as THREE from 'three';
import { FaceDetectionResult, FaceLandmark } from '@/types/face-detection';
import {
  HeadPose,
  FaceGeometry,
  GlassesAnchorPoints,
  CoordinateTransform,
  CalibrationData,
  MappingQuality,
  ENHANCED_FACE_LANDMARKS,
} from '@/types/coordinate-mapping';

export class EnhancedCoordinateMapper {
  private camera: THREE.PerspectiveCamera;
  private videoWidth: number;
  private videoHeight: number;
  private calibration: CalibrationData;
  private previousPose: HeadPose | null = null;
  private poseHistory: HeadPose[] = [];
  private readonly maxHistorySize = 10;

  constructor(
    camera: THREE.PerspectiveCamera,
    videoWidth: number,
    videoHeight: number,
    calibration?: Partial<CalibrationData>
  ) {
    this.camera = camera;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    
    // Default calibration data
    this.calibration = {
      focalLength: 500, // Approximate focal length in pixels
      principalPoint: new THREE.Vector2(videoWidth / 2, videoHeight / 2),
      distortion: [0, 0, 0, 0], // Simplified - no distortion correction
      averageEyeDistance: 0.063, // 63mm in meters
      averageFaceWidth: 0.14, // 140mm in meters
      averageFaceHeight: 0.18, // 180mm in meters
      depthScale: 1.0,
      depthOffset: 0.0,
      ...calibration,
    };
  }

  /**
   * Enhanced face-to-3D coordinate mapping with improved accuracy
   */
  mapFaceTo3D(faceResult: FaceDetectionResult): {
    headPose: HeadPose;
    faceGeometry: FaceGeometry;
    glassesAnchors: GlassesAnchorPoints;
    transform: CoordinateTransform;
    quality: MappingQuality;
  } {
    const landmarks = faceResult.landmarks;
    
    // Extract enhanced face geometry
    const faceGeometry = this.extractFaceGeometry(landmarks);
    
    // Calculate head pose with improved accuracy
    const headPose = this.calculateHeadPose(faceGeometry, landmarks);
    
    // Generate glasses anchor points
    const glassesAnchors = this.calculateGlassesAnchors(faceGeometry, headPose);
    
    // Create transformation matrices
    const transform = this.createTransformationMatrices(headPose);
    
    // Assess mapping quality
    const quality = this.assessMappingQuality(headPose, faceResult);
    
    // Apply smoothing
    const smoothedPose = this.smoothHeadPose(headPose);
    
    // Update history
    this.updatePoseHistory(smoothedPose);
    
    return {
      headPose: smoothedPose,
      faceGeometry,
      glassesAnchors,
      transform,
      quality,
    };
  }

  /**
   * Extract detailed face geometry from landmarks
   */
  private extractFaceGeometry(landmarks: FaceLandmark[]): FaceGeometry {
    // Get key landmark positions
    const leftEye = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.LEFT_EYE.CENTER);
    const rightEye = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.RIGHT_EYE.CENTER);
    const noseBridge = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.NOSE.BRIDGE_TOP);
    const noseTip = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.NOSE.TIP);
    const leftTemple = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.TEMPLE.LEFT);
    const rightTemple = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.TEMPLE.RIGHT);

    // Convert to 3D world coordinates
    const leftEye3D = this.normalizedTo3D(leftEye);
    const rightEye3D = this.normalizedTo3D(rightEye);
    const noseBridge3D = this.normalizedTo3D(noseBridge);
    const noseTip3D = this.normalizedTo3D(noseTip);
    const leftTemple3D = this.normalizedTo3D(leftTemple);
    const rightTemple3D = this.normalizedTo3D(rightTemple);

    // Calculate measurements
    const eyeDistance = leftEye3D.distanceTo(rightEye3D);
    const faceWidth = leftTemple3D.distanceTo(rightTemple3D);
    const noseLength = noseBridge3D.distanceTo(noseTip3D);

    // Calculate face outline for height
    const faceTop = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.FACE_OUTLINE.TOP);
    const faceBottom = this.getLandmark(landmarks, ENHANCED_FACE_LANDMARKS.FACE_OUTLINE.BOTTOM);
    const faceTop3D = this.normalizedTo3D(faceTop);
    const faceBottom3D = this.normalizedTo3D(faceBottom);
    const faceHeight = faceTop3D.distanceTo(faceBottom3D);

    // Calculate orientation vectors
    const eyeVector = rightEye3D.clone().sub(leftEye3D).normalize();
    const noseVector = noseTip3D.clone().sub(noseBridge3D).normalize();
    const faceNormal = eyeVector.clone().cross(noseVector).normalize();

    // Calculate temple width (distance from eye to temple)
    const templeWidth = (leftEye3D.distanceTo(leftTemple3D) + rightEye3D.distanceTo(rightTemple3D)) / 2;

    return {
      eyeDistance,
      faceWidth,
      faceHeight,
      noseLength,
      templeWidth,
      leftEye: leftEye3D,
      rightEye: rightEye3D,
      noseBridge: noseBridge3D,
      noseTip: noseTip3D,
      leftTemple: leftTemple3D,
      rightTemple: rightTemple3D,
      eyeVector,
      noseVector,
      faceNormal,
    };
  }

  /**
   * Calculate precise head pose from face geometry
   */
  private calculateHeadPose(faceGeometry: FaceGeometry, landmarks: FaceLandmark[]): HeadPose {
    // Calculate face center
    const faceCenter = faceGeometry.leftEye
      .clone()
      .add(faceGeometry.rightEye)
      .add(faceGeometry.noseBridge)
      .divideScalar(3);

    // Estimate depth based on eye distance
    const depthEstimate = this.estimateDepth(faceGeometry.eyeDistance);
    faceCenter.z = -depthEstimate;

    // Calculate rotation using multiple reference points
    const rotation = this.calculateRotationFromGeometry(faceGeometry);
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);

    // Calculate scale based on face measurements
    const scale = this.calculateFaceScale(faceGeometry);

    return {
      position: faceCenter,
      rotation,
      quaternion,
      scale,
    };
  }

  /**
   * Calculate rotation from face geometry using multiple methods
   */
  private calculateRotationFromGeometry(faceGeometry: FaceGeometry): THREE.Euler {
    // Method 1: Eye line rotation (roll)
    const eyeVector = faceGeometry.eyeVector;
    const roll = Math.atan2(eyeVector.y, eyeVector.x);

    // Method 2: Nose direction (pitch and yaw)
    const noseVector = faceGeometry.noseVector;
    const pitch = Math.atan2(-noseVector.y, Math.sqrt(noseVector.x * noseVector.x + noseVector.z * noseVector.z));
    
    // Method 3: Face normal for yaw
    const faceNormal = faceGeometry.faceNormal;
    const yaw = Math.atan2(faceNormal.x, faceNormal.z);

    return new THREE.Euler(pitch, yaw, roll, 'XYZ');
  }

  /**
   * Calculate glasses anchor points for precise positioning
   */
  private calculateGlassesAnchors(faceGeometry: FaceGeometry, headPose: HeadPose): GlassesAnchorPoints {
    // Bridge center (between eyes, slightly above)
    const bridgeCenter = faceGeometry.leftEye
      .clone()
      .add(faceGeometry.rightEye)
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.005, 0)); // 5mm above eye line

    // Lens centers (positioned at eye level)
    const lensOffset = faceGeometry.eyeDistance * 0.4; // 40% of eye distance from center
    const leftLensCenter = bridgeCenter.clone().add(new THREE.Vector3(-lensOffset, 0, 0));
    const rightLensCenter = bridgeCenter.clone().add(new THREE.Vector3(lensOffset, 0, 0));

    // Temple start points (at the sides of the frame)
    const templeOffset = faceGeometry.eyeDistance * 0.6; // 60% of eye distance from center
    const leftTempleStart = bridgeCenter.clone().add(new THREE.Vector3(-templeOffset, 0, 0));
    const rightTempleStart = bridgeCenter.clone().add(new THREE.Vector3(templeOffset, 0, 0));

    // Calculate frame dimensions based on face geometry
    const lensWidth = faceGeometry.eyeDistance * 0.35; // 35% of eye distance
    const lensHeight = lensWidth * 0.8; // 4:5 aspect ratio
    const bridgeWidth = faceGeometry.eyeDistance * 0.15; // 15% of eye distance
    const templeLength = faceGeometry.templeWidth * 1.2; // 120% of temple width

    return {
      bridgeCenter,
      leftLensCenter,
      rightLensCenter,
      leftTempleStart,
      rightTempleStart,
      lensWidth,
      lensHeight,
      bridgeWidth,
      templeLength,
    };
  }

  /**
   * Create transformation matrices for coordinate conversion
   */
  private createTransformationMatrices(headPose: HeadPose): CoordinateTransform {
    // Face to world transformation
    const faceToWorld = new THREE.Matrix4();
    faceToWorld.compose(headPose.position, headPose.quaternion, new THREE.Vector3(headPose.scale, headPose.scale, headPose.scale));

    // World to face transformation (inverse)
    const worldToFace = faceToWorld.clone().invert();

    // Camera matrices
    const viewMatrix = this.camera.matrixWorldInverse.clone();
    const projectionMatrix = this.camera.projectionMatrix.clone();

    // Viewport transformation
    const viewportMatrix = new THREE.Matrix4();
    viewportMatrix.makeScale(this.videoWidth / 2, -this.videoHeight / 2, 1);
    viewportMatrix.setPosition(this.videoWidth / 2, this.videoHeight / 2, 0);

    return {
      faceToWorld,
      worldToFace,
      viewMatrix,
      projectionMatrix,
      viewportMatrix,
    };
  }

  /**
   * Assess the quality of the coordinate mapping
   */
  private assessMappingQuality(headPose: HeadPose, faceResult: FaceDetectionResult): MappingQuality {
    let confidence = faceResult.confidence;
    let stability = 1.0;
    let accuracy = 1.0;
    let trackingLoss = 0.0;

    // Assess stability based on pose history
    if (this.previousPose) {
      const positionDiff = headPose.position.distanceTo(this.previousPose.position);
      const rotationDiff = Math.abs(headPose.rotation.x - this.previousPose.rotation.x) +
                          Math.abs(headPose.rotation.y - this.previousPose.rotation.y) +
                          Math.abs(headPose.rotation.z - this.previousPose.rotation.z);

      stability = Math.max(0, 1 - (positionDiff * 10 + rotationDiff * 2));
    }

    // Assess accuracy based on face measurements
    const eyeDistanceRatio = faceResult.eyeDistance / this.calibration.averageEyeDistance;
    if (eyeDistanceRatio < 0.5 || eyeDistanceRatio > 2.0) {
      accuracy *= 0.5; // Reduce accuracy for unrealistic measurements
    }

    // Detect tracking loss
    if (confidence < 0.7 || stability < 0.5) {
      trackingLoss = 1 - Math.min(confidence, stability);
    }

    return {
      confidence,
      stability,
      accuracy,
      trackingLoss,
    };
  }

  /**
   * Apply temporal smoothing to head pose
   */
  private smoothHeadPose(currentPose: HeadPose): HeadPose {
    if (!this.previousPose) {
      this.previousPose = currentPose;
      return currentPose;
    }

    const smoothingFactor = 0.7; // Adjust for more/less smoothing

    // Smooth position
    const smoothedPosition = this.previousPose.position
      .clone()
      .multiplyScalar(smoothingFactor)
      .add(currentPose.position.clone().multiplyScalar(1 - smoothingFactor));

    // Smooth rotation using quaternion slerp
    const smoothedQuaternion = this.previousPose.quaternion
      .clone()
      .slerp(currentPose.quaternion, 1 - smoothingFactor);

    // Smooth scale
    const smoothedScale = this.previousPose.scale * smoothingFactor + currentPose.scale * (1 - smoothingFactor);

    const smoothedPose: HeadPose = {
      position: smoothedPosition,
      rotation: new THREE.Euler().setFromQuaternion(smoothedQuaternion),
      quaternion: smoothedQuaternion,
      scale: smoothedScale,
    };

    this.previousPose = smoothedPose;
    return smoothedPose;
  }

  /**
   * Update pose history for stability analysis
   */
  private updatePoseHistory(pose: HeadPose): void {
    this.poseHistory.push(pose);
    if (this.poseHistory.length > this.maxHistorySize) {
      this.poseHistory.shift();
    }
  }

  /**
   * Helper method to get landmark by index
   */
  private getLandmark(landmarks: FaceLandmark[], index: number): FaceLandmark {
    return landmarks[index] || { x: 0, y: 0, z: 0 };
  }

  /**
   * Convert normalized coordinates to 3D world coordinates
   */
  private normalizedTo3D(landmark: FaceLandmark): THREE.Vector3 {
    // Convert normalized coordinates (0-1) to NDC (-1 to 1)
    const x = (landmark.x * 2) - 1;
    const y = -((landmark.y * 2) - 1); // Flip Y axis

    // Estimate depth from Z coordinate (MediaPipe provides relative depth)
    const depth = this.estimateDepthFromZ(landmark.z);

    // Unproject to world coordinates
    const vector = new THREE.Vector3(x, y, -1);
    vector.unproject(this.camera);
    
    const direction = vector.sub(this.camera.position).normalize();
    return this.camera.position.clone().add(direction.multiplyScalar(depth));
  }

  /**
   * Estimate depth based on eye distance
   */
  private estimateDepth(eyeDistance: number): number {
    const focalLength = this.calibration.focalLength;
    const realEyeDistance = this.calibration.averageEyeDistance;
    
    // Simple pinhole camera model: depth = (focal_length * real_size) / pixel_size
    const pixelEyeDistance = eyeDistance * this.videoWidth;
    const depth = (focalLength * realEyeDistance) / pixelEyeDistance;
    
    // Apply calibration scaling and clamping
    return Math.max(0.3, Math.min(3.0, depth * this.calibration.depthScale + this.calibration.depthOffset));
  }

  /**
   * Estimate depth from MediaPipe Z coordinate
   */
  private estimateDepthFromZ(z: number): number {
    // MediaPipe Z is relative depth, convert to absolute depth
    const baseDepth = 1.0; // 1 meter base distance
    const depthRange = 0.5; // ±50cm variation
    
    return baseDepth + (z * depthRange);
  }

  /**
   * Calculate face scale factor
   */
  private calculateFaceScale(faceGeometry: FaceGeometry): number {
    const eyeDistanceRatio = faceGeometry.eyeDistance / this.calibration.averageEyeDistance;
    const faceWidthRatio = faceGeometry.faceWidth / this.calibration.averageFaceWidth;
    
    // Average the ratios for more stable scaling
    return (eyeDistanceRatio + faceWidthRatio) / 2;
  }

  /**
   * Update calibration data
   */
  updateCalibration(calibration: Partial<CalibrationData>): void {
    this.calibration = { ...this.calibration, ...calibration };
  }

  /**
   * Update camera and video dimensions
   */
  updateDimensions(camera: THREE.PerspectiveCamera, videoWidth: number, videoHeight: number): void {
    this.camera = camera;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    
    // Update principal point
    this.calibration.principalPoint.set(videoWidth / 2, videoHeight / 2);
  }

  /**
   * Get pose history for analysis
   */
  getPoseHistory(): HeadPose[] {
    return [...this.poseHistory];
  }

  /**
   * Reset tracking state
   */
  reset(): void {
    this.previousPose = null;
    this.poseHistory = [];
  }
}
