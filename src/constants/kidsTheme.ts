import type { PageCategory } from '@/types/coloring';

/** Bright, playful brand palette for MagicCrayon. */
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
  swatch: 46,
  gap: 12,
} as const;

/** Screen backdrops behind the floating decorations. */
export const SCREEN_BG = {
  light: '#FFF5E9',
  dark: '#161B3D',
} as const;

/** Turn `#RRGGBB` into `rgba(...)` so it can tint any surface. */
export function tint(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Soft, sticker-like drop shadow used across the app. */
export const StickerShadow = {
  shadowColor: '#2D3436',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4,
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
  Flowers: { emoji: '🌼', color: '#FF6B9D' },
  Birds: { emoji: '🐦', color: '#0984E3' },
  Fruits: { emoji: '🍎', color: '#FF5252' },
  Vegetables: { emoji: '🥕', color: '#26DE81' },
  'Sea Creatures': { emoji: '🐙', color: '#2BC0B4' },
  Cartoon: { emoji: '🤖', color: '#A55EEA' },
  Festivals: { emoji: '🎉', color: '#FF9F43' },
  Space: { emoji: '🚀', color: '#4A69FB' },
};
