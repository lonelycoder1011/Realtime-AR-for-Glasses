// Kalman Filter implementation for smooth glasses positioning

import * as THREE from 'three';
import { KalmanFilterState } from '@/types/glasses-positioning';

export class KalmanFilter {
  private state: KalmanFilterState;
  private stateTransition: Float32Array;
  private measurementMatrix: Float32Array;
  private processNoiseMatrix: Float32Array;
  private measurementNoiseMatrix: Float32Array;
  private identity: Float32Array;

  constructor(
    processNoise: number = 0.01,
    measurementNoise: number = 0.1,
    initialPosition: THREE.Vector3 = new THREE.Vector3()
  ) {
    // Initialize state vector [x, y, z, vx, vy, vz]
    this.state = {
      state: new Float32Array([
        initialPosition.x, initialPosition.y, initialPosition.z, // position
        0, 0, 0 // velocity
      ]),
      covariance: new Float32Array(36), // 6x6 matrix
      processNoise,
      measurementNoise,
      dt: 1/30, // 30 FPS
    };

    // Initialize covariance matrix as identity
    for (let i = 0; i < 6; i++) {
      this.state.covariance[i * 6 + i] = 1.0;
    }

    // State transition matrix (constant velocity model)
    this.stateTransition = new Float32Array([
      1, 0, 0, this.state.dt, 0, 0,
      0, 1, 0, 0, this.state.dt, 0,
      0, 0, 1, 0, 0, this.state.dt,
      0, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 1, 0,
      0, 0, 0, 0, 0, 1
    ]);

    // Measurement matrix (we only observe position)
    this.measurementMatrix = new Float32Array([
      1, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0,
      0, 0, 1, 0, 0, 0
    ]);

    // Process noise matrix
    this.processNoiseMatrix = new Float32Array(36);
    this.initializeProcessNoise();

    // Measurement noise matrix
    this.measurementNoiseMatrix = new Float32Array([
      measurementNoise, 0, 0,
      0, measurementNoise, 0,
      0, 0, measurementNoise
    ]);

    // Identity matrix
    this.identity = new Float32Array([
      1, 0, 0, 0, 0, 0,
      0, 1, 0, 0, 0, 0,
      0, 0, 1, 0, 0, 0,
      0, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 1, 0,
      0, 0, 0, 0, 0, 1
    ]);
  }

  /**
   * Initialize process noise matrix
   */
  private initializeProcessNoise(): void {
    const dt = this.state.dt;
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt3 * dt;
    const q = this.state.processNoise;

    // Process noise for constant velocity model
    const processNoise = [
      dt4/4, 0, 0, dt3/2, 0, 0,
      0, dt4/4, 0, 0, dt3/2, 0,
      0, 0, dt4/4, 0, 0, dt3/2,
      dt3/2, 0, 0, dt2, 0, 0,
      0, dt3/2, 0, 0, dt2, 0,
      0, 0, dt3/2, 0, 0, dt2
    ];

    for (let i = 0; i < 36; i++) {
      this.processNoiseMatrix[i] = processNoise[i] * q;
    }
  }

  /**
   * Predict step of Kalman filter
   */
  predict(deltaTime?: number): void {
    if (deltaTime) {
      this.state.dt = deltaTime;
      this.updateStateTransition();
      this.initializeProcessNoise();
    }

    // Predict state: x = F * x
    const newState = new Float32Array(6);
    this.matrixVectorMultiply(this.stateTransition, this.state.state, newState, 6, 6);
    this.state.state.set(newState);

    // Predict covariance: P = F * P * F^T + Q
    const temp = new Float32Array(36);
    const newCovariance = new Float32Array(36);
    
    // temp = F * P
    this.matrixMultiply(this.stateTransition, this.state.covariance, temp, 6, 6, 6);
    
    // newCovariance = temp * F^T
    this.matrixMultiplyTranspose(temp, this.stateTransition, newCovariance, 6, 6, 6);
    
    // Add process noise: P = P + Q
    for (let i = 0; i < 36; i++) {
      newCovariance[i] += this.processNoiseMatrix[i];
    }
    
    this.state.covariance.set(newCovariance);
  }

  /**
   * Update step of Kalman filter
   */
  update(measurement: THREE.Vector3): void {
    const z = new Float32Array([measurement.x, measurement.y, measurement.z]);
    
    // Innovation: y = z - H * x
    const innovation = new Float32Array(3);
    const hx = new Float32Array(3);
    this.matrixVectorMultiply(this.measurementMatrix, this.state.state, hx, 3, 6);
    
    for (let i = 0; i < 3; i++) {
      innovation[i] = z[i] - hx[i];
    }

    // Innovation covariance: S = H * P * H^T + R
    const temp = new Float32Array(18); // 3x6
    const s = new Float32Array(9); // 3x3
    
    // temp = H * P
    this.matrixMultiply(this.measurementMatrix, this.state.covariance, temp, 3, 6, 6);
    
    // s = temp * H^T
    this.matrixMultiplyTranspose(temp, this.measurementMatrix, s, 3, 6, 3);
    
    // Add measurement noise: S = S + R
    for (let i = 0; i < 9; i++) {
      s[i] += this.measurementNoiseMatrix[i];
    }

    // Kalman gain: K = P * H^T * S^(-1)
    const sInv = new Float32Array(9);
    this.invertMatrix3x3(s, sInv);
    
    const pht = new Float32Array(18); // 6x3
    const k = new Float32Array(18); // 6x3
    
    // pht = P * H^T
    this.matrixMultiplyTranspose(this.state.covariance, this.measurementMatrix, pht, 6, 6, 3);
    
    // k = pht * sInv
    this.matrixMultiply(pht, sInv, k, 6, 3, 3);

    // Update state: x = x + K * y
    const kInnovation = new Float32Array(6);
    this.matrixVectorMultiply(k, innovation, kInnovation, 6, 3);
    
    for (let i = 0; i < 6; i++) {
      this.state.state[i] += kInnovation[i];
    }

    // Update covariance: P = (I - K * H) * P
    const kh = new Float32Array(36); // 6x6
    const iKh = new Float32Array(36); // 6x6
    
    // kh = K * H
    this.matrixMultiply(k, this.measurementMatrix, kh, 6, 3, 6);
    
    // iKh = I - kh
    for (let i = 0; i < 36; i++) {
      iKh[i] = this.identity[i] - kh[i];
    }
    
    // P = iKh * P
    const newCovariance = new Float32Array(36);
    this.matrixMultiply(iKh, this.state.covariance, newCovariance, 6, 6, 6);
    this.state.covariance.set(newCovariance);
  }

