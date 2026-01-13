'use client';

import React, { useRef, useEffect, forwardRef } from 'react';
import { useThreeScene } from '@/hooks/useThreeScene';
import { cn } from '@/lib/utils';

interface ThreeJSOverlayProps {
  className?: string;
  onSceneReady?: (context: any) => void;
  autoStart?: boolean;
}

export const ThreeJSOverlay = forwardRef<HTMLCanvasElement, ThreeJSOverlayProps>(
  ({ className, onSceneReady, autoStart = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { 
      state, 
      renderStats, 
      initializeScene, 
      startRendering, 
      getContext,
      isReady 
    } = useThreeScene({
      autoStart,
      sceneConfig: {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      },
      cameraConfig: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 0, z: 5 },
      },
    });

    // Combine refs
    const combinedRef = (node: HTMLCanvasElement | null) => {
      if (canvasRef) {
        canvasRef.current = node;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Initialize scene when canvas is available
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas && !state.isInitialized) {
        initializeScene(canvas);
      }
    }, [initializeScene, state.isInitialized]);

    // Call onSceneReady when scene is ready
    useEffect(() => {
      if (isReady && onSceneReady) {
        const context = getContext();
        onSceneReady(context);
      }
    }, [isReady, onSceneReady]);

    return (
      <canvas
        ref={combinedRef}
        className={cn(
          'absolute inset-0 pointer-events-none',
          'w-full h-full',
          className
        )}
        style={{
          transform: 'scaleX(-1)', // Mirror to match video
          backgroundColor: 'transparent', // Ensure canvas is transparent
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      />
    );
  }
);

ThreeJSOverlay.displayName = 'ThreeJSOverlay';
