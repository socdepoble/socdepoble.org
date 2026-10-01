---
type: informe
status: esborrany
description: Anàlisi de les 62 captures del clon de Google Calendar i trasllat a les vistes Setmana i Mes en mòbil amb tokens de Pedra Seca, amb proves i decisions pendents.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:c1de4a92-5b7a-4d18-9da9-f9130702e744
---
# Auditoria Claude: maquetació visual i mòbil del calendari (clon de Google Calendar)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_abb973ce-0976-4614-9b4d-e06dbc07dd43:c1de4a92-5b7a-4d18-9da9-f9130702e744 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T02:53:48.122Z |
| Modificació | 2026-10-01T05:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5-5 (Claude Code, Ultracode: orquestradora i subagents del mateix model) |
| Tokens consumits | Subagents: anàlisi de les captures 0,91 M + fase visual amb revisió i correcció 3,64 M = 4,55 M. El fil principal no es mesura des d'ací. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01T02:53:48.122Z: esborrany creat; contingut i verificació pendents.
2026-10-01T03:30:00.000Z: el Mestre passa pel xat el prompt 261001_0445_prompt_claude_calendari (estat actiu) i set captures més: Mes, Any, Agenda, 2 setmanes, Aparença clara i fosca, i Setmana fosca.
2026-10-01T05:40:00.000Z: troballes, verificació i límits escrits després de l'anàlisi de les captures (7 agents), la fase visual (13 agents: 3 fronts, 6 revisors, 3 correctors i la verificació global) i la verificació visual de l'orquestradora al navegador.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Procediment:
1. **T1, anàlisi.** Sis analistes es reparteixen les 62 captures de `01_produccio/google_calendar_clon_pantalla/` (el prompt escriu el nom de la carpeta amb una errada, «clendar») i un sintetitzador les mapa sobre Pedra Seca.
2. **Contracte comú.** L'orquestradora escriu:
   - `useAmpladaContenidor` i `esEstret`: el mode es decidix per l'amplada del contenidor, no per la del viewport;
   - `classeDeFont`;
   - els àlies `--sdp-cal-*`, derivats de tokens semàntics existents i declarats dins de l'App, perquè el tema fosc els resolga sol.
