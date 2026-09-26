---
type: informe
status: esborrany
description: 'Auditoria extrema amb verificació adversarial: codi, disseny, dades, skills, tractors, cervell, higiene de l''Escriptori, usuaris i federació'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ed548eea-d6bc-493c-9f7c-7fc0a8446616:b4adcc85-1993-4ea1-811f-b16763002f99
---
# Auditoria extrema de Claude: Consola, codi, cervell, usuaris i federació

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ed548eea-d6bc-493c-9f7c-7fc0a8446616:b4adcc85-1993-4ea1-811f-b16763002f99 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T23:41:50.937Z |
| Modificació | 2026-09-26T05:20:00.000Z |
| Propietari | Claude (agent local) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5): orquestrador i tots els subagents |
| Tokens consumits | Mesurats per l'arnés (subagents, sumats a mà): ≈18 M, amb possible doble recompte a la verificació represa. Estimats (fil principal): ≈0,7 M. No hi ha comptador per torn. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-25T23:41:50Z: esborrany creat pel circuit documental (torn torn_ed548eea).
- 2026-09-26 01:45–02:10: Missió 1 implementada i verificada. Primera ronda de troballes (9 dimensions) llançada.
- 2026-09-26 02:00: el hook bloqueja StructuredOutput i SubagentHandback; els informes es rescaten un per un (ENT-01).
- 2026-09-26 02:30–06:30: interrupció pel límit d'ús del compte. Represa a les 06:30.
- 2026-09-26 06:30–07:15: verificació adversarial (dos escèptics per dimensió), revisió adversarial de la Missió 1, crític de completesa i segona ronda sobre quatre buits. Correccions de la Missió 1 aplicades.
- 2026-09-26 07:20: informe redactat amb només troballes verificades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu

La Consola ja té les targetes universals que va demanar el Mestre (Missió 1, verificada i amb 738/738 proves verdes). L'auditoria ha revisat nou superfícies i n'ha tret 235 troballes. Dos escèptics independents han votat cada troballa: se'n confirmen 234, i una queda refutada perquè ja estava arreglada. Els escèptics n'han rebaixat moltes de severitat i cap troballa queda crítica.

El que més importa, en una frase per bloc:

1. **La frontera dels agents és on més mal fa.** El hook bloqueja les eines amb què els subagents lliuren resultats (ENT-01) i deixa executar codi escrit per l'agent com si fóra lectura (TRA-01). A més, falla obert si no carrega un mòdul (TRA-02). La doctrina mana tancar torns i anotar lliçons a llocs on el hook no deixa escriure (SKI-02, SKI-03).
2. **MarIA escriu sense cap porta** (HIG-01): Antigravity no executa hooks, i el circuit documental no mira l'Escriptori (HIG-02). La porta Olivera v2 i la skill v3 esperen al laboratori des del 260924 (HIG-04).
3. **Privacitat i dades.** Hi ha documents privats publicats a `slugIndex.json` (BUI2-01), i la política de publicació funciona per exclusió (BUI2-02). Qualsevol anònim pot llistar el bucket de mitjans (DAD-08, BUI1-05). Un participant pot afegir veïns d'un altre poble a un fil (DAD-03). L'alta amb Google trenca el registre (BUI1-01).
4. **La doctrina es contradiu** sobre el backend (CER-01, DAD-06), sobre qui escriu codi (CER-10, SKI-07) i sobre si l'Escriptori es buida (CER-07, HIG-05).
5. **Les xifres verdes no són reproduïbles:** no hi ha CI (BUI3-01), i diverses portes ixen verdes sense comprovar el que diuen (DAD-15, DAD-16, DIS-07, BUI2-03).

### Les deu prioritats

| # | Què | Troballes | Qui decidix | Esforç |
| --- | --- | --- | --- | --- |
| 1 | Obrir al hook les eines de l'arnés que no escriuen (StructuredOutput, SubagentHandback, Skill, ListAgents) i admetre `git ls-files` i `git grep` amb argv estricte | ENT-01, ENT-02, TRA-06, BUI4-05, SKI-01 | Mestre | S |
| 2 | Tancar la frontera del hook: `node --test` i `vitest` són execució; entrada mínima que falle tancada; `.env*`, `.sdp-reflex` i `.git` fora de lectura i escriptura | TRA-01, TRA-02, TRA-05, BUI4-01, BUI4-06 | Mestre | M |
| 3 | La funció forçadora d'higiene dins de `document.mjs`, un circuit `document.mjs arxiva`, un canari per als hooks d'Antigravity i el vigilant de plantilla viva encés | HIG-01…HIG-04, HIG-17 | Mestre (lease) | M |
| 4 | Un circuit estret i de risc baix per al tancament (ESTAT_ACTUAL i LEDGER) i per a les lliçons del REFLEX DE CORRECCIÓ | SKI-02, SKI-03, TRA-03, CER-30 | Mestre | M |
| 5 | Despublicar els documents privats: reconstruir i purgar `public/` i el plugin, i publicar només el que declare `visibility: public` | BUI2-01, BUI2-02 | Mestre | M |
| 6 | Verificar en staging les 7-8 migracions no llegides i tancar el bucket `mitjans` (anònims, ruta de pujada) i els participants del xat | DAD-01, DAD-03, DAD-08, BUI1-05, BUI1-02 | Mestre + Sollutia | M |
| 7 | Alta amb Google: tornar al poble per defecte quan falte `tenant_id`, i demanar el consentiment | BUI1-01, DAD-13 | — | S |
| 8 | Signar o reescriure l'ADR Model B i propagar una sola frase sobre qui és el backend | CER-01, DAD-05, DAD-06 | Mestre | S |
| 9 | CSS: el `.sdp-boto` de PerfilShell anul·la totes les variants; contrast del blau i focus sobre la closca | DIS-01, DIS-02, DIS-03 | Mestre (canvi visual) | S |
| 10 | Una CI mínima a Linux (lint, Vitest, node --test i build) que guarde els comptadors | BUI3-01, BUI3-03 | Mestre | M |

### Missió 1 · Consola Termodinàmica (fet i verificat)

El detall és al pla germà [[260926_0130_pla_implementacio_auditoria_extrema]], secció A. En resum:

- **Molla de pa com a panell propi** (`.sdp-molla--panell`). Té aire davant de «Consola», el separador «›» porta 8 px a cada costat i hi ha separació amb el contingut. La causa de l'espaiat desigual era el `padding-left` de 4 px que `base.css` posa als `li`.
- **Instantània, Refrescar i Privacitat al peu**, en un panell propi. Cada pàgina data la seua font: el pols usa consola.json i la resta, el Mapa. La privacitat es recorda per visitant i ara també amaga els protocols i la petició del diàleg de fonts.
- **Consums, Crèdits i Rebuts:** el detall funciona des de la targeta i des del peu blau, i Rebuts obri el diàleg de fonts. S'ha corregit `normalitza`, que descartava la `termometria` (la Càrrega documental no es podia mesurar mai).
- **Targetes universals:** `TargetaConsola` és la UniversalCard sencera del Mur. Té boina taronja (autoria, font i hora local), la icona en el lloc de la foto, títol, subtítol «Per a…», entradilla, dada viva, etiquetes i el peu blau (Compartir + Obrir, o Veure detall). Té espècimen al catàleg de Disseny (Pedra Seca §9).
- **Revisió adversarial del canvi:** 13 troballes (CON-01…CON-13) i 9 corregides:
  - CON-01: «Obrir» registrava telemetria de Connectar. Ara hi ha `telemetria.comptar=false`.
  - CON-02: el peu citava consola.json a les pàgines del Mapa.
  - CON-03: la privacitat no es recordava i no amagava protocols ni petició.
  - CON-05: proves febles, amb la navegació d'Obrir, Rebuts, termometria i dates en zona local.
  - CON-06: graella sensible al contenidor per a la Wiki.
  - CON-07: l'hora de només lectura portava cursor de mà.
  - CON-09: l'espècimen del catàleg.
  - CON-11: un `abast: null` invalidava la instantània.
  - CON-12: el nom accessible quan el títol no és text i quan el verb no és «Connectar» (la regressió de `NotaFitxa`, BUI3-02, també està corregida).
- **Queden obertes, per decisió del Mestre:**
  - CON-04: en mode fosc, la insígnia lateral és gairebé blanca. És la recepta global de `.sp-card-calendar-badge`, que usa un token primitiu.
  - CON-08: tres parades de tabulació per targeta, i cal decidir si Compartir ha d'anar al tauler.
  - CON-10: els atributs ARIA s'escriuen al DOM des de fora de React. Proposta: afegir props a UniversalCard.
  - CON-13: etiquetes d'11,2 px dins de les targetes. És la recepta global.

### Troballes transversals: l'entorn dels agents (viscudes en este torn)

- **ENT-01 · alta · El hook bloqueja les eines de lliurament de l'arnés: StructuredOutput, SubagentHandback, Skill i ListAgents** — *Evidència:* `tooling/gates/hooks-local.mjs:84-90`. En viu, un workflow de prova va tornar `{"ambText":"hola-text","ambEsquema":null}`: els 9 agents amb esquema de la primera ronda van fallar, i els seus informes (≈4 M de tokens de faena) es van haver de rescatar un per un amb SendMessage. *Conflicte amb:* el propòsit declarat del hook, que és impedir escriptures al disc. Estes eines no n'escriuen cap. *Proposta:* afegir-les a la llista d'orquestració de `hooks-local.mjs:84`, amb una prova per nom. · **Decisió humana**
- **ENT-02 · alta · En esta sessió no hi ha Glob ni Grep, i el hook denega `ls`, `find` i `grep`** — *Evidència:* `tooling/gates/mutation-policy.mjs:52-70`. *Conflicte amb:* `knownRead` (`mutation-policy.mjs:53`), que dona per fet que Glob i Grep existixen. *Proposta:* admetre `git ls-files -- <ruta>` i `git grep -n -e <patró> -- <ruta>` amb argv estricte. Mentrestant, l'inventari s'ha fet a través del servidor Vite (`fetch('/src/…?raw')` i `performance.getEntriesByType('resource')`).
- **ENT-03 · mitjana · El hook denega escriure fora del repositori, inclosa la memòria persistent de l'agent** — *Evidència:* «Ruta fora del repositori» en escriure a l'scratchpad de la sessió i al directori de memòria de Claude. *Conflicte amb:* la continuïtat entre sessions: les lliçons d'esta nit no s'han pogut guardar a la memòria de l'agent. *Proposta:* permetre escriure en eixos dos directoris, que queden fora del repositori i de la governança. · **Decisió humana**
- **ENT-04 · mitjana · Un document de l'Escriptori escrit a mà ja no el pot completar cap agent** — *Evidència:* el pla de MarIA `260926_0130_pla_implementacio_claude.md` no té rebut. El hook de plantilla viva en rebutja qualsevol edició, i `document.mjs create` no sobreescriu. *Conflicte amb:* la petorreta, que demana escriure en eixe pla. *Proposta:* una operació `document.mjs regularitza`, que entregue el context sobre el mateix nom i adopte el contingut. En este torn s'ha creat el pla amb el cognom correcte (lliçó 260922): `260926_0130_pla_implementacio_auditoria_extrema.md`.
- **ENT-05 · mitjana · El tancament d'este torn no es pot fer** — *Evidència:* SKI-02 i TRA-03. `tancament.mjs` no està a la llista i `.agents/` és governança. *Conflicte amb:* AGENTS §4. *Proposta:* prioritat 4. El text del relleu per a ESTAT i LEDGER queda al pla germà, perquè el pose qui tinga lease.

