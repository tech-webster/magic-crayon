import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  type TransformsStyle,
} from 'react-native';
import { Circle, Ellipse, G, Path, Rect, Svg } from 'react-native-svg';

import {
  bell,
  degreesInterpolation,
  loop,
  track,
  trackInterpolation,
  useLoopClock,
  wave,
  type Keys,
} from '@/components/motion/motion';
import type { ColoringPage, ColoringState, Region } from '@/types/coloring';

const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const APath = Animated.createAnimatedComponent(Path);
const ARect = Animated.createAnimatedComponent(Rect);
const AGroup = Animated.createAnimatedComponent(G);

const UNFILLED = '#FFFFFF';

/** Whether the clocks should run; the Plasma-motion-frozen fallback evaluates frame 0. */
const LiveContext = createContext(false);

/** One entry of an RN-transform array; values may be driven by the clock. */
type AnimatedTransform = NonNullable<TransformsStyle['transform']>;

type GroupMotion = {
  drift?: readonly [amp: number, period: number, phase?: number];
  dy?: readonly [amp: number, period: number, phase?: number];
  grow?: readonly [amp: number, period: number, phase?: number, pivotX?: number, pivotY?: number];
  scale?: readonly [amp: number, period: number, phase?: number, pivotX?: number, pivotY?: number];
  pulse?: readonly [depth: number, keys: Keys, pivotX: number, pivotY: number];
  spin?: readonly [msPerTurn: number, pivotX: number, pivotY: number];
  rot?: readonly [deg: number, period: number, phase?: number, pivotX?: number, pivotY?: number];
};

const ICE_KEYS: Keys = [
  [0, 0],
  [340, 0],
  [520, 1, 'out'],
  [660, 0.45],
  [780, 0.95, 'out'],
  [940, 0],
  [3200, 0],
];

/**
 * Every curve is a pure function of the clock time. When live, each moving value
 * is precomputed over the loop period and replayed through a clock interpolation,
 * so the animation runs through React Native's Animated without re-rendering.
 * When frozen, values are single numbers evaluated at frame 0.
 */
type MotionBinder = {
  num: (sample: (t: number) => number) => number | Animated.AnimatedNode;
  deg: (sample: (t: number) => number) => string | Animated.AnimatedNode;
};

function makeMotionBinder(clock: Animated.Value, period: number, live: boolean): MotionBinder {
  if (!live) {
    return {
      num: (sample) => sample(0),
      deg: (sample) => `${sample(0).toFixed(2)}deg`,
    };
  }
  return {
    num: (sample) => trackInterpolation(clock, period, sample),
    deg: (sample) => degreesInterpolation(clock, period, sample),
  };
}

function motionTransforms(bind: MotionBinder, motion: GroupMotion): AnimatedTransform {
  const items: Record<string, unknown>[] = [];
  if (motion.drift) {
    const [amp, p, phase] = motion.drift;
    items.push({
      translateX: bind.num((t) => amp * wave(t, p, phase ?? 0)),
    });
  }
  if (motion.dy) {
    const [amp, p, phase] = motion.dy;
    items.push({
      translateY: bind.num((t) => amp * wave(t, p, phase ?? 0)),
    });
  }
  if (motion.grow) {
    const [amp, p, phase, px = 0, py = 0] = motion.grow;
    items.push(
      { translateX: px },
      { translateY: py },
      { scale: bind.num((t) => 1 + amp * wave(t, p, phase ?? 0)) },
      { translateX: -px },
      { translateY: -py },
    );
  }
  if (motion.scale) {
    const [amp, p, phase, px = 0, py = 0] = motion.scale;
    items.push(
      { translateX: px },
      { translateY: py },
      {
        scaleX: bind.num((t) => 1 + amp * 0.4 * wave(t, p, phase ?? 0)),
      },
      { scaleY: bind.num((t) => 1 - amp * wave(t, p, phase ?? 0)) },
      { translateX: -px },
      { translateY: -py },
    );
  }
  if (motion.pulse) {
    const [depth, keys, px, py] = motion.pulse;
    items.push(
      { translateX: px },
      { translateY: py },
      { scaleX: bind.num((t) => 1 + depth * 0.4 * track(t, keys)) },
      { scaleY: bind.num((t) => 1 - depth * track(t, keys)) },
      { translateX: -px },
      { translateY: -py },
    );
  }
  if (motion.spin) {
    const [msPerTurn, px = 0, py = 0] = motion.spin;
    items.push(
      { translateX: px },
      { translateY: py },
      {
        rotate: bind.deg((t) => ((t % msPerTurn) / msPerTurn) * 360),
      },
      { translateX: -px },
      { translateY: -py },
    );
  }
  if (motion.rot) {
    const [deg, p, phase, px = 0, py = 0] = motion.rot;
    items.push(
      { translateX: px },
      { translateY: py },
      { rotate: bind.deg((t) => deg * wave(t, p, phase ?? 0)) },
      { translateX: -px },
      { translateY: -py },
    );
  }
  return items as unknown as AnimatedTransform;
}

