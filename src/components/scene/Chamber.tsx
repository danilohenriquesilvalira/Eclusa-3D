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
          <meshStandardMaterial color={0x303434} roughness={0.95} metalness={0.05} />
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
          <mesh key={sx} castShadow position={[xM, FLOOR_Y + WALL_H / 2, 0]}>
            <boxGeometry args={[0.55, WALL_H, CL + 26]} />
            <meshStandardMaterial color={0x727870} roughness={0.94} metalness={0.02} />
          </mesh>
        )
      })}

      {/* ── Transverse bridge on jusante side ── */}
      {(() => {
        const bW     = 2.5
        const zFrom  = CL / 2 + EX + 1.5          // 16.1
        const zTo    = zFrom + bW                  // 18.6
        const zCtr   = (zFrom + zTo) / 2
        const xFrom  = -(CW / 2 + WT + walkW)     // -10.65
        const xTo    = CW / 2 + WT + walkW         // +10.65
        const bLen   = xTo - xFrom
        const xCtr   = (xFrom + xTo) / 2
        const nPost  = 9
        const postXs = Array.from({ length: nPost }, (_, i) => xFrom + i * bLen / (nPost - 1))

        return (
          <group>
            {/* Slab */}
            <mesh castShadow receiveShadow position={[xCtr, WALL_TOP + 0.12, zCtr]}>
              <boxGeometry args={[bLen, 0.25, bW]} />
              <meshStandardMaterial color={0x606870} roughness={0.90} metalness={0.06} />
            </mesh>
            {/* Safety edge stripes */}
            {[zFrom + 0.08, zTo - 0.08].map((zs, i) => (
              <mesh key={i} position={[xCtr, WALL_TOP + 0.25, zs]}>
                <boxGeometry args={[bLen, 0.03, 0.14]} />
                <meshStandardMaterial color={0xd4a010} roughness={0.52} metalness={0.15}
                  emissive={new THREE.Color(0x3a2800)} emissiveIntensity={0.3} />
              </mesh>
            ))}
            {/* Railing posts */}
            {postXs.map((px, i) => (
              <group key={i}>
                {[zFrom + 0.10, zTo - 0.10].map((zp, j) => (
                  <mesh key={j} castShadow position={[px, WALL_TOP + 0.70, zp]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.15, 8]} />
                    <meshStandardMaterial color={0x6a7278} roughness={0.42} metalness={0.88} />
                  </mesh>
                ))}
              </group>
            ))}
            {/* Railing top bars — downstream bar has gap at left end for shed access */}
            {/* Upstream bar: full length */}
            <mesh castShadow position={[xCtr, WALL_TOP + 1.20, zFrom + 0.10]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, bLen + 0.1, 8]} />
              <meshStandardMaterial color={0x909898} roughness={0.32} metalness={0.92} />
            </mesh>
            {/* Downstream bar: gap at left end aligned with shed door (shed door center x = -8.15, doorW=1.60) */}
            <mesh castShadow position={[(-7.15 + xTo) / 2, WALL_TOP + 1.20, zTo - 0.10]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, xTo - (-7.15), 8]} />
              <meshStandardMaterial color={0x909898} roughness={0.32} metalness={0.92} />
            </mesh>
          </group>
        )
      })()}

      {/* ── Operator's cabin (near jusante semaphore) ── */}
      {(() => {
        const cabZ    = 11.0
        const colH    = 4.5
        const cabFlr  = WALL_TOP + colH
        const cabFlrY = cabFlr + 0.22

        const cabHalf = 1.10
        const cabH    = 2.4
        const wT      = 0.14
        const doorW   = 0.80, doorH = 1.75
        const sideWW  = cabHalf - doorW / 2

        // Staircase on -z side (door on -z face)
        const sColZ    = cabZ - cabHalf - 1.0   // = cabZ - 2.10
        const stepN    = 16
        const stepInR  = 0.25, stepOutR = 1.0
        const stepMidR = 0.625
        const stepW    = 0.50, stepT = 0.12, railH = 0.88
        // starts -z (away from cabin), ends +z (arrives at -z door face)
        const totalAng = Math.PI * 3
        const stepY = (i: number) =>
          WALL_TOP + 0.22 + (i / (stepN - 1)) * (colH - 0.06)
        const stepA = (i: number) =>
          -Math.PI / 2 + (i / (stepN - 1)) * totalAng
        const yAxis = new THREE.Vector3(0, 1, 0)

        return (
          <group>
            {/* Main support column */}
            <mesh castShadow position={[xCab, WALL_TOP + colH / 2, cabZ]}>
              <cylinderGeometry args={[0.18, 0.22, colH, 12]} />
              <meshStandardMaterial color={0x485058} roughness={0.55} metalness={0.70} />
            </mesh>
            {/* Platform */}
            <mesh castShadow receiveShadow position={[xCab, cabFlr + 0.11, cabZ]}>
              <boxGeometry args={[2.50, 0.22, 2.50]} />
              <meshStandardMaterial color={0x5a6068} roughness={0.88} metalness={0.06} />
            </mesh>

            {/* Staircase column on -z side */}
            <mesh castShadow position={[xCab, WALL_TOP + colH / 2, sColZ]}>
              <cylinderGeometry args={[0.10, 0.13, colH, 10]} />
              <meshStandardMaterial color={0x485058} roughness={0.55} metalness={0.70} />
            </mesh>
            {/* Brace: stair column → platform */}
            <mesh castShadow position={[xCab, cabFlr + 0.06, cabZ - cabHalf - 0.50]}>
              <boxGeometry args={[0.18, 0.18, 1.02]} />
              <meshStandardMaterial color={0x485058} roughness={0.55} metalness={0.70} />
            </mesh>

            {/* Spiral steps */}
            {Array.from({ length: stepN }, (_, i) => {
              const ang = stepA(i)
              const y   = stepY(i)
              const cx  = xCab  + stepMidR * Math.cos(ang)
              const cz  = sColZ + stepMidR * Math.sin(ang)
              return (
                <group key={`st${i}`}>
                  <mesh castShadow receiveShadow
                    position={[cx, y + stepT / 2, cz]}
                    rotation={[0, -ang, 0]}>
                    <boxGeometry args={[stepOutR - stepInR, stepT, stepW]} />
                    <meshStandardMaterial color={0x505860} roughness={0.88} metalness={0.14} />
                  </mesh>
                  <mesh castShadow position={[
                    xCab  + stepOutR * Math.cos(ang),
                    y + stepT + railH / 2,
                    sColZ + stepOutR * Math.sin(ang)
                  ]}>
                    <cylinderGeometry args={[0.036, 0.036, railH, 7]} />
                    <meshStandardMaterial color={0x8a9298} roughness={0.35} metalness={0.90} />
                  </mesh>
                  <mesh castShadow position={[
                    xCab  + (0.13 + 0.02) * Math.cos(ang),
                    y + stepT / 2,
                    sColZ + (0.13 + 0.02) * Math.sin(ang)
                  ]}>
                    <cylinderGeometry args={[0.032, 0.032, stepT + 0.12, 6]} />
                    <meshStandardMaterial color={0x8a9298} roughness={0.35} metalness={0.90} />
                  </mesh>
                </group>
              )
            })}

            {/* Helical handrail */}
            {Array.from({ length: stepN - 1 }, (_, i) => {
              const a0 = stepA(i),     y0 = stepY(i)     + stepT + railH
              const a1 = stepA(i + 1), y1 = stepY(i + 1) + stepT + railH
              const x0 = xCab + stepOutR * Math.cos(a0), z0 = sColZ + stepOutR * Math.sin(a0)
              const x1 = xCab + stepOutR * Math.cos(a1), z1 = sColZ + stepOutR * Math.sin(a1)
              const dx = x1-x0, dy = y1-y0, dz = z1-z0
              const segLen = Math.sqrt(dx*dx + dy*dy + dz*dz)
              const dir  = new THREE.Vector3(dx, dy, dz).normalize()
              const quat = new THREE.Quaternion().setFromUnitVectors(yAxis, dir)
              const euler = new THREE.Euler().setFromQuaternion(quat)
              return (
                <mesh key={`rr${i}`} castShadow
                  position={[(x0+x1)/2, (y0+y1)/2, (z0+z1)/2]} rotation={euler}>
                  <cylinderGeometry args={[0.038, 0.038, segLen + 0.01, 7]} />
                  <meshStandardMaterial color={0x909898} roughness={0.30} metalness={0.92} />
                </mesh>
              )
            })}

            {/* ── Cabin walls (door gap on -z face) ── */}
            {/* +z front observation wall — panoramic window frame + glass */}
            <mesh castShadow position={[xCab, cabFlrY + cabH - 0.13, cabZ + cabHalf]}>
              <boxGeometry args={[cabHalf*2, 0.26, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab, cabFlrY + 0.18, cabZ + cabHalf]}>
              <boxGeometry args={[cabHalf*2, 0.36, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab - cabHalf + 0.10, cabFlrY + cabH / 2, cabZ + cabHalf]}>
              <boxGeometry args={[0.20, cabH, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab + cabHalf - 0.10, cabFlrY + cabH / 2, cabZ + cabHalf]}>
              <boxGeometry args={[0.20, cabH, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh position={[xCab, cabFlrY + 0.36 + (cabH - 0.62) / 2, cabZ + cabHalf + 0.01]}>
              <boxGeometry args={[cabHalf * 2 - 0.40, cabH - 0.62, 0.06]} />
              <meshStandardMaterial color={0x80c8ee} roughness={0.04} metalness={0.30} transparent opacity={0.70} />
            </mesh>
            {/* -x left wall — panoramic window facing lock */}
            <mesh castShadow position={[xCab - cabHalf, cabFlrY + cabH - 0.13, cabZ]}>
              <boxGeometry args={[wT, 0.26, cabHalf*2]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab - cabHalf, cabFlrY + 0.18, cabZ]}>
              <boxGeometry args={[wT, 0.36, cabHalf*2]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab - cabHalf, cabFlrY + cabH / 2, cabZ + cabHalf - 0.10]}>
              <boxGeometry args={[wT, cabH, 0.20]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[xCab - cabHalf, cabFlrY + cabH / 2, cabZ - cabHalf + 0.10]}>
              <boxGeometry args={[wT, cabH, 0.20]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            <mesh position={[xCab - cabHalf - 0.01, cabFlrY + 0.36 + (cabH - 0.62) / 2, cabZ]}>
              <boxGeometry args={[0.06, cabH - 0.62, cabHalf * 2 - 0.40]} />
              <meshStandardMaterial color={0x80c8ee} roughness={0.04} metalness={0.30} transparent opacity={0.70} />
            </mesh>
            {/* +x right wall */}
            <mesh castShadow position={[xCab + cabHalf, cabFlrY + cabH/2, cabZ]}>
              <boxGeometry args={[wT, cabH, cabHalf*2]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            {/* -z front — left panel */}
            <mesh castShadow position={[xCab - doorW/2 - sideWW/2, cabFlrY + cabH/2, cabZ - cabHalf]}>
              <boxGeometry args={[sideWW, cabH, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            {/* -z front — right panel */}
            <mesh castShadow position={[xCab + doorW/2 + sideWW/2, cabFlrY + cabH/2, cabZ - cabHalf]}>
              <boxGeometry args={[sideWW, cabH, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            {/* -z front — top above door */}
            <mesh castShadow position={[xCab, cabFlrY + doorH + (cabH - doorH)/2, cabZ - cabHalf]}>
              <boxGeometry args={[doorW, cabH - doorH, wT]} />
              <meshStandardMaterial color={0x72787e} roughness={0.82} metalness={0.04} />
            </mesh>
            {/* Floor */}
            <mesh receiveShadow position={[xCab, cabFlrY + 0.06, cabZ]}>
              <boxGeometry args={[cabHalf*2, 0.12, cabHalf*2]} />
              <meshStandardMaterial color={0x545c62} roughness={0.88} metalness={0.04} />
            </mesh>
            {/* Ceiling */}
            <mesh castShadow position={[xCab, cabFlrY + cabH - 0.06, cabZ]}>
              <boxGeometry args={[cabHalf*2, 0.12, cabHalf*2]} />
              <meshStandardMaterial color={0x545c62} roughness={0.88} metalness={0.04} />
            </mesh>
            {/* Dark interior backdrop (shallow, so windows stay clear) */}
            <mesh position={[xCab + 0.30, cabFlrY + cabH / 2, cabZ - 0.20]}>
              <boxGeometry args={[cabHalf * 2 - wT * 2 - 0.50, cabH - 0.40, cabHalf * 2 - wT * 2 - 0.50]} />
              <meshStandardMaterial color={0x181c20} roughness={1.0} metalness={0} />
            </mesh>

            {/* Door frame */}
            <mesh castShadow position={[xCab - doorW/2 - 0.056, cabFlrY + doorH/2, cabZ - cabHalf]}>
              <boxGeometry args={[0.10, doorH + 0.08, wT + 0.08]} />
              <meshStandardMaterial color={0xc8ccc8} roughness={0.60} metalness={0.06} />
            </mesh>
            <mesh castShadow position={[xCab + doorW/2 + 0.056, cabFlrY + doorH/2, cabZ - cabHalf]}>
              <boxGeometry args={[0.10, doorH + 0.08, wT + 0.08]} />
              <meshStandardMaterial color={0xc8ccc8} roughness={0.60} metalness={0.06} />
            </mesh>
            <mesh castShadow position={[xCab, cabFlrY + doorH + 0.054, cabZ - cabHalf]}>
              <boxGeometry args={[doorW + 0.24, 0.10, wT + 0.08]} />
              <meshStandardMaterial color={0xc8ccc8} roughness={0.60} metalness={0.06} />
            </mesh>

            {/* White door leaf (slightly ajar) */}
            <mesh castShadow
              position={[xCab + doorW/2 - 0.04, cabFlrY + doorH/2, cabZ - cabHalf - 0.06]}
              rotation={[0, Math.PI / 5, 0]}>
              <boxGeometry args={[doorW - 0.06, doorH - 0.04, 0.045]} />
              <meshStandardMaterial color={0xf2f4f2} roughness={0.70} metalness={0.04} />
            </mesh>
            {/* Handle */}
            <mesh castShadow
              position={[xCab - 0.08, cabFlrY + doorH * 0.44, cabZ - cabHalf - 0.10]}
              rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.20, 6]} />
              <meshStandardMaterial color={0xd4a010} roughness={0.28} metalness={0.85} />
            </mesh>

            {/* Small window on +x side wall */}
            <mesh position={[xCab + cabHalf + 0.01, cabFlrY + 1.32, cabZ]}>
              <boxGeometry args={[0.06, 0.75, 0.90]} />
              <meshStandardMaterial color={0x80c8ee} roughness={0.04} metalness={0.30} transparent opacity={0.70} />
            </mesh>

            {/* Roof */}
            <mesh castShadow position={[xCab, cabFlrY + cabH + 0.10, cabZ]}>
              <boxGeometry args={[cabHalf*2 + 0.32, 0.20, cabHalf*2 + 0.32]} />
              <meshStandardMaterial color={0x283040} roughness={0.60} metalness={0.25} />
            </mesh>
            <mesh castShadow position={[xCab, cabFlrY + cabH + 0.22, cabZ]}>
              <cylinderGeometry args={[0.04, 0.04, 1.80, 6]} />
              <meshStandardMaterial color={0x7c8890} roughness={0.35} metalness={0.92} />
            </mesh>
            <mesh position={[xCab, cabFlrY + cabH + 1.12, cabZ]}>
              <cylinderGeometry args={[0.20, 0.20, 0.08, 8]} />
              <meshStandardMaterial color={0x606868} roughness={0.55} metalness={0.80} />
            </mesh>
          </group>
        )
      })()}

      {/* ── Lamp posts — left side (4 posts) ── */}
      {([-9, -3, 3, 9] as number[]).map(lz => {
        const lx = -(CW / 2 + WT + walkW - 0.6)
        const poleH = 3.90
        const poleTopY = WALL_TOP + 0.22 + poleH
        const armLen = 1.45
        const lampX = lx + armLen + 0.10  // arm toward lock (+x)
        return (
          <group key={lz}>
            {/* Flared base */}
            <mesh castShadow position={[lx, WALL_TOP + 0.11, lz]}>
              <cylinderGeometry args={[0.14, 0.22, 0.22, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Tapered lower pole */}
            <mesh castShadow position={[lx, WALL_TOP + 0.22 + poleH * 0.55 / 2, lz]}>
              <cylinderGeometry args={[0.060, 0.118, poleH * 0.55, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Straight upper pole */}
            <mesh castShadow position={[lx, WALL_TOP + 0.22 + poleH * 0.55 + poleH * 0.45 / 2, lz]}>
              <cylinderGeometry args={[0.050, 0.060, poleH * 0.45, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Top collar */}
            <mesh castShadow position={[lx, poleTopY + 0.04, lz]}>
              <cylinderGeometry args={[0.075, 0.058, 0.14, 8]} />
              <meshStandardMaterial color={0x2a3440} roughness={0.44} metalness={0.82} />
            </mesh>
            {/* Horizontal arm toward lock */}
            <mesh castShadow position={[lx + armLen / 2, poleTopY + 0.11, lz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.030, 0.042, armLen, 6]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Lamp housing */}
            <mesh castShadow position={[lampX, poleTopY + 0.08, lz]}>
              <boxGeometry args={[0.22, 0.22, 0.46]} />
              <meshStandardMaterial color={0x242c36} roughness={0.60} metalness={0.60} />
            </mesh>
            {/* LED emissive panel */}
            <mesh position={[lampX, poleTopY - 0.03, lz]}>
              <boxGeometry args={[0.20, 0.06, 0.42]} />
              <meshStandardMaterial color={0xfffce8} roughness={0.14} metalness={0.44}
                emissive={new THREE.Color(0xffe090)} emissiveIntensity={2.0} />
            </mesh>
            <pointLight color={0xfff4c0} intensity={1.5} distance={22} position={[lampX, poleTopY - 0.35, lz]} />
          </group>
        )
      })}

      {/* ── Lamp posts — right side (3 posts) ── */}
      {([-6, 0, 6] as number[]).map(lz => {
        const lx = CW / 2 + WT + walkW - 0.6
        const poleH = 3.90
        const poleTopY = WALL_TOP + 0.22 + poleH
        const armLen = 1.45
        const lampX = lx - armLen - 0.10  // arm toward lock (-x)
        return (
          <group key={lz}>
            {/* Flared base */}
            <mesh castShadow position={[lx, WALL_TOP + 0.11, lz]}>
              <cylinderGeometry args={[0.14, 0.22, 0.22, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Tapered lower pole */}
            <mesh castShadow position={[lx, WALL_TOP + 0.22 + poleH * 0.55 / 2, lz]}>
              <cylinderGeometry args={[0.060, 0.118, poleH * 0.55, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Straight upper pole */}
            <mesh castShadow position={[lx, WALL_TOP + 0.22 + poleH * 0.55 + poleH * 0.45 / 2, lz]}>
              <cylinderGeometry args={[0.050, 0.060, poleH * 0.45, 8]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Top collar */}
            <mesh castShadow position={[lx, poleTopY + 0.04, lz]}>
              <cylinderGeometry args={[0.075, 0.058, 0.14, 8]} />
              <meshStandardMaterial color={0x2a3440} roughness={0.44} metalness={0.82} />
            </mesh>
            {/* Horizontal arm toward lock */}
            <mesh castShadow position={[lx - armLen / 2, poleTopY + 0.11, lz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.030, 0.042, armLen, 6]} />
              <meshStandardMaterial color={0x1e2530} roughness={0.55} metalness={0.72} />
            </mesh>
            {/* Lamp housing */}
            <mesh castShadow position={[lampX, poleTopY + 0.08, lz]}>
              <boxGeometry args={[0.22, 0.22, 0.46]} />
              <meshStandardMaterial color={0x242c36} roughness={0.60} metalness={0.60} />
            </mesh>
            {/* LED emissive panel */}
            <mesh position={[lampX, poleTopY - 0.03, lz]}>
              <boxGeometry args={[0.20, 0.06, 0.42]} />
              <meshStandardMaterial color={0xfffce8} roughness={0.14} metalness={0.44}
                emissive={new THREE.Color(0xffe090)} emissiveIntensity={2.0} />
            </mesh>
            <pointLight color={0xfff4c0} intensity={1.5} distance={22} position={[lampX, poleTopY - 0.35, lz]} />
          </group>
        )
      })}

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
      {/* Downstream — narrow gate mouth (fits within wall extensions, no intersection) */}
      <mesh position={[0, LOW_Y + 0.05, Z_JUS + (EX + 0.5) / 2]}>
        <boxGeometry args={[CW - 0.2, 0.28, EX + 0.5]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.85} />
      </mesh>
      {/* Downstream — wide approach channel after wall extensions */}
      <mesh position={[0, LOW_Y, Z_JUS + EX + 0.5 + 15]}>
        <boxGeometry args={[CW * 1.8, 0.25, 30]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.85} />
      </mesh>

      {/* Upstream — narrow gate mouth */}
      <mesh position={[0, 2 + 0.05, Z_MON - (EX + 0.5) / 2]}>
        <boxGeometry args={[CW - 0.2, 0.28, EX + 0.5]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.85} />
      </mesh>
      {/* Upstream — wide approach channel after wall extensions */}
      <mesh position={[0, 2, Z_MON - EX - 0.5 - 15]}>
        <boxGeometry args={[CW * 1.8, 0.25, 30]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.85} />
      </mesh>

      {/* ── River banks ── */}
      {([-1, 1] as (1 | -1)[]).map(sx => (
        <group key={sx}>
          <mesh castShadow position={[sx * (CW / 2 * 1.8 + 2), LOW_Y - 3, Z_JUS + 17]}>
            <boxGeometry args={[4, 6, 36]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
          <mesh castShadow position={[sx * (CW / 2 * 1.8 + 2), 2 - 3.5, Z_MON - 17]}>
            <boxGeometry args={[4, 7, 36]} />
            <meshStandardMaterial color={0x5c6268} roughness={0.96} metalness={0.04} />
          </mesh>
        </group>
      ))}

      {/* ── Machine shed (left side, end of retention wall) ── */}
      {(() => {
        const shedW = 5.60
        const shedL = 5.00
        const shedH = 3.20
        const shedX = -(CW / 2 + WT + walkW) + shedW / 2   // -7.85
        const shedZ = 23.00
        const flY   = WALL_TOP                               // 6.0
        const embed = 0.15
        const ovhg  = 0.35

        const wallClr = 0x8090a0
        const roofClr = 0x4a5858
        const trimClr = 0xd8d4c8
        const doorW   = 1.70
        const doorH   = 2.30
        const winSz   = 0.90
        const wCY     = flY - embed / 2 + shedH / 2
        const wHt     = shedH + embed

        return (
          <group>
            {/* ── Walls (DoubleSide + metalness 0 → no green reflection, no see-through) ── */}
            {/* Back wall */}
            <mesh castShadow receiveShadow position={[shedX, wCY, shedZ + shedL / 2 - 0.10]}>
              <boxGeometry args={[shedW, wHt, 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Outer (−x) wall */}
            <mesh castShadow receiveShadow position={[shedX - shedW / 2 + 0.10, wCY, shedZ]}>
              <boxGeometry args={[0.20, wHt, shedL - 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Inner (+x) wall */}
            <mesh castShadow receiveShadow position={[shedX + shedW / 2 - 0.10, wCY, shedZ]}>
              <boxGeometry args={[0.20, wHt, shedL - 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Front wall — left of door */}
            <mesh castShadow receiveShadow
              position={[shedX - doorW / 2 - (shedW / 2 - doorW / 2) / 2, wCY, shedZ - shedL / 2 + 0.10]}>
              <boxGeometry args={[shedW / 2 - doorW / 2, wHt, 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Front wall — right of door */}
            <mesh castShadow receiveShadow
              position={[shedX + doorW / 2 + (shedW / 2 - doorW / 2) / 2, wCY, shedZ - shedL / 2 + 0.10]}>
              <boxGeometry args={[shedW / 2 - doorW / 2, wHt, 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>
            {/* Front wall — lintel above door */}
            <mesh castShadow receiveShadow
              position={[shedX, flY + doorH + (shedH - doorH) / 2, shedZ - shedL / 2 + 0.10]}>
              <boxGeometry args={[doorW + 0.06, shedH - doorH, 0.20]} />
              <meshStandardMaterial color={wallClr} roughness={0.92} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>

            {/* ── Flat roof — raised above wall tops to avoid z-fighting ── */}
            <mesh castShadow receiveShadow position={[shedX, flY + shedH + 0.15, shedZ]}>
              <boxGeometry args={[shedW + ovhg * 2, 0.22, shedL + ovhg * 2]} />
              <meshStandardMaterial color={roofClr} roughness={0.88} metalness={0.08} />
            </mesh>

            {/* ── Door ── */}
            <mesh position={[shedX, flY + doorH / 2, shedZ - shedL / 2 - 0.01]}>
              <boxGeometry args={[doorW + 0.16, doorH + 0.12, 0.10]} />
              <meshStandardMaterial color={trimClr} roughness={0.80} metalness={0.08} />
            </mesh>
            <mesh position={[shedX, flY + doorH / 2, shedZ - shedL / 2 - 0.06]}>
              <boxGeometry args={[doorW - 0.08, doorH, 0.06]} />
              <meshStandardMaterial color={0x3a4848} roughness={0.60} metalness={0.50} />
            </mesh>
            <mesh position={[shedX + doorW * 0.28, flY + doorH * 0.48, shedZ - shedL / 2 - 0.10]}
              rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.18, 8]} />
              <meshStandardMaterial color={0xc8a010} roughness={0.28} metalness={0.92} />
            </mesh>
            <mesh position={[shedX, flY + 0.03, shedZ - shedL / 2 - 0.07]}>
              <boxGeometry args={[doorW + 0.12, 0.08, 0.05]} />
              <meshStandardMaterial color={0xd4a010} roughness={0.50} metalness={0.16} />
            </mesh>

            {/* ── Window on back wall (outside, no z-fight, non-transparent) ── */}
            <mesh position={[shedX, flY + 1.80, shedZ + shedL / 2 + 0.02]}>
              <boxGeometry args={[winSz, winSz, 0.07]} />
              <meshStandardMaterial color={0x6090a8} roughness={0.10} metalness={0.15} />
            </mesh>
            {([[-winSz/2,0],[winSz/2,0],[0,-winSz/2],[0,winSz/2]] as [number,number][]).map(([dx,dy],i) => (
              <mesh key={i} position={[shedX+dx*0.97, flY+1.80+dy*0.47, shedZ+shedL/2+0.03]}>
                <boxGeometry args={[i<2?0.07:winSz+0.08, i<2?winSz+0.08:0.07, 0.06]} />
                <meshStandardMaterial color={trimClr} roughness={0.78} metalness={0.08} />
              </mesh>
            ))}

            {/* ── Security camera ── */}
            <mesh castShadow position={[shedX, flY+shedH+0.35, shedZ-shedL/2-0.06]}>
              <boxGeometry args={[0.20, 0.10, 0.12]} />
              <meshStandardMaterial color={0x282828} roughness={0.58} metalness={0.55} />
            </mesh>
            <mesh castShadow position={[shedX, flY+shedH+0.35, shedZ-shedL/2-0.20]} rotation={[0.22,0,0]}>
              <boxGeometry args={[0.05, 0.05, 0.20]} />
              <meshStandardMaterial color={0x181818} roughness={0.55} metalness={0.72} />
            </mesh>
            <mesh castShadow position={[shedX, flY+shedH+0.24, shedZ-shedL/2-0.30]} rotation={[0.28,0,0]}>
              <boxGeometry args={[0.13, 0.10, 0.26]} />
              <meshStandardMaterial color={0x282828} roughness={0.52} metalness={0.62} />
            </mesh>
            <mesh castShadow position={[shedX, flY+shedH+0.22, shedZ-shedL/2-0.43]} rotation={[0.28,0,0]}>
              <cylinderGeometry args={[0.033, 0.040, 0.06, 12]} />
              <meshStandardMaterial color={0x101010} roughness={0.10} metalness={0.92} />
            </mesh>
          </group>
        )
      })()}

      {/* ── Trees on right bank ── */}
      {treeDataR.map(([tz, h, type], i) => (
        <Tree key={i} tz={tz} h={h} type={type} />
      ))}
    </group>
  )
}
