/**
 * Utility functions for event handling and management
 */

import { CarouselEvent, CarouselEventType } from '../Carousel';

/**
 * Sets up accessibility attributes for the carousel.
 * @param container - The container element
 * @param track - The track element
 * @param slides - Array of slide elements
 */
export function setupAccessibility(container: HTMLElement, track: HTMLElement, slides: HTMLElement[]): void {
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Carousel');
  container.setAttribute('tabindex', '0');
  
  track.setAttribute('role', 'list');
  track.setAttribute('aria-live', 'polite');
  
  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'listitem');
    slide.setAttribute('aria-label', `Slide ${index + 1}`);
  });
}

/**
 * Sets up ResizeObserver for responsive dimension updates.
 * @param container - The container element
 * @param callback - Callback function to handle resize
 * @returns ResizeObserver instance
 */
export function setupResizeObserver(container: HTMLElement, callback: () => void): ResizeObserver {
  const resizeObserver = new ResizeObserver(() => {
    callback();
  });
  resizeObserver.observe(container);
  return resizeObserver;
}

/**
 * Updates slide dimensions on resize.
 * @param track - The track element
 * @param slides - Array of slide elements
 * @param slideWidth - New slide width
 */
export function updateDimensions(track: HTMLElement, slides: HTMLElement[], slideWidth: number): void {
  slides.forEach(slide => {
    slide.style.flex = `0 0 ${slideWidth}px`;
    slide.style.minWidth = `${slideWidth}px`;
  });
}

/**
 * Handles keyboard navigation.
 * @param event - The keyboard event
 * @param track - The track element
 * @param slideWidth - Width of each slide including gap
 */
export function handleKeyDown(event: KeyboardEvent, track: HTMLElement, slideWidth: number): void {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      track.scrollBy({ left: -slideWidth, behavior: 'smooth' });
      break;
    case 'ArrowRight':
      event.preventDefault();
      track.scrollBy({ left: slideWidth, behavior: 'smooth' });
      break;
    case 'Home':
      event.preventDefault();
      track.scrollTo({ left: 0, behavior: 'smooth' });
      break;
    case 'End':
      event.preventDefault();
      track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      break;
  }
}

/**
 * Event emitter for carousel events
 */
export class EventEmitter {
  private listeners: Map<string, Set<(event: CarouselEvent) => void>> = new Map();

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
  public emit(event: CarouselEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  /**
   * Clears all event listeners
   */
  public clear(): void {
    this.listeners.clear();
  }
}