/**
 * Carousel - A production-ready carousel component with infinite scrolling and momentum-based interactions.
 * 
 * Features:
 * - Infinite loop scrolling
 * - Free scroll (dragFree mode)
 * - Mouse drag and touch swipe support with momentum
 * - Keyboard navigation
 * - Mouse wheel scrolling with horizontal support
 * - Accessibility support (ARIA labels, keyboard navigation, focus management)
 * - Customizable slides per view
 * - Responsive design with ResizeObserver
 * 
 * @module CarouselModule
 */

import { CarouselOptions, defaultCarouselOptions } from './CarouselOptions';
import { DragHandler } from './DragHandler';
import { InfiniteScroll } from './InfiniteScroll';

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
  
  /** Animation frame for scroll animations */
  private animationFrame: number | null = null;
  
  /** Event listeners storage */
  private listeners: Map<string, Set<(event: CarouselEvent) => void>> = new Map();
  
  /** ResizeObserver for responsive updates */
  private resizeObserver: ResizeObserver | null = null;
  
  /** Wheel scroll state */
  private wheelVelocity = 0;
  private wheelLastTime = 0;
  private wheelAnimationFrame: number | null = null;
  private wheelDeceleration = 0.95;
  
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
    this.track = this.createTrack();
    this.slides = this.extractSlides();
    
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
   * Creates and configures the scrollable track element.
   * @returns The configured track element
   */
  private createTrack(): HTMLElement {
    const track = document.createElement('div');
    track.className = 'carousel__track';
    track.style.cssText = `
      display: flex;
      gap: ${this.options.gap}px;
      overflow: hidden;
      scroll-behavior: auto;
      -webkit-overflow-scrolling: touch;
    `;
    return track;
  }

  /**
   * Extracts slides from the container element.
   * @returns Array of slide elements
   */
  private extractSlides(): HTMLElement[] {
    const slides = Array.from(this.container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    return slides;
  }

  /**
   * Sets up the container element styles and structure
   */
  private setupContainer(): void {
    this.container.style.cssText = `
      overflow: hidden;
      width: 100%;
    `;
    this.container.appendChild(this.track);
  }

  /**
   * Sets up the track with original slides and clones for infinite scroll
   */
  private setupTrack(): void {
    this.track.innerHTML = '';
    
    if (this.options.loop && this.slides.length > 0) {
      // Add clones at start and end for infinite scroll
      const clonesStart = this.slides.map(slide => this.cloneSlide(slide));
      const clonesEnd = this.slides.map(slide => this.cloneSlide(slide));
      
      clonesStart.forEach(clone => this.track.appendChild(clone));
      this.slides.forEach(slide => this.track.appendChild(slide));
      clonesEnd.forEach(clone => this.track.appendChild(clone));
    } else {
      this.slides.forEach(slide => this.track.appendChild(slide));
    }
  }

  /**
   * Creates a clone of a slide element for infinite scroll.
   * @param slide - The slide to clone
   * @returns A cloned HTMLElement
   */
  private cloneSlide(slide: HTMLElement): HTMLElement {
    const clone = slide.cloneNode(true) as HTMLElement;
    clone.classList.add('carousel__slide--clone');
    return clone;
  }

  /**
   * Configures styles for all slides including clones
   */
  private setupSlides(): void {
    const slides = this.getAllSlides();
    const slideWidth = this.calculateSlideWidth();
    
    slides.forEach((slide) => {
      slide.classList.add('carousel__slide');
      slide.style.cssText = `
        flex: 0 0 ${slideWidth}px;
        min-width: ${slideWidth}px;
        user-select: none;
        transition: transform 0.3s ease;
      `;
      
      // Add hover scale effect
      slide.addEventListener('mouseenter', () => {
        slide.style.transform = 'scale(1.02)';
      });
      slide.addEventListener('mouseleave', () => {
        slide.style.transform = 'scale(1)';
      });
    });
  }

  /**
   * Calculates the width of each slide based on container size and slidesPerView.
   * @returns The calculated slide width in pixels
   */
  private calculateSlideWidth(): number {
    const containerWidth = this.container.offsetWidth;
    const gap = this.options.gap;
    const totalGap = gap * (this.options.slidesPerView - 1);
    return (containerWidth - totalGap) / this.options.slidesPerView;
  }

  /**
   * Gets all slides including clones from the track.
   * @returns Array of all slide elements
   */
  private getAllSlides(): HTMLElement[] {
    return Array.from(this.track.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
  }

  /**
   * Sets up event listeners for all interactions
   */
  private setupEventListeners(): void {
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
      
      // Initialize infinite scroll
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
      
      // Connect drag handler to infinite scroll
      this.dragHandler.setLoopCallback(() => {
        this.infiniteScroll?.handleInfiniteScroll();
      });
    }

    // Wheel scrolling
    this.track.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handles wheel scrolling with horizontal support and momentum.
   * @param event - The wheel event
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const now = performance.now();
    const timeDelta = now - this.wheelLastTime;
    this.wheelLastTime = now;
    
    // Get horizontal delta first, fallback to vertical
    let delta = event.deltaX;
    if (Math.abs(delta) < 1) {
      delta = event.deltaY;
    }
    
    // Calculate velocity with momentum
    if (timeDelta < 50) {
      this.wheelVelocity = delta;
    } else {
      this.wheelVelocity = delta * 0.5;
    }
    
    // Apply scroll
    this.track.scrollLeft += this.wheelVelocity;
    
    // Handle infinite scroll
    this.infiniteScroll?.handleInfiniteScroll();
    
    // Emit scroll event
    this.emit({ type: 'scroll', index: this.getSelectedIndex() });
    
    // Start momentum if velocity is significant
    if (Math.abs(this.wheelVelocity) > 1) {
      this.startWheelMomentum();
    }
  }

  /**
   * Starts wheel momentum animation for smooth scrolling.
   */
  private startWheelMomentum(): void {
    if (this.wheelAnimationFrame) {
      cancelAnimationFrame(this.wheelAnimationFrame);
    }
    
    const animate = (): void => {
      this.wheelVelocity *= this.wheelDeceleration;
      
      if (Math.abs(this.wheelVelocity) < 0.5) {
        this.wheelAnimationFrame = null;
        this.emit({ type: 'select', index: this.getSelectedIndex() });
        return;
      }
      
      this.track.scrollLeft += this.wheelVelocity;
      this.infiniteScroll?.handleInfiniteScroll();
      
      this.wheelAnimationFrame = requestAnimationFrame(animate);
    };
    
    this.wheelAnimationFrame = requestAnimationFrame(animate);
  }

  /**
   * Handles keyboard navigation.
   * @param event - The keyboard event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.track.scrollBy({ left: -slideWidth, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.track.scrollBy({ left: slideWidth, behavior: 'smooth' });
        break;
      case 'Home':
        event.preventDefault();
        this.track.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        event.preventDefault();
        this.track.scrollTo({ left: this.track.scrollWidth, behavior: 'smooth' });
        break;
    }
  }

  /**
   * Sets up accessibility attributes for the carousel.
   */
  private setupAccessibility(): void {
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Carousel');
    this.container.setAttribute('tabindex', '0');
    
    this.track.setAttribute('role', 'list');
    this.track.setAttribute('aria-live', 'polite');
    
    this.getAllSlides().forEach((slide, index) => {
      slide.setAttribute('role', 'listitem');
      slide.setAttribute('aria-label', `Slide ${index + 1}`);
    });
  }

  /**
   * Sets up ResizeObserver for responsive dimension updates.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions();
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Updates slide dimensions on resize.
   */
  private updateDimensions(): void {
    const slideWidth = this.calculateSlideWidth();
    this.slideWidth = slideWidth;
    const slides = this.getAllSlides();
    
    slides.forEach(slide => {
      slide.style.flex = `0 0 ${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
    });
    
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
    const index = Math.round(scrollPosition / slideWidth);
    
    if (this.options.loop) {
      return (index - this.cloneCount + this.originalCount) % this.originalCount;
    }
    
    return Math.min(index, this.slides.length - 1);
  }

  /**
   * Scrolls to a specific slide index.
   * @param index - The target slide index
   * @param smooth - Whether to use smooth scrolling
   */
  public scrollTo(index: number, smooth = true): void {
    if (index < 0 || index >= this.slides.length) return;
    
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    let targetScroll: number;
    
    if (this.options.loop) {
      targetScroll = (this.cloneCount + index) * slideWidth;
    } else {
      targetScroll = index * slideWidth;
    }
    
    this.track.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    this.track.scrollLeft = targetScroll;
  }

  /**
   * Scrolls to the next slide.
   */
  public scrollNext(): void {
    const nextIndex = (this.getSelectedIndex() + 1) % this.slides.length;
    this.scrollTo(nextIndex);
  }

  /**
   * Scrolls to the previous slide.
   */
  public scrollPrev(): void {
    const prevIndex = (this.getSelectedIndex() - 1 + this.slides.length) % this.slides.length;
    this.scrollTo(prevIndex);
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
    // Cancel all animations
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.wheelAnimationFrame) {
      cancelAnimationFrame(this.wheelAnimationFrame);
    }
    
    // Destroy drag handler
    this.dragHandler?.destroy();
    
    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Clear listeners and track
    this.listeners.clear();
    this.track.innerHTML = '';
  }

  /**
   * Gets the root container element.
   * @returns The container element
   */
  public getRoot(): HTMLElement {
    return this.container;
  }

  /**
   * Gets the internal track element.
   * @returns The track element
   */
  public getTrack(): HTMLElement {
    return this.track;
  }

  /**
   * Gets all original slides.
   * @returns Array of slide elements
   */
  public getSlides(): HTMLElement[] {
    return this.slides;
  }

  /**
   * Gets the current configuration options.
   * @returns Copy of current options
   */
  public getOptions(): CarouselOptions {
    return { ...this.options };
  }
}
