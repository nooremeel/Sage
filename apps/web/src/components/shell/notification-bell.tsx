'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CheckCheck, Loader2, MessageSquare, BookOpen, Award, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useRealtimeStream } from '../../hooks/use-realtime-stream';
import { getDemoNotifications, markAllDemoNotificationsRead, markDemoNotificationRead } from '../../lib/demo-courses';
import { Link } from '@/i18n/routing';
import type { NotificationDto } from '@sage/shared';

interface NotificationBellProps {
  locale: 'ar' | 'en';
}

export function NotificationBell({ locale }: NotificationBellProps) {
  const t = useTranslations('Notifications');
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Initial unread count fetch with offline fallback
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    try {
      const res = await apiClient<{ count: number }>('/notifications/unread-count');
      setUnreadCount(res.count);
    } catch {
      // Fallback to demo notifications when backend is offline
      const demoList = getDemoNotifications(user.id);
      setUnreadCount(demoList.filter((n) => !n.readAt).length);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // 2. Real-time stream for instant notification updates
  useRealtimeStream({
    enabled: !!user,
    onEvent: (event, data) => {
      if (event === 'new_notification') {
        const notif = data as NotificationDto;
        setUnreadCount((c) => c + 1);
        setNotifications((prev) => [notif, ...prev]);
      }
    },
  });

  // 3. Load notifications when dropdown opens
  const handleToggleOpen = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && notifications.length === 0) {
      if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient<{ items: NotificationDto[] }>('/notifications');
        if (res.items && res.items.length > 0) {
          setNotifications(res.items);
        } else {
          setNotifications(getDemoNotifications(user.id));
        }
      } catch {
        setNotifications(getDemoNotifications(user.id));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 4. Mark all as read
  const handleMarkAllRead = async () => {
    if (user) {
      try {
        await apiClient('/notifications/read-all', { method: 'PATCH' });
      } catch {
        // offline fallback
      }
    }
    markAllDemoNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
  };

  // 5. Mark single notification as read on click
  const handleMarkOneRead = async (id: string) => {
    if (user) {
      try {
        await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      } catch {
        // offline fallback
      }
    }
    markDemoNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
        aria-label={t('notifications')}
        data-testid="notification-bell-btn"
        className="relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-subtle transition-colors focus-ring"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute top-1 end-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-on-accent bg-accent rounded-full animate-in zoom-in-50 duration-200"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          data-testid="notification-dropdown"
          className="absolute end-0 mt-2 w-80 sm:w-96 bg-card rounded-xl border border-border shadow-e3 z-50 overflow-hidden text-start animate-in fade-in-50 slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-bg-subtle/50">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                {t('notifications')}
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                data-testid="mark-all-read-btn"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium focus-ring rounded-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('markAllAsRead')}</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-text-muted" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                <p>{t('noNotifications')}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const linkHref =
                  n.type === 'qa_reply' && n.payload?.courseSlug && n.payload?.lessonId
                    ? `/courses/${n.payload.courseSlug}/lessons/${n.payload.lessonId}`
                    : n.payload?.serial
                    ? `/verify/${n.payload.serial}`
                    : null;

                const content = (
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-full bg-bg-subtle text-text mt-0.5 shrink-0">
                      {n.type === 'qa_reply' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      ) : n.type === 'quiz_graded' ? (
                        <Award className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-sage-700 dark:text-sage-300" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-text font-semibold truncate text-[11px]">
                          {n.payload?.authorName || 'Sage Platform'}
                        </p>
                        {linkHref && (
                          <ArrowUpRight className="w-3 h-3 text-text-muted shrink-0 rtl:-scale-x-100" />
                        )}
                      </div>
                      <p className="text-text font-medium line-clamp-1 text-xs">
                        {n.payload?.title || 'Notification update'}
                      </p>
                      {n.payload?.textSnippet && (
                        <p className="text-[11px] text-text-muted line-clamp-2">
                          {n.payload.textSnippet}
                        </p>
                      )}
                      <span className="text-[10px] text-text-muted block pt-0.5">
                        {new Date(n.createdAt).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );

                if (linkHref) {
                  return (
                    <Link
                      key={n.id}
                      href={linkHref}
                      onClick={() => {
                        if (isUnread) handleMarkOneRead(n.id);
                        setIsOpen(false);
                      }}
                      data-testid="notification-item"
                      className={`block p-3 text-xs transition-colors hover:bg-bg-subtle/70 ${
                        isUnread ? 'bg-primary-tint/30 font-medium' : ''
                      }`}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (isUnread) handleMarkOneRead(n.id);
                    }}
                    data-testid="notification-item"
                    className={`p-3 text-xs transition-colors cursor-pointer ${
                      isUnread ? 'bg-primary-tint/30 font-medium' : 'hover:bg-bg-subtle/50'
                    }`}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
