import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { LOW_Y, HIGH_Y, Z_JUS, Z_MON } from '../../constants'
import { useSimStore } from '../../store/simulation'

export interface BoatHandle {
  moveTo: (z: number) => Promise<void>
  resetToStart: (dir: 'up' | 'dn') => void
}

// ── Boat dimensions ──────────────────────────────────────────
const BL   = 15.5   // total length
const BW   = 4.80   // max beam
const BD   = 0.80   // draft (below waterline)
const FB   = 0.52   // freeboard (above waterline to deck)
const BR   = 0.30   // bilge corner radius

// ── Hull station table  [zFrac(0=stern→1=bow), beamFrac, draftFrac] ──
const STATIONS: [number,number,number][] = [
  [0.000, 0.06, 0.18],
  [0.050, 0.42, 0.60],
  [0.110, 0.80, 0.88],
  [0.200, 1.00, 1.00],
  [0.380, 1.00, 1.00],
  [0.620, 1.00, 1.00],
  [0.800, 1.00, 1.00],
  [0.875, 0.88, 0.94],
  [0.930, 0.62, 0.78],
  [0.970, 0.32, 0.48],
  [1.000, 0.04, 0.12],
]

// Cross-section at beam/draft fraction — returns [x,y] points port→stbd
function hullSection(bf: number, df: number): [number,number][] {
  const hw = (BW / 2) * bf
  const bd = BD * df
  const br = Math.min(BR * bf, hw * 0.42, bd * 0.55)
  return [
    [-hw,        FB       ],  // 0  port deck
    [-hw,        0        ],  // 1  port WL
    [-hw,       -(bd - br)],  // 2  port topsides bottom
    [-hw + br * 0.25, -bd + br * 0.25], // 3 bilge outer
    [-hw + br,  -bd      ],  // 4  port bilge base
    [-hw * 0.4, -bd      ],  // 5  keel left
    [ 0,        -bd * 1.03], // 6  keel center
    [ hw * 0.4, -bd      ],  // 7  keel right
    [ hw - br,  -bd      ],  // 8  stbd bilge base
    [ hw - br * 0.25, -bd + br * 0.25], // 9 bilge outer
    [ hw,       -(bd - br)], // 10 stbd topsides bottom
    [ hw,        0        ], // 11 stbd WL
    [ hw,        FB       ], // 12 stbd deck
  ]
}

