import { ASSETS } from '../config/assets'

/**
 * Som ambiente via Web Audio. Só pode começar depois de um clique do usuário
 * (política de autoplay dos navegadores) — por isso a tela de entrada.
 *
 * Sem /audio/ambient.mp3, toca uma chuva procedural (ruído filtrado).
 * O motor é um oscilador cuja frequência acompanha a velocidade.
 */
let ctx = null
let master = null
let engine = null
let screech = null

function noiseBuffer(seconds = 3) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function loopSource(buffer, ...chain) {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  ;[src, ...chain].reduce((a, b) => (a.connect(b), b)).connect(master)
  src.start()
  return src
}

function start() {
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // chuva: ruído branco entre 500 Hz e 7 kHz
  const hp = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 500 })
  const lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 7000 })
  const rain = new GainNode(ctx, { gain: 0.18 })
  loopSource(noiseBuffer(), hp, lp, rain)

  // motor
  const osc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 40 })
  const oscLp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 300 })
  const oscGain = new GainNode(ctx, { gain: 0 })
  osc.connect(oscLp).connect(oscGain).connect(master)
  osc.start()
  engine = { osc, filter: oscLp, gain: oscGain }

  // pneu cantando: ruído em banda estreita, com um leve "tremido"
  const band = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1900, Q: 6 })
  const band2 = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 3100, Q: 8 })
  const screechGain = new GainNode(ctx, { gain: 0 })
  const noise = noiseBuffer(2)
  loopSource(noise, band, screechGain)
  const src2 = ctx.createBufferSource()
  src2.buffer = noise
  src2.loop = true
  src2.connect(band2).connect(screechGain)
  src2.start(0, 0.7)
  const wobble = new OscillatorNode(ctx, { frequency: 9 })
  const wobbleDepth = new GainNode(ctx, { gain: 120 })
  wobble.connect(wobbleDepth).connect(band.frequency)
  wobble.start()
  screech = { gain: screechGain, band }

  // trilha opcional
  fetch(ASSETS.ambientAudio)
    .then((r) => (r.ok && r.headers.get('content-type')?.startsWith('audio') ? r.arrayBuffer() : null))
    .then((data) => data && ctx.decodeAudioData(data))
    .then((buffer) => {
      if (!buffer) return
      rain.gain.value = 0.06
      loopSource(buffer, new GainNode(ctx, { gain: 0.7 }))
    })
    .catch(() => {})
}

export function setAudioEnabled(on) {
  if (on && !ctx) start()
  if (!ctx) return
  if (on) ctx.resume()
  master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.4)
}

/**
 * ratio: 0 (parado) a 1 (velocidade máxima)
 * slip: 0‑1, no drift as rodas giram em falso e o giro sobe
 */
export function setEngine(ratio, slip = 0) {
  if (!engine || ctx.state !== 'running') return
  const now = ctx.currentTime
  ratio = Math.min(1, ratio + slip * 0.25)
  engine.osc.frequency.setTargetAtTime(38 + ratio * 110, now, 0.1)
  engine.filter.frequency.setTargetAtTime(220 + ratio * 900, now, 0.1)
  engine.gain.gain.setTargetAtTime(0.03 + ratio * 0.07, now, 0.1)
}

/** intensity: 0‑1, volume do pneu cantando */
export function setDriftSound(intensity) {
  if (!screech || ctx.state !== 'running') return
  const now = ctx.currentTime
  screech.gain.gain.setTargetAtTime(intensity * 0.16, now, 0.06)
  screech.band.frequency.setTargetAtTime(1700 + intensity * 500, now, 0.1)
}
