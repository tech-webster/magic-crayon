import { Tabs, TabSlot } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { useRouter, usePathname } from 'expo-router';
import { Animated, Easing, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';

import { Brand } from '@/constants/kidsTheme';
import { registerTabBar } from '@/lib/tabBar';

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const bottomBar = width < 700;
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = pathname?.includes('explore') ? 1 : 0;

  const [tabsWidth, setTabsWidth] = useState(0);
  const [highlightX] = useState(() => new Animated.Value(activeIndex === 1 ? 1 : 0));
  const [gliderX] = useState(() => new Animated.Value(0));
  const [barOpacity] = useState(() => new Animated.Value(1));
  const [barTranslate] = useState(() => new Animated.Value(0));
  const [navVisible, setNavVisible] = useState(true);

  const hideBar = useCallback(() => {
    setNavVisible((v) => {
      if (!v) return v;
      Animated.parallel([
        Animated.timing(barOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(barTranslate, { toValue: 70, duration: 200, useNativeDriver: true }),
      ]).start();
      return false;
    });
  }, [barOpacity, barTranslate]);

  const showBar = useCallback(() => {
    setNavVisible((v) => {
      if (v) return v;
      Animated.parallel([
        Animated.timing(barOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(barTranslate, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
      ]).start();
      return true;
    });
  }, [barOpacity, barTranslate]);

  useEffect(() => {
    registerTabBar(hideBar, showBar);
    return () => registerTabBar(() => {}, () => {});
  }, [hideBar, showBar]);

  useEffect(() => {
    Animated.spring(highlightX, {
      toValue: activeIndex,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, highlightX]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gliderX, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(gliderX, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [gliderX]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastY = 0;
    let lastTouchY = 0;
    let visible = true;
    const THRESHOLD = 8;
    const hide = () => {
      if (!visible) return;
      visible = false;
      setNavVisible(false);
      Animated.parallel([
        Animated.timing(barOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(barTranslate, { toValue: 70, duration: 200, useNativeDriver: true }),
      ]).start();
    };
    const show = () => {
      if (visible) return;
      visible = true;
      setNavVisible(true);
      Animated.parallel([
        Animated.timing(barOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(barTranslate, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
      ]).start();
    };
    const getY = (e: any) => {
      const t = e && e.target;
      if (t && typeof t.scrollTop === 'number') return t.scrollTop;
      if (typeof window !== 'undefined' && typeof window.scrollY === 'number') return window.scrollY;
      return 0;
    };
    const onScroll = (e: any) => {
      const y = getY(e);
      const delta = y - lastY;
      if (Math.abs(delta) < THRESHOLD) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(show, 260);
        return;
      }
      if (delta > 0) hide();
      else show();
      lastY = y;
      if (timer) clearTimeout(timer);
      timer = setTimeout(show, 320);
    };
    const onWheel = (e: any) => {
      if (e && e.deltaY > THRESHOLD) hide();
      else if (e && e.deltaY < -THRESHOLD) show();
      if (timer) clearTimeout(timer);
      timer = setTimeout(show, 320);
    };
    const onTouchStart = (e: any) => {
      lastY = getY(e);
      const t = e && e.touches && e.touches[0];
      if (t) lastTouchY = t.clientY;
    };
    const onTouchMove = (e: any) => {
      const t = e && e.touches && e.touches[0];
      if (t) {
        const delta = lastTouchY - t.clientY;
        if (Math.abs(delta) >= THRESHOLD) {
          if (delta > 0) hide(); else show();
          lastTouchY = t.clientY;
        }
      }
      const y = getY(e);
      const sd = y - lastY;
      if (Math.abs(sd) >= THRESHOLD) {
        if (sd > 0) hide(); else show();
        lastY = y;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(show, 700);
    };
    const onTouchEnd = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(show, 700);
    };
    const targets: (Window | Document)[] = [window, document];
    targets.forEach((t) => t.addEventListener('scroll', onScroll, true));
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      targets.forEach((t) => t.removeEventListener('scroll', onScroll, true));
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (timer) clearTimeout(timer);
    };
  }, [barOpacity, barTranslate]);

  const buttonWidth = tabsWidth > 0 ? (tabsWidth - 12) / 2 : 0;
  const step = buttonWidth + 4;
  const translateX = highlightX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, step],
  });
  const gliderTranslate = gliderX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, step],
  });

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <Animated.View pointerEvents={navVisible ? 'auto' : 'none'} style={[styles.outerWrap, bottomBar && styles.outerWrapBottom, { opacity: barOpacity, transform: [{ translateY: barTranslate }] }]}>
        <View style={[styles.glassPill, bottomBar && styles.glassPillBottom]}>
          {!bottomBar && (
            <ThemedText type="smallBold" style={styles.brandText}>
               MagicCrayon 🎨
            </ThemedText>
          )}

          <View
            style={styles.tabsGroup}
            onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
            {buttonWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.slidingHighlight,
                  { width: buttonWidth, transform: [{ translateX }] },
                ]}
              />
            )}
            {buttonWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.gliderBubble,
                  { width: buttonWidth, transform: [{ translateX: gliderTranslate }] },
                ]}
              />
            )}
            <TabButton
              label="Explore"
              isFocused={activeIndex === 0}
              onPress={() => router.push('/home')}
              isExplore
            />
            <TabButton
              label="Coloring Zone"
              isFocused={activeIndex === 1}
              onPress={() => router.push('/explore')}
              isExplore={false}
            />
          </View>

          {!bottomBar && (
            <ExternalLink href="https://docs.expo.dev" asChild>
              <Pressable style={styles.externalPressable}>
                <ThemedText type="link" style={styles.docsText}>
                  Docs
                </ThemedText>
                <SymbolView
                  tintColor={Brand.primaryDark}
                  name={{ ios: 'arrow.up.right.square', web: 'link' }}
                  size={12}
                />
              </Pressable>
            </ExternalLink>
          )}
        </View>
      </Animated.View>
    </Tabs>
  );
}

