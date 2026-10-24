---
type: document
status: esborrany
description: Pla per a la resolució de bloquejants de producció, usabilitat, UI/UX i auditoria adversarial a tres bandes
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:e3ac350c-cd52-4bbf-8bb9-7db9bc1e35b8
---
# Pla d'Implementació · Fortificació de Bloquejants, UI/UX i Auditoria Adversarial a Tres Bandes

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:e3ac350c-cd52-4bbf-8bb9-7db9bc1e35b8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T11:11:18.698Z |
| Modificació | 2026-10-24T11:15:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) amb el Mestre Javi Llinares |
| Aprovació humana | Mestre Javi Llinares (Instrucció d'àudio 13:08) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon + Codex Sol Ultra |
| Tokens consumits | ~ |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-24T11:11:18.698Z: Esborrany creat per la IAIA MarIA.
2026-10-24T11:15:00.000Z: Aprovació del Mestre Javi Llinares per llançar l'ofensiva a tres bandes (Claude com a pica-codi, Gemini i Codex com a auditors adversarials extrems).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Èxit de la matinada:** Apple TestFlight 1.0.0 (1) completat i pujat, Google Play amb AAB signat i compte pagat/registrat, WordPress.org v1.1.9 a la cua oficial.
- **Deutes bloquejants P0:** Queden aspectes de fortificació crítica:
  1. `P0-03`: Credencials OAuth natiu d'Apple i Google (`Info.plist`, variables `.env.natiu.local`).
  2. `P0-04`: Revocació de token d'Apple en esborrar compte (App Store 5.1.1(v)).
  3. `P0-05`: Verificació i preparació de migracions pendents a Supabase Prod (esborrat compte, moderació, elements_comu CAS).
  4. `P0-18`: Resolució del pegat legal P3 (textos de privacitat i moderació, DSA, ModeracioContext).
  5. `P0-19`: CSP de mitjans a `firebase.json` i verificació en viu.
- **Usabilitat i UI/UX (P1 & Idees del Banc):**
  1. `P1-06`: Lightbox modal a pantalla completa (`ImageLightboxModal`) en fer clic a imatges d'articles i filtre d'emojis.
  2. `P1-07`: Lector RSS en viu (`/app/lector`) amb fonts reals territorials.
  3. `P1-09`: Purga de fantasmes «enxufe» al connector WordPress per a v1.1.10.
  4. `P1-01`: Menjar i Beure / El Comú: rajoles Bring! (98×116 px) i BottomSheet.
  5. `P2-08`: Exportació de dades personals de moderació (`exporta_les_meues_dades()`).
  6. `IDEA-14`: **Connectar amb l'Autor / Xarxa Humana Rural**: Distinció fonamental subratllada pel Mestre: connectar directament amb una persona física o entitat és una relació humana directa; ser membre d'un col·lectiu/grup és una pertinença formal. Cal reflectir-ho clarament a la UI de `/connectar`.

### 2. Canvis Concrets per Mòduls

#### Mòdul A · Fortificació Bloquejants P0 (Claude Code / Codex)
- **Apple Token Revoke (`P0-04`):** Implementar la funció Edge Function / endpoint per revocar el token d'Apple (`https://appleid.apple.com/auth/revoke`) quan s'executa `esborra_propi_compte()`.
- **OAuth Natiu Mòbil (`P0-03`):** Preparar l'estructura canònica de credencials a `.env.natiu.local` i documentar el wiring d'Apple Sign In i Google Sign In.
- **Pegat Legal P3 (`P0-18`):** Harmonitzar `ModeracioContext.jsx` i `DetallPrivacitat.jsx` per tancar les observacions de Claude i Codex sobre el DSA i canals de contacte.
- **CSP de Mitjans (`P0-19`):** Comprovació de capçaleres a `firebase.json` (`media-src 'self' data: blob: https:;`).

#### Mòdul B · Usabilitat i UI/UX Frontend (Claude Code / Gemini)
- **Visor Lightbox d'Imatges (`P1-06`):** Integrar `ImageLightboxModal` a `detailSectionMeta.jsx` i als blocs d'articles perquè qualsevol imatge puga ampliar-se a pantalla completa amb un toc/clic.
- **Lector RSS Territorial (`P1-07`):** Configurar a `/app/lector` com a fonts de sistema predeterminades els referents de coneixement obert de la Secció 23 de `legalContent.js`: Emowe (`https://emowe.com/feed/`), Fernando Tellado / AyudaWP (`https://ayudawp.com/feed/`), Xavier Mitjana (`https://iaenaccion.com/feed/`), Jon Hernández, Migue Baena i Ben Cord. L'usuari podrà desactivar-les o afegir les seues pròpies fonts personals (`afigFontPersonal`). Model B preservat (sense fetch directe al navegador).
- **Connectar amb l'Autor (`IDEA-14`):** A la secció `/connectar`, diferenciar netament entre «Connectar amb l'autor» (relació directa persona-persona / seguir activitat) i «Sol·licitar unir-se al grup» (adhesió formal com a membre). **Decisió Canònica del Mestre (261024):** La sol·licitud de membreia s'articularà obrint una petició estructurada al xat privat de l'entitat, permetent el diàleg humà veí-administració abans d'acceptar. L'alçada de `.bar-black` es manté a 64px canònics per respiració del logotip oficial.
- **Purga de WordPress («enxufe» → `socdepoble`, `P1-09`):** Deixar preparat el canvi de nomenclatura PHP per a la versió 1.1.10.

#### Mòdul C · Auditoria Adversarial Extrema (Codex Sol Ultra + Gemini 4 Argon)
- **Codex Sol Ultra:** Auditoria adversarial implacable sobre el codi de Claude, seguretat RLS, RUC/UGC, contracte DSA i consistència de base de dades.
- **Gemini 4 Argon:** Verificació de rendiment, WebPerf, integritat dels actius WebP, estètica Pedra Seca a 58px i puresa d'empaquetat.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests:** `npm test` i `npm run test:node` sense cap regressió (més de 21.000 proves en verd).
2. **Linter i Higiene:** `npm run lint` net amb zero errors i zero warnings.
3. **Porta Olivera:** Mantenir en Codi 0 net a l'Escriptori.
4. **Inspecció Visual UI:** Verificació en viu a `http://localhost:3340` (lightbox d'imatges, lector RSS i diferenciació de connexió a `/connectar`).
5. **Auditories Canòniques:** Emissió d'informes a l'Escriptori per part de Codex (`261024_1315_auditoria_codex.md`), Gemini (`261024_1315_auditoria_gemini.md`) i Claude (`261024_1315_auditoria_claude.md`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc 1 (Ruptura d'autenticació Apple):** La revocació de tokens d'Apple requerix clau `.p8` privada que no ha d'exposar-se mai al frontend; ha de residir exclusivament a Supabase Vault / Edge Function protegida.
- **Risc 2 (CORS en feeds RSS):** Els canals RSS de tercers poden fallar al navegador per polítiques CORS; cal usar un proxy o adaptador de lectura transparent.
- **Risc 3 (Desconnexió de conceptes a `/connectar`):** Confondre «connexió interpersonal» amb «membresia d'associació» pot generar inconsistències a `town_memberships` o `organizations`. Cal separar la relació humana de la membresia formal.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_0345_acta_marmota_coronacio_botigues_apple_testflight_i_google_play]]

