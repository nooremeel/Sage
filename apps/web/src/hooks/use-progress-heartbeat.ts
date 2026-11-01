'use client';

import { useRef, useCallback, useState } from 'react';
import { apiClient } from '../lib/api';
import type { LessonProgressDto, CourseProgressDto } from '@sage/shared';

interface UseProgressHeartbeatOptions {
  lessonId: string;
  durationSec?: number;
  onCompleted?: () => void;
}

export function useProgressHeartbeat({
  lessonId,
  durationSec = 0,
  onCompleted,
}: UseProgressHeartbeatOptions) {
  const lastReportedTimeRef = useRef<number>(0);
  const lastReportedPosRef = useRef<number>(-1);
  const [isCompleted, setIsCompleted] = useState(false);

  const sendHeartbeat = useCallback(
    async (positionSec: number, forceComplete = false) => {
      try {
        const roundedPos = Math.floor(positionSec);
        const roundedDur = Math.floor(durationSec);

        const res = await apiClient<{
          progress: LessonProgressDto;
          courseProgress: CourseProgressDto;
        }>('/progress/heartbeat', {
          method: 'POST',
          body: JSON.stringify({
            lessonId,
            positionSec: roundedPos,
            durationSec: roundedDur > 0 ? roundedDur : undefined,
            completed: forceComplete ? true : undefined,
          }),
        });

        if (res.progress.completedAt) {
          setIsCompleted(true);
          onCompleted?.();
        }
      } catch (err) {
        // Silently catch heartbeat errors to avoid disrupting playback
        console.warn('Progress heartbeat failed:', err);
      }
    },
    [lessonId, durationSec, onCompleted]
  );

  const handleTimeUpdate = useCallback(
    (currentTime: number, currentDuration: number) => {
      const now = Date.now();
      const roundedPos = Math.floor(currentTime);

      // Save every 15 seconds when playing
      if (now - lastReportedTimeRef.current >= 15000) {
        lastReportedTimeRef.current = now;
        lastReportedPosRef.current = roundedPos;
        sendHeartbeat(roundedPos);
      }
    },
    [sendHeartbeat]
  );

  const handlePause = useCallback(
    (currentTime: number) => {
      // Save immediately on pause
      const roundedPos = Math.floor(currentTime);
      if (roundedPos !== lastReportedPosRef.current) {
        lastReportedTimeRef.current = Date.now();
        lastReportedPosRef.current = roundedPos;
        sendHeartbeat(roundedPos);
      }
    },
    [sendHeartbeat]
  );

  const handleEnded = useCallback(() => {
    // Save on video ended with completed: true
    sendHeartbeat(durationSec, true);
  }, [sendHeartbeat, durationSec]);

  return {
    handleTimeUpdate,
    handlePause,
    handleEnded,
    isCompleted,
  };
}

