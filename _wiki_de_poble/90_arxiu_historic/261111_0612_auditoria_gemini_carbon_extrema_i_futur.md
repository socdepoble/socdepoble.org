---
type: informe
status: esborrany
description: Auditoria extrema 4x+ Gauntlet (REA, EGM, MIT, craft-anything), Kit CAS R18, puntuació D01-D15, visió 1-3-5 anys, 5 DAFO+CAME i 4 rondes vives amb les 8 Escoles del Node 0.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fab2df76-ad89-4318-9c1f-2c611062cd04:5374e41d-0769-4fd1-91ee-ccec6f07b8bf
---
# Auditoria Adversarial Extrema 4x+ Gauntlet, Decisions R18, Visió 1-3-5 Anys, DAFO+CAME i Debat amb el Node 0

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fab2df76-ad89-4318-9c1f-2c611062cd04:5374e41d-0769-4fd1-91ee-ccec6f07b8bf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`/private/tmp/sdp_r18_carbon_extreme`, git HEAD `7aa74820d2207b9a50ec53ef3df406321db6df8f`) |
| Creació | 2026-11-11T05:08:52.575Z |
| Modificació | 2026-11-11T05:34:03Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) · Carril 3 `R18-EXTREME` (`P0-112 / IDEA-243`) |
| Tokens consumits | Telemetria Antigravity sessió `fd9aa963-cb51-4b6a-9e41-a3614aa719c6` (9 subagents EGM + REA + 4 rondes Node 0) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-11-11T05:08:52.575Z`: esborrany creat amb `document.mjs create` sota el torn `torn_fab2df76-ad89-4318-9c1f-2c611062cd04`.
- `2026-11-11T05:34:03Z`: completada la Quàdruple Tècnica (`REA` MCP + `Google EGM` 8 Peixos Daurats i 1 Elefant + `Mètode MIT` 5 fases + `storytold/craft-anything`), empaquetat i verificat en sec el Kit CAS `261111_kit_carbon_r18_extreme_gauntlet_i_futur`, actualitzat sense truncament `03_llibre_mestre_tasques_i_idees.md` i culminat el debat de 4 rondes amb les 8 Escoles del Node 0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### T1 · Auditoria Adversarial Extrema 4x+ Gauntlet i Kit CAS

#### Metodologia Quàdruple Tècnica Executada

1. **Enginyeria Inversa (`REA` MCP):** Anàlisi AST/JS sobre `src/` (`analyze_javascript_application`, bundle d'evidència `ev_5ee6bc1c7b7b27685bf307519a5dc64a19cb41362b72ab23d4b655ec8fca8121`, **470 fitxers**, **192.720 nodes AST**, identificació de rutes de càrrega crítica vs `lazyRoute`).
2. **Eixam `Google EGM` (8 Peixos Daurats + 1 Elefant Sintetitzador):** 9 subagents especialitzats (`egm-zoom-out`, `egm-structural`, `egm-implementation-readiness`, `egm-style`, `egm-inventive-catalyst`, `egm-codebase-details`, `egm-design`, `egm-comprehension`, `egm-synthesizer`) auditant cada angle de codi, seguretat, accessibilitat, i18n i sostenibilitat.
3. **Mètode MIT d'Acumulació Semàntica (5 Fases):** Lectura íntegra del Pla viu, del Tauler Sinàptic, del corpus `corpus_socdepoble_v2_443_integre.json` i dels informes creuats de Claude (`0206`) i Codex (`0205`), seguida de fusió a 3 bandes (`HEAD` vs `LIVE` vs `CLONE`) per alinear el Kit CAS al 100% amb l'obra acabada per Claude (`src/apps/genealogia/` 60 fitxers + `P0-115`).
4. **Inspecció Visual Viva (`storytold/craft-anything`):** Servidor estàtic aïllat sobre `dist/` auditat amb Playwright headless en `375 px`, `768 px` i `1440 px`, amb aturada neta immediata en bloc `finally` (`0` processos zombis).

#### Registre Estructurat de Troballes Reals (`T1-01` .. `T1-14`)

1. **`T1-01` · Vector XSS potencial en `source_url` d'articles importats (`src/sections/detail/detailSectionMeta.jsx`)**
   - **Scope afectat:** `src/sections/detail/detailSectionMeta.jsx`.
   - **Evidència reproduïble:** En renderitzar l'enllaç extern de procedència d'un article importat (`article.source_url`), no es filtrava amb `isSafeUrl()`, permetent esquemes `javascript:` o `data:` si un XML WXR/Blogger maliciós s'ingeria sense sanejament previ.
   - **Severitat:** **Alta** (Seguretat DOM / XSS).
   - **Font de veritat en conflicte:** `.agents/skills/core-seguretat-audit/SKILL.md` i contracte `src/utils/safeUrl.js`.
   - **Proposta conservadora aplicada al Kit CAS:** Guarda estricta `isSafeUrl(article.source_url)` abans de renderitzar l'`<a href=...>`.
   - **`requires_human_decision`:** `false`.

2. **`T1-02` · Trencament de motor JS en Safari 16.0 / iPadOS rurals per RegExp Lookbehind (`src/data/importacio/paginesTrilogiaIMoliEditorial.js`)**
   - **Scope afectat:** `src/data/importacio/paginesTrilogiaIMoliEditorial.js`.
   - **Evidència reproduïble:** L'expressió regular amb *negative lookbehind* (`(?<!...)`) llança `SyntaxError: Invalid regular expression` en WebKit pre-16.4 (tauletes i mòbils heretats habituals a les llars rurals).
   - **Severitat:** **Alta** (Disponibilitat / Crash en càrrega del mòdul).
   - **Font de veritat en conflicte:** Baseline 2022 de compatibilitat declarada a `src/css/tokens.css` i `sdp-casos-us-essencials`.
   - **Proposta conservadora aplicada al Kit CAS:** Substitució per funció determinista sense *lookbehind* amb idèntic resultat semàntic.
   - **`requires_human_decision`:** `false`.

3. **`T1-03` · Asimetria de pont natiu iOS vs Android en tancament de sessió (`ios/App/App/CompartirNatiuPlugin.swift`)**
   - **Scope afectat:** `ios/App/App/CompartirNatiuPlugin.swift`.
   - **Evidència reproduïble:** El client JS invocava `tallaSessio` en tancar sessió per netejar la cua d'intents compartits pendents; Android ho implementava però el plugin Swift d'iOS no exposava `@objc func tallaSessio(_ call: CAPPluginCall)`, retornant `UNIMPLEMENTED`.
   - **Severitat:** **Mitjana-Alta** (Privadesa en dispositius compartits iOS).
   - **Font de veritat en conflicte:** Paritat Capacitor iOS/Android i sanejament d'estat de sessió.
   - **Proposta conservadora aplicada al Kit CAS:** Implementació d'`@objc func tallaSessio(_ call: CAPPluginCall)` buidant l'esborrany pendent i resolent `call.resolve()`.
   - **`requires_human_decision`:** `false`.

4. **`T1-04` · Fals negatiu en el detector d'exposició RLS (`tooling/gates/tractor-rls.mjs`)**
   - **Scope afectat:** `tooling/gates/tractor-rls.mjs`.
   - **Evidència reproduïble:** L'expressió regular que audita clàusules `USING (true)` o `TO anon` sensibles als espais/salts de línia multilínia podia ometre polítiques escrites en diverses línies.
   - **Severitat:** **Mitjana** (Governança mecànica de seguretat SQL).
   - **Font de veritat en conflicte:** `.agents/skills/core-seguretat-audit/SKILL.md` (`tractor-rls.mjs` `0 infraccions` reals).
   - **Proposta conservadora aplicada al Kit CAS:** Enduriment de l'expressió regular multilínia; verificades les **95 fitxes SQL** amb `0 infraccions`.
   - **`requires_human_decision`:** `false`.

5. **`T1-05` · Cens d'imatges incomplet que deixava `censImatges.test.js` en roig a l'arbre viu (`src/sections/multimedia/censImatges.js` + `src/config/imatgeSocial.js`)**
   - **Scope afectat:** `src/sections/multimedia/censImatges.js`, `src/config/imatgeSocial.js` i 6 fitxers `.webp` del catàleg 2007 d'El Rentonar.
   - **Evidència reproduïble:** Reconegut explícitament per Claude a `261111_0206_auditoria_claude.md` (L100): les imatges noves en `public/assets/uploads/` (`avisador_vinyeta.webp` i les làmines/mapes d'`arbres-emblematics/la-torre-de-les-macanes/`) feien fallar `censImatges.test.js` i la verificació de variants socials.
   - **Severitat:** **Alta** (Bloqueig de CI i absència de traçabilitat d'autoria gràfica).
   - **Font de veritat en conflicte:** `tractor-cens.mjs` i `censImatges.test.js`.
   - **Proposta conservadora aplicada al Kit CAS:** Cens complet de les **103 entrades noves** amb autoria acreditada (`Associació El Rentonar · Pedro Ferrer Rodríguez` per al catàleg d'arbres i `Sóc de Poble` per a `avisador_vinyeta.webp`), deixant `censImatges.test.js` (`16/16 PASS`) i `tractor-cens.mjs` en verd.
   - **`requires_human_decision`:** `false`.

6. **`T1-06` · Tres subarbres orfes nous de `R18a` (`P0-114`) caçats per `tractor-pedra-seca.mjs` (`LLEI_08_SUBARBRE_ORFE`)**
   - **Scope afectat:** `src/apps/genealogia/nucli/magatzem.js`, `src/components/salut/BatecDeVidaCard.jsx`, `src/services/batecDeVidaMonitor.js` i `tooling/brain/tractor-pedra-seca.mjs`.
   - **Evidència reproduïble:** En executar `node tooling/brain/tractor-pedra-seca.mjs` sobre l'estat completat de `LIVE`, la porta s'aturava amb `exit 1` (`LLEI_08_SUBARBRE_ORFE: 15 > màx 11`) perquè Claude havia traslladat el magatzem a `src/apps/genealogia/magatzem.js` i l'Avisador de `/control` a `/app/salut`, sense poder esborrar els 3 fitxers antics pel hook de sessió ni declarar-los temporalment a `EXCEPCIONS_ORFE`.
   - **Severitat:** **Alta** (Trencament directe de `npm run porta:pedra-seca` / `npm run porta`).
   - **Font de veritat en conflicte:** `tooling/brain/tractor-pedra-seca.mjs` (`LLEI 8`) i `AGENTS.md §5` (prohibició d'esborrat sense ordre explícita del Mestre).
   - **Proposta conservadora aplicada al Kit CAS:** Registre explícit i justificat a `EXCEPCIONS_ORFE` (juntament amb `src/data/revisionsEditorialsWpMemoria.js` com a mòdul de `adaptadorLocal.js`), deixant `tractor-pedra-seca.mjs` amb **0 infraccions noves (`exit 0`)**, i documentació per a l'esborrat definitiu pel Mestre.
   - **`requires_human_decision`:** `true` (només per autoritzar l'esborrat físic futur dels 3 fitxers antics substituïts).

7. **`T1-07` · Infracció potencial de la Llei de l'Enxufabilitat si la memòria local importa de `./supabase/*` (`src/data/revisionsEditorialsWpMemoria.js`)**
   - **Scope afectat:** `src/data/revisionsEditorialsWpMemoria.js`.
   - **Evidència reproduïble:** `tractor-enxufe.mjs` (`E1`) prohibeix taxativament que cap mòdul de `src/data/` fora de `src/data/supabase/` importe res de `./supabase/*`.
   - **Severitat:** **Alta** (Frontera d'arquitectura `AGENTS.md §8`).
   - **Font de veritat en conflicte:** `AGENTS.md §8` i `tooling/gates/tractor-enxufe.mjs`.
   - **Proposta conservadora aplicada al Kit CAS:** Mòdul `revisionsEditorialsWpMemoria.js` 100% autosuficient sense cap dependència de `./supabase/*`; `tractor-enxufe.mjs` passa `E1..E4` al 100%.
   - **`requires_human_decision`:** `false`.

8. **`T1-08` · Token tipogràfic inexistent `--sdp-font-condensed` caçat per `LLEI_02_TOKEN_FANTASMA` (`src/css/components.css`)**
   - **Scope afectat:** `src/css/components.css` (`.sp-card-calendar-badge__geo-coords`).
   - **Evidència reproduïble:** `tractor-pedra-seca.mjs` detectà que el sistema Pedra Seca no defineix `--sdp-font-condensed`, sinó el eix variable `font-stretch: var(--sdp-font-amplada-estreta)` (`75%`, declarat a `tokens.css` i `tipografia-estreta.css`).
   - **Severitat:** **Mitjana** (Coherència del sistema de disseny i porta `LLEI_02`).
   - **Font de veritat en conflicte:** `src/css/tokens.css` i `src/css/tipografia-estreta.css`.
   - **Proposta conservadora aplicada al Kit CAS:** Ús de `font-stretch: var(--sdp-font-amplada-estreta)` en `.sp-card-calendar-badge__geo-coords`; `LLEI_02_TOKEN_FANTASMA` torna al seu sòl històric (`1 / màx 1`).
   - **`requires_human_decision`:** `false`.

9. **`T1-09` · Absència de persistència remota multi-dispositiu en les revisions del corpus WP de 443 entrades (`P0-111`)**
   - **Scope afectat:** `supabase/migrations/2611110455_revisions_editorials_wp.sql`, `src/data/contracte.js`, `src/data/backendPort.js`, `src/data/supabase/revisionsEditorialsWp.js`, `src/data/local/adaptadorLocal.js`, `src/data/conformitat/kit.js` i `src/utils/revisioEditorialWp.js`.
   - **Evidència reproduïble:** Les decisions d'aprovació/rebuig de `BancImportacioEditorial.jsx` vivien únicament al `localStorage` del navegador de l'administrador, perdent-se en canviar d'ordinador o netejar caché.
   - **Severitat:** **Alta** (Integritat operativa del flux editorial).
   - **Font de veritat en conflicte:** `AGENTS.md §8` (Supabase com a única font de veritat darrere de `backendPort.js`) i `P0-111`.
   - **Proposta conservadora aplicada al Kit CAS:** Capacitat #53 `revisionsEditorialsWp` (`llistaRevisionsEditorialsWp`, `desaRevisioEditorialWp`) darrere de `backendPort.js`, migració SQL idempotent amb RLS estricte (`superadmin` + `aal2`) i hidratació no bloquejant a `BancImportacioEditorial.jsx`.
   - **`requires_human_decision`:** `false` (aplicació remota de la migració quan s'òbriga finestra de desplegament).

10. **`T1-10` · Sangrat asimètric de `3 px` per `border-left: 3px solid transparent` a les fitxes de llista (`src/css/modules.css` i `src/css/tokens.css`)**
    - **Scope afectat:** `src/css/modules.css` i `src/css/tokens.css` (`P0-116`).
    - **Evidència reproduïble:** El `border-left: 3px solid transparent` desplaçava permanentment el contingut `3 px` cap a la dreta respecte a la plumilla superior i les vores Pedra Seca.
    - **Severitat:** **Mitjana** (Geometria visual Pedra Seca).
    - **Font de veritat en conflicte:** `.agents/skills/sdp-pedra-seca/SKILL.md` i ordre directa `P0-116`.
    - **Proposta conservadora aplicada al Kit CAS:** Eliminació del `border-left` extern (`0 px` de sangrat) i creació del token semàntic `--sdp-filet-actiu-interior` (`inset 3px 0 0` d'alt contrast amb filet separador `1 px` adaptatiu clar/fosc).
    - **`requires_human_decision`:** `false`.

11. **`T1-11` · Rastres residuals de vocabulari `premium` en textos d'ajuda i seeds (`P0-113`)**
    - **Scope afectat:** `src/components/PedraSeca/molecules/CandidatsAlergens.jsx`, `src/data/agentsSeed.js`, `src/sections/profile/PortabilitatFederada.jsx`, `src/sections/text/pageContent.r10.test.js`.
    - **Evidència reproduïble:** Mencions residuals a funcionalitats «premium» contradient el manifest de gratuïtat radical `P0-113`.
    - **Severitat:** **Mitjana** (Coherència ètica i institucional).
    - **Font de veritat en conflicte:** Decisió `P0-113` del Pla viu R18.
    - **Proposta conservadora aplicada al Kit CAS:** Neteja total de mencions de pagament dins del codi i tests en verd.
    - **`requires_human_decision`:** `false`.

12. **`T1-12` · Trencament silenciós de `design_guard.mjs` (`raw-color: 0 -> 13`) a l'arbre viu `R18a` pel literal `#619`**
    - **Scope afectat:** `src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx`, `src/sections/patrimoni/Columna2Canonica.test.jsx`, `src/sections/patrimoni/NaturaPatrimoniWorkspaceSection.jsx`, `src/sections/patrimoni/WorkspacesMultiLlibreR17.test.jsx` i `src/sections/text/pageContent.patrimoniR9.js`.
    - **Evidència reproduïble:** L'identificador de la portada de WordPress `#619` té exactament 3 dígits hexadecimals vàlids (`6`, `1`, `9`), disparant la regla `raw-color` (`/#[0-9a-fA-F](3, 8)\b/`) de `tooling/gates/design_guard.mjs` amb 13 errors crítics i `exit 1`.
    - **Severitat:** **Alta** (Bloqueig immediat de `npm run porta:design-guard` / CI en l'arbre viu).
    - **Font de veritat en conflicte:** `tooling/gates/design_guard.mjs`.
    - **Proposta conservadora aplicada al Kit CAS:** Anotació explícita `/* ALLOW_RAW_COLOR */` als literals d'ID editorial `#619` sense alterar ni un sol caràcter visible per a la persona usuària (`Design Guard: 0 critics, 0 avisos`).
    - **`requires_human_decision`:** `false`.

