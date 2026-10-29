import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Tag,
  Trees,
  CheckCircle2,
  Coins,
  Sparkles,
  Coffee,
  X,
  Hourglass,
  Timer as StopwatchIcon,
  Headphones,
  Music,
  Volume2,
  Square,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { TreeStageSvg } from '../../components/trees/TreeStageSvg';
import { CircularTimerDial } from './CircularTimerDial';
import { TimerMode } from '../../../shared/types';

const QUOTES = [
  'Stay focused, be present!',
  'Leave your distractions alone.',
  'A tiny seed becomes a mighty forest.',
  'Every moment of focus nurtures growth.',
  'Breathe deep and let your thoughts settle.',
  'Your forest flourishes with patience.',
];

export const TimerView: React.FC = () => {
  const timer = useForestSelector((s) => s.timer);
  const settings = useForestSelector((s) => s.settings);
  const trees = useForestSelector((s) => s.trees);
  const tags = useForestSelector((s) => s.tags);
  const isAmbientPlaying = useForestSelector((s) => s.isAmbientPlaying);
  const activeAmbientId = useForestSelector((s) => s.settings.activeAmbientId);
  const ambientVolume = useForestSelector((s) => s.settings.ambientVolume);
  const ambientTracks = useForestSelector((s) => s.ambientTracks);

  const [selectedMinutes, setSelectedMinutes] = useState(settings.defaultFocusMinutes);
  const [selectedMode, setSelectedMode] = useState<TimerMode>(timer.mode);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showTreePicker, setShowTreePicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'trees' | 'lands'>('trees');
  const lands = useForestSelector((s) => s.lands);
  const activeLand =
    lands.find((l) => l.id === settings.selectedLandId) || lands[0];
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showAmbientPicker, setShowAmbientPicker] = useState(false);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);

  // Rotate motivational quotes every 12 seconds during focus
  useEffect(() => {
    if (timer.status === 'focusing') {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [timer.status]);

  // Keep selectedMinutes in sync with settings default in idle
  useEffect(() => {
    if (timer.status === 'idle') {
      setSelectedMinutes(settings.defaultFocusMinutes);
      setSelectedMode(timer.mode);
    }
  }, [timer.status, settings.defaultFocusMinutes, timer.mode]);

  const selectedTree =
    trees.find((t) => t.id === (timer.status === 'idle' ? settings.selectedTreeId : timer.treeSpeciesId)) ||
    trees[0];
  const activeTag =
    tags.find((t) => t.id === (timer.status === 'idle' ? settings.selectedTagId : timer.tagId)) ||
    tags[0];
  const activeAmbientTrack = ambientTracks.find((t) => t.id === activeAmbientId);

  // Dynamic preview progress in idle based on selected minutes (10m = 0.2 sprout, 120m = 0.9 mature)
  const idlePreviewProgress = (selectedMinutes - 10) / (120 - 10);
  const displayProgress = timer.status === 'idle' ? idlePreviewProgress : timer.progress;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await forestStore.startTimer({
      mode: selectedMode,
      durationMinutes: selectedMinutes,
      treeSpeciesId: settings.selectedTreeId,
      tagId: settings.selectedTagId,
    });
  };

  const handlePauseToggle = async () => {
    if (timer.status === 'focusing') {
      await forestStore.pauseTimer();
    } else if (timer.status === 'paused') {
      await forestStore.resumeTimer();
    }
  };

  const handleGiveUpClick = () => {
    if (timer.gracePeriodRemaining > 0) {
      // Within 10s grace period: cancel without penalty
      forestStore.stopTimer();
    } else {
      setShowGiveUpConfirm(true);
    }
  };

  const handleConfirmGiveUp = async () => {
    setShowGiveUpConfirm(false);
    await forestStore.stopTimer();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 20px',
        textAlign: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 1. Mode Switcher & Quote Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
        {timer.status === 'idle' ? (
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '3px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setSelectedMode('countdown')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '16px',
                border: 'none',
                background: selectedMode === 'countdown' ? '#2E7D32' : 'transparent',
                color: selectedMode === 'countdown' ? '#FFFFFF' : '#A5D6A7',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Hourglass size={12} />
              <span>Countdown</span>
            </button>

            <button
              onClick={() => setSelectedMode('stopwatch')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '16px',
                border: 'none',
                background: selectedMode === 'stopwatch' ? '#2E7D32' : 'transparent',
                color: selectedMode === 'stopwatch' ? '#FFFFFF' : '#A5D6A7',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <StopwatchIcon size={12} />
              <span>Stopwatch</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#A5D6A7',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '4px 12px',
              borderRadius: '12px',
            }}
          >
            {timer.status === 'break' ? (
              <>
                <Coffee size={13} color="#FFD54F" />
                <span>Rest & Refresh</span>
              </>
            ) : (
              <span>{QUOTES[quoteIndex]}</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Central Circular Dial & Tree Animation */}
      <CircularTimerDial
        mode={timer.status === 'idle' ? selectedMode : timer.mode}
        status={timer.status}
        durationMinutes={selectedMinutes}
        progress={displayProgress}
        onDurationChange={(mins) => setSelectedMinutes(mins)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TreeStageSvg
            species={selectedTree}
            land={activeLand}
            progress={displayProgress}
            status={timer.status}
            size={165}
          />

          {/* Tree Selector Pill (Active in idle) */}
          <button
            onClick={() => timer.status === 'idle' && setShowTreePicker(true)}
            disabled={timer.status !== 'idle'}
            style={{
              marginTop: '-10px',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '4px 12px',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: timer.status === 'idle' ? 'pointer' : 'default',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Trees size={12} color="#81C784" />
            <span>{selectedTree?.name || 'Tree'}</span>
            {timer.status === 'idle' && <Sparkles size={11} color="#FFD700" />}
          </button>
        </div>
      </CircularTimerDial>

      {/* 3. Time Readout & Tag Pill */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            fontSize: '52px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            lineHeight: 1,
          }}
        >
          {timer.status === 'break'
            ? formatTime(timer.breakRemainingSeconds)
            : timer.status === 'idle'
            ? selectedMode === 'countdown'
              ? formatTime(selectedMinutes * 60)
              : '00:00'
            : formatTime(timer.remainingSeconds)}
        </div>

        {/* Pills Row: Tag Selector + Quick Ambient Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Tag Selector Pill */}
          <button
            onClick={() => timer.status === 'idle' && setShowTagPicker(true)}
            disabled={timer.status !== 'idle'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: timer.status === 'idle' ? 'pointer' : 'default',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeTag?.color || '#4E7D55',
              }}
            />
            <span>{activeTag?.name || 'Focus'}</span>
            {timer.status === 'idle' && <Tag size={10} color="#C8E6C9" />}
          </button>

          {/* Quick Ambient Pill */}
          <button
            onClick={() => setShowAmbientPicker(true)}
            title="Ambient Soundscape Controls"
            style={{
              background: isAmbientPlaying ? 'rgba(76, 175, 80, 0.28)' : 'rgba(255, 255, 255, 0.08)',
              border: isAmbientPlaying ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: isAmbientPlaying ? '#81C784' : '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: isAmbientPlaying ? '0 2px 8px rgba(76, 175, 80, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {isAmbientPlaying ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px' }}>
                <span style={{ width: '2px', height: '100%', background: '#81C784', animation: 'wave 0.8s infinite alternate' }} />
                <span style={{ width: '2px', height: '60%', background: '#A5D6A7', animation: 'wave 0.8s infinite alternate 0.2s' }} />
                <span style={{ width: '2px', height: '85%', background: '#81C784', animation: 'wave 0.8s infinite alternate 0.4s' }} />
              </div>
            ) : (
              <Headphones size={12} color="#C8E6C9" />
            )}
            <span style={{ maxWidth: '85px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isAmbientPlaying && activeAmbientTrack ? activeAmbientTrack.title : 'Ambient'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Action Controls Bar */}
      <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* IDLE: Plant Button */}
        {timer.status === 'idle' && (
          <button
            onClick={handleStart}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(46, 125, 50, 0.45)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Play size={18} fill="#FFFFFF" />
            <span>Plant</span>
          </button>
        )}

        {/* FOCUSING / PAUSED Controls */}
        {(timer.status === 'focusing' || timer.status === 'paused') && (
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            {/* Pause / Resume Button (Only if allowPause is true) */}
            {settings.allowPause && (
              <button
                onClick={handlePauseToggle}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {timer.status === 'focusing' ? (
                  <>
                    <Pause size={15} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="#FFFFFF" />
                    <span>Resume</span>
                  </>
                )}
              </button>
            )}

            {/* Cancel (Grace Period) or Give Up Button */}
            <button
              onClick={handleGiveUpClick}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '24px',
                background:
                  timer.gracePeriodRemaining > 0
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(239, 83, 80, 0.25)',
                border:
                  timer.gracePeriodRemaining > 0
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid rgba(239, 83, 80, 0.4)',
                color: timer.gracePeriodRemaining > 0 ? '#FFFFFF' : '#FFCDD2',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {timer.gracePeriodRemaining > 0 ? (
                <>
                  <RotateCcw size={14} />
                  <span>Cancel ({timer.gracePeriodRemaining}s)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  <span>Give Up</span>
                </>
              )}
            </button>

            {/* Stopwatch Harvest Button (if >= 10 mins) */}
            {timer.mode === 'stopwatch' && timer.elapsedSeconds >= 600 && (
              <button
                onClick={() => forestStore.stopTimer()}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Harvest</span>
              </button>
            )}
          </div>
        )}

        {/* BREAK Controls */}
        {timer.status === 'break' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button
              onClick={() => forestStore.skipBreak()}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {settings.autoFocusAfterBreak ? 'Skip Break & Plant Now' : 'End Break'}
            </button>
            <button
              onClick={() => forestStore.resetTimer()}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '16px',
                background: 'transparent',
                border: 'none',
                color: '#A5D6A7',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Stop & Back to Garden
            </button>
          </div>
        )}

        {/* COMPLETED / WITHERED Summary Action */}
        {(timer.status === 'completed' || timer.status === 'withered') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {timer.status === 'completed' && (
              <button
                onClick={() => forestStore.startBreak(settings.breakDurationMinutes || 5)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '24px',
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  color: '#FFD700',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Coffee size={15} color="#FFD700" />
                <span>Take a {settings.breakDurationMinutes || 5}m Break</span>
              </button>
            )}
            <button
              onClick={() => forestStore.resetTimer()}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '28px',
                background:
                  timer.status === 'completed'
                    ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                    : 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {timer.status === 'completed' ? 'Plant Another Tree' : 'Try Again'}
            </button>
          </div>
        )}
      </div>

      {/* --- GIVE UP CONFIRMATION MODAL --- */}
      {showGiveUpConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#1E392A',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '20px',
              padding: '24px 20px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 83, 80, 0.15)',
                color: '#EF5350',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>Give Up Now?</h3>
            <p style={{ fontSize: '12px', color: '#C8E6C9', lineHeight: 1.5 }}>
              If you give up before completing the session, your lovely{' '}
              <strong style={{ color: '#EF5350' }}>{selectedTree.name}</strong> will wither and die.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setShowGiveUpConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#2E7D32',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Keep Going
              </button>

              <button
                onClick={handleConfirmGiveUp}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 83, 80, 0.2)',
                  border: '1px solid rgba(239, 83, 80, 0.4)',
                  color: '#FFCDD2',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Give Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK TREE & LAND PICKER BOTTOM SHEET --- */}
      {showTreePicker && (
        <div
          onClick={() => setShowTreePicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              maxHeight: '75vh',
              background: '#182E21',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trees size={18} color="#81C784" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Planting Stage Equipment</h3>
              </div>
              <button
                onClick={() => setShowTreePicker(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A5D6A7',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Picker Tab Switcher (Trees vs Lands) */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '3px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <button
                onClick={() => setPickerTab('trees')}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '9px',
                  border: 'none',
                  background: pickerTab === 'trees' ? '#2E7D32' : 'transparent',
                  color: pickerTab === 'trees' ? '#FFFFFF' : '#A5D6A7',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tree Species
              </button>
              <button
                onClick={() => setPickerTab('lands')}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '9px',
                  border: 'none',
                  background: pickerTab === 'lands' ? '#2E7D32' : 'transparent',
                  color: pickerTab === 'lands' ? '#FFFFFF' : '#A5D6A7',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Land Styles
              </button>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '45vh' }}>
              {pickerTab === 'trees' ? (
                (['classic', 'plus', 'seasonal'] as const).map((category) => {
                  const categoryTrees = trees.filter((t) => t.category === category && t.unlocked);
                  if (categoryTrees.length === 0) return null;

                  return (
                    <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color:
                            category === 'plus'
                              ? '#CE93D8'
                              : category === 'seasonal'
                              ? '#FFB74D'
                              : '#81C784',
                          letterSpacing: '0.05em',
                          paddingLeft: '4px',
                        }}
                      >
                        {category === 'plus' ? 'Exclusive Plus ✨' : category === 'seasonal' ? 'Seasonal 🍂' : 'Classic'}
                      </span>

                      {categoryTrees.map((tree) => {
                        const isSelected = settings.selectedTreeId === tree.id;
                        return (
                          <div
                            key={tree.id}
                            onClick={() => {
                              forestStore.updateSettings({ selectedTreeId: tree.id });
                              setShowTreePicker(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              background: isSelected ? 'rgba(46, 125, 50, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: isSelected ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Trees size={20} color={tree.colors.primary} />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{tree.name}</div>
                                <div style={{ fontSize: '10px', color: '#A5D6A7' }}>{tree.description}</div>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 size={16} color="#81C784" />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                lands
                  .filter((l) => l.unlocked)
                  .map((land) => {
                    const isSelected = settings.selectedLandId === land.id;
                    return (
                      <div
                        key={land.id}
                        onClick={() => {
                          forestStore.updateSettings({ selectedLandId: land.id });
                          setShowTreePicker(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(46, 125, 50, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: land.groundColor,
                              border: `1px solid ${land.borderColor}`,
                            }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{land.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#81C784" />}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer Shortcut to Store */}
            <button
              onClick={() => {
                setShowTreePicker(false);
                forestStore.setActiveView('store');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#C8E6C9',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              <Sparkles size={13} color="#FFD700" />
              <span>Get More Species & Lands in Store &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* --- QUICK TAG PICKER BOTTOM SHEET --- */}
      {showTagPicker && (
        <div
          onClick={() => setShowTagPicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              maxHeight: '65vh',
              background: '#182E21',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Select Focus Tag</h3>
              <button
                onClick={() => setShowTagPicker(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A5D6A7',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tags.map((tag) => {
                const isSelected = settings.selectedTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    onClick={() => {
                      forestStore.updateSettings({ selectedTagId: tag.id });
                      setShowTagPicker(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(46, 125, 50, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: tag.color,
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{tag.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="#81C784" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK AMBIENT SOUNDSCAPE PICKER MODAL --- */}
      {showAmbientPicker && (
        <div
          onClick={() => setShowAmbientPicker(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '75%',
              background: '#1B3425',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '18px 16px 24px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid rgba(129, 199, 132, 0.3)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Headphones size={18} color="#81C784" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Ambient Soundscape</h3>
              </div>
              <button
                onClick={() => setShowAmbientPicker(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A5D6A7',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Status & Play/Stop Toggle */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeAmbientTrack ? activeAmbientTrack.title : 'No Track Selected'}
                </span>
                <span style={{ fontSize: '10px', color: isAmbientPlaying ? '#81C784' : '#A5D6A7' }}>
                  {isAmbientPlaying ? 'Playing' : 'Stopped'}
                </span>
              </div>

              <button
                onClick={() => forestStore.toggleAmbient()}
                style={{
                  background: isAmbientPlaying ? 'rgba(239, 83, 80, 0.25)' : '#4CAF50',
                  border: isAmbientPlaying ? '1px solid #EF5350' : 'none',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isAmbientPlaying ? <Square size={10} fill="#FFF" /> : <Play size={10} fill="#FFF" />}
                <span>{isAmbientPlaying ? 'Stop' : 'Play'}</span>
              </button>
            </div>

            {/* Mini Volume Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '6px 12px',
                borderRadius: '10px',
              }}
            >
              <Volume2 size={14} color="#81C784" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => forestStore.setAmbientVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#81C784', cursor: 'pointer', height: '4px' }}
              />
              <span style={{ fontSize: '10px', color: '#E8F5E9', fontWeight: 700, minWidth: '30px', textAlign: 'right' }}>
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>

            {/* Quick Track Switcher */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#81C784', letterSpacing: '0.06em' }}>
                Soundscapes
              </span>
              {ambientTracks.map((t) => {
                const isSelected = activeAmbientId === t.id;
                const isPlayingThis = isSelected && isAmbientPlaying;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (isPlayingThis) {
                        forestStore.stopAmbient();
                      } else {
                        forestStore.playAmbient(t.id);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                      border: isPlayingThis ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      {t.category === 'youtube' ? (
                        <Music size={13} color={isPlayingThis ? '#FF8A80' : '#A5D6A7'} />
                      ) : (
                        <Headphones size={13} color={isPlayingThis ? '#81C784' : '#A5D6A7'} />
                      )}
                      <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </span>
                    </div>
                    {isPlayingThis ? (
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#81C784' }}>PLAYING</span>
                    ) : isSelected ? (
                      <CheckCircle2 size={14} color="#81C784" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Link to Full Studio */}
            <button
              onClick={() => {
                forestStore.setActiveView('ambient');
                setShowAmbientPicker(false);
              }}
              style={{
                marginTop: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '8px',
                color: '#C8E6C9',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Open Full Ambient Studio →
            </button>
          </div>
        </div>
      )}

      {/* --- CELEBRATION SUMMARY OVERLAY (Completed or Withered) --- */}
      {(timer.status === 'completed' || timer.status === 'withered') && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            right: '20px',
            background:
              timer.status === 'completed'
                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(27, 94, 32, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(62, 39, 35, 0.95) 0%, rgba(38, 25, 22, 0.95) 100%)',
            border:
              timer.status === 'completed'
                ? '1px solid rgba(129, 199, 132, 0.5)'
                : '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {timer.status === 'completed' ? (
              <CheckCircle2 color="#81C784" size={24} />
            ) : (
              <AlertTriangle color="#EF5350" size={24} />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                {timer.status === 'completed' ? 'Session Complete!' : 'Tree Withered'}
              </div>
              <div style={{ fontSize: '11px', color: '#E8F5E9' }}>
                {timer.status === 'completed'
                  ? `${Math.floor(timer.elapsedSeconds / 60)} minutes focused`
                  : 'Better luck next session!'}
              </div>
            </div>
          </div>

          {timer.status === 'completed' && (timer.lastEarnedCoins || 0) > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 215, 0, 0.2)',
                padding: '4px 10px',
                borderRadius: '14px',
                color: '#FFD700',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              <Coins size={14} />
              <span>+{timer.lastEarnedCoins}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
