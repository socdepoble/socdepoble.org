---
type: informe
status: esborrany
description: Contrast adversarial del guió de Claude, skills i segell, torns, porta documental, imatges i evacuació històrica sense fabricar verds.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_29933990-052b-4c29-ae39-41b5c532ff35:f70eaeff-8d6f-4fc6-9f07-2c9c13c577f5
---
# Auditoria forense del sanejament de la Consola i Tauler Net

**Guió no certificat per a execució viva.** Frontmatters i hash verificats; falsa verificació per caducitat, timeout verd i aplicació parcial reproduïts; bypass staged corregit en la revisió posterior de la proposta. Cens íntegre de40skills,390imatges i pla de reparació del graf inclosos.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_29933990-052b-4c29-ae39-41b5c532ff35:f70eaeff-8d6f-4fc6-9f07-2c9c13c577f5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T00:36:12.585Z |
| Modificació | 2026-10-26T02:02:50+01:00 |
| Propietari | Codex |
| Aprovació humana | auditoria encarregada pel Mestre; sanejament no executat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · GPT-6 |
| Tokens consumits | mètrica de plataforma no disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-26T01:54:06+01:00: informe forense consolidat. Tres carrils independents:40skills/segell, torns/parsers/porta documental i imatges; coordinació: guió, Consola viva, SCC/arxiu i contrast de Gemini. Proposta fixada pel manifest de16fitxers després d'incorporar el pas3b.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen sota la Llei del Tauler Net

**NO certifique `sanejament_consola.sh` per a executar-lo tal com està sobre l'arbre viu.** La reparació de frontmatters, la reconstrucció del segell proposat i el canvi del parser de skills són verificables i aprofitables. El paquet complet, però, activa una falsa verificació de torns i incorpora un camí nou de fals verd encara vigent. A més, una fallada a mitjan procés deixa canvis parcials. Cal corregir estes peces abans d'una execució de sanejament que es puga certificar.

Això no és un nou «10/10 amb reserves». El tauler viu està en roig i el dictamen global és **parcial/no certificat**. Cap sanejament ni resegellat s'ha executat sobre el repositori. Sí s'han obert els registres documentals propis necessaris per a esta auditoria i s'han fet experiments confinats en còpies temporals.

**Tall auditat:** HEAD `cd1bb28a4d640d0cfe9aa077c87842c68931cb8f`, branca `backup-notes-publish`. Les fonts de Claude viuen al directori mare, `../_investigacio_ia_de_poble/261026_0110_consola_claude/`, no dins del repositori. La proposta s'ha modificat durant la primera lectura: ha incorporat el pas3b d'exempció del Llibre i els seus tests. El primer tall coherent té **16fitxers**, guió SHA-256 **`8ef2540fea6150ac9f0b8c2863b98257d846abe878c0b5c86d2c672bacf47975`** (`/tmp/sdp0145-proposal-snapshot.json`). Després s’han revisat les3fonts canviades: guió **`93b668e9de957a5d679055bbc1b9e84f771a2c47e59a99fc0d9a18146db99988`**, README i exempció; el nou patch d’exempció és **`655021f3e63f0cfd01d10f3239f5e281530d65e176edc5c5ec0aafc1da932f48`**. Snapshot nou: `/tmp/sdp0145-proposal-revised-snapshot.json`. C0145-03 principal queda corregit en proposta; C0145-01/02/04/05/06 continuen oberts. No s’aproven automàticament versions futures.

### Matriu de conformitat de requeriments (MCR)

| Requeriment | Estat | Evidència | Reserva o impediment |
|---|---|---|---|
| Diagnòstic de la Consola viva | [FET] | Navegador real, AX i captura; CLI del Mapa concorda | 7 avisos alts; pols il·legible; matriu del govern sense font; no està neta. |
| Frontmatters ≤220/tags d'esquema | [FET] en còpia | 37/40 →40/40; helpers exactes, cos conservat | La conformitat de metadades no resol contradiccions del cos. |
| Origen i hash nou de segell | [FET] verificació | Anterior reconstruït; només higiene divergent; hash7df7a6fc reproduït | Cap `--update` viu executat. El hash no protegix els scripts del paquet. |
| Ordre frontmatter → catàleg → segell | [FET] ordre del guió | Passos2/4 precedixen5 | Falta transacció global; ASSAIG no està confinat. |
| Caducitat sense fabricar verificació | [NO FET] | C0145-01, porta staged passa després d'expire-close | El pas6 executaria el tractor defectuós heretat. |
| Exclusió mútua i validació de torns | [NO FET] | C0145-02, canvi concurrent sobreescrit | Comprovar l'existència d'un lock no és adquirir-lo. |
| Llibre només esquema/sense rebut | [FET] staged/ancoratge; [PARCIAL] abast | C0145-03 principal corregit en revisió93b;6casos independents | Encara eximix el mateix basename dins10_actes; concretar l’abast canònic. |
| Parser del pols | [FET] cas causal | Claus amb punt i bloc escalar/lists corregits | No s'ha instal·lat el pegat ni acreditat el pols viu després. |
| Portes reals sense fals verd per timeout | [NO FET] | C0145-04, procés matat als20s representat1/1 | Cal distingir eixida completada de stdout parcial. |
| Guió recuperable i segur com a assaig | [NO FET] | C0145-05/06, cinc fonts canviades després de fallar | Preflight global, snapshot/CAS i recuperació pendents. |
| Cens de les40 skills | [FET] auditoria | Lectura íntegra i taula individual de les40 | Poda/rectificació no aplicada. Text procedimental no equival a motor executable. |
|390 imatges i suposats149 òrfens | [FET] contrast / [PARCIAL] traçabilitat |390 físiques,389 classificades;149 no reproduïts | Consumidors dinàmics/externs impedixen afirmar orfandat global. |
| Llei d'Imatge Única | [PARCIAL] | Reutilitzacions concretes i proves actuals localitzades | Canvi de política, usos inversos i recursos propis pendents. |
| Evacuació històrica | [FET] diagnòstic/pla / [NO FET] moviment |120 actes;1123LINK_INVALID, només59 des d'actes | Un trasllat per data no elimina945errors d'índex ni103del Llibre. |
| Informe, relleus i portes de tancament | [FET] auditoria; [PARCIAL] govern | Informe validat; Llibre/ESTAT/LEDGER actualitzats; tancament1431incidències | No es força un verd global ni es purga historial. |

### Consola real: allò que es veu i allò que no està connectat

En `http://localhost:3340/consola`, el navegador mostra **«La vigilància del cervell està trencada»**, una skill fora/divergent del segell, **108 torns caducats**, **7 avisos alts**,17avisos totals,333nodes/428arestes i dos tasques d'higiene mortes. El pols diu **«No s’han pogut llegir les dades»**. L'índex d'entrades/eixides pot estar «En ordre» mentre altres panells estan rojos: no és una certificació del sistema.

Els panells de requeriments, balanç i comunicació diuen **«Encara no hi ha cap matriu connectada»**. La certificació mostra0decisions en este navegador. El Mapa descriu0agents atòmics,3arnesos,5candats pendents d'acreditació i2llocs amb faena sense lector. Estes dades delimiten què està a mitges; ni el guió ni un segell40/40 connecten per si sols la matriu o acrediten els consumidors dels hooks.

La CLI de només lectura concorda: segell39/40,frontmatters37/40,cens38/40,conformitat-documentalN/A i cadena-portesN/A. El canvi proposat a mètriques és pertinent, però només si conserva els errors de procés com a errors/N/A. Una tasca que no ha deixat evidència d'execució continua sense acreditar; no es dona per viva només perquè una programació diga05:30. No s'ha simulat launchd ni fabricat una execució d'higiene.

El navegador sí que ha arribat a la Consola; els dos intents de curl des del sandbox no pogueren connectar al port. No s'ha confós eixe límit del terminal amb una caiguda del servidor. No s'han llegit dades privades de sessió ni l'env.

### C0145-01 · P1 · Expirar un torn fabrica una verificació que la porta documental accepta

**Font heretada activada pel pas6:** `tooling/session/saneja_torns_caducats.mjs:104-117`. Si no hi havia verification, el tractor calcula els hashes presents i crea `verification = {files, checks:['expire-close']}`; després marca el torn closed. `porta-documents.mjs:28-31` tracta closed+verification.files com a rebut versionable i `turns.mjs:219` compara eixos hashes.

**Reproducció sobre el codi viu, únicament en fixture temporal:** document amb rebut, **sense pla ni relleu ni verificació**, porta staged inicial roja. Després de sanejar la caducitat i preparar el registre en la fixture, la mateixa porta retorna **valid:true,checked:2,errors:[]**. El nou checks és només expire-close; el pla continua null. El coordinador ha reexecutat la prova i n'ha confirmat el resultat. Logs `/tmp/sdp0145-root-torns.log`, marcador EXPIRE-SEAL.

