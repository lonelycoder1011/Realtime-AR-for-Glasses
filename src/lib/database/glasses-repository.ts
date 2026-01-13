// Glasses repository for database operations

import prisma, { 
  createPaginationParams, 
  createSearchCondition, 
  createPriceRangeCondition,
  createArrayFilterCondition,
  createOrderByCondition,
  excludeDeleted 
} from './prisma';
import { 
  GlassesModel, 
  GlassesSearchParams, 
  GlassesSearchResult, 
  CreateGlassesRequest, 
  UpdateGlassesRequest,
  GlassesCategory,
  FrameType,
  LensMaterial 
} from '@/types/database';
import { Prisma } from '@prisma/client';

export class GlassesRepository {
  
  /**
   * Get all glasses with optional filtering and pagination
   */
  async findMany(params: GlassesSearchParams = {}): Promise<GlassesSearchResult> {
    const {
      query = '',
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = params;

    // Build where conditions
    const whereConditions: Prisma.GlassesWhereInput = {
      ...excludeDeleted(),
      ...this.buildFilterConditions(filters),
    };

    // Add search conditions
    if (query.trim()) {
      const searchCondition = createSearchCondition(query, ['name', 'description']);
      whereConditions.AND = [
        whereConditions.AND || {},
        searchCondition
      ].filter(Boolean);
    }

    // Get pagination params
    const paginationParams = createPaginationParams(page, limit);
    
    // Execute queries in parallel
    const [glasses, total, filterData] = await Promise.all([
      // Get glasses with relations
      prisma.glasses.findMany({
        where: whereConditions,
        include: {
          brand: true,
          inventory: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: createOrderByCondition(sortBy, sortOrder),
        ...paginationParams,
      }),
      
      // Get total count
      prisma.glasses.count({
        where: whereConditions,
      }),
      
      // Get filter aggregations
      this.getFilterAggregations(),
    ]);

    // Transform results
    const transformedGlasses = glasses.map(this.transformGlassesModel);

    return {
      glasses: transformedGlasses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: filterData,
    };
  }

  /**
   * Get glasses by ID
   */
  async findById(id: number): Promise<GlassesModel | null> {
    const glasses = await prisma.glasses.findFirst({
      where: {
        id,
        ...excludeDeleted(),
      },
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
    });

    return glasses ? this.transformGlassesModel(glasses) : null;
  }

  /**
   * Create new glasses
   */
  async create(data: CreateGlassesRequest): Promise<GlassesModel> {
    // First, ensure brand exists or create it
    const brand = await this.ensureBrandExists(data.brand);

    const glasses = await prisma.glasses.create({
      data: {
        name: data.name,
        brandId: brand.id,
        price: data.price,
        description: data.description,
        category: data.category,
        frameType: data.frameType,
        lensMaterial: data.lensMaterial,
        frameColor: data.frameColor,
        lensColor: data.lensColor,
        modelPath: data.modelPath,
        thumbnailUrl: data.thumbnailUrl,
        images: data.images || [],
        dimensions: data.dimensions as Prisma.JsonObject,
        materials: data.materials as Prisma.JsonObject,
        tags: data.tags || [],
      },
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
    });

    return this.transformGlassesModel(glasses);
  }

  /**
   * Update glasses
   */
  async update(data: UpdateGlassesRequest): Promise<GlassesModel | null> {
    const { id, brand, ...updateData } = data;

    // Handle brand update if provided
    let brandId: number | undefined;
    if (brand) {
      const brandRecord = await this.ensureBrandExists(brand);
      brandId = brandRecord.id;
    }

    const glasses = await prisma.glasses.update({
      where: { id },
      data: {
        ...updateData,
        ...(brandId && { brandId }),
        ...(updateData.dimensions && { dimensions: updateData.dimensions as Prisma.JsonObject }),
        ...(updateData.materials && { materials: updateData.materials as Prisma.JsonObject }),
      },
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
    });

    return this.transformGlassesModel(glasses);
  }

  /**
   * Delete glasses (soft delete)
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.glasses.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get popular glasses
   */
  async getPopular(limit: number = 10): Promise<GlassesModel[]> {
    const glasses = await prisma.glasses.findMany({
      where: excludeDeleted(),
      include: {
        brand: true,
        inventory: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        {
          reviews: {
            _count: 'desc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
      take: limit,
    });

    return glasses.map(this.transformGlassesModel);
  }

  /**
   * Get recently added glasses
   */
  async getRecent(limit: number = 10): Promise<GlassesModel[]> {
    const glasses = await prisma.glasses.findMany({
      where: excludeDeleted(),
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return glasses.map(this.transformGlassesModel);
  }

  /**
   * Get glasses by brand
   */
  async getByBrand(brandName: string, limit: number = 20): Promise<GlassesModel[]> {
    const glasses = await prisma.glasses.findMany({
      where: {
        ...excludeDeleted(),
        brand: {
          name: {
            equals: brandName,
            mode: 'insensitive',
          },
        },
      },
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
      take: limit,
    });

    return glasses.map(this.transformGlassesModel);
  }

  /**
   * Get glasses by category
   */
  async getByCategory(category: GlassesCategory, limit: number = 20): Promise<GlassesModel[]> {
    const glasses = await prisma.glasses.findMany({
      where: {
        ...excludeDeleted(),
        category,
      },
      include: {
        brand: true,
        inventory: true,
        reviews: true,
      },
      take: limit,
    });

    return glasses.map(this.transformGlassesModel);
  }

  /**
   * Build filter conditions from search filters
   */
  private buildFilterConditions(filters: any): Prisma.GlassesWhereInput {
    const conditions: Prisma.GlassesWhereInput = {};

    // Category filter
    if (filters.category && filters.category.length > 0) {
      Object.assign(conditions, createArrayFilterCondition(filters.category, 'category'));
    }

    // Frame type filter
    if (filters.frameType && filters.frameType.length > 0) {
      Object.assign(conditions, createArrayFilterCondition(filters.frameType, 'frameType'));
    }

    // Lens material filter
    if (filters.lensMaterial && filters.lensMaterial.length > 0) {
      Object.assign(conditions, createArrayFilterCondition(filters.lensMaterial, 'lensMaterial'));
    }

    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      conditions.brand = {
        name: {
          in: filters.brand,
        },
      };
    }

    // Price range filter
    if (filters.priceRange) {
      const priceCondition = createPriceRangeCondition(
        filters.priceRange.min,
        filters.priceRange.max
      );
      if (priceCondition) {
        conditions.price = priceCondition;
      }
    }

    // Frame colors filter
    if (filters.frameColors && filters.frameColors.length > 0) {
      Object.assign(conditions, createArrayFilterCondition(filters.frameColors, 'frameColor'));
    }

    // Lens colors filter
    if (filters.lensColors && filters.lensColors.length > 0) {
      Object.assign(conditions, createArrayFilterCondition(filters.lensColors, 'lensColor'));
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      conditions.tags = {
        hasEvery: filters.tags,
      };
    }

    return conditions;
  }

  /**
   * Get filter aggregations for search results
   */
  private async getFilterAggregations() {
    const [
      categories,
      frameTypes,
      lensMaterials,
      brands,
      priceRange,
      frameColors,
      lensColors,
    ] = await Promise.all([
      // Available categories
      prisma.glasses.groupBy({
        by: ['category'],
        where: excludeDeleted(),
        _count: true,
      }),
      
      // Available frame types
      prisma.glasses.groupBy({
        by: ['frameType'],
        where: excludeDeleted(),
        _count: true,
      }),
      
      // Available lens materials
      prisma.glasses.groupBy({
        by: ['lensMaterial'],
        where: excludeDeleted(),
        _count: true,
      }),
      
      // Available brands
      prisma.glasses.groupBy({
        by: ['brandId'],
        where: excludeDeleted(),
        _count: true,
      }).then(async (results) => {
        const brandIds = results.map(r => r.brandId);
        const brands = await prisma.brand.findMany({
          where: { id: { in: brandIds } },
          select: { name: true },
        });
        return brands.map(b => b.name);
      }),
      
      // Price range
      prisma.glasses.aggregate({
        where: excludeDeleted(),
        _min: { price: true },
        _max: { price: true },
      }),
      
      // Available frame colors
      prisma.glasses.groupBy({
        by: ['frameColor'],
        where: excludeDeleted(),
        _count: true,
      }),
      
      // Available lens colors
      prisma.glasses.groupBy({
        by: ['lensColor'],
        where: excludeDeleted(),
        _count: true,
      }),
    ]);

    return {
      availableCategories: categories.map(c => c.category as GlassesCategory),
      availableFrameTypes: frameTypes.map(f => f.frameType as FrameType),
      availableLensMaterials: lensMaterials.map(l => l.lensMaterial as LensMaterial),
      availableBrands: brands,
      priceRange: {
        min: Number(priceRange._min.price) || 0,
        max: Number(priceRange._max.price) || 1000,
      },
      availableColors: {
        frame: frameColors.map(c => c.frameColor),
        lens: lensColors.map(c => c.lensColor),
      },
    };
  }

  /**
   * Ensure brand exists, create if not
   */
  private async ensureBrandExists(brandName: string) {
    let brand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: brandName,
          mode: 'insensitive',
        },
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
        },
      });
    }

    return brand;
  }

  /**
   * Transform Prisma model to application model
   */
  private transformGlassesModel(glasses: any): GlassesModel {
    return {
      id: glasses.id,
      name: glasses.name,
      brand: glasses.brand.name,
      price: Number(glasses.price),
      description: glasses.description,
      category: glasses.category as GlassesCategory,
      frameType: glasses.frameType as FrameType,
      lensMaterial: glasses.lensMaterial as LensMaterial,
      frameColor: glasses.frameColor,
      lensColor: glasses.lensColor,
      modelPath: glasses.modelPath,
      thumbnailUrl: glasses.thumbnailUrl,
      images: glasses.images,
      dimensions: glasses.dimensions as any,
      materials: glasses.materials as any,
      tags: glasses.tags,
      isActive: glasses.isActive,
      createdAt: glasses.createdAt,
      updatedAt: glasses.updatedAt,
    };
  }
}