// Build the full hull BufferGeometry from stations
function buildHullGeo(): THREE.BufferGeometry {
  const verts: number[] = []
  const idx:   number[] = []
  let base = 0

  for (let si = 0; si < STATIONS.length - 1; si++) {
    const [z0f, b0, d0] = STATIONS[si]
    const [z1f, b1, d1] = STATIONS[si + 1]
    const z0 = (z0f - 0.5) * BL
    const z1 = (z1f - 0.5) * BL
    const s0 = hullSection(b0, d0)
    const s1 = hullSection(b1, d1)
    const np = s0.length

    for (let pi = 0; pi < np; pi++) {
      verts.push(s0[pi][0], s0[pi][1], z0)
      verts.push(s1[pi][0], s1[pi][1], z1)
    }
    for (let pi = 0; pi < np - 1; pi++) {
      const a  = base + pi * 2
      const b_ = base + pi * 2 + 2
      const c  = base + pi * 2 + 1
      const d_ = base + pi * 2 + 3
      idx.push(a, c, b_, b_, c, d_)
    }
    base += np * 2
  }

  // Stern cap (fan from center at bilge level)
  const [z0f_s, bs, ds] = STATIONS[0]
  const sZ  = (z0f_s - 0.5) * BL
  const sec = hullSection(bs, ds)
  const ci  = base / 1  // not used as idx yet
  const centerVertIdx = verts.length / 3
  verts.push(0, -BD * ds * 0.4, sZ)
  const sternStart = verts.length / 3
  for (const pt of sec) verts.push(pt[0], pt[1], sZ)
  for (let pi = 0; pi < sec.length - 1; pi++) {
    idx.push(centerVertIdx, sternStart + pi + 1, sternStart + pi)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

// ── Y positions relative to group origin (= waterline) ───────
const DY    = FB                         // deck surface
const C1B   = DY + 0.08                  // cabin 1 bottom
const C1H   = 1.65                       // cabin 1 height
const C1T   = C1B + C1H                  // cabin 1 top
const D2Y   = C1T + 0.10                 // deck 2
const C2B   = D2Y + 0.06
const C2H   = 1.45
const C2T   = C2B + C2H
const BRB   = C2T + 0.08                 // bridge bottom
const BRH   = 1.10
const BRT   = BRB + BRH                  // bridge top
const MSTY  = BRT + 3.6                  // mast top

// cabin/bridge half-widths
const C1HW  = (BW - 0.65) / 2
const C2HW  = (BW - 1.05) / 2
const BRHW  = (BW - 1.50) / 2

export const Boat = forwardRef<BoatHandle>((_, ref) => {
  const groupRef = useRef<THREE.Group>(null)
  const waterLevel = useSimStore(s => s.waterLevel)
  const wlRef = useRef(waterLevel)
  const tRef  = useRef(0)
  wlRef.current = waterLevel

  const hullGeo = useMemo(() => buildHullGeo(), [])

  useFrame((_, delta) => {
    tRef.current += delta
    if (!groupRef.current) return
    const bz = groupRef.current.position.z
    const inChamber = bz > Z_MON + 0.5 && bz < Z_JUS - 0.5
    const wl  = wlRef.current
    const wY  = LOW_Y + wl * (HIGH_Y - LOW_Y)
    const surf = inChamber ? wY : bz >= Z_JUS - 0.5 ? LOW_Y : HIGH_Y
    groupRef.current.position.y  = surf + Math.sin(tRef.current * 1.05) * 0.042
    groupRef.current.rotation.z  = Math.sin(tRef.current * 0.80) * 0.014
    groupRef.current.rotation.x  = Math.cos(tRef.current * 0.65) * 0.006

  })

  useImperativeHandle(ref, () => ({
    moveTo: (z: number) => new Promise<void>(res => {
      if (!groupRef.current) return res()
      const dist = Math.abs(z - groupRef.current.position.z)
      gsap.to(groupRef.current.position, {
        z, duration: dist * 0.165 + 0.6, ease: 'power1.inOut', onComplete: () => res(),
      })
    }),
    resetToStart: (dir) => {
      if (!groupRef.current) return
      if (dir === 'up') {
        groupRef.current.position.set(0, LOW_Y, Z_JUS + 16)
        groupRef.current.rotation.y = 0
      } else {
        groupRef.current.position.set(0, HIGH_Y, Z_MON - 16)
        groupRef.current.rotation.y = Math.PI
      }
    },
  }))

  // Window rows helper
  const winRow = (x: number, y: number, zStart: number, count: number,
                  spacingZ: number, wW = 0.80, wH = 0.68) =>
    Array.from({ length: count }, (_, i) => (
      <mesh key={i} position={[x, y, zStart + i * spacingZ]}>
        <boxGeometry args={[0.075, wH, wW]} />
        <meshStandardMaterial color={0x88c8ee} roughness={0.03} metalness={0.55}
          transparent opacity={0.75} />
      </mesh>
    ))

  // Railing helper: horizontal bar + stanchions
  const railing = (side: number, y: number, zA: number, zB: number, posts: number) => {
    const x = side * (C1HW + 0.06)
    const len = Math.abs(zB - zA)
    const zC = (zA + zB) / 2
    return (
      <group key={`rl${side}${y}`}>
        <mesh position={[x, y + 0.50, zC]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.020, 0.020, len, 6]} />
          <meshStandardMaterial color={0xb0bcc8} roughness={0.12} metalness={0.94} />
        </mesh>
        <mesh position={[x, y + 0.25, zC]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, len, 6]} />
          <meshStandardMaterial color={0xb0bcc8} roughness={0.12} metalness={0.94} />
        </mesh>
        {Array.from({ length: posts }, (_, i) => {
          const pz = zA + (i / (posts - 1)) * len
          return (
            <mesh key={i} position={[x, y + 0.28, pz]}>
              <cylinderGeometry args={[0.018, 0.018, 0.56, 6]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.12} metalness={0.94} />
            </mesh>
          )
        })}
      </group>
    )
  }

  const half = BL / 2
  const mZ   = half - 1.8   // mast Z (toward bow)
  const fnZ  = -half + 4.2  // funnel Z (toward stern)

  return (
    <group ref={groupRef} position={[0, LOW_Y, Z_JUS + 16]}>

      {/* ── HULL ──────────────────────────────────────────── */}
      <mesh geometry={hullGeo} castShadow receiveShadow>
        <meshStandardMaterial color={0x182040} roughness={0.48} metalness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Waterline white band */}
      <mesh position={[0, FB * 0.10, 0]}>
        <boxGeometry args={[BW + 0.18, 0.26, BL * 0.80]} />
        <meshStandardMaterial color={0xf2f0ee} roughness={0.50} metalness={0.04} />
      </mesh>
      {/* Red boot-topping */}
      <mesh position={[0, FB * 0.44, 0]}>
        <boxGeometry args={[BW + 0.10, 0.15, BL * 0.78]} />
        <meshStandardMaterial color={0xcc2810} roughness={0.52} metalness={0.12} />
      </mesh>

      {/* ── DECK ────────────────────────────────────────── */}
      <mesh position={[0, DY + 0.04, 0]} castShadow>
        <boxGeometry args={[BW - 0.08, 0.09, BL - 0.90]} />
        <meshStandardMaterial color={0xb89a60} roughness={0.83} metalness={0} />
      </mesh>
      {/* Teak planks */}
      {[-1.7, -0.85, 0, 0.85, 1.7].map((x, i) => (
        <mesh key={`pk${i}`} position={[x, DY + 0.09, 0]}>
          <boxGeometry args={[0.046, 0.018, BL - 1.1]} />
          <meshStandardMaterial color={0x8a7040} roughness={0.90} metalness={0} />
        </mesh>
      ))}

      {/* ── MAIN CABIN (deck 1) ─────────────────────────── */}
      <mesh castShadow position={[0, C1B + C1H / 2, 0.4]}>
        <boxGeometry args={[C1HW * 2, C1H, BL - 1.8]} />
        <meshStandardMaterial color={0xf2f0ee} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* Port windows */}
      {winRow(-C1HW - 0.04, C1B + C1H * 0.50, -half * 0.64 + 0.4, 5, (BL - 3.2) / 4.5)}
      {/* Stbd windows */}
      {winRow( C1HW + 0.04, C1B + C1H * 0.50, -half * 0.64 + 0.4, 5, (BL - 3.2) / 4.5)}

      {/* ── DECK 2 OVERHANG ─────────────────────────────── */}
      <mesh position={[0, D2Y + 0.06, 0.4]} castShadow>
        <boxGeometry args={[BW - 0.20, 0.11, BL - 1.2]} />
        <meshStandardMaterial color={0x1e3888} roughness={0.58} metalness={0.06} />
      </mesh>

      {/* ── UPPER CABIN (deck 2) ────────────────────────── */}
      <mesh castShadow position={[0, C2B + C2H / 2, 0.3]}>
        <boxGeometry args={[C2HW * 2, C2H, BL - 3.2]} />
        <meshStandardMaterial color={0xf2f0ee} roughness={0.42} metalness={0.05} />
      </mesh>
      {winRow(-C2HW - 0.04, C2B + C2H * 0.50, -half * 0.50 + 0.4, 4, (BL - 5.0) / 3.6)}
      {winRow( C2HW + 0.04, C2B + C2H * 0.50, -half * 0.50 + 0.4, 4, (BL - 5.0) / 3.6)}

      {/* ── WHEELHOUSE ──────────────────────────────────── */}
      <mesh castShadow position={[0, BRB + BRH / 2, half - 2.0]}>
        <boxGeometry args={[BRHW * 2, BRH, 2.8]} />
        <meshStandardMaterial color={0xf2f0ee} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* Bridge front window */}
      <mesh position={[0, BRB + BRH * 0.53, half - 0.62]}>
        <boxGeometry args={[BRHW * 2 - 0.28, 0.70, 0.07]} />
        <meshStandardMaterial color={0x88c8ee} roughness={0.02} metalness={0.60} transparent opacity={0.78} />
      </mesh>
      {/* Bridge side windows */}
      {([-1, 1] as (1|-1)[]).map(s => (
        <mesh key={`bsw${s}`} position={[s * BRHW, BRB + BRH * 0.53, half - 2.0]}>
          <boxGeometry args={[0.07, 0.65, 2.1]} />
          <meshStandardMaterial color={0x88c8ee} roughness={0.02} metalness={0.60} transparent opacity={0.78} />
        </mesh>
      ))}
      {/* Bridge roof */}
      <mesh position={[0, BRT + 0.04, half - 2.0]}>
        <boxGeometry args={[BRHW * 2 + 0.20, 0.08, 3.0]} />
        <meshStandardMaterial color={0x1e3888} roughness={0.58} metalness={0.06} />
      </mesh>

      {/* ── MAST ────────────────────────────────────────── */}
      <mesh castShadow position={[0, BRT + 1.9, mZ]}>
        <cylinderGeometry args={[0.055, 0.075, 3.8, 8]} />
        <meshStandardMaterial color={0xb0bcc8} roughness={0.10} metalness={0.95} />
      </mesh>
      {/* Radar */}
      <mesh position={[0, BRT + 3.85, mZ]}>
        <boxGeometry args={[0.88, 0.12, 0.22]} />
        <meshStandardMaterial color={0x505860} roughness={0.28} metalness={0.90} />
      </mesh>
      <mesh position={[0, BRT + 3.72, mZ]}>
        <cylinderGeometry args={[0.036, 0.036, 0.25, 6]} />
        <meshStandardMaterial color={0xb0bcc8} roughness={0.10} metalness={0.95} />
      </mesh>
      {/* Horn */}
      <mesh position={[BRHW - 0.1, BRT + 0.65, half - 0.8]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.30, 8]} />
        <meshStandardMaterial color={0xd0c8b0} roughness={0.35} metalness={0.80} />
      </mesh>

      {/* ── FUNNEL ──────────────────────────────────────── */}
      <mesh castShadow position={[0.5, C2B + 0.90, fnZ]}>
        <cylinderGeometry args={[0.18, 0.24, 1.90, 12]} />
        <meshStandardMaterial color={0x181614} roughness={0.78} metalness={0.15} />
      </mesh>
      <mesh position={[0.5, C2B + 0.90 + 0.97, fnZ]}>
        <cylinderGeometry args={[0.25, 0.19, 0.12, 12]} />
        <meshStandardMaterial color={0x181614} roughness={0.78} metalness={0.15} />
      </mesh>

      {/* ── RAILINGS ────────────────────────────────────── */}
      {railing(-1, DY + 0.08, -half + 0.9, half - 0.9, 9)}
      {railing( 1, DY + 0.08, -half + 0.9, half - 0.9, 9)}
      {/* Bow railing (connecting port/stbd across bow) */}
      <mesh position={[0, DY + 0.58, half - 0.5]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.020, 0.020, BW * 0.72, 6]} />
        <meshStandardMaterial color={0xb0bcc8} roughness={0.12} metalness={0.94} />
      </mesh>

      {/* ── NAV LIGHTS ──────────────────────────────────── */}
      <mesh position={[0, BRT + 3.90, mZ]}>
        <sphereGeometry args={[0.085, 12, 8]} />
        <meshStandardMaterial color={0xffffff}
          emissive={new THREE.Color(0xffffff)} emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[-(BW / 2 - 0.14), DY + 0.50, half - 0.6]}>
        <sphereGeometry args={[0.062, 12, 8]} />
        <meshStandardMaterial color={0xff2200}
          emissive={new THREE.Color(0xff0000)} emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[ BW / 2 - 0.14, DY + 0.50, half - 0.6]}>
        <sphereGeometry args={[0.062, 12, 8]} />
        <meshStandardMaterial color={0x00cc22}
          emissive={new THREE.Color(0x00aa00)} emissiveIntensity={2.2} />
      </mesh>

      {/* ── LIFE RINGS ──────────────────────────────────── */}
      {([-1, 1] as (1|-1)[]).map(s => (
        <mesh key={`lr${s}`}
          position={[s * (C1HW + 0.14), C1B + C1H * 0.46, -half * 0.35]}
          rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.22, 0.054, 10, 20]} />
          <meshStandardMaterial color={0xff3300} roughness={0.60} />
        </mesh>
      ))}

      {/* ── ANCHOR ──────────────────────────────────────── */}
      <mesh position={[-(BW / 2 - 0.26), DY + 0.04, half - 0.8]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
        <meshStandardMaterial color={0x484848} roughness={0.42} metalness={0.88} />
      </mesh>
      <mesh position={[-(BW / 2 - 0.26), DY - 0.03, half - 0.8]}>
        <cylinderGeometry args={[0.024, 0.024, 0.26, 6]} />
        <meshStandardMaterial color={0x484848} roughness={0.42} metalness={0.88} />
      </mesh>

      {/* ── CLEATS ──────────────────────────────────────── */}
      {([-half + 1.4, half - 1.4] as number[]).map((z, i) =>
        ([-1, 1] as (1|-1)[]).map(s => (
          <mesh key={`cl${i}${s}`} position={[s * (BW / 2 - 0.22), DY + 0.12, z]}>
            <boxGeometry args={[0.09, 0.11, 0.36]} />
            <meshStandardMaterial color={0x484848} roughness={0.40} metalness={0.88} />
          </mesh>
        ))
      )}

      {/* ── PORTUGUESE FLAG ─────────────────────────────── */}
      <mesh position={[-0.20, BRT + 4.06, mZ]}>
        <boxGeometry args={[0.50, 0.33, 0.016]} />
        <meshStandardMaterial color={0x006600} roughness={0.80} />
      </mesh>
      <mesh position={[0.09, BRT + 4.06, mZ]}>
        <boxGeometry args={[0.27, 0.33, 0.016]} />
        <meshStandardMaterial color={0xcc0000} roughness={0.80} />
      </mesh>

    </group>
  )
})