3. **T2-T4, implementació.** Tres fronts amb propietat disjunta, dos revisors adversarials per front i un corrector.
4. **Privacitat.** Cap títol, nom ni import de les captures (l'agenda personal del Mestre) ha entrat al codi, a les proves ni als espècimens: la llavor és neutra.

### V1 · Arquitectura observada (T1) · confiança: verificada sobre les captures

- **Setmana:** 7 columnes iguals i hora constant de 48 px. Capçalera amb abreviatura xicoteta i número gran; hui en cercle. Columna horària HH:00 centrada sobre la línia, només amb hores en punt. Franja de tot el dia, blocs plens amb el títol en negreta i l'interval, i línia d'ara (punt i línia) només a la columna de hui.
- **Mes (captura 1):** les setmanes justes (4-6 files), el número centrat i «1 de nov.» al primer dia d'un mes veí. Dins de cada cel·la, primer les barres de tot el dia i després les línies «● HH:MM Títol».
- **Altres vistes:**
  - 2 setmanes: la mateixa anatomia que el mes.
  - Any: 12 mini-mesos.
  - Agenda: una llista agrupada per dia.
- **Fosc:** tons apagats i graella quasi negra.
- **Densitat:** Responsiva, Normal o Compacta.
- **Solapaments.** A les captures només hi ha sagnat en cascada; no s'hi veu cap parell simultani en columnes paral·leles. La implementació fa columnes voraces amb expansió cap a la dreta (`disposaDia`) i deixa la cascada com a opció. `requires_human_decision: true`.
- **Descartat per accessori:** barra lateral de Google, estadístiques, llocs de treball, programació de cites, cerca de persones i dreceres.

### V2 · Setmana i tira mòbil (T2-T4) · confiança: verificada en proves i al navegador

- **Visual.** `VistaSetmana` pinta les captures:
  - capçalera enganxosa davall de la barra blava;
  - hui en cercle invers (`--sdp-cal-hui-*`) i dia triat amb `--sdp-accio-subtil` i vora `--sdp-accio-text`;
  - blocs del color de la font (esdeveniment, publicació, producte, pàgina, agenda), amb vora d'inici i títol amb `line-clamp`;
  - blocs curts (<50 min visibles) en una línia;
  - línia d'ara amb `--sdp-cal-ara`;
  - rang horari dinàmic de 7 a 22, ampliat si hi ha actes fora d'eixe interval.
- **Mòbil.** S'ha llevat la `@media (max-width: 40rem)`. En un contenidor estret (<41,5 em) la vista fa una TIRA: 7 botons de dia de 44 px o més, enganxosos, i la graella d'un sol dia.
- **Densitat.** Prop `densitat`. La compacta només s'aplica amb `pointer: fine`, perquè en pantalla tàctil cap control pot baixar de 44 px.
- **Corregit en revisió:**
  - actes tardans que desapareixien (`encaixaFinalDelDia`);
  - interval que es partia en dues línies;
  - densitat compacta que retallava text;
  - sostre del sticky al catàleg en mòbil;
  - botons de la tira per davall de 44 px.

### V3 · Mes i Dues setmanes · confiança: verificada en proves i al navegador

- **Visual.** `VistaMes` pinta:
  - les setmanes justes (setembre de 2026 = 5 files) o N setmanes des d'un dilluns, per a la vista Dues setmanes;
  - «1 de nov.»;
  - hui en cercle invers;
  - barres per font i línies «● HH:MM Títol»;
  - «+N més» accessible.
- **Mòbil.** Mode compacte en estret: cel·les-botó de 49 px a 375 px, només punts.
- **Corregit en revisió:**
  - punt de producte en fosc, que baixava de 3:1;
  - agenda de Sollutia indistingible de la publicació: ara la diferencia la forma, anell o contorn;
  - nom de la regió sense apòstrof («d'octubre»);
  - focus confós amb el dia triat.

### V4 · Agenda, Any, navegació i integració · confiança: verificada en proves i al navegador

- **`VistaAgenda`.** Llista per dia amb hui en cercle, punt de font, hora en columna fixa i línia d'ara. Comença a hui si és el mes en curs.
- **`VistaAny`.** 12 mesos amb `auto-fill`, sense media queries. Té un sol punt de tabulació i es navega amb fletxes; un clic en un dia obri `?vista=setmana&date=…`.
- **`NavegacioPeriode`.** Hui, ‹, ›, títol amb `aria-live` i selector de 5 vistes amb `aria-pressed`.
- **`estatCalendari`.** `?vista=setmana|dues-setmanes|mes|any|agenda`, amb navegació per vista. Totes les URL antigues donen el mateix estat.
- **Pastilla de data.** Dins de les vistes noves, la pastilla de les targetes portava al calendari vell (defecte de F7 de 261001_0400). Ara porta a `?vista=mes`.
- **Corregit en revisió:**
  - Cascada heretada de base.css i sdp.css: els dies de l'Any es desbordaven, els mini-mesos feien scroll propi en mòbil, les setmanes ixien ratllades i hi havia ratlles de més.
  - Pèrdua del mes en tornar d'una vista de setmanes.
  - Salt de graella en clicar un dia veí.
  - Dia triat anterior a hui sense agenda.

### V5 · Defecte trobat per l'orquestradora al navegador · severitat alta · corregit

- **Símptoma.** A `NavegacioPeriode`, les fletxes ‹ › eren dos cercles blaus sense icona i «Hui» ixia en blau en lloc de secundari.
- **Causa** (mesurada amb `getComputedStyle` i les regles CSS aplicades). `PerfilShell.css`, un deute previ que ja anota `modules.css:6395`, carrega en la mateixa capa després de `modules.css` i torna a pintar tot `.sdp-boto` amb farciment de 24 px i fons blau. El farciment trepitjava el `padding: 0` de la fletxa i deixava l'SVG en 0 px d'ample.
- **Per què no ho veien les proves.** jsdom no aplica la cascada.
- **Correcció** (`modules.css`, bloc de navegació): el mateix patró que `.sdp-drets`, selectors de context de (0,2,0) que tornen les varietats secundària i fantasma i el `padding: 0`. Verificat al navegador.
- **Deute que queda.** La causa de fons, un `.sdp-boto` global a PerfilShell.css, continua afectant qualsevol `.sdp-boto` sense context. Proposta: moure eixe full a regles amb context (deute V3, que ja coneix tractor-vocabulari). `requires_human_decision: true`.

### V6 · Decisions per defecte a ratificar pel Mestre (`requires_human_decision: true`)

1. **URL i accés.**
   - Paràmetres: `?vista=` amb `?setmana=AAAA-Www`, `?mes=`, `?any=` i `?date=`.
   - Sense `?vista`, `/calendari` queda idèntic, i les vistes noves només s'obrin per URL. Afegir el selector a la vista per defecte canvia píxels.
2. **Colors.**
   - Cercle de hui invers, i el blau reservat al dia triat.
   - Línia d'ara en taronja AA (`--sdp-accent-text`), no roig `--sdp-error`.
   - Colors tonals per font.
3. **Interacció.**
   - Els blocs no són interactius.
   - Minuts mínims visuals d'un acte sense fi: 30 (són instants: publicacions i productes).
   - Bloc curt per davall de 50 minuts visibles.
4. **Mòbil.**
   - Setmana en tira d'un dia, i no vista de 3 dies.
   - Mes compacte només amb punts.
   - Any en 1-2 columnes.
5. **Densitat.** «Responsiva» i «Normal» pinten igual. La compacta només amb ratolí. No hi ha cap selector de densitat a la interfície.
6. **Agenda.** Comença a hui en el mes en curs. Dues setmanes conserva el `?setmana=` quan es tria un dia.
7. **Vista per defecte en mòbil.** L'agenda o la setmana serien millors que el mes vell. No s'ha aplicat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Suite completa**, verificació global del workflow: `npx vitest run src` dona 304 de 305 fitxers i 4497 de 4499 proves. Les 2 roges són les ja conegudes de la barra mòbil «Telefonades» (`src/app/App.test.jsx:455` i `:488`), d'un altre torn.
- **Després de la correcció V5:**
  - `npx vitest run src/components/PedraSeca/organismes src/sections/calendari src/utils src/hooks`: 39/39 fitxers i 599/599 proves.
  - `node --test tests/lint_calendari.test.mjs tests/lint_calendari_mes.test.mjs tests/contrast_calendari_setmana.test.mjs tests/contrast_calendari_mes.test.mjs`: 44/44.
- **Contrast** (porta nova, resol els tokens en clar i en fosc):
  - Text dels blocs: de 5,17:1 a 11,20:1 en clar i de 5,43:1 a 15,20:1 en fosc.
  - Vores d'inici: ≥ 3,45:1.
  - Hui: 19,42:1 en clar i 18,01:1 en fosc.
  - Línia d'ara: ≥ 4,68:1 sobre qualsevol superfície.
- **`design_guard`:** les mateixes 2 infraccions preexistents en fitxers no tocats (`Dialeg.test.jsx`, `DocumentPrintPreview.jsx`). `raw-color` baixa de 20 a 17.
- **Navegador**, servidor de desenvolupament de 3340, pestanya pròpia:
  - Setmana a 1280 px, en clar i en fosc.
  - Tira a 375 px: 7 botons de 49 px, sticky davall de la barra blava, sense scroll horitzontal (`scrollWidth` = `clientWidth` = 375).
  - Mes a 1280 px (5 files) i compacte a 375 px (cel·les de 49 px).
  - Agenda i Any a 1280 px.
  - `/calendari` sense `?vista`: cap classe `sdp-cal-*` i el calendari vell present (Llei del Píxel).
  - `/fedivers` es pinta.
  - Consola sense errors.
- **No verificat:**
  - Safari 16 (sticky amb `overflow: clip`, `line-clamp` sobre flex).
  - Chrome 100 i Firefox 100.
  - Dins de l'amfitrió WordPress (Shadow DOM, rem aliè).
  - Dispositius tàctils reals.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Vista Mes.** S'ha fet amb la captura 1, la d'escriptori. No hi ha cap captura del mes en mòbil, i el mode compacte és una adaptació pròpia.
- **Rang de dades.** Supabase limita a 50 publicacions per secció (`content.js:122`): els mesos vells eixiran buits. L'agenda de Sollutia no té cap adaptador (`loadActesAgenda`).
- **Aritmètica de 24 h** heretada d'`ocorreElDia`: un acte repetit que creua un canvi d'hora pot guanyar o perdre l'últim dia. Arreglar-ho afecta el Mur i la Consola.
- **Bundle.** La correcció no arribarà a gentdelatorre.net sense regenerar `wordpress-plugin/dist`, i el hook prohibix el build.
- **Governança.** No he pogut tocar ESTAT, LEDGER ni `tancament.mjs`, ni tornar a segellar les skills (hook `segell-auto`). Tampoc he pogut executar les portes `tractor-*` fora de la llista de lectures.
- **WCAG 2.5.3, parcial.** «1 de nov.» té el nom accessible «1 de novembre».
- **Deute de sèrie, fora d'abast.** `.sdp-pindola__opcio[aria-pressed=true]` pinta blanc sobre `--sdp-accio` a 3,87:1 a tota l'App. El calendari ho sobreescriu amb `--sdp-accio-control` (9,21:1).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
