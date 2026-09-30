---
type: informe
status: esborrany
description: Índex de la UniversalPage fins a h6 per defecte, estils dels nivells 5 i 6, verificació al navegador i prova T4 de patrons visuals en taules llargues
tags:
  - auditoria
visibility: private
reflex: sdp:torn_bce98df3-ab72-4cc4-8bb8-8cfff8ba3661:883fba14-b946-4153-85fd-927b54cf65f8
---
# Auditoria Claude · Índex fins a h6

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bce98df3-ab72-4cc4-8bb8-8cfff8ba3661:883fba14-b946-4153-85fd-927b54cf65f8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T13:09:50.523Z |
| Modificació | 2026-09-30T13:25:00Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code, mode ultracode |
| Tokens consumits | N/D: el runtime no exposa una mesura atribuïble a este torn; la revisió adversarial en paral·lel va declarar 448.544 tokens dels seus tres subagents |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T13:09:50.523Z: esborrany creat; contingut i verificació pendents.

2026-09-30T13:25:00Z: T1–T4 executades i verificades (proves, navegador, revisió adversarial de tres lents). Informe complet. Aprovació humana pendent.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Execució de l'encàrrec

Torn `torn_bce98df3-ab72-4cc4-8bb8-8cfff8ba3661` (Claude, abast `code`). Entrada: [[260930_1404_prompt_claude]], amb la rectificació del Mestre («desfés qualsevol canvi i no toques cap targeta»), [[260930_1404_auditoria_semantic]] i [[260930_1404_pla_implementacio_semantic]].

- **T1 · Revertir les targetes.** No hi havia res a revertir. Amb el primer diagnòstic (passar `h4`/`h5` a `p`) només vaig llegir i mesurar. Cap edició d'`UniversalCard.jsx`, `peces.jsx` ni cap espècimen en tot el torn. `git status --short` no llista `UniversalCard.jsx` ni `peces.jsx`. `EspecimenUniversalCard.jsx` ix modificat per un canvi alié anterior a este torn, que no he tocat.
- **T2 · Índex fins a h6.** `src/components/universal/PageFrame.jsx:17`: `NIVELL_INDEX_PER_DEFECTE` passa de 4 a 6. S'han actualitzat els comentaris de les línies 10-16 i 181-182. Ara totes les pàgines recullen h1-h6. Una pàgina encara en pot demanar menys amb `nivellMaxIndex`.
- **T3 · Estils dels nivells 5 i 6.** `.toc-level-5` i `.toc-level-6` ja existien (`src/css/modules.css:2125-2136`, `@layer legacy`). Usen només tokens (`--sdp-space-2/4/6`, `--sdp-text-cos/suau`), sense px ni hex. No he creat res de nou. He corregit el comentari (2120-2124), que deia que «la resta de pàgines no hi arriba mai». En el mateix fil, la regla de salt del Bloc de Notes passa de `:is(h1, h2, h3, h4)` a `:is(h1, h2, h3, h4, h5, h6)` (`modules.css:3434`). Sense este canvi, els h5 i h6 que ara entren a l'Índex quedarien davall de les eines ancorades en saltar-hi. `scroll-margin-top` no pinta res en repòs.
- **Proves.** `src/components/universal/PageFrame.test.jsx` cobrix quatre casos: sense prop, l'Índex recull h3-h6, cada entrada amb el seu nivell; `nivellMaxIndex={4}` i `{5}` encara limiten; el selector per defecte és h1-h6; l'observador es prova pel camí per defecte. A `src/sections/notes/NotesEditor.capes.test.js`, la regla esperada es construïx amb `selectorIndex()` de PageFrame i ja no és una còpia a mà. Si el valor per defecte tornara a canviar sense la regla, la prova es posaria roja.

### Troballes

Totes porten fitxer, evidència, severitat, font de veritat i proposta. Cap és P0 ni P1.

**F1 · P3 · requires_human_decision: true · Jerarquia visual del calaix de l'Índex.**
- *Fitxer:* `src/css/modules.css:2114-2136`.
- *Evidència:* els estils de nivell es van pensar per a les mètriques de la Consola i ara s'apliquen a tot h5 i h6. Els `####` de la Wiki passen a h5 (`parseMarkdown.js:117-120`), i la llavor de Notes porta un h5 (`NotesSection.jsx:87`). Al navegador, a Disseny › Estudi tipogràfic, cada nivell pinta així:

  | Nivell | Sagnat | Pes | Color |
  | --- | --- | --- | --- |
  | 3 | 8px | 600 | normal |
  | 4 | 8px | 400 | `--sdp-text-suau` |
  | 5 | 24px | 700 | `--sdp-text-cos` (amb `tabular-nums`) |
  | 6 | 32px | 400 | normal |

  El fill h5 queda més negre que el pare h4, i el h4 no va sagnat respecte del h3.
