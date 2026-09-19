---
type: informe
status: esborrany
description: Auditoria extrema de la frontera Sollutia, SEO, resiliencia i codi mort abans de l'entrega de dilluns
---

# Informe — Auditoria Extrema (Frontera Sollutia)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-1246 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 12:46 |
| Modificació | 26-09-19 13:1x · **correcció de P0-1** arran de la refutació de Codex (`260919_1300`) |
| Agent redactor | Claude Opus 5 (Claude Code) |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260919_1215_PROMPT_seguretat_claude_codex]]
- [[../10_actes/260918_1736_ACTA_MARMOTA_Disseny_Bloc_Notes]]

## Tall d'auditoria

- **HEAD**: `ff312dc9ec09cb8c144648da298c627bac4829d4`
- **Arbre de treball**: 4 fitxers modificats i no comesos dins de `src/`
  (`components/universal/PageFrame.jsx`, `css/layout.css`,
  `sections/disseny/DesignSection.jsx`,
  `sections/disseny/cataleg/detalls/EspecimenPage.jsx`). L'auditoria s'ha fet
  **sobre l'arbre de treball**, que és el que s'entregarà.
- **Verificacions dinàmiques**: servidor Vite viu a `localhost:3340`, navegador
  real. Tota troballa marcada **[VERIFICAT EN VIU]** s'ha reproduït al navegador,
  no deduïda.
- **Proves i lint**: `vitest` → 12 fitxers, 47 proves, **totes passen**.
  `eslint` → **0 errors**, 321 avisos (quasi tots `no-unused-vars` a `tooling/`).

> **Avís de mètode.** Este informe separa **cacera** i **refutació**. La §7 llista
> les acusacions que he tombat jo mateix després de comprovar-les. Si una troballa
> no apareix a la §7, és perquè l'he pogut sostindre amb codi o amb navegador.
>
> **v1.1.0 · Una de les meues va caure.** Codex va refutar el diagnòstic de P0-1
> («impossible per arquitectura») i tenia raó. Ho he reverificat amb un build
> propi i ho he corregit al §2 i al §7. La troballa continua viva, però com a
> bloquejador de **configuració de build**, no d'arquitectura.

---

## 1. Veredicte

**L'enxufe està ben dissenyat i mal alimentat.** L'arquitectura de dues fases
(`configura` → `arrenca`), el port de backend i el contracte són sòlids: les portes
`porta:enxufe` i `porta:frontera` passen netes i no menteixen. El problema no és
l'arquitectura: són **tres fils tallats** que fan que el component, tal com
s'entrega hui, **no puga rebre la sessió de Sollutia, no puga avisar l'usuari de
res, i, si es fica dins d'una pàgina de Sollutia, li reescriga el `<head>` i li
pose `noindex`**.

Els tres són arreglables abans de dilluns. Cap demana refactor.

| # | Bloquejador | Eix | Estat |
| --- | --- | --- | --- |
| P0-1 | El bundle entregat **no du l'emissor**: tota sessió de Sollutia es rebutja | Seguretat / Enxufabilitat | [VERIFICAT EN VIU] · **rebaixat a v1.1.0** |
| P0-2 | **Cap avís (`showToast`) es veu**: es pinta fora del shadow root | Usabilitat | [VERIFICAT EN VIU] |
| P0-3 | Incrustar el component **segresta el `<head>` de l'amfitrió** i li injecta `noindex` | SEO / Enxufabilitat | Confirmat per codi |
| P1-4 | **Tot el lloc és `noindex`**: la portada inclosa | SEO | [VERIFICAT EN VIU] |
| P1-5 | Contingut duplicat: `/mur` i `/jo/mur` serveixen el mateix | SEO | [VERIFICAT EN VIU] |
| P1-6 | El títol i l'OG de la portada són els d'una **altra pàgina** | SEO | [VERIFICAT EN VIU] |
| P2-7 | L'allowlist de `supabase-url` accepta **qualsevol** `*.supabase.co` | Seguretat | Confirmat per codi |

---

## 2. Eix 1 · Seguretat i Enxufabilitat (Frontera Sollutia)

### P0-1 · El bundle entregat no du l'emissor: tota sessió es rebutja `[VERIFICAT EN VIU]`

`src/host.js:365` fa això quan Sollutia envia una sessió sense declarar emissor:

```js
opcions.emissorEsperat = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOLLUTIA_ISSUER);
```

I `src/data/identitat.js:245-247` és fail-closed sense pietat:

```js
if (!emissorEsperat) {
  return false;
}
```

Fins ací, correcte per disseny. El problema és **on acaba `import.meta.env`** en el
build que entreguem. He obert el bundle real:

```text
wordpress-plugin/dist/soc-de-poble.standalone.js
  …customElements.define("soc-de-poble",Kn))}  const U2={};  var vw={};…
  …emissorEsperat||(m.emissorEsperat = typeof{…} != "undefined" && (U2==null ? void 0 : U2.VITE_SOLLUTIA_ISSUER))…
```

**`U2` és `import.meta.env`, i a l'artefacte entregat està compilat com a objecte
buit literal: `{}`.** Comparació amb el build web
(`dist/assets/index-D4yAmHbL.js`), on sí que hi ha un objecte d'entorn real:

```text
emissorEsperat||(v.emissorEsperat=typeof import.meta<"u" && nu?.VITE_SOLLUTIA_ISSUER)
```

> ### ⚠ CORRECCIÓ v1.1.0 — em vaig passar de frenada
>
> A la v1.0.0 vaig escriure que la variable **no hi podia arribar mai, passara el
> que passara al `.env`**. **És fals, i Codex ho va refutar bé**
> (`260919_1300_estudi_codex_seguretat_sollutia.md`). Ho he tornat a comprovar jo
> amb un build a una carpeta temporal:
>
> ```text
> VITE_SOLLUTIA_ISSUER="https://PROVA-ISSUER.example" \
>   npx vite build -c vite.standalone.config.js --outDir /tmp/…/sollutia-test
>
> → …!="undefined" && "https://PROVA-ISSUER.example"),!m.emissorEsperat){…
> ```
>
> Amb la variable definida en temps de build, **Vite n'inlinea el literal** al
> bundle `iife` (ni tan sols passa per l'objecte d'entorn). L'arquitectura **no**
> està trencada.
>
> **El que sí que és cert, i és el que importa per a dilluns:** l'artefacte que
> tenim hui a `wordpress-plugin/dist/` es va compilar **sense** la variable, i per
> això hi ha `const U2={}`. **No és un mur: és una casella buida.** La troballa
> baixa de «impossible per arquitectura» a **«bloquejador de configuració de
> build»** — i això és molt millor notícia, perquè es tanca definint la variable a
> l'entorn de build i recompilant.

**Conseqüència sobre l'artefacte actual** (`wordpress-plugin/dist/soc-de-poble.standalone.js`,
compilat el 26-09-18, que és el que s'entregaria hui):

- `window.SocDePoble.injectaSessio(sessio)` — la crida d'un sol argument que
  documenta la capçalera del mateix `host.js` — **torna `false` sempre**.
- El pont d'iframe (`host.js:356-376`) rebutja la sessió i respon
  `'Sessió rebutjada: emissorEsperat obligatori'`.
- Sense recompilar, l'únic camí viu és que Sollutia passe **explícitament**
  `injectaSessio(sessio, { emissorEsperat: 'https://…' })`, i això **no està
  documentat enlloc** que Sollutia puga llegir.

Agreujant: `.env` local **no defineix ni `VITE_SUPABASE_URL` ni
`VITE_SUPABASE_ANON_KEY` ni `VITE_SOLLUTIA_ISSUER`** (només `VITE_TENANT_ID`).
`.env.example:13` té `VITE_SOLLUTIA_ISSUER=` buit i sense cap comentari que
explique que és una **precondició d'integració**.

**Cal fer abans de dilluns (triar-ne una):**

1. **Mínim viable (15 min).** Definir `VITE_SOLLUTIA_ISSUER` a l'entorn de build
   (`.env.production` o la variable de l'entorn de CI) amb l'`iss` real dels JWT
   de Sollutia, **recompilar `build:wp`** i verificar amb un grep que el literal
   és al bundle. Documentar-ho a `.env.example` com el que és: una **precondició
   d'integració**, no una opció.
2. **Robust (1 h).** Acceptar l'emissor també com a **atribut de l'element**
   (`sollutia-issuer="…"`) passant per `sanejaConfig`, perquè canviar d'emissor no
   òbligue a recompilar i redistribuir el plugin. És la que recomane si l'emissor
   pot canviar entre entorns de Sollutia (proves vs producció).
3. Afegir **una porta** que falle si el bundle standalone surt sense l'emissor. És
   l'única manera que açò no torne a passar en silenci: la casella buida no fa
   soroll fins que Sollutia prova d'entrar.

> **Comprovació d'aud addicional.** `identitat.js:269` rebutja el token si
> `aud` existix i no és `socdepoble.org` ni l'emissor. Els JWT de GoTrue porten
> `aud: "authenticated"`. Si Sollutia emet amb GoTrue, **també cauran per ací**.
> S'ha de confirmar amb un token real abans de dilluns. *(Ja apuntat a
> `260918_0550_informe_auditoria_extrema_sollutia_claude.md`; segueix viu.)*

### P0-3 · Incrustar el component segresta el `<head>` de Sollutia

`src/PedraSecaEmbed.jsx:404-409`:

```js
if (configObject.routerType === undefined) configObject.routerType = 'browser';
if (configObject.manageDocumentHead === undefined && configObject.routerType === 'browser') {
  configObject.manageDocumentHead = true;
}
```

`src/hooks/useSEO.js:16` només s'aparta si algú diu **explícitament** que no:

```js
const shouldManageHead = externalConfig?.manageDocumentHead !== false && !isIframe && !isGloballyEmbedded;
```

