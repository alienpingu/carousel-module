/**
 * Utility functions for DOM operations and element creation
 */

/**
 * Creates and configures the scrollable track element.
 * @param gap - The gap between slides
 * @returns The configured track element
 */
export function createTrack(gap: number): HTMLElement {
  const track = document.createElement('div');
  track.className = 'carousel__track';
  track.style.cssText = `
    display: flex;
    gap: ${gap}px;
    overflow: hidden;
    scroll-behavior: auto;
    -webkit-overflow-scrolling: touch;
  `;
  return track;
}

/**
 * Extracts slides from the container element.
 * @param container - The container element
 * @returns Array of slide elements
 */
export function extractSlides(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
}

/**
 * Creates a clone of a slide element for infinite scroll.
 * @param slide - The slide to clone
 * @returns A cloned HTMLElement
 */
export function cloneSlide(slide: HTMLElement): HTMLElement {
  const clone = slide.cloneNode(true) as HTMLElement;
  clone.classList.add('carousel__slide--clone');
  return clone;
}

/**
 * Configures styles for all slides including clones
 * @param slides - Array of slide elements
 * @param slideWidth - Width of each slide
 */
export function setupSlides(slides: HTMLElement[], slideWidth: number): void {
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
 * Sets up the container element styles and structure
 * @param container - The container element
 * @param track - The track element
 */
export function setupContainer(container: HTMLElement, track: HTMLElement): void {
  container.style.cssText = `
    overflow: hidden;
    width: 100%;
  `;
  container.appendChild(track);
}

/**
 * Sets up the track with original slides and clones for infinite scroll
 * @param track - The track element
 * @param slides - Array of original slides
 * @param loop - Whether infinite loop is enabled
 */
export function setupTrack(track: HTMLElement, slides: HTMLElement[], loop: boolean): void {
  track.innerHTML = '';
  
  if (loop && slides.length > 0) {
    // Add clones at start and end for infinite scroll
    const clonesStart = slides.map(slide => cloneSlide(slide));
    const clonesEnd = slides.map(slide => cloneSlide(slide));
    
    clonesStart.forEach(clone => track.appendChild(clone));
    slides.forEach(slide => track.appendChild(slide));
    clonesEnd.forEach(clone => track.appendChild(clone));
  } else {
    slides.forEach(slide => track.appendChild(slide));
  }
}

/**
 * Gets all slides including clones from the track.
 * @param track - The track element
 * @returns Array of all slide elements
 */
export function getAllSlides(track: HTMLElement): HTMLElement[] {
  return Array.from(track.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
}