import { StyleSheet, Text, View } from 'react-native';

import { Brand, Kids, Radius, StickerShadow } from '@/constants/kidsTheme';
import type { SfxName } from '@/lib/sfx';

import { PressScale } from './press-scale';

export type KidButtonVariant = 'primary' | 'white' | 'sun';

type KidButtonProps = {
  label: string;
  /** Optional leading emoji (🎨 🔙 ↺ …). */
  emoji?: string;
  /** Omit when wrapped by a router Link (it injects the handler). */
  onPress?: () => void;
  variant?: KidButtonVariant;
  /** Compact pills fit dense headers. */
  compact?: boolean;
  /** Cute sound on press (default "tap"). */
  sound?: SfxName | false;
};

const FACES: Record<KidButtonVariant, { bg: string; color: string; border: string }> = {
  primary: { bg: Brand.primary, color: '#FFFFFF', border: Brand.primaryDark },
  white: { bg: Brand.card, color: Brand.ink, border: '#E7E2F7' },
  sun: { bg: Brand.yellow, color: Brand.ink, border: '#F0BE4F' },
};

/** A chunky, rounded toy-like button with a bounce on press. */
export function KidButton({ label, emoji, onPress, variant = 'white', compact = false, sound }: KidButtonProps) {
  const face = FACES[variant];
  return (
    <PressScale
      onPress={onPress}
      sound={sound}
      accessibilityRole="button"
      style={[
        styles.button,
        compact ? styles.compact : styles.regular,
        { backgroundColor: face.bg, borderColor: face.border },
      ]}>
      <View style={styles.row}>
        {emoji ? <Text style={[styles.emoji, compact && styles.emojiCompact]}>{emoji}</Text> : null}
        <Text style={[styles.label, compact && styles.labelCompact, { color: face.color }]}>{label}</Text>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  regular: {
    minHeight: Kids.minTouch,
    paddingHorizontal: 20,
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 18 },
  emojiCompact: { fontSize: 15 },
  label: {
    fontSize: 16,
    fontWeight: '800',
  },
  labelCompact: {
    fontSize: 14,
  },
});
