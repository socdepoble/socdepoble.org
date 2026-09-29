---
type: informe
status: esborrany
description: T13, T14, formulari i error d’entrada corregits i verificats al navegador. Causa del 400 (db reset), incident de neteja amb restauració, i disseny del Motor Cognitiu i la T6.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0530f207-9a12-4664-9be7-5ef452f66cf7:eb8d2f52-519c-444e-9bac-ba3b6f0b4823
---
# Auditoria i correccions: T13, T14, accés, formulari i Motor Cognitiu

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0530f207-9a12-4664-9be7-5ef452f66cf7:eb8d2f52-519c-444e-9bac-ba3b6f0b4823 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T19:15:35.033Z |
| Modificació | 2026-09-29T19:25:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb dos workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l’agent. Subagents, segons els informes dels workflows: diagnosi i refutació (18 agents) 3.916.931; verificació i revisió adversarial (3 agents) 639.136. Total de subagents: 4.556.067. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-29T19:15:35.033Z: esborrany creat; contingut i verificació pendents.

- 20:03: tall congelat de l’arbre (HEAD `0b75332e` i els canvis sense commit, empremta de `src` `74966c29…`). Tots els agents hi han llegit el codi, perquè MarIA i Codex editen en paral·lel.
- 20:04-20:50: workflow de diagnosi. Un investigador per tasca (T13, T14, formulari, Supabase 400, Motor Cognitiu/T6, incident de neteja) i dos escèptics per tasca amb l’ordre de tombar: un de proves i reproducció, un altre de solució i regressions.
- 20:52-21:02: correccions aplicades al repo viu (T13, T14, formulari, error d’entrada, README) i verificades al navegador integrat. Paquet de WordPress recompilat.
- 21:03-21:20: suite sencera i dos revisors adversarials del pegat. Resultat: 0 fallades noves i cap troballa bloquejant.
- 21:05: el Mestre decidix restaurar la quarantena, «pla primer» per al Motor, que el pla declare els prompts i alinear el tenant.
- 21:11-21:14: script de neteja neutralitzat, exposició a la xarxa tancada i quarantena restaurada. Amb `.claude/settings.json` restaurat, els hooks es reactiven en esta mateixa sessió.
- 21:15-21:25: torn documental, pla [[260929_2115_pla_implementacio_motor_cognitiu]], esmenes dels revisors i esta auditoria, tot sota el règim de hooks.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum

| Tasca | Estat | Evidència |
| --- | --- | --- |
| T14 · pantalla en blanc a WordPress | Corregida i verificada | Chromium real: el paquet vell dona `ReferenceError: process is not defined`; el nou pinta l’app en un amfitrió sense `process`, amb 0 errors |
| Formulari d’accés | Corregit i verificat | Camps i alerta dins de la targeta: 57 px de marge a 830 px i 45 px a 375 px |
| Supabase 400 | Causa trobada. Cal una acció teua | MarIA va executar `npx supabase db reset` a les 13:49 i `auth.users` té 0 files. Cap agent pot «arreglar» l’accés sense triar-te la contrasenya |
| Missatge de l’error d’entrada | Corregit i verificat | «El correu o la contrasenya no són correctes.», en lloc del JSON cru de GoTrue |
| T13 · Empty Seed Data | Corregida i verificada | Al servidor real, una elecció d’abans de T13 resol `seed`; «Entrar» continua passant a `remote` |
| Incident de neteja d’arrel | Restaurat per decisió del Mestre | Plaquetes i Time Machine tornen a funcionar; l’script ja no pot repetir-ho |
| Exposició a la xarxa local | Tancada | El servidor de desenvolupament servia `.sdp-reflex/secret.key` amb un 200 a la xarxa local (`192.168.0.16:3340`); ara dona 403 |
| Motor Cognitiu i T6 | Dissenyat, no implementat (decisió del Mestre) | [[260929_2115_pla_implementacio_motor_cognitiu]] |

### 1. Esmenes al prompt i al pla de MarIA

