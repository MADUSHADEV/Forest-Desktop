import React, { useState } from 'react';
import {
  Trophy,
  Coins,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { FocusChallenge } from '../../../shared/types';

export const ChallengesView: React.FC = () => {
  const challenges = useForestSelector((s) => s.challenges);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [celebrationId, setCelebrationId] = useState<string | null>(null);

  const completedCount = challenges.filter((c) => c.completed).length;
  const claimedCount = challenges.filter((c) => c.claimed).length;
  const totalEarnedCoins = challenges
    .filter((c) => c.claimed)
    .reduce((sum, c) => sum + c.rewardCoins, 0);

  const noPauseChallenge = challenges.find((c) => c.targetType === 'no_pause_streak');
  const currentStreak = noPauseChallenge ? noPauseChallenge.currentValue : 0;

  const handleClaim = async (ch: FocusChallenge) => {
    if (!ch.completed || ch.claimed || claimingId) return;

    setClaimingId(ch.id);
    const success = await forestStore.claimChallengeReward(ch.id);
    if (success) {
      setCelebrationId(ch.id);
      setTimeout(() => setCelebrationId(null), 2500);
    }
    setClaimingId(null);
  };

  const handleResetCompleted = async () => {
    await forestStore.resetCompletedChallenges();
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
          <Trophy color="#FFD700" size={20} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Focus Milestones
          </h2>
        </div>

        {claimedCount > 0 && (
          <button
            onClick={handleResetCompleted}
            title="Reset completed milestones to replay and earn again"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '4px 10px',
              color: '#C8E6C9',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RotateCcw size={11} />
            <span>Reset Daily</span>
          </button>
        )}
      </div>

      {/* Progress Summary KPI Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.35) 0%, rgba(27, 94, 32, 0.25) 100%)',
          border: '1px solid rgba(129, 199, 132, 0.35)',
          borderRadius: '16px',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#A5D6A7', textTransform: 'uppercase', fontWeight: 800 }}>
            Completed
          </span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {completedCount} / {challenges.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#FFD700', textTransform: 'uppercase', fontWeight: 800 }}>
            Reward Coins
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
            <Coins size={14} color="#FFD700" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFD700' }}>{totalEarnedCoins}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#81D4FA', textTransform: 'uppercase', fontWeight: 800 }}>
            Zen Streak
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Flame size={14} color="#FF8A80" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {challenges.map((ch) => {
          const progressPercent = Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100));
          const canClaim = ch.completed && !ch.claimed;
          const isCelebrated = celebrationId === ch.id;

          return (
            <div
              key={ch.id}
              style={{
                background: ch.claimed
                  ? 'rgba(46, 125, 50, 0.15)'
                  : ch.completed
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(46, 125, 50, 0.22) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: canClaim
                  ? '1.5px solid #FFD700'
                  : ch.claimed
                  ? '1px solid rgba(129, 199, 132, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                boxShadow: canClaim ? '0 4px 18px rgba(255, 215, 0, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Top Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                  <ChallengeBadge targetType={ch.targetType} isCompleted={ch.completed} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{ch.title}</h3>
                      {ch.claimed && <CheckCircle2 size={14} color="#81C784" />}
                    </div>
                    <p style={{ fontSize: '11px', color: '#A5D6A7', marginTop: '2px', lineHeight: 1.3 }}>
                      {ch.description}
                    </p>
                  </div>
                </div>

                {/* Right Action / Reward Pill */}
                <div style={{ flexShrink: 0 }}>
                  {ch.claimed ? (
                    <div
                      style={{
                        background: 'rgba(76, 175, 80, 0.2)',
                        border: '1px solid #81C784',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        color: '#81C784',
                        fontSize: '10px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>Claimed</span>
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaim(ch)}
                      disabled={claimingId === ch.id}
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '6px 12px',
                        color: '#182E21',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 3px 12px rgba(255, 215, 0, 0.4)',
                        animation: isCelebrated ? 'pulse 0.4s ease 2' : 'none',
                      }}
                    >
                      <Sparkles size={12} fill="#182E21" />
                      <span>Claim +{ch.rewardCoins}</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 215, 0, 0.12)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        color: '#FFD700',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      <Coins size={12} />
                      <span>+{ch.rewardCoins}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar & Readout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#C8E6C9', fontWeight: 700 }}>
                  <span>Progress</span>
                  <span>
                    {ch.currentValue} / {ch.targetValue} ({progressPercent}%)
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: ch.claimed
                        ? '#81C784'
                        : ch.completed
                        ? 'linear-gradient(90deg, #FFD700 0%, #FFA000 100%)'
                        : '#4CAF50',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// --- Custom Pure SVG Challenge Badges ---
const ChallengeBadge: React.FC<{
  targetType: FocusChallenge['targetType'];
  isCompleted: boolean;
}> = ({ targetType, isCompleted }) => {
  const accentColor = isCompleted ? '#FFD700' : '#81C784';

  switch (targetType) {
    case 'sessions_count':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="13" fill={accentColor} fillOpacity="0.18" stroke={accentColor} strokeWidth="1.5" />
          <path d="M14 6V19M14 19L11 15M14 19L17 15" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="21" r="1.5" fill={accentColor} />
        </svg>
      );

    case 'total_minutes':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="13" fill={accentColor} fillOpacity="0.18" stroke={accentColor} strokeWidth="1.5" />
          <path d="M10 8H18M10 20H18M14 12V14L16 16" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 8L14 14L18 8M10 20L14 14L18 20" stroke={accentColor} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );

    case 'no_pause_streak':
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="13" fill={accentColor} fillOpacity="0.18" stroke={accentColor} strokeWidth="1.5" />
          <path d="M14 6L20 9V14C20 18 17 21 14 22C11 21 8 18 8 14V9L14 6Z" fill={accentColor} fillOpacity="0.25" stroke={accentColor} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 14L13.5 15.5L16.5 12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'seasonal_trees':
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="13" fill={accentColor} fillOpacity="0.18" stroke={accentColor} strokeWidth="1.5" />
          <path d="M14 6C14 6 9 10 9 15C9 18 11.2 20.5 14 20.5C16.8 20.5 19 18 19 15C19 10 14 6 14 6Z" fill={accentColor} fillOpacity="0.25" stroke={accentColor} strokeWidth="1.5" />
          <path d="M14 11V22M14 15L11 13M14 17L17 15" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
};