13. **`T1-13` · Trencament de `npm run build` (`prerender-social.mjs`) a l'arbre viu `R18a` per import no estàtic en `pageContent.patrimoniR9.js:1`**
    - **Scope afectat:** `src/sections/text/pageContent.patrimoniR9.js` i `src/sections/text/pageContent.dretsPatrimoni.js`.
    - **Evidència reproduïble:** En implementar `P0-115`, `R18a` afegí `import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';` a `pageContent.patrimoniR9.js:1`. El parser AST sense execució de `tooling/seo/build-social-manifest.mjs:197` exigeix que tota dependència de `src/sections/text/` comence per `./` i visca dins de `src/sections/text/`, avortant `npm run build` (`build:social`) amb `{"valid":false,"error":"Import no estàtic en la font de dades."}`.
    - **Severitat:** **Crítica** (Bloqueig total del build de producció i prerender OpenGraph de Firebase Hosting).
    - **Font de veritat en conflicte:** `tooling/seo/build-social-manifest.mjs` i `src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx`.
    - **Proposta conservadora aplicada al Kit CAS:** Declaració de `DRETS_SDP_PAGINA` dins `./pageContent.dretsPatrimoni.js` (idèntica a `COPYRIGHT_SDP`, verificada per `AutoriaDosNivellsArbres.test.jsx` `6/6 PASS`) i importació local `./pageContent.dretsPatrimoni.js`, restaurant `npm run build` i `prerender-social.mjs` al 100% en verd.
    - **`requires_human_decision`:** `false`.

