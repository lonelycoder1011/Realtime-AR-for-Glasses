'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadPose, FaceGeometry, MappingQuality } from '@/types/coordinate-mapping';
import { Crosshair, Ruler, RotateCcw, TrendingUp } from 'lucide-react';

interface CoordinateMappingStatsProps {
  headPose: HeadPose | null;
  faceGeometry: FaceGeometry | null;
  quality: MappingQuality | null;
  isActive: boolean;
  className?: string;
}

export const CoordinateMappingStats: React.FC<CoordinateMappingStatsProps> = ({
  headPose,
  faceGeometry,
  quality,
  isActive,
  className,
}) => {
  const getQualityColor = (value: number) => {
    if (value > 0.8) return 'default';
    if (value > 0.6) return 'secondary';
    return 'destructive';
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactive';
    if (!headPose) return 'No Tracking';
    if (quality && quality.trackingLoss > 0.5) return 'Tracking Lost';
    return 'Active';
  };

  const getStatusColor = () => {
    if (!isActive) return 'secondary';
    if (!headPose) return 'destructive';
    if (quality && quality.trackingLoss > 0.5) return 'destructive';
    return 'default';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Crosshair className="h-4 w-4" />
          Coordinate Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
        </div>

        {/* Head Pose Information */}
        {headPose && (
          <>
            <hr className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <RotateCcw className="h-3 w-3" />
                Head Pose
              </div>
              
              {/* Position */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">X:</span>
                  <span className="ml-1 font-mono">{headPose.position.x.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Y:</span>
                  <span className="ml-1 font-mono">{headPose.position.y.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Z:</span>
                  <span className="ml-1 font-mono">{headPose.position.z.toFixed(3)}</span>
                </div>
              </div>

              {/* Rotation */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Pitch:</span>
                  <span className="ml-1 font-mono">{(headPose.rotation.x * 180/Math.PI).toFixed(1)}°</span>
                </div>
                <div>
                  <span className="text-gray-500">Yaw:</span>
                  <span className="ml-1 font-mono">{(headPose.rotation.y * 180/Math.PI).toFixed(1)}°</span>
                </div>
                <div>
                  <span className="text-gray-500">Roll:</span>
                  <span className="ml-1 font-mono">{(headPose.rotation.z * 180/Math.PI).toFixed(1)}°</span>
                </div>
              </div>

              {/* Scale */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Scale:</span>
                <span className="font-mono">{headPose.scale.toFixed(3)}</span>
              </div>
            </div>
          </>
        )}

        {/* Face Geometry */}
        {faceGeometry && (
          <>
            <hr className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Ruler className="h-3 w-3" />
                Face Measurements
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Eye Distance:</span>
                  <span className="font-mono">{(faceGeometry.eyeDistance * 1000).toFixed(1)}mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Face Width:</span>
                  <span className="font-mono">{(faceGeometry.faceWidth * 1000).toFixed(1)}mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Face Height:</span>
                  <span className="font-mono">{(faceGeometry.faceHeight * 1000).toFixed(1)}mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nose Length:</span>
                  <span className="font-mono">{(faceGeometry.noseLength * 1000).toFixed(1)}mm</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quality Metrics */}
        {quality && (
          <>
            <hr className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <TrendingUp className="h-3 w-3" />
                Quality Metrics
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <Badge variant={getQualityColor(quality.confidence)} className="text-xs">
                    {(quality.confidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Stability:</span>
                  <Badge variant={getQualityColor(quality.stability)} className="text-xs">
                    {(quality.stability * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Accuracy:</span>
                  <Badge variant={getQualityColor(quality.accuracy)} className="text-xs">
                    {(quality.accuracy * 100).toFixed(1)}%
                  </Badge>
                </div>
                
                {/* Overall Quality Bar */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Overall Quality</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        quality.confidence > 0.8 ? 'bg-green-500' : 
                        quality.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100, quality.confidence * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Data Message */}
        {!headPose && !faceGeometry && !quality && isActive && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">
              Waiting for face detection...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
