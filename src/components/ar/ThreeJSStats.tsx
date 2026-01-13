'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RenderStats } from '@/types/three-scene';
import { Activity, Zap, Triangle, Image, Cpu } from 'lucide-react';

interface ThreeJSStatsProps {
  stats: RenderStats;
  isRendering: boolean;
  className?: string;
}

export const ThreeJSStats: React.FC<ThreeJSStatsProps> = ({ 
  stats, 
  isRendering, 
  className 
}) => {
  const getStatusColor = () => {
    if (!isRendering) return 'secondary';
    if (stats.fps < 20) return 'destructive';
    if (stats.fps < 30) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (!isRendering) return 'Stopped';
    if (stats.fps < 20) return 'Low FPS';
    return 'Running';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          3D Rendering Stats
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
          <span className="text-sm font-mono">{stats.fps}</span>
        </div>

        {/* Render Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Render Time</span>
          <span className="text-sm font-mono">{stats.renderTime.toFixed(2)}ms</span>
        </div>

        {/* Frame Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Frames</span>
          <span className="text-sm font-mono">{stats.frameCount}</span>
        </div>

        {/* Geometry Stats */}
        {isRendering && (
          <>
            <hr className="my-2" />
            
            {/* Triangles */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Triangle className="h-3 w-3" />
                Triangles
              </span>
              <span className="text-sm font-mono">{stats.triangles.toLocaleString()}</span>
            </div>

            {/* Geometries */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Geometries</span>
              <span className="text-sm font-mono">{stats.geometries}</span>
            </div>

            {/* Textures */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Image className="h-3 w-3" />
                Textures
              </span>
              <span className="text-sm font-mono">{stats.textures}</span>
            </div>

            {/* Programs */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Programs
              </span>
              <span className="text-sm font-mono">{stats.programs}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
