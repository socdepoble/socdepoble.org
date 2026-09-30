---
type: document
status: esborrany
description: Resolució de les infraccions de porta:tokens i neteja de deute tècnic heretat de T1-T4.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_dae59276-07ff-46dd-8be0-c967ddd01f8d:58752838-bcd8-44a5-a947-b7c923750f1a
---
# Resolució del deute de T1-T4 i Tokens

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dae59276-07ff-46dd-8be0-c967ddd01f8d:58752838-bcd8-44a5-a947-b7c923750f1a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:19:08.701Z |
| Modificació | 2026-09-30T19:19:08.701Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | N/D |
| Tokens consumits | N/D |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T19:19:08.701Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Aquest pla ataca directament les tasques pendents llistades a la secció 5 de l'auditoria `260930_1930_auditoria_claude.md` i les noves infraccions detectades al llançar la `porta:tokens`.

### 1. Context i Troballes (Research)
Després de compilar el WordPress, l'agent orquestrador (MarIA) ha passat la porta de tokens i s'han detectat 12 infraccions on s'usen CSS custom properties (`--sdp-text-sm`, `--sdp-text-sec`, `--sdp-text-xs`, `--sdp-fons-terciari`, `--sdp-radi-base`, `--sdp-ok`) que no estan declarades oficialment i no tenen "fallback".
A més a més, l'error de Playwright del navegador autònom s'ha confirmat com un error de plataforma de MarIA (no del repositori Sóc de Poble). 

### 2. Preguntes Obertes (User Review Required)
Cap per ara.

### 3. Canvis Proposats (Proposed Changes)

### [Acció: MODIFY] `src/css/modules.css` i altres afectats per `porta:tokens`
Substituir o eliminar els tokens il·legals o obsolets que la porta ha cantat, utilitzant només les propietats vàlides que hi ha a `src/css/tokens.css`.

### [Acció: DELETE] `src/components/connexions/ConnexioDetall.jsx`
Aquest fitxer va quedar orfe en implementar la connexió editable (T4/D4). S'ha d'eliminar. (O qualsevol altre directori on es trobe).

### [Acció: MODIFY] `src/sections/control/ControlSection.jsx`
Embolicar amb `t()` les cadenes de text i el títol SEO que han quedat sense internacionalització (deute previ assenyalat a l'auditoria).

### [Acció: MODIFY] Barra Mòbil (a `layout.css` o codi)
Ajustar 1 píxel al coixí (`padding`) o mida de la barra tàctil a 360px per evitar el clipping ("retall") de la paraula "Llamadas" en castellà, que per ara sobresurt per 1 píxel.

### [Acció: MODIFY] `ControlSection` o prova de navegació
Corregir l'ús de majúscules a "Panell de Control" a la barra lateral perquè quadre amb la prova T61 que l'espera en eixe format.

### 4. Pla de Verificació (Verification Plan)
- `npm run porta:tokens` ha d'eixir immaculat (0 infraccions).
- `vitest run` per comprovar que cap canvi CSS ni el cas d'ús "Panell de Control" ha trencat el comportament esperat.
- Càrrega de `/control` al navegador per verificar que canvia d'idioma en directe gràcies a `t()`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Pendent de ser realitzada per l'agent.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Canvis menors, no s'esperen grans riscos a part de l'ajust visual al mòbil a 360px.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
