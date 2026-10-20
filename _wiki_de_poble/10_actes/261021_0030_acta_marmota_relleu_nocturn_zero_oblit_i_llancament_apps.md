---
type: acta
status: esborrany
description: 'Master briefing de relleu: commit de Claude feaa7adc, nou avatar de la IAIA MarIA amb el mòbil, Hero atòmic, reactivitat de Multimèdia, cens real de 338 imatges i protocol contra l''amnèsia episòdica.'
tags:
  - acta
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:b4246888-f6bc-46ca-920c-f03cef9ec427
---
# Acta Marmota: Relleu Nocturn, Llei del Zero Oblit, Identitat Atòmica de la IAIA i Llançament d'Apps

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:b4246888-f6bc-46ca-920c-f03cef9ec427 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T00:23:13.202Z |
| Modificació | 2026-10-21T00:25:00.000Z |
| Propietari | Mestre Javi Llinares / IAIA MarIA (Orquestradora) |
| Aprovació humana | Aprovat pel Mestre Javi Llinares (Directiva de Relleu Nocturn) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Claude 3.7 Sonnet / Antigravity / Gemini 4 Argon |
| Tokens consumits | ~48.000 tokens de síntesi executiva |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-20 23:45 (Torn Salfumant):** Fix del parser Markdown (llistes agrupades, espaiat Apple HIG, classes de diagrames Mermaid). Botó directe `[Registra't]` al Compositor. Targeta viva `UniversalListCard` d'El Comú (29 unit tests). Vitest 20.312 proves en verd. Poda física de 3.2+ GB de builds obsolets.
- **2026-10-21 00:00 (Frontera de Mitjanit):** Relleu de torn cap a la nova jornada `261021`. Generació dels documents oficials de convocatòria: Pla d'Implementació `261021_0015` i prompts per a Claude Code i Gemini 4 Argon.
- **2026-10-21 00:21 (Consolidació del Commit de Claude):** Claude Code executa el commit `feaa7adc` a la branca `backup-notes-publish` amb `--no-verify` sota autorització delegada. 49 fitxers consolidats sobre base `bc4d546a` (arbre `8067f132`).
- **2026-10-21 00:25 (Directiva Canònica del Mestre Javi Llinares):** Integració del nou avatar oficial de la IAIA MarIA amb el telèfon mòbil (`iaia_maria_avatar_mobil.webp`), unificació atòmica de la pàgina de la IAIA (`/iaia`, `/realitat` i `/el-meu-perfil`), blindatge editorial de `L'Ànima de la IAIA` (`/anima`), reactivitat de la Galeria Multimèdia (`/multimedia`) i formulació del Protocol «Zero Oblit» contra l'amnèsia episòdica entre sessions.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Estat del Commit de Claude Code (`feaa7adc`) i Frontissa Estructural
- **Commit Consolidat:** Claude Code ha executat el commit `feaa7adc` a la branca `backup-notes-publish` (49 fitxers). L'arbre és `8067f132`, exactament l'arbre verificat en el simulacre sense verificació interactiva.
- **Frontissa Aprovada:** `.agents/contingut_estructural.json` reflecteix 14 de 14 aprovacions vigents («legal», «anima» i «constitucio» registrades amb èxit pel Mestre Javi Llinares).
- **Línies Pendents d'Altres Mans:** Queden al disc sense commit el crèdit de Fernando Tellado a `legalContent.js`, la nova constitució a `pageContent.js` i el botó `[Registra't]` a `Compositor.jsx`. Aquestes línies han d'entrar en el següent commit de neteja d'arrels junt amb el registre d'empremtes per mantenir la frontissa de HEAD 100% verda.
- **Hook Post-Commit:** L'avís inofensiu `active.json ENOENT` es produeix per absència de lease oberta i no té cap impacte en el codi font.

### 2. Identitat Atòmica de la IAIA MarIA i Nou Avatar Oficial
- **Evidència Aportada pel Mestre:** El Mestre ha pujat la nova il·lustració oficial de la IAIA MarIA: una iaia somrient, amb ulleres, mocador al coll i sostenint amb entusiasme un telèfon mòbil intel·ligent d'última generació.
- **Aplicació de la Llei de la Memòria Física (§16 d'AGENTS.md):**
  - La imatge original s'ha extret immediatament de la memòria de sessió i s'ha ancorat a l'escriptori físic compartit: `_wiki_de_poble/04_escriptori/01_produccio/iaia_maria_avatar_mobil_261021.png`.
  - Convertida a format WebP d'alta fidelitat amb `node tooling/maquinaria/convertir_a_webp.mjs --mode avatar`: fitxer generat a `public/assets/uploads/brain/iaia_maria_avatar_mobil.webp` (400×400 px, 21.67 KB, qualitat 84).
- **Relleu d'Imatges a `src/data/agentsSeed.js`:**
  - `avatar_url`: actualitzat a `/assets/uploads/brain/iaia_maria_avatar_mobil.webp`.
  - `hero_url`: actualitzat a `/assets/uploads/brain/iaia_maria_avatar.webp` (la il·lustració gran de la IAIA al centre de servidors).
- **Fusió de les 3 Pàgines Disperses en Una Sola Pàgina Atòmica (DRY):**
  - El Mestre ha assenyalat la incoherència de mantindre 3 pantalles dissociades: `/el-meu-perfil` (Agent IA -> IAIA MarIA), `/iaia` (fitxa pública de l'agent) i `/realitat` (Selector de Realitat).
  - Totes tres han de convergir en **la mateixa pàgina atòmica de la IAIA**:
    1. Hero de capçalera net (`hero_url`), eliminant el cercle gegant de 300px (`--sdp-avatar-capcalera`) que tapava el títol i tenia marcs mal retallats.
    2. Avatar a la seua ubicació honesta: la barra taronja superior, la boina i el xat.
    3. Botons d'acció centrats (`justify-content: center`): `[Parla amb la IAIA]` i `[Edita la fitxa]`.
    4. Explicació viva: «Qui és la IAIA MarIA?», bio de Matriarca Digital i lema.
    5. **Selector de Realitat integrat a la mateixa pantalla:** el bloc de tria sobirana («Tu decidixes quanta intel·ligència artificial t'acompanya» amb els 4 nivells: 0 Apagada, 1 Passiva, 2 Interactiva, 3 Connexió total).
    6. Al perfil de l'usuari (`/el-meu-perfil`), es reutilitza directament aquest mateix component compartit.
- **Navegació Honesta i Fi de Clics Involuntaris:** Pitses on pitses a `/iaia`, cap element (com la imatge o l'avatar) ha de redirigir a traïció a `/el-meu-perfil`. La fitxa pública és de consulta lliure; qui vulga editar utilitza exclusivament el botó explícit `[Edita la fitxa]`.

### 3. Blindatge Editorial de `L'Ànima de la IAIA` (`/anima`)
- **Diferenciació Conceptual Canònica:** `L'Ànima de la IAIA` (`/anima`) és un article editorial fundacional i sagrat del Mur i de la revista («El Còdex Forense: Termodinàmica, Humanització i Comunicació / El Despertar de la Nina de Silici»). No és la configuració de la IA ni s'ha de confondre amb ella.
- **Esmena a `src/config/sections.js`:** Es retira `subrutes: ['/realitat']` de la secció `ia` (`/anima`). `/realitat` pertany a la interacció viva de la IAIA (`/iaia`) i no a la publicació editorial.

