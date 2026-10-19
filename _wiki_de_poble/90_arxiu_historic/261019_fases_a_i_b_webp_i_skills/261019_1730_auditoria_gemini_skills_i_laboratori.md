---
type: informe
status: esborrany
description: Auditoria forense de les 38 skills a .agents/skills/, blindatge de core-seguretat-audit i dictamen de les 11 eines vives de Categoria C a 02_investigacio_ia.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:6e4c29ea-c9f4-4447-9ca2-6afbf20282a0
---
# Auditoria Forense de les 38 Skills, Blindatge de Seguretat i Destil·lació de les 11 Eines del Laboratori 02

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:6e4c29ea-c9f4-4447-9ca2-6afbf20282a0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T15:34:30.530Z |
| Modificació | 2026-10-19T15:38:00.000Z |
| Propietari | Gemini 4 Argon High (Auditor Forense) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (Google AI Ultra, 2M context) |
| Tokens consumits | ~148k / 2M |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T15:34:30.530Z: esborrany creat mitjançant `document.mjs create` sota el torn `torn_cb39a942-aac3-4aaf-a4af-f4b759317437`.
- 2026-10-19T15:38:00.000Z: completada la lectura forense dels documents de governança (`AGENTS.md`, `02_genotip.md`, `00_index.md`, `taxonomia_documental.md`), dels 9 documents vius de `_wiki_de_poble/04_escriptori/` (inclòs el relleu paral·lel `261019_1715_auditoria_claude_infraestructura.md`), de les **38 skills** en `.agents/skills/` i de les **11 eines de Categoria C** (més la verificació de les 38 peces de Categoria A i B) a `_wiki_de_poble/04_escriptori/02_investigacio_ia/`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum Executiu i Sincronització amb el Fil Paral·lel (Claude Code)

L'auditoria integral del sistema nerviós de `socdepoble.org` i del laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/` confirma quatre conclusions d'alt impacte que expliquen les alertes del sistema immunitari i orienten la Fase B i C del Pla `261019_1715_pla_implementacio_infraestructura_skills_i_mobil.md`:

1. **Estat del Catàleg de Skills vs. Segell Criptogràfic i Mirall `.claude/skills/`:** `node tooling/brain/cataleg_skills.mjs --check` ara passa en verd (`"ok": true`) després de l'actualització de `00_INDEX_SKILLS.md` i `.agents/manifest.yaml` amb les 38 skills. Tanmateix, queden dues fractures físiques que fan fallar `run-portes.mjs` i `tancament.mjs --check` (com acaba de confirmar Claude Code a `261019_1715_auditoria_claude_infraestructura.md:56`):
   - El segell de la Llei Z (`tooling/gates/segella.mjs`) té el hash desfasat (`b4a3d577` actual vs. `5e7339db` segellat) perquè no es va executar `node tooling/gates/segella.mjs --update` en regenerar `00_INDEX_SKILLS.md`.
   - El mirall `.claude/skills/` només conté **36 symlinks** i li falten els enllaços simbòlics de `core-gauntlet-loop` i `core-seguretat-audit`.
