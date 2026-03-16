import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Birds spread across the full sky — wide elliptical paths
const BIRD_CONFIG = [
  { cx: -12, cz:   0, rx: 22, rz: 38, speed: 0.28, phase: 0.00, baseY: 22, dy: 2.2 },
  { cx:  -4, cz:  18, rx: 28, rz: 44, speed: 0.22, phase: 2.10, baseY: 30, dy: 3.0 },
  { cx: -22, cz: -18, rx: 16, rz: 32, speed: 0.36, phase: 1.30, baseY: 18, dy: 1.8 },
  { cx:  12, cz: -35, rx: 24, rz: 50, speed: 0.24, phase: 3.50, baseY: 35, dy: 2.6 },
  { cx: -28, cz:  42, rx: 14, rz: 30, speed: 0.42, phase: 0.70, baseY: 15, dy: 1.5 },
  { cx:   2, cz: -55, rx: 26, rz: 55, speed: 0.19, phase: 4.20, baseY: 40, dy: 3.5 },
  { cx: -18, cz:  62, rx: 18, rz: 36, speed: 0.32, phase: 1.80, baseY: 26, dy: 2.0 },
  { cx:  18, cz:  -8, rx: 30, rz: 48, speed: 0.17, phase: 2.90, baseY: 45, dy: 4.0 },
  { cx:  -8, cz:  80, rx: 20, rz: 40, speed: 0.26, phase: 0.40, baseY: 20, dy: 1.6 },
]

// Dark cormorant-like colors — visible against bright sky
const BODY_CLR  = new THREE.Color(0x28221c)
const WING_CLR  = new THREE.Color(0x1c1712)
const BELLY_CLR = new THREE.Color(0x38302a)
const BEAK_CLR  = new THREE.Color(0xc88820)

function Bird({
  cx, cz, rx, rz, speed, phase, baseY, dy,
}: typeof BIRD_CONFIG[0]) {
  const groupRef  = useRef<THREE.Group>(null)
  // Left wing: shoulder group → inner + outer
  const lShoulder = useRef<THREE.Group>(null)
  const lOuter    = useRef<THREE.Group>(null)
  // Right wing
  const rShoulder = useRef<THREE.Group>(null)
  const rOuter    = useRef<THREE.Group>(null)

  const tRef = useRef(phase)
  const prevPos = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    tRef.current += delta * speed
    const t = tRef.current
    if (!groupRef.current) return

    // Elliptical flight path
    const px = cx + Math.cos(t) * rx
    const py = baseY + Math.sin(t * 1.8) * dy
    const pz = cz + Math.sin(t) * rz

    // Face direction of travel
    const dx = px - prevPos.current.x
    const dz = pz - prevPos.current.z
    if (Math.abs(dx) + Math.abs(dz) > 0.001) {
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    }

    // Bank into turn — roll toward inside of curve
    groupRef.current.rotation.z = -Math.sin(t) * 0.30

    // Nose pitch follows vertical motion
    const vdy = py - prevPos.current.y
    groupRef.current.rotation.x = -vdy * 0.08

    groupRef.current.position.set(px, py, pz)
    prevPos.current.set(px, py, pz)

    // Wing flap — glide phase (slow, shallow) then flap (fast, deep)
    // Use a beating pattern: 2 quick flaps then a glide
    const beat  = ((t * 2.8) % (Math.PI * 2))
    const flap  = beat < Math.PI * 1.4
      ? Math.sin(beat / 1.4 * Math.PI) * 0.65   // active flap
      : Math.sin(beat * 0.5) * 0.08              // glide droop

    // Inner wing — main flap
    if (lShoulder.current) lShoulder.current.rotation.z =  flap + 0.08
    if (rShoulder.current) rShoulder.current.rotation.z = -flap - 0.08

    // Outer wing — follows inner with slight lag and extra flex
    const flapOuter = Math.sin(((t * 2.8) - 0.4) % (Math.PI * 2) / 1.4 * Math.PI) * 0.30
    if (lOuter.current) lOuter.current.rotation.z =  flapOuter + 0.05
    if (rOuter.current) rOuter.current.rotation.z = -flapOuter - 0.05
  })

  return (
    <group ref={groupRef}>
      {/* Body — elongated, dark */}
      <mesh>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color={BODY_CLR} roughness={0.82} metalness={0.05} />
      </mesh>
      {/* Belly — slightly lighter underneath */}
      <mesh position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.14, 8, 5]} />
        <meshStandardMaterial color={BELLY_CLR} roughness={0.85} metalness={0} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.10, 0.16]} rotation={[0.35, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.22, 7]} />
        <meshStandardMaterial color={BODY_CLR} roughness={0.82} metalness={0} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.18, 0.28]}>
        <sphereGeometry args={[0.095, 8, 6]} />
        <meshStandardMaterial color={BODY_CLR} roughness={0.80} metalness={0} />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0.16, 0.40]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.042, 0.030, 0.13]} />
        <meshStandardMaterial color={BEAK_CLR} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Tail feathers */}
      <mesh position={[0, -0.04, -0.24]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.18, 0.035, 0.22]} />
        <meshStandardMaterial color={WING_CLR} roughness={0.85} metalness={0} />
      </mesh>

      {/* ── LEFT WING ── */}
      {/* Shoulder pivot at body edge */}
      <group ref={lShoulder} position={[-0.16, 0, 0]}>
        {/* Inner wing segment */}
        <mesh position={[-0.26, 0, -0.02]}>
          <boxGeometry args={[0.52, 0.055, 0.28]} />
          <meshStandardMaterial color={WING_CLR} roughness={0.85} metalness={0} />
        </mesh>
        {/* Outer wing pivot — at inner tip */}
        <group ref={lOuter} position={[-0.52, 0, 0]}>
          <mesh position={[-0.38, -0.02, -0.01]}>
            <boxGeometry args={[0.76, 0.036, 0.22]} />
            <meshStandardMaterial color={WING_CLR} roughness={0.85} metalness={0} />
          </mesh>
        </group>
      </group>

      {/* ── RIGHT WING ── */}
      <group ref={rShoulder} position={[0.16, 0, 0]}>
        <mesh position={[0.26, 0, -0.02]}>
          <boxGeometry args={[0.52, 0.055, 0.28]} />
          <meshStandardMaterial color={WING_CLR} roughness={0.85} metalness={0} />
        </mesh>
        <group ref={rOuter} position={[0.52, 0, 0]}>
          <mesh position={[0.38, -0.02, -0.01]}>
            <boxGeometry args={[0.76, 0.036, 0.22]} />
            <meshStandardMaterial color={WING_CLR} roughness={0.85} metalness={0} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export function Seagulls() {
  return (
    <group>
      {BIRD_CONFIG.map((cfg, i) => <Bird key={i} {...cfg} />)}
    </group>
  )
}
