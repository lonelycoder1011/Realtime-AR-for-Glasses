'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceMetrics } from '@/types/performance-optimization';
import { Activity, Clock, Zap, MemoryStick, Eye } from 'lucide-react';

interface PerformanceStatsProps {
  metrics: PerformanceMetrics | null;
  lodStats?: {
    totalObjects: number;
    activeLevel0: number;
    activeLevel1: number;
    activeLevel2: number;
    averageDistance: number;
  } | null;
  qualityStats?: {
    currentQualityLevel: number;
    targetFps: number;
    actualFps: number;
    adaptiveQualityEnabled: boolean;
  } | null;
  className?: string;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  metrics,
  lodStats,
  qualityStats,
  className,
}) => {
  const getPerformanceStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'secondary' };
    
    const fps = metrics.averageFps;
    if (fps >= 55) return { status: 'excellent', color: 'default' };
    if (fps >= 45) return { status: 'good', color: 'secondary' };
    if (fps >= 30) return { status: 'fair', color: 'destructive' };
    return { status: 'poor', color: 'destructive' };
  };

  const getMemoryStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'secondary' };
    
    const memoryMB = metrics.memoryUsage.total / 1024 / 1024;
    if (memoryMB < 50) return { status: 'low', color: 'default' };
    if (memoryMB < 100) return { status: 'medium', color: 'secondary' };
    return { status: 'high', color: 'destructive' };
  };

  const performanceStatus = getPerformanceStatus();
  const memoryStatus = getMemoryStatus();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Performance Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Status</span>
          <Badge variant={performanceStatus.color as any}>
            {performanceStatus.status.toUpperCase()}
          </Badge>
        </div>

        {metrics && (
          <>
            {/* Frame Rate Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Zap className="h-3 w-3" />
                Frame Rate
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-mono text-lg">{metrics.fps.toFixed(0)}</div>
                  <div className="text-gray-500">Current FPS</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-lg">{metrics.averageFps.toFixed(0)}</div>
                  <div className="text-gray-500">Average FPS</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-lg">{metrics.frameTime.toFixed(0)}</div>
                  <div className="text-gray-500">Frame Time (ms)</div>
                </div>
              </div>

              {/* FPS Range */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Min: {metrics.minFps === Infinity ? 0 : metrics.minFps.toFixed(0)}</span>
                <span>Max: {metrics.maxFps.toFixed(0)}</span>
              </div>
            </div>

            {/* Rendering Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Eye className="h-3 w-3" />
                Rendering
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Draw Calls:</span>
                  <span className="font-mono">{metrics.drawCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Triangles:</span>
                  <span className="font-mono">{metrics.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vertices:</span>
                  <span className="font-mono">{metrics.vertices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Programs:</span>
                  <span className="font-mono">{metrics.programs}</span>
                </div>
              </div>
            </div>

            {/* Memory Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <MemoryStick className="h-3 w-3" />
                  Memory Usage
                </div>
                <Badge variant={memoryStatus.color as any} className="text-xs">
                  {memoryStatus.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Geometries:</span>
                  <span className="font-mono">{(metrics.memoryUsage.geometries / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Textures:</span>
                  <span className="font-mono">{(metrics.memoryUsage.textures / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Programs:</span>
                  <span className="font-mono">{(metrics.memoryUsage.programs / 1024).toFixed(1)}KB</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span className="text-gray-700">Total:</span>
                  <span className="font-mono">{(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              </div>
            </div>

            {/* Processing Times Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Clock className="h-3 w-3" />
                Processing Times
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Face Detection:</span>
                  <span className="font-mono">{metrics.faceDetectionTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coordinate Mapping:</span>
                  <span className="font-mono">{metrics.coordinateMappingTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Positioning:</span>
                  <span className="font-mono">{metrics.positioningTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rendering:</span>
                  <span className="font-mono">{metrics.renderingTime.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* LOD Statistics */}
        {lodStats && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">LOD Statistics</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Objects:</span>
                <span className="font-mono">{lodStats.totalObjects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">High Detail:</span>
                <span className="font-mono">{lodStats.activeLevel0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Medium Detail:</span>
                <span className="font-mono">{lodStats.activeLevel1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Low Detail:</span>
                <span className="font-mono">{lodStats.activeLevel2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Distance:</span>
                <span className="font-mono">{lodStats.averageDistance.toFixed(1)}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Quality Statistics */}
        {qualityStats && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Quality Statistics</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Quality Level:</span>
                <span className="font-mono">{qualityStats.currentQualityLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Target FPS:</span>
                <span className="font-mono">{qualityStats.targetFps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual FPS:</span>
                <span className="font-mono">{qualityStats.actualFps.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Adaptive Quality:</span>
                <Badge variant={qualityStats.adaptiveQualityEnabled ? 'default' : 'secondary'} className="text-xs">
                  {qualityStats.adaptiveQualityEnabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!metrics && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">
              Performance monitoring not active
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
