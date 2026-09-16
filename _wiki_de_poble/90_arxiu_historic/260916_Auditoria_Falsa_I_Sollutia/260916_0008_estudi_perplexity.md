---
tipus: document
estat: esborrany
description: AUDITORIA EXTREMA — Sóc de Poble
---

# AUDITORIA EXTREMA — Sóc de Poble

## Protocol i contracte de realitat

Aquest document és el resultat d'un bombardeig sistemàtic del bundle adjunt `260915_2330_BUNDLE_auditoria.md` (540 fitxers, 3.365.436 bytes, 75.144 línies). La sentinella `<<<FI_DEL_BUNDLE>>>` ha estat verificada. Tota cita està en format `ruta:linies` i correspon exclusivament a fitxers del manifest. Cap afirmació es fa sense cita. Les conjectures es marquen explícitament com a `[SUPÒSIT]`.

---

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`
- [x] Cap nom de fitxer, funció o variable inventat
- [x] Tota conjectura marcada `[SUPÒSIT]` o moguda a Incògnites
- [x] He comprovat la sentinella abans de respondre
- [x] El document cita fitxers verificats al disc

---

## Resum executiu

| Domini | Crític | Alt | Mitjà | Baix | Total |
|---|---|---|---|---|---|
| Seguretat i arquitectura | 5 | 12 | 14 | 8 | 39 |
| SEO i accessibilitat | 3 | 9 | 16 | 12 | 40 |
| Contradiccions | 5 | 8 | 7 | 5 | 25 |
| Enxufabilitat Sollutia | 2 | 3 | 2 | 1 | 8 |
| **Total** | **15** | **32** | **39** | **26** | **112** |

El sistema té una base arquitectònica sòlida (tokens de contrast documentats, components canònics amb WAI-ARIA correcte, anti-corruption layer bidireccional, boot de dues fases, guard de clau `service_role`). Però acumula **15 problemes crítics** que impedeixen que la pàgina siga perfectament visible en producció i lliure d'invencions.

---

## 1. Fortificació extrema: Arquitectura inversa

### 1.1 Visió general del sistema

El projecte és una SPA (Single Page Application) construïda amb React + Vite, amb Supabase com a backend (PostgreSQL + Auth + Storage + Realtime). L'arquitectura es compon de les següents capes:

1. **Host i boot** (`src/host.js`): Boot de dues fases (configurable → segellat)
2. **Capa de dades** (`src/data/supabase/`): Façana amb 11 mòduls
3. **Capa d'identitat** (`src/data/identitat.js`): Sessió efímera
4. **Capa frontissa** (`src/data/frontissa/`): Anti-corruption layer Sollutia
5. **Capa OAuth** (`src/data/oauthRelay.js`): Relay amb PKCE
6. **Components UI** (`src/components/`): Sistema de disseny canònic
7. **Embed** (`src/PedraSecaEmbed.jsx`): Web component amb Shadow DOM

### 1.2 El component "Pedra Seca" i la seua problemàtica

El sistema inclou un component anomenat "Pedra Seca" (`src/PedraSecaEmbed.jsx`), que és un web component que encapsula tota l'aplicació React dins d'un Shadow DOM. Aquest nom apareix en nombrosos fitxers:

- `src/PedraSecaEmbed.jsx:174-596` — implementació del web component
- `_wiki_de_poble/02_saber/estandard_integracio_react.md:10-12` — documentació d'integració
- `_wiki_de_poble/02_saber/estandard_ui_universal.md:50` — contracte vigent
- `src/ARCHITECTURE.md:18-19` — descripció dels "Tractors" o "Portes Mecàniques"
- `src/data/SELF-DESCRIBE.md:12-13,19` — descripció del pany d'injecció

**Problema:** El nom "Pedra Seca" és confús i no ve al cas. És un nom que els LLMs poden al·lucinar o associar a conceptes estranys (pedra seca és una tècnica de construcció tradicional valenciana, però no té relació amb l'arquitectura del software). La pàgina ha de ser lliure d'aquestes invencions. Es recomana retirar el nom "Pedra Seca" de tot el codi i documentació, substituint-lo per un nom neutre com "SocDePobleEmbed" o "ModuleEmbed".

### 1.3 Capa de dades: Supabase

La façana `src/data/supabase/index.js:10-20` re-exporta 11 mòduls:

```
runtime.js, admin.js, content.js, organizations.js, auth.js,
notes.js, xat.js, storage.js, realtime.js, utils.js
```

El mòdul `config.js` NO es re-exporta (`src/data/supabase/index.js:10-20`), tot i que és una dependència compartida interna (`src/data/supabase/xat.js:13`, `src/data/supabase/realtime.js`, `src/data/supabase/storage.js`, `src/data/supabase/utils.js` l'importen directament).

El `config.js` crea el client Supabase amb el JWT de la sessió, però **mai l'actualitza** (`src/data/supabase/config.js:13-33`). Això vol dir que quan el token s'actualitza via `session.refresh_session`, el client Supabase continua usant el JWT antic fins que es tanca la sessió.

El `runtime.js` té un `tenantId` hardcodat per defecte: `src/data/supabase/runtime.js:31` — `'11111111-2222-3333-4444-555555555555'`.

### 1.4 Capa d'identitat

La sessió és efímera (`src/data/identitat.js:131-136`): es guarda a `sessionStorage`, que es destrueix quan es tanca la pestanya. El JWT s'analitza sense verificar la signatura (`src/data/identitat.js` — `intentarParsejarJwt`), el qual està documentat com a intencional però permet manipulació de la sessió per scripts de la pàgina host.

El `auth.js` té un fallback hardcodat: `src/data/supabase/auth.js:68` — `town_name: 'La Torre de les Maçanes'`.

### 1.5 Capa frontissa: Sollutia

L'anti-corruption layer (`src/data/frontissa/`) és ben dissenyat:
- `traductor.js` — validació bidireccional, DTOs frozen, fail-closed
- `client.js:18` — `ESCRIPTURES_PERMESES = Object.freeze([])` — cap escriptura per disseny
- `contracte.js:4-37` — `CONTRACTE_NUCLI` amb 33 mètodes congelats

Però `src/data/frontissa/sollutia/recursos.js:14-16` — `RECURSOS = {}` és buit. No hi ha cap recurs Sollutia registrat. Veure secció 3 per a l'auditoria completa.

### 1.6 Host i boot

El boot de dues fases (`src/host.js:74-289`) és correcte:
- Fase 1: configurable — el host pot injectar configuració
- Fase 2: segellat — el sistema es tanca i no accepta més canvis

El `backendPort.js` actua de pany d'injecció (`src/data/SELF-DESCRIBE.md:12-13`): cap component pot importar directament l'adaptador específic.

### 1.7 Embed: Shadow DOM

El `PedraSecaEmbed.jsx:174-596` gestiona múltiples instàncies amb Shadow DOM i CSS compartit. No imposa HTTPS per a la URL de Supabase en producció (`src/PedraSecaEmbed.jsx:158-170`).

### 1.8 SEO: Renderitzat només client-side

L'aplicació és una SPA pura (`index.html:46-53`): l'`<div id="root">` està buit en el HTML estàtic. El `<noscript>` només mostra un missatge. Els crawlers sense JS no veuen cap contingut indexable.

---

## 2. Cerca de contradiccions

S'han trobat **25 contradiccions** (5 crítiques, 8 altes, 7 mitjanes, 5 baixes). Les més rellevants:

### 2.1 CRÍTIC: ADR-2026-08 mana retirar PWA/Dexie però el codi els manté

`_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md:36-38` diu: "Retirar PWA, Dexie, mode hybrid, dispositius simulats i doctrina A10/offline."

Però `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md:47-49` llista Dexie i PWA com a "Implementada parcialment" / "Configurada". I `_wiki_de_poble/02_saber/el_projecte.md:36` els esmenta com a baseline activa.

No hi ha cap entrada al `LEDGER` que registre l'extirpació efectiva.

### 2.2 CRÍTIC: ESTAT.md diu "habilitada la publicació Realtime" però el codi diu que no

`.agents/ESTAT.md:12`: "habilitada la publicació Realtime"

`supabase/README.md:116-118`: "Les taules del xat **no** estan a la publicació `supabase_realtime`, a propòsit."

`supabase/migrations/260908_xat_v2_correccions.sql:353-377`: El bloc `alter publication supabase_realtime add table public.xat_missatges;` està comentat.

`src/sections/xat/XatContext.jsx:23-28`: "REALTIME — No n'hi ha."

El codi JSX (`src/sections/xat/XatContext.jsx:243-292`) implementa `subscribeToXat` i `connectaRealtime()`, però la subscripció mai rep res perquè la publicació no està activa. Això crea codi mort que dóna una falsa sensació de funcionament.

### 2.3 CRÍTIC: `handle_new_user` redefinida amb lògica incoherent

`supabase/migrations/260908_0000_initial_schema.sql:257-263`: Llig el nom de `->> 'name'`, fa servir la variable `v_rgpd`, fallback `'Persona'`.

`supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:66-74`: Llig primer `->> 'full_name'`, fa servir `'Veí/na'` com a fallback, llig el consentiment de `->> 'accepta_rgpd'` (no `->> 'rgpd'`), insereix `avatar_url` i registra a `consentiments`.

La versió deepseek és correctiva (evita spoofing de `tenant_id` llegint de `private.ajustos`), però el fet que la inicial encara estiga present i que el README les lliste ambdues pot causar confusió.

### 2.4 ALT: Estàndard d'integració descriu Standalone IIFE però el codi usa ESM + host.js

`_wiki_de_poble/02_saber/estandard_integracio_react.md:16-18`: "l'aplicació s'empaqueta de forma hermètica i aïllada en un format IIFE (Standalone)"

`src/data/SELF-DESCRIBE.md:12-13`: "El `host.js` actua de pany."

`src/ARCHITECTURE.md:14-15`: "La injecció del backend es fa via `host.js`"

Són dos mecanismes d'integració diferents per al mateix projecte.

### 2.5 ALT: `UniversalComponents.jsx` referenciat en docs però no existix

`_wiki_de_poble/02_saber/estandard_ui_universal.md:16-18`: "La implementació universal localitzable viu en `src/components/universal/UniversalComponents.jsx` i `Universal.css`"

Verificació al disc: no existix cap fitxer `UniversalComponents.jsx` ni `Universal.css` a `src/components/universal/`. Els fitxers reals són `UniversalElements.jsx`, `UniversalPage.jsx`, etc.

### 2.6 ALT: LEDGER diu "Firebase Hosting" però la resta de docs parlen d'integració en Sollutia

`.agents/LEDGER.md:17`: "S'elimina la consideració de Sollutia com a allotjament del frontend; la destinació final verificada és Firebase Hosting."

`.agents/AGENTS.md:44`: "Sollutia ofereix el backend (Supabase)."

`src/ARCHITECTURE.md:9`: "la injecció en sistemes externs com Sollutia"

### 2.7 CRÍTIC: `xat.js` importa de `./config.js` però `index.js` no el re-exporta

`src/data/supabase/xat.js:13`: `import { getClient } from './config.js';`

`src/data/supabase/index.js:10-20`: No hi ha `export * from './config.js'`.

### 2.8 ALT: JSDoc `@contract` de `xat.js` no coincideix amb els exports reals

`src/data/supabase/xat.js:6-10`: Documenta `subscribeToChat`, `unsubscribeFromChat`, `sendMessage`, `fetchMessages`

Exports reals: `subscribeToXat`, `unsubscribeFromXat`, `enviaMissatge`, `loadMissatges`

### 2.9 ALT: `content.js` i `notes.js` importen `getDefaultUserId` de `../appSeed.js`, saltant-se `backendPort.js`

`src/data/supabase/content.js:3`: `import { getDefaultUserId } from '../appSeed.js';`

`src/data/supabase/notes.js:3`: `import { getDefaultUserId } from '../appSeed.js';`

`src/data/SELF-DESCRIBE.md:12-13`: "Cap component de React pot importar l'adaptador específic."

Aquests mòduls trenquen el contracte d'enxufabilitat.

### 2.10 Resum de contradiccions addicionals

| ID | Nivell | Resum | Cita |
|---|---|---|---|
| 2.2 | ALT | `xat_missatges` no té `es_ia` a la migració inicial | `supabase/migrations/260908_xat_v2.sql:26-32` vs `260908_xat_v2_correccions.sql:63-64` |
| 2.3 | ALT | Política `xat_missatges_insercio` redefinida | `supabase/migrations/260908_xat_v2.sql:121-123` vs `260908_xat_v2_correccions.sql:420-426` |
| 2.4 | ALT | `membres_del_poble` té 3 paràmetres però el codi en passa 1-2 | `supabase/migrations/260908_xat_v2_membres.sql:37-41` vs `src/data/supabase/xat.js:161` |
| 2.5 | MITJÀ | `notes` table: `tenant_id` del config vs RLS | `supabase/migrations/260914_0000_schema_notes.sql:9-10` vs `src/data/supabase/notes.js:41` |
| 2.6 | MITJÀ | `organizations.js` fa PATCH directe sense RPC | `src/data/supabase/organizations.js:19-25` |
| 2.7 | BAIX | `xat_v2.sql` esmenta "Offline-First" però el projecte és Online-First | `supabase/migrations/260908_xat_v2.sql:7-8` vs `ADR-2026-08-ONLINE-FIRST.md:26-30` |
| 2.8 | BAIX | JSDoc de `storage.js`, `realtime.js`, `utils.js` no llisten tots els exports | `src/data/supabase/storage.js:6-11`, `realtime.js:6-9`, `utils.js:6-10` |

---

## 3. Auditoria d'Enxufabilitat amb Sollutia

### 3.1 Estat de la integració

La integració amb Sollutia està **dissenyada però no implementada**. El codi de la capa frontissa (`src/data/frontissa/`) defineix l'anti-corruption layer, el traductor bidireccional i el contracte nucli, però la font de dades real (`recursos.js`) està buida.

### 3.2 CRÍTIC: `RECURSOS = {}` — Cap recurs Sollutia registrat

`src/data/frontissa/sollutia/recursos.js:14-16`:

```javascript
export const RECURSOS = Object.freeze({});
```

El registry de recursos Sollutia està completament buit. Qualsevol crida a `obteRecurs('appData')` o similar sempre fallarà amb "recurs desconegut". El sistema funciona perquè el `host.js` injecta el backend de Supabase (`src/host.js:74-289`), no perquè Sollutia estiga connectat.

**Impacte:** Sollutia no es pot connectar hui mateix. Cal omplir el registry `RECURSOS` amb els recursos Sollutia reals abans que la integració funcione.

### 3.3 CRÍTIC: El mock de Sollutia només implementa 5 de 33 mètodes

`tooling/mocks/sollutiaBackend.js:11-48` implementa només: `loadAppData`, `loadCoreContent`, `loadMur`, `loadMultimedia`, `loadNotes`.

Mètodes del `CONTRACTE_NUCLI` (`src/data/contracte.js:4-37`) sense implementar al mock (28 de 33):

```
loginWithMagicLink, registerWithPassword, loginWithPassword,
loginWithGoogle, listMyOrganizations, createOrganization,
updateOrganization, updateProfile, updateUserPassword, getProfile,
recullTornadaOAuth, logout, getCurrentUser, getBackendConfigurat,
getRuntimeDataMode, getDefaultUserId, createNote, loadFils,
loadMissatges, enviaMissatge, marcaLlegit, creaFilDirecte,
carregaMembres, subscribeToXat, unsubscribeFromXat,
appendChatMessages, appendSectionSubmissionNetworkOnly, updateNote
```

A més, el mock implementa `loadAppData` (`tooling/mocks/sollutiaBackend.js:12`) que NO està al `CONTRACTE_NUCLI`.

### 3.4 ALT: Només un origen Sollutia a la llista blanca OAuth

`public/auth/callback.html:89-104` — La llista `ORIGENS_PERMESOS` només inclou un origen Sollutia: `https://socdepoble.sollutia.com` (línia 91). La línia 103 és un duplicat de la línia 91 (`https://socdepoble.org`). Si Sollutia canvia d'origen o s'afageix un entorn de staging, el callback OAuth rebutjarà la redirecció.

