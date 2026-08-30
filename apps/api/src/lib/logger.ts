import pino from 'pino';

export function createLogger(nodeEnv: string, logLevel = 'info') {
  const isDev = nodeEnv === 'development';

  return pino({
    level: logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.secret',
        '*.accessKey',
        '*.secretKey',
        '*.apiKey',
      ],
      remove: true,
    },
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
}
