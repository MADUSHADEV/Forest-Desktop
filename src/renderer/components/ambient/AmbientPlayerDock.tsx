import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Square,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Music,
  Headphones,
  Sliders,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { parseYouTubeUrl } from '../../utils/youtube';

export const AmbientPlayerDock: React.FC = () => {
  const activeAmbientId = useForestSelector((s) => s.settings.activeAmbientId);
  const ambientVolume = useForestSelector((s) => s.settings.ambientVolume);
  const isAmbientPlaying = useForestSelector((s) => s.isAmbientPlaying);
  const ambientTracks = useForestSelector((s) => s.ambientTracks);

  const [isExpanded, setIsExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeTrack = ambientTracks.find((t) => t.id === activeAmbientId);

  // Strict Memory Teardown: Set iframe src to about:blank on unmount or track change
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        try {
          iframeRef.current.src = 'about:blank';
        } catch {
          // Safe ignore
        }
      }
    };
  }, [activeAmbientId, isAmbientPlaying]);

  // When ambient is stopped or no active track is selected, unmount completely from DOM
  if (!isAmbientPlaying || !activeTrack) {
    return null;
  }

  const isYouTube = activeTrack.category === 'youtube';
  const parsedYt = isYouTube ? parseYouTubeUrl(activeTrack.url) : null;

  const handleOpenExternal = () => {
    if (window.forestAPI && activeTrack.url) {
      window.forestAPI.openExternal(activeTrack.url);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(15, 30, 20, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(129, 199, 132, 0.25)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Expanded YouTube Embed Frame (Rendered ONLY when expanded & YouTube stream active) */}
      {isYouTube && isExpanded && parsedYt?.embedUrl && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            background: '#000000',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <iframe
            ref={iframeRef}
            src={parsedYt.embedUrl}
            title={activeTrack.title}
            allow="autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-autoplay"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      )}

      {/* Dock Controller Bar */}
      <div
        style={{
          height: '44px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Left: Animated Soundwave Indicator & Track Title */}
        <div
          onClick={() => forestStore.setActiveView('ambient')}
          title="Open Ambient Studio"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
            flex: 1,
            cursor: 'pointer',
          }}
        >
          {/* Animated SVG Soundwave */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              height: '14px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '3px',
                height: '100%',
                background: '#81C784',
                borderRadius: '1px',
                animation: 'wave 0.8s ease-in-out infinite alternate',
              }}
            />
            <div
              style={{
                width: '3px',
                height: '60%',
                background: '#A5D6A7',
                borderRadius: '1px',
                animation: 'wave 0.8s ease-in-out infinite alternate 0.2s',
              }}
            />
            <div
              style={{
                width: '3px',
                height: '85%',
                background: '#81C784',
                borderRadius: '1px',
                animation: 'wave 0.8s ease-in-out infinite alternate 0.4s',
              }}
            />
          </div>

          {isYouTube ? (
            <Music size={14} color="#FF8A80" style={{ flexShrink: 0 }} />
          ) : (
            <Headphones size={14} color="#81C784" style={{ flexShrink: 0 }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeTrack.title}
            </span>
            <span style={{ fontSize: '9px', color: isYouTube ? '#FFAB91' : '#A5D6A7' }}>
              {isYouTube ? 'YouTube Focus Stream' : 'Procedural Nature Soundscape'}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Volume Slider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '12px',
            }}
          >
            <Volume2 size={12} color="#A5D6A7" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => forestStore.setAmbientVolume(parseFloat(e.target.value))}
              style={{
                width: '45px',
                accentColor: '#81C784',
                cursor: 'pointer',
                height: '4px',
              }}
            />
          </div>

          {/* External Link for YouTube */}
          {isYouTube && (
            <button
              onClick={handleOpenExternal}
              title="Open stream in YouTube Music / browser"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E0E0E0',
                padding: '4px 6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <span>YT</span>
              <ExternalLink size={10} />
            </button>
          )}

          {/* Expand/Collapse Toggle for YouTube */}
          {isYouTube && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse mini player' : 'Expand YouTube video'}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#FFFFFF',
                padding: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}

          {/* Studio Shortcut for Nature */}
          {!isYouTube && (
            <button
              onClick={() => forestStore.setActiveView('ambient')}
              title="Soundscape Studio"
              style={{
                background: 'rgba(129, 199, 132, 0.15)',
                border: 'none',
                color: '#81C784',
                padding: '4px 6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <Sliders size={11} />
              <span>Mix</span>
            </button>
          )}

          {/* Stop / Unmount Button */}
          <button
            onClick={() => forestStore.stopAmbient()}
            title="Stop Ambient Audio"
            style={{
              background: 'rgba(239, 83, 80, 0.25)',
              border: '1px solid rgba(239, 83, 80, 0.4)',
              color: '#FFCDD2',
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            <Square size={10} fill="#FFCDD2" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0% { height: 25%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
};
