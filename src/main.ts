import {
  calculateGauge,
  GaugeInputError,
  type GaugeField,
  type GaugeInput,
  type GaugeResult,
} from './gauge.ts';

const inputIds: Record<GaugeField, string> = {
  swatchStitches: 'swatch-stitches',
  swatchRows: 'swatch-rows',
  swatchWidthCm: 'swatch-width',
  swatchHeightCm: 'swatch-height',
  targetWidthCm: 'target-width',
  targetHeightCm: 'target-height',
  motifWidthCm: 'motif-width',
  motifHeightCm: 'motif-height',
};

function getInput(document: Document, field: GaugeField): HTMLInputElement {
  const element = document.getElementById(inputIds[field]);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing number input #${inputIds[field]}.`);
  }
  return element;
}

function optionalValue(input: HTMLInputElement): number | undefined {
  return input.value.trim() === '' ? undefined : input.valueAsNumber;
}

function readInput(document: Document): GaugeInput {
  return {
    swatchStitches: getInput(document, 'swatchStitches').valueAsNumber,
    swatchRows: getInput(document, 'swatchRows').valueAsNumber,
    swatchWidthCm: getInput(document, 'swatchWidthCm').valueAsNumber,
    swatchHeightCm: getInput(document, 'swatchHeightCm').valueAsNumber,
    targetWidthCm: getInput(document, 'targetWidthCm').valueAsNumber,
    targetHeightCm: getInput(document, 'targetHeightCm').valueAsNumber,
    motifWidthCm: optionalValue(getInput(document, 'motifWidthCm')),
    motifHeightCm: optionalValue(getInput(document, 'motifHeightCm')),
  };
}

function formatResult(result: GaugeResult): string {
  const lines = [
    `${result.targetStitches} stitches across`,
    `${result.targetRows} rows high`,
    `Gauge: ${result.stitchesPerCm.toFixed(2)} stitches/cm · ${result.rowsPerCm.toFixed(2)} rows/cm`,
    'Stitch and row counts round up to meet the requested dimensions.',
  ];

  if (result.motifEstimate) {
    const { across, down, total } = result.motifEstimate;
    lines.push(`Motif estimate: ${across} across × ${down} down (${total} total).`);
  }

  return lines.join('\n');
}

function clearError(document: Document, field: GaugeField): void {
  const input = getInput(document, field);
  const message = document.getElementById(`${inputIds[field]}-error`);
  input.removeAttribute('aria-invalid');
  if (message) message.textContent = '';
}

function clearErrors(document: Document): void {
  for (const field of Object.keys(inputIds) as GaugeField[]) {
    clearError(document, field);
  }
}

function showError(document: Document, error: GaugeInputError): void {
  const input = getInput(document, error.field);
  const message = document.getElementById(`${inputIds[error.field]}-error`);
  input.setAttribute('aria-invalid', 'true');
  if (message) message.textContent = error.message;
  input.focus();
}

export function mountCalculator(document: Document): void {
  const form = document.getElementById('gauge-form');
  const resultCard = document.getElementById('result-card');
  const resultSummary = document.getElementById('result-summary');

  if (!(form instanceof HTMLFormElement) || !resultCard || !resultSummary) {
    throw new Error('The calculator form or its result area is missing.');
  }

  for (const field of Object.keys(inputIds) as GaugeField[]) {
    getInput(document, field).addEventListener('input', () => {
      clearError(document, field);
      resultCard.hidden = true;
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors(document);

    try {
      const result = calculateGauge(readInput(document));
      resultSummary.textContent = formatResult(result);
      resultCard.hidden = false;
    } catch (error) {
      resultCard.hidden = true;
      if (error instanceof GaugeInputError) {
        showError(document, error);
        return;
      }
      throw error;
    }
  });
}

if (typeof document !== 'undefined') {
  mountCalculator(document);
}
