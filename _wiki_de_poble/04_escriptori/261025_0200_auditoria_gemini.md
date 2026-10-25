---
type: informe
status: esborrany
description: Auditoria visual en viu amb DevTools a localhost:3340 sobre el commit 1c110f954, verificació del ritme vertical Apple HIG i anatomia de continguts (IDEA-26, IDEA-27, IDEA-22), diàleg amb Codex i proposta d'automillora
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:92a945eb-3a0c-4533-a4b7-2ac27e88f765
---
# Auditoria Visual en Viu Gemini 4 Argon · Commit 1c110f954, Reforma Editorial Didàctica (IDEA-26, IDEA-27, IDEA-22) i Automillora d'Orquestració

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:92a945eb-3a0c-4533-a4b7-2ac27e88f765 |
| Versió del document | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T01:44:06.478Z |
| Modificació | 2026-10-25T03:55:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | gemini-4-argon |
| Tokens consumits | 78000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T01:44:06.478Z: esborrany creat; contingut i verificació pendents.
- 2026-10-25T01:47:30.000Z: primera passada d'auditoria visual en viu a `http://localhost:3340` (Chrome DevTools MCP `pageId: 1`) del commit `1c110f954` (`IDEA-21`, `IDEA-22`, `IDEA-23`), diagnòstic geomètric i arquitectònic de la reforma editorial (`IDEA-26`, `IDEA-27`, `IDEA-22`), diàleg creuat amb Codex (`C0200-01`..`C0200-06`) i proposta d'automillora del cicle de vida documental.
- 2026-10-25T03:55:00.000Z: **segona passada (Gauntlet Loop Adversarial Extrem)** en viu a `http://localhost:3340` sobre el diff consolidat de Claude (`261025_0200_implementacio_claude.md`) i el **Mandat Suprem del Mestre (àudios 04:29 i 04:45)** sobre el desbordament i el contrast cromàtic de les taules (`estructura-gestor`, `estructura-universalworkspace`, `inventari-global` i `sdp.css`), més la verificació de taules de contracte (`.sdp-especimen__contracte`), blocs `<pre>`, erradicació del filet puntejat `dashed` i del `border-top` d'espècimens, ritme vertical Apple HIG (`16/24/32/24 px`), anatomia de Sentinelles, flux `/connectar` i sincronització amb la segona passada de Codex (`C2-01`..`C2-03`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Segona Passada · Gauntlet Loop Adversarial Extrem sobre el Diff Consolidat de Claude i les Taules (`2026-10-25T03:55Z`)

S'ha auditat en viu a `http://localhost:3340` (Chrome DevTools MCP `pageId: 1`) i contra el codi del working tree l'entrega completa de Claude (`[[261025_0200_implementacio_claude]]`) i s'ha contrastat amb la segona passada de Codex (`[[261025_0200_auditoria_codex]]`). **Veredicte de Segona Passada: CONFORMITAT PARCIAL · CAL APLICAR LA REFORMA DE TAULES (`G0200-R2-01` + `C2-03`) I LES GUARDES DE SESSIÓ (`C2-01`, `C2-02`) ABANS DEL COMMIT FINAL.** Totes les troballes de la 1a passada (`G0200-01`..`04` i `C0200-01`, `02`, `05`, `06`) i les 207 proves dirigides passen en verd, però l'auditoria visual d'`estructura-gestor` (Mandat Suprem del Mestre, àudios 04:29 i 04:45) confirma un defecte estructural P1/P2 en les taules nues i en la seua paleta cromàtica.

#### 0.1. 🔥 PRIORITAT 1 SUPREMA · Diagnòstic Geomètric, Cromàtic i Arquitectònic de les Taules (`G0200-R2-01` · P1/P2 · Mandat del Mestre 04:29 i 04:45)

