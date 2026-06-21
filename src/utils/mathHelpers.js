/**
 * Math utility helpers + KaTeX rendering
 */
import katex from 'katex'

// Render LaTeX string to HTML string
export function renderMath(latex, displayMode = false) {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      trust: false,
      strict: false,
    })
  } catch {
    return latex
  }
}

// Inline math component helper
export function mathHTML(latex) {
  return { __html: renderMath(latex, false) }
}

export function mathBlockHTML(latex) {
  return { __html: renderMath(latex, true) }
}

// World color map
export const WORLD_COLORS = {
  1: '#a3a3a3',
  2: '#ffd60a',
  3: '#0a84ff',
  4: '#ff3b30',
  5: '#ff9500',
}

export const WORLD_NAMES = {
  1: 'Decision Properties',
  2: 'Algebraic Laws',
  3: 'CFG Ambiguity',
  4: 'DPDA',
  5: 'Greibach Normal Form',
}

export const WORLD_FULL_NAMES = {
  1: 'Decision Properties of Regular Languages',
  2: 'Algebraic Laws for Regular Expressions',
  3: 'Elimination of Ambiguity in CFG',
  4: 'Deterministic Pushdown Automata',
  5: 'Greibach Normal Form',
}

// Timer formatting
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Clamp value between min and max
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// Random float
export function randFloat(min, max) {
  return min + Math.random() * (max - min)
}

// Random int
export function randInt(min, max) {
  return Math.floor(randFloat(min, max + 1))
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t
}

// Validate DFA input
export function validateDFAInput(states, transitions, startState, acceptStates) {
  const errors = []
  if (!states || states.length === 0) errors.push('No states defined')
  if (!startState) errors.push('No start state defined')
  if (!acceptStates || acceptStates.length === 0) errors.push('No accept states defined')
  if (startState && !states.includes(startState)) errors.push('Start state not in states list')
  for (const a of (acceptStates || [])) {
    if (!states.includes(a)) errors.push(`Accept state ${a} not in states list`)
  }
  return errors
}

// Validate string input (only allowed chars)
export function validateStringInput(str, alphabet) {
  if (typeof str !== 'string') return { valid: false, error: 'Input must be a string' }
  if (alphabet && alphabet.length > 0) {
    for (const ch of str) {
      if (!alphabet.includes(ch)) return { valid: false, error: `Symbol '${ch}' not in alphabet {${alphabet.join(', ')}}` }
    }
  }
  return { valid: true }
}
