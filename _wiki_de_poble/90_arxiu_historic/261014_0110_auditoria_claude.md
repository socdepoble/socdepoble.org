---
type: informe
status: esborrany
description: Informe d'execució dels sis fronts del pla 261013_1930 amb proves, revisió adversarial i verificació al navegador, decisions del Mestre i pendents.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1dd5e4c3-3ec8-48a8-a5ce-0a0ce6f7e4f9:cdbe2e4b-2e20-47a3-9e26-17644a36ccf2
---
# Auditoria d'execució del pla 261013_1930: jerarquia taronja, tractors DEV i Finestreta

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1dd5e4c3-3ec8-48a8-a5ce-0a0ce6f7e4f9:cdbe2e4b-2e20-47a3-9e26-17644a36ccf2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T23:10:23.296Z |
| Modificació | 2026-10-13T23:50:00Z |
| Propietari | agent-local |
| Aprovació humana | Pla 261013_1930 aprovat pel Mestre. Decisions del Mestre del 14-10 preses en este torn: F1b «Taronja 400», F4 «Blau clar en fosc», F6 «Fitxa + obrir el PDF». El codi no està commitejat. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code), orquestrant cinc workflows de subagents |
| Tokens consumits | Subagents: uns 5,7 M segons el comptador dels workflows (1,72 + 2,22 + 0,82 + 0,96). Bucle principal: no disponible. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-13T23:10:23.296Z: esborrany creat; contingut i verificació pendents.
2026-10-13T23:12:00Z: relleu de progrés no desat. El hook només admet el document complet. Fets i revisats F1a, F1b, F2, F3, F4 i F5; F6 en marxa.
2026-10-13T23:35:00Z: F6 tancat. L'orquestradora hi corregix la revocació de les URL en canviar de carpeta o en fallar una comprovació.
2026-10-13T23:46:47Z: suite sencera verda (17.458 proves).
2026-10-13T23:50:00Z: informe complet emés.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu

**Els sis fronts estan implementats, revisats per un agent adversarial independent i coberts per proves noves. La suite sencera ix verda: 17.458 proves passen, 89 omeses i cap roja.** El tall és HEAD `021a03ea` més els canvis d'este torn a `src/` i a `supabase/README.md`. No s'ha fet cap commit, i res de `.agents/`, `tooling/`, `01_produccio/` ni `.env*` no s'ha tocat.

La lectura prèvia va desmuntar tres premisses del prompt:

- **Els tokens no existien.** `--sdp-accent-taronja`, `--sdp-orange`, `--sdp-orange-accessible` i `--sdp-radius-pill` no són a `src/css/tokens.css`. S'han usat els reals: `--sdp-crom-grup-text`, `--sdp-primary-400` darrere d'un token nou de crom i `--sdp-radi-boto`/`--sdp-radi-pastilla`.
- **El Front 1a ja estava fet.** El front C del pla 261013_1405 va posar «Sistema» i els grups de la BarraApp en taronja (`layout.css:974-998`, `apps.css:31-40`). Només en faltava la guarda de DOM.
- **HEAD no estava verd.** Hi havia 3 proves roges als fitxers de Tractors (`PanellTractors.test.jsx`, dues, i `qualitat.test.js` per `idTitol` sense ús), malgrat les «17.283 verdes» del preflight. S'han reconciliat sense perdre cobertura: les assercions s'han mogut a la Wiki.

Hi havia tres decisions que contradeien la doctrina o la privacitat, i s'han preguntat al Mestre abans de picar codi (lliçó 261007 de `sdp-workflow`).

### Execució per front

