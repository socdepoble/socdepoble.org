---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/arc-embedded-boundary/SKILL.md; no editar.
source: .agents/skills/arc-embedded-boundary/SKILL.md
source_sha256: d87d508ce9e52a7b1c9a96712b6adb1dcf3f28670dff966406f0970914fa72c4
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/arc-embedded-boundary/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# arc-embedded-boundary


## Antic: code-stability-refactor

---
name: code-stability-refactor
lang: en
description: "Automated refactoring guidance skill that suggests minimal, testable refactors to improve stability (isolate state, memoize, add cleanup)."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Skill: Code Stability Refactor
## Description
Automated refactoring guidance skill that suggests minimal, testable refactors to improve stability (isolate state, memoize, add cleanup).

## Inputs
- code_snippet: string
- target_goal: one of [reduce-rerenders, fix-memory-leak, remove-circular-dep]

## Outputs
- refactor_plan: ordered steps
- patch_snippets: before/after code examples
- tests_to_add: list of unit/E2E tests

## Behavior
1. Analyze snippet for anti-patterns.
2. Propose minimal change set with tests.
3. Provide patch-ready snippets.

## Example
Input: component with heavy re-renders.
Output: refactor_plan: ["memoize child", "useCallback handlers"], patch_snippets: {...}, tests_to_add: ["renders once on prop change"].


## Antic: memory-leak-detector

---
name: memory-leak-detector
lang: en
description: "Detects memory leaks in React components by analyzing effect dependencies, event listeners, and state accumulation patterns."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Memory Leak Detector

## Activation
When asked to:
- Audit performance
- Fix memory issues
- Review React components
- Debug page freezes

## Rules

### R1. Effect Dependencies
Check every `useEffect`:
- Does it have the correct dependency array?
- Does it clean up?
- Does it set state on unmounted components?

### R2. Accumulation Patterns
Look for:
- Arrays that push without popping
- Objects that add keys without deleting
- Sets that grow indefinitely
- Maps that accumulate without clearing

### R3. Event Listeners
Check:
- Are listeners removed on unmount?
- Are they in the right scope?
- Could they cause re-runs?

### R4. Heavy Objects
Check:
- Large objects in state
- Massive arrays in Redux/context
- Document fragments that aren't cleaned
- DOM nodes that are referenced but detached

## Output Format
```json
{
  "component": "XatSection.jsx",
  "leak_pattern": "accumulation",
  "location": "useEffect line 42",
  "evidence": "messages array grows with every chat message, never cleaned",
  "fix": "Add limit to array, or clear after 1000 messages",
  "test": "Chat for 30 minutes, monitor memory usage"
}
```

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
