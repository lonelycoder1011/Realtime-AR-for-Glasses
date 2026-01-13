'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  SwitchCamera, 
  Zap, 
  ZapOff,
  Maximize,
  Minimize,
  Settings,
  AlertCircle,
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { MobileCameraOptimizer, MobileDeviceInfo } from '@/lib/mobile/mobile-camera-optimizer';

interface MobileCameraInterfaceProps {
  onCameraStream?: (stream: MediaStream) => void;
  onCameraError?: (error: Error) => void;
  enableTorch?: boolean;
  enableZoom?: boolean;
  enableCameraSwitch?: boolean;
  showDeviceInfo?: boolean;
  className?: string;
}

export const MobileCameraInterface: React.FC<MobileCameraInterfaceProps> = ({
  onCameraStream,
  onCameraError,
  enableTorch = true,
  enableZoom = true,
  enableCameraSwitch = true,
  showDeviceInfo = true,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraOptimizerRef = useRef<MobileCameraOptimizer | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo | null>(null);
  const [cameraSettings, setCameraSettings] = useState<any>(null);
  const [cameraCapabilities, setCameraCapabilities] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Initialize camera optimizer
    cameraOptimizerRef.current = new MobileCameraOptimizer({
      preferredResolution: { width: 640, height: 480 },
      maxResolution: { width: 1280, height: 720 },
      minResolution: { width: 320, height: 240 },
      frameRate: 30,
      facingMode: 'user',
      enableAutoFocus: true,
      enableTorch: enableTorch,
      enableZoom: enableZoom,
      optimizeForPerformance: true,
    });

    const optimizer = cameraOptimizerRef.current;
    setDeviceInfo(optimizer.getDeviceInfo());
    setIsInitialized(true);

    return () => {
      if (optimizer) {
        optimizer.dispose();
      }
    };
  }, [enableTorch, enableZoom]);

  const initializeCamera = async () => {
    if (!cameraOptimizerRef.current || !videoRef.current) return;

    try {
      setError(null);
      const stream = await cameraOptimizerRef.current.initializeCamera(videoRef.current);
      
      setCurrentStream(stream);
      setIsActive(true);
      
      // Update camera info
      updateCameraInfo();
      
      if (onCameraStream) {
        onCameraStream(stream);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Camera initialization failed');
      setError(error.message);
      setIsActive(false);
      
      if (onCameraError) {
        onCameraError(error);
      }
    }
  };

  const updateCameraInfo = () => {
    if (!cameraOptimizerRef.current) return;

    const settings = cameraOptimizerRef.current.getCameraSettings();
    const capabilities = cameraOptimizerRef.current.getCameraCapabilities();
    
    setCameraSettings(settings);
    setCameraCapabilities(capabilities);
  };

  const stopCamera = () => {
    if (cameraOptimizerRef.current) {
      cameraOptimizerRef.current.stop();
      setCurrentStream(null);
      setIsActive(false);
    }
  };

  const switchCamera = async () => {
    if (!cameraOptimizerRef.current || !enableCameraSwitch) return;

    try {
      setError(null);
      const stream = await cameraOptimizerRef.current.switchCamera();
      
      setCurrentStream(stream);
      setFacingMode(facingMode === 'user' ? 'environment' : 'user');
      
      // Update camera info
      updateCameraInfo();
      
      if (onCameraStream) {
        onCameraStream(stream);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Camera switch failed');
      setError(error.message);
      
      if (onCameraError) {
        onCameraError(error);
      }
    }
  };

  const toggleTorch = async () => {
    if (!cameraOptimizerRef.current || !enableTorch) return;

    try {
      const newTorchState = !torchEnabled;
      await cameraOptimizerRef.current.setTorch(newTorchState);
      setTorchEnabled(newTorchState);
    } catch (err) {
      console.warn('Torch control failed:', err);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    if (!cameraOptimizerRef.current || !enableZoom) return;

    try {
      await cameraOptimizerRef.current.setZoom(newZoom);
      setZoomLevel(newZoom);
    } catch (err) {
      console.warn('Zoom control failed:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  const getDeviceTypeIcon = () => {
    if (!deviceInfo) return <Smartphone className="h-4 w-4" />;
    
    if (deviceInfo.isTablet) {
      return <Smartphone className="h-4 w-4 scale-125" />;
    } else if (deviceInfo.isMobile) {
      return <Smartphone className="h-4 w-4" />;
    } else {
      return <Smartphone className="h-4 w-4 rotate-90" />;
    }
  };

  const getResolutionText = () => {
    if (!cameraSettings) return 'Unknown';
    return `${cameraSettings.width}×${cameraSettings.height}`;
  };

  const getFrameRateText = () => {
    if (!cameraSettings) return 'Unknown';
    return `${cameraSettings.frameRate || 30} FPS`;
  };

  return (
    <div className={className}>
      {/* Camera Video */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Mobile Camera
              {isActive ? (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Camera Off
                </Badge>
              )}
            </div>
            
            {isActive && (
              <div className="flex gap-1">
                {enableCameraSwitch && (
                  <Button variant="outline" size="sm" onClick={switchCamera}>
                    <SwitchCamera className="h-3 w-3" />
                  </Button>
                )}
                
                {enableTorch && cameraCapabilities?.torch && (
                  <Button 
                    variant={torchEnabled ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleTorch}
                  >
                    {torchEnabled ? <Zap className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
                  </Button>
                )}
                
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm mb-4">Camera not active</p>
                  <Button onClick={initializeCamera}>
                    Start Camera
                  </Button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
                <div className="text-center text-white p-4">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-sm mb-4">{error}</p>
                  <Button variant="outline" onClick={initializeCamera}>
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {/* Camera Controls Overlay */}
            {isActive && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {facingMode === 'user' ? 'Front' : 'Back'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getResolutionText()}
                    </Badge>
                  </div>
                  
                  {enableZoom && cameraCapabilities?.zoom && (
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs">Zoom:</span>
                      <input
                        type="range"
                        min={cameraCapabilities.zoom?.min || 1}
                        max={cameraCapabilities.zoom?.max || 3}
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-16"
                      />
                      <span className="text-white text-xs">{zoomLevel.toFixed(1)}x</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {isActive && (
            <div className="flex justify-center mt-4">
              <Button variant="destructive" onClick={stopCamera}>
                Stop Camera
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Information */}
      {showDeviceInfo && deviceInfo && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {getDeviceTypeIcon()}
              Device Information
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Device Type:</span>
                  <Badge variant="outline">
                    {deviceInfo.isTablet ? 'Tablet' : deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <Badge variant="outline">
                    {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Other'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Browser:</span>
                  <span>{deviceInfo.browserName} {deviceInfo.browserVersion}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Screen Size:</span>
                  <span>{deviceInfo.screenWidth}×{deviceInfo.screenHeight}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Pixel Ratio:</span>
                  <span>{deviceInfo.devicePixelRatio}x</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <Badge variant="outline">{deviceInfo.orientation}</Badge>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs font-medium mb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={deviceInfo.hasGyroscope ? "default" : "secondary"} className="text-xs">
                  Gyroscope
                </Badge>
                <Badge variant={deviceInfo.hasAccelerometer ? "default" : "secondary"} className="text-xs">
                  Accelerometer
                </Badge>
                <Badge variant={deviceInfo.hasTouchScreen ? "default" : "secondary"} className="text-xs">
                  Touch Screen
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Settings */}
      {isActive && cameraSettings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Camera Settings
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span>{getResolutionText()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Frame Rate:</span>
                  <span>{getFrameRateText()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Facing Mode:</span>
                  <span>{cameraSettings.facingMode || facingMode}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {cameraCapabilities && (
                  <>
                    {cameraCapabilities.torch && (
                      <div className="flex justify-between">
                        <span>Torch:</span>
                        <Badge variant={torchEnabled ? "default" : "secondary"}>
                          {torchEnabled ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    )}
                    
                    {cameraCapabilities.zoom && (
                      <div className="flex justify-between">
                        <span>Zoom:</span>
                        <span>{zoomLevel.toFixed(1)}x</span>
                      </div>
                    )}
                    
                    {cameraCapabilities.focusMode && (
                      <div className="flex justify-between">
                        <span>Focus:</span>
                        <span>{cameraCapabilities.focusMode}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