  /**
   * Get current position estimate
   */
  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.state.state[0],
      this.state.state[1],
      this.state.state[2]
    );
  }

  /**
   * Get current velocity estimate
   */
  getVelocity(): THREE.Vector3 {
    return new THREE.Vector3(
      this.state.state[3],
      this.state.state[4],
      this.state.state[5]
    );
  }

  /**
   * Get position uncertainty
   */
  getPositionUncertainty(): number {
    return Math.sqrt(
      this.state.covariance[0] + 
      this.state.covariance[7] + 
      this.state.covariance[14]
    ) / 3;
  }

  /**
   * Reset filter with new position
   */
  reset(position: THREE.Vector3): void {
    this.state.state[0] = position.x;
    this.state.state[1] = position.y;
    this.state.state[2] = position.z;
    this.state.state[3] = 0; // Reset velocity
    this.state.state[4] = 0;
    this.state.state[5] = 0;

    // Reset covariance to identity
    this.state.covariance.fill(0);
    for (let i = 0; i < 6; i++) {
      this.state.covariance[i * 6 + i] = 1.0;
    }
  }

  /**
   * Update state transition matrix with new delta time
   */
  private updateStateTransition(): void {
    const dt = this.state.dt;
    this.stateTransition[3] = dt;
    this.stateTransition[10] = dt;
    this.stateTransition[17] = dt;
  }

  /**
   * Matrix-vector multiplication
   */
  private matrixVectorMultiply(
    matrix: Float32Array, 
    vector: Float32Array, 
    result: Float32Array, 
    rows: number, 
    cols: number
  ): void {
    for (let i = 0; i < rows; i++) {
      result[i] = 0;
      for (let j = 0; j < cols; j++) {
        result[i] += matrix[i * cols + j] * vector[j];
      }
    }
  }

  /**
   * Matrix multiplication
   */
  private matrixMultiply(
    a: Float32Array, 
    b: Float32Array, 
    result: Float32Array, 
    rowsA: number, 
    colsA: number, 
    colsB: number
  ): void {
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        result[i * colsB + j] = 0;
        for (let k = 0; k < colsA; k++) {
          result[i * colsB + j] += a[i * colsA + k] * b[k * colsB + j];
        }
      }
    }
  }

  /**
   * Matrix multiplication with transpose of second matrix
   */
  private matrixMultiplyTranspose(
    a: Float32Array, 
    b: Float32Array, 
    result: Float32Array, 
    rowsA: number, 
    colsA: number, 
    rowsB: number
  ): void {
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < rowsB; j++) {
        result[i * rowsB + j] = 0;
        for (let k = 0; k < colsA; k++) {
          result[i * rowsB + j] += a[i * colsA + k] * b[j * colsA + k];
        }
      }
    }
  }

  /**
   * Invert 3x3 matrix
   */
  private invertMatrix3x3(matrix: Float32Array, result: Float32Array): boolean {
    const det = 
      matrix[0] * (matrix[4] * matrix[8] - matrix[7] * matrix[5]) -
      matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
      matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);

    if (Math.abs(det) < 1e-10) {
      // Matrix is singular, use identity
      result.fill(0);
      result[0] = result[4] = result[8] = 1;
      return false;
    }

    const invDet = 1 / det;

    result[0] = (matrix[4] * matrix[8] - matrix[7] * matrix[5]) * invDet;
    result[1] = (matrix[2] * matrix[7] - matrix[1] * matrix[8]) * invDet;
    result[2] = (matrix[1] * matrix[5] - matrix[2] * matrix[4]) * invDet;
    result[3] = (matrix[5] * matrix[6] - matrix[3] * matrix[8]) * invDet;
    result[4] = (matrix[0] * matrix[8] - matrix[2] * matrix[6]) * invDet;
    result[5] = (matrix[2] * matrix[3] - matrix[0] * matrix[5]) * invDet;
    result[6] = (matrix[3] * matrix[7] - matrix[4] * matrix[6]) * invDet;
    result[7] = (matrix[1] * matrix[6] - matrix[0] * matrix[7]) * invDet;
    result[8] = (matrix[0] * matrix[4] - matrix[1] * matrix[3]) * invDet;

    return true;
  }
}
