---
type: informe
status: esborrany
description: Auditoria local de la càrrega de context, els avisos ESLint, UniversalWorkspace i la publicació de skills.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f21f04a0-3f2a-421c-9457-cb7a35a05ff9:440e9996-57a2-4b84-8015-6d0694d98ba0
---
# Auditoria Codex de l’Olivera: context, ESLint, modularitat i espill públic

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f21f04a0-3f2a-421c-9457-cb7a35a05ff9:440e9996-57a2-4b84-8015-6d0694d98ba0 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T13:33:28.532Z |
| Modificació | 2026-09-23T13:33:28.532Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

Lectures efectuades: `AGENTS.md`, `.agents/BOOTSTRAP.md`, `.agents/cervell.json`, primer bloc d’`.agents/ESTAT.md`, genotip, índex mestre, `.agents/protocolledge.json`, plantilla `prompt_local.md` íntegra i plantilla canònica d’auditoria íntegra. He llegit i aplicat `.agents/skills/core-automillora/SKILL.md`: aturar la generació impulsiva de codi, convertir la insistència en una detecció de patró i treballar sobre el pla compartit. També s’han consultat `sdp-workflow`, `wiki-documentacio-i-reflex`, `wiki-busca-skills` i OpenAI Docs.

Tall d’evidència: HEAD `0ffda7a726cb202733ead45c44bbf4347c26321c`, més arbre local brut del 23-09-2026, aproximadament 15:25–15:40 Europe/Madrid. Els canvis previs en ESTAT, ON_ESTIC, segell, plantilla, índex i manifest no són obra d’esta auditoria. No s’ha carregat contingut de l’arxiu històric ni cap `.env`.

Patró detectat: una regla redactada no equival a un mecanisme executat. Cal comprovar entrega de context, integració amb l’amfitrió i resultat del validador per separat. No puc reconstruir el motiu intern dels dos incidents anteriors; sí que puc demostrar els forats actuals.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23: auditoria de les quatre directives del prompt conjunt, amb comprovacions locals i contrast de documentació oficial. Codi d’aplicació i configuració intactes per ordre AFK.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

L’aplicació té modularitat parcial real, però encara no constituïx un sistema de plugins substituïbles sense adaptar consumidors. Les skills executives no arriben al manifest públic. El linter canònic té **0 errors i 121 avisos: 109 `no-unused-vars` i 12 `react-hooks/exhaustive-deps`**. La prevenció de la fallada de context necessita connexió efectiva entre host, carregador i portes; insistir en la redacció del prompt no basta.

### 1. Context i automatització — prioritat alta

**Evidència local i conflicte amb la REGLA 0:**

- La sessió arranca a `Som de Poble`, però la constitució està al subdirectori `socdepoble.org/AGENTS.md`. No era part de les instruccions de projecte injectades en este torn; l’he localitzada i llegida explícitament. És una explicació verificable del risc d’arrencada, no una prova retrospectiva dels incidents.
- `.claude/settings.json` connecta `SessionStart`, `UserPromptSubmit`, `PreToolUse` i `PostToolUse`. `.agents/hooks.json` enumera eines d’Antigravity. No hi ha `.codex/` al repositori inspeccionat; no he auditat la configuració global de l’usuari. L’existència d’estos dos fitxers no demostra cobertura de Codex.
- `tooling/gates/porta-reflex.mjs` normalitza `tool_input.file_path/content` o `toolArgs.TargetFile/CodeContent`. No reconstrueix un patch de Codex. Copiar-ne només la configuració no resol el dialecte.
- `tooling/session/persona_router.mjs --punters` retorna rutes, no el contingut. L’índex reconstruït és igual al desat, però `core-automillora` té `triggers_on: []` i no és core: `encamina("core-automillora automillora zafarrancho", index)` retorna `[]`. A més, `cataleg_skills.mjs --check` la rebutja com a skill no activa o d’identitat divergent. La invocació explícita del Mestre m’ha permés llegir-la; el router no la selecciona.
- `carregaIndex()` només reconstruïx l’índex si falta o no es pot parsejar. Una edició posterior d’una skill pot deixar disparadors desactualitzats sense invalidació.
- `deliverContext()` a `tooling/documental/turns.mjs` retorna la plantilla i desa el rebut amb snapshot. No injecta per si mateixa totes les lectures ni la skill. És una traça d’entrega, no una prova de comprensió.

