import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/index.js';
import { normalizeArabic } from '../common/utils/arabic-normalizer.js';

dotenv.config({ path: '../../.env' });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  'postgresql://sage_user:sage_password@localhost:5432/sage_db';

console.log('[Seed] Connecting to PostgreSQL at:', connectionString.replace(/:[^:]*@/, ':****@'));

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

async function main() {
  console.log('[Seed] Starting idempotent database seed...');

  // 1. Users
  const defaultPassword = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
  });

  const seedUsers = [
    { email: 'admin@sage.local', role: 'admin' as const, locale: 'en' as const },
    { email: 'nour@sage.local', role: 'instructor' as const, locale: 'ar' as const },
    { email: 'sarah@sage.local', role: 'instructor' as const, locale: 'en' as const },
    { email: 'student@sage.local', role: 'student' as const, locale: 'ar' as const },
  ];

  const userMap = new Map<string, string>();

  for (const u of seedUsers) {
    let existing = await db.query.users.findFirst({
      where: eq(schema.users.email, u.email),
    });

    if (!existing) {
      const [created] = await db
        .insert(schema.users)
        .values({
          email: u.email,
          passwordHash: defaultPassword,
          role: u.role,
          locale: u.locale,
          emailVerifiedAt: new Date(),
        })
        .returning();
      existing = created;
      console.log(`[Seed] Created user: ${u.email} (${u.role})`);
    } else {
      console.log(`[Seed] User already exists: ${u.email}`);
    }

    if (existing) {
      userMap.set(u.email, existing.id);
    }
  }

  // 2. Categories
  const categoriesData = [
    {
      slug: 'software-engineering',
      icon: 'code',
      translations: [
        {
          locale: 'en' as const,
          name: 'Software Engineering',
          description: 'Systems architecture, modern web development, and cloud services.',
        },
        {
          locale: 'ar' as const,
          name: 'هندسة البرمجيات',
          description: 'معمارية النظم وهندسة تطبيقات الويب والخدمات السحابية الحديثة.',
        },
      ],
    },
    {
      slug: 'islamic-arts',
      icon: 'pen-tool',
      translations: [
        {
          locale: 'en' as const,
          name: 'Classical Arts & Calligraphy',
          description: 'Traditional Arabic script mastery, paper marbling, and ink drafting.',
        },
        {
          locale: 'ar' as const,
          name: 'الفنون الكلاسيكية والخط العربي',
          description: 'إتقان الخط العربي الكلاسيكي، فن الإبرو، وصناعة الحبر والورق المقهر.',
        },
      ],
    },
    {
      slug: 'business-leadership',
      icon: 'compass',
      translations: [
        {
          locale: 'en' as const,
          name: 'Business & Leadership',
          description: 'Digital product management, venture strategy, and organizational growth.',
        },
        {
          locale: 'ar' as const,
          name: 'إدارة الأعمال والقيادة',
          description: 'إدارة المنتجات الرقمية، استراتيجيات الريادة، وتنمية المهارات القيادية.',
        },
      ],
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    let existingCat = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, cat.slug),
    });

    if (!existingCat) {
      const [created] = await db
        .insert(schema.categories)
        .values({ slug: cat.slug, icon: cat.icon })
        .returning();
      existingCat = created;

      for (const t of cat.translations) {
        await db.insert(schema.categoryTranslations).values({
          categoryId: created!.id,
          locale: t.locale,
          name: t.name,
          description: t.description,
        });
      }
      console.log(`[Seed] Created category: ${cat.slug}`);
    } else {
      console.log(`[Seed] Category already exists: ${cat.slug}`);
    }

    if (existingCat) {
      categoryMap.set(cat.slug, existingCat.id);
    }
  }

  // 3. Courses
  const instructorId = userMap.get('nour@sage.local')!;
  const engineeringCatId = categoryMap.get('software-engineering')!;
  const artsCatId = categoryMap.get('islamic-arts')!;

  const coursesData = [
    {
      categoryId: engineeringCatId,
      instructorId,
      status: 'published' as const,
      level: 'advanced' as const,
      priceCents: 4900,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      translations: [
        {
          locale: 'ar' as const,
          title: 'معمارية الويب الحديثة والأنظمة الموزعة',
          subtitle: 'بناء منصات سحابية عالية الأداء وقابلة للتوسع',
          description: 'دورة شاملة تغطي معمارية الخوادم السحابية، التخزين المؤقت عبر Redis، وقواعد البيانات الموزعة مع أمثلة واقعية ومشاريع متقدمة.',
          slug: 'modern-web-architecture-ar',
        },
        {
          locale: 'en' as const,
          title: 'Modern Web Architecture & Distributed Systems',
          subtitle: 'Building resilient, high-performance cloud platforms',
          description: 'An advanced curriculum covering serverless patterns, Redis caching strategies, relational data modeling, and media delivery pipelines.',
          slug: 'modern-web-architecture',
        },
      ],
      sections: [
        {
          title: { ar: 'الفصل الأول: أسس الأنظمة الموزعة', en: 'Module 1: Distributed Foundations' },
          lessons: [
            {
              title: { ar: 'نظرة عامة على المعمارية السحابية', en: 'Cloud Architecture Overview' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 420,
            },
            {
              title: { ar: 'استراتيجيات التخزين المؤقت وحماية قواعد البيانات', en: 'Cache-Aside Strategies' },
              type: 'article' as const,
              isFreePreview: false,
              durationSec: 600,
            },
          ],
        },
        {
          title: { ar: 'الفصل الثاني: خطوط معالجة الوسائط المتعددة', en: 'Module 2: Media Pipelines' },
          lessons: [
            {
              title: { ar: 'بروتوكول HLS وتقطيع الفيديو المتكيف', en: 'Adaptive HLS & Segment Streaming' },
              type: 'video' as const,
              isFreePreview: false,
              durationSec: 850,
            },
          ],
        },
      ],
    },
    {
      categoryId: artsCatId,
      instructorId,
      status: 'published' as const,
      level: 'beginner' as const,
      priceCents: 0,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      translations: [
        {
          locale: 'ar' as const,
          title: 'أسرار الخط العربي: هندسة خط الثلث الكلاسيكي',
          subtitle: 'دراسة تطبيقية لقواعد الميزان ونسب الحروف بالقلم والقصبة',
          description: 'رحلة أكاديمية عملية لاستكشاف أصول خط الثلث، إعداد قصبة الخط، حبر السناج، وتطبيق الحروف المفردة والمركبة بحسب المدارس العثمانية والبغدادية.',
          slug: 'thuluth-calligraphy-ar',
        },
        {
          locale: 'en' as const,
          title: 'Classical Arabic Calligraphy: The Geometry of Thuluth',
          subtitle: 'A practical study of proportions, reed pens, and ink drafting',
          description: 'Explore the traditional discipline of Thuluth script, reed trimming, soot ink preparation, and geometric letterforms according to master traditions.',
          slug: 'thuluth-calligraphy',
        },
      ],
      sections: [
        {
          title: { ar: 'المدخل: الأدوات والمقاييس', en: 'Introduction: Tools and Proportions' },
          lessons: [
            {
              title: { ar: 'اختيار وقص القصبة وحبر السناج', en: 'Selecting Reed Pens and Carbon Ink' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 540,
            },
            {
              title: { ar: 'ميزان النقطة ونسب الألف واللام', en: 'The Rhombic Dot & Letter Proportions' },
              type: 'video' as const,
              isFreePreview: false,
              durationSec: 720,
            },
          ],
        },
      ],
    },
  ];

  for (const cData of coursesData) {
    const existingTrans = await db.query.courseTranslations.findFirst({
      where: eq(schema.courseTranslations.slug, cData.translations[0]!.slug),
    });

    if (existingTrans) {
      console.log(`[Seed] Course already exists: ${cData.translations[0]!.slug}`);
      continue;
    }

    const [newCourse] = await db
      .insert(schema.courses)
      .values({
        instructorId: cData.instructorId,
        categoryId: cData.categoryId,
        status: cData.status,
        level: cData.level,
        priceCents: cData.priceCents,
        currency: cData.currency,
        primaryLocale: cData.primaryLocale,
        ratingAvg: '4.95',
        ratingCount: 142,
        publishedAt: new Date(),
      })
      .returning();

    for (const t of cData.translations) {
      const searchText =
        t.locale === 'ar'
          ? normalizeArabic(`${t.title} ${t.subtitle} ${t.description}`)
          : `${t.title} ${t.subtitle} ${t.description}`.toLowerCase();

      await db.insert(schema.courseTranslations).values({
        courseId: newCourse!.id,
        locale: t.locale,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        slug: t.slug,
        searchText,
      });
    }

    for (let sIdx = 0; sIdx < cData.sections.length; sIdx++) {
      const sec = cData.sections[sIdx]!;
      const [newSec] = await db
        .insert(schema.sections)
        .values({
          courseId: newCourse!.id,
          position: sIdx,
          title: sec.title,
        })
        .returning();

      for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
        const les = sec.lessons[lIdx]!;
        await db.insert(schema.lessons).values({
          sectionId: newSec!.id,
          position: lIdx,
          type: les.type,
          title: les.title,
          isFreePreview: les.isFreePreview,
          durationSec: les.durationSec,
        });
      }
    }

    console.log(`[Seed] Seeded course with curriculum: ${cData.translations[0]!.title}`);
  }

  console.log('[Seed] Database seeding completed successfully! ✨');
}

main()
  .catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });

