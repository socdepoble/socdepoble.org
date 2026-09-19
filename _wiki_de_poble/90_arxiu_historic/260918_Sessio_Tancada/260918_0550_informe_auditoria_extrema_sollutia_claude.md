---
type: informe
status: generat
description: Auditoria extrema Claude per a la integració Sollutia — backend, seguretat, SEO, hooks, accessibilitat, build. Només lectura.
tags:
  - sollutia
---

# Informe — Auditoria Extrema: Integració Sollutia · Claude

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-20260918-0550-CLAUDE |
| Respon a | [[260918_0411_MACRO_PROMPT_auditoria_extrema]] (SDP-PROMPT-20260918) |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 05:50 |
| Modificació | 2026-09-18 05:50 |
| Agent redactor | Claude Code (Fable 5.1), com a auditor del [[Consell de la Petorreta]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Tall auditat | `backup-notes-publish` · HEAD `e0594755` (04:58) **més** l'arbre de treball sense commitar tal com estava a les 05:45 (15 fitxers `M`, 5 `??`). Vegeu «Contracte de realitat». |
| Abast | només lectura. Cap fitxer de `src/`, `tooling/`, `supabase/` ni `package.json` modificat. Escriptures: este informe, la seua línia a [[00_index_escriptori]] i l'acta a `.agents/ESTAT.md`. |

## Vincles

- [[00_index_escriptori]]
- [[260918_0411_MACRO_PROMPT_auditoria_extrema]]
- [[260918_0427_informe_auditoria_integracio_sollutia]] (Codex · mateix prompt)
- [[260918_0509_informe_auditoria_extrema_postimplementacio]] (Codex · post-commit `e0594755`)
- [[260918_0538_informe_auditoria_extrema_amb_nota]] (Codex · post-edicions 05:30)
- [[260918_0300_informe_auditoria_extrema_postmigracio_claude]] (Claude · auditoria anterior)
- [[universal_maquetation]]
- [[design_system_specs]]

## Dictamen executiu

**NO-GO per a un desplegament 100% Online connectat a Sollutia.** Coincidisc amb els tres informes de Codex del mateix dia, però per raons en part diferents: la meua lectura ha entrat més endins de la capa de dades i de seguretat, i hi ha trobat aturadors que cap informe previ cita.

Sis aturadors nous, per ordre de dany:

1. **Amb `dataMode: 'remote'` i un projecte Supabase estàndard, el portal no carrega res.** `sanejaConfig` esborra `supabaseUrl` si l'origen no és a una llista blanca que no conté cap `*.supabase.co` (S-01). En local no es nota perquè es corre en mode llavor.
2. **Els enllaços de detall que genera l'app cauen a la pàgina 404.** `getSectionItemPath('mercat', id)` torna `/mercat/:id`, i eixa ruta només existix sota `/jo` i `/e/:slug` (R-01). Cap targeta de Mur, Mercat, Multimèdia ni Cerca obri el seu detall.
3. **La portada del sitemap acaba `noindex, nofollow` per a Google.** `/` redirigix client-side a `/jo/xat`, i `useSEO` marca privat tot el que comença per `/jo` (SEO-01). Codex ho havia esmentat dins de P0-02; ací es quantifica i se'n donen tres remeis sense SSR.
4. **El *timeout* de 12 s deixa el portal «carregant» per sempre.** El `request()` avorta amb un `AbortError` idèntic al del desmuntatge, i els quatre proveïdors el descarten sense passar a `error` (H-02). Amb `aria-busy` ara lligat a eixe estat, `<main>` queda «ocupat» indefinidament. És el mode de fallada més probable al bancal.
5. **El cercador global peta a la primera tecla si hi ha converses carregades.** `mapejaFil` no produïx `searchText` i `SearchSection` fa `.includes` sense guarda (D-01).
6. **`public/rag-index.json` publica a producció 2,5 MB d'índex de documentació interna** (30 fitxers de `.agents/`, 24 de l'Escriptori, `scratch/`), sense cap consumidor al frontend (B-02).

A més, quatre aturadors d'accessibilitat que contradiuen la raó de ser del projecte: l'enllaç «Salta al contingut» no es veu ni funciona dins del *shadow root* (A11Y-01), les pestanyes de panell en mode fosc tenen un contrast d'1,08:1 (A11Y-03), el calaix de la barra lateral en mòbil no té vel, Escape ni tancament en navegar (A11Y-04), i «Esborrar» la imatge d'una nota o del perfil actua sense confirmació (UX-01).

Sobre la incògnita del prompt (política `noindex` i sitemap sense SSR): la resposta completa és a la secció 2.3. En una frase: **la política no protegix res davant d'un rastrejador sense JavaScript i perjudica la portada davant d'un rastrejador amb JavaScript; l'única capa que veu tot rastrejador és HTTP, i eixa capa hui no diu res.**

## Contracte de realitat i mètode

- **Pedra Seca** s'interpreta en tot l'informe com el Sistema de Disseny (`src/components/PedraSeca/` i el seu catàleg a `src/sections/disseny/`).
- Cap eina de xarxa ni navegador. Tot el que no s'ha executat es marca [SUPÒSIT]. Les lectures es citen `ruta:línies` contra el disc, no contra `git HEAD`.
- **L'arbre s'ha mogut durant l'auditoria.** Vaig començar a les 04:15 sobre HEAD `4aab0420`. A les 04:58 una altra sessió va commitar `e0594755` («fix(core): implementació resolucions auditoria extrema postmigració») i entre les 05:20 i les 05:40 va editar nou fitxers més de `src/` sense commitar (`App.jsx`, `CoreContentContext.jsx`, `RouterContext.jsx`, `UIContext.jsx`, `UniversalWorkspace.jsx`, `host.js`, `MurContext.jsx`, `XatSection.jsx`, `PedraSecaEmbed.jsx`). Codex ho va detectar també (informe 0538). **Totes les cites d'este informe s'han reverificat contra l'estat de les 05:45.** Les troballes de les lectures primerenques que eixes edicions han resolt s'han retirat (per exemple, el botó «Intentar de nou» que cridava un `refresh` inexistent ja no existix: `AppDataLoader` ara no bloqueja ni oferix reintent, `App.jsx:447-463`).
- Mètode: cinc lectures paral·leles per àrea (integració i seguretat; SEO i rutes; hooks i dades; accessibilitat; cadena de build) i una verificació creuada meua de cada troballa crítica llegint el codi una segona vegada. Les ràtios de contrast estan calculades amb la fórmula WCAG 2.x sobre els hexadecimals de `tokens.css`.
- No s'ha llegit `.env` ni `.env.local` (AGENTS.md §5). No s'ha executat `npm run porta` sencer ni cap porta amb `--baseline`, ni `tancament.mjs` (reescriu `skills_mirror/`). Els dos builds Vite s'han fet amb `--outDir` al *scratchpad*, fora del repositori.

## Relació amb els informes de Codex i amb l'auditoria anterior

Codex ha respost este mateix prompt (0427) i després n'ha fet dos més (0509, 0538) sobre les esmenes de la IAIA MarIA. Per no repetir-los:

