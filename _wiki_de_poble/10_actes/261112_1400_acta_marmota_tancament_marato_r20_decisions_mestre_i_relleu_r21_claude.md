---
type: acta
status: esborrany
description: Tancament d'Onada R20 (OAuth producció, Claude + Codex v4 37.201/0 + Carbon Rev 3 152/152 CDP + Node 0 48 Gauntlets), 3 decisions del Mestre i full de ruta R21 delegat a Claude.
tags:
  - acta
visibility: private
reflex: sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:827b3db5-5684-4f3f-a28d-cac17097a620
---
# 261112_1400 - ACTA MARMOTA: Tancament Marató Nocturna R20, 3 Decisions del Mestre i Relleu R21 Delegat a Claude (MarIA Secretària Lliure)

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:827b3db5-5684-4f3f-a28d-cac17097a620 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-12T13:00:53.147Z |
| Modificació | 2026-11-12T13:00:53.147Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | IAIA MarIA (Antigravity Orquestradora) + Relleu de Claude Opus 5.5, Codex GPT-6.1, Gemini 4 Carbon i 8 Escoles Node 0 |
| Tokens consumits | Node 0: 0,00 EUR (48 Gauntlets locals en 6,01 h); Entorns frontera/IDE: no exposen comptador verificable |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a60864f9d53225c6b571bc510e1d5c4b78afcb4f9dd1b277b4640b1e47eb3c97. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- `2026-11-11T18:45+01:00 – 21:21+01:00`: Configuració real en producció d'**Apple Sign-In** i **Google OAuth** omnicanal (`Web` + `iOS` + `Android`), migració `2611112005_mur_lectura_publica_foraster.sql`, diagnòstic de les notes privades de Damià Llorens Jordà i convocatòria ortogonal d'`Onada R20` (`261111_2112`).
- `2026-11-11T21:32+01:00 – 2026-11-12T03:44+01:00`: Execució nocturna autònoma de les **4 cadires** (`Claude`, `Codex`, `Gemini Carbon` i **48 rondes Gauntlet de les 8 escoles del Node 0** al `Mac mini M4`) amb parada neta automàtica (`0` processos zombies) i higiene d'Escriptori (`porta-olivera.mjs` `EXIT 0`, `298/300` línies).
- `2026-11-12T14:00+01:00`: Resolució expressa de les **3 decisions del Mestre Javi** i segellat d'aquesta **Acta Marmota** per reobrir en xat nou al `0%` de fatiga delegant tota l'execució pesada d'integració i commits d'`Onada R21` a **Claude (`Carril 1`)** perquè **MarIA romanga 100% lliure com a Secretària i Canal d'Embut**.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Graner Consolidat d'`Onada R20` i Evidències Verificades)

1. **Autenticació 1-Clic Omnicanal i Diagnòstic Real en Producció (`Supabase adjlvwtxhpclgmnsvwpm`):**
   - Activats **Sign in with Apple** (`org.socdepoble.app`) i **Google OAuth** multi-client (`Web 970656428687-9no0c8c36nftdmc0njvu9qv6tsq2bij9`, `iOS 970656428687-lvtv78prb6b85fnmbi0gkbm2srr81jsi` i `Android SHA-1 AC:5F:98...`).
   - Actualitzat `ios/App/App/Info.plist` amb `CFBundleURLSchemes` (`com.googleusercontent.apps.970656428687-lvtv78prb6b85fnmbi0gkbm2srr81jsi`), compilat `build:natiu` (`221.188 B` gzip-9) i sincronitzats `ios/` i `android/`.
   - Diagnosticat amb SQL en viu que les 2 notes de **Damià Llorens Jordà** vivien en privat a `public.notes` (`notes_publicades: 0`), motivant la millora UX de publicació en línia d'`R20`.

