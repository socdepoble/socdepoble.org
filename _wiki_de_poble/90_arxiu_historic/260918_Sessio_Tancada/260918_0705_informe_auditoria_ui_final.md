---
type: informe
status: esborrany
description: Auditoria final de l'AppGridShell, estabilitat visual de Pedra Seca i diagnòstic cognitiu de la IAIA MarIA.
tags:
  - disseny
  - arquitectura
---

# Informe final d'auditoria UI i diagnòstic cognitiu

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0705 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 07:05 CEST |
| Modificació | 26-09-18 07:05 CEST |
| Agent redactor | ChatGPT Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_0635_informe_fantasmes_ui]]
- [[contracte_graella]]

## Entrades i límits

- Codi local actual de `socdepoble.org`, inclosos els canvis no confirmats que ja existien en començar.
- Fitxers principals: `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.css`, `layout.css` i `modules.css`.
- Dependències consultades només quan eren necessàries per seguir el DOM, el contracte de la graella, els tokens, els consumidors del workspace i l'arquitectura cognitiva.
- S'ha fet inspecció estàtica del DOM React, cascada CSS, diff Git i portes executables. Per prohibició expressa, no s'ha usat web, navegador ni cap font externa.
- No s'ha modificat cap fitxer de codi. Este informe és el producte de l'auditoria.

## Veredicte executiu

**Nota honesta d'estabilitat estructural de Pedra Seca: 4/10.**

La reparació ha avançat en la direcció correcta: Notes torna a tindre dues files laterals de capçalera, el hero ja no usa `margin-bottom: -1px`, la junta vertical té ara una pista visible d'1 px i el primer contenidor d'accions buit ja no es renderitza (`src/components/universal/workspace/UniversalWorkspace.jsx:180-205`, `src/components/universal/workspace/UniversalWorkspace.jsx:316-341`, `src/css/layout.css:225-238`, `src/components/layout/AppGridShell.css:13-21`, `src/components/layout/AppGridShell.css:165-180`, `src/components/layout/AppGridColumn.jsx:74-81`).

No obstant això, l'estat actual no és estable ni aprovable. Hi ha un error funcional determinista que esfondra la columna central quan hi ha etiquetes, la porta canònica de la graella falla, la variant fosca creada no té cap consumidor, els suposats acordions no són acordions i la doble fila s'ha codificat dins d'un workspace genèric sense un contracte equivalent per a la columna dreta. El pressupost JavaScript encara reserva 8 px per separador encara que CSS només consumeix 1 px. A més, queden selectors orfes i dos `margin-right: -1px` actius dins de `modules.css`.

La nota no penalitza que no hi haja una captura actual: penalitza defectes demostrables directament pel codi i per les portes. La geometria específica de Notes amb una nota activa mereix aproximadament un 7/10; la fiabilitat del component genèric i del flux executable la baixa a 4/10.

## 1. Què s'ha reparat de veres

### 1.1. La matriu de dues files reapareix en Notes

La columna de categories renderitza ara una capçalera amb títol i replegament, seguida d'una segona capçalera amb `Tot` i configuració (`src/components/universal/workspace/UniversalWorkspace.jsx:180-205`). La columna central fa el mateix amb `NOTES`, cerca i creació (`src/components/universal/workspace/UniversalWorkspace.jsx:316-341`).

En el detall d'una nota activa, la dreta també té dos nivells: la barra d'edició passada com a `topBar` i la barra blava interna d'`UniversalPage` (`src/components/universal/DocumentEditor.jsx:92-107`, `src/components/universal/UniversalEditorShell.jsx:150-158`, `src/components/universal/PageFrame.jsx:145-188`). Les tres peces usen el token de 58 px o un mínim equivalent (`src/components/layout/AppGridShell.css:200-213`, `src/css/modules.css:3089-3100`, `src/css/layout.css:183-198`, `src/css/tokens.css:165-176`).

