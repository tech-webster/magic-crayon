import type { PageCategory } from '@/types/coloring';

/** Bright, playful brand palette for ColorJoy Kids. */
export const Brand = {
  primary: '#6C5CE7',
  primaryDark: '#4834D4',
  accent: '#FF7675',
  yellow: '#FDCB6E',
  mint: '#00B894',
  sky: '#0984E3',
  cream: '#FFF8EE',
  ink: '#2D3436',
  card: '#FFFFFF',
} as const;

export const Radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const Kids = {
  /** Minimum tap target so little fingers can hit buttons comfortably. */
  minTouch: 52,
  swatch: 44,
  gap: 12,
} as const;

export type Swatch = { name: string; hex: string };

/** Kid-friendly crayon palette (kept in a pleasing rainbow order). */
export const PALETTE: Swatch[] = [
  { name: 'Red', hex: '#FF5252' },
  { name: 'Orange', hex: '#FF9F43' },
  { name: 'Yellow', hex: '#FFD93D' },
  { name: 'Green', hex: '#26DE81' },
  { name: 'Teal', hex: '#2BC0B4' },
  { name: 'Blue', hex: '#4A69FB' },
  { name: 'Purple', hex: '#A55EEA' },
  { name: 'Pink', hex: '#FF6B9D' },
  { name: 'Brown', hex: '#B07A4A' },
  { name: 'Black', hex: '#2D3436' },
  { name: 'White', hex: '#FFFFFF' },
];

export const CATEGORY_META: Record<PageCategory, { emoji: string; color: string }> = {
  Animals: { emoji: '🐾', color: '#00B894' },
  Vehicles: { emoji: '🚀', color: '#0984E3' },
  Nature: { emoji: '🌸', color: '#FF6B9D' },
  Fun: { emoji: '⭐', color: '#FDCB6E' },
};
