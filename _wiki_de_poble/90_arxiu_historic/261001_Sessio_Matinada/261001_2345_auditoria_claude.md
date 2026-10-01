---
type: informe
status: esborrany
description: 'Auditoria T1-T4 de final de jornada: tractors del Brain skill per skill, avisos de la Consola, mètriques d’auto-maduresa i deure d’informar (guia AEPD), amb verificació adversària.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_72ac6d8a-eca8-4878-b617-7b6ce9227fc9:59a7a39e-6a1e-4c93-abc7-cc931ad6afa6
---
# Auditoria Claude: tractors del Brain, consola, telemetria i privacitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_72ac6d8a-eca8-4878-b617-7b6ce9227fc9:59a7a39e-6a1e-4c93-abc7-cc931ad6afa6 |
| Versió del document | 1.0.1 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T21:43:21.836Z |
| Modificació | 2026-10-01T22:12:00Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador i subagents |
| Tokens consumits | Subagents: 15.147.691 (13.072.037 de l'auditoria i 2.075.654 de la síntesi). L'orquestrador no té comptador fiable: N/D |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-01T18:56Z: torn `torn_72ac6d8a-eca8-4878-b617-7b6ce9227fc9` obert (`--scope documents`). Prompt llegit: `261001_2003_prompt_claude.md`. El Pla `261001_2050_pla_implementacio.md` era un esquelet. MarIA el va incrustar a «Instrucció del torn» del prompt, i el prompt de Claude no ha canviat des de les 20:57 locals.
- 18:58–19:05Z: reconeixement de l'orquestrador (vegeu Verificació):
  - polítiques del hook;
  - 29 rutes de localhost:3340;
  - `/__iaia/mapa.json` i `/__iaia/consola.json`;
  - el frontmatter de les 5 skills noves.
- 19:07–21:00Z: workflow d'auditoria `wf_89e16bf0-b1e`. 59 agents: 16 d'investigació, 13 verificadors per lots, 21 segones passades, 1 crític, 4 farcits i 4 verificadors de farcit. Les tres passades:
  - investigació en paral·lel per tasca;
  - verificació adversària per lots;
  - segona passada independent per a cada troballa alta.

  A continuació, un crític de completesa va trobar 6 buits, i 4 agents en van farcir 4.
- 19:15–21:33Z: llegits sencers els documents nous de l'Escriptori:
  - `261001_2003_prompt_codex.md`, actualitzat;
  - `261001_2100_auditoria_codex.md`, versions 1.0.0 i 1.1.0;
  - `261001_2110_pla_calendari_vistes.md`, un esquelet;
  - `guia-modelo-clausula-informativa.pdf`, les 18 pàgines (dues de coberta, el cos i la contracoberta).
- 21:05Z: **tall de l'orquestrador**:
  - nou GET de `/__iaia/mapa.json` i `/__iaia/consola.json`;
  - 8 rutes al navegador;
  - `git status` i `git diff --stat`.

  Corregida una dada errònia de l'orquestrador: l'últim rebut no és del 2026-09-10. És del 2026-09-19T23:03:39Z, perquè l'array no està ordenat.
- 21:07–21:36Z: workflow de síntesi `wf_8d0d41d2-ead`, amb 7 agents. Es redacta per seccions i es reverifiquen al disc els fets que han canviat.
- 21:38–21:42Z: **reparació aplicada** (T2):
  - `src/sections/consola/consolaContent.js` i la seua prova;
  - `npx vitest run src/sections/consola`: 339/339;
  - comprovada al navegador.

  S'ha fet dins d'este torn, que és `documents` i no té pla (`plan: null`). L'ordre T2 del prompt l'autoritza, però el torn no la cobrix (vegeu Límits).
- 21:43Z: document creat pel circuit documental (`document.mjs context` → `create`). El nom porta `2345` i la creació és de les 23:43 locals: és una hora 2 minuts futura, el mateix defecte que T1C-03, i el `create` no el rebutja. No es reanomena perquè `handoff` està vetat a Claude. Queda declarat ací.
- 21:53Z: contingut complet. `document.mjs check` vàlid, porta Olivera neta i `porta-documents` sense cap error d'este informe.
- 21:57–22:09Z: un verificador independent revisa les seccions escrites per l'orquestrador i troba 18 discrepàncies:
  - el bloqueig de release ja superat;
  - hores;
  - pàgines del PDF;
  - ids;
  - xifres d'agents;
  - format del LEDGER;
  - entre altres.

  Totes s'han corregit en la versió 1.0.1. Reverificat a les 21:58Z: `node --test` d'enxufe-plugin, enxufe-empaqueta i enxufe-pantalla, 47/47.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**T1 · Tractors del Brain.**
- **Skills:** 29, cap en verd (15 en roig, 14 en ambre). Només 3 tenen un flux executable de punta a punta (21 parcial, 5 no).
- **Nucli de memòria i context:** 26 peces; 15 en roig i 1 en verd (time-machine).
- **Patró dominant:** maquinària ben feta però desendollada, o que no deixa rastre. Les skills descriuen en prosa procediments que no nomenen el tractor real. A més:
  - el diari de sessió no té escriptor;
  - Claude i Codex no deixen traça;
  - el hook d'Antigravity deixa escriure a `.agents/skills` i executar `segella --update` sense lease, mentre que el de Claude i Codex ho veta.
- **Conseqüència:** les 5 skills noves van entrar amb el frontmatter invàlid i es van segellar així a les 19:37Z, en una reconciliació sense actor ni validació. Eixes cinc tomben el catàleg i el tancament de tots els torns.
- **Directiva de l'acta 261001_1920** (un flux quantificable darrere de cada tractor): proposat més avall per a les 29 skills i per a 19 de les 26 peces del nucli. Falten hooks, antigravity-hook, portes documentals, time-machine, el Mapa, el mirall d'AGENTS i el bot.

**T2 · Consola de localhost.**
- **Navegador:** sense errors propis de l'aplicació (29 rutes a les 19:00Z i 8 a les 21:05Z).
- **Consola Termodinàmica:** 28 avisos a les 19:00Z i 23 a les 21:05Z. Els 5 alts són el frontmatter invàlid de les 5 skills.
  - **Remei preparat:** blocs YAML validats contra `schema.json`, `skills:index` i 5 symlinks.
  - **Lease:** sí; s'aplica per `executor-mutacio.mjs`.
- **Reparat en este torn:** el pols rebutjava sencer `consola.json` per l'ajust «1702 crèdits» de `credits.json` i mostrava «No s’han pogut llegir les dades». Ara llig les dades.
- **Alertes per al carril de MarIA i Codex:**
  - **C2 aplicat:** la validació UUID ha deixat **50 proves roges a `src/data`**.
  - **`readme.txt` traduït:** entre les 19:26 i les 21:28Z va trencar `enxufe-plugin` (14/16) i `enxufe-empaqueta` (10/14), i durant eixa finestra no es podia generar cap release. El mateix carril ho ha corregit entre les 21:20 i les 21:28Z (`empaqueta.mjs`, proves i traducció). A les 21:58Z les tres suites del plugin passen (47/47): **ja es pot empaquetar**.

**T3 · Mètriques d'auto-maduresa.**
- **Conjunt:** 14 mètriques (M01–M14), alineades amb la norma canònica `index_trellat.md`:
  - CT i CE per separat;
  - CA fora d'abast d'agent;
  - CR en N/A;
  - mai una estimació en lloc d'una dada.
- **Model:** de maduresa N0–N4. L'eixam està en **N0**: MarIA té traça però el Mapa no la llig, i Claude i Codex no en deixen cap al repo.
- **Primera onada:** no necessita lease i és tota a `src/`.

**T4 · Legal i privacitat.**
- **Marc:** la guia de l'AEPD que ha deixat MarIA, amb les reserves de vigència que s'expliquen. La primera capa d'informació no existix al punt de recollida (l'alta i l'entrada amb Google), i la casella de «consentiment» obligatòria contradiu la base contractual.
- **10 riscos prioritzats.** Primer de tot:
  1. una sessió de WhatsApp Web a l'historial de git (el contingut és hipòtesi; acció del Mestre hui mateix: tancar els dispositius vinculats);
  2. producció no contrastada amb el repositori: falta una columna del 26-09 i la RLS no s'ha comprovat;
  3. el padró del poble obert a qualsevol compte;
  4. una supressió que deixa fitxers vius.
- **Preparat:** l'esborrany de primera capa i l'índex de la segona, de l'avís legal i de l'avís d'IA. Res d'açò és assessorament jurídic.

### Tall temporal i arbre concurrent

L'arbre ha estat concurrent tota la vesprada (MarIA i Codex). Les observacions porten hora, i el tall de referència és **2026-10-01T21:05Z**. Canvis observats durant l'auditoria:

| Hora (Z) | Canvi | Efecte en este informe |
|---|---|---|
| 19:12–19:26 | `wordpress-plugin/readme.txt` traduït (148 línies) | C6 de Codex superada (17/17). `enxufe-plugin` passa a 14/16 i `enxufe-empaqueta` a 10/14, fins a les 21:28Z (T2) |
| 19:37:26 | Reconciliació explícita del segell (transacció `3815d3de`). Segella les 5 skills sense corregir-ne el frontmatter i sense actor | Desapareixen els 5 avisos de segell i l'error de `segell-auto`; queden els 5 `frontmatter-invalid` (T1, T2) |
| 19:38 | `src/config/backendConfig.js`: validació UUID del tenant (C2 de Codex) | Al principi, 4 roges a `src/config` i ≥226 a `src/`. A les 21:15Z, `src/config` torna a estar verd (252/252) i `src/data` té 50 roges (T2) |
| 19:39–19:40 | Fixtures adaptats a UUID a `Avatar.xat.test.jsx`, `MurContext.test.jsx`, `PerfilContext.test.jsx`, `XatContext.ambit.test.jsx` i `XatContext.test.jsx` | Part de l'adaptació de C2; `src/data` continua en roig |
| 19:15–19:35 | Retirats de l'arrel `payload_claude.md`, `payload_codex.md`, `payload_pla.md` i `update_index.cjs` (mtime de l'arrel: 19:35Z) | Superat (T2) |
| 20:33 | `00_index_escriptori.md` reordenat; àncores duplicades corregides | Superat (T2) |
| 21:11–21:15 | Fixtures UUID a `src/config` i reversió parcial d'`i18n.js`, que continua diferent de HEAD (4 +-) | `src/config` verd a les 21:15Z (T2) |
| 21:20–21:28 | `wordpress-plugin/eines/empaqueta.mjs` (patró «Canal d'actualització (»), `tests/enxufe-plugin.test.mjs` (límit de 20.480 B), `tests/lint_enxufe.test.mjs` i `languages/socdepoble-enxufe-ca.l10n.php` | El bloqueig de release es tanca: 47/47 a les 21:58Z (T2) |
| ~21:28 | Canvis a `wordpress-plugin/includes/ajustos.php` i `marcatge.php` (carril C3) | No auditats; fora d'abast |

La correcció de dades que va fer l'orquestrador consta a l'Historial. Les seccions de baix ja porten la xifra correcta: l'últim rebut Matrix és del 2026-09-19T23:03:39Z, 11 dies i 22 hores abans del tall. La Consola ho arredonix a «fa 11 dies».

### T2 · Abast i mètode

**Convenció d'ids:**
- `T2C` i `T2P`: lots de consola i de portes.
- `FO-xx` i `T2F-xx`: farcits 0 i 1 del crític (fets rancis i lectura creuada amb Codex).
- No s'han de confondre amb `G/T1F` i `M/T1F`, de T1.

- **Navegador (localhost:3340).** Dues passades de l'orquestrador, les dues amb 0 errors i 0 avisos propis de l'aplicació:
  - 19:00Z: 29 rutes, abans del canvi de `backendConfig.js` (19:38Z);
  - 21:05Z: 8 rutes, amb el canvi ja present: /xat, /mur, /calendari, /notes, /legal, /consola, /ia i /projecte.

  Al buffer acumulat de la pestanya hi ha un «Failed to load resource: 500» que no es reproduïx: cap recurs dona un estat ≥ 400 en eixes 8 rutes. Probablement és una transformació de Vite que va fallar mentre es desava un fitxer en calent. Els dobles `ERR_ABORTED` de `/__iaia/*.json` continuen (T2C-13).
- **Consola Termodinàmica.** `/__iaia/mapa.json` es compila a cada GET (`tooling/vite/consola-iaia.mjs:149`) i no es desa a disc.
  - 19:00Z: 28 avisos, 10 alts i 18 mitjans.
  - 21:05:40Z: 260 nodes, 217 arestes i 23 avisos, 5 alts i 18 mitjans.
  - La diferència són els 5 avisos de segell, superats per la reconciliació de les 19:37:26Z.
- **Mode de dades.** Localhost corre en mode llavor: `loadSections` torna la llavor abans de fer cap GET (`src/data/supabase/content.js:106-108`). L'error real de dades és el 400 de producció de Codex, **fora d'este abast**.
  - **C1 (FO-01, alta).** `section_submissions.updated_at` no existix a l'esquema remot. La selecció és a `content.js:122` i la columna naix a `supabase/migrations/2609261200_publicacions_autoria.sql:24`.
  - **Per què una passada remota tampoc el veuria a la consola (hipòtesi).** MurProvider i MultimediaProvider són globals (`src/app/App.jsx:590-594`) i carreguen en muntar. L'error es guarda en l'estat (`useScopedResource.js:27-28`) i no ix com a `console.error`.
  - **FO-02 (mitjana).** Que `author_org_id` funcione no demostra que 2609261200 estiga aplicada, perquè la columna ja naix a 2609080000:99. Si s'aplica 2609261200 sense 2609261500, la FK continua en cascade.

### T2 · Estat a les 21:05Z

#### Avisos del Mapa (23)

| Avís (n · sev.) | Causa arrel | Remei exacte | Lease | Qui |
|---|---|---|---|---|
| frontmatter-invalid ×5 · alta (T2C-02, T2F-05) | Les 5 SKILL.md incomplixen `tooling/wiki/schema.json:8-13` (additionalProperties false; type, status i description obligatoris) i l'enum de tags (`:67-112`). L'avís s'emet a `construeixMapa.js:364`. Al disc, a les 21:12Z:<br>• core-empaquetat-wp: sense type ni status, i tags fora d'enum;<br>• core-identitat-visual i core-temps-termodinamic: només name i description;<br>• core-portaveu-institucional: `type: procedural`, sense status i amb tags fora d'enum;<br>• sdp-clon-whatsapp: sense type ni status, i amb tags fora d'enum | Substituir només el frontmatter pels blocs de baix; el cos queda igual | sí | Mestre, o MarIA amb l'executor |
| nom-diferent-carpeta ×1 · mitjana | `core-portaveu-institucional/SKILL.md:2` diu `name: Portaveu Institucional` (`construeixMapa.js:365`) | `name: core-portaveu-institucional`, dins del mateix bloc | sí | ídem |
| fora-index ×5 · mitjana (T2C-07) | `persona_router.mjs:36-40` només construïx `.agents/skills_index.json` si falta, i ni hooks ni cron el regeneren. Les 5 skills no apareixen ni a `skills_index.json`, ni a `00_INDEX_SKILLS.md`, ni a `manifest.yaml` | Després dels blocs, `npm run skills:index`. **Mai abans:** entraria la clau «Portaveu Institucional» com a skill fantasma. Pegat estructural: que `carregaIndex` passe sempre per `escriuIndex` | sí | Mestre |
| fora-cataleg-claude ×5 · mitjana (T2C-08) | `.claude/skills` té 24 symlinks i cap script no els crea; `executor-mutacio.mjs:31-32` rebutja els symlinks; `.gitignore:39` ignora `.claude/` sencer | 5 × `ln -s ../../.agents/skills/NOM .claude/skills/NOM`. Decidir si `.gitignore:39` passa a `.claude/*`, `!.claude/settings.json` i `!.claude/skills/` | sí | Mestre |
| orfe ×5 · mitjana al Mapa (`construeixMapa.js:554`); la troballa T2C-09 queda en baixa després de la verificació | Cap aresta entrant no inferida (`construeixMapa.js:546-554`) | Cap de propi. L'aresta router → skill apareix quan la skill té `triggers_on` i l'índex està regenerat | — | — |
| recaiguda-recent ×1 · mitjana (T2C-12) | `.agents/LEDGER.md:627` (260929) i `:575` (260926), dins de la finestra de 7 dies | Cap: l'avís caduca el 2026-10-06T00:00Z si no hi ha cap recaiguda més | no | — |
| torns-caducats ×1 · mitjana (T2C-11, T2C-03) | 137 de 155 torns no tenen estat terminal (`turns.mjs:42-44`). `tancament.mjs:19` executa `cataleg_skills --check`, que llança per les 5 skills (`cataleg_skills.mjs:56-60`): això bloqueja tots els tancaments des del 30-09 a les 18:21Z, però no explica el gruix dels caducats | 1) Els blocs YAML desbloquegen el pas de skills. 2) Afegir `tancament.mjs --abandona --turn-id ID --motiu TEXT` dins de withSignedLedger, amb l'estat `abandoned` | sí | Mestre (disseny) |

**Causa arrel comuna** (governança; tot amb lease):
- **T2C-01 (alta).** `tooling/gates/antigravity-hook.mjs:172` fa `if (!alPrimerNivell(rel) || !esMd(rel)) return ALLOW;`. Per això MarIA va poder escriure directament a `.agents/skills/`: `antigravity-hook.log` 2032, 2097, 2157, 2723 i 2767 el 01-10, i 1223 i 1227 el 30-09.
  - **Remei:** `ask` per a `.agents/`, `tooling/`, `scripts/`, `.claude/`, `.codex/`, `.husky/`, `.github/`, AGENTS.md, CLAUDE.md i `package*.json`, o passar la ruta per `mutationPath()`.
  - **Matís:** el REFLEX DE CORRECCIÓ de CLAUDE.md mana escriure les lliçons directament a SKILL.md. És un conflicte doctrinal que ha de resoldre el Mestre.
- **T2F-04 (alta).** preShell (`antigravity-hook.mjs:146-152`) acaba en ALLOW. MarIA pot executar `segella.mjs --update` sense lease, mentre que `mutation-policy.mjs:135` només admet la crida nua a Claude i Codex. Contradiu `PROTOCOL_PETORRETA.md:102`.
- **T2C-05 (mitjana).** El camí `--update` de `segella.mjs:85-112` no valida el frontmatter: la reconciliació `3815d3de` ho demostra. **Remei:** validar abans de `:87`, només a la branca de reconciliació, i actualitzar els fixtures de `tests/security-chain.test.mjs:15-19`.
- **T2F-02 (mitjana).** El registre de `segella.mjs:97` no porta actor, sessió, torn ni data. La reconciliació no consta ni al LEDGER ni a l'ESTAT.

#### Frontmatter corregit (contrastat amb `tooling/wiki/schema.json` a les 21:12Z)

Tots els tags són dins de l'enum (`:71-111`). `name`, `triggers_on` i `contracte.llig` són propietats admeses. L'status ha de ser `actiu` o `canonic` (`cataleg_skills.mjs:56`).

```yaml
---
type: skill
status: actiu
description: Tractor cognitiu per estandarditzar la creació, nomenclatura i emmagatzematge dels arxius ZIP del connector de WordPress, evitant l'acumulació de brossa a l'arrel.
name: core-empaquetat-wp
tags:
  - tractors
  - sollutia
triggers_on:
  - zip del plugin
  - empaquetar l'enxufe
  - empaqueta el plugin
  - release de l'enxufe
  - plugin de wordpress
---
```

El cos de core-empaquetat-wp contradiu `empaqueta.mjs:518` (`release/enxufe-X`) i empenta a escriure a `01_produccio` (AGENTS §12): cal reescriure'l a banda (T1A-02, T1A-03).

```yaml
---
type: skill
status: actiu
description: Tractor (Skill) obligatori abans de generar cap imatge, recurs gràfic o disseny visual per a Sóc de Poble. Protegeix l'estil Bruguera/Berlanga.
name: core-identitat-visual
tags:
  - identitat
  - disseny
  - tractors
triggers_on:
  - genera una imatge
  - generar una imatge
  - il·lustració
  - recurs gràfic
  - bàner
contracte.llig:
  - _wiki_de_poble/02_saber/identitat_visual.md
---
```

```yaml
---
type: skill
status: actiu
description: Propaga i assegura l'actualització sincronitzada del Dossier Institucional de Sóc de Poble.
name: core-portaveu-institucional
tags:
  - govern
  - identitat
triggers_on:
  - dossier institucional
  - dossier complet
  - missatge de presentació
  - presentació del projecte
---
```

```yaml
---
type: skill
status: actiu
description: Assegura l'ordre cronològic absolut en la taxonomia documental. Tractor de prevenció contra viatges en el temps.
name: core-temps-termodinamic
tags:
  - tractors
  - escriptori
triggers_on:
  - marca de temps
  - aammdd_hhmm
  - timestamp
  - hora termodinàmica
---
```

```yaml
---
type: skill
status: actiu
description: Directriu arquitectònica i de disseny per clonar la UI/UX de WhatsApp al mil·límetre (Patró Pedra Seca).
name: sdp-clon-whatsapp
tags:
  - disseny
  - tractors
triggers_on:
  - clon de whatsapp
  - com ho fa whatsapp
  - pantalla nova
  - menú d'ajustos
  - bottom sheet
---
```

#### Ordre d'aplicació (segell vigent: b94b8941)

1. **Ruta B (recomanada).** Un sol pla `sdp.mutation.v1` per a `tooling/gates/executor-mutacio.mjs`, amb una lease `governance-write`.
   - **Inclou:** les 5 SKILL.md, `.agents/skills/00_INDEX_SKILLS.md` i `.agents/manifest.yaml`, amb les projeccions de `cataleg_skills --escriu`.
   - L'executor resegella sol, amb una transacció traçable (session, operationId i claim).
   - Cal recalcular els `before` de cada fitxer.
   - Ara que el segell previ és vàlid, la comprovació d'`executor-mutacio.mjs:42` passa.

   **Ruta A (alternativa, al terminal del Mestre):**
   - aplicar els blocs;
   - `node tooling/brain/cataleg_skills.mjs --escriu`;
   - `node tooling/gates/segella.mjs --json`, per obtindre el hash complet;
   - `--update --expected-hash=<64 hex> --expected-previous=b94b89413d9aa982ca6bbfc54f3f1619e56af6bdd656eeb6231997c7b30213b3 --reason='<torn i ordre del Mestre>'`.
