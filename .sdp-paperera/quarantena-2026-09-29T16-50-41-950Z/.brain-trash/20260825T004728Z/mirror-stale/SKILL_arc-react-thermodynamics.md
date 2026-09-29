---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/arc-react-thermodynamics/SKILL.md; no editar.
source: .agents/skills/arc-react-thermodynamics/SKILL.md
source_sha256: fdf802f980cf7d1ea48fd72d4af9215e9054c759132aebfd23f03205a0e09ea9
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/arc-react-thermodynamics/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# arc-react-thermodynamics


## Antic: react-memory-thermodynamics

---
name: react-memory-thermodynamics
lang: ca
description: "Estratègies per a prevenir fuites de memòria i col·lapses de rendiment en aplicacions React destinades a dispositius de baix rendiment."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: React Memory Thermodynamics

## Description
Estratègies per a prevenir fuites de memòria i col·lapses de rendiment en aplicacions React destinades a dispositius de baix rendiment (iPad A10, telèfons antics). Basat en la Termodinàmica del Mas: no malgastar energia.

## When to use
- Quan un component crea listeners, intervals, timeouts o objectes pesants.
- Quan llista més de 20 elements en pantalla.
- Quan s'observa lag en el canvi de seccions.

## Principles
1. **Guillotina Topològica**: Aïllar re-renders. Si una teula canvia, no desmuntar la teulada.
2. **Oblit Exponencial**: Netejar referències (callbacks, listeners) tan aviat com el component desapareix.
3. **No calcular tot, tot el temps**: Memoïtzar càlculs costosos amb `useMemo` i `React.memo`.

## Procedure
1. **Intervals i Listeners**:
   ```jsx
   useEffect(() => {
     const id = setInterval(tick, 5000);
     return () => clearInterval(id);
   }, []);
   ```
2. **Context Monolític**: Particionar en `DataContext` (quasi estàtic) i `ActionsContext` (mètodes estables amb `useCallback`).
3. **Virtualització**: Per a llistes > 50 ítems, usar `react-window`.
4. **Imatges**: Sempre `loading="lazy"` i `decoding="async"`. Alliberar `src` en unmount si és un Blob.
5. **Memoïtzació agressiva**:
   ```jsx
   const Card = React.memo(({ item }) => { ... });
   ```
6. **IndexedDB vs localStorage**: Usar IDB per a snapshots grans; localStorage només per flags.

## Anti-patterns
- Omitir la funció de neteja en `useEffect`.
- Passar objectes literals o funcions anònimes a components memoritzats (trenca la memoïtzació).
- Carregar tot l'seed de dades en un únic context sense particionar.


## Antic: thermodynamic-optimization

---
name: thermodynamic-optimization
lang: ca
description: "Optimitza cada component per al consum mínim d'energia computacional. Implementa la Guillotina Topològica."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Thermodynamic Optimization (Guillotina Topològica)

## DESCRIPCIÓ

Optimitza cada component per al consum mínim d'energia computacional. Implementa la "Guillotina Topològica": talla els re-renders innecessaris perquè només es repinti la teula que toca, no tota la teulada.

## PROTOCOL D'AUDITORIA TÈRMICA

Per a cada component, verificar:

### 1. MEMOITZACIÓ
```jsx
// ❌ MALAMENT: Crea un array nou cada render
function BadComponent({ items }) {
  const sorted = items.sort((a, b) => a.name > b.name);
  return sorted.map(...);
}

// ✅ BÉ: Memoitzat
function GoodComponent({ items }) {
  const sorted = useMemo(() => 
    [...items].sort((a, b) => a.name > b.name), 
    [items]
  );
  return sorted.map(...);
}
```

### 2. IDENTITAT DE PROPS
```jsx
// ❌ MALAMENT: objecte nou cada render
<Child config={{ theme: 'dark', lang: 'ca' }} />

// ✅ BÉ: constant o useMemo
const CHILD_CONFIG = { theme: 'dark', lang: 'ca' };
// o
const childConfig = useMemo(() => ({ theme: 'dark', lang: 'ca' }), []);
<Child config={childConfig} />
```

### 3. CALLBACKS
```jsx
// ❌ MALAMENT: funció nova cada render
<Child onClick={(e) => handleClick(e, item.id)} />

// ✅ BÉ: useCallback amb dades
const handleChildClick = useCallback((e) => {
  handleClick(e, item.id);
}, [item.id, handleClick]);
```

