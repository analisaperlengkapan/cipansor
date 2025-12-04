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
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production
if (config.env === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Stream for Morgan (HTTP logging)
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
