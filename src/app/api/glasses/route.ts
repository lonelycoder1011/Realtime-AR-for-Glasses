// API routes for glasses CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { GlassesRepository } from '@/lib/database/glasses-repository';
import { 
  GlassesSearchParams, 
  CreateGlassesRequest, 
  ApiResponse,
  ValidationError 
} from '@/types/database';
import { z } from 'zod';

const glassesRepository = new GlassesRepository();

// Validation schemas
const createGlassesSchema = z.object({
  name: z.string().min(1).max(255),
  brand: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().optional(),
  category: z.enum(['prescription', 'sunglasses', 'reading', 'computer', 'safety', 'fashion']),
  frameType: z.enum(['full_rim', 'semi_rimless', 'rimless', 'browline', 'aviator', 'wayfarer', 'round', 'square', 'oval', 'cat_eye']),
  lensMaterial: z.enum(['plastic', 'polycarbonate', 'trivex', 'high_index', 'glass', 'cr39']),
  frameColor: z.string().min(1),
  lensColor: z.string().min(1),
  modelPath: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  dimensions: z.object({
    lensWidth: z.number().positive(),
    bridgeWidth: z.number().positive(),
    templeLength: z.number().positive(),
    frameWidth: z.number().positive(),
    frameHeight: z.number().positive(),
  }),
  materials: z.object({
    frame: z.object({
      primary: z.string(),
      secondary: z.string().optional(),
      finish: z.string(),
    }),
    lens: z.object({
      material: z.string(),
      coating: z.string().optional(),
      tint: z.string().optional(),
    }),
    hardware: z.object({
      hinges: z.string(),
      screws: z.string(),
      nosePads: z.string().optional(),
    }),
  }),
  tags: z.array(z.string()).optional(),
});

const searchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.array(z.string()).optional(),
  frameType: z.array(z.string()).optional(),
  lensMaterial: z.array(z.string()).optional(),
  brand: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  frameColors: z.array(z.string()).optional(),
  lensColors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'price', 'brand', 'createdAt', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// GET /api/glasses - Search and list glasses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const queryParams: any = {};
    
    // Simple parameters
    if (searchParams.get('query')) queryParams.query = searchParams.get('query');
    if (searchParams.get('sortBy')) queryParams.sortBy = searchParams.get('sortBy');
    if (searchParams.get('sortOrder')) queryParams.sortOrder = searchParams.get('sortOrder');
    if (searchParams.get('page')) queryParams.page = parseInt(searchParams.get('page')!);
    if (searchParams.get('limit')) queryParams.limit = parseInt(searchParams.get('limit')!);
    
    // Array parameters
    if (searchParams.get('category')) queryParams.category = searchParams.get('category')!.split(',');
    if (searchParams.get('frameType')) queryParams.frameType = searchParams.get('frameType')!.split(',');
    if (searchParams.get('lensMaterial')) queryParams.lensMaterial = searchParams.get('lensMaterial')!.split(',');
    if (searchParams.get('brand')) queryParams.brand = searchParams.get('brand')!.split(',');
    if (searchParams.get('frameColors')) queryParams.frameColors = searchParams.get('frameColors')!.split(',');
    if (searchParams.get('lensColors')) queryParams.lensColors = searchParams.get('lensColors')!.split(',');
    if (searchParams.get('tags')) queryParams.tags = searchParams.get('tags')!.split(',');
    
    // Price range
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    if (priceMin || priceMax) {
      queryParams.priceRange = {
        ...(priceMin && { min: parseFloat(priceMin) }),
        ...(priceMax && { max: parseFloat(priceMax) }),
      };
    }

    // Validate parameters
    const validationResult = searchParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    // Build search parameters
    const searchParams_: GlassesSearchParams = {
      query: queryParams.query,
      filters: {
        category: queryParams.category,
        frameType: queryParams.frameType,
        lensMaterial: queryParams.lensMaterial,
        brand: queryParams.brand,
        priceRange: queryParams.priceRange,
        frameColors: queryParams.frameColors,
        lensColors: queryParams.lensColors,
        tags: queryParams.tags,
      },
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
      page: queryParams.page || 1,
      limit: queryParams.limit || 20,
    };

    // Execute search
    const result = await glassesRepository.findMany(searchParams_);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error searching glasses:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/glasses - Create new glasses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createGlassesSchema.safeParse(body);
    if (!validationResult.success) {
      const errors: ValidationError[] = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: errors,
      }, { status: 400 });
    }

    // Create glasses
    const glasses = await glassesRepository.create(validationResult.data as CreateGlassesRequest);

    return NextResponse.json({
      success: true,
      data: glasses,
      message: 'Glasses created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating glasses:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
