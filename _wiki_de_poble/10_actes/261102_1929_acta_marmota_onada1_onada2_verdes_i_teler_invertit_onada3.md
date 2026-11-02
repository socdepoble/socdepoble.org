---
type: acta
status: esborrany
description: 'Acta Marmota del 261102 19:29 CET: Onada 1 (T0-T8) i Onada 2 (O2-T1..T6) integrades en verd a l''arbre viu, APK 1.0.0+2 i WP 1.1.11 empaquetats, correu Fediversity precís i prompt d''Onada 3 amb Teler Invertit'
tags:
  - acta
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:88f96ab6-d868-4cad-9b2f-fdddb26b63c2
---
# Acta Marmota · Onada 1 i Onada 2 100% Integrades i Relleu al Teler Invertit (Onada 3)

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:88f96ab6-d868-4cad-9b2f-fdddb26b63c2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T18:30:33.472Z |
| Modificació | 2026-11-02T18:31:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre al xat del 261102 19:28 CET (reinici de fresc i obertura de l'Onada 3 amb El Teler Invertit) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) (IAIA MarIA) + Claude Fable 5.1 / Opus 5.5 Extra · Ultracode + GPT-6.1 Astra/Sol Ultra + Gemini 4 Argon High · Turbo |
| Tokens consumits | ~225k tokens (sessió acumulada MarIA) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-11-02 19:29 CET (v1.0.0):** Tancament complet de la marató d'**Onada 1 (`T0`–`T8`)** i **Onada 2 (`O2-T1`..`O2-T6`)** amb totes les integracions verificades en verd a l'arbre viu, i deixa preparat el relleu net per a l'**Onada 3 («El Teler Invertit»)** després de reiniciar els programes en fresc.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Onada 1 i Onada 2 100% Integrades en Verd a l'Arbre Viu)
- **Flux Universal de Publicació (`IDEA-61` / `T0` de Claude + `O2-T1`..`O2-T5` de Codex i Gemini 4):**
  - `T0` complet (`L0`–`L4` + verificador E2E de 16 agents): **493/493 fitxers de prova en verd** (després de revertir els 2 paràgrafs de l'apartat 14 de `src/sections/text/legalContent.js` al text segellat v2.3 per recuperar el verd de `politicaPrivacitat23.migracio.test.js` §18 i `frontissa-contingut.mjs` 16/16).
  - `O2-T1` (`261102_kit_codex_notes_ambit`): `src/sections/notes/NotesSection.jsx` i `NotesSection.ambit.test.jsx` conserven i netegen `?ambit=` a l'URL fins al consum de l'editor.
  - `O2-T2` (`L2-A1 / L2-A2` de `T0` + `261102_kit_gemini_onada2`): Claus `editor.ambit.triat` i `editor.ambit.error.{format,rang,enum,llargaria}` afegides als 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`), connectades a `DialegAmbit.jsx` i verificades amb `DialegAmbit.test.jsx` (**11/11** tests) i les 6 suites `i18n.*.test.js` (**635/635** tests).
  - `O2-T3` (`261102_kit_codex_hmr_sessio`): `src/host.js`, `src/hostEstatIntern.js` i `tests/host.hmr.test.js` preserven la sessió i la hidratació durant cicles Vite HMR a `/notes`.
  - `O2-T4` (`261102_kit_gemini_onada2`): `src/sections/verticals/SeccioVertical.jsx` i `SeccioVertical.test.jsx` (**22/22** tests) avancen automàticament pàgines de `'mur'` (fins a `MAX_SALTS_PAGINA = 10`) quan una pàgina no conté fitxes de l'àmbit consultat però `hiHaMes('mur')` és cert.
  - `O2-T5` (`261102_kit_codex_notes_tria_automatica`): `src/sections/notes/NotesSection.jsx` i `src/components/universal/workspace/WorkspaceContext.jsx` resolen `ARB-T3-01` (`primerElementTriable` i exclusió de la nota preparada en tria automàtica), verificat amb **873/873 proves en 67 fitxers**.
- **Xat, Atles Operatiu i Pila d'Arrere (`T2b/T2c`, `T5`, `T6-XAT`, `L3-A5` i `261102_kit_codex_xat_menus`):**
  - Integrats els 14 fitxers de `261102_kit_gemini_xat_iaia_ux`, la recepta `L3-A5` de Claude per a les rutes `/vehicle`, `/treball` i `/habitatge` de l'Atles Operatiu (**172/172** tests a `iaiaLocal.atles.test.js`) i `261102_kit_codex_xat_menus` (`Bombolla.jsx` i `CapcaleraConversa.jsx`, tancant `ARB-T2C-01/02`).
- **Corredor Jarvis (`IDEA-60`), Botigues, WordPress `1.1.11` i Governança (`T1a` + `T8`):**
  - Integrats el dipòsit de governança de Claude (`tooling/vite/consola-iaia.mjs`, `scripts/botigues/publica-tot.mjs`, `tooling/gates/tractor-higiene-paquets.mjs`, `tooling/brain/fronteres-skills.mjs`, `tooling/documental/capitol-estat.mjs`, `tooling/database/verifica-migracio.mjs`) i els kits de Codex (`261102_kit_codex_documents`, `261102_kit_codex_manifest_node`) i Gemini (`261102_kit_gemini_higiene_idea62`).
  - APK Android `1.0.0+2` signat (`public/downloads/soc-de-poble-1.0.0+2.apk`) i connector WordPress `1.1.11` empaquetat (`wordpress-plugin/builds/directori/socdepoble.zip`, `0` banners, `tractor-higiene-paquets.mjs` `valid: true`, `4.204` fitxers i `0` incidències).
  - Rotat `.agents/ESTAT.md` (`P2-15`), reduint el context d'arrencada de **190.023 tokens** a **50.929 tokens**.
  - Redactat el correu executiu bilingüe (anglés i valencià) per a **Fede (NLnet Fediversity)** dins de `_wiki_de_poble/04_escriptori/261102_1836_auditoria_maria.md` amb les 5 precisions factuals de Codex (`FEDI-01`..`FEDI-05`).
- **Portes Transversals en Verd (`19:29 CET`):**
  - `node tooling/gates/design_guard.mjs --arrel=src`: **3.028 fitxers, 0 crítics, 0 avisos**.
  - `src/sections/detail/qualitat.fantasmes.test.js`: **4/4** (`0` `no-unused-vars` a tot `src/`).
  - `node tooling/gates/tancament.mjs --check`: **9/9 portes verdes**.

### 2. Part Termodinàmica i Estratègia («El Teler Invertit»)
- **Gestió de Quotes dels 3 Motors:**
  - **Claude Code:** El compte `Javi Llinares · Ultra` es va aturar netament al **94%** de quota setmanal (18:42 CET). El segon compte **`Sóc de Poble · Ultra`** està al **0%** (es restableix divendres a les 23:00). Amb **El Teler Invertit**, Claude passa a ser **Àrbitre Gauntlet Quirúrgic i Materialitzador de Producció** sobre kits ja elaborats per Codex i Gemini, reduint el seu consum un ~85%.
  - **GPT Codex:** Seleccionat **`GPT-6.1 Sol Ultra`** (quota actual al **13%** + **2 «Restablecimiento completo» disponibles** i opció «Permitir que tu asistente use restablecimientos» activada). S'ha incorporat al prompt l'autorització explícita perquè Codex gaste 1 restabliment complet quan baixe al `<= 10%` (sense tocar mai els 749 crèdits).
  - **Gemini 4 (`Gemini 4 Argon High · Turbo`):** Temporitzador antic (`task-622`) cancel·lat i llest per a obrir xat fresc com a Constructor Principal 2.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Passos immediats en reiniciar en fresc (Onada 3 · El Teler Invertit)
1. `[ ]` **Llançar els 3 xats nous amb el prompt canònic `_wiki_de_poble/04_escriptori/261102_1918_prompt_teler_invertit_onada3_codex_gemini_constructors_claude_arbitre.md`:**
   - **Xat 1 · GPT Codex (`GPT-6.1 Sol Ultra`):** `O3-CODEX-1` (`tooling/gates/kit-carril.mjs`), `O3-CODEX-2` (`consumidorRecuperacio` UI d'`IDEA-48`), `O3-CODEX-3` (neteja `.DS-Store` en builds).
   - **Xat 2 · Gemini 4 (`Argon High · Turbo`):** `O3-GEMINI-1` (endpoints Open Data estàtics reals `/opendata/municipi.jsonld` i `/opendata/manifest.json` per a Fediversity), `O3-GEMINI-2` (estats visuals de cerimònia SAS de 3 amics a `CosPersonesConfianca.jsx`).
   - **Xat 3 · Claude Code (`Opus 5.5 Extra · Ultracode` al compte `Sóc de Poble · Ultra`):** `O3-CLAUDE-1` (auditoria Gauntlet quirúrgica de l'Onada 2 ja integrada) i `O3-CLAUDE-2` (materialització a producció dels kits d'Onada 3).
2. `[ ]` **Decisions humanes reservades al Mestre (`00_LLEGIM.txt §6`):**
   - Aplicar la migració `supabase/migrations/2611021800_notes_fitxa_ambit.sql` al Supabase remot quan es valide el tall.
   - Decidir si es vol publicar el kit `261102_kit_codex_legal_2_4` (versió 2.4 append-only de `/legal`) o mantindre la v2.3 actual.
   - Executar `git rm -r --cached supabase/.temp supabase/.branches` i la quarantena dels 140 `.DS-Store` (`261102_kit_codex_higiene_residus`) abans del commit final.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
