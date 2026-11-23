// One-time generator for the app's cute UI sounds (16-bit mono WAV).
// Run: node scripts/generate-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'sounds');
mkdirSync(outDir, { recursive: true });

const SR = 44100;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const silence = (sec) => new Float32Array(Math.round(sec * SR));

function tone({ from, to, sec, gain = 0.4, curve = 'lin', decay = 3, attack = 0.004 }) {
  const n = Math.round(sec * SR);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = curve === 'exp' ? from * Math.pow(to / from, t) : from + (to - from) * t;
    phase += (2 * Math.PI * f) / SR;
    const env = Math.min(1, i / (attack * SR)) * Math.exp(-decay * t);
    out[i] = Math.sin(phase) * gain * env;
  }
  return out;
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => (p.start ?? 0) + p.buf.length));
  const out = new Float32Array(len);
  for (const { buf, start = 0 } of parts) {
    for (let i = 0; i < buf.length; i++) out[start + i] += buf[i];
  }
  return out;
}

const notes = {
  tap: tone({ from: 900, to: 780, sec: 0.07, gain: 0.3, decay: 6 }),
  pop: mix(
    { buf: tone({ from: 640, to: 260, sec: 0.09, gain: 0.42, curve: 'exp', decay: 7 }) },
  ),
  select: mix(
    { buf: tone({ from: 1180, to: 1180, sec: 0.05, gain: 0.26, decay: 8 }) },
    { buf: tone({ from: 1560, to: 1560, sec: 0.06, gain: 0.24, decay: 8 }), start: Math.round(0.045 * SR) },
  ),
  back: tone({ from: 660, to: 440, sec: 0.1, gain: 0.28, decay: 5 }),
  toggleOn: mix(
    { buf: tone({ from: 520, to: 940, sec: 0.12, gain: 0.3, decay: 4 }) },
    { buf: tone({ from: 940, to: 940, sec: 0.05, gain: 0.2, decay: 6 }), start: Math.round(0.11 * SR) },
  ),
  toggleOff: tone({ from: 820, to: 430, sec: 0.13, gain: 0.28, decay: 4 }),
  reward: mix(
    ...[523.25, 659.25, 783.99, 1046.5].map((f, i) => ({
      buf: tone({ from: f, to: f, sec: 0.22, gain: 0.26, decay: 3.5 }),
      start: Math.round(i * 0.09 * SR),
    })),
    {
      buf: tone({ from: 2093, to: 2093, sec: 0.35, gain: 0.16, decay: 4 }),
      start: Math.round(0.36 * SR),
    },
  ),
};

/** Soft, natural "brush on paper" texture: brown/pink noise with gentle swells. */
function brushLoop() {
  const sec = 2.4;
  const n = Math.round(sec * SR);
  const out = new Float32Array(n);

  let seed = 987654321;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x3fffffff - 1;
  };

  // Brown-ish (integrated) noise for a soft, paper-like texture.
  let brown = 0;
  let lp = 0;
  const co = 0.06;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    brown = (brown + 0.02 * rand()) * 0.985;
    lp += co * (brown - lp);
    // Gentle, non-repeating swells (incommensurate rates so it never loops obviously).
    const swell = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.37 * t));
    const rustle = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3.91 * t + 1.2));
    out[i] = lp * swell * rustle * 0.35;
  }

  // Long crossfade so the seam disappears completely.
  const f = Math.round(0.12 * SR);
  const head = out.slice(0, f);
  for (let k = 0; k < f; k++) {
    const a = k / f;
    out[n - f + k] = out[n - f + k] * (1 - a) + head[k] * a;
  }
  return out;
}

notes.brush = brushLoop();

