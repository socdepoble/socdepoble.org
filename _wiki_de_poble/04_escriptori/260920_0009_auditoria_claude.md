---
type: informe
status: esborrany
description: Estratègia consolidada de refactorització reactiva i normativa. Resposta a les 4 decisions bloquejades i pla de cirurgia compartit Claude-Codex.
tags:
  - govern
  - arquitectura
  - reactivitat
---

# Informe — Estratègia de Refactorització (Onada E)

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260920-CLAUDE |
| Respon a | SDP-PROMPT-260920 |
| Tall verificat | HEAD `b398115f` · branca `backup-notes-publish` · 20-09-2026 00:09 |
| Agent | Claude (Cowork) |
| Aprovació humana | pendent |

**Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]

---

## §0 · Dues correccions d'entrada abans de res

**a)** La primera versió d'aquest prompt citava `.agents/implementation_plan.md`. Eixe fitxer **no existix enlloc de l'arbre** (`find` sobre tot el repositori: zero resultats). La segona versió el corregix a `_wiki_de_poble/04_escriptori/260920_0007_pla_implementacio_provisional.md`, que **sí** que existix i he llegit. Ho deixe escrit perquè és el mateix patró que ja tens catalogat: un nom d'alies que no casa amb el disc. La versió corregida és la bona.

**b)** L'arbre no s'ha mogut des de la meua auditoria d'ahir (mateix HEAD, mateixos 18 fitxers modificats). **Les meues cites de `260919_2359_auditoria_claude.md` continuen vigents.** Però les de Codex no: Codex cita `NotesContext.jsx:226–239` per al `value` del proveïdor i jo cite `:246–258`. Són **el mateix constructe**; el fitxer va créixer 20 línies entre les 21:54 i les 23:45. Ho tracte a §2.

---

## §1 · Les quatre decisions

### P1 · La taula PROTOCOLLEDGE → **Opció A, amb el descobriment arreglat**

**Veredicte: A. I el debat A-vs-B és el debat equivocat.**

La taula no es va perdre per estar escrita en prosa. Es va perdre perquè `tooling/brain/matrix.mjs:137` la busca per **ruta literal**:

```
const REFLEXIO = R('.agents/skills/skill-acte-reflex/SKILL.md');
```

**L'Opció B no arregla això.** Un `.agents/protocolledge.json` es pot esborrar en una purga exactament igual que un SKILL.md, i el consumidor continuaria sent una ruta escrita a mà. Canviaries el format i conservaries la causa.

Tres raons més per A, totes verificades:

1. **La màquina per a fer-ho bé ja existix i està pagada.** `matrix.mjs:55-58` ja escaneja el directori amb `readdirSync`, i `:77-88` ja parseja el frontmatter de **cada** skill i es guarda el text sencer a `skills[]`. Trobar la taula per una bandera de frontmatter no costa cap lectura de disc nova: són quatre línies reaprofitant un array que ja està muntat. L'Opció B, en canvi, demana format nou, parser nou i un consumidor nou.

2. **Aquest projecte es fa mal precisament duplicant fonts.** El mirall, l'índex caducat, les quatre skills fusionades: tot el deute normatiu d'aquesta onada és de fonts divergents. L'Opció B afig un **segon format de doctrina** (JSON al costat de markdown) i, amb ell, una costura nova per on separar-se. El comentari de `matrix.mjs:135-136` ja avisa: *«una segona còpia seria una segona llei»*.

3. **La llei s'ha de llegir on es raona.** `matrix.mjs` injecta el text **sencer** de les skills enceses i en deixa rebut amb sha. Eixa és tota la seua arquitectura. En JSON, MarIA veuria el *resultat* de l'encaminament però no el *mapa*.

**Per què no es trencarà res:** la regex de `:140` no es toca. L'únic que canvia és d'on ix `REFLEXIO`. I la guarda que ja tens a `:169-172` —si no hi ha fila per defecte, error— **ja detecta exactament el que va passar**: una taula buida. El cervell no va fallar per manca de controls; va fallar perquè el control mirava un forat.

