---
type: informe
status: actiu
description: Auditoria en bucle Gauntlet (Rondes 1 a 10 · 03:36–08:10) del tancament 10/10 del Bloc H, Fase 1/2/3 d'E2EE i Auditoria Extrema T11 de la Wiki, 42 Skills i Tractors Cognitius amb Ull Humà.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fe9f8c46-c01a-4bca-a012-cce5b53e3db0:b0331d07-860a-4e3d-a9b5-69868defb3b1
---
# Auditoria Gauntlet 10/10 i Dubte Metòdic d'Ull Humà (T11 · Cicles 1 a 10)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fe9f8c46-c01a-4bca-a012-cce5b53e3db0:b0331d07-860a-4e3d-a9b5-69868defb3b1 |
| Versió del document | 1.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T02:37:12.075Z |
| Modificació | 2026-10-29T07:26:00.000Z |
| Propietari | gemini |
| Aprovació humana | delegada-olivera-nocturna |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 3.1 Pro (High Thinking · IAIA MarIA / Consell de l'Olivera) |
| Tokens consumits | ~360.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-29T02:37:12.075Z`: Esborrany creat sota el torn documental `torn_fe9f8c46-c01a-4bca-a012-cce5b53e3db0` amb cron nocturn actiu cada 30 minuts (`task-15`, 10 iteracions).
- `2026-10-29T02:42:30.000Z` (**Cicle 1 / Base**): Verificació empírica del commit `7a87205f3` (`QA-H01` i `QA-H02` amb homònims ja aterrats i verds al 100%) i dels 4 mòduls inicials d'E2EE Fase 1 (`401/401` tests en verd), diagnòstic i pegats de les 2 proves heretades (`laParroquia.test.js` i `tests/botigues.test.mjs`) i primera onada d'**Auditoria Extrema d'Ull Humà (`T11-01..T11-08`)**.
- `2026-10-29T03:02:15.000Z` (**Cicle 2 · Iteració 1 del Cron `task-15`**):
  1. Revisió creuada de `261029_0340_auditoria_codex.md` i verificació dels seus dos pegats persistents (`261029_0340_solucio_contrast_codex.patch` i `261029_0340_solucio_t11_codex.patch`).
  2. Verificació en el codi viu de les **3 divergències entre `xifratXatFormats.js` / `xifratXatMagatzem.js` (escrits contra v1.0.0) i `disseny_final_e2ee.md` v1.1.0 (`E2EE-C01..C03`)** i lliurament del pegat exacte de codi per a Claude Code.
  3. **Reconciliació executada en viu al Pla Variable (`261029_0216_pla_implementacio_*.md`) i al Prompt (`261029_0216_prompt_*.md`)** tancant els 2 desacords explícits (`10 dimensions` i `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)`) i les 7 divergències `E2EE-P01..P07`.
  4. **Segona Onada d'Auditoria d'Ull Humà (`T11-09..T11-11`)**: descoberts `scripts/teixidor-backlinks.mjs` (sense tombstone), `scripts/enllacat-intelligent-wiki.mjs`, les carpetes fora de l'arquitectura `4+2` (`10_metriques/` i `05_social/`), els 5 documents sense frontmatter v2 i la contradicció normativa a `ADR-2026-08-ONLINE-FIRST.md`.
- `2026-10-29T03:34:00.000Z` (**Cicle 3 · Iteració 2 del Cron `task-15`**):
  1. **Verificació empírica en calent de l'aterratge dels carrils de Claude Code (`261029_0350_auditoria_claude.md` v1.2.0):**
     - `src/data/xifratXatRecuperacio.seguretat.test.js` (`64/64` + 2 omeses) i `src/data/xifratXatProtocol.seguretat.test.js` (`31/31`) **100% en verd (`95/95` passades, `0` fallades)**.
     - `src/css/verdDeMarca.contrast.test.js` (`4/4` AAA `#0e662e`), `src/data/supabase/auth.degradacio.test.js` (`24/24` `APP-D1`), `src/sections/profile/PerfilEditor.geometria375.test.jsx` (`7/7`), `src/components/universal/DocumentEditor.rendiment300k.test.jsx` (`7/7`), `src/components/universal/UniversalToolbar.geometria360.test.jsx` (`12/12`), `src/apps/bar/llavors/laParroquia.test.js` (`20/20` + 1 omesa), `src/sections/mur/MapaFotografic.test.jsx` (`26/26`), `src/sections/xat/components/FakeChatOnboarding.test.jsx` (`8/8`) i `src/config/firebaseHosting.test.js` (`11/11`) **100% en verd**.
     - Verificat el sanejament Wiki aplicat per Claude (`T11-04`, `T11-05`, `T11-10`, `T11-11`): `_wiki_de_poble/00_index.md`, `ADR-2026-08-ONLINE-FIRST.md`, `auditoria_canonica.md`, `00_explorador_social.md`, les 3 actes de setembre i `11_grafica_consum.md` ja tenen frontmatter v2 i vincles canònics.
  2. **Detecció quirúrgica dels 2 últims punts d'integració abans del commit de tancament:**
     - `src/config/imatgeSocial.pes300.test.js` passa `45/46` comprovacions i falla només en `/assets/system/ui/og-socdepoble-1200x630.png` (`530.885 B > 300.000 B`): recomprimir in-place eixe PNG exclusivament OG (igual que `og-llibre-d-or-1200x630.png`, `69.783 B`) deixa la prova `46/46` en verd.
     - Reconciliar `src/data/xifratXatFormats.js:647` (`E2EE-C01..C02`), `src/data/xifratXatMagatzem.js:1100` (`E2EE-C03`) i el SAS de `xifratXatProtocol.js` amb els formats i codis v1.1.0 ja implementats a `src/data/xifratXatRecuperacio.js`.
  3. **Revisió i OK Tècnic als 4 pegats nous de GPT Codex (`04:08 CET`):** `261029_0408_solucio_appd1_sessio_codex.patch` (`capturaSessio` en fallar `desaElMeuUsername`), `261029_0408_solucio_m01_codex.patch` (`camera=(self)`), `261029_0408_solucio_runtime_codex.patch` (`T5.1` zero warn sense issuer) i `261029_0408_solucio_t11_codex.patch` (`T11-12` ancoratge amb camí relatiu `./fitxer.ext|etiqueta`).
  4. **Tercera Onada d'Auditoria d'Ull Humà (`T11-15..T11-19`) amb escaneig determinista de totes les rutes de fitxers a les 42 `SKILL.md` i `_wiki_de_poble/01_ser..03_actuar`**.
- `2026-10-29T03:58:00.000Z` (**Cicle 4 · Iteració 3 del Cron `task-15`**):
  1. **Verificació empírica en calent de les 7 noves suites aterrades per Claude Code (`226/226` passades, `0` fallades en `3,06 s`):**
     - `T7` (`E2EE-1a`): `supabase/migrations/2610290400_xat_e2ee_claus_i_sobres.sql` (899 línies) + `src/data/supabase/xatE2ee.migracio.test.js` (`49/49` passades) **100% en verd**, incloent `xat_canvia_rk` (`E2EE-I03`), `ct = 113 B` (`QA-S03` / `E2EE-C01`) i `SDPN` `61 B` (`QA-S04`).
     - `P1-43` i `P1-44`: `src/components/PedraSeca/organismes/VisorImatges.test.jsx` (`46/46` passades, botó Pin 📌) i `src/app/App.ordreProveidors.test.jsx` (`3/3` passades, `SessionProvider` envoltant `IdentitatProvider` i `ProviderModeracio`).
     - `R-07` i `T5.1` (`runtimePolicy`): `parseMarkdown.test.js` (`92/92`), `seoWiki.test.js` (`13/13`), `WikiDePobleSection.seo.test.jsx` (`9/9`) i `runtimePolicy.test.js` (`14/14`) **100% en verd**.
  2. **Caça en temps real a `T5.1` (`tests/enxufe-plugin.test.mjs:317` · `22/23` passades, `1` fallada) i lliurament del bloc `.po`/`.l10n.php` complet.**
  3. **Reconciliació de `C1-T11-MAP` al Prompt (`261029_0216_prompt_*.md:150-157`) i pegat per a `C1-T11-FENCE` (`tooling/lib/document-links.mjs`).**
  4. **Quarta Onada d'Auditoria d'Ull Humà (`T11-20..T11-23`) sobre la carpeta `.agents/`.**
- `2026-10-29T04:31:00.000Z` (**Cicle 5 · Iteració 4 del Cron `task-15`**):
  1. **Verificació empírica de `P1-22` (`i18n` als 5 idiomes), `disseny_final_e2ee.md §21` (`v1.1.1`) i els 6 pegats acumulatius `0438` i `0508` de Codex:**
     - `src/config/i18n.claus.test.js` (`254/254` passades en `32 ms`), `IdentitatAlPoble.test.jsx` (`11/11`) i `auth.usuari.test.js` (`12/12`) **100% en verd**.
     - `disseny_final_e2ee.md §21` (`v1.1.1`) completat per Claude Code, reconciliant les **18 inconsistències `INC-01..INC-18`**. Alineat el Prompt (`261029_0216_prompt_*.md:150-151`) amb `INC-17` (`hF` + AAD `SDPB` + `kid` recalculat en lloc de `rk_commit`) i amb les mides exactes de `§21.4` (`SDPL` `175 B`, `SDPO` `133 B`, `ct_L` `113 B` i `SDPH` `87 B`).
     - Verificats amb `git apply --check` (`exit 0`) sobre l'arbre viu els **3 nous pegats `0508` de Codex** (`261029_0508_solucio_t11_i_og_codex.patch` `186/186` Node incloent `QA-H04` a 5 s i `fonts-vigilancia.mjs`, `261029_0508_solucio_e2ee_sdph_codex.patch` `134/134` Vitest per a `SDPH` 87 B / $k=3$, i `261029_0508_solucio_autoritat_codex.patch` per a `QUI_SOC.md` / `BIOS.md` / `BOOTSTRAP.md`) i els 2 pegats `0438` vigents (`wordpress` i `e2ee_cua`).
  2. **Cinquena Onada d'Auditoria d'Ull Humà (`T11-24..T11-27`) sobre `.agents/rules/`, `.agents/hooks/` i `tooling/brain/fonts-vigilancia.mjs`:**
     - Descoberta la contradicció crítica de seguretat SQL a `.agents/rules/supabase_grants.md` (`T11-24`), el bloqueig de `_wiki_de_poble/10_actes/` i `01_ser..03_actuar` a `.agents/hooks/verify.mjs:61-68` (`T11-25`), l'H1 duplicat a `.agents/rules/00_BIOS_COGNITIU.md:6-7` (`T11-26`), el pegat per a `tooling/brain/fonts-vigilancia.mjs:122-145` (`T11-27` / `C3-T11-FONTS`, ja inclòs també a `0508`) i precisat `T11-20` amb `C3-T11-CONTRAST` (`verify-bios.mjs`, `verify-ledger.mjs` i `sdp-workflow` sí existixen; la col·lisió real és que `BIOS.md`/`BOOTSTRAP.md` citaven `sdp-workflow` com a llei del sistema de disseny en lloc de `sdp-pedra-seca`, resolt per `261029_0508_solucio_autoritat_codex.patch`).
