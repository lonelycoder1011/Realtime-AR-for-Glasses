'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MobileGestureControls, 
  MobileOrientationDisplay, 
  MobileCameraInterface 
} from '@/components/mobile';
import { 
  Smartphone, 
  Camera, 
  Hand, 
  Compass, 
  ArrowLeft,
  Settings,
  Zap,
  TestTube
} from 'lucide-react';
import Link from 'next/link';

export default function MobilePage() {
  const [activeTab, setActiveTab] = useState('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [gestureData, setGestureData] = useState<any>(null);
  const [orientationData, setOrientationData] = useState<any>(null);

  const handleCameraStream = (stream: MediaStream) => {
    setCameraStream(stream);
    console.log('Camera stream received:', stream);
  };

  const handleCameraError = (error: Error) => {
    console.error('Camera error:', error);
  };

  const handlePinchZoom = (scale: number, center: { x: number; y: number }) => {
    setGestureData({
      type: 'pinch',
      scale: scale.toFixed(2),
      center: `${Math.round(center.x)}, ${Math.round(center.y)}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleSwipe = (direction: string, distance: number) => {
    setGestureData({
      type: 'swipe',
      direction,
      distance: Math.round(distance),
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleTap = (x: number, y: number) => {
    setGestureData({
      type: 'tap',
      position: `${Math.round(x)}, ${Math.round(y)}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleDoubleTap = (x: number, y: number) => {
    setGestureData({
      type: 'doubletap',
      position: `${Math.round(x)}, ${Math.round(y)}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handlePan = (deltaX: number, deltaY: number) => {
    setGestureData({
      type: 'pan',
      delta: `${Math.round(deltaX)}, ${Math.round(deltaY)}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleRotate = (angle: number, center: { x: number; y: number }) => {
    setGestureData({
      type: 'rotate',
      angle: `${(angle * 180 / Math.PI).toFixed(1)}°`,
      center: `${Math.round(center.x)}, ${Math.round(center.y)}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleOrientationChange = (orientation: any) => {
    setOrientationData({
      alpha: orientation.alpha.toFixed(1),
      beta: orientation.beta.toFixed(1),
      gamma: orientation.gamma.toFixed(1),
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleMotionChange = (motion: any) => {
    console.log('Motion data:', motion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="h-8 w-8" />
                Mobile Optimization
              </h1>
            </div>
            <Badge variant="default" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              Testing Suite
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Test and optimize mobile features including camera handling, touch gestures, and device orientation
          </p>
        </div>

        {/* Mobile Features Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="gestures" className="flex items-center gap-2">
              <Hand className="h-4 w-4" />
              Gestures
            </TabsTrigger>
            <TabsTrigger value="orientation" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Orientation
            </TabsTrigger>
          </TabsList>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MobileCameraInterface
                  onCameraStream={handleCameraStream}
                  onCameraError={handleCameraError}
                  enableTorch={true}
                  enableZoom={true}
                  enableCameraSwitch={true}
                  showDeviceInfo={true}
                />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Camera Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Stream Active:</span>
                        <Badge variant={cameraStream ? "default" : "secondary"}>
                          {cameraStream ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {cameraStream && (
                        <>
                          <div className="flex justify-between">
                            <span>Tracks:</span>
                            <span>{cameraStream.getTracks().length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Video Tracks:</span>
                            <span>{cameraStream.getVideoTracks().length}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Mobile Camera Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <li>• <strong>Auto Resolution:</strong> Adaptive quality based on device</li>
                      <li>• <strong>Performance Mode:</strong> Optimized for mobile GPUs</li>
                      <li>• <strong>Orientation Handling:</strong> Portrait/landscape support</li>
                      <li>• <strong>Camera Switching:</strong> Front/back camera toggle</li>
                      <li>• <strong>Torch Control:</strong> Flashlight on supported devices</li>
                      <li>• <strong>Zoom Control:</strong> Digital zoom with gestures</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Gestures Tab */}
          <TabsContent value="gestures" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MobileGestureControls
                  onPinchZoom={handlePinchZoom}
                  onSwipe={handleSwipe}
                  onTap={handleTap}
                  onDoubleTap={handleDoubleTap}
                  onPan={handlePan}
                  onRotate={handleRotate}
                  enablePinchZoom={true}
                  enableSwipeGestures={true}
                  enableTapGestures={true}
                  enableRotationGestures={true}
                  enablePanGestures={true}
                  showInstructions={true}
                />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Last Gesture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gestureData ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <Badge variant="default">{gestureData.type}</Badge>
                        </div>
                        {Object.entries(gestureData).map(([key, value]) => {
                          if (key === 'type') return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="font-mono">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No gestures detected yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Gesture Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <li>• <strong>Pinch to Zoom:</strong> Scale glasses with two fingers</li>
                      <li>• <strong>Swipe Navigation:</strong> Switch between models</li>
                      <li>• <strong>Tap Selection:</strong> Select glasses or UI elements</li>
                      <li>• <strong>Double Tap:</strong> Quick actions and shortcuts</li>
                      <li>• <strong>Pan Adjustment:</strong> Move glasses position</li>
                      <li>• <strong>Rotation:</strong> Rotate glasses with two fingers</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Orientation Tab */}
          <TabsContent value="orientation" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MobileOrientationDisplay
                  onOrientationChange={handleOrientationChange}
                  onMotionChange={handleMotionChange}
                  enableAutoCalibration={true}
                  showRawData={true}
                />
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Orientation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orientationData ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Alpha (Z):</span>
                          <span className="font-mono">{orientationData.alpha}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Beta (X):</span>
                          <span className="font-mono">{orientationData.beta}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gamma (Y):</span>
                          <span className="font-mono">{orientationData.gamma}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Updated:</span>
                          <span className="font-mono">{orientationData.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No orientation data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Orientation Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <li>• <strong>Auto Calibration:</strong> Automatic orientation calibration</li>
                      <li>• <strong>Motion Smoothing:</strong> Filtered orientation data</li>
                      <li>• <strong>Stability Detection:</strong> Detect device movement</li>
                      <li>• <strong>Portrait/Landscape:</strong> Orientation change handling</li>
                      <li>• <strong>Tilt Compensation:</strong> Compensate for device tilt</li>
                      <li>• <strong>Gyroscope Data:</strong> High-precision motion tracking</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Mobile Optimization Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Mobile Optimization Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Camera Optimization
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Adaptive resolution based on device capabilities</li>
                  <li>✓ Performance-optimized frame rates</li>
                  <li>✓ Automatic orientation handling</li>
                  <li>✓ Hardware acceleration support</li>
                  <li>✓ Battery-conscious rendering modes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  Touch Gestures
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Multi-touch gesture recognition</li>
                  <li>✓ Configurable sensitivity settings</li>
                  <li>✓ Gesture conflict resolution</li>
                  <li>✓ Touch event optimization</li>
                  <li>✓ Responsive gesture feedback</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  Device Orientation
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>✓ Gyroscope and accelerometer integration</li>
                  <li>✓ Automatic calibration system</li>
                  <li>✓ Motion smoothing and filtering</li>
                  <li>✓ Orientation change detection</li>
                  <li>✓ Stability and tilt analysis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
