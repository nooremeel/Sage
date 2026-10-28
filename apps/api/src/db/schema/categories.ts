import { pgTable, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { LOCALES } from '@sage/shared';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').default('book').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categoryTranslations = pgTable(
  'category_translations',
  {
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    locale: text('locale', { enum: LOCALES as unknown as [string, ...string[]] }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.categoryId, table.locale] }),
  }),
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type NewCategoryTranslation = typeof categoryTranslations.$inferInsert;
