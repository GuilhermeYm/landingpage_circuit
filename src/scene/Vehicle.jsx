import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { MathUtils } from 'three'
import { DRIVING } from '../config/track'
import { useExperience } from '../store/useExperience'
import { setEngine } from '../lib/audio'
import { Car } from './Car'
import { CHECKPOINT_POINTS, curvatureAt, frameAt, halfWidth, trackLength, uDelta, wrap } from './track'
import { vehicle } from './vehicleState'

const frame = frameAt(0)
const EDGE = halfWidth - 1.2

/**
 * O carro anda preso ao traçado: `u` (0‑1) é a posição ao longo da pista e
 * `lateral` o deslocamento em relação ao centro. Nada de física real — só
 * aceleração, arrasto, força centrífuga e aderência lateral.
 */
export function Vehicle() {
  const car = useRef()
  const [subscribe, getKeys] = useKeyboardControls()

  // E / Enter abre o checkpoint próximo (ou fecha o painel aberto)
  useEffect(
    () =>
      subscribe(
        (s) => s.interact,
        (pressed) => {
          if (!pressed) return
          const { activeId, openId, open, close, phase } = useExperience.getState()
          if (phase !== 'drive') return
          if (openId) close()
          else if (activeId) open(activeId)
        },
      ),
    [subscribe],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const { phase, openId, activeId, setActive } = useExperience.getState()
    const canDrive = phase === 'drive' && !openId
    const keys = canDrive ? getKeys() : {}
    const D = DRIVING

    // --- longitudinal ------------------------------------------------------
    let { speed } = vehicle
    if (keys.forward) speed += (speed < 0 ? D.brake : D.acceleration) * dt
    else if (keys.back) speed -= (speed > 0 ? D.brake : D.acceleration * 0.6) * dt
    else speed -= Math.sign(speed) * Math.min(Math.abs(speed), D.drag * dt)
    if (keys.handbrake) speed -= Math.sign(speed) * Math.min(Math.abs(speed), D.brake * 0.35 * dt)
    speed = MathUtils.clamp(speed, -D.maxReverse, D.maxSpeed)

    // --- lateral -----------------------------------------------------------
    const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0)
    const speedFactor = Math.min(Math.abs(speed) / 12, 1) * Math.sign(speed || 1)
    const k = curvatureAt(vehicle.u)
    let { latVel, lateral } = vehicle
    latVel += steer * D.steer * speedFactor * dt
    latVel -= k * speed * speed * D.centrifugal * dt
    latVel *= Math.exp(-(keys.handbrake ? D.handbrakeGrip : D.grip) * dt)
    lateral += latVel * dt
    if (Math.abs(lateral) > EDGE) {
      // raspou na borda: segura e perde velocidade
      lateral = Math.sign(lateral) * EDGE
      latVel = 0
      speed *= 1 - 0.8 * dt
    }

    vehicle.u = wrap(vehicle.u + (speed * dt) / trackLength)
    vehicle.speed = speed
    vehicle.lateral = lateral
    vehicle.latVel = latVel

    // --- transformação visual ---------------------------------------------
    frameAt(vehicle.u, frame)
    vehicle.position.copy(frame.point).addScaledVector(frame.side, lateral)
    vehicle.forward.copy(frame.tangent)
    vehicle.heading = Math.atan2(frame.tangent.x, frame.tangent.z)
    // o carro "aponta" para onde está escorregando, com um exagero de drift
    const slip = Math.atan2(latVel, Math.max(Math.abs(speed), 4)) * 1.6
    vehicle.drift = MathUtils.damp(vehicle.drift, slip + steer * 0.08 * speedFactor, 8, dt)

    const g = car.current
    g.position.copy(vehicle.position)
    g.rotation.set(0, vehicle.heading + vehicle.drift, MathUtils.clamp(-latVel * 0.012, -0.08, 0.08), 'YXZ')

    setEngine(Math.abs(speed) / D.maxSpeed)

    // --- checkpoint mais próximo -------------------------------------------
    let nearest = null
    let best = D.checkpointRadius / trackLength
    for (const cp of CHECKPOINT_POINTS) {
      const d = Math.abs(uDelta(vehicle.u, cp.u))
      if (d < best) {
        best = d
        nearest = cp.id
      }
    }
    if (phase === 'drive' && nearest !== activeId) setActive(nearest)
  })

  return <Car ref={car} />
}
