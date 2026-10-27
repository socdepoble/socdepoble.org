---
type: informe
status: esborrany
description: 'Dictamen adversarial Gauntlet R5 sobre Descàrregues, converses, TOC i Notes, enllaços de la Wiki i baremador del Nano.'
tags:
  - auditoria
  - arquitectura
  - seguretat
visibility: private
reflex: sdp:torn_51d1660b-c6e1-4cad-a261-92a7776ab0a8:1e692e0b-014a-4ba4-8fa2-a74eb82805cd
---

# Auditoria Adversarial Gauntlet · Ronda 5 Claude (`torn_51d1660b`)

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | `AUD-20261027-0550-GEMINI-GAUNTLET-R5` |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T04:50:00.000Z |
| Modificació | 2026-10-27T04:52:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini (`IAIA MarIA` · Auditor Tècnic Adversarial Gauntlet) |
| Tokens consumits | ~95.000 tokens en el fil principal d'auditoria |
| Torn auditat | `torn_51d1660b` (Claude Opus 5.5, Ronda 5, documentat a [[261026_2150_auditoria_claude]]) |
| Estat global | **AMB OBJECCIONS (`2 BLOQUEJANTS`, `6 DEFECTES`, `3 MILLORES`)** |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

1. **Verificació de regles i fonts de veritat:** Contrastat el diff viu (`git status` i `git diff`) contra `AGENTS.md`, [[03_llibre_mestre_tasques_i_idees]] (`P1-38` a `P1-62`), [[identitat_visual]] i [[auditoria_canonica]].
2. **Inspecció estàtica de codi línia a línia:** Revisats els components React, fulls d'estil CSS (`base.css`, `layout.css`, `modules.css`) i scripts del compilador documental.
3. **Execució de portes de lectura:** Executat `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` amb resultat d'eixida `0` (`74 enllaços apunten a documents existents fora del manifest públic; només se n'ha comprovat el nom. Totes les rutes de la Wiki estan ben enllaçades`).
4. **Avaluació adversarial de paquets de laboratori:** Auditades les 1.576 línies de `baremador_nano.mjs` i el pedaç `261026_2130_scc_arxiu_per_nom.patch` per detectar col·lisions amb `turns.mjs`, duplicitats funcionals amb `P1-42` i deute tècnic a `90_arxiu_historic/`.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-26 21:50` — Claude Opus 5.5 emet [[261026_2150_auditoria_claude]] amb el tancament de la Ronda 5 sobre el torn `torn_51d1660b`.
- `2026-10-27 05:35` — Obertura del protocol Gauntlet Loop ([[261027_0535_pla_implementacio_auditoria_gauntlet_ronda5_claude]]).
- `2026-10-27 05:50` — Emissió d'aquest dictamen adversarial independent per part de Gemini (`IAIA MarIA`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum Executiu per Carrils

