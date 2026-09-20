---
type: petorreta
status: actiu
description: Macro-bundle nocturn per a derivar la implementació del tractor (F9) i revisar l'estat del servidor.
tags:
  - govern
---

# PETORRETA NOCTURNA: IMPLEMENTACIÓ DEL BROKER I F9

Hola, estimats Astra, Claude, Codex o qualsevol company de l'Eixam! 

Sóc la IAIA MarIA (l'agent central de Sóc de Poble). El nostre Mestre Javi és humà i necessita anar a dormir. 

Ens ha demanat que us passem aquest macro-bundle complet perquè pugueu processar-lo aquesta nit. L'objectiu és que vosaltres escrigueu directament el codi final implementat, de manera que quan Javi i jo ens despertem demà, només haguem de fer "copiar i enganxar" de les vostres solucions per aplicar-les al repositori.

## El Problema Actual

1. **F9 (`validaVincles`) pendent d'implementació**: L'auditoria de seguretat (veure més avall) va proposar una funció `validaVincles` (F9) que s'ha d'integrar dins del nostre `tooling/wiki/tractor-frontmatter.mjs`.
2. **Caiguda del Servidor**: Actualment la web no funciona (`ERR_CONNECTION_REFUSED` a localhost:3340). Pot ser que els canvis manuals recents a `sessionService.js` i `auth.js` hagin trencat el build del dev server o hagin introduït un error de sintaxi.

## La Vostra Missió

Us demanem que ens retorneu els **fitxers complets corregits** llestos per substituir els antics, o bé els blocs de codi exactes (amb context suficient per saber on enganxar-los) per a:

1. **`tooling/wiki/tractor-frontmatter.mjs`**: Integrar la funció `validaVincles` (F9) proposada a l'auditoria, assegurant que els imports necessaris hi són (des de `core/parse.mjs` i `lib/frontmatter.mjs`) i que la llei F9 s'aplica correctament junt amb les altres (F1-F8).
2. **Revisió de `sessionService.js` i `auth.js`**: Revisar el codi actual d'aquests fitxers (adjunt) per si hi ha errors que hagin fet caure el servidor, i si n'hi ha, donar-nos la versió arreglada.

---

## CONTEXT 1: Proposta F9 de l'Auditoria de Seguretat

Aquesta és la proposta original de Codex que s'ha d'integrar:

```javascript
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { liveMarkdown, extractLinks, buildResolver, resolveLink } from './core/parse.mjs';

function validaVincles(doc, resolver) {
  const p = parseFrontmatter(doc.content);
  if (p.malformed || p.errors.length) return ['YAML no llegible'];
  const seccions = [];
  let actual = null;
  for (const line of liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length <= 2) {
      actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null;
      if (actual) seccions.push(actual);
    } else if (actual) {
      actual.push(line);
    }
  }
  if (seccions.length !== 1) {
    return ['Cal exactament una secció real ## Vincles'];
  }
  const errors = [];
  let valids = 0;
  for (const line of seccions[0]) {
    if (!line.trim()) continue;
    const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
    if (!item || item[1].includes('\\')) {
      errors.push('Vincles només admet una llista de wikilinks sencers');
      continue;
    }
    const links = extractLinks(item[1]);
    if (links.length !== 1 || /[#^]/.test(links[0].target)) {
      errors.push('Cal enllaçar una nota sencera, sense fragments');
      continue;
    }
    const r = resolveLink(links[0], doc, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) {
      valids++;
    } else {
      errors.push(`${links[0].target}: ${r.status === 'resolved' ? 'autoreferència' : r.status}`);
    }
  }
  if (!valids) errors.push('Falta una nota interna única i diferent');
  return errors;
}
```

*Nota d'integració: S'ha de llegir una sola vegada els documents i construir `buildResolver(docs)` una vegada. Afegir `F9: []` al registre d'errors del tractor i el nom de la regla a l'eixida; cada error és `{n, clau:'Vincles', detall}`.*

---

## CONTEXT 2: `tooling/wiki/tractor-frontmatter.mjs` (ACTUAL, sense F9)
Us deixo només les parts rellevants d'anàlisi, ja que és llarg:

```javascript
/* ... imports anteriors ... */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const f = { F1: [], F2: [], F3: [], F4: [], F5: [], F6: [], F7: [], F8: [] };
// ATENCIÓ CHICAS: Cal afegir F9 aquí a l'objecte `f` i executar `validaVincles` dins del bucle que analitza els `NODES`.
/* ... bucle per a cada `n` of `NODES` on es llegeix el fitxer, es fa el parse, etc. ... */
```

---

## CONTEXT 3: `src/data/sessionService.js` (ACTUAL MODIFICAT)

```javascript
export async function renovaAra() {
  if (!teCapacitat('sessio')) {
    generacio++;
    await logout();
    return;
  }
  const myGen = generacio;
  try {
    const ok = await refrescaSessio(currentConfig);
    if (myGen !== generacio) return;
    if (!ok) {
      generacio++;
      await logout();
    }
  } catch (e) {
    if (myGen !== generacio) return;
    console.warn('Renovació asíncrona ajornada per xarxa', e);
  }
}
```

## CONTEXT 4: `src/data/supabase/auth.js` (ACTUAL MODIFICAT)

```javascript
async function renova(config = {}) {
  const epochActual = sessioEpoch;
  const refreshToken = getEfimer(CLAU_REFRESC);
  if (!refreshToken) return false;
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl) return false;
  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal
    });
    if (sessioEpoch !== epochActual) return false;

    if (response.ok) {
      const result = await response.json();
      if (sessioEpoch !== epochActual) return false;
      if (result?.access_token) {
        desaSessio(result); 
        emetCanvi(result.user); 
        return true;
      }
    }
    if ([400, 401].includes(response.status)) await logout();
    return false;
  } catch (error) {
    console.warn('Error de xarxa renovant sessió', error);
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
```

Gràcies companyes! Demà copiarem la vostra feina i farem que Sóc de Poble continuï brillant.
