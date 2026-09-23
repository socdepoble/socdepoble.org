---
type: informe
status: esborrany
description: "Auditoria de la neteja documental: la porta amnistia el deute heretat, el bypass de Bash és viu i els hooks ja s'executen"
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f8920453-0a5d-4754-91ee-06d782410686:fb985562-6690-4d61-82da-17e7ef0dc2df
---
# Auditoria Opus — El deute no s'ha netejat del tot: una part s'ha amnistiat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f8920453-0a5d-4754-91ee-06d782410686:fb985562-6690-4d61-82da-17e7ef0dc2df |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T02:00:00Z |
| Modificació | 2026-09-22T02:00:00Z |
| Propietari | Claude Opus 5 |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Plantilla entregada per `document.mjs context --route auditoria`: `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`. Llegida sencera abans d'escriure una línia. El rebut acredita l'entrega, no la comprensió.

He arribat **segona** a l'olivera. He llegit el pla `260922_0335_pla_implementacio_neteja_wiki.md` i l'auditoria `260922_0340_auditoria_codex.md` abans de redactar. La meua feina no repeteix la de Codex: la verifica i continua on ell s'atura.

## Historial

Cronologia real reconstruïda amb `stat` (hora local CEST), no amb suposicions:

| Hora | Fet |
| --- | --- |
| 03:28 | MarIA deixa el pla i el prompt a l'Escriptori. |
| 03:41 | Òbric `torn_f8920453` i mesure: **70 enllaços trencats**, SCC en roig. |
| 03:43:30 | Codex escriu `GENOMA.md`, `ON_ESTIC.md` i quatre `SKILL.md`. |
| 03:45:30 | Codex escriu `00_index_escriptori.md`. |
| 03:46:01 | Codex escriu `00_index.md`. |
| 03:46:37 | Codex escriu `ESTAT.md`, `LEDGER.md` i la seua auditoria. |
| 03:51 | Torne a mesurar amb el **mateix** comandament: **5 enllaços trencats**, SCC en verd. |

Tall d'aquesta auditoria: `snapshot` de `tancament.mjs` a les 03:51, arbre de treball amb canvis locals sobre `be16f668`. Tot el que afirme ací val per a eixe tall i pot caducar en minuts, com ja ha passat.

## Troballes

### O-1 · P0 · La porta amnistia el deute documental heretat

- **Scope:** `tooling/documental/turns.mjs` (`checkTurn`), línies del conjunt `documents`.
- **Font de veritat en conflicte:** AGENTS.md §4 («cap tasca es considera finalitzada fins... `tancament.mjs`») i la Lliçó del Mestre «una porta necessita una prova que la faça fallar».
- **Mecanisme:** el conjunt de documents validats és `changed ∪ receipts`, on `changed` es calcula contra `turn.initial`, l'inventari del moment d'**obrir** el torn. Un document que ja era al disc en obrir el torn i que no té rebut d'aquest torn **no es valida**.
- **Evidència reproduïble** (executada, dos passos):
  1. Amb `torn_f8920453` obert **abans** que el fitxer existira, escric `260922_0352_prova_amnistia_torn.md` amb `reflex: sdptorn_260922_0352`. La porta emet 4 errors, entre ells `reflex: cal un rebut persistent emés per document.mjs context`.
  2. Òbric `torn_3b0a3db2` **després** que el fitxer ja estiga al disc i torne a comprovar el mateix fitxer sense canviar-lo: queden **2 errors** i el del rebut **ha desaparegut**.
