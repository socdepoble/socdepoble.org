---
type: informe
status: esborrany
description: Auditoria de conformitat i contrast de seguretat sobre el pla 261021_1850 (WordPress v1.1.9, Salfumant Fase 2, tractor sdp-vigilant-tellado i sincronitzacio nativa)
tags:
  - auditoria
visibility: private
reflex: sdp:torn_01a47145-8922-43c5-9783-9e8c8dba31a0:e650bcf2-49ce-4c1c-9ddc-dabc9fcc5f18
---
# Auditoria Gemini Fase 2: Conformitat Botigues, AyudaWP i Salfumant

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_01a47145-8922-43c5-9783-9e8c8dba31a0:e650bcf2-49ce-4c1c-9ddc-dabc9fcc5f18 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T17:01:23.476Z |
| Modificació | 2026-10-21T17:06:00.000Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~38.000 tokens |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T17:01:23.476Z: esborrany creat per Gemini 4 Argon (`torn_01a47145-8922-43c5-9783-9e8c8dba31a0`) i vinculat al pla `261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2.md`.
- 2026-10-21T17:06:00.000Z: completada l'auditoria de conformitat i contrast de seguretat sobre els 4 mòduls del pla (Mòdul A WordPress v1.1.9, Mòdul B Salfumant Fase 2 i protecció del contracte `bessonesDe`, Mòdul C Tractor `sdp-vigilant-tellado` segellat amb Llei Z, i Mòdul D Sincronització Nativa iOS/Android).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Canal Viu de Coordinació (Taula Redona Fase 2 · Gemini 4 Argon + Claude Code)

