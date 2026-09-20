Codex: **260920_0007_auditoria_codex.md — Estratègia de refactorització**

La recomanació és **aprovar el pla amb correccions**, especialment en la gestió de configuració, la conservació de referències de Notes i la migració del motor. Les quatre decisions arquitectòniques queden resoltes; no cal tornar-les al Mestre com a preguntes obertes.

He contrastat el [pla provisional](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_0007_pla_implementacio_provisional.md:1>) amb l’[auditoria de Claude](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260919_2359_auditoria_claude.md:318>) i el codi local. Aquest informe es lliura exclusivament en el xat: **no he creat ni modificat fitxers, ni he utilitzat web o navegador**.

**1. Decisions recomanades**

| Qüestió | Decisió |
|---|---|
| P1 · `PROTOCOLLEDGE` | **Opció B:** registre JSON únic, validat i compartit pels scripts. |
| P2 · Mirall de skills | **Retirar les còpies integrals** i substituir-les per un índex d’enllaços a la font canònica. |
| P3 · Autoritat | **Skills per als procediments operatius; protocols tècnics per a consulta.** Els esquemes determinen els contractes de dades. |
| P0 · Motor | **React estàndard com a motor canònic**, amb migració conjunta de l’aplicació i les proves. |

**P1 — El registre ha de ser una dada, amb un únic resolutor.**

Actualment hi ha tres mecanismes descoordinats: Matrix extrau una taula Markdown d’una skill retirada; el classificador manté una altra taula; Reflex interpreta el resultat com un nom de plantilla dins d’un directori fix. Canviar només la ruta de Matrix deixaria les altres inconsistències. [Matrix:138](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:138>), [classificador:4](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/classificador_tasques.mjs:4>), [Reflex:58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/reflex_plantilles.mjs:58>).

La proposta és que els tres consumisquen `.agents/protocolledge.json` mitjançant el mateix resolutor. El registre ha de distingir intenció, fonts disponibles, procediment, plantilla i lectures de referència. Una coincidència de paraules no ha de concedir permisos ni imposar un bundle a una auditoria local.

Aquest és un **fragment proposat**, no la reconstrucció completa del registre:

```json
{
  "schema": "sdp.protocolledge.v1",
  "onUnknown": "unresolved",
  "routes": [
    {
      "id": "prompt.local",
      "when": {
        "intent": "prepare_prompt",
        "sources": "local"
      },
      "skill": ".agents/skills/skill-documentacio-i-reflex/SKILL.md",
      "template": "_wiki_de_poble/02_saber/07_plantilles/01_PLANTILLA_PROMPT_INTERN.md"
    }
  ]
}
```

La migració ha de validar identificadors únics, selectors sense ambigüitat i existència de totes les rutes. Les skills explicaran el procediment i citaran el registre, sense reproduir-ne una segona taula.

També cal conservar el contracte de `matrix.rebut` i incorporar-hi una empremta del registre: les portes consumeixen aquest rebut, de manera que un canvi d’encaminament ha d’invalidar una decisió anterior. [Matrix:249](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:249>), [verify:247](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:247>).

**P2 — Retirar la duplicació normativa, preservant l’accés humà.**

El mirall existeix explícitament per facilitar la lectura des d’Obsidian. Això justifica una entrada visible al coneixement, però no exigeix duplicar íntegrament les regles. Recomane generar un índex amb nom, descripció i enllaç a cada skill original. [README del mirall:17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/02_saber/skills_mirror/00_README_MIRROR.md:17>).

**No recomane esborrar només la carpeta.** El tancament torna a executar el sincronitzador; aquest escriu còpies de les skills existents però no elimina els orfes. Per tant, tant l’eliminació aïllada com una nova sincronització serien insuficients. [tancament:18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>), [sincronitzar_skills:24](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:24>).

La mateixa intervenció ha de:

- Substituir la generació de còpies per la de l’índex.
- Migrar els enllaços existents i revisar qualsevol contingut exclusiu abans de retirar-lo.
- Excloure les còpies derogades dels corpus i reconstruir els índexs generats.
- Comprovar que l’índex permet obrir la font des de l’entorn humà.

L’últim punt queda **pendent de verificació en Obsidian**; no he assumit que els enllaços a carpetes ocultes funcionen. La política de recuperació també necessita unificar-se: l’indexador RAG exclou `.agents`, però no el mirall. [build_rag_index:16](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/build_rag_index.mjs:16>).

**P3 — Una lectura obligatòria pot continuar sent consultiva.**

La separació adequada és:

- L’encàrrec vigent fixa l’abast i els permisos.
- Les skills descriuen procediments compatibles amb eixe encàrrec.
- El registre selecciona procediments i documents.
- Els esquemes defineixen dades vàlides; els scripts les comproven.
- Els protocols tècnics aporten explicacions i criteris.