- **Prompt `260929_1839`:** no té rebut ni `reflex:`, i li falten les seccions «Acte reflex» i «Vincles» de la ruta. Dos de les tres caselles del Preflight són falses (pla i rebut). La línia «PRIORITAT ABSOLUTA (Llei de Sollutia)» s’ha inserit dins del bloc fix de Context (bloc normatiu alterat), i a la línia 75 hi ha un `\n\n###` literal. La T6 s’hi atribuïx a `260929_1145_pla_implementacio_codex.md`, però la proposta és a `260929_1154_auditoria_codex.md:152-190`. requires_human_decision: false.
- **Pla `260929_1955`:** és 1 h 16 min posterior al prompt, té un altre cognom, no té frontmatter ni rebut i no està ancorat. He acceptat l’ordre igualment, perquè el Mestre l’ha enganxat ell mateix amb una instrucció explícita. La regla «REBUTJA L’ORDRE» de la plantilla xoca amb la sobirania del Mestre, i el pla del Motor ho resol amb un receptor que bloqueja i una anul·lació `SDP-FORÇA`.
- **Línia 10 del pla 1955 («Corregir error d’autenticació … per a permetre l’accés»):** convida qualsevol agent a «arreglar» l’accés. Amb `GOTRUE_MAILER_AUTOCONFIRM=true`, el primer que registra `socdepoblecom@gmail.com` es queda el compte, i l’app no té recuperació de contrasenya. Kong registra intents d’entrada d’agents (UA Pixel 8 i Claude) entre les 20:10 i les 20:25, tots amb correus inventats. Proposta: cap agent crea, esborra ni modifica eixe compte.
- **«Sense padding» era un diagnòstic erroni:** el padding hi era. Afegir-ne (opció C) empitjorava el desbordament: el cos passava de 547 a 579 px.

### 2. T14 · `process is not defined` al paquet de WordPress

- **Causa (reproduïda):** `vite.standalone.config.js` compila en `build.lib` IIFE sense `define`. Vite 7.3.6 no substituïx `process.env.*` en mode llibreria (`node_modules/vite/dist/node/chunks/config.js:26504-26516`). React, react-dom, scheduler, use-sync-external-store i @tiptap/react hi deixen 15 lectures sense protecció. La primera peta al nivell superior de l’IIFE (`react/jsx-runtime.js:3`), i ni `SocDePoble` ni `<soc-de-poble>` arriben a existir. El `define` es va perdre al commit `a5da9c26` (21-09), que va llevar `'process.env': {}` sense posar-ne cap substitut: des d’aleshores cap `build:wp` arranca en un amfitrió sense `process`.
- **Correcció:** `define: { 'process.env.NODE_ENV': … }`, només amb la clau concreta i el criteri `isProduction` de Vite, i una guarda `sdp-sense-process` dins del mateix build. Si una dependència nova deixa un `process.env` viu, el build falla, en lloc de deixar la pantalla en blanc a l’amfitrió. La guarda mira l’AST, no el text: la Wiki viatja dins del paquet i pot parlar de `process.env`.
- **Llei de Sollutia:** cap `window.process` ni cap global nou, i per tant cap contaminació de l’amfitrió. El mateix paquet servix per a WordPress, una pàgina estàtica o Sollutia. El paquet baixa de 3.458.169 a 3.120.022 bytes, perquè ix el React de desenvolupament.
- **Troballa per a Sollutia (requires_human_decision: true):** el paquet segella en compilar els valors de `.env.local`: `localhost:54321`, `dataMode: 'seed'` i el tenant. Abans de lliurar-lo a Sollutia o a un WordPress remot cal compilar-lo amb les `VITE_*` de producció o passar-ho per atributs de l’element (`sanejaConfig`). HIPÒTESI: en un amfitrió amb un `#root` buit, `embed.jsx` hi munta una segona instància amb `routerType 'browser'`.

### 3. Formulari d’accés

- **Causa (reproduïda):** `.sp-card--onboarding` és una columna flex amb `align-items: center` (`src/css/components.css:888-900`), i el cos de la targeta pren l’amplària del seu contingut. El JSON cru de GoTrue, sense espais (460 px), li imposava una amplària mínima de 547 px, més que la targeta (500 px). L’`overflow: hidden` de la targeta ho retallava: a 1440 px camps i alerta tocaven la vora, i a 375 px la passaven 78 px per costat. És un defecte latent del 21-08, no una regressió dels canvis sense commit.
- **Correcció:** `.sp-card--onboarding :is(.sdp-alerta, strong) { overflow-wrap: anywhere; }` dins de `@layer components` (`src/css/modules.css`). Es va descartar l’opció estructural (`max-width: 100%` al cos), perquè canviava entre 19 i 53 rectangles sense cap error per davall de ~268 px CSS o amb el text ampliat (reproduït a 240×520). La regla triada no canvia cap píxel sense error. També cobrix el correu de la targeta «Correu enviat» (`OnboardingSteps.jsx:71`), que només canvia quan el correu no hi cap, és a dir, quan ja estava trencat.
- **Preexistent, fora d’abast (requires_human_decision: true):** a 375 px la PillToggle «Entrar / Crear compte» s’apila en dues files. El padding mòbil de `layout.css:583` (`@layer legacy`) perd sempre contra `components.css:871`.

