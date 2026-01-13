'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SimpleTestPage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      console.log('✅ Camera started successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown camera error';
      setError(errorMessage);
      console.error('❌ Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      console.log('🛑 Camera stopped');
    }
  };

  useEffect(() => {
    // Auto-start camera after 2 seconds
    const timer = setTimeout(() => {
      console.log('🚀 Auto-starting camera...');
      startCamera();
    }, 2000);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simple Camera Test
          </h1>
          <p className="text-gray-600">
            Testing basic camera functionality and auto-start feature
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
                  style={{ transform: 'scaleX(-1)', backgroundColor: '#000000' }}
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Camera will auto-start in 2 seconds...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Camera Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Camera Active:</span>
                  {cameraActive ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="h-5 w-5" />
                      <span>Inactive</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Stream Available:</span>
                  {stream ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="h-5 w-5" />
                      <span>No</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {cameraActive && (
                <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Camera Working!</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    ✅ Check for white light indicator on your device
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Camera Error</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Manual Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={startCamera}
                  disabled={cameraActive}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                
                <Button
                  onClick={stopCamera}
                  disabled={!cameraActive}
                  variant="outline"
                  className="flex-1"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Camera should auto-start after 2 seconds</li>
                  <li>• Look for white light indicator on your device</li>
                  <li>• Video should show mirrored camera feed</li>
                  <li>• Use manual controls if auto-start fails</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
