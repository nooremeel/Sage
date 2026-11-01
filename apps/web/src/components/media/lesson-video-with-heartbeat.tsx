'use client';

import React from 'react';
import { VideoPlayer } from './video-player';
import { useProgressHeartbeat } from '../../hooks/use-progress-heartbeat';

interface LessonVideoWithHeartbeatProps {
  manifestUrl: string;
  lessonId: string;
  durationSec?: number;
  posterUrl?: string;
}

export function LessonVideoWithHeartbeat({
  manifestUrl,
  lessonId,
  durationSec = 0,
  posterUrl,
}: LessonVideoWithHeartbeatProps) {
  const { handleTimeUpdate, handlePause, handleEnded } = useProgressHeartbeat({
    lessonId,
    durationSec,
  });

  return (
    <VideoPlayer
      manifestUrl={manifestUrl}
      lessonId={lessonId}
      posterUrl={posterUrl}
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePause}
      onEnded={handleEnded}
    />
  );
}
