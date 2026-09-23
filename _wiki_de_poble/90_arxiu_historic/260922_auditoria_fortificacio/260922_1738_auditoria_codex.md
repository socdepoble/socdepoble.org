---
type: informe
status: esborrany
description: Acta de la implementació autoritzada, diagnosi del clon net i límits de verificació per concurrència
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:6fcef6b0-1c94-4b1b-9afa-5b992c5dd78b
---
# Fortificació del Cervell: implementació, proves i bloqueig concurrent

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:6fcef6b0-1c94-4b1b-9afa-5b992c5dd78b |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T15:38:01.399Z |
| Modificació | 2026-09-22T15:38:01.399Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-22T15:38:01.399Z: acta creada després de la implementació parcial i les proves; bloqueig concurrent declarat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Estat de l’execució i tall

**Implementació parcial; no es declara P-7 superada ni repositori verd.** Encàrrec aprovat SDP-PROMPT-LOCAL-260922-1715. Torn `torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276`, inici observable 15:18:31 UTC / 17:18:31 CEST. Tall d’esta acta: 22-09-2026, 17:38 CEST. Primer HEAD `be16f668`; durant la feina un altre operador ha creat `6423590e` i ha continuat escrivint.

Llegits AGENTS, Genotip, índex mestre, els plans Codex 0643 i Claude 1455, les auditories 0643 i 0651 i el semàfor de MarIA 0650. L’aprovació d’execució és la del prompt humà, encara que els plans conservaven «pendent» als seus registres. No equival a autorització de desplegament.

### P-0: prova real en clon net, abans de tocar fonts

Clon temporal `/private/tmp/sdp-fortificacio-p0` de `be16f668`, sense copiar node_modules ni estat privat del portàtil.

| Pas literal | Resultat observat |
| --- | --- |
| `git clone --no-hardlinks . /private/tmp/sdp-fortificacio-p0` | Exit 0. |
| `npm ci --offline --no-audit --no-fund` | ENOTCACHED: dependències no presents a cache. |
| `npm ci --no-audit --no-fund` | ERESOLVE: core 3.31.3 exigeix pm 3.31.3 però react/starter-kit i pm estan a 3.31.0. No s’ha usat force ni legacy-peer-deps. |
| `git ls-files .claude/skills .agents/runtime/turns` | Sense entrades en aquell commit. |
| `node tooling/gates/obrir_torn.mjs` | Script antic: imprimeix identificador temporal, sense el registre documental modern. |
| `node tooling/wiki/document.mjs --help` | MODULE_NOT_FOUND: el fitxer no forma part d’aquell commit. Creació i validació documental no poden executar-se. |
| `git -c core.hooksPath=.husky -c user.name=Prova -c user.email=prova@example.invalid commit --allow-empty --dry-run` | Exit 1, res a commitar; un dry-run no prova l’execució dels hooks. No s’ha aconseguit un commit de successió. |

Proposta de reparació de versions assajada després en `/private/tmp/sdp-fortificacio-dependencies`: alinear react i starter-kit a 3.31.3 amb `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact …`. També retorna ERESOLVE. No s’han traslladat aquests fitxers al repositori ni modificat dependències de l’app. Cal resoldre el conjunt de peers en un entorn aïllat i repetir npm ci; no tornar a provar la mateixa ordre a cegues.

### Canvis efectuats

