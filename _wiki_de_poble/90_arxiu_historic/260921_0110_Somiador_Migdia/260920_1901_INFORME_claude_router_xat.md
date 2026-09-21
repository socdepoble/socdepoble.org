---
tipus: informe
estat: esborrany
description: "Auditoria local (només lectura) de Router, Identitat, Sanitize, Xat, PedraSeca i portes — resposta a SDP-PROMPT-202609201656-CLAUDE"
tags:
  - maquina
  - claude-local
  - router
  - xat
  - identitat
  - sanitize
  - portes
---
# Informe — Auditoria local de cobertura pendent (Claude Code)

## Registre

| Camp | Valor |
| --- | --- |
| Respon a | SDP-PROMPT-202609201656-CLAUDE |
| Data | 2026-09-20 19:01 |
| Branca auditada | `backup-notes-publish` (HEAD `658b1258`) |
| Agent | Claude Code (Fable 5.1) |
| Codi modificat | **Cap.** Només s'ha creat aquest fitxer. |
| Eines de cerca web | Cap. |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Resum executiu

S'han llegit sencers els sis fitxers/àrees demanats més els seus col·laboradors directes (`XatContext.jsx`, `retall.js`, `RequireAuth.jsx`, `NotesSection.jsx`, `run-portes.mjs`, `tractor-innerhtml.mjs`, `tractor-tokens.mjs`, `tractor-rutes.mjs`, `tractor-inline-styles.mjs`, `tractor-sollutia.mjs`). Balanç:

| Àrea | P0 | P1 | P2 | Nota general |
| --- | --- | --- | --- | --- |
| RouterContext.jsx | 0 | 2 | 5 | Sòlid en StrictMode; dos defectes lògics reals, la resta són vores. |
| identitat.js | 0 | 3 | 3 | El cisma està tancat, però `desaSessio` i `actualitzaUsuariSessio` reobrin la porta per una escletxa. |
| sanitize.js | 0 | 1 | 3 | Cap XSS trobat. Un comentari menteix i hi ha codi mort. |
| XatSection.jsx | 0 | 3 | 4 | Cap XSS (tot es pinta com a text). Molta interfície decorativa que no fa res. |
| PedraSeca/ | 0 | 1 | 2 | La façana existeix però ningú la fa complir; el Xat en té una còpia privada. |
| tooling/gates/ | 0 | 4 | 3 | Quatre portes amb falsos verds estructurals (no `exit 0` inert, sinó regex que no veu el cas). |

**No s'ha trobat cap XSS explotable** a Xat ni a Sanitize. Les troballes de seguretat són de fuita de privacitat (fars d'imatge) i de coherència de sessió, no d'execució de codi.

---

## 1 · `src/app/contexts/RouterContext.jsx`

### 1.1 · P1 — `useSearchParams().setParams` amb objecte esborra tots els altres paràmetres

**Cita:** `src/app/contexts/RouterContext.jsx:105-118`

```
const currentUrl = new URL(currentPath, 'http://localhost');   // línia 106: SENSE search
...
Object.entries(newParams).forEach(([key, value]) => { ... currentUrl.searchParams.set(key, value) })
navigate(currentUrl.pathname + currentUrl.search, options);
```

`currentPath` és només el pathname (línia 26/34), així que `currentUrl.searchParams` naix buit. Amb la forma objecte (`setParams({ pag: 2 })`) el resultat és una URL que **només** té `pag`, no una fusió. Hui no explota perquè tots els cridadors passen un `URLSearchParams` construït a partir de `params` (`src/sections/notes/NotesSection.jsx:71-77`, `:83-85`; `src/sections/disseny/DesignSection.jsx:57`). És deute latent: el primer que use l'API tal com el nom promet perdrà `?nota=` sense avís.

**Solució teòrica:** construir la URL de partida amb `searchParams` del context: `const currentUrl = new URL(currentPath + '?' + searchParams.toString(), 'http://localhost')`. Afegir un test que fixe una URL amb dos paràmetres, cride `setParams({ b: 2 })` i comprove que `a` sobreviu.

### 1.2 · P1 — Els paràmetres de ruta arriben codificats (percent-encoding) i ningú els descodifica

