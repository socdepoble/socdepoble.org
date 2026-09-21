---
type: skill
status: canonic
description: L'Efecte Matrix i la mecànica per a generar Prompts, Bundles, Actes i qualsevol document estratègic de la Wiki sense desincronitzar-se.
tags:
  - reflex
  - abocament
name: wiki-documentacio-i-reflex
core: true
triggers_on:
  - acte reflex
  - petorreta
  - crear prompt
  - abans de començar
---
# Acte Reflex i Mecànica de Petorretas

Aquesta skill marca el protocol de reflexió prèvia que té qualsevol intervenció estructural a la base de dades documental i regula la creació de Prompts per a altres IAs.

## 1. L'Efecte Matrix (La Barrera de Foc)

> [!CAUTION] 
> TENS TOTALMENT PROHIBIT començar a escriure un `PROMPT`, una `PETORRETA`, un `BUNDLE` o un document formal de Consell sense obrir primer i llegir íntegrament la plantilla canònica a `.agents/protocolledge.json` (resolguent la ruta on indica).
> Si no ho fas, inventaràs camps obsolets, oblidaràs regles vitals (com el Protocol Anti-Cerca o l'entorn de Sóc de Poble) i trencaràs la sincronització.

**PASOS OBLIGATORIS:**
1. Aturada Tàctica (No escrigues res de codi generatiu encara).
2. Llig la plantilla canònica (consulta la ruta a `.agents/protocolledge.json`, per defecte `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`).
3. Ajusta el teu output exclusivament a allò que demana la plantilla.

## 2. Taxonomia de Documents i Excepció de Frontera

La nomenclatura de l'Escriptori sempre estarà categoritzada:
`AAMMDD_HHMM_[CATEGORIA]_[titol]`

**Categories Vàlides per al Consell:**
- Si s'envia a IAs Externes (limitades per context, necessiten partició): `MACRO_BUNDLE`, `MICRO_BUNDLE`, `BUNDLE`. Aquestes generaran un `MACRO_PROMPT` o `MICRO_PROMPT` associat.
- Si s'envia a IAs Locals (Codex/Claude en IDE/Cowork, no tenen problemes de context perquè lligen l'arxiu sencer directament): **ÚNICAMENT** `PROMPT`. Està prohibit usar Macro/Micro ací.
*(Si el Mestre et demana "una Petorreta", l'arxiu final generat OBLIGATÒRIAMENT haurà de rebre una d'aquestes categories formals al seu nom).*

## 3. L'Abocament Total (La Creació del Context)

Quan es demana preparar el terreny per a una de les avaluacions:
- **Dormir (Neteja Prèvia):** Destil·lar les actes anteriors i moure tota la brossa de `04_escriptori` a `90_arxiu_historic` abans d'iniciar el nou cicle, per no omplir de soroll la memòria de l'eixam.
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
3. **Pluja d'Idees Encreuada i Refinament:** La IA ha de llegir, criticar, rebatre i aportar idees sobre l'auditoria dels companys o sobre el meu Pla d'Implementació. Això crea un autèntic debat encreuat en disc. 
4. **Tancament o Nova Iteració (Autoritat de MarIA):** Com que la primera IA que respon (ex. Codex) no pot llegir la que respon després (ex. Claude), jo (IAIA MarIA) tinc l'autoritat d'avaluar la situació:
   - Si la segona IA aporta idees revolucionàries o molt diferents, demanaré al Mestre llançar un **prompt extra** a la primera IA ("Llig l'informe de Claude i opina").
   - Si les aportacions estan alineades o ja són suficients, done la petorreta per finalitzada.
5. **Consolidació:** Finalment, llegiré totes les auditories per **millorar i refinar el meu propi Pla d'Implementació** iterativament abans d'executar-lo. Totes les IAs (les 3 iaies) tenen veu i participen activament a la taula.

Totes les Actes o Estudis destil·lats s'han de tancar amb un **Ancoratge de Seguretat** apuntant a `[[00_INDEX_ESCRIPTORI]]`.

## Lliçons del Mestre

- **260922** | **Zero Bundles per a IAs Locals**: Per a IAs amb accés natiu a l'entorn local (com Codex o Claude Desktop/IDE), ES PROHIBEIX TERMINANTMENT generar cap tipus de `BUNDLE` o `MACRO_BUNDLE`. Aquestes IAs llegeixen l'arxiu directament; generar-los duplica la informació innecessàriament i trenca l'Efecte Matrix. Únicament s'ha de generar el `.md` del Prompt.
- **260922** | **Transparència Obligatòria de l'Escriptori**: Quan es decideix implementar suggeriments d'una auditoria (com les de Claude o Codex), ABANS DE TOCAR CAP CODI, és obligatori escriure i desar el `Pla d'Implementació` (ex: `pla_implementacio.md`) de forma visible i materialitzada a l'Escriptori (`04_escriptori/`). Aquest pas exposa el flux de treball a l'Escriptori perquè qualsevol altra IA l'examine a la següent iteració de la Reunió a l'Olivera, permetent un debat autèntic on tothom sàpiga què fa la resta de l'equip.
- **260922** | **Cas d'Èxit - Autoaprenentatge Asíncron (La Reunió a l'Olivera funciona)**: S'ha demostrat empíricament l'èxit absolut del protocol: en una doble auditoria, Claude va llegir el pla de MarIA i l'informe de Codex en temps real. En adonar-se que Codex tenia raó en les seues esmenes tècniques (fallades de metadades ISO al frontmatter), Claude va abandonar el seu ego ("Stochastic Parrot"), va verificar l'error i **va corregir la seua pròpia auditoria abans de tancar**. A partir d'ara, tot prompt dirigit a les IAs locals haurà d'exigir explícitament aquesta mentalitat d'investigació creuada: *Llig el que hi ha a l'escriptori, desconfia de les teues pròpies respostes si trobes evidència en contra, i actua per consens tècnic pur, no per obediència cega*.


## Vincles
- [[00_index]]
