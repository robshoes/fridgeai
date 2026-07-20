// Vision §Design: verde come colore principale, colori neutri, minimal.
// One place for every color used across screens (Fase 7 design system) —
// previously ~100 repeated hex literals across ~20 files.
export const colors = {
  primary: '#2e7d32',
  primaryLight: '#e8f5e9',
  danger: '#c62828',
  warning: '#f9a825',
  disabled: '#9e9e9e',
  text: '#000000',
  textMuted: '#666666',
  textFaint: '#999999',
  border: '#eeeeee',
  borderStrong: '#cccccc',
  white: '#ffffff',
  black: '#000000',
} as const;