### Codi font i front-end

La base defensiva del front és sòlida: un sol sanejador amb DOMPurify, guardes d'obsolescència als contextos, CAS de revisions a Notes i un diàleg natiu que funciona dins del shadow root. Els defectes són funcionals i de rendiment, no de seguretat. El que més importa és que els camps editables desen HTML en camps de text pla: «Pep & Maria» queda desat com «Pep &amp; Maria» a `profiles.full_name`. També pesen els desats del perfil que fallen en silenci, la cerca del Xat que no troba mai res i un error boundary que no es reinicia en canviar de ruta. Els escèptics confirmen les 25 troballes i en rebaixen cinc, entre elles les dues altes, que passen a mitjana.

**Recompte:** 25 troballes: 25 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 0, mitjanes 11, baixes 14).

**Fortaleses:**
- Sanejament centralitzat: `sanitize.js:69-92` arma DOMPurify en carregar el mòdul, i tots els `dangerouslySetInnerHTML` revisats hi passen.
- Guardes d'obsolescència als contextos: `useScopedResource.js:16-32`, `XatContext.jsx:159-164` i `NotesDataContext.jsx:138-147`.
- Notes fa CAS de revisions i resol els 409 de manera explícita: `GlobalSaveManager.js:142-192` i `NotesDetail.jsx:10-38`.
- La prova de fum de l'App falla si hi ha un fetch inesperat o un `console.error`: `App.test.jsx:43-77`.

**Troballes:**

- **FRO-01 · mitjana · Els camps editables desen HTML en camps de text pla** — *Evidència:* `src/components/universal/UniversalEditorShell.jsx:42-45`, `src/sections/profile/PerfilContext.jsx:158`. Que el Mur mostre etiquetes literals és INFERÈNCIA. *Conflicte amb:* —. *Proposta:* convertir a text a la frontera amb `extractPlainText` (`contentAdapter.js:10`) a desaCampClosca, publishNote i NotaFitxa, i netejar a banda les dades ja corrompudes. · **Decisió humana**
- **FRO-02 · mitjana · El MemoryRouter resol les rutes relatives contra «/»** — *Evidència:* `src/app/contexts/RouterContext.jsx:306-311`, `src/sections/wiki-de-poble/WikiDePobleSection.jsx:308`. Només passa en mode memòria (`PedraSecaEmbed.jsx:45`). *Conflicte amb:* —. *Proposta:* resoldre `to` contra l'entrada actual quan no comence per «/», llegir `tornar` amb `useSearchParams()` i afegir una prova amb `routerType 'memory'`.
- **FRO-03 · mitjana · La cerca del Xat filtra per camps que no existixen** — *Evidència:* `src/sections/xat/XatSection.jsx:100`, `src/sections/xat/XatContext.jsx:111-126`. *Conflicte amb:* la forma de fil que produïx `mapejaFil`. *Proposta:* filtrar per `th.searchText` amb `normalizeSearchText` i afegir una prova de cerca.
- **FRO-04 · mitjana · RouteErrorBoundary no es reinicia en canviar de ruta i mostra el missatge intern** — *Evidència:* `src/app/App.jsx:457-459`, `src/app/App.jsx:481-483`. *Conflicte amb:* —. *Proposta:* `key={location.pathname}` o un resetKey, com `SlotErrorBoundary.jsx:36-40`, i `error.message` només en DEV.
- **FRO-06 · mitjana · Els desats del perfil fallen en silenci** — *Evidència:* `src/sections/profile/DetallAjust.jsx:61-70`, `src/sections/control/ControlSection.jsx:139`. *Conflicte amb:* —. *Proposta:* propagar la promesa amb `.catch` cap a un missatge d'error, com ja fa `commutaPublicacio` (`DetallAjust.jsx:74-81`).
- **FRO-07 · mitjana · Gestoria (ACTIU) i «Missatges per a dubtes» porten a 404** — *Evidència:* `src/sections/control/ControlSection.jsx:30`, `:128`. *Conflicte amb:* la política «EN OBRES» del mateix fitxer. *Proposta:* marcar-los «EN OBRES», sense `onMainClick`, fins que existisca la ruta.
- **FRO-10 · mitjana · Els providers de secció són globals: les càrregues i el sondeig del Xat corren a qualsevol ruta** — *Evidència:* `src/app/App.jsx:422-439`, `src/sections/xat/XatContext.jsx:346-356`. *Conflicte amb:* —. *Proposta:* activar-los per consumidor, com `NotesDataContext`, començant pel sondeig del Xat.
- **FRO-11 · mitjana · L'editor de Notes fa treball O(N) i obri IndexedDB a cada tecla** — *Evidència:* `src/sections/notes/NotesContext.jsx:143-145`, `src/sections/notes/NotesSection.jsx:126`. *Conflicte amb:* —. *Proposta:* que `setLocalNoteField` toque només l'overlay, persistència amb debounce i una sola connexió IDB.
- **FRO-12 · mitjana · Entrar o eixir de /notes recarrega totes les notes des de la pàgina 0** — *Evidència:* `src/sections/notes/NotesDataContext.jsx:233`, `src/sections/notes/NotesSection.jsx:73`. *Conflicte amb:* —. *Proposta:* `consumers` en una ref i continuar des de `nextCursor`.
- **FRO-13 · mitjana · La taula de continguts es porta a document.body: sense estils en mode incrustat i sense focus** — *Evidència:* `src/components/universal/PageFrame.jsx:85-126`, `src/PedraSecaEmbed.jsx:303-313`. *Conflicte amb:* —. *Proposta:* reutilitzar el `Dialeg` natiu amb `costat='dreta'`.
- **FRO-14 · mitjana · setLanguage i setTheme no arriben a l'estat de React** — *Evidència:* `src/app/contexts/UIContext.jsx:19-28`, `src/PedraSecaEmbed.jsx:554-557`. *Conflicte amb:* l'API pública de l'element incrustat. *Proposta:* un efecte a `UIProvider` que sincronitze `externalConfig.language` i `themeMode`.

Baixes:
- **FRO-05** · Compartir està duplicat a UniversalPage, amb el porta-retalls sense guarda (`UniversalPage.jsx:25-34`).
- **FRO-08** · Cicle d'imports DocumentEditor → NotesSection (`DocumentEditor.jsx:14`). Cal moure `LLAVOR_NOTA` a `notesContent.js`.
- **FRO-09** · La Wiki munta la Consola sense la barrera superadmin (`WikiDePobleSection.jsx:10`).
- **FRO-15** · El cercador universal no té guarda per a `searchText` i no normalitza els accents (`SearchSection.jsx:47`).
- **FRO-16** · Més de nou controls inerts al Xat (`XatSection.jsx:224-229`, `:550-552`).
- **FRO-17** · Al menú mòbil, PANELL DE CONTROL no tanca el diàleg (`App.jsx:102`).
- **FRO-18** · Els contentEditable no tenen `role` ni nom accessible (`UniversalEditorShell.jsx:58-74`).
- **FRO-19** · Jerarquia de títols trencada (`ControlSection.jsx:79`, `WikiDePobleSection.jsx:161`).
- **FRO-20** · Les skills de disseny contradiuen el codi (`sdp-universal-page/SKILL.md:30,58` davant de `PageFrame.jsx:202-211`). · **Decisió humana**
- **FRO-21** · L'esborrat d'imatge no demana confirmació i `accept` admet formats que després es rebutgen (`UniversalEditorShell.jsx:267-281`). · **Decisió humana**
- **FRO-22** · Proves que no proven el que diuen (`XatSection.test.jsx:67-69`, `App.test.jsx:63`).
- **FRO-23** · El detall mostra «Element no trobat» mentre carrega (`ItemDetailSection.jsx:36-51`).
- **FRO-24** · La tornada OAuth s'avorta si canvien les dependències (`App.jsx:197-206`).
- **FRO-25** · Codi mort i memos inútils (`App.jsx:80-82`, `OnboardingSection.jsx:27,114`). · **Decisió humana**

Refutades: cap.

**Cobertura i límits:** es van llegir sencers App, PedraSecaEmbed, main, els contextos i les seccions Notes, Xat, Mur, Perfil, Onboarding, Wiki, Control, Search, Connectar i detail. La Consola quedava fora perquè es refactoritzava en paral·lel. Tampoc es van cobrir ProfileSection, Mercat, Pobles, Població, Multimèdia, Dispositius, Admin, Realitat, Traduccions ni AppGridShell.

### Sistema de disseny i CSS (Pedra Seca)

La base de Pedra Seca és sòlida: l'ordre de capes és explícit, els tokens tenen tres capes amb el contrast anotat i l'especificitat és zero amb `:where()`. El CSS que es pinta, però, no complix el reglament. El defecte més greu és de cascada: `PerfilShell.css` redefinix `.sdp-boto` per a tota l'app, i totes les variants ixen blaves, també l'acció destructiva. A més, hi ha dos problemes d'accessibilitat alts (text blanc a 3,87:1 i focus a ≈1,2:1 sobre la closca), el xat mòbil sense botó de tornar i una porta, `design_guard`, que ix verda sense mirar la major part del reglament.

**Recompte:** 25 troballes: 25 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 4, mitjanes 11, baixes 10).

**Fortaleses:**
- L'ordre de capes es declara abans dels imports i porta la raó escrita (`src/css/index.css:10-45`).
- Els tokens tenen tres capes amb el contrast anotat (`src/css/tokens.css:6-18`, `:95-151`).
- Els controls de barra estan unificats i tenen fallback `@media` per als navegadors sense `@container` (`src/css/components.css:1333-1457`).

**Troballes:**

