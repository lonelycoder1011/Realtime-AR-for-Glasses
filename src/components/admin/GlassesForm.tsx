'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  GlassesModel, 
  CreateGlassesRequest, 
  UpdateGlassesRequest,
  GlassesCategory,
  FrameType,
  LensMaterial,
  GLASSES_CATEGORIES,
  FRAME_TYPES,
  LENS_MATERIALS,
  DEFAULT_GLASSES_DIMENSIONS,
  POPULAR_FRAME_COLORS,
  POPULAR_LENS_COLORS
} from '@/types/database';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Save, Upload, X, Plus } from 'lucide-react';

interface GlassesFormProps {
  glasses?: GlassesModel | null;
  onSave: (data: CreateGlassesRequest | UpdateGlassesRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const GlassesForm: React.FC<GlassesFormProps> = ({
  glasses,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateGlassesRequest>({
    name: '',
    brand: '',
    price: 0,
    description: '',
    category: GlassesCategory.PRESCRIPTION,
    frameType: FrameType.FULL_RIM,
    lensMaterial: LensMaterial.PLASTIC,
    frameColor: POPULAR_FRAME_COLORS[0],
    lensColor: POPULAR_LENS_COLORS[0],
    modelPath: '',
    thumbnailUrl: '',
    images: [],
    dimensions: DEFAULT_GLASSES_DIMENSIONS,
    materials: {
      frame: {
        primary: 'Acetate',
        finish: 'Matte',
      },
      lens: {
        material: 'Polycarbonate',
      },
      hardware: {
        hinges: 'Spring',
        screws: 'Stainless Steel',
      },
    },
    tags: [],
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { uploadFile, uploadImageWithPreview, isUploading } = useFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  // Initialize form with existing glasses data
  useEffect(() => {
    if (glasses) {
      setFormData({
        name: glasses.name,
        brand: glasses.brand,
        price: glasses.price,
        description: glasses.description || '',
        category: glasses.category,
        frameType: glasses.frameType,
        lensMaterial: glasses.lensMaterial,
        frameColor: glasses.frameColor,
        lensColor: glasses.lensColor,
        modelPath: glasses.modelPath,
        thumbnailUrl: glasses.thumbnailUrl || '',
        images: glasses.images || [],
        dimensions: glasses.dimensions,
        materials: glasses.materials,
        tags: glasses.tags || [],
      });
    }
  }, [glasses]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle nested object changes
  const handleNestedChange = (path: string[], value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData as any;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImageWithPreview(file);
      handleChange('thumbnailUrl', result.uploadedFile.url);
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
    }
  };

  // Handle model file upload
  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, 'model');
      handleChange('modelPath', result.url);
    } catch (error) {
      console.error('Failed to upload model:', error);
    }
  };

  // Handle additional images upload
  const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const results = await Promise.all(
        files.map(file => uploadImageWithPreview(file))
      );
      const imageUrls = results.map(result => result.uploadedFile.url);
      handleChange('images', [...formData.images, ...imageUrls]);
    } catch (error) {
      console.error('Failed to upload images:', error);
    }
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Remove image
  const removeImage = (imageToRemove: string) => {
    handleChange('images', formData.images.filter(img => img !== imageToRemove));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.modelPath.trim()) newErrors.modelPath = '3D model is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (glasses) {
        // Update existing glasses
        await onSave({ id: glasses.id, ...formData } as UpdateGlassesRequest);
      } else {
        // Create new glasses
        await onSave(formData);
      }
    } catch (error) {
      console.error('Failed to save glasses:', error);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {glasses ? 'Edit Glasses' : 'Add New Glasses'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter glasses name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Enter brand name"
                className={errors.brand ? 'border-red-500' : ''}
              />
              {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GLASSES_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frameType">Frame Type</Label>
              <Select value={formData.frameType} onValueChange={(value) => handleChange('frameType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lensMaterial">Lens Material</Label>
              <Select value={formData.lensMaterial} onValueChange={(value) => handleChange('lensMaterial', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENS_MATERIALS.map(material => (
                    <SelectItem key={material} value={material}>
                      {material.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter glasses description"
              rows={3}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frameColor">Frame Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.frameColor}
                  onChange={(e) => handleChange('frameColor', e.target.value)}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.frameColor}
                  onChange={(e) => handleChange('frameColor', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lensColor">Lens Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.lensColor}
                  onChange={(e) => handleChange('lensColor', e.target.value)}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.lensColor}
                  onChange={(e) => handleChange('lensColor', e.target.value)}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div>
              <Label>3D Model File *</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleModelUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.modelPath && (
                  <p className="text-sm text-green-600 mt-1">✓ Model uploaded: {formData.modelPath}</p>
                )}
                {errors.modelPath && <p className="text-red-500 text-sm mt-1">{errors.modelPath}</p>}
              </div>
            </div>

            <div>
              <Label>Thumbnail Image</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.thumbnailUrl && (
                  <div className="mt-2">
                    <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Additional Images</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={image} alt={`Image ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div>
            <Label>Dimensions (mm)</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              <div>
                <Label className="text-xs">Lens Width</Label>
                <Input
                  type="number"
                  value={formData.dimensions.lensWidth}
                  onChange={(e) => handleNestedChange(['dimensions', 'lensWidth'], parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">Bridge Width</Label>
                <Input
                  type="number"
                  value={formData.dimensions.bridgeWidth}
                  onChange={(e) => handleNestedChange(['dimensions', 'bridgeWidth'], parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">Temple Length</Label>
                <Input
                  type="number"
                  value={formData.dimensions.templeLength}
                  onChange={(e) => handleNestedChange(['dimensions', 'templeLength'], parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">Frame Width</Label>
                <Input
                  type="number"
                  value={formData.dimensions.frameWidth}
                  onChange={(e) => handleNestedChange(['dimensions', 'frameWidth'], parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">Frame Height</Label>
                <Input
                  type="number"
                  value={formData.dimensions.frameHeight}
                  onChange={(e) => handleNestedChange(['dimensions', 'frameHeight'], parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading || isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {glasses ? 'Update' : 'Create'} Glasses
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