14. **`T1-14` · Clau de reserva CI invàlida `'mock-anon-key'` en `vite.config.js:99`**
    - **Scope afectat:** `vite.config.js`.
    - **Evidència reproduïble:** Quan `CI=true` sense `VITE_SUPABASE_ANON_KEY`, `vite.config.js:99` injectava `'mock-anon-key'`, que era rebutjada immediatament per `validatePublicCredentials` (`^sb_publishable_[A-Za-z0-9_-]+$`).
    - **Severitat:** **Baixa-Mitjana** (Fricció i fallada en builds CI nets sense secrets).
    - **Font de veritat en conflicte:** `src/config/publicCredentials.js`.
    - **Proposta conservadora aplicada al Kit CAS:** Substitució de `'mock-anon-key'` per `'sb_publishable_ci_mock'`.
    - **`requires_human_decision`:** `false`.

#### Inventari Criptogràfic del Kit CAS (`261111_kit_carbon_r18_extreme_gauntlet_i_futur`)

| Artefacte del Kit CAS | Valor / Empremta Verificada |
| --- | --- |
| Ruta canònica | `../_investigacio_ia_de_poble/261111_kit_carbon_r18_extreme_gauntlet_i_futur/` |
| Operacions totals | `82` (`76` fitxers de text + `6` binaris `.webp`; `22` creats + `60` modificats sobre `LIVE`) |
| `MANIFEST.json` (`SHA-256`) | `5d66d10ac959c9a3bb3ea14e0c5d33f39a9d52aa68c7d535a80991dcfb3aa8cd` |
| `pegats/CARBON_R18_EXTREME.patch` (`SHA-256`) | `86e1b8ac697b337573648fd411c47e40f806117e3e8fd396ab493675236d4e9c` |
| `SHA256SUMS` (`SHA-256`) | `f735d9688a0edf5511ff792849eae58f718fe67c06aef6587c06e33269cddc11` |
| Verificació en sec sobre `socdepoble.org` | `82/82` preimatges exactes (`0` divergències pendents) |
| Nucli Verge (`dist/assets/index-TmlYdVp0.js`) | `701703 B` cru · **`244382 B gzip-9`** (sostre `250.000 B`, marge lliure **`+5618 B`**) |

---

### T2 · Caça d'Errors Invisibles, Decisions R18 (P0-107..P0-116) i Puntuació D01-D15

#### Verificació de les Decisions Vives R18

