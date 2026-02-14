# Carousel Module

A production-ready carousel component with infinite scrolling and momentum-based interactions.

## Features

- **Infinite Loop**: Seamless infinite scrolling using slide clones
- **Free Scroll**: No snap/anchor points for free-form scrolling
- **Momentum Scrolling**: Smooth momentum after drag release
- **Mouse Drag**: Click and drag to scroll
- **Touch Swipe**: Mobile touch support
- **Keyboard Navigation**: Arrow keys, Home, End
- **Mouse Wheel**: Horizontal scroll support with momentum
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive**: Adapts to viewport changes
- **TypeScript**: Full TypeScript support

## Installation

```bash
bun install
```

## Usage

```typescript
import { Carousel } from './src/index';

const container = document.getElementById('carousel');
const carousel = new Carousel(container, {
  slidesPerView: 1,
  loop: true,
  dragFree: true,
  duration: 300,
  gap: 20
});

// Events
carousel.on('select', (event) => {
  console.log('Selected slide:', event.index);
});

carousel.on('scroll', (event) => {
  console.log('Scrolling to:', event.index);
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `slidesPerView` | `number` | `1` | Number of slides to show |
| `loop` | `boolean` | `true` | Enable infinite loop |
| `dragFree` | `boolean` | `true` | Enable free scroll |
| `duration` | `number` | `300` | Animation duration (ms) |
| `gap` | `number` | `20` | Gap between slides (px) |
| `easing` | `EasingFunction` | `easeOutCubic` | Easing function |

## API

```typescript
// Scroll to specific slide
carousel.scrollTo(index: number, smooth?: boolean);

// Navigation
carousel.scrollNext();
carousel.scrollPrev();

// Get state
carousel.getSelectedIndex();
carousel.getSlides();
carousel.getOptions();
carousel.getRoot();
carousel.getTrack();

// Events
carousel.on('select', callback);
carousel.on('scroll', callback);

// Cleanup
carousel.destroy();
```

## Development

```bash
# Build
bun run build

# Serve example
bun run dev

## Project Structure

```
src/
├── index.ts              # Entry point
├── main.ts              # Demo
└── carousel/
    ├── Carousel.ts      # Main class
    ├── CarouselOptions.ts
    ├── DragHandler.ts   # Drag with momentum
    ├── InfiniteScroll.ts # Loop handling
    └── index.ts
```

## License

See [LICENSE](./LICENSE) for details.