> ⚠️ **Avís d'execució:** dues de les 17 files recuperables de `git show HEAD:.agents/skills/skill-acte-reflex/SKILL.md:42-60` apunten a skills **també esborrades** (`skill-consell-bundle` i el propi `skill-acte-reflex`). Copiar-les tal qual tornaria a deixar `porta:doctrina` en roig. **S'han de reescriure, no restaurar.**

---

### P2 · El mirall de skills → **Ni una cosa ni l'altra tal com estan plantejades**

La pregunta tal com està escrita —«automàtic i només lectura» *o* «eliminar-lo»— amaga el fet decisiu:

> **`tooling/wiki/sincronitzar_skills.mjs` només escriu. No esborra mai.**
> Té `writeFileSync` a `:41` i `:57`, i **cap** `unlink`, `rm` ni neteja del destí.

Això vol dir que **el pas 2 del teu pla provisional («Reconstruir l'índex i els miralls») no netejaria res.** Executar la sincronia crearia els dos miralls nous i deixaria els **quatre orfes intactes** (`agents_equip_ia.md`, `agents_ment_colmena_integral.md`, `agents_skill_acte_reflex.md`, `agents_skill_consell_bundle.md`). Passaries de 20 fitxers a 22, quatre d'ells doctrina derogada, i el pla es donaria per complit.

**Hi ha una contradicció constitucional, a més.** `.agents/AGENTS.md:18` diu literalment:

> *«L'autoritat executiva viu exclusivament a `.agents/skills/`. Està prohibit crear o llegir còpies de regles.»*

El mirall **és** una còpia de regles. La carpeta i la constitució es contradiuen avui, en text.

**Veredicte: conservar la carpeta, eliminar-ne l'autoritat.** No eliminar-la d'arrel, perquè la necessitat humana és real i està documentada al seu propi README: el Mestre no pot navegar una carpeta amb punt des d'Obsidian. Esborrar-la resol un problema de màquina creant-ne un d'humà, i n'hi ha una eixida més barata. Tres condicions, i **les tres són obligatòries alhora**:

1. **Regeneració destructiva.** Buidar `DEST_DIR` abans d'escriure. Sense això els orfes són immortals i tot el pas 2 és teatre.
2. **Una porta que compare conjunts.** Si el conjunt de miralls ≠ el conjunt d'skills, roig. Avui **cap porta llig el mirall**; per això va poder podrir-se en silenci durant setmanes.
3. **`status: derivat` al frontmatter generat**, i esmenar `AGENTS.md:18` perquè diga *«prohibit crear còpies de regles **a mà**; les còpies generades per màquina i marcades `derivat` són lectura per a humans, mai font»*. Sense aquesta esmena, seguir la constitució al peu de la lletra obligaria a esborrar la carpeta.

**Refutació important, per a no alarmar de més:** he comprovat si la doctrina derogada ha eixit cap a fora i **no.** `tooling/brain/crear_bundle.mjs:203` inclou `skills_mirror` a `DIRS_EXCLOSOS`, i el manifest del `260919_2048_MACRO_BUNDLE` ho confirma: **0 fitxers del mirall entre els 599 del bundle**. Cap IA externa del Consell ha rebut regles derogades pel mirall. El risc real és més xicotet i més concret: **un agent local que grepege la Wiki** — que és exactament el que he fet jo ahir.

---

### P3 · L'autoritat → **L'eix de l'índex és el problema, no la resposta**

`00_INDEX_SKILLS.md` diu que `protocols_tecnics/` són *«fitxes de coneixement, no eines executables»*. Però la taula PROTOCOLLEDGE perduda **encaminava cap allí** com a destí obligatori:

```
| auditoria, revisar, auditar | AUDITORIA_CANONICA | protocols_tecnics/auditoria_canonica.md |
| codi, arquitectura, refactor | TRELLAT           | protocols_tecnics/index_trellat.md       |
```

Un fitxer que és el **destí obligatori d'una regla d'encaminament** no és una fitxa. Tal com està escrita, eixa frase **autoritza un agent a ignorar `auditoria_canonica.md`**, que és el contrari del que la llei volia.

**Veredicte: canvieu l'eix. No és «executable vs coneixement». És «quan» vs «què».**

| | `.agents/skills/` | `_wiki_de_poble/02_saber/` |
| --- | --- | --- |
| Respon a | **Quan** i **si** s'aplica una norma | **Què** diu la norma |
| Mecanisme | `triggers_on`, `core`, `prioritat` | El cos del protocol o la plantilla |
| Càrrega | Sempre o per gallet, a cada invocació | Només quan el PROTOCOLLEDGE hi encamina |
| Mida | Curt per obligació — paga pressupost de context | Llarg sense penalització |

Les dues manen. Manen de coses diferents. Les skills són **el router i la constitució**; la Wiki és **el cos de la llei**.

D'ací ixen dues regles que sí que es poden verificar amb una porta:

- **Una skill no pot contindre un protocol sencer** → seria una còpia (i `AGENTS.md:18` ja ho prohibix).
- **Un protocol no pot declarar el seu propi gallet** → seria un segon router.

La resposta a «les màquines només fem cas a `skills/`?» és: **les màquines fan cas a `skills/` per a saber què carregar, i al document encaminat per a saber com fer-ho.** Amb això la frase de l'índex s'ha de reescriure; és l'única línia que cal tocar.

---

### P0 · React vs Preact → **Les dues, a propòsit, amb feines distintes**

Primer, els fets, perquè aquesta decisió s'ha discutit sense dades:

| Fet | Verificació |
| --- | --- |
| **Cap fitxer de producció importa Preact** | Només 2 tests: `PillToggle.test.jsx:5-6`, `UniversalCard.test.jsx:6-7` |
| L'acoblament és **només l'àlies** | `vite.config.js:35-39` |
| `StrictMode` és `Fragment` (inert) | `preact/compat/src/index.js:190,238` |
| React real ja s'ha colat i va petar | `vite.config.js:44-51`, comentari propi |
| Tests que usen `@testing-library/preact` | 6 d'11 |

**El codi de l'aplicació és 100% API de React.** El cost de migrar no és una reescriptura: és un àlies i sis fitxers de test.

**Veredicte: publiqueu Preact. Valideu amb React.**

**Publicar Preact**, perquè la justificació ja està escrita al vostre propi codi. `NotesDataContext.jsx:164-166`:

> *«Al bancal, amb cobertura roïna, això és la diferència entre respondre i no respondre.»*

Uns 40 kB gzip menys de runtime són exactament eixe argument. Triar React per puresa contradiria la raó de ser declarada del projecte. El codi obert no us obliga a React: us obliga a **no amagar** que useu Preact.

**Validar amb React**, perquè és l'única manera que «no dependre de trampes temporals» siga una frase comprovable i no un desig. El `<StrictMode>` de `App.jsx:475` no detecta res avui. En una passada amb React real sí que detectaria, de colp:

- l'assignació dins de l'updater de `AppGridShell.jsx:123-140`,
- l'escriptura a `sessionStorage` dins de l'updater de `NotesContext.jsx:97,127`,
- l'escriptura al ref dins del `useMemo` de `NotesContext.jsx:161`.

Cost honest i acotat: **una segona configuració de vitest sense l'àlies** + portar els 6 tests de `@testing-library/preact`. La part ja resolta és que `react` i `react-dom` ja són a `package.json`, i el tractament de `deps.inline` per a lucide-react ja està documentat a `vite.config.js:44-51`.

**I mentrestant, decidiu què feu amb `App.jsx:475`.** Un `<StrictMode>` que no comprova res és de la mateixa família que una porta que ix verda sense mirar: promet cobertura i no en dona. O el lleveu, o el deixeu amb un comentari que diga que és inert sota Preact i actiu a la línia de validació.

> **[SUPÒSIT]** No he mesurat Preact vs React en aquesta aplicació. La recomanació es basa en mida de bundle i en l'objectiu rural declarat, **no en un perfilat de render**. Si «més rendiment de cara al futur» s'ha de decidir empíricament, cal un perfilat que ningú ha fet. El *chunk* de `NotesSection` fa 495 kB i el domina TipTap, no el framework: la diferència entre els dos motors és real però no és on es guanya la partida.

---

## §2 · Auditoria creuada: on coincidim Codex i jo, i on no

### Coincidència independent (senyal fort)

Codex, a `260919_2154_auditoria_extrema_codex.md` §5.5, va trobar **la mateixa cascada** sense haver llegit el meu informe:

> *«Cada pulsació pot serialitzar tots els overrides pendents i provocar recorregut de totes les notes per calcular el model... l'array i el valor del context es reconstruïxen quan canvien overrides.»*

Dos agents, per camins distints, al mateix lloc. Això no és opinió: és la troballa més sòlida de l'onada.

Un matís que afig certesa: Codex marca la conseqüència tèrmica com a **[SUPÒSIT]** i demana mesura. Té raó sobre la **magnitud**, però la **freqüència** no és conjectura — `DocumentEditor.jsx:17` ho documenta el codi mateix: *«Cridat immediatament a cada input.»* Sabem que passa a cada tecla; no sabem quant costa en un A10.

### Discrepància real

Codex tanca §5.5 amb: **«No afegir memoització indiscriminada sense perfilat.»**

Jo vaig proposar 9 passos, uns quants dels quals són memoització. **Això s'ha de resoldre, no maquillar.** La distinció que el dissol:

| Tipus | Què és | Cal perfilat? |
| --- | --- | --- |
| **Memoització-contracte** | Un `value` de proveïdor que és un literal nou cada render no és un context sense optimitzar: és un context **trencat**. El `useMemo` no l'accelera, fa que complisca el que promet el seu tipus. | **No.** És correcció. |
| **`memo()` desarmat** | Un `memo()` que no pot encertar mai és **pitjor** que no tindre'n: paga la comparació i enganya qui llig. | **No.** O es fa cert o es lleva. |
| **Memoització-optimització** | Afegir `useMemo` a un `reduce` o un `sort` esperant anar més ràpid. | **Sí. Codex té raó.** |

**Retire del pla, i done la raó a Codex,** els punts que eren optimització sense mesura: el `reduce` de `NotesItems` (`UniversalWorkspace.jsx:445`), el doble `.map(String)` de `workspaceState.js:152,157` i la renormalització de `:161`. Són reals, però són **brossa a netejar quan es toque eixe fitxer**, no una tasca d'onada.

**Mantinc com a no negociables** els dos `value` sense memoitzar i les dependències incompletes. No són rendiment: `NotesContext.jsx:243` (`publishNote` sense `scopeKey` a les deps) és **aïllament de tenant trencat**, i això no espera cap perfilat.

### Avís operatiu sobre les cites

Codex cita `NotesContext.jsx:226–239`; jo cite `:246–258`. Mateix constructe, 20 línies de diferència, dues hores de separació. Amb tres agents editant `src/` en paral·lel, **cap número de línia d'aquests dos informes és de fiar en el moment d'executar**. El pla de baix comença per això.

---

## §3 · Pla de Cirurgia Compartit

Reordene el teu pla provisional i li afig el pas que li falta.

| Pas | Acció | Fitxer | Per què ací |
| --- | --- | --- | --- |
| **0** | **Fixar el tall: confirmar els 18 fitxers modificats.** | — | Amb 3 agents escrivint en paral·lel, operar sobre un arbre brut és com es desalineen les cites. Sense açò, els passos 1-9 citen un fitxer que ja no existix. |
| **1** | Reescriure les 17 files del PROTOCOLLEDGE (**no copiar**: 2 apunten a skills mortes) + descobriment per frontmatter | `skill-documentacio-i-reflex/SKILL.md`, `matrix.mjs:83,137` | El cervell està caigut. Tota la resta és opinió mentre `porta:matrix` isca 2. |
| **2** | Reconstruir `00_INDEX_SKILLS.md` + **fer destructiva** `sincronitzar_skills.mjs` + porta de conjunts | `00_INDEX_SKILLS.md`, `tooling/wiki/sincronitzar_skills.mjs` | **Sense la part destructiva, aquest pas no neteja res.** Verificat: el script no esborra. |
| **3** | Reapuntar `tractor-cens.mjs:228` a la skill viva | `tooling/gates/tractor-cens.mjs` | `porta:cens` en roig per la mateixa purga. |
| **4** | Reescriure la frase d'autoritat de l'índex segons P3 | `00_INDEX_SKILLS.md` | Avui autoritza ignorar `auditoria_canonica.md`. |
| **5** | **Memoitzar el `value` de `NotesContext`** | `NotesContext.jsx:246` | Una funció. Desbloqueja tota la reactivitat de Notes. |
| **6** | **Netejar i memoitzar el `value` d'`AppGridShell`** | `AppGridShell.jsx:165` | Una funció. Mata l'allau de columnes. Vegeu F5: és més simple del que vaig dir ahir. |
| **7** | Completar deps de `publishNote` i del `model` | `NotesContext.jsx:243`, `NotesSection.jsx:65` | **Correctesa, no rendiment.** Aïllament de tenant i error congelat. |
| **8** | `configRef` a `NotesDataContext`, llevar `stableConfig` | `App.jsx:472`, `NotesDataContext.jsx:119,187` | Estructural. Lleva la fèrula **i** l'os trencat alhora. |
| **9** | Estabilitzar les props que desarmen els `memo()` | `UniversalWorkspace.jsx:41,219`, `NotesSection.jsx:95-110` | Ara ja tindrà efecte. Abans del 5 i el 6, no. |
| **10** | Decidir P0: línia de validació React, i què fer amb `<StrictMode>` | `vite.config.js`, `App.jsx:475` | Sense això, els passos 5-9 no tenen xarxa. |
| **⏸** | *Perfilat abans de tocar* `NotesItems`, `workspaceState` | — | Cedit a Codex. No s'hi entra sense mesura. |

**Els passos 5 i 6 són dues funcions i valen més que els altres vuit junts.**

---

## §4 · Els fragments (text pla, no aplicables)

> Cap d'aquests blocs està escrit al disc. Són text per a llegir i decidir.

### F1 · `matrix.mjs` — descobriment per frontmatter (P1)

```text
─── A) al carregador d'skills, :83-88 · afegir una línia ────────────────
  skills.push({
    nom, ruta, txt,
    core: String(fm.core) === 'true',
    protocolledge: String(fm.protocolledge) === 'true',   // ← NOVA
    triggers: [].concat(fm.triggers_on || []),
    prioritat: Number(fm.prioritat ?? 50)
  });

─── B) substituir :137-152 ──────────────────────────────────────────────
  // ABANS: ruta literal. Si algú mou el fitxer, el cervell cau en silenci.
  //   const REFLEXIO = R('.agents/skills/skill-acte-reflex/SKILL.md');

  // DESPRÉS: reaprofita skills[], que ja porta el text i el frontmatter.
  // Cap lectura de disc nova. I detecta el cas «dues lleis», que és el
  // que aquesta arquitectura tem més que la ruta trencada.
  const portadores = skills.filter((s) => s.protocolledge);
  if (portadores.length === 0) {
    errors.push('Cap skill declara «protocolledge: true». La taula no té casa.');
  } else if (portadores.length > 1) {
    errors.push(`Més d'una skill declara «protocolledge: true» `
      + `(${portadores.map((s) => s.nom).join(', ')}). La llei viu en un sol lloc.`);
  }

  const protocols = [];
  for (const l of (portadores[0]?.txt || '').split('\n')) {
    // ...mateixa regex de :140. NO ES TOCA.
  }
