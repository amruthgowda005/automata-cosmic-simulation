import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { parseCFG, cykParse, getAllParseTrees, disambiguate, EXAMPLE_GRAMMARS } from '../../simulations/cfg'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ffd60a'

function ParseTreeViz({ tree, color = COLOR, depth = 0 }) {
  if (!tree) return null
  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: depth * 0.1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%',
          background: tree.terminal ? 'rgba(255,255,255,0.08)' : `${color}25`,
          border: `2px solid ${tree.terminal ? 'rgba(255,255,255,0.3)' : color}`,
          fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700,
          color: tree.terminal ? '#aaa' : color,
          boxShadow: tree.terminal ? 'none' : `0 0 12px ${color}50`,
        }}
      >
        {tree.label}
      </motion.div>
      {tree.children && tree.children.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 12, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: `${tree.children.length * 56}px`, height: 2,
            background: `${color}40`,
          }} />
          {tree.children.map((child, i) => (
            <ParseTreeViz key={i} tree={child} color={color} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function CFGSimulator() {
  const [grammarText, setGrammarText] = useState(EXAMPLE_GRAMMARS.balanced.text)
  const [inputStr, setInputStr] = useState('()()')
  const [result, setResult] = useState(null)
  const [disambResult, setDisambResult] = useState(null)
  const [error, setError] = useState('')

  const runParser = () => {
    setError('')
    setDisambResult(null)
    try {
      if (!grammarText.trim()) { setError('Enter a grammar'); return }
      const grammar = parseCFG(grammarText)
      if (!grammar.startSymbol) { setError('Invalid grammar format. Use: S -> a S b | ε'); return }
      const r = getAllParseTrees(grammar, inputStr)
      setResult(r)
    } catch (e) { setError(e.message) }
  }

  const handleDisambiguate = () => {
    try {
      const grammar = parseCFG(grammarText)
      const r = disambiguate(grammar)
      setDisambResult(r)
    } catch (e) { setError(e.message) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <GlassPanel color={COLOR} style={{ marginBottom: 16 }}>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>GRAMMAR INPUT</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {Object.entries(EXAMPLE_GRAMMARS).map(([k, v]) => (
              <button key={k} onClick={() => setGrammarText(v.text)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLOR}60`,
                  background: 'transparent', color: COLOR, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                {v.description.split(' ')[0]}
              </button>
            ))}
          </div>
          <textarea
            value={grammarText}
            onChange={e => setGrammarText(e.target.value)}
            rows={4}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLOR}40`,
              borderRadius: 8, color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 13,
              padding: '10px 14px', outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
            placeholder="S -> S S | ( S ) | ε"
          />
          <input className="input-neon" value={inputStr} onChange={e => setInputStr(e.target.value)}
            placeholder="Test string (e.g. ()())" style={{ margin: '10px 0', borderColor: `${COLOR}60` }} />
          {error && <div style={{ color: '#ff2d55', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-neon" onClick={runParser} style={{ flex: 1, fontSize: 12, padding: '10px' }}>
              ▶ PARSE
            </button>
            <button className="btn-neon" onClick={handleDisambiguate} style={{ flex: 1, fontSize: 12, padding: '10px' }}>
              DISAMBIGUATE
            </button>
          </div>
        </GlassPanel>

        {result && (
          <GlassPanel color={COLOR}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: result.accepted ? '#00ff80' : '#ff2d55', fontWeight: 700 }}>
                {result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
              </span>
              {result.accepted && (
                <span style={{ color: result.ambiguous ? '#ff6b00' : '#00ff80', marginLeft: 12 }}>
                  {result.ambiguous ? `⚠ AMBIGUOUS (${result.parseCount} parse trees)` : '✓ UNAMBIGUOUS'}
                </span>
              )}
            </div>
            {disambResult && (
              <div style={{ fontSize: 12, color: '#8888aa', fontFamily: 'JetBrains Mono', marginTop: 8 }}>
                <div style={{ color: COLOR, marginBottom: 4 }}>Disambiguated:</div>
                {Object.entries(disambResult.rules).map(([v, prods]) => (
                  <div key={v}>{v} → {prods.map(p => p.join(' ') || 'ε').join(' | ')}</div>
                ))}
                {disambResult.explanation && <div style={{ color: '#ffd60a', marginTop: 8 }}>{disambResult.explanation}</div>}
              </div>
            )}
          </GlassPanel>
        )}
      </div>

      {/* Parse trees */}
      <div>
        <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          {result?.trees?.length > 1 ? `${result.trees.length} PARSE TREES (AMBIGUOUS!)` : 'PARSE TREE'}
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {result?.trees?.map((tree, i) => (
            <GlassPanel key={i} color={i === 0 ? COLOR : '#ff6b00'} style={{ flex: '1 1 200px', overflow: 'auto', minHeight: 120 }}>
              <div style={{ fontSize: 11, color: i === 0 ? COLOR : '#ff6b00', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>
                Parse Tree {i + 1}
              </div>
              <ParseTreeViz tree={tree} color={i === 0 ? COLOR : '#ff6b00'} />
            </GlassPanel>
          ))}
          {!result && (
            <GlassPanel color={COLOR} style={{ width: '100%', textAlign: 'center', color: '#8888aa', fontSize: 14, padding: 40 }}>
              Enter a grammar and string, then press PARSE
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  )
}

function Challenge({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [timer, setTimer] = useState(0)
  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    if (answer.trim().toLowerCase().includes('ambiguous') || answer.trim().toLowerCase().includes('yes')) {
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
        Is the grammar <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>S → SS | (S) | ε</code> ambiguous
        for the string <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 6px', borderRadius: 4 }}>'()()'</code>?
        <br />Type: <em>yes (ambiguous)</em> or <em>no (unambiguous)</em>
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
          🎉 YES — It has multiple parse trees!
        </motion.div>
      )}
      <p style={{ marginTop: 12, fontSize: 12, color: '#8888aa' }}>
        💡 Hint: Try parsing ()() using the simulation above and count the trees
      </p>
    </GlassPanel>
  )
}

export default function World3() {
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
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 4, color: COLOR, marginBottom: 16 }}>WORLD 03</div>
        <motion.h1 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 30px ${COLOR}60`, marginBottom: 20 }}>
          CFG Ambiguity
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontSize: 18, color: '#8888aa', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
          When a grammar has two minds — the compiler chooses wrong. Learn to speak unambiguously.
        </motion.p>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ position: 'absolute', bottom: 32, color: '#8888aa', fontSize: 22 }}>↓</motion.div>
      </motion.div>

      <div style={{ padding: '60px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: COLOR }}>What is Ambiguity?</h2>
        {[
          { title: 'The Problem', text: 'A grammar is ambiguous if some string has more than one leftmost derivation — meaning the parse tree is not unique.' },
          { title: 'Classic Example', text: 'E → E+E | E*E | id. For "id+id*id", there are two trees: one prioritizing + and one prioritizing ×.' },
          { title: 'The Fix', text: 'Introduce precedence levels: E→E+T|T, T→T*F|F, F→id. Now only ONE parse tree exists per string.' },
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
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>CFG Parser Lab</h2>
          <CFGSimulator />
        </div>
      </div>

      <div style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: COLOR }}>Challenge Mode</h2>
          <Challenge onComplete={() => { completeWorld(3); setWorldDone(true) }} />
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
              {['A grammar is ambiguous if one string has multiple leftmost derivations',
                'CYK algorithm can detect ambiguity by finding multiple parse trees',
                'Operator precedence rules are used to create unambiguous grammars'].map((p, i) => (
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