export function TabButton({
  label,
  isFocused,
  onPress,
  isExplore,
}: {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  isExplore: boolean;
}) {
  const { width } = useWindowDimensions();
  const mobile = width < 700;
  const iconSize = mobile ? 28 : 24;
  const [iconScale] = useState(() => new Animated.Value(isFocused ? 1.12 : 1));
  const [bounceY] = useState(() => new Animated.Value(isFocused ? -4 : 0));
  const [rotate] = useState(() => new Animated.Value(isFocused ? 1 : 0));
  const [glow] = useState(() => new Animated.Value(isFocused ? 1 : 0));
  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: isFocused ? 1.12 : 1, friction: 5, tension: 110, useNativeDriver: true }),
      Animated.spring(bounceY, { toValue: isFocused ? -4 : 0, friction: 4, tension: 130, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: isFocused ? 1 : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(glow, { toValue: isFocused ? 1 : 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [isFocused, iconScale, bounceY, rotate, glow]);
  const accent = isExplore ? '#9575CD' : '#F48FB1';
  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '14deg'] });
  return (
    <Pressable style={styles.tabPressable} onPress={onPress}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale: iconScale }] }]}>
        <Animated.View style={[styles.tabGlow, { opacity: glow, backgroundColor: isExplore ? '#EDE7F6' : '#FCE4EC' }]} />
        <Animated.View style={{ transform: [{ translateY: bounceY }, { rotate: rotateDeg }] }}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" opacity={isFocused ? 1 : 0.9}>
            {isExplore ? (
              <>
                <Defs>
                  <LinearGradient id="gRoof" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#B388FF" />
                    <Stop offset="1" stopColor="#7E57C2" />
                  </LinearGradient>
                  <LinearGradient id="gBody" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#EDE7F6" />
                    <Stop offset="1" stopColor="#D1C4E9" />
                  </LinearGradient>
                </Defs>
                <Ellipse cx="12" cy="22" rx="8" ry="1.3" fill="#7E57C2" opacity={0.18} />
                <Rect x="4" y="10.5" width="16" height="11" rx="2.2" fill="url(#gBody)" />
                <Path d="M1.5 11.5 L12 2.5 L22.5 11.5 L20.5 11.5 L12 4.2 L3.5 11.5 Z" fill="url(#gRoof)" />
                <Rect x="15.5" y="3.2" width="2.2" height="4.2" rx="0.6" fill="#7E57C2" />
                <Rect x="9.2" y="14.5" width="5.6" height="7" rx="1.6" fill="#9575CD" />
                <Circle cx="13.6" cy="18" r="0.7" fill="#FFD93D" />
                <Rect x="5.2" y="12.5" width="3.4" height="3.4" rx="0.8" fill="#FFFFFF" opacity={0.85} />
                <Rect x="15.4" y="12.5" width="3.4" height="3.4" rx="0.8" fill="#FFFFFF" opacity={0.85} />
                <Circle cx="20.2" cy="4.2" r="1" fill="#FFD93D" />
                <Circle cx="3.2" cy="5.2" r="0.8" fill="#FFFFFF" opacity={0.9} />
              </>
            ) : (
              <>
                <Defs>
                  <LinearGradient id="gPalette" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FCE4EC" />
                    <Stop offset="1" stopColor="#F48FB1" />
                  </LinearGradient>
                  <LinearGradient id="gBrush" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#B388FF" />
                    <Stop offset="1" stopColor="#7E57C2" />
                  </LinearGradient>
                </Defs>
                <Ellipse cx="12" cy="22" rx="9" ry="1.3" fill="#F48FB1" opacity={0.22} />
                <Path
                  d="M12 2 C6 2 2 6 2 11 C2 14.2 4 16.2 7.2 16.2 C8.7 16.2 9.2 17.8 9.2 19.4 C9.2 21.2 10.6 22 12.2 22 C17.6 22 22 17.6 22 12 C22 6.4 17.6 2 12 2 Z"
                  fill="url(#gPalette)"
                  stroke="#EC407A"
                  strokeWidth="0.4"
                />
                <Path d="M5 5.5 Q12 2.5 19 5.5" stroke="#FFFFFF" strokeWidth="1.1" fill="none" opacity={0.6} strokeLinecap="round" />
                <Circle cx="7" cy="9" r="1.9" fill="#FF6B9D" />
                <Circle cx="6.3" cy="8.3" r="0.6" fill="#FFFFFF" opacity={0.65} />
                <Circle cx="11.2" cy="6.6" r="1.9" fill="#4A69FB" />
                <Circle cx="10.5" cy="5.9" r="0.6" fill="#FFFFFF" opacity={0.65} />
                <Circle cx="16.2" cy="7.2" r="1.9" fill="#26DE81" />
                <Circle cx="15.5" cy="6.5" r="0.6" fill="#FFFFFF" opacity={0.65} />
                <Circle cx="18.4" cy="11.8" r="1.9" fill="#FDCB6E" />
                <Circle cx="15" cy="16.2" r="1.9" fill="#2BC0B4" />
                <Path d="M20.2 2.2 L22.2 4.2 L16.4 10 L14.4 8 Z" fill="url(#gBrush)" />
                <Path d="M14.4 8 L16.4 10 L15.4 11.2 L13.4 9.2 Z" fill="#9575CD" />
                <Path d="M13.4 9.2 L15.4 11.2 L13 13.6 L11 11.6 Z" fill="#B388FF" opacity={0.85} />
              </>
            )}
          </Svg>
        </Animated.View>
        {label ? (
          <ThemedText type="smallBold" style={[styles.tabText, isFocused && { color: accent }]}>
            {label}
          </ThemedText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    width: '100%',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 999,
    elevation: 10,
  },
  outerWrapBottom: {
    top: undefined,
    bottom: 12,
  },
  glassPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: 10,
    maxWidth: 640,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glassPillBottom: {
    maxWidth: 300,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    flexGrow: 0,
    alignSelf: 'center',
    gap: 6,
  },
  brandText: {
    marginRight: 6,
    color: Brand.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  tabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    position: 'relative',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 4,
    gap: 4,
  },
  slidingHighlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(108,92,231,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.25)',
  },
  gliderBubble: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    minWidth: 64,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    top: -5,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3D3450',
  },
  docsText: {
    color: Brand.primaryDark,
    fontWeight: '700',
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
});