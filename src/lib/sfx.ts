import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type SfxName =
  | 'tap'
  | 'pop'
  | 'select'
  | 'back'
  | 'toggleOn'
  | 'toggleOff'
  | 'reward';

const SOURCES: Record<SfxName, number> = {
  tap: require('@/assets/sounds/tap.wav'),
  pop: require('@/assets/sounds/pop.wav'),
  select: require('@/assets/sounds/select.wav'),
  back: require('@/assets/sounds/back.wav'),
  toggleOn: require('@/assets/sounds/toggleOn.wav'),
  toggleOff: require('@/assets/sounds/toggleOff.wav'),
  reward: require('@/assets/sounds/reward.wav'),
};

const BRUSH_SOURCE = require('@/assets/sounds/brush.wav');
const BGM_SOURCE = require('@/assets/sounds/bgm.wav');

const STORAGE_KEY = 'colorjoy.soundEnabled';
const MUSIC_STORAGE_KEY = 'colorjoy.musicEnabled';
/** Gentle level so little ears never get a jolt. */
const VOLUME = 0.55;
/** The looping brush texture sits even quieter underneath. */
const BRUSH_VOLUME = 0.3;
/** Background music stays soft so it never drowns out the effects. */
const BGM_VOLUME = 0.22;

let enabled = true;
let musicEnabled = true;
let hydrationStarted = false;
const listeners = new Set<(value: boolean) => void>();
const musicListeners = new Set<(value: boolean) => void>();
const players = new Map<SfxName, AudioPlayer>();
let brushPlayer: AudioPlayer | null = null;
let brushPlaying = false;
let bgmPlayer: AudioPlayer | null = null;
let bgmPlaying = false;

function getPlayer(name: SfxName): AudioPlayer | null {
  let player = players.get(name);
  if (!player) {
    try {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = VOLUME;
      players.set(name, player);
    } catch {
      return null;
    }
  }
  return player;
}

/** Play a cute sound (no-op when sounds are off). Rapid taps restart the sound. */
export function playSfx(name: SfxName) {
  if (!enabled) return;
  ensureBgmStarted();
  const player = getPlayer(name);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Never let a sound hiccup break a tap.
  }
}

/**
 * Soft looping paintbrush texture, played while a finger is on the drawing.
 * Starts from the beginning each stroke and pauses the moment it stops.
 */
export function startBrush() {
  if (!enabled || brushPlaying) return;
  ensureBgmStarted();
  if (!brushPlayer) {
    try {
      brushPlayer = createAudioPlayer(BRUSH_SOURCE);
      brushPlayer.loop = true;
      brushPlayer.volume = BRUSH_VOLUME;
    } catch {
      brushPlayer = null;
    }
  }
  if (!brushPlayer) return;
  try {
    brushPlaying = true;
    brushPlayer.seekTo(0);
    brushPlayer.play();
  } catch {
    brushPlaying = false;
  }
}

export function stopBrush() {
  if (!brushPlaying) return;
  brushPlaying = false;
  try {
    if (brushPlayer) brushPlayer.pause();
  } catch {
    void 0;
  }
}

/** Start background music only after the user's first interaction. */
export function ensureBgmStarted() {
  if (musicEnabled) startBgm();
}

export function startBgm() {
  if (!musicEnabled || bgmPlaying) return;
  if (!bgmPlayer) {
    try {
      bgmPlayer = createAudioPlayer(BGM_SOURCE);
      bgmPlayer.loop = true;
      bgmPlayer.volume = BGM_VOLUME;
    } catch {
      bgmPlayer = null;
    }
  }
  if (!bgmPlayer) return;
  try {
    bgmPlaying = true;
    bgmPlayer.seekTo(0);
    bgmPlayer.play();
  } catch {
    bgmPlaying = false;
  }
}

export function stopBgm() {
  if (!bgmPlaying) return;
  bgmPlaying = false;
  try {
    bgmPlayer?.pause();
  } catch {
    void 0;
  }
}

export async function setMusicEnabled(value: boolean) {
  musicEnabled = value;
  if (value) {
    ensureBgmStarted();
  } else {
    stopBgm();
  }
  for (const listener of musicListeners) listener(value);
  try {
    await AsyncStorage.setItem(MUSIC_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Keep the in-memory value even if persistence fails.
  }
}

export function useMusicEnabled(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(musicEnabled);

  useEffect(() => {
    let alive = true;
    void hydrate().then(() => {
      if (alive) setValue(musicEnabled);
    });
    musicListeners.add(setValue);
    return () => {
      alive = false;
      musicListeners.delete(setValue);
    };
  }, []);

  const set = (next: boolean) => {
    void setMusicEnabled(next);
  };

  return [value, set];
}

async function hydrate() {
  if (hydrationStarted) return;
  hydrationStarted = true;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const value = stored === 'true';
      enabled = value;
      for (const listener of listeners) listener(value);
    }
    const musicStored = await AsyncStorage.getItem(MUSIC_STORAGE_KEY);
    if (musicStored !== null) {
      musicEnabled = musicStored === 'true';
      for (const listener of musicListeners) listener(musicEnabled);
    }
  } catch {
    // Default to sounds on if storage fails.
  }
}

export async function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value) stopBrush();
  for (const listener of listeners) listener(value);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Keep the in-memory value even if persistence fails.
  }
}

/** Reactive sound setting for the on/off toggle UI. */
export function useSoundEnabled(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(enabled);

  useEffect(() => {
    let alive = true;
    void hydrate().then(() => {
      if (alive) setValue(enabled);
    });
    listeners.add(setValue);
    return () => {
      alive = false;
      listeners.delete(setValue);
    };
  }, []);

  const set = (next: boolean) => {
    void setSoundEnabled(next);
  };

  return [value, set];
}
