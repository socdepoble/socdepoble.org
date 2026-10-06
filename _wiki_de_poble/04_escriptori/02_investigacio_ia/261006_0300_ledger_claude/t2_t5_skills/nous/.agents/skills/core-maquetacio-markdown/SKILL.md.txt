---
type: skill
status: actiu
name: core-maquetacio-markdown
description: Regles verificables per a maquetar els fitxers Markdown del repositori (Wiki, skills, prompts i actes), amb un sol H1, encapçalaments sense salts, Vincles al final i llista de comprovació.
version: 1.0.0
tags:
  - core
  - saber
  - tractors
triggers_on:
  - maquetació markdown
  - maquetacio markdown
  - maquetar un markdown
  - jerarquia d'encapçalaments
  - secció de vincles
---
# Maquetació de Markdown

Esta skill fixa com es maqueta un fitxer Markdown del repositori perquè el Mestre el llija d'un colp d'ull i les portes el puguen validar. S'aplica en escriure o revisar qualsevol `.md` de la Wiki, de `.agents/` o de l'Escriptori.

## 1. Abast i frontera

Esta secció diu on s'aplica la skill i on comença la feina d'una altra.

- **Aplica a:** tot fitxer `.md` que escriga o revise una IA, com documents de la Wiki, skills, prompts, plans, auditories, actes i índexs, també quan la Wiki integrada el pinta a l'aplicació.
- **No aplica a:** els components, les pàgines generades i l'HTML de l'aplicació, que són de `core-llegibilitat-text`.
- **Frontera amb core-llegibilitat-text:** es definix per superfície. Un fitxer `.md` és d'esta skill i un component o un HTML són d'aquella. Les regles comunes (un sol H1 i cap salt de nivell) diuen el mateix a les dues, i les negretes de la seua secció 3 també valen dins d'un `.md`.
- **Correcció de fitxers existents:** la secció 4 de `core-llegibilitat-text` deixa triar entre avisar i corregir. Sobre un `.md` existent, esta skill tria avisar (secció 6).
- **Frontera amb sdp-universal-page:** la seua secció 1.E mana l'anatomia Títol (H1), Subtítol (H2), Entradilla i Cos (H3 en avant) de la pàgina pintada. El font `.md` no l'escriu a mà: seguix R2, R4 i R5 i obri les seccions amb `##`. La conversió la fan `src/sections/wiki-de-poble/parseMarkdown.js` i la `UniversalPage`.
- **Com es convertix:** el compilador de la Wiki passa la `description` a Subtítol (H2), `extreuEditorial` passa l'entradeta de R5 a Entradilla i `parseMarkdown` pinta cada `##` del font com a H3 del cos. Per això el Subtítol no s'escriu com a `##` davall de l'H1: incompliria R5 i la pàgina quedaria sense Entradilla.
- **Frontera amb les plantilles:** quan el document naix de `document.mjs create`, l'ordre i el nom de les seccions els posa la plantilla de `.agents/protocolledge.json`. Esta skill ordena el que va dins de cada secció. Si la plantilla porta un element que una regla prohibix, el document el conserva com a excepció declarada i la plantilla s'anota amb ruta:línia.
- **Fitxers generats:** `00_INDEX_SKILLS.md`, `manifest.yaml` i les àncores que escriuen les eines no es retoquen a mà. Si la seua forma incomplix una regla, es corregix l'eina pel seu circuit.
- **Origen:** correcció del Mestre del 261006 sobre la maquetació d'AGENTS.md (encàrrec T5 del prompt 261006_0224), amb idees de l'esborrany `core-redaccio` del laboratori 260924_1700, que no es va instal·lar.

## 2. Regles

Cada regla porta un codi (R1 a R22). R12, R15, R18 i R19 demanen llegir el contingut amb la pregunta que porten; la resta es comproven mecànicament sobre el text del fitxer.

### 2.1 Frontmatter

- **R1.** El fitxer comença pel frontmatter: la línia 1 és `---` i no hi ha res abans.
- **R2.** La `description` diu què fa el document en una frase de 12 a 220 caràcters i no copia el títol de l'H1.
- **R3.** Les claus, els tipus, els estats i els tags són els de `tooling/wiki/schema.json`, sense cap tag fora de l'enum.

### 2.2 Encapçalaments

