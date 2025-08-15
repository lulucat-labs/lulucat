import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export const getDatabaseConfig = (
  configService: ConfigService,
  options: Partial<TypeOrmModuleOptions> = {},
): TypeOrmModuleOptions & MysqlConnectionOptions => {
  const host = configService.get('database.host');
  const port = configService.get('database.port');
  const username = configService.get('database.username');
  const password = configService.get('database.password');
  const database = configService.get('database.database');

  if (!host || !port || !username || !password || !database) {
    throw new Error('Missing required database configuration');
  }

  return {
    type: 'mysql',
    host,
    port: Number(port),
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize: false,
    migrations: ['dist/migrations/*.js'],
    migrationsRun: true,
    ...options,
  } as TypeOrmModuleOptions & MysqlConnectionOptions;
};

// 用于非 NestJS 环境的配置（如 Worker 进程）
export const getStandaloneDatabaseConfig = (
  options: Partial<DataSourceOptions> = {},
): DataSourceOptions & MysqlConnectionOptions => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  if (!host || !port || !username || !password || !database) {
    throw new Error('Missing required database environment variables');
  }

  return {
    type: 'mysql',
    host,
    port: parseInt(port, 10),
    username,
    password,
    database,
    synchronize: false,
    ...options,
  } as DataSourceOptions & MysqlConnectionOptions;
};
