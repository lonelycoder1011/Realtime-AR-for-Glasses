import { useState, useRef, useCallback, useEffect } from 'react';
import { AdvancedLightingSystem } from '@/lib/three/lighting-system';
import { 
  LightingConfig, 
  EnvironmentMap, 
  ShadowConfig,
  DEFAULT_LIGHTING_CONFIG,
  ENVIRONMENT_MAPS 
} from '@/types/lighting-materials';
import * as THREE from 'three';

interface UseAdvancedLightingOptions {
  config?: Partial<LightingConfig>;
  autoLoadEnvironment?: boolean;
  defaultEnvironment?: string;
}

export const useAdvancedLighting = (
  scene: THREE.Scene | null,
  renderer: THREE.WebGLRenderer | null,
  options: UseAdvancedLightingOptions = {}
) => {
  const { config, autoLoadEnvironment = true, defaultEnvironment = 'studio' } = options;

  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({
    ...DEFAULT_LIGHTING_CONFIG,
    ...config,
  });
  
  const [currentEnvironment, setCurrentEnvironment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const lightingSystemRef = useRef<AdvancedLightingSystem | null>(null);

  // Initialize lighting system
  useEffect(() => {
    if (scene && renderer && !lightingSystemRef.current) {
      try {
        lightingSystemRef.current = new AdvancedLightingSystem(scene, renderer, lightingConfig);
        setIsInitialized(true);
        setError(null);

        // Auto-load default environment
        if (autoLoadEnvironment) {
          loadEnvironment(defaultEnvironment);
        }
      } catch (err) {
        setError(`Failed to initialize lighting system: ${err}`);
        setIsInitialized(false);
      }
    }
  }, [scene, renderer, lightingConfig, autoLoadEnvironment, defaultEnvironment]);

  // Load environment map
  const loadEnvironment = useCallback(async (environmentId: string) => {
    if (!lightingSystemRef.current) return;

    const environmentMap = ENVIRONMENT_MAPS.find(env => env.id === environmentId);
    if (!environmentMap) {
      setError(`Environment map not found: ${environmentId}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await lightingSystemRef.current.loadEnvironmentMap(environmentMap);
      setCurrentEnvironment(environmentId);
    } catch (err) {
      setError(`Failed to load environment: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update lighting configuration
  const updateConfig = useCallback((newConfig: Partial<LightingConfig>) => {
    if (!lightingSystemRef.current) return;

    const updatedConfig = { ...lightingConfig, ...newConfig };
    setLightingConfig(updatedConfig);
    
    try {
      lightingSystemRef.current.updateConfig(newConfig);
      setError(null);
    } catch (err) {
      setError(`Failed to update lighting config: ${err}`);
    }
  }, [lightingConfig]);

  // Update shadow configuration
  const updateShadowConfig = useCallback((shadowConfig: Partial<ShadowConfig>) => {
    if (!lightingSystemRef.current) return;

    try {
      lightingSystemRef.current.updateShadowConfig(shadowConfig);
      setError(null);
    } catch (err) {
      setError(`Failed to update shadow config: ${err}`);
    }
  }, []);

  // Set environment preset
  const setEnvironmentPreset = useCallback((preset: 'studio' | 'outdoor' | 'indoor' | 'dramatic') => {
    if (!lightingSystemRef.current) return;

    try {
      lightingSystemRef.current.setEnvironmentPreset(preset);
      const presetConfig = lightingSystemRef.current.getConfig();
      setLightingConfig(presetConfig);
      setError(null);
    } catch (err) {
      setError(`Failed to set environment preset: ${err}`);
    }
  }, []);

  // Toggle lighting features
  const toggleFeature = useCallback((feature: 'shadows' | 'environment' | 'faceLight' | 'rimLight', enabled: boolean) => {
    if (!lightingSystemRef.current) return;

    try {
      lightingSystemRef.current.toggleFeature(feature, enabled);
      setError(null);
    } catch (err) {
      setError(`Failed to toggle feature ${feature}: ${err}`);
    }
  }, []);

  // Update face lighting based on face position
  const updateFaceLighting = useCallback((facePosition: THREE.Vector3, faceNormal: THREE.Vector3) => {
    if (!lightingSystemRef.current) return;

    try {
      lightingSystemRef.current.updateFaceLighting(facePosition, faceNormal);
    } catch (err) {
      console.warn('Failed to update face lighting:', err);
    }
  }, []);

  // Update time-based lighting
  const updateTimeOfDay = useCallback((hour: number) => {
    if (!lightingSystemRef.current) return;

    try {
      lightingSystemRef.current.updateTimeOfDay(hour);
      const updatedConfig = lightingSystemRef.current.getConfig();
      setLightingConfig(updatedConfig);
    } catch (err) {
      setError(`Failed to update time of day: ${err}`);
    }
  }, []);

  // Get available environments
  const getAvailableEnvironments = useCallback(() => {
    return ENVIRONMENT_MAPS;
  }, []);

  // Reset to default configuration
  const resetToDefaults = useCallback(() => {
    const defaultConfig = DEFAULT_LIGHTING_CONFIG;
    setLightingConfig(defaultConfig);
    
    if (lightingSystemRef.current) {
      try {
        lightingSystemRef.current.updateConfig(defaultConfig);
        setError(null);
      } catch (err) {
        setError(`Failed to reset lighting: ${err}`);
      }
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (lightingSystemRef.current) {
        lightingSystemRef.current.dispose();
        lightingSystemRef.current = null;
      }
    };
  }, []);

  return {
    // State
    lightingConfig,
    currentEnvironment,
    isLoading,
    error,
    isInitialized,
    
    // Actions
    loadEnvironment,
    updateConfig,
    updateShadowConfig,
    setEnvironmentPreset,
    toggleFeature,
    updateFaceLighting,
    updateTimeOfDay,
    resetToDefaults,
    
    // Data
    getAvailableEnvironments,
    
    // Status
    isReady: isInitialized && !error,
  };
};
