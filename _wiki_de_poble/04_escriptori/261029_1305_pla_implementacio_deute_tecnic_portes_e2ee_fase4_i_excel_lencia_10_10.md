---
type: document
status: actiu
description: Pla mestre per a liquidar el deute tècnic de portes, actius R-02/OG-02/D-C2 i Fase 4 d'E2EE després de feaaf0e07 fins al 10,0/10 unànime.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:ed8e809e-cef3-43fa-b73a-7ae87a2d465a
---
# Pla d'Implementació 261029_1305 · Liquidació del Deute Tècnic de Portes, Actius Multimèdia i Fase 4 d'E2EE (10,0/10 Unànime)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1:ed8e809e-cef3-43fa-b73a-7ae87a2d465a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T12:05:13.242Z |
| Modificació | 2026-10-29T12:06:30.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 3.1 Pro (High) |
| Tokens consumits | ~18.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-29T12:05:13.242Z`: Esborrany creat després de la marató nocturna de 10 cicles i el tancament al commit `feaaf0e07` (24.461 Vitest + 1.436 Node en verd, `socdepoble.zip` v1.1.9 regenerat i canal de previsualització de Firebase Hosting actiu).
- `2026-10-29T12:06:30.000Z`: Pla estructurat en 4 blocs amb matriu d'exclusivitat de carrils per a **Claude Code (`Fable 5.1 Extra · Ultracode`)**, **Gemini CLI** i **GPT Codex** amb objectiu de tancar tot el deute tècnic heretat fins al **`10,0 / 10` unànime** de les tres IAs.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Estat de Partida (`HEAD = feaaf0e07`)

La marató nocturna (`261029_0216`) va culminar amb:
- **Commit `feaaf0e07`** pujat a `fork/backup-notes-publish` (`243` fitxers, `+24.298 / -765` línies), amb **4.181 proves Vitest + 262 Node de precommit (`0` fallades)**, **ESLint `0/0`** i bateria completa (**24.461 proves Vitest + 1.436 proves Node en verd**).
- **Paquet WordPress.org v1.1.9 net (`_builds_de_poble/wordpress/socdepoble.zip`)**: `3.336.867 B`, SHA-256 `89b3125f0081c46beecfd00409d108f7da30aa02aa2ebbf1b5b9dc7873f33a02`, 45 entrades, `84/84` proves d'enxufe i `120/120` proves PHP en verd.
- **Canal de previsualització Firebase Hosting actiu**: `https://soc-de-poble--tancament-feaaf0e07-xmpk60bs.web.app` (versió `72d8e26a29177ed4`, caduca el `2026-11-05`).
- **Qualificació actual del Trio**:
  - **Gemini CLI**: **`10,0 / 10`** en les 10 dimensions.
  - **Claude Code**: **`9,45 / 10`** en local verificat (amb el deute heretat documentat a la secció `Límits` del seu informe `261029_0350`).
  - **GPT Codex**: **`8,89 / 10`** en el Cicle 10 (`261029_0340` i acta `261029_0838`), amb les observacions exactes de portes, actius i Fase 4 d'E2EE pendents.

---

### 2. Els 4 Blocs de Deute Tècnic per al `10,0 / 10` Unànime

#### Bloc A · Portes de Governança, Índexs i Saneig de `design_guard` (Carrils `G1`, `G2`, `G3`)

