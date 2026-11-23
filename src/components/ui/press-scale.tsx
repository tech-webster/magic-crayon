import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useMemo, type ReactNode } from 'react';

import { playSfx, type SfxName } from '@/lib/sfx';

type PressScaleProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  /** How much the surface shrinks while pressed (1 = no squash). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  /** Layout-only styles for the outer Pressable (flex, maxWidth, margins). */
  outerStyle?: StyleProp<ViewStyle>;
  /** Cute sound on press: an SfxName (default "tap") or false to stay silent. */
  sound?: SfxName | false;
};

/** A pressable that squishes bounce-style, like a toy. */
export function PressScale({
  children,
  style,
  outerStyle,
  scaleTo = 0.96,
  sound = 'tap',
  onPressIn,
  onPressOut,
  ...rest
}: PressScaleProps) {
  const scale = useMemo(() => new Animated.Value(1), []);

  const springTo = (value: number) =>
    Animated.spring(scale, { toValue: value, speed: 30, bounciness: 12, useNativeDriver: true }).start();

  return (
    <Pressable
      {...rest}
      style={outerStyle}
      onPressIn={(e) => {
        springTo(scaleTo);
        if (sound !== false) playSfx(sound);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        springTo(1);
        onPressOut?.(e);
      }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
