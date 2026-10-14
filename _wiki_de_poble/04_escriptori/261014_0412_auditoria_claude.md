---
type: informe
status: esborrany
description: Informe d'execució del prompt 261014_0400 (Gestoria, plegat lateral, logo verd i useSession) amb proves, revisió adversarial i navegador.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ef7e4a29-4a4d-4dd1-a3ca-3f2e7165c081:8da004fe-e9f5-4fa9-8c46-981fd82f14e8
---
# Auditoria d'execució del prompt 261014_0400: Full trimestral a pantalla completa, plegat lateral, logo verd i guarda de sessió

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ef7e4a29-4a4d-4dd1-a3ca-3f2e7165c081:8da004fe-e9f5-4fa9-8c46-981fd82f14e8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T02:10:52.223Z |
| Modificació | 2026-10-14T04:10:00Z |
| Propietari | Claude |
| Aprovació humana | Prompt 261014_0400 lliurat pel Mestre al xat de Claude Code el 14-10. Sense commit: el hook local no l'admet des de Claude. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code), amb tres workflows de subagents: Entendre (5), Implementar, Revisar i Corregir (16) i Coherència (4) |
| Tokens consumits | Subagents: uns 6,6 M segons els comptadors dels workflows (1,8 M + 4,0 M + 0,8 M). Bucle principal: no disponible. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-14T02:10:52.223Z: esborrany creat; contingut i verificació pendents.
2026-10-14T02:13:00Z: relleu viu 1. Pas 0 comprovat. Fase d'Entendre en marxa: cinc lectors en paral·lel (fronts A-D i documents de l'Escriptori), sense tocar codi.
2026-10-14T02:35:00Z: relleu viu 2. Diagnòstic dels quatre fronts acabat i decisions de l'orquestradora preses. Implementació en marxa: un agent per front, cada un amb dos revisors adversarials i un corrector.
2026-10-14T03:40:00Z: relleu viu 3. Els quatre fronts estan implementats, revisats i corregits. Hi ha en marxa un workflow menut de coherència del logo del pilot.
2026-10-14T04:10:00Z: entrega FINAL. Suite sencera verda: 17.562 proves, 0 roges.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu

**Els cinc punts executables del prompt estan fets, verificats contra el codi, revisats per dos agents adversarials independents per front i corregits on calia.** La suite sencera ix verda: 1.032 fitxers, **17.562 proves verdes**, 89 omeses i **cap roja** (74 més que les 17.488 de referència, comptant també les de Gemini).

**Pas 0 · El commit ja estava fet.** El HEAD `09d22e64` recull les dues onades. El hook local no admet `git commit` des de Claude. Els canvis d'esta tanda queden a l'arbre, barrejats amb els de MarIA i Gemini 4, i el commit l'ha de fer el Mestre o MarIA.

**El que el Mestre ha de fer abans de provar la Gestoria:** tornar a signar els tractors.

- `gestoria.factures` i `gestoria.correus` ixen «Pendent», amb les empremtes C720-407C i 4EE7-706C, perquè s'ha tocat `PanellGestoria.jsx`.
- Gemini 4 ha tocat `nucli/proveidors.js`, que és font dels sis tractors. Per això cal revisar-los tots. Al servidor de desenvolupament hi ha l'aprovació en bloc.

### Revisió adversarial

En total, 21 troballes dels revisors: 16 corregides, 5 ajornades (per abast o per decisió del Mestre) i **cap refutada**.

- **A:** 5 de 5 corregides. «Tipus» deia «Interior» per eliminació quan faltava l'IVA, i el `% IRPF` d'una rectificativa eixia negatiu. La prova de la factura en dòlars es va separar com a [DEFECTE].
- **B:** 5 corregides i 2 ajornades. La fila 2 del rail plegat s'aplicava a la primera acció, siga quina siga, i feia botar més el Bloc i la llista en «mitja». Ara només s'aplica amb una sola acció (`app-grid-col-header--una-accio`, sense `:has()`). També s'han corregit comentaris que mentien.
- **C:** 3 ajornades. Han motivat el workflow de coherència, que ha corregit 3 troballes més i n'ha ajornat 2.
- **D:** 4 de 4 corregides. Eren comentaris i la Sonda de la prova [DEFECTE], que no comprovava el rol.

### Execució per front

