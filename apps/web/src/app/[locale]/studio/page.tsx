'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Illustration } from '@/components/illustrations/illustration';
import { CurriculumEditor } from '@/components/studio/curriculum-editor';
import {
  getDemoInstructorCourses,
  getDemoInstructorKPIs,
  submitDemoCourseForReview,
  createDemoCourseDraft,
} from '@/lib/demo-courses';
import type { CourseDto, CourseLevel } from '@sage/shared';
import {
  Plus,
  BookOpen,
  Layers,
  Send,
  Users,
  Award,
  Star,
  DollarSign,
  ExternalLink,
  Edit3,
  CheckCircle,
} from 'lucide-react';

export default function StudioPage() {
  const tStudio = useTranslations('studio');
  const params = useParams();
  const currentLocale = (params?.locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const { user, isLoading, login } = useAuth();

  // State
  const [courses, setCourses] = React.useState<CourseDto[]>(() =>
    getDemoInstructorCourses('usr-nour-001')
  );
  const [kpis, setKpis] = React.useState(() =>
    getDemoInstructorKPIs('usr-nour-001')
  );
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'published' | 'in_review' | 'draft'>('all');
  const [message, setMessage] = React.useState<string | null>(null);

  // Modals state
  const [isCreatingCourse, setIsCreatingCourse] = React.useState(false);
  const [newTitleAr, setNewTitleAr] = React.useState('');
  const [newTitleEn, setNewTitleEn] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('cat-eng-001');
  const [newLevel, setNewLevel] = React.useState<CourseLevel>('beginner');
  const [newPriceUSD, setNewPriceUSD] = React.useState('49');
  const [isSubmittingDraft, setIsSubmittingDraft] = React.useState(false);

  // Curriculum Editor Active Course
  const [editingCourse, setEditingCourse] = React.useState<CourseDto | null>(null);

  // Background API synchronization with resilient fallback
  const fetchMyCourses = React.useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await apiClient<{ courses: CourseDto[] }>('/courses/studio/my-courses', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.courses && res.courses.length > 0) {
        setCourses(res.courses);
      }
    } catch {
      // Retain offline demo courses seamlessly
    }
  }, []);

  React.useEffect(() => {
    if (user && (user.role === 'instructor' || user.role === 'admin')) {
      fetchMyCourses();
    }
  }, [user, fetchMyCourses]);

  // Submit Draft for Platform Review
  const handleSubmitForReview = async (courseId: string) => {
    try {
      await apiClient(`/courses/studio/${courseId}/submit`, { method: 'POST' });
    } catch {
      submitDemoCourseForReview(courseId);
    }

    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, status: 'in_review' } : c))
    );
    setMessage(tStudio('submittedSuccess'));
  };

  // Create Course Draft
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleAr.trim() && !newTitleEn.trim()) return;

    setIsSubmittingDraft(true);
    const priceCents = Math.round((parseFloat(newPriceUSD) || 0) * 100);
    const categoryName =
      newCategory === 'cat-eng-001'
        ? 'Software Engineering'
        : newCategory === 'cat-arts-002'
        ? 'Classical Arts & Calligraphy'
        : 'Business & Leadership';

    try {
      const res = await apiClient<{ course: CourseDto }>('/courses/studio', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: newCategory,
          level: newLevel,
          priceCents,
          currency: 'USD',
          primaryLocale: currentLocale,
          translations: [
            {
              locale: 'ar',
              title: newTitleAr.trim() || newTitleEn.trim(),
              description: newTitleAr.trim() || newTitleEn.trim(),
              slug: `draft-${Date.now()}-ar`,
            },
            {
              locale: 'en',
              title: newTitleEn.trim() || newTitleAr.trim(),
              description: newTitleEn.trim() || newTitleAr.trim(),
              slug: `draft-${Date.now()}`,
            },
          ],
        }),
      });
      setCourses((prev) => [res.course, ...prev]);
    } catch {
      // Offline fallback
      const created = createDemoCourseDraft({
        instructorId: user?.id || 'usr-nour-001',
        titleAr: newTitleAr.trim() || newTitleEn.trim(),
        titleEn: newTitleEn.trim() || newTitleAr.trim(),
        categoryId: newCategory,
        categoryName,
        level: newLevel,
        priceCents,
      });
      setCourses((prev) => [created, ...prev]);
    } finally {
      setIsSubmittingDraft(false);
      setIsCreatingCourse(false);
      setNewTitleAr('');
      setNewTitleEn('');
      setNewPriceUSD('49');
    }
  };

  // Filtered Courses
  const filteredCourses = React.useMemo(() => {
    if (activeFilter === 'all') return courses;
    return courses.filter((c) => c.status === activeFilter);
  }, [courses, activeFilter]);

  const counts = React.useMemo(() => {
    return {
      all: courses.length,
      published: courses.filter((c) => c.status === 'published').length,
      in_review: courses.filter((c) => c.status === 'in_review').length,
      draft: courses.filter((c) => c.status === 'draft').length,
    };
  }, [courses]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Access check: Only instructors or admins
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto max-w-xl py-20 px-4 text-center space-y-6">
        <Illustration name="empty-courses" size={110} wash="amber" />
        <div className="space-y-2">
          <h2 className="font-headline text-3xl font-bold text-text">
            {tStudio('instructorOnlyTitle')}
          </h2>
          <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
            {tStudio('instructorOnlyDesc')}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/profile">
            <Button variant="secondary">{tStudio('applyInstructorBtn')}</Button>
          </Link>
          <Button
            variant="primary"
            onClick={() => login({ email: 'nour@sage.local', password: 'password123' })}
          >
            {currentLocale === 'ar'
              ? 'الدخول الفوري كـ "نور إميل" (مدرّب معتمد)'
              : 'Sign in as Instructor (Nour Emil)'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4 sm:px-6 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {currentLocale === 'ar' ? 'أستوديو التأليف الأكاديمي' : 'Authoring Studio'}
            </span>
            <span className="text-xs text-text-muted">
              {user.email}
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-text">
            {tStudio('dashboardTitle')}
          </h1>
          <p className="text-sm text-text-muted">
            {tStudio('dashboardSubtitle')}
          </p>
        </div>

        <Button
          variant="accent"
          onClick={() => setIsCreatingCourse(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{tStudio('newCourseDraft')}</span>
        </Button>
      </div>

      {message && (
        <Alert variant="info" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span>{message}</span>
        </Alert>
      )}

      {/* Instructor KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={tStudio('kpiEnrolledStudents')}
          value={kpis.totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+14% this month', isPositive: true }}
        />
        <StatCard
          label={tStudio('kpiCompletionRate')}
          value={`${kpis.completionRate}%`}
          icon={<Award className="w-5 h-5" />}
          trend={{ value: '+4.2% completion', isPositive: true }}
        />
        <StatCard
          label={tStudio('kpiAvgRating')}
          value={`${kpis.avgRating} ★`}
          description={`${kpis.ratingCount} student reviews`}
          icon={<Star className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          label={tStudio('kpiNetRevenue')}
          value={`$${kpis.netRevenueUSD.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-sage-600 dark:text-sage-400" />}
          trend={{ value: 'Net Payouts Ready', isPositive: true }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          }`}
        >
          <span>{tStudio('filterAll')}</span>
          <span className="font-mono text-[11px] opacity-80">({counts.all})</span>
        </button>

        <button
          onClick={() => setActiveFilter('published')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'published'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          }`}
        >
          <span>{tStudio('filterPublished')}</span>
          <span className="font-mono text-[11px] opacity-80">({counts.published})</span>
        </button>

        <button
          onClick={() => setActiveFilter('in_review')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'in_review'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          }`}
        >
          <span>{tStudio('filterInReview')}</span>
          <span className="font-mono text-[11px] opacity-80">({counts.in_review})</span>
        </button>

        <button
          onClick={() => setActiveFilter('draft')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'draft'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          }`}
        >
          <span>{tStudio('filterDrafts')}</span>
          <span className="font-mono text-[11px] opacity-80">({counts.draft})</span>
        </button>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const trans =
              course.translations.find((t) => t.locale === currentLocale) ||
              course.translations[0];
            const statusVariants: Record<string, 'secondary' | 'accent' | 'sage' | 'warning'> = {
              draft: 'secondary',
              in_review: 'warning',
              published: 'sage',
              archived: 'secondary',
            };

            const statusLabels: Record<string, string> = {
              draft: tStudio('statusDraft'),
              in_review: tStudio('statusInReview'),
              published: tStudio('statusPublished'),
              archived: tStudio('statusArchived'),
            };

            const totalLessons =
              course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
            const priceFormatted =
              course.priceCents === 0
                ? tStudio('freePrice')
                : `$${(course.priceCents / 100).toFixed(2)}`;

            return (
              <Card
                key={course.id}
                className="p-6 flex flex-col justify-between space-y-5 border-border bg-card shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={statusVariants[course.status] || 'secondary'}>
                      {statusLabels[course.status] || course.status}
                    </Badge>
                    <span className="text-xs text-text-muted uppercase font-mono tracking-wider">
                      {course.level}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-headline text-lg font-semibold text-text line-clamp-2 leading-snug">
                      {trans?.title || 'Untitled Course Draft'}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {trans?.subtitle || trans?.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/80">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {course.sections?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {totalLessons}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-text">
                      {priceFormatted}
                    </span>
                  </div>
                </div>

                {/* Course Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingCourse(course)}
                    className="flex items-center gap-1.5 text-xs flex-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{tStudio('editCurriculum')}</span>
                  </Button>

                  {course.status === 'published' ? (
                    <Link
                      href={trans?.slug ? `/courses/${trans.slug}` : '/courses'}
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="h-8 px-2.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : course.status === 'draft' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitForReview(course.id)}
                      className="flex items-center gap-1 text-xs shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      <span>{tStudio('submitReview')}</span>
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 flex flex-col items-center justify-center">
          <Illustration name="empty-courses" size={96} wash="amber" />
          <h3 className="font-headline text-xl font-semibold text-text">
            {tStudio('noCoursesYet')}
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            {tStudio('noCoursesYetDesc')}
          </p>
          <Button
            variant="accent"
            onClick={() => setIsCreatingCourse(true)}
            className="flex items-center gap-2 mt-2"
          >
            <Plus className="h-4 w-4" />
            <span>{tStudio('newCourseDraft')}</span>
          </Button>
        </div>
      )}

      {/* Curriculum Editor Overlay */}
      {editingCourse && (
        <CurriculumEditor
          course={editingCourse}
          locale={currentLocale}
          onClose={() => setEditingCourse(null)}
          onUpdateCourse={(updated) => {
            setCourses((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
            setEditingCourse(updated);
          }}
        />
      )}

      {/* New Course Draft Dialog */}
      <Dialog open={isCreatingCourse} onOpenChange={setIsCreatingCourse}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStudio('createCourseTitle')}</DialogTitle>
            <DialogDescription>{tStudio('createCourseDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('titleArLabel')}
              </label>
              <Input
                value={newTitleAr}
                onChange={(e) => setNewTitleAr(e.target.value)}
                placeholder="مثال: أسس الحوسبة السحابية وهندسة النظم"
                dir="rtl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('titleEnLabel')}
              </label>
              <Input
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="e.g. Cloud Computing & Systems Architecture"
                dir="ltr"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  {tStudio('categoryLabel')}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text focus-ring"
                >
                  <option value="cat-eng-001">Software Engineering</option>
                  <option value="cat-arts-002">Classical Arts & Calligraphy</option>
                  <option value="cat-biz-003">Business & Leadership</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  {tStudio('levelLabel')}
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as CourseLevel)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text focus-ring"
                >
                  <option value="beginner">{tStudio('levelBeginner')}</option>
                  <option value="intermediate">{tStudio('levelIntermediate')}</option>
                  <option value="advanced">{tStudio('levelAdvanced')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('priceLabel')}
              </label>
              <Input
                type="number"
                min={0}
                step={1}
                value={newPriceUSD}
                onChange={(e) => setNewPriceUSD(e.target.value)}
              />
              <span className="text-[11px] text-text-muted">
                {parseFloat(newPriceUSD) === 0 ? tStudio('freePrice') : `$${newPriceUSD} USD`}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreatingCourse(false)}
              >
                {tStudio('cancelBtn')}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingDraft}>
                {tStudio('createSubmitBtn')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
