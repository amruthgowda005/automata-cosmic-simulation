import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { convertToGNF, GNF_EXAMPLE_GRAMMARS } from '../../simulations/gnf'
import useAppStore from '../../store/useAppStore'

const COLOR = '#bf5af2'

function TabBar({ active, onTab, tabs }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)', marginBottom: 32, flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 12, border: 'none',
          cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600,
          letterSpacing: 1, transition: 'all 0.25s',
          background: active === t.id ? COLOR : 'transparent',
          color: active === t.id ? '#fff' : '#8888aa',
          boxShadow: active === t.id ? `0 0 16px ${COLOR}60` : 'none',
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  )
}

function RuleCard({ variable, productions, color = COLOR, highlight = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      style={{
        padding: '10px 16px', borderRadius: 10, marginBottom: 6,
        background: highlight ? `${color}25` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: highlight ? `0 0 12px ${color}40` : 'none',
        transition: 'all 0.25s', cursor: 'default',
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

function TheoryTab() {
  const items = [
    { title: 'Definition', text: 'A CFG is in GNF if every production has the form A → aα where a is a terminal and α is a (possibly empty) string of variables.' },
    { title: 'Why GNF?', text: 'GNF enables top-down parsing without guessing: each rule begins with a unique terminal, making parser decisions trivial.' },
    { title: 'Conversion Steps', text: '1) Order variables. 2) Eliminate left recursion Aᵢ → Aⱼα (j < i). 3) Substitute to get terminal-first productions. 4) Introduce new variables for right recursion.' },
  ]
  return (
    <motion.div key="theory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassPanel color={COLOR} style={{ height: '100%' }}>
              <h3 style={{ color: COLOR, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
              <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function SimulationTab() {
  const [grammarText, setGrammarText] = useState(GNF_EXAMPLE_GRAMMARS[0].text)
  const [result, setResult] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')

  const run = () => {
    setError(''); setActiveStep(0)
    if (!grammarText.trim()) { setError('Please enter a grammar'); return }
    try {
      const r = convertToGNF(grammarText)
      if (r.error) { setError(r.error); return }
      setResult(r)
    } catch (e) { setError(e.message) }
  }

  return (
    <motion.div key="sim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20, marginBottom: 20 }}>
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 GRAMMAR INPUT</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {GNF_EXAMPLE_GRAMMARS.map(g => (
              <button key={g.name} onClick={() => setGrammarText(g.text)} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${COLOR}60`, background: 'transparent',
                color: COLOR, cursor: 'pointer', fontFamily: 'JetBrains Mono',
              }}>{g.name}</button>
            ))}
          </div>
          <textarea value={grammarText} onChange={e => setGrammarText(e.target.value)} rows={5}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLOR}40`,
              borderRadius: 8, color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 13,
              padding: '10px 14px', outline: 'none', resize: 'vertical' }}
            placeholder="S -> S S | ( S ) | ε" />
          {error && <div style={{ color: '#ff2d55', fontSize: 12, marginTop: 6 }}>{error}</div>}
          <button className="btn-neon" onClick={run} style={{ marginTop: 12, width: '100%', fontSize: 12, padding: '10px' }}>
            ▶ CONVERT TO GNF
          </button>
        </GlassPanel>

        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{result ? 'GNF RESULT' : 'OUTPUT'}</h3>
          {result ? (
            <>
              {result.verification && (
                <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                  background: result.verification.valid ? 'rgba(0,255,128,0.1)' : 'rgba(255,107,0,0.1)',
                  border: `1px solid ${result.verification.valid ? '#00ff80' : '#ff6b00'}`,
                  fontSize: 13, fontWeight: 700, color: result.verification.valid ? '#00ff80' : '#ff6b00' }}>
                  {result.verification.valid ? '✓ Valid GNF' : `⚠ Needs revision`}
                </div>
              )}
              {result.final && Object.entries(result.final.rules).map(([v, prods]) => (
                <RuleCard key={v} variable={v} productions={prods} color={COLOR} highlight={result.verification?.valid} delay={0} />
              ))}
            </>
          ) : (
            <div style={{ color: '#8888aa', fontSize: 14, marginTop: 20, textAlign: 'center' }}>Convert a grammar to see GNF output here</div>
          )}
        </GlassPanel>
      </div>

      {result?.steps && result.steps.length > 0 && (
        <GlassPanel color={COLOR}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>STEP-BY-STEP CONVERSION</h3>
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
          <AnimatePresence mode="wait">
            <motion.div key={activeStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
    </motion.div>
  )
}

function ChallengeTab({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [hints, setHints] = useState(0)
  const [timer, setTimer] = useState(0)
  const HINTS = ['GNF is all about making parsing easier', 'What symbol tells a parser exactly what to match first?', 'Answer: terminal']

  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    const a = answer.trim().toLowerCase()
    if (a.includes('terminal') || a.includes('a') || a.includes('yes')) {
      setStatus('correct'); onComplete()
    } else { setStatus('wrong'); setTimeout(() => setStatus(null), 1200) }
  }

  return (
    <motion.div key="challenge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <GlassPanel color={COLOR}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ color: COLOR, fontWeight: 700, fontSize: 14 }}>⚡ CHALLENGE</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#8888aa' }}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </span>
          </div>
          <p style={{ marginBottom: 16, color: '#ccc', fontSize: 14, lineHeight: 1.8 }}>
            Convert <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>S → SS | (S) | ε</code> to GNF.
            <br />In GNF, what must every production start with? Type: <em>terminal</em>
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className={`input-neon ${status === 'wrong' ? 'shake' : ''}`}
              value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()} placeholder="terminal" />
            <button className="btn-neon" onClick={check} style={{ fontSize: 12, padding: '10px 20px', whiteSpace: 'nowrap' }}>CHECK</button>
          </div>
          {status === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginTop: 14, color: '#00ff80', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
              🎉 Correct! A → aα where a ∈ Σ
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

export default function World5() {
  const { completeWorld, startWarp } = useAppStore()
  const [tab, setTab] = useState('intro')
  const [worldDone, setWorldDone] = useState(false)

  const TABS = [
    { id: 'theory', label: 'Explore Theory', icon: '📖' },
    { id: 'sim', label: 'GNF Converter', icon: '⚙️' },
    { id: 'challenge', label: 'Challenge Mode', icon: '⚡' },
  ]

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={8} />
      <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${COLOR}18 0%, transparent 70%)`,
        textAlign: 'center', padding: '60px 40px 0' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 5, color: COLOR, marginBottom: 14 }}>WORLD 05</motion.div>
        <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 40px ${COLOR}50`, marginBottom: 16, color: '#fff' }}>
          Greibach Normal Form
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 17, color: '#8888aa', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Every grammar has a canonical form where every rule begins with a single terminal. Pure. Elegant. Parsable.
        </motion.p>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 80px' }}>
        <TabBar active={tab} onTab={setTab} tabs={TABS} />
        <AnimatePresence mode="wait">
          {tab === 'theory' && <TheoryTab key="theory" />}
          {tab === 'sim' && <SimulationTab key="sim" />}
          {tab === 'challenge' && <ChallengeTab key="challenge" onComplete={() => { completeWorld(5); setWorldDone(true) }} />}
        </AnimatePresence>
        {tab === 'intro' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginTop: 8 }}>
            {[
              { id: 'theory', icon: '📖', title: 'Explore Theory', desc: 'Learn why Greibach Normal Form is important and the algorithm to achieve it.' },
              { id: 'sim', icon: '⚙️', title: 'GNF Converter', desc: 'Convert any CFG to Greibach Normal Form and view the step-by-step mathematical transformations.' },
              { id: 'challenge', icon: '⚡', title: 'Challenge Mode', desc: 'Answer a quick question about GNF to unlock the final badge!' },
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
                <h2 style={{ fontSize: 36, fontWeight: 700, color: COLOR, textShadow: `0 0 20px ${COLOR}`, marginBottom: 8 }}>ALL WORLDS CONQUERED!</h2>
                <p style={{ color: '#8888aa', marginBottom: 24 }}>You mastered Greibach Normal Form!</p>
                <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>↩ Return to Galaxy</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
