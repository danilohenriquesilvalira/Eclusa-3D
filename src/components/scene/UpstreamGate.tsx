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

      {/* ── Guide rails ── */}
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
          </group>
        )
      })}

      {/* ── Winch towers ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xt = sx * (VW / 2 - 0.30)
        return (
          <group key={sx}>
            <mesh castShadow position={[xt, twY, Z_MON]}>
              <boxGeometry args={[0.32, twH, 0.32]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            <mesh castShadow position={[sx * (VW / 4), twY, Z_MON]} rotation={[0, 0, sx * 0.42]}>
              <boxGeometry args={[0.16, twH * 0.75, 0.16]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            <mesh castShadow position={[xt, WALL_TOP + 0.55, Z_MON]}>
              <boxGeometry args={[0.60, 0.30, 0.60]} />
              <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xt, twY + twH / 2 - 0.08, Z_MON]}>
              <boxGeometry args={[0.88, 0.60, 0.60]} />
              <meshStandardMaterial color={0x383e44} roughness={0.65} metalness={0.75} />
            </mesh>
            <mesh castShadow position={[xt, twY + twH / 2 + 0.20, Z_MON]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.20, 0.20, 0.65, 14]} />
              <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
            </mesh>
            <mesh castShadow position={[xt, twY - 0.5, Z_MON + 0.15]}>
              <cylinderGeometry args={[0.05, 0.05, twH + GHv + 1.5, 8]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.08} metalness={0.98} />
            </mesh>
          </group>
        )
      })}

      {/* Traverse beam at top */}
      <mesh castShadow position={[0, twY + twH / 2, Z_MON]}>
        <boxGeometry args={[VW + 0.65, 0.42, 0.42]} />
        <meshStandardMaterial color={0x585f65} roughness={0.52} metalness={0.82} />
      </mesh>

      {/* ── Counterweights ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => (
        <group key={sx}>
          <mesh
            ref={sx === -1 ? cwLRef : cwRRef}
            castShadow
            position={[sx * (VW / 2 - 0.30), cwStartY, Z_MON - 0.70]}
          >
            <boxGeometry args={[0.70, 2.4, 0.70]} />
            <meshStandardMaterial color={0x4a4e50} roughness={0.88} metalness={0.08} />
          </mesh>
          <mesh position={[sx * (VW / 2 - 0.30), cwStartY + 1.0, Z_MON - 0.33]}>
            <boxGeometry args={[0.50, 0.12, 0.04]} />
            <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
})
