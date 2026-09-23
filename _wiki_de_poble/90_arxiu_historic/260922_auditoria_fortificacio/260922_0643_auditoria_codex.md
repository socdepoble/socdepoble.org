---
type: informe
status: esborrany
description: Contradiccions d’autoritat, fallades de generació documental i pla verificable per al relleu d’agents i humans.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4dd02076-f9b4-4588-a25b-3badd681cf62:6a083c4d-2e7c-4757-8a6c-2487e3bd5d3f
---
# Auditoria forense del Cervell i del relleu operatiu

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4dd02076-f9b4-4588-a25b-3badd681cf62:6a083c4d-2e7c-4757-8a6c-2487e3bd5d3f |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T04:43:44.756Z |
| Modificació | 2026-09-22T04:43:44.756Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 b2f519c4eb08bd94fea8fb554476b04d931ce54131b021efc16217caaa4881f7. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T04:43:44.756Z: auditoria creada pel circuit documental; lectura forense, proves i pla completats en aquest torn.

## Troballes

### Veredicte i abast

**No supera la prova d’enxufabilitat.** Llegint només `AGENTS.md` i `00_index.md` puc entendre la missió, però no obtinc una seqüència coherent i reproduïble per operar, reprendre ni tancar. La fallada no és falta de compromís de la IA: les fonts canòniques prescriuen fluxos incompatibles i la maquinària valida menys del que promet la prosa.

Tall: 22-09-2026, inici del registre a les 06:43 CEST; HEAD `be16f668b4b2fe87fa9fd17f4c77ed13daab2153`, amb nombrosos canvis locals previs. S’audita el disc, no una versió neta del commit. `requires_human_decision: false` per a la diagnosi i els plans demanats. No s’infereix que un pla proposat estiga implementat ni aprovat per a desplegament.

P1 significa bloqueig de continuïtat, autoritat o traçabilitat; P2, degradació operativa. No declare P0 ni invulnerabilitat absoluta sense evidència d’impacte crític. La missió rural i el llegat de més de trenta anys provenen del context del Mestre i de la plantilla; no s’ha fet una verificació històrica externa.

### C01 · P1 · L’entrada constitucional no arriba als seus documents

**Evidència:** `AGENTS.md`, §13, enllaça `BOOTSTRAP.md`, `rules/00_BIOS_COGNITIU.md` i `BASELINE.md`. Les tres rutes són inexistents des de l’arrel del repositori, que el §3 exigeix usar. Sí existeix `.agents/BOOTSTRAP.md`. No és suficient que un resolutor de wikilinks trobe altres fitxers homònims: aquestes són rutes Markdown explícites. L’índex mestre té «Cervell i Agents» buit i agrupacions «Orphans Recovered» sense ordre de lectura.

**Impacte:** una IA o persona nova ha de reconstruir la topologia pel seu compte abans de començar. **Conflicte:** promesa d’arrencada determinista i regla de rutes de la Constitució. **Reconstrucció:** corregir els enllaços i oferir una única seqüència d’arrencada a l’índex: identitat, autoritat, estat vigent, procediment, prova i relleu. Fer fallar una prova quan qualsevol ruta d’aquesta seqüència falta.

### C02 · P1 · Dos contractes d’Acte Reflex sense frontera clara

**Evidència:** `.agents/PROTOCOL_PETORRETA.md`, P-01/P-03, exigeix lease per a qualsevol escriptura i ordena `reflex_petorreta open → bootstrap → seal → claim`. En canvi, `wiki-documentacio-i-reflex` i `wiki-cicle-de-vida` prescriuen `obrir_torn → document context/create → plan → tancament`. `tooling/wiki/document.mjs:createDraft` escriu sense verificar una lease del primer sistema. El primer protocol mana noms `YYMMDD_HHMM_PROMPT_` i `tipus: petorreta`; AGENTS mana minúscules i el circuit documental usa `type`.

**Impacte:** complir un circuit no demostra complir l’altre. **Conflicte:** autoritat executable única. **Reconstrucció:** separar explícitament rebut documental (proveniència i estructura) de lease de mutació (operació, abast i caducitat), declarar quines operacions necessiten cadascun i donar una única entrada CLI. No eliminar les comprovacions de risc alt per fer passar documents. Aquesta auditoria segueix el circuit documental vigent per al lliurament explícitament demanat; no afirma haver adquirit una lease del protocol antic.

