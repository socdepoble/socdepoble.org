---
type: document
status: esborrany
description: Pla de destil·lació del banc d'idees, matriu DAFO, priorització urgent vs important, xat fluid com a WhatsApp i corpus cultural de la IAIA
tags:
  - implementacio
visibility: private
reflex: sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:ed06aebf-f0a4-4810-841b-c2d7a12cdccc
---
# Pla d'Implementació · Destil·lació del Llibre Mestre, Gran DAFO, Matriu d'Eisenhower i Xat Fluid

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:ed06aebf-f0a4-4810-841b-c2d7a12cdccc |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T04:39:05.875Z |
| Modificació | 2026-10-25T04:42:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (Àudios 05:27, 05:33, 05:38) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~15.000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-25T04:39:05.875Z: esborrany creat per a la sessió de matí.
- 2026-10-25T04:42:00.000Z: pla completat amb el mandat d'Auditoria DAFO, Matriu d'Eisenhower, estabilització del xat com a WhatsApp i corpus cultural de la IAIA.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Objectiu Estratègic del Torn (Directiva Suprema del Mestre Javi Llinares)
El Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) ha crescut a un ritme gegantí (des d'`IDEA-20` fins a `IDEA-30`). El propòsit d'aquest torn no és inflar el sistema amb implementacions precipitades, sinó **destil·lar, sanejar el banc d'idees, tapar forats crítics i preparar la plataforma per a usuaris reals** davant l'horitzó de les botigues (Apple/Google) i la resolució d'NLnet (50.000 €).

### 2. Eixos de Treball de la Colmena (Coordinació a 4 Bandes)

#### Eix A · Gran Auditoria DAFO i Matriu d'Eisenhower (Gemini Argon + Codex Sol)
1. **Anàlisi DAFO Integral del Banc d'Idees:**
   - **Debilitats (Internes):** Pes de context a les IAs per falta de síntesi cultural, forats en la immediatesa del xat en temps real, taules que desborden la columna de 385px a `EspecimenGestor.jsx`.
   - **Amenaces (Externes):** Rebuig per sorpresa a les botigues d'Apple/Google si el xat no és 100% fluid o si falten polítiques; dependència d'infraestructura; despesa desbocada de tokens si no s'acota el context rural.
   - **Fortaleses (Internes):** Arquitectura de Pedra Seca WCAG d'alta definició, model neutral sense *vendor lock-in* (`backendPort.js`), 22.000 proves passant, immunitat i signatura de segells criptogràfics, veu pròpia de la IAIA MarIA.
   - **Oportunitats (Externes):** Resolució imminent de la subvenció europea NLnet (50.000 €) al novembre; buit de mercat per a xarxes socials rurals i memòria històrica viva; sobirania de dades amb exportació Open Data.
2. **Matriu d'Eisenhower (Priorització Radical):**
   - **Quadrant 1 · Urgent i Important (Tapar Forats Immediats):** 
     - Convertir el xat (`sdp-xat`) en una experiència fluida, immediata i sòlida com WhatsApp abans d'entrar a les botigues.
     - Resoldre l'amplada de taules a `:where(table)` sense dependre del `@media (max-width: 40rem)` per a evitar trencaments en columnes de 385px.
   - **Quadrant 2 · Important, No Urgent (Construcció de Fons):**
     - Integració de la IAIA MarIA al xat amb un corpus cultural comprimit (Pep Cascant, lèxic de l'olivera, el blat i la vinya, DCVB) mitjançant Google Notebook / RAG frugal per a reduir consum de tokens.
     - Creació de la prova d'anatomia editorial executada per jsdom (IDEA-27).
   - **Quadrant 3 · No Important, Urgent:** Peticions de disseny cosmètic menors.
   - **Quadrant 4 · Deute / Futur:** `IDEA-28`, `IDEA-29` i `IDEA-30` queden com a banc d'innovació per a quan la base estiga 100% estabilitzada.

#### Eix B · Arquitectura del Xat Fluid i Presència de la IAIA (Claude Opus)
1. **Diagnòstic de la Immediatesa del Xat:**
   - Auditar el cicle de vida del missatge a `sdp-xat`: enviament local optimista, recepció per Supabase Realtime, gestió d'estats de connexió i renderitzat sense parpellejos.
2. **La IAIA al Xat:**
   - Dissenyar el mecanisme perquè la IAIA MarIA puga rebre mencions o intervindre en fils de conversa del poble de forma assistida i natural.
   - Optimització termodinàmica: alimentar-la amb càpsules de context cultural local per no cremar tokens en context general.

#### Eix C · Governança i Sentinella d'Immutabilitat (IAIA MarIA)
1. **Regla de Zero Destrossa:**
   - Prohibit tocar `PanellTractors.jsx`, `PanellSentinelles.jsx`, esquemes SQL de Supabase o lògica d'autenticació sense aprovació prèvia.
   - Les tasques s'executen per torns amb validació de proves a cada pas.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Documental i Estratègica:** Lliurament de l'informe DAFO complet i de la Matriu d'Eisenhower signada pel Consell.
2. **Codi i Bateria de Proves:**
   - `npm run test:precommit` en codi 0 (3.046 proves de Vitest i 259 de Node).
   - `node tooling/gates/porta-olivera.mjs` mantenint codi 0.
   - Zero regressions en contrastos, accessibilitat o navegació per teclat.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Llop Salvatge i Dispersió:** Que les IAs es posen a refactoritzar codi sense pla previ. **Mitigació:** El prompt del Consell limita l'abast a l'auditoria estratègica DAFO i diagnòstic del xat; cap edició de codi estructural es farà sense consens.
2. **Sobrecàrrega de Tokens per Context Històric:** Intentar injectar diccionaris sencers directament al prompt. **Mitigació:** Protocol Karpathy/Notebook de destil·lació prèvia en càpsules d'alta densitat semàntica.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