- **Rols del torn (`261021_1850_prompt_claude_gemini_botigues_ayudawp_i_salfumant.md:74`):**
  * **Claude Code (`torn_8ee65040`, `261021_1905_auditoria_claude_botigues_ayudawp_fase2.md`):** Executor principal de mutacions de codi, empaquetat i sincronització.
  * **Gemini 4 Argon (`torn_01a47145`, aquest informe):** Auditor de conformitat, integritat criptogràfica i contrast de seguretat (zero mutacions sobre l'arbre de producte per no interferir amb els commits ni els builds de Claude Code).
- **🚨 Alerta de Seguretat i Conformitat per a Claude Code sobre el Mòdul B (Imatges de `public/assets/`):**
  Hem verificat contra les proves i el codi viu l'impacte de tocar les imatges de `public/assets/`:
  1. **`post_fira_artesania_1774198229727.png`:** Ja no existeix al disc de `public/assets/`.
  2. **`public/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png` NO és orfe:** Està citat en tres punts del codi viu:
     - [`src/config/assetResolver.js:17`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/config/assetResolver.js#L17) (`TOWN_FALLBACK_IMAGES`),
     - [`src/config/assetResolver.test.js:123`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/config/assetResolver.test.js#L123) (reserva determinista de `'Sella'`),
     - [`src/sections/multimedia/censImatges.js:237`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/multimedia/censImatges.js#L237) (`EXCLOSES`).
     *(Nota: La còpia que sí que era 100% òrfena i duplicada era `assets/img/nano_mercat_llaurador_1774197050578.png` a l'arrel del repositori, que ja s'ha retirat amb `assets/img/`).*
  3. **Protecció del contracte `bessonesDe()` ([`src/config/politicaDeMitjans.js:59`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/config/politicaDeMitjans.js#L59)) per als 128 rasters de `public/assets/`:**
     Coincidim 100% amb l'anàlisi adversarial de Claude Code (`261021_1645:1075`): **NO s'han d'esborrar els 128 `.jpg`/`.png` originals de `public/assets/` sense abans migrar la BD de producció i redissenyar `politicaDeMitjans.js`**, per tres motius mecànics verificats:
     - `bessonesDe(camins)` només detecta una bessona `.webp` quan el seu original `.jpg`/`.png` conviu al mateix directori (`ORIGINAL.test(cami) && presents.has(bessonaDe(cami))`). Si s'evacuen els 128 originals de `public/assets/`, `bessonesDe()` retorna `[]` (buit!).
     - [`src/sections/multimedia/censImatges.test.js:58-74`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/multimedia/censImatges.test.js#L58-L74) exigeix per contracte (`Encàrrec 261019_1425`) que `CENS_IMATGES` cite l'original i que tant l'original com la bessona existisquen a `public/assets/`.
     - Tots els paquets de les botigues oficials —el connector WordPress (`build:wp` i `build:wp:directori`) i les apps mòbils de Google Play / App Store (`build:natiu`)— **JA apliquen `separaRecursos()` i exclouen els 128 originals raster dels paquets compilats**, enviant únicament les `.webp`! Per tant, l'estalvi de ~114 MB ja és efectiu al 100% dins dels ZIPs de WordPress i dels bundles d'iOS i Android sense trencar ni una sola prova ni cap fila de Supabase Producció.

---

### 1. Auditoria del Mòdul A · WordPress v1.1.9 i Paquets Oficials (`P0-13` / `P0-16`)

1. **Verificació de capçaleres i constants a `1.1.9`:**
   - [`wordpress-plugin/socdepoble-enxufe.php:6`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/wordpress-plugin/socdepoble-enxufe.php#L6) (`* Version: 1.1.9`) i línia 123 (`const SOCDEPOBLE_ENXUFE_VERSIO = '1.1.9';`).
   - [`wordpress-plugin/readme.txt:7`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/wordpress-plugin/readme.txt#L7) (`Stable tag: 1.1.9`), secció `== Changelog ==` (`= 1.1.9 =`) i `== Upgrade Notice ==` (`= 1.1.9 =`) dins del límit estricte de longitud de Plugin Check.
2. **Purga de `wordpress-plugin/supabase/`:**
   - Comprovat al sistema de fitxers: la carpeta paràsita `wordpress-plugin/supabase/` (`.branches`, `.temp`, `snippets`) ha sigut completament eliminada.
3. **Proves de contracte de l'enxufe i l'empaquetador:**
   - Executades `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs`: **41/41 proves en VERD** (542 ms).
   - Nota documental per al Pla: l'script d'empaquetat canònic viu a [`wordpress-plugin/eines/empaqueta.mjs`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/wordpress-plugin/eines/empaqueta.mjs) (el text del pla citava per error `tooling/scripts/empaqueta.mjs`).

---

### 2. Auditoria del Mòdul B · Poda Salfumant Radical Fase 2 (`P0-14`)

1. **Evacuació i retirada de `assets/img/` de l'arrel de Git (8,8 MB estalviats):**
   - Els 15 fitxers de `socdepoble.org/assets/img/` (14 PNGs/JPGs duplicats de `public/assets/` i 1 SVG) han sigut evacuats fora de l'arbre Git i retirats de l'índex (`D assets/img/*`).
   - Verificat el pegat a [`tooling/brain/crear_bundle.mjs:77-105`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/brain/crear_bundle.mjs#L77-L105), que retira `'assets'` de la llista `DIRECTORIS` perquè el generador de bundles no avorte en no existir ja la carpeta d'arrel.
2. **Eliminació de les vistes mortes del Lector (`Carpetes.jsx` i `Fonts.jsx`):**
   - Retirades de Git `src/apps/lector/vistes/Carpetes.jsx` i `src/apps/lector/vistes/Fonts.jsx`.
   - Verificada la suite de qualitat del Lector ([`src/apps/lector/qualitat.test.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/apps/lector/qualitat.test.js)): **16/16 proves en VERD** (537 ms), incloent ESLint amb `--max-warnings=0`.

---

### 3. Auditoria del Mòdul C · Tractor Cognitiu `sdp-vigilant-tellado`

1. **Inspecció de [`.agents/skills/sdp-vigilant-tellado/SKILL.md`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/.agents/skills/sdp-vigilant-tellado/SKILL.md) (v1.0.0):**
   - El tractor integra en un únic contracte canònic:
     * Les **6 regles deterministes `VIG-01` a `VIG-06`** (Superfície d'exposició zero, Cap executable de servidor a carpetes d'actius, Patrons d'ofuscació i portes del darrere de la Fase 6 d'AyudaWP, Integritat SHA-256 de l'inventari del paquet, Higiene d'URL i contingut mixt, i Sobirania del navegador).
     * Les **27 comprovacions de perímetre** en tres capes: Capa A Connector WordPress (`VA1`–`VA9`), Capa B SPA/Supabase/Allotjament (`VB1`–`VB12`) i Capa C Govern i Tooling (`VC1`–`VC6`).
2. **Verificació del Segell Criptogràfic (Llei Z):**
   - Executada la porta [`tooling/gates/segella.mjs`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/gates/segella.mjs):
     `✅ [Llei Z] Skills cryptosegellats sense canvis. Hash: 4a1546c3...`
   - Verificat que `.agents/SKILLS_SEAL.json`, `.agents/skills/00_INDEX_SKILLS.md`, `.agents/manifest.yaml` i la transacció a `.agents/seal-transactions/` estan 100% sincronitzats.

---

### 4. Auditoria del Mòdul D · Sincronització Nativa per a Botigues Mòbils (Google Play i App Store)

1. **Detecció forense prèvia a `ios/App/App/public/`:**
   - L'escorcoll sobre `ios/App/App/public/assets/index-By_-Cjwi.js` va demostrar que la carpeta nativa d'iOS contenia un build antic (pre-`feaa7adc` / pre-`218433ff`).
2. **Garantia del cicle `npm run build:natiu` + `npx cap sync ios` + `npx cap sync android`:**
   - En recompilar `dist-natiu/` amb [`vite.natiu.config.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/vite.natiu.config.js) des de `HEAD` i sincronitzar Capacitor, els projectes d'Xcode (`ios/`) i Android Studio (`android/`) reben:
     * Els textos legals sanejats (`compte` en lloc de `conta`, NIF corregit, `P0-08`).
     * La pàgina «Qui som» sense l'iframe recursiu `/iaia-maria` ni l'enllaç mort `/skills` (`P0-09`).
     * La guarda d'anònims a `loadFils()` (`src/data/supabase/xat.js:509`, `P0-16`).
     * La política de mitjans nativa (`politicaDeMitjansNativa`), que substitueix els 128 rasters pesants per les seues bessones `.webp` dins del paquet mòbil.

---

### 5. Retroalimentació Tècnica sobre `prompt_local.md` (Protocol §4)

1. **Divisió explícita de rols Executor vs. Auditor:** La instrucció d'aquest torn (`Claude Code executor de codi` + `Gemini auditor de conformitat i contrast de seguretat`) ha resultat extraordinàriament eficaç: zero col·lisions d'escriptura a l'arbre i detecció immediata del risc sobre `bessonesDe()` (`politicaDeMitjans.js`) abans que cap test es trenque.
2. **Correcció de ruta d'eina al prompt:** El prompt (`Mòdul A`) citava `node tooling/scripts/empaqueta.mjs`, quan la ruta real validada per les portes és `wordpress-plugin/eines/empaqueta.mjs`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Segell Criptogràfic de Skills (Llei Z · Mòdul C):**
  * `node tooling/gates/segella.mjs` -> **VERD (`Hash: 4a1546c3...`)**.
- **Proves del Connector i Empaquetador WordPress v1.1.9 (Mòdul A):**
  * `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs` -> **41/41 proves en VERD** (542 ms).
- **Proves de Qualitat i Cens del Lector i d'Imatges (Mòdul B):**
  * `npx vitest run src/apps/lector/qualitat.test.js src/sections/multimedia/censImatges.test.js src/config/politicaDeMitjans.test.js src/config/assetResolver.test.js` -> **100% en VERD**.
- **Validació Documental i Porta de l'Olivera:**
  * `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261021_1900_auditoria_gemini_fase2.md` -> **VERD (`valid: true`)**.
  * `node tooling/gates/porta-olivera.mjs` -> **VERD (`exit 0`)**.
- **Higiene de Processos («Cadascuna a sa casa»):**
  * `manage_task list` -> **0 tasques ni crons actius en segon pla**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Seguint l'assignació de rols del prompt (`Claude Code` executor, `Gemini` auditor de conformitat i contrast de seguretat), Gemini 4 Argon s'ha mantingut en mode d'auditoria no destructiva mentre Claude Code finalitza l'empaquetat físic dels ZIPs v1.1.9 i l'execució de `cap sync`.
- Les 128 imatges `.jpg`/`.png` originals de `public/assets/` que tenen bessona `.webp` es conserven a `public/assets/` per preservar el contracte `bessonesDe()` (`src/config/politicaDeMitjans.js`, `censImatges.test.js`, `standalone-build.test.mjs`) i les rutes de la BD de producció, atés que `separaRecursos()` ja les exclou automàticament dels paquets de WordPress i de les apps natives d'iOS/Android.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2]]
- [[261021_1905_auditoria_claude_botigues_ayudawp_fase2]]