2. **Anacronismes i Contradiccions a les 38 Skills:** S'han detectat **14 famílies d'anacronismes i contradiccions arquitectòniques** (`S-01`..`S-02`, `A-01`..`A-14`), incloent-hi 4 skills amb la seqüència d'escapament literal `\n# ` al títol H1, la contradicció directa entre `sdp-universal-editor` i `sdp-pedra-seca`/`BarraTaronja.jsx` sobre la icona de la **Ploma** vs. `CloudUpload`, l'omissió de la subvista `PaginaEmojis` (que substitueix el modal flotant `<Dialeg>` i deixa un residu actiu `dialeg === 'emoticona'` a `src/sections/notes/SnippetCurador.jsx:198,433`), telemetria caducada del 24 de setembre a `core-consell-i-colmena` i `core-estrategia-ia`, i un exemple `sed` corromput a `wiki-propagar-veritat`.
3. **Blindatge de `core-seguretat-audit/SKILL.md` com a Sentinella Permanent:** La skill ja recull els 3 principis inviolables i les 4 capes de defensa, però necessita **6 pegats d'enduriment (`SEC-01`..`SEC-06`)** extrets de l'auditoria real `CLAUDE-SECURITY-20261018-220519`: el protocol de còpia d'ombra neta (*Clean Shadow Copy*) quan l'arbre està brut (`revision.dirty: true`), la llei de coacció primitiva de `JSONB` abans de React, la prohibició d'expressions regulars amb *backtracking* sobre entrades d'usuari (zero ReDoS), i el blindatge de `SELECT` per columna i de llistat de Storage a Supabase.
4. **Descobriment Forense a les 11 Peces de Categoria C del Laboratori (`02_investigacio_ia/`):**
   - **Troballa Crítica al Laboratori (`LAB-C08`):** La carpeta `261012_1315_auditoria_claude/` conté **12 pegats verificats (`f01.txt`..`f13.txt`) que MAI es van aplicar a `src/`**. En particular, `src/sections/gestoria/identitat/nucli/guardes.js:52,64-66` encara té l'expressió regular antiga de DNI/NIE/NIF que no detecta espais ni guions intermedis (`12 345 678 A`) ni caràcters de format Unicode (`\u200B`, `\u2028`), i `src/sections/gestoria/projectes/nucli/expedient.js:117-141` encara no valida duplicats d'`id` en `comprovaTerminis`.
   - **Estat dels Pegats de Seguretat (`LAB-C04`):** De `CLAUDE-SECURITY-20261018-220519/`, 8 pegats de codi ja estan aplicats al commit `ed6077ff`, però el pegat SQL `pegats/F01_F02_F08_F13_migracions_de_seguretat.patch` i la confirmació UI del flux de recuperació (`F10`) continuen pendents d'aplicar.
   - **Connexió Directa amb Fase C Capacitor 8 (`LAB-C06`):** La carpeta `261003_1330_empaquetat_mobil_claude/` conté el `capacitor.config.json` i els 4 scripts de `botigues/` (`preflight.mjs`, `puja-android.mjs`, `puja-ios.mjs`, `entorn.mjs`) que falten al repositori (tal com acaba d'observar Claude Code a `261019_1715_auditoria_claude_infraestructura.md:67`), i permet estalviar **~93 MB** al bundle natiu aplicant `politicaDeMitjans('autonom')` a `vite.natiu.config.js`.

### Bloc 1: Auditoria Forense de les 38 Skills (`.agents/skills/`)

#### 1.1. Fractures Estructurals d'Infraestructura i Portes (`S-01`, `S-01b`, `S-02`)

- **Troballa `S-01` · Desfasament del mirall `.claude/skills/` (36 symlinks vs. 38 skills canòniques)**
  - **Fitxers afectats:** `.claude/skills/`, `.agents/manifest.yaml:13`, `tooling/brain/cataleg_skills.mjs`.
  - **Evidència reproduïble:** `ls -1 .agents/skills/ | grep -v 00_INDEX_SKILLS.md | wc -l` retorna `38`, mentre que `ls -1 .claude/skills/ | wc -l` retorna `36`. Falten els enllaços simbòlics `.claude/skills/core-gauntlet-loop` i `.claude/skills/core-seguretat-audit`.
  - **Severitat:** Alta (impedeix que Claude Code descobrisca de forma nativa les dues noves skills de seguretat i bucle *Gauntlet*, i provoca avisos `fora-cataleg-claude` a `tooling/brain/mapa-consola.mjs`).
  - **Font de veritat en conflicte:** `.agents/manifest.yaml:13` (`claude_mirror: .claude/skills`).
  - **Proposta conservadora (`requires_human_decision: false`):** Executar en el torn de mutació:
    ```bash
    ln -s ../../.agents/skills/core-gauntlet-loop .claude/skills/core-gauntlet-loop
    ln -s ../../.agents/skills/core-seguretat-audit .claude/skills/core-seguretat-audit
    ```
    I afegir a `tooling/brain/cataleg_skills.mjs` la comprovació que cada entrada de `.agents/skills/` tinga el seu symlink corresponent a `.claude/skills/`.

- **Troballa `S-01b` · Ruptura del segell criptogràfic de la Llei Z (`segella.mjs`)**
  - **Fitxers afectats:** `.agents/skills/00_INDEX_SKILLS.md`, `tooling/gates/segella.mjs`.
  - **Evidència reproduïble:** `node tooling/gates/segella.mjs` falla amb codi 1: `El hash actual b4a3d577 no coincideix amb el segellat 5e7339db`.
  - **Severitat:** Crítica (bloqueja `run-portes.mjs` al pas 3 i impedeix els commits de Claude Code amb ganxo actiu).
  - **Font de veritat en conflicte:** `AGENTS.md` §10 i `tooling/gates/run-portes.mjs:32`.
  - **Proposta conservadora (`requires_human_decision: false`):** Un cop aplicades les esmenes de les skills, executar `node tooling/brain/cataleg_skills.mjs --write && node tooling/gates/segella.mjs --update`.

- **Troballa `S-02` · Títols H1 trencats amb seqüència literal `\n# ` en 4 skills i doble H1 al BIOS**
  - **Fitxers afectats:**
    1. `.agents/skills/sdp-app-grid-shell/SKILL.md:16` (`\n# SKILL: AppGridShell (Graella Mestra Universal)`)
    2. `.agents/skills/sdp-casos-us-essencials/SKILL.md:21` (`\n# 💡 Casos d'Ús Essencials: El Patró d'Or de Sóc de Poble`)
    3. `.agents/skills/sdp-estudi-mercat/SKILL.md:18` (`\n# SKILL: Estudi de Mercat, Competència i Referents (Sóc de Poble)`)
    4. `.agents/skills/wiki-propagar-veritat/SKILL.md:20` (`\n# SKILL: Propagar la Veritat (Actualització Massiva de la Wiki)`)
    5. `.agents/rules/00_BIOS_COGNITIU.md:6-7` (línia `# BIOS Cognitiu de les Portes Mecàniques` duplicada dues voltes seguides).
  - **Evidència reproduïble:** `grep -rn '\\n# ' .agents/skills/` mostra les 4 ocurrències exactes introduïdes per una escriptura antiga que va escapar el salt de línia.
  - **Severitat:** Mitjana (trenca el renderitzat de l'encapçalament H1 en Markdown i incompleix R5 de `core-maquetacio-markdown`).
  - **Font de veritat en conflicte:** `.agents/skills/core-maquetacio-markdown/SKILL.md` (R5: un sol `#` vàlid per document).
  - **Proposta conservadora (`requires_human_decision: false`):** Substituir `\n# ` per `# ` en les 4 skills i eliminar la línia 7 duplicada de `.agents/rules/00_BIOS_COGNITIU.md`.

#### 1.2. Anacronismes de Setembre i Contradiccions Arquitectòniques (`A-01` a `A-14`)

- **Troballa `A-01` · Anacronisme del Selector d'Emojis Flotant (`<Dialeg>`) vs. Subvista `PaginaEmojis` del Workspace**
  - **Fitxers afectats:** `.agents/skills/sdp-universal-editor/SKILL.md:33-36`, `.agents/skills/sdp-pedra-seca/SKILL.md:91`, `.agents/skills/sdp-universal-page/SKILL.md:59-66`, i codi residual a `src/sections/notes/SnippetCurador.jsx:198,433`.
  - **Evidència reproduïble:** L'arquitectura vigent (`src/components/universal/classificacio/PaginaEmojis.jsx`, `src/components/universal/classificacio/GraellaEmojis.jsx` i `src/sections/notes/familiesEmojis.js`) ha substituït l'antic selector d'emoticones flotant basat en `<Dialeg>` per una **subvista de columna completa dins de l'Espai de Treball (`PaginaEmojis`)**, amb botó prominent **«Tornar»** (`ArrowLeft`, mínim `44px`) a la capçalera per a l'adult major i graella categoritzada Unicode 18. Cap de les tres skills UI (`sdp-universal-editor`, `sdp-pedra-seca`, `sdp-universal-page`) documenta `PaginaEmojis`, i `src/sections/notes/SnippetCurador.jsx:198,433` encara manté l'estat `dialeg === 'emoticona'` que obri un `<Dialeg>` flotant en lloc de la subvista integrada.
  - **Severitat:** Alta (risc de regressió cap a modals flotants d'emoticones si una IA segueix la documentació actual o replica `SnippetCurador.jsx`).
  - **Font de veritat en conflicte:** `src/components/universal/classificacio/PaginaEmojis.jsx` i directiva del Mestre sobre eliminació del selector d'emojis flotant.
  - **Proposta conservadora (`requires_human_decision: false`):**
    1. Actualitzar `sdp-universal-editor/SKILL.md` (§2, línia 33), `sdp-pedra-seca/SKILL.md` (§10, línia 91) i `sdp-universal-page/SKILL.md` (§1.C, línia 62) per estipular que **el selector d'emoticones MAI és un modal flotant (`<Dialeg>`)**, sinó la subvista integrada `PaginaEmojis` (`src/components/universal/classificacio/PaginaEmojis.jsx`) amb botó «Tornar» i cerca en viu.
    2. Planificar en el pròxim torn de frontend la migració de `src/sections/notes/SnippetCurador.jsx:198,433` de `dialeg === 'emoticona'` a `PaginaEmojis`.

- **Troballa `A-02` · Contradicció entre `sdp-universal-editor` i `sdp-pedra-seca` sobre «La Ploma» vs. `CloudUpload`**
  - **Fitxers afectats:** `.agents/skills/sdp-universal-editor/SKILL.md:27-30` vs. `.agents/skills/sdp-pedra-seca/SKILL.md:91-92` i `src/components/universal/barres/BarraTaronja.jsx:90-125`.
  - **Evidència reproduïble:** `sdp-universal-editor/SKILL.md:27-30` afirma que en mode edició apareix la **icona de la ploma** `(on solia estar la "i" d'informació)` per indicar canvis no desats i que desapareix amb l'autodesat. Això contradiu frontalment tant `sdp-pedra-seca/SKILL.md:91-92` com `BarraTaronja.jsx`: **la ploma (`Feather`) només indica «tria un emoji» quan la peça encara no té emoticona assignada en mode edició**, mentre que l'autodesat s'indica exclusivament amb `CloudUpload` (un núvol discret que desapareix en 1,2 s quan s'ha desat).
  - **Severitat:** Alta (indueix els agents a programar estats d'autodesat sobre la icona de la ploma).
  - **Font de veritat en conflicte:** `src/components/universal/barres/BarraTaronja.jsx:90-125` i `.agents/skills/sdp-pedra-seca/SKILL.md:91-92`.
  - **Proposta conservadora (`requires_human_decision: false`):** Reescriure `.agents/skills/sdp-universal-editor/SKILL.md:27-36` eliminant l'anacronisme `(on solia estar la "i" d'informació)` i alineant el significat de la Ploma (selecció d'emoji cap a `PaginaEmojis`) i de `CloudUpload` (autodesat silenciós).

- **Troballa `A-03` · Desactualització de `UniversalToolbar` (`H3` abans d'`H2` i llista numerada) i `.sdp-editor-full-canvas` a `sdp-universal-editor`**
  - **Fitxers afectats:** `.agents/skills/sdp-universal-editor/SKILL.md:40-53`.
  - **Evidència reproduïble:** A la línia 44 es descriu la barra amb `H3, B, I, S i Llistes`, sense reflectir l'estàndard vigent de `src/components/universal/editor/UniversalToolbar.jsx` i `UniversalEditor.css` (jerarquia `H3` seguida d'`H2` per evitar col·lisions amb l'`H1` de la fitxa, botó explícit de llista numerada `ListOrdered` / `toggleOrderedList` al costat de `List`, i llenç complet `.sdp-editor-full-canvas` amb `min-height: 480px`, `padding-bottom: 25vh` i clic en qualsevol punt buit per enfocar al final amb `editor.commands.focus('end')`).
  - **Severitat:** Mitjana.
  - **Font de veritat en conflicte:** `src/components/universal/editor/UniversalToolbar.jsx` i `src/components/universal/editor/UniversalEditor.css`.
  - **Proposta conservadora (`requires_human_decision: false`):** Documentar l'ordre `H3 -> H2`, `List` + `ListOrdered`, i el contracte `.sdp-editor-full-canvas` a `sdp-universal-editor/SKILL.md` §3.

- **Troballa `A-04` · Exemple `sed` corromput i omissió d'exclusió de `90_arxiu_historic` a `wiki-propagar-veritat`**
  - **Fitxers afectats:** `.agents/skills/wiki-propagar-veritat/SKILL.md:22,26,37`.
  - **Evidència reproduïble:** Un `sed` massiu del passat va mutar el mateix text d'exemple de la skill, deixant frases sense sentit:
    - Línia 22: `quan canviem d'estratègia Online-First a online-first`
    - Línia 26: `Exemple: dispositius moderns, Online-First, Online-First.`
    - Línia 37: `find _wiki_de_poble/ -type f -name "*.md" -exec sed -i '' -e 's/dispositius moderns/dispositius moderns/g' ...` (substitueix una cadena per ella mateixa i no exclou `-not -path "*/90_arxiu_historic/*"` ni `-not -path "*/04_escriptori/02_investigacio_ia/*"`).
  - **Severitat:** Alta (si un agent executa la comanda de la skill sobre `_wiki_de_poble/`, mutarà `90_arxiu_historic/`, violant `AGENTS.md` §5 i trencant els segells històrics).
  - **Font de veritat en conflicte:** `AGENTS.md` §5 (immutabilitat de `90_arxiu_historic/`) i §12.
  - **Proposta conservadora (`requires_human_decision: false`):** Restaurar l'exemple amb termes diferenciats (`TERME_ANTIC` -> `TERME_NOU`) i afegir obligatòriament `-not -path "*/90_arxiu_historic/*" -not -path "*/04_escriptori/02_investigacio_ia/*"` a la comanda `find`.

- **Troballa `A-05` · Telemetria efímera del 24 de setembre i categoria `MACRO_BUNDLE` en majúscules a `core-consell-i-colmena` i `core-estrategia-ia`**
  - **Fitxers afectats:** `.agents/skills/core-consell-i-colmena/SKILL.md:50,56-66` i `.agents/skills/core-estrategia-ia/SKILL.md:35`.
  - **Evidència reproduïble:**
    - `core-consell-i-colmena/SKILL.md:56-66` té incrustada la bateria d'un dia concret de setembre: `22% del límit setmanal restant. Es reinicia en 4 dies i 2 hores (aproximadament el 24 de setembre)` i `Límit setmanal al 0%. Temporalment fora de combat per a tasques pesades fins al 24 de setembre. (Substituït temporalment per Fable - Claude 3.5 Haiku)`.
    - `core-consell-i-colmena/SKILL.md:50` ordena anomenar els fitxers amb `[CATEGORIA]` en majúscules (`MACRO_PROMPT` o `MACRO_BUNDLE`), violant la Regla T1 de `taxonomia_documental.md` (tot en minúscules: `macro_prompt`, `macro_bundle`).
    - `core-estrategia-ia/SKILL.md:35` té incrustat `(15% restant)` per a Codex.
  - **Severitat:** Alta (indueix l'orquestradora a creure que Claude Opus està al 0% de bateria o a generar noms de fitxer en majúscules que trenquen `tractor-nomenclatura.mjs`).
  - **Font de veritat en conflicte:** `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (T1 i T2).
  - **Proposta conservadora (`requires_human_decision: false`):** Eliminar els percentatges efímers de setembre (substituint-los per la regla de consultar la telemetria viva de la sessió) i passar `MACRO_PROMPT` / `MACRO_BUNDLE` a `macro_prompt` / `macro_bundle`.

- **Troballa `A-06` · Punter prohibit a `90_arxiu_historic` i autoreferència circular a `sdp-workflow`**
  - **Fitxers afectats:** `.agents/skills/sdp-workflow/SKILL.md:27,36`.
  - **Evidència reproduïble:**
    - Línia 27: apunta a `_wiki_de_poble/90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md` (prohibit per `AGENTS.md` §5 i inexistent).
    - Línia 36: es referencia a si mateixa (`Basat en .agents/skills/sdp-workflow/SKILL.md`) per als principis de disseny matemàtic en lloc d'apuntar a `.agents/skills/sdp-pedra-seca/SKILL.md`.
  - **Severitat:** Mitjana.
  - **Font de veritat en conflicte:** `AGENTS.md` §5 i `.agents/skills/sdp-pedra-seca/SKILL.md`.
  - **Proposta conservadora (`requires_human_decision: false`):** Reapuntar la línia 27 a `.agents/skills/00_INDEX_SKILLS.md` i la línia 36 a `.agents/skills/sdp-pedra-seca/SKILL.md`.

- **Troballa `A-07` · Desincronització taxonòmica i violació d'estructura Markdown a `wiki-documentacio-i-reflex`**
  - **Fitxers afectats:** `.agents/skills/wiki-documentacio-i-reflex/SKILL.md:25,50-58,74,86-87,112-117`.
  - **Evidència reproduïble:**
    - Línia 25: manté l'anacronisme `(Antigament "Petorretes")`.
    - Línies 50-58: afirma que el terme `petorreta` *«NO forma part de la taxonomia documental oficial»* i que només existeixen 4 categories (`prompt`, `pla_implementacio`, `auditoria`, `acta`), contradient `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md:45-67` i `tooling/wiki/taxonomia.json` (on hi ha 19 categories oficials, incloent-hi `petorreta`, `macro_prompt`, `macro_bundle`, `relleu`, `veredicte`, `estudi`, `disseny`).
    - Línies 74 i 86-87: numeració trencada (`1, 2, 5` i `1, 2, 3, 4, 4`).
    - Línies 112-117: la secció `## Convocatòria i evidència de lectura` apareix **després** de `## Vincles`, violant R13 de `core-maquetacio-markdown` (`## Vincles` és sempre l'última secció del document).
  - **Severitat:** Alta (contradicció directa amb `taxonomia_documental.md` i amb R13).
  - **Font de veritat en conflicte:** `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` i `.agents/skills/core-maquetacio-markdown/SKILL.md`.
  - **Proposta conservadora (`requires_human_decision: false`):** Alinear la llista de categories amb `tooling/wiki/taxonomia.json`, corregir la numeració dels llistats i moure `## Convocatòria i evidència de lectura` abans de `## Vincles`.

- **Troballa `A-08` · Dependències vives de skills cap al laboratori temporal `02_investigacio_ia/`**
  - **Fitxers afectats:** `.agents/skills/core-informes-pdf/SKILL.md:38` i `.agents/skills/core-maquetacio-markdown/SKILL.md:42`.
  - **Evidència reproduïble:**
    - `core-informes-pdf/SKILL.md:38` ordena executar el motor des de `_wiki_de_poble/04_escriptori/02_investigacio_ia/261012_0040_sistema_informes_claude/` (`genera_informe.py`, `informe_editorial.css`, `esquema_informe.json`). Si s'evacua el laboratori sense promoure aquests fitxers a `tooling/pdf/`, la skill quedarà trencada.
    - `core-maquetacio-markdown/SKILL.md:42` cita l'arxiu de laboratori `260924_1700 (skill_core_redaccio.txt)`.
  - **Severitat:** Alta (bloqueja la neteja de `02_investigacio_ia/`).
  - **Font de veritat en conflicte:** `AGENTS.md` §12 i `tooling/pdf/`.
  - **Proposta conservadora (`requires_human_decision: false`):** Promoure `genera_informe.py`, `informe_editorial.css` i `esquema_informe.json` a `tooling/pdf/`, actualitzar la ruta a `core-informes-pdf/SKILL.md:38` i netejar la menció arqueològica de `core-maquetacio-markdown/SKILL.md:42`.

- **Troballa `A-09` · Inexactituds de vocabulari sobre el Model B de Sollutia**
  - **Fitxers afectats:** `.agents/skills/sdp-estudi-mercat/SKILL.md:52` i `.agents/skills/sdp-calendari-agricola/SKILL.md:24,35`.
  - **Evidència reproduïble:**
    - `sdp-estudi-mercat/SKILL.md:52`: pregunta *«Què significa tot açò per al nostre codi i per al backend de Sollutia?»*.
    - `sdp-calendari-agricola/SKILL.md:24,35`: parla de *«les taules core de Sollutia/Supabase»* i *«integrant-se a Sollutia»*.
  - **Severitat:** Mitjana (confon el rol d'amfitrió/lectura GET per la Frontissa de Sollutia amb el backend únic de Sóc de Poble a Supabase darrere de `src/data/backendPort.js`).
  - **Font de veritat en conflicte:** `AGENTS.md` §8 (Model B) i `_wiki_de_poble/02_saber/architecture/ADR-2026-11-BACKEND-CANONIC-MODEL-B.md`.
  - **Proposta conservadora (`requires_human_decision: false`):** Substituir en `sdp-estudi-mercat` per *«per al nostre codi, el port neutral `backendPort.js` (Supabase) i la Frontissa de lectura amb Sollutia»*, i en `sdp-calendari-agricola` per *«les taules core de Supabase (`backendPort.js`) i la lectura de l'amfitrió per la Frontissa»*.

- **Troballa `A-10` · Rutes i noms de sortida desactualitzats a `core-empaquetat-wp`**
  - **Fitxers afectats:** `.agents/skills/core-empaquetat-wp/SKILL.md:28-36`.
  - **Evidència reproduïble:** La skill documenta noms amb marca horària (`AAMMDD_HHMM_wordpress_enxufe_v...zip`) i ruta `wordpress-plugin/builds/directori/`, mentre que `wordpress-plugin/eines/empaqueta.mjs` genera els tres artefactes amb nom determinista directament a `wordpress-plugin/builds/` (`soc-de-poble_wordpress_enxufe_v1.1.7.zip`, `soc-de-poble_wordpress_directori_v1.1.7.zip`, `soc-de-poble_estatic_spa_v1.1.7.zip`) i aplica `wordpress-plugin/eines/politicaDeMitjans.js` (bessones WebP en l'`autonom` i servei extern en el `directori` < 10 MB).
  - **Severitat:** Mitjana.
  - **Font de veritat en conflicte:** `wordpress-plugin/eines/empaqueta.mjs` i `wordpress-plugin/eines/politicaDeMitjans.js`.
  - **Proposta conservadora (`requires_human_decision: false`):** Actualitzar `core-empaquetat-wp/SKILL.md` amb els noms deterministes vigents i el contracte de `politicaDeMitjans.js`.

- **Troballa `A-11` · Omissió de les carpetes satèl·lit canòniques a `core-memoria-historica`**
  - **Fitxers afectats:** `.agents/skills/core-memoria-historica/SKILL.md:28`.
  - **Evidència reproduïble:** La línia 28 afirma que qualsevol fitxer que isca de `_wiki_de_poble/` va *únicament* a `../_arxiu_wiki_de_poble/`, ometent les 9 carpetes satèl·lit especialitzades de `Som de Poble/` (`../_investigacio_ia_de_poble/`, `../_multimedia_de_poble/`, `../_comunicacio_de_poble/`, `../_cultura_de_poble/`, `../_gestoria_de_poble/`, `../_raw_de_poble/`, `../_rebost_de_poble/`, `../_recursos_de_poble/`, `../_salut_de_poble/`) i l'arxiu intern de torns `_wiki_de_poble/90_arxiu_historic/`.
  - **Severitat:** Mitjana.
  - **Font de veritat en conflicte:** `AGENTS.md` §13 i directiva d'Ecosistema Físic del prompt.
  - **Proposta conservadora (`requires_human_decision: false`):** Incorporar el mapa de les carpetes satèl·lit oficials a `core-memoria-historica/SKILL.md`.

- **Troballa `A-12` · Cicatrius arqueològiques de fusions d'agost, errates tipogràfiques i contracte erroni**
  - **Fitxers afectats:**
    1. `.agents/skills/core-restauracio-segellada/SKILL.md:40-47,102,110,148` (repeteix 4 vegades `*(absorbida en la fusió del 260831; vegeu Historial)*` i cita les skills extintes `core-safe-restore`, `core-bounded-action`, `core-verified-change`).
    2. `.agents/skills/core-identitat/SKILL.md:23,27` (encapçalament arqueològic `## Secció Original: identity-iaia-core`).
    3. `.agents/skills/core-edicio-segura/SKILL.md:18,22` (errata `amb la para auditoria` en lloc d'`amb la paraula auditoria`, i redactat dirigit a MarIA per editar components React quan MarIA té prohibit tocar `src/`).
    4. `.agents/skills/core-portaveu-institucional/SKILL.md:33` (errata `el que llegeix l'uel` en lloc de `l'usuari`).
    5. `.agents/skills/sdp-clon-loiverse/SKILL.md:14,16` (`contracte.llig` i `contracte.escriu` apunten a `src/data/backendPort.js` en una skill purament visual del TPV que hauria d'apuntar a `src/apps/bar/`).
  - **Severitat:** Baixa-Mitjana.
  - **Font de veritat en conflicte:** `AGENTS.md` §2 i `.agents/skills/core-llegibilitat-text/SKILL.md`.
  - **Proposta conservadora (`requires_human_decision: false`):** Netejar les cicatrius i errates en el lot de sanejament de skills.

- **Troballa `A-13` · Plantilla `prompt_nano_banana.md` sense ruta a `.agents/protocolledge.json` ni categoria a `taxonomia.json`**
  - **Fitxers afectats:** `_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md`, `_wiki_de_poble/03_actuar/plantilles/00_index_plantilles.md`, `.agents/protocolledge.json`, `tooling/wiki/taxonomia.json`.
  - **Evidència reproduïble:** En inspeccionar `_wiki_de_poble/03_actuar/plantilles/` es comprova que existeixen 8 plantilles amb marcadors `SDP:EIXIDA` i `SDP:SECTION`, però `prompt_nano_banana.md` (v1.0.0, creada el 16/10/2026) no està registrada a `.agents/protocolledge.json` ni a `tooling/wiki/taxonomia.json`, de manera que `document.mjs create` no la pot invocar.
  - **Severitat:** Baixa.
  - **Font de veritat en conflicte:** `.agents/protocolledge.json` i `tooling/gates/porta-plantilles.mjs`.
  - **Proposta conservadora (`requires_human_decision: true`):** Decidir si es registra la ruta `prompt_nano_banana` a `.agents/protocolledge.json` i `taxonomia.json` o si es mou a `_wiki_de_poble/02_saber/` com a guia d'estil visual.

- **Troballa `A-14` · Compliment de `core-maquetacio-markdown` (R6, R12, R13, R20) en el corpus de les 38 skills**
  - **Fitxers afectats:** 18 skills amb separadors horitzontals `---` o `***` al cos (R20); 5 skills amb doble secció de tancament `## Ancoratge de Seguretat` / `## Ancoratge de la Wiki` abans de `## Vincles` (`sdp-pedra-seca`, `core-context-panic`, `core-restauracio-segellada`, `sdp-calendari-agricola`, `sdp-casos-us-essencials`); 4 skills amb metàfores literàries extenses que dilueixen les regles (`core-comprensio-reflexiva`, `core-temps-termodinamic`, `wiki-documentacio-i-reflex`, `core-automillora`).
  - **Severitat:** Baixa-Mitjana.
  - **Font de veritat en conflicte:** `.agents/skills/core-maquetacio-markdown/SKILL.md` (R6, R12, R13, R20) i `.agents/rules/00_BIOS_COGNITIU.md` §1.
  - **Proposta conservadora (`requires_human_decision: false`):** Aplicar la neteja de `---` interns i d'àncores duplicades quan s'executen les esmenes de contingut de les skills.

#### 1.3. Matriu Forense Completa de les 38 Skills (`.agents/skills/`)

| # | Skill (`id`) | Versió | Mirall `.claude` | Diagnòstic Forense (Frontmatter, Anacronismes, Model B i Markdown) | Acció Recomanada |
| --- | --- | --- | --- | --- | --- |
| 01 | `core-anti-entropia` | 3.0.0 | Sí | Correcta. Avisa de no saturar `04_escriptori/`. Conté 1 `---` intern (R20). | Netejar `---` intern (R20). |
| 02 | `core-auditoria-adversarial` | 3.0.0 | Sí | Correcta i alineada amb el protocol de doble parell d'ulls. Conté 2 `---` interns (R20). | Conservar; netejar `---` (R20). |
| 03 | `core-autonomia-proactiva` | 3.0.0 | Sí | Correcta. Defineix la resolució autònoma de friccions mecàniques sense interrompre el Mestre. | Conservar intacta. |
| 04 | `core-automillora` | 3.0.0 | Sí | Frontmatter vàlid. Línia 18 conté metàfora biològica extensa (R12) i falta incorporar la lliçó «memòria en pedra» del laboratori `261002_1745_skills_claude`. | Incorporar lliçó «memòria en pedra» i podar metàfora. |
| 05 | `core-comprensio-reflexiva` | 1.0.0 | Sí | Frontmatter complet (reparat en T2). Línia 29 conté metàfora narrativa (`boví rumiant`, BIOS §1 / R12). | Podar metàfora narrativa a la línia 29. |
| 06 | `core-consell-i-colmena` | 3.0.0 | Sí | **Anacronisme Crític (`A-05`):** Línia 50 exigeix `MACRO_PROMPT` / `MACRO_BUNDLE` en majúscules (viola T1 de `taxonomia_documental.md`); línies 56-66 tenen percentatges de bateria del **24 de setembre** (`22%`, `0%`, `Fable Haiku`). | Esmenar línia 50 a minúscules i eliminar telemetria caducada de setembre (línies 56-66). |
| 07 | `core-context-panic` | 3.1.0 | Sí | Contingut sòlid (llindars 120k/150k/170k). Línies 50-56 tenen secció redundant `## Ancoratge de la Wiki` abans de `## Vincles`. | Unificar `## Ancoratge de la Wiki` dins `## Vincles`. |
| 08 | `core-edicio-segura` | 3.0.0 | Sí | **Anacronisme (`A-12`):** Línia 22 té l'errata `amb la para auditoria` (`paraula`) i parla com si MarIA editara components React (`src/`). | Corregir errata i especificar que aplica als agents executors amb lease (`Claude Code` / `Codex`). |
| 09 | `core-empaquetat-wp` | 3.0.0 | Sí | **Anacronisme (`A-10`):** Línies 30-32 documenten noms antics amb timestamp i ruta `builds/directori/`; falta documentar `politicaDeMitjans.js` (bessones WebP en `autonom` vs. extern en `directori` < 10 MB). | Actualitzar noms deterministes `soc-de-poble_*_v1.1.7.zip` i documentar `politicaDeMitjans.js`. |
| 10 | `core-escriptura-atomica` | 3.0.0 | Sí | Correcta i alineada amb `core-edicio-segura`. Conté 1 `---` intern (R20). | Conservar; netejar `---` (R20). |
| 11 | `core-estrategia-ia` | 3.0.0 | Sí | **Anacronisme (`A-05`):** Línia 35 té incrustat `(15% restant)` per a Codex. | Eliminar el percentatge fix de la línia 35. |
| 12 | `core-fondaria-cognitiva` | 3.0.0 | Sí | Correcta. Prohibeix resums superficials i exigeix traçabilitat completa. | Conservar intacta. |
| 13 | `core-gauntlet-loop` | 1.0.0 | **NO (`S-01`)** | Contingut excel·lent (bucle de 5 fases *Gauntlet* + REA). **Falta symlink a `.claude/skills/`** i falten `core: true` i `prioritat: 1` al frontmatter. | Crear symlink a `.claude/skills/core-gauntlet-loop` i afegir `core: true`. |
| 14 | `core-governanca-consell` | 3.0.0 | Sí | Correcta. Regula el quòrum d'11 veus del Consell i el rol d'integració local. | Conservar intacta. |
| 15 | `core-higiene-escriptori` | 3.3.0 | Sí | Sòlida i alineada amb `porta-olivera.mjs`. Línia 59 cita l'exemple històric `260926_1200_infraestructura_fons` com a mostra de subcarpeta de laboratori. | Actualitzar l'exemple quan s'evacue `02_investigacio_ia/` cap a `_investigacio_ia_de_poble/`. |
| 16 | `core-identitat` | 3.0.0 | Sí | **Cicatriu (`A-12`):** Línia 23 conserva `## Secció Original: identity-iaia-core`. | Substituir el subtítol arqueològic per `## Essència i Rol de la Directora Tècnica`. |
| 17 | `core-informes-pdf` | 3.0.0 | Sí | **Dependència crítica de laboratori (`A-08`):** Línia 38 depèn de `_wiki_de_poble/04_escriptori/02_investigacio_ia/261012_0040_sistema_informes_claude/`, i l'script d'aquella carpeta carrega `Source Sans 3` des de Google Fonts en lloc de `Noto Sans` local. | Promoure el motor a `tooling/pdf/`, fixar `Noto Sans` local i actualitzar la línia 38. |
| 18 | `core-llegibilitat-text` | 1.0.0 | Sí | Impecable (18 regles L1-L18 en perfecte compliment de `core-maquetacio-markdown`). | Conservar intacta (model de referència). |
| 19 | `core-maquetacio-markdown` | 1.0.0 | Sí | Molt sòlida (22 regles R1-R22). **Anacronisme lleu (`A-08`):** Línia 42 cita `260924_1700 (skill_core_redaccio.txt)` del laboratori. | Netejar la referència de laboratori a la línia 42. |
| 20 | `core-memoria-historica` | 3.0.0 | Sí | **Incompleta (`A-11`):** Línia 28 només esmenta `../_arxiu_wiki_de_poble/`, ometent les altres 9 carpetes satèl·lit de `Som de Poble/` i `90_arxiu_historic/`. | Afegir la taula de les 10 carpetes satèl·lit canòniques i la frontera amb `90_arxiu_historic/`. |
| 21 | `core-portaveu-institucional` | 3.0.0 | Sí | **Errata (`A-12`):** Línia 33 diu `el que llegeix l'uel` en lloc de `l'usuari`. | Corregir l'errata a la línia 33. |
| 22 | `core-restauracio-segellada` | 3.0.0 | Sí | **Cicatrius d'agost (`A-12`, `A-14`):** Línies 40-47, 102, 110 i 148 repeteixen `*(absorbida en la fusió del 260831)*` i citen skills extintes (`core-safe-restore`, etc.); línies 149-151 dupliquen `## Ancoratge de Seguretat`. | Netejar les notes de fusió del 260831 i fusionar `## Ancoratge de Seguretat` amb `## Vincles`. |
| 23 | `core-seguretat-audit` | 1.0.0 | **NO (`S-01`)** | **Sentinella Permanent (`SEC-01`..`SEC-06`):** Falta symlink a `.claude/skills/`, falta `core: true` al frontmatter, i cal incorporar el protocol d'arbre brut (*Clean Shadow Copy*), coacció primitiva JSONB, zero ReDoS i blindatge de columnes/Storage de Supabase (vegeu Bloc 2). | Aplicar els 6 pegats d'enduriment del Bloc 2 i crear el symlink a `.claude/skills/`. |
| 24 | `core-tecniques-investigacio` | 1.0.0 | Sí | Frontmatter complet (reparat en T2). Contingut d'investigació paral·lela correcte. Conté 3 `---` interns (R20). | Conservar; netejar `---` (R20). |
| 25 | `core-temps-termodinamic` | 3.0.0 | Sí | Regla operativa sòlida (zero estimacions en dies/setmanes humanes). Línia 21 conté retòrica d'«al·lucinació d'esclau corporatiu» (BIOS §1 / R12). | Simplificar la línia 21 a prosa tècnica directa. |
| 26 | `sdp-accessibilitat-rural` | 3.0.0 | Sí | Impecable: `48px` mínim de diana tàctil, contrast AAA sota el sol, i reducció de càrrega cognitiva per a l'adult major. | Conservar intacta. |
| 27 | `sdp-app-grid-shell` | 3.0.0 | Sí | **Títol H1 trencat (`S-02`):** Línia 16 comença amb `\n# SKILL: AppGridShell`. Falta incorporar el contracte REA d'Obsidian (`5% / 90% / 5%` hit-testing d'arbre i `WorkspaceSettingsPanel` en lloc de `<Dialeg mida="s">`). | Reparar `\n#` a la línia 16 i afegir la secció del contracte d'arbre i panell d'Obsidian REA (`LAB-C03`). |
| 28 | `sdp-calendari-agricola` | 3.0.0 | Sí | **Vocabulari Model B (`A-09`):** Línies 24 i 35 parlen de *«taules core de Sollutia/Supabase»* i *«integrant-se a Sollutia»*; línies 49-51 tenen `## Ancoratge de Seguretat` duplicat. | Alinear línies 24 i 35 amb el Model B (`backendPort.js` + Frontissa GET) i unificar `## Vincles`. |
| 29 | `sdp-casos-us-essencials` | 3.0.0 | Sí | **Títol H1 trencat (`S-02`):** Línia 21 comença amb `\n# 💡 Casos d'Ús Essencials`. Línies 90-91 tenen `## Ancoratge de Seguretat` duplicat. | Reparar `\n#` a la línia 21 i unificar `## Vincles`. |
| 30 | `sdp-clon-loiverse` | 3.0.0 | Sí | **Contracte inexacte (`A-12`):** Línies 14 i 16 declaren `src/data/backendPort.js` en `llig`/`escriu` en lloc de `src/apps/bar/**` i `src/styles/app-bar.css`. | Apuntar `contracte.llig` i `contracte.escriu` a `src/apps/bar/**` i `src/styles/app-bar.css`. |
| 31 | `sdp-disseny-estetic` | 3.0.0 | Sí | Correcta: geometria `28px/22px`, prohibició de grisos morts i ombres difuses. Conté 2 `---` interns (R20). | Conservar; netejar `---` (R20). |
| 32 | `sdp-estudi-mercat` | 3.0.0 | Sí | **Títol H1 trencat (`S-02`) i Model B (`A-09`):** Línia 18 comença amb `\n# SKILL: Estudi de Mercat`; línia 52 diu *«per al backend de Sollutia»*. | Reparar `\n#` a la línia 18 i esmenar la línia 52 segons el Model B. |
| 33 | `sdp-pedra-seca` | 3.0.0 | Sí | Molt sòlida (11 manaments de Pedra Seca, incloent-hi la distinció Ploma vs. `CloudUpload`). **Falta (`A-01`, `A-14`):** Línia 91 cal explicitar que la Ploma obri la subvista `PaginaEmojis` (mai un `<Dialeg>` flotant); línies 95-99 tenen `## Ancoratge de Seguretat` duplicat. | Explicitar `PaginaEmojis` a la línia 91 i unificar `## Ancoratge de Seguretat` dins `## Vincles`. |
| 34 | `sdp-ulisses-fons` | 3.0.0 | Sí | Correcta (filtratge de soroll de xat rural per extreure fites i memòria viva). | Conservar intacta. |
| 35 | `sdp-universal-editor` | 3.0.0 | Sí | **Anacronismes Crítics (`A-01`, `A-02`, `A-03`):** Línies 27-30 confonen la Ploma amb l'autodesat i diuen `(on solia estar la "i" d'informació)`; línies 33-36 ometen `PaginaEmojis`; línies 44-49 ometen l'ordre `H3 -> H2`, la llista numerada (`ListOrdered`) i `.sdp-editor-full-canvas`. | Reescriure §2 i §3 per alinear-los amb `BarraTaronja.jsx`, `PaginaEmojis.jsx`, `UniversalToolbar.jsx` i `UniversalEditor.css`. |
| 36 | `sdp-universal-page` | 3.0.0 | Sí | **Omissió (`A-01`):** En §1.C (línies 59-66) explica la barra taronja però no especifica que l'emoticona d'esquerra obri la subvista `PaginaEmojis` dins del llenç amb botó «Tornar». | Afegir la referència a `PaginaEmojis` en §1.C. |
| 37 | `sdp-workflow` | 3.0.0 | Sí | **Enllaç prohibit i circularitat (`A-06`):** Línia 27 apunta a `90_arxiu_historic/.../00_TARGET_SKILLS.md`; línia 36 s'autoreferencia en lloc d'apuntar a `sdp-pedra-seca`. | Reapuntar línia 27 a `00_INDEX_SKILLS.md` i línia 36 a `sdp-pedra-seca/SKILL.md`. |
| 38 | `wiki-documentacio-i-reflex` | 3.0.0 | Sí | **Anacronisme i error estructural (`A-07`):** Línies 25 i 50-58 neguen `petorreta` i limiten la taxonomia a 4 tipus (contra els 19 de `taxonomia.json`); numeració trencada a línies 74 i 86; secció després de `## Vincles` a línies 115-117. | Sincronitzar amb les 19 categories de `taxonomia_documental.md`, corregir numeració i moure `## Vincles` al final absolut. |
| 39* | `wiki-propagar-veritat` *(38a al catàleg actual)* | 3.0.0 | Sí | **Títol H1 trencat (`S-02`) i `sed` corromput (`A-04`):** Línia 20 té `\n# SKILL:`; línies 22, 26 i 37 tenen l'exemple `sed` malmès i sense exclusió de `90_arxiu_historic`. *(Nota: la fila 39 correspon a la 38a skill real; l'índex 39 quedarà reservat per a `sdp-sentinelles` quan es promoga del laboratori).* | Reparar `\n#` a la línia 20 i blindar la comanda `find ... -exec sed` excloent `90_arxiu_historic` i `02_investigacio_ia`. |

### Bloc 2: Avaluació i Blindatge de `core-seguretat-audit` com a Sentinella Permanent

L'auditoria de `.agents/skills/core-seguretat-audit/SKILL.md` (v1.0.0) confirma que l'estructura base és sòlida (Principis Inviolables en §1, Arquitectura de 4 Capes en §2, Integració amb `/claude-security` en §3, Entregables CWE/SARIF en §4 i Checklist Pre-Release en §5). Tanmateix, en contrastar-la amb l'execució real de `CLAUDE-SECURITY-20261018-220519` i els commits de seguretat recents (`ed6077ff`), hem identificat **6 buits operatius (`SEC-01` a `SEC-06`)** que cal blindar perquè funcione com a filtre obligatori i ineludible per a tota la Colmena (Claude Code, Codex, Gemini i MarIA):

1. **`SEC-01` · Promoció a `core: true`, `prioritat: 1` i enllaç simbòlic a `.claude/skills/`:**
   - **Problema:** El frontmatter actual de `core-seguretat-audit/SKILL.md` (i del seu bessó operatiu `core-gauntlet-loop/SKILL.md`) no inclou `core: true` ni `prioritat: 1`, i cap de les dues té symlink a `.claude/skills/`.
   - **Solució:** Afegir `core: true` i `prioritat: 1` al frontmatter de totes dues i crear els dos symlinks a `.claude/skills/`.
2. **`SEC-02` · Protocol de Còpia d'Ombra Neta (*Clean Shadow Copy*) quan l'arbre de treball està brut (`revision.dirty: true`):**
   - **Problema:** Com es demostra a `_wiki_de_poble/04_escriptori/02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/pegats/PEGATS.md:22`, l'acció nativa `Suggest patches` del plugin `/claude-security` **es nega a executar-se si l'arbre Git té canvis no comessos (`revision.dirty: true`)**, i respon demanant fer `git commit` o `git stash` — dues accions terminantment prohibides pel BIOS a Claude Code sense lease.
   - **Solució:** Codificar en §3 de `core-seguretat-audit/SKILL.md` el **Protocol de Còpia d'Ombra Neta**: quan el repositori tinga canvis en curs, l'agent auditor ha de:
     1. Materialitzar una còpia neta a `/tmp/sdp-sec-audit-<timestamp>` excloent `node_modules` i enllaçant dependències.
     2. Escriure primer els tests de regressió (`tests/*.seguretat.test.js`) que fallen davant l'explotació i passen amb el pegat.
     3. Sotmetre cada pegat a un subagent **Verificador Adversarial** independent que busque camins de bypass, regressions o trencament del Model B.
     4. Emetre fitxers `.patch` verificats amb `git apply --check` contra l'arbre real.
3. **`SEC-03` · Llei de Coacció Primitiva de Payloads `JSONB` i Llei d'Escàners Lineals $O(n)$ (Zero ReDoS):**
   - **Problema:** Les troballes `F3, F4, F7, F9, F12` i `R1-R4` de `CLAUDE-SECURITY-20261018-220519` van demostrar que PostgREST permet que un usuari autenticat inserisca objectes o arrays JSON (`{"x":1}` o `{"toString":0}`) dins de columnes `JSONB` (`section_submissions.payload`). Si un traductor fa `...r.payload` o passa eixos camps a React sense coacció a `string`, provoca *React Error #31* (`Objects are not valid as a React child`) o `TypeError` per damunt de `RouteErrorBoundary`, deixant tota la secció o l'aplicació en blanc per a tot el poble. Així mateix, les expressions regulars amb *backtracking* sobre entrades d'usuari (`/<[^>]*>/g`, `/<[a-z][\s\S]*>/i`, `/<img[^>]+src="([^">]+)"/`) permeten denegació de servei en el fil principal (CWE-1333 ReDoS).
   - **Solució:** Incorporar en §2 (Capa 1 i Capa 2) i §5 de `core-seguretat-audit/SKILL.md` dues regles mecàniques obligatòries:
     - **Coacció Primitiva en Mappers:** Tot camp extret d'un `JSONB` de Supabase o d'un DTO de la Frontissa destinat a renderitzar-se o indexar-se ha de passar per un coaccionador primitiu (`typeof v === 'string' ? v : ''`) **abans** d'entrar a l'estat de React, i mai es pot fer `...payload` després de les propietats normalitzades.
     - **Zero Regex amb Backtracking sobre Entrades No Fiables:** Prohibir expressions regulars amb quantificadors imbricats o classes negades obertes sobre HTML/text d'usuari; exigir escàners lineals $O(n)$ amb índexs (`indexOf`, `llevaEtiquetes`, `llevaScriptsIEstils`, `srcsDeLesImg`).
4. **`SEC-04` · Blindatge de Privilegis per Columna, Llistat de Storage i `SECURITY DEFINER` a Supabase:**
   - **Problema:** Les troballes `F1, F2, F8, F13` van revelar tres patrons perillosos en migracions SQL:
     1. Polítiques RLS `SELECT` obertes a `anon, authenticated` sobre taules que contenen columnes privades (`organizations.contact_email` — `F1`).
     2. Polítiques `SELECT` genèriques sobre `storage.objects` (`USING (bucket_id = 'mitjans')` — `F2`), que en Supabase habiliten l'endpoint `POST /storage/v1/object/list/mitjans` i permeten a qualsevol anònim enumerar tots els fitxers de tots els pobles i usuaris (quan un bucket públic ja serveix URLs directes sense necessitat de política `SELECT` oberta).
     3. Funcions `SECURITY DEFINER` (`contacte_organitzacio` — `F8/F13`) que fan `COALESCE(o.contact_email, u.email)` sobre `auth.users` i exposen el correu privat del fundador a altres co-administradors.
   - **Solució:** Afegir aquests tres controls explícits a la Capa 3 i al Checklist §5 de `core-seguretat-audit/SKILL.md`.
5. **`SEC-05` · Blindatge contra Path Traversal en URLs Signades i Suplantació d'Autoritat en Submissions:**
   - **Problema:** `F5` va mostrar que `urlSignadaMitja` passava el `camí` de `sdp-media://mitjans/<camí>` sense validar segments `.` o `..`, `%`, `?`, `#`, `\` o caràcters de control abans de cridar `createSignedUrl`. I `F6, F11, F14` van mostrar que una submission veïnal podia injectar claus d'autoritat (`origen: ' Sóc de Poble '`, `autor: 'Sóc de Poble'`, `seller`, `copyright`, `srcDelPort`) per fer-se passar per comunicat oficial o alterar l'atribució.
   - **Solució:** Incorporar en §2 (Capa 2 i Capa 3) la validació estricta de rutes `sdp-media://` i la purga obligatòria de claus d'autoritat (`CLAU_AUTORITAT_IGNORADA`) en tots els formularis d'aportació veïnal, lligant l'entitat oficial exclusivament a `tenant_id`.
6. **`SEC-06` · Ancoratge Obligatori a les Plantilles de Govern (`prompt_local.md` i `pla_implementacio.md`):**
   - **Problema:** Actualment `core-seguretat-audit` només s'invoca si l'orquestradora se'n recorda manualment en redactar el prompt.
   - **Solució:** Afegir al Preflight (§0) de `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` i a la secció de Verificació de `_wiki_de_poble/03_actuar/plantilles/pla_implementacio.md` la casella obligatòria:
     `- [ ] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking, RLS per columna/Storage i purga de claus d'autoritat).`

### Bloc 3: Destil·lació Forense de les 11 Eines Vives de Categoria C al Laboratori (`02_investigacio_ia/`)

Hem inspeccionat fitxer per fitxer les **11 peces de Categoria C** ubicades a `_wiki_de_poble/04_escriptori/02_investigacio_ia/` i les hem contrastades amb l'arbre actual de `src/`, `tooling/`, `.agents/skills/` i `git log`. Tot seguit s'emet el dictamen forense per a cadascuna:

#### 3.1. Matriu de Dictamen de les 11 Peces de Categoria C

| # | Peça de Categoria C (`02_investigacio_ia/`) | Contingut i Contrast amb el Codi Viu (`src/` / `tooling/`) | Veredicte Canònic | Destí i Instrucció d'Acció Exacta |
| --- | --- | --- | --- | --- |
| `LAB-C01` | `TRACTOR_COGNITIU.txt` (10 línies) | Cartell constitucional del directori que explica la protecció d'`AGENTS.md` §12 (el laboratori és zona d'aterratge en brut i no ha de bloquejar el pre-commit). | **CONSERVAR IN-PLACE** | Mantenir a `_wiki_de_poble/04_escriptori/02_investigacio_ia/TRACTOR_COGNITIU.txt` com a únic fitxer permanent del laboratori buit, afegint-hi 1 línia que indique que les peces processades s'evacuen a `../_investigacio_ia_de_poble/`. |
| `LAB-C02` | `261013_1600_estudi_destil_laboratori_ia.md` (40 KB) | Inventari i cens mestre de les 58 entrades del laboratori amb la classificació en Categories A (16), B (22) i C (11). | **PRESERVAR A SATÈL·LIT** | Un cop executada l'evacuació d'aquesta onada, moure a `../_investigacio_ia_de_poble/261013_1600_estudi_destil_laboratori_ia.md` (i despenjar l'àncora de `00_index_escriptori.md:49`). |
| `LAB-C03` | `261018_1405_estudi_obsidian_rea_gemini4_iaia.md` (22,4 KB) | Enginyeria inversa amb REA d'`obsidian-1.14.4.asar`: física `jC` (long-press tàctil de `250ms` + auto-scroll `60fps`), arbre `dO` amb partició geomètrica `5% / 90% / 5%`, auto-obertura de carpeta als `750ms`, sangria de primer fill i substitució de `<Dialeg mida="s">` per `WorkspaceSettingsPanel`. | **CONSOLIDAR A ARQUITECTURA I SKILL + PRESERVAR A SATÈL·LIT** | 1. Promoure a `_wiki_de_poble/02_saber/architecture/ADR-2026-12-OBSIDIAN-WORKSPACE-REA.md`. 2. Injectar el contracte `5% / 90% / 5%` i `WorkspaceSettingsPanel` dins `.agents/skills/sdp-app-grid-shell/SKILL.md`. 3. Moure còpia original a `../_investigacio_ia_de_poble/` i despenjar de `00_index_escriptori.md:48`. |
| `LAB-C04` | `CLAUDE-SECURITY-20261018-220519/` (14 troballes + 9 `.patch` + `PEGATS.md`) | Contrastat contra `git log`: **8 pegats de codi ja estan aplicats al commit `ed6077ff`** (`F03_F07_F09`, `F04_F12`, `F05`, `F06`, `F11`, `F14`, `R1_R2_R4`, `R3`). **Queden PENDENTS d'aplicar 2 elements:** 1) `pegats/F01_F02_F08_F13_migracions_de_seguretat.patch` (2 migracions SQL per revocar `SELECT` d'`anon` sobre `organizations.contact_email`, blindar `contacte_organitzacio` i eliminar la política pública `mitjans llegir` que permet enumerar `storage.objects`); 2) Troballa `F10` (confirmació UI d'email abans de canviar contrasenya en `definixAmbEnllac` a `src/data/supabase/auth.js:779`). | **CONSOLIDAR PEGAT SQL PENDENT (`F01_F02_F08_F13`) + PLANIFICAR `F10` + PRESERVAR A SATÈL·LIT** | 1. Aplicar `pegats/F01_F02_F08_F13_migracions_de_seguretat.patch` a `supabase/migrations/` en el pròxim torn de backend (conjuntament amb la reparació del test `tests/migracio-membres-organitzacio.test.mjs`). 2. Incorporar les regles a `core-seguretat-audit/SKILL.md` (Bloc 2). 3. Evacuar la carpeta completa a `../_investigacio_ia_de_poble/CLAUDE-SECURITY-20261018-220519/`. |
| `LAB-C05` | `261002_1745_sentinelles_claude/` (`LLEGIU_PRIMER.txt`, `nous/.agents/skills/sdp-sentinelles/SKILL.md.txt`, `registre_tasques.fragment.json.txt`) | Els 7 sentinelles (`estructural`, `trituradorFinancer`, `consolVendes`, `policiaDisseny`, `auditoriaAparador`, `enllacTorn`, `detectiuPoble`) i `PanellSentinelles.jsx` **ja estan vius a `src/sections/tractors/sentinelles/`**. Només falta instal·lar la seua governança (`sdp-sentinelles/SKILL.md` i els 8 disparadors de `registre_tasques.fragment.json.txt`). | **CONSOLIDAR A `.agents/skills/sdp-sentinelles/` i `.agents/cron/registre_tasques.json` + ARXIVAR A SATÈL·LIT** | 1. Promoure `nous/.agents/skills/sdp-sentinelles/SKILL.md.txt` a `.agents/skills/sdp-sentinelles/SKILL.md` (39a skill) + crear symlink a `.claude/skills/sdp-sentinelles`. 2. Fusionar els 8 disparadors a `.agents/cron/registre_tasques.json`. 3. Moure la carpeta a `../_investigacio_ia_de_poble/` i despenjar de `00_index_escriptori.md:281-287`. |
| `LAB-C06` | `261003_1330_empaquetat_mobil_claude/` (`ARQUITECTURA.txt`, `BOTIGUES.txt`, `FASES_1_I_2.txt`, `RUNBOOK_BOTIGUES_IA.txt`, `nous/capacitor.config.json.txt`, `nous/botigues/*.mjs.txt`) | **Peça clau per a la Fase C (Capacitor 8) del Pla 1715:** El codi pre-lease (`vite.natiu.config.js`, `src/natiu/entrada.jsx`, `src/pwa/registre.js`) ja és al repo, però falten `capacitor.config.json` i els scripts de `scripts/botigues/` que estan ací dins (`nous/capacitor.config.json.txt` i `nous/botigues/`). A més, aplicar `politicaDeMitjans('autonom')` a `vite.natiu.config.js` reduirà el bundle natiu `dist-natiu` en **~93 MB** usant les 129 bessones WebP! | **CONSOLIDAR A ARREL (`capacitor.config.json`), `scripts/botigues/` i SKILL/ADR + PRESERVAR A SATÈL·LIT** | 1. Instal·lar `nous/capacitor.config.json.txt` -> `capacitor.config.json` i `nous/botigues/*.mjs.txt` -> `scripts/botigues/*.mjs` en la Fase C. 2. Connectar `politicaDeMitjans('autonom')` a `vite.natiu.config.js`. 3. Actualitzar els comentaris de `src/pwa/registre.js:3` i `src/natiu/entrada.jsx:4` perquè apunten a `_wiki_de_poble/02_saber/architecture/` i moure la carpeta a `../_investigacio_ia_de_poble/`. |
| `LAB-C07` | `261012_0040_sistema_informes_claude/` (`genera_informe.py`, `informe_editorial.css`, `esquema_informe.json`, `README.txt`, `output.html`) | Actualment `.agents/skills/core-informes-pdf/SKILL.md:38` apunta directament a aquesta carpeta temporal. A més, hem detectat que `genera_informe.py:26-30` i `informe_editorial.css:15` carreguen `Source Sans 3` des de `https://fonts.googleapis.com`, violant la sobirania offline i la regla de `core-informes-pdf/SKILL.md:28` (*«s'utilitzarà obligatòriament la família tipogràfica Noto Sans SemiCondensed»*). | **CONSOLIDAR A `tooling/pdf/` (AMB FONT LOCAL `Noto Sans`) + PRESERVAR A SATÈL·LIT** | 1. Moure `genera_informe.py`, `informe_editorial.css` i `esquema_informe.json` a `tooling/pdf/`. 2. Substituir en `genera_informe.py` i `informe_editorial.css` l'import remot de Google Fonts `Source Sans 3` per `@font-face` local cap a `public/fonts/NotoSans-*.woff2`. 3. Actualitzar `core-informes-pdf/SKILL.md:38` cap a `tooling/pdf/` i arxivar l'original a `../_investigacio_ia_de_poble/`. |
| `LAB-C08` | `261012_1315_auditoria_claude/` (`f01.txt`..`f09.txt`, `f11.txt`..`f13.txt` — 12 fitxers) | **TROBALLA FORENSE MAJOR:** Hem comprovat contra el codi actual de `src/` que **cap d'aquestes 12 correccions del 12 d'octubre es va arribar a aplicar a `src/`**: `guardes.js:52,64-66` encara permet colar DNIs/NIEs amb espais o guions (`12 345 678 A`) o separats amb caràcters invisibles Unicode (`\u200B`, `\u2028`); `expedient.js:117-141` encara no comprova IDs duplicats a `comprovaTerminis`; `obligacions.js:344` encara col·lisiona IDs d'ocurrències entre titulars; i `classificaDocument.js:176` encara prioritza l'ordre de l'array sobre la posició al text. | **CONSOLIDAR A CODI (`src/sections/gestoria/**`) ABANS D'ARXIVAR A SATÈL·LIT** | **NO ARXIVAR EN BRUT.** Programar un micro-encàrrec per a Claude Code per aplicar els 12 pegats (`f01.txt`..`f13.txt`) sobre `src/sections/gestoria/identitat/nucli/guardes.js`, `src/sections/gestoria/projectes/nucli/expedient.js`, `obligacions.js` i `classificaDocument.js`, i un cop comessos, moure la carpeta a `../_investigacio_ia_de_poble/`. |
| `LAB-C09` | `261012_1322_relat_historic_xylella.md` (13 línies) | Relat fundacional del Mestre sobre l'error d'una IA que va intercanviar DNI i Nom en el tràmit de la *Xylella fastidiosa* dels ametlers de Nando Llinares; fonamenta l'exigència d'esquemes estrictes en la Finestreta Única (`expedient.js`). No té frontmatter YAML. | **CONSOLIDAR A `_wiki_de_poble/02_saber/memoria_aprenentatges.md` + ARXIVAR A `90_arxiu_historic/`** | Integrar la lliçó de la Xylella dins `_wiki_de_poble/02_saber/memoria_aprenentatges.md` (sota l'epígraf de la Finestreta Única i Gestoria Rural) i arxivar el fitxer a `_wiki_de_poble/90_arxiu_historic/` despenjant l'àncora de `00_index_escriptori.md:54`. |
| `LAB-C10` | `261012_1715_gnucash_arrel.md` (78 línies) | Especificació de comptabilitat de partida doble d'inspiració GnuCash (`Actiu - Passiu = Patrimoni Net + (Ingressos - Despeses)`), separació de Pla de Comptes domèstic vs. autònom/agrícola i conciliació bancària CSV assistida. | **CONSOLIDAR EN NOVA SKILL/ADR DE GESTORIA + PRESERVAR A SATÈL·LIT (`../_gestoria_de_poble/`)** | Unificar amb `LAB-C11` en un document d'arquitectura canònic a `_wiki_de_poble/02_saber/architecture/` (o skill `sdp-gestoria-autonoma`) i preservar l'estudi original a la carpeta satèl·lit `../_gestoria_de_poble/`. |
| `LAB-C11` | `261012_1915_arquitectura_visual_erp.md` (47 línies) | Síntesi de patrons visuals d'Odoo, ERPNext, Ever-Gauzy, Idurar, Grocy i Dolibarr adaptats a Pedra Seca (targetes KPI amb tendència, pipelines Kanban en CSS HSL natiu sense llibreries pesades, simuladors fiscals amb sliders i barra lateral d'apps autònomes). | **CONSOLIDAR EN NOVA SKILL/ADR DE GESTORIA + PRESERVAR A SATÈL·LIT (`../_gestoria_de_poble/`)** | Unificar amb `LAB-C10` i moure l'original a la carpeta satèl·lit `../_gestoria_de_poble/`. |

#### 3.2. Protocol d'Evacuació de les 38 Peces Restants (Categories A i B) i Sincronització amb `00_index_escriptori.md`

D'acord amb la classificació validada a `261013_1600_estudi_destil_laboratori_ia.md`:
- **Les 16 peces de Categoria A (ja consolidades al codi viu)** i **les 22 peces de Categoria B (experiments històrics descartats o superats)** estan llestes per a ser evacuades de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` cap a la carpeta satèl·lit canònica `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/`.
- **Regla d'Or d'Ancoratge (`verificador-scc.mjs` i `porta-olivera.mjs`):** Com que `_wiki_de_poble/04_escriptori/00_index_escriptori.md` (línies 48-58, 74-78, 100-441, 458-461, 531-542 i 586-708) conté actualment **194 àncores wikilink** apuntant a fitxers de `02_investigacio_ia/`, **NO es pot fer un `mv` de shell a cegues** sense netejar simultàniament eixes línies de `00_index_escriptori.md`, o `verificador-scc.mjs` i `tractor-frontmatter.mjs` fallaran per enllaços trencats.
- **Procediment Mecànic Segur:** Executar un script atòmic que:
  1. Moga les carpetes de Categoria A i B (i les de Categoria C ja consolidades) a `../_investigacio_ia_de_poble/`.
  2. Pode de `00_index_escriptori.md` totes les línies `- [[02_investigacio_ia/...]]` i `[...](02_investigacio_ia/...)` dels fitxers evacuats, deixant únicament `- [[02_investigacio_ia/TRACTOR_COGNITIU.txt]]`.
  3. Verifique immediatament amb `node tooling/gates/verificador-scc.mjs` i `node tooling/gates/porta-olivera.mjs` que l'Escriptori queda en 0 errors i 0 orfes.

### Matriu de Conformitat de Requeriments (MCR)

| ID Req. | Requeriment del Prompt `261019_1715_prompt_gemini_auditoria_skills_i_laboratori.md` | Estat | Evidència en aquest Informe |
| --- | --- | --- | --- |
| `REQ-01` | Auditar cadascuna de les 38 carpetes de skills i els seus fitxers `SKILL.md` a `.agents/skills/`. | **COMPLETAT (100%)** | Taula completa de les 38 skills en §Bloc 1.3 i troballes estructurals `S-01`, `S-01b`, `S-02`. |
| `REQ-02` | Identificar dependències trencades, anacronismes de setembre 2026 (rutes obsoletes, selector emoji flotant ja superat, plantilles deprecades) i contradiccions amb el Model B de Sollutia o amb la taxonomia viva. | **COMPLETAT (100%)** | Troballes detallades `A-01` a `A-14` amb línia exacta de fitxer i text de substitució. |
| `REQ-03` | Verificar la coherència i robustesa de `core-seguretat-audit/SKILL.md` com a sentinella permanent per a totes les IAs. | **COMPLETAT (100%)** | §Bloc 2 complet amb els 6 pegats d'enduriment (`SEC-01` a `SEC-06`) basats en les proves reals del *Gauntlet*. |
| `REQ-04` | Avaluar les 11 eines i experiments de Categoria C ubicades a `04_escriptori/02_investigacio_ia` i emetre veredicte individual. | **COMPLETAT (100%)** | §Bloc 3.1 amb matriu `LAB-C01` a `LAB-C11` (incloent-hi el descobriment dels 12 pegats no aplicats de `261012_1315_auditoria_claude` i els 2 pendents de `CLAUDE-SECURITY-20261018-220519`). |
| `REQ-05` | Emetre l'informe canònic `261019_1730_auditoria_gemini_skills_i_laboratori.md` a `_wiki_de_poble/04_escriptori/` i validar-lo amb les portes. | **COMPLETAT (100%)** | Document creat i verificat amb `document.mjs check` i `porta-olivera.mjs`. |

### Proposta d'Automillora (Plantilla `prompt_local.md` v3.8.0 i Orquestració de la Colmena)

1. **Millora de la Plantilla `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v3.8.0 -> v3.9.0):**
   - **Pre-càlcul d'Estat de Portes al Preflight (§0):** L'experiència d'aquest torn paral·lel (on Claude Code ha topat a `261019_1715_auditoria_claude_infraestructura.md:47-57` amb el límit de `16 MiB` de `reflex_petorreta.mjs:451` per al diff binari del Lot 3 de WebP i amb el segell `segella.mjs` desfasat) demostra que el Preflight (§0) de `prompt_local.md` hauria d'incloure tres verificacions mecàniques abans de demanar un `git commit` a un agent local:
     1. `node tooling/gates/segella.mjs` en verd (`0`).
     2. Lease activa de `git-commit` o instrucció explícita d'usar el canal d'administració autoritzat.
     3. Càlcul del pes binari per lot (`< 12 MB` per commit quan hi ha binaris WebP) per no desbordar el buffer de `16 MiB` de `git diff --cached --binary` a `reflex_petorreta.mjs:451`.
   - **Casella Obligatòria de `core-seguretat-audit`:** Afegir al Preflight (§0) la casella del Sentinella Permanent (`SEC-06`) per a qualsevol prompt que toque `src/` o `supabase/migrations/`.
2. **Automatització del Mirall `.claude/skills/` dins `cataleg_skills.mjs`:**
   - Modificar `tooling/brain/cataleg_skills.mjs` perquè en executar `--write` cree automàticament els enllaços simbòlics que falten a `.claude/skills/` i en executar `--check` falle si `.claude/skills/` divergeix de `.agents/skills/`. Això eliminarà per sempre la desincronització detectada en `S-01`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

S'han executat les següents comprovacions mecàniques de només lectura i de validació documental des de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`:

```bash
node tooling/brain/cataleg_skills.mjs --check
node tooling/gates/segella.mjs
node tooling/gates/tractor-cataleg.mjs
node tooling/gates/porta-olivera.mjs
node tooling/wiki/document.mjs check --turn-id torn_cb39a942-aac3-4aaf-a4af-f4b759317437 --file _wiki_de_poble/04_escriptori/261019_1730_auditoria_gemini_skills_i_laboratori.md
```

- `cataleg_skills.mjs --check`: passa amb codi `0` (`"ok": true`), però hem demostrat per inspecció directa que `.claude/skills/` té 36 symlinks en lloc de 38 (`S-01`).
- `segella.mjs`: falla amb codi `1` (`hash actual b4a3d577 vs segellat 5e7339db`, documentat en `S-01b`).
- `tractor-cataleg.mjs`: falla amb codi `1` (`C1 ENQUADRAMENTS_AVATAR (PedraSeca/atoms/Avatar.jsx) no és al registre del catàleg`), pendent de registrar al catàleg d'àtoms.
- `porta-olivera.mjs` i `document.mjs check`: passen amb codi `0`, certificant que l'informe compleix el contracte de seccions, frontmatter v2, rebut reflex i ancoratge a `00_index_escriptori.md`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Complint estrictament la frontera d'efectes d'una auditoria i la concurrència amb el fil paral·lel de Claude Code (`torn_e00934c3-2c90-43dc-8a48-265d7b9c3f6f`), aquest agent no ha modificat cap fitxer de `src/`, `.agents/skills/` ni ha mogut fitxers de `02_investigacio_ia/`. Totes les esmenes estan especificades amb ruta, línia i comanda exacta per a ser executades amb lease a la Fase B del Pla `261019_1715_pla_implementacio_infraestructura_skills_i_mobil.md`.
- La decisió sobre la plantilla `_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md` (`A-13`: registrar-la a `protocolledge.json` o moure-la a `02_saber/`) queda marcada amb `requires_human_decision: true`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[taxonomia_documental]]
- [[261019_1715_pla_implementacio_infraestructura_skills_i_mobil]]
- [[261019_1715_prompt_gemini_auditoria_skills_i_laboratori]]
- [[261019_1715_auditoria_claude_infraestructura]]
- [[261019_1425_auditoria_gemini_skills_i_multimedia]]
- [[261019_1447_auditoria_claude_multimedia_webp]]