### C03 · P1 · Governança contradictòria entre fonts vives

**Evidència contrastable:**

| Fonts | Conflicte |
| --- | --- |
| AGENTS §6/§11 vs `01_ser/02_genotip.md` llei 1 i Protocol P-05 | Bundle sencer sense límits versus context seleccionat; P-05 imposa 25 fonts i 8 MiB totals. Cal distingir integritat de cada font de totalitat del repositori. |
| AGENTS §14 vs `01_ser/01_identitat.md` directriu 4 | Llegir l’última Acta com a context exacte versus no triar l’última per data com a autoritat. Llegir-la no és el problema; atribuir-li vigència automàtica sí. |
| AGENTS §1 vs `core-identitat/SKILL.md` | Autoritat executiva a skills versus Wiki com a autoritat executiva màxima. |
| Genotip llei 2/7 vs llei 10 | Autonomia reversible versus confirmació informada després d’evidència per a tota mutació. |
| `01_identitat.md` i genotip vs `personalitat_iaia.md` | «Online-First estricte» versus «No som Online-First». |

**Reconstrucció:** una matriu d’autoritat amb abast, excepcions i precedència; declaracions d’arquitectura referides a un ADR únic. Mantindre cultura i llengua sense convertir cada record en una nova llei. Les ordres actuals de l’usuari i els permisos de l’entorn continuen governant aquesta tasca.

### C04 · P1 · Taxonomia canònica d’una estructura que ja no existeix

**Evidència:** el disc conté `01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes`, `90_arxiu_historic`. `02_saber/00_index_identitat.md` encara envia a `05_Escriptori_Soc_de_Poble`, `03_govern` i `04_ARXIU_Documents_Historics`; anuncia quatre pilars però la taula en mostra tres. `successio_lazaro_execucio.md` repeteix les carpetes antigues i una skill `socdepoble-workflow` que no figura entre les 16 skills presents.

**Impacte:** el manual específic de successió falla precisament quan ha de substituir el coneixement del Mestre. **Reconstrucció:** adoptar les sis carpetes reals, sense una altra migració física; descriure què és norma, procediment, treball actiu i història. Generar el mapa de rutes des d’un registre menut contrastat amb el disc. Afegir una guia humana de continuïtat: responsables per rol, accés a credencials sense incloure secrets, restauració, operació ordinària i escalat. L’actual Lázaro aporta prudència i diagnosi, però no demostra un relleu operatiu complet.

### C05 · P1 · `create` no instancia les instruccions de la plantilla

**Causa demostrada:** `tooling/wiki/document.mjs:draft` només recorre `route.seccions`. Insereix un registre, un hash, historial, vincles i `[pendent]` a la resta. No copia Context, història, lectures obligatòries ni les quatre regles de l’Olivera. `prompt_local.md` reconeix al final que la resta és «context de redacció». Per tant, crear un esquelet funciona segons el seu contracte; esperar un prompt ISO complet és una expectativa no implementada.

**Prova negativa:** en una fixture temporal, `validDoc(root,{route:'prompt.local'})` substitueix els pendents pel text genèric de la suite existent. `validateDocument` retorna `[]` encara que el document no conté «Destinació Obligatòria» ni «30 anys». La porta comprova seccions no buides, no les instruccions obligatòries. No es pretén que una expressió regular puga acreditar comprensió.

**Reconstrucció:** dividir la plantilla en blocs normatius deterministes i camps editorials; `create` ha d’instanciar els primers i marcar els segons. Validar la presència/integritat dels blocs requerits i els camps, sense proclamar qualitat semàntica. Incloure proves que eliminen la destinació, la nomenclatura, les lectures i el protocol i exigisquen error.

### C06 · P2 · La plantilla visual i el contracte no comparteixen estructura ni versió

