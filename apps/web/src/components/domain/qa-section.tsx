'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  PlusCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useRealtimeStream } from '../../hooks/use-realtime-stream';
import {
  getDemoQAThreads,
  getDemoQAMessages,
  addDemoQAThread,
  addDemoQAMessage,
} from '@/lib/demo-courses';
import type { QAThreadDto, QAMessageDto } from '@sage/shared';
import { cn } from '@/lib/utils';

interface QASectionProps {
  lessonId: string;
  locale: 'ar' | 'en';
}

export function QASection({ lessonId, locale }: QASectionProps) {
  const t = useTranslations('QA');
  const { user } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<QAThreadDto[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, QAMessageDto[]>>({});
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filter tabs: 'all' vs 'answered'
  const [activeFilter, setActiveFilter] = useState<'all' | 'answered'>('all');

  // Form states
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch threads with resilient fallback
  const fetchThreads = useCallback(async () => {
    try {
      const res = await apiClient<{ threads: QAThreadDto[] }>(`/qa/lessons/${lessonId}`);
      if (res.threads && res.threads.length > 0) {
        setThreads(res.threads);
      } else {
        setThreads(getDemoQAThreads(lessonId));
      }
    } catch {
      // Offline fallback: load seeded scholarly threads
      setThreads(getDemoQAThreads(lessonId));
    } finally {
      setIsLoadingThreads(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // 2. Real-time stream handling
  useRealtimeStream({
    channels: [`lesson:${lessonId}`],
    enabled: true,
    onEvent: (event, data) => {
      if (event === 'new_qa_thread') {
        const newThread = data as QAThreadDto;
        setThreads((prev) => {
          if (prev.some((th) => th.id === newThread.id)) return prev;
          return [newThread, ...prev];
        });
      } else if (event === 'new_qa_message') {
        const newMsg = data as QAMessageDto;
        // Update thread counters
        setThreads((prev) =>
          prev.map((th) => {
            if (th.id === newMsg.threadId) {
              return {
                ...th,
                messagesCount: th.messagesCount + 1,
                hasInstructorAnswer: th.hasInstructorAnswer || newMsg.isInstructorAnswer,
              };
            }
            return th;
          })
        );
        // Append message to open thread
        setMessages((prev) => {
          const threadMsgs = prev[newMsg.threadId] || [];
          if (threadMsgs.some((m) => m.id === newMsg.id)) return prev;
          return { ...prev, [newMsg.threadId]: [...threadMsgs, newMsg] };
        });
      }
    },
  });

  // 3. Load thread replies when expanded
  const handleToggleThread = async (threadId: string) => {
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
      return;
    }

    setSelectedThreadId(threadId);
    if (!messages[threadId]) {
      setIsLoadingMessages(true);
      try {
        const res = await apiClient<{ messages: QAMessageDto[] }>(`/qa/threads/${threadId}`);
        setMessages((prev) => ({ ...prev, [threadId]: res.messages }));
      } catch {
        // Offline fallback: load thread messages from demo store
        setMessages((prev) => ({ ...prev, [threadId]: getDemoQAMessages(threadId) }));
      } finally {
        setIsLoadingMessages(false);
      }
    }
  };

  // 4. Submit new thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim() || !threadContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const author = {
      id: user?.id || 'usr-student-001',
      name: user?.email ? user.email.split('@')[0] : 'Zaid Al-Harbi',
    };

    try {
      const res = await apiClient<{ thread: QAThreadDto }>(
        `/qa/lessons/${lessonId}/threads`,
        {
          method: 'POST',
          body: JSON.stringify({ title: threadTitle, content: threadContent }),
        }
      );

      setThreads((prev) => {
        if (prev.some((th) => th.id === res.thread.id)) return prev;
        return [res.thread, ...prev];
      });
    } catch {
      // Offline fallback: optimistically create thread
      const created = addDemoQAThread(lessonId, threadTitle, threadContent, author);
      setThreads((prev) => [created, ...prev]);
    } finally {
      setThreadTitle('');
      setThreadContent('');
      setShowNewThreadForm(false);
      setIsSubmitting(false);
    }
  };

  // 5. Submit reply message
  const handlePostReply = async (threadId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const author = {
      id: user?.id || 'usr-student-001',
      name: user?.email ? user.email.split('@')[0] : 'Scholar Student',
      role: user?.role || 'student',
    };

    try {
      const res = await apiClient<{ message: QAMessageDto }>(
        `/qa/threads/${threadId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: replyText }),
        }
      );

      setMessages((prev) => {
        const threadMsgs = prev[threadId] || [];
        if (threadMsgs.some((m) => m.id === res.message.id)) return prev;
        return { ...prev, [threadId]: [...threadMsgs, res.message] };
      });

      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? {
                ...th,
                messagesCount: th.messagesCount + 1,
                hasInstructorAnswer: th.hasInstructorAnswer || res.message.isInstructorAnswer,
              }
            : th
        )
      );
    } catch {
      // Offline fallback: optimistically add reply message
      const createdMsg = addDemoQAMessage(threadId, replyText, author);
      setMessages((prev) => {
        const threadMsgs = prev[threadId] || [];
        return { ...prev, [threadId]: [...threadMsgs, createdMsg] };
      });
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? {
                ...th,
                messagesCount: th.messagesCount + 1,
                hasInstructorAnswer: th.hasInstructorAnswer || createdMsg.isInstructorAnswer,
              }
            : th
        )
      );
    } finally {
      setReplyText('');
      setIsSubmitting(false);
    }
  };

  const filteredThreads = activeFilter === 'answered'
    ? threads.filter((th) => th.hasInstructorAnswer)
    : threads;

  return (
    <div className="space-y-6 pt-6 border-t border-border/60 text-start">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-headline text-xl font-bold text-text">{t('discussionTitle')}</h3>
          <span className="text-xs bg-bg-subtle text-text-muted px-2 py-0.5 rounded-full font-mono">
            {threads.length}
          </span>
        </div>

        <button
          onClick={() => {
            if (!user) {
              router.push('/login');
              return;
            }
            setShowNewThreadForm((prev) => !prev);
          }}
          data-testid="ask-question-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-subtle hover:bg-border text-text rounded-lg text-xs font-medium transition-colors focus-ring"
        >
          <PlusCircle className="w-4 h-4 text-primary" />
          <span>{showNewThreadForm ? t('cancel') : t('askQuestion')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          data-testid="tab-all-questions"
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors focus-ring',
            activeFilter === 'all'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          )}
        >
          {t('allQuestions')} ({threads.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('answered')}
          data-testid="tab-answered-questions"
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 focus-ring',
            activeFilter === 'answered'
              ? 'bg-primary text-on-primary'
              : 'text-text-muted hover:text-text hover:bg-bg-subtle'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('instructorAnsweredTab')}</span>
          <span>({threads.filter((th) => th.hasInstructorAnswer).length})</span>
        </button>
      </div>

      {/* New Question Form */}
      {showNewThreadForm && (
        <form
          onSubmit={handleCreateThread}
          data-testid="new-question-form"
          className="p-5 bg-card rounded-xl border border-border shadow-sm space-y-4"
        >
          <h4 className="text-sm font-semibold text-text">{t('newQuestionTitle')}</h4>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="space-y-1">
            <label htmlFor="qa-subject" className="text-xs font-medium text-text-muted">
              {t('questionSubject')}
            </label>
            <input
              id="qa-subject"
              type="text"
              data-testid="new-thread-title-input"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text focus-ring"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="qa-details" className="text-xs font-medium text-text-muted">
              {t('questionDetails')}
            </label>
            <textarea
              id="qa-details"
              rows={3}
              data-testid="new-thread-content-input"
              value={threadContent}
              onChange={(e) => setThreadContent(e.target.value)}
              placeholder={t('detailsPlaceholder')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text focus-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="post-question-btn"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary text-xs font-medium rounded-lg transition-colors focus-ring"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t('postQuestion')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Threads List */}
      {isLoadingThreads ? (
        <div className="p-8 text-center text-xs text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-text-muted" />
          <span>{t('loadingDiscussions')}</span>
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="p-8 bg-card rounded-xl border border-border text-center space-y-2">
          <p className="text-sm font-headline text-text">
            {activeFilter === 'answered' ? t('emptyFilterMessage') : t('noQuestionsYet')}
          </p>
          <p className="text-xs text-text-muted">{t('noQuestionsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map((th) => {
            const isExpanded = selectedThreadId === th.id;
            const threadReplies = messages[th.id] || [];

            return (
              <div
                key={th.id}
                data-testid="qa-thread-item"
                className="bg-card rounded-xl border border-border transition-all overflow-hidden"
              >
                {/* Thread Card Header */}
                <div
                  onClick={() => handleToggleThread(th.id)}
                  className="p-4 cursor-pointer hover:bg-bg-subtle/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-sm text-text">{th.title}</h4>
                      {th.hasInstructorAnswer && (
                        <span
                          data-testid="verified-instructor-badge"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded-md border border-accent/30"
                        >
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span>{t('verifiedInstructor')}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {th.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-text-muted/80 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{th.authorName}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(th.createdAt).toLocaleDateString(locale)}</span>
                      <span>•</span>
                      <span>
                        {th.messagesCount} {t('replies')}
                      </span>
                    </div>
                  </div>

                  <div className="text-text-muted pt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Thread Messages */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-bg-subtle/30 p-4 space-y-4">
                    {isLoadingMessages ? (
                      <div className="py-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto text-text-muted" />
                      </div>
                    ) : (
                      <div className="space-y-3 ps-3 border-s-2 border-border">
                        {threadReplies.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              'p-3.5 rounded-lg text-xs space-y-1.5',
                              msg.isInstructorAnswer
                                ? 'bg-accent/10 border border-accent/30'
                                : 'bg-card border border-border/60'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-text">{msg.authorName}</span>
                                {msg.isInstructorAnswer && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent text-on-accent text-[9px] rounded font-bold uppercase tracking-wider">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{t('verifiedInstructor')}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-text-muted">
                                {new Date(msg.createdAt).toLocaleTimeString(locale, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-text leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {user ? (
                      <form
                        onSubmit={(e) => handlePostReply(th.id, e)}
                        className="flex gap-2 pt-2"
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t('writeReplyPlaceholder')}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text focus-ring"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-1 focus-ring"
                        >
                          <Send className="w-3 h-3" />
                          <span>{t('reply')}</span>
                        </button>
                      </form>
                    ) : (
                      <div className="pt-2 text-xs text-text-muted">
                        <Link href="/login" className="text-primary hover:underline font-medium">
                          {locale === 'ar' ? 'سجّل الدخول للرد على هذا السؤال' : 'Sign in to reply to this discussion'}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