type Kit = {
  page: ColoringPage;
  fills: ColoringState;
  stroke: string;
  strokeWidth: number;
};

type RegionMemoProps = { kit: Kit; id: string };

function RegionMemo({ kit, id }: RegionMemoProps) {
  const region = kit.page.regions.find((candidate) => candidate.id === id);
  if (!region) return null;
  const common = {
    fill: kit.fills[region.id] ?? UNFILLED,
    stroke: kit.stroke,
    strokeWidth: kit.strokeWidth,
  };
  switch (region.shape) {
    case 'circle':
      return (
        <ACircle cx={region.cx} cy={region.cy} r={region.r} {...common} />
      );
    case 'ellipse':
      return (
        <AEllipse
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          {...common}
        />
      );
    case 'rect':
      return (
        <ARect
          x={region.x}
          y={region.y}
          width={region.width}
          height={region.height}
          rx={region.rx}
          {...common}
        />
      );
    default:
      return <APath d={region.d} strokeLinejoin="round" {...common} />;
  }
}

type OutlinePartProps = { kit: Kit; index: number };

function OutlinePart({ kit, index }: OutlinePartProps) {
  const outline = kit.page.outlines?.[index];
  if (!outline) return null;
  return (
    <Path
      d={outline.d}
      fill="none"
      stroke={kit.stroke}
      strokeWidth={outline.width ?? kit.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    />
  );
}

type MotionGroupProps = {
  clock: Animated.Value;
  period: number;
  motion: GroupMotion;
  children: ReactNode;
};

type MotionCircleCalc = (t: number) => { cx?: number; cy?: number; r?: number; opacity?: number };

type MotionRegionProps = {
  clock: Animated.Value;
  period: number;
  calc: MotionCircleCalc;
  region: Extract<Region, { shape: 'circle' }>;
  kit: Kit;
};

function MotionGroup({ clock, period, motion, children }: MotionGroupProps) {
  const live = useContext(LiveContext);
  const transform = motionTransforms(makeMotionBinder(clock, period, live), motion);
  return <AGroup transform={transform as unknown as React.ComponentProps<typeof G>['transform']}>{children}</AGroup>;
}

function MotionRegion({ clock, period, calc, region, kit }: MotionRegionProps) {
  const live = useContext(LiveContext);
  const values = makeMotionBinder(clock, period, live);
  return (
    <ACircle
      cx={values.num((t) => calc(t).cx ?? region.cx)}
      cy={values.num((t) => calc(t).cy ?? region.cy)}
      r={values.num((t) => calc(t).r ?? region.r)}
      opacity={values.num((t) => calc(t).opacity ?? 1)}
      fill={kit.fills[region.id] ?? UNFILLED}
      stroke={kit.stroke}
      strokeWidth={kit.strokeWidth}
    />
  );
}

type PageAliveProps = { kit: Kit; clock: Animated.Value; period: number; live: boolean };

function ButterflyAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} period={period} motion={{ dy: [2.5, 4200], rot: [1.5, 4200, 0.25, 100, 104] }}>
      <MotionGroup clock={clock} period={period} motion={{ rot: [9, 1050, 0, 96, 72] }}>
        <RegionMemo kit={kit} id="wingUL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [-9, 1050, 0, 104, 72] }}>
        <RegionMemo kit={kit} id="wingUR" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [7, 1050, 0.05, 96, 132] }}>
        <RegionMemo kit={kit} id="wingLL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [-7, 1050, 0.05, 104, 132] }}>
        <RegionMemo kit={kit} id="wingLR" />
      </MotionGroup>
      <RegionMemo kit={kit} id="body" />
      <RegionMemo kit={kit} id="head" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
    </MotionGroup>
  );
}

const bubbleCalc = (i: 0 | 1): MotionCircleCalc => {
  const cx0 = i === 0 ? 150 : 166;
  const cy0 = i === 0 ? 46 : 30;
  const r0 = i === 0 ? 7 : 5;
  const phaseX = i === 0 ? 0 : 0.4;
  const phaseY = i === 0 ? 0 : 0.2;
  return (t) => ({
    cx: cx0 + 2.5 * wave(t, 2500, phaseX),
    cy: cy0 - 3 * wave(t, 2000, phaseY),
    r: r0 + 0.5 * wave(t, 2000, phaseY - 0.5),
  });
};