La severitat és de governança: converteix l'abandó en una aparença de verificació satisfactòria, contrària al tancament ordinari que exigix pla, relleu i portes. No s'ha executat el pas sobre els108torns reals. En el dry-run:400registres,108candidats,277tancats i15vius; els108candidats no tenien verification i59tampoc pla.107era un tall anterior, no un nombre immutable.

**Correcció conservadora:** caducitat i verificació han de ser fets separats. Registrar la baixa/abandó i el motiu, sense crear ni recalcular verification.files. Un torn caducat pendent de regularització ha de continuar visible com a tal, i una porta no ha de considerar-lo un tancament verificat. Si un document ha canviat respecte d'una verificació legítima, s'ha de reverificar amb el flux normal; no actualitzar-ne la prova automàticament per fer-la quadrar. `requires_human_decision: false` per eliminar la falsa prova; la política de retenció es manté explícita.

### C0145-02 · P2 · El tractor de caducitat no adquirix el lock ni valida el registre

**Font:** `saneja_torns_caducats.mjs:22,69-76,91-120`. Mira si existix `${fitxer}.lock`, llig el JSON i més tard el reemplaça per rename. No crea el lock ni rellegix sota exclusió/CAS. L'escriptura atòmica d'un fitxer evita fragments, però no evita perdre l'actualització d'una altra operació.

**PoC:** després de la lectura s'introduïx una mutació vàlida i un lock nou. El sanejament els ignora i sobreescriu el canvi: concurrentMarker desapareix i el lock continua al disc. Un altre control amb nom torn_dead.json, schema not-a-turn, estat quarantined i data il·legible també acaba closed. JSON il·legible s'omet silenciosament. Les proves roden només en fixtures, amb control positiu que dry-run conserva bytes i respecta els locks ja presents.

**Proposta:** reutilitzar el bloqueig i la validació canònics de torn, rellegir dins del lock, comprovar identitat/schema/estat/caducitat i fer CAS abans del rename. Un registre corrupte és un error/quarantena amb recompte explícit; no un èxit de neteja. Validar també que les rutes de rebuts siguen canòniques abans de llegir-les. Evidència EXPIRE-RACE/EXPIRE-SCHEMA a `/tmp/sdp0145-root-torns.log`. `requires_human_decision: false`.

### C0145-03 · P2 històric, corregit en proposta revisada · Exempció i contracte de staging

**Actualització després de l’edició concurrent:** el bypass staged principal descrit davall **ja està corregit en la proposta**, juntament amb el cas de superficies malformada, tipus/índexs/àlies i pèrdua de mètrica d’ancoratge. La descripció i els logs antics es conserven com a traça de la primera revisió, no com a defecte encara atribuït a la nova.

**Nova proposta:** `pegats/exempts_de_rebut.patch`, afegits a `core.mjs` i `turns.mjs`. L'exempció consulta taxonomia.json del disc, combina qualsevol basename exempt amb qualsevol superfície, i retorna només validateSchema. Però la porta staged compara contra el disc schema/router/plantilles, **no taxonomia.json**.

**PoC reexecutada:** una auditoria formal staged sense rebut falla. Afegir el seu nom a exempts **només al working tree**, sense preparar eixa excepció a l'índex, fa passar el document staged. També s'accepta el nom del Llibre dins10_actes, fora del seu lloc canònic, i una superficies malformada com a cadena pot activar includes per subcadena. Els controls amb tags invàlids i documents normals/nested continuen rojos, cosa que delimita el bypass. Evidència EXEMPT-STAGED/CROSS/SCHEMA a `/tmp/sdp0145-root-exempcio.log`.

La decisió del Mestre és clara i és legítima: **el Llibre permanent canònic es valida per esquema, sense inventar un rebut termodinàmic**. El defecte és generalitzar-la amb una configuració no validada ni vinculada al contracte versionat. No cal tornar a preguntar el mateix acord.

**Proposta:** representar les excepcions per ruta canònica completa, validar-ne l'estructura, i fer que staging/base/snapshots usen la mateixa versió de la taxonomia que es certifica. Mantindre única l'autoritat del contracte; evitar una nova llista divergent. La projecció de vigilància ha d'excloure el Llibre només del denominador de rebuts: el patch actual el lleva de documents i perd també la seua comprovació d'ancoratge en aquella mètrica. El Llibre ha de continuar requerint àncora i esquema vàlids. `requires_human_decision: false` per implementar correctament l'excepció ja autoritzada; qualsevol ampliació a altres documents requerix justificació pròpia.

**Acceptació de la revisió nova:** s'ha aplicat el diff real (9fitxers) en còpia temporal i només s'han encaminat imports, sense reescriure la implementació. El coordinador reexecuta6casos: la taxonomia canviada només al working tree torna a ser rebutjada per discrepància amb staging; schema/superficies incorrectes fallen tancat; tipus prompt/índexs/nested/àlies amb nom diferent no hereten exempció; Llibre vàlid passa i esquema invàlid falla; ambRebut:null conserva l'avís de falta d'àncora. Log `/tmp/sdp0145-root-exempcio-current.log`.

**Residual P3 d'abast:** `_wiki_de_poble/10_actes/03_llibre_mestre_tasques_i_idees.md` continua exempt amb type:document i esquema vàlid, perquè el contracte seguix combinant basename i superfícies. No és el bypass staged anterior; cal dir si es vol eixe abast o limitar-lo a la ruta permanent autoritzada. Esta reserva no altera el rebuig global, basat en les altres fallades reproduïdes.

### C0145-04 · P2 · Un procés expirat pot convertir-se en1/1verd

**Nova proposta:** `pegats/tooling_brain_mapa-consola.mjs.patch:52-59`, eixidaDePorta. El catch recupera error.stdout també després del timeout, i el parseja sense exigir que el procés haja acabat normalment.

**PoC real de20segons:** un executable de fixture escriu `{valid:true,checked:1,errors:[]}` i queda penjat. execFileSync el mata als20.004ms; el helper proposat conserva el JSON i metricaDePorta el presenta **1/1verd**. Contradiu el seu comentari que en esgotar el temps torna null. El coordinador l'ha reexecutat; `/tmp/sdp0145-root-parser-metrics.log`, METRIC-TIMEOUT.

**Proposta:** llegir estat de procés amb spawnSync o equivalent; error de llançament, límit de buffer, timeout o senyal → font fallida/null, mai stdout parcial acreditat. Acceptar exit1 només com a resultat complet i coherent de porta roja; rebutjar valid:true amb exitnozero. Validar DTO i recomptes abans de calcular fraccions. A la UI, separar N/A/font fallida de verd. Evitar executar dos processos síncrons de fins20s en el camí crític de cada petició del dev server; cache/worker amb frescor explícita és una millora de disponibilitat, no una prova de càrrega executada ací. `requires_human_decision: false`.

### C0145-05 · P2 · El guió pot deixar cinc fitxers editats després d'una fallada

`sanejament_consola.sh:41-57` escriu skills i aplica cada pegat després de comprovar-lo individualment. El conjunt no és una transacció. En una còpia Git mínima, amb el segon pegat sintèticament invàlid, la primera comprovació passa i la següent falla: exit1, **quatre SKILL.md i consola-iaia.mjs ja modificats**, segell anterior conservat. No s'ha fet cap d'estes escriptures al repositori viu.

Evidència `/tmp/sdp0145-transaction-poc.json` i fixture reproduïble `/tmp/sdp0145-transaction-poc.py`. El primer experiment es féu abans del pas3b; s’ha repetit després sobre el guió de16fitxers del tall congelat, amb el mateix resultat. És una prova injectada de recuperació, no una afirmació que el pegat original siga invàlid.

**Proposta:** calcular totes les edicions i assajar la seqüència completa sobre una còpia abans de tocar el viu; manifest exacte de paths, hashes previs i resultants; excloure concurrència real, fer CAS de cada entrada i deixar un registre de recuperació. Una fallada ha d'explicar què s'ha escrit i com recuperar-ho. Reexecució segura: reconéixer l'estat ja aplicat/idempotent o reprendre un estat preparat, no exigir cegament el text abans en fitxers mig editats. No resegellar per tapar una aplicació incompleta. `requires_human_decision: false` per la robustesa tècnica dins l'abast aprovat.

### C0145-06 · P2 · ASSAIG pot actuar sobre l'arrel viva i el preflight no cobreix totes les eixides

`sanejament_consola.sh:13,36,71` admet ASSAIG=1 sense argument: usa per defecte l'arrel viva, omet la revisió humana i no compara el hash nou amb l'esperat de l'assaig. **No s'ha executat esta combinació.** És conseqüència directa del flux de control, no una demostració d'atac remot. La variable SEGELL_ESPERAT també és substituïble per l'entorn: documentar o eliminar esta flexibilitat en el camí real.

El preflight27 no enumera totes les eixides: entre elles el Llibre que escriu el pas3b, manifest.yaml, skills_index.json, SKILLS_SEAL.json i els enllaços de Claude. Regenerar fitxers derivats és correcte, però no acredita que ningú tinga canvis en tots els paths que es reemplaçaran. Els locks de mutation només es miren al principi; el CAS del segell protegix41Markdown, no totes les fonts de consola ni el Llibre.

