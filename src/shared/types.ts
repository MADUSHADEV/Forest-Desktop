export type TimerMode = 'countdown' | 'stopwatch';

export type TimerState = 'idle' | 'focusing' | 'paused' | 'break' | 'completed' | 'withered';

export type TreeCategory = 'classic' | 'plus' | 'seasonal';

export interface TreeSpecies {
  id: string;
  name: string;
  category: TreeCategory;
  price: number;
  unlocked: boolean;
  minDurationMinutes: number;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  svgVariant: string;
}

export interface LandStyle {
  id: string;
  name: string;
  category: TreeCategory;
  price: number;
  unlocked: boolean;
  groundColor: string;
  borderColor: string;
  bgGradient: [string, string];
}

export interface FocusTag {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  mode: TimerMode;
  treeSpeciesId: string;
  tagId: string;
  status: 'completed' | 'withered';
  coinsEarned: number;
  note?: string;
}

export interface FocusChallenge {
  id: string;
  title: string;
  description: string;
  targetType: 'total_minutes' | 'sessions_count' | 'no_pause_streak' | 'seasonal_trees';
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface SystemDiagnostics {
  mainHeapUsedMB: number;
  mainHeapTotalMB: number;
  mainRssMB: number;
  sqliteCacheSizeKB: number;
  totalSessionsCount: number;
  unlockedCount: number;
  uptimeSeconds: number;
}

export interface AmbientTrack {
  id: string;
  title: string;
  category: 'nature' | 'youtube';
  url: string;
  isCustom: boolean;
}

export interface UserSettings {
  allowPause: boolean;
  autoFocusAfterBreak: boolean;
  breakDurationMinutes: number;
  defaultFocusMinutes: number;
  selectedTreeId: string;
  selectedLandId: string;
  selectedTagId: string;
  coins: number;
  activeAmbientId: string | null;
  ambientVolume: number;
  syncAmbientWithTimer: boolean;
}

export interface TimerSnapshot {
  mode: TimerMode;
  status: TimerState;
  targetDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  progress: number; // 0 to 1
  wasPaused: boolean;
  treeSpeciesId: string;
  tagId: string;
  gracePeriodRemaining: number;
  breakRemainingSeconds: number;
  lastEarnedCoins?: number;
  completedSessionId?: string;
}

export interface BootstrapData {
  settings: UserSettings;
  trees: TreeSpecies[];
  lands: LandStyle[];
  tags: FocusTag[];
  recentSessions: FocusSession[];
  challenges: FocusChallenge[];
  ambientTracks: AmbientTrack[];
  timer: TimerSnapshot;
}

export interface UnlockResult {
  success: boolean;
  coins: number;
  error?: string;
}

export interface ForestAPI {
  getBootstrapData: () => Promise<BootstrapData>;
  getSettings: () => Promise<UserSettings>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  unlockItem: (type: 'tree' | 'land', itemId: string) => Promise<UnlockResult>;
  getTags: () => Promise<FocusTag[]>;
  createTag: (name: string, color: string) => Promise<FocusTag>;
  updateTag: (id: string, name: string, color: string) => Promise<FocusTag>;
  deleteTag: (id: string) => Promise<boolean>;
  recordFocusSession: (session: Omit<FocusSession, 'id'>) => Promise<FocusSession>;
  updateSessionNote: (sessionId: string, note: string) => Promise<boolean>;
  getRecentSessions: (limit?: number) => Promise<FocusSession[]>;
  getChallenges: () => Promise<FocusChallenge[]>;
  claimChallengeReward: (id: string) => Promise<{ success: boolean; coins: number }>;
  resetCompletedChallenges: () => Promise<FocusChallenge[]>;
  getAmbientTracks: () => Promise<AmbientTrack[]>;
  addCustomAmbientTrack: (title: string, url: string, category?: 'nature' | 'youtube') => Promise<AmbientTrack>;
  deleteAmbientTrack: (id: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  getDiagnostics: () => Promise<SystemDiagnostics>;
  grantTestCoins: (amount: number) => Promise<number>;

  // Phase 3 Timer Engine API
  startTimer: (options: {
    mode: TimerMode;
    durationMinutes: number;
    treeSpeciesId: string;
    tagId: string;
  }) => Promise<TimerSnapshot>;
  pauseTimer: () => Promise<boolean>;
  resumeTimer: () => Promise<boolean>;
  stopTimer: () => Promise<TimerSnapshot>;
  startBreak: (durationMinutes?: number) => Promise<TimerSnapshot>;
  skipBreak: () => Promise<TimerSnapshot>;
  resetTimer: () => Promise<TimerSnapshot>;
  getTimerState: () => Promise<TimerSnapshot>;
  onTimerTick: (callback: (snapshot: TimerSnapshot) => void) => () => void;
}

declare global {
  interface Window {
    forestAPI: ForestAPI;
  }
}
