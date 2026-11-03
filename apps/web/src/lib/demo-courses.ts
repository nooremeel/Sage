import type {
  CourseDto,
  LessonDto,
  SectionDto,
  PublicQuizDto,
  QuizAttemptResultDto,
  CourseLevel,
  LessonType,
  AuthUserDto,
  UserRole,
} from '@sage/shared';

export const DEMO_STREAM_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const defaultDate = '2026-10-01T10:00:00Z';

export const DEMO_COURSES: CourseDto[] = [
  {
    id: 'course-arch-001',
    instructorId: 'usr-nour-001',
    instructorName: 'Nour Emil (نور إميل)',
    categoryId: 'cat-eng-001',
    categoryName: 'Software Engineering',
    status: 'published',
    level: 'advanced',
    priceCents: 4900,
    currency: 'USD',
    primaryLocale: 'ar',
    ratingAvg: 4.95,
    ratingCount: 142,
    publishedAt: defaultDate,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'ar',
        title: 'معمارية الويب الحديثة والأنظمة الموزعة',
        subtitle: 'بناء منصات سحابية عالية الأداء وقابلة للتوسع بأحدث التقنيات',
        description: 'دورة شاملة تغطي معمارية الخوادم السحابية، التخزين المؤقت عبر Redis، وقواعد البيانات الموزعة مع أمثلة واقعية ومشاريع متقدمة.',
        slug: 'modern-web-architecture-ar',
      },
      {
        locale: 'en',
        title: 'Modern Web Architecture & Distributed Systems',
        subtitle: 'Building resilient, high-performance cloud platforms',
        description: 'An advanced curriculum covering serverless patterns, Redis caching strategies, relational data modeling, and media delivery pipelines.',
        slug: 'modern-web-architecture',
      },
    ],
    sections: [
      {
        id: 'sec-arch-01',
        courseId: 'course-arch-001',
        position: 0,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الأول: أسس الأنظمة الموزعة',
          en: 'Module 1: Distributed Foundations',
        },
        lessons: [
          {
            id: 'les-arch-01-vid',
            sectionId: 'sec-arch-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'نظرة عامة على المعمارية السحابية والأنظمة المستقلة',
              en: 'Cloud Architecture Overview & Decoupled Systems',
            },
            isFreePreview: true,
            durationSec: 420,
          },
          {
            id: 'les-arch-02-art',
            sectionId: 'sec-arch-01',
            position: 1,
            type: 'article',
            createdAt: defaultDate,
            title: {
              ar: 'استراتيجيات التخزين المؤقت وحماية قواعد البيانات',
              en: 'Cache-Aside Strategies & Stampede Protection',
            },
            isFreePreview: false,
            durationSec: 600,
          },
        ],
      },
      {
        id: 'sec-arch-02',
        courseId: 'course-arch-001',
        position: 1,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الثاني: خطوط معالجة الوسائط المتعددة',
          en: 'Module 2: Media Pipelines & Streaming',
        },
        lessons: [
          {
            id: 'les-arch-03-vid',
            sectionId: 'sec-arch-02',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'بروتوكول HLS وتقطيع الفيديو المتكيف (360p إلى 1080p)',
              en: 'Adaptive HLS & Segment Streaming (360p to 1080p)',
            },
            isFreePreview: false,
            durationSec: 850,
          },
          {
            id: 'les-arch-04-quiz',
            sectionId: 'sec-arch-02',
            position: 1,
            type: 'quiz',
            createdAt: defaultDate,
            title: {
              ar: 'اختبار تقييم المعمارية السحابية والأنظمة الموزعة',
              en: 'Cloud Architecture & Distributed Systems Assessment',
            },
            isFreePreview: false,
            durationSec: 300,
          },
        ],
      },
    ],
  },
  {
    id: 'course-thuluth-002',
    instructorId: 'usr-tariq-002',
    instructorName: 'Tariq Al-Baghdadi (طارق البغدادي)',
    categoryId: 'cat-arts-002',
    categoryName: 'Classical Arts & Calligraphy',
    status: 'published',
    level: 'beginner',
    priceCents: 0,
    currency: 'USD',
    primaryLocale: 'ar',
    ratingAvg: 4.98,
    ratingCount: 310,
    publishedAt: defaultDate,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'ar',
        title: 'أسرار الخط العربي: هندسة خط الثلث الكلاسيكي',
        subtitle: 'دراسة تطبيقية لقواعد الميزان ونسب الحروف بالقلم والقصبة',
        description: 'رحلة أكاديمية عملية لاستكشاف أصول خط الثلث، إعداد قصبة الخط، حبر السناج، وتطبيق الحروف المفردة والمركبة بحسب المدارس العثمانية والبغدادية.',
        slug: 'thuluth-calligraphy-ar',
      },
      {
        locale: 'en',
        title: 'Classical Arabic Calligraphy: The Geometry of Thuluth',
        subtitle: 'A practical study of proportions, reed pens, and ink drafting',
        description: 'Explore the traditional discipline of Thuluth script, reed trimming, soot ink preparation, and geometric letterforms according to master traditions.',
        slug: 'thuluth-calligraphy',
      },
    ],
    sections: [
      {
        id: 'sec-thuluth-01',
        courseId: 'course-thuluth-002',
        position: 0,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الأول: إعداد القصبة وحبر السناج',
          en: 'Module 1: Reed & Soot Ink Preparation',
        },
        lessons: [
          {
            id: 'les-thuluth-01-vid',
            sectionId: 'sec-thuluth-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'قط القصبة وإعداد حبر السناج الكربوني',
              en: 'Reed Trimming & Carbon Soot Ink Preparation',
            },
            isFreePreview: true,
            durationSec: 600,
          },
          {
            id: 'les-thuluth-02-art',
            sectionId: 'sec-thuluth-01',
            position: 1,
            type: 'article',
            createdAt: defaultDate,
            title: {
              ar: 'هندسة ميزان النقطة المعينة بسن القلم',
              en: 'The Geometry of the Rhombic Dot Unit',
            },
            isFreePreview: false,
            durationSec: 480,
          },
        ],
      },
      {
        id: 'sec-thuluth-02',
        courseId: 'course-thuluth-002',
        position: 1,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الثاني: تشريح الحروف المفردة',
          en: 'Module 2: Anatomy of Isolated Letterforms',
        },
        lessons: [
          {
            id: 'les-thuluth-03-vid',
            sectionId: 'sec-thuluth-02',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'تشريح وضبط نسب حرفي الألف واللام الميزانية',
              en: 'Anatomy and Proportions of Alif and Lam',
            },
            isFreePreview: false,
            durationSec: 720,
          },
          {
            id: 'les-thuluth-04-quiz',
            sectionId: 'sec-thuluth-02',
            position: 1,
            type: 'quiz',
            createdAt: defaultDate,
            title: {
              ar: 'اختبار تقييم المفاهيم الأكاديمية وميزان الحروف',
              en: 'Scholarly Concepts Assessment & Letter Proportions',
            },
            isFreePreview: false,
            durationSec: 300,
          },
        ],
      },
    ],
  },
  {
    id: 'course-strategy-003',
    instructorId: 'usr-sarah-003',
    instructorName: 'Sarah Jenkins (سارة جنكينز)',
    categoryId: 'cat-biz-003',
    categoryName: 'Business & Leadership',
    status: 'published',
    level: 'intermediate',
    priceCents: 5900,
    currency: 'USD',
    primaryLocale: 'en',
    ratingAvg: 4.89,
    ratingCount: 114,
    publishedAt: defaultDate,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'en',
        title: 'Digital Product Strategy & Unit Economics',
        subtitle: 'From scholarly insight to profitable, resilient software businesses',
        description: 'A disciplined framework for discovering validated customer demand, structuring sustainable monetization models, and measuring retention velocity.',
        slug: 'product-strategy-bootcamp',
      },
      {
        locale: 'ar',
        title: 'استراتيجيات المنتجات الرقمية واقتصاديات الوحدة',
        subtitle: 'من الرؤية الأكاديمية إلى بناء شركات ومنتجات رقمية مستدامة',
        description: 'منهجية متكاملة في بناء نماذج التسعير، استكشاف متطلبات السوق، وتحليل مؤشرات النمو والاحتفاظ بالعملاء.',
        slug: 'product-strategy-bootcamp-ar',
      },
    ],
    sections: [
      {
        id: 'sec-strat-01',
        courseId: 'course-strategy-003',
        position: 0,
        createdAt: defaultDate,
        title: {
          en: 'Module 1: Value Hypotheses & Economics',
          ar: 'الفصل الأول: فرضيات القيمة واقتصاديات الوحدة',
        },
        lessons: [
          {
            id: 'les-strat-01-vid',
            sectionId: 'sec-strat-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              en: 'Pricing Structures and SaaS Unit Economics',
              ar: 'نماذج التسعير واقتصاديات الاشتراكات البرمجية',
            },
            isFreePreview: true,
            durationSec: 510,
          },
        ],
      },
    ],
  },
  {
    id: 'course-illum-004',
    instructorId: 'usr-tariq-002',
    instructorName: 'Tariq Al-Baghdadi (طارق البغدادي)',
    categoryId: 'cat-arts-002',
    categoryName: 'Classical Arts & Calligraphy',
    status: 'published',
    level: 'advanced',
    priceCents: 8900,
    currency: 'USD',
    primaryLocale: 'ar',
    ratingAvg: 5.0,
    ratingCount: 62,
    publishedAt: defaultDate,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'ar',
        title: 'فن التذهيب الإسلامي وتوريق الذهب في المخطوطات',
        subtitle: 'إعداد رقائق الذهب عيار 24، الألوان الطبيعية، وزخرفة الشرافات',
        description: 'دراسة تراثية معمقة في فن التذهيب الكلاسيكي، تحضير ورق المخطوطات المقهر، لصق وتلميع رقائق الذهب الحقيقي بالعقيق، وصياغة الزخارف النباتية والهندسية.',
        slug: 'islamic-illumination-ar',
      },
      {
        locale: 'en',
        title: 'Classical Manuscript Illumination & Gold Leafing',
        subtitle: '24K gold preparation, natural pigments, and arabesque borders',
        description: 'An authoritative study in traditional illumination, sized paper preparation, 24K gold shell application, agate stone burnishing, and intricate floral border drafting.',
        slug: 'islamic-illumination',
      },
    ],
    sections: [
      {
        id: 'sec-illum-01',
        courseId: 'course-illum-004',
        position: 0,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الأول: إعداد الذهب والأصباغ',
          en: 'Module 1: Gold Preparation & Natural Pigments',
        },
        lessons: [
          {
            id: 'les-illum-01-vid',
            sectionId: 'sec-illum-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'طحن رقائق الذهب والتلميع بحجر العقيق',
              en: 'Grinding Gold and Agate Burnishing',
            },
            isFreePreview: true,
            durationSec: 780,
          },
        ],
      },
    ],
  },
  {
    id: 'course-dist-005',
    instructorId: 'usr-nour-001',
    instructorName: 'Nour Emil (نور إميل)',
    categoryId: 'cat-eng-001',
    categoryName: 'Software Engineering',
    status: 'in_review',
    level: 'advanced',
    priceCents: 6500,
    currency: 'USD',
    primaryLocale: 'ar',
    ratingAvg: 0,
    ratingCount: 0,
    publishedAt: null,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'ar',
        title: 'قواعد البيانات الموزعة ونظم التوسع السحابي',
        subtitle: 'تصميم نظم تخزين مرنة تتحمل الإخفاقات باستخدام PostgreSQL و Neon',
        description: 'دورة هندسية متقدمة في تجزئة البيانات (Sharding)، التكرار متعدد المناطق (Multi-Region Replication)، ومطابقة حمولة المعاملات تحت ضغط شديد.',
        slug: 'distributed-databases-ar',
      },
      {
        locale: 'en',
        title: 'Distributed Databases & Cloud Scale Systems',
        subtitle: 'Architecting resilient, fault-tolerant storage using PostgreSQL and Neon',
        description: 'An advanced engineering deep-dive into database sharding, multi-region replication, and ACID transaction semantics under extreme scale.',
        slug: 'distributed-databases',
      },
    ],
    sections: [
      {
        id: 'sec-dist-01',
        courseId: 'course-dist-005',
        position: 0,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الأول: أسس التكرار والتوافق',
          en: 'Module 1: Replication & Consensus Foundations',
        },
        lessons: [
          {
            id: 'les-dist-01-vid',
            sectionId: 'sec-dist-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'بروتوكولات التوافق الموزع: Raft و Paxos',
              en: 'Distributed Consensus: Raft & Paxos Protocols',
            },
            isFreePreview: true,
            durationSec: 540,
          },
          {
            id: 'les-dist-02-art',
            sectionId: 'sec-dist-01',
            position: 1,
            type: 'article',
            createdAt: defaultDate,
            title: {
              ar: 'مستويات العزل في المعاملات ومفارقات التزامن',
              en: 'Transaction Isolation Levels & Concurrency Anomalies',
            },
            isFreePreview: false,
            durationSec: 420,
          },
        ],
      },
    ],
  },
  {
    id: 'course-rust-006',
    instructorId: 'usr-nour-001',
    instructorName: 'Nour Emil (نور إميل)',
    categoryId: 'cat-eng-001',
    categoryName: 'Software Engineering',
    status: 'draft',
    level: 'intermediate',
    priceCents: 3900,
    currency: 'USD',
    primaryLocale: 'en',
    ratingAvg: 0,
    ratingCount: 0,
    publishedAt: null,
    createdAt: defaultDate,
    translations: [
      {
        locale: 'ar',
        title: 'برمجة النظم السحابية بلغة ريست (Rust)',
        subtitle: 'أمان الذاكرة وبناء خوادم الويب عالية الإنتاجية',
        description: 'تعلم البرمجة غير المتزامنة عبر Tokio، إدارة ملكية الذاكرة دون جامع مهملات (Borrow Checker)، وبناء خدمات API فائقة السرعة.',
        slug: 'rust-cloud-systems-ar',
      },
      {
        locale: 'en',
        title: 'Cloud Systems Programming with Rust',
        subtitle: 'Memory safety, Tokio async runtimes, and high-throughput web microservices',
        description: 'Master systems programming with Rust: ownership, lifetimes, Tokio asynchronous I/O, and zero-allocation high-performance web services.',
        slug: 'rust-cloud-systems',
      },
    ],
    sections: [
      {
        id: 'sec-rust-01',
        courseId: 'course-rust-006',
        position: 0,
        createdAt: defaultDate,
        title: {
          ar: 'الفصل الأول: نموذج الملكية وتدقيق الاستعارة',
          en: 'Module 1: Ownership & The Borrow Checker',
        },
        lessons: [
          {
            id: 'les-rust-01-vid',
            sectionId: 'sec-rust-01',
            position: 0,
            type: 'video',
            createdAt: defaultDate,
            title: {
              ar: 'مقدمة في الملكية وأمان الذاكرة دون مجمع قمامة',
              en: 'Zero-Cost Abstractions & Memory Safety Without GC',
            },
            isFreePreview: true,
            durationSec: 620,
          },
        ],
      },
    ],
  },
];

