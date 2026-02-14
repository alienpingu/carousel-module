/**
 * Build script for carousel-module using Bun's bundler API
 * 
 * Usage: bun run build.ts
 *        bun build.ts
 */

Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'browser',
  sourcemap: 'linked',
  minify: true,
  splitting: true,
  // Banner for ESM
  banner: `/**
 * Carousel Module - A production-ready carousel component
 * Built with Bun
 */`,
});
