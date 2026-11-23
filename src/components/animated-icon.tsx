import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const DURATION = 300;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [animate, setAnimate] = useState(false);
  const fade = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(fade, {
      toValue: 0,
      duration: DURATION,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => animation.stop();
  }, [animate, fade]);

  if (!visible) return null;

  return animate ? (
    <Animated.View pointerEvents="none" style={[styles.splashOverlay, { opacity: fade }]}>
      <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
    </Animated.View>
  ) : (
    <View
      pointerEvents="none"
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 76,
    height: 71,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
