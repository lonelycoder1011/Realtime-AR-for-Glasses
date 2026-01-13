'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFaceDetectionContext } from './FaceDetectionProvider';
import { Activity, Eye, Target, Zap } from 'lucide-react';

interface FaceDetectionStatsProps {
  className?: string;
}

export const FaceDetectionStats: React.FC<FaceDetectionStatsProps> = ({ className }) => {
  const { state, isReady } = useFaceDetectionContext();

  const getStatusColor = () => {
    if (!isReady) return 'destructive';
    if (state.error) return 'destructive';
    if (state.lastDetection) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (!isReady) return 'Initializing';
    if (state.error) return 'Error';
    if (state.lastDetection) return 'Face Detected';
    return 'No Face';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Face Detection Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            FPS
          </span>
          <span className="text-sm font-mono">{state.fps}</span>
        </div>

        {/* Frame Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Frames</span>
          <span className="text-sm font-mono">{state.frameCount}</span>
        </div>

        {/* Face Detection Details */}
        {state.lastDetection && (
          <>
            <hr className="my-2" />
            
            {/* Confidence */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Confidence
              </span>
              <span className="text-sm font-mono">
                {(state.lastDetection.confidence * 100).toFixed(1)}%
              </span>
            </div>

            {/* Eye Distance */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Eye Distance
              </span>
              <span className="text-sm font-mono">
                {state.lastDetection.eyeDistance.toFixed(3)}
              </span>
            </div>

            {/* Face Center */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Face Center</span>
              <span className="text-sm font-mono">
                ({state.lastDetection.faceCenter.x.toFixed(2)}, {state.lastDetection.faceCenter.y.toFixed(2)})
              </span>
            </div>

            {/* Bounding Box */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Face Size</span>
              <span className="text-sm font-mono">
                {(state.lastDetection.boundingBox.width * 100).toFixed(1)}% × {(state.lastDetection.boundingBox.height * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {state.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
