import { Carousel } from './index';

// Demo initialization
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('carousel');
  
  if (!container) {
    console.error('Carousel container not found');
    return;
  }

  // Create carousel instance
  const carousel = new Carousel(container as HTMLElement, {
    slidesPerView: 1,
    loop: true,
    dragFree: true,
    duration: 300,
    gap: 20
  });

  // Log initial state
  console.log('Carousel initialized', {
    slides: carousel.getSlides().length,
    options: carousel.getOptions()
  });

  // Listen for events
  carousel.on('select', (event) => {
    console.log('Slide selected:', event.index);
  });

  carousel.on('scroll', (event) => {
    console.log('Scrolling to:', event.index);
  });

  // Expose carousel globally for debugging
  (window as unknown as { carousel: Carousel }).carousel = carousel;
});
