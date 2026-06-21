import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { runDFA, checkEmptiness, checkFiniteness, getDefaultDFA } from '../../simulations/dfa'
import { mathHTML } from '../../utils/mathHelpers'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ff2d55'
const DEFAULT_DFA = getDefaultDFA()

const THEORY_STEPS = [
  { title: 'Membership Problem', latex: 'w \\in L(M)?', desc: 'Does the DFA M accept the string w? Run w on M — if it ends in an accept state, yes!' },
  { title: 'Emptiness Problem', latex: 'L(M) = \\emptyset?', desc: 'Is there ANY string the DFA accepts? BFS from start state — if no accept state is reachable, the language is empty.' },
  { title: 'Finiteness Problem', latex: '|L(M)| < \\infty?', desc: 'Does the DFA accept finitely many strings? Look for cycles on paths to accept states — a cycle means infinite language.' },
  { title: 'Equivalence Problem', latex: 'L(M_1) = L(M_2)?', desc: 'Do two DFAs accept exactly the same language? Build their product DFA and check if the symmetric difference is empty.' },
]

function TheoryCard({ step, index, active }) {
  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={active ? { x: 0, opacity: 1 } : { x: -60, opacity: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <GlassPanel color={COLOR} style={{ marginBottom: 16 }}>
        <h3 style={{ color: COLOR, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
        <div dangerouslySetInnerHTML={mathHTML(step.latex)} style={{ marginBottom: 8, fontSize: 18 }} />
        <p style={{ color: '#8888aa', fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
      </GlassPanel>
    </motion.div>
  )
}

function DFASimulator() {
  const [dfa] = useState(DEFAULT_DFA)
  const [input, setInput] = useState('101')
  const [result, setResult] = useState(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [emptiness, setEmptiness] = useState(null)
  const [finiteness, setFiniteness] = useState(null)
  const resultRef = useRef()

  const runSimulation = () => {
    if (!input && input !== '') return
    const res = runDFA(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates, input)
    setResult(res)
    setCurrentStep(-1)
    setIsRunning(true)
    // Animate steps
    res.steps.forEach((_, i) => {
      setTimeout(() => setCurrentStep(i), i * 600)
    })
    setTimeout(() => { setIsRunning(false); setCurrentStep(res.steps.length) }, res.steps.length * 600 + 400)
  }

  const handleEmptiness = () => {
    const r = checkEmptiness(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates)
    setEmptiness(r)
  }
  const handleFiniteness = () => {
    const r = checkFiniteness(dfa.states, dfa.transitions, dfa.startState, dfa.acceptStates)
    setFiniteness(r)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* DFA Diagram */}
      <GlassPanel color={COLOR}>
        <h3 style={{ color: COLOR, marginBottom: 16, fontSize: 15, fontWeight: 700 }}>DFA: Strings ending in '0'</h3>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {dfa.states.map(s => (
            <motion.div
              key={s}
              animate={{
                scale: result?.path?.includes(s) && currentStep >= 0 ? 1.2 : 1,
                backgroundColor: result?.path?.[currentStep + 1] === s ? `${COLOR}40` :
                  dfa.acceptStates.includes(s) ? 'rgba(255,45,85,0.15)' : 'rgba(255,255,255,0.05)',
              }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                border: `2px solid ${dfa.acceptStates.includes(s) ? COLOR : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700,
                boxShadow: dfa.acceptStates.includes(s) ? `0 0 12px ${COLOR}60` : 'none',
                transition: 'all 0.3s',
              }}
            >
              {s}
            </motion.div>
          ))}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#8888aa', lineHeight: 1.8 }}>
          <div>Start: {dfa.startState} | Accept: {dfa.acceptStates.join(', ')}</div>
          <div style={{ marginTop: 8 }}>
            {Object.entries(dfa.transitions).slice(0, 6).map(([k, v]) => (
              <div key={k} style={{ color: '#8888aa88' }}>{k} → {v}</div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>RUN SIMULATION</h3>
          <input
            className="input-neon"
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null) }}
            placeholder="Input string (e.g., 101)"
            style={{ marginBottom: 10, borderColor: `${COLOR}60` }}
          />
          <button className="btn-neon" onClick={runSimulation} style={{ fontSize: 12, padding: '10px 20px', width: '100%' }}>
            ▶ RUN DFA
          </button>

          <AnimatePresence>
            {result && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 16, padding: '14px', borderRadius: 10,
                  background: result.accepted ? 'rgba(0,255,128,0.1)' : 'rgba(255,45,85,0.1)',
                  border: `1px solid ${result.accepted ? '#00ff80' : COLOR}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: result.accepted ? '#00ff80' : COLOR }}>
                  {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
                </div>
                <div style={{ fontSize: 12, color: '#8888aa', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
                  Path: {result.path.join(' → ')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>

        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>DECISION PROBLEMS</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button className="btn-neon" onClick={handleEmptiness} style={{ fontSize: 11, padding: '8px 14px', flex: 1 }}>
              Check Emptiness
            </button>
            <button className="btn-neon" onClick={handleFiniteness} style={{ fontSize: 11, padding: '8px 14px', flex: 1 }}>
              Check Finiteness
            </button>
          </div>
          {emptiness && (
            <div style={{ fontSize: 12, color: '#8888aa', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>
              L(M) is <span style={{ color: emptiness.isEmpty ? COLOR : '#00ff80' }}>{emptiness.isEmpty ? 'EMPTY ∅' : 'NOT EMPTY'}</span>
              {!emptiness.isEmpty && <> · Reaches: {emptiness.reachableAcceptStates.join(', ')}</>}
            </div>
          )}
          {finiteness && (
            <div style={{ fontSize: 12, color: '#8888aa', fontFamily: 'JetBrains Mono' }}>
              L(M) is <span style={{ color: finiteness.isFinite ? '#ffd60a' : COLOR }}>{finiteness.isFinite ? 'FINITE' : 'INFINITE (cycle found)'}</span>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}

function Challenge({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [hints, setHints] = useState(0)
  const [timer, setTimer] = useState(0)
  const HINTS = ['The DFA accepts strings ending in 0', 'Try tracing: q0 →1→ q2 →0→ q1', '101 ends in 1, not 0']

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
      setTimeout(() => setStatus(null), 1200)
    }
  }

  return (
    <GlassPanel color={COLOR} style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: COLOR, fontWeight: 700, fontSize: 14 }}>⚡ CHALLENGE UNLOCKED</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#8888aa' }}>
          {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
        </span>
      </div>
      <p style={{ marginBottom: 16, color: '#ccc', fontSize: 15, lineHeight: 1.7 }}>
        Does the DFA (accepting strings ending in 0) accept the string <code style={{ color: COLOR, background: 'rgba(255,45,85,0.1)', padding: '2px 6px', borderRadius: 4 }}>'101'</code>?
        <br />Type: <em>accepted</em> or <em>rejected</em>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className={`input-neon ${status === 'wrong' ? 'shake' : ''}`}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="accepted / rejected"
          style={{ borderColor: status === 'correct' ? '#00ff80' : status === 'wrong' ? COLOR : undefined }}
        />
        <button className="btn-neon" onClick={check} style={{ fontSize: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>
          CHECK
        </button>
      </div>
      {status === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: 16, color: '#00ff80', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
          🎉 CORRECT! World Conquered!
        </motion.div>
      )}
      <button onClick={() => setHints(h => Math.min(h + 1, HINTS.length))} style={{ marginTop: 12, background: 'none', border: 'none', color: '#8888aa', fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
        💡 Hint ({hints}/{HINTS.length})
      </button>
      {hints > 0 && <div style={{ marginTop: 8, color: '#ffd60a', fontSize: 13, fontFamily: 'JetBrains Mono' }}>{HINTS[hints - 1]}</div>}
    </GlassPanel>
  )
}

export default function World1() {
  const { completeWorld, startWarp } = useAppStore()
  const [scene, setScene] = useState('intro')
  const [theorySeen, setTheorySeen] = useState(false)
  const [worldDone, setWorldDone] = useState(false)

  const handleComplete = () => { completeWorld(1); setWorldDone(true) }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={10} />

      {/* SCENE A — Intro */}
      <motion.div
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${COLOR}15 0%, transparent 70%)`,
          textAlign: 'center', padding: 40, position: 'relative',
        }}
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: COLOR, marginBottom: 16 }}>
          WORLD 01
        </motion.div>
        <motion.h1
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, letterSpacing: '-2px', color: '#fff',
            textShadow: `0 0 30px ${COLOR}60`, marginBottom: 20 }}
        >
          Decision Properties
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontSize: 18, color: '#8888aa', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}
        >
          Every language hides a secret — can you decode whether it's alive, finite, or equal to another?
        </motion.p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-neon" onClick={() => setScene('theory')} style={{ fontSize: 13 }}>
            Explore Theory →
          </button>
          <button className="btn-neon" onClick={() => setScene('sim')} style={{ fontSize: 13 }}>
            Jump to Simulation →
          </button>
        </div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', bottom: 32, color: '#8888aa', fontSize: 22 }}>↓</motion.div>
      </motion.div>

      {/* SCENE B — Theory */}
      <div style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Theory Unfolds</h2>
        {THEORY_STEPS.map((step, i) => (
          <TheoryCard key={i} step={step} index={i} active={true} />
        ))}
        <button className="btn-neon" onClick={() => setScene('sim')} style={{ marginTop: 32, fontSize: 13 }}>
          Enter the Simulation →
        </button>
      </div>

      {/* SCENE C — Simulation */}
      <div style={{ padding: '60px 40px', background: `${COLOR}08` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: COLOR }}>Interactive Simulation</h2>
          <p style={{ color: '#8888aa', marginBottom: 32 }}>Build and run your DFA. Watch it come alive.</p>
          <DFASimulator />
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="btn-neon" onClick={() => setScene('challenge')} style={{ fontSize: 13 }}>
              ⚡ Unlock Challenge Mode
            </button>
          </div>
        </div>
      </div>

      {/* SCENE D — Challenge */}
      <div style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Challenge Mode</h2>
          <Challenge onComplete={handleComplete} />
        </div>
      </div>

      {/* SCENE E — World Complete */}
      <AnimatePresence>
        {worldDone && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: '80px 40px', background: `radial-gradient(ellipse at center, ${COLOR}20 0%, transparent 70%)`,
              textAlign: 'center',
            }}
          >
            <motion.h2
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: COLOR, textShadow: `0 0 30px ${COLOR}`, marginBottom: 20 }}
            >
              🌟 WORLD CONQUERED
            </motion.h2>
            <GlassPanel color={COLOR} style={{ maxWidth: 500, margin: '0 auto 32px', textAlign: 'left' }}>
              <h3 style={{ color: COLOR, marginBottom: 12 }}>What You Learned:</h3>
              {['DFAs can decide if a string is in a language in linear time',
                'Emptiness is checked via BFS reachability from the start state',
                'Finiteness is determined by detecting cycles on paths to accept states'].map((p, i) => (
                <p key={i} style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>✓ {p}</p>
              ))}
            </GlassPanel>
            <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>
              ↩ Warp Back to Galaxy
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
