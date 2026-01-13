'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCameraContext } from './CameraProvider';
import { Camera, CameraOff, Settings, AlertCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CameraControlsProps {
  className?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({ className }) => {
  const { state, startCamera, stopCamera, switchDevice, requestPermission } = useCameraContext();

  const handleStartCamera = async () => {
    if (!state.hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await startCamera();
  };

  const handleDeviceChange = async (deviceId: string) => {
    await switchDevice(deviceId);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Permission Request */}
        {!state.hasPermission && state.permissionState !== 'granted' && (
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Camera access is required for the AR try-on experience. 
              Click "Allow Camera" to grant permission.
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!state.isActive ? (
            <Button 
              onClick={handleStartCamera}
              disabled={state.isLoading}
              className="flex-1"
            >
              {state.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {state.isLoading ? 'Starting Camera...' : 'Start Camera'}
            </Button>
          ) : (
            <Button 
              onClick={stopCamera}
              variant="outline"
              className="flex-1"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
          )}

          {/* Device Selection */}
          {state.devices.length > 1 && (
            <Select
              value={state.selectedDeviceId || ''}
              onValueChange={handleDeviceChange}
              disabled={!state.hasPermission}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Settings className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Camera" />
              </SelectTrigger>
              <SelectContent>
                {state.devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Camera Status */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Status: {state.isActive ? 'Active' : state.isLoading ? 'Loading...' : 'Inactive'}
          </span>
          {state.isActive && (
            <span>
              {state.constraints.width}x{state.constraints.height} @ {state.constraints.frameRate}fps
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
