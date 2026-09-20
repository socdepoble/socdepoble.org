---
type: informe
status: esborrany
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

Per tant, «Online-First complet», «sincronització sense conflictes» i «recuperació garantida» encara no són garanties vàlides.

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


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

