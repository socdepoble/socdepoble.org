---
tipus: informe
estat: generat
description: Auditoria extrema de l'estructura, SEO, A11y i integració Sollutia amb matrius DAFO. Només lectura, cap línia de codi tocada.
tags:
  - sollutia
  - arquitectura
---

# Informe — Auditoria Global: Estructura, A11y, SEO i Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-02 (el 01 l'ocupa l'informe paral·lel de Codex, [[260918_0128_INFORME_Auditoria_Global]]) |
| Respon a | [[260918_0114_PROMPT_Auditoria_Sollutia_Estructura]] (SDP-PROMPT-260918-02) |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 01:31 |
| Modificació | 2026-09-18 01:31 |
| Agent redactor | Claude Code (Fable 5.1), com a auditor del [[Consell de la Petorreta]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-18 |
| Revisió pendent | sí |
| Branca / commit auditat | `backup-notes-publish` · `4094575b` (arbre amb canvis locals no commitats a `.agents/` i `.immunitari/`) |
| Abast | només lectura. Cap fitxer de codi modificat, afegit ni esborrat. |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0114_PROMPT_Auditoria_Sollutia_Estructura]]
- [[260917_1248_INFORME_Auditoria_Extrema_Codex]]
- [[260917_0810_INFORME_ENLLAC_SOLLUTIA]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[pedra_seca]]

## Dictamen executiu

La façana visual aguanta; les canonades de dades i d'exposició cap enfora no. Cinc aturadors, per ordre de gravetat:

1. **El SEO dinàmic està mort per configuració.** `useSEO` retorna sense fer res a tots els desplegaments actuals, perquè el Web Component fixa `manageDocumentHead = false` per defecte i cap arrencada el posa a `true`. Onze vistes criden el hook i cap d'elles canvia mai el títol, el canonical, l'OG ni el `noindex` del 404.
2. **La sessió no pot renovar-se ni resoldre el rol.** `SessionProvider` crida `refrescaSessio()` i `elMeuRol()` sense la configuració de la instància; el backend Supabase, sense URL, retorna `false` (i tanca la sessió) o `'usuari'`. Conseqüència estàtica: en caducar el JWT l'usuari és expulsat en compte de renovat, i `/admin` i `/realitat` són inabastables per a tothom. Ja ho va assenyalar Codex (P1) i continua obert.
3. **Dos models d'integració amb Sollutia conviuen sense negociació.** L'ADR accepta el Model B (Sollutia només lectura via Frontissa) i cita un `client.js` que no existix; `host.js` continua obrint el port al Model A (injecció total del backend), i el mock oficial és Model A. La porta que ho vigila passa amb una única fixture sintètica.
4. **El manifest SEO governa rutes que React resol com a 404 i el seu únic consumidor real ha desaparegut.** `seo-routes.json` declara 24 rutes indexables (xat, notes, multimèdia, projecte… com a primer nivell); React només exposa `/mur`, `/mercat` i `/pobles` com a públiques de primer nivell. El fitxer PHP que el consumia no és al repositori. `porta:seo` valida un artefacte orfe.
5. **L'accessibilitat és bona a la base, però la promesa «AAA a tot arreu» no és certa i no hi ha cap verificació mecànica.** Contrast real de `--sdp-text-suau` sobre `--sdp-fons-app` en mode clar: 6,41:1 (AA, no AAA). El callback OAuth usa el blau vell `#0984E3` (3,87:1 amb blanc). Cap regla `jsx-a11y`, cap test axe, cap suport de `prefers-contrast`/`forced-colors`.

La Llei de l'Enxufabilitat es complix **mecànicament** (el port és l'única porta; `tractor-enxufe` en verd) però **no semànticament**: la configuració no arriba a tots els proveïdors, la frontera UI/dades no és consistent i el contracte documental amb Sollutia està repartit entre tres documents que es contradiuen.

## Contracte de realitat i abast

- Font de veritat: l'arbre de treball actual. `manifest.json:2-4` (`SDP-BUNDLE-v3.0`, `2026-09-15T04:10:56Z`) és anterior en tres commits al HEAD auditat i Codex ja va documentar-ne la deriva (58 rutes mortes, 36 no declarades). Per tant cite rutes del repositori, no del manifest, i ho declare ací en lloc d'ocultar troballes.
- Tot el que no s'ha executat en navegador es marca [SUPÒSIT]. Les lectures estàtiques es citen `ruta:linies`.
- Cap eina de xarxa. Cap escriptura fora d'este informe, l'ancoratge a l'índex de l'Escriptori i l'`ESTAT.md`.

## Bateria mecànica executada