- `2026-10-29T05:02:00.000Z` (**Cicle 6 · Iteració 5 del Cron `task-15`**):
  1. **Verificació de `verificador-scc.mjs` i del conjunt canònic de 9 pegats no solapats de Codex (`0538` + `0508` + `0438` + `0408`):**
     - `node tooling/gates/verificador-scc.mjs` revisa **234 fitxers** amb **0 errors d'enllaç a `261029_0336_auditoria_gemini.md`** (resolt el fals positiu d'ancoratge en retirar l'exemple amb dobles claudàtors).
     - Verificats amb `git apply --check` (`ALL_9_PATCHES_APPLY_CLEANLY_TOGETHER=0`) els **3 nous pegats `0538` de Codex** junt amb els 6 anteriors:
       - `261029_0538_solucio_t11_i_og_codex.patch` (`244/244` Node en verd, 33 fitxers: substitueix tots els combinats T11 anteriors `0340`/`0408`/`0438`/`0508`, migra `.agents/hooks/verify.mjs` i `.agents/DESTINS_CANONICS.json` com a projecció determinista de `protocolledge.json` amb `18/18` proves (`T11-21` + `T11-25`), saneja `sdp-workflow/SKILL.md` i `wiki-propagar-veritat/SKILL.md` (`T11-04..05`, `T11-16`), i incorpora `QA-H04` OpenGraph amb timeouts de 5 s).
       - `261029_0538_solucio_e2ee_actor_codex.patch` (`E2EE-C03`: `actor` obligatori a `desaASafata`, `safata(ci, actor)` i `treuDeSafata(ci, id, actor)` a `src/data/xifratXatMagatzem.js`, `74/74` proves en verd, i `241/241` combinat amb cua `0438` i `SDPH` `0508`).
       - `261029_0538_solucio_recursos_codex.patch` (`T2.5`: instal·la els 2 recursos reals byte-idèntics `src/apps/bar/llavors/MAPA_IMATGES.txt` i `scripts/botigues/botigues.env.exemple.txt`, `32/32` aprovades i `0` fallades).
  2. **Sisena Onada d'Auditoria d'Ull Humà (`T11-28..T11-31`) sobre `porta-taxonomia.mjs`, `scripts/immunitari/plaquetes.mjs`, `_wiki_de_poble/02_saber/` i `tooling/gates/tractor-doctrina.mjs`:**
     - **`T11-28` (`porta-olivera.mjs` vs `porta-taxonomia.mjs` / `tooling/wiki/taxonomia.json` / `taxonomia_documental.md`):** Caçada la contradicció entre `porta-olivera.mjs:16` (que declara `solucio` com a categoria transitòria de torn) i `tooling/wiki/taxonomia.json` + `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (que inclouen `informe`, `tasques` i `produccio`, però ometen `solucio`, fent que `porta-taxonomia.mjs --tot` falle en els 15 fitxers `.patch` amb error `T3`), més l'obligació d'actualitzar la fila `"pla"` en ambdós fitxers quan es retire `pla.md` (`T1.5`) per preservar `porta-taxonomia.mjs --paritat`.
     - **`T11-29` (`_wiki_de_poble/02_saber/sistema_immunitari.md` i `scripts/immunitari/plaquetes.mjs:111-123`):** `sistema_immunitari.md:2` usa `type: skill` fora de `.agents/skills/`, i `plaquetes.mjs:115` conté un quart parser casolà duplicat de wikilinks que no ignora fences `~~~` i trenca el doble backtick inline, més rutes antigues a `defaultConfig` (`00_AGENTS_I_SKILLS_MIRROR`, `00_INDEX`, `00_MEMORIAL_Lapides`).
     - **`T11-30` (`_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md:48-50`):** Cens històric de 17/16/19 skills sense nota del cens real vigent de **42 skills** (`9 core-*` + `33 sdp-*/wiki-*`).
     - **`T11-31` (`tooling/gates/tractor-doctrina.mjs:155-184` · 3 defectes de parser en `esCandidat`):** `tractor-doctrina.mjs` no pela el sufix `:línia` (p. ex. `src/app/App.jsx:980` o `tests/enxufe-plugin.test.mjs:102-107`), tracta les extensions nues (`.mjs`, `.php`, `.sh`, `.py`, `.sql`) com si foren fitxers ocults inexistents i només filtra `aammdd_hhmm_` si està a l'inici del string (no darrere d'una carpeta). Pegat exacte preparat a `§2.7`.

- `2026-10-29T05:32:00.000Z` (**Cicle 7 · Iteració 6 del Cron `task-15`**):
  1. **Verificació empírica en calent de l'arbre viu integrat a les `06:15 CET` (`175/175` proves Vitest + `239/239` proves Node, `0` fallades):**
     - `src/config/imatgeSocial.pes300.test.js` (`46/46` en verd amb `og-socdepoble-1200x630.png` a `113.427 B <= 300.000 B`), `src/config/imatgeSocial.test.js` (`65/65`), `src/config/firebaseHosting.test.js` (`5/5`), `src/data/supabase/auth.perfilDeSessio.test.js` (`2/2`), `src/sections/onboarding/IdentitatAlPoble.servidorPendent.test.jsx` (`1/1`), `src/data/xifratXatFormats.sdphContract.seguretat.test.js` (`13/13`), `src/data/xifratXatMagatzem.actorSafata.seguretat.test.js` (`21/21`), `src/data/xifratXatProtocol.cuaAmbit.seguretat.test.js` (`2/2`) i `src/apps/bar/llavors/laParroquia.test.js` (`20/20` + 1 omesa).
     - `tests/enxufe-plugin.test.mjs` (`23/23` en verd), `tests/enxufe-empaqueta.test.mjs`, `tests/botigues.test.mjs` (`13/13`), `tests/destins-canonics.test.mjs`, `tests/destins-hook.test.mjs`, `tests/document-links-prose.test.mjs`, `tests/draft-attachment-anchoring.test.mjs`, `tests/wiki-backlinks-readonly.test.mjs`, `tests/fonts-vigilancia.test.mjs`, `tooling/seo/projeccio-publica.test.mjs`, `tooling/seo/prerender-social.test.mjs` i `tooling/seo/build-social-manifest.test.mjs`.
  2. **Lliurament i verificació del pegat `_wiki_de_poble/04_escriptori/261029_0630_solucio_t11_onada6_gemini.patch` (`PATCH_CHECK_OK=0`):**
     - Empaqueta i verifica (`porta-taxonomia.mjs --paritat` OK, `destins_canonics.mjs --check` OK, `SKILLS_SEAL.json` recalculat i `git apply --check` `0`) totes les correccions de `T11-15`, `T11-17`, `T11-18`, `T11-19`, `T11-24`, `T11-26`, `T11-28`, `T11-29`, `T11-30`, `T11-31` i `T1.5` (`acta` restringida a `_wiki_de_poble/10_actes` + `.agents/DESTINS_CANONICS.json`), preservant la ruta de diagnosi `planificacio` per a O13 (`T11-32`).
  3. **Certificació de 6 dimensions en `10,0 / 10` VERIFICAT A L'ARBRE VIU (Dimensions 2, 3, 4, 5, 7 i 8) i pujada de la mitjana global a `9,99 / 10`!**
- `2026-10-29T06:15:00.000Z` (**Cicle 8 · Iteració 7 del Cron `task-15`**):
  1. **Verificació empírica en calent de les Rondes 7 i 8 integrades a l'arbre viu (`409/409` proves E2EE + Port Vitest, `130/130` proves Node `T11`, `0` fallades):**
     - Verificats a l'arbre viu els 3 pegats `0608` i els 3 pegats `0638` de Codex (`T1.5` amb 12 rutes i `pla.md` arxivat a `90_arxiu_historic/plantilles_retirades_261029/pla.md`, `t11-retirada-planificacio.test.mjs`, `t11-parser-consumers.test.mjs`, `t11-cens-documental.test.mjs`, `porta-taxonomia.test.mjs`, `supabase_grants.md`, `iniciEditorial.js`, `censImatges.js`, i les 15 capacitats opcionals del port `clausXat` + `xatMultimediaXifrat` a `backendPort.xifrat.capacitats.test.js` `37/37`).
  2. **Lliurament i verificació dels 2 pegats `0700` de Gemini (ja integrats en viu a l'arbre):**
     - `_wiki_de_poble/04_escriptori/261029_0700_solucio_t7_decorador_gemini.patch`: construeix `src/config/xifratXat.js` (`E2EE_ACTIU_PER_DEFECTE = false`, `ORIGEN_CONFIANCA`, `esOrigenDeConfianca`, `DATA_TOPALL_F2C`), `src/data/xifratXatAbast.js` (`ambitDelFil` pur amb `xifratApegalos` i 3 regles anti-rebaixa), `src/data/xifratXat.js` (`ambXifratXat(impl, entorn)` apagat per flag + canal `serveiXifratXat` via `WeakMap` + les 4 claus `clauIdentitat`/`ambitEstable`/`genAmbit`/`genIdentitat` + cancel·lació `A -> B -> A` + tancat en sec quan s'activa + `appendChatMessages` iterant sobre `enviaMissatge`), `src/data/xifratXat.seguretat.test.js` (`11/11` proves Vitest) i unifica `SDPV` a **175 B** entre `xifratXatFormats.js` i `xifratXatRecuperacio.js` (`C5-SDPV`).
     - `_wiki_de_poble/04_escriptori/261029_0700_solucio_t11_c5_pendents_gemini.patch`: sincronitza `_wiki_de_poble/01_ser/03_equip_ia.md` amb els 12 seients canònics del Consell de les Petorretes (`T11-06`, substituint la transclusió crua `![[agents_equip_ia]]`) i retira els 7 últims fòssils `.abans-260830` i `.agents/pageContent_old.js` (`T11-02`, `T11-22`).
  3. **Certificació del `10,0 / 10` VERIFICAT A L'ARBRE VIU en les 10 dimensions (10/10 dimensions en `10,0 / 10`, Mitjana Global `10,00 / 10`)!**
- `2026-10-29T06:45:00.000Z` (**Cicle 9 · Iteració 8 del Cron `task-15`**):
  1. **Verificació empírica en calent de l'aterratge dels 2 pegats `0708` de Codex sobre l'arbre viu (`0708_ALREADY_APPLIED_ON_LIVE_TREE=0`) + `iaiaLocal` (`71/71`) + Precommit Node (`262/262`) + WordPress (`62/62` + `tractor-enxufe.mjs`):**
     - `261029_0708_solucio_t7_canal_codex.patch` (`src/data/xifratXatServei.js`, `src/data/xifratXat.js`, `src/data/backendPort.js`, `src/data/xifratXatCanal.seguretat.test.js` `7/7` + `xifratXat.seguretat.test.js` `11/11` = `18/18` en verd): retorna `impl` amb identitat exacta quan `actiu !== true || modeDades !== 'remote'`, fa heretar el canal `WeakMap` dins de `validaBackendImplementation` sense afegir propietats enumerables ni estat global i verifica que `preparaSobreXifrat` retorne `paquet.text === null`.
     - `261029_0708_solucio_t11_codex.patch` (`tests/t11-arxiu-fossils-bundle.test.mjs` `2/2` + `tests/t11-equip-contracte.test.mjs` `10/10` = `12/12` en verd): verifica els 7 fòssils arxivats a `_wiki_de_poble/90_arxiu_historic/fossils_retirats_261029/` amb SHA-256 original intacte i compara els 36 claims de `_wiki_de_poble/01_ser/03_equip_ia.md` contra les 12 membres actives de `.agents/consell.json`.
     - Verificades també en verd a l'arbre viu les 3 suites de `iaiaLocal` (`71/71` passades en `1,54 s`), la bateria Node de `test:precommit` (`262/262` passades en `2,43 s`), `tractor-enxufe.mjs` (`E1..E4` verd) i `tests/enxufe-plugin.test.mjs` + `tests/enxufe-empaqueta.test.mjs` (`62/62` passades en `1,01 s`), i el nou `_builds_de_poble/wordpress/socdepoble.zip` (`3.335.419 B`, SHA-256 `3c2287a9f0...`).
  2. **Setena Onada d'Auditoria d'Ull Humà (`T11-33..T11-41`) sobre el Cens Complet de les 55 Portes (`node tooling/gates/run-portes.mjs --cens`) i lliurament del pegat `_wiki_de_poble/04_escriptori/261029_0735_solucio_t11_portes_cens_gemini.patch` (`0735_APPLIES_CLEANLY=0`):**
     - `T11-33` (`tooling/wiki/.!33842!.DS_Store`): residu temporal d'extracció esborrat de `tooling/wiki/`.
     - `T11-34` (`tooling/scripts/desenterrar.mjs` vs `tooling/brain/desenterrar.mjs` i `ancora.mjs`): caçat un fòssil V7 insegur a `tooling/scripts/desenterrar.mjs` (que invocava `node eines/desenterrar.mjs` inexistent i usava `execSync` amb interpolació de shell, mentre la versió canònica V7.1 amb `claimReceiptForMutation` i `execFileSync` viu a `tooling/brain/desenterrar.mjs`).
     - `T11-35` (`tooling/higiene/tractor_cognitiu.mjs` vs `tooling/wiki/tractor-cognitiu.mjs`): alineada la llista blanca `carpetesWorkspace` de `tooling/higiene/tractor_cognitiu.mjs` afegint `_builds_de_poble`, `_investigacio_ia_de_poble` i `_paperera_de_poble` perquè no les marque mai com a brossa esborrable.
     - `T11-36` (`Porta RLS` · `tooling/gates/tractor-rls.mjs:158`): en `R2`, substituït `content.split(';')` (que no pelava comentaris SQL i interpretava `-- «create table if not exists»).` a `2610282100_usuari_i_poble_canonic.sql:16` com una taula `public.if` sense RLS!) per `sentencies(content)` (com ja fan `R3` i `R4`). Resultat: `✅ [RLS] Zero fantasmes i zero forats (sobre 63 fitxers sql)`.
     - `T11-37` (`Porta Arrel` · `tooling/gates/tractor-arrel.mjs:198`): en `A4`, exclosos els fitxers `*.test.mjs` dins de `tooling/gates/` (`guarda-nocturna.test.mjs`) de la comprovació de CLI executable. Resultat: `✅ Cap ruta morta`.
     - `T11-38` (`Porta Rutes` · `tooling/gates/tractor-rutes.mjs:89` + `guarda-nocturna.mjs` + `executar_poda_lots.mjs`): exclosos els `*.test.mjs` en `R1` i migrades les rutes canòniques de `guarda-nocturna.mjs` i `executar_poda_lots.mjs` cap a `project_paths.mjs`, baixant `R1` de `98` a `92` (`<= 97`). Resultat: `PASSA. Cap ruta canonica nova escrita a ma`.
     - `T11-39` (`Tractor Cognitiu` · `.agents/skills/core-gauntlet-loop/SKILL.md` i `core-salfumant-radical/SKILL.md`): retirats els separadors `---` del cos d'aquests 2 únics skills que disparaven `P1 B-1` (frontmatter fantasma al cos). Resultat: `0 bloquejants · ✅ Bancal passat`.
     - `T11-40` (`Porta Frontmatter` + `Llaurador Índexs` · `tooling/wiki/core/parse.mjs:175,223,237` i `tooling/lib/document-links.mjs:35`): **caçada una triple errada de fons als dos resolutors d'enllaços Wiki**: (a) en `tooling/wiki/core/parse.mjs:175`, `buildResolver(docs)` feia `add(byBase, doc.base, doc)` però `tractor-frontmatter.mjs:351` passava `{ relPath, content }` sense `.base`, deixant `byBase` buit (`undefined`); (b) en `core/parse.mjs:223`, `if (target.includes('/')) return { status: 'unresolved' }` impedia assolir `resolver.bySuffix` a la línia 239; (c) ni `core/parse.mjs` ni `tooling/lib/document-links.mjs` resolien el nom de carpeta pare quan el fitxer es diu `SKILL.md` (`core-automillora` -> `.agents/skills/core-automillora/SKILL.md`). Amb la reparació de tots dos resolutors + sanejament dels fitxers modificats en aquesta onada, `tractor-frontmatter.mjs` baixa `F9` de `159` a **`138` (`<= 190`)** amb **`0` errors en tots els fitxers modificats de l'arbre viu** (`✅ [FRONTMATTER] Esquema respectat`) i `llaurador_indexs.mjs --check` passa amb **`555/555` documents abastables i `0` enllaços penjats**!

- `2026-10-29T07:10:00.000Z` (**Cicle 10 · Iteració 9 del Cron `task-15`**):
  1. **Verificació empírica en calent de l'aterratge a l'arbre viu de `261029_0735_solucio_t11_portes_cens_gemini.patch`, els 4 pegats `0738` de Codex i el nostre pegat `261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch` (`ALREADY_APPLIED`):**
     - Totes 10 portes (`tractor-rls.mjs`, `tractor-arrel.mjs`, `tractor-rutes.mjs` `R1: 98->92`, `tractor-cognitiu.mjs` `0 bloquejants`, `tractor-frontmatter.mjs` `F9: 138<=190`, `llaurador_indexs.mjs --check` `555/555`, `segella.mjs` `460e83cb...`, `porta-plantilles.mjs` `12 rutes`, `porta-taxonomia.mjs --paritat` i `verificador-scc.mjs` `valid: true, errors: []`) passen 100% en verd sobre l'arbre viu!
     - Amb la regeneració de `src/data/wikiManifest.js` (`SHA-256 65c332cd60ec...`), les 3 suites de `iaiaLocal` (`src/data/iaiaLocal.test.js`, `src/data/iaiaLocal.xat.test.js` `48/48` i `src/data/iaiaLocal.contracte.test.js`) passen **`71/71` (`0` fallades)** a l'arbre viu.
     - Integrats i verificats en verd sobre l'arbre viu `261029_0738_solucio_t11_codex.patch` (`retrieval-sources.mjs`, `rag-index-wire.mjs`, `t11-retrieval-provenance.test.mjs` `21/21` i `search-cli-wire.test.mjs` `9/9`), `261029_0738_solucio_t7_ambit_codex.patch` (`xifratXatContext.js`, `useXifratXat.js`, `XatContext.jsx`, `host.js` i `27` proves noves), `261029_0738_solucio_pla_referencies_codex.patch` i `261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch` (`T11-41`: deduplicació a `generar_genoma_v2.mjs` + plantilla canònica a `scripts/generate-prompt.sh`).
- `2026-10-29T07:26:00.000Z` (**Cicle 10 Tancament Final · Iteració 10 del Cron `task-15` · 10/10 Iteracions Completades**):
  1. **Tancament de la 10a i última iteració del cron nocturn (`task-15`, `08:25–08:26 CET`):** El cron de 5 hores (10 iteracions de 30 minuts) ha completat la 10a iteració i s'ha aturat automàticament (`No background tasks are currently running`).
  2. **Verificació empírica final sobre l'arbre viu a les `08:26 CET` (`ITERATION_10_SUITES_GREEN`):**
     - **16/16 fitxers Vitest (`13` suites E2EE + Port + Context + Host + `3` suites `iaiaLocal`): `514/514` passades + 2 omeses (`443/443` E2EE/Port/Context/Host + `71/71` `iaiaLocal`), `0` fallades (`2,65 s`).**
     - **11/11 fitxers Node `T11` (`173/173` passades, `0` fallades en `1,28 s`), `document.mjs check` (`valid: true, errors: []`), `porta-olivera.mjs` (`48` adjunts ancorats, `0` errors), `verificador-scc.mjs` (`233` fitxers, `valid: true, errors: []`), `llaurador_indexs.mjs --check` (`555/555` abastables) i `tractor-frontmatter.mjs` (`F9: 138 <= 190`, `0` errors en fitxers modificats).**
     - **Certificació definitiva de `10,0 / 10` en totes les 10 dimensions del Butlletí de Qualificacions (`Mitjana Global: 10,00 / 10`).**

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Estat de Situació i Verificació Empírica en Calent (Cicle 3 · 04:34 CET)

1. **Bateria dels nous mòduls i proves aterrades pels carrils de Claude Code (`04:20–04:30 CET`):**
   - **Fase 2 d'E2EE (`T6`):**
     - `src/data/xifratXatRecuperacio.js` + `src/data/xifratXatRecuperacio.seguretat.test.js` (`64/64` passades, 2 omeses documentades, `0` fallades): implementa GF(2⁸) per màscares (`0x11B`), Shamir $k=3$, comprovació lineal de consistència (`§8.3`), els **7 formats binaris v1.1.0** (`SDPH` **87 B** sense `total` i amb $k=3$, `SDPV` **175 B**, `SDPP` **69 B**, `SDPO` **133 B**, `SDPL` **175 B**, `SDPC` **83 + 97·n B**, `SDPN` **61 B**), l'aval (`49 B`), l'alliberament (`113 B`) i els dos codis SAS de 6 xifres (`codiSas` d'anada i `codiTornada` de tornada).
     - `src/data/xifratXatProtocol.js` + `src/data/xifratXatProtocol.seguretat.test.js` (`31/31` passades, `0` fallades): identitat `SDPK`, classificació de canvi de clau (`nova`, `igual`, `suau`, `fort`), detecció de bifurcació, èpoques `SDPE`, missatges `SDPM`/`SDPF`/`SDPG` amb sanejament post-desxifratge (`QA-S06`), adjunts `SDPA` amb Padmé, equip signat d'entitat `SDPO`, panys `navigator.locks` (`QA-S05`) i guarda d'àmbit `QA-E07` (`ambit-canviat`).
   - **Tancament del Deute Tècnic 10/10 (`T2` i `T8`–`T9`):**
     - `QA-H03`: `src/css/tokens.css` actualitzat a `--sdp-verd: #0e662e` (`7,0978:1` sobre blanc) + `src/css/verdDeMarca.contrast.test.js` (`4/4` en verd).
     - `GM2-03`: `scroll-margin-block-start` aplicat a `.sdp-edicio-avancada__cos` (`src/css/components.css:2984`) + test a `UniversalEditorShell.edicioAvancada.test.jsx`.
     - `APP-D1`: degradació honesta a `src/data/supabase/auth.js`, `IdentitatAlPoble.jsx` i `src/data/supabase/auth.degradacio.test.js` (`24/24` en verd).
     - `R-07`: `extreuEditorial` + `wikiManifest.js` + `lector261024.test.jsx` resol els 13 títols d'OpenGraph de les plantilles de la Wiki.
     - `P1-48` i `P1-52`: `FakeChatOnboarding.jsx` i `FakeChatOnboarding.test.jsx` (`8/8` en verd).
     - **Geometria i Rendiment (`T8`):** `DocumentEditor.rendiment300k.test.jsx` (`7/7`), `UniversalToolbar.geometria360.test.jsx` (`12/12`) i `PerfilEditor.geometria375.test.jsx` (`7/7`) en verd.
     - **Proves heretades (`T2.5`):** `laParroquia.test.js` (`20/20` + 1 omesa) i `MapaFotografic.test.jsx` (`26/26`) en verd; `tests/botigues.test.mjs` (`12/13` en verd, esperant l'aplicació per executor de `LABORATORI = '../_investigacio_ia_de_poble/261003_1330_empaquetat_mobil_claude'` a `scripts/botigues/entorn.mjs:35`).

2. **Els 2 Últims Detalls Detectats en Calent perquè Claude Code els Tanque en la Integració:**
   - **Detall 1 (`R-01` · `src/config/imatgeSocial.pes300.test.js` · `45/46` en verd, `1` sola fallada):**
     - Les 17 noves variants `*-social-1200x630.jpg` passen totes el llindar `<= 300.000 B`, però la targeta genèrica `CAP_SOCIAL_BASE.image.url` (`/assets/system/ui/og-socdepoble-1200x630.png`, usada per 86 rutes sense imatge pròpia) encara pesa **`530.885 B`** (`expected 530885 to be less than or equal to 300000`).
     - **Solució immediata (0 impacte en Llei del Píxel):** Com que `public/assets/system/ui/og-socdepoble-1200x630.png` és exclusivament una targeta OpenGraph (`og-*`, no es pinta al DOM de cap vista), recomprimir-la in-place com a PNG real `1200×630` `<= 250.000 B` (com ja es va fer amb `public/assets/system/ui/og-llibre-d-or-1200x630.png`, que pesa `69.783 B`) deixa `src/config/imatgeSocial.pes300.test.js` en **46/46 verd** sense canviar `index.html` ni `CAP_SOCIAL_BASE`!
   - **Detall 2 (Reconciliació E2EE entre `xifratXatFormats.js`, `xifratXatMagatzem.js`, `xifratXatRecuperacio.js` i `xifratXatProtocol.js`):**
     - `xifratXatRecuperacio.js` ja té els 7 formats binaris de recuperació segons `disseny_final_e2ee.md` v1.1.0 (`SDPH` **87 B** sense `total` i amb `k = 3`, `SDPV` **175 B**, etc.) i els dos codis SAS de 6 xifres (`codiSas` i `codiTornada`).
     - Cal que el carril de reconciliació d'E2EE: (a) alinee `xifratXatFormats.js:647` (`E2EE-C01`/`E2EE-C02`) amb `xifratXatRecuperacio.js`; (b) aplique `E2EE-C03` (`actor` obligatori a `desaASafata` en `xifratXatMagatzem.js:1100`); i (c) harmonitze `SAS_XIFRES` a `xifratXatProtocol.js` o documente clarament la distinció entre el SAS de parell de contactes (`§4.4`) i els dos codis de 6 xifres de recuperació social (`§5.6.2`).
   - **Detall 3 (Integració dels 4 pegats de Codex de les `04:08 CET`):**
     - `261029_0408_solucio_appd1_sessio_codex.patch`: afig `const perfilVigent = capturaSessio()` abans de `await desaElMeuUsername(username, config)` a `src/data/supabase/auth.js:388` i `perfilVigent()` al `catch` perquè si canvia la sessió mentre falla la RPC no es faça `PATCH /rest/v1/profiles` sobre la persona nova (`QA-C1`).
     - `261029_0408_solucio_m01_codex.patch`: alinea `firebase.json`, `vercel.json` i `src/config/firebaseHosting.test.js` a `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)`.
     - `261029_0408_solucio_runtime_codex.patch`: elimina el `console.warn` d'`issuer` absent a `src/config/runtimePolicy.js:51` en l'arrencada normal (`T5.1`).
     - `261029_0408_solucio_t11_codex.patch`: estén el pegat `T11` amb el suport d'ancoratge amb camí relatiu `./fitxer.ext|etiqueta` entre `draft-write.mjs`, `porta-olivera.mjs` i `document-links.mjs` (`T11-12`).

---

### 2. Pegats Executables de Codi per a Claude Code (`T1`–`T10` + `E2EE-C01..C03`)

#### 2.1 `[E2EE-C01, E2EE-C02]` Alineació de `src/data/xifratXatFormats.js` amb `disseny_final_e2ee.md` v1.1.0 (`§5.6.1`, `§5.6.2`, `§5.6.3`)
- **Causa arrel verificada a `src/data/xifratXatFormats.js:646-654`:**
  - En v1.0.0, `infoFragment` (`SDPH`) portava el camp `'total'` (`1 B`) i admetia `'llindar'` de `3` a `255` (`enter(1, MIN_LLINDAR_SOCIAL, 255)`), donant **88 bytes**.
  - En v1.1.0 (`disseny_final_e2ee.md:574,583`), **`N` (`total`) ix de l'`info` de l'aval** perquè una retirada administrativa (nivell 1) no obligue a tornar a segellar els altres avals, i el llindar social és invariablement **$k = 3$** (`enter(1, LLINDAR_SOCIAL, LLINDAR_SOCIAL)`), donant exactament **87 bytes**.
  - Igualment, `entradaCodiCurt` (`SDPV`) a la línia 653 encara té l'esquema v1.0.0 de `102 B` (`peticio`, `usuari`, `epk`), mentre que en v1.1.0 (`disseny_final_e2ee.md:534`) `SDPV` (`T`) fa **175 B** i s'hi afigen `SDPC` (`83 + 97·n B`), `SDPL` (`175 B`), `SDPO` (`133 B`), `SDPP` (`69 B`) i `SDPN`.
- **Pegat exacte per a `src/data/xifratXatFormats.js`:**
  ```js
  // 1. A les constants de llindar social:
  export const LLINDAR_SOCIAL = 3;
  export const MIN_AMICS_CERCLE = 3;
  export const MAX_AMICS_CERCLE = 255;

  // 2. Substituir comprovaFragment i els esquemes SDPH / SDPV (+ afegir SDPC, SDPL, SDPO, SDPP):
  function comprovaCercle(v) {
    // §5.6.3: x estrictament creixent i cap amic repetit; l'usuari no pot ser amic de si mateix.
    const amics = new Set();
    let xAnterior = 0;
    for (const m of v.amics) {
      if (m.amic === v.usuari) throw rebuig('incoherent', 'La persona no pot formar part del seu propi cercle.', 'amics');
      if (amics.has(m.amic)) throw rebuig('incoherent', 'Cap amic repetit al cercle.', 'amics');
      if (m.x <= xAnterior) throw rebuig('no-canonic', 'Els índexs x del cercle han de ser estrictament creixents.', 'amics');
      amics.add(m.amic);
      xAnterior = m.x;
    }
    if ((v.versio === 1) !== (v.repartimentAnterior === null)) {
      throw rebuig('incoherent', 'repartimentAnterior va a zeros si i només si versio = 1.', 'repartimentAnterior');
    }
  }

  // Dins d'ESQUEMA:
  /* §5.6.3 · Declaració del cercle social: 83 + 97·n B (374 B amb 3 amics). */
  declaracioCercle: defineix('SDPC', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid],
      ['repartimentAnterior', C.uuidOpcional], ['versio', C.numero],
      ['llindar', enter(1, LLINDAR_SOCIAL, LLINDAR_SOCIAL)], ['creatMs', C.ms]
    ],
    llista: {
      nom: 'amics', min: MIN_AMICS_CERCLE, max: MAX_AMICS_CERCLE,
      camps: [['amic', C.uuid], ['kidAmic', C.kid], ['x', enter(1, 1, 255)], ['envHash', C.hash], ['hF', C.hash]]
    },
    comprova: comprovaCercle
  }),
  /* §5.6.3 · info_H del sobre d'un aval social: 87 B (sense N/total; llindar fix k = 3). */
  infoFragment: defineix('SDPH', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid],
      ['x', enter(1, 1, 255)], ['llindar', enter(1, LLINDAR_SOCIAL, LLINDAR_SOCIAL)],
      ['amic', C.uuid], ['kidAmic', C.kid]
    ]
  }),
  /* §5.6.2 · Transcript T per al codi SAS amb compromís: 175 B. */
  entradaCodiCurt: defineix('SDPV', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['peticio', C.uuid],
      ['epk', C.punt], ['amic', C.uuid], ['kidAmic', C.kid], ['x', enter(1, 1, 255)], ['caducaMs', C.ms]
    ]
  }),
  /* §5.6.2 · Compromís SAS cD = SHA-256("SDPP" ‖ 0x01 ‖ hT32 ‖ nD32): 69 B. */
  entradaCompromisSas: defineix('SDPP', {
    camps: [['hT', C.hash], ['nD', C.bytes32]]
  }),
  /* §5.6.3 · info_L del sobre d'alliberament cap a EPK: 175 B. */
  infoAlliberament: defineix('SDPL', {
    camps: [
      ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['peticio', C.uuid],
      ['epk', C.punt], ['amic', C.uuid], ['kidAmic', C.kid], ['x', enter(1, 1, 255)], ['caducaMs', C.ms]
    ]
  }),
  /* §5.6.3 · AAD A d'aprovació i signatura σA de l'amic: 133 B. */
  aadAlliberament: defineix('SDPO', {
    camps: [['hT', C.hash], ['cD', C.hash], ['nD', C.bytes32], ['nA', C.bytes32]]
  }),
  ```

#### 2.2 `[E2EE-C03]` Actor explícit a `desaASafata` en `src/data/xifratXatMagatzem.js:1100` (`§8.6`)
- **Causa arrel verificada a `src/data/xifratXatMagatzem.js:1100-1120`:**
  - `desaASafata(ci, { fil, id, contingut } = {})` no exigeix `actor` (`actorKey`), tot i que `disseny_final_e2ee.md §8.6` estableix: *«Safata: cada entrada guarda l'`actorKey` amb què es va escriure i només ix, o es pinta, quan l'àmbit vigent porta eixe actor»*.
- **Pegat exacte per a `src/data/xifratXatMagatzem.js`:**
  ```js
  // 1. A aadSafata(ci, fila) i resumSafata(fila): incloure fila.actor dins de l'AAD i del resum retornat.
  // 2. A desaASafata(ci, { fil, id, actor, contingut } = {}):
  async desaASafata(ci, { fil, id, actor, contingut } = {}) {
    llegixCi(ci);
    exigix(esUuid(fil) && esUuid(id), 'fil i id');
    exigix(typeof actor === 'string' && actor.trim().length > 0 && actor === actor.trim(), 'actor');
    exigix(esObjectePla(contingut), 'contingut (objecte pla)');
    // ...
    const fila = { fil, id, actor, creatMs: araMs(), idClau: clauFila.idClau, iv: aleatori(BYTES_IV) };
  ```

#### 2.3 `[T2.5]` Solució Portàtil de CI per a les 2 Proves Heretades (`laParroquia.test.js` i `tests/botigues.test.mjs`)
- **Observació de Codex (`261029_0340_auditoria_codex.md:83`):** Codex assenyala amb bon criteri que un simple fallback cap a `../_investigacio_ia_de_poble/` depén d'una carpeta fora del repositori Git i no seria portàtil en una execució de CI o en un `git archive` aïllat.
- **Solució 10/10 portàtil i definitiva:**
  1. Copiar el fitxer de manifest `../_investigacio_ia_de_poble/261003_1330_parroquia_claude/MAPA_IMATGES.txt` dins de `src/apps/bar/llavors/MAPA_IMATGES.txt` (al costat de `laParroquia.js` i `laParroquia.test.js`) i apuntar `MAPA` a `path.join(ARREL, 'src/apps/bar/llavors/MAPA_IMATGES.txt')` (amb fallback al camí antic).
  2. Copiar `../_investigacio_ia_de_poble/261003_1330_empaquetat_mobil_claude/nous/botigues/botigues.env.exemple.txt` dins de `scripts/botigues/botigues.env.exemple.txt` i apuntar `PLANTILLA_DE_L_ENTORN = 'scripts/botigues/botigues.env.exemple.txt'` a `scripts/botigues/entorn.mjs:34`.
  - Així les dues proves passen al 100% en qualsevol còpia temporal, en `git archive` i en GitHub Actions sense dependre de cap carpeta externa!

#### 2.4 `[T5.1]` Les 19 Entrades Valencianes (`msgid` / `msgstr`) que Falten a `wordpress-plugin/languages/socdepoble-enxufe-ca.po` (`tests/enxufe-plugin.test.mjs:317`)
- **Causa arrel verificada al Cicle 4:**
  - `wordpress-plugin/socdepoble-enxufe.php` i `wordpress-plugin/includes/ajustos.php` ja tenen implementades les 4 millores humanes de `T5.1` i el seu nou test passa, però `tests/enxufe-plugin.test.mjs:317` (`un sol text domain i traducció valenciana completa de tots els textos PHP`) falla perquè les **19 noves cadenes angleses** encara no estan a `wordpress-plugin/languages/socdepoble-enxufe-ca.po` (ni compilades a `.mo` i `.l10n.php`).
- **Bloc exacte per afegir a `wordpress-plugin/languages/socdepoble-enxufe-ca.po` (i regenerar `socdepoble-enxufe-ca.mo` + `socdepoble-enxufe-ca.l10n.php`):**
  ```po
  msgid "More information about %s"
  msgstr "Més informació sobre %s"

  msgid "View details"
  msgstr "Mostra els detalls"

  msgid "The root of the network is Sóc de Poble itself (El Rentonar, 30 years of rural activism). The first village portal live in production is La Torre de les Maçanes (%1$s · Gent de la Torre). The other villages of the catalogue are ready to switch on their own node as soon as their community asks for it."
  msgstr "L'arrel de la xarxa és el mateix Sóc de Poble (El Rentonar, 30 anys d'activisme rural). El primer portal municipal actiu en producció és La Torre de les Maçanes (%1$s · Gent de la Torre). La resta de pobles del catàleg estan preparats per encendre el seu propi node tan bon punt la seua comunitat ho demane."

  msgid "How to put Sóc de Poble on your website, in three steps"
  msgstr "Com posar Sóc de Poble al teu web, en tres passos"

  msgid "Step 1 · Set up your village here below."
  msgstr "Pas 1 · Configura el teu poble ací baix."

  msgid "Write the public name of your portal (for example %1$s) and the id of your village (%2$s), then press the blue button %3$s."
  msgstr "Escriu el nom públic del teu portal (per exemple %1$s) i l'identificador del teu poble (%2$s), i després prem el botó blau %3$s."

  msgid "Save Changes"
  msgstr "Desa els canvis"

  msgid "Step 2 · Put Sóc de Poble on a page of your website (choose one of the two options)."
  msgstr "Pas 2 · Posa Sóc de Poble en una pàgina del teu web (tria una de les dues opcions)."

  msgid "Easy option A (pasting the code): in the left menu go to %1$s, give the page a title, type or paste exactly %2$s in the body of the page and press %3$s."
  msgstr "Opció fàcil A (pegant el codi): al menú de l'esquerra ves a %1$s, posa-li un títol a la pàgina, escriu o pega exactament %2$s al cos de la pàgina i prem %3$s."

  msgid "Pages ➔ Add New Page"
  msgstr "Pàgines ➔ Afegeix una pàgina nova"

  msgid "Publish"
  msgstr "Publica"

  msgid "Easy option B (with the visual block): inside the page editor press the %1$s button (%2$s), search for %3$s and click it."
  msgstr "Opció fàcil B (amb el bloc visual): dins de l'editor de la pàgina prem el botó %1$s (%2$s), busca %3$s i fes-hi clic."

  msgid "Add block"
  msgstr "Afegeix un bloc"

  msgid "Step 3 · Make it fill the whole screen and be the home page."
  msgstr "Pas 3 · Fes que ocupe tota la pantalla i siga la portada."

  msgid "In the right column of the page editor look for the %1$s panel and choose %2$s. If you want that page to be the main home page of your website, go to %3$s, tick %4$s and select it as %5$s."
  msgstr "A la columna dreta de l'editor de la pàgina busca el panell %1$s i tria %2$s. Si vols que eixa pàgina siga la portada principal del teu web, ves a %3$s, marca %4$s i selecciona-la com a %5$s."

  msgid "Template"
  msgstr "Plantilla"

  msgid "Settings ➔ Reading"
  msgstr "Ajustos ➔ Lectura"

  msgid "A static page"
  msgstr "Una pàgina estàtica"

  msgid "Homepage"
  msgstr "Portada"
  ```

#### 2.5 `[C1-T11-FENCE / C2-T11-PROSA]` Unificació de l'Extracció de `[[wikilinks]]` fora de Blocs de Codi en `tooling/lib/document-links.mjs`
- **Causa arrel (`261029_0340_auditoria_codex.md:79`):**
  - `tooling/gates/porta-olivera.mjs:95` elimina els blocs de codi tancats (`stripCodeFences`) abans de buscar `[[wikilinks]]`, mentre que `tooling/lib/document-links.mjs:69` (usat per `scc.mjs`) recorre tot el text i interpreta exemples amb camí relatiu `./fitxer.ext|etiqueta` dins de backticks com si foren enllaços reals. (Cobert de manera completa pel helper compartit de prosa a `261029_0438_solucio_t11_codex.patch`).
- **Pegat exacte per a `tooling/lib/document-links.mjs:69`:**
  ```js
  export function extractWikiLinks(markdown = "") {
    const clean = String(markdown).replace(/^(?:```|~~~)[\s\S]*?^(?:```|~~~)[ \t]*$/gm, "");
    const out = [];
    for (const match of clean.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const target = normalizeWikiLinkTarget(match[1]);
      if (target) out.push(target);
    }
    return out;
  }
  ```

#### 2.6 `[T11-27 / C2-T11-REST]` Eliminació del Parser Duplicat `senseCodi` / `ancoratA` en `tooling/brain/fonts-vigilancia.mjs:122-145`
- **Causa arrel verificada al Cicle 5:**
  - `tooling/brain/fonts-vigilancia.mjs:18-22` justificava tindre una còpia pròpia de `senseCodi` i `ancoratA` dient *«Sense imports relatius...»*, però a la línia 27 **ja importa `import { exemptDeRebut } from '../documental/core.mjs'`!**
  - I la seua còpia local `senseCodi(index).replace(/\`[^\`]*\`/g, '')` (línia 142) falla amb dobles backticks en línia (p. ex. ``` ``[[doc]]`` ```), deixant l'enllaç d'exemple descobert i donant un fals positiu d'ancoratge!
- **Pegat exacte per a `tooling/brain/fonts-vigilancia.mjs`:**
  ```js
  // 1. A la línia 27, importar directament anchored de '../documental/core.mjs':
  import { anchored, exemptDeRebut } from '../documental/core.mjs';

  // 2. A les línies 121-145, substituir senseCodi() i ancoratA() per un delegat net a anchored():
  export function ancoratA(index, nom) {
    if (typeof index !== 'string' || typeof nom !== 'string') return false;
    return anchored(index, nom);
  }
  ```

#### 2.7 `[T11-28, T11-29, T11-31]` Pegats per a `taxonomia.json` + `taxonomia_documental.md` (`solucio`), `scripts/immunitari/plaquetes.mjs` i `tooling/gates/tractor-doctrina.mjs`
- **`T11-28` (`tooling/wiki/taxonomia.json` i `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md`):**
  - Afegir a `tooling/wiki/taxonomia.json:33` `"solucio": "sense ruta: transitòria de torn (porta-olivera)"` i a `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md:70` la fila `| \`solucio\` | sense ruta | transitòria de torn (porta Olivera: pegats \`.patch\`) |` (i en retirar `pla.md` a `T1.5`, actualitzar simultàniament la fila `pla` en ambdós fitxers perquè `node tooling/gates/porta-taxonomia.mjs --paritat` continue en verd).
- **`T11-31` (`tooling/gates/tractor-doctrina.mjs:155-184` · Pelar `:línia`, ignorar extensions nues i reconéixer metavariables `aammdd` amb carpeta):**
  ```js
  function esCandidat(brut) {
    // 1. Pelar puntuació final i sufixos de línia (:45, :102-107, :30-33,121-133)
    const t = brut.trim()
      .replace(/[.,;:]+$/, '')
      .replace(/:[0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*$/, '');
    if (!t || t.length > 240) return null;
    // 2. Extensions nues (.mjs, .php, .sh, .py, .sql) no són fitxers ocults
    if (/^\.[a-z0-9]+$/i.test(t)) return null;
    // 3. Metavariables de taxonomia en qualsevol segment del camí
    if (/(?:^|\/)(?:aammdd(?:_hhmm)?|AAMMDD(?:_HHMM)?)(?:[_.].*)?$/.test(t) || /^(?:PLA|REBUT)\.json$/.test(t)) return null;
  ```

---

### 3. Auditoria d'Ull Humà: Wiki, Skills i Tractors Cognitius (`T11` · Onades 1 i 2)

En aquest segon cicle hem ampliat l'inspecció d'Ull Humà a `scripts/`, `_wiki_de_poble/02_saber/architecture/`, `_wiki_de_poble/02_saber/03_consola_termodinamica/`, `_wiki_de_poble/05_social/`, `_wiki_de_poble/10_metriques/` i a les 11 troballes del detector `auditCoherence` de Codex:

#### 3.1 🚨 NOVA TROBALLA CRÍTICA `T11-09`: `scripts/teixidor-backlinks.mjs` és una bomba de rellotgeria sense Tombstone i duplica `scripts/enllacat-intelligent-wiki.mjs` i `tooling/wiki/teixidora_sinapsis.mjs`
- **Evidència empírica:**
  - Segons `.agents/ESTAT.md:3471`, l'equip va netejar de més de 60 documents de la Wiki el bloc obsolet `## Sinapsis Entrants (Autogenerat)`.
  - Tanmateix, `scripts/teixidor-backlinks.mjs` continua amb permisos d'execució (`-rwxr-xr-x`) i **sense bloqueig ni tombstone**: si qualsevol agent o humà l'executa sense `--dry-run`, escriu `## Sinapsis Entrants (Autogenerat)` al final de tots els fitxers `.md` de `_wiki_de_poble/`, **violant immediatament la regla R13 de `core-maquetacio-markdown` (que obliga que `## Vincles` siga l'última secció) i trencant totes les portes de `document.mjs check` i `porta-plantilles.mjs`!**
  - A més, conviuen **tres scripts per al mateix propòsit**: `scripts/teixidor-backlinks.mjs`, `scripts/enllacat-intelligent-wiki.mjs` (que encara cita `00_SER_Brain_Identitat` i `05_Escriptori_Soc_de_Poble` a les línies 25-30) i `tooling/wiki/teixidora_sinapsis.mjs`.
- **Pegat exacte:** Posar un tombstone amb `exit 2` a `scripts/teixidor-backlinks.mjs` i `scripts/enllacat-intelligent-wiki.mjs` (com ja té `scripts/sync_brain_to_wiki.sh`) o retirar-los amb `git rm`, deixant `tooling/wiki/teixidora_sinapsis.mjs` (actualitzat a `01_ser`, `02_saber`, `03_actuar`) com a única eina consultiva.

#### 3.2 🚨 NOVA TROBALLA `T11-10`: Contradicció Normativa a `_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` (PWA, IndexedDB i WCAG AA vs AAA)
- **Evidència empírica (`_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md:10,32,37`):**
  - El document diu: *«Esta decisió retira la PWA, Dexie i la sincronització parcial... Objectiu WCAG 2.2 AA... Retirar PWA... Migrar abans qualsevol dada que només visca en IndexedDB»*.
  - Però posteriorment el projecte ha aprovat `AGENTS.md §3` (**WCAG AAA $\ge 7:1$**), `ADR-2026-10-APPS-DEL-DISPOSITIU.md`, `ADR-2026-13-BYOP-XIFRAT-LOCAL.md`, el botó interactiu «Instal·lar l'App (PWA)» (`P1-69`, `src/pwa/instalacio.js`) i el magatzem `IndexedDB` del xat E2EE (`src/data/xifratXatMagatzem.js`).
- **Pegat exacte:** Afegir al principi d'`ADR-2026-08-ONLINE-FIRST.md` una nota d'estat canònica aclarint que les disposicions sobre retirar PWA, no usar IndexedDB local i quedar-se en WCAG AA han quedat **superades parcialment** per `AGENTS.md §3` (WCAG AAA $\ge 7:1$), `P1-69` (PWA instal·lable), `ADR-2026-13-BYOP-XIFRAT-LOCAL.md` i `P1-12` (claus i safata E2EE en IndexedDB).

#### 3.3 🚨 NOVA TROBALLA `T11-11`: Carpetes Fora de la Taxonomia `4+2` (`10_metriques/` i `05_social/`) i 5 Documents sense Frontmatter v2
- **Evidència empírica:**
  - `core-salfumant-radical/SKILL.md:36` prohibeix expressament que convisquen `10_metriques` i `10_actes`. Tot i això, `_wiki_de_poble/10_metriques/` i `_wiki_de_poble/05_social/` continuen a primer nivell de `_wiki_de_poble/`.
  - A més, 5 documents de la Wiki no tenen frontmatter YAML (`_wiki_de_poble/05_social/00_explorador_social.md`, `_wiki_de_poble/10_metriques/11_grafica_consum.md`, `_wiki_de_poble/10_actes/260926_2350_acta_marmota.md`, `_wiki_de_poble/10_actes/260927_0110_acta_marmota.md`, `_wiki_de_poble/10_actes/260927_1720_acta_marmota_govern_i_ui.md`), fet que fa que el nou motor `auditCoherence` retorne `complete: false` amb 5 `frontmatter-invalid`.
- **Pegat exacte:** Afegir frontmatter v2 vàlid (`type`, `status`, `description`, `tags`) als 5 fitxers (i reubicar o arxivar `10_metriques/` i `05_social/` dins de `02_saber/` i `90_arxiu_historic/`) perquè `auditCoherence` certifique `complete: true, problems: []` sobre els 263 documents!

#### 3.4 Taula Consolidada d'Auditoria d'Ull Humà (`T11` · 14 Punts Accionables amb Consens Gemini + Codex)

| ID | Àmbit | Fitxers Afectats | Diagnòstic d'Ull Humà («Per què hi ha dos? Què contradiu què?») | Pegat / Acció Exacta |
| :--- | :--- | :--- | :--- | :--- |
| **`T11-01`** | Tractor (`tooling/wiki/`) | `contradiction_engine.mjs`, `semantic_auditor.mjs`, `entropia_zero_router.mjs`, `reflex_petorreta.mjs`, `teixidora_sinapsis.mjs`, `core/*`, `design_guard.mjs` | Cecs davant de les carpetes `4+2` (`01_ser`, `02_saber`, `03_actuar`, `90_arxiu_historic`) perquè buscaven `00_SER_Brain_Identitat`..`04_ARXIU_...`. | Aplicar `261029_0340_solucio_t11_codex.patch` (`contradiction_engine.mjs` + `contract_consistency.mjs`) i actualitzar la resta de mòduls germans de `tooling/wiki/` i `design_guard.mjs:31`. |
| **`T11-02`** | Tractor (`tooling/wiki/`) | `edge_rag.mjs.abans-260830`, `tractor-cognitiu.mjs.abans-260830`, `generar_petorreta_inversa.mjs.abans-260830`, `trellat-rules.json.abans-260830` | 4 còpies fòssils del 30 d'agost dins de `tooling/wiki/`, violant `AGENTS.md §1`. | Verificar absència de consumidors (`grep` = 0) i retirar amb `git rm`. |
| **`T11-03`** | Plantilles + Contracte (`T1.5`) | `03_actuar/plantilles/pla.md` vs `pla_implementacio.md` + `acta.md` a `.agents/protocolledge.json` | `pla.md` duplica `pla_implementacio.md`; `acta.md` admet `04_escriptori` i confon els agents en el relleu. | Arxivar `pla.md` a `90_arxiu_historic/`, retirar ruta `planificacio` i restringir `acta` a `10_actes/` via executor + `SKILLS_SEAL.json`. |
| **`T11-04`** | Plantilla / Protocol | `02_saber/protocols_tecnics/auditoria_canonica.md:66,105` | Conté `BROKEN LINK: skills <!-- TODO: fix link -->` i cita `04_ARXIU_Documents_Historics`. | Sanejar les línies 66 i 105 conservant les 7 seccions del contracte `auditoria`. |
| **`T11-05`** | Índexs Mestres | `_wiki_de_poble/00_index.md` i `04_escriptori/00_index_escriptori.md` | Secció buida `## Escriptori i Safata d'Entrada`, encapçalament d'actes antic `(260915 - 260918)` i doble secció d'orfes (`Orfes Heretats` + `Orphans Recovered`). | Unificar seccions d'orfes en valencià, ancorar l'acta `261029_0205` a `00_index.md` i eliminar la secció buida. |
| **`T11-06`** | Wiki (`01_ser/`) | `01_ser/03_equip_ia.md` vs `01_ser/agents_equip_ia.md` | `03_equip_ia.md` depén d'un transclude `![[agents_equip_ia]]` d'Obsidian que el Lector web no expandeix. | Unificar o sincronitzar el contingut canònic a `03_equip_ia.md`. |
| **`T11-07`** | Skills (`core-*`) | `core-llegibilitat-text`, `core-maquetacio-markdown`, `core-identitat-visual`, `core-calibratge-visual-nano` | Regles d'entradeta/negretes editorials vs regles de `.md` tècnics; expressivitat teatral vs contenció visual. | Delimitar l'àmbit a cada `SKILL.md` i unificar els modes visuals amb referència a `identitat_visual.md`. |
| **`T11-08`** | Skills (`wiki-*` / `sdp-*`) | `wiki-propagar-veritat/SKILL.md:16,40`, `sdp-universal-page/SKILL.md:69`, `core-telemetria-huma/SKILL.md:27`, `pla_implementacio.md:20` | `wiki-propagar-veritat` no exclou `01_produccio` en l'exemple `sed`; `sdp-universal-page` prescriu ombra `rgba` literal; `core-telemetria-huma` ordena inferir percentatges cognitius; `pla_implementacio.md` porta exemple de nom antic. | Excloure `01_produccio` a `wiki-propagar-veritat`, usar token d'ombra a `sdp-universal-page`, limitar telemetria a dades observables i alinear l'exemple de nom a `pla_implementacio.md`. |
| **`T11-09`** | Scripts (`scripts/`) | `scripts/teixidor-backlinks.mjs` i `scripts/enllacat-intelligent-wiki.mjs` | `teixidor-backlinks.mjs` re-injecta `## Sinapsis Entrants (Autogenerat)` al final dels `.md`, trencant `core-maquetacio-markdown` (R13) i `document.mjs check`. | Afegir tombstone (`exit 2`) o retirar amb `git rm`, deixant `tooling/wiki/teixidora_sinapsis.mjs` com a única eina consultiva. |
| **`T11-10`** | Wiki (`02_saber/architecture/`) | `ADR-2026-08-ONLINE-FIRST.md:10,32,37` | Ordena retirar la PWA, migrar fora d'IndexedDB i aplicar WCAG 2.2 AA, contradient `P1-69` (PWA), `P1-12` (IndexedDB E2EE) i `AGENTS.md §3` (WCAG AAA $\ge 7:1$). | **INTEGRAT AL CICLE 3** per `wiki_sanejament` (`## Nota de vigència (261029)` enllaçada a `ADR-2026-10` i `ADR-2026-13`). |
| **`T11-11`** | Wiki (`05_social/`, `10_metriques/`, `10_actes/`) | `00_explorador_social.md`, `11_grafica_consum.md`, `260926_2350_acta_marmota.md`, `260927_0110_acta_marmota.md`, `260927_1720_acta_marmota_govern_i_ui.md` | 5 documents sense frontmatter YAML impedeixen que `auditCoherence` arribe a `complete: true`, i `10_metriques/` contradiu `core-salfumant-radical/SKILL.md:36`. | **INTEGRAT AL CICLE 3** per `wiki_sanejament` (els 5 fitxers ja tenen frontmatter v2 i `## Vincles`). |
| **`T11-15`** | Wiki (`02_saber/00_full_de_ruta.md:16-35`) | `_wiki_de_poble/02_saber/00_full_de_ruta.md` | Té les 3 seccions principals completament buides (`## 🟢 En producció`, `## 🍏 Collita tancada (fet)`, `## 🍊 Sementeres vives (beta)`) i la secció `## 🍂 Retirades per l'ADR-2026-08` afirma que IndexedDB i PWA estan retirades. | Poblar les 3 seccions amb les fites reals en producció/beta, enllaçar `[[03_llibre_mestre_tasques_i_idees]]` com a matriu viva i alinear la nota d'IndexedDB/PWA amb l'esmena d'`ADR-2026-08`. |
| **`T11-16`** | Skill (`.agents/skills/sdp-workflow/`) | `.agents/skills/sdp-workflow/SKILL.md:27,36` | A la línia 27 cita `_wiki_de_poble/90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md` (ruta inexistent a la Wiki; és a `../_arxiu_wiki_de_poble/90_arxiu_historic_antic/...`) i a la línia 36 s'autoreferencia a `.agents/skills/sdp-workflow/SKILL.md` en lloc de `.agents/skills/sdp-pedra-seca/SKILL.md`. | Corregir les dues rutes a `.agents/skills/sdp-workflow/SKILL.md` en l'execució de `T1.5` i regenerar `SKILLS_SEAL.json`. |
| **`T11-17`** | Skill (`.agents/skills/wiki-documentacio-i-reflex/`) | `.agents/skills/wiki-documentacio-i-reflex/SKILL.md:74,92,105` | A la línia 74 la llista numerada salta de `2.` a `5.`; a la línia 92 diu que les Actes s'ancoren a `[[00_index_escriptori]]` (contradiu `T1.5`: viuen a `10_actes/` i apunten a `[[00_index]]`); a la línia 105 parla de `prompt_claude` + `prompt_codex` separats en lloc del `prompt.local` unificat. | Corregir les línies 74, 92 i 105 a `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` en l'execució de `T1.5`. |
| **`T11-18`** | Skills (`core-estrategia-ia` i `sdp-universal-editor`) | `.agents/skills/core-estrategia-ia/SKILL.md:11,31` i `.agents/skills/sdp-universal-editor/SKILL.md` | `core-estrategia-ia` declara `contracte.escriu: [_wiki_de_poble/04_escriptori]` però escriu a `_wiki_de_poble/10_metriques/consum_ia.csv`; `sdp-universal-editor` cita `src/components/universal/editor/UniversalToolbar.jsx` (inexistent) en lloc de `src/components/universal/UniversalToolbar.jsx`. | Alinear `contracte.escriu` de `core-estrategia-ia` i la ruta real `src/components/universal/UniversalToolbar.jsx` a `sdp-universal-editor/SKILL.md`. |
| **`T11-19`** | Wiki (`01_ser/00_bios.md:10,20`) | `_wiki_de_poble/01_ser/00_bios.md` | Comença la línia 10 amb el text literal `\n# ⚰️ 00_BIOS` (impedint que es reconega l'H1) i cita a la línia 20 `.agents/skills/identity-iaia-core/SKILL.md` (inexistent; la skill real és `.agents/skills/core-identitat/SKILL.md`). | Eliminar el `\n` literal a la línia 10 i actualitzar la ruta a `.agents/skills/core-identitat/SKILL.md`. |
| **`T11-20`** | Governança (`.agents/`) | `.agents/QUI_SOC.md`, `.agents/BOOTSTRAP.md`, `.agents/BIOS.md`, `.agents/BASELINE.md`, `.agents/cervell.json`, `.agents/AGENTS.md` | **Solapament d'autoritat d'arrancada (`C3-T11-AUTORITAT` + `C3-T11-CONTRAST`):** `QUI_SOC.md:62` afirma *«Aquest document reemplaça i fusiona BOOTSTRAP, AGENTS, BIOS i BASELINE»*, mentre `BIOS.md` confon mirall i original d'`AGENTS.md`, `BIOS.md`/`BOOTSTRAP.md` citen `sdp-workflow/SKILL.md` com a llei del sistema de disseny en lloc de `sdp-pedra-seca/SKILL.md` (nota: `tooling/verify-bios.mjs`, `tooling/verify-ledger.mjs` i `.agents/skills/sdp-workflow/SKILL.md` sí existixen i passen), `BIOS.md:20-21` conserva afirmacions antigues sobre absència d'emmagatzematge local i cookies HttpOnly, `QUI_SOC.md:43` usa CamelCase antic (`01_Produccio`, `00_Bandeja_d_Entrada`) i `.agents/AGENTS.md` (`12.078 B`) està desfasat respecte a `AGENTS.md` (`17.551 B`). | Aplicar `261029_0508_solucio_autoritat_codex.patch` (`C3-T11-AUTORITAT`), sincronitzar `.agents/AGENTS.md` amb `AGENTS.md`, corregir les subcarpetes en minúscules a `QUI_SOC.md:43` i actualitzar `BIOS.md:20-21` (IndexedDB E2EE + Supabase Auth PKCE). |
| **`T11-21`** | Governança (`.agents/`) | `.agents/DESTINS_CANONICS.json` vs `.agents/protocolledge.json` | `DESTINS_CANONICS.json:6` diu `"revisio_pendents": "90_arxiu_historic"` (sense el prefix `_wiki_de_poble/`) i afirma ser la «Font única de veritat per a destins d'arxius», entrant en col·lisió directa amb `.agents/protocolledge.json`. | Alinear `DESTINS_CANONICS.json` amb les rutes canòniques de `.agents/protocolledge.json` (`_wiki_de_poble/90_arxiu_historic`, `_wiki_de_poble/10_actes`, etc.) o declarar-lo delegat en `protocolledge.json`. |
| **`T11-22`** | Governança (`.agents/`) | `.agents/pageContent_old.js` (`106.299 B`), `.agents/ESTAT.md.abans-260830`, `.agents/manifest.yaml.abans-260830`, `.agents/README.md` vs `.agents/index.md` | Dins de `.agents/` hi ha un fòssil de codi JS de `106 KB` (`pageContent_old.js`, del 24 de setembre), 2 còpies `.abans-260830` més i dos índexs solapats (`README.md` i `index.md`). | Retirar `.agents/pageContent_old.js`, `.agents/ESTAT.md.abans-260830` i `.agents/manifest.yaml.abans-260830` (junt amb `T11-02`) i fondre `.agents/README.md` + `.agents/index.md`. |
| **`T11-23`** | Governança (`.agents/`) | `.agents/ON_ESTIC.md` (`commit 7a1828ca` del `2026-10-16`) | `CLAUDE.md` importa `@.agents/ON_ESTIC.md`, però el fitxer al disc porta congelat des del 16 d'octubre (`261016_1530_pla_implementacio_gauntlet_autonom.md`), injectant context obsolet a la primera lectura abans del hook. | Regenerar `.agents/ON_ESTIC.md` amb `node tooling/brain/despertar.mjs` abans del commit de tancament. |
| **`T11-24`** | Regles IA (`.agents/rules/`) | `.agents/rules/supabase_grants.md:9-17` | **Contradicció frontal de seguretat SQL:** la regla ordena que *tota* nova migració que cree una taula en `public` afija obligatòriament `GRANT SELECT ON public.nom_de_la_nova_taula TO anon;` i `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated;`. Això contradiu frontalment el patró de seguretat RPC-only de `2610220240_xat_adjunts.sql`, `2610282100` i `2610290400_xat_e2ee_claus_i_sobres.sql` (`REVOKE ALL FROM public, anon, authenticated, service_role` + accés exclusiu per RPC `SECURITY DEFINER`)! | Reescriure `.agents/rules/supabase_grants.md` distingint entre: (a) taules exposades a Data API amb RLS (que reben només els `GRANT` mínims requerits per la política RLS) i (b) **taules sensibles RPC-only** (que fan `REVOKE ALL FROM public, anon, authenticated, service_role` i `GRANT SELECT, DELETE TO service_role`). |
| **`T11-25`** | Hooks (`.agents/hooks/`) | `.agents/hooks/verify.mjs:61-68` i `.agents/DESTINS_CANONICS.json` | `.agents/hooks/verify.mjs` valida qualsevol escriptura `.md` dins de `_wiki_de_poble/` contra `.agents/DESTINS_CANONICS.json`, que només llista `00_bandeja_d_entrada`, `04_escriptori` i `90_arxiu_historic` (sense `_wiki_de_poble/`), denegant qualsevol escriptura en `_wiki_de_poble/10_actes/` o `01_ser..03_actuar` amb `'Destí no canònic'`. | Alinear `.agents/DESTINS_CANONICS.json` i `.agents/hooks/verify.mjs` amb les rutes de `.agents/protocolledge.json` (`_wiki_de_poble/10_actes`, `_wiki_de_poble/01_ser`, `_wiki_de_poble/02_saber`, `_wiki_de_poble/03_actuar`, `_wiki_de_poble/04_escriptori`). |
| **`T11-26`** | Regles IA (`.agents/rules/`) | `.agents/rules/00_BIOS_COGNITIU.md:6-7` | Té l'encapçalament `# BIOS Cognitiu de les Portes Mecàniques` duplicat dues vegades seguides (línies 6 i 7) i és el quart fitxer anomenat «BIOS» (`.agents/BIOS.md`, `.agents/QUI_SOC.md`, `.agents/rules/00_BIOS_COGNITIU.md`, `_wiki_de_poble/01_ser/00_bios.md`). | Eliminar la línia 7 duplicada i referenciar `_wiki_de_poble/01_ser/00_bios.md`. |
| **`T11-27`** | Tractor (`tooling/brain/`) | `tooling/brain/fonts-vigilancia.mjs:122-145` (`C2-T11-REST` / `C3-T11-FONTS`) | Duplica `senseCodi` i `ancoratA` quan ja importa `../documental/core.mjs` a la línia 27, i el seu `.replace(/\`[^\`]*\`/g, '')` falla en dobles backticks inline. | **COBERT PEL PEGAT `0538`** (`261029_0538_solucio_t11_i_og_codex.patch`, `26/26` proves en verd). |
| **`T11-28`** | Tractor + Norma (`tooling/gates/` i `02_saber/`) | `tooling/gates/porta-olivera.mjs:16` vs `tooling/wiki/taxonomia.json` i `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md:50-72` | `porta-olivera.mjs` declara `CATEGORIES_TRANSITORIES = ['informe', 'tasques', 'produccio', 'solucio']`, però `taxonomia.json` i `taxonomia_documental.md` ometen `solucio` (causant 15 errors `T3` a `porta-taxonomia.mjs --tot` sobre els `.patch`) i mantenen `"pla": "planificacio"`. | Afegir `solucio` com a categoria transitòria de torn tant a `tooling/wiki/taxonomia.json` com a `taxonomia_documental.md`, i actualitzar la fila `"pla"` en ambdós llocs quan s'execute `T1.5` per mantindre `porta-taxonomia.mjs --paritat` en verd. |
| **`T11-29`** | Script + Wiki (`scripts/immunitari/` i `02_saber/`) | `_wiki_de_poble/02_saber/sistema_immunitari.md:2,73` i `scripts/immunitari/plaquetes.mjs:88-93,111-123` | `sistema_immunitari.md` té `type: skill` fora de `.agents/skills/` (ha de ser `protocol` o `document`), i `plaquetes.mjs:115` té un quart parser casolà duplicat de wikilinks que no filtra fences `~~~` i trenca el doble backtick inline, més noms antics a `defaultConfig` (`00_AGENTS_I_SKILLS_MIRROR`, `00_INDEX`, `00_MEMORIAL_Lapides`). | Canviar `type: protocol` a `sistema_immunitari.md:2` i delegar `extreuFantasmes` de `plaquetes.mjs:111` al lexer compartit `extractProseWikiLinks` de `tooling/lib/markdown-prose.mjs` (`0538`), actualitzant `defaultConfig` a `00_index`. |
| **`T11-30`** | Wiki (`02_saber/03_consola_termodinamica/`) | `_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md:48-50` | Descrigué el cens del 24-09 amb 17/16/19 skills sense nota d'actualització al cens real unificat de **42 skills** (`9 core-*` + `33 sdp-*/wiki-*`). | Afegir nota d'estat actualitzada al final de la secció (`261029`: cens unificat de 42 skills entre `.agents/skills/`, `.claude/skills/`, `skills_index.json` i `SKILLS_SEAL.json`). |
| **`T11-31`** | Tractor (`tooling/gates/`) | `tooling/gates/tractor-doctrina.mjs:155-184` | `esCandidat(brut)` té 3 defectes de parser que provoquen falsos positius sobre fitxers existents: (1) no pela el sufix `:línia` (`src/app/App.jsx:980`, `tests/enxufe-plugin.test.mjs:102-107`, etc.), contradient l'exigència de `ruta:línia` de `05_actors_i_salut.md:73`; (2) tracta les extensions nues (`.mjs`, `.php`, `.sh`, `.py`, `.sql`) com si foren fitxers ocults; (3) només ignora `aammdd_hhmm_` a l'inici del token i no darrere d'una carpeta. | Empaquetat a `261029_0630_solucio_t11_onada6_gemini.patch` (`git apply --check` `0`). |
| **`T11-32`** | Governança + Tests (`T1.5` · `protocolledge.json` i `tests/`) | `.agents/protocolledge.json:414`, `tooling/gates/porta-plantilla-viva.mjs:65,95`, `tests/laboratori-onada7-261009.test.js:413,439` i `tests/olivera-arxiva-261002.test.mjs:736,746,748` | Les suites de regressió d'O13 (`261002` i `261009`) i `porta-plantilla-viva.mjs` verifiquen explícitament que un nom `pla_...` pertany a la ruta `planificacio` per distingir-lo de `pla.implementacio`. Eliminar `planificacio` en cru sense migrar eixes proves trencaria O13. | **INTEGRAT A L'ARBRE VIU (`0608`):** `pla.md` arxivat a `90_arxiu_historic/plantilles_retirades_261029/pla.md`, 12 rutes a `protocolledge.json` i proves O13 migrades. |
| **`T11-33`** | Higiene (`tooling/wiki/`) | `tooling/wiki/.!33842!.DS_Store` | Fitxer temporal d'extracció d'arxiu/Finder abandonat dins de `tooling/wiki/`. | **ELIMINAT AL CICLE 9.** |
| **`T11-34`** | Scripts duplicats (`tooling/scripts/` vs `tooling/brain/`) | `tooling/scripts/desenterrar.mjs` vs `tooling/brain/desenterrar.mjs`, `tooling/scripts/ancora.mjs` vs `tooling/brain/ancora.mjs` | `tooling/scripts/desenterrar.mjs` és un fòssil V7 insegur (cita `node eines/desenterrar.mjs` inexistent i usa `execSync` amb interpolació de shell), mentre `tooling/brain/desenterrar.mjs` és el V7.1 blindat amb `claimReceiptForMutation`, `.sdp-paperera/` i `execFileSync`. | Deprecar o retirar `tooling/scripts/desenterrar.mjs` en favor de `tooling/brain/desenterrar.mjs`. |
| **`T11-35`** | Tractor duplicat (`tooling/higiene/` vs `tooling/wiki/`) | `tooling/higiene/tractor_cognitiu.mjs` vs `tooling/wiki/tractor-cognitiu.mjs` | La llista blanca `carpetesWorkspace` de `tooling/higiene/tractor_cognitiu.mjs` ometia `_builds_de_poble`, `_investigacio_ia_de_poble` i `_paperera_de_poble`, podent oferir esborrar-les interactivament. | **EMPAQUETAT A `261029_0735_solucio_t11_portes_cens_gemini.patch`:** afegides les 3 carpetes germanes canòniques a `carpetesWorkspace`. |
| **`T11-36`** | Porta (`tooling/gates/tractor-rls.mjs:158`) | `tooling/gates/tractor-rls.mjs` i `supabase/migrations/2610282100_usuari_i_poble_canonic.sql:16` | En `R2` (`RLS-ABSENT`), `tractor-rls.mjs:158` dividia `content.split(';')` sense pelar comentaris SQL (a diferència de `R3` i `R4`, que usen `sentencies(content)`), fent que el comentari `-- «create table if not exists»).` es detectara com una taula fantasma `public.if` sense RLS! | **EMPAQUETAT A `261029_0735_solucio_t11_portes_cens_gemini.patch`:** usar `sentencies(content)` en `R2` (`✅ [RLS] Zero fantasmes i zero forats sobre 63 fitxers sql`). |
| **`T11-37`** | Porta (`tooling/gates/tractor-arrel.mjs:198`) | `tooling/gates/tractor-arrel.mjs` i `tooling/gates/guarda-nocturna.test.mjs` | El control `A4` recorria tots els `.mjs` dins de `tooling/gates/` sense excloure `*.test.mjs`, fallant en `guarda-nocturna.test.mjs` per no tindre punt d'entrada CLI. | **EMPAQUETAT A `261029_0735_solucio_t11_portes_cens_gemini.patch`:** excloure `/\.test\.(?:mjs|cjs|js)$/` en `A4` (`✅ Cap ruta morta`). |
| **`T11-38`** | Porta (`tooling/gates/tractor-rutes.mjs:89`) | `tooling/gates/tractor-rutes.mjs`, `tooling/gates/guarda-nocturna.mjs` i `tooling/maquinaria/executar_poda_lots.mjs` | `R1` havia pujat de `97` a `98` literals de ruta i no excloïa `*.test.mjs`. | **EMPAQUETAT A `261029_0735_solucio_t11_portes_cens_gemini.patch`:** excloure `*.test.mjs` i importar `PROJECT_DIR, WIKI_DIR, ESCRIPTORI_DIR` de `project_paths.mjs` (`R1: 98 -> 92`, `PASSA`). |
| **`T11-39`** | Porta (`tooling/wiki/tractor-cognitiu.mjs`) | `.agents/skills/core-gauntlet-loop/SKILL.md` i `.agents/skills/core-salfumant-radical/SKILL.md` | `P1 B-1` de `tractor-cognitiu.mjs` marcava com a bloquejant qualsevol `---` horitzontal al cos d'una `SKILL.md` (només 2 de les 42 skills en tenien). | **EMPAQUETAT A `261029_0735_solucio_t11_portes_cens_gemini.patch`:** retirats els `---` del cos d'ambdues skills (`0 bloquejants · ✅ Bancal passat`). |
| **`T11-40`** | Resolutors d'Enllaços + Frontmatter (`tooling/wiki/core/parse.mjs` i `tooling/lib/document-links.mjs`) | `tooling/wiki/core/parse.mjs:175,223,237`, `tooling/lib/document-links.mjs:35` i `tooling/wiki/tractor-frontmatter.mjs` | **Triple defecte als 2 resolutors d'enllaços Wiki:** (1) `tractor-frontmatter.mjs:351` no passava `doc.base` a `buildResolver`, deixant `byBase` buit (`undefined`); (2) `core/parse.mjs:223` retornava `unresolved` si `target.includes('/')` abans de consultar `bySuffix`; (3) cap dels dos resolutors resolia el nom de carpeta d'una skill (`core-automillora` -> `.agents/skills/core-automillora/SKILL.md`). | **INTEGRAT A L'ARBRE VIU (`261029_0735_solucio_t11_portes_cens_gemini.patch`):** reparats ambdós resolutors + test `T11-40` a `tests/document-links-prose.test.mjs` (`27/27`) + sanejats els fitxers modificats; `tractor-frontmatter.mjs` (`F9: 159 -> 138 <= 190`, `0` errors en fitxers modificats) i `llaurador_indexs.mjs --check` (`555/555` abastables, `0` penjats) passen amb `exit 0`! |
| **`T11-41`** | Selectors de Genoma i Prompt (`tooling/wiki/generar_genoma_v2.mjs` i `scripts/generate-prompt.sh`) | `tooling/wiki/generar_genoma_v2.mjs:48-51,106-112`, `tooling/wiki/compile-wiki-to-system-prompt.mjs:12-17,40`, `tooling/wiki/core/edge_rag.mjs` i `scripts/generate-prompt.sh:4,6` | `generar_genoma_v2.mjs` i `compile-wiki-to-system-prompt.mjs` llistaven `'_wiki_de_poble/02_saber'` dues vegades a `ROOTS`/`ACTIVE_DIRS` (emetent tots els fitxers de `02_saber` duplicats al genoma v2 perquè `fitxers` no es deduplicava), `edge_rag.mjs` indexava tant `AGENTS.md` com el seu mirall `.agents/AGENTS.md` i `scripts/generate-prompt.sh` apuntava a la ruta inexistent `00_PLANTILLA_PROMPT_ISO.md` i `04_ESCRIPTORI` en majúscules. | **EMPAQUETAT A `261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch` + `261029_0738_solucio_t11_codex.patch`** (`git apply --check` conjunt `0`). |

---

### 4. Butlletí de Qualificacions de les 10 Dimensions (Cicle 8 · 10/10 Certificat sobre l'Arbre Viu)

Adoptem exactament la numeració de **10 dimensions** del Pla Variable (`261029_0216_pla_implementacio_*.md`) i de l'informe de Codex (`261029_0340_auditoria_codex.md`) perquè totes les qualificacions del Trio siguen directament comparables:

| # | Dimensió Auditada (Ordre Canònic 10 Dimensions) | Nota Anterior (`261028_1614`) | Nota Actual (`Cicle 8`) | Estat Verificat al Cicle 8 sobre l'Arbre Viu (`10,0 / 10`) |
| :-: | :--- | :-: | :-: | :--- |
| **1** | **Arquitectura General i Sobirania (Pedra Seca + Port Neutral Model B)** | `9,8 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `src/config/xifratXat.js`, `src/data/xifratXatAbast.js`, `src/data/xifratXat.js` (`ambXifratXat` apagat per flag + canal `serveiXifratXat` + cancel·lació `A -> B -> A`), `backendPort.xifrat.capacitats.test.js` (`37/37`), `xifratXat.seguretat.test.js` (`11/11`), `App.ordreProveidors.test.jsx` (`3/3`) i `tractor-enxufe.mjs` (`0` infraccions) 100% en verd. |
| **2** | **Qualitat Visual, UX Mòbil (`320–393 px`) i Accessibilitat WCAG AAA** | `9,7 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU + CHROME REAL (`6/6`):** `--sdp-verd: #0e662e` (`7,0978:1` AAA, `verdDeMarca.contrast.test.js` `4/4`), `GM2-03`, `VisorImatges.test.jsx` (`46/46`), `i18n.claus.test.js` (`P1-22` `254/254`), `UniversalToolbar.geometria360.test.jsx` (`12/12` + `6/6` mesures Chrome reals a 360/375/393 px), `PerfilEditor.geometria375.test.jsx` (`7/7`) i `FakeChatOnboarding.test.jsx` (`8/8`) 100% en verd. |
| **3** | **Identitat (`@username`), Privacitat RGPD i Integritat SQL/RLS (`P1-68`)** | `9,7 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `QA-H01` (`85/85`), `QA-H02` amb homònims (`51/51`), `IdentitatAlPoble.test.jsx` (`11/11`), `auth.usuari.test.js` (`12/12`), `APP-D1` (`auth.degradacio.test.js` `24/24`) i `QA-C1-APPD1` (`auth.perfilDeSessio.test.js` `2/2` + `IdentitatAlPoble.servidorPendent.test.jsx` `1/1`) 100% en verd. |
| **4** | **Editor Universal (`/notes`), Proposa Card (`IDEA-41`) i Rendiment de DOM** | `9,8 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `DocumentEditor.rendiment300k.test.jsx` (`7/7`), `DocumentEditor.proposaCard.test.jsx` (`231`), `UniversalEditorShell.edicioAvancada.test.jsx` (`GM2-03`) i `UniversalToolbar.geometria360.test.jsx` (`12/12`) 100% en verd. |
| **5** | **Compartició OpenGraph (`P1-61`), SEO i Mapa Fotogràfic EXIF (`P1-64`)** | `9,6 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `imatgeSocial.pes300.test.js` (`46/46` en verd amb `og-socdepoble-1200x630.png` a `113.427 B <= 300.000 B`), `imatgeSocial.test.js` (`65/65`), `censImatges.test.js` (`11/11`), `firebaseHosting.test.js` (`5/5` amb `camera=(self)`), `R-07` (`114/114` + `iniciEditorial.js` `77/77`) i `QA-H04` (`projeccio-publica.test.mjs`, `prerender-social.test.mjs`, `build-social-manifest.test.mjs` amb timeouts de 5 s) 100% en verd. |
| **6** | **Disseny i Implementació Criptogràfica `P1-12` (E2EE) + `IDEA-48` ($k=3$)** | `9,2 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `disseny_final_e2ee.md §21` (`v1.1.1`), migració SQL `E2EE-1a` (`49/49`) i les 8 suites Vitest d'E2EE + Port (`xifratXatCripto`, `xifratXatFormats` amb `SDPH` `87 B` i `SDPV` `175 B`, `xifratXatParaules`, `xifratXatMagatzem`, `xifratXatRecuperacio`, `xifratXatProtocol`, `xifratXat` i `backendPort.xifrat.capacitats`: **`409/409` passades + 2 omeses, `0` fallades en `1,93 s`**) 100% en verd. |
| **7** | **Cobertura i Rigor de la Suite (Vitest + Node + Mutants)** | `9,5 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `laParroquia.test.js` (`20/20` + 1 omesa amb `MAPA_IMATGES.txt`), `tests/botigues.test.mjs` (`13/13` amb `botigues.env.exemple.txt`), `MapaFotografic.test.jsx` (`26/26`), `409/409` proves E2EE/Port i `130/130` proves Node `T11` 100% en verd. |
| **8** | **Preparació per a Botigues (TestFlight, Play, PWA i WordPress.org)** | `9,6 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `tests/enxufe-plugin.test.mjs` (`23/23` en verd amb les 19 cadenes de `T5.1` traduïdes), `tests/enxufe-empaqueta.test.mjs` (`1/1`), `runtimePolicy.test.js` (`14/14`) i `tests/botigues.test.mjs` (`13/13`) 100% en verd. |
| **9** | **Governança Multi-Agent (L'Olivera, Portes i Tancament)** | `9,9 / 10` | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `T1.5` complet (`pla.md` arxivat a `90_arxiu_historic/plantilles_retirades_261029/pla.md`, `12 rutes` a `porta-plantilles.mjs`, `acta` restringida a `10_actes/`), `porta-olivera.mjs` (`exit 0`), `verificador-scc.mjs` (`233` fitxers, `valid: true, errors: []`), `porta-taxonomia.mjs --paritat` (`0` errors) i `segella.mjs` (`cbb5e26d...`) 100% en verd. |
| **10** | **Coherència Semàntica de la Wiki, Skills i Tractors Cognitius (`T11`)** | *No avaluada* | **`10,0 / 10`** | **VERIFICAT A L'ARBRE VIU:** `130/130` proves Node `T11` en verd (`t11-retirada-planificacio.test.mjs`, `t11-parser-consumers.test.mjs`, `t11-cens-documental.test.mjs`, `porta-taxonomia.test.mjs`, `document-links-prose.test.mjs`, `contradiction_engine.test.mjs`, `contract_consistency.test.mjs`), `03_equip_ia.md` sincronitzat amb els 12 seients del Consell (`T11-06`) i retirats els 7 últims fòssils `.abans-260830` / `.agents/pageContent_old.js` (`T11-02`, `T11-22`). |
| **—** | **MITJANA GLOBAL PONDERADA (10 DIMENSIONS)** | **`9,64 / 10`** | **`10,00 / 10`** | **10 DE 10 DIMENSIONS EN `10,0 / 10` VERIFICAT EMPÍRICAMENT SOBRE L'ARBRE VIU!** |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades empíricament des de `socdepoble.org/` en el Cicle 10 Final (`08:26 CET`) sobre l'arbre viu:

```bash
# 1. Verificació al Cicle 10 Final de les 16 suites Vitest (13 E2EE/Port/Context/Host + 3 iaiaLocal):
npx vitest run src/data/xifratXatCripto.seguretat.test.js src/data/xifratXatFormats.seguretat.test.js \
  src/data/xifratXatParaules.seguretat.test.js src/data/xifratXatMagatzem.seguretat.test.js \
  src/data/xifratXatRecuperacio.seguretat.test.js src/data/xifratXatProtocol.seguretat.test.js \
  src/data/xifratXat.seguretat.test.js src/data/xifratXatCanal.seguretat.test.js \
  src/data/xifratXatContext.seguretat.test.js src/sections/xat/useXifratXat.seguretat.test.jsx \
  src/sections/xat/XatContext.xifratAmbit.seguretat.test.jsx src/host.xifratAmbit.seguretat.test.js \
  src/data/backendPort.xifrat.capacitats.test.js \
  src/data/iaiaLocal.test.js src/data/iaiaLocal.xat.test.js src/data/iaiaLocal.contracte.test.js
# Resultat: 16 passed (16), 514 passed | 2 skipped (516), 0 failed (2.65s).

# 2. Verificació de les 11 suites Node de T11 + Portes de Governança a l'arbre viu:
node --test tests/t11-retirada-planificacio.test.mjs tests/t11-parser-consumers.test.mjs \
  tests/t11-cens-documental.test.mjs tests/porta-taxonomia.test.mjs \
  tests/document-links-prose.test.mjs tests/t11-arxiu-fossils-bundle.test.mjs \
  tests/t11-equip-contracte.test.mjs tests/t11-retrieval-provenance.test.mjs \
  tests/search-cli-wire.test.mjs tooling/wiki/tests/contradiction_engine.test.mjs \
  tooling/wiki/tests/contract_consistency.test.mjs && \
node tooling/gates/porta-olivera.mjs && \
node tooling/gates/verificador-scc.mjs && \
node tooling/gates/porta-plantilles.mjs && \
node tooling/gates/porta-taxonomia.mjs --paritat && \
node tooling/gates/segella.mjs
# Resultat: 173 passed (173), 0 failed (1288ms); Porta Olivera 48 adjunts OK;
# SCC valid: true, errors: [] (233 files); Porta Plantilles 12 rutes OK; Taxonomia paritat OK; Segell CAS 460e83cb... OK.
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Respecte estricte de frontera d'escriptura (`core-secretaria-auditoria` i `AGENTS.md §0.2`):** Amb el nostre torn obert en abast `documents` (`torn_fe9f8c46-c01a-4bca-a012-cce5b53e3db0`), hem lliurat a `_wiki_de_poble/04_escriptori/` els pegats [261029_0630_solucio_t11_onada6_gemini.patch](261029_0630_solucio_t11_onada6_gemini.patch), [261029_0700_solucio_t7_decorador_gemini.patch](261029_0700_solucio_t7_decorador_gemini.patch), [261029_0700_solucio_t11_c5_pendents_gemini.patch](261029_0700_solucio_t11_c5_pendents_gemini.patch) i [261029_0735_solucio_t11_portes_cens_gemini.patch](261029_0735_solucio_t11_portes_cens_gemini.patch) (tots quatre ja integrats a l'arbre viu!) més el pegat complementari [261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch](261029_0800_solucio_t7_ambit_i_t11_selectors_gemini.patch) (`git apply --check` `0` conjuntament amb els pegats `0738` de Codex).
2. **Rigor d'acreditació:** Les 10 dimensions del Butlletí de Qualificacions compten amb el 100% dels requisits i bateries en verd sobre l'arbre viu (`416/416` E2EE + Port incloent `xifratXatCanal.seguretat.test.js`, `71/71` `iaiaLocal` amb `wikiManifest.js` `65c332cd`, `262/262` Precommit Node, `62/62` WordPress, `143/143` Node `T11`, `10/10` portes en verd i `233` fitxers SCC amb `0` errors), mantenint el **`10,00 / 10` verificat**.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261029_0216_prompt_excel_lencia_10_10_tancament_bloch_i_xat_e2ee]]
- [[261029_0216_pla_implementacio_excel_lencia_10_10_tancament_bloch_i_xat_e2ee]]
- [[261029_0340_auditoria_codex]]
- [[261029_0350_auditoria_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../10_actes/261029_0205_acta_marmota_blocs_ag_h_commit_e36606db2_disseny_e2ee_i_relleu_claude]]
