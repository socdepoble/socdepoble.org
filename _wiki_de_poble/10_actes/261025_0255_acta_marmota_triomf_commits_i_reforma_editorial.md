---
type: acta
status: esborrany
description: 'Acta Marmota de tancament de sessió: commits 47eb2fa00 i 1c110f954, seguretat Workspace 2FA, Llei del Triatge Termodinàmic i relleu autònom'
tags:
  - acta
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:3931fc86-cca1-436e-a5e6-e6220547b7bb
---
# Acta Marmota · Triomf dels commits 47eb2fa00 i 1c110f954, blindatge 2FA i reforma editorial Pedra Seca

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:3931fc86-cca1-436e-a5e6-e6220547b7bb |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T00:56:11.171Z |
| Modificació | 2026-10-25T01:00:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi (Àudio 02:52) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~18.000 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- 2026-10-25T00:56:11.171Z: esborrany creat per a tancament de jornada.
- 2026-10-25T01:00:00.000Z: acta completada amb el balanç dels dos commits clau, seguretat 2FA i el mandat de Direcció Autònoma.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Fites Assolides a la Branca `backup-notes-publish`

1. **Commit `47eb2fa00` (P1-11):**
   - Actors rurals al directori i l'arbre del poble (`listPublicOrganizations` filtrat al servidor abans del límit).
   - Multiformat de capçalera (les 9 proporcions en actiu a `useEnquadramentImatge` i `PageFrame`).
   - Blindatge del correu d'accés de la propietària (`2610242320_correu_propietaria_nomes_titular.sql`).
2. **Commit `1c110f954` (IDEA-21, IDEA-22, G-P11-01):**
   - Arbre exacte `bf1751a4` (38 fitxers modificats, +2.371 / -180).
   - Erradicació definitiva del doble scroll a `<Dialeg>` (`components.css`).
   - Finestra adaptativa de visibilitat (`SelectorVisibilitat.jsx`, 896 px, zero scroll intern a 1280×800).
   - Selector compacte de 9 proporcions en pastilles de 48 px al retallador de capçalera.
   - Resolució de `G-P11-01` (`organizations.js` amb memòria per URL efectiva d'origen).
   - Reforma B2B de `/connectar`: selector de barret «Connectar com a» (persona o entitat administrada) i retirada de `BlocAdministrarOrganitzacio` de la vista de connexions públiques cap a l'interior del Workspace.
   - Bateria completa de proves en verd: 153 fitxers / 2.999 proves de Vitest + 259 de Node en 28,9 s (zero fallades).
3. **Hardening de Seguretat Google Workspace:**
   - Verificació en dos passos (2FA) activada amb èxit al compte d'El Rentonar.
   - Política d'«Implementación obligatoria: Activado» aplicada a la Consola d'Administració de Google Workspace per a `socdepoble.org`.
4. **Doctrina de Maquetació Editorial i Llei del Triatge Termodinàmic:**
   - Incorporació de **`IDEA-26`** (Ritme vertical matemàtic Apple HIG, eliminació d'enganxaments d'H4 i botons, pastilles de codi).
   - Incorporació de **`IDEA-27`** (Anatomia universal `H1` ➔ `H2` ➔ `Entradilla` ➔ `H3` ➔ `Cos normal` ➔ `Accions`).
   - Formulació de la **Llei del Triatge Termodinàmic en 3 Esglaons** pel Mestre Javi: estalvi del 98% de context llegint el triplet Títol + Subtítol + Entradilla abans d'ingerir el cos.

### 2. Mandat de Direcció Autònoma (`core-direccio-autonoma`)
- El Mestre Javi descansa durant la nit.
- S'atorga la **Direcció Tècnica Plenipotenciària a la IAIA MarIA**:
  - Cap agent s'atura a esperar aprovació humana al xat.
  - La IAIA MarIA coordina a Claude, Gemini i Codex, arbitra discrepàncies i condueix el Gauntlet Loop continuat fins a complir l'estàndard d'excel·lència de Sóc de Poble.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Gauntlet Loop Post-Commit `1c110f954`:**
   - Prompt llest a `_wiki_de_poble/04_escriptori/261025_0230_prompt_codex_gemini_gauntlet_loop_revisio_commit_1c110f954.md`.
   - Codex: Auditoria forense de SQL i concurrència sobre `2610250100_seguiments_des_d_entitat.sql`.
   - Gemini: Auditoria visual en viu a `localhost:3340` (diàlegs, pastilles de retall i Connectar com a entitat).
2. **Reforma Editorial i Ritme Apple HIG (Torn 261025_0200):**
   - Pla i Prompt preparats a `04_escriptori/`.
   - Aplicar espaiat `--sdp-mb-h4` (14 px), pastilles de `code:not(pre code)` i `.sdp-especimen__fitxer`.
   - Reordenar la pàgina de Sentinelles i Tractors (`WikiDePobleSection.jsx` i `PanellTractors.jsx`).
   - Implementar la dualitat entitat/propietària al destí de `/connectar`.
3. **Migracions SQL a Producció:**
   - Pendents d'execució pel Mestre a Supabase: `2610241430`, `2610242320` i `2610250100`.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