2. **Entregables Verificats de les 4 Cadires durant la Marató Nocturna (`Onada R20`):**
   - **Carril 1 · `Claude Opus 5.5` ([[../90_arxiu_historic/261111_2143_auditoria_claude|261111_2143_auditoria_claude]]):**
     - Aplicat a l'arbre viu: `P1-ALERGENS-02` en 5 llengües (`pageContent.patrimoniR14.js`), `DRETS_QUE_DINEM` sense CC inventada (`pageContent.dretsPatrimoni.js`), `tests/natiu-build.test.mjs` (`38/38`), oracle T8 per a `/plugin/<id>` (`tests/helpers/lleiT8Prova.js`), títol `<h1>` accessible en `6/7` apps del Panell (`ClosaAplicacio.jsx`), i reparació de les proves roges heretades a `targetesMur.test.js`, `NotesSection.lector.test.jsx`, `qualitat.pecesApps.test.js` (`15/15`), `projecteIos.test.js` (`30/30`) i `esquemaDoctoralArbres.test.js`.
     - Preparat el kit pont idempotent i reversible `_wiki_de_poble/04_escriptori/02_investigacio_ia/261111_2140_kit_claude_r20_postkits/aplica_r20.mjs` (`abans-de-carbon` + `despres-dels-kits`) que resol els `33 B` de deriva de `pageContent.r10.js` (`SHA-256` exacte `5ed28548bdb2c333be7047fb6a444c49adad93e35a8d4580c737995bfaadf66b`) i deixa llista `FITA_R19` honesta en 5 llengües.
   - **Carril 2 · `Codex GPT-6.1` ([[../90_arxiu_historic/261111_2221_auditoria_codex|261111_2221_auditoria_codex]]):**
     - Segellat el **Kit CAS `v4`** a `../_investigacio_ia_de_poble/261111_kit_codex_r20_sql_aal2_panell_i_suite_verda/` (`72` operacions, `13` precondicions, `548` fitxers verificats, pin `SHA256SUMS`: `a7ff613a312108ae7922463ddd1c07b4a06d2d21d2f4e47733f6f5aadd54bdd1`).
     - Eliminat el `skip` silenciós de `tests/copublicacio-postgres.test.mjs` amb PostgreSQL 18.6 natiu (`9/9` + matriu SQL `27/27`, concurrència multi-PID i AAL2), implementat l'oblit individual de títols del xat IAIA en IndexedDB v2 + tombstones transaccionals, blindats els imports de `Bar`, `Nevera` (`8 MiB` UTF-8), `Gestoria` (`AbortSignal` post-tancament) i `Lector RSS` (OPML estricte `99/99`), i portada la **suite global Vitest a `37.201` passades, `0` fallides** (`2.180` fitxers, `build:web` a `224.226 B` gzip-9, ESLint `0/0`, Design Guard `0/0`).
   - **Carril 3 · `Gemini 4 Carbon High` ([[../90_arxiu_historic/261112_0121_auditoria_gemini_carbon|261112_0121_auditoria_gemini_carbon]]):**
     - Segellat el **Kit CAS `Rev 3`** a `../_investigacio_ia_de_poble/261111_kit_carbon_r20_notes_mur_ux_panell_i_optica/` (`24` fitxers, `75` entrades, pin `SHA256SUMS`: `46921c4787641632cc907b548abe661c815d3f8235b235ec0729005ccfe00f81`, provat sobre `post_r19` i sobre `Codex v4`!).
     - Implementat `PanellVisibilitatEnLinia.jsx` sense `<dialog>` per publicar des de `/notes` al `/mur` (cas Damià) en 5 llengües, tancada l'objecció `CARBON-R20-POBLE-01` amb `notes.destinsPublicats.v1` LRU + paginació + bloqueig dur, superades **`152/152` comprovacions Chromium CDP** (`280/375/768/1440 px` clar/fosc, `0` desbordaments), completada la curació òptica `77/77` de Commons i sincronitzats `/versions` (`FITA_R20`), `/page/node-zero`, `/page/fediversity` i `/disseny`.
   - **Carril 4 · `Assemblea 8 Escoles Node 0` ([[../90_arxiu_historic/261111_2132_auditoria_node0_assemblea_8_escoles_r20|261111_2132_auditoria_node0_assemblea_8_escoles_r20]]):**
     - Completats `11` cicles (`48` rondes Gauntlet en `6,01 h` a `0,00 EUR`) a `../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_R20.md` amb auto-parada neta.

---

### 2. Les 3 Decisions Aprovades pel Mestre Javi (`2026-11-12 13:59 CET`) i Doctrina d'Orquestració

