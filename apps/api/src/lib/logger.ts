import winston from 'winston';
import { config } from '@/config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;

  if (stack) {
    log += `\n${stack}`;
  }

  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }

  return log;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.log.level,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(colorize({ all: true }), logFormat),
    }),
  ],
});

// Add file transports in production.
//
// These are a convenience for `docker exec`, not the log of record: the Console
// transport above emits the same lines to stdout, where the compose json-file
// driver rotates them at 10m x 3. The files live on the container's writable
// layer, so they are lost on every redeploy — and, until these limits were
// added, they were also unbounded. At LOG_LEVEL=debug the combined log grows
// roughly 8 MB/day, which eats host disk for a copy of data Docker already
// keeps. Bound them to the same 30 MB the stdout side is capped at.
if (config.env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    })
  );
}

// Stream for Morgan (HTTP logging)
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
