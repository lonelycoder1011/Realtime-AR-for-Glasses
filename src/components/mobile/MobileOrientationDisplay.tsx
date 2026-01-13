'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  RotateCcw, 
  Compass, 
  Activity,
  Settings,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DeviceOrientationManager, OrientationData, MotionData } from '@/lib/mobile/device-orientation-manager';

interface MobileOrientationDisplayProps {
  onOrientationChange?: (orientation: OrientationData) => void;
  onMotionChange?: (motion: MotionData) => void;
  enableAutoCalibration?: boolean;
  showRawData?: boolean;
  className?: string;
}

export const MobileOrientationDisplay: React.FC<MobileOrientationDisplayProps> = ({
  onOrientationChange,
  onMotionChange,
  enableAutoCalibration = true,
  showRawData = false,
  className,
}) => {
  const [orientationManager, setOrientationManager] = useState<DeviceOrientationManager | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentOrientation, setCurrentOrientation] = useState<OrientationData | null>(null);
  const [currentMotion, setCurrentMotion] = useState<MotionData | null>(null);
  const [calibrationStatus, setCalibrationStatus] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const manager = new DeviceOrientationManager({
      enableOrientationTracking: true,
      enableMotionTracking: true,
      smoothingFactor: 0.8,
      calibrationSamples: 30,
      autoCalibrate: enableAutoCalibration,
    });

    setOrientationManager(manager);
    setIsSupported(manager.isOrientationSupported() || manager.isMotionSupported());

    return () => {
      manager.dispose();
    };
  }, [enableAutoCalibration]);

  useEffect(() => {
    if (!orientationManager) return;

    const handleOrientationChange = (orientation: OrientationData) => {
      setCurrentOrientation(orientation);
      if (onOrientationChange) {
        onOrientationChange(orientation);
      }
    };

    const handleMotionChange = (motion: MotionData) => {
      setCurrentMotion(motion);
      if (onMotionChange) {
        onMotionChange(motion);
      }
    };

    orientationManager.onOrientationChange(handleOrientationChange);
    orientationManager.onMotionChange(handleMotionChange);

    return () => {
      orientationManager.offOrientationChange(handleOrientationChange);
      orientationManager.offMotionChange(handleMotionChange);
    };
  }, [orientationManager, onOrientationChange, onMotionChange]);

  const initializeOrientation = async () => {
    if (!orientationManager) return;

    try {
      const success = await orientationManager.initialize();
      setHasPermissions(orientationManager.hasPermissions());
      setIsInitialized(success);
      
      if (success) {
        updateCalibrationStatus();
        updateDeviceInfo();
      }
    } catch (error) {
      console.error('Failed to initialize orientation:', error);
    }
  };

  const updateCalibrationStatus = () => {
    if (orientationManager) {
      setCalibrationStatus(orientationManager.getCalibrationStatus());
    }
  };

  const updateDeviceInfo = () => {
    if (orientationManager) {
      const info = {
        orientation: orientationManager.getScreenOrientation(),
        isPortrait: orientationManager.isPortrait(),
        isLandscape: orientationManager.isLandscape(),
        tiltAngle: orientationManager.getTiltAngle(),
        isStable: orientationManager.isDeviceStable(),
      };
      setDeviceInfo(info);
    }
  };

  const handleCalibrate = async () => {
    if (!orientationManager) return;

    try {
      await orientationManager.calibrate();
      updateCalibrationStatus();
    } catch (error) {
      console.error('Calibration failed:', error);
    }
  };

  const handleResetCalibration = () => {
    if (orientationManager) {
      orientationManager.resetCalibration();
      updateCalibrationStatus();
    }
  };

  const getOrientationIcon = () => {
    if (!deviceInfo) return <Smartphone className="h-4 w-4" />;
    
    if (deviceInfo.isPortrait) {
      return <Smartphone className="h-4 w-4" />;
    } else {
      return <Smartphone className="h-4 w-4 rotate-90" />;
    }
  };

  const getStabilityColor = () => {
    if (!deviceInfo) return 'secondary';
    return deviceInfo.isStable ? 'default' : 'destructive';
  };

  // Update device info periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      updateDeviceInfo();
      updateCalibrationStatus();
    }, 500);

    return () => clearInterval(interval);
  }, [isInitialized]);

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Not Supported</h3>
          <p className="text-sm text-gray-500">
            Device orientation is not supported on this device or browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Initialization Card */}
      {!isInitialized && (
        <Card className="mb-4">
          <CardContent className="p-6 text-center">
            <Compass className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Device Orientation</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enable device orientation to use motion-based features.
            </p>
            <Button onClick={initializeOrientation}>
              <Settings className="h-4 w-4 mr-2" />
              Enable Orientation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orientation Data Card */}
      {isInitialized && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {getOrientationIcon()}
              Device Orientation
              {deviceInfo && (
                <Badge variant={getStabilityColor()}>
                  {deviceInfo.isStable ? 'Stable' : 'Moving'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Current Orientation */}
            {currentOrientation && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Orientation Values</div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {currentOrientation.alpha.toFixed(0)}°
                    </div>
                    <div className="text-xs text-gray-500">Alpha (Z)</div>
                    <div className="text-xs text-gray-400">Compass</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {currentOrientation.beta.toFixed(0)}°
                    </div>
                    <div className="text-xs text-gray-500">Beta (X)</div>
                    <div className="text-xs text-gray-400">Tilt F/B</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {currentOrientation.gamma.toFixed(0)}°
                    </div>
                    <div className="text-xs text-gray-500">Gamma (Y)</div>
                    <div className="text-xs text-gray-400">Tilt L/R</div>
                  </div>
                </div>

                {/* Visual Orientation Indicator */}
                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-16 h-24 bg-blue-500 rounded-lg shadow-lg transition-transform duration-200"
                      style={{
                        transform: `rotateZ(${currentOrientation.alpha}deg) rotateX(${currentOrientation.beta}deg) rotateY(${currentOrientation.gamma}deg)`,
                      }}
                    >
                      <div className="w-full h-2 bg-blue-700 rounded-t-lg"></div>
                    </div>
                  </div>
                  
                  {/* Orientation Labels */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    North
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    South
                  </div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    West
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    East
                  </div>
                </div>
              </div>
            )}

            {/* Device Info */}
            {deviceInfo && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Device Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Orientation:</span>
                    <Badge variant="outline">{deviceInfo.orientation}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tilt Angle:</span>
                    <span>{deviceInfo.tiltAngle.toFixed(1)}°</span>
                  </div>
                </div>
              </div>
            )}

            {/* Motion Data */}
            {currentMotion && showRawData && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Motion Data</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Acceleration X:</span>
                    <span>{currentMotion.acceleration.x.toFixed(2)} m/s²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acceleration Y:</span>
                    <span>{currentMotion.acceleration.y.toFixed(2)} m/s²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acceleration Z:</span>
                    <span>{currentMotion.acceleration.z.toFixed(2)} m/s²</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calibration Card */}
      {isInitialized && calibrationStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Calibration
              {calibrationStatus.isCalibrated ? (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Calibrated
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Calibrated
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!calibrationStatus.isCalibrated && calibrationStatus.samplesCollected > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Calibration Progress:</span>
                  <span>{calibrationStatus.samplesCollected} / {calibrationStatus.samplesNeeded}</span>
                </div>
                <Progress 
                  value={(calibrationStatus.samplesCollected / calibrationStatus.samplesNeeded) * 100} 
                />
              </div>
            )}

            {calibrationStatus.isCalibrated && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Calibration Offset</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-mono">{calibrationStatus.offset.alpha.toFixed(1)}°</div>
                    <div className="text-gray-500">Alpha</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono">{calibrationStatus.offset.beta.toFixed(1)}°</div>
                    <div className="text-gray-500">Beta</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono">{calibrationStatus.offset.gamma.toFixed(1)}°</div>
                    <div className="text-gray-500">Gamma</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalibrate}
                className="flex-1"
              >
                <Target className="h-3 w-3 mr-1" />
                Calibrate
              </Button>
              
              {calibrationStatus.isCalibrated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCalibration}
                  className="flex-1"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