| Carril | Fita | Veredicte del Carril | Resum Tècnic |
| :--- | :--- | :--- | :--- |
| **Carril 1 · Card de Descàrregues** | `P1-38` | **AMB BLOQUEJANTS (`G1-01`, `G1-02`) i DEFECTES (`G1-03`, `G1-04`)** | El botó `[ Descarrega l'App ]` de `48px` s'amaga correctament en natiu dins `AccesAlXat` (`!esAppNativa()`) i `PAGE_COPY.descarregues` no té cap enllaç extern a botigues buides (`0` etiquetes `<a href>`). Tanmateix, la pàgina `/page/descarregues` continua exposada com a **primera targeta del `/mur`** i accessible dins del binari iOS amb mencions explícites a `Android`, `Google Play` i `APK directe` (risc greu de rebuig Apple App Store Guideline 2.3.10). A més, la imatge descartada `nano_descarregues_gamberro` segueix a `public/` trencant `censImatges.test.js`. |
| **Carril 2 · Fantasma dels 10px** | `P1-53` | **APROVAT AMB DEFECTES (`G2-01`, `G2-02`) i MILLORA (`G2-03`)** | `.sdp-xat-llista--converses > li { margin-bottom: 0; padding-left: 0; }` neutralitza l'herència de `base.css` (`8px` marge + `4px` farciment + `1px` vora = `~105px`) i deixa les files de `LlistaConverses` a **96px exactes** línia a línia. Però haver aplicat el pegat només al modificador `--converses` deixa el mateix bug fantasma viu en **11 llistes germanes** que usen `.sdp-xat-llista`. L'avatar de `76px` trunca noms a l'escriptori de 3 columnes (`1280px`). |
| **Carril 3 · Calaix TOC i Notes** | `§5` i `§6` | **APROVAT AMB DEFECTE MENOR (`G3-01`) i MILLORES (`G3-02`, `G3-03`)** | El calaix TOC cobreix de l'`H1` a l'`H6`, obri netament sota la barra negra de `64px` (`top: calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`) sense tapar el crom ni fer saltar l'scroll, i **s'ha eliminat d'arrel el bucle infinit a Notes** en deixar de mutar `el.id` i `el.dataset` dins de `[contenteditable]` i estabilitzar `tancaIndex` amb `useCallback`. Resta un defecte si `header.page-title` es munta tardanament i l'aplanament de pesos `H3–H6` en mode Bancal. |
| **Carril 4 · Salfumant de la Wiki** | `P1-39` | **COMPILA NET (`0` errors) · DEFECTE D'ARQUITECTURA (`G4-01`, `G4-02`)** | `compile-wiki-to-app.mjs --check --strict` passa amb `0` errors. Però els 190 enllaços reescrits amb ruta relativa cablejada (`../90_arxiu_historic/...`) a l'arbre viu creen deute tècnic fràgil davant `porta-olivera.mjs --arxiva --sessio`. **Dictamen:** Cal aplicar el pedaç preparat `261026_2130_scc_arxiu_per_nom.patch` (que és segur, net i no llig contingut d'arxiu) juntament amb `261026_2310_compile_wiki_codi_literal.patch`. |
| **Carril 5 · Baremador del Nano** | `P1-41` vs `P1-42` | **REBUTJAT COM A MOTOR INDEPENDENT (`G5-01`, `G5-02`) · DICTAMEN: FONDRE AMB `P1-42`** | El paquet `baremador_nano.mjs` (`1.576` línies, escala `1–10`, 4 motius simples, escriptura directa a `.agents/qualificacions_nano.json`) **viola frontalment el Principi d'Unificació Arquitectònica de `P1-42`** (escala d'1 a 5 estrelles + 10 atributs del catàleg UOC integrats a `/multimedia`) i **trenca `turns.mjs` / `tancament`** per escriure dins `.agents/`. S'ha de **fondre** dins `P1-42`, aprofitant només la plantilla `prompt_nano_banana.md`, l'actualització d'`identitat_visual.md` i les constants pures de generació de prompts. |

---

### Detall de Troballes (Format Canònic)