- *Font de veritat:* el criteri del pla parla de subtítols h4 i mètriques h5 «correctament indentats». La vostra suggerència, al prompt, era «sumar un `var(--sdp-space-2)` per nivell».
- *Proposta:* no ho he tocat. Canviar el calaix dels nivells 1-4 és un redisseny (Llei del Píxel), i l'estil dels nivells 5 i 6 és l'ordre T2 del matí. Si ho aproveu, hi ha dues opcions:
  1. Sagnat progressiu d'un `space-2` per nivell a partir del 4, i un pes decreixent per als h5 i h6 genèrics.
  2. Reservar el 700 i `tabular-nums` a les mètriques amb una classe del calaix per pàgina.

  En tots dos casos s'ha d'actualitzar `metriques.capes.test.js:48-51`.

**F2 · P2 · fora d'abast · La doctrina de l'Índex queda desfasada.**
- *Fitxer:* `.agents/skills/sdp-universal-page/SKILL.md:31`.
- *Evidència:* la «Regla Sagrada de l'Índex» diu que l'Índex navega per `<h2>` i `<h3>`. Ara recull h1-h6 per decisió del Mestre del 260930.
- *Proposta:* amb lease, aplicar `wiki-propagar-veritat` perquè diga que l'Índex navega totes les subseccions del contingut, de h2 a h6, i que una pàgina en pot demanar menys amb `nivellMaxIndex`. Claude no pot editar `.agents/` (governança amb lease).

**F3 · P3 · Evidència superada.**
- *Fitxers:* `_wiki_de_poble/10_actes/260930_0310_acta_marmota.md:49` i el bloc de les 03:10 d'`.agents/ESTAT.md`.
- *Evidència:* tots dos diuen «Índex fins a h6 només a la Consola, 4 per defecte».
- *Proposta:* no reescriure'ls, perquè són evidència. El relleu d'este torn ho deixa superat (vegeu «Relleu proposat»).

**F4 · P3 · requires_human_decision: true · Salts de l'Índex davall de les barres ancorades.**
- *Fitxers:* `src/css/layout.css:281-282` i `:341-342` (blava i taronja sticky en mode pàgina); `modules.css:3416-3418` (eines sticky del Perfil); `modules.css:5104` (Consola).
- *Evidència:* en mode pàgina i al Perfil cap encapçalament té `scroll-margin`. A la Consola només en tenen les mètriques h5, i no els h3/h4 de les targetes. És un deute previ i igual per a tots els nivells, però ara hi ha més destins.
- *Proposta:* una sola regla d'àmbit PageFrame, `.content-wrapper :is(h1, h2, h3, h4, h5, h6) { scroll-margin-top: … }`, amb l'alçada segons el chrome (només blava, o blava i taronja).

**F5 · P3 · El paquet de WordPress porta el límit antic.**
- *Fitxer:* `wordpress-plugin/dist/soc-de-poble.standalone.js`, ignorat per git.
- *Evidència:* conté `const l7=4` dins del `selectorIndex` compilat.
- *Proposta:* recompilar el paquet autònom abans del pròxim lliurament. Fins llavors, l'Índex incrustat a WordPress continua tallant en h4.

**F6 · P3 · La prop de la Consola és redundant però útil.**
- *Fitxer:* `src/sections/consola/ConsolaSection.jsx:565` i `:574`.
- *Evidència:* passen `nivellMaxIndex={6}`, que ara és el valor per defecte.
- *Proposta:* conservar-lo com a guarda del tauler. `ConsolaSection.navegacio.test.jsx:139-159` depén que les 20 mètriques h5 siguen a l'Índex.

**F7 · P3 · Observació · Les entrades h6 ixen en majúscules.**
- *Fitxer:* `PageFrame.jsx:49` i `src/css/base.css:132`.
- *Evidència:* l'Índex copia el text amb `innerText`, que aplica el `text-transform: uppercase` de base.css als h6. A Disseny l'entrada ix «NIVELL SIS (H6)».
- *Proposta:* és coherent amb com es veu el h6, però no amb el text del document. Decisió vostra; no ho he tocat.

