# Stitch Gauge

A small crochet calculator that turns a measured swatch into stitch and row counts for a finished size. If you enter the size of one motif, it also estimates how many repeats cover the piece.

## Run it

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The calculator runs in the browser; it does not save or send the values you enter.

## Example

This swatch has 21 stitches across 8.5 cm and 25 rows across 9.5 cm. For a 17.2 cm × 12.8 cm piece, the calculator rounds up to 43 stitches × 34 rows. With 7 cm × 6 cm motifs, it estimates 3 across and 3 down.

To check the calculation without opening the page:

```sh
node --experimental-strip-types --input-type=module <<'NODE'
import { calculateGauge } from './src/gauge.ts';

const result = calculateGauge({
  swatchStitches: 21,
  swatchRows: 25,
  swatchWidthCm: 8.5,
  swatchHeightCm: 9.5,
  targetWidthCm: 17.2,
  targetHeightCm: 12.8,
  motifWidthCm: 7,
  motifHeightCm: 6,
});

console.log(`${result.targetStitches} stitches × ${result.targetRows} rows`);
console.log(result.motifEstimate);
NODE
```

## How the estimate works

Stitch and row rates are the count divided by the measured swatch width or height. Target counts use `Math.ceil`, so the result reaches or slightly exceeds the requested dimensions. Motifs are treated as rectangles; the estimate rounds the number across and down up to whole repeats.

Stitch patterns, seams, and blocking can change the finished size. Measure a swatch made and blocked the same way as the project, and allow for finishing separately.

## Checks

`npm test` passes 10 tests. `npm run typecheck` and `npm run build` are included; they could not be verified in the authoring environment because the npm registry could not be reached to install TypeScript and Vite.
