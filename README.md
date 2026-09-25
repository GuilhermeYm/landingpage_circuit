# Night Circuit

Landing page cinematográfica em 3D que documenta a própria construção. Um carro
percorre uma pista noturna e chuvosa em Tóquio, e cada curva é uma etapa do
processo: chegue perto e abra o painel para ler como aquela parte foi feita.

**Ao vivo:** https://landingpage-five-dun.vercel.app

**Stack:** Vite · React 19 · Three.js via React Three Fiber (+ drei) · GSAP · Tailwind v4 · Zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build
```

## O que tem na cena

- **Tela de carregamento** com porcentagem, e entrada com ou sem som.
- **Intro de câmera**: a cena abre com uma visão aérea da pista e desce até o carro.
- **Skyline de Tóquio** num cilindro 360°. Ganha desfoque com a velocidade, arrasta nas curvas, tem nuvens em movimento e brilho em volta das luzes.
- **Clima**: chuva, neblina, chão molhado com reflexo e **raios** com clarão e trovão.
- **Pista** com a textura de uma única curva "desenrolada" ao longo de todo o traçado.
- **Direção** com aceleração, freio, ré e força centrífuga nas curvas.
- **Drift** com ângulo controlável, fumaça, marcas de pneu, câmera dinâmica e placar com multiplicador.
- **6 checkpoints** que explicam como o site foi feito.
- **Som** 100% sintetizado: chuva, motor, pneu cantando e trovão.

## Controles

| Tecla | Ação |
| --- | --- |
| `W` / `↑` | acelera |
| `S` / `↓` | freia / ré |
| `A` `D` / `←` `→` | direção |
| `Espaço` + direção | inicia o drift |
| `E` / `Enter` | abre o checkpoint próximo |
| `Esc` | fecha o painel |

Clicar num marcador de checkpoint também abre o painel.

### Drift

1. Passe de uns 85 km/h e segure `Espaço` + `A`/`D`. Frear forte (`S`) virando para dentro da curva também funciona.
2. Segure `W` para manter o carro de lado. Virar para o mesmo lado aumenta o ângulo.
3. Contraesterce, ou tire o pé do acelerador, para endireitar e fechar o drift.

Os pontos crescem com ângulo × velocidade, e o multiplicador sobe a cada 1,5 s, até ×5. Se bater na borda durante o drift, você perde os pontos dele.

## Estrutura

```
public/
  textures/    tokyo-skyline.webp, track-curve.webp
  models/      car.glb        (opcional)
  audio/       ambient.mp3    (opcional)
src/
  config/      ← o que você edita: assets, traçado, física, textos dos checkpoints
  scene/       tudo que roda dentro do <Canvas>
  components/  UI em HTML: loading, HUD, placar de drift, painel, botão de som
  store/       estado da experiência (zustand)
  lib/         gsap, áudio, carregamento opcional de assets
