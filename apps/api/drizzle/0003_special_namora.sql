CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "course_translations_search_text_gin_idx" ON "course_translations" USING gin (to_tsvector('simple', coalesce("search_text", '')));--> statement-breakpoint
CREATE INDEX "courses_catalog_keyset_idx" ON "courses" USING btree ("status","published_at","id");
