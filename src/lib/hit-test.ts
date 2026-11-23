import type { ColoringPage, Region } from '@/types/coloring';

type Pt = { x: number; y: number };
type Ring = Pt[];

/** Curve sample count: smooth enough to hug the drawn shapes, cheap to test. */
const CURVE_STEPS = 14;
/** Default extra reach (viewBox units) so taps land inside, not on the line. */
const DEFAULT_SLACK = 2.5;

type PathGeometry = { rings: Ring[]; minX: number; minY: number; maxX: number; maxY: number };
type PageGeometry = { paths: Map<string, PathGeometry> };

const geometryCache = new WeakMap<ColoringPage, PageGeometry>();

const isLetter = (token: string) => /^[a-zA-Z]$/.test(token);

function tokenizePath(d: string): string[] {
  return d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
}

/**
 * Flatten an SVG path (M L H V C Q Z in both cases — the only commands used by
 * the hand-authored pages) into polygon rings for point-in-shape testing.
 */
function parsePathRings(d: string): Ring[] {
  const tokens = tokenizePath(d);
  const rings: Ring[] = [];
  let ring: Ring = [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const num = () => parseFloat(tokens[i++]);
  const push = (x: number, y: number) => ring.push({ x, y });

  while (i < tokens.length) {
    const token = tokens[i];
    if (isLetter(token)) {
      cmd = token;
      i += 1;
    }
    switch (cmd) {
      case 'M':
      case 'm': {
        let x = num();
        let y = num();
        if (cmd === 'm') {
          x += cx;
          y += cy;
        }
        if (ring.length > 0) rings.push(ring);
        ring = [];
        sx = x;
        sy = y;
        cx = x;
        cy = y;
        push(x, y);
        cmd = cmd === 'M' ? 'L' : 'l';
        break;
      }
      case 'L':
      case 'l': {
        let x = num();
        let y = num();
        if (cmd === 'l') {
          x += cx;
          y += cy;
        }
        push(x, y);
        cx = x;
        cy = y;
        break;
      }
      case 'H':
      case 'h': {
        let x = num();
        if (cmd === 'h') x += cx;
        push(x, cy);
        cx = x;
        break;
      }
      case 'V':
      case 'v': {
        let y = num();
        if (cmd === 'v') y += cy;
        push(cx, y);
        cy = y;
        break;
      }
      case 'C':
      case 'c': {
        let x1 = num();
        let y1 = num();
        let x2 = num();
        let y2 = num();
        let x = num();
        let y = num();
        if (cmd === 'c') {
          x1 += cx;
          y1 += cy;
          x2 += cx;
          y2 += cy;
          x += cx;
          y += cy;
        }
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS;
          const u = 1 - t;
          push(
            u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
            u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
          );
        }
        cx = x;
        cy = y;
        break;
      }
      case 'Q':
      case 'q': {
        let x1 = num();
        let y1 = num();
        let x = num();
        let y = num();
        if (cmd === 'q') {
          x1 += cx;
          y1 += cy;
          x += cx;
          y += cy;
        }
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS;
          const u = 1 - t;
          push(
            u * u * cx + 2 * u * t * x1 + t * t * x,
            u * u * cy + 2 * u * t * y1 + t * t * y,
          );
        }
        cx = x;
        cy = y;
        break;
      }
      case 'Z':
      case 'z': {
        push(sx, sy);
        rings.push(ring);
        ring = [];
        cx = sx;
        cy = sy;
        break;
      }
      default:
        // Unknown command (none used by the pages): skip its token safely.
        i += 1;
        break;
    }
  }
  if (ring.length > 0) rings.push(ring);
  return rings;
}

/** Even-odd point test across every ring of a path region. */
function pointInRings(x: number, y: number, rings: Ring[]): boolean {
  let inside = false;
  for (const ring of rings) {
    if (ring.length < 3) continue;
    for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) {
      const yi = ring[j].y;
      const yk = ring[k].y;
      if (yi > y !== yk > y) {
        const xi = ring[j].x;
        const xk = ring[k].x;
        if (x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) inside = !inside;
      }
    }
  }
  return inside;
}

function pathGeometry(region: Extract<Region, { shape: 'path' }>): PathGeometry {
  const rings = parsePathRings(region.d);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (const point of ring) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  }
  return { rings, minX, minY, maxX, maxY };
}

function geometryFor(page: ColoringPage): PageGeometry {
  let cached = geometryCache.get(page);
  if (!cached) {
    cached = { paths: new Map() };
    geometryCache.set(page, cached);
  }
  return cached;
}

/** Which coloring region (if any) sits under this viewBox point? Topmost wins. */
export function hitTestRegion(
  page: ColoringPage,
  x: number,
  y: number,
  /** Extra reach in viewBox units — the paintbrush radius, or the tap default. */
  slack: number = DEFAULT_SLACK,
): Region | null {
  const geometry = geometryFor(page);
  const regions = page.regions;
  for (let index = regions.length - 1; index >= 0; index--) {
    const region = regions[index];
    switch (region.shape) {
      case 'circle': {
        const dx = x - region.cx;
        const dy = y - region.cy;
        if (dx * dx + dy * dy <= (region.r + slack) ** 2) return region;
        break;
      }
      case 'ellipse': {
        const nx = (x - region.cx) / (region.rx + slack);
        const ny = (y - region.cy) / (region.ry + slack);
        if (nx * nx + ny * ny <= 1) return region;
        break;
      }
      case 'rect': {
        if (
          x >= region.x - slack &&
          x <= region.x + region.width + slack &&
          y >= region.y - slack &&
          y <= region.y + region.height + slack
        ) {
          return region;
        }
        break;
      }
      case 'path': {
        let cached = geometry.paths.get(region.id);
        if (!cached) {
          cached = pathGeometry(region);
          geometry.paths.set(region.id, cached);
        }
        if (
          x >= cached.minX - slack &&
          x <= cached.maxX + slack &&
          y >= cached.minY - slack &&
          y <= cached.maxY + slack &&
          pointInRings(x, y, cached.rings)
        ) {
          return region;
        }
        break;
      }
    }
  }
  return null;
}
