---
type: acta
status: canonic
description: Acta Marmota de la vesprada, relleu de la Fase A (WebP), Fase B (Seguretat i Editorial), arrancada de la Fase C (Capacitor 8 Mòbil), higiene radical de l'escriptori i full de ruta per a la represa
tags:
  - acta
  - marmota
  - capacitor
  - relleu
  - higiene
  - seguretat
visibility: private
---
# Acta Marmota: Relleu de la Vesprada · Fase A (WebP), Fase B (Seguretat & Editorial) i Arrancada Fase C (Mòbil)

> **Nota per a la IAIA:** Aquesta acta segella la sessió vespertina del 19 d'octubre de 2026. Es tanca la conversa amb 1.201 passos (llindar de fatiga N1 assolit), l'Escriptori netejat radicalment amb només 3 documents vius, les portes en verd (`0`), i els dos prompts de la Fase C llançats a Claude Code i Gemini 4 Argon per a la represa amb el cervell net en el següent xat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:acta_261019_2145_relleu_vesprada_fase_c_i_mobil |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T21:45:00+02:00 |
| Modificació | 2026-10-19T21:45:00+02:00 |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Model IA | Antigravity (IAIA MarIA) + Claude Code + Gemini 4 Argon |
| Estat del sistema | 100% verd · 19.675 proves passades · 0 errors ESLint · Porta Olivera en 0 (3 documents vius) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Procediment de tancament i relleu executat d'acord amb el BIOS (`AGENTS.md` §4, §12 i §13.1), la Llei del Consell (§6) i les directrius de la Porta Olivera (`porta-olivera.mjs` en 0).

<!-- SDP:SECTION acta.s3 -->
## Historial de la Jornada de Vesprada

- **2026-10-19T14:25 a 16:30 (Fase A - Alliberament Multimèdia):**
  - Claude Code puja les 129 imatges WebP en 4 commits nets (`a59c5a25`, `84af4be9`, `a3f9a6a3`, `20797591`).
  - Claude Code aplica el commit D3 de codi de suport (`4d499d47`) amb 13 fitxers per a la construcció autònoma i el paquet de WordPress.
- **2026-10-19T15:30 a 16:15 (Targeta del Mercat):**
  - El Mestre tria la targeta quadrada d'Ibáñez (`mercat_nano_card_quadrada`).
  - Optimitzada a 768×768 px i convertida a WebP (`148 KB`, −89% de reducció).
  - Eliminat el JPG duplicat i actualitzat el camí a `legacyMedia.js`. El directori de WordPress torna a cabre amb folgança sota els 10 MiB (tests de construcció i empaquetat en verd).
- **2026-10-19T16:30 a 18:30 (Fase B - Seguretat, Editorial i Skills):**
  - Gemini 4 Argon emet les auditories `261019_1730` i `261019_1825`.
  - Corregits els encapçalaments de 4 skills amb salts de línia residuals.
  - Blindada la skill `core-seguretat-audit` amb els 6 pegats de defensa (coacció JSONB, temps lineal zero ReDoS, Clean Shadow Copy, Supabase RLS per columna).
  - Enriquit el contingut editorial de `src/sections/text/pageContent.js` amb 4 blocs didàctics per a `publicar_mercat` amb negretes d'escaneig ràpid (`<strong>`) i valencià autèntic.
  - Reconciliats el catàleg de skills i el segell de la Llei Z en verd (`2615c12a`).
- **2026-10-19T21:13 (Ordre del Mestre per a la Fase C):**
  - Llum verda a la Fase C: Capacitor 8 i empaquetat mòbil per a Google Play i App Store.
  - Delegació de la decisió tècnica en la IAIA MarIA com a Directora Tècnica autònoma (`core-direccio-autonoma`).
