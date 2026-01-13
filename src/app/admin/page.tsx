'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlassesList, GlassesForm } from '@/components/admin';
import { useGlassesDatabase } from '@/hooks/useGlassesDatabase';
import { 
  GlassesModel, 
  CreateGlassesRequest, 
  UpdateGlassesRequest 
} from '@/types/database';
import { ArrowLeft, Database, Plus, Search } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function AdminPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGlasses, setSelectedGlasses] = useState<GlassesModel | null>(null);

  const {
    glasses,
    searchResult,
    isLoading,
    error,
    searchGlasses,
    createGlasses,
    updateGlasses,
    deleteGlasses,
    getGlassesById,
  } = useGlassesDatabase();

  // Load initial data
  useEffect(() => {
    searchGlasses({ page: 1, limit: 20 });
  }, []);

  // Handle create new glasses
  const handleCreate = () => {
    setSelectedGlasses(null);
    setViewMode('create');
  };

  // Handle edit glasses
  const handleEdit = (glasses: GlassesModel) => {
    setSelectedGlasses(glasses);
    setViewMode('edit');
  };

  // Handle view glasses
  const handleView = (glasses: GlassesModel) => {
    setSelectedGlasses(glasses);
    setViewMode('view');
  };

  // Handle delete glasses
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this glasses?')) {
      try {
        await deleteGlasses(id);
        // Refresh the list
        searchGlasses({ page: 1, limit: 20 });
      } catch (error) {
        console.error('Failed to delete glasses:', error);
        alert('Failed to delete glasses. Please try again.');
      }
    }
  };

  // Handle save glasses (create or update)
  const handleSave = async (data: CreateGlassesRequest | UpdateGlassesRequest) => {
    try {
      if ('id' in data) {
        // Update existing glasses
        await updateGlasses(data as UpdateGlassesRequest);
      } else {
        // Create new glasses
        await createGlasses(data as CreateGlassesRequest);
      }
      
      // Return to list view and refresh
      setViewMode('list');
      setSelectedGlasses(null);
      searchGlasses({ page: 1, limit: 20 });
    } catch (error) {
      console.error('Failed to save glasses:', error);
      alert('Failed to save glasses. Please try again.');
    }
  };

  // Handle cancel form
  const handleCancel = () => {
    setViewMode('list');
    setSelectedGlasses(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Database className="h-8 w-8" />
                  Glasses Database Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your glasses catalog, upload 3D models, and organize inventory
                </p>
              </div>
            </div>
            
            {viewMode === 'list' && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Glasses
              </Button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Admin</span>
            <span>/</span>
            <span>Glasses Database</span>
            {viewMode !== 'list' && (
              <>
                <span>/</span>
                <span className="capitalize">{viewMode}</span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {viewMode === 'list' && (
          <GlassesList
            glasses={glasses}
            searchResult={searchResult}
            isLoading={isLoading}
            onSearch={searchGlasses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onCreate={handleCreate}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <GlassesForm
            glasses={selectedGlasses}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}

        {viewMode === 'view' && selectedGlasses && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Glasses Details</span>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(selectedGlasses)} size="sm">
                    Edit
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Back to List
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  {selectedGlasses.thumbnailUrl ? (
                    <img
                      src={selectedGlasses.thumbnailUrl}
                      alt={selectedGlasses.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <Database className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Additional Images */}
                  {selectedGlasses.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {selectedGlasses.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${selectedGlasses.name} ${index + 1}`}
                          className="aspect-square object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGlasses.name}</h2>
                    <p className="text-lg text-gray-600">{selectedGlasses.brand}</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      ${selectedGlasses.price.toFixed(2)}
                    </p>
                  </div>

                  {selectedGlasses.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-700">{selectedGlasses.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Category</h3>
                      <p className="capitalize">{selectedGlasses.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Frame Type</h3>
                      <p className="capitalize">{selectedGlasses.frameType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Lens Material</h3>
                      <p className="capitalize">{selectedGlasses.lensMaterial.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Colors</h3>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: selectedGlasses.frameColor }}
                          />
                          <span className="text-sm">Frame</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: selectedGlasses.lensColor }}
                          />
                          <span className="text-sm">Lens</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Dimensions (mm)</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Lens Width: {selectedGlasses.dimensions.lensWidth}</div>
                      <div>Bridge Width: {selectedGlasses.dimensions.bridgeWidth}</div>
                      <div>Temple Length: {selectedGlasses.dimensions.templeLength}</div>
                      <div>Frame Width: {selectedGlasses.dimensions.frameWidth}</div>
                      <div>Frame Height: {selectedGlasses.dimensions.frameHeight}</div>
                    </div>
                  </div>

                  {selectedGlasses.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGlasses.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    <div>Created: {new Date(selectedGlasses.createdAt).toLocaleDateString()}</div>
                    <div>Updated: {new Date(selectedGlasses.updatedAt).toLocaleDateString()}</div>
                    <div>Model Path: {selectedGlasses.modelPath}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {viewMode === 'list' && searchResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {searchResult.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Glasses</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {searchResult.filters.availableBrands.length}
                  </div>
                  <div className="text-sm text-gray-600">Brands</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {searchResult.filters.availableCategories.length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${searchResult.filters.priceRange.min} - ${searchResult.filters.priceRange.max}
                  </div>
                  <div className="text-sm text-gray-600">Price Range</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