```

I al frontmatter de `skill-documentacio-i-reflex/SKILL.md`, una línia: `protocolledge: true`.

### F2 · `NotesContext` — el `value` (pas 5)

```text
─── prop de :49, després de `const { showToast } = useToast();` ─────────
  const informaError = useCallback(
    (msg) => showToast(msg || 'Error', 'error'),
    [showToast]
  );
  const obriConfiguracioNotes = useCallback(() => {
    console.log('obriConfiguracioNotes no implementat');
  }, []);

─── substituir :245-261 ─────────────────────────────────────────────────
  const valor = useMemo(() => ({
    notes, noteFolders, saveNoteField, setLocalNoteField, publishNote,
    creaNota, status, error, informaError, obriConfiguracioNotes, t
  }), [notes, noteFolders, saveNoteField, setLocalNoteField, publishNote,
       creaNota, status, error, informaError, obriConfiguracioNotes, t]);

  return (
    <NotesContext.Provider value={valor}>
      {children}
    </NotesContext.Provider>
  );
```

### F3 · `publishNote` — dependències (pas 7, correctesa)

```text
─── :243 ────────────────────────────────────────────────────────────────
  // El cos usa scopeKey (:233), updateNoteContext (:234),
  // clearLocalNoteFields (:236) i showToast (:238), i cap hi era.
  // Efecte real: després d'un canvi de tenant, publicar escrivia
  // amb el scopeKey anterior.
  }, [noteFolders, sendSectionSubmission, saveNoteField, externalConfig,
      scopeKey, updateNoteContext, clearLocalNoteFields, showToast]);