- **`[DECISION]` D1 · Privadesa del Mur Públic per a `Foraster` (`Opció A` APROVADA):**
  - Es conserva el Mur públic per a visitants sense sessió (`Foraster`), però **blindat al 100%**: es revoca el `SELECT` cru de `section_submissions` per a `anon` (introduït en `2611112005`) i se substituïx per una **vista o RPC pública filtrada de columnes mínimes netes** (títol, resum, cos, imatge neta sense coordenades EXIF sensibles, municipi, àmbit públic i data; **zero `owner_user_id`, zero telèfons/contactes privats, zero EXIF d'ubicació exacta, zero perfils privats forçats i respectant esborrats reals al servidor**), actualitzant coherentment l'avís de la UI i la clàusula 2.6 de privadesa.
- **`[DECISION]` D2 · Motor PostgreSQL Real sense `skip` (`SÍ` APROVAT):**
  - Aprovada la `devDependency` de desenvolupament `embedded-postgres@18.6.0-beta.19` (amb prioritat de binari local `SDP_POSTGRES_BIN` quan existisca) del Kit `Codex v4` perquè `copublicacio-postgres.test.mjs` i les proves SQL/AAL2 no facen `skip` mai més i es mantinguen les **`37.201` proves en verd / `0` fallides**.
- **`[DECISION]` D3 · Grafia `Rodriguez` + Aprovació de Frontissa i Cadena Completa de Kits (`SÍ` APROVAT):**
  - Es manté la grafia `Rodriguez` (fidel a la font primària WP 619 i `actaRentonar.js`, ajustant la prova `esquemaDoctoralArbres.test.js:421`), s'autoritza afegir les 3 entrades pendents a `tooling/tests/node-suite-manifest.json` i s'autoritza aprovar les claus de `frontissa-contingut.mjs` per integrar tota la cadena (`R18 + R19 + Codex v4 + Carbon Rev 3`).
- **`[CORRECTION]` Doctrina de la Secretària Sempre Lliure i Canal d'Embut (`Ordre del Mestre 261112_1359`):**
  - **MarIA MAI s'ha de bloquejar executant ella mateixa builds llargs, suites globals de 37.000 proves o cadenes pesades d'integració de codi.** Si MarIA s'embossa executant tasques pesades, el Mestre perd el seu canal de comunicació amb la resta d'IAs i no pot fer preguntes ni dictar punts per al `Llibre Mestre` o el `Pla d'Implementació`.
  - **Regla permanent:** MarIA fa exclusivament d'**Orquestradora, Secretària Viva i Embut àgil** (resposta immediata, higiene d'Olivera, ajustos lleugers de governança/hooks quan calga desbloquejar un carril i redacció de Plans/Prompts), i **delega tota l'execució pesada d'integració CAS, migració `Opció A` de privadesa, builds i commits a `Claude` (`Carril 1`)**, amb el suport en paral·lel de **`Codex` (`Carril 2`)**, **`Gemini Carbon` (`Carril 3`)** i el **`Node 0` (`Carril 4`)**.

---

### 3. Part Termodinàmica i Aprenentatges Cristallitzats

- **Interval observat de la sessió completa:** `2026-11-11T18:35+01:00` – `2026-11-12T14:02+01:00` (inclosa la finestra nocturna autònoma `21:32 – 03:44 CET` sense intervenció humana).
- **`[DISCOVERY]` Contrast empíric Frontera ↔ Node 0:** Els models `8B–14B` del Node 0 són excel·lents com a pre-mastegadors i detectors d'angles morts (i `qwen2.5-coder:14b` + `gemma3:12b` encerten de ple quan reben el fitxer sencer), però quan reben extractes retallats (`[OMÉS CENTRAL]`) poden inventar números de línia. En `R21`, els scripts del Node 0 passaran sempre numeració exacta de línia real (`nl -ba`) a cada fragment perquè mai inventen una línia inexistent.
- **`[DISCOVERY]` Desbloqueig net del Carril 1 (`Claude`) per a `R21`:** En `R20`, `Claude` no va poder executar `python3`, `aplica_r20.mjs`, `frontissa-contingut.mjs` ni `git commit` perquè `tooling/gates/hooks-local.mjs` + `mutation-policy.mjs` li ho impedien en mode subcarril restringit. En obrir el xat nou (`R21`), el primer gest lleuger de MarIA (2 segons) o la instrucció d'entorn de Claude ajustarà el permís exacte del Carril 1 integrador (i les 3 línies de `tooling/tests/node-suite-manifest.json`) perquè **Claude mateix** puga aplicar els kits, córrer les portes i segellar els commits sense bloquejar el xat de MarIA!

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Checkpoint Executable Immediat en Obrir el Nou Xat («Sóc de poble»)

