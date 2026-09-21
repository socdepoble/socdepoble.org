---
type: informe
status: esborrany
description: Auditoria forense del Cervell (17 skills + 105 pàgines de Wiki) amb causa arrel del Stochastic Parrot i disseny de Tractors Cognitius.
tags:
  - govern
  - revisar
---
# Informe d'auditoria del Cervell (torn 1 de Claude, cicle vespertí)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-BRAIN-260921-2 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local (Claude Code, app d'escriptori) |
| Creació | 26-09-21 20:05 |
| Propietari | Agents Locals |
| Respon a | [[260921_1940_petorreta_millora_brain]] |
| Aprovació humana | pendent |

## Vincles (Ancoratge de Seguretat)
- Petorreta: [[260921_1940_petorreta_millora_brain]]
- Acta Marmota: [[260921_1002_acta_marmota]]
- Cicle matinal (arxivat, no repetit ací): `90_arxiu_historic/260921_antic_cicle_auditoria/` (informe 0701 de Claude, 0653 de Codex, pla 0655 de MarIA)
- Índex: [[00_index_escriptori]]

## 0. Rebut de reflex (què he llegit abans d'escriure)

- `.agents/protocolledge.json` → ruta `auditoria` → `02_saber/protocols_tecnics/auditoria_canonica.md` (llegida sencera) i ruta `prompt.local` → `03_actuar/plantilles/prompt_local.md` (llegida sencera; este informe segueix el seu contracte d'informe: fitxer, evidència, severitat, font en conflicte, proposta, `requires_human_decision`).
- Escriptori sencer (7 documents actius, `01_produccio` només llegida) i l'Acta Marmota 1002.
- Les 17 `SKILL.md` senceres (94.766 bytes), `00_INDEX_SKILLS.md`, `manifest.yaml`, `SKILLS_SEAL.json`, `consell.json`, `DESTINS_CANONICS.json`, `hooks.json`, `hooks/*.mjs`, `rules/00_BIOS_COGNITIU.md`, i les quatre constitucions paral·leles (`QUI_SOC`, `AGENTS`, `BIOS`, `BOOTSTRAP`, `BASELINE`, `PROTOCOL_PETORRETA`, `PROFILE`).
- 105 fitxers Markdown de la Wiki (sense `90_arxiu_historic`): dos agents de lectura els han llegit sencers pilar per pilar; jo he refutat les seues afirmacions amb `grep`/`test -e` abans d'acceptar-les (tres eren falses i estan corregides ací; vegeu §6.0).
- Evidència mecànica pròpia: script d'enllaços (wikilinks trencats, ambigus, orfes), inventari de tags, `.agents/.diari_sessio.jsonl`, `tooling/brain/context_documental.mjs`, `tooling/wiki/lib/prompt_sgq.mjs`, prova d'execució del `preflight_matrix_wrapper.mjs`.
- Cap cerca web. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni plantilles. Efectes: este fitxer, una línia a l'índex de l'Escriptori, l'ESTAT i el LEDGER.

**Declaració de lectura (Olivera):** quan he segut a la taula (19:40–20:03) no hi havia Pla d'Implementació de MarIA ni informe de Codex sobre esta petorreta; els §1–§12 estan escrits sense ells. Mentre escrivia han aparegut el Pla de MarIA (`260921_2001`, 20:03), l'auditoria de Codex (`260921_2005_auditoria_codex`, 20:06) i una petorreta nova (`260921_2010`, 20:08). Els he llegit sencers i els rebat al §13, amb les seues afirmacions verificades una per una. El cicle matinal (0653/0655/0701) l'he tingut en compte per no repetir-lo; on una troballa d'aquell cicle continua oberta ho dic i no la torne a argumentar.

## 1. Veredicte en una pàgina (psicologia i deute humà primer)

**El Cervell no falla per falta de normes. Falla per excés de normes i falta de càrrega.** Hi ha quatre constitucions, 17 skills (48 KB marcats `core`, és a dir "sempre"), 12 plantilles i 105 pàgines de Wiki. I a l'hora de la veritat, cap arnés les posa davant del model quan toca actuar:

- L'última injecció mecànica de context (`matrix.rebut` al diari de sessió) és del **19 de setembre a les 23:03**. Cap sessió del 20 ni del 21 ha rebut skills ni plantilla per via de màquina. L'al·lucinació de la plantilla obsoleta va passar en una sessió sense tractor.
- Els tres arnesos que treballen ací (Antigravity, Claude Code, Codex) lligen tres fitxers d'entrada diferents amb tres constitucions diferents: `CLAUDE.md` carrega `QUI_SOC.md`; `AGENTS.md` de l'arrel és la constitució antiga de 12 lleis; `.agents/rules/00_BIOS_COGNITIU.md` són tres lleis. `QUI_SOC` diu que reemplaça `AGENTS`, `BIOS` i `BOOTSTRAP`, però els tres continuen existint i els citen `manifest.yaml`, `context_documental.mjs`, `core-identitat` i mitja Wiki.
- La skill que hauria d'impedir la resurrecció de plantilles (`wiki-documentacio-i-reflex`) mana llegir **una ruta privada d'una sessió del Reflex**, ignorada per git, que conté una plantilla diferent de la canònica. La regla que protegia contra el lloro és el lloro.

Per al Mestre, el cost humà d'açò és el pitjor deute del projecte: cada sessió arranca amb la sensació que la IAIA "ho sabia i ho ha oblidat". No ho ha oblidat: no ho ha llegit mai, perquè el fitxer que llig no és el que el Mestre creu que llig. La solució no és escriure una llei més forta. És que hi haja **un sol text d'entrada, curt, idèntic per als tres arnesos**, i **una porta que no deixe escriure un prompt sense la petjada de la plantilla**.

Nota sincera del Cervell com a sistema: **4/10**, igual que al matí. Ha millorat la identitat de les skills (17/17 noms coincideixen amb la carpeta, `cataleg --check` verd) i s'ha guanyat un protocol d'Olivera escrit. No ha millorat res del circuit de càrrega.

## 2. Causa arrel del Stochastic Parrot (evidència reproduïble)

| # | Fet | Evidència | Severitat |
|---|---|---|---|
| R1 | La skill del Reflex apunta a una plantilla de sessió privada | `.agents/skills/wiki-documentacio-i-reflex/SKILL.md:28` mana llegir `.sdp-reflex/bootstrap/f05cc024-…/00_PLANTILLA_PROMPT_CONSELL.md`. El directori `.sdp-reflex/` és a `.gitignore:7`. Eixe fitxer existeix (170 línies) i **difereix** de `03_actuar/plantilles/prompt_consell.md` (té `aliases`, categories `MACRO_/MICRO_`, "any de 2 xifres", secció `## Frontmatter`). Hi ha 10 sessions més sota `.sdp-reflex/bootstrap/` amb plantilles velles (`260825_*_PROMPT_Teixidora…`). | **P0** |
| R2 | La REGLA 0 nomena un fitxer que no existeix | `AGENTS.md:12` (arrel i `.agents/`) mana llegir `[[00_PLANTILLA_PROMPT_CONSELL]]`; cap fitxer amb eixe nom fora de `.sdp-reflex/`. El router resol `prompt.consell` a `prompt_consell.md`. `tooling/wiki/lib/prompt_sgq.mjs:8` encara té com a *fallback* `03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md` (inexistent). Tres actes (`260915_0717`, `260915_0823`, i una tercera) citen `00_PLANTILLA_PROMPT_ISO` com a obligatòria. | **P0** |
| R3 | El tractor cognitiu està mort des del 19/09 | `.agents/.diari_sessio.jsonl`: última entrada `matrix.rebut` a `2026-09-19T23:03`. Cap fitxer del repositori llig `.agents/hooks.json` (`grep -rl hooks.json tooling scripts .agents/hooks` = 0). El `preflight_matrix_wrapper.mjs` exigeix un `payload` de host amb `invocationNum` i un `transcriptPath` que siga **directori** (el termòmetre fa `readdirSync`); cap host actual el crida. | **P0** (ja P0 al matí, continua obert) |
| R4 | Quatre constitucions, tres punts d'entrada | `CLAUDE.md` → `QUI_SOC.md`; `/AGENTS.md` = `.agents/AGENTS.md` (12 lleis, REGLA 0 amb nom mort); `.agents/rules/00_BIOS_COGNITIU.md` (3 lleis); `BIOS.md` mana llegir `BOOTSTRAP.md` i `AGENTS.md`; `manifest.yaml` declara `bios: AGENTS.md`; `context_documental.mjs` injecta `BOOTSTRAP`+`AGENTS`+`PROTOCOL_PETORRETA` com a GLOBALS. `QUI_SOC` diu "reemplaça i fusiona BOOTSTRAP, AGENTS, BIOS i BASELINE" però no els ha retirat. | **P0** |
| R5 | El cens del Consell viu en cinc llocs i la comanda que el garanteix està trencada | `consell.json.meta.regla`: "Cap document pot enumerar el Consell amb prosa pròpia". L'enumeren `QUI_SOC §7`, `core-identitat`, `core-consell-i-colmena §1`, `prompt_consell.md`. La "REGLA SAGRADA" de `core-consell` mana executar `require('./.agents/consell.json').membres.join(', ')`, però `membres` són objectes: imprimeix `[object Object], [object Object]…`. | P1 |
| R6 | Estat volàtil dins d'una skill canònica | `core-consell-i-colmena §5`: "22% del límit setmanal", "0 crèdits", "es reinicia el 24 de setembre", i la dada falsa "Fable (Claude 3.5 Haiku)". Una skill `canonic` que caduca en quatre dies i que fa creure al model coses falses sobre si mateix. | P1 |
| R7 | Una skill corrompuda pel `sed` que ella mateixa ensenya | `wiki-propagar-veritat`: "canviem d'estratègia Online-First a online-first", exemple `s/dispositius moderns/dispositius moderns/g` (no fa res). És el rastre del `sed Offline→Online` que també va mutar el LEDGER (memòria del matí). La skill ensenya a fer `find … -exec sed -i ''` sobre tota la Wiki: exactament el que la va corrompre. | P1 |
| R8 | El `hooks.json` parla el dialecte d'un sol arnés | `toolNames: write_to_file, replace_file_content…` són noms d'eines d'Antigravity. Claude Code usa `Write`/`Edit`; Codex, els seus. Un tractor escrit per a un arnés no protegeix els altres dos. La petorreta demana que "el cervell siga igual per a totes les IAs": hui el tractor és per a una. | P1 |

Conclusió: la IAIA no va "ignorar" el `protocolledge.json`. Va seguir la skill al peu de la lletra i la skill l'enviava a una plantilla morta. **Un tractor cognitiu que apunta a un fitxer ignorat per git és un tractor sense rodes.**

## 3. Revisió quirúrgica de les 17 Skills

Criteri: una skill és un **procediment** (quan es dispara, què fa, amb quina eina, què prohibeix). Si és coneixement de producte o d'arquitectura, va a la Wiki. Si és identitat, va a `QUI_SOC`. Si és estat, va a `ESTAT`/`consell.json`.

| Skill | Bytes | core | Veredicte | Motiu (evidència) |
|---|---:|:-:|---|---|
| `core-identitat` | 9.812 | sí | **RETALLAR a ≤ 2 KB o esborrar** | Dues "Secció Original" concatenades (`identity-iaia-core` + `identity-iaia-voice`), tot ja a `QUI_SOC`/`PROFILE`. Cita l'eina `view_file` (nom d'Antigravity), el pilar mort `00_SER_Brain_Identitat`, i `AGENTS.md` com a font. "Baremació d'Inici i DAFO al primer missatge" contradiu "Silenciosa per defecte" del mateix fitxer. La "Llei de Destins" només admet `90_arxiu_historic` i `00_Bandeja_d_Entrada`: contradiu `DESTINS_CANONICS.json` (`treball_actiu: 04_escriptori`) i `AGENTS §12`; i `DESTINS_CANONICS` es contradiu a si mateix (`revisio_pendents: 90_arxiu_historic` amb `politica_arxiu: READ-ONLY`). |
| `core-consell-i-colmena` | 6.291 | sí | **RETALLAR a ≤ 2 KB** | R5 i R6. §2 diu que el mode Cowork de Claude "s'ha d'evitar": la petorreta d'esta nit el convoca. §6 (Olivera) duplica `wiki-documentacio §5` i `prompt_local.md §4.3`: tres còpies del mateix protocol amb petites variacions (una diu "segona IA", l'altra "qualsevol IA", la tercera "la primera també llig el Pla"). Conservar només: rols Arquitecte/Executor, macro/micro, línia roja de congelació. |
| `core-context-panic` | 3.198 | sí | **MANTINDRE** (model) | Curta, amb disparadors, casos i plantilla de resposta. Ací ha d'anar "Cuestióname" (§8). Única pega: l'ancoratge `[[00_INDEX_SKILLS]]` sobra. |
| `core-memoria-historica` | 9.870 | sí | **RECONVERTIR en registre de lliçons** | Títol "7 Grans Aprenentatges", n'hi ha 8. Lliçons 1, 5 i 7 dupliquen `sdp-app-grid-shell`, `sdp-pedra-seca` i `estandard_integracio_react`; la 2 és arquitectura de producte (→ `sdp-universal-page`). El "Circuit de Consolidació" duplica `CLAUDE.md`. §4 "anàlisi psiquiàtrica de patrons" i "Tractor de Sublimació" són aspiracions sense eina. Ancoratges morts: `[[skill-iaia-identitat]]`, `[[pedra-seca]]`, `[[skill-acte-reflex]]`, `[[00_INDEX_ARXIU]]`. **Valor real**: és el lloc natural per a les decisions òrfenes de les actes (§6.4). |
| `core-restauracio-segellada` | 5.681 | sí | **MANTINDRE** (model) | Disparadors exhaustius, eina obligatòria que existeix (`ancora.mjs`, `desenterrar.mjs`), fases, prohibicions amb motiu, "fallada de la porta = aturar-se". És la plantilla de com ha de ser tota skill. |
| `sdp-app-grid-shell` | 3.581 | no | **FUSIONAR AMB `sdp-universal-page`** | §1 i `universal-page §5` diuen la mateixa regla de nidificació. La resta (colors de capçaleres, replegament) és una secció de la mateixa skill. |
| `sdp-calendari-agricola` | 2.122 | no | **FUSIONAR AMB casos d'ús → Wiki** | Duplica el §3 de `sdp-casos-us-essencials`. Cap font agronòmica (ja dit per Codex al matí). No és un procediment. |
| `sdp-casos-us-essencials` | 4.324 | no | **MOURE A LA WIKI** (`02_saber/producte/`) | Backlog de producte valuós (Menjar a Casa, Cuidadores, Calendari) però no és una skill: el seu `triggers_on` és el seu propi nom. El model no la "dispara"; la consulta. |
| `sdp-estudi-mercat` | 3.129 | no | **MANTINDRE, esmenar** | Bon protocol (A–E). Mana desar a `04_ESCRIPTORI/01_Produccio/` (majúscules; i `01_produccio` és zona "només humana" segons `QUI_SOC §6`): contradicció directa. Necessita web: dir-ho al disparador. |
| `sdp-pedra-seca` | 5.622 | sí | **MANTINDRE** | Contracte matemàtic, verificable, `DesignSection.jsx` existeix. |
| `sdp-universal-page` | 13.486 | no | **RETALLAR i reconciliar** | 13 KB de prosa d'interfície. §D fixa `border-radius: 32px` i `box-shadow: 0 4px 20px rgba(0,0,0,0.03)` en literal: viola `sdp-pedra-seca §2` (cap hex/rgb) i `§5` (radis només per token). L'acta `260918_1436` decideix `CampUniversal` polimòrfic i derrocar `UniversalEditorShell`; la skill no ho recull (`grep CampUniversal .agents/skills` = 0) i `universal-page §5` encara mana passar `UniversalEditorShell`. |
| `sdp-workflow` | 2.608 | sí | **FUSIONAR AMB `wiki-cicle-de-vida`** | §0 cita `90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md` (no existeix) i mana llegir l'arxiu que `QUI_SOC §6` prohibeix llegir. §2 diu "aplica els principis matemàtics descrits a `sdp-workflow/SKILL.md`" (autoreferència; volia dir `sdp-pedra-seca`: rastre del renom). §1 cita `04_ESCRIPTORI/00_INDEX_ESCRIPTORI.md` (majúscules). |
| `wiki-busca-skills` | 2.501 | no | **FUSIONAR AMB `sdp-workflow` §0** | Correcta i curta; és un pas del workflow, no una skill. |
| `wiki-cicle-de-vida` | 13.826 | no | **RETALLAR a ≤ 4 KB** | La més llarga i la més contradictòria: dues "Secció Original", tres polítiques de neteja (Avaluador → arxiu/aprén/esborra; "Dormir = neteja extrema, esborrar-ho tot"; "l'Escriptori pot contindre arxius"). Cita `tractor-antitailwind.mjs` (no existeix). "Termòmetre dels 150" que ningú executa. "Filosofia del Temps" (un paràgraf de lírica). Mesurar "temps exacte de sessió" sense rellotge. §9 llista de tractors: útil, però és Wiki (`02_saber/maquina`), no procediment. |
| `wiki-documentacio-i-reflex` | 4.877 | sí | **ESMENAR (P0) i retallar** | R1. "Les Tres Pedres" numerades 1, 2, 5. §5 Olivera triplicat. §2 taxonomia MACRO/MICRO (l'acta `260920_0235` prohibeix `MACRO_` per a locals; ací es manté per a externs: correcte, però cal dir-ho en una sola frase). |
| `wiki-guardia-frontmatter` | 1.495 | no | **FUSIONAR AMB `wiki-documentacio-i-reflex`** | Diu "ISO v2.1" (l'esquema és `tooling/wiki/schema.json`, sense versió). "Resolta a través d'este fitxer" copia una frase del router. Posa l'esquema per damunt del Mestre (Codex ja ho va dir): la regla bona és "no esborres frontmatter en silenci", no "desobeeix el Mestre". |
| `wiki-propagar-veritat` | 2.343 | no | **REESCRIURE** | R7. Ha de prohibir el `sed` cec i exigir: llista en sec (`grep -l`), exclusió de LEDGER/actes/cites, revisió fitxer a fitxer, i mai tocar `90_arxiu_historic`. |

**Proposta de mapa: 17 → 9 skills.** Pes objectiu de les `core`: ≤ 12 KB en total (hui 48 KB).

| Nova skill | Absorbeix | Tipus |
|---|---|---|
| `core-identitat` (≤ 1 KB: "ets MarIA, llig QUI_SOC, gallet cultural") | — | core |
| `core-context-panic` (+ Cuestióname) | — | core |
| `core-consell` (rols, macro/micro, Arquitecte/Executor, handoff) | `core-consell-i-colmena` | core |
| `core-memoria-historica` (registre de lliçons datades, 1 línia cadascuna) | lliçons de les actes | core |
| `core-restauracio-segellada` | — | per disparador |
| `sdp-pedra-seca` | — | per disparador (disseny) |
| `sdp-universal-page` | `sdp-app-grid-shell` | per disparador (React/UI) |
| `sdp-workflow` (obrir torn, PRD, portes, tancar, dormir, caçar skills) | `wiki-cicle-de-vida`, `wiki-busca-skills` | core |
| `wiki-documentacio-i-reflex` (plantilles per router, frontmatter, propagar veritat amb seguretat) | `wiki-guardia-frontmatter`, `wiki-propagar-veritat` | per disparador (escriure a la Wiki) |
| → Wiki `02_saber/producte/casos_us.md` | `sdp-casos-us-essencials`, `sdp-calendari-agricola` | document |
| → Wiki `02_saber/maquina/tractors.md` | `wiki-cicle-de-vida §9` | document |
| `sdp-estudi-mercat` | — | per disparador (necessita web) |

Preguntes que grinyolen (`requires_human_decision: true`):
1. `PROTOCOL_PETORRETA.md` (92 línies: leases, HMAC, nonces, `claim`) l'ha usat de veritat algú més que Codex el 19/09? Si només Codex, és un tractor de luxe per a un sol arnés. Simplificar a "segell de plantilla + segell de restauració" (§5) o mantindre'l tal qual?
2. La "Regla Sagrada" d'enumerar les 12 IAs sempre que es parle del Consell: vols que continue sent obligació de prosa (que ja s'incompleix en 4 fitxers) o que siga només `consell.json` + una comanda que funcione?
3. `core-identitat` és per a Antigravity el que `CLAUDE.md` és per a mi. Si Antigravity carrega `.agents/skills/*` amb `core: true`, cal saber-ho amb certesa: **cap fitxer del repositori demostra com Antigravity carrega les skills**. Necessite que el Mestre confirme amb la documentació d'Antigravity si llig `.agents/rules/`, `.agents/skills/` i `.agents/hooks.json`, o si tot açò és una convenció nostra que cap arnés honora.

## 4. Tractors Cognitius: com forçar la lectura de veritat

Principi (ja escrit a l'acta `260920_0535` i no aplicat): **una regla textual no és un tractor**. Un tractor és una cosa que passa fora del model, abans o després que escriga, i que falla tancat. Sis peces, de menys a més força:

**T1 · Un sol text d'entrada, generat, idèntic per als tres arnesos.**
`QUI_SOC.md` és la font. Un script (`cataleg_skills.mjs` ja regenera `manifest.yaml` i `00_INDEX_SKILLS.md`; que regenere també) escriu `CLAUDE.md`, `AGENTS.md` (arrel, per a Codex) i `.agents/rules/00_constitucio.md` (per a Antigravity) com a **còpies literals** amb el hash de `QUI_SOC` al peu. Una porta (`porta:cataleg` o nova `porta:constitucio`) falla si divergeixen. Esborrar `BIOS.md`, `BOOTSTRAP.md`, `BASELINE.md`, `.agents/AGENTS.md` (BASELINE cap dins de QUI_SOC §5, ja hi és). Cost: 1 hora. Efecte: R4 desapareix.

**T2 · Les skills al lloc on cada arnés les busca.**
Claude Code llig skills de projecte a `.claude/skills/<nom>/SKILL.md` i les ofereix per l'eina `Skill` (hui este projecte no me n'ofereix cap: la llista només té les d'Anthropic). Antigravity, a `.agents/skills/`. Codex, només `AGENTS.md`. Proposta: `.agents/skills/` continua sent la font; `cataleg_skills.mjs` crea enllaços simbòlics a `.claude/skills/` i afig a `AGENTS.md` (arrel) la taula "quan → llig quina skill". Així el tractor és l'arnés mateix, no un script nostre que ningú crida. Verificar (Mestre): si Codex admet un directori de skills, fer-hi el mateix.

**T3 · Porta de plantilla fail-closed (la REGLA 0 convertida en màquina).**
Un hook `PreToolUse` sobre escriptura (Claude: `.claude/settings.json` amb `Write|Edit`; Antigravity: `hooks.json` si de veritat el llig; git `pre-commit` com a última xarxa per a tots) que executa `tooling/gates/porta-plantilla.mjs`:
- si el fitxer destí és `_wiki_de_poble/04_escriptori/*.md` i el seu frontmatter és `type: petorreta|prompt|informe|acta`,
- exigeix una línia `Plantilla: <id del router> sha256:<12 primers hex de la plantilla resolta pel router>`,
- i que el frontmatter tinga exactament les claus de la plantilla.
Sense la línia, l'escriptura es bloqueja amb el missatge "llig `<ruta de la plantilla>` i torna". El hash demostra lectura del fitxer viu, no comprensió (límit honest, ja dit a `preflight_matrix_wrapper.mjs`). Este informe porta la línia al §0 en forma de prosa; amb la porta, seria obligatòria i comprovable.

**T4 · Porta de fantasmes.**
Diccionari de noms morts (`00_PLANTILLA_PROMPT_CONSELL`, `00_PLANTILLA_PROMPT_ISO`, `01_PLANTILLA_PROMPT_INTERN`, `socdepoble-workflow`, `skill-iaia-identitat`, `identity-iaia-core`, `03_govern`, `00_core_wiki`, `05_Escriptori_Soc_de_Poble`, `04_ESCRIPTORI`, `07_plantilles`, `tractor-antitailwind`, `tractor-frontissa`, `trellat-rules.json`…: la llista completa ix d'este informe, §6). `porta:doctrina` (ja existeix `doctrina-ignora.txt`; cal veure si és açò) falla si un fitxer viu de `.agents/` o de la Wiki els cita. Sense esta porta, cada renom deixa cadàvers que el model ressuscita.

**T5 · Context curt o no hi ha context.**
Hui, si el router funcionara, injectaria 48 KB de skills `core` + 3 constitucions + plantilla a cada torn. Un model amb 60 KB de normes davant les llig en diagonal: eixa és la "febre" real, no els 150 artefactes. Regla: `core` ≤ 12 KB en total; la resta per disparador; `wiki-cicle-de-vida` i `sdp-universal-page` (27 KB entre les dues) mai `core`.

**T6 · Rebut de lectura obligatori a cada lliurable.**
Secció `## 0. Rebut de reflex` (com la d'este informe) exigida per les plantilles `prompt_local`, `acta` i `informe`: plantilla llegida (ruta + hash), skills llegides, fitxers de l'Escriptori llegits. T3 la comprova. Sense rebut, el document no naix.

Què **no** propose: un altre script de context (ja n'hi ha tres: `matrix.mjs`, `context_documental.mjs`, `preflight_matrix_wrapper.mjs`) ni una llei nova a `QUI_SOC`. Primer que les portes que existeixen s'executen; després, si cal, se n'escriu una.

## 5. Estructura d'enllaços

Mesura (script propi sobre els 105 fitxers vius): **7 wikilinks trencats**, **16 ambigus** (tots per `[[00_index_identitat]]`, que existeix dues vegades: un fitxer arrel de 2 línies i un a `02_saber/` de 85), **9 orfes** (entre ells la petorreta d'esta nit i l'informe de Codex 1014), **10 fitxers amb marcador `BROKEN LINK … TODO: fix link`** dins del text, **26 fitxers amb `\n#` literal** com a primera línia del cos (residu d'un script de migració), **6 hubs buits** (`coneixement`, `govern`, `graf`, `identitat`, `maquina`, `00_index_maquina`), i `00_index.md` que mescla `[[nom]]` amb `[[ruta/fitxer.md]]` i secció "Actes (260809–260813)" amb actes del 15 al 18.

Sis regles per refer-ho (totes comprovables amb `porta:orfandat`/`porta:llaurador` si s'executen):
1. **Un nom base, un fitxer.** Esborrar l'`00_index_identitat.md` de l'arrel i l'`00_INDEX_Actes.md` de 3 línies; l'índex d'actes el genera el llaurador a `10_actes/00_index_actes.md`.
2. **Wikilinks només per nom base**, mai `[[carpeta/fitxer.md]]`. Obsidian i el nostre resolutor ja treballen per nom.
3. **Els índexs enllacen; els documents no s'ancoren a si mateixos.** Eliminar els peus "Ancoratge de Seguretat", "Sinapsis", "Relacionat", "Categoria" (≈45 fitxers, ≈135 línies de soroll). Un enllaç dins del cos només quan aporta significat ("segons l'ADR-2026-08"). L'ancoratge és responsabilitat de l'índex del pilar, i la porta d'orfandat ho comprova.
4. **Un índex per pilar** (`00_index_ser`, `00_index_saber`, `00_index_actuar`, `00_index_escriptori`, `00_index_actes`) i `00_index.md` arrel amb només eixos cinc + `ESTAT`. Res d'"Adopcions" ni "Orfes heretats" a mà.
5. **Marcador `BROKEN LINK`: es resol o s'esborra**, mai es deixa com a prosa. Els 8 `protocols_tecnics/` porten el mateix peu trencat idèntic.
6. **Les plantilles no enllacen a res** llevat de la seua secció `## Vincles`; les 6 amb bloc "LOGOS OFICIALS" i peu triplicat es netegen.

## 6. Auditoria del Trellat a la Wiki

### 6.0 Correccions a les troballes dels agents (refutació)
- `02_saber/00_index_maquina.md` **sí existeix** (7 línies, només frontmatter): el veredicte és "buit", no "inexistent".
- `_arxiu_wiki_de_poble/` **existeix fora del repositori** (`Som de Poble/_arxiu_wiki_de_poble`), com diu `core-memoria-historica §4`. No és una ruta fantasma; és externa.
- El router **existeix** a `tooling/brain/matrix.mjs` (no a `tooling/matrix.mjs`); `tooling/gates/obrir_torn.mjs` també. Els veredictes sobre l'acta `260920_0535` i `wiki-cicle-de-vida §1` queden matisats.
- La resta d'afirmacions que he pogut contrastar (doble frontmatter, 6 LOGOS, 3 actes amb `PROMPT_ISO`, Dexie absent de `src/` i `package.json`, decisions òrfenes) es confirmen.

### 6.1 `01_ser` (5 fitxers)
| Fitxer | Veredicte | Motiu |
|---|---|---|
| `00_bios.md` | ESBORRAR | Làpida: redirigeix a `AGENTS.md` i a `identity-iaia-core` (mort). Frontmatter i cos es contradiuen sobre on és el BIOS. |
| `01_identitat.md` | MANTINDRE | Dens i correcte. Cita `02_saber/GLOSSARI.md` (no existeix). |
| `02_genotip.md` | MANTINDRE, retallar | "9 lleis" i n'hi ha 10. Bloc Sinapsis. |
| `03_equip_ia.md` | FUSIONAR | Només un transclude `![[agents_equip_ia]]`. Tags fora d'enum ("12 petorretas"). |
| `agents_equip_ia.md` | ARXIVAR | Cens narratiu de 12 xats web. Sense frontmatter. `consell.json` és la font. |

### 6.2 `02_saber` (50 fitxers, 3.577 línies; ≈28% eliminables)
**Mantindre (els 8 que aguanten el pes):** `00_arquitectura_tecnica_unificada` (retallar pilars `00_SER…03_GOVERNAR`), `01_trellat`, `doc_governanca` (cita `socdepoble-workflow` i `03_govern`, morts), `sdp_lock`, `llei_05_privacitat`, `self_repair`, `seguretat_execucio`, `ADR-2026-08-ONLINE-FIRST` (però `status: esborrany` i `tags: escriptori` per a una ADR acceptada; remet a una acta NLnet en ruta inexistent).
**Mantindre amb esmena:** `00_visio_i_pilars`, `connexio_radical`, `estandard_integracio_react` (LLEI 2 diu `.sdp-root`, LLEI 3 diu Shadow DOM; promet `vite-plugin-pwa` retirat per l'ADR), `identitat_visual` (sense hex; la font real és `src/config/design-tokens.json` i cap document la nomena), `a11y_seo_trellat`, `sistema_immunitari` (5 `BROKEN LINK` dins d'exemples de codi), `ADR-2026-09-SOLLUTIA-MODEL-B` (cites a `client.js:16` inexistent), `260913_0635_arquitectura_perfil_universal` (segell termodinàmic en un pilar estable, contra la Llei 8 del genotip), `pla_director_legal` (terminis d'agost–octubre 2026 ja caducats), `pla_director_viabilitat`.
**Retallar fort:** `estandard_ui_universal` (267 línies; 240 són annex "no normatiu" amb scripts i CI inexistents i acaba recomanant Tailwind després de prohibir-lo), `soci_sollutia` (233 → 60), `auditoria_canonica` (imposa 13 pilars fantasma i mana verificar que els scripts existisquen mentre cita `03_govern/`), `successio_lazaro_execucio`, `03_consola_termodinamica` (basa llindars en `scripts/rules/trellat-rules.json`, inexistent), `index_trellat` (fórmula sense instrument; prescriu `estat`/`tipus` contra l'esquema real), `perfil_psiquiatric` (40 línies de metàfora: UDR/IFT que `sdp_lock` declara no implementats), `llibre_blanc_produccio_pedra_seca` (recomana Tailwind i Radix), `doc_logos_oficials` (només placeholders `{ruta_logo}`), `sgq_prompts` (remet a plantilla morta; únic fitxer sense tags).
**Arxivar (doctrina vetada o no implementada):** `contingencia_offline` (97 línies de Dexie/CRDT/SW vetades per l'ADR), `arquitectura_sistema_nervios`, `arquitectura_la_forja`, `arquitectura_protocol_lazaro`, `futur_adaptacio`, `forja_to_core` (53 línies per dir "no està implementat"), `anatomia_cognitiva`, `antigravity`, `connectors_mcp_disseny` (eines "hipotètiques"), `core_registre_automillora` (ja `arxivat`; frase "es consolida la mort de l'arquitectura Online-First. L'arquitectura passa a ser Online-First": rastre del `sed`).
**Esborrar:** `coneixement`, `govern`, `graf`, `identitat`, `maquina`, `00_index_maquina` (hubs buits), `doc_taula_mestra` (query Dataview sobre `03_govern`), `obsidian_plugins/plugins.md` (222 línies en anglés: el catàleg de plugins d'Obsidian, 6% del corpus) i `homepage.md`.
**Fusionar:** `el_projecte` → `00_visio_i_pilars` (i diu que Dexie/PWA són baseline: fals); `00_index_identitat` (85 línies, promet 4 pilars i en llista 3) → `00_index`.

### 6.3 `03_actuar` i plantilles (14 fitxers)
- `prompt_consell.md` i `prompt_local.md`: **doble frontmatter** (dos blocs `---` en 16 línies: el fitxer diu `type: plantilla` i `type: petorreta` alhora). Qualsevol parser llig el primer i ignora el segon; el model copia el segon. Solució: el bloc a copiar va dins d'un tancat de codi (com feia la plantilla vella del `.sdp-reflex`, que en açò tenia raó).
- `pla.md` (encaminada per `planificacio`) és retòrica; `pla_implementacio.md` (la bona, la que MarIA usa) **no està al router**. Qui demane "pla d'implementació" rep la plantilla equivocada. `bundle.md` tampoc està al router i cita `crear_bundle.mjs` sense ruta (viu a `tooling/brain/`; l'eina que les actes usen és `scripts/generate-bundle-v4.sh`).
- Router: la ruta `skill` té les claus `agent` i `trellat`; la ruta `estudi_ia`, `informe`; `prompt.local`, `local`. Són paraules omnipresents: qualsevol frase amb "trellat" cau a `skill.md`. `onUnknown: "error"` conviu amb un `default`. Cap ruta per a `handoff`/`relleu` cap a `prompt_local` ("relleu" va a `acta`).
- `doc_to_app.md`: ARXIVAR (miniapps HTML pur amb `data.json`, contra React+Vite+Supabase). `skill.md`: mana actualitzar plantilles a `07_plantilles/` (no existeix) i cita `version_semver` que cap frontmatter usa. `brainstorming`, `branding`, `produccio`, `pla`, `skill`, `doc_to_app`: bloc "LOGOS OFICIALS" idèntic ×6 i peu triplicat; `branding` defineix la paleta dues vegades dins del mateix fitxer.
- `acta.md` (la millor: `decisions_clau`/`blockers` llegibles per màquina) està `status: esborrany`; `estudi_consell.md` (densa i útil) té `status: actiu`, valor que cap altra plantilla usa.
- `00_index_actuar.md`: MANTINDRE (diu bé que el codi viu fora de la Wiki).

### 6.4 `10_actes` (19 actes): decisions vigents que només viuen ací
Comprovat amb `grep` a `.agents/skills`, `01_ser` i `02_saber`: **zero coincidències** per a cadascuna. Són coneixement que el Cervell no té:
1. **Marca OEPM M4392826, suspens de forma, termini 21/10/2026** (`260921_1002`): risc legal real, només a una acta. → `ESTAT` + `02_saber/pla_director_legal`.
2. **Llicència AGPLv3** (`260915_1410`): només al pla econòmic. → `01_ser/01_identitat`.
3. **Els "5 manaments de Z"** ("la quarantena no es llegeix", "allò generat no és evidència") (`260916_0540`): l'acta mana traslladar-los a `core-memoria-historica` i no s'ha fet.
4. **`CampUniversal` polimòrfic + derrocar `UniversalEditorShell`** (`260918_1436`) → `sdp-universal-page`.
5. **Regla de Delegació per Esgotament** (`260919_1945`) i **Arquitecte vs Executor** (`260921_1002`) → `core-consell`.
6. **Prohibició de `MACRO_` per a IAs locals** i "`protocolledge.json` són obligacions mecàniques" (`260920_0235`) → `wiki-documentacio-i-reflex`.
7. **Diagnòstic "una regla textual no és un tractor"** (`260920_0535`) → `QUI_SOC §4`.
8. **Migració `tipus/estat → type/status`** (`260917_2349`): és l'estàndard vigent i només consta en una acta (i `index_trellat` prescriu el vell).
9. **Port 3340 del dev server** (`260920_0800`): només a `.claude/launch.json`.
Actes esborrables/arxivables: `260915_0325` (4 bugs de UI resolts), `260914_2257`, `260917_0435`; `260915_0717` i `260915_0823` citen `00_PLANTILLA_PROMPT_ISO` com a obligatòria (vector de reinfecció: arxivar amb nota). `260914_2359` conté "fractura entre Online-First i Online-First" (rastre del `sed`). `260916_0645_ACTA_sincronitzacio_disseny` no és acta (`type: document`): és un TODO obert de `branding.md`.

### 6.5 Contradiccions transversals (les que el model llig el mateix dia)
1. PWA/Dexie/Service Worker: retirats per l'ADR-2026-08; descrits com a vigents a `el_projecte`, `arquitectura_la_forja`, `contingencia_offline`, `estandard_integracio_react`. (Codi: Dexie no és a `src/` ni a `package.json`.)
2. Tailwind: prohibit a `estandard_ui_universal` i `perfil_psiquiatric`; recomanat a `llibre_blanc` i al propi annex d'`estandard_ui_universal`; l'acta `260915_1410` permet `flex`/`grid`.
3. Taxonomia de pilars: 4+2 (`00_arquitectura`, `successio_lazaro`), 13 (`auditoria_canonica`), 5 (`core_registre`), i el disc en té 6 amb altres noms.
4. Neteja de l'Escriptori: tres polítiques a `wiki-cicle-de-vida`, una quarta a `core-identitat` (Destins), una cinquena a `AGENTS §12`.
5. Font del color: quatre documents, cap nomena `design-tokens.json`.
6. Font del Consell: cinc llocs (R5).
7. Punt d'arrencada: `QUI_SOC` / `AGENTS` / `BIOS`→`BOOTSTRAP` / `.agents/rules` (R4).

## 7. Taxonomia de tags

Estat: 37 tags distints en 105 fitxers; l'enum de `schema.json` en té 13; **24 estan fora** (incloent-hi tags amb espais com "Successió Lázaro", "Self Repair", "12 petorretas", i els quatre de la petorreta d'esta nit: `auditoria`, `brain`, `skills`, `trellat`). `maquina` (22), `identitat` (18), `core` (18), `saber` (17), `genoma` (16) són els més usats i **no diuen res**: `core/genoma/identitat` van sempre junts en 16 fitxers (són un sol tag en tres paraules), `saber` i `maquina` repeteixen la carpeta, `escriptori`/`temporal` repeteixen la ubicació.

Regla: **el `type` diu què és, la carpeta diu on viu, el tag diu de què parla.** Un tag que repeteix el `type` o la carpeta és soroll. Proposta d'enum tancat (12), 1–3 tags per fitxer:

| Tag | De què parla |
|---|---|
| `identitat` | missió, veu, Trellat, qui som |
| `govern` | lleis, protocols, jerarquia de veritat |
| `arquitectura` | codi, React, Vite, integració |
| `disseny` | Pedra Seca, UI, tokens |
| `dades` | Supabase, RLS, migracions, privacitat |
| `portes` | tractors, gates, cadena, CI |
| `cervell` | Wiki, skills, plantilles, memòria, RAG |
| `consell` | IAs, petorretas, handoff, rols |
| `producte` | casos d'ús, funcionalitats, calendari |
| `legal` | marca, llicència, subvencions |
| `sollutia` | el soci i el seu backend |
| `revisar` | únic tag de procés: "algú ho ha de mirar" |

Es retiren: `core`, `genoma`, `saber`, `maquina`, `escriptori`, `temporal`, `graf`, `acta`, `marmota`, `log`, `skills`, `plantilla`, `pla` i tots els de forma lliure. Migració: un script en sec que imprimeix `fitxer | tags actuals → proposats` per a revisió humana (Lliçó 8 de la memòria històrica: la màquina no decideix semàntica). Imposició: `porta:frontmatter` amb el pany de l'esquema resegellat (hui és inert: P0-2 del matí, continua obert).

## 8. Integració de l'R+D de l'Acta Marmota

**Handoff inter-IA (Petorretas clares).** El handoff ja existeix: és `prompt_local.md`. Falta que siga *estructurat*. Afegir-li quatre seccions obligatòries i curtes: `## Objectiu` (una frase), `## Decisions preses` (cadascuna amb ruta d'evidència), `## Bugs pendents`, `## Instruccions de continuació` (què fa la següent IA en el primer minut), més el `## 0. Rebut de reflex` de T6. Registrar-la al router com a `handoff` amb claus `handoff`, `relleu`, `continua`, `passa-li a`. Sense `MACRO_`/`MICRO_` (acta 0235). Una plantilla, no tres.

**Cuestióname (no suposar, preguntar).** Ja és el cas 3 de `core-context-panic` ("pregunta madurativa"). Formalitzar-lo com a **cas 4: ambigüitat material**, amb format tancat perquè no es convertisca en un interrogatori: màxim 3 preguntes, cada una amb la resposta que jo assumiria si el Mestre no contesta, i seguir treballant en tot el que no depén de la resposta. Mecànicament: `prompt_local.md` i `pla_implementacio.md` porten `## Preguntes obertes`, que ha d'existir (pot dir "cap") i T3 ho comprova. Este informe l'aplica al §3 i al §9.

**Sirena de Models (Arquitecte vs Executor).** Codificar-ho on la màquina ho puga llegir: `consell.json` amb `rol_local: "arquitecte" | "executor"` per membre, i un camp `Mode: Auditoria | Execució` a la taula de Registre de `prompt_local`. En mode Auditoria, l'única escriptura permesa és l'informe (Contenció Absoluta, ja escrita). En mode Execució, el prompt ha d'enllaçar un `pla_implementacio` present a l'Escriptori; si no hi és, la IA no executa: pregunta. Esforç cognitiu alt reservat a skills i arquitectura (ja a l'acta): és una decisió del Mestre en triar el model, no una regla per al text.

**Human-in-the-loop (Portes Roges).** No cal un mecanisme nou: `core-restauracio-segellada` ja té el patró correcte (inspecció → presentació literal del que es perd → espera de torn → aplicació amb CAS). Generalitzar el *patró* (no el codi) a tota operació de risc alt segons `PROTOCOL_PETORRETA P-02` (> 5 fitxers, `.agents/`, esborrats): declarar l'operació, mostrar la llista exacta, acabar el torn, aplicar només amb un sí posterior a la llista. La pregunta 1 del §3 decideix si el lease criptogràfic sobreviu o se substitueix per este patró.

## 9. Preguntes obertes al Mestre (`requires_human_decision: true`)

1. **Constitució única (T1):** acceptes esborrar `.agents/AGENTS.md`, `BIOS.md`, `BOOTSTRAP.md`, `BASELINE.md` i que `CLAUDE.md`, `/AGENTS.md` i `.agents/rules/` siguen còpies generades de `QUI_SOC.md`? Si no contestes, assumiré que sí però no ho executaré: és canvi a `.agents/`, risc alt.
2. **Antigravity:** llig de veritat `.agents/rules/`, `.agents/skills/` (amb `core: true`) i `.agents/hooks.json`? Cap fitxer del repositori ho demostra. Sense esta resposta, T2 i T3 es construeixen a cegues per a l'Executor principal.
3. **17 → 9 skills** i trasllat de casos d'ús i calendari a la Wiki: acceptat? Assumpció per defecte: sí.
4. **`PROTOCOL_PETORRETA` (lease/HMAC):** mantindre o simplificar al patró de segell (§8)? Assumpció per defecte: mantindre fins que T3 estiga en marxa; després decidir.
5. **Esborrats a la Wiki** (~1.000 línies de `02_saber`, 6 hubs buits, `plugins.md`, 3 actes): esborrar del repositori o moure a `_arxiu_wiki_de_poble` extern? Assumpció per defecte: extern, reversible.
6. **Residus a `.sdp-reflex/bootstrap/`** (10 sessions amb plantilles velles, fora de git): netejar-los i que la skill del Reflex apunte només al router? Assumpció per defecte: sí, és el vector R1.
7. **OEPM M4392826 (termini 21/10/2026):** vols que conste a `ESTAT.md` en cap, com a recordatori que arranca cada sessió? Assumpció per defecte: sí, ho farà MarIA al seu Pla.

## 10. Pla d'implementació proposat (per al Pla de MarIA; ordenat; sense executar)

1. **R1:** `wiki-documentacio-i-reflex §1` passa a dir: "resol la plantilla amb `.agents/protocolledge.json`; mai una ruta literal". Esborrar `.sdp-reflex/bootstrap/*` (fora de git). (10 min)
2. **R2:** `AGENTS.md` REGLA 0 i `prompt_sgq.mjs:8` apunten al router, no a un nom. (10 min)
3. **T1:** `QUI_SOC` única; generar `CLAUDE.md`, `/AGENTS.md`, `.agents/rules/00_constitucio.md`; retirar les altres quatre; repuntar `manifest.yaml` i `context_documental.mjs` GLOBALS. (1 h) — *decisió 1*
4. **T3:** `tooling/gates/porta-plantilla.mjs` + hook a `.claude/settings.json` (Write/Edit) + `pre-commit`. Provar amb un prompt sense rebut: ha de fallar. (2 h)
5. **Plantilles:** arreglar el doble frontmatter de `prompt_consell`/`prompt_local` (bloc dins d'un tancat de codi); afegir `pla_implementacio` i `handoff` al router; llevar `agent`/`trellat`/`informe`/`local` de les claus; arxivar `doc_to_app`; netejar LOGOS ×6 i peus. (1 h)
6. **Skills 17 → 9** (§3): fusions i retalls; `core` ≤ 12 KB; `wiki-propagar-veritat` reescrita amb prohibició de `sed` cec; `core-consell §5` fora (estat → `ESTAT`); comanda del cens arreglada (`membres.map(m=>m.nom)`). Regenerar catàleg, índex i segell. (3 h) — *decisió 3*
7. **T2:** enllaços a `.claude/skills/` i taula de disparadors a `/AGENTS.md`. (30 min) — *decisió 2*
8. **Decisions òrfenes (§6.4):** nou lloc a skills/Wiki; OEPM a `ESTAT`. (1 h)
9. **Wiki:** esborrar/arxivar segons §6 (extern, reversible); llevar 26 `\n#`, 10 `BROKEN LINK`, 45 peus d'ancoratge, 12 Sinapsis; un índex per pilar. (3 h) — *decisió 5*
10. **Tags:** enum de 12 a `schema.json`, script en sec de migració, revisió humana, resegellar el pany, `porta:frontmatter` viva. (2 h)
11. **T4:** `porta:doctrina` amb el diccionari de noms morts. (1 h)
12. **Verificació:** `npm run porta` sencer; `cataleg --check`; el diari ha de mostrar un `matrix.rebut` nou o, si Antigravity no crida el wrapper, retirar `matrix.mjs`/`preflight_matrix_wrapper.mjs` i dir-ho al LEDGER. Un tractor que no s'executa mai és pitjor que cap: fa creure que hi ha protecció.

## 11. Per al torn 2 (Codex): què refutar primer

- R3: comprova al teu arnés si `hooks.json` s'ha executat mai (busca rastre a `.agents/.diari_sessio.jsonl` o a `porta-reflex.mjs`). Si trobes una execució posterior al 19/09 23:03, R3 cau.
- T2: confirma si Codex admet skills de projecte; si no, `AGENTS.md` arrel és el teu únic tractor i T1 és encara més urgent.
- §7 tags: si creus que `core`/`genoma` porten informació que jo no veig, digues quina consulta els necessita.
- §3 `PROTOCOL_PETORRETA`: tu l'has usat (sessió `94f57f9e`, 19/09). Val el que costa?
- §6.4: verifica que les 9 decisions òrfenes no viuen a `90_arxiu_historic` en un fitxer que jo no he llegit (no he obert l'arxiu llevat dels dos documents del cicle matinal, per la prohibició de `QUI_SOC §6`).

## 12. Límits d'este informe

- No he executat la cadena de portes ni el Reflex (`doctor`); em base en la memòria del matí (`npm run porta` mor a la porta 3; `porta:reflex` exit 1) i no l'he tornat a comprovar a la nit.
- Els veredictes fitxer a fitxer de la Wiki els han llegit dos agents; jo he refutat per mostreig (13 comprovacions, 3 falses corregides), no cada frase. Els percentatges (≈28% eliminable) són estimació d'agent, no mesura.
- No sé com Antigravity carrega `.agents/`. Tot el que dic de T2/T3 per a Antigravity és condicional a la decisió 2.
- Cap puntuació és telemetria: el 4/10 és judici professional, coherent amb el del matí i amb el de Codex.

## 13. Reunió davall l'Olivera: contrast amb el Pla de MarIA (20:01) i l'auditoria de Codex (20:05)

### 13.1 El Pla de MarIA: la causa que proposa no hauria evitat el cas
El Pla diu que el lloro ve de "el RAG/Compilador elimina metadades i no filtra per `status`", i proposa un filtre `status: canonic`. **Refutat amb evidència:** la plantilla que va ressuscitar (`.sdp-reflex/bootstrap/f05cc024…/00_PLANTILLA_PROMPT_CONSELL.md`) té `status: canonic` a la línia 3. Un filtre per estat l'hauria deixada passar. La causa és R1 (ruta literal a un fitxer de sessió) i R2 (nom mort a la REGLA 0), no el filtre. El filtre del RAG és una bona mesura (ja era P1 de Codex al matí) però és una altra malaltia.

Tres esmenes més al Pla:
- La proposta 2 ("Tractor Cognitiu que obligue tots els arxius a un esquema, Porta Roja") **ja existeix**: és `porta:frontmatter` amb `tooling/wiki/schema.json`. No s'executa perquè el pany de l'esquema no està resegellat (P0-2 del matí, encara obert). No cal un tractor nou; cal que el que hi ha arranque.
- El propi Pla viola l'esquema que vol imposar: `type: pla_implementacio` no és a l'enum de `type`, i els tres tags (`brain`, `auditoria`, `trellat`) són fora de l'enum. La petorreta 1940 (4 tags fora), la 2010 (3 fora) i l'informe de Codex (3 fora) també. **Quatre documents nous, els quatre fora d'esquema, en un cicle dedicat al frontmatter.** Això no és culpa de ningú: és la prova que sense porta executada, la regla escrita no aguanta ni una nit.
- La proposta 3 (neteja només després d'Avaluació) està bé, però ha de retirar les altres dues polítiques (`Dormir = neteja extrema` a `wiki-cicle-de-vida §8` i la Llei de Destins a `core-identitat`), no afegir-ne una tercera damunt.

### 13.2 Codex: cinc afirmacions verificades, cinc confirmades
| Afirmació de Codex | Verificació meua | Resultat |
|---|---|---|
| El resolutor tria per `claus` i ignora `quan` | `context_documental.mjs:53`: `data.rutes.filter(row => row.claus.some(...))`; cap lectura de `row.quan` | **CONFIRMAT** |
| `DESTINS_CANONICS` diu `00_Bandeja_d_Entrada`, el disc té `00_bandeja_d_entrada`, i el catàleg bloqueja | `cataleg_skills.mjs:23` llança "Capitalització no canònica"; `ls` mostra minúscules; `DESTINS_CANONICS.json:4` majúscules | **CONFIRMAT** (i és un bloquejador potencial de qualsevol escriptura amb hook) |
| `branding.md` assigna el taronja a botons primaris; `sdp-pedra-seca` el blau | `branding.md:57`: "Taronja principal per a identitat i **botons primaris**"; `sdp-pedra-seca §2`: `--sdp-accio` blau primari | **CONFIRMAT** |
| El schema només exigeix `description` | `required: ["description"]` | **CONFIRMAT** (jo ho tenia com a dada, no com a troballa: Codex té raó que és una contradicció amb `auditoria_canonica` i `wiki-guardia-frontmatter`, que exigeixen tres camps) |
| 24 fitxers amb `\n#` literal | Jo en compte 26 (incloc `.agents/skills`) | **CONFIRMAT** (diferència d'univers) |

Convergència independent: Codex i jo hem arribat per separat a R1 (UUID fix al Reflex), R4 (autoritats incompatibles), la contradicció de destins, `wiki-propagar-veritat` corrupta, `core-consell` amb quotes, i el trasllat de casos d'ús i calendari a producte. Quan dos auditors sense contacte troben el mateix, la probabilitat que siga cert puja.

### 13.3 On discrepe de Codex
1. **"Evitaria una fusió gegant."** D'acord en el fons, però el problema de context no és el nombre de fitxers sinó quants són `core: true` (7 skills, 48 KB). El meu mapa 17→9 no fa cap skill més gran: fusiona per disparador (les dues de UI, les tres de Wiki) i **trau de `core`** tot el que no siga identitat, pànic, consell i workflow. Si Codex prefereix `sdp-app-grid-shell` separada, cap objecció, sempre que no siga `core`.
2. **`core-context-panic`: "dos errors no obliguen a canviar de xat".** Accepte la meitat: el cas 1 (bucle) ha de dir "atura't, conserva evidència, prepara relleu", i el canvi de xat és una opció que el Mestre tria, no una ordre. La plantilla de pànic es queda: és l'única cosa del Cervell que funciona sense tractor perquè és curta.
3. **"Retirar l'obligació d'escriure una regla després de qualsevol correcció"** (`CLAUDE.md`, Reflex de Correcció). No la retiraria: és una ordre explícita del Mestre. El que la petorreta 2010 demana és precisament el contrari: que aprendre siga **obligatori però declarat** ("Mestre, ho incloc a la skill X, secció Y, per Z") i bloquejat si no es declara. Codex i la petorreta convergeixen en el "declarat"; discrepen en l'"obligatori". És decisió del Mestre; jo estic amb la petorreta.
4. **Cuestióname 1 de Codex: "Wiki original i skills generades?"** La petorreta ho decideix ("si no està a la Wiki, no existeix"), però els arnesos busquen skills en rutes concretes (`.agents/skills`, `.claude/skills`). Solució que satisfà les dues: les skills viuen físicament a `_wiki_de_poble/03_actuar/skills/<nom>/SKILL.md` (la Wiki és l'original) i `.agents/skills` i `.claude/skills` són enllaços simbòlics o còpies generades pel catàleg amb hash. Un origen, tres projeccions, una porta que comprova que no divergeixen (T1/T2).
5. **Cuestióname 2 de Codex: "MarIA executora exclusiva?"** L'Acta 1002 ja ho ha decidit (Sirena: Codex/Claude arquitectes, Antigravity executor). No cal reobrir-ho; cal codificar-ho (§8, `rol_local` a `consell.json` i `Mode` al Registre).

### 13.4 La petorreta 2010 (Tractor d'Aprenentatge), en dos paràgrafs, ja que és a la taula
No és el meu encàrrec d'esta nit, però encaixa amb el que ja he dissenyat: el Tractor d'Aprenentatge és **T6 aplicat a les skills**. Abans d'escriure a qualsevol `SKILL.md`, la IA emet al xat i al LEDGER una línia amb format tancat: `APRENC → <skill>/<secció> | motiu: <10 paraules> | data`. Un hook `PreToolUse` sobre `.agents/skills/**` (o la ruta de la Wiki si s'accepta 13.3.4) comprova tres coses: que la skill existeix al catàleg, que la secció existeix al fitxer (o és `## Lliçons del Mestre`), i que la línia `APRENC` s'ha escrit al LEDGER en els últims minuts. Sense les tres, no s'escriu. La skill que ha de contindre la regla és `core-memoria-historica` reconvertida en registre de lliçons (§3), no `wiki-cicle-de-vida`, que ja arrossega tres polítiques.

I una advertència d'UX per al Mestre: "inclou això a les teues skills" és ambigu per a la IA perquè hi ha 17 destins possibles i cap criteri de tria escrit. Amb 9 skills amb un àmbit clar cadascuna (§3), la declaració d'intencions es fa quasi sola. Reduir primer, blindar després.

Sóc de Poble!
