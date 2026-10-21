---
type: informe
status: esborrany
description: Auditoria exhaustiva fitxer per fitxer de socdepoble.org, estudi i neteja WordPress segons Fernando Tellado (AyudaWP/Vigilante) i verificacio de bloquejants P0 de botigues
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f781afe5-6440-47f1-9f10-2b4dc12206e9:44f6cf99-2b35-4b61-9eb4-85671b6c88e7
---
# Auditoria Forense Radical (Salfumant P0-14), Assimilacio AyudaWP/Tellado (P0-13) i Desbloqueig Botigues

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f781afe5-6440-47f1-9f10-2b4dc12206e9:44f6cf99-2b35-4b61-9eb4-85671b6c88e7 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T14:41:21.002Z |
| Modificació | 2026-10-21T14:51:00.000Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~52.000 tokens |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T14:41:21.002Z: esborrany creat per Gemini 4 Argon (`torn_f781afe5-6440-47f1-9f10-2b4dc12206e9`), vinculat al pla `261021_1600_pla_implementacio_auditoria_radical_fitxers_i_desbloqueig.md`.
- 2026-10-21T14:42:00.000Z: obert Canal Viu de coordinació amb Claude Code (Opus 5.5). Iniciada fase de lectura i escaneig d'Eix A (`P0-14`), Eix B (`P0-13` AyudaWP/Tellado) i Eix C (`P0-01`, `P0-06`, `P0-08`, `P0-09`).
- 2026-10-21T14:51:00.000Z: llegit el relleu de Claude Code (`261021_1645_auditoria_claude_salfumant_radical.md`), acceptat el repartiment per no xafar `src/` ni `wordpress-plugin/`, i bolcat l'informe forense complet dels 3 eixos, l'especificació del tractor `sdp-vigilant-tellado` i la verificació de proves.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Canal Viu de Coordinació (Taula Redona: Gemini 4 Argon + Claude Code)

- **Acord operatiu amb Claude Code (`torn_21f5457b`, `261021_1645_auditoria_claude_salfumant_radical.md`):**
  * **Conformitat total amb el repartiment:** Claude Code reté l'escriptura de codi a `src/` i `wordpress-plugin/` en este torn; Gemini 4 Argon no muta cap fitxer de producte per garantir zero col·lisions d'arbre i lliura ací la segona opinió forense independent amb mètriques exactes, l'auditoria de `wordpress-plugin/`, el disseny complet del tractor `sdp-vigilant-tellado` i l'alerta crítica sobre la trampa de timestamp de la migració `P0-01`.
  * **Alerta prioritària per a Claude Code sobre `wordpress-plugin/`:** Hem detectat la carpeta paràsita `wordpress-plugin/supabase/` (amb `.branches/_current_branch`, `.temp/cli-latest`, `.temp/start-secrets` i `snippets/`), fruit d'una execució accidental de Supabase CLI dins del directori del plugin el 2 d'octubre. Encara que `ADAPTADOR` (`empaqueta.mjs:54`) empra llista blanca i no l'inclou al ZIP, cal purgar `wordpress-plugin/supabase/` perquè embruta l'arbre del plugin. També recomanem endurir la regex de `wordpress-plugin/templates/pantalla-completa.php:33` (vegeu secció 2.2).
  * **Alerta prioritària per a Claude Code sobre `P0-01`:** La sentència `revoke select (contact_email) on table public.organizations from public, anon, authenticated;` es va afegir *in-place* el 20 d'octubre a `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:31`, una migració que ja havia sigut aplicada a producció el 18 d'octubre. A més, en revocar el privilegi `SELECT` de taula per a deixar només columnes explícites a `authenticated`, `anon` perd l'accés de lectura públic a `organizations` si no se li atorga `grant select (...) to anon, authenticated` o si el `REVOKE` no s'executa en una migració amb timestamp nou (vegeu secció 3.1).

---

### 1. Eix A (`P0-14`) · Auditoria Salfumant Radical Fitxer per Fitxer

Aplicant els **5 Perquès** de `core-salfumant-radical` sobre tot l'arbre de `socdepoble.org`, presentem la radiografia física i el veredicte d'esporga per blocs:

#### 1.1 Radiografia de Pes Físic al Repositori (`du -sh`)

