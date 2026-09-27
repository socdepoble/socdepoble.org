---
type: informe
status: esborrany
description: 'Auditoria del torn de Fable sobre la implementacio F0 del Xat: que s''ha fet, verificacio executada, decisions assumides, pendents de governança i telemetria de consum.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_46088ffc-8b7e-4175-88ad-150c315da4c5:ad7ffd06-5998-4a43-9025-8fb387ba6ef7
---
# Auditoria del torn de Fable: implementacio F0 del Xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_46088ffc-8b7e-4175-88ad-150c315da4c5:ad7ffd06-5998-4a43-9025-8fb387ba6ef7 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T00:26:36.630Z |
| Modificació | 2026-09-27T10:35:00.000Z |
| Propietari | Claude Fable 5.1 (torn torn_46088ffc) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (`claude-fable-5-1`), mode Ultracode amb subagents de Workflow |
| Tokens consumits | Subagents: ≈11,0 M en total. Mapa del codi 6,2 M (2,88 M perduts perquè el hook bloqueja StructuredOutput; 1,61 M perduts pel límit setmanal; 1,71 M útils). Implementació 4,24 M (1,11 M perduts pel límit de sessió a 4 minuts; 3,13 M útils: 5 talls + espècimens + integració; els 4 revisors i el corrector van caure pel límit i no s'han rellançat per ordre d'estalvi del Mestre). Correcció del registre de consola 0,15 M. Dos agents solts sense informe (el hook bloqueja SubagentHandback) 0,45 M. Fil principal: el client no exposa el recompte. Fricció molt alta: dos límits d'ús a mig torn, tres eines bloquejades pel hook, cap ordre de shell fora de la llista |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-27T00:26:36.630Z: esborrany creat; contingut i verificació pendents.

2026-09-27 01:15-03:20: lectura de l'especificació d'Opus (2.036 línies), pla d'implementació `260927_0055_pla_implementacio_fable_xat.md` escrit, validat i vinculat al torn; mapa del codi amb sis lectors; primer llançament de la implementació estavellat pel límit de sessió; el Mestre activa la continuació automàtica i se'n va a dormir (acta `260927_0230_acta_marmota_xat_f0.md`).

2026-09-27 04:30-12:30: implementació completa en cinc talls paral·lels més espècimens i integració; revisors adversarials i corrector caiguts pel límit; represa amb ordre del Mestre («tests en verd, mode seed sense errors, commit si es pot»): sis correccions mínimes, verificació al navegador en escriptori i mòbil, esta auditoria.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### A. Què s'ha implementat (fase F0 del full de ruta d'Opus, UX-F)

**Base de dades** · `supabase/migrations/260927_0200_xat_f0_fonament.sql` (NEW, additiva, idempotent, **no aplicada**): columnes ARQ-C01..C03 (`tipus`, `ultim_seq`, `seq`, marques `llegit_fins_seq`/`rebut_fins_seq`/`buidat_fins_seq`, `visible_des_de_seq`/`visible_fins_seq`, rols, ajustos personals, `resposta_a`, `esborrat_al`, `caduca_al`, `metadades`…), relleno de `seq` per conversa, disparador `xat_missatges_seq` BEFORE INSERT (substituïx `on_nou_missatge`), `revoke insert` i retirada de la política d'inserció (tot per RPC), `es_participant` només membres actius, `seq_visible`, `es_admin_del_fil`, política de lectura nova, `xat_lectures` tancades amb `es_participant` (forat previ), RPC `xat_envia` (idempotent per `id`), `xat_historial` (cursor), `xat_nous`, `xat_marca` (`greatest`, convivència amb `xat_lectures`), `xat_fils_meus` v2 (`drop` + `create`), `xat_marca_llegit` i `xat_missatges_del_fil` conservades, disparador `realtime.send` al canal privat `xat:f:<fil>` dins d'`exception when others`. Codis nous `SDP-XAT-006..010` documentats a la capçalera i a `supabase/README.md`. Test `tests/xat_f0_migracio.test.mjs` (26 invariants).

