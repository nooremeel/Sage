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
  console.log('[Seed] Starting idempotent database seed for production presentation...');

  // 1. Password Hash
  const defaultPassword = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
  });

  // 2. Users
  const seedUsers = [
    { email: 'admin@sage.local', role: 'admin' as const, locale: 'en' as const },
    { email: 'nour@sage.local', role: 'instructor' as const, locale: 'ar' as const },
    { email: 'sarah@sage.local', role: 'instructor' as const, locale: 'en' as const },
    { email: 'tariq@sage.local', role: 'instructor' as const, locale: 'ar' as const },
    { email: 'student@sage.local', role: 'student' as const, locale: 'ar' as const },
    { email: 'layla@sage.local', role: 'student' as const, locale: 'ar' as const },
    { email: 'omar@sage.local', role: 'student' as const, locale: 'en' as const },
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
    }

    if (existing) {
      userMap.set(u.email, existing.id);
    }
  }

  // 3. Categories
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
    }

    if (existingCat) {
      categoryMap.set(cat.slug, existingCat.id);
    }
  }

  // 4. Scholarly Courses
  const instructorNour = userMap.get('nour@sage.local')!;
  const instructorSarah = userMap.get('sarah@sage.local')!;
  const instructorTariq = userMap.get('tariq@sage.local')!;

  const catEng = categoryMap.get('software-engineering')!;
  const catArts = categoryMap.get('islamic-arts')!;
  const catBiz = categoryMap.get('business-leadership')!;

  const coursesData = [
    {
      categoryId: catEng,
      instructorId: instructorNour,
      status: 'published' as const,
      level: 'advanced' as const,
      priceCents: 4900,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      ratingAvg: '4.95',
      ratingCount: 142,
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
            {
              title: { ar: 'اختبار تقييم المعمارية السحابية', en: 'Cloud Architecture Assessment' },
              type: 'quiz' as const,
              isFreePreview: false,
              durationSec: 300,
            },
          ],
        },
      ],
    },
    {
      categoryId: catArts,
      instructorId: instructorTariq,
      status: 'published' as const,
      level: 'beginner' as const,
      priceCents: 0,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      ratingAvg: '4.98',
      ratingCount: 310,
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
            {
              title: { ar: 'اختبار أصول ومقاييس الحروف', en: 'Calligraphy Fundamentals Quiz' },
              type: 'quiz' as const,
              isFreePreview: false,
              durationSec: 300,
            },
          ],
        },
      ],
    },
    {
      categoryId: catEng,
      instructorId: instructorNour,
      status: 'published' as const,
      level: 'intermediate' as const,
      priceCents: 7900,
      currency: 'USD',
      primaryLocale: 'en' as const,
      ratingAvg: '4.92',
      ratingCount: 88,
      translations: [
        {
          locale: 'en' as const,
          title: 'High-Concurrency PostgreSQL & Connection Pooling',
          subtitle: 'Serverless scaling, Neon pooling, and transactional indexing',
          description: 'Master PostgreSQL internals for high-throughput platforms. Learn connection pooling, GIN and GiST indexing, keyset pagination, and dead-lock prevention.',
          slug: 'high-concurrency-postgres',
        },
        {
          locale: 'ar' as const,
          title: 'قواعد بيانات بوستجرس عالية التزامن وإدارة الاتصالات',
          subtitle: 'التوسع في البيئات السحابية وإدارة الاتصالات والفهارس المتقدمة',
          description: 'دورة تطبيقية في تحسين أداء PostgreSQL للأنظمة ذات الأحمال العالية، التخزين المؤقت، وهيكلة الاستعلامات المعقدة.',
          slug: 'high-concurrency-postgres-ar',
        },
      ],
      sections: [
        {
          title: { en: 'Module 1: Connection Architecture', ar: 'الفصل الأول: معمارية الاتصالات' },
          lessons: [
            {
              title: { en: 'Serverless Pooling & Neon Connection Limits', ar: 'تجميع الاتصالات في البيئات السحابية' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 480,
            },
          ],
        },
      ],
    },
    {
      categoryId: catArts,
      instructorId: instructorTariq,
      status: 'published' as const,
      level: 'intermediate' as const,
      priceCents: 3500,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      ratingAvg: '4.97',
      ratingCount: 95,
      translations: [
        {
          locale: 'ar' as const,
          title: 'خط الديواني الجلي: رشاقة الحركة وانسيابية التركيب',
          subtitle: 'قواعد الزخرفة النقطية والتشكيلات الديوانية السلطانية',
          description: 'دراسة تخصصية لخط الديواني والديواني الجلي، أسرار التداخل الحروفي، والزخرفة النقطية الكلاسيكية المتبعة في الفرمانات والوثائق التاريخية.',
          slug: 'diwani-jali-masterclass-ar',
        },
        {
          locale: 'en' as const,
          title: 'Jali Diwani Masterclass: Fluidity and Royal Compositions',
          subtitle: 'The courtly script of ornamental dots and interlaced compositions',
          description: 'A dedicated masterclass on Jali Diwani calligraphy, exploring letter intersections, floral dot flourishes, and ceremonial scroll design.',
          slug: 'diwani-jali-masterclass',
        },
      ],
      sections: [
        {
          title: { ar: 'الفصل الأول: ميزان الديواني الجلي', en: 'Module 1: Diwani Proportions' },
          lessons: [
            {
              title: { ar: 'الانسياب والمد والزخرفة النقطية', en: 'Curvature and Dot Embellishment' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 600,
            },
          ],
        },
      ],
    },
    {
      categoryId: catBiz,
      instructorId: instructorSarah,
      status: 'published' as const,
      level: 'intermediate' as const,
      priceCents: 5900,
      currency: 'USD',
      primaryLocale: 'en' as const,
      ratingAvg: '4.89',
      ratingCount: 114,
      translations: [
        {
          locale: 'en' as const,
          title: 'Digital Product Strategy & Unit Economics',
          subtitle: 'From scholarly insight to profitable, resilient software businesses',
          description: 'A disciplined framework for discovering validated customer demand, structuring sustainable monetization models, and measuring retention velocity.',
          slug: 'product-strategy-bootcamp',
        },
        {
          locale: 'ar' as const,
          title: 'استراتيجيات المنتجات الرقمية واقتصاديات الوحدة',
          subtitle: 'من الرؤية الأكاديمية إلى بناء شركات ومنتجات رقمية مستدامة',
          description: 'منهجية متكاملة في بناء نماذج التسعير، استكشاف متطلبات السوق، وتحليل مؤشرات النمو والاحتفاظ بالعملاء.',
          slug: 'product-strategy-bootcamp-ar',
        },
      ],
      sections: [
        {
          title: { en: 'Module 1: Value Hypotheses', ar: 'الفصل الأول: فرضيات القيمة' },
          lessons: [
            {
              title: { en: 'Pricing Structures and SaaS Unit Economics', ar: 'نماذج التسعير واقتصاديات الاشتراكات' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 510,
            },
          ],
        },
      ],
    },
    {
      categoryId: catArts,
      instructorId: instructorTariq,
      status: 'published' as const,
      level: 'advanced' as const,
      priceCents: 8900,
      currency: 'USD',
      primaryLocale: 'ar' as const,
      ratingAvg: '5.00',
      ratingCount: 62,
      translations: [
        {
          locale: 'ar' as const,
          title: 'فن التذهيب الإسلامي وتوريق الذهب في المخطوطات',
          subtitle: 'إعداد رقائق الذهب عيار 24، الألوان الطبيعية، وزخرفة الشرافات',
          description: 'دراسة تراثية معمقة في فن التذهيب الكلاسيكي، تحضير ورق المخطوطات المقهر، لصق وتلميع رقائق الذهب الحقيقي بالعقيق، وصياغة الزخارف النباتية والهندسية.',
          slug: 'islamic-illumination-ar',
        },
        {
          locale: 'en' as const,
          title: 'Classical Manuscript Illumination & Gold Leafing',
          subtitle: '24K gold preparation, natural pigments, and arabesque borders',
          description: 'An authoritative study in traditional illumination, sized paper preparation, 24K gold shell application, agate stone burnishing, and intricate floral border drafting.',
          slug: 'islamic-illumination',
        },
      ],
      sections: [
        {
          title: { ar: 'الفصل الأول: إعداد الذهب والأصباغ', en: 'Module 1: Gold Preparation' },
          lessons: [
            {
              title: { ar: 'طحن رقائق الذهب والتلميع بحجر العقيق', en: 'Grinding Gold and Agate Burnishing' },
              type: 'video' as const,
              isFreePreview: true,
              durationSec: 780,
            },
          ],
        },
      ],
    },
  ];

  const courseMap = new Map<string, string>();
  const lessonQuizMap = new Map<string, string>();

  for (const cData of coursesData) {
    let existingTrans = await db.query.courseTranslations.findFirst({
      where: eq(schema.courseTranslations.slug, cData.translations[0]!.slug),
    });

    let courseId: string;

    if (!existingTrans) {
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
          ratingAvg: cData.ratingAvg,
          ratingCount: cData.ratingCount,
          publishedAt: new Date(),
        })
        .returning();

      courseId = newCourse!.id;

      for (const t of cData.translations) {
        const searchText =
          t.locale === 'ar'
            ? normalizeArabic(`${t.title} ${t.subtitle} ${t.description}`)
            : `${t.title} ${t.subtitle} ${t.description}`.toLowerCase();

        await db.insert(schema.courseTranslations).values({
          courseId,
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
            courseId,
            position: sIdx,
            title: sec.title,
          })
          .returning();

        for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
          const les = sec.lessons[lIdx]!;
          const [newLes] = await db
            .insert(schema.lessons)
            .values({
              sectionId: newSec!.id,
              position: lIdx,
              type: les.type,
              title: les.title,
              isFreePreview: les.isFreePreview,
              durationSec: les.durationSec,
            })
            .returning();

          if (les.type === 'quiz') {
            lessonQuizMap.set(newLes!.id, cData.translations[0]!.slug);
          }
        }
      }

      console.log(`[Seed] Seeded course: ${cData.translations[0]!.title}`);
    } else {
      courseId = existingTrans.courseId;
    }

    courseMap.set(cData.translations[0]!.slug, courseId);
  }

  // 5. Seed Quizzes & Questions
  for (const [lessonId, slug] of lessonQuizMap.entries()) {
    const existingQuiz = await db.query.quizzes.findFirst({
      where: eq(schema.quizzes.lessonId, lessonId),
    });

    if (!existingQuiz) {
      const [quiz] = await db
        .insert(schema.quizzes)
        .values({
          lessonId,
          title: {
            ar: 'اختبار تقييم المفاهيم الأكاديمية',
            en: 'Scholarly Concepts Assessment',
          },
          passingScore: 80,
          maxAttempts: 3,
        })
        .returning();

      const [q1] = await db
        .insert(schema.questions)
        .values({
          quizId: quiz!.id,
          position: 0,
          type: 'single_choice',
          prompt: {
            ar: 'ما هي الوحدة الأساسية المعتمدة لضبط نسب حروف الخط العربي الكلاسيكي؟',
            en: 'What is the fundamental unit of measure for classical Arabic calligraphy proportions?',
          },
        })
        .returning();

      await db.insert(schema.options).values([
        { questionId: q1!.id, position: 0, text: { ar: 'ميزان النقطة المعينة بسن القلم', en: 'The rhombic dot of the pen nib' }, isCorrect: true },
        { questionId: q1!.id, position: 1, text: { ar: 'المليمتر الموحد', en: 'Standard millimeter' }, isCorrect: false },
        { questionId: q1!.id, position: 2, text: { ar: 'عرض خط القاعدة', en: 'Baseline width' }, isCorrect: false },
      ]);

      const [q2] = await db
        .insert(schema.questions)
        .values({
          quizId: quiz!.id,
          position: 1,
          type: 'single_choice',
          prompt: {
            ar: 'أي نمط تخزين مؤقت يضمن عدم تحميل قاعدة البيانات ويحمي من انهيار الخوادم عند انتهاء الصلاحية؟',
            en: 'Which caching strategy prevents database stampedes and cache collapse on expiry?',
          },
        })
        .returning();

      await db.insert(schema.options).values([
        { questionId: q2!.id, position: 0, text: { ar: 'نمط Cache-Aside مع القفل المؤقت والتحديث المسبق', en: 'Cache-Aside with mutex lock and background revalidation' }, isCorrect: true },
        { questionId: q2!.id, position: 1, text: { ar: 'الاستعلام المباشر الدائم', en: 'Permanent direct querying' }, isCorrect: false },
        { questionId: q2!.id, position: 2, text: { ar: 'التخزين المؤقت المحلي فقط', en: 'Process memory cache only' }, isCorrect: false },
      ]);

      console.log(`[Seed] Seeded quiz for lesson in ${slug}`);
    }
  }

  // 6. Active Promotional Coupons
  const couponsToSeed = [
    { code: 'SAGE100', discountType: 'percentage' as const, discountValue: 100, maxRedemptions: 500 },
    { code: 'SCHOLAR50', discountType: 'percentage' as const, discountValue: 50, maxRedemptions: 200 },
    { code: 'WELCOME20', discountType: 'fixed' as const, discountValue: 2000, maxRedemptions: 100 },
  ];

  for (const c of couponsToSeed) {
    const existing = await db.query.coupons.findFirst({
      where: eq(schema.coupons.code, c.code),
    });

    if (!existing) {
      await db.insert(schema.coupons).values({
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        maxRedemptions: c.maxRedemptions,
      });
      console.log(`[Seed] Created coupon: ${c.code}`);
    }
  }

  // 7. Authentic Scholarly Course Reviews
  const thuluthCourseId = courseMap.get('thuluth-calligraphy-ar');
  const studentId = userMap.get('student@sage.local')!;
  const laylaId = userMap.get('layla@sage.local')!;
  const omarId = userMap.get('omar@sage.local')!;

  if (thuluthCourseId) {
    const reviewsData = [
      {
        userId: laylaId,
        courseId: thuluthCourseId,
        rating: 5,
        comment: 'دورة فريدة واستثنائية؛ الشرح دقيق للغاية في ميزان النقطة وتشريح الحروف. أنصح بها كل طالب علم شغوف بالخط العربي الأصيل.',
      },
      {
        userId: omarId,
        courseId: thuluthCourseId,
        rating: 5,
        comment: 'Remarkable pedagogical depth and classical discipline. The lessons on reed pen cutting and carbon soot ink gave me the precision I lacked for years.',
      },
      {
        userId: studentId,
        courseId: thuluthCourseId,
        rating: 5,
        comment: 'من أفضل المناهج التعليمية؛ تجربة البث واضحة جداً وتصميم المنصة الأكاديمي يبعث على الراحة والتركيز التام.',
      },
    ];

    for (const r of reviewsData) {
      const existing = await db.query.reviews.findFirst({
        where: eq(schema.reviews.userId, r.userId),
      });

      if (!existing) {
        await db.insert(schema.reviews).values(r);
        console.log(`[Seed] Added review for course ${r.courseId}`);
      }
    }
  }

  // 8. Q&A Discussions with Instructor Verified Badges
  if (thuluthCourseId) {
    const firstLesson = await db.query.lessons.findFirst();
    if (firstLesson) {
      const existingThread = await db.query.qaThreads.findFirst({
        where: eq(schema.qaThreads.lessonId, firstLesson.id),
      });

      if (!existingThread) {
        const [thread] = await db
          .insert(schema.qaThreads)
          .values({
            lessonId: firstLesson.id,
            authorId: laylaId,
            title: 'استفسار حول زاوية قط القصبة في خط الثلث',
            content: 'السلام عليكم أستاذنا الفاضل، هل تختلف زاوية قط القصبة لخط الثلث الجلي عن الثلث العادي؟',
          })
          .returning();

        // First student message
        await db.insert(schema.qaMessages).values({
          threadId: thread!.id,
          authorId: laylaId,
          content: 'السلام عليكم أستاذنا الفاضل، هل تختلف زاوية قط القصبة لخط الثلث الجلي عن الثلث العادي؟',
          isInstructorAnswer: false,
        });

        // Instructor answer
        await db.insert(schema.qaMessages).values({
          threadId: thread!.id,
          authorId: instructorTariq,
          content: 'وعليكم السلام ورحمة الله، نعم يا ليلى، زاوية قط القصبة في الثلث الجلي تكون أقل ميلاً (حوالي 70 درجة) لإعطاء متانة وحشوة للحرف، بينما في الثلث العادي تكون بحدود 75 إلى 80 درجة.',
          isInstructorAnswer: true,
        });

        console.log('[Seed] Created Q&A thread with instructor verified answer');
      }
    }
  }

  // 9. Sample Enrollment & Verifiable Certificate for student@sage.local
  if (thuluthCourseId) {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: eq(schema.enrollments.userId, studentId),
    });

    if (!existingEnrollment) {
      await db.insert(schema.enrollments).values({
        userId: studentId,
        courseId: thuluthCourseId,
        source: 'free',
      });
      console.log('[Seed] Enrolled student@sage.local in Thuluth Calligraphy');
    }

    const sampleSerial = 'SAGE-2026-ALPHA1';
    const existingCert = await db.query.certificates.findFirst({
      where: eq(schema.certificates.serial, sampleSerial),
    });

    if (!existingCert) {
      await db.insert(schema.certificates).values({
        serial: sampleSerial,
        userId: studentId,
        courseId: thuluthCourseId,
      });
      console.log(`[Seed] Created sample certificate: ${sampleSerial}`);
    }
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
