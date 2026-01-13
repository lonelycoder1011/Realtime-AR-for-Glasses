import * as THREE from 'three';
import { GlassesModelData } from '@/types/glasses-models';

export interface GlassesModel {
  id: string;
  name: string;
  category: string;
  frameColor: string;
  lensColor: string;
  createGeometry: () => THREE.Group;
  dimensions: {
    lensWidth: number;
    lensHeight: number;
    bridgeWidth: number;
    templeLength: number;
  };
  price?: number;
  brand?: string;
  description?: string;
}

// Sample glasses model 1: Classic Aviator
const createAviatorGlasses = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Frame geometry
  const frameGeometry = new THREE.RingGeometry(0.08, 0.09, 32);
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Left lens
  const leftFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  leftFrame.position.set(-0.06, 0, 0);
  group.add(leftFrame);
  
  // Right lens
  const rightFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  rightFrame.position.set(0.06, 0, 0);
  group.add(rightFrame);
  
  // Bridge
  const bridgeGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.04);
  const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0, 0);
  group.add(bridge);
  
  // Left temple
  const templeGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.12);
  const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  leftTemple.rotation.z = Math.PI / 2;
  leftTemple.position.set(-0.15, 0, 0);
  group.add(leftTemple);
  
  // Right temple
  const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  rightTemple.rotation.z = Math.PI / 2;
  rightTemple.position.set(0.15, 0, 0);
  group.add(rightTemple);
  
  // Lenses
  const lensGeometry = new THREE.CircleGeometry(0.075, 32);
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.06, 0, 0.001);
  group.add(leftLens);
  
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.06, 0, 0.001);
  group.add(rightLens);
  
  return group;
};

// Sample glasses model 2: Round Vintage
const createRoundGlasses = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Frame geometry
  const frameGeometry = new THREE.RingGeometry(0.07, 0.075, 32);
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    metalness: 0.3,
    roughness: 0.7
  });
  
  // Left lens frame
  const leftFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  leftFrame.position.set(-0.055, 0, 0);
  group.add(leftFrame);
  
  // Right lens frame
  const rightFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  rightFrame.position.set(0.055, 0, 0);
  group.add(rightFrame);
  
  // Bridge
  const bridgeGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.035);
  const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0, 0);
  group.add(bridge);
  
  // Temples
  const templeGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.11);
  const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  leftTemple.rotation.z = Math.PI / 2;
  leftTemple.position.set(-0.13, 0, 0);
  group.add(leftTemple);
  
  const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  rightTemple.rotation.z = Math.PI / 2;
  rightTemple.position.set(0.13, 0, 0);
  group.add(rightTemple);
  
  // Clear lenses
  const lensGeometry = new THREE.CircleGeometry(0.065, 32);
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });
  
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.055, 0, 0.001);
  group.add(leftLens);
  
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.055, 0, 0.001);
  group.add(rightLens);
  
  return group;
};

// Sample glasses model 3: Square Modern
const createSquareGlasses = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Frame geometry (square)
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-0.08, -0.06);
  frameShape.lineTo(0.08, -0.06);
  frameShape.lineTo(0.08, 0.06);
  frameShape.lineTo(-0.08, 0.06);
  frameShape.lineTo(-0.08, -0.06);
  
  const holeShape = new THREE.Shape();
  holeShape.moveTo(-0.07, -0.05);
  holeShape.lineTo(0.07, -0.05);
  holeShape.lineTo(0.07, 0.05);
  holeShape.lineTo(-0.07, 0.05);
  holeShape.lineTo(-0.07, -0.05);
  
  frameShape.holes.push(holeShape);
  
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.005,
    bevelEnabled: false
  });
  
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    metalness: 0.9,
    roughness: 0.1
  });
  
  // Left lens frame
  const leftFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  leftFrame.position.set(-0.06, 0, 0);
  leftFrame.scale.set(0.5, 0.8, 1);
  group.add(leftFrame);
  
  // Right lens frame
  const rightFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  rightFrame.position.set(0.06, 0, 0);
  rightFrame.scale.set(0.5, 0.8, 1);
  group.add(rightFrame);
  
  // Bridge
  const bridgeGeometry = new THREE.BoxGeometry(0.02, 0.008, 0.005);
  const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
  bridge.position.set(0, 0, 0);
  group.add(bridge);
  
  // Temples
  const templeGeometry = new THREE.BoxGeometry(0.12, 0.005, 0.005);
  const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  leftTemple.position.set(-0.12, 0, 0);
  group.add(leftTemple);
  
  const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  rightTemple.position.set(0.12, 0, 0);
  group.add(rightTemple);
  
  // Lenses
  const lensGeometry = new THREE.PlaneGeometry(0.07, 0.08);
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x444444,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.06, 0, 0.003);
  group.add(leftLens);
  
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.06, 0, 0.003);
  group.add(rightLens);
  
  return group;
};

