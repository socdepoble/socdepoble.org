---
tipus: acta
estat: generat
description: Acta de tancament de l'auditoria consolidada i sanejament d'arquitectura.
---

# Acta Marmota - Sessió de Consolidació d'Auditoria 

**Data termodinàmica**: 260914_2359

## Estat General del Mas
- Les tasques establertes per l'auditoria consolidada 9-IA han estat enllestides (P0, P1 i P2).
- S'ha eliminat la fractura ideològica entre *Online-First* i *Offline-First*. Oficialment, **Sóc de Poble és Online-First**, actuant el motor local-first exclusivament com a `estat: futur`.
- Les eines del tractor de frontmatter, teixidor i referències de l'auditoria s'han estabilitzat sobre la nova taxonomia de la **Versió 2**.
- Totes les baselines del deute tècnic s'han posat a 0 o congelat (`npm run porta:baseline`).

## Què hem fet 
- Ens hem encarregat de sanejar la base de dades eliminant el camp `hero_image` il·legítim.
- Hem eliminat pèrdues de dades d'entitat durant actualitzacions de les organitzacions (`lema` i `logo_url`).
- S'han purgat de la llavor de mercat totes les dades que revelaven els noms i cognoms de la Torre (passant la Porta de Llavor).
- Els *skills* (documents i frontmatters) ja admeten els seus propis esquemes v2. Les portes d'importacions, rutes, esquemes i nomenclatures ja estan totalment satisfetes amb l'estructura de fitxers de minúscules (`tractor-nomenclatura`).
- S'ha completat tot l'ancoratge lògic (Teixit) gràcies als processos del teixidor i de codemods sobre el frontmatter (`tooling/wiki/codemod_frontmatter.mjs --escriu`).

## Properes passes (Per al pròxim torn)
1. Pujar un `commit` complet al repositori, el `Reflex` el validarà com a íntegre amb les noves baselines establertes hui.
2. Centrar-se en avançar en qualsevol altra feature estipulada del full de ruta o refactoritzar codi de vistes.
