import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { ColoringCanvas, type CanvasTool } from '@/components/ColoringCanvas';
import { PlaygroundBackground } from '@/components/playground-background';
import { KidButton } from '@/components/ui/kid-button';
import { PressScale } from '@/components/ui/press-scale';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { playSfx } from '@/lib/sfx';
import {
  Brand,
  CATEGORY_META,
  Kids,
  PALETTE,
  Radius,
  SCREEN_BG,
  StickerShadow,
  tint,
} from '@/constants/kidsTheme';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PAGES, getPageById } from '@/data/pages';
import type { ColoringState } from '@/types/coloring';

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  x: Math.round((i / 28) * 320 + (i % 3) * 6),
  color: ['#FF6B9D', '#FDCB6E', '#26DE81', '#4A69FB', '#A55EEA', '#FF9F43', '#2BC0B4'][i % 7],
  spin: 360 + (i % 5) * 180,
  drift: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 12),
}));
const BRUSH_RADII = { 1: 5, 2: 9, 3: 14 } as const;
type BrushSize = keyof typeof BRUSH_RADII;
const BRUSH_SIZE_META: Record<BrushSize, { label: string; dot: number }> = {
  1: { label: 'Small brush', dot: 10 },
  2: { label: 'Medium brush', dot: 16 },
  3: { label: 'Big brush', dot: 22 },
};