─── NotesSection.jsx:65 ─────────────────────────────────────────────────
  // `error` s'usa a :47 i no estava a les deps: arriba congelat a la UI.
  }), [status, error, noteFolders, notes, allCategories, allTags]);
```

### F4 · `configRef` — llevar la fèrula i l'os (pas 8)

```text
─── App.jsx:470-483 ─────────────────────────────────────────────────────
  // Fora `stableConfig`. Era l'única cosa que impedia que cada render
  // del host disparara un loadNotes() sencer contra Sollutia; en llevar-la
  // cal haver fet ABANS el canvi de NotesDataContext. No les separes.
  export default function App({ config }) {
    return (
      <NotificationProvider>
        <AppShell mobileNav={<MobileNav />}>
          <AppContent config={config} />
        </AppShell>
      </NotificationProvider>
    );
  }
  // (sobre <StrictMode>: vegeu P0. Sota Preact és un Fragment.)

─── NotesDataContext.jsx · prop de :29 ──────────────────────────────────
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; });

─── :119 · deps de l'efecte de càrrega ──────────────────────────────────
  // `scopeKey` (:27) ja destil·la de config tot el que decidix una
  // recàrrega: backendId, actorKey i tenantId. És una STRING: es compara
  // per valor i l'estabilitat ix de franc. El patró ja era vostre.
  }, [scopeKey, tick, generacio]);

