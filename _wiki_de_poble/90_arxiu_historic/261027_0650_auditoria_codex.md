---
type: informe
status: esborrany
description: 'Contrast independent dels cinc carrils de la ronda 5: Descàrregues, converses, TOC i Notes, enllaços de la Wiki i baremador del Nano.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9dd9290e-06b7-4a4c-b099-a6713ad2f10c:11252545-bd8e-4332-9166-a5f1aa846d88
---
# Auditoria adversarial Gauntlet R5 de Claude

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9dd9290e-06b7-4a4c-b099-a6713ad2f10c:11252545-bd8e-4332-9166-a5f1aa846d88 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T04:48:50.345Z |
| Modificació | 2026-10-27T04:57:16.638Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 Codex; coordinador i tres subagents amb el model heretat de la sessió |
| Tokens consumits | No disponibles com a total mesurat; no s'estimen ni es copien les xifres de Claude |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

Repositori real: `socdepoble.org/`, dins de l'espai compartit `Som de Poble`. Torn propi `torn_9dd9290e-06b7-4a4c-b099-a6713ad2f10c`. Lectura de l'informe complet de Claude, el pla i el prompt 0535, el Llibre Mestre amb les fites P1-52–P1-61, AGENTS, l'arrencada i les skills locals `sdp-workflow` i `wiki-documentacio-i-reflex`. Olivera passa abans de crear este informe; creat i ancorat amb `document.mjs context/create`. Els subagents només han auditat els seus carrils; no han aplicat els pegats.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-27T04:48:50.345Z: esborrany creat i lectura del diff viu sobre HEAD `d83188d273a8ab6b841b6ce4051a315a46148eba`, branca `backup-notes-publish`.
- 2026-10-27: tres carrils paral·lels de contrast; mesurament propi al navegador compartit, proves dirigides i suite precommit completa.
- 2026-10-27: reproduïdes la divergència dels resolutors d'arxiu i la substitució de l'avaluador en el resum del Nano, exclusivament amb fixtures temporals.
- 2026-10-27: incorporat el contrast amb l'informe Gemini 0550, aparegut durant el treball; comprovades les seues afirmacions contra proves i portes actuals.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen: acceptació parcial de la Ronda 5.** La correcció P1-53 i la correcció del bucle del TOC superen el contrast. No done conformitat per a enviar a Apple el contingut actual de Descàrregues, ni considere el pegat de la Wiki un blindatge uniforme, ni recomane activar el baremador com a motor independent. El tancament global tampoc és verd al tall d'esta auditoria.

Les severitats indiquen l'efecte concret: `[BLOQUEJANT]` impedix la fita o la porta indicada; `[DEFECTE]` és un comportament incorrecte reproduït; `[MILLORA]` és una proposta o deute acotat. Una incidència en material preparat no és un error ja desplegat. No s'atribuïx a Claude allò incorporat després del seu informe.

### G5-01 · [BLOQUEJANT] Descàrregues continua exposant altres plataformes dins d'iOS

- **Abast:** `src/config/systemPages.js:102`, `src/app/App.jsx:1108`, `src/sections/detail/PageDetailSection.jsx:97`, `src/sections/mur/targetesMur.js:20`, `src/sections/text/pageContent.js:502`.
- **Evidència:** `AccesAlXat` sí que oculta el botó amb `esAppNativa()` (`XatSection.jsx:1736`), però `SYSTEM_PAGES` incorpora la pàgina sense condició, el Mur genera la seua targeta i les dues rutes `/descarregues` i `/page/descarregues` servixen el mateix cos. Este cos conté Android, Google Play, APK i Chrome a Android. L'ocultació del botó no tanca estos camins.
- **Font de veritat:** la [regla oficial Apple 2.3.10](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata), consultada el 27 d'octubre, restringix els noms, les icones i les imatges d'altres plataformes mòbils o mercats dins de l'app i les metadades, excepte funcionalitat interactiva específica aprovada. No consta eixa excepció per a esta pàgina.
- **Impacte:** bloquejant abans d'enviar este contingut en un binari iOS a revisió; és risc de conformitat documentat, no un rebuig real observat d'Apple. T1-02 de Claude continua obert.
- **Proposta conservadora:** política única per plataforma que cobrisca la targeta, la ruta directa i el cos. Afegir proves d'iOS per les dues rutes i el Mur; conservar la pàgina multiplataforma al web.
- **requires_human_decision:** true, per a triar entre ocultar la pàgina nativa o servir contingut propi d'iOS. No cal discutir de nou si amagar només el botó és suficient: no ho és.

