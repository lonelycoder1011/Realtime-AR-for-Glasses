'use client';

import React, { useEffect, useRef } from 'react';
import { CameraProvider, useCameraContext } from '@/components/camera';
import { AutoStartCamera } from '@/components/camera/AutoStartCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, CheckCircle, XCircle } from 'lucide-react';

const CameraTestContent: React.FC = () => {
  const { state, startCamera, stopCamera, requestPermission } = useCameraContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && state.stream) {
      video.srcObject = state.stream;
    }
  }, [state.stream]);

  const handleStartCamera = async () => {
    try {
      if (!state.hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }
      await startCamera();
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Camera Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test camera functionality and verify white light indicator
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!state.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Camera Status & Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Camera Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Camera Active:</span>
                  {state.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Permission Granted:</span>
                  {state.hasPermission ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Loading:</span>
                  {state.isLoading ? (
                    <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Stream Available:</span>
                  {state.stream ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {/* Error Display */}
              {state.error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm">{state.error}</p>
                </div>
              )}

              {/* Camera Info */}
              {state.stream && (
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ Camera is active! Check for white light indicator on your device.
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handleStartCamera}
                  disabled={state.isActive || state.isLoading}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                
                <Button
                  onClick={stopCamera}
                  disabled={!state.isActive}
                  variant="outline"
                  className="flex-1"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              </div>

              {/* Device Info */}
              {state.devices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Available Cameras:</h4>
                  <ul className="text-sm space-y-1">
                    {state.devices.map((device, index) => (
                      <li key={device.deviceId} className="flex items-center gap-2">
                        <Camera className="h-3 w-3" />
                        {device.label || `Camera ${index + 1}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function CameraTestPage() {
  return (
    <CameraProvider>
      <AutoStartCamera>
        <CameraTestContent />
      </AutoStartCamera>
    </CameraProvider>
  );
}
