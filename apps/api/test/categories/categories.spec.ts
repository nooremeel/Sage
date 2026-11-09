import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../src/modules/categories/categories.service.js';
import { categories, categoryTranslations } from '../../src/db/schema/index.js';
import { CacheService } from '../../common/cache/cache.service.js';

describe('Academic Categories & Bilingual Taxonomy Suite', () => {
  let categoriesService: CategoriesService;
  let mockDb: any;
  let mockCacheService: any;

  const catId = 'cat-arabic-calligraphy-uuid';
  let categoriesList: any[] = [];
  let translationsList: any[] = [];

  beforeEach(() => {
    categoriesList = [
      {
        id: catId,
        slug: 'arabic-calligraphy',
        icon: 'feather',
      },
      {
        id: 'cat-islamic-geometry-uuid',
        slug: 'islamic-geometry',
        icon: 'compass',
      },
    ];

    translationsList = [
      {
        id: 'trans-ar-1',
        categoryId: catId,
        locale: 'ar',
        name: 'الخط العربي الأصيل',
        description: 'فنون الخط العربي الكلاسيكي بشتى مدارسه',
      },
      {
        id: 'trans-en-1',
        categoryId: catId,
        locale: 'en',
        name: 'Arabic Calligraphy',
        description: 'Classical Arabic script masters and traditions',
      },
    ];

    mockCacheService = {
      getOrSet: vi.fn((_key, _ttl, fetcher) => fetcher()),
      invalidateTag: vi.fn(),
    };

    mockDb = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === categoryTranslations) {
              return translationsList.filter((t) => t.categoryId === catId);
            }
            return [];
          },
        }),
      }),
      query: {
        categories: {
          findFirst: async (opts: any) => {
            const slug = opts?.where?.queryChunks?.[1]?.value || categoriesList[0]?.slug;
            return categoriesList.find((c) => c.slug === slug) || null;
          },
        },
        categoryTranslations: {
          findFirst: async (opts: any) => {
            return translationsList[0] || null;
          },
        },
      },
    };

    mockDb.select = () => ({
      from: (table: any) => {
        if (table === categories) {
          return Promise.resolve(categoriesList);
        }
        return {
          where: () => translationsList.filter((t) => t.categoryId === catId),
        };
      },
    });

    categoriesService = new CategoriesService(
      mockDb,
      mockCacheService as unknown as CacheService,
    );
  });

  it('lists all categories with active locale translations from cache or DB', async () => {
    const list = await categoriesService.findAll('ar');
    expect(list).toHaveLength(2);
    const cat = list.find((c) => c.slug === 'arabic-calligraphy');
    expect(cat?.name).toBe('الخط العربي الأصيل');
    expect(cat?.icon).toBe('feather');
  });

  it('finds category by slug with localized details', async () => {
    const category = await categoriesService.findBySlug('arabic-calligraphy', 'en');
    expect(category.slug).toBe('arabic-calligraphy');
    expect(category.name).toBe('Arabic Calligraphy');
  });

  it('throws NotFoundException when slug does not exist', async () => {
    categoriesList = [];
    await expect(categoriesService.findBySlug('non-existent-category', 'en')).rejects.toThrow(
      NotFoundException,
    );
  });
});

