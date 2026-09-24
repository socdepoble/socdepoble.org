---
type: document
status: esborrany
description: Reconciliació del segell, cablejat de la plantilla viva i neteja verificada del Brain.
tags: [implementacio]
visibility: private
reflex: sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:0a8dc277-a45e-471f-a31f-f282814b9f0c
---
# Pla d’Implementació: reconciliació i neteja

**Estat del Pla:** executat; tancament global pendent dels bloquejos consignats a l’auditoria.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260924-1910 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 19:53 Europe/Madrid |
| Modificació | 2026-09-24 19:56 Europe/Madrid |
| Propietari | Codex |
| Aprovació humana | Execució autoritzada després de l’auditoria tècnica, resposta explícita en este xat. |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats; no es declara una xifra inventada. |
| Tall d’evidència | 80d4d9d85e722594bc96a5849059dac364d8c1f0 i arbre de treball de 2026-09-24 19:53–19:56 |
| requires_human_decision | false |

## Acte reflex

Plantilla pla.implementacio llegida íntegra i rebut nou obtingut en el torn actual. No acredita una entrega a les 19:10.

## Historial

2026-09-24 19:10: MarIA proposa resegellar, instal·lar porta i netejar Brain, inicialment adreçat a Claude. 19:56: Codex contrasta el disc, completa l’auditoria i el Mestre autoritza execució. Es conserva el cognom codex de la convocatòria.

## Canvis proposats

1. Reconciliar amb els hashes exactes de l’auditoria i la justificació demanada; verificar verd abans de lease.
2. Aplicar per executor-mutacio els pedaços de tooling/gates/porta-plantilla-viva.mjs, tooling/gates/hooks-local.mjs i .husky/pre-commit, incloent lectura del blob staged.
3. Eliminar tooling/brain/brain_distill.py amb lease, hash previ i còpia recuperable; retirar brain:distill i brain:maintain de package.json. Conservar els altres 19 scripts amb els consumidors justificats a l’auditoria; exposar cens_cromatic com brain:cens. No tocar lockfile ni dependències.
4. Reparar àncores de l’escriptori i regularitzar els documents 1910 amb plantilla i rebut. Proposar higiene per estat de torn, manifest i arxivat transaccional; no instal·lar un procés que moga documents encara vius per data.
5. Registrar resultats en auditoria, ESTAT i LEDGER; executar comprovació de tancament i declarar qualsevol roig global.

### Alternatives descartades

Purgar per manca de referències perdria un CLI útil. Activar quarantena en cada escriptura retiraria documents en elaboració. Es tria baixa mínima amb evidència i validació abans de mutar.

## Verificació

Execució registrada a l’auditoria 1953: segell i porta verds, baixa verificada, 19 scripts sense orfes, Vitest 359/359. Dues fallades prèvies de proves Node/fixtures i incidències SCC impedixen un verd global.

Segell; proves de plantilla/hook/índex parcial; cens; catàleg; regressions documentals i de Brain; lint dels targets; porta d’orfandat; comprovació documental i tancament. Fallades prèvies alienes al canvi es consignen, no s’amaguen.

## Riscos

Arbre compartit amb canvis concurrents: CAS i scopes exactes per a cada lease. No sobreescriure frontend, no buidar laboratori ni zona humana. No activar launchd fora del repositori. No confondre un rebut documental amb una lease.

## Vincles

- [[260924_1953_auditoria_codex]]
- [[260924_1910_prompt_codex]]
- [[00_index_escriptori]]
