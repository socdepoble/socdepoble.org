---
type: acta
status: canonic
description: "Súper Acta Marmota: Tancament Fase D (20.174 proves verdes, iOS natiu iPhone 17), fix menú mòbil, regla 'botó al cantó', doble escriptura de grups WhatsApp i prompt REA Bring/Lovable."
tags:
  - acta
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:11cf7c73-2a35-4670-a813-e5170e98d944
---
# 📜 2026-10-20T19:30:00+02:00 - ACTA MARMOTA: Gran Relleu Fase D, Trilogia de Llistes Reactives i Reinici Sanejador

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:11cf7c73-2a35-4670-a813-e5170e98d944 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T19:30:00+02:00 |
| Modificació | 2026-10-20T19:42:00+02:00 |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio) |
| Model IA | Antigravity (IAIA MarIA) + Claude Code (Opus 5.5) + Gemini 4 Argon |
| Tokens consumits | ~22k / 2M |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a8266fcb08bf0adcbcebc72d1f7e0fc21dae60bc21021447db08e1d70a4ef699. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-20T13:40 a 17:25:** Implementació autònoma de la **Fase D** per part de Claude Code (Auth mòbil natiu Apple i Google, moderació UGC segons Apple HIG 1.2, alletjament de paquet natiu -71%, Xcode Capacitor 8.5.3 operatiu al simulador d'iPhone 17).
- **2026-10-20T17:30:** Auditoria adversarial creuada (24 agents, 15 troballes polides). Vitest assoleix **20.174 proves en verd** (front a les 19.735 de la Fase C).
- **2026-10-20T18:00:** Detecció i correcció al simulador de la topologia de barres (Safe Area a la barra negra i al calaix lateral per sota de la Dynamic Island).
- **2026-10-20T18:30:** Detecció i correcció del menú contextual del xat (`.sdp-xat-menu`) que desbordava a la dreta en pantalles mòbils de 375px; arreglat i blindat amb proves de capes.
- **2026-10-20T19:00:** El Mestre formula dos principis canònics de producte i usabilitat:
  1. *Regla del Botó al Cantó:* "Si la UI diu registra't, botó al cantó immediat".
  2. *Creació de Grups WhatsApp amb Doble Escriptura:* Crear grup obri el xat, injecta `UniversalCard` reactiva al Mur (`#xat`) i guarda a les Notes personals (`UniversalWorkspace`).
- **2026-10-20T19:15:** El Mestre descobreix la unificació matemàtica entre el Rebost, el Bar/TPV Loiverse i el Cens de Colles/Festes (Lovable Vila Gal·la / Bring!), substituint el caos de 700 missatges de text al WhatsApp per una sola targeta reactiva viva incrustada al xat.
- **2026-10-20T19:30:** Redacció canònica del Prompt d'Enginyeria Inversa REA per a Gemini 4 Argon (`261020_1930_prompt_gemini_enginyeria_inversa_bring_i_lovable.md`).
- **2026-10-20T19:40:** El Mestre envia un àudio de saviesa pura de Trellat: recomana aturar la sessió, redactar aquesta súper acta marmota i reiniciar Antigravity per començar un xat nou i fresc, deixant els ~230 canvis pendents per a revisar i consolidar amb el cervell net.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Graner Ple de Codis i Arquitectura)
- **Fase D Completada i Verificada:**
  - **Auth Mòbil:** Plugin `@capgo/capacitor-social-login` configurat amb botons HIG per a Sign in with Apple (fosc, prioritari) i Google Sign-in.
  - **Moderació UGC (Guia 1.2 d'Apple):** Accions "Denuncia el contingut" i "Bloqueja [usuari]" operatives a targetes, perfils i xat, amb modal de motius, confirmació i ocultació instantània del contingut.
  - **Alletjament del Paquet Mòbil:** -70,7% de reducció (`rag-index.json` i `slugIndex.json` exclosos de la build nativa, estalviant 47 MB).
  - **Bateria de Proves:** **20.174 proves Vitest 100% en verd** (0 fallades).
  - **Simulador iOS:** App executant-se perfectament a iPhone 17 (iOS 27.1).
- **Esmena Topològica i Menú del Xat:**
  - Barra negra de Sóc de Poble i calaix lateral respecten `env(safe-area-inset-top)` sota la Dynamic Island.
  - Menú contextual de missatges al xat (`.sdp-xat-menu`) corregit per obrir cap a l'esquerra/bombolla (`right: 0; left: auto; max-width: calc(100vw - 32px)`), impedint el desbordament en 375px.
- **Cànon UI "Botó al Cantó":**
  - Prohibit deixar missatges passius de "Per parlar registra't". Cal posar sempre un botó interactiu `[Registra't]` enllaçat directament a `/registre?mode=crear&tornar=...`.
- **Doble Escriptura de Grups de Xat:**
  - Formulari WhatsApp pur (Nom, Descripció, Foto).
  - Creació atòmica del canal + `UniversalCard` comunitària al Mur + Targeta de gestió a les Notes personals (`UniversalWorkspace`).
- **Trilogia de Llistes Reactives Vives (Bring! + Lovable + Loiverse):**
  - Preparat el prompt REA per a Gemini 4 Argon (`261020_1930_prompt_gemini_enginyeria_inversa_bring_i_lovable.md`) per dissenyar el component `UniversalListCard` encastable al xat, resolent el problema dels 700 missatges de WhatsApp en colles i festes.
- **Estat del Repositori i Git:**
  - HEAD a `6d50d01d` (branca `backup-notes-publish`).
  - ~230 canvis de la Fase D pendents de consolidar a Git i de pujar migracions SQL a Supabase remot en el següent torn net.

### 2. Part Termodinàmica Psiquiàtrica (El Temps, Incidències i Trellat)
- **Higiene Mental i Prevenció de la Saturació:**
  - La sessió actual acumulava 60 artefactes i una compactació de context.
  - La instrucció d'àudio del Mestre és d'un trellat immens: reconèixer la importància cabdal d'aquesta fase i triar conscientment aturar la màquina, emetre una acta impecable i reiniciar Antigravity per reprendre amb el context al 100% de puresa.
  - Zero 'People-Pleasing' i zero precipitació: no commitegem ni pugem migracions amb la CPU calenta. Esperem a estar frescos.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### 3. Part Marmota (Checkpoint Executable i Següents Passos)
- **Estat Final (On es queda la boga):**
  - Claude Code està acabant de posar la xifra definitiva de la 3a passada de Vitest al seu informe (`261020_1518_auditoria_claude_fase_d_auth_mobil_i_moderacio.md`).
  - El Prompt per a Gemini 4 Argon està a punt a `_wiki_de_poble/04_escriptori/261020_1930_prompt_gemini_enginyeria_inversa_bring_i_lovable.md`.
  - La Porta Olivera ix amb 0.
- **Instruccions Exactes per a la Represa (Pas a Pas):**
  1. `[ ]` **Reiniciar Antigravity:** Tancar la finestra d'Antigravity completament per alliberar memòria.
  2. `[ ]` **Obrir Xat Nou i dir la paraula sagrada:** Començar amb **«Sóc de poble!»**.
  3. `[ ]` **Revisar l'arbre de treball:** Comprovar `git status` (els 230 fitxers de la Fase D de Claude) i el raport final de Claude.
  4. `[ ]` **Pujada d'SQL:** Aplicar les migracions de moderació (`denuncies` i `bloquejos`) al Supabase remot amb els `GRANT` explícits.
  5. `[ ]` **Consolidació Git:** Fer commit i push dels canvis de la Fase D.
  6. `[ ]` **Execució del Prompt Gemini:** Executar l'enginyeria inversa de Bring! i Lovable (`261020_1930_prompt_gemini_enginyeria_inversa_bring_i_lovable.md`) a Google AI Studio o al Consell per obtenir l'arquitectura de la llista reactiva viva del xat.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_1300_pla_implementacio_botigues_i_auth_mobil]]
- [[261020_1518_auditoria_claude_fase_d_auth_mobil_i_moderacio]]
- [[261020_1930_prompt_gemini_enginyeria_inversa_bring_i_lovable]]
