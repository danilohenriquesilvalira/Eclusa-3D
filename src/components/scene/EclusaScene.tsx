import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky, Cloud } from '@react-three/drei'
import * as THREE from 'three'
import { Chamber } from './Chamber'
import { Water } from './Water'
import { DownstreamGate, type DownstreamGateHandle } from './DownstreamGate'
import { UpstreamGate, type UpstreamGateHandle } from './UpstreamGate'
import { Boat, type BoatHandle } from './Boat'
import { TrafficLights } from './TrafficLights'
import { LOW_Y, HIGH_Y } from '../../constants'
import { useSimStore } from '../../store/simulation'
import { runSubida, runDescida } from '../../lib/sequences'

function Lighting() {
  const wBounceRef = useRef<THREE.PointLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const waterLevel = useSimStore(s => s.waterLevel)
  const wlRef = useRef(0)
  const tRef = useRef(0)

  useFrame((_, delta) => {
    tRef.current += delta
    wlRef.current = waterLevel
    const t = tRef.current
    const wl = wlRef.current
    const wY = LOW_Y + wl * (HIGH_Y - LOW_Y)
    if (wBounceRef.current) {
      wBounceRef.current.position.set(0, wY + 0.5, 0)
      wBounceRef.current.intensity = 6.0 + Math.sin(t * 1.3) * 1.5
      wBounceRef.current.color.setHSL(0.56 + wl * 0.04, 0.80, 0.55)
    }
    if (sunRef.current) {
      sunRef.current.intensity = 4.5 + Math.sin(t * 0.06) * 0.4
      sunRef.current.color.setHSL(0.10 + Math.sin(t * 0.04) * 0.02, 0.85, 0.75)
    }
  })

  return (
    <>
      <ambientLight color={0x6080a8} intensity={3.5} />
      <directionalLight
        ref={sunRef}
        color={0xffe0a0}
        intensity={4.5}
        position={[-20, 18, -30]}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-far={200}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight color={0x80b0ff} intensity={1.8} position={[25, 20, 15]} />
      <directionalLight color={0xb0c8e8} intensity={1.2} position={[10, 5, 25]} />
      <pointLight ref={wBounceRef} color={0x29b6f6} intensity={7.0} distance={40} position={[0, LOW_Y + 0.5, 0]} />
      <pointLight color={0x4fc3f7} intensity={3.0} distance={25} position={[0, LOW_Y + 3, 0]} />
      {/* Front fill — illuminates downstream gate from camera side */}
      <directionalLight color={0xc0d8f0} intensity={2.5} position={[0, 8, 50]} />
    </>
  )
}

function Clouds() {
  const cloudsRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.position.x += delta * 0.8
      if (cloudsRef.current.position.x > 120) cloudsRef.current.position.x = -120
    }
  })

  return (
    <group ref={cloudsRef}>
      <Cloud position={[-40, 55, -80] as [number,number,number]} speed={0.2} opacity={0.7} color="#ffffff" segments={20} bounds={new THREE.Vector3(18, 4, 8)} volume={8} />
      <Cloud position={[20, 60, -90] as [number,number,number]} speed={0.15} opacity={0.6} color="#e8f4ff" segments={16} bounds={new THREE.Vector3(22, 5, 10)} volume={10} />
      <Cloud position={[70, 52, -70] as [number,number,number]} speed={0.25} opacity={0.75} color="#ffffff" segments={18} bounds={new THREE.Vector3(15, 4, 7)} volume={7} />
      <Cloud position={[-80, 58, -60] as [number,number,number]} speed={0.18} opacity={0.65} color="#f0f8ff" segments={14} bounds={new THREE.Vector3(20, 5, 9)} volume={9} />
      <Cloud position={[0, 65, -100] as [number,number,number]} speed={0.12} opacity={0.55} color="#ddeeff" segments={12} bounds={new THREE.Vector3(30, 6, 12)} volume={12} />
    </group>
  )
}

function SceneSetup() {
  const downRef = useRef<DownstreamGateHandle>(null)
  const upRef = useRef<UpstreamGateHandle>(null)
  const boatRef = useRef<BoatHandle>(null)
  const store = useSimStore()
  const hasSetRunner = useRef(false)

  if (!hasSetRunner.current) {
    hasSetRunner.current = true
    store.setRunner(async (dir) => {
      const refs = { downstream: downRef, upstream: upRef, boat: boatRef }
      if (dir === 'up') await runSubida(refs, store)
      else await runDescida(refs, store)
    })
  }

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[-0.4, 0.18, -1]}
        inclination={0.52}
        azimuth={0.22}
        turbidity={4}
        rayleigh={0.8}
        mieCoefficient={0.003}
        mieDirectionalG={0.9}
      />
      <Clouds />
      <Lighting />
      <Chamber />
      <Water />
      <DownstreamGate ref={downRef} />
      <UpstreamGate ref={upRef} />
      <Boat ref={boatRef} />
      <TrafficLights />
    </>
  )
}

export function EclusaScene() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, logarithmicDepthBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
      camera={{ fov: 50, near: 0.1, far: 240, position: [0, 30, 60] }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(0x90c8f0, 0.004)
      }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <SceneSetup />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={100}
        maxPolarAngle={1.48}
        enableDamping
        dampingFactor={0.06}
        target={[0, 1, 0]}
      />
    </Canvas>
  )
}
