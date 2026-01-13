'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  PerformanceMetrics, 
  DeviceCapabilities,
  PerformanceConfig 
} from '@/types/performance-optimization';
import { Zap, Monitor, Cpu, MemoryStick, Settings, TrendingUp, Smartphone } from 'lucide-react';

interface PerformanceControlsProps {
  metrics: PerformanceMetrics | null;
  deviceCapabilities: DeviceCapabilities | null;
  currentQualityLevel: number;
  isOptimizing: boolean;
  onQualityLevelChange: (level: number) => void;
  onAdaptiveQualityToggle: (enabled: boolean) => void;
  onLODBiasChange: (bias: number) => void;
  onLODToggle: (enabled: boolean) => void;
  onOptimizeForMobile: () => void;
  onOptimizeForLowEnd: () => void;
  onResetStats: () => void;
  className?: string;
}

export const PerformanceControls: React.FC<PerformanceControlsProps> = ({
  metrics,
  deviceCapabilities,
  currentQualityLevel,
  isOptimizing,
  onQualityLevelChange,
  onAdaptiveQualityToggle,
  onLODBiasChange,
  onLODToggle,
  onOptimizeForMobile,
  onOptimizeForLowEnd,
  onResetStats,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'lod' | 'device'>('overview');
  const [adaptiveQualityEnabled, setAdaptiveQualityEnabled] = useState(true);
  const [lodEnabled, setLODEnabled] = useState(true);
  const [lodBias, setLODBias] = useState(0);

  const getPerformanceColor = (fps: number, target: number = 60) => {
    const ratio = fps / target;
    if (ratio > 0.9) return 'text-green-500';
    if (ratio > 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityLevelName = (level: number) => {
    const levels = ['Ultra Low', 'Low', 'Medium', 'High', 'Ultra'];
    return levels[level] || 'Unknown';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAdaptiveQualityToggle = () => {
    const newValue = !adaptiveQualityEnabled;
    setAdaptiveQualityEnabled(newValue);
    onAdaptiveQualityToggle(newValue);
  };

  const handleLODToggle = () => {
    const newValue = !lodEnabled;
    setLODEnabled(newValue);
    onLODToggle(newValue);
  };

  const handleLODBiasChange = (value: number) => {
    setLODBias(value);
    onLODBiasChange(value);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" />
          Performance Optimization
        </CardTitle>
        
        {/* Tab Selection */}
        <div className="flex gap-1 mt-2">
          {[
            { id: 'overview', label: 'Overview', icon: Monitor },
            { id: 'quality', label: 'Quality', icon: Settings },
            { id: 'lod', label: 'LOD', icon: TrendingUp },
            { id: 'device', label: 'Device', icon: Cpu },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(id as any)}
              className="flex-1 text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Performance Metrics */}
            {metrics && (
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Monitor className="h-3 w-3" />
                  Performance Metrics
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">FPS:</span>
                      <span className={`font-mono ${getPerformanceColor(metrics.fps)}`}>
                        {metrics.fps.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg FPS:</span>
                      <span className={`font-mono ${getPerformanceColor(metrics.averageFps)}`}>
                        {metrics.averageFps.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frame Time:</span>
                      <span className="font-mono">{metrics.frameTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Draw Calls:</span>
                      <span className="font-mono">{metrics.drawCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Triangles:</span>
                      <span className="font-mono">{metrics.triangles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Memory:</span>
                      <span className="font-mono">{(metrics.memoryUsage.total / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                  </div>
                </div>

                {/* Processing Times */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700">Processing Times</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Face Detection:</span>
                      <span className="font-mono">{metrics.faceDetectionTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Positioning:</span>
                      <span className="font-mono">{metrics.positioningTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mapping:</span>
                      <span className="font-mono">{metrics.coordinateMappingTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rendering:</span>
                      <span className="font-mono">{metrics.renderingTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Quick Optimizations</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOptimizeForMobile}
                  disabled={isOptimizing}
                  className="text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOptimizeForLowEnd}
                  disabled={isOptimizing}
                  className="text-xs"
                >
                  <Cpu className="h-3 w-3 mr-1" />
                  Low-End
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && (
          <>
            {/* Current Quality Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Level</span>
                <Badge variant="default">
                  {getQualityLevelName(currentQualityLevel)}
                </Badge>
              </div>
              
              {/* Quality Level Slider */}
              <div>
                <Slider
                  value={[currentQualityLevel]}
                  onValueChange={([value]) => onQualityLevelChange(value)}
                  max={4}
                  min={0}
                  step={1}
                  disabled={adaptiveQualityEnabled}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Ultra Low</span>
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Ultra</span>
                </div>
              </div>
            </div>

            {/* Adaptive Quality Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Adaptive Quality</div>
                <div className="text-xs text-gray-500">Automatically adjust quality based on performance</div>
              </div>
              <Button
                variant={adaptiveQualityEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleAdaptiveQualityToggle}
                className="text-xs"
              >
                {adaptiveQualityEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>

            {/* Quality Metrics */}
            {metrics && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Quality Metrics</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Texture Quality:</span>
                    <span>{Math.round(metrics.textureQuality * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shadow Quality:</span>
                    <span>{Math.round(metrics.shadowQuality * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">LOD Level:</span>
                    <span>{metrics.lodLevel}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* LOD Tab */}
        {activeTab === 'lod' && (
          <>
            {/* LOD Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Level of Detail</div>
                <div className="text-xs text-gray-500">Reduce model complexity at distance</div>
              </div>
              <Button
                variant={lodEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleLODToggle}
                className="text-xs"
              >
                {lodEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>

            {/* LOD Bias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LOD Bias</span>
                <span className="text-xs font-mono">{lodBias.toFixed(1)}</span>
              </div>
              <Slider
                value={[lodBias]}
                onValueChange={([value]) => handleLODBiasChange(value)}
                max={2}
                min={-2}
                step={0.1}
                disabled={!lodEnabled}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Higher Detail</span>
                <span>Lower Detail</span>
              </div>
            </div>

            {/* LOD Information */}
            <div className="space-y-2">
              <div className="text-sm font-medium">LOD Levels</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Level 0 (High):</span>
                  <span>0-0.5m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Level 1 (Medium):</span>
                  <span>0.5-2.0m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Level 2 (Low):</span>
                  <span>2.0m+</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Device Tab */}
        {activeTab === 'device' && (
          <>
            {/* Device Information */}
            {deviceCapabilities && (
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Cpu className="h-3 w-3" />
                  Device Information
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Performance Tier:</span>
                    <Badge className={`text-white ${getTierColor(deviceCapabilities.tier)}`}>
                      {deviceCapabilities.tier.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Device Type:</span>
                    <span>
                      {deviceCapabilities.isMobile ? 'Mobile' : 
                       deviceCapabilities.isTablet ? 'Tablet' : 'Desktop'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">WebGL Version:</span>
                    <span>{deviceCapabilities.webglVersion}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Texture Size:</span>
                    <span>{deviceCapabilities.maxTextureSize}px</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Device Memory:</span>
                    <span>{deviceCapabilities.deviceMemory}GB</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPU Cores:</span>
                    <span>{deviceCapabilities.hardwareConcurrency}</span>
                  </div>
                </div>

                {/* GPU Information */}
                <div className="space-y-1">
                  <div className="text-sm font-medium">GPU</div>
                  <div className="text-xs text-gray-600 break-all">
                    {deviceCapabilities.gpu}
                  </div>
                </div>

                {/* WebGL Extensions */}
                <div className="space-y-1">
                  <div className="text-sm font-medium">Key Extensions</div>
                  <div className="flex flex-wrap gap-1">
                    {deviceCapabilities.extensions.slice(0, 6).map((ext, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {ext.replace('WEBGL_', '').replace('EXT_', '')}
                      </Badge>
                    ))}
                    {deviceCapabilities.extensions.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{deviceCapabilities.extensions.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResetStats}
          className="w-full text-xs"
        >
          <MemoryStick className="h-3 w-3 mr-1" />
          Reset Statistics
        </Button>
      </CardContent>
    </Card>
  );
};