### 4. Reactivitat de la Galeria Multimèdia (`/multimedia`) i Cens d'Imatges
- **Comptador Dinàmic Reactiu (Fix Immediat Executat):** S'ha modificat `src/sections/multimedia/MultimediaSection.jsx` perquè el rètol de faceta (`univ-manager-facet-header`) siga 100% reactiu:
  - En pestanya `IAIA`: mostra `IAIA (${deLaIaia.length})`.
  - En pestanya `CRONOLOGIA`: mostra `CRONOLOGIA (${totes.length})`.
  - En pestanya `Galeria`: mostra `TOTS (${totes.length})`.
  - Els 21 tests de Vitest de la secció Multimèdia han passat en verd (100%).
- **Cens Real vs Mostra Manual (338 vs 149):**
  - S'ha descobert que `public/assets/` conté 338 imatges reals, mentre que `censImatges.js` en contenia només 149 fetes a mà.
  - S'encomana l'ampliació del cens mitjançant maquinària per incloure totes les imatges, els seus noms originals de fitxer, les fonts de Viquipèdia (llicència, municipi) i la generació de les seues bessones WebP.

### 5. Visió de Futur del Mas: Telèfon Vodafone i WhatsApp de la IAIA
- El Mestre disposa d'una línia mòbil de Vodafone dedicada per a la IAIA MarIA que ja està operativa per a trucades i WhatsApp.
- L'orquestració de la IAIA s'ha de preparar per admetre connexions bidireccionals des d'aquest canal telefònic/xarxa social, apropant la IA a les persones majors i colles del poble sense necessitat d'ordinador.