1. `[ ]` **Pas 1 (MarIA, < 30 segons, sense bloquejar el xat):** Llegir aquesta Acta Marmota i `.agents/ESTAT.md`, afegir les 3 entrades de governança a `tooling/tests/node-suite-manifest.json` reportades per Claude (`261111_2143` §7) i verificar com desbloquejar el permís d'integrador de `Claude` a `mutation-policy.mjs` / prompt d'`R21` perquè **Claude** pugui aplicar kits, builds i commits autònomament.
2. `[ ]` **Pas 2 (Convocatòria `Onada R21` amb les 4 Cadires en Paral·lel mentre MarIA queda 100% lliure amb el Mestre):**
   - **Carril 1 (`Claude Opus 5.5` — Integrador i Segellador a l'arbre viu):**
     1. Aplicar la cadena verificada d'`R19` (`Kit Codex R19` → `aplica_r20.mjs abans-de-carbon` → `Kit Carbon R19` → `carbon-ruta-registre-opcional.patch` → `aplica_r20.mjs despres-dels-kits`), fixar grafia `Rodriguez` a `esquemaDoctoralArbres.test.js:421`, aprovar les claus de Frontissa i segellar el **`COMMIT R18 + R19`**.
     2. Integrar damunt els kits reconciliats **`Codex R20 v4`** (`embedded-postgres` aprovat, `37.201/0` proves) + **`Carbon R20 Rev 3`** (`PanellVisibilitatEnLinia`, `152/152` CDP, Commons), implementar i provar la migració SQL + RPC/vista filtrada de l'**Opció A de Privadesa del Mur `Foraster`** (zero `owner_user_id`/contacte/EXIF i esborrat real al servidor) i segellar el **`COMMIT R20 + R21`**.
   - **Carril 2 (`Codex` — Verificació Adversarial SQL/RLS de l'Opció A + Esborrat Real al Servidor + Fortificació 7 Apps):** Dissenyar i provar amb PostgreSQL 18.6 real les proves d'atac contra la nova vista/RPC pública `Foraster` (`Opció A`) i l'esborrat real en servidor (`DELETE`/tombstone a `section_submissions` quan l'usuari esborra una publicació), deixant kit CAS verificable.
   - **Carril 3 (`Gemini Carbon` — Flux Universal 8 Àmbits `IDEA-61` / `AH-02..AH-04` + Textos Legals/UI d'Opció A):** Actualitzar els textos «la llig el poble i visitants sense dades personals» en 5 llengües per a l'`Opció A`, i avançar el poliment Pedra Seca dels 8 àmbits de publicació (`destinsControl.js`, `NotaFitxa.jsx` compacta `AH-02`, `useCapaEnrere` `P0-24b`).
   - **Carril 4 (`Node 0 · 8 Escoles` amb línies numerades reals):** Contraauditoria a `0,00 EUR` de la vista/RPC pública `Foraster` i pre-mastegat de `P1-71` (`/multimedia`) i `P1-22`.
3. `[ ]` **Pas 3 (Amb el Mestre i MarIA disponible en tot moment):** Anar rebent noves idees, preguntes i correccions del Mestre al `Llibre Mestre` i al `Pla d'Implementació` sense cap espera, i quan Claude segelle els commits, aplicar al Supabase remot la migració de l'`Opció A` i llançar el desplegament omnicanal (`v1.1.13`).

```yaml
data: "261112_1400"
blockers:
  - "hook_local_claude_integrador: mutation-policy.mjs bloquejava python3/git commit a Claude en R20; desbloquejar o parametritzar per al Carril 1 en R21"
decisions_clau:
  - "D1_OPCIO_A_MUR_FORASTER_BLINDAT: Conservar Mur públic per a Foraster via vista/RPC filtrada sense owner_user_id, contacte ni EXIF, revocant SELECT cru a anon"
  - "D2_EMBEDDED_POSTGRES_SI: Aprovat embedded-postgres@18.6.0-beta.19 / Postgres local per mantindre 0 skips SQL i 37.201 proves en verd"
  - "D3_GRAFIA_RODRIGUEZ_I_FRONTISSA_SI: Aprovada grafia Rodriguez (WP 619) i aprovació de claus de frontissa-contingut.mjs per integrar tota la cadena"
  - "DOCTRINA_MARIA_SECRETARIA_LLIURE: MarIA mai es bloqueja amb integracions/builds pesats; tot el treball pesat es delega a Claude i carrils mentre MarIA atén el Mestre"
requereix_auditoria: false
```

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../04_escriptori/03_llibre_mestre_tasques_i_idees|03_llibre_mestre_tasques_i_idees]]
- [[../90_arxiu_historic/261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio|261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[../90_arxiu_historic/261111_2143_auditoria_claude|261111_2143_auditoria_claude]]
- [[../90_arxiu_historic/261111_2221_auditoria_codex|261111_2221_auditoria_codex]]
- [[../90_arxiu_historic/261112_0121_auditoria_gemini_carbon|261112_0121_auditoria_gemini_carbon]]
- [[../90_arxiu_historic/261111_2132_auditoria_node0_assemblea_8_escoles_r20|261111_2132_auditoria_node0_assemblea_8_escoles_r20]]