**Un `<soc-de-poble>` pelat dins d'una pàgina de Sollutia (no iframe) agafa per
defecte el control del `<head>` de Sollutia.** Sobreescriu `document.title`,
`description`, `og:*`, `twitter:*`, `link[rel=canonical]` i — el pitjor —
`meta[name=robots]`. I com que la ruta interna per defecte és `/jo/xat`
(vegeu P1-4), **li planta `noindex, nofollow` a la pàgina de Sollutia**.

És una decisió d'opt-out on hauria de ser d'opt-in. L'escenari «bloc dins d'un
article» és exactament el que descriu `AGENTS.md §8`.

**Arreglar:** invertir el valor per defecte. `manageDocumentHead` només `true`
quan el component està sol a la pàgina (`#root` existix i l'ha creat `main.jsx`);
`false` en qualsevol altre muntatge. Una línia a `_recalcularConfig`.

### P2-7 · L'allowlist de `supabase-url` no protegix del que diu que protegix

`src/PedraSecaEmbed.jsx:136-141` avisa, amb raó, que qui puga tocar l'HTML de la
pàgina podria apuntar `supabase-url` a un servidor propi i **collir les
credencials quan l'usuari faça login**. `sanejaConfig` (L195-201) diu que ho para:

```js
const isSupabaseCo = uOrigin.endsWith('.supabase.co') && u.protocol === 'https:';
if (!isSupabaseCo && !ORIGENS_PERMESOS.some(...)) delete net[field];
```

**`*.supabase.co` és registre obert.** Qualsevol pot crear
`https://atacant-xyz.supabase.co` en dos minuts. L'allowlist deixa passar el 100%
dels dominis de l'atacant possible. `loginWithPassword` envia correu i contrasenya
a eixe origen. El mateix val per a `botApiUrl` i `oauthRelayUrl`.

**Arreglar:** fixar l'origen exacte del projecte (constant de build o una entrada a
`ORIGENS_PERMESOS`) i llevar el comodí `.supabase.co`. Cinc minuts, risc zero.

### ✅ Tancat des de l'última sessió: `:host { all: initial }`

L'acta `260918_1736` i `.agents/ESTAT.md:61` demanaven llevar
`:host { all: initial }` de `tokens.css:20` perquè, **fora de capa**, guanyava
contra totes les regles amb capa i matava la caixa del component.

**Està resolt, però convé saber com:** no s'ha llevat, s'ha **mogut**. Ara viu a
`src/css/base.css:19-20`, **dins de `@layer reset`** — la capa més dèbil de la
cascada (`index.css:44`) — i les línies 21-29 i 41-49 del mateix fitxer li
restitueixen `display`, `height`, `overflow` i la caixa. Verificat en viu: el host
mesura `911×1306` sobre una finestra de `911×1306`, `scrollHeight === clientHeight`,
cap segona barra de desplaçament. **La caixa aguanta.** Punt 1 del bloc A: fet.

*Efecte lateral positiu, també verificat:* el document amfitrió només té **un**
`<style>` (el d'`index.html`); tot el CSS de l'aplicació viu dins del shadow root
via `adoptedStyleSheets`. **L'aïllament visual cap a Sollutia és real.**

### Troballes menors de frontera (P3)

| Ref | Fitxer | Problema |
| --- | --- | --- |
| S-0 | `index.html:12` + `main.jsx:33` | **La tipografia es carrega dues vegades i una és de Google.** `index.html` fa `preconnect` + `<link>` a `fonts.googleapis.com`, i el component injecta a més `/fonts/noto-sans.css` (local). Verificat en viu: dos fulls de tipografia al document. Sobra una petició i, sobretot, **sobra el tercer implicat**: enllaçar Google Fonts des d'un servei públic europeu és un problema de RGPD documentat (transferència d'IP als EUA sense base legal). Lleva el `<link>` de Google i quedat amb el full local. |
| S-1 | `src/host.js:397` | `window.parent.postMessage({type:'SDP_READY',…}, '*')`. L'escolta valida origen; **l'emissió no**. Filtra `{fase, configurable}` a qualsevol amfitrió. Posa-hi `relayOrigin`/llista, o almenys no emetre res fins a conéixer l'origen. |
| S-2 | `src/host.js:322-325` | L'allowlist d'origens accepta `event.origin.endsWith('.socdepoble.org')` **sense exigir `https:`**. `http://qualsevol.socdepoble.org` entra. Afig `origin.startsWith('https://')`. |
| S-3 | `src/host.js:323-325` vs `vercel.json` | Dues llistes d'origens Sollutia que no quadren: el pont accepta `https://socdepoble.sollutia.com` (exacte) i la CSP `frame-ancestors` accepta `https://*.sollutia.com` (comodí). Una sola font de veritat. |
| S-4 | `vercel.json:9` | `frame-ancestors … http://localhost:*` en **producció**. Lleva-ho del desplegament públic. |
| S-5 | `index.html:8` | `connect-src 'self' https: wss:` permet exfiltrar cap a qualsevol HTTPS. Acota-ho a l'origen de Supabase i al relé. |
| S-6 | `.env.example:24` | `IAIA_CORS_ORIGIN=*` com a exemple. Un exemple insegur es copia. |