- **R4.** Hi ha un sol H1 i és el primer encapçalament del cos.
- **R5.** Davall de l'H1 va una entradeta de dues o tres frases (què és, per a qui i quan s'usa) abans del primer H2.
- **R6.** Cap salt de nivell: després d'un H2 ve un H2 o un H3, mai un H4.
- **R7.** Si les seccions porten número, la numeració és contínua (1, 2, 3) i la subsecció N.M va un nivell per davall de la secció N. Les seccions de tancament («Lliçons del Mestre» i «Vincles») no porten número.
- **R8.** Els encapçalaments van en caixa de frase. Les majúscules es reserven per a sigles i noms propis.
- **R9.** Cap línia acaba en espai.
- **R10.** Hi ha una línia en blanc abans i després de cada encapçalament, llevat de l'H1 quan va just davall del frontmatter.

### 2.3 Seccions

- **R11.** Cap secció buida: davall de cada encapçalament hi ha text, una llista o una subsecció.
- **R12.** Cada secció és d'un sol tipus: procediment, referència o context. La filosofia i les metàfores viuen a la Wiki (`_wiki_de_poble/01_ser/`) i el procediment hi enllaça amb una línia. Prova de la tisora: si lleves el paràgraf i el procediment no canvia, el paràgraf no és procediment.
- **R13.** «## Vincles» és l'última secció del fitxer i només conté una llista de wikilinks a notes senceres, mai a la mateixa nota.

### 2.4 Paràgrafs i llistes

- **R14.** Una idea per paràgraf. Un paràgraf o un element de llista de més de 60 paraules es parteix o es converteix en llista.
- **R15.** Els passos van en llista numerada i les condicions o les opcions en llista de pics. Cada element porta un sol pas.
- **R16.** Cada paràgraf ocupa una sola línia o va separat del següent per una línia en blanc: dues línies de prosa seguides es pinten com un sol paràgraf.
- **R17.** Com a màxim una línia en blanc seguida, i cap entre els elements d'una llista.

### 2.5 Codi, cites i enllaços

