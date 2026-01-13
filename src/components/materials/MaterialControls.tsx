'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  PBRMaterialProperties, 
  MaterialPreset, 
  LensPreset,
  FRAME_MATERIAL_PRESETS,
  LENS_MATERIAL_PRESETS 
} from '@/types/lighting-materials';
import { Palette, Sparkles, Eye, Settings } from 'lucide-react';

interface MaterialControlsProps {
  frameProperties: PBRMaterialProperties;
  lensProperties: PBRMaterialProperties;
  onFramePropertiesChange: (properties: Partial<PBRMaterialProperties>) => void;
  onLensPropertiesChange: (properties: Partial<PBRMaterialProperties>) => void;
  onFramePresetChange: (presetId: string) => void;
  onLensPresetChange: (presetId: string) => void;
  className?: string;
}

export const MaterialControls: React.FC<MaterialControlsProps> = ({
  frameProperties,
  lensProperties,
  onFramePropertiesChange,
  onLensPropertiesChange,
  onFramePresetChange,
  onLensPresetChange,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'lens'>('frame');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'metal': return 'bg-gray-500';
      case 'plastic': return 'bg-blue-500';
      case 'acetate': return 'bg-amber-500';
      case 'titanium': return 'bg-slate-500';
      case 'wood': return 'bg-amber-700';
      case 'carbon': return 'bg-gray-900';
      default: return 'bg-gray-400';
    }
  };

  const getLensCategoryColor = (category: string) => {
    switch (category) {
      case 'clear': return 'bg-gray-100';
      case 'tinted': return 'bg-gray-600';
      case 'polarized': return 'bg-blue-600';
      case 'photochromic': return 'bg-purple-500';
      case 'blue-light': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4" />
          Material Properties
        </CardTitle>
        
        {/* Tab Selection */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={activeTab === 'frame' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('frame')}
            className="flex-1"
          >
            Frame
          </Button>
          <Button
            variant={activeTab === 'lens' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('lens')}
            className="flex-1"
          >
            Lens
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Frame Materials */}
        {activeTab === 'frame' && (
          <>
            {/* Frame Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Frame Material</label>
              <div className="grid grid-cols-1 gap-2">
                {FRAME_MATERIAL_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onFramePresetChange(preset.id)}
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.thumbnailColor }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{preset.name}</div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs text-white ${getCategoryColor(preset.category)}`}
                      >
                        {preset.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frame Properties */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Settings className="h-3 w-3" />
                Properties
              </div>
              
              {/* Color */}
              <div>
                <label className="text-xs text-gray-600">Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={frameProperties.color}
                    onChange={(e) => onFramePropertiesChange({ color: e.target.value })}
                    className="w-8 h-8 rounded border"
                  />
                  <span className="text-xs font-mono">{frameProperties.color}</span>
                </div>
              </div>

              {/* Metalness */}
              <div>
                <label className="text-xs text-gray-600">Metalness ({Math.round(frameProperties.metalness * 100)}%)</label>
                <Slider
                  value={[frameProperties.metalness]}
                  onValueChange={([value]) => onFramePropertiesChange({ metalness: value })}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-1"
                />
              </div>

              {/* Roughness */}
              <div>
                <label className="text-xs text-gray-600">Roughness ({Math.round(frameProperties.roughness * 100)}%)</label>
                <Slider
                  value={[frameProperties.roughness]}
                  onValueChange={([value]) => onFramePropertiesChange({ roughness: value })}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-1"
                />
              </div>

              {/* Clearcoat */}
              <div>
                <label className="text-xs text-gray-600">Clearcoat ({Math.round(frameProperties.clearcoat * 100)}%)</label>
                <Slider
                  value={[frameProperties.clearcoat]}
                  onValueChange={([value]) => onFramePropertiesChange({ clearcoat: value })}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-1"
                />
              </div>

              {/* Advanced Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-xs"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </Button>

              {showAdvanced && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Environment Map Intensity */}
                  <div>
                    <label className="text-xs text-gray-600">Environment Intensity ({frameProperties.envMapIntensity.toFixed(1)})</label>
                    <Slider
                      value={[frameProperties.envMapIntensity]}
                      onValueChange={([value]) => onFramePropertiesChange({ envMapIntensity: value })}
                      max={2}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>

                  {/* IOR */}
                  <div>
                    <label className="text-xs text-gray-600">IOR ({frameProperties.ior.toFixed(2)})</label>
                    <Slider
                      value={[frameProperties.ior]}
                      onValueChange={([value]) => onFramePropertiesChange({ ior: value })}
                      max={2.5}
                      min={1}
                      step={0.01}
                      className="mt-1"
                    />
                  </div>

                  {/* Normal Scale */}
                  <div>
                    <label className="text-xs text-gray-600">Normal Scale ({frameProperties.normalScale.toFixed(1)})</label>
                    <Slider
                      value={[frameProperties.normalScale]}
                      onValueChange={([value]) => onFramePropertiesChange({ normalScale: value })}
                      max={2}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Lens Materials */}
        {activeTab === 'lens' && (
          <>
            {/* Lens Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lens Type</label>
              <div className="grid grid-cols-1 gap-2">
                {LENS_MATERIAL_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onLensPresetChange(preset.id)}
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: preset.thumbnailColor }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{preset.name}</div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs text-white ${getLensCategoryColor(preset.category)}`}
                      >
                        {preset.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lens Properties */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Eye className="h-3 w-3" />
                Lens Properties
              </div>
              
              {/* Color/Tint */}
              <div>
                <label className="text-xs text-gray-600">Tint Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={lensProperties.color}
                    onChange={(e) => onLensPropertiesChange({ color: e.target.value })}
                    className="w-8 h-8 rounded border"
                  />
                  <span className="text-xs font-mono">{lensProperties.color}</span>
                </div>
              </div>

              {/* Transmission */}
              <div>
                <label className="text-xs text-gray-600">Transmission ({Math.round(lensProperties.transmission * 100)}%)</label>
                <Slider
                  value={[lensProperties.transmission]}
                  onValueChange={([value]) => onLensPropertiesChange({ transmission: value })}
                  max={1}
                  min={0}
                  step={0.01}
                  className="mt-1"
                />
              </div>

              {/* Thickness */}
              <div>
                <label className="text-xs text-gray-600">Thickness ({lensProperties.thickness.toFixed(2)})</label>
                <Slider
                  value={[lensProperties.thickness]}
                  onValueChange={([value]) => onLensPropertiesChange({ thickness: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              {/* IOR */}
              <div>
                <label className="text-xs text-gray-600">IOR ({lensProperties.ior.toFixed(2)})</label>
                <Slider
                  value={[lensProperties.ior]}
                  onValueChange={([value]) => onLensPropertiesChange({ ior: value })}
                  max={2.5}
                  min={1}
                  step={0.01}
                  className="mt-1"
                />
              </div>

              {/* Advanced Lens Controls */}
              {showAdvanced && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Roughness */}
                  <div>
                    <label className="text-xs text-gray-600">Roughness ({Math.round(lensProperties.roughness * 100)}%)</label>
                    <Slider
                      value={[lensProperties.roughness]}
                      onValueChange={([value]) => onLensPropertiesChange({ roughness: value })}
                      max={1}
                      min={0}
                      step={0.01}
                      className="mt-1"
                    />
                  </div>

                  {/* Environment Map Intensity */}
                  <div>
                    <label className="text-xs text-gray-600">Reflection Intensity ({lensProperties.envMapIntensity.toFixed(1)})</label>
                    <Slider
                      value={[lensProperties.envMapIntensity]}
                      onValueChange={([value]) => onLensPropertiesChange({ envMapIntensity: value })}
                      max={2}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (activeTab === 'frame') {
              onFramePresetChange('brushed-metal');
            } else {
              onLensPresetChange('clear-glass');
            }
          }}
          className="w-full text-xs"
        >
          <Palette className="h-3 w-3 mr-1" />
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
};