**Proposta:** mode d'assaig amb arrel obligatòria i prova de confinament fora de l'arrel viva; no acceptar una variable qualsevol com a autorització d'ometre revisió. Manifest complet de lectures/escriptures, hashes previs i exclusió real. Per als enllaços, comprovar tipus i destí, inclosos symlinks trencats, no només -e. Un segell correcte no substituïx eixes garanties. `requires_human_decision: false`.

### Allò que sí queda verificat del treball de Claude

| Peça | Resultat verificat |
|---|---|
| Salfumant | Descripció intacta211caràcters; tags vàlids i retirada de la ruta d'escriptura prohibida; esquema correcte. |
| Seguretat | Descripció242→197caràcters; cos tècnic conservat. |
| Vigilant | Descripció430→218; tags d'enum; cos conservat. |
| Frontmatters totals |37/40→40/40 en còpia. No es perd substància del cos, però tampoc es resol automàticament. |
| Parser del pols | Substituïx el parser mínim que no entenia contracte.llig/escriu per parseFrontmatter compartit. Descripcions deixen de ser llistes; controls amb punts/blocs vàlids passen. |
| Mencions URI | Excloure sdp-media:// com a skill és pertinent i porta regressió; no és un executable fantasma. |
| Segell anterior |4a1546c39b2589515238514af00c375eb79d29abf54eabb06acb96f81ebe89ae, reconstruït exactament desfent només la skill d'higiene de1c6bd64cd en còpia. |
| Segell viu |6faf0aa1d140447a8dc8c8a2660910367a3180c829808707952f358175821e81; únic SKILL divergent: core-higiene-escriptori. |
| Segell proposat |**7df7a6fc4c997a35f0f89542233eacd79266d2d080e7724b4fbb561538afa97a**, reproduït després dels helpers i del catàleg;41Markdown =40skills+índex. |

L'ordre2→4→5 sí corregix els frontmatters i regenera el catàleg abans de resegellar. En mode real el CAS compara el hash nou amb l'esperat i el segell anterior amb **4a1546c3**, no amb6faf0aa1. El hash és legítim per a eixa superfície exacta revisada; **no prova** que les seues regles siguen coherents ni que els scripts/pegats no tinguen defectes. Cal incorporar les rectificacions de contingut que es decidisquen i calcular un altre hash revisable si canvia la superfície.

### Mòdul9: contradiccions i què és un tractor real

El cens complet de les40skills va a l'annex següent. S'ha distingit procediment manual, motor local, codi de producte i API externa; un nom citat en un test no transforma una skill en eina executable. No s'han classificat com a falses per no tindre scripts dins de la seua pròpia carpeta: una checklist humana pot ser útil si declara què fa i on acaba.

Prioritats concretes de poda:

1. **Fronteres i efectes:** l'exemple find/sed de wiki-propagar-veritat no exclou01_produccio, zona humana. core-portaveu/core-neteja-brossa/estrategia/wiki-busca-skills descriuen escriptures que els seus contractes no enumeren. Corregir exemples i contractes abans d'automatitzar-los; no executar-los per comprovar el dany.
2. **Veritat humana:** core-telemetria-huma assumix treball continu perquè no consta dormir i prescriu qualitat100% per una idea brillant. No és telemetria observada i contradiu wiki-cicle-de-vida. Substituir inferència per dada voluntària, data/font i desconegut quan no hi ha evidència.
3. **Cicle de vida:** Salfumant manté purga/arxiu per setmanes/mes; higiene mana arxiu per commit o nou pla, mentre cicle de vida i BIOS conserven el que té consumidor viu. Unificar en consum acreditat i autoritat d'arxivament; no purgar per edat ni confondre comés amb consumit.
4. **Operació:** Gauntlet fixa sis iteracions i direcció autònoma huit; les API manage_task/schedule depenen del client. Una sola política de límits, disposició i parada. L'estricta brevetat de triggers corregeix «crear una foto» però perd REAperWhatsApp/RLSpolicies; Chrome navegador encara activa UniversalPage. Cal prova de frases positives i negatives.
5. **Disseny:** UniversalPage ordena rgba/ombra literals que Pedra Seca prohibix; AppGridShell repeteix barra/safe area. La norma visual ha de viure en una font amb referència, no en tres còpies que puguen divergir.
6. **Referències i comandes:** UniversalToolbar està en una altra ruta; publicarNota.js no existix; Consell usa membres.join sobre objectes i retorna12[object Object]. Corregir-ho amb proves de contracte útils, no amb una asserció que replique la cadena errònia.

**Una hipòtesi documental que sí s'ha verificat externament:** el canvi de concessions de Supabase amb aplicació als projectes existents el30/10/2026 està publicat al [changelog oficial](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). No s'ha de tractar la data com inventada; sí cal lligar la skill a la font, concedir només els privilegis necessaris i comprovar les migracions del projecte. Esta auditoria no executa SQL ni certifica el servidor.


### Cens complet de les 40 skills · tall 261026_0145

Lectura íntegra de cada `SKILL.md` i comprovació d'existència de les rutes de contracte, codi citat i scripts npm. Cada nom de la primera columna correspon a `.agents/skills/NOM/SKILL.md`; les línies són les del font viu auditat. «Procediment manual» és una classificació, no una troballa per si mateixa. «Codi de producte» identifica una referència real, sense atribuir-li un tractor automàtic propi. No s'ha executat cap sanejament sobre el repositori. No s'ha llegit l'arxiu fred ni cap secret.

