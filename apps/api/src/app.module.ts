import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from '@sage/shared';
import { DbModule } from './db/db.module.js';
import { CacheModule } from './common/cache/cache.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { CaslModule } from './common/casl/casl.module.js';
import { PoliciesGuard } from './common/casl/policies.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { CurriculumModule } from './modules/curriculum/curriculum.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { JwtAuthMiddleware } from './common/middleware/jwt-auth.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['../../.env', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        customProps: (req) => ({
          requestId: req.headers['x-request-id'],
        }),
        autoLogging: {
          ignore: (req) => req.url === '/api/health' || req.url === '/health',
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DbModule,
    CacheModule,
    CaslModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    CurriculumModule,
    MediaModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, JwtAuthMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
