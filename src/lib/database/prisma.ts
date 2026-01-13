// Prisma client configuration and utilities

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma;

// Database connection utilities
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    return false;
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    };
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Pagination helper
export function createPaginationParams(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Search helper for full-text search
export function createSearchCondition(query: string, fields: string[]) {
  if (!query.trim()) return {};
  
  const searchTerms = query.trim().split(/\s+/);
  
  return {
    OR: fields.flatMap(field => 
      searchTerms.map(term => ({
        [field]: {
          contains: term,
          mode: 'insensitive' as const,
        },
      }))
    ),
  };
}

// Price range filter helper
export function createPriceRangeCondition(min?: number, max?: number) {
  const conditions: any = {};
  
  if (min !== undefined) {
    conditions.gte = min;
  }
  
  if (max !== undefined && max !== Infinity) {
    conditions.lte = max;
  }
  
  return Object.keys(conditions).length > 0 ? conditions : undefined;
}

// Array filter helper
export function createArrayFilterCondition<T>(values: T[], field: string) {
  if (!values || values.length === 0) return {};
  
  return {
    [field]: {
      in: values,
    },
  };
}

// Soft delete helper
export function excludeDeleted() {
  return {
    isActive: true,
  };
}

// Order by helper
export function createOrderByCondition(
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  return {
    [sortBy]: sortOrder,
  };
}