- **Unificació Columna 2 de `/page/receptes` i `/page/arbres-monumentals` (`P0-115`):** Verificada amb `Columna2Canonica.test.jsx` i `ReceptesWorkspaceSection.test.jsx`: ambdós catàlegs renderitzen `DefaultItemCard` (`button.sdp-gestor-fitxa`) idèntica al DOM de `/disseny` i `/wikidepoble`, amb atribut `lang="ca"` automàtic (WCAG 3.1.2) quan la UI està en `es/en/eu/gl`.
- **`P0-107` · `SquareBadge` Opció 1 (`128×128 px` verd `--sdp-verd` `#0e662e`):** Implementat a `SquareBadge.jsx` i `components.css` amb 3 pisos (`📍` + verb `AL MAPA` pentalingüe `ca/es/en/eu/gl` + coordenada curta `38.66°N · 0.42°W` amb `font-stretch: var(--sdp-font-amplada-estreta)`), contrast real exacte **`7,0978:1` (`7,10:1` WCAG 2.2 AAA sense arredoniment trampós; hover `#0a4d22` = `10,38:1` AAA)** i navegació directa a `/mapa?lat=...&lng=...&zoom=18&id=...` amb `e.stopPropagation()`.
- **`P0-108` · 7 Sèries Biblioteconòmiques:** Creades les 7 sèries sota `public/assets/uploads/patrimoni/` (`gastronomia`, `arbres-emblematics`, `herbari`, `banc-de-llavors`, `arquitectura-pedra-seca`, `rutes-i-camins`, `memoria-oral`), cadascuna amb el seu `datapackage.json` Frictionless v2.0 + registre tipat `src/data/patrimoni/seriesPatrimoni.js` connectat al chunk diferit de `PublicarMapaShowcase.jsx`.
- **`P0-110` · `/page/publicar_mapa` amb `MapaFotografic` `lazyRoute`:** `PublicarMapaShowcase.jsx` s'injecta via `abansIntro` exactament entre el bloc blanc de l'`H1` i l'`H2` taronja, mostra els 19 arbres geolocalitzats de La Torre, presenta una `UniversalCard` real d'exemple (*Llorer de Villa María*) amb `SquareBadge` `geo` abans del segon botó blau `Publicar`, conserva els **2 botons blaus `Publicar`** i afig **`0 B`** al Nucli Verge.
- **`P0-111` + `P0-115` · Sagrada Autoria d'`Associació El Rentonar` i Pedro Ferrer Rodríguez:** Els **20 ítems reals** verificats al corpus de 443 entrades (`#619` portada del catàleg + 19 arbres singulars: `#1786`, `#1784`, `#1782`, `#1780`, `#1778`, `#1776`, `#1774`, `#1772`, `#1770`, `#1768` *Llorer de Villa María*, `#1766`, `#1764`, `#1762`, `#1760`, `#1758`, `#1756`, `#1754`, `#1751` i `#2014` *Xiprers del Cementeri*) ixen aprovats cap a `arbres-monumentals` signats exclusivament per **`Associació El Rentonar`** (`/rentonar`) amb estudi tècnic acreditat a **Pedro Ferrer Rodríguez** (**MAI `Sóc de Poble`**), mentre els **423 articles restants** continuen estrictament en `pendent_admin`. En entrar a `/page/arbres-monumentals` sense ítem triat (Nivell 1), la pàgina marc porta `COPYRIGHT_SDP`; en obrir qualsevol de les 20 pàgines del llibre (Nivell 2), es renderitza sense embolcall `TextSection` de `Sóc de Poble` i cada fitxa d'arbre incorpora també el nou `SquareBadge` verd `AL MAPA`.

#### Evidència Visual `storytold/craft-anything` (`375 px`, `768 px`, `1440 px`)

| Ruta verificada sobre `dist/` | Viewport | `overflowPx` | Comprovacions geomètriques i semàntiques observades |
| --- | --- | --- | --- |
| `/page/receptes` | `375 px` | `0 px` | h1=1, .sdp-gestor-fitxa=149 |
| `/page/publicar_mapa` | `375 px` | `0 px` | h1=1, mapaVisor=true, botonsPublicar=2, SquareBadge=128×128px (rgb(14, 102, 46)) |
| `/page/arbres-monumentals` | `375 px` | `0 px` | h1=1, .sdp-gestor-fitxa=20 |
| `/mapa?lat=38.608122&lng=-0.421325&zoom=18&id=arbre-10-llorer-de-villa-maria` | `375 px` | `0 px` | h1=1, botonsPublicar=1 |
| `/page/receptes` | `768 px` | `0 px` | h1=1, .sdp-gestor-fitxa=149 |
| `/page/publicar_mapa` | `768 px` | `0 px` | h1=1, mapaVisor=true, botonsPublicar=2, SquareBadge=128×128px (rgb(14, 102, 46)) |
| `/page/arbres-monumentals` | `768 px` | `0 px` | h1=1, .sdp-gestor-fitxa=20 |
| `/mapa?lat=38.608122&lng=-0.421325&zoom=18&id=arbre-10-llorer-de-villa-maria` | `768 px` | `0 px` | h1=1, botonsPublicar=1 |
| `/page/receptes` | `1440 px` | `0 px` | h1=1, .sdp-gestor-fitxa=149 |
| `/page/publicar_mapa` | `1440 px` | `0 px` | h1=1, mapaVisor=true, botonsPublicar=2, SquareBadge=128×128px (rgb(14, 102, 46)) |
| `/page/arbres-monumentals` | `1440 px` | `0 px` | h1=1, .sdp-gestor-fitxa=20 |
| `/mapa?lat=38.608122&lng=-0.421325&zoom=18&id=arbre-10-llorer-de-villa-maria` | `1440 px` | `0 px` | h1=1, botonsPublicar=1 |

#### Puntuació Rigorosa de les 15 Dimensions Canòniques (`D01` – `D15`)

| Codi | Dimensió | Nota (/10) | Evidència Reproduïble i Justificació Salfumant Radical |
| --- | --- | --- | --- |
| `D01` | Enxufabilitat i Port Neutral (Model B) | **9,9** | `tractor-enxufe.mjs` `E1..E4` verd; 53 capacitats simètriques entre Supabase i `adaptadorLocal` (`kit.test.js` `144/144`, `adaptadorLocal.test.js` `45/45`). Resta `0,1` fins aplicar la migració `2611110455` en remot. |
| `D02` | Seguretat, RLS, Auth AAL2 i Sanejament | **9,8** | `tractor-rls.mjs` `0` infraccions en 95 SQL; `isSafeUrl` en `detailSectionMeta.jsx`; RLS `superadmin + aal2` a `revisions_editorials_wp`; `@objc func tallaSessio` en iOS. |
| `D03` | Disseny Pedra Seca i Coherència Geomètrica | **9,8** | `tractor-pedra-seca.mjs`, `design_guard.mjs`, `tractor-fitxa-gestor.mjs` (`F1..F9`) i `01_porta_pedra_seca_58px.mjs` 100% verds; sangrat `0 px` (`P0-116`) i Columna 2 unificada (`P0-115`). |
| `D04` | Accessibilitat WCAG 2.2 AAA i Ergonomia Rural | **9,8** | `SquareBadge` `#0e662e` = `7,10:1` AAA (`10,38:1` en hover), `touch >= 44 px` (`LLEI_04_VIDA = 0`), atributs `lang="ca"` en títols vernacles (WCAG 3.1.2) i `overflowPx = 0` a `375 px`. |
| `D05` | Rendiment i Pressupost del Nucli Verge | **9,9** | Nucli Verge en **`244382 B gzip-9`** (`+5618 B` sota el sostre de `250.000 B`); Leaflet (`MapaFotografic`), Genealogia i showcases 100% aïllats darrere de `lazyRoute()`. |
| `D06` | Local-First, Resiliència Offline i Privadesa | **9,8** | `/app/genealogia`, `/app/salut` (Avisador), `/app/gestoria`, `/app/bar` i `/app/nevera` operen en IndexedDB local amb guarda `amaDelDocument` per a dades sensibles (`salut`/`financeres`) i zero PII al núvol. |
| `D07` | Paritat Pentalingüe i Qualitat Editorial (`ca/es/en/eu/gl`) | **9,7** | `LLEI_07_PARITAT_I18N = 0` buits; textos de `SquareBadge`, `PublicarMapaShowcase`, `arbres-monumentals` i plugins complets en les 5 llengües sense anglicismes innecessaris. |
| `D08` | Custòdia Patrimonial i Ètica d'Autoria | **10,0** | Separació quirúrgica de 2 nivells (`P0-115`): marc `Sóc de Poble` vs autoria sagrada d'**`Associació El Rentonar`** i **Pedro Ferrer Rodríguez** als 20 ítems del catàleg + 7 sèries Frictionless 2.0 (`P0-108`). |
| `D09` | SEO Semàntic, Social Cards i Federació POSSE | **9,6** | `build:seo` i `build:social` verds; `censImatges` i `imatgeSocial` complets amb les 103 entrades noves; pendent activar l'inbox ActivityPub runtime (`D-T3-5`) en fase servidor. |
| `D10` | Dades Obertes i Portabilitat Municipal | **9,7** | `datapackage.json` Frictionless Data v2.0 a les 7 sèries patrimonials, exportació GEDCOM 7.0 / 5.5.1 + JSON a Genealogia i paquet de sobirania municipal verificat. |
| `D11` | Qualitat de Proves i Verificació Mecànica | **9,8** | `eslint --max-warnings=0` (`0/0`), 90 migracions verificades, 24+ suites Vitest crítiques passades al clon integrat i portes del Reflex verdes. |
| `D12` | Compatibilitat Multi-Dispositiu i WebKit Rural | **9,7** | Eliminació del RegExp *lookbehind* que trencava Safari 16.0 (`T1-02`), paritat Capacitor `tallaSessio` i absència d'`oklch()` cru per a navegadors Baseline 2022. |
| `D13` | Governança Documental i Higiene d'Escriptori | **9,9** | Porta Olivera `exit 0`, Acte Reflex amb rebut criptogràfic `sdp:torn_...`, Llibre Mestre ampliat sense truncar ni un sol byte (`SHA-256` prefix verificat). |
| `D14` | Gratuïtat Radical i Claredat del Sistema de Plugins | **9,9** | Zero portes de pagament al codi (`P0-113`), les 6 apps internes (`bar`, `salut`, `nevera`, `lector`, `gestoria`, `genealogia`) obertes com a eines gratuïtes en proves ben explicades. |
| `D15` | Sostenibilitat Estratègica i Orquestració Colmena | **9,7** | Convergència verificada de `Claude` (`R18a`), `Codex` (`R18.2`), `Gemini Carbon` (`R18-EXTREME`) i les **8 Escoles del Node 0** amb model econòmic realista fora del codi. |

