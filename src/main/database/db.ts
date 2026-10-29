import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  UserSettings,
  TreeSpecies,
  LandStyle,
  FocusTag,
  FocusSession,
  FocusChallenge,
  AmbientTrack,
  BootstrapData,
  UnlockResult,
  TimerSnapshot,
  SystemDiagnostics,
} from '../../shared/types';
import { INITIAL_TREES_CATALOG, INITIAL_LANDS_CATALOG } from '../../shared/catalog';

export class ForestDatabase {
  private db: Database.Database;

  constructor(customPath?: string) {
    let dbPath = customPath;
    if (!dbPath) {
      const userDataDir = app?.getPath ? app.getPath('userData') : process.cwd();
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      dbPath = path.join(userDataDir, 'forest-desktop.sqlite');
    }

    this.db = new Database(dbPath);
    this.initPragmas();
    this.initSchema();
    this.seedInitialData();
  }

  private initPragmas(): void {
    // Memory and concurrency optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('cache_size = -2000'); // Limit page cache to ~2MB RAM
    this.db.pragma('foreign_keys = ON');
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        allow_pause INTEGER NOT NULL DEFAULT 1,
        auto_focus_after_break INTEGER NOT NULL DEFAULT 0,
        break_duration_minutes INTEGER NOT NULL DEFAULT 5,
        default_focus_minutes INTEGER NOT NULL DEFAULT 25,
        selected_tree_id TEXT NOT NULL DEFAULT 'cedar',
        selected_land_id TEXT NOT NULL DEFAULT 'classic-meadow',
        selected_tag_id TEXT NOT NULL DEFAULT 'tag-work',
        coins INTEGER NOT NULL DEFAULT 500,
        active_ambient_id TEXT DEFAULT NULL,
        ambient_volume REAL NOT NULL DEFAULT 0.5,
        sync_ambient_with_timer INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS unlocked_items (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL CHECK (item_type IN ('tree', 'land')),
        item_id TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('countdown', 'stopwatch')),
        tree_species_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('completed', 'withered')),
        coins_earned INTEGER NOT NULL DEFAULT 0,
        note TEXT
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        reward_coins INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        claimed INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS ambient_tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('nature', 'youtube')),
        url TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON focus_sessions(start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_unlocked_items_type ON unlocked_items(item_type, item_id);
    `);

    // Safe column migrations
    try {
      this.db.exec('ALTER TABLE user_settings ADD COLUMN sync_ambient_with_timer INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Column already exists
    }
    try {
      this.db.exec('ALTER TABLE challenges ADD COLUMN claimed INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // Column already exists
    }
  }

  private seedInitialData(): void {
    const now = Date.now();

    // 1. Seed User Settings
    const existingSettings = this.db.prepare('SELECT id FROM user_settings WHERE id = 1').get();
    if (!existingSettings) {
      this.db.prepare(`
        INSERT INTO user_settings (
          id, allow_pause, auto_focus_after_break, break_duration_minutes,
          default_focus_minutes, selected_tree_id, selected_land_id, selected_tag_id,
          coins, active_ambient_id, ambient_volume, sync_ambient_with_timer
        ) VALUES (1, 1, 0, 5, 25, 'cedar', 'classic-meadow', 'tag-work', 500, NULL, 0.5, 0)
      `).run();
    }

    // 2. Seed Starter Unlocked Items
    const insertUnlocked = this.db.prepare(`
      INSERT OR IGNORE INTO unlocked_items (id, item_type, item_id, unlocked_at)
      VALUES (?, ?, ?, ?)
    `);

    const starterItems: Array<{ type: 'tree' | 'land'; id: string }> = [
      { type: 'tree', id: 'cedar' },
      { type: 'tree', id: 'oak-bush' },
      { type: 'land', id: 'classic-meadow' },
    ];

    const seedUnlockedTx = this.db.transaction(() => {
      for (const item of starterItems) {
        insertUnlocked.run(`${item.type}:${item.id}`, item.type, item.id, now);
      }
    });
    seedUnlockedTx();

    // 3. Seed Default Tags
    const existingTagCount = (this.db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number }).count;
    if (existingTagCount === 0) {
      const defaultTags: Array<{ id: string; name: string; color: string }> = [
        { id: 'tag-work', name: 'Work', color: '#4E7D55' },
        { id: 'tag-study', name: 'Study', color: '#4A90E2' },
        { id: 'tag-coding', name: 'Coding', color: '#9013FE' },
        { id: 'tag-rest', name: 'Rest', color: '#F5A623' },
        { id: 'tag-sport', name: 'Sport', color: '#E05638' },
      ];

      const insertTag = this.db.prepare(`
        INSERT INTO tags (id, name, color, is_default, created_at)
        VALUES (?, ?, ?, 1, ?)
      `);

      const seedTagsTx = this.db.transaction(() => {
        for (const tag of defaultTags) {
          insertTag.run(tag.id, tag.name, tag.color, now);
        }
      });
      seedTagsTx();
    }

    // 4. Seed 6 Engaging Focus Challenges
    const defaultChallenges: Array<{
      id: string;
      title: string;
      description: string;
      target_type: FocusChallenge['targetType'];
      target_value: number;
      reward_coins: number;
    }> = [
      {
        id: 'challenge-seed-planter',
        title: 'Seed Planter',
        description: 'Complete 3 focus sessions without withering',
        target_type: 'sessions_count',
        target_value: 3,
        reward_coins: 100,
      },
      {
        id: 'challenge-deep-roots',
        title: 'Deep Roots',
        description: 'Accumulate 120 minutes of total focused planting time',
        target_type: 'total_minutes',
        target_value: 120,
        reward_coins: 250,
      },
      {
        id: 'challenge-unbroken-zen',
        title: 'Unbroken Zen',
        description: 'Complete 3 consecutive focus sessions with zero pauses',
        target_type: 'no_pause_streak',
        target_value: 3,
        reward_coins: 200,
      },
      {
        id: 'challenge-seasonal-botanist',
        title: 'Seasonal Botanist',
        description: 'Plant and grow 3 seasonal tree varieties to maturity',
        target_type: 'seasonal_trees',
        target_value: 3,
        reward_coins: 300,
      },
      {
        id: 'challenge-grove-architect',
        title: 'Grove Architect',
        description: 'Complete 10 total focus sessions successfully',
        target_type: 'sessions_count',
        target_value: 10,
        reward_coins: 500,
      },
      {
        id: 'challenge-master-of-time',
        title: 'Master of Time',
        description: 'Focus for 300 total minutes in your forest',
        target_type: 'total_minutes',
        target_value: 300,
        reward_coins: 600,
      },
    ];

    const insertChallenge = this.db.prepare(`
      INSERT OR IGNORE INTO challenges (id, title, description, target_type, target_value, current_value, reward_coins, completed, claimed)
      VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0)
    `);

    const seedChallengesTx = this.db.transaction(() => {
      for (const ch of defaultChallenges) {
        insertChallenge.run(ch.id, ch.title, ch.description, ch.target_type, ch.target_value, ch.reward_coins);
      }
    });
    seedChallengesTx();

    // 5. Seed Ambient Library
    const defaultTracks: Array<{
      id: string;
      title: string;
      category: 'nature' | 'youtube';
      url: string;
    }> = [
      {
        id: 'ambient-rain',
        title: 'Forest Rain',
        category: 'nature',
        url: 'nature://forest-rain',
      },
      {
        id: 'ambient-wind',
        title: 'Wind in the Pines',
        category: 'nature',
        url: 'nature://wind-pines',
      },
      {
        id: 'ambient-campfire',
        title: 'Cozy Campfire',
        category: 'nature',
        url: 'nature://cozy-campfire',
      },
      {
        id: 'ambient-waves',
        title: 'Ocean Waves',
        category: 'nature',
        url: 'nature://ocean-waves',
      },
      {
        id: 'ambient-crickets',
        title: 'Night Crickets',
        category: 'nature',
        url: 'nature://night-crickets',
      },
      {
        id: 'ambient-zen',
        title: 'Deep Zen Drone',
        category: 'nature',
        url: 'nature://deep-zen',
      },
      {
        id: 'ambient-yt-lofi',
        title: 'Lofi Hip Hop Study Beats',
        category: 'youtube',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      },
      {
        id: 'ambient-yt-birds',
        title: 'Forest Birdsong & Brook Ambience',
        category: 'youtube',
        url: 'https://www.youtube.com/watch?v=xNN7iTA57jM',
      },
      {
        id: 'ambient-yt-piano',
        title: 'Peaceful Piano & Rain',
        category: 'youtube',
        url: 'https://www.youtube.com/watch?v=lCOF9LN_Zxs',
      },
      {
        id: 'ambient-yt-space',
        title: 'Deep Space Ambient Synth',
        category: 'youtube',
        url: 'https://www.youtube.com/watch?v=WPni755-Krg',
      },
    ];

    const insertAmbient = this.db.prepare(`
      INSERT OR IGNORE INTO ambient_tracks (id, title, category, url, is_custom)
      VALUES (?, ?, ?, ?, 0)
    `);

    const seedAmbientTx = this.db.transaction(() => {
      for (const track of defaultTracks) {
        insertAmbient.run(track.id, track.title, track.category, track.url);
      }
    });
    seedAmbientTx();
  }

  // --- Settings Repository Methods ---
  public getSettings(): UserSettings {
    const row = this.db.prepare(`
      SELECT
        allow_pause, auto_focus_after_break, break_duration_minutes,
        default_focus_minutes, selected_tree_id, selected_land_id,
        selected_tag_id, coins, active_ambient_id, ambient_volume,
        sync_ambient_with_timer
      FROM user_settings
      WHERE id = 1
    `).get() as {
      allow_pause: number;
      auto_focus_after_break: number;
      break_duration_minutes: number;
      default_focus_minutes: number;
      selected_tree_id: string;
      selected_land_id: string;
      selected_tag_id: string;
      coins: number;
      active_ambient_id: string | null;
      ambient_volume: number;
      sync_ambient_with_timer: number;
    };

    return {
      allowPause: Boolean(row.allow_pause),
      autoFocusAfterBreak: Boolean(row.auto_focus_after_break),
      breakDurationMinutes: row.break_duration_minutes,
      defaultFocusMinutes: row.default_focus_minutes,
      selectedTreeId: row.selected_tree_id,
      selectedLandId: row.selected_land_id,
      selectedTagId: row.selected_tag_id,
      coins: row.coins,
      activeAmbientId: row.active_ambient_id,
      ambientVolume: row.ambient_volume,
      syncAmbientWithTimer: Boolean(row.sync_ambient_with_timer),
    };
  }

  public updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const merged: UserSettings = { ...current, ...updates };

    this.db.prepare(`
      UPDATE user_settings
      SET
        allow_pause = ?,
        auto_focus_after_break = ?,
        break_duration_minutes = ?,
        default_focus_minutes = ?,
        selected_tree_id = ?,
        selected_land_id = ?,
        selected_tag_id = ?,
        coins = ?,
        active_ambient_id = ?,
        ambient_volume = ?,
        sync_ambient_with_timer = ?
      WHERE id = 1
    `).run(
      merged.allowPause ? 1 : 0,
      merged.autoFocusAfterBreak ? 1 : 0,
      merged.breakDurationMinutes,
      merged.defaultFocusMinutes,
      merged.selectedTreeId,
      merged.selectedLandId,
      merged.selectedTagId,
      merged.coins,
      merged.activeAmbientId,
      merged.ambientVolume,
      merged.syncAmbientWithTimer ? 1 : 0,
    );

    return merged;
  }

  // --- Catalog & Unlock Repository Methods ---
  public getUnlockedItemIds(): { trees: Set<string>; lands: Set<string> } {
    const rows = this.db.prepare('SELECT item_type, item_id FROM unlocked_items').all() as Array<{
      item_type: 'tree' | 'land';
      item_id: string;
    }>;

    const trees = new Set<string>();
    const lands = new Set<string>();

    for (const row of rows) {
      if (row.item_type === 'tree') {
        trees.add(row.item_id);
      } else if (row.item_type === 'land') {
        lands.add(row.item_id);
      }
    }

    return { trees, lands };
  }

  public unlockItem(type: 'tree' | 'land', itemId: string): UnlockResult {
    const catalogItem =
      type === 'tree'
        ? INITIAL_TREES_CATALOG.find((t) => t.id === itemId)
        : INITIAL_LANDS_CATALOG.find((l) => l.id === itemId);

    if (!catalogItem) {
      return { success: false, coins: this.getSettings().coins, error: 'Item not found in catalog' };
    }

    const { trees, lands } = this.getUnlockedItemIds();
    const isAlreadyUnlocked = type === 'tree' ? trees.has(itemId) : lands.has(itemId);

    if (isAlreadyUnlocked) {
      return { success: true, coins: this.getSettings().coins };
    }

    const price = catalogItem.price;
    const currentCoins = this.getSettings().coins;

    if (currentCoins < price) {
      return {
        success: false,
        coins: currentCoins,
        error: `Insufficient coins. Requires ${price} coins, but you have ${currentCoins}.`,
      };
    }

    const unlockTransaction = this.db.transaction(() => {
      this.db.prepare('UPDATE user_settings SET coins = coins - ? WHERE id = 1').run(price);
      this.db.prepare(`
        INSERT INTO unlocked_items (id, item_type, item_id, unlocked_at)
        VALUES (?, ?, ?, ?)
      `).run(`${type}:${itemId}`, type, itemId, Date.now());
    });

    unlockTransaction();

    const newCoins = this.getSettings().coins;
    return { success: true, coins: newCoins };
  }

  // --- Tags Repository Methods ---
  public getTags(): FocusTag[] {
    const rows = this.db.prepare('SELECT id, name, color, is_default FROM tags ORDER BY is_default DESC, name ASC').all() as Array<{
      id: string;
      name: string;
      color: string;
      is_default: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      isDefault: Boolean(r.is_default),
    }));
  }

  public createTag(name: string, color: string): FocusTag {
    const id = `tag-${randomUUID().slice(0, 8)}`;
    this.db.prepare(`
      INSERT INTO tags (id, name, color, is_default, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(id, name.trim(), color.trim(), Date.now());

    return { id, name: name.trim(), color: color.trim(), isDefault: false };
  }

  public updateTag(id: string, name: string, color: string): FocusTag {
    this.db.prepare(`
      UPDATE tags
      SET name = ?, color = ?
      WHERE id = ?
    `).run(name.trim(), color.trim(), id);

    const tag = this.db.prepare('SELECT is_default FROM tags WHERE id = ?').get(id) as { is_default: number };
    return {
      id,
      name: name.trim(),
      color: color.trim(),
      isDefault: Boolean(tag?.is_default),
    };
  }

  public deleteTag(id: string): boolean {
    const tag = this.db.prepare('SELECT is_default FROM tags WHERE id = ?').get(id) as { is_default: number } | undefined;
    if (!tag || tag.is_default === 1) {
      return false; // Cannot delete default tags or non-existent tags
    }

    // Reassign historical sessions to default tag (tag-work) inside an atomic transaction
    const deleteTx = this.db.transaction(() => {
      this.db.prepare('UPDATE focus_sessions SET tag_id = ? WHERE tag_id = ?').run('tag-work', id);
      this.db.prepare('UPDATE user_settings SET selected_tag_id = ? WHERE selected_tag_id = ?').run('tag-work', id);
      this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    });

    deleteTx();
    return true;
  }

  // --- Focus Sessions Repository Methods ---
  public updateSessionNote(sessionId: string, note: string): boolean {
    const res = this.db.prepare('UPDATE focus_sessions SET note = ? WHERE id = ?').run(note.trim(), sessionId);
    return res.changes > 0;
  }
  public recordFocusSession(sessionData: Omit<FocusSession, 'id'>, wasPaused = false): FocusSession {
    const id = randomUUID();
    const session: FocusSession = {
      ...sessionData,
      id,
    };

    const recordTx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO focus_sessions (
          id, start_time, end_time, duration_seconds, mode,
          tree_species_id, tag_id, status, coins_earned, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        session.id,
        session.startTime,
        session.endTime,
        session.durationSeconds,
        session.mode,
        session.treeSpeciesId,
        session.tagId,
        session.status,
        session.coinsEarned,
        session.note || null,
      );

      // Award coins if any
      if (session.coinsEarned > 0) {
        this.db.prepare('UPDATE user_settings SET coins = coins + ? WHERE id = 1').run(session.coinsEarned);
      }

      // Update relevant challenges if session completed
      if (session.status === 'completed') {
        const minutes = Math.floor(session.durationSeconds / 60);
        if (minutes > 0) {
          this.updateChallengeProgressInternal('total_minutes', minutes);
        }
        this.updateChallengeProgressInternal('sessions_count', 1);

        // Track No-Pause streak
        if (!wasPaused) {
          this.updateChallengeProgressInternal('no_pause_streak', 1);
        } else {
          this.db.prepare("UPDATE challenges SET current_value = 0 WHERE target_type = 'no_pause_streak' AND completed = 0").run();
        }

        // Check if tree planted is seasonal
        const tree = INITIAL_TREES_CATALOG.find((t) => t.id === session.treeSpeciesId);
        if (tree && tree.category === 'seasonal') {
          this.updateChallengeProgressInternal('seasonal_trees', 1);
        }
      }
    });

    recordTx();
    return session;
  }

  public getRecentSessions(limit = 50): FocusSession[] {
    const rows = this.db.prepare(`
      SELECT id, start_time, end_time, duration_seconds, mode,
             tree_species_id, tag_id, status, coins_earned, note
      FROM focus_sessions
      ORDER BY start_time DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: string;
      start_time: number;
      end_time: number;
      duration_seconds: number;
      mode: 'countdown' | 'stopwatch';
      tree_species_id: string;
      tag_id: string;
      status: 'completed' | 'withered';
      coins_earned: number;
      note: string | null;
    }>;

    return rows.map((r) => ({
      id: r.id,
      startTime: r.start_time,
      endTime: r.end_time,
      durationSeconds: r.duration_seconds,
      mode: r.mode,
      treeSpeciesId: r.tree_species_id,
      tagId: r.tag_id,
      status: r.status,
      coinsEarned: r.coins_earned,
      note: r.note ?? undefined,
    }));
  }

  // --- Challenges Repository Methods ---
  public getChallenges(): FocusChallenge[] {
    const rows = this.db.prepare(`
      SELECT id, title, description, target_type, target_value, current_value, reward_coins, completed, claimed
      FROM challenges
      ORDER BY claimed ASC, completed DESC, target_value ASC
    `).all() as Array<{
      id: string;
      title: string;
      description: string;
      target_type: FocusChallenge['targetType'];
      target_value: number;
      current_value: number;
      reward_coins: number;
      completed: number;
      claimed: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      targetType: r.target_type,
      targetValue: r.target_value,
      currentValue: r.current_value,
      rewardCoins: r.reward_coins,
      completed: Boolean(r.completed),
      claimed: Boolean(r.claimed),
    }));
  }

  private updateChallengeProgressInternal(targetType: FocusChallenge['targetType'], incrementBy: number): void {
    const challenges = this.db.prepare(`
      SELECT id, target_value, current_value, completed
      FROM challenges
      WHERE target_type = ? AND completed = 0
    `).all(targetType) as Array<{
      id: string;
      target_value: number;
      current_value: number;
      completed: number;
    }>;

    for (const ch of challenges) {
      const nextVal = ch.current_value + incrementBy;
      const isCompleted = nextVal >= ch.target_value ? 1 : 0;
      this.db.prepare(`
        UPDATE challenges
        SET current_value = ?, completed = ?
        WHERE id = ?
      `).run(nextVal, isCompleted, ch.id);
    }
  }

  public updateChallengeProgress(targetType: FocusChallenge['targetType'], incrementBy: number): void {
    this.updateChallengeProgressInternal(targetType, incrementBy);
  }

  public claimChallengeReward(id: string): { success: boolean; coins: number } {
    const ch = this.db.prepare(`
      SELECT id, reward_coins, completed, claimed
      FROM challenges
      WHERE id = ?
    `).get(id) as { id: string; reward_coins: number; completed: number; claimed: number } | undefined;

    if (!ch || ch.completed !== 1 || ch.claimed === 1) {
      return { success: false, coins: this.getSettings().coins };
    }

    const claimTx = this.db.transaction(() => {
      this.db.prepare('UPDATE user_settings SET coins = coins + ? WHERE id = 1').run(ch.reward_coins);
      this.db.prepare('UPDATE challenges SET claimed = 1 WHERE id = ?').run(id);
    });

    claimTx();
    return { success: true, coins: this.getSettings().coins };
  }

  public resetCompletedChallenges(): FocusChallenge[] {
    this.db.prepare(`
      UPDATE challenges
      SET current_value = 0, completed = 0, claimed = 0
      WHERE completed = 1 OR claimed = 1
    `).run();
    return this.getChallenges();
  }

  public grantTestCoins(amount = 500): number {
    this.db.prepare('UPDATE user_settings SET coins = coins + ? WHERE id = 1').run(amount);
    return this.getSettings().coins;
  }

  public getDiagnostics(): SystemDiagnostics {
    const mem = process.memoryUsage();
    const sessionsCount = (this.db.prepare('SELECT COUNT(*) as count FROM focus_sessions').get() as { count: number }).count;
    const unlockedCount = (this.db.prepare('SELECT COUNT(*) as count FROM unlocked_items').get() as { count: number }).count;
    
    // SQLite cache size pragma returns negative value for KiB
    let sqliteCacheSizeKB = 2000;
    try {
      const pragmaVal = this.db.pragma('cache_size', { simple: true }) as number;
      sqliteCacheSizeKB = Math.abs(pragmaVal);
    } catch {
      // Fallback
    }

    return {
      mainHeapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      mainHeapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      mainRssMB: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      sqliteCacheSizeKB,
      totalSessionsCount: sessionsCount,
      unlockedCount,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  // --- Ambient Tracks Repository Methods ---
  public getAmbientTracks(): AmbientTrack[] {
    const rows = this.db.prepare(`
      SELECT id, title, category, url, is_custom
      FROM ambient_tracks
      ORDER BY is_custom ASC, category ASC, title ASC
    `).all() as Array<{
      id: string;
      title: string;
      category: 'nature' | 'youtube';
      url: string;
      is_custom: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      url: r.url,
      isCustom: Boolean(r.is_custom),
    }));
  }

  public addCustomAmbientTrack(title: string, url: string, category?: 'nature' | 'youtube'): AmbientTrack {
    const id = `ambient-custom-${randomUUID().slice(0, 8)}`;
    const cat: 'nature' | 'youtube' =
      category ||
      (url.includes('youtube.com') || url.includes('youtu.be')
        ? 'youtube'
        : 'nature');

    this.db.prepare(`
      INSERT INTO ambient_tracks (id, title, category, url, is_custom)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, title.trim(), cat, url.trim());

    return {
      id,
      title: title.trim(),
      category: cat,
      url: url.trim(),
      isCustom: true,
    };
  }

  public deleteAmbientTrack(id: string): boolean {
    const track = this.db.prepare('SELECT is_custom FROM ambient_tracks WHERE id = ?').get(id) as { is_custom: number } | undefined;
    if (!track || track.is_custom === 0) {
      return false; // Cannot delete built-in presets
    }

    const res = this.db.prepare('DELETE FROM ambient_tracks WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Aggregated Bootstrap Data ---
  public getBootstrapData(timerSnapshot?: TimerSnapshot): BootstrapData {
    const settings = this.getSettings();
    const { trees: unlockedTrees, lands: unlockedLands } = this.getUnlockedItemIds();

    const trees: TreeSpecies[] = INITIAL_TREES_CATALOG.map((tree) => ({
      ...tree,
      unlocked: unlockedTrees.has(tree.id) || tree.price === 0,
    }));

    const lands: LandStyle[] = INITIAL_LANDS_CATALOG.map((land) => ({
      ...land,
      unlocked: unlockedLands.has(land.id) || land.price === 0,
    }));

    const tags = this.getTags();
    const recentSessions = this.getRecentSessions(25);
    const challenges = this.getChallenges();
    const ambientTracks = this.getAmbientTracks();

    const timer: TimerSnapshot = timerSnapshot || {
      mode: 'countdown',
      status: 'idle',
      targetDurationSeconds: settings.defaultFocusMinutes * 60,
      elapsedSeconds: 0,
      remainingSeconds: settings.defaultFocusMinutes * 60,
      progress: 0,
      wasPaused: false,
      treeSpeciesId: settings.selectedTreeId,
      tagId: settings.selectedTagId,
      gracePeriodRemaining: 10,
      breakRemainingSeconds: 0,
    };

    return {
      settings,
      trees,
      lands,
      tags,
      recentSessions,
      challenges,
      ambientTracks,
      timer,
    };
  }

  public close(): void {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }
}