| Comprovació | Resultat | Lectura |
| --- | --- | --- |
| `porta:enxufe` (E1–E4) | passa | El port és l'única porta; contracte sincronitzat; segellat fora del cicle de vida. |
| `porta:frontera` (S1, S3, S4) | passa | Sense variables òrfenes ni ordre circular; S2 (instància única) retirat. |
| `porta:adaptadors` (Frontissa) | passa | «1 contracte capturat validat»: una sola fixture, sintètica. Vegeu S-01. |
| `porta:frontera-auth` (A1–A6) | passa | No prova sufixos `endsWith` ni `http://localhost` en producció. Vegeu S-03. |
| `porta:seo --verifica` | passa | Compara recomptes, no correspondència amb les rutes React. Vegeu SEO-02. |
| `porta:rls` | 2 troballes | R2 `private.ajustos` (grants revocats a `260908_0000_initial_schema.sql:21`); R3 `profiles read own` de `260911_0600` reemplaçada a `260912_1500_correccio_privacitat_perfils.sql:15-17`. La porta no calcula l'estat efectiu. |
| `porta:innerhtml` | passa | 4 usos de `dangerouslySetInnerHTML`, tots sanejats. |
| `porta:inlinestyles` | 2 violacions | `src/components/universal/UniversalEditorShell.jsx:152,154`. |
| `porta:persistencia` | passa | 173 fonts, 0 infraccions. |
| `eslint src` | 0 errors · 37 avisos | Sense regles d'accessibilitat (no hi ha `jsx-a11y`). |
| `vitest run` | 10 fitxers · 44 proves · verd | Cap prova d'accessibilitat ni de SEO. |

No he executat `npm run build` ni `npm run porta` sencer: escriuen artefactes (tokens, SEO, RAG, `dist`) i això trenca el contracte de només lectura.

---

## 1 · Connectivitat i Sollutia

### S-01 · P1 · Model A i Model B conviuen; el Model B no existix al codi

**Evidència**
- `_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md:24-40` decidix Model B i cita `src/data/adaptadors/sollutia/client.js:16,29-33` i `ESCRIPTURES_PERMESES`.
- `src/data/adaptadors/sollutia/` conté només `recursos.js:1-8`, un `passthrough` que retorna el payload sense traduir res («De moment passthrough per satisfer la porta»). No hi ha `client.js`.
- `src/host.js:110-145` (`configura({ backend })`) continua acceptant una implementació sencera del contracte: això és Model A. `tooling/mocks/sollutiaBackend.js:9-58` és un backend Model A complet.
- `_wiki_de_poble/02_saber/estandard_integracio_react.md:31-55` documenta `window.SocDePoble.deferArrenca()`, que no existix a `src/` (0 ocurrències). El mecanisme real és l'atribut `arrencada="manual"` (`src/host.js:237-243`, `src/main.jsx:35-40`).
- `tooling/gates/run-portes.mjs:22` anomena «Porta Frontissa» però executa `tractor-adaptadors.mjs`; el `tractor-frontissa.mjs` que l'ADR declara pendent no existix.
- `tooling/gates/tractor-adaptadors.mjs:43-57` (F3) valida fixtures de `tests/frontissa/fixtures/sollutia/`; n'hi ha una, `perfil.json`, amb `"email": "prova@sollutia.com"` i `uuid` nul. [SUPÒSIT] No és una captura real de l'API de Sollutia sinó una forma inventada.

**Font de veritat en conflicte:** ADR (Model B) vs `host.js` + mock + manual d'integració (Model A). AGENTS.md §8 exigix un sol contracte clar.

**Proposta conservadora:** decisió humana. O bé (a) es revoca formalment l'ADR i es versiona el Model A com a contracte únic (`CONTRACTE_BACKEND` + `configura()`), o bé (b) s'implementa el Model B de punta a punta (client GET-only, traductors reals, fixtures capturades) i es tanca `configura({backend})` fora de desenvolupament. En qualsevol cas: un sol document d'integració per a Sollutia, no tres.

`requires_human_decision: true`

### S-02 · P1 · La sessió no rep la configuració: renovació i rol degradats en silenci

**Evidència**
- `src/app/contexts/SessionContext.jsx:36-40` crida `refrescaSessio()` sense arguments; `:81-86` crida `elMeuRol()` sense arguments.
- `src/data/supabase/auth.js:11-15`: `renova(config = {})` → `getResolvedConfig({})` → `supabaseUrl` buit → `return false`. `SessionContext.jsx:39`: si `!ok` → `logout()`.
- `src/data/supabase/auth.js:48-55`: `elMeuRol` → `request(..., {})` → `src/data/supabase/runtime.js:45-46` llança «Falten VITE_SUPABASE_URL» → `catch` → `'usuari'`.
- `src/data/supabase/runtime.js:26-33`: `getResolvedConfig` només llig del paràmetre; no hi ha cap fallback global. La configuració viatja com a prop des de `src/main.jsx:42-48` → `PedraSecaEmbed.jsx:430` → `App.jsx:427-433` (només a Core, Mur, Notes, Xat, Multimèdia). `SessionProvider` i `IdentitatProvider` es munten **fora** d'`App` (`src/PedraSecaEmbed.jsx:60-66`) i no la reben.
- `src/sections/admin/AdminSection.jsx:65,116`: `adminListUsers()` i `adminListOrganizations()` també sense config.
- `src/app/App.jsx:524,545`: `/admin/*` i `/realitat` exigixen `rol="superadmin"`; `RequireAuth.jsx:43-45` mostra «Accés restringit» si `rolActual !== rol`.

**Conseqüència** [SUPÒSIT, lectura estàtica no executada en navegador]: 60 segons abans de la caducitat del JWT (`MARGE_RENOVACIO_MS`, `identitat.js:196`) l'usuari és expulsat. Cap compte pot entrar a Administració ni a Realitat. El backend degrada sense cap error visible.

**Proposta conservadora:** la configuració del backend ha de quedar lligada al boot (`host.js:arrenca()`) i ser llegible des de qualsevol mòdul de `src/data/` sense passar-la per props; o, mínimament, `SessionProvider` ha de rebre `config` i propagar-la. Cap degradació silenciosa en operacions de sessió o administració.

