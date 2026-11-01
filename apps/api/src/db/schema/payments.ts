import {
  pgTable,
  timestamp,
  uuid,
  integer,
  varchar,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.js';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull().default('fake'),
    transactionId: varchar('transaction_id', { length: 255 }).notNull().unique(),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
    rawPayload: jsonb('raw_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('payments_order_id_idx').on(table.orderId),
    transactionIdIdx: index('payments_transaction_id_idx').on(table.transactionId),
    idempotencyKeyIdx: index('payments_idempotency_key_idx').on(table.idempotencyKey),
  }),
);