function FishAlive({ kit, clock, period }: PageAliveProps) {
  const bubble1 = kit.page.regions.find((region) => region.id === 'bubble1');
  const bubble2 = kit.page.regions.find((region) => region.id === 'bubble2');
  return (
    <>
      <MotionGroup clock={clock} period={period} motion={{ dy: [2, 5000], rot: [1, 5000, 0.14, 88, 100] }}>
        <RegionMemo kit={kit} id="body" />
        <MotionGroup clock={clock} period={period} motion={{ rot: [4, 1250, 0.2, 93, 68] }}>
          <RegionMemo kit={kit} id="topFin" />
        </MotionGroup>
        <MotionGroup clock={clock} period={period} motion={{ rot: [-4, 1250, 0.28, 93, 132] }}>
          <RegionMemo kit={kit} id="bottomFin" />
        </MotionGroup>
        <RegionMemo kit={kit} id="eye" />
        <OutlinePart kit={kit} index={0} />
        <OutlinePart kit={kit} index={1} />
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ dy: [2, 5000], rot: [9, 1000, 0, 133, 100] }}>
        <RegionMemo kit={kit} id="tail" />
      </MotionGroup>
      {bubble1?.shape === 'circle' ? (
        <MotionRegion clock={clock} period={period} calc={bubbleCalc(0)} region={bubble1} kit={kit} />
      ) : null}
      {bubble2?.shape === 'circle' ? (
        <MotionRegion clock={clock} period={period} calc={bubbleCalc(1)} region={bubble2} kit={kit} />
      ) : null}
    </>
  );
}

function TurtleAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} period={period} motion={{ dy: [1.5, 5000], rot: [0.8, 4000, 0.3, 100, 100] }}>
      <RegionMemo kit={kit} id="shell" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
      <MotionGroup clock={clock} period={period} motion={{ rot: [3, 2000, 0, 86, 132] }}>
        <RegionMemo kit={kit} id="legFL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [-3, 2000, 0.5, 114, 132] }}>
        <RegionMemo kit={kit} id="legFR" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [3, 2000, 0.3, 86, 68] }}>
        <RegionMemo kit={kit} id="legBL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [-3, 2000, 0.8, 114, 68] }}>
        <RegionMemo kit={kit} id="legBR" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [7, 2500, 0.3, 50, 116] }}>
        <RegionMemo kit={kit} id="tail" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [3, 4000, 0.15, 143, 96] }}>
        <RegionMemo kit={kit} id="head" />
        <RegionMemo kit={kit} id="eye" />
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
    </MotionGroup>
  );
}

function RocketAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} period={period} motion={{ dy: [3, 5000], rot: [1.2, 5000, 0.2, 100, 120] }}>
      <RegionMemo kit={kit} id="nose" />
      <RegionMemo kit={kit} id="body" />
      <MotionGroup clock={clock} period={period} motion={{ rot: [1.5, 5000, 0.06, 74, 120] }}>
        <RegionMemo kit={kit} id="finL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [1.5, 5000, 0.1, 126, 120] }}>
        <RegionMemo kit={kit} id="finR" />
      </MotionGroup>
      <RegionMemo kit={kit} id="window" />
      <MotionGroup clock={clock} period={period} motion={{ scale: [-0.06, 1000, 0, 100, 152] }}>
        <RegionMemo kit={kit} id="flame" />
      </MotionGroup>
      <OutlinePart kit={kit} index={0} />
    </MotionGroup>
  );
}

const FLOWER_PETALS = ['petalTop', 'petalUR', 'petalLR', 'petalBottom', 'petalLL', 'petalUL'];

function FlowerAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} period={period} motion={{ rot: [2.5, 5000, 0, 100, 182] }}>
      <RegionMemo kit={kit} id="stem" />
      <MotionGroup clock={clock} period={period} motion={{ rot: [1.5, 5000, 0.12, 92, 156] }}>
        <RegionMemo kit={kit} id="leafL" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [-1.5, 5000, 0.16, 104, 146] }}>
        <RegionMemo kit={kit} id="leafR" />
      </MotionGroup>
      <MotionGroup clock={clock} period={period} motion={{ rot: [1.2, 5000, 0.07, 100, 120] }}>
        {FLOWER_PETALS.map((id) => (
          <RegionMemo key={id} kit={kit} id={id} />
        ))}
        <RegionMemo kit={kit} id="center" />
        <OutlinePart kit={kit} index={0} />
      </MotionGroup>
    </MotionGroup>
  );
}

const PUFF: Extract<Region, { shape: 'circle' }> = {
  shape: 'circle',
  id: 'puff',
  cx: 135,
  cy: 46,
  r: 4,
};

const PUFF_PHASES = [0, 0.28, 0.55];
const PUFF_RADII = [4, 5.5, 4.5];
const PUFF_DRIFT = [3, -2, 5];