---

## 3. Eix 2 · Estabilitat i Resiliència

### P0-2 · Cap avís de l'aplicació es veu `[VERIFICAT EN VIU]`

`src/components/universal/AvisadorEfimer.jsx:45`:

```js
let target = document.querySelector('soc-de-poble') || document.querySelector('.sdp-root') || …;
target.appendChild(sharedContainer);
```

`<soc-de-poble>` porta un shadow root **`{ mode: 'closed' }`**
(`PedraSecaEmbed.jsx:297`) i **no hi ha cap `<slot>` en tot `src/`** (grep net).
Un fill del light DOM d'un host amb shadow root i sense slot **no entra a l'arbre
pla: no es pinta**. A més, el CSS del component viu dins del shadow
(`adoptedStyleSheets`), així que `.sdp-avisador-efimer` tampoc no l'abastaria.

**Prova executada al navegador** (`/jo/xat`, servidor Vite viu):

```js
window.dispatchEvent(new CustomEvent('sdp:submission-rejected', { detail:{ error:'PROVA' } }));
// → el node existix:
//   <div><div role="alert" class="sdp-avisador-efimer sdp-avisador--error">S'ha rebutjat l'acció</div></div>
// → però:
{ toastsTrobats: 1, assignedSlot: "null", w: 0, h: 0, display: "", hostHasSlot: false }
```

`width 0`, `height 0`, `display` buit, `assignedSlot` nul: **el node existix i no
es pinta**. Això vol dir que **hui, en producció, l'usuari no rep cap
confirmació ni cap error**: ni «Nota publicada correctament al mur», ni
«Error publicant al mur», ni el rebuig del xat, ni el «Benvingut de nou» de
l'OAuth. 18 fitxers criden `showToast`. Tots parlen a una paret.

També afecta `AvisadorEfimer` com a component d'un altre lloc: `theme.js:14-17`
busca `sdpElement.shadowRoot`, que amb `mode:'closed'` és **sempre `null`**
(verificat: `shadowRoot === null` al navegador). Eixa branca és codi mort.

**Arreglar:** el sistema d'avisos ha de rebre el **punt de muntatge** des de
`PedraSecaEmbed` (el `_punt` de dins del shadow), no buscar-lo pel document. És
exactament el que ja va decidir el Consell a
`.agents/ESTAT.md:61` i a l'acta `260918_1736`: **la decisió està presa i no
s'ha executat**. Una funció `registraArrelAvisos(node)` cridada a
`connectedCallback` i consumida per `showToast` ho tanca.

### Troballes d'estabilitat menors

| Ref | Fitxer | Problema |
| --- | --- | --- |
| E-1 | `src/host.js:115-123` | `configura()` **torna `false`** quan rebutja, però el JSDoc (L112) promet `{acceptats, desconeguts, pendents}`. Dos tipus de retorn per a la mateixa funció, i és la primera que cridarà Sollutia. |
| E-2 | `src/host.js:118-123` + `backendPort.js:10` | L'eixida d'emergència `configura({force:true})` en DEV **no cau al `return`**, arriba a `setBackendImplementation(backend)` **sense propagar `force`**, i allí llança `'🔒 Backend bloquejat'`. La porta de darrere està tapiada des de dins. |
| E-3 | `src/PedraSecaEmbed.jsx:440` | `isFirstInstance` es calcula en pintar. Si es desmunta la primera instància, la segona passa de `MemoryRouter` a `BrowserRouter` al següent render → React remunta l'arbre sencer i perd l'estat. Escenari real amb dos blocs a la mateixa pàgina de Sollutia. |
| E-4 | `src/sections/notes/NotesContext.jsx:161-173` | El `value` del Provider és un **objecte literal nou a cada render**: tots els consumidors de `useNotes()` es repinten sempre. `useMemo` i s'acaba. |
| E-5 | `src/app/contexts/UIContext.jsx:89-96` | `actionsValue` memoïtza amb `[translator, setGlobalStatus]` però tanca sobre `toggleTheme`, que llig `systemDark`. Quan la preferència és `'system'`, `toggleTheme` treballa amb un `systemDark` **caducat del primer render**. Efecte: amb el sistema en fosc, el primer clic al canvi de tema no fa res. Precondició estreta (la preferència per defecte és `'light'`), però és real. |

---

## 4. Eix 3 · SEO i Accessibilitat

> Esta és la secció pitjor del sistema. Les portes no la veuen perquè
> `tractor-rutes-web` depén d'un manifest que ja no es genera (§6).

### P1-4 · Tota l'aplicació és `noindex`, la portada inclosa `[VERIFICAT EN VIU]`

`src/hooks/useSEO.js:53-55`:

```js
const isPrivate = window.location.pathname.startsWith('/jo') || window.location.pathname.startsWith('/e/');
const finalIndex = isPrivate ? false : index;
setMeta('robots', finalIndex === false ? 'noindex, nofollow' : null);
```

