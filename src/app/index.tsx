import { useRouter, Stack } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { PlaygroundBackground } from '@/components/playground-background';
import { PressScale } from '@/components/ui/press-scale';
import { Brand, SCREEN_BG, StickerShadow, tint } from '@/constants/kidsTheme';

/** One floating sticker that gently bobs up and down forever. */
function Floating({
  emoji,
  size,
  duration,
  dark,
  style,
}: {
  emoji: string;
  size: number;
  duration: number;
  dark?: boolean;
  style: StyleProp<ViewStyle>;
}) {
  const bob = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -16,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, duration]);

  return (
    <Animated.View style={[styles.float, style, { transform: [{ translateY: bob }] }]} pointerEvents="none">
      <Text style={[styles.stickerCard, { backgroundColor: dark ? '#252A54' : '#FFFFFF', fontSize: size }]}>
        {emoji}
      </Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const titleDark = dark ? '#C9C6FF' : Brand.primaryDark;
  const soft = dark ? 'rgba(230, 232, 255, 0.75)' : 'rgba(45, 52, 54, 0.6)';

  return (
    <>
      <Stack.Screen options={{ title: 'MagicCrayon' }} />
      <View style={[styles.screen, { backgroundColor: dark ? SCREEN_BG.dark : SCREEN_BG.light }]}>
        <PlaygroundBackground />

        {/* Floating playground stickers (compact screens keep the corners only) */}
        <Floating emoji="🪁" size={compact ? 44 : 54} duration={3000} dark={dark} style={styles.kite} />
        <Floating emoji="⭐" size={40} duration={2400} dark={dark} style={compact ? styles.starCompact : styles.star} />
        {!compact && <Floating emoji="🖍️" size={44} duration={3400} dark={dark} style={styles.crayon} />}
        <Floating
          emoji="🌈"
          size={compact ? 38 : 46}
          duration={2800}
          dark={dark}
          style={compact ? styles.rainbowCompact : styles.rainbow}
        />
        {!compact && <Floating emoji="🦋" size={40} duration={3600} dark={dark} style={styles.butterfly} />}

        <View style={styles.center}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: Brand.card, borderColor: tint(Brand.primary, dark ? 0.4 : 0.2) },
            ]}>
            <Text style={{ fontSize: 52 }}>🎨</Text>
          </View>

          <Text style={[styles.title, { color: titleDark, fontSize: compact ? 36 : 48 }]}>
            <Text style={{ color: Brand.accent }}>Color</Text>
            <Text style={{ color: Brand.mint }}>Joy</Text>
            <Text> Kids</Text>
          </Text>

          <Text style={[styles.tagline, { color: soft }]}>Paint • Play • Learn ✨</Text>

          <PressScale scaleTo={0.88} sound="select" accessibilityRole="button" accessibilityLabel="Play" onPress={() => router.push('/home')}>
              <View
                style={[
                  styles.playButton,
                  { backgroundColor: Brand.primary, borderColor: dark ? '#3A3170' : '#FFFFFF' },
                ]}>
                <Svg width={62} height={72} viewBox="0 0 62 72">
                  <Polygon points="8,6 56,36 8,66" fill="#FFFFFF" />
                </Svg>
              </View>
            </PressScale>

            <Text style={[styles.playHint, { color: titleDark }]}>Tap to play!</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  float: {
    position: 'absolute',
    ...StickerShadow,
  },
  stickerCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    textAlign: 'center' as const,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  kite: {
    top: 90,
    left: 30,
  },
  star: {
    top: 170,
    right: 56,
  },
  starCompact: {
    top: 210,
    right: 26,
  },
  crayon: {
    bottom: 180,
    left: 46,
  },
  rainbow: {
    bottom: 90,
    right: 44,
  },
  rainbowCompact: {
    bottom: 40,
    right: 20,
  },
  butterfly: {
    top: 330,
    left: 86,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...StickerShadow,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -6,
  },
  playButton: {
    width: 148,
    height: 148,
    borderRadius: 999,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    ...StickerShadow,
  },
  playHint: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
});
