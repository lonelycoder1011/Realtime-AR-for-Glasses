import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GlassesModelGenerator } from '@/lib/three/glasses-model-generator';
import { GLTFModelLoader } from '@/lib/three/gltf-model-loader';
import {
  GlassesModelData,
  GlassesModel3D,
  GlassesCollection,
} from '@/types/glasses-models';
import { SAMPLE_GLASSES_MODEL_DATA } from '@/lib/glasses/sample-glasses-models';

interface UseGlassesModelsOptions {
  scene?: THREE.Scene;
  autoLoadTemplates?: boolean;
  maxConcurrentLoads?: number;
}

export const useGlassesModels = (options: UseGlassesModelsOptions = {}) => {
  const { scene, autoLoadTemplates = true, maxConcurrentLoads = 3 } = options;
  
  const [collection, setCollection] = useState<GlassesCollection>({
    models: new Map(),
    activeModel: null,
    loadingStates: new Map(),
    errors: new Map(),
  });

  const generatorRef = useRef<GlassesModelGenerator | null>(null);
  const loaderRef = useRef<GLTFModelLoader | null>(null);
  const loadingQueueRef = useRef<string[]>([]);
  const activeLoadsRef = useRef<Set<string>>(new Set());
  const sceneRef = useRef<THREE.Scene | undefined>(scene);
  
  // Keep scene ref updated
  sceneRef.current = scene;

  // Initialize generators when scene is available
  useEffect(() => {
    console.log('[useGlassesModels] Scene changed:', !!scene, 'autoLoadTemplates:', autoLoadTemplates);
    
    if (scene) {
      console.log('[useGlassesModels] Initializing with scene');
      generatorRef.current = new GlassesModelGenerator(scene);
      loaderRef.current = new GLTFModelLoader();

      // Auto-load template models if enabled
      if (autoLoadTemplates) {
        console.log('[useGlassesModels] Auto-loading template models...');
        loadTemplateModels().then(() => {
          console.log('[useGlassesModels] Template models loaded');
        }).catch(err => {
          console.error('[useGlassesModels] Failed to load templates:', err);
        });
      }
    }

    return () => {
      // Cleanup
      if (loaderRef.current) {
        loaderRef.current.dispose();
      }
    };
  }, [scene, autoLoadTemplates]);

  // Ensure all loaded models are added to scene when scene becomes available
  useEffect(() => {
    if (!scene) return;
    
    // Add any models that were loaded before scene was available
    collection.models.forEach((model, id) => {
      if (model.mesh.parent !== scene) {
        console.log('[useGlassesModels] Adding previously loaded model to scene:', id);
        scene.add(model.mesh);
        model.mesh.visible = false;
      }
    });
  }, [scene, collection.models]);

  // Load all template models
  const loadTemplateModels = useCallback(async () => {
    if (!generatorRef.current) return;

    for (const template of SAMPLE_GLASSES_MODEL_DATA) {
      try {
        await loadModel(template);
      } catch (error) {
        console.error(`Failed to load template model ${template.id}:`, error);
      }
    }
  }, []);

  // Load a single model
  const loadModel = useCallback(async (modelData: GlassesModelData): Promise<GlassesModel3D> => {
    if (!generatorRef.current) {
      throw new Error('Model generator not initialized');
    }

    // Check if model is already loaded
    if (collection.models.has(modelData.id)) {
      return collection.models.get(modelData.id)!;
    }

    // Check if model is currently loading
    if (collection.loadingStates.get(modelData.id)) {
      throw new Error(`Model ${modelData.id} is already loading`);
    }

    // Add to loading queue if too many concurrent loads
    if (activeLoadsRef.current.size >= maxConcurrentLoads) {
      loadingQueueRef.current.push(modelData.id);
      setCollection(prev => ({
        ...prev,
        loadingStates: new Map(prev.loadingStates).set(modelData.id, true),
      }));
      
      // Wait for queue processing
      return new Promise((resolve, reject) => {
        const checkQueue = () => {
          if (collection.models.has(modelData.id)) {
            resolve(collection.models.get(modelData.id)!);
          } else if (collection.errors.has(modelData.id)) {
            reject(new Error(collection.errors.get(modelData.id)));
          } else {
            setTimeout(checkQueue, 100);
          }
        };
        checkQueue();
      });
    }

    // Start loading
    activeLoadsRef.current.add(modelData.id);
    setCollection(prev => ({
      ...prev,
      loadingStates: new Map(prev.loadingStates).set(modelData.id, true),
      errors: new Map([...prev.errors].filter(([key]) => key !== modelData.id)),
    }));

    try {
      let model: GlassesModel3D;

      console.log('[useGlassesModels] Loading model:', modelData.id, 'modelUrl:', modelData.modelUrl);

      // Try to load GLTF model first, fallback to procedural
      if (modelData.modelUrl && loaderRef.current) {
        try {
          console.log('[useGlassesModels] Attempting GLB load for:', modelData.id);
          model = await loaderRef.current.loadGLTFModel(modelData);
          console.log('[useGlassesModels] GLB loaded successfully:', modelData.id);
        } catch (gltfError) {
          console.warn(`[useGlassesModels] GLTF loading failed for ${modelData.id}, using procedural:`, gltfError);
          model = generatorRef.current.createGlassesModel(modelData);
        }
      } else {
        console.log('[useGlassesModels] No modelUrl, using procedural for:', modelData.id);
        model = generatorRef.current.createGlassesModel(modelData);
      }

      // Add to scene if provided - use ref to get current scene
      const currentScene = sceneRef.current;
      if (currentScene) {
        currentScene.add(model.mesh);
        model.mesh.visible = false; // Hidden by default
        console.log('[useGlassesModels] Added to scene:', modelData.id, 'mesh:', model.mesh.type);
      } else {
        console.warn('[useGlassesModels] No scene available for:', modelData.id);
      }

      // Update collection
      setCollection(prev => ({
        ...prev,
        models: new Map(prev.models).set(modelData.id, model),
        loadingStates: new Map([...prev.loadingStates].filter(([key]) => key !== modelData.id)),
        activeModel: prev.activeModel || modelData.id, // Set as active if no active model
      }));

      activeLoadsRef.current.delete(modelData.id);
      processLoadingQueue();

      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setCollection(prev => ({
        ...prev,
        loadingStates: new Map([...prev.loadingStates].filter(([key]) => key !== modelData.id)),
        errors: new Map(prev.errors).set(modelData.id, errorMessage),
      }));

      activeLoadsRef.current.delete(modelData.id);
      processLoadingQueue();

      throw error;
    }
  }, [collection.models, collection.loadingStates, collection.errors, maxConcurrentLoads, scene]);

  // Process loading queue
  const processLoadingQueue = useCallback(() => {
    if (loadingQueueRef.current.length > 0 && activeLoadsRef.current.size < maxConcurrentLoads) {
      const nextModelId = loadingQueueRef.current.shift();
      if (nextModelId) {
        const template = SAMPLE_GLASSES_MODEL_DATA.find((t: GlassesModelData) => t.id === nextModelId);
        if (template) {
          loadModel(template).catch(console.error);
        }
      }
    }
  }, [loadModel, maxConcurrentLoads]);

  // Set active model
  const setActiveModel = useCallback((modelId: string | null) => {
    console.log('[useGlassesModels] setActiveModel called with:', modelId);
    
    setCollection(prev => {
      console.log('[useGlassesModels] Current models in collection:', Array.from(prev.models.keys()));
      
      // Hide all models
      prev.models.forEach((model, id) => {
        model.mesh.visible = false;
        console.log(`[useGlassesModels] Hidden model: ${id}`);
      });

      // Show active model
      if (modelId && prev.models.has(modelId)) {
        const activeModel = prev.models.get(modelId)!;
        activeModel.mesh.visible = true;
        console.log(`[useGlassesModels] Showing model: ${modelId}, mesh:`, activeModel.mesh);
      } else if (modelId) {
        console.warn(`[useGlassesModels] Model ${modelId} not found in collection!`);
      }

      return {
        ...prev,
        activeModel: modelId,
      };
    });
  }, []);

  // Get model by ID
  const getModel = useCallback((modelId: string): GlassesModel3D | null => {
    return collection.models.get(modelId) || null;
  }, [collection.models]);

  // Get active model
  const getActiveModel = useCallback((): GlassesModel3D | null => {
    return collection.activeModel ? getModel(collection.activeModel) : null;
  }, [collection.activeModel, getModel]);

  // Update model materials
  const updateModelMaterials = useCallback((modelId: string, frameColor?: string, lensColor?: string) => {
    const model = getModel(modelId);
    if (!model || !generatorRef.current) return;

    generatorRef.current.updateModelMaterials(model, frameColor, lensColor);
  }, [getModel]);

  // Remove model
  const removeModel = useCallback((modelId: string) => {
    const model = getModel(modelId);
    if (!model || !generatorRef.current) return;

    // Remove from scene
    if (scene && model.mesh.parent) {
      scene.remove(model.mesh);
    }

    // Dispose resources
    generatorRef.current.disposeModel(model);

    // Update collection
    setCollection(prev => ({
      ...prev,
      models: new Map([...prev.models].filter(([key]) => key !== modelId)),
      activeModel: prev.activeModel === modelId ? null : prev.activeModel,
    }));
  }, [getModel, scene]);

  // Clear all models
  const clearAllModels = useCallback(() => {
    collection.models.forEach((model, id) => {
      removeModel(id);
    });
  }, [collection.models, removeModel]);

  // Get loading progress
  const getLoadingProgress = useCallback((): number => {
    const totalModels = SAMPLE_GLASSES_MODEL_DATA.length;
    const loadedModels = collection.models.size;
    return totalModels > 0 ? loadedModels / totalModels : 0;
  }, [collection.models.size]);

  // Check if any models are loading
  const isLoading = useCallback((): boolean => {
    return collection.loadingStates.size > 0;
  }, [collection.loadingStates.size]);

  // Get available models list
  const getAvailableModels = useCallback((): GlassesModelData[] => {
    return Array.from(collection.models.values()).map(model => model.data);
  }, [collection.models]);

  // Position model at coordinates
  const positionModel = useCallback((modelId: string, position: THREE.Vector3, rotation?: THREE.Euler, scale?: number) => {
    const model = getModel(modelId);
    if (!model) {
      console.warn('[useGlassesModels] positionModel: Model not found:', modelId);
      return;
    }

    console.log('[useGlassesModels] positionModel:', modelId, 'pos:', position, 'visible:', model.mesh.visible);
    
    model.mesh.position.copy(position);
    
    if (rotation) {
      model.mesh.rotation.copy(rotation);
    }
    
    if (scale !== undefined) {
      model.mesh.scale.setScalar(scale);
    }
  }, [getModel]);

  return {
    collection,
    loadModel,
    setActiveModel,
    getModel,
    getActiveModel,
    updateModelMaterials,
    removeModel,
    clearAllModels,
    positionModel,
    getLoadingProgress,
    isLoading,
    getAvailableModels,
    templates: SAMPLE_GLASSES_MODEL_DATA,
  };
};
