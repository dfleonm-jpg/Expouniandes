// Generador de sonidos ambientales con la Web Audio API.
// No descarga archivos: sintetiza ruido filtrado (lluvia, olas, etc.)
// en el navegador. Ligero y sin dependencias.

export type SoundType = "rain" | "forest" | "waves" | "cafe" | "off";

export class AmbientSound {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private gain: GainNode | null = null;

  private ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
    }
    return this.ctx;
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        if ("stop" in n && typeof (n as OscillatorNode).stop === "function") (n as OscillatorNode).stop();
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
    this.gain?.disconnect();
    this.gain = null;
  }

  play(type: SoundType) {
    this.stop();
    if (type === "off") return;

    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
    this.gain = master;

    // Ruido base (buffer de ruido blanco en bucle).
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();

    switch (type) {
      case "rain":
        filter.type = "highpass";
        filter.frequency.value = 1000;
        break;
      case "forest":
        filter.type = "bandpass";
        filter.frequency.value = 700;
        filter.Q.value = 0.6;
        break;
      case "waves":
        filter.type = "lowpass";
        filter.frequency.value = 500;
        break;
      case "cafe":
        filter.type = "lowpass";
        filter.frequency.value = 900;
        break;
    }

    noise.connect(filter);
    filter.connect(master);
    noise.start();
    this.nodes.push(noise, filter);

    // Para "olas", modula el volumen lentamente (vaivén).
    if (type === "waves") {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      lfo.start();
      this.nodes.push(lfo, lfoGain);
    }

    // Fade in suave.
    const target = type === "cafe" ? 0.08 : 0.18;
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.5);
  }
}
