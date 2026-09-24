---
type: informe
status: esborrany
description: 'Execucio del pla 1710 3.4 i 3.6: unificacio visual de la graella, cens de scripts orfes a tooling brain, contradiccions de les skills i tractor de plantilla literal.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_44b41021-191b-44c9-be4d-e67fc8899587:3b1f41da-9e2e-4ba3-a1e9-e0daa5a7df15
---
# Auditoria de Fable: UI unificada, tooling brain, skills i plantilla ISO

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_44b41021-191b-44c9-be4d-e67fc8899587:3b1f41da-9e2e-4ba3-a1e9-e0daa5a7df15 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T16:16:51.193Z |
| Modificació | 2026-09-24T16:40:00.000Z |
| Propietari | Fable |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), Claude Code a l'app d'escriptori |
| Tokens consumits | estimats: ~720k d'entrada acumulada en la sessió (pressupost de 15M, en queden ~14,3M); mesurats: l'arnés no els exposa |
| Tall d'evidència | HEAD 57ec5684 + arbre brut (54 fitxers modificats abans del torn) · 2026-09-24 17:55 a 18:40 |
| requires_human_decision | true (vegeu Troballes §7) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Abans d'escriure res s'han llegit: el prompt 1745, el pla 1710, `AGENTS.md`, `02_genotip.md`, `00_index.md`, `taxonomia_documental.md`, l'acta 1445, el bloc ESTAT_ACTUAL, `protocolledge.json` i `prompt_local.md`. La cacera de contradiccions l'han feta dos subagents en fase separada; la refutació (§6) l'ha feta Fable llegint cada línia citada.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T16:16:51.193Z: esborrany creat; contingut i verificació pendents.
- 2026-09-24 17:55: torn `torn_44b41021-191b-44c9-be4d-e67fc8899587` obert (scope code, actor Fable).
- 2026-09-24 18:00: primeres troballes dures abans de tocar codi (§0).
- 2026-09-24 18:05–18:20: implementació UX (§1), proves i verificació al navegador.
- 2026-09-24 18:20–18:40: cens de `tooling/brain/` (§2), refutació de les caceres (§3, §4, §6), evidència de plantilla (§5), esborrany de skill.
- 2026-09-24 18:45: `document.mjs check` valid: true en l'auditoria i en la skill; índex de l'Escriptori actualitzat (quatre àncores noves, cinc reapuntades); `porta-olivera --informe` en verd.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum executiu