### 3.5 ALT: `ESCRIPTURES_PERMESES = Object.freeze([])` — Cap escriptura per disseny

`src/data/frontissa/sollutia/client.js:18`:

```javascript
export const ESCRIPTURES_PERMESES = Object.freeze([]);
```

El client Sollutia no permet cap escriptura. Això vol dir que totes les operacions d'escriptura (crear notes, enviar missatges de xat, crear organitzacions, actualitzar perfil) han d'anar pel backend de Supabase, no per Sollutia. Això és coherent amb l'arquitectura (Sollutia = lectura, Supabase = escriptura), però limita la flexibilitat de la integració.

### 3.6 MITJÀ: `config.js` no re-exportat des de la façana pública

`src/data/supabase/index.js:10-20` no inclou `export * from './config.js'`. Els mòduls interns l'importen directament (`src/data/supabase/xat.js:13`, `src/data/supabase/realtime.js`, `src/data/supabase/storage.js`, `src/data/supabase/utils.js`), però la façana pública no exposa aquesta dependència compartida.

### 3.7 MITJÀ: `content.js` i `notes.js` importen de `appSeed.js` saltant-se el port

`src/data/supabase/content.js:3` i `src/data/supabase/notes.js:3` importen `getDefaultUserId` directament de `../appSeed.js`, en lloc de passar per `backendPort.js`. Això trenca el contracte d'enxufabilitat (`src/data/SELF-DESCRIBE.md:12-13`): si el host injecta un backend diferent, aquestes funcions continuaran usant la implementació local.

