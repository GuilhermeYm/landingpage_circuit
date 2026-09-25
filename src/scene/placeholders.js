import { CanvasTexture, RepeatWrapping, MirroredRepeatWrapping, SRGBColorSpace } from 'three'

/** gerador pseudo-aleatório determinístico: o placeholder é sempre igual */
function rng(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

function toTexture(canvas, wrap = RepeatWrapping) {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = wrap
  t.anisotropy = 8
  return t
}

/**
 * Skyline noturno genérico (azul em cima, brilho laranja no horizonte),
 * no lugar da foto de Tóquio até ela existir em /public/textures.
 * A base dos prédios fica em `horizon` (fração a partir de baixo).
 */
export function makeSkylineTexture(horizon = 0.28) {
  const W = 2048
  const H = 640
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const rand = rng(42)
  const base = H * (1 - horizon)

  const sky = g.createLinearGradient(0, 0, 0, base)
  sky.addColorStop(0, '#02040a')
  sky.addColorStop(0.55, '#0a1631')
  sky.addColorStop(0.85, '#2b2240')
  sky.addColorStop(1, '#a8522a')
  g.fillStyle = sky
  g.fillRect(0, 0, W, base)
  g.fillStyle = '#05070d'
  g.fillRect(0, base, W, H - base)

  // três camadas de prédios, do fundo para a frente
  const layers = [
    { color: '#10152a', min: 40, max: 140, win: 0.04 },
    { color: '#0a0e1d', min: 60, max: 220, win: 0.08 },
    { color: '#05070f', min: 30, max: 170, win: 0.12 },
  ]
  for (const layer of layers) {
    let x = -20
    while (x < W) {
      const w = 24 + rand() * 70
      const h = layer.min + rand() * (layer.max - layer.min)
      g.fillStyle = layer.color
      g.fillRect(x, base - h, w, h)
      for (let wy = base - h + 6; wy < base - 4; wy += 7) {
        for (let wx = x + 4; wx < x + w - 4; wx += 6) {
          if (rand() < layer.win) {
            g.fillStyle = rand() < 0.7 ? 'rgba(255,170,90,0.85)' : 'rgba(140,190,255,0.8)'
            g.fillRect(wx, wy, 2, 3)
          }
        }
      }
      x += w + rand() * 6
    }
  }

  // torre iluminada no centro (lembrando a Tokyo Tower)
  const cx = W / 2
  const top = base - 330
  g.strokeStyle = '#ff7a2e'
  g.lineWidth = 3
  g.shadowColor = '#ff8a3d'
  g.shadowBlur = 24
  g.beginPath()
  g.moveTo(cx - 70, base)
  g.lineTo(cx, top)
  g.lineTo(cx + 70, base)
  for (let i = 1; i < 9; i++) {
    const y = base - (i / 9) * (base - top)
    const half = 70 * (1 - i / 9)
    g.moveTo(cx - half, y)
    g.lineTo(cx + half, y)
  }
  g.moveTo(cx, top)
  g.lineTo(cx, top - 60)
  g.stroke()
  g.shadowBlur = 0

  // névoa de chuva sobre o horizonte
  const haze = g.createLinearGradient(0, base - 120, 0, base + 10)
  haze.addColorStop(0, 'rgba(120,150,210,0)')
  haze.addColorStop(1, 'rgba(120,150,210,0.18)')
  g.fillStyle = haze
  g.fillRect(0, base - 120, W, 130)

  return toTexture(c, MirroredRepeatWrapping)
}

/**
 * Asfalto molhado com faixas. Eixo X do canvas = largura da pista,
 * eixo Y = comprimento (repete ao longo do traçado).
 */
export function makeAsphaltTexture() {
  const W = 512
  const H = 1024
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const rand = rng(3)

  g.fillStyle = '#23262f'
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 9000; i++) {
    const l = 26 + rand() * 26
    g.fillStyle = `rgb(${l},${l + 2},${l + 8})`
    g.fillRect(rand() * W, rand() * H, 2, 2)
  }
  // poças com reflexo azul/laranja
  for (let i = 0; i < 10; i++) {
    const x = rand() * W
    const y = rand() * H
    const r = 30 + rand() * 80
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    const warm = rand() < 0.4
    grad.addColorStop(0, warm ? 'rgba(255,140,60,0.10)' : 'rgba(90,140,255,0.10)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // bordas contínuas
  g.fillStyle = 'rgba(235,238,245,0.85)'
  g.fillRect(W * 0.04, 0, W * 0.02, H)
  g.fillRect(W * 0.94, 0, W * 0.02, H)
  // faixa central tracejada
  g.fillStyle = 'rgba(255,170,70,0.8)'
  g.fillRect(W * 0.49, 0, W * 0.02, H * 0.45)

  return toTexture(c)
}
