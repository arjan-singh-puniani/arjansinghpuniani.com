import type { EventId, IsoTimestamp, JsonValue, TraceId } from './types';

export interface Clock { now(): IsoTimestamp; }
export interface IdGenerator { eventId(): EventId; traceId(): TraceId; }

export class SystemClock implements Clock {
  now(): IsoTimestamp { return new Date().toISOString() as IsoTimestamp; }
}

function randomUuid(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export class RandomIdGenerator implements IdGenerator {
  eventId(): EventId { return randomUuid() as EventId; }
  traceId(): TraceId { return randomUuid() as TraceId; }
}

export class FixedClock implements Clock {
  public constructor(private readonly value: IsoTimestamp) {}
  now(): IsoTimestamp { return this.value; }
}

export class SequenceIdGenerator implements IdGenerator {
  private eventSequence = 0;
  private traceSequence = 0;
  eventId(): EventId { this.eventSequence += 1; return `event-${this.eventSequence}` as EventId; }
  traceId(): TraceId { this.traceSequence += 1; return `trace-${this.traceSequence}` as TraceId; }
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

export function asJson(value: unknown): JsonValue {
  return value as JsonValue;
}