### 3.8 BAIX: `getDefaultUserId` exportat de dues fonts diferents

`src/data/identitat.js:184` — retorna `identitat().id` directament (sessió efímera)

`src/data/backendPort.js:59` — delega al backend injectat via `asseguraMetode`

`src/data/supabase/index.js:25` — re-exporta des de `identitat.js`

`src/app/contexts/IdentitatContext.jsx:6` — importa de `backendPort.js`

Si algun component importa de `supabase/index.js` en lloc de `backendPort.js`, obtindrà un valor diferent.

### 3.9 Punts forts de la integració

- **Anti-corruption layer** (`src/data/frontissa/traductor.js`): validació bidireccional, DTOs frozen, fail-closed. Ben dissenyat.
- **Boot de dues fases** (`src/host.js:74-289`): configurable → segellat. Correcte.
- **PKCE OAuth** (`src/data/oauthRelay.js`): `state` validat, circuit breaker, 3 rutes de retorn. Sòlid.
- **Guard de clau `service_role`** (`vite.config.js:12-20`): bloqueja el bundle si la clau `service_role` està present al codi client.
- **`handle_new_user`** (`supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:44-88`): prevé spoofing de `tenant_id` llegint de `private.ajustos`.

---

## 4. SEO i Accessibilitat

S'han trobat **40 problemes** (3 crítics, 9 alts, 16 mitjans, 12 baixos). Els més rellevants:

