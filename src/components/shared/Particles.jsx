import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function StarField({ count = 4000 }) {
  const meshRef = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return pos
  }, [count])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.01
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.25} sizeAttenuation transparent opacity={0.7} />
    </points>
  )
}

function FloatingSymbols({ symbols = ['Σ', 'δ', 'q', '→', 'ε', '*', '+', '|'], color = '#0a84ff' }) {
  const groupRef = useRef()
  const items = useMemo(() => symbols.map((s, i) => ({
    symbol: s,
    pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6],
    speed: 0.2 + Math.random() * 0.3,
    offset: Math.random() * Math.PI * 2,
    id: i,
  })), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const item = items[i]
      if (item) {
        child.position.y = item.pos[1] + Math.sin(clock.elapsedTime * item.speed + item.offset) * 0.8
        child.rotation.z = Math.sin(clock.elapsedTime * 0.3 + item.offset) * 0.2
      }
    })
  })

  return (
    <group ref={groupRef}>
      {items.map((item) => (
        <mesh key={item.id} position={item.pos}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

// CSS-based floating symbols overlay (for use outside Canvas)
export function FloatingSymbolsCSS({ color = '#0a84ff', count = 12 }) {
  const SYMBOLS = ['Σ', 'δ', 'q₀', '→', 'ε', '*', '+', '|', 'R', 'L', '∅', '∈']
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {SYMBOLS.slice(0, count).map((sym, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${5 + (i * 8.5) % 90}%`,
            top: `${10 + (i * 13) % 80}%`,
            color,
            opacity: 0.15 + (i % 4) * 0.08,
            fontSize: `${18 + (i % 3) * 10}px`,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            animation: `particle-float ${4 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            textShadow: `0 0 10px ${color}`,
            userSelect: 'none',
          }}
        >
          {sym}
        </div>
      ))}
    </div>
  )
}

// Full particle canvas for background
export default function Particles({ count = 3000, color = '#ffffff' }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 60 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ antialias: false, alpha: true }}
    >
      <StarField count={count} />
      <FloatingSymbols color={color} />
    </Canvas>
  )
}
