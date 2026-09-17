---
tipus: informe
estat: generat
description: "Resultats de l'Auditoria Extrema realitzada per Codex"
tags:
  - maquina
  - seguretat
---

# Petorreta — Auditoria Extrema: Integració Sollutia

## Dictamen executiu

No donaria llum verda a un desplegament autenticat dins de Sollutia en l’estat auditat.

Hi ha quatre aturadors principals:

1. La configuració pública permet redirigir credencials i JWT cap a un `supabaseUrl` arbitrari.
2. Els tokens viuen en el mateix `sessionStorage` que els scripts del CMS amfitrió.
3. El build WordPress pot compilar una `service_role` sense l’aturador del build principal.
4. Notes i Disseny perden el CSS estructural dins del Shadow DOM tancat, causa directa del trencament visual.

L’arbre continua net i no s’ha modificat, afegit ni esborrat cap fitxer. No s’ha utilitzat xarxa, navegador ni informació externa.

| Camp | Valor |
| --- | --- |
| Repositori | `socdepoble.org` |
| Branca | `backup-notes-publish` |
| Commit auditat | `0728da015036734315eb0f49148015499cb0d3d9` |
| Estat final | net |
| Abast | només lectura |
| Captura de mockup | no adjuntada |

[SUPÒSIT] La proposta visual posterior usa els tokens existents de Pedra Seca. No pot afirmar fidelitat cromàtica o tipogràfica al mockup absent. L’únic recurs local relacionat és una fotografia d’un quadern, no una captura d’interfície.

## Qualitat de la font de veritat

El manifest no representa el repositori actual:

- 217 entrades declarades.
- 58 rutes declarades ja no existeixen.
- 36 fitxers actuals de `src` no estan declarats.
- Dels 159 fitxers declarats que encara existeixen, 78 no coincideixen amb el hash.
- El manifest és anterior al commit auditat: `manifest.json:2-4`.
- Encara declara restes com `NotesSection.jsx.orig` i `.rej`: `manifest.json:139-166`.
- El catàleg viu de Disseny, migracions, callback OAuth i diverses portes queden fora del manifest.

Això impedeix satisfer honestament “citar només rutes del manifest” sense ocultar troballes crítiques. Les cite marcades com a `[FORA DE MANIFEST]`.

## Bateria mecànica real

| Comprovació | Resultat | Lectura |
| --- | --- | --- |
| `npm run lint` | passa amb 130 avisos | No és un estat net d’avisos. |
| `porta:enxufe` | passa | No detecta la contradicció Model A/Model B. |
| `porta:frontera` | passa | Cobertura parcial. |
| `porta:frontera-auth` | passa | Fals verd: no prova sufixos, ports ni HTTP. |
| `porta:graella` | passa | Fals verd: el separador canvia estat però no amplària. |
| `porta:seo` | passa | Fals verd: comprova recompte, no correspondència amb rutes React. |
| `porta:rls` | falla, 2 troballes | Principalment falsos positius històrics; vegeu més avall. |
| `porta:cataleg` | falla | Catàleg no navegable i registre divergent. |
| `porta:inlinestyles` | falla | `App.jsx` i `UniversalEditorShell.jsx`. |
| `porta:classes` | ix amb 0 i informa 129 classes mortes | La porta força `return 0`: `tooling/gates/tractor-classes.mjs:120-168` `[FORA DE MANIFEST]`. |
| `npm ls --all --omit=optional` | falla | Arbre Tiptap inconsistent i `date-fns@4` fora del peer admés per `react-day-picker@8`. |
| `tractor-frontmatter --estricte` | falla | Deute global preexistent: F1, F2, F3, F4, F5 i F7. |

No he executat `npm run build`: genera tokens, SEO, RAG, slugs i `dist`, cosa incompatible amb l’auditoria només-lectura. A més, el build acaba en portes que ja fallen, de manera que l’afirmació “tot compila perfectament en verd” no queda sustentada.

## Troballes de seguretat i Sollutia

