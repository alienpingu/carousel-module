/**
 * Carousel - A production-ready carousel component with infinite scrolling and momentum-based interactions.
 * 
 * Features:
 * - Infinite loop scrolling
 * - Free scroll (dragFree mode)
 * - Mouse drag and touch swipe support with momentum
 * - Keyboard navigation
 * - Accessibility support (ARIA labels, keyboard navigation, focus management)
 * - Customizable slides per view
 * - Responsive design with ResizeObserver
 * 
 * @module CarouselModule
 */

import { CarouselOptions, defaultCarouselOptions } from './CarouselOptions';
import { DragHandler } from './DragHandler';
import { InfiniteScroll } from './InfiniteScroll';
import { calculateSlideWidth, getSelectedIndex, calculateTargetScroll } from './utils/scrollUtils';
import { createTrack, extractSlides, setupContainer, setupTrack, setupSlides, getAllSlides } from './utils/domUtils';
import { setupAccessibility, setupResizeObserver, updateDimensions, handleKeyDown } from './utils/eventUtils';

/** Event types emitted by the carousel */
export type CarouselEventType = 'select' | 'scroll';

/** Event object passed to event callbacks */
export interface CarouselEvent {
  type: CarouselEventType;
  index: number;
}

/**
 * Carousel class provides a fully-featured carousel component.
 * 
 * Usage:
 * ```typescript
 * import { Carousel } from './carousel';
 * 
 * const container = document.getElementById('carousel');
 * const carousel = new Carousel(container, {
 *   slidesPerView: 1,
 *   loop: true,
 *   dragFree: true,
 *   duration: 300,
 *   gap: 20
 * });
 * 
 * carousel.on('select', (event) => {
 *   console.log('Selected slide:', event.index);
 * });
 * ```
 */
export class Carousel {
  /** The container element */
  private container: HTMLElement;
  
  /** The scrollable track element */
  private track: HTMLElement;
  
  /** Original slides extracted from container */
  private slides: HTMLElement[];
  
  /** Configuration options */
  private options: CarouselOptions;
  
  
  /** Event listeners storage */
  private listeners: Map<string, Set<(event: CarouselEvent) => void>> = new Map();
  
  /** ResizeObserver for responsive updates */
  private resizeObserver: ResizeObserver | null = null;
  
  
  /** Cached dimensions */
  private slideWidth = 0;
  private originalCount = 0;
  private cloneCount = 0;
  
  /** Drag handler instance */
  private dragHandler: DragHandler | null = null;
  
  /** Infinite scroll handler instance */
  private infiniteScroll: InfiniteScroll | null = null;

  /**
   * Creates a new Carousel instance.
   * 
   * @param container - The HTMLElement to initialize the carousel in
   * @param options - Optional configuration options
   */
  constructor(container: HTMLElement, options: Partial<CarouselOptions> = {}) {
    this.container = container;
    this.options = { ...defaultCarouselOptions, ...options };
    this.track = createTrack(this.options.gap);
    this.slides = extractSlides(this.container);
    
    // Initialize loop parameters
    this.originalCount = this.slides.length;
    this.cloneCount = this.originalCount;
    this.slideWidth = this.calculateSlideWidth();
    
    this.setupContainer();
    this.setupTrack();
    this.setupSlides();
    this.setupEventListeners();
    this.setupAccessibility();
    this.setupResizeObserver();
    this.updateDimensions();
  }



  /**
   * Sets up the container element styles and structure
   */
  private setupContainer(): void {
    setupContainer(this.container, this.track);
  }

  /**
   * Sets up the track with original slides and clones for infinite scroll
   */
  private setupTrack(): void {
    setupTrack(this.track, this.slides, this.options.loop);
  }

  /**
   * Configures styles for all slides including clones
   */
  private setupSlides(): void {
    const slides = getAllSlides(this.track);
    const slideWidth = calculateSlideWidth(
      this.container.offsetWidth,
      this.options.gap,
      this.options.slidesPerView
    );
    
    setupSlides(slides, slideWidth);
  }

  /**
   * Calculates the width of each slide based on container size and slidesPerView.
   * @returns The calculated slide width in pixels
   */
  private calculateSlideWidth(): number {
    return calculateSlideWidth(
      this.container.offsetWidth,
      this.options.gap,
      this.options.slidesPerView
    );
  }

  /**
   * Gets all slides including clones from the track.
   * @returns Array of all slide elements
   */
  private getAllSlides(): HTMLElement[] {
    return getAllSlides(this.track);
  }