### S-03 · P2 · Allowlists: igualtat exacta en un lloc, sufixos i `http` en els altres

**Evidència**
- `src/PedraSecaEmbed.jsx:166-191`: `ORIGENS_PERMESOS` compara per `origin` exacte. **Resol el P0 de Codex** (URL de Supabase arbitrària). Però inclou `http://localhost:*` i `http://127.0.0.1:*` sense guarda `DEV`: al bundle de producció continuen sent orígens vàlids per a `supabaseUrl`.
- `src/host.js:308-315` i `src/data/oauthRelay.js:290-297`: `endsWith('.socdepoble.org')`, `endsWith('.sollutia.cat')`.
- `public/auth/callback.html`: el comentari de capçalera promet «`ORÍGENS_PERMESOS` es compara amb `===`. Mai amb `startsWith`»; la funció `esOrigenPermes` compara amb `h.endsWith('.socdepoble.org')` i accepta qualsevol `localhost` per `https` o `http`.
- `tooling/wiki/tractor-frontera-auth.mjs` (A2 «COMPARACIO-FLUIXA») passa: no detecta `endsWith`.

**Proposta conservadora:** un únic manifest d'orígens (`scheme + host + port`) importat pels tres punts, sense sufixos, i entrades `localhost` només sota `import.meta.env.DEV`. Ampliar A2 perquè detecte `endsWith`.

### S-04 · P1 (decisió) · Tokens en `sessionStorage` compartit amb l'amfitrió

**Evidència:** `src/data/identitat.js:58-60,131-136`; `src/config/storage.js:60-75`. El propi fitxer ho documenta com a decisió conscient (`identitat.js:43-48`) i el `README.md:152-159` apunta l'alternativa (galeta `httpOnly` servida per Sollutia).

**Lectura:** en Model B (Web Component al mateix origen que Sollutia) qualsevol script del CMS llig JWT i refresh token. El Shadow DOM tancat (`PedraSecaEmbed.jsx:286`) aïlla DOM i CSS, no JavaScript. No és un defecte de codi: és una decisió d'arquitectura que la integració amb Sollutia obliga a revisar.

`requires_human_decision: true`

### S-05 · P2 · Contracte d'entorn no versionat

**Evidència**
- `src/host.js:352-361` exigix `VITE_SOLLUTIA_ISSUER` com a fallback obligatori per a acceptar sessions de l'amfitrió; `src/hooks/useSEO.js:23,60` usa `VITE_CANONICAL_URL`; `src/main.jsx:47` usa `VITE_TENANT_ID`.
- `.env.example:1-4` només declara `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` i `VITE_DATA_MODE`.

**Proposta:** documentar les cinc variables a `.env.example` amb el seu efecte de seguretat; `VITE_SOLLUTIA_ISSUER` és una precondició d'integració que Sollutia ha de conéixer (vegeu Incògnites).

### S-06 · P2 · El port fusiona implementacions en reintentar

**Evidència:** `src/data/backendPort.js:8-27` (`setBackendImplementation` escriu sobre `currentImpl` existent); `src/host.js:182-186` (una arrencada fallida reinicia `fase` i `_segellat`, no `currentImpl`). Codex P1, continua obert. La política «fallback híbrid prohibit» (`host.js:165-168`) es pot esquivar en un segon intent.

**Proposta:** construir candidat nou, validar, substituir atòmicament; descartar íntegrament si falla.

### S-07 · Constricció declarada · Un sol backend per document

`src/data/supabase/config.js:30-35` llança «Col·lisió de configuració» si dues instàncies demanen URLs diferents, però només al camí `getClient()` (supabase-js). El camí `request()` (`runtime.js:43-53`) usa la config de cada crida amb el JWT global. `PedraSecaEmbed.jsx:258-266` permet instàncies simultànies. Mitigació parcial del P0 de Codex «fuga de sessió entre instàncies». Cal declarar-ho a Sollutia com a límit: **un backend per pàgina**.

### S-08 · Fortaleses verificades

- Contracte explícit i congelat: `src/data/contracte.js:2-62`; `asseguraMetode` fail-closed (`backendPort.js:51-56`).
- Cap mòdul fora de `src/data` importa Supabase; l'únic import és el diferit de `src/host.js:169` (arrencada per defecte).
- Segellat fora del cicle de vida del Custom Element (`host.js:154-191`); `PedraSecaEmbed.jsx:323-329` ho recorda.
- Aturador `service_role` als **dos** builds: `vite.config.js:9-17` i `vite.standalone.config.js:9-16`. **Resol el P0 de Codex.**
- `frame-ancestors` acotat a dominis propis i de Sollutia: `vercel.json:6-8`, `vite.config.js:26-28`.
- Sessió de l'amfitrió fail-closed sense signatura però amb `exp`, `sub`, `iss`, `aud` i metadades filtrades: `src/data/identitat.js:243-296`. Delegació honesta a la RLS.
- Bus d'esdeveniments cap a l'amfitrió (`sdp-auth-change`, `sdp-navega`, `sdp-error`) reemés amb `composed: true`: `PedraSecaEmbed.jsx:269-283`.

### S-09 · Deriva documental interna

