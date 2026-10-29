import { useSyncExternalStore } from 'react';
import {
  UserSettings,
  TreeSpecies,
  LandStyle,
  FocusTag,
  FocusSession,
  FocusChallenge,
  AmbientTrack,
  BootstrapData,
  TimerSnapshot,
  TimerMode,
  SystemDiagnostics,
} from '../../shared/types';
import { INITIAL_TREES_CATALOG, INITIAL_LANDS_CATALOG } from '../../shared/catalog';
import { ambientAudioEngine } from '../services/AmbientAudioEngine';
import { soundEffects } from '../services/SoundEffects';

export type ActiveView =
  | 'timer'
  | 'forest'
  | 'timeline'
  | 'tags'
  | 'challenges'
  | 'ambient'
  | 'store'
  | 'settings';

export interface ForestStoreState {
  settings: UserSettings;
  trees: TreeSpecies[];
  lands: LandStyle[];
  tags: FocusTag[];
  sessions: FocusSession[];
  challenges: FocusChallenge[];
  ambientTracks: AmbientTrack[];
  timer: TimerSnapshot;
  activeView: ActiveView;
  viewHistory: ActiveView[];
  isDrawerOpen: boolean;
  isSessionActive: boolean;
  isLoading: boolean;
  error: string | null;
  isAmbientPlaying: boolean;
}

const initialSettings: UserSettings = {
  allowPause: true,
  autoFocusAfterBreak: false,
  breakDurationMinutes: 5,
  defaultFocusMinutes: 25,
  selectedTreeId: 'cedar',
  selectedLandId: 'classic-meadow',
  selectedTagId: 'tag-work',
  coins: 500,
  activeAmbientId: null,
  ambientVolume: 0.5,
  syncAmbientWithTimer: false,
};

const initialTimer: TimerSnapshot = {
  mode: 'countdown',
  status: 'idle',
  targetDurationSeconds: 1500,
  elapsedSeconds: 0,
  remainingSeconds: 1500,
  progress: 0,
  wasPaused: false,
  treeSpeciesId: 'cedar',
  tagId: 'tag-work',
  gracePeriodRemaining: 10,
  breakRemainingSeconds: 0,
};