| Front | Què ha canviat | Canvi visual declarat | Proves |
| --- | --- | --- | --- |
| **A · Full trimestral** | Amplària: a `modules.css`, bloc GESTORIA PANELL, `.sdp-gestoria-closca .sdp-gestoria-panell { max-width: none }` i controls més amples, tot amb l'abast de la closca. Taula de revisió del pas 3 (`PanellGestoria.jsx`): les 12 columnes en l'ordre del Mestre, amb «Tipus», «% IVA» i «% IRPF» derivades i de només lectura, i la Quota IRPF sempre visible. `IVA_ESTRANGER` passa a un grup informatiu blau, «Operacions amb l'estranger, informatives», i a la fila hi ha una línia en to de pregunta. Per a les empreses de fora de la UE, el NIF també hi va. | El Full ocupa tota l'amplària (verificat: 1.325 px a 1.680, abans 1.280). La taula del pas 3 té 3 columnes noves i els títols nous. Google Cloud, Anthropic i fal.ai ja no es pinten en ambre amb negreta. Les factures en dòlars continuen en roig. **El pas 4, el CSV i l'XLSX són idèntics**, i la Facturació no canvia. | 10 proves noves a `PanellGestoria.test.jsx` i 2 de CSS a `qualitatPanell.test.js`. La llista UE local es contrasta amb `nucli/nif.js`. Gestoria, tractors i CSS: 4.224 de 4.224 |
| **B · Plegat [\|<]** | Barra principal i BarraApp: les icones plegades queden a l'eix de 16 px (`layout.css`, § TRUC). `AppGridColumn` passa a `PanelLeftOpen`. El plegat del Workspace sobreviu a la remuntada per `workspaceKey` (`UniversalWorkspace.jsx`, amb una ref). Rail d'una acció: la roda i la lupa ocupen la fila 2, sense vora ni coixí (precedent del Xat). S'ha llevat l'`useEffect` redundant de `sidebar-closed` (`App.jsx`). Cap animació nova. | Les icones plegades es mouen 2 px, o 6 px amb barra de scroll clàssica, fins a l'eix de la roda (T24). La cel·la de dalt del Workspace plegat mostra `PanelLeftOpen`. Al Workspace d'una acció, la roda i les carpetes queden a la mateixa y plegades i obertes. Als rails de dues accions, les carpetes pugen 5 px i desapareix el filet. El text de `EspecimenShell.jsx:87`, que ja era fals, s'ha retallat. | `railPlegat.capes.test.js` (nou), `AppGridColumn.test.jsx` (nou), 2 proves [DEFECTE] de remuntada i una regressió a `App.test.jsx`. 78 fitxers i 1.468 proves. Mesures al navegador fetes pels agents |
| **C · Logo verd** | `autoriaNota.js`: el pilot (`esLaIdentitatDAjuda`, per slug o per id de la llavor, mai pel nom ni per uuid) signa amb l'autoria oficial (`AUTORIA_BENVINGUDA`) i amb `RUTA_PERFIL_PROJECTE`. Una regla pura única, `avatarDeLaBarraDeFitxa` i `esFitxaDelPilot` a `fitxaDePerfil.js`, que fan servir «La fitxa», «Les vistes», «El compte» i la fitxa pública. | Actuant com a Sóc de Poble, la barra taronja de l'editor del Bloc i la targeta viva porten el PNG verd, el nom «Sóc de Poble» i «La Torre de les Maçanes». A `/el-meu-perfil` i a la fitxa pública del pilot, només canvia l'avatar. Cap canvi per a cap altra identitat. | Proves noves a `autoriaNota`, `NotesEditor`, `NotaFitxa`, `PerfilEditor.logotip`, `fitxaDePerfil`, `DetallVistes`, `DetallCompte` i `PerfilPublicSection.capcalera`, i dues [DEFECTE]. Perfil, notes i barres: 100 fitxers i 1.246 proves |
| **D · Guarda de sessió** | `useIdentitatDeLaBarra.js` i `BotoCrom` (`PanellCrom.jsx`) passen a `useSessioOpcional` i `useIdentitatOpcional`. La capçalera diu clarament que la guarda és **defensiva**. | Cap amb proveïdors. Sense proveïdor, la barra diu «Entrar» en lloc de llançar. | Proves 1-4 i una [DEFECTE] (5) que reproduïx el HMR amb dues instàncies de `SessionContext.jsx`: roja abans i verda després. `barraSenseProveidors.test.jsx` s'ha afegit a `tests/lint-sessio.test.mjs`. 126 fitxers i 1.692 proves, i lint net |

**Fitxers de Claude en esta tanda.**

