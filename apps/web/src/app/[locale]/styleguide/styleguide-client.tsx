'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldWrapper } from '@/components/ui/field-wrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from '@/components/ui/rating-stars';
import { StatCard } from '@/components/ui/stat-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Illustration, type IllustrationName } from '@/components/illustrations/illustration';
import { CourseCard } from '@/components/domain/course-card';
import { CurriculumAccordion, type SectionItem } from '@/components/domain/curriculum-accordion';
import { BookOpen, Users, Award, Sparkles } from 'lucide-react';

export function StyleguideClient() {
  const t = useTranslations('styleguide');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);
  const [progressVal, setProgressVal] = React.useState(68);

  const illustrationNames: { name: IllustrationName; label: string }[] = [
    { name: 'logo-leaf', label: 'Logo Leaf' },
    { name: 'hero-study', label: 'Hero Study' },
    { name: 'empty-courses', label: 'Empty Courses' },
    { name: 'empty-enrollments', label: 'Empty Enrollments' },
    { name: 'empty-notifications', label: 'Empty Notifications' },
    { name: 'empty-qa', label: 'Empty Q&A' },
    { name: 'empty-search', label: 'Empty Search' },
    { name: 'empty-404', label: 'Empty 404' },
    { name: 'category-code', label: 'Category Code' },
    { name: 'category-design', label: 'Category Design' },
    { name: 'category-business', label: 'Category Business' },
    { name: 'category-language', label: 'Category Language' },
    { name: 'upload-quill', label: 'Upload Quill' },
    { name: 'upload-leaf', label: 'Upload Leaf' },
    { name: 'flourish-squiggle', label: 'Flourish Squiggle' },
    { name: 'certificate-border', label: 'Certificate Corner' },
  ];

  const curriculumSample: SectionItem[] = [
    {
      id: 'section-1',
      title: '1. مدخل إلى هندسة النظم البرمجية (System Architecture Fundamentals)',
      lessons: [
        {
          id: 'l1',
          title: 'الدرس الأول: مفهوم المعمارية ثنائية التنفيذ (Dual Execution Model)',
          type: 'video',
          duration: '14:20',
          isFreePreview: true,
          isCompleted: true,
        },
        {
          id: 'l2',
          title: 'الدرس الثاني: قواعد التصميم الأكاديمي والطباعة المزدوجة',
          type: 'article',
          duration: '8 min read',
          isFreePreview: true,
          isCompleted: true,
        },
        {
          id: 'l3',
          title: 'اختبار تقييمي: أساسيات قواعد البيانات والشبكات',
          type: 'quiz',
          duration: '15 min',
          isCompleted: false,
        },
      ],
    },
    {
      id: 'section-2',
      title: '2. خط أنابيب الوسائط والتوزيع المحمي (Media Pipeline & HLS)',
      lessons: [
        {
          id: 'l4',
          title: 'الدرس الثالث: التقطيع التكيفي المتعدد الجودات عبر FFmpeg',
          type: 'video',
          duration: '22:45',
          isCompleted: false,
        },
        {
          id: 'l5',
          title: 'الدرس الرابع: الرموز المميزة لحماية الروابط وتفادي التسريب',
          type: 'article',
          duration: '12 min read',
          isCompleted: false,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      {/* Hero Intro */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-border pb-12 text-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="accent">Phase 1 Design System</Badge>
            <Badge variant="sage">WCAG 2.2 AA</Badge>
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-text">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-text-muted leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center p-4">
          <Illustration name="hero-study" size={240} wash="amber" />
        </div>
      </section>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('colorTokens')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('colorTokensDesc')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <ColorSwatch name="Paper (Bg)" hex="#FBF7EE" token="--paper" bgClass="bg-paper border border-border" />
          <ColorSwatch name="Paper 200 (Subtle)" hex="#F1EAD9" token="--paper-200" bgClass="bg-paper-200" />
          <ColorSwatch name="Surface (Card)" hex="#FFFDF8" token="--surface" bgClass="bg-surface border border-border" />
          <ColorSwatch name="Rule (Border)" hex="#E2D8C2" token="--rule" bgClass="bg-rule" />
          <ColorSwatch name="Ink 900 (Text)" hex="#15233F" token="--ink-900" bgClass="bg-ink-900 text-white" />
          <ColorSwatch name="Ink 600 (Muted)" hex="#3F4B66" token="--ink-600" bgClass="bg-ink-600 text-white" />
          <ColorSwatch name="Blue 700 (Primary)" hex="#1F3A6E" token="--blue-700" bgClass="bg-primary text-white" />
          <ColorSwatch name="Blue 100 (Tint)" hex="#E4EAF5" token="--blue-100" bgClass="bg-primary-tint" />
          <ColorSwatch name="Amber 500 (Accent)" hex="#E39B35" token="--amber-500" bgClass="bg-accent text-ink-900 font-bold" />
          <ColorSwatch name="Sage 700 (Success)" hex="#44614A" token="--sage-700" bgClass="bg-sage-700 text-white" />
          <ColorSwatch name="Sage 300 (Wash)" hex="#B9CBB4" token="--sage-300" bgClass="bg-sage-300 text-ink-900" />
          <ColorSwatch name="Danger" hex="#A8281F" token="--danger" bgClass="bg-danger text-white" />
        </div>
      </section>

      {/* 2. Typography & Fonts */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('typography')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('typographyDesc')}</p>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Display Serif Headlines (EB Garamond / Amiri)
            </span>
            <p className="font-headline text-4xl sm:text-5xl font-bold text-text mt-2">
              تعلّم ما يستحق أن يُعرف · Learn something worth knowing
            </p>
            <p className="font-headline text-2xl sm:text-3xl font-semibold text-text mt-3">
              المعرفة المتأنية تبني أثراً يدوم في الذاكرة والعمل
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              UI & Body Font (IBM Plex Sans / Arabic)
            </span>
            <p className="mt-2 text-base text-text leading-relaxed reading-column">
              تم تصميم هذه المنصة لتجمع بين رصانة الورق والمطالعة الهادئة، وأحدث معايير الأداء والتقنيات البرمجية. القراءة المريحة ذات السطر المتزن (68 حرفاً بالإنجليزية وقرابة 60 بالعربية) تمنح المتعلم تركيزاً مستداماً دون تشتيت بصري.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Monospace Code (IBM Plex Mono — Always LTR)
            </span>
            <pre className="mt-2 rounded-md bg-paper-200 p-4 font-mono text-xs text-text overflow-x-auto dark:bg-bg-subtle" dir="ltr">
              <code>{`// Protected Video Playback Manifest Authorization
const payload = { userId: "usr_01HGB90", assetId: "ast_01HGB81" };
const token = await jwtService.signAsync(payload, { expiresIn: '4h' });
const manifestUrl = \`/api/lessons/\${lessonId}/manifest.m3u8?token=\${token}\`;`}</code>
            </pre>
          </div>
        </Card>
      </section>

      {/* 3. Action Buttons */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('buttons')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('buttonsDesc')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t('primaryBtn')}</Button>
          <Button variant="secondary">{t('secondaryBtn')}</Button>
          <Button variant="accent">{t('accentBtn')}</Button>
          <Button variant="destructive">{t('destructiveBtn')}</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" isLoading>{t('loadingBtn')}</Button>
          <Button variant="secondary" disabled>{t('disabledBtn')}</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="sm" variant="primary">Small (32px)</Button>
          <Button size="md" variant="primary">Medium (40px)</Button>
          <Button size="lg" variant="primary">Large (48px)</Button>
          <Button size="icon" variant="secondary" aria-label="Sparkles icon action">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('formControls')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('formControlsDesc')}</p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldWrapper id="sample-input" label={t('sampleLabel')} hint={t('sampleHint')} required>
              <Input id="sample-input" placeholder={t('inputPlaceholder')} />
            </FieldWrapper>

            <FieldWrapper id="sample-error-input" label={t('sampleLabel')} error={t('sampleError')}>
              <Input id="sample-error-input" hasError defaultValue="invalid-email@" />
            </FieldWrapper>

            <FieldWrapper id="sample-select" label="المستوى المطلوب">
              <Select defaultValue="option1">
                <SelectTrigger id="sample-select">
                  <SelectValue placeholder={t('sampleSelectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">{t('option1')}</SelectItem>
                  <SelectItem value="option2">{t('option2')}</SelectItem>
                  <SelectItem value="option3">{t('option3')}</SelectItem>
                </SelectContent>
              </Select>
            </FieldWrapper>

            <FieldWrapper id="sample-textarea" label="ملاحظات المتدرب">
              <Textarea id="sample-textarea" placeholder={t('textareaPlaceholder')} />
            </FieldWrapper>
          </div>

          <div className="mt-6 border-t border-border pt-6 flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="styleguide-switch"
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <label htmlFor="styleguide-switch" className="text-sm font-medium text-text cursor-pointer">
                {t('toggleLabel')}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="styleguide-checkbox"
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
              />
              <label htmlFor="styleguide-checkbox" className="text-sm font-medium text-text cursor-pointer">
                {t('checkboxLabel')}
              </label>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Feedback, Indicators & Overlays */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('feedback')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('feedbackDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert variant="info" title="معلومة هامة">
            يتم تشفير تدفق الفيديو بنظام تقسيم مقاطع HLS وإصدار روابط صالحة لـ 60 ثانية فقط لمنع النسخ غير المصرح.
          </Alert>
          <Alert variant="success" title="تم اكتمال المهمة">
            أنهى نظام الاختبارات التحقق من 250 حالة اختبار بنجاح تام وبنسبة تغطية مرتفعة.
          </Alert>
          <Alert variant="warning" title="تنبيه الاستخدام">
            قاربت مساحة التخزين المجانية في Backblaze B2 على الوصول إلى الحد الأقصى (9.2 من 10 جيجابايت).
          </Alert>
          <Alert variant="danger" title="خطأ في المصادقة">
            انتهت صلاحية رمز التحديث المرفق، يرجى تسجيل الدخول مجدداً للمتابعة.
          </Alert>
        </div>

        {/* Progress & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <StatCard
            label="إجمالي المتدربين النشطين"
            value="14,820"
            trend={{ value: "+18% هذا الشهر", isPositive: true }}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="الدورات المعتمدة"
            value="240"
            trend={{ value: "+4 دورات جديدة", isPositive: true }}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            label="الشهادات الصادرة"
            value="3,940"
            trend={{ value: "+12% إنجاز", isPositive: true }}
            icon={<Award className="h-5 w-5" />}
          />
        </div>

        {/* Progress Bar & Ring & Avatar */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-2/3 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span>نسبة إكمال المسار التعليمي</span>
                <span className="text-sage-700 dark:text-sage-300">{progressVal}%</span>
              </div>
              <ProgressBar value={progressVal} />
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => setProgressVal(Math.max(progressVal - 15, 0))}>
                  -15%
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setProgressVal(Math.min(progressVal + 15, 100))}>
                  +15%
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ProgressRing value={progressVal} size={70}>
                <span className="text-xs font-bold">{progressVal}%</span>
              </ProgressRing>

              <div className="flex items-center gap-3">
                <Avatar fallback="NE" size="lg" />
                <div className="text-start">
                  <p className="text-sm font-semibold text-text">نور إميل</p>
                  <p className="text-xs text-text-muted">مدرّب معتمد</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Interactive Modal Dialog */}
        <div className="pt-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">فتح نموذج الحوار (Accessible Dialog)</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>نموذج أكاديمي منبثق</DialogTitle>
                <DialogDescription>
                  هذا النموذج مبني على مواصفات Radix UI مع احترام التركيز البصري ودعم كامل للملء والتمرير بالاتجاهين.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <FieldWrapper id="dialog-input" label="رمز التحقق الأكاديمي">
                  <Input id="dialog-input" placeholder="مثال: SG-2026-X8" />
                </FieldWrapper>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button variant="primary" onClick={() => setDialogOpen(false)}>تأكيد المعاملة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* 6. Hand-Drawn Ink Illustration Catalog */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('illustrations')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('illustrationsDesc')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
          {illustrationNames.map((item, index) => {
            const wash = index % 2 === 0 ? 'amber' : 'sage';
            return (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-e1"
              >
                <Illustration name={item.name} size={64} wash={wash} />
                <span className="mt-3 text-xs font-semibold text-text">{item.label}</span>
                <span className="text-[10px] text-text-muted font-mono">{item.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Domain Preview: Course Card & Curriculum */}
      <section className="space-y-6 text-start">
        <div>
          <h2 className="font-headline text-2xl font-bold text-text">{t('courseCardDemo')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('courseCardDemoDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CourseCard
            title="هندسة النظم الخلفية المتطورة باستخدام NestJS و PostgreSQL"
            instructor="م. نور إميل"
            rating={4.9}
            reviewCount={128}
            price="مجاني"
            level="متقدم"
            lessonsCount={32}
            duration="18 ساعة"
            categoryIcon="category-code"
            languageChip="العربية / EN"
          />
          <CourseCard
            title="فلسفة التصميم الطباعي وأنظمة الواجهات ثنائية الاتجاه RTL"
            instructor="أ. سارة المنصور"
            rating={4.8}
            reviewCount={94}
            price="$49"
            level="متوسط"
            lessonsCount={24}
            duration="12 ساعة"
            categoryIcon="category-design"
            languageChip="العربية"
          />
          <CourseCard
            title="إدارة المشاريع الأكاديمية والقيادة الاستراتيجية للمنصات الرقمية"
            instructor="د. طارق الحكيم"
            rating={4.7}
            reviewCount={62}
            price="$75"
            level="جميع المستويات"
            lessonsCount={18}
            duration="9 ساعات"
            categoryIcon="category-business"
            languageChip="English / AR"
          />
        </div>

        <div className="pt-8 space-y-4">
          <h3 className="font-headline text-xl font-bold text-text">{t('curriculumDemo')}</h3>
          <p className="text-sm text-text-muted">{t('curriculumDemoDesc')}</p>
          <CurriculumAccordion sections={curriculumSample} />
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({
  name,
  hex,
  token,
  bgClass,
}: {
  name: string;
  hex: string;
  token: string;
  bgClass: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className={`h-16 w-full flex items-center justify-center ${bgClass}`}>
        <span className="text-xs font-mono">{hex}</span>
      </div>
      <div className="p-2.5 text-start">
        <p className="text-xs font-semibold text-text truncate">{name}</p>
        <p className="text-[10px] text-text-muted font-mono truncate">{token}</p>
      </div>
    </div>
  );
}