`src/data/supabase/README.md:36-48` encara explica la migració des de `supabaseBackend.js` (fitxer inexistent) i deixa el bloc de tests buit. No és perillós; és soroll per a la següent IA.

---

## 2 · SEO

### SEO-01 · P0 · `useSEO` no s'executa mai als desplegaments actuals

**Evidència**
- `src/PedraSecaEmbed.jsx:391-393`: si `manageDocumentHead` no ve definit, es fixa a `false`. `:155-158` el manté a `CLAUS_PERMESES`, i `:414` el congela a `this._config`.
- `src/PedraSecaEmbed.jsx:49-56,60`: `uiConfig` (amb `manageDocumentHead: false`) és l'`externalConfig` d'`UIProvider`.
- `src/hooks/useSEO.js:14-18`: `shouldManageHead = externalConfig?.manageDocumentHead !== false && …` → `false` → `return` abans de tocar el `<head>`.
- `src/main.jsx:42-48`: la config d'arrencada standalone no inclou `manageDocumentHead`. Cap fitxer de `public/` ni `index.html` el fixa.
- Onze vistes criden el hook: `MurSection.jsx:27`, `MercatSection.jsx:16`, `PoblesSection.jsx:13`, `PoblacioSection.jsx:13`, `MultimediaSection.jsx:18`, `XatSection.jsx:36`, `DevicesSection.jsx:36`, `TextSection.jsx:22`, `ItemDetailSection.jsx:32`, `PageDetailSection.jsx:22`, `NotFoundPage.jsx:10-14`.

**Conseqüència:** a `socdepoble.org` el títol és sempre «Sóc de Poble», no hi ha `canonical`, `hreflang`, `og:url` ni JSON-LD per pàgina, i el 404 mai declara `noindex`. Tot el SEO efectiu és el bloc estàtic d'`index.html:5-41`. El hook, ben construït, és codi mort per un valor per defecte. [SUPÒSIT] la intenció era «no tocar el `<head>` de Sollutia per defecte»; el preu ha sigut perdre'l també a casa.

**Proposta:** per defecte `manageDocumentHead = true` quan el component és l'únic contingut del document (arrencada standalone de `main.jsx`) i `false` només quan l'amfitrió ho demana o `window.self !== window.top`. Afegir una prova que munte `MurSection` i comprove `document.title`.

### SEO-02 · P1 · El manifest SEO i les rutes React diuen coses diferents, i el consumidor ha desaparegut

**Evidència**
- `wordpress-plugin/dist/seo-routes.json` (generat 2026-09-17): 31 rutes, 24 indexables, entre elles `xat`, `notes`, `multimedia`, `projecte`, `constitucio`, `roadmap`, `versions`, `legal`, `poblacio` com a primer nivell amb `status: 200`.
- `src/app/App.jsx:518-521`: rutes públiques de primer nivell: `/mur`, `/mercat`, `/pobles`. `App.jsx:534,537-541,546`: `/projecte`, `/skills`, `/constitucio`, `/disseny`, `/roadmap`, `/ia` redirigixen a `/jo/…`. `/xat`, `/notes`, `/multimedia`, `/poblacio` de primer nivell cauen a `*` → `NotFoundPage` (`App.jsx:552`). `/legal` i `/versions` sí existixen (`:540,543`).
- `tooling/gates/build-seo-manifest.mjs:5-8,93` declara com a consumidor `wordpress-plugin/inc/sdp-seo.php`; no hi ha cap fitxer `.php` al repositori (`wordpress-plugin/` només conté `dist/`). Els altres «consumidors» són portes que el verifiquen, no runtime.
- `public/sitemap.xml` és estàtic: 4 URLs (`/`, `/mur`, `/mercat`, `/pobles`). `public/robots.txt` permet tot, inclosos `/jo/*` i `/e/*`.

**Lectura:** `porta:seo` (`build-seo-manifest.mjs:246-259`) compara **recompte** de rutes, no correspondència amb React. Dona verd a un artefacte que cap runtime llig i que descriu una topologia que no és la de l'app.

**Proposta:** una sola font de rutes públiques (derivada d'`App.jsx` o d'un registre de rutes que `App.jsx` consumisca), generar `sitemap.xml` des d'eixa font, i que la porta verifique que cada ruta indexable resol a un component real. Retirar el manifest del plugin WordPress o recuperar-ne el consumidor, però no les dues coses a mitges.

### SEO-03 · P2 · Contingut duplicat per actor i home privada

**Evidència**
- `App.jsx:519` (`/mur`) i `App.jsx:567` (`jo/mur`, `e/:slug/mur`) pinten el mateix `MurSection`. Amb `useSEO` actiu, el canonical es calcula a partir de `window.location.pathname` (`useSEO.js:60-63`): cada variant seria canònica de si mateixa.
- `App.jsx:512`: `/` → `/jo/xat` (`DEFAULT_SECTION_PATH`, `sections.js:34`). La portada per a un rastrejador és un xat personal.
- `useSEO.js:75-88`: `hreflang` per `?lang=xx`, però `RouterContext.jsx` no llig cap paràmetre `lang` i `UIContext.jsx:19-28` tampoc. Cinc URL alternatives que pinten la mateixa pàgina.

**Proposta:** canonical explícit cap a la ruta pública (`/mur`) des de les vistes d'actor, `noindex` a `/jo/*` i `/e/*`, i que `/` aterre en contingut públic per a visitants no autenticats. Retirar `hreflang` fins que la ruta reflectisca l'idioma.

