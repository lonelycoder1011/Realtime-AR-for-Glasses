'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GlassesModel, 
  GlassesSearchParams,
  GlassesSearchResult 
} from '@/types/database';
import { Search, Edit, Trash2, Eye, Plus, Filter } from 'lucide-react';

interface GlassesListProps {
  glasses: GlassesModel[];
  searchResult?: GlassesSearchResult | null;
  isLoading?: boolean;
  onSearch: (params: GlassesSearchParams) => void;
  onEdit: (glasses: GlassesModel) => void;
  onDelete: (id: number) => void;
  onView: (glasses: GlassesModel) => void;
  onCreate: () => void;
}

export const GlassesList: React.FC<GlassesListProps> = ({
  glasses,
  searchResult,
  isLoading = false,
  onSearch,
  onEdit,
  onDelete,
  onView,
  onCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    frameType: '',
    brand: '',
    priceMin: '',
    priceMax: '',
  });

  // Handle search
  const handleSearch = () => {
    const searchParams: GlassesSearchParams = {
      query: searchQuery,
      page: 1,
      limit: 20,
    };

    // Add filters if they exist
    if (Object.values(filters).some(value => value)) {
      searchParams.filters = {};
      
      if (filters.category) searchParams.filters.category = [filters.category];
      if (filters.frameType) searchParams.filters.frameType = [filters.frameType];
      if (filters.brand) searchParams.filters.brand = [filters.brand];
      
      if (filters.priceMin || filters.priceMax) {
        searchParams.filters.priceRange = {
          ...(filters.priceMin && { min: parseFloat(filters.priceMin) }),
          ...(filters.priceMax && { max: parseFloat(filters.priceMax) }),
        };
      }
    }

    onSearch(searchParams);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onSearch({
      query: searchQuery,
      page,
      limit: 20,
      filters: Object.values(filters).some(value => value) ? {
        ...(filters.category && { category: [filters.category] }),
        ...(filters.frameType && { frameType: [filters.frameType] }),
        ...(filters.brand && { brand: [filters.brand] }),
        ...(filters.priceMin || filters.priceMax ? {
          priceRange: {
            ...(filters.priceMin && { min: parseFloat(filters.priceMin) }),
            ...(filters.priceMax && { max: parseFloat(filters.priceMax) }),
          }
        } : {}),
      } : undefined,
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: '',
      frameType: '',
      brand: '',
      priceMin: '',
      priceMax: '',
    });
    setSearchQuery('');
    onSearch({ page: 1, limit: 20 });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      prescription: 'bg-blue-100 text-blue-800',
      sunglasses: 'bg-yellow-100 text-yellow-800',
      reading: 'bg-green-100 text-green-800',
      computer: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800',
      fashion: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Glasses Management</h2>
          <p className="text-gray-600">
            {searchResult ? `${searchResult.total} glasses found` : `${glasses.length} glasses`}
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Glasses
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search glasses by name, brand, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="Category"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Frame Type</label>
                  <Input
                    placeholder="Frame Type"
                    value={filters.frameType}
                    onChange={(e) => setFilters(prev => ({ ...prev, frameType: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <Input
                    placeholder="Brand"
                    value={filters.brand}
                    onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Price</label>
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Price</label>
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-5 flex gap-2">
                  <Button onClick={handleSearch} size="sm">
                    Apply Filters
                  </Button>
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Glasses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : glasses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No glasses found</h3>
              <p className="text-sm">
                {searchQuery || Object.values(filters).some(v => v)
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first glasses'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {glasses.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.brand}</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {formatPrice(item.price)}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {item.frameType.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.lensMaterial}
                    </Badge>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {item.id}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {searchResult && searchResult.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {[...Array(Math.min(5, searchResult.totalPages))].map((_, index) => {
              const page = index + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === searchResult.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