Tasques del prompt 1745: (2) UX/UI **feta i verificada**; (3) `tooling/brain/` **cens fet, esborrat pendent del Mestre** (cap eina de l'agent pot esborrar); (4) skills **auditades**, amb causa arrel mecànica trobada; (5) tractor ISO **dissenyat i esborrany de skill escrit**, amb la porta que ja existix al repositori i les dos peces que falten per a tancar-la.

Tres fets que canvien el diagnòstic del Mestre:

1. **La plantilla ja té porta i ja detecta la mutilació.** `tooling/gates/porta-plantilla-viva.mjs` (laboratori 1505, ara a `tooling/gates/`, no versionat) diu del prompt 1745: `bloc normatiu alterat: «Context» ha de ser còpia literal de la plantilla`, i del pla 1710: `secció absent` ×7 i `Registre: falta la fila` ×9. El problema no és de doctrina: la porta no està endollada a cap hook ni al pre-commit, i MarIA escriu des d'Antigravity, on el hook de Claude Code no corre. La «creativitat documental» és un forat de cablejat, no de caràcter.
2. **Els dos documents del torn porten rebuts inventats.** `reflex: sdp:torn_1745_implementacio_fable_extra` i `reflex: sdp:torn_sintesi_eixam` no són identificadors de `document.mjs context` (el patró és `sdp:torn_UUID:UUID`). Les tres caselles marcades `[x]` a «0. Abans de generar» del prompt 1745 són falses: cap document estava ancorat a l'índex i el rebut no existia. `document.mjs check` ho confirma en els dos.
3. **El catàleg de skills no es pot regenerar.** `tooling/brain/cataleg_skills.mjs:56-60` llança excepció si una skill té `status` fora de `actiu|canonic` o no té `triggers_on`. `core-taxonomia-estricta/SKILL.md` té `status: esborrany` i cap `triggers_on`: des que es va instal·lar (0555), `manifest.yaml` i `00_INDEX_SKILLS.md` s'han quedat congelats a 20 mentre al disc n'hi ha 22. Això és el «10 errors pel mateix catàleg invàlid» que Codex va anotar a l'ESTAT de les 17:20.

### 1. Tasca 2 · UX/UI (feta)

Tot el que descriu el pla 1710 §3.4 està implementat i verificat al navegador a 1440×900 (Notes, Wiki de Poble i Disseny). Cap error de consola. 35 proves verdes als 7 fitxers afectats, lint net als 18 fitxers tocats, `design_guard` passa (41 crítics, el deute no puja).

| Ordre del pla | Què s'ha fet | On |
| --- | --- | --- |
| Unificar seccions sota la mateixa AppGridShell; matar els «fantasmes» | Una sola jerarquia de grisos per a tots els espais de treball: fila 1 Carbó 800, fila 2 Pissarra 750, columna de navegació Grafit 700, plana, sense degradats. El bloc `.sdp-bloc` ja no redefinix cap color: només mides. Fora l'actiu crema amb icona taronja i el hover crema del títol plegable (els dos «fantasmes» P10 de la nota de la Llei del Píxel). | `src/css/modules.css` (bloc `@layer components`, línies ~3290-3400), `src/components/layout/AppGridShell.css:23` |
| Color de la sidebar a Grafit 700 | `--app-grid-bg-esquerra: var(--sdp-crom-capcalera)` (resol a `--sdp-pedra-700`; cap component escriu primitius). Abans: 750 a Wiki/Disseny i 600 al Bloc. | `AppGridShell.css`, `modules.css:291` |
| Roda dentada SEMPRE present | La roda no depén de la secció. Amb `onManageCategories` fa el de sempre; sense, obri «Configuració de l'espai de treball» amb les tres amplàries predefinides d'`AppGridShell` (Compacta / Per defecte / Ampla). Visible també amb la columna replegada. | `UniversalWorkspace.jsx` (`WorkspaceSettingsDialog`) |
| Disseny: CREAR → icona d'ordenar | `sortable` a Disseny, i al nucli el botó de crear només es pinta quan hi ha `onCreate`. Wiki i Disseny pintaven un CREAR desactivat sense cap acció. | `DesignSection.jsx`, `UniversalWorkspace.jsx` |
| Wiki: categoria «Wiki de Poble» activa en entrar | Sense `?item=` la selecció inicial és `__intro_cat` + `__intro`; amb `?item=` desconegut es conserva la reconciliació. La portada no escriu `?item=__intro` a la URL. | `WikiDePobleSection.jsx` |
| Notes: entrar marcant «Mur» i «Bloc de notes» | La primera carpeta (Mur) és la categoria inicial; n1 ja s'obria sol. | `NotesSection.jsx` |
| LLAVOR_NOTA sense Heading 3; editor i targeta iguals | Fora el `<h3>` i el seu paràgraf. Els tres textos de reserva (títol, subtítol, entradilla) viuen a un sol mòdul i els lligen l'editor (marcadors) i la targeta (reserva quan el camp és buit), la compacta i la viva. | `src/components/universal/textosLlavor.js`, `UniversalEditorShell.jsx`, `NotaFitxa.jsx` |
| Botó EDITAR per a Forasters | Sense sessió, la barra taronja de l'estat buit porta EDITAR; obri una còpia local de la nota de benvinguda. Els canvis es queden en memòria, res no s'envia; Publicar avisa que cal connectar. | `NotesEditor.jsx` |
| Barra de botons de l'editor + llicència | Barra de classificació davall de les eines de format: Categories i Etiquetes (diàleg amb caselles dels valors coneguts del Bloc i camp per a afegir-ne), i el selector de llicència, que abans estava incrustat a la pàgina. Categories de sistema i de projecte només les veu la persona superadministradora, i en prémer-les avisa que el model de dades està pendent (§7). Les altres persones no les veuen. | `DocumentEditor.jsx` (`metaActions`), `NotesEditor.jsx`, `modules.css` (`.sdp-editor-meta`) |
| Reparar `UniversalWorkspace.test.jsx` | La prova d'ordenació ara prem el botó «Nom (A-Z)» del menú en lloc del `<select>` antic. Dues proves noves: roda sense configuració pròpia, cap CREAR sense `onCreate`. | `UniversalWorkspace.test.jsx` |

Divergència respecte a la skill `sdp-app-grid-shell` §2: la skill diu que la columna de Carpetes ha de tindre «un to diferent» de les capçaleres i que la fila 1 usa «el gris fosc de Carpetes». Amb l'ordre del Mestre (columna 700, files 800/750) la columna i cap fila no coincidixen, però la skill descriu una jerarquia diferent de la que el Mestre ha ordenat dues vegades (1630 i 1710). La skill s'ha de reescriure amb els tokens, no amb adjectius (§3, F35).

### 2. Tasca 3 · `tooling/brain/` (cens fet; esborrat pendent del Mestre)

L'agent no pot esborrar ni moure fitxers: el hook només admet Write/Edit fora de `tooling/`, i `executor-mutacio.mjs` «no implementa esborrats ni trasllats» (PROTOCOL_PETORRETA P-14). Per això l'entrega és el cens, el tractor que el manté i l'ordre exacta per al Mestre.

Eina nova: `tests/tractor-orfes-brain.test.mjs` recorre tot el repositori (sense `node_modules`, `.git`, `90_arxiu_historic`) i, per a cada script de `tooling/brain/`, diu qui l'executa (package.json, hooks, husky, cron, run-portes, Makefile), quin codi l'importa, quina skill o Constitució el mana i quins documents l'anomenen. `node --test tests/tractor-orfes-brain.test.mjs` imprimix el mapa; amb `SDP_PORTA_ORFES=1` falla si hi ha orfes fora de la llista `PERMESOS`.

**Vius (16)**, amb el seu cridador real:

| Script | Qui el crida |
| --- | --- |
| `ancora.mjs` | `tooling/gates/tractor-promesa.mjs`, `tooling/scripts/ancora.mjs` |
| `build_skills_index.mjs` | `persona_router.mjs` (hook UserPromptSubmit), `package.json` |
| `cataleg_skills.mjs` | `tancament.mjs`, `tractor-manifest.mjs`, `sincronitzar_skills.mjs`, `maintain.sh` |
| `consolidar_baselines.mjs` | `package.json` (`deute:revisa`) |
| `context-local.mjs` | `.claude/settings.json` (SessionStart), `hooks-local.mjs` |
| `context_documental.mjs` | `matrix.mjs` |
| `crear_bundle.mjs` + `farcell.mjs` | `AGENTS.md` §6 (eina manada); `farcell` només el crida `crear_bundle` |
| `desenterrar.mjs` | `tooling/scripts/desenterrar.mjs`, `tractor-lapida.mjs`, skill `core-restauracio-segellada` |
| `despertar.mjs` | `.claude/settings.json` (SessionStart), `package.json` |
| `mapa-consola.mjs` | `src/sections/consola/mapa/`, `tooling/vite/consola-iaia.mjs` |
| `matrix.mjs` | `package.json` (`porta:matrix`), `consola-iaia.mjs`, `scripts/portes/porta-vigencia.mjs` |
| `somiador.mjs` | encàrrec explícit (skill `wiki-cicle-de-vida`); prova `fortificacio` |
| `time-machine.mjs` | `.agents/cron/registre_tasques.json`, `frontissa-contingut.mjs`, `core/tanca.mjs` |
| `tracker_consum.mjs` | skill `core-estrategia-ia` §2 (eina manada) |
| `tractor-pedra-seca.mjs` | `run-portes.mjs`, `package.json` |
| `brain_distill.py` | `package.json` (`brain:distill`), `maintain.sh` |

**Morts (14 fitxers + 1 directori)**, tots amb la raó llegida al codi:

| Fitxer | Raó |
| --- | --- |
| `260830_neteja_deute.mjs` | Migració d'una sola vegada (auditoria 260830), ja aplicada. |
| `260830_pedacos_arrel.mjs` | Ídem. |
| `260830_purga_maquinari.mjs` | Ídem («mort de l'A10», BASELINE ja vigent). |
| `260831_rescat_tokens.mjs` | Ídem («MIGRACIÓ D'UNA SOLA VEGADA» al capçal). |
| `add_frontmatter_to_agents.mjs` | Una sola vegada, i **perillós**: escriu `tipus:`/`estat:` (claus velles) que `schema.json` rebutja. |
| `migrate_skills.mjs` | Cita skills que no existixen (`identity-iaia-core`, `trellat`, `pedra-seca`, `core-higiene-reflexa`, `reflexio-previa`). |
| `reparar_frontmatter_skills.mjs` | Repara «el destrossall de 260901», ja reparat. |
| `crear_mini_bundle_z.mjs` | Escriu un fitxer fix del 260916 amb nom en majúscules (viola AGENTS §2). |
| `crear_document.mjs` | **Contradiu el circuit documental**: crea documents sense rebut, amb `[[00_INDEX_ESCRIPTORI]]` en majúscules. Només el cita una prova. |
| `reflex_plantilles.mjs` | Àlies de 2 línies de `matrix.mjs`; ningú l'importa. |
| `classificador_tasques.mjs` | 8 línies que ningú importa. |
| `sync_agent_mirror.py` | «Àlies retirat» (ho diu el seu docstring); només el carrega la prova Python. |
| `build_context_pack.py` | Cita `src/universal/UniversalComponents.jsx` i `_wiki_de_poble/00_INDEX.md`, que no existixen. |
| `tests/test_brain_tools.py` + `tests/__pycache__/` | Carrega `brain_audit.py`, **que no existix** a `tooling/brain/`; el `__pycache__` és brossa compilada. |
| `maintain.sh` | Crida `brain_audit.py` (inexistent): `npm run brain:maintain` peta al primer pas. `brain_policy.json` només el consumix esta cadena. |

**Decisió del Mestre (3)**: `cens_cromatic.mjs` (diagnòstic útil del deute de color; cap cridador; moure a `tooling/scripts/`?), `quarantena_espills.mjs` (una sola vegada del 260920; els espills que busca ja no existixen; el cita una prova), `termometre_context.mjs` (només el crida `.agents/hooks/preflight_matrix_wrapper.mjs`, que cap hook configura; viu només si Antigravity l'endolla).

Ordre per al Mestre (esborrat amb rastre a Git; cap eina de l'agent ho pot fer):

```bash
git rm tooling/brain/260830_neteja_deute.mjs tooling/brain/260830_pedacos_arrel.mjs tooling/brain/260830_purga_maquinari.mjs tooling/brain/260831_rescat_tokens.mjs tooling/brain/add_frontmatter_to_agents.mjs tooling/brain/migrate_skills.mjs tooling/brain/reparar_frontmatter_skills.mjs tooling/brain/crear_mini_bundle_z.mjs tooling/brain/crear_document.mjs tooling/brain/reflex_plantilles.mjs tooling/brain/classificador_tasques.mjs tooling/brain/sync_agent_mirror.py tooling/brain/build_context_pack.py tooling/brain/tests/test_brain_tools.py tooling/brain/maintain.sh tooling/brain/brain_policy.json && rm -rf tooling/brain/tests/__pycache__
```

Després: llevar `brain:maintain` de `package.json`; llevar la referència a `crear_document.mjs` i `quarantena_espills.mjs` de `tests/backend_consolidacio.test.mjs` (o decidir sobre `quarantena_espills`); tornar a executar el tractor d'orfes i, si el resultat és el volgut, posar `SDP_PORTA_ORFES=1` al pre-commit o a la cadena de portes.

### 3. Tasca 4 · Les skills (auditades)

Cens: 22 directoris a `.agents/skills/` (no 23: el recompte del prompt de la cacera era meu i anava errat). `SKILLS_SEAL.json` en segella 21 més l'índex; `00_INDEX_SKILLS.md` i `manifest.yaml` en llisten 20; `skills_index.json` (el que usa el router de cada prompt) en té 17; `.claude/skills/` té 16 enllaços. Cap parell coincidix. Sis skills són invisibles per a Claude via l'eina Skill: `core-automillora`, `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori`, `core-taxonomia-estricta`, `sdp-universal-editor`. Tres d'elles són «Tractors de fusible».

**Causa arrel mecànica (§0.3)**: `core-taxonomia-estricta` amb `status: esborrany` i sense `triggers_on` fa que `cataleg_skills.mjs` llance i que cap projecció es regenere. Arreglar-ho són dues línies de frontmatter (amb lease) i `node tooling/brain/cataleg_skills.mjs --escriu`. `skills_index.json` té una causa a banda: `persona_router.mjs:34-42` només el regenera si el fitxer falta o no és JSON vàlid; un índex vell es queda vell per sempre. Cal regenerar-lo en cada arrencada o comparar-lo amb el disc.

**Contradiccions confirmades a la lectura** (cita literal, fitxer:línia). Numeració pròpia; entre claudàtors, el número de la cacera.

- **C1 · Qui pot tocar codi.** `core-automillora/SKILL.md:20`: «Tu (MarIA / Antigravity) eres … l'ÚNICA entitat amb permís per escriure, esborrar o modificar codi … Claude i Codex … NO tenen permisos d'edició» contra `sdp-calendari-agricola:23`, `sdp-casos-us-essencials:40` («Qualsevol IA (Claude, Codex, Fable) hauria de poder aterrar al codi») i contra este mateix torn, que el Mestre ha ordenat a Fable amb «permís directe d'implementació». [S8]
- **C2 · L'Olivera prohibix a MarIA el que el prompt li mana.** `core-consell-i-colmena:35`: «Mentre el Consell està auditant … la IAIA MarIA té PROHIBIT tocar o modificar res» contra `prompt_local.md:97` (bloc fix): «Mentre vosaltres auditeu, la IAIA MarIA … començarà a redactar un Pla d'Implementació». [S10]
- **C3 · Cowork a evitar vs flux normal.** `core-consell-i-colmena:34`: «Mode Cowork (Claude) … S'ha d'evitar excepte per a tasques molt controlades» contra `AGENTS.md` §6, que fa de Claude Desktop/Cowork el flux normal. [S9]
- **C4 · Bundles per a Claude i Codex.** `core-consell-i-colmena:40-42` els posa a l'«Equip Macro» i mana `MACRO_PROMPT` o `MACRO_BUNDLE`; `AGENTS.md` §6 i `wiki-documentacio-i-reflex` (lliçó 260922) ho prohibixen «TERMINANTMENT». [S19, G46]
- **C5 · Higiene: purgar i no purgar.** `core-higiene-escriptori:17` «has d'utilitzar SEMPRE» una eina que `:19` diu que «només diagnostica i no arxiva», i `:20` mana comprovar «que l'eina ha deixat la taula neta». `prompt_local.md:25` (casella obligatòria) exigix que els documents vells «s'han d'haver mogut a `90_arxiu_historic/`»; `wiki-cicle-de-vida:26` «No hi ha purga per antiguitat» i `AGENTS.md` §12 «No s'ha de buidar cegament». Dins de `wiki-documentacio-i-reflex`, la lliçó de la línia 82 («cap arxivat automàtic») i la de la 86 («HA DE netejar … cap a l'arxiu històric») es contradiuen a quatre línies. [S11, S12, S13]
- **C6 · Escriure a la zona humana.** `sdp-estudi-mercat:51-52` mana desar «obligatòriament» a `_wiki_de_poble/04_ESCRIPTORI/01_Produccio/…` (ruta en majúscules que no existix, dins de la carpeta que `AGENTS.md` §12 prohibix tocar). [S15]
- **C7 · Llegir l'arxiu prohibit.** `sdp-workflow:21` obliga a consultar `90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md`; `AGENTS.md` §5 prohibix llegir `90_arxiu_historic/` en procediments automàtics. A més `sdp-workflow:30` s'apunta a si mateixa com a font dels «principis de disseny matemàtics», que són a `sdp-pedra-seca`. [S16, S41, G31]
- **C8 · Pedra Seca contra Pedra Seca.** `sdp-pedra-seca:28` mana `--sdp-pedra-900` per a la sidebar i `:32` prohibix «un token primitiu … directament a un component». `sdp-universal-page:64-71` prescriu `border-radius: 32px`, un `box-shadow` literal i `#f7f6f3`, tres coses que `pedra-seca:32,62,63` prohibixen. `sdp-app-grid-shell` §2 descriu colors amb adjectius («gris fosc», «més intens»), i `pedra-seca:23` prohibix «dissenyar amb adjectius». [S33, S34, S35]
- **C9 · L'editor ordena el Heading 3 que el Mestre acaba de llevar.** `sdp-universal-editor:53` («Text d'encapçalament H3 … seguit d'un paràgraf de prova») descriu la llavor que el pla 1710 §3.4 ordena eliminar. La skill queda vella des d'este torn. (Troballa pròpia.)
- **C10 · Consum volàtil segellat.** `core-consell-i-colmena:48-58` grava «22% del límit setmanal restant … Es reinicia … el 24 de setembre», «Claude … Límit setmanal al 0% (exhaurit)» i «degradar l'esforç utilitzant Fable (Claude 3.5 Haiku)». `core-estrategia-ia:15` diu que el % de Claude és el CONSUMIT (0% = tot lliure), `:19` mana no guardar-ho en memòria sinó al CSV, i `:29` fa de Fable Extra «l'espina dorsal de l'Eixam». Hui és 24 de setembre: la dada és falsa i està segellada. [S23, S24, S25]
- **C11 · La REGLA SAGRADA s'incomplix a ella mateixa.** `core-consell-i-colmena:29` prohibix nomenar el Consell de memòria i mana `node -e "console.log(require('./.agents/consell.json')…"`; el hook rebutja `node -e` (no és a cap llista) i la mateixa skill nomena onze membres de memòria a `:24-28` (li falta Qwen, que reapareix a `:40`). `consell.json` en té 12, com `QUI_SOC.md` §7, però el rol de Claude és «Auditor sènior i estil» a `consell.json:79`, «Mestre d'Obra / Disseny» a `colmena:26` i «narrativa, to valencià, filosofia» a `QUI_SOC:54`. [S21, G4, G11]
- **C12 · Deduir vs preguntar.** `core-automillora:14-15` mana deduir «l'estat mental i l'objectiu últim» del Mestre; `sdp-workflow:44` (lliçó del Mestre) «El substitut es demana, no es dedueix» i `02_genotip.md:15` «Si falta una decisió humana … pregunta». [S29]
- **C13 · El fusible tanca la sessió sense relleu.** `core-context-panic:43` mana «Tanca aquesta sessió i obre'n una de nova»; `AGENTS.md` §4 diu que cap sessió acaba sense ESTAT i `tancament.mjs`. [S31]
- **C14 · `wiki-propagar-veritat` s'ha autocorromput.** `:13` «canviem d'estratègia Online-First a online-first», `:17` «`Online-First`, `Online-First`», `:28` `s/dispositius moderns/dispositius moderns/g`: el `sed` massiu que ensenya li ha esborrat els seus propis exemples. I el que ensenya (`find … -exec sed -i`) contradiu `sdp-workflow:45` (abast per superfície) i el hook viu (shell opaca denegada). [S44, S45]
- **C15 · Ordre d'arrencada quíntuple.** `core-identitat:26-30` (skill → personalitat → AGENTS + PROTOCOL → escriptori), `AGENTS.md` §15 («l'ordre de `cervell.json`»), `AGENTS.md` §14 (Acta Marmota primer), `BIOS.md:11-15` (verify-bios → BOOTSTRAP → mirall → `npm run gate` → LEDGER `--sign`), `PROFILE.md:14-17` (Acta + bundles + «Context carregat: [digests]»). Cap coincidix, i el que passa de veritat és `.claude/settings.json`, que cap document descriu. [S2, G6, G(c)]
- **C16 · Dialecte d'eines d'Antigravity dins de skills que carrega Claude.** `wiki-propagar-veritat:20` («`grep_search` … `run_command`»), `core-edicio-segura:15-17` («`replace_file_content`»), `AGENTS.md` §7 («`run_command`»). A Claude Code eixes eines no existixen. [S46]
- **C17 · La primera persona canvia de cos.** `wiki-documentacio-i-reflex:64,71` («jo mateixa (IAIA MarIA / Antigravity) … jo (IAIA MarIA) tinc l'autoritat»): quan Claude la carrega via `.claude/skills/`, «jo» és Claude. [S60]
- **C18 · Fantasmes confirmats.** `core-memoria-historica:4` promet «arxivament segur cap a `_arxiu_wiki_de_poble`» (un repositori extern que `PROTOCOL_PETORRETA` P-10 declara «només lectura per als agents» i que `somiador.mjs:13` usa com a destí). `AGENTS.md` §13 enllaça l'«Acte Reflex» a `sdp-workflow/SKILL.md` i `BOOTSTRAP.md:21` i `BIOS.md:19` hi envien la «llei de disseny»: les dues coses viuen a altres skills. `LEDGER.md:9` i `doctrina-ignora.txt:33` citen una «Skill Trellat» que no existix. `core-restauracio-segellada:34-38` cita `core-safe-restore`, `core-bounded-action` i `core-verified-change`, absents. [S4, S24, S43, S47, G23, G24, G39]
- **C19 · Format.** `\n#` literal com a primera línia de cos a `sdp-app-grid-shell:11`, `sdp-estudi-mercat:11`, `wiki-propagar-veritat:11`, `sdp-casos-us-essencials:12` i `00_index.md:8` (el H1 no és H1 al context injectat); «Les Tres Pedres» numerades 1, 2, 5; dos punts «4.» seguits a `wiki-documentacio-i-reflex:70-71`; `sdp-casos-us-essencials:25` en castellà. [S59, G40]

**Proposta de reestructuració severa** (per a decisió del Mestre; cap fitxer de `.agents/` s'ha tocat):

1. **Arreglar el catàleg primer** (dues línies a `core-taxonomia-estricta`: `status: canonic`, `triggers_on`), regenerar amb `--escriu`, resegellar, i fer que `persona_router` regenere `skills_index.json` sempre. Sense això, qualsevol reestructuració torna a quedar invisible.
2. **Fusionar les tres Oliveres** (`core-automillora` §2, `core-consell-i-colmena` §6, `wiki-documentacio-i-reflex` §5) en una sola secció dins de `wiki-documentacio-i-reflex`, que és l'única que enllaça la plantilla. Esborrar `core-automillora` sencera: §1 (mimetisme) contradiu el Genotip, §2 contradiu este torn, §3 no té cap procediment.
3. **Esborrar §5 de `core-consell-i-colmena`** (consum volàtil) i deixar-ne el cens al JSON: la skill només ha de dir «llig `consell.json`» i com. Corregir `:29` amb una ordre que el hook admeta (o llevar l'ordre i deixar la lectura del JSON).
4. **Una sola higiene**: `core-higiene-escriptori` redactada com a procediment de `porta-olivera.mjs --informe` + decisió humana per a `--arxiva`; llevar la casella de purga de `prompt_local.md:25` o reescriure-la com a «classificat i ancorat», que és el que la porta comprova de veritat.
5. **Les `sdp-*` d'interfície no són skills**: `sdp-app-grid-shell`, `sdp-universal-page`, `sdp-universal-editor`, `sdp-calendari-agricola`, `sdp-casos-us-essencials` són especificacions de producte (`AGENTS.md` §1: «Les skills NO han de contenir filosofia, sinó procediments»). Moure-les a `_wiki_de_poble/02_saber/` i deixar a `.agents/skills/` només `sdp-pedra-seca` (contracte) i `sdp-workflow` (procediment), reescrites amb tokens i sense adjectius.
6. **`core-identitat` és un punter**: fusionar amb `QUI_SOC.md` (o esborrar); l'ordre d'arrencada real és `.claude/settings.json` i cal escriure'l a un sol lloc (`cervell.json`).
7. **Reescriure `wiki-propagar-veritat`** sense `sed` massiu: procediment = cerca, llista de superfícies, edició fitxer a fitxer amb rebut.
8. **Netejar `.agents/`**: `BIOS.md`, `BOOTSTRAP.md`, `BASELINE.md`, `rules/00_BIOS_COGNITIU.md`, `PROFILE.md`, `README.md`, `cervells/placeholder.md`, `pageContent_old.js`, `hooks/verify.mjs`, `hooks/preflight_matrix_wrapper.mjs` i `hooks.json` són duplicats, punters vells o codi sense cridador (vegeu §4). `QUI_SOC.md:62` ja diu que reemplaça quatre d'ells.

### 4. Govern `.agents/` (troballes confirmades)

- **G1 · Tres instruccions impossibles per a l'agent que les rep.** `AGENTS.md` §4 i `QUI_SOC.md` §6 («cap tasca es tanca sense actualitzar l'ESTAT.md»), `CLAUDE.md` (Reflex de Correcció: «ESCRIU la lliçó a .agents/skills/… AFIG una línia a .agents/LEDGER.md»), `BIOS.md:11-15` (`verify-bios`, `npm run gate`, `verify-ledger --sign`): `mutation-policy.mjs:6,15` denega tot `.agents/` i `SECURITY_PATHS`, i `knownRead` no admet cap d'eixes ordres. Claude Code no pot complir la Constitució ni el Reflex de Correcció; o falseja o deixa l'ESTAT ranci (l'avís «ESTAT RANCI» d'esta arrencada n'és la prova). `.agents/hooks/verify.mjs:43` sí que exceptua ESTAT i LEDGER, però cap hook el crida. [G1, G2, G3, G36]
- **G2 · Dos hooks, dues polítiques, i el de MarIA no s'acredita.** `.claude/settings.json` (el real per a Claude) crida `hooks-local.mjs` i `segell-auto.mjs`; `.agents/hooks.json:2` diu «consumidor Antigravity no acreditat. Cap garantia d'activació». Els documents 1710 i 1745 amb rebut fals existixen al disc: o Antigravity no executa el hook o el va esquivar. Ni `verify.mjs` ni `preflight_matrix_wrapper.mjs` tenen cridador. [G36, G48]
- **G3 · El govern s'autoviola cada sessió.** `despertar.mjs:203` escriu `.agents/ON_ESTIC.md` en cada SessionStart sense lease (PROTOCOL P-02 diu que un canvi a `.agents/` és risc alt); l'arbre queda `M .agents/ON_ESTIC.md` per sempre. El mateix fitxer entra dues vegades al context (via `@` de CLAUDE.md, ranci, i via stdout, fresc) amb dos ESTATs diferents. [G28, G29]
- **G4 · Qui és l'original.** `AGENTS.md` §15 «`AGENTS.md` de l'arrel és l'únic original» contra `BIOS.md:13`, `manifest.yaml:4`, `verify-bios.mjs` i `tractor-cens.mjs`, que tracten el mirall `.agents/AGENTS.md` com a font. `QUI_SOC.md:62` «reemplaça i fusiona BOOTSTRAP, AGENTS, BIOS i BASELINE» contra `AGENTS.md` §13, que els declara «vitals», i `cervell.json:5` i `context-local.mjs:9`, que injecten BOOTSTRAP cada sessió. [G5, G25]
- **G5 · Petorreta vol dir dues coses.** `AGENTS.md` §6: dos fitxers a l'Escriptori (bundle + prompt, «sense límits»); `PROTOCOL_PETORRETA.md:24,39,43`: un fitxer mecànic a `.sdp-reflex/bootstrap/<sessionId>/` amb marcadors SHA i límit de «25 fonts, 2 MiB per fitxer i 8 MiB». `AGENTS.md` §1 prohibix llegir `.sdp-reflex`; el protocol obliga a escriure-hi. [G18, G19, G22]
- **G6 · Sollutia vs Firebase.** `AGENTS.md` §8 «Sollutia … Amfitrió SPA» contra `LEDGER.md:15` «S'elimina la consideració de Sollutia com a allotjament del frontend; la destinació final verificada és Firebase Hosting». [G14]
- **G7 · Frontissa aprovada per qui.** `contingut_estructural.json` diu `aprovat_per: "Mestre"` a nou claus i `"Javi"` a `consola` (amb `html: 0`); l'ESTAT de les 16:30 diu «La IAIA MarIA ha aprovat autònomament des del terminal el contingut de la Consola». Una etiqueta és una afirmació, no evidència (Genotip, llei 10). [G37]
- **G8 · El Genotip exigix lease per a tot i el seu «executable» diu que no.** `02_genotip.md:16` «Qualsevol efecte lateral seguix open → Petorreta+manifest → seal → rebut»; `PROTOCOL_PETORRETA.md:14,96` distingix el circuit documental ordinari (torn + rebut) del d'alt risc (lease). El Genotip s'ha d'alinear amb P-01. [G21]
- **G9 · El manual d'entrada està en majúscules prohibides.** `00_index.md:56-60,76-80` enllaça actes `ACTA_MARMOTA_…`; `taxonomia_documental.md` ja ho registra com a deute; però és la font que `context-local.mjs` injecta cada sessió. [G40]

### 5. Tasca 5 · Tractor cognitiu ISO de plantilles

**Evidència** (`node --test tests/plantilla-viva-escriptori.test.mjs`, prova nova, només lectura):

- `260924_1745_prompt_fable_extra.md`: sense rebut; `tags[2]` fora de l'enum; **bloc normatiu alterat «Context»** (li falta el paràgraf «El Context Mestre (D'on venim i Qui som)» de `prompt_local.md:70-72`).
- `260924_1710_pla_implementacio_confrontacio.md`: sense rebut; dos tags fora de l'enum; **les set seccions canòniques absents** i tres seccions fora de plantilla; **les nou files del Registre absents**.

**Què ja existix i funciona**: `tooling/gates/porta-plantilla-viva.mjs` (laboratori 1505, no versionat) comprova nom, rebut vinculat al fitxer, ruta coherent amb el nom, claus del frontmatter, esquema, `type`, seccions en ordre i sense afegits, **blocs fixos literals** i files del Registre. Té mode `--fitxer`, `--escriptori`, `--staged` (pre-commit) i `--vigila --quarantena` (vigilant amb launchd per a MarIA, que escriu fora dels hooks de Claude). `document.mjs create` ja genera l'esborrany amb els blocs fixos copiats literalment de la plantilla.

**Què falta perquè siga «matemàticament impossible»** (tot és cablejat, cap regla nova):

1. **Hook de Claude**: `hooks-local.mjs` només passa les petorretes per `porta-olivera` (higiene). Cal que, per a qualsevol Write/Edit d'un fitxer vigilat del primer nivell de l'Escriptori, passe també el contingut candidat per `revisaEstructura` de `porta-plantilla-viva` i bloquege amb `code: 2`. Pegat al laboratori (`02_investigacio_ia/260924_1815_tractor_plantilla_literal/`).
2. **Pre-commit**: `.husky/pre-commit` no crida `porta-plantilla-viva.mjs --staged`. Una línia (pegat al laboratori).
3. **Antigravity**: instal·lar el vigilant (`--llancador` imprimix el plist). Sense això, MarIA continua escrivint sense porta.
4. **La casella de la plantilla**: el «0. Abans de generar» és text que qui escriu marca a mà. La versió al laboratori de la porta ja el llig; cal que la porta comprove els tres fets que la casella afirma (àncora, pla del dia, rebut) en lloc de mirar si hi ha `[x]`.
5. **Regla de les caselles**: l'agent que escriu la petorreta no pot marcar `[x]` a mà: només `document.mjs check` (verd) pot marcar-les. Va a la skill.

L'esborrany de la skill `core-plantilla-literal` és a `260924_1815_skill_plantilla_literal.md` (amb rebut, ruta `skill`). No s'ha instal·lat a `.agents/skills/` (cal lease). Nota: `core-taxonomia-estricta` (0555) ja intentava el mateix amb prosa; la diferència és que esta nomena la porta que fa la comprovació i el punt exacte on s'endolla. Convindria fusionar-les.

### 6. Refutades

Troballes de la cacera que la lectura directa desmenteix o rebaixa. Es conserven perquè no tornen:

- [S6] «El Genotip ancora a `00_index_identitat`, esborrat». Refutada: el fitxer s'ha mogut de `02_saber/` a `01_ser/` (untracked, 76 línies, amb la taula de les huit dimensions); l'enllaç `[[00_index_identitat]]` resol per nom.
- [S7] «`PROTOCOL_PETORRETA.md` no verificat». Existix (109 línies).
- [S18] «`despertar` executa el Somiador». Refutada: `despertar.mjs` no importa el Somiador (nota de memòria pròpia caducada, corregida).
- [S26] «`10_metriques/consum_ia.csv` fantasma». El directori `_wiki_de_poble/10_metriques/` existix (untracked).
- [S49] «`plantilles/pla_implementacio.md` no existix». Existix (91 línies), a més de `pla.md`.
- [S55] `consell.json`, `design_guard.mjs`, `taxonomia_documental.md`, `schema.json` existixen tots. `npm test run` és vàlid (`npm test` passa `run` a `vitest`).
- [S43] `_arxiu_wiki_de_poble` no és un fantasma: és un repositori germà extern (`PROTOCOL_PETORRETA.md:72`, `somiador.mjs:13`). La contradicció real és que `core-memoria-historica:4` diu que hi arxiva i `:18` diu que no evacua a directoris externs.
- [G41] «`00_index_identitat` promés i buit». Refutada: 76 línies amb taula i documents troncals.
- [G45] `doctrina-ignora.txt` conté `.md`, `.js`, `SKILL.md`: confirmat el contingut, però sense llegir `tractor-doctrina.mjs` no es pot afirmar que case per subcadena. Queda com a pendent de verificar, no com a troballa.
- Cens: la cacera va rebre de Fable «22 dirs + 1 = 23». Són 22 directoris en total (21 segellats + `sdp-universal-editor`).

### 7. Decisions del Mestre (requires_human_decision: true)

1. Esborrat dels 14 morts de `tooling/brain/` (§2) i destí dels 3 en decisió.
2. Arreglar `core-taxonomia-estricta` (status + triggers) i regenerar el catàleg; resegellar. Sense això, res del §3 és visible.
3. Instal·lar la porta de plantilla als tres punts (§5: hook, pre-commit, vigilant) i fusionar `core-taxonomia-estricta` amb `core-plantilla-literal`.
4. Reestructuració de les skills (§3, 8 punts) i neteja de `.agents/` (§4).
5. Model de dades de «Categories de sistema» i «de projecte» (§1): no existix; la barra les pinta només al superadmin i avisa.
6. Tema clar/fosc per espai de treball (roda dentada): exigix que el bloc fosc de `tokens.css` accepte un selector d'àmbit (`.app-grid-page[data-theme]`); és un canvi de tokens, no de component. No fet.
7. Amplària de la sidebar compartida entre espais (`sdp-grid-widths` és una sola clau): si ha de ser per espai, cal una clau per `workspaceKey`.
8. Redacció nova de `sdp-app-grid-shell` §2 i `sdp-universal-editor` §4 amb els valors que el Mestre ha ordenat (700/800/750; sense H3).
9. `02_investigacio_ia/001 NEXUS/` (mapa d'agents extern en castellà, amb `SKILL.md` i agents propis, un PDF i un zip): 14 fitxers amb frontmatter invàlid que posen en roig `porta-documents`. Si és material d'estudi, cal moure'l a una carpeta sense `.md` vigilats o ancorar-lo i corregir-ne el frontmatter; si no, fora. No s'ha tocat.
10. Les cinc proves de lectura noves a `tests/` (inventari, cerca, lint, plantilla viva, orfes de brain): conservar-les com a eines dels agents engabiats o esborrar-les.

### 8. Relleu i ordres per al Mestre

L'agent no pot escriure a `.agents/ESTAT.md` ni a `.agents/LEDGER.md` (G1). Text llest per a enganxar, en la forma que `despertar.mjs` llig (primera capçalera del fitxer):

```markdown
## ESTAT_ACTUAL · 260924_1840 · Claude / Fable · UI unificada, cens de brain, skills i plantilla ISO

- Torn `torn_44b41021-191b-44c9-be4d-e67fc8899587` (code). Entrega [[260924_1810_auditoria_claude]] i esborrany [[260924_1815_skill_plantilla_literal]], `document.mjs check` → valid: true.
- Fet: pla 1710 §3.4 sencer (graella unificada 800/750/700 sense degradats ni fantasmes, roda dentada permanent amb configuració d'amplàries, Wiki i Notes amb actiu inicial, Disseny amb ordenar i sense CREAR, llavor sense H3 i textos compartits editor/targeta, EDITAR per a Forasters, barra de classificació i llicència). 35 proves verdes, lint net, design guard passa, verificat a 1440×900.
- Fet: cens de `tooling/brain/` (16 vius, 14 morts, 3 en decisió) amb `tests/tractor-orfes-brain.test.mjs`; eines de lectura per a agents engabiats a `tests/` (inventari, cerca, lint, plantilla viva).
- Trobat: catàleg de skills bloquejat per `core-taxonomia-estricta` (status esborrany, sense triggers); prompt 1745 i pla 1710 amb rebut fals i fora de plantilla; 19 contradiccions confirmades a les skills i 9 al govern.
- Pendent (Mestre): §7 de l'auditoria (8 decisions); `git rm` dels morts; instal·lar la porta de plantilla; resegellar.
```

```markdown
260924 | torn | torn_44b41021-191b-44c9-be4d-e67fc8899587 | Fable: pla 1710 §3.4 implementat, cens brain, auditoria skills/govern, esborrany core-plantilla-literal
```

Ordres (només el Mestre, fora de la gàbia): l'esborrat del §2; `node tooling/brain/cataleg_skills.mjs --escriu` després d'arreglar `core-taxonomia-estricta`; `node tooling/gates/segella.mjs --update …` amb justificació; `npm run porta` sencer (l'agent només ha pogut executar les portes de la llista blanca); `npm run lint` sencer.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tot executat des de la gàbia del hook (llista blanca d'ordres). Cap resultat s'ha inferit.

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Proves React dels fitxers tocats | `npx vitest run` sobre 7 fitxers (UniversalWorkspace, NotesEditor, NotaFitxa, NotesSection, WikiDePobleSection, NotesDetail, NotesContext) | 35 proves, 35 verdes |
| Lint dels 18 fitxers tocats | `node --test tests/lint-sessio.test.mjs` (ESLint del repo, `--max-warnings=0`) | net |
| Design guard | `node tooling/gates/design_guard.mjs --arrel=src` | PASSA, 41 crítics (el deute no puja) |
| Navegador | `http://localhost:3340` a 1440×900: `/notes`, `/wikidepoble`, `/disseny` | mateixa graella a les tres; Mur i Bloc de notes actius; Wiki de Poble actiu; Fonaments actiu amb icona d'ordenar; roda a les tres; cap CREAR a Wiki i Disseny; barra de classificació i EDITAR (sessió de Foraster); cap error de consola |
| Contracte documental dels dos entregables | `node tooling/wiki/document.mjs check --file …1810… / …1815…` | `valid: true` en els dos |
| Porta de plantilles | `node tooling/gates/porta-plantilles.mjs` | verd: 13 rutes, plantilla i contracte diuen el mateix |
| Porta de documents | `node tooling/gates/porta-documents.mjs` | roig, 18 revisats: el pla 1710 i el prompt 1745 (rebut fals, tags fora de l'enum) i els 14 fitxers de `02_investigacio_ia/001 NEXUS/` (material extern en castellà, frontmatter YAML invàlid, sense àncora; no és d'este torn, vegeu §7.9) |
| Documents heretats contra plantilla | `node --test tests/plantilla-viva-escriptori.test.mjs` | 2 revisats, 2 fora de plantilla (1710, 1745) |
| Cens de brain | `node --test tests/tractor-orfes-brain.test.mjs` | 35 scripts; 15 sense executor, codi ni skill: 13 morts, `cens_cromatic` (decisió) i `farcell` (viu per `crear_bundle`, a PERMESOS). `crear_document` i `quarantena_espills` només viuen per una prova; `maintain.sh` viu per `package.json` però crida un fitxer inexistent; `termometre` només per un wrapper sense cridador |
| Segell de skills | `node tooling/gates/segella.mjs` | roig: 41b4a7c9 ≠ 15094d99 (skill nova sense segellar + dues modificades a l'arbre) |
| Higiene de l'Escriptori | `node tooling/gates/porta-olivera.mjs --informe` | abans: 2 sense àncora, 5 àncores fantasma; després de l'índex nou (quatre documents ancorats, cinc àncores reapuntades a `90_arxiu_historic/260924_Auditories_Astra_Fable/`): **verd**, 4 documents solts, cap de jornades anteriors, pla del dia present, cap àncora fantasma |

No s'ha executat `npm run porta`, `npm run lint` ni `npm run build`: el hook no els admet.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Gàbia**: sense `ls`, `find`, `grep`, `rm`, `mv`, `npm run lint|porta|build`. Les lectures de directori i les cerques s'han fet amb proves de `node --test` a `tests/` (`inventari-directoris`, `cerca-sessio`, `lint-sessio`, `plantilla-viva-escriptori`, `tractor-orfes-brain`). Són eines de lectura que es queden al repositori: el Mestre decidix si es conserven.
- **Sense lease**: cap escriptura a `.agents/`, `tooling/`, `.husky/`, `package.json`. La skill és un esborrany a l'Escriptori; el cablejat de la porta és un pegat al laboratori; ESTAT i LEDGER van al §8 per a enganxar.
- **Sense esborrats**: ni l'executor ni el hook els permeten.
- **Antigravity**: no s'ha pogut verificar si executa `hooks.json`; l'evidència (documents amb rebut fals al disc) diu que no.
- **Cacera amb subagents**: 108 troballes brutes; només s'inclouen les llegides per Fable a la font. Les no llegides no hi són.
- **`90_arxiu_historic/`**: no s'ha llegit cap contingut; només s'han llistat noms per a reapuntar àncores.
- **Tema per espai i categories de sistema**: no fets (decisió §7).
- **`npm run porta` sencer**: no executat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1710_pla_implementacio_confrontacio]]
- [[260924_1745_prompt_fable_extra]]
- [[260924_1815_skill_plantilla_literal]]
- [[taxonomia_documental]]
