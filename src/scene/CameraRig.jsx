import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { gsap } from '../lib/gsap'
import { DRIVING } from '../config/track'
import { useExperience } from '../store/useExperience'
import { CHECKPOINT_POINTS } from './track'
import { vehicle } from './vehicleState'

const UP = new Vector3(0, 1, 0)
const tmp = new Vector3()

/**
 * Três "planos" de câmera misturados por pesos animados com GSAP:
 *  - overview: órbita alta e lenta (loading / tela de entrada)
 *  - chase: atrás do carro, com FOV que abre com a velocidade
 *  - focus: plano cinematográfico no marcador do checkpoint aberto
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const mix = useRef({ intro: 0, focus: 0 }).current
  const chasePos = useRef(new Vector3(0, 60, 200)).current
  const chaseLook = useRef(new Vector3()).current
  const focusPos = useRef(new Vector3()).current
  const focusLook = useRef(new Vector3()).current
  const look = useRef(new Vector3()).current

  // intro: voo da órbita até a traseira do carro
  useEffect(
    () =>
      useExperience.subscribe((s, prev) => {
        if (s.phase === 'intro' && prev.phase !== 'intro') {
          gsap.to(mix, {
            intro: 1,
            duration: 3.4,
            ease: 'power3.inOut',
            onComplete: () => useExperience.getState().setPhase('drive'),
          })
        }
        if (s.openId !== prev.openId) {
          const cp = CHECKPOINT_POINTS.find((c) => c.id === s.openId)
          if (cp) {
            focusPos.copy(cp.marker).addScaledVector(cp.outward, 16).addScaledVector(cp.tangent, -14).addScaledVector(UP, 7)
            focusLook.copy(cp.center).addScaledVector(UP, 2)
          }
          gsap.to(mix, { focus: cp ? 1 : 0, duration: 1.6, ease: 'power2.inOut', overwrite: 'auto' })
        }
      }),
    [mix, focusPos, focusLook],
  )

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const t = clock.elapsedTime
    const speedRatio = Math.abs(vehicle.speed) / DRIVING.maxSpeed

    // chase (sempre atualizado, para a transição da intro ser contínua)
    const f = vehicle.forward
    tmp.copy(vehicle.position).addScaledVector(f, -9 - speedRatio * 2).addScaledVector(UP, 3.6)
    chasePos.x = MathUtils.damp(chasePos.x, tmp.x, 5, dt)
    chasePos.y = MathUtils.damp(chasePos.y, tmp.y, 5, dt)
    chasePos.z = MathUtils.damp(chasePos.z, tmp.z, 5, dt)
    tmp.copy(vehicle.position).addScaledVector(f, 6).addScaledVector(UP, 2.4)
    chaseLook.lerp(tmp, 1 - Math.exp(-10 * dt))

    // overview
    const a = t * 0.05
    const ox = Math.cos(a) * 200
    const oz = Math.sin(a) * 200

    // mistura: overview → chase → focus
    const i = mix.intro
    camera.position.set(
      MathUtils.lerp(ox, chasePos.x, i),
      MathUtils.lerp(120, chasePos.y, i),
      MathUtils.lerp(oz, chasePos.z, i),
    )
    look.set(0, 0, 0).lerp(chaseLook, i)
    camera.position.lerp(focusPos, mix.focus)
    look.lerp(focusLook, mix.focus)

    // tremidinha sutil em alta velocidade
    const shake = speedRatio * speedRatio * 0.05 * (1 - mix.focus)
    camera.position.x += Math.sin(t * 37) * shake
    camera.position.y += Math.sin(t * 29) * shake

    camera.lookAt(look)
    camera.fov = MathUtils.lerp(48, 50 + speedRatio * 16, i * (1 - mix.focus))
    camera.updateProjectionMatrix()
  })

  return null
}