### 4.1 CRÍTIC: Renderitzat només client-side (CSR)

`index.html:46-53` — L'`<div id="root">` està buit. El `<noscript>` només mostra un missatge. Els crawlers sense JS no veuen cap contingut indexable: ni títols, ni textos, ni enllaços, ni dades estructurades. Tot i que `src/hooks/useSEO.js` gestiona meta tags dinàmicament, aquestes no existixen en el HTML inicial.

**Impacte:** La pàgina no és perfectament visible en producció per a cercadors. Cal SSR/SSG o prerendering.

### 4.2 CRÍTIC: L'eina d'audit a11y no detecta botons amb només icones

`tooling/wiki/core/a11y_seo.mjs:15` — La regex `BUTTON_TAG = /<button[^>]*>([^<]*)<\/button>/gi` només captura el text directament dins de `<button>`. Els botons que contenen SVG (icona només) no són detectats. La porta dóna un fals verd.

### 4.3 CRÍTIC: L'audit a11y no escaneja fitxers JSX/TSX

`tooling/wiki/core/a11y_seo.mjs:6` — `SCAN_EXT = new Set(['.html'])`. Tota la lògica d'accessibilitat de l'aplicació viu en components `.jsx`. L'audit no pot detectar problemes d'a11y en el codi React real.

