'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlassesModel3D } from '@/types/glasses-models';
import { Box, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GlassesModelStatsProps {
  activeModel: GlassesModel3D | null;
  totalModels: number;
  loadingCount: number;
  errorCount: number;
  loadingProgress: number;
  className?: string;
}

export const GlassesModelStats: React.FC<GlassesModelStatsProps> = ({
  activeModel,
  totalModels,
  loadingCount,
  errorCount,
  loadingProgress,
  className,
}) => {
  const getLoadingStatus = () => {
    if (loadingCount > 0) return 'loading';
    if (errorCount > 0) return 'error';
    if (totalModels > 0) return 'loaded';
    return 'empty';
  };

  const getStatusColor = () => {
    switch (getLoadingStatus()) {
      case 'loading': return 'secondary';
      case 'error': return 'destructive';
      case 'loaded': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = () => {
    switch (getLoadingStatus()) {
      case 'loading': return `Loading (${loadingCount})`;
      case 'error': return `Errors (${errorCount})`;
      case 'loaded': return 'Ready';
      default: return 'No Models';
    }
  };

  const getStatusIcon = () => {
    switch (getLoadingStatus()) {
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'loaded': return <CheckCircle className="h-4 w-4" />;
      default: return <Box className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Box className="h-4 w-4" />
          3D Model Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {/* Model Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Models</span>
          <span className="text-sm font-mono">{totalModels}</span>
        </div>

        {/* Loading Progress */}
        {loadingCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-mono">{Math.round(loadingProgress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Model Info */}
        {activeModel && (
          <>
            <hr className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Box className="h-3 w-3" />
                Active Model
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{activeModel.data.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Brand:</span>
                  <span>{activeModel.data.brand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Material:</span>
                  <span className="capitalize">{activeModel.data.frameMaterial}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="capitalize">{activeModel.data.category}</span>
                </div>
              </div>

              {/* Model Dimensions */}
              <div className="space-y-1 text-xs">
                <div className="text-gray-500 font-medium">Dimensions:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-gray-500">Lens:</span>
                    <span className="ml-1">{Math.round(activeModel.data.dimensions.lensWidth * 1000)}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Bridge:</span>
                    <span className="ml-1">{Math.round(activeModel.data.dimensions.bridgeWidth * 1000)}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Temple:</span>
                    <span className="ml-1">{Math.round(activeModel.data.dimensions.templeLength * 1000)}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Width:</span>
                    <span className="ml-1">{Math.round(activeModel.data.dimensions.frameWidth * 1000)}mm</span>
                  </div>
                </div>
              </div>

              {/* Model Performance */}
              <div className="space-y-1 text-xs">
                <div className="text-gray-500 font-medium">Performance:</div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vertices:</span>
                  <span className="font-mono">
                    {activeModel.mesh.children.reduce((total, child) => {
                      if (child instanceof THREE.Mesh && child.geometry) {
                        const positions = child.geometry.attributes.position;
                        return total + (positions ? positions.count : 0);
                      }
                      return total;
                    }, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Components:</span>
                  <span className="font-mono">{activeModel.mesh.children.length}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Summary */}
        {errorCount > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
              <AlertCircle className="h-3 w-3" />
              {errorCount} model{errorCount > 1 ? 's' : ''} failed to load
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
