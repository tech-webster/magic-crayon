import { Circle, Ellipse, Path, Rect, Svg } from 'react-native-svg';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type HostInstance,
  type LayoutChangeEvent,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { hitTestRegion } from '@/lib/hit-test';
import { playSfx, startBrush, stopBrush } from '@/lib/sfx';
import { Brand, tint } from '@/constants/kidsTheme';
import type { ColoringPage, ColoringState, Region } from '@/types/coloring';

const UNFILLED = '#FFFFFF';

export type CanvasTool = 'fill' | 'brush';

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
  // Keep `onPress`; react-native-svg maps it to `onClick` on web. The six
  // dev-only `onResponder*` toasts it also emits are patched out upstream
  // root, see react-native-svg#3088.
  const common = {
    fill,
    stroke,
    strokeWidth,
    onPress: interactive ? onPress : undefined,
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
  /** "fill" paints one region per tap; "brush" paints by dragging the finger. */
  tool?: CanvasTool;
  /** Brush reach in viewBox units (small/medium/large paintbrush sizes). */
  brushRadius?: number;
  /** When false the artwork is a static preview (gallery thumbnails). */
  interactive?: boolean;
  style?: { width?: number; height?: number };
};

type Frame = { x: number; y: number; w: number; h: number };
const EMPTY_FRAME: Frame = { x: 0, y: 0, w: 0, h: 0 };

type ViewBox = { minX: number; minY: number; width: number; height: number };

function parseViewBox(viewBox: string): ViewBox {
  const parts = viewBox.split(/[\s,]+/).map(Number);
  const [minX = 0, minY = 0, width = 0, height = 0] = parts;
  return { minX, minY, width, height };
}

export function ColoringCanvas({
  page,
  fills = {},
  onPaint,
  tool = 'fill',
  brushRadius = 9,
  interactive = true,
  style,
}: ColoringCanvasProps) {
  const stroke = page.stroke ?? '#2D3436';
  const strokeWidth = page.strokeWidth ?? 3;

  // Only the paintbrush tool claims the touch: it drives both smooth drag
  // painting and the looping brush sound. The fill tool keeps plain taps.
  const dragPaint = interactive && !!onPaint && tool === 'brush';

  const wrapRef = useRef<HostInstance | null>(null);
  const [frame, setFrame] = useState<Frame>(EMPTY_FRAME);
  // Stable per-canvas set: regions already painted during the current stroke,
  // so one drag paints each region exactly once (and pops exactly once).
  const [paintedThisStroke] = useState(() => new Set<string>());
  // Soft dab that follows the finger while brushing (updated via Animated
  // values only, so moving the brush never re-renders the drawing).
  const [cursor] = useState(() => ({
    pos: new Animated.ValueXY(),
    opacity: new Animated.Value(0),
  }));

  useEffect(() => {
    // Safety net: never leave the brush texture looping after unmount.
    return () => stopBrush();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!width || !height) return;
    wrapRef.current?.measureInWindow((x, y) => {
      setFrame({ x, y, w: width, h: height });
    });
  };

  function localPoint(event: { nativeEvent: { locationX?: number | null; locationY?: number | null; pageX: number; pageY: number } }) {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    // Android can deliver a null locationX on grant; fall back to page coords.
    return {
      localX: locationX ?? pageX - frame.x,
      localY: locationY ?? pageY - frame.y,
    };
  }

  // Map a point in the wrapper to viewBox coordinates, then paint the region
  // under it (topmost region wins, so details like eyes beat shapes behind).
  function paintAt(localX: number, localY: number) {
    if (!dragPaint || !onPaint) return;
    const { w, h } = frame;
    if (!w || !h) return;
    const box = parseViewBox(page.viewBox);
    const scale = Math.min(w / box.width, h / box.height);
    const offsetX = (w - box.width * scale) / 2;
    const offsetY = (h - box.height * scale) / 2;
    const viewX = box.minX + (localX - offsetX) / scale;
    const viewY = box.minY + (localY - offsetY) / scale;
    const region = hitTestRegion(page, viewX, viewY, brushRadius);
    if (!region || paintedThisStroke.has(region.id)) return;
    paintedThisStroke.add(region.id);
    playSfx('pop');
    onPaint(region.id);
  }

  function moveCursor(localX: number, localY: number) {
    const { w, h } = frame;
    if (!w || !h) return;
    const box = parseViewBox(page.viewBox);
    const scale = Math.min(w / box.width, h / box.height);
    cursor.pos.setValue({ x: localX - brushRadius * scale, y: localY - brushRadius * scale });
    cursor.opacity.setValue(1);
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => dragPaint,
    onMoveShouldSetPanResponder: () => dragPaint,
    onPanResponderGrant: (event) => {
      paintedThisStroke.clear();
      startBrush();
      const { localX, localY } = localPoint(event);
      moveCursor(localX, localY);
      paintAt(localX, localY);
    },
    onPanResponderMove: (event) => {
      const { localX, localY } = localPoint(event);
      moveCursor(localX, localY);
      paintAt(localX, localY);
    },
    onPanResponderRelease: () => {
      stopBrush();
      cursor.opacity.setValue(0);
    },
    onPanResponderTerminate: () => {
      stopBrush();
      cursor.opacity.setValue(0);
    },
  });

  // On-screen size of the brush dab, in pixels.
  const cursorSize =
    frame.w && frame.h
      ? brushRadius * 2 * Math.min(frame.w / parseViewBox(page.viewBox).width, frame.h / parseViewBox(page.viewBox).height)
      : 0;

  return (
    <View
      ref={wrapRef}
      onLayout={handleLayout}
      style={{ width: '100%', height: '100%', ...style }}
      {...(dragPaint ? panResponder.panHandlers : {})}>
      <Svg viewBox={page.viewBox} style={{ width: '100%', height: '100%' }}>
        {page.regions.map((region) => (
          <RegionElement
            key={region.id}
            region={region}
            fill={fills[region.id] ?? UNFILLED}
            stroke={stroke}
            strokeWidth={strokeWidth}
            interactive={interactive && !dragPaint}
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
      {dragPaint && cursorSize > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.brushCursor,
            {
              width: cursorSize,
              height: cursorSize,
              borderRadius: cursorSize / 2,
              opacity: cursor.opacity,
              transform: [
                { translateX: cursor.pos.x },
                { translateY: cursor.pos.y },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brushCursor: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: tint(Brand.primary, 0.3),
  },
});