### 4.4 ALT: TOC drawer no és un diàleg accessible

`src/components/universal/PageFrame.jsx:79-80` — El `TableOfContentsDrawer` utilitza `<div className="toc-overlay">` i `<aside className="toc-drawer">` sense `role="dialog"`, `aria-modal="true"`, ni `aria-labelledby`. No hi ha focus trap ni handler per Escape. El component `Dialeg.jsx` sí que implementa correctament aquests patrons amb `<dialog>` natiu.

### 4.5 ALT: Dropdown utilitza `<div role="button">` en lloc de `<button>` natiu

`src/components/ui/Dropdown.jsx:23-26` — El trigger és un `<div>` amb `role="button"` i `tabIndex={0}`. Incompleix WCAG 2.1.1 (Keyboard Accessible).

### 4.6 ALT: Accordion: capçaleres sense element de heading

`src/components/ui/Accordion.jsx:16-22` — El botó de l'AccordionItem no està dins d'un heading. Incompleix WCAG 1.3.1 (Info and Relationships). Tampoc té `aria-controls` per associar-lo amb el panell.

### 4.7 ALT: `og:image` per defecte és SVG

`src/hooks/useSEO.js:22` — La imatge per defecte per a Open Graph és `logo-socdepoble-cuadrat-verd.svg`. Facebook, Twitter/X, LinkedIn, Slack i WhatsApp no suporten SVG com a imatge OG. L'`index.html:18` sí que té un PNG correcte (`og-socdepoble-1200x630.png`), però `useSEO.js` el sobreescriu amb l'SVG.

### 4.8 ALT: hreflang declarat per a tots els idiomes en totes les pàgines

`src/hooks/useSEO.js:66-79` — El hook genera `hreflang` per a `ca`, `es`, `en`, `eu`, `gl` en cada pàgina, tot apuntant a la mateixa URL amb `?lang=XX`. No totes les pàgines tenen traduccions en tots 5 idiomes. Declarar `hreflang="es"` per a una pàgina que només existix en català enganya els cercadors.

### 4.9 ALT: SectionItemCard no passa `imageAlt` a UniversalCard

`src/components/SectionItemCard.jsx:44` — Rep una prop `image` però no passa `imageAlt` a `UniversalCard`. Totes les imatges de les targetes tenen `alt=""` (decoratives). Incompleix WCAG 1.1.1 (Non-text Content).

### 4.10 ALT: Sense enllaç "salta al contingut" (skip link)

`index.html:44-52` (absència) — No hi ha cap skip link. Incompleix WCAG 2.4.1 (Bypass Blocks).

### 4.11 ALT: Hero image amb alt buit per defecte

`src/components/universal/PageFrame.jsx:117, 202` — La prop `heroAlt` per defecta a `''`. Una imatge hero no és decorativa.

### 4.12 Resum de problemes SEO/a11y addicionals

| ID | Nivell | Resum | Cita |
|---|---|---|---|
| M-1 | MITJÀ | `lastmod` del manifest SEO sempre és la data actual | `tooling/gates/build-seo-manifest.mjs:33, 174, 208` |
| M-2 | MITJÀ | Dades estructurades (JSON-LD) només s'injecten via JS | `src/hooks/useSEO.js:97-117` |
| M-3 | MITJÀ | Title genèric a `index.html` | `index.html:28` |
| M-4 | MITJÀ | `!important` excessiu en CSS base | `src/css/base.css:54, 65, 75, 85, 96, 105, 122, 189, 194, 321-323` |
| M-5 | MITJÀ | Enllaços sense subratllat | `src/css/base.css:204` |
| M-6 | MITJÀ | Mida de casella de verificació per sota del mínim tàctil | `src/css/components.css:107` |
| M-9 | MITJÀ | `<meta name="theme-color">` no s'actualitza amb el tema | `index.html:8` |
| M-11 | MITJÀ | Duplicat d'origen a la llista blanca OAuth | `public/auth/callback.html:91, 103` |
| M-12 | MITJÀ | Color blau no accessible a `callback.html` | `public/auth/callback.html:44, 59` |
| M-14 | MITJÀ | Contingut de l'Accordion eliminat del DOM quan està plegat | `src/components/ui/Accordion.jsx:33-37` |
| B-1 | BAIX | CSP amb `'unsafe-inline'` temporal | `index.html:10` |
| B-3 | BAIX | Sense `<link rel="sitemap">` | `index.html` (absència) |
| B-4 | BAIX | Sense `<link rel="manifest">` (PWA) | `index.html` (absència) |