- Codi: `src/app/App.jsx`, `src/components/layout/AppGridColumn.jsx`, `src/components/layout/AppGridShell.css`, `src/components/universal/PanellCrom.jsx`, `src/components/universal/identitat/useIdentitatDeLaBarra.js`, `src/components/universal/workspace/UniversalWorkspace.jsx`, `src/css/layout.css`, `src/css/modules.css`, `src/sections/disseny/cataleg/detalls/EspecimenShell.jsx`, `src/sections/gestoria/PanellGestoria.jsx`, `src/sections/notes/autoriaNota.js`, i a `src/sections/profile/`: `fitxaDePerfil.js`, `PerfilEditor.jsx`, `DetallVistes.jsx`, `DetallCompte.jsx` i `PerfilPublicSection.jsx`.
- Proves: les proves corresponents i `tests/lint-sessio.test.mjs`.
- No són de Claude: `.agents/`, `tooling/`, `src/sections/gestoria/nucli/`, `font/` ni `tractors.js`.

### Troballes obertes

Cada troballa porta l'abast, l'evidència, la severitat, la font de veritat amb què xoca i una proposta conservadora.

**CL-01 · P1 · Tractors de la Gestoria en «pendent».** `src/sections/gestoria/tractors.js:28-71`. Al navegador, «Cal aprovar el tractor de factures», amb les empremtes C720-407C i 4EE7-706C. Les canvia `PanellGestoria.jsx` (ordre del Mestre), i Gemini 4 hi suma `nucli/proveidors.js` (els sis). Proposta: que el Mestre els torne a signar amb l'aprovació en bloc de desenvolupament, després de mirar el diff. `requires_human_decision: true`.

**CL-02 · P2 · Les 12 columnes no arriben al fitxer de la gestora.** `nucli/plantilla.js:79-88`, `fullModel.js:50-52, 69-78, 580` i `xlsx.js:185-192`. Ara només són a la pantalla de revisió. Portar-les a l'entregable canvia el que rep la gestora, trenca el lector de l'historial (per exemple, «% IVA» es llegiria com a quota) i unes vint proves daurades. Proposta: decidir-ho amb la gestora; si s'accepta, una plantilla nova amb àlies i un lector que admeta tots dos formats. `requires_human_decision: true`.

**CL-03 · P2 · fal.ai i les empreses de fora de la UE es queden «Pendent».** `nucli/model.js:25, 298-318, 338-342` i `nif.js:68-83`. El validador no coneix cap identificador fiscal de fora de la UE. Ara la pantalla ho explica al grup informatiu, però la incidència del NIF continua al «Revisa:» de la fila. Proposta: decidir si s'admet un identificador estranger. Canvia `model.js`, és a dir els sis tractors, i és zona de Gemini. `requires_human_decision: true`.

**CL-04 · P3 · Límits de la columna «Tipus».** `PanellGestoria.jsx`, `regimDe`.

- Els ingressos sempre diuen «Interior».
- Una empresa estrangera que no és al catàleg ni porta prefix de NIF-IVA diu «Interior». Ho reproduïx la prova [DEFECTE regimDe].
- Amb la Quota IVA buida diu «—», perquè `auditoria.js:432` no emet el país sense IVA.
- «XI» (Irlanda del Nord) compta com a UE perquè és còpia de `nif.js`.

La interpretació de «Tipus» com a règim de l'operació és de l'orquestradora. Proposta: confirmar la interpretació i, si cal, que `auditoria.js` emeta el país encara que falte l'IVA (nucli/). `requires_human_decision: true`.

**CL-05 · P3 · La Quota IRPF no té total al peu.** `nucli/model.js:371-380`: `totals()` no suma la retenció. No s'ha inventat cap càlcul. `requires_human_decision: true`.

**CL-06 · P3 · Plegat: decisions obertes.** Totes són `requires_human_decision: true`.

- Als rails de dues accions (navegació del Bloc i llista en «mitja» o «estret»), la roda o la lupa no cau a la fila 2.
- El filet del rail plegat ha desaparegut.
- BarraApp plegada repetix la icona de l'app i compacta els grups: a El Bar, les entrades pugen fins a 224 px.
- Les apps de ClosaAplicacio i l'Admin no tenen `[|<]` en «ample». Afegir-lo és funcionalitat nova.
- No hi ha persistència entre recàrregues.
- La transició continua seca, sense animació.

**CL-07 · P3 · Logo verd: abast i coherència.** Totes són `requires_human_decision: true`.

