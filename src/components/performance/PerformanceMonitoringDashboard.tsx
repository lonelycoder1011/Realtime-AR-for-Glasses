'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  MemoryStick, 
  HardDrive, 
  Cpu, 
  Monitor,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface PerformanceMonitoringDashboardProps {
  performanceStats: any;
  memoryStats: any;
  loadingProgress: any;
  currentQualityLevel: number;
  isOptimizing: boolean;
  onQualityLevelChange: (level: number) => void;
  onOptimizeForMobile: () => void;
  onOptimizeForDesktop: () => void;
  onForceCleanup: () => void;
  onToggleAdaptive: (enabled: boolean) => void;
  className?: string;
}

export const PerformanceMonitoringDashboard: React.FC<PerformanceMonitoringDashboardProps> = ({
  performanceStats,
  memoryStats,
  loadingProgress,
  currentQualityLevel,
  isOptimizing,
  onQualityLevelChange,
  onOptimizeForMobile,
  onOptimizeForDesktop,
  onForceCleanup,
  onToggleAdaptive,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'memory' | 'loading'>('overview');
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);

  const getPerformanceStatus = () => {
    if (!performanceStats) return { status: 'unknown', color: 'secondary', icon: AlertTriangle };
    
    const fps = performanceStats.actualFPS;
    if (fps >= performanceStats.targetFPS * 0.9) {
      return { status: 'excellent', color: 'default', icon: CheckCircle };
    } else if (fps >= performanceStats.targetFPS * 0.7) {
      return { status: 'good', color: 'secondary', icon: TrendingUp };
    } else {
      return { status: 'poor', color: 'destructive', icon: TrendingDown };
    }
  };

  const getMemoryStatus = () => {
    if (!memoryStats) return { status: 'unknown', color: 'secondary' };
    
    const memoryMB = memoryStats.totalMemoryUsage / 1024 / 1024;
    if (memoryMB < 50) return { status: 'low', color: 'default' };
    if (memoryMB < 100) return { status: 'medium', color: 'secondary' };
    return { status: 'high', color: 'destructive' };
  };

  const getQualityLevelName = (level: number) => {
    const levels = ['Ultra Low', 'Low', 'Medium', 'High', 'Ultra'];
    return levels[level] || 'Unknown';
  };

  const handleAdaptiveToggle = () => {
    const newValue = !adaptiveEnabled;
    setAdaptiveEnabled(newValue);
    onToggleAdaptive(newValue);
  };

  const performanceStatus = getPerformanceStatus();
  const memoryStatus = getMemoryStatus();
  const StatusIcon = performanceStatus.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Performance Monitoring Dashboard
        </CardTitle>
        
        {/* Tab Selection */}
        <div className="flex gap-1 mt-2">
          {[
            { id: 'overview', label: 'Overview', icon: Monitor },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'memory', label: 'Memory', icon: MemoryStick },
            { id: 'loading', label: 'Loading', icon: HardDrive },
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
            {/* System Status */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Performance</div>
                      <div className="flex items-center gap-1 mt-1">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={performanceStatus.color as any} className="text-xs">
                          {performanceStatus.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {performanceStats?.actualFPS?.toFixed(0) || 0} FPS
                      </div>
                      <div className="text-xs text-gray-500">
                        Target: {performanceStats?.targetFPS || 30}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Memory</div>
                      <Badge variant={memoryStatus.color as any} className="text-xs mt-1">
                        {memoryStatus.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {memoryStats ? (memoryStats.totalMemoryUsage / 1024 / 1024).toFixed(0) : 0}MB
                      </div>
                      <div className="text-xs text-gray-500">Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Level</span>
                <Badge variant="default">
                  {getQualityLevelName(currentQualityLevel)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs">Ultra Low</span>
                <Progress value={(currentQualityLevel / 4) * 100} className="flex-1" />
                <span className="text-xs">Ultra</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span>Level {currentQualityLevel}</span>
                <div className="flex items-center gap-1">
                  <span>Adaptive:</span>
                  <Button
                    variant={adaptiveEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleAdaptiveToggle}
                    className="h-6 px-2 text-xs"
                  >
                    {adaptiveEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>

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
                  <Cpu className="h-3 w-3 mr-1" />
                  Mobile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOptimizeForDesktop}
                  disabled={isOptimizing}
                  className="text-xs"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performanceStats && (
          <>
            <div className="space-y-3">
              <div className="text-sm font-medium">Frame Rate Metrics</div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{performanceStats.actualFPS.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Current FPS</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{performanceStats.targetFPS}</div>
                  <div className="text-xs text-gray-500">Target FPS</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{performanceStats.frameTime.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Frame Time (ms)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Device Information</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Device Tier:</span>
                    <Badge variant="secondary">{performanceStats.deviceTier.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Adaptive Quality:</span>
                    <span>{performanceStats.adaptiveEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Quality Control</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-16">Level:</span>
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2, 3, 4].map(level => (
                        <Button
                          key={level}
                          variant={currentQualityLevel === level ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onQualityLevelChange(level)}
                          disabled={adaptiveEnabled}
                          className="flex-1 text-xs h-8"
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {adaptiveEnabled && (
                    <div className="text-xs text-gray-500">
                      Disable adaptive quality to manually control levels
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && memoryStats && (
          <>
            <div className="space-y-3">
              <div className="text-sm font-medium">Memory Usage</div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Geometries:</span>
                  <span>{(memoryStats.geometries / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Textures:</span>
                  <span>{(memoryStats.textures / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Materials:</span>
                  <span>{(memoryStats.materials / 1024).toFixed(1)}KB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Render Targets:</span>
                  <span>{(memoryStats.renderTargets / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div className="flex justify-between text-xs font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>{(memoryStats.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              </div>

              {memoryStats.poolStats && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Object Pools</div>
                  {Array.from(memoryStats.poolStats.entries()).map(([poolName, stats]: [string, any]) => (
                    <div key={poolName} className="flex justify-between text-xs">
                      <span className="capitalize">{poolName}:</span>
                      <span>{stats.inUse} / {stats.available + stats.inUse}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onForceCleanup}
                className="w-full text-xs"
              >
                <MemoryStick className="h-3 w-3 mr-1" />
                Force Memory Cleanup
              </Button>
            </div>
          </>
        )}

        {/* Loading Tab */}
        {activeTab === 'loading' && (
          <>
            <div className="space-y-3">
              {loadingProgress ? (
                <>
                  <div className="text-sm font-medium">Asset Loading Progress</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress:</span>
                      <span>{loadingProgress.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={loadingProgress.percentage} />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{loadingProgress.loaded} / {loadingProgress.total} assets</span>
                      <span>{(loadingProgress.estimatedTimeRemaining / 1000).toFixed(1)}s remaining</span>
                    </div>
                  </div>

                  {loadingProgress.currentAsset && (
                    <div className="text-xs">
                      <span className="text-gray-500">Loading: </span>
                      <span className="font-mono">{loadingProgress.currentAsset}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">No active loading operations</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Loading Features</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Lazy Loading:</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Asset Compression:</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Caching:</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Preloading:</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1">
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>System Ready</span>
              </>
            )}
          </div>
          <div className="text-gray-500">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