const puffCalc = (i: number): MotionCircleCalc => {
  const phase = PUFF_PHASES[i];
  const r0 = PUFF_RADII[i];
  const drift = PUFF_DRIFT[i];
  return (t) => {
    const p = loop(t, 5500, phase);
    return {
      cy: 46 - 30 * p,
      r: r0 + 3 * p,
      cx: 135 + drift * p + 2 * wave(t, 2750, phase + 0.2),
      opacity: 0.85 * bell(p),
    };
  };
};

function HouseAlive({ kit, clock, period, live }: PageAliveProps) {
  return (
    <>
      <MotionGroup clock={clock} period={period} motion={{ grow: [0.02, 3300, 0, 166, 40] }}>
        <RegionMemo kit={kit} id="sun" />
      </MotionGroup>
      <RegionMemo kit={kit} id="chimney" />
      <RegionMemo kit={kit} id="roof" />
      <RegionMemo kit={kit} id="base" />
      <RegionMemo kit={kit} id="windowL" />
      <RegionMemo kit={kit} id="windowR" />
      <RegionMemo kit={kit} id="door" />
      <RegionMemo kit={kit} id="knob" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
      <MotionGroup clock={clock} period={period} motion={{ spin: [16500, 166, 40] }}>
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
      {live
        ? [0, 1, 2].map((i) => (
            <MotionRegion key={i} clock={clock} period={period} calc={puffCalc(i)} region={PUFF} kit={kit} />
          ))
        : null}
    </>
  );
}

function IceCreamAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup
      clock={clock}
      period={period}
      motion={{ rot: [2, 3200, 0, 100, 178], pulse: [0.03, ICE_KEYS, 100, 178] }}
    >
      <RegionMemo kit={kit} id="cone" />
      <RegionMemo kit={kit} id="scoopBottom" />
      <RegionMemo kit={kit} id="scoopTop" />
      <RegionMemo kit={kit} id="cherry" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
    </MotionGroup>
  );
}

function StarAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup
      clock={clock}
      period={period}
      motion={{ rot: [3, 6000, 0, 100, 98], grow: [0.02, 7000, 0, 100, 98] }}
    >
      <RegionMemo kit={kit} id="star" />
      <RegionMemo kit={kit} id="eyeL" />
      <RegionMemo kit={kit} id="eyeR" />
      <RegionMemo kit={kit} id="cheekL" />
      <RegionMemo kit={kit} id="cheekR" />
      <OutlinePart kit={kit} index={0} />
    </MotionGroup>
  );
}

function GenericAlive({ kit, clock, period }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} period={period} motion={{ dy: [1.6, 3200, 0.1], rot: [1.2, 4000, 0.2, 100, 100] }}>
      {kit.page.regions.map((region) => (
        <RegionMemo key={region.id} kit={kit} id={region.id} />
      ))}
      {kit.page.outlines?.map((_, i) => (
        <OutlinePart key={`o-${i}`} kit={kit} index={i} />
      ))}
    </MotionGroup>
  );
}
const PAGE_PERIODS: Record<string, number> = {
  butterfly: 4200,
  fish: 10000,
  turtle: 20000,
  rocket: 10000,
  flower: 5000,
  house: 16500,
  icecream: 3200,
  star: 42000,
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (isCurrent) setReduced(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (isCurrent) setReduced(value);
    });
    return () => {
      isCurrent = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export type AliveArtworkProps = {
  page: ColoringPage;
  fills?: ColoringState;
  /** Set false to freeze every clock at frame 0 (the plain drawing). */
  live?: boolean;
};

export function AliveArtwork({ page, fills = {}, live = true }: AliveArtworkProps) {
  const reduced = useReducedMotion();
  // Animations need RN's setNativeProps driver; react-native-svg on web re-parses
  // transform strings during server rendering, so web shows the static drawing.
  const isLive = live && !reduced && Platform.OS !== 'web';
  const kit: Kit = {
    page,
    fills,
    stroke: page.stroke ?? '#2D3436',
    strokeWidth: page.strokeWidth ?? 3,
  };
  const period = PAGE_PERIODS[page.id] ?? 6000;
  const clock = useLoopClock(period, isLive);

  return (
    <Svg viewBox={page.viewBox} style={{ width: '100%', height: '100%' }}>
      <LiveContext value={isLive}>
        {page.id === 'butterfly' ? <ButterflyAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'fish' ? <FishAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'turtle' ? <TurtleAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'rocket' ? <RocketAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'flower' ? <FlowerAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'house' ? <HouseAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'icecream' ? <IceCreamAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {page.id === 'star' ? <StarAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
        {!['butterfly','fish','turtle','rocket','flower','house','icecream','star'].includes(page.id) ? <GenericAlive kit={kit} clock={clock} period={period} live={isLive} /> : null}
      </LiveContext>
    </Svg>
  );
}
