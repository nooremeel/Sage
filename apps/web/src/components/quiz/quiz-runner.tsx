'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trophy,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  getDemoQuizByLessonId,
  evaluateDemoQuizAttempt,
} from '../../lib/demo-courses';
import type { PublicQuizDto, QuizAttemptResultDto } from '@sage/shared';

interface QuizRunnerProps {
  lessonId: string;
  locale: 'ar' | 'en';
  onQuizPassed?: () => void;
}

export function QuizRunner({ lessonId, locale, onQuizPassed }: QuizRunnerProps) {
  const t = useTranslations('Quiz');
  const [quiz, setQuiz] = useState<PublicQuizDto | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptResultDto[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [latestResult, setLatestResult] = useState<QuizAttemptResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchQuizData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let loadedQuiz: PublicQuizDto | null = null;
    let loadedAttempts: QuizAttemptResultDto[] = [];

    // 1. Attempt fetching from NestJS API
    try {
      const { quiz: q } = await apiClient<{ quiz: PublicQuizDto }>(
        `/quizzes/by-lesson/${lessonId}`
      );
      loadedQuiz = q;

      try {
        const { attempts: atts } = await apiClient<{ attempts: QuizAttemptResultDto[] }>(
          `/quizzes/${q.id}/attempts`
        );
        loadedAttempts = atts || [];
      } catch {
        loadedAttempts = [];
      }
    } catch {
      // 2. Fallback to resilient demo dataset
      const demoQ = getDemoQuizByLessonId(lessonId);
      if (demoQ) {
        loadedQuiz = demoQ;
        setIsDemoMode(true);

        try {
          const stored = localStorage.getItem(`sage_quiz_attempts_${demoQ.id}`);
          if (stored) {
            loadedAttempts = JSON.parse(stored);
          }
        } catch {
          loadedAttempts = [];
        }
      }
    }

    if (loadedQuiz) {
      setQuiz(loadedQuiz);
      setAttempts(loadedAttempts);

      // Check if user has already passed
      const passedAttempt = loadedAttempts.find((a) => a.passed);
      if (passedAttempt) {
        setLatestResult(passedAttempt);
      }
    } else {
      setError(t('quizError'));
    }

    setIsLoading(false);
  }, [lessonId, t]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const handleOptionToggle = (questionId: string, optionId: string, isMultiple: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    setError(null);

    let result: QuizAttemptResultDto | null = null;

    if (!isDemoMode) {
      try {
        const res = await apiClient<{ result: QuizAttemptResultDto }>(
          `/quizzes/${quiz.id}/attempts`,
          {
            method: 'POST',
            body: JSON.stringify({ answers: selectedAnswers }),
          }
        );
        result = res.result;
      } catch {
        // Switch to demo evaluation if server rejected or offline
        try {
          result = evaluateDemoQuizAttempt(
            quiz.id,
            selectedAnswers,
            attempts.length + 1
          );
        } catch (err: any) {
          setError(err?.message || 'Submission failed');
        }
      }
    } else {
      try {
        result = evaluateDemoQuizAttempt(
          quiz.id,
          selectedAnswers,
          attempts.length + 1
        );
      } catch (err: any) {
        setError(err?.message || 'Submission failed');
      }
    }

    if (result) {
      setLatestResult(result);
      const nextAttempts = [...attempts, result];
      setAttempts(nextAttempts);

      // Persist in localStorage
      try {
        localStorage.setItem(
          `sage_quiz_attempts_${quiz.id}`,
          JSON.stringify(nextAttempts)
        );
      } catch {
        // ignore
      }

      if (result.passed) {
        // Notify global milestone listeners and parent
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sage:quiz-passed', {
              detail: { lessonId, quizId: quiz.id, score: result.score },
            })
          );
        }
        onQuizPassed?.();
      }
    }

    setIsSubmitting(false);
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setLatestResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border shadow-xs">
        <RefreshCw className="w-8 h-8 text-text-muted animate-spin mb-3" />
        <p className="text-text-muted text-sm font-medium">{t('loadingQuiz')}</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-danger mb-3" />
        <h3 className="text-lg font-headline font-bold text-text mb-1">{t('quizError')}</h3>
        <p className="text-text-muted text-sm mb-4">{error}</p>
        <button
          onClick={fetchQuizData}
          className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors focus-ring"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  const title = (quiz.title as any)[locale] || (quiz.title as any)['en'] || (quiz.title as any)['ar'] || 'Quiz';
  const hasRemainingAttempts =
    quiz.maxAttempts === null || attempts.length < quiz.maxAttempts;

  // View 1: Exhausted attempts screen
  if (latestResult && !latestResult.passed && !hasRemainingAttempts) {
    return (
      <div className="p-8 bg-card rounded-xl border border-danger/40 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-headline font-bold text-text">
            {t('attemptsExhausted')}
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            {t('finalScore', { score: latestResult.score, passing: quiz.passingScore })}
          </p>
        </div>
      </div>
    );
  }

  // View 2: Passed with flying colors
  if (latestResult && latestResult.passed) {
    return (
      <div className="p-8 bg-card rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-accent flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-2xl font-headline font-bold text-text">
            {t('congratulations')}
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            {t('quizPassedDesc', {
              score: latestResult.score,
              passing: quiz.passingScore,
            })}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-success/15 border border-success/30 text-success rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('lessonCompletedBadge')}</span>
        </div>

        {hasRemainingAttempts && (
          <div className="pt-2">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('tryAgain')}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // View 3: Attempt failed, attempts still remain
  if (latestResult && !latestResult.passed && hasRemainingAttempts) {
    return (
      <div className="p-8 bg-card rounded-xl border border-warning/40 bg-warning/5 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-headline font-bold text-text">
            {t('attemptFailed')}
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            {t('attemptFailedDesc', {
              score: latestResult.score,
              passing: quiz.passingScore,
              attemptsLeft: (quiz.maxAttempts ?? 0) - attempts.length,
            })}
          </p>
        </div>

        <button
          onClick={handleRetry}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm focus-ring"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  // View 4: Taking the quiz
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => (selectedAnswers[k] || []).length > 0
  ).length;
  const isAllAnswered = answeredCount === quiz.questions.length;

  return (
    <div className="p-6 md:p-8 bg-card rounded-xl border border-border shadow-sm space-y-6 text-start">
      {/* Quiz Header */}
      <div className="border-b border-border pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-accent/10 text-accent">
            <HelpCircle className="w-4 h-4" />
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-accent">
            Academic Assessment
          </span>
        </div>

        <h2 className="text-2xl font-headline font-bold text-text rtl:leading-snug">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1 font-mono">
            <Award className="w-3.5 h-3.5 text-accent" />
            <span>{t('passingRequirement', { score: quiz.passingScore })}</span>
          </span>
          <span>•</span>
          <span className="font-mono">
            {quiz.maxAttempts
              ? t('attemptsLimit', {
                  current: attempts.length + 1,
                  max: quiz.maxAttempts,
                })
              : t('unlimitedAttempts')}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-md text-danger text-xs font-medium">
          {error}
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {quiz.questions.map((q, qIndex) => {
          const prompt =
            (q.prompt as any)[locale] ||
            (q.prompt as any)['en'] ||
            (q.prompt as any)['ar'] ||
            '';
          const isMultiple = q.type === 'multiple_choice';
          const selectedForQ = selectedAnswers[q.id] || [];

          return (
            <div
              key={q.id}
              className="p-5 rounded-lg bg-bg-subtle/50 border border-border/80 space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-base font-medium text-text rtl:leading-normal">
                    {prompt}
                  </h4>
                  <p className="text-[11px] text-text-muted font-medium">
                    {isMultiple ? t('selectMultiple') : t('selectSingle')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 ps-9">
                {q.options.map((opt) => {
                  const optText =
                    (opt.text as any)[locale] ||
                    (opt.text as any)['en'] ||
                    (opt.text as any)['ar'] ||
                    '';
                  const isSelected = selectedForQ.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium shadow-2xs dark:border-primary/60 dark:bg-primary/20'
                          : 'border-border bg-card hover:bg-bg-subtle text-text'
                      }`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`question_${q.id}`}
                        checked={isSelected}
                        onChange={() => handleOptionToggle(q.id, opt.id, isMultiple)}
                        className="w-4 h-4 text-primary border-border focus-ring cursor-pointer accent-primary"
                        aria-label={optText}
                      />
                      <span className="text-xs sm:text-sm select-none rtl:leading-normal">
                        {optText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Footer */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-text-muted font-mono">
          {answeredCount} / {quiz.questions.length} answered
        </span>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || answeredCount === 0}
          className="w-full sm:w-auto px-6 py-2.5 bg-accent text-on-accent font-semibold rounded-md text-xs hover:opacity-95 disabled:opacity-50 transition-all shadow-sm focus-ring flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('evaluating')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('submitQuiz')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
