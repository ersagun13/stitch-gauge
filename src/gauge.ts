export interface GaugeInput {
  swatchStitches: number;
  swatchRows: number;
  swatchWidthCm: number;
  swatchHeightCm: number;
  targetWidthCm: number;
  targetHeightCm: number;
  motifWidthCm?: number;
  motifHeightCm?: number;
}

export type GaugeField = keyof GaugeInput;

export interface GaugeResult {
  stitchesPerCm: number;
  rowsPerCm: number;
  targetStitches: number;
  targetRows: number;
  motifEstimate?: {
    across: number;
    down: number;
    total: number;
  };
}

export class GaugeInputError extends Error {
  readonly field: GaugeField;

  constructor(field: GaugeField, message: string) {
    super(message);
    this.name = 'GaugeInputError';
    this.field = field;
  }
}

export function calculateGauge(input: GaugeInput): GaugeResult {
  const requiredValues: Array<[GaugeField, number]> = [
    ['swatchStitches', input.swatchStitches],
    ['swatchRows', input.swatchRows],
    ['swatchWidthCm', input.swatchWidthCm],
    ['swatchHeightCm', input.swatchHeightCm],
    ['targetWidthCm', input.targetWidthCm],
    ['targetHeightCm', input.targetHeightCm],
  ];

  for (const [field, value] of requiredValues) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new GaugeInputError(field, 'Enter a positive number.');
    }
  }

  for (const field of ['swatchStitches', 'swatchRows'] as const) {
    if (!Number.isInteger(input[field])) {
      throw new GaugeInputError(field, 'Enter a whole number of stitches or rows.');
    }
  }

  const motifWidthCm = input.motifWidthCm;
  const motifHeightCm = input.motifHeightCm;
  const hasMotifWidth = motifWidthCm !== undefined;
  const hasMotifHeight = motifHeightCm !== undefined;
  if (hasMotifWidth !== hasMotifHeight) {
    const missingField = hasMotifWidth ? 'motifHeightCm' : 'motifWidthCm';
    throw new GaugeInputError(missingField, 'Enter both motif dimensions or leave both blank.');
  }

  if (hasMotifWidth && hasMotifHeight) {
    if (!Number.isFinite(motifWidthCm) || motifWidthCm <= 0) {
      throw new GaugeInputError('motifWidthCm', 'Enter a positive number.');
    }
    if (!Number.isFinite(motifHeightCm) || motifHeightCm <= 0) {
      throw new GaugeInputError('motifHeightCm', 'Enter a positive number.');
    }
  }

  const stitchesPerCm = input.swatchStitches / input.swatchWidthCm;
  const rowsPerCm = input.swatchRows / input.swatchHeightCm;
  const targetStitches = Math.ceil(input.targetWidthCm * stitchesPerCm);
  const targetRows = Math.ceil(input.targetHeightCm * rowsPerCm);

  if (!Number.isSafeInteger(targetStitches)) {
    throw new GaugeInputError('targetWidthCm', 'The target stitch count is too large to calculate safely.');
  }
  if (!Number.isSafeInteger(targetRows)) {
    throw new GaugeInputError('targetHeightCm', 'The target row count is too large to calculate safely.');
  }

  const result: GaugeResult = {
    stitchesPerCm,
    rowsPerCm,
    targetStitches,
    targetRows,
  };

  if (hasMotifWidth && hasMotifHeight) {
    const across = Math.ceil(input.targetWidthCm / motifWidthCm);
    const down = Math.ceil(input.targetHeightCm / motifHeightCm);
    const total = across * down;

    if (!Number.isSafeInteger(total)) {
      throw new GaugeInputError('motifWidthCm', 'The motif estimate is too large to calculate safely.');
    }

    result.motifEstimate = { across, down, total };
  }

  return result;
}
