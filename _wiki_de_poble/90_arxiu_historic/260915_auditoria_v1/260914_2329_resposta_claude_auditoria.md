---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: verificació del paquet i 7 troballes amb evidència (Claude)"
---
# 🛡️ RESPOSTA A LA PETORRETA: AUDITORIA (Claude)

**Bundle auditat:** `260914_2308_BUNDLE_auditoria.md` · `sdp.bundle.v2` · generat 2026-09-14T21:08:58.676Z
**Mètode:** extracció del cos, recàlcul de sha256, execució real de les portes que no depenen de `node_modules`.

---

## 0. Verificació del paquet

El capçal diu «no cal creure el capçal». No l'hem cregut.

| Comprovació | Declarat | Recalculat | Resultat |
|---|---|---|---|
| Fitxers | 529 | 529 | ✅ |
| Bytes | 3.374.765 | 3.374.765 | ✅ |
| sha256 discrepants | — | 0 | ✅ |
| Seccions duplicades | — | 0 | ✅ |
| Obligatoris absents | — | cap | ✅ |

`verificat: true` és cert. El paquet es pot usar com a evidència.

---

## 1. El contracte d'abast menteix per omissió · P2

**Evidència.** El contracte declara `assets` entre els `directoris`, però `.svg` **no** és a la llista d'`extensions`. Resultat: 0 fitxers sota `assets/` al manifest. El bloc `absents_no_critics` només declara tres fitxers de `public/`, i cap dels logos.

**Conseqüència mesurada.** Executant la porta contra el paquet extret:

```
❌ Porta Importacions: 6 importació(ns) cap al no-res.
  src/components/BrandMark.jsx:1  →  ../assets/ui/logo-socdepoble-rect-negre.svg
  src/components/BrandMark.jsx:2  →  ../assets/ui/logo-socdepoble-rect-blanc.svg
  src/config/app.js:1,2,3         →  ../assets/ui/logo-*.svg
```

Cinc d'eixes sis són **falsos positius del bundle**, no defectes del codi. Qualsevol petorreta del Consell que audite només amb el paquet obrirà cinc incidències fantasma. El capçal promet «sabeu exactament què **no** esteu veient»; ara mateix no.

**Causa.** El filtre d'extensions s'aplica després del filtre de directoris, i ningú reconcilia les dues llistes.

**Correcció mínima.** A `tooling/brain/crear_bundle.mjs`: quan un directori del contracte quede buit pel filtre d'extensions, emetre'l a `absents_no_critics` amb el motiu. Alternativa d'una línia: afegir `.svg` a `extensions`.

**Verificació.** `node tooling/gates/tractor-importacions.mjs` contra el paquet extret ha de baixar de 6 a 1.

---

## 2. La Porta Persistència està verda amb la capa evitada · P1

**Evidència 1 — el forat és al codi de la porta.** `tooling/gates/tractor-persistencia.mjs`:

- Línia 23: `const SRC = path.join(ARREL, 'src')` — només escaneja `src/`.
- Línia 62: `if (/localStorage\s*\./.test(net) && rel !== CAPA)` — només vigila `localStorage`.

**Evidència 2 — ja s'hi cola codi.** `src/sections/notes/NotesContext.jsx` línies 50, 62 i 104 criden `sessionStorage.getItem` / `setItem` directament, fora de `src/config/storage.js`.

**Evidència 3 — la porta no se n'entera.** Execució real ací:

```
L2 · localStorage encapsulat        ✅ pas
176 fonts revisades · 0 infraccions   (eixida 0)
```

**Evidència 4 — ja estava escrit.** `src/config/storage.js` línies 53-55 documenta el forat textualment: «*tractor-persistencia.mjs (L2) només vigila `localStorage.`. Amplia'l perquè vigile també `sessionStorage.` fora d'aquest fitxer, o esta capa es podrà evitar igual que s'evitava l'altra*».

**Evidència 5 — hi ha un segon punt cec.** `public/auth/callback.html` (183 línies) manipula el codi OAuth i queda **fora** de `SRC`. La porta no l'ha mirat mai.

**Correcció mínima.** Dues línies a la porta:

```js
if (/(localStorage|sessionStorage)\s*\./.test(net) && rel !== CAPA) { … }
```

