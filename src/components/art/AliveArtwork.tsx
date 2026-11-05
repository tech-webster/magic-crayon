import { type ReactNode } from 'react';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import { Circle, Ellipse, G, Path, Rect, Svg } from 'react-native-svg';

import { bell, loop, track, useLoopClock, wave, type Keys } from '@/components/motion/motion';
import type { ColoringPage, ColoringState, Region } from '@/types/coloring';

const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const APath = Animated.createAnimatedComponent(Path);
const ARect = Animated.createAnimatedComponent(Rect);
const AGroup = Animated.createAnimatedComponent(G);

const UNFILLED = '#FFFFFF';

type AnimatedSvgProps = {
  transform?: string;
  opacity?: number;
  cx?: number;
  cy?: number;
  r?: number;
};

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

function buildTransform(t: number, motion: GroupMotion): string {
  'worklet';
  const parts: string[] = [];
  if (motion.drift) {
    const [amp, period, phase] = motion.drift;
    parts.push(`translate(${(amp * wave(t, period, phase ?? 0)).toFixed(2)} 0)`);
  }
  if (motion.dy) {
    const [amp, period, phase] = motion.dy;
    parts.push(`translate(0 ${(amp * wave(t, period, phase ?? 0)).toFixed(2)})`);
  }
  if (motion.grow) {
    const [amp, period, phase, px = 0, py = 0] = motion.grow;
    const s = 1 + amp * wave(t, period, phase ?? 0);
    parts.push(`translate(${px} ${py}) scale(${s.toFixed(4)}) translate(${-px} ${-py})`);
  }
  if (motion.scale) {
    const [amp, period, phase, px = 0, py = 0] = motion.scale;
    const v = wave(t, period, phase ?? 0);
    const sx = 1 + amp * 0.4 * v;
    const sy = 1 - amp * v;
    parts.push(`translate(${px} ${py}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-px} ${-py})`);
  }
  if (motion.pulse) {
    const [depth, keys, px, py] = motion.pulse;
    const v = track(t, keys);
    const sx = 1 + depth * 0.4 * v;
    const sy = 1 - depth * v;
    parts.push(`translate(${px} ${py}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-px} ${-py})`);
  }
  if (motion.spin) {
    const [msPerTurn, px = 0, py = 0] = motion.spin;
    parts.push(`rotate(${(((t % msPerTurn) / msPerTurn) * 360).toFixed(2)} ${px} ${py})`);
  }
  if (motion.rot) {
    const [deg, period, phase, px = 0, py = 0] = motion.rot;
    parts.push(`rotate(${(deg * wave(t, period, phase ?? 0)).toFixed(2)} ${px} ${py})`);
  }
  return parts.join(' ');
}

type Kit = {
  page: ColoringPage;
  fills: ColoringState;
  stroke: string;
  strokeWidth: number;
};

type RegionMemoProps = { kit: Kit; id: string; animatedProps?: AnimatedSvgProps };

function RegionMemo({ kit, id, animatedProps }: RegionMemoProps) {
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
        <ACircle cx={region.cx} cy={region.cy} r={region.r} {...common} animatedProps={animatedProps} />
      );
    case 'ellipse':
      return (
        <AEllipse
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          {...common}
          animatedProps={animatedProps}
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
          animatedProps={animatedProps}
        />
      );
    default:
      return <APath d={region.d} strokeLinejoin="round" {...common} animatedProps={animatedProps} />;
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

type MotionGroupProps = { clock: SharedValue<number>; motion: GroupMotion; children: ReactNode };

function MotionGroup({ clock, motion, children }: MotionGroupProps) {
  const animatedProps = useAnimatedProps(() => {
    return { transform: buildTransform(clock.value, motion) };
  }, [clock, motion]);
  return <AGroup animatedProps={animatedProps}>{children}</AGroup>;
}

type MotionCircleCalc = (t: number) => { cx?: number; cy?: number; r?: number; opacity?: number };

type MotionRegionProps = {
  clock: SharedValue<number>;
  calc: MotionCircleCalc;
  region: Extract<Region, { shape: 'circle' }>;
  kit: Kit;
};