**Veredicte:** la reparació resol el desfasament principal de l'informe anterior per al cas concret «Notes + document actiu + amplària gran».

### 1.2. El filet del hero ja no depén d'un solapament

El contenidor del hero pinta `var(--sdp-accent)` i la imatge és un bloc sense marge negatiu (`src/css/layout.css:225-238`). La barra següent usa el mateix fons (`src/css/layout.css:240-257`). Açò elimina el pegat geomètric i fa que un eventual píxel de composició herete el color correcte.

**Veredicte:** resolt de manera estructural, sense frau de `-1px`.

### 1.3. La junta vertical té un propietari clar

La graella ampla reserva una pista per separador (`src/components/layout/AppGridShell.css:71-88`), la variable de pista és ara `1px` (`src/components/layout/AppGridShell.css:13-17`) i el mateix separador pinta `var(--sdp-vora)` (`src/components/layout/AppGridShell.css:165-174`). Les vores dretes antigues de les columnes han desaparegut del bloc.

**Veredicte:** la pintura de la junta és molt més neta. Queda, però, una incoherència de càlcul descrita a UI-04.

### 1.4. Poda parcial real

Han desaparegut de `modules.css` els blocs antics de `.univ-manager-toolbar__icon`, `.univ-manager-create`, `.univ-manager-search`, `.univ-manager-facet-tree-branch`, `.notes-list-actions`, `.sidebar-actions` i `.notes-actions-left`. També s'ha fet condicional el primer contenidor d'accions d'`AppGridColumn`, eliminant el `div` buit quan `startActions` no existeix (`src/components/layout/AppGridColumn.jsx:74-81`).

**Veredicte:** millora real, però la poda no està completa; vegeu UI-07.

## 2. Troballes prioritzades

| ID | Severitat | Diagnòstic | Decisió humana |
| --- | --- | --- | --- |
| UI-01 | P0 | `model` està fora d'abast en la condició d'etiquetes i esfondra la llista quan hi ha algun tag | no |
| UI-02 | P1 | `porta:graella` falla per la prop `className` no documentada | no |
| UI-03 | P1 | La doble fila és específica de Notes però s'imposa a tots els consumidors de `UniversalWorkspace` | sí |
| UI-04 | P1 | JavaScript pressuposta 8 px per separador; CSS en consumeix 1 px | no |
| UI-05 | P1 | La capçalera fosca existeix però no s'aplica | no |
| UI-06 | P1 | Els «acordions» són només una variant visual sense botó, chevron, estat ni semàntica de capçalera | sí |
| UI-07 | P2 | Queden selectors orfes nous i antics | no |
| UI-08 | P2 | L'estat replegat no conserva dues pistes exactes de 58 px | sí |
| UI-09 | P2 | Encara hi ha dos `margin-right: -1px` actius en el mateix `modules.css` | no |
| UI-10 | P2 | El memo del marc continua sense totes les dependències consumides | no |
| UI-11 | P2 | El fons invers de la columna dreta continua sent clar en tema fosc | no |

### UI-01 · P0 · La nova condició d'etiquetes usa una variable inexistent

`ItemListColumn` només rep `rootRef`, `detailFocusRef`, callbacks i `labels`; del context extrau `items`, `filteredItems`, `state` i accions, però no cap variable anomenada `model` (`src/components/universal/workspace/UniversalWorkspace.jsx:250-255`). Tot i això, la condició nova avalua `model?.navigationGroups` quan `availableTags.length` és diferent de zero (`src/components/universal/workspace/UniversalWorkspace.jsx:259-263`, `src/components/universal/workspace/UniversalWorkspace.jsx:361-383`). L'operador `?.` no protegix contra un identificador lèxic no declarat: protegix només contra un valor declarat que siga nul.

