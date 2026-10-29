import { ForestDatabase } from '../database/db';
import { TimerSnapshot, TimerMode, TimerState, FocusSession } from '../../shared/types';

export class TimerEngine {
  private db: ForestDatabase;
  private tickListeners: Array<(snapshot: TimerSnapshot) => void> = [];

  private mode: TimerMode = 'countdown';
  private status: TimerState = 'idle';
  private targetDurationSeconds = 1500; // 25 mins default
  private elapsedSeconds = 0;
  private remainingSeconds = 1500;
  private progress = 0;
  private wasPaused = false;
  private treeSpeciesId = 'cedar';
  private tagId = 'tag-work';
  private gracePeriodRemaining = 10;
  private breakRemainingSeconds = 0;
  private lastEarnedCoins = 0;
  private completedSessionId?: string;

  // Monotonic time delta tracking
  private sessionStartTime = 0;
  private lastResumeTime = 0;
  private totalAccumulatedActiveMs = 0;
  private breakStartTime = 0;
  private breakTotalSeconds = 0;

  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(db: ForestDatabase) {
    this.db = db;
  }

  public addTickListener(callback: (snapshot: TimerSnapshot) => void): () => void {
    this.tickListeners.push(callback);
    return () => {
      this.tickListeners = this.tickListeners.filter((fn) => fn !== callback);
    };
  }

  public setTickCallback(callback: (snapshot: TimerSnapshot) => void): void {
    this.addTickListener(callback);
  }

  public getSnapshot(): TimerSnapshot {
    return {
      mode: this.mode,
      status: this.status,
      targetDurationSeconds: this.targetDurationSeconds,
      elapsedSeconds: this.elapsedSeconds,
      remainingSeconds: this.remainingSeconds,
      progress: this.progress,
      wasPaused: this.wasPaused,
      treeSpeciesId: this.treeSpeciesId,
      tagId: this.tagId,
      gracePeriodRemaining: this.gracePeriodRemaining,
      breakRemainingSeconds: this.breakRemainingSeconds,
      lastEarnedCoins: this.lastEarnedCoins,
      completedSessionId: this.completedSessionId,
    };
  }

