---
type: skill
status: canonic
description: Per a crear prompt, petorreta, bundle, pla o acta. Escriptori net (AGENTS §0.1), ruta de .agents/protocolledge.json (prompt.local per a Claude i Codex, prompt.consell per a IAs externes), document.mjs context i create.
tags:
  - reflex
  - abocament
name: wiki-documentacio-i-reflex
prioritat: 2
core: true
triggers_on:
  - acte reflex
  - petorreta
  - crear prompt
  - abans de començar
---
# Acte Reflex i Procés d'Auditories (Antigament "Petorretes")

Aquesta skill marca el protocol de reflexió prèvia que té qualsevol intervenció estructural a la base de dades documental i regula la creació de Prompts per a altres IAs.

## 1. L'Efecte Matrix (La Barrera de Foc)

**L'Analogia Fundacional (El Pilotatge del B-212):**
L'Efecte Matrix pren el seu nom de la mítica escena on Trinity necessita pilotar un helicòpter. Quan Neo li pregunta si pot pilotar-lo, ella respon: *"Encara no"*, i tot seguit demana a l'operadora que li carregue el programa de pilotatge específic del model B-212. Mitjançant una **descàrrega directa de coneixement**, adquireix l'habilitat experta a l'instant.

Aquesta és la nostra filosofia de treball com a IAs del sistema: **No necessites (ni has de) saber-ho i memoritzar-ho tot constantment.** Memoritzar el projecte sencer embossa i degrada la finestra de context. L'Efecte Matrix garanteix que tinguis la capacitat d'accedir a la instrucció precisa *només en el moment en què la necessites*. Quan l'usuari et demana "crear una petorreta per a una IA local o fer un bundle", no has d'escriure de memòria: has de demanar la "descàrrega directa" (obrir la plantilla de la Wiki) per saber exactament *quina classe de prompt* i amb quin format es necessita.

