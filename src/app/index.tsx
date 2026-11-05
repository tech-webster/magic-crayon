import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AliveArtwork } from '@/components/art/AliveArtwork';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { Brand, CATEGORY_META, Radius } from '@/constants/kidsTheme';
import { useTheme } from '@/hooks/use-theme';
import { PAGES } from '@/data/pages';

const COLUMNS = 2;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const cardSize = (width - Spacing.four * 3 - Spacing.two * (COLUMNS - 1)) / COLUMNS;
  const cardWidth = Math.min(cardSize, 220);

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="title">ColorJoy Kids</ThemedText>
            <SymbolView
              tintColor={Brand.primary}
              name={{ ios: 'paintpalette.fill', android: 'palette', web: 'palette' }}
              size={28}
            />
          </View>
          <ThemedText type="subtitle">Pick a page to color</ThemedText>
          <ThemedText themeColor="textSecondary">
            Every character is alive while you choose. Tap one to start painting it.
          </ThemedText>
        </View>
      }
      data={PAGES}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.column}
      contentInsetAdjustmentBehavior="automatic"
      renderItem={({ item }) => {
        const meta = CATEGORY_META[item.category];
        return (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth, backgroundColor: Brand.card, opacity: pressed ? 0.96 : 1 },
            ]}
            onPress={() => router.push({ pathname: '/coloring', params: { page: item.id } })}>
            <View style={styles.artBox}>
              <AliveArtwork page={item} />
            </View>
            <View style={[styles.footer, { borderTopColor: '#E8E4DA' }]}>
              <ThemedText type="default">{item.title}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.meta}>
                {meta.emoji} {item.category}
              </ThemedText>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  column: {
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E8E4DA',
    overflow: 'hidden',
    shadowColor: '#2D3436',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  artBox: {
    aspectRatio: 1,
    padding: Spacing.two,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: 2,
  },
  meta: {
    fontSize: 12,
  },
});
