// Coordinate mapping utilities for face landmarks to 3D space

import * as THREE from 'three';
import { FaceDetectionResult } from '@/types/face-detection';

export interface CoordinateMapping {
  // Face space to 3D world space transformation
  faceToWorld: THREE.Matrix4;
  // Screen space to normalized device coordinates
  screenToNDC: THREE.Matrix4;
  // Camera projection matrix
  projectionMatrix: THREE.Matrix4;
}

export interface Face3DCoordinates {
  // Eye positions in 3D world space
  leftEye: THREE.Vector3;
  rightEye: THREE.Vector3;
  // Nose bridge positions
  noseBridgeTop: THREE.Vector3;
  noseBridgeBottom: THREE.Vector3;
  // Face center in 3D space
  faceCenter: THREE.Vector3;
  // Face rotation quaternion
  faceRotation: THREE.Quaternion;
  // Face scale factor
  faceScale: number;
}

export class CoordinateMapper {
  private camera: THREE.PerspectiveCamera;
  private videoWidth: number;
  private videoHeight: number;

  constructor(camera: THREE.PerspectiveCamera, videoWidth: number, videoHeight: number) {
    this.camera = camera;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
  }

  /**
   * Convert normalized face coordinates to 3D world coordinates
   */
  faceToWorldCoordinates(faceResult: FaceDetectionResult): Face3DCoordinates {
    // Convert normalized coordinates (0-1) to NDC (-1 to 1)
    const leftEyeNDC = this.normalizedToNDC(
      faceResult.eyePositions.left.x,
      faceResult.eyePositions.left.y
    );
    
    const rightEyeNDC = this.normalizedToNDC(
      faceResult.eyePositions.right.x,
      faceResult.eyePositions.right.y
    );

    const noseBridgeTopNDC = this.normalizedToNDC(
      faceResult.noseBridge.top.x,
      faceResult.noseBridge.top.y
    );

    const noseBridgeBottomNDC = this.normalizedToNDC(
      faceResult.noseBridge.bottom.x,
      faceResult.noseBridge.bottom.y
    );

    const faceCenterNDC = this.normalizedToNDC(
      faceResult.faceCenter.x,
      faceResult.faceCenter.y
    );

    // Estimate depth based on eye distance (larger face = closer to camera)
    const eyeDistanceNormalized = faceResult.eyeDistance;
    const estimatedDepth = this.estimateDepthFromEyeDistance(eyeDistanceNormalized);

    // Convert NDC to world coordinates at estimated depth
    const leftEye = this.ndcToWorldCoordinates(leftEyeNDC.x, leftEyeNDC.y, estimatedDepth);
    const rightEye = this.ndcToWorldCoordinates(rightEyeNDC.x, rightEyeNDC.y, estimatedDepth);
    const noseBridgeTop = this.ndcToWorldCoordinates(noseBridgeTopNDC.x, noseBridgeTopNDC.y, estimatedDepth);
    const noseBridgeBottom = this.ndcToWorldCoordinates(noseBridgeBottomNDC.x, noseBridgeBottomNDC.y, estimatedDepth);
    const faceCenter = this.ndcToWorldCoordinates(faceCenterNDC.x, faceCenterNDC.y, estimatedDepth);

    // Calculate face rotation based on eye line and nose direction
    const faceRotation = this.calculateFaceRotation(leftEye, rightEye, noseBridgeTop, noseBridgeBottom);

    // Calculate face scale based on eye distance
    const faceScale = this.calculateFaceScale(eyeDistanceNormalized);

    return {
      leftEye,
      rightEye,
      noseBridgeTop,
      noseBridgeBottom,
      faceCenter,
      faceRotation,
      faceScale,
    };
  }

  /**
   * Convert normalized coordinates (0-1) to NDC (-1 to 1)
   */
  private normalizedToNDC(x: number, y: number): { x: number; y: number } {
    return {
      x: (x * 2) - 1,
      y: -((y * 2) - 1), // Flip Y axis for screen coordinates
    };
  }