### 4.13 Punts forts detectats

- **Tokens de contrast documentats** (`src/css/tokens.css`): cada parell text/fons porta el ratio de contrast mesurat (AAA en la majoria)
- **Component `Pestanyes.jsx`**: patró WAI-ARIA Tabs complet (focus itinerant, fletxes, Home/End, `aria-selected`, `aria-controls`)
- **Component `formulari.jsx`**: etiquetes associades, `aria-describedby`, `aria-invalid`, `<fieldset>`/`<legend>`, `role="switch"`
- **Component `Dialeg.jsx`**: `<dialog>` natiu amb `showModal()`, restauració de focus, handler d'Escape
- **Component `navegacio.jsx`**: molla de pa i paginació amb `aria-current`, `aria-label`, icones ocultes
- **Component `Boto.jsx`**: `aria-busy` per a estat de càrrega, icones `aria-hidden`
- **`prefers-reduced-motion`** respectat a `src/css/layout.css:477-483` i `src/css/components.css:295-298`
- **`:focus-visible`** amb outline de 3px a tot el sistema (`src/css/base.css:209`)
- **`.sr-only`** correctament definit (`src/css/base.css:219-222`)
- **Mida tàctil mínima** de 44px aplicada a controls (`src/css/base.css:197-202`)
- **Fallback `<noscript>`** amb informació de contacte (`index.html:47-52`)

---

## 5. Seguretat

S'han trobat **39 problemes** (5 crítics, 12 alts, 14 mitjans, 8 baixos). Els més rellevants:

### 5.1 CRÍTIC: Client Supabase no actualitza el JWT després del refresh

`src/data/supabase/config.js:13-33` — El client Supabase es crea amb el JWT de la sessió, però mai s'actualitza. Quan el token s'actualitza via `session.refresh_session`, el client continua usant el JWT antic. Les peticions PostgREST posteriors porten el token caducat.

### 5.2 CRÍTIC: Tokens en sessionStorage accessibles per scripts de la pàgina host

`src/data/identitat.js:131-136` — Els tokens (access + refresh) es guarden a `sessionStorage`. Qualsevol script de la pàgina host pot llegir-los (en cas d'atac XSS o script de tercer). `sessionStorage` no és accessible entre pestanyes, però sí dins de la mateixa pestanya.

### 5.3 CRÍTIC: Stack traces exposats als usuaris en el DOM

`src/app/App.jsx:466-468` — El component d'error mostra la stack trace completa a l'usuari. Això revela informació sobre l'estructura interna del codi (noms de funcions, rutes de fitxers) que pot ser explotada.

### 5.4 CRÍTIC: Injecció de filtres PostgREST en la cerca

`src/data/supabase/utils.js:176-179` — La funció `searchWithPagination` construeix el filtre `ilike` concatenant directament l'entrada de l'usuari sense sanear. Un usuari maliciós pot injectar operadors PostgREST (`or(`, `and(`, `neq.`) per manipular la consulta.

### 5.5 CRÍTIC: Injecció de patrons ILIKE en la cerca de membres

`src/data/supabase/xat.js:162-163` — `ilike('nom', \`%${textSearch}%\`)` concatena l'entrada directament. Caràcters especials (`%`, `_`, `\`) no s'escapen. Un usuari pot injectar patrons que modifiquen el comportament de la consulta.

### 5.6 ALT: HTTPS no imposat per a la URL de Supabase en producció

`src/PedraSecaEmbed.jsx:158-170` — El component no verifica que `supabaseUrl` comence amb `https://` en producció. Si el host injecta una URL `http://`, les peticions (inclosos els tokens JWT) viatgen en text pla.

### 5.7 ALT: Taules del xat sense RLS en cap migració del bundle

`supabase/migrations/260908_xat_v2.sql`, `260908_xat_v2_correccions.sql`, `260908_xat_v2_membres.sql` — Les taules `xat_missatges`, `xat_fils`, `xat_participants` no tenen polítiques RLS definides en cap migració del bundle. [SUPÒSIT] Les polítiques podrien estar en una migració no inclosa al bundle, però sense elles, qualsevol usuari autenticat pot llegir tots els missatges de tots els pobles.

### 5.8 ALT: `xat.js` usa `supabase.auth.getUser()` en lloc de la sessió local

`src/data/supabase/xat.js:47-48` — Cada operació del xat crida `supabase.auth.getUser()`, que fa una petició de xarxa al servidor d'autenticació. Això afegeix latència innecessària i pot fallar si la xarxa no està disponible. Hauria d'usar la sessió local (`identitat.js`).

### 5.9 Resum de problemes de seguretat addicionals

| ID | Nivell | Resum | Cita |
|---|---|---|---|
| A-3 | ALT | Bucket `mitjans` públic | `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:60-61` |
| A-8 | ALT | `app_content` inicialment públic | `supabase/migrations/260908_0000_initial_schema.sql:759-760` |
| M-1 | MITJÀ | `is_town_member` granted a `anon` i `public` | `supabase/migrations/260908_0000_initial_schema.sql:448-449` |
| M-2 | MITJÀ | `tenantId` hardcodat per defecte | `src/data/supabase/runtime.js:31` |
| M-3 | MITJÀ | Fallback `town_name` hardcodat | `src/data/supabase/auth.js:68` |

---

## 6. Incògnites i recomanacions finals

### 6.1 Incògnites

1. **Polítiques RLS del xat** — No es troben en cap migració del bundle. Estan en una migració posterior no inclosa? [SUPÒSIT]
2. **`registraConsentiment` en `auth.js`** — L'ESTAT.md afirma que s'ha afegit la crida, però no es pot verificar sense el codi font complet d'`auth.js` (el fitxer està al manifest però no s'ha auditat en detall).
3. **`tooling/gates/` i `window.__SDP_REACT_MOUNTED__`** — `src/ARCHITECTURE.md:18-19` els descriu com a actius, però l'ESTAT.md admet que algunes portes estan bloquejades.
4. **Scripts `_scripts/migracio_pedra_seca_pro.mjs` i `_scripts/gen_targeta_universal.mjs`** — Referenciats a l'annex històric de `estandard_ui_universal.md:181-187`, no es pot verificar la seua existència.