- Autoria sencera o només el logo. Al Bloc, la barra porta el nom i el poble oficials, però el payload del Mur porta els de la fila. La prova [DEFECTE] d'`autoriaNota.test.js` ho reproduïx, i això contradiu la invariant de `NotesEditor.jsx:174-175`.
- La barra negra mostra les inicials quan falta `logo_url`.
- La boina de la Gestoria porta el titular persona per ordre del 13-10, front B (`AppGestoria.jsx:19-22`), i això xoca amb el prompt.
- `DetallEspai.jsx:22-27` (`AUTORIA_NODE`) signa «Sóc de Poble» amb la silueta.
- L'enllaç d'«El compte» del pilot porta a `/empresa/:uuid`. Ho reproduïx la prova [DEFECTE] de `DetallCompte.test.jsx`.
- Mentre es carreguen les pertinences, hi ha un flaix transitori.
- `esLaIdentitatDAjuda` no exclou els grups.

**CL-08 · P3 · L'error de `useSession` en desenvolupament no està curat, només contingut a la barra.** La causa és el HMR de Vite amb React Refresh, perquè `SessionContext.jsx` és ascendent de tota l'app pel cicle `sessionService.js:104` → `host.js`. El repositori ja ho documenta a `fronteres.test.js:205-219`. En eixe escenari, el pet passa a `CoreContentProvider`. Opcions:

- (a) Contexts estables amb `import.meta.hot.data`.
- (b) Tallar el cicle, amb una ADR.
- (c) Acceptar-ho com a fallada de desenvolupament i recarregar.

En producció no hi ha HMR. `requires_human_decision: true`.

**CL-09 · P3 · Design Guard roig per deute previ (sense canvis).** `node tooling/gates/design_guard.mjs --arrel=src` ix amb 1 per `focus-invisible` a `.toc-drawer:focus` (`modules.css:2682`), que ja constava com a CR-07 a la 0320. Cap canvi d'esta tanda toca cap `outline`. Els altres indicadors baixen: inline-style de 17 a 4, touch-too-small de 3 a 2 i raw-color de 20 a 17. `requires_human_decision: true`.

### Contradiccions dels documents de l'Escriptori (per a MarIA)

1. **Gemini 0415 i el pla 0425 citen coses que no existixen.** Demanen un `[|<]` a ShellGestoria i citen `Gestoria.css`, `Tauler.css`, `.sdp-gestoria-shell` i `MenuGestoria`. La closca no pinta cap menú per l'ordre de MarIA 261012_2145 (`ShellGestoria.jsx:9-14`), i la seua navegació és BarraApp, que ja plega. També citen línies que cauen fora dels fitxers (`PanellGestoria.jsx:1039`, `concilia.js:549`).
2. **Gemini 0415 proposa canvis fiscals i de privacitat.** Proposa tocar `model.js` (els sis tractors) i el filtre d'`impostos.js:148`, que són càlculs fiscals; amb `TIPUS_OPERACIO_REBUDA` encara eixiria `SENSE_TIPUS_OPERACIO`. També proposa guardar SEPA, NIF i conceptes al Tauler, i posar `?factura=<id>` a la URL. Això xoca amb l'ordre de privacitat del 261004 (`tractorTauler.js:26-36`) i amb `ShellGestoria.jsx:73`.
3. **Dades reals a la Wiki.** El prompt 0400 de Gemini l'envia a explorar `_gestoria_de_poble/`, i la 0415 hi copia noms de fitxers, números de factura i dates reals. Proposta: reescriure eixos fragments amb dades sintètiques.
4. **El pla 0425 parla de «risc zero» sense raó.** Diu que no hi ha risc de trepitjar-se, però `nucli/` i `font/` són fonts compartides de quatre tractors.
5. **El pla 0425 no segueix les lliçons.** Va nàixer després dels prompts i amb un altre sufix, contra les lliçons 260922, 260923 i 261002. Té l'«Estat del Pla» sense omplir.
6. **Noms que no existixen.** «TopBar2» és el renom del transformador per `const TopBar = memo(function TopBar…)` (`App.jsx:647`). `PanelLeftOpen` no s'usava enlloc fins ara.

### Retroalimentació de la plantilla `prompt_local`