export function getDemoCourseBySlug(slug: string): CourseDto | undefined {
  return DEMO_COURSES.find((course) =>
    course.translations.some((t) => t.slug === slug)
  );
}

export function getDemoCourses(params?: {
  categorySlug?: string;
  level?: string;
  price?: string;
  query?: string;
}): CourseDto[] {
  let list = [...DEMO_COURSES];

  if (params?.categorySlug) {
    const slug = params.categorySlug;
    list = list.filter((c) => {
      if (slug === 'software-engineering') return c.categoryId === 'cat-eng-001';
      if (slug === 'islamic-arts') return c.categoryId === 'cat-arts-002';
      if (slug === 'business-leadership') return c.categoryId === 'cat-biz-003';
      return false;
    });
  }

  if (params?.level) {
    list = list.filter((c) => c.level === params.level);
  }

  if (params?.price === 'free') {
    list = list.filter((c) => c.priceCents === 0);
  } else if (params?.price === 'paid') {
    list = list.filter((c) => c.priceCents > 0);
  }

  if (params?.query) {
    const q = params.query.toLowerCase().trim();
    list = list.filter((c) =>
      c.translations.some(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subtitle?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    );
  }

  return list;
}

export function getDemoInstructorCourses(instructorId = 'usr-nour-001'): CourseDto[] {
  return DEMO_COURSES.filter((c) => c.instructorId === instructorId);
}

export function getDemoInstructorKPIs(instructorId = 'usr-nour-001') {
  const authored = DEMO_COURSES.filter((c) => c.instructorId === instructorId);
  const totalCourses = authored.length;
  const publishedCount = authored.filter((c) => c.status === 'published').length;

  return {
    totalStudents: 456,
    completionRate: 78.4,
    avgRating: 4.95,
    ratingCount: 142,
    netRevenueUSD: 14820,
    totalCourses,
    publishedCount,
  };
}

export function submitDemoCourseForReview(courseId: string): CourseDto | undefined {
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (course) {
    course.status = 'in_review';
  }
  return course;
}

export function createDemoCourseDraft(params: {
  instructorId?: string;
  titleAr: string;
  titleEn: string;
  categoryId: string;
  categoryName?: string;
  level: CourseLevel;
  priceCents: number;
}): CourseDto {
  const id = `course-draft-${Date.now()}`;
  const slugEn = params.titleEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `draft-${Date.now()}`;
  const slugAr = `${slugEn}-ar`;

  const newCourse: CourseDto = {
    id,
    instructorId: params.instructorId || 'usr-nour-001',
    instructorName: 'Nour Emil (نور إميل)',
    categoryId: params.categoryId,
    categoryName: params.categoryName || 'Software Engineering',
    status: 'draft',
    level: params.level,
    priceCents: params.priceCents,
    currency: 'USD',
    primaryLocale: 'en',
    ratingAvg: 0,
    ratingCount: 0,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    translations: [
      {
        locale: 'ar',
        title: params.titleAr,
        subtitle: params.titleAr,
        description: params.titleAr,
        slug: slugAr,
      },
      {
        locale: 'en',
        title: params.titleEn,
        subtitle: params.titleEn,
        description: params.titleEn,
        slug: slugEn,
      },
    ],
    sections: [],
  };

  DEMO_COURSES.unshift(newCourse);
  return newCourse;
}

export function addDemoSection(
  courseId: string,
  title: { ar: string; en: string }
): SectionDto | undefined {
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course) return undefined;

  if (!course.sections) {
    course.sections = [];
  }

  const newSection: SectionDto = {
    id: `sec-${Date.now()}`,
    courseId,
    position: course.sections.length,
    title,
    lessons: [],
    createdAt: new Date().toISOString(),
  };

  course.sections.push(newSection);
  return newSection;
}

