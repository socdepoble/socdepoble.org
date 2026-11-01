---
type: acta
status: canonic
description: Acta Marmota del tancament de la marató nocturna (commits 37f93e55a, a213947c5, 1bb292cb2) i preparació del Pla i Prompt 261101_1246 per a l'Assalt al 10/10 en les 15 Dimensions abans del reinici del Mac
tags:
  - acta
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:6f5d1992-fbe6-4d66-9939-84cab93081e2
---
# ACTA MARMOTA: TANCAMENT DE LA MARATÓ NOCTURNA (27.243 TESTS) I PREPARACIÓ DE L'ASSALT AL 10/10 DE LES 15 DIMENSIONS

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:6f5d1992-fbe6-4d66-9939-84cab93081e2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T12:04:49.973Z |
| Modificació | 2026-11-01T12:05:30.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-11-01 13:04 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) — Antigravity |
| Tokens consumits | ~210.000 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- 2026-11-01T12:04:49.973Z: esborrany creat per `document.mjs create`.
- 2026-11-01T12:05:30.000Z: completada l'Acta Marmota de tancament de la Marató Nocturna (`261101_0311`, commits `37f93e55a`, `a213947c5` i `1bb292cb2`) i deixada llesta l'onada `261101_1246` (Assalt al `10/10` en les 15 Dimensions Universals `D01`–`D15`) per arrancar amb el Mac i els 4 xats al `0%` de context.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Tancament de la Marató Nocturna `261101_0311` i Segellat en Git)
- **Commits segellats a `backup-notes-publish` (sense push):**
  1. `37f93e55a` (`feat`): 163 fitxers de codi i lliurables de la Marató Nocturna (`T1`–`T8` del prompt `261101_0311`), verificats amb **`27.243` tests de Vitest passats (`0 fallades`)** i **`1.789` tests de Node (`0 fallades`)**:
     - Enllaç oficial `https://wordpress.org/plugins/socdepoble/` (`v1.1.10`) actiu a `src/config/canalsDeBotiga.js`, `/page/descarregues` i `/page/fediversity`.
     - `/page/fediversity` amb llista «Fet hui (2026-11-01)» i enllaços verificables d'1 clic.
     - Exportador Open Data BagIt 1.1.0 amb `agenda.ics`, fitxa de memòria oral OKF v0.2 (`FitxaMemoriaOral.jsx`) amb validació estricta (`validaFitxaOkfV02`), alertes municipals al Mur (`AlertaMunicipal.jsx`), prova d'extrem a extrem de `inicia-node-germa.mjs` i guia `_wiki_de_poble/02_saber/protocols_tecnics/perfil_minim_allotjament_node_municipal.md`.
     - Reforma completa de `/notes` (`IDEA-59` / `P1-72`): Card explicativa de la mà amb la ploma seleccionada d'entrada a `Tot`, cartell guia reversiu quan hi ha `0` caràcters, selector `H3 → H4 → H5 → H6 → H2`, supressió del subratllat, icones pròpies a 20 px i segona fila desplegable amb tancament per `Escape`.
     - Barra de volums locals a la Columna 1 de `/multimedia` (`P1-71`), avatar lleuger `javi-llinares-256x256.jpg` (16 KB) al xat (`P1-70`) i correcció del `readme.txt` del connector WordPress.
     - Preparació nativa de botigues (`T6`): `ios/App/App/PrivacyInfo.xcprivacy`, `appAssociation: "NONE"` a `capacitor.config.ts`, `tooling/botigues/genera-associacions-dominis.mjs` sense SHA-256 inventats i `_wiki_de_poble/03_actuar/procediments/guia_publicacio_app_store_i_google_play.md`.
     - Integració auditada per Claude dels kits nocturns de Gemini (`../_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/`, 3 pegats aplicats reduint `design_guard` de 12 a 9 avisos) i de GPT Codex (`../_investigacio_ia_de_poble/261101_kits_marato_nocturna/codex/`, 20 proves noves + 8 autoproves).
  2. `a213947c5` (`docs(produccio)`): 21 captures de producció ancorades a `00_index_escriptori.md`.
  3. `1bb292cb2` (`docs(torn)`): Els 3 informes d'auditoria de la nit (`261101_0409_auditoria_claude.md`, `261101_0403_auditoria_codex_marato_nocturna.md` i `261101_0407_auditoria_gemini_marato_nocturna.md`) i documents del torn nocturn.

