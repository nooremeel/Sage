'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import type { QAThreadDto, QAMessageDto } from '@sage/shared';

interface QASectionProps {
  lessonId: string;
  locale: 'ar' | 'en';
}

export function QASection({ lessonId, locale }: QASectionProps) {
  const t = useTranslations('QA');
  const { user } = useAuth();

  const [threads, setThreads] = useState<QAThreadDto[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, QAMessageDto[]>>({});
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Form states
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      const res = await apiClient<{ threads: QAThreadDto[] }>(`/qa/lessons/${lessonId}`);
      setThreads(res.threads);
    } catch {
      // Unenrolled or error
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
        // Handle error
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

    try {
      const res = await apiClient<{ thread: QAThreadDto }>(
        `/qa/lessons/${lessonId}/threads`,
        {
          method: 'POST',
          body: JSON.stringify({ title: threadTitle, content: threadContent }),
        }
      );

      // Optimistic update
      setThreads((prev) => {
        if (prev.some((th) => th.id === res.thread.id)) return prev;
        return [res.thread, ...prev];
      });

      setThreadTitle('');
      setThreadContent('');
      setShowNewThreadForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit reply message
  const handlePostReply = async (threadId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient<{ message: QAMessageDto }>(
        `/qa/threads/${threadId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: replyText }),
        }
      );

      // Optimistic append
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

      setReplyText('');
    } catch (err: any) {
      setError(err.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-rule/60 text-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-700" />
          <h3 className="font-serif text-xl font-bold text-ink-900">{t('discussionTitle')}</h3>
          <span className="text-xs bg-paper-200 text-ink-600 px-2 py-0.5 rounded-full font-mono">
            {threads.length}
          </span>
        </div>

        {user && (
          <button
            onClick={() => setShowNewThreadForm((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 hover:bg-rule text-ink-900 rounded-lg text-xs font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-blue-700" />
            <span>{showNewThreadForm ? t('cancel') : t('askQuestion')}</span>
          </button>
        )}
      </div>

      {/* New Question Form */}
      {showNewThreadForm && (
        <form
          onSubmit={handleCreateThread}
          className="p-5 bg-surface rounded-xl border border-rule shadow-sm space-y-4"
        >
          <h4 className="text-sm font-semibold text-ink-900">{t('newQuestionTitle')}</h4>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-600">{t('questionSubject')}</label>
            <input
              type="text"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-rule focus:outline-none focus:ring-1 focus:ring-blue-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-600">{t('questionDetails')}</label>
            <textarea
              rows={3}
              value={threadContent}
              onChange={(e) => setThreadContent(e.target.value)}
              placeholder={t('detailsPlaceholder')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-rule focus:outline-none focus:ring-1 focus:ring-blue-700"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{t('postQuestion')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Threads List */}
      {isLoadingThreads ? (
        <div className="p-8 text-center text-xs text-ink-600">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-ink-600" />
          <span>{t('loadingDiscussions')}</span>
        </div>
      ) : threads.length === 0 ? (
        <div className="p-8 bg-surface rounded-xl border border-rule text-center space-y-2">
          <p className="text-sm font-serif text-ink-900">{t('noQuestionsYet')}</p>
          <p className="text-xs text-ink-600">{t('noQuestionsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((th) => {
            const isExpanded = selectedThreadId === th.id;
            const threadReplies = messages[th.id] || [];

            return (
              <div
                key={th.id}
                className="bg-surface rounded-xl border border-rule transition-all overflow-hidden"
              >
                {/* Thread Card Header */}
                <div
                  onClick={() => handleToggleThread(th.id)}
                  className="p-4 cursor-pointer hover:bg-paper/40 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-sm text-ink-900">{th.title}</h4>
                      {th.hasInstructorAnswer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sage-300/30 text-sage-700 text-[10px] font-medium rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('instructorAnswered')}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-600 line-clamp-2">{th.content}</p>

                    <div className="flex items-center gap-3 text-[11px] text-ink-600/80 pt-1">
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

                  <div className="text-ink-600 pt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Thread Messages */}
                {isExpanded && (
                  <div className="border-t border-rule/60 bg-paper/20 p-4 space-y-4">
                    {isLoadingMessages ? (
                      <div className="py-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto text-ink-600" />
                      </div>
                    ) : (
                      <div className="space-y-3 ps-3 border-s-2 border-rule">
                        {threadReplies.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg text-xs space-y-1.5 ${
                              msg.isInstructorAnswer
                                ? 'bg-sage-300/20 border border-sage-700/20'
                                : 'bg-white border border-rule/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-ink-900">{msg.authorName}</span>
                                {msg.isInstructorAnswer && (
                                  <span className="px-1.5 py-0.2 bg-sage-700 text-white text-[9px] rounded font-bold uppercase tracking-wider">
                                    {t('instructorBadge')}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-ink-600">
                                {new Date(msg.createdAt).toLocaleTimeString(locale, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-ink-900 leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {user && (
                      <form onSubmit={(e) => handlePostReply(th.id, e)} className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={t('writeReplyPlaceholder')}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rule focus:outline-none focus:ring-1 focus:ring-blue-700 bg-white"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-3 py-1.5 bg-ink-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>{t('reply')}</span>
                        </button>
                      </form>
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

