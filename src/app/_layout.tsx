import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router/stack';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useMusicEnabled, useSoundEnabled } from '@/lib/sfx';

SplashScreen.preventAutoHideAsync();

function AudioBootstrap() {
  useSoundEnabled();
  useMusicEnabled();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AudioBootstrap />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="coloring" />
        <Stack.Screen name="free-draw" />
        <Stack.Screen name="color-by-number" />
      </Stack>
    </ThemeProvider>
  );
}