- **DIS-01 · alta · PerfilShell.css redefinix `.sdp-boto` i anul·la totes les variants** — *Evidència:* `src/sections/profile/PerfilShell.css:102-119`; `src/css/index.css:63-66` (últim full de la capa `components`). «Confirmar eixida» (`DetallAjust.jsx:198`, perill) ix blau. *Conflicte amb:* les variants de `components.css:78-87`. *Proposta:* esborrar el bloc i una prova que impedisca declarar `.sdp-boto {` fora de components.css. · **Decisió humana**
- **DIS-02 · alta · Text blanc sobre `--sdp-accio` a 3,87:1, però el catàleg afirma 5,23:1** — *Evidència:* `src/css/tokens.css:84` (el token diu «només icones i text gran»); `EspecimenColor.jsx:56`. *Conflicte amb:* WCAG 1.4.3 AA. *Proposta:* `--sdp-accio-control` en les regles afectades i corregir el catàleg. · **Decisió humana**
- **DIS-03 · alta · El focus quasi no es veu damunt de la closca en tema clar (≈1,2:1)** — *Evidència:* `src/components/layout/AppGridShell.css:83-86` usa `--sdp-focus` sobre #3d3b35; `src/css/modules.css:2216`. *Conflicte amb:* `src/css/base.css:236-239` (reserva `--sdp-crom-focus` per a la closca) i WCAG 2.4.7. *Proposta:* canviar a `--sdp-crom-focus`, sense cap canvi en repòs.
- **DIS-08 · alta · Xat mòbil: `.d-mobile-only` només funciona dins d'AppGridShell** — *Evidència:* `AppGridShell.css:241-243`; `XatSection.jsx:174` pinta `.xat-layout` fora, i el botó Tornar (`:447`) no es veu mai. *Conflicte amb:* —. *Proposta:* verificar-ho a 375 px i afegir regles `.xat-layout .d-*` per a ≤768 px.
- **DIS-04 · mitjana · La taula de continguts fa el portal fora del Shadow DOM** — *Evidència:* `PageFrame.jsx:85-126`; `PedraSecaEmbed.jsx:303-326`. *Conflicte amb:* —. *Proposta:* passar `targetNode` al calaix, com NotificationProvider (`App.jsx:413`).
- **DIS-06 · mitjana · Píndoles i etiquetes clicables de 24 px** — *Evidència:* `components.css:644`, `:653-656`. *Conflicte amb:* la Llei de Vida (44 px). *Proposta:* àrea de toc invisible de 44 px amb `::after`, com `AppGridShell.css:398-405`.
- **DIS-07 · mitjana · `design_guard` ix verd però amb prou feines mira el reglament** — *Evidència:* `tooling/gates/design_guard.mjs:32-35` (només hex, px i outline); `:337` (baseline de 17 contra els 4 actuals). *Conflicte amb:* el sòl de 14 px de `tokens.css:214`. *Proposta:* congelar la baseline i afegir rgba, primitius i rem. · **Decisió humana**
- **DIS-09 · mitjana · `:has()`, `dvh` i translate/rotate individuals fora del Baseline 2022** — *Evidència:* `components.css:154-156` (una llista amb `:has()` que Chrome i Firefox 100 descarten sencera), `:197` (`dvh`). *Conflicte amb:* QUI_SOC §5. *Proposta:* separar el selector `:empty` i afegir fallbacks `vh` i `transform`.
- **DIS-11 · mitjana · `.search-bar-basic` definida dues vegades** — *Evidència:* `modules.css:1315-1349`, `:2212-2245`. *Proposta:* reanomenar la del xat a `.xat-cerca`.
- **DIS-13 · mitjana · Mode fosc incoherent** — *Evidència:* `modules.css:1197-1212` intercanvia blau i taronja; `layout.css:410` fa ≈2,5:1. *Conflicte amb:* `tokens.css:320-321` («identitat estable»). *Proposta:* `--sdp-accent-text` i el patró `:root`/`:host`. · **Decisió humana**
- **DIS-14 · mitjana · Ombres permanents a les targetes, rgba literal i blur inútil** — *Evidència:* `components.css:566`; `layout.css:411-412`. *Conflicte amb:* sdp-pedra-seca §5. *Proposta:* llevar el blur (no canvia cap píxel) i decidir les ombres. · **Decisió humana**
- **DIS-17 · mitjana · Lletra per davall de 14 px, inclòs un token de 13 px** — *Evidència:* `tokens.css:218` (`--sdp-ui-sm`), `components.css:559` (0,7 rem). *Proposta:* un ratchet per a rem a la porta. · **Decisió humana**
- **DIS-20 · mitjana · Receptes duplicades amb semàntica oposada** — *Evidència:* `components.css:435-443` (`.btn-primary` taronja) contra `:78` (`.sdp-boto--primari` blau). *Proposta:* una recepta canònica i retirar la llegada.
- **DIS-21 · mitjana · Skills que contradiuen el CSS** — *Evidència:* `sdp-pedra-seca/SKILL.md:28` contra `:32`; `sdp-universal-page/SKILL.md:64` (`--sdp-blanc`, eliminat). *Proposta:* passar wiki-propagar-veritat amb el Mestre. · **Decisió humana**
- **DIS-25 · mitjana · Filtres del xat amb l'estat actiu indistingible** — *Evidència:* `XatSection.jsx:225-229` (sense `aria-pressed`); `components.css:1179-1181`. *Conflicte amb:* WCAG 1.4.1 i 4.1.2. *Proposta:* `aria-pressed` i una marca que no depenga del color.

Baixes: DIS-05 (regles fora de `@layer`, `modules.css:3782-3801`), DIS-10 (`font-size` amb un token de color, `modules.css:1326`), DIS-12 (insígnia de calendari a ≈1,32:1 en fosc i hover; · **Decisió humana**), DIS-15 (espaiats fora d'escala, `modules.css:3366`), DIS-16 (radis fora d'escala, `layout.css:316`), DIS-18 (tokens duplicats, `tokens.css:35`, `:184`; · **Decisió humana**), DIS-19 (props que escriuen variables sense consumidor, `Dropdown.jsx:40`), DIS-22 (classes sense CSS: `.sdp-app-loading` i `.sdp-spinner`, `App.jsx:70-71`), DIS-23 (selectors morts: només `layout.css:505` i `:364-369`), DIS-24 (`!important` a legacy i `z-index: 9999`, `modules.css:779`).

Refutades: cap.

**Cobertura i límits:** els contrastos es van calcular a mà amb la fórmula WCAG i la cascada es va deduir sense renderitzar. DIS-04 i DIS-08 no s'han vist en pantalla. Només s'ha executat `design_guard` (341 fitxers, PASSA).

### Capa de dades, backend i enxufabilitat

El nucli és sòlid: el port es valida de manera atòmica i queda segellat, l'aturador de credencials té prova, OAuth usa PKCE, Notes fa CAS per revisió i les RPC SECURITY DEFINER tenen `search_path` buit. El que falla és la frontera entre el client i l'esquema: la ruta de pujada de mitjans contradiu la política RLS del bucket, un participant del xat pot afegir persones d'altres pobles a un fil i llegir-ne el nom, i els tractors `rls`, `enxufe` i `adaptadors` ixen verds sense poder detectar estes classes de defecte.

**Recompte:** 24 troballes: 24 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 2, mitjanes 13, baixes 9).

**Fortaleses:**
- L'aturador de credencials té prova (`publicCredentials.js:2-20`; `tests/backend_consolidacio.test.mjs:153-185`).
- El port es valida de manera atòmica i queda segellat (`src/data/backendPort.js:8-59`; `src/host.js:68-107`).
- Les funcions SECURITY DEFINER tenen `search_path` buit, i el xat té límit de ritme amb advisory lock (`260908_xat_v2_correccions.sql:387-416`).

**Troballes:**

- **DAD-01 · alta · La ruta de Storage contradiu la política RLS: la primera carpeta és el poble, no l'uid** — *Evidència:* `src/data/supabase/storage.js:118` puja a `tenant/uid/…`, i `supabase/migrations/260913_0500_bucket_mitjans.sql:23-27` exigix `foldername[1] = auth.uid()`. Depén de les migracions no llegides. *Conflicte amb:* la política RLS del bucket `mitjans`. *Proposta:* una migració que compare l'uid amb el segment 2 i el poble amb el segment 1, i una prova que confronte SQL i client.
- **DAD-03 · alta · Un participant pot afegir persones d'un altre poble a un fil i llegir-ne el nom** — *Evidència:* `260908_xat_v2.sql:88-89` només revoca a `anon` i `public`; la política de `260908_xat_v2_correccions.sql:104-110` no restringix `usuari_id` ni el poble. *Conflicte amb:* el filtre RGPD i la frontera entre pobles. *Proposta:* revocar a `authenticated` insert, update i delete sobre `xat_participants` i revisar la resta de taules del xat.
- **DAD-02 · mitjana · `promoteToPublic` falla en silenci i publica referències privades** — *Evidència:* `storage.js:169-180`; `NotesContext.jsx:180-223`. *Proposta:* llançar l'error i validar tipus i mida abans de copiar.
- **DAD-04 · mitjana · El registre ignora el poble del client** — *Evidència:* `260914_0100_auditoria_rls_fixes.sql:16-18`; `OnboardingSection.jsx:33`. És la correcció antispoofing, i hui només hi ha un poble. *Proposta:* acceptar el tenant només si existix i té `is_open=true`. · **Decisió humana**
- **DAD-05 · mitjana · La sessió de Sollutia (Model B) no es pot validar sense el secret de SdP** — *Evidència:* `src/data/identitat.js:283-287`. *Conflicte amb:* `ADR-2026-09-SOLLUTIA-MODEL-B.md:33-34`. *Proposta:* que una ADR triï entre JWKS de tercers o retirar `adoptaSessioExterna`; mentrestant, marcar la sessió com a no verificada. · **Decisió humana**
- **DAD-06 · mitjana · El BIOS contradiu l'ADR i el codi sobre qui és el backend** — *Evidència:* `AGENTS.md:43`, `.agents/QUI_SOC.md:37` davant de `src/host.js:56`. *Conflicte amb:* `ADR-2026-09-SOLLUTIA-MODEL-B.md:10`. *Proposta:* una frase canònica signada pel Mestre, propagada amb wiki-propagar-veritat. · **Decisió humana**
- **DAD-07 · mitjana · `sollutia-issuer` no té efecte, i web i WordPress usen emissors diferents** — *Evidència:* `src/host.js:85`; `src/main.jsx:18-19` contra `runtimePolicy.js:35,46`. *Proposta:* una sola variable i unes úniques audiències.
- **DAD-08 · mitjana · Un anònim pot llistar tot el bucket públic** — *Evidència:* `260913_0500_bucket_mitjans.sql:18-20`; `260914_0100:58` esborra una política amb un altre nom. *Proposta:* retirar el SELECT a `anon` i limitar el d'`authenticated` a la carpeta pròpia.
- **DAD-11 · mitjana · `adminListUsers` envia paràmetres que la funció no té** — *Evidència:* `src/data/supabase/admin.js:4`; `260912_admin_panel.sql:11`. La segona ronda (BUI1) matisa que una migració posterior ho podria haver resolt. *Proposta:* alinear la crida amb la signatura i distingir PGRST202.
- **DAD-13 · mitjana · Les altes amb Google no demanen consentiment i queden invisibles al directori** — *Evidència:* `OnboardingSection.jsx:57-69`; `260914_0100:97`. *Proposta:* `registraConsentiment` com a capacitat del contracte i consentiment al primer accés.
- **DAD-15 · mitjana · `tractor-rls` no veu GRANT múltiples, rols, DECLARE ni el fitxer exempt** — *Evidència:* `tooling/gates/tractor-rls.mjs:198`, `:204`, `:170`. *Proposta:* separar privilegis, tindre en compte el rol i fer l'exempció per política.
- **DAD-16 · mitjana · `tractor-enxufe` i `tractor-adaptadors` no vigilen el Model B** — *Evidència:* `tractor-enxufe.mjs:84-95`; `tractor-adaptadors.mjs:46,58` (verd amb zero fixtures). *Proposta:* regles E5 i E6, i que zero fixtures isca amb 1.
- **DAD-18 · mitjana · Llistes d'orígens divergents: Google falla des de v2.sollutia.com** — *Evidència:* `runtimePolicy.js:4-5` contra `public/auth/callback.html:100-105`. *Proposta:* un JSON únic d'orígens injectat en el build.
- **DAD-19 · mitjana · La clau de reserva de CI és invàlida i la producció accepta localhost** — *Evidència:* `vite.config.js:16-19`; `publicCredentials.js:7-13`. *Proposta:* `sb_publishable_ci` i rebutjar localhost en producció.
- **DAD-20 · mitjana · Els esborranys privats queden a IndexedDB després d'eixir** — *Evidència:* `GlobalSaveManager.js:18-35`; `identitat.js:210-220`. *Conflicte amb:* la Llei 05. *Proposta:* esborrar-los al logout i avisar si hi ha canvis pendents.