i afegir `public/` al recorregut amb `.html` inclòs a `camina()`.

**Verificació.** Amb el canvi, la porta ha de donar exactament 3 infraccions L2 a `NotesContext.jsx` (50, 62, 104). Si en dona 0, el canvi no ha entrat.

---

## 3. L'inventari legal d'emmagatzematge és incomplet · P1

`src/sections/text/legalContent.js:170` diu al públic: «**Ací tens la llista completa, sense excepcions.**»

Claus escrites pel codi i **no** declarades:

| Clau | Capa | On s'escriu |
|---|---|---|
| `sdp-grid-widths` | localStorage | `src/components/layout/AppGridShell.jsx:90` i `:99` |
| `sdp:oauth:state` | sessionStorage | `src/data/oauthRelay.js:148` |

La segona és especialment lletja: els seus germans `sdp:oauth:verificador` i `sdp:oauth:traspas` **sí** que estan declarats. Es va inventariar el PKCE i es va oblidar el `state` del mateix flux.

**Causa documentada.** L'acta del 260913 diu: «*S'ha habilitat la persistència de les amplàries de les columnes de l'AppGridShell usant localStorage*». No hi ha cap pas del procediment que obligue a tocar l'inventari legal. I el projecte ja sabia que passaria: `src/sections/disseny/cataleg/PaginaEstructura.jsx:70` llista com a *no facis* exactament això — «*Persistir amplades en localStorage sense afegir la clau a l'inventari legal*».

La regla estava escrita al catàleg i no tenia porta. Per això s'ha trencat.

**Correcció mínima.** Dues entrades `<li>` a `legalContent.js`. Però la correcció **estructural** és una porta: extraure les claus literals de `getVal|setVal|delVal|getEfimer|setEfimer|delEfimer` i de `*_KEY`/`CLAU_*`, i comparar-les amb les `<code>` de l'apartat 20. Bloquejar si hi ha delta.

**Verificació.** La porta nova ha de fallar ara (2 claus) i passar després d'afegir-les.

---

## 4. El contingut públic contradiu l'ADR vigent · P1

**ADR-2026-08-ONLINE-FIRST**, `estat: actiu`:

> Cap garantia de reconciliació offline, background sync o CRDT.
> Retirar PWA, Dexie, mode hybrid, dispositius simulats i doctrina A10/offline.

**`src/sections/text/pageContent.js`**, secció **«Collita Tancada (Fet)»** — contingut servit al públic:

> «Hem eliminat tot rastre de dependència del CMS per abraçar una arquitectura 100% enxufable i **Online-First**.»

Està catalogat com a **fet**, no com a aspiració. És exactament el marc que la petorreta prohibix perquè «enfosquix la realitat».

**Correcció mínima.** Reescriure l'entrada: la independència del CMS és certa i és una fita real; «Online-First» no ho és. Substituir per «arquitectura 100% enxufable i independent del CMS».

**Verificació.** `grep -ril "Online-First\|Online-First" src/sections/text/` ha de tornar buit. La resta d'aparicions al corpus (ADR, `contingencia_offline.md`, `LEDGER.md`) són legítimes: parlen del passat o del futur declarat.

---

## 5. La secció Dispositius: l'ADR no s'ha executat · P1

L'ADR mana retirar els «dispositius simulats». No s'ha fet. La secció és una ruta viva:

- `src/config/sections.js:12` — `{ id: 'dispositius', path: '/dispositius', label: 'Dispositius', shortLabel: 'P2P', icon: Wifi }`
- `src/app/App.jsx:610` — `<Route path="dispositius" element={<DevicesSection />} />`

**Què fa realment.** `grep` de `RTCPeerConnection|WebSocket|fetch(|supabase` sobre `src/sections/dispositius/` torna **zero resultats**. L'únic transport és `new BroadcastChannel(...)` (`devicesRuntime.js:111`), que **només comunica pestanyes del mateix navegador en la mateixa màquina**.

Es presenta com a «P2P» amb icona de Wifi. I la pàgina legal ho reforça: «*Aquestes converses entre dispositius es queden al teu telèfon i no pugen al servidor*» — literalment cert, però el lector entén que hi ha comunicació entre aparells. No n'hi ha.

**Correcció mínima.** Dues eixides honestes, no tres:

1. Executar l'ADR: llevar `dispositius` de `SECTION_ORDER`, la ruta i les quatre claus `socdepoble-device-*` de l'inventari legal.
2. Si es vol conservar com a maqueta, reetiquetar `shortLabel` de `'P2P'` a `'Maqueta'` i dir a la fitxa que només enllaça pestanyes del mateix navegador.

El que no es pot fer és deixar-ho com està amb l'etiqueta P2P.

**Verificació.** Opció 1: `porta:rutes` i `porta:cens` passen i `/dispositius` dona 404. Opció 2: `grep -n "shortLabel" src/config/sections.js` ja no diu `P2P`.

---

## 6. Regressió introduïda en el tancament de la Porta Cadena · P2

L'acta de les 22:57 declara: «*S'han traslladat diversos scripts inactius antics al directori `legacy/`*».

El trasllat va canviar la profunditat i no es van tocar els imports:

- `tooling/gates/legacy/tractor-classes-orfes.mjs:60` → `import { R as ARREL } from '../lib/arrel.mjs'`
- Resol a `tooling/gates/lib/arrel.mjs` → **no existix**
- El fitxer real és `tooling/lib/arrel.mjs`

**Correcció mínima.** `../lib/arrel.mjs` → `../../lib/arrel.mjs`. Un caràcter i mig.

**Verificació.** `node tooling/gates/tractor-importacions.mjs` ha de baixar a 5 (els 5 SVG del punt 1) i a 0 quan es resolga també aquell.

---

## 7. Detalls menors · P3

- **`src/utils/sanitize.js:50-52`** — no-op: `if (node.getAttribute('target') === '_blank') node.setAttribute('target', '_blank')`. Assigna el valor que ja tenia. No és un forat (el `rel` es posa sempre a la línia 49), però és codi mort que aparenta fer una comprovació de seguretat. O es lleva o es completa.
- **`supabase/migrations/260908_0000_initial_schema.sql`** — `grant execute on function private.is_town_member(uuid) to public` i `to anon`, mentre els cinc germans del mateix esquema es revoquen d'`anon` i `public`. Impacte real nul (la funció comprova `auth.uid() is not null`, que per a `anon` és fals), però trenca el patró i el pròxim que la copie no tindrà la mateixa sort.

---

## El que està sòlid

No tot és deute. Comprovat i correcte:

- **25/25** funcions `security definer` amb `set search_path = ''`. Cap excepció.
- **15/15** taules públiques amb RLS habilitat. L'esquema `private` amb `revoke all ... from public` i grants nominals.
- **Cap secret** al paquet. `vite.config.js:13` para el build si algú posa la `service_role` a `VITE_SUPABASE_ANON_KEY`.
- **Tots** els `dangerouslySetInnerHTML` (5 punts) passen per `sanitizeHtml`. Cap `eval` ni `new Function`.
- `sanitize.js` restringix `ALLOWED_URI_REGEXP` per davall del que DOMPurify porta per defecte (fora `ftp`, `callto`, `sms`, `cid`, `xmpp`) i prohibix `svg` i `math` — mitigació mXSS correcta.
- **71** scripts a `package.json`, **0** referències a fitxers inexistents.

---

## Ordre d'atac

| # | Troballa | Prioritat | Cost |
|---|---|---|---|
| 3 | Inventari legal incomplet | P1 · exposició legal | 2 línies + porta |
| 2 | Porta Persistència cega | P1 · la porta menteix | 2 línies |
| 4 | «Online-First» al públic | P1 · reputacional | 1 paràgraf |
| 5 | Dispositius etiquetats P2P | P1 · honestedat | decisió, després codi |
| 6 | Import trencat a legacy | P2 · porta roja | 1 caràcter |
| 1 | Contracte del bundle | P2 · contamina el Consell | 1 branca |
| 7 | No-op i grant incoherent | P3 | 2 línies |

El fil comú dels punts 2, 3 i 5: **hi ha regla escrita sense porta que la impose**. El catàleg diu «no persistisques sense inventariar», la doctrina diu «retira els dispositius simulats», `storage.js` diu «amplia la porta». Les tres estaven escrites. Cap tenia mecànica. El deute no és de disciplina, és de mecanització.