### G5-02 · [DEFECTE] El pegat d'arxiu per nom dóna respostes diferents segons la porta

- **Abast:** material **no aplicat** a `../_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/`; `staged/arxiu_per_nom/tooling/lib/document-links.mjs:60`, i el catàleg de `tooling/wiki/teixidor.mjs:52`. El mateix `LLEGIU_PRIMER.md:729` reconeix la discrepància.
- **Reproducció:** un viu `_wiki_de_poble/02_saber/x.md`, un arxivat `_wiki_de_poble/90_arxiu_historic/x.md` i `[[x]]` des de l'índex. Amb el catàleg de SCC/Orfandat, resol al viu. Amb el de Teixit/Llaurador, que inclou els arxivats en `files`, respon `Enllaç ambigu: x.md`. La caiguda a l'arxiu només actua quan `found` és buit; no imposa una precedència comuna als candidats exactes.
- **Impacte:** una porta pot validar un vincle que una altra rebutja. Amb caixa diferent i corpus diferents hi ha més divergències documentades al §5 del lliurable. No s'ha trobat un homònim d'este tipus al viu: és un defecte del contracte futur, no una fallada inventada del corpus actual.
- **Font de veritat:** la promesa del mateix pegat que «el viu sempre guanya» i l'objectiu P1-39 de resistir arxivaments sense reobrir deute.
- **Proposta:** compartir el catàleg i la política de precedència entre les portes, i executar una mateixa matriu de casos per homònims, caixa, corpus i rutes explícites. No ampliar el fallback dels camins explícits a cegues.
- **requires_human_decision:** false per a corregir la divergència; l'aplicació del pegat de governança conserva el seu circuit d'executor.

### G5-03 · [DEFECTE] Una nota posterior d'IA desplaça la humana del resum del Nano

- **Abast:** paquet **no aplicat** `../_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/`, sisena passada `261027d`; `staged/tooling/media/baremador_nano.mjs:690` i `:735`.
- **Reproducció:** dos registres vàlids de la mateixa empremta: Mestre, nota 10, a les 00:00; `ia:claude`, nota 1, a les 01:00. `informe()` sense filtre declara dos registres, una qualificació vigent i mitjana 1. `informe(..., {origen:'mestre'})` recupera la mitjana 10.
- **Causa:** `vigents()` agrupa només per `imatge.sha256`. La data decidix qui representa la imatge, sense conservar l'avaluador en la clau d'actualització.
- **Impacte:** no s'esborra historial, però el resum barreja autoritats i pot deixar de representar el calibratge humà. Tampoc és una agregació vàlida de vots comunitaris de P1-42. El filtre manual no arregla el valor per defecte.
- **Font de veritat:** calibratge humà de P1-41 i votació/configuració comuna de P1-42.
- **Proposta:** separar qualificació individual, vigència per avaluador i agregació per context. Si es manté una vista exclusiva del Mestre, fer-la explícita. No usar «últim a escriure guanya» com a votació.
- **requires_human_decision:** true per a fixar el paper de les notes d'IA (D-8) i la política d'agregació; el defecte d'identitat està reproduït.

### G5-04 · [BLOQUEJANT] El tancament global falla per una acta orfa i un informe concurrent invàlid