I `src/app/App.jsx:508`:

```jsx
<Route path="/" element={<Navigate to={`/jo${DEFAULT_SECTION_PATH}`} replace />} />
```

`DEFAULT_SECTION_PATH` és `/xat` (`src/config/sections.js:34`). La navegació
principal (`AppShell.buildPath`) construïx **totes** les rutes com a `/jo/…`.

**Mesurat al navegador, càrrega neta de `http://localhost:3340/`:**

```json
{ "href": "…/jo/xat", "robots": "noindex, nofollow", "canonical": "…/jo/xat" }
```

La portada del lloc, que el `sitemap.xml` declara amb `priority 1.0`, **acaba
amb `noindex, nofollow`** un instant després de carregar. I amb ella,
`/jo/mur`, `/jo/mercat`, `/jo/pobles`, `/jo/multimedia`, `/jo/notes`,
`/jo/poblacio`, `/jo/projecte`, `/jo/constitucio`, `/jo/skills`, `/jo/roadmap`,
`/jo/ia`… és a dir, **el lloc sencer tal com el navega una persona**.

Pitjor encara: `/projecte`, `/skills`, `/constitucio`, `/roadmap`, `/disseny`,
`/ia`, `/perfil` (App.jsx:530-546) **redirigixen** cap a `/jo/…`, o siga, cap a
pàgines `noindex`. Són 12 redireccions que porten Google a un carreró tancat.

**Arreglar (decisió de producte, no de codi):** `/jo` és un prefix d'**actor**,
no de privacitat. El contingut de `/jo/mur` és públic. O bé:
- es trau el contingut públic de davall de `/jo` i es deixa `/jo` només per a
  `el-meu-perfil`, `dispositius`, `control`; o bé
- `isPrivate` passa a ser una **llista blanca de seccions privades**
  (`/jo/el-meu-perfil`, `/jo/dispositius`, `/jo/control`) en lloc d'un
  `startsWith('/jo')` cec.

La segona és una línia i es pot fer hui.

### P1-5 · Contingut duplicat sense canònica creuada `[VERIFICAT EN VIU]`

`MurSection`, `MercatSection` i `PoblesSection` estan muntats **dues vegades**:
a l'arrel (App.jsx:515-517) i dins d'`ActorRoutes` (App.jsx:563-566).
`ControlSection` també, a `/control` i `/utilitats` (App.jsx:527-528).

Mesurat al navegador:

| URL | `robots` | `canonical` |
| --- | --- | --- |
| `/mur` | *(cap)* | `…/mur` |
| `/jo/mur` | `noindex, nofollow` | `…/jo/mur` |

Cada URL **s'autocanonitza**. Google veu dos documents idèntics, un indexable i
un altre no, i l'indexable (`/mur`) **no és el que enllaça la navegació**.
`porta:rutes-web` ja crida (W7), però amb un missatge trencat que imprimix el
mateix camí dues voltes (`/mur, /mur`) i ho degrada a avís.

**Arreglar:** canònica explícita `/{secció}` per a les dues, o redirecció 301
d'una cap a l'altra.

### P1-6 · El títol i l'OG de la portada són els d'una altra pàgina `[VERIFICAT EN VIU]`

Càrrega neta de `/jo/xat` (la portada efectiva):

```json
{
  "title": "L'Ànima de la IAIA | Sóc de Poble",
  "description": "El Còdex Forense: Termodinàmica, Humanització i Comunicació",
  "og:title": "L'Ànima de la IAIA | Sóc de Poble"
}
```

Però `XatSection.jsx:36-40` demana `title: t('section.xat.title')` →
**«Converses i comunitat»** (`i18n.js:128`).

**Causa arrelada, localitzada:** `src/sections/xat/XatSection.jsx:340-341`
renderitza una altra pàgina dins del panell de context:

```jsx
{pageCopy?.['anima'] ? (
  <TextSection page={{...pageCopy['anima'], chrome: 'context'}} pageKey="anima" />
```

i `TextSection.jsx:22-26` crida `useSEO()` **incondicionalment**. Com que
`pageCopy` arriba per xarxa, `TextSection` es munta **després** que
`XatSection` haja escrit el seu `<head>`, i l'últim que escriu guanya. El
resultat és determinista, no una cursa: **sempre guanya la IAIA**.

Conseqüències: cada vegada que algú comparteix l'adreça de Sóc de Poble per
WhatsApp, Telegram o Twitter, la targeta diu «L'Ànima de la IAIA — El Còdex
Forense: Termodinàmica, Humanització i Comunicació».

**Arreglar:** `useSEO` necessita un model de propietat. Mínim: un paràmetre
`scope: 'route' | 'fragment'` on només `'route'` escriu al `<head>`, i
`TextSection` el passa a `'fragment'` quan `chrome === 'context'`. Alternativa
més neta: `useSEO` només es crida des dels components de ruta.

### SEO · Altres

