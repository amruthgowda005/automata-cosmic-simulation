import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const WORLD_CONFIGS = [
  { id: 1, color: '#ff2d55', name: 'Decision Properties', orbitRadius: 3.5, orbitSpeed: 0.3, size: 0.5 },
  { id: 2, color: '#ff6b00', name: 'Algebraic Laws',      orbitRadius: 5.5, orbitSpeed: 0.22, size: 0.6 },
  { id: 3, color: '#ffd60a', name: 'CFG Ambiguity',       orbitRadius: 7.5, orbitSpeed: 0.16, size: 0.55 },
  { id: 4, color: '#0a84ff', name: 'DPDA',                orbitRadius: 9.5, orbitSpeed: 0.12, size: 0.65 },
  { id: 5, color: '#bf5af2', name: 'GNF',                 orbitRadius: 11.5, orbitSpeed: 0.09, size: 0.6 },
]

// Returns the current 3D world position of each planet for screen-space label overlay
export function usePlanetPositions(worldPositions) {
  // worldPositions is a ref array updated each frame
}

export default function Planet({ config, isCompleted, onClick, onPositionUpdate }) {
  const pivotRef = useRef()
  const meshRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)

  const { color, orbitRadius, orbitSpeed, size } = config

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime

    if (pivotRef.current) {
      pivotRef.current.rotation.y = t * orbitSpeed
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
      meshRef.current.rotation.x += 0.003
    }
    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(t * 2) * 0.15
      glowRef.current.material.opacity = hovered ? 0.35 : pulse * 0.25
    }

    // Report screen position for CSS labels
    if (pivotRef.current && onPositionUpdate) {
      const worldPos = new THREE.Vector3()
      // planet sits at (orbitRadius, 0, 0) in pivot local space
      pivotRef.current.localToWorld(worldPos.set(orbitRadius, 0, 0))
      const projected = worldPos.clone().project(camera)
      onPositionUpdate(config.id, projected)
    }
  })

  return (
    <group ref={pivotRef}>
      <group position={[orbitRadius, 0, 0]}>
        {/* Glow sphere (slightly larger, transparent) */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[size * 1.5, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>

        {/* Planet core */}
        <mesh
          ref={meshRef}
          scale={[size, size, size]}
          onClick={onClick}
          onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.8 : 0.4}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>

        {/* Conquest halo */}
        {isCompleted && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 1.8, 0.06, 8, 64]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )}

        {/* Point light */}
        <pointLight
          color={color}
          intensity={hovered ? 2.5 : 1.2}
          distance={6}
        />
      </group>
    </group>
  )
}