- **Mitjana Ponderada Global post-`R18-EXTREME`:** **`9,80 / 10`** (bloqueig únic abans de pujar a producció: aplicar el Kit CAS + el kit de Codex i executar la migració `2611110455_revisions_editorials_wp.sql`).

---

### T3 · Visió de Futur (1, 3 i 5 Anys), Catàleg de Serveis Sostenibles, 5 DAFO+CAME i Matrius del Llibre Mestre

#### Horitzó Estratègic de Sóc de Poble a 1, 3 i 5 Anys

- **Horitzó 1 Any (`Novembre 2026 – Novembre 2027` · Consolidació Comarcal i Far de La Torre):**
  - La Torre de les Maçanes opera com a municipi pilot de referència completa: els **443 articles històrics** estan curats i publicats amb autoria legítima (Associació El Rentonar, Sangonereta, memòria oral veïnal), les 6 aplicacions locals gratuïtes (`El Bar`, `La Nevera`, `Salut + Avisador`, `Notícies del Poble`, `Gestoria`, `Arbre Genealògic`) tenen adopció real entre comerços, associacions i famílies, i els primers **5 a 8 municipis veïns** de l'Alcoià, el Comtat i l'Alacantí repliquen l'estructura de 7 sèries biblioteconòmiques i catàlegs d'arbres/receptes.
  - Sostenibilitat basal coberta per micro-serveis clau en mà (`10 €/any`), convenis menors d'arxiu viu municipal i primera convocatòria europea NGI0 / NLnet presentada.
- **Horitzó 3 Anys (`2027 – 2029` · Xarxa Intercomarcal de Municipis Sobirans i Mancomunitats):**
  - Escalada a **35–60 pobles valencians i ibèrics** mitjançant instàncies enxufables (Model B sobre webs municipals, WordPress o Sollutia) federades amb ActivityPub / Fediversity (`FEP-7628` / `FEP-8b32`).
  - L'**Arxiu Etnogenealògic i Toponímic Rural** (cases, malnoms, arbres singulars, bancs de llavors, pous de neu i rutes) esdevé infraestructura educativa per a escoles rurals i instituts comarcals (aprenentatge-servei intergeneracional on néts entrevisten iaios amb `/app/genealogia`).
  - Custòdia patrimonial 3-2-1 automatitzada entre Supabase, paquets Frictionless Data i rèpliques físiques locals en Nodes 0 municipals / biblioteques públiques.
- **Horitzó 5 Anys (`2029 – 2031` · Estàndard Europeu de Bé Comú Digital Rural):**
  - `Sóc de Poble` consolida una fundació o cooperativa sense ànim lucratiu especulatiu reconeguda com a **Digital Public Good (DPG)** europeu per a territoris en risc de despoblament, amb codi 100% AGPL-3.0, zero publicitat invasiva, zero venda de dades i autogovern comunitari.
  - Xarxa descentralitzada de Nodes 0 rurals amb IA local oberta al servei de cronistes, cooperatives agrícoles, comunitats de regants i associacions culturals en múltiples llengües minoritzades i peninsulars.

#### Catàleg de 6 Serveis Reals i Sostenibles (100% Fora del Codi Lliure)

1. **Servei 1 · Presència i Digitalització «Clau en Mà» per a Comerços, Forns, Bars i Oficis (`10 €/any` simbòlics i voluntaris):**
   - Tota l'eina és 100% gratuïta si el comerciant s'ho fa ell mateix; els `10 €/any` remuneren exclusivament l'acompanyament humà presencial (fer les 4 fotos amb llum natural, redactar la fitxa en valencià/castellà, configurar horaris i carta al TPV `El Bar` i deixar-li un cartell QR imprés en Pedra Seca). Amb 300 petits negocis comarcals = `3.000 €/any` nets de base comunitària i fidelitat màxima.
2. **Servei 2 · Convenis Menors Municipals de «Memòria Viva, Catàleg Patrimonial i Transparència Odata» (`1.500 – 2.950 €/any` per ajuntament):**
   - Dins del llindar legal de contractació menor i plec cultural/mediambiental: digitalització i manteniment anual del Catàleg d'Arbres Monumentals (Llei 4/2006), Pous de Neu, Fonts, Camins i Banc de Llavors amb exportació automàtica Frictionless Data v2.0 per al portal de Dades Obertes de la Diputació/Generalitat. Amb 8 ajuntaments = `15.000 – 22.000 €/any`.
3. **Servei 3 · Tallers Intergeneracionals «Pont de Memòria» per a Escoles Rurals, Aules de la Tercera Edat i Mancomunitats (`LEADER` / Diputació):**
   - Programa pedagògic presencial on l'alumnat i la gent gran utilitzen `/app/genealogia` (entrevista guiada de malnoms i cases) i `/page/publicar_mapa` per documentar el terme municipal, finançat per partides de Benestar Social, Envelliment Actiu i Joventut.
4. **Servei 4 · Subvencions Europees de Sobirania Tecnològica (`NLnet NGI0 Commons Fund`, `Fediversity`, `Erasmus+ Rural`):**
   - Finançament no dilutiu (`15.000 – 50.000 €` per fita tècnica verificable) per a peces AGPL-3.0 que `Sóc de Poble` ja té molt avançades: port neutral `backendPort`, federació ActivityPub local-first, xifrat E2EE amb recuperació social i paquets de sobirania municipal offline/DTN.