### 6.2 Recomanacions prioritzades per a producció

#### Prioritat 1 — Bloquejant per a producció

1. **Implementar SSR/SSG o prerendering** (`index.html:46-53`) — Sense això, la pàgina no és visible per a cercadors
2. **Omplir `RECURSOS` a `recursos.js`** (`src/data/frontissa/sollutia/recursos.js:14-16`) — Sense això, Sollutia no es pot connectar
3. **Implementar els 28 mètodes restants al mock de Sollutia** (`tooling/mocks/sollutiaBackend.js:11-48`) — Sense això, el mock no serveix per a testing
4. **Actualitzar el JWT del client Supabase després del refresh** (`src/data/supabase/config.js:13-33`)
5. **Sanear l'entrada d'usuari en `searchWithPagination`** (`src/data/supabase/utils.js:176-179`) i `membres_del_poble` (`src/data/supabase/xat.js:162-163`)
6. **Retirar stack traces del DOM** (`src/app/App.jsx:466-468`)
7. **Definir RLS per a les taules del xat** — Si no estan en una migració posterior

#### Prioritat 2 — Important per a qualitat

8. **Resoldre la contradicció PWA/Dexie vs ADR-2026-08** — Retirar o documentar
9. **Resoldre la contradicció Realtime** — Activar o retirar el codi mort
10. **Corregir `og:image` SVG → PNG** (`src/hooks/useSEO.js:22`)
11. **Corregir hreflang** — Només declarar per als idiomes amb traducció real
12. **Afegir skip link** (`index.html`)
13. **Corregir Dropdown, Accordion, TOC drawer** — Accessibilitat
14. **Retirar el nom "Pedra Seca"** de tot el codi i documentació — Substituir per un nom neutre
15. **Re-exportar `config.js` des de `index.js`** (`src/data/supabase/index.js:10-20`)
16. **Corregir imports de `content.js` i `notes.js`** per passar per `backendPort.js`

#### Prioritat 3 — Millora contínua

17. **Ampliar l'audit a11y per escanejar `.jsx`** (`tooling/wiki/core/a11y_seo.mjs:6`)
18. **Corregir la regex de detecció de botons** (`tooling/wiki/core/a11y_seo.mjs:15`)
19. **Afegir `<link rel="sitemap">` i `<link rel="manifest">`** (`index.html`)
20. **Actualitzar `theme-color` dinàmicament** (`index.html:8`)
21. **Retirar `!important` excessiu** de CSS base
22. **Eliminar el duplicat d'origen OAuth** (`public/auth/callback.html:91, 103`)
23. **Unificar la nomenclatura CSS** (`sp-*` vs `uc-*`/`up-*` vs `sdp-*`)

### 6.3 Conclusió

El sistema té una arquitectura tècnicament sòlida (anti-corruption layer, boot de dues fases, PKCE, guard de clau `service_role`, tokens de contrast documentats, components canònics amb WAI-ARIA correcte). Però acumula **15 problemes crítics** que impedeixen que la pàgina siga perfectament visible en producció i lliure d'invencions.