Hem mesurat amb Chrome DevTools (`pageId: 1`) a `1280×800` (on la 3a columna de `UniversalWorkspace` té `353–355 px` d'amplada interior) totes les superfícies amb `<table>` del catàleg i de l'app:

| Ruta / Taula auditada (`1280×800`) | Contenidor pare (`clientWidth / scrollWidth`) | `tableOffsetWidth` | Desbordament (`overflow`) | Estat actual |
| --- | --- | --- | --- | --- |
| `/disseny?categoria=estructura&item=estructura-gestor` · **Taula 1** («Plegat en escriptori», `EspecimenGestor.jsx:35`) | `.sdp-especimen__viu` (`353 / 456 px`, `overflowX: "visible"`) | **`364 px`** | **`+11 px`** fora de la caixa | **FALLA (`P1`)** · `<table>` nu sense scroll contingut. |
| `/disseny?categoria=estructura&item=estructura-gestor` · **Taula 2** («Mides (amplada del contenidor, no de la finestra)», `EspecimenGestor.jsx:44`) | `.sdp-especimen__viu` (`353 / 456 px`, `overflowX: "visible"`) | **`432 px`** | **`+79 px`** fora de la caixa (`+103 px` al `scrollWidth` del pare) | **FALLA (`P1`)** · Es talla lletjament i trenca l'harmonia. |
| `/disseny?categoria=estructura&item=estructura-gestor` · **Taula 3** («Amplades de columna (px)», `EspecimenGestor.jsx:53`) | `.sdp-especimen__viu` (`353 / 456 px`, `overflowX: "visible"`) | **`371 px`** | **`+18 px`** fora de la caixa | **FALLA (`P1`)** · Surt per la dreta de `.sdp-especimen__viu`. |
| `/disseny?categoria=estructura&item=estructura-gestor` · **Taula 4** («Colors i profunditat», `EspecimenGestor.jsx:62`) | `.sdp-especimen__viu` (`353 / 456 px`, `overflowX: "visible"`) | `327 px` | `-26 px` (cap d'ample, però enganxada a `0 px` de la Taula 3) | **FALLA CROMÀTICA (`P2`)** · Sense separació ni contrast. |
| `/disseny?categoria=estructura&item=estructura-universalworkspace` · **Taula viva** («Variants d’ús i anatomia», `EspecimenUniversalWorkspace.jsx:47`) | `.sdp-especimen__viu` (`353 / 394 px`, `overflowX: "visible"`) | **`370 px`** | **`+17 px`** fora de la caixa (`+41 px` al `scrollWidth` del pare) | **FALLA (`P1`)** · `<table>` nu sense scroll contingut. |
| `/disseny?categoria=inventari&item=inventari-global` · **Taula d'inventari** (`EspecimenInventariGlobal.jsx:27`) | `.sdp-inventari-global` (`355 / 1125 px`, `overflowX: "visible"`) | **`1093 px`** | **`+738 px`** fora de la columna! | **FALLA (`P1`)** · `<table>` nu de 5 columnes desbordant `738 px`. |
| `/disseny?categoria=fonaments&item=fonaments-taula` · **Espècimen `<Taula>`** (`Taula.jsx`) | `.sdp-taula` (`305 / 408 px`, `overflowX: "auto"`) dins de `.sdp-especimen__viu` (`353 / 353 px`) | `408 px` | **`0 px`** fora de la caixa (contingut en `.sdp-taula`) | **SCROLL VERD / CONTRAST POBRE (`P2`)** |

##### A. Per què desborden les taules en escriptori (`1280×800`) i per què falla el teclat en mòbil (`C2-03`)?
1. **La trampa de `@media (max-width: 40rem)` basat en la finestra en lloc del contenidor (`src/css/sdp.css:55-65`):**
   - Actualment, `src/css/sdp.css:55-65` només aplica `display: block; overflow-x: auto; overscroll-behavior-inline: contain;` a `:where(table)` quan la **finestra del navegador** és $\le 40\text{ rem}$ (`640 px`).
   - En un escriptori de `1280 px`, com que `UniversalWorkspace` i `AppGridShell` reparteixen la pantalla en 3 columnes, la columna de detall on viuen els espècimens té només **`353 px` d'amplada útil** ($\ll 640\text{ px}$), però la `@media (max-width: 40rem)` **no s'activa** perquè mira el viewport (`1280 px`). Qualsevol `<table>` que no estiga dins de `<Taula>` (`EspecimenGestor.jsx:35,44,53,62`, `EspecimenUniversalWorkspace.jsx:47`, `EspecimenInventariGlobal.jsx:27`, `WikiDePobleSection.jsx:332` i `parseMarkdown.js:169` `.sdp-taula-prosa`) es queda en `display: table; overflow: visible;` i rebenta la columna.
2. **Doble contenidor d'overflow en mòbil sobre `.sdp-especimen__contracte` (`C2-03` de Codex):**
   - A $\le 40\text{ rem}$, `sdp.css:62-64` restaura `.sdp-taula :where(table) { display: table; overflow: visible; }`, però no inclou `.sdp-especimen__contracte :where(table)` ni `.sdp-taula-prosa :where(table)`. Per això, a `375 px`, el `<table>` intern captura l'scroll i la regió accessible `<div class="sdp-especimen__contracte" role="region" tabindex="0">` no desplaça amb les fletxes del teclat.

##### B. Per què el color de les files i capçaleres es fon en una massa confusa? (Diagnòstic fotomètric RGB)
Hem mesurat els colors computats de `sdp.css:9-50` al navegador (`pageId: 1`):
- `thead th` (`sdp.css:28`): `background: var(--sdp-fons-app)` = **`rgb(243, 240, 236)`** (`#F3F0EC`).
- `tbody tr:nth-child(odd)`: `background: rgba(0, 0, 0, 0)` (`transparent`).
- `tbody tr:nth-child(even)` (`sdp.css:35`): `background: var(--sdp-fons-subtil)` = **`rgb(239, 236, 231)`** (`#EFECE7`).
- **Resultat visual nefast en tots dos fons:**
  1. **Sobre el fons de pàgina (`--sdp-fons-app` `#F3F0EC`):** La capçalera `thead th` (`#F3F0EC`) i les files imparelles (`transparent` $\rightarrow$ `#F3F0EC`) tenen **exactament el mateix color (`0` de diferència RGB)**, i les files parelles (`#EFECE7`) només es diferencien en **`4/255` nivells RGB** ($\Delta E < 1.5$, indistingible per a l'ull humà).
  2. **Sobre el nou fons blanc de `.sdp-especimen__viu` (`--sdp-fons-targeta` `#FFFFFF`):** La capçalera `thead th` (`rgb(243, 240, 236)`) i les files parelles (`rgb(239, 236, 231)`) continuen diferint en només **`4/255` nivells RGB**, de manera que la capçalera sembla una fila parella més.
  3. **Col·lisió entre taules consecutives (`0 px`):** A `EspecimenGestor.jsx`, les 4 taules van seguides i `:where(table)` no té `margin-block-end` ni vora perimetral; l'última fila de la Taula 1 toca a **`0 px`** el `<caption>` de la Taula 2, creant un bloc confús on no se sap on acaba una taula i on comença la següent.

##### C. Prescripció Quirúrgica Dual (Arquitectura JSX + Paleta i Scroll CSS a `src/css/sdp.css`)
1. **Regla CSS Universal d'Scroll Horitzontal Contingut (sense `@media (max-width: 40rem)`) a `src/css/sdp.css`:**
   - Eliminar el condicional `@media (max-width: 40rem)` de `src/css/sdp.css:55-65` i fer que tota taula o embolcall de taula continga l'scroll horitzontal a **qualsevol amplada de columna**:
     ```css
     :where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa) {
       overflow-x: auto;
       overscroll-behavior-inline: contain;
       max-width: 100%;
       margin-block: 0 var(--sdp-space-6);
       background: var(--sdp-fons-targeta);
       border: 1px solid var(--sdp-vora);
       border-radius: var(--sdp-radi-s);
     }
     :where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa):last-child {
       margin-block-end: 0;
     }
     :where(table) {
       display: block;
       width: 100%;
       max-width: 100%;
       overflow-x: auto;
       overscroll-behavior-inline: contain;
       border-collapse: collapse;
       border-spacing: 0;
       font-variant-numeric: tabular-nums;
       background: var(--sdp-fons-targeta);
       border: 1px solid var(--sdp-vora);
       border-radius: var(--sdp-radi-s);
       margin-block: 0 var(--sdp-space-6);
     }
     :where(table:last-child) {
       margin-block-end: 0;
     }
     :where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa) :where(table) {
       display: table;
       overflow: visible;
       border: 0;
       border-radius: 0;
       margin-block: 0;
     }
     ```
2. **Embolcall Semàntic amb `<Taula>` als Detalls del Catàleg:**
   - Embolcallar les taules de `EspecimenGestor.jsx:35,44,53,62`, `EspecimenUniversalWorkspace.jsx:47` i `EspecimenInventariGlobal.jsx:27` amb `<Taula titol="...">` de `PedraSeca` perquè a més de l'scroll contingut tinguen `role="region"` i `tabIndex={0}` per a teclat (WCAG 2.1.1).
3. **Nova Paleta Cromàtica de Taules de 3 Graons Nítids (`src/css/sdp.css:20-50` i `src/css/tokens.css`):**
   - Definir una jerarquia de luminància clara tant en mode clar com en mode fosc (`[data-tema="nit"]`):
     - **Capçalera (`:where(thead th)`):** `background: var(--sdp-pedra-200)` (`#E2DDD5` en mode dia; `var(--sdp-pedra-800)` en mode nit), `color: var(--sdp-text-titol)` (`#1C1B18`), `font-weight: 700`, `padding: var(--sdp-space-3) var(--sdp-space-3)` (`12px`), i filet inferior ferm `border-block-end: 2px solid var(--sdp-vora-control)` (`#918A7E`).
     - **Files imparelles (`:where(tbody tr:nth-child(odd))`):** `background: var(--sdp-fons-targeta)` (`#FFFFFF` blanc pur en mode dia; `var(--sdp-pedra-900)` en mode nit).
     - **Files parelles (`:where(tbody tr:nth-child(even))`):** `background: var(--sdp-fons-subtil)` (`#EFECE7` pedra suau en mode dia; `var(--sdp-pedra-850, #23211D)` en mode nit).
     - **Cel·les (`:where(th, td)`):** `padding: var(--sdp-space-2) var(--sdp-space-3)` (`8px 12px`) i `border-block-end: 1px solid var(--sdp-vora)` (`#DCD7CD`), suprimint la vora inferior en l'última fila (`tbody tr:last-child td { border-block-end: 0; }`) perquè encaixe netament dins del marc `1px solid var(--sdp-vora)` amb `border-radius: var(--sdp-radi-s)`.
     - **`<caption>`:** `padding: var(--sdp-space-3) var(--sdp-space-3) var(--sdp-space-2)`, `font-weight: 700`, `color: var(--sdp-text-titol)`, `border-block-end: 1px solid var(--sdp-vora)`.

---

#### 0.2. Matriu de Verificació Visual en Viu de la Resta d'Objectius (Segona Passada a `http://localhost:3340`)

| Superfície auditada (`localhost:3340`) | Mesures exactes en viu (DevTools `pageId: 1`) | Veredicte |
| --- | --- | --- |
| **Taules de contracte** · `/disseny?categoria=fonaments&item=fonaments-publicacions-actor` i `estructura-universalworkspace` | En columna estreta (`355 px` a `1280×800`), `.sdp-especimen__contracte` (`role="region"`, `aria-label="Contracte"`, `tabIndex=0`, `overflowX: "auto"`) conté l'scroll de la taula (`clientWidth: 355 px`, `scrollWidth: 648 px` a `publicacions-actor` i `1098 px` a `universalworkspace`). Els 6 identificadors de prop (`seccio`, `exclouId`, `nivell`, `VistaPublicacionsDeLActor`, `peuDePagina (PageFrame)`, `etiquetaPeuDePagina (PageFrame)`) computen `whiteSpace: "nowrap"` i **`propLines: 1`** (0 noms partits per síl·labes). En mòbil (`<= 40rem`) cal afegir `.sdp-especimen__contracte :where(table) { display: table; overflow: visible; }` (`C2-03`) perquè el `tabIndex=0` de la regió moga l'scroll. | **PARCIAL (`C2-03` / `G0200-R2-01`)** |
| **Blocs `<pre>`** · `/disseny?categoria=fonaments&item=fonaments-contracte` *(nota: el `<pre>` d'`UniversalWorkspace` viu a `fonaments-contracte`)* | El `<pre>` (`572 px` d'amplada de contingut) es desplaça dins de la seua pròpia caixa (`clientWidth: 303 px`, `scrollWidth: 572 px`, `overflowX: "auto"`, `maxWidth: "100%"`), amb `fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"`, `fontSize: "16px"` ($\ge 14\text{ px}$), `padding: "12px"`, `bg: "rgb(239, 236, 231)"`, `border: "1px solid rgb(220, 215, 205)"`, `radius: "8px"`, `marginBottom: "20px"`. El `<code>` intern no duplica vora (`innerCodeHasPillBorder: false`). Zero desbordament de pàgina (`1280 === 1280`). | **VERD (`IDEA-26`)** |
| **Erradicació del filet puntejat (`dashed`)** · `/disseny?categoria=estructura&item=estructura-arbre` | `.sdp-especimen__viu` computa `borderTopStyle: "solid"`, `borderTopWidth: "1px"`, `borderTopColor: "rgb(220, 215, 205)"` (`var(--sdp-vora)`), `backgroundColor: "rgb(255, 255, 255)"` (`var(--sdp-fons-targeta)`), `borderRadius: "12px"`, `padding: "24px"`. El filet `1px dashed` ha desaparegut de tot el catàleg. *(Nota: `estructura-shell` és un alies històric; l'espècimen de `AppGridShell` viu a `estructura-gestor`).* | **VERD (`IDEA-26`)** |
| **Ritme d'espècimen i casos (`G0200-01`, `G0200-02`)** · `/disseny?categoria=superposicions&item=superposicions-visibilitat` i `estructura-divisor` | A `superposicions-visibilitat`: `.sdp-especimen__cap → p` = **`16 px`**; dins de `.sdp-especimen__viu`: `H4 → P` = **`16 px`**, `P → DIV.sdp-accions` = **`24 px`**, `DIV.sdp-accions → H4 següent` = **`32 px`**, últim `DIV.sdp-accions` a `marginBottom: "0px"` i centrat (`justifyContent: "center"`). Píndola `.sdp-especimen__fitxer` amb fons `rgb(239, 236, 231)`, vora `1px solid rgb(220, 215, 205)` i radi `8px`. A `estructura-divisor`: eliminat el `border-top` invasor (`borderTopWidth: "0px"`), `capToPGapPx: 16` en totes dues fitxes, i `boxToNextH3Px: 32` (vegeu `G0200-R2-03`). | **VERD (`IDEA-26`)** |
| **Anatomia de Sentinelles (`G0200-03`)** · `/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell` | `H1` («Sentinelles», `35.92px`, centrat) → `H2` → `.lead` centrada sota l'`H2` (`18.65px`, `top: 616..945 px`) → `H3` («Porta d’aprovació de tractors», `28px`) → `P` de cos estàndard (`16.65px`, color `rgb(61, 59, 53)`, a **`16 px`** sota l'`H3`) → `DIV.sdp-accions` amb el botó DEV (a **`24 px`** sota el paràgraf) → `<p role="status">` buit amb `marginTop: "-16px"` (deixant exactament **`24 px`** fins a `.sdp-tractors-panell__cos`). Segon panell unificat a `H3` («Sentinelles: què observen»). | **VERD (`IDEA-27`)** |
| **Flux `/connectar` i opt-in de Titular Pública (`G0200-04`, `C0200-06`)** · `/registre` → `/el-meu-perfil` → `/connectar` | 1) Entrat com a `Javi Llinares` a `/registre`. 2) A `/el-meu-perfil` (`Sóc de Poble` → «Membres i connexions»): la casella `<TriaTitular>` naix desmarcada (`initialChecked: false`); en marcar-la passa a `true`, mostra l'avís condicional (`Desat: et mostrarem com a titular de Sóc de Poble a Connectar mentre el teu perfil i l’entitat siguen públics.`) i **conserva el focus (`activeIsCheckbox: true`)** amb `aria-busy` (després s'ha tornat a deixar desmarcada `false`). 3) A `/connectar?...&item_id=rentonar&organitzacio=rentonar`: el selector «Connectar com a» mostra únicament `Sóc de Poble (empresa)` (`checked: true`), permetent `Entitat A → Entitat B` (`C0200-06`) i ocultant «Escriu-li» (`hasEscriuLi: false`). | **VERD (`IDEA-22`)** |

