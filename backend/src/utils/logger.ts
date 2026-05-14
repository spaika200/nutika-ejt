import winston from 'winston';
import LokiTransport from 'winston-loki';

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'nutika-backend' },
  transports: [
    new winston.transports.Console()
  ],
});

if (process.env.LOKI_ENABLED === 'true') {
  logger.add(new LokiTransport({
    host: process.env.LOKI_URL || 'http://localhost:3100',
    labels: { app: 'nutika-backend' },
    json: true,
    format: combine(timestamp(), json()),
    replaceTimestamp: true,
    onConnectionError: (err) => console.error(err)
  }));
}