  /**
   * Convert NDC coordinates to world coordinates at given depth
   */
  private ndcToWorldCoordinates(x: number, y: number, depth: number): THREE.Vector3 {
    const vector = new THREE.Vector3(x, y, -1);
    
    // Unproject from NDC to world coordinates
    vector.unproject(this.camera);
    
    // Calculate direction from camera to point
    const direction = vector.sub(this.camera.position).normalize();
    
    // Position at specified depth
    const worldPosition = this.camera.position.clone().add(direction.multiplyScalar(depth));
    
    return worldPosition;
  }

  /**
   * Estimate depth based on eye distance (empirical relationship)
   */
  private estimateDepthFromEyeDistance(eyeDistance: number): number {
    // Typical inter-pupillary distance is about 6.5cm
    // This is an approximation - in a real system you'd calibrate this
    const typicalEyeDistanceCm = 6.5;
    const focalLengthPixels = (this.camera.fov * Math.PI / 180) * this.videoHeight / 2;
    
    // Simple depth estimation: depth = (focal_length * real_distance) / pixel_distance
    const eyeDistancePixels = eyeDistance * this.videoWidth;
    const estimatedDepthCm = (focalLengthPixels * typicalEyeDistanceCm) / eyeDistancePixels;
    
    // Convert to Three.js units (assuming 1 unit = 1cm) and clamp to reasonable range
    return Math.max(50, Math.min(200, estimatedDepthCm));
  }

  /**
   * Calculate face rotation quaternion from facial landmarks
   */
  private calculateFaceRotation(
    leftEye: THREE.Vector3,
    rightEye: THREE.Vector3,
    noseBridgeTop: THREE.Vector3,
    noseBridgeBottom: THREE.Vector3
  ): THREE.Quaternion {
    // Calculate face coordinate system
    const eyeVector = rightEye.clone().sub(leftEye).normalize();
    const noseVector = noseBridgeBottom.clone().sub(noseBridgeTop).normalize();
    
    // Face forward vector (cross product of eye and nose vectors)
    const faceForward = eyeVector.clone().cross(noseVector).normalize();
    
    // Face up vector (nose direction)
    const faceUp = noseVector.clone();
    
    // Face right vector (eye direction)
    const faceRight = eyeVector.clone();
    
    // Create rotation matrix from face coordinate system
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(faceRight, faceUp, faceForward);
    
    // Extract quaternion from rotation matrix
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(rotationMatrix);
    
    return quaternion;
  }

  /**
   * Calculate face scale factor based on eye distance
   */
  private calculateFaceScale(eyeDistance: number): number {
    // Normalize scale based on typical eye distance
    // Larger eye distance = closer face = larger scale
    const baseEyeDistance = 0.15; // Typical normalized eye distance
    return eyeDistance / baseEyeDistance;
  }

  /**
   * Update camera and video dimensions
   */
  updateDimensions(camera: THREE.PerspectiveCamera, videoWidth: number, videoHeight: number): void {
    this.camera = camera;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
  }

  /**
   * Project 3D world coordinates back to screen coordinates
   */
  worldToScreenCoordinates(worldPosition: THREE.Vector3): { x: number; y: number } {
    const vector = worldPosition.clone();
    vector.project(this.camera);
    
    // Convert from NDC to screen coordinates
    const x = (vector.x + 1) / 2;
    const y = (-vector.y + 1) / 2;
    
    return { x, y };
  }

  /**
   * Create transformation matrix for glasses positioning
   */
  createGlassesTransform(face3D: Face3DCoordinates): THREE.Matrix4 {
    const transform = new THREE.Matrix4();
    
    // Position at face center
    const position = face3D.faceCenter.clone();
    
    // Apply face rotation
    const rotation = face3D.faceRotation;
    
    // Apply face scale
    const scale = new THREE.Vector3(face3D.faceScale, face3D.faceScale, face3D.faceScale);
    
    // Compose transformation matrix
    transform.compose(position, rotation, scale);
    
    return transform;
  }
}
