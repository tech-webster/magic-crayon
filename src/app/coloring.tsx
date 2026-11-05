import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ColoringCanvas } from '@/components/ColoringCanvas';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Brand, PALETTE, Radius } from '@/constants/kidsTheme';
import { PAGES, getPageById } from '@/data/pages';
import type { ColoringState } from '@/types/coloring';

export default function ColoringScreen() {
  const params = useLocalSearchParams<{ page?: string }>();
  const page = getPageById(params.page) ?? PAGES[0];
  const [color, setColor] = useState<string>(PALETTE[3].hex);
  const [fills, setFills] = useState<ColoringState>({});

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable style={styles.back}>
            <ThemedText type="link">← Back</ThemedText>
          </Pressable>
        </Link>
        <ThemedText type="subtitle">{page.title}</ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.canvasCard}>
        <ColoringCanvas
          page={page}
          fills={fills}
          onPaint={(regionId) => setFills((prev) => ({ ...prev, [regionId]: color }))}
        />
      </ThemedView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
        {PALETTE.map((swatch) => (
          <Pressable
            key={swatch.hex}
            accessibilityLabel={swatch.name}
            onPress={() => setColor(swatch.hex)}
            style={[
              styles.swatch,
              { backgroundColor: swatch.hex },
              color === swatch.hex && styles.swatchSelected,
            ]}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  back: { minWidth: 52 },
  canvasCard: {
    flex: 1,
    margin: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.two,
    backgroundColor: Brand.card,
  },
  palette: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: Brand.ink,
    transform: [{ scale: 1.08 }],
  },
});