5. **Servei 5 · Enxufabilitat Institucional Model B amb Socis Tecnològics Locals (`Sollutia`, agències web municipals):**
   - Implantació del Web Component `<pedra-seca-embed>` sobre portals municipals i d'associacions ja existents sense obligar-los a migrar el seu CMS, compartint manteniment tècnic d'infraestructura.
6. **Servei 6 · Custòdia Arxivística per a Associacions Culturals, Confraries, Societats Musicals i Comunitats de Regants (`50 – 150 €/any` de mecenatge mutualista):**
   - Digitalització d'actes històriques, llibrets de festes, partitures i fotografies antigues sota les 7 sèries biblioteconòmiques, garantint l'autoria exclusiva de cada entitat (com s'ha demostrat amb l'`Associació El Rentonar`).

#### Cinc Matrius DAFO + CAME Completes

##### 1. DAFO + CAME Tecnològic i Arquitectònic
- **Debilitats:** Alt nombre de portes i scripts propis que exigeixen disciplina estricta en cada merge; migracions remotes i inbox ActivityPub encara pendents d'execució de servidor.
- **Amenaces:** Obsolescència de navegadors en mòbils rurals antics; talls de cobertura 4G en masos i barrancs; dependència de quotes d'APIs d'IA externes durant el desenvolupament.
- **Fortaleses:** Nucli Verge ultra-lleuger (`244382 B gzip-9`), Llei de l'Enxufabilitat (`backendPort.js` amb 53 capacitats verificades), apps sensibles 100% IndexedDB local-first i Node 0 propi (`Mac mini M4` amb 8 escoles Ollama locals).
- **Oportunitats:** Estàndards oberts W3C ActivityPub, Frictionless Data 2.0 i Web Components incrustables en qualsevol web municipal o cooperativa.
- **CAME Tecnològic:**
  - **Corregir (D):** Automatitzar la reconciliació amb Kits CAS deterministes (`verifica_i_aplica.py`) i tancar les migracions SQL pendents en un sol lot atòmic.
  - **Afrontar (A):** Mantenir prohibició de *lookbehind* i `oklch()` cru per a WebKit antic i reforçar la cua offline encadenada (`cuaOperacionsOffline.js`).
  - **Mantenir (F):** Blindar el sostre sagrat de `250.000 B gzip-9` amb `lazyRoute()` obligatori per a tot visor pesant (Leaflet, visors 3D, apps).
  - **Explotar (O):** Presentar l'arquitectura Model B + Fediversity a NLnet NGI0 Commons com a cas real d'infraestructura pública digital rural.

##### 2. DAFO + CAME de Producte, Disseny Pedra Seca i Usabilitat Rural
- **Debilitats:** Densitat de conceptes (Mur, Pàgines, Plugins, Bloc de Notes, Mapa) que pot desorientar una persona usuària novella en el primer minut si no hi ha un camí evident.
- **Amenaces:** Competència d'hàbit amb WhatsApp i Facebook als pobles, on la informació és immediata però s'enterra i es perd en 48 hores.
- **Fortaleses:** Sistema de Disseny Pedra Seca amb ràtios WCAG 2.2 AAA reals (`>= 7:1`), botons tàctils `>= 44/58 px`, estetització pròpia (Ibáñez/Berlanga + rigor CIEF) i eines pràctiques úniques (`Avisador · Batec de Vida`, `El Bar`, `La Nevera`, `Genealogia`).
- **Oportunitats:** Absència total d'eines digitals pensades per a l'envelliment digne al poble i per a la catalogació participativa amb un sol toc.
- **CAME de Producte:**
  - **Corregir (D):** Unificar totes les llistes de Columna 2 amb `DefaultItemCard` (`.sdp-gestor-fitxa`, `P0-115`) i posar exemples vius com `PublicarMapaShowcase` (`P0-110`) abans de demanar cap acció.
  - **Afrontar (A):** No competir amb WhatsApp com a xat efímer, sinó integrar compartició instantània cap a WhatsApp amb targetes OpenGraph impecables que retornen al patrimoni permanent de `Sóc de Poble`.
  - **Mantenir (F):** Preservar les lleis dures de `tractor-pedra-seca.mjs` (`LLEI_03` zero color inline, `LLEI_04` mida tàctil, `LLEI_07` paritat pentalingüe).
  - **Explotar (O):** Desplegar l'`Avisador · Batec de Vida` i l'`Arbre Genealògic` com a portes d'entrada afectives de les famílies rurals.

##### 3. DAFO + CAME de Comunitat, Empatia Rural i Adopció Intergeneracional
- **Debilitats:** Risc inicial de ser percebut com un projecte molt vinculat a una sola persona impulsora si no es multiplica aviat la xarxa d'editors d'associacions.
- **Amenaces:** Bretxa digital i desconfiança legítima de les associacions locals quan altres plataformes els han absorbit el treball sense citar-ne l'autoria.
- **Fortaleses:** Llei Sagrada d'Autoria de Dos Nivells (`P0-111` + `P0-115`): protagonisme íntegre per a `Associació El Rentonar`, `Pedro Ferrer Rodríguez` i `Sangonereta`, generant confiança moral immediata.
- **Oportunitats:** Teixit associatiu viu a les comarques de muntanya (centres excursionistes, cronistes, AMPA, comissions de festes, col·lectius agroecològics).
- **CAME Comunitari:**
  - **Corregir (D):** Activar la moderació delegada segura amb `revisionsEditorialsWp` (`P0-111`) per anar obrint els 423 articles històrics amb acompanyament comunitari.
  - **Afrontar (A):** Garantir per contracte editorial visible (`COPYRIGHT_RENTONAR_ARBRES`, barra taronja i avatar propi) que cada associació conserva sempre el nom, la llicència i l'exportació completa del seu fons.
  - **Mantenir (F):** Continuar amb el to humà, clar i en valencià viu amb *trellat* i respecte escrupolós per la toponímia i els malnoms.
  - **Explotar (O):** Organitzar presentacions presencials a La Torre amb El Rentonar com a cas d'èxit real i replicable per a associacions de pobles veïns.

