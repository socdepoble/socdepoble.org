---
type: informe
status: esborrany
description: 'Auditoria adversarial nocturna de tancament de Gemini CLI (30-10-2026 02:55 CET) per al Cicle 2 del Gauntlet.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:bba787ae-bbcd-4145-866e-ff48199cf32f
---
# Auditoria Adversarial de Tancament — Gemini CLI (`261030_0255`)

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:bba787ae-bbcd-4145-866e-ff48199cf32f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T01:56:22.000Z |
| Modificació | 2026-10-30T21:31:24.000Z |
| Propietari | Gemini CLI |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini (variant no declarada al document original) |
| Tokens consumits | No declarat al document original |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-30T01:56:22.000Z: document original de Gemini CLI, fora del circuit de rebuts.
- 2026-10-30T21:31:24.000Z: adoptat al circuit canònic per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4: «Renova qualsevol rebut caducat o pendent»). El text original és íntegre i sense canvis dins de «Troballes»; només s'hi han afegit les seccions canòniques i els encapçalaments han baixat un nivell. Còpia de l'original fora del repositori.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

- **Data i hora:** 2026-10-30 02:55 CET
- **Mode:** 100% Read-Only
- **Destinatari d'execució:** Claude Opus 5.5 (`scope: code`, Cicle 2 del Gauntlet + Guàrdia Nocturna)

---

### 1. Llista prioritzada de troballes i canvis quirúrgics

#### 🔴 CRÍTIC

##### 1. `[CRÍTIC]` Test de conformitat de `/page/fediversity` trencat per desfasament d’estat d’`exportaMunicipiOpenData.js`
- **On:** `src/sections/text/pageContent.js:587` vs. `src/sections/text/pageContent.fediversity.test.js:235-244`
- **Problema:** La prova a `pageContent.fediversity.test.js:239` comprova amb `fs.existsSync` si `src/data/exportaMunicipiOpenData.js` existix a disc; com que ja s'ha creat a `P1-23`, el test exigeix que `PAGE_COPY.fediversity` diga `: en curs` i prohibix `: no existix`. Però `pageContent.js:587` encara diu `Exportació Open Data per municipi, un arxiu estructurat i estàndard amb totes les dades d'un poble: no existix. El disseny està en curs.`
- **Canvi recomanat:**
  - En `src/sections/text/pageContent.js:587`, substituir `: no existix. El disseny està en curs.` per `: en curs. El generador i el validador de l'arxiu ja són al repositori, pendents d'integrar a la interfície.`
  - Verificar també les línies `pageContent.fediversity.test.js:273-280`.

---

#### 🟠 ALT

##### 2. `[ALT]` Desquadrament del comptador de no llegits a `FakeChatOnboarding.jsx` (`2` al marcador vs. `3` converses amb pastilla blava)
- **On:** `src/sections/xat/components/FakeChatOnboarding.jsx:95,118,178,281`
- **Estat:** `sumaNoLlegits(fakeThreads)` ja aplicat a la línia 282.
- **Millora opcional:** Mantenir un `useState` amb els `id` de mostra ja oberts (`llegitsMostra`) per posar `noLlegits: llegitsMostra.has(id) ? 0 : 1` quan l’usuari obri el fil.

##### 3. `[ALT]` Absència de Gallec (`GL`) i Basc (`EU`), falta de fallback per a `*->eus`/`*->deu` a `traductorLliure.js`, i `target: 'de'` hardcoded al fallback de `traductor-iaia.mjs` / `traduccio.php`
- **On:** `src/data/traductor.js:26-31`, `src/data/traductorLliure.js:48,161-162`, `tooling/vite/traductor-iaia.mjs:35,42,254` i `wordpress-plugin/includes/traduccio.php:98,255,391`
- **Problema:**
  1. `LLENGUES_TRADUCCIO` a `src/data/traductor.js:26-31` omet el Gallec (`GL`) i el Basc (`EU`).
  2. En `beta.apertium.org`, el parell català→gallec (`cat|glg`) **existix nativament**, però no és a `PARELLS_APERTIUM` (`traductorLliure.js:48`, `traductor-iaia.mjs:42`, `traduccio.php:98`).
  3. En canvi, el basc (`eus`) i l’alemany (`deu`) **no tenen parell d’eixida des del català a Apertium** (`*->eus` i `cat|deu` no existixen). Ara mateix `traductorLliure.js:161-162` llança `CODI_TRADUCCIO.NO_DISPONIBLE` sense caure a cap segon motor gratuït.
  4. A `tooling/vite/traductor-iaia.mjs:254` i `wordpress-plugin/includes/traduccio.php:255`, la funció `lliure(textos, desti)` ignora `desti` i envia `target: 'de'` hardcoded!
- **Canvi recomanat:**
  - Afegir `GL` (`gl`, `'Gallec'`, `'al gallec'`) i `EU` (`eu`, `'Basc'`, `'al basc'`) a `src/data/traductor.js:26-31`, i `GL: 'cat|glg'` a `PARELLS_APERTIUM` en els 3 fitxers.
  - En `traductor-iaia.mjs:254` i `traduccio.php:255`, passar `target: CODIS_LLIURE[desti]` (`{ ES: 'es', 'EN-GB': 'en', FR: 'fr', DE: 'de', GL: 'gl', EU: 'eu' }`) en lloc de `'de'`.
  - En `src/data/traductorLliure.js:161`, quan `desti` no tinga parell a `PARELLS_APERTIUM` (`EU`, `DE`) o quan els dos extrems d’Apertium tornen `xarxa: true`, caure netament a un segon extrem gratuït sense clau amb CORS `*` (Lingva `https://lingva.ml/api/v1/ca/${lang}/${encodeURIComponent(q)}` → `dades.translation`, amb fallback a MyMemory `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=ca|${lang}` → `dades.responseData.translatedText`).