#### 0.3. Verificació Forense Creuada amb Codex (`2610250300_titular_public.sql`, Port i `C2-01`..`C2-03`)
- **Migració `2610250300_titular_public.sql` (`R-1`):** Confirmades les 5 condicions d'opt-in i privacitat i els dos `IF` niats contra `42P01`.
- **Kit de conformitat (`src/data/conformitat/kit.js:638-647`):** Confirmada la validació de `tipus` en `quiEmSegueix` (`C0200-01`) i l'execució de les 8 suites dirigides (`207/207` tests en verd).
- **Subscrivim les 3 troballes P2 de Segona Passada de Codex (`[[261025_0200_auditoria_codex]]`):**
  - **`C2-01` (P2 · `useTitularDeConnexio.js:40-63`):** Incloure l'àmbit de servidor i l'identificador d'usuari/sessió en la clau de l'efecte i invalidar respostes pendents quan canvia la sessió o l'`orgId`.
  - **`C2-02` (P2 · `GestioMembres.jsx:92-105` `TriaTitular.canvia`):** Verificar que l'`orgId` i la generació d'operació de la resposta coincideixen amb l'entitat activa abans d'actualitzar `estat` i `missatge`.
  - **`C2-03` (P2 · Scroll per teclat en mòbil de `.sdp-especimen__contracte`):** Queda resolt directament per la nostra prescripció unificada `G0200-R2-01` (`:where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa) :where(table) { display: table; overflow: visible; }`).

