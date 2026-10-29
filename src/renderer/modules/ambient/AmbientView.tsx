import React, { useState } from 'react';
import {
  Headphones,
  Volume2,
  Play,
  Square,
  Plus,
  Trash2,
  ExternalLink,
  Music,
  Check,
  AlertCircle,
  Radio,
  Clock,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { parseYouTubeUrl } from '../../utils/youtube';

export const AmbientView: React.FC = () => {
  const tracks = useForestSelector((s) => s.ambientTracks);
  const activeAmbientId = useForestSelector((s) => s.settings.activeAmbientId);
  const ambientVolume = useForestSelector((s) => s.settings.ambientVolume);
  const syncWithTimer = useForestSelector((s) => s.settings.syncAmbientWithTimer);
  const isAmbientPlaying = useForestSelector((s) => s.isAmbientPlaying);

  // Form State for Adding YouTube Music Stream
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeAmbientId);
  const natureTracks = tracks.filter((t) => t.category === 'nature');
  const youtubeTracks = tracks.filter((t) => t.category === 'youtube');

  const handleSelectNature = (trackId: string) => {
    if (activeAmbientId === trackId && isAmbientPlaying) {
      forestStore.stopAmbient();
    } else {
      forestStore.playAmbient(trackId);
    }
  };

  const handleSelectYouTube = (trackId: string) => {
    if (activeAmbientId === trackId && isAmbientPlaying) {
      forestStore.stopAmbient();
    } else {
      forestStore.playAmbient(trackId);
    }
  };

  const handleAddYouTubeTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = newTitle.trim();
    const url = newUrl.trim();

    if (!title) {
      setFormError('Please enter a title for the stream.');
      return;
    }

    const parsed = parseYouTubeUrl(url);
    if (!parsed.isValid) {
      setFormError('Please enter a valid YouTube or YouTube Music link.');
      return;
    }

    const track = await forestStore.addAmbientTrack(title, url, 'youtube');
    if (track) {
      setNewTitle('');
      setNewUrl('');
      setShowAddForm(false);
      forestStore.playAmbient(track.id);
    } else {
      setFormError('Failed to save ambient stream.');
    }
  };

  const handleOpenExternal = (url: string) => {
    if (window.forestAPI && url) {
      window.forestAPI.openExternal(url);
    }
  };

  return (
    <div
      style={{
        padding: '16px 14px 72px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
      }}
    >
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Headphones color="#81C784" size={20} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ambient Sound Studio
          </h2>
        </div>

        {isAmbientPlaying && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(129, 199, 132, 0.15)',
              padding: '3px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(129, 199, 132, 0.3)',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#81C784',
                boxShadow: '0 0 8px #81C784',
              }}
            />
            <span style={{ fontSize: '10px', color: '#C8E6C9', fontWeight: 700 }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Top Master Controls Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Active Track Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isAmbientPlaying ? 'rgba(78, 125, 85, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                border: isAmbientPlaying ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeTrack?.category === 'youtube' ? (
                <Music size={18} color={isAmbientPlaying ? '#FF8A80' : '#E0E0E0'} />
              ) : (
                <Radio size={18} color={isAmbientPlaying ? '#81C784' : '#E0E0E0'} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeTrack ? activeTrack.title : 'No Ambient Selected'}
              </span>
              <span style={{ fontSize: '10px', color: '#A5D6A7' }}>
                {isAmbientPlaying
                  ? 'Currently Playing in Background'
                  : activeTrack
                  ? 'Ready to Play'
                  : 'Choose a soundscape below'}
              </span>
            </div>
          </div>

          {/* Master Play/Stop Button */}
          <button
            onClick={() => forestStore.toggleAmbient()}
            style={{
              background: isAmbientPlaying ? 'rgba(239, 83, 80, 0.25)' : '#4CAF50',
              border: isAmbientPlaying ? '1px solid #EF5350' : 'none',
              borderRadius: '20px',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isAmbientPlaying ? 'none' : '0 3px 10px rgba(76, 175, 80, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            {isAmbientPlaying ? (
              <>
                <Square size={12} fill="#FFFFFF" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={12} fill="#FFFFFF" />
                <span>Play</span>
              </>
            )}
          </button>
        </div>

        {/* Master Volume Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '8px 12px',
            borderRadius: '12px',
          }}
        >
          <Volume2 size={16} color="#81C784" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={(e) => forestStore.setAmbientVolume(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: '#81C784',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#E8F5E9', minWidth: '34px', textAlign: 'right' }}>
            {Math.round(ambientVolume * 100)}%
          </span>
        </div>

        {/* Auto-Sync with Focus Timer Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 4px 2px 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} color="#81C784" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#E8F5E9' }}>
                Auto-play during Focus Session
              </span>
              <span style={{ fontSize: '9px', color: '#A5D6A7' }}>
                Plays automatically when timer starts; stops when session ends
              </span>
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
            <input
              type="checkbox"
              checked={syncWithTimer}
              onChange={(e) => forestStore.setSyncAmbientWithTimer(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: syncWithTimer ? '#81C784' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                transition: '0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '14px',
                  width: '14px',
                  left: syncWithTimer ? '19px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* SECTION 1: Forest Nature Soundscapes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#81C784', fontWeight: 800 }}>
            🌿 Procedural Nature Soundscapes
          </span>
          <span style={{ fontSize: '9px', color: '#A5D6A7' }}>0MB Buffers • Web Audio</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {natureTracks.map((track) => {
            const isSelected = activeAmbientId === track.id;
            const isPlayingThis = isSelected && isAmbientPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleSelectNature(track.id)}
                style={{
                  background: isSelected ? 'rgba(76, 175, 80, 0.28)' : 'rgba(255, 255, 255, 0.04)',
                  border: isPlayingThis
                    ? '1.5px solid #81C784'
                    : isSelected
                    ? '1px solid rgba(129, 199, 132, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isPlayingThis ? '0 4px 16px rgba(76, 175, 80, 0.2)' : 'none',
                  transition: 'transform 0.15s ease, background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <NatureIcon presetId={track.id} isPlaying={isPlayingThis} />
                  {isPlayingThis ? (
                    <div
                      style={{
                        background: '#81C784',
                        color: '#182E21',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Square size={8} fill="#182E21" />
                    </div>
                  ) : isSelected ? (
                    <Check size={16} color="#81C784" />
                  ) : null}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{track.title}</span>
                  <span style={{ fontSize: '10px', color: '#A5D6A7', marginTop: '2px' }}>
                    {getNatureSubtext(track.id)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: YouTube Music Ambient Libraries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#81C784', fontWeight: 800 }}>
            🎧 YouTube Music Ambient Streams
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '3px 8px',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={11} strokeWidth={3} />
            <span>Link Stream</span>
          </button>
        </div>

        {/* Add Stream Form Card */}
        {showAddForm && (
          <form
            onSubmit={handleAddYouTubeTrack}
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(129, 199, 132, 0.3)',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#E8F5E9' }}>
              Add YouTube / YouTube Music Stream
            </span>

            <input
              type="text"
              placeholder="Stream Title (e.g., Chillhop Café Lofi)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={40}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#FFFFFF',
                fontSize: '11px',
                outline: 'none',
              }}
            />

            <input
              type="text"
              placeholder="YouTube URL (music.youtube.com or youtube.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#FFFFFF',
                fontSize: '11px',
                outline: 'none',
              }}
            />

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF9A9A', fontSize: '10px' }}>
                <AlertCircle size={12} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#B0BEC5',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: '#2E7D32',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                Add to Library
              </button>
            </div>
          </form>
        )}

        {/* YouTube Streams List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {youtubeTracks.map((track) => {
            const isSelected = activeAmbientId === track.id;
            const isPlayingThis = isSelected && isAmbientPlaying;

            return (
              <div
                key={track.id}
                style={{
                  background: isSelected ? 'rgba(76, 175, 80, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  border: isPlayingThis
                    ? '1.5px solid #81C784'
                    : isSelected
                    ? '1px solid rgba(129, 199, 132, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div
                  onClick={() => handleSelectYouTube(track.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: 0,
                    flex: 1,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isPlayingThis ? 'rgba(255, 138, 128, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Music size={15} color={isPlayingThis ? '#FF8A80' : '#A5D6A7'} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {track.title}
                    </span>
                    <span style={{ fontSize: '9px', color: '#A5D6A7' }}>
                      {track.isCustom ? 'Custom YouTube link' : 'Curated Focus Stream'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {/* Play / Stop Toggle Button */}
                  <button
                    onClick={() => handleSelectYouTube(track.id)}
                    title={isPlayingThis ? 'Stop Stream' : 'Play Stream in Mini-Dock'}
                    style={{
                      background: isPlayingThis ? 'rgba(239, 83, 80, 0.3)' : 'rgba(129, 199, 132, 0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      color: isPlayingThis ? '#FFCDD2' : '#81C784',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isPlayingThis ? <Square size={10} fill="#FFCDD2" /> : <Play size={10} fill="#81C784" />}
                    <span>{isPlayingThis ? 'Stop' : 'Play'}</span>
                  </button>

                  {/* Open in YouTube Music External Button */}
                  <button
                    onClick={() => handleOpenExternal(track.url)}
                    title="Open in YouTube Music"
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 7px',
                      color: '#E0E0E0',
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={12} />
                  </button>

                  {/* Delete button if custom */}
                  {track.isCustom && (
                    <button
                      onClick={() => forestStore.deleteAmbientTrack(track.id)}
                      title="Remove from Library"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#E57373',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Pure SVG Nature Icons ---
const NatureIcon: React.FC<{ presetId: string; isPlaying: boolean }> = ({ presetId, isPlaying }) => {
  const color = isPlaying ? '#81C784' : '#A5D6A7';

  switch (presetId) {
    case 'ambient-rain':
    case 'nature://forest-rain':
    case 'nature://gentle-rain':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 14.5C4 11.5 6.5 9 9.5 9C10.2 6.5 12.5 5 15 5C18 5 20.5 7.5 20.5 10.5C21.5 11 22 12.2 22 13.5C22 15.5 20.5 17 18.5 17H5.5C4.5 17 4 16 4 14.5Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
          <path d="M8 19L6 22M12 19L10 22M16 19L14 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ambient-wind':
    case 'nature://wind-pines':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L6 14H18L12 3Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 14V21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 8C5 8 7 6 9 6M2 12C6 12 8 10 11 10M16 16C18 16 20 18 22 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ambient-campfire':
    case 'nature://cozy-campfire':
    case 'nature://campfire-crackle':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 20L20 20M5 19L19 21M5 21L19 19" stroke="#FFA726" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 4C12 7 9 9 9 12C9 14.5 10.5 16 12 16C13.5 16 15 14.5 15 12C15 9 12 7 12 4Z" fill="#FF7043" fillOpacity="0.35" stroke="#FF7043" strokeWidth="1.5" />
          <path d="M12 9C12 11 11 12 11 13.5C11 14.8 11.5 15.5 12 15.5C12.5 15.5 13 14.8 13 13.5C13 12 12 11 12 9Z" fill="#FFD54F" />
        </svg>
      );

    case 'ambient-waves':
    case 'nature://ocean-waves':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M2 10C5 7 8 13 12 10C16 7 19 13 22 10" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M2 15C5 12 8 18 12 15C16 12 19 18 22 15" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M2 20C5 17 8 23 12 20C16 17 19 23 22 20" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      );

    case 'ambient-crickets':
    case 'nature://night-crickets':
    case 'nature://woodland-birds':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C8 3 5 6 5 10C5 14 8 17 12 17C14.5 17 16.8 15.7 18 13.8C15 13.8 12.5 11.5 12.5 8.5C12.5 6.2 13.8 4.2 15.8 3.2C14.6 3.1 13.3 3 12 3Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
          <circle cx="19" cy="5" r="1" fill="#FFD54F" />
          <circle cx="16" cy="19" r="0.75" fill="#FFF" />
          <path d="M3 21C6 19 7 21 10 21M14 21C17 19 19 21 21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ambient-zen':
    case 'nature://deep-zen':
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 11C4 16.5 7.5 20 12 20C16.5 20 20 16.5 20 11H4Z" fill="#FFE082" fillOpacity="0.25" stroke="#FFD54F" strokeWidth="1.5" />
          <path d="M2 11H22" stroke="#FFD54F" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="7" r="1.5" fill="#FFE082" />
          <path d="M8 6C9 4 15 4 16 6" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        </svg>
      );
  }
};

function getNatureSubtext(presetId: string): string {
  switch (presetId) {
    case 'ambient-rain':
    case 'nature://forest-rain':
    case 'nature://gentle-rain':
      return 'Continuous gentle drizzle & droplets';
    case 'ambient-wind':
    case 'nature://wind-pines':
      return 'Soothing breeze through high pine boughs';
    case 'ambient-campfire':
    case 'nature://cozy-campfire':
    case 'nature://campfire-crackle':
      return 'Gentle flame warmth & crackling embers';
    case 'ambient-waves':
    case 'nature://ocean-waves':
      return 'Rhythmic coastal tide surge & retreat';
    case 'ambient-crickets':
    case 'nature://night-crickets':
    case 'nature://woodland-birds':
      return 'Peaceful evening field stridulation';
    case 'ambient-zen':
    case 'nature://deep-zen':
    default:
      return 'Harmonic Tibetan bowl acoustic shimmer';
  }
}