**Contrast extern:** Codex descobrix instruccions des de l’arrel fins al directori de treball, sense escanejar automàticament tots els descendents: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Les skills carreguen primer nom i descripció; el cos es llig en seleccionar-les: [Build skills](https://learn.chatgpt.com/docs/build-skills). La documentació actual de [Hooks de Codex](https://learn.chatgpt.com/docs/hooks) admet hooks de projecte a `.codex`, `UserPromptSubmit`, `SessionStart` i `PreToolUse`, amb confiança i cobertura pròpies; advertix que no constituïxen una frontera completa d’enforcement. En Claude, [UserPromptSubmit](https://code.claude.com/docs/en/hooks#userpromptsubmit) pot entregar context abans del prompt. Açò justifica adaptadors específics i proves reals per host, no una promesa universal basada en un nom de fitxer.

**Proposta conservadora per al pla:**

1. Obrir el projecte en `socdepoble.org` i comprovar l’arrel efectiva abans de qualsevol operació. Mantindre un únic AGENTS canònic.
2. Un carregador local compartit resol ruta, plantilla, skill i lectures obligatòries; entrega les fonts íntegres seleccionades, versions i hashes. No carregar totes les skills indiscriminadament.
3. Adaptadors d’entrada per a cada host, inclosa reentrada després de compactació. Prova canària que demostre què ha arribat al context; errors visibles si l’entrega falla.
4. Validació prèvia de mutacions en les superfícies cobertes i validació final de diff, rebut i contracte en CI. Si es necessita impedir tota escriptura invàlida, el mutador ha de controlar l’única via d’escriptura; un hook sobre algunes eines no pot garantir-ho.
5. Proves adversarials: plantilla absent/caducada, skill nova, índex desactualitzat, prompt que només referencia un adjunt, cwd pare, patch, shell i compactació. El criteri és bloquejar la mutació invàlida, no acreditar que l’agent ha entés un text.

**n8n:** la meua recomanació és completar primer el mecanisme local existent. [n8n](https://github.com/n8n-io/n8n) aporta orquestració visual, codi i integracions; pot preparar o lliurar context si tots els torns passen per eixe flux. No resol, per si sol, que una sessió local el salte o ignore el contingut. Afegir-lo ara duplicaria infraestructura i continuaria necessitant les mateixes portes. És una inferència arquitectònica, no una prova d’un desplegament n8n. Alternatives descartades: ampliar indefinidament el prompt; traslladar tot el govern a un orquestrador extern abans de provar el contracte local. `requires_human_decision: false` per al diagnòstic; execució pendent del consens AFK.

### 2. ESLint — prioritat alta per al criteri d’acceptació

La comanda canònica és `eslint src tooling scripts tests --max-warnings=0`. Analitza 440 fitxers; 59 tenen avisos. El `lint_results.json` lliurat analitza 491 fitxers, amb **231 errors i 195 avisos** (183 de variables i 12 de hooks). Inclou plugins d’Obsidian de tercers, `bot`, `scratch` i altres fitxers fora de l’abast canònic. No s’ha de fer una escombrada sobre eixe JSON com si fora el resultat de `npm run lint`.

La neteja proposta per a Claude s’ha de separar així:

| Cas | Exemple inspeccionat / localitzat | Tractament |
| --- | --- | --- |
| Imports o declaracions mortes | `DesignSection.jsx`: TextSection, UniversalCard; `EspecimenBoto.jsx`: estat no consumit | Eliminar després de comprovar inicialitzadors i efectes d’importació. |
| Binding de captura no usat | `sessionService.js`, scripts i portes | `catch {}` quan no s’utilitza l’error; conservar cos i propagació. |
| Desestructuració o setters no usats | IdentitatContext, ConnectarSection, ItemDetailSection | Llevar només el binding; conservar la crida/hook si té efectes. |
| Paràmetres contractuals | NotificationContext i callbacks | Revisar cridadors i posicions; no desplaçar arguments usats ni maquillar amb `_`. |
| Codi antic de validació | `prompt_sgq.mjs`, `context_preflight.mjs`, `reflex_document.mjs` | Determinar si és API activa, stub bloquejat o via obsoleta; una variable morta no autoritza a eliminar una garantia. |
| Dependències de hooks | WorkspaceContext, useResolvedAsset i contextos de dades | Revisió funcional separada: actor, cancel·lació i identitat de peticions. |

En particular, `WorkspaceContext.jsx:166` i `useResolvedAsset.js:33` creen claus amb `useMemo(() => ({}), dependències)`. Les dependències canvien deliberadament la identitat de la petició; eliminar-les cegament per satisfer el linter pot reutilitzar un resultat antic. Cal expressar el token de petició amb els valors reals i provar canvi d’actor/ID, cancel·lació i respostes fora d’ordre. No donar per falsa alarma el warning ni canviar-lo a un silenciador.

Hi ha també deute de govern que la neteja no ha d’amagar: `validateSgqPrompt()` retorna sempre `[]`, i `loadCanonicalRegistry()/routeSkills()` del preflight antic són stubs. Això no prova que el validador nou siga eludible; sí que obliga a rastrejar els cridadors abans de retirar eixes APIs. Les funcions bloquejades de `reflex_document.mjs` han de continuar fallant tancades si no hi ha substitut.

No s’ha eliminat cap avís en este torn: el prompt ordena no tocar codi abans de lliurar les auditories i consensuar el pla. Llevar només els 109 de variables deixaria 12 avisos i `npm run lint` continuaria fallant. `requires_human_decision: false` per a la classificació; pendent de consens per executar.

### 3. UniversalWorkspace i «Obsidian Total» — prioritat mitjana

**Sí que hi ha separació útil:** `UniversalWorkspace.jsx` rep model, selecció, callbacks, etiquetes, `renderItem` i `renderDetail`. No importa les seccions Notes, Wiki o Disseny. `WorkspaceContext` i `workspaceState` gestionen selecció i filtratge sense conéixer Supabase. `NotesSection.jsx` adapta les notes i injecta `NotesEditor` en `renderDetail`. L’editor i el Workspace són peces diferents.

**Límits demostrats:**

- Notes, WikiDePoble, DesignSection i PerfilShell importen la implementació concreta. No hi ha, en esta frontera, un registre d’implementacions ni un port versionat per substituir el contenidor sense adaptar els consumidors.
- El nucli importa AppGridShell/AppGridColumn. AppGridShell depén de `config/storage.js` i de la clau global `sdp-grid-widths`.
- La targeta per defecte importa ItemMedia → useResolvedAsset → backendPort i assetResolver. És una dependència indirecta de serveis de l’aplicació, encara que el render de domini siga injectable.
- Depén de classes i tokens `sdp-*`; no es distribuïx ací com un paquet autosuficient amb contracte de CSS.
- `labels` és una bona extensió, però encara hi ha textos fixos de reintent, ordenació i accessibilitat, ordenació amb locale `ca` i defaults en valencià. El nom UniversalWorkspace ha de seguir en anglès; canviar el nom no resol estes dependències.
- NotesEditor usa NotesContext i les operacions pròpies de notes. Substituir el motor de text requerix preservar el contracte de dades/edició; no basta canviar una etiqueta JSX.

**Resposta directa:** Sóc de Poble pot conservar dominis, backend i dades amb un altre Workspace o editor, però hui requerix canvis en els adaptadors i consumidors. Esborrar el Workspace sense substituir imports trenca les seccions. És composició modular React amb acoblament a la infraestructura SDP, no encara un sistema de plugins plenament intercanviables.

**Camí conservador:** definir un WorkspacePort documentat, injectar implementació en un punt de composició, extraure resolució de recursos i persistència de layout a serveis injectables, completar etiquetes/locale i demostrar una segona implementació mínima sobre els mateixos contract tests. Mantindre aspecte i comportament. No propose una reescriptura ni canvis CSS durant la neteja del linter. `requires_human_decision: false` per al diagnòstic; l’abast d’extracció correspon al pla consensuat.

### 4. Espill de skills en la web — prioritat alta

**No es pot confirmar; el mecanisme actual no ho fa.** `_wiki_de_poble/05_skills_ia` no existix a l’arbre viu. Hi ha 17 skills a `.agents/skills/`, la font executiva prevista per AGENTS §1. `PUBLIC_WIKI_DIRS` a `compile-wiki-to-app.mjs` conté exclusivament `01_ser`, `02_saber`, `03_actuar`; també admet documents solts de l’arrel Wiki. El manifest reconstruït conté 68 documents i coincidix amb `src/data/wikiManifest.js`. Cap dels 17 identificadors `nom_SKILL` hi figura.

`WikiDePobleSection.jsx` importa eixe manifest estàtic. `prebuild` el regenera quan s’executa `npm run build`; `npm run build:web` tot sol no executa eixe prebuild. El watcher usa `apply: serve` i la mateixa llista de carpetes: és desenvolupament, no sincronització en producció. No he trobat, en el camí públic inspeccionat, una sincronització de skills amb una taula Supabase. Els noms antics que subsistixen al compilador `_build` o en polítiques del cervell no acrediten publicació en la Wiki web.

Proposta: un espill generat de només lectura des de les skills canòniques, sense crear una segona autoritat editable. Exportar explícitament les skills públiques, ID estable i hash de font; construir i desplegar l’artefacte, i comprovar-ne el hash publicat. Incloure una prova d’alta/edició/baixa i una de contingut privat exclòs. Abans d’ampliar l’àmbit, corregir el filtre: el compilador web actual omet arxivat/quarantena però no aplica `visibility: private`; el RAG sí que ho aplica. No hi ha ara documents `private` en els 68 items calculats, per tant no he demostrat una filtració existent.

La comprovació local demostra absència de l’espill; no acredita quin commit servix hui producció. No s’ha publicat res. `requires_human_decision: true` únicament per definir l’abast públic exacte de les skills si hi ha excepcions; no per fer esta auditoria.

### 5. Rèplica al pla de MarIA i millora de la plantilla

He llegit `260923_1515_pla_implementacio_olivera.md`. Coincidisc en l’eliminació intel·ligent d’orfes i en mantindre UniversalWorkspace en anglès. No done encara conformitat tècnica al pla:

1. La fase atribuïda a Codex (SQL/AppGrid) no és una de les quatre directives del prompt actual. Separar-la com a treball futur per no ampliar abast mentre s’audita.
2. Corregir el recompte i incorporar els 12 avisos de hooks amb proves de concurrència; els 121 no són tots variables.
3. Afegir context entre hosts i espill públic de skills amb criteris reproduïbles.
4. El pla té `type: pla`, `status: in-progress` i `title`, incompatibles amb el schema actual; ha de nàixer de `pla.implementacio` com a `document`, amb seccions i rebut. La porta documental també rebutja el prompt conjunt per falta de `reflex` persistent. El text `sdp:torn_immediat` d’una taula no equival al rebut.
5. El prompt marca «rebut obtingut» i alhora diu «en procés». Eixa casella no ha de validar-se per declaració de l’agent. Cal derivar-la de la porta real.
6. La plantilla declara v2.3.0 però la ruta encara v2.2.0: la porta de plantilles passa, per tant este desajust no queda cobert com esperaria el lector. Sincronitzar la versió i provar el cas.
7. Distingir «auditoria AFK» i «implementació després de consens» amb criteris d’acceptació separats, responsables i evidència del consens. La neteja de codi no pot ser un requisit de tancament d’una fase que prohibix tocar-lo.
8. Retirar la pretensió de llegir totes les skills sempre i definir lectures obligatòries per ruta. Un fitxer apartat a l’arxiu no ha de seguir figurant com a activitat vigent en l’índex.

No hi havia una auditoria nova de Claude en l’escriptori actiu en les dues enumeracions fetes; les referències de l’índex a auditories anteriors no són una nova entrega ni consens. Estes esmenes queden ací per a la pissarra compartida; no he sobreescrit el pla alié.

### Rèplica a la pissarra actualitzada durant el torn

En la lectura final, MarIA ja ha incorporat al pla les quatre troballes de Codex i anotacions atribuïdes a Claude. Això és una actualització concurrent aliena, no una edició meua. He contrastat `context_preflight.mjs`: `loadCanonicalRegistry`, `routeSkills`, `extractDependencies` i `retrieveJIT` retornen estructures buides; `requireFreshCorpusDigest` torna un marcador si falta BOOTSTRAP. No he trobat importacions o crides externes de `preflight` en `tooling`, `tests`, `.claude` i les skills cercades. És infraestructura incompleta sense ús demostrat; no s’ha de presentar com la barrera efectiva del sistema.

Matís a l’anotació «sempre ready: true»: retorna `ready: true` en la via d’èxit però també pot llançar excepcions per fonts obligatòries absents; el problema és que la selecció de skills i recuperació JIT són stubs. Matís als dos routers: el de `tooling/session/` encamina skills i està connectat al hook de Claude; el de `tooling/wiki/lib/` resol personatges des d’una ruta antiga amb fallback. Compartixen nom però no ruta ni API; no hi ha una col·lisió de resolució demostrada. Recomane marcar l’antic com a obsolet o retirar-lo només després de rastrejar-ne usos.

Les anotacions de Claude encara no equivalen a la seua auditoria completa. El pla seguix amb els camps i rebuts invàlids indicats; no done el consens per tancat.

### Inventari reproduïble d’avisos

Resultat fresc del linter canònic. Les línies corresponen al tall indicat; cap suggeriment automàtic s’ha aplicat.

**`scripts/fetch_town_media.mjs`**

- L75 · `no-unused-vars`: '_' is defined but never used.

**`scripts/immunitari/plaquetes.mjs`**

- L57 · `no-unused-vars`: 'e' is defined but never used.
- L66 · `no-unused-vars`: 'e' is defined but never used.
- L309 · `no-unused-vars`: 'memPath' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L310 · `no-unused-vars`: 'indexPath' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L379 · `no-unused-vars`: 'e' is defined but never used.

**`scripts/portes/porta-vigencia.mjs`**

- L219 · `no-unused-vars`: 'nMorts' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L323 · `no-unused-vars`: 'reparats' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`scripts/teixidor-backlinks.mjs`**

- L30 · `no-unused-vars`: 'extractFrontmatter' is defined but never used. Allowed unused vars must match /^React$/u.
- L39 · `no-unused-vars`: 'sourcePath' is defined but never used.
- L74 · `no-unused-vars`: 'e' is defined but never used.
- L147 · `no-unused-vars`: 'e' is defined but never used.

**`src/PedraSecaEmbed.jsx`**

- L44 · `react-hooks/exhaustive-deps`: React Hook React.useMemo has missing dependencies: 'config.routerType' and 'isFirstInstance'. Either include them or remove the dependency array.

**`src/app/contexts/CoreContentContext.jsx`**

- L46 · `react-hooks/exhaustive-deps`: React Hook useEffect has missing dependencies: 'actorId' and 'setGlobalStatus'. Either include them or remove the dependency array.
- L66 · `react-hooks/exhaustive-deps`: React Hook useMemo has a missing dependency: 'setGlobalStatus'. Either include it or remove the dependency array.

**`src/app/contexts/IdentitatContext.jsx`**

- L11 · `no-unused-vars`: 'setMemberships' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/app/contexts/RouterContext.jsx`**

- L124 · `react-hooks/exhaustive-deps`: React Hook useCallback has a missing dependency: 'searchParams'. Either include it or remove the dependency array.

**`src/components/universal/NotificationContext.jsx`**

- L6 · `no-unused-vars`: 'tipus' is defined but never used.
- L6 · `no-unused-vars`: 'durada' is defined but never used.

**`src/components/universal/graph/useForceLayout.js`**

- L153 · `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'onTick'. Either include it or remove the dependency array. If 'onTick' changes too often, find the parent component that defines it and wrap that definition in useCallback.

**`src/components/universal/workspace/WorkspaceContext.jsx`**

- L166 · `react-hooks/exhaustive-deps`: React Hook useMemo has unnecessary dependencies: 'itemsComplete', 'missingId', 'resolutionAttempt', 'resolutionKey', 'resolveItemId', 'selectionIsSynced', 'selectionToken', 'state.pendingItemId', and 'status'. Either exclude them or remove the dependency array.

**`src/data/sessionService.js`**

- L42 · `no-unused-vars`: '_e' is defined but never used.

**`src/data/supabase/auth.js`**

- L141 · `no-unused-vars`: 'config' is assigned a value but never used.

**`src/hooks/useResolvedAsset.js`**

- L33 · `react-hooks/exhaustive-deps`: React Hook useMemo has unnecessary dependencies: 'attempt', 'ref', 'resolver', and 'scopeKey'. Either exclude them or remove the dependency array.

**`src/pages/NotFoundPage.jsx`**

- L8 · `no-unused-vars`: 't' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/admin/AdminSection.jsx`**

- L60 · `no-unused-vars`: 'onBack' is defined but never used.
- L111 · `no-unused-vars`: 'onBack' is defined but never used.

**`src/sections/connectar/ConnectarSection.jsx`**

- L18 · `no-unused-vars`: 'agents' is assigned a value but never used.
- L24 · `no-unused-vars`: 'setIsPrivate' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/detail/ItemDetailSection.jsx`**

- L55 · `no-unused-vars`: 'previous' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L56 · `no-unused-vars`: 'next' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/dispositius/DevicesSection.jsx`**

- L80 · `react-hooks/exhaustive-deps`: The 'activeChatMessages' conditional could make the dependencies of useEffect Hook (at line 158) change on every render. To fix this, wrap the initialization of 'activeChatMessages' in its own useMemo() Hook.
- L140 · `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'appendMessage'. Either include it or remove the dependency array.

**`src/sections/disseny/DesignSection.jsx`**

- L10 · `no-unused-vars`: 'TextSection' is defined but never used. Allowed unused vars must match /^React$/u.
- L12 · `no-unused-vars`: 'UniversalCard' is defined but never used. Allowed unused vars must match /^React$/u.

**`src/sections/disseny/cataleg/detalls/EspecimenBoto.jsx`**

- L7 · `no-unused-vars`: 'visible' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L7 · `no-unused-vars`: 'setVisible' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/disseny/cataleg/detalls/EspecimenInventariGlobal.jsx`**

- L9 · `no-unused-vars`: 'pathname' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/disseny/cataleg/detalls/EspecimenMenu.jsx`**

- L6 · `no-unused-vars`: 'showToast' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/disseny/cataleg/detalls/EspecimenPista.jsx`**

- L6 · `no-unused-vars`: 'showToast' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`src/sections/multimedia/MultimediaContext.jsx`**

- L38 · `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'actorId'. Either include it or remove the dependency array.

**`src/sections/mur/MurContext.jsx`**

- L41 · `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'actorId'. Either include it or remove the dependency array.

**`src/sections/xat/XatContext.jsx`**

- L247 · `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'joId'. Either include it or remove the dependency array.

**`tests/verificador-scc.test.mjs`**

- L17 · `no-unused-vars`: 'error' is defined but never used.
- L30 · `no-unused-vars`: 'error' is defined but never used.

**`tooling/brain/context_documental.mjs`**

- L79 · `no-unused-vars`: 'text' is defined but never used.
- L107 · `no-unused-vars`: 'contingut' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/brain/crear_document.mjs`**

- L12 · `no-unused-vars`: 'author' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L22 · `no-unused-vars`: 'dateStr' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L23 · `no-unused-vars`: 'dateIso' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/brain/somiador.mjs`**

- L65 · `no-unused-vars`: 'segell' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/brain/time-machine.mjs`**

- L49 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/gates/design_guard.mjs`**

- L224 · `no-unused-vars`: '_e' is defined but never used.

**`tooling/gates/legacy/extract-gemini.mjs`**

- L16 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/gates/legacy/extract-perplexity.mjs`**

- L16 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/gates/legacy/tractor-classes-orfes.mjs`**

- L58 · `no-unused-vars`: 'DETALL' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L323 · `no-unused-vars`: 'fulls' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L324 · `no-unused-vars`: 'unresolved' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/gates/tractor-build-previ.mjs`**

- L45 · `no-unused-vars`: 'DESPLEGA' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L62 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/gates/tractor-cadena.mjs`**

- L175 · `no-unused-vars`: 'cosCadena' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L224 · `no-unused-vars`: 'cos' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/gates/tractor-enxufe.mjs`**

- L33 · `no-unused-vars`: 'IMPL' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L110 · `no-unused-vars`: 'err' is defined but never used.

**`tooling/gates/tractor-fitxa-gestor.mjs`**

- L76 · `no-unused-vars`: 'PROPS_FITXA' is assigned a value but never used. Allowed unused vars must match /^React$/u.
- L272 · `no-unused-vars`: 'funcioPerDefecte' is defined but never used. Allowed unused vars must match /^React$/u.
- L294 · `no-unused-vars`: 'arrelAST' is defined but never used.
- L294 · `no-unused-vars`: 'r' is defined but never used.
- L303 · `no-unused-vars`: 'fn' is defined but never used.
- L370 · `no-unused-vars`: 'arrelAST' is defined but never used.
- L370 · `no-unused-vars`: 'r' is defined but never used.
- L378 · `no-unused-vars`: 'llocsDeProjeccio' is defined but never used. Allowed unused vars must match /^React$/u.
- L433 · `no-unused-vars`: 'analitzaProjeccio' is defined but never used. Allowed unused vars must match /^React$/u.

**`tooling/gates/tractor-registre.mjs`**

- L266 · `no-unused-vars`: 'cru' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/scripts/desenterrar.mjs`**

- L215 · `no-unused-vars`: 'diff' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/scripts/migrate-css.mjs`**

- L64 · `no-unused-vars`: 'hasZombie' is assigned a value but never used. Allowed unused vars must match /^React$/u.

**`tooling/verify-bios.mjs`**

- L48 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/wiki/core/autoneteja_audit.mjs`**

- L226 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.
- L308 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/core/safety.mjs`**

- L37 · `no-unused-vars`: 'e' is defined but never used.
- L42 · `no-unused-vars`: 'e2' is defined but never used.

**`tooling/wiki/core/search_cli.mjs`**

- L13 · `no-unused-vars`: 'err' is defined but never used.

**`tooling/wiki/core/trellat_metrics.mjs`**

- L53 · `no-unused-vars`: 'rules' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/generar_genoma_v2.mjs`**

- L36 · `no-unused-vars`: 'SCRIPT_DIR' is assigned a value but never used. Allowed unused vars must match /^_/u.

**`tooling/wiki/lib/context_preflight.mjs`**

- L43 · `no-unused-vars`: 'evidence' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L79 · `no-unused-vars`: 'contract' is defined but never used. Allowed unused args must match /^_/u.
- L79 · `no-unused-vars`: 'registry' is defined but never used. Allowed unused args must match /^_/u.
- L84 · `no-unused-vars`: 'skills' is defined but never used. Allowed unused args must match /^_/u.
- L108 · `no-unused-vars`: 'err' is defined but never used.
- L122 · `no-unused-vars`: 'err' is defined but never used.
- L127 · `no-unused-vars`: 'questions' is defined but never used. Allowed unused args must match /^_/u.
- L127 · `no-unused-vars`: 'indexDigest' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/lib/persona_router.mjs`**

- L11 · `no-unused-vars`: 'e' is defined but never used.

**`tooling/wiki/lib/prompt_sgq.mjs`**

- L33 · `no-unused-vars`: 'sections' is defined but never used. Allowed unused vars must match /^_/u.
- L52 · `no-unused-vars`: 'CANONICAL_HEADINGS' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L67 · `no-unused-vars`: 'template' is defined but never used. Allowed unused args must match /^_/u.
- L89 · `no-unused-vars`: 'editable' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L98 · `no-unused-vars`: 'receiptPattern' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L100 · `no-unused-vars`: 'context' is defined but never used. Allowed unused args must match /^_/u.
- L100 · `no-unused-vars`: 'text' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/neteja_brain.mjs`**

- L150 · `no-unused-vars`: 'buidaQuarantena' is defined but never used. Allowed unused vars must match /^_/u.
- L172 · `no-unused-vars`: 'restaura' is defined but never used. Allowed unused vars must match /^_/u.

**`tooling/wiki/pre-commit.mjs`**

- L38 · `no-unused-vars`: 'err' is defined but never used.
- L55 · `no-unused-vars`: 'e' is defined but never used.
- L71 · `no-unused-vars`: 'e' is defined but never used.
- L74 · `no-unused-vars`: 'e' is defined but never used.
- L123 · `no-unused-vars`: 'err' is defined but never used.
- L131 · `no-unused-vars`: 'err' is defined but never used.

**`tooling/wiki/reflex_document.mjs`**

- L9 · `no-unused-vars`: 'tipus' is defined but never used. Allowed unused args must match /^_/u.
- L9 · `no-unused-vars`: 'documentId' is defined but never used. Allowed unused args must match /^_/u.
- L31 · `no-unused-vars`: 'esborranyPath' is defined but never used. Allowed unused args must match /^_/u.
- L31 · `no-unused-vars`: 'destinacioRelativa' is defined but never used. Allowed unused args must match /^_/u.
- L31 · `no-unused-vars`: 'preimatgeSha256' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/reflex_petorreta.mjs`**

- L40 · `no-unused-vars`: 'SCRIPT_DIR' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L339 · `no-unused-vars`: 'signature' is assigned a value but never used. Allowed unused vars must match /^_/u.
- L962 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.
- L1570 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/sdp-cli.mjs`**

- L111 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.
- L119 · `no-unused-vars`: 'content' is defined but never used. Allowed unused args must match /^_/u.

**`tooling/wiki/teixidora_sinapsis.mjs`**

- L334 · `no-unused-vars`: 'categoriaStr' is assigned a value but never used. Allowed unused vars must match /^_/u.

**`tooling/wiki/tractor-cervell-ia.mjs`**

- L26 · `no-unused-vars`: 'err' is defined but never used.



<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| ESLint, abast de `npm run lint`, sense `--fix` | Exit 1; 440 fitxers, 59 amb avisos; 0 errors, 109 unused + 12 hooks. |
| `vite build --outDir /tmp/sdp-olivera-codex-build-2609231532` | Exit 0; compilació web correcta en 2,46 s, avís de chunks >500 kB. No és el pipeline complet de producció. |
| `vitest run src/components/universal/workspace src/hooks/useResolvedAsset.test.jsx` | Exit 0; 3 fitxers, 12 proves. El segon filtre no correspon a un fitxer existent: no atribuïsc cobertura pròpia a eixe hook. |
| Manifest públic reconstruït en memòria | 68 documents; igual al desat; 0 de les 17 skills canòniques. |
| Router amb índex reconstruït | Índex igual al desat; automillora sense triggers i cap resultat per la invocació provada. |
| `run-portes.mjs --diagnostic` | Exit 1; passen plantilles, autoritat, segell i LEDGER; falla contracte documental del pla i prompt de les 15:15. Només avalua les portes marcades readOnly. |
| `tractor-orfandat.mjs` | Exit 1; reporta 52 enllaços trencats i 4 orfes. És el recompte del tractor, no 52 fitxers absents verificats: també marca rutes `.agents` que sí existixen. |
| `tancament.mjs --check --turn-id …` | Roig: no hi ha pla vinculat/consensuat ni relleu signat al LEDGER, catàleg de skills divergent, Wiki i SCC amb deute. La comprovació final ja no detecta seccions pendents ni falta de relleu a ESTAT; continua detectant el pla compartit sense rebut. El document d’auditoria passa `document.mjs check` amb `valid: true`. |

Registres de diagnòstic locals: `/tmp/sdp-olivera-codex-lint.json`, `/tmp/sdp-olivera-codex-build.log`, `/tmp/sdp-olivera-codex-tests.log`, `/tmp/sdp-olivera-codex-gates.log`, `/tmp/sdp-olivera-codex-orphans.log` i `/tmp/sdp-olivera-codex-closure.log`. L’inventari complet d’avisos queda també incorporat més amunt perquè no depenga de la persistència de `/tmp`.

Incidència de la reproducció: el primer import del compilador amb `node --input-type=module -` va fallar perquè la guarda CLI fa `realpathSync(process.argv[1])` sobre `-`. Repetit amb `node -e`, la lectura en memòria funciona. És una limitació real d’importació des de stdin, no una fallada del recompte. No s’ha modificat el script.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria lliurada per al consens; implementació pendent per l’ordre explícita del prompt «Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat». No s’ha canviat codi, traduït UniversalWorkspace, modificat CSS, executat SQL, fet commit ni desplegat.

No he simulat la presència de Claude o MarIA, ni he atribuït a altres agents un acord que no consta. Tampoc he declarat verdes portes no executades. La compilació i les proves locals no acrediten salut de producció ni identitat visual al navegador.

La confiança dels hooks de Codex i la versió efectiva del runtime necessiten una prova local dedicada en la fase d’implementació. Les garanties d’execució no poden basar-se exclusivament en la documentació oficial ni en la presència dels fitxers.

L’acta Marmota de tancament de jornada queda pendent de consolidar amb les altres auditories. El tancament mecànic d’este torn continua roig i s’ha de presentar així.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260923_1515_pla_implementacio_olivera]]
- [[260923_1515_prompt_conjunt_olivera]]
