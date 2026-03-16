import React from 'react'
import * as THREE from 'three'
import { FLOOR_Y, LOW_Y, WALL_TOP, WALL_H, CW, CL, WT, Z_JUS, Z_MON } from '../../constants'

const wetH = LOW_Y - FLOOR_Y     // 1.5
const dryH = WALL_TOP - LOW_Y    // 12.5
const walkW = 5.8
const soilH = 22
const soilY = FLOOR_Y - soilH / 2  // -19
const EX = 3.2
const xCab = CW / 2 + WT + 2.6    // 7.45

function Railing({ xBase, zFrom, zTo }: { xBase: number; zFrom: number; zTo: number }) {
  const len = zTo - zFrom
  const nPost = Math.max(2, Math.round(Math.abs(len) / 2.5))
  const posts: React.JSX.Element[] = []
  for (let i = 0; i <= nPost; i++) {
    const z = zFrom + i * (len / nPost)
    posts.push(
      <mesh key={`p${i}`} castShadow position={[xBase, WALL_TOP + 0.70, z]}>
        <cylinderGeometry args={[0.05, 0.05, 1.15, 8]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.42} metalness={0.88} />
      </mesh>,
      <mesh key={`pf${i}`} castShadow position={[xBase, WALL_TOP + 0.25, z]}>
        <boxGeometry args={[0.12, 0.06, 0.12]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.42} metalness={0.88} />
      </mesh>
    )
  }
  return (
    <group>
      {posts}
      <mesh castShadow position={[xBase, WALL_TOP + 1.20, zFrom + len / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, Math.abs(len) + 0.1, 8]} />
        <meshStandardMaterial color={0x909898} roughness={0.32} metalness={0.92} />
      </mesh>
      <mesh castShadow position={[xBase, WALL_TOP + 0.75, zFrom + len / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, Math.abs(len) + 0.1, 8]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.42} metalness={0.88} />
      </mesh>
    </group>
  )
}

const treeDataR: [number, number, string][] = [
  [-11, 4.5, 's'], [-7, 5.2, 's'], [-3, 4.8, 'a'], [1, 5.0, 's'], [5, 4.2, 's'],
  [9, 5.5, 'a'], [-9, 4.0, 's'], [-5, 5.3, 'a'], [3, 4.6, 's'], [7, 5.0, 's'], [11, 4.4, 'a']
]
const treeXR = CW / 2 + WT + walkW + 4  // 14.65
const treeBaseY = WALL_TOP + 0.4         // 6.4

