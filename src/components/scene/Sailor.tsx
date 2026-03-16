import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { WALL_TOP, CW, LOW_Y, HIGH_Y, FLOOR_Y } from '../../constants'
import { useSimStore } from '../../store/simulation'

export interface SailorHandle {
  moor:    () => Promise<void>
  release: () => Promise<void>
}

// Boat geometry constants (must match Boat.tsx)
const BW = 4.80
const FB = 0.52  // freeboard above waterline

// Sailor stands on starboard deck edge, facing the wall
const SAILOR_X = BW / 2 - 0.30   // = 2.10 — on boat's right deck edge

// Floating bollard Z positions
const BOLLARD_ZS = [5.0, 0.0, -5.0]

// Guide rail geometry
const railH = WALL_TOP - FLOOR_Y + 0.2
const railCenterY = FLOOR_Y + railH / 2

// Floating bollard Y as a function of water level
function bollardFloatY(wl: number): number {
  return LOW_Y + wl * (HIGH_Y - LOW_Y) + 0.30
}

// Bollard head rope attachment point (protruding from wall face)
function bollardHeadPos(cz: number, wl: number): THREE.Vector3 {
  return new THREE.Vector3(CW / 2 + 0.30, bollardFloatY(wl) + 0.22, cz)
}

// Rope boat-end: starboard deck edge, water-level-aware height
function ropeBoardEnd(cz: number, wl: number): THREE.Vector3 {
  return new THREE.Vector3(BW / 2 + 0.10, LOW_Y + wl * (HIGH_Y - LOW_Y) + FB, cz)
}

// Sailor foot-level on boat deck
function sailorDeckY(wl: number): number {
  return LOW_Y + wl * (HIGH_Y - LOW_Y) + FB + 0.46
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)

