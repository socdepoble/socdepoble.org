---
type: document
status: esborrany
description: Pla rector per a l'auditoria extrema del sistema, consola d'administració d'empresa i conformitat amb FacturaDirecta i Holded
tags:
  - implementacio
visibility: private
reflex: sdp:torn_697e1f82-0b02-4b03-8ef1-23c17ed8e0af:eb20dbef-72ca-4d3e-bdf3-4bf822682321
---
# Pla d'Auditoria Adversarial de Sistema i Consola d'Empresa (Gemini 4 Argon)

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_697e1f82-0b02-4b03-8ef1-23c17ed8e0af:eb20dbef-72ca-4d3e-bdf3-4bf822682321 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T23:30:18.496Z |
| Modificació | 2026-10-13T23:32:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High Thinking) |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-13T23:30:18.496Z: esborrany creat.
2026-10-13T23:32:00.000Z: pla aprovat per a execució per Gemini 4 Argon.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Aquest pla defineix el full de ruta per a l'auditoria extrema de la Consola i el subsistema de Gestoria, encomanada a **Gemini 4 Argon High**:

1. **Diagnòstic Adversarial de la Consola Actual:**
   - Analitzar la navegació i flux de la Consola (`src/sections/consola/`).
   - Avaluar l'error `ERR_UNKNOWN_URL_SCHEME` a l'avatar i la coherència de les rutes.
2. **Benchmark Arquitectònic FacturaDirecta vs. Holded:**
   - Comparar els fluxos de facturació, models fiscals trimestrals (303/130) i contactes d'ambdós sistemes.
   - Proposar les adaptacions necessàries a Sóc de Poble per aconseguir una ergonomia superior o equivalent a FacturaDirecta.
3. **Especificació de la Consola V3 (Local-First):**
   - Tauler d'administració amb gràfics financers clars (ingressos, despeses, rendiment net).
   - Auto-hidratació directa des de l'Escàner Local (`_gestoria_de_poble`).
   - Mòdul de Contactes amb NIF, categoria client/proveïdor i historial.
4. **Guia de Treball per a la sessió matinal del Mestre:**
   - Identificar les pantalles i fluxos concrets on es necessiten captures de pantalla en la sessió de demà.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Verificació del contracte de dades i de la conformitat amb Pedra Seca.
- Cap codi de producció ni de `01_produccio` s'ha de veure alterat sense revisió prèvia.
- L'auditoria final s'emetrà a `_wiki_de_poble/04_escriptori/261014_HHMM_auditoria_gemini4.md`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Evitar qualsevol dependència de serveis cloud privats per al processament financer: el nucli és i serà local-first i sobirà.
- Protegir absolutament les claus i dades personals reals del Mestre.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
