'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Check,
  Radio,
} from 'lucide-react';
import { DEMO_STREAM_URL } from '@/lib/demo-courses';

interface VideoPlayerProps {
  manifestUrl: string;
  posterUrl?: string;
  lessonId: string;
  onEnded?: () => void;
  onPause?: (currentTime: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({
  manifestUrl,
  posterUrl,
  lessonId,
  onEnded,
  onPause,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentSource, setCurrentSource] = useState<string>(manifestUrl || DEMO_STREAM_URL);
  const [isFallback, setIsFallback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<{ id: number; height: number; bitrate?: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is auto
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  const storagePosKey = `sage_playback_pos_${lessonId}`;
  const storageVolKey = 'sage_player_volume';
  const storageMutedKey = 'sage_player_muted';

  // Read saved volume on mount
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem(storageVolKey);
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) setVolume(v);
      }
      const savedMuted = localStorage.getItem(storageMutedKey);
      if (savedMuted === 'true') setIsMuted(true);
    } catch {
      // Storage access blocked or unavailable
    }
  }, []);

  // Update source if prop changes
  useEffect(() => {
    if (manifestUrl) {
      setCurrentSource(manifestUrl);
      setIsFallback(false);
    }
  }, [manifestUrl]);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSource) return;

    setIsLoading(true);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(currentSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const available = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height,
          bitrate: lvl.bitrate,
        }));
        setQualities(available);

        // Resume playback position if saved
        try {
          const savedPos = localStorage.getItem(storagePosKey);
          if (savedPos) {
            const parsed = parseFloat(savedPos);
            if (!isNaN(parsed) && parsed > 3 && parsed < (video.duration || 99999)) {
              video.currentTime = parsed;
              setCurrentTime(parsed);
            }
          }
        } catch {
          // ignore storage read error
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // If the local manifest/segment failed and we haven't tried fallback yet
              if (!isFallback && currentSource !== DEMO_STREAM_URL) {
                console.warn('[Sage VideoPlayer] Primary stream unavailable, switching to adaptive demo stream...');
                setIsFallback(true);
                setCurrentSource(DEMO_STREAM_URL);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (!isFallback && currentSource !== DEMO_STREAM_URL) {
                setIsFallback(true);
                setCurrentSource(DEMO_STREAM_URL);
              } else {
                hls.destroy();
              }
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple Safari HLS
      video.src = currentSource;
      const onLoaded = () => {
        setIsLoading(false);
        try {
          const savedPos = localStorage.getItem(storagePosKey);
          if (savedPos) {
            const parsed = parseFloat(savedPos);
            if (!isNaN(parsed) && parsed > 3) video.currentTime = parsed;
          }
        } catch {
          // ignore
        }
      };
      const onError = () => {
        if (!isFallback && currentSource !== DEMO_STREAM_URL) {
          setIsFallback(true);
          setCurrentSource(DEMO_STREAM_URL);
        }
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };
    }
  }, [currentSource, isFallback, storagePosKey]);

  // Video playback handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setUserInteracted(true);
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    // Track buffer
    if (video.buffered.length > 0) {
      try {
        const bufferedEndSec = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(bufferedEndSec);
      } catch {
        // ignore buffer index errors
      }
    }

    // Persist position every ~5 seconds
    if (Math.floor(video.currentTime) % 5 === 0) {
      try {
        localStorage.setItem(storagePosKey, String(video.currentTime));
      } catch {
        // ignore
      }
    }

    onTimeUpdate?.(video.currentTime, video.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);
    video.muted = muted;

    try {
      localStorage.setItem(storageVolKey, String(newVol));
      localStorage.setItem(storageMutedKey, String(muted));
    } catch {
      // ignore
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }

    try {
      localStorage.setItem(storageMutedKey, String(nextMuted));
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const setSpeed = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const setQualityLevel = (lvlId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlId; // -1 for auto
      setCurrentQuality(lvlId);
    }
    setShowSettings(false);
  };

  const skipSeconds = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    setCurrentTime(video.currentTime);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
          e.preventDefault();
          skipSeconds(-10);
          break;
        case 'l':
          e.preventDefault();
          skipSeconds(10);
          break;
        case 'arrowright':
          e.preventDefault();
          skipSeconds(5);
          break;
        case 'arrowleft':
          e.preventDefault();
          skipSeconds(-5);
          break;
        case 'arrowup':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.05);
          setVolume(video.volume);
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.05);
          setVolume(video.volume);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const bufferPercent = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0;
  const currentPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="group relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none shadow-lg font-sans border border-rule/30"
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          if (videoRef.current) {
            onPause?.(videoRef.current.currentTime);
          }
        }}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-xs text-white/80 font-mono tracking-wider">HLS STREAM</span>
          </div>
        </div>
      )}

      {/* Top Banner (Status & Fallback Badge) */}
      <div className="absolute top-3 end-3 flex items-center gap-2 pointer-events-none z-10">
        {isFallback && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Adaptive Demo Stream</span>
          </span>
        )}
        {qualities.length > 0 && (
          <span className="text-[11px] font-mono uppercase bg-black/70 border border-white/10 px-2 py-0.5 rounded text-white/90 shadow-sm backdrop-blur-xs">
            {currentQuality === -1
              ? 'Auto'
              : `${qualities[currentQuality]?.height || 720}p`}
          </span>
        )}
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary/90 text-on-primary hover:scale-110 active:scale-95 transition-all shadow-xl flex items-center justify-center border border-white/20 hover:bg-primary"
          aria-label="Play video"
        >
          <Play className="w-7 h-7 fill-current ms-1" />
        </button>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        {/* Custom Progress / Scrub Bar */}
        <div className="relative w-full mb-3 flex items-center">
          {/* Buffer Bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 start-0 h-1 bg-white/25 rounded-full pointer-events-none transition-all"
            style={{ width: `${bufferPercent}%` }}
          />
          {/* Progress Bar (Fill) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 start-0 h-1 bg-amber-500 rounded-full pointer-events-none"
            style={{ width: `${currentPercent}%` }}
          />
          {/* Interactive Range Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-amber-500 relative z-10 focus:outline-none"
            aria-label="Video timeline scrubber"
          />
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls (Playback & Audio) */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-white/10 hover:text-amber-400 transition-colors"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => skipSeconds(-10)}
              className="p-1.5 rounded hover:bg-white/10 hover:text-amber-400 transition-colors"
              aria-label="Rewind 10 seconds"
              title="Rewind 10s (J)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => skipSeconds(10)}
              className="p-1.5 rounded hover:bg-white/10 hover:text-amber-400 transition-colors"
              aria-label="Forward 10 seconds"
              title="Forward 10s (L)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded hover:bg-white/10 hover:text-amber-400 transition-colors"
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                title="Mute / Unmute (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-500"
                aria-label="Volume level"
              />
            </div>

            {/* Timestamps */}
            <span className="font-mono text-[11px] text-white/80 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls (Settings & Fullscreen) */}
          <div className="relative flex items-center gap-2">
            {/* Settings Trigger */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded transition-colors ${
                showSettings ? 'bg-white/20 text-amber-400' : 'hover:bg-white/10 hover:text-amber-400'
              }`}
              aria-label="Playback settings"
              title="Settings (Speed & Quality)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Settings Popover Menu */}
            {showSettings && (
              <div className="absolute bottom-9 end-0 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl text-xs space-y-3 w-44 z-30 backdrop-blur-md">
                {/* Speed Controls */}
                <div>
                  <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">
                    Playback Speed
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setSpeed(spd)}
                        className={`py-1 rounded text-[11px] font-mono transition-colors ${
                          playbackRate === spd
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Renditions */}
                {qualities.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">
                      Stream Quality
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => setQualityLevel(-1)}
                        className={`w-full flex items-center justify-between text-start px-2 py-1 rounded text-[11px] transition-colors ${
                          currentQuality === -1
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>Auto (Adaptive)</span>
                        {currentQuality === -1 && <Check className="w-3.5 h-3.5" />}
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setQualityLevel(q.id)}
                          className={`w-full flex items-center justify-between text-start px-2 py-1 rounded text-[11px] transition-colors ${
                            currentQuality === q.id
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <span>{q.height}p HD</span>
                          {currentQuality === q.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-white/10 hover:text-amber-400 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
