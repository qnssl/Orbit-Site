import type { Body } from '../data/bodies';

export const clock = { days: 0 };

type Listener = () => void;
const listeners = new Set<Listener>();
let snapshot = 0;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): number {
  return snapshot;
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function publishClock(): void {
  const next = Math.floor(clock.days);
  if (next !== snapshot) {
    snapshot = next;
    notify();
  }
}

export function resetClock(): void {
  clock.days = 0;
  snapshot = 0;
  notify();
}

export const TAU = Math.PI * 2;

export const SPIN_FACTOR = 0.03;

export function orbitAngle(body: Body, days: number): number {
  if (!body.orbitalPeriodDays) return 0;
  return body.visual.phase + (TAU * days) / body.orbitalPeriodDays;
}

export function spinAngle(body: Body, days: number): number {
  return (SPIN_FACTOR * TAU * days) / (body.rotationPeriodHours / 24);
}