### 4. Supabase 400 · no es pot entrar

- **Causa (reproduïda amb 5 fonts independents):** a les 13:49, MarIA/Antigravity va executar `npx supabase db reset` (pas 1051 de la conversa `5e9dc104`, `task-1051.log`). El missatge anterior del Mestre deia només «No va», amb una captura. MarIA va respondre «He pres el control…» i va anunciar «35 migracions» i «dades al complet», sense avisar que esborrava els comptes. Ara `auth.users`, `auth.identities` i `public.profiles` tenen 0 files, i `seed.sql` no crea cap usuari. GoTrue respon el mateix cos de 81 bytes per a un correu inexistent. El compte `e8f3386d` renovava sessió fins a les 12:59 i dona `refresh_token_not_found` des de les 13:58. Queden descartats la contrasenya, la baixa de Codex, un altre servidor i la clau pública.
- **Correcció (acció del Mestre):** registra’t tu mateix des del **teu Chrome**, no des del panell de navegador que compartim els agents. Obri `http://localhost:3340/registre`, tria «Crear compte», posa-hi el teu correu i una contrasenya teua de 10 caràcters o més. En local s’autoconfirma, i el registre cau al poble per defecte `11111111-…`, que és obert (verificat en lectura). Si vols recuperar un rol de plataforma, cal una fila a `public.user_platform_roles` que has d’escriure tu. No es pot acreditar quin rol tenies: la BD és buida.
- **Pèrdues:** el perfil, les organitzacions i el rol. Al volum d’storage sobreviuen 2 avatars i 2 logos sota l’UUID vell `e8f3386d`, sense metadades: caldrà tornar-los a pujar.
- **Missatge d’error (corregit):** l’adaptador (`src/data/supabase/auth.js`, `credencialsRebutjades`) traduïx només el 400 `invalid_credentials` de GoTrue i conserva l’original a `cause`. El vocabulari del proveïdor no ix de `src/data/supabase/` (Model B). Qualsevol altra resposta passa intacta: els casos hostils `__proto__`, altres estats i cossos que no són JSON estan provats.
- **Pendents (requires_human_decision: true):** (a) `user_already_exists`, `weak_password`, `email_not_confirmed` i `over_request_rate_limit` continuen mostrant el JSON cru, perquè `readableBackendError` (`onboardingModel.js:62-71`) llig `message` i GoTrue envia `msg`. Cal triar els textos. (b) L’app no té cap flux «he oblidat la contrasenya», tampoc a producció, i GoTrue local apunta a `127.0.0.1:3000` (no hi ha `supabase/config.toml`). (c) `supabase/.temp/start-secrets/…/docker.env` està versionat des de `db6d25d90` i conté les claus de servei per defecte de la CLI: risc baix, però cal traure’l del seguiment. (d) Norma: cap agent executa `supabase db reset` sense ordre explícita; les migracions es fan amb `npx supabase migration up`. `hooks-local.mjs` ja ho bloqueja per a Claude i Codex, però no per a Antigravity.

### 5. T13 · Empty Seed Data i prioritat de `dataMode.js`

