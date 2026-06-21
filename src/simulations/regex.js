/**
 * Regular Expression Engine — Thompson's NFA + Subset Construction DFA
 * Complete implementation: regexToNFA, nfaToDFA, verifyLaw, applyLaw
 */

let _stateCounter = 0
const newState = () => `s${_stateCounter++}`

// Thompson's construction: regex string → NFA {start, accept, states, transitions}
export function regexToNFA(regex) {
  _stateCounter = 0
  try {
    const postfix = toPostfix(preprocess(regex))
    return buildNFA(postfix)
  } catch (e) {
    return null
  }
}

// Preprocess: insert explicit concatenation operator '.'
function preprocess(regex) {
  let result = ''
  const unary = ['*', '+', '?']
  const binary = ['|', '.']
  for (let i = 0; i < regex.length; i++) {
    const c = regex[i]
    result += c
    if (i + 1 < regex.length) {
      const n = regex[i + 1]
      const leftOk = !binary.includes(c) && c !== '('
      const rightOk = n !== ')' && !binary.includes(n) && !unary.includes(n)
      if (leftOk && rightOk) result += '.'
    }
  }
  return result
}

// Shunting-yard: infix → postfix
function toPostfix(regex) {
  const precedence = { '|': 1, '.': 2, '*': 3, '+': 3, '?': 3 }
  const output = []
  const stack = []
  for (const c of regex) {
    if (c === '(') {
      stack.push(c)
    } else if (c === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop())
      stack.pop()
    } else if (precedence[c] !== undefined) {
      while (
        stack.length &&
        stack[stack.length - 1] !== '(' &&
        precedence[stack[stack.length - 1]] >= precedence[c]
      ) output.push(stack.pop())
      stack.push(c)
    } else {
      output.push(c)
    }
  }
  while (stack.length) output.push(stack.pop())
  return output.join('')
}

// Build NFA from postfix using Thompson's construction
function buildNFA(postfix) {
  const stack = []

  const pushSingle = (char) => {
    const s = newState(), a = newState()
    const trans = {}
    addTrans(trans, s, char, [a])
    stack.push({ start: s, accept: a, states: [s, a], transitions: trans })
  }

  const union = () => {
    const b = stack.pop(), a = stack.pop()
    const s = newState(), f = newState()
    const trans = mergeTransitions(a.transitions, b.transitions)
    addTrans(trans, s, 'ε', [a.start, b.start])
    addTrans(trans, a.accept, 'ε', [f])
    addTrans(trans, b.accept, 'ε', [f])
    stack.push({ start: s, accept: f, states: [s, f, ...a.states, ...b.states], transitions: trans })
  }

  const concat = () => {
    const b = stack.pop(), a = stack.pop()
    const trans = mergeTransitions(a.transitions, b.transitions)
    addTrans(trans, a.accept, 'ε', [b.start])
    stack.push({ start: a.start, accept: b.accept, states: [...a.states, ...b.states], transitions: trans })
  }

  const kleene = () => {
    const a = stack.pop()
    const s = newState(), f = newState()
    const trans = { ...a.transitions }
    addTrans(trans, s, 'ε', [a.start, f])
    addTrans(trans, a.accept, 'ε', [a.start, f])
    stack.push({ start: s, accept: f, states: [s, f, ...a.states], transitions: trans })
  }

  const plus = () => {
    const a = stack.pop()
    const s = newState(), f = newState()
    const trans = { ...a.transitions }
    addTrans(trans, s, 'ε', [a.start])
    addTrans(trans, a.accept, 'ε', [a.start, f])
    stack.push({ start: s, accept: f, states: [s, f, ...a.states], transitions: trans })
  }

  const question = () => {
    const a = stack.pop()
    const s = newState(), f = newState()
    const trans = { ...a.transitions }
    addTrans(trans, s, 'ε', [a.start, f])
    addTrans(trans, a.accept, 'ε', [f])
    stack.push({ start: s, accept: f, states: [s, f, ...a.states], transitions: trans })
  }

  for (const c of postfix) {
    if (c === '|') union()
    else if (c === '.') concat()
    else if (c === '*') kleene()
    else if (c === '+') plus()
    else if (c === '?') question()
    else if (c === 'ε') { const s = newState(), a = newState(); const t = {}; addTrans(t, s, 'ε', [a]); stack.push({ start: s, accept: a, states: [s, a], transitions: t }) }
    else pushSingle(c)
  }

  return stack[0] || null
}

function addTrans(trans, from, sym, toArr) {
  const key = `${from},${sym}`
  if (!trans[key]) trans[key] = []
  trans[key] = [...new Set([...trans[key], ...toArr])]
}

function mergeTransitions(...transList) {
  const result = {}
  for (const t of transList) {
    for (const [k, v] of Object.entries(t)) {
      if (!result[k]) result[k] = []
      result[k] = [...new Set([...result[k], ...v])]
    }
  }
  return result
}