### P0 — Configuració capaç d’exfiltrar credencials

`sanejaConfig` accepta qualsevol URL HTTP(S) per a `supabaseUrl`, configurada des d’atributs o propietats públiques del component: `src/PedraSecaEmbed.jsx:135-185`.

Després:

- El login envia correu i contrasenya a eixe origen: `src/data/supabase/auth.js:115-123`.
- El runtime hi envia `apikey` i `Authorization: Bearer <JWT>`: `src/data/supabase/runtime.js:38-53`.

[SUPÒSIT] L’explotació requereix que un editor, integrador o script del CMS puga alterar la configuració del widget. Amb eixa precondició, l’exfiltració és directa.

**Correcció:** origen backend immutable fora del DOM, HTTPS obligatori i allowlist exacta per desplegament/tenant.

### P0 — CSS remot injectat al document de Sollutia

`fontsHref` accepta qualsevol URL HTTP(S) i crea un `<link rel="stylesheet">` dins del `document.head`, fora del Shadow DOM: `src/PedraSecaEmbed.jsx:89-112,160-185`.

[SUPÒSIT] Amb control de configuració, permet telemetria CSS, redreçament visual i interferència amb la interfície amfitriona. No equival a execució JavaScript.

**Correcció:** empaquetar fonts localment o usar origen exacte, SRI i CSP estricta.

### P0 — La frontera del Shadow DOM no protegeix els tokens

JWT, refresh token i usuari es desen sota claus globals de `sessionStorage`: `src/data/identitat.js:58-60,129-135`; `src/config/storage.js:58-72`.

En un Web Component executat al mateix origen que Sollutia, qualsevol script del CMS o de tercers amb eixe origen pot llegir-los. El Shadow DOM només aïlla DOM/CSS; no crea una frontera JavaScript.

**Correcció recomanada:** iframe d’origen propi per a la part autenticada o BFF amb cookie `HttpOnly`, `Secure` i `SameSite`. El Web Component same-origin hauria de quedar restringit a dades públiques o sessions delegades verificades.

### P0 — Possible fuga de sessió entre instàncies

El component permet diverses instàncies simultànies i cadascuna pot declarar un backend diferent: `src/PedraSecaEmbed.jsx:227-250`. Tanmateix, la sessió és global i `request()` envia eixe JWT global al backend de cada instància: `src/data/identitat.js:58-60`; `src/data/supabase/runtime.js:38-53`.

[SUPÒSIT] Amb dos widgets vius i dos orígens Supabase diferents, el token de la instància A pot acabar enviat a B.

**Correcció:** context d’autenticació per instància i claus namespaced, o rebuig fail-closed de qualsevol segon origen abans del primer `fetch`.

### P0 — `service_role` pot entrar al build WordPress

L’aturador existeix en `vite.config.js:9-17` `[FORA DE MANIFEST]`, però no en `vite.standalone.config.js:9-40` `[FORA DE MANIFEST]`. `build:wp` es pot executar directament i `src/main.jsx:42-48` incorpora la clau al bundle.

**Correcció:** una comprovació compartida i fail-closed carregada per totes les configuracions abans de generar cap artefacte. L’escaneig posterior de `dist` és defensa secundària, no substitut.

### P1 — Sessió externa falsificable a nivell d’interfície

El missatge pot aportar el seu propi `emissorEsperat`: `src/host.js:345-364`. `adoptaSessioExterna` comprova forma, `exp`, `sub`, `iss` i `aud`, però no verifica la signatura JWS abans de persistir: `src/data/identitat.js:228-294`.

Impacte verificat: suplantació i estat autenticat de la UI. No s’ha demostrat bypass de PostgREST/RLS, que hauria de rebutjar la signatura falsa.

**Correcció:** emissor i audiència fixats fora del missatge, verificació JWKS o introspecció, nonce de handshake i expulsió davant un 401 irrecuperable.

### P1 — Allowlist basada en sufixos

