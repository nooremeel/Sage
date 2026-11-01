'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api';
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

  const fetchQuizData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { quiz: q } = await apiClient<{ quiz: PublicQuizDto }>(
        `/quizzes/by-lesson/${lessonId}`
      );
      setQuiz(q);

      const { attempts: atts } = await apiClient<{ attempts: QuizAttemptResultDto[] }>(
        `/quizzes/${q.id}/attempts`
      );
      setAttempts(atts);

      // If user has already passed
      const passedAttempt = atts.find((a) => a.passed);
      if (passedAttempt) {
        setLatestResult(passedAttempt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

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

    try {
      const { result } = await apiClient<{ result: QuizAttemptResultDto }>(
        `/quizzes/${quiz.id}/attempts`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: selectedAnswers }),
        }
      );

      setLatestResult(result);
      setAttempts((prev) => [...prev, result]);

      if (result.passed) {
        onQuizPassed?.();
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setLatestResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-rule">
        <RefreshCw className="w-8 h-8 text-ink-600 animate-spin mb-3" />
        <p className="text-ink-600 text-sm">{t('loadingQuiz')}</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl border border-rule text-center">
        <AlertCircle className="w-10 h-10 text-danger mb-3" />
        <h3 className="text-lg font-serif text-ink-900 mb-1">{t('quizError')}</h3>
        <p className="text-ink-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchQuizData}
          className="px-4 py-2 bg-paper-200 text-ink-900 rounded-lg text-sm font-medium hover:bg-rule transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  const title = (quiz.title as any)[locale] || (quiz.title as any)['en'] || (quiz.title as any)['ar'];
  const hasRemainingAttempts =
    quiz.maxAttempts === null || attempts.length < quiz.maxAttempts;

  // View: Completed / Evaluated Screen
  if (latestResult && !latestResult.passed && !hasRemainingAttempts) {
    return (
      <div className="p-8 bg-surface rounded-xl border border-danger/30 text-center">
        <XCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h3 className="text-xl font-serif text-ink-900 mb-1">{t('attemptsExhausted')}</h3>
        <p className="text-ink-600 text-sm mb-4">
          {t('finalScore', { score: latestResult.score, passing: quiz.passingScore })}
        </p>
      </div>
    );
  }

  if (latestResult && latestResult.passed) {
    return (
      <div className="p-8 bg-surface rounded-xl border border-sage-700/30 text-center">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-xl font-serif text-ink-900 mb-1">{t('congratulations')}</h3>
        <p className="text-ink-600 text-sm mb-2">
          {t('quizPassedDesc', { score: latestResult.score, passing: quiz.passingScore })}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-300/30 text-sage-700 rounded-full text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('lessonCompletedBadge')}</span>
        </div>
      </div>
    );
  }

  if (latestResult && !latestResult.passed && hasRemainingAttempts) {
    return (
      <div className="p-8 bg-surface rounded-xl border border-warning/30 text-center">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
        <h3 className="text-xl font-serif text-ink-900 mb-1">{t('attemptFailed')}</h3>
        <p className="text-ink-600 text-sm mb-4">
          {t('attemptFailedDesc', {
            score: latestResult.score,
            passing: quiz.passingScore,
            attemptsLeft: (quiz.maxAttempts ?? 0) - attempts.length,
          })}
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2.5 bg-ink-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  // View: Taking Quiz
  return (
    <div className="p-6 md:p-8 bg-surface rounded-xl border border-rule shadow-sm">
      <div className="border-b border-rule pb-4 mb-6">
        <h2 className="text-2xl font-serif text-ink-900 mb-2">{title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600">
          <span>{t('passingRequirement', { score: quiz.passingScore })}</span>
          <span>•</span>
          <span>
            {quiz.maxAttempts
              ? t('attemptsLimit', { current: attempts.length + 1, max: quiz.maxAttempts })
              : t('unlimitedAttempts')}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {quiz.questions.map((q, qIndex) => {
          const prompt =
            (q.prompt as any)[locale] || (q.prompt as any)['en'] || (q.prompt as any)['ar'];
          const isMultiple = q.type === 'multiple_choice';
          const selectedForQ = selectedAnswers[q.id] || [];

          return (
            <div key={q.id} className="p-4 rounded-lg bg-paper/50 border border-rule/60">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <div>
                  <h4 className="text-base font-medium text-ink-900">{prompt}</h4>
                  <p className="text-xs text-ink-600 mt-0.5">
                    {isMultiple ? t('selectMultiple') : t('selectSingle')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 ps-9">
                {q.options.map((opt) => {
                  const optText =
                    (opt.text as any)[locale] ||
                    (opt.text as any)['en'] ||
                    (opt.text as any)['ar'];
                  const isSelected = selectedForQ.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      onClick={() => handleOptionToggle(q.id, opt.id, isMultiple)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-700 bg-blue-100/30 text-ink-900 font-medium'
                          : 'border-rule/80 bg-white hover:bg-paper-200/40 text-ink-900'
                      }`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`question_${q.id}`}
                        checked={isSelected}
                        onChange={() => {}} // handled by label click
                        className="w-4 h-4 text-blue-700 border-rule focus:ring-blue-700"
                      />
                      <span className="text-sm select-none">{optText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-rule flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(selectedAnswers).length === 0}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-500/90 disabled:opacity-50 text-ink-900 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          {isSubmitting ? t('evaluating') : t('submitQuiz')}
        </button>
      </div>
    </div>
  );
}