#### `[BLOQUEJANT]` `G1-01` — Filtració de mencions a Android, Google Play i APK dins l'entorn natiu iOS (`/mur` i `/page/descarregues`)
- **Severitat:** `[BLOQUEJANT]` (per a l'entrega iOS App Store Connect; confirma i eleva `T1-02`)
- **Abast:** `src/config/systemPages.js` (`SYSTEM_PAGES`, línia 102), `src/sections/text/pageContent.js` (`PAGE_COPY.descarregues`, línies 487–503), `src/sections/xat/XatSection.jsx` (`AccesAlXat`, línia 1736).
- **Evidència reproduïble:**
  1. Dins `AccesAlXat` (`src/sections/xat/XatSection.jsx:1736-1740`), el botó noble de `48px` `[ Descarrega l'App ]` està correctament protegit per `!esAppNativa()`.
  2. Tanmateix, `SYSTEM_PAGES` (`src/config/systemPages.js:102`) registra incondicionalment `{ key: 'descarregues', isAvis: false, href: '/page/descarregues' }` amb data `2026-10-26T22:07:00+01:00` (`src/sections/text/pageContent.js:491`).
  3. Com que és la pàgina del sistema amb data més recent, **apareix com a primera targeta destacada a `/mur`** també quan l'aplicació corre empaquetada dins d'iOS (`Capacitor` natiu). En tocar la targeta (o navegar a `/page/descarregues` o `/descarregues`), es renderitza `PAGE_COPY.descarregues.html`, que conté literalment `<h3>Android</h3>`, `<h4>Google Play</h4>`, `<h4>APK directe</h4>` i instruccions per a `Chrome a Android`.
- **Font de veritat afectada:** Apple App Store Review Guidelines §2.3.10 (*"Don't include names, icons, or imagery of other mobile platforms in your app or metadata"*), fita `P1-38` de [[03_llibre_mestre_tasques_i_idees]] i `AGENTS.md §2`.
- **Proposta conservadora:**
  1. Filtrar l'entrada `descarregues` de `SYSTEM_PAGES` (o en `usePaginesDelSistema`) quan `esAppNativa()` siga `true`, de manera que una app nativa ja instal·lada no mostre una targeta d'instal·lació de l'app al `/mur`.
  2. Si es vol mantindre la ruta `/page/descarregues` accessible per URL interna en natiu, condicionar el bloc HTML o redirigir a `/mur` quan `esAppNativa()` siga `true`.
- **`requires_human_decision`:** `false` (és una protecció obligatòria per superar la revisió d'Apple).

---

#### `[BLOQUEJANT]` `G1-02` — Parella d'imatges descartades a `public/assets/uploads/brain/nano_descarregues_gamberro.*` trenca `censImatges.test.js` i la Zero Text Rule (`T1-03` i `T1-01`)
- **Severitat:** `[BLOQUEJANT]` (trenca `npm run test:precommit` en dos punts: test unitari de cens d'imatges i porta `frontissa-contingut.mjs`)
- **Abast:** `public/assets/uploads/brain/nano_descarregues_gamberro.jpg`, `public/assets/uploads/brain/nano_descarregues_gamberro.webp` i `src/sections/text/pageContent.js` (`PAGE_COPY.descarregues`).
- **Evidència reproduïble:**
  1. Els fitxers `public/assets/uploads/brain/nano_descarregues_gamberro.jpg` i `.webp` han quedat sense seguiment (`untracked`) dins `public/assets/uploads/brain/`. Com que no estan referenciats al codi ni inclosos al conjunt `EXCLOSES` de `src/sections/multimedia/censImatges.js`, el test `src/sections/multimedia/__tests__/censImatges.test.js` falla reclamant `1` imatge òrfena.
  2. A més, eixa imatge conté bafarades amb text en castellà (*«¡Bájate la App, forastero!»*) i marc blanc perimetral, violant la *Zero Text Rule* i la regla *Full Bleed* d'[[identitat_visual]] (§5.2).
  3. Paral·lelament, l'alta de `PAGE_COPY.descarregues` a `src/sections/text/pageContent.js` bloqueja `tooling/gates/frontissa-contingut.mjs` fins que s'execute l'aprovació humana explícita.
- **Font de veritat afectada:** `src/sections/multimedia/__tests__/censImatges.test.js`, [[identitat_visual]] §5.2 i `AGENTS.md §8` (`frontissa-contingut.mjs`).
- **Proposta conservadora:**
  1. Eliminar immediatament `public/assets/uploads/brain/nano_descarregues_gamberro.jpg` i `.webp` (conservant la còpia d'estudi a `_wiki_de_poble/04_escriptori/01_produccio/nano_descarregues_gamberro.jpg` per a l'històric de `P1-42`).
  2. Executar `node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per Javi` un cop aplicat el filtre natiu de `G1-01`.
- **`requires_human_decision`:** `true` (l'aprovació de `frontissa-contingut.mjs` és prerrogativa exclusiva de Javi segons `AGENTS.md §8`).

---

#### `[DEFECTE]` `G1-03` — El peu `AccesAlXat` (ara 60px més alt) es continua injectant dins de les converses actives (`P1-54`)
- **Severitat:** `[DEFECTE]`
- **Abast:** `src/sections/xat/XatSection.jsx` (`AccesAlXat`, línies 1711–1748 i pas de `peu={acces}` a `Conversa`).
- **Evidència reproduïble:**
  1. L'afegit del botó `.sdp-xat-acces__descarrega` (`min-height: var(--sdp-touch)` = `48px` + `margin-top: var(--sdp-space-3)` = `12px`) incrementa l'alçària del bloc `AccesAlXat` en `60px`.
  2. En mode foraster (sense sessió iniciada), `XatSection.jsx` passa `peu={acces}` tant a la portada de benvinguda com al peu de qualsevol conversa oberta (`Conversa.jsx`). Dins d'una conversa activa, aquest bloc gegant amb `[ Inicia sessió ]`, `[ Crea el teu compte ]`, `[ Explorar com a foraster ]` i ara `[ Descarrega l'App ]` redueix dràsticament l'espai de lectura dels missatges.
- **Font de veritat afectada:** Fita `P1-54` de [[03_llibre_mestre_tasques_i_idees]] (*Neteja de Redundància al Xat: "Sense Empapussar al Foraster"*).
- **Proposta conservadora:** Renderitzar el bloc complet `AccesAlXat` únicament a la portada del xat (`BenvingudaXat`), i dins d'una conversa oberta mostrar només una píndola compacta d'1 línia per iniciar sessió si l'usuari vol escriure.
- **`requires_human_decision`:** `false`.

---

#### `[DEFECTE]` `G2-01` — La correcció del fantasma dels 10px s'ha limitat a `.sdp-xat-llista--converses > li` i deixa el mateix bug actiu en 11 llistes germanes del Xat (`T4-05`)
- **Severitat:** `[DEFECTE]`
- **Abast:** `src/css/modules.css` (línies 3392–3401) i `src/sections/xat/components/LlistaConverses.jsx` (línia 114).
- **Evidència reproduïble:**
  1. **Verificació del Carril 2.1 (les files de conversa):** En `LlistaConverses.jsx:114`, l'afegit de la classe `sdp-xat-llista--converses` i la regla `.sdp-xat-llista--converses > li { margin-bottom: 0; padding-left: 0; }` (`src/css/modules.css:3397-3400`) elimina efectivament el `margin-bottom: var(--sdp-li-gap)` (`8px`) i `padding-left: var(--sdp-space-1)` (`4px`) heretats del selector global `li` de `src/css/base.css:101-104`. Amb això, cada `li` mesura `97px` (`96px` de `button.sdp-xat-fila` + `1px` de `border-bottom`) sense cap buit fantasma ni sagnat esquerre.
  2. **Verificació del Carril 2.2 (impacte en altres llistes del xat):** En haver creat un modificador específic `--converses` en lloc d'aplicar el reset sobre la classe base `.sdp-xat-llista > li`, **totes les altres 11 llistes del mòdul de xat** que usen `<ul className="sdp-xat-llista">` continuen patint exactament el mateix bug fantasma de `8px` de marge inferior i `4px` de `padding-left` en cada `<li>`:
     - `src/sections/xat/components/ResultatsCercaXat.jsx` (línia 45)
     - `src/sections/xat/components/VistaComunitats.jsx` (línia 93)
     - `src/sections/xat/components/FitxaComunitat.jsx` (línies 168 i 224)
     - `src/sections/xat/components/DialegNovaConversa.jsx` (línies 156, 200 i 272)
     - `src/sections/xat/components/DialegCompartir.jsx` (línia 71)
     - `src/sections/xat/components/VistaMultimedia.jsx` (línia 90)
     - `src/sections/xat/XatControlSection.jsx` (línia 338)
     - `src/sections/disseny/AssignacioEmoji.jsx`, `EspecimenXat.jsx`, `EspecimenXatLlista.jsx`
- **Font de veritat afectada:** Fita `P1-53` de [[03_llibre_mestre_tasques_i_idees]] (*El Fantasma dels 10px d'Aire a les Converses*).
- **Proposta conservadora:** Moure `margin-bottom: 0; padding-left: 0;` directament a `.sdp-xat-llista > li` en `src/css/modules.css:3392`, eliminant la necessitat del modificador `--converses`. Cap llista que ja declara `list-style: none; margin: 0; padding: 0;` al seu `<ul>` vol heretar el marge tipogràfic d'articles de `base.css`.
- **`requires_human_decision`:** `false`.

---

#### `[DEFECTE]` `G2-02` — Truncament sever de noms de conversa a l'escriptori (`1280px`) i del comptador de `BarraSeleccio` en mòbil (`375px`) (`T4-01` i `T4-02`)
- **Severitat:** `[DEFECTE]`
- **Abast:** `src/css/modules.css` (`--sdp-xat-avatar-mida: 76px` a línia 3260; `.sdp-xat-barra-seleccio` a línies 3340–3390) i `src/sections/xat/components/BarraSeleccio.jsx`.
- **Evidència reproduïble:**
  1. En passar `--sdp-xat-avatar-mida` de `56px` a `76px` (`calc(var(--sdp-xat-fila-mida) - (2 * var(--sdp-xat-avatar-aire)))`), dins del layout d'escriptori a 3 columnes (`1280px`, on la columna de converses té entre `280px` i `311px`), l'avatar (`76px`) + paddings (`32px`) + gap (`12px`) + data (`~48px`) deixen només `112px–136px` per a `.sdp-xat-fila__nom` (`18px`, `font-weight: 700`). Títols curts com «Gent de la Torre» (`161px`) o «Javi Llinares» (`120px`) es tallen amb punts suspensius (`Gent de la…`, `Javi Llinar…`).
  2. En mòbil (`375px`), quan s'activa el mode selecció per pulsació llarga, `BarraSeleccio` renderitza el botó «Marcar com a llegides» amb text complet en una sola línia, deixant només `100px` al títol `.sdp-xat-barra-seleccio__titol` i truncant «1 seleccionada» a «1 seleccio…».
- **Font de veritat afectada:** Regla d'Or de Pedra Seca i fites `P1-52` / `P1-59` de [[03_llibre_mestre_tasques_i_idees]].
- **Proposta conservadora:**
  1. Ajustar `--sdp-xat-avatar-mida` amb `clamp(56px, 18cqi, 76px)` (definint `container-type: inline-size` a `.sdp-xat-llista`) o reduir l'avatar a `60px–64px` quan la columna siga estreta, i portar l'alçària de `.sdp-xat-fila__cos` a `72px` per encabir còmodament les dues línies d'extracte a `1.35` d'interlineat.
  2. Abreviar el botó d'acció en mòbil a «Llegides» (o icona + etiqueta responsiva) dins `BarraSeleccio.jsx`.
- **`requires_human_decision`:** `false`.

---

#### `[DEFECTE]` `G3-01` — El calaix TOC (`TableOfContentsDrawer`) no observa `header.page-title` si la capçalera es munta asíncronament després d'obrir l'índex (`T3-04`)
- **Severitat:** `[DEFECTE]` (cas extrem en pàgines amb càrrega diferida de títol)
- **Abast:** `src/components/universal/PageFrame.jsx` (línies 264–318).
- **Evidència reproduïble:**
  1. **Verificació del Carril 3.1 i 3.2 (el que està resolt):**
     - `.toc-overlay` (`src/css/modules.css:1981-1995` i `src/css/layout.css:63`) obri exactament a `top: calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))` (`64px`) sense tapar la barra negra superior.
     - L'escala jeràrquica cobreix de l'`H1` (`titolDeLIndex(capcalera)`) fins a l'`H6` (`NIVELL_INDEX_PER_DEFECTE = 6`), amb tokens de Pedra Seca i sense fer saltar l'scroll gràcies a `desplacaASeccio` i `focus({ preventScroll: true })`.
     - **El bucle infinit a Notes està totalment eliminat:** `esEditable(el)` (`PageFrame.jsx:240-241, 277`) evita mutar `el.id` i `el.dataset.sdpTocGenerated` dins l'editor TipTap (`[contenteditable]`), tallant el cicle amb el `MutationObserver`, i `tancaIndex` està memoritzat amb `useCallback` (`PageFrame.jsx:675`).
  2. **El defecte residual:** En `PageFrame.jsx:268`, l'efecte fa `const capcalera = capcaleraRef?.current || null;` només en el moment d'executar el `useEffect([isOpen, contentRef, capcaleraRef, nivellMaxim])`. Com que `capcaleraRef` és un objecte ref mutable que no dispara re-execució de l'efecte quan `.current` canvia de `null` a un node `<header>`, si el títol es resol després d'obrir el calaix, `titolDeLIndex(capcalera)` rep `null` i l'`H1` no apareix a l'índex.
- **Font de veritat afectada:** `src/components/universal/PageFrame.jsx` (`TableOfContentsDrawer`).
- **Proposta conservadora:** Llegir `capcaleraRef?.current` dinàmicament dins de `buildToc()` (`const capcaleraActual = capcaleraRef?.current || null; const titolPrincipal = titolDeLIndex(capcaleraActual);`) en lloc de capturar-lo una sola vegada fora de `buildToc`.
- **`requires_human_decision`:** `false`.

---

#### `[DEFECTE]` `G4-01` — Les 190 rutes relatives cablejades a `../90_arxiu_historic/` creen deute tècnic fràgil; cal aplicar el pedaç de resolució per nom (`P1-39`)
- **Severitat:** `[DEFECTE]` (deute tècnic estructural al compilador i verificadors SCC)
- **Abast:** 52 documents modificats a `_wiki_de_poble/`, `tooling/lib/document-links.mjs` i el paquet `_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/`.
- **Evidència reproduïble:**
  1. **Estat actual del compilador:** Executat `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` a `socdepoble.org`, retorna `0` errors (`74 enllaços apunten a documents existents fora del manifest públic; només se n'ha comprovat el nom. Totes les rutes de la Wiki estan ben enllaçades`). Nota: l'script real al repositori és `tooling/wiki/compile-wiki-to-app.mjs` (no `compilador_wiki.mjs`).
  2. **Per què la reparació en viu crea deute tècnic si no s'aplica el pedaç:** Per no tocar `tooling/` en calent durant la Ronda 5, Claude va reescriure 190 enllaços com a rutes relatives cablejades (`[[../90_arxiu_historic/nom|nom]]` o `[nom](../90_arxiu_historic/nom.md)`), 46 com a codi en línia (`nom`) (fitxers inexistents) i 12 exemples literals a `03_llibre_d_or_memoria_episodica.md` sense `[[...]]`.
  3. Això té dos problemes greus de manteniment:
     - Cada vegada que `porta-olivera.mjs --arxiva` moga un document de `04_escriptori/` a `90_arxiu_historic/`, tots els enllaços nus `[[nom]]` des d'altres documents vius es trencaran immediatament en `verificador-scc`, `tractor-orfandat` i `tractor-frontmatter`.
     - Quan `porta-olivera.mjs --arxiva --sessio <nom>` agrupe documents dins d'una subcarpeta de sessió (`90_arxiu_historic/261027_Sessio_X/nom.md`), les rutes relatives cablejades `../90_arxiu_historic/nom` es tornaran a trencar.
  4. **Auditoria del pedaç `261026_2130_scc_arxiu_per_nom.patch`:** El pedaç és **resilient, net i segur**. Incorpora `nomsArxiuHistoric(root)` a `tooling/lib/document-links.mjs` usant exclusivament `readdirSync` i `lstatSync` (sense fer `readFileSync` sobre l'arxiu històric, complint estrictament `AGENTS.md §5`), rebutja enllaços simbòlics, comprova `inside(canonical(root), ...)` i resol `[[nom]]` per nom base (fins i tot dins subcarpetes de sessió de `90_arxiu_historic/`) només com a *fallback* quan no hi ha cap document viu amb eixe nom. Si hi ha 2+ homònims arxivats, falla amb `Enllaç ambigu`. A més, els arxivats no entren a `files`, de manera que no falsifiquen ni l'orfandat ni el requisit F9 d'enllaç intern viu.
- **Font de veritat afectada:** `AGENTS.md §5`, fita `P1-39` de [[03_llibre_mestre_tasques_i_idees]] i `tooling/lib/document-links.mjs`.
- **Proposta conservadora (Dictamen Carril 4):**
  1. **Aprovar i aplicar** el pedaç `_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/261026_2130_scc_arxiu_per_nom.patch` via `executor-mutacio.mjs`.
  2. **Aprovar i aplicar** també `_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/261026_2310_compile_wiki_codi_literal.patch` (perquè `compile-wiki-to-app.mjs` ignore `[[x]]` dins de backticks i blocs de codi igual que ja fa `document-links.mjs`) i revertir els 12 canvis cosmètics de `03_llibre_d_or_memoria_episodica.md`.
- **`requires_human_decision`:** `true` (modificació de `tooling/lib/document-links.mjs` i `tooling/wiki/compile-wiki-to-app.mjs` sota governança de portes).

---

#### `[DEFECTE]` `G4-02` — Enllaços absoluts `file:///Users/javillinares/...` dins de documents de `04_escriptori/` i desfasament de `schema-cutover.lock.json` (`T2-05`)
- **Severitat:** `[DEFECTE]`
- **Abast:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (línies 55 i 57), `_wiki_de_poble/04_escriptori/261027_0145_acta_marmota_auditoria_forense_bessons.md` (línies 13, 30, 38, 41) i `tooling/wiki/schema.json`.
- **Evidència reproduïble:**
  1. En [[03_llibre_mestre_tasques_i_idees]] (línies 55 i 57) i a `261027_0145_acta_marmota_auditoria_forense_bessons` s'han inserit URLs absolutes a la màquina local (`file:///Users/javillinares/Documents/Antigravity/...`). Encara que `compile-wiki-to-app.mjs` les ignora perquè comencen per `file://`, violen la portabilitat del repositori documental.
  2. S'ha afegit el tag `nano` a `tooling/wiki/schema.json` sense regenerar `tooling/wiki/schema-cutover.lock.json`, la qual cosa fa fallar `tractor-frontmatter.mjs --check` juntament amb 40 avís/errors F9 pendents.
- **Font de veritat afectada:** `tooling/documental/tractor-frontmatter.mjs` i portabilitat de `_wiki_de_poble/`.
- **Proposta conservadora:** Substituir els enllaços `file:///Users/javillinares/...` dins dels documents Markdown de `_wiki_de_poble/` per wikilinks canònics `[[nom_document]]` o rutes relatives del repositori, i substituir el tag `nano` per tags ja presents al lock (`disseny`, `multimedia`, `identitat-visual`) o regenerar el lock en un torn governat.
- **`requires_human_decision`:** `false`.

---

#### `[DEFECTE]` `G5-01` — El paquet `baremador_nano.mjs` (`P1-41`) duplica i contradiu l'arquitectura unificada de `/multimedia` (`P1-42`) i trenca `turns.mjs` si s'executa en viu
- **Severitat:** `[DEFECTE]` (esdevindria `[BLOQUEJANT]` si s'instal·lara a `tooling/` i `src/sections/control/sentinelles/registreSentinelles.js`)
- **Abast:** `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/staged/tooling/media/baremador_nano.mjs` (`1.576` línies) enfront de la fita `P1-42` de [[03_llibre_mestre_tasques_i_idees]].
- **Evidència reproduïble:**
  1. **Xoc de model de dades i d'escala (`P1-41` vs `P1-42`):**
     - `baremador_nano.mjs` defineix una escala d'**1 a 10 punts** (`NOTA_MINIMA = 1`, `NOTA_MAXIMA = 10`, llindar d'aprovació `7`) i un catàleg tancat de només **4 motius de rebuig** (`IDIOMA`, `ENQUADRAMENT`, `HUMOR_GAG`, `ESTIL`).
     - En canvi, la fita `P1-42` (*Sistema Universal de Votacions i Qualificació d'Imatges a `/multimedia`*) ordena textualment el **Principi d'Unificació Arquitectònica («No duplicar sistemes. Un sol motor de qualificació configurable i resilient»)** amb una escala d'**1 a 5 estrelles**, motiu explícit en text i el **Catàleg d'Atributs de Disseny Multimèdia Professional (Estàndard UOC)** dividit en 5 atributs de desviació (`massa_moderna`, `massa_perfecta`, `pamflet_idillic`, `susto_forcat`, `manca_rusticitat`) i 5 atributs de conformitat (`linia_bruguera_pura`, `comico_costumista`, `contraposicio_absurda`, `paleta_terracota_rustica`, `full_bleed_sense_marcs`), persistit en Supabase (`P1-51`).
  2. **Sobreenginyeria extrema (`1.576` línies per a un registre JSON):** `baremador_nano.mjs` inclou `process.chdir()` cap a la carpeta de dades amb restauració en `finally`, recorregut recursiu d'inodes `BigInt` fins a l'arrel del sistema (`cadenaDeLaCarpeta`), bloqueig de rutes `/.vol/` de macOS i 25 expressions regulars de caça de secrets per escriure un fitxer JSON local de qualificacions d'imatges.
  3. **Col·lisió destructiva amb `turns.mjs` (`D-1`):** `RUTA_DADES_RELATIVA = '.agents/qualificacions_nano.json'` escriu directament a `.agents/`. Com que `tooling/documental/turns.mjs` vigila `.agents/` en el seu `snapshotRepo`, qualsevol qualificació executada mentre hi ha un torn obert avorta `tancament --check/--verify/--close` i `executor-mutacio.mjs` amb l'error `"Escriptura concurrent o comprovació amb efectes laterals"`.
  4. **Invalidesa de Sentinelles:** Afegir un 8é sentinella (`baremador-nano`) a `registreSentinelles.js` canviaria el hash SHA-256 del fitxer i invalidaria immediatament les aprovacions humanes dels 7 sentinelles existents.
- **Font de veritat afectada:** Fites `P1-41`, `P1-42` i `P1-51` de [[03_llibre_mestre_tasques_i_idees]], `tooling/documental/turns.mjs` i `tooling/gates/frontissa-sentinelles.mjs`.
- **Proposta conservadora (Dictamen Carril 5 · FONDRE, NO INSTAL·LAR COM A MOTOR PARAL·LEL):**
  1. **NO instal·lar `baremador_nano.mjs` com a motor de qualificació paral·lel ni com a Sentinella #8.**
  2. **APLICAR IMMEDIATAMENT** els dos actius documentals del paquet que corregeixen l'origen real dels errors de Nano Banana:
     - `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/staged/_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md` (que eradica les instruccions contradictòries d'incloure bafarades i text en castellà que encara viuen a `_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md`).
     - L'afegit de la secció `§5.2 Regla de Zero Text (Zero Text Rule) i Baremador del Nano` a `_wiki_de_poble/02_saber/identitat_visual.md`.
  3. **FONDRE el nucli pur dins `P1-42` (`/multimedia`):** Extreure de `baremador_nano.mjs` només les constants i funcions pures de construcció i auditoria de prompts (`ESTILS`, `ZERO_TEXT_RULE`, `FULL_BLEED`, `ANTI_IDILLIC`, `ANTI_ESTOC`, `construeixPrompt`, `auditaPrompt`, ~200 línies netes sense manipulació d'inodes ni `chdir`) i integrar-les com a mòdul compartit de `/multimedia` (`P1-42`), adoptant l'**escala única d'1 a 5 estrelles** i unificant les 4 famílies (`IDIOMA`, `ENQUADRAMENT`, `HUMOR_GAG`, `ESTIL`) com a categories pare dels **10 atributs diagnòstics UOC**.
- **`requires_human_decision`:** `true` (confirmació de la fusió arquitectònica `P1-41` → `P1-42`).

---

#### `[MILLORA]` `G2-03` — Pulsació llarga inactiva un cop obert el mode selecció i `user-select: none` massa ampli (`T4-03` i `T4-06`)
- **Severitat:** `[MILLORA]`
- **Abast:** `src/sections/xat/components/LlistaConverses.jsx` (línia 70) i `src/css/modules.css` (línia 3491).
- **Evidència reproduïble:**
  1. En `LlistaConverses.jsx:70`, `enPulsacio` fa `if (!seleccio) onSelecciona?.(clau);`. Si l'usuari ja té una conversa seleccionada i fa una segona pulsació llarga (>420 ms) sobre una altra fila, no passa res perquè `suprimeixClicRef` bloqueja el `click` posterior i `enPulsacio` ignora l'acció quan `seleccio` és `true`.
  2. En `src/css/modules.css:3491`, `.sdp-xat-fila:not(.sdp-xat-fila--senzilla)` aplica `user-select: none` a totes les files del xat encara que no tinguen gest de pulsació llarga (com `ResultatsCercaXat`).
- **Font de veritat afectada:** Ergonomia WhatsApp de `P1-53` ([[03_llibre_mestre_tasques_i_idees]]).
- **Proposta conservadora:** Eliminar la guarda `if (!seleccio)` dins `enPulsacio` perquè una pulsació llarga commuti sempre la selecció de la fila, i restringir `user-select: none` a `.sdp-xat-llista--converses .sdp-xat-fila`.
- **`requires_human_decision`:** `false`.

---

#### `[MILLORA]` `G3-02` — El mode Bancal aplana el pes tipogràfic d'`H3`, `H4`, `H5` i `H6` dins del calaix TOC (`T3-03`)
- **Severitat:** `[MILLORA]`
- **Abast:** `src/css/modules.css` (línies 10190 i 10207).
- **Evidència reproduïble:** Les regles d'alt contrast del mode Bancal (`html[data-theme="light"] .toc-level-4 button, .toc-level-5 button, .toc-level-6 button { font-weight: 600; }`) sobreescriuen els pesos `500` (`H4`, `H5`) i `400` (`H6`) i els deixen idèntics a `H3` (`600`).
- **Font de veritat afectada:** Jerarquia visual de l'índex TOC (`§5`).
- **Proposta conservadora:** Conservar l'increment de contrast de color en mode Bancal (`--sdp-text-titol` / `--sdp-text-cos`) però respectar l'escala de pesos (`H3: 700`, `H4: 600`, `H5: 500`, `H6: 400` amb estil itàlic o versaleta).
- **`requires_human_decision`:** `false`.

---

#### `[MILLORA]` `G3-03` — L'augment de `MIDA_ICONA_EINES` de `20` a `24` en `UniversalToolbar.jsx` afecta totes les pantalles de la plataforma (`T3-02`)
- **Severitat:** `[MILLORA]`
- **Abast:** `src/components/universal/UniversalToolbar.jsx` (línia 9).
- **Evidència reproduïble:** El canvi global `const MIDA_ICONA_EINES = 24;` modifica la mida de les icones de la subbarra no sols a Notes, sinó també a `PerfilEditor.jsx`, `ConnexioDetall` i l'espècimen de Disseny.
- **Font de veritat afectada:** Llei del Píxel (`AGENTS.md §2` i `P1-59`).
- **Proposta conservadora:** Validar visualment amb Mestre Javi si `24px` és el nou canònic global per a totes les `UniversalToolbar` (coherent amb la pujada de les icones de capçalera de conversa a `24px` en `FilaConversa`/`Conversa`) o si ha de ser configurable per prop.
- **`requires_human_decision`:** `true`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **Estat de l'arbre Git (`git status`):** Comprovat que no s'ha tocat cap fitxer de `src/` durant aquesta auditoria.
2. **Compilador estricte de la Wiki:**
   - Ordre executada: `node tooling/wiki/compile-wiki-to-app.mjs --check --strict`
   - Resultat: `Exit code 0` (`ℹ️ 74 enllaços apunten a documents existents fora del manifest públic; només se n'ha comprovat el nom. ✅ Totes les rutes de la Wiki estan ben enllaçades.`).
3. **Verificació d'absència d'enllaços externs a `PAGE_COPY.descarregues`:**
   - Inspeccionat `src/sections/text/pageContent.js` (línies 487–503): `0` etiquetes `<a href>` i `0` URLs cap a botigues sense fitxa pública.
4. **Verificació matemàtica de les files de conversa (`P1-53`):**
   - `button.sdp-xat-fila` té `min-height: var(--sdp-xat-fila-mida)` (`96px`), i `.sdp-xat-llista--converses > li` té `margin-bottom: 0; padding-left: 0; border-bottom: 1px solid var(--sdp-xat-divisor);`. Alçària línia a línia verificada.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per complir la regla de convivència operativa de la Ronda 6, no s'ha executat cap mutació sobre `src/` ni `tooling/`.
- El test `npm run test:precommit` no s'ha forçat a passar mitjançant esborrat de `public/assets/uploads/brain/nano_descarregues_gamberro.*` per no alterar l'estat de l'arbre viu mentre Claude tanca la Ronda 6.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- Informe auditat de la Ronda 5: [[261026_2150_auditoria_claude]]
- Llibre Mestre de Tasques i Idees: [[03_llibre_mestre_tasques_i_idees]]
- Pla d'implementació del Gauntlet Loop: [[261027_0535_pla_implementacio_auditoria_gauntlet_ronda5_claude]]
- Protocol canònic d'auditoria: [[auditoria_canonica]]
- Identitat Visual i Zero Text Rule: [[identitat_visual]]
- Plantilla de Prompts Nano Banana: [[prompt_nano_banana]]