- **Confirme per lectura independent**: P0-02 (noindex client-side), P0-03 (`/page/:slug` sense `pageDetailLookup`), P0-04 (Docker i CI), P1-01 (capacitat `sessio`), P1-03 (Mur públic buit per a anònims), P1-04 (deu peticions d'arrencada), P1-08 (TOC amb `aria-hidden`), P2-01 (`useSEO` sense neteja i canonical amb `index`), P2-03 (scroll i `state` del `Link`), P2-04 (Notes amb slug), P2-05 (portes del sistema de disseny), P2-06 (auditors SEO/a11y que són *stubs*), C3-01 (`sdp-spinner` sense CSS), C3-03 (degradació silenciosa del Core), C3-04 (graella i frontmatter).
- **Aporte com a [NOU]** tot el que porta eixa marca a les seccions següents. El gruix és a la capa de dades i seguretat (S-01 a S-14), a les rutes (R-01), al mode de fallada per *timeout* (H-02), al cercador (D-01), a l'índex RAG públic (B-02) i a l'accessibilitat del mode fosc i del mòbil (A11Y-01, A11Y-03, A11Y-04, A11Y-05, A11Y-06, UX-01).
- **Discrepe** en un punt: Codex 0509 dona per tancada la cronologia multimèdia (C-08) perquè el context ara declara `mediaTimelineGroups: []` (`MultimediaContext.jsx:43,53`). El camp continua sent sempre buit perquè cap carregador el produïx; la secció pinta una «Cronologia» sense contingut (`MultimediaSection.jsx:12-16`). És un contracte honest, no una funció.

### Estat de les troballes de l'auditoria Claude 0300

| ID 0300 | Estat | Evidència |
| --- | --- | --- |
| C-1 imports fora del repositori | **ESMENADA** | `porta:importacions` verda; els espècimens usen quatre `../`. |
| C-2 identificadors inexistents | **ESMENADA** | `EspecimenAlerta.jsx:8`, `EspecimenDialeg.jsx:11`; ESLint 0 errors. `EspecimenFormulariComplex` continua `status: 'viu'` a `manifest.js:143` tot i ser un avís «en construcció». |
| C-3 cadena de build trencada | **ESMENADA** | `package.json` sense `build:seo`; residus de comentari a `vite.standalone.config.js:40-43` i `tractor-rutes-web.mjs:135`. |
| C-4 capacitat `sessio` | **OBERTA** | `SessionContext.jsx:40` i `:85`; `RequireAuth.jsx:44`. Vegeu S-C4. |
| A-1 `\|\| []` a cada render | **ESMENADA** | `UniversalWorkspace.jsx:8` (`CAP`), `:45-47`. |
| A-2 reductor sense bail-out | **PARCIAL** | `selection/sync` amb guarda i prova (`workspaceState.test.js`); `selectCategory` encara depén de `state` sencer (`WorkspaceContext.jsx:80-92`). |
| A-3 `replace` a `/disseny` | **ESMENADA** | `DesignSection.jsx:52-53`. |
| A-4 `lazy` no recuperable | **PARCIAL** | `ambReintent` només al catàleg (`detailRegistry.jsx:3-21`) i amb defectes propis (H-05); `host.js:73-77` continua només amb `console.error`. |
| A-5.1 detall sense focus | **PARCIAL** | Focus en totes les mides (`UniversalWorkspace.jsx:417-419`), però el destí és un `div` sense rol ni nom i no hi ha anunci. |
| A-5.2 tancar cerca perd el focus | **OBERTA** | `UniversalWorkspace.jsx:343`. |
| A-5.3 plegar desmunta el control | **ESMENADA** | `:165-168`, `:189-192`, `:292-295`, `:316-319`. |
| A-5.4 barra lateral sense ARIA | **PARCIAL** | Hi ha `aria-expanded`/`aria-controls` (`App.jsx:240`, `:339`), però mutats amb `setAttribute` (`:247`, `:346`) i els dos botons no es sincronitzen. |
| A-6 porta del catàleg | **ESMENADA** | `tractor-cataleg` verda a les 05:45 (52 components). |
| A-7 dues fonts de veritat | **OBERTA** | `registre.js:16-17` vs `manifest.js:6-7`. |
| A-8 espècimens orfes | **ESMENADA** (fitxers) / **OBERTA** (imports sense ús: 325 avisos ESLint). |
| A-9 `sdp:refresh-data` | **ESMENADA 4/5** | `useRecarregaExterna.jsx:7-20`; `XatContext` no s'hi subscriu. |
| A-10 xarxa caiguda | **REGRESSIÓ** | La pantalla d'error amb reintent s'ha llevat (`App.jsx:447-463`); ara no hi ha reintent visible i el *timeout* deixa `loading` etern (H-02). |
| M-1 residus `App.jsx` | **OBERTA** | `buildPath` duplicat `:74` i `:599`; `StrictMode` `:419`; `JSON.stringify(config)` `:416`. |

## Bateria mecànica executada

| Comprovació | Hora | Resultat |
| --- | --- | --- |
| `npm run lint` | 05:47 | 0 errors · 323 avisos (tots `no-unused-vars`) |
| `npx vitest run` | 05:47 | 12 fitxers · 47/47 |
| `node tooling/gates/tractor-importacions.mjs` | 05:47 | verd |
| `node tooling/gates/tractor-cataleg.mjs` | 04:26 → 05:47 | **ENOENT** abans de `e0594755` → **verd** després (52 components) |
| `tractor-sollutia`, `tractor-enxufe`, `tractor-innerhtml` | 05:47 | verds |
| `tractor-rls` | 05:47 | roig · 2 (R2 `private.ajustos`: porta cega a l'esquema; R3 `profiles read own using (true)` de `260911_0600:26-28`, restaurada a `260916_0600:74-79`): **cap fuita final**, porta que no acumula estat |
| `tractor-inline-styles` | 05:47 | roig · 3 (`UniversalEditorShell.jsx:152,154`; `EspecimenInventariGlobal.jsx:14`) |
| `tractor-persistencia` | 05:47 | roig · 3 (`detailRegistry.jsx:6,10,14`, `sessionStorage` directe) |
| `tractor-cadena` | 05:47 | roig · 4 (C1: `porta:utilitatssdp` no existix a `package.json`; C4: `porta:frontissa` etiqueta caducada, `porta:segella` i `porta:matrix` sense excusa) |
| `npx vite build --outDir <scratchpad>` | 05:47 | verd · 357 fitxers · 132 MB (106 MB `assets/uploads`) · chunk major `NotesSection` 482 kB |
| `npx vite build -c vite.standalone.config.js` | 05:47 | verd · `soc-de-poble.standalone.js` 1.777 kB (gzip 519 kB), sense hash |
| `npm audit --omit=dev` | 05:47 | 0 vulnerabilitats |
| `npm outdated` | 05:47 | 14 endarrerits; majors: eslint 10, vite 8, vitest 5, react 19, react-day-picker 10 |
| `node tooling/gates/run-portes.mjs` | — | **no executat**: la «Porta Build» (`run-portes.mjs:34`) crida `npm run build` (`tractor-build-previ.mjs:87-91`), que escriu tres fitxers versionats (B-01) |
| `git status` en acabar | 05:45 | 15 `M` · 5 `??`, tots d'activitat externa (commit `e0594755` i edicions 05:20-05:40); cap escriptura meua fora del *scratchpad* |

---

## 1 · Integració de dades i seguretat del frontend

### S-01 · [NOU] · Crític — La llista blanca de `sanejaConfig` esborra l'URL de Supabase de producció

`PedraSecaEmbed.jsx:166-172` declara `ORIGENS_PERMESOS`: `auth.socdepoble.org`, quatre `localhost:*`, `socdepoble.sollutia.com`, `socdepoble.sollutia.cat`, `127.0.0.1:54321`, `localhost:54321`, `127.0.0.1:5173`. Cap `*.supabase.co`. `:187-191`: per a `supabaseUrl`, si l'origen no hi és → `delete net[field]`. L'URL documentada és `https://<ref>.supabase.co` (`.env.example:2`, `README.md:164`).

Cadena: `main.jsx:42-49` posa `supabaseUrl` a l'atribut `config` → `sanejaConfig` l'esborra → `runtime.js:26-33` `hasSupabaseConfig = false` → `content.js:71` llança «Falten credencials de Supabase» → tots els proveïdors passen a `error`. En local no es veu perquè `.env.local` fixa `VITE_DATA_MODE=seed` (`content.js:70`). L'auditoria 0131 va donar esta llista blanca com a «resol el P0» sense detectar-ho.

[SUPÒSIT] Només s'evita si producció usa un domini personalitzat que coincidisca amb `socdepoble.sollutia.com` o `.cat`; cap document del repositori ho afirma.

Esmena: afegir l'origen exacte del projecte Supabase de producció a la llista (o derivar-lo en temps de build d'un `VITE_SUPABASE_URL` validat), condicionar `localhost`/`127.0.0.1` a `import.meta.env.DEV`, i una prova unitària que garantisca que `https://x.supabase.co` sobreviu a `sanejaConfig`.

### S-C4 · Crític — Sense capacitat `sessio`, el rol no arriba mai i el client tanca la sessió (confirma 0300 C-4 i Codex P1-01)

Sense canvis: `SessionContext.jsx:40` `if (!teCapacitat('sessio')) { await logout(); return; }`; `:85` ix sense fixar `rol`; `RequireAuth.jsx:44` espera `rolActual !== null` per sempre a `/admin/*` (`App.jsx:520`) i `/realitat` (`:541`). `contracte.js:43-46` manté `refrescaSessio` i `elMeuRol` com a opcionals. `PedraSecaEmbed.jsx:280-282` només reemet tres esdeveniments; no existix cap `sdp:sessio-caduca`.

### S-02 · [NOU] · Advertència [SUPÒSIT a verificar] — La validació `state` d'OAuth depén que GoTrue el torne

`oauthRelay.js:148-156` genera `state` i el posa a `/auth/v1/authorize`; els tres camins de tornada el rebutgen si falta (`:206-209`, `:223-226`, `:325-332`); el relé només el reenvia si arriba a l'URL (`callback.html:140,144,164`). El propi fitxer avisa que els paràmetres del bescanvi no s'han verificat contra GoTrue (`oauthRelay.js:34-38`) i no hi ha cap prova de `gestionaTornada`. Si GoTrue no propaga `state` al `redirect_to`, l'entrada amb Google falla tancada sempre. Cal una crida real.

### S-03 · [NOU] · Advertència — L'enllaç màgic no inicia PKCE però el relé exigix `?code=`

`auth.js:127-139` demana `/auth/v1/magiclink` sense `code_challenge`; `callback.html:157-160` mostra «Falta el codi d'entrada» si no hi ha `code`; el flux implícit es va suprimir a propòsit (`oauthRelay.js:269`, `:351-353`). [SUPÒSIT] Si GoTrue respon amb *tokens* al fragment, l'entrada per correu mor al relé.

### S-04 · [NOU] · Advertència — *Tokens* a `sessionStorage` compartit amb l'amfitrió i sense revocació al servidor

JWT, *refresh token* i `user` a `sessionStorage` amb prefix `sdp_embed_` (`identitat.js:58-60,130-136`; `storage.js:60-75`). `logout()` (`auth.js:149`) esborra local però no crida `/auth/v1/logout` (cap referència a `src/`). L'API global permet a qualsevol *script* del document `expulsaSessio()` i `injectaSessio()` (`host.js:274-285`, `:309`) i la cua `window.SocDePobleCua` s'executa sense validació d'origen (`host.js:208-235`). En Model B (mateix origen que Sollutia) qualsevol *script* del CMS llig el *refresh token* i el pot usar després del `logout` fins que rote.

### S-05 · [NOU] · Advertència — Un error de xarxa en renovar expulsa l'usuari

`auth.js:22-25` torna `false` en error de `fetch` i també per a 429/5xx (`:26-33`); `SessionContext.jsx:41-42` fa `logout()` si `!ok`. El temporitzador dispara 60 s abans de caducar (`:52-61`, `identitat.js:196`) i en tornar a la pestanya (`:66-81`). Al bancal, una pèrdua de cobertura de segons en eixe instant esborra el *refresh token*. Esmena: distingir «rebuig del servidor» (400/401) de «no s'ha pogut preguntar» (xarxa, 5xx, 429) i reintentar amb retrocés fins a l'`exp` real.

### S-06 · [NOU] · Advertència — `adoptaSessioExterna` rebutja `aud` de Supabase

`identitat.js:267-271` exigix `iss === emissorEsperat` i `aud` igual a `socdepoble.org` o a l'emissor. [SUPÒSIT] Els JWT de GoTrue porten `aud: "authenticated"`, així que una sessió Supabase injectada per l'amfitrió es rebutja sempre. `VITE_SOLLUTIA_ISSUER` (`host.js:365`) no apareix a `.env.example`. El camí «sessió de l'amfitrió + dades a Supabase» està tancat per disseny sense que cap document ho diga.

### S-07 · Advertència — El text cru del backend arriba a l'usuari (amplia Codex «Riscos que requerixen confirmació»)

`runtime.js:58-59` construïx `Supabase ${status}: ${text}` amb el cos JSON de PostgREST (`hint`, `details`, noms de columnes). Es mostra en `<pre>` a `App.jsx:483` (límit de ruta), a `ErrorBoundary.jsx:20`, a `SlotErrorBoundary.jsx:55-61` («☠️ El detall s'ha esfondrat», «error fatal intern»), i en *toasts* (`App.jsx:106`, `XatSection.jsx:82,120`, `XatContext.jsx:177,217`). `handleError` (`utils.js:18-71`) torna `{error, code, details}` sense `message`, així que `handleError(error)?.message` a `xat.js:68,92,105,130,150` és sempre `undefined`: el mapeig humà és codi mort.

### S-08 · Advertència — Deu peticions d'arrencada per a quatre consultes (confirma Codex P1-04) i resubscripció a cada render [NOU]

`content.js:76-81` (`loadMur`, `loadMultimedia` → `loadAppData`, tres peticions cadascuna), `notes.js:19-22` (tres més), `loadCoreContent` una: `app_content` ×4, `section_submissions` ×3, `notes` ×3 en muntar (`App.jsx:431-436`). Cada `sdp:refresh-data` ho repetix. `useRecarregaExterna` depén d'`onRefresh` (`useRecarregaExterna.jsx:19`) i els quatre proveïdors li passen una fletxa inline (`CoreContentContext.jsx:62`, `MurContext.jsx:56`, `NotesDataContext.jsx:96`, `MultimediaContext.jsx:61`): `removeEventListener` + `addEventListener` a cada render. `XatContext` no s'hi subscriu: `refreshData()` de Sollutia (`PedraSecaEmbed.jsx:442-446`) no refresca el xat.

### S-09 · Crític — A `/e/:slug/*` les Notes demanen `owner_user_id=eq.<slug>` (confirma Codex P2-04, puja a crític)

`IdentitatContext.jsx:15-18` posa `actorId = slug`; `NotesDataContext.jsx:34` el passa a `loadNotes`; `notes.js:19-22` el posa al filtre UUID sense guarda. PostgREST torna 400 i el proveïdor de Notes passa a `error` en **totes** les rutes d'entitat. `content.js:12-13,22-24` sí que ho evita per a `loadAppData`: el patró correcte existix al costat.

### S-10 · [NOU] · Advertència — Crides al backend sense `config`

`admin.js:3,8` torna `[]` si `getResolvedConfig(config).hasSupabaseConfig` és fals; `AdminSection.jsx:65,116` crida `adminListUsers()`/`adminListOrganizations()` sense `config` → superadmin veu llistes buides sense error. `NotesEditor.jsx:14` crida `uploadToStorage(fitxer, { carpeta: 'notes' })` sense `config`; `config.js:26-42` només se salva si `darreraConfig` ja s'ha fixat per una crida anterior a `getClient`, cosa que no passa per la via `request()`.

### S-11 · Crític — «Mur públic» buit per a convidats (confirma Codex P1-03)

`/mur`, `/mercat`, `/pobles` són públiques (`App.jsx:515-517`), però la política de lectura de `section_submissions` exigix `private.is_town_member(tenant_id)` (`260908_0000_initial_schema.sql:763-768`), que és fals amb `auth.uid()` nul (`:401-414`). `loadAppData` engolix l'error i torna `[]` (`content.js:15-18,21`). Cap migració posterior canvia esta política (grep de «public read section_submissions»: només `initial_schema.sql:763-764`). Un visitant només veu la llavor d'`app_content`. Decisió humana: o lectura anònima acotada (`section_id in ('mur','events','mercat')`), o rutes amb sessió.

### S-12 · [NOU] · Advertència — El registre ignora el `tenantId` de la instància

`handle_new_user` només llig `private.ajustos.poble_per_defecte` (`260915_0000:50-55`, a propòsit contra *spoofing*, `260914_0100:16-18`); `registerWithPassword` (`auth.js:99-110`) no transmet cap poble i el frontend és multi-*tenant* per `config.tenantId` (`runtime.js:29`). Amb dos pobles desplegats amb Sollutia, tota alta cau al poble per defecte.

### S-13 · [NOU] · Millora — Grants i utilitats que són mines

- `260914_0100:47-48` concedix `insert, update, delete` sobre `app_content` a `authenticated` sense cap política d'escriptura; `260914_0000_schema_notes.sql:50` concedix `select` sobre `notes` a `anon` sense política. RLS denega hui; el grant espera una política laxa.
- `organizations.js:19-21` mapeja `slug`, `kind`, `parent_organization_id`, `logo_url`, però el grant només cobrix `name, lema, description, visibility` (`initial_schema.sql:863`): qualsevol edició amb una d'eixes claus falla amb 42501.
- `utils.js:174-177` `searchWithPagination` interpola l'entrada dins d'un filtre `or` de PostgREST (injecció de filtre). Sense cap crida hui; esborrar-la.
- `storage.js:106-108` trau l'extensió del nom del fitxer, no del MIME real (el *bucket* ho mitiga, `260913_0500:8-14`).
- `callback.html:92,98` i `PedraSecaEmbed.jsx:167-171` accepten `localhost` en producció, a diferència de `host.js:326` i `oauthRelay.js:291-297`, que ho condicionen a DEV.

### S-14 · [NOU] · Millora — `.env` amb clau anònima va ser commitat al primer commit i viu a *refs* remotes

`git log --all -- .env` mostra `786b7307 first commit` amb `.env`; no és ancestre de `HEAD`, però està a `fork/main`, `fork/feature/Sollutia`, `upstream/feature/*`. `.gitignore:11-13` ja exclou `.env*`. La clau anònima és pública per disseny (viatja al *bundle*): no cal rotar-la, però convé netejar la història d'eixes branques si el remot és públic. No s'ha llegit cap valor.

---

## 2 · SEO, rutes i la incògnita central

### 2.1 Fets de base

- No hi ha SSR ni *prerender*. L'app arranca sempre com a `<soc-de-poble>` amb *shadow root* tancat (`main.jsx:30-50`, `PedraSecaEmbed.jsx:287`).
- Vercel reescriu **tot** a `/index.html` amb HTTP 200 (`vercel.json:13-18`); `public/.htaccess:1-7` fa el mateix per a Apache. `vercel.json:2-12` només envia `Content-Security-Policy: frame-ancestors`. Cap `X-Robots-Tag`.
- `index.html` estàtic: `lang="ca"` (`:2`), `title` (`:27`), `description` (`:9`), OG i Twitter fixos (`:14-24`), JSON-LD `WebSite` (`:30-46`). **No hi ha** `<meta name="robots">`, **no hi ha** `<link rel="canonical">`, **no hi ha** `og:url`.
- `useSEO` decidix «privat» per prefix, no per autenticació: `useSEO.js:53-55` marca `noindex, nofollow` si `window.location.pathname` comença per `/jo` o `/e/`. `/jo/*` i `/e/:slug/*` (`App.jsx:511-512`) **no tenen cap `RequireAuth`**: un anònim les veu igual. Els únics guards són `/admin/*` (`:520`) i `/realitat` (`:541`), i cap dels dos crida `useSEO`.
- `useSEO` es crida a 11 vistes; no el criden `OnboardingSection` (`/registre`, al sitemap), `ControlSection`, `SearchSection`, `TranslationsSection`, `ConnectarSection`, `DesignSection`, `NotesSection`, `ProfileSection`, `PerfilShell`, `AdminSection`, `RealitatSection`.
- `public/sitemap.xml` conté 7 URL: `/`, `/mur`, `/mercat`, `/pobles`, `/registre`, `/legal`, `/versions`. El genera a mà `_wiki_de_poble/04_escriptori/generador_sitemap.mjs:11-19`, que **cap script ni porta crida** (l'única menció és l'informe 0300).

### SEO-01 · Crític — La portada del sitemap acaba `noindex, nofollow` (concreta Codex P0-02)

`App.jsx:508` `<Route path="/" element={<Navigate to={`/jo${DEFAULT_SECTION_PATH}`} replace />} />` amb `DEFAULT_SECTION_PATH = '/xat'` (`sections.js:34`) → `XatSection` crida `useSEO` (`XatSection.jsx:36-40`) → `isPrivate = true` → `<meta name="robots" content="noindex, nofollow">`. La primera URL del sitemap, amb `priority 1.0` (`sitemap.xml:3-7`), és per a Google amb JavaScript una pàgina que demana no ser indexada i que no se'n seguisquen els enllaços. El mateix passa amb `/projecte`, `/constitucio`, `/roadmap`, `/ia`, `/skills`, `/disseny`: totes redirigixen a `/jo/…` (`App.jsx:530-546`) i són contingut públic que mai s'indexarà.

### SEO-02 · Crític — Sense senyal a la capa HTTP, tota URL és un 200 duplicat de la portada (confirma Codex P0-02)

Un rastrejador sense JavaScript (o amb el *bundle* bloquejat per la CSP d'un amfitrió) rep per a `/jo/xat`, `/e/x/mur`, `/admin`, `/inventat` el mateix `index.html`, sense canonical ni `robots`, amb HTTP 200 i `robots.txt` que ho permet tot (`public/robots.txt:1-4`). El 404 és tou: `NotFoundPage.jsx:10-14` posa `index: false` només via JavaScript.

### 2.3 Resposta a la incògnita: impacte exacte de la política pública/privada sobre el sitemap sense SSR

1. **Rastrejador sense JavaScript**: veu totes les URL com a còpies idèntiques d'`index.html`, indexables. La política `noindex` no existix per a ell. Les rutes privades no es protegixen; les públiques no tenen títol ni descripció pròpia; les inexistents són 200.
2. **Rastrejador amb JavaScript** (Googlebot, segona onada): sí que veu el `noindex` de `/jo/*` i `/e/*`, però també el veu a `/` (SEO-01). El `nofollow` a més talla el descobriment des de la portada.
3. **Senyals contradictoris**: `useSEO.js:63-65` decidix el canonical amb `index` (paràmetre) i no amb `finalIndex` (`:54`); una ruta privada rep `noindex` **i** `<link rel="canonical">` + `og:url` cap a `/jo/…` (confirma Codex P2-01).
4. **Sense neteja entre rutes**: `useSEO.js:11-103` no retorna cap funció de neteja. Anar de `/jo/xat` (noindex) a `/registre` (sense `useSEO`) deixa el `noindex, nofollow` posat a una URL del sitemap. La descripció i el JSON-LD també s'arrosseguen.
5. **El sitemap en si és correcte en abast** (no llista `/jo/*`, `/e/*` ni `/admin`), però la seua URL principal és la que es desindexa, `/registre` no té metadades pròpies, i omet `/page/:slug`, `/traduccions`, `/cerca`.

**Conclusió**: la política «privat = prefix `/jo`» confon l'espai de noms de l'actor amb l'autenticació. El resultat és el pitjor dels dos mons: no protegix res que calga protegir (les rutes d'actor són públiques de fet) i desindexa la portada i sis pàgines de contingut públic.

**Remeis, per ordre de cost, tots sense SSR:**

1. **`X-Robots-Tag` per prefix a `vercel.json`** (`headers` amb `source` `/jo/(.*)`, `/e/(.*)`, `/admin/(.*)`, `/realitat`, `/auth/(.*)` → `noindex, nofollow`) i `Disallow` equivalents a `robots.txt`. Zero codi d'app, vàlid sense JavaScript.
2. **Portada pública**: que `/` pinte contingut públic o redirigisca a `/mur` per a visitants sense sessió (`App.jsx:508`), i que les pàgines de text (`/projecte`, `/constitucio`…) visquen a primer nivell en compte de redirigir a `/jo`. Corregir `useSEO.js:63` perquè use `finalIndex`.
3. **`useSEO` amb neteja** (restaurar `title`/`description`, llevar `robots`, `canonical`, JSON-LD en desmuntar) i cridar-lo a les 11 vistes que no ho fan.
4. **Head estàtic per ruta pública en build**: un pas de post-build que, a partir d'una única llista de rutes públiques, escriga `dist/mur/index.html`, `dist/mercat/index.html`… amb `title`, `description`, `canonical` i `robots` propis (Vercel servix el fitxer estàtic abans del *rewrite*). Eixa mateixa llista genera `sitemap.xml` i alimenta `tractor-rutes-web`.
5. **404 dur** per a rutes desconegudes: només possible si la llista de rutes públiques és fora de React (punt 4).

### R-01 · [NOU] · Crític — Els enllaços de detall generats per `navigation.js` cauen a `NotFoundPage`

`getSectionItemPath('mercat', id)` torna `/mercat/:id` (`navigation.js:34-39`) i `resolveItemPath` torna `/gent/:id`, `/empresa/:id`… (`:48-67`). Consumidors: `MercatSection.jsx:60`, `PoblesSection.jsx`, `MurSection.jsx`, `MultimediaSection.jsx`, `SearchSection.jsx`, que ho passen a `UniversalCard` com a `mainHref`. El `Link` fa `navigate(to)` absolut (`RouterContext.jsx:41-68`). A `App.jsx` només existixen `/mur`, `/mercat`, `/pobles` **exactes** (`:515-517`; exacte perquè `pathToRegex` només fa prefix si la ruta conté `*`, `RouterContext.jsx:180-202,224`) i `/page/:slug` (`:531`); `:sectionId/:itemId` i `gent/:agentId` viuen **només** sota `/jo` i `/e/:slug` (`:576-587`). Cap codi prefixa l'actor. Resultat: obrir qualsevol targeta des de `/mercat` o `/jo/mercat` porta a `/mercat/123` → `*` → `NotFoundPage` (`:548`). [SUPÒSIT] no provat al navegador; el raonament és sobre el *matcher*. Impacte: cap detall és enllaçable (SEO) ni obrible (funcional).

Esmena: que `getSectionItemPath` reba la base d'actor, o que `App.jsx` declare `/:sectionId/:itemId` a primer nivell; i una porta que comprove que cada ruta que `navigation.js` genera casa amb alguna `<Route>`.

### SEO-03 a SEO-08 · Advertències

- **SEO-03** `useSEO` sense neteja (`useSEO.js:11-103`); **SEO-04** canonical amb `index` (`:63-65`). Confirmen Codex P2-01.
- **SEO-05** [NOU] La detecció «privat» llig `window.location.pathname` sense llevar el `basename` que el router sí que lleva (`RouterContext.jsx:18-24`): incrustat sota `/app/`, `/app/jo/xat` no és privat. En mode memòria (`PedraSecaEmbed.jsx:45-46`) el `pathname` del document no és la ruta de l'app. A més, `manageDocumentHead` només es força per a `routerType === 'browser'` (`:397-399`) i `useSEO.js:16` tracta `undefined` com a actiu: una segona instància en memòria també escriu el `<head>`. La guarda `window.__SDP_EMBEDDED__` (`useSEO.js:15`) no la posa cap fitxer.
- **SEO-06** [NOU] `VITE_CANONICAL_URL` (`useSEO.js:23,62`) no és a `.env.example`: en *previews* de Vercel cada desplegament és canònic de si mateix.
- **SEO-07** [NOU] Quatre fonts de rutes sense lligam: `App.jsx:504-548` (reals), `sections.js:10-32` (`xat` a `/xat` i `poblacio` a `/poblacio` no existixen a primer nivell), `navigation.js:19-31` (`PAGE_ROUTE_MAP` apunta a redireccions), `generador_sitemap.mjs:11-19` (a mà, domini fix).
- **SEO-08** [NOU] `tractor-rutes-web.mjs:66-69` prefixa `/` a tota ruta relativa i `:108` fa un `Map` on l'última guanya: `/projecte` (redirecció) queda tapat per `projecte` d'`ActorRoutes`, i per això W1/W2 passen tot i que `/xat` a primer nivell és un 404 real. W7 (duplicats `/mur` ↔ `/jo/mur`) només avisa. `tooling/wiki/seo_auditor.mjs:8-12` és un *stub* que sempre imprimix «Compleix» (confirma Codex P2-06).

### R-02 a R-05 · Router

- **R-02 ESMENADA durant l'auditoria**: `Link` ja prefixa `basename` a `href` (`RouterContext.jsx:146`, sense commitar). **R-03 ESMENADA**: `MemoryRouter` arranca a `/` (`:283`). Codex 0538 ho dona per tancat estàticament; falta prova.
- **R-04** [NOU] Fragment `#main-content` dins d'un *shadow root* tancat: vegeu A11Y-01.
- **R-05** Sense restauració de scroll global; `ItemDetailSection.jsx:28-30` fa `window.scrollTo` mentre el contenidor que fa scroll és `.app-main__content` (`layout.css:29-39`). Confirma Codex P2-03.
- **R-06** `useLocation` torna objecte nou a cada crida i llig `window.history.state` fora de React (`RouterContext.jsx:97-100`); `Routes` memoritza sobre `children`, que és un array nou a cada render del pare (`:214-250`).

### D-01 (desplegament) · Advertència — `vercel.json` sense capçaleres de seguretat ni caché

Només `frame-ancestors` (`vercel.json:2-12`). Falten `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`, i cap `Cache-Control: immutable` per a `/assets/*` amb *hash* ([SUPÒSIT] Vercel aplica valors per defecte). La CSP forta viu com a `<meta>` (`index.html:8`) amb `connect-src https:` i `frame-src https:` amples (confirma Codex P1-07).

---

## 3 · Dades, hooks i resiliència

### H-02 · [NOU] · Crític — El *timeout* de 12 s deixa el portal «carregant» per sempre

`runtime.js:47-49` crea un `AbortController` propi i l'avorta quan passa `timeoutMs`; `fetch` rebutja amb un `DOMException` de nom `AbortError`, **idèntic** al que produïx el proveïdor en desmuntar. Els quatre proveïdors fan `if (!active || error?.name === 'AbortError') return;` (`CoreContentContext.jsx:29`, `NotesDataContext.jsx:38`, `MultimediaContext.jsx:26`, `MurContext.jsx:26`, este últim afegit a l'edició de les 05:30). Amb `active === true` i *timeout*, no es fa `setData`: l'estat es queda en `loading`. Conseqüències: `globalStatus` es queda en `loading` (`CoreContentContext.jsx:25-31` només el posa a `ready`/`error`) i `<main aria-busy="true">` per sempre (`App.jsx:302`); Notes, Mur i Multimèdia pinten el seu estat de càrrega indefinidament; no hi ha cap missatge ni reintent. Abans del commit `e0594755` el mateix cas acabava en `status: 'error'`: és una regressió introduïda per la cancel·lació.

Esmena: distingir l'avortament propi del *timeout*, `if (!active || controller.signal.aborted) return;`, o que `request()` reembolcalle el *timeout* en un error de nom propi (`TimeoutError`) i que el proveïdor el tracte com a `error` amb reintent.

### D-01 · [NOU] · Crític — El cercador global peta a la primera tecla si hi ha converses

`SearchSection.jsx:20-29` barreja `xat.chatThreads` a `globalSearchItems` i `:47` filtra amb `item.searchText.includes(term)`. Els fils venen de `mapejaFil` (`XatContext.jsx:104-118`), que **no produïx `searchText`**. Amb sessió i un fil, la primera tecla a `/cerca` llança `Cannot read properties of undefined (reading 'includes')`, capturat pel límit de ruta («Hi ha hagut un problema», `App.jsx:483-487`). Esmena: `(item.searchText || '').includes(term)` i afegir `searchText` a `mapejaFil`.

### H-05 · [NOU] · Advertència — `ambReintent` recarrega la pàgina quan no toca i pot deixar el catàleg mort

`detailRegistry.jsx:3-21`: (1) `JSON.parse(window.sessionStorage.getItem(…))` sense `try`: en Safari privat o amb emmagatzematge bloquejat, **tots** els 28 carregadors rebutgen abans de cap `import()`; (2) recarrega davant de qualsevol error d'avaluació del mòdul, no només de xarxa: l'usuari perd l'estat d'edició per un *bug* determinista; (3) `:10` reinicia el senyal a `'false'` a cada import correcte, així que «A falla → recàrrega → B carrega → A falla» torna a recarregar; (4) sota `preact/compat`, quan `throw error` arriba a `:18` el component `Lazy` guarda l'error per sempre (`node_modules/preact/compat/src/suspense.js:252-275`): el «Reintenta» de `SlotErrorBoundary.jsx:63` continua sense servir; (5) no cobrix els 24 `lazy()` d'`App.jsx:14-43` ni `vite:preloadError` (`host.js:73-77`). `tractor-persistencia` el marca (L2 ×3).

### H-07 · [NOU] · Advertència — `toggleTheme` llig un `systemDark` congelat

`UIContext.jsx:91-97` memoritza `actionsValue` amb `[translator, setGlobalStatus]`, però `toggleTheme` (`:69-73`) tanca sobre `systemDark` (`:50`). Si el sistema canvia a fosc després del muntatge i l'idioma no ha canviat, el commutador calcula amb el valor antic: un clic pot «no fer res».

### H-08 · Advertència — `useSEO` i `manageDocumentHead`: vegeu SEO-05.

### H-09 · Advertència — La barra lateral té ARIA però no estat (amplia 0300 A-5.4)

`App.jsx:240-247` i `:339-346` fixen `aria-expanded` amb `setAttribute` sobre valors inicials contraris (`"true"` al botó de marca, `"false"` al mòbil) i cada botó només s'actualitza a si mateix. `willClose` (`:244`) es deduïx només de la classe `sidebar-open`. Continua vulnerant `EspecimenShell.jsx:8-9`. Esmena: `useState` a `AppShell`, `aria-expanded={obert}` als dos botons, classe al `host` en un `useEffect`.

### H-10 · Advertència — `XatProvider` llig la sessió durant el render (`XatContext.jsx:147`, `getCurrentUser()` llig `sessionStorage`); `joId` només canvia si algun pare repinta.

### D-03 · [NOU] · Advertència — Camps interns sense validar

`MurSection.jsx:83-84` `labels.some(l => l.text.toLowerCase())` peta si una publicació porta una etiqueta sense `text`; `mapejaFil` (`XatContext.jsx:105-106`) fa `fil.altresNoms.length` sense `?.`: un adaptador Sollutia que ometa el camp tomba tota la llista de fils. Els proveïdors només protegixen els *arrays* de primer nivell.

### D-05 · Millora — `loadCoreContent` ignora les pàgines remotes (`content.js:70,74` torna sempre `seed.pages`); confirma Codex P2-02. `CoreContentContext.jsx:50` reconstruïx `pageCopy` amb un `reduce` que fa *spread* a cada pas.

### E-02 · [NOU] · Advertència — Les regles de *hooks* no estan actives

`eslint.config.js:12` registra `react-hooks` però no activa `rules-of-hooks` ni `exhaustive-deps` (grep: 0 ocurrències); tampoc `react/jsx-no-undef` ni cap regla `jsx-a11y`. `NotesContext.jsx:57` porta un `eslint-disable-next-line react-hooks/exhaustive-deps` per a una regla que no corre. Cap dependència incorrecta d'este informe la detecta el *linter*.

### E-03 · Millora — La prova del catàleg importa i renderitza els 28 espècimens (`allLoaders.test.jsx:10-35`), però no recorre les promeses de `CATALOG_DETAIL_LOADERS` ni exercita `ambReintent` (confirma Codex A3-01).

### E-04 · Millora — Fronteres de mòdul poroses: `NotesContext.jsx:9` → `mur/MurContext`; `SearchSection.jsx:8-9` → `mur`, `xat`; `XatSection.jsx:6,10` → `text`, `notes`; `mediaContent.js:2-4` → `mercat`, `mur`, `pobles`. Nomenclatura barrejada dins de la mateixa API (`selectCategory`/`toggleColumn` vs `tancaPanells`/`panellObert`; `refresh` vs `recarrega`).

### Residus (Millora)

`App.jsx:74` `isGestoriaLink` sense ús i `buildPath` duplicat (`:74`, `:599`); `StrictMode` (`:419`) és un `Fragment` sota `preact/compat`; `JSON.stringify(config)` a cada render (`:416`); `IdentitatContext.jsx:25` estat mort; `AppGridShell.jsx:139-147` recrea el valor del context a cada render; `useHeroImageHandler.js:39-62` fa `setState` després d'`await` sense guarda; `src/shims/` és un directori buit; `AgendaSection.jsx` és orfe (quarantena declarada a `sections.js:3-8`).

---

## 4 · Accessibilitat i usabilitat

### A11Y-01 · [NOU] · Crític — L'enllaç de salt és invisible i inoperant

`App.jsx:238` `<a href="#main-content" className="sr-only sr-only-focusable sdp-skip-link">`. `base.css:229-232` només definix `.sr-only`; **cap regla** per a `.sr-only-focusable` ni `.sdp-skip-link` a tot `src/css` (grep: 0). En rebre el focus, l'enllaç continua a 1×1 px fora de pantalla (WCAG 2.4.7). A més, l'app viu dins d'un *shadow root* tancat (`PedraSecaEmbed.jsx:287`, també en mode autònom via `main.jsx:32-34`); la navegació per fragment busca l'`id` a l'arbre del document, no dins del *shadow root* [SUPÒSIT fonamentat en l'especificació; no provat]: el clic no enfoca ni desplaça res i canvia el `hash`. L'única drecera per a saltar 2 botons i 13 enllaços de la barra lateral no existix a la pràctica (2.4.1). Esmena: `onClick` amb `preventDefault` i `mainRef.current.focus()`, i una regla `.sdp-skip-link:focus-visible { position: fixed; … }` al full del *shadow root*.