**Cita:** `src/app/contexts/RouterContext.jsx:229-235` i `:347-349`

```
const matchResult = currentPath.match(regex);
keys.forEach((k, i) => { currentParams[k] = matchResult[i + 1] || ''; });
```

`currentPath` ve de `window.location.pathname` (línia 19), que el navegador ja serveix codificat. El Xat navega amb `encodeURIComponent(membre.fil_id)` (`src/sections/xat/XatSection.jsx:112,120,129`) i després compara `String(c.id) === threadId` (`:67`). Amb uuids és invisible; amb qualsevol id que porte espai, `/`, accent o `#` (per exemple `mock-fil-` amb títol, o slugs de `/e/:slug/*` esmentats a `XatContext.jsx:9-12`) el `find` falla i la vista cau a `<NotFoundPage/>` (`XatSection.jsx:90-92`). React Router descodifica els params; aquest router no, i cap consumidor ho compensa.

**Solució teòrica:** a `Routes` i a `matchPath`, `currentParams[k] = safeDecode(matchResult[i+1])` amb un `try { decodeURIComponent } catch { return brut }`. Test: ruta `/xat/:threadId` amb `navigate('/xat/' + encodeURIComponent('a b'))` ha de donar `threadId === 'a b'`.

### 1.3 · P2 — El comentari de `handlePopState` promet una prevenció que no existeix

**Cita:** `src/app/contexts/RouterContext.jsx:30-36`

«Prevenció: ignora popstates espuris si no ha canviat la ruta» — però el cos crida `setCurrentPath` i `setSearchParams(new URLSearchParams(...))` incondicionalment. `URLSearchParams` és un objecte nou cada volta, per tant **cada** popstate (inclosos canvis de `#hash`, que també disparen popstate) repinta tot el que consumix `searchParams`, encara que la cadena siga idèntica. Pedra Seca: un comentari que descriu un comportament que no hi ha és pitjor que cap comentari.

**Solució teòrica:** o bé comparar `newSearch === searchParams.toString()` abans de fer `set`, o bé esborrar el comentari.

### 1.4 · P2 — `navigate(to)` amb `to` no-string peta

**Cita:** `src/app/contexts/RouterContext.jsx:52-55` (`to.startsWith('/')`) i `:300`.

