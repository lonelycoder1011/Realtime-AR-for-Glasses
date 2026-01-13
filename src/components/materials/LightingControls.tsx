'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  LightingConfig, 
  EnvironmentMap,
  ENVIRONMENT_MAPS 
} from '@/types/lighting-materials';
import { Sun, Lightbulb, Zap, Settings, Clock } from 'lucide-react';

interface LightingControlsProps {
  config: LightingConfig;
  currentEnvironment: string | null;
  onConfigChange: (config: Partial<LightingConfig>) => void;
  onEnvironmentChange: (environmentId: string) => void;
  onPresetChange: (preset: 'studio' | 'outdoor' | 'indoor' | 'dramatic') => void;
  onFeatureToggle: (feature: 'shadows' | 'environment' | 'faceLight' | 'rimLight', enabled: boolean) => void;
  onTimeChange?: (hour: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const LightingControls: React.FC<LightingControlsProps> = ({
  config,
  currentEnvironment,
  onConfigChange,
  onEnvironmentChange,
  onPresetChange,
  onFeatureToggle,
  onTimeChange,
  isLoading = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'lights' | 'environment'>('presets');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentTime, setCurrentTime] = useState(12); // Noon

  const lightingPresets = [
    { id: 'studio', name: 'Studio', description: 'Professional studio lighting', icon: '🎬' },
    { id: 'outdoor', name: 'Outdoor', description: 'Natural daylight', icon: '☀️' },
    { id: 'indoor', name: 'Indoor', description: 'Warm indoor lighting', icon: '🏠' },
    { id: 'dramatic', name: 'Dramatic', description: 'High contrast lighting', icon: '🎭' },
  ];

  const handleTimeChange = (hour: number) => {
    setCurrentTime(hour);
    if (onTimeChange) {
      onTimeChange(hour);
    }
  };

  const getEnvironmentIcon = (envId: string) => {
    switch (envId) {
      case 'studio': return '🎬';
      case 'outdoor': return '🌅';
      case 'indoor': return '💡';
      default: return '🌍';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sun className="h-4 w-4" />
          Lighting & Environment
        </CardTitle>
        
        {/* Tab Selection */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={activeTab === 'presets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('presets')}
            className="flex-1 text-xs"
          >
            Presets
          </Button>
          <Button
            variant={activeTab === 'lights' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('lights')}
            className="flex-1 text-xs"
          >
            Lights
          </Button>
          <Button
            variant={activeTab === 'environment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('environment')}
            className="flex-1 text-xs"
          >
            Environment
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <>
            {/* Lighting Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lighting Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {lightingPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onPresetChange(preset.id as any)}
                    className="flex flex-col items-center p-3 h-auto"
                    disabled={isLoading}
                  >
                    <span className="text-lg mb-1">{preset.icon}</span>
                    <span className="text-xs font-medium">{preset.name}</span>
                    <span className="text-xs text-gray-500">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            {onTimeChange && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-3 w-3" />
                  Time of Day
                </div>
                <div>
                  <label className="text-xs text-gray-600">Hour: {currentTime}:00</label>
                  <Slider
                    value={[currentTime]}
                    onValueChange={([value]) => handleTimeChange(value)}
                    max={23}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Midnight</span>
                    <span>Noon</span>
                    <span>Midnight</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Toggles */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Features</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'shadows', label: 'Shadows', icon: '🌑' },
                  { key: 'environment', label: 'Environment', icon: '🌍' },
                  { key: 'faceLight', label: 'Face Light', icon: '💡' },
                  { key: 'rimLight', label: 'Rim Light', icon: '✨' },
                ].map(({ key, label, icon }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => onFeatureToggle(key as any, true)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <span>{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Lights Tab */}
        {activeTab === 'lights' && (
          <>
            {/* Directional Light */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Sun className="h-3 w-3" />
                Directional Light
              </div>
              
              <div>
                <label className="text-xs text-gray-600">Intensity ({config.directional.intensity.toFixed(1)})</label>
                <Slider
                  value={[config.directional.intensity]}
                  onValueChange={([value]) => onConfigChange({
                    directional: { ...config.directional, intensity: value }
                  })}
                  max={5}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.directional.color}
                    onChange={(e) => onConfigChange({
                      directional: { ...config.directional, color: e.target.value }
                    })}
                    className="w-8 h-8 rounded border"
                  />
                  <span className="text-xs font-mono">{config.directional.color}</span>
                </div>
              </div>
            </div>

            {/* Ambient Light */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Lightbulb className="h-3 w-3" />
                Ambient Light
              </div>
              
              <div>
                <label className="text-xs text-gray-600">Intensity ({config.ambient.intensity.toFixed(1)})</label>
                <Slider
                  value={[config.ambient.intensity]}
                  onValueChange={([value]) => onConfigChange({
                    ambient: { ...config.ambient, intensity: value }
                  })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.ambient.color}
                    onChange={(e) => onConfigChange({
                      ambient: { ...config.ambient, color: e.target.value }
                    })}
                    className="w-8 h-8 rounded border"
                  />
                  <span className="text-xs font-mono">{config.ambient.color}</span>
                </div>
              </div>
            </div>

            {/* Face Light */}
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Zap className="h-3 w-3" />
                Face Light
              </div>
              
              <div>
                <label className="text-xs text-gray-600">Intensity ({config.faceLight.intensity.toFixed(1)})</label>
                <Slider
                  value={[config.faceLight.intensity]}
                  onValueChange={([value]) => onConfigChange({
                    faceLight: { ...config.faceLight, intensity: value }
                  })}
                  max={3}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Distance ({config.faceLight.distance.toFixed(1)})</label>
                <Slider
                  value={[config.faceLight.distance]}
                  onValueChange={([value]) => onConfigChange({
                    faceLight: { ...config.faceLight, distance: value }
                  })}
                  max={5}
                  min={0.5}
                  step={0.1}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Advanced Light Controls */}
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
                <div>
                  <label className="text-xs text-gray-600">Rim Light Intensity ({config.rimLight.intensity.toFixed(1)})</label>
                  <Slider
                    value={[config.rimLight.intensity]}
                    onValueChange={([value]) => onConfigChange({
                      rimLight: { ...config.rimLight, intensity: value }
                    })}
                    max={3}
                    min={0}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Environment Tab */}
        {activeTab === 'environment' && (
          <>
            {/* Environment Maps */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Environment Maps</label>
              <div className="space-y-2">
                {ENVIRONMENT_MAPS.map((env) => (
                  <div
                    key={env.id}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                      currentEnvironment === env.id 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onEnvironmentChange(env.id)}
                  >
                    <span className="text-lg">{getEnvironmentIcon(env.id)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{env.name}</div>
                      <div className="text-xs text-gray-500">
                        Intensity: {env.intensity} • Rotation: {env.rotation}°
                      </div>
                    </div>
                    {currentEnvironment === env.id && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Intensity */}
            <div>
              <label className="text-xs text-gray-600">Environment Intensity ({config.environmentIntensity.toFixed(1)})</label>
              <Slider
                value={[config.environmentIntensity]}
                onValueChange={([value]) => onConfigChange({ environmentIntensity: value })}
                max={3}
                min={0}
                step={0.1}
                className="mt-1"
              />
            </div>

            {/* Environment Rotation */}
            <div>
              <label className="text-xs text-gray-600">Environment Rotation ({Math.round(config.environmentRotation)}°)</label>
              <Slider
                value={[config.environmentRotation]}
                onValueChange={([value]) => onConfigChange({ environmentRotation: value })}
                max={360}
                min={0}
                step={5}
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-sm text-gray-500">Loading environment...</span>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPresetChange('studio')}
          className="w-full text-xs"
          disabled={isLoading}
        >
          <Settings className="h-3 w-3 mr-1" />
          Reset to Studio
        </Button>
      </CardContent>
    </Card>
  );
};