let currentState: ForestStoreState = {
  settings: initialSettings,
  trees: INITIAL_TREES_CATALOG,
  lands: INITIAL_LANDS_CATALOG,
  tags: [],
  sessions: [],
  challenges: [],
  ambientTracks: [],
  timer: initialTimer,
  activeView: 'timer',
  viewHistory: [],
  isDrawerOpen: false,
  isSessionActive: false,
  isLoading: true,
  error: null,
  isAmbientPlaying: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function updateState(partial: Partial<ForestStoreState>): void {
  currentState = { ...currentState, ...partial };
  emitChange();
}

let tickUnsubscribe: (() => void) | null = null;

export const forestStore = {
  getState(): ForestStoreState {
    return currentState;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async init(): Promise<void> {
    try {
      updateState({ isLoading: true, error: null });
      if (!window.forestAPI) {
        throw new Error('forestAPI is not available on window. Ensure preload script is loaded.');
      }
      const data: BootstrapData = await window.forestAPI.getBootstrapData();
      const isSessionActive =
        data.timer.status === 'focusing' ||
        data.timer.status === 'paused' ||
        data.timer.status === 'break';

      updateState({
        settings: data.settings,
        trees: data.trees,
        lands: data.lands,
        tags: data.tags,
        sessions: data.recentSessions,
        challenges: data.challenges,
        ambientTracks: data.ambientTracks,
        timer: data.timer,
        isSessionActive,
        isLoading: false,
      });

      // Subscribe to live Main-process timer ticks (with clean teardown)
      if (tickUnsubscribe) {
        tickUnsubscribe();
      }
      tickUnsubscribe = window.forestAPI.onTimerTick((snapshot) => {
        forestStore.handleTimerTick(snapshot);
      });
    } catch (err) {
      console.error('Failed to initialize Forest store:', err);
      updateState({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  handleTimerTick(snapshot: TimerSnapshot): void {
    const isSessionActive =
      snapshot.status === 'focusing' ||
      snapshot.status === 'paused' ||
      snapshot.status === 'break';

    const prevStatus = currentState.timer.status;
    updateState({
      timer: snapshot,
      isSessionActive,
    });

    // If session just concluded (completed or withered), refresh metrics from SQLite
    if (
      (snapshot.status === 'completed' && prevStatus !== 'completed') ||
      (snapshot.status === 'withered' && prevStatus !== 'withered')
    ) {
      this.refreshMetrics();
    }

    // Trigger procedural Web Audio Break Start Alarm (Peaceful Zen bell chime)
    if (snapshot.status === 'break' && prevStatus !== 'break') {
      soundEffects.playBreakStartAlarm(currentState.settings.ambientVolume);
    }

    // Trigger procedural Web Audio Break End Alarm (Bright alert wake-up chime)
    if (prevStatus === 'break' && snapshot.status !== 'break') {
      soundEffects.playBreakEndAlarm(currentState.settings.ambientVolume);
    }

    // Auto-sync ambient soundscape with focus timer
    if (currentState.settings.syncAmbientWithTimer && currentState.settings.activeAmbientId) {
      if (snapshot.status === 'focusing' && prevStatus !== 'focusing' && !currentState.isAmbientPlaying) {
        this.playAmbient(currentState.settings.activeAmbientId);
      } else if (
        (snapshot.status === 'paused' || snapshot.status === 'completed' || snapshot.status === 'withered' || snapshot.status === 'idle') &&
        currentState.isAmbientPlaying
      ) {
        this.stopAmbient();
      }
    }
  },

  async refreshMetrics(): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const settings = await window.forestAPI.getSettings();
      const recentSessions = await window.forestAPI.getRecentSessions(25);
      const challenges = await window.forestAPI.getChallenges();
      updateState({
        settings,
        sessions: recentSessions,
        challenges,
      });
    } catch (err) {
      console.error('Failed to refresh metrics:', err);
    }
  },

  setActiveView(view: ActiveView): void {
    if (view === currentState.activeView) {
      updateState({ isDrawerOpen: false });
      return;
    }
    const history = [...currentState.viewHistory, currentState.activeView];
    if (history.length > 20) {
      history.shift();
    }
    updateState({ activeView: view, viewHistory: history, isDrawerOpen: false });
  },

  goBack(): void {
    const history = [...currentState.viewHistory];
    const prev = history.pop() || 'timer';
    updateState({ activeView: prev, viewHistory: history, isDrawerOpen: false });
  },

  setDrawerOpen(open: boolean): void {
    if (currentState.isSessionActive && open) {
      return; // Locked during active focus sessions
    }
    updateState({ isDrawerOpen: open });
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    try {
      const prev = currentState.settings;
      // Optimistic update
      updateState({ settings: { ...prev, ...updates } });

      if (window.forestAPI) {
        const persisted = await window.forestAPI.updateSettings(updates);
        updateState({ settings: persisted });
      }
    } catch (err) {
      console.error('Failed to persist settings:', err);
    }
  },

  async unlockItem(type: 'tree' | 'land', itemId: string): Promise<boolean> {
    try {
      if (!window.forestAPI) return false;
      const res = await window.forestAPI.unlockItem(type, itemId);
      if (res.success) {
        const refreshed = await window.forestAPI.getBootstrapData();
        updateState({
          settings: refreshed.settings,
          trees: refreshed.trees,
          lands: refreshed.lands,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unlock item:', err);
      return false;
    }
  },

  async createTag(name: string, color: string): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const newTag = await window.forestAPI.createTag(name, color);
      updateState({ tags: [...currentState.tags, newTag] });
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  },

  async updateTag(id: string, name: string, color: string): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const updated = await window.forestAPI.updateTag(id, name, color);
      updateState({
        tags: currentState.tags.map((t) => (t.id === id ? updated : t)),
      });
    } catch (err) {
      console.error('Failed to update tag:', err);
    }
  },

  async deleteTag(id: string): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const success = await window.forestAPI.deleteTag(id);
      if (success) {
        const refreshed = await window.forestAPI.getBootstrapData();
        updateState({
          tags: refreshed.tags,
          settings: refreshed.settings,
          sessions: refreshed.recentSessions,
        });
      }
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
  },

  async updateSessionNote(sessionId: string, note: string): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const success = await window.forestAPI.updateSessionNote(sessionId, note);
      if (success) {
        updateState({
          sessions: currentState.sessions.map((s) =>
            s.id === sessionId ? { ...s, note } : s,
          ),
        });
      }
    } catch (err) {
      console.error('Failed to update session note:', err);
    }
  },

  // --- Challenges Actions ---
  async claimChallengeReward(challengeId: string): Promise<boolean> {
    try {
      if (!window.forestAPI) return false;
      const res = await window.forestAPI.claimChallengeReward(challengeId);
      if (res.success) {
        const challenges = await window.forestAPI.getChallenges();
        updateState({
          settings: { ...currentState.settings, coins: res.coins },
          challenges,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to claim challenge reward:', err);
      return false;
    }
  },

  async resetCompletedChallenges(): Promise<void> {
    try {
      if (!window.forestAPI) return;
      const challenges = await window.forestAPI.resetCompletedChallenges();
      updateState({ challenges });
    } catch (err) {
      console.error('Failed to reset completed challenges:', err);
    }
  },

  async grantTestCoins(amount = 500): Promise<number> {
    try {
      if (!window.forestAPI) return currentState.settings.coins;
      const coins = await window.forestAPI.grantTestCoins(amount);
      updateState({
        settings: { ...currentState.settings, coins },
      });
      return coins;
    } catch (err) {
      console.error('Failed to grant test coins:', err);
      return currentState.settings.coins;
    }
  },

  // --- Phase 3 Timer Actions ---
  async startTimer(options?: {
    mode?: TimerMode;
    durationMinutes?: number;
    treeSpeciesId?: string;
    tagId?: string;
  }): Promise<TimerSnapshot | null> {
    try {
      if (!window.forestAPI) return null;
      const mode = options?.mode || currentState.timer.mode;
      const durationMinutes =
        options?.durationMinutes || currentState.settings.defaultFocusMinutes;
      const treeSpeciesId =
        options?.treeSpeciesId || currentState.settings.selectedTreeId;
      const tagId = options?.tagId || currentState.settings.selectedTagId;

      const snapshot = await window.forestAPI.startTimer({
        mode,
        durationMinutes,
        treeSpeciesId,
        tagId,
      });

      updateState({
        timer: snapshot,
        isSessionActive: true,
        isDrawerOpen: false,
      });
      return snapshot;
    } catch (err) {
      console.error('Failed to start timer:', err);
      return null;
    }
  },

  async pauseTimer(): Promise<boolean> {
    try {
      if (!window.forestAPI) return false;
      const success = await window.forestAPI.pauseTimer();
      if (success) {
        updateState({
          timer: { ...currentState.timer, status: 'paused', wasPaused: true },
        });
      }
      return success;
    } catch (err) {
      console.error('Failed to pause timer:', err);
      return false;
    }
  },

  async resumeTimer(): Promise<boolean> {
    try {
      if (!window.forestAPI) return false;
      const success = await window.forestAPI.resumeTimer();
      if (success) {
        updateState({
          timer: { ...currentState.timer, status: 'focusing' },
        });
      }
      return success;
    } catch (err) {
      console.error('Failed to resume timer:', err);
      return false;
    }
  },

  async stopTimer(): Promise<TimerSnapshot | null> {
    try {
      if (!window.forestAPI) return null;
      const snapshot = await window.forestAPI.stopTimer();
      const isSessionActive =
        snapshot.status === 'focusing' ||
        snapshot.status === 'paused' ||
        snapshot.status === 'break';
      updateState({
        timer: snapshot,
        isSessionActive,
      });
      if (snapshot.status === 'completed' || snapshot.status === 'withered') {
        this.refreshMetrics();
      }
      return snapshot;
    } catch (err) {
      console.error('Failed to stop timer:', err);
      return null;
    }
  },

  async startBreak(durationMinutes?: number): Promise<TimerSnapshot | null> {
    try {
      if (!window.forestAPI?.startBreak) return null;
      const snapshot = await window.forestAPI.startBreak(durationMinutes);
      updateState({ timer: snapshot, isSessionActive: true });
      return snapshot;
    } catch (err) {
      console.error('Failed to start break:', err);
      return null;
    }
  },

  async skipBreak(): Promise<TimerSnapshot | null> {
    try {
      if (!window.forestAPI) return null;
      const snapshot = await window.forestAPI.skipBreak();
      const isSessionActive =
        snapshot.status === 'focusing' ||
        snapshot.status === 'paused' ||
        snapshot.status === 'break';
      updateState({
        timer: snapshot,
        isSessionActive,
      });
      return snapshot;
    } catch (err) {
      console.error('Failed to skip break:', err);
      return null;
    }
  },

  async resetTimer(): Promise<TimerSnapshot | null> {
    try {
      if (!window.forestAPI) return null;
      const snapshot = await window.forestAPI.resetTimer();
      updateState({
        timer: snapshot,
        isSessionActive: false,
      });
      return snapshot;
    } catch (err) {
      console.error('Failed to reset timer:', err);
      return null;
    }
  },

  // --- Phase 6 Ambient Sounds Actions ---
  async playAmbient(trackId?: string): Promise<void> {
    const id =
      trackId ||
      currentState.settings.activeAmbientId ||
      currentState.ambientTracks[0]?.id;
    if (!id) return;

    const track = currentState.ambientTracks.find((t) => t.id === id);
    if (!track) return;

    // Update settings if track selection changed
    if (currentState.settings.activeAmbientId !== id) {
      await this.updateSettings({ activeAmbientId: id });
    }

    if (track.category === 'nature') {
      ambientAudioEngine.playNature(track.id, currentState.settings.ambientVolume);
    } else {
      // YouTube streams are handled via AmbientPlayerDock embed
      ambientAudioEngine.stop();
    }

    updateState({ isAmbientPlaying: true });
  },

  stopAmbient(): void {
    ambientAudioEngine.stop();
    updateState({ isAmbientPlaying: false });
  },

  toggleAmbient(): void {
    if (currentState.isAmbientPlaying) {
      this.stopAmbient();
    } else {
      this.playAmbient(currentState.settings.activeAmbientId || undefined);
    }
  },

  async setAmbientVolume(vol: number): Promise<void> {
    const clamped = Math.max(0, Math.min(1, vol));
    ambientAudioEngine.setVolume(clamped);
    await this.updateSettings({ ambientVolume: clamped });
  },

  async setSyncAmbientWithTimer(sync: boolean): Promise<void> {
    await this.updateSettings({ syncAmbientWithTimer: sync });
  },

  async addAmbientTrack(
    title: string,
    url: string,
    category?: 'nature' | 'youtube',
  ): Promise<AmbientTrack | null> {
    try {
      if (!window.forestAPI) return null;
      const newTrack = await window.forestAPI.addCustomAmbientTrack(title, url, category);
      updateState({
        ambientTracks: [...currentState.ambientTracks, newTrack],
      });
      return newTrack;
    } catch (err) {
      console.error('Failed to add custom ambient track:', err);
      return null;
    }
  },

  async deleteAmbientTrack(id: string): Promise<boolean> {
    try {
      if (!window.forestAPI) return false;
      const success = await window.forestAPI.deleteAmbientTrack(id);
      if (success) {
        if (currentState.settings.activeAmbientId === id) {
          if (currentState.isAmbientPlaying) {
            this.stopAmbient();
          }
          await this.updateSettings({ activeAmbientId: null });
        }
        updateState({
          ambientTracks: currentState.ambientTracks.filter((t) => t.id !== id),
        });
      }
      return success;
    } catch (err) {
      console.error('Failed to delete ambient track:', err);
      return false;
    }
  },
};

/**
 * Lightweight selector hook with fine-grained subscription to avoid full re-renders
 */
export function useForestSelector<T>(selector: (state: ForestStoreState) => T): T {
  return useSyncExternalStore(
    forestStore.subscribe,
    () => selector(forestStore.getState()),
    () => selector(forestStore.getState()),
  );
}
