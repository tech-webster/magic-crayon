import { StyleSheet, View } from 'react-native';
import { Circle, Ellipse, G, Path, Svg } from 'react-native-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Dot = { x: number; y: number; r: number; c: string };

const PASTELS = ['#FF6B9D', '#4A69FB', '#26DE81', '#FDCB6E', '#A55EEA', '#2BC0B4'];

const DOTS: Dot[] = [
  { x: 36, y: 260, r: 7, c: PASTELS[0] },
  { x: 70, y: 310, r: 4, c: PASTELS[2] },
  { x: 24, y: 410, r: 5, c: PASTELS[3] },
  { x: 58, y: 520, r: 6, c: PASTELS[4] },
  { x: 30, y: 615, r: 4, c: PASTELS[1] },
  { x: 362, y: 250, r: 5, c: PASTELS[3] },
  { x: 374, y: 340, r: 7, c: PASTELS[2] },
  { x: 346, y: 470, r: 4, c: PASTELS[0] },
  { x: 368, y: 565, r: 6, c: PASTELS[1] },
  { x: 352, y: 645, r: 4, c: PASTELS[5] },
];

function Star({ x, y, s, o = 1 }: { x: number; y: number; s: number; o?: number }) {
  const d = `M ${x} ${y - s} L ${x + s * 0.3} ${y - s * 0.3} L ${x + s} ${y} L ${x + s * 0.3} ${y + s * 0.3} L ${x} ${y + s} L ${x - s * 0.3} ${y + s * 0.3} L ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.3} Z`;
  return <Path d={d} fill="#FFD93D" opacity={0.8 * o} />;
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G fill="#FFFFFF" opacity={0.85}>
      <Ellipse cx={x} cy={y} rx={26 * s} ry={14 * s} />
      <Circle cx={x - 16 * s} cy={y + 2 * s} r={11 * s} />
      <Circle cx={x + 14 * s} cy={y + 3 * s} r={12 * s} />
    </G>
  );
}

/**
 * A playful wall-paper behind every screen: sun, clouds, a rainbow,
 * confetti dots — or a starry night sky with the moon in dark mode.
 * Purely decorative; it never captures touches.
 */
export function PlaygroundBackground() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 400 720"
        preserveAspectRatio="xMidYMid slice">
        {dark ? (
          <G>
            {/* Moon with a crescent carve. */}
            <Circle cx={330} cy={84} r={26} fill="#F5E7A8" opacity={0.95} />
            <Circle cx={342} cy={74} r={22} fill="#161B3D" />
            <Star x={80} y={110} s={9} />
            <Star x={170} y={60} s={6} o={0.7} />
            <Star x={250} y={140} s={7} o={0.8} />
            <Star x={60} y={200} s={5} o={0.6} />
            <Star x={300} y={220} s={5} o={0.55} />
            <Star x={140} y={180} s={4} o={0.5} />
            {DOTS.map((dot, i) => (
              <Circle
                key={`d-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={dot.c}
                opacity={0.35}
              />
            ))}
          </G>
        ) : (
          <G>
            {/* Sun with a soft halo. */}
            <Circle cx={340} cy={78} r={26} fill="#FDCB6E" opacity={0.95} />
            <Circle cx={340} cy={78} r={40} fill="#FDCB6E" opacity={0.25} />
            <Cloud x={90} y={110} />
            <Cloud x={220} y={60} s={0.75} />
            <Cloud x={150} y={640} s={0.7} />
            <Cloud x={320} y={680} s={0.8} />
            {/* Rainbow arc peeking from the bottom-left. */}
            <G fill="none" strokeLinecap="round" opacity={0.5}>
              <Path d="M -10 700 A 110 110 0 0 1 210 700" stroke="#FF6B9D" strokeWidth={14} />
              <Path d="M 12 700 A 88 88 0 0 1 188 700" stroke="#FDCB6E" strokeWidth={14} />
              <Path d="M 34 700 A 66 66 0 0 1 166 700" stroke="#26DE81" strokeWidth={14} />
              <Path d="M 56 700 A 44 44 0 0 1 144 700" stroke="#4A69FB" strokeWidth={14} />
            </G>
            {DOTS.map((dot, i) => (
              <Circle
                key={`d-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={dot.c}
                opacity={0.3}
              />
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
}