##### 4. `[ALT]` Clau simètrica d’adjunt (`xifrat.a.k`) sense posar a zero si falla l’enviament i descàrregues duplicades en vol a `xifratXatPipeline.js`
- **On:** `src/data/xifratXatPipeline.js:318-334,337-374`
- **Problema:**
  1. A `publicaAdjunt` (línies `318-329`), `bytes.fill(0)` neteja el fitxer en clar, però si `prepara(...)` (línia `323`) o `impl.publicaAdjuntXifratXat(...)` (línia `326`) llancen un error, els 32 bytes de la clau `FK` (`xifrat.a.k`) queden vius en RAM sense posar-se a zero.
  2. A `urlAdjunt` (línies `354-373`), si dos components demanen alhora el mateix `id` abans que la primera descàrrega acabe, no hi ha deduplicació de promesa en vol per `clauCau`: es baixa i es desxifra dues vegades en RAM (fins a `2 × 20 MB`) i es creen dues URLs `blob:`.
- **Canvi recomanat:**
  - En `xifratXatPipeline.js:327-329`, dins del `catch` de `publicaAdjunt` (i si `prepara` falla), fer `xifrat?.a?.k?.fill?.(0)` abans de rellançar l’error.
  - En `urlAdjunt` (línia `354`), guardar un `Map` `urlsEnVol` per `clauCau` dins del motor perquè dues crides concurrents al mateix adjunt compartisquen la mateixa descàrrega i desxifrat abans de cridar `lliura(url)`.

---

#### 🟡 MITJÀ

##### 5. `[MITJÀ]` `gestionaEscapeDelDetall` deixa un listener `keydown` penjat a `window` si un fill fa `stopPropagation()`, i `esCampEditable` bloqueja fletxes sobre `<input type="checkbox|radio|button">`
- **On:** `src/components/universal/workspace/navegacioTeclat.js:116-123,378-394`
- **Canvi recomanat:**
  - En `navegacioTeclat.js:118`, usar `element.matches('input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="reset"]), textarea, select')`.
  - En `navegacioTeclat.js:392`, afegir `queueMicrotask(() => finestra.removeEventListener('keydown', torna));` just després d’`addEventListener` perquè s’autonetege al final del mateix tic d’esdeveniment si no ha arribat a `window`.

##### 6. `[MITJÀ]` `ArbreCarpetesLocals.jsx` i `TaulaArxiusLocals.jsx` no tenen navegació per fletxes (`IDEA-58`)
- **On:** `src/sections/multimedia/ArbreCarpetesLocals.jsx:101-120` i `src/sections/multimedia/TaulaArxiusLocals.jsx:31-53`
- **Canvi recomanat:**
  - En `TaulaArxiusLocals.jsx:31`, afegir `data-graella-teclat="" onKeyDown={gestionaTeclaGraella}` al `<tbody>`.
  - En `ArbreCarpetesLocals.jsx:101`, afegir un manejador `onKeyDown` sobre el `<nav>` que moga el focus amb `destiDeLlista` entre els botons `.sdp-arxiu-local__carpeta` i plegue/desplegue amb `ArrowLeft`/`ArrowRight`.