| Ref | Problema |
| --- | --- |
| SEO-1 | **No hi ha prerender ni SSR.** Cap `crawler` social (Facebook, WhatsApp, Telegram, Twitter) executa JS: tots veuen **només** l'`index.html` genèric. Tot el treball de `useSEO` és invisible per a les targetes de compartició. `vercel.json` reescriu tot cap a `/index.html`. |
| SEO-2 | `useSEO.js:63` calcula la canònica amb `index === false` (la prop crua), però `robots` amb `finalIndex` (que inclou `isPrivate`). Una pàgina `/jo/*` rep alhora `noindex` **i** una canònica que hi apunta. Senyals contradictoris. |
| SEO-3 | `useSEO` no restaura res en desmuntar. En navegar de `/mur` a una vista sense `useSEO`, el `<head>` es queda amb el de `/mur`. |
| SEO-4 | `isPrivate` fa `startsWith('/jo')` sense barra: una futura ruta `/joguines` seria `noindex` per accident. |
| SEO-5 | `sitemap.xml` (7 URL) no inclou `/xat`, que no existix com a ruta d'arrel; sí inclou `/` que acaba en `noindex`. El generador és `_wiki_de_poble/04_escriptori/generador_sitemap.mjs`, **fora del `build`**: el sitemap es podrirà en silenci. |
| SEO-6 | `wordpress-plugin/dist/seo-routes.json` **no existix**; el seu generador (`build:seo`) es va esborrar. `tractor-rutes-web` (W4/W5) i `tractor-consell` (L8) el reclamen. Vegeu §6. |

### Accessibilitat

El fonament és **millor del que esperava** i no és on està el perill:

- 92 `aria-label` a `src/`, només 2 `onClick` sobre `div`/`span`.
- `:focus-visible` present a 40 regles (`base.css`, `components.css`,
  `modules.css`, `utilities.css`).
- `prefers-reduced-motion` respectat a 7 regles.
- `AppShell` retorna el focus a `main` en canviar de ruta (`App.jsx:65-69`).
- `AvisadorEfimer` porta `role="alert"` i `aria-live="assertive"` correctes…
  **però no es pinta** (P0-2), així que el lector de pantalla tampoc no l'anuncia.

Dues incidències reals:

| Ref | Fitxer | Problema |
| --- | --- | --- |
| A11Y-1 | `src/app/App.jsx:151` | El `lang` s'escriu sobre `<soc-de-poble>` (correcte per a l'incrustació), però **`<html lang="ca">` d'`index.html` no s'actualitza mai** en el mode autònom quan l'usuari canvia d'idioma. Un lector de pantalla continua llegint castellà o anglés amb fonètica catalana. |
| A11Y-2 | `src/components/ErrorBoundary.jsx:17` | La pantalla d'error fa servir `className="alert"`, que no és cap classe del sistema (`sdp-alerta`). La pantalla de fallida és **sense estil**: text pla damunt del fons. És l'última cosa que veu l'usuari quan tot peta. |

---

## 5. Eix 5 · Codi mort i funcions inertes

Confirmats, tots verificats a mà:

| Ref | Fitxer | Què |
| --- | --- | --- |
| M-1 | `src/sections/notes/NotesContext.jsx:171` | `obriConfiguracioNotes: () => console.log('no implementat')`. **No és mort: és un fantasma amb botó.** `NotesSection.jsx:108` el lliga a `onManageCategories`. Hi ha un control visible a la interfície de Notes que no fa res i no diu que no fa res. |
| M-2 | `src/config/theme.js:14-17` | `document.querySelector('soc-de-poble').shadowRoot` amb `mode:'closed'` és **sempre `null`** (verificat al navegador). La «font de veritat: atribut HTML» que promet el comentari no s'aconseguix mai; sempre cau al `localStorage`. |
| M-3 | `src/data/backendPort.js:38-42` | `destroy()` crida `currentImpl.destroy()`, però `'destroy'` **no és a `CONTRACTE_BACKEND`** (`contracte.js`), i `setBackendImplementation` només copia claus del contracte. `currentImpl.destroy` no existirà mai. La funció és un no-op garantit. |
| M-4 | `src/host.js:118-123` | La branca `force && isDev` de `configura()`: vegeu E-2. Codi que sembla una eixida d'emergència i és una excepció. |
| M-5 | `src/PedraSecaEmbed.jsx:632-641` | El comentari diu «ens callem l'error», però la branca no fa `event.preventDefault()`: només `console.warn`. El silenciador no silencia (excepte per a `QuotaExceededError`). |
| M-6 | `vite.standalone.config.js:41` | Comentari que cita `build:seo`, un script que **ja no existix** al `package.json`. Documentació morta que apunta a una porta morta. |

---

## 6. Estat de les portes (el que el pre-commit veu i el que no)

Executades en este tall:

| Porta | Resultat |
| --- | --- |
| `porta:frontera` | ✅ passa (S1, S3, S4 nets) |
| `porta:enxufe` | ✅ passa (E1–E4 nets) |
| `porta:innerhtml` | ✅ passa |
| `porta:rutes-web` | ⚠️ 6 avisos (W4/W5 sense manifest, W7 duplicats) |
| `porta:persistencia` | ❌ 3 infraccions (L2) |
| `porta:rls` | ❌ 2 infraccions — **les dues són falsos positius** (§7) |

