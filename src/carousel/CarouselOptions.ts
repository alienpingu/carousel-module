/**
 * Easing function type for smooth transitions
 */
export type EasingFunction = (t: number) => number;

/**
 * Default ease out cubic easing
 */
export const easeOutCubic: EasingFunction = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Configuration options for the Carousel
 */
export interface CarouselOptions {
  /**
   * Number of slides to show per view
   * @default 1
   */
  slidesPerView: number;

  /**
   * Enable infinite loop scrolling
   * @default true
   */
  loop: boolean;

  /**
   * Enable free scroll (no snap/anchor points)
   * @default true
   */
  dragFree: boolean;

  /**
   * Enable mouse wheel scrolling
   * @default true
   */
  wheel: boolean;

  /**
   * Animation duration in milliseconds
   * @default 300
   */
  duration: number;

  /**
   * Easing function for animations
   * @default easeOutCubic
   */
  easing: EasingFunction;

  /**
   * Gap between slides in pixels
   * @default 20
   */
  gap: number;
}

/**
 * Default carousel options
 */
export const defaultCarouselOptions: CarouselOptions = {
  slidesPerView: 1,
  loop: true,
  dragFree: true,
  wheel: true,
  duration: 300,
  easing: easeOutCubic,
  gap: 20
};
