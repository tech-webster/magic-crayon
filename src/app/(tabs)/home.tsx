import { useRouter } from 'expo-router';
import { FlatList, Modal, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AliveArtwork } from '@/components/art/AliveArtwork';
import { PlaygroundBackground } from '@/components/playground-background';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { useMusicEnabled } from '@/lib/sfx';
import { hideTabBar, showTabBar } from '@/lib/tabBar';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { Brand, CATEGORY_META, Radius, SCREEN_BG, StickerShadow, tint } from '@/constants/kidsTheme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PAGES } from '@/data/pages';
import { memo, useCallback, useMemo, useState } from 'react';import AsyncStorage from '@react-native-async-storage/async-storage';

type PageCardProps = {
  item: (typeof PAGES)[number];
  dark: boolean;
  onPress: (id: string) => void;
};

const PageCard = memo(function PageCard({ item, dark, onPress }: PageCardProps) {
  const meta = CATEGORY_META[item.category];
  return (
    <PressScale
      outerStyle={styles.cardOuter}
      style={[
        styles.card,
        { borderColor: tint(meta.color, dark ? 0.5 : 0.35) },
      ]}
      onPress={() => onPress(item.id)}>
      <View style={[styles.artBox, { backgroundColor: tint(meta.color, dark ? 0.25 : 0.12) }]}>
        <AliveArtwork page={item} />
      </View>
      <View style={styles.footer}>
        <Text style={dark ? [styles.cardTitle, styles.cardTitleDark] : styles.cardTitle}>
          {item.title}
        </Text>
        <View style={[styles.chip, { backgroundColor: tint(meta.color, dark ? 0.3 : 0.16) }]}>
          <Text style={[styles.chipText, { color: meta.color }]}>
            {meta.emoji} {item.category}
          </Text>
        </View>
      </View>
    </PressScale>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useMusicEnabled();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleOpen = useCallback((id: string) => {
    router.push({ pathname: '/coloring', params: { page: id } });
  }, [router]);

  const columns = width >= 1060 ? 4 : width >= 720 ? 3 : 2;
  const isWide = columns >= 3;
  const topBarOffset = Platform.OS === 'web' && isWide ? (Spacing.six + Spacing.three) : Spacing.five;

  const categories = useMemo(() => ['All', ...Array.from(new Set(PAGES.map((p) => p.category)))], []);
  const filteredPages = useMemo(
    () => (categoryFilter && categoryFilter !== 'All' ? PAGES.filter((p) => p.category === categoryFilter) : PAGES),
    [categoryFilter],
  );

  const handleMoreSettings = () => {
    Alert.alert(
      'More Settings',
      'Choose an option',
      [
        {
          text: 'Reset rewards',
          onPress: async () => {
            await AsyncStorage.removeItem('colorjoy.coins');
            await AsyncStorage.removeItem('colorjoy.stars');
            Alert.alert('Done', 'Rewards have been reset.');
          },
        },
        { text: 'About MagicCrayon', onPress: () => Alert.alert('MagicCrayon', 'Paint • Play • Learn ✨\nVersion 1.0') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light }]}>
      <PlaygroundBackground />
      <FlatList
        key={columns}
        data={filteredPages}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={styles.column}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        onScrollBeginDrag={() => hideTabBar()}
        onScrollEndDrag={() => setTimeout(showTabBar, 500)}
        onMomentumScrollEnd={() => setTimeout(showTabBar, 500)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: topBarOffset },
        ]}
        ListHeaderComponent={
          <View style={[styles.header, isWide && styles.headerWide]}>
            <View style={styles.brandRow}>
              <View style={[styles.logoBadge, { backgroundColor: Brand.primary }]}>
                <SymbolView tintColor="#FFFFFF" name={{ ios: 'paintpalette.fill', android: 'palette', web: 'palette' }} size={20} />
              </View>
              <Text style={[styles.appName, dark && styles.appNameDark]}>MagicCrayon</Text>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                sound="select"
                onPress={() => setSettingsOpen(true)}
                scaleTo={0.86}
                style={styles.settingsBtn}>
                <SymbolView
                  tintColor={dark ? '#C9CFF4' : Brand.ink}
                  name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                  size={20}
                />
              </PressScale>
            </View>
            <ThemedText type="subtitle" style={[styles.subtitle, dark && styles.textLight]}>
              Pick a page to color! 🎨
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {categories.map((cat) => {
                const active = (categoryFilter ?? 'All') === cat;
                return (
                  <PressScale
                    key={cat}
                    sound="select"
                    onPress={() => setCategoryFilter(cat === 'All' ? null : cat)}
                    scaleTo={0.92}
                    style={[styles.filterChip, active && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {cat === 'All' ? 'All' : `${CATEGORY_META[cat as keyof typeof CATEGORY_META]?.emoji ?? ''} ${cat}`}
                    </Text>
                  </PressScale>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <PageCard item={item} dark={dark} onPress={handleOpen} />}
      />
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}>
        <PressScale
          style={styles.modalBackdrop}
          sound={false}
          onPress={() => setSettingsOpen(false)}>
          <View />
        </PressScale>
        <View style={styles.modalCardWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                sound={false}
                onPress={() => setSettingsOpen(false)}
                scaleTo={0.86}
                style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </PressScale>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalRowLabel}>🔊 Sound</Text>
              <SoundToggle />
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalRowLabel}>🎵 Music / BGM</Text>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel={musicEnabled ? 'Turn music off' : 'Turn music on'}
                sound={false}
                onPress={() => setMusicEnabled(!musicEnabled)}
                scaleTo={0.86}
                style={[styles.musicToggle, { backgroundColor: musicEnabled ? Brand.yellow : Brand.card }]}>
                <Text style={styles.musicToggleText}>{musicEnabled ? 'ON' : 'OFF'}</Text>
              </PressScale>
            </View>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel="More settings"
              sound="select"
              onPress={handleMoreSettings}
              scaleTo={0.96}
              style={styles.moreSettingsBtn}>
              <Text style={styles.moreSettingsText}>⚙️ More Settings</Text>
              <Text style={styles.moreSettingsChevron}>›</Text>
            </PressScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.six + 40,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerWide: {
    alignItems: 'stretch',
    paddingBottom: Spacing.three,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  appName: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Brand.primaryDark,
  },
  appNameDark: {
    color: '#C9C6FF',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: 'rgba(45, 52, 54, 0.6)',
  },
  textLight: {
    color: '#C9CFF4',
  },
  column: {
    gap: Spacing.three,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Brand.card,
    borderWidth: 3,
    borderRadius: 28,
    overflow: 'hidden',
    ...StickerShadow,
  },
  cardOuter: {
    flex: 1,
    maxWidth: 340,
  },
  artBox: {
    aspectRatio: 1,
    padding: Spacing.two,
  },
  footer: {
    padding: Spacing.two + 4,
    gap: 6,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.ink,
  },
  cardTitleDark: {
    color: Brand.ink,
  },
  chip: {
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(22, 27, 61, 0.45)',
  },
  modalCardWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Brand.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    ...StickerShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.ink,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1EEFA',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.ink,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  modalRowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.ink,
  },
  musicToggle: {
    minWidth: 64,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: '#F0BE4F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...StickerShadow,
  },
  musicToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
  },
  moreSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#F1EEFA',
    paddingHorizontal: Spacing.three,
    ...StickerShadow,
  },
  moreSettingsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.ink,
  },
  moreSettingsChevron: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.ink,
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Brand.card,
    borderWidth: 2,
    borderColor: '#E7E2F7',
    ...StickerShadow,
  },
  filterChipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primaryDark,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});
