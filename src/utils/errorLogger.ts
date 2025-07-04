/*
 * Centralized error logger.
 * In production we can swap console logging for Sentry, LogRocket, etc.
 */

export interface LogOptions {
  context?: string;
  extra?: Record<string, unknown>;
}

export function logError(error: unknown, options: LogOptions = {}): void {
  // You can replace this with any logging backend
  // eslint-disable-next-line no-console
  console.error('[ErrorLogger]', options.context ?? 'unknown', error, options.extra ?? {});
}