// Sample glasses model 4: Cat Eye Retro
const createCatEyeGlasses = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Cat eye shape
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-0.08, 0);
  frameShape.quadraticCurveTo(-0.06, -0.07, 0, -0.06);
  frameShape.quadraticCurveTo(0.06, -0.07, 0.08, 0);
  frameShape.quadraticCurveTo(0.09, 0.04, 0.07, 0.06);
  frameShape.quadraticCurveTo(0, 0.05, -0.07, 0.06);
  frameShape.quadraticCurveTo(-0.09, 0.04, -0.08, 0);
  
  const holeShape = new THREE.Shape();
  holeShape.moveTo(-0.06, 0);
  holeShape.quadraticCurveTo(-0.04, -0.05, 0, -0.04);
  holeShape.quadraticCurveTo(0.04, -0.05, 0.06, 0);
  holeShape.quadraticCurveTo(0.05, 0.03, 0, 0.03);
  holeShape.quadraticCurveTo(-0.05, 0.03, -0.06, 0);
  
  frameShape.holes.push(holeShape);
  
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.004,
    bevelEnabled: false
  });
  
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFF1493,
    metalness: 0.2,
    roughness: 0.8
  });
  
  // Left lens frame
  const leftFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  leftFrame.position.set(-0.06, 0, 0);
  leftFrame.scale.set(0.7, 1, 1);
  group.add(leftFrame);
  
  // Right lens frame
  const rightFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  rightFrame.position.set(0.06, 0, 0);
  rightFrame.scale.set(0.7, 1, 1);
  group.add(rightFrame);
  
  // Bridge
  const bridgeGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.03);
  const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, -0.02, 0);
  group.add(bridge);
  
  // Temples with decorative elements
  const templeGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.11);
  const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  leftTemple.rotation.z = Math.PI / 2;
  leftTemple.position.set(-0.13, 0.02, 0);
  group.add(leftTemple);
  
  const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  rightTemple.rotation.z = Math.PI / 2;
  rightTemple.position.set(0.13, 0.02, 0);
  group.add(rightTemple);
  
  // Gradient lenses
  const lensGeometry = new THREE.CircleGeometry(0.05, 32);
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B008B,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.position.set(-0.06, 0, 0.002);
  group.add(leftLens);
  
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.position.set(0.06, 0, 0.002);
  group.add(rightLens);
  
  return group;
};

// Sample glasses model 5: Sport Wraparound
const createSportGlasses = (): THREE.Group => {
  const group = new THREE.Group();
  
  // Wraparound frame
  const frameGeometry = new THREE.TorusGeometry(0.09, 0.008, 8, 32, Math.PI);
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0066CC,
    metalness: 0.7,
    roughness: 0.3
  });
  
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.rotation.x = Math.PI;
  frame.position.set(0, 0, 0);
  group.add(frame);
  
  // Center bridge
  const bridgeGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.006);
  const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
  bridge.position.set(0, -0.09, 0);
  group.add(bridge);
  
  // Side temples
  const templeGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.08);
  const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  leftTemple.rotation.z = Math.PI / 2;
  leftTemple.rotation.y = -0.3;
  leftTemple.position.set(-0.11, -0.02, -0.02);
  group.add(leftTemple);
  
  const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
  rightTemple.rotation.z = Math.PI / 2;
  rightTemple.rotation.y = 0.3;
  rightTemple.position.set(0.11, -0.02, -0.02);
  group.add(rightTemple);
  
  // Large wraparound lens
  const lensGeometry = new THREE.SphereGeometry(0.085, 32, 16, 0, Math.PI);
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  
  const lens = new THREE.Mesh(lensGeometry, lensMaterial);
  lens.rotation.x = Math.PI;
  lens.position.set(0, 0, 0.01);
  group.add(lens);
  
  return group;
};

