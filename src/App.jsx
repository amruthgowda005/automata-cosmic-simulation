import { Suspense, lazy, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from './store/useAppStore'
import HUD from './components/shared/HUD'
import WarpTunnel from './components/galaxy/WarpTunnel'
import IntroScene from './scenes/IntroScene'
import GalaxyMap from './components/galaxy/GalaxyMap'

const World1 = lazy(() => import('./worlds/world1/World1'))
const World2 = lazy(() => import('./worlds/world2/World2'))
const World3 = lazy(() => import('./worlds/world3/World3'))
const World4 = lazy(() => import('./worlds/world4/World4'))
const World5 = lazy(() => import('./worlds/world5/World5'))

const WORLDS = { 1: World1, 2: World2, 3: World3, 4: World4, 5: World5 }

function LoadingScreen({ color = '#0a84ff' }) {
  return (
    <div className="loading-screen" style={{ flexDirection: 'column', gap: 20 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 48, height: 48, border: `3px solid rgba(255,255,255,0.1)`,
          borderTopColor: color, borderRadius: '50%',
        }}
      />
      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, letterSpacing: 3, color: '#8888aa' }}>
        LOADING WORLD...
      </p>
    </div>
  )
}

export default function App() {
  const { currentScene, currentWorld } = useAppStore()

  const WorldComponent = currentWorld ? WORLDS[currentWorld] : null
  const worldColors = { 1: '#ff2d55', 2: '#ff6b00', 3: '#ffd60a', 4: '#0a84ff', 5: '#bf5af2' }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      {/* Warp tunnel overlay */}
      <WarpTunnel />

      {/* HUD always visible (except intro) */}
      {currentScene !== 'intro' && <HUD />}

      {/* Scene routing */}
      <AnimatePresence mode="wait">
        {currentScene === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <IntroScene />
          </motion.div>
        )}

        {currentScene === 'galaxy' && (
          <motion.div key="galaxy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <GalaxyMap />
          </motion.div>
        )}

        {currentScene === 'world' && WorldComponent && (
          <motion.div key={`world-${currentWorld}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Suspense fallback={<LoadingScreen color={worldColors[currentWorld]} />}>
              <WorldComponent />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