export function addDemoLesson(
  sectionId: string,
  data: {
    title: { ar: string; en: string };
    type: LessonType;
    isFreePreview: boolean;
    durationSec: number;
  }
): LessonDto | undefined {
  for (const course of DEMO_COURSES) {
    const sec = course.sections?.find((s) => s.id === sectionId);
    if (sec) {
      if (!sec.lessons) sec.lessons = [];
      const newLesson: LessonDto = {
        id: `les-${Date.now()}`,
        sectionId,
        position: sec.lessons.length,
        type: data.type,
        title: data.title,
        isFreePreview: data.isFreePreview,
        durationSec: data.durationSec,
        createdAt: new Date().toISOString(),
      };
      sec.lessons.push(newLesson);
      return newLesson;
    }
  }
  return undefined;
}

export function reorderDemoSections(courseId: string, sectionIds: string[]): boolean {
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course?.sections) return false;

  const map = new Map(course.sections.map((s) => [s.id, s]));
  const reordered: SectionDto[] = [];

  sectionIds.forEach((id, index) => {
    const s = map.get(id);
    if (s) {
      s.position = index;
      reordered.push(s);
    }
  });

  course.sections = reordered;
  return true;
}

export function reorderDemoLessons(sectionId: string, lessonIds: string[]): boolean {
  for (const course of DEMO_COURSES) {
    const sec = course.sections?.find((s) => s.id === sectionId);
    if (sec?.lessons) {
      const map = new Map(sec.lessons.map((l) => [l.id, l]));
      const reordered: LessonDto[] = [];
      lessonIds.forEach((id, index) => {
        const l = map.get(id);
        if (l) {
          l.position = index;
          reordered.push(l);
        }
      });
      sec.lessons = reordered;
      return true;
    }
  }
  return false;
}

