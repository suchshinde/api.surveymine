// import winston from 'winston';
// import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../../config/environment/index';
//
// const logger = winston.createLogger({
//   level: 0,
//   transports: [
//     new DailyRotateFile({
//       name: 'error-file',
//       datePattern: 'YYYY-MM-DD',
//       filename: `${config.root}/logs/error`,
//     }),
//   ],
//   exitOnError: false,
// });
//
//
// module.exports = logger;


const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new (winston.transports.DailyRotateFile)({
  filename: `${config.root}/logs/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// transport.on('rotate', (oldFilename, newFilename) => {
//   // do something fun
// });

// const logger = new (winston.Logger)({
//   transports: [
//     transport,
//   ],
// });
const logger = winston.createLogger({
  transports: [
    transport,
  ],
  exitOnError: false,
});

module.exports = { logger };