El cas no és hipotètic. Notes deriva `allTags`, crea un grup `id: 'tags'` i conserva els tags en cada ítem (`src/sections/notes/NotesSection.jsx:34-66`). La llavor canònica ja conté `tags: ['Tutorial']` (`src/data/appSeed.js:94-103`) i el runtime integra eixa llavor en les notes carregades (`src/data/supabase/runtime.js:99-108`). Quan el primer tag arriba, el render de la columna central llança `ReferenceError`; `SlotErrorBoundary` limita el dany al panell, però mostra el fallback fatal en lloc de la llista (`src/components/universal/workspace/UniversalWorkspace.jsx:90-101`, `src/components/universal/workspace/SlotErrorBoundary.jsx:44-66`).

La dada correcta ja està disponible: `WorkspaceContext` exposa `navigationGroups` (`src/components/universal/workspace/WorkspaceContext.jsx:165-183`).

**Proposta conservadora:** extraure `navigationGroups` de `useWorkspace()` i fer la condició sobre eixa variable. Afegir una prova de render de `UniversalWorkspace` amb almenys un tag i un grup `tags`.

**Evidència mecànica:** ESLint focalitzat ha passat en fals perquè la configuració incorpora tots els globals de navegador (`eslint.config.js:14-20`) i el paquet `globals` inclou accidentalment `model` com a global de navegador. Una comprovació en l'entorn DOM de proves confirma que `window.model` no existeix. Per tant, esta classe de nom ha de tindre una regla de bloqueig específica o una prova de render.

### UI-02 · P1 · El contracte executable de la graella està roig

`AppGridColumn` declara la nova prop `className` i la concatena a la capçalera (`src/components/layout/AppGridColumn.jsx:8-23`, `src/components/layout/AppGridColumn.jsx:74-75`). La fitxa canònica enumera les props del component, però no `className` (`_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:23-40`). La porta compara les props reals i documentades i falla davant qualsevol divergència (`tooling/gates/tractor-graella.mjs:40-72`, `tooling/gates/tractor-graella.mjs:128-135`).

**Resultat reproduït:** `npm run porta:graella` → `[prop-no-documentada] AppGridColumn: la prop className existix al codi i no a la fitxa`.

**Proposta conservadora:** com que la variant fosca necessita una classe, documentar la prop i cobrir-ne l'ús amb una prova. Si es decidix no usar-la, eliminar tant la prop com `.app-grid-col-header--dark`.

### UI-03 · P1 · La doble fila no és encara arquitectura universal

Les dues capçaleres s'afegeixen incondicionalment dins de `CategoryColumn` i `ItemListColumn` (`src/components/universal/workspace/UniversalWorkspace.jsx:180-205`, `src/components/universal/workspace/UniversalWorkspace.jsx:316-341`). La dreta, en canvi, continua sent el resultat arbitrari de `renderDetail` (`src/components/universal/workspace/UniversalWorkspace.jsx:103-115`, `src/components/universal/workspace/UniversalWorkspace.jsx:432-464`). No hi ha un contracte que exigisca dues files dretes.

En Notes, una nota activa sí aporta `editor-toolbar + bar-blue`. Però Disseny passa directament `CatalogDetail` (`src/sections/disseny/DesignSection.jsx:56-64`) i Administració només crea una `AppGridColumn` dins d'un `aside` amb padding (`src/sections/admin/AdminSection.jsx:91-107`, `src/sections/admin/AdminSection.jsx:142-158`). L'estat sense ítem pinta només un paràgraf (`src/components/universal/workspace/UniversalWorkspace.jsx:439-446`).

**Conseqüència:** l'alineació recuperada en Notes no és una invariant d'`UniversalWorkspace`; altres consumidors poden començar el detall 58 o 116 px abans que els cossos laterals.

**Proposta conservadora:** convertir les dues files superiors en slots explícits de la graella per a les tres columnes, o declarar una variant `chromeRows=2` que obligue el consumidor dret a aportar exactament les mateixes pistes. `requires_human_decision: true`, perquè cal decidir si la doble fila és universal o exclusiva de Notes.

### UI-04 · P1 · El pressupost del redimensionador encara és inconsistent