**F8 · P3 · Proves roges prèvies i alienes.**
- *Fitxer:* `src/sections/xat/XatSection.test.jsx`.
- *Evidència:* dues proves fallen: al mock de `./XatContext` li falta l'export `XatContext`, que usa `FakeChatOnboarding.jsx:92`. Amb el valor antic (4) fallen igual (prova A/B, vegeu Verificació). No les causa este canvi.
- *Proposta:* un torn propi que complete el mock amb `importOriginal`.

**F9 · P3 · Mètode · `content-visibility` falseja les comparacions de píxels.**
- *Fitxer:* `src/css/components.css:661-662`.
- *Evidència:* `.sp-card` porta `content-visibility: auto; contain-intrinsic-size: 400px`. L'alçada d'una targeta fora de pantalla depén de si ja s'ha pintat abans. Durant la verificació, /consola va donar 16px i després 200px de «diferència» sense cap canvi d'estil. Totes les targetes fora de pantalla feien exactament 400px.
- *Proposta:* tota comprovació automàtica de la Llei del Píxel ha de mesurar dins de la pantalla o forçar el pintat. Si no, dona falsos positius.

**F10 · P3 · Segell divergent a l'arbre.**
- *Fitxer:* tooling de segellat (vegeu evidència).
- *Evidència:* el hook `segell-auto` informa «segell divergent; cap resegellat automàtic» a cada eina des de l'inici del torn. L'arbre ja duia `protocolledge.json` i plantilles modificats per altres agents.
- *Proposta:* no l'he tocat. Cal reconciliació explícita amb lease.

### T4 · Prova de la tècnica de patrons visuals

He capturat el principi i el final de dues taules llargues de la Consola a 1.280×900. Per a cada una he fet també un recompte per codi.

- **Avisos i salut, taula de 217 arestes.** A la captura destaquen dues coses d'una ullada:
  - La píndola grisa «derivat» enmig de les blaves «declarat». El recompte per codi en dona 22 de 217.
  - Talls a mitja paraula a les columnes monoespai estretes («agent:antigrav|ity», «tasca:plaquete|s-diagnostic»), que empitjoren la lectura.

  El recompte per codi: 0 cel·les buides.
- **Inventari de skills, taula de 24 files.** A la captura:
  - La columna «Avisos», la més important, queda tallada al marge dret. La taula fa 1.018px dins d'un contenidor de 925px amb `overflow-x: auto`: s'hi arriba desplaçant la taula de costat, i res no ho indica.
  - També es veu d'una ullada que 21 de 24 skills tenen 0 lliçons i que la columna Estat barreja «actiu» i «canonic».

  El recompte per codi: 0 cel·les buides.

**Conclusió.** La tècnica és útil i complementària. La captura troba anomalies de presentació (desbordaments, talls, trencaments de patró) que les dades no mostren. Una columna tallada no es veu mai llegint el JSON. El recompte per codi dona les xifres exactes que la vista no dona. La recomanació és fer sempre les dues coses: captura del principi i del final, i un recompte per codi de cel·les buides i de valors.

Límits de la prova:
- A 1.280px la captura es reduïx a 800px d'ample: basta per a veure patrons, no per a llegir text menut.
- La franja del mig d'una taula de 217 files no ix en cap de les dues captures.

El tall de la columna Avisos i els talls a mitja paraula són troballes noves; no els he corregit, perquè són fora d'abast.

### Retroalimentació de `prompt_local`

- Quan el prompt diga «solució aprovada», el pla vinculat ha de dur l'«Estat del Pla» i l'«Aprovació humana» emplenats. Ací tots dos eren buits o pendents.
- Una rectificació ha de nomenar què revoca. «Revoca: T1 de la versió anterior» deixa a l'agent la llista exacta del que ha de desfer. Ací era clar pel text, però no per l'estructura.
- El Preflight llista només tres documents, mentre que el Protocol §2 obliga a llegir-ne tots els de l'Escriptori. Convé que el Preflight definisca el conjunt de lectura amb el motiu, o que el protocol el remeta al Preflight.
- Afegir a la plantilla un criteri de píxel mesurable (rutes, amplada de vista i manera de forçar el pintat), per la troballa F9.

### Relleu proposat per a l'ESTAT i el LEDGER

Claude no pot escriure a `.agents/` ni executar `tancament.mjs` des d'este entorn: el hook local el denega com a governança sense lease. Text proposat perquè el registre MarIA o el Mestre:

