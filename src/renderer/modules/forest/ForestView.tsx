import React, { useState, useMemo } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Trees,
  AlertTriangle,
  Clock,
  Coins,
  MapPin,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { IsometricForestGrid } from '../../components/forest/IsometricForestGrid';
import { FocusSession, LandStyle } from '../../../shared/types';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export const ForestView: React.FC = () => {
  const sessions = useForestSelector((s) => s.sessions);
  const lands = useForestSelector((s) => s.lands);
  const trees = useForestSelector((s) => s.trees);
  const tags = useForestSelector((s) => s.tags);
  const selectedLandId = useForestSelector((s) => s.settings.selectedLandId);

  const [period, setPeriod] = useState<TimePeriod>('day');
  const [periodOffset, setPeriodOffset] = useState<number>(0); // 0 = current, -1 = previous, etc.
  const [previewLandId, setPreviewLandId] = useState<string>(selectedLandId);

  const activeLand = lands.find((l) => l.id === previewLandId) || lands[0];

  // Calculate target period start & end timestamps based on period and offset
  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();

    if (period === 'day') {
      const target = new Date(now);
      target.setDate(now.getDate() + periodOffset);
      target.setHours(0, 0, 0, 0);
      const end = new Date(target);
      end.setHours(23, 59, 59, 999);

      const isToday = periodOffset === 0;
      const isYesterday = periodOffset === -1;
      const dateLabel = isToday
        ? 'Today'
        : isYesterday
        ? 'Yesterday'
        : target.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return { startDate: target.getTime(), endDate: end.getTime(), label: dateLabel };
    }

    if (period === 'week') {
      const target = new Date(now);
      const dayOfWeek = target.getDay(); // 0 is Sun
      const distanceToMon = (dayOfWeek + 6) % 7;
      target.setDate(now.getDate() - distanceToMon + periodOffset * 7);
      target.setHours(0, 0, 0, 0);

      const end = new Date(target);
      end.setDate(target.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekLabel =
        periodOffset === 0
          ? 'This Week'
          : periodOffset === -1
          ? 'Last Week'
          : `${target.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

      return { startDate: target.getTime(), endDate: end.getTime(), label: weekLabel };
    }

    if (period === 'month') {
      const target = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1, 0, 0, 0, 0);
      const end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthLabel =
        periodOffset === 0
          ? 'This Month'
          : target.toLocaleDateString([], { month: 'long', year: 'numeric' });

      return { startDate: target.getTime(), endDate: end.getTime(), label: monthLabel };
    }

    // year
    const target = new Date(now.getFullYear() + periodOffset, 0, 1, 0, 0, 0, 0);
    const end = new Date(target.getFullYear(), 11, 31, 23, 59, 59, 999);
    const yearLabel = String(target.getFullYear());

    return { startDate: target.getTime(), endDate: end.getTime(), label: yearLabel };
  }, [period, periodOffset]);

  // Filter sessions in this period
  const periodSessions = useMemo(() => {
    return sessions.filter((s) => s.startTime >= startDate && s.startTime <= endDate);
  }, [sessions, startDate, endDate]);

  const completedSessions = useMemo(
    () => periodSessions.filter((s) => s.status === 'completed'),
    [periodSessions],
  );
  const witheredSessions = useMemo(
    () => periodSessions.filter((s) => s.status === 'withered'),
    [periodSessions],
  );

  const totalFocusSecs = useMemo(
    () => completedSessions.reduce((acc, s) => acc + s.durationSeconds, 0),
    [completedSessions],
  );

  const totalCoinsEarned = useMemo(
    () => completedSessions.reduce((acc, s) => acc + s.coinsEarned, 0),
    [completedSessions],
  );

  const formatHoursMins = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Pure SVG Bar Chart Buckets
  const barBuckets = useMemo(() => {
    if (period === 'day') {
      // 6 buckets of 4 hours each: 0-4, 4-8, 8-12, 12-16, 16-20, 20-24
      const buckets = [
        { label: '04h', mins: 0 },
        { label: '08h', mins: 0 },
        { label: '12h', mins: 0 },
        { label: '16h', mins: 0 },
        { label: '20h', mins: 0 },
        { label: '24h', mins: 0 },
      ];
      for (const s of completedSessions) {
        const hour = new Date(s.startTime).getHours();
        const bIdx = Math.min(5, Math.floor(hour / 4));
        buckets[bIdx].mins += Math.floor(s.durationSeconds / 60);
      }
      return buckets;
    }

    if (period === 'week') {
      // 7 buckets: Mon to Sun
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const buckets = dayLabels.map((l) => ({ label: l, mins: 0 }));
      for (const s of completedSessions) {
        const d = new Date(s.startTime).getDay();
        const monIdx = (d + 6) % 7;
        buckets[monIdx].mins += Math.floor(s.durationSeconds / 60);
      }
      return buckets;
    }

    if (period === 'month') {
      // 4 weekly quarters in month
      const buckets = [
        { label: 'W1', mins: 0 },
        { label: 'W2', mins: 0 },
        { label: 'W3', mins: 0 },
        { label: 'W4', mins: 0 },
      ];
      for (const s of completedSessions) {
        const dateNum = new Date(s.startTime).getDate();
        const bIdx = Math.min(3, Math.floor((dateNum - 1) / 7));
        buckets[bIdx].mins += Math.floor(s.durationSeconds / 60);
      }
      return buckets;
    }

    // year: 12 months
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const buckets = monthLabels.map((l) => ({ label: l, mins: 0 }));
    for (const s of completedSessions) {
      const m = new Date(s.startTime).getMonth();
      buckets[m].mins += Math.floor(s.durationSeconds / 60);
    }
    return buckets;
  }, [completedSessions, period]);

  const maxBucketMins = Math.max(1, ...barBuckets.map((b) => b.mins));

  // Tag distribution stats
  const tagDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completedSessions) {
      map.set(s.tagId, (map.get(s.tagId) || 0) + s.durationSeconds);
    }
    return Array.from(map.entries())
      .map(([tagId, durationSecs]) => {
        const tag = tags.find((t) => t.id === tagId);
        const percent = totalFocusSecs > 0 ? Math.round((durationSecs / totalFocusSecs) * 100) : 0;
        return {
          id: tagId,
          name: tag?.name || 'Focus',
          color: tag?.color || '#81C784',
          durationSecs,
          percent,
        };
      })
      .sort((a, b) => b.durationSecs - a.durationSecs);
  }, [completedSessions, tags, totalFocusSecs]);

  // Top Planted Species
  const topSpecies = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completedSessions) {
      map.set(s.treeSpeciesId, (map.get(s.treeSpeciesId) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => {
        const tree = trees.find((t) => t.id === id);
        return { id, name: tree?.name || 'Tree', color: tree?.colors.primary || '#81C784', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [completedSessions, trees]);

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflowY: 'auto',
        userSelect: 'none',
      }}
    >
      {/* 1. Header & Period Segmented Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers color="#81C784" size={20} />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>Focus Analytics</h2>
          </div>

          {/* Stepper Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '3px 8px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setPeriodOffset((p) => p - 1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#A5D6A7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', minWidth: '70px', textAlign: 'center' }}>
              {label}
            </span>
            <button
              onClick={() => setPeriodOffset((p) => Math.min(0, p + 1))}
              disabled={periodOffset === 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: periodOffset === 0 ? 'rgba(255,255,255,0.2)' : '#A5D6A7',
                cursor: periodOffset === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Period Pills (Day / Week / Month / Year) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '3px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setPeriodOffset(0);
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: '8px',
                border: 'none',
                background: period === p ? '#2E7D32' : 'transparent',
                color: period === p ? '#FFFFFF' : '#A5D6A7',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Hero 2.5D Isometric Forest Card */}
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          position: 'relative',
        }}
      >
        {/* Land Switcher Quick Pill */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 20,
          }}
        >
          <select
            value={previewLandId}
            onChange={(e) => setPreviewLandId(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '4px 8px',
              color: '#C8E6C9',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {lands.map((l) => (
              <option key={l.id} value={l.id} style={{ background: '#182E21', color: '#FFFFFF' }}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2.5D Isometric Platform */}
        <IsometricForestGrid
          sessions={periodSessions}
          land={activeLand}
          trees={trees}
          tags={tags}
          size={{ width: 340, height: 230 }}
        />
      </section>

      {/* 3. 4-Card KPI Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(76, 175, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trees size={16} color="#81C784" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{completedSessions.length}</div>
            <div style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 600 }}>Planted Trees</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 83, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} color="#EF5350" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{witheredSessions.length}</div>
            <div style={{ fontSize: '10px', color: '#EF9A9A', fontWeight: 600 }}>Withered</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(33, 150, 243, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={16} color="#64B5F6" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{formatHoursMins(totalFocusSecs)}</div>
            <div style={{ fontSize: '10px', color: '#90CAF9', fontWeight: 600 }}>Focus Time</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={16} color="#FFD700" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFD700' }}>{totalCoinsEarned}</div>
            <div style={{ fontSize: '10px', color: '#FFE082', fontWeight: 600 }}>Coins Earned</div>
          </div>
        </div>
      </div>

      {/* 4. Pure-SVG Focus Time Distribution Bar Chart */}
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={15} color="#81C784" />
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Focus Time Distribution
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: '#A5D6A7', fontWeight: 700 }}>
            Peak: {maxBucketMins}m
          </span>
        </div>

        {/* SVG Bar Chart */}
        <div style={{ width: '100%', height: '110px' }}>
          <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
            {/* Horizontal baseline */}
            <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {barBuckets.map((bucket, idx) => {
              const totalBars = barBuckets.length;
              const slotWidth = 300 / totalBars;
              const barWidth = Math.max(8, slotWidth * 0.55);
              const barX = idx * slotWidth + (slotWidth - barWidth) / 2;
              const barHeight = bucket.mins > 0 ? Math.max(4, (bucket.mins / maxBucketMins) * 65) : 0;
              const barY = 80 - barHeight;

              return (
                <g key={`bar-${idx}`}>
                  {/* Bar */}
                  {barHeight > 0 && (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={idx % 2 === 0 ? '#4CAF50' : '#81C784'}
                    />
                  )}
                  {/* Label */}
                  <text
                    x={barX + barWidth / 2}
                    y="94"
                    textAnchor="middle"
                    fill="#A5D6A7"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {bucket.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* 5. Tag & Species Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        {/* Tag Breakdown */}
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={15} color="#81C784" />
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tag Breakdown
            </h3>
          </div>

          {tagDistribution.length === 0 ? (
            <p style={{ fontSize: '11px', color: '#A5D6A7' }}>No tag activity in this period.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tagDistribution.map((t) => (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }} />
                      <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{t.name}</span>
                    </div>
                    <span style={{ color: '#C8E6C9', fontWeight: 600 }}>
                      {formatHoursMins(t.durationSecs)} ({t.percent}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.percent}%`, height: '100%', background: t.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Species */}
        {topSpecies.length > 0 && (
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trees size={15} color="#81C784" />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top Planted Species
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {topSpecies.map((sp, idx) => (
                <div
                  key={sp.id}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: sp.color }}>{sp.count}</div>
                  <div style={{ fontSize: '10px', color: '#E8F5E9', fontWeight: 600, marginTop: '2px' }}>{sp.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