**Evidència:** `prompt_local.md` diu v1.0 al títol, v1.2.0 al camp Plantilla i `protocolledge.json` declara 1.0.0. La plantilla no té `Historial` ni `Tasca` com a seccions, exigides pel router. Escriu `Protocol de la Reunió a l'Olivera (Instruccions d'Interacció)` amb apòstrof recte; el contracte exigeix exactament `Protocol de la Reunió a l’Olivera`. `validateSections` compara noms exactes. El registre generat ni tan sols inclou el camp Plantilla, que la plantilla visual sí presenta. Totes les rutes tenen `lectures: []`.

**Impacte:** copiar fidelment la pàgina ISO no és reproduir el contracte. **Reconstrucció:** una versió de contracte i identificadors de secció estables; títols humans renderitzats a partir dels mateixos identificadors. El mateix registre ha de generar plantilla, CLI i validació. Evitar una quarta especificació manual.

### C07 · P1 · Millorar una plantilla invalida els seus documents anteriors

**Evidència:** `validateDocument` compara el hash de plantilla del rebut amb la plantilla viva. Prova temporal: afegir una frase editorial compatible produeix `Plantilla del rebut canviada`. `contractHash` inclou els bytes complets del router i de l’esquema: modificar espais del router també caduca el contracte; la suite existent comprova aquest comportament.

**Impacte:** la millora contínua pot tornar roig el material legítim d’ahir; les versions s’exigeixen però no permeten reproduir la validació antiga. **Reconstrucció:** persistir versions immutables de contracte/plantilla i validar el document contra la versió amb què va nàixer. Per a modificar un document, crear una revisió amb migració explícita. No renovar rebuts antics silenciosament ni fingir que la lectura original usava bytes nous.

### C08 · P2 · Una plantilla aliena pot impedir tota operació documental

**Evidència:** `loadContract` llig i parseja totes les plantilles abans de resoldre la ruta. En fixture temporal, eliminar `branding.md` fa fallar la creació d’una auditoria amb ENOENT de branding.

**Reconstrucció:** validar el registre i la ruta seleccionada en cada operació; reservar la comprovació de totes les rutes per a una porta global de salut. Si el contracte compartit està corrupte sí cal fallar; si una plantilla independent manca, reportar-la sense impedir treball no dependent.

### C09 · P1 · Els documents reals ja han eixit del circuit verificable

**Evidència inicial de `porta-documents --all`:** 10 fitxers comprovats, huit errors en set documents: cinc documents sense rebut; un d’ells també sense àncora; un registre de torn invàlid; un rebut apunta a un JSON absent. El prompt 0612 d’aquesta mateixa auditoria és un dels documents sense rebut. Les auditories 0518 de Codex i 0531 de Claude no apareixen entre els errors.

**Impacte:** la portada ISO i el text «aprovat» no equivalen a traçabilitat mecànica. **Reconstrucció:** regularització explícita amb procedència declarada: distingir document importat d’un document generat pel circuit. No fabricar rebuts retrospectius de lectura. Revalidar, conservar originals i emetre una revisió verificable. Tancar i versionar els registres corresponents abans d’afirmar que el flux sobreviu a un clon net.

### C10 · P2 · Les skills continuen barrejant memòria, filosofia i procediment

**Evidència:** `core-memoria-historica/SKILL.md` inclou filosofia, decisions de producte, lleis i una ruta absoluta de la màquina de Javi. La lliçó 10 mana esborrat definitiu si no hi ha valor; AGENTS §5 exigeix preguntar abans d’esborrar contingut de l’escriptori i indica quarantena. La política d’evacuació al directori germà contradiu P-10, que el declara custòdia externa només de lectura. `wiki-cicle-de-vida` mana actes a `10_actes`, però `deliverContext` només accepta destinacions dins de `04_escriptori`; a més, cita `plantilla_acta_unica.md`, mentre el router usa `acta.md`.

**Reconstrucció:** lliçons i raons a `02_saber`; skills amb disparador, entrades, comanda, efectes, límits i eixida. Retenció explícita sense esborrats automàtics inferits. Afegir una promoció registrada des de l’escriptori cap a actes/història que preserve identitat i rebut, o declarar destins autoritzats per ruta. En aquest estat un simple moviment canvia la ruta que el rebut valida.

