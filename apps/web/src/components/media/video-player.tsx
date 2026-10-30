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
} from 'lucide-react';

interface VideoPlayerProps {
  manifestUrl: string;
  posterUrl?: string;
  lessonId: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoPlayer({
  manifestUrl,
  posterUrl,
  lessonId,
  onEnded,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is auto
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `sage_playback_pos_${lessonId}`;

  // Initialize Hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifestUrl) return;

    setIsLoading(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const available = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height,
        }));
        setQualities(available);

        // Resume position from localStorage
        const savedPos = localStorage.getItem(storageKey);
        if (savedPos) {
          const parsed = parseFloat(savedPos);
          if (!isNaN(parsed) && parsed > 0 && parsed < video.duration) {
            video.currentTime = parsed;
          }
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = manifestUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        const savedPos = localStorage.getItem(storageKey);
        if (savedPos) {
          const parsed = parseFloat(savedPos);
          if (!isNaN(parsed)) video.currentTime = parsed;
        }
      });
    }
  }, [manifestUrl, storageKey]);

  // Video Event Handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
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

    // Save position periodically to localStorage
    if (Math.floor(video.currentTime) % 5 === 0) {
      localStorage.setItem(storageKey, String(video.currentTime));
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
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 0.5;
    } else {
      video.muted = true;
      setIsMuted(true);
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

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
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
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="group relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none shadow-md font-sans"
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Top Info */}
        <div className="flex justify-end">
          {qualities.length > 0 && (
            <span className="text-[11px] font-mono uppercase bg-black/60 px-2 py-0.5 rounded text-white/80">
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
            className="self-center p-4 rounded-full bg-primary/90 text-on-primary hover:scale-110 transition-transform shadow-lg"
            aria-label="Play video"
          >
            <Play className="w-8 h-8 fill-current ms-1" />
          </button>
        )}

        {/* Bottom Bar */}
        <div className="space-y-2">
          {/* Seek Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-accent"
              aria-label="Seek slider"
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="hover:text-accent transition-colors p-1"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 10);
                }}
                className="hover:text-accent transition-colors p-1"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="hover:text-accent transition-colors p-1"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-accent"
                  aria-label="Volume slider"
                />
              </div>

              <span className="font-mono text-[11px] text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="relative flex items-center gap-3">
              {/* Settings / Speed Dropdown */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="hover:text-accent transition-colors p-1"
                aria-label="Playback settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute bottom-8 end-0 bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 shadow-xl text-xs space-y-2 w-36 z-20">
                  <div className="font-semibold text-zinc-400 text-[10px] uppercase">Speed</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setSpeed(spd)}
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          playbackRate === spd
                            ? 'bg-accent text-zinc-950 font-bold'
                            : 'hover:bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {qualities.length > 0 && (
                    <>
                      <div className="font-semibold text-zinc-400 text-[10px] uppercase pt-1 border-t border-zinc-800">Quality</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setQualityLevel(-1)}
                          className={`w-full text-start px-1.5 py-0.5 rounded text-[11px] ${
                            currentQuality === -1
                              ? 'bg-accent text-zinc-950 font-bold'
                              : 'hover:bg-zinc-800 text-zinc-200'
                          }`}
                        >
                          Auto
                        </button>
                        {qualities.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => setQualityLevel(q.id)}
                            className={`w-full text-start px-1.5 py-0.5 rounded text-[11px] ${
                              currentQuality === q.id
                                ? 'bg-accent text-zinc-950 font-bold'
                                : 'hover:bg-zinc-800 text-zinc-200'
                            }`}
                          >
                            {q.height}p
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="hover:text-accent transition-colors p-1"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