- **Abast:** `_wiki_de_poble/10_actes/261027_0520_acta_marmota_triomf_ronda5_claude_i_canonitzacio_doble_projecte.md`.
- **Evidència inicial:** SCC i Orfandat ixen amb 1; Orfandat informa de zero enllaços trencats i un orfe. `tancament --check` també identifica `ORPHAN_OPERATIVE`.
- **Atribució:** l'acta 0520 és posterior a l'informe de Claude. Açò impedix dir «tot verd ara», però no refuta que les portes passaren a les 02:48 ni prova una regressió dels 248 sanejaments.
- **Font de veritat:** eixida actual de les portes, AGENTS §4 i l'ancoratge operatiu.
- **Proposta:** que la mà responsable de l'acta l'ancore des d'un índex operatiu que corresponga i repetisca les portes. Este informe registra la ruta com a literal; no amaga la incidència creant una aresta incidental per a passar la prova.
- **requires_human_decision:** false; és una correcció documental acotada fora de les fonts auditades.

**Canvi concurrent al tall final:** ha aparegut `_wiki_de_poble/04_escriptori/261027_0550_auditoria_gemini.md`. El seu `reflex` reutilitza el de l'informe Claude 2150. La porta documental el rebutja amb «Rebut absent o vinculat a un altre document». A més, SCC i Orfandat detecten cinc exemples seus com a enllaços inexistents (`...`, dos `nom.md`, `x.md` i `nom_document.md`). El tall final passa a **cinc enllaços trencats i un orfe**, més l'error de rebut al tancament. Cal un rebut propi i una representació literal dels exemples; no copiar el rebut d'una altra auditoria. No s'ha modificat l'informe alié.

### G5-05 · [MILLORA] Fondre P1-41 en P1-42; no activar un segon sistema permanent

P1-42 diu expressament «un sol motor» amb estrelles 1–5, motiu i atributs dins de `/multimedia`. El paquet preparat imposa enters 1–10 (`baremador_nano.mjs:584`), guarda un JSON separat en `.agents/qualificacions_nano.json` (`:106`) i no s'integra amb el visor. Conté 1.576 línies de motor i 1.670 de proves; activar-lo ara consolida manteniment i migració que després caldria desfer.

**Dictamen:** fondre'l. Reutilitzar les funcions pures del prompt, els diagnòstics d'estil, Zero Text Rule i FULL BLEED com a vessant tècnic del motor P1-42. Unificar identitat d'imatge, avaluador, context i persistència amb el model multimèdia; preservar escala i nota originals quan s'importe historial. No convertir 10 a 5 per arrodoniment silenciós ni tractar un motiu de rebuig com una estrella. Una CLI podria ser client del mateix motor, sense un magatzem ni una semàntica de vot paral·lels.

**Font de veritat:** P1-42 i P1-51 del Llibre Mestre. **requires_human_decision:** true per a aprovar la fusió i la migració d'escala; no s'ha aplicat cap canvi.

### G5-06 · [MILLORA] Les xifres i les ordres de la Wiki necessiten precisió

L'ordre literal de l'encàrrec, `node tooling/wiki/compilador_wiki.mjs --check --strict`, falla amb `MODULE_NOT_FOUND`. L'eina existent és `node tooling/wiki/compile-wiki-to-app.mjs --check --strict`, i passa. Corregir la referència del prompt; no crear un altre compilador per satisfer un nom erroni.

«248 enllaços reparats» engloba **190 destins reconduïts, 46 referències convertides a codi i 12 delimitadors retirats dins de codi** (`LLEGIU_PRIMER.md` de Wiki:45–57). Les 46 referències ja no són navegables; baixar el comptador d'enllaços invàlids no acredita haver recuperat eixos destins. Les rutes exactes dels 190 continuen sent sensibles a reagrupaments d'arxiu, com admet T2-01. La resolució per nom és una base raonable si rebutja ambigüitats i aplica la mateixa política en totes les portes.

