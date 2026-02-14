/**
 * Carousel Module - Main exports
 * 
 * This module exports all public APIs from the carousel package.
 */

// Main Carousel class and types
export { Carousel } from './Carousel';
export type { CarouselEvent, CarouselEventType } from './Carousel';

// Configuration
export { defaultCarouselOptions, easeOutCubic } from './CarouselOptions';
export type { CarouselOptions } from './CarouselOptions';
export type { EasingFunction } from './CarouselOptions';