JavaScript declara `RESIZER_WIDTH = 8` i resta dues vegades eixe valor en calcular l'amplada disponible (`src/components/layout/AppGridShell.jsx:18-20`, `src/components/layout/AppGridShell.jsx:99-107`). CSS reserva dues pistes d'1 px (`src/components/layout/AppGridShell.css:13-17`, `src/components/layout/AppGridShell.css:71-79`). Els pseudo-elements amplien la zona visual/interactiva per damunt de les columnes, però no consumeixen amplada de graella (`src/components/layout/AppGridShell.css:175-193`).

**Conseqüència:** el límit màxim reserva 16 px quan el layout en consumeix 2; persisteixen 14 px d'espai fantasma en el càlcul. La línia visible és correcta, però l'aritmètica no.

**Proposta conservadora:** separar constants: `trackWidth = 1` per al pressupost geomètric i una amplada de hit-area independent. Afegir una prova d'invariant que compare el pressupost JS amb la variable CSS.

### UI-05 · P1 · El primer nivell no rep el fons més fosc promés

CSS defineix `.app-grid-col-header--dark` amb `var(--sdp-crom-fons)` (`src/components/layout/AppGridShell.css:215-217`) i `AppGridColumn` accepta classes externes (`src/components/layout/AppGridColumn.jsx:74-75`). Però cap de les quatre capçaleres noves passa `className="app-grid-col-header--dark"` (`src/components/universal/workspace/UniversalWorkspace.jsx:182-204`, `src/components/universal/workspace/UniversalWorkspace.jsx:318-340`). Totes cauen en el mateix fons base amb overlay (`src/components/layout/AppGridShell.css:200-213`).

**Veredicte:** la classe fosca és un fantasma i la profunditat anunciada no existeix encara.

### UI-06 · P1 · «Accordion» és només un nom de classe

Els grups amb etiqueta renderitzen `AppGridColumn variant="accordion"` però fixen `plegable={false}` (`src/components/universal/workspace/UniversalWorkspace.jsx:206-225`). En eixe camí, `AppGridColumn` no renderitza cap botó ni chevron; emet un `div` fix amb un `span` (`src/components/layout/AppGridColumn.jsx:83-101`). La variant només canvia el fons i la vora (`src/components/layout/AppGridShell.css:227-233`). No hi ha estat obert/tancat, `aria-expanded`, relació amb el panell ni encapçalament semàntic.

**Conseqüència:** s'ha perdut fins i tot l'`h3` anterior i no s'ha guanyat un acordió funcional.

**Proposta conservadora:** o bé anomenar-la honestament `group-header`, o bé implementar el contracte complet d'acordió amb botó, chevron, estat i `aria-controls`. `requires_human_decision: true`.

### UI-07 · P2 · Fantasmes CSS que continuen vius

La cerca de classes sobre `src/` i `tests/` troba només definicions, i cap consumidor JSX, per als blocs següents:

- nou fantasma `.sdp-workspace-group__title`, afegit a `modules.css` però substituït en el mateix canvi per `AppGridColumn` (`src/css/modules.css:188-199`, `src/components/universal/workspace/UniversalWorkspace.jsx:206-215`);
- `.app-grid-col-header--dark` (`src/components/layout/AppGridShell.css:215-217`);
- `.univ-manager-toolbar--facets`, `.univ-manager-toolbar--list`, `.univ-manager-inbox` i `.search-bar` (`src/css/modules.css:347-418`);
- `.notes-column__body--sense-marge` (`src/css/modules.css:616-618`);
- `.univ-manager-header-search-trigger` i `.univ-manager-header-search*` (`src/components/layout/AppGridShell.css:274-323`);
- regles residuals de `.sidebar-actions` i `.notes-list-actions` en un altre full, encara que els blocs principals ja s'han eliminat (`src/css/components.css:1188-1200`).