| Ruta / Carpeta | Pes Actual | Estat Git / Rol | Diagnòstic Salfumant Radical i Acció Recomanada |
| --- | --- | --- | --- |
| `.git/` | **1,8 GB** | Intern Git | Inflació històrica d'objectes binaris (builds, imatges antigues i snapshots). Candidat a `git gc --aggressive` fora de torn crític. |
| `node_modules/` | **764 MB** | Ignorat | Dependències de desenvolupament i test. Normal en local. |
| `android/` | **207 MB** | Mixt (`build/` ignorat) | El codi font Capacitor és mínim (~20 fitxers); els 206 MB són cachés compilades de Gradle (`android/app/build/`, `.gradle/`). |
| `dist/` i `dist-natiu/` | **162 MB + 45 MB** | Ignorat | Artefactes d'última compilació local. No versionats. |
| `public/` | **157 MB** (`assets/`: 155 MB) | Versionat | **SOBREPES CRÍTIC (`IDEA-02`):** 130 imatges `.jpg`/`.jpeg`/`.png` conviuen amb el seu bessó `.webp` dins de `public/`, sumant **114,98 MB duplicats** (74% del pes de `public/assets/`!). |
| `.agents/` | **107 MB** | Mixt (`runtime/` ignorat) | **HEMORRÀGIA DE DISC:** `.agents/runtime/turns/` acumula **341 fitxers JSON de torns = 99 MB** (~440 KB per torn perquè `openTurn()` desa el mapa SHA-256 de ~3.500 fitxers), més `antigravity-hook.log` (3,8 MB) i `fatiga-hook.log` (2,6 MB). A més, conté 3 fòssils a l'arrel d'`.agents/` (vegeu 1.2). |
| `_wiki_de_poble/` | **102 MB** | Versionat / Mixt | **87 MB** viuen a `_wiki_de_poble/04_escriptori/01_produccio/` (zona humana). |
| `.sdp-reflex/` | **26 MB** | Ignorat (261 fitxers) | **PROHIBIT PER `AGENTS.md §1`:** Antic cervell ocult d'estat (`bootstrap/`: 121 fitxers, `sessions/`: 139 fitxers, `secret.key`). Verificar que `secret.key` no s'use en cap script actiu i evacuar a quarantena. |
| `.immunitari/` | **10 MB** | Mixt (570 fitxers) | Acumulació de 570 receptes històriques a `.immunitari/receptes/`. |
| `assets/img/` (arrel) | **8,8 MB** (15 fitxers) | **Versionat a Git!** | **DUPLICAT A L'ARREL:** Carpeta `socdepoble.org/assets/img/` fora de `public/`. 14 dels 15 fitxers són idèntics byte per byte (SHA-256) als de `public/assets/uploads/brain/`, `public/assets/system/ui/` i `public/assets/img/`. Cap fitxer del projecte importa des de `/assets/img/` d'arrel (Vite ja servix `public/assets/`). |
| `wordpress-plugin/` | **4,9 MB** | Versionat (`dist/` ignorat) | Codi PHP i eines impecables, però conté la carpeta paràsita `wordpress-plugin/supabase/` (vegeu Eix B). |
| `var/` | **580 KB** | Ignorat / Residual | Conté `var/baileys-runtime/` i `var/cerca/`. Restes d'execució local de l'antic bot de WhatsApp. |
| `bot/` | **256 KB** | Versionat | Prototip antic d'integració Baileys WhatsApp (`bot/index.js`, `bot/package.json`, `bot/README.md`, d'agost/setembre). Desconnectat de l'SPA i del backend actual. |
| `.wiki-safety/` | **96 KB** | Ignorat | 5 snapshots JSON del 14 de juliol (`snapshot-1776168...json`). Obsolet. |
| `_templates/gestoria_base/` | **4 KB** | Versionat | Conté un únic `README.md` de 157 bytes sense cap referència al codi. |
| `Dockerfile`, `docker-compose.yml`, `vercel.json` | **12 KB** | Versionat | Configuracions d'infraestructures d'allotjament descartades (el desplegament canònic és Firebase Hosting + Supabase + Enxufe WordPress/Sollutia). |

#### 1.2 Fòssils i Duplicats Directes per Evacuar a Quarantena

1. **Fòssils dins d'`.agents/`:**
   - `.agents/pageContent_old.js` (**106,5 KB**, del 24 de setembre): còpia morta de `pageContent.js` abans de la purga d'iframes i sanejament.
   - `.agents/ESTAT.md.abans-260830` i `.agents/manifest.yaml.abans-260830`: còpies de seguretat puntuals d'agost ja superades per l'historial Git.