### A11Y-02 · Crític — El calaix de la taula de continguts amaga els seus botons i no és operable (confirma Codex P1-08)

`PageFrame.jsx:73` `<div className="toc-overlay" onClick={onClose} aria-hidden="true">` embolcalla l'`<aside>` amb «Tancar taula» (`:77`) i els botons de navegació. `aria-hidden` en un ancestre lleva de l'arbre d'accessibilitat controls que continuen sent tabulables (4.1.2). Sense `role="dialog"`, Escape, focus inicial ni retorn. El kit ja té `Dialeg` amb tot això (`Dialeg.jsx:21-78`).

### A11Y-03 · [NOU] · Crític — Mode fosc: pestanyes de panell i element actiu de la barra inferior il·legibles

`AppGridShell.css:33-38` `.app-grid-headers { background: var(--sdp-fons-invers) }` i `:39-51` `.app-grid-header-btn { color: var(--sdp-sobre-roca) }`. En fosc, `--sdp-fons-invers` passa a `pedra-100 #f8f6f4` (`tokens.css:313`) però `--sdp-sobre-roca` es queda en `pedra-50 #ffffff` (`:98`, no redefinit). Ràtio: **1,08:1**. La pestanya activa usa `--sdp-accent #FF7300` (`:52-55`): **2,53:1**. Són els botons «CATEGORIES/ELEMENTS» que obrin les columnes en pantalles < 1090 px (`AppGridShell.jsx:159-182`): la navegació principal de Notes, Perfil i Disseny en mòbil. Mateix parell a la barra inferior mòbil (`layout.css:376`, `:396`), amb text de 0,7 rem (`:406`). Esmena: capçaleres amb els tokens crom, que no s'invertixen (`tokens.css:240-241`), i actiu amb `--sdp-accent-text`.