Aquesta distinció desenvolupa l’autoritat que ja declara l’[índex de skills:14](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md:14>). El problema és tractar una referència com si fora una plantilla executable.

Per exemple, `auditoria_canonica.md` pot figurar com a `reference`, però cal reconciliar-ne les metadades antigues abans de convertir-lo en lectura obligatòria. [auditoria_canonica:10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:10>), [esquema:13](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:13>).

**P0 — React estàndard, per coherència semàntica i manteniment.**

El codi obert no exigeix React, i **no tenim mesures que demostren que React serà més ràpid**. La decisió respon a la voluntat expressada d’evitar dependències de comportaments particulars de compatibilitat.

Les dues configuracions de compilació utilitzen Preact. En la versió instal·lada, `StrictMode` és `Fragment`; a més, el càlcul síncron de l’updater explica per què funciona hui la variable lateral `nextStateToSave`. Aquest patró no és un contracte portable a React: tampoc seria precís afirmar que falla sempre amb React, perquè pot haver-hi càlcul anticipat d’estat. [Vite:19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.config.js:19>), [Vite standalone:19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.standalone.config.js:19>), [StrictMode instal·lat:190](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/preact/compat/src/index.js:190>), [updater de Preact:190](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/preact/hooks/src/index.js:190>), [resizeColumn:123](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:123>).

L’ordre serà: fer purs els updaters, migrar les dues builds i el sistema de proves, conservar `StrictMode` amb React i després retirar Preact. Les proves actuals importen explícitament eines de Preact; llevar només els àlies no completa la migració. [App.test:2](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.test.jsx:2>).

**2. Correccions necessàries a les conclusions anteriors**

Hi ha quatre matisos que han de quedar fixats abans de tocar codi:

- **Renders innecessaris no equivalen a fuites de memòria.** El pla utilitza aquesta expressió, però el problema verificat ací és treball repetit i propagació d’actualitzacions. No hi ha un perfil de memòria que acredite la fuita. [Pla:5](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_0007_pla_implementacio_provisional.md:5>).
- **`JSON.stringify(config)` no és l’única estabilització existent.** El Web Component ja compara els camps superficialment i conserva l’objecte quan no canvien. Això no cobreix necessàriament qualsevol altra entrada directa a `App`, però refuta la idea d’una única barrera. [App:472](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:472>), [PedraSecaEmbed:415](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:415>).
- **La memòria cau de Notes ja reutilitza notes no modificades.** El cost no és necessàriament tornar a analitzar tots els continguts. Tanmateix, `NotesSection` recrea els elements i `WorkspaceContext` els torna a clonar, perdent aquella estabilitat. [NotesContext:140](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:140>), [NotesSection:64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:64>), [WorkspaceContext:47](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/WorkspaceContext.jsx:47>).
- **No hem demostrat un bucle infinit del `ResizeObserver`.** Hi ha desconnexió i una comprovació de canvi de mida. Sí que falta provocar una nova mesura quan canvia el col·lapse de les columnes. [AppGridShell:67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:67>), [AppGridShell:87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:87>).

**3. Pla de cirurgia compartit**

| Pas | Intervenció | Condició per donar-la per acabada |
|---|---|---|
| 1 | Registre, resolutor i autoritat normativa únics. | Matrix, classificador i Reflex resolen el mateix encàrrec igual; les rutes inexistents fallen explícitament. |
| 2 | Actualitzar skills, manifest i índexs; retirar el mirall integral. | Cap referència operativa a les skills retirades ni còpia derogada recuperable. |
| 3 | Corregir updaters impurs, dependències i aïllament dels esborranys. | Cap escriptura persistent dins d’un updater; canvi d’usuari o tenant sense contaminació. |
| 4 | Separar configuració visual, configuració de dades i identitat de l’origen. | Canvis visuals sense recàrregues; canvis de dades amb invalidació correcta. |
| 5 | Preservar referències de Notes fins al model normalitzat. | Una nota intacta conserva el seu objecte en cada transformació. |
| 6 | Separar estat i accions de la graella; limitar el treball del gest. | Les amplàries no invaliden consumidors aliens; el valor final es conserva. |
| 7 | Estabilitzar props i reduir subscripcions àmplies del workspace. | Les files intactes no renderitzen per callbacks o objectes recreats. |
| 8 | Migrar aplicació, dues builds i proves a React. | Un únic motor efectiu i proves funcionals sota `StrictMode`. |
| 9 | Mesurar i validar en producció. | Comparació reproduïble de peticions, resposta, memòria i càrrega inicial. |

Aquest ordre incorpora els nou passos de Claude, però situa la **correctesa abans de l’optimització** i afegeix la propagació que travessa Notes i Workspace.

