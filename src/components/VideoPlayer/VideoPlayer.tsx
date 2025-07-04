import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs, { VideoJsPlayer } from 'video.js';
import Hls from 'hls.js';
import 'video.js/dist/video-js.css';

export interface SubtitleTrack {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface VideoSource {
  src: string;
  type?: string; // e.g., application/x-mpegURL
  label?: string; // quality label like 1080p
}

export interface VideoPlayerProps {
  sources: VideoSource[]; // master playlist OR multiple qualities
  poster?: string;
  tracks?: SubtitleTrack[];
  onError?: (err: any) => void;
  autoPlay?: boolean;
  enablePiP?: boolean;
  enableDVR?: boolean; // allow pause/seek for live streams
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sources,
  poster,
  tracks = [],
  onError,
  autoPlay = true,
  enablePiP = true,
  enableDVR = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const [isPiP, setIsPiP] = useState(false);

  const handlePiPToggle = useCallback(async () => {
    if (!enablePiP || !videoRef.current) return;

    // @ts-ignore - requestPictureInPicture is experimental
    if (!isPiP && document.pictureInPictureEnabled) {
      try {
        // @ts-ignore
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } catch (err) {
        console.error('PiP error', err);
      }
    } else if (document.pictureInPictureElement) {
      // @ts-ignore
      await document.exitPictureInPicture();
      setIsPiP(false);
    }
  }, [isPiP, enablePiP]);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoEl = videoRef.current;

    // Initialize Video.js
    playerRef.current = videojs(videoEl, {
      autoplay: autoPlay,
      controls: true,
      preload: 'auto',
      liveui: true,
      html5: {
        vhs: {
          withCredentials: false,
        },
      },
    });

    const player = playerRef.current;

    // Load HLS via Hls.js for non-native support
    if (sources.length === 1 && sources[0].src.endsWith('.m3u8') && !player.tech().hls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(sources[0].src);
        hls.attachMedia(videoEl);
      }
    } else {
      player.src(sources as any);
    }

    // Add subtitle tracks
    tracks.forEach((t) => {
      player.addRemoteTextTrack(
        {
          kind: 'subtitles',
          src: t.src,
          srclang: t.srclang,
          label: t.label,
          default: t.default,
        },
        false
      );
    });

    player.on('error', () => {
      const err = player.error();
      console.error('Player error', err);
      onError?.(err);
    });

    // DVR handling (allowSeek)
    if (enableDVR) {
      player.on('loadedmetadata', () => {
        //@ts-ignore
        const isLive = player.liveTracker?.isLive();
        if (isLive) {
          //@ts-ignore
          player.liveTracker?.seekToLiveEdge();
        }
      });
    }

    // Cleanup
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  // PiP event listeners
  useEffect(() => {
    const handler = () => setIsPiP(false);
    // @ts-ignore
    document.addEventListener('leavepictureinpicture', handler);
    return () => {
      // @ts-ignore
      document.removeEventListener('leavepictureinpicture', handler);
    };
  }, []);

  return (
    <div className={`video-player-wrapper relative ${className}`}>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin w-full h-full"
        poster={poster}
      />

      {enablePiP && (
        <button
          onClick={handlePiPToggle}
          className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded hover:bg-black/80 text-xs"
        >
          {isPiP ? 'Exit PiP' : 'PiP'}
        </button>
      )}
    </div>
  );
};