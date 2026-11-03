'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Video,
  FileText,
  HelpCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { VideoUploader } from '@/components/studio/video-uploader';
import {
  addDemoSection,
  addDemoLesson,
  reorderDemoSections,
  reorderDemoLessons,
  deleteDemoSection,
  deleteDemoLesson,
} from '@/lib/demo-courses';
import type { CourseDto, SectionDto, LessonDto, LessonType } from '@sage/shared';

interface CurriculumEditorProps {
  course: CourseDto;
  locale: 'ar' | 'en';
  onClose: () => void;
  onUpdateCourse?: (course: CourseDto) => void;
}

export function CurriculumEditor({
  course,
  locale,
  onClose,
  onUpdateCourse,
}: CurriculumEditorProps) {
  const tStudio = useTranslations('studio');

  const [sections, setSections] = React.useState<SectionDto[]>(course.sections || []);

  // Modals state
  const [isAddingSection, setIsAddingSection] = React.useState(false);
  const [newSectionTitleAr, setNewSectionTitleAr] = React.useState('');
  const [newSectionTitleEn, setNewSectionTitleEn] = React.useState('');

  const [addingLessonSectionId, setAddingLessonSectionId] = React.useState<string | null>(null);
  const [newLessonTitleAr, setNewLessonTitleAr] = React.useState('');
  const [newLessonTitleEn, setNewLessonTitleEn] = React.useState('');
  const [newLessonType, setNewLessonType] = React.useState<LessonType>('video');
  const [newLessonDurationMin, setNewLessonDurationMin] = React.useState(10);
  const [newLessonIsFreePreview, setNewLessonIsFreePreview] = React.useState(false);
  const [uploadedAssetId, setUploadedAssetId] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const localizedCourseTitle =
    course.translations.find((t) => t.locale === locale)?.title ||
    course.translations[0]?.title ||
    'Untitled Course';

  // 1. Add Section
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitleAr.trim() && !newSectionTitleEn.trim()) return;

    setIsSubmitting(true);
    const titlePayload = {
      ar: newSectionTitleAr.trim() || newSectionTitleEn.trim(),
      en: newSectionTitleEn.trim() || newSectionTitleAr.trim(),
    };

    try {
      const res = await apiClient<{ section: SectionDto }>(
        `/curriculum/courses/${course.id}/sections`,
        {
          method: 'POST',
          body: JSON.stringify({ title: titlePayload }),
        }
      );
      const updated = [...sections, res.section];
      setSections(updated);
      onUpdateCourse?.({ ...course, sections: updated });
    } catch {
      // Offline fallback
      const demoSec = addDemoSection(course.id, titlePayload);
      if (demoSec) {
        const updated = [...sections, demoSec];
        setSections(updated);
        onUpdateCourse?.({ ...course, sections: updated });
      }
    } finally {
      setIsSubmitting(false);
      setIsAddingSection(false);
      setNewSectionTitleAr('');
      setNewSectionTitleEn('');
    }
  };

  // 2. Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingLessonSectionId) return;
    if (!newLessonTitleAr.trim() && !newLessonTitleEn.trim()) return;

    setIsSubmitting(true);
    const titlePayload = {
      ar: newLessonTitleAr.trim() || newLessonTitleEn.trim(),
      en: newLessonTitleEn.trim() || newLessonTitleAr.trim(),
    };
    const durationSec = Math.max(1, newLessonDurationMin) * 60;

    try {
      const res = await apiClient<{ lesson: LessonDto }>(
        `/curriculum/sections/${addingLessonSectionId}/lessons`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: titlePayload,
            type: newLessonType,
            isFreePreview: newLessonIsFreePreview,
            durationSec,
          }),
        }
      );
      const updated = sections.map((s) => {
        if (s.id === addingLessonSectionId) {
          return {
            ...s,
            lessons: [...(s.lessons || []), res.lesson],
          };
        }
        return s;
      });
      setSections(updated);
      onUpdateCourse?.({ ...course, sections: updated });
    } catch {
      // Offline fallback
      const demoLes = addDemoLesson(addingLessonSectionId, {
        title: titlePayload,
        type: newLessonType,
        isFreePreview: newLessonIsFreePreview,
        durationSec,
      });
      if (demoLes) {
        const updated = sections.map((s) => {
          if (s.id === addingLessonSectionId) {
            return {
              ...s,
              lessons: [...(s.lessons || []), demoLes],
            };
          }
          return s;
        });
        setSections(updated);
        onUpdateCourse?.({ ...course, sections: updated });
      }
    } finally {
      setIsSubmitting(false);
      setAddingLessonSectionId(null);
      setNewLessonTitleAr('');
      setNewLessonTitleEn('');
      setNewLessonType('video');
      setNewLessonDurationMin(10);
      setNewLessonIsFreePreview(false);
      setUploadedAssetId(null);
    }
  };

  // 3. Reorder Sections
  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index]!;
    newSections[index] = newSections[targetIndex]!;
    newSections[targetIndex] = temp;

    newSections.forEach((s, idx) => {
      s.position = idx;
    });

    setSections(newSections);
    onUpdateCourse?.({ ...course, sections: newSections });

    const sectionIds = newSections.map((s) => s.id);
    try {
      await apiClient(`/curriculum/courses/${course.id}/sections/reorder`, {
        method: 'POST',
        body: JSON.stringify({ sectionIds }),
      });
    } catch {
      reorderDemoSections(course.id, sectionIds);
    }
  };

  // 4. Reorder Lessons
  const handleMoveLesson = async (
    sectionId: string,
    lessonIndex: number,
    direction: 'up' | 'down'
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section?.lessons) return;

    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.lessons.length) return;

    const newLessons = [...section.lessons];
    const temp = newLessons[lessonIndex]!;
    newLessons[lessonIndex] = newLessons[targetIndex]!;
    newLessons[targetIndex] = temp;

    newLessons.forEach((l, idx) => {
      l.position = idx;
    });

    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, lessons: newLessons } : s
    );
    setSections(updatedSections);
    onUpdateCourse?.({ ...course, sections: updatedSections });

    const lessonIds = newLessons.map((l) => l.id);
    try {
      await apiClient(`/curriculum/sections/${sectionId}/lessons/reorder`, {
        method: 'POST',
        body: JSON.stringify({ lessonIds }),
      });
    } catch {
      reorderDemoLessons(sectionId, lessonIds);
    }
  };

  // 5. Delete Section
  const handleDeleteSection = async (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId);
    setSections(updated);
    onUpdateCourse?.({ ...course, sections: updated });

    try {
      await apiClient(`/curriculum/sections/${sectionId}`, {
        method: 'DELETE',
      });
    } catch {
      deleteDemoSection(course.id, sectionId);
    }
  };

  // 6. Delete Lesson
  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          lessons: (s.lessons || []).filter((l) => l.id !== lessonId),
        };
      }
      return s;
    });
    setSections(updated);
    onUpdateCourse?.({ ...course, sections: updated });

    try {
      await apiClient(`/curriculum/lessons/${lessonId}`, {
        method: 'DELETE',
      });
    } catch {
      deleteDemoLesson(sectionId, lessonId);
    }
  };

  const getLessonIcon = (type: LessonType) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-primary" />;
      case 'article':
        return <FileText className="h-4 w-4 text-accent" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4 text-sage-600 dark:text-sage-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-e3 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between gap-4 bg-bg-subtle">
          <div className="space-y-1 text-start">
            <div className="flex items-center gap-2">
              <Badge variant="sage" className="uppercase font-mono text-[10px]">
                {course.status}
              </Badge>
              <span className="text-xs text-text-muted uppercase font-mono tracking-wider">
                {course.level}
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-text">
              {localizedCourseTitle}
            </h2>
            <p className="text-xs text-text-muted">
              {tStudio('curriculumEditorSubtitle')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-muted hover:text-text hover:bg-paper-200 dark:hover:bg-paper-800 transition-colors focus-ring"
            aria-label={tStudio('closeEditor')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Ribbon */}
        <div className="px-6 py-3.5 border-b border-border bg-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Layers className="h-4 w-4 text-primary" />
            <span>
              {tStudio('sectionsCount', { count: sections.length })} ·{' '}
              {tStudio('lessonsCount', {
                count: sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0),
              })}
            </span>
          </div>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsAddingSection(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{tStudio('addSectionBtn')}</span>
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section, sIdx) => {
                const sectionTitle =
                  section.title[locale] || section.title.en || section.title.ar || 'Section';
                const isFirstSection = sIdx === 0;
                const isLastSection = sIdx === sections.length - 1;

                return (
                  <div
                    key={section.id}
                    className="rounded-lg border border-border bg-paper-50 dark:bg-card p-5 space-y-4 shadow-sm"
                  >
                    {/* Section Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                          {String(sIdx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-headline text-base font-semibold text-text">
                          {sectionTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isFirstSection}
                          onClick={() => handleMoveSection(sIdx, 'up')}
                          aria-label={tStudio('moveUp')}
                          className="h-8 px-2"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLastSection}
                          onClick={() => handleMoveSection(sIdx, 'down')}
                          aria-label={tStudio('moveDown')}
                          className="h-8 px-2"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                          aria-label={tStudio('deleteSection')}
                          className="h-8 px-2 text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAddingLessonSectionId(section.id)}
                          className="h-8 flex items-center gap-1 text-xs ms-2"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{tStudio('addLessonBtn')}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Lessons List inside Section */}
                    {section.lessons && section.lessons.length > 0 ? (
                      <div className="space-y-2 ps-2 sm:ps-4">
                        {section.lessons.map((lesson, lIdx) => {
                          const lessonTitle =
                            lesson.title[locale] ||
                            lesson.title.en ||
                            lesson.title.ar ||
                            'Lesson';
                          const isFirstLesson = lIdx === 0;
                          const isLastLesson = lIdx === section.lessons!.length - 1;
                          const durationMin = Math.round(lesson.durationSec / 60) || 5;

                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-md border border-border/80 bg-card hover:border-primary/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0 p-1.5 rounded bg-bg-subtle">
                                  {getLessonIcon(lesson.type)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-text truncate">
                                      {lessonTitle}
                                    </span>
                                    {lesson.isFreePreview && (
                                      <Badge
                                        variant="accent"
                                        className="text-[10px] py-0 px-1.5"
                                      >
                                        {tStudio('freePreviewBadge')}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                                    <span className="capitalize">{lesson.type}</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tStudio('durationMin', { minutes: durationMin })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isFirstLesson}
                                  onClick={() => handleMoveLesson(section.id, lIdx, 'up')}
                                  aria-label={tStudio('moveUp')}
                                  className="h-7 w-7 p-0"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isLastLesson}
                                  onClick={() => handleMoveLesson(section.id, lIdx, 'down')}
                                  aria-label={tStudio('moveDown')}
                                  className="h-7 w-7 p-0"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLesson(section.id, lesson.id)}
                                  aria-label={tStudio('deleteLesson')}
                                  className="h-7 w-7 p-0 text-danger hover:bg-danger/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-text-muted bg-card/50 rounded border border-dashed border-border/80">
                        {tStudio('noSectionsYet')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-headline text-lg font-semibold text-text">
                {tStudio('noSectionsYet')}
              </h4>
              <p className="text-xs text-text-muted max-w-sm">
                {tStudio('noSectionsDesc')}
              </p>
              <Button
                variant="accent"
                onClick={() => setIsAddingSection(true)}
                className="flex items-center gap-2 mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>{tStudio('addSectionBtn')}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-subtle flex justify-end">
          <Button variant="primary" onClick={onClose}>
            {tStudio('closeEditor')}
          </Button>
        </div>
      </div>

      {/* Add Section Modal */}
      <Dialog open={isAddingSection} onOpenChange={setIsAddingSection}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStudio('newSectionModalTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSection} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('sectionTitleArLabel')}
              </label>
              <Input
                value={newSectionTitleAr}
                onChange={(e) => setNewSectionTitleAr(e.target.value)}
                placeholder="مثال: الفصل الأول: أساسيات المعمارية"
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('sectionTitleEnLabel')}
              </label>
              <Input
                value={newSectionTitleEn}
                onChange={(e) => setNewSectionTitleEn(e.target.value)}
                placeholder="e.g. Module 1: Architecture Foundations"
                dir="ltr"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddingSection(false)}
              >
                {tStudio('cancelBtn')}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {tStudio('addSectionBtn')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Modal */}
      <Dialog
        open={Boolean(addingLessonSectionId)}
        onOpenChange={(open) => !open && setAddingLessonSectionId(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tStudio('newLessonModalTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLesson} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('lessonTitleArLabel')}
              </label>
              <Input
                value={newLessonTitleAr}
                onChange={(e) => setNewLessonTitleAr(e.target.value)}
                placeholder="مثال: نظرة عامة على الأنظمة المستقلة"
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                {tStudio('lessonTitleEnLabel')}
              </label>
              <Input
                value={newLessonTitleEn}
                onChange={(e) => setNewLessonTitleEn(e.target.value)}
                placeholder="e.g. Overview of Decoupled Systems"
                dir="ltr"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  {tStudio('lessonTypeLabel')}
                </label>
                <select
                  value={newLessonType}
                  onChange={(e) => setNewLessonType(e.target.value as LessonType)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text focus-ring"
                >
                  <option value="video">{tStudio('typeVideo')}</option>
                  <option value="article">{tStudio('typeArticle')}</option>
                  <option value="quiz">{tStudio('typeQuiz')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  {tStudio('durationLabel')}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={newLessonDurationMin}
                  onChange={(e) => setNewLessonDurationMin(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="freePreviewCheck"
                checked={newLessonIsFreePreview}
                onChange={(e) => setNewLessonIsFreePreview(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label
                htmlFor="freePreviewCheck"
                className="text-xs font-medium text-text cursor-pointer select-none"
              >
                {tStudio('freePreviewLabel')}
              </label>
            </div>

            {/* Embedded Video Uploader for Video type */}
            {newLessonType === 'video' && (
              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-xs font-semibold text-text">
                  {tStudio('attachVideoLabel')}
                </label>
                <VideoUploader
                  onUploadSuccess={(assetId) => setUploadedAssetId(assetId)}
                />
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAddingLessonSectionId(null)}
              >
                {tStudio('cancelBtn')}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {tStudio('addLessonBtn')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