export function deleteDemoSection(courseId: string, sectionId: string): boolean {
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course?.sections) return false;
  course.sections = course.sections.filter((s) => s.id !== sectionId);
  course.sections.forEach((s, idx) => {
    s.position = idx;
  });
  return true;
}

export function deleteDemoLesson(sectionId: string, lessonId: string): boolean {
  for (const course of DEMO_COURSES) {
    const sec = course.sections?.find((s) => s.id === sectionId);
    if (sec?.lessons) {
      sec.lessons = sec.lessons.filter((l) => l.id !== lessonId);
      sec.lessons.forEach((l, idx) => {
        l.position = idx;
      });
      return true;
    }
  }
  return false;
}

export function getDemoLessonById(lessonId: string): {
  course: CourseDto;
  section: SectionDto;
  lesson: LessonDto;
} | undefined {
  for (const course of DEMO_COURSES) {
    const secs = course.sections;
    if (secs) {
      for (const section of secs) {
        const lesList = section.lessons;
        if (lesList) {
          for (const lesson of lesList) {
            if (lesson.id === lessonId) {
              return { course, section, lesson };
            }
          }
        }
      }
    }
  }
  return undefined;
}

// Internal question key with correct answers (anti-leakage: not serialized to public client)
interface InternalQuestionOption {
  id: string;
  position: number;
  text: Record<string, string>;
  isCorrect: boolean;
}