### SEO-04 · P3 · Detalls del cap estàtic

- `index.html:8` `description`: «una estructura neta, simple i mantenible per a la xarxa pública del poble» (llenguatge de desenvolupador) vs `og:description` `:15`: «la xarxa pública del poble».
- `index.html:5` `theme-color: #fff4ef` no coincidix amb `--sdp-fons-app` (`tokens.css:104` → `--sdp-pedra-150` `#f3f0ec`). El comentari de `tractor-sollutia.mjs:17-20` ja apuntava este desajust.
- JSON-LD `WebSite` correcte (`index.html:26-41`); `noscript` present (`:62-67`); `vercel.json:13-18` reescriu tot a `index.html` (200 universal → 404 tou fins que SEO-01 no es resolga).

### SEO-05 · Fortaleses

`useSEO.js` cobrix títol, descripció, robots, OG, Twitter, canonical, hreflang i JSON-LD amb neteja de `</` (`:123`). `NotFoundPage.jsx:10-14` declara `index: false`. Tot això és aprofitable el dia que s'active.

---

## 3 · Accessibilitat (A11y)

### A-01 · Fortaleses verificades (base sòlida)

- Marques de regió: `<nav aria-label>` (`App.jsx:240`, `:615`), `<main id="main-content" tabIndex="-1">` (`:296-301`) amb `aria-busy`, `<header>` (`:337`).
- Focus a `main` en cada canvi de ruta (`App.jsx:90-95`); `prefers-reduced-motion` respectat a les transicions (`:327-333`, `:630-636`).
- Botons d'icona amb `aria-label` i `title` (`App.jsx:349-366`); icones `aria-hidden` + `focusable="false"` de manera sistemàtica.
- Pedra Seca: `<dialog>` natiu amb `aria-labelledby`, retorn de focus i tractament d'Escape (`Dialeg.jsx:12,40,47-49,63-69`); pestanyes ARIA completes amb `tabIndex` rotatori (`Pestanyes.jsx:35-52`); formularis amb `label[for]`, `aria-describedby`, `aria-invalid`, `role="switch"` (`formulari.jsx:34-37,56-57,148`); avisos `role="alert" aria-live="assertive"` (`AvisadorEfimer.jsx:20-21`); estat de càrrega `role="status"` (`RequireAuth.jsx:8-9`).
- Columnes plegades marcades `inert` (`AppGridShell.jsx:188,206,224`).
- 38 regles `:focus-visible` i 7 blocs `prefers-reduced-motion` a `src/css/`. Mínim tàctil 44 px (`design-tokens.json:22-27`).
- Totes les `<img>` revisades porten `alt` (`PageFrame.jsx:203-206`, `detailSectionMeta.jsx:28-30`, `UniversalEditorShell.jsx:253-255`, `RealitatSection.jsx:109-112`).
- `lang` sincronitzat a l'arrel del component en canviar d'idioma (`App.jsx:148-155`).

### A-02 · P2 · La promesa de contrast està sobredimensionada

`src/css/tokens.css:109-112` afirma «Text — TOT compleix AAA (≥7:1) sobre la seua superfície» i anota `--sdp-text-suau` 7,24:1. Els valors anotats estan mesurats sobre blanc; la superfície real del visor és `--sdp-fons-app` → `--sdp-pedra-150` `#f3f0ec` (`tokens.css:104`). Ràtios calculades (WCAG 2.x, luminància relativa):

| Parell (tema clar) | Ràtio | Nivell text normal |
| --- | --- | --- |
| `--sdp-text-cos` #3d3b35 / fons-app #f3f0ec | 9,86:1 | AAA |
| `--sdp-text-suau` #5b564e / fons-app #f3f0ec | **6,41:1** | AA (no AAA) |
| `--sdp-accent-text` #ad4c03 / fons-app | 4,85:1 | AA (anotat 5,51 sobre blanc) |
| `--sdp-sobre-accio` #fff / `--sdp-accio` #016ebf | 5,27:1 | AA |
| `--sdp-sobre-accent` #0e0d0c / `--sdp-accent` #FF7300 | 7,12:1 | AAA |
| blanc / `--sdp-accent` #FF7300 (si algú posa text blanc sobre taronja) | **2,73:1** | falla |
| `--sdp-vora-control` #8b857b / fons-app | 3,22:1 | 1.4.11 passa (marginal; anotat 3,66) |
| `--sdp-text-desactivat` #8b857b / fons-app | 3,22:1 | exempt (desactivat) |

| Parell (tema fosc) | Ràtio | Nivell |
| --- | --- | --- |
| `--sdp-text-cos` #efece7 / fons-app #0e0d0c | 16,48:1 | AAA |
| `--sdp-text-suau` #dcd7cd / fons-app | 13,54:1 | AAA |
| `--sdp-accent-text` #ff955b / fons-app | 8,97:1 | AAA |
| `--sdp-accio-text` #96c9ff / fons-app | 11,18:1 | AAA |
| `--sdp-vora-control` #8b857b / fons-app | 5,31:1 | passa |

