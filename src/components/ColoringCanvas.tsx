import { Circle, Ellipse, Path, Rect, Svg } from 'react-native-svg';

import type { ColoringPage, ColoringState, Region } from '@/types/coloring';

const UNFILLED = '#FFFFFF';

type RegionElementProps = {
  region: Region;
  fill: string;
  stroke: string;
  strokeWidth: number;
  interactive: boolean;
  onPress?: () => void;
};

export function RegionElement({
  region,
  fill,
  stroke,
  strokeWidth,
  interactive,
  onPress,
}: RegionElementProps) {
  const common = {
    fill,
    stroke,
    strokeWidth,
    onPress: interactive ? onPress : undefined,
    pressOpacity: interactive ? 0.7 : undefined,
  };

  switch (region.shape) {
    case 'circle':
      return <Circle cx={region.cx} cy={region.cy} r={region.r} {...common} />;
    case 'ellipse':
      return (
        <Ellipse cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...common} />
      );
    case 'rect':
      return (
        <Rect
          x={region.x}
          y={region.y}
          width={region.width}
          height={region.height}
          rx={region.rx}
          {...common}
        />
      );
    case 'path':
      return <Path d={region.d} strokeLinejoin="round" {...common} />;
    default:
      return null;
  }
}

export type ColoringCanvasProps = {
  page: ColoringPage;
  fills?: ColoringState;
  selectedColor?: string;
  onPaint?: (regionId: string) => void;
  /** When false the artwork is a static preview (gallery thumbnails). */
  interactive?: boolean;
  style?: { width?: number; height?: number };
};

export function ColoringCanvas({
  page,
  fills = {},
  onPaint,
  interactive = true,
  style,
}: ColoringCanvasProps) {
  const stroke = page.stroke ?? '#2D3436';
  const strokeWidth = page.strokeWidth ?? 3;

  return (
    <Svg viewBox={page.viewBox} style={{ width: '100%', height: '100%', ...style }}>
      {page.regions.map((region) => (
        <RegionElement
          key={region.id}
          region={region}
          fill={fills[region.id] ?? UNFILLED}
          stroke={stroke}
          strokeWidth={strokeWidth}
          interactive={interactive}
          onPress={onPaint ? () => onPaint(region.id) : undefined}
        />
      ))}
      {page.outlines?.map((outline, index) => (
        <Path
          key={`outline-${index}`}
          d={outline.d}
          fill="none"
          stroke={stroke}
          strokeWidth={outline.width ?? strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      ))}
    </Svg>
  );
}
