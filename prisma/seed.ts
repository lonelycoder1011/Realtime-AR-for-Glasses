// Database seeding script

import { PrismaClient } from '@prisma/client';
import {
  GlassesCategory,
  FrameType,
  LensMaterial,
  DEFAULT_GLASSES_DIMENSIONS,
  POPULAR_FRAME_COLORS,
  POPULAR_LENS_COLORS,
} from '../src/types/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Ray-Ban' },
      update: {},
      create: {
        name: 'Ray-Ban',
        description: 'Iconic eyewear brand known for aviators and wayfarers',
        website: 'https://www.ray-ban.com',
        isActive: true,
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Oakley' },
      update: {},
      create: {
        name: 'Oakley',
        description: 'Performance eyewear for sports and active lifestyles',
        website: 'https://www.oakley.com',
        isActive: true,
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Persol' },
      update: {},
      create: {
        name: 'Persol',
        description: 'Italian luxury eyewear with timeless design',
        website: 'https://www.persol.com',
        isActive: true,
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Warby Parker' },
      update: {},
      create: {
        name: 'Warby Parker',
        description: 'Modern prescription glasses and sunglasses',
        website: 'https://www.warbyparker.com',
        isActive: true,
      },
    }),
    prisma.brand.upsert({
      where: { name: 'Tom Ford' },
      update: {},
      create: {
        name: 'Tom Ford',
        description: 'Luxury fashion eyewear with sophisticated style',
        website: 'https://www.tomford.com',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${brands.length} brands`);

  // Sample glasses data
  const glassesData = [
    {
      name: 'Aviator Classic',
      brandId: brands[0].id, // Ray-Ban
      price: 154.00,
      description: 'The original pilot sunglasses with timeless appeal',
      category: GlassesCategory.SUNGLASSES,
      frameType: FrameType.AVIATOR,
      lensMaterial: LensMaterial.GLASS,
      frameColor: '#C0C0C0', // Silver
      lensColor: '#808080', // Gray
      modelPath: '/models/aviator-classic.glb',
      thumbnailUrl: '/images/aviator-classic-thumb.jpg',
      images: [
        '/images/aviator-classic-1.jpg',
        '/images/aviator-classic-2.jpg',
      ],
      dimensions: {
        lensWidth: 58,
        bridgeWidth: 14,
        templeLength: 135,
        frameWidth: 140,
        frameHeight: 50,
      },
      materials: {
        frame: {
          primary: 'Metal',
          finish: 'Polished',
        },
        lens: {
          material: 'Crystal Glass',
          coating: 'Anti-reflective',
        },
        hardware: {
          hinges: 'Spring',
          screws: 'Stainless Steel',
        },
      },
      tags: ['classic', 'pilot', 'unisex', 'metal'],
    },
    {
      name: 'Wayfarer Original',
      brandId: brands[0].id, // Ray-Ban
      price: 163.00,
      description: 'Iconic plastic frame sunglasses that defined a generation',
      category: GlassesCategory.SUNGLASSES,
      frameType: FrameType.WAYFARER,
      lensMaterial: LensMaterial.PLASTIC,
      frameColor: '#000000', // Black
      lensColor: '#008000', // Green
      modelPath: '/models/wayfarer-original.glb',
      thumbnailUrl: '/images/wayfarer-original-thumb.jpg',
      images: [
        '/images/wayfarer-original-1.jpg',
        '/images/wayfarer-original-2.jpg',
      ],
      dimensions: {
        lensWidth: 50,
        bridgeWidth: 22,
        templeLength: 150,
        frameWidth: 145,
        frameHeight: 41,
      },
      materials: {
        frame: {
          primary: 'Acetate',
          finish: 'Glossy',
        },
        lens: {
          material: 'Polycarbonate',
          coating: 'UV Protection',
        },
        hardware: {
          hinges: 'Standard',
          screws: 'Brass',
        },
      },
      tags: ['retro', 'acetate', 'unisex', 'classic'],
    },
    {
      name: 'Holbrook',
      brandId: brands[1].id, // Oakley
      price: 183.00,
      description: 'Modern take on classic American frame design',
      category: GlassesCategory.SUNGLASSES,
      frameType: FrameType.SQUARE,
      lensMaterial: LensMaterial.POLYCARBONATE,
      frameColor: '#8B4513', // Brown
      lensColor: '#000000', // Black
      modelPath: '/models/holbrook.glb',
      thumbnailUrl: '/images/holbrook-thumb.jpg',
      images: [
        '/images/holbrook-1.jpg',
        '/images/holbrook-2.jpg',
      ],
      dimensions: {
        lensWidth: 55,
        bridgeWidth: 18,
        templeLength: 137,
        frameWidth: 138,
        frameHeight: 45,
      },
      materials: {
        frame: {
          primary: 'O Matter',
          finish: 'Matte',
        },
        lens: {
          material: 'Plutonite',
          coating: 'Iridium',
        },
        hardware: {
          hinges: 'Three-Point Fit',
          screws: 'Titanium',
        },
      },
      tags: ['sport', 'performance', 'lightweight', 'durable'],
    },
    {
      name: 'PO3019S Persol',
      brandId: brands[2].id, // Persol
      price: 295.00,
      description: 'Handcrafted Italian sunglasses with signature arrow',
      category: GlassesCategory.SUNGLASSES,
      frameType: FrameType.ROUND,
      lensMaterial: LensMaterial.GLASS,
      frameColor: '#8B4513', // Tortoiseshell
      lensColor: '#8B4513', // Brown
      modelPath: '/models/persol-3019.glb',
      thumbnailUrl: '/images/persol-3019-thumb.jpg',
      images: [
        '/images/persol-3019-1.jpg',
        '/images/persol-3019-2.jpg',
      ],
      dimensions: {
        lensWidth: 52,
        bridgeWidth: 20,
        templeLength: 145,
        frameWidth: 142,
        frameHeight: 48,
      },
      materials: {
        frame: {
          primary: 'Acetate',
          secondary: 'Metal',
          finish: 'Polished',
        },
        lens: {
          material: 'Crystal Glass',
          coating: 'Anti-reflective',
        },
        hardware: {
          hinges: 'Flex',
          screws: 'Gold-plated',
        },
      },
      tags: ['luxury', 'handcrafted', 'italian', 'vintage'],
    },
    {
      name: 'Burke Prescription',
      brandId: brands[3].id, // Warby Parker
      price: 95.00,
      description: 'Modern prescription glasses with clean lines',
      category: GlassesCategory.PRESCRIPTION,
      frameType: FrameType.FULL_RIM,
      lensMaterial: LensMaterial.CR39,
      frameColor: '#000000', // Black
      lensColor: '#FFFFFF', // Clear
      modelPath: '/models/burke-prescription.glb',
      thumbnailUrl: '/images/burke-prescription-thumb.jpg',
      images: [
        '/images/burke-prescription-1.jpg',
        '/images/burke-prescription-2.jpg',
      ],
      dimensions: DEFAULT_GLASSES_DIMENSIONS,
      materials: {
        frame: {
          primary: 'Acetate',
          finish: 'Matte',
        },
        lens: {
          material: 'CR-39',
          coating: 'Anti-reflective',
        },
        hardware: {
          hinges: 'Spring',
          screws: 'Stainless Steel',
          nosePads: 'Silicone',
        },
      },
      tags: ['prescription', 'modern', 'affordable', 'everyday'],
    },
    {
      name: 'TF5401 Tom Ford',
      brandId: brands[4].id, // Tom Ford
      price: 425.00,
      description: 'Luxury prescription eyewear with sophisticated design',
      category: GlassesCategory.PRESCRIPTION,
      frameType: FrameType.SQUARE,
      lensMaterial: LensMaterial.HIGH_INDEX,
      frameColor: '#8B4513', // Tortoiseshell
      lensColor: '#FFFFFF', // Clear
      modelPath: '/models/tomford-5401.glb',
      thumbnailUrl: '/images/tomford-5401-thumb.jpg',
      images: [
        '/images/tomford-5401-1.jpg',
        '/images/tomford-5401-2.jpg',
      ],
      dimensions: {
        lensWidth: 54,
        bridgeWidth: 16,
        templeLength: 145,
        frameWidth: 140,
        frameHeight: 42,
      },
      materials: {
        frame: {
          primary: 'Acetate',
          secondary: 'Metal',
          finish: 'Polished',
        },
        lens: {
          material: 'High-Index',
          coating: 'Blue Light Filter',
        },
        hardware: {
          hinges: 'Premium',
          screws: 'Gold-plated',
          nosePads: 'Adjustable',
        },
      },
      tags: ['luxury', 'designer', 'premium', 'sophisticated'],
    },
    {
      name: 'Computer Blue Light',
      brandId: brands[3].id, // Warby Parker
      price: 145.00,
      description: 'Blue light blocking glasses for computer use',
      category: GlassesCategory.COMPUTER,
      frameType: FrameType.ROUND,
      lensMaterial: LensMaterial.POLYCARBONATE,
      frameColor: '#0000FF', // Blue
      lensColor: '#FFFF00', // Yellow tint
      modelPath: '/models/computer-blue-light.glb',
      thumbnailUrl: '/images/computer-blue-light-thumb.jpg',
      images: [
        '/images/computer-blue-light-1.jpg',
        '/images/computer-blue-light-2.jpg',
      ],
      dimensions: {
        lensWidth: 48,
        bridgeWidth: 20,
        templeLength: 140,
        frameWidth: 136,
        frameHeight: 46,
      },
      materials: {
        frame: {
          primary: 'Acetate',
          finish: 'Matte',
        },
        lens: {
          material: 'Polycarbonate',
          coating: 'Blue Light Filter',
          tint: 'Yellow',
        },
        hardware: {
          hinges: 'Spring',
          screws: 'Stainless Steel',
        },
      },
      tags: ['computer', 'blue-light', 'work', 'digital'],
    },
    {
      name: 'Reading Plus 2.0',
      brandId: brands[3].id, // Warby Parker
      price: 75.00,
      description: 'Comfortable reading glasses with magnification',
      category: GlassesCategory.READING,
      frameType: FrameType.SEMI_RIMLESS,
      lensMaterial: LensMaterial.CR39,
      frameColor: '#C0C0C0', // Silver
      lensColor: '#FFFFFF', // Clear
      modelPath: '/models/reading-plus.glb',
      thumbnailUrl: '/images/reading-plus-thumb.jpg',
      images: [
        '/images/reading-plus-1.jpg',
        '/images/reading-plus-2.jpg',
      ],
      dimensions: {
        lensWidth: 52,
        bridgeWidth: 18,
        templeLength: 135,
        frameWidth: 138,
        frameHeight: 35,
      },
      materials: {
        frame: {
          primary: 'Metal',
          finish: 'Brushed',
        },
        lens: {
          material: 'CR-39',
          coating: 'Anti-reflective',
        },
        hardware: {
          hinges: 'Spring',
          screws: 'Stainless Steel',
          nosePads: 'Adjustable',
        },
      },
      tags: ['reading', 'magnification', 'lightweight', 'comfortable'],
    },
  ];

  // Create glasses
  const glasses = [];
  for (const glassData of glassesData) {
    const createdGlass = await prisma.glasses.create({
      data: {
        ...glassData,
        dimensions: glassData.dimensions as any,
        materials: glassData.materials as any,
      },
    });
    glasses.push(createdGlass);
  }

  console.log(`✅ Created ${glasses.length} glasses`);

  // Create sample inventory records
  for (const glass of glasses) {
    await prisma.glassesInventory.create({
      data: {
        glassesId: glass.id,
        sku: `SKU-${glass.id.toString().padStart(6, '0')}`,
        quantity: Math.floor(Math.random() * 100) + 10, // 10-110 units
        reservedQuantity: Math.floor(Math.random() * 5), // 0-5 reserved
        reorderLevel: 20,
        supplier: `Supplier ${Math.floor(Math.random() * 3) + 1}`,
        cost: Number(glass.price) * 0.6, // 60% of retail price
      },
    });
  }

  console.log(`✅ Created inventory records for ${glasses.length} glasses`);

  // Create sample reviews
  const reviewTexts = [
    { title: 'Great quality!', comment: 'Love these glasses, very comfortable and stylish.', rating: 5 },
    { title: 'Good value', comment: 'Nice glasses for the price, would recommend.', rating: 4 },
    { title: 'Perfect fit', comment: 'Fits perfectly and looks amazing. Great purchase!', rating: 5 },
    { title: 'Decent glasses', comment: 'Good quality but could be better for the price.', rating: 3 },
    { title: 'Excellent!', comment: 'Exceeded my expectations. Will buy again.', rating: 5 },
    { title: 'Comfortable', comment: 'Very comfortable to wear all day long.', rating: 4 },
  ];

  let reviewCount = 0;
  for (const glass of glasses) {
    const numReviews = Math.floor(Math.random() * 4) + 1; // 1-4 reviews per glasses
    for (let i = 0; i < numReviews; i++) {
      const review = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      await prisma.glassesReview.create({
        data: {
          glassesId: glass.id,
          userId: `user_${Math.floor(Math.random() * 100) + 1}`,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          isVerifiedPurchase: Math.random() > 0.3, // 70% verified purchases
        },
      });
      reviewCount++;
    }
  }

  console.log(`✅ Created ${reviewCount} reviews`);

  // Create sample admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@glasses-ar.com' },
    update: {},
    create: {
      email: 'admin@glasses-ar.com',
      name: 'Admin User',
      passwordHash: '$2a$10$example.hash.here', // In real app, use proper bcrypt hash
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      isActive: true,
    },
  });

  console.log('✅ Created admin user');

  // Create sample collections
  const collection = await prisma.glassesCollection.create({
    data: {
      name: 'Summer Collection 2024',
      description: 'Trending sunglasses for summer',
      isPublic: true,
      createdBy: 'admin@glasses-ar.com',
    },
  });

  // Add some glasses to the collection
  const sunglasses = glasses.filter(g => g.category === GlassesCategory.SUNGLASSES);
  for (let i = 0; i < Math.min(3, sunglasses.length); i++) {
    await prisma.glassesCollectionItem.create({
      data: {
        collectionId: collection.id,
        glassesId: sunglasses[i].id,
        order: i,
      },
    });
  }

  console.log('✅ Created sample collection');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
