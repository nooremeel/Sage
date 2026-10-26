'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Video, FileText, HelpCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface LessonItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz';
  duration: string;
  isFreePreview?: boolean;
  isCompleted?: boolean;
}

export interface SectionItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

export interface CurriculumAccordionProps {
  sections: SectionItem[];
  className?: string;
}

export function CurriculumAccordion({ sections, className }: CurriculumAccordionProps) {
  const lessonIcons = {
    video: <Video className="h-4 w-4 text-blue-700 dark:text-primary shrink-0" />,
    article: <FileText className="h-4 w-4 text-ink-600 dark:text-text-muted shrink-0" />,
    quiz: <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />,
  };

  return (
    <AccordionPrimitive.Root
      type="multiple"
      defaultValue={[sections[0]?.id || '']}
      className={cn('w-full rounded-lg border border-border bg-card divide-y divide-border text-start', className)}
    >
      {sections.map((section) => (
        <AccordionPrimitive.Item key={section.id} value={section.id} className="overflow-hidden">
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              className={cn(
                'flex flex-1 items-center justify-between p-4 font-headline text-base font-semibold text-text transition-colors hover:bg-bg-subtle focus-ring',
                '[&[data-state=open]>svg]:rotate-180'
              )}
            >
              <span>{section.title}</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-text-muted" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="divide-y divide-border/60 bg-bg-subtle/50">
              {section.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3.5 ps-6 transition-colors hover:bg-bg-subtle"
                >
                  <div className="flex items-center gap-3">
                    {lessonIcons[lesson.type]}
                    <span className="text-sm font-medium text-text">{lesson.title}</span>
                    {lesson.isFreePreview && (
                      <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                        Free Preview
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{lesson.duration}</span>
                    {lesson.isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-sage-700 dark:text-sage-300" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-border" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
