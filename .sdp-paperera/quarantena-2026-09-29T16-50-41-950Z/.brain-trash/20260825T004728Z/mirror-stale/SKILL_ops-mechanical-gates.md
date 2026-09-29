---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/ops-mechanical-gates/SKILL.md; no editar.
source: .agents/skills/ops-mechanical-gates/SKILL.md
source_sha256: 506c77b41ab9b9f4958a3bafec3da156c2b435a12190dff126c4b2e885c1fd59
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/ops-mechanical-gates/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# ops-mechanical-gates


## Antic: code-guardian

---
name: code-guardian
lang: ca
description: "Abans d'escriure codi, executa un escrutini automàtic contra les 10 Lleis de Pedra Seca."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Code Guardian (Escut de Pedra Seca)

## DESCRIPCIÓ

Abans d'escriure una sola línia de codi, aquesta skill activa un escrutini automàtic contra les 10 Lleis de Pedra Seca. Actua com el "Gos Peixater": ensuma cada línia i borda si detecta males herbes.

## PROTOCOL PRE-GENERACIÓ

Abans d'escriure codi, executar mentalment aquest checklist:

### Lleis de Pedra Seca (constitució)
- [ ] L1: HTML crea significat? (Cap `<div>` on un `<button>` seria correcte)
- [ ] L2: CSS crea identitat? (Cap estil inline, tot a fulls globals)
- [ ] L3: Tailwind només organitza espai? (Prohibit per colors/radis/estètica)
- [ ] L4: Variables governen? (Tot color/radi/espaiat com a `--sdp-*`)
- [ ] L5: Components universals? (No reinventar UniversalButton, UniversalCard, etc.)
- [ ] L6: Accessibilitat AAA? (Tap targets 56px, contrast AAA, ARIA correcte)
- [ ] L7: Mode Bancal? (Llegible baix sol en iPad A10 vell)
- [ ] L8: Termodinàmica A10? (Mínim JS, animacions amb CSS)
- [ ] L9: Degradació elegant? (Sense connexió, no pantalla blanca)
- [ ] L10: Trellat? (Si una regla frustra l'usuari, la regla es trenca)

### Checklist de Seguretat
- [ ] Cap `dangerouslySetInnerHTML` sense DOMPurify
- [ ] Cap `eval()` o `Function()` dinàmica
- [ ] Cap `crypto.randomUUID()` sense fallback
- [ ] Cap `localStorage` sense try/catch
- [ ] Cap `fetch` sense timeout/AbortController
- [ ] Cap funció async sense maneig d'errors

### Checklist de Memòria
- [ ] Tot `addEventListener` té el seu `removeEventListener`
- [ ] Tot `setInterval` té el seu `clearInterval`
- [ ] Tot `setTimeout` es neteja en unmount
- [ ] Tot `useEffect` té cleanup si crea subscripcions
- [ ] Cap referència circular en `useMemo` dependencies

## PROTOCOL POST-GENERACIÓ

Després d'escriure el codi, executar:

1. **TRACE**: Seguir cada prop des del pare fins al fill. Hi ha algun prop no usat?
2. **NULL**: Què passa si cada prop és `null`/`undefined`? 
3. **RACE**: Hi ha dos `setState` que es disparen en paral·lel?
4. **UNMOUNT**: Si el component es desmunta a mitjan operació, què passa?
5. **SSR**: Si `typeof window === 'undefined'`, falla elegantment?

## BORDADES DEL GOS PEIXATER

Quan detecta una violació, el Guardian ha d'emetre:

```
🐕 BORDADA: [Llei violada] a [fitxer:línia]
   Problema: [descripció]
   Pegat: [solució concreta]
   Severitat: P0 | P1 | P2
```

## INTEGRACIÓ

Aquesta skill s'activa automàticament quan:
- L'usuari demana codi React/CSS/JS
- Es modifica un component existent
- Es crea un nou component
- Es toca `AppDataContext.jsx` o `supabaseBackend.js`


## Antic: anti-collapse-audit

---
name: anti-collapse-audit
description: Checklist obligatori abans de qualsevol mutació massiva de codi o execució de scripts de tooling. Detecta riscos de destrucció de base de codi, inconsistències de seeds i punts únics de fallada.
---

# Anti-Collapse Audit

## Checklist pre-mutació
- [ ] Backup o git status net.
- [ ] Seeds validades (IDs únics, camps obligatoris).
- [ ] Cap import circular nou.
- [ ] Theme / storage keys versionades.
- [ ] Components principals amb ErrorBoundary o fallback UI.
- [ ] Scripts de tooling marcats com a dry-run primer.
- [ ] Imatges i assets resolubles (cap path trencat).
- [ ] Chat i dispositius degraden si localStorage/BroadcastChannel fallen.

## Després del canvi
- Verificar que MOCK_FEED / seccions buides no trenquen la UI.
- Comprovar que `searchText` i lookups continuen funcionant.
- Confirmar que no s’han duplicat normalitzadors d’accents.


## Antic: destructive-architecture-audit

---
name: destructive-architecture-audit
lang: en
description: "Audits code for single points of failure, memory leaks, and architectural vulnerabilities by simulating worst-case scenarios."
version: 1.0.0
status: canonic
abast: ["global"]
---

# Destructive Architecture Audit

## Activation
When the user asks to:
- Audit the system
- Find vulnerabilities
- Simulate failures
- Prepare for disaster recovery

## Rules

### R1. Simulate Worst Case
For each component, ask:
- What happens if this API call fails?
- What happens if IndexedDB is corrupted?
- What happens if the service worker serves stale assets?
- What happens if the user has 10,000 chat messages?

### R2. Single Point of Failure
Identify EVERY global state, singleton, or shared resource:
1. AppDataContext (global)
2. chatRuntime.js (global state)
3. supabaseBackend.js (global config)

### R3. Memory Analysis
1. Identify all places where arrays can grow unbounded
2. Check for missing cleanup (useEffect returns, listeners)
3. Check for heavy objects in React state

### R4. Disaster Recovery Plan
Each audit MUST output:
1. What can fail
2. How it fails
3. Recovery procedure
4. Prevention mechanism

## Output Format
```json
{
  "component": "chatRuntime.js",
  "vulnerability": "Memory leak from accumulating all messages",
  "scenario": "User chats for 30 minutes",
  "failure_mode": "IndexedDB grows > 50MB, page becomes unresponsive",
  "recovery": "Clear chat history manually",
  "prevention": "Add message limit (e.g., keep last 1000 messages)"
}
```

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
