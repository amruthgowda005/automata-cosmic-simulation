import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../../store/useAppStore'
import { gsap } from 'gsap'

export default function WarpTunnel() {
  const { isWarping, warpTarget } = useAppStore()
  const tunnelRef = useRef()

  useEffect(() => {
    if (!isWarping || !tunnelRef.current) return
    const tl = gsap.timeline()
    tl.fromTo(
      tunnelRef.current.querySelectorAll('.warp-particle'),
      { scale: 0, opacity: 0.8, x: 0, y: 0 },
      {
        scale: 3,
        opacity: 0,
        x: () => (Math.random() - 0.5) * window.innerWidth * 0.8,
        y: () => (Math.random() - 0.5) * window.innerHeight * 0.8,
        duration: 0.8,
        stagger: { each: 0.02, from: 'center' },
        ease: 'power2.in',
      }
    )
    return () => tl.kill()
  }, [isWarping])

  const getColor = () => {
    const colors = { galaxy: '#0a84ff', 1: '#ff2d55', 2: '#ff6b00', 3: '#ffd60a', 4: '#0a84ff', 5: '#bf5af2' }
    return colors[warpTarget] || '#0a84ff'
  }

  return (
    <AnimatePresence>
      {isWarping && (
        <motion.div
          ref={tunnelRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #000 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Warp rings */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [0, 2 + i * 0.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, delay: i * 0.08, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 60, height: 60,
                borderRadius: '50%',
                border: `2px solid ${getColor()}`,
                boxShadow: `0 0 20px ${getColor()}`,
              }}
            />
          ))}
          {/* Warp particles */}
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={`p-${i}`}
              className="warp-particle"
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1 + Math.random()],
                opacity: [1, 0],
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 400,
              }}
              transition={{ duration: 1, delay: Math.random() * 0.4, ease: 'power2.in' }}
              style={{
                position: 'absolute',
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                borderRadius: '50%',
                background: getColor(),
                boxShadow: `0 0 6px ${getColor()}`,
              }}
            />
          ))}
          {/* Center flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 2], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 200, height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${getColor()}, transparent)`,
            }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2 }}
            style={{
              position: 'relative', zIndex: 1,
              fontFamily: 'JetBrains Mono', fontSize: '12px', letterSpacing: '4px',
              color: getColor(), textTransform: 'uppercase',
            }}
          >
            INITIATING WARP
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
