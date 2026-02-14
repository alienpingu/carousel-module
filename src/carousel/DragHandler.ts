/**
 * DragHandler - Handles mouse and touch drag interactions with momentum scrolling.
 * 
 * This module provides drag functionality including:
 * - Mouse drag tracking
 * - Touch swipe support
 * - Velocity calculation
 * - Momentum scrolling after release
 */

/** Configuration for drag behavior */
export interface DragHandlerConfig {
  /** Whether drag is enabled */
  enabled: boolean;
  /** Deceleration factor for momentum (0-1) */
  deceleration: number;
  /** Minimum velocity threshold to start momentum */
  minVelocity: number;
}

const DEFAULT_CONFIG: DragHandlerConfig = {
  enabled: true,
  deceleration: 0.92,
  minVelocity: 0.5,
};

/** State for tracking drag */
interface DragState {
  isDragging: boolean;
  startX: number;
  scrollStart: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  momentumAnimation: number | null;
}

/** Callback type for scroll events */
type ScrollCallback = (index: number) => void;

/**
 * DragHandler class manages all drag interactions and momentum scrolling.
 */
export class DragHandler {
  private config: DragHandlerConfig;
  private state: DragState;
  private trackElement: HTMLElement;
  private scrollCallback: ScrollCallback;
  private loopCallback: (() => void) | null = null;
  private getScrollPosition: () => number;
  private setScrollPosition: (position: number) => void;
  private getSelectedIndex: () => number;

  /**
   * Creates a new DragHandler instance.
   * 
   * @param trackElement - The scrollable track element
   * @param scrollCallback - Callback fired on scroll events
   * @param options - Configuration options
   */
  constructor(
    trackElement: HTMLElement,
    scrollCallback: ScrollCallback,
    options: Partial<DragHandlerConfig> = {},
    getScrollPosition: () => number,
    setScrollPosition: (position: number) => void,
    getSelectedIndex: () => number
  ) {
    this.trackElement = trackElement;
    this.scrollCallback = scrollCallback;
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.getScrollPosition = getScrollPosition;
    this.setScrollPosition = setScrollPosition;
    this.getSelectedIndex = getSelectedIndex;
    
    this.state = {
      isDragging: false,
      startX: 0,
      scrollStart: 0,
      lastX: 0,
      lastTime: 0,
      velocity: 0,
      momentumAnimation: null,
    };

    this.setupEventListeners();
  }

  /**
   * Sets the loop callback for infinite scroll handling
   */
  public setLoopCallback(callback: () => void): void {
    this.loopCallback = callback;
  }

  /**
   * Sets up mouse and touch event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.trackElement.addEventListener('mousedown', this.handleDragStart.bind(this));
    window.addEventListener('mousemove', this.handleDragMove.bind(this));
    window.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Touch events
    this.trackElement.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
    this.trackElement.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
    this.trackElement.addEventListener('touchend', this.handleDragEnd.bind(this));
  }

  /**
   * Handles drag start event
   */
  private handleDragStart(event: MouseEvent | TouchEvent): void {
    if (!this.config.enabled) return;

    // Cancel any existing momentum animation
    this.cancelMomentum();

    this.state.isDragging = true;
    this.state.startX = this.getEventX(event);
    this.state.scrollStart = this.getScrollPosition();
    this.state.lastX = this.state.startX;
    this.state.lastTime = performance.now();
    this.state.velocity = 0;

    this.trackElement.style.cursor = 'grabbing';
    this.trackElement.style.scrollBehavior = 'auto';
  }

  /**
   * Handles drag move event
   */
  private handleDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.state.isDragging) return;
    if ('touches' in event && event.touches.length === 0) return;

    event.preventDefault();

    const now = performance.now();
    const x = this.getEventX(event);
    const timeDelta = now - this.state.lastTime;

    // Calculate velocity in pixels per frame
    if (timeDelta > 0) {
      const deltaX = this.state.lastX - x;
      this.state.velocity = deltaX / timeDelta * 16;
    }

    this.state.lastX = x;
    this.state.lastTime = now;

    const diff = this.state.startX - x;
    const newScrollLeft = this.state.scrollStart + diff;

    this.setScrollPosition(newScrollLeft);

    // Handle infinite scroll during drag
    if (this.loopCallback) {
      this.loopCallback();
    }

    this.scrollCallback(this.getSelectedIndex());
  }

  /**
   * Handles drag end event
   */
  private handleDragEnd(): void {
    if (!this.state.isDragging) return;

    this.state.isDragging = false;
    this.trackElement.style.cursor = 'grab';

    // Start momentum scrolling if velocity is significant
    if (Math.abs(this.state.velocity) > this.config.minVelocity) {
      this.startMomentum();
    } else {
      this.trackElement.style.scrollBehavior = 'smooth';
      this.scrollCallback(this.getSelectedIndex());
    }

    // Handle infinite scroll
    if (this.loopCallback) {
      this.loopCallback();
    }
  }

  /**
   * Starts momentum animation after drag release
   */
  private startMomentum(): void {
    const animate = (): void => {
      // Apply deceleration
      this.state.velocity *= this.config.deceleration;

      // Stop if velocity is too low
      if (Math.abs(this.state.velocity) < this.config.minVelocity) {
        this.state.momentumAnimation = null;
        this.trackElement.style.scrollBehavior = 'smooth';
        this.scrollCallback(this.getSelectedIndex());
        return;
      }

      // Apply momentum
      const newScrollLeft = this.getScrollPosition() + this.state.velocity;
      this.setScrollPosition(newScrollLeft);

      // Handle infinite scroll
      if (this.loopCallback) {
        this.loopCallback();
      }

      // Emit scroll event
      this.scrollCallback(this.getSelectedIndex());

      // Continue animation
      this.state.momentumAnimation = requestAnimationFrame(animate);
    };

    this.state.momentumAnimation = requestAnimationFrame(animate);
  }

  /**
   * Cancels any running momentum animation
   */
  public cancelMomentum(): void {
    if (this.state.momentumAnimation) {
      cancelAnimationFrame(this.state.momentumAnimation);
      this.state.momentumAnimation = null;
    }
  }

  /**
   * Gets the X position from mouse or touch event
   */
  private getEventX(event: MouseEvent | TouchEvent): number {
    return 'touches' in event ? event.touches[0].clientX : event.clientX;
  }

  /**
   * Destroys the handler and cleans up event listeners
   */
  public destroy(): void {
    this.cancelMomentum();
  }
}
