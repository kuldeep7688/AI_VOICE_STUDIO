type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) ||
  (import.meta.env.DEV ? 'debug' : 'warn');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatArgs(context: string, args: unknown[]): unknown[] {
  const prefix = `[${context}]`;
  const ts = new Date().toISOString().slice(11, 19);
  return [`${ts} ${prefix}`, ...args];
}

export function createLogger(context: string) {
  return {
    debug(...args: unknown[]) {
      if (shouldLog('debug')) {
        console.debug(...formatArgs(context, args));
      }
    },
    info(...args: unknown[]) {
      if (shouldLog('info')) {
        console.info(...formatArgs(context, args));
      }
    },
    warn(...args: unknown[]) {
      if (shouldLog('warn')) {
        console.warn(...formatArgs(context, args));
      }
    },
    error(...args: unknown[]) {
      if (shouldLog('error')) {
        console.error(...formatArgs(context, args));
      }
    },
  };
}
