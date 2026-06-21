import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassPanel from '../../components/shared/GlassPanel'
import { FloatingSymbolsCSS } from '../../components/shared/Particles'
import { parseCFG, getAllParseTrees, disambiguate, EXAMPLE_GRAMMARS } from '../../simulations/cfg'
import useAppStore from '../../store/useAppStore'

const COLOR = '#ffd60a'

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
          color: active === t.id ? '#000' : '#8888aa',
          boxShadow: active === t.id ? `0 0 16px ${COLOR}60` : 'none',
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  )
}

function ParseTreeViz({ tree, color = COLOR, depth = 0 }) {
  if (!tree) return null
  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: depth * 0.1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%',
          background: tree.terminal ? 'rgba(255,255,255,0.08)' : `${color}25`,
          border: `2px solid ${tree.terminal ? 'rgba(255,255,255,0.3)' : color}`,
          fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700,
          color: tree.terminal ? '#aaa' : color,
          boxShadow: tree.terminal ? 'none' : `0 0 12px ${color}50`,
        }}>
        {tree.label}
      </motion.div>
      {tree.children && tree.children.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 12, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: `${tree.children.length * 56}px`, height: 2, background: `${color}40` }} />
          {tree.children.map((child, i) => <ParseTreeViz key={i} tree={child} color={color} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

function TheoryTab() {
  const items = [
    { icon: '❓', title: 'What is Ambiguity?', text: 'A grammar is ambiguous if some string has more than one leftmost derivation — its parse tree is not unique.' },
    { icon: '⚠️', title: 'Classic Example', text: 'E → E+E | E*E | id. For "id+id*id", there are TWO parse trees: one prioritising + and one prioritising ×.' },
    { icon: '🔧', title: 'The Fix', text: 'Introduce precedence: E→E+T|T, T→T*F|F, F→id. Now exactly ONE parse tree exists per string — unambiguous!' },
    { icon: '🔍', title: 'CYK Detection', text: 'CYK algorithm counts parse trees via dynamic programming. If count > 1 for any string, the grammar is ambiguous.' },
  ]
  return (
    <motion.div key="theory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 14 }}>
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassPanel color={COLOR} style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${COLOR}20`, border: `1px solid ${COLOR}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{item.icon}</div>
                <h3 style={{ color: COLOR, fontSize: 15, fontWeight: 700, margin: 0 }}>{item.title}</h3>
              </div>
              <p style={{ color: '#8888aa', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function SimulationTab() {
  const [grammarText, setGrammarText] = useState(EXAMPLE_GRAMMARS.balanced.text)
  const [inputStr, setInputStr] = useState('()()')
  const [result, setResult] = useState(null)
  const [disambResult, setDisambResult] = useState(null)
  const [error, setError] = useState('')

  const runParser = () => {
    setError(''); setDisambResult(null)
    try {
      if (!grammarText.trim()) { setError('Enter a grammar'); return }
      const grammar = parseCFG(grammarText)
      if (!grammar.startSymbol) { setError('Invalid grammar. Use: S -> a S b | ε'); return }
      setResult(getAllParseTrees(grammar, inputStr))
    } catch (e) { setError(e.message) }
  }

  const handleDisambiguate = () => {
    try { setDisambResult(disambiguate(parseCFG(grammarText))) }
    catch (e) { setError(e.message) }
  }

  return (
    <motion.div key="sim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <GlassPanel color={COLOR} style={{ marginBottom: 16 }}>
            <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 GRAMMAR INPUT</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {Object.entries(EXAMPLE_GRAMMARS).map(([k, v]) => (
                <button key={k} onClick={() => setGrammarText(v.text)}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${COLOR}60`,
                    background: 'transparent', color: COLOR, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                  {v.description?.split(' ')[0] || k}
                </button>
              ))}
            </div>
            <textarea value={grammarText} onChange={e => setGrammarText(e.target.value)} rows={4}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLOR}40`,
                borderRadius: 8, color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 13,
                padding: '10px 14px', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
              placeholder="S -> S S | ( S ) | ε" />
            <input className="input-neon" value={inputStr} onChange={e => setInputStr(e.target.value)}
              placeholder="Test string (e.g. ()())" style={{ margin: '10px 0', borderColor: `${COLOR}60` }} />
            {error && <div style={{ color: '#ff2d55', fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-neon" onClick={runParser} style={{ flex: 1, fontSize: 12, padding: '10px' }}>▶ PARSE</button>
              <button className="btn-neon" onClick={handleDisambiguate} style={{ flex: 1, fontSize: 12, padding: '10px' }}>DISAMBIGUATE</button>
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
        <div>
          <h3 style={{ color: COLOR, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            {result?.trees?.length > 1 ? `${result.trees.length} PARSE TREES (AMBIGUOUS!)` : 'PARSE TREE'}
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {result?.trees?.map((tree, i) => (
              <GlassPanel key={i} color={i === 0 ? COLOR : '#ff6b00'} style={{ flex: '1 1 200px', overflow: 'auto', minHeight: 120 }}>
                <div style={{ fontSize: 11, color: i === 0 ? COLOR : '#ff6b00', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Parse Tree {i + 1}</div>
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
    </motion.div>
  )
}

function ChallengeTab({ onComplete }) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState(null)
  const [hints, setHints] = useState(0)
  const [timer, setTimer] = useState(0)
  const HINTS = ['Try parsing ()() with the simulator', 'The grammar S→SS|(S)|ε can derive ()() in two ways', 'Answer: yes (ambiguous)']
  useEffect(() => { const id = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(id) }, [])

  const check = () => {
    if (answer.trim().toLowerCase().includes('ambiguous') || answer.trim().toLowerCase() === 'yes') {
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
              Is the grammar <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono' }}>S → SS | (S) | ε</code> ambiguous
              for the string <code style={{ color: COLOR, background: `${COLOR}15`, padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono' }}>'()()'</code>?
              <br /><br />Type: <strong style={{ color: '#fff' }}>yes</strong> (ambiguous) or <strong style={{ color: '#fff' }}>no</strong> (unambiguous)
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input className={`input-neon${status === 'wrong' ? ' shake' : ''}`}
              value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()} placeholder="yes / no"
              disabled={status === 'correct'} />
            <button className="btn-neon" onClick={check} disabled={status === 'correct'}
              style={{ fontSize: 12, padding: '10px 22px', whiteSpace: 'nowrap' }}>CHECK</button>
          </div>
          {status === 'correct' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              style={{ textAlign: 'center', padding: 20, background: 'rgba(0,255,128,0.1)', border: '1px solid #00ff80', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff80' }}>YES! World 3 Conquered!</div>
              <div style={{ fontSize: 13, color: '#8888aa', marginTop: 6 }}>()() has multiple parse trees — it's ambiguous!</div>
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

export default function World3() {
  const { completeWorld, startWarp } = useAppStore()
  const [tab, setTab] = useState('intro')
  const [worldDone, setWorldDone] = useState(false)

  const TABS = [
    { id: 'theory', label: 'Explore Theory', icon: '📖' },
    { id: 'sim', label: 'CFG Parser Lab', icon: '⚙️' },
    { id: 'challenge', label: 'Challenge Mode', icon: '⚡' },
  ]

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: 'Space Grotesk' }}>
      <FloatingSymbolsCSS color={COLOR} count={8} />
      <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${COLOR}18 0%, transparent 70%)`,
        textAlign: 'center', padding: '60px 40px 0' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 5, color: COLOR, marginBottom: 14 }}>WORLD 03</motion.div>
        <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 700, letterSpacing: '-2px', textShadow: `0 0 40px ${COLOR}50`, marginBottom: 16, color: '#fff' }}>
          CFG Ambiguity
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 17, color: '#8888aa', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          When a grammar has two minds, the compiler chooses wrong. Learn to speak unambiguously.
        </motion.p>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 80px' }}>
        <TabBar active={tab} onTab={setTab} tabs={TABS} />
        <AnimatePresence mode="wait">
          {tab === 'theory' && <TheoryTab key="theory" />}
          {tab === 'sim' && <SimulationTab key="sim" />}
          {tab === 'challenge' && <ChallengeTab key="challenge" onComplete={() => { completeWorld(3); setWorldDone(true) }} />}
        </AnimatePresence>
        {tab === 'intro' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginTop: 8 }}>
            {[
              { id: 'theory', icon: '📖', title: 'Explore Theory', desc: 'Understand what ambiguity means in CFGs, see classic examples, and learn how to fix it.' },
              { id: 'sim', icon: '⚙️', title: 'CFG Parser Lab', desc: 'Run CYK parsing, visualise parse trees, and detect ambiguity in real grammars.' },
              { id: 'challenge', icon: '⚡', title: 'Challenge Mode', desc: 'Decide if a classic grammar is ambiguous. Earn your world badge!' },
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
                <p style={{ color: '#8888aa', marginBottom: 24 }}>You mastered CFG Ambiguity detection!</p>
                <button className="btn-neon" onClick={() => startWarp('galaxy')} style={{ fontSize: 14 }}>↩ Warp Back to Galaxy</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
