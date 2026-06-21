/**
 * CFG Simulation Engine — CYK Algorithm + Ambiguity Detection + Parse Trees
 */

// Parse CFG text: "S -> a S b | ε\nA -> a A | a"
export function parseCFG(grammarText) {
  const grammar = { rules: {}, startSymbol: null, terminals: new Set(), nonTerminals: new Set() }
  if (!grammarText || !grammarText.trim()) return grammar

  const lines = grammarText.trim().split('\n').filter(l => l.trim())
  for (const line of lines) {
    const parts = line.split(/->|→/)
    if (parts.length < 2) continue
    const lhs = parts[0].trim()
    const rhs = parts.slice(1).join('->').trim()
    if (!lhs) continue
    if (!grammar.startSymbol) grammar.startSymbol = lhs
    grammar.nonTerminals.add(lhs)
    if (!grammar.rules[lhs]) grammar.rules[lhs] = []
    const productions = rhs.split('|').map(p => p.trim()).filter(p => p)
    for (const prod of productions) {
      const symbols = prod === 'ε' ? [] : prod.split(' ').filter(s => s)
      grammar.rules[lhs].push(symbols)
    }
  }

  // Identify terminals
  for (const [, prods] of Object.entries(grammar.rules)) {
    for (const prod of prods) {
      for (const sym of prod) {
        if (!grammar.nonTerminals.has(sym)) grammar.terminals.add(sym)
      }
    }
  }

  return grammar
}

// Convert grammar to CNF (Chomsky Normal Form)
function toCNF(grammar) {
  // 1. Add new start symbol
  // 2. Eliminate ε productions
  // 3. Eliminate unit productions
  // 4. Break long productions
  const rules = {}
  let counter = 0
  const newVar = () => `_X${counter++}`

  // Copy rules
  for (const [v, prods] of Object.entries(grammar.rules)) {
    rules[v] = prods.map(p => [...p])
  }

  // Step 1: eliminate ε productions (find nullable variables)
  const nullable = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const [v, prods] of Object.entries(rules)) {
      for (const prod of prods) {
        if (prod.length === 0 || prod.every(s => nullable.has(s))) {
          if (!nullable.has(v)) { nullable.add(v); changed = true }
        }
      }
    }
  }

  // Add productions with nullable symbols removed
  for (const v of Object.keys(rules)) {
    const extras = []
    for (const prod of rules[v]) {
      const variants = getSubsets(prod, nullable)
      for (const variant of variants) {
        if (variant.length > 0 && !rules[v].some(p => p.join(' ') === variant.join(' '))) {
          extras.push(variant)
        }
      }
    }
    rules[v] = [...rules[v].filter(p => p.length > 0), ...extras]
  }

  // Step 2: break long productions (> 2 symbols)
  let changed2 = true
  while (changed2) {
    changed2 = false
    for (const v of Object.keys(rules)) {
      const newProds = []
      for (const prod of rules[v]) {
        if (prod.length > 2) {
          const x = newVar()
          rules[x] = [prod.slice(1)]
          newProds.push([prod[0], x])
          changed2 = true
        } else {
          newProds.push(prod)
        }
      }
      rules[v] = newProds
    }
  }

  // Step 3: replace terminals in binary productions
  const termMap = {}
  for (const v of Object.keys(rules)) {
    for (const prod of rules[v]) {
      if (prod.length === 2) {
        for (let i = 0; i < 2; i++) {
          const sym = prod[i]
          if (grammar.terminals.has(sym)) {
            if (!termMap[sym]) {
              termMap[sym] = newVar()
              rules[termMap[sym]] = [[sym]]
            }
            prod[i] = termMap[sym]
          }
        }
      }
    }
  }

  return { ...grammar, rules, cnf: true }
}

function getSubsets(prod, nullable) {
  if (prod.length === 0) return [[]]
  const [first, ...rest] = prod
  const sub = getSubsets(rest, nullable)
  if (nullable.has(first)) {
    return [...sub, ...sub.map(s => [first, ...s])]
  }
  return sub.map(s => [first, ...s])
}

