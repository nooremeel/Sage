import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export const DRIZZLE_DB = 'DRIZZLE_DB';
export const POSTGRES_CLIENT = 'POSTGRES_CLIENT';

export type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      useFactory: (config: ConfigService) => {
        const connectionString = config.get<string>(
          'DATABASE_URL',
          'postgresql://sage_user:sage_password@localhost:5432/sage_db',
        );
        const max = config.get<number>('DATABASE_POOL_MAX', 10);
        return postgres(connectionString, { max });
      },
      inject: [ConfigService],
    },
    {
      provide: DRIZZLE_DB,
      useFactory: (client: postgres.Sql) => {
        return drizzle(client, { schema });
      },
      inject: [POSTGRES_CLIENT],
    },
  ],
  exports: [DRIZZLE_DB, POSTGRES_CLIENT],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_CLIENT) private readonly client: postgres.Sql) {}

  async onModuleDestroy() {
    await this.client.end();
  }
}
