import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { OA, FLOOR_Y, Z_JUS, GHj, GDj, CW } from '../../constants'

export interface DownstreamGateHandle {
  open: () => Promise<void>
  close: () => Promise<void>
}

const LW = CW / 2

function GateLeaf({ side, rodRef }: { side: 1 | -1; rodRef: React.RefObject<THREE.Mesh> }) {
  const PW = LW + 0.06
  const cx = side * PW / 2
  const NC = 6

  const crossBraces: React.JSX.Element[] = []
  for (let i = 0; i < NC; i++) {
    const yB = -GHj / 2 + (i / NC) * GHj + 0.15
    const yT = -GHj / 2 + ((i + 1) / NC) * GHj - 0.15
    const yC = (yB + yT) / 2
    const dY = yT - yB, dX = PW - 0.45
    const L = Math.sqrt(dX * dX + dY * dY)
    const ang = Math.atan2(dY, dX)
    crossBraces.push(
      <mesh key={`cra${i}`} castShadow position={[cx, yC, GDj * 0.05]} rotation={[0, 0, -ang * side]}>
        <boxGeometry args={[L, 0.18, GDj * 0.4]} />
        <meshStandardMaterial color={0x505a66} roughness={0.65} metalness={0.72} />
      </mesh>,
      <mesh key={`crb${i}`} castShadow position={[cx, yC, GDj * 0.05]} rotation={[0, 0, ang * side]}>
        <boxGeometry args={[L, 0.18, GDj * 0.4]} />
        <meshStandardMaterial color={0x505a66} roughness={0.65} metalness={0.72} />
      </mesh>
    )
  }

  return (
    <group>
      {/* Main plate */}
      <mesh castShadow receiveShadow position={[cx, 0, -GDj * 0.20]}>
        <boxGeometry args={[PW, GHj, GDj * 0.35]} />
        <meshStandardMaterial color={0x6a7888} roughness={0.55} metalness={0.75} />
      </mesh>

      {/* Vertical longerons */}
      {([0, side * (PW - 0.12)] as number[]).map((lx, i) => (
        <group key={i}>
          <mesh castShadow position={[lx, 0, 0]}>
            <boxGeometry args={[0.28, GHj + 0.20, GDj]} />
            <meshStandardMaterial color={0x545e6a} roughness={0.65} metalness={0.72} />
          </mesh>
          <mesh castShadow position={[lx, 0, GDj * 0.5]}>
            <boxGeometry args={[0.44, GHj + 0.20, 0.12]} />
            <meshStandardMaterial color={0x545e6a} roughness={0.65} metalness={0.72} />
          </mesh>
          <mesh castShadow position={[lx, 0, -GDj * 0.5]}>
            <boxGeometry args={[0.44, GHj + 0.20, 0.12]} />
            <meshStandardMaterial color={0x545e6a} roughness={0.65} metalness={0.72} />
          </mesh>
        </group>
      ))}

      {/* Horizontal traverses */}
      {Array.from({ length: NC + 1 }, (_, i) => {
        const y = -GHj / 2 + i * (GHj / NC)
        return (
          <mesh key={i} castShadow position={[cx, y, 0]}>
            <boxGeometry args={[PW + 0.04, 0.28, GDj + 0.16]} />
            <meshStandardMaterial color={0x505a66} roughness={0.65} metalness={0.72} />
          </mesh>
        )
      })}

      {/* St Andrew cross braces */}
      {crossBraces}

      {/* Biofouling bottom zone */}
      <mesh castShadow position={[cx, -GHj / 2 + GHj * 0.15, 0]}>
        <boxGeometry args={[PW + 0.06, GHj * 0.30, GDj + 0.10]} />
        <meshStandardMaterial color={0x1e3010} roughness={1.0} metalness={0} />
      </mesh>

      {/* Rust zone */}
      <mesh castShadow position={[cx, -GHj / 2 + GHj * 0.18 + 0.5, 0]}>
        <boxGeometry args={[PW + 0.06, 1.8, GDj + 0.06]} />
        <meshStandardMaterial color={0x7a4820} roughness={0.94} metalness={0.08} />
      </mesh>

      {/* Rubber seal vertical */}
      <mesh position={[side * (PW / 2 - 0.02), 0, GDj / 2 + 0.04]}>
        <boxGeometry args={[0.10, GHj, 0.08]} />
        <meshStandardMaterial color={0x181a18} roughness={0.95} metalness={0} />
      </mesh>
      {/* Rubber seal bottom */}
      <mesh position={[cx, -GHj / 2 + 0.05, GDj / 2 + 0.04]}>
        <boxGeometry args={[PW + 0.04, 0.10, 0.08]} />
        <meshStandardMaterial color={0x181a18} roughness={0.95} metalness={0} />
      </mesh>

      {/* Yellow safety top */}
      <mesh castShadow position={[cx, GHj / 2 - 0.06, GDj / 2 + 0.05]}>
        <boxGeometry args={[PW + 0.05, 0.12, 0.10]} />
        <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
      </mesh>
      {/* Yellow safety side */}
      <mesh position={[side * (PW - 0.02), 0, GDj / 2 + 0.05]}>
        <boxGeometry args={[0.10, GHj * 0.88, 0.10]} />
        <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
      </mesh>

      {/* Rotation axis cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.22, GHj + 1.6, 14]} />
        <meshStandardMaterial color={0x6a7888} roughness={0.55} metalness={0.75} />
      </mesh>
      {/* Flange rings */}
      {([-GHj / 2 + 0.25, GHj * 0.10, GHj / 2 - 0.25] as number[]).map((yy, i) => (
        <mesh key={i} position={[0, yy, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.28, 16]} />
          <meshStandardMaterial color={0x505a66} roughness={0.65} metalness={0.72} />
        </mesh>
      ))}

      {/* Hydraulic cylinder group */}
      <group position={[side * (LW * 0.72), GHj / 2 - 1.2, GDj / 2 + 0.30]}>
        <mesh castShadow position={[0, 0, -1.4]}>
          <cylinderGeometry args={[0.18, 0.18, 2.8, 12]} />
          <meshStandardMaterial color={0x3a4040} roughness={0.55} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.10]}>
          <cylinderGeometry args={[0.24, 0.24, 0.22, 12]} />
          <meshStandardMaterial color={0x363c42} roughness={0.75} metalness={0.68} />
        </mesh>
        <mesh ref={rodRef} castShadow position={[0, 0, 1.85 / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 1.85, 10]} />
          <meshStandardMaterial color={0xc0c8d0} roughness={0.06} metalness={0.98} />
        </mesh>
        <mesh position={[0, 0, 0.50]}>
          <cylinderGeometry args={[0.12, 0.10, 0.60, 8]} />
          <meshStandardMaterial color={0x1a1a18} roughness={0.92} metalness={0} />
        </mesh>
      </group>
    </group>
  )
}