1. **Demanar `file:line` verificat** a qui escriu el prompt quan cita una altra IA: Gemini 0415 citava fitxers inexistents i el pla 0425 els va heretar.
2. **Una secció obligatòria «Fonts signades que toca»**, amb els tractors que tornaran a «pendent». Sense ella, «risc zero» es pot escriure sense comprovar res.
3. **Dir qui fa el commit.** El Pas 0 demanava a Claude un commit que el hook no permet.
4. **Prohibir que una IA externa llegisca o copie `_gestoria_de_poble/`.** Les proves i els documents han d'usar dades sintètiques.
5. **Hora local, sense «Z», als camps de Registre i Historial,** o UTC de veres. Els dos prompts 0400 porten `03:55Z`, que era futur en UTC.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src tests` (06:00-06:08) | **1.032 fitxers verds i 6 omesos. 17.562 proves verdes, 89 omeses i 0 roges.** Els `LazyRouteError` del registre són proves que els provoquen a posta |
| Gestoria, tractors i CSS (front A, final) | 179 fitxers, 4.224 de 4.224. Cap prova fixa l'empremta real dels tractors |
| Layout, Workspace, plataforma, CSS, App i ClosCaXat (front B, final) | 78 fitxers, 1.468 de 1.468. Consumidors (catàleg, Xat i notes): 71 fitxers, 1.033 de 1.033 |
| Perfil, notes i barres (front C i coherència, final) | 100 fitxers, 1.246 de 1.246 |
| `src/components/universal`, connectar, App.iaia, fronteres i qualitat.neteja (front D, final) | 126 fitxers, 1.692 de 1.692 |
| `node --test tests/lint-sessio.test.mjs` | «Lint net», ara amb `barraSenseProveidors.test.jsx` a la llista |
| `npx vitest run src/sections/disseny/cataleg/detalls` (després de retallar el text de `EspecimenShell.jsx`) | 19 fitxers, 267 de 267 |
| TDD | Totes les proves noves de cada front es van vore roges abans del canvi i verdes després. Cap mutació temporal de codi de producció (CR-06) |
| Navegador, Claude, pestanya de fons, `/app/gestoria/full` a 1.680×1.000 | Panell de 1.325 px (article de 1.405 menys 40+40), abans 1.280. `max-width: none` dins de la closca. Consola sense errors. Viewport restaurat i pestanya tancada |
| Navegador, agents del front B, 1.440×900 i 1.100×900, Chromium amb scroll clàssic | Eix x=16 a totes les entrades plegades de la barra i de BarraApp. Workspace d'una acció: roda o lupa a y=139 i rail a 180, plegat i obert. Bloc de dues accions: accions a 134 i 182 (les d'abans del torn) i rail a 218. Xat sense canvis. Estats restaurats |
| `node tooling/gates/design_guard.mjs --arrel=src` | Ix amb 1 només pel deute previ CL-09. Cap deute nou |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit.** El hook local bloqueja `git commit` a Claude, i l'arbre barreja esta tanda amb canvis de MarIA (`.agents/`, `tooling/`) i de Gemini 4 (`gestoria/nucli/`, `font/`, `tractors.js`).
- **Res a `.agents/`** (ni ESTAT, ni LEDGER, ni `tancament.mjs`): Claude no té lease de governança, i el relleu és de MarIA.
- **Cap dada real.** No s'ha llegit ni obert res de `_gestoria_de_poble/`, ni tampoc de `90_arxiu_historic/`. La taula del Full amb factures de veres no s'ha vist al navegador: només l'amplària, sense carpeta.
- **No verificat en viu:**
  - El logo verd actuant com a Sóc de Poble: caldria canviar l'actor de la sessió del Mestre.
  - La remuntada del Bloc per `workspaceKey`: caldria que l'amfitrió reinjectara la sessió.
  - El HMR de `useSession`.

  Les cobrixen proves RTL, dues d'elles [DEFECTE].
- **Memòria persistent de Claude.** El hook bloqueja escriure fora del repositori, i la memòria «capçalera fantasma, aria-current fals» ha quedat rància: l'atribut ja no existix a `AppGridColumn`.
- **Llegits sencers:** el prompt 0400, el pla 0425 i la 0415 de Gemini (per un lector de l'Escriptori, també la 0148 de Gemini, la 0235 de Codex, el pla i el prompt 0130, el pla i el prompt 0210, l'estudi 1600 i el prompt 0400 de Gemini). De l'índex de l'Escriptori, només la capçalera i «Activitat en curs».
- **Cap cron ni schedule creat.** Els tres workflows han acabat i totes les pestanyes de fons del navegador estan tancades.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_0400_prompt_claude_gestoria_i_replegament]]
- [[261014_0425_pla_implementacio_gestoria_i_replegament]]
- [[261014_0415_auditoria_gemini4]]
- [[261014_0320_auditoria_claude]]
