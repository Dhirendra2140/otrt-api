const fs = require("fs");
const winston = require("winston");
const winstonMongo = require('winston-mongodb');

const {
  winstonLevel: { error, info },
  logDir, dbURL, winstonErrorFile
} = require("../config/config");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => (new Date()).toLocaleTimeString();
module.exports = logger = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.simple(),
      ),
      level: info
    }),
    new (require("winston-daily-rotate-file"))({
      filename: `${logDir}/-results.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      )
    }),
    new winston.transports.File({
      filename: winstonErrorFile,
      level: error,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple(),
      )
    }),
    // new winston.transports.MongoDB({
    //   db: dbURL,
    //   options: { useNewUrlParser: true },
    //   collection: logDir,
    //   level: error,
    //   storeHost: true,
    //   capped: true
    // })
  ]
});