**Fora del sistema de disseny:** `public/auth/callback.html` declara `--sp-blau: #0984E3` (el blau que `design-tokens.json:15-18` va retirar per accessibilitat) i pinta el botó «Tornar a provar» blanc sobre eixe blau: **3,87:1**, per sota d'AA per a text normal (passa només com a text gran perquè és 18 px negreta). La pàgina d'error d'autenticació és, precisament, la que veu una persona confosa.

**Lectura:** AA es complix a tota la interfície en mode clar i AAA a tot el mode fosc. El que no és cert és «AAA a tot arreu», i el manual per a Sollutia (`estandard_integracio_react.md`, LLEI 4) promet només AA, que sí que es complix. Cal alinear el comentari de `tokens.css` amb la realitat i portar el callback als tokens vius.

### A-03 · P2 · Estat dels commutadors de barra lateral no exposat

`App.jsx:241-247` i `:338-344`: els botons que obrin/tanquen la barra lateral manipulen classes via `querySelector` i no porten `aria-expanded` ni `aria-controls` (0 ocurrències a `App.jsx`). Un lector de pantalla no sap si el menú està obert.

### A-04 · P3 · Sense enllaç «Salta al contingut»

`.sr-only` existix (`base.css:229`) però cap enllaç de salt. El focus automàtic a `main` (`App.jsx:90-95`) ho mitiga en navegar, no en la primera càrrega.

### A-05 · P3 · Controls no natius

- `PageFrame.jsx:73`: `<div className="toc-overlay" onClick={onClose}>` (vel de la taula de continguts) sense equivalent de teclat; el botó de tancar `:77` sí que en té.
- `UniversalEditorShell.jsx:253-257`: `<img onClick={logoHandler.startEdit}>` com a control d'edició, sense rol de botó ni teclat.

### A-06 · P2 · Cap verificació mecànica d'accessibilitat

- `package.json` `devDependencies`: no hi ha `eslint-plugin-jsx-a11y`; `eslint.config.js` no en configura cap regla.
- `tests/`: cap prova amb axe ni asserts d'ARIA. 44 proves verdes, zero d'accessibilitat.
- 0 regles `prefers-contrast` / `forced-colors` a `src/css/`. Per a un públic major, el mode d'alt contrast del sistema operatiu és un cas real.
- `App.jsx:452-459` i `:483-492`: les pantalles d'error mostren `error.stack` a l'usuari final. No és un defecte d'accessibilitat estricte, però és un mur de text tècnic per a la persona que menys eines té per entendre'l, i filtra rutes internes.

---

## 4 · Coherència estructural (UI Pedra Seca vs lògica)

### E-01 · Fortalesa · El port és l'única porta

`tractor-enxufe` E1 en verd; l'únic import de `data/supabase` fora de `src/data` és el diferit de `host.js:169`. `src/components/PedraSeca/**` no importa cap mòdul de dades.

### E-02 · P2 · La frontera vista/dades no és consistent

Tretze fitxers de `src/sections` importen `backendPort.js` directament. Set són contexts (`MurContext`, `XatContext`, `NotesContext`, `NotesDataContext`, `MultimediaContext`, `PerfilContext` i la prova), que és el lloc previst. Sis són **vistes**: `NotesEditor.jsx`, `DetallAjust.jsx`, `OnboardingSection.jsx`, `ControlSection.jsx`, `AdminSection.jsx`, `AgendaSection.jsx`. Una vista que parla amb el port sense passar pel context és la que després no rep la configuració (vegeu S-02 amb `AdminSection.jsx:65,116`).

**Proposta:** norma mecànica nova a `tractor-enxufe` (E5): només `src/data/**`, `src/app/contexts/**` i `src/sections/**/*Context.jsx` poden importar `backendPort.js`.

### E-03 · P2 · El kit Pedra Seca depén del router de l'app

`src/components/PedraSeca/organismes/UniversalCard.jsx:23` (`useNavigate`, `Link`), `molecules/Botonera.jsx:2`, `organismes/navegacio.jsx:10` importen `app/contexts/RouterContext`. El kit no és extraïble a un altre amfitrió (Sollutia amb el seu propi router) sense arrossegar el `RouterContext`. Coherent amb «llibreria React autònoma» (`estandard_integracio_react.md`, LLEI 1) només mentre el router viatge dins del bundle.

**Proposta:** el kit rep `href`/`onNavigate` per prop o per un context `Navegacio` mínim propi, i l'app el proveïx.

### E-04 · P1 (arrel de S-02) · Dos arbres de proveïdors, una sola config

`PedraSecaEmbed.jsx:59-66` munta `UIProvider → SessionProvider → IdentitatProvider → App`; `App.jsx:427-433` munta els proveïdors de dades **dins** amb `config`. La configuració existix en dos mons: `externalConfig` (UI) i `config` (dades), i `SessionProvider` no viu en cap dels dos. El defecte S-02 és estructural, no un oblit puntual.

### E-05 · P3 · Llavors i lògica de negoci dins de l'adaptador

- `src/data/supabase/runtime.js:78-91`: `mapContentRowsToData` fusiona `APP_SEED.noteFolders`/`APP_SEED.notes` amb les files remotes i filtra «fantasmes» per identificadors i noms literals. És lògica de negoci (què és una carpeta legítima) dins de l'adaptador de transport.
- `src/data/sectionContent.js:22-28`: `GLOBAL_SEARCH_ITEMS` s'alimenta de llavors estàtiques, no del backend.
- Valors per defecte cablejats: poble `'La Torre de les Maçanes'` a `auth.js:67` i `mapejadorSeccions.js:54`.