### C11 · P2 · El relleu depén de l’ordre físic d’un diari llarg

**Evidència:** `despertar.mjs:getLatestEstat` llig els primers 1.500 caràcters d’ESTAT. El fitxer combina entrades afegides al principi i entrades del 22-09 afegides al final. `ON_ESTIC` mostra la primera entrada de Claude truncada a mitja frase, i no un estat actual amb acció següent. Acaba «Espera les ordres del Mestre».

**Reconstrucció:** separar estat actual breu i explícit de registre cronològic append-only; l’estat ha d’incloure objectiu actiu, evidència, bloquejos, següent acció i enllaços. Generar ON_ESTIC d’aquest contracte, no d’una subcadena arbitrària. L’Acta explica la sessió; no substitueix l’estat ni la Constitució.

### C12 · P2 · Les garanties de les portes excedeixen la cobertura

**Evidència:** skills, compilació Wiki estricta i SCC passen malgrat C01–C11. `run-portes.mjs` acaba en el primer error i situa documents al primer pas. La suite de 45 proves documentals és verda. Això acredita propietats concretes, no coherència normativa, comprensió ni substituïbilitat humana.

**Reconstrucció:** conservar el bloqueig de publicació; afegir mode diagnòstic que execute comprovacions independents i acumule resultats. Etiquetar cada prova com estructura, referències, compatibilitat, procediment o revisió humana. No executar automàticament tractors amb efectes laterals per aconseguir més cobertura. No usar «cadena inviolable» com a criteri d’acceptació.

### Reunió a l’Olivera: què conserve i què corregisc

Llegits íntegrament el pla de MarIA 0510, l’auditoria Codex 0518 i l’auditoria Claude 0531, inclosa la segona mesura. Són antecedents de BrainGraph; no existeix en l’escriptori inspeccionat un pla previ específic de reconstrucció del Cervell.

Coincidisc amb Claude en la necessitat de fixar el tall i en el fet que la primera porta roja oculta els diagnòstics posteriors. **Matís:** fallar tancat no és un defecte per si mateix ni justifica abaixar la porta; el problema és visibilitat diagnòstica i deute pendent. La classificació P0 d’aquell informe no es trasllada automàticament a aquesta auditoria.

El pla de MarIA és raonable per al graf però no pot governar aquesta missió: és visual i no cobreix l’arrencada, la vigència ni la successió. Els resultats UI de les dues auditories queden com a antecedents, no revalidats ací. La lliçó útil és metodològica: un informe ha de dir quin estat observà i distingir correcció, regressió i proposta.

### Prova de pèrdua de memòria

| Pas d’un operador nou | Resultat local |
| --- | --- |
| Identificar projecte i missió | Possible, amb lectura de la plantilla i 01_ser. |
| Trobar una entrada única | Falla: rutes constitucionals absents i autoritats superposades. |
| Saber on va cada document | Falla: mapa antic en índex i manual de successió. |
| Crear prompt a partir d’ISO | Esquelet possible; contingut normatiu no instanciat ni comprovat. |
| Saber què continua vigent | Insuficient: actes, ESTAT i ON_ESTIC no formen un estat únic. |
| Validar i tancar el conjunt | Falla documental real; comprovacions estructurals sí passen. |
| Reprendre en un clon net | No demostrat; hi ha eines, proves i registres nous encara no versionats. |
| Substituir l’operador humà | No demostrat; el manual disponible és de diagnosi i usa rutes antigues. |

El resultat és una inspecció reproduïble del recorregut d’arrencada, no un experiment amb una altra IA amnèsica o una persona externa. La prova final d’acceptació ha d’usar realment una sessió neta.

### Decisió constructiva

Conservar les sis carpetes i els mecanismes que ja funcionen. Reconstruir el contracte d’autoritat i la generació abans d’afegir més normes. Pla detallat: [[260922_0643_pla_implementacio_cervell]]. Alternatives descartades: una altra migració massiva de carpetes (no resol la contradicció) i ampliar AGENTS amb totes les lliçons (augmenta duplicació i cost de lectura).


## Verificació

