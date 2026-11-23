import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaygroundBackground } from '@/components/playground-background';
import { KidButton } from '@/components/ui/kid-button';
import { PressScale } from '@/components/ui/press-scale';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { playSfx } from '@/lib/sfx';
import { Brand, Radius, SCREEN_BG, StickerShadow, tint } from '@/constants/kidsTheme';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const COLORS = [
  { n: 1, hex: '#FF5252', name: 'Red' },
  { n: 2, hex: '#FFD93D', name: 'Yellow' },
  { n: 3, hex: '#26DE81', name: 'Green' },
  { n: 4, hex: '#4A69FB', name: 'Blue' },
];

// 8x8 grid of numbers 1-4
const GRID: number[][] = [
  [1,1,2,2,3,3,4,4],
  [1,2,2,3,3,4,4,1],
  [2,2,3,3,4,4,1,1],
  [2,3,3,4,4,1,1,2],
  [3,3,4,4,1,1,2,2],
  [3,4,4,1,1,2,2,3],
  [4,4,1,1,2,2,3,3],
  [4,1,1,2,2,3,3,4],
];

export default function ColorByNumberScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number>(1);
  const [filled, setFilled] = useState<(string | null)[][]>(() =>
    GRID.map((row) => row.map(() => null)),
  );
  const [done, setDone] = useState(false);

  const total = GRID.flat().length;
  const painted = filled.flat().filter(Boolean).length;

  useEffect(() => {
    if (painted === total && total > 0 && !done) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      playSfx('reward');
    }
  }, [painted, total, done]);

  const tap = (r: number, c: number) => {
    const num = GRID[r][c];
    if (filled[r][c]) return;
    if (num !== selected) {
      playSfx('back');
      return;
    }
    const hex = COLORS.find((x) => x.n === selected)!.hex;
    playSfx('pop');
    setFilled((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = hex;
      return next;
    });
  };

  const reset = () => {
    setFilled(GRID.map((row) => row.map(() => null)));
    setDone(false);
    playSfx('back');
  };

  const cellSize = Math.floor(Math.min(360, 320) / GRID[0].length);

  return (
    <View style={[styles.container, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light, paddingTop: insets.top }]}>
      <PlaygroundBackground />

      <View style={styles.header}>
        <KidButton label="Back" emoji="←" compact sound="back" onPress={() => router.push('/explore')} />
        <View style={styles.titleWrap}>
          <View style={styles.titlePill}>
            <Text style={styles.titleEmoji}>🔢</Text>
            <Text style={styles.titleText}>Color by Number</Text>
          </View>
        </View>
        <SoundToggle />
      </View>

      <View style={styles.paletteRow}>
        {COLORS.map((col) => (
          <PressScale
            key={col.n}
            accessibilityRole="button"
            accessibilityLabel={`Color ${col.n}`}
            sound="select"
            onPress={() => setSelected(col.n)}
            scaleTo={0.9}
            style={[styles.colorBtn, selected === col.n && styles.colorBtnActive, { backgroundColor: col.hex }]}>
            <Text style={styles.colorNum}>{col.n}</Text>
          </PressScale>
        ))}
        <Text style={styles.progress}>{painted}/{total}</Text>
      </View>

      <View style={styles.gridWrap}>
        <View style={styles.grid}>
          {GRID.map((row, r) => (
            <View key={r} style={styles.gridRow}>
              {row.map((num, c) => {
                const fill = filled[r][c];
                const col = COLORS.find((x) => x.n === num)!;
                return (
                  <PressScale
                    key={`${r}-${c}`}
                    accessibilityRole="button"
                    sound={false}
                    onPress={() => tap(r, c)}
                    scaleTo={0.9}
                    style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: fill ?? '#FFFFFF' }]}>
                    {fill ? null : <Text style={[styles.cellNum, { color: col.hex }]}>{num}</Text>}
                  </PressScale>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {done ? (
        <View style={styles.doneBanner}>
          <Text style={styles.doneText}>🎉 Great job! All colored!</Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Reset"
          sound="back"
          onPress={reset}
          scaleTo={0.9}
          style={styles.resetBtn}>
          <Text style={styles.resetText}>↺ Reset</Text>
        </PressScale>
      </View>

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
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  colorBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...StickerShadow,
  },
  colorBtnActive: { borderColor: Brand.ink, transform: [{ scale: 1.1 }] },
  colorNum: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  progress: { marginLeft: 'auto', fontSize: 14, fontWeight: '800', color: Brand.ink },
  gridWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  grid: { gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: {
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E2F7',
  },
  cellNum: { fontSize: 14, fontWeight: '900' },
  doneBanner: {
    marginHorizontal: Spacing.three,
    padding: Spacing.two,
    backgroundColor: '#E6F6FF',
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  doneText: { fontSize: 16, fontWeight: '800', color: Brand.primaryDark },
  footerRow: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  resetBtn: {
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Brand.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E7E2F7',
    ...StickerShadow,
  },
  resetText: { fontSize: 14, fontWeight: '800', color: Brand.ink },
});
