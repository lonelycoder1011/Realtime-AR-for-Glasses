// Database types and interfaces for glasses management

export interface GlassesModel {
  id: number;
  name: string;
  brand: string;
  price: number;
  description?: string;
  category: GlassesCategory;
  frameType: FrameType;
  lensMaterial: LensMaterial;
  frameColor: string;
  lensColor: string;
  modelPath: string;
  thumbnailUrl?: string;
  images: string[];
  dimensions: GlassesDimensions;
  materials: GlassesMaterials;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlassesDimensions {
  lensWidth: number;
  bridgeWidth: number;
  templeLength: number;
  frameWidth: number;
  frameHeight: number;
}

export interface GlassesMaterials {
  frame: {
    primary: string;
    secondary?: string;
    finish: string;
  };
  lens: {
    material: string;
    coating?: string;
    tint?: string;
  };
  hardware: {
    hinges: string;
    screws: string;
    nosePads?: string;
  };
}

export enum GlassesCategory {
  PRESCRIPTION = 'prescription',
  SUNGLASSES = 'sunglasses',
  READING = 'reading',
  COMPUTER = 'computer',
  SAFETY = 'safety',
  FASHION = 'fashion',
}

export enum FrameType {
  FULL_RIM = 'full_rim',
  SEMI_RIMLESS = 'semi_rimless',
  RIMLESS = 'rimless',
  BROWLINE = 'browline',
  AVIATOR = 'aviator',
  WAYFARER = 'wayfarer',
  ROUND = 'round',
  SQUARE = 'square',
  OVAL = 'oval',
  CAT_EYE = 'cat_eye',
}

export enum LensMaterial {
  PLASTIC = 'plastic',
  POLYCARBONATE = 'polycarbonate',
  TRIVEX = 'trivex',
  HIGH_INDEX = 'high_index',
  GLASS = 'glass',
  CR39 = 'cr39',
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlassesSearchFilters {
  category?: GlassesCategory[];
  frameType?: FrameType[];
  lensMaterial?: LensMaterial[];
  brand?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  frameColors?: string[];
  lensColors?: string[];
  tags?: string[];
  dimensions?: {
    lensWidth?: { min: number; max: number };
    bridgeWidth?: { min: number; max: number };
    templeLength?: { min: number; max: number };
  };
}

export interface GlassesSearchParams {
  query?: string;
  filters?: GlassesSearchFilters;
  sortBy?: 'name' | 'price' | 'brand' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GlassesSearchResult {
  glasses: GlassesModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    availableCategories: GlassesCategory[];
    availableFrameTypes: FrameType[];
    availableLensMaterials: LensMaterial[];
    availableBrands: string[];
    priceRange: { min: number; max: number };
    availableColors: {
      frame: string[];
      lens: string[];
    };
  };
}

export interface CreateGlassesRequest {
  name: string;
  brand: string;
  price: number;
  description?: string;
  category: GlassesCategory;
  frameType: FrameType;
  lensMaterial: LensMaterial;
  frameColor: string;
  lensColor: string;
  modelPath: string;
  thumbnailUrl?: string;
  images?: string[];
  dimensions: GlassesDimensions;
  materials: GlassesMaterials;
  tags?: string[];
}

export interface UpdateGlassesRequest extends Partial<CreateGlassesRequest> {
  id: number;
}

export interface GlassesCollection {
  id: number;
  name: string;
  description?: string;
  glassesIds: number[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlassesReview {
  id: number;
  glassesId: number;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlassesInventory {
  id: number;
  glassesId: number;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  supplier?: string;
  cost: number;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

// File upload types
export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  cdnUrl?: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
}

// Admin interface types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'editor';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AdminDashboardStats {
  totalGlasses: number;
  totalBrands: number;
  totalCategories: number;
  recentlyAdded: number;
  lowInventory: number;
  averagePrice: number;
  popularCategories: Array<{
    category: GlassesCategory;
    count: number;
  }>;
  topBrands: Array<{
    brand: string;
    count: number;
  }>;
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Default values and constants
export const DEFAULT_GLASSES_DIMENSIONS: GlassesDimensions = {
  lensWidth: 50,
  bridgeWidth: 18,
  templeLength: 140,
  frameWidth: 130,
  frameHeight: 40,
};

export const DEFAULT_SEARCH_PARAMS: Required<GlassesSearchParams> = {
  query: '',
  filters: {},
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};

export const GLASSES_CATEGORIES = Object.values(GlassesCategory);
export const FRAME_TYPES = Object.values(FrameType);
export const LENS_MATERIALS = Object.values(LensMaterial);

export const PRICE_RANGES = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200 - $500', min: 200, max: 500 },
  { label: 'Over $500', min: 500, max: Infinity },
];

export const POPULAR_FRAME_COLORS = [
  '#000000', // Black
  '#8B4513', // Brown
  '#C0C0C0', // Silver
  '#FFD700', // Gold
  '#800080', // Purple
  '#008000', // Green
  '#FF0000', // Red
  '#0000FF', // Blue
  '#FFC0CB', // Pink
  '#FFFFFF', // White
];

export const POPULAR_LENS_COLORS = [
  '#FFFFFF', // Clear
  '#808080', // Gray
  '#8B4513', // Brown
  '#000000', // Black
  '#0000FF', // Blue
  '#008000', // Green
  '#FFFF00', // Yellow
  '#FFC0CB', // Pink
  '#800080', // Purple
  '#FFA500', // Orange
];
