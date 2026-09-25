import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { MathUtils } from 'three'
import { DRIVING } from '../config/track'
import { useExperience } from '../store/useExperience'
import { setDriftSound, setEngine } from '../lib/audio'
import { Car } from './Car'
import { CHECKPOINT_POINTS, curvatureAt, frameAt, halfWidth, trackLength, uDelta, wrap } from './track'
import { drift, endDrift, vehicle } from './vehicleState'

const frame = frameAt(0)
const EDGE = halfWidth - 1.2

/**
 * O carro anda preso ao traçado: `u` (0‑1) é a posição ao longo da pista e
 * `lateral` o deslocamento em relação ao centro. Nada de física real — só
 * aceleração, arrasto, força centrífuga, aderência lateral e um estado de
 * drift com ângulo de carroceria controlado pelo jogador.
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

    const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0)
    const k = curvatureAt(vehicle.u)
    let { speed, latVel, lateral } = vehicle

    // --- drift: entrada ----------------------------------------------------
    if (!drift.active && steer !== 0 && speed > D.driftMinSpeed) {
      // freio de mão + direção, ou freada forte virando para dentro da curva
      const handbrakeKick = keys.handbrake
      const brakeFlick = keys.back && Math.abs(k) > 0.015 && Math.sign(steer) === Math.sign(k)
      if (handbrakeKick || brakeFlick) {
        drift.active = true
        drift.dir = steer
        drift.time = 0
        drift.angle = vehicle.drift
      }
    }

    // --- drift: controle ---------------------------------------------------
    if (drift.active) {
      const dir = drift.dir
      const counter = steer === -dir
      let target = dir * (keys.forward ? D.driftAnglePower : D.driftAngle)
      if (steer === dir) target += dir * 0.16
      if (keys.handbrake) target += dir * 0.1
      if (counter) target = dir * 0.08 // contraesterço endireita o carro
      // tirar o pé: a traseira volta aos poucos e o drift termina
      if (!keys.forward && !keys.handbrake && !counter) target = dir * 0.05
      drift.angle = MathUtils.damp(drift.angle, target, counter ? 2.4 : 3.4, dt)
      drift.time += dt
      drift.multiplier = Math.min(1 + Math.floor(drift.time / 1.5) * 0.5, 5)
      drift.points += Math.abs(drift.angle) * Math.abs(speed) * 12 * dt

      const straightened = Math.abs(drift.angle) < 0.16 && drift.time > 0.35 && !keys.handbrake
      if (speed < D.driftMinSpeed * 0.55 || straightened) endDrift(false)
    } else {
      drift.angle = MathUtils.damp(drift.angle, 0, 5, dt)
    }

    // --- longitudinal ------------------------------------------------------
    const sideways = Math.abs(Math.sin(drift.angle))
    const accel = D.acceleration * (drift.active ? 0.75 : 1)
    if (keys.forward) speed += (speed < 0 ? D.brake : accel) * dt
    else if (keys.back) speed -= (speed > 0 ? D.brake : D.acceleration * 0.6) * dt
    else speed -= Math.sign(speed) * Math.min(Math.abs(speed), D.drag * dt)
    if (keys.handbrake) speed -= Math.sign(speed) * Math.min(Math.abs(speed), D.brake * (drift.active ? 0.12 : 0.35) * dt)
    // de lado, o carro "raspa" os pneus e perde velocidade
    speed -= Math.sign(speed) * Math.min(Math.abs(speed), sideways * D.driftDrag * dt)
    speed = MathUtils.clamp(speed, -D.maxReverse, D.maxSpeed)

    // --- lateral -----------------------------------------------------------
    const speedFactor = Math.min(Math.abs(speed) / 12, 1) * Math.sign(speed || 1)
    const steerPower = drift.active ? 0.55 : 1
    latVel += steer * D.steer * steerPower * speedFactor * dt
    latVel -= k * speed * speed * D.centrifugal * dt
    // no drift o carro desliza na direção oposta ao bico (para fora da curva)
    if (drift.active) latVel -= Math.sin(drift.angle) * Math.abs(speed) * 0.35 * dt
    const grip = drift.active ? D.driftGrip : keys.handbrake ? D.handbrakeGrip : D.grip
    latVel *= Math.exp(-grip * dt)
    lateral += latVel * dt
    if (Math.abs(lateral) > EDGE) {
      // raspou na borda: segura, perde velocidade e o drift acaba em falha
      lateral = Math.sign(lateral) * EDGE
      latVel = 0
      speed *= 1 - 0.8 * dt
      if (drift.active && drift.time > 0.2) endDrift(true)
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
    // fora do drift, uma leve derrapagem visual pela velocidade lateral
    const slip = Math.atan2(latVel, Math.max(Math.abs(speed), 4)) * 1.2 + steer * 0.06 * speedFactor
    vehicle.drift = drift.angle + (drift.active ? 0 : MathUtils.damp(vehicle.drift - drift.angle, slip, 8, dt))

    drift.intensity = MathUtils.damp(
      drift.intensity,
      drift.active ? Math.min(1, sideways * 1.6) * Math.min(1, Math.abs(speed) / 20) : 0,
      8,
      dt,
    )

    const g = car.current
    g.position.copy(vehicle.position)
    g.rotation.set(0, vehicle.heading + vehicle.drift, MathUtils.clamp(-latVel * 0.012 - drift.angle * 0.06, -0.1, 0.1), 'YXZ')

    setEngine(Math.abs(speed) / D.maxSpeed, drift.intensity)
    setDriftSound(drift.intensity)

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
