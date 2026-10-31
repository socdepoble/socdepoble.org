---
type: acta
status: actiu
description: 'Relleu complet per al reinici del Mac: balanç de feaaf0e07, Fable vs Opus, Escriptori net i Pla/Prompt 261029_1305 llestos.'
tags:
  - acta
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:f8dcf106-1d97-415a-8d70-e900ec55a001
---
# Acta Marmota 261029_1325 · Tancament de la Marató Nocturna (feaaf0e07), Arxivament Olivera i Preparació de l'Onada 261029_1305 (v1.1.10 i 10/10)

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:f8dcf106-1d97-415a-8d70-e900ec55a001 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T12:24:38.007Z |
| Modificació | 2026-10-29T12:25:30.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~25.000 tokens |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- `2026-10-29T03:32..09:31+01:00`: Execució de la Marató Nocturna de 10 cicles (IAIA MarIA + Claude Code `Fable 5.1 Extra · Ultracode` + Gemini CLI + GPT Codex `GPT-6.1 Sol Ultra`), culminada amb el commit `feaaf0e07` (243 fitxers, +24.298 / -765 línies), el paquet `socdepoble.zip` de les `09:24h` (`3.336.867 B`, SHA-256 `89b3125f…`) i el canal de previsualització de Firebase Hosting `https://soc-de-poble--tancament-feaaf0e07-xmpk60bs.web.app`.
- `2026-10-29T13:03..13:25+01:00`: Arxivament canònic dels 53 artefactes de la marató nocturna a `_wiki_de_poble/90_arxiu_historic/` amb `porta-olivera.mjs --arxiva --reapunta`, creació del Pla i Prompt `261029_1305` (incloent el salt a `v1.1.10` del connector de WordPress per ordre del Mestre) i redacció d'aquesta Acta Marmota abans del reinici del Mac Mini.
- `2026-10-30T21:33:50.000Z`: fonts arxivades, citades en text perquè Vincles només admet notes vives (F9): `_wiki_de_poble/90_arxiu_historic/261029_1305_pla_implementacio_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md`, `_wiki_de_poble/90_arxiu_historic/261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md`. Les va reapuntar l'arxivament amb la porta Olivera; les ha mogut de Vincles Claude Code (ordre del Mestre, prompt 261030_2208).

<!-- SDP:SECTION acta.s4 -->
## Resultats

