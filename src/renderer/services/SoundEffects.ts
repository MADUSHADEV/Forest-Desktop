/**
 * SoundEffects.ts
 *
 * Ultra-lightweight Web Audio procedural chime synthesizer for Forest timer transitions.
 * Conforms strictly to Rule 02: Zero audio files, zero buffer bloat, and automatic node teardown.
 */

class SoundEffectsService {
  private static instance: SoundEffectsService | null = null;
  private ctx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): SoundEffectsService {
    if (!SoundEffectsService.instance) {
      SoundEffectsService.instance = new SoundEffectsService();
    }
    return SoundEffectsService.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume error:', err));
    }
    return this.ctx;
  }

  /**
   * Break Start Alarm: Warm, peaceful 3-tone Zen meditation chime (C5 -> E5 -> G5)
   * Signals that the focus session has concluded and a relaxing break has started.
   */
  public playBreakStartAlarm(masterVolume = 0.6): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const vol = Math.max(0.1, Math.min(1.0, masterVolume));

      // 3 melodic bell notes with slight delays: C5, E5, G5
      const notes = [
        { freq: 523.25, time: 0.0, duration: 2.2 },  // C5
        { freq: 659.25, time: 0.16, duration: 2.4 }, // E5
        { freq: 783.99, time: 0.32, duration: 2.6 }, // G5
      ];

      for (const note of notes) {
        const startTime = now + note.time;

        // Fundamental tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime);

        // Overtone harmonic for warm bell timbre
        const overtone = ctx.createOscillator();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(note.freq * 2, startTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25 * vol, startTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0.0001, startTime);
        overtoneGain.gain.linearRampToValueAtTime(0.08 * vol, startTime + 0.03);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (note.duration * 0.7));

        osc.connect(gainNode);
        overtone.connect(overtoneGain);
        gainNode.connect(ctx.destination);
        overtoneGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.duration + 0.05);

        overtone.start(startTime);
        overtone.stop(startTime + note.duration + 0.05);

        // Cleanup nodes after playing
        osc.onended = () => {
          try {
            osc.disconnect();
            gainNode.disconnect();
          } catch {
            // Safe ignore
          }
        };
        overtone.onended = () => {
          try {
            overtone.disconnect();
            overtoneGain.disconnect();
          } catch {
            // Safe ignore
          }
        };
      }
    } catch (err) {
      console.warn('Failed to synthesize break start alarm:', err);
    }
  }

  /**
   * Break End Alarm: Bright, uplifting 4-tone alert chime (E5 -> G5 -> B5 -> E6)
   * Signals that the break has concluded and it is time to resume focus.
   */
  public playBreakEndAlarm(masterVolume = 0.6): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const vol = Math.max(0.1, Math.min(1.0, masterVolume));

      // 4 ascending energizing chime notes: E5, G5, B5, E6
      const notes = [
        { freq: 659.25, time: 0.0, duration: 0.6 },   // E5
        { freq: 783.99, time: 0.14, duration: 0.7 },  // G5
        { freq: 987.77, time: 0.28, duration: 0.9 },  // B5
        { freq: 1318.51, time: 0.42, duration: 1.6 }, // E6 (resolving high chime)
      ];

      for (const note of notes) {
        const startTime = now + note.time;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime);

        // Gentle harmonic sparkle
        const sparkle = ctx.createOscillator();
        sparkle.type = 'triangle';
        sparkle.frequency.setValueAtTime(note.freq * 1.5, startTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.28 * vol, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

        const sparkleGain = ctx.createGain();
        sparkleGain.gain.setValueAtTime(0.0001, startTime);
        sparkleGain.gain.linearRampToValueAtTime(0.06 * vol, startTime + 0.02);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (note.duration * 0.5));

        osc.connect(gainNode);
        sparkle.connect(sparkleGain);
        gainNode.connect(ctx.destination);
        sparkleGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.duration + 0.05);

        sparkle.start(startTime);
        sparkle.stop(startTime + note.duration + 0.05);

        osc.onended = () => {
          try {
            osc.disconnect();
            gainNode.disconnect();
          } catch {
            // Safe ignore
          }
        };
        sparkle.onended = () => {
          try {
            sparkle.disconnect();
            sparkleGain.disconnect();
          } catch {
            // Safe ignore
          }
        };
      }
    } catch (err) {
      console.warn('Failed to synthesize break end alarm:', err);
    }
  }
}

export const soundEffects = SoundEffectsService.getInstance();
