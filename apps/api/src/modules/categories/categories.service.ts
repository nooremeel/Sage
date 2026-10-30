import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { categories, categoryTranslations } from '../../db/schema/index.js';
import type { Locale } from '@sage/shared';
import { CacheService } from '../../common/cache/cache.service.js';

export interface CategoryWithTranslation {
  id: string;
  slug: string;
  icon: string;
  name: string;
  description: string | null;
  locale: Locale;
}

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(locale: Locale = 'en'): Promise<CategoryWithTranslation[]> {
    const cacheKey = `categories:list:${locale}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      300,
      async () => {
        const allCategories = await this.db.select().from(categories);
        const results: CategoryWithTranslation[] = [];

        for (const cat of allCategories) {
          const trans = await this.db.query.categoryTranslations.findFirst({
            where: eq(categoryTranslations.categoryId, cat.id),
          });

          const specificTrans = await this.db
            .select()
            .from(categoryTranslations)
            .where(eq(categoryTranslations.categoryId, cat.id));

          const match =
            specificTrans.find((t) => t.locale === locale) ||
            specificTrans.find((t) => t.locale === 'en') ||
            trans;

          results.push({
            id: cat.id,
            slug: cat.slug,
            icon: cat.icon,
            name: match ? match.name : cat.slug,
            description: match?.description ?? null,
            locale: (match?.locale as Locale) ?? locale,
          });
        }

        return results;
      },
      'categories',
    );
  }

  async findBySlug(slug: string, locale: Locale = 'en'): Promise<CategoryWithTranslation> {
    const cat = await this.db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!cat) {
      throw new NotFoundException(`Category not found: ${slug}`);
    }

    const transList = await this.db
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, cat.id));

    const match =
      transList.find((t) => t.locale === locale) ||
      transList.find((t) => t.locale === 'en') ||
      transList[0];

    return {
      id: cat.id,
      slug: cat.slug,
      icon: cat.icon,
      name: match ? match.name : cat.slug,
      description: match?.description ?? null,
      locale: (match?.locale as Locale) ?? locale,
    };
  }

  async create(data: {
    slug: string;
    icon?: string;
    translations: { locale: Locale; name: string; description?: string }[];
  }): Promise<{ id: string; slug: string }> {
    const existing = await this.db.query.categories.findFirst({
      where: eq(categories.slug, data.slug),
    });

    if (existing) {
      throw new ConflictException(`Category slug already exists: ${data.slug}`);
    }

    const [newCat] = await this.db
      .insert(categories)
      .values({
        slug: data.slug,
        icon: data.icon || 'book',
      })
      .returning();

    if (!newCat) {
      throw new Error('Failed to create category');
    }

    for (const t of data.translations) {
      await this.db.insert(categoryTranslations).values({
        categoryId: newCat.id,
        locale: t.locale,
        name: t.name,
        description: t.description,
      });
    }

    await this.cacheService.invalidateTag('categories');

    return { id: newCat.id, slug: newCat.slug };
  }
}

