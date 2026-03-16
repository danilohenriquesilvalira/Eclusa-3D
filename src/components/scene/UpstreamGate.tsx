import { useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { FLOOR_Y, WALL_H, WALL_TOP, Z_MON, GHv, GDv, VW, VAG_CY, VAG_OY, CW, WT } from '../../constants'

export interface UpstreamGateHandle {
  open: () => Promise<void>
  close: () => Promise<void>
}

export const UpstreamGate = forwardRef<UpstreamGateHandle>((_, ref) => {
  const vagRef = useRef<THREE.Group>(null)
  const cwLRef = useRef<THREE.Mesh>(null)
  const cwRRef = useRef<THREE.Mesh>(null)

  useImperativeHandle(ref, () => ({
    open: () => new Promise<void>(res => {
      const startY = vagRef.current!.position.y
      const cwStartL = cwLRef.current!.position.y
      const cwStartR = cwRRef.current!.position.y
      const obj = { t: 0 }
      gsap.to(obj, {
        t: 1, duration: 3.2, ease: 'power2.inOut',
        onUpdate: () => {
          const y = THREE.MathUtils.lerp(startY, VAG_OY, obj.t)
          vagRef.current!.position.y = y
          const d = (y - startY) * 0.92
          cwLRef.current!.position.y = cwStartL - d
          cwRRef.current!.position.y = cwStartR - d
        },
        onComplete: () => res()
      })
    }),
    close: () => new Promise<void>(res => {
      const startY = vagRef.current!.position.y
      const cwStartL = cwLRef.current!.position.y
      const cwStartR = cwRRef.current!.position.y
      const obj = { t: 0 }
      gsap.to(obj, {
        t: 1, duration: 3.2, ease: 'power2.inOut',
        onUpdate: () => {
          const y = THREE.MathUtils.lerp(startY, VAG_CY, obj.t)
          vagRef.current!.position.y = y
          const d = (y - startY) * 0.92
          cwLRef.current!.position.y = cwStartL - d
          cwRRef.current!.position.y = cwStartR - d
        },
        onComplete: () => res()
      })
    })
  }))

  const twH = 5.8
  const twY = WALL_TOP + twH / 2 + 0.4
  const cwStartY = VAG_CY + GHv * 0.32

  return (
    <group>
      {/* ── Sliding gate (vagão) ── */}
      <group ref={vagRef} position={[0, VAG_CY, Z_MON]}>
        {/* Main panel */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[VW, GHv, GDv]} />
          <meshStandardMaterial color={0x4a5258} roughness={0.68} metalness={0.72} />
        </mesh>

        {/* 7 horizontal ribs */}
        {Array.from({ length: 7 }, (_, i) => {
          const y = -GHv / 2 + 0.5 + i * (GHv / 6)
          return (
            <group key={i}>
              <mesh castShadow position={[0, y, 0]}>
                <boxGeometry args={[VW + 0.06, 0.32, GDv + 0.24]} />
                <meshStandardMaterial color={0x363c42} roughness={0.75} metalness={0.68} />
              </mesh>
              <mesh castShadow position={[0, y + 0.22, 0]}>
                <boxGeometry args={[VW + 0.04, 0.12, GDv + 0.08]} />
                <meshStandardMaterial color={0x4a5258} roughness={0.68} metalness={0.72} />
              </mesh>
            </group>
          )
        })}

        {/* 5 vertical longerons */}
        {([-VW / 2 + 0.32, -VW * 0.28, 0, VW * 0.28, VW / 2 - 0.32] as number[]).map((xi, i) => (
          <mesh key={i} castShadow position={[xi, 0, 0]}>
            <boxGeometry args={[0.24, GHv, GDv + 0.16]} />
            <meshStandardMaterial color={0x363c42} roughness={0.75} metalness={0.68} />
          </mesh>
        ))}

        {/* Yellow seals sides */}
        <mesh castShadow position={[-(VW / 2 - 0.06), 0, GDv / 2 + 0.06]}>
          <boxGeometry args={[0.15, GHv, 0.12]} />
          <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
        </mesh>
        <mesh castShadow position={[(VW / 2 - 0.06), 0, GDv / 2 + 0.06]}>
          <boxGeometry args={[0.15, GHv, 0.12]} />
          <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
        </mesh>
        {/* Yellow seals top/bottom */}
        <mesh castShadow position={[0, -GHv / 2 + 0.07, GDv / 2 + 0.06]}>
          <boxGeometry args={[VW + 0.06, 0.14, 0.12]} />
          <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
        </mesh>
        <mesh castShadow position={[0, GHv / 2 - 0.07, GDv / 2 + 0.06]}>
          <boxGeometry args={[VW + 0.06, 0.14, 0.12]} />
          <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
        </mesh>

        {/* Biofouling bottom */}
        <mesh castShadow position={[0, -GHv / 2 + GHv * 0.14, 0]}>
          <boxGeometry args={[VW + 0.06, GHv * 0.28, GDv + 0.08]} />
          <meshStandardMaterial color={0x1c3a10} roughness={1.0} metalness={0} />
        </mesh>

        {/* 3 hoisting eyes at top */}
        {([-VW / 3, 0, VW / 3] as number[]).map((xi, i) => (
          <group key={i} position={[xi, GHv / 2 - 0.18, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.36, 0.22]} />
              <meshStandardMaterial color={0x363c42} roughness={0.75} metalness={0.68} />
            </mesh>
            <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.08} metalness={0.98} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Gate groove guide rails ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xG = sx * (CW / 2 + WT * 0.52)
        return (
          <group key={sx}>
            <mesh castShadow position={[xG, FLOOR_Y + WALL_H / 2 + 3.5, Z_MON]}>
              <boxGeometry args={[0.44, WALL_H + 7, 0.44]} />
              <meshStandardMaterial color={0x707878} roughness={0.42} metalness={0.85} />
            </mesh>
            <mesh castShadow position={[xG + sx * 0.25, FLOOR_Y + WALL_H / 2 + 3.5, Z_MON + 0.25]}>
              <boxGeometry args={[0.16, WALL_H + 7, 0.16]} />
              <meshStandardMaterial color={0x707878} roughness={0.42} metalness={0.85} />
            </mesh>
            {/* Base anchor block */}
            <mesh castShadow receiveShadow position={[xG, FLOOR_Y + 0.30, Z_MON]}>
              <boxGeometry args={[0.80, 0.60, 0.80]} />
              <meshStandardMaterial color={0x606870} roughness={0.88} metalness={0.06} />
            </mesh>
          </group>
        )
      })}

      {/* Gate sill threshold beam */}
      <mesh castShadow receiveShadow position={[0, FLOOR_Y + 0.20, Z_MON]}>
        <boxGeometry args={[VW + 0.30, 0.40, GDv + 0.40]} />
        <meshStandardMaterial color={0x606870} roughness={0.88} metalness={0.06} />
      </mesh>

      {/* ── Gate posts / winch towers (H-frame) ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xt      = sx * (VW / 2 - 0.30)
        const zFr     = Z_MON + 0.32
        const zBk     = Z_MON - 0.60
        const zMid    = (zFr + zBk) / 2
        const depthZ  = zFr - zBk
        const towerH  = twH + 0.40
        const towerCY = WALL_TOP + towerH / 2
        const towerTop = WALL_TOP + towerH
        return (
          <group key={sx}>
            {/* Concrete base pedestal */}
            <mesh castShadow position={[xt, WALL_TOP + 0.20, zMid]}>
              <boxGeometry args={[1.22, 0.40, depthZ + 0.50]} />
              <meshStandardMaterial color={0x606870} roughness={0.88} metalness={0.06} />
            </mesh>
            {/* Front column (gate side) */}
            <mesh castShadow position={[xt, towerCY, zFr]}>
              <boxGeometry args={[0.36, towerH, 0.36]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            {/* Back column (counterweight side) */}
            <mesh castShadow position={[xt, towerCY, zBk]}>
              <boxGeometry args={[0.36, towerH, 0.36]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            {/* Horizontal crossbars (5 evenly spaced) */}
            {Array.from({ length: 5 }, (_, i) => {
              const y = WALL_TOP + 0.40 + i * (towerH - 0.40) / 4
              return (
                <mesh key={i} castShadow position={[xt, y, zMid]}>
                  <boxGeometry args={[0.28, 0.22, depthZ + 0.36]} />
                  <meshStandardMaterial color={0x4e5560} roughness={0.60} metalness={0.82} />
                </mesh>
              )
            })}
            {/* X-brace diagonal pairs (2 panels) */}
            {([0, 1] as number[]).map(p => {
              const y0 = WALL_TOP + 0.40 + p * (towerH - 0.40) / 2
              const y1 = WALL_TOP + 0.40 + (p + 1) * (towerH - 0.40) / 2
              const yC = (y0 + y1) / 2
              const dy = y1 - y0
              const diagL = Math.sqrt(depthZ * depthZ + dy * dy)
              const angX = Math.atan2(depthZ, dy)
              return [
                <mesh key={`da${p}`} castShadow position={[xt, yC, zMid]} rotation={[angX, 0, 0]}>
                  <boxGeometry args={[0.14, diagL, 0.14]} />
                  <meshStandardMaterial color={0x4e5560} roughness={0.60} metalness={0.82} />
                </mesh>,
                <mesh key={`db${p}`} castShadow position={[xt, yC, zMid]} rotation={[-angX, 0, 0]}>
                  <boxGeometry args={[0.14, diagL, 0.14]} />
                  <meshStandardMaterial color={0x4e5560} roughness={0.60} metalness={0.82} />
                </mesh>
              ]
            })}
            {/* Top cap beam */}
            <mesh castShadow position={[xt, towerTop + 0.12, zMid]}>
              <boxGeometry args={[0.80, 0.24, depthZ + 0.36]} />
              <meshStandardMaterial color={0x383e44} roughness={0.65} metalness={0.75} />
            </mesh>
            {/* Sheave drum at top */}
            <mesh castShadow position={[xt, towerTop + 0.34, zFr - 0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.65, 12]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            {/* CW guide flanges along back column */}
            {([-1, 1] as (-1 | 1)[]).map(dx => (
              <mesh key={dx} castShadow position={[xt + dx * 0.36, towerCY + 0.20, zBk - 0.16]}>
                <boxGeometry args={[0.10, towerH - 0.60, 0.20]} />
                <meshStandardMaterial color={0x707878} roughness={0.42} metalness={0.85} />
              </mesh>
            ))}
            {/* Hoist cable: gate top → sheave */}
            <mesh castShadow
              position={[xt, (VAG_CY + GHv / 2 + towerTop + 0.34) / 2, zFr - 0.04]}>
              <cylinderGeometry args={[0.038, 0.038, towerTop + 0.34 - (VAG_CY + GHv / 2), 6]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.08} metalness={0.98} />
            </mesh>
            {/* CW cable: sheave → counterweight top */}
            <mesh castShadow
              position={[xt, (cwStartY + 1.20 + towerTop + 0.34) / 2, zBk - 0.04]}>
              <cylinderGeometry args={[0.038, 0.038, towerTop + 0.34 - (cwStartY + 1.20), 6]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.08} metalness={0.98} />
            </mesh>
          </group>
        )
      })}

      {/* Traverse beam connecting both tower tops */}
      <mesh castShadow position={[0, twY + twH / 2, Z_MON]}>
        <boxGeometry args={[VW + 0.65, 0.42, 0.42]} />
        <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
      </mesh>

      {/* ── Counterweights (inside tower CW guide) ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => (
        <mesh
          ref={sx === -1 ? cwLRef : cwRRef}
          key={sx}
          castShadow
          position={[sx * (VW / 2 - 0.30), cwStartY, Z_MON - 0.60]}
        >
          <boxGeometry args={[0.62, 2.40, 0.48]} />
          <meshStandardMaterial color={0x4a4e50} roughness={0.88} metalness={0.08} />
        </mesh>
      ))}
    </group>
  )
})
