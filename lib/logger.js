const { createLogger, format, transports } = require('winston');
const chalk = require('chalk').default;
const { combine, colorize, label, printf, splat, timestamp } = format;

const logFormat = (loggerLabel) => combine(
  timestamp(),
  splat(),
  colorize(),
  label({ label: loggerLabel }),
  printf(info => `${info.timestamp} ${chalk.cyan(info.label)} ${info.level}: ${info.message}`)
);

const createLoggerWithLabel = (label) => createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new transports.Console({})],
  format: logFormat(label)
});

module.exports = {
  createLoggerWithLabel
};