**El problema de tooling més greu no és cap porta roja: és una porta cega.**

1. **`porta:rls` crida el llop.** Les seues dues infraccions són falses (§7). Una
   porta de seguretat que falla per motius falsos la vespra d'una entrega
   s'ensenya a ignorar-la. **Cal arreglar el tractor perquè avalue l'estat final
   de la cadena de migracions, no cada fitxer per separat.**
2. **`porta:rutes-web` no pot fer la seua faena.** W4/W5 no s'avaluen perquè
   falta `wordpress-plugin/dist/seo-routes.json`, el generador del qual es va
   esborrar. Per això cap porta ha vist el `noindex` global (P1-4) ni els
   duplicats (P1-5) com a **error**.
3. **Les regles de `react-hooks` no estan actives.** `eslint.config.js:11`
   registra el plugin `react-hooks` però **no n'habilita cap regla**: ni
   `rules-of-hooks` ni `exhaustive-deps`. Per això E-5 (closure caducada a
   `UIContext`) passa invisible. Habilitar-les és una línia i donaria cobertura a
   tota una família de defectes.
4. `porta:persistencia` L2 (3 infraccions) està **tota** a
   `src/sections/disseny/cataleg/detailRegistry.jsx`, el catàleg de disseny. És
   deute acotat i sense risc per a l'entrega, però el fitxer accedix a
   `localStorage` directament (L6, L10, L14).
5. **`porta:scc` declara 98 orfes per un sol enllaç que no resol.** Entre ells,
   `04_escriptori/00_index_escriptori.md` **mateix** — tot i que `00_INDEX.md:12`
   l'enllaça com a `[[00_index_escriptori]]`. Com que l'índex de l'escriptori és
   orfe, tot el que penja d'ell també ho és, este informe inclòs, per molt ben
   ancorat que estiga. El candidat més probable és `00_INDEX.md:144`, que
   resol l'àlies cap a `05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md`,
   **una ruta que ja no existix** (i amb una altra caixa de lletres). Arreglar
   eixa línia hauria de tombar la major part dels 98. Mentrestant, la porta no
   distingix un satèl·lit de veres d'un document correctament ancorat.

---

## 7. Refutacions — acusacions tombades

Per honestedat, i perquè el Consell no arrossegue soroll. **La primera fila és
meua i me la va tombar Codex.**