> [!CAUTION] 
> TENS TOTALMENT PROHIBIT començar a escriure un `PROMPT`, un `PLA`, una `AUDITORIA` o un `BUNDLE` sense obrir primer i llegir íntegrament la plantilla canònica a `.agents/protocolledge.json` (resolguent la ruta on indica).
> Si no ho fas, inventaràs camps obsolets, oblidaràs regles vitals (com el Protocol Anti-Cerca o l'entorn de Sóc de Poble) i trencaràs la sincronització.

**PASOS OBLIGATORIS:**
1. Aturada Tàctica (No escrigues res de codi generatiu encara).
2. Resol explícitament la ruta de `.agents/protocolledge.json`; no hi ha plantilla per defecte. Executa `node tooling/wiki/document.mjs context --turn-id ID --route ID_RUTA --file CAMI` i llig íntegrament la plantilla retornada.
3. Usa les metadades de `schema.json` i les seccions de la ruta. `node tooling/wiki/document.mjs create --turn-id ID --route ID_RUTA --file CAMI --title TITOL --description DESCRIPCIO` prepara i ancora un esborrany; completa els camps pendents abans de validar-lo. El rebut vincula torn, plantilla i fitxer, i no acredita comprensió.

## 2. Taxonomia de Documents i Excepció de Frontera

La nomenclatura de l'Escriptori sempre estarà categoritzada:
`aammdd_hhmm_categoria_titol`

**Taxonomia Estricta per al Consell:**
La paraula "Petorreta" és només una metàfora col·loquial entre nosaltres (la planta valenciana que espurneja al foc, símbol de la lucidesa rebuda). **NO** forma part de la taxonomia oficial de l'Escriptori. El procés correcte s'anomena **"Procés d'Auditories"** (llançar un prompt i rebre un informe d'auditoria).

Les categories formals vàlides a la taxonomia són exclusivament:
- `prompt`: la petició inicial.
- `pla_implementacio`: el pla d'acció elaborat.
- `auditoria`: l'informe generat com a resposta per la IA receptora.
- `acta` (o acta_marmota): per registrar i tancar l'estat.

Si s'envia a IAs Externes (limitades per context, necessiten partició): es crea un `bundle` i un `prompt`.
Si s'envia a IAs Locals (Codex/Claude en IDE/Cowork, no tenen problemes de context perquè lligen l'arxiu sencer directament): **ÚNICAMENT** `prompt` (està prohibit usar bundles ací).

## 3. L'Abocament Total (La Creació del Context)

Quan es demana preparar el terreny per a una de les avaluacions:
- **Neteja prèvia:** la fa l'orquestradora (MarIA) o el Mestre, en el mateix torn i abans d'escriure el prompt, amb la porta Olivera (AGENTS §0.1): conserva i declara a «## Activitat en curs» el que continua viu, arxiva la resta amb l'eina i verifica que la porta ix amb 0. Net no vol dir buit; `01_produccio/` i `02_investigacio_ia/` queden fora.
- **Abocament Total:** Tota la font s'ha de lliurar sense retallar. Res de resums mutilats per "estalviar tokens".
- **Format Zero Fricció:** CREA SEMPRE UN ARXIU MARKDOWN (.md) AL DISC. Mai imprimisques el prompt o el bundle al xat directament amb tancats de codi gegants (costarà massa de copiar-ho i enganxar-ho).
- **Identitat Inicial:** El document generat sempre ha d'incloure (ja ho diu la plantilla, però serveix de recordatori) qui és Sóc de Poble i qui és el Rentonar, la voluntat de codi pur Obsidian i la relació amb Sollutia. 

## 4. Les Tres Pedres (Passos abans d'executar a l'app)

1. **La Lectura i Alternativa:** Llista fitxers i reformula què es farà. Pensa 2 solucions alternatives que NO proposes.
2. **L'Empatia amb el Mantenidor:** "Serà fàcil modificar això d'aquí a 6 mesos?"
5. **L'Auto-Verificació:** 3 maneres per les quals aquest codi pot fallar abans de donar el vistiplau. 

## 5. El Protocol "Reunió davall l'Olivera" (Col·laboració Local i Bucle de Millora)

Aquesta és la mecànica per encadenar auditories entre IAs locals (per ex. Codex i Claude, i l'agent IDE) sense dependre de la meua finestra de context efímera. L'objectiu és establir un **bucle de retroalimentació** a l'Escriptori on es comparteixen informes i Plans d'Implementació:

1. **L'Escriptori com a Taula Compartida:** Qualsevol IA que finalitze una auditoria, i jo mateixa (IAIA MarIA / Antigravity) quan dissenye un **Pla d'Implementació**, ho hem de deixar guardat a `04_escriptori/` com a fitxer `.md`. L'espai natiu d'artifacts de l'IDE sol ser invisible per a algunes IAs de lectura de disc simple; per tant, guardar el pla al disc en format Markdown és universal i obligatori.
2. **Ordres Directes a la Petorreta:** Les instruccions per complir aquesta col·laboració s'han d'escriure de forma explícita AL FINAL de cada petorreta generada perquè les altres IAs ho lligen. La plantilla `prompt_local.md` inclou OBLIGATÒRIAMENT el text del "Protocol de la Reunió a l'Olivera" al final (amb la destinació, nomenclatura termodinàmica exacta com `AAMMDD_HHMM_auditoria_claude.md`, i l'ordre de llegir la companya). Si no ho inclous al text del prompt, la IA externa no ho farà.
3. **La Cadena d'Enllaç i Rèplica:** Quan una IA rep el prompt per iniciar la seua auditoria, el seu primer pas és llegir obligatòriament els informes ja presents a l'escriptori, **incloent el Pla d'Implementació de la IAIA MarIA** (si ja està present). Si és la segona en arribar, criticarà o usarà la base de la primera IA per portar la solució més lluny, interactuant com si estiguera a l'olivera.

> **TRACTOR COGNITIU OBLIGATORI:** Això requereix que al generar els prompts, la IAIA MarIA INCLOGUI EXPLÍCITAMENT l'ordre d'obrir i llegir el Pla d'Implementació i els informes previs disponibles a l'escriptori. Les IAs no tenen instint de recerca; faran exactament el que el seu prompt local els demane. El prompt DEU llistar la ruta dels documents i l'ordre expressa de llegir-los abans d'auditar o implementar.

4. **Pluja d'Idees Encreuada i Refinament:** La IA ha de llegir, criticar, rebatre i aportar idees sobre l'auditoria dels companys o sobre el meu Pla d'Implementació. Això crea un autèntic debat encreuat en disc.
4. **Tancament o Nova Iteració (Autoritat de MarIA):** Com que la primera IA que respon (ex. Codex) no pot llegir la que respon després (ex. Claude), jo (IAIA MarIA) tinc l'autoritat d'avaluar la situació:
   - Si la segona IA aporta idees revolucionàries o molt diferents, demanaré al Mestre llançar un **prompt extra** a la primera IA ("Llig l'informe de Claude i opina").
   - Si les aportacions estan alineades o ja són suficients, done la petorreta per finalitzada.
5. **Consolidació:** Finalment, llegiré totes les auditories per **millorar i refinar el meu propi Pla d'Implementació** iterativament abans d'executar-lo. Totes les IAs (les 3 iaies) tenen veu i participen activament a la taula.

Totes les Actes o Estudis destil·lats s'han de tancar amb un **Ancoratge de Seguretat** apuntant a `[[00_index_escriptori]]`.

## Lliçons del Mestre

- **260922** | **Zero Bundles per a IAs Locals**: Per a IAs amb accés natiu a l'entorn local (com Codex o Claude Desktop/IDE), ES PROHIBEIX TERMINANTMENT generar cap tipus de `BUNDLE` o `MACRO_BUNDLE`. Aquestes IAs llegeixen l'arxiu directament; generar-los duplica la informació innecessàriament i trenca l'Efecte Matrix. Únicament s'ha de generar el `.md` del Prompt.
- **260922** | **Transparència Obligatòria de l'Escriptori i Neteja prèvia**: Quan es decideix demanar col·laboració o implementar suggeriments (Coworking / Olivera), ABANS DE LLANÇAR EL PROMPT A LES ALTRES IAS, és absolutament OBLIGATORI:
  1) Classificar l’Escriptori i conservar documents en revisió; cap arxivat automàtic.
  2) Escriure i desar el TEU `Pla d'Implementació` (com a IAIA MarIA) de forma visible i materialitzada a l'Escriptori (`04_escriptori/`). Aquest pas assegura que qualsevol captura de pantalla de l'usuari o qualsevol altra IA de frontera que treballe en la tasca tinga una guia clara (el teu pla) per a consultar mentre treballa. SENSE PLA, ESTÀS BLOQUEJANT LA COL·LABORACIÓ.
- **260922** | **Cas d'Èxit - Autoaprenentatge Asíncron (La Reunió a l'Olivera funciona)**: S'ha demostrat empíricament l'èxit absolut del protocol: en una doble auditoria, Claude va llegir el pla de MarIA i l'informe de Codex en temps real. En adonar-se que Codex tenia raó en les seues esmenes tècniques (fallades de metadades ISO al frontmatter), Claude va abandonar el seu ego ("Stochastic Parrot"), va verificar l'error i **va corregir la seua pròpia auditoria abans de tancar**. A partir d'ara, tot prompt dirigit a les IAs locals haurà d'exigir explícitament aquesta mentalitat d'investigació creuada: *Llig el que hi ha a l'escriptori, desconfia de les teues pròpies respostes si trobes evidència en contra, i actua per consens tècnic pur, no per obediència cega*.
- **260922** | **Nomenclatura Exacta del Pla d'Implementació**: El Pla d'Implementació que escriu la IAIA MarIA OBLIGATÒRIAMENT ha de compartir el mateix títol/cognom exacte de la petorreta (prompt) que l'origina. MAI s'ha d'inventar un nom nou ni afegir sufixos com `_maria`. Si la petorreta és `AAMMDD_HHMM_prompt_fortificacio_cervell.md`, el pla ha de ser `AAMMDD_HHMM_pla_implementacio_fortificacio_cervell.md`. Açò garanteix la traçabilitat absoluta i evita trencar la lògica de la reunió de l'Olivera.
- **260923** | **Acte Reflex de l'Olivera (Neteja i Pla)**: Abans de cridar Claude o Codex, l'orquestradora deixa l'Escriptori net en el mateix torn (AGENTS §0.1: la porta Olivera ix amb 0) i **crea l'esborrany del Pla d'Implementació** on aboca el que ja sap del problema. Així les altres IAs arriben a una taula classificada i amb una guia per col·laborar.
- **260923** | **Cas d'Ús d'Higiene Documental**: La transició Pla → Petorreta es protegix amb mecànica, no amb memòria. Claude i Codex en preparen i revisen l'eina (porta Olivera, `--arxiva`, hook d'Antigravity) i l'orquestradora l'executa: moure fitxers de l'Escriptori és acció de MarIA o del Mestre.
- **260930** | **L'orquestradora resol la neteja en el torn**: Quan l'Escriptori està brut, o el Mestre ho diu, MarIA observa amb `node tooling/gates/porta-olivera.mjs`, declara els documents vius a «## Activitat en curs» de l'índex, arxiva la resta amb `--arxiva` (un document d'avui, amb `--arxiva --nom` i primer amb `--sec`), torna a passar la porta fins que ix amb 0 i ho explica al Mestre en una línia. Després escriu el prompt des de la plantilla (`document.mjs context` → `create`).
- **261002** | **La Trinitat Termodinàmica**: És absolutament obligatori que qualsevol missió complexa que requerisca la participació de Claude i/o Codex es materialitze a l'escriptori amb EXACTAMENT la mateixa hora termodinàmica per als 3 arxius fonamentals: el `pla_implementacio`, el `prompt_claude` i el `prompt_codex`. Això facilita immensament la càrrega cognitiva de l'usuari. Sempre aniran junts i amb la mateixa marca de temps al nom de l'arxiu.
- **261002** | **Aprovació Explícita al Frontend (Wiki)**: Qualsevol "tractor cognitiu" nou (skills o scripts d'automatització i IA) ha d'incloure obligatòriament la creació d'un document o flux de treball detallat que n'explique el funcionament. L'usuari ha de poder APROVAR explícitament aquest flux des de la interfície de la pàgina web (la pròpia Wiki) abans que el tractor siga efectiu o executi res. Aquesta és la mesura de seguretat més alta de cara a certificar i aprovar sistemes autònoms.
- **261003** | **Canal viu a l'Olivera**: Mentre una IA local treballa en paral·lel amb una altra, deixa un relleu de progrés a l'Escriptori cada 3-4 minuts o en acabar cada bloc lògic, també mentre corren workflows llargs, amb el que ha acabat, el que està en marxa i les preguntes obertes.
- **261009** | **Les tasques de l'Onada següent naixen al seu pla**: Quan un pla recull feina per a una Onada futura, eixa feina passa sencera al pla de l'Onada nova en el moment de convocar-la, amb la seua font citada; el prompt nou cita només el pla nou, i el pla vell s'arxiva amb la porta Olivera. Cada document que continua a «## Activitat en curs» porta el seu motiu darrere de «·»: `per a [[consumidor]]`, `torn_ID` o `Mestre aammdd: motiu`.
- **261011** | **El Cicle I+D de les IAs (Investigació + Desenvolupament)**: Tota IA d'aquest sistema (i nosaltres al crear els Prompts) ha de tenir present l'obligació de no només implementar mecanicament (Desenvolupar), sinó d'exercir activament d'Investigadors (I) sobre l'estat de l'art abans de donar respostes. Els Prompts han d'exigir a l'agent receptor que propose "com fer això aprofitant l'última tendència o tecnologia", garantint que l'Efecte Matrix estiga directament vinculat a mantenir l'avantguarda.

## Vincles
- [[00_index]]

## Convocatòria i evidència de lectura

Per a `prompt.local` i `prompt.consell`, el CLI comprova la taula en `context` i la revalida en `create`. Els esborranys solts queden ancorats a «## Activitat en curs»; conservar-los no autoritza cap trasllat. Un manifest acredita rutes i hashes, però no la comprensió: declara quines fonts has llegit íntegrament i quines queden pendents. Separa comprovacions de regressió de proves `[DEFECTE]`, que poden passar reproduint deute conegut.