interface InternalQuestion {
  id: string;
  position: number;
  prompt: Record<string, string>;
  type: 'single_choice' | 'multiple_choice';
  options: InternalQuestionOption[];
}

interface InternalQuiz {
  id: string;
  lessonId: string;
  title: Record<string, string>;
  passingScore: number;
  maxAttempts: number | null;
  questions: InternalQuestion[];
}

export const DEMO_INTERNAL_QUIZZES: InternalQuiz[] = [
  {
    id: 'quiz-thuluth-01',
    lessonId: 'les-thuluth-04-quiz',
    title: {
      ar: 'اختبار تقييم المفاهيم الأكاديمية وميزان الحروف',
      en: 'Scholarly Concepts Assessment & Letter Proportions',
    },
    passingScore: 80,
    maxAttempts: 3,
    questions: [
      {
        id: 'q-th-1',
        position: 0,
        type: 'single_choice',
        prompt: {
          ar: 'ما هي الوحدة الأساسية المعتمدة لضبط نسب حروف الخط العربي الكلاسيكي؟',
          en: 'What is the fundamental unit of measure for classical Arabic calligraphy proportions?',
        },
        options: [
          {
            id: 'opt-th-1-1',
            position: 0,
            text: {
              ar: 'ميزان النقطة المعينة بسن القلم',
              en: 'The rhombic dot of the pen nib',
            },
            isCorrect: true,
          },
          {
            id: 'opt-th-1-2',
            position: 1,
            text: {
              ar: 'المليمتر الموحد',
              en: 'Standard millimeter',
            },
            isCorrect: false,
          },
          {
            id: 'opt-th-1-3',
            position: 2,
            text: {
              ar: 'عرض خط القاعدة الأفقي',
              en: 'Horizontal baseline width',
            },
            isCorrect: false,
          },
        ],
      },
      {
        id: 'q-th-2',
        position: 1,
        type: 'single_choice',
        prompt: {
          ar: 'ما هي زاوية قط القصبة المعتمدة تقليدياً لخط الثلث الجلي؟',
          en: 'Which reed cut angle is traditionally recommended for Jali Thuluth script?',
        },
        options: [
          {
            id: 'opt-th-2-1',
            position: 0,
            text: {
              ar: 'حوالي 70 درجة (أقل ميلاً لإعطاء متانة وحشوة للحرف)',
              en: 'Approximately 70 degrees (steeper for structural weight)',
            },
            isCorrect: true,
          },
          {
            id: 'opt-th-2-2',
            position: 1,
            text: {
              ar: '45 درجة مائلة',
              en: '45 degrees slant',
            },
            isCorrect: false,
          },
          {
            id: 'opt-th-2-3',
            position: 2,
            text: {
              ar: '90 درجة قائمة',
              en: '90 degrees perpendicular',
            },
            isCorrect: false,
          },
        ],
      },
      {
        id: 'q-th-3',
        position: 2,
        type: 'multiple_choice',
        prompt: {
          ar: 'أيٌّ من الآتي يُعد من المكونات التقليدية لصناعة حبر السناج الكربوني الأصيل؟ (اختر كل ما ينطبق)',
          en: 'Which of the following are traditional ingredients of authentic soot ink? (Select all)',
        },
        options: [
          {
            id: 'opt-th-3-1',
            position: 0,
            text: {
              ar: 'الصمغ العربي النقي (كمادة رابطة ومثبتة)',
              en: 'Pure Arabic gum (as an organic binder)',
            },
            isCorrect: true,
          },
          {
            id: 'opt-th-3-2',
            position: 1,
            text: {
              ar: 'سناج الزيت المحروق (كصبغة كربونية سوداء)',
              en: 'Lamp oil soot (as carbon black pigment)',
            },
            isCorrect: true,
          },
          {
            id: 'opt-th-3-3',
            position: 2,
            text: {
              ar: 'المثبتات الكيميائية الصناعية الحديثة',
              en: 'Synthetic chemical polymer varnishes',
            },
            isCorrect: false,
          },
        ],
      },
    ],
  },
  {
    id: 'quiz-arch-01',
    lessonId: 'les-arch-04-quiz',
    title: {
      ar: 'اختبار تقييم المعمارية السحابية والأنظمة الموزعة',
      en: 'Cloud Architecture & Distributed Systems Assessment',
    },
    passingScore: 80,
    maxAttempts: 3,
    questions: [
      {
        id: 'q-ar-1',
        position: 0,
        type: 'single_choice',
        prompt: {
          ar: 'أي نمط تخزين مؤقت يضمن عدم تحميل قاعدة البيانات ويحمي من انهيار الخوادم عند انتهاء الصلاحية؟',
          en: 'Which caching pattern avoids database stampedes upon TTL expiry?',
        },
        options: [
          {
            id: 'opt-ar-1-1',
            position: 0,
            text: {
              ar: 'نمط Cache-Aside مع القفل المؤقت والتحديث المسبق في الخلفية',
              en: 'Cache-Aside with mutex lock and background revalidation',
            },
            isCorrect: true,
          },
          {
            id: 'opt-ar-1-2',
            position: 1,
            text: {
              ar: 'الاستعلام المباشر الدائم لكل طلب دون تخزين',
              en: 'Permanent direct database query per request',
            },
            isCorrect: false,
          },
          {
            id: 'opt-ar-1-3',
            position: 2,
            text: {
              ar: 'التخزين المؤقت المحلي بذاكرة التطبيق فقط دون خادم مركزي',
              en: 'In-memory process cache only without central store',
            },
            isCorrect: false,
          },
        ],
      },
      {
        id: 'q-ar-2',
        position: 1,
        type: 'single_choice',
        prompt: {
          ar: 'ما هي الميزة الأساسية لبروتوكول البث المتكيف HLS مقارنة بالتحميل المباشر؟',
          en: 'What is the primary benefit of adaptive HLS streaming over progressive download?',
        },
        options: [
          {
            id: 'opt-ar-2-1',
            position: 0,
            text: {
              ar: 'التبديل التلقائي السلس بين الجودات بحسب سرعة اتصال المستخدم دون توقف المشغل',
              en: 'Dynamically switches resolutions (360p-1080p) based on real-time viewer bandwidth without buffering',
            },
            isCorrect: true,
          },
          {
            id: 'opt-ar-2-2',
            position: 1,
            text: {
              ar: 'إجبار كافة المستخدمين على تنزيل ملف 4K كاملاً',
              en: 'Forces all viewers to download the entire 4K video',
            },
            isCorrect: false,
          },
          {
            id: 'opt-ar-2-3',
            position: 2,
            text: {
              ar: 'إلغاء الحاجة لترميز الفيديو أو تقطيعه',
              en: 'Eliminates the need for video encoding or chunking',
            },
            isCorrect: false,
          },
        ],
      },
      {
        id: 'q-ar-3',
        position: 2,
        type: 'multiple_choice',
        prompt: {
          ar: 'ما هي أفضل الممارسات لحماية قواعد البيانات العلائقية من استنزاف اتصالات الدوال غير الخادمة (Serverless)؟ (اختر كل ما ينطبق)',
          en: 'Which practices safeguard relational databases from serverless connection exhaustion? (Select all)',
        },
        options: [
          {
            id: 'opt-ar-3-1',
            position: 0,
            text: {
              ar: 'استخدام خوادم تجميع الاتصالات (Connection Poolers مثل PgBouncer أو Neon Pooler)',
              en: 'Using connection poolers (such as PgBouncer or Neon pooler)',
            },
            isCorrect: true,
          },
          {
            id: 'opt-ar-3-2',
            position: 1,
            text: {
              ar: 'إعادة استخدام مثيل الاتصال عبر الطلبات الدافئة (Warm requests)',
              en: 'Reusing pooled connection instances across warm invocations',
            },
            isCorrect: true,
          },
          {
            id: 'opt-ar-3-3',
            position: 2,
            text: {
              ar: 'إنشاء اتصال TCP جديد ومباشر مع كل استدعاء دون تحديد حد أقصى',
              en: 'Opening unpooled direct TCP connections on every invocation',
            },
            isCorrect: false,
          },
        ],
      },
    ],
  },
];