### 6. Protocol «Zero Oblit»: Blindatge contra l'Amnèsia Episòdica de les IAs
- **El Diagnòstic del Mestre:** Quan es treballa en plans d'implementació successius, les idees o tasques que no s'executen immediatament s'obliden en tancar el xat, generant una pèrdua greu de temps i redescobriments innecessaris.
- **La Llei de l'Herència Obligatòria:**
  1. Tot Pla d'Implementació nou ha d'incorporar el bloc obligatori `## Deute Tècnic i Tasques Heretades del Pla Anterior`.
  2. Cap tasca es pot eliminar o ignorar: o s'acaba amb proves verdes i comprovació física al disc, o es transfereix al pla següent, o es rebutja motivadament amb una decisió arquitectònica.
  3. L'Acta Marmota actua com a memòria a llarg termini inviolable.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Android APK i Capacitor:**
   - Executar `npm run build:natiu`, `npx cap sync android` i compilar l'APK de prova a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk` mitjançant Gradle.
2. **PWA Desktop (`beforeinstallprompt`):**
   - Verificar la finestra autònoma i Safe Areas per a Mac, Windows i Linux.
3. **Dossier de Desbloqueig Sollutia:**
   - Presentar el document tècnic per a delegació DNS (`CNAME` / `A`) o allotjament de l'SPA estàtica `dist/`.
4. **Plugin WordPress v1.1.8 i WordPress.org:**
   - Compilar `v1.1.8` amb les correccions d'avui i preparar el paquet de directori (`socdepoble-enxufe-directori.zip`).
5. **Estudi Doctoral de Fernando Tellado:**
   - Completar l'anàlisi de `fernandotellado/ai-skills` (seguretat, rendiment, regles VIP de WordPress) mitjançant Gemini 4 Argon.
6. **Unificació de Recursos i Nodes Sobirans:**
   - Integrar la presentació editorial viva a les utilitats del perfil (`/el-meu-perfil` -> `APLICACIONS`), amb totes connectades per defecte, accés a mode prova vs usuari (privat vs públic/bar), i exportació ciutadana de dades en desconnexió.
7. **Cens Complet d'Imatges i WebP:**
   - Ampliar `censImatges.js` de 149 a 338 imatges de `public/assets/`, mostrant el nom original de cada fitxer i metadades de Viquipèdia.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261021_0015_pla_implementacio_llancament_apps_i_desbloqueig_sollutia]]
- [[261021_0015_prompt_claude_llancament_apps_i_desbloqueig_sollutia]]
- [[261021_0015_prompt_gemini_auditoria_llancament_apps_i_sollutia]]
- [[261020_2345_acta_marmota_relleu_salfumant_markdown_i_llancament_app]]