| # | Skill i línies clau | Naturalesa real | Eina o codi citat comprovat existent | Referències trencades, límits o desviacions concretes |
|---|---|---|---|---|
| 1 | `core-automillora:17–51` | Procediment de coordinació i autoreflexió, amb guàrdia compartida | `npm run guarda:estat` → `tooling/gates/guarda-nocturna.mjs`; `memoria_aprenentatges.md` existent | `manage_task kill` és una API externa, sense executable local garantit. Duplica rols de `core-consell-i-colmena` i parada de `core-gauntlet-loop`; els paràgrafs filosòfics no són automatització. |
| 2 | `core-comprensio-reflexiva:25–40` | Procediment manual de preacció | AGENTS, genotip i Escriptori dels contractes existixen; cap executable propi citat | Diu «SEMPRE» però el router només l'assenyala amb quatre frases concretes; consultar-la o carregar-la no és una comprovació mecànica de comprensió. |
| 3 | `core-consell-i-colmena:29–37,58–66` | Coordinació manual amb una comanda Node concreta | `.agents/consell.json` existeix; la comanda `node -e` és executable | **Comanda incorrecta:** `membres.join(', ')` retorna dotze `[object Object]`, perquè `membres` conté objectes. Els saldos i restabliments de setembre de `:58–66` són història incrustada en una skill activa. |
| 4 | `core-context-panic:28–45` | Fusible procedimental amb hook real | `tooling/gates/fatiga-hook.mjs` existent | La frase fixa dels 150–180 artefactes no representa necessàriament els llindars de l'efímer. El mecanisme compta senyals de context, no mesura estat mèdic de la persona. |
| 5 | `core-direccio-autonoma:26–53` | Coordinació procedimental amb guàrdia real | `guarda:inici`, `guarda:estat`, `guarda:aturar` existixen i apunten a `tooling/gates/guarda-nocturna.mjs` | Autorització «absolutament tots els permisos» no substituïx les fronteres del BIOS. `:37,43` permet huit iteracions; `core-gauntlet-loop:85` fixa màxim sis. `schedule/manage_task` depén del client, no és una eina local garantida. |
| 6 | `core-edicio-segura:22–29` | Checklist manual d'edició i context React | `package.json` té `test` → Vitest; índex de l'Escriptori existent | La regla `:22` congela tot codi quan hi ha qualsevol prompt/pla/auditoria viu, mentre el workflow prepara just eixos documents per a implementar; no distingix autorització prèvia ni propietat de fitxers. No hi ha tractor específic que implemente eixa congelació. |
| 7 | `core-empaquetat-wp:34–47` | Procediment amb eines locals d'empaquetat i retenció | `wordpress-plugin/eines/empaqueta.mjs`, `tooling/higiene/cron_higiene.mjs` existixen | La destinació «EXCLUSIVAMENT wordpress-plugin/builds/» no inclou el mode `--lleuger`, que el mateix empaquetador envia a `../_builds_de_poble/wordpress/` (`empaqueta.mjs:829,866`). El contracte d'escriptura només enumera `package.json`, no les eixides que descriu el cos. |
| 8 | `core-estrategia-ia:24–36` | Procediment amb registre de consum executable | `tooling/brain/tracker_consum.mjs` i `_wiki_de_poble/10_metriques/consum_ia.csv` existixen | El contracte d'escriptura només diu Escriptori però el procediment obliga a escriure al CSV de mètriques. Les etiquetes comercials i els percentatges d'exemple no acrediten quota actual. |
| 9 | `core-gauntlet-loop:34–41,72–88` | Auditoria manual/MCR amb guàrdia local; REA depén d'eines del client | `tooling/gates/guarda-nocturna.mjs`; `npm run guarda:aturar` existent | `src/sections/notes/Editor.jsx:45` és un exemple inexistent, no un camí operatiu verificat. `:53` diu no tornar a tocar cap FET, sense excepció de regressió. Màxim sis iteracions contradictori amb huit de direcció autònoma. El canvi de triggers elimina falsos positius i també invocacions abreujades REA. |
| 10 | `core-higiene-escriptori:56–71,77–93` | Procediment extens amb portes locals | `tooling/gates/porta-olivera.mjs`, `tooling/gates/tractor-orfandat.mjs`; scripts npm corresponents existixen | `:56–58` conserva consumidors pendents però `:83–86,111` restringix la taula a tres tipus i força arxiu en superar pla/commit. És l'únic fitxer que divergeix del manifest segellat; el canvi és el de `1c6bd64cd`. |
| 11 | `core-identitat:30–40` | Arrencada manual amb porta local compartida | `personalitat_iaia.md`, `.agents/PROTOCOL_PETORRETA.md`, `tooling/gates/porta-olivera.mjs` existixen | El cos ordena lectures no enumerades totes al contracte. La revisió de la taula és decisió humana/agent, no equival a exit 0 de la porta. |
| 12 | `core-identitat-visual:24–45` | Instrucció manual de generació gràfica | `identitat_visual.md`, `src/css/index.css` existixen; `generate_image` és una API externa | No és un generador local. El nom d'API i la disponibilitat depenen del client. El contingut d'identitat i estil duplica coneixement de la Wiki; no hi ha motor que verifique cares amables o humor. |
| 13 | `core-informes-pdf:23–35` | Procediment amb renderer local real | `tooling/pdf/render_pdf.sh` existeix, accepta `--replace` i usa Chromium | La skill suggerix `--display-header-footer`, però el wrapper només accepta `--replace` i dos paths; internament passa `--no-pdf-header-footer`. L'alternativa CSS de la mateixa línia queda disponible; no afirmar que la bandera suggerida és implementada. |
| 14 | `core-llegibilitat-text:24–42` | Checklist editorial manual | Cita `PageFrame`/`UniversalPage`, components reals; cap executable d'auditoria propi | La correcció autònoma de `:42` ha de quedar subordinada a l'abast i la Llei del Píxel del workflow. La frontera Markdown es concreta en `core-maquetacio-markdown`, no és una segona porta executable. |
| 15 | `core-maquetacio-markdown:82–91` | Checklist amb validadors locals parcials | `tooling/wiki/tractor-frontmatter.mjs`, `tooling/gates/tractor-registre.mjs`, `tooling/brain/cataleg_skills.mjs`; `src/sections/wiki-de-poble/parseMarkdown.js` existixen | Les portes comproven esquema/registre/catàleg; no acrediten automàticament totes les R1–R22 ni qualitat de prosa. `:67` prohibix filosofia a skills, contràriament a diversos cossos actuals. |
| 16 | `core-memoria-historica:24–29` | Procediment manual delegat a cicle de vida | `memoria_aprenentatges.md`, `wiki-cicle-de-vida/SKILL.md` existixen | Exigix decisió explícita i prohibix automatitzar arxiu. La destinació externa canònica `../_arxiu_wiki_de_poble/` ha de distingir-se de l'arxiu operatiu intern; no hi ha eina de trasllat pròpia ací. |
| 17 | `core-neteja-brossa:24–40` | Procediment amb tractor local real | `tooling/higiene/neteja_brossa_arrel.mjs` existent, simulació/`--aplica` documentats al codi | El text delimita fitxers solts no versionats i moviment, no supressió. El contracte d'escriptura enumera Escriptori però l'eina mou a `.sdp-paperera/`; falta fer coherent la declaració d'efectes. |
| 18 | `core-portaveu-institucional:29–50` | Propagació editorial manual sobre codi i textos | `src/sections/text/pageContent.js`, `README.md`, `wordpress-plugin/readme.txt` existixen | El contracte d'escriptura enumera només `_wiki_de_poble/00_index.md`; cap dels tres fitxers que obliga a editar apareix al contracte. Duplica part del format de `core-llegibilitat-text`. |
| 19 | `core-restauracio-segellada:79–98,136–146` | Procediment amb eines locals especialitzades | `tooling/brain/ancora.mjs`, `tooling/brain/desenterrar.mjs` existixen | La fórmula informal de segell de `:61` és anterior al domini v2 del codi (`desenterrar.mjs:43`); el procediment mana usar el segell emés i no inventar-lo. No s'ha executat restauració. |
| 20 | `core-salfumant-radical:63–65,99–104` | Doctrina/auditoria manual; la proposta afegix una porta compartida | Fonts de contracte existixen; en la proposta s'afegix `tooling/gates/porta-olivera.mjs`, existent | L'edició proposta arregla tags/contracte però conserva «fa més d'un mes» → arxiu/purga i «setmanes» → arxiu, incompatibles amb no purgar per edat ni esborrar sense decisió. Olivera només arriba al primer nivell de la taula; afegir-ne el nom no automatitza una auditoria de tot el repo. |
| 21 | `core-seguretat-audit:53–61,99–111` | Checklist de seguretat amb dependència externa i referències a codi real | `src/data/backendPort.js`, `src/utils/sanitize.js`, `supabase/migrations/` existixen; `/claude-security` és extern | **Referència trencada:** `src/data/supabase/publicarNota.js` no existeix. Els escàners anomenats viuen a `src/config/contentHelpers.js` i `src/sections/profile/DetallMultimedia.jsx`. El plugin extern no és un tractor local certificat. La data de mandat Supabase de `:83` és una afirmació documental, no una comprovació local. |
| 22 | `core-taxonomia-estricta:23–31` | Procediment manual d'encaminament documental | `.agents/protocolledge.json`, `tooling/wiki/schema.json`, plantilla `pla_implementacio.md` existixen | Duplica el flux de `wiki-documentacio-i-reflex` sense citar el CLI `document.mjs` en els passos; l'esquema no prova comprensió ni imposa per si sol totes les amenaces de bloqueig descrites. |
| 23 | `core-tecniques-investigacio:29–34` | Procediment manual d'investigació | AGENTS i índex Wiki existixen; cap executable propi citat | Exigix seleccionar i inspeccionar el tractor real de cada cas, sense afirmar que una eina universal faça eixe raonament. No hi ha referència operativa trencada detectada. |
| 24 | `core-telemetria-huma:24–35,39–43` | Inferència i registre manuals, sense mesurador propi | `.agents/ESTAT.md` i rutes documentals existixen; cap instrument de telemetria humana citat | `:27` assumix treball continu si no consta dormir i `:35` prescriu qualitat 100% per una idea brillant. No són mètriques observades i xoquen amb `wiki-cicle-de-vida:36` («No inventes mètriques… d'estat humà»). |
| 25 | `core-temps-termodinamic:33–41` | Procediment manual amb obertura de torn real | `tooling/gates/obrir_torn.mjs` existent; Olivera citada per basename i existent | `:38` tracta qualsevol diferència entre hora present i marca del document com a motiu per no continuar-lo: pot caducar de fet documentació viva només pel pas dels minuts. Contrasta amb retenció per consumidor i actualització d'un document vigent. |
| 26 | `sdp-app-grid-shell:20–58` | Especificació de producte sobre codi real | `src/components/layout/AppGridShell.jsx`, `src/css/index.css` existixen | Cap tractor executable propi. `:46–58` duplica les regles de barra negra/safe area de `sdp-pedra-seca:107–111`; cal una referència única per evitar deriva. |
| 27 | `sdp-calendari-agricola:20–35` | Especificació prospectiva de producte i passos manuals | `sdp-pedra-seca/SKILL.md`, genotip existixen; cap component/servei agrícola concret citat | El text diu «permetrà» i ordena dissenyar dades/SMS mock: no acredita un calendari agrícola/SMS en servei. Duplicat de cas d'ús en `sdp-casos-us-essencials:43–49`. |
| 28 | `sdp-casos-us-essencials:25–65` | Catàleg de casos d'ús i memòria de producte | Skills Pedra Seca/identitat i genotip existixen; cita `UniversalCard` com a patró real | No és un tractor ni una prova d'implementació de menjar/cures/SMS/notes. Repetix especificació agrícola i contingut de memòria de producte que el BIOS situa a la Wiki. |
| 29 | `sdp-clon-loiverse:23–42` | Directriu visual manual de producte | `src/data/backendPort.js` i skill Pedra Seca existixen | Cap component TPV concret ni eina REA concreta citats; les captures són dependència humana. El contracte d'escriptura declara el port neutral per a una tasca principalment visual, sense declarar frontend. |
| 30 | `sdp-clon-whatsapp:25–41` | Directriu UI/UX manual | `src/components/layout/AppGridShell.jsx`, skill Pedra Seca existixen | Cap executable o prova de paritat propi. L'eina prescrita són captures; no acredita rèplica funcional de WhatsApp, telefonades ni infraestructura. |
| 31 | `sdp-estudi-mercat:30–58` | Procediment d'investigació manual | `src/data/backendPort.js`, `.agents/protocolledge.json` existixen | Cap escàner forense propi ni integració automàtica amb competidors. El coneixement extern s'ha de verificar cas per cas; el procediment d'informe és real però manual. |
| 32 | `sdp-pedra-seca:37–71,84–95` | Especificació visual amb codi de producte real | `src/css/index.css`, `AppGridShell.jsx`, `DesignSection.jsx`, `PaginaEmojis.jsx`, `BarraTaronja.jsx` existixen | `:38,70–71` prohibix RGB, primitius i ombres no tokenitzades, mentre `sdp-universal-page:69` ordena `rgba(...)`, `--sdp-blanc` i ombra literal. No hi ha excepció explícita que resolga les dues instruccions. |
| 33 | `sdp-universal-editor:27–49` | Especificació d'editor sobre components reals | `UniversalEditorShell.jsx`, `BarraTaronja.jsx`, `PaginaEmojis.jsx`, `familiesEmojis.js` existixen | **Referència trencada:** `src/components/universal/editor/UniversalToolbar.jsx` no existeix; el real és `src/components/universal/UniversalToolbar.jsx`. `UniversalEditor.css` és un basename ambigu i no l'executable d'un tractor. |
| 34 | `sdp-universal-page:24–26,68–73,108–117` | Especificació d'anatomia sobre components reals | `UniversalPage.jsx`, `AppGridShell.jsx`, `DesignSection.jsx`, `systemPages.js`, `pageContent.js` existixen | La regla de color/ombra literal de `:69` contradiu Pedra Seca. Duplica la nidificació Workspace/Page de `sdp-app-grid-shell`. El trigger `chrome` activa la skill fins en «Chrome navegador», tot i superar quatre lletres. |
| 35 | `sdp-vigilant-tellado:42,54–61,181–186` | Procediment manual amb projecte explícit d'un tractor encara absent | Portes/proves citades existixen: `tractor-rls.mjs`, `segella.mjs`, `dist-secrets.mjs`, `tests/enxufe-plugin.test.mjs`, `tests/enxufe-traduccio.test.mjs`, cron d'higiene | **Pendent declarat:** no existixen `tooling/gates/tractor-vigilant.mjs` ni `npm run porta:vigilant`. `:54,59,162` descriuen integració futura com si fóra mode operatiu, però `:42,185` n'aclarixen l'absència. L'arxiu d'informe `aammdd_hhmm_…` és plantilla de nom, no referència trencada real. |
| 36 | `sdp-workflow:25–43` | Workflow manual amb portes i CLI documentals reals | `npm run porta`, `tooling/wiki/document.mjs` referit per basename; skills consultades existixen | **Referència trencada i prohibida per al RAG:** `:27` envia a `90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md` (inexistent; no se n'ha llegit contingut). `:36` es referencia a si mateixa per principis de disseny que viuen a Pedra Seca. |
| 37 | `wiki-busca-skills:27–49` | Procediment manual d'assimilació externa | `.agents/skills/00_INDEX_SKILLS.md`, índex Wiki existixen | Cap instal·lador/tractor propi citat. El contracte d'escriptura declara l'índex generat, però no les fonts SKILL que el cos mana crear; `cataleg_skills` és l'autor del catàleg i no es nomena en el flux. |
| 38 | `wiki-cicle-de-vida:24–37` | Procediment amb CLI i portes locals reals | `obrir_torn.mjs`, `document.mjs` (basename), `tancament.mjs`, plantilla `acta.md` existixen | Reté documents actius i prohibix purga per edat/mètriques humanes inventades: contradiccions concretes amb Salfumant/telemetria. No hi ha referència operativa trencada detectada. |
| 39 | `wiki-documentacio-i-reflex:40–43,94–109` | Procediment documental amb eines reals i lliçons acumulades | `tooling/wiki/document.mjs`, `tooling/gates/porta-olivera.mjs`, protocolledge i plantilles existixen | `:112` «Vincles» no és secció final, perquè `:115` afegix una altra secció, contradient `core-maquetacio-markdown:R13`. Gran duplicació de convocatòria/retenció amb higiene, taxonomia i workflow; el CLI real no acredita tota la doctrina acumulada. |
| 40 | `wiki-propagar-veritat:29–49` | Procediment manual amb eines genèriques de sistema | `find`, `sed`, `ripgrep` són eines genèriques; protocolledge existent; cap executable específic del projecte | L'exemple `find … sed -i` exclou arxiu i `02_investigacio_ia` però **no** `04_escriptori/01_produccio`, zona humana protegida; executar-lo literalment pot modificar-la. «Rutes vives autoritzades» de `:48` no restringix l'exemple ampli de `:40–43`. |

Fitxers auxiliars de comprovació: `/tmp/sdp0145-skills-references.json` (existència de referències, sense continguts privats) i `/tmp/sdp0145-skills-seal-verification.json` (esquema, hash actual/anterior/proposat i casos reals del router). Els 40 contractes només apunten a rutes existents; això no acredita que enumeren tots els efectes laterals del cos. Els basenames il·lustratius, noms de fitxer de plantilla i dependències externes no s'han comptat com a executables locals inexistents.


### Inventari d’imatges 261026_0145 — resultat només de lectura

Arrel examinada: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`. Cap fitxer del repositori modificat; cap imatge creada, convertida, moguda o eliminada. No s’ha llegit l’arxiu fred ni secrets. No s’ha instal·lat cap dependència ni deixat cap procés persistent.

#### Lectura i mètode

S’han llegit íntegres l’acta `261026_0130_acta_marmota_triomf_commit_cd1bb28a4_i_fundacio_llei_tauler_net.md` i el pla1645 actualitzat, inclosos els mòduls 8 i 9. La xifra «149 òrfens» de l’acta es tracta com una afirmació per comprovar. S’ha enumerat l’arbre físic de `public/assets`, calculat SHA-256 dels bytes, avaluat el mòdul pur del cens i la política de bessones, i distingit les referències de codi, catàleg, dades/construcció i proves. El corpus de referències conté 2.939 fitxers de text dins de `src`, `public`, `supabase`, `wordpress-plugin`, `tooling`, `scripts`, `tests` i configuració d’arrel seleccionada; exclou secrets, arxiu fred, dependències i artefactes de construcció. S’han recuperat els camins dinàmics dels plugins mitjançant l’AST i s’han inspeccionat visualment les imatges Mapa i Salut. No s’ha executat una suite global ni s’ha comprovat una base de dades, CDN o WordPress extern.

No s’ha executat `cens()` amb les arrels predeterminades perquè incorpora també Wiki/bot fora del corpus delimitat. Els resultats següents són el cens físic i la classificació explícita descrits ací, no una afirmació d’haver reproduït aquella execució completa.

#### Comptes exactes

| Mesura | Resultat |
| --- | ---: |
| Fitxers d’imatge físics dins de public/assets | 390 |
| Ràster / SVG | 384 / 6 |
| WebP / PNG / JPEG, sense distingir majúscules | 209 / 106 / 69 |
| Bytes totals | 138.362.269 |
| SHA-256 diferents | 303 |
| Grups amb bytes idèntics | 54 |
| Instàncies redundants respecte d’una còpia per hash | 87 |
| Bytes redundants respecte d’una còpia per hash | 26.795.989 |
| Grups de 2 / 3 / 4 còpies | 23 / 29 / 2 |

La partició següent és EXCLUSIVA: s’aplica l’ordre CENS → EXCLOSES → bessona WebP → sistema → SVG → desconeguda. Per això suma exactament 390.

| Categoria exclusiva | Fitxers |
| --- | ---: |
| Entrades de CENS_IMATGES | 150 |
| Exclusions explícites EXCLOSES | 54 |
| Bessones WebP reconegudes per la política | 174 |
| Altres fitxers de sistema | 9 |
| Altres SVG | 2 |
| Sense classificar | 1 |
| Total | 390 |

Cobertura de les categories existents: 389/390. Els totals bruts de sistema (13) i SVG (6) NO s’han d’afegir directament: 4 fitxers de sistema són bessones i 4 són SVG. L’únic no classificat és `/assets/fotos/iaia_maria_avatar_mobil.png`, còpia exacta de `/assets/uploads/brain/iaia_maria_avatar_mobil.png`. La seua bessona WebP també duplica la bessona canònica.

##### Límits de «149 òrfens»

La xifra 149 no s’ha reproduït amb una definició verificable. En el corpus delimitat hi ha 159 imatges sense literal del camí públic complet; 165 si s’exclouen les proves; 238 sense literal en codi o dades/construcció, excloent catàleg i proves; i 111 sense ni tan sols el nom del fitxer. Són mesures diferents i cap equival a «sense consumidor».

Dels 159 sense URL literal completa, 122 són bessones WebP, 34 són exclusions explícites i 1 és una entrada del cens construïda dinàmicament (`/assets/ui/plugins/rebost_vinyeta.webp`). També hi ha 4 de sistema i 1 SVG, amb solapaments. Rebost és un contraexemple concret: sense literal complet, però present en el CENS avaluat i en la construcció dinàmica dels plugins. El resolutor pot demanar WebP en lloc de l’original sense un literal per a cada variant.

Confiança alta en els 390 fitxers, hashes, partició i reutilitzacions concretes; insuficient per certificar 149 imatges semànticament òrfenes. Ni absència de `rg`, ni exclusió de la galeria, ni duplicació exacta autoritzen eliminar o moure: cal resoldre consumidors dinàmics, publicacions remotes i enllaços externs. El mateix tractor existent adverteix que una «orfe» és només candidata a revisió humana i que no veu Yoast, xarxes ni enllaços publicats.

#### Duplicats exactes representatius

| Grup | Fitxers | SHA-256 | Bytes redundants |
| --- | --- | --- | ---: |
| Avatar mòbil PNG | fotos/iaia_maria_avatar_mobil.png; uploads/brain/iaia_maria_avatar_mobil.png | 3585f4656afd99b4297acb8e20b2a02bab1b8403a7fa57d6b3e466eb047249ef | 81.562 |
| Avatar mòbil WebP | fotos/iaia_maria_avatar_mobil.webp; uploads/brain/iaia_maria_avatar_mobil.webp | f11dd63653b1b4b29558c2fabcfedcf3b904485418a89c5318963dde1766f980 | 21.668 |
| Pòster amb dos noms | uploads/brain/cuc-de-pi-poster.png; uploads/brain/thermodynamics_ai_hardware_1775882083812.png | ec402bfe73996ad38e2f1fb89631ea6a7031cbd52b97cd94440ee7a207ff9786 | 1.093.663 |
| Iaia en quatre llocs | fotos/iaia-maria.webp; uploads/avatars/iaia_comic_matriarch.webp; uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.webp; uploads/gent/avatars/iaia_comic_matriarch.webp | c884b685076bf4ecc9f8a4dc7d14b9148e8cc5aeba8b00d42b98b8afe34710d4 | 795.666 |
| Logotips rectangulars | system/ui/logo-socdepoble-rect-blanc.svg; system/ui/logo-socdepoble-rect.svg | 47952f36c83553445b5dde61d65a6d09a96d21f665129fb6dc6e63e8a072dd9f | 125.585 |

Tots els camins d’esta taula són relatius a `public/assets/`. SHA-256 detecta igualtat de bytes; no detecta dos formats de la mateixa il·lustració ni acredita unicitat semàntica global. El fitxer JSON adjunt conté els 54 grups complets.

Les 54 exclusions existents ja distingeixen casos justificats: 8 targetes OpenGraph, 28 còpies d’avatars, còpies específiques amb destí canònic, una versió de perfil amb més resolució, una captura antiga i logotips/insígnies tècniques. Són exclusions de la galeria, no proves que els fitxers no tinguen ús.

#### Consola: què es repeteix realment

`src/sections/consola/imatgesConsola.js:56` defineix 10 imatges diferents, inclòs l’índex; les 9 targetes també tenen camins diferents entre elles. Actors (`mapa_vinyeta.webp`, línia 73) i Salut (`salut_vinyeta.webp`, línia 75) tenen hashes i composicions visuals diferents. Per tant, l’exemple literal «Actors i Salut comparteixen imatge» no es reprodueix en el codi actual.

Sí que hi ha reutilització entre espais:

| Targeta Consola | Recurs | Altre consumidor concret |
| --- | --- | --- |
| Actors | ui/plugins/mapa_vinyeta.webp | plugin Mapa i PAGE_COPY.publicar_mapa, src/sections/text/pageContent.js:342 |
| Salut | ui/plugins/salut_vinyeta.webp | plugin Salut, src/sections/plugins/registrePlugins.js:292 |
| Fluxos | ui/plugins/treball_vinyeta.webp | PAGE_COPY.treball, src/sections/text/pageContent.js:372 |
| Calendari | nano_cards/calendari_nano_card.jpg | PAGE_COPY.publicar_calendari, src/sections/text/pageContent.js:332 |
| Explorador | ui/plugins/cervell_vinyeta.jpg | PAGE_COPY.cervell, src/sections/text/pageContent.js:283 |
| Índex | ui/plugins/consola_vinyeta.jpg | PAGE_COPY.consola, src/sections/text/pageContent.js:241 |

La fàbrica `plugin` en `src/sections/plugins/registrePlugins.js:153` genera el camí amb id i extensió, partint d’IMATGES_PLUGINS (línia 124). La prova actual `src/sections/consola/imatgesConsola.test.js:80`–84 exigeix expressament la igualtat de Fluxos/Treball, Calendari/Publicar calendari, Actors/Mapa i Salut/plugin Salut. Cal canviar conscientment aquella política i les expectatives quan es trie el recurs substitutiu; canviar el nom d’un fitxer idèntic no solucionaria una regla d’unicitat d’il·lustració.

#### Arquitectura existent reutilitzable

- `src/sections/multimedia/censImatges.js`: CENS_IMATGES (72), EXCLOSES (233), ALIES_DEL_CENS (286), idDelCens (294) i mitjansDelCens (301). Hi ha una identitat estable amb àlies i cobertura quasi completa; ampliar-la evita un segon registre paral·lel.
- `src/config/politicaDeMitjans.js`: bessonaDe (49), bessonesDe (59), MITJANS_EXTERNS_DEL_DIRECTORI (79), separaRecursos (109). `src/config/assetResolver.js` resol les variants i els orígens segons el paquet. Una variant no és un segon ús editorial.
- `tooling/media/optimitzar_webp.mjs`: ja exporta imatgesPubliques (243), corpus (254), patronsDinamics (272), classifica (291) i cens (336). Es pot ampliar i reaprofitar; el pla no necessita crear una altra lògica de cens amb regles divergents.
- `useCensImatges` carrega el registre a demanda; `MultimediaSection.jsx:68` el fusiona amb els mitjans vius; `mediaContent.js:192` fusiona per identitat, URL i àlies. Això no és deduplicació per SHA ni un graf complet de consumidors.
- `panellDeLaFoto.js:173` mostra l’article conegut, i en la seua absència, línia 177, «Cap article: és de l’arxiu». Una il·lustració usada en un plugin o la Consola pot caure en este segon cas: falta representar consumidors no editorials. Cal afegir consumidors/enllaços, mantenint compatible l’article singular, sense crear una galeria nova.
- `origenImatges.js` ja tracta procedència, drets i la protecció GPS de persones. Convé conservar aquestes regles i no inferir drets d’ús d’un hash.

`public/assets/media_registry.json` és un registre antic (meta 2026-05-20): 137 entrades, només 4 camins físics encara existents i 133 absents. No s’ha trobat consumidor de producció en la cerca delimitada de src/tooling/scripts/tests (sí una referència de prova del SW). No és una font de veritat actual ni prova de consum en execució.

#### Proposta de Regla d’Imatge Única

Identificar cada obra amb un assetId estable, independent del nom del fitxer, aprofitant idDelCens i els àlies. Associar-hi variants amb camí/MIME/mides/hash; font, autoria, procedència i drets; i consumidors amb entitat semàntica, ruta, lloc dins de la interfície i finalitat. Distingir obra assignada, reserva, recurs tècnic i estat desconegut.

Aplicar la prohibició de compartir la mateixa il·lustració entre targetes que representen funcions diferents. Les representacions de la mateixa entitat (targeta, detall, SEO), la previsualització a Multimèdia i els logos/icones tècniques necessiten excepcions explícites i justificades. Aquesta formulació és una proposta de política, no una acceptació humana ja obtinguda.

Automatitzar els duplicats de bytes amb SHA-256 i proposar candidats visuals amb hash de píxels normalitzats o hash perceptual, indicant versió i llindar. La semblança requereix confirmació humana; ni SHA ni un llindar perceptual poden certificar sols la unicitat semàntica global. No s’han calculat hashes perceptuals en esta sessió.

#### Comprovacions concretes per a una implementació posterior

1. Cobertura del cens contra l’arbre físic real, amb variants i categories excloents; informar de nous recursos desconeguts sense codificar permanentment 390 com a invariant.
2. Referències dinàmiques verificades amb Rebost, pobles interpolats, JSON/manifest/CSS/imports, URL codificada i query/fragment; una absència de literal no passa directament a «orfe».
3. Originals i bessones comparteixen assetId; els àlies preserven identificadors i enllaços existents. No canviar rutes publicades sense una migració concreta.
4. Matriu de consumidors que detecte els casos Actors/Mapa, Salut/Salut, Fluxos/Treball i Calendari, i permeta només excepcions declarades de la mateixa entitat, galeria, logos i recursos tècnics.
5. Panell de Multimèdia amb consumidors de plugin/Consola, mantenint la informació de l’article quan existeix i les regles de privacitat/procedència.
6. Cap quarantena, moviment o eliminació fins a revisió de consumidors externs i decisió humana. Les discrepàncies i fonts sense consultar han de produir un resultat incomplet, no un certificat global.

Aquestes són comprovacions proposades. En aquesta sessió només s’han executat la lectura, els recomptes, l’avaluació de dades pures, el càlcul de SHA-256, l’AST i la inspecció visual descrits; no s’ha executat Vitest ni una validació global d’acceptació.

#### Artefactes de la sessió

- `/tmp/sdp261026-0145-image-census.json`: les 390 files, metadades, referències per capa i partició exclusiva.
- `/tmp/sdp261026-0145-image-census.csv`: taula plana amb hashes, categories i recomptes de referències.
- `/tmp/sdp261026-0145-exact-duplicates.json`: els 54 grups de bytes idèntics.
- `/tmp/sdp261026-0145-image-data.json`: exportacions pures avaluades de cens, exclusions, àlies i imatges de Consola.
- `/tmp/sdp261026-0145-consola-reuses.json`: coincidències de Consola amb PAGE_COPY.
- `/tmp/sdp261026-0145-plugins-images.json`: camins de plugins reconstruïts de l’AST.


### Wiki: deute mesurat i evacuació recuperable

No es pot atribuir a10_actes tota la xifra històrica de1.122. El SCC reexecutat en esta passada retorna **1.388 incidències:1.123 LINK_INVALID,242 ESCRIPTORI_UNANCHORED i23 ORPHAN_OPERATIVE**. És un tall posterior a l'acta i als nous informes, no un recompte que haja de coincidir amb el d'ahir.

| Origen de les incidències d'enllaç | Ocurrències LINK_INVALID |
|---|---:|
| Índex de l'Escriptori |945|
| Llibre Mestre |103|
| Altres fonts dins de l'Escriptori |10|
|10_actes |59|
| Resta |6|
|Total |**1.123**|

**No són necessàriament1.123enllaços diferents:** el verificador pot comprovar l'índex en ancoratge i en graf, i les fonts també repetixen referències. La deduplicació per parella font+missatge dona553parelles,460a l'índex i21al Llibre. Per a un pla de reparació cal conservar tant el recompte cru de la porta com la llista de destins/ocurrències; no confondre-les amb documents diferents.

Hi ha120Markdown a10_actes. Encara que es llevassen del graf totes les seues ocurrències actuals, **1.064 errors d'enllaç actuals provindrien d'altres fonts**, abans de comptar els nous errors que un moviment sense reapuntat produiria. El pla de «moure actes i arribar a zero» no queda demostrat.

**Doble problema real:** el compilador reconeix noms d'arxiu fred sense llegir-ne el cos, però SCC exclou eixe arbre del seu cens i els links externs són fora d'arrel. Moure una acta al satèl·lit i conservar un wikilink antic no ho arregla. `tooling/lib/document-links.mjs:26` rebutja eixir de l'arrel; no s'ha d'eliminar eixa protecció global per fer callar l'alarma.

S'ha fet un inventari **només de noms físics**, sense carregar cap cos de l'arxiu: 508ocurrències dels errors tenen un únic candidat pel basename dins dels dos arxius consultats;20en tenen més d'un i595no n'hi tenen. Exemple localitzat: `261012_2148_peticio_registre_mestre.md` viu a `_arxiu_wiki_de_poble/historics_2026/`, mentre l'índex apunta a l'antic90intern. Un nom coincident no prova identitat ni autoritza el trasllat. Les595sense candidat no s'han declarat desaparegudes: altres satèl·lits, renoms i referències mal formades continuen possibles. Evidència `/tmp/sdp0145-archive-metadata.json`.

**Pla proposat, sense cap moviment executat:**

1. **Fixar el tall i inventariar:** llista de les120actes, estat de consum, consumidor viu i dependències entrants; conservar l'última Marmota i qualsevol acta que encara explique deute no destil·lat. L'antiguitat suggerix revisió, no decisió automàtica. Inventariar també les àncores del Llibre i de les zones humanes/protegides.
2. **Distingir història i operació:** definir un registre passiu de recursos d'arxiu amb identitat estable, ruta antiga/nova, hash, categoria, causa/actor i moment de trasllat; el repositori conserva referències i metadades, sense reinjectar el cos fred al RAG o al manifest públic. Ja existeixen les destinacions externes12_actes i historics_2026; no es crea cap carpeta nova.
3. **Un sol resolutor per al graf i el compilador:** els destins operatius requerixen fitxer dins d'arrel i aresta normal. Els destins freds només poden resoldre's per un registre explícit i una arrel satèl·lit permesa, amb ambigüitats/error d'I/O visibles; no qualsevol ../ ni un fs.existsSync arbitrari fora de l'arrel. Si es vol un nou URI d'arxiu, ha de resoldre el registre i mantindre el link verificable, no ser un protocol que el parser simplement ignore. El cens fred només llig metadades/noms.
4. **Preparar lots petits i reversibles:**5–10actes consumides per lot, manifest de canvis i checksums, mode sec, comprovació de destí existent i col·lisions, còpia verificada abans del trasllat, reapuntat d'enllaços/índexs i relleu documental coherent. MarIA/Mestre executen el moviment segons el BIOS; Olivera actual no arxiva10_actes ni el satèl·lit extern. No s'ha promés un mode inexistent.
5. **Reparar les àncores per cas:**945ocurrències d'índex i103del Llibre requerixen classificació i destí. Compactar només sediment consumit amb memòria freda recuperable. No tallar un rang de línies que també conté ancoratges de01_produccio/02_investigacio_ia ni eliminar cites històriques del Llibre per obtindre verd. Els242unanchored tenen fitxer afectat i s'han de resoldre sense ocultar-ne el control.
6. **Acceptar cada lot amb proves:** zero enllaços nous trencats, àncores de tots els vius/protegits conservades, destins freds resolubles sense llegir-ne el cos, rebut de trasllat/recuperació, preservació dels hashes acordats, SCC+compilador+Olivera+tancament comparats abans/després. Si queden destins desconeguts, es conserven com a deute. No es proclama zero abans de mesurar-lo.

La selecció d'actes concretes per a evacuar i l'abast de visibilitat del registre fred són decisions a revisar amb el Mestre; no hi ha autorització implícita per moure-les en una auditoria. `requires_human_decision: true` per a eixa execució. El disseny proposat reutilitza resolutor, taxonomia i arrels canòniques; evita un segon sistema de carpetes.

### Contrast adversarial de Gemini0145, llegit íntegre

L'informe company llegit té214línies/27.069bytes, versió1.0.0, SHA-256 `edfa747c3c7a1e246b16166ee7b2238279c739a06debd5fcc493482103d38fcb`. Hi ha convergència en l'excepció conceptual del Llibre, el hash proposat, les reutilitzacions entre Consola i plugins i el pes de l'índex dins del deute de la Wiki. No se n'ha modificat el contingut.

| Afirmació/recomanació Gemini | Contrast verificat |
|---|---|
| Saneja usa withLock sobre runtime/locks i és sòlid | No hi ha eixe withLock. El codi mira un fitxer.lock sense adquirir-lo i la PoC perd una actualització concurrent. |
| G0145-02: recalcular sempre verification.files en caducar | **Recomanació rebutjada:** ampliaria la falsa verificació. Editar després d'una comprovació no es corregeix rehashant automàticament; cal una nova verificació legítima. |
| Parser del pols: causa en regex de Data d'actualització i ESTAT_ACTUAL | No és el pegat present: substituïx el parser de frontmatter de skills per resoldre claus amb punt. La prova causal escalar/llista passa. La frescor del relleu és un altre problema. |
| Pas4 verifica tractor-frontmatter abans del segell; expected-previous6faf/actor mestre | El guió congelat no executa eixa porta en eixe pas, no passa actor mestre i compara expected-previous amb4a1546c3. L'ordre d'edició és correcte i l'esquema40/40 està comprovat independentment en còpia. |
| Exempció i tags del Llibre no són dins del guió | El tall inicial no els tenia; el de16fitxers ja incorpora pas3b. Cal auditar-ne els bypasses, no afegir una segona excepció basada en un tall antic. |
| Descripcions242/430→197/218 | Estos són els valors mesurats del tall auditat; els253/408→214/219 publicats per Gemini no corresponen a les fonts llegides. Salfumant conserva211. |
|480 peces/149òrfens | Hi ha390imatges físiques; el recompte d'altres tipus de fitxer és una altra mètrica.149no s'ha reproduït amb una definició verificable. Les variants i els usos dinàmics impedixen deduir orfandat d'una cerca literal. |
| Tallar línies51–1063, moure actes per data i A+B+C donen zero SCC | No s'ha aportat una execució final que ho acredite; el tall actual té242unanchored i el rang conté material que requerix classificació. Una poda indiscriminada pot trencar àncores vives/protegides. |
|14/11/15 skills classificades per nombre de refs | El nostre cens40pernom distingix el motor real del procediment i de les APIs externes. Una referència textual no és prova d'automatització; hi ha eines reals en skills classificades com purament teòriques. |

L’Acta i Gemini2120v1.2 encara repetixen3.419com a precommit. La passada independent documentada a2230 era3.410, amb les9noves UI executades a part perquè el precommit no les selecciona. No s’ha tornat a executar eixa bateria en esta auditoria de la Consola; cal una errata explícita en la consolidació, no continuar propagant el recompte.

Els dos informes coincideixen que **no hi ha10/10global**. La diferència material és que esta auditoria **no dona conformitat d'execució al paquet complet actual**. El cas de caducitat i els bypasses documentals/mètrics s'han de corregir abans, sense deixar-los com un refinament posterior.

### Seqüència conservadora que afegiria al sanejament

1. Corregir C0145-01/02/04 i completar l’abast residual de03 (bypass principal ja corregit en proposta) amb els tests d’acceptació: caducitat sense verification, lock/CAS real, excepció canònica versionada i timeout no verd.
2. Congelar manifest del paquet i totes les eixides; mode sec/assaig confinat, recuperació i aplicació segura davant concurrència segons C0145-05/06.
3. Assajar en còpia completa amb les mateixes fonts del viu. Validar els40frontmatters, el catàleg i les compatibilitats, més els tests adversarials. Revisar el diff de regles i el hash resultant; si el cos de skills canvia,7dfja no és el valor correcte per definició.
4. Aplicar el lot amb l'autorització i el canal operatiu del projecte, registre i protecció d'estat. No s'ha d'enviar al terminal humà un lot que encara falla els seus contractes.
5. Verificar la Consola viva després del recarregat de fonts: pols llegible, timestamps coherents, mètriques amb origen/estat, cap error ocult ni dada absent presentada com zero. Completar higiene/hook/matriu segons evidència real, no només segons el calendari.
6. Només certificar l'abast que haja quedat resolt. El sanejament de skills no resol automàticament XHR/Storage/WP, ni el deute gràfic/històric, ni les reserves natives anteriors. La Llei del Tauler Net s'incorpora com a condició de certificació amb fonts verificades; un color verd sense cobertura tampoc certifica absència de deute.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat | Evidència |
|---|---|---|
| Consola viva | Tauler roig,7avisos alts,pols il·legible,matriu sense font,108caducats al tall observat | Navegador real, AX i captures26/10; CLI /tmp/sdp0145-mapa-final-pre.json |
| Segell viu | Ruptura6faf0aa1 vs4a1546c3; únic SKILL divergent higiene | /tmp/sdp0145-segell-before.json |
| Frontmatters/proposta |37/40→40/40;7df7a6fc complet reproduït en còpia | /tmp/sdp0145-skills-seal-verification.json |
| Cens de skills |40llegides íntegres,40files/noms únics; referències comprovades | Annex complet i /tmp/sdp0145-skills-references.json |
| Caducitat |4controls/reproduccions: execució confinada, inclòs bypass i carrera | /tmp/sdp0145-root-torns.log |
| Exempció inicial |4controls/reproduccions de la primera versió | /tmp/sdp0145-root-exempcio.log |
| Exempció revisada |6casos: bypass staged corregit, esquema/tipus/àlies/àncora correctes, residual10_actes explícit | /tmp/sdp0145-root-exempcio-current.log |
| Parser/mètriques |3controls/reproduccions,timeout real20.004ms→1/1verd | /tmp/sdp0145-root-parser-metrics.log |
| Fallada transaccional | exit1 i5fonts editades en còpia; segell vell intacte | /tmp/sdp0145-transaction-poc.json |
| Tests Node de Consola/documental vius |41/41passen,0fail/skip/TODO | /tmp/sdp0145-console-node-baseline.log |
| Vitest Consola viva |45fitxers passen/1omés;887proves passen/4omeses,0fallades;52,60s | /tmp/sdp0145-console-vitest-baseline.log |
| Imatges |390físiques,389classificades,303hashes i54grups idèntics | /tmp/sdp261026-0145-image-census.json i annex |
| SCC |1.388incidències =1123links+242àncores+23orfes | /tmp/sdp0145-scc-before.json |
| Destins freds | Només noms:508ocurrències amb candidat únic/20ambigües/595sense candidat en el cens delimitat | /tmp/sdp0145-archive-metadata.json |
| Cadena diagnòstica |5passos,2fallides: segell i contracte documental | /tmp/sdp0145-diagnostic.log; repetida al tancament després de completar l'informe |

**Els tests marcats PoC/DEFECTE passen perquè reproduïxen un defecte; no certifiquen el guió.** Les41Node/887Vitest són la línia base viva, sense aplicar la proposta; no s'han presentat com les12/888de l'assaig de Claude ni com una acceptació d'un pegat nostre. Quatre omissions de Vitest queden explícites. Les bateries se solapen i no se sumen.

El primer diagnòstic de portes es llançà quan este informe encara tenia seccions pendents: aquells errors propis d'esborrany s'han eliminat completant-lo, sense relaxar la porta. Les invocacions exploratòries amb ruta incompleta, glob buit o connexió de curl fallida no són portes passades ni errors del producte. El Mapa amb --help imprimix l'informe perquè no implementa ajuda: font inspeccionada, cap escriptura detectada ni certificat derivat de l'opció.

**Fonts:** normativa i plantilla canòniques, últim ActaMarmota, pla1645 complet amb Mòduls8/9, informes/context actiu de2120/2230 ja llegits, actualitzacions Gemini2120v1.2 i nou Gemini0145 llegits íntegres, Llibre204línies/142.052B abans d'actualitzar-lo,40SKILL íntegres, guió/helpers/pegats congelats i les fonts executables citades. Els informes no equivalen a autoritat per executar els seus suggeriments; s'han confrontat amb el codi.

**Reproducció temporal dels casos principals**, des de l'arrel del repositori:

```sh
node --test /tmp/sdp261026-consola-audit/torns.test.mjs
python3 /tmp/sdp261026-consola-audit/prepare_patch.py
node --test /tmp/sdp261026-consola-audit/exempcio.test.mjs
node --test /tmp/sdp261026-consola-audit/parsers-metrics.test.mjs
python3 /tmp/sdp0145-transaction-poc.py
# Acceptació de la revisió nova del pegat, sense els afegits hardcoded antics:
node /tmp/sdp261026-consola-audit/prepare_current_exempt.mjs
node --test /tmp/sdp261026-consola-audit/exempcio-current.test.mjs
```

La preparació d'exempció només replica els afegits del pegat en mòduls temporals i encamina els imports. La font viva no rep cap transformació. El procés de20s de la fixture és finit i és matat pel mateix timeout; no queda cap daemon. El guió amb fallada s'executa exclusivament en una còpia Git mínima.

**Tancament final:** exit1,valid:false,state:planned,**1.431incidències**. Passen Olivera,plantilles,Autoritat,LEDGER i catàlegskills; fallen segell,Wiki i SCC, més metadades del Llibre. **Cap error del nou informe0145.** Log `/tmp/sdp0145-tancament-final.json`. El primer check donà1433, incloent dos vincles propis afectats per l’arxivament concurrent: corregits i reexecutat el check. El delta respecte del diagnòstic inicial no s’ha presentat com una regressió de producte ni s’ha ocultat. ChecksumLEDGER vàlid abans/després, diff-check0 i cap delta en skills/tooling/src/public/segell/package. El segell viu continua6faf0aa1. Proposta revisada93b668e9/655021f3 estable en la comprovació final. Durant el primer check s’han arxivat informes antics per altres actors; els dos vincles propis afectats s’han reapuntat als destins90existents, sense moure ni llegir el cos de cap arxiu fred. El diagnòstic inicial del graf queda com a tall datat; el recompte final pot variar amb eixe arxivament concurrent.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha aplicat el guió viu, resegellat skills, caducat cap torn alié, mogut cap acta/imatge, instal·lat cap dependència, tocat secrets, SQL, sessió o remot, fet commit/push ni creat carpetes noves al repositori/directori mare. Les úniques escriptures permanents de Codex són informe, ancoratge, Llibre, ESTAT/LEDGER i registres documentals propis. Els experiments i manifests auxiliars viuen en espais temporals permesos.

S'han enumerat noms de l'arxiu fred per identificar possibles destins, sense carregar-ne cap cos al RAG ni llegir backups de cervell. No s'ha resolt cap identitat només per basename ni s'ha acceptat un link arbitrari fora d'arrel. No s'han certificat CDN/WordPress/consumidors remots, unificació perceptual de les imatges, una ronda real de launchd ni recuperació transaccional del guió després d'aplicar-lo al viu.

Cap cron, watcher, recordatori recurrent o servidor propi iniciat. Els subagents han finalitzat i els processos de proves s'han consumit/tancat. La pestanya temporal de comprovació es tanca en acabar. No s'han cancel·lat serveis compartits aliens.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261026_0130_acta_marmota_triomf_commit_cd1bb28a4_i_fundacio_llei_tauler_net]]
- [[261026_0145_auditoria_gemini]]
- [[../90_arxiu_historic/261025_2230_auditoria_codex]]
- [[../90_arxiu_historic/261025_2120_auditoria_codex]]