  private broadcast(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.tickListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Tick listener error:', err);
      }
    }
  }

  private clearTimerInterval(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public start(options: {
    mode: TimerMode;
    durationMinutes: number;
    treeSpeciesId: string;
    tagId: string;
  }): TimerSnapshot {
    this.clearTimerInterval();

    const durationSeconds = Math.max(60, options.durationMinutes * 60);
    this.mode = options.mode;
    this.status = 'focusing';
    this.targetDurationSeconds = durationSeconds;
    this.elapsedSeconds = 0;
    this.remainingSeconds = this.mode === 'countdown' ? durationSeconds : 0;
    this.progress = 0;
    this.wasPaused = false;
    this.treeSpeciesId = options.treeSpeciesId;
    this.tagId = options.tagId;
    this.gracePeriodRemaining = 10;
    this.breakRemainingSeconds = 0;
    this.lastEarnedCoins = 0;
    this.completedSessionId = undefined;

    this.sessionStartTime = Date.now();
    this.lastResumeTime = this.sessionStartTime;
    this.totalAccumulatedActiveMs = 0;

    this.intervalTimer = setInterval(() => this.tick(), 1000);
    this.broadcast();
    return this.getSnapshot();
  }

  public pause(): boolean {
    if (this.status !== 'focusing') return false;

    const settings = this.db.getSettings();
    if (!settings.allowPause) {
      return false; // Pausing forbidden by user setting
    }

    // Accumulate active time before pausing
    const now = Date.now();
    this.totalAccumulatedActiveMs += now - this.lastResumeTime;
    this.status = 'paused';
    this.wasPaused = true;
    this.clearTimerInterval();
    this.broadcast();
    return true;
  }

  public resume(): boolean {
    if (this.status !== 'paused') return false;

    this.status = 'focusing';
    this.lastResumeTime = Date.now();
    this.clearTimerInterval();
    this.intervalTimer = setInterval(() => this.tick(), 1000);
    this.broadcast();
    return true;
  }

  public stop(): TimerSnapshot {
    // 1. Grace period check: under 10 seconds cancels cleanly
    if (this.elapsedSeconds < 10 && (this.status === 'focusing' || this.status === 'paused')) {
      this.reset();
      return this.getSnapshot();
    }

    // 2. Stopwatch finish check (completed if >= 10 mins)
    if (this.mode === 'stopwatch' && this.elapsedSeconds >= 600 && (this.status === 'focusing' || this.status === 'paused')) {
      return this.completeSession();
    }

    // 3. Otherwise: withers the tree
    if (this.status === 'focusing' || this.status === 'paused') {
      return this.witherSession();
    }

    if (this.status === 'break') {
      this.reset();
      return this.getSnapshot();
    }

    return this.getSnapshot();
  }

  public startBreak(durationMinutes?: number): TimerSnapshot {
    this.clearTimerInterval();
    const settings = this.db.getSettings();
    const mins = durationMinutes ?? settings.breakDurationMinutes ?? 5;
    this.status = 'break';
    this.breakTotalSeconds = Math.max(10, mins * 60);
    this.breakRemainingSeconds = this.breakTotalSeconds;
    this.breakStartTime = Date.now();
    this.intervalTimer = setInterval(() => this.tick(), 1000);
    this.broadcast();
    return this.getSnapshot();
  }

  public skipBreak(): TimerSnapshot {
    if (this.status !== 'break') return this.getSnapshot();
    this.clearTimerInterval();

    const settings = this.db.getSettings();
    if (settings.autoFocusAfterBreak) {
      // Start next focus session automatically
      return this.start({
        mode: this.mode,
        durationMinutes: Math.floor(this.targetDurationSeconds / 60),
        treeSpeciesId: this.treeSpeciesId,
        tagId: this.tagId,
      });
    }

    this.reset();
    return this.getSnapshot();
  }

  public reset(): TimerSnapshot {
    this.clearTimerInterval();
    this.status = 'idle';
    this.elapsedSeconds = 0;
    this.remainingSeconds = this.targetDurationSeconds;
    this.progress = 0;
    this.wasPaused = false;
    this.gracePeriodRemaining = 10;
    this.breakRemainingSeconds = 0;
    this.lastEarnedCoins = 0;
    this.completedSessionId = undefined;
    this.broadcast();
    return this.getSnapshot();
  }

  private tick(): void {
    if (this.status === 'focusing') {
      const now = Date.now();
      const currentActiveMs = this.totalAccumulatedActiveMs + (now - this.lastResumeTime);
      this.elapsedSeconds = Math.floor(currentActiveMs / 1000);

      // Grace period countdown (first 10 seconds)
      this.gracePeriodRemaining = Math.max(0, 10 - this.elapsedSeconds);

      if (this.mode === 'countdown') {
        this.remainingSeconds = Math.max(0, this.targetDurationSeconds - this.elapsedSeconds);
        this.progress = Math.min(1, this.elapsedSeconds / this.targetDurationSeconds);

        if (this.remainingSeconds <= 0) {
          this.completeSession();
          return;
        }
      } else {
        // Stopwatch mode
        this.remainingSeconds = this.elapsedSeconds;
        // Progress cycles or benchmarks towards 2 hours max
        this.progress = Math.min(1, this.elapsedSeconds / 7200);
      }

      this.broadcast();
    } else if (this.status === 'break') {
      const now = Date.now();
      const elapsedBreakSecs = Math.floor((now - this.breakStartTime) / 1000);
      this.breakRemainingSeconds = Math.max(0, this.breakTotalSeconds - elapsedBreakSecs);

      if (this.breakRemainingSeconds <= 0) {
        this.clearTimerInterval();
        const settings = this.db.getSettings();
        if (settings.autoFocusAfterBreak) {
          this.start({
            mode: this.mode,
            durationMinutes: Math.floor(this.targetDurationSeconds / 60),
            treeSpeciesId: this.treeSpeciesId,
            tagId: this.tagId,
          });
        } else {
          this.reset();
        }
        return;
      }

      this.broadcast();
    }
  }

  private calculateCoinsEarned(focusedMinutes: number, wasPaused: boolean): number {
    if (focusedMinutes < 10) return 0;

    // Base coins: ~0.5 coin per focused minute
    let coins = Math.max(1, Math.floor(focusedMinutes * 0.5));

    // Bonus for every 25 minutes completed
    const pomodoroCycles = Math.floor(focusedMinutes / 25);
    coins += pomodoroCycles * 5;

    // 20% bonus if zero pauses
    if (!wasPaused) {
      coins = Math.round(coins * 1.2);
    }

    return coins;
  }

  private completeSession(): TimerSnapshot {
    this.clearTimerInterval();
    const focusedMinutes = Math.max(1, Math.floor(this.elapsedSeconds / 60));
    const coins = this.calculateCoinsEarned(focusedMinutes, this.wasPaused);
    this.lastEarnedCoins = coins;

    // Persist completed session to SQLite
    const recorded = this.db.recordFocusSession({
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      durationSeconds: this.elapsedSeconds,
      mode: this.mode,
      treeSpeciesId: this.treeSpeciesId,
      tagId: this.tagId,
      status: 'completed',
      coinsEarned: coins,
      note: `Focused for ${focusedMinutes} minutes with ${this.wasPaused ? 'pauses' : 'zero pauses'}.`,
    }, this.wasPaused);

    this.completedSessionId = recorded.id;
    this.progress = 1.0;

    const settings = this.db.getSettings();
    if (settings.breakDurationMinutes > 0) {
      this.status = 'break';
      this.breakTotalSeconds = settings.breakDurationMinutes * 60;
      this.breakRemainingSeconds = this.breakTotalSeconds;
      this.breakStartTime = Date.now();
      this.intervalTimer = setInterval(() => this.tick(), 1000);
    } else {
      this.status = 'completed';
    }

    this.broadcast();
    return this.getSnapshot();
  }

  private witherSession(): TimerSnapshot {
    this.clearTimerInterval();
    this.status = 'withered';
    this.lastEarnedCoins = 0;

    // Persist withered session in SQLite
    const recorded = this.db.recordFocusSession({
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      durationSeconds: this.elapsedSeconds,
      mode: this.mode,
      treeSpeciesId: this.treeSpeciesId,
      tagId: this.tagId,
      status: 'withered',
      coinsEarned: 0,
      note: 'Session interrupted early. Tree withered.',
    });

    this.completedSessionId = recorded.id;
    this.broadcast();
    return this.getSnapshot();
  }
}
