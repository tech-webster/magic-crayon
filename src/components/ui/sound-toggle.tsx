import { StyleSheet, Text } from 'react-native';

import { playSfx, useSoundEnabled } from '@/lib/sfx';
import { Brand, Radius, StickerShadow } from '@/constants/kidsTheme';

import { PressScale } from './press-scale';

/** A chunky speaker pill that flips all app sounds on or off. */
export function SoundToggle() {
  const [enabled, setEnabled] = useSoundEnabled();

  const toggle = () => {
    if (enabled) {
      // Announce the switch-off before silencing everything.
      playSfx('toggleOff');
      setEnabled(false);
    } else {
      setEnabled(true);
      playSfx('toggleOn');
    }
  };

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={enabled ? 'Turn sounds off' : 'Turn sounds on'}
      sound={false}
      onPress={toggle}
      scaleTo={0.86}
      style={[
        styles.button,
        { backgroundColor: enabled ? Brand.yellow : Brand.card, borderColor: enabled ? '#F0BE4F' : '#E7E2F7' },
      ]}>
      <Text style={styles.emoji}>{enabled ? '🔊' : '🔇'}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...StickerShadow,
  },
  emoji: {
    fontSize: 22,
  },
});
