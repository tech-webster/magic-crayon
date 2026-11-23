import { useRouter } from 'expo-router';
import { useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

import { PlaygroundBackground } from '@/components/playground-background';
import { KidButton } from '@/components/ui/kid-button';
import { PressScale } from '@/components/ui/press-scale';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { playSfx } from '@/lib/sfx';
import { Brand, Kids, PALETTE, Radius, SCREEN_BG, StickerShadow, tint } from '@/constants/kidsTheme';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DoodleStroke } from '@/types/coloring';

const CANVAS_W = 300;
const CANVAS_H = 420;
const BRUSH_SIZES = [4, 8, 14] as const;
type BrushSize = (typeof BRUSH_SIZES)[number];

export default function FreeDrawScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const [color, setColor] = useState<string>(PALETTE[3].hex);
  const [brushSize, setBrushSize] = useState<BrushSize>(BRUSH_SIZES[1]);
  const [strokes, setStrokes] = useState<DoodleStroke[]>([]);
  const [current, setCurrent] = useState<{ x: number; y: number }[]>([]);
  const [frame, setFrame] = useState({ w: 0, h: 0 });

  const toView = (x: number, y: number) => {
    if (!frame.w || !frame.h) return { x, y };
    return { x: (x / frame.w) * CANVAS_W, y: (y / frame.h) * CANVAS_H };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      playSfx('select');
      const { locationX, locationY } = e.nativeEvent;
      setCurrent([toView(locationX, locationY)]);
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setCurrent((prev) => [...prev, toView(locationX, locationY)]);
    },
    onPanResponderRelease: () => {
      setCurrent((prev) => {
        if (prev.length > 1) {
          setStrokes((s) => [...s, { points: prev, color, width: brushSize }]);
        }
        return [];
      });
    },
    onPanResponderTerminate: () => setCurrent([]),
  });

  const clearAll = () => {
    setStrokes([]);
    setCurrent([]);
    playSfx('back');
  };

  const strokePath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={[styles.container, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light, paddingTop: insets.top }]}>
      <PlaygroundBackground />

      <View style={styles.header}>
        <KidButton label="Back" emoji="←" compact sound="back" onPress={() => router.push('/explore')} />
        <View style={styles.titleWrap}>
          <View style={styles.titlePill}>
            <Text style={styles.titleEmoji}>🖍️</Text>
            <Text style={styles.titleText}>Free Drawing</Text>
          </View>
        </View>
        <SoundToggle />
      </View>

      <View style={styles.canvasWrap} onLayout={(e) => setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <View style={styles.canvasCard} {...panResponder.panHandlers}>
          <Svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ width: '100%', height: '100%' }}>
            {strokes.map((s, i) => (
              <Path
                key={i}
                d={strokePath(s.points)}
                stroke={s.color}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {current.length > 1 ? (
              <Path
                d={strokePath(current)}
                stroke={color}
                strokeWidth={brushSize}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>
      </View>

      <View style={styles.toolsRow}>
        {BRUSH_SIZES.map((size) => (
          <PressScale
            key={size}
            accessibilityRole="button"
            accessibilityLabel={`Brush size ${size}`}
            sound="select"
            onPress={() => setBrushSize(size)}
            scaleTo={0.86}
            style={[styles.sizeBtn, brushSize === size && styles.sizeBtnActive]}>
            <View style={{ width: size * 1.4, height: size * 1.4, borderRadius: 999, backgroundColor: brushSize === size ? Brand.ink : tint(Brand.ink, 0.5) }} />
          </PressScale>
        ))}
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Clear canvas"
          sound="back"
          onPress={clearAll}
          scaleTo={0.86}
          style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </PressScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette} style={styles.paletteScroll}>
        {PALETTE.map((swatch) => {
          const selected = color === swatch.hex;
          return (
            <PressScale
              key={swatch.hex}
              accessibilityLabel={swatch.name}
              onPress={() => setColor(swatch.hex)}
              sound="select"
              scaleTo={0.85}>
              <View style={[styles.swatch, { backgroundColor: swatch.hex }, selected && styles.swatchSelected]} />
            </PressScale>
          );
        })}
      </ScrollView>

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: tint(Brand.primary, 0.25),
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...StickerShadow,
  },
  titleEmoji: { fontSize: 14 },
  titleText: { fontSize: 14, fontWeight: '800', color: Brand.ink },
  canvasWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  canvasCard: {
    flex: 1,
    backgroundColor: Brand.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: tint(Brand.primary, 0.15),
    overflow: 'hidden',
    ...StickerShadow,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sizeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: '#E7E2F7',
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  sizeBtnActive: { backgroundColor: Brand.yellow, borderColor: '#F0BE4F' },
  clearBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Brand.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  clearText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  paletteScroll: { flexGrow: 0 },
  palette: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
  },
  swatch: {
    width: Kids.swatch,
    height: Kids.swatch,
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...StickerShadow,
  },
  swatchSelected: { borderColor: Brand.ink, transform: [{ scale: 1.15 }] },
});
