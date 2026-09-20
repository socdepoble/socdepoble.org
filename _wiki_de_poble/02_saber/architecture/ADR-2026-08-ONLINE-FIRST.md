---
type: norma
status: esborrany
description: Decisió d’arquitectura online-first posterior a l’abandó d’A10 i offline total.
tags:
  - escriptori
---
\n# ADR-2026-08 — Online-first i navegadors moderns

## Estat

Acceptada per al desenvolupament nou el 2 d’agost de 2026. L’impacte sobre la
proposta NLnet enviada l’1 d’agost queda pendent de resolució explícita abans de
retirar treball compromés externament.

## Context

El projecte ja no necessita suport específic per a dispositius moderns ni funcionament
100% offline. La pila Online-First afegeix Dexie, snapshots, fallback, service
worker i sincronització parcial sense aportar un CRDT real ni una experiència
fiable.

## Decisió

- Navegadors moderns amb manteniment actiu.
- Servidor/Supabase com a font de veritat per a dades compartides.
- Autenticació i autorització de servidor per a qualsevol dada privada.
- Cache local opcional i no autoritativa per a preferències o rendiment.
- Cap garantia de reconciliació offline, background sync o CRDT.
- Objectiu WCAG 2.2 AA, amb comprovació automàtica i manual abans de publicar.
- Dependències mínimes, justificades per valor mesurable.

## Conseqüències

Retirar PWA, Dexie, mode hybrid, dispositius simulats i doctrina A10/offline.
Mostrar errors de xarxa honestos. Migrar abans qualsevol dada que només visca en
IndexedDB. Desregistrar service workers ja instal·lats durant la transició.

## No-decisió

Esta ADR no tria el transport WhatsApp. Cloud API versus Baileys depén de si el
producte necessita grups o compte personal. Tampoc autoritza eliminar
idempotència, quotes, deduplicació o shutdown segur.

## Compromís extern a resoldre

Revisar
`05_Escriptori_Soc_de_Poble/260801_1900_ACTA_SESSIO_Enviament_NLnet.md` i deixar
per escrit una de tres decisions: mantindre CRDT/NixOS en un subprojecte,
comunicar canvi d’abast o retirar la proposta.