**Proposta:** distingir els tres resultats en l'acta i conservar la llista de destins no recuperats. **Font de veritat:** inventari del lliurable i ordre executable actual. **requires_human_decision:** false.

### G5-07 · [MILLORA] L'índex obert no veu una actualització de text dins d'un strong

**Deute preexistent**, reproduït amb el component real: `<h3><strong>Abans</strong></h3>`, obrir índex i actualitzar el node de text interior a «Després». L'entrada continua en «Abans». `PageFrame.jsx:308–310` només reconstrueix per `characterData` si el pare immediat casa amb H1–H6, o és dins de la capçalera; no troba el títol avantpassat del `strong`.

Pot afectar actualitzacions remotes mentre el calaix continua obert. L'edició local que mou el focus fora ja el tanca. Proposta: comprovar l'avantpassat més pròxim dins del contenidor i mantindre la guarda que evita mutacions a TipTap. No invalida la correcció del bucle. **Font de veritat:** contingut viu de l'Índex; **requires_human_decision:** false.

### G5-08 · [DEFECTE] La imatge descartada continua fora del cens; falla una prova que precommit no executa

`npx vitest run src/sections/multimedia/censImatges.test.js --maxWorkers=2` dóna 9 proves verdes i 2 fallades. La primera assenyala tant `/assets/fotos/iaia_maria_avatar_mobil.png` com `/assets/uploads/brain/nano_descarregues_gamberro.jpg`; la segona falla per la bessona de l'avatar. La parella gamberro continua a `public/` sense entrada al cens ni exclusió. És T1-03 de Claude, encara obert.

La suite precommit **sí que passa**, perquè la seua configuració no inclou este fitxer. Una parella fora del cens és un defecte real; declarar que ha tombat el precommit actual és fals. Proposta conservadora: resoldre amb el responsable si la parella s'inventaria com a estudi exclòs o es retira de distribució conservant l'original humà; no esborrar-la automàticament durant l'auditoria. L'avatar és una incidència separada, ja descrita en l'informe de Claude. **Font de veritat:** prova executable del cens; **requires_human_decision:** true per al destí de la imatge.

### Contrast creuat amb Gemini 0550

Coincidim en el risc iOS i en fondre el Nano en P1-42. Discrepe d'estes afirmacions del seu informe, contrastades al viu:

- Les files no fan 97px: la mesura és 96px totals; la vora està inclosa en el model de caixa. No cal sumar-la una altra vegada.
- El reset limitat a Converses resol P1-53 i preserva les altres superfícies. El marge anterior en les altres llistes és deute conegut, no una regressió creada pel modificador. Aplicar el reset global que proposa Gemini és una ampliació visual d'abast.
- `frontissa-contingut` dóna 15/15 i precommit passa. El cens sí que falla per separat (G5-08).
- `schema-cutover.lock.json` està modificat i la seua empremta `95c166fa80ff1ffc969aa619c5509a457a5291e69f7e1892fcd8f02e5542e828` coincidix amb el SHA-256 actual de `schema.json`. No hi ha el desfasament concret que denuncia G4-02 de Gemini.
- Una qualificació Nano escrita mentre corre el snapshot d'un tancament o executor sí que pot fer fallar eixa comprovació. No és cert que qualsevol qualificació feta durant tota la vida d'un torn obert el destruïsca: `checkTurn` no rebutja per defecte qualsevol delta de `.agents/`. Continua sent un motiu per separar dades d'ús i governança, sense anomenar-ho una col·lisió destructiva universal.
- No ratifique «pegat resilient, net i segur» com a garantia global: el cas d'homònims de G5-02 està reproduït i el mateix lliurable reconeix la política divergent.

### Contrast dels cinc carrils