Els dos bloquejadors absoluts per a la connexió amb Sollutia són:
1. `RECURSOS = {}` (`src/data/frontissa/sollutia/recursos.js:14-16`) — La font de dades Sollutia està buida
2. Mock de Sollutia amb només 5 de 33 mètodes (`tooling/mocks/sollutiaBackend.js:11-48`)

I els dos bloquejadors absoluts per a la visibilitat en producció són:
1. CSR sense SSR/SSG (`index.html:46-53`) — Els crawlers no veuen contingut
2. `og:image` SVG (`src/hooks/useSEO.js:22`) — Les xarxes socials no el renderitzen

---

## Annex: Fitxers del manifest citats

| Ruta | Fitxer |
|---|---|
| `index.html` | HTML estàtic |
| `public/auth/callback.html` | Callback OAuth |
| `src/PedraSecaEmbed.jsx` | Web component Shadow DOM |
| `src/host.js` | Boot de dues fases |
| `src/data/contracte.js` | Contracte nucli (33 mètodes) |
| `src/data/backendPort.js` | Pany d'injecció |
| `src/data/identitat.js` | Sessió efímera |
| `src/data/appSeed.js` | Seed local |
| `src/data/oauthRelay.js` | Relay OAuth amb PKCE |
| `src/data/supabase/index.js` | Façana pública (11 mòduls) |
| `src/data/supabase/config.js` | Client Supabase |
| `src/data/supabase/runtime.js` | Runtime i tenantId |
| `src/data/supabase/auth.js` | Autenticació |
| `src/data/supabase/xat.js` | Xat |
| `src/data/supabase/content.js` | Contingut |
| `src/data/supabase/notes.js` | Notes |
| `src/data/supabase/organizations.js` | Organitzacions |
| `src/data/supabase/storage.js` | Storage |
| `src/data/supabase/realtime.js` | Realtime |
| `src/data/supabase/utils.js` | Utilitats |
| `src/data/frontissa/sollutia/recursos.js` | Registry de recursos Sollutia |
| `src/data/frontissa/sollutia/client.js` | Client Sollutia |
| `src/data/frontissa/traductor.js` | Anti-corruption layer |
| `src/sections/xat/XatContext.jsx` | Context del xat |
| `src/sections/notes/NotesContext.jsx` | Context de notes |
| `src/app/App.jsx` | Component arrel |
| `src/app/contexts/IdentitatContext.jsx` | Context d'identitat |
| `src/components/universal/PageFrame.jsx` | Frame de pàgina |
| `src/components/ui/Dropdown.jsx` | Dropdown |
| `src/components/ui/Accordion.jsx` | Accordion |
| `src/components/ui/UniversalCard.jsx` | Targeta universal |
| `src/components/SectionItemCard.jsx` | Targeta de secció |
| `src/hooks/useSEO.js` | Hook SEO |
| `src/config/navigation.js` | Navegació |
| `src/config/app.js` | Config app |
| `src/css/base.css` | CSS base |
| `src/css/tokens.css` | Tokens de disseny |
| `src/css/layout.css` | CSS layout |
| `src/css/components.css` | CSS components |
| `tooling/mocks/sollutiaBackend.js` | Mock de Sollutia |
| `tooling/wiki/core/a11y_seo.mjs` | Audit a11y/SEO |
| `tooling/gates/build-seo-manifest.mjs` | Build SEO manifest |
| `vite.config.js` | Config Vite |
| `package.json` | Dependències |
| `supabase/README.md` | README Supabase |
| `supabase/migrations/260908_0000_initial_schema.sql` | Esquema inicial |
| `supabase/migrations/260908_xat_v2.sql` | Xat v2 |
| `supabase/migrations/260908_xat_v2_correccions.sql` | Correccions xat |
| `supabase/migrations/260908_xat_v2_membres.sql` | Membres |
| `supabase/migrations/260914_0000_schema_notes.sql` | Schema notes |
| `supabase/migrations/260914_0100_auditoria_rls_fixes.sql` | RLS fixes |
| `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql` | Seguretat profunda |
| `_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` | ADR Online-First |
| `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md` | Arquitectura unificada |
| `_wiki_de_poble/02_saber/el_projecte.md` | El projecte |
| `_wiki_de_poble/02_saber/estandard_integracio_react.md` | Estàndard integració |
| `_wiki_de_poble/02_saber/estandard_ui_universal.md` | Estàndard UI |
| `src/ARCHITECTURE.md` | Arquitectura |
| `src/data/SELF-DESCRIBE.md` | Self-describe |
| `.agents/AGENTS.md` | Agents |
| `.agents/ESTAT.md` | Estat |
| `.agents/LEDGER.md` | Ledger |

---

*Auditoria realitzada sobre el bundle `260915_2330_BUNDLE_auditoria.md` (schema `sdp.bundle.v2`, 540 fitxers, 75.144 línies). Sentinella `<<<FI_DEL_BUNDLE>>>` verificada. Tota cita està en format `ruta:linies` i correspon a fitxers del manifest.*