// Returns client-safe PublicQuizDto (never leaks isCorrect flag)
export function getDemoQuizByLessonId(lessonId: string): PublicQuizDto | undefined {
  const quiz = DEMO_INTERNAL_QUIZZES.find((q) => q.lessonId === lessonId);
  if (!quiz) return undefined;

  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      position: q.position,
      prompt: q.prompt,
      type: q.type,
      options: q.options.map((opt) => ({
        id: opt.id,
        position: opt.position,
        text: opt.text,
      })),
    })),
  };
}

export function evaluateDemoQuizAttempt(
  quizId: string,
  answers: Record<string, string[]>,
  attemptNumber = 1
): QuizAttemptResultDto {
  const quiz = DEMO_INTERNAL_QUIZZES.find((q) => q.id === quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  let correctCount = 0;

  for (const question of quiz.questions) {
    const selectedOptionIds = answers[question.id] || [];
    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    if (question.type === 'single_choice') {
      if (
        selectedOptionIds.length === 1 &&
        correctOptionIds.includes(selectedOptionIds[0])
      ) {
        correctCount += 1;
      }
    } else {
      // multiple choice: must match exact correct set
      const allCorrectSelected =
        correctOptionIds.length === selectedOptionIds.length &&
        correctOptionIds.every((id) => selectedOptionIds.includes(id));
      if (allCorrectSelected) {
        correctCount += 1;
      }
    }
  }

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  return {
    id: `att-${Date.now()}`,
    quizId,
    score,
    passed,
    attemptNumber,
    maxAttempts: quiz.maxAttempts,
    completedAt: new Date().toISOString(),
  };
}

export interface AdminAuditLogItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export const DEMO_USERS: AuthUserDto[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@sage.local',
    role: 'admin',
    locale: 'en',
    emailVerifiedAt: '2026-08-01T10:00:00Z',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr-nour-001',
    email: 'nour@sage.local',
    role: 'instructor',
    locale: 'ar',
    emailVerifiedAt: '2026-08-15T10:00:00Z',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'usr-tariq-002',
    email: 'tariq@sage.local',
    role: 'instructor',
    locale: 'ar',
    emailVerifiedAt: '2026-08-20T10:00:00Z',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'usr-sarah-003',
    email: 'sarah@sage.local',
    role: 'instructor',
    locale: 'en',
    emailVerifiedAt: '2026-09-01T10:00:00Z',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'usr-student-001',
    email: 'student@sage.dev',
    role: 'student',
    locale: 'en',
    emailVerifiedAt: '2026-09-10T10:00:00Z',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'usr-student-002',
    email: 'fatima@sage.local',
    role: 'student',
    locale: 'ar',
    emailVerifiedAt: '2026-09-15T10:00:00Z',
    createdAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'usr-student-003',
    email: 'omar@sage.local',
    role: 'student',
    locale: 'ar',
    emailVerifiedAt: '2026-09-22T10:00:00Z',
    createdAt: '2026-09-22T10:00:00Z',
  },
];