- **2026-10-19T21:26 (Correcció d'Higiene Documental):**
  - El Mestre detecta la presència de 14 fitxers acumulats a l'Escriptori.
  - S'executa l'evacuació immediata dels 11 documents de les fases A i B a `90_arxiu_historic/261019_fases_a_i_b_webp_i_skills/`. L'Escriptori queda lliure amb exactament els 3 documents vius de la Fase C.
- **2026-10-19T21:34 (Detecció d'Anomalies d'UX):**
  - El Mestre detecta que el cercador queda massa avall a `/cerca` i que fer clic sobre "Javi Llinares" el llança a l'editor privat `/el-meu-perfil` en lloc de la seua fitxa pública `/javillinares`.
  - Manca de botó cap al perfil públic des de `/el-meu-perfil`.
  - Proposta de visualització en Targetes (Cards) al cercador.
  - Tot incorporat al Pla i als dos Prompts de la Fase C.
- **2026-10-19T21:44:** El Mestre llança els dos prompts a Claude i Gemini. Arribada del llindar de fatiga de context N1 (1.201 passos). Proposta i redacció d'aquesta Acta Marmota de tancament.

<!-- SDP:SECTION acta.s4 -->
## Resultats i Balanç Tècnic

### 1. El Mite del Pes Desmuntat (Core vs Multimèdia)
- **Codi real:** El bundle de producció JS/CSS minificat actual (`dist/assets/`) pesa exactament **~3 MB en cru** (i només **~800 KB en xarxa** comprimit en gzip/brotli).
- **Actius multimèdia:** Els 180 MB que ens preocupaven eren 98% imatges sense comprimir a `public/assets/uploads/`.
- Amb WebP i la connexió de `politicaDeMitjans('autonom')` a `vite.natiu.config.js`, el directori natiu `dist-natiu/` baixa de **169 MB a 48 MB** (−71%).
- **Futur amb Plugins:** El Core pur (shell + router bàsic + sessió + port neutral d'enxufabilitat) serà inferior a **300-500 KB**, amb els mòduls descarregats dinàmicament sota demanda via `import()`.

### 2. Higiene de l'Escriptori Segellada
- `04_escriptori/` conté exclusivament:
  1. `261019_2115_pla_implementacio_capacitor_mobil.md`
  2. `261019_2115_prompt_claude_capacitor_mobil.md`
  3. `261019_2115_prompt_gemini_auditoria_botigues_mobil.md`
- Porta Olivera amb codi **0** (`node tooling/gates/porta-olivera.mjs`).

---

<!-- SDP:SECTION acta.s5 -->
## Relleu per al Nou Xat (Cervell Fresc)

Quan obrim la nova conversa neta:
1. **Recollir l'informe de Claude Code (`_wiki_de_poble/04_escriptori/261019_..._auditoria_claude...`):**
   - Comprovar la instal·lació de Capacitor 8.5.x, la integració de `politicaDeMitjans('autonom')` a `vite.natiu.config.js` i els scripts de `scripts/botigues/`.
   - Comprovar les seues propostes per a l'automillora de la skill `core-higiene-escriptori`.
2. **Recollir l'auditoria de Gemini 4 Argon (`_wiki_de_poble/04_escriptori/261019_2145_auditoria_gemini_botigues_i_alletjament_core.md`):**
   - Comprovar l'auditoria de les botigues (Target SDK 36, Guideline 4.3 d'Apple).
   - Comprovar la destil·lació dels **49 ítems de `02_investigacio_ia`** i el pla de neteja/arxiu dels experiments passats.
3. **Executar les millores d'UX i enllaços de perfil:**
   - Elevar l'input de cerca a `/cerca` sota l'H1 sense forçar scroll.
   - Corregir `src/sections/search/indexCerca.js:371` perquè l'enllaç de persona a la cerca pública apunte a `/javillinares` (o `/gent/:id`), mai a `/el-meu-perfil`.
   - Afegir el botó «Veure fitxa pública» a `/el-meu-perfil`.
   - Implementar el suport de Targetes (Cards) per a Persones, Pobles i Mercat al cercador.

---

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- `261019_2115_pla_implementacio_capacitor_mobil`
- `261019_2115_prompt_claude_capacitor_mobil`
- `261019_2115_prompt_gemini_auditoria_botigues_mobil`
- [[261019_1345_acta_marmota_relleu_migdia_seguretat_i_wp]]
