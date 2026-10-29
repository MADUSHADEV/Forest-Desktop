import React, { useState } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coins,
  MessageSquare,
  Sparkles,
  Tag,
  Check,
  Plus,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { TreeStageSvg } from '../../components/trees/TreeStageSvg';
import { FocusSession } from '../../../shared/types';

export const TimelineView: React.FC = () => {
  const sessions = useForestSelector((s) => s.sessions);
  const trees = useForestSelector((s) => s.trees);
  const tags = useForestSelector((s) => s.tags);
  const settings = useForestSelector((s) => s.settings);

  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  // Filter by tag if selected
  const filteredSessions =
    selectedTagFilter === 'all'
      ? sessions
      : sessions.filter((s) => s.tagId === selectedTagFilter);

  // Group filtered sessions by calendar day string (e.g., "Today", "Yesterday", "Oct 29, 2026")
  const groupedSessions = React.useMemo(() => {
    const groups: Array<{ dateKey: string; label: string; items: FocusSession[] }> = [];
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    for (const session of filteredSessions) {
      const d = new Date(session.startTime);
      const dStr = d.toDateString();

      let label = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      if (dStr === todayStr) label = 'Today';
      else if (dStr === yesterdayStr) label = 'Yesterday';

      let group = groups.find((g) => g.dateKey === dStr);
      if (!group) {
        group = { dateKey: dStr, label, items: [] };
        groups.push(group);
      }
      group.items.push(session);
    }

    return groups;
  }, [filteredSessions]);

  const handleStartEditNote = (session: FocusSession) => {
    setEditingSessionId(session.id);
    setTempNote(session.note || '');
  };

  const handleSaveNote = async (sessionId: string) => {
    await forestStore.updateSessionNote(sessionId, tempNote);
    setEditingSessionId(null);
  };

  const handlePlantDemoSession = async () => {
    // Allows user to immediately create a 25m demo session for testing
    if (!window.forestAPI) return;
    const now = Date.now();
    await window.forestAPI.recordFocusSession({
      startTime: now - 1500000,
      endTime: now,
      durationSeconds: 1500,
      mode: 'countdown',
      treeSpeciesId: settings.selectedTreeId,
      tagId: settings.selectedTagId,
      status: 'completed',
      coinsEarned: 20,
      note: 'Finished feature implementation and code review.',
    });
    // Refresh sessions
    forestStore.refreshMetrics();
  };

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
      {/* Header & Demo Session Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History color="#81C784" size={20} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>Focus History</h2>
        </div>

        <button
          onClick={handlePlantDemoSession}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '5px 10px',
            color: '#C8E6C9',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={12} color="#FFD700" />
          <span>Demo Session</span>
        </button>
      </div>

      {/* Tag Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setSelectedTagFilter('all')}
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: selectedTagFilter === 'all' ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
            background: selectedTagFilter === 'all' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(0, 0, 0, 0.2)',
            color: selectedTagFilter === 'all' ? '#FFFFFF' : '#A5D6A7',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All Tags
        </button>

        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTagFilter(t.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: selectedTagFilter === t.id ? t.color : 'rgba(255, 255, 255, 0.1)',
              background: selectedTagFilter === t.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color }} />
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Chronological Groups */}
      {groupedSessions.length === 0 ? (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Clock size={32} color="#81C784" opacity={0.6} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>No Sessions in History</h3>
          <p style={{ fontSize: '12px', color: '#A5D6A7', maxWidth: '240px' }}>
            Complete a timer session or click "Demo Session" above to see your chronological history log!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {groupedSessions.map((group) => (
            <div key={group.dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Date Header Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#81C784' }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              </div>

              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((session) => {
                  const tree = trees.find((t) => t.id === session.treeSpeciesId) || trees[0];
                  const tag = tags.find((t) => t.id === session.tagId);
                  const isCompleted = session.status === 'completed';
                  const startTimeStr = new Date(session.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endTimeStr = new Date(session.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isEditingNote = editingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '14px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {/* Top Row: Thumbnail + Info + Coin Reward */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Tree Sprite Thumbnail */}
                          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TreeStageSvg
                              species={tree}
                              progress={isCompleted ? 1.0 : 0.5}
                              status={session.status}
                              size={40}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                                {tree.name}
                              </span>
                              {tag && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: tag.color,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {tag.name}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '11px', color: '#A5D6A7', marginTop: '2px' }}>
                              {Math.floor(session.durationSeconds / 60)}m &bull; {startTimeStr} – {endTimeStr}
                            </div>
                          </div>
                        </div>

                        {/* Status Icon & Coins */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCompleted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '12px', fontWeight: 800 }}>
                              <Coins size={13} />
                              <span>+{session.coinsEarned}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF5350', fontSize: '11px', fontWeight: 700 }}>
                              <AlertTriangle size={13} />
                              <span>Withered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reflection Note Row */}
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        {isEditingNote ? (
                          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                            <input
                              type="text"
                              value={tempNote}
                              placeholder="What did you focus on?"
                              onChange={(e) => setTempNote(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                outline: 'none',
                              }}
                            />
                            <button
                              onClick={() => handleSaveNote(session.id)}
                              style={{
                                background: '#2E7D32',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditNote(session)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: '100%',
                              cursor: 'pointer',
                            }}
                          >
                            <MessageSquare size={12} color="#81C784" />
                            <span
                              style={{
                                fontSize: '11px',
                                color: session.note ? '#E8F5E9' : 'rgba(255, 255, 255, 0.35)',
                                fontStyle: session.note ? 'normal' : 'italic',
                                flex: 1,
                              }}
                            >
                              {session.note || 'Add reflection note...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
