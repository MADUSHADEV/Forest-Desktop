import React from 'react';
import {
  Trees,
  Layers,
  History,
  Tag,
  Trophy,
  Headphones,
  ShoppingBag,
  Settings,
  X,
  Compass,
} from 'lucide-react';
import { useForestSelector, forestStore, ActiveView } from '../../state/forestStore';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'timer', label: 'Plant', icon: Trees },
  { id: 'forest', label: 'Forest', icon: Layers },
  { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'ambient', label: 'Ambient Sounds', icon: Headphones },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const NavDrawer: React.FC = () => {
  const isDrawerOpen = useForestSelector((s) => s.isDrawerOpen);
  const activeView = useForestSelector((s) => s.activeView);
  const trees = useForestSelector((s) => s.trees);
  const lands = useForestSelector((s) => s.lands);
  const selectedLandId = useForestSelector((s) => s.settings.selectedLandId);

  const unlockedTreesCount = trees.filter((t) => t.unlocked).length;
  const activeLand = lands.find((l) => l.id === selectedLandId) || lands[0];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={() => forestStore.setDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 18, 12, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isDrawerOpen ? 1 : 0,
          pointerEvents: isDrawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 40,
        }}
      />

      {/* Drawer panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          background: 'linear-gradient(180deg, #182E21 0%, #13241A 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '8px 0 24px rgba(0, 0, 0, 0.45)',
          transform: isDrawerOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          willChange: 'transform',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 18px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(46, 125, 50, 0.35)',
              }}
            >
              <Trees color="#E8F5E9" size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>Forest</h2>
              <span style={{ fontSize: '11px', color: '#81C784', fontWeight: 600 }}>Stay focused, be present</span>
            </div>
          </div>

          <button
            onClick={() => forestStore.setDrawerOpen(false)}
            aria-label="Close navigation drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#C8E6C9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => forestStore.setActiveView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'rgba(46, 125, 50, 0.35)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#A5D6A7',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  borderLeft: isActive ? '3px solid #81C784' : '3px solid transparent',
                }}
              >
                <IconComponent size={18} color={isActive ? '#81C784' : '#81C784'} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer Summary */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#81C784', fontWeight: 600 }}>Garden Progress</span>
            <span style={{ fontSize: '11px', color: '#E8F5E9', fontWeight: 700 }}>
              {unlockedTreesCount}/{trees.length} Trees
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={12} color="#A5D6A7" />
            <span style={{ fontSize: '11px', color: '#C8E6C9' }}>{activeLand?.name || 'Classic Lush Meadow'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