### A11Y-04 · [NOU] · Crític — El calaix de la barra lateral en mòbil no té vel, Escape, focus ni tancament en navegar

`App.jsx:240-248` i `:339-347` només alternen `sidebar-open` a la `<nav>` i `sidebar-closed` al `host`. El vel de `layout.css:350` depén de `:host(.has-sidebar-open)`, classe que **cap fitxer JS afegix** (grep). Sense vel, sense «tocar fora per tancar»; el `<main>` continua tabulable (sense `inert`); cap `NavLink` tanca el calaix en navegar. `EspecimenShell.jsx:7` promet «Calaix mòbil: Escape, vel clicable i tancament en navegar»: el catàleg documenta un comportament que el codi no té.

### A11Y-05 · [NOU] · Crític — Els camps editables de l'editor no tenen rol ni nom

`UniversalEditorShell.jsx:36-49` `<span contentEditable … data-placeholder>` sense `role="textbox"`, sense `aria-label`, sense `aria-multiline`, instanciats dins de `<h1>`, `<h2>` i `<p>`. Per a un lector de pantalla són tres zones editables anònimes (4.1.2, 1.3.1); afecta Notes i el perfil. Cap regla `[data-placeholder]::before` a `src/css`: el text «Títol...» probablement no es veu mai [SUPÒSIT].