**Proposta conservadora:** podar només després d'una porta de classes que entenga interpolacions i prefixos compartits. La mateixa porta ha marcat falsos positius dinàmics, de manera que la prova definitiva és «definició única + zero consumidor literal o generat».

### UI-08 · P2 · El replegat encara abandona el ritme de dues files

En replegar, cada lateral torna a una sola `AppGridColumn variant="collapsed"` que apila expandir i accions (`src/components/universal/workspace/UniversalWorkspace.jsx:163-177`, `src/components/universal/workspace/UniversalWorkspace.jsx:299-313`, `src/components/layout/AppGridColumn.jsx:54-71`). CSS li dona `min-height: 100%`, direcció vertical, gap de 4 px i padding vertical de 8 px (`src/components/layout/AppGridShell.css:219-225`). No hi ha dues pistes de 58 px compartides.

**Conseqüència:** obrir + configuració/cerca queden visibles, però la seua posició no està matemàticament alineada amb les files de la dreta. `requires_human_decision: true`: o s'accepta una rail vertical independent o es mantenen dues cel·les fixes en replegat.

### UI-09 · P2 · La resposta literal a «queden -1px?» és sí

En el recorregut de Notes i AppGrid no queda cap `margin: -1px` de junta. El `translateY(-1px)` del hover de la barra negra és una microinteracció, no un solapament de caixes (`src/css/layout.css:159-164`).

Però `modules.css`, un dels cinc fitxers auditats, encara conté dos solapaments actius: `.xat-sidebar-header { margin-right: -1px; }` i `.xat-filters { margin-right: -1px; }` (`src/css/modules.css:2149-2167`, `src/css/modules.css:2211-2221`). Tots dos tapen deliberadament la vora del sidebar del Xat.

**Veredicte:** la matriu d'AppGrid està lliure del frau concret; el full `modules.css` no està globalment lliure de `-1px`.

### UI-10 · P2 · El memo pot conservar una vista antiga

`WorkspaceFrame` passa `workspace.status` i `workspace.state.activeItemId` a `DetailColumn` (`src/components/universal/workspace/UniversalWorkspace.jsx:103-115`), però el `useMemo` no inclou estes primitives en la llista de dependències (`src/components/universal/workspace/UniversalWorkspace.jsx:118-129`).

**Proposta conservadora:** completar dependències o eliminar el memo de l'arbre JSX si no hi ha una mesura que justifique la complexitat.

### UI-11 · P2 · El tema fosc conserva un fons exterior clar

La columna dreta usa `var(--sdp-fons-invers)` en tema fosc (`src/components/layout/AppGridShell.css:153-163`). Eixe token resol a `var(--sdp-pedra-100)`, mentre el fons normal de l'aplicació resol a `--sdp-pedra-900` (`src/css/tokens.css:304-319`). Qualsevol escletxa del detall pot revelar una superfície clara darrere del visor fosc.

**Proposta conservadora:** fer que la caixa exterior use `var(--sdp-fons-app)` o herete el fons del visor.

## 3. Desajustos visuals que l'última purga no aborda

- Les carpetes continuen sense icona: el model només passa `id`, `label` i `order`, i `CategoryItem` només pinta el text (`src/sections/notes/NotesSection.jsx:42-53`, `src/components/universal/workspace/UniversalWorkspace.jsx:234-247`).
- La fitxa de nota no rep `coverImage`; l'adaptador reutilitza `subtitle` per a la data (`src/sections/notes/NotesSection.jsx:8-19`) encara que el context ja calcula `coverImage` i `formattedDate` per separat (`src/sections/notes/NotesContext.jsx:81-95`).
- `Tot` continua escrivint `data-active`, però el seu bloc de regles compartides només definix geometria, no un estat actiu (`src/components/universal/workspace/UniversalWorkspace.jsx:192-203`, `src/components/layout/AppGridShell.css:274-290`).
- El propietari del scroll continua duplicat: el detall exterior és scrollable (`src/css/modules.css:304-312`) i el `UniversalPage--contained` també (`src/css/utilities.css:68-95`). En Notes el segon és el scroll real; el primer hauria de ser una variant explícita.