| Fase | Canvi i límit |
| --- | --- |
| P-1 | Inventari per hash de tota la zona humana, inclosos binaris, altes i baixes. La recuperació dels dos documents l’ha feta un altre operador durant la sessió. No els he restaurat, editat ni eliminat. El torn antic no els inventariava: `startHumanWatch` registra l’observació real de l’actualització i conserva l’inventari original. No afirma protecció retrospectiva. |
| P-2 | Plans absents diagnosticats amb ruta; propietat explícita de documents; `handoff` registra ruta anterior, nova ruta, hash i data. Validació de documents arxivats per ruta explícita, sense recórrer tot l’arxiu. Els torns tancats no es reobrin ni es reescriuen silenciosament. |
| P-3 | Somiador consulta plans i rebuts i respecta documents ancorats. La protecció és conservadora i inclou rebuts tancats fins que hi haja una promoció explícita adequada. **No he executat el Somiador**, tampoc en sec; les proves criden el selector pur en fixtures. |
| P-4 | Plantilles alineades amb les 13 rutes; blocs fixes Context i Olivera, snapshots adreçats per hash, ajuda CLI, preàmbul i camp Plantilla. Rutes de plantilla carregades selectivament. Actes permeses a 10_actes. Importació explícita amb original conservat i procedència al rebut. Punter vell retirat a `.agents/runtime/punters_retirats/`. |
| P-5 | Ledger, segell, autoritat i plantilles formen part de tancament. `--check` continua sent lectura. `--close` afegeix checksum del LEDGER dins de l’operació, restaura els bytes previs si fallen les portes i no inventa closed. És integritat per hash, no autenticació d’autor. |
| P-6 | Guardes amb `pathToFileURL` i exemple de tractor-arrel corregits; Matrix accepta el contracte v4. Proves d’entrada CLI amb espais per Manifest i Matrix; falta completar la verificació de tots els executables, especialment els mutadors, en fixtures aïllades. |
| P-7 | README corregit: totes les migracions SQL per ordre alfabètic i després seed; explica torns, snapshots i hooks. Ignore de locks i punters locals. **No completat el commit durable ni el clon final amb hooks.** No he manipulat l’índex Git compartit mentre un altre operador hi commita. |
| Complement Codex | AGENTS arrel únic, mirall generable i comprovable, rutes d’arrencada corregides, huit dimensions lògiques sense reanomenar carpetes, lectures coherents d’arquitectura online, lliçons separades del procediment, estat actual per marcador explícit i diagnosi acumulada només de portes declarades de lectura. |

El pla d’execució del torn és [[260922_1719_pla_implementacio_codex]], vinculat als dos plans aprovats. La nova plantilla conserva el context rural, el Rentonar i l’Olivera literalment; els camps de tasca i proves continuen sent responsabilitat de qui redacta.

### Compatibilitat i regularització honesta

S’han afegit snapshots a **11 rebuts** només quan el hash de contracte i el de plantilla coincidien exactament amb els bytes observats abans de la revisió. Set rebuts antics de tres torns no coincidien i **no s’han reconstruït ni renovat**: `acdcaf49`, `afa18e33`, `f8920453`. Requerixen recuperar el contracte original verificable o una revisió explícita. No s’ha fabricat cap lectura antiga.

S’han revisat explícitament els set documents anteriors sense rebut vàlid: informe 0500 del laboratori, prompts 0550/0602/0612, tasques UI 0612, pla MarIA 0650 i prompt humà 1715. Abans d’escriure, s’ha comprovat que els seus hashes coincidien amb els de l’obertura del torn. Els originals complets viuen a `.agents/runtime/imports/<sha256>.md`; els rebuts nous indiquen `origin.kind: explicit-import`. El text original queda també dins del camp editorial de la revisió. Açò valida la procedència de la revisió, no la veracitat de totes les conclusions antigues.

### Per què es mutilaven les plantilles

La causa local està demostrada al codi: `draft()` recorria la llista de títols i escrivia `[pendent]`; no copiava Context ni Olivera. A més, la pàgina ISO i el router exigien títols diferents i coexistien diverses versions de plantilla. Copiar la pàgina fidelment podia produir un document invàlid; usar el generador produïa un esquelet vàlid però sense el context que el Mestre esperava. El sistema delegava en la memòria de redacció de l’agent una obligació que havia de ser determinista.

La correcció és mecànica: llegir plantilla; instanciar literalment blocs normatius; omplir només camps editorials; validar integritat i estructura; conservar el contracte concret del rebut. No s’atribueix comprensió a un hash. La tendència general d’un model a resumir és una hipòtesi possible, però no cal usar-la com a explicació causal quan el generador descartava el text de manera observable. No he fet una investigació bibliogràfica ni afirme conclusions psicològiques sobre els models.

### Estratègia d’indexació proposada

La identitat documental ha de ser independent de carpeta, nom visible i estat de vida. Recomane un identificador estable, un registre d’ubicacions i relacions tipades (`deriva_de`, `implementa`, `substituix`, `verifica`, `pertany_a`). L’índex d’Escriptori és una vista de treball actiu; no és la identitat ni l’únic pare d’un document.

En promocionar un document: conservar identificador i contingut original; registrar la nova ruta i el rebut; actualitzar els enllaços entrants basats en ruta; donar-li un índex temàtic i un índex històric; mantindre una redirecció d’alias quan el títol antic siga únic. El catàleg del graf pot carregar **metadades de l’arxiu**, sense incorporar el cos històric al RAG operatiu. Una aresta a història ha de distingir-se visualment d’una instrucció vigent. Ambigüitats i IDs duplicats han de fer fallar la porta, no resoldre’s pel primer basename trobat.

