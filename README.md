# Night Circuit

Landing page cinematográfica em 3D que documenta a própria construção: um carro
percorre uma pista noturna em Tóquio e cada curva é uma etapa do processo.

**Stack:** Vite + React · Three.js via React Three Fiber (+ drei) · GSAP · Tailwind v4 · Zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Controles

| Tecla | Ação |
| --- | --- |
| `W` / `↑` | acelera |
| `S` / `↓` | freia / ré |
| `A` `D` / `←` `→` | direção |
| `Espaço` | freio de mão (derrapa) |
| `E` / `Enter` | abre o checkpoint próximo |
| `Esc` | fecha o painel |

## Estrutura

```
public/
  textures/   skyline, asfalto, decalques de curva
  models/     car.glb
  audio/      ambient.mp3 (opcional)
src/
  config/     ← o que você edita: assets, traçado, física, textos dos checkpoints
  scene/      Canvas, luzes, skyline, chão, pista, carro, câmera, chuva
  components/ UI em HTML: loading, HUD, painel do checkpoint, botão de som
  store/      estado da experiência (zustand)
  lib/        gsap, áudio, carregamento opcional de assets
```

## Assets

Todos são opcionais — sem o arquivo, a cena usa um placeholder procedural.
Basta soltar em `public/` com estes nomes (ou mudar em `src/config/assets.js`):

| Arquivo | Uso |
| --- | --- |
| `textures/tokyo-skyline.webp` | fundo 360° (cilindro). Ajuste `repeat`, `horizon`, `haze` e `tint` |
| `textures/asphalt-straight.jpg` | asfalto reto, repete ao longo da pista |
| `textures/curve-XX.jpg` | curva do Meshy — ative com `decal` no checkpoint |
| `models/car.glb` | carro low-poly, frente para +Z |
| `audio/ambient.mp3` | trilha em loop; sem ela, toca chuva sintetizada |

## Como funciona

- **Pista** (`scene/track.js`): o polígono de `config/track.js` vira uma
  Catmull-Rom fechada com cantos arredondados; a malha é uma fita gerada ao
  longo dela.
- **Carro** (`scene/Vehicle.jsx`): preso ao traçado. Estado = posição `u`
  (0‑1), velocidade, deslocamento lateral. Aceleração/arrasto, força centrífuga
  proporcional a curvatura × v², e aderência lateral (menor no freio de mão).
- **Câmera** (`scene/CameraRig.jsx`): mistura órbita → perseguição → plano do
  checkpoint, com os pesos animados por GSAP.
- **Checkpoints**: cada item de `config/checkpoints.js` aponta para um canto
  da pista (`corner`). Chegar perto destaca; `E` ou clique expande o painel.
