---
tipus: document
estat: esborrany
description: Auditoria de Seguretat — Capa de Dades
---
# Auditoria de Seguretat — Capa de Dades

He reconegut el fitxer: és la meua pròpia anàlisi prèvia que m'has tornat. No hi ha instrucció nova, així que **procedesc amb la proposta #1** (seguretat de la capa de dades), que és la de més risc. Si volies una altra, digues-m'ho i canvie.

---

## Abast auditat

| Fitxer | Línies | Funció |
|---|---|---|
| `public/auth/callback.html` | 175 | Relé OAuth (superfície externa) |
| `src/data/identitat.js` | 258 | Sessions, JWT, adopció de sessió externa |
| `src/data/oauthRelay.js` | 316 | Flux PKCE, popup, tornada |
| `src/data/supabaseBackend.js` | 1292 | Accés a dades, RLS |

---

## Troballes

### 🟡 S-1 · `oauthRelay.js` — Validació d'`state` fail-open

**Fitxer:** `src/data/oauthRelay.js`, `gestionaTornada()`

```js
const urlState = qSearch.get('state') || qHash.get('state');
const storedState = getEfimer('sdp:oauth:state', null);

if (storedState) {
    if (!urlState || urlState !== storedState) {
      netejaRetorn();
      throw new Error('Estat OAuth no vàlid. Possible atac CSRF.');
    }
}
```

**Problema:** si `storedState` és `null` (sessionStorage esborrat, canvi de pestanya, extensió que neteja), la comprovació **se salta** i el codi s'accepta. És fail-open.

**Impacte:** un atacant que puga forçar l'esborrat de `sessionStorage` abans de la tornada (per exemple, una extensió maliciosa, o un altre script al mateix origen) podria injectar un `code` arbitrari. El `code_verifier` encara protegeix el bescanvi, així que l'atac no és trivial, però la defensa en profunditat es perd.

**Correcció:** si hi ha `urlState` i no hi ha `storedState`, rebutjar. Si no n'hi ha cap dels dos, rebutjar també. Només acceptar si tots dos existeixen i coincideixen.

```js
if (!storedState || !urlState || urlState !== storedState) {
  netejaRetorn();
  throw new Error('Estat OAuth no vàlid. Possible atac CSRF.');
}
```

---

### 🟡 S-2 · `supabaseBackend.js` — `createNote` i `updateNote` no sanejen al backend

**Fitxers:** `src/data/supabaseBackend.js`, funcions `createNote` i `updateNote`

```js
const payload = {
  ...
  content: note.content || ''   // ← HTML cru, sense sanitizeHtml
};
```

**Problema:** el sanejament d'HTML (`sanitizeHtml` de `src/utils/sanitize.js`) s'aplica **a la UI** (`NotesContext`, `retall.js`), no a la capa de dades. Un client que cride `createNote` o `updateNote` directament (una altra app, un script, un futur mòbil) pot escriure HTML arbitrari a la BD.

**Impacte:** XSS emmagatzemat servit a tots els lectors de la nota. La RLS no ho atura perquè no és el seu ofici.

**Correcció:** sanititzar `content`, `title`, `subtitle`, `lead` a la capa de dades, no només a la UI. Defensa en profunditat: el backend ha de poder confiar en el seu propi sanejament, no en el del client.

```js
import { sanitizeHtml, netejaText } from '../utils/sanitize.js';
// ...
content: sanitizeHtml(note.content || ''),
title: netejaText(note.title || '', 160),
```

---

### 🟡 S-3 · `supabaseBackend.js` — `enviaMissatge` sense límit de mida

**Fitxer:** `src/data/supabaseBackend.js`, funció `enviaMissatge`

```js
const cos = String(text ?? '').trim();
if (!cos) throw new Error('El missatge està buit.');
// ← cap comprovació de longitud
```

**Problema:** un client maliciós pot enviar un missatge de desenes de MB. La BD probablement el rebutjarà (si hi ha un CHECK), però el client no té cap guarda. El payload viatja per la xarxa abans de fallar.