1. **`G1 · Reconciliació del pegat `0838` `T11` de Codex i Portes de Tractor (`tractor-arrel`, `tractor-rls`, `llaurador_indexs`, `desenterrar`)`**:
   - Integrar de manera neta el contingut pendent de `_wiki_de_poble/90_arxiu_historic/261029_0838_solucio_t11_codex.patch` respectant la làpida de seguretat `SG-02` en `scripts/generate-prompt.sh`:
     - **`C10-T11-BLOC`**: En `tooling/wiki/llaurador_indexs.mjs`, preservar blocs gestionats (`<!-- INICI:BLOC_GESTIONAT ... -->` .. `<!-- FI:BLOC_GESTIONAT -->`) durant `talla()` perquè cap regeneració de l'índex trunqui taules vives, amb `tests/llaurador-managed-region.test.mjs` (`32/32`).
     - **`C9-T11-PROSA` / `C9-T11-LOCAL` / `C9-T11-A4`**: En `tooling/wiki/core/parse.mjs` i `tooling/gates/tractor-arrel.mjs` (+ `tests/t11-gate-prose.test.mjs`), ignorar prosa històrica en cites/codi mentre es mantenen les portes en verd.
     - **`C9-T11-LEGACY` i `C10-T11-RESTAURACIO`**: Alinear `tooling/scripts/desenterrar.mjs`, `tooling/brain/desenterrar.mjs` i `.claude/skills/core-restauracio-segellada/SKILL.md` (+ `.agents/skills/core-restauracio-segellada/SKILL.md`) amb `tests/t11-legacy-restoration.test.mjs` i `tests/t11-legacy-prompt.test.mjs`.
     - **`C9-T11-RLS`**: Integrar la validació DDL de `tooling/gates/tractor-rls.mjs` + `tests/tractor-rls-r2-ddl.test.mjs`.

