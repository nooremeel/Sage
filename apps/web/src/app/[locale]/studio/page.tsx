'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Illustration } from '@/components/illustrations/illustration';
import type { CourseDto } from '@sage/shared';
import { Plus, BookOpen, Layers, Send } from 'lucide-react';

export default function StudioPage() {
  const tStudio = useTranslations('studio');
  const tCommon = useTranslations('common');
  const { user, isLoading } = useAuth();
  const [courses, setCourses] = React.useState<CourseDto[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);

  const fetchMyCourses = React.useCallback(async () => {
    try {
      const res = await apiClient<{ courses: CourseDto[] }>('/courses/studio/my-courses');
      setCourses(res.courses || []);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchMyCourses();
    }
  }, [user, fetchMyCourses]);

  const handleSubmitForReview = async (courseId: string) => {
    try {
      await apiClient(`/courses/studio/${courseId}/submit`, { method: 'POST' });
      setMessage(tStudio('submittedSuccess'));
      await fetchMyCourses();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error submitting course');
    }
  };

  if (isLoading || loadingCourses) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto max-w-xl py-16 px-4 text-center space-y-4">
        <Illustration name="empty-courses" size={96} wash="amber" />
        <h2 className="font-headline text-2xl font-bold text-text">
          {tStudio('instructorOnlyTitle')}
        </h2>
        <p className="text-sm text-text-muted">
          {tStudio('instructorOnlyDesc')}
        </p>
        <Link href="/profile">
          <Button variant="primary">{tStudio('applyInstructorBtn')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-text">
            {tStudio('dashboardTitle')}
          </h1>
          <p className="text-sm text-text-muted">
            {tStudio('dashboardSubtitle')}
          </p>
        </div>

        <Button variant="accent" className="flex items-center gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>{tStudio('newCourseDraft')}</span>
        </Button>
      </div>

      {message && (
        <Alert variant="info">
          <span>{message}</span>
        </Alert>
      )}

      {/* Courses List */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const trans = course.translations[0];
            const statusVariants: Record<string, 'secondary' | 'accent' | 'sage' | 'warning'> = {
              draft: 'secondary',
              in_review: 'warning',
              published: 'sage',
              archived: 'secondary',
            };

            return (
              <Card key={course.id} className="p-6 flex flex-col justify-between space-y-4 border-border bg-card">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={statusVariants[course.status] || 'secondary'}>
                      {course.status}
                    </Badge>
                    <span className="text-xs text-text-muted uppercase font-mono">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="font-headline text-lg font-semibold text-text line-clamp-2">
                    {trans?.title || 'Untitled Draft'}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {trans?.subtitle || trans?.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-text-muted">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {course.sections?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0}
                    </span>
                  </div>

                  {course.status === 'draft' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSubmitForReview(course.id)}
                      className="flex items-center gap-1.5"
                    >
                      <Send className="h-3 w-3" />
                      <span>{tStudio('submitReview')}</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
          <Illustration name="empty-courses" size={96} wash="amber" />
          <h3 className="font-headline text-xl font-semibold text-text">
            {tStudio('noCoursesYet')}
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            {tStudio('noCoursesYetDesc')}
          </p>
        </div>
      )}
    </div>
  );
}