| Carril | Resultat verificat | Reserva |
| --- | --- | --- |
| Descàrregues | Botó natiu absent; botó web de 48px; ruta i imatge correctes; zero enllaços a botigues al cos | G5-01, contingut iOS |
| Converses | 96px seguits, avatars 76px, marge i padding dels li a zero | Noms llargs i recompte de selecció encara es retallen |
| TOC i Notes | H1–H6 al codi/proves; top 64px real; obrir no mou l'scroll; bucle editable corregit | G5-07 preexistent; falta aparell físic |
| Wiki | Compilador real verd i zero links trencats a Orfandat | G5-02 del pegat i G5-04 del corpus concurrent |
| Nano | Material separat, encara no aplicat | G5-03; fondre en P1-42 |

**P1-53, sense regressió lateral trobada.** El reset nou és `.sdp-xat-llista--converses > li` (`modules.css:3417`) i el modificador només es posa a `LlistaConverses.jsx:114`. No modifica `base.css` ni les altres llistes. Fitxers/adjunts senzills i Ajustos conserven 72px per les regles `--senzilla`/`sdp-xat-opcio`; els seus marges anteriors continuen iguals. Els 8px d'abans expliquen el pas 104px; el «10px» era una estimació visual. No s'ha aplicat el reset global que afectaria totes les llistes del xat.

**Deute visual ja declarat per Claude, confirmat:** a 1280×800, en la disposició actual la fila fa 289px i «Gent de la Torre» disposa de 149px per a un nom que en necessita 161; queda amb el·lipsi. A 375×812, «1 seleccionada» es retalla visualment al costat de «Marcar com a llegides». No és una fallada del pas vertical de 96px; continua requerint una decisió de composició. No he canviat les preferències d'amplària de les columnes.

**TOC:** en Descàrregues a 375×812, barra negra `[0,64]`, overlay i drawer `[64,812]`, 8px interiors de respiració. Amb `app-main__content.scrollTop=812`, obrir conserva exactament 812; navegar a l'H1 tanca el calaix, fa el salt demanat i retorna el focus a l'obridor. El text de la pàgina conté H1–H5; l'H6 està cobert per les proves, no s'inventa una mesura visual d'un H6 inexistent. L'offset usa el mateix safe-area que la barra. El TOC evita IDs dins de contingut editable i `tancaIndex` és estable: no s'ha reproduït el bucle infinit.

**Fites noves:** P1-52 i P1-54 encara són pendents visibles (text antic de simulació i accés repetit en conversa); P1-55–P1-61 són requisits del següent treball, no canvis que es puguen donar per fets. P1-46 tampoc es confon amb P1-38. L'auditoria no executa eixes implementacions ni les penalitza com a regressions del prompt original.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat d'esta auditoria |
| --- | --- |
| `git status`, `git diff`, `git diff --cached` | Arbre compartit brut; cap staged propi. HEAD i branca al Registre; revisió dels fitxers dels cinc carrils |
| `git diff --check` | 0 |
| `npm run test:precommit` | 0: 175 fitxers, 3.365 Vitest verdes, 2 omeses; 262 Node verdes. Total 3.627 verdes |
| Descàrregues / pàgines / accés | 4 fitxers, 46 verdes; `origenPublic` 8 verdes |
| TOC / Notes / eines / CSS | 11 fitxers, 121 verdes |
| Llista / fila / VistaMultimedia | 3 fitxers, 43 verdes amb configuració Vitest general |
| `compilador_wiki.mjs --check --strict` | 1: fitxer inexistent |
| `compile-wiki-to-app.mjs --check --strict` | 0; 74 referències fora del manifest públic, no 74 errors |
| SCC / Orfandat | 1 / 1: inicialment zero links trencats i un orfe; al tall final, cinc links de l'informe Gemini nou i el mateix orfe |
| `porta-olivera.mjs` | 0; informe ancorat per l'eina documental |
| `frontissa-contingut.mjs` | 0: 15/15 claus aprovades. T1-01 de l'informe antic ja no bloqueja al tall actual |
| `git apply --check`, pegats Wiki i Nano | 0 en tots dos; compatibilitat textual no equival a correcció funcional |
| Reproduccions adversarials | Divergència d'homònims, agregació Nano i actualització nested-strong confirmades en temporals |
| Cens d'imatges, fora de precommit | 1: 9 verdes, 2 fallades; vegeu G5-08 |
| Contracte documental propi | 0: `valid:true`, zero errors |
| `tancament.mjs --check`, global | 1: informe Gemini amb rebut alié, cinc links invàlids i acta 0520 orfa; les altres set comprovacions internes passen |

