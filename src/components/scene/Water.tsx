import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_Y, LOW_Y, HIGH_Y, CW, CL } from '../../constants'
import { useSimStore } from '../../store/simulation'

const WSEGS = 32

const vertexShader = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float w =
      sin(pos.x * 0.70 + uTime * 1.60) * 0.045 +
      sin(pos.z * 0.55 + uTime * 1.20) * 0.038 +
      sin(pos.x * 1.30 - pos.z * 0.80 + uTime * 0.90) * 0.025 +
      sin(pos.x * 2.10 + pos.z * 1.40 + uTime * 2.20) * 0.012 +
      cos(pos.x * 0.40 + pos.z * 0.30 + uTime * 0.70) * 0.030 +
      sin((pos.x + pos.z) * 0.90 + uTime * 1.80) * 0.018;

    pos.y += w;
    vElevation = w;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uWaterLevel;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  float caustic(vec2 uv, float t) {
    vec2 p = uv * 10.0;
    float c1 = sin(p.x + sin(p.y * 1.4 + t * 1.1) + t * 1.8);
    float c2 = sin(p.y * 1.2 + sin(p.x * 0.9 - t * 0.7) - t * 1.3);
    float c3 = sin((p.x + p.y) * 0.7 + t * 0.9);
    return pow(abs(c1 * c2 * c3), 0.6) * 0.28;
  }

  void main() {
    // Base color by elevation
    float t = smoothstep(-0.10, 0.10, vElevation);
    vec3 color = mix(uDeepColor, uShallowColor, t);

    // Sky reflection tint (bright cyan-blue)
    color = mix(color, vec3(0.45, 0.78, 1.0), 0.22);

    // Caustic light interference patterns (brighter for daytime)
    float caust = caustic(vUv, uTime);
    color += vec3(0.30, 0.65, 1.0) * caust * (0.8 + uWaterLevel * 1.0);

    // Foam at wave crests (bright white-blue tips)
    float foam = smoothstep(0.055, 0.085, vElevation);
    color = mix(color, vec3(0.90, 0.97, 1.0), foam * 0.55);

    // Moving sparkle highlights (sun glints) — stronger for daylight
    float sp1 = pow(max(0.0, sin(vUv.x * 10.0 + uTime * 3.5) * 0.5 + 0.5), 7.0);
    float sp2 = pow(max(0.0, sin(vUv.y * 8.0 - uTime * 2.8) * 0.5 + 0.5), 7.0);
    float sparkle = sp1 * sp2;
    color += vec3(0.80, 0.95, 1.0) * sparkle * 0.60;

    // Secondary diagonal sparkles
    float sp3 = pow(max(0.0, sin((vUv.x + vUv.y) * 12.0 + uTime * 4.0) * 0.5 + 0.5), 9.0);
    color += vec3(1.0, 1.0, 1.0) * sp3 * 0.30;

    // Slight edge darkening (depth illusion)
    vec2 center = abs(vUv - 0.5) * 2.0;
    float edge = smoothstep(0.7, 1.0, max(center.x, center.y));
    color = mix(color, uDeepColor * 0.85, edge * 0.25);

    float alpha = 0.82 + foam * 0.10;
    gl_FragColor = vec4(color, alpha);
  }
`

export function Water() {
  const waterLevel = useSimStore(s => s.waterLevel)
  const wlRef = useRef(waterLevel)
  wlRef.current = waterLevel

  const frontRef = useRef<THREE.Mesh>(null)
  const backRef  = useRef<THREE.Mesh>(null)
  const leftRef  = useRef<THREE.Mesh>(null)
  const rightRef = useRef<THREE.Mesh>(null)
  const surfRef  = useRef<THREE.Mesh>(null)

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:        { value: 0 },
      uWaterLevel:  { value: 0.5 },
      uDeepColor:   { value: new THREE.Color(0x1565c0) },
      uShallowColor:{ value: new THREE.Color(0x29b6f6) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [])

  useFrame((_, delta) => {
    const wl = wlRef.current
    const wY = LOW_Y + wl * (HIGH_Y - LOW_Y)
    const h  = Math.max(0.08, wY - FLOOR_Y)

    mat.uniforms.uTime.value       += delta
    mat.uniforms.uWaterLevel.value  = wl
    mat.uniforms.uDeepColor.value.setHex(wl < 0.5 ? 0x1565c0 : 0x1976d2)
    mat.uniforms.uShallowColor.value.setHex(wl < 0.5 ? 0x29b6f6 : 0x4fc3f7)

    if (surfRef.current) surfRef.current.position.y = wY

    ;[frontRef, backRef, leftRef, rightRef].forEach(r => {
      if (r.current) {
        r.current.scale.y    = h
        r.current.position.y = FLOOR_Y + h / 2
      }
    })
  })

  return (
    <group>
      {/* Animated water surface — GLSL shader */}
      <mesh ref={surfRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, LOW_Y, 0]} material={mat}>
        <planeGeometry args={[CW - 0.08, CL - 0.08, WSEGS, WSEGS]} />
      </mesh>

      {/* Water volume side panels */}
      <mesh ref={frontRef} position={[0, FLOOR_Y + 0.5, (CL - 0.08) / 2]}>
        <planeGeometry args={[CW - 0.08, 1]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={backRef} position={[0, FLOOR_Y + 0.5, -(CL - 0.08) / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CW - 0.08, 1]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={leftRef} position={[-(CW - 0.08) / 2, FLOOR_Y + 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[CL - 0.08, 1]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightRef} position={[(CW - 0.08) / 2, FLOOR_Y + 0.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[CL - 0.08, 1]} />
        <meshStandardMaterial color={0x1565c0} roughness={0.05} metalness={0.35} transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>

      {/* Chamber floor visible through water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.05, 0]}>
        <planeGeometry args={[CW - 0.12, CL - 0.12]} />
        <meshStandardMaterial color={0x0d2a4a} roughness={0.18} metalness={0.20} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}