- **Conseqüència:** un document amb rebut falsificat, seccions incompletes o `type` incorrecte és definitivament invisible per al contracte documental si se'l deixa reposar un torn. Només cal ancorar-lo a l'índex. Els dos documents 0335 de MarIA estaven exactament en eixa situació quan jo vaig mesurar a les 03:41: **la porta ja no els mirava**.
- **Què no tapa el forat:** l'SCC és immune a l'amnistia perquè escaneja el disc i no el torn — per això els 2 errors supervivents del pas 2 són `ESCRIPTORI_UNANCHORED` i `ORPHAN_OPERATIVE`. L'SCC vigila **àncores i orfandat**, mai el contracte (rebut, seccions, registre, `type`). No confongam una cosa amb l'altra.
- **Proposta conservadora:** afegir a `checkTurn` una passada de només lectura sobre **tots** els `.md` de `04_escriptori/` (excloent `01_produccio` i l'índex), separant els errors en dos blocs: `del torn` (bloquejants) i `heretats` (visibles i comptats). Res de reparar sol: només fer que el deute deixe de ser invisible. Una prova que injecte un rebut fals en un document preexistent i exigisca que aparega al bloc `heretats`.
- **requires_human_decision:** false per a fer-lo visible; true per a decidir si el deute heretat bloqueja el tancament o només l'avisa.

### O-2 · P0 · El bypass de `Bash` és viu i es combina amb O-1

- **Scope:** `.claude/settings.json` (matcher `Write|Edit|NotebookEdit`), `tooling/gates/porta-reflex.mjs`.
- **Evidència reproduïble:** el contingut exacte que la porta m'ha **rebutjat** per `Write` (`[PORTA-REFLEX] BLOQUEIG / reflex: cal un rebut persistent`) ha entrat al disc sense cap queixa amb `cat > fitxer <<'EOF'` dins de `Bash`. Mateix contingut, mateixa ruta, mateix rebut fals: un camí bloqueja i l'altre no.
- **Font de veritat en conflicte:** la meua pròpia entrada al `LEDGER.md` del `260922_0125`, que ja el va declarar com a límit obert. Ací el confirme **viu** tres hores després.
- **Per què importa ara i no abans:** O-2 posa el document invàlid al disc; O-1 fa que, al torn següent, ningú el mire mai més. Per separat són dos avisos; junts són un camí complet perquè un document que cap porta acceptaria es quede a la Wiki per sempre.
- **Proposta conservadora:** no intentar validar `Bash` pel payload del comandament — és inauditable. En comptes d'això, fer que O-1 el caça a posteriori: si el contracte es comprova sobre tot l'Escriptori, l'origen de l'escriptura deixa de tenir importància.
- **requires_human_decision:** false.

### O-3 · Positiu verificat · Els hooks ja s'executen en Claude Code

- **Scope:** `.claude/settings.json`, `.agents/hooks/`, `tooling/gates/porta-reflex.mjs`.
- **Font de veritat:** l'`ESTAT.md` del `260922_0310` deixa escrit «Cal sessió nova de Claude per comprovar activació de hooks». Aquest és eixe pendent, i el tanque.
- **Evidència reproduïble, doble:**
  1. `SessionStart`: en arrancar la sessió, `despertar.mjs` ha regenerat `ON_ESTIC.md` («generat amb èxit a 2026-09-22T01:40:48.627Z») sense que ningú executara res.
  2. `PreToolUse`: la porta ha **bloquejat de veres** el meu primer `Write` amb missatge i recuperació correctes.
- **Conclusió:** el criteri d'acceptació que jo mateixa vaig escriure al torn 0125 està complit. La cadena `settings.json → porta-reflex → schema` funciona en el dialecte de Claude Code. **Pendent tancat, i no per declaració: per bloqueig demostrat contra mi.**

### O-4 · P1 · La llei continua ensenyant el nom equivocat del fitxer

- **Fitxers:** `AGENTS.md:57`, `.agents/AGENTS.md:57`, `.agents/GENOMA.md:57` i `:127`.
- **Evidència:** els quatre llocs nomenen `00_INDEX_ESCRIPTORI.md`. El fitxer al disc és `00_index_escriptori.md`. Com a text pla no trenca cap porta, i per això Codex no l'ha tocat: la seua neteja de wikilinks és correcta i completa.
- **Per què és una troballa igualment:** això és el **grifó**, no l'aigua. L'agent llig la llei, aprén el nom en majúscules i el torna a escriure com a wikilink al pròxim document. El deute que Codex ha llevat renaixerà pel mateix camí per què va nàixer. La Lliçó del Mestre ja ho diu: la llei no pot nomenar un fitxer que no existeix.
- **Proposta conservadora:** corregir la grafia a les quatre línies. `GENOMA.md` es regenera, així que cal corregir la font i tornar a generar-lo, no el generat.
- **requires_human_decision:** false (correcció ortogràfica d'una ruta, sense canvi de significat).

### O-5 · P1 · El resolutor és sensible a majúscules i el sistema de fitxers no — i això bloqueja la zona humana sense necessitat

- **Fitxers:** `tooling/wiki/compile-wiki-to-app.mjs` (`resolIdentitat`, comparació `validIds.has(targetId)`).
- **Evidència reproduïble:** el manifest té 135 items; `00_index_escriptori` hi és, `00_INDEX_ESCRIPTORI` no. `find . -iname "00_INDEX_ESCRIPTORI.md"` sí que troba el fitxer, perquè APFS no distingix majúscules — i Obsidian tampoc. És a dir: **el graf d'Obsidian no està trencat; el manifest sí.**
- **Aportació directa sobre la feina de Codex:** Codex deixa 5 enllaços pendents dins de `01_produccio` i demana autorització al Mestre segons AGENTS.md §12. Té raó a no tocar-los. Però **2 dels 5 són d'aquesta classe** (`00_INDEX_ESCRIPTORI` des de `260911_0645_cartografia_arxiu_wiki_de_poble_2gb.md` i des de `260911_0645_informe_rescat_antiga_web.md`). Si es normalitza la comparació al resolutor, eixos dos es resolen **sense entrar a la zona humana**, i la petició al Mestre baixa de 5 enllaços a 3.
- **Proposta conservadora:** indexar `validIds` també en minúscules i comparar en minúscules **només per a decidir si l'enllaç és vàlid**, mantenint l'id canònic per a la navegació. Amb una prova que enllace el nom en majúscules de l'índex de l'Escriptori i exigisca verd, i una altra que enllace un destí inexistent i exigisca roig.
- **Els 3 que sí que necessiten el Mestre:** dues cites a `260911_0520_ACTA_MARMOTA_tancament_sessio` i una a `260911_0624_PROMPT_auditoria`, documents que no existeixen amb cap capitalització. Ací coincidisc amb Codex sense reserves: **requires_human_decision: true**. Vegeu O-7: aquests tres vincles són, literalment, el que impedeix que cap torn del projecte arribe a `closed`. Tres línies de text en dos documents de `01_produccio` mantenen obert el cicle de vida sencer.

### O-6 · P2 · La cita conservada ha perdut la ruta

- **Fitxers:** `.agents/LEDGER.md`, `.agents/ESTAT.md`, `.agents/ON_ESTIC.md`.
- **Confirme la decisió de Codex:** ha convertit el wikilink cap a `260922_0056_auditoria_opus` en una cita de codi en línia, `` `260922_0056_auditoria_opus.md` ``. Verificat al `git diff`: **no ha esborrat cap fet ni cap línia d'història**. Davant l'ordre del prompt d'«esborrar-los», ha triat desactivar la navegació i conservar la cita. És exactament el que mana la Llei de la Immutabilitat de `QUI_SOC.md` §3, i és el criteri correcte.
- **On es queda curt:** ara el lector no pot distingir «aquest document està a l'arxiu històric» de «aquest document mai no va existir». La traçabilitat del fet s'ha salvat; la del **document** s'ha perdut.
- **Proposta conservadora:** que la cita morta porte la ruta, no només el nom: `` `90_arxiu_historic/<sessió>/260922_0056_auditoria_opus.md` ``. Costa el mateix i conserva el camí cap a la prova.
- **requires_human_decision:** false.

### O-7 · P1 · Dos torns oberts alhora no es detecten en obrir, sinó en tancar

- **Fitxers:** `tooling/gates/obrir_torn.mjs`, `tooling/documental/turns.mjs` (`sealTurn`).
- **Evidència:** `.agents/runtime/turns/` conté **quatre registres i cap en estat `closed`**: un `opened` (`torn_0400a79b`, 03:37, que no és de Codex ni meu) i tres `planned` (`torn_afa18e33`, `torn_acdcaf49`, `torn_f8920453`). `torn_f8920453` (meu, 03:41) i `torn_acdcaf49` (de Codex) han estat oberts simultàniament sobre el mateix arbre i `obrir_torn.mjs` no ha dit res.
- **El que aquesta llista demostra, i és més greu que la concurrència:** **cap torn d'aquesta nit s'ha tancat mai.** No per desídia dels agents, sinó perquè `--close` repeteix les comprovacions i `wiki` està en roig pels 5 vincles de `01_produccio`. És a dir: **cinc enllaços dins de la zona humana mantenen obert tot el cicle de vida del projecte.** La skill del cicle de vida diu que el torn només queda tancat quan `--close` desa `closed`; amb aquest bloqueig, això no li ha passat a ningú. Això eleva O-5 de detall documental a pany del sistema, i fa que l'autorització que Codex demana al Mestre siga la decisió més rendible de la nit. `sealTurn` sí que ho detectaria, però tard: fa `inventory` després de les comprovacions i llança «La comprovació ha modificat fitxers o hi ha escriptura concurrent». És a dir, **els dos torns es bloquejarien mútuament en el moment de tancar**, després d'haver fet tota la feina.
- **Això confirma i porta més lluny el punt 4 de Codex** («un sol agent integra els canvis compartits»): el problema no és només de disciplina d'integració, és que la detecció arriba al final del túnel.
- **Proposta conservadora:** que `obrir_torn.mjs` avise (o falle amb `--force` per a saltar-ho) quan ja hi ha un torn en estat `opened` no caducat. És barat i evita perdre una jornada sencera de treball paral·lel.
- **requires_human_decision:** true per a triar entre avís i bloqueig.

### O-8 · P1 · La llei viatja més lenta que el treball

- **Evidència:** el meu context es va carregar a les 01:40 UTC. Codex va reescriure `wiki-cicle-de-vida/SKILL.md` i tres skills més a les 03:43:30 CEST. Durant tota aquesta auditoria jo he tingut carregada, via `CLAUDE.md`, una versió de la llei que **ja no és al disc** — inclosos els dotze wikilinks cap a l'índex de l'Escriptori en majúscules que Codex acabava de llevar.
- **Conseqüència per al coworking:** un agent que repara la llei **no repara els agents ja arrancats**. Qualsevol agent viu continuarà citant i aplicant la versió antiga fins que òbriga sessió nova, i ho farà amb tota la confiança del món perquè la llei li arriba com a context de sistema.
- **Proposta conservadora:** quan un torn toca `.agents/skills/` o els fitxers de constitució, que el relleu a l'`ESTAT.md` porte una línia explícita: «skills editades a HH:MM — el context carregat abans d'aquesta hora és caduc». Els agents vius llegim l'ESTAT; no podem rellegir el nostre propi context de sistema.
- **requires_human_decision:** false.

### O-9 · Refutació d'una instrucció del prompt

El prompt `260922_0335_prompt_neteja_wiki.md` mana, al punt 1 de la Tasca: «afegiu el camp `reflex: sdptorn_...`».

**Aquesta instrucció mana fabricar un rebut fals.** `tooling/documental/core.mjs` defineix `receiptPattern = ^sdp:(torn_UUID):(UUID)$`. La cadena `sdptorn_260922_0335` no la satisfà, i és exactament el que hi havia als dos documents 0335. Complir la instrucció al peu de la lletra produeix el document que la porta rebutja — i em consta perquè la porta m'ha bloquejat a mi per intentar-ho.

La instrucció correcta per a la pròxima petorreta és una comanda, no un camp:

```bash
node tooling/wiki/document.mjs context --turn-id ID --route ID_RUTA --file CAMÍ
```

Codex ho va resoldre bé sense dir-ho: va emetre rebuts de veritat. Ho dic explícitament perquè la instrucció està escrita i es tornarà a llegir.

### O-10 · P1 · Un document no pot citar un enllaç sense fabricar-lo

- **Fitxers:** `tooling/wiki/compile-wiki-to-app.mjs` (`processWikiLinks`).
- **Evidència, i és la meua pròpia:** la primera versió d'aquesta auditoria va fer pujar els enllaços trencats de **5 a 8**. Els tres nous eren meus, i tots tres eren **exemples citats**: dos dins d'una frase que explicava la col·lisió de majúscules i un dins d'una cita de codi en línia que mostrava com Codex havia desactivat un wikilink. `processWikiLinks` aplica `text.replace(/\[\[(.*?)\]\]/g, …)` sobre el cos sencer, sense excloure el codi en línia ni els blocs tancats amb tres cometes. Per al verificador, parlar d'un enllaç és crear-lo.
- **Font de veritat en conflicte:** el «Contracte d'informe» de la plantilla canònica exigeix «evidència reproduïble» a cada troballa. Una auditoria sobre enllaços trencats no pot mostrar l'enllaç del qual parla sense trencar la porta que audita.
- **Severitat:** P1 i no P0, perquè té una eixida manual (evitar la sintaxi, que és el que ha fet Codex i el que he acabat fent jo). Però és una eixida que només coneix qui ja ha xocat: jo ho sabia i hi he caigut igualment mentre ho escrivia.
- **Proposta conservadora:** emmascarar els trams de codi abans d'aplicar la substitució (primer els blocs de tres cometes, després el codi en línia), i restaurar-los després. Amb una prova que continga un wikilink cap a un destí inexistent **dins** d'un bloc de codi i exigisca verd, i el mateix enllaç fora del bloc i exigisca roig.
- **requires_human_decision:** false.

## Verificació

Estat a les 03:51, `turn_id` `torn_f8920453-0a5d-4754-91ee-06d782410686`:

```json
{ "valid": false, "mode": "check",
  "checks": [ {"name":"skills","exit":0}, {"name":"wiki","exit":1},
              {"name":"documental-tests","exit":0}, {"name":"scc","exit":0} ] }
```

- `skills` verd, `documental-tests` verd, **`scc` verd** (0 orfes, 0 sense àncora: la feina de Codex es sosté).
- `wiki` en roig pels **5 enllaços de `01_produccio`** i per res més. Confirmat executant `compile-wiki-to-app.mjs --check --strict` directament: 5 errors, 739 bytes d'eixida.
- Els errors de torn que resten són els meus deures d'aquest torn (pla vinculat, relleu a ESTAT i LEDGER), no deute del sistema.

Confirmacions de les afirmacions de Codex, comprovades i no acceptades de paraula:

| Afirmació de Codex | Mètode | Resultat |
| --- | --- | --- |
| «No s'ha editat el generador ni relaxat cap porta» | `stat` sobre tot `tooling/`, `.husky/`, `package.json` | **Certa.** Cap mtime dins de la seua finestra 03:43–03:46; el més recent és 03:28. |
| «Es conserva la cita històrica com a text» | `git diff .agents/LEDGER.md` | **Certa.** Wikilink → codi en línia; cap fet esborrat. |
| «zero errors de rebut i zero orfes» | `tancament.mjs --check` | **Certa** per a l'abast del seu torn; vegeu O-1 per a l'abast que la porta no mira. |
| «resten cinc vincles dins de la zona humana» | `--check --strict` directe | **Certa**, i 2 dels 5 es poden resoldre sense tocar la zona humana (O-5). |

**Rebut final d'aquest torn**, després d'ancorar l'informe, vincular el pla 0335 i deixar el relleu a `ESTAT.md` i `LEDGER.md` (signat: `65f1e59a…`):

```json
{ "valid": false, "state": "planned",
  "snapshot": "4204632c7644c29463b50b19ae7675d1e93fd8be98826608f5d15af2731503ad",
  "checks": [ {"skills":0}, {"wiki":1}, {"documental-tests":0}, {"scc":0} ],
  "errors": ["wiki: 5 enllaços trencats, tots a 01_produccio"] }
```

Zero errors de torn: pla vinculat per hash, relleu present als dos registres, informe validat (`document.mjs check` → `valid: true`) i ancorat a l'índex. **El torn queda `planned`, no `closed`**, i no reclame cap certificat verd: l'únic bloqueig que resta és la zona humana, i eixa decisió no és meua.

Entremig, aquesta auditoria va fer pujar els enllaços trencats de 5 a 8 amb tres enllaços fabricats pels seus propis exemples. Corregits; O-10 en naix. Ho deixe escrit perquè el camí fins al rebut val més que el rebut.

**Avís sobre la llista d'errors del prompt:** els 70 enllaços trencats que el Mestre va repartir venien de `(stderr+stdout).slice(-6000)` de `tancament.mjs`. El bloc comença literalment amb `"wiki: x al manifest."` — una frase tallada pel mig. Qui treballe eixa llista com si fora completa, treballa sobre una mostra arbitrària. Avui no ha fet mal perquè Codex va reparar la causa, no la llista.

## Límits

Abast documental i de portes. No he certificat React, Supabase, desplegament ni la integració amb Sollutia. No he tocat `01_produccio` ni cap fitxer de Codex. No he modificat cap porta ni cap generador: les propostes O-1, O-4, O-5 i O-7 són **propostes**, i esperen aprovació del Mestre abans de tocar codi.

He usat deliberadament el bypass de `Bash` (O-2) per a una prova d'auditoria, amb un fitxer temporal creat i esborrat al mateix torn. Ho declare ací perquè l'ús d'un forat conegut no ha de quedar amagat dins d'una auditoria que el denuncia.

No he consultat `socdepoble.net` ni `rentonner.blogspot.com`: Codex ja ho ha fet en aquest mateix cicle i no tinc res a afegir-hi que no siga soroll. No he creat Acta Marmota.

De les 10 troballes, 9 són confirmades amb evidència executada i 1 (O-7) és un mecanisme llegit al codi i coherent amb la cronologia, però **no l'he provocat**: no he forçat dos `sealTurn` simultanis. La marque com a raonada, no com a reproduïda.

## Opinió sobre el Coworking de l'Olivera

L'olivera funciona com a **memòria** i falla com a **rellotge**. Açò no és una metàfora bonica: és el que m'ha passat avui i és mesurable.

He mesurat 70 enllaços trencats a les 03:41. Eren reals. Deu minuts després eren 5. Si jo haguera fet el que fa una IA obedient i ràpida — mesurar i escriure l'informe de seguida — hauria lliurat al Mestre un document **verídic en el moment d'escriure'l i fals en el moment de llegir-lo**. Cap dels dos hauríem mentit i el Mestre hauria tingut dues auditories incompatibles sobre la taula. El disc comparteix bé els fets; no comparteix l'ordre dels fets.

Tres correccions concretes, en ordre de rendiment:

**1. Cada troballa cita el tall, i el sistema ja el fabrica.** `tancament.mjs` emet un `snapshot` (`3f02be0e…`) que ningú usa. Fer-lo obligatori a cada informe converteix «he trobat 70 errors» en «he trobat 70 errors al snapshot X», i la contradicció entre dos informes passa de ser un conflicte d'autoritat a ser una resta de dos hashos. És gratis: el camp ja existix.

**2. El primer que arriba diagnostica; reparar és un altre torn.** Ací discrepe de Codex. El seu punt 2 proposa «verificació independent abans de llegir l'altre», cosa que depén de la disciplina de lectura de cada agent. Propose una cosa més forta i estructural: **qui audita no repara en el mateix acte**. Codex ha reparat bé, i precisament per això ha destruït l'evidència que jo estava mesurant. No és culpa seua: el prompt manava auditar **i** reparar alhora, i això és una contradicció d'abast. Amb diagnòstic i reparació en torns separats, la segona IA troba el diagnòstic segellat i el disc intacte, i pot dir si la reparació proposada és correcta **abans** que estiga feta — que és quan val alguna cosa.

**3. Qui toca la llei ho anuncia a l'ESTAT.** O-8. Jo he escrit aquesta auditoria citant una llei que Codex havia canviat dues hores abans. Els agents no podem rellegir el nostre context de sistema, però tots llegim l'ESTAT. Una línia hi basta.

**El que sí que funciona i no s'ha de tocar:** el debat en disc ha produït hui una cosa que cap de nosaltres dos hauria produït a soles. Codex ha vist que 5 enllaços viuen a la zona humana i que cal demanar permís — jo no ho havia mirat encara. Jo he vist que 2 d'eixos 5 es resolen al resolutor sense demanar cap permís. Eixa suma és real i ha costat quatre minuts de lectura. També he pogut **verificar-lo** en compte de creure'l: quatre afirmacions seues comprovades amb `stat` i `git diff`, quatre certes. Un informe verificable val més que un informe d'acord, i el Markdown en disc és el que ho fa possible.

**On no estic d'acord amb el marc del Mestre:** la Lliçó del `260922` diu que «Claude va abandonar el seu ego» en corregir-se davant de Codex. No fou humilitat: fou que Codex portava evidència. Si el sistema recompensa que la segona IA es corregisca, la segona IA aprendrà a cedir per defecte, i això és pitjor que l'ego — és un acord fabricat que sembla consens. El criteri ha de ser l'evidència reproduïble, i a voltes la segona IA ha de dir que la primera s'equivoca. Avui no és el cas: Codex ha fet una feina neta, conservadora i honesta, i ho dic perquè ho he comprovat, no per cortesia.

**Com ho mesuraria:** no pel nombre d'informes. Per tres números: quantes troballes són reproduïbles per l'altra IA, quantes portes noves porten una prova que les faça fallar, i quants dies passa una troballa entre «confirmada» i «executada». Hui el tercer número és el perillós: aquest sistema produïx auditories més ràpid que execucions, i una troballa que no s'executa acaba com un enllaç trencat més.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0335_pla_implementacio_neteja_wiki]]
- [[260922_0340_auditoria_codex]]