#### 0.4. Tres Poliments Editorials Addicionals de Segona Passada (`G0200-R2-02`..`G0200-R2-04` · Severitat P3)

1. **`G0200-R2-02` · P3 · Posició i doble espaiat (`52 px`) del paràgraf introductori de la titular a `src/sections/connectar/ConnectarSection.jsx:788`:**
   - **Què passa:** Quan `contacteTitular` està present, `ConnectarSection.jsx:786-792` renderitza `<p>{nom} és titular de {entitat} i ha triat que es veja ací.</p>` com a fill directe de `.sdp-connectar__cami` (`display: flex; flex-direction: column; gap: var(--sdp-space-8)` = `32px`) **abans** de `<BlocRelacio contacte={contacteTitular} deFitxa ... />`.
   - **Impacte:** (a) El paràgraf introductori queda fora de la `<section>` de la titular i **damunt** del seu títol `<h3 className="sdp-connectar__titol-seccio">Connectar amb {nom}</h3>` (invertint l'ordre `H3 → Paràgraf` d'`IDEA-27`); (b) com que el `<p>` té `margin-bottom: var(--sdp-mb-p)` (`20px`) sumat al `gap: 32px` de `.sdp-connectar__cami`, queda a `32 px` del bloc de l'entitat anterior però a **`52 px`** del bloc de la titular que encapçala.
   - **Prescripció:** Passar la frase com a prop a `<BlocRelacio>` perquè es pinte dins de la `<section>` de la titular, just davall del seu `<h3>`.
2. **`G0200-R2-03` · P3 · Distància entre fitxes `.sdp-especimen` a `32 px` en lloc de `40 px` (`--sdp-mt-h3`) a `src/css/components.css:525`:**
   - **Què passa:** Arran de la retirada de la línia divisòria `border-top: 2px solid var(--sdp-vora); padding-top: var(--sdp-space-6);` a `src/css/components.css:525` (`.sdp-especimen { margin-bottom: var(--sdp-space-8); }`), la distància real mesurada en viu a `/disseny?categoria=estructura&item=estructura-divisor` entre el final de `#divisor` i l'`<h3>` de `#redimensionador` és ara de **`32 px`** (en lloc dels `40 px` + `2 px` descrits a l'informe de Claude §1.F). Amb `32 px`, la separació entre dues fitxes `H3` iguala el `margin-top: 32px` (`--sdp-mt-h4`) dels `<h4>Accessibilitat</h4>` interns.
   - **Prescripció:** Canviar `.sdp-especimen { margin-bottom: var(--sdp-space-10); }` (`40px`, igual a `--sdp-mt-h3`) a `src/css/components.css:525`, mantenint erradicat el `border-top`.
3. **`G0200-R2-04` · P3 · `.sdp-especimen__fitxer` conserva `overflow-wrap: anywhere` i li falta `box-decoration-break: clone` a `src/css/components.css:535-544`:**
   - **Què passa:** A `src/css/sdp.css:250-263`, la píndola `:where(code:not([class], pre code))` usa `overflow-wrap: break-word; box-decoration-break: clone; -webkit-box-decoration-break: clone;`. Com que `<code className="sdp-especimen__fitxer">` porta atribut `class`, no entra en `:where(code:not([class], ...))` i es regeix per `src/css/components.css:535-544`, on continua amb `overflow-wrap: anywhere;` i sense `box-decoration-break: clone`.
   - **Prescripció:** Aliniar `.sdp-especimen__fitxer` amb `overflow-wrap: break-word; box-decoration-break: clone; -webkit-box-decoration-break: clone;`.

---

### 1. Certificació Visual en Viu del Commit `1c110f954` (Primera Passada · `IDEA-21`, `IDEA-22`, `IDEA-23` a `http://localhost:3340`)

S'ha auditat en viu el servidor local (`http://localhost:3340`, Chrome DevTools MCP `pageId: 1`) a `1280×800` i `375×812`. Totes les reformes del commit `1c110f954` (`<Dialeg>` sense doble scroll, `SelectorVisibilitat` a mida `g` de `896 px`, i les 9 píndoles d'enquadrament en una sola fila) passen en verd amb exactitud matemàtica:

