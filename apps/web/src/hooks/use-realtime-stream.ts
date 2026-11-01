'use client';

import { useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface UseRealtimeStreamOptions {
  channels?: string[];
  enabled?: boolean;
  onEvent?: (event: string, data: any) => void;
}

export function useRealtimeStream({
  channels = [],
  enabled = true,
  onEvent,
}: UseRealtimeStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const channelQuery = channels.length > 0 ? `?channel=${encodeURIComponent(channels.join(','))}` : '';
    const url = `${API_BASE_URL}/realtime/events${channelQuery}`;

    // EventSource with credentials
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      if (e.lastEventId) {
        lastEventIdRef.current = e.lastEventId;
      }
    };

    // Generic event listeners
    const handleCustomEvent = (eventName: string) => (e: MessageEvent) => {
      if (e.lastEventId) {
        lastEventIdRef.current = e.lastEventId;
      }
      try {
        const data = JSON.parse(e.data);
        onEventRef.current?.(eventName, data);
      } catch {
        onEventRef.current?.(eventName, e.data);
      }
    };

    const trackedEvents = [
      'new_qa_thread',
      'new_qa_message',
      'new_notification',
      'transcode_progress',
    ];

    for (const evt of trackedEvents) {
      es.addEventListener(evt, handleCustomEvent(evt));
    }

    es.onerror = () => {
      // EventSource automatically reconnects, but if failed closed we can retry
      if (es.readyState === EventSource.CLOSED) {
        setTimeout(connect, 5000);
      }
    };
  }, [channels, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);
}

