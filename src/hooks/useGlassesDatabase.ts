import { useState, useCallback } from 'react';
import {
  GlassesModel,
  GlassesSearchParams,
  GlassesSearchResult,
  CreateGlassesRequest,
  UpdateGlassesRequest,
  ApiResponse,
} from '@/types/database';

interface UseGlassesDatabaseOptions {
  autoLoad?: boolean;
}

export const useGlassesDatabase = (options: UseGlassesDatabaseOptions = {}) => {
  const { autoLoad = false } = options;

  const [glasses, setGlasses] = useState<GlassesModel[]>([]);
  const [searchResult, setSearchResult] = useState<GlassesSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search glasses
  const searchGlasses = useCallback(async (params: GlassesSearchParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Add search parameters
      if (params.query) queryParams.append('query', params.query);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      // Add filter parameters
      if (params.filters) {
        const { filters } = params;
        if (filters.category) queryParams.append('category', filters.category.join(','));
        if (filters.frameType) queryParams.append('frameType', filters.frameType.join(','));
        if (filters.lensMaterial) queryParams.append('lensMaterial', filters.lensMaterial.join(','));
        if (filters.brand) queryParams.append('brand', filters.brand.join(','));
        if (filters.frameColors) queryParams.append('frameColors', filters.frameColors.join(','));
        if (filters.lensColors) queryParams.append('lensColors', filters.lensColors.join(','));
        if (filters.tags) queryParams.append('tags', filters.tags.join(','));
        
        if (filters.priceRange) {
          if (filters.priceRange.min !== undefined) {
            queryParams.append('priceMin', filters.priceRange.min.toString());
          }
          if (filters.priceRange.max !== undefined) {
            queryParams.append('priceMax', filters.priceRange.max.toString());
          }
        }
      }

      const response = await fetch(`/api/glasses?${queryParams.toString()}`);
      const result: ApiResponse<GlassesSearchResult> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to search glasses');
      }

      setSearchResult(result.data!);
      setGlasses(result.data!.glasses);
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get glasses by ID
  const getGlassesById = useCallback(async (id: number): Promise<GlassesModel | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/glasses/${id}`);
      const result: ApiResponse<GlassesModel> = await response.json();

      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.error || 'Failed to fetch glasses');
      }

      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create glasses
  const createGlasses = useCallback(async (data: CreateGlassesRequest): Promise<GlassesModel> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/glasses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<GlassesModel> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create glasses');
      }

      // Update local state
      setGlasses(prev => [result.data!, ...prev]);
      
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update glasses
  const updateGlasses = useCallback(async (data: UpdateGlassesRequest): Promise<GlassesModel> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/glasses/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<GlassesModel> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update glasses');
      }

      // Update local state
      setGlasses(prev => 
        prev.map(item => item.id === data.id ? result.data! : item)
      );

      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete glasses
  const deleteGlasses = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/glasses/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete glasses');
      }

      // Update local state
      setGlasses(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get popular glasses
  const getPopularGlasses = useCallback(async (limit: number = 10) => {
    return searchGlasses({
      sortBy: 'popularity',
      sortOrder: 'desc',
      limit,
    });
  }, [searchGlasses]);

  // Get recent glasses
  const getRecentGlasses = useCallback(async (limit: number = 10) => {
    return searchGlasses({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit,
    });
  }, [searchGlasses]);

  // Get glasses by category
  const getGlassesByCategory = useCallback(async (category: string, limit: number = 20) => {
    return searchGlasses({
      filters: { category: [category] },
      limit,
    });
  }, [searchGlasses]);

  // Get glasses by brand
  const getGlassesByBrand = useCallback(async (brand: string, limit: number = 20) => {
    return searchGlasses({
      filters: { brand: [brand] },
      limit,
    });
  }, [searchGlasses]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setGlasses([]);
    setSearchResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    // State
    glasses,
    searchResult,
    isLoading,
    error,

    // Actions
    searchGlasses,
    getGlassesById,
    createGlasses,
    updateGlasses,
    deleteGlasses,

    // Convenience methods
    getPopularGlasses,
    getRecentGlasses,
    getGlassesByCategory,
    getGlassesByBrand,

    // Utilities
    clearError,
    reset,

    // Status
    hasData: glasses.length > 0,
    isEmpty: glasses.length === 0 && !isLoading,
  };
};
