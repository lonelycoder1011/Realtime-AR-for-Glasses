// API route for file uploads (images, 3D models)

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/database/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_MODEL_TYPES = ['model/gltf+json', 'model/gltf-binary', 'application/octet-stream'];

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const uuid = uuidv4();
  return `${name}_${uuid}${ext}`;
}

// Validate file type
function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// POST /api/upload - Upload files
export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' or 'model'

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      }, { status: 400 });
    }

    // Validate file type based on upload type
    let allowedTypes: string[];
    let subDir: string;

    switch (type) {
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        subDir = 'images';
        break;
      case 'model':
        allowedTypes = ALLOWED_MODEL_TYPES;
        subDir = 'models';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid upload type. Must be "image" or "model"',
        }, { status: 400 });
    }

    if (!validateFileType(file, allowedTypes)) {
      return NextResponse.json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      }, { status: 400 });
    }

    // Create subdirectory if it doesn't exist
    const uploadSubDir = path.join(UPLOAD_DIR, subDir);
    if (!existsSync(uploadSubDir)) {
      await mkdir(uploadSubDir, { recursive: true });
    }

    // Generate unique filename and save file
    const filename = generateFilename(file.name);
    const filepath = path.join(uploadSubDir, filename);
    const relativePath = path.join('uploads', subDir, filename);
    const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save file record to database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: relativePath,
        url: publicUrl,
        uploadedBy: 'admin', // TODO: Get from session
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalName,
        url: uploadedFile.url,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        uploadedAt: uploadedFile.uploadedAt,
      },
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// GET /api/upload - List uploaded files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by file type
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Build where condition
    const where: any = {};
    if (type) {
      if (type === 'image') {
        where.mimeType = { in: ALLOWED_IMAGE_TYPES };
      } else if (type === 'model') {
        where.mimeType = { in: ALLOWED_MODEL_TYPES };
      }
    }

    // Get files with pagination
    const [files, total] = await Promise.all([
      prisma.uploadedFile.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.uploadedFile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