function Tree({ tz, h, type }: { tz: number; h: number; type: string }) {
  const isSal = type === 's'
  const trunkColor = isSal ? 0x5c3d1e : 0x4a3218
  return (
    <group position={[treeXR, treeBaseY, tz]}>
      <mesh castShadow position={[0, h * 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.22, h * 0.4, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={1.0} />
      </mesh>
      {isSal ? (
        <>
          {([0, 1, 2] as const).map(i => (
            <mesh key={i} castShadow position={[0, h * 0.55 + i * 0.6, 0]} scale={[1, 0.85, 1]}>
              <sphereGeometry args={[1.2 + i * 0.3, 8, 6]} />
              <meshStandardMaterial color={[0x2d5e14, 0x367020, 0x3f8028][i]} roughness={1.0} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {([0, 1] as const).map(i => (
            <mesh key={i} castShadow position={[0, h * 0.55 + i * h * 0.18, 0]}>
              <coneGeometry args={[1.4 - i * 0.3, h * 0.55 + i * 0.4, 9]} />
              <meshStandardMaterial color={0x2e5a18} roughness={1.0} />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

export function Chamber() {
  const mooringZ = [-8, -4, 0, 4, 8]
  const safetyZ = [-8, -4, 0, 4, 8]

  return (
    <group>
      {/* ── Soil base ── */}
      <mesh receiveShadow position={[0, soilY, 0]}>
        <boxGeometry args={[160, 22, 160]} />
        <meshStandardMaterial color={0x080c10} roughness={1.0} metalness={0} />
      </mesh>

      {/* ── Chamber floor ── */}
      <mesh receiveShadow castShadow position={[0, FLOOR_Y - 0.4, 0]}>
        <boxGeometry args={[CW + WT * 2 + 0.2, 0.8, CL]} />
        <meshStandardMaterial color={0x282c2e} roughness={0.99} metalness={0.01} />
      </mesh>
      {/* Drain rails */}
      {([-CW / 4, CW / 4] as number[]).map((dx, i) => (
        <mesh key={i} position={[dx, FLOOR_Y + 0.01, 0]}>
          <boxGeometry args={[0.18, 0.06, CL - 1]} />
          <meshStandardMaterial color={0x606868} roughness={0.55} metalness={0.80} />
        </mesh>
      ))}

      {/* ── Two-zone walls ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xW = sx * (CW / 2 + WT / 2)
        return (
          <group key={sx}>
            {/* Wet section */}
            <mesh castShadow receiveShadow position={[xW, FLOOR_Y + wetH / 2, 0]}>
              <boxGeometry args={[WT, wetH, CL]} />
              <meshStandardMaterial color={0x3c4448} roughness={0.98} metalness={0.02} />
            </mesh>
            {/* Dry section */}
            <mesh castShadow receiveShadow position={[xW, LOW_Y + dryH / 2, 0]}>
              <boxGeometry args={[WT, dryH, CL]} />
              <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
            </mesh>
            {/* Biofilm strip */}
            <mesh position={[sx * (CW / 2 + WT - 0.04), LOW_Y - 0.5, 0]}>
              <boxGeometry args={[0.06, 2.0, CL - 0.2]} />
              <meshStandardMaterial color={0x1c3a10} roughness={1.0} />
            </mesh>
          </group>
        )
      })}

      {/* ── Ladder rungs on left wall ── */}
      {Array.from({ length: 8 }, (_, i) => {
        const yy = FLOOR_Y + 0.5 + i * 1.4
        return (
          <mesh key={i} castShadow position={[-(CW / 2 + 0.38), yy, CL / 2 - 2.5]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color={0x909898} roughness={0.38} metalness={0.85} />
          </mesh>
        )
      })}

      {/* ── Mooring niches and rings ── */}
      {mooringZ.flatMap(z =>
        ([-1, 1] as (1 | -1)[]).map(sx => (
          <group key={`${z}_${sx}`}>
            <mesh position={[sx * (CW / 2 - 0.12), FLOOR_Y + 1.8, z]}>
              <boxGeometry args={[0.15, 0.4, 0.15]} />
              <meshStandardMaterial color={0x3c4448} roughness={0.98} metalness={0.02} />
            </mesh>
            <mesh position={[sx * (CW / 2 - 0.12), FLOOR_Y + 1.9, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
              <meshStandardMaterial color={0xb0bcc8} roughness={0.08} metalness={0.98} />
            </mesh>
          </group>
        ))
      )}

      {/* ── Wall end caps at gate faces ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => (
        <group key={sx}>
          {/* Downstream gate face cap — closes the wall end at Z_JUS */}
          <mesh castShadow receiveShadow position={[sx * (CW / 2 + WT / 2), FLOOR_Y + WALL_H / 2, Z_JUS]}>
            <boxGeometry args={[WT + 0.1, WALL_H, 0.30]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
          {/* Upstream gate face cap — closes the wall end at Z_MON */}
          <mesh castShadow receiveShadow position={[sx * (CW / 2 + WT / 2), FLOOR_Y + WALL_H / 2, Z_MON]}>
            <boxGeometry args={[WT + 0.1, WALL_H, 0.30]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
          {/* Lateral closing wall at downstream — fills the open area between chamber wall and retention wall */}
          <mesh castShadow receiveShadow position={[sx * (CW / 2 + WT + walkW / 2), FLOOR_Y + WALL_H / 2, Z_JUS]}>
            <boxGeometry args={[walkW, WALL_H, 0.40]} />
            <meshStandardMaterial color={0x5a6268} roughness={0.96} metalness={0.04} />
          </mesh>
          {/* Lateral closing wall at upstream — same on montante side */}
          <mesh castShadow receiveShadow position={[sx * (CW / 2 + WT + walkW / 2), FLOOR_Y + WALL_H / 2, Z_MON]}>
            <boxGeometry args={[walkW, WALL_H, 0.40]} />
            <meshStandardMaterial color={0x5a6268} roughness={0.96} metalness={0.04} />
          </mesh>
        </group>
      ))}

      {/* ── Wall extensions at gates ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xE = sx * (CW / 2 + WT / 2 + 1.0)
        return (
          <group key={sx}>
            <mesh castShadow receiveShadow position={[xE, FLOOR_Y + WALL_H / 2, Z_JUS + EX / 2]}>
              <boxGeometry args={[WT + 1.8, WALL_H, EX]} />
              <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
            </mesh>
            <mesh castShadow receiveShadow position={[xE, FLOOR_Y + WALL_H / 2, Z_MON - EX / 2]}>
              <boxGeometry args={[WT + 1.8, WALL_H, EX]} />
              <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
            </mesh>
          </group>
        )
      })}

      {/* ── Walkways ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xW = sx * (CW / 2 + WT + walkW / 2)
        return (
          <group key={sx}>
            {/* Walkway slab */}
            <mesh castShadow receiveShadow position={[xW, WALL_TOP + 0.12, 0]}>
              <boxGeometry args={[walkW, 0.25, CL + EX * 2 + 3]} />
              <meshStandardMaterial color={0x606870} roughness={0.90} metalness={0.06} />
            </mesh>
            {/* Inner yellow stripe */}
            <mesh position={[sx * (CW / 2 + WT + 0.08), WALL_TOP + 0.25, 0]}>
              <boxGeometry args={[0.15, 0.03, CL + EX * 2 + 3]} />
              <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
            </mesh>
          </group>
        )
      })}

      {/* ── Horizontal safety markings on walkway ── */}
      {safetyZ.map(z => (
        <group key={z}>
          <mesh position={[-(CW / 2 + WT + 0.9), WALL_TOP + 0.24, z]}>
            <boxGeometry args={[0.14, 0.04, 1.8]} />
            <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[(CW / 2 + WT + 0.9), WALL_TOP + 0.24, z]}>
            <boxGeometry args={[0.14, 0.04, 1.8]} />
            <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15} emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── Handrails ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xIn = sx * (CW / 2 + WT + 0.10)
        const xOut = sx * (CW / 2 + WT + walkW - 0.10)
        return (
          <group key={sx}>
            <Railing xBase={xIn} zFrom={-CL / 2} zTo={CL / 2} />
            <Railing xBase={xOut} zFrom={-(CL / 2 + EX + 1.5)} zTo={(CL / 2 + EX + 1.5)} />
          </group>
        )
      })}

      {/* ── Retention walls ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => {
        const xM = sx * (CW / 2 + WT + walkW + 0.35)
        return (
          <mesh key={sx} castShadow position={[xM, WALL_TOP - 3.5, 0]}>
            <boxGeometry args={[0.55, 7.5, CL + 26]} />
            <meshStandardMaterial color={0x727870} roughness={0.94} metalness={0.02} />
          </mesh>
        )
      })}

      {/* ── Operator's cabin ── */}
      {/* Base/plinth */}
      <mesh castShadow position={[xCab, WALL_TOP + 0.30, -6]}>
        <boxGeometry args={[3.0, 0.35, 3.0]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.85} metalness={0.04} />
      </mesh>
      {/* Body */}
      <mesh castShadow position={[xCab, WALL_TOP + 1.62, -6]}>
        <boxGeometry args={[2.6, 2.5, 2.6]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.85} metalness={0.04} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[xCab, WALL_TOP + 2.90, -6]} rotation={[-0.06, 0, 0]}>
        <boxGeometry args={[3.0, 0.20, 3.0]} />
        <meshStandardMaterial color={0x283040} roughness={0.60} metalness={0.25} />
      </mesh>
      {/* Parapet front */}
      <mesh castShadow position={[xCab, WALL_TOP + 2.78, -6 + 1.4]}>
        <boxGeometry args={[3.0, 0.25, 0.12]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.85} metalness={0.04} />
      </mesh>
      {/* Parapet back */}
      <mesh castShadow position={[xCab, WALL_TOP + 2.78, -6 - 1.4]}>
        <boxGeometry args={[3.0, 0.25, 0.12]} />
        <meshStandardMaterial color={0x6a7278} roughness={0.85} metalness={0.04} />
      </mesh>
      {/* Windows */}
      <mesh position={[xCab - 1.31, WALL_TOP + 1.55, -6]}>
        <boxGeometry args={[0.08, 1.10, 2.10]} />
        <meshStandardMaterial color={0x80c0e0} roughness={0.06} metalness={0.4} transparent opacity={0.65} />
      </mesh>
      <mesh position={[xCab + 1.31, WALL_TOP + 1.55, -6]}>
        <boxGeometry args={[0.08, 1.10, 2.10]} />
        <meshStandardMaterial color={0x80c0e0} roughness={0.06} metalness={0.4} transparent opacity={0.65} />
      </mesh>
      <mesh position={[xCab, WALL_TOP + 1.55, -6 + 1.31]}>
        <boxGeometry args={[2.10, 1.10, 0.08]} />
        <meshStandardMaterial color={0x80c0e0} roughness={0.06} metalness={0.4} transparent opacity={0.65} />
      </mesh>
      <mesh position={[xCab, WALL_TOP + 1.55, -6 - 1.31]}>
        <boxGeometry args={[2.10, 1.10, 0.08]} />
        <meshStandardMaterial color={0x80c0e0} roughness={0.06} metalness={0.4} transparent opacity={0.65} />
      </mesh>
      {/* Antenna */}
      <mesh castShadow position={[xCab, WALL_TOP + 3.0, -6]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color={0x7c8890} roughness={0.35} metalness={0.92} />
      </mesh>
      {/* Antenna disk */}
      <mesh position={[xCab, WALL_TOP + 3.92, -6]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 8]} />
        <meshStandardMaterial color={0x606868} roughness={0.55} metalness={0.80} />
      </mesh>

      {/* ── Lamp posts — left side (4 posts) ── */}
      {([-9, -3, 3, 9] as number[]).map(lz => {
        const lx = -(CW / 2 + WT + walkW - 0.6)
        return (
          <group key={lz}>
            <mesh castShadow position={[lx, WALL_TOP + 1.9, lz]}>
              <boxGeometry args={[0.10, 3.8, 0.10]} />
              <meshStandardMaterial color={0x222830} roughness={0.55} metalness={0.70} />
            </mesh>
            <mesh castShadow position={[lx + 1.05, WALL_TOP + 3.54, lz]}>
              <boxGeometry args={[0.80, 0.18, 0.30]} />
              <meshStandardMaterial color={0x222830} roughness={0.55} metalness={0.70} />
            </mesh>
            <mesh position={[lx + 1.05, WALL_TOP + 3.46, lz]}>
              <boxGeometry args={[0.78, 0.06, 0.28]} />
              <meshStandardMaterial color={0xfffce8} roughness={0.18} metalness={0.45} emissive={new THREE.Color(0xffe080)} emissiveIntensity={1.4} />
            </mesh>
            <pointLight color={0xfff4c0} intensity={1.2} distance={18} position={[lx + 1.05, WALL_TOP + 3.3, lz]} />
          </group>
        )
      })}

      {/* ── Lamp posts — right side (3 posts) ── */}
      {([-6, 0, 6] as number[]).map(lz => {
        const lx = CW / 2 + WT + walkW - 0.6
        return (
          <group key={lz}>
            <mesh castShadow position={[lx, WALL_TOP + 1.9, lz]}>
              <boxGeometry args={[0.10, 3.8, 0.10]} />
              <meshStandardMaterial color={0x222830} roughness={0.55} metalness={0.70} />
            </mesh>
            <mesh castShadow position={[lx + 1.05, WALL_TOP + 3.54, lz]}>
              <boxGeometry args={[0.80, 0.18, 0.30]} />
              <meshStandardMaterial color={0x222830} roughness={0.55} metalness={0.70} />
            </mesh>
            <mesh position={[lx + 1.05, WALL_TOP + 3.46, lz]}>
              <boxGeometry args={[0.78, 0.06, 0.28]} />
              <meshStandardMaterial color={0xfffce8} roughness={0.18} metalness={0.45} emissive={new THREE.Color(0xffe080)} emissiveIntensity={1.4} />
            </mesh>
            <pointLight color={0xfff4c0} intensity={1.2} distance={18} position={[lx + 1.05, WALL_TOP + 3.3, lz]} />
          </group>
        )
      })}

      {/* ── LEFT SIDE: Douro river — water + rocky bank ── */}
      {/* River water — wider and taller for full visual coverage */}
      <mesh receiveShadow position={[-24, LOW_Y - 0.1, 0]}>
        <boxGeometry args={[34, 0.35, 90]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.04} metalness={0.45} transparent opacity={0.90} />
      </mesh>
      {/* River bed (depth illusion) */}
      <mesh position={[-24, soilY + 4, 0]}>
        <boxGeometry args={[34, 10, 90]} />
        <meshStandardMaterial color={0x0d3a7a} roughness={1.0} />
      </mesh>
      {/* Rocky bank — base layer between retention wall and river */}
      {(() => {
        const rockBaseX = -(CW / 2 + WT + walkW + 0.5)  // just outside walkway
        const rockColor1 = 0x4a4e52
        const rockColor2 = 0x3a3e42
        const rocks: React.JSX.Element[] = []
        const pattern: [number, number, number, number, number][] = [
          // [dx, dz, w, d, h]
          [0.0,  -18, 3.2, 4.0, 4.5],
          [-1.2, -12, 2.6, 3.2, 3.8],
          [0.5,  -6,  3.5, 3.8, 5.2],
          [-0.8,  0,  3.0, 4.2, 4.0],
          [0.3,   6,  3.4, 3.6, 4.8],
          [-1.0,  12, 2.8, 3.0, 3.5],
          [0.2,  18,  3.2, 4.0, 4.2],
          // smaller scattered rocks
          [-2.2, -15, 1.8, 2.0, 2.5],
          [-2.5, -4,  1.5, 1.8, 2.0],
          [-2.0,  9,  1.6, 2.2, 2.2],
          [-2.4,  20, 1.4, 1.6, 1.8],
          [1.2,  -10, 1.2, 1.4, 1.6],
          [1.4,   3,  1.0, 1.2, 1.4],
        ]
        pattern.forEach(([dx, dz, w, d, h], i) => (
          rocks.push(
            <mesh key={i} castShadow receiveShadow
              position={[rockBaseX + dx - w * 0.4, LOW_Y - h * 0.5 + 0.8, dz]}>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? rockColor1 : rockColor2}
                roughness={0.96} metalness={0.04}
              />
            </mesh>
          )
        ))
        return rocks
      })()}
      {/* Waterline stones — flat rocks at water edge */}
      {[-16, -10, -4, 2, 8, 14, -20, -7, 5, 11].map((dz, i) => (
        <mesh key={i} castShadow receiveShadow
          position={[-(CW / 2 + WT + walkW + 1.8 + (i % 3) * 0.4), LOW_Y + 0.05, dz]}>
          <boxGeometry args={[1.2 + (i % 3) * 0.3, 0.25, 0.8 + (i % 2) * 0.4]} />
          <meshStandardMaterial color={0x505458} roughness={0.98} metalness={0.02} />
        </mesh>
      ))}

      {/* ── Green area (right side) ── */}
      {(() => {
        const greenH = WALL_TOP - soilY + 0.5  // 25.5
        return (
          <mesh position={[(CW / 2 + WT + walkW + 7), soilY + greenH / 2, 0]}>
            <boxGeometry args={[14, greenH, CL + 30]} />
            <meshStandardMaterial color={0x3a6a24} roughness={1.0} />
          </mesh>
        )
      })()}

      {/* ── Exterior rivers ── */}
      {/* Downstream river surface — wide enough to cover full structure + surroundings */}
      <mesh position={[0, LOW_Y, Z_JUS + 17]}>
        <boxGeometry args={[CW * 5, 0.28, 36]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.04} metalness={0.45} transparent opacity={0.88} />
      </mesh>
      {/* Downstream river bed (gives depth) */}
      <mesh position={[0, LOW_Y - 4, Z_JUS + 17]}>
        <boxGeometry args={[CW * 5, 8, 36]} />
        <meshStandardMaterial color={0x0d3a7a} roughness={1.0} />
      </mesh>

      {/* Upstream river surface */}
      <mesh position={[0, HIGH_Y, Z_MON - 17]}>
        <boxGeometry args={[CW * 5, 0.28, 36]} />
        <meshStandardMaterial color={0x1976d2} roughness={0.04} metalness={0.45} transparent opacity={0.88} />
      </mesh>
      {/* Upstream river bed (gives depth) */}
      <mesh position={[0, HIGH_Y - 4, Z_MON - 17]}>
        <boxGeometry args={[CW * 5, 8, 36]} />
        <meshStandardMaterial color={0x0d3a7a} roughness={1.0} />
      </mesh>

      {/* ── River banks — positioned beyond wider river surface ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => (
        <group key={sx}>
          <mesh castShadow position={[sx * (CW * 2.8 + 2), LOW_Y - 3, Z_JUS + 17]}>
            <boxGeometry args={[4, 6, 38]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
          <mesh castShadow position={[sx * (CW * 2.8 + 2), HIGH_Y - 3.5, Z_MON - 17]}>
            <boxGeometry args={[4, 7, 38]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
        </group>
      ))}

      {/* ── Trees on right bank ── */}
      {treeDataR.map(([tz, h, type], i) => (
        <Tree key={i} tz={tz} h={h} type={type} />
      ))}
    </group>
  )
}
