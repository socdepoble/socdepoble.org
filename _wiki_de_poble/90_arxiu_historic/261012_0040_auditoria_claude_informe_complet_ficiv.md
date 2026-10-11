---
type: informe
status: esborrany
description: Informe de l'HTML íntegre a 15 pt amb el text sencer dels quatre fitxers FICIV, i el sistema de disseny editorial (CSS, esquema JSON i generador Python) per a MarIA.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:06a150d1-c790-4321-bc62-e7ae3a81ac70
---
# Auditoria Claude Informe Complet FICIV

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:06a150d1-c790-4321-bc62-e7ae3a81ac70 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T22:38:01.742Z |
| Modificació | 2026-10-11T23:05:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (Claude Code, fil únic, sense subagents) |
| Tokens consumits | ≈ 0,12 M en este torn (l'HTML complet pesa ≈ 110 KB; els quatre fitxers del sistema ≈ 25 KB) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-11T22:30:00.000Z: lectura del prompt `261012_0025_prompt_claude_informe_complet_editorial` i del pla `261012_0025_pla_implementacio_informe_editorial`; relectura íntegra dels quatre fitxers font del laboratori (idèntics als del torn 261011_1400).
2026-10-11T22:38:01.742Z: esborrany creat; contingut i verificació pendents.
2026-10-11T22:45:00.000Z: `informe_completo_ficiv_2026.html` escrit amb el text sencer dels quatre fitxers, base de 15 pt i el mateix sistema visual del torn anterior.
2026-10-11T22:52:00.000Z: verificació al panell del navegador (captures i recomptes per JavaScript); lectura de `tooling/pdf/render_pdf.sh`.
2026-10-11T22:55:00.000Z: sistema de disseny escrit a `02_investigacio_ia/261012_0040_sistema_informes_claude/` (CSS, generador Python, esquema JSON i README).
2026-10-11T23:05:00.000Z: informe complet. Hores UTC aproximades; en hora local ja és 12 d'octubre.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### El lliurable

`_wiki_de_poble/04_escriptori/02_investigacio_ia/261011_1400_ficiv_claude/informe_completo_ficiv_2026.html`: un sol fitxer HTML amb el CSS incrustat, **text íntegre** dels quatre fitxers, lletra base de **15 pt**, dues columnes. El fitxer del torn anterior (`informe_editorial_ficiv_2026.html`) i els quatre originals no s'han tocat.

Ordre del document:

1. **Portada** a una columna: la capçalera literal del `INFORME_PARA_CARMEN.txt` (títol, línia de la convocatòria, «Redactado el…», «Escrito en castellano…»), la caixa fosca del termini, metadades, «Cómo leer este documento» i índex.
2. **Parte I · Informe para Carmen Chaves**: les seccions 0 a 9 senceres. La secció 0 inclou la llista «Lo que hay en este informe»; la 1 va en passos numerats; la 2 són 15 fitxes amb els sis camps de cada línia de la font (criteri, punts possibles, el que declares, el que veig, què adjuntar, risc) més el «Resumen de puntos» en caixa; la 3 en llista a–j; la 4 amb la caixa d'errors del catàleg; la 5 amb els sis subapartats i les deu regles; la 6 amb l'avís previ i els nou camps A–H més la firma; la 7 amb les catorze caselles i la frase final; la 8 i la 9 senceres.
3. **Parte II · pressupost_ficiv_2026.csv**: taula de gastos (14 files, 5 columnes) i taula d'ingressos (6 files), i davall de cada una les observacions normatives de totes les files en registres, perquè una taula de set columnes amb text llarg no cap a 15 pt.
4. **Parte III · escenaris_financament.csv**: els tres escenaris en registres amb els onze camps, la nota de la fórmula en caixa, i les taules 2, 3 i 4 senceres (6, 5 i 6 files).
5. **Parte IV · Memoria de actuación**: les cinc línies de capçalera i les dotze seccions senceres, el programa com a taula de sis columnes amb la columna «Público (asistencia real)» que al torn anterior faltava, i els tretze annexos.
6. **Colofó** curt.

### Com s'ha garantit que no falta ni una coma

- Cada fitxer s'ha tornat a llegir del disc en este torn i s'ha transcrit línia a línia, no des de memòria.
- Recompte sobre el DOM renderitzat: 15 fitxes de criteri, 23 registres (14 gastos + 6 ingressos + 3 escenaris), 6 taules, 10 passos, 10 correccions a–j, 14 caselles, 9 camps de l'Annex I, 17 files del programa i **60 marques grogues**, que són les 58 `[COMPLETAR]` de la Memòria més les dues de la portada i la introducció de la Part IV.
- El que no és dels fitxers i s'ha afegit: la portada, l'índex, la caixa «Cómo leer este documento», les capçaleres de taula en forma de columna («Previsto 2026 (€)» en lloc de `previsto_2026_eur`), les etiquetes de les fitxes («Lo que yo veo», «Qué adjuntar», «Riesgo») i el colofó. Els números porten separador de milers (3.538,00) com a format, no com a canvi de valor.
- El que s'ha llevat: res. La línia «Formato: …» de la secció 2 i la de la Taula 1 dels escenaris estan com a nota en cursiva.

### Sistema de disseny «Informe editorial» v1.0, per a MarIA

Carpeta `02_investigacio_ia/261012_0040_sistema_informes_claude/` amb quatre fitxers:

- **`informe_editorial.css`**: el full complet, idèntic al que va incrustat a l'HTML del FICIV. S'incrusta dins de `<style>`; mai s'enllaça.
- **`genera_informe.py`**: generador JSON → HTML autònom. Escapa tot el text, convertix `**negreta**` en `<strong>` i `[COMPLETAR …]` en `<mark>`, i incrusta el CSS. Ús: `python3 genera_informe.py esquema_informe.json eixida.html`. **No executat**: el hook no permet llançar Python des de l'agent; MarIA l'ha de provar amb l'esquema d'exemple abans d'usar-lo.
- **`esquema_informe.json`**: model d'exemple amb cada tipus de bloc una vegada; servix de plantilla.
- **`README.txt`**: regles, contracte de blocs, classes semàntiques, renderitzat i llista de comprovacions.

Contracte de blocs (les claus del JSON):

| Tipus | Claus | Es renderitza com |
| --- | --- | --- |
| `cover` | kicker, title, subtitle, alert, meta[], box, toc[] | `<header class="cover">` a una columna |
| `part` | kicker, title, colophon, blocks[] | `<section class="part">` a dues columnes amb h1 a tota amplària |
| `h2` `h3` `h4` | text | títols; no acaben en punt |
| `p` | text, lead, note, span | paràgraf; `span` el fa ocupar les dues columnes |
| `ul` `ol` `letters` `steps` `check` | items[] | llistes; `steps` numera en cercle blau, `check` posa casella |
| `box` | title, text, items[], accent, span | caixa de context; `accent` per a avisos previs |
| `alert` | label, big, text | caixa fosca per a la dada que mana |
| `card` | n, title, text | targeta numerada en cercle taronja |
| `crit` | num, title, pts, declares, risk_level, risk_label, paras[{label,text}] | fitxa de criteri amb dues cel·les i paràgrafs etiquetats |
| `record` | title, fields[[clau,valor]], text_label, text | registre d'una fila de dades |
| `table` | caption, compact, columns[{label,num}], rows | taula a tota amplària; files `{class: total|warn, cells}` |
| `field` | key, text | camp de formulari amb pastilla blava |
| `hr` | — | filet |

Regles que no es negocien (resumides; completes al README): HTML pur amb CSS incrustat; base 15 pt i cap text per davall de 13 pt; dues columnes amb `column-fill: balance` a pantalla i `auto` en paper; portada a una columna; h1 de part, taules i `.span` a tota amplària amb `column-span: all`; fitxes, targetes, registres, caixes i files de taula amb `break-inside: avoid`; capçaleres de taula repetides; cap taula de més de cinc columnes o amb cel·les llargues (es convertix en registres); paleta tancada als tokens de `:root`; sense ombres ni degradats; `print-color-adjust: exact`; negretes per a xifres i decisions, groc només per a buits humans.

### Renderitzat

`tooling/pdf/render_pdf.sh` llança Chrome sense capçalera amb `--print-to-pdf` i `--no-pdf-header-footer`: compatible amb el CSS (`@page` A4 amb marges, `print-color-adjust: exact` per als fons). Sense xarxa la lletra cau a Helvetica o Arial. A 15 pt el document és llarg: cal esperar bastants pàgines, que és el que demana el zoom al mòbil.

### Ordres per a MarIA, en este ordre

1. Renderitzar `informe_completo_ficiv_2026.html` amb `tooling/pdf/render_pdf.sh` i revisar: portada en pàgina sola, cap fitxa ni registre partit, taules a tota amplària amb capçalera repetida, programa de la Memòria amb les sis columnes, marques grogues visibles.
2. Entregar a Carmen el PDF amb els quatre editables.
3. Provar el generador: `python3 genera_informe.py esquema_informe.json prova.html` i renderitzar `prova.html`. Si el Python falla, el defecte és meu i es corregix en un torn de codi; el CSS i l'esquema no depenen d'ell.
4. Validar este document amb `node tooling/wiki/document.mjs check`, actualitzar ESTAT i LEDGER i tancar `torn_c61b8383` (caduca el 12/10 a les 11:35 UTC) i `torn_f2be3d1e` (pla i prompt).
5. La decisió sobre les dades personals del laboratori continua oberta (`requires_human_decision: true`).

### Text proposat per a l'ESTAT

> ESTAT_ACTUAL · 2026-10-12 · Claude · Informe complet FICIV en HTML íntegre a 15 pt i dues columnes (`02_investigacio_ia/261011_1400_ficiv_claude/informe_completo_ficiv_2026.html`), verificat a pantalla amb recomptes; sistema de disseny «Informe editorial» v1.0 a `02_investigacio_ia/261012_0040_sistema_informes_claude/` (CSS, generador Python sense provar, esquema i README). Següent acció: MarIA renderitza el PDF, l'entrega a Carmen abans del dijous 15 i prova el generador.

### Retroalimentació de la plantilla prompt_local

- El bloc «Context Tècnic i Arquitectònic» torna a ser irrellevant per a un encàrrec editorial. Una ruta germana per a lliurables no tècnics ho resoldria.
- El prompt ha dit «resum» quan el torn anterior no en va fer cap: el text ja hi era sencer menys dos elements (la columna «Público» del programa i els comentaris de taula convertits en llegenda). El que ha canviat és la mida de lletra i la presentació de les taules. Un camp «què falta exactament» al prompt estalviaria refer el que ja estava bé.
- Les hores de la taxonomia: el prompt és `261012_0025` en hora local mentre el rebut és del dia 11 en UTC. Si el torn creua la mitjanit, el nom del fitxer i el Registre no coincidixen; convindria fixar en la plantilla quina hora mana.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Al panell del navegador de l'app, que ha obert el fitxer en escriure'l, amb captures i recomptes per JavaScript.

| Comprovació | Resultat literal |
| --- | --- |
| `getComputedStyle(body)` | `fontFamily: "Source Sans 3"`, `fontSize: 20px` (= 15 pt) |
| Recompte del DOM | `parts: 5`, `crits: 15`, `records: 23`, `tables: 6`, `marks: 60`, `chars: 57875` |
| Marques grogues esperades | 58 `[COMPLETAR]` a la Memòria (recomptades a la font) + 1 a la portada + 1 a la introducció de la Part IV = 60 |
| Portada | títol literal de la font, caixa de termini, metadades, caixa «Cómo leer» i índex de cinc entrades |
| Part I, primera pantalla | «0. Cómo leer esto» a l'esquerra i «Resumen de puntos» i «3. Correcciones» a la dreta: dues columnes plenes |
| Fitxes 6 i 7 | dos cel·les «Lo que declaras» i «Riesgo»; etiquetes «Alto» i «Para 2027» en una línia; els tres paràgrafs etiquetats sencers |
| Part III | tres registres d'escenari amb els nou camps numèrics i el comentari; la nota de la fórmula en caixa |
| Part IV, programa | taula a tota amplària amb sis columnes, «COMPLETAR» en groc a la columna «Público» de cada fila |
| `tooling/pdf/render_pdf.sh` | Chrome sense capçalera, `--print-to-pdf`, `--no-pdf-header-footer`, còpia `.bak` si el destí existix |
| Fitxers font | no modificats; només s'han llegit |
| `node tooling/wiki/document.mjs check --file …informe_complet_ficiv.md` | vegeu el resultat literal al xat, executat després d'escriure este document |
| `node tooling/gates/porta-olivera.mjs --informe` | vegeu el resultat literal al xat |

No verificat: el PDF real (paginació, `column-fill: auto`, `column-span` entre pàgines) i l'execució del generador Python.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap renderitzador ni intèrpret a l'abast.** El hook només permet lectures literals a la shell: no puc llançar `render_pdf.sh` ni `python3`. El PDF i el generador queden per provar per MarIA.
- **Longitud.** A 15 pt i dues columnes el PDF serà llarg; és el preu de la lectura al mòbil que demana el prompt.
- **Fidelitat per transcripció, no per script.** El text s'ha copiat a mà des de les fonts rellegides; el recompte del DOM quadra amb el de les fonts, però una comparació automàtica paraula a paraula no s'ha pogut fer sense Python. El README inclou eixa comprovació com a pas obligatori per a futurs informes.
- **Google Fonts.** La lletra depén de la xarxa en renderitzar; sense xarxa cau a Helvetica o Arial.
- **Dades personals.** L'HTML repetix el NIF i els noms que ja constaven a les fonts; on viu el laboratori continua sent decisió del Mestre.
- **PostToolUse `segell-auto`** continua dient «segell divergent» després de cada eina; no és d'este torn.
- **ESTAT, LEDGER, índex de l'Escriptori i tancament** són de MarIA.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261012_0025_pla_implementacio_informe_editorial]]
- [[261012_0025_prompt_claude_informe_complet_editorial]]
