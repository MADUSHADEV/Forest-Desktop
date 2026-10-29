import { contextBridge, ipcRenderer } from 'electron';
import {
  UserSettings,
  FocusSession,
  BootstrapData,
  UnlockResult,
  FocusTag,
  FocusChallenge,
  AmbientTrack,
  TimerSnapshot,
  TimerMode,
  SystemDiagnostics,
  ForestAPI,
} from '../shared/types';

const forestAPI: ForestAPI = {
  getBootstrapData: (): Promise<BootstrapData> => {
    return ipcRenderer.invoke('forest:getBootstrapData');
  },

  getSettings: (): Promise<UserSettings> => {
    return ipcRenderer.invoke('forest:getSettings');
  },

  updateSettings: (settings: Partial<UserSettings>): Promise<UserSettings> => {
    return ipcRenderer.invoke('forest:updateSettings', settings);
  },

  unlockItem: (type: 'tree' | 'land', itemId: string): Promise<UnlockResult> => {
    return ipcRenderer.invoke('forest:unlockItem', type, itemId);
  },

  getTags: (): Promise<FocusTag[]> => {
    return ipcRenderer.invoke('forest:getTags');
  },

  createTag: (name: string, color: string): Promise<FocusTag> => {
    return ipcRenderer.invoke('forest:createTag', name, color);
  },

  updateTag: (id: string, name: string, color: string): Promise<FocusTag> => {
    return ipcRenderer.invoke('forest:updateTag', id, name, color);
  },

  deleteTag: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke('forest:deleteTag', id);
  },

  recordFocusSession: (session: Omit<FocusSession, 'id'>): Promise<FocusSession> => {
    return ipcRenderer.invoke('forest:recordFocusSession', session);
  },

  updateSessionNote: (sessionId: string, note: string): Promise<boolean> => {
    return ipcRenderer.invoke('forest:updateSessionNote', sessionId, note);
  },

  getRecentSessions: (limit?: number): Promise<FocusSession[]> => {
    return ipcRenderer.invoke('forest:getRecentSessions', limit);
  },

  getChallenges: (): Promise<FocusChallenge[]> => {
    return ipcRenderer.invoke('forest:getChallenges');
  },

  claimChallengeReward: (id: string): Promise<{ success: boolean; coins: number }> => {
    return ipcRenderer.invoke('forest:claimChallengeReward', id);
  },

  resetCompletedChallenges: (): Promise<FocusChallenge[]> => {
    return ipcRenderer.invoke('forest:challenges:resetCompleted');
  },

  getDiagnostics: (): Promise<SystemDiagnostics> => {
    return ipcRenderer.invoke('forest:system:getDiagnostics');
  },

  grantTestCoins: (amount?: number): Promise<number> => {
    return ipcRenderer.invoke('forest:system:grantTestCoins', amount);
  },

  getAmbientTracks: (): Promise<AmbientTrack[]> => {
    return ipcRenderer.invoke('forest:getAmbientTracks');
  },

  addCustomAmbientTrack: (title: string, url: string, category?: 'nature' | 'youtube'): Promise<AmbientTrack> => {
    return ipcRenderer.invoke('forest:addCustomAmbientTrack', title, url, category);
  },

  deleteAmbientTrack: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke('forest:deleteAmbientTrack', id);
  },

  openExternal: (url: string): Promise<boolean> => {
    return ipcRenderer.invoke('forest:openExternal', url);
  },

  // --- Phase 3 Timer Engine Methods ---
  startTimer: (options: {
    mode: TimerMode;
    durationMinutes: number;
    treeSpeciesId: string;
    tagId: string;
  }): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:start', options);
  },

  pauseTimer: (): Promise<boolean> => {
    return ipcRenderer.invoke('forest:timer:pause');
  },

  resumeTimer: (): Promise<boolean> => {
    return ipcRenderer.invoke('forest:timer:resume');
  },

  stopTimer: (): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:stop');
  },

  startBreak: (durationMinutes?: number): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:startBreak', durationMinutes);
  },

  skipBreak: (): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:skipBreak');
  },

  resetTimer: (): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:reset');
  },

  getTimerState: (): Promise<TimerSnapshot> => {
    return ipcRenderer.invoke('forest:timer:getState');
  },

  onTimerTick: (callback: (snapshot: TimerSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: TimerSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on('forest:timer:tick', listener);
    return () => {
      ipcRenderer.removeListener('forest:timer:tick', listener);
    };
  },
};

contextBridge.exposeInMainWorld('forestAPI', forestAPI);
