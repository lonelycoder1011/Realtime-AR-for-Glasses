'use client';

import React, { useState } from 'react';
import { CameraProvider, CameraControls } from '@/components/camera';
import { AutoStartCamera } from '@/components/camera/AutoStartCamera';
import { 
  FaceDetectionProvider, 
  FaceDetectionStats, 
  ThreeJSStats, 
  EnhancedCameraWithPerformanceOptimization,
  CoordinateMappingStats 
} from '@/components/ar';
import { GlassesModelSelector, GlassesModelStats, GlassesPositioningControls } from '@/components/glasses';
import { MaterialControls, LightingControls } from '@/components/materials';
import { PerformanceControls, PerformanceStats } from '@/components/performance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Settings, Box, Crosshair, Zap, Gauge } from 'lucide-react';
import { DEFAULT_POSITIONING_CONFIG, POSITIONING_ALGORITHMS } from '@/types/glasses-positioning';
import { DEFAULT_LIGHTING_CONFIG, FRAME_MATERIAL_PRESETS, LENS_MATERIAL_PRESETS } from '@/types/lighting-materials';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/types/performance-optimization';
import { SAMPLE_GLASSES_MODEL_DATA } from '@/lib/glasses/sample-glasses-models';
import Link from 'next/link';

export default function TryOnPage() {
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [showCoordinateDebug, setShowCoordinateDebug] = useState(false);
  const [activeGlassesId, setActiveGlassesId] = useState<string | null>(null);
  
  // Debug: Log the imported data
  console.log('SAMPLE_GLASSES_MODEL_DATA:', SAMPLE_GLASSES_MODEL_DATA);
  console.log('SAMPLE_GLASSES_MODEL_DATA length:', SAMPLE_GLASSES_MODEL_DATA?.length);
  const [positioningConfig, setPositioningConfig] = useState(DEFAULT_POSITIONING_CONFIG);
  const [positioningAlgorithm, setPositioningAlgorithm] = useState(POSITIONING_ALGORITHMS.HYBRID);
  const [positioningState, setPositioningState] = useState<any>(null);
  
  // Material and lighting states
  const [lightingConfig, setLightingConfig] = useState(DEFAULT_LIGHTING_CONFIG);
  const [currentEnvironment, setCurrentEnvironment] = useState<string | null>('studio');
  const [frameProperties, setFrameProperties] = useState(FRAME_MATERIAL_PRESETS[0].properties);
  const [lensProperties, setLensProperties] = useState(LENS_MATERIAL_PRESETS[0].properties);
  
  // Performance states
  const [performanceConfig, setPerformanceConfig] = useState(DEFAULT_PERFORMANCE_CONFIG);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [currentQualityLevel, setCurrentQualityLevel] = useState(3);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handlePositioningConfigChange = (newConfig: any) => {
    setPositioningConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handlePositioningStateChange = (state: any) => {
    setPositioningState(state);
  };

  const handlePerformanceUpdate = (data: any) => {
    setPerformanceMetrics(data.metrics);
    setCurrentQualityLevel(data.currentQualityLevel);
  };

  const resetPositioning = () => {
    setPositioningConfig(DEFAULT_POSITIONING_CONFIG);
    setPositioningState(null);
  };

  const handleLightingConfigChange = (newConfig: any) => {
    setLightingConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleEnvironmentChange = (environmentId: string) => {
    setCurrentEnvironment(environmentId);
  };

  const handleFramePropertiesChange = (properties: any) => {
    setFrameProperties(prev => ({ ...prev, ...properties }));
  };

  const handleLensPropertiesChange = (properties: any) => {
    setLensProperties(prev => ({ ...prev, ...properties }));
  };

  const handleFramePresetChange = (presetId: string) => {
    const preset = FRAME_MATERIAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFrameProperties(preset.properties);
    }
  };

  const handleLensPresetChange = (presetId: string) => {
    const preset = LENS_MATERIAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setLensProperties(preset.properties);
    }
  };

  const handleAlgorithmChange = (algorithm: string) => {
    setPositioningAlgorithm(algorithm as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Performance Optimization
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugOverlay(!showDebugOverlay)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDebugOverlay ? 'Hide Face Debug' : 'Show Face Debug'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinateDebug(!showCoordinateDebug)}
              >
                <Crosshair className="h-4 w-4 mr-2" />
                {showCoordinateDebug ? 'Hide Coords' : 'Show Coords'}
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Adaptive quality management, LOD systems, and real-time performance monitoring for optimal frame rates
          </p>
        </div>

        {/* Performance Optimization Integration */}
        <CameraProvider>
          <AutoStartCamera>
            <FaceDetectionProvider>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Camera View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Performance Optimization System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <EnhancedCameraWithPerformanceOptimization
                        showFaceOverlay={true}
                        showLandmarks={showDebugOverlay}
                        showBoundingBox={true}
                        showKeyPoints={true}
                        show3DScene={true}
                        showCoordinateDebug={showCoordinateDebug}
                        showPoseDebug={true}
                        showGeometryDebug={true}
                        showAnchorsDebug={true}
                        showQualityDebug={true}
                        activeGlassesId={activeGlassesId}
                        positioningAlgorithm={positioningAlgorithm}
                        frameProperties={frameProperties}
                        lensProperties={lensProperties}
                        onPositioningStateChange={handlePositioningStateChange}
                        onPerformanceUpdate={handlePerformanceUpdate}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Camera Controls */}
                <div className="mt-4">
                  <CameraControls />
                </div>
              </div>

              {/* Performance Sidebar */}
              <div className="space-y-4">
                {/* Performance Controls - temporarily disabled due to slider infinite loop issue */}
                {/* <PerformanceControls
                  metrics={performanceMetrics}
                  deviceCapabilities={null}
                  currentQualityLevel={currentQualityLevel}
                  isOptimizing={isOptimizing}
                  onQualityLevelChange={setCurrentQualityLevel}
                  onAdaptiveQualityToggle={(enabled) => console.log('Adaptive quality:', enabled)}
                  onLODBiasChange={(bias) => console.log('LOD bias:', bias)}
                  onLODToggle={(enabled) => console.log('LOD enabled:', enabled)}
                  onOptimizeForMobile={() => {
                    setIsOptimizing(true);
                    setTimeout(() => setIsOptimizing(false), 2000);
                  }}
                  onOptimizeForLowEnd={() => {
                    setIsOptimizing(true);
                    setTimeout(() => setIsOptimizing(false), 2000);
                  }}
                  onResetStats={() => console.log('Reset stats')}
                /> */}

                {/* Performance Statistics - temporarily disabled */}
                {/* <PerformanceStats
                  metrics={performanceMetrics}
                  lodStats={null}
                  qualityStats={{
                    currentQualityLevel,
                    targetFps: performanceConfig.targetFps,
                    actualFps: performanceMetrics?.averageFps || 0,
                    adaptiveQualityEnabled: performanceConfig.adaptiveQuality,
                  }}
                /> */}

                {/* Material Controls - temporarily disabled due to slider infinite loop issue */}
                {/* <MaterialControls
                  frameProperties={frameProperties}
                  lensProperties={lensProperties}
                  onFramePropertiesChange={handleFramePropertiesChange}
                  onLensPropertiesChange={handleLensPropertiesChange}
                  onFramePresetChange={handleFramePresetChange}
                  onLensPresetChange={handleLensPresetChange}
                /> */}

                {/* Lighting Controls - temporarily disabled due to slider issue */}
                {/* <LightingControls
                  config={lightingConfig}
                  currentEnvironment={currentEnvironment}
                  onConfigChange={handleLightingConfigChange}
                  onEnvironmentChange={handleEnvironmentChange}
                  onPresetChange={(preset) => console.log('Lighting preset:', preset)}
                  onFeatureToggle={(feature, enabled) => console.log('Toggle feature:', feature, enabled)}
                  onTimeChange={(hour) => console.log('Time change:', hour)}
                /> */}

                {/* Positioning Controls - temporarily disabled due to slider issue */}
                {/* <GlassesPositioningControls
                  config={positioningConfig}
                  quality={positioningState?.quality || {
                    stability: 0,
                    accuracy: 0,
                    smoothness: 0,
                    responsiveness: 0,
                    overallScore: 0,
                  }}
                  currentAlgorithm={positioningAlgorithm}
                  onConfigChange={handlePositioningConfigChange}
                  onAlgorithmChange={handleAlgorithmChange}
                  onReset={resetPositioning}
                /> */}

                {/* Glasses Model Selector */}
                <GlassesModelSelector
                  models={SAMPLE_GLASSES_MODEL_DATA?.length ? SAMPLE_GLASSES_MODEL_DATA : []}
                  activeModelId={activeGlassesId}
                  loadingStates={new Map()}
                  errors={new Map()}
                  onSelectModel={setActiveGlassesId}
                  onUpdateColors={(modelId, frameColor, lensColor) => {
                    console.log('Update colors:', modelId, frameColor, lensColor);
                    console.log('Available models:', SAMPLE_GLASSES_MODEL_DATA);
                  }}
                />

                {/* Face Detection Stats */}
                <FaceDetectionStats />

                {/* Coordinate Mapping Stats */}
                <CoordinateMappingStats
                  headPose={positioningState?.mapping?.headPose || null}
                  faceGeometry={positioningState?.mapping?.faceGeometry || null}
                  quality={positioningState?.mapping?.quality || null}
                  isActive={!!positioningState}
                />

                {/* Performance Features */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Performance Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li>• <strong>Adaptive Quality:</strong> Dynamic quality adjustment</li>
                      <li>• <strong>LOD System:</strong> Level-of-detail optimization</li>
                      <li>• <strong>Performance Monitoring:</strong> Real-time FPS tracking</li>
                      <li>• <strong>Device Detection:</strong> Automatic optimization profiles</li>
                      <li>• <strong>Memory Management:</strong> Texture and geometry pooling</li>
                      <li>• <strong>Mobile Optimization:</strong> Reduced precision shaders</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
            </FaceDetectionProvider>
          </AutoStartCamera>
        </CameraProvider>
      </div>
    </div>
  );
}
