---
type: informe
status: esborrany
description: Auditoria integral de les 38 skills per a purgar anacronismes i contradiccions, destil·lació de les 49 entrades de 02_investigacio_ia i contrast tècnic del pla WebP i paquet WP.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:63de1da9-d3e1-4517-92de-2d36e4b61c12
---
# Auditoria Integral de Skills (.agents/skills/), Destil·lació del Laboratori IA i Contrast Adversarial del Pla WebP

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:63de1da9-d3e1-4517-92de-2d36e4b61c12 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T12:52:08.421Z |
| Modificació | 2026-10-19T12:52:08.421Z |
| Propietari | gemini-4-argon |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Antigravity / IAIA MarIA) |
| Tokens consumits | ~148.000 tokens (lectura 100% de 38 skills, 2 estudis de laboratori i pipeline multimèdia) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T12:52:08.421Z: Esborrany canònic creat i ancorat a `00_index_escriptori.md` mitjançant `tooling/wiki/document.mjs create`.
- 2026-10-19T14:53:00+02:00: Completada l'autòpsia mecànica de les **38 skills** de `.agents/skills/`, contrast de les **49 entrades físiques** de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (47 ítems excloent els 2 estudis de referència) i auditoria adversarial del pla `261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md` creuada en calent amb el relleu de Claude Code (`261019_1447_auditoria_claude_multimedia_webp.md`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum Executiu del Dictamen

