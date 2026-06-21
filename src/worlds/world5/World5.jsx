import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { convertToGNF, verifyGNF, GNF_EXAMPLE_GRAMMARS } from '../../simulations/gnf'
import useAppStore from '../../store/useAppStore'

const COLOR = '#bf5af2'

function RuleCard({ variable, productions, color = COLOR, highlight = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      style={{
        padding: '10px 16px', borderRadius: 10, marginBottom: 6,
        background: highlight ? `${color}25` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: highlight ? `0 0 12px ${color}40` : 'none',
        transition: 'all 0.25s',
        cursor: 'default',
      }}
    >
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14 }}>
        <span style={{ color }}>{variable}</span>
        <span style={{ color: '#8888aa' }}> → </span>
        <span style={{ color: '#fff' }}>{productions.map(p => p.length === 0 ? 'ε' : p.join(' ')).join(' | ')}</span>
      </span>
    </motion.div>
  )
}

function GNFSimulator() {
  const [grammarText, setGrammarText] = useState(GNF_EXAMPLE_GRAMMARS[0].text)
  const [result, setResult] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')

  const run = () => {
    setError('')
    setActiveStep(0)
    if (!grammarText.trim()) { setError('Please enter a grammar'); return }
    try {
      const r = convertToGNF(grammarText)
      if (r.error) { setError(r.error); return }
      setResult(r)
    } catch (e) { setError(e.message) }
  }

  return (
    <div>
      {/* Grammar input */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>GRAMMAR INPUT</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {GNF_EXAMPLE_GRAMMARS.map(g => (
              <button key={g.name} onClick={() => setGrammarText(g.text)} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${COLOR}60`, background: 'transparent',
                color: COLOR, cursor: 'pointer', fontFamily: 'JetBrains Mono',
              }}>{g.name}</button>
            ))}
          </div>
          <textarea
            value={grammarText}
            onChange={e => setGrammarText(e.target.value)}
            rows={5}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${COLOR}40`, borderRadius: 8,
              color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 13,
              padding: '10px 14px', outline: 'none', resize: 'vertical',
            }}
            placeholder="S -> S S | ( S ) | ε"
          />
          {error && <div style={{ color: '#ff2d55', fontSize: 12, marginTop: 6 }}>{error}</div>}
          <button className="btn-neon" onClick={run} style={{ marginTop: 12, width: '100%', fontSize: 12, padding: '10px' }}>
            ▶ CONVERT TO GNF
          </button>
        </GlassPanel>

        {/* Final result */}
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {result ? 'GNF RESULT' : 'OUTPUT'}
          </h3>
          {result ? (
            <>
              {result.verification && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                  background: result.verification.valid ? 'rgba(0,255,128,0.1)' : 'rgba(255,107,0,0.1)',
                  border: `1px solid ${result.verification.valid ? '#00ff80' : '#ff6b00'}`,
                  fontSize: 13, fontWeight: 700,
                  color: result.verification.valid ? '#00ff80' : '#ff6b00',
                }}>
                  {result.verification.valid ? '✓ Valid GNF' : `⚠ Needs revision`}
                </div>
              )}
              {result.final && Object.entries(result.final.rules).map(([v, prods]) => (
                <RuleCard key={v} variable={v} productions={prods} color={COLOR} highlight={result.verification?.valid} delay={0} />
              ))}
            </>
          ) : (
            <div style={{ color: '#8888aa', fontSize: 14, marginTop: 20, textAlign: 'center' }}>
              Convert a grammar to see GNF output here
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Step-by-step */}
      {result?.steps && result.steps.length > 0 && (
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>STEP-BY-STEP CONVERSION</h3>
          {/* Step tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {result.steps.map((step, i) => (
              <button key={i} onClick={() => setActiveStep(i)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontFamily: 'JetBrains Mono',
                border: `1px solid ${activeStep === i ? COLOR : 'rgba(255,255,255,0.15)'}`,
                background: activeStep === i ? `${COLOR}25` : 'transparent',
                color: activeStep === i ? COLOR : '#8888aa', cursor: 'pointer',
              }}>
                {i + 1}. {step.title}
              </button>
            ))}
          </div>

          {/* Active step */}
          <AnimatePresence mode="wait">
            <motion.div key={activeStep}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 14, fontFamily: 'JetBrains Mono' }}>
                {result.steps[activeStep]?.description}
              </div>
              {result.steps[activeStep] && Object.entries(result.steps[activeStep].grammar).map(([v, prods], i) => (
                <RuleCard key={v} variable={v} productions={prods} color={COLOR} delay={i * 0.05} />
              ))}
            </motion.div>
          </AnimatePresence>
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
    const a = answer.trim().toLowerCase()
    if (a.includes('terminal') || a.includes('a') || a.includes('converted') || a.includes('yes')) {
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
        Convert <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>S → SS | (S) | ε</code> to GNF.
        <br />In GNF, what must every production start with? Type: <em>a terminal symbol</em> or <em>terminal</em>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input className={`input-neon ${status === 'wrong' ? 'shake' : ''}`}
          value={answer} onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="a terminal symbol" />
        <button className="btn-neon" onClick={check} style={{ fontSize: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>CHECK</button>
      </div>
      {status === 'correct' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: 14, color: '#00ff80', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
          🎉 Correct! A → aα where a ∈ Σ
        </motion.div>
      )}
      <p style={{ marginTop: 12, fontSize: 12, color: '#8888aa' }}>
        💡 Hint: GNF requires every production to begin with a terminal, not a variable
      </p>
    </GlassPanel>
  )
}

export default function World5() {
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
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: COLOR, marginBottom: 16 }}>WORLD 05</div>
        <motion.h1 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 30px ${COLOR}60`, marginBottom: 20 }}>
          Greibach Normal Form
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontSize: 18, color: '#8888aa', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
          Every grammar has a canonical form where every rule begins with a single terminal. Pure. Elegant. Parsable.
        </motion.p>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', bottom: 32, color: '#8888aa', fontSize: 22 }}>↓</motion.div>
      </motion.div>

      <div style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: COLOR }}>GNF Theory</h2>
        {[
          { title: 'Definition', text: 'A CFG is in GNF if every production has the form A → aα where a is a terminal and α is a (possibly empty) string of variables.' },
          { title: 'Why GNF?', text: 'GNF enables top-down parsing without guessing: each rule begins with a unique terminal, making parser decisions trivial.' },
          { title: 'Conversion Steps', text: '1) Order variables. 2) Eliminate left recursion Aᵢ → Aⱼα (j < i). 3) Substitute to get terminal-first productions. 4) Introduce new variables for right recursion.' },
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
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>GNF Converter</h2>
          <GNFSimulator />
        </div>
      </div>

      <div style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Challenge Mode</h2>
          <Challenge onComplete={() => { completeWorld(5); setWorldDone(true) }} />
        </div>
      </div>

      <AnimatePresence>
        {worldDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '80px 40px', textAlign: 'center', background: `radial-gradient(ellipse at center, ${COLOR}20 0%, transparent 70%)` }}>
            <motion.h2 initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: COLOR, textShadow: `0 0 30px ${COLOR}`, marginBottom: 20 }}>
              🌟 ALL WORLDS CONQUERED!
            </motion.h2>
            <GlassPanel color={COLOR} style={{ maxWidth: 500, margin: '0 auto 32px', textAlign: 'left' }}>
              <h3 style={{ color: COLOR, marginBottom: 12 }}>What You Learned:</h3>
              {['GNF requires every production to start with a terminal symbol',
                'Conversion requires ordering variables and eliminating left recursion',
                'GNF enables predictive parsing and simplifies grammar analysis'].map((p, i) => (
                <p key={i} style={{ color: '#ccc', fontSize: 14, marginBottom: 8 }}>✓ {p}</p>
              ))}
            </GlassPanel>
            <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>↩ Return to Galaxy</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
