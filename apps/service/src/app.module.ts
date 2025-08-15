import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EvmWalletsModule } from './modules/evm-wallets/evm-wallets.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { DiscordAccountsModule } from './modules/discord-accounts/discord-accounts.module';
import { EmailAccountsModule } from './modules/email-accounts/email-accounts.module';
import { ProxyIpsModule } from './modules/proxy-ips/proxy-ips.module';
import { TwitterAccountsModule } from './modules/twitter-accounts/twitter-accounts.module';
import { AccountGroupsModule } from './modules/account-groups/account-groups.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { TaskEngineModule } from './modules/task-engine/task-engine.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskLogsModule } from './modules/task-logs/task-logs.module';
import { BrowserFingerprintsModule } from './modules/browser-fingerprints/browser-fingerprints.module';
import { getDatabaseConfig } from './config/database.config';
import { LoggerModule } from './common/logger/logger.module';
import { TaskResultsModule } from './modules/task-results/task-results.module';
import { MemoryTasksModule } from './modules/memory-tasks/memory-tasks.module';
import { MachineModule } from './common/services/machine.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expirationTime'),
        },
      }),
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          store: redisStore,
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          username: configService.get('redis.username'),
          password: configService.get('redis.password'),
          ttl: 60 * 60 * 24, // 24小时的缓存时间
        }) as any,
      inject: [ConfigService],
    }),
    MachineModule,
    AuthModule,
    UsersModule,
    EvmWalletsModule,
    DiscordAccountsModule,
    EmailAccountsModule,
    ProxyIpsModule,
    TwitterAccountsModule,
    AccountGroupsModule,
    ProjectsModule,
    ScriptsModule,
    BrowserFingerprintsModule,
    TaskEngineModule,
    TasksModule,
    TaskLogsModule,
    TaskResultsModule,
    MemoryTasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
