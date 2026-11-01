'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CheckCheck, Loader2, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useRealtimeStream } from '../../hooks/use-realtime-stream';
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

  // 1. Initial unread count fetch
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient<{ count: number }>('/notifications/unread-count');
      setUnreadCount(res.count);
    } catch {
      // ignore
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
      setIsLoading(true);
      try {
        const res = await apiClient<{ items: NotificationDto[] }>('/notifications');
        setNotifications(res.items);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 4. Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch {
      // ignore
    }
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

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
        aria-label={t('notifications')}
        className="relative p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-paper-200 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-rule shadow-lg z-50 overflow-hidden text-start">
          <div className="flex items-center justify-between p-3.5 border-b border-rule bg-paper/40">
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
              {t('notifications')}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-blue-700 hover:underline font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('markAllAsRead')}</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-rule/60">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-ink-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-600">
                <p>{t('noNotifications')}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors ${
                      isUnread ? 'bg-blue-100/20 font-medium' : 'hover:bg-paper/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-full bg-paper-200 text-ink-900 mt-0.5 shrink-0">
                        {n.type === 'qa_reply' ? (
                          <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-sage-700" />
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <p className="text-ink-900 line-clamp-2">
                          <span className="font-bold">{n.payload?.authorName || 'Sage'}: </span>
                          <span>
                            {n.payload?.title || n.payload?.textSnippet || 'New update'}
                          </span>
                        </p>
                        <span className="text-[10px] text-ink-600 block">
                          {new Date(n.createdAt).toLocaleDateString(locale, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
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
