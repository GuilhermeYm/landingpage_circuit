/**
 * Pontos ao longo da pista. Cada um fica numa curva (`corner` = índice em
 * TRACK.corners) e documenta uma etapa da construção deste site.
 *
 * Os textos são rascunhos — substitua à vontade.
 */
export const CHECKPOINTS = [
  {
    id: 'referencia',
    corner: 0,
    title: 'Referência',
    kicker: 'Onde tudo começou',
    body: [
      'O ponto de partida foi o mirtilo.co/gp: um portfólio em que um carro percorre uma pista e cada curva guarda um projeto.',
      'A ideia aqui é inverter o jogo — em vez de projetos, cada curva conta uma etapa de como esta própria página foi construída.',
    ],
  },
  {
    id: 'stack',
    corner: 1,
    title: 'Stack',
    kicker: 'Leve e direto',
    body: [
      'Vite + React para o esqueleto, React Three Fiber para a cena Three.js, GSAP para as transições de câmera e de interface, Tailwind para o texto por cima.',
      'Sem framework de servidor: é uma página única, estática, que carrega rápido.',
    ],
  },
  {
    id: 'cena',
    corner: 2,
    title: 'Cena base',
    kicker: 'Luz fria, chuva e neblina',
    body: [
      'Câmera, luz ambiente azulada, neblina exponencial e um cilindro gigante com o skyline de Tóquio ao fundo — ele não sofre neblina, então parece infinitamente distante.',
      'O chão é um espelho borrado que imita asfalto molhado.',
    ],
  },
  {
    id: 'pista',
    corner: 3,
    title: 'A pista',
    kicker: 'Uma curva, muitas curvas',
    body: [
      'O traçado é um polígono cujos cantos viram curvas suaves (Catmull‑Rom). A malha da pista é gerada ao longo dessa curva, com UVs contínuos.',
      'A textura é uma única curva gerada no Meshy, "desenrolada" ao longo do traçado: o meio de cada curva da pista mostra o meio da curva da imagem.',
    ],
  },
  {
    id: 'direcao',
    corner: 4,
    title: 'Direção',
    kicker: 'Física de mentira, sensação de verdade',
    body: [
      'O carro anda preso à pista: velocidade ao longo do trajeto, deslocamento lateral e uma força centrífuga simples nas curvas.',
      'O drift é um estado à parte: Espaço (ou freada forte) + direção joga a traseira para fora; acelerar mantém o ângulo, contraesterço endireita. Fumaça, marcas no asfalto, som de pneu e placar vêm do mesmo estado.',
    ],
  },
  {
    id: 'interface',
    corner: 5,
    title: 'Interface',
    kicker: 'O que fica por cima',
    body: [
      'Tela de loading com porcentagem real, som ambiente ligável, marcadores clicáveis e estes painéis — tudo em HTML sobre o canvas.',
      'Próximos passos: assets finais, pós‑processamento e versão mobile.',
    ],
  },
]