La configuració precommit no inclou les proves de presentació de `LlistaConverses/FilaConversa/VistaMultimedia`: una invocació dirigida inicial amb eixa configuració va respondre «No test files found», amb codi 1. S'ha repetit amb la configuració general i han passat 43 proves. No es compta el primer intent com a verificació reeixida. Les proves dirigides poden solapar-se amb precommit; no se sumen per inflar el total.

Log de precommit d'esta sessió: `/private/tmp/sdp-codex-r5-precommit.log`. Prova temporal del títol formatat: `/private/tmp/sdp-gauntlet-toc-codex/nested.test.jsx`; falla l'expectativa «Després» i així acredita el deute, no una regressió de la suite ordinària.

Els mesuraments CUA s'han fet a `http://localhost:3340`, en una pestanya pròpia; viewport original restablit. No s'ha arrancat, aturat ni reconstruït el servidor compartit.

Relleu d'AGENTS §4 completat a `.agents/ESTAT.md` amb un únic target CAS i `executor-mutacio`, transacció `3b4211f1-68ba-40b6-9353-9d0ecee73b7f`. Historial previ preservat, claim completat i lease pròpia consumida; segell `ae58ddf0…` intacte. L'executor ha generat la seua evidència i refrescat metadades de segell. El hash del diff de `src/` és idèntic abans i després de l'entrega documental: `ef9d0abe019554d0ffed6b54cad45eb29298d49b94cec78d9b0a410c314c3d54`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha editat cap fitxer de `src/`, aplicat cap pegat, fet commit/push, accedit a dades de producció ni activat el baremador. No s'ha mogut ni eliminat material de l'Escriptori o de producció humana. De l'arxiu històric només s'han necessitat noms i resolució de fixtures; no hi ha ingesta massiva de contingut arxivat.

El corpus és viu i incorpora feina concurrent. L'informe de Claude acaba amb la cinquena passada encara oberta; els lliurables de disc consultats ja inclouen la sisena del Nano i el tancament 0500 de la Wiki. Les xifres antigues de portes no substituïxen les d'esta auditoria. El bloqueig T1-01 d'empremta està resolt ara, mentre que l'orfe 0520 és nou.

No s'ha provat un iPhone/Android físic, una safe-area no nul·la, VoiceOver ni Notes amb sessió real. La inspecció de la política de plataforma i les proves de components no equivalen a revisió d'Apple ni a certificació completa del binari. La suite precommit és un subconjunt: no acredita tota la suite Vitest ni totes les portes de `run-portes`.

Les decisions pendents de producte són el tractament d'iOS, la fusió del baremador i la composició visual del recompte/noms. Cap d'estes decisions ha impedit completar i lliurar el dictamen.

S'ha executat el tancament en mode comprovació, amb el resultat roig explícit de G5-04; no s'ha forçat `--close` ni transformat eixe resultat en una certificació verda. No s'ha creat una Acta Marmota addicional: el relleu queda en este informe i en ESTAT; l'acta de fi de jornada correspondrà al tancament conjunt amb l'orquestradora.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261026_2150_auditoria_claude]]
- [[261027_0535_prompt_codex_auditoria_gauntlet_ronda5_claude]]
- [[261027_0535_pla_implementacio_auditoria_gauntlet_ronda5_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
