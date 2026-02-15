/**
 * Utility functions for scroll calculations and operations
 */

/**
 * Calculates the width of each slide based on container size and slidesPerView.
 * @param containerWidth - The width of the container
 * @param gap - The gap between slides
 * @param slidesPerView - Number of slides to show per view
 * @returns The calculated slide width in pixels
 */
export function calculateSlideWidth(
  containerWidth: number,
  gap: number,
  slidesPerView: number
): number {
  const totalGap = gap * (slidesPerView - 1);
  return (containerWidth - totalGap) / slidesPerView;
}

/**
 * Gets the index of the currently selected slide.
 * @param scrollPosition - Current scroll position
 * @param slideWidth - Width of each slide including gap
 * @param cloneCount - Number of clone slides
 * @param originalCount - Number of original slides
 * @param loop - Whether infinite loop is enabled
 * @param slidesLength - Total number of slides
 * @returns The selected slide index
 */
export function getSelectedIndex(
  scrollPosition: number,
  slideWidth: number,
  cloneCount: number,
  originalCount: number,
  loop: boolean,
  slidesLength: number
): number {
  const index = Math.round(scrollPosition / slideWidth);
  
  if (loop) {
    return (index - cloneCount + originalCount) % originalCount;
  }
  
  return Math.min(index, slidesLength - 1);
}

/**
 * Calculates the target scroll position for a specific slide index.
 * @param index - Target slide index
 * @param slideWidth - Width of each slide including gap
 * @param cloneCount - Number of clone slides
 * @param loop - Whether infinite loop is enabled
 * @returns Target scroll position
 */
export function calculateTargetScroll(
  index: number,
  slideWidth: number,
  cloneCount: number,
  loop: boolean
): number {
  if (loop) {
    return (cloneCount + index) * slideWidth;
  } else {
    return index * slideWidth;
  }
}