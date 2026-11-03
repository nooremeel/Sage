'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  DollarSign,
  User,
  Video,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CourseDto, LessonType } from '@sage/shared';

interface CourseReviewCardProps {
  course: CourseDto;
  locale: 'ar' | 'en';
  onApprove: (courseId: string) => Promise<void>;
  onReject: (courseId: string, reason?: string) => Promise<void>;
}

export function CourseReviewCard({
  course,
  locale,
  onApprove,
  onReject,
}: CourseReviewCardProps) {
  const tAdmin = useTranslations('admin');
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Approve dialog
  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);

  // Reject / revisions dialog
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  const trans =
    course.translations.find((t) => t.locale === locale) ||
    course.translations[0];

  const totalLessons =
    course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;

  const handleConfirmApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(course.id);
      setIsApproveOpen(false);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRejecting(true);
    try {
      await onReject(course.id, revisionNotes);
      setIsRejectOpen(false);
      setRevisionNotes('');
    } finally {
      setIsRejecting(false);
    }
  };

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case 'video':
        return <Video className="h-3.5 w-3.5 text-primary" />;
      case 'article':
        return <FileText className="h-3.5 w-3.5 text-accent" />;
      case 'quiz':
        return <HelpCircle className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />;
    }
  };

  return (
    <Card className="p-6 border-border bg-card shadow-sm space-y-5 text-start">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning" className="text-xs font-semibold">
              In Review
            </Badge>
            <span className="text-xs font-mono uppercase text-text-muted px-2 py-0.5 rounded bg-bg-subtle">
              {course.level}
            </span>
            <span className="text-xs text-text-muted">
              {course.categoryName || 'Curriculum'}
            </span>
          </div>

          <h3 className="font-headline text-xl font-bold text-text leading-snug">
            {trans?.title || 'Untitled Course Proposal'}
          </h3>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <User className="h-3.5 w-3.5" />
            <span>
              {tAdmin('authorBy', {
                author: course.instructorName || 'Platform Instructor',
              })}
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
            {trans?.subtitle || trans?.description}
          </p>
        </div>

        {/* Pricing & Structure Badge */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 p-3 rounded-lg bg-bg-subtle border border-border/80">
          <span className="font-mono text-base font-bold text-text">
            {course.priceCents === 0
              ? 'Free ($0.00)'
              : `$${(course.priceCents / 100).toFixed(2)}`}
          </span>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {course.sections?.length || 0}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {totalLessons}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Curriculum Outline */}
      <div className="pt-2 border-t border-border/80">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>{tAdmin('inspectCurriculum')}</span>
        </button>

        {isExpanded && (
          <div className="mt-3 p-4 rounded-lg bg-paper-50 dark:bg-card border border-border space-y-4">
            {course.sections && course.sections.length > 0 ? (
              <div className="space-y-3">
                {course.sections.map((sec, sIdx) => {
                  const secTitle =
                    sec.title[locale] || sec.title.en || sec.title.ar || 'Section';
                  return (
                    <div key={sec.id} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text">
                        <span className="font-mono text-primary font-bold">
                          {String(sIdx + 1).padStart(2, '0')}.
                        </span>
                        <span>{secTitle}</span>
                      </div>

                      {sec.lessons && sec.lessons.length > 0 && (
                        <div className="space-y-1 ps-5">
                          {sec.lessons.map((les) => {
                            const lesTitle =
                              les.title[locale] || les.title.en || les.title.ar || 'Lesson';
                            return (
                              <div
                                key={les.id}
                                className="flex items-center gap-2 text-[11px] text-text-muted"
                              >
                                {getLessonIcon(les.type)}
                                <span className="truncate">{lesTitle}</span>
                                {les.isFreePreview && (
                                  <Badge
                                    variant="accent"
                                    className="text-[9px] py-0 px-1"
                                  >
                                    Preview
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No sections outlined yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Adjudication Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-border">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsRejectOpen(true)}
          className="w-full sm:w-auto text-danger hover:bg-danger/10 hover:text-danger"
        >
          <AlertCircle className="h-4 w-4 me-1.5" />
          <span>{tAdmin('rejectBtn')}</span>
        </Button>

        <Button
          variant="accent"
          size="sm"
          onClick={() => setIsApproveOpen(true)}
          className="w-full sm:w-auto"
        >
          <CheckCircle2 className="h-4 w-4 me-1.5" />
          <span>{tAdmin('approveBtn')}</span>
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tAdmin('confirmApproval')}</DialogTitle>
            <DialogDescription>{tAdmin('confirmApprovalDesc')}</DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-md bg-sage-300/10 border border-sage-700/20 text-xs text-text leading-relaxed">
            <span className="font-semibold block mb-1">{trans?.title}</span>
            <span>
              {tAdmin('authorBy', {
                author: course.instructorName || 'Platform Instructor',
              })}
            </span>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsApproveOpen(false)}
            >
              {tAdmin('cancelBtn')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isApproving}
              onClick={handleConfirmApprove}
            >
              {tAdmin('confirmPublishBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revisions Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tAdmin('rejectBtn')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmReject} className="space-y-4 pt-2 text-start">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tAdmin('feedbackPrompt')}
              </label>
              <Textarea
                rows={4}
                required
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder={tAdmin('feedbackPlaceholder')}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRejectOpen(false)}
              >
                {tAdmin('cancelBtn')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isRejecting}
              >
                {tAdmin('sendRevisionsBtn')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

