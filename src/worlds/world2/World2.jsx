import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { matchRegex, verifyLaw, ALGEBRAIC_LAWS } from '../../simulations/regex'
import { mathHTML } from '../../utils/mathHelpers'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ff6b00'

// ─── Shared tab bar (same pattern as World1) ──────────────────────────────────
function TabBar({ active, onTab, tabs }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '6px',
      background: 'rgba(255,255,255,0.04)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)', marginBottom: 32, flexWrap: 'wrap',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 12, border: 'none',
          cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600,
          letterSpacing: 1, transition: 'all 0.25s',
          background: active === t.id ? COLOR : 'transparent',
          color: active === t.id ? '#fff' : '#8888aa',
          boxShadow: active === t.id ? `0 0 16px ${COLOR}60` : 'none',
        }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Theory tab ───────────────────────────────────────────────────────────────
function TheoryTab() {
  const laws = ALGEBRAIC_LAWS
  return (
    <motion.div key="theory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 14 }}>
        {laws.map((law, i) => (
          <motion.div key={law.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
            <GlassPanel color={COLOR} style={{ height: '100%' }}>
              <div style={{ color: COLOR, fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, marginBottom: 8 }}>{law.name}</div>
              <div dangerouslySetInnerHTML={mathHTML(law.equation)} style={{ fontSize: 16, marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: '#8888aa', lineHeight: 1.6 }}>{law.description}</div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Simulation tab ───────────────────────────────────────────────────────────
function SimulationTab() {
  const [r1, setR1] = useState('a*b')
  const [r2, setR2] = useState('a*b')
  const [testStr, setTestStr] = useState('aab')
  const [result, setResult] = useState(null)
  const [test1, setTest1] = useState(null)
  const [test2, setTest2] = useState(null)
  const [selectedLaw, setSelectedLaw] = useState(null)

  const checkEquiv = () => {
    try { setResult(verifyLaw(r1, r2)) }
    catch { setResult({ equivalent: false, error: 'Parse error' }) }
  }
  const testBoth = () => { setTest1(matchRegex(r1, testStr)); setTest2(matchRegex(r2, testStr)) }

  return (
    <motion.div key="sim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <GlassPanel color={COLOR} style={{ marginBottom: 16 }}>
            <h3 style={{ color: COLOR, marginBottom: 14, fontSize: 14, fontWeight: 700 }}>⚖️ REGEX EQUIVALENCE CHECKER</h3>
            <label style={{ fontSize: 11, color: '#8888aa', display: 'block', marginBottom: 4 }}>Regex 1</label>
            <input className="input-neon" value={r1} onChange={e => { setR1(e.target.value); setResult(null) }}
              placeholder="e.g. a*b" style={{ marginBottom: 10, borderColor: `${COLOR}60` }} />
            <label style={{ fontSize: 11, color: '#8888aa', display: 'block', marginBottom: 4 }}>Regex 2</label>
            <input className="input-neon" value={r2} onChange={e => { setR2(e.target.value); setResult(null) }}
              placeholder="e.g. a*b" style={{ marginBottom: 14, borderColor: `${COLOR}60` }} />
            <button className="btn-neon" onClick={checkEquiv} style={{ width: '100%', fontSize: 12, padding: '10px' }}>
              CHECK EQUIVALENCE
            </button>
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 14, padding: 14, borderRadius: 10, textAlign: 'center',
                    background: result.equivalent ? 'rgba(255,214,10,0.1)' : 'rgba(255,45,85,0.1)',
                    border: `1px solid ${result.equivalent ? '#ffd60a' : '#ff2d55'}`,
                  }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: result.equivalent ? '#ffd60a' : '#ff2d55' }}>
                    {result.equivalent ? '✓ EQUIVALENT' : '✗ NOT EQUIVALENT'}
                  </div>
                  {result.counterexample !== undefined && !result.equivalent && (
                    <div style={{ fontSize: 12, color: '#8888aa', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                      Counterexample: "{result.counterexample}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>

          <GlassPanel color={COLOR}>
            <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>🧪 LIVE STRING TESTER</h3>
            <input className="input-neon" value={testStr} onChange={e => { setTestStr(e.target.value); setTest1(null); setTest2(null) }}
              placeholder="Test string" style={{ marginBottom: 10 }} />
            <button className="btn-neon" onClick={testBoth} style={{ width: '100%', fontSize: 12, padding: '10px' }}>TEST BOTH</button>
            {test1 !== null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 4 }}>
                  R1 on "{testStr}": <span style={{ color: test1 ? '#00ff80' : '#ff2d55', fontWeight: 700 }}>{test1 ? '✓ matches' : '✗ no match'}</span>
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  R2 on "{testStr}": <span style={{ color: test2 ? '#00ff80' : '#ff2d55', fontWeight: 700 }}>{test2 ? '✓ matches' : '✗ no match'}</span>
                </div>
              </motion.div>
            )}
          </GlassPanel>
        </div>

        <div>
          <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>📜 ALGEBRAIC LAWS</h3>
          {ALGEBRAIC_LAWS.map(law => (
            <motion.div key={law.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedLaw(l => l?.id === law.id ? null : law)}
              style={{
                cursor: 'pointer', padding: '12px 16px', borderRadius: 10, marginBottom: 8,
                background: selectedLaw?.id === law.id ? `${COLOR}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedLaw?.id === law.id ? COLOR : 'rgba(255,255,255,0.1)'}`,
                boxShadow: selectedLaw?.id === law.id ? `0 0 14px ${COLOR}40` : 'none', transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: 11, color: COLOR, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{law.name}</div>
              <div dangerouslySetInnerHTML={mathHTML(law.equation)} style={{ fontSize: 14 }} />
              {selectedLaw?.id === law.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: 12, color: '#ccc', marginTop: 8, lineHeight: 1.6 }}>{law.description}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Challenge tab ────────────────────────────────────────────────────────────
function ChallengeTab({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [hints, setHints] = useState(0)
  const [timer, setTimer] = useState(0)
  const HINTS = [
    '(a+b)* matches all strings over {a,b}',
    'So (a+b)*·a·(a+b)* = strings containing at least one a',
    'The answer is exactly (a+b)*a(a+b)*',
  ]

  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    const a = answer.trim().replace(/\s/g, '')
    if (a.includes('(a+b)*a(a+b)*') || a.includes('(a|b)*a(a|b)*')) {
      setStatus('correct'); onComplete()
    } else { setStatus('wrong'); setTimeout(() => setStatus(null), 1000) }
  }

  return (
    <motion.div key="challenge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <GlassPanel color={COLOR}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: COLOR, fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>⚡ CHALLENGE MODE</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#8888aa', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </span>
          </div>
          <div style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}30`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
              Using algebraic laws, what regex represents{' '}
              <strong style={{ color: COLOR }}>all strings containing at least one 'a'</strong>?
              <br />
              Simplify: <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: 15 }}>
                (a+b)*·a·(a+b)*
              </code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input className={`input-neon${status === 'wrong' ? ' shake' : ''}`}
              value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="e.g. (a+b)*a(a+b)*"
              style={{ borderColor: status === 'correct' ? '#00ff80' : `${COLOR}50` }}
              disabled={status === 'correct'} />
            <button className="btn-neon" onClick={check} disabled={status === 'correct'}
              style={{ fontSize: 12, padding: '10px 22px', whiteSpace: 'nowrap' }}>CHECK</button>
          </div>
          {status === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ textAlign: 'center', padding: 20, background: 'rgba(0,255,128,0.1)', border: '1px solid #00ff80', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff80' }}>CORRECT! World 2 Conquered!</div>
              <div style={{ fontSize: 13, color: '#8888aa', marginTop: 6 }}>Strings with at least one 'a'.</div>
            </motion.div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setHints(h => Math.min(h + 1, HINTS.length))}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8888aa', fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono', padding: '6px 12px' }}>
              💡 Show hint ({hints}/{HINTS.length})
            </button>
            {hints > 0 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: '#ffd60a', fontFamily: 'JetBrains Mono' }}>→ {HINTS[hints - 1]}</motion.span>}
          </div>
        </GlassPanel>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function World2() {
  const { completeWorld, startWarp } = useAppStore()
  const [tab, setTab] = useState('intro')
  const [worldDone, setWorldDone] = useState(false)

  const TABS = [
    { id: 'theory', label: 'Explore Theory', icon: '📖' },
    { id: 'sim', label: 'Regex Lab', icon: '⚙️' },
    { id: 'challenge', label: 'Challenge Mode', icon: '⚡' },
  ]

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={8} />
      <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${COLOR}18 0%, transparent 70%)`,
        textAlign: 'center', padding: '60px 40px 0', position: 'relative' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 5, color: COLOR, marginBottom: 14 }}>WORLD 02</motion.div>
        <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 40px ${COLOR}50`, marginBottom: 16, color: '#fff' }}>
          Algebraic Laws
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 17, color: '#8888aa', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Regular expressions obey laws as elegant as algebra — master them to simplify any pattern.
        </motion.p>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 80px' }}>
        <TabBar active={tab} onTab={setTab} tabs={TABS} />
        <AnimatePresence mode="wait">
          {tab === 'theory' && <TheoryTab key="theory" />}
          {tab === 'sim' && <SimulationTab key="sim" />}
          {tab === 'challenge' && <ChallengeTab key="challenge" onComplete={() => { completeWorld(2); setWorldDone(true) }} />}
        </AnimatePresence>

        {tab === 'intro' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginTop: 8 }}>
            {[
              { id: 'theory', icon: '📖', title: 'Explore Theory', desc: 'Study all 8 algebraic laws for regular expressions with examples and LaTeX equations.' },
              { id: 'sim', icon: '⚙️', title: 'Regex Lab', desc: 'Check equivalence of two regexes, explore laws interactively, and test strings live.' },
              { id: 'challenge', icon: '⚡', title: 'Challenge Mode', desc: 'Prove your mastery by simplifying a regex using algebraic laws. Timed and hinted!' },
            ].map(card => (
              <motion.div key={card.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassPanel color={COLOR} style={{ cursor: 'pointer', textAlign: 'center', padding: 28 }} onClick={() => setTab(card.id)}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
                  <h3 style={{ color: COLOR, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{card.title}</h3>
                  <p style={{ color: '#8888aa', fontSize: 13, lineHeight: 1.6 }}>{card.desc}</p>
                </GlassPanel>
              </motion.div>
            ))}
          </motion.div>
        )}

        <AnimatePresence>
          {worldDone && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 40, padding: '40px 32px', background: `radial-gradient(ellipse at center, ${COLOR}20 0%, transparent 70%)`,
                border: `1px solid ${COLOR}40`, borderRadius: 20, textAlign: 'center' }}>
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
                <h2 style={{ fontSize: 36, fontWeight: 700, color: COLOR, textShadow: `0 0 20px ${COLOR}`, marginBottom: 8 }}>WORLD CONQUERED</h2>
                <p style={{ color: '#8888aa', marginBottom: 24 }}>You mastered Algebraic Laws for Regular Expressions!</p>
                <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>↩ Warp Back to Galaxy</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
