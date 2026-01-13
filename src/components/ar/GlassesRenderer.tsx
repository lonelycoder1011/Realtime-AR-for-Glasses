'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createSampleGlassesGeometry } from '@/lib/glasses/sample-glasses-models';

interface GlassesRendererProps {
  scene: THREE.Scene | null;
  activeGlassesId: string | null;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

export const GlassesRenderer: React.FC<GlassesRendererProps> = ({
  scene,
  activeGlassesId,
  position = { x: 0, y: 0, z: -2 },
  rotation = { x: 0, y: 0, z: 0 },
  scale = { x: 1, y: 1, z: 1 },
}) => {
  const currentGlassesRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!scene || !activeGlassesId) return;

    // Remove existing glasses
    if (currentGlassesRef.current) {
      scene.remove(currentGlassesRef.current);
      currentGlassesRef.current = null;
    }

    // Create and add new glasses
    const glassesGeometry = createSampleGlassesGeometry(activeGlassesId);
    if (glassesGeometry) {
      // Set position, rotation, and scale
      glassesGeometry.position.set(position.x, position.y, position.z);
      glassesGeometry.rotation.set(rotation.x, rotation.y, rotation.z);
      glassesGeometry.scale.set(scale.x, scale.y, scale.z);

      // Add to scene
      scene.add(glassesGeometry);
      currentGlassesRef.current = glassesGeometry;
    }

    // Cleanup function
    return () => {
      if (currentGlassesRef.current && scene) {
        scene.remove(currentGlassesRef.current);
        currentGlassesRef.current = null;
      }
    };
  }, [scene, activeGlassesId, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, scale.x, scale.y, scale.z]);

  // Update position, rotation, scale when they change
  useEffect(() => {
    if (currentGlassesRef.current) {
      currentGlassesRef.current.position.set(position.x, position.y, position.z);
      currentGlassesRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
      currentGlassesRef.current.scale.set(scale.x, scale.y, scale.z);
    }
  }, [position, rotation, scale]);

  return null; // This component doesn't render anything to the DOM
};
