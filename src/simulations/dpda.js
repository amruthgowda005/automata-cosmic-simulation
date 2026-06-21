/**
 * DPDA Simulation Engine — Complete Implementation
 * Deterministic Pushdown Automata with step-by-step execution
 */

// Create a DPDA configuration object
export function createDPDA(states, inputAlphabet, stackAlphabet, transitions, startState, startStack, acceptStates) {
  return { states, inputAlphabet, stackAlphabet, transitions, startState, startStack, acceptStates }
}

// Execute one DPDA step
// config: { state, inputPos, stack, input }
// returns: { nextConfig, action, description } | null (if no transition)
export function stepDPDA(config, dpda) {
  const { state, inputPos, stack, input } = config
  const { transitions, acceptStates } = dpda

  if (stack.length === 0) {
    const accepted = acceptStates.includes(state)
    return { done: true, accepted, reason: accepted ? 'Final state reached' : 'Stack empty, not in accept state' }
  }

  const topStack = stack[stack.length - 1]

  // Try reading a symbol
  if (inputPos < input.length) {
    const sym = input[inputPos]
    const key = `${state},${sym},${topStack}`
    if (transitions[key]) {
      const [nextState, pushSymbols] = transitions[key]
      const newStack = [...stack.slice(0, -1), ...(pushSymbols === 'ε' ? [] : pushSymbols.split('').reverse())]
      return {
        nextConfig: { state: nextState, inputPos: inputPos + 1, stack: newStack, input },
        action: pushSymbols === 'ε' ? 'pop' : pushSymbols.length > topStack.length ? 'push' : 'replace',
        transition: { from: state, symbol: sym, stackTop: topStack, to: nextState, push: pushSymbols },
        description: `δ(${state}, ${sym}, ${topStack}) = (${nextState}, ${pushSymbols})`
      }
    }
  }

  // Try epsilon transition
  const epsKey = `${state},ε,${topStack}`
  if (transitions[epsKey]) {
    const [nextState, pushSymbols] = transitions[epsKey]
    const newStack = [...stack.slice(0, -1), ...(pushSymbols === 'ε' ? [] : pushSymbols.split('').reverse())]
    return {
      nextConfig: { state: nextState, inputPos, stack: newStack, input },
      action: 'epsilon',
      transition: { from: state, symbol: 'ε', stackTop: topStack, to: nextState, push: pushSymbols },
      description: `δ(${state}, ε, ${topStack}) = (${nextState}, ${pushSymbols})`
    }
  }

  // No transition found
  if (inputPos >= input.length) {
    const accepted = acceptStates.includes(state)
    return { done: true, accepted, reason: accepted ? 'Input exhausted, in final state' : 'Input exhausted, not in final state' }
  }

  return { done: true, accepted: false, reason: `No transition from state ${state} on symbol ${input[inputPos]} with stack top ${topStack}` }
}

// Run DPDA to completion, return full trace
export function runDPDA(dpda, inputString) {
  const { startState, startStack } = dpda
  const input = typeof inputString === 'string' ? inputString : String(inputString)

  let config = {
    state: startState,
    inputPos: 0,
    stack: [startStack],
    input
  }

  const trace = [{ ...config, step: 0, description: 'Initial configuration' }]
  const MAX_STEPS = 500

  for (let step = 1; step <= MAX_STEPS; step++) {
    const result = stepDPDA(config, dpda)
    if (!result) break
    if (result.done) {
      return { accepted: result.accepted, trace, reason: result.reason, steps: step }
    }
    config = result.nextConfig
    trace.push({ ...config, step, description: result.description, action: result.action, transition: result.transition })
    if (result.nextConfig.stack.length === 0 && result.nextConfig.inputPos >= input.length) {
      const accepted = dpda.acceptStates.includes(config.state)
      return { accepted, trace, reason: 'Stack empty + input consumed', steps: step }
    }
  }

  return { accepted: false, trace, reason: 'Max steps exceeded (possible infinite loop)', steps: MAX_STEPS }
}

// Built-in example DPDAs
export const exampleDPDAs = {
  anbn: {
    name: 'aⁿbⁿ Language',
    description: 'Accepts strings of form aⁿbⁿ where n ≥ 1',
    dpda: createDPDA(
      ['q0', 'q1', 'q2', 'q3'],
      ['a', 'b'],
      ['Z', 'A'],
      {
        'q0,a,Z': ['q1', 'AZ'],
        'q1,a,A': ['q1', 'AA'],
        'q1,b,A': ['q2', 'ε'],
        'q2,b,A': ['q2', 'ε'],
        'q2,ε,Z': ['q3', 'Z'],
      },
      'q0', 'Z', ['q3']
    ),
    testCases: ['ab', 'aabb', 'aaabbb', 'aab', 'abb', 'abc']
  },

  balanced: {
    name: 'Balanced Parentheses',
    description: 'Accepts strings of balanced parentheses',
    dpda: createDPDA(
      ['q0', 'q1'],
      ['(', ')'],
      ['Z', 'P'],
      {
        'q0,(,Z': ['q0', 'PZ'],
        'q0,(,P': ['q0', 'PP'],
        'q0,),P': ['q0', 'ε'],
        'q0,ε,Z': ['q1', 'Z'],
      },
      'q0', 'Z', ['q1']
    ),
    testCases: ['()', '(())', '((()))', '()()', '(())()', '(()', ')()']
  },

  palindrome: {
    name: 'wcwᴿ Palindrome',
    description: 'Accepts palindromes with center marker c',
    dpda: createDPDA(
      ['q0', 'q1', 'q2'],
      ['a', 'b', 'c'],
      ['Z', 'A', 'B'],
      {
        'q0,a,Z': ['q0', 'AZ'],
        'q0,a,A': ['q0', 'AA'],
        'q0,a,B': ['q0', 'AB'],
        'q0,b,Z': ['q0', 'BZ'],
        'q0,b,A': ['q0', 'BA'],
        'q0,b,B': ['q0', 'BB'],
        'q0,c,Z': ['q1', 'Z'],
        'q0,c,A': ['q1', 'A'],
        'q0,c,B': ['q1', 'B'],
        'q1,a,A': ['q1', 'ε'],
        'q1,b,B': ['q1', 'ε'],
        'q1,ε,Z': ['q2', 'Z'],
      },
      'q0', 'Z', ['q2']
    ),
    testCases: ['acа', 'abcba', 'aacaa', 'abcba', 'abca']
  }
}