─── :59 · dins del cos del fetch ────────────────────────────────────────
  loadNotes(userId, { ...configRef.current, signal: controller.signal }),

─── :131-187 · updateNote, creaNota i el useMemo del value ──────────────
  // apiUpdateNote(..., config)  →  apiUpdateNote(..., configRef.current)
  // apiCreateNote(nota, config) →  apiCreateNote(nota, configRef.current)
  }, [data, actorKey, scopeKey]);      // ← fora `config`
  // Si no lleves `config` d'ACÍ també, el value continua canviant
  // d'identitat a cada render del host i no has guanyat res.
```

> **Matís que has de decidir conscientment:** llegir `configRef.current` dins d'una crida asíncrona usa el config **més recent**, no el del render que la va iniciar. Per a un config que només porta `backendId`/`tenantId` això és el que vols. Si algun dia hi entra alguna cosa que haja de quedar congelada per operació, cal capturar-la explícitament a l'inici de la funció.

### F5 · `AppGridShell` — més simple del que vaig dir ahir (pas 6)

He comprovat **tots** els consumidors del context. N'hi ha exactament dos:

```
UniversalWorkspace.jsx:126 → { mida, setPanellObert, tancaPanells }
UniversalWorkspace.jsx:257 → { mida, tancaPanells }
```

**Ningú usa `columnWidths`. Ningú usa `applyPreset`.** Són càrrega morta dins del `value`. Ahir vaig proposar partir el context en dos; **retire eixa proposta**: no cal.

```text
─── substituir :164-174 ─────────────────────────────────────────────────
  // `columnWidths` ja viatja per variables CSS (:106-118). Publicar-lo
  // TAMBÉ pel context anul·lava eixa optimització: era la causa que cada
  // mostra de pointermove re-renderitzara les dues columnes.
  // `applyPreset` no el crida ningú (vegeu avall).
  //
  // Amb el value reduït al que es consumeix de veritat, un arrossegament
  // de columna ja NO canvia el context. L'allau desapareix sencera,
  // sense partir res.

  const tancaPanells = useCallback(() => setPanellObert(null), []);

  const valorGraella = useMemo(
    () => ({ mida, panellObert, setPanellObert, tancaPanells }),
    [mida, panellObert, tancaPanells]
  );

  <AppGridContext.Provider value={valorGraella}>