| Acusació plausible | Veredicte | Per què |
| --- | --- | --- |
| **(MEUA, v1.0.0) `VITE_SOLLUTIA_ISSUER` no pot arribar mai al bundle standalone** | ❌ **REFUTADA PER CODEX, i confirme la refutació** | `260919_1300_estudi_codex_seguretat_sollutia.md` ho va provar amb un `.env.production` sintètic. Ho he reverificat jo amb `VITE_SOLLUTIA_ISSUER=… npx vite build -c vite.standalone.config.js --outDir /tmp/…`: el literal apareix **inlinejat** al bundle. Jo vaig llegir `const U2={}` a l'artefacte entregat i en vaig inferir una impossibilitat arquitectònica; era només **un build fet sense la variable**. El defecte persistix (vegeu P0-1 corregit), però és de configuració, no d'arquitectura. |
| **`porta:rls` R2: `ajustos` sense RLS** | ❌ **FALS POSITIU** | `260908_0000_initial_schema.sql:17-21` crea `private.ajustos` al schema **`private`**, amb `revoke all … from public, anon, authenticated`. PostgREST no exposa `private`. No li cal RLS. El tractor no distingix el schema. |
| **`porta:rls` R3: `profiles read own` amb `using (true)`** | ❌ **FALS POSITIU** | Cert a `260911_0600` (L27-28), però la cadena de migracions el corregix **tres vegades** després: `260912_1500:16-17`, `260915_0000:102-103` i, com a estat final, `260916_0600:76-79` → `for select to authenticated using ((select auth.uid()) = id)`. A més `260914_0100:55` fa `revoke all on public.profiles from anon`. El tractor llig fitxers, no l'estat final. |
| **`RequireAuth` construïx `??tornar=` (doble interrogant)** | ❌ **REFUTAT** | `RouterContext.jsx:99` torna `search: searchParams.toString()`, **sense** el `?` inicial (a diferència de React Router). `RequireAuth.jsx:39` és correcte. *(Nota: eixa divergència amb React Router és una trampa per al pròxim que toque el router; val la pena documentar-la.)* |
| **`esFontImatgeSegura` permet `data:image/svg+xml` → XSS** | ⚠️ **DEGRADAT a nit de seguretat** | `sanitize.js:110` accepta qualsevol `data:image/*`, incloent SVG, mentre que `ALLOWED_URI_REGEXP` (L85) l'exclou expressament. Però el valor s'usa a `heroImage`/`logoImage`, que es pinten com a `<img src>` (`UniversalEditorShell.jsx:284`), i un SVG dins d'un `<img>` **no executa scripts**. No és explotable. És una **incoherència** entre dos controls que hauria de tancar-se abans que algú moga eixe valor a un `<object>` o a `background-image`. |
| **Doble `JSON.stringify` als esborranys de Notes** | ❌ **REFUTAT** | `NotesContext.jsx:76` passa una cadena a `setEfimer`, i `storage.js:70` detecta `typeof value === 'string'` i no torna a serialitzar. El cicle escriptura/lectura quadra. Fràgil, però correcte. |
| **`_desmuntaAra` posa `_config = null` i el listener del tema peta** | ❌ **REFUTAT** | `_paraDEscoltarTema()` es crida en el mateix tirat síncron (`PedraSecaEmbed.jsx:602`), i tots els camins de tornada usen `?.`. No hi ha finestra. |
| **El JSON-LD inline d'`index.html` viola `script-src 'self'`** | ❌ **REFUTAT** | La CSP no aplica a blocs de dades (`type="application/ld+json"`): no són script executable. |
| **`origin.endsWith('.socdepoble.org')` es pot burlar amb `evilsocdepoble.org`** | ❌ **REFUTAT** | La cadena no acaba en `.socdepoble.org` (falta el punt). L'`event.origin` no porta ni camí ni fragment. El sufix aguanta. *(El que sí que falla és el protocol: vegeu S-2.)* |
| **`:host { all: initial }` encara mata la caixa del component** | ❌ **REFUTAT** | Va canviar de fitxer, no de vida: ara és a `base.css:19-20`, però **dins de `@layer reset`**, i les regles següents li restitueixen la caixa. Mesurat en viu: host `911×1306` sobre finestra `911×1306`, sense doble barra. |
| **`base.css:10` (`html, body { overflow:hidden }`) no aplica al document amfitrió → doble barra de desplaçament** | ❌ **REFUTAT** | És cert que el CSS només viu dins del shadow (`index.css` s'importa amb `?inline`), però `index.html` ja fixa `html, body, #root { height:100% }` i el resultat mesurat és `scrollHeight === clientHeight`. No hi ha doble barra. |

---

## 8. Ordre d'atac recomanat per a l'entrega de dilluns

**Bloc A — no negociable (≈ 3 h)**

1. **P0-1** · Donar camí viu a `emissorEsperat`. Atribut de l'element o acord
   escrit amb Sollutia. **I provar-ho amb un JWT real seu**, incloent-hi el
   xoc del camp `aud`.
2. **P0-2** · Passar el punt de muntatge dels avisos des de `PedraSecaEmbed`.
   *(Decisió ja presa a l'acta 260918; només falta executar-la.)*
3. **P0-3** · Invertir el valor per defecte de `manageDocumentHead`.

**Bloc B — abans d'anunciar el lloc (≈ 2 h)**

4. **P1-4** · Llista blanca de seccions privades en lloc de `startsWith('/jo')`.
5. **P1-6** · `scope` a `useSEO` perquè `TextSection` en mode context no escriga.
6. **P1-5** · Canòniques creuades per a `/mur` ↔ `/jo/mur` i companyia.
7. **P2-7** · Llevar el comodí `*.supabase.co`.
8. **S-0** · Llevar el `<link>` a Google Fonts d'`index.html` (RGPD + petició duplicada).

**Bloc C — tooling, perquè açò no torne a passar (≈ 1 h)**

9. Habilitar `react-hooks/rules-of-hooks` i `react-hooks/exhaustive-deps`.
10. Arreglar `porta:rls` perquè avalue l'estat final de la cadena de migracions.
11. Recuperar el generador de `seo-routes.json` i tornar a armar W4/W5, o
    llevar la dependència de les portes que el reclamen. Una porta que no pot
    avaluar-se és pitjor que no tindre-la.
12. Moure `generador_sitemap.mjs` de l'escriptori al `build`.

**No tocar abans de dilluns:** `porta:persistencia` L2 (catàleg de disseny),
E-3, E-4, E-5, M-3 a M-6. Són deute real i acotat, i no afecten l'entrega.

---

## 9. Incògnites que només Sollutia pot tancar

1. **Quin `iss` porten els seus JWT?** Sense això, P0-1 no es pot tancar de veres.
2. **Quin `aud`?** Si és `authenticated` (GoTrue per defecte), `identitat.js:269`
   el rebutja i cal ampliar la condició.
3. **Iframe o component al DOM?** Canvia completament el comportament de
   `useSEO` (P0-3) i del pont `postMessage`.
4. **Qui pot editar l'HTML on viu `<soc-de-poble>`?** Si un editor de continguts
   pot posar atributs, P2-7 puja a P0.
5. **El codi de l'amfitrió (`blank.php`, el marcatge del bloc) no és en este
   repositori.** `wordpress-plugin/` només conté `dist/`. La meitat de la
   frontera no està sota control de versions ni sota cap porta.
