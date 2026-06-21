import { useRef, useMemo, useCallback, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import Planet, { WORLD_CONFIGS } from './Planet'
import useAppStore from '../../store/useAppStore'

// ─── Orbit ring using a torus (no THREE.Line issues) ───────────────────────
function OrbitRing({ radius }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.015, 8, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
    </mesh>
  )
}

// ─── Central star ───────────────────────────────────────────────────────────
function CentralStar() {
  const meshRef = useRef()
  const coronaRef = useRef()
  const sunTexture = useLoader(THREE.TextureLoader, '/textures/sun.jpg')

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003
      const s = 1 + Math.sin(t * 1.5) * 0.01
      meshRef.current.scale.setScalar(s)
    }
    if (coronaRef.current) {
      coronaRef.current.material.opacity = 0.2 + Math.sin(t * 3) * 0.05
      coronaRef.current.rotation.y -= 0.002
    }
  })

  return (
    <group>
      {/* Corona glow - large additive sphere */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#ff7700" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Outer ambient glow */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Star surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial 
          map={sunTexture} 
          emissive="#ffaa00" 
          emissiveMap={sunTexture}
          emissiveIntensity={1.2} 
        />
      </mesh>
      <pointLight color="#ffdd88" intensity={4} distance={60} />
    </group>
  )
}

// ─── CSS Label overlay tracker ──────────────────────────────────────────────
function LabelTracker({ planets, onUpdate }) {
  useFrame(({ camera, size }) => {
    const labels = {}
    planets.forEach(({ id, position3D }) => {
      if (!position3D) return
      const projected = position3D.clone().project(camera)
      labels[id] = {
        x: ((projected.x + 1) / 2) * size.width,
        y: ((-projected.y + 1) / 2) * size.height,
        visible: projected.z < 1,
      }
    })
    onUpdate(labels)
  })
  return null
}

// ─── Full galaxy 3D scene ───────────────────────────────────────────────────
function GalaxyScene({ onPlanetClick, completedWorlds, onLabelsUpdate }) {
  const planetRefs = useRef({})

  // Build planet world-position refs
  const handlePositionUpdate = useCallback((id, projected) => {
    // projected is NDC coords; we store the 3D world pos instead via a different approach
  }, [])

  // Per-frame label position calculation via a dedicated component
  const planetPositions = useRef(
    WORLD_CONFIGS.map(c => ({ id: c.id, position3D: null }))
  )

  // Update 3D position per frame from pivot refs
  const pivotRefs = useRef({})

  useFrame(({ camera, size }) => {
    const labels = {}
    WORLD_CONFIGS.forEach(config => {
      const pivot = pivotRefs.current[config.id]
      if (!pivot) return
      const worldPos = new THREE.Vector3()
      pivot.localToWorld(worldPos.set(config.orbitRadius, 0, 0))
      const projected = worldPos.clone().project(camera)
      labels[config.id] = {
        x: ((projected.x + 1) / 2) * size.width,
        y: ((-projected.y + 1) / 2) * size.height,
        visible: projected.z < 1 && projected.z > -1,
      }
    })
    onLabelsUpdate(labels)
  })

  return (
    <>
      <ambientLight intensity={0.15} />
      <Stars radius={90} depth={60} count={4000} factor={3} saturation={0} fade speed={0.6} />
      <CentralStar />

      {WORLD_CONFIGS.map(config => (
        <group key={config.id}>
          <OrbitRing radius={config.orbitRadius} />
          <group ref={el => pivotRefs.current[config.id] = el}>
            <Planet
              config={config}
              isCompleted={completedWorlds.includes(config.id)}
              onClick={() => onPlanetClick(config.id)}
            />
          </group>
        </group>
      ))}
    </>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function GalaxyMap() {
  const { completedWorlds, startWarp } = useAppStore()
  const [labelPositions, setLabelPositions] = useState({})
  const [hoveredWorld, setHoveredWorld] = useState(null)

  const handlePlanetClick = (worldId) => startWarp(worldId)

  const handleLabelsUpdate = useCallback((labels) => {
    setLabelPositions(prev => {
      // Only trigger re-render if positions changed meaningfully
      const changed = Object.keys(labels).some(id => {
        const a = prev[id], b = labels[id]
        if (!a || !b) return true
        return Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1
      })
      return changed ? labels : prev
    })
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#07070d', overflow: 'hidden' }}>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 16, 36], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <GalaxyScene
            onPlanetClick={handlePlanetClick}
            completedWorlds={completedWorlds}
            onLabelsUpdate={handleLabelsUpdate}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={15}
          maxDistance={55}
          maxPolarAngle={Math.PI / 1.9}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* CSS planet labels (positioned from 3D projection) */}
      {WORLD_CONFIGS.map(config => {
        const pos = labelPositions[config.id]
        if (!pos || !pos.visible) return null
        const isHovered = hoveredWorld === config.id
        const isCompleted = completedWorlds.includes(config.id)
        return (
          <div
            key={config.id}
            onClick={() => handlePlanetClick(config.id)}
            onMouseEnter={() => setHoveredWorld(config.id)}
            onMouseLeave={() => setHoveredWorld(null)}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y - 56,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 5,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              {isCompleted && (
                <span style={{ fontSize: 10, color: config.color, fontFamily: 'JetBrains Mono', letterSpacing: 2 }}>★</span>
              )}
              <div style={{
                background: isHovered ? `${config.color}30` : 'rgba(0,0,0,0.5)',
                border: `1px solid ${isHovered ? config.color : config.color + '60'}`,
                borderRadius: 8, padding: '4px 10px',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                boxShadow: isHovered ? `0 0 14px ${config.color}60` : 'none',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 10,
                  color: isHovered ? '#fff' : config.color,
                  whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: 1,
                  transition: 'color 0.2s',
                }}>
                  W{config.id} · {config.name}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Top title overlay */}
      <div style={{
        position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none', zIndex: 4,
      }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: '#8888aa', marginBottom: 8 }}>
          SELECT A WORLD
        </p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, letterSpacing: '-2px', color: '#fff',
          textShadow: '0 0 30px rgba(255,255,255,0.15)', margin: 0 }}>
          GALAXY MAP
        </h1>
        <p style={{ color: '#8888aa', fontSize: 13, marginTop: 8 }}>
          Click a planet · Drag to orbit · Scroll to zoom
        </p>
      </div>

      {/* World legend */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
        zIndex: 4, pointerEvents: 'none',
      }}>
        {WORLD_CONFIGS.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c.color, boxShadow: `0 0 8px ${c.color}`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#8888aa', whiteSpace: 'nowrap' }}>
              {c.name}
            </span>
            {completedWorlds.includes(c.id) && (
              <span style={{ fontSize: 10, color: c.color }}>✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredWorld && (() => {
        const config = WORLD_CONFIGS.find(c => c.id === hoveredWorld)
        const pos = labelPositions[hoveredWorld]
        if (!config || !pos) return null
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              left: pos.x, top: pos.y + 20,
              transform: 'translateX(-50%)',
              zIndex: 6, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
              border: `1px solid ${config.color}50`,
              borderRadius: 10, padding: '10px 16px',
              textAlign: 'center', minWidth: 140,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: config.color, marginBottom: 4 }}>
              World {config.id}
            </div>
            <div style={{ fontSize: 12, color: '#ccc' }}>{config.name}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
              Click to enter →
            </div>
          </motion.div>
        )
      })()}
    </div>
  )
}
