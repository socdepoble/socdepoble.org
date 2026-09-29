---
type: informe
status: esborrany
description: Diagnosi mesurada i correcció de T33 (fons taronja a l'arbre) i T34 (ploma a les notes), revisió dels canvis de MarIA i proposta de fusibles i neteja autònoma de l'Escriptori.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d44a8d51-012d-4449-b63d-873eb05cca97:3b79a171-4956-42df-916b-7dc31a4755ac
---
# Auditoria de Claude: T33–T38 i fusibles d'automillora

Torn `torn_d44a8d51` (Claude, abast `code`). Executa el prompt [[260927_2345_prompt_claude_regressions]] i el pla [[260927_2345_pla_implementacio_regressions]]. Llegits sencers abans d'actuar: el prompt, el pla, la nota [[260927_2355_auditoria_cognitiva_fusibles]] i l'índex de l'Escriptori. No s'ha llegit res de `90_arxiu_historic/`.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d44a8d51-012d-4449-b63d-873eb05cca97:3b79a171-4956-42df-916b-7dc31a4755ac |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T22:33:56.752Z |
| Modificació | 2026-09-27T23:50:00.000Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | T34 opció 1, T33–T38 d'una tirada i excepció del Perfil a T38: confirmades pel Mestre al xat (260928) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Ultracode amb tres workflows |
| Tokens consumits | Subagents: 5.328.294 (cartografia T33/T34/fusibles 1.030.399 + cartografia T35–T38 1.852.345 + revisió adversarial 2.445.550). Fil principal: no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-27T22:33:56.752Z (00:33 local del 260928): esborrany creat amb rebut.
- v1.0.0 (01:50 local): T33–T38 aplicades, verificades i revisades; Proposta d'Automillora.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Abast i decisions del Mestre

El prompt que el Mestre va enganxar al xat demanava T33 i T34. Mentre s'executava, el prompt i el pla del disc van créixer fins a T35–T38. Es va preguntar abans d'executar-les. Respostes del Mestre al xat:

- T34: la ploma va a la llista i al rail de Notes, i es desfà el canvi de MarIA a la capçalera de l'editor (opció 1).
- T35–T38: s'executen en aquest torn, d'una tirada.
- T38: l'editor del Perfil queda com a excepció (hi viu el selector d'identitat).

### T33 · Fons taronja sencer a l'arbre

**Diagnosi mesurada** (1600×1000, /wikidepoble, /disseny i la carpeta Mur de /notes). L'entrada activa (`button.sdp-workspace-nav-item[aria-current=page]`) feia 216×44. El seu germà, l'espaiador `div.sdp-workspace-folder-toggle-spacer`, ja era taronja per la T26.1, però feia **44×16**. La fila tenia `align-items: center` (`src/css/modules.css:306`), i un div buit amb 8+8 de coixí fa 16 px d'alt. D'ací la «línia». Al Xat no passa perquè el rail no té files amb espaiador. Tampoc passa en una carpeta amb fills, perquè el botó de desplegar ja és un `.sdp-workspace-nav-item` de 44 px.