- **R18.** Un bloc de codi només conté el que s'ha de copiar literalment (ordres, fragments o text per a un altre xat) i declara el llenguatge quan en té.
- **R19.** El text que el Mestre ha de copiar va en bloc de codi, mai en cita amb `> `. La cita es reserva per a reproduir una font literal, amb la font nomenada.
- **R20.** El cos no porta cap línia horitzontal `---`: eixe separador només delimita el frontmatter.
- **R21.** Els enllaços interns són wikilinks `[[nom]]` i mai apunten a la mateixa nota. La forma `[text](adreça)` queda per a adreces externes.
- **R22.** Tot el fitxer usa una sola forma d'apòstrof, la recta (`'`).

## 3. Procediment

Estos són els passos per a escriure o revisar un fitxer Markdown, en este ordre.

1. Si el document naix d'una plantilla, demana-la amb `document.mjs context` (skill `wiki-documentacio-i-reflex`) i conserva'n les seccions i el seu ordre.
2. Escriu primer l'esquelet: frontmatter, H1, entradeta, seccions numerades i «## Vincles».
3. Omple cada secció amb un sol tipus de contingut (R12).
4. Converteix en llista tot paràgraf que passe de 60 paraules (R14).
5. Passa la llista de comprovació de la secció 4 sobre el fitxer sencer.
6. Valida el frontmatter amb `node tooling/wiki/tractor-frontmatter.mjs --json`: un fitxer modificat amb qualsevol fallada (F1 a F9) fa caure la porta.
7. Si és una skill, valida-la també amb `node tooling/gates/tractor-registre.mjs` i `node tooling/brain/cataleg_skills.mjs --check`.
8. Declara com a no verificada tota porta que el hook no et deixe executar.
9. Si trobes un error de maquetació en un fitxer fora del teu encàrrec, anota'l amb ruta:línia i el codi de la regla, i no el corregisques.

## 4. Llista de comprovació final

Abans de desar, cada punt ha de ser cert. Entre parèntesis, les regles que cobrix.

1. La línia 1 és `---`, els tags són de l'enum i la `description` no copia l'H1 (R1 a R3).
2. Hi ha un sol H1, amb entradeta davall (R4 i R5).
3. No hi ha cap salt de nivell ni cap forat en la numeració (R6 i R7).
4. Els encapçalaments van en caixa de frase i entre línies en blanc (R8 i R10).
5. Cap línia acaba en espai (R9).
6. Cap secció és buida i cada secció és d'un sol tipus (R11 i R12).
7. «## Vincles» és l'última secció i només porta wikilinks a altres notes (R13).
8. Cap paràgraf ni element passa de 60 paraules i cada pas té el seu element (R14 i R15).
9. No hi ha dues línies de prosa seguides, ni més d'una línia en blanc seguida, ni línies en blanc dins de les llistes (R16 i R17).
10. Els blocs de codi només porten el que es copia, i cap text per a copiar va en cita (R18 i R19).
11. El cos no porta `---`, els enllaços interns són wikilinks i hi ha una sola forma d'apòstrof (R20 a R22).

## 5. Casos de comprovació

Errors reals, trobats el 261006, que la llista de la secció 4 ha de detectar. Corregir-los demana ordre del Mestre: AGENTS.md és el BIOS i l'índex el mantenen MarIA i les eines.

### 5.1 AGENTS.md (commit 76947e5d)

- `AGENTS.md:4` (R2): la `description` és el mateix text que l'H1 de la línia 6.
- `AGENTS.md:17` i `AGENTS.md:78` (R7): la subsecció 0.1 és un H2 i la 13.1 és un H3.
- `AGENTS.md:78` i `AGENTS.md:81` (R7): de la secció 13 es passa a la 15, sense cap secció 14.
- `AGENTS.md:78` (R12): l'inici de sessió i l'Acta Marmota pengen de la secció 13, que és una llista d'enllaços.
- `AGENTS.md:73-76` (R21): enllaços interns amb la forma `[text](ruta)`, que fan de vincles al mig del fitxer, separats de «## Vincles» (línia 93).
- `AGENTS.md:30` (R9): l'encapçalament de la secció 2 acaba en espai.
- `AGENTS.md:6-78` i `AGENTS.md:88` (R8): encapçalaments en majúscules sostingudes, mentre que el de la línia 81 va en caixa de frase.
- Tots els encapçalaments llevat dels de les línies 6 i 81 (R10): el text comença a la línia següent, sense línia en blanc.
- `AGENTS.md:63` (R12 i R14): un paràgraf de més de cent paraules de metàfora amb una sola regla operativa, no mutilar les fonts, dita dues vegades.
- `AGENTS.md:12` (R14 i R15): un sol element de llista amb quatre passos i tres ordres.
- `AGENTS.md:18-19` i `AGENTS.md:83-86` (R16): línies de prosa seguides que es pinten com un sol paràgraf.
- `AGENTS.md:83-85` (R22): apòstrof corb en un fitxer que usa el recte; la línia 85 porta les dues formes.

### 5.2 Índex de l'Escriptori (commit 76947e5d)

Al fitxer viu, les línies es mouen cada vegada que una eina hi ancora un document. Per això les línies són les del commit i cada cas porta també el títol de la secció.

- `00_index_escriptori.md:4` (R2): la `description` és el mateix text que l'H1 de la línia 11.
- `00_index_escriptori.md:17` (R21): la secció «Índexs Connectats» enllaça la mateixa nota.
- `00_index_escriptori.md:26` i `00_index_escriptori.md:35` (R17): una línia en blanc entre els elements de la llista, a «01_produccio» i a «Activitat en curs».
- `00_index_escriptori.md:39` (R15): quinze enllaços dins d'un sol element de llista, a «Activitat en curs».
- Tretze seccions buides (R11), entre d'altres «Activitat tancada (260924, nit)» (línia 312), «Tasca actual de l'Escriptori» (375), «Actes pendents d'ordenar» (399), «Captures (01_produccio)» (422) i «Recursos de la marató amb àncora exacta» (617).
- `00_index_escriptori.md:352` (R13): «## Vincles» té vint-i-tres seccions darrere.
- `00_index_escriptori.md:467-491` (R17): vint-i-cinc línies en blanc seguides abans de «Fix Automàtic d'Àncores».
- `00_index_escriptori.md:596` (R14): un element de llista de 74 paraules a «Tasques pendents (Pròxima sessió)».
- `00_index_escriptori.md:328-331` i `00_index_escriptori.md:430-431` (R21): enllaços interns amb la forma `[text](ruta)`.
- `00_index_escriptori.md:326`, `:452`, `:454` i `:605` (R22): apòstrof corb en un fitxer que usa el recte.

## 6. Què no fa

Esta skill fixa la forma, no el contingut ni el lloc dels documents.

- No mou, no reanomena ni arxiva documents: això és de la porta Olivera (AGENTS §0.1).
- No reescriu frases ni decidix què diu un document.
- No reformata documents existents per iniciativa pròpia. La Wiki integrada els pinta a l'aplicació i canviar-ne la forma canvia la pantalla (Llei del Píxel): sense ordre del Mestre, s'anoten.
- No toca `04_escriptori/01_produccio/` ni els fitxers que generen les eines.

## Lliçons del Mestre

- **261006** | **Markdown llegible i verificable**: Tot fitxer Markdown que escriu una IA porta un sol H1 amb entradeta, encapçalaments sense salts i amb numeració contínua, una idea per secció i «## Vincles» com a última secció. El procediment viu a les skills i la filosofia a la Wiki.

## Vincles

- [[00_INDEX_SKILLS]]
