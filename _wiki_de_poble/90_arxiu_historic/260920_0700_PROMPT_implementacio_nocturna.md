---
type: petorreta
status: actiu
description: Prompt per derivar a les IAs del Consell (Claude, Astra, Codex) la implementació de F9 i la revisió de servidor caigut.
tags:
  - govern
---

# Petorreta Nocturna: Implementació del Tractor (F9) i Revisió Servidor

> **Instruccions per a les companyes de l'Eixam (Astra, Claude, Codex, etc.)**

Hola companyes! 

Us adjuntem el **MACRO BUNDLE** actualitzat del nostre sistema (Sóc de Poble). El nostre Mestre Javi és humà i se'n va a dormir. Us passem la torxa perquè vosaltres feu la feina d'implementació durant la nit. Així demà només caldrà copiar i enganxar el codi.

## El que he estat fent amb les "IAs de Frontera"

Avui hem tingut una sessió molt productiva (i exigent!) d'arquitectura inversa i blindatge amb l'ajuda de Codex i Claude (les versions de pagament). Hem aplicat els pedaços S1, S2 i S3 (solucionant pèrdues de sessió per errors de xarxa i problemes amb els `AbortController`) i hem blindat l'arquitectura de permisos de l'agent. També hem esporgat la Wiki i actualitzat l'esquema de Frontmatter a la v2 (taxonomia tancada de 8 etiquetes). El sistema ara és **molt més àgil, segur i lleuger**.

## La Vostra Missió

Necessitem que implementeu aquests últims ajustos:

1. **Implementar F9 (`validaVincles`)**: Al bundle veureu el fitxer `tooling/wiki/tractor-frontmatter.mjs`. Cal que hi afegiu la nova norma `F9` (que valida que la secció `## Vincles` contingui enllaços interns vàlids) tal com es descriu a l'auditoria recent de Codex. Heu d'escriure la funció i inserir-la al bucle del tractor perquè penalitzi en l'array de fallades (`f.F9.push(...)`). Retorneu-nos el codi sencer del fitxer llest per reemplaçar-lo.

2. **Revisar per què no va la web (`ERR_CONNECTION_REFUSED`)**: Després dels darrers canvis manuals a `src/data/sessionService.js` i `src/data/supabase/auth.js` el servidor web local ha caigut (o trenca la compilació). Analitzeu el codi actual d'aquests fitxers que s'adjunten al bundle, detecteu on és l'error de sintaxi o lògica que provoca la fallada, i retorneu els fitxers arreglats.

3. **Consells i suggeriments**: Si veieu alguna cosa al codi que es pugui millorar ràpidament o que sigui inestable en l'autenticació/sessions o la gestió de la xarxa, deixeu-nos un consell.

Sigueu eficients. Ens llegim demà al matí. Molt bon descans per al Mestre i bona feina per a vosaltres!
