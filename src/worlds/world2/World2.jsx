import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { matchRegex, verifyLaw, ALGEBRAIC_LAWS } from '../../simulations/regex'
import { mathHTML } from '../../utils/mathHelpers'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ff6b00'

function LawCard({ law, selected, onSelect }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect(law)}
      style={{
        cursor: 'pointer', padding: '14px 18px', borderRadius: 12,
        background: selected ? `${COLOR}20` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? COLOR : 'rgba(255,255,255,0.1)'}`,
        boxShadow: selected ? `0 0 16px ${COLOR}40` : 'none',
        transition: 'all 0.25s',
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 11, color: COLOR, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{law.name}</div>
      <div dangerouslySetInnerHTML={mathHTML(law.equation)} style={{ fontSize: 15 }} />
      <div style={{ fontSize: 12, color: '#8888aa', marginTop: 4 }}>{law.description}</div>
    </motion.div>
  )
}

function RegexSimulator() {
  const [r1, setR1] = useState('a*b')
  const [r2, setR2] = useState('a*b')
  const [testStr, setTestStr] = useState('aab')
  const [result, setResult] = useState(null)
  const [test1, setTest1] = useState(null)
  const [test2, setTest2] = useState(null)
  const [selectedLaw, setSelectedLaw] = useState(null)

  const checkEquiv = () => {
    try {
      const res = verifyLaw(r1, r2)
      setResult(res)
    } catch { setResult({ equivalent: false, error: 'Parse error' }) }
  }

  const testString = () => {
    setTest1(matchRegex(r1, testStr))
    setTest2(matchRegex(r2, testStr))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <GlassPanel color={COLOR} style={{ marginBottom: 16 }}>
          <h3 style={{ color: COLOR, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>REGEX EQUIVALENCE CHECKER</h3>
          <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 4 }}>Regex 1</label>
          <input className="input-neon" value={r1} onChange={e => setR1(e.target.value)}
            placeholder="e.g. a*b" style={{ marginBottom: 10, borderColor: `${COLOR}60` }} />
          <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 4 }}>Regex 2</label>
          <input className="input-neon" value={r2} onChange={e => setR2(e.target.value)}
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
                }}
              >
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
          <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>LIVE TESTER</h3>
          <input className="input-neon" value={testStr} onChange={e => setTestStr(e.target.value)}
            placeholder="Test string" style={{ marginBottom: 10 }} />
          <button className="btn-neon" onClick={testString} style={{ width: '100%', fontSize: 12, padding: '10px' }}>
            TEST BOTH
          </button>
          {test1 !== null && (
            <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono', fontSize: 13 }}>
              <div>R1: <span style={{ color: test1 ? '#00ff80' : '#ff2d55' }}>{test1 ? '✓' : '✗'}</span></div>
              <div>R2: <span style={{ color: test2 ? '#00ff80' : '#ff2d55' }}>{test2 ? '✓' : '✗'}</span></div>
            </div>
          )}
        </GlassPanel>
      </div>

      <div>
        <h3 style={{ color: COLOR, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>ALGEBRAIC LAWS</h3>
        {ALGEBRAIC_LAWS.map(law => (
          <LawCard key={law.id} law={law} selected={selectedLaw?.id === law.id} onSelect={setSelectedLaw} />
        ))}
        {selectedLaw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginTop: 12, padding: 14, background: `${COLOR}15`, borderRadius: 10, border: `1px solid ${COLOR}40` }}>
            <div style={{ fontSize: 13, color: '#ccc' }}>
              <strong style={{ color: COLOR }}>{selectedLaw.name}:</strong> {selectedLaw.description}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function Challenge({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [timer, setTimer] = useState(0)
  const HINTS = ['(a+b)* matches all strings over {a,b}', 'So (a+b)*·a·(a+b)* = strings containing at least one a', 'Try applying (R*)* = R* and distributivity']

  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    const a = answer.trim().replace(/\s/g, '')
    if (a.includes('(a+b)*a(a+b)*') || a.includes('(a|b)*a(a|b)*')) {
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
        Simplify <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>(a+b)*·a·(a+b)*</code> using algebraic laws.
        <br />What does this regex represent? Type the simplified form.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input className={`input-neon ${status === 'wrong' ? 'shake' : ''}`}
          value={answer} onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="e.g. (a+b)*a(a+b)*"
          style={{ borderColor: status === 'correct' ? '#00ff80' : undefined }} />
        <button className="btn-neon" onClick={check} style={{ fontSize: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>CHECK</button>
      </div>
      {status === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: 14, color: '#00ff80', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
          🎉 CORRECT! Strings containing at least one 'a'!
        </motion.div>
      )}
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 12, color: '#8888aa', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>💡 Hints</summary>
        {HINTS.map((h, i) => <p key={i} style={{ marginTop: 6, fontSize: 12, color: '#ffd60a', fontFamily: 'JetBrains Mono' }}>{i + 1}. {h}</p>)}
      </details>
    </GlassPanel>
  )
}

export default function World2() {
  const { completeWorld, startWarp } = useAppStore()
  const [worldDone, setWorldDone] = useState(false)

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={10} />

      {/* Intro */}
      <motion.div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${COLOR}15 0%, transparent 70%)`,
        textAlign: 'center', padding: 40, position: 'relative',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: COLOR, marginBottom: 16 }}>WORLD 02</div>
        <motion.h1 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 30px ${COLOR}60`, marginBottom: 20 }}>
          Algebraic Laws
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontSize: 18, color: '#8888aa', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
          Regular expressions obey laws as elegant as algebra — master them to simplify any pattern.
        </motion.p>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', bottom: 32, color: '#8888aa', fontSize: 22 }}>↓</motion.div>
      </motion.div>

      {/* Theory */}
      <div style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>The Laws</h2>
        {ALGEBRAIC_LAWS.map((law, i) => (
          <motion.div key={law.id} initial={{ x: -40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}>
            <GlassPanel color={COLOR} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: COLOR, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{law.name}</div>
                  <div dangerouslySetInnerHTML={mathHTML(law.equation)} />
                </div>
                <div style={{ fontSize: 13, color: '#8888aa', maxWidth: 240, textAlign: 'right', marginLeft: 20 }}>{law.description}</div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* Simulation */}
      <div style={{ padding: '60px 40px', background: `${COLOR}08` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Regex Lab</h2>
          <RegexSimulator />
        </div>
      </div>

      {/* Challenge */}
      <div style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Challenge Mode</h2>
          <Challenge onComplete={() => { completeWorld(2); setWorldDone(true) }} />
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
              {['Regular expressions obey algebraic laws like identity, annihilation and idempotency',
                'Equivalence of two regexes can be verified via DFA conversion',
                'Algebraic simplification reduces complex patterns to minimal form'].map((p, i) => (
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