### A11Y-06 · [NOU] · Crític — Xat: cercador sense etiqueta, fil actiu sense estat, missatges sense regió viva

`XatSection.jsx:173-181` `<input>` amb `id` i `name` (afegits a les 05:30) però sense `aria-label` ni `<label>`; el *placeholder* «CERCA UN XAT...» és l'única pista. `:299-311` el fil actiu només porta la classe `active`, sense `aria-current`. `:475` `.xat-messages` no és `role="log"` ni `aria-live`: els missatges entrants no s'anuncien. `:441-447` menú «···» sense `aria-expanded` ni `role="menu"`.

### UX-01 · [NOU] · Crític — «Esborrar» la imatge de capçalera o el logotip actua a l'instant

`UniversalEditorShell.jsx:228-231` i `:239-242` sobreescriuen `onConfirmDelete` amb una funció que mostra el *toast* «Imatge esborrada» i **retorna `true`**; `useHeroImageHandler.js:71-76` esborra si `confirmed`. El kit té `DialegConfirmacio` amb «focus a Cancel·lar quan és destructiu» (`Dialeg.jsx:14-16,80-96`), però només s'usa al catàleg de Disseny, mai a l'app. Per a persones majors, un toc distret esborra la foto d'una nota o del perfil sense camí de retorn.