  /**
   * Sets up event listeners for all interactions
   */
  private setupEventListeners(): void {
    // Initialize infinite scroll (works with or without dragFree)
    if (this.options.loop) {
      this.infiniteScroll = new InfiniteScroll(
        () => this.track.scrollLeft,
        (pos) => { this.track.scrollLeft = pos; },
        {
          slideWidth: this.slideWidth,
          gap: this.options.gap,
          originalCount: this.originalCount,
          cloneCount: this.cloneCount,
        },
        { enabled: this.options.loop }
      );
    }
    
    // Initialize drag handler
    if (this.options.dragFree) {
      this.dragHandler = new DragHandler(
        this.track,
        (index) => this.emit({ type: 'scroll', index }),
        { enabled: true },
        () => this.track.scrollLeft,
        (pos) => { this.track.scrollLeft = pos; },
        () => this.getSelectedIndex()
      );
      
      // Connect drag handler to infinite scroll
      if (this.infiniteScroll) {
        this.dragHandler.setLoopCallback(() => {
          this.infiniteScroll?.handleInfiniteScroll();
        });
      }
    }

    // Wheel scrolling - Always add the event listener, but handle it conditionally
    this.track.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Native scroll events for keyboard/wheel (when not using dragFree)
    this.track.addEventListener('scroll', this.handleNativeScroll.bind(this));
  }
  
  /**
   * Handles native scroll events from keyboard/wheel.
   */
  private handleNativeScroll(): void {
    // Handle infinite scroll
    this.infiniteScroll?.handleInfiniteScroll();
    
    // Emit scroll event
    this.emit({ type: 'scroll', index: this.getSelectedIndex() });
  }


  /**
   * Handles keyboard navigation.
   * @param event - The keyboard event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    
    handleKeyDown(event, this.track, slideWidth);
  }

  /**
   * Sets up accessibility attributes for the carousel.
   */
  private setupAccessibility(): void {
    setupAccessibility(this.container, this.track, this.getAllSlides());
  }

  /**
   * Sets up ResizeObserver for responsive dimension updates.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = setupResizeObserver(this.container, () => {
      this.updateDimensions();
    });
  }

  /**
   * Updates slide dimensions on resize.
   */
  private updateDimensions(): void {
    const slideWidth = this.calculateSlideWidth();
    this.slideWidth = slideWidth;
    const slides = this.getAllSlides();
    
    updateDimensions(this.track, slides, slideWidth);
    
    // Update infinite scroll params
    this.infiniteScroll?.updateParams({
      slideWidth,
      gap: this.options.gap,
    });
  }

  /**
   * Gets the index of the currently selected slide.
   * @returns The selected slide index
   */
  public getSelectedIndex(): number {
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    const scrollPosition = this.track.scrollLeft;
    
    return getSelectedIndex(
      scrollPosition,
      slideWidth,
      this.cloneCount,
      this.originalCount,
      this.options.loop,
      this.slides.length
    );
  }

  /**
   * Scrolls to a specific slide index.
   * @param index - The target slide index
   * @param smooth - Whether to use smooth scrolling
   */
  public scrollTo(index: number, smooth = true): void {
    if (index < 0 || index >= this.slides.length) return;
    
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    const targetScroll = calculateTargetScroll(
      index,
      slideWidth,
      this.cloneCount,
      this.options.loop
    );
    
    this.track.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    this.track.scrollLeft = targetScroll;
  }

  /**
   * Scrolls to the next slide.
   */
  public scrollNext(): void {
    this.scrollTo((this.getSelectedIndex() + 1) % this.slides.length);
  }

  /**
   * Scrolls to the previous slide.
   */
  public scrollPrev(): void {
    this.scrollTo((this.getSelectedIndex() - 1 + this.slides.length) % this.slides.length);
  }

  /**
   * Adds an event listener.
   * @param type - The event type
   * @param callback - The callback function
   */
  public on(type: CarouselEventType, callback: (event: CarouselEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Removes an event listener.
   * @param type - The event type
   * @param callback - The callback function to remove
   */
  public off(type: CarouselEventType, callback: (event: CarouselEvent) => void): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emits an event to all registered listeners.
   * @param event - The event to emit
   */
  private emit(event: CarouselEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  /**
   * Destroys the carousel and cleans up all resources.
   */
  public destroy(): void {
    this.dragHandler?.destroy();
    this.resizeObserver?.disconnect();
    this.listeners.clear();
    this.track.innerHTML = '';
  }

  /**
   * Handles mouse wheel scrolling with momentum.
   * @param event - The wheel event
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.options.wheel || event.deltaX === 0) return;

    event.preventDefault();
    
    // Reset any drag state that might interfere
    if (this.dragHandler) {
      this.dragHandler.cancelMomentum();
    }
    
    // Reset scroll behavior to auto for immediate response
    this.track.style.scrollBehavior = 'auto';
    
    const velocity = event.deltaX * 1.0;
    const currentScroll = this.track.scrollLeft;
    const newScroll = currentScroll + velocity;
    
    this.track.scrollLeft = newScroll;
    this.infiniteScroll?.handleInfiniteScroll();
    this.emit({ type: 'scroll', index: this.getSelectedIndex() });
  }
}