// Epsilon closure
function epsilonClosure(states, transitions) {
  const closure = new Set(states)
  const stack = [...states]
  while (stack.length) {
    const s = stack.pop()
    const eps = transitions[`${s},ε`] || []
    for (const next of eps) {
      if (!closure.has(next)) { closure.add(next); stack.push(next) }
    }
  }
  return [...closure].sort()
}

// Move: states reachable on symbol
function move(states, symbol, transitions) {
  const result = new Set()
  for (const s of states) {
    const nexts = transitions[`${s},${symbol}`] || []
    nexts.forEach(n => result.add(n))
  }
  return [...result]
}

// Subset construction: NFA → DFA
export function nfaToDFA(nfa) {
  if (!nfa) return null
  const { start, accept, transitions } = nfa

  // Get all symbols (excluding ε)
  const symbols = new Set()
  for (const key of Object.keys(transitions)) {
    const sym = key.split(',')[1]
    if (sym && sym !== 'ε') symbols.add(sym)
  }
  const alphabet = [...symbols]

  const startClosure = epsilonClosure([start], transitions)
  const startKey = startClosure.join(',')
  const dfaStates = { [startKey]: startClosure }
  const dfaTransitions = {}
  const dfaAccept = []
  const queue = [startClosure]
  const visited = new Set([startKey])

  while (queue.length) {
    const current = queue.shift()
    const currentKey = current.join(',')

    if (current.includes(accept)) dfaAccept.push(currentKey)

    for (const sym of alphabet) {
      const moved = move(current, sym, transitions)
      const closure = epsilonClosure(moved, transitions)
      if (closure.length === 0) continue
      const closureKey = closure.join(',')
      dfaTransitions[`${currentKey},${sym}`] = closureKey
      if (!visited.has(closureKey)) {
        visited.add(closureKey)
        dfaStates[closureKey] = closure
        queue.push(closure)
      }
    }
  }

  return {
    states: Object.keys(dfaStates),
    transitions: dfaTransitions,
    startState: startKey,
    acceptStates: dfaAccept,
    alphabet
  }
}

// Test if regex matches string
export function matchRegex(regex, testString) {
  try {
    const nfa = regexToNFA(regex)
    if (!nfa) return false
    const dfa = nfaToDFA(nfa)
    if (!dfa) return false
    let state = dfa.startState
    for (const ch of testString) {
      const next = dfa.transitions[`${state},${ch}`]
      if (!next) return false
      state = next
    }
    return dfa.acceptStates.includes(state)
  } catch { return false }
}

// Check if two regexes are equivalent
export function verifyLaw(regex1, regex2) {
  try {
    const nfa1 = regexToNFA(regex1), nfa2 = regexToNFA(regex2)
    if (!nfa1 || !nfa2) return { equivalent: false, error: 'Invalid regex' }
    const dfa1 = nfaToDFA(nfa1), dfa2 = nfaToDFA(nfa2)
    if (!dfa1 || !dfa2) return { equivalent: false, error: 'Conversion failed' }

    // Check with sample strings
    const testStrings = generateTestStrings(dfa1.alphabet || ['a', 'b'], 5)
    for (const s of testStrings) {
      const r1 = matchRegex(regex1, s)
      const r2 = matchRegex(regex2, s)
      if (r1 !== r2) return { equivalent: false, counterexample: s }
    }
    return { equivalent: true }
  } catch (e) {
    return { equivalent: false, error: e.message }
  }
}

function generateTestStrings(alphabet, maxLen) {
  const strings = ['']
  const result = ['']
  for (let len = 1; len <= maxLen; len++) {
    const prev = strings.filter(s => s.length === len - 1)
    for (const s of prev) {
      for (const c of alphabet) {
        const next = s + c
        strings.push(next)
        result.push(next)
      }
    }
  }
  return result
}

// Apply algebraic law simplification (pattern-based)
export function applyLaw(regex, law) {
  let result = regex
  switch (law) {
    case 'identity':
      result = result.replace(/ε\./g, '').replace(/\.ε/g, '')
      break
    case 'annihilation':
      if (result.includes('∅')) result = '∅'
      break
    case 'idempotency':
      result = result.replace(/(\w+)\+\1/g, '$1')
      break
    case 'kleene':
      result = result.replace(/\(([^)]+)\*\)\*/g, '($1)*')
      result = result.replace(/∅\*/g, 'ε')
      break
    default:
      break
  }
  return result || regex
}

export const ALGEBRAIC_LAWS = [
  { id: 'identity', name: 'Identity', equation: 'ε·R = R·ε = R', description: 'Concatenation with empty string is identity' },
  { id: 'annihilation', name: 'Annihilation', equation: '∅·R = R·∅ = ∅', description: 'Concatenation with empty set annihilates' },
  { id: 'idempotency', name: 'Idempotency', equation: 'R+R = R', description: 'Union of a set with itself is itself' },
  { id: 'commutativity', name: 'Commutativity', equation: 'R+S = S+R', description: 'Union is commutative' },
  { id: 'distributivity', name: 'Distributivity', equation: 'R·(S+T) = R·S + R·T', description: 'Concatenation distributes over union' },
  { id: 'kleene', name: 'Kleene Star', equation: '(R*)* = R*', description: 'Kleene star is idempotent' },
]