function MotionRegion({ clock, calc, region, kit }: MotionRegionProps) {
  const animatedProps = useAnimatedProps(() => {
    return calc(clock.value);
  }, [clock, calc]);
  return (
    <ACircle
      cx={region.cx}
      cy={region.cy}
      r={region.r}
      fill={kit.fills[region.id] ?? UNFILLED}
      stroke={kit.stroke}
      strokeWidth={kit.strokeWidth}
      animatedProps={animatedProps}
    />
  );
}

type PageAliveProps = { kit: Kit; clock: SharedValue<number>; live: boolean };

function ButterflyAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} motion={{ dy: [2.5, 4200], rot: [1.5, 4200, 0.25, 100, 104] }}>
      <MotionGroup clock={clock} motion={{ rot: [9, 1050, 0, 96, 72] }}>
        <RegionMemo kit={kit} id="wingUL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [-9, 1050, 0, 104, 72] }}>
        <RegionMemo kit={kit} id="wingUR" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [7, 1050, 0.05, 96, 132] }}>
        <RegionMemo kit={kit} id="wingLL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [-7, 1050, 0.05, 104, 132] }}>
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
  return (t) => {
    'worklet';
    return {
      cx: cx0 + 2.5 * wave(t, 2500, phaseX),
      cy: cy0 - 3 * wave(t, 2000, phaseY),
      r: r0 + 0.5 * wave(t, 2000, phaseY - 0.5),
    };
  };
};

function FishAlive({ kit, clock }: PageAliveProps) {
  const bubble1 = kit.page.regions.find((region) => region.id === 'bubble1');
  const bubble2 = kit.page.regions.find((region) => region.id === 'bubble2');
  return (
    <>
      <MotionGroup clock={clock} motion={{ dy: [2, 5000], rot: [1, 5000, 0.14, 88, 100] }}>
        <RegionMemo kit={kit} id="body" />
        <MotionGroup clock={clock} motion={{ rot: [4, 1250, 0.2, 93, 68] }}>
          <RegionMemo kit={kit} id="topFin" />
        </MotionGroup>
        <MotionGroup clock={clock} motion={{ rot: [-4, 1250, 0.28, 93, 132] }}>
          <RegionMemo kit={kit} id="bottomFin" />
        </MotionGroup>
        <RegionMemo kit={kit} id="eye" />
        <OutlinePart kit={kit} index={0} />
        <OutlinePart kit={kit} index={1} />
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ dy: [2, 5000], rot: [9, 1000, 0, 133, 100] }}>
        <RegionMemo kit={kit} id="tail" />
      </MotionGroup>
      {bubble1?.shape === 'circle' ? (
        <MotionRegion clock={clock} calc={bubbleCalc(0)} region={bubble1} kit={kit} />
      ) : null}
      {bubble2?.shape === 'circle' ? (
        <MotionRegion clock={clock} calc={bubbleCalc(1)} region={bubble2} kit={kit} />
      ) : null}
    </>
  );
}

function TurtleAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} motion={{ dy: [1.5, 5000], rot: [0.8, 4000, 0.3, 100, 100] }}>
      <RegionMemo kit={kit} id="shell" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
      <MotionGroup clock={clock} motion={{ rot: [3, 2000, 0, 86, 132] }}>
        <RegionMemo kit={kit} id="legFL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [-3, 2000, 0.5, 114, 132] }}>
        <RegionMemo kit={kit} id="legFR" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [3, 2000, 0.3, 86, 68] }}>
        <RegionMemo kit={kit} id="legBL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [-3, 2000, 0.8, 114, 68] }}>
        <RegionMemo kit={kit} id="legBR" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [7, 2500, 0.3, 50, 116] }}>
        <RegionMemo kit={kit} id="tail" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [3, 4000, 0.15, 143, 96] }}>
        <RegionMemo kit={kit} id="head" />
        <RegionMemo kit={kit} id="eye" />
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
    </MotionGroup>
  );
}

function RocketAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} motion={{ dy: [3, 5000], rot: [1.2, 5000, 0.2, 100, 120] }}>
      <RegionMemo kit={kit} id="nose" />
      <RegionMemo kit={kit} id="body" />
      <MotionGroup clock={clock} motion={{ rot: [1.5, 5000, 0.06, 74, 120] }}>
        <RegionMemo kit={kit} id="finL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [1.5, 5000, 0.1, 126, 120] }}>
        <RegionMemo kit={kit} id="finR" />
      </MotionGroup>
      <RegionMemo kit={kit} id="window" />
      <MotionGroup clock={clock} motion={{ scale: [-0.06, 1000, 0, 100, 152] }}>
        <RegionMemo kit={kit} id="flame" />
      </MotionGroup>
      <OutlinePart kit={kit} index={0} />
    </MotionGroup>
  );
}

const FLOWER_PETALS = ['petalTop', 'petalUR', 'petalLR', 'petalBottom', 'petalLL', 'petalUL'];

function FlowerAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} motion={{ rot: [2.5, 5000, 0, 100, 182] }}>
      <RegionMemo kit={kit} id="stem" />
      <MotionGroup clock={clock} motion={{ rot: [1.5, 5000, 0.12, 92, 156] }}>
        <RegionMemo kit={kit} id="leafL" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [-1.5, 5000, 0.16, 104, 146] }}>
        <RegionMemo kit={kit} id="leafR" />
      </MotionGroup>
      <MotionGroup clock={clock} motion={{ rot: [1.2, 5000, 0.07, 100, 120] }}>
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
    'worklet';
    const p = loop(t, 5500, phase);
    return {
      cy: 46 - 30 * p,
      r: r0 + 3 * p,
      cx: 135 + drift * p + 2 * wave(t, 2750, phase + 0.2),
      opacity: 0.85 * bell(p),
    };
  };
};

function HouseAlive({ kit, clock, live }: PageAliveProps) {
  return (
    <>
      <MotionGroup clock={clock} motion={{ grow: [0.02, 3300, 0, 166, 40] }}>
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
      <MotionGroup clock={clock} motion={{ spin: [16500, 166, 40] }}>
        <OutlinePart kit={kit} index={2} />
      </MotionGroup>
      {live
        ? [0, 1, 2].map((i) => (
            <MotionRegion key={i} clock={clock} calc={puffCalc(i)} region={PUFF} kit={kit} />
          ))
        : null}
    </>
  );
}

function IceCreamAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup clock={clock} motion={{ rot: [2, 3200, 0, 100, 178], pulse: [0.03, ICE_KEYS, 100, 178] }}>
      <RegionMemo kit={kit} id="cone" />
      <RegionMemo kit={kit} id="scoopBottom" />
      <RegionMemo kit={kit} id="scoopTop" />
      <RegionMemo kit={kit} id="cherry" />
      <OutlinePart kit={kit} index={0} />
      <OutlinePart kit={kit} index={1} />
    </MotionGroup>
  );
}

function StarAlive({ kit, clock }: PageAliveProps) {
  return (
    <MotionGroup
      clock={clock}
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

export type AliveArtworkProps = {
  page: ColoringPage;
  fills?: ColoringState;
  /** Set false to freeze every clock at frame 0 (the plain drawing). */
  live?: boolean;
};

export function AliveArtwork({ page, fills = {}, live = true }: AliveArtworkProps) {
  const reduced = useReducedMotion();
  const isLive = live && !reduced;
  const kit: Kit = {
    page,
    fills,
    stroke: page.stroke ?? '#2D3436',
    strokeWidth: page.strokeWidth ?? 3,
  };
  const clock = useLoopClock(PAGE_PERIODS[page.id] ?? 6000, isLive);

  return (
    <Svg viewBox={page.viewBox} style={{ width: '100%', height: '100%' }}>
      {page.id === 'butterfly' ? <ButterflyAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'fish' ? <FishAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'turtle' ? <TurtleAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'rocket' ? <RocketAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'flower' ? <FlowerAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'house' ? <HouseAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'icecream' ? <IceCreamAlive kit={kit} clock={clock} live={isLive} /> : null}
      {page.id === 'star' ? <StarAlive kit={kit} clock={clock} live={isLive} /> : null}
    </Svg>
  );
}