**Impacte:** DoS per amplificació (el servidor processa el cos abans de rebutjar-lo), i possible ompliment de logs si el missatge es registra.

**Correcció:** límit explícit, alineat amb el CHECK de la BD. Un valor raonable per a un xat de poble: 4.000 caràcters.

```js
if (cos.length > 4000) throw new Error('El missatge és massa llarg (màxim 4.000 caràcters).');
```

---

### 🟢 S-4 · `callback.html` — `sdp_path` permet `?`

**Fitxer:** `public/auth/callback.html`

```js
var camiValid = path.indexOf('#') === -1
  && path.indexOf('\\') === -1
  && path.indexOf('..') === -1
  && path.slice(0, 2) !== '//'
  && path.length <= 512;
```

**Problema:** la validació rebutja `#`, `\`, `..`, `//`, però **no** `?`. Un `sdp_path=/admin?action=delete` produiria `origen/admin?action=delete#sdp_code=...`. L'app llig `location.search` per a paràmetres com `?tornar=` o `?date=`. No és explotable amb els paràmetres actuals, però és una porta oberta a paràmetres futurs.

**Impacte:** baix. Només si un futur paràmetre de query té efectes laterals.

**Correcció:** afegir `path.indexOf('?') === -1` a la validació. El `path` hauria de ser només camí, no query.

---

### 🟢 S-5 · `callback.html` — `staging.sollutia.example` a la llista blanca

**Fitxer:** `public/auth/callback.html`, `ORIGENS_PERMESOS`

```js
'https://staging.sollutia.example',
```

**Problema:** `.example` és un TLD reservat (RFC 2606) i no es pot registrar, així que no és explotable. Però el comentari diu "AFEGIR ACÍ ELS ORÍGENS DE SOLLUTIA" i la línia ja conté un placeholder. Algú podria pensar que ja està fet.

**Impacte:** nul avui, confusió demà.

**Correcció:** comentar la línia fins que hi haja un origen real, o eliminar-la i deixar el comentari sol.

---

## Punts correctes (verificats)

- **PKCE ben implementat:** `generaVerificador` usa `crypto.getRandomValues`, `base64url` correcte, `SHA-256` via `crypto.subtle`. ✅
- **Popup obert síncronament** abans de qualsevol `await` — crítica per a Safari. ✅
- **Circuit breaker** a 4 intents/minut. ✅
- **Relé amb igualtat exacta** (`indexOf`, no `startsWith`). ✅
- **Codi retornat en fragment**, mai en query. ✅
- **Sessió fail-closed:** sense JWT no hi ha usuari, i JWT caducat torna `null`. ✅
- **Tres peces de sessió a la mateixa capa** (`sessionStorage`), esborrades totes per `logout()`. ✅
- **Mutex de renovació** (`renovacioEnCurs`) per evitar tempestes de refresh. ✅
- **409 en conflicte de revisió** a `updateNote`. ✅
- **RLS fail-closed** a Supabase: `expectedRevision` obligatori. ✅

---

## Veredicte

| Àrea | Estat |
|---|---|
| OAuth / PKCE | ✅ Sòlid (1 correcció menor: S-1) |
| Sessions | ✅ Sòlid |
| Sanejament | 🟡 Incomplet (S-2) |
| Validació d'entrada | 🟡 Incomplet (S-3, S-4) |
| RLS / Supabase | ✅ Sòlid |

**Risc global:** **baix-mitjà**. Cap vulnerabilitat crítica explotable remotament. S-1 i S-2 són les que val la pena corregir abans de publicar.

---

## Següent

Vols que:

1. **Audite l'arquitectura React** (`App.jsx`, contexts, cicle de vida)?
2. **Audite el sistema Pedra Seca** (tokens, CSS, accessibilitat)?
3. **Audite la Wiki** (frontmatter, orfes, enllaços)?
4. **Audite el tooling** (portes, tractors, scripts)?
5. **Redacte les correccions S-1 a S-5** com a pedaços aplicables?