2. **`G2 · Liquidació de `tractor-cens.mjs` (`C2=0`, `C4=0`) i `tractor-frontmatter.mjs` (`F9=0`)`**:
   - Corregir els **2 documents amb `C2`** (menció al Consell sense tots els membres canònics) i els **6 avisos `C4`** (xifres antigues «3 IAs», «4 IAs», «11 IAs») perquè `node tooling/gates/tractor-cens.mjs` retorne `C2=0, C4=0`.
   - Sanejar les **138 incidències `F9`** de `tractor-frontmatter.mjs` i abaixar el sostre permés de `190` a `0` (o al mínim estricte justificat d'arxiu).

3. **`G3 · Liquidació dels 37 crítics heretats de `design_guard.mjs --arrel=src`**:
   - Corregir els 2 falsos positius d'entitats HTML (`&#160;` i `&#173;`) a `src/utils/perAppNativa.js` (emprant escapes Unicode `\u00A0` i `\u00AD` o ajustant la regla quan siga una constant de taula de conversió).
   - Corregir les 6 aparicions d'identitat NOVA en fitxers de test amb `<h1>` i les 29 incidències restants de `design_guard.mjs --arrel=src` fins que `node tooling/design/design_guard.mjs --arrel=src` retorne **`0 crítics`**.

---

#### Bloc B · Deute Multimèdia (`R-02`), OpenGraph (`OG-02`) i Icones Natives (`D-C2`) (Carril `M1`)

1. **`M1.1 · `OG-02` (7 `og:image` de llavor a ràtio exacte `1200×630`)`**:
   - Generar i enllaçar variants socials `1200×630` (`<= 300 KB`, JPEG real sense EXIF/GPS) per als 7 actius de llavor restants:
     - `public/assets/brain/generations/aplec_2023_cartell.jpg` (apuntar les referències socials a la variant `1200×630`).
     - `public/assets/cultura/vinyetes/el-rentonar/vinyeta-01.jpg` i `vinyeta-02.jpg`.
     - Les 4 portades de pobles (`la-torre-de-les-macanes`, ` Benifallim`, `Penàguila`, `Tibi` / `Relleu` segons manifest social).
   - Verificar que `tooling/seo/build-social-manifest.mjs` i els tests de `socialImages.test.js` exigeixen `1200×630` en el 100% d'`og:image`.

2. **`M1.2 · `R-02` Global (Fitxers `.png` amb bytes JPEG dins de `public/assets/`)`**:
   - Auditar els fitxers `.png` de `public/assets/` que contenen capçalera binària JPEG (`FF D8 FF`) i re-codificar-los com a PNG real (o migrar-ne les referències i el fitxer al format autèntic sense trencar cap URL pública ni cap manifest), afegint una prova de contracte que impedisca nous `.png` amb màgia JPEG.

3. **`M1.3 · `D-C2` (Icones natives `AppIcon` i `Splash` amb verd AAA `#0e662e`)`**:
   - Regenerar les icones natives i pantalles d'arrencada (`ios/` i `android/` / actius base) substituint el verd antic `#0F672F` pel verd AAA `#0e662e`, i actualitzar `src/config/projecteIos.test.js` perquè verifique directament `#0e662e` sense excepció de retard.

4. **`M1.4 · Salt de versió del connector WordPress de `1.1.9` a `1.1.10` (`socdepoble.zip` v1.1.10)`**:
   - Per ordre expressa del Mestre Javi (per distingir visualment la nova versió en **Gent de La Torre** i en **WordPress.org Developers**, i per invalidar automàticament la memòria cau `?ver=1.1.10` de SiteGround i del navegador), pujar la versió del connector a **`1.1.10`** en:
     - `wordpress-plugin/socdepoble-enxufe.php` (`Version: 1.1.10` i `const SOCDEPOBLE_ENXUFE_VERSIO = '1.1.10';`)
     - `wordpress-plugin/readme.txt` (`Stable tag: 1.1.10` i entrada `= 1.1.10 =` al Changelog)
   - Recompilar `SDP_RELEASE=1 SDP_VERSIO=1.1.10 npm run build:wp:directori` i empaquetar `_builds_de_poble/wordpress/socdepoble.zip` i `261029_HHMM_wordpress_directori_v1.1.10.zip` des de l'arbre net commitejat.

---

#### Bloc C · `P1-12` (Xat E2EE) Fase 4: Pipeline Extrem a Extrem, Adjunts Xifrats i `D-09` (`OBLIT_FALLIT`) (Carril `E1`)

1. **`E1.1 · Pipeline d'enviament/recepció xifrada i drenatge de cua `F7`**:
   - Completar la integració entre `serveiXifratXat.js`, `ambXifratXat.js` i `XatContext.jsx` (sempre governat per la bandera `E2EE_ACTIU_PER_DEFECTE = false` quan no s'activa explícitament en proves o configuració) perquè:
     - Els missatges enviats amb xifratge actiu viatgen amb sobre `SDPH` (`87 B`) i es desxifren en recepció i en historial.
     - La cua `F7` drene de manera ordenada quan es desbloqueja el magatzem de claus.
2. **`E1.2 · Xifratge d'adjunts (`xatMultimediaXifrat.js`)`**:
   - Crear `src/services/xat/xatMultimediaXifrat.js` (amb el seu test `.seguretat.test.js`) per xifrar/desxifrar blobs multimèdia amb AES-256-GCM abans de pujar-los al bucket privat `xat-adjunts-privats` i verificar-ne el hash SHA-256.
3. **`E1.3 · `D-09` (`OBLIT_FALLIT` i esborrat persistent complet)**:
   - Garantir que `destruirIdentitatLocal()` en `clausUsuari.js` i el flux d'eixida/oblit de `XatContext` netegen claus en memòria, IndexedDB, sessió i preferències, i exposen l'estat explícit `OBLIT_FALLIT` si el navegador bloqueja `deleteDatabase`, sense degradació silenciosa.
4. **`E1.4 · Cobertura en `test:precommit`**:
   - Assegurar que la prova de seguretat amb bandera apagada (`host.xifrat.apagat`) forme part del patró executat per `npm run test:precommit` (`src/**/*.seguretat.test.*`).

---

#### Bloc D · Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura)

| Agent | Carril i Responsabilitat Principal | Fitxers amb Dret Exclusiu d'Escriptura |
| --- | --- | --- |
| **Claude Code (`Fable 5.1 Extra · Ultracode`)** | **Carril `E1` + `M1` (Fase 4 E2EE, Actius `OG-02`/`R-02`/`D-C2` i Integració Final)** | `src/services/xat/**`, `src/sections/xat/**`, `src/config/socialImages*`, `src/config/projecteIos.test.js`, `public/assets/**`, `ios/**`, `android/**`, `tooling/seo/**`, `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_claude.md` |
| **Gemini CLI** | **Carril `G2` + `G3` (`design_guard` a 0, `tractor-cens` C2/C4 a 0 i `tractor-frontmatter` F9 a 0)** | `src/utils/perAppNativa.js`, fitxers de test/UI assenyalats per `design_guard.mjs`, documents de `_wiki_de_poble/**` assenyalats per `tractor-cens.mjs` i `tractor-frontmatter.mjs`, `tooling/gates/tractor-frontmatter.mjs`, `tooling/gates/tractor-cens.mjs`, `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md` |
| **GPT Codex** | **Carril `G1` + QA Adversarial (Reconciliació `0838` `T11`, `llaurador_indexs`, `tractor-arrel`, `tractor-rls`, `desenterrar` i Verificació Independent 10 Dimensions)** | `tooling/wiki/llaurador_indexs.mjs`, `tooling/wiki/core/parse.mjs`, `tooling/gates/tractor-arrel.mjs`, `tooling/gates/tractor-rls.mjs`, `tooling/scripts/desenterrar.mjs`, `tooling/brain/desenterrar.mjs`, `.claude/skills/core-restauracio-segellada/SKILL.md`, `.agents/skills/core-restauracio-segellada/SKILL.md`, `tests/llaurador-managed-region.test.mjs`, `tests/t11-*.test.mjs`, `tests/tractor-rls-r2-ddl.test.mjs`, `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md` |

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Abans d'emetre el veredicte final de **`10,0 / 10`**, cada agent verificarà en el seu informe d'auditoria l'eixida exacta (`exit 0`) de:
1. `npm run test:precommit` i `npx eslint . --max-warnings=0`
2. `node tooling/design/design_guard.mjs --arrel=src` (`0` crítics)
3. `node tooling/gates/tractor-cens.mjs` (`0` errors, `C2=0`, `C4=0`)
4. `node tooling/gates/tractor-frontmatter.mjs` (`0` errors, `F9=0`)
5. `node tooling/gates/tractor-arrel.mjs` i `node tooling/gates/tractor-rls.mjs` (`0` errors)
6. `node tooling/gates/porta-olivera.mjs`, `node tooling/gates/verificador-scc.mjs`, `node tooling/gates/porta-plantilles.mjs`, `node tooling/gates/porta-taxonomia.mjs --paritat` i `node tooling/gates/segella.mjs --check`
7. `npx vitest run src/services/xat/ src/sections/xat/` (`100%` en verd amb `E2EE_ACTIU_PER_DEFECTE = false` per defecte i proves de Fase 4 en verd).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Risc de col·lisió en `.agents/SKILLS_SEAL.json` quan s'edita una skill (`core-restauracio-segellada`)**:
   - **Mitigació**: Només GPT Codex toca `.claude/skills/core-restauracio-segellada/SKILL.md` i `.agents/skills/core-restauracio-segellada/SKILL.md`, i executa `node tooling/gates/segella.mjs` en tancar el seu carril `G1`.
2. **Risc d'activar accidentalment l'E2EE en producció abans de les migracions SQL**:
   - **Mitigació**: `E2EE_ACTIU_PER_DEFECTE` es manté estrictament a `false` en `src/services/xat/configXifrat.js`; les proves de la Fase 4 injecten la configuració activa per paràmetre o context de test, i la prova `XatContext.xifratApagat.seguretat.test.jsx` bloqueja el precommit si la bandera per defecte canvia.
3. **Risc de trencar enllaços d'actius en corregir `R-02` (`.png` amb bytes JPEG)**:
   - **Mitigació**: Re-codificar els fitxers `.png` afectats a PNG real conservant el mateix camí i nom de fitxer, de manera que cap URL ni referència es trenque.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10]]
- [[../90_arxiu_historic/261029_0350_auditoria_claude]]
- [[../90_arxiu_historic/261029_0340_auditoria_codex]]
- [[../90_arxiu_historic/261029_0336_auditoria_gemini]]
- [[../10_actes/261029_0838_acta_marmota_qa_codex_10_cicles]]
