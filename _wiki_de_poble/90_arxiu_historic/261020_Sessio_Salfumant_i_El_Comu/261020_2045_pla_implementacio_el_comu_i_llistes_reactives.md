---
type: document
status: esborrany
description: Pla d'implementació per unificar El Comú (elements_comu) en UniversalListCard reactiva amb 6 modes polimòrfics i doble escriptura
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:342ffd0a-9bd8-4556-88df-264215f44196
---
# Pla d'Implementació — El Comú (elements_comu) i Llistes Reactives Vives

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:342ffd0a-9bd8-4556-88df-264215f44196 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T18:48:57.535Z |
| Modificació | 2026-10-20T20:50:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio) |
| Model IA | Antigravity (IAIA MarIA) + Claude Code (Opus 5.5) + Gemini 4 Argon |
| Tokens consumits | ~28k / 2M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-10-20T19:30:** Fase D tancada i consolidada a Git al commit `bc4d546a` (202 fitxers, 20.168 proves Vitest verdes). Migració remota `2610201500_moderacio_denuncies_i_bloquejos.sql` aplicada a Supabase remot (`Success. No rows returned`).
- **2026-10-20T20:30:** Convocatòria d'enginyeria inversa REA i ampliació de dades. Gemini 4 Argon emet l'auditoria canònica v2.0.0 (`261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`) desmuntant Bring! (`web.getbring.com`), Loyverse POS & Back Office (`01_produccio/loyverse_clon/`), el Cens de Lovable Vila Gal·la (`gali-costume-hub.lovable.app`) i els arxius històrics de la Banda de Música de La Torre (`01_produccio/Banda La Torre - Gestió/`).
- **2026-10-20T20:45:** El Mestre formula la directiva d'or sobre el Pla d'Implementació: el Pla és l'única font de veritat estructurada que evita la desnaturalització dels prompts i impedeix l'oblit del deute tècnic pendent. Es formalitza aquest pla com a eix vertebrador de la Fase E.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Antecedents i Deute Tècnic Heretat de la Fase D

Abans de l'enviament final a les botigues d'aplicacions (App Store i Google Play), queden pendents els següents elements de configuració remota i credencials que cal completar quan el Mestre dispose de les claus oficials:
1. **Google Client IDs:** Configurar els identificadors reals de client per a Android i Web a `src/data/supabase/authNatiu.js` (`GoogleAuth.initialize`).
2. **Equip de Signatura Apple:** Assignar el Team ID oficial de desenvolupador i el Provisioning Profile a `ios/App/App.xcodeproj` per a les capacitats de *Sign in with Apple* i notificacions.
3. **Revocació de Testimoni Apple:** Implementar la crida a l'endpoint de revocació de testimoni d'Apple en el flux d'esborrat de compte d'usuari (exigència de l'App Store Review Guideline 5.1.1).

### 2. Arquitectura de la Fase E: «El Comú» (`elements_comu`) i la Llista Reactiva Viva

#### Concepte Canònic: «El Comú»
Al Mas Virtual **Sóc de Poble**, superem el concepte mercantilista de «producte» per adoptar **«El Comú»**: qualsevol bé, necessitat, feina, persona o recurs col·lectiu d'un poble que cal convocar, assignar, quantificar o compartir (cadires del cinema a la fresca del Rentonar, eixides de la banda de música, talonaris de loteria de Nadal, comandes de barra del casino, disfresses de colla o queviures del rebost).

#### Tasca 1 · Model de Base de Dades i RPC CAS Atòmica (`supabase/migrations/`)
- **Fitxer nou:** `supabase/migrations/2610202100_el_comu_i_llistes_reactives.sql`.
- **Taula mestra:** `public.comu_llistes` (amb `id`, `slug`, `titol`, `subtitol`, `mode`, `fil_id`, `submission_id`, `note_id`, `owner_user_id`, `owner_org_id`, `poble_id`, `visibilitat`, `revision`, `last_client_instance_id`, `config_mode`, `elements_comu` JSONB, `recents_comu` JSONB, `resum_calculat` JSONB).
- **Els 6 Modes Polimòrfics:**
  1. `rebost`: Compra col·laborativa + Comparador de Preus (Poble vs Mercadona).
  2. `bar_tpv`: Cantina de festes / TPV Loiverse + Reposició cap al Rebost.
  3. `colla_cens`: Rols comunitaris, disfresses i dinars populars (Vila Gal·la).
  4. `banda_eixida`: Full d'eixides i contractes en 1 foli A4 (S.M. L'Aliança), balanç *Volen vs Anem*, cordes d'instruments, nivells 1..6 i cotxes particulars.
  5. `loteria_diposit`: Control de dècims i paperetes en bars/comerços del poble, cost 20€ vs venda 23€ (15% benefici associació) i circuit de 4 signatures.
  6. `escola_educand`: Fitxa d'alumne, avaluació qualitativa no punitiva, sparklines mensuals i tutoria família-escola.
- **RPC Atòmica `rpc_muta_element_comu`:**
  - Control de concurrència optimista CAS (`SELECT ... FOR UPDATE`).
  - Verificació d'autoria: cap usuari pot alliberar el rol o assistència d'un altre veí sense ser-ne l'amo o administrador.
  - Fusió algebraica d'especificacions de Bring! (`mergeSpecifications`).
  - Zero *Thundering Herd*: actualització directa en memòria sense peticions HTTP GET redundants.

