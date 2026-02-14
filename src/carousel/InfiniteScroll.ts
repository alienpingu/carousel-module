/**
 * InfiniteScroll - Handles infinite looping functionality for the carousel.
 * 
 * This module provides seamless infinite scrolling by:
 * - Cloning slides for visual continuity
 * - Jumping between clone positions without visual discontinuity
 */

/** Configuration for infinite scroll behavior */
export interface InfiniteScrollConfig {
  /** Whether infinite scroll is enabled */
  enabled: boolean;
}

/** Parameters needed for scroll calculations */
interface ScrollParams {
  slideWidth: number;
  gap: number;
  originalCount: number;
  cloneCount: number;
}

/**
 * InfiniteScroll class manages infinite looping behavior.
 */
export class InfiniteScroll {
  private config: InfiniteScrollConfig;
  private params: ScrollParams;
  private getScrollPosition: () => number;
  private setScrollPosition: (position: number) => void;

  /**
   * Creates a new InfiniteScroll instance.
   * 
   * @param getScrollPosition - Function to get current scroll position
   * @param setScrollPosition - Function to set scroll position
   * @param params - Scroll parameters (slideWidth, gap, counts)
   * @param options - Configuration options
   */
  constructor(
    getScrollPosition: () => number,
    setScrollPosition: (position: number) => void,
    params: ScrollParams,
    options: Partial<InfiniteScrollConfig> = {}
  ) {
    this.getScrollPosition = getScrollPosition;
    this.setScrollPosition = setScrollPosition;
    this.params = params;
    this.config = { enabled: true, ...options };
  }

  /**
   * Updates scroll parameters (e.g., on resize)
   */
  public updateParams(params: Partial<ScrollParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Handles infinite scroll logic.
   * Called during scroll to seamlessly jump between clone positions.
   */
  public handleInfiniteScroll(): void {
    if (!this.config.enabled || this.params.originalCount === 0) return;

    const { slideWidth, gap, originalCount, cloneCount } = this.params;
    const step = slideWidth + gap;
    const totalSlides = originalCount + cloneCount * 2;
    const totalWidth = totalSlides * step;

    const currentScroll = this.getScrollPosition();
    const cloneWidth = cloneCount * step;

    // When scrolling past the start clones, jump to the end
    if (currentScroll < cloneWidth - step) {
      const offset = originalCount * step;
      this.setScrollPosition(currentScroll + offset);
      return;
    }

    // When scrolling past the end clones, jump to the start
    if (currentScroll > totalWidth - cloneWidth + step) {
      const offset = originalCount * step;
      this.setScrollPosition(currentScroll - offset);
    }
  }

  /**
   * Sets whether infinite scroll is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Checks if infinite scroll is currently enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
