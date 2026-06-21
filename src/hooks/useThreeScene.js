import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Hook: create and manage a Three.js scene manually (for non-fiber usage)
export function useThreeScene(canvasRef, setupFn) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animIdRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    const cleanup = setupFn(scene, camera, renderer)

    const handleResize = () => {
      if (!canvasRef.current) return
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
      if (cleanup) cleanup()
      renderer.dispose()
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    }
  }, [])

  return { sceneRef, rendererRef, animIdRef }
}

// Hook: create particle system using InstancedMesh
export function useParticleSystem(count = 3000) {
  const particlesRef = useRef(null)

  const createParticles = (scene, color = '#ffffff', spread = 100) => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color, size: 0.15, sizeAttenuation: true, transparent: true, opacity: 0.8 })
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)
    particlesRef.current = particles
    return particles
  }

  return { createParticles, particlesRef }
}