| Ruta / Escenari (`localhost:3340`) | Viewport | Classe del `<dialog>` | Dimensions (`W × H`) | `dlg` (`clientH / scrollH`) | `cos` (`clientH / scrollH`) | Veredicte Visual |
| --- | --- | --- | --- | --- | --- | --- |
| `/disseny?categoria=superposicions&item=superposicions-dialeg` · «Obrir un diàleg» | `1280×800` | `sdp-dialeg sdp-dialeg--m` | `576 × 318 px` | `316 / 316 px` (`zeroScroll: true`) | `136 / 136 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Columna flex neta; `overflowY: "auto"` al cos amb `minHeight: "0px"`. |
| `/disseny?categoria=superposicions&item=superposicions-dialeg` · «Obrir la finestra de la barra» | `1280×800` | `sdp-dialeg sdp-dialeg--s sdp-dialeg--barra` | `448 × 347 px` | `345 / 345 px` (`zeroScroll: true`) | `112 / 112 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Sense doble barra de desplaçament. |
| `/disseny?categoria=superposicions&item=superposicions-visibilitat` · Cas 1 («Fitxa privada d'una persona») | `1280×800` | `sdp-dialeg sdp-dialeg--g sdp-dialeg--barra sdp-dialeg--barra-amunt sdp-selector-visibilitat` | `896 × 590 px` | `588 / 588 px` (`zeroScroll: true`) | `408 / 408 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Ample `896 px` (`56rem`) i obertura cap amunt automàtica. |
| `/disseny?categoria=superposicions&item=superposicions-visibilitat` · Cas 2 («Nota publicada al Mur») | `1280×800` | `sdp-dialeg sdp-dialeg--g sdp-dialeg--barra sdp-dialeg--barra-amunt sdp-selector-visibilitat` | `896 × 652 px` | `650 / 650 px` (`zeroScroll: true`) | `471 / 471 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Zero scroll vertical innecessari. |
| `/disseny?categoria=superposicions&item=superposicions-visibilitat` · Cas 3 («Fitxa d'un agent IA») | `1280×800` | `sdp-dialeg sdp-dialeg--g sdp-dialeg--barra sdp-dialeg--barra-amunt sdp-selector-visibilitat` | `896 × 602 px` | `600 / 600 px` (`zeroScroll: true`) | `420 / 420 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Zero scroll vertical innecessari. |
| `/disseny?categoria=superposicions&item=superposicions-enquadrament` · 9 proporcions (`1:1`, `Orig.`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4`, `9:16`) | `1280×800` | `sdp-dialeg sdp-dialeg--m sdp-enquadrament sdp-enquadrament--formes` | `576 × 697 px` (`634 px` en `21:9`) | `695 / 695 px` (`zeroScroll: true`) | `515 / 515 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Les 9 píndoles (`height: 48 px`, `width: 48–59 px`) queden en **1 sola fila** (`top: 535 px`). |
| `/disseny?categoria=superposicions&item=superposicions-enquadrament` · Mòbil | `375×812` | `sdp-dialeg sdp-dialeg--m sdp-enquadrament sdp-enquadrament--formes` | `351 × 653 px` | `651 / 651 px` (`zeroScroll: true`) | `471 / 471 px` (`zeroScroll: true`) | **VERD (`IDEA-21`)** · Zero scroll i botons del peu en **1 sola fila** (`top: 677 px`). |
| `/connectar?sectionId=perfil&item_id=rentonar&title=Rentonar&objecte=grup&organitzacio=rentonar&ruta=%2Frentonar` | `1280×800` | Vista `/connectar` | `1280 × 800 px` | `hasActuesComAPersonals: false` | `hasAdministrarOrganitzacio: false`, `hasSenseXatCarrero: false` | **VERD PARCIAL (`IDEA-22`)** · Purgats el rètol «les connexions són personals», el bloc d'administració i el carreró `sense-xat`. |

*Nota de precisió sobre el prompt:* L'enllaç del punt 2.A.1 del prompt escrivia `item=superposicions-dialog` (en anglés); l'identificador real al catàleg (`DesignSection.jsx`) és en valencià: `item=superposicions-dialeg`. Així mateix, a `src/sections/disseny/DesignSection.jsx` s'ha verificat la retirada de `onConnect={false}` per complir `IDEA-23`.

---

### 2. Auditoria Visual i Geomètrica de `IDEA-26`, `IDEA-27` i `IDEA-22` (Troballes `G0200-01`..`G0200-04`)

Al tall d'emissió d'aquesta auditoria (`2026-10-25T01:47Z`), l'informe d'implementació de Claude (`261025_0200_implementacio_claude.md`, creat a les `01:29:11Z`) es troba en estat `[pendent]` i els canvis de la reforma editorial encara no s'han abocat al working tree. Hem mesurat amb exactitud el DOM actual a `http://localhost:3340` i documentem **4 troballes crítiques (`G0200-01`..`G0200-04`)** perquè la implementació de Claude i la consolidació posterior siguen quirúrgiques i no deixen cap plet pendent:

#### `G0200-01` · P2 · Doble trampa d'espaiat vertical a `EspecimenSelectorVisibilitat.jsx:49-50` i `base.css:233` (`0 px` entre el botó d'un cas i l'`H4` següent)
- **Evidència en viu (`/disseny?categoria=superposicions&item=superposicions-visibilitat`):**
  - Distància inferior entre `<h4>` («Fitxa privada d'una persona», `bottom: 1707.39 px`) i el seu `<button>` (`top: 1715.39 px`): **`8 px`** (`marginBottom: 8px` via `--sdp-mb-h4: var(--sdp-space-2)`).
  - Distància superior entre el final del `<button>` del cas 1 (`bottom: 1763.39 px`) i l'inici del `<h4>` del cas 2 («Nota publicada al Mur», `top: 1763.39 px`): **`0 px`** (`marginTop: 0px`). Igualment entre el `<button>` del cas 2 (`bottom: 1859.78 px`) i el `<h4>` del cas 3 (`top: 1859.78 px`): **`0 px`**.
- **Causa arrel:** A `src/sections/disseny/cataleg/detalls/EspecimenSelectorVisibilitat.jsx:48-55`, cada cas està embolicat en un `<div>` nu (`<div key={cas.id}><h4>{cas.nom}</h4><Boto>...</Boto></div>`). Com que cada `<h4>` és `:first-child` dins del seu `<div>` embolcall, la regla de `src/css/base.css:233` (`h4:first-child { margin-top: 0; }`) anul·la completament `--sdp-mt-h4` (`32px`). I com que `.sdp-especimen__viu` (`src/css/modules.css:9376`) és un contenidor de bloc sense `gap` ni marge entre fills `<div>`, el botó d'un cas queda literalment enganxat a `0 px` del títol `<h4>` següent.
- **Prescripció quirúrgica (`IDEA-26`):**
  1. A `src/css/tokens.css:101`: apujar `--sdp-mb-h4` a `14px` (o `var(--sdp-space-4)` = `16px` sobre la reixeta matemàtica de 4px d'Apple HIG).
  2. A `src/css/modules.css` (dins de `.sdp-especimen__viu`): dotar `.sdp-especimen__viu` de ritme vertical i centratge harmònic (`display: flex; flex-direction: column; align-items: center; gap: var(--sdp-space-6)` = `24px`, amb `.sdp-especimen__viu > div { display: flex; flex-direction: column; align-items: center; }`) o bé `.sdp-especimen__viu > div + div { margin-top: var(--sdp-space-6); }`. Només així s'elimina tant l'enganxament inferior (`8px` → `14px/16px`) com la col·lisió superior (`0px` → `24px`).

#### `G0200-02` · P2 · Tokens inexistents o semànticament invertits al pla `261025_0200` (`--sdp-radi-xs` i `--sdp-text-cos` — Convergència amb Codex `C0200-05`)
- **Evidència en viu i al codi (`src/css/tokens.css`):**
  - Al navegador, `.sdp-especimen__fitxer` computa actualment `backgroundColor: "rgba(0, 0, 0, 0)"`, `border: "0px none"`, `borderRadius: "0px"`, `padding: "0px"`, `fontSize: "14px"`.
  - El pla `261025_0200` indica aplicar `border-radius: var(--sdp-radi-xs)` a `code:not(pre code)` i `.sdp-especimen__fitxer`, i `font-size: var(--sdp-text-cos)` a `.sdp-tractors-panell__motiu`.
  - Tanmateix, a `src/css/tokens.css`:
    1. `--sdp-radi-xs` **no està declarat** (l'escala de radis a `tokens.css:154-160` comença en `--sdp-radi-s: 8px`). Usar `var(--sdp-radi-xs)` sense declarar-lo a `:root` fa que `border-radius` caiga a `0px`.
    2. `--sdp-text-cos` (`tokens.css:124`) és un token de **color** (`var(--sdp-pedra-700)`), no de mida tipogràfica. Els tokens de mida de cos són `var(--sdp-fluid-cos)` (`18px → 21px`) i `var(--sdp-text-base)` (`18px`).
- **Prescripció quirúrgica (`IDEA-26` / `IDEA-27`):**
  1. Declarar `--sdp-radi-xs: 6px;` (o `4px`) a `src/css/tokens.css:154`.
  2. Usar `font-size: var(--sdp-fluid-cos)` (o `var(--sdp-text-base)`) i `color: var(--sdp-text-cos)` a `.sdp-tractors-panell__motiu` (`src/css/modules.css:9009`).

#### `G0200-03` · P2/P3 · Anatomia de `sentinelles_panell`: entradilla absent sota `H2`, inversió `Botó → Paràgraf`, inflació de `gap` per `<p role="status">` buit i asimetria `H3` vs `H2` entre panells
- **Evidència en viu (`/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell` a `1280×800`):**
  1. Capçalera de `UniversalPage`: `H1` («Sentinelles», `39.33px`, centrat) → `H2` («Els set sentinelles d’autonomia: aprova’ls i mira què observen», `33.50px`, centrat) → **`leads: []` (cap entradilla `.universal-page-lead` sota l'`H2`)**.
  2. Interior de `PanellTractors.jsx` (`src/sections/tractors/PanellTractors.jsx:284-314`):
     - `H3.sdp-tractors-panell__titol` («Porta d'aprovació de tractors», `28px`, `top: 660..695 px`).
     - `P.sdp-tractors-panell__subtitol` («Els components comuns de l'app tenen sentinelles...», `17.22px`, `top: 711..781 px`) — l'entradilla general extraviada dins del panell.
     - `DIV.sdp-tractors-panell__accions` (botó «Aprovar tots els pendents (DEV)» a `top: 797..845 px`) muntat **abans** de l'explicació de l'estat.
     - `P.sdp-tractors-panell__motiu` (`16px` via `var(--sdp-text-sm)`, `top: 861..963 px`) muntat **després** del botó i amb lletra encongida.
     - `<p className="sdp-tractors-panell__avis" role="status">{avis}</p>` (`PanellTractors.jsx:313`): es munta incondicionalment encara que `avis === ''` (`height: 0 px`, `top: 979..979 px`). Com que `.sdp-tractors-panell` és `display: flex; flex-direction: column; gap: var(--sdp-space-4)` (`16px`), aquest `<p>` buit genera dos gaps consecutius (`32 px` en lloc de `16 px`).
  3. Asimetria d'encapçalaments entre panells germans: `PanellTractors.jsx:286` utilitza `<h3 className="sdp-tractors-panell__titol">`, mentre que `PanellSentinelles.jsx:218` utilitza `<h2 className="sdp-tractors-panell__titol">` (que `modules.css:8996` força a `font-size: var(--sdp-text-h4)` = `28px` i `text-align: left`, trencant la jerarquia `H1 → H2 → Entradilla → H3` d'`IDEA-27`).
- **Prescripció quirúrgica (`IDEA-27`):**
  1. Passar `lead` canònic a `UniversalPage` des de `src/sections/wiki-de-poble/WikiDePobleSection.jsx` quan `selectedItem.id === 'sentinelles_panell'`.
  2. A `PanellTractors.jsx`: retirar `.sdp-tractors-panell__subtitol`, situar `.sdp-tractors-panell__motiu` immediatament sota l'`<h3>` amb mida de cos estàndard, moure `.sdp-tractors-panell__accions` (botó DEV) **davall** del paràgraf, i renderitzar condicionalment `{avis ? <p className="sdp-tractors-panell__avis" role="status">{avis}</p> : null}` (igual que ja fa `PanellSentinelles.jsx:242`).
  3. A `PanellSentinelles.jsx:218`: substituir `<h2 className="sdp-tractors-panell__titol">` per `<h3 className="sdp-tractors-panell__titol">` per a unificar la semàntica `H3` dels dos blocs de la pàgina.

#### `G0200-04` · P2 · Absència de projecció pública de la persona propietària a `organization_directory` / `PerfilPublic` i bloqueig `idsDeQuiConnecta` en `IDEA-22`
- **Evidència al codi (`src/sections/connectar/`, `src/data/`):**
  1. Per a oferir a `/connectar` la dualitat de destí d'`IDEA-22` (connectar amb l'entitat com *La Figuera* o amb la persona propietària com *Sofía Bornay* quan té el perfil públic), actualment:
     - Quan s'entra des d'una publicació (`itemOriginal`), `autorDe(item)` (`src/config/navigation.js`) fa curtcircuit a `entitat` si hi ha `author_org_id`, descartant `owner_user_id` / `author_user_id`.
     - Quan s'entra des de la fitxa d'una entitat (`useFitxaDeConnexio.js` → `perfilPublic({ tipus: 'entitat', id })`), ni `publicDEntitat` (`src/data/localPerfils.js:263`) ni `perfilDOrganitzacio` (`src/data/supabase/perfils.js:55`, basat en `public.organization_directory`) retornen `propietariaPublica: { id, nom, slug } | null`.
  2. A més, coincidim amb la troballa **`C0200-06` (P2)** de Codex: a `src/sections/connectar/ConnectarSection.jsx:325-327`, `idsDeQuiConnecta` agrupa el `userId` personal i tots els IDs d'`administra`. Si una mateixa persona administra l'Entitat A i l'Entitat B, la UI bloqueja la connexió `Entitat A → Entitat B` tractant-la com a autoreferència, tot i que el backend SQL (`2610250100_seguiments_com_entitat.sql:288-291`) ho permet expressament (`v_entitat = p_destinatari` és l'únic cas vetat).
- **Prescripció quirúrgica (`IDEA-22`):**
  1. Avaluar la guarda d'autoreferència segons el barret seleccionat (`com`) i no contra el conjunt agregat `idsDeQuiConnecta`.
  2. Afegir `propietariaPublica` a la projecció local (`localPerfils.js` creuant `USUARIS_SEED` amb `role === 'owner'` i `public: true`) i recuperar l'autor humà de `itemOriginal` quan convisca amb `author_org_id`.

---

### 3. Diàleg Creuat amb l'Auditoria Forense de Codex (`261025_0200_auditoria_codex.md`)

Subscrivim íntegrament les 6 troballes de Codex Sol Ultra i en verifiquem l'estat al repositori:
- **`C0200-01` (P2 · `kit.js` `quiEmSegueix` sense validació de `tipus`):** Verificat que Codex ja ha aplicat l'esmena al working tree (`src/data/conformitat/kit.js:644`, `TIPUS_SEGUIT.includes(s?.tipus)`).
- **`C0200-02` (P3 · «Escriu-li» a `BlocRelacio.jsx` quan `com` és entitat):** D'acord; cal indicar explícitament que el xat directe s'obri a nom personal per no induir a creure que s'escriu des del barret d'entitat.
- **`C0200-03` (P2 · Divergència entre `porta-olivera.mjs` i `porta-taxonomia.mjs` sobre `implementacio`)** i **`C0200-04` (P2 · Ordre prematur d'arxivament a `core-higiene-escriptori/SKILL.md`):** Confirmades i integrades a la nostra arquitectura de la Secció 4 (Automillora).
- **`C0200-05` (P3/P2 · `--sdp-text-cos` i `--sdp-radi-xs`)** i **`C0200-06` (P2 · Bloqueig UI `Entitat A → Entitat B`):** Total convergència amb les nostres `G0200-02` i `G0200-04`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### 1. Proves i Comandes Executades
- **Inspecció DOM/CSS en viu (Chrome DevTools MCP `pageId: 1` a `http://localhost:3340`):**
  - `/disseny?categoria=superposicions&item=superposicions-dialeg` (`1280×800`): verificats `clientHeight === scrollHeight` en `<dialog>`, `.sdp-dialeg__marc` i `.sdp-dialeg__cos`.
  - `/disseny?categoria=superposicions&item=superposicions-visibilitat` (`1280×800`): verificats els 3 escenaris de `SelectorVisibilitat` (`896 px` d'amplada, `zeroScroll: true`) i mesurades les distàncies exactes `H4 → Botó` (`8 px`) i `Botó → H4 següent` (`0 px`).
  - `/disseny?categoria=superposicions&item=superposicions-enquadrament` (`1280×800` i `375×812`): verificades les 9 píndoles en 1 fila (`top: 535 px`, `height: 48 px`) i el peu mòbil en 1 fila (`top: 677 px`).
  - `/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell` (`1280×800`): mesurada la jerarquia tipogràfica (`H1` `39.33px`, `H2` `33.50px`, `leads: 0`, `H3` `28px`, botó abans del paràgraf i `<p role="status">` buit).
  - `/connectar?sectionId=perfil&item_id=rentonar&title=Rentonar&objecte=grup&organitzacio=rentonar&ruta=%2Frentonar`: verificada la purga de textos i blocs obsolets.
- **Validació documental i portes:**
  - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261025_0200_auditoria_gemini.md`
  - `node tooling/gates/porta-olivera.mjs`

---

### 2. Secció 4 · Consulta d'Automillora: Cicle de Vida Documental Transparent i Orquestració Autònoma

#### 4.1. Com dissenyaríeu el cicle de vida complet d'un document (`naixement → avaluació → arxivament post-commit`) perquè siga 100% transparent, atòmic i mai més depenga d'un recordatori humà?

El problema de fons que ha patit l'escriptori fins ara és que `porta-olivera.mjs` i `core-higiene-escriptori/SKILL.md` confonen **presència d'un fitxer a `04_escriptori/`** amb **estat del seu cicle de vida**, utilitzant la llista de vinyetes `## Activitat en curs` de `00_index_escriptori.md` com a únic semàfor. Això provoca dos efectes perversos: (a) si un agent arxiva immediatament en acabar el seu torn (com deia el pas 4 de la skill), priva els altres dos agents del Gauntlet de llegir el seu informe en `04_escriptori/`; (b) si ningú l'arxiva, al torn següent `porta-olivera.mjs` bloqueja amb `O1` o exigeix que el Mestre o l'orquestrador recorden evacuar-lo manualment.

Proposem una arquitectura de **Màquina d'Estats Documental de 4 Fases amb Arxivament Atòmic Post-Commit (`tooling/wiki/lifecycle.mjs`)**:

1. **Font Única de Categories Taxonòmiques (Solució immediata a `C0200-03`):**
   - Afegir `"implementacio"` a `categories_04_escriptori` dins de `tooling/wiki/taxonomia.json` i `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md`.
   - Fer que `tooling/gates/porta-olivera.mjs` importe dinàmicament les categories efímeres d'escriptori des de `taxonomia.json` en comptes de tindre una expressió regular hardcoded (`RE_EFIMER`).
2. **Fase 1 · Naixement Atòmic (`status: esborrany` + autoancoratge a l'índex):**
   - Quan un agent executa `node tooling/wiki/document.mjs create --file _wiki_de_poble/04_escriptori/YYMMDD_HHMM_<tipus>.md`, la pròpia comanda `create` (sota un pany atòmic `.agents/runtime/locks/index_escriptori.lock`) insereix automàticament `- [[YYMMDD_HHMM_<tipus>]]` a la secció `## Activitat en curs` de `00_index_escriptori.md`. Cap agent ha d'editar `00_index_escriptori.md` a mà per donar d'alta un document nou, eliminant oblits i conflictes de merge entre Claude, Gemini i Codex.
3. **Fase 2 · Avaluació i Finestra de Visibilitat del Gauntlet (`status: vigent`):**
   - Quan l'agent ompli el document i executa `document.mjs check`, el document roman a `04_escriptori/` durant tot el Gauntlet actiu (identificat pel prefix d'onada `YYMMDD_HHMM` o pel `wave_id` compartit al frontmatter). Tots tres agents poden llegir-se mútuament des de `04_escriptori/` sense que cap porta d'higiene els expulse a meitat de ronda.
4. **Fase 3 · Guarda de Destil·lació al Llibre Mestre (Prohibit arxivar sense consolidar):**
   - Abans que qualsevol document d'un lot (`auditoria_*`, `implementacio_*`, `pla_implementacio_*`) puga passar a `90_arxiu_historic/`, la guarda comprova que el seu wikilink `[[YYMMDD_HHMM_...]]` figura citat a `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (o en una Acta de `_wiki_de_poble/10_actes/`). Això garanteix per construcció que la saviesa d'un informe es destil·la al Llibre Mestre *abans* que el fitxer passe a l'arxiu fred.
5. **Fase 4 · Evacuació Atòmica Post-Commit (`lifecycle.mjs archive-wave` en hook `post-commit` o en obrir una nova onada):**
   - En el moment en què es fa el `git commit` que tanca el lot (o quan `document.mjs create` obri un nou `prompt` / `pla_implementacio` d'una onada posterior `YYMMDD_HHMM'` i detecta que l'onada anterior ja està citada al Llibre Mestre i el seu commit és a `HEAD`), el tractor executa una transacció atòmica i idempotent:
     1. Mou tots els documents del lot vençut de `04_escriptori/` a `90_arxiu_historic/`.
     2. Actualitza `00_index_escriptori.md`: retira els seus punters de `## Activitat en curs` i els afegeix a `## Arxivat amb la Porta Olivera` amb ruta `[[../90_arxiu_historic/...]]`.
     3. Reescriu qualsevol wikilink relatiu intern perquè `porta-links.mjs` i `porta-olivera.mjs` queden en verd (`exit 0`) sense que cap humà haja d'intervindre.

#### 4.2. Quins altres fluxos de treball o tractors cognitius creieu que podem madurar o simplificar de la mateixa manera?

1. **Tractor Geomètric de Sistemes de Disseny i Tokens (`tooling/gates/porta-ritme-hig.mjs` — Prevenció mecànica d'`IDEA-26`):**
   - Avui el Mestre ha hagut de detectar amb els seus ulls a `localhost:3340` que un `<h4>` estava a `8 px` del seu botó i a `0 px` del botó superior, i nosaltres hem hagut de detectar que el pla usava `--sdp-radi-xs` (inexistent a `tokens.css`) i `--sdp-text-cos` (que és un color, no una mida).
   - Podem madurar un test de contracte CSS ultraràpid (<50 ms en Vitest) que:
     - Verifique que **tot** `var(--sdp-*)` invocat en qualsevol fitxer de `src/css/*.css` existeix declarat a `src/css/tokens.css` (hauria caçat a l'instant `--sdp-radi-xs`).
     - Verifique invariants matemàtics d'Apple HIG sobre l'escala tipogràfica (`--sdp-mb-h4 >= 14px`, `--sdp-mt-h4 >= 24px`, cap contenidor `.sdp-especimen__viu > div + div` sense marge o `gap`).
2. **Poda Termodinàmica de `00_index_escriptori.md` aplicant la Llei dels 3 Esglaons (`IDEA-27`):**
   - `00_index_escriptori.md` ja té més de **1.040 línies**, de les quals més de 950 són llistes històriques d'arxius passats (`## Arxivat amb la Porta Olivera`). Cada vegada que un agent llig l'índex de l'escriptori per orientar-se, crema milers de tokens en llistes mortes.
   - Simplificació: deixar a `00_index_escriptori.md` únicament l'`Activitat en curs`, les referències mestres vives i les últimes 10 entrades arxivades, evacuant el catàleg històric complet a `_wiki_de_poble/90_arxiu_historic/00_index_arxiu_historic.md`.
3. **Contracte de Paritat SQL ↔ UI per a Seguidors i Actors (`IDEA-22`):**
   - Per evitar divergències com `C0200-06` / `G0200-04` (on l'SQL de `2610250100` admet `Entitat A → Entitat B` de la mateixa administradora però la UI ho bloqueja amb `idsDeQuiConnecta`), afegir al kit de conformitat (`src/data/conformitat/kit.js`) un cas canònic on una mateixa sessió amb dues entitats administrades (`A` i `B`) connecta `A → B` i verifica tant l'alta com la projecció en `quiSegueix` i `quiEmSegueix`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- En la **Segona Passada (`2026-10-25T03:49:00Z`)**, s'ha auditat al complet el diff consolidat de Claude (`261025_0200_implementacio_claude.md`) tant en codi com en el navegador real (`http://localhost:3340`, Chrome DevTools MCP `pageId: 1`). El codi encara no està confirmat en un commit git (`HEAD` continua en `1c110f954`).
- Les migracions SQL (`2610241430_seguiments.sql`, `2610250100_seguiments_com_entitat.sql` i `2610250300_titular_public.sql`) continuen pendents d'aplicació al Supabase de producció pel Mestre en l'ordre prescrit.
- En el mode llavor, l'única persona del padró és el Mestre (`Javi Llinares`), de manera que quan ell mateix navega a `/connectar` sobre les seues pròpies organitzacions (`Sóc de Poble` o `El Rentonar`), la guarda `senseLaPropia` oculta per disseny el bloc de titular (perquè no et connectes com a persona amb tu mateix); la casella d'opt-in `<TriaTitular>` s'ha provat i verificat en viu a `/el-meu-perfil` i el segon `<BlocRelacio>` de la titular s'ha verificat per inspecció de DOM/codi i amb la bateria `ConnectarSection.relacions.test.jsx` (`76/76` en verd).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_0200_prompt_claude_gemini_codex_maquetacio_editorial_didactica_i_ritme_pedra_seca]]
- [[261025_0200_prompt_codex_gemini_gauntlet_loop_segona_passada]]
- [[261025_0200_pla_implementacio_maquetacio_editorial_didactica_i_ritme_pedra_seca]]
- [[261025_0200_auditoria_codex]]
- [[261025_0200_implementacio_claude]]