El pont, el relay i el callback admeten subdominis amb `endsWith`: `src/host.js:306-319`; `src/data/oauthRelay.js:285-300`; `public/auth/callback.html:86-100` `[FORA DE MANIFEST]`.

El comentari del callback promet igualtat exacta a `public/auth/callback.html:28-32` `[FORA DE MANIFEST]`, però la implementació accepta una frontera més gran.

[SUPÒSIT] Esdevé explotable si hi ha un subdomini delegat, menys fiable o vulnerable a takeover.

**Correcció:** manifest únic de `scheme + host + port`; cap sufix, cap HTTP i cap port implícit.

### P1 — El Model B de Sollutia no està implementat

L’ADR accepta Model B, exigeix un adaptador GET-only i diu que no s’ha d’obrir `backendPort`: `_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md:28-45` `[FORA DE MANIFEST]`.

Però:

- Els adaptadors i fixtures citats no existeixen.
- El port injectable continua obert: `src/host.js:100-175`.
- La porta declara èxit amb zero contractes: `tooling/gates/tractor-adaptadors.mjs:21-57` `[FORA DE MANIFEST]`.
- El manual documenta un `deferArrenca()` inexistent i una injecció parcial incompatible amb el contracte real: `_wiki_de_poble/02_saber/estandard_integracio_react.md:31-55` `[FORA DE MANIFEST]`.

Açò no és “enchufabilitat absoluta”: són dos models incompatibles convivint sense negociació de versió.

**Decisió necessària:** o implementar Model B de punta a punta, o revocar formalment l’ADR i versionar Model A.

### P1 — Backend híbrid després d’un reintent

`setBackendImplementation` fusiona sobre l’objecte anterior: `src/data/backendPort.js:5-27`. `configura()` muta abans de validar i una arrencada fallida reinicia flags, però no elimina els mètodes injectats: `src/host.js:100-145,162-186`.

Un segon intent pot completar el contracte amb mètodes de dos backends diferents.

**Correcció:** construir un candidat nou, validar-lo completament, substituir-lo atòmicament i descartar-lo íntegrament si falla.

### P1 — Integritat multi-tenant d’autoria

`author_org_id` referencia només l’ID de l’organització; la RLS comprova separadament la pertinença al tenant i la gestió de l’organització: `supabase/migrations/260908_0000_initial_schema.sql:94-105,385-399,770-788` `[FORA DE MANIFEST]`.

El trigger final copia el nom sense comprovar el tenant: `supabase/migrations/260916_2300_correccions_mur_i_xat.sql:25-36` `[FORA DE MANIFEST]`.

Un membre de B que administre una organització d’A pot atribuir a A una publicació de B.

**Correcció:** FK composta `(tenant_id, author_org_id)` i comprovació conjunta en política i trigger.

### P1 — Configuració perduda en refresh, rol i administració

`SessionProvider` crida `refrescaSessio()` i `elMeuRol()` sense la configuració de la instància: `src/app/contexts/SessionContext.jsx:35-40,80-86`. El backend degrada silenciosament a sessió no refrescada o rol `usuari`: `src/data/supabase/auth.js:11-15,48-54`.

Administració rep llistes buides pel mateix motiu: `src/sections/admin/AdminSection.jsx:72-83,112-123`; `src/data/supabase/admin.js:1-9`.

**Correcció:** backend/config immutable lligat al boot i disponible des dels providers; cap degradació silenciosa en operacions administratives.

### P2 — Magic link i logout incomplets

- Magic link no crea `state` ni verificador, però la tornada els exigeix: `src/data/supabase/auth.js:127-138`; `src/data/oauthRelay.js:325-340`.
- `logout()` només elimina estat local; no revoca el refresh token al servidor: `src/data/supabase/auth.js:149`; `src/data/identitat.js:165-174`.

[SUPÒSIT] Un refresh token copiat abans del logout continua sent reutilitzable fins a expiració, rotació o revocació externa.

## Notes, Disseny i “fantasmes”

### Causa principal del trencament visual

