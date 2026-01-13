'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  PositioningConfig, 
  PositioningQuality,
  PositioningAlgorithmType,
  POSITIONING_ALGORITHMS 
} from '@/types/glasses-positioning';
import { Settings, RotateCw, Move3D, Zap, TrendingUp } from 'lucide-react';

interface GlassesPositioningControlsProps {
  config: PositioningConfig;
  quality: PositioningQuality;
  currentAlgorithm: PositioningAlgorithmType;
  onConfigChange: (config: Partial<PositioningConfig>) => void;
  onAlgorithmChange: (algorithm: PositioningAlgorithmType) => void;
  onReset: () => void;
  className?: string;
}

export const GlassesPositioningControls: React.FC<GlassesPositioningControlsProps> = ({
  config,
  quality,
  currentAlgorithm,
  onConfigChange,
  onAlgorithmChange,
  onReset,
  className,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getQualityColor = (value: number) => {
    if (value > 0.8) return 'bg-green-500';
    if (value > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAlgorithmDescription = (algorithm: PositioningAlgorithmType) => {
    switch (algorithm) {
      case POSITIONING_ALGORITHMS.BASIC:
        return 'Simple smoothing with linear interpolation';
      case POSITIONING_ALGORITHMS.KALMAN:
        return 'Advanced Kalman filtering for smooth tracking';
      case POSITIONING_ALGORITHMS.ADAPTIVE:
        return 'Dynamic smoothing based on confidence';
      case POSITIONING_ALGORITHMS.HYBRID:
        return 'Combines Kalman filtering with adaptive smoothing';
      default:
        return 'Unknown algorithm';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Positioning Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Algorithm Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Algorithm</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(POSITIONING_ALGORITHMS).map((algorithm) => (
              <Button
                key={algorithm}
                variant={currentAlgorithm === algorithm ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onAlgorithmChange(algorithm)}
              >
                {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {getAlgorithmDescription(currentAlgorithm)}
          </p>
        </div>

        {/* Quality Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm font-medium">
            <TrendingUp className="h-3 w-3" />
            Quality Metrics
          </div>
          
          <div className="space-y-1">
            {[
              { label: 'Stability', value: quality.stability },
              { label: 'Accuracy', value: quality.accuracy },
              { label: 'Smoothness', value: quality.smoothness },
              { label: 'Responsiveness', value: quality.responsiveness },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{label}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${getQualityColor(value)}`}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{Math.round(value * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Score */}
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-sm font-medium">Overall:</span>
            <Badge variant={quality.overallScore > 0.7 ? 'default' : 'secondary'}>
              {Math.round(quality.overallScore * 100)}%
            </Badge>
          </div>
        </div>

        {/* Basic Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Move3D className="h-3 w-3" />
            Position Smoothing
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">Position ({Math.round(config.positionSmoothingFactor * 100)}%)</label>
              <Slider
                value={[config.positionSmoothingFactor]}
                onValueChange={([value]) => onConfigChange({ positionSmoothingFactor: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-600">Rotation ({Math.round(config.rotationSmoothingFactor * 100)}%)</label>
              <Slider
                value={[config.rotationSmoothingFactor]}
                onValueChange={([value]) => onConfigChange({ rotationSmoothingFactor: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-600">Scale ({Math.round(config.scaleSmoothingFactor * 100)}%)</label>
              <Slider
                value={[config.scaleSmoothingFactor]}
                onValueChange={([value]) => onConfigChange({ scaleSmoothingFactor: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Advanced Controls Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Stability Threshold</label>
              <Slider
                value={[config.stabilityThreshold]}
                onValueChange={([value]) => onConfigChange({ stabilityThreshold: value })}
                max={1}
                min={0.5}
                step={0.05}
              />
              <span className="text-xs text-gray-500">{Math.round(config.stabilityThreshold * 100)}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Jitter Reduction</label>
              <Slider
                value={[config.jitterReductionFactor]}
                onValueChange={([value]) => onConfigChange({ jitterReductionFactor: value })}
                max={1}
                min={0}
                step={0.1}
              />
              <span className="text-xs text-gray-500">{Math.round(config.jitterReductionFactor * 100)}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Scale Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Min: {config.minScale.toFixed(1)}</label>
                  <Slider
                    value={[config.minScale]}
                    onValueChange={([value]) => onConfigChange({ minScale: value })}
                    max={1}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max: {config.maxScale.toFixed(1)}</label>
                  <Slider
                    value={[config.maxScale]}
                    onValueChange={([value]) => onConfigChange({ maxScale: value })}
                    max={3}
                    min={1}
                    step={0.1}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Position Offset (mm)</label>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-xs text-gray-500">X</label>
                  <Slider
                    value={[config.positionOffset.x * 1000]}
                    onValueChange={([value]) => onConfigChange({ 
                      positionOffset: config.positionOffset.clone().setX(value / 1000)
                    })}
                    max={10}
                    min={-10}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Y</label>
                  <Slider
                    value={[config.positionOffset.y * 1000]}
                    onValueChange={([value]) => onConfigChange({ 
                      positionOffset: config.positionOffset.clone().setY(value / 1000)
                    })}
                    max={10}
                    min={-10}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Z</label>
                  <Slider
                    value={[config.positionOffset.z * 1000]}
                    onValueChange={([value]) => onConfigChange({ 
                      positionOffset: config.positionOffset.clone().setZ(value / 1000)
                    })}
                    max={10}
                    min={-10}
                    step={0.5}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full text-xs"
        >
          <RotateCw className="h-3 w-3 mr-1" />
          Reset Positioning
        </Button>
      </CardContent>
    </Card>
  );
};