- ESTAT_ACTUAL: «L'Índex de la UniversalPage recull h1-h6 a totes les pàgines (NIVELL_INDEX_PER_DEFECTE = 6, ordre del Mestre 260930). "Índex fins a h6 només a la Consola" queda superat. Cap targeta tocada. Pendents: F1 i F4 (decisió de disseny), F2 (skill amb lease), F5 (recompilar el connector de WordPress) i F8 (mock de Xat).»
- LEDGER: «260930 | codi | PageFrame | Índex fins a h6 per defecte; targetes intactes; proves verdes».

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat | Abast real |
| --- | --- | --- |
| `npx vitest run` de set fitxers de l'Índex (PageFrame, PageFrame.barra, BarraBlava, UniversalEditorShell.accions, ConsolaSection.navegacio, metriques.capes, NotesEditor.capes) | 7 fitxers, 49/49 passen | Després dels retocs de la revisió |
| `npx vitest run src` | 233/234 fitxers i 3.432/3.434 proves passen; 2 roges a `XatSection.test.jsx` | Les 2 roges són prèvies (F8) |
| A/B de les roges de Xat amb `NIVELL_INDEX_PER_DEFECTE = 4` | Mateixes 2 roges, mateix error | Prova que no depenen del canvi. El valor es va restaurar a 6 tot seguit |
| Navegador · Disseny › Estudi tipogràfic, sense `nivellMaxIndex` | L'Índex recull «Nivell cinc (h5)» a nivell 5 i «NIVELL SIS (H6)» a nivell 6 | Prova del camí per defecte |
| Navegador · /consola, Índex obert | 50 entrades: 2 h2, 14 h3, 14 subtítols h4 i 20 mètriques h5 sagnades | Criteri d'acreditació del pla |
| Píxel · comparació d'estils computats (37 propietats) i caixes de títols, subtítols, mètriques, cossos i targetes, abans i després | /consola/pols, /control, /mur, /mercat i /consola/inventari: 0 diferències. /consola: 0 diferències d'estil; les caixes es mouen per F9 | Llei del Píxel, fora del calaix de l'Índex |
| A/B de l'alçada de la targeta «Avisos i salut» amb 4 i amb 6 | 400px estables en tots dos casos | Descarta que el canvi afecte la maquetació |
| Revisió adversarial, 3 lents (correcció i proves, píxel, doctrina) | Cap P1. Un P2 fora d'abast (F2). P3 en abast aplicats: proves de PageFrame, guarda de NotesEditor i dos comentaris | Workflow `revisio-index-h6` |

Durant la revisió, una lent va veure `PageFrame.jsx:17` a 4 durant uns segons. Era la prova A/B d'esta mateixa sessió, restaurada a 6 i reverificada amb les proves dirigides.

Neteja: les claus de mesura `__sdp_baseline_*` que vaig desar al `localStorage` del navegador integrat estan esborrades. La pestanya de proves és pròpia i no toca la del Mestre.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Fitxers editats en este torn:**
  - `src/components/universal/PageFrame.jsx` (constant i comentaris)
  - `src/components/universal/PageFrame.test.jsx`
  - `src/css/modules.css` (dos comentaris i la regla de salt de `.sdp-bloc`)
  - `src/sections/notes/NotesEditor.capes.test.js`
  - este informe
- **Canvis d'altres agents.** El diff de `modules.css` inclou canvis d'altres (per exemple `.universal-search-input`), presents abans del torn. El commit s'ha d'agafar per trossos.
- **Què no he fet:**
  - Cap targeta, espècimen, skill, fitxer de `.agents/` ni fitxer de `01_produccio/`.
  - Cap commit, push, arxivat ni moviment de documents.
- **Relleu i tancament.** No he pogut actualitzar ESTAT ni LEDGER, ni executar `tancament.mjs`, per la protecció de governança del hook. El relleu proposat és a Troballes.
- **Mètode i abast de la verificació.**
  - He verificat en el navegador integrat, amb el servidor de desenvolupament que ja corria al port 3340.
  - No he verificat el connector de WordPress ni la vista incrustada de la Wiki.
  - He llegit sencers els documents vius de l'Escriptori:
    - el prompt i el pla de Codex (1312), l'auditoria de Codex (1325), l'acta de tancament (1347) i el prompt d'execució (1350);
    - els tres documents 1404;
    - el pla de l'Agenda (1510), creat per MarIA durant este torn. Preveu tocar `UniversalCard.jsx`, però no col·lidix amb este canvi.
  - No he llegit `90_arxiu_historic/`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