export const SAMPLE_GLASSES_MODELS: GlassesModel[] = [
  {
    id: 'aviator-classic',
    name: 'Classic Aviator',
    category: 'Sunglasses',
    frameColor: '#444444',
    lensColor: '#333333',
    createGeometry: createAviatorGlasses,
    dimensions: { lensWidth: 0.075, lensHeight: 0.075, bridgeWidth: 0.04, templeLength: 0.12 },
    price: 149.99,
    brand: 'Classic',
    description: 'Timeless aviator sunglasses with dark lenses'
  },
  {
    id: 'round-vintage',
    name: 'Round Vintage',
    category: 'Prescription',
    frameColor: '#8B4513',
    lensColor: '#ffffff',
    createGeometry: createRoundGlasses,
    dimensions: { lensWidth: 0.065, lensHeight: 0.065, bridgeWidth: 0.035, templeLength: 0.11 },
    price: 89.99,
    brand: 'Vintage',
    description: 'Classic round frames with clear lenses'
  },
  {
    id: 'square-modern',
    name: 'Square Modern',
    category: 'Fashion',
    frameColor: '#000000',
    lensColor: '#444444',
    createGeometry: createSquareGlasses,
    dimensions: { lensWidth: 0.07, lensHeight: 0.08, bridgeWidth: 0.02, templeLength: 0.12 },
    price: 199.99,
    brand: 'Modern',
    description: 'Sleek square frames with tinted lenses'
  },
  {
    id: 'cat-eye-retro',
    name: 'Cat Eye Retro',
    category: 'Fashion',
    frameColor: '#FF1493',
    lensColor: '#8B008B',
    createGeometry: createCatEyeGlasses,
    dimensions: { lensWidth: 0.06, lensHeight: 0.05, bridgeWidth: 0.03, templeLength: 0.11 },
    price: 129.99,
    brand: 'Retro',
    description: 'Stylish cat-eye frames with gradient lenses'
  },
  {
    id: 'sport-wraparound',
    name: 'Sport Wraparound',
    category: 'Sports',
    frameColor: '#0066CC',
    lensColor: '#00FFFF',
    createGeometry: createSportGlasses,
    dimensions: { lensWidth: 0.085, lensHeight: 0.085, bridgeWidth: 0.02, templeLength: 0.08 },
    price: 179.99,
    brand: 'Sport',
    description: 'High-performance wraparound sports glasses'
  }
];

// Convert to GlassesModelData format for the selector component

export const SAMPLE_GLASSES_MODEL_DATA: GlassesModelData[] = [
  {
    id: 'glasses-1',
    name: 'Classic Aviator',
    brand: 'Classic',
    category: 'sunglasses',
    frameMaterial: 'metal',
    lensType: 'tinted',
    frameColor: '#444444',
    lensColor: '#333333',
    price: 149.99,
    thumbnailUrl: '/models/1.glb',
    modelUrl: '/models/1.glb',
    dimensions: { 
      lensWidth: 0.075, 
      lensHeight: 0.075, 
      bridgeWidth: 0.04, 
      templeLength: 0.12,
      frameWidth: 0.15
    }
  },
  {
    id: 'glasses-2',
    name: 'Round Vintage',
    brand: 'Vintage',
    category: 'eyeglasses',
    frameMaterial: 'acetate',
    lensType: 'clear',
    frameColor: '#8B4513',
    lensColor: '#ffffff',
    price: 89.99,
    thumbnailUrl: '/models/2.glb',
    modelUrl: '/models/2.glb',
    dimensions: { 
      lensWidth: 0.065, 
      lensHeight: 0.065, 
      bridgeWidth: 0.035, 
      templeLength: 0.11,
      frameWidth: 0.13
    }
  },
  {
    id: 'glasses-3',
    name: 'Square Modern',
    brand: 'Modern',
    category: 'eyeglasses',
    frameMaterial: 'plastic',
    lensType: 'tinted',
    frameColor: '#000000',
    lensColor: '#444444',
    price: 199.99,
    thumbnailUrl: '/models/3.glb',
    modelUrl: '/models/3.glb',
    dimensions: { 
      lensWidth: 0.07, 
      lensHeight: 0.08, 
      bridgeWidth: 0.02, 
      templeLength: 0.12,
      frameWidth: 0.14
    }
  },
  {
    id: 'glasses-4',
    name: 'Cat Eye Retro',
    brand: 'Retro',
    category: 'sunglasses',
    frameMaterial: 'acetate',
    lensType: 'tinted',
    frameColor: '#FF1493',
    lensColor: '#8B008B',
    price: 129.99,
    thumbnailUrl: '/models/4.glb',
    modelUrl: '/models/4.glb',
    dimensions: { 
      lensWidth: 0.06, 
      lensHeight: 0.05, 
      bridgeWidth: 0.03, 
      templeLength: 0.11,
      frameWidth: 0.12
    }
  },
  {
    id: 'glasses-5',
    name: 'Sport Wraparound',
    brand: 'Sport',
    category: 'sunglasses',
    frameMaterial: 'plastic',
    lensType: 'polarized',
    frameColor: '#0066CC',
    lensColor: '#00FFFF',
    price: 179.99,
    thumbnailUrl: '/models/5.glb',
    modelUrl: '/models/5.glb',
    dimensions: { 
      lensWidth: 0.085, 
      lensHeight: 0.085, 
      bridgeWidth: 0.02, 
      templeLength: 0.08,
      frameWidth: 0.17
    }
  }
];

export const getSampleGlassesModel = (id: string): GlassesModel | null => {
  return SAMPLE_GLASSES_MODELS.find(model => model.id === id) || null;
};

export const createSampleGlassesGeometry = (id: string): THREE.Group | null => {
  const model = getSampleGlassesModel(id);
  return model ? model.createGeometry() : null;
};
