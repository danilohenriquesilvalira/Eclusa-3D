import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LOW_Y, HIGH_Y, CW, CL } from '../../constants'
import { useSimStore } from '../../store/simulation'

export function Water() {
  const waterLevel = useSimStore(s => s.waterLevel)
  const wlRef = useRef(waterLevel)
  wlRef.current = waterLevel

  const surfRef = useRef<THREE.Mesh>(null)
  const matRef  = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const wl = wlRef.current
    const wY = LOW_Y + wl * (HIGH_Y - LOW_Y)
    if (surfRef.current) surfRef.current.position.y = wY
    if (matRef.current) {
      matRef.current.color.setHex(0x1565c0)
    }
  })

  return (
    <mesh
      ref={surfRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, LOW_Y, 0]}
    >
      <planeGeometry args={[CW - 0.1, CL - 0.1]} />
      <meshStandardMaterial
        ref={matRef}
        color={0x1565c0}
        roughness={0.05}
        metalness={0.35}
        transparent
        opacity={0.85}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}
