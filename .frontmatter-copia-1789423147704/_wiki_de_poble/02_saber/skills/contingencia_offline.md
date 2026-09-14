---
tipus: informe
estat: futur
description: Contingència futura per evolucionar PWA, dades locals. Vetada actualment.
tags:
  - maquina
---
# Motor Offline i Resiliència

Este document consolida coneixement útil de les antigues propostes de PWA, CRDT, sincronització i recuperació. És arquitectura futura: descriu condicions d’acceptació, no capacitats ja entregades.

## Estat observable

- La PWA usa `vite-plugin-pwa`; `vite.config.js` declara `registerType: 'autoUpdate'` i `src/main.jsx` registra el Service Worker immediatament.
- La secció de gestoria usa Dexie sobre IndexedDB.
- No s’ha localitzat una implementació activa de Y.js, PowerSync, OPFS, una cua CRDT general, compactació de tombstones o restauració atòmica.

Per tant, «offline-first complet», «sincronització sense conflictes» i «recuperació garantida» encara no són garanties vàlides.

## 1. App shell i actualitzacions PWA

L’app shell pot usar cache-first per a assets versionats. HTML, API i dades d’usuari necessiten estratègies pròpies; no s’aplica cache-first indiscriminadament.

Abans de canviar la política actual `autoUpdate`, cal una prova que cobrisca:

- instal·lació neta i primera visita sense xarxa;
- actualització amb una sessió activa;
- caché antiga incompatible;
- recuperació després d’un Service Worker fallit;
- comunicació clara a l’usuari quan cal recarregar.

Una actualització no pot purgar IndexedDB com a efecte col·lateral. Caché d’assets i dades de l’usuari són dominis diferents.

## 2. Persistència local

- Les migracions de Dexie han de ser versionades, idempotents i provades amb una còpia de dades de la versió anterior.
- Cap `clear`, reemplaçament o migració destructiva s’executa abans de validar una còpia recuperable.
- OPFS i IndexedDB pertanyen a l’emmagatzematge de l’origen i poden ser evacuats per la plataforma; una còpia dins del mateix origen no és un backup suficient per si sola.
- Quota, persistència concedida i errors parcials s’han de tractar com a estats normals, no com a excepcions impossibles.

## 3. Sincronització per lots

Una cua local futura ha de conservar cada mutació fins a rebre un reconeixement inequívoc del servidor. Errors parcials, taules no suportades i respostes ambigües no poden buidar la cua.

Cada element necessita identificador idempotent, estat, comptador d’intents i error diagnosticable. Els reintents usen backoff, límit i acció manual; una connexió aparent no prova que la sincronització haja acabat.

## 4. Conflictes i CRDT

CRDT no significa «zero conflictes» ni elimina decisions de domini. Abans d’adoptar Y.js, OR-Set o LWW, cada tipus de dada ha de declarar:

- operacions concurrents esperades;
- regla de fusió i casos que exigixen decisió humana;
- identitat, rellotge i ordre dels esdeveniments;
- cost de tombstones i compactació;
- compatibilitat entre versions.

No s’executa garbage collection fins que tots els peers necessaris puguen reconstruir l’estat. Els llindars de mida o temps s’obtenen de mesures; no es canonitzen números arbitraris.

## 5. Backup i recuperació

Un backup és acceptable quan es pot restaurar, no quan només s’ha escrit. El protocol futur ha de cobrir:

1. snapshot consistent amb versió d’esquema i checksum;
2. còpia fora del magatzem primari, xifrada quan continga dades personals;
3. rotació que conserve almenys una còpia verificada;
4. restauració a un espai temporal;
5. validació abans de l’intercanvi atòmic;
6. canari d’interrupció a cada fase.

La purga total és l’últim recurs, requerix consentiment informat i no s’activa perquè una única lectura falle.

## 6. Portes de promoció

Este document només pot passar de `futur` a `canonic` quan existisquen:

- implementació localitzable i responsables;
- tests offline, d’actualització, conflicte, quota, corrupció i restauració;
- mètriques amb denominadors i dispositius declarats;
- model de privacitat i xifrat;
- rollback provat;
- documentació que coincidisca amb el codi.

## Sinapsis

- [[00_arquitectura_tecnica_unificada]]
- [[03_consola_termodinamica]]
- [[doc_governanca]]
- [[futur_adaptacio]]


## Taxonomia
- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** skills (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]
**Ancoratge de Seguretat:** [[00_index]]


---

**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — Ancorat...
- [[03_consola_termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md]] — [[MOTOR_OFFLINE]]
- [[core_registre_automillora|00_SER_Brain_Identitat/CORE_Registre_Automillora.md]] — | 260711_1500 | 260712_0415 | 13h              | 2       | Integració Centre ...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — Etiquet...
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — Categor...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[MOTOR_OFFLINE]]
- [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — [[MOTOR_OFFLINE]]
- [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — Si una dimensió és N/A, l’IT global també és N/A. No es posa a zero ni es ren...
- [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[00_index|00_INDEX.md]] — [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/M...
- [[seguretat_execucio|02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md]] — [[MOTOR_OFFLINE]]
- [[self_repair|02_ACTUAR_Maquina_Tecnica/skills/self_repair.md]] — [[MOTOR_OFFLINE]]
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[DOC_G...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
