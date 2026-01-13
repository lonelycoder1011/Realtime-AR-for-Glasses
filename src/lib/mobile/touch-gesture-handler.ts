// Touch gesture handling for mobile glasses adjustment

export interface TouchGestureConfig {
  enablePinchZoom: boolean;
  enableSwipeGestures: boolean;
  enableTapGestures: boolean;
  enableRotationGestures: boolean;
  pinchSensitivity: number;
  swipeSensitivity: number;
  tapTimeout: number;
  doubleTapTimeout: number;
  longPressTimeout: number;
  minSwipeDistance: number;
  maxTapDistance: number;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureEvent {
  type: 'pinch' | 'swipe' | 'tap' | 'doubletap' | 'longpress' | 'rotate' | 'pan';
  data: any;
  originalEvent: TouchEvent;
}

export interface PinchGestureData {
  scale: number;
  deltaScale: number;
  center: { x: number; y: number };
  distance: number;
}

export interface SwipeGestureData {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  velocity: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

export interface TapGestureData {
  x: number;
  y: number;
  tapCount: number;
}

export interface RotationGestureData {
  angle: number;
  deltaAngle: number;
  center: { x: number; y: number };
}

export interface PanGestureData {
  deltaX: number;
  deltaY: number;
  totalX: number;
  totalY: number;
  velocity: { x: number; y: number };
}

export class TouchGestureHandler {
  private config: TouchGestureConfig;
  private element: HTMLElement;
  private touchPoints: Map<number, TouchPoint> = new Map();
  private gestureCallbacks: Map<string, (event: GestureEvent) => void> = new Map();
  
  private lastTapTime: number = 0;
  private lastTapPosition: { x: number; y: number } = { x: 0, y: 0 };
  private tapCount: number = 0;
  private longPressTimer: number | null = null;
  
  private isPinching: boolean = false;
  private lastPinchDistance: number = 0;
  private lastPinchScale: number = 1;
  
  private isPanning: boolean = false;
  private panStartPoint: { x: number; y: number } = { x: 0, y: 0 };
  private panTotalDelta: { x: number; y: number } = { x: 0, y: 0 };
  
  private isRotating: boolean = false;
  private lastRotationAngle: number = 0;

