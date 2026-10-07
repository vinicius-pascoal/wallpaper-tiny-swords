(function () {
  class AudioReactiveSystem {
    constructor(onBeat) {
      this.values = { bass: 0, mid: 0, treble: 0, overallEnergy: 0, beat: 0, bpm: 0 };
      this.smooth = { bass: 0, mid: 0, treble: 0, overallEnergy: 0 };
      this.onBeat = onBeat;
      this.lastBeat = 0;
      this.cooldown = 300;
      this.decay = 0;
    }

    update(fft) {
      if (!fft || !fft.length || !WORLD_CONFIG.audioReactive) return;
      const average = (from, to) => {
        let sum = 0;
        const end = Math.min(fft.length, to);
        for (let i = from; i < end; i++) sum += Math.max(0, Math.min(1, fft[i] || 0));
        return end > from ? sum / (end - from) : 0;
      };
      const bass = average(0, Math.min(8, fft.length));
      const mid = average(8, Math.max(9, Math.floor(fft.length * .28)));
      const treble = average(Math.floor(fft.length * .28), Math.floor(fft.length * .72));
      const overall = average(0, fft.length);
      const lerp = (name, value) => this.smooth[name] = this.smooth[name] * .8 + value * .2;
      this.values.bass = lerp('bass', bass);
      this.values.mid = lerp('mid', mid);
      this.values.treble = lerp('treble', treble);
      this.values.overallEnergy = lerp('overallEnergy', overall);
      const threshold = .115 / Math.max(.2, WORLD_CONFIG.audioSensitivity);
      const now = performance.now();
      if (this.values.bass > threshold && now - this.lastBeat > this.cooldown) {
        if (this.lastBeat) {
          const bpm = Math.round(60000 / (now - this.lastBeat));
          if (bpm >= 60 && bpm <= 200) this.values.bpm = bpm;
        }
        this.lastBeat = now;
        this.decay = 1;
        this.onBeat(this.values);
      }
    }

    tick(delta) {
      this.decay = Math.max(0, this.decay - delta / 260);
      this.values.beat = this.decay;
      return this.values;
    }
  }

  window.AudioReactiveSystem = AudioReactiveSystem;
})();