### Advertències d'accessibilitat

- **A11Y-07** Cap `aria-current="page"` a la navegació principal: `NavLink` només afegix la classe `active` (`RouterContext.jsx:153-165`); `Botonera.jsx:29` sí que ho fa i la closca no l'usa.
- **A11Y-08** Estats de commutació només en classes: barra de format (`UniversalToolbar.jsx:36-75`, sense `aria-pressed` ni `type="button"`), filtres del xat (`XatSection.jsx:215-218`), botó «Tot» amb `data-active` (`UniversalWorkspace.jsx:178-185`).
- **A11Y-09** `Dropdown.jsx:21-36` tanca amb `onBlur` als 200 ms; el panell no rep focus ni té rol; `UniversalEditorShell.jsx:305-318` posa un `<button>` dins del `div role="button"`.
- **A11Y-10** `AvisadorEfimer.jsx:18-22` sempre `role="alert" aria-live="assertive"`, 3 s sense pausa; en mòbil tapa la barra inferior (`modules.css:2161-2172`, `--z-calaix` > `--z-nav-mobil`).
- **A11Y-11** Missatges d'estat que no s'anuncien: `DetallAjust.jsx:288-292`, `SearchSection.jsx:100-104`, `PerfilShell.jsx:109-115`; l'autoguardat de Notes només avisa quan falla (`NotesContext.jsx:141-149`).
- **A11Y-12** `AppGridShell.jsx:123-127`: en `mitja` la columna esquerra es posa damunt sense vel ni `inert`; sense Escape.
- **A11Y-13** Doble salt de focus en càrrega profunda (`App.jsx:89-93` + `UniversalWorkspace.jsx:417-419`) sense acció d'usuari; destí `div` sense nom.
- **A11Y-14** `DetallAjust.jsx:262-266` casella sense `id` (etiqueta òrfena); `:278-285` contrasenya nova sense `autoComplete="new-password"`; `OnboardingSteps.jsx:156-158` error sense `aria-describedby` en mode «Entrar».
- **A11Y-15** Lletra per davall del «sòl absolut de 14 px» del propi sistema (`tokens.css:202`): barra inferior 0,7 rem (`layout.css:406`) i 0,65 rem a ≤ 480 px (`:475`); filtres del xat 0,8 rem (`components.css:1059`).
- **A11Y-16** El separador redimensionable té 8 px d'amplada de toc (`AppGridShell.css:165-180`); `applyPreset` existix (`AppGridShell.jsx:116-121`) però cap UI la crida.
- **A11Y-17** Cap `prefers-contrast` ni `forced-colors` a `src/`; l'anell de la targeta és `box-shadow` (`components.css:544`) i desapareix en alt contrast.
- **A11Y-18** `layout.css:167-176` animació infinita `sdp-iaia-pulse` sense control a la pàgina (2.2.2); `prefers-reduced-motion` la neutralitza (`:483-489`).
- **A11Y-19** Etiquetes en MAJÚSCULES literals (`App.jsx:258`, `NotesSection.jsx:96`, `XatSection.jsx:177`); alguns lectors les lletregen [SUPÒSIT].
- **A11Y-20** `aria-label` sobre `<div>` sense rol (`App.jsx:261`, `UniversalWorkspace.jsx:344`).
- **A11Y-21** Noms accessibles que no diuen l'acció: botó de tema `aria-label="Tema"` (`App.jsx:361-363`), botó plegar amb el títol com a nom (`AppGridColumn.jsx:80-92`).
- **A11Y-22** `lang` canvia (`App.jsx:146-154`) però la interfície és literal en valencià: amb `lang="en"` el lector pronuncia valencià amb veu anglesa (3.1.1) [SUPÒSIT sobre l'abast].
- **A11Y-23** Codex C3-01: `RouteFallback` usa `sdp-spinner` (`App.jsx:56-62`) i l'única regla és `.spinner` (`modules.css:903-918`).

### Advertències d'usabilitat

- **UX-02** «Publicar» envia la nota al Mur sense confirmació (`UniversalToolbar.jsx:79-89` → `NotesContext.jsx:154-184`).
- **UX-03** Controls morts al xat: els filtres «No llegit/Grups/IAIES» canvien `activeFilter` (`XatSection.jsx:60`, `:215-218`) però `filteredThreads` només filtra per text; «Adjuntar» (`:538`) sense *handler*; set elements del menú «···» sense `onClick`; «Prem ací per a més informació» (`:441`) no és clicable; `th.lastMessageTime || 'Ahir'` (`:316`) inventa una data.
- **UX-04** Pantalles d'error amb argot i to alarmista (`SlotErrorBoundary.jsx:55-57`; `App.jsx:483`). Vegeu S-07.
- **UX-05** Text visible: «Entradilla opcional...» (`UniversalEditorShell.jsx:193`, castellanisme); «Sóc de Poble Desktop» (`XatSection.jsx:345`); «Online-First» (`OnboardingSection.jsx:74`); «dóna-li» (`DetallAjust.jsx:116`); «Benvinguda» vs «Benvingut» (`OnboardingSection.jsx:47,61,72`); «Foraster» / «Identitat Lliure» com a autor (`UniversalEditorShell.jsx:147-148`); «© Sóc de Poble / Fet per la IAIA i Nano Banana» a cada targeta.
- **UX-06** «Comentar X» i «Traduir X» naveguen a `/xat` i `/traduccions` sense context de l'element (`UniversalCard.jsx:255-256`).
- **UX-07** *Pull-to-refresh* fa `window.location.reload()` amb llindar de 100 px (`App.jsx:209-213`); amb tremolor de mans pot disparar-se [SUPÒSIT].
- **UX-08** `useSEO` posa `document.title` només a 11 vistes: Notes, Disseny, Perfil, Onboarding, Cerca i Control mostren «Sóc de Poble» a l'historial (2.4.2).

---

## 5 · Cadena de build, portes, CI i desplegament

### B-01 · [NOU] · Crític — `npm run build` muta tres fitxers versionats i la porta pre-commit pot llançar-lo a mitjan commit

`build-tokens.mjs:5-6,42` escriu `src/css/design-tokens.css`; `build_rag_index.mjs:116-117` escriu `public/rag-index.json`; `build_slug_index.mjs:65-66` escriu `public/slugIndex.json`. Els tres són a `git ls-files`. La «Porta Build» (`run-portes.mjs:34`) executa `npm run build` (`tractor-build-previ.mjs:87-91`) si `wordpress-plugin/dist/soc-de-poble.standalone.js` és més vell que `src/main.jsx` o `src/PedraSecaEmbed.jsx`: qualsevol edició d'eixos dos fitxers fa que el pròxim commit amb *hook* execute un build complet que modifica fitxers fora de l'índex. Coherent amb la nota de memòria: cap porta ha de construir.

### B-02 · [NOU] · Crític — `public/rag-index.json` publica a producció l'índex de la documentació interna

2.638.144 B (regenerat a les 05:25), generat a `public/` i copiat per Vite als dos builds (present a `dist/` i `wordpress-plugin/dist/`). Contingut (llegit amb Node): 172 documents amb `path` visible, **30 sota `.agents/`** (`ESTAT.md`, `LEDGER.md`, `BIOS.md`, `PROFILE.md`, `skills/*/SKILL.md`), **25 sota `04_escriptori`** (prompts i informes d'auditoria, inclosos els d'avui), `scratch/inventory.md`, `supabase/…`; el recorregut inclou `.agents` explícitament (`build_rag_index.mjs:16`). 10.756 termes indexats. **Cap consumidor al frontend** (grep a `src/` i `index.html`: 0). No s'hi han trobat correus, JWT ni claus per patró. Esmena: escriure l'índex fora de `public/` o excloure `.agents`, `04_escriptori` i `scratch`.

### P-01 · Crític — No hi ha plugin WordPress al repositori (confirma Codex P2-07)

`wordpress-plugin/` conté només `dist/`; `find . -name '*.php'` fora de `node_modules`: 0. El *tooling* el pressuposa: `tractor-consell-core.mjs:306-309` exigix `seo-routes.json` i `sdp_resolve_request()`; `tractor-sollutia.mjs:17` i `PedraSecaEmbed.jsx:465-469` citen `blank.php`. El standalone té nom fix sense *hash* (`vite.standalone.config.js:49`): **no hi ha cache-busting**.

### P-02 · Crític — Cap dels dos *workflows* de GitHub pot posar-se verd (confirma Codex P0-04)

`wiki-integrity.yml:38` `npm run gateall` (script inexistent); `:47` `pnpm run gate` sense pnpm ni `pnpm-lock.yaml`. `sdp_lock_ci.yml:22` `npm run gate` amb portes roges. La CI no dona senyal; el *bypass* local (`git commit --no-verify`, documentat a ESTAT com a usat) no té xarxa al servidor.

### P-03 · Crític — `Dockerfile` no es pot construir i incrusta `.env` (confirma Codex P0-04)

`Dockerfile:10` copia `pnpm-lock.yaml` (inexistent); `:17` `COPY .env ./.env`; `:23` `pnpm run start` amb un `package.json` sense `start`; `docker-compose.yml:11` munta `.env` també com a volum. Sense `.dockerignore`.

### Advertències de build i portes

- **G-01** Classificació de les portes roges executades: R2 `private.ajustos` → porta cega a l'esquema (`tractor-rls.mjs:157-158`); R3 `profiles read own using (true)` → històrica, restaurada a `260916_0600:74-79`; Cadena C1/C4 → etiquetes de script caducades a `run-portes.mjs:45,73`; Inline-styles i Persistència → reals segons contracte. Les 17 portes restants de la nota de memòria no s'han tornat a executar.
- **G-02** El *hook* executa lint i proves tres vegades (`.husky/pre-commit:6,12,18` més «Linter» i «Proves» dins de la cadena) i només mostra el primer roig.
- **G-03** [NOU] Dos jocs de *hooks*: `core.hooksPath = .husky/_`; `.githooks/` (5 fitxers versionats) és una còpia morta, i `.githooks/post-commit` executa `reflex_petorreta.mjs consume-commit` mentre `.husky/post-commit:3` és un comentari: eixe pas no s'executa mai.
- **B-03** [NOU] 88 MB de pujades d'usuari versionats (`public/assets/uploads`, 209 fitxers) i copiats a cada artefacte (106 MB dins de `dist/`).
- **B-04** Dues configuracions Vite divergents: `es2020` vs `es2015`; `jsxImportSource` i `define process.env` només al standalone; `emptyOutDir: false` amb comentari sobre `build:seo` retirat (`vite.standalone.config.js:40-43`); cap dels dos fixa `base`.
- **B-05** Standalone monolític de 1,78 MB (gzip 519 kB) amb l'editor de Notes dins (482 kB al web, on és *lazy*).
- **B-07** [NOU] `build_slug_index.mjs:37` usa `parsed.meta`, però `parseFrontmatter` retorna `data` (`tooling/wiki/lib/frontmatter.mjs:247,269`): 172/172 entrades amb `type: 'wiki'` i títol derivat del nom de fitxer. `build_rag_index.mjs:71-79` usa `attributes`, que tampoc existix: *tags* i *aliases* mai s'indexen. L'índex semàntic publicat és fals en silenci.
- **DEP-01** React 18.3.1 i Preact 10.29.8 instal·lats alhora amb `"react": ">=18.0.0"`: un `npm update` passaria a React 19 sense tocar `package.json`.
- **DEP-02** `date-fns` i `react-day-picker` a `dependencies` amb 0 imports (grep; `depcheck` no instal·lat).
- **Higiene de l'arrel** (AGENTS.md §3): `report.json`, `extract.py`, `generate_catalog.py`, `scratch/` (28 fitxers, un dels quals entra a l'índex RAG), `tools/` (5 Python) coexistint amb `tooling/`, `.brain-trash/`, `.sdp-paperera/`, `.wwebjs_cache/`.
- **Frontmatter de la Wiki** [NOU]: `schema.json:13-29` no admet `macro_prompt`, `micro_prompt`, `macro_bundle`, `micro_bundle`, mentre la plantilla `00_PLANTILLA_PROMPT_CONSELL.md:53-54` els declara vàlids i el prompt d'esta auditoria usa `type: macro_prompt`. Amb `--estricte`, el propi encàrrec cau per F3.

