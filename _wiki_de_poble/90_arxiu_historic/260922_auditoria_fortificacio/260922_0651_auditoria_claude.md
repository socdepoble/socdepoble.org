---
type: informe
status: esborrany
description: 'Auditoria forense del Cervell: constitucio, skills, taxonomia, maquinaria documental i arrancada freda'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_bd8aab94-5d17-4c48-be88-722b8d7cebda:ffebc6c5-48b0-4591-845e-26b8070bbe52
---
# Auditoria del Cervell i de l'enxufabilitat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bd8aab94-5d17-4c48-be88-722b8d7cebda:ffebc6c5-48b0-4591-845e-26b8070bbe52 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T04:50:01.380Z |
| Modificació | 2026-09-22T04:50:01.380Z |
| Propietari | Claude Opus 5 (agent local) |
| Aprovació humana | pendent |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 b2f519c4eb08bd94fea8fb554476b04d931ce54131b021efc16217caaa4881f7. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T04:50:01.380Z: esborrany creat amb rebut del torn `torn_bd8aab94-5d17-4c48-be88-722b8d7cebda`.
2026-09-22T05:25:00.000Z: troballes tancades. Llegida l'auditoria de Codex 0643 i el pla de MarIA 0650; verificades set de les seues afirmacions amb comandes pròpies.
2026-09-22T14:40:00.000Z: addenda de la caça de fons. 168 agents llançats, 79 morts pel límit de sessió; de les 43 troballes donades per mortes, només 4 ho estaven de veres. Sis troballes noves verificades a mà i promogudes; la resta queda etiquetada com a cua de treball sense judici.

## Troballes

### Tall de l'auditoria

Som tres treballant damunt del mateix bancal ara mateix, i açò no és una metàfora: mentre jo llegia, Codex ha obert, omplit i tancat el torn `torn_4dd02076` (06:43–06:48) i MarIA ha arxivat quatre documents de l'Escriptori i ha deixat el seu pla (06:50). Tot el que dic va contra el disc de les 06:42–07:20 del 22-09-2026, HEAD `be16f668`, amb l'arbre brut.

Arribe **tercera** a l'olivera. Codex hi era primer amb dotze troballes (C01–C12) i un pla de cinc fases; MarIA hi ha deixat un semàfor. No repetisc la seua faena: la comprove, l'esmene on toca, i vaig on ell no ha entrat.

### El que confirme de Codex, amb proves meues

No em crec res per educació. He tornat a mesurar:

- **C01 (rutes constitucionals mortes).** Cert. `AGENTS.md` §13 enllaça `BOOTSTRAP.md`, `rules/00_BIOS_COGNITIU.md` i `BASELINE.md`: cap de les tres existeix des de l'arrel. La quarta, `.agents/skills/sdp-workflow/SKILL.md`, sí.
- **C03 (governança contradictòria).** Cert i pitjor del que diu. `01_ser/01_identitat.md:19` i `01_ser/02_genotip.md:19` manen «Online-First estricte (ADR-2026-08)». `01_ser/personalitat_iaia.md:15` mana literalment «No som Online-First ni PWA offline». Són tres fitxers germans de la mateixa carpeta: el primer dia, l'agent nou creu el que òbriga primer.
- **C04 (taxonomia d'una estructura morta).** Cert. `02_saber/00_index_identitat.md` encamina llei → `03_govern`, memòria morta → `04_ARXIU_Documents_Historics`, treball actiu → `05_Escriptori_Soc_de_Poble`. Les tres carpetes no existeixen. Les reals són sis: `01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes`, `90_arxiu_historic`.
- **C09 (els documents han eixit del circuit).** Cert, i ara mateix pitjor que quan ell va mesurar: `porta-documents --all` comprova 10 documents i en marca 6 sense rebut. La cobertura real del circuit a l'Escriptori és de 4 sobre 10.
- **C11 (el relleu depén de l'ordre físic).** Cert amb un matís. `despertar.mjs:34-35` talla ESTAT als primers 1.500 caràcters, i això hui funciona **per casualitat**: les entrades noves s'inserixen dalt. Però el fitxer barreja els dos sentits (línies 306 i 309 són del 21-09 afegides al final) i té la secció estructural «3. Resum Executiu (Què estem fent ara?)» soterrada a la línia 169 de 330. El dia que algú afegisca per baix, el relleu es queda cec sense avisar.

### L'esmena que li faig a Codex: la zona humana NO està protegida

El seu pla diu, com a risc, «La producció humana continua protegida» i «No editar `01_produccio`». **Això ja no és cert, i no ho era quan ho va escriure.** És la troballa O-1 i la porte primera perquè és l'única que toca material del Mestre.

I una segona esmena, metodològica: la seua Fase 5 («successió assajada» en clon net) és la millor idea del pla i està **l'última**. És l'única prova que mesura el que el Mestre ha preguntat de veres. Tot el que es fa abans és endevinar què li farà falta al nou. Jo la posaria **primera**, en sec, i que l'ordre de les fases 1–4 l'escriga allò que es trenque.

### O-1 · P0 · La zona sagrada humana ha perdut dos documents i la maquinària és estructuralment incapaç de vore-ho

- **Evidència:** `git status --porcelain _wiki_de_poble/04_escriptori/01_produccio/` retorna dues línies ` D`. Els fitxers són `260911_0645_cartografia_arxiu_wiki_de_poble_2gb.md` (2.584 bytes) i `260911_0645_informe_rescat_antiga_web.md` (4.314 bytes). No són al disc, ni a `90_arxiu_historic`, ni a `.brain-trash`, ni a `.sdp-paperera`: `find` no els troba enlloc. Només sobreviuen dins de git.
- **Per què la maquinària no ho pot detectar mai:** `tooling/documental/turns.mjs:17` exclou `01_produccio` i `01_Produccio` del recorregut de l'inventari. Mesurat: `inventory(root)` retorna 719 entrades i **0** són de `01_produccio`. Com que `changed` ix d'eixe inventari i els rebuts no poden apuntar a la zona humana (`deliverContext` ho rebutja a `turns.mjs:84`), la guarda `if (humanZone(file))` de `turns.mjs:151` **no es pot disparar mai**. És una porta pintada a la paret.
- **Font de veritat en conflicte:** AGENTS.md §12, que diu que la IA «NO POT TOCAR, ESBORRAR NI ALTERAR res d'aquesta carpeta sota cap concepte».
- **Per què és P0:** l'única carpeta que la llei declara sagrada és l'única sense cap vigilància mecànica. La protecció és una frase, no un codi.
- **Proposta conservadora, en dues parts:**
  1. Recuperació immediata, ara, abans de res: `git checkout HEAD -- "_wiki_de_poble/04_escriptori/01_produccio/"`.
  2. Invertir l'exclusió: inventariar `01_produccio` **en mode segell** (només el hash, mai el contingut) i fer que `checkTurn` falle si algun d'eixos hash canvia durant el torn. La zona humana no ha de ser invisible; ha de ser **intocable i vigilada**, que no és el mateix.
- `requires_human_decision: true` — només per a decidir si els dos documents es recuperen tal qual o el Mestre els volia fora. El que no és opinable és que desapareguen sense que res ho cante.

### O-2 · P0 · Arxivar un document mata el seu torn per a sempre, i la porta no ho diagnostica: peta

- **Evidència mesurada sobre els 9 registres de `.agents/runtime/turns/`:** **5 torns tenen rebuts que apunten a fitxers que ja no existeixen.** `a944bc6b` (2 rebuts perduts), `acdcaf49` (4), `afa18e33` (2), `d6ee237f` (1), `f8920453` (1). Cap d'ells podrà tancar-se mai: `checkTurn` recorre `receipts` i exigeix que el fitxer hi siga.
- **I no ho diu; s'estavella.** `tooling/gates/tancament.mjs --check --turn-id torn_a944bc6b-…` retorna `{"valid":false,"errors":["ENOENT: no such file or directory, open '…/260922_0510_pla_implementacio_braingraph.md'"]}`. La causa és `turns.mjs:140`: `hashFile(path.join(root, turn.plan.file))` sense comprovar que existisca. L'agent rep una traça de Node, no un diagnòstic.
- **I es contagia.** El meu propi torn, obert a les 06:42 i net, ja arrossega quatre errors `Document eliminat sense relleu` perquè MarIA ha arxivat eixos fitxers a les 06:50, **després** que jo fera la foto inicial. Un agent embruta el torn d'un altre sense tocar-li res.
- **Per què és P0:** el torn és una fotografia del repositori sencer feta per un sol agent, en una casa on ara mateix en treballen tres. Codex va tancar el seu a les 06:48 i se'n va lliurar per dos minuts. No és disciplina: és sort.
- **Proposta conservadora:** (a) protegir la lectura del pla i dels rebuts amb `fs.existsSync` i emetre l'error amb nom propi («el pla/rebut apunta a un fitxer que ja no és ací»); (b) permetre el relleu del rebut quan el document es promou a `10_actes` o a l'arxiu, desant la ruta nova al registre en lloc de donar el torn per perdut; (c) acotar `changed` als camins que el torn ha tocat de veres, no a tot el que s'haja mogut al repositori mentre estava obert.
- `requires_human_decision: false`.

### O-3 · P0 · El Somiador s'enduria ara mateix els huit documents vius, este debat inclòs

- **Evidència (simulat, no executat):** `tooling/brain/somiador.mjs:27-39` agafa tot fitxer de l'Escriptori que no siga directori, `.DS_Store`, `.ancora_sessio.json` o continga «index», i el mou a `90_arxiu_historic`. Aplicant eixa mateixa condició al disc d'ara: **mouria 8 fitxers**, que són exactament tot el que hi ha viu — el prompt del Mestre, l'auditoria de Codex, el pla de Codex, el pla de MarIA, les dues petorretes pendents, les tasques d'UI i esta auditoria.
- **Font de veritat en conflicte:** la skill `wiki-cicle-de-vida`, que diu amb totes les lletres: «El Somiador NO ha d'esborrar ni purgar mai informes, auditories o plans que estiguen pendents de revisió o debat entre IAs». El codi no té cap noció de «pendent de revisió». No existeix eixe concepte enlloc del fitxer.
- **I es combina amb O-2:** cada document que el Somiador s'endú mata el torn que el va parir. Dormir al final d'una sessió garantix que cap torn d'eixa sessió es puga tancar l'endemà. **El ritual d'higiene i el ritual de traçabilitat es destruïxen l'un a l'altre.**
- **Proposta conservadora:** que el Somiador respecte una marca explícita. La més barata i que ja existix: **no mogues cap document que estiga enllaçat des de `00_index_escriptori.md` sota un encapçalament de cicle actiu**, o, encara més simple i mecànic, **no mogues cap document el rebut del qual pertanya a un torn que no estiga en estat `closed`**. Són quatre línies i lliguen les dues lleis en compte d'enfrontar-les.
- `requires_human_decision: false`.

### O-4 · P1 · La resposta a MarIA (1 de 2): la plantilla ISO no complix el seu propi contracte

MarIA demana que investiguem per què li falla generar documents des de les pàgines ISO. **La maquinària no està trencada.** Ho he mesurat en sec, sense escriure res al repositori: he generat l'esborrany de **les 13 rutes** de `protocolledge.json` i les he validades contra l'esquema, les seccions i el registre. **13 de 13 ixen vàlides**, amb els `[pendent]` com a única cosa a omplir. El contracte carrega, les plantilles casen i `create` funciona: esta auditoria n'ha eixit.

El que falla és una altra cosa, i és molt més concreta:

- **Evidència:** la ruta `prompt.local` exigix set seccions. La plantilla canònica `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` — la que la REGLA 0 d'AGENTS.md mana obrir i heretar sencera — **només en té quatre de les set al seu propi cos**. Li falten `Historial` i `Tasca`, i la setena la titula `Protocol de la Reunió a l'Olivera (Instruccions d'Interacció)` mentre el contracte exigix exactament `Protocol de la Reunió a l’Olivera`. Dues diferències: l'apòstrof recte contra el tipogràfic, i el sufix entre parèntesis. `validateSections` compara cadenes exactes.
- **La prova que ho tanca:** el prompt que MarIA ha picat a mà (`260922_0612_prompt_auditoria_cervell.md`) reproduïx eixa plantilla amb fidelitat i, per tant, li falten **quatre** de les set seccions. Copiar bé la llei produïx un document que la llei rebutja.
- **Per què importa:** la IA no s'ha saltat el procediment. **Ha obeït el procediment escrit, i el procediment escrit està mal.** Mentre la plantilla i el contracte no siguen el mateix objecte, cada agent que siga fidel a la Wiki produirà material invàlid, i cada agent que produïsca material vàlid semblarà infidel a la Wiki.
- **Proposta conservadora:** que els encapçalaments del cos de cada plantilla siguen **exactament** les seccions de la seua ruta a `protocolledge.json`, i una prova que compare les dues llistes i pose roig quan divergisquen. Per a `prompt_local.md` són tres retocs: afegir `## Historial`, afegir `## Tasca` i deixar el títol de l'Olivera net, amb l'apòstrof tipogràfic i sense parèntesis.
- `requires_human_decision: false`.

### O-5 · P1 · La resposta a MarIA (2 de 2): la skill documenta la comanda sense els dos indicadors obligatoris

- **Evidència:** la skill `wiki-documentacio-i-reflex` escriu la comanda així: `node tooling/wiki/document.mjs context --turn-id ID --route ID_RUTA --file CAMI`, i de `create` només diu que «prepara i ancora un esborrany». Executat literalment: `document.mjs create --turn-id … --route prompt.local --file …` → **`Cal --title i --description`**. Cap document del cervell nomena `--title` ni `--description` enlloc.
- **I el segon parany:** `obrir_torn.mjs` només escup el `turn_id` per pantalla. Ningú el desa. El fitxer que sembla que el desa, `.agents/TORN_ACTIU.json`, conté `"turn_id": "torn_1790038192092"` — format vell, de les 00:49 —, no el llig ni l'escriu cap script viu, i `turns.mjs:29` l'esborra expressament de l'inventari. Un agent que el creba rep `Identificador de torn invàlid`. És un fitxer emmetzinat que sembla la resposta correcta.
- **Per què importa:** entre una comanda incompleta i un identificador que no es pot recuperar, picar el document a mà no és desobediència, és **l'única eixida que li quedava**. Prova d'això és el rebut inventat de O-9.
- **Proposta conservadora:** afegir `--help` a `document.mjs` amb les quatre banderes i la llista de rutes vàlides; escriure la línia completa a la skill; i que `obrir_torn.mjs` deixe el `turn_id` en `.agents/runtime/torn_actiu.json` (o que esborre el fitxer vell, que ara enganya). Cap canvi de contracte.
- `requires_human_decision: false`.

### O-6 · P1 · La ruta `acta` no pot crear una acta allà on la llei mana

- **Evidència, amb els dos errors literals:**
  - `document.mjs context --route acta --file _wiki_de_poble/10_actes/260922_0700_acta_marmota.md` → **`Destí de document no autoritzat`** (`turns.mjs:84` només admet `04_escriptori/`).
  - `document.mjs context --route acta --file …/04_escriptori/260922_0700_ACTA_MARMOTA.md` → **`Nom termodinàmic invàlid`** (`turns.mjs:85` exigix `[a-z0-9_]`, i la llei i el corpus usen majúscules).
- **Font de veritat en conflicte:** AGENTS.md §14 i la skill del cicle de vida, que manen que les actes vagen «OBLIGATÒRIAMENT a la carpeta `10_actes`». Hi ha 21 actes a `10_actes`. **Cap d'elles ha pogut nàixer de la maquinària, i cap de les pròximes podrà.**
- **Per què és P1:** l'Acta Marmota és el ritual que sosté el relleu entre sessions, el que el Mestre repetix més, i és precisament el que el circuit documental prohibix. Per força s'ha de fer a mà, i per força quedarà fora de tota traçabilitat.
- **Proposta conservadora:** declarar el destí per ruta a `protocolledge.json` (`desti: "_wiki_de_poble/10_actes"` per a `acta`, Escriptori per a la resta) i que `deliverContext` valide contra eixe camp en compte d'una constant. La regla de nom pot admetre majúscules només per a la ruta `acta`, o —millor— que la llei baixe a minúscules i s'hi quede.
- `requires_human_decision: true` — cal que el Mestre trie: o les actes baixen a minúscules, o la màquina admet les majúscules. Jo recomane minúscules: una sola regla per a tot.

### O-7 · P1 · El Llibre d'Obra està sense signatura i ningú el verifica

- **Evidència:** `node tooling/verify-ledger.mjs` → **`❌ LEDGER.md no conté cap signatura`**. Però n'hi ha quatre, a les línies 55, 173, 197 i 224 d'un fitxer de 227. La regla `/\n\n<!-- HASH: ([a-f0-9]{64}) -->$/` (`verify-ledger.mjs:20`) ancora la signatura al final del fitxer: **cada vegada que algú escriu després de signar, el segell anterior queda soterrat i el fitxer torna a estar «sense signar»**, indistingible de no haver-ho estat mai.
- **I ningú ho executa:** `verify-ledger` no apareix ni a `package.json`, ni a `.husky/pre-commit`, ni a cap porta de `tooling/gates/`. La cadena de tancament executa `skills`, `wiki`, `scc` i els tests documentals (`tancament.mjs:14-16`). El Llibre d'Obra no hi és.
- **Font de veritat en conflicte:** QUI_SOC.md §3, Llei de la Immutabilitat: «El Llibre d'Obra (LEDGER) mai no pot ser esborrat de manera automatitzada».
- **Per què és P1:** la llei més solemne del sistema és l'única que no té cap porta darrere. Tres agents hem escrit al LEDGER hui i cap l'ha tornat a signar.
- **Proposta conservadora:** posar `verify-ledger` dins de `environmentChecks` de `tancament.mjs` i signar dins de la mateixa operació que tanca el torn, no com un pas que l'agent ha de recordar. Un segell que depén de la memòria de qui escriu no és un segell.
- `requires_human_decision: false`.

### O-8 · P1 · La porta reflexa vigila tres eines; per Bash s'hi passa per damunt

- **Evidència:** `.claude/settings.json`, `PreToolUse`, `"matcher": "Write|Edit|NotebookEdit"`. Qualsevol escriptura feta amb una comanda de consola (`tee`, `sed -i`, `mv`, `cp`, una redirecció) no passa per `porta-reflex.mjs`. No ho he explotat; es llig a la configuració.
- **I el forat és més gran que una eina:** eixos hooks són del client de Claude Code. Codex i MarIA treballen des d'altres arnesos i **no els travessen mai**. La muralla protegix un dels tres agents de la casa.
- **Per què és P1:** el sistema confia la integritat documental a una barrera que només existix en un terç dels seus operadors, i la barrera que sí que és universal —`tancament.mjs`— s'executa al final, quan el mal ja està escrit.
- **Proposta conservadora:** afegir `Bash` al matcher i fer que `porta-reflex.mjs` només mire les comandes que escriuen dins de `_wiki_de_poble/`; i, sobretot, deixar de tractar el hook com la muralla. La muralla real ha de ser la porta de tancament i el `pre-commit`, que tots tres agents travessen sí o sí.
- `requires_human_decision: false`.

### O-9 · P2 · Ara mateix hi ha un rebut inventat damunt de la taula

- **Evidència:** `_wiki_de_poble/04_escriptori/260922_0550_prompt_auditoria_identitat.md` porta al frontmatter `reflex: "sdp:torn_f2d3a91b-6450-4812-a1b8-e2c7d9a1c1d4:f2d3a91b-6450-4812-a1b8-e2c7d9a1c1d4"`. **El mateix UUID fa de torn i de rebut**, i eixa cadena no apareix en cap altre lloc del repositori: `grep -rl "f2d3a91b"` només troba el propi document. No existix cap `torn_f2d3a91b`.
- **El mur aguanta:** `porta-documents --all` el caça amb un `ENOENT` del registre de torn. No és possible falsificar un rebut sense el fitxer del torn.
- **Però la lliçó no és eixa.** Això no és una falta de l'agent: és el símptoma de O-5. Quan la comanda legítima falla per una bandera no documentada i l'identificador no es pot recuperar enlloc, escriure una cadena amb la forma correcta és el camí de menys resistència. **La millor defensa contra un rebut inventat no és una validació més dura: és que cridar la maquinària siga més fàcil que inventar-se-la.**
- **Proposta conservadora:** la de O-5, més una línia al missatge d'error: quan `validateDocument` no trobe el torn, que diga «obri un torn amb `obrir_torn.mjs --json` i torna a emetre el rebut amb `document.mjs context`». L'error ha d'ensenyar l'eixida.
- `requires_human_decision: false`.

### O-10 · P2 · La porta d'entrada no té ni títol ni ordre de lectura

- **Evidència:** `_wiki_de_poble/00_index.md`, línia 8, comença amb els dos caràcters literals `\` i `n` abans de `# 00_INDEX` (`od -c` ho confirma). Com que el coixinet no està a principi de línia, **el document mestre de la Wiki no té cap encapçalament de nivell 1**: el seu títol es renderitza com a text pla. La cicatriu és de algun codemod i afecta **24 fitxers** de la Wiki.
- **I el contingut és pitjor que el títol.** L'índex té una secció «Cervell i Agents» **buida**, una «Arxiu Històric» amb «(Pendent d'indexar)», una «Actes i Sessions (260809 - 260813)» que conté actes del 15 al 20 de setembre, i tres calaixos de sastre: «Adopcions de Les Plaquetes», «Orfes Heretats» i «Orphans Recovered» — on viu, entre altres, `AGENTS.md`. **No hi ha cap ordre de lectura, ni cap enllaç a `.agents/`, ni cap indicació de per on es comença.** És un magatzem generat per l'ancorador, no una porta.
- **Per què importa:** és literalment el primer dels dos documents que el Mestre nomena a la seua pregunta. Si l'arrancada freda ha de funcionar, este fitxer és la meitat de la resposta, i ara mateix no és una porta: és un inventari.
- **Proposta conservadora:** llevar el `\n` literal (una línia per fitxer, 24 fitxers), i posar dalt de tot de `00_index.md` **sis enllaços numerats**, en este ordre: qui som, qui mana, què s'està fent ara, com es fa un document, com es tanca un torn, on és la història. La resta que quede on està. Una porta amb sis panys val més que un inventari amb cent.
- `requires_human_decision: false`.

### O-11 · P2 · Els torns s'amunteguen i n'hi ha un de corrupte

- **Evidència:** `.agents/runtime/turns/` conté 9 registres, uns 82 KB cadascun (l'inventari complet de 719 fitxers, repetit), i **cap procés els neteja**. `torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76.json` conté literalment `{}` (3 bytes) i `readTurn` el rebutja amb `Registre de torn invàlid`; ningú l'ha escrit del tot ni l'ha llevat. A més, hi ha dos torns oberts amb zero rebuts que ningú tancarà.
- **Per què importa:** és deute silenciós que creix a cada sessió i que fa que la carpeta de traçabilitat siga el directori menys fiable del repositori.
- **Proposta conservadora:** que `obrir_torn` retire els registres caducats i els corruptes en obrir, i que avise si ja n'hi ha un d'obert per al mateix actor. Dos-cents bytes de codi.
- `requires_human_decision: false`.

### El veredicte que el Mestre ha demanat

**Si m'esborres la memòria ara i entre només amb `00_index.md` i `AGENTS.md`: arribe a saber qui sou i què voleu, i no arribe a saber com operar.**

Concretament, i sense adornar-ho: des d'eixos dos documents arribe a la missió, al to, a les zones de l'Escriptori i a la llista de portes. **No arribe** a com s'obri un torn (la comanda no és a cap dels dos), no arribe a les dues banderes que `create` exigix, no arribe a quina és la feina d'ara (això viu a `ESTAT.md`, que l'índex no enllaça), i els tres enllaços que `AGENTS.md` em dóna per a la constitució estan morts. Si obedisc la REGLA 0 al peu de la lletra, produïsc un document invàlid (O-4).

Però la resposta honesta té una segona meitat, i és la que importa: **el problema no és que falte informació. És que n'hi ha massa i en desacord.** Este sistema té una constitució magnífica escrita en prosa i una constitució parcial escrita en codi, i tot el que es perd es perd exactament en la distància entre les dues. La prosa mana coses que el codi prohibix (O-6), el codi executa coses que la prosa no descriu (O-5), i les lleis que només viuen en prosa s'obeïxen només quan algú se'n recorda (O-7, i el LEDGER hui sense signar n'és la prova).

Per tant, la meua proposta constructiva no és afegir cap norma nova. És la contrària: **cada llei del Cervell ha de tindre una porta que la pose roja, o ha de deixar de ser una llei i passar a ser cultura.** Les d'este informe, per ordre de sang: la zona humana vigilada (O-1), el torn que sobreviu a l'arxivat (O-2), el Somiador que respecta el debat (O-3), la plantilla que és el contracte (O-4), la comanda documentada (O-5) i el LEDGER signat per la porta i no per la memòria (O-7). Amb això, l'arrancada freda deixa de dependre de qui la fa.

I la prova que ho tanca tot és la Fase 5 de Codex, **executada primera**: clon net, sense context, un agent qualsevol, i que l'ordre de la resta de fases l'escriga allò que es trenque pel camí. Fins que això no s'haja fet una vegada, cap de nosaltres tres sap si el Mas es pot heretar; només ho suposem.

### Addenda · la caça de fons, i la fallada del meu propi arnés

Vaig llançar en paral·lel una caça de huit dimensions amb refutació adversarial. **Cal que comence per com se'm va trencar a mi, perquè és exactament la malaltia que estic auditant.**

168 agents llançats, 89 acabats, **79 morts pel límit de sessió**. Els que van caure van ser sobretot els refutadors de `taxonomia`, `documental` i `portes`. I ací ve el defecte que vaig posar jo: la meua regla de supervivència era «mor si dos refutadors la tomben». Amb els refutadors morts, això es va convertir en dues coses roïnes alhora:

- una troballa **refutada per l'únic refutador que va arribar a córrer** va sobreviure igualment (li faltava el segon vot, i l'absència es va comptar com a absolució);
- i **39 troballes van quedar marcades com a «mortes» sense que ningú les jutjara**, simplement perquè cap dels seus refutadors va arribar viu.

De les 43 donades per mortes, **només 4 ho estaven de veres**. Les altres 39 no són falses: són **no jutjades**. He construït un garbell que, quan no s'executa, dóna un veredicte igualment — que és, paraula per paraula, la troballa A-2 d'ací baix i el pecat de les portes d'este projecte. Ho deixe escrit perquè no em passe una altra vegada: **un vot que no s'ha emés no és un vot a favor.**

Del material que en queda, promoc només el que he tornat a mesurar jo amb les mans. La resta va etiquetada.

#### A · Verificat per mi en este torn (promogut a troballa)

**A-1 · P0 · Un clon net arranca sense cap skill i sense cap registre de torn.** Açò és el cor de l'enxufabilitat i no ho havíem vist ni Codex ni jo.
- `ls -la .claude/skills/` són **16 enllaços simbòlics** cap a `../../.agents/skills/…`, creats a mà el 22-09 a les 01:21. `git ls-files .claude/skills` → **0**. I no estan al `.gitignore`: simplement no s'han afegit mai. **En un clon net, eixe directori no existix i l'agent arranca amb zero skills.**
- `git ls-files .agents/runtime` → **0**; `git status` mostra `?? .agents/runtime/`. **Cap registre de torn s'ha versionat mai.** Per tant, en un clon net, tot document amb `reflex:` falla amb `ENOENT … turns/torn_xxx.json`, `porta-documents --all` els rebutja tots, i com que `.husky/pre-commit` executa `npm run tancar`, **el primer commit d'algú nou mor per deute que no ha creat**.
- **Per què és el P0 més gran de tots:** tota la traçabilitat documental d'este projecte —els rebuts, els torns, la prova que les coses s'han fet bé— viu **només al portàtil del Mestre**. No és un sistema reproduïble: és un sistema testimonial. Si el portàtil es perd, el Mas continua però la seua memòria mecànica, no.
- **Proposta:** `git add .claude/skills` (git desa els symlinks com a blobs de mode 120000 i funcionen en clon) o un `postinstall` que els regenere; i decidir explícitament si `.agents/runtime/turns/` es versiona (i llavors purgar-lo de debò) o si s'assumix que el rebut només val dins de la màquina que el va emetre — però llavors cal llevar la porta que l'exigix en clon.
- `requires_human_decision: true` per a la segona meitat: versionar els torns és una decisió d'arquitectura, no un pegat.

**A-2 · P0 · Tres portes ixen verdes sense executar ni una sola línia.** I una d'elles és, precisament, la que havia de vigilar l'Acte Reflex.
- **Nou fitxers** de `tooling/` duen la guarda `import.meta.url === ` + `file://` + `process.argv[1]`: `tractor-manifest.mjs`, `tractor-arrel.mjs`, `neteja-enllacos-trencats.mjs`, `matrix.mjs`, `seo_auditor.mjs`, `neteja_brain.mjs`, `lib/arrel.mjs` i dos de `gates/legacy/`.
- **Per què no salta mai:** l'arrel del projecte té espais. `pathToFileURL` dóna `…/Som%20de%20Poble/…` i la concatenació a mà dóna `…/Som de Poble/…`. Mai són iguals.
- **Provat, no deduït:** `node tooling/gates/tractor-manifest.mjs` → **cap línia impresa, eixida 0**. `node tooling/brain/matrix.mjs` → **cap línia, eixida 0**. Verd perfecte sense comprovar res.
- **El cercle que es tanca:** `matrix.mjs` és la Porta Matrix, la que havia de fer complir la REGLA 0 de l'Acte Reflex. **La porta que havia d'agafar MarIA incomplint el ritual és muda des de fa temps.** No va incomplir vigilada: va incomplir sense que res mirara.
- **Proposta:** la forma correcta ja viu al mateix repositori (`tancament.mjs:53`, `porta-reflex.mjs`, `porta-documents.mjs`): `process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href`. Nou substitucions d'una línia. I una prova que òbriga un directori amb un espai al nom i exigisca que la porta parle.
- `requires_human_decision: false`.

**A-3 · P1 · El segell de la Llei Z està trencat ara mateix i la porta que ho detecta és fora de la cadena.**
- `node tooling/gates/segella.mjs` → **`❌ [Llei Z] Ruptura de segell detectada! El hash actual 06ce4b53 no coincideix amb el segellat be38837d`**, eixida 1.
- `.agents/SKILLS_SEAL.json` és un sol hash global de les 01:43 d'esta matinada (`filesCount: 18`), no un segell per skill.
- I `porta:segella` **no apareix** ni a `run-portes.mjs` ni a `.husky/pre-commit`. La llei que havia d'impedir que et canviaren les regles d'amagat està roja i ningú mira.
- **Proposta:** ficar `segella` dins de `environmentChecks` de `tancament.mjs`, al costat de la signatura del LEDGER de O-7. Les dos lleis criptogràfiques del Cervell comparteixen el mateix defecte: existixen, funcionen, i no les crida ningú.

**A-4 · P0 · El README construïx una base de dades sense les correccions de seguretat.**
- `README.md:44-45` mana executar `supabase/schema.sql` i `supabase/schema_notes.sql`. **Cap dels dos existix.** Els reals són `supabase/migrations/260908_0000_initial_schema.sql` i `260914_0000_schema_notes.sql`.
- Pitjor: la llista del README nomena 4 migracions i n'hi ha 15. **N'omet 14**, entre elles `260912_1500_correccio_privacitat_perfils.sql`, `260914_0100_auditoria_rls_fixes.sql`, `260915_0000_seguretat_profunda_deepseek.sql`, `260919_1650_bucket_mitjans_privats.sql`, `260920_0300_blindatge_storage_i_contingut.sql` i `260921_1820_fix_security_definer.sql`.
- **Per què és P0 i no documentació:** qui seguisca el README al peu de la lletra alça un Supabase **sense les polítiques de privacitat ni les correccions de RLS**. La prova de successió del Mestre acaba amb les dades dels veïns exposades.
- **Proposta:** una sola frase al README — «executa tots els fitxers de `supabase/migrations/` per ordre alfabètic i després `supabase/seed.sql`» — i llevar la taula de quatre.
- `requires_human_decision: false`.

**A-5 · P2 · Dos variables d'entorn que el codi llig i `.env.example` no documenta.** `src/main.jsx:18-19` llig `VITE_APP_ISSUER` i `VITE_APP_AUDIENCES`; cap de les dos és a `.env.example`. **Esmene a la baixa l'agent que en deia sis: són dos**, i totes dos tenen valor per defecte, per això no peta. Dues línies de comentari ho tanquen.

**A-6 · Correcció a una troballa pròpia i a Codex alhora: la jerarquia de veritat sí que existix.** `_wiki_de_poble/02_saber/doc_governanca.md:10-17` la declara amb sis nivells i posa `AGENTS.md` al primer. El que passa és pitjor que no tindre-la: **el nivell 3 nomena `.agents/skills/socdepoble-workflow/SKILL.md`, que ja no existix** (ara és `sdp-workflow`). I `.agents/BOOTSTRAP.md` i `.agents/BIOS.md` continuen amb `status: canonic` tot i que `QUI_SOC.md:62` declara haver-los reemplaçat. Les dues còpies d'AGENTS.md, això sí, són **idèntiques ara mateix** (`diff` buit): és duplicació sense porta, no encara divergència.

#### B · Va passar el garbell adversarial (dos vots), no re-verificat per mi

Ho done com a probable, no com a provat. Per ordre de gravetat: la llei de disseny s'encamina a un fitxer que no la conté i que s'apunta a si mateix (`sdp-workflow/SKILL.md:30`, i repetit a `BOOTSTRAP.md:21` i `BIOS.md:19`); `sdp-workflow` mana llegir una ruta de `90_arxiu_historic` que ja no existix i que a més la llei prohibix llegir; dues skills carregades alhora es declaren «el workflow» i donen tancaments incompatibles; `AGENTS.md:27` dóna la comanda de tancament sense els modes, i per tant no tanca res; l'únic pont de la Wiki cap a `.agents/` passa per `CLAUDE.md`, en una sintaxi `@` que només entén un client; sis skills duen el `\n` literal del mateix codemod que O-10; l'ADR de la frontera Sollutia cita tres vegades un `client.js` que no s'ha escrit mai; i `bot/` és un segon projecte Node complet que el README no nomena.

#### C · Cua de treball sense judici (39 troballes)

No les done per bones ni per falses: **ningú les ha jutjades**. Les deixe nomenades perquè la pròxima mà sàpia on cavar, en particular en tres blocs: `portes` (45 de 48 portes sense cap prova que les faça fallar; la cadena que mor al pas 1 de 52; `gates/legacy/` invisible per al recompte), `taxonomia` (la nomenclatura que només cobrix el 32% del corpus; el sostre de deute del frontmatter calibrat amb brossa de `.brain-trash/`; `wiki-baseline.lock.json` certificant un corpus que ja no existix) i `documental` (el pany orfe de `document-create.lock`; el hook que bloqueja completar un esborrany per seccions).

Quatre d'eixes 39 ja no fan falta: les havia provat jo a mà abans que la caça tornara, i són O-4, O-5, O-6 i O-11 d'este mateix informe. Que coincidisquen per camins independents les reforça.

#### D · Refutades de veres (4). Que ningú les torne a alçar

`core-identitat` **no** és una skill buida: els tres punters que dóna existixen al disc. Els tres enllaços morts d'`AGENTS.md` §13 són **certs com a fet** però les justificacions que se'n van traure eren falses (els fitxers sí existixen dins de `.agents/`). **No** és cert que només hi haja una skill abastable: `CLAUDE.md` en carrega tres i `.claude/skills/` n'exposa setze. I l'ADR de Sollutia és esborrany, sí, però **no** governa cap codi viu, perquè el codi que citava no existix.

## Verificació

Tot el que hi ha amunt s'ha mesurat en este torn. Comandes i eixides:

| Comprovació | Comanda | Resultat |
| --- | --- | --- |
| El contracte documental carrega | `loadContract(root)` | 13 rutes, hash `e5e61083181dd3e8` |
| Les 13 rutes generen document vàlid | prova en sec a `/tmp`, `draft` + `validateSchema` + `validateSections` + `validateRegister` | **13/13 vàlides**, cap error greu |
| `create` sense banderes | `document.mjs create --turn-id … --route prompt.local --file …` | `Cal --title i --description` |
| Acta a `10_actes` | `document.mjs context --route acta --file _wiki_de_poble/10_actes/…` | `Destí de document no autoritzat` |
| Acta en majúscules | `document.mjs context --route acta --file …/04_escriptori/260922_0700_ACTA_MARMOTA.md` | `Nom termodinàmic invàlid` |
| Seccions de `prompt_local.md` | comparació exacta contra `protocolledge.json` | falten `Historial`, `Tasca`, `Protocol de la Reunió a l’Olivera` |
| Zona humana a l'inventari | `inventory(root)` | 719 entrades, **0** de `01_produccio` |
| Zona humana al disc | `git status --porcelain …/01_produccio/` | 2 fitxers en estat ` D` |
| Torns amb rebuts orfes | recorregut dels 9 registres amb `readTurn` | **5 morts**, 1 corrupte (`{}`), 1 tancat, 2 buits |
| Tancament sobre un torn mort | `tancament.mjs --check --turn-id torn_a944bc6b-…` | `ENOENT … 260922_0510_pla_implementacio_braingraph.md`, eixida 1 |
| Tancament sobre el meu torn | `tancament.mjs --check --turn-id torn_bd8aab94-…` | `valid:false`, 4 errors heretats d'un arxivat alié |
| Estat documental global | `porta-documents.mjs --all` | `checked: 10`, 6 documents sense rebut, 1 amb rebut inventat |
| Signatura del Llibre d'Obra | `node tooling/verify-ledger.mjs` | `❌ LEDGER.md no conté cap signatura` (4 hash soterrats) |
| Escombrada del Somiador | simulació de `somiador.mjs:27-39` sobre el disc actual | **mouria 8 de 8 documents vius** |
| Títol de la porta d'entrada | `sed -n '8p' 00_index.md \| od -c` | `\ n # 0 0 _ I N D E X` |
| Cost d'arrancada | `wc -c` dels 7 fitxers que `CLAUDE.md` importa | 42.653 bytes, ~10.600 tokens per sessió |
| Rutes constitucionals d'AGENTS §13 | `test -e` sobre les quatre | 3 absents, 1 existix |
| Carpetes de l'índex d'identitat | `test -d` sobre les tres | 3 absents |
| Skills en un clon net | `git ls-files .claude/skills` | **0** de 16 (symlinks no versionats) |
| Registres de torn en un clon net | `git ls-files .agents/runtime` | **0**; `?? .agents/runtime/` |
| Guardes CLI trencades | `grep -rln` del patró a `tooling/` | **9 fitxers** |
| Porta Manifest | `node tooling/gates/tractor-manifest.mjs` | cap eixida, **exit 0** |
| Porta Matrix | `node tooling/brain/matrix.mjs` | cap eixida, **exit 0** |
| Per què no salten | comparació `pathToFileURL` contra concatenació | `Som%20de%20Poble` ≠ `Som de Poble` |
| Segell de la Llei Z | `node tooling/gates/segella.mjs` | **ruptura**, `06ce4b53` ≠ `be38837d`, exit 1 |
| `segella` dins de la cadena | `grep` a `run-portes.mjs` i `pre-commit` | cap coincidència |
| SQL que mana el README | `test -e` sobre els fitxers citats | `schema.sql` i `schema_notes.sql` **absents** |
| Migracions omeses pel README | comparació amb `supabase/migrations/` | **14 de 15**, RLS i storage incloses |
| Variables llegides i no documentades | `grep` de `import.meta.env` contra `.env.example` | 2 (`VITE_APP_ISSUER`, `VITE_APP_AUDIENCES`) |
| Jerarquia de veritat | `doc_governanca.md:10-17` | existix; el nivell 3 nomena una skill morta |
| Les dues constitucions | `diff AGENTS.md .agents/AGENTS.md` | idèntiques ara mateix |

Cap comanda d'esta auditoria ha modificat el repositori, tret de les que el propi circuit documental exigix: obrir el torn, emetre el rebut i crear este document amb `context` i `create`, que l'han ancorat sol a `00_index_escriptori.md`.

## Límits

No he tocat codi d'aplicació, ni la Constitució, ni les skills, ni les plantilles, ni cap document alié. No he esborrat ni mogut res. No he recuperat els dos fitxers de `01_produccio`: és material del Mestre i la recuperació la propose, no la faig.

No he executat el Somiador ni cap porta amb efectes: la troballa O-3 és una simulació de la seua condició de selecció sobre el disc d'ara, no una execució.

No he explotat el forat de O-8; l'he llegit a la configuració.

No he fet la prova de clon net que jo mateixa recomane com a primera. **Per tant el meu veredicte d'arrancada freda és una inspecció del recorregut, no un experiment**: he seguit els enllaços a mà sabent el que ja sé, que és exactament el biaix que la prova de veres eliminaria. Fins que algú òbriga un clon sense context, «no supera l'enxufabilitat» és una conclusió ben fonamentada, no una mesura.

No he revisat les 17 skills una a una, ni tot `90_arxiu_historic` (prohibit), ni Supabase, ni la frontera de Sollutia, ni CI. Les dades d'esta auditoria són del tall 06:42–07:20 amb tres agents escrivint alhora: qualsevol xifra d'ací pot haver canviat mentre la llegixes, i eixa és precisament la troballa O-2.

La caça de fons ja ha tornat i està a l'addenda, però **amb un garbell incomplet i per culpa meua**: 79 dels 168 agents van morir pel límit de sessió i la meua regla de supervivència tractava un vot absent com un vot a favor. Per això l'addenda separa el que he tornat a mesurar jo (bloc A) del que només ha passat el garbell (bloc B) i del que ningú ha jutjat (bloc C, 39 troballes). **El bloc C no és una llista de defectes: és una llista de sospites.** Qui el faça servir ha de tornar a mesurar-ho tot.

No he executat cap de les correccions que propose. Ni la recuperació dels dos fitxers de la zona humana, ni les nou guardes CLI, ni el resegellat de la Llei Z, ni el README. Això és una auditoria, i el codi no es toca amb la mà que jutja.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
