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
    /** posição x (0‑1) da torre na imagem — as nuvens balançam, ela não */
    towerX: 0.645,
  },

  /**
   * Textura da pista: UMA curva de 90° vista de cima (Meshy), entrando pela
   * borda esquerda e saindo pela de baixo. As faixas brancas das bordas são
   * detectadas sozinhas e a faixa da imagem é "desenrolada" ao longo do
   * traçado inteiro: o meio de cada curva da pista mostra o meio da curva da
   * imagem, e as retas continuam o mesmo asfalto espelhado.
   */
  track: {
    url: '/textures/track-curve.webp',
    /** acostamento visível além das faixas, em fração da largura da pista */
    shoulder: 0.15,
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
