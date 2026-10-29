import { ipcMain, BrowserWindow, shell } from 'electron';
import { ForestDatabase } from '../database/db';
import { TimerEngine } from '../services/TimerEngine';
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
} from '../../shared/types';

export function registerIpcHandlers(db: ForestDatabase, timerEngine: TimerEngine): void {
  // Wire up Timer tick broadcasting to all active windows
  timerEngine.setTickCallback((snapshot: TimerSnapshot) => {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('forest:timer:tick', snapshot);
      }
    }
  });

  ipcMain.handle('forest:getBootstrapData', async (): Promise<BootstrapData> => {
    return db.getBootstrapData(timerEngine.getSnapshot());
  });

  ipcMain.handle('forest:getSettings', async (): Promise<UserSettings> => {
    return db.getSettings();
  });

  ipcMain.handle('forest:updateSettings', async (_event, updates: Partial<UserSettings>): Promise<UserSettings> => {
    return db.updateSettings(updates);
  });

  ipcMain.handle('forest:unlockItem', async (_event, type: 'tree' | 'land', itemId: string): Promise<UnlockResult> => {
    return db.unlockItem(type, itemId);
  });

  ipcMain.handle('forest:getTags', async (): Promise<FocusTag[]> => {
    return db.getTags();
  });

  ipcMain.handle('forest:createTag', async (_event, name: string, color: string): Promise<FocusTag> => {
    return db.createTag(name, color);
  });

  ipcMain.handle('forest:updateTag', async (_event, id: string, name: string, color: string): Promise<FocusTag> => {
    return db.updateTag(id, name, color);
  });

  ipcMain.handle('forest:deleteTag', async (_event, id: string): Promise<boolean> => {
    return db.deleteTag(id);
  });

  ipcMain.handle('forest:recordFocusSession', async (_event, session: Omit<FocusSession, 'id'>): Promise<FocusSession> => {
    return db.recordFocusSession(session);
  });

  ipcMain.handle('forest:updateSessionNote', async (_event, sessionId: string, note: string): Promise<boolean> => {
    return db.updateSessionNote(sessionId, note);
  });

  ipcMain.handle('forest:getRecentSessions', async (_event, limit?: number): Promise<FocusSession[]> => {
    return db.getRecentSessions(limit);
  });

  ipcMain.handle('forest:getChallenges', async (): Promise<FocusChallenge[]> => {
    return db.getChallenges();
  });

  ipcMain.handle('forest:claimChallengeReward', async (_event, id: string): Promise<{ success: boolean; coins: number }> => {
    return db.claimChallengeReward(id);
  });

  ipcMain.handle('forest:challenges:resetCompleted', async (): Promise<FocusChallenge[]> => {
    return db.resetCompletedChallenges();
  });

  ipcMain.handle('forest:system:getDiagnostics', async (): Promise<SystemDiagnostics> => {
    return db.getDiagnostics();
  });

  ipcMain.handle('forest:system:grantTestCoins', async (_event, amount?: number): Promise<number> => {
    return db.grantTestCoins(amount ?? 500);
  });

  ipcMain.handle('forest:getAmbientTracks', async (): Promise<AmbientTrack[]> => {
    return db.getAmbientTracks();
  });

  ipcMain.handle(
    'forest:addCustomAmbientTrack',
    async (
      _event,
      title: string,
      url: string,
      category?: 'nature' | 'youtube',
    ): Promise<AmbientTrack> => {
      return db.addCustomAmbientTrack(title, url, category);
    },
  );

  ipcMain.handle('forest:deleteAmbientTrack', async (_event, id: string): Promise<boolean> => {
    return db.deleteAmbientTrack(id);
  });

  ipcMain.handle('forest:openExternal', async (_event, url: string): Promise<boolean> => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      const isAllowedHost =
        hostname === 'youtube.com' ||
        hostname.endsWith('.youtube.com') ||
        hostname === 'youtu.be' ||
        hostname === 'forestapp.cc' ||
        hostname.endsWith('.forestapp.cc');

      if (!isAllowedHost) {
        console.warn(`Blocked external URL navigation to unauthorized host: ${hostname}`);
        return false;
      }

      await shell.openExternal(url);
      return true;
    } catch (err) {
      console.error('Failed to open external URL:', err);
      return false;
    }
  });

  // --- Phase 3 Timer Engine IPC ---
  ipcMain.handle(
    'forest:timer:start',
    async (
      _event,
      options: { mode: TimerMode; durationMinutes: number; treeSpeciesId: string; tagId: string },
    ): Promise<TimerSnapshot> => {
      return timerEngine.start(options);
    },
  );

  ipcMain.handle('forest:timer:pause', async (): Promise<boolean> => {
    return timerEngine.pause();
  });

  ipcMain.handle('forest:timer:resume', async (): Promise<boolean> => {
    return timerEngine.resume();
  });

  ipcMain.handle('forest:timer:stop', async (): Promise<TimerSnapshot> => {
    return timerEngine.stop();
  });

  ipcMain.handle('forest:timer:startBreak', async (_event, durationMinutes?: number): Promise<TimerSnapshot> => {
    return timerEngine.startBreak(durationMinutes);
  });

  ipcMain.handle('forest:timer:skipBreak', async (): Promise<TimerSnapshot> => {
    return timerEngine.skipBreak();
  });

  ipcMain.handle('forest:timer:reset', async (): Promise<TimerSnapshot> => {
    return timerEngine.reset();
  });

  ipcMain.handle('forest:timer:getState', async (): Promise<TimerSnapshot> => {
    return timerEngine.getSnapshot();
  });
}
