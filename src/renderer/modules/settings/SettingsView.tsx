import React, { useState, useEffect } from 'react';
import {
  Settings,
  PauseCircle,
  PlayCircle,
  Coffee,
  Clock,
  CheckCircle2,
  Database,
  Cpu,
  Coins,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Trees,
  MapPin,
  Tag,
  Trophy,
  Headphones,
  Bell,
  Volume2,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { soundEffects } from '../../services/SoundEffects';
import { SystemDiagnostics } from '../../../shared/types';

export const SettingsView: React.FC = () => {
  const settings = useForestSelector((s) => s.settings);
  const trees = useForestSelector((s) => s.trees);
  const lands = useForestSelector((s) => s.lands);
  const tags = useForestSelector((s) => s.tags);
  const challenges = useForestSelector((s) => s.challenges);
  const ambientTracks = useForestSelector((s) => s.ambientTracks);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isLoadingDiag, setIsLoadingDiag] = useState(false);
  const [showFoundationDetails, setShowFoundationDetails] = useState(false);
  const [ipcTestNotice, setIpcTestNotice] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    if (window.forestAPI?.getDiagnostics) {
      setIsLoadingDiag(true);
      try {
        const diag = await window.forestAPI.getDiagnostics();
        setDiagnostics(diag);
      } catch (err) {
        console.error('Failed to fetch diagnostics:', err);
      } finally {
        setIsLoadingDiag(false);
      }
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const showNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleToggleAllowPause = async () => {
    const nextVal = !settings.allowPause;
    await forestStore.updateSettings({ allowPause: nextVal });
    showNotification(nextVal ? 'Pause allowed in focus sessions' : 'Strict Mode: Pauses disabled');
  };

  const handleToggleAutoFocus = async () => {
    const nextVal = !settings.autoFocusAfterBreak;
    await forestStore.updateSettings({ autoFocusAfterBreak: nextVal });
    showNotification(nextVal ? 'Auto-focus after break enabled' : 'Auto-focus disabled');
  };

  const handleFocusDurationChange = async (minutes: number) => {
    const clamped = Math.min(120, Math.max(10, minutes));
    await forestStore.updateSettings({ defaultFocusMinutes: clamped });
    showNotification(`Default focus set to ${clamped}m`);
  };

  const handleBreakDurationChange = async (minutes: number) => {
    const clamped = Math.min(30, Math.max(5, minutes));
    await forestStore.updateSettings({ breakDurationMinutes: clamped });
    showNotification(`Break duration set to ${clamped}m`);
  };

  const handleGrantTestCoins = async () => {
    const newCoins = await forestStore.grantTestCoins(500);
    showNotification(`+500 Coins added! Total: ${newCoins}`);
    fetchDiagnostics();
  };

  const handleTestIpcMutation = async () => {
    try {
      if (!window.forestAPI) return;
      const testTag = await window.forestAPI.createTag(`Test ${Date.now().toString().slice(-4)}`, '#10B981');
      await forestStore.refreshMetrics();
      setIpcTestNotice(`IPC OK: Created "${testTag.name}"`);
      setTimeout(() => setIpcTestNotice(null), 3000);
      fetchDiagnostics();
    } catch (err) {
      setIpcTestNotice(`IPC Failed: ${String(err)}`);
    }
  };

  const classicCount = trees.filter((t) => t.category === 'classic').length;
  const plusCount = trees.filter((t) => t.category === 'plus').length;
  const seasonalCount = trees.filter((t) => t.category === 'seasonal').length;

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
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings color="#81C784" size={20} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Preferences
          </h2>
        </div>
        {saveStatus && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#81C784',
              background: 'rgba(46, 125, 50, 0.3)',
              padding: '3px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(129, 199, 132, 0.3)',
            }}
          >
            <CheckCircle2 size={12} />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Focus Session Rules */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#81C784', fontWeight: 800 }}>
          Focus Rules
        </span>

        {/* Allow Pause */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PauseCircle size={18} color="#81C784" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Allow Pause During Focus</span>
              <span style={{ fontSize: '11px', color: '#A5D6A7' }}>
                {settings.allowPause ? 'You can pause and resume sessions' : 'Strict Mode: Pausing will wither tree'}
              </span>
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
            <input
              type="checkbox"
              checked={settings.allowPause}
              onChange={handleToggleAllowPause}
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
                backgroundColor: settings.allowPause ? '#81C784' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                transition: '0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px',
                  width: '16px',
                  left: settings.allowPause ? '19px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                }}
              />
            </span>
          </label>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Auto Focus After Break */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlayCircle size={18} color="#81C784" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Auto-Start Next Session</span>
              <span style={{ fontSize: '11px', color: '#A5D6A7' }}>
                Automatically starts next focus when break countdown expires
              </span>
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
            <input
              type="checkbox"
              checked={settings.autoFocusAfterBreak}
              onChange={handleToggleAutoFocus}
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
                backgroundColor: settings.autoFocusAfterBreak ? '#81C784' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                transition: '0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px',
                  width: '16px',
                  left: settings.autoFocusAfterBreak ? '19px' : '3px',
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

      {/* Default Durations */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#81C784', fontWeight: 800 }}>
          Timer Benchmarks
        </span>

        {/* Default Focus Duration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="#C8E6C9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Default Plant Time</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#81C784' }}>
              {settings.defaultFocusMinutes} minutes
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[15, 25, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => handleFocusDurationChange(mins)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: settings.defaultFocusMinutes === mins ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
                  background: settings.defaultFocusMinutes === mins ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                  color: settings.defaultFocusMinutes === mins ? '#FFFFFF' : '#A5D6A7',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Break Duration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coffee size={15} color="#C8E6C9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Break Duration</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#81C784' }}>
              {settings.breakDurationMinutes} minutes
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[5, 10, 15, 20].map((mins) => (
              <button
                key={mins}
                onClick={() => handleBreakDurationChange(mins)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: settings.breakDurationMinutes === mins ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
                  background: settings.breakDurationMinutes === mins ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                  color: settings.breakDurationMinutes === mins ? '#FFFFFF' : '#A5D6A7',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔔 Break Chimes & Alarms */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="#FFD54F" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
            Break Chimes & Alarm Sounds
          </span>
        </div>

        {/* Break Start Chime */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
              Break Start Chime
            </span>
            <span style={{ fontSize: '10px', color: '#A5D6A7' }}>
              Gentle Zen bell when focus finishes and break begins
            </span>
          </div>
          <button
            onClick={() => soundEffects.playBreakStartAlarm(settings.ambientVolume)}
            style={{
              background: 'rgba(76, 175, 80, 0.25)',
              border: '1px solid rgba(129, 199, 132, 0.4)',
              color: '#A5D6A7',
              borderRadius: '12px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Volume2 size={12} />
            <span>Test Sound</span>
          </button>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Break End Chime */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
              Break End Alarm
            </span>
            <span style={{ fontSize: '10px', color: '#A5D6A7' }}>
              Bright energizing chime when break timer expires
            </span>
          </div>
          <button
            onClick={() => soundEffects.playBreakEndAlarm(settings.ambientVolume)}
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              color: '#FFD700',
              borderRadius: '12px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Volume2 size={12} />
            <span>Test Sound</span>
          </button>
        </div>
      </div>

      {/* ⚡ High-Memory-Optimization Telemetry Diagnostics */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(129, 199, 132, 0.25)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={15} color="#81C784" />
            <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 800 }}>
              Architecture & Memory Diagnostics
            </span>
          </div>

          <button
            onClick={fetchDiagnostics}
            disabled={isLoadingDiag}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#81C784',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={11} style={{ animation: isLoadingDiag ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>

        {diagnostics ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 600 }}>Main V8 Heap Used</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {diagnostics.mainHeapUsedMB} MB
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 600 }}>Main Process RSS</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#81C784', marginTop: '2px' }}>
                {diagnostics.mainRssMB} MB
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 600 }}>SQLite Page Cache</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                ~{Math.round(diagnostics.sqliteCacheSizeKB / 1024)} MB (WAL)
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 600 }}>Total Planted Trees</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {diagnostics.totalSessionsCount} sessions
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#A5D6A7' }}>Fetching telemetry metrics...</div>
        )}

        {/* Collapsible Phase 1 Foundation Architecture & Domain Repositories */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
          <button
            onClick={() => setShowFoundationDetails(!showFoundationDetails)}
            style={{
              background: 'transparent',
              border: 'none',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#C8E6C9',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} color="#81C784" />
              <span>Phase 1 Foundation Repositories & IPC</span>
            </div>
            {showFoundationDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showFoundationDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {/* SQLite & IPC Engine Online Banner */}
              <div
                style={{
                  background: 'rgba(46, 125, 50, 0.25)',
                  border: '1px solid rgba(129, 199, 132, 0.4)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#81C784" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                    SQLite & IPC Engine Online
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    background: '#81C784',
                    color: '#182E21',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}
                >
                  WAL 2MB CAPPED
                </span>
              </div>

              {/* Database File & V8 Flag */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <Database size={11} />
                    <span>Database File</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    forest-desktop.sqlite
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <Cpu size={11} />
                    <span>V8 Memory Cap</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    128MB Heap
                  </div>
                </div>
              </div>

              {/* Domain Repositories Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {/* Trees */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <Trees size={11} />
                    <span>Tree Species ({trees.length})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', background: 'rgba(76, 175, 80, 0.3)', padding: '1px 4px', borderRadius: '4px', color: '#81C784' }}>
                      {classicCount} Classic
                    </span>
                    <span style={{ fontSize: '9px', background: 'rgba(171, 71, 188, 0.3)', padding: '1px 4px', borderRadius: '4px', color: '#CE93D8' }}>
                      {plusCount} Plus
                    </span>
                    <span style={{ fontSize: '9px', background: 'rgba(255, 167, 38, 0.3)', padding: '1px 4px', borderRadius: '4px', color: '#FFB74D' }}>
                      {seasonalCount} Seasonal
                    </span>
                  </div>
                </div>

                {/* Lands */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <MapPin size={11} />
                    <span>Land Styles</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {lands.length} <span style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 500 }}>(1 starter)</span>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <Tag size={11} />
                    <span>Focus Tags</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {tags.length} <span style={{ fontSize: '10px', color: '#A5D6A7', fontWeight: 500 }}>active</span>
                  </div>
                </div>

                {/* Challenges & Ambient */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A5D6A7' }}>
                    <Trophy size={11} />
                    <span>Challenges / Audio</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                    {challenges.length} ch • {ambientTracks.length} tracks
                  </div>
                </div>
              </div>

              {/* IPC Mutation Test Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>Live Preload IPC Verification</span>
                  <span style={{ fontSize: '9px', color: ipcTestNotice ? '#81C784' : '#A5D6A7' }}>
                    {ipcTestNotice || 'Tests SQLite mutation & reactive store refresh'}
                  </span>
                </div>

                <button
                  onClick={handleTestIpcMutation}
                  style={{
                    background: '#2E7D32',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} />
                  <span>Test IPC</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Developer / Testing Utilities */}
      <div
        style={{
          background: 'rgba(255, 215, 0, 0.08)',
          border: '1px solid rgba(255, 215, 0, 0.25)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Coins size={20} color="#FFD700" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>Testing Grant</span>
            <span style={{ fontSize: '10px', color: '#FFE082' }}>
              Add test coins to unlock Classic, Plus, & Seasonal store items
            </span>
          </div>
        </div>

        <button
          onClick={handleGrantTestCoins}
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '7px 12px',
            color: '#182E21',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 3px 10px rgba(255, 215, 0, 0.3)',
          }}
        >
          <Sparkles size={12} fill="#182E21" />
          <span>+500 Coins</span>
        </button>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