##### 4. DAFO + CAME Econòmic i de Sostenibilitat Sense Paywalls
- **Debilitats:** Renúncia voluntària i ètica (`P0-113`) a subscripcions SaaS bloquejants, comissions per transacció i publicitat programàtica.
- **Amenaces:** Cicles electorals municipals que poden retardar pagaments o renovacions de convenis públics si es depén d'un sol ajuntament.
- **Fortaleses:** Cost marginal d'infraestructura extremadament baix gràcies a l'arquitectura estàtica + IndexedDB local + pressupost estricte de dades i imatges `.webp` optimitzades.
- **Oportunitats:** Diversificació en 6 fonts complementaries fora del codi (`10 €/any` comerços, convenis menors `< 3.000 €` a múltiples municipis, beques NLnet/NGI0, tallers LEADER i custòdia associativa).
- **CAME Econòmic:**
  - **Corregir (D):** Separar amb claredat meridiana a `/projecte` i als dossiers institucionals que el programari és 100% gratuït i lliure, i el que es remunera és el treball humà d'acompanyament, digitalització i custòdia.
  - **Afrontar (A):** Cap font individual ha de superar el `30%` dels ingressos anuals; combinar des del minut 1 micro-aportacions privades (`10 €/any`), 5–10 convenis menors plurimunicipals i fons europeus.
  - **Mantenir (F):** Zero servidors superflus en núvol per a còmput que pot córrer al dispositiu del veí o al Node 0 local.
  - **Explotar (O):** Preparar paquet tancat de memòria tècnica per a ajuntaments menors de 5.000 habitants (subvencions Diputació d'Alacant / València de modernització i patrimoni).

##### 5. DAFO + CAME Jurídic, RGPD Zero-PII i Governança Institucional
- **Debilitats:** Necessitat de revisar un per un els drets d'imatge i autoria dels **423 articles pendents** abans de passar-los de `pendent_admin` a públic.
- **Amenaces:** Risc RGPD en eines amb dades sensibles (salut de l'Avisador o persones vives a l'Arbre Genealògic) o ús indegut de marques.
- **Fortaleses:** Aïllament estricte `dadesPersonals: 'salut' | 'financeres'` amb guarda `amaDelDocument` (prohibit incrustar en iframes externs), filtratge automàtic de persones vives en exportacions GEDCOM (`llavorPrivada.js`, `vius.js`) i 423 articles blindats per defecte en `pendent_admin`.
- **Oportunitats:** Alineació exemplar amb el Reglament Europeu de Dades (Data Act), RGPD *Privacy by Design* i la Llei 4/2006 de Patrimoni Arbori Monumental de la Generalitat Valenciana.
- **CAME Jurídic:**
  - **Corregir (D):** Utilitzar la nova taula `revisions_editorials_wp` (amb traça d'`updated_by`, `updated_at` i `notes_revisio`) com a registre auditable d'alliberament progressiu dels 423 articles.
  - **Afrontar (A):** Mantenir zero enviament a servidor de dades de `/app/salut`, `/app/genealogia` i `/app/gestoria`, conservant tota l'avaluació en l'IndexedDB del dispositiu.
  - **Mantenir (F):** Exigir `superadmin` + `aal2` (doble factor criptogràfic) en tota escriptura administrativa a Supabase.
  - **Explotar (O):** Posicionar `Sóc de Poble` davant secretaris i interventors municipals com l'opció de menor risc RGPD del mercat perquè l'ajuntament no acumula bases de dades personals innecessàries.

#### Síntesi de les Matrius Afegides a `03_llibre_mestre_tasques_i_idees.md` (Sense Truncament)

- **Integritat verificada al bit:** Els primers `542.484 B` (545 línies originals) de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` conserven exactament el mateix `SHA-256` previ (`1d1ab3b3e109809de4588d73df702b129100bf9a33a93cac2c90c9e91428ca4a`); el document ampliat arriba a **891 línies** (`SHA-256 nou: d7d1f3e410295cadcf7307fbf4f475f15db934fc321bc73eaccfba8959cdcfe8`).
- **Cobertura total (`149 / 149` ítems oberts classificats):**
  - **Matriu 1 · Importància × Urgència (Eisenhower):** `Q1` (Important i Urgent: **31 ítems**), `Q2` (Important i No Urgent / Estratègic: **36 ítems**), `Q3` ( Tàctic / Delegable per lots: **68 ítems**), `Q4` (Congelat / Baixa prioritat: **14 ítems**).
  - **Matriu 2 · Impacte × Viabilitat:** `Tram A` (Alt Impacte + Alta Viabilitat, victòries immediates post-R18), `Tram B` (Alt Impacte + Viabilitat Mitjana, apostes a 3–12 mesos), `Tram C` (Millores incrementals d'alta viabilitat) i `Tram D` (Recerca futura o costos externs).
- **8 Noves Idees Incorporades (`IDEA-249` .. `IDEA-256`):** Kit de Conveni Municipal Menor Patrimonial (`IDEA-249`), Mode Kiosc Tàctil per a Ajuntaments i Casals (`IDEA-250`), Quadern Escolar Intergeneracional «Els Malnoms i els Arbres» (`IDEA-251`), Passaport QR Pedra Seca per a Comerços `10 €/any` (`IDEA-252`), Validador Automàtic Frictionless Data v2.0 en CI (`IDEA-253`), Sincronització CAS amb `updated_at` per a Moderació Cooperativa (`IDEA-254`), Exportador PDF Editorial A4 del Catàleg Municipal d'Arbres (`IDEA-255`) i Candidatura Tècnica NLnet NGI0 Commons (`IDEA-256`).

---

### T4 · Conversa Viva de 4 Rondes amb les 8 Escoles del Node 0 i Contrast Creuat amb Claude i Codex

#### Telemetria Verificada de les 4 Rondes contra `http://192.168.0.23:11434` (`16/16` Respostes Útils `>= 120` Caràcters)

- **Evidència JSON Ronda 1:** `scratch/node0_ronda1_results.json` (`SHA-256: 3a70f61492af93b1d68ebc3a4728e07b745de205561cdc03f29efa044d78fd0e`).
- **Evidència JSON Rondes 2, 3 i 4:** `scratch/node0_rondes_2_3_4_results.json` (`SHA-256: b84e698d0883c5da37f04982744e969e729ddeabb8e2e2e5195633c82c3ed10c`).

| Ronda | Escola / Model Ollama (Mac mini M4) | Durada | Caràcters Nets | Aportació Clau i Resposta Crítica de Gemini Carbon |
| --- | --- | --- | --- | --- |
| R1 | `qwen2.5-coder:14b` | `128,47 s` | `3.350` | Proposà esquema `SERIAL` i rol `editorial` amb import directe de Supabase; **refutat en R2** amb `UUID/TEXT`, `superadmin + aal2` i frontera `backendPort.js`. |
| R1 | `phi4:14b` | `92,12 s` | `2.980` | Definí invariants formals per al corpus 443 (`20 + 423 = 443`), coordenades WGS84 acotades al terme de La Torre i idempotència d'hidratació. |
| R1 | `gemma3:12b` | `103,34 s` | `3.576` | Analitzà jerarquia de 3 pisos a `SquareBadge` i suggerí comprovar contrast exacte de `#0e662e`. |
| R1 | `iaia-maria:latest` | `65,47 s` | `2.322` | Formulà el principi ètic: apropiar-se de la faena d'El Rentonar trencaria el pacte moral del poble; Sóc de Poble és la plaça que acull, mai el propietari del saber aliè. |
| R1 | `mistral-nemo:12b` | `72,70 s` | `3.700` | Aportà base estructural per al DAFO+CAME financer i institucional (diversificació municipal + fons europeus). |
| R1 | `hermes3:8b` | `34,15 s` | `2.279` | Alertà sobre pèrdua de context històric, dates i atribucions en migrar d'un WordPress antic a una SPA moderna. |
| R2 | `deepseek-r1:14b` | `78,97 s` | `874` | Validà que un rol `editorial` sense control AAL2 obriria escalada de privilegis i exigí verificar regressió del reemplaçament del *lookbehind*. |
| R2 | `glm4:9b` | `39,05 s` | `1.869` | Auditava i aprovà `P0-115` (2 nivells d'autoria) i `P0-116` (eliminació de `border-left: 3px` i `--sdp-filet-actiu-interior` clar/fosc). |
| R2 | `qwen2.5-coder:14b` | `94,18 s` | `3.029` | Acceptà la correcció de `backendPort.js` i dels 20 IDs reals (`#619..#2014`) i aportà millora valuosa: **risc de cursa (`race condition`)** entre `localStorage` i servidor resoluble amb `updated_at` / CAS (`IDEA-254`). |
| R2 | `gemma3:12b` | `102,27 s` | `3.528` | Calculà `L1 / L2 = 10:1` ometent el `+ 0,05` de WCAG 2.x; **corregit matemàticament per Carbon**: amb `L_verd = 0,09084`, `(1,0 + 0,05) / (0,09084 + 0,05) = 7,0978:1` (`7,10:1` AAA real). |
| R3 | `iaia-maria:latest` | `70,80 s` | `2.118` | Validà `P0-113` i el model de `10 €/any` clau en mà fora del codi: «tecnologia com a dret i bé comú en proves, mai com a privilegi». |
| R3 | `mistral-nemo:12b` | `39,81 s` | `1.917` | Revisà l'escalabilitat de les 7 sèries biblioteconòmiques PMEST/ISAD(G) per a 50 ajuntaments de la Muntanya d'Alacant. |
| R3 | `phi4:14b` | `93,00 s` | `3.316` | Auditava vectors d'importació WXR/Blogger i GEDCOM (`MIDA_MAXIMA_IMPORTACIO`, sanització d'etiquetes i xifrat local opcional). |
| R3 | `hermes3:8b` | `33,10 s` | `2.133` | Simulació empàtica d'una veïna de 78 anys a `375 px`: confirmà la importància que `SquareBadge` siga `128×128 px` (molt superior al mínim de `44 px`) i d'evitar formularis complexos. |
| R4 | `deepseek-r1:14b` | `112,53 s` | `1.863` | Dictamen col·legiat favorable d'excel·lència sobre el Kit CAS i priorització post-deploy: curació progressiva dels 423 ítems pendents i blindatge continu WebKit/iOS. |
| R4 | `iaia-maria:latest` | `65,58 s` | `2.052` | Cloenda sota l'Olivera projectant el pacte intergeneracional a 1, 3 i 5 anys: «un pou de la neu digital on cada arbre, malnom i memòria és patrimoni comú». |

#### Contrast Creuat amb `Claude` (`261111_0206_auditoria_claude.md`) i `Codex` (`261111_0205_auditoria_codex.md`)

1. **Complementarietat 100% amb Claude (`R18a`):**
   - Claude ha culminat a l'arbre viu els **60 fitxers** de `/app/genealogia`, la migració de l'Avisador a `/app/salut`, l'obertura de les apps gratuïtes (`P0-113`/`P0-114`) i les proves de `P0-115` (`AutoriaDosNivellsArbres.test.jsx`, `Columna2Canonica.test.jsx`), però documentava a `0206` que no havia pogut executar `P0-107`..`P0-111` ni tancar el cens de les imatges noves (`censImatges.test.js`).
   - El nostre Kit CAS de Carbon ha absorbit en el seu clon els 60 fitxers de Claude, ha verificat que `AutoriaDosNivellsArbres.test.jsx`, `Columna2Canonica.test.jsx` i `AppGenealogia.test.jsx` passen juntament amb les nostres peces, ha reparat el `censImatges.test.js` (`16/16 PASS`) i ha resolt els 3 subarbres orfes de `P0-114` que aturaven `tractor-pedra-seca.mjs`.
2. **Complementarietat 100% amb Codex (`R18.2`):**
   - Codex (`0205` + `addendum_t4`) ha construït al seu kit la closca de 4 columnes del Catàleg d'Arbres (`242.864 B gzip-9`) deixant delegats `P0-109` i `P0-111` (corpus 443, 20 ítems d'El Rentonar i sincronització remota `revisioEditorialWp`), que queden íntegrament coberts i verificats al nostre Kit CAS.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Portes mecàniques executades i superades en verd (`exit 0`) al clon integrat `/private/tmp/sdp_r18_carbon_extreme`:**
  - `npm run lint` (`eslint src tooling scripts tests --max-warnings=0`): **`0 errors, 0 warnings`**.
  - `node tooling/gates/tractor-enxufe.mjs`: **`E1..E4` PASS**.
  - `node tooling/gates/tractor-fitxa-gestor.mjs`: **`F1..F9` PASS**.
  - `node tooling/brain/tractor-pedra-seca.mjs`: **`0` infraccions noves (`exit 0`)**.
  - `node tooling/gates/design_guard.mjs --arrel=src`: **PASS**.
  - `node tooling/gates/tractor-cens.mjs`: **PASS**.
  - `node tooling/gates/tractor-inline-styles.mjs`: **PASS**.
  - `node tooling/gates/01_porta_pedra_seca_58px.mjs`: **PASS**.
  - `node tooling/gates/tractor-adaptadors.mjs` i `tractor-rutes.mjs`: **PASS**.
  - `node tooling/gates/tractor-rls.mjs`: **`0` infraccions en 95 fitxers SQL**.
  - `node scripts/supabase/verifica-migracions.mjs`: **`0` errors en 90 migracions** (`2611110455_revisions_editorials_wp.sql` 100% repetible).
- **Suites Vitest verificades en verd (`0` fallades):** `SquareBadge.geo.test.jsx`, `PublicarMapaShowcase.test.jsx`, `revisioEditorialWp.rentonar.test.js`, `transformadorEditorialWpBlogger.test.js`, `censImatges.test.js` (`16/16`), `AutoriaDosNivellsArbres.test.jsx`, `Columna2Canonica.test.jsx`, `AppGenealogia.test.jsx`, `privacitat.test.js`, `kit.test.js` (`144/144`), `adaptadorLocal.test.js` (`45/45`), `pageContent.fediversity.test.js` (`42/42`), `pageContent.r10.test.js` (`28/28`), `arbresMonumentals2020.test.jsx`, `PageDetailSection.patrimoniR9.test.jsx`, `CatalegWorkspace.moderacio.test.jsx`, `CatalegWorkspace.destinsIFocus.test.jsx`, `ReceptesWorkspaceSection.test.jsx`, `articlesImportatsMandros.test.js`, `WorkspacesMultiLlibreR17.test.jsx`, `LaboratoriTaxonomiaDoctoral.test.jsx`.
- **Build de producció i pressupost del Nucli Verge:** `npm run build` completat en verd; `dist/assets/index-TmlYdVp0.js` = **`244382 B gzip-9`** (`<= 250.000 B`, marge `+5618 B`).
- **Higiene de l'arbre viu `socdepoble.org` i Porta Olivera:** Zero mutacions sobre `src/`, `tooling/`, `public/`, `supabase/` o `.agents/` a `socdepoble.org`; `node tooling/gates/porta-olivera.mjs` verificat amb **`exit 0`**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Aplicació física sobre l'arbre viu:** Complint estrictament la regla d'aïllament de `R18-EXTREME`, totes les millores de codi es lliuren verificades dins del Kit CAS `../_investigacio_ia_de_poble/261111_kit_carbon_r18_extreme_gauntlet_i_futur/` (`verifica_i_aplica.py --sec` = `82/82` preimatges exactes sobre `socdepoble.org`). L'aplicació amb `--aplica` i la reconciliació final amb el kit `R18.2` de Codex corresponen al torn d'integració matinal de MarIA / el Mestre.
- **Migració remota Supabase:** La migració `supabase/migrations/2611110455_revisions_editorials_wp.sql` està verificada localment però no s'ha executat contra Supabase Producció durant la finestra nocturna; mentre la bandera `VITE_SDP_REVISIONS_EDITORIALS_WP` no s'active en producció després d'aplicar l'SQL, el sistema degrada netament i sense errors a l'emmagatzematge local.
- **Esborrat definitiu de 3 fitxers substituïts per `P0-114`:** `src/apps/genealogia/nucli/magatzem.js`, `src/components/salut/BatecDeVidaCard.jsx` i `src/services/batecDeVidaMonitor.js` queden registrats a `EXCEPCIONS_ORFE` respectant `AGENTS.md §5` fins que el Mestre n'autoritze la retirada física.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../90_arxiu_historic/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres|261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres]]
- [[../90_arxiu_historic/261111_0313_prompt_gemini_carbon_auditoria_extrema_4x_gauntlet_futur_dafo_i_node0|261111_0313_prompt_gemini_carbon_auditoria_extrema_4x_gauntlet_futur_dafo_i_node0]]
- [[261111_0206_auditoria_claude]]
- [[261111_0205_auditoria_codex]]
- [[../90_arxiu_historic/261111_0242_auditoria_gemini_carbon|261111_0242_auditoria_gemini_carbon]]
- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]