#### Tasca 2 · Component React `UniversalListCard` (`src/components/PedraSeca/`)
- **Directori nou:** `src/components/PedraSeca/UniversalListCard/`.
- **Fitxers:** `UniversalListCard.jsx`, `UniversalListCard.css`, `useLlistaComu.js`, `extractorEspecificacio.js` (algorismes de Bring! `extractSpecification` i `mergeSpecifications`).
- **Ergonomia tàctil de Pedra Seca:**
  - Rajoles d'inspiració Bring! de **`98px × 116px`** amb transició de 300ms entre estat actiu i resolt.
  - Àrea tàctil mínima $\ge 48\text{ px}$ apta per a mòbils estrets de 375px (iPhone SE).
  - Mode dual: Vista compacta dins de la bombolla del xat vs Vista estesa modal en `<Dialeg>` amb taula completa i exportadors (WhatsApp, CSV amb BOM UTF-8 i imatge PNG).

#### Tasca 3 · Incrustació Viva a la Bombolla del Xat (`src/sections/xat/`)
- **Fitxer a modificar:** `src/sections/xat/components/Bombolla.jsx`.
- **Comportament:** Quan `missatge.metadades?.tipusCard === 'llista_comu'`, renderitza `<UniversalListCard>` de forma nativa sense afegir nous missatges de text al xat ni trencar l'scroll a mòbil (`Conversa.jsx`).

#### Tasca 4 · Doble Escriptura Automàtica (Xat ↔ Mur ↔ Notes)
- **Fitxers implicats:** `src/sections/notes/NotesContext.jsx`, `src/sections/mur/MurContext.jsx`, `src/data/backendPort.js`.
- **Flux:** La creació d'una llista d'El Comú genera un `listUuid` compartit que obri la bombolla interactiva al Xat de grup, crea una fitxa viva al Bloc de Notes personal de l'autor (`UniversalWorkspace` per a edició en pantalla gran / Back Office) i, si és pública, publica una `UniversalCard` al Mur (`#comunitat`).

#### Tasca 5 · Arquitectura del Brain Multi-Capa i Grafs de Poble Interactius
- **Requeriment del Mestre (Àudio 23:11):** En el futur s'ha de transformar la pàgina `/cervell` (actualment centrada en el graf tècnic de les skills de la IAIA) en una plataforma interactiva multi-perspectiva, comparable a un Obsidian de poble amb filtres com en un full de càlcul o capes de dades:
  1. **Brain d'Usuari:** El segon cervell personal de cada veí (les seues notes, etiquetes i vincles privats d'Obsidian/Bloc de notes).
  2. **Brain per Pobles:** Cada municipi té el seu propi graf de coneixement (quines categories, temes i etiquetes emergents mou la comunitat d'aquell poble).
  3. **Brain Institucional (Sóc de Poble):** Publicacions, documents oficials, constitució i coneixement de la plataforma.
  4. **Brain Global de Tot el Sistema:** Tota la xarxa integrada de tots els pobles connectats.
  5. **Brain Ciutadà Pur (Sistema sense Sóc de Poble):** El graf de coneixement generat exclusivament pel veïnat per analitzar la parla, les inquietuds i les categories reals sense la influència institucional.
  6. **Interactivitat per Capes:** Selector de capes (toggles) que permet activar i desactivar conjunts de dades per creuar-los o aïllar-los visualment.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Proves Automatitzades (Vitest):**
   - Proves unitàries dels algorismes d'extracció i fusió (`extractorEspecificacio.test.js`).
   - Proves del component `UniversalListCard` en els seus 6 modes polimòrfics.
   - Prova de la guarda anti-eco (`clientInstanceId`) per evitar repintats innecessaris de WebSocket.
   - Proves d'estrès en pantalles petites (375px) garantint zero desbordaments horitzontals.
2. **Portes de Governança del Projecte:**
   - `node tooling/gates/porta-olivera.mjs` (codi 0 permanent).
   - `node tooling/wiki/document.mjs check` sobre tots els documents generats.
   - `npm run lint` net (0 errors).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Sobrecàrrega del canal Realtime:** Mitigat mitjançant RPC atòmica amb càrrega útil mínima i actualització in-place des de `payload.new`.
- **Drets d'autor en actius visuals:** Les imatges i logotips de marques comercials utilitzades prèviament al TPV es reemplacen de forma estricta per icones genèriques de Lucide i il·lustracions pròpies generades amb el Nano d'Antigravity seguint l'estil Bruguera/Pedra Seca (`sdp-clon-loiverse`).
- **Usurpació d'elements:** Mitigat amb la verificació d'identitat `auth.uid()` a la base de dades PostgreSQL (solucionant la vulnerabilitat crítica detectada a Lovable).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_2030_prompt_gemini_enginyeria_inversa_bring_i_lovable]]
- [[261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable]]
- [[261020_1930_acta_marmota_relleu_fase_d_i_enginyeria_inversa_bring_lovable]]