`PedraSecaEmbed` injecta únicament `src/css/index.css?inline` al Shadow DOM tancat: `src/PedraSecaEmbed.jsx:39,268-290`.

Però `index.css` no importa els dos fulls estructurals: `src/css/index.css:45-66`. Aquests entren com imports JavaScript:

- `src/components/layout/AppGridShell.jsx:3`
- `src/sections/profile/PerfilShell.jsx:10`

Vite els extrau com a CSS de document, que no travessa el Shadow DOM. Per això els components existeixen però la graella apareix visualment desfeta.

### El separador de columnes és decoratiu

`columnWidths` s’actualitza i es persisteix: `src/components/layout/AppGridShell.jsx:49-55,86-108`. El CSS espera `--app-grid-col-sidebar` i `--app-grid-col-list`: `src/components/layout/AppGridShell.css:73-80`.

Cap valor de React arriba a aquestes variables. El separador canvia ARIA i estat, però no la mida visible.

### Contracte de Notes trencat

`NotesSection` demana `status`, `obriConfiguracioNotes` i `informaError`: `src/sections/notes/NotesSection.jsx:21-25`. `NotesContext` no exposa cap d’aquests valors: `src/sections/notes/NotesContext.jsx:152-161`.

L’estat i l’error sí que existeixen en `NotesDataContext`: `src/sections/notes/NotesDataContext.jsx:42-50`, però es perden abans d’arribar a la vista.

### Recuperació d’esborranys impossible

`getEfimer` ja retorna JSON parsejat: `src/config/storage.js:58-64`. `NotesContext` intenta tornar a executar `JSON.parse(stored)`: `src/sections/notes/NotesContext.jsx:49-56`.

Quan `stored` és un objecte, es llança una excepció i els esborranys es reinicien.

### Corrupció del booleà de publicació

`netejaCamp` envia qualsevol camp no HTML a `netejaText`: `src/sections/notes/NotesContext.jsx:12-18`. Això converteix `true` en `"true"`: `src/utils/sanitize.js:97-103`.

Supabase espera `is_published` booleà: `src/data/supabase/notes.js:46-59`; `supabase/migrations/260914_0000_schema_notes.sql:18` `[FORA DE MANIFEST]`.

A més, `publishNote` ignora el `false` retornat pel desat i mostra èxit igualment: `src/sections/notes/NotesContext.jsx:122-150`.

### El workspace actual encara és una maqueta

`UniversalWorkspace` pinta botons i llistes crus, sense adoptar les fitxes canòniques: `src/components/universal/workspace/UniversalWorkspace.jsx:104-246`.

Les fitxes Pedra Seca ja existeixen a `src/css/modules.css:21-168`. Mentrestant, continuen vius dos arbres CSS paral·lels: `src/css/modules.css:176-380`.

### L’adaptador legacy perd informació

`adaptLegacyContract` ignora `options`, `getValue`, `initialActiveFacets`, `pageTitle`, imatge i icona: `src/components/universal/workspace/UniversalWorkspace.jsx:264-304`.

Això afecta directament:

- Perfil: `src/sections/profile/PerfilShell.jsx:15-32,60-69,118-131`.
- Administració: `src/sections/admin/AdminSection.jsx:89-108,129-149`.

### Disseny està pràcticament buit

La ruta obri `fonaments` per defecte: `src/sections/disseny/DesignSection.jsx:27-40`.

Però el manifest té tres categories i un sol ítem, dins de Formularis: `src/sections/disseny/cataleg/manifest.js:2-20` `[FORA DE MANIFEST]`. Les destinacions legacy apunten a ítems inexistents: `src/sections/disseny/cataleg/manifest.js:24-27` `[FORA DE MANIFEST]`.

El registre conté `estructura/app-grid`, però no hi ha cap ítem navegable que l’invoque: `src/sections/disseny/cataleg/detailRegistry.jsx:4-7` `[FORA DE MANIFEST]`.

### Editor: DOM nou amb CSS vell