```

> **Troballa lateral:** `PRESETS` (`:13-17`, amb `compacta`/`defecte`/`ampla`) i `applyPreset` (`:142-147`) no els invoca res en tot `src/`. És una funcionalitat sense cap punt d'entrada. **No la lleves en aquesta onada** —potser és feina a mig fer i no ho sé—, però mereix una decisió pròpia: o es cabla a la UI o es lleva. Mentrestant és brossa segons la vostra pròpia política.

---

## §5 · Refutacions — el que he comprovat i **no** és cert

| Sospita | Veredicte |
| --- | --- |
| La doctrina derogada del mirall ha eixit cap al Consell extern | **Fals.** `crear_bundle.mjs:203` l'exclou; 0 de 599 fitxers al manifest del bundle d'ahir. |
| Executar `sincronitzar_skills.mjs` neteja els orfes | **Fals.** Només escriu (`:41,:57`); cap `unlink`. |
| `matrix.mjs` ix verd amb errors (porta inerta) | **Fals.** `exit 2` correcte. La porta és honesta; mirava un forat. |
| Cal partir el context d'`AppGridShell` en dos | **Fals.** Només 2 consumidors i cap usa `columnWidths`. Amb un `useMemo` n'hi ha prou. |
| `resizeColumn` no persistix les amplades en arrossegar | **Fals sota Preact** (`preact/hooks/src/index.js:193-196`, reducer síncron). Trencaria amb React real. |
| L'Opció B (JSON) protegeix la taula de futures purgues | **Fals.** Un JSON s'esborra igual. El que protegix és el descobriment declaratiu. |

---

## §6 · Incògnites

- **Perfilat real en un iPad A10.** Ni Codex ni jo l'hem fet. Sabem la **freqüència** (`DocumentEditor.jsx:17`, a cada input) però no el **cost**. Els passos 5-9 estan justificats per contracte, no per mesura; els que Codex va vetar continuen vetats fins que n'hi haja.
- **Volum real de notes per usuari.** La cascada és O(notes × longitud). `src/data/supabase/notes.js:19-29` posa un límit dur de 50 (ho va trobar Codex), cosa que acota el mal — però 50 notes llargues en un A10 és un escenari que ningú ha provat.
- **`AGENTS.md` a l'arrel.** `porta:reflex` el reclama i no existix. No he investigat si és un moviment no propagat o una absència real.
- **`src/data/supabaseBackend.js`.** `porta:consell` el reclama i no és al disc. Fora de l'abast d'aquesta onada, però està en roig.
- **Rendiment relatiu Preact vs React en aquesta app.** Sense mesura. Vegeu el [SUPÒSIT] de P0.

---

## §7 · Bateria de veritat

- [x] **He explorat el codi real.** Tot ve d'aquest arbre a HEAD `b398115f`. He executat `matrix.mjs`, `tractor-cens.mjs` i cinc portes, i he llegit el codi font de Preact per a no afirmar de memòria.
- [x] **He pres partit clar a les quatre.** P1: **A**, amb el descobriment arreglat. P2: **conservar sense autoritat**, amb sincronia destructiva obligatòria. P3: **canviar l'eix** a «quan» vs «què»; les dues manen de coses distintes. P0: **publicar Preact, validar amb React.**
- [x] **Conjectures marcades.** Un [SUPÒSIT] explícit a P0 i cinc incògnites a §5-6. Sis sospites refutades en compte d'inflar la llista, tres d'elles meues d'ahir.
- [x] **Cap escriptura executable.** No he cridat cap eina d'edició. Tot va en blocs de text pla.

---

**En una frase:** les quatre decisions tenen resposta i cap és la que estava plantejada —el debat A-vs-B era el debat equivocat, el mirall no es netejarà sol encara que executes la sincronia, l'índex autoritza ignorar la llei que volia imposar, i Preact no és una trampa mentre algú la comprove—; i del pla de 9 passos, **dos** (`NotesContext.jsx:246` i `AppGridShell.jsx:165`) valen més que els altres set junts.