export const DownstreamGate = forwardRef<DownstreamGateHandle>((_, ref) => {
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const leftRodRef = useRef<THREE.Mesh>(null)
  const rightRodRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const angle = leftRef.current?.rotation.y ?? 0
    const t = Math.min(1, Math.abs(angle) / OA)
    const rodScaleY = 1.4 - 0.8 * t
    const rodPosY = 0.925 - (1.85 * rodScaleY) / 2
    for (const rodRef of [leftRodRef, rightRodRef]) {
      const rod = rodRef.current
      if (!rod) continue
      rod.scale.y = rodScaleY
      rod.position.y = rodPosY
    }
  })

  useImperativeHandle(ref, () => ({
    open: () => new Promise<void>(res => {
      gsap.to(leftRef.current!.rotation, { y: -OA, duration: 2.5, ease: 'power2.inOut' })
      gsap.to(rightRef.current!.rotation, { y: OA, duration: 2.5, ease: 'power2.inOut', onComplete: () => res() })
    }),
    close: () => new Promise<void>(res => {
      gsap.to(leftRef.current!.rotation, { y: 0, duration: 2.5, ease: 'power2.inOut' })
      gsap.to(rightRef.current!.rotation, { y: 0, duration: 2.5, ease: 'power2.inOut', onComplete: () => res() })
    })
  }))

  return (
    <group>
      <group ref={leftRef} position={[-CW / 2, FLOOR_Y + GHj / 2, Z_JUS]}>
        <GateLeaf side={1} rodRef={leftRodRef} />
      </group>
      <group ref={rightRef} position={[CW / 2, FLOOR_Y + GHj / 2, Z_JUS]}>
        <GateLeaf side={-1} rodRef={rightRodRef} />
      </group>
    </group>
  )
})