---

## Controls que aguanten

- **Port de backend fail-closed**: només mètodes del contracte (`backendPort.js:15-26`), congelat al segellat (`:33-36`), cap mètode absent resol en silenci (`:51-56`); `configura()` després del segellat s'ignora fora de DEV (`host.js:110-118`). Portes Enxufe, Frontera, InnerHTML i Importacions verdes.
- **Sanejament**: DOMPurify com a única porta d'HTML amb *hooks* armats en carregar (`sanitize.js:31-69`), llista tancada de *tags*/atributs, imatges externes bloquejades, `rel="noopener noreferrer nofollow"`; els sis `dangerouslySetInnerHTML` passen per `sanitizeHtml`; l'editor saneja a l'entrada, al desat i a la publicació (`mapejadorSeccions.js:31-137`).
- **RLS**: activada a les 13 taules i a `storage.objects`; totes les funcions `security definer` amb `set search_path = ''`; `revoke … from public, anon` sistemàtic en RPC; superadmin comprovat dins de les RPC; `handle_new_user` ignora el `tenant_id` del client; límit de taxa atòmic al xat; Realtime no publicat a propòsit.
- **OAuth**: PKCE amb verificador a `sessionStorage`, relé únic a la llista blanca, `postMessage` comprovant origen i `source`, tallafocs d'intents, neteja de l'URL; el relé valida `sdp_origin`, sanetja `sdp_path`, no veu mai *tokens* i porta CSP pròpia (`callback.html:7`).
- **Amfitrió**: origen i `source === window.parent` obligatoris (`host.js:319-326`), `emissorEsperat` obligatori (`:364-368`), `window.SocDePoble` congelat i no reconfigurable (`:309-310`).
- **Proveïdors**: generació + `active` + `AbortController` als quatre; el Xat aïlla el seu error a `avis`, fa sondeig amb retrocés i pausa en pestanya amagada, i reversió optimista real; `updateNote` exigix `expectedRevision`.
- **Accessibilitat que sí**: anell `:focus-visible` dins del *shadow root* amb parella per a cada `outline: none`; `min-width/min-height: 44px` mecànic a tot `button` (`base.css:208-212`); `Dialeg` natiu amb `showModal`, retorn de focus *shadow-aware* i `cancel` interceptat; `Pestanyes` amb focus itinerant; `Camp` fail-closed amb `aria-describedby`/`aria-invalid`; `Pista` que tanca amb Escape; `PillToggle` amb estil per `aria-pressed`; `prefers-reduced-motion` global amb `!important`; zoom no bloquejat; 0 `font-size` en px; `inert` + `aria-hidden` a les columnes tancades; onboarding amb `autoComplete` correcte i errors associats. Contrast de text calculat: AA a tot el text semàntic en clar, AAA en fosc, excepte A11Y-03.
- **Build**: guarda anti-recursió `SDP_DINS_DE_PORTA` (`run-portes.mjs:85-92`) i `build` sense `npm run gate`; sense *sourcemaps* en producció; noms amb *hash* al build web; aturador `service_role` a les dues configuracions Vite; `.env*` ignorats; `npm audit` a 0.