2. `npm run skills:index`.
3. Els 5 symlinks de `.claude/skills`.
4. Comprovar `node tooling/brain/cataleg_skills.mjs --check`, que ha de donar `ok:true`, i que `node tooling/gates/segella.mjs` diga «sense canvis».
5. Versionar en el mateix commit `SKILLS_SEAL.json`, la transacció `3815d3de` i la nova (T2F-10). HEAD porta el pany 82aaab07, però les SKILL.md de HEAD fan b94b8941: el segell de HEAD ja és divergent.

**Risc (T2C-19).** La lease caduca quan canvia el porcelain de git, i el canvien les receptes horàries de Plaquetes i cada torn nou. Cal executar just després del minut :03, amb MarIA i Codex aturats.

#### Altres defectes vigents (nucli, arquitectura i Consola)

| Grup (id · sev.) | Causa | Remei | Lease | Qui |
|---|---|---|---|---|
| `ERR_ABORTED` doble a /__iaia/mapa.json i consola.json (T2C-13 · baixa) | **Legítim.** StrictMode (`App.jsx:576`) munta, desmunta i torna a muntar. El cleanup avorta el primer fetch (`useMapa.js:38`; `ConsolaSection.jsx:91`), i els resultats avortats s'ignoren. Cost: el middleware síncron calcula el Mapa sencer encara que la petició s'haja avortat (`consola-iaia.mjs:149`) | Cap pegat a src/. Opcional: una memòria de 2 s al middleware | l'opcional, sí | Mestre |
| Panell de rebuts ranci (T2C-15 · mitjana) | `consola-iaia.mjs:55-56` filtra `matrix.rebut`: 38 rebuts, l'últim del **2026-09-19T23:03:39Z**. Cap script no n'és el productor (`matrix.mjs:11`) | Derivar els rebuts dels `receipts` de `.agents/runtime/turns/*.json`, o etiquetar el panell com a «històric» | sí | Mestre |
| Diari immunitari fòssil (T2C-14 · mitjana) | `consola-iaia.mjs:100` llig `journal.ndjson`: 119 operacions, l'última del 2026-08-03. Plaquetes escriu receptes cada hora, i ningú no les llig | Exposar `immunitari.receptes {total, ultima}` en un camp separat | sí | Mestre |
| Proves roges per la validació UUID (FO-03 · mitjana; T2F-06 · alta) | `backendConfig.js:10-15` llança «Abast invàlid» amb qualsevol tenant que no siga UUID, des de `backendScope` (`:25`), `configura` (`host.js:70`), `sessionService.js:60`, `auth.js:18` i el render (`NotesDataContext.jsx:159`). A les 21:15Z, `src/data` té **50 roges** (fixtures «poble», «T», «poble-a»): localXat 11, xat 11, localNotes 7, sessionService 7, auth 4, cua.contracte 4, sessionIsolation 4, xat.pagina 1 i localNotes.publishDate 1 | Fixtures UUID compartits, com ja s'ha fet a `src/config`. Capturar el throw a la frontera (`main.jsx:26` → `host.js:70`; `PedraSecaEmbed.jsx:319/584`) i pintar un estat neutral | no | Carril de MarIA o Codex; no s'ha de tocar des d'ací |
| Readme del plugin (T2F-08 · alta; **superat a les 21:28Z**) | `readme.txt` traduït entre les 19:12 i les 19:26Z. A les 21:14Z: `enxufe-plugin` 14/16 (`:247` per més de 16 KB; `:384` falta «Update channel (»); `enxufe-empaqueta` 10/14 (`empaqueta.mjs:284`). Entre les 21:20 i les 21:28Z el carril concurrent ha adaptat `empaqueta.mjs:283-284` («Canal d'actualització (»), el límit d'`enxufe-plugin:247` (20.480 B) i els asserts. A les 21:58Z dona 47/47 | Que el Mestre ratifique que el readme queda en valencià | no | Mestre |
| Barra mòbil sense Telefonades (T2P-03 · mitjana) | `App.jsx:97` té `['mercat', 'pobles']`; `App.test.jsx:455` i `:488` en roig (2/375; no reverificat) | El Mestre ratifica la barra | no | Mestre |
| Pre-commit impassable i saltat (T2P-01 · alta) | `.husky/pre-commit:9` → `git-staged.mjs:40-44`. HEAD conté el segell divergent i proves roges: algun commit s'ha saltat la cadena (precedents a `ESTAT.md:581` i `:742`) | Versionar el segell (T2F-10). Fer passar la branca per PR o afegir `push` a `wiki-integrity.yml:4-6` | sí | Mestre |
| Porta Documents roja (T2P-05 · mitjana) | 14 errors en 4 dels 6 documents a les 21:13Z: els prompts 2003 tenen `Model IA` i `Tokens` en `[pendent]`; els plans 2050 i 2110 tenen Canvis, Verificació i Riscos en `[pendent]`. El pla existix en 3 còpies divergents | Completar els documents i passar `document.mjs check` a cadascun | no | MarIA |
| Porta Olivera accepta un pla esquelet (T2P-06 · baixa) | `porta-olivera.mjs:119-120` només mira el nom i la data | Exigir que «Canvis proposats» tinga contingut | sí | Mestre |
| `schema.json` no admet `contracte.escriu` (T2C-10 · mitjana) | `construeixMapa.js:395` llig la propietat, però `schema.json:146-154` no la té i additionalProperties és false | Afegir-la, entre torns, perquè canvia el hash del contracte (`core.mjs:129`) | sí | Mestre |
| Brossa a l'arrel (T2C-16, T2C-17 · baixa) | Els `payload_*.md` i `update_index.cjs` **ja no hi són** (21:10Z). Eren esborranys dels prompts 2003. Continua `scratch-banner.py` (versionat) i `scratch/` (34 fitxers, no auditat) | Afegir `/^payload_.*\.md$/i` i `/^update_index\.c?js$/i` a PATRONS_BROSSA (`neteja_brossa_arrel.mjs:27-31`); `git rm scratch-banner.py` en un commit revisat | sí per a tooling/ | Mestre |

### T2 · Superat durant l'auditoria

| Observat | Hora | Ara | Evidència |
|---|---|---|---|
| Segell trencat, b94b8941 contra 82aaab07 (T2C-04, refutada en segona passada; T2P-02) | 19:07Z | Intacte a les 21:10Z | `segella.mjs`: «sense canvis. Hash: b94b8941»; transacció `3815d3de` de tipus explicit-reconciliation |
| 5 avisos alts de segell (segell-trencat, segell-divergent i fora-segell ×3) | 19:00Z | Absents a les 21:05Z | `mapa.json`: 28 → 23 avisos |
| `segell-skills-coherent` 25/29; `antiguitat-segell` 21 h | 19:00Z | 29/29; 1 h | `salut[]` |
| Bloqueig d'`executor-mutacio.mjs:42` (Codex, l. 259) | 19:31Z | `verificaSegell` torna ok | `segella.mjs` en verd |
| `segell-auto` «Origen no acreditat» a cada eina | 18:56–19:37Z | Cap avís PostToolUse | Totes les eines de l'orquestrador posteriors |
| Porta Olivera roja (2110 sense àncora) i àncores duplicades al final de l'índex | 19:07Z i 20:20Z | Verda a les 21:10Z; cada àncora 261001 apareix una vegada (`00_index_escriptori.md:79-84`) | `porta-olivera.mjs --informe`; rg |
| `payload_*.md` i `update_index.cjs` a l'arrel | 19:04–19:15Z | Absents a les 21:10Z | ls |
| C6 de Codex (55/56) | 19:15Z | 17/17 | `node --test tests/enxufe-pantalla.test.mjs`; el cost temporal va ser T2F-08 |
| Release bloquejada: enxufe-plugin 14/16 i enxufe-empaqueta 10/14 (T2F-08) | 21:14Z | 47/47 a les 21:58Z | `node --test` de les tres suites del plugin, després de les adaptacions de les 21:20-21:28Z |
| 4 roges UUID i 2 d'i18n a `src/config` | 20:40Z i 21:10Z | 252/252 a les 21:15Z | Fixtures UUID i reversió concurrent d'`i18n.js` |

### T2 · Reparacions

**Reparat en este torn (fora de governança, a `src/`):**

| Defecte | Abans | Canvi | Després |
|---|---|---|---|
| T3J-05 / T3I-03 · alta. `.agents/credits.json:3` porta `"valor": "1702 crèdits"`, i les files 4 i 5 «DESACTIVADA» i «ACTIVAT». `normalitza()` exigia un número a tots els ajustos (`consolaContent.js:74`), llançava amb la primera fila de text i rebutjava `consola.json` sencer. La «reparació F01» d'`ESTAT.md:12` era un verd fals: admetia el tipus `ajust`, però només amb número | `/consola`: el pols diu «No s’han pogut llegir les dades»; la targeta de Crèdits no es pot obrir | `src/sections/consola/consolaContent.js`: un ajust admet un enter no negatiu o un text no buit, que és el que `PanellCredits` (`ConsolaSection.jsx:155`) pinta tal qual. Un valor buit, negatiu, decimal, nul o objecte continua fallant en veu alta. `consolaContent.test.js`: 2 proves de regressió amb les 5 files literals de `credits.json` | `npx vitest run src/sections/consola`: **339/339**. `/consola`: «1 registres de consum · 38 rebuts · 29 skills (5 orfes) · Últim rebut fa 11 dies». `/consola/pols`: es pinten «1702 crèdits» i «DESACTIVADA». Consola del navegador neta |

És una reparació d'un error de la Consola dins de l'abast de T2. No és un redisseny: torna el comportament previst al panell, que és el que mana la Llei del Píxel. **Sense commit:** el commit és decisió del Mestre.

**No reparat, i per què:**
- Tots els remeis dels avisos del Mapa toquen `.agents/skills/`, `.claude/skills/`, `.agents/skills_index.json` o `tooling/`. Això és governança: només es pot fer amb lease, a través d'`executor-mutacio.mjs`, i el hook de Claude ho denega (`mutation-policy.mjs:15-16`, `:135`).
- `src/config`, `src/data`, `i18n.js` i `wordpress-plugin/` són el carril concurrent de MarIA i Codex, que apliquen el consens de Codex: entre les 21:10 i les 21:15Z hi han canviat 5 fitxers. Tocar-los des d'ací hi hauria col·lidit.

**Preparat per aplicar:**
- els 5 blocs YAML i l'ordre d'aplicació;
- les regles de `.gitignore` per a `.claude/`;
- el hook d'Antigravity: `ask` a preEscriptura (T2C-01) i `knownRead` a preShell (T2F-04);
- la validació a la branca de reconciliació de `segella --update` (T2C-05), amb actor, torn i data (T2F-02);
- `carregaIndex` sempre via `escriuIndex` (T2C-07);
- el camp `receptes` (T2C-14) i els rebuts derivats dels torns (T2C-15);
- `contracte.escriu` a `schema.json` (T2C-10);
- l'estat `abandoned` (T2C-11);
- un pla de hui amb contingut mínim (T2P-06);
- els patrons de brossa (T2C-16).

### T2 · Portes i proves

| Ordre | Resultat | Observació |
|---|---|---|
| `node tooling/gates/segella.mjs` | 19:07Z ROIG → 21:10Z VERD | «sense canvis. Hash: b94b8941». `.agents/skills/.DS_Store` queda fora del segell |
| `node tooling/gates/porta-olivera.mjs --informe` | 19:07Z ROIG → 21:10Z VERD | 5 documents vius declarats, Safata buida. Anuncia «Pla de hui: 2050», que és un esquelet (T2P-06) |
| `node tooling/gates/porta-documents.mjs` | ROIG (exit 1), també a les 21:13Z | 14 errors en 4 dels 6 documents (T2P-05) |
| `node tooling/gates/porta-plantilles.mjs` | VERD | 13 rutes |
| `node tooling/gates/tractor-enxufe.mjs` | VERD | E1-E4 |
| `node tooling/gates/tractor-rls.mjs` | VERD | 0 fantasmes i 0 forats en 32 SQL. Són regles sintàctiques: no proven l'aïllament entre pobles (FO-06, T4W-04) |
| `npx vitest run src/sections/consola` | VERD: 337/337 → **339/339** després de la reparació (21:41Z) | +2 proves de regressió de crèdits |
| `npx vitest run src/config` | 6 roges a les 21:10Z → 252/252 a les 21:15Z | UUID resolt a les 21:11Z; i18n resolt per reversió |
| `npx vitest run src/data --silent` | ROIG, 50 roges (21:13Z i 21:15Z) | Totes per la validació UUID (T2F-06) |
| `npx vitest run src/app` | ROIG, 2/375 (auditoria) | Barra mòbil (T2P-03); no reverificat |
| `node --test tests/enxufe-pantalla.test.mjs` | VERD, 17/17 | C6 superada |
| `node --test tests/enxufe-plugin.test.mjs` | ROIG, 14/16 (21:14Z) → VERD (21:58Z) | `:247` i `:384`, adaptats pel carril concurrent (T2F-08) |
| `node --test tests/enxufe-empaqueta.test.mjs` | ROIG, 10/14 (21:14Z) → VERD (21:58Z) | variantDirectoriReadme, adaptat (T2F-08). Les tres suites del plugin juntes donen 47/47 a les 21:58Z |
| Proves del Brain: porta-olivera-v3, mapa-consola, governanca-260930b-torns, hooks-local, documental, sistema_nervios | VERD (11/11, 9/9, 10/10, 18/18, 18/18 i 11/11) | 260930b-torns no l'executa cap corredor (T2P-08) |
| `node --test tests/governanca-260930-lease.test.mjs` | 0 pass, 3 skip | Prova morta: «paquet ja aplicat» (T2P-08) |

### T1 · Dictamen

El patró dominant és una maquinària ben feta que està desendollada o no deixa rastre. Les skills descriuen en prosa procediments que no nomenen el tractor real, que no tots els agents poden invocar o que no deixen cap línia comptable. El diari de sessió no té escriptor, i l'últim rebut és del 2026-09-19T23:03:39Z. A més, una reconciliació que no valida res ha segellat cinc skills amb frontmatter invàlid, i eixes cinc tomben el catàleg i el tancament de tots els torns.

- **Skills (29):** 15 en roig, 14 en ambre i cap en verd. Flux: 3 «sí», 21 «parcial» i 5 «no».
- **Nucli de memòria i context (26 peces):** 15 en roig, 10 en ambre i 1 en verd (time-machine).
- **Troballes:** 159 proposades (50 confirmades, 106 matisades, 3 refutades). Després de deduplicar en queden 115: 5 altes, 55 mitjanes i 55 baixes.
- **Reverificat cap a les 21:28Z:**
  - el segell b94b8941 està en verd;
  - porta-documents dona 14 errors en 4 documents;
  - el LEDGER no té cap entrada nova després de la línia 672.

**Convenció d'ids:**
- `T1A`…`T1D`: lots de skills.
- `T1N`: nucli.
- `G/T1F` i `M/T1F`: farcits del crític (govern i memòria).

### T1 · Inventari de les 29 skills

| Skill | Semàfor | Flux | Tractors reals i qui els invoca | Quantificable a la Consola | Risc principal de pèrdua de context |
|---|---|---|---|---|---|
| core-automillora | roig | no | Cap de declarat. A la pràctica, el REFLEX de CLAUDE.md i persona_router, tots dos només a Claude | Parcial: lliçons i entrades del LEDGER per skill; ni detecció ni decisió | «core» salta per subcadena; el pas 3 executa sense aprovació; fa MarIA l'única editora |
| core-consell-i-colmena | roig | parcial | tractor-cens (pas 26, porta:cens). L'ordre `node -e` de la skill imprimix [object Object] i el hook la veta | No: només el codi d'eixida; cadena-portes N/A | El cens s'escriu de memòria; consum de setembre i rols diferents dels de consell.json |
| core-empaquetat-wp | roig | parcial | empaqueta.mjs, a mà (la skill no el nomena) | No. Mapa: frontmatter-invalid (alt) | Claude no la veu; 3 destins i 3 noms de ZIP; mana fer rm -rf i escriure a 01_produccio |
| core-identitat-visual | roig | parcial | generate_image d'Antigravity, fora del repo; ningú no carrega identitat_visual.md §5 | No. frontmatter-invalid, fora-index, fora-cataleg-claude | Invisible; la còpia de la Wiki ja ha divergit |
| core-portaveu-institucional | roig | parcial | frontissa-contingut (pre-commit:6 i Mapa) sobre PAGE_COPY.projecte; README i readme.txt sense porta | Parcial: integritat-contingut 11/11. frontmatter-invalid, nom-diferent-carpeta | Invisible; cita fonts que no existixen; no avisa de la frontissa |
| core-restauracio-segellada | roig | parcial | desenterrar V7.1, a mà i amb lease. brain/ancora no fotografia res; tractor-lapida no té hook | No: refs/sdp/ancora (1 ref, del 31-08) queda fora del Mapa | La Fase 1 crida l'àncora equivocada; còpia V7 sense lease; disparadors massa amples |
| core-taxonomia-estricta | roig | parcial | porta-taxonomia (pre-commit:7) i taxonomia.json, que la skill no nomena; document.mjs | No: porta-taxonomia només corre al pre-commit | La doctrina contradiu taxonomia.json; procediment sense torn ni rebut; disparadors en anglés |
| core-telemetria-huma | roig | parcial | persona_router; la plantilla d'acta s'omple a mà; el «Registre Històric» no existix | No: 1 sola línia consum.tokens (30-09) | Contradiu wiki-cicle-de-vida:28; compartix disparadors amb skills que la contradiuen |
| core-temps-termodinamic | roig | parcial | Cap de propi. La T5 de porta-taxonomia compara per dies; ningú no contrasta l'hhmm amb issuedAt | Font als receipts, sense exposar: 2 de 5 noms amb hora futura al torn 0a24c0cd, i este informe | Claude no la veu; diu «s'activa automàticament», i és fals |
| sdp-calendari-agricola | roig | parcial | Cap: ni taules, ni SMS, ni component | No | Status canonic sense res implementat; el /calendari real no té skill |
| sdp-clon-whatsapp | roig | parcial | Proves d'ajustosXat, a mà; no nomena les captures | Parcial: 17 de 75 captures citades a src/. frontmatter-invalid, fora-index, orfe | Claude no la veu, però el codi la cita; precedència amb Pedra Seca sense resoldre |
| sdp-universal-editor | roig | no | Proves d'EstatDesament i NotesSection, a mà | No | El §1 mana la ploma i el codi usa CloudUpload |
| sdp-universal-page | roig | no | design_guard i tractor-tokens (run-portes, on no s'arriba); proves de PageFrame, a mà | No: el criquet h1-outside-header no té lector | Prescriu --sdp-blanc, que no existix, i «Comentar» al xat privat |
| wiki-cicle-de-vida | roig | sí | obrir_torn i document.mjs, a mà. El hook de Claude veta handoff, --output i tancament --check | Sí: tancats 5/155, caducats 137/155, frescor de l'ESTAT 9 h | El pas 8 no s'abasta (catàleg en roig); el LEDGER no té cap entrada d'avui des de les 00:55 |
| wiki-propagar-veritat | roig | parcial | find + sed -i amb run_command: Antigravity el deixa passar (ALLOW), a Claude el bloqueja | No | Escombrada per patró sobre 90_, 10_actes i 01_produccio; ja s'ha corromput a si mateixa |
| core-context-panic | ambre | parcial | termometre_context: només l'importa un wrapper que no està registrat. PostToolUseFailure només mira el segell | No | Depén que l'agent degradat s'observe a si mateix; «panic» no casa amb «pànic» |
| core-edicio-segura | ambre | parcial | npx vitest run, a mà. codi-congelat.txt és buit i només el llig crear_bundle | No | Un disparador de 26 caràcters que no salta; una congelació sense porta |
| core-estrategia-ia | ambre | parcial | tracker_consum (a mà, només MarIA) escriu consum_ia.csv; la Consola llig consum.tokens | Parcial: 1 consum.tokens; el CSV (17 files) no el llig ningú | 4 vocabularis de models incompatibles |
| core-higiene-escriptori | ambre | sí | porta-olivera (npm, pre-commit, hooks-local i PreInvocation d'Antigravity); --arxiva, a mà per MarIA | Sí per a l'estat (ancorat 5/5, safata 0/20, 2 recaigudes); no per al flux | 2 recaigudes; còpies de laboratori amb la mateixa versió 3.1.0 |
| core-identitat | ambre | parcial | Ningú no carrega personalitat_iaia.md; la identitat entra per CLAUDE.md i context-local | No | 4 cadenes d'arrencada; cap canal executa l'«ordre fix» |
| core-memoria-historica | ambre | parcial | ESTAT (despertar) i LEDGER (tancament --close). Cap tractor declarat; el pipeline de memòria està desendollat | Parcial: frescor-relleu-estat 9 h | Ensenya regles («petorreta») que les portes admeten; no pot declarar el que escriu |
| core-neteja-brossa | ambre | sí | neteja_brossa_arrel, sense invocador (ni npm, ni hook, ni Plaquetes) | No: el Mapa no llig .sdp-paperera | Llista negra: cap porta no informa dels fitxers solts no classificats; homònim amb unlinkSync |
| sdp-app-grid-shell | ambre | no | porta:graella, design_guard i Vitest de la graella, dins de run-portes, on no s'arriba | No | «app grid shell» no casa amb AppGridShell; no nomena contracte_graella |
| sdp-casos-us-essencials | ambre | no | Cap | No | No marca l'estat dels casos: n'hi ha 1 de 4 implementat |
| sdp-estudi-mercat | ambre | parcial | Ruta estudi_ia, que porta a la plantilla d'avaluar IAs; el navegador MCP s'admet | Només el rebut documental | Plantilla d'un altre propòsit; no nomena cap eina de recerca |
| sdp-pedra-seca | ambre | parcial | 6 tractors reals als passos 8 a 56 de run-portes, on no s'arriba | La font existix però ningú no la llig: criquets Σmax 136 + 41 (22-09) | El §1 mana primitives que el §2 i la llei T4 prohibixen; :has() i radis sense guarda |
| sdp-workflow | ambre | parcial | @-import de CLAUDE.md; document.mjs plan i run-portes, a mà; el hook veta `npm run porta` | Parcial: ambPla (45/155) es recull però no es mostra; cadena-portes N/A | Remet a 90_; exigix una cadena que para al pas 5 |
| wiki-busca-skills | ambre | parcial | persona_router i la ruta skill de document.mjs; WebSearch i WebFetch vetades, el navegador MCP s'admet | Indirecte: fora-index, fora-cataleg-claude, frontmatter-invalid | No descriu la promoció, que és el que falta a les 5 skills |
| wiki-documentacio-i-reflex | ambre | parcial | hooks-local (Olivera, plantilla viva), pre-commit (taxonomia), document.mjs; MarIA fa --arxiva | Parcial: ancorat 5/5, amb rebut 5/5, safata 0/20; el panell de rebuts està mort | Prohibix «petorreta» en prosa i la mecànica l'accepta; el pla buit està copiat als prompts |

**Contradiccions entre lots, resoltes al disc:**
- **core-taxonomia-estricta queda en roig.** `SKILL.md:15-23` cita «Fable», tracta les petorretes com a document formal (l. 18), no nomena porta-taxonomia ni taxonomia.json, i el procediment no passa per cap torn ni rebut.
- **core-empaquetat-wp i core-temps-termodinamic queden en flux «parcial».** Totes dues tenen passos escrits i un tractor real parcial. Que no es puguen carregar ja ho recull el semàfor.

### T1 · Nucli de memòria i context

| Peça | Semàfor | Flux | Tractors reals i qui els invoca | Quantificable a la Consola | Risc principal |
|---|---|---|---|---|---|
| Arrencada · context-local.mjs | ambre | parcial | SessionStart de Claude i Codex; hooks-local el revalida | Parcial: el Mapa en coneix les SOURCES, no la injecció | Fonts diferents de les de cervell.json; els subagents no reben cap SDP:FONT |
| despertar.mjs + ON_ESTIC.md | roig | parcial | SessionStart; @import de CLAUDE.md; `npm run despertar` està vetat a Claude | No | La còpia importada és la de l'anterior: 13:01:32Z al context i 18:55:09Z al disc |
| CLAUDE.md + cervell.json | roig | no | CLAUDE.md és natiu de Claude; cervell.json només el lligen porta-autoritat i el Mapa | Parcial: claudeImports | 5 llistes d'arrencada; QUI_SOC diu a Claude «Ets la IAIA MarIA» |
| Router · persona_router + skills_index | ambre | parcial | UserPromptSubmit de Claude; Codex, Antigravity i els subagents no el tenen | No: arestes declarades, cap disparo comptat | Índex amb 24 de 29 skills, del 30-09 03:08; disparadors per subcadena |
| Hooks · hooks-local, mutation-policy, command-policy | ambre | sí | PreToolUse de Claude i Codex | No: no registra les decisions | Vetan tancament --check, despertar, WebFetch i --output; reinjecten 330 caràcters a cada eina |
| Segell · segell-auto, segella, SKILLS_SEAL | roig | parcial | PostToolUse; tancament; --update des de qualsevol shell, sense lease | Parcial: coherent 29/29 | Íntegre des de les 19:37Z, però sobre 5 frontmatters invàlids i sense actor |
| antigravity-hook + .agents/hooks.json | roig | sí | PreInvocation i PreToolUse d'Antigravity | El log existix, però el Mapa no el llig | Deixa passar (ALLOW) les escriptures de MarIA a skills i tooling i qualsevol run_command; no té SessionStart |
| Portes documentals · porta-reflex, porta-olivera, porta-plantilla-viva | ambre | sí | hooks-local, antigravity-hook i pre-commit | Parcial: ancorat 5/5, safata 0/20 | Accepten «petorreta» |
| Circuit documental · document.mjs, turns.mjs, obrir_torn | roig | parcial | Agents via command-policy; startHumanWatch no té cridador | Sí: caducats 137/155, tancats 5/155 | Caducitat fixa de 24 h, sense renew ni abandon; 21 grafies d'actor; el create admet un hhmm futur |
| tancament.mjs | roig | parcial | `npm run tancar`, del Mestre; vetat a Claude en tots els modes | Indirecte | Acoblat a la salut global; en roig per cataleg_skills |
| LEDGER + verify-ledger | roig | parcial | tancament; run-portes, pas 4 | Sí: integritat 1/1, recaigudes 2 | Una sola entrada del 01-10 (l. 672); «tancat» fals a les l. 22-23 |
| ESTAT.md | ambre | parcial | despertar i fonts-vigilancia (primer bloc); Claude només hi arriba via executor | Sí: frescor 9 h | 200 KB; l'últim relleu és de les 14:10 |
| somiador.mjs | roig | no | Cap (manual per disseny) | No | Mou sense destil·lar; part del que mou ix del repo |
| time-machine.mjs | verd | sí | launchd, cada 1.800 s | Sí: timeMachine.ultima | No hi ha poda; el log no porta hora |
| matrix.mjs + context_documental | ambre | parcial | porta:matrix, a mà | No | Cau amb el catàleg (context_documental:65); escriu a `.matrix-rebuts/`, que no existix |
| Diari · .diari_sessio.jsonl | roig | no | Cap escriptor (matrix.mjs:11); mtime 30-09 15:20 | consola.json: 38 rebuts, l'últim del 2026-09-19T23:03:39Z | Cap pas de cap tractor es pot comptar |
| Peces orfes · farcell, termometre_context, brain/ancora, check-close | roig | no | Cap | No | Duplicats; JSON ranci a l'Escriptori des del 24-09 |
| tracker_consum.mjs | ambre | parcial | CLI manual (core-estrategia-ia) | No: el CSV no el llig ningú | Dos canals de consum |
| Mapa · mapa-consola, fonts-vigilancia, consola-iaia | ambre | sí | Middleware de Vite | És la Consola mateixa | cadena-portes i conformitat-documental en N/A; no llig antigravity-hook.log, .sdp-reflex ni seal-transactions |
| Cens de skills · catàleg, índex, manifest, skills_index, segell, .claude/skills | roig | no | cataleg_skills (tancament, tractor-manifest); els symlinks es fan a mà | Sí: cens 24/29, fora-cataleg-claude ×5 | Recompte per còpia: 29/24/24/24/29/24; una skill invàlida tomba l'inventari sencer |
| Mirall .agents/AGENTS.md + porta-autoritat | ambre | parcial | run-portes, pas 2; --write a mà | No | CAMINS.bios apunta al mirall i no a l'original |
| Bot · cervell.mjs, episodica.mjs | ambre | parcial | bot/index.mjs | No | Les rutes d'identitat no existixen en local |
| Governança (sense skill) · lease, executor, segell | roig | parcial | reflex_petorreta (Mestre), executor-mutacio (Claude i Codex), segella --update (qualsevol shell) | No | El flux només està escrit a PROTOCOL_PETORRETA:104-106 |
| 9 portes del Brain (passos 7, 25-28, 30, 31, 46 i 48) | roig | parcial | run-portes, que para al pas 5 | No: 0 veredictes de 9 | porta:reflex és roja per disseny; la C3 de tractor-cadena és inert |
| Tram de commit · .husky/pre-commit, git-staged, consume-commit | roig | parcial | Hook de git; lease git-commit del Mestre | No | Lease caducada; tancament --check i porta-documents en roig |
| Pipeline de memòria de tooling/wiki (24 scripts desendollats) | roig | no | Cap | No | La P4 es burla amb literals; la Teixidora pot escriure |

#### Cadena de governança (estat de les 21:05Z, reverificat a les 21:28Z)

| Pas | Què fa | Qui ho pot fer | Estat |
|---|---|---|---|
| P0 Precondicions | verificaSegell ok, cap mutation.pending ni lock, cap lease vigent | — | Complides. La lease 42d1e7c1 va caducar a les 00:35Z i va deixar un claim orfe |
| P1 open | `reflex_petorreta open --operation=governance-write --risk=high --scope=…` (30 min + 1 per scope) | Mestre. Vetat a Claude i Codex; MarIA, tècnicament, per run_command | Cap lease vigent |
| P2 Pla | JSON sdp.mutation.v1 (session, operationId, files amb path, before i content) i Plan-SHA256 | L'agent que executarà | — |
| P3 Bootstrap | Petorreta i manifest a `.sdp-reflex/bootstrap/<sessionId>/` | Qui obri la lease | — |
| P4 seal | Fixa HEAD, scopes i statusSha256 (120 min + 2 per scope, 4 h com a màxim) | Mestre | Cada recepta horària de Plaquetes caduca el seal anterior (G/T1F-08) |
| P5 executor | validatePlan, verificaSegell (l. 42), claim, lock, prepared, escriptura i verified | Claude i Codex (hooks-local.mjs:81) | Executable si P1-P4 són vàlids |
| P6 Segell | Transacció accepted i SKILLS_SEAL nou | Automàtic | — |
| P7 Commit | consume, i commit amb lease git-commit (pre-commit, git-staged, tancament --check, run-portes) | Mestre | Bloquejat: tancament --check, porta-documents i porta:reflex en roig |
| Branca paral·lela | `segella --update` amb CAS i raó, però sense lease, actor ni validació | Qualsevol shell (MarIA, Mestre). Claude no | Usada a les 19:37:26Z (transacció 3815d3de) |
| Tancament de torn | `tancament --check` i `--close` | Mestre; MarIA per shell. Claude no | En roig per cataleg_skills |

**Qui pot fer què hui:**
- **Claude** pot:
  - fer lectures i executar segella sense banderes;
  - passar porta-documents, porta-plantilles, `porta-olivera --informe`, tractor-enxufe i tractor-rls;
  - usar `document.mjs` context, create, plan, check i own, i `obrir_torn` sense --output;
  - executar `executor-mutacio` amb un rebut segellat pel Mestre. És la seua via per a ESTAT, LEDGER i lliçons.

  No pot executar tancament, despertar, reflex_petorreta, `segella --update`, cataleg_skills ni les `npm run porta:*` del Brain.
- **Codex** té els mateixos límits si ha acceptat els hooks.
- **MarIA** escriu skills i tooling i executa shell sense lease, incloent-hi la reconciliació.
- **El Mestre** fa open, seal, consume i --close, i el commit, que hui només passa amb --no-verify.

**Desbloqueig mínim:**
1. Ignorar les receptes, o fer el seal just després d'un tic.
2. El Mestre obri i segella una lease governance-write sobre les cinc SKILL.md i el catàleg.
3. Claude o Codex executen el pla.
4. El Mestre crea els symlinks i passa `cataleg_skills --check` i `tancament --check`.
5. Es corregix la baseline de porta:reflex per l'executor.

### T1 · Troballes verificades

#### Alta

- **T1A-01 + T1B-01/02/03 + T1C-01 + T1C-09 + T1D-02 + G/T1F-04** · alta (consolidada) · lease. **Cinc skills invàlides, segellades a les 19:37Z, tomben el catàleg, el tancament i el preflight Matrix.**
  - **On:** `core-empaquetat-wp/SKILL.md:1-8`, `core-identitat-visual:1-4`, `core-portaveu-institucional:2-5`, `core-temps-termodinamic:1-4` i `sdp-clon-whatsapp:1-9`. Cauen `cataleg_skills.mjs:56-60`, `tancament.mjs:19,25`, `context_documental.mjs:65` i `git-staged.mjs:40`.
  - **Què passa:** `inventari()` llança amb la primera skill invàlida, i en cauen `cataleg_skills --check`, el tancament, porta:matrix i el pre-commit. Les cinc són a HEAD. Claude no les veu: `.claude/skills` té 24 symlinks.
  - **Superat:** el segell trencat i el bloqueig d'`executor-mutacio.mjs:42`.
  - **Remei:** el de T2 (blocs YAML per executor amb lease, `cataleg_skills --escriu` i symlinks). Abans, resoldre T1A-03.
- **G/T1F-01 + T1N-03** · alta · lease. **Antigravity no aplica la política de governança.**
  - **On:** `antigravity-hook.mjs:146-152` (preShell acaba en ALLOW) i `:172` (preEscriptura ALLOW fora de l'Escriptori i de la zona humana); `.agents/hooks.json:16`.
  - **Què passa:** MarIA escriu `.agents/skills`, `tooling` i `AGENTS.md` sense lease. El log té 48 edicions allow en zones de govern, i 13 línies sobre skills. Per ací van entrar les cinc skills (log:1223 i :1227). Claude i Codex, en canvi, passen per `hooks-local.mjs:91`.
  - **Remei:** `mutationPath()` o `ask`; a preShell, `knownRead()` més la invocació exacta de l'executor. El fitxer és autoprotegit (`:75`): el canvi és del Mestre.
- **T1C-22** · alta · lease. **wiki-propagar-veritat ordena `find` + `sed -i` sobre tot `_wiki_de_poble`.**
  - **On:** `SKILL.md:25,30`.
  - **Què passa:** no té exclusions, així que toca 90_, 10_actes, 01_produccio i el LEDGER, contra l'abast per superfície de sdp-workflow. Ja ha fet dany a la mateixa skill i a `LEDGER.md:15`.
  - **Remei:** inventari amb rg, llista aprovada pel Mestre, edició fitxer a fitxer, exclusions fixes i 0 residus.
- **G/T1F-05** · alta · lease. **porta:reflex (pas 31) és roja per construcció.**
  - **On:** `wiki-baseline.lock.json:11` diu 18 actes i n'hi ha 62; `reflex_petorreta.mjs:94` tracta SKILLS_SEAL modificat com un canvi pendent; `:221-236` usa els pilars antics.
  - **Remei:** excloure 10_actes i 90_ de la baseline, o regenerar-la per l'executor; acreditar SKILLS_SEAL i seal-transactions.
- **T1D-01 + T1C-19** · alta · lease. **La cadena de portes para en el primer error: 53-55 dels 58 passos no s'executen mai.**
  - **On:** `run-portes.mjs:34,118`, `wiki-integrity.yml:61`, `sdp_lock_ci.yml:22`, `git-staged.mjs:40` i `sdp-workflow/SKILL.md:35`.
  - **Què passa:** a l'arbre de treball para com a molt tard al pas 5 (porta-documents, 14 errors). A HEAD i a la CI para al pas 3, perquè el segell reconciliat no té commit. Linter, Vitest, 58px, graella, pedra-seca, design-guard, tokens i catàleg queden sense veredicte.
  - **Remei:** un mode de CI que execute totes les portes de lectura sense aturar-se i deixe un JSON per pas; fer commit del segell quan les cinc skills estiguen corregides.

#### Mitjana

**Segell, lease i commit:**
- **G/T1F-02 + G/T1F-10** · lease. **El segell acredita bytes, no el contingut ni l'autor.**
  - **On:** `segella.mjs:87,97`; `executor-mutacio.mjs:22-37`.
  - **Què passa:** 18 de les 69 transaccions són reconciliacions. P-14 (`PROTOCOL_PETORRETA.md:106`) prescriu justament eixa via.
  - **Remei:** lease seal-reconcile amb actor; inventari() i R4/R7/R8 de tractor-registre abans d'acceptar.
- **G/T1F-03** · lease. **El bootstrap del segell no té CAS** (`segella.mjs:108-111`, `:73-74`).
  - **Remei:** transaction obligatori; bootstrap només amb bandera i lease.
- **G/T1F-07** · lease. **La lease 42d1e7c1, caducada a les 00:35Z, té un claim orfe** (`executor-mutacio.mjs:45,62,92`; `LEDGER.md:674`).
  - **Remei:** registrar claimed i failed des del claim; una ordre del Mestre per a abandonar-lo amb evidència.
- **G/T1F-08** · lease. **L'executor és fràgil en un arbre concurrent.**
  - **On:** `reflex_petorreta.mjs:1113-1114` exigix el mateix statusSha256, i Plaquetes crea una recepta per hora no ignorada (8 a git status). `executor-mutacio.mjs:74` llança després d'escriure.
  - **Remei:** ignorar les receptes; `--recupera` amb lease.
- **G/T1F-17 + M/T1F-14 + T1A-24** · lease. **El tram del commit està bloquejat** (`git-staged.mjs:24,40-44`, `.husky/post-commit`).
  - **Què passa:** les cinc skills invàlides són a HEAD, per tant algun commit es va saltar la cadena (precedent: `ESTAT.md:742`).
  - **Remei:** un mínim estructural verd; portes només per als fitxers preparats; que el Mestre aclarisca la via de bypass.
- **G/T1F-15** · lease. **Cap skill descriu el flux de govern**, que únicament és a `PROTOCOL_PETORRETA.md:104-106`.
  - **Remei:** una skill de governança amb la cadena d'amunt.
- **T1N-04** · lease. **segell-auto comprova el segell global a cada eina que no és de lectura** (`segell-auto.mjs:15-25`). El símptoma està superat, però el defecte continua latent.
  - **Remei:** alertar només de les derives noves respecte de l'inici de la sessió.

**Torns i hooks:**
- **T1C-08 + T1N-01** · lease. **Claude no pot executar `tancament.mjs` en cap mode** (`mutation-policy.mjs:134-142`, `command-policy.mjs:71,78-79`, `hooks-local.mjs:90`). Contradiu AGENTS §4 i el pas 8 de wiki-cicle-de-vida, que diu «És lectura».
  - **Remei:** admetre `tancament --check --turn-id` com a lectura, després de revisar-ne els subprocessos.
- **T1N-02** · lease. **Torns amb caducitat fixa de 24 h, sense renew ni abandon** (`turns.mjs:44,59,78,157`; `tancament.mjs:15-29`).
  - **Què passa:** 137 de 155 torns són caducats; 110 no van arribar mai a planned.
  - **Remei:** separar el torn de la salut global; `renew` i `abandon --motiu`; mesurar per actor.
- **T1N-17** · lease. **La zona humana no es pot reconéixer:** startHumanWatch i acknowledgeHumanZoneChanges no tenen cridador (`turns.mjs:79,237,245`). Hi ha un cas real a `LEDGER.md:654`.
- **T1N-13 + T1C-20** · lease. **Els hooks vetan lectures legítimes:** WebSearch i WebFetch (`mutation-policy.mjs:44-47`), que la Fase A de wiki-busca-skills necessita; el --output d'obrir_torn; la reinjecció a cada eina.
  - **Matís:** el navegador MCP s'admet com a substitut (`hooks-local.mjs:85`), però cap skill el nomena.

**Cens i router:**
- **T1N-11 + G/T1F-09 + T1C-21** · lease. **El cens de skills viu en sis còpies** (29/24/24/24/29/24) i no hi ha generador únic. Cap eina crea els symlinks.
  - **Remei:** `skills:sync` amb lease; pas de promoció a wiki-busca-skills.
- **T1A-04 + T1B-04 + T1C-02 + T1D-09 + T1N-10** · lease. **L'índex del router és ranci i no deixa traça.**
  - **On:** `persona_router.mjs:34-41`; `build_skills_index.mjs:60-66`, on --check ix sempre amb 0. L'índex és del 30-09 03:08.
  - **Remei:** que --check falle si difereix; regenerar-lo al SessionStart; una línia JSONL per disparo.
- **T1C-07 + T1D-08** · lease. **El router no normalitza** (`persona_router.mjs:54,60`): «planificacio», «app grid shell», «calendari agricola» i els disparadors amb U+2019 no casen mai.
- **T1A-22 + T1N-24** · lease. **Router només a Claude i hooks asimètrics entre hosts** (`.claude/settings.json:22-30`, `.agents/hooks.json:3-21`, `.codex/hooks.json:9-11`). 5 descripcions diuen «què» i no «quan».

**Arrencada, memòria i doctrina:**
- **T1N-15** · lease. **Cinc llistes d'arrencada que es contradiuen** (`context-local.mjs:9-10`, `AGENTS.md:89`, `QUI_SOC.md:62`, `BIOS.md:13`, `BOOTSTRAP.md:10`). Cap host no llig cervell.json.
- **T1N-05** · lease. **L'ON_ESTIC és ranci per construcció:** al disc diu 18:55:09Z i al context importat, 13:01:32Z. `despertar.mjs:203` reescriu un fitxer versionat.
  - **Remei:** llevar l'@import; `despertar --stdout` com a lectura.
- **T1N-06** · lease. **despertar no pot datar l'ESTAT des del 24-09** (`despertar.mjs:80` només entén AAMMDD_HHMM).
- **T1N-07** · lease. **El LEDGER perd la jornada:** l'única entrada del 01-10 és la l. 672, i les l. 22-23 diuen «tancat» de torns que estan en context_loaded.
- **T1N-08** · lease. **No es fa complir la immutabilitat del LEDGER** (`verify-ledger.mjs:20,37`): entrades intercalades (l. 21-25) i dues en una línia (l. 611).
- **T1A-11 + T1A-20** · lease. **El REFLEX DE CORRECCIÓ només viu a `CLAUDE.md:8-14`:** 4 correccions i 4 recaigudes al LEDGER; core-higiene-escriptori té 4 lliçons sense rebut i la 260930 està en negatiu.
  - **Remei:** portar el REFLEX a AGENTS.md.
- **T1A-21 + T1B-12 + T1B-23 + T1C-12 + T1C-13 + T1N-09 + M/T1F-10** · lease. **«petorreta» (i «pla») està prohibida en doctrina, però la mecànica l'accepta.**
  - **On:** `taxonomia.json:27-28`, `schema.json:30`, `porta-plantilla-viva.mjs:63,86`, `porta-olivera.mjs:62,203`.
  - **Què passa:** la correcció de l'acta 261001_1920 no és ni a cap skill ni al LEDGER.
- **T1C-14** · lease. **El pla de hui és buit i no està vinculat** (`261001_2050_pla_implementacio.md:41-53`; `torn_0a24c0cd` té plan null).
- **T1C-26** · sense lease. **La plantilla diu que «Escriptori net» vol dir buit** (`prompt_local.md:27`), en contra d'AGENTS §0.1.
- **T1C-17** · lease. **sdp-workflow §0 (`SKILL.md:23`) cita una ruta de 90_.** tractor-doctrina l'eximix.

**Consola i rastre:**
- **T1C-15 + T1D-17 + T1N-12** · lease. **El panell de rebuts llig un canal mort** (`consola-iaia.mjs:52-56,63,100`): l'últim rebut és del 2026-09-19T23:03:39Z. `context_documental.mjs:99` escriu a una carpeta que no existix.
  - **Remei:** llegir els `receipts.issuedAt` dels torns.
- **T1D-16 + T1C-16 + T1B-25** · lease. **Cap pas de cap skill deixa rastre:** el diari no té escriptor (`matrix.mjs:11`), i ambPla i els receipts no es mostren. Incomplix l'acta `261001_1920:26`.
  - **Remei:** un escriptor mínim del diari (skill.dispara, porta.execucio, skill.flux).
- **T1N-21 + G/T1F-06 + M/T1F-11 + G/T1F-16** · lease, excepte G/T1F-16. **El Mapa mesura la configuració, no l'execució** (`construeixMapa.js:610,730-731`; `mapa-consola.mjs:38,232-314`; `run-portes.mjs:109-124`).
- **T1A-18** · lease. **core-higiene-escriptori té recaigudes que ningú no mesura:** 97 injeccions d'Escriptori brut sobre 1.856 invocacions; --arxiva no deixa traça.
- **T1A-15** · lease. **tracker_consum escriu un CSV que ningú no llig**; la Consola espera consum.tokens.
- **T1A-23 + T1B-24** · lease. **`schema.json` no admet contracte.escriu, que el Mapa sí que llig.**
- **T1A-12** · lease. **El termòmetre de core-context-panic està desendollat.**

**Skills del Brain i de producte:**
- **T1A-02** · lease. **core-empaquetat-wp prescriu tres destins, i la seua eina no n'admet cap** (`empaqueta.mjs:518,520` escriu a release/). Hi ha 11 ZIP en 3 destins.
- **T1A-03** · lease. **core-empaquetat-wp mana escriure a 01_produccio i fer `rm -rf`** (`SKILL.md:28,31`).
- **T1A-05** · lease. **La REGLA SAGRADA del Consell imprimix «[object Object]»**, i `node -e` està vetat.
  - **Remei:** `npm run porta:cens`.
- **T1A-06** · lease. **Consum de setembre i rols divergents** respecte de consell.json.
- **T1A-08** · lease. **Dues skills fan MarIA l'única editora**, contra la política i la pràctica.
- **T1A-14** · lease. **core-edicio-segura té un disparador mort i una congelació sense porta.**
- **T1B-13** · lease. **core-taxonomia-estricta duplica wiki-documentacio-i-reflex sense torn ni rebut.**
- **T1B-05 + M/T1F-01** · lease. **La Fase 1 de la restauració crida l'àncora equivocada** (`tooling/brain/ancora.mjs`; la real és `tooling/scripts/ancora.mjs`).
- **T1B-07** · lease. **La guarda RESTAURACIÓ-VALIDADA no s'executa:** no hi ha `.husky/commit-msg`.
- **T1B-08** · lease. **Dues còpies de desenterrar;** la V7 no exigix lease.
- **T1B-22** · lease. **core-portaveu-institucional cita fonts que no existixen.**
- **T1C-04** · lease. **Tres fonts es contradiuen sobre l'estat humà a les actes.** Ho ha de decidir el Mestre.
- **T1C-05** · lease. **core-telemetria-huma es presenta com a tractor, sense font ni script.**
- **M/T1F-02** · lease. **La P4 de tractor-cognitiu es burla amb un literal** (`tractor-cognitiu.mjs:220-222`).
- **M/T1F-05** · lease. **La Teixidora pot escriure, encara que el pany diu que està retirada.**
- **M/T1F-06** · lease. **Els auditors de memòria fan servir els pilars antics** (`contradiction_engine.mjs:52-57`, que ix sempre amb 0).
- **M/T1F-09** · lease. **`tooling/higiene/tractor_cognitiu.mjs` pot esclafar fitxers en arxivar** (renameSync i unlinkSync sense comprovar col·lisions).
- **T1D-03** · lease. **sdp-universal-editor §1 encara mana la ploma**, i el codi usa CloudUpload.
- **T1D-04** · lease. **sdp-universal-page prescriu --sdp-blanc, que ja no existix,** i un radi de 32px; el codi usa 36px.
- **T1D-05** · lease. **La skill diu que Comentar obri el xat privat;** el codi obri el xat comú.
- **T1D-06** · lease. **sdp-pedra-seca §1 mana primitives que el §2 i la llei T4 prohibixen.**
- **T1D-07** · lease. **`:has()` i radis literals sense guarda:** tres `:has()` trenquen el Baseline Chrome 100 / Firefox 100.
- **T1D-18** · lease. **sdp-clon-whatsapp es diu «Pedra Seca v2»** i no fixa cap regla de precedència.

#### Baixa

| Id | Fitxer:línia | Què passa · remei | Lease |
|---|---|---|---|
| T1A-07 | core-consell-i-colmena:40-42 | La Doble Petorreta és ambigua · minúscules, i macro_bundle només per a IAs externes | sí |
| T1A-09 | core-automillora:35 | El pas 3 executa sense aprovació · proposar i esperar | sí |
| T1A-10 | core-automillora:5 | «core» salta per subcadena · disparadors específics | sí |
| T1A-13 | core-context-panic:8-13 | No salta amb «pànic» ni amb l'apòstrof tipogràfic · normalitzar | sí |
| T1A-16 | core-estrategia-ia:19-23 | Claude i Codex no poden executar el tracker · dir la via de cada agent | sí |
| T1A-17 | core-estrategia-ia:29-30 | Quatre vocabularis de models · font única | sí |
| T1A-19 | 02_investigacio_ia/…/prepara-pla.mjs:55 | Proposta de relleu sense aplicar · decidix el Mestre | sí |
| T1B-06 | core-restauracio-segellada:131 | La Fase 7 no diu que cal obrir la lease | sí |
| T1B-09 | frontissa-contingut.mjs:48-50 | La variant de recuperació d'una sola clau no és a la skill | sí |
| T1B-10 | skills_index.json:51-69 | Disparadors massa amples; description de 35 caràcters | sí |
| T1B-11 | schema.json:137-138 | Ningú no llig eines_obligatories | sí |
| T1B-14 | core-taxonomia-estricta:7 | Disparadors en anglés que el Mapa pinta com a vius | sí |
| T1B-15 + M/T1F-16 | neteja_brossa_arrel.mjs:27-31 | Cap porta no informa dels fitxers solts · --informe --json | sí |
| T1B-16 | package.json; mapa-consola.mjs:36-39 | La neteja no té invocador; la quarantena no té MANIFEST | sí |
| T1B-17 | registre_tasques.json:6 | higiene-basica diu «Esborra» i no té implementació | sí |
| T1B-18 | core-identitat:28-32 | Ordre d'arrencada que cap canal executa (vegeu T1N-15) | sí |
| T1B-20 | core-identitat-visual:12-18 | Còpia de la Wiki que ja ha divergit | sí |
| T1B-21 | core-portaveu-institucional:19-20 | No avisa de la frontissa de PAGE_COPY | sí |
| T1C-03 | torn_0a24c0cd:1835-1849 | 2050 i 2110 porten una hora 2 min posterior al rebut · rebutjar-ho al create. Este informe hi cau igual (Historial) | sí |
| T1C-28 | taxonomia.json:28 | 2110 té categoria «pla» amb un rebut de pla.implementacio | sí |
| T1C-10 | wiki-cicle-de-vida:18 | Nomena l'«Olivera», que la plantilla v3 ja no té | sí |
| T1C-11 | LEDGER.md:121 | Recaiguda imputada a una skill sense secció de Lliçons | sí |
| T1C-23 + T1D-13 | wiki-propagar-veritat:13-30; sdp-app-grid-shell:11 | `\n` literal davant de l'H1 i exemples tautològics · recuperar-los amb git log -p | sí |
| T1C-06 | core-telemetria-huma:28 | Demana símptomes de salut (RGPD art. 9) · risc latent | sí |
| T1C-18 | sdp-workflow:32,38,39 | Es cita a si mateixa; confon SemVer amb el format dels commits | sí |
| T1C-24 | wiki-propagar-veritat:22 | Usa eines exclusives d'Antigravity | sí |
| T1C-25 | wiki-documentacio-i-reflex:62-95 | Numeració trencada; tres lliçons redundants | sí |
| T1C-27 | wiki-cicle-de-vida:4 | Descripcions que no corresponen a la skill | sí |
| T1D-10 | protocolledge.json:313-314 | estudi_ia porta a la plantilla d'avaluar IAs | sí |
| T1D-12 | sdp-calendari-agricola:21 | Status canonic sense res implementat · passar a status futur | sí |
| T1D-14 | tractor-graella.mjs:26 | No nomena contracte_graella (hipòtesi: 01_produccio no s'ha llegit) | sí |
| T1D-15 | sdp-pedra-seca:78 | Apunta a DesignSection.jsx; el registre real és cataleg/registre.js | sí |
| T1D-19 | sdp-casos-us-essencials:26,31 | No diu l'estat de cap cas (1 de 4 fet) | sí |
| T1N-14 | hooks-local.mjs:90,113 | La branca Olivera per a Bash és inabastable | sí |
| T1N-16 | arrel.mjs:49,75 | El tooling llig el mirall com si fóra el BIOS | sí |
| T1N-18 | ESTAT.md:199,1113-1169 | 200 KB amb relleus enterrats · rotació mensual | sí |
| T1N-19 | somiador.mjs:13,66-67 | Peces orfes; el somiador mou sense destil·lar | sí |
| T1N-20 | obrir_torn.mjs:8 | 21 grafies d'actor · enum | sí |
| T1N-22 | registre_tasques.json:74-79 | La time-machine no té poda | sí |
| T1N-23 | bot/arrels.mjs:47-50 | Rutes del bot que no existixen en local | no |
| G/T1F-11 | segella.mjs:97 | L'evidència del segell no porta `at` | sí |
| G/T1F-12 | antigravity-hook.mjs:302-307 | El log no guarda l'ordre de shell | sí |
| G/T1F-13 + M/T1F-13 | tractor-cadena.mjs:81,245 | La C3 és inert i la C1 només mira tooling/gates | sí |
| G/T1F-14 | tractor-orfandat.mjs:9 | 4 de les 9 portes del Brain no veuen les skills | sí |
| M/T1F-03 | compile-wiki-to-system-prompt.mjs:70-71 | GENOMA.md es pot ressuscitar · SDP-LOCK | sí |
| M/T1F-04 | generar_genoma_v2.mjs:170-171 | El Clon escriu fora de la taxonomia | sí |
| M/T1F-07 | core/sistema_nervios.mjs:31,421 | Sense importadors | sí |
| M/T1F-08 | tooling/wiki/pre-commit.mjs:8-9 | pre-commit.mjs, el Makefile i sdp.mjs estan morts | sí |
| M/T1F-12 | run-portes.mjs:71,75 | --lock-token que cap script no llig | sí |
| M/T1F-15 | neteja_brain.mjs:28,32 | Anuncia modes retirats | sí |
| M/T1F-17 | tractor-cognitiu.mjs:43 | Calcula l'arrel pel seu compte | sí |
| M/T1F-18 | tooling/wiki/lib/persona_router.mjs:9 | Homònims i llibreries òrfenes | sí |
| M/T1F-19 | seo_auditor.mjs:9-13 | Stub que sempre dona verd | sí |
| M/T1F-20 | generar_petorreta_inversa.mjs:30-33 | Genera documents fora de document.mjs | sí |
| M/T1F-21 | codemod_assecar_graf.mjs:9-10 | No té dry-run | sí |

**Refutades (3):**
- **T1B-19:** demanar obediència als protocols no contradiu la Llei del Llop.
- **T1D-11:** la recerca té substitut, perquè hooks-local:85 admet el navegador MCP.
- **G/T1F-18:** el `_PROMPT_` en majúscules és una excepció documentada a PROTOCOL_PETORRETA:39.

### T1 · Fluxos proposats per tractor (acta 261001_1920)

Cada pas porta la seua mesura entre parèntesis. Tots els «exit 0» depenen de T1D-01, que la cadena de portes no s'aturi en el primer error.

**Skills:**
- **core-automillora (no):** correcció repetida (automillora.deteccio) → classificar com a hàbit o deute → lliçó en positiu a la skill → «correcció» al LEDGER → el deute es proposa i espera aprovació → recaiguda registrada · correccions/lliçons = 1,0.
- **core-consell-i-colmena:** porta:cens (exit 0) → destinataris per rol i tipus → prompt per document.mjs → congelació (0 escriptures fora d'abast) → auditories rebudes/convocades → --arxiva.
- **core-context-panic:** fusible.alerta (2 fallades o més de 150 artefactes) → 0 mutacions → informe → «fusible» al LEDGER → resolts/activats.
- **core-edicio-segura:** abast → 0 torns d'auditor oberts → edició per trossos → vitest (exit i N) → reversió si falla.
- **core-empaquetat-wp:** build:wp → empaqueta.mjs al destí únic (manifest) → ZIP conformes/trobats → temporals a .sdp-paperera → sha256 a l'ESTAT i al LEDGER.
- **core-estrategia-ia i tracker_consum:** captura → normalització → un sol JSONL consum.tokens → la Consola el llig (N/A si no hi ha font) → recomanació amb frescor ≤ 24 h.
- **core-identitat:** font única fixada pel Mestre → la skill com a punter breu → SessionStart amb paritat → skill.carrega per sessió.
- **core-identitat-visual:** frontmatter vàlid → corporativa o narrativa → §5 llegit → prompt documental → checklist de la Signatura Gràfica → skill.pas.
- **core-memoria-historica:** font viva (0 de 90_) → lliçó amb font i data → ESTAT de menys de 24 h → acta vàlida → «decisio» al LEDGER → tancament --check.
- **core-portaveu-institucional:** decisió aprovada → fonts de la Wiki → PAGE_COPY, README i readme.txt al mateix commit → --aprova del Mestre → «difusio» al LEDGER.
- **core-restauracio-segellada:** classificar → `scripts/ancora --pon` (ref nova) → desenterrar en sec (segell) → «EL QUE PERDS» i el sí del Mestre → lease alta → --segell → commit-msg validat.
- **core-taxonomia-estricta:** obrir_torn → context (rebut) → porta-taxonomia --fitxer → create i check → --staged → --paritat · noms rebutjats per commit.
- **core-telemetria-huma:** min(createdAt) del dia → torns per actor → declaració, només si el Mestre la fa → hores = max(updatedAt) − min(createdAt), sense semàfor.
- **core-temps-termodinamic:** promoció → hhmm ≤ issuedAt + 1 min a context → rebuig al create → T5 per minuts · noms-futur (hui 2/5, i este informe).
- **sdp-app-grid-shell (no):** diff → porta:graella → design_guard i inline-styles → Vitest de la graella → Llei del Píxel en 3 modes → porta.execucio.
- **sdp-calendari-agricola:** status futur → pla aprovat → migració amb tractor-rls i tractor-enxufe → porta:cataleg → simulació d'SMS amb proves.
- **sdp-casos-us-essencials (no):** el pla cita els casos → taula d'estat (hui 1/4) → aresta al Mapa → prova d'acceptació per cas.
- **sdp-clon-whatsapp:** frontmatter → captura citada al codi (hui 17/75) → i18n.claus → design_guard i tokens → ajustosXat N/N.
- **sdp-estudi-mercat:** plantilla A-E → navegador MCP o Perplexity → 1 URL o més per secció → destil·lació (adoptat o descartat) → check i àncora.
- **sdp-pedra-seca:** diff CSS/JSX → porta:cataleg → tokens → pedra-seca i design_guard (deute ≤ 177) → 58px i classes → Llei del Píxel.
- **sdp-universal-editor (no):** diff → contrast amb Pedra Seca §10 → proves d'EstatDesament i NotesSection → Llei del Píxel.
- **sdp-universal-page (no):** diff → cataleg/registre.js → design_guard i tokens (0 tokens fantasma) → PageFrame i barres N/N → Llei del Píxel.
- **sdp-workflow:** torn code → pla amb check → aprovació i `document.mjs plan` → own → portes per superfície amb l'exit registrat → cens amb lease si toca skills → --close.
- **wiki-busca-skills:** URL → recerca MCP → informe estudi_ia → esborrany per la ruta skill → promoció amb lease (0 avisos fora-index, fora-cataleg o invalid) → «skill-nova» al LEDGER.
- **wiki-documentacio-i-reflex:** --informe (exit 0) → pla ple i vinculat → prompt que l'enllaça → el hook exigix el pla previ (hui 0/3) → auditories/prompts → LEDGER.
- **wiki-propagar-veritat:** decisió al LEDGER → inventari amb exclusions → llista aprovada → edició fitxer a fitxer → 0 residus → «propagacio» al diari.
- **Skills amb flux «sí» però sense rastre:**
  - core-higiene-escriptori (olivera.arxiva; 97/1.856);
  - core-neteja-brossa (MANIFEST i LEDGER per --aplica);
  - wiki-cicle-de-vida (torn.tancament valid:false).

**Peces del nucli:**
- **context-local:** context.injectat (host, fonts, bytes) → paritat amb cervell.json → 128 KB com a màxim → context.fallit.
- **despertar + ON_ESTIC:** --stdout sense escriptura → dataEstat compartit → avís si el retard passa de 60 min → git status net.
- **CLAUDE.md + cervell.json (no):** llista única → imports generats (paritat 3/3) → porta al pre-commit.
- **router:** reconstrucció quan un SKILL.md és més nou → paraula sencera → router.dispara → Read en el mateix torn (encert ≥ 0,6).
- **segell:** deriva prèvia fixada → alerta només de la nova → reconciliació amb actor i validació → 0 fallades per cada 100 lectures.
- **circuit documental:** actor de l'enum → context, create i check → plan i own → relleu per executor → --close o abandon ((tancats + abandonats)/oberts ≥ 0,9).
- **tancament:** errors del torn → salut com a informe → --close amb durada → entrada de LEDGER generada.
- **LEDGER:** HEAD com a prefix → hash per entrada → «tancat» contrastat → relleus-sense-ledger = 0.
- **ESTAT:** relleu al cap amb ISO i turn_id → rotació per sota de 64 KB → retard en minuts.
- **somiador (no):** --dry-run → destil·lat per episodi → destí intern → handoff amb rebut.
- **matrix i diari (no):** matrix.diagnostic per execució, o panell alimentat per receipts.issuedAt (rebuts-documentals-24h).
- **peces orfes (no):** a quarantena, o endollades amb una línia JSONL per execució.
- **cens de skills (no):** validar → skills:sync (6/6 còpies iguals) → segell per executor → el pre-commit falla si alguna divergix.
- **governança:** P0-P7 · reconciliacions-segell-7d (0), escriptures-skills-sense-lease (hui 13 contra 1 transacció), estat-lease-reflex.
- **9 portes del Brain:** readOnly → JSON per pas → veredictes en 24 h (hui 0/9) → baseline-wiki-fresca.
- **tram de commit:** mínim estructural verd → portes per fitxers preparats → lint i proves una sola vegada → commits amb --no-verify per setmana = 0.
- **pipeline de tooling/wiki (no):** cens de desendollats (hui 24 + 1 + 5) → retirar o endollar → bypass-canonada 0.

### T1 · On es perd el context

1. **La importació arriba abans que la generació.** CLAUDE.md fa l'@-import d'ON_ESTIC abans que despertar el reescriga: el context porta la versió de les 13:01:32Z, i al disc hi ha la de les 18:55:09Z (T1N-05).
2. **Els subagents no tenen canal fresc.** Hereten els imports rancis i no reben ni l'eixida de SessionStart ni SDP:FONT.
3. **El cens fragmentat fa skills invisibles.** Les 5 skills noves no són a `.claude/skills`, ni a l'índex del router, ni a la llista de skills de Claude (T1N-11, T1A-04).
4. **El router només funciona a Claude i casa per subcadena.** Codex, Antigravity i els subagents no reben punters (T1A-22, T1C-07).
5. **El diari no té escriptor.** El pròxim agent no sap què es va executar (T1C-15, T1D-16).
6. **Les correccions no arriben a la memòria persistent.** La correcció de les 19:20 no és ni a cap skill ni al LEDGER, i el REFLEX només vincula Claude (T1N-09, T1N-07, T1A-11).
7. **L'ESTAT queda enrere.** L'últim relleu és de les 14:10, despertar no el pot datar i el fitxer pesa 200 KB (T1N-06, T1N-18).
8. **Els torns moren sense tancar.** 137 de 155 són caducats i Claude no pot executar el tancament: el relleu governat no es fa mai (T1N-02, T1N-01).
9. **La identitat d'arrencada és contradictòria.** Hi ha cinc llistes, i QUI_SOC, importat a Claude, li diu «Ets la IAIA MarIA» (T1N-15).
10. **MarIA opera fora del registre i el pla es duplica.** El log d'Antigravity no guarda les ordres i la reconciliació no té actor. El prompt porta el pla incrustat mentre el pla 2050 continua buit (G/T1F-12, G/T1F-02, T1C-14).

### T3 · Base empírica

Hi ha dos talls de temps:
- el de l'orquestrador, a les 21:05Z;
- el de les reverificacions pròpies, després de les 21:11Z.

Les hores amb Z són UTC. Les dates de `ls` van en hora local (CEST, +2).

#### Què es mesura ja

| Senyal | Fitxer | Últim valor i data | Qui l'escriu | Qui el llig |
|---|---|---|---|---|
| Funció de salut (18 mètriques) i avisos | GET `/__iaia/mapa.json` (`tooling/brain/mapa-consola.mjs` → `construeixMapa.js:559-731`) | 21:05:40Z: 260 nodes, 217 arestes i 23 avisos (5 alts) | El compilador, a cada petició. No guarda historial | La pàgina Salut i `actorsMapa.js:177` (només `vigilants-vius`) |
| Rebuts Matrix | `.agents/.diari_sessio.jsonl` (`matrix.rebut`) | 38 rebuts; l'últim del **2026-09-19T23:03:39Z** (11 dies i 22 h al tall) | Ningú (`matrix.mjs:11`) | `consola-iaia.mjs:56` → panell Rebuts |
| Rebuts de torn | `.agents/runtime/turns/*.json` → `receipts` | 39 `issuedAt` del 2026-10-01 en 12 torns | `document.mjs context` | Només `escriptori-amb-rebut` |
| Torns | ídem | 155 torns, 5 `closed`, 137 caducats oberts. Dels 12 d'avui, cap és citat a ESTAT ni al LEDGER | `obrir_torn.mjs`, `document.mjs`, `tancament.mjs` | `fonts-vigilancia.mjs` (només `state` i `expiresAt`) |
| Traça per eina d'Antigravity (MarIA) | `.agents/runtime/antigravity-hook.log` | 3.440 línies des del 2026-09-30T01:12:58Z: 29 deny, 41 ask i 12 motius `reflex:`. Sense camp actor | `antigravity-hook.mjs:277` | Cap lector de producció |
| Traça de Claude i Codex | — | No n'hi ha cap al repo | `hooks-local.mjs` no escriu res | — |
| Segell de skills | `SKILLS_SEAL.json`, `seal-transactions/`, `runtime/segell.log` | b94b8941; reconciliació a les 19:37Z; 29/29 | `segella.mjs` (sense actor) | Mapa |
| Frontmatter i cens de skills | disc, `schema.json`, `skills_index.json`, `.claude/skills/` | 24/29 i 24/29 | — | Mapa |
| LEDGER | `.agents/LEDGER.md` | 676 línies. L'última entrada, en format ISO, és invisible a `fonts-vigilancia.mjs:189`. 0 línies `2610xx` i 0 `infraccio` | Agents i `verify-ledger.mjs --sign` | `recaigudes-ledger`, `integritat-ledger` |
| ESTAT | `.agents/ESTAT.md` | Primera capçalera: 2026-10-01 14:10, de MarIA. Frescor de 9 h | Agents | `frescor-relleu-estat`; `despertar.mjs:80` no la sap datar |
| Conformitat documental | stdout de `porta-documents.mjs` | `valid:false`, 14 errors en 4 fitxers; 1 de 5 documents datats conforme | Sota demanda | Ningú: N/A fix a `construeixMapa.js:730` |
| Escriptori | `porta-olivera.mjs --informe` | 5 `.md` vius i Safata buida | Hook pre-invocation | `escriptori-ancorat` 5/5, `escriptori-amb-rebut` 5/5 |
| Consum mesurat | `.diari_sessio.jsonl` (`consum.tokens`) | 1 línia del 2026-09-30T13:13:37Z, sense `sessio` ni `font` | A mà | PanellConsums |
| Captures de consum | `10_metriques/consum_ia.csv` | 2026-09-30 15:05, en UTC però sense marca de zona | `tracker_consum.mjs`, a mà | Cap lector automàtic |
| Crèdits | `.agents/credits.json` | `:3` «1702 crèdits», en text | A mà | `consolaContent.js`: **ja s'accepta, reparat en este torn** |
| Termometria de context | `termometre_context.mjs` | Mai publicada | `preflight_matrix_wrapper.mjs`, no registrat | — |
| Lliçons del Mestre | `.agents/skills/*/SKILL.md` | 14 en 3 skills; l'última del 260930 | Agents (REFLEX) | `compteLlicons` → Inventari, només el recompte |
| Actes d'incidència | `10_actes/*`, tag `incidencia` | `261001_1920_acta_incidencia.md`, sense lliçó ni línia de LEDGER | Agents | Ningú |
| Registre d'automillora | `02_saber/core_registre_automillora.md` | `status: arxivat`; última fila 260920_0635 | A mà | Ningú. No és admissible com a font |
| Immunitari | `.immunitari/journal.ndjson` i `receptes/` | Diari: 119 operacions, l'última del 2026-08-03 (fòssil). Receptes horàries | Plaquetes (receptes) | `consola-iaia.mjs:100` llig el diari; les receptes, ningú |
| Índex de Trellat | `tooling/wiki/core/trellat_metrics.mjs` | Prototip de 3 proxies retirat; `package.json` no té cap script de l'IT | — | — |

#### Senyals morts o sense consumidor

**Morts:**
- `matrix.rebut`: gairebé 12 dies sense rebuts;
- `journal.ndjson`;
- la termometria;
- `consum.tokens`: una sola línia, manual;
- el registre d'automillora i l'esforç humà;
- la gràfica de consum;
- `conformitat-documental` i `cadena-portes`: N/A fix;
- l'alarma «ESTAT RANCI» de `despertar.mjs`.

**Sense consumidor:**
- `antigravity-hook.log`;
- `segell.log`;
- les receptes de Plaquetes;
- `receipts`, `plan`, `ownedPaths`, `history` i `actor` dels torns;
- les entrades `correcció` del LEDGER;
- les dates de les lliçons;
- els tags de `10_actes`;
- l'eixida de `porta-documents.mjs`.

### T3 · Norma de mesura (buit 5 del crític)

**`_wiki_de_poble/02_saber/protocols_tecnics/index_trellat.md`** (`status: canonic`):
- Fórmula: IT = 0,4·CT + 0,3·CE + 0,2·CA + 0,1·CR.
- És un marc de conversa, no una telemetria ni una porta. Sense fonts, denominadors i període no es calcula (`:10`).
- CT: resultats reproduïbles, contradiccions i decisions resoltes. CE: tasques i recursos mesurats amb una definició prèvia d'«útil». CA: accessibilitat. CR: hui N/A, perquè l'arquitectura és online-first (`:20-23`).
- N/A: «està prohibit substituir-les per una estimació» (`:43`).
- Les dimensions es publiquen per separat (`:52`), sense comparar scopes ni instruments diferents (`:53`).
- Scope, període, denominadors i proves es fixen «abans de mirar el resultat» (`:50`).

**Altres fonts:**
- **`tooling/wiki/core/trellat_metrics.mjs`** és un «Prototip històric de tres proxies» (`:2-3`). La seua CE són bytes per fitxer i la seua CR depén de snapshots, cosa que contradiu `index_trellat.md:23`. No servix per a mesurar agents.
- **`core_registre_automillora.md`** (arxivat) té xifres estimades: «Estalvi absolut d'1h i ~40k tokens» (`:24`). No és admissible com a font.
- **`01_ser/02_genotip.md`**: es poden mesurar les lleis 1, 3, 4, 5, 7, 8 i 10.
- **`03_consola_termodinamica/00_portada.md`**: sense peça, el valor és N/A (`:12`); hi ha un contracte per a promoure una mètrica (`:43-49`); una mètrica consultiva no activa mutacions (`:51`).

**Conseqüències:**
- L'IT agregat val **N/A**: CR és N/A per norma i CA no té cap mètrica d'agent.
- Es publiquen CT i CE per separat.
- Els llindars de baix es van proposar després de vore els valors del tall. El Mestre els ha de fixar abans de la primera lectura oficial.

**Encaix amb el contracte `salut[]`.** `metrica()` (`construeixMapa.js:93-106`) ja porta numerador, denominador, ferramenta (`font`) i evidència (`prova`). Hi falten abast, versió, període (`finestra`), exclosos, pregunta, llindar i responsable. `mapaContent.js:117-130` descarta qualsevol camp nou, així que cal ampliar-lo al mateix temps, i actualitzar també `04_contracte_de_dades.md`. Les 14 mètriques hi caben. M07 ocupa el N/A fix de `:730`.

### T3 · Regles mesurables de MarIA

| Regla | Font | Senyal | Mètrica |
|---|---|---|---|
| Plantilla viva abans de redactar (REGLA 0) | `AGENTS.md:12-15`; `QUI_SOC.md` §4; `02_genotip.md:16` | Rebuts de torn i deny `reflex:` | M01 |
| Declarar la infracció al LEDGER | `AGENTS.md:15` | Línia `infraccio` (0 hui) | M03 |
| Escriptori net abans de redactar, i la neteja amb l'eina | `AGENTS.md:18-25`; skills d'higiene i reflex | porta-olivera, `injecta`, ask «Trasllat a mà» | M06, M04 |
| No convertir el Mestre en operari | `02_genotip.md:20` (llei 7) | Ask per drecera | M04 |
| Nom `aammdd_hhmm_categoria_titol` | `AGENTS.md:31`; llei 8 | porta-taxonomia i `rutesDelNom` | M07 |
| Fusible als dos intents | `AGENTS.md:59-60`; llei 10 | Ràfegues de deny | M02 |
| Pla aprovat i abast per superfície abans del codi | `sdp-workflow/SKILL.md:26-27,47`; llei 1 | `scope`, `plan`, `ownedPaths` dels torns | M05 |
| Pla d'Implementació abans del prompt | `wiki-documentacio-i-reflex/SKILL.md:88-93` | Rebuts `pla.implementacio` contra `prompt.*` | M06 |
| Relleu a ESTAT i LEDGER, i `tancament.mjs` | `AGENTS.md:37`; `QUI_SOC.md:45` | `checkTurn` | M08 |
| Zero Mentides Belles: cap verd sense prova | `QUI_SOC.md:20-21`; llei 10 | LEDGER i ESTAT contra `state` | M09 |
| Reflex de correcció | `CLAUDE.md:8-14` | Lliçons datades, LEDGER `correcció`, tags `incidencia` | M10 |
| Una recaiguda és una falla de càrrega | `CLAUDE.md:17-18`; llei 5 | LEDGER `recaiguda`, classes de deny | M11, M12 |
| Mecànica, no memòria | `wiki-documentacio-i-reflex/SKILL.md:94` | Marca `prova:`, que no existix | M14 |
| Registrar el consum | `core-estrategia-ia/SKILL.md:19-21`; llei 4 | `consum.tokens` mesurat, que no existix | M13 |
| N/A abans que una estimació | `wiki-cicle-de-vida/SKILL.md:28`; `index_trellat.md:10,43` | Restricció transversal | Totes |

No es poden mesurar hui: el gallet, el valencià, les disculpes, el format del xat, la lectura de l'Acta Marmota, `npm install` i la Llei del Píxel (el xat no es registra i `run_command` no porta l'ordre). Les regles contradictòries les ha de decidir el Mestre (T3I-16, T3I-17).

### T3 · Conjunt final de mètriques (14)

El verificador no n'ha refutat cap: M09 queda confirmada i les altres 13, matisades. Les fórmules ja porten la correcció.

| Id | Pregunta | Fórmula | Font | Verd · Ambre · Roig | Pàgina | IT |
|---|---|---|---|---|---|---|
| M01 `primer-intent-documental:maria` | Els documents vigilats naixen amb la plantilla i passen la porta al primer intent? | Vigilats amb rebut anterior al primer intent i primer intent `allow` / vigilats amb algun intent. Els reanomenats compten; els ask de fricció són neutres | Traça i `receipts`. Nova: `hooks-local.log` | ≥0,80 · 0,50–0,79 · <0,50 | Salut | CE |
| M02 `fusible-respectat:maria` | Després de dos intents negats, l'agent s'atura? | Ràfegues de 2 deny o més que no arriben al tercer intent / ràfegues de 2 deny o més. Buits de 10 min com a màxim | Traça. Nova: `hooks-local.log` | 1,00 en 7 d · ≥0,75 · <0,75 | Salut | CE |
| M03 `infraccions-regla0-declarades:maria` | Les infraccions de la REGLA 0 es declaren? | Fitxers amb deny `reflex:` i línia `infraccio` al LEDGER en 24 h o menys / fitxers amb deny `reflex:` sense rebut propi | Traça i LEDGER. Nova: vocabulari `infraccio` | 1,00 · ≥0,80 · <0,80 | Salut | CT |
| M04 `escalades-per-drecera` | Quantes decisions passa l'agent al Mestre per una drecera? | Ask per dia amb motiu «Trasllat a mà» o «Escriptura per shell». La fricció es compta a part | Traça (`antigravity-hook.mjs:141-151`) | 0 · 1–2 · ≥3 per dia | Salut | CE |
| M05 `abast-declarat:maria` | El codi que escriu l'agent cau dins d'un torn `code` amb pla? | Escriptures a `src/`, `tests/`, `tooling/` i `scripts/` dins d'un torn del mateix actor amb `scope code` i `plan` / totes eixes escriptures | Traça i torns. Nova: actor i torn a cada línia | ≥0,95 · 0,80–0,94 · <0,80 | Salut | CT |
| M06 `pla-previ-conforme` | Quan naix un prompt, ja hi ha el Pla que l'origina? | (a) rebut `pla.implementacio` anterior al primer `prompt.*` del dia; (b) contingut i enllaç via `inspeccionaText` | `receipts`. Nova: entrada `check` a l'history | ≥0,90 · 0,60–0,89 · <0,60 | Salut | CT |
| M07 `conformitat-documental` | Els documents datats complixen la plantilla i la taxonomia? | Documents de l'Escriptori i de `10_actes` sense error de validació, que passen T1–T5 i tenen l'HHMM a 15 min o menys de l'`issuedAt` / els mateixos documents (menys els de mtime < 30 min). «N/D» és vàlid per a Model IA i Tokens | porta-documents, taxonomia.json, `receipts` | ≥0,90 · 0,70–0,89 · <0,70 | Salut (substituïx el N/A de `:730`) | CT |
| M08 `relleu-de-torn` | Cada torn deixa relleu amb el seu id? | Torns amb rebut (de fa 7 d a fa 24 h) amb l'id complet a un bloc d'ESTAT i a una línia de LEDGER / els mateixos torns | Torns, ESTAT, LEDGER | ≥0,90 · 0,60–0,89 · <0,60 | Salut | CT |
| M09 `veracitat-dels-tancaments` | Quan un relleu diu «tancat», el torn ho confirma? | Entrades del LEDGER «tancat» que apunten a un torn `closed` amb verify en exit 0 / entrades del LEDGER «tancat» | `fonts.ledger.entrades` i `fonts.torns`, que ja arriben al compilador | 1,00 · sense ambre · <1,00 | Salut | CT |
| M10 `reflex-correccio-complet` | Cada correcció deixa lliçó i línia al LEDGER? | Unitats (skill, AAMMDD) amb lliçó i línia del mateix dia / totes les unitats de 30 d. Una skill sense secció de lliçons compta com a incompleta | Skills, LEDGER, tags de `10_actes` | 1,00 · ≥0,80 · <0,80 | Salut | CT |
| M11 `llicons-absorbides` | Les lliçons de 7 dies o més han deixat de recaure? | Lliçons de ≥ 7 d sense recaiguda posterior a la mateixa skill / totes les lliçons de ≥ 7 d | Skills i LEDGER | ≥0,80 · 0,50–0,79 · <0,50 | Salut | CT |
| M12 `reincidencia-de-porta:maria` | El mateix motiu de rebuig torna en episodis posteriors? | Classes amb 2 o més episodis / classes vistes, en 14 d (menys és millor) | Traça. Nova: taula de classes | ≤0,20 · 0,21–0,50 · >0,50 | Salut | CT |
| M13 `cobertura-consum-mesurat` + `cost-per-torn-verificat:<actor>` | Quant costa, en tokens mesurats, cada torn verificat? | Cobertura: parells (actor, dia) amb `consum.tokens` mesurat. Cost, només amb cobertura ≥ 0,90: Σ tokens / torns verificats. Altrament, N/A. No es comparen arnesos | Nova: `consum.tokens` des de les transcripcions (hook Stop) | Cobertura ≥0,90 · 0,50–0,89 · <0,50. Cost: mediana i p90 propis després de 14 d | Salut | CE |
| M14 `llicons-mecanitzades` | Quantes lliçons comprova una porta o una prova? | Lliçons amb id únic i `prova: <ordre>` existent / totes les lliçons. N/A fins que hi haja la convenció | Nova: marca a la skill, segellada | ≥0,60 · 0,30–0,59 · <0,30 | Salut | CT |

**Senyals noves:**
- `hooks-local.log`: `{t, actor, mode, eina, fitxer, decisio, motiu}`, escrit abans dels `return` primerencs de `checkLocal`. També cal afegir `actor` a la traça d'Antigravity.
- `consum.tokens`: `{t, tipus, agent, sessio, font, model, entrada, eixida, cache_lectura, cache_escriptura}`.
- `maduresa.jsonl`: `{t, esdeveniment:"correccio.mestre", agent, emissor}`, sense text.
- `salut-historial.jsonl`: una instantània diària de `salut[]`.
- `history` del torn: `{action:"check", file, valid, hash, at}`.

#### Valor al tall

| Id | Valor | Abast i exclosos |
|---|---|---|
| M01 | 0,30 (6/20; MarIA, 01-10 fins a les 19:35Z). Del dissenyador; ningú no l'ha recomptat | Arnés Antigravity, dia local |
| M02 | Com a mínim 1 ràfega trencada (tres deny en 46 s, `antigravity-hook.log:2787-2793`). La fracció no està fixada | La traça comença el 30-09 |
| M03 | Numerador 0. El denominador s'ha de recomptar | El motiu es retalla a 200 caràcters |
| M04 | 13 ask de conducta de 41 des del 30-09. El valor per dia no s'ha recomptat | Només detecta `mv` |
| M05 | 0/35 segons el jurat. L'atribució no es pot demostrar, perquè la traça no porta el torn | — |
| M06 | 0/2 al torn `0a24c0cd`: els prompts són de les 18:03Z i les 18:05Z, i el pla de les 18:48Z | — |
| M07 | 1/5, reverificat | — |
| M08 | N/A dins de la finestra; cap dels 12 torns d'avui és citat | — |
| M09 | 0/2 (`LEDGER.md:22-23`, tots dos torns en `context_loaded`), reverificat | Acumulativa |
| M10 | 0,40 (4/10) | 30 d |
| M11 | 0,45 (5/11) | — |
| M12 | La classe «reflex: sense rebut» torna el 30-09 i el 01-10. La fracció no s'ha recomptat | 14 d, truncats |
| M13 | Cobertura 0. Cost N/A | MarIA queda sense instrument |
| M14 | N/A | — |

#### Fora del conjunt

- **Descartades:**
  - `activitat-en-curs-viva`: el mtime es pot trampejar.
  - `finestra-sense-activitat`: mesura el Mestre, no l'agent.
  - `refutacio-propia`: no té font.
- **Convertida en avís:** `carrega-arrencada-duplicada`.
- **Absorbides en altres mètriques:** `cobertura-consum-mesurat` (M13), `neteja-abans-de-redactar` (M06), `taxonomia-de-naixement` (M07) i `tancaments-acreditats` (M09).
- **Pendents de puntuar:** `edicio-durant-auditoria` (T3I-20) i `governanca-sense-lease` (T3I-04).

### T3 · Model de maduresa N0–N4

Els nivells són acumulatius i s'avaluen per actor. Un requisit en N/A no es dona per complit. El nivell de l'eixam és el mínim dels tres actors.

| Nivell | Condició | Dimensió IT |
|---|---|---|
| N0 · Opac | No complix N1 | — |
| N1 · Observable | (a) Traça per eina en els 3 actors, amb actor canònic. (b) Almenys 11 de les 14 mètriques calculables durant 7 d. (c) Historial diari de `salut[]`. (d) La Consola no llig cap font morta | Precondició |
| N2 · Honest | 7 d amb M09 = 1,00, M03 ≥ 0,80, M10 ≥ 0,80 i M08 ≥ 0,60 | CT |
| N3 · Disciplinat | 7 d amb M01 ≥ 0,80, M02 = 1,00, M06 ≥ 0,90, M07 ≥ 0,90, M05 ≥ 0,95, M04 ≤ 2 per dia i M08 ≥ 0,90 | CT + CE |
| N4 · Autocorrectiu | 14 d amb M11 ≥ 0,80, M12 ≤ 0,20, M14 ≥ 0,60, M13 vàlida i igual o per davall del p90 propi, i cap recaiguda nova | CT + CE (tendència) |

**On està hui l'eixam:** tots tres actors en **N0**.
- **MarIA (arnés Antigravity):** té traça, però el Mapa no la llig i la traça no porta actor. Dades: M09 0/2, M03 0 declarades, M10 0,40, M06 0/2, M07 1/5, M11 0,45.
- **Claude i Codex:** `hooks-local.mjs` no escriu cap traça.
- **Què falta per a N1:**
  - (a) traça amb actor als 3 arnesos; hui n'hi ha 1 de 3, i sense camp actor;
  - (b) mètriques implementades; hui 0 de 14, i només M09 es pot calcular amb el que arriba al compilador;
  - (c) historial de `salut[]`; no n'hi ha;
  - (d) cap font morta; hui la Consola en llig, com els rebuts Matrix de fa gairebé 12 dies.

  El rebuig de `consola.json` per `credits.json` ja està reparat.
- **Dimensions:** CT i CE sense mesura, CA fora d'abast, CR N/A, i l'IT N/A.

### T3 · Ordre d'implementació en tres onades

**Onada 1a: sense lease, només `src/`.**
1. M09 a `construeixMapa.js`, amb les fonts que ja arriben.
2. Ampliar `metrica()` i `mapaContent.js` amb `pregunta`, `llindar {verd, ambre, sentit}`, `responsable`, `abast`, `versio`, `finestra` i `exclosos`.
3. ~~Reparar `normalitza` per a `ajust`~~: **fet en este torn** (T2 · Reparacions).
4. Pintar `recaigudes-ledger` al costat de M12 (T3J-13).

**Onada 1b: una lease de lectura a `tooling/brain/`** (`fonts-vigilancia.mjs` i `mapa-consola.mjs`):
- font `traca`, amb memòria cau per mtime;
- resum dels torns (dates, rutes, `plan.file`, `ownedPaths`, `verify`), resumits i no crus: pesen uns 13 MB;
- blocs d'ESTAT;
- dates de les lliçons;
- tags de `10_actes`;
- validació per fitxer amb `inspeccionaText`.

Activa M01–M08 i M10–M12, amb l'etiqueta «només arnés Antigravity».

**Onada 2: senyals noves petites:**
- llista tancada d'actors a `obrir_torn.mjs` (lease);
- vocabulari del LEDGER (`infraccio`, `fusible`, `porta-defectuosa`);
- camp «Torn: id · estat · tancament.mjs» a cada ESTAT_ACTUAL;
- id únic i `prova:` a cada lliçó (lease i segellat);
- entrada `check` a l'history del torn;
- `salut-historial.jsonl` (lease);
- registre persistent de `--arxiva`.

**Onada 3: hooks i governança, tot amb lease:**
- `hooks-local.log` amb actor, i `actor` també a la traça d'Antigravity;
- hook Stop de consum, o lectura de les transcripcions de Claude (M13);
- `correccio.mestre` a UserPromptSubmit;
- `mutationPath` a `antigravity-hook.mjs` i una reconciliació de `segella.mjs` que exigisca frontmatter vàlid i actor;
- reendollar el panell de rebuts als `receipts`.

No s'ha de restringir la comprovació d'abast de `turns.mjs` als `ownedPaths`: n'hi hauria prou de no declarar `src/` per a burlar-la (T3J-14).

### T3 · Defectes que impedixen mesurar

40 troballes verificades (15 confirmades i 25 matisades), agrupades i ordenades per severitat.

| Id | Sev. | Fitxer:línia | Què passa | Remei | Lease |
|---|---|---|---|---|---|
| T3I-02 | alta | `CLAUDE.md:8-18`; `cervell.json:3-10` | El REFLEX de correcció només viu a CLAUDE.md, fora de l'arrencada de MarIA i de Codex. Cap correcció registrada des del 260923, ni la recaiguda de l'acta 261001_1920 | Moure'l a AGENTS.md; registrar la recaiguda | Sí |
| T3J-03 + T3I-26 | alta | `turns.mjs:158-159`; `LEDGER.md:22-24` | 5/155 torns tancats. El LEDGER diu «tancats» dos torns que estan en `context_loaded`, i «arxivat» un que continua al disc | Afegir una línia de rectificació al final del LEDGER, sense reescriure res; activar M09 | Sí |
| T3J-05 + T3I-03 | alta | `credits.json:3-5`; `consolaContent.js:74` | `numero()` llançava amb «1702 crèdits» i rebutjava `consola.json` sencer; la «F01» d'`ESTAT.md:12` era un verd fals | **REPARAT en este torn** (T2 · Reparacions): 339/339 i verificat al navegador | No |
| T3I-04 (reescrita) | alta | `antigravity-hook.mjs` (no crida `mutationPath`); `segella.mjs:87,97` | El segell trencat està superat. Continua: el hook d'Antigravity no aplica la política (13 escriptures `allow` a `.agents/skills/`), i la reconciliació no valida ni registra l'actor | `mutationPath` al hook; reconciliació amb `schema.json` vàlid i actor | Sí |
| T3J-02 + T3I-10 | mitjana | `fonts-vigilancia.mjs:9,58-69,306`; `mapa-consola.mjs:309-312` | La closca només passa recomptes | Onada 1b | Sí |
| T3J-06 + T3I-24 | mitjana | `construeixMapa.js:93-106`; `mapaContent.js:117-130` | El contracte no té llindar, abast, període ni historial | Onada 1a; l'historial, a l'onada 2 | Parcial |
| T3J-07 + T3I-09 | mitjana | `construeixMapa.js:730` | La conformitat és N/A fixa, encara que la porta ja la mesura (1/5) | Validació per fitxer a la closca | Sí |
| T3J-01 + T3I-19 | mitjana | `.claude/settings.json:37`; `.codex/hooks.json:26` | Claude i Codex no deixen traça; la d'Antigravity no porta actor ni l'ordre | Traça JSONL a `hooks-local.mjs` | Sí |
| T3J-10 + T3I-11 | mitjana | `obrir_torn.mjs:8` | 21 variants d'actor; `agent-local` per defecte | Llista tancada | Sí |
| T3I-05 + T3J-14 | mitjana | `turns.mjs:157`; `antigravity-hook.log:2359-2696` | 35 escriptures de MarIA a `src/` sense torn `code` amb pla | Obrir un torn `code` amb pla abans d'editar | Sí |
| T3J-09 | mitjana | `LEDGER.md:649,659,667,672`; `fonts-vigilancia.mjs:186-189` | Les entrades amb capçalera ISO no compten | Línia canònica a cada relleu | Sí |
| T3J-12 | mitjana | `wiki-documentacio-i-reflex/SKILL.md:92`; `LEDGER.md:375` | La regla del cognom no es pot complir; avui conviuen un pla incrustat i un pla esquelet | Decisió del Mestre | Sí |
| T3I-22 | mitjana | `porta-olivera.mjs:119-120` | «Hi ha pla» es complix amb un esquelet en `[pendent]` | Exigir contingut | Sí |
| T3I-01 | mitjana | `taxonomia.json:27-28`; `porta-olivera.mjs:62,203` | El catàleg admet `petorreta` i `pla` | Deny explícit, amb prova negativa | Sí |
| T3I-06 + T3J-04 | mitjana | `matrix.mjs:11`; `consola-iaia.mjs:56` | Els rebuts Matrix no tenen escriptor, i el seu successor viu, els `receipts`, no el llig ningú | Reendollar el panell | Sí |
| T3I-07 | mitjana | `journal.ndjson:119`; `consola-iaia.mjs:100` | Diari fòssil; ningú no llig les receptes | Declarar el diari històric i resumir les receptes | Sí |
| T3I-08 | mitjana | `termometre_context.mjs:4`; `preflight_matrix_wrapper.mjs:3,12` | El cridador no està registrat | Endollar-lo o retirar el llindar | Sí |
| T3I-12 | mitjana | `despertar.mjs:62-66,80,110-111` | «ESTAT RANCI» no salta mai amb capçaleres ISO | `dataEstat` de `fonts-vigilancia.mjs` | Sí |
| T3I-13 | mitjana | `verify-ledger.mjs:33-39` | `--sign` signa qualsevol cos; 8 marques HASH fòssils | Encadenar les signatures | Sí |
| T3I-14 + T3J-08 | mitjana | `LEDGER.md:124,371` | 14 lliçons i només 4 línies `correcció`; 4 lliçons anunciades no existixen | Decisió del Mestre | Sí |
| T3I-16 | mitjana | `core-telemetria-huma/SKILL.md:21,29`; `acta.md:64` | Demanen estimacions humanes que la norma prohibix | Decisió del Mestre | Sí |
| T3I-17 | mitjana | `core-automillora/SKILL.md:20` | Declara MarIA «única editora de codi» | Alinear-la amb AGENTS §0.1 | Sí |
| T3I-18 + T3J-11 | mitjana | `tracker_consum.mjs:20`; `.diari_sessio.jsonl:39` | Tres embornals manuals, cap amb `sessio` ni `font` | Un sol `consum.tokens` mesurat | Sí |
| T3I-20 | mitjana | `antigravity-hook.log:3265,3269,3279`; `core-edicio-segura/SKILL.md:21` | MarIA va editar `readme.txt` i el prompt de Codex amb l'auditoria de Codex oberta | Mètrica pendent; opcionalment, ask al hook | Sí |
| T3J-13 | baixa | `construeixMapa.js:698-702` | `recaigudes-ledger` premia el silenci | Pintar-la al costat de M12 | No |
| T3I-15 | baixa | lliçons de wiki-documentacio-i-reflex i core-higiene-escriptori | 3 de les 14 lliçons estan en negatiu | Reescriure-les en positiu | Sí |
| T3I-21 | baixa | `porta-taxonomia.mjs:86-87,94` | T5 només mira el dia | Comparar l'HHMM amb la «Creació» del Registre | Sí |
| T3I-23 | baixa | `ESTAT.md` | 199.775 B, 80 capçaleres i 5 formats de data | Mètrica de pes i un format únic | Sí |
| T3I-25 | baixa | `AGENTS.md:34`; `canonada.mjs:93-95` | `verificaArrel` està morta | Reparar-la i endollar-la | Sí |

**Sense verificació adversària:** `guia-modelo-clausula-informativa.pdf` és al primer nivell de l'Escriptori, ancorat però fora de la taxonomia. Olivera i M07 només compten `.md`, i no el veuen.

### T4 · Abast, marc i reserves

**Açò no és assessorament jurídic.** És una lectura tècnica del codi i dels textos, ordenada segons la guia de l'AEPD. Abans de publicar res, un advocat o un DPD ha de revisar:
- (a) si la LSSI i la DSA s'apliquen a un servei gratuït sense ànim de lucre;
- (b) si Umami necessita consentiment previ (LSSI art. 22.2);
- (c) quin rol té cada amfitrió WordPress (art. 26 RGPD);
- (d) la base per a les persones de 14 a 17 anys;
- (e) l'avaluació de bretxa de T4C-07;
- (f) l'EIPD del bot;
- (g) quines dades del titular s'han de publicar.

**Marc.** «Guía para el cumplimiento del deber de informar» (AEPD, APDCAT i AVPD), que MarIA ha deixat a l'Escriptori: un esborrany «EN REVISIÓN» anterior al 25-05-2018. L'orquestrador l'ha llegida sencera (17 pàgines). En trau:
- el model de dues capes;
- els 6 epígrafs (Responsable, Finalitat, Legitimació, Destinataris, Drets i Procedència);
- la primera capa en forma de taula «Informació bàsica sobre protecció de dades», en el camp de visió del botó d'enviar, amb un «+info» per epígraf;
- Destinataris i Drets, sempre;
- una segona capa completa;
- llenguatge clar, preguntes i respostes, cap casella premarcada.

**Reserves de vigència:**
- La guia cita la LOPD 15/1999; hui és la LOPDGDD 3/2018.
- Cita el «Privacy Shield», anul·lat per Schrems II (STJUE C-311/18, 16-07-2020); hui s'usa l'EU-US Data Privacy Framework (2023) o les clàusules tipus.
- Cita el «Grupo del Artículo 29»; hui és el CEPD.
- No cobrix l'art. 50 del RIA (aplicable des del 2-08-2026), la LSSI (art. 10 i art. 22.2) ni la DSA. Es tracten a «Altres obligacions».

**Abast.** Les conclusions valen per al repositori. Producció (gentdelatorre.net, release 1.0.1) té un esquema diferent (Codex C1): «complit al codi» no vol dir «complit en producció» (T4W-06). `legalContent.js` s'abrevia **LC**. Les dades personals del titular que hi ha a LC:75 no es reproduïxen.

**Fets reverificats entre les 21:10 i les 21:20Z:**
- les cites de `readme.txt` (canviat hui) continuen vàlides;
- el precedent `grant select on public.notes to anon` està revocat des del 20-09 (`2609200300_blindatge_storage_i_contingut.sql:86`);
- la sospita de dades personals a `.agents/pageContent_old.js` queda refutada;
- en WordPress, les fonts són locals per defecte;
- «xifratge extrem a extrem» continua a la interfície (`i18n.js:668`, `1362`, `2054`, `2751` i `3445`).

### T4 · Tractaments al codi (proposta de registre de l'art. 30)

| # | Tractament | Dades | Finalitat | Base plausible | Destinataris i encarregats | Transferències | Conservació al codi | Risc |
|---|---|---|---|---|---|---|---|---|
| 1 | Comptes i autenticació | correu, hash de contrasenya, metadades d'alta (nom, foto, poble, accepta_rgpd), identificador i foto de Google, últim accés, sessions | entrar al servei | 6.1.b | Supabase (Auth); Google com a IdP; Google Workspace per al correu | Supabase Inc. i Google LLC, als EUA [PENDENT: DPF o CCT] | baixa + 30 dies, només si pg_cron corre (T4C-02) | mitjà |
| 2 | Perfil i directori del poble | nom, avatar, bio, lema, pertinença, rol | identitat dins del poble | 6.1.b o 6.1.a [decisió T4B-01] | membres del poble via `membres_del_poble` (500 files per crida) | — | anonimització immediata en demanar la baixa | **alt** (T4B-01, T4C-04) |
| 3 | Publicacions (Mur, Mercat, Esdeveniments) | contingut, autoria, imatges del bucket públic | comunicar al poble | 6.1.b | membres (RLS `is_town_member`); anon pot llistar el bucket (T4C-13) | DeepL, a través de l'amfitrió, si es tradueix (UE) | indefinida; la purga reassigna a l'UUID nul (T4C-19) | mitjà |
| 4 | Notes privades | text, adjunts privats (fins a uns 24 MiB, també PDF), còpies a IndexedDB | bloc de notes personal | 6.1.b | només la persona | — | paperera de 30 dies; els fitxers no es purguen (T4C-01); IndexedDB sense termini | mitjà-alt |
| 5 | Xat | missatges en clar (`versio_xifrat` = 0), marques d'enviat, rebut i llegit, ajustos | missatgeria | 6.1.b | participants, gestores d'entitat, Supabase (Realtime) | — | indefinida; cascada en la baixa (T4C-03); els temporals no s'esborren (T4C-17) | mitjà |
| 6 | Organitzacions i reclamacions | nom, membres, rols, justificació | entitats i grups | 6.1.b / 6.1.f | directori públic sense dades de persones (vista `security_invoker`) | — | cascada amb l'usuari | baix |
| 7 | Consentiment, baixa i incidències | versió, empremta, `ip_hash` amb pebre, user-agent, `subjecte_hash` | demostrar el consentiment i gestionar la baixa | 6.1.c | cap | — | 3 anys bloquejat; la cua de Storage no té termini | mitjà (T4C-12) |
| 8 | Administració | correu, alta i últim accés de tots els comptes | gestió | 6.1.f | superadmin | — | — | baix; no hi ha registre d'accessos |
| 9 | Telemetria Umami | ruta tapada, idioma, pantalla, referent; el servidor veu la IP i l'UA | comptar visites | 6.1.f en opt-out [ADVOCAT] | comptador propi (cap build versionada el configura) o el `window.umami` de l'amfitrió | depén de l'amfitrió | no fixada | baix (T4X-03, T4C-20) |
| 10 | Emmagatzematge al dispositiu | refresh token persistent, preferències, IndexedDB amb notes i esborranys | funcionament | LSSI 22.2 (tècnic) | el dispositiu; en WP, origen compartit amb l'amfitrió (T4W-02) | — | fins que s'esborra | mitjà (T4C-10) |
| 11 | Tercers que carrega el navegador | IP i UA | tipografia, mapa, avatars | cap base declarada (Fonts); 6.1.f (OSM) | Google Fonts (només la build autònoma), OSM, avatars de Google, Facebook i GitHub | EUA | — | mitjà (T4C-09, T4X-11) |
| 12 | Traducció via WordPress | text de la pàgina (pot portar noms), HMAC de la IP durant 10 min | traduir quan es demana | interés legítim o petició, **de l'amfitrió** | amfitrió WP (responsable) i DeepL (encarregat de l'amfitrió) | UE; s'admeten claus Free `:fx` | 7 dies en transients | baix-mitjà (T4C-11) |
| 13 | Bot de WhatsApp (adormit) | número o LID, text, veu, imatges, memòria amb «estat d'ànim» | conversar | dubtosa | Google Gemini i Imagen, fal.ai; Meta com a canal | EUA | 90 dies si corre; còpia sense purga | **alt, latent** (T4C-05, T4C-06, T4B-02) |
| 14 | Repositori i paquets | sessió `.wwebjs_auth` a l'historial (el contingut és hipòtesi); NIF i domicili del titular al bundle | desenvolupament | — | Sollutia (remot upstream), GitHub, gentdelatorre.net | EUA (GitHub) | permanent | **alt** (T4C-07, T4C-16) |

### T4 · Troballes verificades

Severitats finals, després de la verificació. Cap d'estes troballes no toca governança: **cap no necessita lease**.

| Id | Sev. | Evidència | Què passa | Remei · qui |
|---|---|---|---|---|
| T4C-07 | alta (hipòtesi de contingut) | git log (5a5d7023a); `.gitignore:19`; `.git/config:9-10` (remot upstream de Sollutia); `.iaia_auth/` amb permisos 644 | Una sessió de WhatsApp Web a l'historial abastable des d'upstream. El contingut del commit no s'ha obert. `.wwebjs_cache/` no està ignorat | **Hui, el Mestre** tanca tots els dispositius vinculats. Advocat o DPD: avaluació de bretxa. Amb ordre expressa i coordinació amb Sollutia, `filter-repo --path .wwebjs_auth --path .wwebjs_cache` i force push. `chmod` 700/600 a `.iaia_auth/` |
| T4C-01 | alta | `2609261500:914-926` i `1389-1408`; `supabase/README.md:241-244`; no existix `supabase/functions`; LC:99 | La purga posa els fitxers a la cua `private.purga_storage_pendent`, però ningú no la buida. Avatars, imatges i adjunts privats sobreviuen al compte | Codex: Edge Function amb service_role, cridada des de fora, i alarma si hi ha files de més de 7 dies |
| T4B-01 · T4C-04 | alta | `initial_schema:11,750`; `2609261500:817,875-879,893`; `2609291210:22,37,50`; `2609272200:148`; LC:122; `seed.sql` | Qualsevol compte pot unir-se a qualsevol poble obert, també amb el `tenant_id` de les metadades d'alta, i llistar fins a 500 noms amb foto per crida. El filtre de consentiment es va perdre a 2609272200 i cap prova no el vigila | El Mestre decidix el model de pertinença. Codex restaura `consentiment_rgpd_at is not null`, valida el poble a `handle_new_user` i afig una prova. Claude corregix LC:122 i `seed.sql` |
| T4C-10 · T4X-01 · T4X-02 | alta | `main.jsx:31-32`; `runtimePolicy.js:22`; `identitat.js:222-223,317`; `storage.js:21,47`; LC:41, 170-176 i 193; `README.md:141-153`; `oauthRelay.js:349-351` | Per defecte, el refresh token es queda a localStorage, però el text diu que mor amb la pestanya. La llista «completa» no inclou IndexedDB ni almenys 8 claus. El text remet a l'«apartat 21», i és el 20 | El Mestre decidix D1. Claude reescriu el §20 i el §22 a partir del codi. Codex afig la prova de deriva (T4X-21) |
| T4X-05 · T4X-12 · T4X-06 · T4C-18 | mitjana | `OnboardingSteps.jsx:25,53-54,117-118,231-233`; `OnboardingSection.jsx:265,275-276,300-314`; LC:46, 48 i 89-90; `DetallPrivacitat.jsx:193` | (1) La casella de «consentiment» és global i obligatòria, en contra de la base 6.1.b, i no enllaça /legal. (2) L'entrada amb Google no dona cap informació. (3) La pantalla diu «totalment segur», «RGPD Segur», «Perfil privat» i «Llei 05». (4) Promet novetats sense opt-in i no controla els 14 anys. (5) `DetallPrivacitat.jsx:193` diu una cosa falsa sobre el padró | Primera capa (esborrany més avall) i caselles de 14 anys i de novetats. Claude redacta, Codex implementa i l'advocat valida. Cal ordre del Mestre (Llei del Píxel) |
| T4C-02 · T4C-03 · T4X-08 · T4C-19 · T4C-14 | mitjana | `2609261500:995-997,1372-1378,1406-1408,1466-1474`; `xat_v2.sql:27`; `2609271400:130-133`; LC:99 i 102; `DetallPrivacitat.jsx:328` | La purga depén de pg_cron i ningú no ho comprova. La cascada esborra també els missatges propis dels fils d'altres, i LC:102 diu el contrari. Les publicacions es conserven «anònimes» llevant una llista tancada de claus | El Mestre decidix ARQ-J04 i D12. MarIA comprova `cron.job` a producció. Claude reescriu el §10 i el diàleg de baixa |
| T4C-12 · T4X-10 | mitjana | `2609261500:388-395,549-553,834-840`; LC:13; `OnboardingSection.jsx:216`; `DetallPrivacitat.jsx:178` | Els consentiments es registren contra la «v1» del 15-09, sense text ni empremta. La pàgina diu «Versió 2.0» del 9-09 | Codex: fila v2.x amb `text_complet` i `vigent_des_de`. Claude: la data de LC:13 |
| T4C-11 · T4X-07 | mitjana | LC:109-112 i 130-131; cap crida d'IA a src/; `bot/cervell.mjs:23,187-208,334,362-380`; `ConnectarSection.jsx:83,600` | El text declara Google, Anthropic i OpenAI per a la IAIA de l'App, que respon amb un text fix. No declara Gemini, Imagen ni fal.ai del bot. Connectar atribuïx a la IAIA unes etiquetes escrites a mà | Claude separa dos canals al §11 i al §14 i lleva Anthropic i OpenAI. Codex canvia el text a «Etiquetes suggerides» |
| T4C-09 · T4X-04 | mitjana | `index.html:10-12`; LC:189 | La build autònoma carrega Noto Sans des de Google abans de cap interacció. En WP no passa (T4W-03) | Codex servix les fonts en local, o es declaren |
| T4X-11 | mitjana | `sanitize.js:14-19,37-46,110-120`; LC:79 i 190 | Els orígens permesos per als avatars també valen per a les imatges del contingut: una imatge pot fer de balisa de rastreig. Google aporta el nom i la foto, no només l'identificador | Codex separa les dues llistes. Claude corregix el §8 i el §21 |
| T4X-03 · T4C-20 | mitjana / baixa | `telemetria.js:57-66,73,147-151,160-167`; LC:166; `readme.txt:75` | Umami no apareix al text normatiu. Hi ha reenviament al `window.umami` de l'amfitrió | Declarar-ho abans d'activar-lo, amb la ponderació escrita o amb opt-in [ADVOCAT] |
| T4C-13 | mitjana | `2609130500_bucket_mitjans.sql:16-18` | anon pot llistar tot el bucket públic `mitjans`: l'UUID i els fitxers de cada persona | Codex: política `to authenticated` limitada a la carpeta pròpia, amb prova (la llista anònima ha de tornar 0) |
| T4X-13 | mitjana | `2609282100_xat_de_pagina.sql:61-68`; LC:49 | No hi ha denúncia, moderació, punt de contacte ni motivació de les decisions (DSA arts. 11-12, 14, 16 i 17) | Canal de l'art. 16 i ampliar el §3 [ADVOCAT: aplicabilitat] |
| T4C-05 · T4B-02 · T4C-06 · T4C-08 | mitjana (latent) | `episodica.mjs:2,39,73,99,117`; `cervell.mjs:88-90,121-147,169-185,279-306,362-380`; `whatsapp_baileys.mjs:3,15,39-40,201`; `immunite.mjs:1` | El bot no arrenca. Si arrencara:<br>• memòria amagada amb «estat d'ànim aparent»;<br>• SHA-256 sense sal;<br>• `forgetMemory` que ningú no crida;<br>• cap avís d'IA;<br>• Baileys, que no és una API oficial;<br>• veu i imatges enviades a Google i a fal.ai;<br>• una còpia fora de la purga | No reactivar-lo sense decisió del Mestre, avís d'IA i EIPD |
| T4C-16 · T4X-09 | mitjana | LC:25, 28-29, 53 i 75; `LICENSE:3`; 1 NIF a `wordpress-plugin/dist/soc-de-poble.standalone.js` | El §1 diu que les dades estan «protegides» i el §7 les publica. Viatgen al bundle que servix gentdelatorre.net. LICENSE nomena un altre titular | El Mestre, amb advocat, tria el titular i escriu les dades una sola vegada |
| T4X-21 | mitjana | LC:2, 43 i 159 | La telemetria (24-09), la sessió persistent (26-09) i l'autodesament (28-09) no consten al text. Cap prova no lliga el codi amb el text | Codex: prova Vitest a `src/sections/text/`. Publicar una versió nova de la política |
| T4B-03 | mitjana | rg sense resultats | Al repositori no hi ha ni registre de l'art. 30 ni EIPD | Preguntar si existixen fora. La taula de tractaments és la base del registre |
| T4C-15 | baixa | `2609261500:963,1064-1065,1075` | L'exportació no inclou les columnes noves del xat ni del consentiment | `to_jsonb` filtrat i una prova |
| T4C-17 | baixa | `2609270200:56-60,259-260` | Els missatges temporals només s'amaguen | Purga real abans d'obrir la funció |
| T4X-14 | baixa | `telemetria.js:18-24`; `pageContent.js:162`; `readme.txt:50` | El text no explica el paper de la web amfitriona | Apartat «Si uses Sóc de Poble dins d'una altra web» [ADVOCAT, art. 26] |
| T4X-15 | baixa (hipòtesi) | LC:100-101 i 117 | Ni Frankfurt, ni les còpies de 30 dies, ni els registres de 12 mesos es poden verificar al repositori | Comprovar-ho al tauler de Supabase |
| T4X-16 | baixa | LC:150; `DetallPrivacitat.jsx:17-20,363-364` | El text no esmenta les eines per a exercir els drets | Afegir-les al §16 |
| T4X-17 | baixa | `XatControlSection.jsx:39`; `i18n.js:668` i altres | S'anuncia el xifratge E2E sense que existisca | Llevar l'expressió (ordre del Mestre) |
| T4X-18 | baixa | `pageContent.js:43` | «sense cedir les dades a corporacions estrangeres» | Reformular-ho |
| T4X-19 | baixa (hipòtesi) | `CapcaleraConversa.jsx:92`; `Bombolla.jsx:58` | Falta una declaració general sobre el contingut fet amb IA | Una frase general |
| T4X-20 | baixa | LC:53-58; `LICENSE:5-7` | La pàgina diu CC BY-NC-SA i el repositori, AGPL | Separar les llicències al §4 |
| T4B-04 | baixa | `pageContent.js:126`; `seed.sql` | El full de ruta promet memòria «inesborrable», funcions de salut i d'emergència | Nota «idees en estudi» i avís del 112 |
| T4B-05 | baixa | `TraduccioPagina.jsx:18`; `i18n.js:6-12` | El text legal només existix en valencià | Versió en castellà i clàusula de versió que preval |

**Sense veredicte (T4-referència, no comptades):**
- T4R-01, 02, 04, 05 i 08 coincidixen amb troballes verificades.
- T4R-03: l'operador i Supabase poden llegir el xat (`versio_xifrat` = 0, `2609270200:154`).
- T4R-06: l'inici de sessió per telèfon no existix.
- T4R-07: la política es fusiona amb les condicions (LC:46).

### T4 · Canal WordPress i accés anònim (buit 6 del crític)

Observat al disc entre les 21:10 i les 21:20Z. **Estes set troballes no han passat cap verificació adversària independent.**

| Id | Sev. | Evidència | Què passa | Remei · qui · lease |
|---|---|---|---|---|
| T4W-01 | mitjana | 0 resultats de `wp_add_privacy_policy_content`, `wp_privacy_personal_data_exporters` i `_erasers` a `wordpress-plugin`; `traduccio.php:231-240,293`; `readme.txt:67` | L'amfitrió no rep cap text suggerit per a la seua política. El connector desa al WP traduccions durant 7 dies, que poden contindre dades personals | Codex crida `wp_add_privacy_policy_content` a `admin_init` amb un text de Claude. Sense lease |
| T4W-02 | mitjana | `runtimePolicy.js:22`; `host.js:242`; `marcatge.php:96-125`; `readme.txt:46-75` | En WP, el refresh token persistent i la IndexedDB es desen a l'origen de l'amfitrió, que compartixen tots els seus scripts. El readme no ho diu | El Mestre decidix D1 per a l'encastat. Codex posa «pestanya» per defecte o l'opció als Ajustos. Claude escriu la secció del readme. Sense lease |
| T4W-03 | baixa | `PedraSecaEmbed.jsx:348,369-374`; `marcatge.php:238-239` | Per defecte, les fonts són locals. Google Fonts i Bunny només entren si l'amfitrió sobreescriu `fonts-href`, i el readme no ho avisa | Una línia a «External services», o llevar Google de la llista permesa. Sense lease |
| T4W-04 | mitjana | `.agents/rules/supabase_grants.md:9-17`; `tractor-rls.mjs:200-239` | La regla obliga a fer `GRANT SELECT ... TO anon` a cada taula nova, sense exigir RLS ni política per a anon. La porta R5 accepta qualsevol política i no mira el rol. Hui les 16 taules públiques versionades tenen RLS | Per defecte, cap grant a anon; R5 comprova el rol. **Lease** |
| T4W-05 | baixa | `.agents/pageContent_old.js` (versionat, 106.299 B); `crear_bundle.mjs:78-105,197-198,223-229` | Entra a tots els perfils de bundle del Consell. No conté dades personals, però és una còpia rància que viatja a IAs externes | Arxivar-lo o afegir-lo a `FITXERS_PROHIBITS`. **Lease** |
| T4W-06 | mitjana (hipòtesi) | Codex 261001_2100:53-73 i 206; `2609261200_publicacions_autoria.sql:23-24`; `backendConfig.js:10-15` | A producció falta una columna del 26-09: no es pot donar per aplicada la F1 (exportació, baixa, consentiment, purga) ni les fronteres d'anon. El navegador consulta Supabase directament i la RLS és l'única barrera | MarIA i el Mestre: llista de migracions aplicades, `cron.job` i bateria RLS en canari amb dos tenants i dos usuaris, abans d'obrir comptes reals |
| T4W-07 | baixa (preventiva) | `public/sitemap.xml` (7 rutes estàtiques); `robots.txt`; Codex C8 | Hui el sitemap no publica dades. El generador SEO previst llig els seeds, i el canònic pot anunciar un altre domini | Descriptor compartit; només recursos públics del tenant; `noindex` a les rutes privades, que no és control d'accés; mai credencials ni retorns OAuth al canònic ni al sitemap |

### T4 · Matriu del deure d'informar (guia AEPD)

| Epígraf · subelement | Estat | Evidència | Esmena |
|---|---|---|---|
| 1a capa · taula en el camp de visió del botó | absent | `OnboardingSteps.jsx:231-233` (casella sense enllaç); `OnboardingSection.jsx:300-314` (Google sense informació) | Taula «Informació bàsica…» damunt del botó de crear el compte i del de Google |
| 1a capa · enllaç «+info» | absent | L'onboarding no té cap enllaç a /legal | Enllaç a `/legal#privacitat` |
| 1a capa · Responsable, Finalitat, Drets | absent | — | Files de la taula |
| 1a capa · Legitimació | contradit pel codi | Casella de consentiment obligatòria (`OnboardingSteps.jsx:53-54`) davant de la base 6.1.b (LC:89) | Contracte; el consentiment, només per al que és opcional |
| 1a capa · Destinataris (sempre) | absent | — | Fila encara que no hi haja cessions |
| 1a capa · Procedència | absent; s'aplica a l'entrada amb Google | `2609261500:807-809,870-872` | Fila «Procedència» |
| Responsable · identitat i adreça | contradit | LC:28-29 (marcadors) davant de LC:75; `LICENSE:3` | Una sola vegada (T4X-09) |
| Responsable · correu | complit | LC:32 | Un correu de privacitat propi |
| Responsable · DPD | complit | LC:34 explica per què no n'hi ha | Revalorar-ho si es reactiva el bot |
| Finalitat · detall | parcial | LC:89-92 sense categories; ni la telemetria ni el bot hi apareixen | Taula finalitat–dades–base–termini |
| Finalitat · terminis o criteris | contradit | LC:99 davant de T4C-01; LC:102 davant de `xat_v2.sql:27`. Falten la paperera (30 d), el consentiment (3 anys), els transients (7 d) i el bot (90 d) | Taula de terminis |
| Finalitat · decisions automatitzades i perfils | complit a l'App; contradit al bot | LC:136; `episodica.mjs:117` | Llevar l'«estat d'ànim» o declarar el perfil i la lògica |
| Legitimació · base per finalitat | parcial | LC:89-92 | Taula |
| Legitimació · norma amb rang de llei | parcial | Bloqueig de 3 anys sense citar la norma | Citar l'art. 32 de la LOPDGDD |
| Legitimació · interés legítim i ponderació | parcial | LC:91 la oferix si es demana, però no està escrita | Ponderació escrita de la seguretat i de la telemetria |
| Legitimació · consentiment no condicionat ni premarcat | contradit | No està premarcada (`rgpd: false`), però és obligatòria | Clàusula informativa i caselles opcionals separades |
| Legitimació · obligació de facilitar les dades | parcial | LC:89 «Sense aquestes dades no hi ha servei» | Dir quines són obligatòries |
| Destinataris · encarregats | contradit | LC:109-112: Anthropic i OpenAI sense codi; falten Google Fonts, Umami, Gemini, Imagen i fal.ai | Taula nominal |
| Destinataris · qui ho veu dins del poble | contradit | LC:122 «membres verificats» davant de T4B-01 | La definició real de membre |
| Destinataris · transferències i garanties | parcial | LC:117 és genèric; LC:131 parla d'«aquest proveïdor», en singular | DPF o CCT per proveïdor |
| Drets · catàleg dels arts. 15-22 | complit | LC:141-149 | — |
| Drets · com s'exercixen | parcial | LC:150 només el correu; les eines de `DetallPrivacitat.jsx` depenen d'una capacitat | Esmentar les eines (T4X-16) |
| Drets · retirar el consentiment | complit | LC:148 | — |
| Drets · reclamació a l'autoritat | complit | LC:152 | — |
| Procedència · font i categories | parcial | LC:79 només l'identificador, però s'importen el nom i la foto | §8: nom, foto i correu |
| Forma · llenguatge clar | complit a /legal | LC:16-17 | Mantindre'l |
| Forma · pràctiques que s'han d'evitar | contradit | «Perfil privat», «RGPD Segur», «totalment segur», «Llei 05»; E2E | T4X-12, T4X-17 |
| Forma · capes al canal WhatsApp | absent | El bot no envia cap missatge informatiu | Primer missatge fix |

### T4 · Altres obligacions

- **LSSI-CE art. 10 (avís legal): contradit.** LC:28-29 diu una cosa i LC:75 una altra; `LICENSE:3` nomena un altre titular. El NIF viatja a `wordpress-plugin/dist/soc-de-poble.standalone.js`, que és el bundle que servix gentdelatorre.net (mateix SHA segons Codex C1). L'aplicabilitat a un servei gratuït l'ha de dir l'advocat.
- **LSSI-CE art. 22.2 (galetes i emmagatzematge).** No hi ha galetes (LC:166). L'emmagatzematge és tècnic, però la llista que es presenta com a «completa» no ho és. Umami llig l'idioma i la mida de pantalla: si l'exempció cobrix eixa analítica és discutible [ADVOCAT]. En WP, l'emmagatzematge viu a l'origen de l'amfitrió.
- **LSSI-CE art. 21 (comunicacions comercials): absent.** `OnboardingSection.jsx:276` promet novetats sense cap opt-in.
- **RIA art. 50:**
  - 50.1 a l'App: complit (`CapcaleraConversa.jsx:92`, `Bombolla.jsx:58`).
  - 50.1 al bot: absent.
  - Risc invers: `ConnectarSection.jsx:600` presenta com a suggeriments de la IAIA unes etiquetes fixes.
  - 50.2 i 50.4: no hi ha cap declaració. El bot genera imatges.
  - Aplicable des del 2-08-2026. Que l'Òmnibus Digital no n'haja ajornat cap part és una hipòtesi per confirmar.
- **DSA (Reglament 2022/2065).** Absents els arts. 11-12, 14, 16 i 17. L'art. 19 només eximix les micro i petites empreses dels arts. 20-28 [ADVOCAT].
- **Menors (LOPDGDD art. 7).** Els 14 anys es declaren a LC:48, però no es controlen. Proposta: casella d'autodeclaració, també en l'entrada amb Google; un procediment amb la pàtria potestat; la base per als 14-17 anys [ADVOCAT].
- **RGPD arts. 30 i 35.** No consten al repositori.
- **WordPress (`socdepoble-enxufe`).**
  - **Està bé:**
    - «External services» llista el backend, el relé d'entrada, Google Sign-In, OSM, els avatars, DeepL i el canal d'actualització;
    - DeepL només rep text quan el visitant ho demana, des del servidor, i la clau no ix d'allí;
    - el readme avisa que els transients poden contindre dades personals, i la desinstal·lació els esborra;
    - el marcatge no publica cap clau.
  - **Falta:**
    - T4W-01, T4W-02 i T4W-03;
    - `readme.txt:50` enllaça socdepoble.org i no /legal;
    - les claus Free `:fx` s'haurien de rebutjar en producció [hipòtesi sobre les condicions de DeepL].

### T4 · Comparativa amb missatgeries

**Font.** L'agent T4-referència ho va contrastar en viu el 01-10-2026 amb el navegador integrat: WhatsApp (política i condicions de l'EEE), Signal, Telegram (/privacy/eu) i Element/Matrix.org. La normativa citada fora de la guia és de memòria i va marcada.

| Pràctica | Referència | Què hauria d'adoptar Sóc de Poble |
|---|---|---|
| Dir què veu i què no veu el proveïdor | WhatsApp i Signal xifren d'extrem a extrem, i WhatsApp enumera el que no va xifrat; Telegram separa els xats al núvol dels secrets; Element no pot llegir les sales xifrades | Dir clarament que el xat no és E2E i que l'operador i Supabase hi poden accedir tècnicament [PENDENT: quan, qui i amb quin registre]. Llevar «xifratge extrem a extrem» |
| Base jurídica per finalitat | WhatsApp, en taules per base. Telegram ho basa tot en l'interés legítim (contraexemple) | Taula finalitat–dades–base–termini |
| Encarregats amb funció i país | WhatsApp, per tipus i país; Element els nomena (AWS, Cloudflare, Stripe, Sentry, Twilio) | Taula nominal amb país i mecanisme |
| Transferències per destinació | WhatsApp indica per país si hi ha adequació, el marc UE-EUA o CCT | DPF o CCT per a Supabase i Google, i per a Gemini i fal.ai si el bot torna |
| Terminis concrets | WhatsApp: no lliurats, 30 dies. Telegram: metadades antispam, 12 mesos. Element: IP, 30 o 180 dies; analítica, 28 dies | Taula de terminis i política de comptes inactius |
| Analítica | Element: Matomo propi amb opt-in, 28 dies i després agregat | Umami propi amb opt-in o amb la ponderació escrita |
| Peticions d'autoritats | Signal publica peticions i respostes; Telegram, informe trimestral | Política breu i recompte anual |
| Canvis | WhatsApp avisa 30 dies abans; Telegram manté un registre datat. A Signal i Element, seguir usant el servei val com a acceptació (contraexemple a la UE) | Historial amb text arxivat i empremta, i preavís |
| Condicions separades | WhatsApp registra l'acceptació de les condicions; la política només informa | Separar condicions (s'accepten i es registren) i política (informa). Hui LC:46 diu «acceptes aquest text sencer» |
| Menors | WhatsApp: 13 anys o el mínim del país; Signal: 13; Element: 18 | 14 anys (LOPDGDD art. 7), amb casella |
| Federació i ponts | Matrix.org avisa que no pot garantir l'esborrat fora del seu servidor | Avís per al bot i per al «Pont WhatsApp» |
| Emergències | WhatsApp i Signal ho ressalten | «Sóc de Poble no substituïx el 112» |
| Primera capa en taula | Cap dels cinc en té; és un requisit espanyol | Sóc de Poble els pot superar en això |

### T4 · Riscos principals

1. **Sessió de WhatsApp a l'historial de git** (T4C-07). Tancar els dispositius vinculats, avaluar la bretxa i, després, `filter-repo` coordinat amb Sollutia. **Qui:** el Mestre, hui; l'advocat o el DPD; MarIA o Codex, amb ordre.
2. **Producció sense contrastar amb el repositori** (T4W-06). Llista de migracions aplicades, `cron.job` i bateria RLS en canari abans d'obrir comptes reals. **Qui:** MarIA i el Mestre.
3. **Padró obert a qualsevol compte** (T4B-01, T4C-04). Triar el model de pertinença; restaurar el filtre de consentiment i validar el poble a l'alta; corregir LC:122. **Qui:** el Mestre decidix, Codex implementa i Claude corregix els textos.
4. **Supressió incompleta** (T4C-01, T4C-02, T4C-03, T4X-08, T4C-19, T4C-14). Buidador de Storage, decisions ARQ-J04 i D12, i reescriure el §10. **Qui:** Codex, el Mestre i Claude.
5. **Punt de recollida sense primera capa** (T4X-05, T4X-12, T4X-06, T4C-18, T4C-12). La taula, les caselles i la fila v2.x, amb ordre segons la Llei del Píxel. **Qui:** Claude, Codex, l'advocat i el Mestre.
6. **Sessió persistent no declarada i origen compartit en WP** (T4C-10, T4X-01, T4X-02, T4W-02). Decidir D1; reescriure el §20, el §22 i el readme; prova de deriva.
7. **Encarregats i tercers inexactes** (T4C-11, T4X-07, T4X-11, T4C-09, T4X-04, T4X-03, T4W-01). Dades i contractes d'encarregat; refer el §11, el §12 i el §21; fonts locals; separar les llistes del sanejador.
8. **Bot de WhatsApp** (T4C-05, T4C-06, T4C-08, T4B-02). No reactivar-lo. Si es reactiva, primer:
   - missatge inicial d'IA i de privacitat;
   - «oblida'm» connectat;
   - opt-in;
   - HMAC amb sal;
   - API oficial;
   - EIPD.
9. **Accés anònim** (T4C-13, T4W-04). Nova política del bucket `mitjans`; regla de grants i porta R5 (aquesta part, amb **lease**).
10. **Moderació i condicions d'ús** (T4X-13, T4B-04). Aplicabilitat de la DSA, condicions, canal de l'art. 16 i un RPC de denúncia.

### T4 · Esborrany de primera capa

**Informació bàsica sobre protecció de dades**

| Epígraf | Informació |
|---|---|
| **Responsable** | [PENDENT: titular, persona física o entitat (T4X-09)]. Contacte de privacitat: [PENDENT: correu propi; hui, el de LC:32]. |
| **Finalitat** | Crear i mantindre el teu compte, que la gent del teu poble et trobe i et puga escriure, publicar, xatejar, guardar les teues notes i mantindre el servei segur. No fem publicitat ni perfils comercials. [PENDENT: «comptar visites», si s'activa Umami]. |
| **Legitimació** | Les Condicions d'ús que acceptes en registrar-te (art. 6.1.b RGPD). La seguretat del servei, pel nostre interés legítim (art. 6.1.f). Les novetats per correu, només si les demanes (art. 6.1.a). [PENDENT: base del directori del poble, T4B-01]. |
| **Destinataris** | La gent del teu poble veu el teu nom i la teua foto [PENDENT: qui és «gent del poble»]. Ens ajuden a prestar el servei, per encàrrec nostre: Supabase (base de dades i accés) [PENDENT: regió], Sollutia (allotjament) [PENDENT: rol] i Google (correu i, si el tries, l'accés amb Google). No venem ni cedim les teues dades. Fora de l'Espai Econòmic Europeu: [PENDENT: proveïdors i garantia, DPF o CCT]. |
| **Drets** | Pots accedir a les teues dades, rectificar-les, suprimir-les i portar-les a un altre servei, i també limitar-ne l'ús, oposar-t'hi i retirar el consentiment. Ho pots fer des de *Perfil → Privacitat i dades* o per correu. També pots reclamar davant l'AEPD. |
| **Procedència** | Només si entres amb Google: Google ens passa el teu nom, la teua foto i el teu correu [PENDENT: camps exactes]. |
| **Informació addicional** | Tot el detall, en llenguatge planer: [+info → /legal#privacitat] |

Davall de la taula, en el camp de visió del botó:
- [ ] Tinc 14 anys o més. *(obligatòria)*
- [ ] Vull rebre per correu les novetats de Sóc de Poble. *(opcional, sense marcar)*
- [Crear el compte] · En crear-lo acceptes les [Condicions d'ús].

Notes:
- La casella «Consent el tractament… (RGPD Llei 05)» desapareix: informar no és demanar consentiment.
- La mateixa taula va damunt del botó de Google i al començament de /legal.
- Si es reactiva el bot, la primera capa és el seu primer missatge.
- Cada amfitrió WP afig la seua pròpia capa per a la traducció i l'analítica.
- Canvia text visible: cal ordre del Mestre (Llei del Píxel).

### T4 · Índex proposat de la segona capa, de l'avís legal i de l'avís d'IA

**Segona capa (política de privacitat).** Seguix els epígrafs de l'AEPD:
1. **Responsable:** identitat, adreça, correu de privacitat i DPD (o per què no n'hi ha).
2. **Finalitats:** taula finalitat–dades–base–termini; decisions automatitzades i perfils (a l'App no n'hi ha; el bot).
3. **Legitimació:** base per finalitat; ponderació de l'interés legítim; consentiments opcionals i com retirar-los; dades obligatòries; LOPDGDD art. 32 per al bloqueig.
4. **Destinataris:** qui veu què dins del poble; missatges (no són E2E, i qui hi pot accedir); taula nominal d'encarregats; tercers del navegador; transferències per proveïdor.
5. **Terminis:** compte, comptes inactius, baixa (30 d), paperera (30 d), fitxers, consentiment (3 anys), còpies, registres, missatges, transients (7 d).
6. **Què passa quan et dones de baixa** (ARQ-J04 i D12).
7. **Drets:** eines de l'App, correu, termini de resposta i AEPD.
8. **Procedència:** Google Sign-In i mencions d'altres veïns.
9. **Al teu dispositiu:** taula per capes, generada a partir del codi i vigilada per una prova.
10. **Menors.**
11. **Seguretat:** bretxes i canal de vulnerabilitats.
12. **Peticions d'autoritats.**
13. **Si uses Sóc de Poble dins d'una altra web** (art. 26) [ADVOCAT].
14. **Canvis:** historial amb text arxivat i empremta, i versió que preval.

**Avís legal (LSSI art. 10):**
1. Titular: nom o entitat, NIF, domicili o adreça per a notificacions, correu, registre i autoritzacions.
2. Objecte i gratuïtat.
3. Propietat intel·lectual: codi en AGPL-3.0 amb enllaç al repositori; continguts en CC BY-NC-SA 4.0; marca reservada. El titular ha de coincidir amb LICENSE.
4. Responsabilitat: Mercat entre veïns.
5. Enllaços.
6. Llei aplicable i jurisdicció, amb el fur del consumidor [ADVOCAT].

**Condicions d'ús** (document a banda, que s'accepta i es registra):
- servei i avís del 112;
- registre i edat;
- ús acceptable;
- moderació, denúncia, motivació i recurs (DSA arts. 14, 16 i 17);
- contingut i llicència;
- Mercat;
- suspensió i baixa;
- canvis amb preavís;
- fi del servei;
- llei aplicable;
- punt de contacte de la DSA.

**Avís d'IA (RIA art. 50):**
1. **On hi ha IA:** cada missatge de la IA porta l'etiqueta «IA».
2. **La IAIA a l'App:** en proves; respon amb un text fix i no envia res a cap proveïdor.
3. **La IAIA a WhatsApp, si es reactiva:** proveïdor i país, què rep, memòria només amb opt-in, «IAIA, oblida'm» i un primer missatge fix generat pel codi.
4. **Contingut generat amb IA:** il·lustracions, amb el peu «Imatge generada amb IA».
5. **El que no fa:** no llig el Mur, les notes ni els xats, i no pren decisions sobre tu.
6. **Límits i responsabilitat:** es pot reutilitzar LC:65-67.

### T4 · Dades que ha d'aportar el Mestre

1. **Titular:** persona física, Associació El Rentonar o una entitat nova, alineat amb LICENSE i amb la reserva de marca.
2. **NIF i domicili:** si es publiquen, i on [ADVOCAT].
3. **Correus:** de privacitat, de seguretat i de punt de contacte de la DSA.
4. **DPD:** confirmar que no se'n designa, o designar-ne si es reactiva el bot.
5. **Encarregats.** Per a cadascun: entitat, contracte de l'art. 28 (sí o no, i data), país i garantia.
   - Supabase (regió, pla, còpies, retenció de registres);
   - Sollutia (rol);
   - Google Workspace i Google Sign-In;
   - allotjament de socdepoble.org i d'auth.socdepoble.org;
   - Umami;
   - DeepL de cada WP (Pro o Free);
   - GitHub;
   - Gemini, Imagen, fal.ai i Meta, si torna el bot.
6. **Responsable de gentdelatorre.net** i la seua política de privacitat.
7. **Terminis:** registres, còpies, comptes inactius, missatges temporals, Umami i memòria del bot. També cal confirmar els que ja fixa el codi: 30 dies de baixa, 30 de paperera, 3 anys de bloqueig i 7 dies de transients.
8. **Decisions:**
   - D1, també per a l'encastat;
   - ARQ-J04 i D12;
   - model de pertinença;
   - mecanisme d'edat;
   - reactivació del bot;
   - llengües del text legal;
   - jurisdicció.
9. **Data de vigència** de la versió nova, posterior al 15-09-2026.
10. **Fora del repositori:** si existixen el registre de l'art. 30 i l'EIPD, i l'autorització per a comprovar les migracions i la RLS en producció.

### Creuament amb l'auditoria de Codex (Olivera)

He llegit sencera `261001_2100_auditoria_codex.md`, les versions 1.0.0 i 1.1.0.

| Codex | Relació amb esta auditoria |
|---|---|
| C1: el 400 de producció ve de `section_submissions.updated_at` absent a l'esquema remot | **Coincidim, i ho ampliem.** Localhost corre en mode llavor, així que el «0 errors» de T2 no cobrix la capa de dades. A més, `useScopedResource` guarda l'error en l'estat i no el trau per `console.error`: ni una passada remota el vorien a la consola (hipòtesi, T2). Per a T4 (T4W-06): si falta una columna del 26-09, no es pot donar per aplicada la F1 (baixa, exportació, registre de consentiment, purga) ni les fronteres d'anon. |
| C2: el tenant `"undefined"`, `"null"` o un slug passava sense validar | **Aplicat per un altre carril a les 19:38Z.** Funciona, però ha deixat 50 roges a `src/data` (fixtures «poble», «T», «poble-a») i un throw sense captura a la frontera. Proposta: fixtures UUID compartits, com ja s'ha fet a `src/config`, i capturar l'error a `main.jsx`/`host.js`/`PedraSecaEmbed.jsx` amb un estat neutral, que és el criteri del mateix C2. |
| C3: WordPress no injecta el tenant en runtime | Fora d'abast. Hi ha canvis en curs a `ajustos.php` i `marcatge.php`. |
| C4, C5, C7: Sollutia, release i rutes | Fora d'abast. Per a C5 i per al pas de desplegament de MarIA: amb el `readme.txt` traduït, l'empaquetador va fallar (10/14) entre les 19:26 i les 21:20Z. A les 21:58Z torna a passar (47/47 amb enxufe-plugin i enxufe-pantalla). |
| C6: prova del README | **Superada (17/17).** Va tindre un cost temporal: entre les 19:26 i les 21:28Z va trencar `enxufe-plugin` (:247, més de 16 KB; :384, faltava «Update channel (»). El carril concurrent ho ha adaptat i a les 21:58Z dona 47/47. |
| C8: SEO desconnectat del plugin | Ho incorporem a T4 (T4W-07). Hui el sitemap no publica dades; el generador previst llig els seeds. `noindex` no és control d'accés. |
| Tancament: el segell divergent bloqueja `executor-mutacio.mjs:42` | **Superat a les 19:37Z.** Ara el segell previ és vàlid i l'executor pot córrer amb una lease. El problema que queda és que la reconciliació no valida ni registra l'actor (T1, G/T1F-02). |
| Fronteres (`2100:203-206`): navegador → Supabase directe; RLS no comprovada en producció; la clau DeepL es queda al servidor i la traducció de WP és una altra frontera | Incorporat a T4: tractaments 1, 3 i 12, T4W-06 i la matriu de destinataris. Que DeepL siga encarregat de l'amfitrió és interpretació d'esta auditoria, a partir de `readme.txt` i `traduccio.php` (T4, tractament 12), no de Codex. |
| Millores de `prompt_local` | Les fusionem amb les nostres a la secció següent. |

No hi ha cap contradicció tècnica entre els dos informes. La diferència d'abast és explícita: Codex mira producció i WordPress; esta auditoria, el Brain, localhost i la privacitat del repositori.

### Retroalimentació de la plantilla `prompt_local`

1. **«Escriptori net» vol dir porta Olivera en verd, no buit** (T1C-26). La casella del Preflight (`prompt_local.md:27`) diu «només ha de contindre els arxius de la sessió actual», en contra d'AGENTS §0.1. A més, les caselles es marquen a mà. Proposta: «`node tooling/gates/porta-olivera.mjs --informe` ix amb 0», i que la porta ho comprove.
2. **El Pla incrustat i el Pla document divergixen** (T1C-14, T3J-12). Hui hi ha tres còpies: el pla 2050 (esquelet), l'incrustat al prompt de Claude i l'incrustat, ampliat, al de Codex. La regla del cognom no es pot complir quan dos prompts compartixen pla. Proposta, que ha de decidir el Mestre: un sol Pla document vinculat amb `document.mjs plan`, i que el prompt només l'enllace. La porta Olivera hauria d'exigir que «Canvis proposats» no estiga en `[pendent]` (T2P-06).
3. **El Registre naix amb `Model IA` i `Tokens consumits` en `[pendent]`.** Això fa 8 dels 14 errors de `porta-documents`. Els altres 6 són seccions pendents dels plans 2050 i 2110. Proposta: admetre «N/D: comptador fiable no disponible» com a valor vàlid, com ja fa Codex, i que el `create` el pose per defecte.
4. **El Context Tècnic demana llegir `taxonomia_documental.md` sense ruta.** Cal posar-hi la ruta completa.
5. **La plantilla no diu quines eines té cada agent** (el hook de Claude veta `tancament`, `despertar`, `WebSearch` i `WebFetch`). Proposta: una línia «Eines vetades al receptor i substitut» (per exemple, el navegador MCP per a la recerca web).
6. **Les de Codex, que compartim:**
   - validar mecànicament el pla incrustat;
   - separar «auditoria o proposta» d'«implementació»;
   - demanar URL i cos d'error exactes, i l'empremta de l'artefacte;
   - declarar un manifest de context actiu.

### Pendents del Mestre (decisions humanes, en ordre de prioritat)

Corresponen a `requires_human_decision: true` del contracte d'informe. El detall és a cada secció.

1. **Hui mateix:** WhatsApp → Dispositius vinculats → tancar totes les sessions (T4C-07). Després, amb Sollutia i un advocat o DPD, decidir l'avaluació de bretxa i el `filter-repo`.
2. **Abans d'obrir comptes reals:** autoritzar que MarIA comprove a producció les migracions aplicades i `cron.job`, i una bateria RLS en canari amb dos tenants i dos usuaris (T4W-06, Codex C5).
3. **Lease `governance-write` per a les 5 skills:**
   - aprovar els 5 blocs YAML;
   - aplicar-los per l'executor (Ruta B);
   - `skills:index`;
   - 5 symlinks;
   - versionar `SKILLS_SEAL.json` amb les transaccions (T2).

   Abans, decidir què es fa amb `core-empaquetat-wp`, que mana escriure a `01_produccio` i fer `rm -rf` (T1A-03).
4. **Revisar la reconciliació `3815d3de`** (qui la va fer) i exigir lease, actor i frontmatter vàlid a `segella --update` (T1, G/T1F-02).
5. **Tancar el hook d'Antigravity** per a les zones de governança, amb `mutationPath`, `ask` i `knownRead`. El fitxer és autoprotegit (G/T1F-01, T2C-01).
6. **Llengua del `readme.txt` del plugin.** El carril concurrent l'ha deixat en valencià i ha adaptat l'empaquetador i les proves: 47/47 a les 21:58Z. Falta que el Mestre ratifique la decisió (T2F-08).
7. **Que MarIA o Codex tanquen el C2:** 50 roges a `src/data` i un throw sense captura a la frontera.
8. **Model de pertinença al poble i base del directori** (T4B-01). Decidir també D1 (sessió persistent o de pestanya, també a l'encastat), ARQ-J04 i D12 (baixa).
9. **Titular, NIF i domicili per a l'avís legal i la política**, amb advocat. Dades dels encarregats i de les seues garanties de transferència.
10. **Ordre per als canvis de text visible (Llei del Píxel):**
    - primera capa a l'alta;
    - llevar «RGPD Segur», «totalment segur», «Llei 05» i «xifratge extrem a extrem»;
    - corregir «membres verificats».
11. **Llindars de M01–M14** abans de la primera lectura oficial (`index_trellat.md:50`). Vocabulari del LEDGER (`infraccio`, `fusible`, `porta-defectuosa`) i llista tancada d'actors.
12. **Moure el REFLEX DE CORRECCIÓ a AGENTS.md**, perquè vincule els tres agents (T1A-11, T3I-02).
13. **Política de torns:** `renew`, `abandon --motiu`, què es fa amb els 137 caducats, i admetre `tancament --check` com a lectura per a Claude (T1N-01, T1N-02).
14. **Llista única de categories documentals:** si «petorreta» i «pla» queden fora de `taxonomia.json` i de les portes, i registrar la lliçó de l'acta 261001_1920 (T1A-21 i següents).
15. **Destí de les peces desendollades:** retirar-les amb SDP-LOCK o endollar-les (T1, M/T1F).
16. **No reactivar el bot de WhatsApp** sense EIPD, avís d'IA i opt-in de memòria (T4C-05).

### Relleu per a ESTAT i LEDGER (per a MarIA)

Claude no pot escriure a `.agents/ESTAT.md` ni a `.agents/LEDGER.md` sense una lease del Mestre (la seua única via és `executor-mutacio.mjs`), ni executar `tancament.mjs` en cap mode: el hook ho denega (`mutation-policy.mjs:15-16`, `:134-142`). Este és el relleu, a punt per a incorporar:

```markdown
## ESTAT_ACTUAL · 2026-10-02 00:10 · Claude · Auditoria T1-T4 (Brain, consola, telemetria, privacitat)

- **Objectiu:** l'auditoria T1-T4 de 261001_2003_prompt_claude.md: tractors del Brain skill per skill, consola de localhost, mètriques d'auto-maduresa i privacitat segons la guia de l'AEPD.
- **Torn:** torn_72ac6d8a-eca8-4878-b617-7b6ce9227fc9 · documents · informe 261001_2345_auditoria_claude.md (vàlid amb document.mjs check). Tancament.mjs no executable per Claude.
- **Fet:** 29 skills i 26 peces del nucli auditades: cap skill en verd, 3 amb flux de punta a punta. 14 mètriques M01-M14 i model N0-N4 (l'eixam està en N0). Matriu del deure d'informar sobre la guia AEPD, 10 riscos legals i esborrany de primera capa.
- **Reparat:** src/sections/consola/consolaContent.js. Els ajustos de crèdits en text ja no tomben consola.json. Proves: vitest consola 339/339; verificat a /consola/pols. Sense commit.
- **Bloquejos:**
  - 5 skills amb frontmatter invàlid segellades a les 19:37Z (lease);
  - 50 roges a src/data per C2;
  - la reparació de src/ es va fer en un torn documents sense pla (declarat a l'informe).
  - El readme del plugin va bloquejar la release de les 19:26 a les 21:28Z; ara dona 47/47.
- **Hui, el Mestre:** tancar els dispositius vinculats de WhatsApp (T4C-07).
- **Responsables:**
  - Mestre: leases i decisions 1-16;
  - MarIA: relleu, el C2 a src/data i les migracions de producció;
  - Codex: implementacions de T4 i del C2;
  - Claude: els textos legals, quan hi haja ordre.
- **Següent:** decisions 1-16 de «Pendents del Mestre». Onada 1a de T3 a src/ (sense lease).
```

Línia proposada per al LEDGER, amb el format de les entrades de torn (`LEDGER.md:21-25`):

```markdown
261001 | torn | torn_72ac6d8a-eca8-4878-b617-7b6ce9227fc9 | Claude: auditoria T1-T4 (Brain, consola, telemetria, privacitat); crèdits de la Consola reparats
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Mètode

| Fase | Agents | Què fa | Resultat |
|---|---|---|---|
| Reconeixement de l'orquestrador | 1 | Polítiques del hook. Navegador en una pestanya de fons, sense tocar la del Mestre. GET de la Consola. `git status` | Vegeu les comprovacions pròpies |
| Investigació (`wf_89e16bf0-b1e`) | 16 | T1 en 5 lots (A, B, C, D i nucli N), T2 (consola i portes), T3 (inventari, 3 dissenys i jurat) i T4 (codi, textos, referència i buits) | 328 troballes proposades |
| Verificació adversària per lots | 13 | Un verificador per lot, amb l'encàrrec de refutar. Si no es pot confirmar al disc: refutada o matisada | Vegeu la taula de xifres |
| Segona passada de les altes | 21 | Un refutador independent per cada troballa alta | 1 alta refutada (T2C-04); diverses rebaixades |
| Crític de completesa i farcit | 1 + 4 + 4 | 6 buits trobats; farcits 4. Els buits 5 (Índex de Trellat) i 6 (canal WordPress) els cobrix la síntesi | — |
| Síntesi (`wf_8d0d41d2-ead`) | 7 | Redacció per seccions, reverificant al disc els fets que havien canviat | Seccions T1-T4 |

### Xifres de la verificació

| Tasca | Proposades | Confirmades | Matisades | Refutades | Sense veredicte |
|---|---|---|---|---|---|
| T1 (amb els farcits 2 i 3) | 159 | 50 | 106 | 3 | 0 |
| T2 (amb els farcits 0 i 1) | 55 | 11 | 43 | 1 | 0 |
| T3 | 60 | 15 | 25 | 0 | 20 (propostes T3D dels dissenyadors, no presentades) |
| T4 | 54 | 21 | 25 | 0 | 8 (T4-referència, no comptades) |
| **Total** | **328** | **97** | **199** | **4** | **28** |

El 61 % de les troballes ha eixit «matisada»: certa, però amb la severitat, la causa o el remei corregits pel verificador. Les seccions ja porten les correccions. Les 7 troballes T4W de la síntesi i les observacions marcades «sense verificació adversària» no han passat cap verificació independent.

### Comprovacions pròpies de l'orquestrador

| Comprovació | Resultat |
|---|---|
| Navegador (pestanya de fons), 29 rutes, 18:58-19:00Z | 0 errors i 0 avisos de l'aplicació. Doble `ERR_ABORTED` a `/__iaia/*.json`, seguit de 200 |
| Navegador, 8 rutes a les 21:05Z, amb el canvi de `backendConfig.js` present | 0 errors. Un «Failed to load resource: 500» al buffer acumulat, no reproduïble: cap recurs amb `responseStatus` ≥ 400, comprovat amb iframes |
| GET `/__iaia/mapa.json` a les 19:00Z i a les 21:05:40Z | 28 → 23 avisos (10 → 5 alts). `salut[]` consignat a T2 i a T3 |
| GET `/__iaia/consola.json` a les 21:05Z | 38 rebuts. Ordenats per data, el més recent és del 2026-09-19T23:03:39Z |
| `npx vitest run src/sections/consola`, després de la reparació (21:41Z) | 15 fitxers, **339/339** (337 anteriors més 2 de regressió) |
| `/consola` i `/consola/pols` després de la reparació, en una pestanya neta | El pols diu «1 registres de consum · 38 rebuts · 29 skills (5 orfes) · Últim rebut fa 11 dies». Es pinten «1702 crèdits» i «DESACTIVADA». «No s’han pogut llegir les dades» desapareix. Consola del navegador sense errors |
| `node tooling/wiki/document.mjs check` sobre este informe | Vegeu l'Historial |
| Guia de l'AEPD (PDF, 17 pàgines) | Llegida sencera per l'orquestrador. L'agent de T4 no la va poder renderitzar (falta `pdftoppm`) i va treballar sobre el resum de l'encàrrec. L'estructura coincidix amb el resum: 6 epígrafs, dues capes, taula de primera capa en el camp de visió del botó, sense caselles premarcades |

Les taules de portes i proves de cada tasca són a T2 («Portes i proves») i a les verificacions de cada secció.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Governança:** a `.agents/` només s'ha escrit el registre del torn, que escriuen `obrir_torn` i `document.mjs` (`.agents/runtime/turns/torn_72ac6d8a….json` i el pany de `create`). No s'ha tocat res més de `.agents/`, ni de `tooling/`, ni de `.claude/`, ni de la zona humana. Tots els remeis amb «lease» són propostes. La reparació aplicada és només a `src/sections/consola/` i encara no té commit.
- **Torn de la reparació:** la reparació de `src/` es va fer dins d'un torn `documents` sense pla (`plan: null`). L'ordre T2 del prompt l'autoritza, però el torn no la cobrix. Pel criteri de M05 i de T3I-05, compta com una escriptura a `src/` fora d'un torn `code` amb pla, i el tancament la marcaria com un canvi de codi fora de l'abast documental. Queda declarat ací perquè ningú no l'haja de descobrir.
- **Índex de l'Escriptori:** l'àncora d'este informe s'ha mogut de la cua de `00_index_escriptori.md` a «Activitat en curs», amb una descripció, igual que va fer Codex amb la seua.
- **Ordres vetades a Claude pel hook:** `tancament.mjs` (en tots els modes), `cataleg_skills --check`, `verify-ledger`, `run-portes`, `segella --update`/`--json`, `despertar`, les `npm run porta:*` del Brain, `WebSearch` i `WebFetch`. Les conclusions sobre eixes peces es deduïxen de la lectura del codi.
- **Recerca web:** l'agent T4-referència va contrastar en viu les polítiques de WhatsApp (EEE), Signal, Telegram i Element/Matrix amb el navegador integrat. La normativa citada fora de la guia de l'AEPD és de memòria i va marcada.
- **Producció:** no s'ha accedit a producció, ni al Supabase viu, ni al WordPress de gentdelatorre.net, ni a cap contracte d'encarregat. El que es diu de producció és evidència de Codex.
- **Fitxers no oberts:** el commit `5a5d7023`, `bot/var/`, `.wwebjs_auth/`, `90_arxiu_historic/`, cap `.env` i res de `01_produccio/`. Les dades personals del titular que apareixen a `legalContent.js:75` no es reproduïxen.
- **Autoria inferida:** l'autoria de la reconciliació `3815d3de` i dels fitxers `payload_*` és una inferència per l'hora. La traça no guarda ni l'actor ni l'ordre.
- **Valors sense recomptar:** alguns valors de T3 (M01, M02, M03, M04, M05 i M12) són del jurat o dels dissenyadors i ningú no els ha recomptat. Els llindars es van proposar després de vore les dades: el Mestre els ha de fixar abans de la primera lectura oficial.
- **Error de l'orquestrador:** la xifra «últim rebut el 2026-09-10, 21 dies» que l'orquestrador va donar als agents era errònia, i està corregida a tot el document.
- **Nom del document:** porta una hora 2 minuts posterior a la creació. Està declarat a l'Historial.
- **No és assessorament jurídic:** els punts marcats [ADVOCAT] necessiten revisió professional.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261001_2003_prompt_claude]]
- [[261001_2003_prompt_codex]]
- [[261001_2050_pla_implementacio]]
- [[261001_2100_auditoria_codex]]
- [[261001_2110_pla_calendari_vistes]]
- [[261001_1920_acta_incidencia]]
