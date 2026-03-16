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
  const fnZ  = -half + 4.5  // funnel Z (toward stern)

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
      {/* Blue accent stripe just above red */}
      <mesh position={[0, FB * 0.44 + 0.135, 0]}>
        <boxGeometry args={[BW + 0.08, 0.12, BL * 0.78]} />
        <meshStandardMaterial color={0x1a3a8a} roughness={0.45} metalness={0.20} />
      </mesh>

      {/* ── DECK ────────────────────────────────────────── */}
      <mesh position={[0, DY + 0.04, 0]} castShadow>
        <boxGeometry args={[BW - 0.08, 0.09, BL - 0.90]} />
        <meshStandardMaterial color={0xc8b882} roughness={0.83} metalness={0} />
      </mesh>
      {/* Dark deck seam lines */}
      {[-1.7, -0.85, 0, 0.85, 1.7].map((x, i) => (
        <mesh key={`pk${i}`} position={[x, DY + 0.09, 0]}>
          <boxGeometry args={[0.04, 0.015, BL - 1.1]} />
          <meshStandardMaterial color={0x7a6030} roughness={0.90} metalness={0} />
        </mesh>
      ))}

      {/* ── MAIN CABIN (deck 1) — panoramic window strips ── */}
      <mesh castShadow position={[0, C1B + C1H / 2, 0.4]}>
        <boxGeometry args={[C1HW * 2, C1H, BL - 1.8]} />
        <meshStandardMaterial color={0xf5f4f0} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* Panoramic window strip – Port */}
      <mesh position={[-(C1HW + 0.04), C1B + C1H * 0.52, 0.4]}>
        <boxGeometry args={[0.06, 0.80, BL - 3.0]} />
        <meshStandardMaterial color={0x7ab8d8} roughness={0.05} metalness={0.70} transparent opacity={0.72} />
      </mesh>
      <mesh position={[-(C1HW + 0.04), C1B + C1H * 0.52 + 0.425, 0.4]}>
        <boxGeometry args={[0.07, 0.05, BL - 3.0]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      <mesh position={[-(C1HW + 0.04), C1B + C1H * 0.52 - 0.425, 0.4]}>
        <boxGeometry args={[0.07, 0.05, BL - 3.0]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      {/* Panoramic window strip – Starboard */}
      <mesh position={[(C1HW + 0.04), C1B + C1H * 0.52, 0.4]}>
        <boxGeometry args={[0.06, 0.80, BL - 3.0]} />
        <meshStandardMaterial color={0x7ab8d8} roughness={0.05} metalness={0.70} transparent opacity={0.72} />
      </mesh>
      <mesh position={[(C1HW + 0.04), C1B + C1H * 0.52 + 0.425, 0.4]}>
        <boxGeometry args={[0.07, 0.05, BL - 3.0]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      <mesh position={[(C1HW + 0.04), C1B + C1H * 0.52 - 0.425, 0.4]}>
        <boxGeometry args={[0.07, 0.05, BL - 3.0]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>

      {/* ── DECK 2 OVERHANG ─────────────────────────────── */}
      <mesh position={[0, D2Y + 0.06, 0.4]} castShadow>
        <boxGeometry args={[BW - 0.20, 0.11, BL - 1.2]} />
        <meshStandardMaterial color={0x1e3888} roughness={0.58} metalness={0.06} />
      </mesh>

      {/* ── UPPER CABIN (deck 2) ────────────────────────── */}
      <mesh castShadow position={[0, C2B + C2H / 2, 0.3]}>
        <boxGeometry args={[C2HW * 2, C2H, BL - 3.2]} />
        <meshStandardMaterial color={0xf0eeea} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* Blue decorative stripe at base of upper cabin */}
      <mesh position={[0, C2B + 0.04, 0.3]}>
        <boxGeometry args={[C2HW * 2 + 0.01, 0.08, BL - 3.2]} />
        <meshStandardMaterial color={0x1a3a8a} roughness={0.40} metalness={0.15} />
      </mesh>
      {/* Panoramic windows – Port upper */}
      <mesh position={[-(C2HW + 0.04), C2B + C2H * 0.52, 0.3]}>
        <boxGeometry args={[0.06, 0.72, BL - 4.5]} />
        <meshStandardMaterial color={0x7ab8d8} roughness={0.05} metalness={0.70} transparent opacity={0.72} />
      </mesh>
      <mesh position={[-(C2HW + 0.04), C2B + C2H * 0.52 + 0.385, 0.3]}>
        <boxGeometry args={[0.07, 0.05, BL - 4.5]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      <mesh position={[-(C2HW + 0.04), C2B + C2H * 0.52 - 0.385, 0.3]}>
        <boxGeometry args={[0.07, 0.05, BL - 4.5]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      {/* Panoramic windows – Starboard upper */}
      <mesh position={[(C2HW + 0.04), C2B + C2H * 0.52, 0.3]}>
        <boxGeometry args={[0.06, 0.72, BL - 4.5]} />
        <meshStandardMaterial color={0x7ab8d8} roughness={0.05} metalness={0.70} transparent opacity={0.72} />
      </mesh>
      <mesh position={[(C2HW + 0.04), C2B + C2H * 0.52 + 0.385, 0.3]}>
        <boxGeometry args={[0.07, 0.05, BL - 4.5]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>
      <mesh position={[(C2HW + 0.04), C2B + C2H * 0.52 - 0.385, 0.3]}>
        <boxGeometry args={[0.07, 0.05, BL - 4.5]} />
        <meshStandardMaterial color={0xddd8cc} roughness={0.40} metalness={0.10} />
      </mesh>

      {/* ── WHEELHOUSE / BRIDGE ─────────────────────────── */}
      <mesh castShadow position={[0, BRB + BRH / 2, half - 2.0]}>
        <boxGeometry args={[BRHW * 2, BRH, 2.8]} />
        <meshStandardMaterial color={0xf5f4f0} roughness={0.42} metalness={0.05} />
      </mesh>
      {/* Bridge front window */}
      <mesh position={[0, BRB + BRH * 0.53, half - 0.62]}>
        <boxGeometry args={[BRHW * 2 - 0.28, 0.70, 0.07]} />
        <meshStandardMaterial color={0x7ab8d8} roughness={0.02} metalness={0.65} transparent opacity={0.68} />
      </mesh>
      {/* Bridge side windows */}
      {([-1, 1] as (1|-1)[]).map(s => (
        <mesh key={`bsw${s}`} position={[s * BRHW, BRB + BRH * 0.53, half - 2.0]}>
          <boxGeometry args={[0.07, 0.65, 2.1]} />
          <meshStandardMaterial color={0x7ab8d8} roughness={0.02} metalness={0.65} transparent opacity={0.68} />
        </mesh>
      ))}
      {/* Bridge roof – blue */}
      <mesh position={[0, BRT + 0.04, half - 2.0]}>
        <boxGeometry args={[BRHW * 2 + 0.20, 0.08, 3.0]} />
        <meshStandardMaterial color={0x1a3a8a} roughness={0.50} metalness={0.10} />
      </mesh>
      {/* Radar platform on bridge roof */}
      <mesh position={[0, BRT + 0.11, half - 2.0]}>
        <boxGeometry args={[BRHW * 2 + 0.50, 0.06, 3.0]} />
        <meshStandardMaterial color={0xc8c4ba} roughness={0.50} metalness={0.20} />
      </mesh>

      {/* ── SUN DECK ────────────────────────────────────── */}
      {/* Open sun deck surface */}
      <mesh position={[0, BRT + 0.06, 0]} castShadow>
        <boxGeometry args={[BW - 0.2, 0.08, BL - 2.0]} />
        <meshStandardMaterial color={0xd4c890} roughness={0.75} metalness={0} />
      </mesh>
      {/* Canvas awnings × 3 */}
      {[-4, 0, 4].map((z, i) => (
        <group key={`aw${i}`}>
          <mesh position={[0, BRT + 1.8, z]}>
            <boxGeometry args={[BW - 0.5, 0.06, 3.5]} />
            <meshStandardMaterial color={0xf5f0e0} roughness={0.80} metalness={0} />
          </mesh>
          {([
            [-(BW / 2 - 0.40), z - 1.5],
            [-(BW / 2 - 0.40), z + 1.5],
            [ (BW / 2 - 0.40), z - 1.5],
            [ (BW / 2 - 0.40), z + 1.5],
          ] as [number, number][]).map(([px, pz], pi) => (
            <mesh key={pi} position={[px, BRT + 0.06 + 0.875, pz]}>
              <cylinderGeometry args={[0.03, 0.03, 1.75, 6]} />
              <meshStandardMaterial color={0xc0bfba} roughness={0.30} metalness={0.70} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Deck chairs */}
      {[-4, 2].flatMap((z, ci) =>
        ([-1, 1] as (1|-1)[]).map((s, si) => (
          <mesh key={`ch${ci}${si}`} position={[s * (BW / 2 - 0.55), BRT + 0.14, z]}>
            <boxGeometry args={[0.45, 0.08, 0.85]} />
            <meshStandardMaterial color={0x2244aa} roughness={0.70} metalness={0.10} />
          </mesh>
        ))
      )}

      {/* ── FUNNEL ──────────────────────────────────────── */}
      {/* Main funnel body */}
      <mesh castShadow position={[0.4, C2B + 1.1, fnZ]}>
        <cylinderGeometry args={[0.22, 0.28, 2.2, 12]} />
        <meshStandardMaterial color={0xf0eeea} roughness={0.45} metalness={0.10} />
      </mesh>
      {/* Blue band */}
      <mesh position={[0.4, C2B + 1.1 + 0.55, fnZ]}>
        <cylinderGeometry args={[0.295, 0.295, 0.45, 12]} />
        <meshStandardMaterial color={0x1a3a8a} roughness={0.40} metalness={0.15} />
      </mesh>
      {/* Red thin band above blue */}
      <mesh position={[0.4, C2B + 1.1 + 0.85, fnZ]}>
        <cylinderGeometry args={[0.293, 0.293, 0.15, 12]} />
        <meshStandardMaterial color={0xcc2810} roughness={0.40} metalness={0.12} />
      </mesh>
      {/* Funnel cap */}
      <mesh position={[0.4, C2B + 2.28, fnZ]}>
        <cylinderGeometry args={[0.20, 0.22, 0.16, 12]} />
        <meshStandardMaterial color={0x1a1816} roughness={0.70} metalness={0.20} />
      </mesh>
      {/* Smoke suggestion */}
      <mesh position={[0.4, C2B + 2.60, fnZ]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={0xd0cdc8}
          emissive={new THREE.Color(0xb0b0b0)} emissiveIntensity={0.3}
          transparent opacity={0.55} roughness={1.0} metalness={0} />
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
      {/* Second smaller radar dish */}
      <mesh position={[0, BRT + 3.2, mZ]}>
        <boxGeometry args={[0.50, 0.08, 0.14]} />
        <meshStandardMaterial color={0x505860} roughness={0.28} metalness={0.90} />
      </mesh>
      {/* Horn */}
      <mesh position={[BRHW - 0.1, BRT + 0.65, half - 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.30, 8]} />
        <meshStandardMaterial color={0xd0c8b0} roughness={0.35} metalness={0.80} />
      </mesh>

      {/* ── LIFEBOATS — 2 orange rescue boats on davits ─── */}
      {([-1, 1] as (1|-1)[]).map(s => (
        <group key={`lb${s}`}>
          {/* Lifeboat hull */}
          <mesh position={[s * (C1HW + 0.18), C1T + 0.30, 0]}>
            <boxGeometry args={[0.28, 0.28, 1.60]} />
            <meshStandardMaterial color={0xff6600} roughness={0.60} metalness={0.10} />
          </mesh>
          {/* Lifeboat cabin top */}
          <mesh position={[s * (C1HW + 0.18), C1T + 0.53, 0]}>
            <boxGeometry args={[0.26, 0.18, 1.50]} />
            <meshStandardMaterial color={0xff6600} roughness={0.60} metalness={0.10} />
          </mesh>
          {/* Davit arm */}
          <mesh position={[s * (C1HW + 0.18), C1T + 0.895, 0]}>
            <boxGeometry args={[0.04, 0.55, 0.04]} />
            <meshStandardMaterial color={0xb0b8c0} roughness={0.20} metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── RAILINGS ────────────────────────────────────── */}
      {railing(-1, DY + 0.08, -half + 0.9, half - 0.9, 9)}
      {railing( 1, DY + 0.08, -half + 0.9, half - 0.9, 9)}
      {/* Bow railing (connecting port/stbd across bow) */}
      <mesh position={[0, DY + 0.58, half - 0.5]} rotation={[0, 0, Math.PI / 2]}>
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

      {/* ── PORTUGUESE FLAG (improved) ──────────────────── */}
      {/* Flag pole: BRT+3.88 → BRT+4.40, center at BRT+4.14, height 0.52 */}
      <mesh position={[0, BRT + 4.14, mZ]}>
        <cylinderGeometry args={[0.012, 0.012, 0.52, 6]} />
        <meshStandardMaterial color={0xb0b8c0} roughness={0.20} metalness={0.90} />
      </mesh>
      {/* Green stripe (left 40%) */}
      <mesh position={[-0.21, BRT + 4.15, mZ]}>
        <boxGeometry args={[0.28, 0.46, 0.015]} />
        <meshStandardMaterial color={0x006600} roughness={0.80} />
      </mesh>
      {/* Red stripe (right 60%) */}
      <mesh position={[0.14, BRT + 4.15, mZ]}>
        <boxGeometry args={[0.42, 0.46, 0.015]} />
        <meshStandardMaterial color={0xcc0000} roughness={0.80} />
      </mesh>
      {/* Armillary sphere (coat of arms) */}
      <mesh position={[0, BRT + 4.15, mZ - 0.009]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={0xf0c000}
          emissive={new THREE.Color(0xd4a800)} emissiveIntensity={0.5}
          roughness={0.40} metalness={0.60} />
      </mesh>

    </group>
  )
})
