---
type: document
status: esborrany
description: 'Pla de reparació dels 4 defectes diagnosticats per Gemini 4 Argon: presentació del xat en pantalla gran, avatar sdp-media, tasques de la consola i sincronització de LaunchAgents'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_2a27291f-be56-4f2c-a96d-2d0a1a633816:7bf5d185-da0f-49ff-97e2-52800f2a26ba
---
# Pla de Reparació Immediata del Xat i Consola Termodinàmica (Execució Claude / Auditoria Codex)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2a27291f-be56-4f2c-a96d-2d0a1a633816:7bf5d185-da0f-49ff-97e2-52800f2a26ba |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T00:07:35.533Z |
| Modificació | 2026-10-14T00:10:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Code / GPT Codex |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-14T00:07:35.533Z: esborrany creat.
2026-10-14T00:10:00.000Z: pla aprovat incorporant el diagnòstic exacte de Gemini 4 Argon High.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Aquest pla executa les solucions tècniques exactes diagnosticades a `261014_0148_auditoria_gemini4.md`:

### 1. [MODIFY] `src/sections/xat/components/EntradaDelPoble.jsx` (Defecte XAT-01)
- **Problema:** En pantalla ampla (`midaRef.current === 'ample'`), el component segresta automàticament `/xat` cap a `/xat/<general.id>`, desmuntant la columna dreta buida on es presenta la comunitat i deixant un mapa buit sense missatges.
- **Canvi:** Eliminar el segrest automàtic cap a `/xat/<general.id>` o obrir `?comunitat=<id>` conservant `activeThread === null` perquè es mostre la targeta de presentació de la comunitat a la dreta fins que l'usuari clique un canal.

### 2. [MODIFY] Avatar i `sdp-media://` (Defecte XAT-02)
- **Fitxers:** `src/components/PedraSeca/atoms/Avatar.jsx`, `src/components/universal/identitat/AvatarResolt.jsx`, i `src/components/PedraSeca/organismes/marca.jsx`.
- **Canvi:** Afegir la guarda `!esMitjaOpac(url)` abans de renderitzar `<img src="sdp-media://...">` per evitar l'error de consola `ERR_UNKNOWN_URL_SCHEME`.

### 3. [MODIFY] `.agents/cron/registre_tasques.json` (Defecte CON-03)
- **Problema:** 3 subtasques de plaquetes (`adopta-orfes`, `lapida-fantasmes`, `quarantena-brossa`) eixen en estat `desconegut` perquè els falta el camp `script`.
- **Canvi:** Afegir `"script": "scripts/immunitari/plaquetes-plan.mjs"` a cadascuna d'elles perquè la regla de `construeixMapa.js:578` les passe a `viu`.

### 4. [MODIFY] Sincronització de LaunchAgents (Defecte CON-02)
- Copiar `scripts/immunitari/org.socdepoble.higiene.plist` a `~/Library/LaunchAgents/` i carregar-lo perquè `higiene-basica` i `higiene-diaria` passen a `viu`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Proves unitàries del xat: `src/sections/xat/XatSection.test.jsx`.
- Verificació del mapa de la consola: `node tooling/brain/mapa-consola.mjs --json` (totes les tasques a `viu`).
- Suite de proves de regressió completa: mantenir les 17.458 proves verdes.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Cap canvi ha de trencar la navegació del xat en mòbil (`mida === 'compacta'`).
- Respectar la immutabilitat de `01_produccio` i la sobirania de dades a IndexedDB.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