## Matriu DAFO

| Fortaleses | Debilitats |
| --- | --- |
| Port de backend únic, congelat i fail-closed; sanejament i RLS ben governats | La llista blanca de configuració exclou el propi backend de producció (S-01) |
| Kit Pedra Seca amb primitives accessibles ben fetes (`Dialeg`, `Camp`, `Pestanyes`) | La closca (App.jsx, PageFrame, editor, xat) no usa eixes primitives: salt invisible, TOC oculta, esborrat sense confirmar |
| Catàleg i cadena de build recuperats en 24 h; 47 proves verdes | Cap enllaç de detall obri (R-01); el cercador peta (D-01); el *timeout* congela el portal (H-02) |
| `useSEO` viu, sitemap acotat a rutes públiques | La portada i sis pàgines públiques es desindexen; capa HTTP muda; quatre fonts de rutes |
| Tres auditories independents el mateix dia convergixen en el NO-GO | El *tooling* publica documentació interna a `public/` i muta fitxers versionats en construir |

| Oportunitats | Amenaces |
| --- | --- |
| `X-Robots-Tag` i *head* estàtic per ruta: SEO correcte sense SSR en dos passos de baix cost | Desplegament «remote» que no carrega res el dia de l'estrena (S-01) |
| Una sola llista de rutes que alimente `App.jsx`, sitemap i portes | Xarxa rural: cada *timeout* de 12 s és un portal congelat sense eixida (H-02) |
| `TimeoutError` + reintent amb retrocés als quatre proveïdors | Sessions expulsades per una pèrdua de cobertura de segons (S-05) i renovació impossible sense capacitat `sessio` (S-C4) |
| `eslint-plugin-jsx-a11y` + `react-hooks` actives tancarien de colp mitja llista | Índex RAG públic que exposa processos interns i noms de fitxers de l'Escriptori (B-02) |
| Adaptar la closca a `Dialeg`/`DialegConfirmacio` ja existents | Un `npm update` que salte a React 19 sense tocar `package.json` (DEP-01) |

## Pla d'acció proposat (per a l'`implementation_plan.md` de la IAIA MarIA)

Ordenat per dependències i cost. Cada punt té criteri d'acceptació verificable.

1. **Aturadors de dades (mateix commit, sense decisió humana):** afegir l'origen Supabase de producció a la llista blanca i condicionar `localhost` a DEV (S-01); `TimeoutError` a `request()` i tractar-lo com a `error` als quatre proveïdors (H-02); guarda a `SearchSection` i `searchText` a `mapejaFil` (D-01); `loadNotes` amb `getCurrentUser()?.id` (S-09); `config` a `adminList*` i `uploadToStorage` (S-10). Acceptació: prova que `https://x.supabase.co` sobreviu a `sanejaConfig`; prova de *timeout* → `status: 'error'`; prova de cerca amb un fil.
2. **Rutes:** `getSectionItemPath` amb base d'actor o `/:sectionId/:itemId` a primer nivell (R-01); pàgines de text a primer nivell i `/` cap a contingut públic (SEO-01); `finalIndex` al canonical i neteja a `useSEO` (SEO-03/04); `useSEO` a les 11 vistes que no el criden. Acceptació: porta que cada ruta generada per `navigation.js` casa amb una `<Route>`.
3. **Capa HTTP:** `X-Robots-Tag` per prefix i capçaleres de seguretat a `vercel.json`; `Disallow` a `robots.txt`; *head* estàtic per ruta pública generat des d'una única llista que també escriu `sitemap.xml` (SEO-02, SEO-07). Acceptació: `curl` sense JavaScript a `/jo/xat` torna `noindex`; a `/mur` torna títol i canonical propis.
4. **Sessió (decisió humana prèvia: Model A o B):** rol per defecte i `sdp:sessio-caduca` sense capacitat `sessio` (S-C4); distingir xarxa de rebuig en `refresca` (S-05); `/auth/v1/logout` en `logout()` (S-04); verificar `state` d'OAuth i PKCE a l'enllaç màgic amb una crida real (S-02, S-03); `aud` configurable (S-06).
5. **Accessibilitat de la closca:** enllaç de salt amb `onClick` i CSS (A11Y-01); TOC amb `Dialeg` (A11Y-02); *tokens* crom a les capçaleres de panell i `--sdp-accent-text` a l'actiu (A11Y-03); estat `sidebarObert` a React amb vel, `inert`, Escape i tancament en navegar (A11Y-04, H-09); `role="textbox"` als camps editables (A11Y-05); `aria-label`, `aria-current` i `role="log"` al xat (A11Y-06); `DialegConfirmacio` a esborrar imatge i a publicar (UX-01, UX-02). Acceptació: `eslint-plugin-jsx-a11y` activat i una prova axe per vista.
6. **Build i publicació:** índex RAG fora de `public/` o amb `.agents`, `04_escriptori`, `scratch` exclosos (B-02); generadors que no escriguen a `src/`/`public/` versionats i «Porta Build» que només informe (B-01); corregir `parsed.meta`/`attributes` als dos índexs (B-07); `emptyOutDir: true` i `base` a les dues configuracions Vite (B-04); fixar `react` (DEP-01); retirar `date-fns`/`react-day-picker` si no s'usen (DEP-02).
7. **Canonada única (decisió humana):** Vercel, WordPress o Docker; retirar o posar en quarantena les altres; arreglar `wiki-integrity.yml` (P-02); `.dockerignore` i `Dockerfile` sense `.env` (P-03); un sol joc de *hooks* (G-03); etiquetes de script coherents a `run-portes.mjs` (G-01).
8. **Xarxa de seguretat:** activar `rules-of-hooks`, `exhaustive-deps`, `react/jsx-no-undef` (E-02); proves de `RouterContext` (`basename`, `Link`, `MemoryRouter`), de `SessionContext` (renovació amb i sense capacitat), de `sanejaConfig`, i de la cadena URL → `selection/sync` → reconciliació a `/disseny`.

## Incògnites

- **Origen real de Supabase en producció** (S-01): `*.supabase.co` o domini personalitzat. Sense esta dada no es pot saber si el desplegament actual carrega.
- **GoTrue i `state`** (S-02) i **enllaç màgic amb PKCE** (S-03): cal una crida real; el repositori no permet decidir-ho.
- **Model A vs B** (qui emet, renova i revoca el JWT; `iss`, `aud`, JWKS): sense això S-C4, S-04 i S-06 no tenen esmena única.
- **«Mur públic»** (S-11): inclou aportacions de veïns per a anònims o només contingut editorial? Decisió de producte.
- **Capçaleres per defecte de Vercel** (HSTS, caché d'`/assets/*`) i CSP de l'amfitrió Sollutia en mode incrustat.
- **Comportament del fragment i d'`inert` dins d'un *shadow root* tancat** (A11Y-01, A11Y-12) i **regió viva creada amb contingut** (A11Y-10): anàlisi estàtica; cap navegador ni lector de pantalla executat.
- **Visibilitat del remot** per a decidir si cal reescriure la història de S-14.
- **Les 17 portes roges de la nota de memòria** que no s'han tornat a executar (algunes amb `--lock-token`/baseline): no es poden classificar com a defecte real vs porta caducada.
- **Estat de l'arbre en el moment de llegir este informe**: l'activitat concurrent d'hui fa probable que algunes cites hagen canviat de línia. Totes eren exactes a les 05:45.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura? Sí: cinc lectures per àrea (≈150 fitxers de `src/`, 13 migracions, 12 portes, les dues configuracions Vite, els *workflows*, `Dockerfile`), més verificació creuada meua de cada troballa crítica contra el disc de les 05:45.
- [x] He citat correctament la ruta i les línies del codi original? Sí, i reverificades després del commit `e0594755` i de les edicions de les 05:30.
- [x] Cap nom de fitxer, funció o variable inventat? Cap. Els noms proposats a les esmenes (`TimeoutError`, `sdp:sessio-caduca`, `sidebarObert`) es presenten com a codi suggerit.
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites? Sí.
- [x] El document passa `tractor-frontmatter.mjs --estricte`? Comprovat després d'escriure'l sobre l'abast d'este fitxer (vegeu el missatge de lliurament). El corpus sencer continua roig per deute preexistent, inclòs el `type: macro_prompt` del propi encàrrec.
- [x] Cap línia de codi tocada? Cap. Només este fitxer, la seua línia a l'índex de l'Escriptori i l'acta a `.agents/ESTAT.md`.
