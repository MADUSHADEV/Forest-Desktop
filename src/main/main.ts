import { app, BrowserWindow, Tray, Menu, Notification, nativeImage } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { ForestDatabase } from './database/db';
import { TimerEngine } from './services/TimerEngine';
import { registerIpcHandlers } from './ipc/handlers';
import { TimerSnapshot } from '../shared/types';

export { ForestDatabase, TimerEngine };

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

if (!started && app) {
  // Set Windows App User Model ID early
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.squirrel.ForestDesktop.ForestDesktop');
  }

  // 1. Single Instance Lock
  const gotSingleInstanceLock = app.requestSingleInstanceLock();
  if (!gotSingleInstanceLock) {
    app.quit();
  }

  // 2. V8 and Chromium Memory & Performance Optimizations
  app.commandLine?.appendSwitch('js-flags', '--max-old-space-size=128');
  app.commandLine?.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,Spellcheck');
  app.commandLine?.appendSwitch('disable-renderer-backgrounding');
}

let mainWindow: BrowserWindow | null = null;
let db: ForestDatabase | null = null;
let timerEngine: TimerEngine | null = null;
let tray: Tray | null = null;
let lastTimerStatus: TimerSnapshot['status'] = 'idle';

function getAppIcon(): Electron.NativeImage {
  const possiblePaths = [
    path.join(__dirname, '../../assets/icon.png'),
    path.join(app.getAppPath(), 'assets/icon.png'),
    path.join(__dirname, '../renderer/assets/icon.png'),
    path.join(process.resourcesPath, 'assets/icon.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return nativeImage.createFromPath(p);
    }
  }
  return nativeImage.createEmpty();
}

function createTrayIcon(): Electron.NativeImage {
  const icon = getAppIcon();
  if (!icon.isEmpty()) {
    return icon.resize({ width: 24, height: 24 });
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <polygon points="16,4 7,16 11,16 5,24 27,24 21,16 25,16" fill="#81C784"/>
    <rect x="14" y="24" width="4" height="6" fill="#A5D6A7"/>
  </svg>`.trim();
  return nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
}

function updateTray(snapshot?: TimerSnapshot): void {
  if (!tray) return;

  const status = snapshot?.status || 'idle';
  const remaining = snapshot?.remainingSeconds || 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let statusText = 'Ready to Focus';
  if (status === 'focusing') statusText = `Focusing (${timeStr})`;
  else if (status === 'paused') statusText = `Paused (${timeStr})`;
  else if (status === 'break') statusText = `Break (${timeStr})`;
  else if (status === 'completed') statusText = 'Tree Grown!';
  else if (status === 'withered') statusText = 'Tree Withered';

  tray.setToolTip(`🌲 Forest — ${statusText}`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Forest',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label:
        status === 'focusing'
          ? 'Pause Timer'
          : status === 'paused'
          ? 'Resume Timer'
          : 'Start 25m Focus',
      enabled: status !== 'break',
      click: async () => {
        if (!timerEngine) return;
        if (status === 'focusing') {
          timerEngine.pause();
        } else if (status === 'paused') {
          timerEngine.resume();
        } else {
          const settings = db?.getSettings();
          timerEngine.start({
            mode: 'countdown',
            durationMinutes: settings?.defaultFocusMinutes || 25,
            treeSpeciesId: settings?.selectedTreeId || 'cedar',
            tagId: settings?.selectedTagId || 'tag-work',
          });
        }
      },
    },
    ...(status === 'break'
      ? [
          {
            label: 'Skip Break',
            click: () => timerEngine?.skipBreak(),
          },
        ]
      : []),
    {
      label: 'Reset Timer',
      enabled: status !== 'idle',
      click: () => timerEngine?.reset(),
    },
    { type: 'separator' },
    {
      label: 'Quit Forest',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

const createWindow = (): void => {
  // Resolve preload script path reliably for both dev and prod vite output
  const preloadCandidateCjs = path.join(__dirname, 'preload.cjs');
  const preloadPath = fs.existsSync(preloadCandidateCjs)
    ? preloadCandidateCjs
    : path.join(__dirname, 'preload.js');

  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    minWidth: 380,
    minHeight: 680,
    title: 'Forest',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    backgroundColor: '#51a387',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      spellcheck: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Focus single instance if another instance is launched
  app?.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Load URL or Vite bundle
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

if (!started && app) {
  // Lifecycle initialization
  app.whenReady().then(() => {
    // Initialize Database & Timer Engine & IPC
    db = new ForestDatabase();
    timerEngine = new TimerEngine(db);
    registerIpcHandlers(db, timerEngine);

    // Initialize System Tray
    try {
      tray = new Tray(createTrayIcon());
      tray.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
              mainWindow.hide();
            } else {
              mainWindow.focus();
            }
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      });
      updateTray(timerEngine.getSnapshot());
    } catch (err) {
      console.warn('System tray initialization skipped:', err);
    }

    // Connect Timer Engine ticks to Tray & Native OS Notifications
    timerEngine.addTickListener((snapshot) => {
      updateTray(snapshot);

      // Handle Notifications on State Transitions
      if (snapshot.status !== lastTimerStatus) {
        const appIcon = getAppIcon();
        const notificationIcon = appIcon.isEmpty() ? undefined : appIcon;

        if (snapshot.status === 'completed' && Notification.isSupported()) {
          new Notification({
            title: '🌲 Tree Grown Successfully!',
            body: `Your tree flourished in your forest! You earned +${snapshot.lastEarnedCoins || 10} coins.`,
            icon: notificationIcon,
          }).show();
        } else if (snapshot.status === 'withered' && Notification.isSupported()) {
          new Notification({
            title: '🥀 Tree Withered',
            body: 'Focus session was abandoned. Take a deep breath and try again!',
            icon: notificationIcon,
          }).show();
        } else if (snapshot.status === 'break' && lastTimerStatus !== 'break' && Notification.isSupported()) {
          new Notification({
            title: '☕ Break Time Started',
            body: 'Focus session completed! Enjoy your refreshing break.',
            icon: notificationIcon,
          }).show();
        } else if (lastTimerStatus === 'break' && snapshot.status !== 'break' && Notification.isSupported()) {
          new Notification({
            title: '🌱 Break Complete!',
            body: snapshot.status === 'focusing'
              ? 'Auto-focus session has started. Happy planting!'
              : 'Break is over. Ready to plant your next tree!',
            icon: notificationIcon,
          }).show();
        }
        lastTimerStatus = snapshot.status;
      }
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Clean database shutdown
  app.on('will-quit', () => {
    if (tray) {
      try {
        tray.destroy();
        tray = null;
      } catch {
        // Safe ignore
      }
    }
    if (timerEngine) {
      timerEngine.reset();
      timerEngine = null;
    }
    if (db) {
      try {
        db.close();
        db = null;
      } catch (err) {
        console.error('Error closing Forest database:', err);
      }
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
