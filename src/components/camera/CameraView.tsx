'use client';

import React from 'react';
import { VideoDisplay } from './VideoDisplay';
import { CameraControls } from './CameraControls';
import { useCameraContext } from './CameraProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface CameraViewProps {
  className?: string;
  showControls?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ 
  className = '', 
  showControls = true 
}) => {
  const { state } = useCameraContext();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {state.isActive ? (
              <VideoDisplay />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Camera Not Active</p>
                  <p className="text-sm">Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Controls */}
      {showControls && <CameraControls />}
    </div>
  );
};