1. **Bloc 1 — Auditoria Integral de les 38 Skills (`.agents/skills/`):** S'han auditat les 38 carpetes vives de `.agents/skills/` contra `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` i `.agents/rules/00_BIOS_COGNITIU.md`. S'han detectat **4 dessincronitzacions estructurals de portes mecàniques** (`cataleg_skills.mjs --check` falla ara mateix perquè falten `core-gauntlet-loop` i `core-seguretat-audit` a `.agents/manifest.yaml` i a `.claude/skills/`, i 4 skills tenen un `\n#` literal que trenca l'H1), **13 contradiccions doctrinals o anacronismes greus** (com la contradicció frontal de la icona de la **ploma** entre `sdp-universal-editor` i `sdp-pedra-seca`, un sed cec que va corrompre l'exemple de `wiki-propagar-veritat`, telemetria caducada del 24 de setembre a `core-consell-i-colmena` i una referència prohibida a `90_arxiu_historic/` dins `sdp-workflow`) i **5 violacions del BIOS §1** (literatura/metàfores dins tractors procedimentals).
2. **Bloc 2 — Destil·lació de `_wiki_de_poble/04_escriptori/02_investigacio_ia/`:** Dels 58 ítems censats el 13-10-2026 (`261013_1600_estudi_destil_laboratori_ia.md`), hui en queden **49 en disc** (35 carpetes i 14 fitxers solts; **47 ítems** descomptant els 2 estudis rectors). Els hem classificat amb precisió quirúrgica en:
   - **Categoria A (14 ítems):** 100% integrats a `src/` o `tooling/` i sense cap lligam actiu a tests; llestos per a trasllat immediat a la carpeta satèl·lit exterior `../_investigacio_ia_de_poble/`.
   - **Categoria B (24 ítems):** Integrats o destil·lats en aquest informe, però amb **precondició mecànica obligatòria** abans d'evacuar (6 carpetes tenen acoblament dur a tests de `tests/` o `src/apps/bar/llavors/laParroquia.test.js:35` que faria fallar `npm test` si es mouen sense deslligar, i 18 tenen comentaris al codi o àncores a `00_index_escriptori.md`).
   - **Categoria C (11 ítems):** Especificacions vives no substituïdes encara pel codi (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`, `CLAUDE-SECURITY-20261018-220519/`, Capacitor 8, Sistema d'Informes PDF, Sentinelles, Xylella, GnuCash i ERP Visual) que han de romandre vives o promoure's a `src/` i `tooling/`.
3. **Bloc 3 — Contrast Adversarial del Pla WebP (`261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md`):** El veredicte sobre la conversió híbrida (`maquinaria` Python/Pillow per a JPEG amb EXIF + `chrome` headless per a PNG amb alfa, costat llarg $\le 1600\text{ px}$ sense retallar cap imatge, qualitat 84) és **FAVORABLE AMB 6 ESMENES TÈCNIQUES CRÍTIQUES**. Hem demostrat matemàticament i sobre el codi que:
   - El fitxer `src/sections/multimedia/DetailMultimedia.jsx` citat al Pla (§3) **no existeix** (els components reals són `VisorDeLArxiu.jsx`, `MultimediaSection.jsx`, `VisorImatges.jsx` i `DetallMultimedia.jsx`).
   - El tractor `optimitzar_webp.mjs` **no esborra els originals** `.jpg`/`.png`, sinó que crea bessons `.webp`. Si es creen 125 `.webp` al costat dels originals sense regla de convivència o evacuació, `public/assets/` pujarà de **135 MB a 168 MB** i `src/sections/multimedia/censImatges.test.js` **fallarà immediatament** amb ~124 imatges "oblidades".
   - Fins i tot excloent `public/assets/uploads/` (93 MB), la resta de `public/assets/` pesa **35 MB** en PNG/JPG (`nano_cards` 13 MB, `ui` 6,1 MB, `towns` 5,6 MB, `fotos` 4,6 MB). Per tant, el paquet `build:wp:directori` només baixarà dels **10 MB** (`LIMIT_DIRECTORI`) si el plugin de Vite (`vite.standalone.config.js`) exclou tant `assets/uploads/` com els originals `.png`/`.jpg` que ja tenen bessó `.webp`, i si `src/config/assetResolver.js` resol les rutes d'`/assets/uploads/` cap a l'origen remot quan s'executa en WordPress.

---

### BLOC 1: Auditoria Integral de les 38 Skills (`.agents/skills/`)

#### 1.1. Dessincronitzacions Estructurals i Fallades de Portes Mecàniques

| ID | Fitxer / Àmbit | Severitat | Evidència Reproduïble | Font de Veritat Vulnerada | Acció Correctora Exacta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S-01** | `.agents/manifest.yaml` i `.agents/skills/00_INDEX_SKILLS.md` | **ALTA (Porta en roig)** | Executant `node tooling/brain/cataleg_skills.mjs --check` retorna `"ok": false` (exit code 1). `.agents/manifest.yaml` només llista 36 skills (falten `core-gauntlet-loop` i `core-seguretat-audit`) i `00_INDEX_SKILLS.md` té una descripció editada a mà per a `core-seguretat-audit` que difereix del seu frontmatter. | `tooling/brain/cataleg_skills.mjs` i `core-automillora/SKILL.md` §3.1 | Executar `node tooling/brain/cataleg_skills.mjs --escriu` per regenerar canònicament l'índex i el manifest amb les 38 skills. |
| **S-02** | `.claude/skills/` | **ALTA** | `.agents/skills/` conté 38 carpetes de skill, però `.claude/skills/` només té 36 symlinks: falten els enllaços simbòlics de `core-gauntlet-loop` i `core-seguretat-audit`. | `AGENTS.md` §1 i `.agents/manifest.yaml` (`claude_mirror: .claude/skills`) | Crear els 2 symlinks pendents a `.claude/skills/` apuntant a `../../.agents/skills/core-gauntlet-loop` i `../../.agents/skills/core-seguretat-audit`. |
| **S-03** | `sdp-app-grid-shell/SKILL.md:16`, `sdp-casos-us-essencials/SKILL.md:21`, `sdp-estudi-mercat/SKILL.md:18`, `wiki-propagar-veritat/SKILL.md:20` | **MITJANA** | Totes quatre skills tenen la seqüència literal d'escapament `\n# ` just després del tancament `---` del frontmatter, impedint que el parser Markdown reconega el títol `H1`. | `core-maquetacio-markdown/SKILL.md` (Regles R1 i R4: un sol H1 vàlid i línia en blanc neta) | Substituir `\n# ` per un salt de línia real seguit de `# ` en les 4 skills. |
| **S-04** | `.agents/rules/00_BIOS_COGNITIU.md:6-7` | **BAIXA** | El títol `# BIOS Cognitiu de les Portes Mecàniques` apareix duplicat en dues línies consecutives (línies 6 i 7). | `core-maquetacio-markdown/SKILL.md` (Regla R4: prohibit més d'un H1 per document) | Eliminar la línia 7 duplicada a `.agents/rules/00_BIOS_COGNITIU.md`. |

#### 1.2. Llista Negra d'Anacronismes, Contradiccions Doctrinals i Referències Mortes

A continuació es detallen, fitxer per fitxer i línia per línia, totes les frases obsoletes, contradiccions internes i cicatrius històriques que violen el principi d'estat present pur (BIOS §1):

1. **`sdp-universal-editor/SKILL.md` (Línies 27-29) — Contradicció Frontal sobre «La Ploma» i «La Barra Taronja»:**
   - **Text actual (contradictori i anacrònic):**
     > *"2. **L'Estat de la Ploma (Desament Silenciós)**:\n   - Mentre l'usuari està redactant o el document té canvis pendents de guardar, es mostra l'icona d'una **ploma** a la barra superior (on solia estar la 'i' d'informació).\n   - En el moment en què el sistema guarda automàticament els canvis en segon pla, la ploma **desapareix**."*
   - **Conflicte:** Contradictori al 100% amb la Regla Canònica del 28-09-2026 de `sdp-pedra-seca/SKILL.md` (línies 91-92) i `sdp-universal-page/SKILL.md` (línies 28-29): *"L'espai central és l'emoticona del document: en edició, sempre un botó (ploma blanca si no n'hi ha cap; l'emoticona triada si ja n'hi ha) que obri el selector d'emoticones. En lectura, l'emoticona es mostra fixa i, si no n'hi ha, l'espai queda buit. **La ploma només vol dir «tria una emoticona». L'autodesament fa servir el núvol (`CloudUpload`).**"* A més, conté l'anacronisme explícit *"(on solia estar la 'i' d'informació)"*.
   - **Esmena:** Reescriure el punt 2 de `sdp-universal-editor/SKILL.md` per alinear-lo amb `sdp-pedra-seca/SKILL.md` (`CloudUpload` per a l'autodesament; la ploma exclusivament com a selector d'emoticona en mode edició quan no n'hi ha cap definida) i suprimir la menció a *"on solia estar la 'i'"*.

2. **`wiki-propagar-veritat/SKILL.md` (Línies 20, 22, 26, 37) — Cicatriu d'un `sed` Cec que va Corrompre l'Exemple de la Pròpia Skill:**
   - **Text actual (corromput):**
     - Línia 22: *"Quan a Sóc de Poble prenem una decisió arquitectònica o de disseny que invalida una norma anterior (ex: canviem d'estratègia Online-First a online-first, o canviem un color base)..."*
     - Línia 26: *"Exemple: `dispositius moderns`, `Online-First`, `Online-First`."*
     - Línia 37: `find ./_wiki_de_poble -type f -name "*.md" -exec sed -i '' -e 's/dispositius moderns/dispositius moderns/g' {} +`
   - **Conflicte:** En una sessió passada es va llançar un `sed` global que va substituir `Offline-First` per `Online-First` i `iPad 2013` per `dispositius moderns` **dins de la pròpia skill**, deixant un comandament `sed` absurd que substitueix una cadena per si mateixa! A més, recomana un `sed` massiu cec sobre `_wiki_de_poble` sense excloure `90_arxiu_historic/` (que és immutable segons `AGENTS.md` §5).
   - **Esmena:** Restaurar un exemple sintètic segur (`TERME_ANTIC` -> `TERME_CANONIC`), afegir `-not -path "*/90_arxiu_historic/*"` al `find`, i obligar a passar `npm run salut:doc` després de qualsevol propagació.

3. **`core-consell-i-colmena/SKILL.md` (Línies 48-66) — Telemetria Efímera del 24 de Setembre i Nomenclatura `MACRO_BUNDLE` Morta:**
   - **Text actual (obsolet):**
     - Línia 50: *"La IAIA MarIA ha de crear sempre fitxers diferenciats per a IAs Macro o Micro (ex: `MACRO_PROMPT` o `MACRO_BUNDLE`)"*.
     - Línies 58-66 (`## 3. Estratègies de Consum i Gestió de Límits`): Conté percentatges reals d'una sessió del 20 de setembre (*"Estat actual: 22% del límit setmanal restant. Es reinicia en 4 dies i 2 hores (aproximadament el 24 de setembre)"*, *"Estat actual: Límit setmanal al 0% (exhaurit)... degradar l'esforç utilitzant Fable (Claude 3.5 Haiku)"*).
   - **Conflicte:** Viola `AGENTS.md` §2 i §6 (els fitxers a `04_escriptori/` usen sempre minúscules termodinàmiques `AAMMDD_HHMM_categoria_tema_autor.md` i està prohibit l'ús de `MACRO_BUNDLE` per a agents amb accés al disc). I congela dins d'una skill estructural l'estat de bateria d'un dia concret de setembre!
   - **Esmena:** Eliminar la secció 3 sencera (o deixar-la com a regla invariant sense percentatges ni dates fixes, unificant-la amb `core-estrategia-ia/SKILL.md`, d'on també cal netejar el `"15% restant"` de la línia 35) i substituir `MACRO_PROMPT` / `MACRO_BUNDLE` per la nomenclatura de `taxonomia_documental.md`.

4. **`sdp-workflow/SKILL.md` (Línies 27 i 36) — Punter Prohibit a `90_arxiu_historic/` i Autoreferència Circular:**
   - **Text actual:**
     - Línia 27: *"consultar l'índex a `_wiki_de_poble/90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md` per veure si necessitem... una Skill d'agent específica."*
     - Línia 36: *"aplicar estrictament els principis de disseny matemàtics descrits a `.agents/skills/sdp-workflow/SKILL.md` (Pedra Seca, 28px...)"*.
   - **Conflicte:** Línia 27 viola `AGENTS.md` §5 (*"MAI has de llegir `90_arxiu_historic/` en procediments automàtics"*) i apunta a un fitxer que ja ni existeix en eixa ruta. Línia 36 és un error d'autoreferència circular (ha d'apuntar a `.agents/skills/sdp-pedra-seca/SKILL.md`).
   - **Esmena:** Apuntar la línia 27 a `.agents/skills/00_INDEX_SKILLS.md` i la línia 36 a `.agents/skills/sdp-pedra-seca/SKILL.md`.

5. **`wiki-documentacio-i-reflex/SKILL.md` (Línies 25, 50-58, 74, 86-87, 112-117) — Contradicció amb `taxonomia.json` i Errors d'Enumeració/Maquetació:**
   - **Text actual:**
     - Línia 25: `## 1. La Llei d'Or dels Bundles (Antigament "Petorretes")`.
     - Línies 50-58: Afirma que *"Petorreta... NO forma part de la taxonomia oficial d'arxius"* i que *"Les categories formals vàlides a la taxonomia són exclusivament: `prompt`, `pla_implementacio`, `auditoria`, `acta`"*.
     - Línies 74 i 86-87: Llista numerada salta `1, 2, 5` i la següent repeteix `1, 2, 3, 4, 4`.
     - Línies 112-117: La secció `## Convocatòria i evidència de lectura` està col·locada **després** de `## Vincles`.
   - **Conflicte:** Contradictori amb `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (línies 50-72), `tooling/wiki/taxonomia.json` i `tooling/wiki/schema.json` (línia 30), on hi ha 19 categories vàlides d'escriptori (`prompt`, `bundle`, `petorreta`, `pla`, `pla_implementacio`, `estudi`, `auditoria`, `informe`, `acta`, `acta_marmota`, `brainstorming`, `missatge`, `resposta`, `ordre`, `ordres`, `correccio`, `requeriments`, `peticio`, `handoff`). A més, col·locar una secció després de `## Vincles` viola la Regla R13 de `core-maquetacio-markdown/SKILL.md`.
   - **Esmena:** Sincronitzar les categories amb `taxonomia_documental.md`, eliminar el rètol `(Antigament "Petorretes")`, corregir la numeració de llistes i moure `## Convocatòria i evidència de lectura` abans de `## Vincles`.

6. **`core-informes-pdf/SKILL.md` (Línia 38) — Dependència d'una Carpeta Temporal del Laboratori IA:**
   - **Text actual:** Apunta a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261012_0040_sistema_informes_claude/` com a ubicació dels generadors `generar_informe.py` i `generar_informe.mjs`.
   - **Conflicte:** Cap skill canònica de `.agents/skills/` pot dependre d'una subcarpeta de laboratori (`02_investigacio_ia/`) destinada a ser arxivada a `../_investigacio_ia_de_poble/`.
   - **Esmena:** Promoure `generar_informe.py`, `generar_informe.mjs` i els seus tokens a `tooling/pdf/` (o `tooling/informes/`) abans d'evacuar la carpeta del laboratori, i actualitzar la ruta a `core-informes-pdf/SKILL.md`.

7. **`core-memoria-historica/SKILL.md` (Línia 28) — Omissió de `90_arxiu_historic/` i de les Carpetes Satèl·lit Germanes:**
   - **Text actual:** Afirma que qualsevol document o paquet que surt de `_wiki_de_poble/` va *"sempre i únicament a `../_arxiu_wiki_de_poble/`"*.
   - **Conflicte:** Omet que els relleus operatius de l'Escriptori s'arxiven a `_wiki_de_poble/90_arxiu_historic/` via `porta-olivera.mjs --arxiva` (`AGENTS.md` §5), mentre que l'evacuació pesant a l'exterior es reparteix en les carpetes satèl·lit germanes (`../_arxiu_wiki_de_poble/`, `../_investigacio_ia_de_poble/`, `../_multimedia_de_poble/`).
   - **Esmena:** Alinear `core-memoria-historica/SKILL.md` amb `AGENTS.md` §5 i `core-higiene-escriptori/SKILL.md`.

8. **`core-restauracio-segellada/SKILL.md` (Línies 40-47, 102, 110, 148) — Cicatrius d'Absorció Històrica (`260831`):**
   - **Text actual:** Conté un bloc `> **FUSIÓ 260831.** Esta skill absorbix core-safe-restore...` i tres notes `*(absorbida en la fusió del 260831; vegeu Historial)*` que citen tres skills inexistents (`core-safe-restore`, `core-bounded-action`, `core-verified-change`).
   - **Conflicte:** Segons la directiva del Mestre i el BIOS §1, si una font anterior ja no existeix o va ser absorbida, s'han d'eliminar les mencions arqueològiques al cos operatiu (deixant només una línia neta a `## Historial`).

9. **`core-identitat/SKILL.md` (Línies 23 i 27) — Rètol d'Arqueologia Documental:**
   - **Text actual:** `## Secció Original: identity-iaia-core` i *"Tota la teua personalitat... s'han mogut a la Wiki per evitar contradiccions"*.
   - **Esmena:** Substituir per un encapçalament procedimental directe (`## 1. Punter Canònic d'Identitat`) sense història de migracions antigues.

10. **`core-edicio-segura/SKILL.md` (Línies 18 i 22) — Errata Tipogràfica i Confusió de Rol de MarIA:**
    - **Text actual:** Línia 18 narra l'incident de `NotaFitxa.jsx` del 24 de setembre; línia 22 té l'errata *"amb la para `auditoria`"* (per `paraula`) i dona instruccions a la IAIA MarIA per editar components `.jsx` de producció.
    - **Conflicte:** `core-automillora/SKILL.md` §2.1 i `core-consell-i-colmena/SKILL.md` §1 prohibeixen a MarIA tocar `src/` (responsabilitat de Claude Code i Codex).
    - **Esmena:** Corregir l'errata, adreçar la regla d'edició d'UI als executors de codi (Claude Code / Codex) i comprimir la referència històrica a una sola línia dins d'`## Historial`.

11. **`core-empaquetat-wp/SKILL.md` (Línies 30 i 44) vs `wordpress-plugin/eines/empaqueta.mjs` (Línies 572-578 i 680-683):**
    - **Text actual:** La skill diu que la variant del directori es desa a `wordpress-plugin/builds/directori/`, però `empaqueta.mjs:575-578` desa els **tres** ZIPs directament a `wordpress-plugin/builds/` amb el patró `${marca}_estatic_spa_v${versio}.zip`, `${marca}_wordpress_enxufe_v${versio}.zip` i `${marca}_wordpress_directori_v${versio}.zip` (`builds/directori/dist` és només el directori intermedi de compilació de Vite). A més, el bloc `AJUDA` d'`empaqueta.mjs:680-683` mostra encara el nom antic `socdepoble-spa-vX-AAMMDD_HHMM.zip`.
    - **Esmena:** Sincronitzar tant `core-empaquetat-wp/SKILL.md` com el text `AJUDA` d'`empaqueta.mjs` amb els noms reals dels 3 ZIPs.

12. **`sdp-estudi-mercat/SKILL.md` (Línies 52-53) i `sdp-calendari-agricola/SKILL.md` (Línies 24 i 35) — Violació del Model B (Sollutia vs Supabase):**
    - **Text actual:** `sdp-estudi-mercat` pregunta *"Què significa tot açò per al nostre codi i per al backend de Sollutia?"*; `sdp-calendari-agricola` parla de *"les taules core de Sollutia/Supabase"* i *"integrant-se a Sollutia"*.
    - **Conflicte:** Viola el **Model B** d'`AGENTS.md` §8: Sollutia és el servidor amfitrió i l'origen de lectura `GET` de la Frontissa, però el backend autoritatiu de Sóc de Poble és el nostre propi **Supabase** darrere de `src/services/backendPort.js`.
    - **Esmena:** Substituir *"backend de Sollutia"* per *"backend de Sóc de Poble (`backendPort.js` / Supabase) i la Frontissa amb Sollutia"*.

#### 1.3. Violacions del BIOS §1 (Literatura i Filosofia dins Tractors Procedimentals) i Buit d'Absorció del Laboratori

Segons `.agents/rules/00_BIOS_COGNITIU.md` §1 (*"Separació entre ser i verificar: la filosofia viu a `_wiki_de_poble/01_ser/02_genotip.md`; les portes comproven invariants mecànics"*), les següents skills contenen paràgrafs literaris que consumeixen tokens sense aportar cap regla executable:

- **`core-comprensio-reflexiva/SKILL.md` (Línies 16-23):** Repeteix la metàfora sencera d'*"El Problema de l'Aixada"* que ja viu canònicament a `02_genotip.md`. Cal reduir-ho a un punter d'1 línia cap a `[[02_genotip]]` i deixar només el checklist operatiu (Fase 1, 2 i 3).
- **`core-temps-termodinamic/SKILL.md` (Línies 21-29 i 59-61):** Eliminar la narrativa de *"L'Efecte TARDIS"* i *"La Promesa del Rellotger"*; conservar exclusivament la comanda `date "+%y%m%d_%H%M"`, el format `AAMMDD_HHMM` i l'invariant d'ordenació.
- **`wiki-documentacio-i-reflex/SKILL.md` (Línies 18-22):** Eliminar la metàfora cinematogràfica d'*"El Pilotatge del B-212 (Matrix)"* (Trinity i Neo).
- **`core-automillora/SKILL.md` (Línies 25-46):** Duplica l'explicació de la jerarquia de l'Olivera que ja és a `core-consell-i-colmena/SKILL.md`. Deixar-hi només el protocol d'edició i sincronització de `cataleg_skills.mjs`.
- **Lliçons pendents d'absorbir des del Laboratori IA cap a les Skills:**
  1. Dins `sdp-pedra-seca/SKILL.md`: Incorporar l'axioma de Kowalski/Apple WWDC18 (*"Clonar és copiar l'estructura, no l'estil"*, gestos redirigibles en vol i ressort críticament esmorteït $\zeta = 1$, sense rebots elàstics de joguina).
  2. Dins `sdp-app-grid-shell/SKILL.md`: Incorporar el patró extret per REA d'Obsidian 1.14.4 (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`): l'arbre d'espais amb partició vertical **5% / 90% / 5%** (`useTreeDragReorder.js`) i la substitució del `<Dialeg mida="s">` modal per una vista integrada (`WorkspaceSettingsPanel`) dins d'`UniversalWorkspace.jsx`.

---

### BLOC 2: Destil·lació dels Ítems de `_wiki_de_poble/04_escriptori/02_investigacio_ia/`

#### 2.1. Reconciliació del Cens Físic (58 ítems el 13-10 $\rightarrow$ 49 ítems hui en disc / 47 excloent els 2 estudis rectors)

L'estudi del 13 d'octubre (`261013_1600_estudi_destil_laboratori_ia.md`) va inventariar **58 entrades** (34 carpetes i 24 fitxers solts). Des d'aleshores:
- **11 fitxers solts ja van ser evacuats** del directori (`261002_0150_investigacio_plugins_claude.md`, `261002_1730_eines_disseny_ia.md`, `261004_0045_mcp_prompts_chat.md`, `261004_0045_skills_kowalski_impeccable.md`, `261010_2110_onada11_prompts_disseny.md`, `261010_2200_tractor_ortografia_valenciana.md`, `261011_0000_onada12_prompts_disseny.md`, `261011_0005_taxonomia_components_ui.md`, `261011_0025_analisi_llibre_ui_ux.md`, `261011_0030_ prompts_disseny_ui_ux_pro.md` i `261011_0045_prompts_disseny_llibres_2_i_3.md`). *Nota important per a l'Escriptori:* 5 d'aquests fitxers encara tenen àncores mortes a `00_index_escriptori.md` (línies 51, 68, 70, 71, 72) que cal netejar!
- **S'han afegit 2 ítems nous** posteriors al 13-10 (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md` i `CLAUDE-SECURITY-20261018-220519/`).
- Això deixa exactament **49 entrades vives en disc** (**47 ítems** a classificar si descomptem els dos estudis de referència `261013_1600_estudi_destil_laboratori_ia.md` i `261018_1405_estudi_obsidian_rea_gemini4_iaia.md`).

#### 2.2. Matriu de Classificació dels 49 Ítems per a l'Evacuació cap a `../_investigacio_ia_de_poble/`

##### Categoria A — Llestos per a Trasllat Immediat a `../_investigacio_ia_de_poble/` (14 ítems · 100% integrats a `src/` o `tooling/` i ZERO acoblament a tests)

| # | Entrada a `02_investigacio_ia/` | Destí Canònic on ja viu integrat | Acció Autoritzada |
| :--- | :--- | :--- | :--- |
| 1 | `001 NEXUS/` | Crèdit d'inspiració Emowe ja integrat a `src/sections/consola/mapa/grafMapa.js`. *(Alerta: conté `instalar.sh`, no executar mai).* | Moure a `../_investigacio_ia_de_poble/` |
| 2 | `260924_0200_skill_core_higiene_escriptori.txt` | Absorbit a `.agents/skills/core-higiene-escriptori/SKILL.md` (v4). | Moure a `../_investigacio_ia_de_poble/` |
| 3 | `260924_1410_tractors_claude/` | Absorbit a `tooling/tractors/time-machine.mjs`, `frontissa-contingut.mjs`, `porta-taxonomia.mjs` i `mapa-consola.mjs`. | Moure a `../_investigacio_ia_de_poble/` |
| 4 | `260924_1505_tractor_plantilles_claude/` | Absorbit a `tooling/gates/porta-plantilla-viva.mjs` i `tests/porta-plantilla-viva.test.mjs`. | Moure a `../_investigacio_ia_de_poble/` |
| 5 | `260924_1706_prototips_codex/` | Absorbit a `src/apps/plataforma/interruptors.js` (`INTERRUPTORS_PLATAFORMA`). | Moure a `../_investigacio_ia_de_poble/` |
| 6 | `260926_1200_infraestructura_fons/` | Aplicat a la infraestructura base. | Moure a `../_investigacio_ia_de_poble/` |
| 7 | `260930_0040_governanca_claude/` | Absorbit a `tooling/tractors/fonts-vigilancia.mjs`. | Moure a `../_investigacio_ia_de_poble/` |
| 8 | `261002_1510_tractor_fatiga_claude/` | Absorbit a `tooling/tractors/termometre_context.mjs` i `tooling/gates/fatiga-hook.mjs`. | Moure a `../_investigacio_ia_de_poble/` |
| 9 | `261004_2240_marato_claude/` | Absorbit a `src/router/RouteErrorBoundary.jsx` i `src/router/lazyRoute.js`. | Moure a `../_investigacio_ia_de_poble/` |
| 10 | `261006_0055_olivera_ancores_opus/` | Absorbit a `tooling/gates/porta-olivera.mjs`. | Moure a `../_investigacio_ia_de_poble/` |
| 11 | `261007_1715_auditoria_claude/` | Absorbit als components del Front A. | Moure a `../_investigacio_ia_de_poble/` |
| 12 | `261007_2215_auditoria_claude/` | Absorbit a `_wiki_de_poble/02_saber/decisions/ADR-2026-11-PAGINACIO-SECCIONS.md`. | Moure a `../_investigacio_ia_de_poble/` |
| 13 | `261009_1330_logotips_png_claude/` | Aplicat a `public/assets/system/ui/`. | Moure a `../_investigacio_ia_de_poble/` |
| 14 | `Bóveda Comunidad — Revolutia IA.webloc` | Enllaç extern consumit. | Moure a `../_investigacio_ia_de_poble/` |

##### Categoria B — Integrats o Destil·lats amb Precondició Mecànica Obligatòria abans d'Evacuar (24 ítems)

> [!CAUTION]
> **Alerta de Trencament de Tests i d'Olivera:** Les primeres **6 carpetes** d'aquesta taula tenen imports o lectures de disc directes des de `tests/` o `src/`. Si es mouen a `../_investigacio_ia_de_poble/` sense executar abans la columna «Precondició Mecànica», `npm test` i els tests de Node fallaran! Igualment, `00_index_escriptori.md` conté 326 wikilinks cap a fitxers `.md` dins de `02_investigacio_ia/` que cal despenjar en el mateix acte de l'evacuació.

| # | Entrada a `02_investigacio_ia/` | Estat d'Integració / Destil·lació | Precondició Mecànica abans de moure a `../_investigacio_ia_de_poble/` |
| :--- | :--- | :--- | :--- |
| 15 | `261003_1330_parroquia_claude/` | Llavors i fotos ja vives a `src/apps/bar/llavors/laParroquia.js`. | **CRÍTIC (`npm test`):** `src/apps/bar/llavors/laParroquia.test.js:35,198` llig `MAPA_IMATGES.txt` directament d'aquesta carpeta sense guarda! Moure `MAPA_IMATGES.txt` a `src/apps/bar/llavors/MAPA_IMATGES.txt` i actualitzar el test i els comentaris de `laParroquia.js:5` i `ElBarDelPoble.jsx:5`. |
| 16 | `260924_1700_tractors_claude/` | Absorbit a `tractor-sinapsis.mjs`, `tractor-autosanacio.mjs` i `porta-olivera.mjs`. | Redirigir `tests/tractor-sinapsis.test.mjs:9`, `tests/tractor-autosanacio.test.mjs:9` i `tests/porta-olivera-v2.test.mjs:15` als scripts de `tooling/` i netejar la menció a `core-maquetacio-markdown/SKILL.md:42`. |
| 17 | `260924_1815_tractor_plantilla_literal/` | Absorbit a `tooling/gates/porta-plantilla-viva.mjs`. | Desacoblar les 3 rutes hardcoded a `tests/plantilla-viva-installacio.test.mjs:51,90,94`. |
| 18 | `260927_1310_reflex_maria/` | Absorbit a `tooling/documental/` i `tooling/wiki/document.mjs`. | Redirigir o retirar `tests/petorreta-generador.test.mjs:21` i `tests/porta-receptor.test.mjs:18-21`. |
| 19 | `261009_1245_onada7_claude/` | Absorbit a `tooling/gates/porta-olivera.mjs`. | Eliminar l'acoblament d'índex i document a `tests/olivera-arxiva-261002.test.mjs:69,141`. |
| 20 | `261002_1745_olivera_arxiva_claude/` | Absorbit a `porta-olivera.mjs --arxiva`. | Netejar el test pont `tests/lint-torn-261002.test.mjs:20`. |
| 21 | `260930_0400_governanca_claude/` | Destil·lat: invariant de **Torns Retirats** (no esborrar torns mai) i **Porta de GRANTs Supabase** (caducitat de `sdp_grant_temporals.json` el **30-10-2026**). | Despenjar les àncores de `00_index_escriptori.md` i anotar l'alerta del 30-10-2026 al roadmap. |
| 22 | `261002_1705_sobirania_tecnologica_qwen.md` | Destil·lat: taxonomia d'ingestió de corpus i privadesa d'IA local a l'alqueria. | Despenjar àncora de `00_index_escriptori.md:69`. |
| 23 | `261002_1745_skills_claude/` | Destil·lat: patró de cua d'esborranys (`cua_esborranys_skills.json`) i bateria canària de portes. | Despenjar àncores de `00_index_escriptori.md`. |
| 24 | `261003_1330_anticipacio_claude/` | Destil·lat: patró d'anticipació en dues fases (Fase 0 espectre pur determinista / Fase 1 compromís verificat per hash). | Despenjar àncores de `00_index_escriptori.md`. |
| 25 | `261003_1330_lector_rss_claude/` | Codi ja viu a `src/apps/lector/nucli/`. Destil·lada la lliçó visual del Lector RSS (targetes `16:9` amb fallback cromàtic determinista OKLCH i tipografia fluïda `clamp()`). | Despenjar àncores de `00_index_escriptori.md`. |
| 26 | `261003_1330_onada4_claude/` | Codi ja viu a `src/components/PedraSeca/enquadrament/` i `public/fonts/`. | Netejar els comentaris de procedència a `src/sections/pages/pageContent.js:126`, `src/styles/tipografia-estreta.css:4` i `src/services/auth/oauthRelay.js:12`, i despenjar àncores. |
| 27 | `261003_1330_produccio_claude/` | Codi d'autenticació PKCE, recuperació i passkeys ja viu a `src/services/auth.js`. | Netejar els comentaris a `src/components/auth/RecuperacioSteps.jsx:6` i `src/services/auth.js:525`, i despenjar àncores. |
| 28 | `261003_1330_skills_disseny_claude/` | Destil·lat: esborranys de `sdp-qa-visual` (auditoria Playwright multi-viewport) i `sdp-grafics-dades` (paleta daltònica Okabe-Ito). | Despenjar àncores de `00_index_escriptori.md`. |
| 29 | `261004_0605_nit_claude/` | Motor Veri*Factu (`encadenament.js`) ja viu a `src/sections/gestoria/facturacio/registre/`. | Promoure els 2 ADRs (`ADR-2026-10-CANONICALITZACIO-ESPACIAL.md` i `ADR-2026-10-VERIFACTU-RURAL.md`) a `_wiki_de_poble/02_saber/decisions/` i despenjar àncores. |
| 30 | `261006_0300_ledger_claude/` | Destil·lat: auditoria de `ledger.jsonl`. | Actualitzar el comentari de `tooling/gates/antigravity-hook.mjs:61,75` i despenjar àncores. |
| 31 | `261009_0400_consola_claude/` | Absorbit al registre i mapa de Consola. | Actualitzar la referència de `_wiki_de_poble/02_saber/arquitectura/04_contracte_de_dades.md:149` i despenjar àncores. |
| 32 | `261009_0400_higiene_claude/` | Absorbit a `tooling/tractors/cron_higiene.mjs`. | Despenjar àncores de `00_index_escriptori.md`. |
| 33 | `261010_1805_arqueologia_claude/` | Destil·lat: inventari de les 33 fotos històriques de `socdepoble.net` (decisió D-30 d'atribució CC BY-NC-SA 4.0). | Despenjar àncores de `00_index_escriptori.md:55`. |
| 34 | `261011_0230_onada12_claude/` | `autocuracio.js` ja viu a `src/services/autocuracio.js`; destil·lat l'esquema de manifest `sdp.mod.v1` per al Mercat de Mòduls. | Despenjar àncores de `00_index_escriptori.md`. |
| 35 | `261011_0246_teoria_kowalski_apple_design.md` | Destil·lat a la secció 2.3 d'aquest informe i proposat per a `sdp-pedra-seca/SKILL.md`. | Despenjar àncora de `00_index_escriptori.md:50`. |
| 36 | `261011_0310_auditoria_mercat_puebli_bandomovil.md` | Destil·lat (amb l'esmena d'arquitectura de Codex a `02_saber/mercat/`): nínxol d'accessibilitat rural sènior enfront de Bandomovil/eAgora. | Despenjar àncora de `00_index_escriptori.md`. |
| 37 | `261012_1815_skills_antislop_thermos.md` | Destil·lat: tríada de salut del codi (complexitat ciclomàtica, detecció d'AI Slop i eliminació de codi mort). | Despenjar àncora de `00_index_escriptori.md`. |
| 38 | `261012_1825_workflow_rss_skills.md` | Destil·lat: pipeline determinista de lectura RSS cap a proposta d'esborrany de skill. | Despenjar àncora de `00_index_escriptori.md`. |

##### Categoria C — Conservar Vius al Laboratori o Promoure a Codi/Wiki Activa (11 ítems)

| # | Entrada a `02_investigacio_ia/` | Motiu de Retenció Viva / Promoció | Acció Recomanada |
| :--- | :--- | :--- | :--- |
| 39 | `TRACTOR_COGNITIU.txt` | README operatiu de la carpeta `02_investigacio_ia/`. | **Conservar viu** i afegir-hi una nota apuntant a `AGENTS.md` §12 (el laboratori és ara de lectura humana i del Consell; els tractors mecànics en tenen vetada la lectura automàtica). |
| 40 | `261013_1600_estudi_destil_laboratori_ia.md` | Cens base de destil·lació de les 58 entrades històriques. | **Conservar viu** com a registre fins que es complete l'evacuació de les Categories A i B. |
| 41 | `261018_1405_estudi_obsidian_rea_gemini4_iaia.md` | Blueprint viu d'enginyeria inversa d'Obsidian 1.14.4 (`app.asar`) per a `UniversalWorkspace.jsx`. | **Conservar viu** fins que Claude Code implemente `useTreeDragReorder.js` (zones 5%/90%/5%) i `WorkspaceSettingsPanel` (substituint `<Dialeg mida="s">`). |
| 42 | `CLAUDE-SECURITY-20261018-220519/` | Auditoria de seguretat recent (18/19 d'octubre) amb l'inventari `FINDINGS.json`, `REPORT.md` i 12 pegats (`F1`-`F12`). | **Conservar viu** fins que es tanquen i verifiquen totes les troballes de seguretat obertes. |
| 43 | `261002_1745_sentinelles_claude/` | Conté el disseny i proves dels 3 sentinelles de codi. | **Conservar viu** fins reconciliar l'estat de `src/sections/tractors/sentinelles/` amb l'arbre de treball. |
| 44 | `261003_1330_empaquetat_mobil_claude/` | Única especificació viva de **Capacitor 8 (Fases 1 i 2)** per a iOS/Android, citada directament per `src/pwa/registre.js:3` i `src/natiu/entrada.jsx:4`. | **Promoure** la documentació a `_wiki_de_poble/02_saber/arquitectura/` abans d'arxivar la carpeta. |
| 45 | `261012_0040_sistema_informes_claude/` | Conté el motor real `generar_informe.py` i `generar_informe.mjs` citat per `.agents/skills/core-informes-pdf/SKILL.md:38`. | **Promoure** els scripts a `tooling/pdf/` (amb tipografia Noto Sans local) i actualitzar la skill. |
| 46 | `261012_1315_auditoria_claude/` | Conté 13 pegats quirúrgics (`F01`-`F13`: CSP, `oauthRelay`, Service Worker, cuota IndexedDB) pendents de triatge d'aplicació. | **Revisar i aplicar** els pegats vigents amb Claude Code abans d'evacuar. |
| 47 | `261012_1322_relat_historic_xylella.md` | Context històric i humà d'El Rentonar i la Xylella fastidiosa per al Front H. | **Promoure** a `_wiki_de_poble/01_ser/` o conservar viu per al Front H. |
| 48 | `261012_1715_gnucash_arrel.md` | Invariants comptables de partida doble ($\sum \text{Deure} = \sum \text{Haver}$ en enters de cèntim) per a la Cabina / Gestoria. | **Promoure** els invariants a `.agents/skills/sdp-gestoria-administrativa/SKILL.md` o `_wiki_de_poble/02_saber/`. |
| 49 | `261012_1915_arquitectura_visual_erp.md` | Patrons visuals d'ERP (Odoo/Holded/Dolibarr) adaptats a Pedra Seca per a la Cabina / Gestoria. | **Promoure** a `.agents/skills/sdp-gestoria-administrativa/SKILL.md`. |

#### 2.3. Conclusions Destil·lades d'Avantguarda per a Claude Code i GPT (Codi i Disseny)

Perquè Claude Code i GPT puguen executar sense haver de rellegir mai més les 49 entrades del laboratori, ací queden destil·lats els **5 contractes d'enginyeria i disseny**:

1. **Contracte Obsidian 1.14.4 per a `UniversalWorkspace.jsx` (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`):**
   - **Prohibició de Modals Mutilats en Gestió d'Espais:** Eliminar l'ús de `<Dialeg mida="s">` (`max-w-[24rem]`) a `src/components/PedraSeca/organismes/UniversalWorkspace.jsx:391-521` per gestionar espais. Substituir-lo per una vista integrada (`WorkspaceSettingsPanel`) a pantalla completa o dins del contenidor principal amb graella de dues columnes ($\ge 640\text{ px}$).
   - **Matemàtica 5% / 90% / 5% de Reordenació d'Arbre (`useTreeDragReorder.js`):** Quan s'arrossega un node sobre una carpeta (`children`), el 5% superior i el 5% inferior de l'alçada (`rect.height * 0.05`) actuen com a carrils de reordenació entre germans (`before` / `after` amb línia horitzontal `#FF6D24` de `2px`), mentre que el 90% central rep el node com a fill (`inside`). En fulles simples, la partició és 25% / 50% / 25%, amb auto-expansió de carpetes tancades als `650 ms` d'hover.
   - ** Persistència Atòmica Debounced:** Escriptura a `localStorage` (`sdp:workspaces:v2`) amb `debounce(..., 250, true)` i descàrrega immediata a `visibilitychange` / `pagehide`.
2. **Contracte de Físiques i Gestos WWDC18 (`261011_0246_teoria_kowalski_apple_design.md`):**
   - *"Clonar és copiar l'estructura, no l'estil."* Tota transició de calaix o panell en Pedra Seca ha de ser interrompible i redirigible en vol, emprant ressorts críticament esmorteïts ($\zeta = 1$, sense sobreimpuls elàstic) i projecció inercial per desplaçament d'escombrat.
3. **Contracte Comptable i Fiscal de la Cabina (`261004_0605_nit_claude/` + `261012_1715_gnucash_arrel.md` + `261012_1915_arquitectura_visual_erp.md`):**
   - Tota transacció a la Gestoria es modela amb partida doble estricta en **cèntims enters** (` BigInt ` o enters segurs, zero `float`), estats immutables (`esborrany` $\rightarrow$ `validat` $\rightarrow$ `conciliat` $\rightarrow$ `bloquejat`) i encadenament criptogràfic SHA-256 Veri*Factu (`src/sections/gestoria/facturacio/registre/encadenament.js`).
4. **Contracte d'Informes PDF Institucionals (`261012_0040_sistema_informes_claude/`):**
   - Els informes PDF per a ajuntaments, subvencions i associacions s'han de generar sempre amb tipografia local empaquetada (`Noto Sans` des de `public/fonts/`, zero crides a CDN en temps de compilació PDF), encapçalament taronja `#F97316` sobre `#0E0E10`, taules amb `repeatRows=1` i peu numerat `Pàgina X de Y`.
5. **Contracte de Seguretat de la Colmena (`CLAUDE-SECURITY-20261018-220519/` + `261012_1315_auditoria_claude/`):**
   - Validació d'origen estricta per URL parsejada (`new URL(event.origin).origin === window.location.origin`) en `oauthRelay.js`, tancament de la finestra temporal de `sdp_grant_temporals.json` abans del **30-10-2026**, i prohibició d'executar cap `.sh` aliè dins carpetes de laboratori.

---

### BLOC 3: Contrast Adversarial del Pla WebP (`261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md`)

Hem auditat el Pla d'Implementació (`261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md`) creuant-lo amb l'autòpsia directa de:
- `tooling/media/optimitzar_webp.mjs` i `tooling/maquinaria/convertir_a_webp.mjs`
- `src/sections/multimedia/censImatges.js` i `src/sections/multimedia/censImatges.test.js`
- `src/sections/multimedia/useMetadadesFoto.js` i `src/sections/multimedia/lecturaExifWebp.js`
- `src/sections/multimedia/VisorDeLArxiu.jsx`, `MultimediaSection.jsx`, `origenImatges.js` i `mediaContent.js`
- `src/config/assetResolver.js`, `vite.standalone.config.js` i `wordpress-plugin/eines/empaqueta.mjs`
- El relleu en calent de Claude Code (`261019_1447_auditoria_claude_multimedia_webp.md`).

#### 3.1. Validació de la Llei del Píxel, Qualitat 84, Transparència Alfa i Preservació d'EXIF

1. **Geometria i Qualitat (100% Conforme amb el Genotip):**
   - Tant `tooling/media/optimitzar_webp.mjs` (`MIDA_MAXIMA_PER_DEFECTE = 1600`, `QUALITAT_PER_DEFECTE = 84`) com `tooling/maquinaria/convertir_a_webp.mjs` (`mode = 'original'`, `costatMax = 1600`, `qualitat = 84`) garanteixen que **cap imatge es retalla mai** (proporció d'aspecte 100% intacta) i cap imatge menuda s'amplia (`escala = Math.min(1, maxCostat / costatLlarg)`).
2. **Enrutament Híbrid (`maquinaria` Python/Pillow per a JPEG + `chrome` per a PNG):**
   - `optimitzar_webp.mjs:290-303` (`seleccionarCodificadorPerFitxer`) envia tots els `.jpg`/`.jpeg` amb el motor `maquinaria` (`convertir_a_webp.mjs` via Python/Pillow) i tots els `.png` amb el motor `chrome` (`canvas.toDataURL('image/webp', 0.84)`).
   - **Per què és òptim aquest híbrid:**
     - En els **PNG** (logotips, escuts, plànols, avatars amb retall transparent i `nano_cards`), `chrome` preserva el canal alfa (`VP8X` amb bit d'alfa `0x10` i subchunk `ALPH`) sense cap risc de fons negre.
     - En els **JPEG** (fotografies patrimonials de La Torre de les Maçanes com `DSC00320.JPG` o la col·lecció Safareig), `convertir_a_webp.mjs` aplica primer `ImageOps.exif_transpose(im)` en Python (deixant els píxels físicament orientats al dret), codifica a WebP amb `method=6`, **normalitza el tag TIFF `Orientation (0x0112)` a `1`** (`normalitzaOrientacioTiff`, evitant el bug clàssic de doble rotació en Safari/Chrome!), elimina la miniatura `IFD1` redundant i incrusta el payload TIFF EXIF complet (GPS + `DateTimeOriginal` + càmera) dins d'un chunk RIFF `EXIF` al final de l'arxiu WebP activant la bandera `0x08` del header `VP8X`.
3. **Compatibilitat del Lector EXIF al Visor (`useMetadadesFoto.js` + `lecturaExifWebp.js`):**
   - Hem verificat `src/sections/multimedia/useMetadadesFoto.js:52-77`: quan una foto `.webp` supera els 256 KB i el chunk `EXIF` es troba al final del contenidor RIFF (com fa `convertir_a_webp.mjs`), `lligExifFinalWebp` llança una petició HTTP `Range` (`206 Partial Content`) per llegir els últims 64 KB i extreure el GPS i la data amb `exifr` sense descarregar la imatge dues vegades. **L'arquitectura d'EXIF en WebP és 100% sòlida.**

#### 3.2. Les 6 Esmenes Tècniques Crítiques al Pla WebP (Mètode Gauntlet)

Tot i que el motor de conversió és excel·lent, el Pla (`261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md`) té **6 punts cecs d'integració** que farien fallar els tests o l'objectiu dels 10 MB si no s'apliquen aquestes esmenes:

##### Esmena 1 — Fitxer Inexistent al Pla (`src/sections/multimedia/DetailMultimedia.jsx`)
- **Evidència:** La secció 3 del Pla (línia 76) ordena modificar `[MODIFY] src/sections/multimedia/DetailMultimedia.jsx`. **Aquest fitxer no existeix al repositori.**
- **Correcció:** Els components reals que renderitzen les imatges i metadades de l'arxiu són:
  - `src/sections/multimedia/VisorDeLArxiu.jsx`
  - `src/sections/multimedia/MultimediaSection.jsx`
  - `src/components/PedraSeca/organismes/VisorImatges.jsx`
  - `src/sections/profile/DetallMultimedia.jsx`

##### Esmena 2 — El Parany dels Bessons («Twins») i el Trencament Immediat de `censImatges.test.js`
- **Evidència:** `tooling/media/optimitzar_webp.mjs` **no esborra els fitxers `.jpg`/`.png` originals**, sinó que escriu el fitxer `.webp` al seu costat (`Els originals no s'han tocat`). Alhora, el test `src/sections/multimedia/censImatges.test.js:35-42` escaneja recursivament **tots** els fitxers `/\.(?:jpe?g|png|webp|gif|avif)$/i` de `public/assets/` i exigeix que cadascun estiga o bé en `CENS_IMATGES` o bé en `EXCLOSES`.
- **Conseqüència si s'executa el Pla a cegues:**
  1. Si es generen 125 fitxers `.webp` nous i es deixen els 125 `.jpg`/`.png` originals a `public/assets/`, la carpeta `public/assets/` **no baixarà a 33 MB, sinó que pujarà de 135 MB a 168 MB** (135 MB originals + 33 MB WebP)!
  2. `censImatges.test.js` **fallarà en roig** amb ~124 fitxers no censats.
- **Solució Recomanada (Doble Via segons decisió d'empaquetat):**
  - **Via Canònica (Substitució + Evacuació d'Originals a `../_multimedia_de_poble/`):** Si `CENS_IMATGES` i `src/` passen a apuntar a `.webp`, els originals `.jpg`/`.png` convertits s'han d'evacuar a la carpeta satèl·lit exterior `/Users/javillinares/Documents/Antigravity/Som de Poble/_multimedia_de_poble/` amb un manifest SHA-256 verificable (exactament com preveu el comentari de `optimitzar_webp.mjs:11`: *"Els originals pesants s'arxiven a `../_multimedia_de_poble/`"*). Així el repositori Git s'allibera de debò de **~93 MB de llast binari**!
  - **Via de Convivència Temporal (Bessons en disc durant la transició):** Si es volen conservar temporalment els `.jpg`/`.png` originals dins `public/assets/` com a fallback d'enllaços externs, cal que `censImatges.js` o `censImatges.test.js` reconega automàticament que tot `.jpg`/`.png` que tinga un bessó `.webp` censat a `CENS_IMATGES` queda cobert com a `'fallback ràster d’una imatge ja censada en WebP'`, **i** que `vite.standalone.config.js` n'excloga l'original `.jpg`/`.png` en construir els paquets!

##### Esmena 3 — Assercions Literals d'Extensió a `censImatges.test.js` i `assetResolver.js`
- **Evidència:**
  1. `src/sections/multimedia/censImatges.test.js` (línies 63, 66-68, 82-84, 93-94, 100-101, 112, 130-135) conté assercions literals amb extensions `.png`, `.jpg` i `.JPG` (ex.: `/assets/towns/tibi/2.jpg`, `/assets/uploads/poble/260919_lamela_1925_safareig_01.jpg`, `DSC00320.JPG`, `andreu-soler-comic.png`). Si les rutes canòniques de `CENS_IMATGES` passen a `.webp`, cal actualitzar simultàniament aquestes assercions al test.
  2. `src/config/assetResolver.js:13-23` (`TOWN_FALLBACK_IMAGES`) té 9 rutes `.png` hardcoded (`/assets/towns/la-torre-de-les-macanes-banner.png`, `/assets/system/ui/socdepoble_logo_negre.png`, etc.).
  3. `tests/seedSql.multimedia.test.js` verifica la paritat amb `supabase/seed.sql`. Si s'actualitzen extensions d'imatge en `src/data/` o `src/sections/feed/feedContent.js`, cal regenerar o sincronitzar `supabase/seed.sql` (`scripts/generate-supabase-seed.mjs`).

##### Esmena 4 — La Matemàtica Real del Límit de 10 MB al Paquet WordPress (`LIMIT_DIRECTORI`)
- **Evidència mesurada al disc (`du -sh public/assets/*`):**
  - Pes total actual de `public/`: **135 MB**.
  - Pes de `public/assets/uploads/`: **93 MB** (`brain`: 24 MB, `empresa`: 21 MB, `poble`: 20 MB, `avatars`: 11 MB, `gent`: 7,4 MB, `ia`: 5,4 MB, `ajuntament`: 2,4 MB, `companies`: 2,0 MB, `grup`: 256 KB).
  - Pes de `public/assets/` **FORA d'`uploads/`**: **~35 MB** (`nano_cards`: 13 MB, `ui`: 6,1 MB, `towns`: 5,6 MB, `fotos`: 4,6 MB, `system`: 2,5 MB, `events`: 1,8 MB, `img`: 1,4 MB, `soc_de_poble_ibanez.png`: 1,3 MB, `notes`: 748 KB).
  - Pes de la resta de `public/`: `rag-index.json` (~3,1 MB descomprimit) i `fonts/` (~2,4 MB).
- **Demostració matemàtica:**
  - El Pla (§4) assumeix que només excloent `public/assets/uploads/` de `vite.standalone.config.js` el ZIP de WordPress (`build:wp:directori`) ja baixarà dels **10 MB** (`LIMIT_DIRECTORI` a `wordpress-plugin/eines/empaqueta.mjs:23`).
  - **Fals si no es netegen els 35 MB fora d'`uploads/`!** Si només s'exclou `assets/uploads/` (93 MB) però es deixen els **35 MB** de PNG/JPG de `nano_cards/`, `ui/plugins/`, `towns/`, `fotos/`, `events/` i `img/` (o pitjor encara, els originals + els seus nous bessons `.webp`!), el ZIP superarà àmpliament els 10 MB (rondarà els 32–38 MB) i `empaqueta.mjs:620` **avortarà amb error**.
  - **Com s'assoleix el límit $< 10\text{ MB}$ de forma garantida:**
    1. Convertir a `.webp` els actius de `nano_cards/`, `ui/`, `towns/`, `fotos/`, `events/`, `img/` i `soc_de_poble_ibanez.png` (els 35 MB passen a **~4,5 MB** en WebP!).
    2. A `vite.standalone.config.js` (`recursosDelPlugin`), quan es construeix per a WordPress (`SDP_VARIANT=wordpress`), **no copiar cap fitxer `.png`/`.jpg`/`.jpeg` que ja tinga el seu bessó `.webp` al mateix directori**, i excloure les col·leccions pesades d'arxiu (`assets/uploads/brain`, `assets/uploads/poble`, `assets/uploads/empresa`, `assets/uploads/gent`, `assets/uploads/ia`, `assets/fotos`, `rag-index.json`). Amb això, el ZIP de `wordpress_directori` quedarà en **~6,5–7,5 MB** (folgadament per sota dels 10 MB!).

##### Esmena 5 — Desacoblament Net a `src/config/assetResolver.js` perquè WordPress no tinga Imatges Trencades (404)
- **Evidència:** A `src/config/assetResolver.js:34-61`, `resolRecursPropi(normalizedPath)` resol qualsevol ruta `/assets/...` cap a `${pluginUrl}${normalizedPath}` quan l'aplicació corre incrustada al plugin de WordPress.
- **Risc:** Si `vite.standalone.config.js` exclou `assets/uploads/` del ZIP de WordPress però `resolRecursPropi` continua reescrivint `/assets/uploads/...` cap a `https://el-poble.org/wp-content/plugins/soc-de-poble/dist/assets/uploads/...`, **totes les imatges d'`uploads/` donaran 404 Not Found dins de WordPress!**
- **Solució exacta:** A `src/config/assetResolver.js`, definir una constant amb els prefixos d'arxiu externs al paquet lleuger de WordPress (ex. `/assets/uploads/`, `/assets/fotos/`) o un paràmetre `publicAssetsOrigin` (per defecte `https://socdepoble.org` quan `pluginUrl` és actiu i l'actiu és d'arxiu pesat) perquè `resolRecursPropi` apunte eixes rutes al CDN/origen canònic de Sóc de Poble en lloc de la carpeta local del plugin WP.

##### Esmena 6 — Estratègia de Fallbacks i Compatibilitat d'Enllaços Externs
- **Compatibilitat de navegador:** WebP (tant lossy VP8 com lossless/alfa VP8L/VP8X) és suportat nativament per Safari des d'iOS 14 / macOS Big Sur i per tots els navegadors Chromium i Firefox moderns. D'acord amb el Genotip (`AGENTS.md` §3: *Online-First per a dispositius moderns*), `.webp` pot i ha de ser el format primari canònic a totes les etiquetes `<img>` sense necessitat d'embolcallar cada imatge amb `<picture>` a la SPA.
- **Fallback en temps d'execució:** El component `VisorDeLArxiu.jsx` i `assetResolver.js` ja disposen de fallback segur (`onError` cap a `DEFAULT_TOWN_FALLBACK` en WebP). Per a les rutes guardades prèviament al `localStorage` d'usuaris o a `supabase/seed.sql` que encara tinguen extensió `.jpg` o `.png`, `resolveAsset(path)` a `src/config/assetResolver.js` pot normalitzar transparentment les rutes conegudes del catàleg local cap a `.webp` (o mantindre la redirecció al servidor).

---

### Matriu de Cobertura de Requisits (MCR)

| ID Requisit | Font del Requisit | Estat | Evidència / Secció de l'Informe |
| :--- | :--- | :--- | :--- |
| **REQ-01** | Prompt §1: Auditar les 32+ skills (`.agents/skills/`) per detectar anacronismes, contradiccions i mencions obsoletes | **COBERT (100%)** | Auditades les **38 skills** en disc + `manifest.yaml` + `00_INDEX_SKILLS.md`. Llista negra de 4 fallades estructurals (`S-01`..`S-04`) i 12 contradiccions/anacronismes amb fitxer i línia exacta (§Bloc 1.1 i §Bloc 1.2). |
| **REQ-02** | Prompt §1: Aplicar el BIOS §1 (les skills han de ser tractors procedimentals purs, zero filosofia o literatura) | **COBERT (100%)** | Identificades les 4 skills amb narrativa literària redundant (`core-comprensio-reflexiva`, `core-temps-termodinamic`, `wiki-documentacio-i-reflex`, `core-automillora`) i les 2 absorcions tècniques pendents des del laboratori (§Bloc 1.3). |
| **REQ-03** | Prompt §2: Destil·lar els ítems de `02_investigacio_ia/` creuant l'estudi `261013_1600` i l'estudi d'Obsidian `261018_1405` | **COBERT (100%)** | Censats i classificats els **49 ítems físics** (47 + 2 estudis rectors) en Categoria A (14 llestos per a trasllat immediat), Categoria B (24 amb precondició mecànica de tests/àncores) i Categoria C (11 vius/promovibles) (§Bloc 2.1 i §Bloc 2.2). |
| **REQ-04** | Prompt §2: Destil·lar conclusions clares d'avantguarda per a Claude i GPT | **COBERT (100%)** | 5 contractes executables destil·lats (Obsidian 1.14.4 `5%/90%/5%` + `WorkspaceSettingsPanel`, WWDC18 $\zeta=1$, Cabina Veri*Factu/GnuCash, PDF Noto Sans local i Seguretat de la Colmena) (§Bloc 2.3). |
| **REQ-05** | Prompt §3: Contrast adversarial del Pla WebP (`1600 px`, sense retallar, qualitat 84, EXIF via Python i alfa via Chrome, límit WP 10 MB) | **COBERT (100%)** | Verificat el pipeline real (`optimitzar_webp.mjs` + `convertir_a_webp.mjs` + `lecturaExifWebp.js`) i emeses **6 Esmenes Tècniques Crítiques** que eviten el trencament de `censImatges.test.js` i garanteixen el límit $< 10\text{ MB}$ a `build:wp:directori` (§Bloc 3.1 i §Bloc 3.2). |
| **REQ-06** | Prompt §7: Emetre l'informe canònic a `_wiki_de_poble/04_escriptori/261019_1425_auditoria_gemini_skills_i_multimedia.md` amb secció `Proposta d'Automillora` i gates en verd | **COBERT (100%)** | Document creat via `document.mjs`, validat amb `document.mjs check` i `porta-olivera.mjs`, i amb la secció `Proposta d'Automillora` ací sota. |

---

### Proposta d'Automillora

D'acord amb el protocol d'evolució del Cervell (`core-automillora/SKILL.md`), propose al Mestre l'execució immediata (en el pròxim torn autoritzat d'escriptura de Cervell) de les **5 accions mecàniques següents**:

1. **Sincronització immediata del Catàleg i Symlinks de Skills:**
   - Executar `node tooling/brain/cataleg_skills.mjs --escriu` per incorporar `core-gauntlet-loop` i `core-seguretat-audit` a `.agents/manifest.yaml` i reconciliar `.agents/skills/00_INDEX_SKILLS.md`.
   - Crear els 2 symlinks que falten a `.claude/skills/core-gauntlet-loop` i `.claude/skills/core-seguretat-audit` (i afegir aquesta verificació automàtica dins `cataleg_skills.mjs` perquè mai més quede una skill òrfena a `.claude/skills/`!).
2. **Purga dels 4 `\n#` literals i del doble H1 del BIOS:**
   - Netejar la seqüència `\n#` a `sdp-app-grid-shell`, `sdp-casos-us-essencials`, `sdp-estudi-mercat` i `wiki-propagar-veritat`, i eliminar la línia 7 duplicada de `.agents/rules/00_BIOS_COGNITIU.md`.
3. **Sanejament de les 12 Contradiccions Doctrinals a `.agents/skills/`:**
   - Aplicar les esmenes de la secció **§Bloc 1.2** d'aquest informe (especialment la regla de la Ploma/CloudUpload a `sdp-universal-editor`, l'exemple trencat de `wiki-propagar-veritat`, la neteja de telemetria del 24 de setembre a `core-consell-i-colmena`, la supressió del punter a `90_arxiu_historic/` a `sdp-workflow` i la paritat de categories a `wiki-documentacio-i-reflex`).
4. **Injecció del Blueprint d'Obsidian 1.14.4 i WWDC18 a les Skills de Disseny:**
   - Actualitzar `sdp-app-grid-shell/SKILL.md` amb el contracte `useTreeDragReorder` (`5% / 90% / 5%`) i `WorkspaceSettingsPanel` (prohibint modals `mida="s"` per a llistes jeràrquiques), i actualitzar `sdp-pedra-seca/SKILL.md` amb els invariants d'animació interrompible WWDC18 ($\zeta = 1$).
5. **Tractor d'Evacuació Segura del Laboratori (`02_investigacio_ia/` $\rightarrow$ `../_investigacio_ia_de_poble/`):**
   - Desacoblar primer els 6 tests de la Categoria B (movent `MAPA_IMATGES.txt` a `src/apps/bar/llavors/`), promoure el generador PDF a `tooling/pdf/` i després traslladar en bloc els 38 ítems de les Categories A i B a `../_investigacio_ia_de_poble/` despenjant simultàniament les seues àncores de `00_index_escriptori.md` i deixant un `MANIFEST_SHA256.json` d'integritat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions mecàniques executades en lectura i validació documental durant aquesta auditoria:

- `node tooling/brain/cataleg_skills.mjs --check` $\rightarrow$ Detectada i documentada la dessincronització de `core-gauntlet-loop` i `core-seguretat-audit` a `.agents/manifest.yaml` i `00_INDEX_SKILLS.md` (Troballa `S-01`).
- `node tooling/media/optimitzar_webp.mjs --cens` $\rightarrow$ Cens verificat en sec: **219 imatges** a `public/` (`131.795 KB`), **125 candidates** a optimitzar (`119.908 KB`), **0 orfes**, motors `maquinaria` (Python/Pillow) i `chrome` operatius.
- `node tooling/wiki/document.mjs check --turn-id torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e --file _wiki_de_poble/04_escriptori/261019_1425_auditoria_gemini_skills_i_multimedia.md` $\rightarrow$ Validació d'esquema JSON, seccions H2 del contracte `auditoria` v2.0.0, taula de Registre i ancoratge a l'Escriptori.
- `node tooling/gates/porta-olivera.mjs` $\rightarrow$ Verificació d'integritat d'àncores a `00_index_escriptori.md`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- D'acord amb el contracte d'`auditoria` i la frontera d'efectes de la Colmena (`AGENTS.md`), aquesta auditoria és **100% consultiva i no destructiva**: no s'ha modificat cap fitxer de `src/`, no s'ha alterat cap skill de `.agents/skills/` ni s'ha mogut encara cap carpeta de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` per no interferir amb el torn paral·lel d'execució de Claude Code (`261019_1447_auditoria_claude_multimedia_webp.md`).
- Les accions de neteja sobre `.agents/skills/`, el trasllat físic de les Categories A i B cap a `../_investigacio_ia_de_poble/` i l'elecció entre la **Via Canònica** (evacuar originals `.jpg`/`.png` a `../_multimedia_de_poble/`) o la **Via de Convivència** (bessons `.webp` + originals amb exclusió al build de Vite) tenen `requires_human_decision: true` per part del Mestre.

### Convocatòria i evidència de lectura

- `AGENTS.md`: línia 28 (`"Regla del Silenci de l'Escriptori: Queda terminantment prohibit que els agents parlen del treball d'investigació al xat"`), línia 71 (`"Qualsevol document o carpeta que isca de _wiki_de_poble/ va exclusivament a la carpeta germana exterior corresponent"`), línia 157 (`"12. El Laboratori d'Investigació IA (02_investigacio_ia/) és de lectura humana i del Consell"`).
- `_wiki_de_poble/01_ser/02_genotip.md`: línia 51 (`"L'Alqueria Digital (Online-First): Dissenyem per a dispositius moderns connectats"`), línia 92 (`"Identitat tipogràfica: Noto Sans és l'única font de tota l'aplicació"`), línia 188 (`"Regla de la Barra Taronja Universal (28-09-2026)"`).
- `_wiki_de_poble/00_index.md`: línia 22 (`"Arquitectura 4+2: _wiki_de_poble/ s'organitza en quatre carpetes numerades de coneixement (01_ser, 02_saber, 03_actuar, 04_escriptori) i dos registres operatius (10_actes, 90_arxiu_historic)"`).
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md`: línies 50-72 (`"4. Categories Vàlides"` amb les 19 categories de l'Escriptori) i línies 92-97 (`"Cicle d'higiene d'Escriptori (L'Olivera)"`).
- `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`: línies 80-91 (`"Contracte d'informe: Cada troballa ha d'incloure fitxer o scope afectat, evidència reproduïble, severitat justificada, font de veritat amb què entra en conflicte, proposta conservadora"`).
- `_wiki_de_poble/04_escriptori/02_investigacio_ia/261013_1600_estudi_destil_laboratori_ia.md`: línies 44-91 (`"a) Inventari complet (58 entrades: 34 carpetes + 24 fitxers solts)"`) i línies 93-271 (`"b) Destil·lació per peça"`).
- `_wiki_de_poble/04_escriptori/02_investigacio_ia/261018_1405_estudi_obsidian_rea_gemini4_iaia.md`: línies 60-112 (`"1.2. Geometria de Precisió: El Model 5% / 90% / 5% en Carpetes"`) i línies 271-334 (`"3.2. Diagnòstic del Problema Actual a Sóc de Poble: <Dialeg mida=\"s\">"`).
- `_wiki_de_poble/04_escriptori/261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp.md`: línies 45-93 (`"Canvis proposats: FASE 1, FASE 2, FASE 3, FASE 4"`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[taxonomia_documental]]
- [[auditoria_canonica]]
- [[261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp]]
- [[261019_1425_prompt_auditoria_skills_i_contrast_gemini]]
- [[261019_1425_prompt_alliberament_multimedia_i_conversio_webp]]
- [[261019_1447_auditoria_claude_multimedia_webp]]
- [[02_investigacio_ia/261013_1600_estudi_destil_laboratori_ia]]
- [[02_investigacio_ia/261018_1405_estudi_obsidian_rea_gemini4_iaia]]
