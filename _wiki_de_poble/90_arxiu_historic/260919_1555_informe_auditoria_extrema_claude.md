---
type: informe
status: esborrany
description: Auditoria extrema del sistema a tots els nivells, amb tall fixat al commit 2fc1e979 i verificacio empirica de les portes
tags:
  - seguretat
  - arquitectura
  - escriptori
---

# Informe — Auditoria Extrema del Sistema

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-1555 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 15:55 |
| Modificació | 26-09-19 15:55 |
| Agent redactor | Claude Opus 5 (Claude Code) |
| Petorreta d'origen | SDP-PROMPT-260919 |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260919_1531_MICRO_PROMPT_Auditoria_Extrema]]
- [[260919_1246_informe_auditoria_extrema_sollutia]]

## Tall d'auditoria

| Camp | Valor |
| --- | --- |
| Commit | `2fc1e9795d3adb903240e6ffcba0df169c3dc4a5` |
| Branca | `backup-notes-publish` |
| Arbre de treball | net, excepte la petorreta d'encàrrec (sense seguir) |
| Mètode de citació | ruta i línia del commit fixat |
| Verificació de portes | còpia pristina exportada amb `git archive HEAD` al directori temporal, per a separar el deute real del soroll de l'arbre brut |
| Contenció | zero línies de codi modificades, afegides o esborrades. L'únic fitxer escrit és aquest informe. |
| Cerca externa | cap. Tot ix de l'arbre local. |

## Resum executiu

S'han revisat l'arrencada (`host.js`, `main.jsx`, `embed.jsx`), la frontera d'identitat
(`identitat.js`, `oauthRelay.js`, `callback.html`, `runtimePolicy.js`), la capa de dades
(`src/data/supabase/**`), el sanejador, el sistema de disseny, les 14 migracions SQL i les
48 portes de la maquinària.

El resultat curt: **l'arquitectura és bona i la maquinària que la vigila no ho és**. Els
controls de seguretat estan ben pensats i escrits, i tres dels més importants no s'executen
mai perquè un `catch` se'ls menja, perquè se'ls passa un objecte amb la forma equivocada, o
perquè el fitxer que vigilen ja no existeix. No són bugs de lògica: són **portes que diuen
verd sense haver comprovat res**.

A més, la premissa de l'encàrrec («Totes les Portes estan actualment en verd») **és falsa al
commit auditat**, i això s'ha mesurat, no deduït.

## Veredicte sobre la premissa

