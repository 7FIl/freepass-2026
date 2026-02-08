import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino/file',
        options: { destination: 1 },
      },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
