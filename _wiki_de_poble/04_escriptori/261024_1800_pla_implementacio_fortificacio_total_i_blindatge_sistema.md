---
type: document
status: esborrany
description: Pla operatiu per a blindar el sistema abans de les fases de disseny i interactius
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:ba5426d3-ae36-4587-b90c-5dde9605331d
---
# Pla d'Implementació · Fortificació Total del Mas: Anti-SSRF, Quota Seguiments, Purgat de Jargó i Pre-Commit Ràpid

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:ba5426d3-ae36-4587-b90c-5dde9605331d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T15:56:33.360Z |
| Modificació | 2026-10-24T16:00:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) amb el Mestre Javi Llinares |
| Aprovació humana | aprovat per àudio del Mestre (261024 17:54) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity IAIA MarIA / Consell |
| Tokens consumits | ~18k |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-24T15:56:33.360Z: esborrany creat.
2026-10-24T16:00:00.000Z: pla aprovat pel Mestre; especificació de fortificació prèvia a la fase de disseny interior.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

L'objectiu suprem és complir el mandat del Mestre: **fortificació total i tancament de forats a tots els nivells abans d'abordar el disseny interior i la interactivitat d'usuaris, empreses i pobles.**

### 1. [MODIFY] `supabase/functions/noticies/index.ts` (Anti-SSRF & Validació de Xarxa · Codex D-08 / P1-07)
- **Problema:** La funció intermediària descarrega feeds externs. Sense blindatge estricte, podria ser explotada per fer Server-Side Request Forgery contra adreces privades de xarxa o metadades cloud.
- **Acció:**
  - Bloqueig taxatiu de protocols no HTTP/HTTPS (`file:`, `ftp:`, `gopher:`).
  - Bloqueig de rangs d'adreces IP privades i de bucle local: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (metadades AWS/GCP), `::1`, `fc00::/7`.
  - Whitelist predeterminada per als 6 referents de la Secció 23 (`emowe.com`, `ayudawp.com`, `iaenaccion.com`, `youtube.com`, `youtu.be`).
  - Afegir test unitari que demostre el rebuig d'intents de connexió a xarxes locals o privades.

### 2. [MODIFY] `supabase/migrations/2610241430_seguiments.sql` (Fortificació de Quota · Codex D-07 / P2-10)
- **Problema:** El topall de 60 seguiments/hora actualment comptabilitza files vives. Un usuari podria fer `seguir` i `deixar_de_seguir` repetidament per saltar-se el topall.
- **Acció:**
  - Registrar timestamps d'esdeveniments d'alta o utilitzar una finestra temporal lliscant que no s'elimine amb la baixa tova.
  - Garantir que no es puguen generar més de 60 sol·licituds/notificacions per hora sota cap combinació d'altes i baixes.

### 3. [MODIFY] `src/sections/notes/visibilitatNota.js` i `SnippetCurador.jsx` (Purgat de Jargó «MAS» · P2-11)
- **Problema:** Tot i haver netejat `/connectar` (on ara diu `Es connecta a ${persona}.`), a les Notes encara subsisteix el text intern «Privada al teu MAS» o «Només al teu MAS».
- **Acció:**
  - Canviar les constants a expressions humanes i netes: «Privada (només per a tu)», «Nota privada», etc.
  - Actualitzar els tests que en depenen (`ConnexioDetall.test.jsx`, etc.) perquè reflectisquen la nova redacció sense errors.

### 4. [MODIFY] `package.json` / `scripts/` (Desacoblament de Pre-Commit Ràpid · P1-10)
- **Problema:** La suite sencera de Vitest són 21.862 proves i tarda 9 minuts, forçant l'ús de `--no-verify`.
- **Acció:**
  - Crear un script `npm run test:precommit` que passe les proves crítiques de seguretat, sintaxi i lint (<30 segons).
  - Permetre que els commits ordinaris de codi puguen validar-se ràpidament sense bloqueig de timeout de 120s.

### 5. [DOCS / RESEARCH] Actualització Documental i Pre-Avaluació de Disseny (Gemini & Codex)
- **Treball paral·lel de Gemini i Codex mentre Claude pica:**
  - **Actualització de Wiki:** Gemini audita tota la Wiki i documentació per reflectir l'estat viu i evitar obsolescències.
  - **Pre-Avaluació del Disseny Interior / Backend d'Usuari:** Analitzar el disseny, interfície i fluxos de les pàgines d'empreses, grups i pobles, proposant millores de components atòmics i simplificació visual per quan Claude acabe el blindatge.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria dirigida de seguretat i notícies:** `npm test supabase/functions/noticies` i proves de proxy.
2. **Bateria de notes i visibilitat:** `npm test src/sections/notes`.
3. **Bateria de seguiments SQL:** Verificació de contracte SQL de la migració `2610241430_seguiments.sql`.
4. **Verificació global de proves:** Comprovació que cap canvi genera regressions (zero fallades).
5. **Lint i Portes:** `npm run lint` net (0 errors, 0 avisos) i `node tooling/gates/porta-olivera.mjs` en Codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Falsos positius a l'Anti-SSRF:** Bloquejar dominis legítims si la validació de resolució és massa rígida. Mitigació: Whitelist explícita dels 6 referents de la Secció 23 i prova de domini canònica.
- **Regressió en cadenes de text de Notes:** Trencar proves existents en canviar «al teu MAS». Mitigació: Executar prèviament `git grep "al teu MAS"` i actualitzar assercions a l'uníson.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1800_prompt_claude_gemini_codex_fortificacio_total_i_blindatge_sistema]]
- [[10_actes/261024_1745_acta_marmota_triomf_fortificacio_trio_adversarial_i_unificacio_lector_bloc_de_notes]]