export const DEMO_AUDIT_LOGS: AdminAuditLogItem[] = [
  {
    id: 'log-01',
    actor: 'admin@sage.local',
    action: 'Approved & Published Course',
    target: 'Modern Web Architecture & Distributed Systems',
    timestamp: '2 hours ago',
  },
  {
    id: 'log-02',
    actor: 'admin@sage.local',
    action: 'Promoted User to Instructor',
    target: 'nour@sage.local',
    timestamp: '5 hours ago',
  },
  {
    id: 'log-03',
    actor: 'system',
    action: 'Promotional Coupon Created (100% OFF)',
    target: 'SAGE100',
    timestamp: '1 day ago',
  },
  {
    id: 'log-04',
    actor: 'admin@sage.local',
    action: 'Approved Instructor Application',
    target: 'tariq@sage.local',
    timestamp: '3 days ago',
  },
];

export function getDemoAdminKPIs() {
  const publishedCount = DEMO_COURSES.filter((c) => c.status === 'published').length;
  const inReviewCount = DEMO_COURSES.filter((c) => c.status === 'in_review').length;
  const draftCount = DEMO_COURSES.filter((c) => c.status === 'draft').length;

  return {
    totalUsers: DEMO_USERS.length + 120,
    studentsCount: DEMO_USERS.filter((u) => u.role === 'student').length + 115,
    instructorsCount: DEMO_USERS.filter((u) => u.role === 'instructor').length,
    adminsCount: DEMO_USERS.filter((u) => u.role === 'admin').length,
    totalCourses: DEMO_COURSES.length,
    publishedCount,
    inReviewCount,
    draftCount,
    videoHoursHosted: '48.5h',
    storageUsageGB: '64.2 GB',
    grossVolumeUSD: 38450,
  };
}

