// API routes for individual glasses operations

import { NextRequest, NextResponse } from 'next/server';
import { GlassesRepository } from '@/lib/database/glasses-repository';
import { UpdateGlassesRequest, ValidationError } from '@/types/database';
import { z } from 'zod';

const glassesRepository = new GlassesRepository();

// Validation schema for updates
const updateGlassesSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  brand: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  category: z.enum(['prescription', 'sunglasses', 'reading', 'computer', 'safety', 'fashion']).optional(),
  frameType: z.enum(['full_rim', 'semi_rimless', 'rimless', 'browline', 'aviator', 'wayfarer', 'round', 'square', 'oval', 'cat_eye']).optional(),
  lensMaterial: z.enum(['plastic', 'polycarbonate', 'trivex', 'high_index', 'glass', 'cr39']).optional(),
  frameColor: z.string().min(1).optional(),
  lensColor: z.string().min(1).optional(),
  modelPath: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  dimensions: z.object({
    lensWidth: z.number().positive(),
    bridgeWidth: z.number().positive(),
    templeLength: z.number().positive(),
    frameWidth: z.number().positive(),
    frameHeight: z.number().positive(),
  }).optional(),
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
  }).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/glasses/[id] - Get glasses by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid glasses ID',
      }, { status: 400 });
    }

    const glasses = await glassesRepository.findById(id);

    if (!glasses) {
      return NextResponse.json({
        success: false,
        error: 'Glasses not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: glasses,
    });

  } catch (error) {
    console.error('Error fetching glasses:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PUT /api/glasses/[id] - Update glasses
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid glasses ID',
      }, { status: 400 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateGlassesSchema.safeParse(body);
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

    // Update glasses
    const updateData: UpdateGlassesRequest = {
      id,
      ...validationResult.data,
    };

    const glasses = await glassesRepository.update(updateData);

    if (!glasses) {
      return NextResponse.json({
        success: false,
        error: 'Glasses not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: glasses,
      message: 'Glasses updated successfully',
    });

  } catch (error) {
    console.error('Error updating glasses:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// DELETE /api/glasses/[id] - Delete glasses
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid glasses ID',
      }, { status: 400 });
    }

    const success = await glassesRepository.delete(id);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Glasses not found or could not be deleted',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Glasses deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting glasses:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
