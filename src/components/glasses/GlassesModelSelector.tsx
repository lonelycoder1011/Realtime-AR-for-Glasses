'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassesModelData } from '@/types/glasses-models';
import { Loader2, Eye, Palette } from 'lucide-react';

interface GlassesModelSelectorProps {
  models: GlassesModelData[];
  activeModelId: string | null;
  loadingStates: Map<string, boolean>;
  errors: Map<string, string>;
  onSelectModel: (modelId: string) => void;
  onUpdateColors?: (modelId: string, frameColor: string, lensColor: string) => void;
  className?: string;
}

export const GlassesModelSelector: React.FC<GlassesModelSelectorProps> = ({
  models,
  activeModelId,
  loadingStates,
  errors,
  onSelectModel,
  onUpdateColors,
  className,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sunglasses': return 'bg-yellow-500';
      case 'eyeglasses': return 'bg-blue-500';
      case 'reading': return 'bg-green-500';
      case 'safety': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMaterialIcon = (material: string) => {
    switch (material) {
      case 'metal': return '⚡';
      case 'plastic': return '🔧';
      case 'acetate': return '💎';
      case 'titanium': return '🛡️';
      case 'wood': return '🌳';
      default: return '📦';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Glasses Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {models.map((model) => {
            const isActive = activeModelId === model.id;
            const isLoading = loadingStates.get(model.id) || false;
            const error = errors.get(model.id);

            return (
              <div
                key={model.id}
                className={`p-3 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                  isActive 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => !isLoading && onSelectModel(model.id)}
              >
                {/* Model Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMaterialIcon(model.frameMaterial)}</span>
                    <div>
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <p className="text-xs text-gray-500">{model.brand}</p>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : isActive ? (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  ) : null}
                </div>

                {/* Model Details */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs text-white ${getCategoryColor(model.category)}`}
                  >
                    {model.category}
                  </Badge>
                  <span className="text-xs text-gray-500 capitalize">
                    {model.frameMaterial}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {model.lensType}
                  </span>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Frame:</span>
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: model.frameColor }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Lens:</span>
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: model.lensColor }}
                    />
                  </div>
                </div>

                {/* Dimensions */}
                {model.dimensions && (
                  <div className="text-xs text-gray-500 mb-2">
                    {Math.round(model.dimensions.lensWidth * 1000)}mm × {Math.round(model.dimensions.lensHeight * 1000)}mm
                    {' • '}Bridge: {Math.round(model.dimensions.bridgeWidth * 1000)}mm
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-600">
                    ${model.price.toFixed(2)}
                  </span>
                  
                  {onUpdateColors && isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        // For now, just cycle through some preset colors
                        const colors = ['#C0C0C0', '#2C2C2C', '#B8860B', '#FF4500', '#8B4513'];
                        const currentIndex = colors.indexOf(model.frameColor);
                        const nextColor = colors[(currentIndex + 1) % colors.length];
                        onUpdateColors(model.id, nextColor, model.lensColor);
                      }}
                    >
                      <Palette className="h-3 w-3 mr-1" />
                      Color
                    </Button>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>
            );
          })}

          {models.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No glasses models available</p>
              <p className="text-xs">Models will appear here when loaded</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
