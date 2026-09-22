---
type: informe
status: esborrany
description: Correccions del graf, interaccions, colors Canvas i política CSP amb verificació local.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d6ee237f-6360-4a12-b018-e48c5ef3c1b1:d8e0e0d7-0797-48d5-a26a-0de498cb24d1
---
# Auditoria i correccions del BrainGraph

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d6ee237f-6360-4a12-b018-e48c5ef3c1b1:d8e0e0d7-0797-48d5-a26a-0de498cb24d1 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T03:19:58.751Z |
| Modificació | 2026-09-22T03:19:58.751Z |
| Propietari | codex |
| Aprovació humana | pendent |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 b2f519c4eb08bd94fea8fb554476b04d931ce54131b021efc16217caaa4881f7. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T03:19:58.751Z: auditoria creada amb rebut; correccions i proves locals documentades.

## Troballes

Correccions locals autoritzades pel prompt del Mestre. Llegits AGENTS.md, el genotip viu en 01_ser, l'índex mestre i el pla de MarIA 0510. No hi havia una auditoria anterior activa a l'escriptori.

- P2 · BrainGraph.jsx: onWheel de React cridava preventDefault des d'un listener passiu. Substituït per listener natiu passive:false amb neteja al desmuntatge.
- P2 · BrainGraph.jsx: onNodeClick no s'utilitzava i no existia selecció. Afegits hit-testing, distinció clic/arrossegament, consola de metadades i connexions, selector accessible per als tres tipus i ressaltat del node.
- P2 · BrainGraph.jsx: zoom i pan reactivaven física amb temporitzadors. Ara invaliden el dibuix sense canviar la pausa. Centrar ajusta els límits del conjunt.
- P2 · Canvas: var(...) no resol colors CSS dins fillStyle. Ara resol colors computats; usa text-cos sobre fons-app, escala Retina i jerarquia d'etiquetes segons zoom.
- P2 · modules.css: botonera situada baix. Ara dalt a la dreta, amb fons i botons visibles; consola a l'esquerra i baix en pantalla estreta.
- P2 · index.html i vercel.json: sense worker-src, script-src self bloquejava blob. Afegit worker-src self blob en ambdós. El motor vigent no crea workers i no usa D3: no es pot atribuir-li l'error original. No s'ha afegit unsafe-eval ni ampliat script-src.
- P3 · useForceLayout.js: cerques lineals per cada aresta substituïdes per Map; dependències de dades incloses per reiniciar el bucle quan canvien.

Reunió a l'Olivera: aprove la proposta del listener de MarIA. La millore separant repintat i física, resolent colors Canvas i mantenint coherència entre CSP HTML i capçaleres. L'origen del worker no queda demostrat.

Millora de plantilla proposada: corregir 01_identitat/02_genotip.md a 01_ser/02_genotip.md, indicar l'arrel socdepoble.org i afegir criteris d'acceptació i URL reproduïble. requires_human_decision: false per a les correccions locals demanades.

## Verificació

ESLint dels dos mòduls i del test: 0 errors, 0 avisos. Vitest: 3 proves passen (metadades dels tres tipus, cancel·lació wheel i pausa persistent, clic versus arrossegament). Vite build --outDir /tmp/sdp-braingraph-build: correcte; avisos de chunks grans i importació dinàmica/estàtica de backendPort.

Navegador local: Wiki de Poble, vista Explorador del Cervell, 198 nodes i 816 vincles. Controls i colors visibles en pantalla estreta. Scroll sobre Canvas sense errors ni avisos capturats. El motor de física continua sent main-thread; no s'ha mesurat rendiment en grafs grans.

## Límits

Cap desplegament ni commit. L'arbre ja tenia nombrosos canvis aliens i el directori graph encara no estava versionat. L'origen del worker blob original queda pendent de reproducció; la correcció cobreix la política del repositori, no capçaleres externes de Sollutia. La validació de mòbil és visual, no una certificació d'accessibilitat completa. El rebut documental s'ha obert després de les correccions: no acredita un segell previ de codi. Porta de tancament executada: skills i SCC passen; falla per rebuts/àncores de tres documents previs i vincles preexistents d’índex, ESTAT i LEDGER. El document nou passa la validació individual.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
