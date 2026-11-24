---
type: skill
status: actiu
name: core-maquetacio-markdown
description: Regles verificables per a maquetar els fitxers Markdown del repositori (Wiki, skills, prompts i actes), amb un sol H1, encapçalaments sense salts, Vincles al final i llista de comprovació.
version: 1.1.0
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
contracte.llig:
  - _wiki_de_poble/02_saber/doc_governanca.md
  - _wiki_de_poble/00_index.md
  - .agents/skills/core-llegibilitat-text/SKILL.md
  - .agents/skills/sdp-universal-page/SKILL.md
  - .agents/skills/wiki-documentacio-i-reflex/SKILL.md
  - src/sections/wiki-de-poble/parseMarkdown.js
  - .agents/protocolledge.json
  - tooling/wiki/schema.json
contracte.escriu:
  - _wiki_de_poble
  - .agents/skills
motors:
  - tooling/brain/cataleg_skills.mjs
  - tooling/gates/tractor-maquetacio-canonica.mjs
  - tooling/gates/tractor-registre.mjs
  - tooling/wiki/tractor-frontmatter.mjs
---
# Maquetació de Markdown

Esta skill fixa com es maqueta un fitxer Markdown del repositori perquè el Mestre el llija d'un colp d'ull i les portes el puguen validar. S'aplica en escriure o revisar qualsevol `.md` de la Wiki, de `.agents/skills/` o de l'Escriptori.

## 1. Abast i frontera editorial

Esta secció indica on s'aplica la skill i com s'encaixa amb el motor editorial `H3–H6` de la `UniversalPage` (`IDEA-344`).

- **Aplica a:** tot fitxer `.md` escrit o revisat per una IA (documents de la Wiki, skills, prompts, plans, auditories, actes i índexs), també quan la Wiki integrada el pinta a l'aplicació.
- **Frontera amb core-llegibilitat-text:** es definix per superfície; un fitxer `.md` és d'esta skill i un component JSX o HTML és de [[core-llegibilitat-text/SKILL|core-llegibilitat-text]]. Les regles de to humà càlid i de **6 a 8 negretes per paràgraf de prosa** regeixen igualment als documents públics i de la Wiki.
- **Conversió a UniversalPage (`H1 → H2 centrat → .lead → H3..H6`):** el compilador passa la `description` del frontmatter a Subtítol `H2` centrat, `extreuEditorial` passa el paràgraf inicial de R5 a Entradilla (`.lead`), el `Quadre de Comandament ISO` obri a `<h3>` i `parseMarkdown` converteix cada nivell del cos en etiquetes semàntiques pures alineades a l'inici (`##` → `<h3>`, `###` → `<h4>`, `####` → `<h5>`, `#####` / `######` → `<h6>`, sense cap classe falsa `.h2`).
- **Prohibició de repetir el subtítol com a `##` inicial:** mai s'escriu el subtítol com un `##` davall de l'`# H1`, perquè trencaria R5 i deixaria la pàgina sense entradilla. Dins d'HTML o JSX de `UniversalPage`, un `<h2>` al cos és excepcional i exigeix sempre `.lead` i `<h3>` just darrere (`tractor-maquetacio-canonica.mjs`).
- **Frontera amb les plantilles:** quan el document naix de `document.mjs create`, l'ordre i el nom de les seccions venen de `.agents/protocolledge.json`. Si la plantilla porta un element que una regla prohibix, es conserva com a excepció declarada anotant `ruta:línia`.
- **Fitxers generats:** `00_INDEX_SKILLS.md`, `manifest.yaml` i les àncores automàtiques no es retoquen a mà; si cal canviar-ne la forma, es corregix l'eina que els genera.

## 2. Regles verificables

Cada regla porta un codi (R1 a R23). R12, R15, R18, R19 i R23 demanen llegir el contingut amb criteri editorial; la resta tenen comprovació textual directa.

### 2.1 Frontmatter

- **R1.** El fitxer comença pel frontmatter: la línia 1 és `---` i no hi ha res abans.
- **R2.** La `description` diu què fa el document en una frase de 12 a 220 caràcters i no copia el títol de l'H1.
- **R3.** Les claus, els tipus, els estats i els tags són els de `tooling/wiki/schema.json`, sense cap tag fora de l'enum.

### 2.2 Encapçalaments

- **R4.** Hi ha un sol H1 (`# `) i és el primer encapçalament del cos.
- **R5.** Davall de l'H1 va una entradeta de dues o tres frases (què és, per a qui i quan s'utilitza) abans del primer `##`.
- **R6.** Cap salt de nivell: després d'un `##` (que pinta `<h3>`) ve un `##` o un `###` (`<h4>`), mai un `####` (`<h5>`) directe.
- **R7.** Si les seccions porten número, la numeració és contínua (1, 2, 3) i la subsecció N.M baixa un nivell. Les seccions finals («Lliçons del Mestre» i «Vincles») no porten número.
- **R8.** Els encapçalaments van en caixa de frase; les majúscules es reserven per a sigles i noms propis.
- **R9.** Cap línia acaba en espai.
- **R10.** Hi ha una línia en blanc abans i després de cada encapçalament, llevat de l'H1 quan va just davall del frontmatter.

### 2.3 Seccions

- **R11.** Cap secció buida: davall de cada encapçalament hi ha text, una llista o una subsecció.
- **R12.** Cada secció té un sol propòsit (procediment, referència o context). La filosofia viu a `_wiki_de_poble/01_ser/` i les skills descriuen procediments.
- **R13.** «## Vincles» és l'última secció del fitxer i només conté una llista de wikilinks a altres notes, mai a la mateixa nota.

