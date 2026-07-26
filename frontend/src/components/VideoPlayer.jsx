import { useEffect, useRef } from 'react';
import videojs from 'video.js/core.es.js';
import 'video.js/dist/video-js.css';

export default function VideoPlayer({ src, type = 'video/mp4', startTime = 0, onProgress, onEnded, className = '' }) {
  const containerRef = useRef(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  const startTimeRef = useRef(startTime);

  useEffect(() => { progressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { endedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  useEffect(() => {
    if (!containerRef.current || !src) return undefined;

    const element = document.createElement('video');
    element.className = 'video-js vjs-big-play-centered';
    element.crossOrigin = 'use-credentials';
    element.playsInline = true;
    containerRef.current.appendChild(element);

    const player = videojs(element, {
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'metadata',
      playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
      sources: [{ src, type }],
    });

    player.one('loadedmetadata', () => {
      if (startTimeRef.current > 0 && startTimeRef.current < (player.duration() || Infinity)) player.currentTime(startTimeRef.current);
    });

    player.on('timeupdate', () => progressRef.current?.({
      currentTime: player.currentTime() || 0,
      duration: player.duration() || 0,
    }));
    player.on('ended', () => endedRef.current?.());

    return () => {
      if (!player.isDisposed()) player.dispose();
    };
  }, [src, type]);

  return <div ref={containerRef} className={`overflow-hidden rounded-2xl bg-black ${className}`} />;
}