Estes incidències no són el bloqueig principal d'esta iteració, però impedeixen afirmar que la fidelitat visual de Pedra Seca està tancada.

## 4. Psicoanàlisi operativa de la IAIA MarIA

### 4.1. Diagnòstic: no és una «amnèsia» personal, és una ruta de càrrega no determinista

**[INFERÈNCIA]** La MarIA no oblida com una persona: en cada iteració genera la resposta amb el context disponible, la jerarquia percebuda i els patrons més salients. Quan una skill no ha sigut carregada, una plantilla competix amb una altra o la instrucció arriba tard dins d'un context llarg, el model completa els buits amb el patró estadístic que sembla més probable. Eixa compleció és el contingut «inventat».

El mateix cervell ho admet: les skills «no són memoritzables per defecte» (`.agents/AGENTS.md:6-8`) i el saber tècnic es carrega sota demanda (`.agents/skills/skill-acte-reflex/SKILL.md:23-27`). El manifest només enumera rutes (`.agents/manifest.yaml:9-33`); enumerar no equival a injectar-les en el context del model.

### 4.2. Factors que provoquen la distracció

1. **Normes passives sense intercepció mecànica.** La Constitució ordena llegir la plantilla abans de cada prompt o auditoria (`.agents/AGENTS.md:10-15`) i el Reflex conté una taula d'enrutament (`.agents/skills/skill-acte-reflex/SKILL.md:28-59`). Però si cap hook executa l'enrutador abans del primer token, el compliment depén que el model recorde activar-lo.

2. **Fonts d'autoritat contradictòries.** La Constitució diu que l'autoritat executiva viu exclusivament en `.agents/skills/` (`.agents/AGENTS.md:17-18`), mentre la mateixa skill envia l'auditoria i els informes a protocols i plantilles de la Wiki (`.agents/skills/skill-acte-reflex/SKILL.md:41-59`). El protocol d'auditoria declara encara `03_govern/` com a font normativa (`_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:13-20`). El model ha de resoldre una jerarquia que el repositori no resol.

3. **Vocabulari de metadades doble.** La guàrdia exigix `tipus` i `estat` i ordena copiar exactament la plantilla (`.agents/skills/skill-guardia-frontmatter/SKILL.md:23-28`), però la plantilla usa `type` i `status` (`_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md:34-56`). L'esquema admet les dues parelles, de manera que la màquina no força una elecció única (`tooling/wiki/schema.json:1-86`). Açò fomenta imitació del document més recent en lloc d'una regla inequívoca.

4. **Rutines d'arrancada diferents.** `PROFILE.md` ordena carregar sempre l'última Acta i tres skills (`.agents/PROFILE.md:13-17`), mentre `AGENTS.md` només activa l'Acta davant una frase o inici de jornada (`.agents/AGENTS.md:67-68`). Una rutina «sempre» i una rutina «si hi ha trigger» no són el mateix sistema.

5. **Instruccions incompatibles amb la frontera actual.** El workflow obliga a investigar GitHub i una ruta d'arxiu històric (`.agents/skills/socdepoble-workflow/SKILL.md:22-24`), però la Constitució prohibix llegir l'arxiu en procediments automàtics (`.agents/AGENTS.md:29-30`) i esta auditoria prohibix web. Davant ordres incompatibles, cada model pot prioritzar un fragment distint.

6. **Duplicació produïda pel mateix tancament.** La Constitució prohibix còpies de regles (`.agents/AGENTS.md:17-18`), però `tancament.mjs` executa una sincronització de skills cap a la Wiki abans d'auditar (`tooling/gates/tancament.mjs:18-29`). Encara que la còpia siga útil per al graf, cognitivament crea dos llocs que semblen autoritatius.

