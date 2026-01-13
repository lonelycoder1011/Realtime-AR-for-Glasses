'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TouchGestureHandler, GestureEvent, PinchGestureData, SwipeGestureData, TapGestureData, PanGestureData } from '@/lib/mobile/touch-gesture-handler';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Move, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Hand, 
  Smartphone,
  Settings,
  Info
} from 'lucide-react';

interface MobileGestureControlsProps {
  onPinchZoom?: (scale: number, center: { x: number; y: number }) => void;
  onSwipe?: (direction: string, distance: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
  enablePinchZoom?: boolean;
  enableSwipeGestures?: boolean;
  enableTapGestures?: boolean;
  enableRotationGestures?: boolean;
  enablePanGestures?: boolean;
  showInstructions?: boolean;
  className?: string;
}

export const MobileGestureControls: React.FC<MobileGestureControlsProps> = ({
  onPinchZoom,
  onSwipe,
  onTap,
  onDoubleTap,
  onPan,
  onRotate,
  enablePinchZoom = true,
  enableSwipeGestures = true,
  enableTapGestures = true,
  enableRotationGestures = true,
  enablePanGestures = true,
  showInstructions = true,
  className,
}) => {
  const gestureAreaRef = useRef<HTMLDivElement>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler | null>(null);
  
  const [activeGestures, setActiveGestures] = useState<Set<string>>(new Set());
  const [lastGesture, setLastGesture] = useState<string>('');
  const [gestureData, setGestureData] = useState<any>(null);
  const [touchCount, setTouchCount] = useState(0);

  useEffect(() => {
    if (!gestureAreaRef.current) return;

    // Initialize gesture handler
    gestureHandlerRef.current = new TouchGestureHandler(gestureAreaRef.current, {
      enablePinchZoom,
      enableSwipeGestures,
      enableTapGestures,
      enableRotationGestures,
      pinchSensitivity: 1.0,
      swipeSensitivity: 1.0,
      tapTimeout: 300,
      doubleTapTimeout: 400,
      longPressTimeout: 500,
      minSwipeDistance: 50,
      maxTapDistance: 10,
    });

    const handler = gestureHandlerRef.current;

    // Setup gesture event listeners
    handler.on('pinch', handlePinchGesture);
    handler.on('swipe', handleSwipeGesture);
    handler.on('tap', handleTapGesture);
    handler.on('doubletap', handleDoubleTapGesture);
    handler.on('pan', handlePanGesture);
    handler.on('rotate', handleRotateGesture);
    handler.on('longpress', handleLongPressGesture);

    // Update touch count periodically
    const updateTouchCount = () => {
      setTouchCount(handler.getActiveTouchCount());
      
      // Update active gestures
      const active = new Set<string>();
      if (handler.isGestureActive('pinch')) active.add('pinch');
      if (handler.isGestureActive('pan')) active.add('pan');
      if (handler.isGestureActive('rotate')) active.add('rotate');
      setActiveGestures(active);
    };

    const interval = setInterval(updateTouchCount, 100);

    return () => {
      clearInterval(interval);
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.dispose();
      }
    };
  }, [enablePinchZoom, enableSwipeGestures, enableTapGestures, enableRotationGestures]);

  const handlePinchGesture = (event: GestureEvent) => {
    const data = event.data as PinchGestureData;
    setLastGesture('Pinch');
    setGestureData({
      scale: data.scale.toFixed(2),
      center: `${Math.round(data.center.x)}, ${Math.round(data.center.y)}`,
    });
    
    if (onPinchZoom) {
      onPinchZoom(data.scale, data.center);
    }
  };

  const handleSwipeGesture = (event: GestureEvent) => {
    const data = event.data as SwipeGestureData;
    setLastGesture(`Swipe ${data.direction}`);
    setGestureData({
      direction: data.direction,
      distance: Math.round(data.distance),
      velocity: data.velocity.toFixed(1),
    });
    
    if (onSwipe) {
      onSwipe(data.direction, data.distance);
    }
  };

  const handleTapGesture = (event: GestureEvent) => {
    const data = event.data as TapGestureData;
    setLastGesture('Tap');
    setGestureData({
      position: `${Math.round(data.x)}, ${Math.round(data.y)}`,
    });
    
    if (onTap) {
      onTap(data.x, data.y);
    }
  };

  const handleDoubleTapGesture = (event: GestureEvent) => {
    const data = event.data as TapGestureData;
    setLastGesture('Double Tap');
    setGestureData({
      position: `${Math.round(data.x)}, ${Math.round(data.y)}`,
    });
    
    if (onDoubleTap) {
      onDoubleTap(data.x, data.y);
    }
  };

