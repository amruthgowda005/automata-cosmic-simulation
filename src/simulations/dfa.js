/**
 * DFA Simulation Engine — Complete Implementation
 * Covers: membership, emptiness, finiteness, equivalence
 */

// Run DFA on input string — returns {accepted, path, steps}
export function runDFA(states, transitions, startState, acceptStates, inputString) {
  if (!states || states.length === 0) return { accepted: false, path: [], steps: [] }
  if (!transitions || typeof transitions !== 'object') return { accepted: false, path: [], steps: [] }

  const input = typeof inputString === 'string' ? inputString : String(inputString)
  let currentState = startState
  const path = [currentState]
  const steps = []

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i]
    const key = `${currentState},${symbol}`
    const nextState = transitions[key]

    if (nextState === undefined || nextState === null) {
      steps.push({ from: currentState, symbol, to: 'DEAD', input: input.slice(i + 1) })
      return { accepted: false, path, steps, rejectedAt: i, reason: `No transition from ${currentState} on '${symbol}'` }
    }

    steps.push({ from: currentState, symbol, to: nextState, input: input.slice(i + 1) })
    currentState = nextState
    path.push(currentState)
  }

  const accepted = acceptStates.includes(currentState)
  return { accepted, path, steps, finalState: currentState }
}

// BFS reachability — returns {isEmpty, reachableStates}
export function checkEmptiness(states, transitions, startState, acceptStates) {
  if (!states || states.length === 0) return { isEmpty: true, reachableStates: [] }

  const visited = new Set()
  const queue = [startState]
  visited.add(startState)

  while (queue.length > 0) {
    const state = queue.shift()
    // Get all outgoing transitions
    for (const key of Object.keys(transitions)) {
      const [from] = key.split(',')
      if (from === state) {
        const next = transitions[key]
        if (!visited.has(next)) {
          visited.add(next)
          queue.push(next)
        }
      }
    }
  }

  const reachableAccept = acceptStates.filter(s => visited.has(s))
  return {
    isEmpty: reachableAccept.length === 0,
    reachableStates: [...visited],
    reachableAcceptStates: reachableAccept
  }
}

// Finiteness check via cycle detection on paths to accept states
export function checkFiniteness(states, transitions, startState, acceptStates) {
  if (!states || states.length === 0) return { isFinite: true, cycles: [] }

  // Find all states reachable from start
  const reachable = getReachableStates(states, transitions, startState)
  // Find all states that can reach an accept state
  const coReachable = getCoReachableStates(states, transitions, acceptStates)
  // Useful states = intersection
  const useful = reachable.filter(s => coReachable.has(s))

  // Check for cycles in the subgraph of useful states using DFS
  const cycles = []
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = {}
  states.forEach(s => { color[s] = WHITE })

  const dfs = (state, stack) => {
    color[state] = GRAY
    stack.push(state)

    for (const key of Object.keys(transitions)) {
      const [from, sym] = key.split(',')
      if (from !== state) continue
      const next = transitions[key]
      if (!useful.includes(next)) continue

      if (color[next] === GRAY) {
        const cycleStart = stack.indexOf(next)
        cycles.push([...stack.slice(cycleStart), next])
      } else if (color[next] === WHITE) {
        dfs(next, stack)
      }
    }

    color[state] = BLACK
    stack.pop()
  }

  for (const s of useful) {
    if (color[s] === WHITE) dfs(s, [])
  }

  return {
    isFinite: cycles.length === 0,
    cycles,
    usefulStates: useful
  }
}

function getReachableStates(states, transitions, startState) {
  const visited = new Set()
  const queue = [startState]
  visited.add(startState)
  while (queue.length > 0) {
    const s = queue.shift()
    for (const key of Object.keys(transitions)) {
      const [from] = key.split(',')
      if (from === s) {
        const next = transitions[key]
        if (!visited.has(next)) { visited.add(next); queue.push(next) }
      }
    }
  }
  return [...visited]
}

function getCoReachableStates(states, transitions, acceptStates) {
  // Reverse the transitions and BFS from accept states
  const reverseAdj = {}
  states.forEach(s => { reverseAdj[s] = [] })
  for (const key of Object.keys(transitions)) {
    const [from] = key.split(',')
    const to = transitions[key]
    if (reverseAdj[to]) reverseAdj[to].push(from)
    else reverseAdj[to] = [from]
  }
  const visited = new Set()
  const queue = [...acceptStates]
  acceptStates.forEach(s => visited.add(s))
  while (queue.length > 0) {
    const s = queue.shift()
    for (const pred of (reverseAdj[s] || [])) {
      if (!visited.has(pred)) { visited.add(pred); queue.push(pred) }
    }
  }
  return visited
}

// Product construction for equivalence check
export function checkEquivalence(dfa1, dfa2) {
  const { states: s1, transitions: t1, startState: start1, acceptStates: a1, alphabet: alph1 } = dfa1
  const { states: s2, transitions: t2, startState: start2, acceptStates: a2, alphabet: alph2 } = dfa2
  const alphabet = [...new Set([...(alph1 || []), ...(alph2 || [])])]

  // BFS over product states
  const startPair = `${start1}|${start2}`
  const visited = new Set()
  const queue = [startPair]
  visited.add(startPair)
  let counterexample = null

  const pathMap = { [startPair]: '' }

  while (queue.length > 0) {
    const pair = queue.shift()
    const [p, q] = pair.split('|')
    const inA1 = a1.includes(p)
    const inA2 = a2.includes(q)

    if (inA1 !== inA2) {
      counterexample = pathMap[pair]
      break
    }

    for (const sym of alphabet) {
      const np = t1[`${p},${sym}`] || 'DEAD'
      const nq = t2[`${q},${sym}`] || 'DEAD'
      const nextPair = `${np}|${nq}`
      if (!visited.has(nextPair)) {
        visited.add(nextPair)
        pathMap[nextPair] = pathMap[pair] + sym
        queue.push(nextPair)
      }
    }
  }

  return {
    equivalent: counterexample === null,
    counterexample,
    statesExplored: visited.size
  }
}

// Build a minimal DFA for binary strings ending in '0'
export function getDefaultDFA() {
  return {
    states: ['q0', 'q1', 'q2'],
    alphabet: ['0', '1'],
    transitions: {
      'q0,0': 'q1', 'q0,1': 'q2',
      'q1,0': 'q1', 'q1,1': 'q2',
      'q2,0': 'q1', 'q2,1': 'q2',
    },
    startState: 'q0',
    acceptStates: ['q1'],
    description: 'Accepts binary strings ending in 0'
  }
}

// Compute all symbols used in transitions
export function getAlphabet(transitions) {
  const syms = new Set()
  for (const key of Object.keys(transitions)) {
    const parts = key.split(',')
    if (parts.length >= 2) syms.add(parts.slice(1).join(','))
  }
  return [...syms]
}
