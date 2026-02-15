/**
 * Carousel Module - A production-ready carousel component
 * 
 * Features:
 * - Infinite loop scrolling
 * - Free scroll (no snap/anchor points)
 * - Mouse drag and touch swipe support with momentum
 * - Accessibility support (ARIA labels, focus management)
 * - Customizable slides per view
 * - Smooth momentum-based scrolling
 * - Responsive design
 * 
 * @module CarouselModule
 */

// Main exports
export { Carousel } from './carousel/Carousel';
export type { CarouselEvent, CarouselEventType } from './carousel/Carousel';

// Configuration exports
export { defaultCarouselOptions, easeOutCubic } from './carousel/CarouselOptions';
export type { CarouselOptions, EasingFunction } from './carousel/CarouselOptions';