  const handlePanGesture = (event: GestureEvent) => {
    const data = event.data as PanGestureData;
    setLastGesture('Pan');
    setGestureData({
      delta: `${Math.round(data.deltaX)}, ${Math.round(data.deltaY)}`,
      velocity: `${data.velocity.x.toFixed(1)}, ${data.velocity.y.toFixed(1)}`,
    });
    
    if (onPan && enablePanGestures) {
      onPan(data.deltaX, data.deltaY);
    }
  };

  const handleRotateGesture = (event: GestureEvent) => {
    const data = event.data;
    setLastGesture('Rotate');
    setGestureData({
      angle: `${(data.angle * 180 / Math.PI).toFixed(1)}°`,
      center: `${Math.round(data.center.x)}, ${Math.round(data.center.y)}`,
    });
    
    if (onRotate) {
      onRotate(data.angle, data.center);
    }
  };

  const handleLongPressGesture = (event: GestureEvent) => {
    const data = event.data as TapGestureData;
    setLastGesture('Long Press');
    setGestureData({
      position: `${Math.round(data.x)}, ${Math.round(data.y)}`,
    });
  };

  const getGestureIcon = (gesture: string) => {
    switch (gesture.toLowerCase()) {
      case 'pinch':
        return <ZoomIn className="h-4 w-4" />;
      case 'pan':
        return <Move className="h-4 w-4" />;
      case 'rotate':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Hand className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      {/* Gesture Area */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div
            ref={gestureAreaRef}
            className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden cursor-pointer select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Touch indicators */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Touch Area</p>
                <p className="text-xs text-gray-400">Try gestures here</p>
              </div>
            </div>

            {/* Active gesture indicators */}
            {activeGestures.size > 0 && (
              <div className="absolute top-4 left-4">
                <div className="flex gap-2">
                  {Array.from(activeGestures).map(gesture => (
                    <Badge key={gesture} variant="default" className="flex items-center gap-1">
                      {getGestureIcon(gesture)}
                      {gesture}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Touch count indicator */}
            {touchCount > 0 && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">
                  {touchCount} touch{touchCount !== 1 ? 'es' : ''}
                </Badge>
              </div>
            )}

            {/* Last gesture info */}
            {lastGesture && (
              <div className="absolute bottom-4 left-4 right-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getGestureIcon(lastGesture)}
                      <span className="font-medium text-sm">{lastGesture}</span>
                    </div>
                    {gestureData && (
                      <div className="text-xs text-gray-600 space-y-1">
                        {Object.entries(gestureData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gesture Instructions */}
      {showInstructions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              <span className="font-medium text-sm">Gesture Instructions</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {enableTapGestures && (
                <div className="flex items-center gap-2">
                  <Hand className="h-3 w-3 text-blue-500" />
                  <span><strong>Tap:</strong> Single touch to select</span>
                </div>
              )}
              
              {enableTapGestures && (
                <div className="flex items-center gap-2">
                  <Hand className="h-3 w-3 text-green-500" />
                  <span><strong>Double Tap:</strong> Quick double touch</span>
                </div>
              )}
              
              {enablePinchZoom && (
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-3 w-3 text-purple-500" />
                  <span><strong>Pinch:</strong> Two fingers to zoom</span>
                </div>
              )}
              
              {enablePanGestures && (
                <div className="flex items-center gap-2">
                  <Move className="h-3 w-3 text-orange-500" />
                  <span><strong>Pan:</strong> Drag to move</span>
                </div>
              )}
              
              {enableRotationGestures && (
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3 w-3 text-red-500" />
                  <span><strong>Rotate:</strong> Two fingers to rotate</span>
                </div>
              )}
              
              {enableSwipeGestures && (
                <div className="flex items-center gap-2">
                  <Hand className="h-3 w-3 text-teal-500" />
                  <span><strong>Swipe:</strong> Quick slide gesture</span>
                </div>
              )}
            </div>

            {/* Gesture Status */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Gesture Status:</span>
                <div className="flex gap-2">
                  {enablePinchZoom && (
                    <Badge variant={activeGestures.has('pinch') ? 'default' : 'outline'} className="text-xs">
                      Pinch
                    </Badge>
                  )}
                  {enablePanGestures && (
                    <Badge variant={activeGestures.has('pan') ? 'default' : 'outline'} className="text-xs">
                      Pan
                    </Badge>
                  )}
                  {enableRotationGestures && (
                    <Badge variant={activeGestures.has('rotate') ? 'default' : 'outline'} className="text-xs">
                      Rotate
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
