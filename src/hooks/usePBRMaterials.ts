import { useState, useRef, useCallback, useEffect } from 'react';
import { PBRMaterialSystem } from '@/lib/three/pbr-material-system';
import {
  PBRMaterialProperties,
  LensMaterialProperties,
  FrameMaterialProperties,
  MaterialPreset,
  LensPreset,
} from '@/types/lighting-materials';
import * as THREE from 'three';

interface UsePBRMaterialsOptions {
  autoLoadTextures?: boolean;
  enableCaching?: boolean;
}

export const usePBRMaterials = (options: UsePBRMaterialsOptions = {}) => {
  const { autoLoadTextures = true, enableCaching = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState({ materials: 0, textures: 0 });

  const materialSystemRef = useRef<PBRMaterialSystem | null>(null);

  // Initialize material system
  useEffect(() => {
    try {
      materialSystemRef.current = new PBRMaterialSystem();
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(`Failed to initialize PBR material system: ${err}`);
      setIsInitialized(false);
    }
  }, []);

  // Create frame material
  const createFrameMaterial = useCallback(async (
    properties: FrameMaterialProperties,
    preset?: MaterialPreset
  ): Promise<THREE.MeshPhysicalMaterial | null> => {
    if (!materialSystemRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const material = materialSystemRef.current.createFrameMaterial(properties, preset);
      
      // Update cache stats
      if (enableCaching) {
        const stats = materialSystemRef.current.getCacheStats();
        setCacheStats(stats);
      }

      return material;
    } catch (err) {
      setError(`Failed to create frame material: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableCaching]);

  // Create lens material
  const createLensMaterial = useCallback(async (
    properties: LensMaterialProperties,
    preset?: LensPreset
  ): Promise<THREE.MeshPhysicalMaterial | null> => {
    if (!materialSystemRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const material = materialSystemRef.current.createLensMaterial(properties, preset);
      
      // Update cache stats
      if (enableCaching) {
        const stats = materialSystemRef.current.getCacheStats();
        setCacheStats(stats);
      }

      return material;
    } catch (err) {
      setError(`Failed to create lens material: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableCaching]);

  // Create material from preset
  const createMaterialFromPreset = useCallback(async (
    presetId: string,
    type: 'frame' | 'lens'
  ): Promise<THREE.MeshPhysicalMaterial | null> => {
    if (!materialSystemRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const material = materialSystemRef.current.createMaterialFromPreset(presetId, type);
      
      if (enableCaching) {
        const stats = materialSystemRef.current.getCacheStats();
        setCacheStats(stats);
      }

      return material;
    } catch (err) {
      setError(`Failed to create material from preset: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableCaching]);

  // Update material properties
  const updateMaterialProperties = useCallback((
    material: THREE.MeshPhysicalMaterial,
    properties: Partial<PBRMaterialProperties>
  ) => {
    if (!materialSystemRef.current) return;

    try {
      materialSystemRef.current.updateMaterialProperties(material, properties);
      setError(null);
    } catch (err) {
      setError(`Failed to update material properties: ${err}`);
    }
  }, []);

  // Get frame presets
  const getFramePresets = useCallback((): MaterialPreset[] => {
    if (!materialSystemRef.current) return [];
    return materialSystemRef.current.getFramePresets();
  }, []);

  // Get lens presets
  const getLensPresets = useCallback((): LensPreset[] => {
    if (!materialSystemRef.current) return [];
    return materialSystemRef.current.getLensPresets();
  }, []);

  // Get frame preset by ID
  const getFramePreset = useCallback((id: string): MaterialPreset | undefined => {
    if (!materialSystemRef.current) return undefined;
    return materialSystemRef.current.getFramePreset(id);
  }, []);

  // Get lens preset by ID
  const getLensPreset = useCallback((id: string): LensPreset | undefined => {
    if (!materialSystemRef.current) return undefined;
    return materialSystemRef.current.getLensPreset(id);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    if (!materialSystemRef.current) return;

    try {
      materialSystemRef.current.dispose();
      materialSystemRef.current = new PBRMaterialSystem();
      setCacheStats({ materials: 0, textures: 0 });
      setError(null);
    } catch (err) {
      setError(`Failed to clear cache: ${err}`);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (materialSystemRef.current) {
        materialSystemRef.current.dispose();
        materialSystemRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    cacheStats,

    // Material creation
    createFrameMaterial,
    createLensMaterial,
    createMaterialFromPreset,
    updateMaterialProperties,

    // Presets
    getFramePresets,
    getLensPresets,
    getFramePreset,
    getLensPreset,

    // Cache management
    clearCache,

    // Status
    isReady: isInitialized && !error,
  };
};
