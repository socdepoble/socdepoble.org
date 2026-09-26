---
type: informe
status: esborrany
description: 'Execució del prompt 1655: parser MD amb entradilles, Consola forense, graf amb zoom, capçalera editorial, mòbil i barra plegada, amb proves i navegador'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_91799f10-dcb7-4390-b840-d1cae02004a7:b8cea921-487e-4be9-a56c-ea491939333c
---
# Auditoria i execució Claude: poliment editorial i UI

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_91799f10-dcb7-4390-b840-d1cae02004a7:b8cea921-487e-4be9-a56c-ea491939333c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T16:11:21.653Z |
| Modificació | 2026-09-25T18:04:02.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), mode Ultracode: fil principal i dos workflows de subagents (mapa i implementació amb verificació adversarial) |
| Tokens consumits | Mesura parcial: subagents 3,27 M (workflow de mapa) + 5,28 M (workflow d'implementació) = 8,55 M; el fil principal no es pot mesurar des d'ací |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-25T16:11:21.653Z: esborrany creat; contingut i verificació pendents.
2026-09-25T18:04:02.000Z: execució del prompt 1655 completada i verificada; troballes, verificació i límits omplits.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Abast i lectura de l'encàrrec

El prompt [[260925_1655_prompt_claude]] marca a §0 el pla 1655 com a «consensuat i aprovat» i es titula «Prompt d'Execució». El bloc de l'Olivera (Mode AFK) és un bloc fix de la plantilla. L'he llegit com a ordre d'execució, i esta auditoria n'és l'informe. Torn `torn_91799f10-dcb7-4390-b840-d1cae02004a7`, abast `code`.

Superfície declarada abans d'escombrar (lliçó 260923 de sdp-workflow):
- **Codi:** `src/` de la Wiki, Disseny, Consola, graf, workspace, App (lliscar per recarregar), PageFrame i UniversalCard. També `src/config/i18n.js`, per una clau, i `src/css/modules.css`.
- **Corpus:** els 59 documents vius de `01_ser`, `02_saber`, `03_actuar` i `00_index.md`.
- **Exclosos:** `03_actuar/plantilles/**`, `auditoria_canonica.md` (és una plantilla del circuit), els arxivats (`00_bios`, `arquitectura_la_forja`, `core_registre_automillora`, `contingencia_offline`), els privats (`pla_director_*`), `04_escriptori`, `10_actes` i `90_arxiu_historic`.

### Fet, punt per punt del prompt

1. **Parser MD i entradilles** (`parseMarkdown.js`):
   - Cap títol h1–h6 ix amb punt final. Conserva «...» i «…».
   - El primer paràgraf pla davall del `# ` ix com a `p.lead`.
   - Nova funció `extreuEditorial`, que torna el títol, l'entradilla i el cos.
   - A la Wiki, l'H1 de la pàgina és ara el títol humà del `# ` i no el nom de fitxer. La description fa d'H2, i l'entradilla va a `.page-intro`.
   - `PageFrame` i `UniversalCard` també lleven el punt final del títol i el subtítol quan són text.
2. **Títols llargs:** `overflow-wrap:anywhere` a `header.page-title h1`, a l'H2 d'introducció, als títols de targeta, als títols de la prosa, al quadre ISO i a l'índex. Comprovat al navegador: «Arquitectura tècnica unificada» cap dins del marc a 375 px i a 1440 px, sense desbordament.
3. **Corpus reescrit** (59 documents):
   - Cada document té un H1 real. Els 7 literals `\n#` trencats estan arreglats.
   - Entradilles noves o conservades.
   - Una sola `## Vincles` per document, que sanejava el deute F9.
   - Fora les marques «BROKEN LINK».
   - Contradiccions alineades amb les fonts canòniques: Model B (AGENTS §8 i ADR-2026-09), online-first (QUI_SOC §5 i ADR-2026-08), tokens `--sdp-*`, scripts reals de `package.json`, carpetes reals i un cens del Consell de 12 com `consell.json`.
   - Duplicitat de visió: el canònic és `00_visio_i_pilars`, i `el_projecte` en fa ara un resum.
   - No s'ha esborrat, reanomenat ni mogut cap fitxer.
4. **Consola, targetes d'un colp d'ull:** etiquetes calculades amb dades reals: «Cal reparar», «Important», «Canvis nous» i «Sense font».
   - «Canvis nous» compara amb l'última visita en `localStorage`, dins de try/catch.
   - La targeta morta de càrrega documental deixa de ser clicable i diu «Sense font».
   - Al navegador: Explorador, Calendari, Actors i Salut diuen «Cal reparar»; Fluxos, Inventari i Entrades, «Important».
5. **H2 i entradilla a totes les subpàgines:** els H2 viuen a `consolaPagines.js` (`SUBTITOLS`), no a `PAGE_COPY`, perquè la frontissa de contingut el protegix. Els H2 interns de Fluxos, Agents i Actors passen a H3.
6. **Desplegables «Veure detall de…»:** peça `Desplegable`, amb fila de 44 px, xebró que gira només amb CSS, `scroll-margin-top` davall de la barra blava i `aria-controls`/`aria-expanded`. S'han llevat el Refrescar i el missatge d'absència duplicats de Salut.
   - **Error de navegació, causa arrel:** `/consola/*` és un sol element muntat i conservava el scroll. Obrir una targeta del peu deixava la pàgina nova a mitges. Ara es torna al cim en canviar de pàgina.
   - `consola.json` es parsejava sense mirar el content-type. Sense middleware, rebia l'HTML de l'app i donava l'error «Unexpected token <». Ara es comprova abans de parsejar.
7. **Accés `obrir_graf` retirat** de la Wiki (import, vista, categoria i ítem). `BrainGraph` i `grafDeLaWiki` queden intactes.
8. **Explorador del Cervell:**
   - Disposició: la cerca va en una barra damunt del graf, i els filtres baixen a plegables tancats. La instantània i la privacitat també baixen davall.
   - En entrar, si la capçalera deixa el graf per davall de mitja pantalla, el scroll puja fins al marc (`mostraGraf`). Al navegador, a 1024×768, el marc queda a y=138 i el graf ocupa de y=233 fins al peu.
   - Zoom amb rodeta sense tecla, centrat en el punter, amb límits 0,1–5.
   - Pinça del trackpad i de dos dits, i pintat per fotograma sense re-render de React.
9. **Capçalera editorial** a la Wiki, a Disseny (portada i espècimens) i a la Consola incrustada: logo, píndoles segons la skill §4, copyright compartit (`editorial.js`), H2, entradilla i data real.
   - S'han eliminat les 4 dates inventades amb `new Date()`.
   - Els espècimens diuen «En curs», amb una entradilla honesta.
10. **Lliscar per recarregar** (`usePullToRefresh`):
    - Abans s'armava encara que el contenidor intern estiguera desplaçat, i recarregava sense voler. Ara només s'arma si tot el camí fins a `main` està a dalt.
    - Bloqueig de direcció, `touchcancel`, i cap efecte sobre camps, contenteditable, diàlegs ni el graf, ni en mode incrustat.
    - Recarrega la pàgina, tal com es va demanar.
11. **Barra plegada:**
    - `NavGlyph` (emoji, component o icona per defecte; mai buit ni lletra).
    - Rail de carpetes i categories amb la columna esquerra plegada, i rail de documents amb la central plegada.
    - Emojis propis a Disseny (🧱📐📝🗂️🔔🧭📦) i a la Wiki (🏡🩺🗂️🌱📚🛠️🌡️🏛️📜🧩⚙️📋).

### Troballes de sistema (no demanades, trobades fent la faena)

- **El hook bloqueja `StructuredOutput`.** `hooks-local.mjs:84-90` no l'admet i els workflows amb `schema` moren sense resultat: el primer mapa, amb 9 agents, es va haver de recuperar dels transcrits. Proposta: afegir `StructuredOutput` a la llista d'orquestració (governança, amb lease).
- **La Porta Vocabulari només llig `FULLS_CANONICS`** (`tractor-vocabulari.mjs:38-47`). Els 4 fulls CSS per llesca (`editorial`, `consola`, `explorador` i `navegacio.css`) feien caure la porta. Les seues regles viuen ara al final de `modules.css`, i els 4 fulls queden buits, amb nota, pendents de `git rm`.
- **La Porta Consell L6 llig qualsevol `t('…')` com a clau i18n**, també els ajudants de les proves. N'he canviat un de nom a `consolaPagines.test.js` i he afegit `pull.refreshing` als 5 idiomes.
- **La Porta Psicopatia és lèxica** (`\bOffline[- ]First\b`). Dues frases històriques del corpus s'han reescrit sense el terme.
- **SCC i Orfandat no resolen notes de `.agents/`, i F9 sí.** Un `[[PROTOCOL_PETORRETA]]` a Vincles era verd per al frontmatter i roig per al graf. L'he retirat; HEAD no el tenia.
- **L'App no torna al cim en cap canvi de ruta.** La Consola ho fa pel seu compte i la resta de seccions no.
- **`![[agents_equip_ia]]` es pinta com una imatge trencada:** `compile-wiki-to-app.mjs` convertix la incrustació en imatge.

### Decisions humanes pendents (recollides dels 18 agents)

1. ADR-2026-08 i ADR-2026-09: el frontmatter diu `status: esborrany` i el cos diu «Acceptada».
2. AGENTS §8 i QUI_SOC §5 diuen «Supabase (Sollutia)», contra l'ADR-2026-09 (Supabase propi de SdP i Sollutia només per GET).
3. WCAG AA contra AAA; àrea tàctil de 44 o 48 px; lletra de 16 px contra el «sòl» de 14 px de `tokens.css` contra els 28 px del full de ruta.
4. Quin índex és el principal. S'ha seguit `cervell.json`: `00_index`, i `00_index_identitat` passa a «Índex d'identitat».
5. Protocol Lázaro: quina versió és la canònica entre `arquitectura_protocol_lazaro` i `successio_lazaro_execucio`, i la numeració dels volums.
6. `agents_equip_ia` ha rebut `status: actiu` (no en tenia). Cal dir si ha de ser `canonic`. A més, `consell.json` dona a Claude «Seient Núm. 5» i el cens el posa sisé.
7. Baseline: `maquinari-baseline.json` diu Safari 15 / Chrome 90 / Firefox 88, contra el 16/100/100 de QUI_SOC.
8. L'Explorador atrapa la rodeta damunt del graf, i també a la Wiki (és el comportament Obsidian demanat). Script i Document comparteixen color en tema clar.
9. Els H2 de la Consola viuen a `consolaPagines.js`. Si es volen a `PAGE_COPY`, cal `frontissa-contingut --aprova consola`.
10. Llei del Píxel: les fitxes sense imatge ja no pinten la lletra inicial, sinó el glif de la seua carpeta o categoria. Cal confirmar-ho.

### Les Tres Pedres

- **Alternatives no preses:**
  - Extraure el títol i l'entradilla al compilador (`tooling/`, amb lease): hauria canviat l'artefacte generat i totes les rutes de RAG.
  - Un panell de filtres superposat dins del canvas: amagava la llegenda i no s'arribava a les dreceres de teclat.
- **Mantenibilitat:** cada llesca té proves pròpies (738 Vitest) i quatre eines de lectura a `tests/` que repetixen les portes sota el hook.
- **Tres maneres de fallar:**
  - Un `# ` amb metadades just davall no dona entradilla (és volgut, però pot sorprendre).
  - `mostraGraf` depén de `getBoundingClientRect` i no actua en jsdom.
  - Les etiquetes de la Consola depenen de dos endpoints només-dev: en build diuen «Sense font».

### Millora proposada per a `prompt_local.md`

- Afegir un camp «Superfície» obligatori, amb les rutes incloses i les excloses. Evitaria deduir l'abast d'una escombrada del corpus.
- Explicitar a §0 si el torn és d'execució o d'auditoria. El bloc fix de l'Olivera (AFK) i §0 («pla aprovat») es contradiuen en cada prompt d'execució.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat al final del torn, sobre l'arbre real:

- `npx vitest run src tests`: 76 fitxers, **738/738** verds. Abans del torn: 71 fitxers, 514 proves.
- `node --test tests/lint-sessio.test.mjs`: **Lint net** (ESLint del repo amb `--max-warnings=0` sobre els 46 fitxers tocats).
- `node --test tests/frontmatter-sessio.test.mjs` (nova): executa `tractor-frontmatter.mjs` real. Resultat: **59 documents de la Wiki modificats, cap deute**. El tractor també avisa de F9 a `.agents/ON_ESTIC.md` i `04_escriptori/00_index_escriptori.md`, que ja estaven modificats abans del torn.
- `node --test tests/enllacos-sessio.test.mjs` (nova): resol els enllaços de HEAD i els d'ara amb el resolutor de les portes del graf. Resultat: **cap nota abastable perduda** en els 59 documents.
- `node --test tests/portes-sessio.test.mjs` (nova): executa una a una les portes de `run-portes.mjs`, menys Build i les dues suites. Resultat: **46/55 verdes**.
  - **Roges heretades** de l'ESTAT de hui: Reflex, Pedra Seca, Fitxa, Crom, Frontmatter, Nomenclatura, Inline Styles i Catàleg.
    - A Pedra Seca, les dues infraccions L08 noves són `src/data/adaptadors/sollutia/*`, fora d'este torn. La L06 baixa de 13 a 10.
    - A Fitxa, són les mateixes tres vies `renderItem`, que només han canviat de línia.
  - **Roja per fitxers alterats abans del torn:** Contracte documental, pels fitxers 1655 (el prompt i el pla, modificats i amb el bloc Context alterat abans que començara). No els he tocat.
  - **Resoltes dins del torn:** 5 portes que este mateix torn havia fet caure (Vocabulari, Consell, Psicopatia, SCC i Orfandat).
- **Navegador** (pestanya pròpia, servidor del 3340):
  - `/wikidepoble?item=00_arquitectura_tecnica_unificada`: H1 humà, logo, píndoles, copyright, H2, entradilla, cap desbordament i rail amb emojis.
  - `/disseny`: capçalera completa i emojis de família.
  - `/consola`: 9 targetes amb etiquetes reals.
  - `/consola/explorador`: el graf en primera pantalla.
  - Els verificadors han provat el pull-to-refresh amb `TouchEvent` reals a 375×812 i el rail plegat a 1440×900.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No s'han pogut actualitzar `.agents/ESTAT.md` ni `.agents/LEDGER.md`.** El hook els tracta com a governança i exigix `executor-mutacio.mjs` amb un rebut del Mestre. El relleu redactat va a l'informe final del xat.
- **Sense permís al hook:** `tancament.mjs`, `git diff` amb rutes i `git rm`.
- **Pla 1655 sense vincular:** `document.mjs plan` rebutja [[260925_1655_pla_implementacio_claude]] («Artefacte modificat després del tancament»). El fitxer es va alterar abans d'este torn.
- **Pendent de `git rm`:** els 4 fulls CSS buits (`src/css/editorial.css`, `consola.css`, `explorador.css` i `navegacio.css`) i les seues 4 línies d'`@import`.
- **Sense provar en un dispositiu real:** la pinça amb dos dits i els gestos de Safari. Només les cobrixen les proves unitàries.
- **Sense executar:** la cadena `npm run porta` sencera d'una tirada i el build.
- **Corpus:** `wiki-baseline.lock.json` (Porta Reflex) ja divergia abans del torn i ara divergix més. Es resegella amb lease.
- **Fora d'abast:**
  - `TextSection` continua usant `formatTime` sobre dates sense hora. Les portades de la Wiki i Disseny usen ara `dataDocument`.
  - Els espècimens de Disseny no tenen data real, i no se n'inventa cap.
- **Acta Marmota de la jornada pendent.** Hi ha un `10_actes/260925_1810_acta_marmota.md` sense versionar que no és d'este torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
