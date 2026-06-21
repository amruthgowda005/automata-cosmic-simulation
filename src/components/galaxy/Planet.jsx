import { useRef, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

export const WORLD_CONFIGS = [
  { id: 1, texture: '/textures/mercury.jpg', color: '#a3a3a3', name: 'Decision Properties', orbitRadius: 4, orbitSpeed: 0.5, size: 0.35 },
  { id: 2, texture: '/textures/venus.jpg', color: '#ffd60a', name: 'Algebraic Laws',      orbitRadius: 6.5, orbitSpeed: 0.4, size: 0.55 },
  { id: 3, texture: '/textures/earth.jpg', color: '#0a84ff', name: 'CFG Ambiguity',       orbitRadius: 9, orbitSpeed: 0.3, size: 0.6 },
  { id: 4, texture: '/textures/mars.jpg', color: '#ff3b30', name: 'DPDA',                orbitRadius: 11.5, orbitSpeed: 0.25, size: 0.45 },
  { id: 5, texture: '/textures/jupiter.jpg', color: '#ff9500', name: 'GNF',                 orbitRadius: 16, orbitSpeed: 0.15, size: 1.4 },
]

// Returns the current 3D world position of each planet for screen-space label overlay
export function usePlanetPositions(worldPositions) {
  // worldPositions is a ref array updated each frame
}

export default function Planet({ config, isCompleted, onClick, onPositionUpdate }) {
  const pivotRef = useRef()
  const meshRef = useRef()
  const glowRef = useRef()
  const moonPivotRef = useRef()
  const [hovered, setHovered] = useState(false)

  const { id, color, orbitRadius, orbitSpeed, size, texture } = config
  const mapTexture = useLoader(THREE.TextureLoader, texture)

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime

    if (pivotRef.current) {
      pivotRef.current.rotation.y = t * orbitSpeed
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
      meshRef.current.rotation.x += 0.003
    }
    if (moonPivotRef.current) {
      moonPivotRef.current.rotation.y += 0.02
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
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={mapTexture}
            emissive={color}
            emissiveIntensity={hovered ? 0.3 : 0}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Earth's Moon */}
        {id === 3 && (
          <group ref={moonPivotRef}>
            <mesh position={[size * 1.8, 0, 0]}>
              <sphereGeometry args={[size * 0.25, 16, 16]} />
              <meshStandardMaterial color="#d1d5db" roughness={0.8} />
            </mesh>
          </group>
        )}

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
