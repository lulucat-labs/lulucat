import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

export const winstonConfig = {
  transports: [
    // 控制台日志
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('LuluCat', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
    // debug 日志文件
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: join(logDir, 'debug'),
      filename: 'debug-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d', // debug 日志保留 7 天
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // 信息日志文件
    new winston.transports.DailyRotateFile({
      level: 'info',
      dirname: join(logDir, 'info'),
      filename: 'info-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // 错误日志文件
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: join(logDir, 'error'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
