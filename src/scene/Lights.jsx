/**
 * Luz fria de noite chuvosa. Os tons quentes (laranja) vêm das luzes dos
 * checkpoints e do brilho do skyline — o contraste azul/laranja da referência.
 */
export function Lights() {
  return (
    <>
      <ambientLight color="#4a64a8" intensity={1.1} />
      <hemisphereLight args={['#4a6cc0', '#1a0f08', 1.4]} />
      <directionalLight color="#9ab8ff" intensity={1.4} position={[-80, 120, -60]} />
    </>
  )
}
