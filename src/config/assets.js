/**
 * Caminhos dos assets em /public.
 *
 * Tudo aqui é OPCIONAL: se o arquivo não existir, a cena usa um placeholder
 * procedural. Para trocar pelo asset real basta soltar o arquivo com o mesmo
 * nome em /public (ou ajustar o caminho abaixo) — nenhum código precisa mudar.
 */
export const ASSETS = {
  /** Skyline de Tóquio (fundo distante). Envolve a cena num cilindro. */
  skyline: {
    url: '/textures/tokyo-skyline.jpg',
    /** quantas vezes a imagem se repete nos 360° (espelhada, para não ter emenda) */
    repeat: 2,
    /** fração da altura da imagem (de baixo p/ cima) onde fica a base dos prédios */
    horizon: 0.28,
    /** cor do céu acima da imagem (use a cor do topo da foto) */
    skyColor: '#02040a',
  },

  /** Textura reta de asfalto, tileável ao longo da pista. */
  trackStraight: {
    url: '/textures/asphalt-straight.jpg',
    /** quantas unidades de mundo cada repetição da textura cobre ao longo da pista */
    tileLength: 20,
  },

  /** Carro low-poly (.glb). O modelo deve "olhar" para +Z; ajuste abaixo se não. */
  car: {
    url: '/models/car.glb',
    scale: 1,
    rotationY: 0,
    offsetY: 0,
  },

  /** Som ambiente (loop). Sem arquivo, é gerado um som de chuva procedural. */
  ambientAudio: '/audio/ambient.mp3',
}