Baixes: DAD-09 (eixir no revoca la sessió al servidor, `auth.js:209-218`), DAD-10 (contracte tot-o-res amb mètodes morts, `contracte.js:2-35`), DAD-12 (organitzacions envia columnes sense GRANT, `organizations.js:19-23`), DAD-14 (`created_at` falsificable des del client, `content.js:59`), DAD-17 (la regla L4 de persistència és inert i el límit de 10 KB no s'aplica), DAD-21 (`.or()` interpola la cerca sense escapar, `utils.js:174-177`), DAD-22 (`organization_directory` dona permission denied a `anon`), DAD-23 (la cerca de membres filtra després del límit de 100, `xat.js:181-191`), DAD-24 (la documentació ha derivat del codi: el README nomena 10 dels 17 SQL).

Refutades: cap.

**Cobertura i límits:** 10 migracions llegides, 7 no; per això DAD-01 i DAD-11 continuen plausibles. `tractor-enxufe` i `tractor-rls` en verd; Vitest de `src/data` 97/97 i de `src/data/supabase` 45/45. El Supabase remot no s'ha verificat.

### Scripts, portes i tractors

Esta dimensió es va tornar a fer des de zero, perquè el classificador de seguretat va retindre l'informe original. La maquinària té peces rigoroses: l'executor fa CAS amb hash previ i fsync, i la política d'ordres analitza argv sense expansió. La frontera amb els agents té forats: la llista blanca de lectura deixa executar codi escrit per l'agent (TRA-01), el hook falla obert si un mòdul no carrega (TRA-02) i la doctrina exigix ordres que el mateix hook denega (TRA-03).

**Recompte:** 20 troballes: 20 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 4, mitjanes 8, baixes 8).

**Fortaleses:**
- executor-mutacio fa CAS amb SHA-256 previ, rebutja symlinks i hardlinks, fa fsync, i el pending falla tancat (`executor-mutacio.mjs:22-37`).
- command-policy analitza un argv mínim sense expansió ni globs (`command-policy.mjs:9-40`).
- run-portes té guarda anti-recursió i exporta els passos com a font única (`run-portes.mjs:27`; `tractor-cadena.mjs:91`).

**Troballes:**

- **TRA-01 · alta · La llista blanca de lectura executa codi arbitrari (`node --test`, `vitest`) i deixa `.git` escrivible** — *Evidència:* `tooling/gates/mutation-policy.mjs:6`, `:62-63`. *Conflicte amb:* la governança per executor i lease; el mateix hook admet que no és el confinament extern (`hooks-local.mjs:127`). *Proposta:* tractar-les com a execució i afegir `.git`, `tests/`, `*.test.*` i `vite*.config.*` a SECURITY_PATHS.
- **TRA-02 · alta · El hook PreToolUse falla obert: els imports estàtics i el temps límit queden fora del try** — *Evidència:* `hooks-local.mjs:3-14`, `:118-129`; timeout de 10 s (`.claude/settings.json:38`). *Conflicte amb:* el protocol de hooks, on només el codi 2 bloqueja. *Proposta:* un punt d'entrada mínim amb `import()` dins d'un try que isca amb 2.
- **TRA-03 · alta · La doctrina exigix ordres que el hook denega: tancament, ESTAT i LEDGER, `obrir_torn --output`, handoff** — *Evidència:* `command-policy.mjs:71`; `wiki-cicle-de-vida/SKILL.md:16`. *Conflicte amb:* AGENTS §4. *Proposta:* `tancament.mjs --check` com a lectura auditada i una operació acotada per a ESTAT_ACTUAL i LEDGER. · **Decisió humana**
- **TRA-07 · alta · El pre-commit executa dues vegades lint, Vitest i portes amb un límit de 120 s** — *Evidència:* `git-staged.mjs:11`; `run-portes.mjs:38`. *Proposta:* una sola execució en mode staged, amb un límit proporcional.
- **TRA-04 · mitjana · Un agent amb hook no pot operar el circuit executor + lease** — *Evidència:* `executor-mutacio.mjs:29`, `:101-104`. *Proposta:* una subordre que calcule els hashes i escriga el pla, i una lease oberta amb confirmació humana explícita. Pot ser intencionat. · **Decisió humana**
- **TRA-05 · mitjana · El secret HMAC de les leases és llegible i `.sdp-reflex` és escrivible pel mateix agent** — *Evidència:* `reflex_petorreta.mjs:40`; `mutation-policy.mjs:53`. *Conflicte amb:* AGENTS §5. *Proposta:* denegar lectura i escriptura de `.sdp-reflex`, `.env*` i `.git`.
- **TRA-06 · mitjana · Eines de l'arnés que no escriuen es bloquegen com a opaques** — *Evidència:* `hooks-local.mjs:84-85`, `:90`. Consta com a pendent a `ESTAT.md:23`. *Proposta:* una llista explícita i provada (vegeu ENT-01).
- **TRA-10 · mitjana · La Porta Build construïx en lloc de verificar, i té codi i comentaris morts** — *Evidència:* `tractor-build-previ.mjs:98-103`, `:28-34`. *Proposta:* dins de la cadena, només verificar.
- **TRA-12 · mitjana · La Porta Olivera depén del rellotge i contradiu AGENTS §12** — *Evidència:* `porta-olivera.mjs:95-102`, `:218`. *Proposta:* traure-la de run-portes i aplicar-la només en escriure una petorreta.
- **TRA-13 · mitjana · `mutation.pending.json` i els locks no tenen camí de reconciliació** — *Evidència:* `hooks-local.mjs:88`; `segella.mjs:61-62`. *Proposta:* una CLI de reconciliació amb diff i CAS, i locks amb PID i caducitat.
- **TRA-15 · mitjana · El LEDGER només és immutable de nom** — *Evidència:* `tooling/verify-ledger.mjs:33-40`; `tooling/documental/ledger.mjs:4`. *Conflicte amb:* la Llei de la Immutabilitat (QUI_SOC §3). *Proposta:* comprovar que `HEAD:.agents/LEDGER.md` és prefix del fitxer actual.
- **TRA-17 · mitjana · L'escriptor principal (Antigravity) no passa per cap hook** — *Evidència:* `.agents/hooks.json:2`; `porta-plantilla-viva.mjs:7-8`. *Proposta:* fer del pre-commit i del vigilant la frontera comuna (vegeu HIG-01).

Baixes: TRA-08 (dos processos node per crida, Read inclòs), TRA-09 (si falta una font de contextLocal es bloqueja fins i tot Read, `hooks-local.mjs:77`), TRA-11 (porta-documents només revisa el diff; la CI `wiki-integrity.yml` cobrix push i PR), TRA-14 (Tractor Arrel no veu l'arrel calculada per cwd), TRA-16 (dues tasques launchd mortes i Plaquetes embruta l'arbre cada hora), TRA-18 (portes que passen amb comprovacions de text mínimes, `tractor-llavor.mjs:10-29`), TRA-19 (despertar no detecta mai un ESTAT ranci, `despertar.mjs:80`), TRA-20 (lògica duplicada i branca Bash inabastable, `hooks-local.mjs:113`).

Refutades: cap.

**Cobertura i límits:** hooks, polítiques, executor i 10 tractors llegits sencers; s'han executat segella, porta-plantilles, porta-olivera, porta-documents, tractor-rls i tractor-enxufe. No s'han llegit `turns.mjs`, `draft-write.mjs` ni la resta de tractors. La latència dels hooks no s'ha mesurat.

### El cervell intern (_wiki_de_poble i documents d'estat)

La maquinària de contracte funciona: `core.mjs`, `protocolledge.json` v4 i `schema.json` fallen en tancat, i porta-plantilles ix verda amb 13 rutes. El problema és la doctrina: diverses fonts es contradiuen sobre el backend, el BIOS, qui escriu codi i si l'Escriptori s'ha de buidar, i la mateixa veritat està copiada en diversos llocs amb redaccions diferents. El més greu és que el bloc fix Context copia doctrina errònia a cada petorreta (CER-02).

**Recompte:** 30 troballes: 29 confirmades, 0 discutides, 1 refutada (severitats verificades: crítiques 0, altes 4, mitjanes 15, baixes 10).

**Fortaleses:**
- El contracte documental es pot executar i falla en tancat (`core.mjs:62-72`, `:115-119`).
- El cens del Consell és coherent: 12 membres a `consell.json`, `agents_equip_ia`, QUI_SOC §7 i `prompt_consell`.
- Dues hipòtesis prèvies ja estan corregides: `turns.mjs:123` valida seccions i Registre, i `document.mjs:15-16` genera les 10 files del Registre.

**Troballes:**