  constructor(element: HTMLElement, config: Partial<TouchGestureConfig> = {}) {
    this.element = element;
    this.config = {
      enablePinchZoom: true,
      enableSwipeGestures: true,
      enableTapGestures: true,
      enableRotationGestures: true,
      pinchSensitivity: 1.0,
      swipeSensitivity: 1.0,
      tapTimeout: 300,
      doubleTapTimeout: 400,
      longPressTimeout: 500,
      minSwipeDistance: 50,
      maxTapDistance: 10,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * Setup touch event listeners
   */
  private setupEventListeners(): void {
    // Prevent default touch behaviors
    this.element.style.touchAction = 'none';
    this.element.style.userSelect = 'none';

    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const touches = Array.from(event.changedTouches);
    const timestamp = Date.now();

    touches.forEach(touch => {
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp,
      };
      this.touchPoints.set(touch.identifier, touchPoint);
    });

    const touchCount = this.touchPoints.size;

    if (touchCount === 1 && this.config.enableTapGestures) {
      this.handleSingleTouchStart(touches[0]);
    } else if (touchCount === 2) {
      this.handleMultiTouchStart();
    }
  }

  /**
   * Handle single touch start
   */
  private handleSingleTouchStart(touch: Touch): void {
    const now = Date.now();
    const position = { x: touch.clientX, y: touch.clientY };

    // Check for double tap
    if (now - this.lastTapTime < this.config.doubleTapTimeout) {
      const distance = this.calculateDistance(position, this.lastTapPosition);
      if (distance < this.config.maxTapDistance) {
        this.tapCount++;
      } else {
        this.tapCount = 1;
      }
    } else {
      this.tapCount = 1;
    }

    this.lastTapTime = now;
    this.lastTapPosition = position;

    // Start long press timer
    this.longPressTimer = window.setTimeout(() => {
      if (this.touchPoints.size === 1) {
        this.emitGesture('longpress', {
          x: position.x,
          y: position.y,
          tapCount: 1,
        }, event as any);
      }
    }, this.config.longPressTimeout);

    // Initialize pan gesture
    this.isPanning = true;
    this.panStartPoint = position;
    this.panTotalDelta = { x: 0, y: 0 };
  }

  /**
   * Handle multi-touch start
   */
  private handleMultiTouchStart(): void {
    this.clearLongPressTimer();

    const touchArray = Array.from(this.touchPoints.values());
    
    if (touchArray.length === 2) {
      // Initialize pinch gesture
      if (this.config.enablePinchZoom) {
        this.isPinching = true;
        this.lastPinchDistance = this.calculateDistance(
          { x: touchArray[0].x, y: touchArray[0].y },
          { x: touchArray[1].x, y: touchArray[1].y }
        );
        this.lastPinchScale = 1;
      }

      // Initialize rotation gesture
      if (this.config.enableRotationGestures) {
        this.isRotating = true;
        this.lastRotationAngle = this.calculateAngle(
          { x: touchArray[0].x, y: touchArray[0].y },
          { x: touchArray[1].x, y: touchArray[1].y }
        );
      }
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const touches = Array.from(event.changedTouches);
    const timestamp = Date.now();

    // Update touch points
    touches.forEach(touch => {
      const existingTouch = this.touchPoints.get(touch.identifier);
      if (existingTouch) {
        this.touchPoints.set(touch.identifier, {
          ...existingTouch,
          x: touch.clientX,
          y: touch.clientY,
          timestamp,
        });
      }
    });

    const touchCount = this.touchPoints.size;

    if (touchCount === 1) {
      this.handleSingleTouchMove(event);
    } else if (touchCount === 2) {
      this.handleMultiTouchMove(event);
    }
  }

  /**
   * Handle single touch move (pan gesture)
   */
  private handleSingleTouchMove(event: TouchEvent): void {
    this.clearLongPressTimer();

    if (!this.isPanning) return;

    const touch = event.changedTouches[0];
    const currentPoint = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = currentPoint.x - this.panStartPoint.x;
    const deltaY = currentPoint.y - this.panStartPoint.y;
    
    this.panTotalDelta.x = deltaX;
    this.panTotalDelta.y = deltaY;

    // Calculate velocity
    const touchPoint = this.touchPoints.get(touch.identifier);
    const timeDelta = touchPoint ? Date.now() - touchPoint.timestamp : 1;
    const velocity = {
      x: deltaX / timeDelta,
      y: deltaY / timeDelta,
    };

    this.emitGesture('pan', {
      deltaX: deltaX,
      deltaY: deltaY,
      totalX: this.panTotalDelta.x,
      totalY: this.panTotalDelta.y,
      velocity,
    }, event);
  }

  /**
   * Handle multi-touch move (pinch/rotation)
   */
  private handleMultiTouchMove(event: TouchEvent): void {
    const touchArray = Array.from(this.touchPoints.values());
    
    if (touchArray.length !== 2) return;

    const point1 = { x: touchArray[0].x, y: touchArray[0].y };
    const point2 = { x: touchArray[1].x, y: touchArray[1].y };

    // Handle pinch gesture
    if (this.isPinching && this.config.enablePinchZoom) {
      const currentDistance = this.calculateDistance(point1, point2);
      const scale = currentDistance / this.lastPinchDistance;
      const deltaScale = scale - this.lastPinchScale;
      
      const center = {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
      };

      this.emitGesture('pinch', {
        scale: scale * this.config.pinchSensitivity,
        deltaScale: deltaScale * this.config.pinchSensitivity,
        center,
        distance: currentDistance,
      }, event);

      this.lastPinchScale = scale;
    }

    // Handle rotation gesture
    if (this.isRotating && this.config.enableRotationGestures) {
      const currentAngle = this.calculateAngle(point1, point2);
      const deltaAngle = currentAngle - this.lastRotationAngle;
      
      const center = {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
      };

      this.emitGesture('rotate', {
        angle: currentAngle,
        deltaAngle: this.normalizeAngle(deltaAngle),
        center,
      }, event);

      this.lastRotationAngle = currentAngle;
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const touches = Array.from(event.changedTouches);
    const endTime = Date.now();

    touches.forEach(touch => {
      const touchPoint = this.touchPoints.get(touch.identifier);
      if (touchPoint) {
        // Check for swipe gesture
        if (this.config.enableSwipeGestures && this.touchPoints.size === 1) {
          this.checkForSwipe(touchPoint, { x: touch.clientX, y: touch.clientY }, endTime, event);
        }

        // Check for tap gesture
        if (this.config.enableTapGestures && this.touchPoints.size === 1) {
          this.checkForTap(touchPoint, { x: touch.clientX, y: touch.clientY }, endTime, event);
        }

        this.touchPoints.delete(touch.identifier);
      }
    });

    // Reset gesture states
    if (this.touchPoints.size === 0) {
      this.isPinching = false;
      this.isPanning = false;
      this.isRotating = false;
      this.clearLongPressTimer();
    } else if (this.touchPoints.size === 1) {
      // Switched from multi-touch to single touch
      this.isPinching = false;
      this.isRotating = false;
    }
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.handleTouchEnd(event);
  }

  /**
   * Check for swipe gesture
   */
  private checkForSwipe(
    startTouch: TouchPoint,
    endPoint: { x: number; y: number },
    endTime: number,
    event: TouchEvent
  ): void {
    const deltaX = endPoint.x - startTouch.x;
    const deltaY = endPoint.y - startTouch.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = endTime - startTouch.timestamp;
    const velocity = distance / timeDelta;

    if (distance < this.config.minSwipeDistance) return;

    let direction: 'up' | 'down' | 'left' | 'right';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    this.emitGesture('swipe', {
      direction,
      distance: distance * this.config.swipeSensitivity,
      velocity: velocity * this.config.swipeSensitivity,
      startPoint: { x: startTouch.x, y: startTouch.y },
      endPoint,
    }, event);
  }

  /**
   * Check for tap gesture
   */
  private checkForTap(
    startTouch: TouchPoint,
    endPoint: { x: number; y: number },
    endTime: number,
    event: TouchEvent
  ): void {
    const distance = this.calculateDistance(
      { x: startTouch.x, y: startTouch.y },
      endPoint
    );
    const duration = endTime - startTouch.timestamp;

    if (distance > this.config.maxTapDistance || duration > this.config.tapTimeout) {
      return;
    }

    const gestureType = this.tapCount > 1 ? 'doubletap' : 'tap';
    
    this.emitGesture(gestureType, {
      x: endPoint.x,
      y: endPoint.y,
      tapCount: this.tapCount,
    }, event);

    // Reset tap count after double tap timeout
    setTimeout(() => {
      this.tapCount = 0;
    }, this.config.doubleTapTimeout);
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  /**
   * Normalize angle to [-π, π] range
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Clear long press timer
   */
  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Emit gesture event
   */
  private emitGesture(type: string, data: any, originalEvent: TouchEvent): void {
    const callback = this.gestureCallbacks.get(type);
    if (callback) {
      callback({
        type: type as any,
        data,
        originalEvent,
      });
    }
  }

  /**
   * Add gesture event listener
   */
  on(gestureType: string, callback: (event: GestureEvent) => void): void {
    this.gestureCallbacks.set(gestureType, callback);
  }

  /**
   * Remove gesture event listener
   */
  off(gestureType: string): void {
    this.gestureCallbacks.delete(gestureType);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TouchGestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TouchGestureConfig {
    return { ...this.config };
  }

  /**
   * Check if gesture is active
   */
  isGestureActive(gestureType: string): boolean {
    switch (gestureType) {
      case 'pinch':
        return this.isPinching;
      case 'pan':
        return this.isPanning;
      case 'rotate':
        return this.isRotating;
      default:
        return false;
    }
  }

  /**
   * Get active touch count
   */
  getActiveTouchCount(): number {
    return this.touchPoints.size;
  }

  /**
   * Dispose gesture handler
   */
  dispose(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    this.clearLongPressTimer();
    this.touchPoints.clear();
    this.gestureCallbacks.clear();
  }
}
