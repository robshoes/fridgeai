export type UnitFamily = 'weight' | 'volume' | 'count';

type InputUnit = { value: string; label: string; toBase: number };

// Units the user can pick from when entering a quantity. The stored value
// is always converted to the base unit of the family (g / ml / count) —
// see PRD §Normalizzazione delle unità di misura.
export const INPUT_UNITS: Record<UnitFamily, InputUnit[]> = {
  weight: [
    { value: 'g', label: 'g', toBase: 1 },
    { value: 'kg', label: 'kg', toBase: 1000 },
  ],
  volume: [
    { value: 'ml', label: 'ml', toBase: 1 },
    { value: 'l', label: 'L', toBase: 1000 },
  ],
  count: [{ value: 'count', label: 'pz', toBase: 1 }],
};

export function toBaseUnit(value: number, inputUnit: string, family: UnitFamily): number {
  const unit = INPUT_UNITS[family].find((candidate) => candidate.value === inputUnit);
  if (!unit) {
    throw new Error(`Unknown unit "${inputUnit}" for family "${family}"`);
  }
  return value * unit.toBase;
}

const WEIGHT_DISPLAY_THRESHOLD_G = 1000;
const VOLUME_DISPLAY_THRESHOLD_ML = 1000;

// Reverse of toBaseUnit, for display only — the base unit stays the
// source of truth in the database at all times.
export function formatQuantity(quantityBase: number, family: UnitFamily): string {
  switch (family) {
    case 'weight':
      return quantityBase >= WEIGHT_DISPLAY_THRESHOLD_G
        ? `${roundTo1Decimal(quantityBase / 1000)} kg`
        : `${quantityBase} g`;
    case 'volume':
      return quantityBase >= VOLUME_DISPLAY_THRESHOLD_ML
        ? `${roundTo1Decimal(quantityBase / 1000)} L`
        : `${quantityBase} ml`;
    case 'count':
      return `${quantityBase}`;
  }
}

// Picks a sensible {value, unit} pair to seed an edit form from a base
// quantity, mirroring the same threshold formatQuantity displays with.
export function baseToDefaultInput(
  quantityBase: number,
  family: UnitFamily,
): { value: number; unit: string } {
  if (family === 'weight' && quantityBase >= WEIGHT_DISPLAY_THRESHOLD_G) {
    return { value: roundTo1Decimal(quantityBase / 1000), unit: 'kg' };
  }
  if (family === 'volume' && quantityBase >= VOLUME_DISPLAY_THRESHOLD_ML) {
    return { value: roundTo1Decimal(quantityBase / 1000), unit: 'l' };
  }
  return { value: quantityBase, unit: INPUT_UNITS[family][0].value };
}

function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}
