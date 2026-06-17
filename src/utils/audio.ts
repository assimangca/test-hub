// Sound effects synthesizer using Web Audio API

class AudioSynth {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  toggle(state?: boolean) {
    this.enabled = state !== undefined ? state : !this.enabled;
    if (this.enabled) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private createOscillator(
    type: OscillatorType,
    freqs: number[],
    durations: number[],
    vol: number,
    pitchSustain: boolean = false
  ) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      // Try to resume on action
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Initial volume
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(vol, now + 0.01);

    let currTime = now;
    freqs.forEach((freq, idx) => {
      const dur = durations[idx] || 0.1;
      if (idx === 0) {
        osc.frequency.setValueAtTime(freq, now);
      } else {
        if (pitchSustain) {
          osc.frequency.exponentialRampToValueAtTime(freq, currTime + dur);
        } else {
          osc.frequency.setValueAtTime(freq, currTime);
        }
      }
      currTime += dur;
    });

    // Fade out
    gainNode.gain.setValueAtTime(vol, currTime - 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, currTime);

    osc.start(now);
    osc.stop(currTime);
  }

  playJump() {
    // Vintage bounce slide: pitch slides 150 -> 400Hz
    this.createOscillator('triangle', [150, 400], [0.15], 0.15, true);
  }

  playCoin() {
    // Twin chime: Bb5 (932Hz) for 0.07s then D6 (1174Hz) for 0.15s
    this.createOscillator('sine', [932, 1174], [0.06, 0.15], 0.12, false);
  }

  playBounce() {
    // Heavy spring: slide 100 -> 350 -> 180Hz
    this.createOscillator('triangle', [100, 350, 180], [0.08, 0.08], 0.20, true);
  }

  playDeath() {
    // Declining rumble buzzer
    this.createOscillator('sawtooth', [220, 110, 55], [0.1, 0.15, 0.2], 0.15, true);
  }

  playWin() {
    // Ascending arpeggio fanfare: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    this.createOscillator('square', [523, 659, 784, 1046], [0.08, 0.08, 0.08, 0.25], 0.07, false);
  }

  playLevelUp() {
    // Quick success scale
    this.createOscillator('sine', [440, 554, 659, 880], [0.06, 0.06, 0.06, 0.2], 0.1, false);
  }
}

export const sfx = new AudioSynth();