- **CER-01 · alta · Cinc fonts de govern es contradiuen sobre Sollutia i el backend** — *Evidència:* `AGENTS.md:43`; `.agents/QUI_SOC.md:37`. *Conflicte amb:* `ADR-2026-09-SOLLUTIA-MODEL-B.md:10,43`, que és esborrany amb la signatura pendent (`:14`). *Proposta:* reescriure AGENTS §8 i QUI_SOC §5 amb la frase de l'ADR quan el Mestre decidisca. · **Decisió humana**
- **CER-02 · alta · El bloc fix Context de les plantilles de prompt contradiu l'online-first i es copia a cada petorreta** — *Evidència:* `prompt_local.md:72` i `prompt_consell.md:99` («plataforma descentralitzada»); `core.mjs:166-168` exigix que el bloc siga idèntic. *Conflicte amb:* `00_visio_i_pilars.md:30`, ADR-2026-08 i ADR-2026-09. *Proposta:* reescriure el paràgraf a les dues plantilles i pujar-ne la versió a `protocolledge.json`.
- **CER-07 · alta · Buidar o conservar l'Escriptori: redaccions incompatibles** — *Evidència:* `AGENTS.md:56` (no buidar cegament) contra `prompt_local.md:25` (moure-ho tot a l'arxiu). *Conflicte amb:* les lliçons 260922 i 260923. *Proposta:* una sola regla verificable a la skill (vegeu la Missió 3).
- **CER-10 · alta · Qui pot editar codi: la doctrina diu que només MarIA; la pràctica són torns de Claude i Codex i una autoaprovació** — *Evidència:* `core-consell-i-colmena/SKILL.md:25`; `ESTAT.md:100`. *Conflicte amb:* `03_equip_ia.md:17`. *Proposta:* una taula de rols a `doc_governanca` i una prohibició expressa de l'autoaprovació. · **Decisió humana**
- **CER-03 · mitjana · Cinc documents es declaren BIOS o font única** — *Evidència:* `.agents/BIOS.md:13`; `QUI_SOC.md:62`. *Conflicte amb:* AGENTS §15. *Proposta:* AGENTS.md com a únic BIOS; la resta, redireccions arxivades.
- **CER-04 · mitjana · L'arrencada està definida en huit llocs** — *Evidència:* `cervell.json:3-11`; `PROFILE.md:13-17`. *Proposta:* `cervell.json` com a única llista.
- **CER-05 · mitjana · «Petorreta» té quatre significats** — *Evidència:* `taxonomia_documental.md:65` contra `memoria_aprenentatges.md:83`. *Proposta:* un glossari únic. · **Decisió humana**
- **CER-06 · mitjana · La doctrina diu arxiu pla; la pràctica crea subcarpetes a mà** — *Evidència:* `memoria_aprenentatges.md:81`; `00_index_escriptori.md:78`. *Proposta:* triar un model d'arxiu. · **Decisió humana**
- **CER-08 · mitjana · ESTAT.md creix sense límit i no té un sol bloc actual** — *Evidència:* 923 línies, amb diversos blocs ESTAT_ACTUAL (`ESTAT.md:8`, `:18`, `:26`…). *Conflicte amb:* AGENTS §14. *Proposta:* un bloc únic, sobreescrit i datat; la història, al LEDGER i a les actes.
- **CER-09 · mitjana · El LEDGER no té format únic ni ordre i cita una skill inexistent** — *Evidència:* `LEDGER.md:9`; `:23` (09-01) davant de `:29` (08-28). *Proposta:* un format únic i escriure només al final.
- **CER-11 · mitjana · Les skills manen fer bundles Macro per a Claude i Codex** — *Evidència:* `core-consell-i-colmena/SKILL.md:40-42`; `bundle.md:21`. *Conflicte amb:* AGENTS §6.
- **CER-12 · mitjana · La REGLA SAGRADA per enumerar el Consell imprimix `[object Object]`** — *Evidència:* `core-consell-i-colmena/SKILL.md:29`; `consell.json:21-31`.
- **CER-15 · mitjana · La plantilla de branding i el checklist de producció contradiuen els tokens** — *Evidència:* `branding.md:68` (#016ebf); `produccio.md:65`. *Conflicte amb:* `design-tokens.json:15-17`.
- **CER-17 · mitjana · L'índex mestre barreja maquinària, zona humana i un document privat** — *Evidència:* `00_index.md:17`, `:28`, `:70`.
- **CER-18 · mitjana · L'índex de l'Escriptori enllaça unes 50 vegades a 90_arxiu_historic** — *Evidència:* `00_index_escriptori.md:13`, `:45-46`. *Conflicte amb:* AGENTS §5. *Proposta:* un índex d'arxiu fora del RAG.
- **CER-19 · mitjana · La petorreta d'esta auditoria incomplix el seu contracte** — *Evidència:* `260926_0130_prompt_auditoria_extrema.md:16-17`, `:34`. *Conflicte amb:* el bloc fix de `prompt_local.md:70-72`. *Proposta:* generar-la amb `document.mjs create` i anotar la recaiguda al LEDGER.
- **CER-24 · mitjana · La plantilla d'acta demana mètriques d'estat humà i les actes no seguixen l'esquema** — *Evidència:* `acta.md:62-64`; `260925_2015_acta_marmota.md:32` («Tot verd», amb 8 portes roges).
- **CER-29 · mitjana · La Regla 0 mana heretar un frontmatter que no és el contracte real** — *Evidència:* `AGENTS.md:13`; `prompt_local.md:2`. *Proposta:* remetre al bloc SDP:EIXIDA.
- **CER-30 · mitjana · El tancament exigix escriure a .agents/, que el protocol classifica com a risc alt** — *Evidència:* `PROTOCOL_PETORRETA.md:18`; `turns.mjs:158-159`. *Proposta:* un executor append-only de risc baix per a ESTAT i LEDGER.

Baixes: CER-13 (qui aprova les dependències; · **Decisió humana**), CER-14 (bloc de logos dins de plantilles), CER-16 (PWA i Dexie inexistents a un document arxivat), CER-20 (el Registre només rebutja el literal `[pendent]`), CER-21 (format de data AA-MM-DD a `prompt_local.md:38-39`), CER-22 (la secció 0 és obligatòria a l'eixida i la versió divergix), CER-23 (tres regles per al nom del pla), CER-25 (la documentació de la Consola diu «Futur»), CER-27 (`10_metriques` no està declarada), CER-28 (restes trencades a les plantilles: `auditoria_canonica.md:116` porta un «BROKEN LINK»).

Refutades: **CER-26** (la Càrrega documental descartava termometria): ja estava corregida en este torn (`consolaContent.js`).

**Cobertura i límits:** d'ESTAT i del LEDGER només es van llegir trossos. L'arbre és concurrent: les línies d'ESTAT s'han desplaçat unes 10 posicions entre la cacera i la verificació. No s'ha llegit 90_arxiu_historic.

### Skills i la seua càrrega

Les 22 skills estan segellades i l'índex del router coincidix amb el frontmatter. El problema és executar-les: el hook bloqueja l'eina Skill i tota escriptura sota `.agents`, i per això cap agent pot fer el tancament, el reflex de correcció de CLAUDE.md ni el traspàs de documents. Les skills també es contradiuen entre elles: qui pot editar codi, si cal deduir o preguntar, i si l'Escriptori es neteja per data.

**Recompte:** 30 troballes: 30 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 4, mitjanes 15, baixes 11).

**Fortaleses:**
- El segell de skills és vàlid (22 skills més `00_INDEX_SKILLS`) i `skills_index.json` coincidix amb el frontmatter.
- `command-policy.mjs` definix un llenguatge argv estret i tancat per defecte.
- `core-memoria-historica` i `wiki-cicle-de-vida` són procediments curts i sense filosofia.

**Troballes:**

- **SKI-02 · alta · El tancament obligatori és inabastable per a un agent** — *Evidència:* `mutation-policy.mjs:6,15`, `:43-51`. *Conflicte amb:* `wiki-cicle-de-vida/SKILL.md:22-23`, AGENTS §4 i QUI_SOC §6. *Proposta:* `tancament.mjs --check` com a lectura i un circuit estret per a ESTAT_ACTUAL i el LEDGER. · **Decisió humana**
- **SKI-03 · alta · El REFLEX DE CORRECCIÓ mana escriptures que el hook prohibix** — *Evidència:* els passos 2 i 3 de CLAUDE.md escriuen sota `.agents/`; `mutation-policy.mjs:15`. *Proposta:* l'agent redacta la lliçó a l'Escriptori i la promou l'executor amb lease o el Mestre.
- **SKI-04 · alta · `wiki-cicle-de-vida`: els passos 1 i 6 donen ordres que command-policy rebutja** — *Evidència:* `SKILL.md:16` (`--output`), `:21` (`handoff`); `command-policy.mjs:71,78-79`. *Proposta:* llevar `--output` i afegir `handoff` amb comprovació de torn obert.
- **SKI-13 · alta · `core-higiene-escriptori` i porta-olivera exigixen neteja per data** — *Evidència:* `core-higiene-escriptori/SKILL.md:19-20`; `porta-olivera.mjs:67-69`, `:97`, `:183`. *Conflicte amb:* `wiki-cicle-de-vida/SKILL.md:29` («no hi ha purga per antiguitat») i AGENTS §12. *Proposta:* basar-ho en l'ancoratge i el torn (vegeu la Missió 3).
- **SKI-01 · mitjana · L'eina Skill està bloquejada pel hook** — *Evidència:* `hooks-local.mjs:84-90`, provat en viu. *Proposta:* vegeu ENT-01; mentrestant, Read com a via de càrrega.
- **SKI-05 · mitjana · `core-restauracio-segellada`: procediment impossible i en part fictici** — *Evidència:* `SKILL.md:71-74` davant de `mutation-policy.mjs:63`; `tooling/brain/ancora.mjs:17` no té `--pon`.
- **SKI-06 · mitjana · La «REGLA SAGRADA» imprimix «[object Object]» i el cens omet Qwen** — *Evidència:* `core-consell-i-colmena/SKILL.md:29`, `:26-28`.
- **SKI-07 · mitjana · `core-automillora` reserva l'edició de codi a MarIA** — *Evidència:* `core-automillora/SKILL.md:20`; commit `503c2311` de Codex. *Conflicte amb:* AGENTS §6 i §15. *Proposta:* la regla de torn i pla aprovat.
- **SKI-08 · mitjana · El «Mimetisme Empàtic» autoritza deduir i executar** — *Evidència:* `core-automillora/SKILL.md:15,35`. *Conflicte amb:* `sdp-workflow/SKILL.md:25,44`.
- **SKI-09 · mitjana · El disparador «core» és massa ample** — *Evidència:* `skills_index.json:115-118`; `persona_router.mjs:60` compara amb `includes` («score», «useCoreContent»).
- **SKI-11 · mitjana · Hi ha disparadors que no casen mai** — *Evidència:* `persona_router.mjs:54,60`; apòstrof tipogràfic a `sdp-casos-us-essencials/SKILL.md:10`.
- **SKI-14 · mitjana · Les Lliçons de `wiki-documentacio-i-reflex` s'anul·len entre elles** — *Evidència:* `SKILL.md:86` contra `:49` i `:82`.
- **SKI-15 · mitjana · `core-consell-i-colmena` §3 mana bundles Macro per a Claude i Codex** — *Evidència:* `SKILL.md:40-42`.
- **SKI-16 · mitjana · Telemetria caducada dins d'una skill canònica** — *Evidència:* `core-consell-i-colmena/SKILL.md:51-58` contra `consum_ia.csv:14`.
- **SKI-17 · mitjana · `wiki-propagar-veritat` fa un sed global per patró** — *Evidència:* `SKILL.md:30`. *Conflicte amb:* `sdp-workflow/SKILL.md:45` i AGENTS §5.
- **SKI-18 · mitjana · `wiki-busca-skills` no té camí per a promoure una skill** — *Evidència:* `SKILL.md:37`.
- **SKI-19 · mitjana · `sdp-workflow` mana llegir `90_arxiu_historic` i remet a si mateixa** — *Evidència:* `SKILL.md:21`, `:30`.
- **SKI-20 · mitjana · `sdp-pedra-seca` prescriu un token primitiu que ella mateixa prohibix** — *Evidència:* `SKILL.md:28` contra `:32`.
- **SKI-21 · mitjana · `sdp-universal-page` fixa valors crus** — *Evidència:* `SKILL.md:64,71`.

Baixes: SKI-10 (disparadors per subcadena: «ui» casa amb «aquí»), SKI-12 (`build_skills_index.mjs --check` no compara res), SKI-22 (filosofia en lloc de procediment), SKI-23 (diverses seqüències d'arrencada), SKI-24 (`tracker_consum.mjs` bloquejat i sense escapar cometes), SKI-25 (`core-edicio-segura` cita eines inexistents), SKI-26 (avisos «crida-inexistent» falsos al Mapa), SKI-27 (un `\n` literal davant de l'H1 en 4 skills), SKI-28 (`core-context-panic` no diu com registrar), SKI-29 (`sdp-calendari-agricola` «nativament amb Supabase»; · **Decisió humana**), SKI-30 (la recerca web és obligatòria però WebSearch i WebFetch queden bloquejades).

Refutades: cap.

**Cobertura i límits:** 22 SKILL.md llegides senceres. De `tancament.mjs`, `executor-mutacio.mjs`, `reflex_petorreta` i `desenterrar.mjs` només es va llegir la capçalera.

### Higiene de l'Escriptori (Missió 3)

#### Diagnòstic verificat

La maquinària de base és sòlida: les escriptures fan CAS, les portes fallen tancades davant d'un payload il·legible i la porta Olivera v2 ja existix al laboratori amb 8/8 proves verdes. El problema és la frontera. MarIA escriu des d'Antigravity, que no executa cap hook. La petorreta i el pla de les 01:30 es van escriure a mà, sense rebut i amb la taula bruta. Cap agent amb hooks pot arxivar de manera conforme, i la doctrina es contradiu sobre si cal buidar o conservar l'Escriptori.

**Recompte:** 18 troballes: 18 confirmades, 0 discutides, 0 refutades (severitats verificades: crítiques 0, altes 2, mitjanes 9, baixes 7).

- **HIG-01 · alta · MarIA escriu des d'un host sense porta: `.agents/hooks.json` no té cap consumidor acreditat** — *Evidència:* `.agents/hooks.json:2`; `260926_0130_prompt_auditoria_extrema.md:18`, una casella sense marcar que `porta-olivera.mjs:112` hauria bloquejat. *Conflicte amb:* wiki-cicle-de-vida §2. *Proposta:* un canari (`tooling/gates/hooks-canari.mjs`) com a primera entrada PreToolUse de `.agents/hooks.json` per acreditar o refutar el consumidor.
- **HIG-03 · alta · No hi ha cap camí conforme per a arxivar** — *Evidència:* `mutation-policy.mjs:43-51` només admet `--informe`; `PROTOCOL_PETORRETA.md:104`. *Conflicte amb:* AGENTS §5 i `core-higiene-escriptori/SKILL.md:17`. *Proposta:* `document.mjs arxiva` en tres fases (preparat; CAS, enllaç i despenjar l'àncora; fet o fallat), que refuse la zona humana i els documents vius. · **Decisió humana**
- **HIG-02 · mitjana · `document.mjs context/create` no mira l'Escriptori, i `hooks-local` autoritza l'ordre abans de passar per l'Olivera** — *Evidència:* `turns.mjs:86-101`; `hooks-local.mjs:89`. *Conflicte amb:* les lliçons 260922 i 260923. *Proposta:* la funció forçadora de sota.
- **HIG-04 · mitjana · La porta Olivera v2 i la skill v3 són al laboratori sense instal·lar** — *Evidència:* `tests/porta-olivera-v2.test.mjs:14-18` carrega primer la còpia del laboratori; `00_index_escriptori.md:51`. *Proposta:* fusionar-la amb `classifica()` i instal·lar-la amb l'executor.
- **HIG-05 · mitjana · La doctrina sobre la neteja es contradiu** — *Evidència:* `core-higiene-escriptori/SKILL.md:19` contra `porta-olivera.mjs:97`. *Conflicte amb:* AGENTS §12 i la lliçó 260923. *Proposta:* un criteri únic: conservar és ancorar; arxivar és `document.mjs arxiva`, un document cada vegada. · **Decisió humana**
- **HIG-06 · mitjana · La skill no es pot executar** — *Evidència:* `SKILL.md:19-20` demana `ls -l` i l'eina «només diagnostica». *Conflicte amb:* `mutation-policy.mjs:52-70`. *Proposta:* la reescriptura de sota.
- **HIG-08 · mitjana · La porta v1 decidix per data i ignora la Safata i el cognom** — *Evidència:* `porta-olivera.mjs:67-69`, `:72-74` (l'informe dona per bons dos plans 0130 de cognoms diferents). *Conflicte amb:* la lliçó 260922 del cognom exacte.
- **HIG-10 · mitjana · La petorreta 260926_0130 incomplix la seua plantilla** — *Evidència:* `:50-56` (el Context no porta el Context Mestre), `:99-105` (falta la clàusula AFK). *Conflicte amb:* `protocolledge.json:83-86`.
- **HIG-11 · mitjana · La neteja manual ha deixat àncores fantasma, documents sense àncora i un rebut orfe** — *Evidència:* `00_index_escriptori.md:267,269,278`; `torn_91799f10…json:1047`. *Proposta:* llevar eixes tres línies i ancorar les peces vives.
- **HIG-12 · mitjana · L'única IA sense porta és l'única autoritzada a escriure** — *Evidència:* `core-automillora/SKILL.md:20`; `.agents/hooks.json:2`.
- **HIG-16 · mitjana · L'índex de l'Escriptori té unes 52 àncores a 90_arxiu_historic** — *Evidència:* `00_index_escriptori.md:13`, `:43-46`. · **Decisió humana**

Baixes: HIG-07 (l'únic disparador de la skill no casa mai), HIG-09 (la plantilla del pla prescriu `pla_titol`), HIG-13 (l'Olivera és el pas 54 de 58 de la cadena), HIG-14 (branca Olivera de Bash inabastable), HIG-15 (`process.cwd()` i un ⚠️ per a un error), HIG-17 (el vigilant `--vigila` no té llançador; · **Decisió humana**), HIG-18 (despertar no dona cap veredicte d'higiene).

#### Per què va fallar, en tres línies

1. Totes les barreres existents viuen en hooks, i l'amfitrió de MarIA no n'executa cap.
2. El circuit sancionat (`document.mjs`) entrega la plantilla sense mirar la taula, i la casella «Escriptori classificat» és una autodeclaració.
3. No hi ha cap camí legal per a arxivar un document d'un altre torn. Qui neteja ho fa a mà i deixa fantasmes.

#### La funció forçadora: tres capes que no depenen de l'amfitrió

1. **Dins del circuit (bloqueja):** mòdul pur `tooling/documental/higiene.mjs` enganxat a `deliverContext`, de manera que cobrix `context` i `create`.
   - Per a les rutes `prompt.local`, `prompt.consell` i `pla.implementacio`, si la taula està bruta, no hi ha ni rebut ni plantilla. Llança `SDP_ESCRIPTORI_BRUT` amb la llista de documents i l'ordre exacta per a cada un.
   - «Brut» vol dir documents de torn anteriors al segell de sessió que no estan ancorats sota «## Activitat en curs», àncores fantasma, documents sense àncora i l'absència d'un Pla germà amb el mateix cognom.
   - La secció 0 de la petorreta l'escriu la màquina amb l'evidència (hora, revisats, pla germà i rebut), en lloc de caselles marcades a mà.
2. **Circuit d'arxiu (desbloqueja):** `document.mjs arxiva --turn-id ID --file CAMÍ`.
   - Trasllada amb CAS i enllaç sense sobreescriure i despenja l'àncora en el mateix acte.
   - Registra `turn.archived`. `checkTurn` ho accepta com a relleu i els torns aliens no queden intancables.
   - No toca mai `01_produccio` ni `02_investigacio_ia`.
3. **Vigilant i recordatoris (per al que s'escriu a mà):**
   - Encendre el vigilant existent: `node tooling/gates/porta-plantilla-viva.mjs --llancador` a `~/Library/LaunchAgents` i `launchctl load`. És una acció del Mestre al seu terminal.
   - `avisHigiene()` a `despertar.mjs` i al router.
   - Un canari per saber, de veritat, si Antigravity executa `.agents/hooks.json`.

**Proves (a escriure en roig abans d'instal·lar):** `tests/higiene-escriptori.test.mjs`, amb un torn que arriba a una taula bruta i no rep rebut, una àncora dins «Activitat en curs» que deixa passar, el Pla germà per cognom, la secció 0 automàtica, fantasmes que bloquegen i un pla propi escrit a mà que passa. A més, `tests/porta-olivera-v2.test.mjs` ha de carregar només `tooling/`.

**Instal·lació:** `tooling/` i `.agents/` són SECURITY_PATHS. Es fa amb `executor-mutacio.mjs`, un pla `sdp.mutation.v1`, una lease `governance-write` i el segell previ verd. Són més de 5 fitxers, per tant risc alt i Petorreta del Reflex. No ho he instal·lat perquè el hook no em deixa obrir cap lease (TRA-04, ENT-05).

#### Nova redacció de `core-higiene-escriptori` (llesta per a l'executor)

```markdown
---
type: skill
name: core-higiene-escriptori
description: Procediment per agranar l'Escriptori abans de crear qualsevol pla d'implementació, prompt o petorreta.
status: actiu
tags: [govern]
triggers_on:
  - petorreta
  - prompt per a
  - pla d'implementaci
  - escriptori
  - agrana
---

# Higiene de l'Escriptori

Quan: abans de crear un pla d'implementació, un prompt o una petorreta a `_wiki_de_poble/04_escriptori/`. Val per a tots els agents i tots els amfitrions.

## Passos
1. Diagnòstic: `node tooling/gates/porta-olivera.mjs --informe`. Si ix 0, ves al pas 4.
2. Decidix cada document que marca l'informe, d'un en un:
   - consumit (les conclusions ja són en un pla o una acta) → arxiva'l: `node tooling/wiki/document.mjs arxiva --turn-id ID --file CAMÍ` (mentre no existisca, MarIA: `node tooling/gates/porta-olivera.mjs --arxiva`);
   - encara viu → mou la seua àncora a «## Activitat en curs» de `00_index_escriptori.md`;
   - escrit a mà sense rebut → regularitza'l amb `document.mjs context` sobre el mateix nom;
   - àncora fantasma → reescriu-la amb la ruta on viu el document o lleva-la.
3. Repetix el pas 1 fins que isca 0.
4. Pla primer: `document.mjs context --route pla.implementacio --file 04_escriptori/AAMMDD_HHMM_pla_implementacio_COGNOM.md`; llig la plantilla sencera i fes `create`.
5. Petorreta després, amb el mateix segell i el mateix COGNOM: `context --route prompt.local` i `create`.
6. Fora d'abast: `01_produccio/` i `02_investigacio_ia/`. No s'esborra res. Un prompt o un pla no s'escriu mai directament amb l'eina d'escriptura.

## Lliçons del Mestre
- **260926** | Abans de generar cap pla o petorreta, agrana l'Escriptori: hi queden només els documents de la sessió en curs i els ancorats a «Activitat en curs». La neteja va primer, el pla després i la petorreta l'última.
```

#### Estat de la taula ara mateix

- Dos plans 0130: el de MarIA (`_pla_implementacio_claude`, sense rebut, que cap agent pot editar) i el d'este torn (`_pla_implementacio_auditoria_extrema`, amb el cognom de la petorreta i rebut). Proposta: arxivar el de MarIA quan existisca un circuit legal (HIG-03). No l'he mogut: no hi ha cap trasllat autoritzat per a documents d'un altre torn.
- Tres àncores fantasma a `00_index_escriptori.md` (HIG-11).

### Model d'usuaris, entitats i empreses, i el «Meu espai»

**Estat actual (amb evidència):**

- La BD ja té l'actor col·lectiu. `organizations` té quatre tipus, rols owner/admin/member, reclamacions i `author_org_id` validat per RLS (`supabase/migrations/260908_0000_initial_schema.sql:73-110`, `:123-138`, `:290-368`). El client no envia mai `author_org_id` (`src/data/supabase/content.js:59`, `:65-67`).
- «NOVA ORG» crea sempre una company «Organització nova» amb slug `org-<Date.now()>`, que després no es pot canviar (`PerfilShell.jsx:101-104`; `initial_schema.sql:863`). La fitxa `/empresa/<slug>` no es resol (`PerfilContext.jsx:59-60`).
- Els membres només tenen SELECT. Les reclamacions no tenen port ni pantalla. `moderador` no té cap funció (`initial_schema.sql:746`, `:837-842`, `:115-121`).
- Només els grups estan obligats a tindre propietària. `sollicita_reclamacio` no filtra per `kind`: qualsevol veí pot reclamar una empresa sense propietària (`initial_schema.sql:208-217`, `:303-321`).
- Promeses trencades: cap política llig `is_public`; `profiles.visibility` només admet 'private'; el botó Publicar d'una organització envia un PATCH buit (`DetallAjust.jsx:74-81`).
- Autoria: el trigger posa `full_name` a cada publicació; `IdentitatContext` accepta «entitat» sense validar la pertinença (`IdentitatContext.jsx:11`, `:21-28`).
- Les notes ja fan d'estudi: carpeta, classificació, `is_published` i revisió. La publicació porta el mateix id que la nota (`NotesContext.jsx:205-225`).

**Proposta:**

#### Principis
- Cap taula `agents` nova: persona = `profiles`; organització = `organizations`. Al client, l'actor és `{ tipus, id, kind?, nom, slug?, avatar?, rol? }`.
- La nota és la font i la publicació n'és la fotografia. Només hi ha una manera d'editar, amb l'editor que ja existix.
- Res nou a `CONTRACTE_NUCLI`: tot el que és nou va com a capacitat, consultada amb `teCapacitat()`.
- Les accions sensibles passen per RPC `security definer` amb `search_path=''`.
- Estadístiques sense vigilància: només es compta el que és propi.
- Slice nou `src/sections/espai/`, amb un `espaiModel.js` pur.

#### Actors i capacitats
- **Persona:** perfil privat per defecte.
- **Grup:** amb una organització mare i exactament una propietària.
- **Empresa:** es crea; cal decidir si s'exigix sempre una propietària.
- **Entitat i ajuntament:** es reclamen i reben el segell «verificada» o «oficial».
- **Rols dins de l'organització:** owner, admin, member i, si s'aprova, editor (publica però no administra). Owner i admin publiquen en nom de l'organització, editen la fitxa, retiren publicacions i conviden o lleven membres. Només owner transferix o arxiva.
- **Plataforma:** moderador i superadmin, amb una RPC que assigne rols.

#### El «Meu espai»
- **Rutes:** `/el-meu-espai` (amb `RequireAuth` i filtres per paràmetres) i `/el-meu-espai/identitats` (l'evolució de `PerfilShell`); `/el-meu-perfil` hi redirigix. La fitxa pública `/entitat/:slug` es declara abans del comodí `:sectionId/:itemId` (`App.jsx:573-574`).
- **Tres columnes amb peces existents:**
  1. Filtres: COM A, ESTAT, SECCIÓ, CATEGORIES i ETIQUETES.
  2. `NotaFitxa`.
  3. `NotesEditor`, amb les accions Actualitzar, Retirar i Vore al poble.
- Editar conserva `created_at`. Les publicacions sense nota tenen l'acció «Portar a l'estudi».
- Mercat i Events necessiten preu, data i lloc: la secció no es pot deduir només de la carpeta (`mapejadorSeccions.js:77`, `:94`).

#### Model de dades i privacitat
- **F1:** `section_submissions.updated_at`, un índex per `owner_user_id`, autoria que no es pot canviar i un estat de retirada propi.
- **F2-F3:** rol editor (`pot_publicar_com` en lloc de `can_manage_organization`), invitacions sense correus, `fitxa_organitzacio(slug)` per a anònims, i organitzacions que s'arxiven, no s'esborren.
- **Llei 05:** avisar que el servidor publica el nom complet, un sol camp de privacitat, dret d'oblit amb una funció de servidor, i moderació amb motiu d'una llista tancada.

#### Fases

| Fase | Abast | Esforç |
| --- | --- | --- |
| F0 | Honestedat: cap control promet el que no fa (is_public, Publicar, pertinença) | S |
| F1 | MVP «Les meues publicacions» | M |
| — | Revisió obligatòria | — |
| F2 | Publicar en nom d'una organització | M |
| F3 | Membres i reclamacions | L |
| F4 | Moderació i dret d'oblit | M/L |
| F5 | Capacitats d'empresa | XL |

**Correccions del crític incorporades:**
- L'índex per `author_org_id` ja existia.
- Els anònims no veuen les organitzacions per la taula base, no per la vista.
- «Retirar = DELETE» no casava amb el filtre «Retirades».
- Triar la secció per la carpeta degradava Mercat i Events.
- `IdentitatContext` es valida en la Fase 0.

**Preguntes obertes per al Mestre:**
- Pot una persona crear un grup sense organització mare?
- Una empresa ha de tindre sempre una propietària?
- Cal el rol editor?
- Retirar vol dir esborrar o ocultar i guardar com a memòria del poble?
- En editar, la publicació conserva la data o torna a pujar al Mur?
- En esborrar un compte, les publicacions s'anonimitzen o s'esborren?
- Quins camps mostra el perfil públic, i a qui?
- S'accepta que el servidor publique sempre el nom complet?
- Les invitacions es fan dins del directori o també per correu?
- Qui crea d'entrada les entitats i els ajuntaments, i quina prova es demana per a aprovar una reclamació?
- Mercat i Events es publicaran des de les notes?
- Una organització pot actuar en més d'un poble?
- Qui verifica en staging abans de la F1?

### Enxufabilitat global i federació d'instàncies

**Estat actual (amb evidència):**
- L'enxufabilitat és de backend i tot-o-res: 32 mètodes obligatoris i 10 d'opcionals en 5 capacitats (`src/data/contracte.js:2-60`). Injectar un backend en temps d'execució està denegat (`src/host.js:56`), i un document només parla amb un origen (`src/data/supabase/config.js:20-21`).
- El multi-poble només existix a l'esquema. La llavor crea una sola fila a `towns`, i ni `profiles` ni les taules del xat porten `tenant_id` (`supabase/seed.sql:4`; `initial_schema.sql:62-69`; `260908_xat_v2.sql:17-37`).
- `tenantId` i `language` es configuren en temps d'execució, però la marca i el domini estan escrits literalment (`src/hooks/seoHead.js:42`; `build-seo-manifest.mjs:187`).
- La identitat és local i sense handle, i la sessió externa no se'n verifica la signatura (`src/data/identitat.js:283-286`).
- Els identificadors no porten origen: les llistes es fusionen per `String(id)` (`src/data/mapejadorSeccions.js:139-155`).
- Els mitjans ja tenen forats: el bucket `mitjans` es pot llistar i `promoteToPublic` hi copia fitxers privats (`260913_0500_bucket_mitjans.sql:18-20`; `storage.js:162-186`).
- No hi ha cap servidor propi fora de l'SQL i les RPC. El plugin de WordPress només és l'IIFE, sense PHP (`vite.standalone.config.js:40-49`; BUI2-03).

**Proposta:**

#### Principis
- Federació només al servidor, tancada per defecte, amb llista blanca entre instàncies SdP, i opt-in per persona i per publicació.
- Primer cal arreglar la privacitat d'ara i després federar. El «carter» (la peça servidora) espera una segona instància real.
- Llei del Píxel: els filtres de «què vull vore de cada xarxa» són un redisseny i necessiten ordre.

#### Model
- Una instància és un domini, un backend, un carter i un paquet de cultura (idioma, vocabulari, calendari agrícola, marca). Sollutia fa d'amfitriona, no de centre.
- Correspondència amb ActivityStreams 2.0:
  - persona → `Person`;
  - organització → `Organization`;
  - poble → `Group` + `Place`;
  - Mur → `Note`/`Article`;
  - agenda → `Event`;
  - Connectar → `Add`.
- Les notes, el directori de membres i els xats no es federen mai.

#### Dades
- A `section_submissions`, en columnes calculades al servidor i mai llegides del payload:
  - `uri` i `origen`;
  - `audiencia`, amb el check `privat|poble|instancia|public|federat` i `poble` per defecte;
  - `lang`.
- `profiles.handle`.
- El contingut remot va a `fed_objectes_remots`, mai a `section_submissions`.
- La clau privada del carter és un secret fora de la BD.

#### Protocols per graons
1. RSS/Atom/JSON Feed i NodeInfo, només de lectura.
2. ActivityPub amb WebFinger i HTTP Signatures, entre instàncies SdP.
3. Matrix només per al xat, més avant o mai. AT Protocol, com a pont.

El sanejament al servidor és una peça nova: `sanitizeHtml` depén del DOM del navegador.

#### Fases
- **F0 · Sanejar el que hi ha:** ADR, mitjans, portes RLS, marca i domini a `src/config/instancia.js`.
- **F1 · Esquema additiu:** `uri`, `origen`, `audiencia`, `lang`, `handle` i pertinença a més d'un poble.
- **F2 · Lectura pública:** amb el text legal reescrit.
- **F3 · ActivityPub mínim:** quan hi haja una segona instància.
- **F4 · Obertura.**

Es pot preparar ja, sense cost: identificadors globals calculats al servidor, el camp d'origen i una configuració d'instància amb els valors d'ara.

**Correccions del crític incorporades:**
- El multi-poble només és a l'esquema: hi ha un sol tenant.
- El poble no és un literal de build.
- Els mitjans ja són públics i llistables.
- Una fusió per `uri ?? id` amb la URI presa del payload permetria suplantacions.
- La federació no és una capacitat del client.
- L'ADR Model B és un esborrany que el Mestre ha de signar abans de poder-lo esmenar.

**Preguntes obertes per al Mestre:**
- Un poble per instància (`legalContent.js:43`) o una instància amb molts pobles?
- Federació tancada entre instàncies SdP o oberta al fedivers?
- Handle `@persona@instància` o `@persona@poble.instància`?
- Nom real o pseudònim en federar?
- On viu el carter: Edge Functions, un servidor de Sollutia o un de propi?
- S'accepta una dependència nova per sanejar HTML al servidor?
- L'ADR-2026-09 es signa o es reescriu?
- WordPress és una instància pròpia o una finestra d'una altra?
- Xat: no es federa, es federa per Matrix, o s'accepten missatges directes d'ActivityPub (que no són privats)?
- Qui modera, i amb abast de poble o global?
- Qui és el responsable del tractament a cada instància?
- Poden altres instàncies usar la marca i Pedra Seca?
- Qui governa els paquets de cultura, i l'etiqueta és `ca-ES-valencia`?

### Segona ronda: buits detectats pel crític de completesa

El crític va deixar quatre buits, i els quatre es van investigar. Cap escèptic va refutar cap troballa. Quan els dos escèptics no coincidien en la severitat, s'ha aplicat la més baixa.

#### Migracions SQL no llegides i AdminSection: l'RLS real està sense auditar

Git seguix 16 migracions i `seed.sql`, i el README en deixa 7 sense nomenar. L'investigador refuta DAD-11 i, per inferència, DAD-08, DAD-12 i DAD-13. DAD-01 només queda refutada si s'aplica `260920_0300`, que el mateix fitxer declara «PROPOSTA».

- **BUI1-01 · alta · Qui es dona d'alta per primera vegada amb Google no pot acabar el registre: `handle_new_user` exigix un `tenant_id` que OAuth no envia** — *Evidència:* `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:51-59`; `src/data/oauthRelay.js:189-193`. *Conflicte amb:* `260914_0100_auditoria_rls_fixes.sql:16-22`, que usava `poble_per_defecte`. *Proposta:* recuperar `poble_per_defecte` quan falte el tenant i afegir una prova d'alta OAuth sense metadades.
- **BUI1-02 · mitjana · tractor-rls dona «zero forats» amb regles cegues** — *Evidència:* `tractor-rls.mjs:198`, `:204`. *Proposta:* analitzar tots els privilegis de cada GRANT i llevar l'exempció per nom.
- **BUI1-03 · mitjana · Les migracions no són idempotents** — *Evidència:* `initial_schema.sql:812-813`; `260915_0000…sql:20`. *Conflicte amb:* `supabase/README.md:57`. *Proposta:* `drop policy if exists` davant de cada `create` i una prova de doble aplicació.
- **BUI1-05 · mitjana · Qualsevol anònim pot llistar el bucket `mitjans` i traure'n uid i poble** — *Evidència:* `260913_0500_bucket_mitjans.sql:18-20`. *Proposta:* llevar la política SELECT per a anon.
- **BUI1-06 · mitjana · `promoteToPublic` falla sense avisar amb PDF i amb fitxers de més de 5 MB** — *Evidència:* `storage.js:176-180`; `260913_0500…sql:9-10`.
- **BUI1-07 · mitjana · La llista blanca d'`app_content` deixa buit `agents`, que el client encara demana** — *Evidència:* `content.js:75`; `runtime.js:122`. · **Decisió humana**

Baixes: BUI1-04 (el README no nomena totes les migracions i `260920_0300` és una «PROPOSTA» imprescindible; · **Decisió humana**), BUI1-08 (la política C2 reintroduïx el cicle P0-A; impacte nul hui), BUI1-09 (el xat mostra només els últims 50 missatges), BUI1-10 (no hi ha cap alta de superadmin documentada), BUI1-11 (`updateOrganization` envia columnes sense GRANT), BUI1-12 (consentiment RGPD amb un comentari fals, versió fixa i cap retirada), BUI1-13 (`created_by` dona lectura permanent; · **Decisió humana**).

#### Cadena de build, plugin de WordPress i SEO

El plugin no té cap PHP, i els índexs publicats no es refresquen: privatitzar un document no el despublica.

- **BUI2-01 · alta · Dos documents privats continuen a `slugIndex.json`, tant a `public/` com al plugin** — *Evidència:* `_wiki_de_poble/02_saber/pla_director_legal_i_subvencions.md:4`; `public/slugIndex.json:1`. *Conflicte amb:* `tooling/wiki/lib/publication-policy.mjs:18`. *Proposta:* un mode `--verifica` a `rag:build` i `slugs:build` dins de la cadena, i reconstruir. Rebaixada de crítica perquè l'índex només exposa títol i ruta.
- **BUI2-06 · alta · La portada redirigix a /xat, que és noindex, i el sitemap estàtic ho contradiu** — *Evidència:* `src/config/sections.js:34`; `public/sitemap.xml:3-7`. *Proposta:* portada pública i sitemap generat des de `seo-routes.json`.
- **BUI2-10 · alta · L'idioma triat no es conserva en recarregar** — *Evidència:* `UIContext.jsx:21-26`; `index.html:2`. *Proposta:* ordre de prioritat: configuració externa, valor desat, `lang` de l'HTML i valor per defecte.
- **BUI2-02 · mitjana · La política publica per exclusió: un document sense `visibility` ix públic** — *Evidència:* `publication-policy.mjs:2-3`; `perfil_psiquiatric.md:1-9`. *Proposta:* publicar només `visibility: public`, amb una porta que falle quan falte el camp.
- **BUI2-03 · mitjana · Sense PHP, ningú consumix `seo-routes.json` i la llei L8 no s'executa mai** — *Evidència:* `tractor-consell-core.mjs:280`; `wordpress-plugin/dist/seo-routes.json:285`. · **Decisió humana**
- **BUI2-04 · mitjana · L'ordre real del build contradiu els comentaris i deixa artefactes vells** — *Evidència:* `package.json:68`; `vite.standalone.config.js:38-41`.
- **BUI2-05 · mitjana · El target `es2022` no garantix Safari/iOS 16.0** — *Evidència:* `vite.config.js:67`; `vite.standalone.config.js:37`. *Conflicte amb:* el Baseline de QUI_SOC §5. *Proposta:* `['safari16','chrome100','firefox100']`.
- **BUI2-08 · mitjana · Amb MemoryRouter, useSEO pot escriure URL canòniques que no existixen** — *Evidència:* `useSEO.js:32`; `PedraSecaEmbed.jsx:413`.
- **BUI2-09 · mitjana · Els perfils /gent, /empresa, /ajuntament i /grup són indexables** — *Evidència:* `useSEO.js:6-8`; `RouteSEO.jsx:15`.
- **BUI2-11 · mitjana · es, en, eu i gl porten valors en valencià, i la porta L6 no ho detecta** — *Evidència:* `i18n.js:407-418`.
- **BUI2-12 · mitjana · El traductor ignora el text de reserva, i hi ha textos escrits directament al codi** — *Evidència:* `i18n.js:1857`; `App.jsx:219`.
- **BUI2-13 · mitjana · Es carrega Google Fonts tot i tindre la font local, i la CSP de producció admet localhost** — *Evidència:* `index.html:8`, `:10-12`. *Conflicte amb:* el principi de sobirania (QUI_SOC §1).

Baixes: BUI2-07 (etiquetes og fixes i rutes MOCK_ a `seo-routes.json`), BUI2-14 (`contingencia_offline.md` descriu una PWA inexistent), BUI2-15 (`build_slug_index.mjs:62` ix 0 encara que falle).

#### Proves sense executar a escala i CI inexistent

En el moment de la investigació, Vitest complet donava 757 proves en 76 fitxers, amb 2 fallades: era la regressió BUI3-02, ja corregida en este torn. Node donava 161 proves en 20 fitxers, amb 1 fallada. Cap de les xifres de l'ESTAT (514, 738 i 304) es reproduïx tal com s'anuncia.

- **BUI3-01 · alta · No hi ha CI: «la CI» és el pre-commit, que s'atura a la primera porta roja** — *Evidència:* `run-portes.mjs:114-118`; `git-staged.mjs:40-44`. *Proposta:* un workflow mínim a Linux (lint, Vitest, `node --test` i build) que guarde els comptadors.
- **BUI3-03 · mitjana · Les xifres verdes de l'ESTAT no deixen cap registre** — *Evidència:* `tancament.mjs:15-21`. *Proposta:* que `tancament --close` amb abast code registre comptadors i el hash de l'arbre.

Baixes: BUI3-02 (la comparació de `UniversalCard` distingia majúscules i trencava 2 proves de `NotaFitxa`; **corregida** en este torn), BUI3-04 (cap ordre declarada executa més de 7 fitxers Node), BUI3-05 (`tests/cerca-sessio.test.mjs:32-44` no té cap assert), BUI3-06 (la branca `process.env.CI` fallaria amb `mock-anon-key`), BUI3-07 (el pre-commit repetix lint i Vitest dins de 120 s).

#### Cost dels hooks i seccions del front sense llegir

- **BUI4-01 · alta · PreToolUse deixa passar l'eina si falla qualsevol import** — *Evidència:* `hooks-local.mjs:6-14`; `tooling/documental/core.mjs:6`. És el mateix que TRA-02.
- **BUI4-02 · mitjana · Si falta una font de `contextLocal`, es bloquegen totes les eines, Read inclòs** — *Evidència:* `hooks-local.mjs:77`.
- **BUI4-05 · mitjana · L'allowlist denega Skill, StructuredOutput i SubagentHandback** — És el mateix que ENT-01.
- **BUI4-06 · mitjana · Read no mira la ruta: `.env` i `90_arxiu_historic` queden oberts** — *Evidència:* `mutation-policy.mjs:53`. *Conflicte amb:* AGENTS §5.
- **BUI4-10 · mitjana · Es desa el poble fix «La Torre de les Maçanes» en un sistema amb molts pobles** — *Evidència:* `ConnectarSection.jsx:82`, `:97`.
- **BUI4-12 · mitjana · Al Mercat, a Multimèdia i a Població, un error remot es mostra com una llista buida** — *Evidència:* `MercatSection.jsx:13`; `MurContext.jsx:27`.
- **BUI4-13 · mitjana · Les imatges de tercers no tenen restricció d'origen ni referrerpolicy** — *Evidència:* `UniversalUtils.js:13-17`.
- **BUI4-14 · mitjana · «Dispositius/P2P» no connecta aparells, només pestanyes del mateix navegador** — *Evidència:* `devicesRuntime.js:111`.
- **BUI4-15 · mitjana · El botó IA porta tothom a /realitat, que és només per al superadmin** — *Evidència:* `App.jsx:343`, `:531`.

Baixes: BUI4-03 (dos processos node per crida), BUI4-04 (el mateix context s'injecta a cada eina), BUI4-07 (despertar no reconeix el capçal ISO), BUI4-08 (hooks de sessió sense timeout), BUI4-09 (`isPrivate` sempre val true; · **Decisió humana**), BUI4-11 (al Mercat, Connectar no arriba al venedor), BUI4-16 (`listPath '/events'` porta a una 404).

### Millores proposades a la petorreta (Olivera §4)

- **Generar-la amb el circuit.** La petorreta 0130 duu el rebut com a marcador (`sdp:torn…:…`), una casella sense marcar i un Context sense el Context Mestre (CER-19, HIG-10). Si hagués nascut de `document.mjs create`, la plantilla ho hauria impedit.
- **Una missió per petorreta.** Tres missions (refactor, auditoria de tot el sistema i reparació d'un tractor) en una nit no es poden tancar amb qualitat: la segona es menja la tercera. Proposta: una petorreta per missió i un pla germà per a cada una.
- **Dir als agents amb quines eines compten.** Sense Glob ni Grep, i amb el lliurament estructurat bloquejat, un agent perd una hora descobrint-ho (ENT-01, ENT-02).
- **Nom de fitxer demanat.** La petorreta demana `AAMMDD_HHMM_auditoria_claude.md`, i el catàleg de categories ho admet. Correcte.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Mètode (tres fases separades, cacera i refutació):**

1. **Cacera:** nou agents independents, un per dimensió: front-end, disseny, dades, skills, tractors, cervell, higiene, usuaris i federació. Com que el hook bloqueja el lliurament estructurat, els informes es van rescatar dels seus fils. Tractors es va refer des de zero.
2. **Refutació:** dos escèptics per dimensió, amb lents diferents (fets i impacte/vigència). Tenien ordre de refutar i de llegir ells mateixos cada cita. Per a les dues propostes de disseny hi va haver un crític arquitectònic, i les seues correccions s'han incorporat.
3. **Completesa:** un crític de buits i quatre investigacions de segona ronda, verificades també per dos escèptics cadascuna.

**Resultats:** 235 troballes: 234 confirmades i 1 refutada (CER-26, ja corregida). Els escèptics van rebaixar la severitat en unes trenta troballes. La taxa de refutació (0,4 %) és molt més baixa que la històrica del projecte (~27 %). Pot ser mèrit de les cites obligatòries, o que els escèptics hagen estat massa condescendents. Es recomana una mostra de contrast humana.

**Missió 1 (fet executat, no afirmat):**
- `npx vitest run src`: 72 fitxers, 738/738 proves, després de les correccions.
- `npx vitest run src/sections/consola src/components/PedraSeca src/sections/disseny`: 227/227.
- Navegador (`localhost:3340/consola`, `/consola/pols`, `/consola/calendari`, `/consola/inventari`): anatomia de targeta, detalls de Consums, Crèdits, Rebuts i Skills, diàleg de fonts, panell de molla i peu, mode fosc, 375 px i graella a 500 px.
- Revisió adversarial del canvi: 13 troballes, 9 corregides.

**No executat:** el lint (no és a la llista blanca), el build, `node --test` sencer, `run-portes` i `tancament.mjs` (bloquejat, ENT-05).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense Glob ni Grep, i amb la shell limitada, cap agent ha pogut fer cerques exhaustives. Els censos d'ús i de codi mort són parcials (ENT-02).
- No s'ha llegit `90_arxiu_historic` (AGENTS §5). No s'ha verificat el Supabase remot ni les 7-8 migracions que no documenta el README en un entorn real. Tampoc s'ha verificat si Antigravity executa `.agents/hooks.json`.
- L'arbre és concurrent: les línies citades d'ESTAT i LEDGER poden haver-se desplaçat.
- Una interrupció de quatre hores pel límit d'ús va obligar a reprendre la verificació. Els vots de diversos escèptics són de la segona execució.
- Les propostes d'usuaris i de federació són disseny, no implementació: no s'hi ha aplicat cap canvi.
- No s'ha instal·lat cap canvi a `tooling/` ni a `.agents/`: no hi ha lease (TRA-04). Les propostes de la Missió 3 queden llestes per a l'executor.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_0130_pla_implementacio_auditoria_extrema]]
- [[260926_0130_prompt_auditoria_extrema]]
