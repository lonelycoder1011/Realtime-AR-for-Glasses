// Camera-specific types and interfaces

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface CameraConstraints {
  width: number;
  height: number;
  frameRate: number;
  facingMode: 'user' | 'environment';
  deviceId?: string;
}

export interface CameraState {
  isActive: boolean;
  isLoading: boolean;
  stream: MediaStream | null;
  error: string | null;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  constraints: CameraConstraints;
  hasPermission: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export interface CameraContextType {
  state: CameraState;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  updateConstraints: (constraints: Partial<CameraConstraints>) => void;
}

export type CameraError = 
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'CONSTRAINT_NOT_SATISFIED'
  | 'OVERCONSTRAINED'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN_ERROR';

export interface CameraErrorInfo {
  type: CameraError;
  message: string;
  details?: string;
}