```

| Arquivo | O que faz |
| --- | --- |
| `scene/Experience.jsx` | Canvas, tone mapping e neblina; monta a cena |
| `scene/track.js` | curva do traçado e utilitários (frame, curvatura, ponto mais próximo) |
| `scene/trackUV.js` | detecta as faixas da textura da curva e calcula o mapeamento na pista |
| `scene/Track.jsx` | malha da pista (fita ao longo da curva) |
| `scene/Skyline.jsx` | cilindro do skyline com shader (blur, rastro, brilho, clarão) |
| `scene/atmosphere.js` | agenda dos relâmpagos (`flash`, `strike`, `age`) |
| `scene/Lightning.jsx` | desenho do raio, halo nas nuvens e disparo do trovão |
| `scene/Rain.jsx` · `Ground.jsx` · `Lights.jsx` | chuva, chão espelhado, luzes |
| `scene/Vehicle.jsx` | física do carro e do drift, som do motor, checkpoints próximos |
| `scene/vehicleState.js` | estado mutável do carro e do drift (lido sem re-render) |
| `scene/DriftEffects.jsx` | marcas de pneu e fumaça |
| `scene/Car.jsx` | modelo GLB ou carro placeholder |
| `scene/CameraRig.jsx` | câmera: visão aérea → perseguição → checkpoint |
| `scene/Checkpoints.jsx` | marcadores clicáveis nas curvas |
| `lib/audio.js` | Web Audio: chuva, motor, pneu e trovão |

## Configuração

| Arquivo | O que ajustar |
| --- | --- |
| `config/assets.js` | caminhos dos assets; `repeat`, `horizon`, `tint` e `haze` do skyline |
| `config/track.js` | `TRACK`: cantos, raio das curvas, largura. `DRIVING`: velocidade, freio, aderência e todos os parâmetros do drift |
| `config/checkpoints.js` | título e textos de cada curva (`corner` é o índice do canto da pista) |

## Assets

Todos são opcionais: se um arquivo faltar, a cena usa um placeholder procedural.
Basta colocar o arquivo em `public/` com estes nomes, ou mudar os caminhos em `src/config/assets.js`.

| Arquivo | Uso |
| --- | --- |
| `textures/tokyo-skyline.webp` | fundo 360°. A altura sai da proporção da imagem |
| `textures/track-curve.webp` | uma curva de 90° vista de cima; as faixas são detectadas automaticamente |
| `models/car.glb` | carro low-poly com a frente para +Z (ajuste `scale`/`rotationY`) |
| `audio/ambient.mp3` | trilha em loop; sem ela toca a chuva sintetizada |

Hoje o repositório não tem `car.glb` nem `ambient.mp3`. Por isso o console mostra dois 404, que não fazem mal.

## Como funciona

- **Pista.** O polígono de `config/track.js` vira uma Catmull-Rom fechada com cantos arredondados, e a malha é uma fita gerada ao longo dela.
- **Textura da pista.** A imagem é de uma curva só e não repete. `trackUV.js` lança raios a partir do canto da imagem para achar as faixas brancas e mede o comprimento da curva. A textura então vai e volta ao longo da pista, com o meio da curva da imagem caindo no ápice de cada curva real.
- **Carro.** Fica preso ao traçado. O estado é a posição `u` (0‑1), a velocidade e o deslocamento lateral, com aceleração, arrasto, força centrífuga (curvatura × v²) e aderência lateral.
- **Drift.** É uma máquina de estados à parte. O ângulo da carroceria persegue um alvo definido pelo acelerador e pela direção. Durante o drift a aderência cai, o carro escorrega para fora da curva e o ângulo freia o carro. Fumaça (partículas) e marcas de pneu (um buffer circular de quads) saem das rodas traseiras.
- **Skyline.** Um shader próprio aplica blur de disco de Poisson proporcional à velocidade, rastro horizontal quando a câmera gira, um bloom falso nas luzes e nuvens se mexendo longe da torre.
- **Raios.** A cada 7–18 s, `atmosphere.js` dispara um relâmpago: dois ou três pulsos que clareiam o céu e as luzes. Nesse momento `Lightning.jsx` gera um raio novo, uma linha quebrada com galhos criada por deslocamento do ponto médio. O raio aparece na direção para onde a câmera olha, "desce" em 60 ms e é desenhado com brilho aditivo, sem neblina, então o chão molhado reflete. Com som ligado, o trovão (ruído marrom filtrado) chega entre 0,7 e 1,9 s depois.
- **Câmera.** Mistura órbita, perseguição e plano do checkpoint, com os pesos animados por GSAP. No drift ela gira para mostrar a lateral do carro e abre o FOV.
- **Estado.** O que muda a cada frame (carro, drift, clima) fica em objetos mutáveis fora do React, e só a UI usa Zustand. Assim não há re-render a cada frame.

## Deploy

O projeto está ligado à Vercel pelo Git: cada push na branch de produção gera um deploy novo.
É um site estático do Vite (`npm run build` → `dist/`), então também funciona em qualquer host de arquivos estáticos.

## Limitações conhecidas

- Não tem controle por toque: no celular dá para ver a cena e abrir os checkpoints, mas não dirigir.
- Na única curva para a direita, as cores da textura da curva aparecem espelhadas.