export const Sailor = forwardRef<SailorHandle>((_, ref) => {
  const sailorRef = useRef<THREE.Group>(null)
  const rope0 = useRef<THREE.Mesh>(null)
  const rope1 = useRef<THREE.Mesh>(null)
  const rope2 = useRef<THREE.Mesh>(null)
  const ropeRefs = [rope0, rope1, rope2]
  const mooredRef = useRef(false)

  // Refs for floating bollard groups
  const bollard0 = useRef<THREE.Group>(null)
  const bollard1 = useRef<THREE.Group>(null)
  const bollard2 = useRef<THREE.Group>(null)
  const bollardRefs = [bollard0, bollard1, bollard2]

  useFrame(() => {
    const wl = useSimStore.getState().waterLevel
    const floatY = bollardFloatY(wl)

    // Sailor tracks boat deck Y
    if (sailorRef.current?.visible) {
      sailorRef.current.position.y = sailorDeckY(wl)
    }

    // Update floating bollard Y positions
    bollardRefs.forEach(bRef => {
      if (bRef.current) bRef.current.position.y = floatY
    })

    // Update rope geometry as water level changes
    if (!mooredRef.current) return
    ropeRefs.forEach((rRef, i) => {
      const mesh = rRef.current
      if (!mesh || !mesh.visible) return
      const cz = BOLLARD_ZS[i]
      const start = bollardHeadPos(cz, wl)
      const end   = ropeBoardEnd(cz, wl)
      const dir   = end.clone().sub(start)
      const len   = dir.length()
      mesh.position.copy(start.clone().add(end).multiplyScalar(0.5))
      mesh.scale.y = len
      mesh.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize())
    })
  })

  useImperativeHandle(ref, () => ({
    moor: () => new Promise<void>(async res => {
      const sg = sailorRef.current
      if (!sg) { res(); return }
      // Place sailor on boat deck, starboard side, starting at z=5
      const wl = useSimStore.getState().waterLevel
      sg.position.set(SAILOR_X, sailorDeckY(wl), 5.0)
      sg.rotation.set(0, Math.PI / 2, 0)  // face the wall (+x direction)
      sg.visible = true
      // Walk to each bollard z and tie rope
      for (let i = 0; i < BOLLARD_ZS.length; i++) {
        const cz = BOLLARD_ZS[i]
        const dist = Math.abs(sg.position.z - cz)
        if (dist > 0.05) {
          await new Promise<void>(r =>
            gsap.to(sg.position, { z: cz, duration: dist / 4.0, ease: 'power1.inOut', onComplete: () => r() })
          )
        }
        if (ropeRefs[i].current) ropeRefs[i].current!.visible = true
        await new Promise<void>(r => setTimeout(r, 350))
      }
      mooredRef.current = true
      res()
    }),

    release: () => new Promise<void>(async res => {
      mooredRef.current = false
      ropeRefs.forEach(r => { if (r.current) r.current.visible = false })
      const sg = sailorRef.current
      if (!sg) { res(); return }
      // Walk back toward bow (z=5) then hide
      await new Promise<void>(r =>
        gsap.to(sg.position, { z: 5.0, duration: 2.0, ease: 'power1.inOut', onComplete: () => r() })
      )
      sg.visible = false
      res()
    }),
  }))

  return (
    <group>
      {/* ── Guide rails (static) on right wall inner face ── */}
      {BOLLARD_ZS.map((cz, i) => (
        <group key={`rail-${i}`}>
          <mesh position={[CW / 2 - 0.02, railCenterY, cz]}>
            <boxGeometry args={[0.07, railH, 0.20]} />
            <meshStandardMaterial color={0x2e2e2e} roughness={0.7} metalness={0.6} />
          </mesh>
          <mesh position={[CW / 2, railCenterY, cz + 0.11]}>
            <boxGeometry args={[0.05, railH, 0.03]} />
            <meshStandardMaterial color={0x1e1e1e} roughness={0.7} metalness={0.5} />
          </mesh>
          <mesh position={[CW / 2, railCenterY, cz - 0.11]}>
            <boxGeometry args={[0.05, railH, 0.03]} />
            <meshStandardMaterial color={0x1e1e1e} roughness={0.7} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ── Floating bollards (3) on right wall inner face, track water level ── */}
      {BOLLARD_ZS.map((cz, i) => (
        <group key={`bollard-${i}`} ref={bollardRefs[i]} position={[CW / 2, bollardFloatY(0), cz]}>
          {/* Back slide plate */}
          <mesh castShadow position={[-0.05, 0, 0]}>
            <boxGeometry args={[0.12, 0.38, 0.18]} />
            <meshStandardMaterial color={0xb8960a} roughness={0.65} metalness={0.35} />
          </mesh>
          {/* Black wear ring */}
          <mesh castShadow position={[0.12, 0.04, 0]}>
            <cylinderGeometry args={[0.095, 0.095, 0.07, 10]} />
            <meshStandardMaterial color={0x181818} roughness={0.85} metalness={0.1} />
          </mesh>
          {/* Main post */}
          <mesh castShadow position={[0.12, 0.05, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.30, 10]} />
            <meshStandardMaterial color={0xf2c200} roughness={0.45} metalness={0.55} />
          </mesh>
          {/* T-bar crossarm */}
          <mesh castShadow position={[0.12, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
            <meshStandardMaterial color={0xf2c200} roughness={0.45} metalness={0.55} />
          </mesh>
          {/* Mushroom cap */}
          <mesh castShadow position={[0.12, 0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.10, 0.10, 12]} />
            <meshStandardMaterial color={0xf2c200} roughness={0.45} metalness={0.55} />
          </mesh>
          {/* Top disc */}
          <mesh castShadow position={[0.12, 0.27, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, 12]} />
            <meshStandardMaterial color={0xe8b800} roughness={0.40} metalness={0.60} />
          </mesh>
        </group>
      ))}

      {/* ── Mooring ropes (boat → bollard, updated each frame) ── */}
      <mesh ref={rope0} visible={false}>
        <cylinderGeometry args={[0.028, 0.028, 1, 5]} />
        <meshStandardMaterial color={0xd8a860} roughness={0.92} metalness={0} />
      </mesh>
      <mesh ref={rope1} visible={false}>
        <cylinderGeometry args={[0.028, 0.028, 1, 5]} />
        <meshStandardMaterial color={0xd8a860} roughness={0.92} metalness={0} />
      </mesh>
      <mesh ref={rope2} visible={false}>
        <cylinderGeometry args={[0.028, 0.028, 1, 5]} />
        <meshStandardMaterial color={0xd8a860} roughness={0.92} metalness={0} />
      </mesh>

      {/* ── Sailor figure (on boat starboard deck, faces wall) ── */}
      <group ref={sailorRef} position={[SAILOR_X, LOW_Y + FB + 0.46, 5.0]} visible={false}>
        {/* Torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.10, 0.38, 4, 8]} />
          <meshStandardMaterial color={0xf0f4ff} roughness={0.85} metalness={0} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.105, 8, 6]} />
          <meshStandardMaterial color={0xf5cba7} roughness={0.90} metalness={0} />
        </mesh>
        {/* White sailor cap brim */}
        <mesh castShadow position={[0, 0.475, 0]}>
          <cylinderGeometry args={[0.135, 0.135, 0.025, 8]} />
          <meshStandardMaterial color={0xffffff} roughness={0.70} metalness={0} />
        </mesh>
        {/* Cap top */}
        <mesh castShadow position={[0, 0.505, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 0.09, 8]} />
          <meshStandardMaterial color={0xffffff} roughness={0.70} metalness={0} />
        </mesh>
        {/* Left arm */}
        <mesh castShadow position={[-0.16, 0.10, 0.05]} rotation={[0.30, 0, 0.44]}>
          <capsuleGeometry args={[0.036, 0.22, 4, 6]} />
          <meshStandardMaterial color={0x1a3560} roughness={0.85} metalness={0} />
        </mesh>
        {/* Right arm reaching toward wall with rope */}
        <mesh castShadow position={[0.20, 0.14, 0]} rotation={[0, 0, -1.20]}>
          <capsuleGeometry args={[0.036, 0.22, 4, 6]} />
          <meshStandardMaterial color={0x1a3560} roughness={0.85} metalness={0} />
        </mesh>
        {/* Left leg */}
        <mesh castShadow position={[-0.065, -0.35, 0]}>
          <capsuleGeometry args={[0.042, 0.24, 4, 6]} />
          <meshStandardMaterial color={0x1f2d5c} roughness={0.85} metalness={0} />
        </mesh>
        {/* Right leg */}
        <mesh castShadow position={[0.065, -0.35, 0]}>
          <capsuleGeometry args={[0.042, 0.24, 4, 6]} />
          <meshStandardMaterial color={0x1f2d5c} roughness={0.85} metalness={0} />
        </mesh>
      </group>
    </group>
  )
})

Sailor.displayName = 'Sailor'
