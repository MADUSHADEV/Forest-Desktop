/**
 * youtube.ts
 *
 * Safe YouTube & YouTube Music URL parser and embed generator.
 * Supports desktop & mobile links, music.youtube.com, playlists, and shortlinks.
 */

export interface ParsedYouTubeUrl {
  isValid: boolean;
  videoId: string | null;
  playlistId: string | null;
  embedUrl: string | null;
  cleanUrl: string;
}

export function parseYouTubeUrl(rawUrl: string): ParsedYouTubeUrl {
  const fallback: ParsedYouTubeUrl = {
    isValid: false,
    videoId: null,
    playlistId: null,
    embedUrl: null,
    cleanUrl: rawUrl.trim(),
  };

  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  const trimmed = rawUrl.trim();

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();

    const isYouTube =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host === 'music.youtube.com';

    if (!isYouTube) {
      return fallback;
    }

    let videoId: string | null = null;
    let playlistId: string | null = null;

    if (host === 'youtu.be') {
      // Shortlink format: https://youtu.be/VIDEO_ID?t=10
      videoId = url.pathname.slice(1).split('/')[0] || null;
      playlistId = url.searchParams.get('list');
    } else {
      // Standard or YouTube Music format
      if (url.pathname.includes('/watch')) {
        videoId = url.searchParams.get('v');
        playlistId = url.searchParams.get('list');
      } else if (url.pathname.includes('/playlist')) {
        playlistId = url.searchParams.get('list');
      } else if (url.pathname.includes('/embed/')) {
        videoId = url.pathname.split('/embed/')[1]?.split('?')[0] || null;
        playlistId = url.searchParams.get('list');
      }
    }

    // Clean videoId from any query residue
    if (videoId) {
      videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    if (playlistId) {
      playlistId = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    if (!videoId && !playlistId) {
      return fallback;
    }

    let embedUrl: string;
    if (videoId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&loop=1${
        playlistId ? `&list=${playlistId}` : `&playlist=${videoId}`
      }`;
    } else {
      embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1`;
    }

    return {
      isValid: true,
      videoId,
      playlistId,
      embedUrl,
      cleanUrl: trimmed,
    };
  } catch {
    return fallback;
  }
}