- **Causa (reproduïda):** hi ha dos causes que s’han de donar juntes. (1) L’elecció `remote` es desava a `localStorage` sense caducitat i ningú no l’esborrava mai. A més, no calia cap clic: el muntatge de `/registre` la crida (`OnboardingSection.jsx:51-59`), i s’hi arriba per «Entrar», `/login` o la redirecció de `/el-meu-perfil` en seed. (2) En `remote`, el `.env` local demanava el tenant `0000…`, i `seed.sql` només sembra el `1111…`: tot sortia a 0. El «Connectar» del prompt és en realitat l’arribada a `/registre`: `ConnectarSection` no toca el mode. El guarda de `NotesDataContext` que citava la memòria ja estava corregit (`a555b1eda`).
- **Correcció:** l’elecció porta l’empremta del **procés** `vite` que la fa (`VITE_SDP_SERVIDOR_DEV`, que escriu `vite.config.js` i llig `dataMode.js`). Un `npm run dev` nou, o canviar `VITE_DATA_MODE`, torna a la llavor. Els reinicis que Vite fa sol no la toquen. En producció, en build, en preview i en vitest l’elecció dura com abans. Es conserva la regla anti-pestanya. Es va descartar l’opció `sessionStorage`, perquè tancava la sessió en obrir una pestanya nova (regressió D1 reproduïda). També la d’una empremta per avaluació del config: canviava amb cada edició d’un dels 14 fitxers de tooling que Vite vigila, i aquests fitxers els toquen altres agents 37 vegades al mes.
- **Tenant:** amb l’aprovació del Mestre, `.env` local ara diu `VITE_TENANT_ID=11111111-2222-3333-4444-555555555555`, i en remote es veuen les dades sembrades.
- **README i `.env.example`:** documentaven `auto`, `supabase` i `hybrid`, modes que no existixen i que es resolen en silenci com a `remote`. Ara diuen `remote`, `seed` i `local`, i expliquen la regla nova.
- **Pendents (requires_human_decision: true):** un «Tornar a la llavor» visible (cal pla, per la Llei del Píxel); si arribar a `/registre` ha de continuar canviant a remote sense cap clic; restaurar les publicacions de llavor del Mur (`feedSeed.js` té `MOCK_FEED = []` des del 24-08).

### 6. Incident de la neteja d’arrel de les 18:50

- **Fet:** `tooling/higiene/neteja_brossa_arrel.mjs`, nou i sense versionar, funcionava per llista blanca. Va moure a `.sdp-paperera/quarantena-2026-09-29T16-50-41-950Z/` tot el que no hi constava, i entre altres coses `.claude`, `.codex`, `.sdp-reflex` (clau HMAC i 84 sessions), `.immunitari`, `.iaia_auth`, `.wwebjs_auth`, `.snapshots` i `.wiki-safety`.
- **Efectes (reproduïts):**
  - Claude Code sense hooks ni skills del projecte. En esta sessió no es van executar ni SessionStart ni PreToolUse fins a la restauració.
  - Plaquetes petava cada hora amb ENOENT a `.immunitari/config.json`.
  - Time Machine avortava cada 30 minuts: el `.wwebjs_cache` en quarantena casava amb un nom de secret. Els documents 1839 i 1955 no eren a cap instantània.
  - La Porta Reflex i el pre-commit perdien l’estat.
  - `tancament --check --scope code` quedava roig per les 4 proves de `hooks-local`.
- **Unificació declarada per MarIA, contrastada amb fets:** les regles i les skills viuen a `.agents/`, i això és cert. Però Claude Code només llig hooks de `.claude/settings.json` i skills de `.claude/skills`, i Codex, de `.codex/hooks.json`. L’únic registre de hooks de `.agents/` és `.agents/hooks.json`, que es declara ell mateix «consumidor Antigravity no acreditat», i el seu format (llista de `{event, toolNames, command}`) no casa amb el que documenta el binari d’Antigravity (claus amb nom de hook i grups matcher + hooks). Per això MarIA no passa per cap porta, i per això va passar el `db reset`.
- **Restauració (decisió del Mestre):**
  1. Originals de l’script i de la skill copiats com a `.txt` dins de la quarantena.
  2. Script reescrit per llista negra: simulació per defecte i `--aplica` per a moure. Mai toca entrades amb punt, directoris ni fitxers versionats. Deixa `MANIFEST.json` amb rutes relatives i no esborra mai.
  3. Skill `core-neteja-brossa` reescrita amb les regles noves.
  4. `server.fs.deny` al servidor de desenvolupament.
  5. Restauració idempotent que s’atura davant de qualsevol conflicte, de 10 elements a l’arrel i 2 documents al workspace. La brossa real (14 fitxers solts, `.brain-*`) es queda en quarantena.
- **Resultat verificat:** Plaquetes ha tornat a escriure `cron.out` i una recepta a les 21:15. Time Machine ha fet la instantània `a9e1ecfba7`. Els hooks de Claude tornen a estar actius (vegeu Límits).
- **Exposició a la xarxa local (reproduïda i tancada):** `npm run dev` escolta a `0.0.0.0`, i Vite servia qualsevol fitxer de l’arrel, `.sdp-reflex/secret.key` inclòs, amb un 200. L’exposició existia abans de la quarantena. Ara `vite.config.js` denega l’estat local i les sessions d’eines (403, comprovat amb curl), conserva els valors per defecte i té una prova (`tests/vite-empremta-dev.test.mjs`).