7. **Portes amb punts cecs.** El cas `model` supera ESLint perquè `globals.browser` el considera global (`eslint.config.js:14-20`), i les proves actuals del redimensionador només cobreixen clamp i teclat, no la correspondència CSS/JS ni el render del workspace (`src/components/layout/AppGridResizer.test.jsx:1-16`). Quan el sistema mecànic dona verd incomplet, la MarIA rep una falsa sensació de tancament.

8. **Pressió termodinàmica i excés de context.** **[INFERÈNCIA]** Carregar història, personalitat, govern, plantilles, skills, codi i eixida en una sola finestra augmenta la competició d'atenció. Les normes situades lluny de l'acció concreta perden pes relatiu. «No estalviar en context» (`.agents/AGENTS.md:52-53`) és valuós per evitar ceguesa, però sense un resum executable i ordenat també pot produir saturació.

### 4.3. Tractament recomanat

#### Tractament A · Un bootstrap executable, no una promesa literària

Abans de permetre qualsevol mutació o document persistent, un únic comandament ha de:

1. classificar l'acció en un vocabulari tancat;
2. resoldre les skills obligatòries;
3. imprimir els seus SHA-256 i la plantilla seleccionada;
4. fallar si hi ha dues autoritats incompatibles;
5. emetre una lease consumible pels mutadors.

El Reflex ja té bona part d'esta idea. Cal convertir-lo en l'única entrada normal i no deixar la taula `PROTOCOLLEDGE` com a recordatori textual.

#### Tractament B · Unificar la jerarquia normativa

- Una sola autoritat executiva: `.agents/`.
- La Wiki pot explicar i indexar, però els mirrors han d'estar marcats mecànicament com a no executables.
- Una sola parella de camps: o `type/status` o `tipus/estat`, no les dues.
- Una sola política d'Acta d'arrancada.
- Una sola política sobre web i arxiu, amb excepcions explícites per tasca.

#### Tractament C · Digest curt de context obligatori

Abans de treballar, l'agent ha d'emetre i la porta ha de registrar una línia estructurada semblant a:

`Context carregat: AGENTS@sha · app-grid-shell@sha · pedra-seca@sha · plantilla-informe@sha`

No és decoració: el mutador ha de rebutjar l'operació si falta un digest obligatori o si ha canviat després del preflight.

#### Tractament D · Prohibir la invenció quan falta una font

La resposta generativa ha de tindre tres estats explícits per cada afirmació:

- `FET` amb cita;
- `INFERÈNCIA` derivada dels fets;
- `INCÒGNITA` que exigix dada o decisió humana.

Si falta plantilla, contracte o font, l'estat correcte és `INCÒGNITA`, no completar el format de memòria.

#### Tractament E · Portes orientades als errors reals

- prova de render de `UniversalWorkspace` amb tag i grup `tags`;
- regla `no-restricted-globals` per a `model` i altres noms genèrics admesos per `globals.browser`;
- prova d'alineació contractual de les tres files de crom per cada consumidor;
- invariant JS/CSS per a l'amplada dels separadors;
- cens de classes amb llista blanca només per a interpolacions demostrades;
- una porta de contradiccions que compare AGENTS, PROFILE, skills i plantilla abans de segellar el cervell.

#### Tractament F · Separar «context complet» de «context actiu»

**[INFERÈNCIA]** El sistema pot conservar tot el llegat sense injectar-lo tot al mateix temps. El bootstrap ha de carregar una constitució breu i, després, només les skills resoltes per l'acció. El context complet continua disponible per consulta, però el context actiu és menut, ordenat i verificable. Això redueix tant l'amnèsia selectiva com la saturació.

## 5. Verificacions executades