### 2.4 Paràgrafs, negretes i llistes

- **R14.** Una idea per paràgraf. En documents procedimentals i skills, tot paràgraf o element de més de 60 paraules es parteix o passa a llista.
- **R15.** Els passos van en llista numerada i les condicions o opcions en llista de pics, amb un sol pas per element.
- **R16.** Cada paràgraf ocupa una sola línia o va separat del següent per una línia en blanc.
- **R17.** Com a màxim una línia en blanc seguida, i cap línia en blanc entre els elements d'una llista.
- **R23.** En articles i documents expositius de la Wiki, la prosa manté un **to humà i didàctic** i marca entre **6 i 8 sintagmes clau en negreta** per cada paràgraf desenvolupat (`>= 45` paraules) per facilitar la lectura diagonal (`IDEA-344`).

### 2.5 Codi, cites i enllaços

- **R18.** Un bloc de codi només conté el que s'ha de copiar literalment i declara el llenguatge quan en té.
- **R19.** El text que el Mestre ha de copiar va en bloc de codi, mai en cita amb `> `. La cita es reserva per a reproduir una font literal nomenada.
- **R20.** El cos no porta cap línia horitzontal `---`: eixe separador només delimita el frontmatter.
- **R21.** Els enllaços interns són wikilinks `[[nom]]` sense apuntar mai a la mateixa nota; la forma `[text](adreça)` queda per a adreces externes.
- **R22.** Mantín una sola forma d'apòstrof consistent en la prosa, sense alterar bytes de codi, proves o cites literals.

## 3. Procediment

Segueix estos passos en ordre per escriure o revisar un fitxer Markdown:

1. Si el document naix d'una plantilla, demana-la amb `document.mjs context` ([[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]) i conserva'n les seccions.
2. Escriu l'esquelet canònic: frontmatter, `# H1`, entradeta, seccions `##`..`#####` (que pintaran `H3`..`H6`) i `## Vincles`.
3. Redacta cada secció amb un sol propòsit (R12), prosa humana i 6 a 8 negretes per paràgraf llarg expositiu (R23).
4. Passa la llista de comprovació de la secció 4 sobre el fitxer sencer.
5. Valida el frontmatter amb `node tooling/wiki/tractor-frontmatter.mjs --json` (`F1` a `F9` a zero).
6. Si és una skill, valida-la amb `node tooling/gates/tractor-registre.mjs` i `node tooling/brain/cataleg_skills.mjs --check`.
7. Si trobes un error de maquetació fora del teu encàrrec autoritzat, anota'l amb `ruta:línia` i el codi de la regla sense mutar el fitxer pel teu compte.

## 4. Llista de comprovació final

Abans de desar, verifica que tots estos punts es compleixen:

1. La línia 1 és `---`, els tags són de l'enum i la `description` no copia l'H1 (R1 a R3).
2. Hi ha un sol H1 amb entradeta davall abans del primer `##` (R4 i R5).
3. No hi ha cap salt de nivell ni cap forat en la numeració (R6 i R7).
4. Els encapçalaments van en caixa de frase i entre línies en blanc, sense espais finals (R8 a R10).
5. Cap secció és buida, cada secció té un sol tipus i `## Vincles` tanca el fitxer (R11 a R13).
6. La prosa és humana, respecta la mesura i els paràgrafs expositius llargs porten 6 a 8 negretes (R14 a R17 i R23).
7. Els blocs de codi, cites, absència de `---` al cos, wikilinks i apòstrofs són conformes (R18 a R22).

## 5. Què no fa i cobertura de les portes

Esta skill fixa la maquetació dels fitxers `.md`, sense suplantar les eines d'arxivament ni l'edició autoritzada.

- No mou, no reanomena ni arxiva documents: això correspon a la porta Olivera (`AGENTS.md` §0.1).
- No reformata documents existents de la Wiki sense encàrrec: per a millores massives de to humà i negretes s'utilitza la safata de propostes del Node 0 revisada per MarIA.
- No toca `04_escriptori/01_produccio/` ni els índexs autogenerats.
- `tractor-frontmatter.mjs` valida `F1–F9`; `tractor-registre.mjs`, `cataleg_skills.mjs --check` i `tractor-paritat-skills.mjs` validen el registre de skills; `tractor-maquetacio-canonica.mjs` valida `H2 → .lead → H3` i l'amplada lliure al DOM/CSS; `parseMarkdown.editorialCorpus.test.js` verifica la jerarquia i les 6–8 negretes al corpus públic de la Wiki.

## Lliçons del Mestre

- **261006** | **Markdown llegible i verificable**: Tot fitxer Markdown porta un sol H1 amb entradeta, encapçalaments sense salts, una idea clara per bloc i «## Vincles» al final.
- **261124** | **Motor editorial H3–H6 i prosa humana (`IDEA-344`)**: Sota l'`H1 + H2 centrat + Entradilla` de `UniversalPage`, el cos de la Wiki pinta etiquetes semàntiques pures `<h3>..<h6>` alineades a l'inici (sense disfresses `.h2`), tot `H2` excepcional al cos exigeix `.lead` i `H3`, i els textos es redacten per a humans amb 6 a 8 negretes per paràgraf.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-llegibilitat-text/SKILL]]
- [[sdp-universal-page/SKILL]]
- [[wiki-documentacio-i-reflex/SKILL]]
