import type { Timestamp } from '../types/common';

/**
 * Small, focused date helpers. Deliberately not a wrapper around a
 * date library — Node's built-in Date is sufficient for the operations
 * NexCart actually needs (ISO timestamps, TTL math, expiry checks).
 */

/** Current time as an ISO 8601 string (matches the Timestamp type). */
export function nowIso(): Timestamp {
  return new Date().toISOString();
}

/** Adds a duration in milliseconds to a date (or now, if omitted) and returns an ISO string. */
export function addMs(ms: number, from: Date = new Date()): Timestamp {
  return new Date(from.getTime() + ms).toISOString();
}

export function addSeconds(seconds: number, from?: Date): Timestamp {
  return addMs(seconds * 1000, from);
}

export function addMinutes(minutes: number, from?: Date): Timestamp {
  return addMs(minutes * 60 * 1000, from);
}

/** True if the given ISO timestamp is in the past relative to now. */
export function isPast(isoTimestamp: Timestamp): boolean {
  return new Date(isoTimestamp).getTime() < Date.now();
}

/** True if the given ISO timestamp is still in the future. */
export function isFuture(isoTimestamp: Timestamp): boolean {
  return !isPast(isoTimestamp);
}

/** Milliseconds elapsed between two ISO timestamps (b - a). */
export function msBetween(a: Timestamp, b: Timestamp): number {
  return new Date(b).getTime() - new Date(a).getTime();
}
