import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../../store/useAppStore'
import { WORLD_COLORS, WORLD_NAMES } from '../../utils/mathHelpers'

export default function HUD() {
  const { currentScene, currentWorld, completedWorlds, hudVisible, setShowConfirmModal, showConfirmModal, startWarp } = useAppStore()
  const count = completedWorlds.length

  if (!hudVisible) return null

  const worldColor = currentWorld ? WORLD_COLORS[currentWorld] : '#0a84ff'

  return (
    <>
      {/* Top bar */}
      <div className="hud">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 28px' }}>
          {/* Logo */}
          <motion.button
            onClick={() => currentScene !== 'intro' && currentScene !== 'galaxy' ? setShowConfirmModal(true) : null}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '18px', letterSpacing: '4px',
              color: '#fff',
              textShadow: `0 0 10px ${worldColor}, 0 0 20px ${worldColor}40`,
              padding: 0,
            }}
          >
            AUTOMATA
          </motion.button>

          {/* Progress HUD */}
          {currentScene !== 'intro' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'
              }}
            >
              <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#8888aa', fontFamily: 'JetBrains Mono' }}>
                {count} / 5 WORLDS
              </span>
              {/* World dots */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(id => (
                  <div
                    key={id}
                    title={WORLD_NAMES[id]}
                    style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: completedWorlds.includes(id) ? WORLD_COLORS[id] : 'rgba(255,255,255,0.15)',
                      boxShadow: completedWorlds.includes(id) ? `0 0 8px ${WORLD_COLORS[id]}` : 'none',
                      transition: 'all 0.3s',
                      border: currentWorld === id ? `1px solid ${WORLD_COLORS[id]}` : '1px solid transparent',
                    }}
                  />
                ))}
              </div>
              {/* Neon progress bar */}
              <div style={{ width: '120px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(count / 5) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${worldColor}, ${worldColor}cc)`, boxShadow: `0 0 6px ${worldColor}` }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom world label */}
      {currentWorld && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '3px',
            color: WORLD_COLORS[currentWorld], textShadow: `0 0 8px ${WORLD_COLORS[currentWorld]}`,
            pointerEvents: 'none', zIndex: 1000, textTransform: 'uppercase',
          }}
        >
          WORLD {currentWorld} — {WORLD_NAMES[currentWorld]}
        </motion.div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass"
              style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}
            >
              <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Leave this World?</h3>
              <p style={{ color: '#8888aa', marginBottom: '32px', fontSize: '15px' }}>
                Your simulation progress will be saved. The galaxy awaits.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  className="btn-neon"
                  onClick={() => { setShowConfirmModal(false); startWarp('galaxy') }}
                  style={{ fontSize: '13px', padding: '12px 28px' }}
                >
                  Warp to Galaxy
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#8888aa', padding: '12px 28px', borderRadius: '50px',
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'Space Grotesk',
                  }}
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