const NOTE = { C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.0, A4:440.0, B4:493.88, C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.0, C6:1046.5 };
function cheerfulBgm() {
  const sec = 8.0;
  const n = Math.round(sec * SR);
  const out = new Float32Array(n);
  const bpm = 120;
  const beat = 60 / bpm; // 0.5s
  const addNote = (freq, start, dur, gain, wave = 'sine', decay = 4) => {
    const s = Math.round(start * SR);
    const len = Math.round(dur * SR);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const idx = s + i;
      if (idx >= n) break;
      const tt = i / len;
      phase += (2 * Math.PI * freq) / SR;
      const env = Math.sin(Math.PI * Math.min(1, tt * 4)) * Math.exp(-decay * tt);
      let val = 0;
      if (wave === 'sine') val = Math.sin(phase);
      else if (wave === 'tri') val = (2 / Math.PI) * Math.asin(Math.sin(phase));
      else if (wave === 'bell') val = Math.sin(phase) + 0.4 * Math.sin(phase * 2.01) + 0.15 * Math.sin(phase * 3.97);
      out[idx] += val * gain * env;
    }
  };
  // Chords (piano-ish sine) on each beat
  const chords = [
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.C4, NOTE.E4, NOTE.G4],
    [NOTE.F4, NOTE.A4, NOTE.C5], [NOTE.G4, NOTE.B4, NOTE.D5],
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.A4, NOTE.C5, NOTE.E4],
    [NOTE.F4, NOTE.A4, NOTE.C5], [NOTE.G4, NOTE.B4, NOTE.D5],
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.C4, NOTE.E4, NOTE.G4],
    [NOTE.F4, NOTE.A4, NOTE.C5], [NOTE.G4, NOTE.B4, NOTE.D5],
    [NOTE.A4, NOTE.C5, NOTE.E4], [NOTE.F4, NOTE.A4, NOTE.C5],
    [NOTE.G4, NOTE.B4, NOTE.D5], [NOTE.C4, NOTE.E4, NOTE.G4],
  ];
  chords.forEach((ch, i) => {
    const t = i * beat;
    ch.forEach((f) => addNote(f, t, beat * 0.9, 0.07, 'sine', 3));
  });
  // Xylophone melody (bright tri) on 8th notes
  const mel = [
    NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6,
    NOTE.A5, NOTE.F5, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.F5, NOTE.D5, NOTE.F5,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.C5, NOTE.E5,
    NOTE.D5, NOTE.F5, NOTE.A5, NOTE.F5, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.D5,
    NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5,
    NOTE.F5, NOTE.A5, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.F5, NOTE.D5, NOTE.F5,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.C5, NOTE.E5,
    NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4,
  ];
  mel.forEach((f, i) => {
    const t = i * (beat / 2);
    addNote(f, t, beat * 0.45, 0.13, 'tri', 5);
  });
  // Bells (sparkle) occasional
  const bells = [NOTE.C6, NOTE.G5, NOTE.E5, NOTE.C6, NOTE.A5, NOTE.G5];
  bells.forEach((f, i) => {
    const t = i * (sec / bells.length) + 0.25;
    addNote(f, t, 0.6, 0.06, 'bell', 3);
  });
  // Light beat: kick on beats 1,3; hi-hat on off-beats
  for (let i = 0; i < sec / beat; i++) {
    const t = i * beat;
    if (i % 2 === 0) addNote(60, t, 0.12, 0.12, 'sine', 8); // kick-ish
    // hi-hat noise
    const s = Math.round((t + beat / 2) * SR);
    const len = Math.round(0.05 * SR);
    let seed = 12345 + i;
    for (let j = 0; j < len; j++) {
      const idx = s + j;
      if (idx >= n) break;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const env = Math.exp(-12 * (j / len));
      out[idx] += ((seed / 0x7fffffff) * 2 - 1) * 0.04 * env;
    }
  }
  // gentle master low-pass
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp += 0.25 * (out[i] - lp);
    out[i] = lp;
  }
  // crossfade seam
  const f = Math.round(0.06 * SR);
  const head = out.slice(0, f);
  for (let k = 0; k < f; k++) {
    const a = k / f;
    out[n - f + k] = out[n - f + k] * (1 - a) + head[k] * a;
  }
  return out;
}

notes.bgm = cheerfulBgm();

for (const [name, samples] of Object.entries(notes)) {
  writeFileSync(join(outDir, `${name}.wav`), wav(samples));
  console.log(`wrote ${name}.wav`);
}
