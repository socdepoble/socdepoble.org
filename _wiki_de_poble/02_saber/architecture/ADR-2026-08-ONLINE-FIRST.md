---
type: norma
status: esborrany
description: Decisió d’arquitectura online-first posterior a l’abandó d’A10 i offline total.
tags:
  - escriptori
---
# ADR-2026-08 — Online-first i navegadors moderns

Sóc de Poble abandona la doctrina offline total i el suport específic per a l'A10: el servidor és la font de veritat de les dades compartides i la memòria cau local només és una ajuda opcional. Esta decisió retira la PWA, Dexie i la sincronització parcial, i deixa escrit el compromís extern que cal resoldre.

## Nota de vigència (261029)

Esta ADR es conserva com a registre històric i el seu nucli continua vigent (el servidor com a font de veritat de les dades compartides, l'autenticació de servidor per a tota dada privada i cap garantia de CRDT), però tres punts han quedat superats per decisions posteriors:

- **PWA.** La retirada de la PWA (secció Conseqüències) queda esmenada per la closca sense xarxa de l'[[ADR-2026-10-APPS-DEL-DISPOSITIU]] i per la instal·lació de l'App des de `/descarregues` (`P1-69`, commit `e36606db2`).
- **IndexedDB.** La migració de tota dada fora d'IndexedDB queda esmenada per les dades del dispositiu de la mateixa ADR-2026-10 i pel cofre xifrat local de l'[[ADR-2026-13-BYOP-XIFRAT-LOCAL]] damunt de `creaMagatzemIdb`.
- **Accessibilitat.** L'objectiu WCAG 2.2 AA queda superat per l'objectiu AAA (contrast de text no inferior a 7:1) que el Mestre va fixar el 261004 («AAA sempre», Q1 del Mestre, anotat a `src/css/tokens.css` línies 66-67) i que apliquen `src/css/tokens.css` i el Llibre Mestre (`IDEA-40`, `QA-H03`).

## Estat

Acceptada per al desenvolupament nou el 2 d’agost de 2026. L’impacte sobre la
proposta NLnet enviada l’1 d’agost queda pendent de resolució explícita abans de
retirar treball compromés externament.

## Context

El projecte ja no necessita suport específic per a dispositius antics com l'A10 ni
funcionament 100% offline. La pila pensada per a treballar sense connexió afegia Dexie, instantànies,
camins de reserva, service worker i sincronització parcial sense aportar un CRDT
real ni una experiència fiable.

## Decisió

- Navegadors moderns amb manteniment actiu.
- Servidor/Supabase com a font de veritat per a dades compartides.
- Autenticació i autorització de servidor per a qualsevol dada privada.
- Memòria cau local opcional i no autoritativa per a preferències o rendiment.
- Cap garantia de reconciliació offline, sincronització en segon pla ni CRDT.
- Objectiu WCAG 2.2 AA, amb comprovació automàtica i manual abans de publicar.
- Dependències mínimes, justificades per valor mesurable.

## Conseqüències

Retirar PWA, Dexie, mode híbrid, dispositius simulats i doctrina A10/offline.
Mostrar errors de xarxa honestos. Migrar abans qualsevol dada que només visca en
IndexedDB. Desregistrar els service workers ja instal·lats durant la transició.

## No-decisió

Esta ADR no tria el transport de WhatsApp. Cloud API o Baileys depén de si el
producte necessita grups o compte personal. Tampoc autoritza eliminar
idempotència, quotes, deduplicació ni una aturada segura.

La integració amb Sollutia es va decidir després, en l'[[ADR-2026-09-SOLLUTIA-MODEL-B]].
La sincronització CRDT/P2P queda com a visió futura a [[arquitectura_sistema_nervios]].

## Compromís extern a resoldre

Revisar l'acta de sessió de l'enviament a NLnet (`260801_1900_ACTA_SESSIO_Enviament_NLnet.md`,
desada a l'antiga carpeta d'Escriptori `05_Escriptori_Soc_de_Poble/`, que ja no forma
part de l'estructura vigent de la Wiki) i deixar per escrit una de tres decisions:
mantindre CRDT/NixOS en un subprojecte, comunicar el canvi d'abast o retirar la proposta.

## Vincles

- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-10-APPS-DEL-DISPOSITIU]]
- [[ADR-2026-13-BYOP-XIFRAT-LOCAL]]
- [[arquitectura_sistema_nervios]]
- [[00_arquitectura_tecnica_unificada]]
- [[00_index]]
