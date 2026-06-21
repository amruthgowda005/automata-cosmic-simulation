import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { runDPDA, stepDPDA, exampleDPDAs } from '../../simulations/dpda'
import useAppStore from '../../store/useAppStore'

const COLOR = '#0a84ff'

function StackViz({ stack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 4, minHeight: 160 }}>
      <AnimatePresence>
        {stack.map((sym, i) => (
          <motion.div
            key={`${sym}-${i}`}
            initial={{ y: -30, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 56, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === stack.length - 1 ? `${COLOR}40` : 'rgba(255,255,255,0.06)',
              border: `1px solid ${i === stack.length - 1 ? COLOR : 'rgba(255,255,255,0.15)'}`,
              fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700,
              color: i === stack.length - 1 ? COLOR : '#ccc',
              boxShadow: i === stack.length - 1 ? `0 0 12px ${COLOR}60` : 'none',
            }}
          >
            {sym}
          </motion.div>
        ))}
      </AnimatePresence>
      <div style={{ fontSize: 10, color: '#8888aa', fontFamily: 'JetBrains Mono', marginTop: 4 }}>STACK (top↑)</div>
    </div>
  )
}

function TapeViz({ input, pos }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '8px 0' }}>
      {input.split('').map((ch, i) => (
        <motion.div
          key={i}
          animate={{
            background: i < pos ? 'rgba(255,255,255,0.03)' :
              i === pos ? `${COLOR}40` : 'rgba(255,255,255,0.06)',
            borderColor: i === pos ? COLOR : 'rgba(255,255,255,0.15)',
          }}
          style={{
            minWidth: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700,
            color: i < pos ? '#444' : i === pos ? COLOR : '#ccc',
            position: 'relative',
          }}
        >
          {ch}
          {i === pos && (
            <div style={{ position: 'absolute', bottom: -14, fontSize: 14, color: COLOR }}>▲</div>
          )}
        </motion.div>
      ))}
      {pos >= input.length && input.length > 0 && (
        <div style={{ minWidth: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${COLOR}`, fontFamily: 'JetBrains Mono', color: COLOR, fontSize: 20, position: 'relative' }}>
          ⊣
          <div style={{ position: 'absolute', bottom: -14, fontSize: 14, color: COLOR }}>▲</div>
        </div>
      )}
    </div>
  )
}

function DPDASimulator() {
  const [selectedEx, setSelectedEx] = useState('anbn')
  const [customInput, setCustomInput] = useState('aaabbb')
  const [config, setConfig] = useState(null)
  const [trace, setTrace] = useState([])
  const [traceIdx, setTraceIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(600)
  const autoRef = useRef(null)

  const ex = exampleDPDAs[selectedEx]
  const dpda = ex.dpda

  const reset = () => {
    clearInterval(autoRef.current)
    setRunning(false)
    setConfig({ state: dpda.startState, inputPos: 0, stack: [dpda.startStack], input: customInput })
    setTrace([])
    setTraceIdx(0)
    setResult(null)
  }

  useEffect(() => { reset() }, [selectedEx, customInput])

  const step = () => {
    if (result) return
    const current = config
    const r = stepDPDA(current, dpda)
    if (!r) { setResult({ accepted: false, reason: 'No transition' }); return }
    if (r.done) { setResult(r); return }
    setConfig(r.nextConfig)
    setTrace(t => [...t, { config: r.nextConfig, description: r.description, action: r.action }])
    setTraceIdx(t => t + 1)
  }

  const autoRun = () => {
    if (running) { clearInterval(autoRef.current); setRunning(false); return }
    setRunning(true)
    autoRef.current = setInterval(() => {
      setConfig(prev => {
        const r = stepDPDA(prev, dpda)
        if (!r || r.done) {
          clearInterval(autoRef.current)
          setRunning(false)
          if (r) setResult(r)
          return prev
        }
        setTrace(t => [...t, { config: r.nextConfig, description: r.description }])
        return r.nextConfig
      })
    }, speed)
  }

  useEffect(() => () => clearInterval(autoRef.current), [])

  return (
    <div>
      {/* Example selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(exampleDPDAs).map(([k, v]) => (
          <button key={k} onClick={() => setSelectedEx(k)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13, fontFamily: 'JetBrains Mono',
            border: `1px solid ${selectedEx === k ? COLOR : 'rgba(255,255,255,0.2)'}`,
            background: selectedEx === k ? `${COLOR}20` : 'transparent',
            color: selectedEx === k ? COLOR : '#8888aa', cursor: 'pointer',
          }}>
            {v.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Input tape */}
        <GlassPanel color={COLOR}>
          <div style={{ fontSize: 12, color: COLOR, fontWeight: 700, marginBottom: 8 }}>INPUT TAPE</div>
          <input className="input-neon" value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            style={{ marginBottom: 10, borderColor: `${COLOR}60`, fontSize: 13 }}
            placeholder="Input string" />
          <TapeViz input={customInput} pos={config?.inputPos ?? 0} />
        </GlassPanel>

        {/* Stack */}
        <GlassPanel color={COLOR}>
          <div style={{ fontSize: 12, color: COLOR, fontWeight: 700, marginBottom: 8 }}>STACK</div>
          <StackViz stack={config?.stack ?? []} />
        </GlassPanel>

        {/* State */}
        <GlassPanel color={COLOR}>
          <div style={{ fontSize: 12, color: COLOR, fontWeight: 700, marginBottom: 16 }}>CURRENT STATE</div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <motion.div
              key={config?.state}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, borderRadius: '50%',
                border: `3px solid ${COLOR}`,
                background: `${COLOR}20`,
                fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono',
                color: COLOR, boxShadow: `0 0 20px ${COLOR}60`,
              }}
            >
              {config?.state}
            </motion.div>
          </div>
          {result && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                padding: '10px', borderRadius: 8, textAlign: 'center',
                background: result.accepted ? 'rgba(0,255,128,0.1)' : 'rgba(255,45,85,0.1)',
                border: `1px solid ${result.accepted ? '#00ff80' : '#ff2d55'}`,
                fontSize: 15, fontWeight: 700,
                color: result.accepted ? '#00ff80' : '#ff2d55',
              }}
            >
              {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
            </motion.div>
          )}
        </GlassPanel>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="btn-neon" onClick={step} disabled={!!result} style={{ fontSize: 12, padding: '10px 20px' }}>
          STEP →
        </button>
        <button className="btn-neon" onClick={autoRun} style={{ fontSize: 12, padding: '10px 20px' }}>
          {running ? '⏸ PAUSE' : '▶ AUTO RUN'}
        </button>
        <button onClick={reset} style={{
          fontSize: 12, padding: '10px 20px', borderRadius: 30,
          border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
          color: '#8888aa', cursor: 'pointer', fontFamily: 'Space Grotesk',
        }}>
          ↺ RESET
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontFamily: 'JetBrains Mono' }}>Speed</span>
          <input type="range" min={100} max={1200} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ accentColor: COLOR, width: 80 }} />
        </div>
      </div>

      {/* Trace log */}
      {trace.length > 0 && (
        <GlassPanel color={COLOR} style={{ maxHeight: 160, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, color: COLOR, marginBottom: 8 }}>EXECUTION TRACE</div>
          {trace.slice(-8).map((t, i) => (
            <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#8888aa', marginBottom: 3 }}>
              {t.description}
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  )
}

function Challenge({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [timer, setTimer] = useState(0)
  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    if (answer.trim().toLowerCase().includes('accept') || answer.trim().toLowerCase() === 'yes') {
      setStatus('correct'); onComplete()
    } else { setStatus('wrong'); setTimeout(() => setStatus(null), 1200) }
  }

  return (
    <GlassPanel color={COLOR} style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: COLOR, fontWeight: 700, fontSize: 14 }}>⚡ CHALLENGE</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#8888aa' }}>
          {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
        </span>
      </div>
      <p style={{ marginBottom: 16, color: '#ccc', fontSize: 14, lineHeight: 1.8 }}>
        Does the aⁿbⁿ DPDA accept <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>'aaabbb'</code>?
        <br />Use the simulator above to trace the execution. Type: <em>yes (accepted)</em> or <em>no (rejected)</em>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input className={`input-neon ${status === 'wrong' ? 'shake' : ''}`}
          value={answer} onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="yes / no" />
        <button className="btn-neon" onClick={check} style={{ fontSize: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>CHECK</button>
      </div>
      {status === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: 14, color: '#00ff80', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
          🎉 YES — 3 a's pushed, 3 b's popped!
        </motion.div>
      )}
    </GlassPanel>
  )
}

export default function World4() {
  const { completeWorld, startWarp } = useAppStore()
  const [worldDone, setWorldDone] = useState(false)

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={10} />

      <motion.div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${COLOR}15 0%, transparent 70%)`,
        textAlign: 'center', padding: 40, position: 'relative',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: COLOR, marginBottom: 16 }}>WORLD 04</div>
        <motion.h1 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 30px ${COLOR}60`, marginBottom: 20 }}>
          DPDA
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontSize: 18, color: '#8888aa', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
          A stack gives memory. Determinism gives power. Together, they parse what DFAs never could.
        </motion.p>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', bottom: 32, color: '#8888aa', fontSize: 22 }}>↓</motion.div>
      </motion.div>

      <div style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: COLOR }}>How DPDAs Work</h2>
        {[
          { title: 'Components', text: '(Q, Σ, Γ, δ, q₀, Z₀, F) — states, input alphabet, stack alphabet, transition function, start state, initial stack symbol, accept states.' },
          { title: 'Determinism', text: 'δ(q, a, A) has at most ONE result. No choices — for every state, input, stack-top combination there is exactly one move.' },
          { title: 'The Stack Power', text: 'Push to count, pop to match. For aⁿbⁿ: push A for each a, pop A for each b. If stack empties exactly when input ends → accept!' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ x: -40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <GlassPanel color={COLOR} style={{ marginBottom: 14 }}>
              <div style={{ color: COLOR, fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{item.title}</div>
              <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7 }}>{item.text}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div style={{ padding: '60px 40px', background: `${COLOR}08` }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: COLOR }}>DPDA Simulator</h2>
          <p style={{ color: '#8888aa', marginBottom: 32 }}>Step through transitions, watch the stack evolve.</p>
          <DPDASimulator />
        </div>
      </div>

      <div style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Challenge Mode</h2>
          <Challenge onComplete={() => { completeWorld(4); setWorldDone(true) }} />
        </div>
      </div>

      <AnimatePresence>
        {worldDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '80px 40px', textAlign: 'center', background: `radial-gradient(ellipse at center, ${COLOR}20 0%, transparent 70%)` }}>
            <motion.h2 initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: COLOR, textShadow: `0 0 30px ${COLOR}`, marginBottom: 20 }}>
              🌟 WORLD CONQUERED
            </motion.h2>
            <GlassPanel color={COLOR} style={{ maxWidth: 500, margin: '0 auto 32px', textAlign: 'left' }}>
              <h3 style={{ color: COLOR, marginBottom: 12 }}>What You Learned:</h3>
              {['DPDAs extend DFAs with a stack for counting and matching',
                'Determinism means at most one move per (state, input, stack-top) triple',
                'Languages like aⁿbⁿ are DCFL — not regular, but DPDA-recognizable'].map((p, i) => (
                <p key={i} style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>✓ {p}</p>
              ))}
            </GlassPanel>
            <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>↩ Warp Back to Galaxy</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