Un `[[00_index_escriptori]]` dins d’un document arxivat pot conservar-se com a **procedència**, però no significa que el document continue actiu. Les relacions temàtiques i de dependència sostenen la connexió després del moviment. El mecanisme de handoff d’esta sessió és una base de traçabilitat; el catàleg global de IDs i relacions queda com a proposta, tal com demanava el prompt. No s’han mogut carpetes per a simular un graf sa.

### Reunió a l’Olivera i bloqueig concurrent

L’esmena d’Opus de posar P-0 primera era correcta: ha descobert un conflicte npm anterior al problema documental. També tenia raó sobre la zona humana invisible. La proposta de «quatre línies» per al Somiador és insuficient com a garantia completa: registres corruptes, rebuts tancats i arxivats necessiten política explícita i proves.

El 17:28, MarIA ha afegit la regla de nomenclatura a `wiki-documentacio-i-reflex`; l’he llegida i preservada. Després, durant les verificacions, un altre agent ha reescrit **`tests/fortificacio.test.mjs` i `tooling/gates/porta-plantilles.mjs`**. He aturat l’edició compartida i he demanat al Mestre que reserve estos fitxers a un sol editor. El mateix pla Opus exigix aturar escriptures quan canvien els hashes. Cal revisar la integració del resultat abans de donar-lo per acabat.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Resultats observats

- Baseline: 45 proves documentals prèvies.
- Primera suite ampliada de Codex: 59/59 verdes. Després d’afegir arxivat tancat i importació explícita: **61/61 verdes**, registre temporal `/private/tmp/sdp-fortificacio-tests3.txt`.
- Després de la reescriptura concurrent de la suite, una execució falla per un torn incomplet `torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76`. En la lectura següent el fitxer ja no hi era. És evidència d’un arbre canviant, no una conclusió sobre l’estat final d’eixa altra sessió.
- Porta de plantilles: 13 rutes coherents; porta d’autoritat: valid true. Segell regenerat després de llegir la regla nova de MarIA.
- `run-portes --diagnostic` ha acumulat diversos errors i ha retornat no-zero. No executa les portes mutadores per defecte en este mode.
- `tancament --check --turn-id …` continua **valid:false**: LEDGER pendent de signatura, enllaços històrics que el manifest no resol, els dos documents humans restaurats sense àncora i, abans d’esta acta, faltava el relleu ESTAT/LEDGER. Les proves documentals de la seua última execució han passat, però el tancament global no.

Els fitxers humans es poden ancorar editant l’índex sense tocar-los. Els seus enllaços històrics requerixen un resolutor/registre de destinacions; no s’han esborrat enllaços ni relaxat la porta per amagar el problema. No s’han executat build d’app, migracions de base de dades, desplegament ni CI.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Pendents abans de declarar complet el pla

1. Assignar un únic editor a tooling/documental, gates, plantilles i .agents; revisar la integració concurrent i restaurar la cobertura de proves que siga necessària.
2. Resoldre el conflicte de peers de Tiptap sense force; repetir npm ci en clon net.
3. Completar la reparació d’enllaços i àncores, respectant la zona humana; resoldre rebuts històrics que no disposen de contracte recuperable.
4. Verificar totes les guardes CLI en fixtures amb espais, revisar el hook real i completar tancament explícit.
5. Versionar coherentment codi, plantilles, documents, imports, torns i snapshots; després repetir el clon net fins al commit amb hooks actius i fer el relleu en una sessió nova.

El torn es conserva obert si les portes fallen. Un report de proves anterior no certifica els fitxers sobreescrits després. No hi ha commit final fet per Codex ni desplegament. L’aprovació d’implementació continua vigent: la decisió pendent és el repartiment d’edició, no tornar a aprovar el mateix pla.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260922_1719_pla_implementacio_codex]]
- [[260922_0643_pla_implementacio_cervell]]
- [[260922_1455_pla_implementacio_claude]]

### Rebut final de tancament

`node tooling/gates/tancament.mjs --close --turn-id torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276` ha retornat exit 1 i `valid: false` el 22-09-2026 a les 17:40 CEST. El torn continua `planned`; la signatura temporal del LEDGER s’ha revertit en fallar les portes. La validació individual d’esta acta és verda. ESTAT i ON_ESTIC ja contenen el relleu explícit.