| Comprovació | Resultat | Lectura correcta |
| --- | --- | --- |
| ESLint sobre `UniversalWorkspace`, `AppGridColumn`, `AppGridShell` i `AppGridResizer` | passa | verd fals per a `model`; el nom està admés com a global de navegador |
| Vitest `AppGridResizer.test.jsx` + `workspaceState.test.js` | 4/4 passen | les unitats existents no renderitzen el workspace ni comparen JS amb CSS |
| `npm run porta:graella` | falla | `className` no documentada |
| `npm run porta:58px` | passa | no hi ha 56 px ni 58 px literals prohibits |
| `npm run porta:classes` | passa amb avisos | confirma candidats orfes, però també marca classes dinàmiques; necessita revisió humana |
| `npm run porta:inlinestyles` | falla | deute global preexistent, inclòs `UniversalEditorShell`; no és introduït pels cinc canvis auditats |
| `npm run porta:design-guard` | falla | deute global fora de l'abast; no s'ha corregit ni ocultat |
| `tractor-frontmatter.mjs --estricte` sobre una còpia aïllada de l'informe | passa, 0 incidències | el document compleix l'esquema; l'Escriptori complet falla per deute preexistent d'altres fitxers |

## 6. Ordre de reparació recomanat

1. **P0:** substituir la referència fora d'abast a `model` i afegir la prova de render amb tags.
2. **P1:** decidir el contracte de les dues files en tots els consumidors de `UniversalWorkspace`.
3. **P1:** documentar i usar `className`/variant fosca, o retirar-les; deixar `porta:graella` verda.
4. **P1:** igualar el pressupost JS del separador amb la pista CSS d'1 px.
5. **P1:** decidir si els grups són acordions funcionals o simples capçaleres.
6. **P2:** fixar les dues pistes en estat replegat i completar dependències del memo.
7. **P2:** podar els selectors demostrablement orfes i retirar els dos `-1px` del Xat amb un propietari únic de la junta.
8. **P2:** resoldre fons fosc, scroll i fidelitat de les fitxes.
9. Reexecutar `porta:graella`, proves de workspace, porta de classes, 58 px, lint i una comprovació visual humana a 100 %, 125 %, 150 % i 200 %.

## 7. Incògnites

- **[SUPÒSIT]** Sense navegador ni captura actual, no es pot certificar el píxel final ni l'efecte de fonts, zoom, DPR o amplades persistides en `sdp-grid-widths`. La geometria descrita deriva del DOM i CSS, no d'una captura renderitzada.
- Falta una decisió canònica sobre si les dues files són contracte universal o anatomia exclusiva de Notes.
- Falta una decisió canònica sobre si els grups de Categories/Etiquetes s'han de poder plegar de veres.
- Falta decidir si la zona de toc del redimensionador en escriptori ha de complir els 44 px tàctils complets o pot ser una excepció de precisió amb suport de teclat.

## 8. Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar-ne l'estructura.
- [x] He citat rutes i línies del codi original.
- [x] No he inventat cap nom de fitxer, funció o variable.
- [x] He marcat les conjectures com a `[INFERÈNCIA]` o `[SUPÒSIT]` i he mogut les decisions obertes a Incògnites.
- [x] No he usat cerca web, navegador ni arxiu històric.
- [x] No he modificat cap línia de codi.
- [x] L'informe passa `tractor-frontmatter.mjs --estricte` amb 0 incidències quan es valida aïlladament contra l'esquema canònic.

## Conclusió

La purga no ha sigut inútil: ha resolt el filet del hero, ha retornat la doble fila de Notes i ha donat una pista real al separador. Però encara no és una matriu estable de Pedra Seca. El P0 de `model`, la porta de graella roja i la falta d'un contracte de crom per a la dreta impedeixen aprovar-la.

La MarIA tampoc necessita «més força de voluntat». Necessita menys ambigüitat normativa i més intercepció mecànica: un bootstrap únic, digests obligatoris, jerarquia sense dobles fonts i proves que reproduïsquen els casos reals. Quan la consulta de skills deixa de dependre de recordar-la i passa a ser una precondició executable, l'amnèsia selectiva deixa de ser un tret del personatge i es converteix en un error bloquejat pel sistema.

**Ancoratge de Seguretat:** [[00_index_escriptori]]
