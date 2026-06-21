import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { runDFA, checkEmptiness, checkFiniteness, getDefaultDFA } from '../../simulations/dfa'
import { mathHTML } from '../../utils/mathHelpers'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ff2d55'
const DEFAULT_DFA = getDefaultDFA()

const THEORY_STEPS = [
  {
    title: 'Membership Problem',
    latex: 'w \\in L(M)?',
    desc: 'Does the DFA M accept the string w? Trace w through the DFA — if it halts in an accept state, the answer is YES.',
    icon: '🔍',
  },
  {
    title: 'Emptiness Problem',
    latex: 'L(M) = \\emptyset?',
    desc: 'Is there ANY string the DFA accepts? BFS from the start state — if no accept state is reachable, the language is empty.',
    icon: '∅',
  },
  {
    title: 'Finiteness Problem',
    latex: '|L(M)| < \\infty?',
    desc: 'Does the DFA accept finitely many strings? Detect cycles on paths to accept states — a cycle means INFINITE language.',
    icon: '∞',
  },
  {
    title: 'Equivalence Problem',
    latex: 'L(M_1) = L(M_2)?',
    desc: 'Do two DFAs accept the same language? Build their product DFA and check if the symmetric difference is empty.',
    icon: '⟺',
  },
]

// ─── Tab bar ─────────────────────────────────────────────────────────────────
function TabBar({ active, onTab, tabs }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '6px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 32, flexWrap: 'wrap',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          style={{
            flex: 1, minWidth: 120,
            padding: '10px 16px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Space Grotesk',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1,
            transition: 'all 0.25s',
            background: active === t.id ? COLOR : 'transparent',
            color: active === t.id ? '#fff' : '#8888aa',
            boxShadow: active === t.id ? `0 0 16px ${COLOR}60` : 'none',
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Theory tab ───────────────────────────────────────────────────────────────
function TheoryTab() {
  return (
    <motion.div
      key="theory"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px,1fr))', gap: 16 }}>
        {THEORY_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassPanel color={COLOR} style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${COLOR}20`, border: `1px solid ${COLOR}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {step.icon}
                </div>
                <h3 style={{ color: COLOR, fontSize: 15, fontWeight: 700, margin: 0 }}>{step.title}</h3>
              </div>
              <div dangerouslySetInnerHTML={mathHTML(step.latex)} style={{ marginBottom: 10, fontSize: 18 }} />
              <p style={{ color: '#8888aa', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Simulation tab ───────────────────────────────────────────────────────────
function SimulationTab() {
  const [dfa] = useState(DEFAULT_DFA)
  const [input, setInput] = useState('1010')
  const [result, setResult] = useState(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [emptiness, setEmptiness] = useState(null)
  const [finiteness, setFiniteness] = useState(null)

  const runSimulation = () => {
    const res = runDFA(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates, input)
    setResult(res)
    setCurrentStep(-1)
    setIsRunning(true)
    res.steps.forEach((_, i) => setTimeout(() => setCurrentStep(i), i * 500))
    setTimeout(() => { setIsRunning(false); setCurrentStep(res.steps.length) }, res.steps.length * 500 + 400)
  }

  return (
    <motion.div
      key="sim"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* DFA Diagram */}
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
            DFA: Strings ending in '0'
          </h3>
          {/* State nodes */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            {dfa.states.map(s => {
              const isActive = result?.path?.[currentStep + 1] === s
              const isAccept = dfa.acceptStates.includes(s)
              const isStart = s === dfa.startState
              return (
                <motion.div
                  key={s}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    backgroundColor: isActive ? `${COLOR}50` : isAccept ? `${COLOR}20` : 'rgba(255,255,255,0.05)',
                    boxShadow: isActive ? `0 0 20px ${COLOR}` : isAccept ? `0 0 10px ${COLOR}60` : 'none',
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    border: `2px solid ${isAccept ? COLOR : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                    fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700,
                    position: 'relative', cursor: 'default',
                  }}
                >
                  {isStart && (
                    <span style={{ position: 'absolute', top: -18, fontSize: 10, color: COLOR, fontFamily: 'JetBrains Mono' }}>START→</span>
                  )}
                  {s}
                  {isAccept && (
                    <span style={{ position: 'absolute', bottom: -18, fontSize: 10, color: COLOR }}>ACCEPT</span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Transition table */}
          <div style={{ marginTop: 24, fontSize: 12, fontFamily: 'JetBrains Mono' }}>
            <div style={{ color: '#8888aa', marginBottom: 8 }}>Transitions:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '4px 12px' }}>
              <div style={{ color: COLOR, fontWeight: 700 }}>State</div>
              <div style={{ color: COLOR, fontWeight: 700 }}>on '0'</div>
              <div style={{ color: COLOR, fontWeight: 700 }}>on '1'</div>
              {dfa.states.map(s => (
                <>
                  <div key={s+'s'} style={{ color: '#ccc' }}>{s}</div>
                  <div key={s+'0'} style={{ color: '#8888aa' }}>{dfa.transitions[`${s},0`] || '-'}</div>
                  <div key={s+'1'} style={{ color: '#8888aa' }}>{dfa.transitions[`${s},1`] || '-'}</div>
                </>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlassPanel color={COLOR}>
            <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>▶ RUN MEMBERSHIP TEST</h3>
            <input
              className="input-neon"
              value={input}
              onChange={e => { setInput(e.target.value.replace(/[^01]/g, '')); setResult(null) }}
              placeholder="Binary string (0s and 1s)"
              style={{ marginBottom: 10, borderColor: `${COLOR}60` }}
            />
            <button
              className="btn-neon"
              onClick={runSimulation}
              disabled={isRunning}
              style={{ fontSize: 12, padding: '10px 20px', width: '100%', opacity: isRunning ? 0.6 : 1 }}
            >
              {isRunning ? '⏳ Running...' : '▶ RUN DFA'}
            </button>

            {/* Step trace */}
            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14 }}>
                <div style={{
                  padding: 14, borderRadius: 10, textAlign: 'center',
                  background: result.accepted ? 'rgba(0,255,128,0.1)' : 'rgba(255,45,85,0.1)',
                  border: `1px solid ${result.accepted ? '#00ff80' : COLOR}`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: result.accepted ? '#00ff80' : COLOR }}>
                    {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8888aa', marginTop: 6, fontFamily: 'JetBrains Mono' }}>
                    Path: {result.path.join(' → ')}
                  </div>
                </div>

                {/* Animated string trace */}
                <div style={{ marginTop: 12, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {input.split('').map((ch, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        background: i <= currentStep ? `${COLOR}40` : 'rgba(255,255,255,0.05)',
                        borderColor: i <= currentStep ? COLOR : 'rgba(255,255,255,0.2)',
                      }}
                      style={{
                        width: 32, height: 32, borderRadius: 6,
                        border: '1px solid',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700,
                      }}
                    >
                      {ch}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </GlassPanel>

          <GlassPanel color={COLOR}>
            <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>🔬 DECISION PROBLEMS</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className="btn-neon" onClick={() => setEmptiness(checkEmptiness(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates))}
                style={{ fontSize: 11, padding: '8px 12px', flex: 1 }}>
                Check Emptiness
              </button>
              <button className="btn-neon" onClick={() => setFiniteness(checkFiniteness(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates))}
                style={{ fontSize: 11, padding: '8px 12px', flex: 1 }}>
                Check Finiteness
              </button>
            </div>
            {emptiness && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#8888aa', marginBottom: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                L(M) is <span style={{ color: emptiness.isEmpty ? COLOR : '#00ff80', fontWeight: 700 }}>
                  {emptiness.isEmpty ? 'EMPTY ∅' : 'NOT EMPTY ✓'}
                </span>
              </motion.div>
            )}
            {finiteness && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#8888aa', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                L(M) is <span style={{ color: finiteness.isFinite ? '#ffd60a' : COLOR, fontWeight: 700 }}>
                  {finiteness.isFinite ? 'FINITE' : 'INFINITE ∞'}
                </span>
                {!finiteness.isFinite && <span style={{ color: '#666' }}> (cycle detected)</span>}
              </motion.div>
            )}
          </GlassPanel>
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
    'The DFA accepts strings ending in 0',
    'Trace: q0 →¹→ q1 →⁰→ q0 →¹→ q1  — final state is q1 (NOT accept)',
    '101 ends in 1, so the DFA rejects it',
  ]

  useEffect(() => {
    const id = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const check = () => {
    const a = answer.trim().toLowerCase()
    if (a === 'rejected' || a === 'no' || a === 'reject') {
      setStatus('correct')
      onComplete()
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus(null), 1000)
    }
  }

  return (
    <motion.div
      key="challenge"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <GlassPanel color={COLOR}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: COLOR, fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>⚡ CHALLENGE MODE</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#8888aa',
              background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </span>
          </div>

          <div style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}30`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
              The DFA below accepts all binary strings <strong style={{ color: COLOR }}>ending in '0'</strong>.
              <br />
              Does it accept the string{' '}
              <code style={{ color: COLOR, background: 'rgba(255,45,85,0.15)', padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: 16 }}>
                '101'
              </code>?
            </p>
          </div>

          {/* Visual DFA trace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            {['q0','→¹','q1','→⁰','q0','→¹','q1'].map((s, i) => (
              <div key={i} style={{
                padding: s.startsWith('→') ? '4px 2px' : '8px 14px',
                borderRadius: s.startsWith('→') ? 0 : 8,
                background: s.startsWith('→') ? 'transparent' : 'rgba(255,255,255,0.07)',
                border: s.startsWith('→') ? 'none' : '1px solid rgba(255,255,255,0.15)',
                fontFamily: 'JetBrains Mono', fontSize: 13,
                color: s === 'q1' && i === 6 ? COLOR : '#ccc',
              }}>
                {s}
              </div>
            ))}
            <span style={{ marginLeft: 8, fontSize: 12, color: '#8888aa' }}>(final: q1 = not accept)</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              className={`input-neon${status === 'wrong' ? ' shake' : ''}`}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="Type: accepted   or   rejected"
              style={{
                borderColor: status === 'correct' ? '#00ff80' : status === 'wrong' ? COLOR : `${COLOR}40`,
              }}
              disabled={status === 'correct'}
            />
            <button className="btn-neon" onClick={check} disabled={status === 'correct'}
              style={{ fontSize: 12, padding: '10px 22px', whiteSpace: 'nowrap' }}>
              CHECK
            </button>
          </div>

          {status === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ textAlign: 'center', padding: 20, background: 'rgba(0,255,128,0.1)', border: '1px solid #00ff80', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff80' }}>CORRECT! World 1 Conquered!</div>
              <div style={{ fontSize: 13, color: '#8888aa', marginTop: 6 }}>101 ends in 1, so the DFA rejects it.</div>
            </motion.div>
          )}

          {/* Hints */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setHints(h => Math.min(h + 1, HINTS.length))}
              style={{ background: 'none', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
                color: '#8888aa', fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono', padding: '6px 12px' }}>
              💡 Show hint ({hints}/{HINTS.length})
            </button>
            {hints > 0 && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 13, color: '#ffd60a', fontFamily: 'JetBrains Mono' }}>
                → {HINTS[hints - 1]}
              </motion.span>
            )}
          </div>
        </GlassPanel>
      </div>
    </motion.div>
  )
}

// ─── Main World1 export ───────────────────────────────────────────────────────
export default function World1() {
  const { completeWorld, startWarp } = useAppStore()
  const [tab, setTab] = useState('intro')
  const [worldDone, setWorldDone] = useState(false)

  const handleComplete = () => { completeWorld(1); setWorldDone(true) }

  const TABS = [
    { id: 'theory', label: 'Explore Theory', icon: '📖' },
    { id: 'sim', label: 'Simulation', icon: '⚙️' },
    { id: 'challenge', label: 'Challenge Mode', icon: '⚡' },
  ]

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={8} />

      {/* Hero intro section */}
      <div style={{
        minHeight: '45vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${COLOR}18 0%, transparent 70%)`,
        textAlign: 'center', padding: '60px 40px 0',
        position: 'relative',
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 5, color: COLOR, marginBottom: 14 }}>
          WORLD 01
        </motion.div>
        <motion.h1
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 700, letterSpacing: '-2px',
            textShadow: `0 0 40px ${COLOR}50`, marginBottom: 16, color: '#fff' }}>
          Decision Properties
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 17, color: '#8888aa', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Can you decode whether a language is alive, finite, or equivalent to another? Explore, simulate, and conquer.
        </motion.p>
      </div>

      {/* Tabs + Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <TabBar active={tab} onTab={setTab} tabs={TABS} />

        <AnimatePresence mode="wait">
          {tab === 'theory' && <TheoryTab key="theory" />}
          {tab === 'sim' && <SimulationTab key="sim" />}
          {tab === 'challenge' && <ChallengeTab key="challenge" onComplete={handleComplete} />}
        </AnimatePresence>

        {/* Default: show tab picker if no tab selected */}
        {tab === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginTop: 8 }}>
            {[
              { id: 'theory', icon: '📖', title: 'Explore Theory', desc: 'Learn about Membership, Emptiness, Finiteness & Equivalence problems for DFAs.' },
              { id: 'sim', icon: '⚙️', title: 'Jump to Simulation', desc: 'Run strings on the DFA interactively — watch each step animate in real time.' },
              { id: 'challenge', icon: '⚡', title: 'Unlock Challenge Mode', desc: 'Test your understanding with a timed challenge. Use hints if you get stuck!' },
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

        {/* World conquered banner */}
        <AnimatePresence>
          {worldDone && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 40, padding: '40px 32px',
                background: `radial-gradient(ellipse at center, ${COLOR}20 0%, transparent 70%)`,
                border: `1px solid ${COLOR}40`, borderRadius: 20, textAlign: 'center',
              }}>
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
                <h2 style={{ fontSize: 36, fontWeight: 700, color: COLOR, textShadow: `0 0 20px ${COLOR}`, marginBottom: 8 }}>
                  WORLD CONQUERED
                </h2>
                <p style={{ color: '#8888aa', marginBottom: 24 }}>You have mastered Decision Properties of Regular Languages!</p>
                <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>
                  ↩ Warp Back to Galaxy
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
