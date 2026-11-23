export type PageCategory =
  | 'Animals'
  | 'Vehicles'
  | 'Nature'
  | 'Fun'
  | 'Flowers'
  | 'Birds'
  | 'Fruits'
  | 'Vegetables'
  | 'Sea Creatures'
  | 'Cartoon'
  | 'Festivals'
  | 'Space';

export type Region =
  | { shape: 'circle'; id: string; cx: number; cy: number; r: number }
  | { shape: 'ellipse'; id: string; cx: number; cy: number; rx: number; ry: number }
  | { shape: 'rect'; id: string; x: number; y: number; width: number; height: number; rx?: number }
  | { shape: 'path'; id: string; d: string };

/** A line-art detail that never receives fill (eyes, whiskers, borders). */
export type Outline = { d: string; width?: number };

export type ColoringPage = {
  id: string;
  title: string;
  category: PageCategory;
  /** 1 = easiest, 3 = more regions to fill. */
  difficulty: 1 | 2 | 3;
  viewBox: string;
  /** Default stroke color for region borders + outlines. */
  stroke?: string;
  strokeWidth?: number;
  regions: Region[];
  outlines?: Outline[];
};

/** Map of regionId -> color hex. Missing key = unfilled (white). */
export type ColoringState = Record<string, string>;

export type Artwork = {
  id: string;
  pageId: string;
  title: string;
  fills: ColoringState;
  updatedAt: number;
};

export type DoodleStroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};