Això és el que fa difícil respondre la Incògnita del prompt (mocks vs API real): la frontera entre «llavor de demostració» i «dada de Sollutia» no està traçada al codi.

### E-06 · P3 · Estils en línia i deute de lint

`porta:inlinestyles` para a `UniversalEditorShell.jsx:152,154` (`display`, `flex`). 37 avisos d'ESLint (variables sense ús). No compromet Pedra Seca, però la cadena `build` (`package.json` → `gate`) no està en verd net.

### E-07 · Fortalesa · Sanejament centralitzat

`src/utils/sanitize.js` (DOMPurify) governa `dangerouslySetInnerHTML` (4 usos, porta en verd) i `permetOrigenMitjans` a `runtime.js:30`. El mapejador `mapejadorSeccions.js:17-29` bloqueja `//` i protocols no HTTP.

---

## 5 · Estat de les troballes de Codex (260917_1248)

| Troballa Codex | Estat hui | Evidència |
| --- | --- | --- |
| P0 `supabaseUrl` arbitrari | **Resolt** | allowlist `PedraSecaEmbed.jsx:166-191` |
| P0 CSS remot `fontsHref` | **Resolt** | `FONTS_PERMESES` `PedraSecaEmbed.jsx:173,193-197` |
| P0 tokens a `sessionStorage` same-origin | Obert (decisió) | S-04 |
| P0 fuga de sessió entre instàncies | Parcial | S-07 |
| P0 `service_role` al build WP | **Resolt** | `vite.standalone.config.js:9-16` |
| P1 sessió externa sense emissor fixat | Parcial | `host.js:352-361` (fallback a env; el missatge encara pot aportar-lo) |
| P1 allowlist per sufixos | Obert | S-03 |
| P1 Model B no implementat | Obert | S-01 |
| P1 backend híbrid en reintent | Obert | S-06 |
| P1 config perduda en refresh/rol/admin | Obert | S-02 |
| CSS estructural fora del Shadow DOM | **Resolt** | `src/css/index.css:64-65` |
| Contracte de Notes (`obriConfiguracioNotes`, `informaError`) | Obert | `NotesSection.jsx:23-25,95` vs `NotesContext.jsx:188-197` (exposa `status` i `error`, no els altres dos) |
| `JSON.parse` d'esborranys | **Resolt** | 0 ocurrències a `NotesContext.jsx` |
| Booleà corromput per `netejaCamp` | **Resolt** | `NotesContext.jsx:17` |
| Toast fora del Shadow DOM tancat | Obert | `AvisadorEfimer.jsx:47-51` llig `shadowRoot` (sempre `null` en mode `closed`) |
| SEO: Notes i Disseny sense `useSEO` | Obert (i irrellevant mentre SEO-01) | 0 crides |
| SEO: manifest vs rutes React | Obert | SEO-02 |

---

## 6 · Matrius DAFO

### 6.1 · Integració Sollutia

| | Intern | Extern |
| --- | --- | --- |
| **Positiu** | **Fortaleses.** Port amb contracte congelat i fail-closed; segellat en dues fases fora del cicle de vida; cap import de Supabase fora de `src/data`; allowlist d'orígens per a `supabaseUrl`; aturador `service_role` als dos builds; sessió de l'amfitrió validada (`exp/sub/iss/aud`) i delegació honesta a la RLS; CSP `frame-ancestors`; esdeveniments reemesos amb `composed`. | **Oportunitats.** Model B ben implementat (GET-only + fixtures capturades) faria de Sóc de Poble un mòdul que Sollutia pot allotjar sense confiar-li res; un manifest d'orígens únic i versionat és negociable amb Sollutia com a contracte; el bus d'esdeveniments ja permet a Sollutia integrar navegació i sessió sense tocar el bundle. |
| **Negatiu** | **Debilitats.** Dos models (A/B) conviuen sense decisió executada; `client.js` i `tractor-frontissa` inexistents; fixture única i sintètica; `SessionProvider` sense config (renovació i rol degradats); fusió híbrida en reintent; sufixos i `http://localhost` a producció; variables d'entorn crítiques no documentades; tres documents d'integració contradictoris. | **Amenaces.** Tokens llegibles per qualsevol script del CMS amfitrió en Model B same-origin; un subdomini delegat o vulnerable de `sollutia.cat`/`socdepoble.org` obri el relé OAuth; sense l'API real de Sollutia, la Frontissa es dissenya contra una forma inventada i el primer contacte real pot trencar el traductor; un únic backend per pàgina és un límit que Sollutia descobrirà quan pose dos blocs. |

### 6.2 · SEO

