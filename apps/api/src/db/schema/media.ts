import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  bigint,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import {
  MEDIA_ASSET_STATUS,
  MEDIA_ASSET_KINDS,
  type MediaRendition,
} from '@sage/shared';
import { users } from './users.js';

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: MEDIA_ASSET_KINDS })
      .default('video')
      .notNull(),
    status: text('status', { enum: MEDIA_ASSET_STATUS })
      .default('pending_upload')
      .notNull(),
    sourceKey: text('source_key').notNull(),
    hlsPrefix: text('hls_prefix'),
    durationSec: integer('duration_sec').default(0).notNull(),
    renditions: jsonb('renditions').$type<MediaRendition[]>(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).default(0).notNull(),
    uploadId: text('upload_id'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdIdx: index('media_assets_owner_id_idx').on(table.ownerId),
    statusIdx: index('media_assets_status_idx').on(table.status),
  }),
);

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