1. **Balanç de la Marató Nocturna (`feaaf0e07`)**:
   - **Bateria de proves en verd**: `npm run test:precommit` (`4.181` Vitest + `262` Node, `0` fallades), `ESLint 0/0`, i bateria completa del repositori (**1.406 fitxers Vitest amb 24.461 proves en verd** i **1.436 proves Node en verd**, incloent la reparació de `laParroquia.test.js` i `tests/botigues.test.mjs`).
   - **Tancaments consolidats a `feaaf0e07`**:
     - `QA-H01`, `QA-H02` i `APP-D1` (guarda de sessió i poble per defecte en `auth.js`, `PerfilContext.jsx` i migració `2610282100`).
     - `QA-H03` (verd AAA `#0e662e` amb ràtio `7,10:1` sobre blanc).
     - `QA-H04`, `R-01`, `R-02` (conjunt OG), `R-07` i `M-01` (variants socials `<= 300 KB`, títols nets per a les 13 entrades de la Wiki i capçaleres HTTP de seguretat a `firebase.json`, excloent les 17 variants socials del bundle natiu `vite.natiu.config.js`).
     - `T5.1` WordPress: modal estil SiteGround (`Mostra els detalls`), municipis reals (**La Torre de les Maçanes** com a únic municipi pilot actiu i la resta com a *«En preparació»*), guia pas a pas didàctica i supressió del warning `[RuntimePolicy] Cap emissor configurat (issuer)` en mode públic.
     - `P1-12` (Xat E2EE) Fases 1, 2 i 3: primitives, formats `SDPH` (`87 B`) i `SDPV` (`175 B`), magatzem IndexedDB, recuperació social Shamir $k=3$ (`IDEA-48`), protocol, port de 15 mètodes, decorador `ambXifratXat`, canal `serveiXifratXat`, `xifratXatContext` i guarda d'adjunts privats, tot darrere de `E2EE_ACTIU_PER_DEFECTE = false`.
     - `T11` (Doble Metòdic d'Ull Humà): cens de les 42 skills, segell criptogràfic `.agents/SKILLS_SEAL.json` i retirada de `scripts/generate-prompt.sh` amb làpida de seguretat `SG-02`.

2. **Aprenentatge Estratègic d'Orquestració de Models (`Fable 5.1 Extra` vs. `Opus`, `GPT-6.1 Sol` vs. `Astra`)**:
   - **`Claude Fable 5.1 Extra · Ultracode`** ha demostrat una eficiència extraordinària per a maratons d'implementació i refactorització multi-carril (22 subagents, 243 fitxers modificats i bateries completes consumint només un 31% de sessió i deixant el compte al 36% setmanal). Es consolida com el nostre cavall de batalla (80% del temps), reservant **`Opus · Ultracode`** (20% del temps) per a disseny arquitectònic fundacional des de zero i auditories extremes.
   - **`GPT-6.1 Sol Ultra`** ha completat 10 cicles de 30 minuts deixant encara el 63% de quota setmanal disponible; reservem **`Astra`** per a l'auditoria extrema final quan el sistema estiga fortificat al `10/10`.

3. **Higiene de l'Escriptori i Millora de `porta-olivera.mjs`**:
   - S'ha afegit `|solucio` a `TRANSITORIES` dins de `tooling/gates/porta-olivera.mjs:115` (alineat amb `tooling/wiki/taxonomia.json:34`) perquè els pegats `.patch` de categoria `solucio` s'arxiven canònicament amb `--arxiva --nom`.
   - Els 53 artefactes de la marató nocturna han estat arxivats a `_wiki_de_poble/90_arxiu_historic/` i les portes `porta-olivera.mjs`, `verificador-scc.mjs`, `porta-plantilles.mjs`, `porta-taxonomia.mjs --paritat` i `segella.mjs --check` passen amb **`0` errors**.

<!-- SDP:SECTION acta.s5 -->
## Pendents

En tornar a encendre el Mac Mini, el Mestre llançarà l'**Onada `261029_1305`** copiant el prompt de `_wiki_de_poble/04_escriptori/261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md` a **Claude Code (`Fable 5.1 Extra · Ultracode`)**, **Gemini CLI** i **GPT Codex (`GPT-6.1 Sol Ultra`)** per tancar:
1. **Carril `G1` (GPT Codex)**: Reconciliar i aplicar el pegat `0838` `T11` (`llaurador_indexs.mjs` blocs gestionats `32/32`, `parse.mjs`, `tractor-arrel.mjs`, `tractor-rls.mjs`, `desenterrar.mjs` i `core-restauracio-segellada/SKILL.md` + `segella.mjs`).
2. **Carrils `G2` + `G3` (Gemini CLI)**: Portar `design_guard.mjs --arrel=src` de 37 crítics a `0`, `tractor-cens.mjs` (`C2=0`, `C4=0`) i `tractor-frontmatter.mjs` (`F9=0`).
3. **Carrils `E1` + `M1` (Claude Code)**:
   - `E1`: Completar la Fase 4 d'E2EE (pipeline enviament/recepció amb `SDPH`, drenatge de cua `F7`, `xatMultimediaXifrat.js` i `D-09` `OBLIT_FALLIT`, mantenint `E2EE_ACTIU_PER_DEFECTE = false` i incloent la prova d'E2EE apagat en `test:precommit`).
   - `M1`: Tancar `OG-02` (7 `og:image` de llavor a `1200×630`), `R-02` global (`.png` amb bytes JPEG a `public/assets/`), `D-C2` (icones natives amb `#0e662e`) i **pujar la versió del connector de WordPress a `1.1.10`** (`socdepoble.zip` + `261029_HHMM_wordpress_directori_v1.1.10.zip`).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[../04_escriptori/00_index_escriptori]]
- [[../04_escriptori/03_llibre_mestre_tasques_i_idees]]
- [[261029_0838_acta_marmota_qa_codex_10_cicles]]