### 2. Preparació Completa de la Nova Onada `261101_1246` (Assalt al `10/10` en les 15 Dimensions Universals `D01`–`D15`)
- El Mestre Javi Llinares ha decidit **posposar l'enviament del correu a NLnet Fediversity (`2026-08-1a6`)** per executar primer l'**Assalt al `10/10` en les 15 Dimensions (`D01`–`D15`)** i tancar tot el que Claude Opus 5.5 (`4.5–8.5/10`) i GPT Codex (`4.5–8.0/10`) van identificar com a incomplet:
  - Pla d'Implementació ja creat i validat al disc: `_wiki_de_poble/04_escriptori/261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`.
  - Prompt Local ja creat i validat al disc (`porta-plantilla-viva.mjs --complet` verd): `_wiki_de_poble/04_escriptori/261101_1246_prompt_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`.
  - Secció `0.3 Prioritat 1 Activa` de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` ja actualitzada amb les tasques `T1`–`T10`.

### 3. Part Termodinàmica i Decisions de Trellat
- **Incidència de popups a la matinada (`04:53 CET`) resolta de soca-rel:** Es va detectar que Gemini disparava el popup de `guarda-reflex` en usar heredocs (`python3 - <<'PY'`) i que un subagent en segon pla havia invocat `xcodebuild -version`. En el nou prompt `261101_1246` s'ha blindat la **Regla d'Or Anti-Popups** prohibint a Gemini l'ús d'heredocs/redireccions bash i d'`xcodebuild`, exigint l'ús exclusiu de `write_file` i `edit_file`.
- **Reinici de Mac i Xats Nous al `0%`:** Excel·lent decisió del Mestre per alliberar tota la RAM del Mac i obrir els 4 contextos (MarIA, Claude Opus 5.5, GPT Codex i Gemini) nets al `0%` amb el Pla i Prompt `261101_1246` ja preparats al disc.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Checkpoint Executable Immediat en Tornar del Reinici del Mac:
1. `[x]` **El Pla i el Prompt `261101_1246` JA ESTAN CREATS I VALIDATS AL DISC:**
   - `_wiki_de_poble/04_escriptori/261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`
   - `_wiki_de_poble/04_escriptori/261101_1246_prompt_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`
2. `[ ]` **En obrir els xats nous després de reiniciar el Mac:**
   - Diga **"Sóc de poble"** a MarIA i enganxa directament els 3 blocs de llançament (`261101_1246`) a **Claude Opus 5.5**, **GPT Codex** i **Gemini** per executar `T1`–`T10` (segon adaptador complet `adaptadorLocal.js` + `AbortSignal`, restaurador Open Data `importaMunicipiOpenData.js` round-trip, ActivityPub Fase 2 `inboxActivityPub.js` + actor propi de node germà `D-13`, `wikiManifest.js` diferit `< 250 KB` gzip, `design_guard` amb `0 avisos`, les 24 claus `TE-02` + `TE-01` + `TE-05` + A11y AAA, etiquetes i àlies a `FitxaMemoriaOral.jsx`, E2EE/Shamir UI + alertes per `town_id`, WordPress `v1.1.11`, ocultació condicional del botó d'Apple a iOS i `tractor-vigilant.mjs`).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre]]
- [[261101_1246_prompt_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre]]
- [[261101_0409_auditoria_claude]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
