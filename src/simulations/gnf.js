/**
 * GNF (Greibach Normal Form) Conversion Engine
 * Every production A → aα where a ∈ Σ and α ∈ V*
 */

import { parseCFG } from './cfg.js'

// Convert CFG to GNF — main pipeline
export function convertToGNF(grammarText) {
  try {
    const grammar = typeof grammarText === 'string' ? parseCFG(grammarText) : grammarText
    if (!grammar.startSymbol) return { error: 'Invalid grammar', steps: [] }

    const steps = []

    // Step 1: Show original grammar
    steps.push({ title: 'Original Grammar', grammar: cloneRules(grammar.rules), description: 'Starting grammar before any transformations' })

    // Step 2: Rename variables to ordered A1, A2, ...
    const { ordered, mapping } = orderVariables(grammar)
    steps.push({ title: 'Order Variables', grammar: cloneRules(ordered.rules), description: `Variables ordered: ${Object.keys(mapping).join(', ')} → ${Object.values(mapping).join(', ')}` })

    // Step 3: Eliminate left recursion
    const noLR = eliminateLeftRecursion(ordered)
    steps.push({ title: 'Eliminate Left Recursion', grammar: cloneRules(noLR.rules), description: 'Removed all left-recursive productions using new B variables' })

    // Step 4: Apply substitutions to ensure GNF form
    const substituted = applySubstitutions(noLR)
    steps.push({ title: 'Apply Substitutions', grammar: cloneRules(substituted.rules), description: 'Substituted non-terminals at production head positions' })

    // Step 5: Verify GNF
    const final = finalizeGNF(substituted)
    const verification = verifyGNF(final)
    steps.push({ title: 'Final GNF', grammar: cloneRules(final.rules), description: verification.valid ? '✓ All productions start with a terminal' : `⚠ Issues: ${verification.violations.join(', ')}` })

    return { steps, final, verification, originalGrammar: grammar }
  } catch (e) {
    return { error: e.message, steps: [] }
  }
}

function cloneRules(rules) {
  const clone = {}
  for (const [v, prods] of Object.entries(rules)) {
    clone[v] = prods.map(p => [...p])
  }
  return clone
}

// Order variables A1, A2, ...
export function orderVariables(grammar) {
  const vars = [grammar.startSymbol, ...Object.keys(grammar.rules).filter(v => v !== grammar.startSymbol)]
  const mapping = {}
  vars.forEach((v, i) => { mapping[v] = `A${i + 1}` })

  const newRules = {}
  for (const [v, prods] of Object.entries(grammar.rules)) {
    const newV = mapping[v]
    newRules[newV] = prods.map(prod => prod.map(sym => mapping[sym] || sym))
  }

  return {
    grammar: { ...grammar, rules: newRules, startSymbol: mapping[grammar.startSymbol] },
    ordered: { ...grammar, rules: newRules, startSymbol: mapping[grammar.startSymbol] },
    mapping
  }
}

// Eliminate left recursion
export function eliminateLeftRecursion(grammar) {
  const rules = cloneRules(grammar.rules)
  const vars = Object.keys(rules)
  let bCounter = 1

  // For each variable Ai, substitute Aj (j < i) productions, then remove direct left recursion
  for (let i = 0; i < vars.length; i++) {
    const Ai = vars[i]
    // Substitute earlier variables
    for (let j = 0; j < i; j++) {
      const Aj = vars[j]
      const newProds = []
      for (const prod of rules[Ai]) {
        if (prod.length > 0 && prod[0] === Aj) {
          // Replace Aj with its productions
          for (const ajProd of rules[Aj]) {
            newProds.push([...ajProd, ...prod.slice(1)])
          }
        } else {
          newProds.push(prod)
        }
      }
      rules[Ai] = newProds
    }

    // Now eliminate direct left recursion: Ai → Ai α | β
    const recursive = rules[Ai].filter(p => p.length > 0 && p[0] === Ai)
    const nonRecursive = rules[Ai].filter(p => p.length === 0 || p[0] !== Ai)

    if (recursive.length > 0) {
      const Bi = `B${bCounter++}`
      rules[Ai] = nonRecursive.map(beta => [...beta, Bi]).concat(nonRecursive)
      rules[Bi] = recursive.map(alpha => [...alpha.slice(1), Bi]).concat(recursive.map(alpha => alpha.slice(1)))
      // Remove duplicates
      rules[Ai] = dedup(rules[Ai])
      rules[Bi] = dedup(rules[Bi])
    }
  }

  return { ...grammar, rules }
}

function dedup(prods) {
  const seen = new Set()
  return prods.filter(p => {
    const key = p.join(' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Apply substitutions: ensure first symbol of every production is a terminal
export function applySubstitutions(grammar) {
  const rules = cloneRules(grammar.rules)
  const terminals = grammar.terminals || new Set()

  // Iterate until stable
  let changed = true
  let maxIter = 20
  while (changed && maxIter-- > 0) {
    changed = false
    for (const [v, prods] of Object.entries(rules)) {
      const newProds = []
      for (const prod of prods) {
        if (prod.length === 0) { newProds.push(prod); continue }
        const first = prod[0]
        if (terminals.has(first) || !rules[first]) {
          newProds.push(prod)
        } else {
          // Substitute first symbol
          for (const subProd of (rules[first] || [])) {
            newProds.push([...subProd, ...prod.slice(1)])
            changed = true
          }
        }
      }
      rules[v] = dedup(newProds)
    }
  }

  return { ...grammar, rules }
}

// Finalize GNF — ensure proper form
export function finalizeGNF(grammar) {
  const rules = cloneRules(grammar.rules)
  // Remove empty productions (except start if needed)
  for (const v of Object.keys(rules)) {
    rules[v] = rules[v].filter(p => p.length > 0)
  }
  return { ...grammar, rules }
}

// Verify GNF: every production must start with a terminal
export function verifyGNF(grammar) {
  const violations = []
  const { rules, terminals } = grammar

  for (const [v, prods] of Object.entries(rules)) {
    for (const prod of prods) {
      if (prod.length === 0) {
        violations.push(`${v} → ε (empty production not allowed in strict GNF)`)
      } else if (rules[prod[0]] !== undefined) {
        violations.push(`${v} → ${prod.join(' ')} (starts with non-terminal ${prod[0]})`)
      }
    }
  }

  return { valid: violations.length === 0, violations }
}

export const GNF_EXAMPLE_GRAMMARS = [
  { name: 'Balanced Parens', text: 'S -> S S | ( S ) | ε', description: 'Classic ambiguous grammar' },
  { name: 'Simple Left Recursive', text: 'S -> S a | b', description: 'Simple left-recursive grammar' },
  { name: 'Arithmetic', text: 'E -> E + T | T\nT -> T * F | F\nF -> id', description: 'Arithmetic expression grammar' },
]