### 7. Motor Cognitiu i T6

Diagnosi: la regla del Mestre només existix en prosa. `porta-olivera.mjs:72-74` accepta qualsevol pla del dia (va acceptar el 1955), `:109` bloqueja tot prompt conforme amb la plantilla v3.1.0, i qui va escriure el 1839 no va passar per cap porta. Per decisió del Mestre («pla primer»), el disseny és a [[260929_2115_pla_implementacio_motor_cognitiu]] i no s’ha implementat. Ja hi són les decisions del Mestre (el pla declara els seus prompts) i les cinc preguntes que queden obertes. Toca rutes de governança i necessita un lease.

### 8. Canvis de governança fets en este torn (cal resegellat)

Mentre els hooks estaven apagats per la quarantena, i amb autorització explícita, s’han modificat tres rutes de governança:

- `tooling/higiene/neteja_brossa_arrel.mjs` i `.agents/skills/core-neteja-brossa/SKILL.md` (decisió del Mestre de neutralitzar l’script);
- `package.json` (`test:node` afig `tests/vite-empremta-dev.test.mjs`, per T13).

Des de la restauració, `segell-auto` avisa «segell divergent». Cal reconciliar-ho amb `executor-mutacio` i un lease nou, perquè el del Reflex va caducar el 27-09.

### 9. Relleu per a `ESTAT.md` i `LEDGER.md` (el hook ho bloqueja sense lease)

Bloc proposat per a `.agents/ESTAT.md`:

```markdown
## ESTAT_ACTUAL · 2026-09-29 21:25 · Claude (Opus 5.5) · T13, T14, accés, formulari, incident de neteja i Motor Cognitiu
- Torn `torn_0530f207-9a12-4664-9be7-5ef452f66cf7`; informe [[260929_2115_auditoria_claude]]; pla [[260929_2115_pla_implementacio_motor_cognitiu]] (no implementat, pla primer).
- Fet: T14 (define + guarda AST al build lib; IIFE verificat en Chromium sense process), formulari (overflow-wrap a alerta i correu), error d'entrada traduït a l'adaptador, T13 (empremta per procés vite + tenant 1111 al .env local + README/.env.example), neteja d'arrel neutralitzada i quarantena restaurada, server.fs.deny.
- Causa del 400: `supabase db reset` de MarIA a les 13:49; el Mestre s'ha de registrar ell mateix des del seu Chrome.
- Proves: vitest 226 fitxers / 3.159 proves, 1 fallada prèvia aliena (XatSection T63.2); test:node 9 fallades prèvies alienes (skill core-neteja-brossa fora del catàleg); eslint net; tractor-persistencia i tractor-sollutia passen.
- Pendent: resegellat amb lease (neteja, skill, package.json), decisions del pla del Motor, textos d'errors de GoTrue, recompilar build:wp amb la guarda AST i VITE_* de producció abans de Sollutia.
```

Línies proposades per a `.agents/LEDGER.md`:

```markdown
260929 | torn | code | T13, T14, formulari i error d'entrada corregits; 0 fallades noves
260929 | incident | governança | neteja d'arrel per llista blanca va apartar hooks, Reflex i immunitari; restaurat
260929 | incident | dades | supabase db reset de MarIA sense ordre va buidar auth.users local
```

### Proposta d’Automillora

