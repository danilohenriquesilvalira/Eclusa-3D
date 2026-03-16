import * as THREE from 'three'
import { LOW_Y, HIGH_Y, WALL_TOP } from '../../constants'
import { useSimStore } from '../../store/simulation'
import type { SemColor } from '../../store/simulation'

function SemLight({ color, active, pos }: { color: number; activeColor: number; active: boolean; pos: [number, number, number] }) {
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.12, 14, 10]} />
      <meshStandardMaterial
        color={active ? color : 0x111111}
        emissive={new THREE.Color(active ? color : 0)}
        emissiveIntensity={active ? 4.0 : 0}
        roughness={0.3}
        metalness={0.05}
      />
    </mesh>
  )
}

function Semaphore({ x, z, state }: { x: number; z: number; state: SemColor }) {
  const y = WALL_TOP - 1.0
  return (
    <group>
      {/* Pole */}
      <mesh castShadow position={[x, y + 1.7, z]}>
        <cylinderGeometry args={[0.09, 0.09, 3.4, 8]} />
        <meshStandardMaterial color={0x1c2026} roughness={0.65} metalness={0.78} />
      </mesh>
      {/* Box */}
      <mesh castShadow position={[x, y + 3.60, z]}>
        <boxGeometry args={[0.42, 1.10, 0.32]} />
        <meshStandardMaterial color={0x141618} roughness={0.72} metalness={0.55} />
      </mesh>
      {/* Lights */}
      <SemLight color={0xff1100} activeColor={0xff1100} active={state === 'red'} pos={[x, y + 3.98, z + 0.08]} />
      <SemLight color={0xffaa00} activeColor={0xffaa00} active={state === 'yellow'} pos={[x, y + 3.61, z + 0.08]} />
      <SemLight color={0x00ff44} activeColor={0x00ff44} active={state === 'green'} pos={[x, y + 3.24, z + 0.08]} />
    </group>
  )
}

export function TrafficLights() {
  const semJus = useSimStore(s => s.semJus)
  const semMon = useSimStore(s => s.semMon)
  const xL = -5.5, xR = 5.5
  const zJ = 13 + 1.8, zM = -13 - 1.8

  return (
    <group>
      <Semaphore x={xL} z={zJ} state={semJus} />
      <Semaphore x={xR} z={zJ} state={semJus} />
      <Semaphore x={xL} z={zM} state={semMon} />
      <Semaphore x={xR} z={zM} state={semMon} />
    </group>
  )
}
