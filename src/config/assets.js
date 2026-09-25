/**
 * Caminhos dos assets em /public.
 *
 * Tudo aqui é OPCIONAL: se o arquivo não existir, a cena usa um placeholder
 * procedural. Para trocar pelo asset real basta soltar o arquivo com o mesmo
 * nome em /public (ou ajustar o caminho abaixo) — nenhum código precisa mudar.
 */
export const ASSETS = {
  /**
   * Skyline de Tóquio (fundo distante). Envolve a cena num cilindro; a altura
   * sai da proporção da imagem, então ela nunca fica esticada.
   */
  skyline: {
    url: '/textures/tokyo-skyline.webp',
    /**
     * quantas vezes a imagem se repete nos 360° (espelhada). 3 = torres a 120°
     * uma da outra, então nunca aparecem duas na tela ao mesmo tempo.
     */
    repeat: 3,
    /** fração da altura da imagem (de baixo p/ cima) que fica rente ao chão */
    horizon: 0.47,
    /** cor do céu acima da imagem (a cor do topo da foto × tint) */
    skyColor: '#141b2e',
    /** multiplica a cor da imagem (escurecer / puxar para o azul) */
    tint: '#d6dcf0',
    /** altura (m) da névoa que dissolve a base da cidade no chão */
    haze: 40,
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