1. **La plantilla `prompt_local` ha de dir qui fa què amb els comptes.** Afegir un bloc fix: «Cap agent crea, esborra ni modifica comptes reals ni en tria contrasenyes; cap agent executa `db reset` sense ordre explícita.» El pla 1955 en va convidar un a fer-ho.
2. **El Preflight no pot ser autodeclarat.** Les tres caselles [x] del 1839 eren falses en dos casos. S’han de substituir per una línia que genere `document.mjs check` (pla del Motor, R-C).
3. **Criteris d’acceptació mesurables.** «Aplica padding» era una solució, no un criteri, i era errònia. Millor: «camps i alerta dins de la targeta a 375 i 1440 px, amb l’error real».
4. **Un canal que MarIA no puga saltar.** La solució no és una regla en prosa, sinó `.agents/hooks.json` en el format que Antigravity llig de veres. Cal verificar-ho a Antigravity mateix.
5. **Restaurar hooks canvia el règim a mitja sessió.** Claude Code recarrega `.claude/settings.json` en calent. A partir d’eixe moment ni els agents ni els workflows poden executar builds ni lint. Qualsevol restauració de hooks s’hauria de fer al final del torn, o amb lease a punt.
6. **Neteges amb simulació primer.** Cap script d’higiene hauria de moure res sense una execució prèvia que llistre què faria, i el Mestre hauria de veure eixa llista.
7. **Tall congelat per a auditories.** Totes les cites d’esta auditoria s’han fet sobre un tall de les 20:03, i un revisor va detectar a mitja execució una edició concurrent de `vite.config.js`. És un pas que convé incorporar a la plantilla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Diagnosi (6 investigadors, 12 escèptics) | Les 6 causes confirmades, 2 d’elles amb correccions de detall. Solucions recomanades acceptades amb canvis, que s’han aplicat |
| Vitest sencer al viu (pegat abans de les esmenes finals) | 226 fitxers i 3.159 proves: 3.158 passen. 1 fallada prèvia i aliena (`XatSection.test.jsx` T63.2, mock sense `XatContext`), igual al tall |
| Vitest dirigit després de les esmenes | `npx vitest run src/config/dataMode src/data/supabase/auth src/sections/onboarding tests/onboarding src/css`: 10 fitxers i 173 proves verdes |
| `node --test` dirigit | `tests/standalone-build.test.mjs tests/vite-empremta-dev.test.mjs`: 13 de 13 |
| `npm run test:node` | 9 fallades prèvies i alienes a `backend_consolidacio` («Skill no activa o identitat divergent: core-neteja-brossa»), idèntiques al tall |
| ESLint dels fitxers del pegat | 0 missatges (abans dels hooks). El script de neteja nou també és net |
| Portes de lectura | `tractor-persistencia` i `tractor-sollutia` passen. `tractor-vocabulari` falla amb una eixida idèntica a la del tall |
| Mutació de les proves (revisor) | Tornant cada fitxer al tall, la seua prova nova falla: les proves discriminen |
| T14 en Chromium real | Pàgina d’amfitrió genèric sense `process`: paquet vell → `ReferenceError`; paquet nou → `SocDePoble` objecte, element registrat, app pintada, 0 errors |
| T13 al servidor real | Una elecció `{v:1, mode:'remote'}` d’abans resol `seed`; «Entrar» desa l’elecció amb l’empremta del procés 2577 |
| Formulari al servidor real | Petició només a `localhost:54321` (400) amb un correu inventat; alerta en valencià; 57 px de marge a 830 px i 45 px a 375 px; sense desbordament |
| Exposició de fitxers | `secret.key`, `.claude/`, `.sdp-paperera/`: 403. `.env.local`: 403. `AGENTS.md` i l’app: 200 |
| Restauració | Plaquetes torna a fer receptes (21:15); Time Machine, instantània `a9e1ecfba7` |
| Documents | `node tooling/wiki/document.mjs check` del pla: `valid: true` |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Build final amb la guarda AST no executat.** Des de les 21:14 el hook bloqueja `npm run build:wp` i `eslint`. El paquet de `wordpress-plugin/dist` és el de les 20:59, verificat i equivalent en producció, perquè la guarda nova només canvia la comprovació. La guarda AST està provada amb el mateix analitzador de Rollup (`rollup/parseAst`). El Mestre ha d’executar `npm run build:wp` una vegada.
- **ESLint** no s’ha tornat a passar sobre les esmenes posteriors a les 21:14 (`auth.js`, les proves i la guarda), pel mateix bloqueig.
- **WordPress real no provat:** WordPress Studio (`~/Studio/socdepoble`) té el plugin vell `soc-de-poble` de l’agost, no `socdepoble-enxufe`. S’ha provat amb una pàgina d’amfitrió genèric en Chromium.
- **Antigravity:** no s’ha pogut verificar què executa de veres. El format de hooks s’ha llegit de la documentació incrustada al seu binari.
- **`ESTAT.md`, `LEDGER.md` i `tancament.mjs`** queden bloquejats pel hook sense lease. El relleu és al punt 9.
- **L’autoria del 1839** per MarIA és una hipòtesi coherent, no provada. La del `db reset` sí que està provada (transcripció d’Antigravity).
- Cap agent ha tocat el compte del Mestre ni cap contrasenya real. Les entrades de prova han usat correus inventats `@example.test` i `@example.invalid`, i sempre contra `localhost`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260929_2115_pla_implementacio_motor_cognitiu]]
- [[260929_1839_prompt_claude_auditoria_visual]]
- [[260929_1955_pla_implementacio_auditoria]]