**4. Fragments teòrics per a la implementació**

Els fragments següents són propostes noves. Expressen les peces que cal integrar; no constitueixen un pedaç complet ni s’han executat contra l’aplicació.

**Configuració: rebutge una `configRef` que oculte canvis necessaris.**

El `scopeKey` actual conté backend, actor i tenant; no conté l’URL. L’efecte, en canvi, depén també de `config`. Substituir-ho per una ref i deixar únicament `scopeKey` eliminaria invalidacions necessàries. [NotesDataContext:27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:27>), [NotesDataContext:119](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:119>).

Per al contracte Supabase llegit, la configuració estable pot construir-se explícitament:

```jsx
function useSupabaseDataConfig(config = {}) {
  const supabaseUrl = config.supabaseUrl || '';
  const supabaseAnonKey = config.supabaseAnonKey || '';
  const tenantId = config.tenantId || null;
  const dataMode = ['remote', 'seed', 'local'].includes(config.dataMode)
    ? config.dataMode
    : 'remote';

  return useMemo(
    () => Object.freeze({
      supabaseUrl,
      supabaseAnonKey,
      tenantId,
      dataMode,
    }),
    [supabaseUrl, supabaseAnonKey, tenantId, dataMode],
  );
}
```

Aquests són els camps consumits pel resolutor Supabase actual. [runtime:25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:25>).

Dins de l’efecte de càrrega, la configuració s’ha de capturar **abans del primer `await`** i mantindre’s durant tota l’operació. Les dependències continuaran incloent:

```jsx
[scopeKey, dataConfig, tick, generacio]
```

Cal conservar la cancel·lació, la generació de càrrega i la reconciliació de revisions i esborranys existents. [NotesDataContext:33](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:33>), [NotesDataContext:63](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:63>).

**Límit explícit:** no aplicaria aquesta projecció a Sollutia sense definir el seu contracte. El port transmet els arguments al connector sense restringir-ne els camps. Fins que el connector declare les seues dependències, ha de rebre la configuració completa estabilitzada. [backendPort:51](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:51>).

La identitat de l’origen haurà d’incloure un identificador estable del connector i de la font, a més d’actor i tenant. Canviar eixa identitat exigeix migrar conscientment les claus d’esborranys; no s’ha de fer desaparèixer el contingut pendent canviant simplement el nom de la clau.

**Graella: amplàries locals i contextos separats.**

Els consumidors localitzats utilitzen mida i accions, no `columnWidths`. La barra d’eines llig directament el context i permet absència de proveïdor; aquesta compatibilitat s’ha de conservar. [UniversalWorkspace:126](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:126>), [UniversalWorkspace:257](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:257>), [UniversalToolbar:62](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:62>).

```jsx
// Proposta: declaracions al nivell del mòdul.
const GridStateContext = createContext(null);
const GridActionsContext = createContext(null);

// Dins d'AppGridShell:
const tancaPanells = useCallback(() => setPanellObert(null), []);

const gridState = useMemo(
  () => ({ mida, panellObert }),
  [mida, panellObert],
);

const gridActions = useMemo(
  () => ({ setPanellObert, tancaPanells }),
  [setPanellObert, tancaPanells],
);

// columnWidths i applyPreset queden dins d'AppGridShell.
```

La barra d’eines consumiria opcionalment `GridActionsContext`; les columnes consumirien només els contextos que necessiten. No s’ha de substituir el seu accés opcional per un hook que llance una excepció fora de la graella.

Per al col·lapse, la mesura ha de respondre també a aquestes dues props:

```jsx
useLayoutEffect(() => {
  measureRef.current?.();
}, [columnWidths, leftCollapsed, middleCollapsed]);
```

Es conserva la mesura del contenidor real. No propose substituir-la per una consulta de l’amplària de la finestra, que pot diferir de l’espai disponible per al component incrustat.

**Redimensionament: càlcul pur i persistència després del commit.**

El patró proposat separa les amplàries visibles de les que s’han de persistir:

```jsx
function resizeReducer(state, action) {
  const other = action.column === 'left' ? 'middle' : 'left';
  const limits = COLUMN_LIMITS[action.column];
  const available =
    action.containerWidth
    - state.widths[other]
    - RIGHT_COLUMN_MIN
    - RESIZER_WIDTH * 2;

  const max = Math.max(limits.min, Math.min(limits.max, available));
  const width = clamp(action.requestedWidth, limits.min, max);

  const widths = width === state.widths[action.column]
    ? state.widths
    : { ...state.widths, [action.column]: width };

  const saved = action.commit ? widths : state.saved;

  return widths === state.widths && saved === state.saved
    ? state
    : { widths, saved };
}

// Estat inicial proposat: { widths: amplariesInicials, saved: null }.
useEffect(() => {
  if (resizeState.saved !== null) {
    setVal('sdp-grid-widths', resizeState.saved);
  }
}, [resizeState.saved]);
```

