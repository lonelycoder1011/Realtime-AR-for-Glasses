// MediaPipe Face Mesh utilities and helper functions

import { FaceLandmark, FaceDetectionResult, FACE_LANDMARKS } from '@/types/face-detection';

/**
 * Calculate the distance between two landmarks
 */
export const calculateDistance = (point1: FaceLandmark, point2: FaceLandmark): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Calculate the center point between multiple landmarks
 */
export const calculateCenter = (landmarks: FaceLandmark[]): FaceLandmark => {
  const sum = landmarks.reduce(
    (acc, landmark) => ({
      x: acc.x + landmark.x,
      y: acc.y + landmark.y,
      z: acc.z + landmark.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / landmarks.length,
    y: sum.y / landmarks.length,
    z: sum.z / landmarks.length,
  };
};

/**
 * Calculate bounding box from landmarks
 */
export const calculateBoundingBox = (landmarks: FaceLandmark[]) => {
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Extract key facial features from MediaPipe landmarks
 */
export const extractFaceFeatures = (landmarks: FaceLandmark[]): Omit<FaceDetectionResult, 'confidence'> => {
  // Get eye positions (approximate centers)
  const leftEyeCenter = landmarks[FACE_LANDMARKS.LEFT_EYE_CENTER] || 
    calculateCenter([
      landmarks[FACE_LANDMARKS.LEFT_EYE_INNER],
      landmarks[FACE_LANDMARKS.LEFT_EYE_OUTER]
    ]);
  
  const rightEyeCenter = landmarks[FACE_LANDMARKS.RIGHT_EYE_CENTER] || 
    calculateCenter([
      landmarks[FACE_LANDMARKS.RIGHT_EYE_INNER],
      landmarks[FACE_LANDMARKS.RIGHT_EYE_OUTER]
    ]);

  // Calculate eye distance
  const eyeDistance = calculateDistance(leftEyeCenter, rightEyeCenter);

  // Get nose bridge points
  const noseBridgeTop = landmarks[FACE_LANDMARKS.NOSE_BRIDGE_TOP];
  const noseBridgeBottom = landmarks[FACE_LANDMARKS.NOSE_BRIDGE_MID];

  // Calculate face center
  const faceCenter = calculateCenter([leftEyeCenter, rightEyeCenter, noseBridgeTop]);

  // Calculate bounding box
  const boundingBox = calculateBoundingBox(landmarks);

  return {
    landmarks,
    boundingBox,
    faceCenter,
    eyeDistance,
    noseBridge: {
      top: noseBridgeTop,
      bottom: noseBridgeBottom,
    },
    eyePositions: {
      left: leftEyeCenter,
      right: rightEyeCenter,
    },
  };
};

/**
 * Smooth landmarks using exponential moving average
 */
export const smoothLandmarks = (
  currentLandmarks: FaceLandmark[],
  previousLandmarks: FaceLandmark[] | null,
  smoothingFactor: number = 0.8
): FaceLandmark[] => {
  if (!previousLandmarks || previousLandmarks.length !== currentLandmarks.length) {
    return currentLandmarks;
  }

  return currentLandmarks.map((current, index) => {
    const previous = previousLandmarks[index];
    return {
      x: previous.x * smoothingFactor + current.x * (1 - smoothingFactor),
      y: previous.y * smoothingFactor + current.y * (1 - smoothingFactor),
      z: previous.z * smoothingFactor + current.z * (1 - smoothingFactor),
    };
  });
};

/**
 * Validate face detection quality
 */
export const validateFaceDetection = (result: FaceDetectionResult): boolean => {
  // Check if we have enough landmarks
  if (!result.landmarks || result.landmarks.length < 400) {
    return false;
  }

  // Check confidence threshold
  if (result.confidence < 0.5) {
    return false;
  }

  // Check if eye distance is reasonable (not too small or too large)
  if (result.eyeDistance < 0.05 || result.eyeDistance > 0.3) {
    return false;
  }

  // Check if face is roughly centered and not too close to edges
  const { faceCenter, boundingBox } = result;
  if (
    faceCenter.x < 0.1 || faceCenter.x > 0.9 ||
    faceCenter.y < 0.1 || faceCenter.y > 0.9 ||
    boundingBox.width < 0.2 || boundingBox.height < 0.2
  ) {
    return false;
  }

  return true;
};

/**
 * Convert normalized coordinates to pixel coordinates
 */
export const denormalizeLandmarks = (
  landmarks: FaceLandmark[],
  videoWidth: number,
  videoHeight: number
): FaceLandmark[] => {
  return landmarks.map(landmark => ({
    x: landmark.x * videoWidth,
    y: landmark.y * videoHeight,
    z: landmark.z * videoWidth, // Z is also normalized to width
  }));
};

/**
 * Calculate face rotation angles (pitch, yaw, roll)
 */
export const calculateFaceRotation = (landmarks: FaceLandmark[]) => {
  const leftEye = landmarks[FACE_LANDMARKS.LEFT_EYE_CENTER];
  const rightEye = landmarks[FACE_LANDMARKS.RIGHT_EYE_CENTER];
  const noseTip = landmarks[FACE_LANDMARKS.NOSE_TIP];
  const noseBridge = landmarks[FACE_LANDMARKS.NOSE_BRIDGE_TOP];

  // Calculate roll (rotation around z-axis)
  const eyeVector = { x: rightEye.x - leftEye.x, y: rightEye.y - leftEye.y };
  const roll = Math.atan2(eyeVector.y, eyeVector.x);

  // Calculate yaw (rotation around y-axis) - simplified
  const faceWidth = Math.abs(rightEye.x - leftEye.x);
  const noseOffset = noseTip.x - (leftEye.x + rightEye.x) / 2;
  const yaw = Math.atan2(noseOffset, faceWidth);

  // Calculate pitch (rotation around x-axis) - simplified
  const eyeLevel = (leftEye.y + rightEye.y) / 2;
  const noseLevel = noseBridge.y;
  const pitch = Math.atan2(noseLevel - eyeLevel, Math.abs(noseTip.z - noseBridge.z));

  return {
    pitch: pitch * (180 / Math.PI), // Convert to degrees
    yaw: yaw * (180 / Math.PI),
    roll: roll * (180 / Math.PI),
  };
};
