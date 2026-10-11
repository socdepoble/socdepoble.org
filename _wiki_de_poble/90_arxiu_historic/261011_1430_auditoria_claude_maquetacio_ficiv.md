---
type: informe
status: esborrany
description: 'Informe de la maquetació editorial dels lliurables FICIV en un HTML llest per a PDF: decisions tipogràfiques, dues columnes, fidelitat al contingut, verificació i límits.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:b3641e34-9484-4c48-8c2d-4f72fb846acf
---
# Auditoria Claude Maquetació FICIV

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:b3641e34-9484-4c48-8c2d-4f72fb846acf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T12:27:25.662Z |
| Modificació | 2026-10-11T12:58:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (Claude Code, fil únic, sense subagents) |
| Tokens consumits | ≈ 0,1 M en este torn (l'HTML pesa ≈ 95 KB; les captures del navegador en són una part) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-11T12:20:00.000Z: lectura del pla `261011_1410_pla_implementacio_maquetacio_ficiv` i del prompt en la seua primera versió; el Mestre atura el torn i MarIA reescriu el prompt: HTML pur amb CSS incrustat, dues columnes obligatòries, lletra gran, cap Markdown. Prompt rellegit del disc.
2026-10-11T12:27:25.662Z: esborrany creat; contingut i verificació pendents. Una primera crida a `create` havia tornat un error d'eina buit; la segona ha funcionat.
2026-10-11T12:35:00.000Z: `informe_editorial_ficiv_2026.html` escrit al laboratori amb tot el contingut dels quatre fitxers font.
2026-10-11T12:45:00.000Z: verificació al panell del navegador amb captures i estils calculats; tres retocs: equilibri de columnes a pantalla, tipografia i taula d'escenaris.
2026-10-11T12:58:00.000Z: informe complet. Hores UTC aproximades: cap agent local pot executar `date`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### El lliurable

`_wiki_de_poble/04_escriptori/02_investigacio_ia/261011_1400_ficiv_claude/informe_editorial_ficiv_2026.html`: un sol fitxer HTML amb el CSS dins, sense Markdown ni dependències de scripts. Els quatre originals (`INFORME_PARA_CARMEN.txt`, `ESBORRANY_MEMORIA_ACTUACION.txt`, `pressupost_ficiv_2026.csv`, `escenaris_financament.csv`) no s'han tocat.

Estructura, en l'ordre en què Carmen la llegirà:

1. **Portada** a una columna: títol, caixa fosca amb el termini (dijous 15 d'octubre, presentar el 14), fitxa de metadades, «Cómo usar este documento» i índex.
2. **Lo esencial en una página**: les cinc troballes en targetes numerades, la taula de punts (84,5 declarats · 67 segurs · 77 · 82 · 87 · llindar 50) i la caixa «Después de presentar».
3. **Parte I · El informe**: les nou seccions del `INFORME_PARA_CARMEN.txt` íntegres. Els 15 criteris van en fitxes amb tres cel·les fixes (Declaras · Defendible · Riesgo) i el paràgraf «Qué adjuntar», perquè una fitxa cap sencera dins d'una columna i no es parteix.
4. **Parte II · Las cifras**: les sis taules dels dos CSV, a tota amplària (`column-span: all`), amb la fórmula del repartiment i la lliçó de les taules de sensibilitat.
5. **Parte III · Memoria de actuación**: l'esborrany complet amb els `[COMPLETAR]` convertits en `<mark>` groc, i el programa dia a dia com a taula a tota amplària.
6. **Colofón**: mètode, fonts i límits.

### Decisions de disseny, amb la raó de cada una

- **Dues columnes a tot el cos** (`column-count: 2`, separació 8 mm, filet entre columnes), com exigix el prompt per al zoom en mòbil. La portada queda a una columna: un títol i una caixa de termini no es lligen per columnes.
- **Lletra gran**: base de 13,5 pt amb interlineat 1,6; títols de part a 2 rem, seccions a 1,45 rem; taules a 0,95 rem i «compactes» a 0,9 rem perquè cabien les sis columnes de la fitxa pressupostària. En una columna de 86 mm ixen unes 40 lletres per línia, que és la mesura còmoda de lectura.
- **Tipografia**: Source Sans 3 des de Google Fonts, amb Helvetica Neue, Arial i Segoe UI de reserva. Primer havia posat Atkinson Hyperlegible, però el seu zero barrat feia estranyes totes les xifres d'un document ple d'euros i dates; s'ha canviat després de vore-ho a la captura.
- **Elements que no es poden partir**: fitxes de criteri, targetes, caixes i files de taula porten `break-inside: avoid`; les capçaleres de taula es repetixen a cada pàgina (`thead { display: table-header-group }`); els títols no queden sols al peu (`break-after: avoid`).
- **Taules amples a tota amplària** amb `column-span: all` (amb prefix `-webkit-`), perquè una taula de sis columnes dins d'una columna de 86 mm és il·legible.
- **Ompliment de columnes**: `column-fill: balance` a pantalla i `column-fill: auto` en impressió. A pantalla, sense alçària fixa, `auto` ho posava tot a la columna esquerra i deixava la dreta buida; en paper, `auto` és el que toca: cada pàgina ompli la columna 1 i després la 2, que és com es llig un PDF.
- **Negretes** a cada xifra, data, topall i decisió; el ressaltat groc es reserva als buits que Carmen ha d'omplir, i les etiquetes de risc van en tres colors (alt, mitjà, baix) perquè l'ull les trobe sense llegir.
- **Paleta**: blau marí per a títols i filets, taronja per als accents, paper clar per als fons de caixa. Sense ombres ni degradats, i amb `print-color-adjust: exact` perquè els fons sobrevisquen a la impressió.
- **Pàgina**: `@page { size: A4; margin: 14mm 13mm 16mm 13mm }`; cada part comença en pàgina nova.

### Fidelitat al contingut

Tot el text ix dels quatre fitxers. Les úniques peces noves són d'estructura: el resum d'una pàgina (que reordena les troballes ja existents), la caixa «Cómo usar este documento», la caixa «Qué significa cada escenario» (que trau els comentaris de la Taula 4 a una llista, perquè dins de la taula s'esclafaven en una columna de dos dits) i el colofó. Cap xifra ni cap recomanació ha canviat.

### Com generar el PDF

- Chromium o Chrome sense capçalera amb `--print-to-pdf` sobre el fitxer, o Puppeteer amb `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`. Els marges ja els fixa `@page`; no cal passar-ne.
- Cal **imprimir els fons** (`printBackground`), si no les caixes i les capçaleres de taula ixen blanques.
- Si el renderitzador no té xarxa, la lletra cau a Helvetica o Arial: el document continua llegible, només un poc més ample.
- Si el renderitzador és wkhtmltopdf (WebKit antic), els `column-span: all` poden fallar i les taules amples quedarien dins d'una columna: en eixe cas usar Chromium.

### Ordres per a MarIA, en este ordre

1. Renderitzar el PDF amb Chromium i revisar quatre llocs: que la portada ocupe una pàgina sola, que cap fitxa de criteri quede partida entre pàgines, que les sis taules de la Part II isquen a tota amplària i que el programa de la Part III repetisca la capçalera en cada pàgina.
2. Entregar a Carmen el PDF i, a banda, els quatre fitxers editables del laboratori.
3. Validar este document amb `node tooling/wiki/document.mjs check` després de qualsevol retoc, actualitzar ESTAT i LEDGER i tancar `torn_c61b8383` (meu, caduca el 12/10 a les 11:35 UTC) i `torn_89b60b14` (pla i prompt) amb `tancament.mjs --check`.
4. La decisió sobre les dades personals (NIF i noms dins del laboratori i de l'HTML) continua oberta des de l'auditoria anterior: `requires_human_decision: true`.

### Text proposat per a l'ESTAT

> ESTAT_ACTUAL · 2026-10-11 · Claude · Informe editorial FICIV maquetat en HTML pur a dues columnes i lletra gran (`02_investigacio_ia/261011_1400_ficiv_claude/informe_editorial_ficiv_2026.html`), verificat a pantalla amb captures; originals intactes. Següent acció: MarIA renderitza el PDF amb Chromium i l'entrega a Carmen abans del dijous 15.

### Retroalimentació de la plantilla prompt_local

- El bloc fix «Context Tècnic i Arquitectònic» torna a ser irrellevant per a un encàrrec editorial i consumix context en cada convocatòria. Una ruta germana per a lliurables no tècnics ho resoldria.
- El «Protocol d'Interacció i Sortida» exigix un informe `auditoria` per a una tasca de maquetació: el circuit documental (context, create, check) hi afig més cerimònia que valor. Un rebut de torn amb un relleu de tres línies a l'índex seria prou per a tasques de format.
- El prompt ha canviat mentre el torn estava obert i el Mestre ha hagut d'aturar-me a mà. Si la plantilla portara un camp «versió del prompt» a la capçalera, l'agent podria detectar el canvi rellegint el fitxer abans de cada lliurable.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tot a pantalla, al panell del navegador de l'app (amplària 800 px), que ha obert el fitxer en escriure'l; els estils calculats es llegixen amb JavaScript sobre la pàgina.

| Comprovació | Resultat literal |
| --- | --- |
| Portada | títol, caixa de termini, metadades i índex en una columna, lletra blau marí i accent taronja, sense desbordaments |
| `getComputedStyle(section.part)` | `columnCount: "2"`, `columnFill: "balance"` a pantalla; alçària de la Part I 9545 px repartida en dues columnes |
| `getComputedStyle(body)` i `document.fonts.check` | `fontFamily: "Source Sans 3"`, `fontSize: 18px` (= 13,5 pt), `loaded: true` |
| Part I, primera pantalla | «Lo urgente» a l'esquerra amb els deu passos numerats en cercle i «4. La Memoria» a la dreta: les dues columnes s'omplin |
| Fitxes de criteri 6, 7 i 8 | tres cel·les Declaras · Defendible · Riesgo alineades; etiquetes «Alto», «Ninguno» i «Medio» en una sola línia després del retoc `white-space: nowrap` |
| Part II, Taula 1 | sis columnes a tota amplària, xifres alineades a la dreta, fila de total destacada |
| Part II, Taula 4 | abans del retoc la columna «Comentario» s'esclafava en dos dits; després, sis columnes netes i la llegenda en caixa a banda |
| Part II, Taules 5 i 6 | files de revocació en fons roig clar; capçaleres visibles |
| Part III, programa | taula a tota amplària, `COMPLETAR` en groc al títol de la taula, dates i sedes llegibles |
| Originals del laboratori | no modificats per este torn: l'única escriptura ha sigut el fitxer HTML nou i els seus retocs |
| `node tooling/wiki/document.mjs check --file …maquetacio_ficiv.md` | vegeu el resultat literal al xat, executat després d'escriure este document |

No verificat: el PDF real. La paginació en impressió (`column-fill: auto`, `break-before: page`, repetició de capçaleres i `column-span` entre pàgines) només s'ha raonat sobre l'especificació i el comportament conegut de Chromium; cal mirar el PDF que genere MarIA.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap renderitzador de PDF a l'abast.** El hook només permet lectures literals a la shell; no puc llançar Chromium ni Puppeteer. La verificació és a pantalla, en un panell de 800 px, no en paper A4.
- **Vista prèvia a pantalla.** Amb `column-fill: balance` la Part I és dues columnes de més de 4.700 px cada una: a pantalla es llig baixant la columna esquerra i tornant amunt per la dreta. És el preu de poder revisar-la al navegador; en paper cada pàgina és independent.
- **Google Fonts.** La lletra depén de la xarxa en el moment de renderitzar; sense xarxa cau a Helvetica o Arial.
- **Nomenclatura.** El fitxer viu dins de la carpeta `261011_1400_ficiv_claude/` creada al torn anterior, amb el nom que demanava el prompt («evident»), sense hora termodinàmica pròpia: el prompt i el pla d'este torn ja la porten.
- **Dades personals.** L'HTML repetix el NIF de l'associació i els noms que ja constaven als fitxers font; no afig cap dada nova. On viuen estos fitxers continua sent decisió del Mestre.
- **PostToolUse `segell-auto`** ha repetit «segell divergent» després de cada eina, igual que al torn anterior; no és d'este torn i no s'ha tocat.
- **ESTAT, LEDGER, índex de l'Escriptori i tancament** són de MarIA: no puc escriure a `.agents/`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261011_1410_pla_implementacio_maquetacio_ficiv]]
- [[261011_1410_prompt_claude_maquetacio_ficiv]]
