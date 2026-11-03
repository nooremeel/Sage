'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Illustration } from '@/components/illustrations/illustration';
import { CourseReviewCard } from '@/components/admin/course-review-card';
import { UserDirectoryTable } from '@/components/admin/user-directory-table';
import {
  getDemoAdminKPIs,
  getDemoReviewQueue,
  reviewDemoCourse,
  getDemoUsers,
  updateDemoUserRole,
  getDemoAuditLogs,
  type AdminAuditLogItem,
} from '@/lib/demo-courses';
import type { CourseDto, AuthUserDto, UserRole } from '@sage/shared';
import {
  ShieldAlert,
  Users,
  BookOpen,
  HardDrive,
  DollarSign,
  ClipboardCheck,
  History,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';

export default function AdminPage() {
  const tAdmin = useTranslations('admin');
  const params = useParams();
  const currentLocale = (params?.locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const { user, isLoading, login } = useAuth();

  // State
  const [kpis, setKpis] = React.useState(() => getDemoAdminKPIs());
  const [reviewQueue, setReviewQueue] = React.useState<CourseDto[]>(() =>
    getDemoReviewQueue()
  );
  const [userList, setUserList] = React.useState<AuthUserDto[]>(() =>
    getDemoUsers()
  );
  const [auditLogs, setAuditLogs] = React.useState<AdminAuditLogItem[]>(() =>
    getDemoAuditLogs()
  );
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  // Background API synchronization with resilient fallback
  const fetchAdminData = React.useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const [queueRes, usersRes] = await Promise.all([
        apiClient<{ courses: CourseDto[] }>('/admin/courses/review-queue', {
          signal: controller.signal,
        }),
        apiClient<{ items: AuthUserDto[] }>('/users?limit=50', {
          signal: controller.signal,
        }),
      ]);
      clearTimeout(timeoutId);

      if (queueRes?.courses) {
        setReviewQueue(queueRes.courses);
      }
      if (usersRes?.items) {
        setUserList(usersRes.items);
      }
    } catch {
      // Retain resilient demo fallback datasets
    }
  }, []);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  // Actions
  const handleApproveCourse = async (courseId: string) => {
    try {
      await apiClient(`/admin/courses/${courseId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      });
    } catch {
      reviewDemoCourse(courseId, 'approve');
    }

    setReviewQueue((prev) => prev.filter((c) => c.id !== courseId));
    setKpis((prev) => ({
      ...prev,
      publishedCount: prev.publishedCount + 1,
      inReviewCount: Math.max(0, prev.inReviewCount - 1),
    }));
    setAuditLogs(getDemoAuditLogs());
    setAlertMessage(tAdmin('approveSuccess'));
  };

  const handleRejectCourse = async (courseId: string, reason?: string) => {
    try {
      await apiClient(`/admin/courses/${courseId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', reason }),
      });
    } catch {
      reviewDemoCourse(courseId, 'reject', reason);
    }

    setReviewQueue((prev) => prev.filter((c) => c.id !== courseId));
    setKpis((prev) => ({
      ...prev,
      draftCount: prev.draftCount + 1,
      inReviewCount: Math.max(0, prev.inReviewCount - 1),
    }));
    setAuditLogs(getDemoAuditLogs());
    setAlertMessage(tAdmin('revisionsRequested'));
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await apiClient(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
    } catch {
      updateDemoUserRole(userId, newRole);
    }

    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setAuditLogs(getDemoAuditLogs());
    setAlertMessage(tAdmin('roleUpdatedSuccess', { role: newRole }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Access control gate: Only admins
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto max-w-xl py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-headline text-3xl font-bold text-text">
            {tAdmin('adminOnlyTitle')}
          </h2>
          <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
            {tAdmin('adminOnlyDesc')}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/profile">
            <Button variant="secondary">Go to Profile</Button>
          </Link>
          <Button
            variant="primary"
            onClick={() =>
              login({ email: 'admin@sage.local', password: 'password123' })
            }
          >
            {tAdmin('signInAsAdmin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4 sm:px-6 space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
              Platform Governance
            </span>
            <span className="text-xs text-text-muted font-mono">{user.email}</span>
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-text">
            {tAdmin('portalTitle')}
          </h1>
          <p className="text-sm text-text-muted">
            {tAdmin('portalSubtitle')}
          </p>
        </div>
      </div>

      {alertMessage && (
        <Alert variant="info" className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{alertMessage}</span>
        </Alert>
      )}

      {/* Platform Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={tAdmin('kpiTotalUsers')}
          value={kpis.totalUsers.toLocaleString()}
          description={tAdmin('kpiUsersDesc', {
            students: kpis.studentsCount,
            instructors: kpis.instructorsCount,
          })}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label={tAdmin('kpiCatalogCourses')}
          value={kpis.totalCourses.toLocaleString()}
          description={tAdmin('kpiCoursesDesc', {
            published: kpis.publishedCount,
            inReview: kpis.inReviewCount,
          })}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          label={tAdmin('kpiVideoStorage')}
          value={kpis.videoHoursHosted}
          description={tAdmin('kpiStorageDesc', {
            hours: kpis.videoHoursHosted,
            storage: kpis.storageUsageGB,
          })}
          icon={<HardDrive className="w-5 h-5 text-accent" />}
        />
        <StatCard
          label={tAdmin('kpiGrossVolume')}
          value={`$${kpis.grossVolumeUSD.toLocaleString()}`}
          trend={{ value: '+18.5% scale', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-sage-600 dark:text-sage-400" />}
        />
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="review-queue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="review-queue" className="flex items-center gap-1.5 text-xs">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{tAdmin('tabReviewQueue')}</span>
            {reviewQueue.length > 0 && (
              <span className="ms-1 px-1.5 py-0.2 rounded-full bg-accent text-on-accent text-[10px] font-mono">
                {reviewQueue.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>{tAdmin('tabUsers')}</span>
          </TabsTrigger>

          <TabsTrigger value="audit-log" className="flex items-center gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            <span>{tAdmin('tabAuditLog')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Course Review Queue */}
        <TabsContent value="review-queue" className="space-y-6">
          {reviewQueue.length > 0 ? (
            <div className="space-y-4">
              {reviewQueue.map((course) => (
                <CourseReviewCard
                  key={course.id}
                  course={course}
                  locale={currentLocale}
                  onApprove={handleApproveCourse}
                  onReject={handleRejectCourse}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-card">
              <Illustration name="empty-courses" size={96} wash="amber" />
              <div className="space-y-1">
                <h3 className="font-headline text-xl font-semibold text-text">
                  {tAdmin('noCoursesInQueue')}
                </h3>
                <p className="text-xs text-text-muted max-w-sm">
                  {tAdmin('noCoursesInQueueDesc')}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: User Governance Directory */}
        <TabsContent value="users">
          <UserDirectoryTable
            users={userList}
            onRoleChange={handleRoleChange}
          />
        </TabsContent>

        {/* Tab 3: System Audit Trail */}
        <TabsContent value="audit-log" className="space-y-4 text-start">
          <div className="border-b border-border pb-3">
            <h3 className="font-headline text-lg font-semibold text-text">
              {tAdmin('auditFeedTitle')}
            </h3>
            <p className="text-xs text-text-muted">
              {tAdmin('auditFeedDesc')}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">{log.action}</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {log.actor}
                    </Badge>
                  </div>
                  <p className="text-text-muted">{log.target}</p>
                </div>

                <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px] shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