export function getDemoReviewQueue(): CourseDto[] {
  return DEMO_COURSES.filter((c) => c.status === 'in_review');
}

export function reviewDemoCourse(
  courseId: string,
  action: 'approve' | 'reject',
  reason?: string
): { course: CourseDto; message: string } {
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course) {
    throw new Error('Course not found in review queue');
  }

  if (action === 'approve') {
    course.status = 'published';
    course.publishedAt = new Date().toISOString();
    DEMO_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      actor: 'admin@sage.local',
      action: 'Approved & Published Course',
      target: course.translations[0]?.title || course.id,
      timestamp: 'Just now',
    });
    return { course, message: 'Course approved and published to public catalog.' };
  } else {
    course.status = 'draft';
    DEMO_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      actor: 'admin@sage.local',
      action: `Requested Course Revisions: ${reason || 'Updates required'}`,
      target: course.translations[0]?.title || course.id,
      timestamp: 'Just now',
    });
    return { course, message: 'Course returned to draft for instructor revisions.' };
  }
}

export function getDemoUsers(): AuthUserDto[] {
  return DEMO_USERS;
}

export function updateDemoUserRole(userId: string, newRole: UserRole): AuthUserDto {
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  user.role = newRole;
  DEMO_AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    actor: 'admin@sage.local',
    action: `Updated User Role to ${newRole}`,
    target: user.email,
    timestamp: 'Just now',
  });
  return user;
}

export function getDemoAuditLogs(): AdminAuditLogItem[] {
  return DEMO_AUDIT_LOGS;
}