##### 7. `[MITJÀ]` `agrupaComunitats` a `missatges.js` suma els `noLlegits` dels canals/grups silenciats o arxivats
- **On:** `src/sections/xat/missatges.js:243-245,281`
- **Canvi recomanat:**
  - En `src/sections/xat/missatges.js:281`, substituir el `fills.reduce(...)` per `const noLlegits = sumaNoLlegits(fills);`.

##### 8. `[MITJÀ]` Divergència de WebFinger a Nginx (`genera-federacio.mjs` i `flake.nix`) respecte a `activitypub.js` i fuita d’URLs en Supabase autoallotjat a `exportaMunicipiOpenData.js`
- **On:** `tooling/seo/genera-federacio.mjs:200`, `flake.nix:420` i `src/data/exportaMunicipiOpenData.js:248-253`
- **Canvi recomanat:**
  - En `flake.nix:420`, canviar `[A-Za-z0-9.-]*` per `[A-Za-z0-9+.-]*`, i en `genera-federacio.mjs:200` acceptar també `https?(?::|%3a)(?:/|%2f){2}${host}(?:/|%2f)(?:ap(?:/|%2f)actors(?:/|%2f)${slug}\.json|pobles(?:/|%2f)${slug})$`.
  - En `exportaMunicipiOpenData.js:248`, eliminar la restricció `url.hostname.endsWith('.supabase.co')` i validar directament el prefix `url.pathname.startsWith(PREFIX_STORAGE)` amb `SEGMENT_SEGUR`.

##### 9. `[MITJÀ]` `oblidaXatEnEixir` amb `alie === true` esborra les claus `sdp_xat_*` de `sessionStorage`/`localStorage` mentre una altra persona ja és dins
- **On:** `src/data/xifratXatEixida.js:239-247`
- **Canvi recomanat:**
  - En `src/data/xifratXatEixida.js:247`, si `alie === true`, passar `{ sessio: null, preferencies: null }` perquè l’eixida tardana d’A només esborre la `clauIdentitat` d’A a IndexedDB.

---

#### 🟢 MILLORA

##### 10. `[MILLORA]` Consum prematur de quota en `traductorLliure.js` quan una petició s’avorta i ordre d’extrems d’Apertium a `traductor-iaia.mjs` / `traduccio.php`
- **On:** `src/data/traductorLliure.js:184`, `tooling/vite/traductor-iaia.mjs:47-50` i `wordpress-plugin/includes/traduccio.php:103-106`
- **Canvi recomanat:**
  - En `traductorLliure.js:184`, guardar `const marcaLot = ara(); sessio.lots.push(marcaLot);` i, si ix per `motiu === 'cancellada'` sense haver completat el lot (línia `214`), retirar `marcaLot` de `sessio.lots`.
  - En `traductor-iaia.mjs:47-50` i `traduccio.php:103-106`, posar `https://beta.apertium.org/apy/translate` en primera posició com ja fa `traductorLliure.js`.

---

### 2. Arquitectura Mínima per a Web Push (`public/sw.js`) i Capacitor Push (`avisosNatius.js`) sense trencar E2EE («Wake-up Push cec / Zero-Plaintext Tickle»)

1. **Càrrega útil cega al servidor (RFC 8030 + VAPID RFC 8292 / APNs / FCM):**
   - JSON mínim sense text ni metadades sensibles: `{ "v": 1, "tipus": "xat_nou", "filId": "<uuid>", "seq": 42 }`.
2. **A la PWA (`public/sw.js`):**
   - `self.addEventListener('push', ...)` comprova si hi ha una finestra enfocada (`clients.matchAll({ type: 'window', includeUncontrolled: true })`); si cap finestra està visible, crida `self.registration.showNotification('Sóc de Poble', { body: 'Tens un missatge nou al xat', tag: 'sdp-xat-' + filId, data: { url: '/xat/' + filId } })` sense tocar IndexedDB ni les claus E2EE.
   - `self.addEventListener('notificationclick', ...)` fa `client.focus()` i navega a `/xat/${filId}`.
3. **A iOS i Android natiu (`src/natiu/avisosNatius.js`) i Oblit (`D-09`):**
   - En `oblidaXatEnEixir` (`src/data/xifratXatEixida.js:230`), cridar `pushSubscription.unsubscribe()` i esborrar la fila del dispositiu al servidor abans de tancar la sessió; si falla, incloure `'push'` a `pendents` d’`OBLIT_FALLIT`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

El document original no porta una secció de verificació separada; les comprovacions que cita són dins de «Troballes». L'adopció no n'hi afig cap.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Adopció estructural: no valida, corregix ni reescriu cap afirmació del document original.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index_escriptori]]
- [[261030_1533_informe_matinal_opus]]
