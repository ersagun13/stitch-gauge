import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateGauge, GaugeInputError } from './gauge.ts';

test('calculates fractional gauge from a swatch that is not 10 cm', () => {
  const result = calculateGauge({
    swatchStitches: 21,
    swatchRows: 25,
    swatchWidthCm: 8.5,
    swatchHeightCm: 9.5,
    targetWidthCm: 17.2,
    targetHeightCm: 12.8,
  });

  assert.equal(result.stitchesPerCm, 21 / 8.5);
  assert.equal(result.rowsPerCm, 25 / 9.5);
  assert.equal(result.targetStitches, 43);
  assert.equal(result.targetRows, 34);
});

test('rounds target stitch and row counts up to cover the requested size', () => {
  const result = calculateGauge({
    swatchStitches: 18,
    swatchRows: 20,
    swatchWidthCm: 10,
    swatchHeightCm: 10,
    targetWidthCm: 10.01,
    targetHeightCm: 10.01,
  });

  assert.equal(result.targetStitches, 19);
  assert.equal(result.targetRows, 21);
});

test('rejects a zero swatch count with its field name', () => {
  assert.throws(
    () => calculateGauge({
      swatchStitches: 0,
      swatchRows: 20,
      swatchWidthCm: 10,
      swatchHeightCm: 10,
      targetWidthCm: 20,
      targetHeightCm: 20,
    }),
    (error) => error instanceof GaugeInputError && error.field === 'swatchStitches',
  );
});

test('rejects a negative target dimension with its field name', () => {
  assert.throws(
    () => calculateGauge({
      swatchStitches: 18,
      swatchRows: 20,
      swatchWidthCm: 10,
      swatchHeightCm: 10,
      targetWidthCm: 20,
      targetHeightCm: -1,
    }),
    (error) => error instanceof GaugeInputError && error.field === 'targetHeightCm',
  );
});

test('rejects zero or negative swatch and target measurements with their field names', () => {
  const validInput = {
    swatchStitches: 18,
    swatchRows: 20,
    swatchWidthCm: 10,
    swatchHeightCm: 10,
    targetWidthCm: 20,
    targetHeightCm: 20,
  };
  const invalidMeasurements = [
    ['swatchWidthCm', 0],
    ['swatchWidthCm', -1],
    ['swatchHeightCm', 0],
    ['swatchHeightCm', -1],
    ['targetWidthCm', 0],
    ['targetWidthCm', -1],
    ['targetHeightCm', 0],
    ['targetHeightCm', -1],
  ];

  for (const [field, value] of invalidMeasurements) {
    assert.throws(
      () => calculateGauge({ ...validInput, [field]: value }),
      (error) => error instanceof GaugeInputError && error.field === field,
      `${field}=${value} should be rejected`,
    );
  }
});

test('rejects a fractional swatch stitch count', () => {
  assert.throws(
    () => calculateGauge({
      swatchStitches: 18.5,
      swatchRows: 20,
      swatchWidthCm: 10,
      swatchHeightCm: 10,
      targetWidthCm: 20,
      targetHeightCm: 20,
    }),
    (error) => error instanceof GaugeInputError && error.field === 'swatchStitches',
  );
});

test('estimates whole motif columns, rows, and total', () => {
  const result = calculateGauge({
    swatchStitches: 20,
    swatchRows: 20,
    swatchWidthCm: 10,
    swatchHeightCm: 10,
    targetWidthCm: 21,
    targetHeightCm: 16,
    motifWidthCm: 7,
    motifHeightCm: 8,
  });

  assert.deepEqual(result.motifEstimate, { across: 3, down: 2, total: 6 });
});

test('requires both motif dimensions when either is supplied', () => {
  assert.throws(
    () => calculateGauge({
      swatchStitches: 20,
      swatchRows: 20,
      swatchWidthCm: 10,
      swatchHeightCm: 10,
      targetWidthCm: 21,
      targetHeightCm: 16,
      motifWidthCm: 7,
    }),
    (error) => error instanceof GaugeInputError && error.field === 'motifHeightCm',
  );
});