export default function ColoringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ page?: string }>();
  const page = getPageById(params.page) ?? PAGES[0];
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const [color, setColor] = useState<string>(PALETTE[3].hex);
  const [fills, setFills] = useState<ColoringState>({});
  const [tool, setTool] = useState<CanvasTool>('fill');
  const [brushSize, setBrushSize] = useState<BrushSize>(2);
  const [canvasArea, setCanvasArea] = useState({ w: 0, h: 0 });
  const [completed, setCompleted] = useState(false);
  const [coins, setCoins] = useState(0);
  const [stars, setStars] = useState(0);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<any>(null);
  const shownRef = useRef(false);
  const [confettiAnim] = useState(() => new Animated.Value(0));
  const [starAnims] = useState(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]);

  const meta = CATEGORY_META[page.category];
  const painted = Object.keys(fills).length;
  const total = page.regions.length;

  // The canvas adds the bubbly pop while brushing; taps get theirs here.
  const paint = (regionId: string) => {
    if (tool === 'fill') playSfx('pop');
    setFills((prev) => ({ ...prev, [regionId]: color }));
  };

  // Load reward totals.
  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('colorjoy.coins');
      const s = await AsyncStorage.getItem('colorjoy.stars');
      setCoins(c ? parseInt(c, 10) : 0);
      setStars(s ? parseInt(s, 10) : 0);
    })();
  }, []);



  // Cheer + reward when the whole picture is finished!
  useEffect(() => {
    if (total > 0 && painted === total && !shownRef.current) {
      shownRef.current = true;
      playSfx('reward');
      (async () => {
        const prevCoins = parseInt((await AsyncStorage.getItem('colorjoy.coins')) ?? '0', 10);
        const prevStars = parseInt((await AsyncStorage.getItem('colorjoy.stars')) ?? '0', 10);
        const newCoins = prevCoins + 10;
        const newStars = prevStars + 3;
        await AsyncStorage.setItem('colorjoy.coins', String(newCoins));
        await AsyncStorage.setItem('colorjoy.stars', String(newStars));
        setCoins(newCoins);
        setStars(newStars);
      })();
      setCompleted(true);
      // confetti + stars
      confettiAnim.setValue(0);
      starAnims.forEach((a) => a.setValue(0));
      Animated.timing(confettiAnim, { toValue: 1, duration: 1800, useNativeDriver: true }).start();
      starAnims.forEach((a, i) => {
        Animated.sequence([
          Animated.delay(i * 220),
          Animated.spring(a, { toValue: 1, speed: 12, bounciness: 16, useNativeDriver: true }),
        ]).start();
      });
    }
    if (painted === 0) {
      shownRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompleted(false);
    }
  }, [painted, total, confettiAnim, starAnims]);

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const uri = await captureRef(canvasRef.current, { format: 'png', quality: 1 });
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to save your artwork.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Your artwork is in your photos.');
    } catch {
      Alert.alert('Oops', 'Could not save your artwork.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!canvasRef.current) return;
      const uri = await captureRef(canvasRef.current, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your artwork' });
      }
    } catch {
      Alert.alert('Oops', 'Could not share your artwork.');
    }
  };

  const handleReplay = () => {
    setFills({});
    setCompleted(false);
    shownRef.current = false;
  };

  const handleNext = () => {
    setCompleted(false);
    shownRef.current = false;
    const idx = PAGES.findIndex((p) => p.id === page.id);
    const next = PAGES[(idx + 1) % PAGES.length];
    if (next && next.id !== page.id) {
      router.replace({ pathname: '/coloring', params: { page: next.id } });
    } else {
      router.push('/home');
    }
  };

  // Square canvas that always fits the available area (no scrolling, no crop).
  const canvasSize =
    canvasArea.w > 0 && canvasArea.h > 0
      ? Math.max(160, Math.min(canvasArea.w, canvasArea.h) - Spacing.three)
      : 0;
  const cappedCanvas = canvasSize > 0 ? Math.min(canvasSize, 560) : 0;

  return (
    <View style={[styles.container, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light, paddingTop: insets.top }]}>
      <PlaygroundBackground />

      <View style={styles.header}>
        <KidButton label="Back" emoji="←" compact sound="back" onPress={() => router.push('/home')} />

        <View style={styles.titleWrap}>
          <View style={styles.titlePill}>
            <Text style={styles.titleEmoji}>{meta.emoji}</Text>
            <Text style={styles.titleText} numberOfLines={1}>{page.title}</Text>
          </View>
        </View>

        <SoundToggle />

        <PressScale
          accessibilityRole="button"
          onPress={() => setFills({})}
          style={styles.resetBtn}>
          <Text style={styles.resetText}>↺</Text>
        </PressScale>
      </View>

      <View style={styles.canvasArea} onLayout={(e) => setCanvasArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {cappedCanvas > 0 ? (
          <View ref={canvasRef} style={[styles.canvasCard, { width: cappedCanvas, height: cappedCanvas }]}>
            <View style={styles.drawingBox}>
              <ColoringCanvas
                page={page}
                fills={fills}
                onPaint={paint}
                tool={tool}
                brushRadius={BRUSH_RADII[brushSize]}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.progressRow}>
        <Text style={dark ? [styles.progressText, styles.progressTextDark] : styles.progressText} numberOfLines={1}>
          {tool === 'brush' ? '🖌️ Brush across the picture!' : '🎨 Tap a shape to paint it!'}
        </Text>
        <Text style={dark ? [styles.progressText, styles.progressTextDark] : styles.progressText}>
          {painted} / {total} painted
        </Text>
      </View>

      <View style={styles.toolsRow}>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Fill tool"
          sound="select"
          onPress={() => setTool('fill')}
          scaleTo={0.86}
          style={[styles.toolBtn, tool === 'fill' && styles.toolBtnActive]}>
          <Text style={styles.toolEmoji}>🪣</Text>
        </PressScale>

        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Paintbrush tool"
          sound="select"
          onPress={() => setTool('brush')}
          scaleTo={0.86}
          style={[styles.toolBtn, tool === 'brush' && styles.toolBtnActive]}>
          <Text style={styles.toolEmoji}>🖌️</Text>
        </PressScale>

        {tool === 'brush' ? (
          <View style={styles.sizesRow}>
            {([1, 2, 3] as BrushSize[]).map((size) => {
              const sizeMeta = BRUSH_SIZE_META[size];
              const active = brushSize === size;
              return (
                <PressScale
                  key={size}
                  accessibilityRole="button"
                  accessibilityLabel={sizeMeta.label}
                  sound="select"
                  onPress={() => setBrushSize(size)}
                  scaleTo={0.86}
                  style={[styles.sizeBtn, active && styles.sizeBtnActive]}>
                  <View
                    style={{
                      width: sizeMeta.dot,
                      height: sizeMeta.dot,
                      borderRadius: 999,
                      backgroundColor: active ? Brand.ink : tint(Brand.ink, 0.55),
                    }}
                  />
                </PressScale>
              );
            })}
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.palette}
        style={styles.paletteScroll}>
        {PALETTE.map((swatch) => {
          const selected = color === swatch.hex;
          return (
            <PressScale
              key={swatch.hex}
              accessibilityLabel={swatch.name}
              onPress={() => setColor(swatch.hex)}
              sound="select"
              scaleTo={0.85}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: swatch.hex },
                  selected && styles.swatchSelected,
                ]}
              />
            </PressScale>
          );
        })}
      </ScrollView>

      {completed ? (
        <Modal
          visible={completed}
          transparent
          animationType="fade"
          onRequestClose={() => setCompleted(false)}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalCenter}>
            <View style={styles.celebrationCard}>
              <View style={styles.confettiLayer} pointerEvents="none">
                {CONFETTI.map((c, i) => {
                  const translateY = confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 440],
                  });
                  const opacity = confettiAnim.interpolate({
                    inputRange: [0, 0.15, 0.85, 1],
                    outputRange: [0, 1, 1, 0],
                  });
                  const rotate = confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${c.spin}deg`],
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.confettiPiece,
                        {
                          left: c.x,
                          backgroundColor: c.color,
                          opacity,
                          transform: [{ translateY }, { translateX: Animated.multiply(c.drift, confettiAnim) }, { rotate }],
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Trophy header */}
              <View style={styles.trophyWrap}>
                <View style={styles.trophyGlow} />
                <Text style={styles.trophy}>🏆</Text>
              </View>

              <Text style={styles.celebrationTitle}>Hooray! You did it! 🎉</Text>
              <Text style={styles.celebrationSubtitle}>Your masterpiece is complete!</Text>

              {/* Stars */}
              <View style={styles.starsRow}>
                {[0, 1, 2].map((i) => (
                  <Animated.Text
                    key={i}
                    style={[styles.starBig, { transform: [{ scale: starAnims[i] }, { rotate: '-8deg' }] }]}>
                    ⭐
                  </Animated.Text>
                ))}
              </View>

              {/* Reward cards */}
              <View style={styles.rewardCards}>
                <View style={[styles.rewardCard, { backgroundColor: '#FFF3D6', borderColor: '#F0BE4F' }]}>
                  <Text style={styles.rewardCardEmoji}>⭐</Text>
                  <Text style={styles.rewardCardValue}>+3</Text>
                  <Text style={styles.rewardCardLabel}>Stars</Text>
                </View>
                <View style={[styles.rewardCard, { backgroundColor: '#E6F6FF', borderColor: '#4A69FB' }]}>
                  <Text style={styles.rewardCardEmoji}>🪙</Text>
                  <Text style={styles.rewardCardValue}>+10</Text>
                  <Text style={styles.rewardCardLabel}>Coins</Text>
                </View>
              </View>
              <Text style={styles.rewardTotals}>Total: {stars} stars • {coins} coins</Text>

              {/* Buttons */}
              <View style={styles.buttonGrid}>
                <View style={styles.buttonRow}>
                  <PressScale
                    accessibilityRole="button"
                    accessibilityLabel="Save artwork"
                    sound="select"
                    disabled={saving}
                    onPress={handleSave}
                    scaleTo={0.92}
                    outerStyle={[styles.celebBtnOuter, { backgroundColor: Brand.mint }]}
                    style={styles.celebBtn}>
                    <Text style={styles.celebBtnEmoji}>{saving ? '⏳' : '💾'}</Text>
                    <Text style={styles.celebBtnText} numberOfLines={1}>{saving ? 'Saving…' : 'Save'}</Text>
                  </PressScale>
                  <PressScale
                    accessibilityRole="button"
                    accessibilityLabel="Share artwork"
                    sound="select"
                    onPress={handleShare}
                    scaleTo={0.92}
                    outerStyle={[styles.celebBtnOuter, { backgroundColor: Brand.sky }]}
                    style={styles.celebBtn}>
                    <Text style={styles.celebBtnEmoji}>📤</Text>
                    <Text style={styles.celebBtnText} numberOfLines={1}>Share</Text>
                  </PressScale>
                </View>
                <View style={styles.buttonRow}>
                  <PressScale
                    accessibilityRole="button"
                    accessibilityLabel="Replay"
                    sound="select"
                    onPress={handleReplay}
                    scaleTo={0.92}
                    outerStyle={[styles.celebBtnOuter, { backgroundColor: Brand.yellow }]}
                    style={styles.celebBtn}>
                    <Text style={styles.celebBtnEmoji}>🔄</Text>
                    <Text style={[styles.celebBtnText, { color: Brand.ink }]} numberOfLines={1}>Replay</Text>
                  </PressScale>
                  <PressScale
                    accessibilityRole="button"
                    accessibilityLabel="Next drawing"
                    sound="select"
                    onPress={handleNext}
                    scaleTo={0.92}
                    outerStyle={[styles.celebBtnOuter, { backgroundColor: Brand.primary }]}
                    style={styles.celebBtn}>
                    <Text style={styles.celebBtnEmoji}>➡️</Text>
                    <Text style={styles.celebBtnText} numberOfLines={1}>Next</Text>
                  </PressScale>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
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
  titleEmoji: {
    fontSize: 14,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
    maxWidth: 140,
  },
  resetBtn: {
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
  resetText: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.ink,
  },
  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  canvasCard: {
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: tint(Brand.primary, 0.15),
    borderRadius: 20,
    overflow: 'hidden',
    ...StickerShadow,
  },
  drawingBox: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A6E7C',
    flexShrink: 1,
  },
  progressTextDark: {
    color: '#C9CFF4',
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: '#E7E2F7',
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  toolBtnActive: {
    backgroundColor: Brand.yellow,
    borderColor: '#F0BE4F',
  },
  toolEmoji: {
    fontSize: 20,
  },
  sizesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sizeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: '#E7E2F7',
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  sizeBtnActive: {
    backgroundColor: '#FFF3D6',
    borderColor: '#F0BE4F',
  },
  paletteScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
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
  swatchSelected: {
    borderColor: Brand.ink,
    transform: [{ scale: 1.15 }],
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(22, 27, 61, 0.6)',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    backgroundColor: Brand.card,
    borderRadius: 28,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: tint(Brand.primary, 0.25),
    ...StickerShadow,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  trophyWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF3D6',
    borderWidth: 3,
    borderColor: '#F0BE4F',
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  trophyGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: tint(Brand.yellow, 0.35),
  },
  trophy: {
    fontSize: 46,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Brand.primaryDark,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A6E7C',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  starBig: {
    fontSize: 44,
  },
  rewardCards: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
    justifyContent: 'center',
  },
  rewardCard: {
    flex: 1,
    maxWidth: 140,
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 4,
    ...StickerShadow,
  },
  rewardCardEmoji: {
    fontSize: 28,
  },
  rewardCardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Brand.ink,
  },
  rewardCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A6E7C',
  },
  rewardTotals: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6A6E7C',
  },
  buttonGrid: {
    width: '100%',
    gap: Spacing.two,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  celebBtnOuter: {
    flex: 1,
    minHeight: 55,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    ...StickerShadow,
  },
  celebBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  celebBtnEmoji: {
    fontSize: 20,
  },
  celebBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