### 4. CONTAINMENT
```jsx
// ❌ MALAMENT: un canvi de filtre re-renderitza tot el mur
<div className="mur">
  <Filtres onChange={setFiltre} />
  <Llista items={items} filtre={filtre} />  // ← es re-renderitza
  <Mapa items={items} />  // ← també es re-renderitza innecessàriament
</div>

// ✅ BÉ: Containment aïlla
<div className="mur">
  <Filtres onChange={setFiltre} />
  <Llista items={items} filtre={filtre} />
  <MemoMapa items={items} />  // ← React.memo, no es re-renderitza
</div>
```

### 5. CSS vs JS
```jsx
// ❌ MALAMENT: JS per animar (gasta CPU)
useEffect(() => {
  const interval = setInterval(() => {
    setOpacity(prev => prev + 0.01);
  }, 16);
}, []);

// ✅ BÉ: CSS per animar (GPU, no CPU)
// CSS: .fade-in { animation: fadeIn 0.3s ease-out; }
<div className="fade-in">...</div>
```

## LLINDARS TÈRMICS

| Mètrica | Llindar iPad A10 | Acció si es supera |
|---------|------------------|-------------------|
| Bundle JS inicial | < 150 KB gzipped | Code-split |
| Re-renders per interacció | < 3 components | Memoitzar |
| Temps de càrrega 3G | < 3s | Lazy load |
| Memory heap | < 50 MB | Auditar leaks |
| DOM nodes | < 1500 per pantalla | Virtualitzar llistes |

## REGLES D'OR

1. **CSS > JS**: Si es pot animar amb CSS, mai amb JS
2. **Memoitzar > Re-calcular**: Si costa >O(n), memoitzar
3. **Lazy > Eager**: Si no es veu, no es carrega
4. **Batch > Individual**: Agrupar setState múltiples en un
5. **Ref > State**: Si no afecta el render, usar useRef, no useState

## INTEGRACIÓ AMB L'ARQUITECTURA

Aplicar aquesta skill automàticament quan:
- Es crea un component que rep >3 props
- Es mapa un array de >10 elements
- S'usa un efecte amb interval/timeout
- Es modifica AppDataContext o qualsevol provider


## Antic: consola-termodinamica

---
name: consola-termodinamica
lang: en
description: Monitoring and auto-recovery protocol. Centralizes the sacred metrics and RAM/CWV alerts.
version: 2.0.0
status: canonic
abast: ["global"]
---

# SKILL: Thermodynamic Console (The Heart of the Mas)

> **Council of AIs Vision:** Metrics without action are just dead literature. This SKILL consolidates the electrocardiogram of the project. It is the organ that translates the intangible (AI efficiency, iPad RAM) into biological decisions: Heal, Prune, or Continue.

## 1. Objective
Act as an autonomous nervous system. More than just a number board, the Console allows the system to diagnose itself, issue alerts, and act accordingly preventing any technological element from spinning out of control.

## 2. Rules and Functions (The Sacred Metrics)
Sóc de Poble's metrics are measured in 4 main domains. Each domain defines thresholds that the AI (and human) must audit:

### Block A: Cognitive and Symbiosis (The Intellect)
- **Trellat Index (TI):** Measures the perfection of the Human-Machine symbiosis. The required minimum is 90%. *(Note: Currently a theoretical prototype. The AI must evolve this from dead literature to a real SDP-LOCK blocking gate).*
- **Token Entropy (TE):** Ratio between useful words and AI yapping.
- **Documentary Coherence (DCI):** Validates that the Wiki is an absolute mirror of the codebase.

### Block B: Structural (Memory)
- **Tombstone Load (TL):** Accumulation of residue in the local database. If it rises above 70%, the system can suffocate.
- **Dependency Ratio (DER):** Quantity of external libraries installed vs own code. Sovereignty must be protected by minimizing third-party dependencies (`node_modules`).

### Block C: Performance and Physical Device (The Body)
- **Core Web Vitals:** Load time (LCP) below 2.5 seconds.
- **DOM Response Time (INP):** Fast tactile feedback on buttons.

### Block D: Resilience and Survival
- **UDR (Unconscious Destruction Rate):** Controls what proportion of code an AI would want to change in a single impulse to avoid the anxiety of indiscriminate refactoring.

## 3. The Control Panel and Ritual (Consolidation)
The human (the Master) cannot be looking for numbers in obscure logs:
- The AI has the responsibility to export these records to JSON.
- This JSON directly feeds a visual web interface for the Master.
- **Weekly Ritual (The Great Heartbeat):** Trends must be reviewed. If memory goes up or Trellat goes down, AIs stop executing new features and dedicate themselves exclusively to "sweeping the floor" (maintenance).

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