L'informe d'avanç de la petorreta afirma que totes les portes estan en verd. S'han executat
42 portes i la bateria de proves contra una còpia **pristina** del commit `2fc1e979`
(sense l'arbre brut, per a evitar falsos positius). Resultat:

| Estat | Recompte | Portes |
| --- | --- | --- |
| ✅ Verd | 28 | psicopatia, 58px, importacions, promesa, tdz, arrel, enxufe, graella, innerhtml, rutes, rutes-web, frontera, frontera-auth, cens, consell, registre, manifest, doctrina, maquinari, fitxa, estucat, llavor, classes, rls, cataleg, adaptadors, cognitiu, frontmatter |
| ❌ Roig | 14 | pedra-seca, design-guard, tokens, cromatic, crom, vocabulari, scc, persistencia, shim, **cadena**, utilitats-sdp, inlinestyles, esquemes, nomenclatura |
| ❌ Roig | proves | `vitest --run`: 1 fallada de 47 (`UniversalCard.test.jsx`) + 1 error no capturat |
| ⚠ Avisos | lint | `eslint` ix amb 0, però amb **352 avisos** |

La porta `cadena` — la metaporta que audita la cadena de portes — acaba literalment amb:
`❌ [CADENA] 5 problemes. La cadena de portes no és de fiar.`

Nota de mètode: la primera passada, sobre l'arbre brut, donava `frontmatter` en roig i
`nomenclatura` amb 20 infraccions N1. Contra la còpia pristina, `frontmatter` passa i N1 en
són 19. La diferència **és la petorreta d'encàrrec mateixa**: el seu nom
(`260919_1531_MICRO_PROMPT_Auditoria_Extrema.md`) no és snake_case i el seu frontmatter no
valida. Es deixa constància per a no comptar-ho com a deute del producte.

## Resposta directa a la Incògnita

> *Hi ha alguna porta del Tractor que estiga fallant de manera silenciosa o que estiga
> ignorant un risc greu que se'ns hagi escapat?*

Sí. Quatre, i totes quatre són del tipus pitjor: **exit 0 sense haver comprovat res**.

1. `tooling/scripts/tractor-consell-core.mjs:350` — la LLEI 10 (Shim JSX) s'evapora.
2. `src/config/publicCredentials.js:43` — l'aturador de `service_role` es menja el seu propi llançament.
3. `tooling/gates/tractor-rls.mjs:78` — la llei R3 està exempta justament per a la taula de persones.
4. `tooling/gates/tractor-rls.mjs:226` — la llei R5 és un bucle buit.

Les quatre estan desenvolupades a P0-1, P0-4, P1-4 i P1-5.

---

# Troballes

Prioritats: **P0** crític (perill actiu o control de seguretat inert) · **P1** alt (defecte
funcional o d'accessibilitat que afecta persones) · **P2** mitjà (deute estructural, risc
latent, rendiment) · **P3** baix (higiene, documentació que menteix).

## P0 · Crític

### P0-1 · L'aturador de `service_role` es menja el seu propi llançament

**On:** `src/config/publicCredentials.js:29-45`

```js
try {                                                       // 29
  ...
  if (payload.role === ['service', 'role'].join('_')) {
    throw new Error("ATURADOR CRÍTIC: Has posat la clau...");   // 40
  }
} catch(e) {                                                // 43
   // Si falla el parsing, és possible que no siga un JWT estàndard. Ignorem ací.
}
```

El `throw` de la línia 40 està **dins** del `try` que obri la línia 29. El `catch` de la
línia 43 l'atrapa i el llença a terra. La comprovació més important del fitxer —la que
impedeix que una clau d'administració acabe compilada dins d'un bundle públic— **no pot
fallar mai**.

**Impacte:** aquest fitxer es crida des de `vite.config.js:15`, `vite.standalone.config.js:15`
i `runtimePolicy.js:16`. És a dir: és l'única barrera de build contra la fuita de
`service_role`, i està desarmada als tres punts alhora. La detecció del marcador literal
(`sb_secret_`, línia 22) sí que funciona, perquè està fora del `try`; la detecció per
*payload* del JWT, que és la que atrapa el cas real, no.

**Correcció proposada:** moure la comprovació de `payload.role` fora del `try`. Descodificar
dins del `try`, guardar el `payload` en una variable i decidir després:

```
let payload = null;
try { payload = JSON.parse(...); } catch { /* token opac */ }
if (payload?.role === 'service_role') throw new Error(...);
```

**Regressió:** afegir un cas a `tooling/gates/` que passe una clau amb `role: service_role`
i exigisca que `validatePublicCredentials` llance. Ara mateix cap prova cobreix aquest camí.

---

### P0-2 · La política d'execució es configura amb la forma equivocada i es descarta en silenci

**On:** `src/main.jsx:12-16` contra `src/config/runtimePolicy.js:9`

`main.jsx` és el punt d'entrada del build web (`index.html:71`). Crida:

```js
setRuntimePolicy({                                    // main.jsx:12
  issuer: import.meta.env.VITE_APP_ISSUER || 'https://auth.socdepoble.org',
  audiences: (import.meta.env.VITE_APP_AUDIENCES || 'authenticated').split(','),
  environment: ...
});
```

Però la signatura és:

```js
export function setRuntimePolicy({ backend, auth = {} } = {}) {   // runtimePolicy.js:9
```

`issuer`, `audiences` i `environment` viatgen al **nivell superior**; la funció només llig
`backend` i `auth`. Les tres claus es descarten sense cap avís. La política queda congelada
amb `issuer` = `import.meta.env.VITE_SOLLUTIA_ISSUER` (buit a `.env.example:13`) i
`audiences` = `['socdepoble']` (el valor per defecte de `runtimePolicy.js:33`).

**Impacte doble, i tots dos silenciosos:**

1. Sense `issuer`, `adoptaSessioExterna()` retorna `false` a `identitat.js:249` abans de mirar
   res més. **L'adopció de sessions de l'amfitrió està morta**, que és exactament la
   integració amb Sollutia.
2. Encara que s'hi posara l'emissor, l'audiència esperada seria `socdepoble` mentre que el
   `aud` que emet GoTrue és `authenticated`. `identitat.js:276-283` rebutjaria el token.

L'únic senyal és un `console.warn` a `runtimePolicy.js:24`. Cap porta ho veu.

**Correcció proposada:** `setRuntimePolicy({ auth: { issuer, audiences } })`. I, perquè no
torne a passar, fer que `setRuntimePolicy` avise o llance en rebre claus que no siguen
`backend` ni `auth` — la mateixa disciplina que ja aplica `host.js:145-151` amb els mètodes
fora de contracte.

---

### P0-3 · El relé de producció accepta `localhost` com a destí del codi d'autorització

**On:** `public/auth/callback.html:92,98` i `tooling/gates/saneja-callback.mjs:14`

`callback.html` és l'única adreça registrada a Supabase i, per disseny, la que decideix a
qui es torna el codi PKCE. La seua llista blanca inclou:

```js
if (u.protocol !== 'https:' && u.hostname !== 'localhost') return false;             // 92
if (h === 'localhost' && ['5173','3000','3340','8080'].indexOf(u.port) !== -1) return true;  // 98
```

Aquest fitxer es desplega **tal qual** a `https://auth.socdepoble.org/callback`. No hi ha
cap condicional de build que lleve el bloc de desenvolupament. Per tant, en producció, una
navegació a
`https://auth.socdepoble.org/callback?code=…&sdp_origin=http://localhost:3000` fa que el
relé entregue el codi d'autorització a `http://localhost:3000`.

**I el guardià que hauria de detectar-ho no el pot veure.** `saneja-callback.mjs`, connectat
com a `prebuild`, busca aquest patró:

```js
const localhostRegex = /['"]http(s)?:\/\/(localhost|127\.0\.0\.1)(:\d+)?['"]/i;    // 14
```

Busca una **URL completa entre cometes**. `callback.html` escriu `'localhost'` com a
*hostname* nu i els ports en una llista a banda. S'ha comprovat executant el regex contra el
fitxer real: **no troba res**. La porta imprimix
`✅ [SANEJAMENT] callback.html validat correctament sota la nova política dinàmica` mentre el
relé accepta localhost.

El comentari de `saneja-callback.mjs:12` diu, literalment, que `callback.html`
«rebutja localhost: (u.hostname !== 'localhost')». El codi fa el contrari.

**Impacte:** el codi PKCE és d'un sol ús i no val res sense el verificador, que no ix de la
pestanya d'origen. Això limita el dany, però no l'anul·la: qualsevol procés local d'una
víctima escoltant en un d'eixos quatre ports pot rebre codis d'autorització emesos pel relé
de producció, i és una superfície que la doctrina del fitxer declara explícitament tancada.

**Correcció proposada:** dues coses, no una.

1. Que `esOrigenPermes` només admeta `localhost` quan el propi relé s'està servint des de
   `localhost`. En producció (`window.location.hostname === 'auth.socdepoble.org'`) el bloc
   ha de ser inabastable.
2. Reescriure `saneja-callback.mjs` perquè busque el **token** `localhost` i `127.0.0.1` en
   qualsevol forma (identificador, cadena o fragment), no una URL entre cometes. Un guardià
   que només reconeix una grafia no és un guardià.

---

### P0-4 · La LLEI 10 (Shim JSX) s'evapora quan el fitxer que vigila no existeix

**On:** `tooling/scripts/tractor-consell-core.mjs:350-351`, `src/shims/` (buit)

```js
const shim = llig('src/shims/jsx-runtime.js');    // 350
if (shim) {                                        // 351
  ... quatre comprovacions ...
  if (net) passa(LLEI);
}
```

`llig` retorna `null` si el fitxer no existeix (`tractor-consell-core.mjs:36`). Quan és
`null`, el bloc sencer se salta: **no crida `falla()` i tampoc crida `passa()`**. La llei
desapareix del recompte i `porta:consell` acaba en verd.

I el fitxer **no existeix**: `src/shims/` és un directori buit i `git ls-files src/shims/` no
torna res. Tres peces de la maquinària encara el donen per viu:

- `tooling/gates/tractor-shim.mjs:17` — la porta que el valida (aquesta sí falla, sorollosa).
- `tooling/scripts/tractor-consell-core.mjs:350` — la que calla.
- `tooling/brain/tractor-pedra-seca.mjs:268` — el declara accessible «per alias de resolve a
  vite.config (jsxImportSource)». **Cap dels dos `vite.config` té cap àlies a `src/shims/`.**
  `vite.standalone.config.js:32` resol `react/jsx-runtime` directament a `preact/jsx-runtime`.

**Impacte:** el projecte té, sobre el mateix fitxer absent, una porta que crida i una que
diu que tot va bé. La que calla és la perillosa: si demà algú torna a crear el shim amb el
bug del 25/08/2026 (`jsx` delegat a `createElement`, que converteix la `key` en `children`),
`porta:consell` continuarà verda i la llei que existeix per a atrapar-ho no s'executarà.

**Correcció proposada:** la branca `else` no és opcional. Si el fitxer que una llei vigila no
existeix, la llei ha de **fallar tancada** o declarar-se explícitament inaplicable amb un
motiu, mai desaparéixer. Model: `tractor-persistencia.mjs:42-45`, que ja mor si no troba
fonts sota `src/`. I decidir d'una vegada si el shim ha d'existir: si el runtime real és
`preact/jsx-runtime`, cal llevar les tres referències mortes; si ha d'existir, cal
recuperar-lo i seguir-lo amb git.

---

### P0-5 · La cadena de portes no és de fiar, i ho diu ella mateixa

**On:** `tooling/gates/tractor-cadena.mjs` (execució), `tooling/gates/run-portes.mjs:45,73`

`porta:cadena` falla amb 5 problemes. Els concrets:

- **C1** · `tooling/gates/tractor-utilitats-sdp.mjs` és una porta al disc que cap script del
  `package.json` invoca.
- **C4** · `porta:segella`, `porta:matrix` i `porta:adaptadors` estan definides com a script i
  absents de la cadena, sense motiu declarat.
- **C5** · `tooling/gates/build-seo-manifest.mjs` importa `acorn`, un paquet extern, contra la
  doctrina de zero dependències al tooling. I està connectat a `build:seo`, dins de
  `npm run build`.

El cas de `porta:adaptadors` mereix atenció perquè demostra un mecanisme, no només un
símptoma. La porta **sí que s'executa**: `run-portes.mjs:45` la llança per `cmd`/`args`. El que
està mal és l'etiqueta:

```js
{ nom: 'Porta Frontissa', cmd: 'node', args: ['tooling/gates/tractor-adaptadors.mjs'],
  script: 'porta:frontissa' },     // ← no existeix cap `porta:frontissa` al package.json
```

`tractor-cadena.mjs` es fia del camp `script` per a saber què hi ha a la cadena. Com que
`porta:frontissa` no existeix, l'auditor de la cadena conclou que `porta:adaptadors` està
fora quan no ho està. El mateix passa amb `porta:utilitatssdp` a `run-portes.mjs:73`.

**Impacte:** el metacontrol que garanteix que la cadena és completa està donant un mapa que
no correspon al territori. Això és pitjor que no tindre'l, perquè justifica confiança.

**Correcció proposada:** corregir els dos noms (`porta:adaptadors`, i donar d'alta
`porta:utilitats-sdp` al `package.json`), i afegir a `tractor-cadena.mjs` una llei nova: tot
camp `script` d'un pas ha d'existir a `package.json`. És una comprovació de tres línies que
hauria evitat aquesta deriva.

---

## P1 · Alt

### P1-1 · «Compartir» de la `UniversalCard` no avisa mai, i la prova ja ho sap

**On:** `src/components/PedraSeca/organismes/UniversalCard.jsx:55` i `:258`

```js
async function compartix(titol, url, showToast) { ... }                          // 55
const handleShare = onShare || (() => compartix(title, urlPerCompartir(safeMainHref)));  // 258
```

`compartix` rep tres paràmetres; la crida en passa dos. Dins, `showToast` és `undefined`, i
**les dues branques** el criden: la d'èxit (línia 67) i la de fallada (línia 69). Resultat:
`TypeError: showToast is not a function` com a rebuig de promesa no capturat, en tots dos
camins.

Verificat executant la bateria: `UniversalCard.test.jsx > compartir sense porta-retalls avisa
amb l'enllaç en lloc de petar` falla, i el rebuig no capturat apareix al registre de vitest.

**Impacte:** afecta l'organisme més usat del sistema de disseny. En qualsevol navegador sense
`navigator.share` (l'escriptori habitual), l'enllaç es copia i **la persona no ho sap mai**.
En context insegur —una incrustació de WordPress sobre `http://`, que és l'escenari de
desplegament del plugin— `navigator.clipboard` tampoc existeix i no passa absolutament res.

**Correcció proposada:** passar el `showToast` del context (`useToast()`, com fan els altres
14 punts del projecte) en lloc de rebre'l per paràmetre. El patró per paràmetre és el que ha
permés l'omissió: cap eina detecta una funció que en rep tres i se'n criden dos.

---

### P1-2 · La taula de continguts és invisible per a lectors de pantalla

**On:** `src/components/universal/PageFrame.jsx:75-76`

```jsx
<div className="toc-overlay" onClick={onClose} aria-hidden="true">
  <aside className="toc-drawer" onClick={(e) => e.stopPropagation()}>
    <h2>Taula de continguts</h2>
    <button className="toc-close-btn" onClick={onClose} aria-label="Tancar taula">
```

`aria-hidden="true"` està al **contenidor**, i s'hereta a tota la descendència. El calaix
sencer —el títol, el botó de tancar, i tota la navegació— queda amagat de l'arbre
d'accessibilitat. Es pinta amb `createPortal`, és a dir, com un modal.

A més, en el bloc no hi ha cap gestió de `Escape` ni trampa de focus: l'únic `useEffect` del
component (línia 11) és per a l'`IntersectionObserver` dels encapçalaments.

**Impacte:** per a una persona que navega amb lector de pantalla, obrir la taula de
continguts obri un modal que no existeix, del qual no es pot eixir amb teclat i dins del qual
el focus continua vagant pel contingut de darrere. En un projecte que posa l'accessibilitat
extrema al centre de la seua identitat, aquest és el defecte que més contradiu el que diem
que som.

**Correcció proposada:** llevar `aria-hidden` del contenidor; si el que es vol és amagar el
vel, posar-lo en un germà (`::before` o un `<div>` buit). Afegir `role="dialog"`
`aria-modal="true"` `aria-labelledby` al `<aside>`, un gestor de `Escape` i retorn del focus a
l'element que va obrir el calaix. Val la pena considerar una porta nova: `aria-hidden` mai
damunt d'un node amb descendència interactiva. Els altres dos usos del projecte
(`estats.jsx:34`, `EspecimenShell.jsx:10`) són correctes i passarien.

---

### P1-3 · Una llista negra de noms esborra carpetes reals de les persones

**On:** `src/data/supabase/runtime.js:99-101`

```js
const ghostIds = new Set(['f-root','f-general','f-articles','f-histories','f-prompts','f-captures','f-event','f-mapa']);
const ghostNames = new Set(['articles','històries del poble','captures de recerca','receptes']);
const folders = remotes.filter((f) => !ghostIds.has(f.id) && !ghostNames.has((f.name||'').trim().toLowerCase()));
```

Això s'executa a `mapContentRowsToData`, sobre les dades **que tornen del servidor**. Qualsevol
carpeta que una persona del poble cree i anomene «Receptes», «Articles», «Històries del poble»
o «Captures de recerca» —comparació en minúscules, sense accents diferenciats— desapareix de
la seua pantalla mentre continua existint a la base de dades.

«Receptes» és un nom que algú de la Torre de les Maçanes escriurà el primer dia.

**Impacte:** pèrdua de dades aparent, sense missatge, sense manera de recuperar-la des de la
interfície. La persona veu que ha creat una carpeta i que ha desaparegut.

**Correcció proposada:** els fantasmes s'han d'identificar per `id` (que el projecte controla),
mai per nom escrit per una persona. Si hi ha llavors antigues sense `id` estable, cal marcar-les
amb una bandera al `payload` i filtrar per la bandera. La llista `ghostIds` ja fa això bé; la
`ghostNames` és la que s'ha de retirar.

---

### P1-4 · La llei anti-`USING (true)` està exempta justament per a la taula de persones

**On:** `tooling/gates/tractor-rls.mjs:78` i `:173`

```js
/* R3 · exempcions declarades. Contingut públic per disseny, no dades de persones. */
const R3_EXEMPTES = new Set(['towns', 'app_content', 'profiles']);     // 78
```

El comentari diu que l'exempció és per a coses que **no** són dades de persones, i inclou
`profiles`, que és exactament la taula de persones.

Que això no és teòric ho demostra la història del propi repositori:

```sql
-- supabase/migrations/260911_0600_perfil_avatar_i_permisos.sql:26-28
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated, anon
  using (true);
```

Tots els perfils llegibles per `anon`. Va caldre una migració de correcció
(`260912_1500_correccio_privacitat_perfils.sql`, el nom de la qual ja és la confessió) per a
tancar-ho. **La porta R3 era verda abans, durant i després.** S'ha executat ara i continua
dient `✅ [RLS] Zero fantasmes i zero forats`.

**Impacte:** la porta que existix per a atrapar una fuita de privacitat està cega precisament
on la fuita ja va passar una vegada. No protegix contra la regressió.

**Correcció proposada:** llevar `profiles` de `R3_EXEMPTES`. Si alguna política concreta sobre
`profiles` necessita `USING (true)` legítimament, l'exempció ha de ser **per política, amb
motiu escrit**, no per taula sencera. Les altres dues (`towns`, `app_content`) sí que encaixen
amb el motiu declarat.

---

### P1-5 · La llei R5 (GRANT-ORFE) és un bucle buit

**On:** `tooling/gates/tractor-rls.mjs:226-230`

```js
for (const g of grants) {
  if (!policyTables.has(g.table)) {
    // Only flag if we have tables matching, might be false positive in migrations
  }
}
```

El cos és un comentari. La llei R5 es recull (`:194-197` omple `grants`), s'anuncia a la
capçalera del fitxer i **no comprova res**.

**Impacte:** R5 existix precisament per a atrapar el patró de `260911_0600:15-17`, on es fa
`grant select on table public.profiles to authenticated, anon` sense que hi haja una política
que el limite. En aquell cas concret la RLS va salvar la situació i el `grant` es va revocar
després (`260912_1500:12`), però va ser per sort, no per la porta.

**Correcció proposada:** implementar-la o llevar-la. Un bucle buit amb un comentari
d'indecisió és pitjor que l'absència, perquè la capçalera del fitxer continua prometent la
llei. Implementació mínima: per a cada `grant insert|update|delete` sobre una taula, exigir
almenys una política de la mateixa operació sobre la mateixa taula en el conjunt de migracions.

---

### P1-6 · La porta d'innerHTML té dos forats: la sintaxi i l'abast

**On:** `tooling/gates/tractor-innerhtml.mjs:11,14`

```js
const ARREL = 'src';                                                            // 11
const PATRO = /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([^}]+)\}\}/g;    // 14
```

**Forat 1 — la sintaxi.** `[^}]+` no pot travessar una clau de tancament. Una expressió que en
continga —`__html: fn({ mode: 'x' })`, o un ternari amb un objecte— **no encaixa amb el patró**
i per tant no es revisa. No apareix com a infracció: simplement no existix per a la porta.
També queden fora `dangerouslySetInnerHTML={variable}` (sense objecte literal),
`element.innerHTML =`, `insertAdjacentHTML` i `outerHTML`.

**Forat 2 — l'abast.** Només recorre `src/`. I hi ha un punt d'injecció viu fora:

```js
// public/components/sp-identity-components.js
export function setIdentity(patch) { Object.assign(SP_IDENTITY, patch); ... }   // 22
...
<span class="nom">${SP_IDENTITY.displayName}</span>                             // 194
<span class="rol">${SP_IDENTITY.role}</span>                                     // 195
```

Interpolació sense escapar dins de `shadowRoot.innerHTML` (`:43`, `:145`), des d'un objecte
mutable per una API exportada. `public/` es copia literalment a `dist/`, o siga que el fitxer
es publica.

**Atenuant honest:** cap fitxer del projecte importa `sp-identity-components.js`. És codi mort
publicat. Això rebaixa l'explotabilitat d'avui a pràcticament zero, però no la de demà, i el
fitxer conté a més el nom i la foto d'una persona real com a identitat global per defecte
(`:9-14`), cosa que no hauria d'estar en un component compartit.

**Correcció proposada:** ampliar `PATRO` per a acceptar expressions equilibrades (o, més
robust, fer la comprovació amb `@babel/parser`, que ja és dependència de desenvolupament i
que `tractor-tdz.mjs` ja usa), afegir els sinks de DOM directe, i estendre `ARREL` a `public/`.
I esborrar `sp-identity-components.js`, que és brossa publicada.

---

## P2 · Mitjà

### P2-1 · Quatre còpies de la llista blanca d'orígens, i dues són cegues a l'esquema

La mateixa decisió de seguretat —quins orígens són nostres— està escrita quatre vegades:

| On | Forma | Comprova l'esquema? |
| --- | --- | --- |
| `src/config/runtimePolicy.js:34-39` | llista `parentOrigins` | — (**no la llig ningú**) |
| `src/host.js:336-339` | `endsWith` sobre `event.origin` | ❌ no |
| `src/data/oauthRelay.js:293-297` | `endsWith` sobre `potentialOrigin` | ❌ no |
| `public/auth/callback.html:92-98` | `endsWith` sobre `u.hostname` | ✅ sí (línia 92) |

Les dues del mig fan `event.origin.endsWith('.socdepoble.org')` sobre l'origen **sencer**, que
inclou l'esquema. `http://qualsevol.socdepoble.org` també acaba en `.socdepoble.org` i passa.
A `oauthRelay.js:294` això decideix el `targetOrigin` d'un `postMessage` que porta el codi
d'autorització.

I `parentOrigins`, que és el punt on un amfitrió podria configurar això de manera neta, **no
té cap consumidor**: només apareix a la seua pròpia definició i a un JSDoc (`host.js:112`).
`configura({ auth: { parentOrigins: [...] } })` no fa absolutament res.

**A favor del projecte:** `callback.html:92` sí que comprova l'esquema. És l'únic dels tres
que ho fa, i és el més exposat. La doctrina és correcta; el que falla és que està copiada.

**Correcció proposada:** una sola funció `esOrigenPermes(origen)` exportada des de
`runtimePolicy.js`, alimentada per `parentOrigins`, que comprove esquema **i** domini, i que
`host.js` i `oauthRelay.js` importen. `callback.html` no pot importar-la (és estàtic i
independent per disseny); la solució per a ell és que `tractor-frontera-auth.mjs` compare les
dues llistes i falle si divergeixen.

### P2-2 · La política immutable es pot congelar abans que l'amfitrió parle

`getRuntimePolicy()` (`runtimePolicy.js:49-52`) es configura a si mateix amb els valors per
defecte si encara no hi ha política. `setRuntimePolicy` (`:10-12`) llança si ja n'hi ha una.
I `host.js:128-131` embolica la crida en un `try/catch` que només fa `console.error`.

Composició: si qualsevol camí crida `getRuntimePolicy()` abans que l'amfitrió cride
`configura({ auth })` —per exemple `identitat.js:247` en una adopció de sessió primerenca—
la política queda congelada amb els valors per defecte, la crida de l'amfitrió llança, el
`catch` se la menja, i **`configura()` continua i injecta el backend igualment**. L'amfitrió
acaba amb el seu backend i sense la seua política d'autenticació, sense cap error visible.

**Correcció proposada:** que `getRuntimePolicy()` no cree res. Si no hi ha política, ha de
tornar una política buida no congelada o llançar. Congelar per lectura és el que fa possible
la cursa. I el `catch` de `host.js:128` ha de propagar: una política d'autenticació rebutjada
no és un avís.

### P2-3 · Les fusions i els pedaços passen per damunt de totes les portes

`.husky/pre-merge-commit` i `.husky/pre-applypatch` existeixen, porten l'etiqueta
`SDP-REFLEX-HOOK:v2` i el comentari `# pre-commit`, i **no executen res**: són tres línies de
comentari.

Git no executa `pre-commit` en un commit de fusió; executa `pre-merge-commit`. O siga que tot
`git merge` que genere un commit entra sense passar per `npm run gate`, ni pel linter, ni per
les proves. El mateix amb `git am`.

**Correcció proposada:** o els dos ganxos criden la cadena com fa `pre-commit`, o s'esborren.
Un ganxo buit amb l'etiqueta del sistema damunt fa creure que el punt està cobert.

### P2-4 · El linter i les proves s'executen dues i tres vegades per commit

`run-portes.mjs:32` executa `npm run lint` i `:79` executa `npm run test -- --run`. Després,
`.husky/pre-commit:12` torna a executar el linter i `:18` torna a executar les proves. I
`.github/workflows/wiki-integrity.yml:38-44` executa `npm run gate`, després `npm run lint`,
després `npm run test`: tres vegades el linter, dues les proves.

Sumat als 48 passos seqüencials i a l'aturada en la primera fallada (`run-portes.mjs:103`),
el bucle de retroacció és: una porta roja per volta, amb el cost complet de la bateria cada
vegada. Amb 14 portes en roig, són 14 voltes.

**Correcció proposada:** llevar les repeticions del ganxo i de la CI. I considerar un mode
`--continua` a `run-portes.mjs` que execute la cadena sencera i resumisca totes les fallades
alhora; per a eixir d'un deute de 14 portes això és la diferència entre una sessió i catorze.

### P2-5 · Cada visita del poble passa per Google abans de veure res

`index.html:12` carrega la tipografia des de `fonts.googleapis.com`. El projecte **ja
distribueix la mateixa tipografia localment**: `embed.jsx:33` estableix
`fonts-href="/fonts/noto-sans.css"` i `public/fonts/` existix.

O siga: el camí incrustat (WordPress) usa la font local i el camí web (socdepoble.org) la
demana a Google, enviant-li l'adreça IP de cada visitant del poble en cada càrrega. Per a un
projecte de sobirania i hiperproximitat, amb usuàries a la Unió Europea, és una contradicció
amb conseqüències legals conegudes.

**Correcció proposada:** llevar les línies 10-12 de `index.html` i servir `/fonts/noto-sans.css`
també al build web. És una línia menys i una dependència externa menys.

### P2-6 · Les capçaleres de producció només porten `frame-ancestors`

`vercel.json:7-8` estableix una sola directiva CSP, i hi inclou `http://localhost:*` **en
producció**. No hi ha `Strict-Transport-Security`, ni `X-Content-Type-Options: nosniff`, ni
`Referrer-Policy`.

La CSP forta viu a `index.html:8` com a `<meta http-equiv>`, cosa que funciona per a
`script-src` però que arriba tard (després del *parsing* inicial) i que no pot expressar
`frame-ancestors`. El `connect-src 'self' https: wss:` tampoc acota res: permet qualsevol
destí HTTPS.

**Correcció proposada:** moure la CSP completa a `vercel.json`, acotar `connect-src` al domini
de Supabase i al relé, llevar `http://localhost:*` de la capçalera de producció, i afegir
HSTS, `nosniff` i `Referrer-Policy: strict-origin-when-cross-origin`.

### P2-7 · La llista d'orígens de mitjans creix sola i no baixa mai

`src/utils/sanitize.js:21-29`:

```js
export function permetOrigenMitjans(url) {
  const origen = new URL(url).origin;
  if (!origensMitjans.includes(origen)) origensMitjans.push(origen);
}
```

Es crida des de `runtime.js:30`, dins de `getResolvedConfig`, que s'executa en **cada** petició
i en cada resolució de configuració. Un `supabaseUrl` vingut de l'amfitrió amplia la llista
blanca d'imatges del sanejador per a la resta de la vida de la pàgina, i mai es retira.

És una llista de seguretat que només creix, alimentada per configuració externa, en un array
de mòdul compartit. També creix sense límit si es criden diverses configuracions.

**Correcció proposada:** derivar els orígens permesos de la política immutable
(`runtimePolicy.js`) en el moment del segellat, i fer `origensMitjans` de només lectura a
partir d'aquell punt. És el mateix patró que ja s'aplica al backend a `backendPort.js:33-36`.

### P2-8 · Rendiment: 472 KB per a obrir una nota

Mesures del `dist/` present a l'arbre:

| Artefacte | Mida |
| --- | --- |
| `NotesSection-*.js` | **472 KB** |
| `index-*.js` (entrada) | 340 KB |
| `index-*.css` (entrada) | **136 KB** |
| `agentsSeed-*.js` | 20 KB |

El tros de Notes és 1,4 vegades el bundle principal sencer: és TipTap complet. El CSS
d'entrada són 136 KB que es descarreguen abans del primer pintat. I `agentsSeed` són 20 KB de
dades de demostració publicades.

Per a una xarxa pensada per a un poble de muntanya amb cobertura mòbil irregular, aquestes
xifres són el principal deute de rendiment del projecte.

**Correcció proposada:** carregar TipTap només quan s'entra en mode edició (ara arriba amb la
secció sencera), dividir el CSS per ruta, i excloure els *seeds* del build de producció darrere
d'una comprovació de `dataMode`. `APP_SEED` a més entra per importació estàtica a
`src/data/supabase/runtime.js:1`, o siga que viatja sempre.

### P2-9 · Dependències sense sostre i plugin sense font

`package.json:96-97` declara `"react": ">=18.0.0"` i `"react-dom": ">=18.0.0"`. Sense límit
superior, un `npm install` sense `package-lock.json` pot resoldre a qualsevol versió futura.
En un projecte que fa àlies d'ambdós a `preact/compat`, la resolució importa.

I `git ls-files wordpress-plugin` no torna **cap** fitxer: el destí de `build:wp`
(`vite.standalone.config.js:39`) només existix com a artefacte generat. No hi ha capçalera de
plugin de WordPress, ni PHP, ni res que es puga revisar o versionar.

---

## P3 · Baix · higiene i documentació que menteix

En un projecte on la doctrina és «el codi és pur, no s'hi permet la brossa», els comentaris
que menteixen són deute de primera classe: dirigeixen les decisions futures.

| Id | On | Què |
| --- | --- | --- |
| P3-1 | `src/config/storage.js:56-57` | Un ⚠ diu que `tractor-persistencia.mjs (L2)` «només vigila `localStorage.`» i demana ampliar-lo. **Ja el vigila**: `tractor-persistencia.mjs:63` comprova `(localStorage\|sessionStorage)`. L'avís és caducat i demana treball fet. |
| P3-2 | `public/auth/callback.html:29-32` | El bloc de doctrina prohibeix en majúscules comparar amb `startsWith`, `includes` o regex, i anomena una constant `ORÍGENS_PERMESOS`. El codi de sota usa `endsWith` i la constant **no existix**. |
| P3-3 | `src/embed.jsx:2` | La capçalera del fitxer diu «main.jsx — Punt d'entrada…». És `embed.jsx`. |
| P3-4 | `src/utils/sanitize.js:55-57` | `if (node.getAttribute('target') === '_blank') node.setAttribute('target','_blank')` — assigna el valor que acaba de llegir. Branca inert. |
| P3-5 | `src/data/identitat.js:73-74` | `crypto.randomUUID` només existix en context segur. Sobre `http://` (la incrustació de WordPress) cau al `pseudoRandom()` amb `Math.random()`, i com que el resultat mai satisfà `RE_UUID` (línia 72), **es regenera una identitat de convidat en cada crida**. `getDefaultUserId()` es crida sovint. |
| P3-6 | `src/data/oauthRelay.js:312,314` | El codi d'autorització passa per `localStorage` (`setVal`), just el que la doctrina de `storage.js:44-51` prohibeix per a material d'autenticació. Ací és **forçat**: l'esdeveniment `storage` entre finestres no funciona amb `sessionStorage`. No és un error, però és una excepció no documentada a una regla escrita en majúscules. |
| P3-7 | `eslint.config.js:32-33` | `no-unused-vars` i `react-hooks/exhaustive-deps` són `warn`. El resultat són **352 avisos** que no bloquegen res. `exhaustive-deps` és el que atrapa les clausures caducades de React. |
| P3-8 | `public/**/.DS_Store` | Vite copia `public/` literal. Hi ha `.DS_Store` a `public/`, `public/assets/` i `public/assets/system/ui/`, i apareixen a `dist/assets/.DS_Store` (8 KB) i `wordpress-plugin/dist/.DS_Store`. Es publiquen. |
| P3-9 | `.gitignore` | `.wwebjs_cache/` no hi és, i dos fitxers HTML d'eixa memòria cau estan seguits per git. |
| P3-10 | `tooling/gates/saneja-callback.mjs` | Connectat com a `prebuild`, fora de la cadena de portes. `npm run gate` no el veu; `npm run build:web` directe tampoc. |

---

# Refutacions

Aplicant el protocol de dues fases: el que semblava defecte i **no ho és**. Es documenta
perquè no torne a costar temps a la pròxima auditoria.

| Id | Sospita | Veredicte |
| --- | --- | --- |
| R-1 | La capa efímera (`sessionStorage`) està fora de la porta de persistència, com diu `storage.js:56` | **Refutada.** `tractor-persistencia.mjs:63` ja la vigila. L'avís al codi és el caducat (P3-1). |
| R-2 | `oauthRelay.js:201` rebutja els missatges de l'emergent en producció, perquè compara amb l'origen del relé i l'emergent torna a l'origen de l'app | **Refutada.** Qui fa el `postMessage` és `callback.html:169`, que s'executa **a** l'origen del relé. La comprovació és correcta. El camí 2 (via `storage`) també quadra: hi escriu `gestionaTornada` ja a l'origen de l'app. |
| R-3 | `RequireAuth.jsx:39` genera `??` en concatenar `search` | **Refutada.** `RouterContext.jsx:99` torna `searchParams.toString()`, sense `?` inicial. |
| R-4 | El paràmetre `tornar` permet una redirecció oberta | **Refutada.** `OnboardingSection.jsx:23` exigeix `startsWith('/') && !startsWith('//')`, i `navigate` és del router intern. |
| R-5 | Hi ha `dangerouslySetInnerHTML` sense sanejar | **Refutada.** Els quatre de `src/` passen per `sanitizeHtml`. El problema és l'abast de la porta (P1-6), no el codi actual. |
| R-6 | La guarda anti-recursió de `run-portes.mjs:91` no arriba als fills | **Refutada.** `spawnSync` sense `env` hereta `process.env`, que ja porta `SDP_DINS_DE_PORTA=1`. |
| R-7 | `callback.html` és cec a l'esquema com `host.js` i `oauthRelay.js` | **Refutada.** La línia 92 comprova el protocol. És l'únic dels tres que ho fa bé. |
| R-8 | El `grant select ... to anon` sobre `profiles` continua viu | **Refutada.** `260912_1500:12` el revoca. |
| R-9 | La porta `frontmatter` està en roig | **Refutada.** Verd contra el commit pristí. El roig el causava la petorreta d'encàrrec mateixa, sense seguir. |
| R-10 | Hi ha taules sense RLS | **Refutada.** Les 15 taules de `public` tenen `enable row level security`. L'única sense és l'esquema `private`, revocat sencer a `260908_0000:3`. |

---

# Pla d'acció proposat

L'ordre no és per gravetat sinó per **desbloqueig**: primer tornar la maquinària fiable, perquè
si no la resta es corregeix a cegues.

### Acte 1 · Tornar la vista a les portes (mig dia)

1. **P0-1** · Traure el `throw` del `try` a `publicCredentials.js`. Tres línies. És la
   correcció amb més retorn de tot l'informe.
2. **P0-4** · Decidir el destí de `src/shims/jsx-runtime.js` i tancar la LLEI 10: cap llei
   pot desaparéixer per absència del seu objecte.
3. **P0-5** · Corregir els dos camps `script` de `run-portes.mjs` i afegir a
   `tractor-cadena.mjs` la llei «tot `script` declarat ha d'existir al `package.json`».
4. **P1-4 / P1-5** · Llevar `profiles` de `R3_EXEMPTES` i implementar o esborrar R5.

Criteri d'eixida: `porta:cadena` en verd i la cadena tornant el mateix mapa que el territori.

### Acte 2 · Tancar la frontera d'identitat (un dia)

5. **P0-3** · `callback.html` no ha d'admetre `localhost` quan no s'està servint des de
   `localhost`, i `saneja-callback.mjs` ha de buscar el token, no la grafia. Entrar-la a la
   cadena de portes.
6. **P0-2** · Corregir la forma de la crida a `setRuntimePolicy` a `main.jsx` i fer que la
   funció rebutge claus fora de contracte.
7. **P2-1 / P2-2** · Una sola funció d'orígens permesos, amb comprovació d'esquema, consumida
   per `host.js` i `oauthRelay.js` i comparada amb `callback.html` per
   `tractor-frontera-auth.mjs`. `getRuntimePolicy()` deixa de congelar per lectura.

Criteri d'eixida: una prova que demostre que `sdp_origin=http://localhost:3000` és rebutjat
pel relé en mode producció.

### Acte 3 · El que veuen les persones (un dia)

8. **P1-1** · `compartix` amb `useToast()`. La prova ja existix i ja falla: la correcció es
   valida sola.
9. **P1-2** · Llevar `aria-hidden` del contenidor de `PageFrame`, afegir `role="dialog"`,
   `Escape` i trampa de focus.
10. **P1-3** · Retirar `ghostNames`. Filtrar per `id`, mai pel nom que escriu una persona.
11. **P1-6** · Ampliar la porta d'innerHTML (sintaxi i abast) i esborrar
    `public/components/sp-identity-components.js`.

### Acte 4 · Deute estructural (continu)

12. Les 14 portes en roig, amb el mode `--continua` de P2-4 perquè es puguen atacar en bloc.
13. Rendiment (P2-8): TipTap diferit, CSS per ruta, *seeds* fora de producció.
14. Capçaleres de producció (P2-6) i tipografia local (P2-5).
15. Higiene P3, en el mateix commit que toque cada fitxer.

---

## Incògnites i supòsits

- **[SUPÒSIT]** `*.sollutia.cat` i `*.sollutia.com` apareixen a les llistes blanques de
  `postMessage` i a `frame-ancestors`. Si Sollutia assigna subdominis per client —cosa
  habitual en una SaaS—, cada client seria un origen capaç de rebre codis d'autorització i
  d'emmarcar l'aplicació. No hi ha res a l'arbre que diga com s'assignen. **Cal confirmar-ho
  amb Sollutia**; si és multiinquilí, P2-1 puja a P0.
- **[SUPÒSIT]** Es dedueix de l'existència de `vercel.json` que el desplegament web és Vercel
  i que la comanda de build és `npm run build` (i per tant que `prebuild` s'executa). Si el
  desplegament crida `vite build` directament, `saneja-callback.mjs` no s'executa mai.
- **Sense verificar en navegador.** Tota l'auditoria és estàtica més execució de portes i
  proves en Node/jsdom. Els camins d'OAuth amb finestra emergent, COOP i `storage` entre
  finestres no s'han provat contra un navegador real.
- **No auditat per falta d'abast:** `bot/`, `.agents/`, `tools/`, `tooling/brain/` més enllà
  de les portes que participen a la cadena, i el contingut de la Wiki.
- **Pendent:** no s'ha executat `npm run build` (escriu a `dist/` i hauria trencat la
  contenció). Les mides de P2-8 són del `dist/` present a l'arbre, del 19-09 15:18.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura. 42 portes i
      la bateria de proves executades; les xifres de portes roges són mesurades contra una
      còpia pristina del commit, no estimades.
- [x] He citat correctament la ruta i les línies del codi original, amb el tall fixat a
      `2fc1e979` i totes les citacions reverificades en una segona passada.
- [x] Cap nom de fitxer, funció o variable inventat. Les absències (`src/shims/jsx-runtime.js`,
      `ORÍGENS_PERMESOS`, `porta:frontissa`) es declaren com a absències, i és la troballa.
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites. S'hi afig una taula de
      Refutacions amb deu sospites descartades.
- [x] El document passa `tractor-frontmatter.mjs --estricte`: executat, i **cap** de les
      infraccions F1–F8 s'atribuïx a aquest fitxer. La porta ix amb 1 pel deute global
      preexistent de `.agents/**` (F1 39, F2 94, F7 43 al commit auditat), que aquest informe
      no toca ni augmenta. Igual amb `tractor-nomenclatura.mjs`: N1 continua en 20, el mateix
      valor que abans d'escriure'l.
- [x] Contenció respectada: zero línies de codi tocades. L'únic fitxer escrit és aquest.
