// Web Audio API Synthesizer for Tracer Pipeline Village
// Fully offline, zero external audio asset dependencies

class SoundFX {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setMuted(isMuted) {
    this.muted = isMuted
  }

  // Siren when fire starts
  playSiren() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    
    const now = this.ctx.currentTime
    osc.frequency.setValueAtTime(650, now)
    osc.frequency.linearRampToValueAtTime(950, now + 0.25)
    osc.frequency.linearRampToValueAtTime(650, now + 0.5)
    osc.frequency.linearRampToValueAtTime(950, now + 0.75)
    osc.frequency.linearRampToValueAtTime(650, now + 1.0)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 1.1)
  }

  // Water spray extinguisher sound (synthesized noise)
  playExtinguisher() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const bufferSize = this.ctx.sampleRate * 1.2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 1.8

    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    noise.start(now)
    noise.stop(now + 1.2)
  }

  // Radio call for backup
  playRadioChirp() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    const now = this.ctx.currentTime

    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.setValueAtTime(1800, now + 0.08)
    osc.frequency.setValueAtTime(2200, now + 0.16)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  }

  // Victory chime when fire extinguished and verified
  playVictoryChime() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const startTime = this.ctx.currentTime + idx * 0.09
      gain.gain.setValueAtTime(0.18, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.6)
    })
  }

  // Paper airplane swoosh
  playPaperPlane() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    const now = this.ctx.currentTime

    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4)
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.8)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.85)
  }
}

export const soundEffects = new SoundFX()