2. **Carpeta `assets/img/` a l'arrel de `socdepoble.org` (8,8 MB, 15 PNGs):**
   - Verificat amb SHA-256: 14 dels 15 fitxers (`iaia_comic_matriarch`, `nano_banner_festes`, `nano_comparativa_sostenible`, `nano_energy_save`, `nano_escola_musica`, `nano_families_ unides`, `nano_iaia_ guide`, `nano_infografia_ Circular`, `nano_llibre_memoria`, `nano_mercat_llaurador_1774195763694`, `nano_oli_oliva`, `nano_poble_ General`, `nano_recepta_iaia`, `nano_sobirania_dades`) tenen **exactament el mateix hash SHA-256** que les seues còpies a `public/assets/`. L'únic que difereix lleugerament de mida (`nano_mercat_llaurador_1774197050578.png`, 650 KB vs 750 KB) ja té versió tant en PNG com en WebP a `public/assets/uploads/brain/`.
   - **Acció:** Moure `socdepoble.org/assets/` a `../_multimedia_de_poble/quarantena_arrel_assets/` i `git rm -r assets/img`.
3. **Les 130 parelles Raster (`.jpg`/`.png`) + `.webp` dins de `public/` (`IDEA-02`, 114,98 MB):**
   - El 100% dels 130 fitxers `.jpg`/`.jpeg`/`.png` de `public/assets/` ja tenen la seua bessona `.webp` generada al mateix directori.
   - 2 d'ells (**1,31 MB**) tenen **0 referències** a tot el repositori:
     * `public/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png` (750 KB)
     * `public/assets/uploads/posts/post_fira_artesania_1774198229727.png` (594 KB)
   - Els altres 128 fitxers (**113,67 MB**) només es mantenen perquè `src/config/censImatges.js`, `public/assets/data/media_registry.json`, seeds o proves encara citen l'extensió `.png`/`.jpg` (tot i que `politicaDeMitjans.js` i `empaqueta.mjs` ja tenen la lògica `bessonaDe()` per substituir l'original per la `.webp` en empaquetar!).
   - **Acció recomanada:** Executar un script de migració que actualitze les rutes `.png`/`.jpg` -> `.webp` a `src/` i `media_registry.json`, i evacue els 130 rasters originals a `../_multimedia_de_poble/originals_raster_public/`, reduint `public/` de **157 MB a ~42 MB** de colp.

#### 1.3 Graf d'Imports de `src/` (2.342 fitxers: 1.073 prod JS/JSX, 1.200 tests, 69 recursos)

Hem construït i creuat el graf d'imports estàtics i dinàmics (`import`, `import()`, `require`) de tot `src/`:

- **A. Components de producció completament morts (0 imports en producció i 0 imports en tests):**
  1. [`src/apps/lector/vistes/Carpetes.jsx`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/apps/lector/vistes/Carpetes.jsx): vista antiga del Lector; l'aplicació `LectorApp.jsx` mai no la importa.
  2. [`src/apps/lector/vistes/Fonts.jsx`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/apps/lector/vistes/Fonts.jsx): vista antiga del Lector substituïda íntegrament per [`src/apps/lector/vistes/GestioFonts.jsx`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/apps/lector/vistes/GestioFonts.jsx).
  * *Veredicte:* Candidats directes a quarantena o eliminació neta.

