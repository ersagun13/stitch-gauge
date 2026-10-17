import assert from 'node:assert/strict';
import test from 'node:test';
import { mountCalculator } from './main.ts';

class FakeElement {
  constructor(id) {
    this.id = id;
    this.textContent = '';
    this.hidden = false;
    this.attributes = new Map();
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.(event);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

class FakeInput extends FakeElement {
  constructor(id, value) {
    super(id);
    this.value = value;
    this.focused = false;
  }

  get valueAsNumber() {
    if (this.value.trim() === '') return Number.NaN;
    const value = Number(this.value);
    return Number.isFinite(value) ? value : Number.NaN;
  }

  focus() {
    this.focused = true;
  }
}

class FakeForm extends FakeElement {}

globalThis.HTMLInputElement = FakeInput;
globalThis.HTMLFormElement = FakeForm;

function makeDocument(values = {}) {
  const byId = new Map();
  const form = new FakeForm('gauge-form');
  byId.set(form.id, form);

  const inputIds = {
    swatchStitches: 'swatch-stitches',
    swatchRows: 'swatch-rows',
    swatchWidthCm: 'swatch-width',
    swatchHeightCm: 'swatch-height',
    targetWidthCm: 'target-width',
    targetHeightCm: 'target-height',
    motifWidthCm: 'motif-width',
    motifHeightCm: 'motif-height',
  };

  for (const [name, id] of Object.entries(inputIds)) {
    const input = new FakeInput(id, values[name] ?? '');
    byId.set(id, input);
    byId.set(`${id}-error`, new FakeElement(`${id}-error`));
  }

  const resultCard = new FakeElement('result-card');
  resultCard.hidden = true;
  const resultSummary = new FakeElement('result-summary');
  byId.set(resultCard.id, resultCard);
  byId.set(resultSummary.id, resultSummary);

  return {
    document: { getElementById: (id) => byId.get(id) ?? null },
    form,
    resultCard,
    resultSummary,
    input: (name) => byId.get(inputIds[name]),
    error: (name) => byId.get(`${inputIds[name]}-error`),
  };
}

const completeValues = {
  swatchStitches: '21',
  swatchRows: '25',
  swatchWidthCm: '8.5',
  swatchHeightCm: '9.5',
  targetWidthCm: '17.2',
  targetHeightCm: '12.8',
  motifWidthCm: '7',
  motifHeightCm: '6',
};

test('submits the form and shows counts plus a motif estimate', () => {
  const ui = makeDocument(completeValues);
  mountCalculator(ui.document);
  let prevented = false;

  ui.form.dispatch('submit', { preventDefault: () => { prevented = true; } });

  assert.equal(prevented, true);
  assert.equal(ui.resultCard.hidden, false);
  assert.match(ui.resultSummary.textContent, /43 stitches across/);
  assert.match(ui.resultSummary.textContent, /34 rows high/);
  assert.match(ui.resultSummary.textContent, /3 across × 3 down/);
});

test('shows a validation message beside and focuses the invalid field', () => {
  const ui = makeDocument({ ...completeValues, swatchStitches: '0' });
  mountCalculator(ui.document);

  ui.form.dispatch('submit', { preventDefault() {} });

  assert.equal(ui.resultCard.hidden, true);
  assert.equal(ui.error('swatchStitches').textContent, 'Enter a positive number.');
  assert.equal(ui.input('swatchStitches').attributes.get('aria-invalid'), 'true');
  assert.equal(ui.input('swatchStitches').focused, true);
});

test('points an incomplete motif estimate to the missing dimension', () => {
  const ui = makeDocument({ ...completeValues, motifHeightCm: '' });
  mountCalculator(ui.document);

  ui.form.dispatch('submit', { preventDefault() {} });

  assert.equal(ui.error('motifHeightCm').textContent, 'Enter both motif dimensions or leave both blank.');
  assert.equal(ui.input('motifHeightCm').focused, true);
});