| Front | Estat | Què ha canviat | Evidència |
| --- | --- | --- | --- |
| F1a · «Sistema» | Fet (abans) + guarda nova | Guarda de DOM: `<button>` amb classes exactes, l'únic desplegable, dins de `nav.app-sidebar`, sense `style`, icones en `currentColor`, `aria-controls` real i clic que inverteix l'estat; a 1024 i a 1023 px | `src/app/App.test.jsx:498-570`; 87/87 |
| F1b · Workspace | Fet | Token nou `--sdp-crom-contenidor-text: var(--sdp-primary-400)` (#ff955b, 5,17:1 sobre Grafit 700). Pinta les capçaleres de grup, les carpetes amb fills i el seu desplegador. El hover torna al blanc. Les fulles, la selecció blava i el títol plegable de columna no canvien | `tokens.css:412-427`, `modules.css:412-439`, prova nova `src/css/jerarquiaWorkspace.capes.test.js` (31 casos, amb `element.matches()` sobre el DOM real) |
| F2 · Tractors DEV | Fet | `APROVABLES_EN_BLOC`, `esAprovableEnBloc`, `aprovaEnBloc` (en sèrie, pel mateix `aprova`) i `aprovaTotsPendents` només en DEV. Botó secundari «Aprovar tots els pendents (DEV)» amb descripció i resum a l'estat | `useTractors.js`, `PanellTractors.jsx`; prova de build de producció `PanellTractors.produccio.test.js`: el botó no hi és |
| F3 · Xarxa | Verificat + Rentonar | Rentonar és `ENTITATS_SEED[1]`, un grup fill de Sóc de Poble amb una sola font de dades. La propietat implícita del pilot es limita a l'entitat pilot. `localXat.creaFilDirecte` accepta les entitats de la llavor (com `crea_fil_directe` al servidor). Comentaris rancis corregits | `identitatsSeed.js`, `localXat.js`, `xatSeed.js`, `appSeed.js`, `supabase/README.md:616`; `perfils.fundacionals.test.js` |
| F4 · Vistes | Fet | Sense subratllat. Radi de píndola heretat de `.sdp-pindola`. Premuda amb `--sdp-accio-text`/`--sdp-text-invers`: en clar, idèntica a abans; en fosc, #96c9ff i #0e0d0c (10,32:1) | `modules.css:6808-6826`; `VistaAgenda.test.jsx` exigix un fons de ≥3:1 i cap `text-decoration` |
| F5 · Selecció | Fet | `marcaTotsDemanar`/`desmarcaTotsDemanar` (només `demanar`). Grup «Papers de nom opac» amb «Marca tots els pendents (N)» i «Desmarca tots», anuncis amb recomptes, focus transferit i nota del límit de 60 | `useFinestreta.js`, `Finestreta.jsx` (SeccioPla), fitxa `gestoria_identitat.md:16` |
| F6 · «D’on ix» | Fet | `<details>` amb el tipus, la data, la regla i l'empremta curta. «Comprova el paper»: relectura amb la porta, cap vetat, empremta i MIME fix. «Obri’l en una pestanya»: `window.open` síncron, `noopener`. Les URL es revoquen als 120 s, en bloquejar el cofre, amb «Oblida», amb una carpeta nova, quan falla una comprovació i en desmuntar | `tractorIdentitat.js` (`obriPaperIdentitat`), `useFinestreta.js` (`preparaPaper`), `privacitat.test.js` (excepció per a una sola crida) |

### Troballes obertes

Cada troballa porta el fitxer o l'abast, l'evidència, la severitat, la font de veritat amb què entra en conflicte i una proposta conservadora.

**CL-01 · P2 · F4: la píndola apilada en estret.** `src/css/modules.css:6808-6826`. A 375 px les cinc vistes s'apilen en dues files i el contenidor es fa un estadi de radi efectiu 55 px. La premuda d'una cantonada («Setmana» o «Any») n'ix 5,8 px per la corba. Està mesurat al navegador i documentat al comentari de la regla. Topa amb l'ordre literal del Mestre (radi de píndola) i amb Pedra Seca §1: no hi ha scroll propi, i `overflow: hidden` retallaria l'anell de focus. Proposta: acceptar-ho, com ja passa a la resta de PillToggle apilats, o tornar a `--sdp-radi-m` només per a `.sdp-cal-vistes` dins d'un `@media` estret. `requires_human_decision: true`.

**CL-02 · P2 · Premuda de sèrie dels PillToggle (fora d'abast).** `src/css/modules.css:702-706`. En fosc, el fons fa 1,95:1 contra la targeta i només el color marca l'estat (WCAG 1.4.1 i 1.4.11). Ho usen el Mur, la Multimèdia, l'Onboarding, la Cerca i el TPV. En colors forçats cap regla cobrix `aria-pressed`, i ara `.sdp-cal-vistes` queda igual. Proposta: estendre la parella de F4 a la premuda de sèrie i afegir `Highlight`/`HighlightText` a la regla de colors forçats de `base.css`. `requires_human_decision: true`.

**CL-03 · P2 · Design Guard roig a HEAD (deute previ).** `tooling/gates/design_guard.mjs:150-159` contra `src/css/modules.css:2682`. La regla `.toc-drawer:focus { outline: none; }`, de l'Onada 12 (261011), diu al comentari que la porta l'empara amb `ALLOW_FOCUS_INVISIBLE`. La porta no implementa cap marcador d'eixe tipus: `focus-invisible` passa de 0 a 1 i `design_guard.mjs --arrel=src` ix amb 1. Cap edició d'este torn no toca eixa zona. Proposta: implementar el marcador a la porta, que és `tooling/` i va amb lease, o retirar l'excepció. És una porta que diu una cosa i en fa una altra. `requires_human_decision: true`.

**CL-04 · P2 · F2: l'aprovació en bloc.** `src/sections/tractors/`.

- Editar `useTractors.js` i `PanellTractors.jsx` canvia l'empremta dels 13 tractors (6 de la Gestoria per `PORTA_APROVACIO` i 7 sentinelles per `FONTS_COMUNES`), i tots passen a «Versió canviada». **La primera aprovació després d'este canvi s'ha de fer d'una en una, llegint estes dos fonts.** Si no, el bloc s'aprova a si mateix. Ho diu la descripció del botó.
- El registre no distingix una aprovació en bloc d'una de reflexiva, perquè l'esquema és tancat i el nucli no s'ha tocat.
- «Oblida» i «Exporta» no es desactiven mentre corre la sèrie.
- Una sèrie de WebAuthn a Safari 16 està per verificar amb Touch ID real.
- La «fitxa de govern» que demana el pla no existix. El patró només viu a la descripció del botó i al codi. La lliçó 261002 demana un document aprovable a la Wiki: és de MarIA.

`requires_human_decision: true`.

**CL-05 · P2 · F6: obrir el paper.** `src/sections/gestoria/finestreta/`.

- **No s'ha verificat el visor PDF** en una pestanya `blob:` que hereta `object-src 'none'` de la CSP d'`index.html:17`, ni a Chrome 100, ni a Safari 16, ni a Firefox 100. El navegador integrat no servix de prova.
- Amb `noopener`, `window.open` torna `null`, i l'anunci «obert» es fa sempre.
- La caducitat de 120 s és muda: no hi ha cap avís, i el focus pot caure al `body`.
- La prova de la guarda de `MIME_PAPER` és inerta, perquè els tres casos ja són `ometre` pel filtre.
- La prova de mutació de la guarda de carpeta (`useFinestreta.js`, «La carpeta ha canviat…») no s'ha executat perquè el classificador va denegar debilitar-la temporalment. Les proves exigixen el missatge exacte d'eixa guarda.

Proposta: el Mestre obri un PDF real amb el tractor signat i ho confirma a cada navegador. Si falla, la via de reserva és la descàrrega amb revocació (patró d'`Historic.jsx:116-122`). `requires_human_decision: true`.

**CL-06 · P2 · F5: consentiment diluït.** `Finestreta.jsx` (SeccioPla). «Marca tots els pendents» marca papers de nom opac que poden ser mèdics. Marcar no és llegir, però en prémer «Llig» s'obrin en memòria, i l'única xarxa és `teSalut` sobre el text, després d'obrir-los. Els `ometre` mai no es poden marcar (dues capes, amb proves). A més, un anunci repetit no es torna a llegir; és el mateix patró que ja hi havia a la vista. Proposta: decidir si cal un avís dins del grup i si cal desactivar «Llig» per damunt de 60. `requires_human_decision: true`.

**CL-07 · P2 · F3: segrest d'slug i fundacionals remotes.** `supabase/migrations/`, `navigation.js:136-145`, `xatCorporatiu.js:166-175`.

- Cap migració reserva `socdepoble` ni `rentonar`. La primera organització que pren eixe slug en un poble rep la boina i tots els «En privat».
- Ni les migracions ni `seed.sql` creen les organitzacions fundacionals.
- El diàleg «NOVA ORG» proposa `soc-de-poble` i no demana mare.
- `seed.sql:17` encara porta `soc-de-poble`.

Proposta: una ADR i una migració de reserva (superadmin, llista a `private.ajustos` o files sembrades), i regenerar `seed.sql` amb la canonada governada. No s'ha creat res. `requires_human_decision: true`.

**CL-08 · P3 · F3: Rentonar en llavor.**

- Ningú no l'administra, i per tant la conversa no té resposta.
- «En privat» des de `/grup/rentonar` porta al xat de Sóc de Poble, perquè el padró de `xatCorporatiu.js:93` és fix a tres.
- Al xat poden conviure dues files «Rentonar»: el grup de la pàgina i el directe.
- El logotip registrat a `media_registry.json` no és a `public/`.

El padró de tres el fixa la decisió de l'Onada 10 (T63.1). `requires_human_decision: true`.

**CL-09 · P3 · Doctrina sense escriure.** `.agents/skills/sdp-pedra-seca/SKILL.md` §2 encara diu que el taronja és només de marca. No hi consten la regla del 13-10 (lletra en `--sdp-crom-grup-text` només sobre la roca), la del 14-10 (contenidors en AA, a 5,17:1, sobre Grafit 700, que deroga en part la Q1 «AAA sempre») ni la lliçó «sense subratllat a la premuda». A més, la regex `CLOSCA` de `tooling/gates/tractor-crom.mjs:48` no vigila `sdp-app-barra`. És faena de MarIA o del Mestre. `requires_human_decision: true`.

**CL-10 · P3 · Memòria rància.** La nota de memòria de Claude «barra-taronja-es-lestat-buit» diu que el guarda de `NotesDataContext` apaga el seed. Ja no és cert: `NotesDataContext.jsx:339` i `:401`, i la prova `NotesDataContext.test.jsx:205`. El hook bloqueja escriure fora del repositori i no s'ha pogut corregir. `requires_human_decision: false`.

### Pas a pas verificat de la xarxa (Front 3)

Cada pas està verificat contra el codi.

**Seed**, amb `VITE_DATA_MODE=seed` a `.env.local`:

1. Executa `npm run dev` i obri http://localhost:3340.
2. A `/xat` hi ha la IAIA, que contesta, i la comunitat «Sóc de Poble» amb Avisos, General i Beta testers. Com a convidat no s'escriu als Avisos (SDP-XAT-011).
3. `/empresa/socdepoble` i `/grup/rentonar` resolen la fitxa. «Escriu-li al xat» de Rentonar obri un directe sense alerta.
4. `/notes` carrega la llavor sense sessió.
5. **Si vols continuar en seed, no obrigues `/registre` ni `/el-meu-perfil`.** Fan la sonda `GET /auth/v1/health` i, si el 54321 respon, commuten a remote i recarreguen (`OnboardingSection.jsx:183-188`, `RequireAuth.jsx:47-55`).
6. Per tornar a seed, reinicia `npm run dev`. L'empremta T13 anul·la l'elecció remota (`dataMode.js:14-20`).

**Remote local**, amb Supabase a 127.0.0.1:54321:

1. Comprova que `GET http://127.0.0.1:54321/auth/v1/health` torna 200. Al `.env.local` hi ha d'haver la clau anon, mai `service_role`. `VITE_TENANT_ID` ha de ser un poble que existisca; si no, el xat torna buit sense error.
2. Aplica les migracions per ordre i `seed.sql`. Este no crea cap organització.
3. Obri `/registre` i crea un compte.
4. A `/el-meu-perfil`, «NOVA ORG»:
   - Sóc de Poble, de tipus empresa, escrivint a mà l'identificador `socdepoble`.
   - Rentonar, de tipus grup, amb l'identificador `rentonar`.
5. Comprova `/empresa/socdepoble`, `/grup/rentonar` i «En privat». Sense l'organització, ix «encara no disponible en este servidor».
6. Obri un segon compte en un altre perfil del navegador i fes «Nova conversa» → envia.
7. Prova automàtica: `node tests/integration/local-auth-chat.mjs`.

### Coordinació a l'Olivera

- **Codex (261014_0002).** Confirma per la seua banda que `--sdp-radius-pill` no existix (CON-07) i demana una distinció perceptible de l'estat premut: F4 la dona amb un fons de ≥3:1. Els seus GES-03 (formulari amb el tribut d'un altre titular) i GES-04 (deduplicació de tributs entre titulars) són a la Finestreta, als mateixos fitxers que F5 i F6, i **no s'han tocat**: necessiten el seu pla.
- **Gemini (261014_0130).** Audita `src/sections/gestoria/`. Ha de saber que `Finestreta.jsx`, `useFinestreta.js` i `tractorIdentitat.js` han canviat en este torn, i que `gestoria.identitat` està en «Versió canviada» fins a la resignatura.

### Retroalimentació de la plantilla `prompt_local`

1. **Verificar els tokens abans de nomenar-los.** El prompt n'inventava quatre. La plantilla pot exigir que cada token citat es copie de `tokens.css` amb el número de línia.
2. **Declarar què ja està fet.** El Front 1a duplicava el front C del dia anterior. Cal un pas de «relectura de l'estat» abans de llistar tasques.
3. **El preflight ha de dir la xifra mesurada, no la heretada.** «17.283 verdes» no era cert als fitxers del Front 2.
4. **Fer explícits els conflictes entre ordre i doctrina** (Q1 AAA, WCAG 1.4.1, portes de privacitat), perquè l'agent sàpiga que ha de preguntar i no endevinar.
5. **Nom del document amb la data real.** El prompt demanava `261013_HHMM` per a una feina del 14-10.
6. **Dir quines ordres admet el hook.** Les proves `node --test` i `tancament.mjs` no es poden executar des de Claude.
7. **Concretar «el cron de MarIA».** El prompt el dona per fet; ni Codex ni Claude l'han pogut identificar.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src tests` (01:36-01:47) | **1.024 fitxers verds i 6 omesos. 17.458 proves verdes, 89 omeses, 0 roges.** |
| `npx vitest run src/sections/gestoria src/sections/tractors/clausura.test.js` | 126 fitxers, 3.194 verdes, amb les 2 proves de revocació afegides per l'orquestradora |
| F1a: `App.test.jsx` + `jerarquiaBarraLateral` | 109/109 |
| F1b + F4: `src/css`, workspace, layout, PedraSeca, disseny, calendari, tauler, plataforma | 193 fitxers, 3.098 verdes |
| F2: tractors, privacitat, wiki | 44 fitxers, 789 verdes, abans 3 roges a HEAD |
| F3: data, xat, notes, onboarding, config | 222 fitxers, 3.547 verdes |
| Revisió adversarial | Un agent independent per front, que intenta refutar cada troballa. Les mitjanes s'han corregit (F2: resum de la sèrie aturada; F3: camí real de Rentonar; F6: proves de carrera); les baixes s'han aplicat (F1a, F5, F6) o anotat |
| Navegador (pestanya de fons, 1440×900, seed) | Notes: CATEGORIES i ETIQUETES en `rgb(255,149,91)` sobre `rgb(61,59,53)`; fulles blanques; «Mur» actiu, blau amb lletra blanca. Wiki: SABER i ACTUAR en taronja i SER en blanc. Tractors: botó DEV amb «6 pendents d'aprovar», **no clicat**. Calendari: radi 999px, «Mes» premuda en `rgb(0,73,131)`, sense subratllat. `/grup/rentonar` es pinta. Consola sense errors |
| `node tooling/gates/design_guard.mjs --arrel=src` | Eixida 1 per CL-03, deute previ. Baixen inline-style (17 a 4), touch-too-small (3 a 2) i raw-color (20 a 17) |
| `node tooling/gates/porta-olivera.mjs --informe` | Safata buida, cap consumit, 8 documents vius ancorats; avís de sediment de l'índex (844 línies) |
| Producció sense el botó DEV | `PanellTractors.produccio.test.js` compila en producció i comprova que no hi ha ni el text ni `aprovaTotsPendents` |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit.** Els canvis són a l'arbre de treball, barrejats amb els de MarIA i Codex (`.agents/`, índex, arxivats). Commitejar-los és decisió del Mestre.
- **No executat per bloqueig del hook:** les proves `node --test` (`tests/*.test.mjs`, entre elles les que passen ESLint per `App.test.jsx`), `tancament.mjs --check`, `tractor-crom.mjs` i `tractor-cromatic.mjs`. Estes dos portes les ha llegides i raonat el revisor de F1b.
- **No escrit:** el relleu a `.agents/ESTAT.md` i al LEDGER. Claude no té lease de governança, i és faena de MarIA. El torn `torn_1dd5e4c3` queda obert.
- **No verificat:** el visor PDF de `blob:` als tres navegadors del Baseline (CL-05); WebAuthn en sèrie a Safari; l'estat real del Supabase local (migracions aplicades); les captures en tema fosc (els valors en fosc els ha mesurat el corrector de F1b i F4 amb la cascada real).
- **Fronts 5 i 6 sense navegador:** cal el cofre obert, el tractor signat i el selector de carpetes. Ho cobrixen les proves.
- **Cap cron ni schedule creat.** Els workflows han acabat, i la pestanya de fons del navegador es tanca en acabar. No s'ha tocat la pestanya del Mestre ni s'ha aprovat cap tractor.
- **Llegits sencers:** el pla 1930, el prompt 1930, l'estudi del laboratori 1600, el prompt de Codex 2355, l'auditoria de Codex 0002, el pla i el prompt de Gemini 0130, l'acta 261013_2215 i les skills `sdp-pedra-seca` i `sdp-app-grid-shell`. No s'ha llegit res de `90_arxiu_historic/`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261013_1930_pla_implementacio_jerarquia_taronja_i_operativitat]]
- [[261013_1930_prompt_claude_jerarquia_taronja_i_operativitat]]
- [[261014_0002_auditoria_codex]]
- [[261014_0130_pla_implementacio_auditoria_gemini4]]
