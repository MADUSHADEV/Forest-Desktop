import React, { useEffect } from 'react';
import {
  Menu,
  ArrowLeft,
  Plus,
  Coins,
  Tag,
  RefreshCw,
  AlertCircle,
  Layers,
  History,
  Trophy,
  Headphones,
  ShoppingBag,
  Settings,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { NavDrawer } from './NavDrawer';
import { TimerView } from '../../modules/timer/TimerView';
import { ForestView } from '../../modules/forest/ForestView';
import { TimelineView } from '../../modules/timeline/TimelineView';
import { TagsView } from '../../modules/tags/TagsView';
import { ChallengesView } from '../../modules/challenges/ChallengesView';
import { AmbientView } from '../../modules/ambient/AmbientView';
import { StoreView } from '../../modules/store/StoreView';
import { SettingsView } from '../../modules/settings/SettingsView';
import { AmbientPlayerDock } from '../ambient/AmbientPlayerDock';

const VIEW_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  forest: { label: 'Forest', icon: <Layers size={13} /> },
  timeline: { label: 'Timeline', icon: <History size={13} /> },
  tags: { label: 'Tags', icon: <Tag size={13} /> },
  challenges: { label: 'Challenges', icon: <Trophy size={13} /> },
  ambient: { label: 'Ambient', icon: <Headphones size={13} /> },
  store: { label: 'Store', icon: <ShoppingBag size={13} /> },
  settings: { label: 'Settings', icon: <Settings size={13} /> },
};

export const AppShell: React.FC = () => {
  const isLoading = useForestSelector((s) => s.isLoading);
  const error = useForestSelector((s) => s.error);
  const activeView = useForestSelector((s) => s.activeView);
  const isSessionActive = useForestSelector((s) => s.isSessionActive);
  const coins = useForestSelector((s) => s.settings.coins);
  const selectedTagId = useForestSelector((s) => s.settings.selectedTagId);
  const selectedLandId = useForestSelector((s) => s.settings.selectedLandId);
  const isAmbientPlaying = useForestSelector((s) => s.isAmbientPlaying);
  const tags = useForestSelector((s) => s.tags);
  const lands = useForestSelector((s) => s.lands);

  const activeTag = tags.find((t) => t.id === selectedTagId) || tags[0];
  const activeLand = lands.find((l) => l.id === selectedLandId) || lands[0];

  // Dynamic Land Background Gradient (defaults to requested vibrant #51a387)
  const bgGradient = activeLand?.bgGradient
    ? `linear-gradient(180deg, ${activeLand.bgGradient[0]} 0%, ${activeLand.bgGradient[1]} 100%)`
    : 'linear-gradient(180deg, #51a387 0%, #3d826a 100%)';

  // Desktop Escape key back navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = forestStore.getState();
        if (state.isDrawerOpen) {
          forestStore.setDrawerOpen(false);
        } else if (state.activeView !== 'timer' && !state.isSessionActive) {
          forestStore.goBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#51a387',
          gap: '16px',
        }}
      >
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#E8F5E9', width: 36, height: 36 }} />
        <p style={{ color: '#F1F8F3', fontSize: '13px', fontWeight: 600 }}>Loading Forest World...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#51a387',
          gap: '16px',
          color: '#FFCDD2',
          textAlign: 'center',
        }}
      >
        <AlertCircle color="#EF5350" size={32} />
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Unable to Load Forest</h2>
        <p style={{ fontSize: '12px', color: '#E57373', maxWidth: '300px' }}>{error}</p>
        <button
          onClick={() => forestStore.init()}
          style={{
            background: '#2E7D32',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isTimerView = activeView === 'timer';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: bgGradient,
        color: '#FFFFFF',
        overflow: 'hidden',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Navigation Drawer */}
      <NavDrawer />

      {/* Top Mobile Header Bar */}
      <header
        style={{
          height: '56px',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Left Side: On Timer view shows Hamburger Menu; On other views shows Back Button + Drawer shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!isTimerView ? (
            <button
              onClick={() => forestStore.goBack()}
              aria-label="Go back to previous screen"
              title="Go back to previous screen (Esc)"
              style={{
                background: 'rgba(0, 0, 0, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '18px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={() => forestStore.setDrawerOpen(true)}
              disabled={isSessionActive}
              aria-label="Open Navigation Drawer"
              title="Open Navigation Menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: isSessionActive ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF',
                cursor: isSessionActive ? 'not-allowed' : 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <Menu size={22} />
            </button>
          )}

          {/* Additional quick drawer shortcut when on sub-screens */}
          {!isTimerView && (
            <button
              onClick={() => forestStore.setDrawerOpen(true)}
              disabled={isSessionActive}
              aria-label="Open Navigation Drawer"
              title="Navigation Menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.85)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Center: On Timer view shows Tag selector; On sub-views shows Screen Title badge */}
        {isTimerView ? (
          <button
            onClick={() => forestStore.setActiveView('tags')}
            title="Change Focus Tag"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
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
          </button>
        ) : (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.2px',
            }}
          >
            {VIEW_CONFIG[activeView]?.icon}
            <span>{VIEW_CONFIG[activeView]?.label || activeView}</span>
          </div>
        )}

        {/* Right: Coin Wallet Pill + Shortcut to Store */}
        <button
          onClick={() => forestStore.setActiveView('store')}
          title="Open Store & Nursery"
          style={{
            background: 'rgba(255, 215, 0, 0.18)',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '16px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            color: '#FFD700',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Coins size={14} color="#FFD700" />
          <span>{coins}</span>
          <Plus size={11} strokeWidth={3} />
        </button>
      </header>

      {/* Main View Area: Conditionally Mount ONLY activeView to guarantee 0 inactive DOM nodes */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {activeView === 'timer' && <TimerView />}
        {activeView === 'forest' && <ForestView />}
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'tags' && <TagsView />}
        {activeView === 'challenges' && <ChallengesView />}
        {activeView === 'ambient' && <AmbientView />}
        {activeView === 'store' && <StoreView />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {/* Persistent Audio Controller Dock */}
      <AmbientPlayerDock />
    </div>
  );
};
