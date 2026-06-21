import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import useAppStore from '../store/useAppStore'

const TITLE = 'AUTOMATA'

function StarParticles() {
  const groupRef = useRef()
  const count = 5000
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  useFrame((_, d) => {
    if (groupRef.current) groupRef.current.rotation.y += d * 0.008
  })

  return (
    <group ref={groupRef}>
      <points geometry={geo}>
        <pointsMaterial color="#aaaaff" size={0.2} sizeAttenuation transparent opacity={0.7} />
      </points>
    </group>
  )
}

function FloatingSymbol3D({ pos, symbol }) {
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = pos[1] + Math.sin(clock.elapsedTime * 0.5 + pos[0]) * 0.6
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.15
    }
  })
  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color="#0a84ff" />
    </mesh>
  )
}

function IntroScene3D() {
  const symbols = [
    [-6, 2, -3], [6, -1, -4], [-4, -2, -2], [5, 3, -5],
    [-7, 0, -6], [7, -3, -3], [0, 4, -5], [-3, -4, -1],
  ]
  return (
    <>
      <ambientLight intensity={0.2} />
      <StarParticles />
      {symbols.map((pos, i) => <FloatingSymbol3D key={i} pos={pos} symbol="Σ" />)}
    </>
  )
}

export default function IntroScene() {
  const { startWarp } = useAppStore()
  const titleRef = useRef()
  const subtitleRef = useRef()
  const btnRef = useRef()
  const [mounted, setMounted] = useState(false)
  const AUTOMATA_SYMBOLS = ['Σ', 'δ', 'q₀', '→', 'ε', '*', '+', '|']

  useEffect(() => {
    setMounted(true)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 })
      tl.fromTo(
        titleRef.current?.querySelectorAll('.letter') || [],
        { y: 80, opacity: 0, rotateX: -90, transformOrigin: 'bottom' },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.7, stagger: 0.06, ease: 'back.out(2)' }
      )
        .fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.2')
        .fromTo(btnRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 }, '-=0.4')
    })
    return () => ctx.revert()
  }, [])

  const handleBegin = () => startWarp('galaxy')

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* 3D Canvas background */}
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: false, alpha: false }}
      >
        <IntroScene3D />
      </Canvas>

      {/* Nebula glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(10,132,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating symbols overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        {AUTOMATA_SYMBOLS.map((sym, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20, 0], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: `${8 + i * 11}%`,
              top: `${15 + (i % 4) * 18}%`,
              fontFamily: 'JetBrains Mono',
              fontSize: `${20 + (i % 3) * 16}px`,
              color: '#0a84ff',
              fontWeight: 700,
              textShadow: '0 0 15px #0a84ff',
              userSelect: 'none',
            }}
          >
            {sym}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20px',
      }}>
        {/* AUTOMATA title */}
        <div
          ref={titleRef}
          style={{
            display: 'flex', gap: '2px', marginBottom: '20px',
            perspective: '800px',
          }}
        >
          {TITLE.split('').map((letter, i) => (
            <span
              key={i}
              className="letter"
              style={{
                display: 'inline-block',
                fontSize: 'clamp(52px, 10vw, 120px)',
                fontWeight: 700,
                letterSpacing: '-4px',
                color: '#fff',
                textShadow: '0 0 30px rgba(10,132,255,0.5), 0 0 60px rgba(10,132,255,0.2)',
                lineHeight: 1,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0 }}
          style={{
            fontSize: 'clamp(13px, 2vw, 18px)',
            color: '#8888aa',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            maxWidth: '500px',
            marginBottom: '48px',
            lineHeight: 1.6,
          }}
        >
          A Cosmic Journey Through Formal Language Theory
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 1.2 }}
          style={{ width: '120px', height: '1px', background: 'linear-gradient(90deg, transparent, #0a84ff, transparent)', marginBottom: '48px' }}
        />

        {/* CTA button */}
        <motion.button
          ref={btnRef}
          initial={{ opacity: 0 }}
          className="btn-neon"
          onClick={handleBegin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>BEGIN THE JOURNEY</span>
          <span style={{ fontSize: '16px' }}>→</span>
        </motion.button>

        {/* Version/meta */}
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ marginTop: '48px', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#8888aa44', letterSpacing: '3px' }}
        >
          FORMAL LANGUAGE THEORY // INTERACTIVE SIMULATION
        </motion.p>
      </div>

      {/* Scanline effect */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />
    </div>
  )
}