Qualsevol crida amb objecte (`{ pathname, search }`, forma habitual de React Router que la resta de l'API imita) llança `TypeError`. Fail-loud és acceptable, però hauria de ser explícit: `if (typeof to !== 'string') throw new Error('navigate: cal una cadena')`.

### 1.5 · P2 — `Link` ignora `e.defaultPrevented` i salta l'`onClick` del consumidor en enllaços externs

**Cita:** `src/app/contexts/RouterContext.jsx:133-144`

Si l'`onClick` del consumidor crida `e.preventDefault()` per cancel·lar (formulari brut, confirmació), `navigate(to)` s'executa igualment (línia 142). I per a `http(s)://` o `mailto:` es fa `return` abans de cridar `onClick` (línia 136-138), per tant un `onClick` d'analítica o de tancament de menú no s'executa mai en enllaços externs.

**Solució teòrica:** cridar `onClick` sempre en primer lloc; després `if (e.defaultPrevented) return;` i només aleshores decidir entre extern i intern.

### 1.6 · P2 — `useLocation().state` i `MemoryRouter` no són coherents

**Cita:** `src/app/contexts/RouterContext.jsx:97-100` i `:277-336`

`useLocation` llig `window.history.state` directament. Dins de `MemoryRouter` (usat en tests) `state` sempre serà el del navegador real, no el de la memòria, i no és reactiu (canviar `state` amb `replace` no repinta). Solució: guardar `state` a la pila d'història del `MemoryRouter` i exposar-lo al context.

### 1.7 · P2 — `matchPath` inverteix el valor per defecte d'`exact` segons el tipus d'argument

**Cita:** `src/app/contexts/RouterContext.jsx:337-342`

Cadena → `exact:false` (prefix). Objecte sense `exact` → `pattern.exact !== false` → `true` (exacte). Dues semàntiques per a la mateixa funció segons com la crides. Documentar-ho o unificar (`exact` per defecte `true` en tots dos casos).

### 1.8 · Vist i correcte (per constar)

- StrictMode: `App.jsx:470` embolica l'arbre. El `RouterProvider` no té efectes amb escriptura doble perillosa; `Navigate` usa `replace` per defecte (`:174`), així que la doble invocació d'efectes en dev no duplica entrades d'història.
- `Routes` memoritza per `[children, currentPath, parentPrefix]` (`:252`); `children` canvia d'identitat en cada render del pare, així que la memo és quasi sempre freda, però no és incorrecte.
- `pathToRegex` escapa abans de restaurar `:param` i `*` (`:184-197`): no s'ha trobat injecció de regex.
- `resolvePath` + prefix `'/'` del `/*` arrel (`:237-241`) encaixa bé amb les rutes relatives de `ActorRoutes` (`App.jsx:593-619`).

---

## 2 · `src/data/identitat.js`

### 2.1 · P1 — `desaSessio` accepta una sessió sense `user` i reobri la «sessió fantasma, versió 3»

**Cita:** `src/data/identitat.js:132-138` contra `:127-128`

```
export function desaSessio(sessio) {
  if (!sessio?.access_token) return false;      // només comprova el jwt
  setEfimer(CLAU_JWT, ...); setEfimer(CLAU_REFRESC, ...); setEfimer(CLAU_USUARI, sessio.user);
```

El docstring diu «les tres peces o cap», però només se'n valida una. Si `sessio.user` és `undefined` o no té `id`, `usuariDeSessio()` torna `null` (línia 128) mentre el jwt viu a `sessionStorage`. Resultat: `identitat()` diu «convidat» (autoria amb uuid de convidat) però `buildHeaders` (segons la capçalera del propi fitxer, línies 22) enviarà el jwt real. És exactament la classe d'incoherència que el bloc de comentaris 10-50 descriu com a P0, reintroduïda per la porta del darrere.

**Solució teòrica:** `if (!sessio?.access_token || !sessio?.user?.id) return false;` i, opcionalment, comprovar que `sessio.user.id === sub` del jwt (ja es fa a `adoptaSessioExterna:302`, però no a la ruta interna).

### 2.2 · P1 — `actualitzaUsuariSessio` permet sobreescriure `id` i escriu `avatar_url` sense passar per `esFontImatgeSegura`

**Cita:** `src/data/identitat.js:141-158`

```
const actualitzat = { ...usuari, ...novesDades, user_metadata: {...}, ...(avatar_url) }
```

L'`spread` de `novesDades` a nivell arrel (línia 147) deixa canviar `id`, `email`, `aud`, el que siga. No hi ha llista blanca com sí que n'hi ha a `adoptaSessioExterna:294-300`. I `avatar_url` es guarda i s'emet per `sdp:auth-change` sense la comprovació d'origen que `sanitize.js:107-122` ja ofereix. Qualsevol cridador (formulari de perfil) pot injectar una `avatar_url` a un origen extern que es pintarà després com a `<img>` cru (vegeu 4.2).

**Solució teòrica:** llista blanca explícita (`full_name`, `avatar_url`, `town_name`, `user_metadata`) i `if (novesDades.avatar_url && !esFontImatgeSegura(novesDades.avatar_url)) delete novesDades.avatar_url`.

### 2.3 · P1 — L'id de convidat no és estable quan `crypto.randomUUID` no existeix

**Cita:** `src/data/identitat.js:72-79`

```
if (!id || !RE_UUID.test(String(id).replace('guest-', ''))) {
  const pseudoRandom = () => 'guest-' + Math.random()...;
  id = crypto?.randomUUID?.() || pseudoRandom();
  setVal(CLAU_CONVIDAT, id);
```

`pseudoRandom()` genera `guest-xxxxxxxxx-yyyyyy`, que **no** passa `RE_UUID` després de llevar-li `guest-`. A la lectura següent la condició torna a ser certa i es regenera. `crypto.randomUUID` només existeix en contextos segurs (https/localhost): a un WordPress d'amfitrió servit per http, o dins d'un iframe sense `secure context`, el convidat canvia d'identitat a cada càrrega i el seu contingut queda orfe.

**Solució teòrica:** generar sempre un uuid v4 vàlid amb `crypto.getRandomValues` (disponible també en http) i, si ni això hi ha, un uuid derivat de `Math.random` amb format correcte. Mai un prefix `guest-` nou.

### 2.4 · P2 — Decodificació del JWT duplicada

**Cita:** `src/data/identitat.js:213-217` i `:269-273` — mateix bloc de sis línies copiat. Extraure `carregaJwt(jwt)` i que `caducitatJwt` la use. Pedra Seca: una funció, un lloc.

### 2.5 · P2 — `purgaLlegat` s'executa en cada lectura d'identitat

**Cita:** `src/data/identitat.js:95-110` cridada a `:120`. Cada `identitat()` (i per tant cada `getDefaultUserId()`, cridat en cada petició) llig `document.cookie` amb regex i fa un `getVal` de `localStorage`. El comentari ho reconeix. Solució barata: una bandera de mòdul `let purgat = false` per fer-ho una vegada per càrrega de pàgina.

### 2.6 · P2 — `adoptaSessioExterna` propaga camps arbitraris de `user`

**Cita:** `src/data/identitat.js:302-303` — `{ ...user, user_metadata: cleanMetadata }`. Es neteja `user_metadata` però es copien la resta de claus del `user` de l'amfitrió (`app_metadata`, `role`, etc.). **No és escalada de privilegis**: el rol el demana el servidor a `sessionService.js:62-69`, i `RequireAuth.jsx:43-46` en depèn. Però és incoherent netejar un nivell i no l'altre. Solució: construir sempre `{ id, email, user_metadata }` i prou.

---

## 3 · `src/utils/sanitize.js`

### 3.1 · P1 — El comentari del ganxo d'imatges menteix: sí que es permeten fars de tercers

**Cita:** `src/utils/sanitize.js:36` («Cap far de tercers. Només imatges del nostre origen o data: URI») contra `:14-19` (quatre orígens externs precarregats) i `:21-29` (`permetOrigenMitjans` afegeix qualsevol origen en temps d'execució, cridat des de `src/data/supabase/runtime.js:33`).

La política real és «origen propi + data + llista blanca oberta». El ganxo sí que posa `referrerpolicy=no-referrer` (línia 49), que mitiga la fuita de referent, però un `<img src="https://graph.facebook.com/...">` dins d'una nota **sí** que fa una petició a un tercer. El comentari fa que un auditor confie en una garantia que no existeix.

**Solució teòrica:** reescriure el comentari amb la política real; fer `origensMitjans` immutable després de l'arrencada (una funció `segellaOrigens()` cridada des de `host.js`), i registrar a la doctrina quins orígens s'accepten i per què.

### 3.2 · P2 — Codi mort tautològic al ganxo d'enllaços

**Cita:** `src/utils/sanitize.js:55-57`

```
if (node.getAttribute('target') === '_blank') { node.setAttribute('target', '_blank'); }
```

Assigna el valor que ja té. El `rel` de la línia 54 ja fa la faena real. Esborrar.

### 3.3 · P2 — `netejaText` pot tallar un parell de subrogats i no filtra caràcters de direccionalitat

**Cita:** `src/utils/sanitize.js:97-104`

`.slice(0, maxim)` talla per unitats UTF-16: un emoji a la posició 4000 queda com a subrogat solitari. `JSON.stringify` el serialitza com `\udXXX` i PostgREST/`jsonb` el rebutja amb 400 («invalid unicode»). A més no s'eliminen `U+202A-U+202E` ni `U+2066-U+2069` (override bidi), que permeten que un nom de veí es pinte al revés (spoofing visual als fils del Xat, `XatSection.jsx:317,513`).

**Solució teòrica:** `Array.from(str).slice(0, maxim).join('')` per tallar per punts de codi, i afegir `‪-‮⁦-⁩` a la regex de neteja.

### 3.4 · P2 — `ALLOWED_ATTR` inclou `class` sense restricció

**Cita:** `src/utils/sanitize.js:79-83`. Contingut d'usuari pot vestir-se amb qualsevol classe del sistema (`sdp-nomes-lector` per amagar, classes d'overlay o de botó primari). No és XSS, però és suplantació visual dins de notes i pàgines. Si `class` cal per al rich text, restringir-lo amb un ganxo `uponSanitizeAttribute` a un prefix (`rt-*`).

### 3.5 · Vist i correcte

- `ALLOWED_URI_REGEXP` (`:85`) bloqueja `javascript:`, `data:` no imatge i `//protocol-relative`. No s'ha trobat bypass amb els tags permesos.
- `FORBID_TAGS` inclou `svg` i `math` (`:86`): correcte, tanca els vectors clàssics de DOMPurify.
- Els quatre `dangerouslySetInnerHTML` de `src/` passen per `sanitizeHtml` (verificat: `detailRichText.jsx:8`, `PageDetailSection.jsx:60`, `TextSection.jsx:46`, `UniversalEditorShell.jsx:47`).

---

## 4 · `src/sections/xat/XatSection.jsx` (+ `XatContext.jsx`, `retall.js`)

### 4.1 · P1 — Els filtres «No llegit / Grups / IAIES» no filtren res

**Cita:** `src/sections/xat/XatSection.jsx:62` (estat `activeFilter`), `:96-100` (`filteredThreads` només mira `searchTerm`), `:217-221` (cinc botons que canvien l'estat o no fan res).

L'usuari veu una botonera activa (classe `active` canvia) i la llista no es mou. Interfície que menteix. A més el botó «Afegir filtre» (`:221`) no té `onClick`.

**Solució teòrica:** aplicar el filtre a `filteredThreads` (`noLlegits > 0`, `type === 'grup'`, `is_ai`) usant els camps que `mapejaFil` ja proveeix (`XatContext.jsx:104-119`), o eliminar la botonera fins que hi haja dades.

### 4.2 · P1 — Avatar local duplicat que pinta `avatar_url` sense comprovar l'origen

**Cita:** `src/sections/xat/XatSection.jsx:17-26` (component `Avatar` privat) usat a `:314` i `:440` amb `src={th.avatar_url}` / `thread?.avatar_url`.

Tres defectes en un:
1. Duplica `src/components/PedraSeca/atoms/Avatar.jsx` amb una API diferent (`size` vs `mida`; accepta un prop `kind` que no existeix a cap dels dos, `:314,440`). Viola la façana declarada a `PedraSeca/index.js:4`.
2. `<img src={src}>` sense `esFontImatgeSegura` ni `referrerpolicy`: quan `avatar_url` deixe de ser `null` (`XatContext.jsx:112` el fixa a `null` hui, però `actualitzaUsuariSessio` ja accepta qualsevol URL, vegeu 2.2), un veí pot posar un píxel de seguiment que farà una petició amb referent a cada obertura del llistat.
3. `alt="Avatar"` fix: el lector de pantalla no sap de qui és.

**Solució teòrica:** esborrar l'`Avatar` local, importar el de PedraSeca (`nom={th.name}`), i que el de PedraSeca aplique `esFontImatgeSegura` i `referrerPolicy="no-referrer"` una vegada per a tota l'app.

### 4.3 · P1 — En mode «fals» (convidat o `mock-fil-`) la bombolla diu «enviant…» per sempre

**Cita:** `src/sections/xat/XatContext.jsx:370-397` i `src/sections/xat/XatSection.jsx:518`.

L'optimista es crea amb `estatEnviament: 'pendent'` (`:383`); a la branca `!joId || mock-fil-` es retorna sense canviar-lo a `'enviat'` (`:391-397`). La meta de la bombolla mostra ` · enviant…` indefinidament. Un beta-tester creu que el missatge no ha eixit.

**Solució teòrica:** a la branca falsa, `{ ...optimista, estatEnviament: 'enviat' }` (o un estat `'local'` amb etiqueta pròpia «només en aquest dispositiu»).

### 4.4 · P2 — Deu botons de menú i un d'adjuntar sense cap acció

**Cita:** `src/sections/xat/XatSection.jsx:452-469` («Info. del contacte», «Cercar», «Silenciar», «Nova telefonada…», «Tancar xat»…) i `:540-542` (adjuntar). Cap `onClick`. Es presenta com a funcional. O `disabled` amb `aria-label` «(no disponible)» com ja es fa amb Vídeo/Trucada (`:446-447`), o fora.

### 4.5 · P2 — `getThreadMessages` torna un array nou a cada crida i dispara l'efecte de scroll en cada render

**Cita:** `src/sections/xat/XatContext.jsx:447-450` (`missatgesPerFil[filId] || []`) i `src/sections/xat/XatSection.jsx:368-372` (`useEffect(..., [messages])`). Quan el fil està buit, `[]` és una identitat nova per render, així que `scrollTop = scrollHeight` s'executa a cada repintat del pare (cada tecla a l'input de cerca). Solució: constant de mòdul `const CAP = Object.freeze([])`.

### 4.6 · P2 — `promesaSub.then` sense `catch`

**Cita:** `src/sections/xat/XatContext.jsx:293-296`. Si `subscribeToXat` rebutja, o resol sense `subscription`, hi ha rebuig no gestionat / `TypeError` a `res.subscription`. Afegir `.catch(() => {})` (el sondeig ja és el camí garantit, línia 23-24 de la capçalera).

### 4.7 · P2 — El text enviat no passa per `netejaText`

**Cita:** `src/sections/xat/XatContext.jsx:367` (`String(text ?? '').trim()`), input sense `maxLength` a `XatSection.jsx:544-552`. Caràcters de control i longitud il·limitada arriben al servidor. Aplicar `netejaText(text, 4000)` al mateix punt.

### 4.8 · Vist i correcte

- Cap `dangerouslySetInnerHTML` al Xat; `msg.text` i noms es pinten com a fills de React (`:513,516,317`): **cap XSS**.
- `retall.js` escapa → construeix → saneja en l'ordre correcte (`:25-27,74-76,89`), i el títol també va escapat (`:66`). Cobert per `XatSection.test.jsx:75`.
- El `return <NotFoundPage/>` (`:90`) va **després** de tots els hooks (`:29-88`): l'ordre de hooks es respecta en StrictMode.
- Les dependències dels efectes (`:72-74`, `:76-88`) són correctes i el segon té guarda `viu`.

---

## 5 · `src/components/PedraSeca/`

### 5.1 · P1 — La façana no es fa complir i el Xat s'ho salta

`PedraSeca/index.js:4` diu «Totes les importacions a la resta de l'app deuen apuntar ací». `XatSection.jsx` no importa res de PedraSeca: usa `<button className="sdp-boto sdp-boto--fantasma">` a mà (`:194-213`, `:437`) en lloc de `Boto` (`atoms/Boto.jsx:13-28`), i un `Avatar` propi (4.2). Cap porta de `tooling/gates/` comprova que `sdp-boto`/`sdp-avatar` només s'escriguen dins de `PedraSeca/`. La regla existeix com a comentari, no com a física.

**Solució teòrica:** una llei nova al `tractor-classes.mjs` o al `design_guard.mjs`: literal `"sdp-boto`, `"sdp-avatar` (i les altres classes que PedraSeca posseeix) prohibit fora de `src/components/PedraSeca/**` i `src/css/**`.

### 5.2 · P2 — Tokens inventats des de JS i mides en píxels com a props

**Cita:** `molecules/Dropdown.jsx:40` (`style={{ '--sdp-desplegable-ample': minWidth }}`): declara un token `--sdp-*` fora de `tokens.css` i **cap fitxer de `src/` el consumeix** (grep: única aparició). Codi mort que a més esquiva T3 (vegeu 6.2). `composicio/index.jsx:34,50`: `minWidth = '300px'`, `width = '250px'` com a valors per defecte en píxels crus injectats a `style`. Contradiu la doctrina de vocabulari tancat. Solució: classes modificadores (`sdp-graella--estreta`) o tokens semàntics d'amplada.

### 5.3 · P2 — `Dropdown` tanca amb `setTimeout(200)` al `blur`

**Cita:** `molecules/Dropdown.jsx:29-33`. Si el component es desmunta abans dels 200 ms, `setIsOpen` sobre un component mort (avís en dev). Guardar l'id i netejar-lo en un `useEffect` de desmuntatge.

### 5.4 · Vist i correcte

`Avatar.jsx` (mides tancades, `title`, `sdp-nomes-lector`) i `Boto.jsx` (`aria-busy`, `disabled || carregant`) són nets i sense inline styles prohibits. `icones.jsx:15,18` porta `style` però amb propietats (`willChange`, `fillRule`) que no són a `FORBIDDEN_PROPERTIES` i tenen justificació SVG.

---

## 6 · `tooling/gates/` — robustesa de les portes

Cap de les portes examinades té un `exit 0` inert (patró de [[portes-que-ixen-verd-sense-comprovar]]). Els falsos verds que hi ha són **regex que no veu el cas**, que és més subtil.

### 6.1 · P1 — `tractor-innerhtml.mjs` només veu una forma sintàctica

**Cita:** `tooling/gates/tractor-innerhtml.mjs:14` — `PATRO = /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*.../`.

Esquiven la porta, tots amb verd:
- `dangerouslySetInnerHTML={html}` (objecte en variable).
- `dangerouslySetInnerHTML={{ __html }}` (shorthand ES6, sense `:`).
- `{...{ dangerouslySetInnerHTML: { __html: raw } }}` (spread de props).
- `el.innerHTML = raw`, `insertAdjacentHTML`, `outerHTML =` (no els busca; `src/host.js:238` ja fa `tag.innerHTML = ...` amb plantilla pròpia, avui innòcua).
- I la comprovació de la línia 30 (`\bsanitizeHtml\s*\(` **en qualsevol lloc** de l'expressió) accepta `sanitizeHtml('') + raw`.

**Solució teòrica:** dues regex més (`dangerouslySetInnerHTML\s*=\s*\{(?!\{)` → infracció directa, qualsevol identificador no és literal; `\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(`) i exigir que l'expressió **comence** per `sanitizeHtml(` i acabe amb el seu parèntesi. Millor: un test de fixture amb els cinc casos anteriors que ha de donar 5 infraccions.

### 6.2 · P1 — `tractor-tokens.mjs` T3 no veu declaracions des de JS i tracta `.sdp-root .fill` com a bloc de tema

**Cita:** `tooling/gates/tractor-tokens.mjs:189` (`/(--sdp-[\w-]+)\s*:/`) i `:110` (`OBRE_TEMA`).

- `'--sdp-desplegable-ample': minWidth` (Dropdown.jsx:40) té una cometa entre el nom i els dos punts: la regex no coincideix. Es pot declarar qualsevol `--sdp-*` des de `style={{}}` amb verd.
- `OBRE_TEMA` accepta **qualsevol línia** que continga `:root`, `:host` o `.sdp-root` i `{`. Un selector `.sdp-root .targeta {` a `tokens.css` compta com a bloc de tema, i els tokens redefinits allí passen T3. La regla T3 diu «un sol lloc de definició»; la porta n'accepta infinits mentre penjen de `.sdp-root`.

**Solució teòrica:** regex `(--sdp-[\w-]+)['"]?\s*:` per a T3, i `OBRE_TEMA` ancorat: `/^\s*(:root|:host|\.sdp-root)(\s*,\s*(:root|:host|\.sdp-root))*\s*\{/` més els `@media`.

### 6.3 · P1 — `tractor-rutes.mjs` R1 exempta el fitxer sencer si importa la SSOT; R3 accepta `exit` sense cap comprovació

**Cita:** `tooling/gates/tractor-rutes.mjs:91-92` i `:124-126`.

- R1: `if (importa) continue;` — un fitxer que importa `project_paths.mjs` per a una cosa pot escriure `'04_escriptori'` a mà quaranta vegades. La llei diu «literal sense importar-lo»; la porta llig «fitxer que no importa res».
- R3: `teCli || teExit` — qualsevol `process.exit(` al text (fins i tot dins d'un comentari, ja que no s'usa `senseComentaris`) satisfà la porta. No comprova que l'script puga **fallar**. Un script `console.log('ok'); process.exit(0)` passa R3.
- R3 llig `package.json` (`:109-116`), no `run-portes.mjs:29-80`, que és la cadena real. Avui tots els `script:` de `passos` existeixen a `package.json` (verificat amb node), però els passos sense `script:` («Linter», «Proves») queden fora del control i ningú avisarà si divergeixen.

**Solució teòrica:** R1 per línia: només exempt si la línia mateixa usa l'export (`ESCRIPTORI_DIR`), no si el fitxer l'importa. R3: exigir `process.exit(1)` **i** `process.exit(0)` (o `exitCode`) i que R3 recórrega `passos` importat de `run-portes.mjs` (ja l'exporta, `:29`).

### 6.4 · P1 — `tractor-inline-styles.mjs` no veu `style={obj}` ni objectes amb `}` dins

**Cita:** `tooling/gates/tractor-inline-styles.mjs:17` (`/style=\{\{([^}]+)\}\}/g`).

- `style={gridStyle}` (`PedraSeca/composicio/index.jsx:40,57`) i `style={layoutStyle}`: no coincideix amb `{{`, passa amb verd. Ja hi ha dos exemples reals dins del propi sistema de disseny.
- `[^}]+` s'atura al primer `}`: `style={{ padding: cond ? x : y, ...{} }}` es trunca. Menor.
- No aplica `senseComentaris`: una línia comentada amb `style={{ padding: 0 }}` fa vermell (fals roig, no fals verd).

**Solució teòrica:** afegir `style=\{(?!\{)[^}]*\}` com a infracció per si mateixa («l'objecte d'estil ha de ser literal per poder-lo auditar»), i usar `senseComentaris` de `../lib/codi.mjs` com fa `tractor-tokens`.

### 6.5 · P2 — `tractor-sollutia.mjs` S1 dóna per definida una variable declarada en qualsevol lloc del repositori

**Cita:** `tooling/gates/tractor-sollutia.mjs:81-84` i `:91`. `definides` es construeix a partir de `TOTS` (src, wordpress-plugin, index.html, public): un token declarat només dins d'un `.jsx` de React compta com a «definit» per a `index.html`, que pinta abans que React existeixi. Justament el cas que S1 diu que vol caçar (línia 13-20). Solució: `definides` només de `.css` carregat per l'amfitrió i de `wordpress-plugin/**`.

### 6.6 · P2 — `run-portes.mjs` no comprova l'existència dels fitxers abans d'arrancar

**Cita:** `tooling/gates/run-portes.mjs:95-107`. Si un fitxer de `passos` no existeix, `node` ix amb codi 1 i la cadena para amb «ha fallat», que és correcte (fail-closed), però el missatge no diu «no existeix». Amb 48 passos i el temps que tarda, un `existsSync` previ sobre tots els `args[0]` estalviaria minuts a cada trencament. Menor.

### 6.7 · P2 — La cadena és lineal: un fals roig previ amaga tots els verds/rojos posteriors

`run-portes.mjs:100-103` fa `exit(1)` al primer fracàs. Amb 21 de 48 portes en roig per deute previ ([[cadena-portes-pre-commit]]), les portes de seguretat reals (`innerhtml` és la 11a, `rls` la 47a) no arriben a executar-se en pre-commit. No és un fals verd, és un **no-executat**. Solució: mode `--totes` que execute tot i resumisca al final, i que el hook de pre-commit use eixe mode per a les portes de seguretat com a mínim.

---

## 7 · Prioritat suggerida per a IAIA MarIA

1. **2.1** (`desaSessio` sense `user`) — una línia, tanca una classe de bug ja patida.
2. **6.1 + 6.4** (regex de les portes innerHTML i inline-styles) — sense això el verd d'aquestes dues portes no significa res.
3. **4.2 + 2.2** (avatar sense comprovar origen, `actualitzaUsuariSessio` sense llista blanca) — junts tanquen la fuita de fars via perfil.
4. **1.2** (params codificats) abans que aparega el primer id no-uuid.
5. **4.1 + 4.4** (interfície decorativa al Xat) — no és seguretat, però és el que un veí veu primer.
6. La resta com a deute documentat.

## Bateria de veritat

- [x] He llegit el codi real localment (tots els fitxers citats, sencers, via `Read`; grep només per confirmar cridadors).
- [x] Totes les cites porten ruta i línies.
- [x] Cap codi modificat ni commitejat: `git status` sobre els fitxers auditats no mostra cap canvi meu (els `M` a `tractor-adaptadors.mjs` i `tractor-enxufe.mjs` són previs a aquesta sessió i no els he tocat).
- [x] Cap eina de cerca web activada.
