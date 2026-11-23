import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaygroundBackground } from '@/components/playground-background';
import { PressScale } from '@/components/ui/press-scale';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { playSfx } from '@/lib/sfx';
import { hideTabBar, showTabBar } from '@/lib/tabBar';
import { Brand, SCREEN_BG, StickerShadow, tint } from '@/constants/kidsTheme';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ZoneItem = {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  onPress: () => void;
};

export default function ColoringZoneScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const items: ZoneItem[] = [
    {
      key: 'new',
      title: 'New Coloring Pages',
      subtitle: 'Fresh pages to color',
      emoji: '🆕',
      color: Brand.primary,
      onPress: () => { playSfx('select'); router.push('/'); },
    },
    {
      key: 'mandala',
      title: 'Mandala Coloring',
      subtitle: 'Relaxing patterns',
      emoji: '🌸',
      color: Brand.accent,
      onPress: () => { playSfx('select'); router.push({ pathname: '/coloring', params: { page: 'mandala1' } }); },
    },
    {
      key: 'free',
      title: 'Free Drawing',
      subtitle: 'Draw anything!',
      emoji: '🖍️',
      color: Brand.mint,
      onPress: () => { playSfx('select'); router.push('/free-draw'); },
    },
    {
      key: 'cbn',
      title: 'Color by Number',
      subtitle: 'Match the numbers',
      emoji: '🔢',
      color: Brand.sky,
      onPress: () => { playSfx('select'); router.push('/color-by-number'); },
    },
    {
      key: 'seasonal',
      title: 'Seasonal Coloring',
      subtitle: 'Holiday fun',
      emoji: '🍂',
      color: Brand.yellow,
      onPress: () => { playSfx('select'); router.push({ pathname: '/coloring', params: { page: 'pumpkin' } }); },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light, paddingTop: insets.top }]}>
      <PlaygroundBackground />

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, dark && styles.titleDark]}>Coloring Zone 🎨</Text>
          <Text style={[styles.subtitle, dark && styles.subtitleDark]}>Pick an activity to play!</Text>
        </View>
        <SoundToggle />
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => hideTabBar()} onScrollEndDrag={() => setTimeout(showTabBar, 500)} onMomentumScrollEnd={() => setTimeout(showTabBar, 500)}>
        {items.map((item) => (
          <PressScale
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            sound={false}
            onPress={item.onPress}
            scaleTo={0.94}
            style={[styles.card, { borderColor: tint(item.color, 0.35) }]}>
            <View style={[styles.iconBadge, { backgroundColor: tint(item.color, 0.18) }]}>
              <Text style={styles.iconEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={[styles.chevron, { color: item.color }]}>›</Text>
          </PressScale>
        ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900', color: Brand.primaryDark },
  titleDark: { color: '#C9C6FF' },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#6A6E7C', marginTop: 2 },
  subtitleDark: { color: '#C9CFF4' },
  grid: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderRadius: 20,
    padding: Spacing.three,
    ...StickerShadow,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Brand.ink },
  cardSubtitle: { fontSize: 13, fontWeight: '600', color: '#6A6E7C', marginTop: 2 },
  chevron: { fontSize: 28, fontWeight: '800' },
});