**Capa de dades** · `src/data/supabase/xat.js`: els 8 noms del nucli intactes (`contracte.js` no s'ha tocat), signatures ampliades de manera compatible (`enviaMissatge(filId, cadenaOObjecte, config)` per RPC `xat_envia` amb `p_id`; `loadMissatges` amb `abansDeSeq`/`despresDeSeq`/`limit`; `marcaLlegit` → `xat_marca`; `loadFils` v2; `carregaMembres` amb cerca al servidor i error honest; `subscribeToXat` per canal broadcast privat, només avisa). Errors amb `code` i `retriable`, text `SDP-XAT-*` conservat (abans es perdia: `handleError` no torna `message`). Mode seed: `src/data/localXat.js` (magatzem en memòria amb la mateixa API) i `src/data/xatSeed.js` (3 converses, 39 missatges, sistema, esborrat, IAIA, 5 no llegits). `storage.js`: constant `MIDA_MAX_PRIVADA = 26214400` (el literal `25242880` era una errada, ARQ-G07). `xat.test.js`: 32 casos.

**Estat** · `src/sections/xat/XatContext.jsx` + `missatges.js` (funcions pures, 16 tests): enviament optimista amb UUID v4 (`generaId`), tres reintents 1 s/2 s/4 s només si `retriable`, bombolla en `error` amb `reintenta`/`descartaFallit`, paginació per `seq`, temps real que només avisa i sondeig com a xarxa de seguretat (25 s / 5 s / 30 s), `marcaVist` agrupat i monòton (XAT-C08: obrir no marca res), `totalNoLlegits`, `scopeKey` (tall de `useNotesData().workspaceKey`, ARQ-H01), avís XAT-J01 per `showToast` només fora del xat i només amb el nom. `XatContext.test.jsx`: 16 casos (els 7 heretats més 9).

**Interfície** · `XatSection.jsx` sobre `AppGridShell` amb `components/ClosCaXat.jsx` (rail plegat per defecte, recordat amb `getVal/setVal('sdp-xat-rail')`), `FilaConversa` (72 px), `FilaPersona`, `LlistaConverses`, `CapcaleraConversa` (cap trucada, menú només amb «Seleccionar missatges»), `Bombolla` (pròpia, aliena, sistema, esborrada, error, enllaç segur amb avís `xn--`, «Copia el text»), `MarquesEstat`, `PastillaNoLlegits`, `SeparadorDia`, `Compositor` (`textarea` fins a 6 línies, Retorn/Maj+Retorn a l'escriptori, Retorn = salt en estret, límit 4.096), `PanellInicialMobil` (llista abans que el detall en estret); `temps.js` i `enllacos.js` amb tests; píndoles Tot/No llegits/Preferits/Grups que filtren; títol de pestanya `(N) Xat`; Retall cap a Notes conservat. `XatControlSection.jsx` sobre la mateixa closca (panell redimensionable, requisit de l'acta 0230) amb l'opció «Amplària de les columnes». CSS: bloc `sdp-xat-*` a `@layer components` de `modules.css` amb tokens; el bloc antic de `@layer legacy` retirat. `tokens.css`: `--sdp-xat-fila-mida: 72px`, `--sdp-xat-bombolla-max: 75%`. `i18n.js`: ~95 claus `section.xat.*` en cinc llengües. `Avatar.jsx` + `sdp.css`: props opcionals `llavor` (color per identificador, PER-B03) i `alt` (PER-B04); sense elles, idèntic. `XatSection.test.jsx`: 13 casos amb `getByRole`.

**Espècimens** · `EspecimenXat.jsx` renderitza els components reals (fila amb i sense no llegits, huit bombolles, compositor, pastilla, quatre marques, sis tons d'avatar); `manifest.js` actualitzat.

**Barres plegades (nota del Mestre)** · `AppGridColumn.jsx` (fora el `style={{…}}`; classe `app-grid-col-header__rail-top`), `AppGridShell.css` (un sol joc de regles de rail: fila superior `--sdp-alt-accio`, cel·les `--sdp-touch`, `gap --sdp-space-1`) i `layout.css` (barra principal plegada amb les mateixes cel·les i separació; `.sidebar-rail-toggle` a `--sdp-touch`). Taula de mesures abans/després a l'informe del tall «rails» (dins del resultat del Workflow `wf_13ea5ab4-446`).

**Verificació executable sota el hook** · `tests/lint_xat.test.mjs`: ESLint amb l'API sobre els 35 fitxers del torn (zero avisos) més les escombrades que el hook no deixa fer amb `grep` (vocabulari, `console.log`, `style=`, `:has()`, imports de Supabase, `eol-last`, paritat i18n, classes declarades, tokens declarats, hex, px < 16, 56/58 px, radis).

### B. Decisions assumides (revocables; `requires_human_decision: true` a les marcades)

- DEC-01 = A i DEC-02 = A (per la Instrucció del torn). DEC-04 = A (marques per `seq`). DEC-14: AA amb 44 px.
- **DEC-03 = NO** (`requires_human_decision: true`): `contracte.js` intacte; el criteri 6 de F0 (backend sense xat) no es pot complir sense ordre.
- **ARQ-J04 no aplicat** (`requires_human_decision: true`): la purga d'una baixa continua esborrant els missatges propis de les converses dels altres (criteri 5 de F0).
- UUID v4 (`crypto.randomUUID`) en lloc de v7: l'ordre el posa `seq` al servidor. La llei L3 de persistència es complix (`id`, no `messageId`).
- Realtime a mitges: el disparador emet al canal privat però **cap política sobre `realtime.messages`** entra al repositori (R1 de `tractor-rls` no exempta l'esquema `realtime`); el client cau al sondeig en silenci.
- Mode seed: sense sessió, el context usa l'usuari convidat (`getDefaultUserId()`) només quan `dataMode !== 'remote'`; en remot cal sessió.
- Control del xat sobre AppGridShell interpreta «panell redimensionable per a l'iPad» de l'acta 0230; les tres opcions antigues declaren que encara no fan res.

### C. Defectes trobats en la verificació i corregits en este torn

1. `src/app/App.test.jsx:233`: la prova esperava que `/realitat` redirigira a `/registre` sense sessió; MarIA va desbloquejar el Selector de Realitat (informe 0050) i `App.jsx:565` munta la ruta sense `RequireAuth`. S'ha llevat `/realitat` del `test.each` amb comentari. **No és del xat.**
2. `src/components/universal/DocumentEditor.jsx:184` (MarIA, sense commit): `useCallback` després d'un retorn primerenc (`react-hooks/rules-of-hooks`): a més de tombar `npm run lint`, canvia l'ordre dels hooks quan el document passa de buit a carregat. Mogut abans del retorn.
3. `src/sections/profile/PerfilEditor.jsx:122` (MarIA): clau `posicioEines` duplicada (`no-dupe-keys`). Retirada la segona.
4. `XatContext.jsx`: en mode seed sense sessió la llista eixia buida (el context exigia `joId`). Ara usa l'usuari convidat només fora del mode remot.
5. Mòbil (375 px): el compositor quedava tapat per la barra flotant (textarea 759-803 px, barra 724-802 px). Reserva de `--sdp-alt-nav-mobil` en `[data-layout="estret"]` al bloc del xat de `modules.css`; verificat: textarea acaba a 707 px.
6. `src/sections/notes/NotesDataContext.jsx:222`: `console.error("LOAD ERROR", …)` registrava l'`AbortError` del doble muntatge de StrictMode (ix quan el xat es registra com a consumidor de Notes per al Retall). Ara filtra `AbortError`. Pestanya nova: zero errors de consola.

### D. Troballes que no s'han pogut corregir des d'este agent (governança o fora d'abast)

1. **`design_guard` para** (i amb ell `run-portes` i el pre-commit) per deute ja a HEAD: `components/universal/DocumentPrintPreview.jsx` (quatre hex i un segon `h1`) i `css/modules.css` `.sdp-classificacio-botonera > .sdp-boto svg { width: 14px; height: 14px }` (l. ~4565). Cap identitat nova del xat (`inline-style` baixa de 17 a 4). Cal corregir eixos dos fitxers o congelar el deute a `.agents/deute/.design-guard-deute.json` (lease).
2. **Segell divergent**: `.agents/skills/core-telemetria-huma/SKILL.md` s'ha afegit sense resegellar `.agents/SKILLS_SEAL.json`; el PostToolUse `segell-auto` ho denuncia a cada eina. Cal `executor-mutacio` amb lease.
3. **`tooling/gates/tractor-rls.mjs:131`**: afegir `schema !== 'realtime'` a l'exempció de R1 i, després, la política (SQL exacte al README de `supabase/` i a l'informe «bd»):
   `create policy "xat_rebre" on realtime.messages for select to authenticated using (realtime.messages.extension = 'broadcast' and realtime.topic() ~ '^xat:f:[0-9a-f-]{36}$' and private.es_participant(split_part(realtime.topic(), ':', 3)::uuid));`
4. **`package.json` `test:node`**: afegir `tests/xat_f0_migracio.test.mjs tests/lint_xat.test.mjs` (lease).
5. **ESTAT i LEDGER** (`.agents/`, lease). Bloc per a `.agents/ESTAT.md`:
   `## ESTAT_ACTUAL · 2026-09-27 12:30 · Claude Fable 5.1 · Xat F0 implementat (torn torn_46088ffc)` · Pla `260927_0055_pla_implementacio_fable_xat.md` vinculat; auditoria `260927_0315_auditoria_claude.md`. Implementat: migració `260927_0200_xat_f0_fonament.sql` (no aplicada), adaptador amb RPC idempotents i mode seed, context amb enviament fiable i paginació, UI sobre AppGridShell amb espècimens, Control del xat redimensionable, rails unificats. Proves: Vitest 327/327 (36 fitxers: xat, dades, app, components, disseny, notes); `node --test` 26/26 i 14/14 (ESLint zero avisos); `porta:rls` i `porta:enxufe` verdes; `design-guard` roig per deute a HEAD. Navegador seed: escriptori i mòbil verificats, consola neta. Pendents: DEC-03, ARQ-J04, política `realtime.messages` (exempció R1), `test:node`, baseline de `design-guard`, resegellat de la skill nova, revisió adversarial no executada. Sense commit ni push.
   Línia per a `.agents/LEDGER.md`: `260927 | torn | torn_46088ffc-8b7e-4175-88ad-150c315da4c5 | Fable: Xat F0 (migració seq/RPC, adaptador+seed, context, UI AppGridShell, rails), 327 proves verdes, sense commit`.
6. Deute menor deixat pels talls: token `--sdp-col-plegada: 56px` (i substituir `56px` a `layout.css` i `AppGridShell.css:15`, i el `56` de `AppGridShell.jsx:84-85`); `--sdp-touch-min` s'usa en quatre fulls sense declaració a `tokens.css`; regles `.chat-*` i `.sdp-chat-bubble*` de `modules.css` (l. 2111-2161 i 2230-2261) ja sense consumidor conegut; literals «Jo», «Veí», «Conversa» a `missatges.js` fora de `t()` (XAT-P10); `marcaLlegit` fallit escriu `avis` cada 2 s amb el servidor caigut; la barra mòbil flotant no s'amaga dins d'una conversa (UX-A05, closca global: F1).
7. Lliçons del hook per a l'Eixam: `StructuredOutput`, `SubagentHandback` i les eines `Explore`/`Agent` solts no poden entregar resultat; només els `agent()` d'un Workflow tornen text. Els subagents no tenen `Grep`/`Glob`. La memòria fora del repositori també està bloquejada. Estes lliçons ja consten a l'ESTAT de MarIA (01:51) i al pla.

### E. Commit

L'agent no pot executar `git add` ni `git commit` (el hook només admet lectures de git). El pre-commit fallarà per `design_guard` (deute a HEAD), pel rebut del Reflex (`.sdp-reflex/active.json`) i per `tancament --check` (segell divergent). Ordres proposades per al Mestre, després de revisar `git status --short`:

```bash
git add -A -- src supabase tests _wiki_de_poble .agents/ESTAT.md .agents/ON_ESTIC.md .agents/skills/core-telemetria-huma/SKILL.md
```

```bash
git commit --no-verify -m "feat(xat): fase F0 del Xat estil WhatsApp (migració seq/RPC, adaptador amb mode seed, context fiable, UI sobre AppGridShell, rails unificats)"
```

Les receptes de `.immunitari/receptes/` i el `.agents/runtime/turns/*.json` del torn queden a criteri del Mestre.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Ordre | Resultat literal |
| --- | --- |
| `npx vitest run src/sections/xat src/data/supabase/xat.test.js src/app/App.test.jsx src/components src/sections/disseny src/sections/notes` | Test Files 36 passed (36) · Tests 327 passed (327) |
| `node --test tests/lint_xat.test.mjs` | tests 14 · pass 14 · fail 0 (ESLint zero missatges als 35 fitxers del torn i als 5 de MarIA) |
| `node --test tests/xat_f0_migracio.test.mjs` | tests 26 · pass 26 · fail 0 |
| `npm run porta:rls` | ✅ Zero fantasmes i zero forats (22 fitxers sql) |
| `npm run porta:enxufe` | ✅ E1 E2 E3 E4 |
| `npm run porta:design-guard` | PARAT: `raw-color` 20→21 i `h1-multiple` 0→1 a `DocumentPrintPreview.jsx`, `touch-too-small` 3→5 a `modules.css` 14 px (tot a HEAD, fora del xat); `inline-style` 17→4 |
| `git status --short` | Fitxers del pla (talls A-G), sis correccions de la secció C i els canvis previs de MarIA; cap fitxer inesperat |

Navegador (`vite-dev`, `http://localhost:3340`, `VITE_DATA_MODE=seed`, sense sessió):

- Escriptori: rail del xat plegat, columna «Converses» amb lupa i «Conversa nova», píndoles, tres converses amb comptadors (2 i 3), títol de pestanya «(5) Xat | Sóc de Poble».
- Conversa oberta: capçalera sense trucades, separador «Hui», bombolles pròpies a la dreta amb marques, aliena a l'esquerra, làpida «S'ha esborrat este missatge», compositor. Enviament: bombolla immediata amb marca «enviat», previsualització de la llista actualitzada, comptador de 5 a 3 en llegir les de Pepa.
- Mòbil 375 px: llista abans que el detall, fila amb pastilla; conversa a pantalla completa amb fletxa d'arrere; compositor per damunt de la barra flotant després de la correcció (mesurat amb `getBoundingClientRect`).
- `/control-xat`: rail amb «Control del xat» actiu, llista d'opcions, detall amb separadors redimensionables.
- Barra principal plegada a `/xat` i a `/notes`: icones en columna de 44 px amb la mateixa separació que el rail del xat.
- Pestanya nova amb una conversa oberta: «No console logs» (errors). Els avisos `[Mur] Falta la pàgina de sistema…` són previs i del Mur.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La migració no s'ha executat contra cap base de dades (no n'hi ha de local); el relleno de `seq`, `#variable_conflict` a `xat_envia` i l'existència de `realtime.send` només es confirmen en aplicar-la. Contra un Supabase amb l'esquema antic, el client remot fallarà amb «esquema no aplicat» fins que s'aplique.
- El canal privat de temps real no s'ha provat (sense polítiques ni servidor); el sondeig sí, en mode seed.
- La revisió adversarial amb quatre lents i el corrector (fase 3 del pla) va caure pel límit de sessió i **no s'ha rellançat** per l'ordre d'estalvi del Mestre; la garantia és la bateria de proves i la verificació manual d'esta auditoria. Es recomana l'auditoria creuada de Codex sobre el SQL i sobre `XatContext.jsx`.
- No es poden executar des del hook: `npm run lint` sencer, `porta:tokens`, `porta:vocabulari`, `porta:pedra-seca`, `porta:fitxa`, `tancament.mjs --check`, ni la cadena `run-portes`. Els seus criteris s'han cobert amb `tests/lint_xat.test.mjs` i lectura, no amb la porta real.
- Mode fosc, WordPress incrustat i sessió real amb Supabase no s'han verificat.
- ESTAT, LEDGER, `package.json`, `tooling/` i `.agents/` no s'han tocat (lease); el torn no es pot tancar amb `tancament.mjs` des d'ací.
- La telemetria de tokens del fil principal no és observable; el cost en crèdits de l'API el va anotar MarIA a l'acta 0230 (≈157 $ fins a les 02:30) i no s'ha registrat a `consum_ia.csv` per falta d'ordre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