| | Intern | Extern |
| --- | --- | --- |
| **Positiu** | **Fortaleses.** `useSEO` complet (títol, descripció, robots, OG, Twitter, canonical, hreflang, JSON-LD sanejat); `index.html` amb OG, Twitter, JSON-LD `WebSite`, `noscript`; 404 amb `index: false`; `robots.txt` i `sitemap.xml` presents; rutes públiques `/mur`, `/mercat`, `/pobles` netes. | **Oportunitats.** Activar `manageDocumentHead` en standalone és un canvi d'un valor per defecte amb efecte immediat; el manifest de rutes pot derivar-se de React i alimentar `sitemap.xml`; JSON-LD `Place`/`Product`/`Event` ja previstos al generador (`build-seo-manifest.mjs:117-120`); Vercel permet prerender o funcions edge per a les rutes públiques. |
| **Negatiu** | **Debilitats.** SEO dinàmic desactivat per defecte a tots els desplegaments (SEO-01); manifest SEO orfe i discordant amb les rutes (SEO-02); portada que redirigix a un xat personal; contingut duplicat per actor sense canonical; `hreflang` a URLs que no canvien d'idioma; sitemap estàtic de 4 URLs; `theme-color` i `description` desalineats; 404 tou (200 universal). | **Amenaces.** Rastrejadors indexant `/jo/*` i `/e/*` (personals) mentre `robots.txt` ho permet tot; penalització per duplicats i per títols idèntics a totes les pàgines; quan Sollutia allotge el component, el `<head>` és seu: sense un contracte de metadades per ruta (el manifest tenia eixe paper) Sollutia no podrà servir títols correctes. |

### 6.3 · Accessibilitat

| | Intern | Extern |
| --- | --- | --- |
| **Positiu** | **Fortaleses.** Marques de regió i focus gestionat en canviar de ruta; botons d'icona etiquetats; `<dialog>` natiu amb retorn de focus; pestanyes, formularis, interruptors i avisos amb ARIA correcta; `inert` en columnes plegades; `focus-visible` i `reduced-motion` sistemàtics; tots els `alt` presents; mode fosc AAA i mode clar AA en tot el text; mínim tàctil 44 px; `lang` sincronitzat. | **Oportunitats.** `jsx-a11y` + una prova axe per vista principal converteixen «El Trellat» en porta mecànica; `prefers-contrast` i `forced-colors` amb els tokens existents costen poques línies; un enllaç de salt i `aria-expanded` als commutadors tanquen els buits més visibles; el catàleg de Disseny ja documenta les regles (`PaginaFormularis.jsx:92`), només cal que el codi les complisca. |
| **Negatiu** | **Debilitats.** Comentari de `tokens.css` que promet AAA on hi ha AA (`--sdp-text-suau`); callback OAuth amb blau retirat a 3,87:1; sense `aria-expanded` als menús; sense enllaç de salt; vel de la taula de continguts i logotip editable sense teclat; pantalles d'error amb `stack` per a l'usuari; zero comprovacions automàtiques. | **Amenaces.** Públic objectiu (gent major, pobles) amb més probabilitat d'usar alt contrast del sistema, zoom i teclat; cada regressió d'ARIA passa desapercebuda perquè cap porta la vigila; la promesa «WCAG AA» feta a Sollutia (`estandard_integracio_react.md`, LLEI 4) és certa hui però no verificable per ells. |

---

## 7 · Matriu d'urgència i importància

| | Important | No tan important |
| --- | --- | --- |
| **Urgent** | SEO-01 (`manageDocumentHead`); S-02 / E-04 (config a la sessió, rol superadmin); S-01 (decisió Model A/B). | A-02 callback amb blau vell; S-05 `.env.example`. |
| **No urgent** | SEO-02 (manifest i sitemap des de React); S-03 (manifest d'orígens únic); S-04 (decisió tokens/cookie); A-06 (porta d'A11y); E-02/E-03 (frontera vista/dades i kit sense router). | SEO-03/04; A-03/A-04/A-05; E-05/E-06; S-09. |

Cap bloqueig s'assigna per fórmula: els aturadors 1 i 2 del dictamen ho són perquè el codi, llegit, no pot fer el que la documentació diu que fa.

---

## 8 · Incògnites

- **API real de Sollutia.** Al repositori no hi ha cap captura, esquema, OpenAPI ni URL de l'API de Sollutia. L'única «forma» és `tests/frontissa/fixtures/sollutia/perfil.json` (sintètica). No es pot afirmar cap grau de desenvolupament previ de l'API real respecte als mocks: la resposta a la Incògnita del prompt és **zero evidència al codi**. Cal que Sollutia entregue una captura real per recurs (l'ADR ho exigix a §Decisió 4).
- **Quin model d'integració vol Sollutia realment** (allotjar el component amb sessió delegada, o substituir el backend). Sense això, S-01 no es pot tancar.
- **On viurà el `<head>`.** Si el component va dins de Sollutia, SEO-01 i SEO-02 canvien de forma: cal un contracte de metadades per ruta que Sollutia puga servir (el manifest tenia eixe rol i ara és orfe).
- **Comportament en navegador de S-02.** L'anàlisi és estàtica; recomane reproduir-ho amb un JWT a punt de caducar i amb un compte `superadmin` abans de tocar res.
- **Polítiques RLS efectives.** La porta llig fitxers, no l'estat final. Només una consulta a `pg_policies` sobre l'entorn real ho confirma.

## Bateria de veritat

- [x] He citat només rutes existents al repositori, en format `ruta:linies`, i he declarat la deriva de `manifest.json`.
- [x] Cap nom de fitxer, funció o variable inventat (els inexistents — `client.js`, `deferArrenca`, `tractor-frontissa.mjs`, `sdp-seo.php` — es reporten com a absents, amb la font que els cita).
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites.
- [x] Cap línia de codi modificada, afegida ni esborrada.
- [x] Sense cerca web ni navegador.
- [ ] El document passa `tractor-frontmatter.mjs --estricte` (es verifica en tancar).