- **B. Mòduls de `src/` importats ÚNICAMENT pel seu propi test unitari (0 imports en l'arbre viu de la UI):**
  *(Nota: No són necessàriament brossa; molts són peces de domini preparades per a fases següents, però s'han de visibilitzar perquè no estan connectades a cap pantalla activa):*
  1. [`src/apps/nevera/importador.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/apps/nevera/importador.js) (importat només per `importador.test.js`).
  2. [`src/sections/gestoria/burocracia/nucli/icsTerminis.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/gestoria/burocracia/nucli/icsTerminis.js) i [`obligacions.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/gestoria/burocracia/nucli/obligacions.js) (nucli de terminis fiscals només importat pels seus `.test.js`).
  3. [`src/sections/gestoria/documents/rebutEsborrat.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/gestoria/documents/rebutEsborrat.js) (només importat pel seu test).
  4. [`src/sections/gestoria/font/handleStore.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/gestoria/font/handleStore.js) (persistència IndexedDB de FileSystemDirectoryHandle, encara no connectada al flux visual de Gestoria).
  5. [`src/sections/gestoria/projectes/nucli/expedient.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/gestoria/projectes/nucli/expedient.js) (només importat per `expedient.test.js`).
  6. [`src/sections/notes/ConnexioDetall.jsx`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/notes/ConnexioDetall.jsx) (només importat per `ConnexioDetall.test.jsx`).
  7. [`src/sections/pobles/pobleDeViquipedia.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/pobles/pobleDeViquipedia.js) (només importat per `pobleDeViquipedia.test.js`).
  8. [`src/utils/ics.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/utils/ics.js) (només importat per `ics.test.js`).
  9. [`src/data/conformitat/kit.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/conformitat/kit.js) (Kit de conformitat del Model B per certificar adaptadors de backend; peça arquitectònica canònica, **INTOCA-BLE**).

- **C. Frontissa de Sollutia (Llei de l'Enxufabilitat · Model B · INTOCABLES):**
  * [`src/data/adaptadors/sollutia/client.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/adaptadors/sollutia/client.js) i [`src/data/adaptadors/sollutia/recursos.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/adaptadors/sollutia/recursos.js), juntament amb [`src/data/adaptadors/sollutia/traductor.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/adaptadors/sollutia/traductor.js) i les fixtures de `src/data/adaptadors/sollutia/fixtures/`, estan 100% blindats (només lectura GET, `credentials: 'omit'`, timeout avortable i traducció canònica) esperant els endpoints reals de Sollutia.

#### 1.4 Auditoria de `tooling/` (239 fitxers) i `scripts/` (22 fitxers)

Hem creuat els 261 fitxers de `tooling/` i `scripts/` contra `package.json`, hooks, portes i tests. Hi ha **53 scripts orfes (0 referències)** que corresponen a migracions one-off ja executades o generadors vells:
- **A `scripts/` (16 de 22 fitxers orfes):** `audit-links.mjs`, `bump-sw.js`, `check-Contrast.js`, `download_water_assets.py`, `fix-contrast-vars.mjs`, `generate-bundle-v3.sh`, `generate-bundle-v4.sh`, `hydrate_towns.js`, `lighthouse-audit.mjs`, `magic-login.mjs`, `optimize-images.mjs`, `preflight-env.mjs`, `pujar-a-supabase.mjs`, `purge-cloudflare.mjs`, `seed-via-rest.mjs`, `sync-book-from-html.mjs`.
- **A `tooling/` (37 fitxers orfes destacats):**
  * `tooling/gates/legacy/` (`check-design-tokens.mjs`, `check-import-boundaries.mjs`, `check-persistence-keys.mjs`, `check-route-Smoke.mjs`, `verify-gate0.mjs`, `verify-h3-0-contract.mjs`, `verify-iaia-browser.mjs`, `verify-p0-gate.mjs`).
  * `tooling/migrations/01_migrar_urls_absolutes.mjs` (migració puntual ja completada).
  * `tooling/mocks/sollutiaBackend.js` i `tooling/contracts/sollutiaContract.js` (antics mocks previs a la Frontissa actual de `src/data/adaptadors/sollutia/`).
  * `tooling/audit/` (`audit-links-deep.mjs`, `verify-contrast.mjs`, `verify-iaia-chats.mjs`, `verify-iaia-Switch.mjs`, `verify-tot-es-un-xat.mjs`, `verify-zero-scroll.mjs`).

#### 1.5 Zona Humana `04_escriptori/01_produccio/` (Informe Consultiu per al Mestre)

Respectant estrictament la prohibició de tocar `01_produccio/` sense permís humà (`AGENTS.md §12`), informem el Mestre que dels **87 MB** d'esta carpeta:
- Hi ha una còpia residual de la imatge purgada al commit `9dc539d7`: `01_produccio/iaia_maria_portada.jpg` (**1,4 MB**).
- Hi ha una subcarpeta buida `01_produccio/builds/` (els builds de l'enxufe ja viuen a `_builds_de_poble/`).
- El checklist d'AyudaWP està quatre vegades en formats distints: `.xlsx` (24 KB), `checklist-limpieza-wp-ayudawp.csv` (6,8 KB), `checklist-limpieza-wp-ayudawp.txt` (6,8 KB), `checklist-limpieza-wp-ayudawp-complet.csv` (18 KB, el bo amb les 4 pestanyes) i un `checklist-limpieza-wp-ayudawp.md` de **0 bytes**.

---

### 2. Eix B (`P0-13`) · Assimilació AyudaWP / Fernando Tellado i Auditoria de `wordpress-plugin/`

Hem estudiat `01_produccio/article-ayudawp.md` i les 4 pestanyes de `01_produccio/checklist-limpieza-wp-ayudawp-complet.csv` (77 punts en 7 fases + guia de cerca i reemplaçament + 8 patrons de codi maliciós) i hem auditat tot `wordpress-plugin/` contra les directrius oficials del directori de WordPress.org.

#### 2.1 Estat de Conformitat WordPress.org de `wordpress-plugin/`

L'adaptador WordPress ([`socdepoble-enxufe.php`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/wordpress-plugin/socdepoble-enxufe.php), `includes/*.php`, `templates/pantalla-completa.php`, `uninstall.php`, `readme.txt` i `eines/empaqueta.mjs`) i les seues 41 proves (`tests/enxufe-empaqueta.test.mjs` i `tests/enxufe-plugin.test.mjs`) mostren un nivell d'enginyeria altíssim:
1. **Zero telefonades a casa (Phone Home) en la variant del directori:** `empaqueta.mjs` exclou `includes/actualitzador.php`, elimina la capçalera `Update URI` i el paràgraf del canal d'actualització del `readme.txt`, declara explícitament el servidor de mitjans extern (`https://socdepoble.org/assets/`) al `readme.txt` de la variant del directori (`variantDirectoriReadme`), i passa l'escàner `PATRONS_ACTUALITZADOR`.
2. **Text Domain 100% unificat:** Totes les crides i18n (`__`, `_e`, `esc_html__`, `esc_attr__`, i `includes/bloc/block.json`) utilitzen exclusivament `'socdepoble-enxufe'`.
3. **Sanejament d'entrades i escapament d'eixides (KISS + Seguretat Tellado):**
   - `includes/ajustos.php` valida estrictament que l'opció `socdepoble_enxufe_ajustos` només admeta les claus `'nomPoble'` i `'poble'`, aplica `sanitize_text_field( wp_unslash(...) )` i longitud màxima amb `mb_substr`.
   - `includes/shortcode.php` aplica llista blanca d'atributs (`ATRIBUTS_ ELEMENT`), filtra identificadors amb regex estrictes i escapa amb `esc_attr()` i `wp_json_encode(..., JSON_HEX_TAG | JSON_HEX_AMP)`.
   - `uninstall.php` utilitza `$wpdb->prepare()` per esborrar transients d'actualització.

#### 2.2 Dues Troballes Quirúrgiques dins de `wordpress-plugin/`

1. **Carpeta paràsita `wordpress-plugin/supabase/` (ALTA PRIORITAT DE NETEJA):**
   - Dins de `wordpress-plugin/supabase/` hi ha `.branches/_current_branch`, `.temp/cli-latest`, `.temp/start-secrets` i `snippets/`. Es va crear per error el 2 d'octubre en invocar la CLI de Supabase des de `wordpress-plugin/`. S'ha d'eliminar immediatament.
2. **Millora defensiva a [`wordpress-plugin/templates/pantalla-completa.php:33`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/wordpress-plugin/templates/pantalla-completa.php#L33):**
   - Actualment fa:
     ```php
     $head_html = preg_replace( '/<link[^>]+rel=["\']preload["\'][^>]+fonts\.gstatic\.com[^>]*>\s*/i', '', $head_html );
     ```
   - **Problema:** Si un tema o plugin com Divi/Elementor emet l'atribut `href="https://fonts.gstatic.com/..."` *abans* de `rel="preload"`, l'expressió regular no el captura i l'avís de consola de precarrega òrfena reapareix. A més, encadenar múltiples `[^>]+` sobre tot el `wp_head()` és menys eficient que filtrar cada etiqueta `<link ...>` individualment.
   - **Proposta per a Claude Code (si edita `wordpress-plugin/`):**
     ```php
     $head_html = preg_replace_callback(
         '/<link\b[^>]*>\s*/i',
         static function ( array $coincidencia ): string {
             $etiqueta = $coincidencia[0];
             if ( preg_match( '/\brel=["\']preload["\']/i', $etiqueta ) && stripos( $etiqueta, 'fonts.gstatic.com' ) !== false ) {
                 return '';
             }
             return $etiqueta;
         },
         $head_html
     ) ?? $head_html;
     ```

#### 2.3 Especificació i Disseny del Tractor Cognitiu `sdp-vigilant-tellado`

Inspirat en la filosofia de **Fernando Tellado (AyudaWP)** —*«KISS: no instal·les un plugin pesat ni un WAF ple de fum quan pots vigilar la superfície d'exposició, la integritat dels fitxers i l'absència de portes del darrere amb regles deterministes»*— i en el seu plugin **Vigilante** i el checklist de 77 punts, dissenyem el tractor cognitiu natiu **`sdp-vigilant-tellado`**.

Com que `.agents/skills/` està segellat criptogràficament amb `SKILLS_SEAL.json` (`porta-skills-seal.mjs`), deixem ací l'especificació exacta del tractor i la seua porta executable (`tooling/gates/porta-vigilant-tellado.mjs`) perquè s'integre al cicle de build i pre-release sense trencar el segell durant el torn:

- **Missió del Tractor `sdp-vigilant-tellado`:** Auditar en <500 ms que ni `public/`, ni `dist/`, ni `wordpress-plugin/` presenten cap vector d'exposició, fitxer paràsit, patró d'ofuscació o violació de les 7 fases d'AyudaWP.
- **Matriu de les 6 Regles Deterministes (Traducció AyudaWP -> Pedra Seca):**
  1. **VIG-01 · Superfície d'Exposició Zero (Checklist Fase 3 · Punts 29-34):**
     Prohibició absoluta que existisquen dins de `public/`, `dist/`, `dist-natiu/` o `wordpress-plugin/builds/` fitxers sensibles o de backup: `.env*`, `.git*`, `*.sql`, `*.sql.gz`, `*.bak`, `*.old`, `*.orig`, `*.swp`, `debug.log`, `error_log`, `phpinfo.php`, `wp-config*.php`.
  2. **VIG-02 · Zero Execució en Carpetes d'Actius i Uploads (Checklist Fase 3 · Punt 30 i Fase 6 · Punt 54):**
     Cap fitxer amb extensió executable de servidor (`.php`, `.phtml`, `.phar`, `.sh`, `.py`, `.pl`, `.cgi`) pot existir mai dins de `public/assets/`, `wordpress-plugin/dist/` ni `wordpress-plugin/builds/directori/dist/`.
  3. **VIG-03 · Escàner de Patrons d'Ofuscació i Backdoors (Checklist Pestanya «Patrones maliciosos»):**
     Escaneig de tots els `.php` de `wordpress-plugin/` i dels scripts d'empaquetat cercant les 8 famílies de signatures de Tellado:
     - `eval\s*\(\s*(base64_decode|gzinflate|str_rot13|gzuncompress)`
     - `assert\s*\(\s*\$_(POST|GET|REQUEST)`
     - `preg_replace\s*\([^,]+['"][^'"]*e['"]` (modificador `/e` d'execució)
     - `\$\{\s*['"]\\x[0-9a-fA-F]{2}` (variables ofuscades en hexadecimal)
     - `create_function\s*\(`
     - Crides directes a `shell_exec`, `passthru`, `proc_open`, `system`, `popen` dins de `wordpress-plugin/*.php`.
  4. **VIG-04 · Integritat Criptogràfica de l'Inventari (Filosofia *Vigilante* de Tellado):**
     Igual que *Vigilante* alerta quan un fitxer del nucli canvia respecte al seu checksum, `VIG-04` valida que `sdp-inventari.json` i `sdp-release.json` tinguen correspondència SHA-256 exacta amb cada fitxer físic i zero fitxers orfes («restes») ni carpetes paràsites (com `wordpress-plugin/supabase/`) dins de `wordpress-plugin/`.
  5. **VIG-05 · Higiene d'URLs i Mixed Content (Checklist Fase 5 · Punts 44-52):**
     Cap referència `http://` no local (`localhost` / `127.0.0.1` / estàndards XML/SVG `http://www.w3.org/`) en fitxers de configuració, plantilles PHP, `readme.txt` o codi de producció de `src/`.
  6. **VIG-06 · Soberania i Privacitat al Navegador (Checklist Fase 2 i WordPress.org Guidelines):**
     Cap CDN de fonts o scripts de tercers no declarats (`fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `jsdelivr.net`, trackers comercials) injectats des del PHP o l'HTML d'entrada (`index.html`).

---

### 3. Eix C · Verificació Forense dels Bloquejants P0 de Botigues i Producció

Hem verificat al detall l'estat de cada bloquejant encomanat al prompt del torn:

#### 3.1 `P0-01` · Revocació de `select (contact_email)` per a anònims a `public.organizations`

- **Estat al codi ([`supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:31`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/supabase/migrations/2610181915_organitzacions_correu_i_membres.sql#L31)):**
  La línia 31 conté:
  ```sql
  revoke select (contact_email) on table public.organizations from public, anon, authenticated;
  grant select (
    id, legacy_id, owner_user_id, handle, name, type, description,
    avatar_url, cover_url, town_id, town_name, is_verified, is_official,
    metadata, created_at, updated_at
  ) on table public.organizations to authenticated;
  ```
- **🚨 TROBALLA CRÍTICA (Doble parany en producció):**
  1. **Parany de Timestamp de Migració:** El fitxer `2610181915_organitzacions_correu_i_membres.sql` porta timestamp del **18 d'octubre** (ja aplicat a Supabase Producció segons `03_llibre_mestre_tasques_i_idees.md`), però el `revoke select (contact_email)` es va afegir editant aquest mateix fitxer el **20 d'octubre** (commit `feaa7adc`). En Supabase, editar una migració ja executada no reexecuta el SQL en producció!
  2. **Parany de Permisos per a `anon`:** En PostgreSQL, per poder revocar `select (contact_email)` d'una taula on abans hi havia un `GRANT SELECT ON TABLE public.organizations TO anon, authenticated`, PostgreSQL revoca el `SELECT` a nivell de taula i exigeix `GRANT SELECT (columna1, columna2, ...)` explícit per a les resta de columnes. Les línies 32-37 fan el `grant select (...)` **només `to authenticated`**, deixant `anon` (visitants sense sessió) **sense permís de lectura sobre cap columna de `public.organizations`**!
  3. **Solució exacta que recomanem crear en una migració nova (`supabase/migrations/2610211700_organitzacions_revoke_email_anon.sql`):**
     ```sql
     revoke select on table public.organizations from public, anon, authenticated;
     grant select (
       id, legacy_id, owner_user_id, handle, name, type, description,
       avatar_url, cover_url, town_id, town_name, is_verified, is_official,
       metadata, created_at, updated_at
     ) on table public.organizations to anon, authenticated;
     ```

#### 3.2 `P0-08` · Substitució de les 11 ocurrències de «conta» per «compte» a `legalContent.js`

- **Estat:** **RESOLT i VERIFICAT en codi (commit `feaa7adc`).**
- Hem comprovat [`src/sections/text/legalContent.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/text/legalContent.js): **0 ocurrències** del barbarisme «conta» (totes les 19 aparicions són «compte» o «comptes», més el test regressiu [`src/sections/text/anima.sanejament.test.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/text/anima.sanejament.test.js) que ho blinda en CI).
- **Acció:** Actualitzar l'estat de `P0-08` al Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) de `[PENDENT]` a `[FET · feaa7adc]`.

#### 3.3 `P0-09` · Eliminació de l'iframe recursiu `/iaia-maria` i enllaç `/skills` a `pageContent.js`

- **Estat:** **RESOLT i VERIFICAT en codi (commit `feaa7adc`).**
- Hem comprovat [`src/sections/text/pageContent.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/text/pageContent.js): **0 ocurrències** d'`<iframe`, `/iaia-maria` o `href="/skills"`.
- **Acció:** Actualitzar l'estat de `P0-09` al Llibre Mestre de `[PENDENT]` a `[FET · feaa7adc]`.

#### 3.4 `P0-16` · Guarda d'usuari connectat abans de `xat_fils_meus` per evitar el 401 en anònims

- **Estat:** **RESOLT i VERIFICAT en codi.**
- A [`src/data/supabase/xat.js:509-513`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/supabase/xat.js#L509-L513), `loadFils()` comprova `if (!user?.id) { return ambXatsPerDefecte([]); }` abans d'invocar `supabase.rpc('xat_fils_meus')`. Les 99 proves de [`src/data/supabase/xat.test.js`](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/data/supabase/xat.test.js) passen en verd.

#### 3.5 `P0-06` · Desplegament de `socdepoble.org` a Firebase Hosting (`soc-de-poble`)

- **Diagnòstic d'entorn i producció:**
  * L'escorcoll HTTP a producció (`curl -sI https://socdepoble.org/legal`) confirma que el servidor públic encara servix un build antic (`last-modified: Thu, 11 Jun 2026 00:47:13 GMT`, `Server: Google Frontend`).
  * A la màquina local no hi ha binari global `firebase` ni token d'autenticació a `~/.config/configstore/firebase-tools.json`.
  * A més, el repositori no té actualment un fitxer `firebase.json` ni `.firebaserc` a l'arrel de `socdepoble.org` (va ser purgat en una neteja anterior).
- **Runbook exacte per al Mestre (desbloqueig en 60 segons):**
  1. Assegurar que `firebase.json` apunta a `"public": "dist"` amb el rewrite SPA (`"**" -> "/index.html"`).
  2. Compilar el build de producció net:
     ```bash
     cd "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org"
     npm run build
     ```
  3. Autenticar i desplegar a Firebase Hosting:
     ```bash
     npx firebase-tools login
     npx firebase-tools deploy --only hosting --project soc-de-poble
     ```

---

### 4. Feedback d'Usabilitat sobre la Plantilla `prompt_local.md` (Protocol §4)

Com a part del protocol d'interacció obligatori del torn, deixem el nostre retorn sobre l'estructura de `prompt_local.md`:
1. **El que funciona de categoria:** La secció **Context Tècnic i Arquitectònic** amb la **Directiva Suprema (Llei de l'Enxufabilitat · Model B)** i la distinció física entre `Som de Poble` (contenidor mare) i `socdepoble.org` (nucli Git) evita qualsevol al·lucinació de rutes o d'arquitectura.
2. **Millora proposada 1 (Sincronització d'estat dels P0 al Prompt):** El prompt encomanava com a pendents de codi `P0-08` (`legalContent.js`) i `P0-09` (`pageContent.js`), que ja havien sigut resolts al commit `feaa7adc`, perquè el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) encara els marcava com a `[PENDENT]`. Recomanem que el preflight d'orquestració comprove amb `git log -S` si els P0 llistats ja tenen commit abans d'emetre el prompt.
3. **Millora proposada 2 (Protocol de Taula Redona multi-IA):** Quan dues IAs (Claude Code i Gemini) s'executen simultàniament sobre el mateix arbre de treball, hauria d'estar preassignat des del prompt quin agent té el *lock* d'escriptura sobre `src/` i quin agent actua com a auditor/verificador forense, tal com hem acordat espontàniament amb Claude Code al Canal Viu.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Porta de l'Olivera i Governança Documental:**
  * `node tooling/gates/porta-olivera.mjs` -> **VERD (exit 0)**.
  * `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261021_1641_auditoria_gemini.md` -> **VERD (`valid: true`)**.
- **Proves del Paquet i Adaptador WordPress (`P0-13`):**
  * `node --test tests/enxufe-empaqueta.test.mjs tests/enxufe-plugin.test.mjs` -> **41/41 proves en VERD** (1.077 ms).
- **Proves de Sanejament Legal, Textos i Xat (`P0-08`, `P0-09`, `P0-16`):**
  * `npx vitest run src/data/supabase/xat.test.js src/sections/text/anima.sanejament.test.js src/sections/text/legal.esborraCompte.test.jsx` -> **3 suites, 107/107 proves en VERD**.
- **Higiene de Processos ("Cadascuna a sa casa"):**
  * Verificat `manage_task list`: **0 tasques ni crons actius en segon pla**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per coordinació explícita amb Claude Code (`torn_21f5457b`, `261021_1645_auditoria_claude_salfumant_radical.md`), Gemini 4 Argon no ha modificat ni esborrat fitxers dins de `src/` ni `wordpress-plugin/` durant l'execució en paral·lel per evitar conflictes d'escriptura i de segellat de torn. Totes les rutes exactes d'esporga (`P0-14`), la correcció de `wordpress-plugin/supabase/` i `pantalla-completa.php` (`P0-13`) i la migració de `public.organizations` per a `anon` (`P0-01`) queden documentades i verificades en aquest informe per a la seua aplicació immediata i sense fricció.
- El desplegament a producció de Firebase Hosting (`P0-06`) requereix sessió autenticada interactiva del Mestre (`npx firebase-tools login`), absència verificada en l'entorn local actual.
- La carpeta `_wiki_de_poble/04_escriptori/01_produccio/` (87 MB) només s'ha inspeccionat en mode lectura, respectant la restricció de zona humana (`AGENTS.md §12`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261021_1600_pla_implementacio_auditoria_radical_fitxers_i_desbloqueig]]
- [[261021_1645_auditoria_claude_salfumant_radical]]