- `node --test tests/documental.test.mjs tests/porta-reflex.test.mjs`: **45/45 passen**.
- `node tooling/gates/porta-documents.mjs --all`, abans dels lliurables nous: **valid:false, checked:10, huit incidències**.
- Tres experiments en fixture temporal amb les utilitats de `tests/helpers/documental.mjs`: prompt sense contingut Olivera acceptat; canvi editorial invalida rebut; branding absent bloqueja auditoria. La fixture es neteja al final; cap plantilla viva modificada.
- `node tooling/gates/tancament.mjs --check`: skills, wiki estricta i SCC passen. La primera execució també detecta correctament les tres seccions encara pendents de l’esborrany d’aquesta auditoria. El resultat final es registra baix després de completar-lo.
- Auditoria i pla creats amb `document.mjs context` i `create`, ancorats automàticament. Les metadades de generació es conserven; contingut completat després de llegir les plantilles.


### Resultat final de verificació

Els dos lliurables passen `document.mjs check`. `tancament.mjs --check --turn-id torn_4dd02076-f9b4-4588-a25b-3badd681cf62` retorna **valid:true**, sense errors; skills, wiki i SCC amb exit 0. És verd **d’aquest torn**, no de tot l’escriptori: `porta-documents --all` comprova ara 12 documents i conserva les mateixes huit incidències prèvies. Cap incidència nova dels lliurables. El tancament explícit es fa després d’aquesta anotació; el seu resultat durable és al registre `.agents/runtime/turns/torn_4dd02076-f9b4-4588-a25b-3badd681cf62.json`.

El pla queda vinculat mecànicament al torn per satisfer el contracte documental. Aquesta vinculació no acredita aprovació humana ni implementació. ESTAT i LEDGER incorporen el relleu. El registre de torn continua local fins que es versione; no es declara CI ni clon net validats.

### Empremtes dels fitxers clau al lliurament

Aquestes empremtes permeten detectar canvis posteriors; no són una afirmació que l’arbre sencer haja romàs congelat durant la lectura.

| Fitxer | SHA-256 |
| --- | --- |
| `AGENTS.md` | `ca3659c00363e80f7d40ddce8fe89ebd7eb9fc71e99728796faba1030474ac45` |
| `_wiki_de_poble/00_index.md` | `79b342ba2c338388f093dc7d1e97e4e141fba8b2159a7e8b0825fb0550923819` |
| `.agents/protocolledge.json` | `5ab15a8b3ad3d8e220aad2ed18237c67d47614f0f1deeb8ce6791a5215acc57b` |
| `tooling/wiki/document.mjs` | `2f7bd0887a057ac3b311b9097ba72f61104b5cf69e48d5bdd81c91afe36c0c82` |
| `tooling/documental/core.mjs` | `acb19230114221eeb9ed211a0a650adba05728f469f8d421437403702a8af3b1` |
| `tooling/documental/turns.mjs` | `a4a36c743a772075722060e042091cf0a813916b8c346406d853a53fce587e80` |
| `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` | `2e681bc17c4f02631ff8b064bc7bb4b07762b1318769a08cf2f1c9f57dcccad1` |

## Límits

No s’han modificat codi d’aplicació, Constitució, skills, plantilles ni documents aliens; només els dos lliurables, l’índex i el relleu del torn. No s’han esborrat ni mogut documents, llegit secrets ni recorregut el contingut de l’arxiu històric. No s’ha executat una migració ni fet commit o desplegament.

Cobertura: entrades, 01_ser, índexs, skills representatives d’identitat/memòria/cicle documental, contracte, generador, validació, tancament, CI i antecedents actius. No és una revisió línia a línia de tota la Wiki ni de les 16 skills. No certifica Supabase, Sollutia, accessos humans, proteccions remotes de branca ni comportament de tots els hosts. Les fallades temporals són proves del contracte, no incidències provocades al repositori.

No hi ha prova dels intents interns que motivaren l’autocrítica de MarIA: les causes de generació i validació són demostrades; atribuir-li una intenció o una fallada cognitiva concreta seria especulació. La «invulnerabilitat» es tradueix en invariants i proves negatives, no en una promesa absoluta.


## Vincles

- [[00_index]]
- [[00_index_escriptori]]
