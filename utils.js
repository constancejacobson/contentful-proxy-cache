const winston = require("winston");

const isLocalEnvironment =
  typeof process.env.NODE_ENV === "undefined" || process.env.NODE_ENV === "development";

const logger = winston.createLogger({
  level: "verbose",
  exitOnError: false,
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.simple()),
});

if (isLocalEnvironment) {
  logger.add(consoleTransport);
  logger.exceptions.handle(consoleTransport);
}

module.exports = {
  logger,
};
