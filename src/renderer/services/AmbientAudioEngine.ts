/**
 * AmbientAudioEngine.ts
 *
 * Ultra-low memory, zero-asset Web Audio procedural nature soundscape synthesizer.
 * Eliminates large MP3/WAV file downloads and memory buffers.
 *
 * Conforms strictly to Rule 02:
 * - Single lazy AudioContext (only active when playing).
 * - Single 2-second recycled noise buffer (~350KB RAM).
 * - Disconnects all nodes and calls audioContext.suspend() on stop to drop idle CPU/RAM to 0.
 */

export class AmbientAudioEngine {
  private static instance: AmbientAudioEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeNodes: Array<AudioNode | AudioScheduledSourceNode> = [];
  private activeTimers: number[] = [];
  private currentPresetId: string | null = null;
  private currentVolume = 0.5;

  private constructor() {}

  public static getInstance(): AmbientAudioEngine {
    if (!AmbientAudioEngine.instance) {
      AmbientAudioEngine.instance = new AmbientAudioEngine();
    }
    return AmbientAudioEngine.instance;
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

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const sampleRate = ctx.sampleRate;
      const bufferSize = sampleRate * 2; // 2 seconds of reusable white noise
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  public getCurrentPreset(): string | null {
    return this.currentPresetId;
  }

  public isPlaying(): boolean {
    return this.currentPresetId !== null && this.ctx?.state === 'running';
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public stop(): void {
    // 1. Clear any scheduled timers
    for (const timer of this.activeTimers) {
      window.clearInterval(timer);
      window.clearTimeout(timer);
    }
    this.activeTimers = [];

    // 2. Stop and disconnect all active nodes
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Node might already be stopped
      }
    }
    this.activeNodes = [];

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignore
      }
      this.masterGain = null;
    }

    this.currentPresetId = null;

    // 3. Suspend context to reclaim all CPU audio thread cycles
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public playNature(presetId: string, volume = this.currentVolume): void {
    // Stop any existing soundscape cleanly
    this.stop();

    this.currentVolume = Math.max(0, Math.min(1, volume));
    const ctx = this.getAudioContext();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.currentVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;
    this.currentPresetId = presetId;

    const noiseBuffer = this.getNoiseBuffer(ctx);

    switch (presetId) {
      case 'ambient-rain':
      case 'nature://forest-rain':
      case 'nature://gentle-rain':
        this.buildForestRain(ctx, masterGain, noiseBuffer);
        break;

      case 'ambient-wind':
      case 'nature://wind-pines':
        this.buildWindInPines(ctx, masterGain, noiseBuffer);
        break;

      case 'ambient-campfire':
      case 'nature://cozy-campfire':
      case 'nature://campfire-crackle':
        this.buildCozyCampfire(ctx, masterGain, noiseBuffer);
        break;

      case 'ambient-waves':
      case 'nature://ocean-waves':
        this.buildOceanWaves(ctx, masterGain, noiseBuffer);
        break;

      case 'ambient-crickets':
      case 'nature://night-crickets':
      case 'nature://woodland-birds':
        this.buildNightCrickets(ctx, masterGain);
        break;

      case 'ambient-zen':
      case 'nature://deep-zen':
      default:
        this.buildDeepZenDrone(ctx, masterGain);
        break;
    }
  }

  // --- Soundscape Builders ---

  /**
   * 1. Forest Rain: Filtered noise body + occasional gentle droplet taps
   */
  private buildForestRain(ctx: AudioContext, dest: GainNode, noiseBuffer: AudioBuffer): void {
    // Rain background hiss
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    const rainHighpass = ctx.createBiquadFilter();
    rainHighpass.type = 'highpass';
    rainHighpass.frequency.setValueAtTime(220, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.45, ctx.currentTime);

    noiseSource.connect(rainFilter);
    rainFilter.connect(rainHighpass);
    rainHighpass.connect(rainGain);
    rainGain.connect(dest);

    noiseSource.start();
    this.activeNodes.push(noiseSource, rainFilter, rainHighpass, rainGain);

    // Subtle droplet pings (gentle random chirps)
    const dropTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const now = ctx.currentTime;
        const freq = 1200 + Math.random() * 800;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.06);

        dropGain.gain.setValueAtTime(0.08 * (0.6 + Math.random() * 0.4), now);
        dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(dropGain);
        dropGain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.07);
      } catch {
        // Safe ignore
      }
    }, 180);

    this.activeTimers.push(dropTimer);
  }

  /**
   * 2. Wind in the Pines: Deep noise modulated by slow LFO gusts
   */
  private buildWindInPines(ctx: AudioContext, dest: GainNode, noiseBuffer: AudioBuffer): void {
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.Q.setValueAtTime(3.2, ctx.currentTime);

    // LFO to sweep cutoff (wind gust effect)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(260, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.55, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(windGain);
    windGain.connect(dest);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, filter, lfo, lfoGain, windGain);
  }

  /**
   * 3. Cozy Campfire: Low warm rumble + crisp intermittent crackle pops
   */
  private buildCozyCampfire(ctx: AudioContext, dest: GainNode, noiseBuffer: AudioBuffer): void {
    // Base flame warmth rumble
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(140, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.4, ctx.currentTime);

    noiseSource.connect(lowFilter);
    lowFilter.connect(rumbleGain);
    rumbleGain.connect(dest);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lowFilter, rumbleGain);

    // Organic crackle impulses
    const crackleTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() > 0.45) {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const popGain = ctx.createGain();
          const popFilter = ctx.createBiquadFilter();

          popFilter.type = 'bandpass';
          popFilter.frequency.setValueAtTime(1800 + Math.random() * 2200, now);
          popFilter.Q.setValueAtTime(2.5, now);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120 + Math.random() * 250, now);

          popGain.gain.setValueAtTime(0.12 * Math.random(), now);
          popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

          osc.connect(popFilter);
          popFilter.connect(popGain);
          popGain.connect(dest);

          osc.start(now);
          osc.stop(now + 0.03);
        } catch {
          // Safe ignore
        }
      }
    }, 120);

    this.activeTimers.push(crackleTimer);
  }

  /**
   * 4. Ocean Waves: Swelling bandpass noise with rhythmic ebb & flow
   */
  private buildOceanWaves(ctx: AudioContext, dest: GainNode, noiseBuffer: AudioBuffer): void {
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(1.4, ctx.currentTime);

    // 12-second wave period LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.085, ctx.currentTime);

    const filterMod = ctx.createGain();
    filterMod.gain.setValueAtTime(220, ctx.currentTime);
    lfo.connect(filterMod);
    filterMod.connect(filter.frequency);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Gain swell
    const gainMod = ctx.createGain();
    gainMod.gain.setValueAtTime(0.25, ctx.currentTime);
    lfo.connect(gainMod);
    gainMod.connect(waveGain.gain);

    noiseSource.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(dest);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, filter, lfo, filterMod, waveGain, gainMod);
  }

  /**
   * 5. Night Crickets: Dual carrier oscillators + rapid stridulation cadence
   */
  private buildNightCrickets(ctx: AudioContext, dest: GainNode): void {
    // Carrier frequencies for authentic insect timbre
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(4350, ctx.currentTime);
    osc2.frequency.setValueAtTime(4650, ctx.currentTime);

    // Stridulation buzz modulator (~36Hz)
    const buzzLfo = ctx.createOscillator();
    buzzLfo.type = 'sine';
    buzzLfo.frequency.setValueAtTime(36, ctx.currentTime);

    const buzzGain = ctx.createGain();
    buzzGain.gain.setValueAtTime(0.5, ctx.currentTime);
    buzzLfo.connect(buzzGain);

    const cricketGain = ctx.createGain();
    cricketGain.gain.setValueAtTime(0.08, ctx.currentTime);

    // Connect carriers through cadence gain
    const mixer = ctx.createGain();
    mixer.gain.setValueAtTime(0.5, ctx.currentTime);
    osc1.connect(mixer);
    osc2.connect(mixer);

    mixer.connect(cricketGain);
    cricketGain.connect(dest);

    // Pulse rhythm (chirp bursts every 1.5s)
    const chirpTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const now = ctx.currentTime;
        cricketGain.gain.setValueAtTime(0.02, now);
        cricketGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
        cricketGain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      } catch {
        // Safe ignore
      }
    }, 1400);

    osc1.start();
    osc2.start();
    buzzLfo.start();
    this.activeTimers.push(chirpTimer);
    this.activeNodes.push(osc1, osc2, buzzLfo, buzzGain, mixer, cricketGain);
  }

  /**
   * 6. Deep Zen Drone: 4 harmonically tuned meditative sine waves with acoustic phasing
   */
  private buildDeepZenDrone(ctx: AudioContext, dest: GainNode): void {
    // 108Hz, 216Hz, 324Hz, 432Hz with slight detuning for natural binaural shimmer
    const harmonics = [
      { freq: 108, gain: 0.35, detune: 0 },
      { freq: 216.3, gain: 0.25, detune: 0.3 },
      { freq: 324.2, gain: 0.15, detune: -0.2 },
      { freq: 432, gain: 0.1, detune: 0.4 },
    ];

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, ctx.currentTime);
    filter.connect(dest);
    this.activeNodes.push(filter);

    for (const h of harmonics) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.freq + h.detune, ctx.currentTime);

      oscGain.gain.setValueAtTime(h.gain, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start();
      this.activeNodes.push(osc, oscGain);
    }
  }
}

export const ambientAudioEngine = AmbientAudioEngine.getInstance();
