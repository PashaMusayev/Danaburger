import { config } from './config';

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes since midnight in the restaurant's time zone. */
export function bakuMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.hours.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export type OpenStatus = { open: boolean; minutesToChange: number };

/** Handles hours that cross midnight (11:00 → 05:00). */
export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const t = bakuMinutes(now);
  const open = toMinutes(config.hours.open);
  const close = toMinutes(config.hours.close);
  const day = 24 * 60;
  const crosses = close <= open;
  const isOpen = crosses ? t >= open || t < close : t >= open && t < close;
  const target = isOpen ? close : open;
  const minutesToChange = (target - t + day) % day;
  return { open: isOpen, minutesToChange };
}