El fragment conserva la fórmula actual de límits; **no resol per si sol tot el gest**. La integració ha de complir un contracte concret:

- `pointermove`: conservar l’últim valor i enviar com a màxim una actualització per fotograma.
- `pointerup`: cancel·lar el fotograma pendent i enviar l’últim valor amb `commit: true`.
- Teclat i presets: confirmar explícitament el seu resultat.
- Cancel·lació, pèrdua de captura i desmuntatge: netejar el treball pendent i definir la conservació de l’última amplària aplicada.

Ara mateix el final del gest només allibera la captura; cal afegir-hi aquesta responsabilitat. [AppGridResizer:48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridResizer.jsx:48>).

**Notes: preservar identitat en totes dues transformacions.**

Aquest nucli pur permet reutilitzar projeccions d’objectes intactes:

```js
function reconcileProjection(previous, sources, project) {
  const reusable = previous?.project === project;
  const byId = new Map();

  const items = sources.map(source => {
    const id = String(source.id);
    const old = reusable ? previous.byId.get(id) : undefined;
    const value = old?.source === source ? old.value : project(source);

    byId.set(id, { source, value });
    return value;
  });

  const unchanged =
    previous?.items.length === items.length &&
    items.every((item, index) => item === previous.items[index]);

  return {
    project,
    byId,
    items: unchanged ? previous.items : items,
  };
}
```

S’ha d’integrar en una capa de selecció que conserve el resultat anterior, tant en l’adaptació de Notes com en la normalització del Workspace. Les funcions de projecció han de ser estables i les fonts immutables.

Això conserva un recorregut **O(N)**, però evita recrear tots els objectes. No promet cost constant ni elimina les actualitzacions legítimes del text cercable o de l’extracte de la nota editada.

La memòria cau de Notes també ha d’invalidar-se per `locale` i `normalizeSearchText`: actualment la comprovació interna només compara nota i overrides, encara que els valors derivats depenen d’aquells dos factors. [NotesContext:145](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:145>).

**Dependències i esborranys: corregir abans de memoitzar més.**

Les dependències completes proposades per a les funcions actuals són:

```jsx
// saveNoteField
[scopeKey, rawNotes, clearLocalNoteFields, updateNoteContext, showToast]

// publishNote
[
  noteFolders,
  sendSectionSubmission,
  saveNoteField,
  externalConfig,
  scopeKey,
  updateNoteContext,
  clearLocalNoteFields,
  showToast,
]

// model de NotesSection, abans de separar-ne les projeccions
[status, error, noteFolders, notes, allCategories, allTags]
```

Els usos corresponents estan en [NotesContext:166](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:166>), [NotesContext:233](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:233>) i [NotesSection:45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:45>). També cal estabilitzar `toggleTheme` amb `systemDark` i retirar-ne la persistència de dins de l’updater. [UIContext:69](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/UIContext.jsx:69>).

En els esborranys, moure l’escriptura a un efecte requereix conservar **scope i dades junts**. Un efecte ingenu podria escriure els overrides anteriors sota una clau nova. A més, el valor de NotesData durant càrrega ha de continuar exposant el scope: ara la branca no preparada no el retorna i NotesProvider disposa d’una clau global alternativa. [NotesDataContext:121](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:121>), [NotesContext:61](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:61>).

**5. Validació abans del vistiplau d’implementació**

No seria rigorós garantir que «no es trencarà res» només amb inspecció. La proposta redueix el risc mitjançant aquestes comprovacions:

- **Normativa:** selecció diferenciada d’encàrrec local i extern; rutes inexistents i empats explícits; rebuts invalidats quan canvia el registre; metadades vàlides.
- **Dades:** canvi d’actor, tenant i origen durant càrregues o desats; respostes tardanes; recuperació d’esborranys; conflictes de revisió.
- **Interacció:** edició, composició de text, focus, canvi de nota, arrossegament, teclat, cancel·lació i col·lapse de columnes.
- **Motor:** instal·lació reproduïble, proves React sota `StrictMode` i funcionament de les dues builds, incloses diverses instàncies incrustades.
- **Rendiment:** comparar amb les mateixes dades i dispositius. **[SUPÒSIT pendent de mesura]** La reducció de propagació i treball per gest millorarà la resposta; no hi ha encara una xifra de guany ni evidència tèrmica.

La bateria de veritat d’aquesta auditoria queda complida: codi local contrastat, quatre decisions preses, límits declarats i cap escriptura aplicada. **El vistiplau és per a aquest pla corregit; la implementació i la seua validació corresponen a IAIA MarIA.**