// CYK parsing algorithm — returns parse table and ambiguity info
export function cykParse(grammar, inputString) {
  if (!inputString || inputString.length === 0) {
    const acceptsEmpty = (grammar.rules[grammar.startSymbol] || []).some(p => p.length === 0)
    return { accepted: acceptsEmpty, ambiguous: false, table: [] }
  }

  const cnfGrammar = toCNF(grammar)
  const n = inputString.length
  const symbols = inputString.split('')

  // table[i][j] = Set of variables that generate symbols[i..j]
  const table = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => new Map()) // variable -> list of parses
  )

  // Fill diagonal (length 1)
  for (let i = 0; i < n; i++) {
    const sym = symbols[i]
    for (const [v, prods] of Object.entries(cnfGrammar.rules)) {
      for (const prod of prods) {
        if (prod.length === 1 && prod[0] === sym) {
          if (!table[i][i].has(v)) table[i][i].set(v, [])
          table[i][i].get(v).push({ rule: v, prod: [sym], split: -1, left: i, right: i })
        }
      }
    }
  }

  // Fill upper triangle
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1
      for (let k = i; k < j; k++) {
        for (const [v, prods] of Object.entries(cnfGrammar.rules)) {
          for (const prod of prods) {
            if (prod.length === 2) {
              const [B, C] = prod
              if (table[i][k].has(B) && table[k + 1][j].has(C)) {
                if (!table[i][j].has(v)) table[i][j].set(v, [])
                table[i][j].get(v).push({ rule: v, prod: [B, C], split: k, left: i, right: j })
              }
            }
          }
        }
      }
    }
  }

  const start = grammar.startSymbol
  const accepted = table[0][n - 1].has(start)
  const parses = accepted ? table[0][n - 1].get(start) : []
  const ambiguous = parses.length > 1

  return { accepted, ambiguous, parses, table, inputString }
}

// Build parse tree from CYK table entry
export function buildParseTree(entry, table, input) {
  if (!entry) return null
  const { rule, prod, split, left, right } = entry

  if (prod.length === 1) {
    return { label: rule, children: [{ label: prod[0], children: [], terminal: true }] }
  }

  if (prod.length === 2 && split >= 0) {
    const leftEntry = table[left][split]?.get(prod[0])?.[0]
    const rightEntry = table[split + 1][right]?.get(prod[1])?.[0]
    return {
      label: rule,
      children: [
        buildParseTree(leftEntry, table, input),
        buildParseTree(rightEntry, table, input)
      ]
    }
  }

  return { label: rule, children: [] }
}

// Get all parse trees (for ambiguity visualization)
export function getAllParseTrees(grammar, inputString) {
  const result = cykParse(grammar, inputString)
  if (!result.accepted) return { accepted: false, trees: [], ambiguous: false }

  const trees = result.parses.slice(0, 3).map(entry =>
    buildParseTree(entry, result.table, inputString)
  )

  return {
    accepted: true,
    trees,
    ambiguous: result.ambiguous,
    parseCount: result.parses.length
  }
}

// Attempt to disambiguate using operator precedence
export function disambiguate(grammar) {
  const { rules, startSymbol, terminals } = grammar
  // Classic arithmetic grammar disambiguation
  const prods = rules[startSymbol] || []
  const hasSelfRecursion = prods.some(p => p.includes(startSymbol) && p.length > 1)

  if (hasSelfRecursion) {
    // Apply precedence climbing: E -> E+T | T, T -> T*F | F, F -> id | (E)
    const S = startSymbol
    const T = `${S}_T`
    const F = `${S}_F`
    return {
      ...grammar,
      rules: {
        [S]: [[S, '+', T], [T]],
        [T]: [[T, '*', F], [F]],
        [F]: ['id', `(${S})`].map(s => [s]),
      },
      disambiguation: 'operator-precedence',
      explanation: `Added precedence layers: ${S}→${S}+${T}|${T}, ${T}→${T}*${F}|${F}, ${F}→id|(${S})`
    }
  }

  return { ...grammar, disambiguation: 'none', explanation: 'No simple disambiguation found for this grammar' }
}

export const EXAMPLE_GRAMMARS = {
  arithmetic: {
    text: 'E -> E + E | E * E | id',
    description: 'Ambiguous arithmetic grammar'
  },
  palindrome: {
    text: 'S -> a S a | b S b | a | b | ε',
    description: 'Palindrome grammar'
  },
  balanced: {
    text: 'S -> S S | ( S ) | ε',
    description: 'Balanced parentheses (ambiguous)'
  }
}