**Canvi.** `.sdp-workspace-folder-row { align-items: stretch }`. Cada cel·la pren l'alçada de la fila: 44 px, o 48 al Bloc. El canvi de MarIA (`flex: 1 1 auto` a l'ítem) era **inert** (l'ítem ja feia 216 px per `width: 100%` i encongiment) i s'ha tornat a `min-width: 0`. També s'ha corregit el comentari de la T26.1, que citava AppGridColumn.

**Mesura després.** L'espaiador fa 44×44 a Wiki i Disseny i 44×48 a Notes, taronja, i la fila és taronja de vora a vora.

### T34 · Ploma 🪶 a la llista i al rail de Notes

**Diagnosi.** L'única icona SVG a l'esquerra de «Sense títol» és la de la fitxa de la llista (`NotaFitxa` → `ItemMedia`), i el rail plegat en pinta una altra de la mateixa manera. És el `Newspaper` de la carpeta Mur (`carpetes.js`, `ICONA_CARPETA['f-mur']`), que arriba per `GlifCategoriaContext`. A l'editor no hi havia cap icona a l'esquerra del títol.

**El canvi de MarIA era perjudicial.** Posava una 🪶 centrada DAMUNT de l'h1 de l'editor, a la ranura del logotip. Amb això desapareixia el logotip de Sóc de Poble de la nota de benvinguda (n1) i el botó «Editar logotip» de totes les notes. A més, duplicava el quart botó de la botonera i deixava CSS fora de tota `@layer`. S'ha desfet sencer: `NotesEditor.jsx` torna a ser idèntic a HEAD, s'ha llevat la prop `logoComponent` d'`UniversalEditorShell` i s'ha esborrat el bloc `.sdp-emoticona-titol`.

**Canvi.**
- Constant única `EMOTICONA_PER_DEFECTE = '🪶'` a `src/utils/emoji.js`.
- Al model de vista de Notes (`NotesSection.jsx`, `toWorkspaceNote`): `icon: note.icon || (emojiInicial(title) ? undefined : EMOTICONA_PER_DEFECTE)`. Es conserva l'ordre de T23: primer l'emoticona pròpia, després l'emoji del títol i, sense cap dels dos, la ploma. Una sola costura cobrix la llista i el rail. La dada `icon` no es toca, i l'editor, que llig les dades, no ho veu.
- El text i el comentari de `DialegEmoticona` deien «icona de sistema», que ja no és cert, i s'han ajustat.

**Mesura després.**
- La fitxa «Sense títol» mostra 🪶, sense SVG.
- El rail plegat mostra 🪶 a «Sense títol» i a «Bloc de notes».
- n1 torna a tindre el logotip.

### T35 · «Editar capçalera i avatar» al Perfil

**Diagnosi.** L'avatar ja es podia editar a la fitxa, però amb l'etiqueta «Editar logotip». Era un segon bloc damunt del nom que la fitxa pública no pinta (`PerfilPublicSection`, `showLogos={false}`).

**Canvi.**
- `UniversalEditorShell` rep un punt d'extensió genèric: `heroEditLabel`, `heroEditHelp` i `onHeroEdit({ acaba })`. Els valors per defecte deixen Notes igual.
- Diàleg nou dins de la llesca del Perfil, `src/sections/profile/DialegCapcaleraAvatar.jsx`. Està fet amb àtoms de Pedra Seca (`Dialeg`, `GrupOpcions`, `Boto`) i té tres destins: només la capçalera, només l'avatar o la mateixa per a les dues.
  - Cada destí passa pel mateix `useHeroImageHandler`: 1200 px la capçalera, 600 px l'avatar, i la pujada va pel port del Perfil (Model B).
  - Els desats van en sèrie: el segon no comença fins que el primer ha tornat.
  - «Llevar l'avatar» només ix si n'hi ha.
- `PerfilEditor`: un sol botó i `showLogoUpload: false`. A més, l'avatar `sdp-media://` es resol ací pel port. Sense el bloc del logotip, la barra taronja era l'únic lloc on es veia, i `PageFrame` no el resolia.
- Només al Perfil, com diu la Nota clau del Mestre.

### T36 · Botons inoperatius a l'editor i avís

**Canvi.**
- `PageFrame` rep dues ranures opcionals: `accionsInoperatives` i `avisAccions`.
- `UniversalEditorShell` les passa **després** de `...rest`, així que cap adaptador les pot desfer.
- Comentar, Compartir i Connectar porten `disabled` natiu i es veuen igual en repòs.
- Índex, Traduir i les fletxes continuen vius.
- L'avís és una `Alerta` en línia (no efímera) amb el text literal del Mestre, just davall de la barra blava.
- Cobrix Notes (també el sandbox del Foraster), la fitxa editable del Perfil i l'espècimen «Contracte» de /disseny, que munta NotesEditor. La lectura pública no canvia.

**Mesura.**
- `disabled`: Comentar, Compartir i Connectar sí; Índex, Traduir i fletxes no.
- El color de Comentar és igual que el de Traduir.
- Connectar conserva el fons.
- L'avís queda a 0 px de la blava.

### T37 · Trio de la barra blava centrat

**Diagnosi mesurada.** La barra era `flex`, i el trio s'apegava al pack de navegació. A /mur, amb 1600 px, el centre del trio era a x=498 i el de la barra a x=923. La skill `sdp-universal-page` §1.A ja demanava el centrat.

**Canvi** (a `components.css`, dins de `@layer components`):
- `header.bar-blue { display: grid; grid-template-columns: minmax(max-content, 1fr) max-content minmax(max-content, 1fr) }`.
- La col·locació va per classe, no per posició.
- Els extrems no poden baixar del seu contingut. Així no torna el solapament que va motivar la T20.
- S'ha actualitzat el text normatiu de l'espècimen «Controls de barra».

**Mesura.**
- Desviació 0 a /mur (1024 px) i a l'editor de Notes (1600 px).
- +4 px en barres de 469 px (Wiki i Xat a 1024).
- Límit geomètric: per davall d'uns 476 px de barra el pack de 132 px no deixa centrar. Al mòbil de 375 px el trio queda +26 px a la dreta, igual que abans.

### T38 · Barra taronja de pàgina amagada en mòbil i columna estreta

**Canvi.** `@media (max-width: 720px)` i `@container (max-width: 400px)` amaguen `.sdp-universal-page-container > section.bar-orange`.
- No afecta les caputxes de les targetes ni l'espècimen de /disseny.
- Excepció decidida pel Mestre: l'editor del Perfil la conserva, perquè hi viuen el selector d'identitat i l'avatar de T35.
- Sense la taronja, les eines ancorades pugen a davall de la blava. Al Bloc continua manant `top: 0`.

**Mesura.**
- A 375 px: `display: none` a /notes, /wikidepoble i /legal.
- Les caputxes de /mur continuen `flex`.
- Eines a `top: 0` al Bloc, sense desbordament horitzontal.
- A 721 px (columna de 441 px) la taronja torna.

### Revisió adversarial (quatre mirades, 16 troballes)

Cada troballa ha passat per un escèptic independent.

**Confirmades i corregides (4):**
1. Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i l'event pujava fins al `<dialog>` i el tancava sencer. Ara es para a l'input.
2. Comentar i Compartir desactivats pujaven 1 px en hover (`.sp-card-action:hover`). Ara no es mouen (`transform: none`).
3. Dos Esc durant una pujada podien deixar el `<dialog>` tancat amb `obert=true` (CloseWatcher). Esc s'accepta sempre.
4. Una prova comprovava «la dada no es toca» en un cas on no s'aplica la ploma, i s'ha mogut al cas bo.

**Refutades (12).** Motius: comportament ja existent i avisat, decisió del Mestre, o no demostrable. Una d'elles descriu una conseqüència que convé saber: T38 amaga també l'avatar de la fitxa pública en mòbil, perquè viu a la barra taronja.

### Decisions pendents per al Mestre

- **D1 · Pedra Seca `Dialeg`.** L'arrel del problema del `cancel` és que `Dialeg.jsx` no filtra `e.target`, i qualsevol diàleg amb un input de fitxers el tindrà. Es proposa `if (e.target !== d) return;`. És un component compartit: cal ordre.
- **D2 · Doctrina.** `.agents/skills/sdp-universal-page/SKILL.md` (§1.A, §2 i la barra taronja «sempre» amb full/context) i el comentari D13 de modules.css queden desfasats per T36 i T38. Cal propagar-ho amb `wiki-propagar-veritat`, i és una escriptura de governança amb lease.
- **D3 · Mòbil.** El centre exacte del trio (T37) és impossible per davall d'uns 476 px amb ← i → visibles. Si el vol exacte al mòbil, caldria amagar les fletxes per davall de 400 px de barra, i això és un redisseny.
- **D4 · Panell desplegable** per a l'autoria i la data en mòbil (T38, opció que el pla deixa oberta). Quan hi siga, l'excepció del Perfil es pot llevar.
- **D5 · Dues plomes.** La botonera continua amb la Feather SVG (T23). La llista i el rail mostren l'emoji 🪶. Cal decidir si s'unifiquen.
- **D6 · Avís de T36 al mòbil.** A 375 px ocupa quatre línies davall de la blava. Si molesta, es pot fer plegable.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves:** `npx vitest run src` dona 118 fitxers i **1.252/1.252** verdes (abans del torn, 1.220; +32 proves). Proves noves:
  - `PageFrame.capes.test.js`: regles CSS de T33, T37 i T38, amb la capa i l'excepció.
  - `UniversalEditorShell.accions.test.jsx`: T36 i els tres fills de T37.
  - `DialegCapcaleraAvatar.test.jsx`: sèrie, errors, cancel del selector i Esc.
  - A les proves existents: T35 a `UniversalEditorShell.test.jsx` i `PerfilEditor.test.jsx`, T34 a `NotesSection.test.jsx` i `emoji.test.js`.
- **En viu (navegador integrat, pestanya de fons):** T33, T34 (llista, rail i logotip de n1), T36, T37 i T38, amb les mesures citades a cada tasca.
- **Porta de disseny** (`node tooling/gates/design_guard.mjs --arrel=src`): ix roja, però cap entrada «NOVA» ve d'aquest torn. Les entrades són a `DocumentPrintPreview.jsx`, `ConnectarSection.*` i `WikiDePobleSection.navegacio.test.jsx`, i els 14 px són de la botonera de T23 (commit `96b822bc`).
- **No verificat en viu:**
  - T35 necessita sessió i no s'ha creat cap compte; queda cobert només per les proves.
  - Safari 16 i dispositius reals.
  - El comportament del lector de pantalla amb l'avís `role=status`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **ESTAT i LEDGER no s'han escrit.** `.agents/` és zona de governança. El hook només deixa passar `executor-mutacio.mjs PLA REBUT`, i el rebut exigix una lease de `reflex_petorreta` que la shell confinada no pot obrir. Davall hi ha el text exacte per a copiar-lo.
- **`tancament.mjs --check` no s'ha pogut executar** (vetat pel mateix hook). El torn queda obert.
- **Arbre concurrent.** `index.html`, `src/data/wikiManifest.js`, `.immunitari/*` i el prompt i el pla 2345 han canviat per altres mans durant el torn. No s'han tocat.
- **Índex de l'Escriptori.** S'han reapuntat a `90_arxiu_historic/` les tres àncores fantasma dels documents 2220 i 2240 (els va moure MarIA a mà a les 00:15) i s'han ancorat els documents vius 2345, 2355 i 0035. No s'ha mogut ni esborrat cap fitxer.
- **Sense commit.** El Mestre decidix quan i com es fa.

### Text per a `.agents/ESTAT.md` (bloc de dalt)

```markdown
## ESTAT_ACTUAL · 2026-09-28 01:50 · Claude (Opus 5.5) · Regressions T33–T38
- Torn `torn_d44a8d51` (code). Auditoria [[260928_0035_auditoria_claude]].
- Fet: T33 (espaiador stretch), T34 (🪶 a llista i rail; desfet el canvi de MarIA a l'editor), T35 (diàleg capçalera/avatar al Perfil), T36 (Comentar/Compartir/Connectar inoperatius a l'editor + avís), T37 (barra blava en graella, trio centrat), T38 (taronja amagada ≤720px i columna ≤400px; excepció al Perfil).
- Proves: vitest src 118 fitxers, 1.252/1.252. Design guard roig però sense entrades del torn.
- Pendent: D1–D6 de l'auditoria; T35 en viu amb sessió; ESTAT/LEDGER/tancament per lease; commit.
```

### Línia per a `.agents/LEDGER.md`

```markdown
260928 | torn | claude | T33–T38 aplicades i verificades; auditoria 0035; torn obert sense lease
```

## Proposta d'Automillora

El prompt demana analitzar dues incidències. La primera: MarIA va operar amb més de 200 artefactes sense cap fusible. La segona: la neteja de l'Escriptori no és autònoma. La diagnosi ve d'un lector independent, contrastada amb el disc. Cita fitxers i mesures.

### Per què no salta cap fusible de fatiga

- **L'únic fusible de MarIA és text.** El cas 4 de `core-context-panic` demana que el model detecte la seua pròpia degradació, que és justament la capacitat que es perd primer. `wiki-cicle-de-vida` promet «higiene cognitiva» a la descripció, però el cos no té cap llindar.
- **Hi ha un comptador, però no s'executa mai.** `tooling/brain/termometre_context.mjs` només l'importa `.agents/hooks/preflight_matrix_wrapper.mjs`, que no està registrat enlloc. I encara que ho estiguera:
  - avisaria amb `throw`, sense JSON: ni el model ni el Mestre ho veurien;
  - només entén el dialecte d'Antigravity.
- **`.agents/hooks.json` és inert.** Té un esquema que Antigravity no llig (un array en lloc del mapa amb `matcher` de la documentació oficial) i el `cwd` equivocat. A més, crida `hooks-local.mjs`, que rebutja el payload d'Antigravity. Al transcript de la sessió degradada no hi ha cap rastre de cap hook del repo.
- **Senyals mesurables que existixen.** A Antigravity, cada truncament escriu un pas `CHECKPOINT` al transcript. La sessió degradada en tenia 26 (un cada 14 minuts), un transcript de 2,99 MB i 202 fitxers pujats: eixos són els «200 artefactes». A Claude Code no hi ha cap hook `PreCompact` ni `Stop`, però el `usage` de cada resposta dona l'ocupació real de la finestra.

### Per què l'Escriptori no es neteja sol

La cadena es trenca en set llocs, i el cas dels documents 2220 els travessa tots:

1. **El torn propietari no es tanca mai.** El torn de MarIA `torn_0b48dfc8` és el propietari dels 2220 i s'ha quedat en `context_loaded`. El prompt 2345 porta el rebut fictici «sdp:torn_nou».
2. **Cap porta corre on treballa MarIA.**
3. **`porta-olivera` compara per dia de calendari.** No veu com a vells uns documents del mateix dia, i passada la mitjanit arxivaria documents vius. Comprovat en aquest torn a les 01:50 del 260928: `porta-olivera.mjs --informe` marca per a l'arxiu el pla i el prompt 2345 que s'estaven executant, i també la nota 2355. No s'han arxivat.
4. **El trasllat es va fer amb un `mv` de shell**, sense `--arxiva` ni `handoff`. Va deixar àncores fantasma i va arxivar l'auditoria 2240, que conté decisions obertes.
5. **`tancament.mjs` no crida `porta-olivera`.** L'SCC no detecta ni fantasmes ni trasllats manuals.
6. **La doctrina es contradiu.** L'índex mana `--arxiva`. `core-higiene-escriptori` exigix lease. `wiki-cicle-de-vida` i AGENTS §12 diuen «no buides l'Escriptori».
7. **L'índex té 397 línies**, la majoria àncores a l'arxiu.

### Mecanismes proposats (per prioritat; cap depén de la memòria de l'agent)

1. **Endollar els hooks d'Antigravity amb l'esquema oficial**, amb un canari de batec. `despertar` i `tancament` fallen si una conversa activa no té batec fresc. Per a MarIA. Esforç mitjà.
2. **Fusible mesurat `tooling/brain/fatiga.mjs`.** Compta els `CHECKPOINT`, els bytes del transcript i els fitxers pujats.
   - En groc (p. ex. ≥8 truncaments, ≥1,5 MB o ≥120 pujades), injecta un avís a cada invocació (`PreInvocation` → `ephemeralMessage`).
   - En roig (≥12, ≥2,5 MB o ≥180), `force_ask` visible per al Mestre a tota escriptura, que només permet l'Acta, l'ESTAT i el LEDGER.
   - Sempre JSON, mai `throw`. Els llindars s'han de calibrar amb les converses reals. Per a MarIA. Esforç mitjà.
3. **Tornar a injectar l'estat de la taula després de cada truncament.** És l'Escriptori classificat més els torns oberts, en 30 línies com a màxim. A Claude, el mateix a `SessionStart` amb `source=compact`. Per a tots. Esforç baix.
4. **Fusible per a Claude Code:** `PreCompact` més `UserPromptSubmit`, que llig el `usage` del transcript. En groc, avís en context. En roig, bloqueja amb un motiu visible, tret que es demane l'Acta o el tancament. Esforç mitjà.
5. **Supersessió obligatòria.** Escriure un prompt o un pla nou a l'Escriptori exigix un rebut real i cap torn anterior de l'actor obert amb documents. El remei és una ordre atòmica `porta-olivera --relleva --turn-id VELL --per NOU`, que mou, fa `handoff`, despenja l'àncora i anota el relleu. Per a tots. Esforç mitjà.
6. **Ranci per estat del torn, no per calendari.** Un document és arxivable si el seu torn està tancat o supersedit. Mai ho és si el cita l'ESTAT_ACTUAL o el prompt vigent. Esforç baix.
7. **Al tancament, detectar trasllats manuals i àncores fantasma**: `ESCRIPTORI_PHANTOM` a `verificador-scc`, i parelles `D`/`??` sense rebut de `handoff`. Esforç baix.
8. **Hook `Stop`** que no deixa acabar amb la taula bruta. Un sol reintent, amb la versió lleugera de l'informe. Esforç mitjà.
9. **Reparar `despertar`.** El segell de l'ESTAT porta el format `AAAA-MM-DD HH:MM` i el regex no el reconeix: per això l'ON_ESTIC diu «no es pot datar». A més, cal classificar la taula. Esforç baix.
10. **Una sola doctrina d'arxivament** (decisió del Mestre): la supersessió per torn és l'únic disparador automàtic, i una porta falla si la regla està escrita en més d'una font.
11. **Pressupost de context d'arrencada.** Rotar l'ESTAT (171 KB) i passar a un `00_index_arxiu` les àncores que apunten a l'arxiu. La sessió nova de MarIA va truncar 3 vegades en els seus dos primers minuts.

### Sobre la nota 2355 de MarIA

Diagnostica bé el símptoma, però:

- dona T33 per «esmenat», i el canvi era inert;
- dona T34 per «resolt», i era a la superfície equivocada i llevava el logotip;
- dona l'Escriptori per «sota control», quan hi havia tres àncores fantasma i tres documents sense àncora.

Els seus tres fusibles depenen de l'autopercepció i, tal com estan escrits, no es poden aplicar mecànicament.

### Retroalimentació sobre la plantilla `prompt_local.md`

- **Secció 0.** `porta-olivera` exigix «0. Abans de generar» i la plantilla diu «0. Preflight». A Claude, tot prompt que seguix bé la plantilla queda bloquejat. La porta hauria de validar per l'id de secció.
- **Caselles del preflight.** Les ha d'omplir l'eina (`porta-olivera --informe`, el tancament del torn anterior i un hash de l'Escriptori), no el model: el prompt 2345 marcava «Escriptori net» amb el 2220 encara a la taula.
- **Registre.** Validar el `Rebut` i el `Tall d'evidència` amb `document.mjs check`.
- **Camps nous.** «Supersedeix» (per a `--relleva`) i «Salut de l'orquestrador» (l'omple el mesurador).
- **Congelar el prompt en lliurar-lo** (sha256 i versió). El 2345 es va ampliar de T34 a T38 mentre s'executava, sense canviar ni la Modificació ni la llista d'«Instrucció» (diu T33–T36 i n'hi ha fins a T37 al prompt i T38 al pla).
- **«Documents a llegir» amb rutes exactes**, en lloc de «qualsevol document de l'Escriptori». La versió actual infla el context i lliga les dues incidències.
- **Criteris d'acceptació mesurables.** Per exemple: «rect de l'actiu = ample de la fila».

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_2345_prompt_claude_regressions]]
- [[260927_2345_pla_implementacio_regressions]]
- [[260927_2355_auditoria_cognitiva_fusibles]]
