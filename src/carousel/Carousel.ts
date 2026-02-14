import { CarouselOptions, defaultCarouselOptions } from './CarouselOptions';

export type CarouselEventType = 'select' | 'scroll';

export interface CarouselEvent {
  type: CarouselEventType;
  index: number;
}

/**
 * Custom Carousel class replicating Embla Carousel functionality
 */
export class Carousel {
  private container: HTMLElement;
  private track: HTMLElement;
  private slides: HTMLElement[];
  private options: CarouselOptions;
  private animationFrame: number | null = null;
  private isDragging = false;
  private startX = 0;
  private currentX = 0;
  private scrollStart = 0;
  private listeners: Map<string, Set<(event: CarouselEvent) => void>> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private wheelVelocity = 0;
  private wheelLastTime = 0;
  private wheelAnimationFrame: number | null = null;
  private wheelMomentum = 0;
  private wheelDeceleration = 0.95;
  private slideWidth = 0;
  private originalCount = 0;
  private cloneCount = 0;
  private isLooping = false;

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
   * Create the scrollable track element
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
   * Extract slides from the container
   */
  private extractSlides(): HTMLElement[] {
    const slides = Array.from(this.container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    return slides;
  }

  /**
   * Setup the container element
   */
  private setupContainer(): void {
    this.container.style.cssText = `
      overflow: hidden;
      width: 100%;
    `;
    this.container.appendChild(this.track);
  }

  /**
   * Setup the track with slides
   */
  private setupTrack(): void {
    this.track.innerHTML = '';
    
    if (this.options.loop && this.slides.length > 0) {
      // Add clones for infinite scroll
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
   * Clone a slide element
   */
  private cloneSlide(slide: HTMLElement): HTMLElement {
    const clone = slide.cloneNode(true) as HTMLElement;
    clone.classList.add('carousel__slide--clone');
    return clone;
  }

  /**
   * Setup slide styles
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
      
      // Hover effect
      slide.addEventListener('mouseenter', () => {
        slide.style.transform = 'scale(1.02)';
      });
      slide.addEventListener('mouseleave', () => {
        slide.style.transform = 'scale(1)';
      });
    });
  }

  /**
   * Calculate slide width based on slidesPerView
   */
  private calculateSlideWidth(): number {
    const containerWidth = this.container.offsetWidth;
    const gap = this.options.gap;
    const totalGap = gap * (this.options.slidesPerView - 1);
    return (containerWidth - totalGap) / this.options.slidesPerView;
  }

  /**
   * Get all slides including clones
   */
  private getAllSlides(): HTMLElement[] {
    return Array.from(this.track.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
  }

  /**
   * Setup event listeners for mouse/touch interactions
   */
  private setupEventListeners(): void {
    // Mouse events
    this.track.addEventListener('mousedown', this.handleDragStart.bind(this));
    window.addEventListener('mousemove', this.handleDragMove.bind(this));
    window.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Touch events
    this.track.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
    this.track.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
    this.track.addEventListener('touchend', this.handleDragEnd.bind(this));

    // Wheel scrolling
    this.track.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle drag start
   */
  private handleDragStart(event: MouseEvent | TouchEvent): void {
    if (!this.options.dragFree) return;
    
    this.isDragging = true;
    this.startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.scrollStart = this.track.scrollLeft;
    this.track.style.cursor = 'grabbing';
    this.track.style.scrollBehavior = 'auto';
  }

  /**
   * Handle drag move
   */
  private handleDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    if ('touches' in event && event.touches.length === 0) return;
    
    event.preventDefault();
    
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.currentX = x;
    const diff = this.startX - this.currentX;
    const newScrollLeft = this.scrollStart + diff;
    
    this.track.scrollLeft = newScrollLeft;
    
    // Handle infinite scroll during drag
    if (this.options.loop) {
      this.handleInfiniteScroll();
    }
    
    this.emit({ type: 'scroll', index: this.getSelectedIndex() });
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.track.style.cursor = 'grab';
    this.track.style.scrollBehavior = 'smooth';
    
    if (this.options.loop) {
      this.handleInfiniteScroll();
    }
    
    this.emit({ type: 'select', index: this.getSelectedIndex() });
  }

  /**
   * Handle wheel scrolling with horizontal support
   */
  private handleWheel(event: WheelEvent): void {
    // Always prevent default to stop native scroll
    event.preventDefault();
    
    const now = performance.now();
    const timeDelta = now - this.wheelLastTime;
    this.wheelLastTime = now;
    
    // Get horizontal and vertical delta, prioritize horizontal
    let delta = event.deltaX;
    
    // If no horizontal scroll, use vertical
    if (Math.abs(delta) < 1) {
      delta = event.deltaY;
    }
    
    // Apply sensitivity factor
    const sensitivity = 1.5;
    
    // Calculate velocity with momentum
    if (timeDelta < 50) {
      // Quick wheel movement - build velocity
      this.wheelVelocity = delta;
    } else {
      // Slow wheel movement - reset velocity
      this.wheelVelocity = delta * 0.5;
    }
    
    // Apply scroll immediately
    const newScrollLeft = this.track.scrollLeft + this.wheelVelocity;
    this.track.scrollLeft = newScrollLeft;
    
    // Handle infinite scroll
    if (this.options.loop) {
      this.handleInfiniteScroll();
    }
    
    // Emit scroll event
    this.emit({ type: 'scroll', index: this.getSelectedIndex() });
    
    // Start momentum animation if velocity is significant
    if (Math.abs(this.wheelVelocity) > 1) {
      this.startWheelMomentum();
    }
  }

  /**
   * Start wheel momentum animation for smooth scrolling
   */
  private startWheelMomentum(): void {
    if (this.wheelAnimationFrame) {
      cancelAnimationFrame(this.wheelAnimationFrame);
    }
    
    const animate = (): void => {
      // Apply deceleration
      this.wheelVelocity *= this.wheelDeceleration;
      
      // Stop if velocity is too low
      if (Math.abs(this.wheelVelocity) < 0.5) {
        this.wheelAnimationFrame = null;
        this.emit({ type: 'select', index: this.getSelectedIndex() });
        return;
      }
      
      // Apply momentum
      const newScrollLeft = this.track.scrollLeft + this.wheelVelocity;
      this.track.scrollLeft = newScrollLeft;
      
      // Handle infinite scroll
      if (this.options.loop) {
        this.handleInfiniteScroll();
      }
      
      // Continue animation
      this.wheelAnimationFrame = requestAnimationFrame(animate);
    };
    
    this.wheelAnimationFrame = requestAnimationFrame(animate);
  }

  /**
   * Handle keyboard navigation
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
   * Handle infinite scroll logic
   */
  private handleInfiniteScroll(): void {
    // Use cached values if available
    const slideWidthVal = this.slideWidth > 0 ? this.slideWidth : this.calculateSlideWidth();
    const step = slideWidthVal + this.options.gap;
    const totalSlides = this.originalCount + this.cloneCount * 2;
    const totalWidth = totalSlides * step;
    
    const currentScroll = this.track.scrollLeft;
    const cloneWidth = this.cloneCount * step;
    
    // If looping is enabled and we have clones
    if (this.options.loop && this.originalCount > 0) {
      // When scrolling past the start clones, jump to the end
      if (currentScroll < cloneWidth - step) {
        const offset = this.originalCount * step;
        this.track.scrollLeft = currentScroll + offset;
        return;
      }
      
      // When scrolling past the end clones, jump to the start
      if (currentScroll > totalWidth - cloneWidth + step) {
        const offset = this.originalCount * step;
        this.track.scrollLeft = currentScroll - offset;
        return;
      }
    }
  }

  /**
   * Animate scroll to target position
   */
  private animateScroll(targetScroll: number): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startScroll = this.track.scrollLeft;
    const diff = targetScroll - startScroll;
    const duration = this.options.duration;
    const easing = this.options.easing;
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      this.track.scrollLeft = startScroll + diff * easedProgress;
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.emit({ type: 'select', index: this.getSelectedIndex() });
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Setup accessibility attributes
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
   * Setup resize observer for responsive updates
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions();
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Update dimensions on resize
   */
  private updateDimensions(): void {
    const slideWidth = this.calculateSlideWidth();
    const slides = this.getAllSlides();
    
    slides.forEach(slide => {
      slide.style.flex = `0 0 ${slideWidth}px`;
      slide.style.minWidth = `${slideWidth}px`;
    });
  }

  /**
   * Get the currently selected slide index
   */
  public getSelectedIndex(): number {
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    const scrollPosition = this.track.scrollLeft;
    const index = Math.round(scrollPosition / slideWidth);
    
    if (this.options.loop) {
      const originalCount = this.slides.length;
      const cloneCount = originalCount;
      return (index - cloneCount + originalCount) % originalCount;
    }
    
    return Math.min(index, this.slides.length - 1);
  }

  /**
   * Scroll to a specific slide index
   */
  public scrollTo(index: number, smooth = true): void {
    if (index < 0 || index >= this.slides.length) return;
    
    const slideWidth = this.calculateSlideWidth() + this.options.gap;
    let targetScroll: number;
    
    if (this.options.loop) {
      const originalCount = this.slides.length;
      const cloneCount = originalCount;
      targetScroll = (cloneCount + index) * slideWidth;
    } else {
      targetScroll = index * slideWidth;
    }
    
    this.track.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    this.track.scrollLeft = targetScroll;
    
    if (!smooth && this.options.loop) {
      setTimeout(() => this.handleInfiniteScroll(), 10);
    }
  }

  /**
   * Scroll to the next slide
   */
  public scrollNext(): void {
    const nextIndex = (this.getSelectedIndex() + 1) % this.slides.length;
    this.scrollTo(nextIndex);
  }

  /**
   * Scroll to the previous slide
   */
  public scrollPrev(): void {
    const prevIndex = (this.getSelectedIndex() - 1 + this.slides.length) % this.slides.length;
    this.scrollTo(prevIndex);
  }

  /**
   * Add event listener
   */
  public on(type: CarouselEventType, callback: (event: CarouselEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Remove event listener
   */
  public off(type: CarouselEventType, callback: (event: CarouselEvent) => void): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event
   */
  private emit(event: CarouselEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  /**
   * Destroy the carousel and cleanup
   */
  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.listeners.clear();
    this.track.innerHTML = '';
  }

  /**
   * Get the root container element
   */
  public getRoot(): HTMLElement {
    return this.container;
  }

  /**
   * Get the internal track element
   */
  public getTrack(): HTMLElement {
    return this.track;
  }

  /**
   * Get all original slides
   */
  public getSlides(): HTMLElement[] {
    return this.slides;
  }

  /**
   * Get current options
   */
  public getOptions(): CarouselOptions {
    return { ...this.options };
  }
}