`UniversalEditorShell` usa `sdp-editor-shell-atomic`, `sdp-canvas` i `sdp-prose`: `src/components/universal/UniversalEditorShell.jsx:150-205`.

El CSS viu continua apuntant a `.editor-shell--main`, `.editor-scroll-area`, `.editor-page-frame*` i `.ues-*`: `src/css/modules.css:547-579,623-657`.

També:

- Força `chrome="context"` i recupera barres que Disseny diu que Notes no ha de tindre: `src/components/universal/UniversalEditorShell.jsx:150-158`.
- Els `span[contentEditable]` no tenen rol ni nom accessible: `src/components/universal/UniversalEditorShell.jsx:36-48`.
- Passa títols i paràgrafs React encara que estiguen buits: `src/components/universal/UniversalEditorShell.jsx:168-197`; `src/components/universal/PageFrame.jsx:286-294`.
- El fallback `/assets/system/ui/default-avatar.jpg` no existeix: `src/components/universal/UniversalEditorShell.jsx:144-148`.

### Toast fora del sistema de disseny

El Shadow DOM és tancat: `src/PedraSecaEmbed.jsx:268-297`. `AvisadorEfimer` intenta llegir `element.shadowRoot`, cosa que sempre retorna `null` en mode tancat, i acaba muntant el toast al `document.body`: `src/components/universal/AvisadorEfimer.jsx:44-64`.

El toast queda fora dels tokens, la cascada i l’aïllament de Pedra Seca.

### Navegació i focus

- `UniversalPage` fa `navigate(-1/1)`: `src/components/universal/UniversalPage.jsx:16-20,62-73`.
- `MemoryRouter` intenta executar `startsWith` sobre el número: `src/app/contexts/RouterContext.jsx:283-296`.
- `useSearchParams` construeix la URL des de `window.location` i sempre usa `replace`: `src/app/contexts/RouterContext.jsx:102-119`.
- En mòbil es marca una columna com `inert` mentre el focus pot continuar dins d’ella: `src/components/universal/workspace/UniversalWorkspace.jsx:115-119,235-238`.
- Els IDs fixos de graella col·lisionen si conviuen diverses instàncies: `src/components/layout/AppGridShell.jsx:147-214`.

## SEO

La realitat React i el manifest SEO divergeixen:

- `sections.js` declara Notes, Xat i Multimèdia com a seccions de primer nivell: `src/config/sections.js:4-20`.
- React només exposa Mur, Mercat i Pobles com a rutes públiques de primer nivell: `src/app/App.jsx:508-517`.
- Notes, Xat i Multimèdia viuen sota una ruta d’actor: `src/app/App.jsx:559-568`.
- El generador SEO crea totes les seccions com a top-level indexables: `tooling/gates/build-seo-manifest.mjs:172-220` `[FORA DE MANIFEST]`.
- L’artefacte final declara Notes/Xat/Multimèdia amb estat 200 i indexació: `wordpress-plugin/dist/seo-routes.json:5-57` `[FORA DE MANIFEST]`.

Això pot oferir metadata 200/indexable per una URL que React resol com a 404.

Notes i Disseny tampoc invoquen `useSEO`: `src/sections/notes/NotesSection.jsx:1-70`; `src/sections/disseny/DesignSection.jsx:1-70`. El hook no restaura el `<head>` en desmuntar: `src/hooks/useSEO.js:11-128`.

Notes hauria de declarar sempre `index: false`.

## RLS: interpretació dels dos avisos

`porta:rls` no demostra dos forats vius:

- `private.ajustos` està en un esquema privat amb grants públics revocats: `supabase/migrations/260908_0000_initial_schema.sql:17-21` `[FORA DE MANIFEST]`.
- La política històrica permissiva de `profiles` és reemplaçada per migracions posteriors: `supabase/migrations/260912_admin_panel.sql:15-17`; `supabase/migrations/260916_0600_rls_i_privacitat_extrema.sql:74-79` `[FORA DE MANIFEST]`.

La troballa ací és una porta que no calcula l’estat SQL efectiu i barreja història amb esquema final.
