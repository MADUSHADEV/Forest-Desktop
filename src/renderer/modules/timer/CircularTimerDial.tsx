import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { TimerState, TimerMode } from '../../../shared/types';

interface CircularTimerDialProps {
  mode: TimerMode;
  status: TimerState;
  durationMinutes: number;
  progress: number; // 0 to 1
  onDurationChange: (minutes: number) => void;
  children?: React.ReactNode;
}

export const CircularTimerDial: React.FC<CircularTimerDialProps> = ({
  mode,
  status,
  durationMinutes,
  progress,
  onDurationChange,
  children,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const radius = 112;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const isIdle = status === 'idle';
  const isCountdown = mode === 'countdown';

  // Calculate progress for the ring
  // In idle countdown: ring represents the selected minutes fraction of 120 minutes max
  // In active countdown: ring represents session progress (0 to 1)
  const effectiveProgress = isIdle
    ? Math.max(0, Math.min(1, (durationMinutes - 10) / (120 - 10)))
    : Math.max(0, Math.min(1, progress));

  const strokeDashoffset = circumference - effectiveProgress * circumference;

  // Knob angle in degrees (top is -90deg, 0% at top, 100% full circle)
  const angleDegrees = effectiveProgress * 360 - 90;
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const knobX = 140 + radius * Math.cos(angleRadians);
  const knobY = 140 + radius * Math.sin(angleRadians);

  // Convert pointer position to 5-minute increments (10m to 120m)
  const updateDurationFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || !isIdle || !isCountdown) return;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // Calculate angle from 12 o'clock (top) clockwise: 0 to 2*PI
      let theta = Math.atan2(dy, dx) + Math.PI / 2;
      if (theta < 0) theta += 2 * Math.PI;

      const fraction = theta / (2 * Math.PI);
      const rawMins = 10 + fraction * (120 - 10);
      const roundedMins = Math.round(rawMins / 5) * 5;
      const clamped = Math.max(10, Math.min(120, roundedMins));

      onDurationChange(clamped);
    },
    [isIdle, isCountdown, onDurationChange],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isIdle || !isCountdown) return;
    isDraggingRef.current = true;
    setIsInteracting(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateDurationFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateDurationFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsInteracting(false);
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore if already released
      }
    }
  };

  const handleStepMinutes = (delta: number) => {
    if (!isIdle || !isCountdown) return;
    const nextVal = Math.max(10, Math.min(120, durationMinutes + delta));
    onDurationChange(nextVal);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsInteracting(false);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '280px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '8px 0',
      }}
    >
      {/* SVG Dial & Knob */}
      <svg
        ref={svgRef}
        width="280"
        height="280"
        viewBox="0 0 280 280"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: isIdle && isCountdown ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
          <filter id="knobGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#81C784" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer Background Track */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Active Progress Arc */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 140 140)"
          style={{
            transition: isInteracting ? 'none' : 'stroke-dashoffset 0.35s ease',
          }}
        />

        {/* Interactive Knob (Visible when Idle or Active) */}
        {isCountdown && (
          <circle
            cx={knobX}
            cy={knobY}
            r={isIdle ? 10 : 6}
            fill="#FFFFFF"
            stroke="#2E7D32"
            strokeWidth="3"
            filter="url(#knobGlow)"
            style={{
              cursor: isIdle ? 'grab' : 'default',
              transition: isInteracting ? 'none' : 'cx 0.35s ease, cy 0.35s ease',
            }}
          />
        )}
      </svg>

      {/* Central Content: Pedestal & SVG Tree */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: isIdle ? 'auto' : 'none',
        }}
      >
        {children}
      </div>

      {/* Quick +/- Step Buttons in Idle Mode */}
      {isIdle && isCountdown && (
        <>
          <button
            onClick={() => handleStepMinutes(-5)}
            aria-label="Decrease time by 5 minutes"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '24px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            <Minus size={15} />
          </button>

          <button
            onClick={() => handleStepMinutes(5)}
            aria-label="Increase time by 5 minutes"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '24px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            <Plus size={15} />
          </button>
        </>
      )}
    </div>
  );
};
