---
type: informe
status: esborrany
description: Exorcisme de Preact al dev server (servidor zombi) i base de la Consola Termodinàmica de la IAIA amb Pedra Seca.
tags:
  - arquitectura
  - disseny
  - skills
---

# Auditoria — Resurrecció del Frontend i Consola Termodinàmica

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260920-0300-CLAUDE |
| Respon a | SDP-PROMPT-CLAUDE-260920-02 |
| Tall verificat | HEAD `b398115f` · branca `backup-notes-publish` · arbre brut (migració Preact→React sense confirmar) · 20-09-2026 02:35 |
| Agent | Claude (Cowork / Fable 5.1) · esforç alt |
| Aprovació humana | pendent |
| Codi aplicat automàticament | **cap** (contracte, punt 5) |

**Ancoratge de Seguretat:** [[00_index_escriptori]]

## Vincles

- [[260920_0230_PROMPT_Claude_Frontend]]
- [[260920_0154_auditoria_skills_avancades]]
- [[skill-consell-i-colmena]]

---

## §0 · Resum en tres línies

1. **La pantalla roja no és cap alies amagat ni cap Babel residual.** És un **procés `vite` zombi** (PID 68956, arrancat el 19-09 a les 19:55) que va nàixer amb `@preact/preset-vite` carregat en memòria i que continua servint Preact hui, després que `npm install` (20-09, 01:10) haja esborrat `node_modules/@prefresh/*` de disc. La solució és matar el procés i netejar la caché. Zero canvis de configuració necessaris per a l'arrencada.
2. **Queda un sol rastre viu de Preact al codi font**: `src/components/PedraSeca/organismes/UniversalCard.test.jsx:7`. I un comentari mentider a `vite.config.js:34-38`. Codi de correcció a §2.
3. **La Consola Termodinàmica** es lliura com a base completa: un plugin de Vite només-dev que agrega les fonts reals de la IAIA (`.agents/.diari_sessio.jsonl`, `manifest.yaml`, `SKILLS_SEAL.json`, `.immunitari/journal.ndjson`), una secció `src/sections/consola/` muntada únicament amb la façana de Pedra Seca (`Pestanyes`, `Taula`, `Boto`, `Dialeg`, `Insignia`, `EstatBuit`, `Carregant`, `Progres`), una ruta protegida per `RequireAuth rol="superadmin"` i 20 línies de CSS. **Consums de tòkens i crèdits no tenen cap font de dades al repositori**: la consola ho declara en pantalla en lloc d'inventar-ho, i proposa el contracte d'entrada al diari (§3.6).

---

## §1 · Exorcisme de Preact: la peça exacta

### 1.1 · Què diu el disc (estat real de l'arbre)

La migració a React ja està **feta i sense confirmar** al working tree:

- `git diff HEAD -- vite.config.js` mostra `-import preact from '@preact/preset-vite'` / `+import react from '@vitejs/plugin-react'` i l'eliminació dels cinc alies `'react' → 'preact/compat'`, `'react-dom' → 'preact/compat'`, `'react-dom/client' → 'preact/compat/client'`, `'react/jsx-runtime'`, `'react/jsx-dev-runtime'` que hi havia a `resolve.alias`. La versió en disc de `vite.config.js:19-21` és `plugins: [ react() ]` i `vite.config.js:32-36` només conserva l'alies `'@'`.
- `git diff HEAD -- package.json`: fora `preact ^10.29.8`, `@preact/preset-vite ^2.10.6`, `@testing-library/preact ^3.2.4`; dins `@testing-library/dom`, `@testing-library/react ^16.3.3`, `@vitejs/plugin-react ^5.2.0`.
- `package-lock.json` en disc: **zero** aparicions de `preact` o `prefresh`. A `HEAD:package-lock.json` n'hi havia deu (línies 1536-1622 i 5944).
- `node_modules/react/package.json` → `18.3.1`; `node_modules/@vitejs/plugin-react` → `5.2.0`; `node_modules/react-refresh` present.
- `node_modules/@preact/` i `node_modules/@prefresh/` **existixen però estan buits** (0 entrades, mtime 20-09 01:10). Són carcasses d'`npm prune`, no paquets. `node_modules/.vite/` també és buit (mtime 01:12).

Conclusió: **no hi ha cap `@prefresh/core` a disc, ni cap configuració que el demane.** L'error, doncs, no el pot estar generant la configuració actual.

### 1.2 · Què diu el servidor que està escoltant al 3340

```
$ lsof -nP -iTCP:3340 -sTCP:LISTEN
node  68956  javillinares ... TCP *:3340 (LISTEN)
$ ps -o lstart= -p 68956
Sat Sep 19 19:55:18 2026
```

El procés que atén el port va arrancar **sis hores abans** de l'`npm install` que va traure Preact. I això és el que serveix ara mateix:

```
$ curl -s http://localhost:3340/src/main.jsx | head -3
import.meta.env = {...};import { jsxDEV } from "/node_modules/.vite/deps/preact_jsx-dev-runtime.js?v=c575de01";
import "/node_modules/.vite/deps/preact_debug.js?v=c575de01";
import "/src/css/index.css?t=1789853140248";
```

El `main.jsx` de disc (`src/main.jsx:2-3`) importa `react` i `react-dom/client`. El servidor el transforma amb el pipeline de **`@preact/preset-vite`** (jsxDEV de `preact/jsx-dev-runtime`, injecció de `preact/debug`) i l'apunta a fitxers `node_modules/.vite/deps/preact_*.js` que **ja no existixen**. El plugin `@prefresh/vite`, que forma part del preset, injecta a cada mòdul l'`import '@prefresh/core'` per a l'HMR: com el paquet ha desaparegut de disc, la resolució falla i Vite pinta la pantalla roja `[plugin:vite:import-analysis] Failed to resolve import "@prefresh/core"`.

### 1.3 · Per què el reinici automàtic de Vite no ho ha arreglat

Vite reinicia el servidor quan canvia `vite.config.js`, però ho fa **dins del mateix procés Node**, tornant a avaluar la configuració. La configuració nova importa `@vitejs/plugin-react`, que a les 01:10-01:11 s'estava instal·lant en el mateix instant que `@preact/preset-vite` desapareixia. [SUPÒSIT, coherent amb l'evidència] La recàrrega de configuració va fallar en eixa finestra (o l'usuari va editar `vite.config.js` abans de l'`npm install`) i Vite, per disseny, **conserva el servidor anterior en marxa** quan la nova configuració no carrega. El resultat és exactament el que veiem: procés viu, port ocupat, plugins de Preact en memòria, `.vite/deps` buit a disc.

No cal demostrar el supòsit per a actuar: la prova directa és que el fitxer servit no coincidix amb el fitxer de disc ni amb la configuració de disc.

### 1.4 · Solució (tres ordres, zero edicions)

```bash
kill 68956
```

```bash
rm -rf node_modules/.vite node_modules/@preact node_modules/@prefresh
```

```bash
npm run dev
```

Després, verificació objectiva (ha d'eixir `react_jsx-dev-runtime` i cap `preact`):

```bash
curl -s http://localhost:3340/src/main.jsx | grep -c preact
```

Ha de retornar `0`. I `curl -s http://localhost:3340/src/main.jsx | head -2` ha de mostrar `/node_modules/.vite/deps/react_jsx-dev-runtime.js` i `/@react-refresh`.

Les dues carpetes buides `@preact`/`@prefresh` no fan mal, però esborrar-les evita que el pròxim `grep -rl preact node_modules` done un fals positiu.

---

## §2 · Rastres residuals de Preact al codi font (correcció manual)

`grep -rln "prefresh\|preact"` sobre l'arbre sense `node_modules`, `.git` ni `dist` retorna **un** fitxer de codi i un de configuració; la resta són documents de la wiki, l'índex RAG (`public/rag-index.json`, regenerat pel build) i permisos de `.claude/settings.local.json` (cadenes de comandes antigues, inerts).

### 2.1 · `src/components/PedraSeca/organismes/UniversalCard.test.jsx:1-7`

Estat actual:

```jsx
/**
 * Proves de UniversalCard amb `render` de Preact directe: no passen per
 * @testing-library/react, que pinta amb el react-dom real i fa petar les
 * suites de src/ (vegeu el dictamen 260910).
 */
import { render } from '@testing-library/react';
import { act } from 'preact/test-utils';
```

El comentari diu el contrari del que fa la línia 6 (ja usa `@testing-library/react`), i la línia 7 importa un paquet que **no està a `package.json` ni al lockfile**: `vitest` petarà en resoldre'l. Correcció:

```jsx
/**
 * Proves de UniversalCard amb @testing-library/react sobre react-dom 18.
 * (El dictamen 260910 sobre Preact queda superat per la migració a React
 * del 260920.)
 */
import { render } from '@testing-library/react';
import { act } from 'react';
```

`act` és export públic de `react` a 18.3 (`node_modules/react/package.json` → `18.3.1`), i és el que `@testing-library/react` 16 usa internament. Cap altra línia del fitxer depén de Preact (comprovat: `grep -n preact` només dona la 7 i el comentari).

### 2.2 · `vite.config.js:34-38` (comentari mentider dins de `test.alias`)

```js
    /* En Node, lucide-react es resol pel `main` CJS, que fa require('react')
       i carrega el React real: l'àlies a preact/compat no hi arriba i pintar
       qualsevol icona peta (InvalidCharacterError). Forcem l'entrada ESM i
       la processem inline, com fa l'app en el build. */
```

Ja no hi ha alies a `preact/compat`. La regla (`test.alias['lucide-react']` a l'entrada ESM + `server.deps.inline`) pot seguir sent útil, però el motiu és un altre. Substituir per:

```js
    /* En Node, lucide-react es resol pel `main` CJS. Forcem l'entrada ESM i
       la processem inline perquè vitest la transforme igual que el build.
       (Pre-260920 açò tapava un doble React amb preact/compat; ja no.) */
```

### 2.3 · Res més

- `index.html:39-41` no carrega res de Preact.
- `vite.standalone.config.js` ja usa `react()` (línies 2 i 19-21).
- No hi ha `.babelrc`, `babel.config.*`, `tsconfig`/`jsconfig` a l'arrel (`ls -a | grep -i babel` buit).
- `package.json` no té `overrides` ni `resolutions`.

### 2.4 · Recomanació de govern

La migració és un canvi estructural sense entrada al `LEDGER.md` i sense confirmar. Convindria confirmar `vite.config.js`, `package.json`, `package-lock.json` i la correcció 2.1 en un sol commit (`feat(react): migració Preact→React 18 i neteja del dev server`) perquè el pròxim `git bisect` tinga un punt de tall clar.

---

## §3 · Consola Termodinàmica (Panell de Manteniment de la IAIA)

### 3.1 · Principis de disseny

1. **Només fonts reals.** Cada pestanya llig un fitxer que existix i que ja alimenta el sistema: rebuts Matrix del diari, manifest de skills, segell, diari immunitari. Res es simula amb `*Seed.js`.
2. **Dev-only per construcció.** Les dades viuen a `.agents/` i `.immunitari/`, fora de `public/`. Exposar-les via un middleware del dev server (`apply: 'serve'`) garantix que **el build de producció i el bundle de WordPress no contenen ni la ruta ni les dades**. En producció la secció mostra `EstatBuit` (la petició dona 404) i la ruta està darrere de `RequireAuth rol="superadmin"`.
3. **Zero classes noves fora de `sdp-*`, zero `style={{}}`.** `tooling/gates/design_guard.mjs:209-221` bloqueja estils en línia i `tooling/gates/tractor-classes.mjs:36-80` exigix que tota classe usada al JSX estiga definida en algun CSS de `src/`. Per això el §3.5 afig les cinc classes que la secció usa.
4. **Sense literals de rutes de wiki a `tooling/`.** `tooling/gates/tractor-rutes.mjs:44-50` prohibix `'_wiki_de_poble'` i `'04_escriptori'` fora de la SSOT; el plugin només usa `PROJECT_DIR`, `AGENTS_DIR` i `SKILLS_DIR` de `tooling/wiki/lib/project_paths.mjs:43,71,72`.

### 3.2 · Plugin de Vite · `tooling/vite/consola-iaia.mjs` (fitxer nou)

```js
/**
 * consola-iaia.mjs — Middleware només-dev que agrega l'estat de l'eixam.
 *
 * Serveix GET /__iaia/consola.json amb: rebuts Matrix, consums de tòkens
 * (contracte proposat, vegeu la secció), inventari de skills (manifest vs
 * disc), segell de skills i diari immunitari.
 *
 * `apply: 'serve'` → el build de producció no coneix esta ruta.
 * No s'escriu res a disc. No es fa cap crida de xarxa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_DIR, AGENTS_DIR, SKILLS_DIR } from '../wiki/lib/project_paths.mjs';

export const RUTA_CONSOLA = '/__iaia/consola.json';

const llig = (ruta) => { try { return fs.readFileSync(ruta, 'utf8'); } catch { return null; } };

const jsonl = (txt) => (txt ?? '').split('\n').filter(Boolean).map((l) => {
  try { return JSON.parse(l); } catch { return null; }
}).filter(Boolean);

/* Mateix parser mínim que tooling/brain/matrix.mjs:62-75: claus planes i llistes. */
function frontmatter(txt) {
  const m = (txt ?? '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  let clau = null;
  for (const l of m[1].split('\n')) {
    const kv = l.match(/^([a-zA-Z_][\w]*):\s*(.*)$/);
    const it = l.match(/^\s+-\s+(.*)$/);
    if (kv) { clau = kv[1]; out[clau] = kv[2] === '' ? [] : kv[2].replace(/^['"]|['"]$/g, ''); }
    else if (it && clau) { if (!Array.isArray(out[clau])) out[clau] = []; out[clau].push(it[1].replace(/^['"]|['"]$/g, '')); }
  }
  return out;
}

export function recullConsola() {
  const diari = jsonl(llig(path.join(AGENTS_DIR, '.diari_sessio.jsonl')));

  const rebuts = diari
    .filter((e) => e.tipus === 'matrix.rebut')
    .map((e) => ({
      t: e.t,
      peticio: e.peticio_sha256 ?? null,
      protocols: e.protocols ?? [],
      fonts: (e.fonts ?? []).map((f) => ({ ruta: f.ruta, sha256: f.sha256 }))
    }))
    .reverse();

  /* Contracte proposat (§3.6). Hui el diari no en té cap: la UI ho dirà. */
  const consums = diari.filter((e) => e.tipus === 'consum.tokens');

  const manifest = llig(path.join(AGENTS_DIR, 'manifest.yaml')) ?? '';
  const alManifest = [...manifest.matchAll(/^\s+-\s+skills\/([^/]+)\/SKILL\.md\s*$/gm)].map((m) => m[1]);
  const alDisc = fs.existsSync(SKILLS_DIR)
    ? fs.readdirSync(SKILLS_DIR).filter((n) => fs.existsSync(path.join(SKILLS_DIR, n, 'SKILL.md')))
    : [];

  const skills = [...new Set([...alManifest, ...alDisc])].sort().map((nom) => {
    const fm = frontmatter(llig(path.join(SKILLS_DIR, nom, 'SKILL.md')));
    return {
      nom,
      alManifest: alManifest.includes(nom),
      alDisc: alDisc.includes(nom),
      estat: fm.status ?? fm.estat ?? null,
      core: fm.core === 'true',
      descripcio: fm.description ?? ''
    };
  });

  let segell = null;
  try { segell = JSON.parse(llig(path.join(AGENTS_DIR, 'SKILLS_SEAL.json'))); } catch { /* sense segell */ }

  const immunitari = jsonl(llig(path.join(PROJECT_DIR, '.immunitari', 'journal.ndjson')));

  return {
    generat: new Date().toISOString(),
    rebuts,
    consums,
    credits: null,           // cap font al repositori (§3.6)
    skills,
    segell,
    immunitari: { operacions: immunitari.length, ultima: immunitari.at(-1) ?? null }
  };
}

export default function consolaIaia() {
  return {
    name: 'sdp:consola-iaia',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(RUTA_CONSOLA, (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(recullConsola()));
      });
    }
  };
}
```

Registre a `vite.config.js` (dues línies; **no** a `vite.standalone.config.js`):

```js
import react from '@vitejs/plugin-react';
import consolaIaia from './tooling/vite/consola-iaia.mjs';
// ...
    plugins: [
      react(),
      consolaIaia()
    ],
```

Nota sobre `server.watch.ignored` (`vite.config.js:28-30`): `.agents/` no està al graf de mòduls, així que editar el diari no dispara recàrregues. La consola té un botó «Refrescar» per això.

### 3.3 · Capa de dades · `src/sections/consola/consolaContent.js` (fitxer nou)

Seguix el patró `*Content.js` de `src/sections/README.md:20-24`.

```js
/**
 * consolaContent.js — Transformació de dades de la Consola Termodinàmica.
 * La font és el middleware dev de tooling/vite/consola-iaia.mjs.
 */
export const FONT_CONSOLA = '/__iaia/consola.json';

export async function carregaConsola(signal) {
  const r = await fetch(FONT_CONSOLA, { signal, cache: 'no-store' });
  if (r.status === 404) return null;                 // producció: no hi ha consola
  if (!r.ok) throw new Error(`Consola ${r.status} ${r.statusText}`);
  return normalitza(await r.json());
}

export function normalitza(brut) {
  return {
    generat: brut.generat ?? null,
    rebuts: Array.isArray(brut.rebuts) ? brut.rebuts : [],
    consums: Array.isArray(brut.consums) ? brut.consums : [],
    credits: brut.credits ?? null,
    skills: Array.isArray(brut.skills) ? brut.skills : [],
    segell: brut.segell ?? null,
    immunitari: brut.immunitari ?? { operacions: 0, ultima: null }
  };
}

export function resumSkills(skills) {
  const orfes = skills.filter((s) => s.alDisc && !s.alManifest);      // al disc, fora del manifest
  const fantasmes = skills.filter((s) => s.alManifest && !s.alDisc);  // al manifest, esborrats del disc
  const nucli = skills.filter((s) => s.core);
  return { total: skills.length, orfes, fantasmes, nucli };
}

export function resumConsums(consums) {
  const total = consums.reduce((acc, c) => ({
    entrada: acc.entrada + (Number(c.entrada) || 0),
    eixida: acc.eixida + (Number(c.eixida) || 0)
  }), { entrada: 0, eixida: 0 });
  const perAgent = new Map();
  for (const c of consums) {
    const clau = c.agent ?? 'desconegut';
    const prev = perAgent.get(clau) ?? { agent: clau, entrada: 0, eixida: 0, sessions: 0 };
    perAgent.set(clau, {
      ...prev,
      entrada: prev.entrada + (Number(c.entrada) || 0),
      eixida: prev.eixida + (Number(c.eixida) || 0),
      sessions: prev.sessions + 1
    });
  }
  return { total, perAgent: [...perAgent.values()] };
}

export const curt = (sha) => (typeof sha === 'string' ? sha.slice(0, 12) : '—');

export const dataLocal = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('ca-ES');
};
```

### 3.4 · Secció · `src/sections/consola/ConsolaSection.jsx` (fitxer nou)

Importa **només** de la façana `src/components/PedraSeca/index.js` (exports verificats: `Boto` l.11, `Insignia` l.14, `EstatBuit`/`Carregant`/`Progres` l.19, `Dialeg` l.31, `Taula` l.32, `Pestanyes` l.34) i de `UniversalPage`, com fan `PoblesSection.jsx:2-3` i `ControlSection.jsx:19-20`.

```jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions } from '../../app/contexts/UIContext';
import {
  carregaConsola, resumSkills, resumConsums, curt, dataLocal
} from './consolaContent.js';

/* ── Peces internes (sense classes noves fora de sdp-consola__*) ─────────── */

function Xifra({ etiqueta, valor }) {
  return (
    <div className="sdp-consola__xifra">
      <span className="sdp-consola__xifra-valor">{valor}</span>
      <span className="sdp-consola__xifra-etiqueta">{etiqueta}</span>
    </div>
  );
}

function PanellConsums({ consums }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <code className="sdp-consola__mono">.agents/.diari_sessio.jsonl</code> no conté cap
        entrada <code className="sdp-consola__mono">consum.tokens</code>. Quan un agent en registre,
        apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={total.entrada.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Tòkens d'eixida" valor={total.eixida.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Sessions" valor={consums.length} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th>Agent</th><th>Sessions</th><th>Entrada</th><th>Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <td>{a.agent}</td>
              <td>{a.sessions}</td>
              <td>{a.entrada.toLocaleString('ca-ES')}</td>
              <td>{a.eixida.toLocaleString('ca-ES')}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa:
        quan hi haja font (§3.6 de l'auditoria 260920_0300), es connecta ací.
      </EstatBuit>
    );
  }
  return (
    <div className="sdp-consola__llista">
      {credits.map((c) => (
        <Progres key={c.proveidor} etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit} max={c.limit} />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, onVeure }) {
  if (rebuts.length === 0) {
    return <EstatBuit icona={Receipt} titol="Cap rebut Matrix">El diari de sessió no té entrades <code className="sdp-consola__mono">matrix.rebut</code>.</EstatBuit>;
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
      <thead>
        <tr><th>Data</th><th>Petició</th><th>Protocol</th><th>Fonts</th><th></th></tr>
      </thead>
      <tbody>
        {rebuts.map((r) => (
          <tr key={`${r.t}-${r.peticio}`}>
            <td>{dataLocal(r.t)}</td>
            <td className="sdp-consola__mono">{curt(r.peticio)}</td>
            <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
            <td>{r.fonts.length}</td>
            <td><Boto varietat="fantasma" onClick={() => onVeure(r)}>Veure fonts</Boto></td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell }) {
  const { total, orfes, fantasmes, nucli } = resumSkills(skills);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Skills" valor={total} />
        <Xifra etiqueta="Nucli (core)" valor={nucli.length} />
        <Xifra etiqueta="Orfes (disc sense manifest)" valor={orfes.length} />
        <Xifra etiqueta="Fantasmes (manifest sense disc)" valor={fantasmes.length} />
      </div>
      {segell ? (
        <p>
          Segell <code className="sdp-consola__mono">{curt(segell.hash)}</code> · {segell.filesCount} fitxers ·
          {' '}{dataLocal(segell.timestamp)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa>
        <thead>
          <tr><th>Skill</th><th>Estat</th><th>Manifest</th><th>Disc</th><th>Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <td>{s.core ? <strong>{s.nom}</strong> : s.nom}</td>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="neutre">sense estat</Insignia>}</td>
              <td>{s.alManifest ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">no</Insignia>}</td>
              <td>{s.alDisc ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">esborrat</Insignia>}</td>
              <td>{s.descripcio}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* ── Secció ─────────────────────────────────────────────────────────────── */

export default function ConsolaSection() {
  const { t } = useUIActions();
  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);

  useSEO({
    title: t('section.consola.title', 'Consola Termodinàmica'),
    description: t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.")
  });

  const carrega = useCallback((signal) => {
    setEstat('loading');
    carregaConsola(signal)
      .then((d) => { if (signal?.aborted) return; setDades(d); setEstat(d ? 'ready' : 'absent'); })
      .catch((e) => { if (signal?.aborted) return; setError(e); setEstat('error'); });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    carrega(ac.signal);
    return () => ac.abort();
  }, [carrega]);

  const pestanyes = dades ? [
    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} /> },
    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt, contingut: <PanellRebuts rebuts={dades.rebuts} onVeure={setRebutObert} /> },
    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle, contingut: <PanellSkills skills={dades.skills} segell={dades.segell} /> }
  ] : [];

  return (
    <UniversalPage
      title={t('section.consola.title', 'Consola Termodinàmica')}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.")}
      chrome="system"
    >
      <div className="content-wrapper">
        <div className="sdp-consola__capcal">
          <p>
            {dades?.generat ? <>Instantània: {dataLocal(dades.generat)} · {dades.immunitari.operacions} operacions immunitàries</> : null}
          </p>
          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={() => carrega()}>
            Refrescar
          </Boto>
        </div>

        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

        {estat === 'absent' ? (
          <EstatBuit titol="Consola no disponible en este entorn">
            El servidor no exposa <code className="sdp-consola__mono">/__iaia/consola.json</code>. La consola només
            existix al servidor de desenvolupament (plugin <code className="sdp-consola__mono">sdp:consola-iaia</code>).
          </EstatBuit>
        ) : null}

        {estat === 'error' ? (
          <EstatBuit titol="No s'ha pogut llegir la consola">
            <pre className="sdp-consola__mono">{error?.message || String(error)}</pre>
          </EstatBuit>
        ) : null}

        {dades ? <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} /> : null}
      </div>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <Taula titol="Fonts del rebut" densa>
            <thead><tr><th>Ruta</th><th>sha256</th></tr></thead>
            <tbody>
              {rebutObert.fonts.map((f) => (
                <tr key={f.ruta}><td>{f.ruta}</td><td className="sdp-consola__mono">{curt(f.sha256)}</td></tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Dialeg>
    </UniversalPage>
  );
}
```

Contractes respectats (verificats al codi font):

- `Taula({ titol, densa, children, className })` → `Taula.jsx:9`. `titol` és obligatori per a l'`aria-label`.
- `Boto({ varietat, mida, icona, carregant, ... })` → `Boto.jsx:13-16`. `varietat="fantasma"` existix segons la capçalera `Boto.jsx:6-7`.
- `Dialeg({ obert, onTanca, titol, descripcio, accions, mida })` → `Dialeg.jsx:21-24`.
- `Pestanyes({ pestanyes: [{ id, etiqueta, icona?, contingut }], etiqueta })` → `Pestanyes.jsx:8,12`.
- `Insignia({ to })` amb `info|exit|avis|error|neutre` → `Insignia.jsx:4-5,13`.
- `EstatBuit({ icona, titol, children })`, `Carregant({ etiqueta })`, `Progres({ etiqueta, valor, max })` → `estats.jsx:10,21,44`.
- `sdp-taula--llarga` existix a `src/css/sdp.css:70-78` (capçalera enganxosa, `max-height: 70vh`).

### 3.5 · CSS · afegir a `src/css/components.css` (dins del bloc `@layer components {` que comença a la línia 10)

`tractor-classes.mjs` exigix que estes classes estiguen definides; `sdp-consola__mono` i `sdp-consola__llista` incloses. Tòkens verificats a `src/css/tokens.css:209-210`.

```css
  /* ── CONSOLA TERMODINÀMICA (secció /consola, només dev) ─────────── */
  .sdp-consola__capcal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sdp-space-2);
    flex-wrap: wrap;
    margin-block-end: var(--sdp-space-3);
  }
  .sdp-consola__resum {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--sdp-space-2);
    margin-block-end: var(--sdp-space-3);
  }
  .sdp-consola__xifra {
    display: grid;
    gap: var(--sdp-space-1);
    padding: var(--sdp-space-3);
    border: 1px solid var(--sdp-vora);
    border-radius: var(--sdp-radi-s);
  }
  .sdp-consola__xifra-valor { font-size: 2rem; font-weight: 700; line-height: 1; }
  .sdp-consola__xifra-etiqueta { font-size: 0.875rem; }
  .sdp-consola__mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85em; overflow-wrap: anywhere; }
  .sdp-consola__llista { display: grid; gap: var(--sdp-space-2); }
```

`--sdp-vora` i `--sdp-radi-s` ja s'usen a `src/css/sdp.css:68,86-87`.

### 3.6 · Ruta · `src/app/App.jsx`

Afegir la càrrega diferida al costat de `RealitatSection` (línia 39):

```jsx
const ConsolaSection = lazy(() => import('../sections/consola/ConsolaSection'));
```

I la ruta junt amb `/realitat` (línia 581), amb la mateixa guàrdia (`RequireAuth.jsx:32-49`: sense sessió redirigix a `/registre`; amb rol distint pinta `SenseRol`):

```jsx
        <Route path="/consola" element={<RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>} />
```

Opcional: una targeta d'accés a `ControlSection.jsx` dins de `primaryActions` (línia 30) amb `desti: '/consola'` i icona `Activity` (ja importada a `ControlSection.jsx:13`). No cal per a funcionar.

### 3.7 · Fonts que NO existixen (i el contracte que proposo)

`grep -rln "tokens\|credit"` sobre `.agents/`, `.immunitari/` i `tooling/brain/` només troba `260831_rescat_tokens.mjs` (tòkens **de disseny CSS**, no d'IA) i mencions al `LEDGER.md` de la mateixa família. El diari de sessió té **38 entrades, totes `matrix.rebut`** (`grep -o '"tipus":"[^"]*"' .agents/.diari_sessio.jsonl | sort | uniq -c`). **No hi ha cap registre de consum de tòkens ni de crèdits al repositori.**

La consola ja llig el tipus `consum.tokens` del mateix diari (§3.2). Contracte proposat, una línia JSON per sessió, escrita pel mateix mecanisme que `matrix.mjs:223-240` usa per al rebut:

```json
{"t":"2026-09-20T02:30:00.000Z","tipus":"consum.tokens","agent":"claude","model":"claude-fable-5-1","entrada":184320,"eixida":21044,"peticio_sha256":"8cb3eb2d…"}
```

Per a crèdits, `credits` al JSON del middleware espera `[{ proveidor, consumit, limit }]`; la font natural seria un fitxer `.agents/credits.json` mantingut a mà o pel cron (`.agents/cron/registre_tasques.json` existix però no registra crèdits). Fins que no existisca, la pestanya diu «Sense font de crèdits» i no pinta cap xifra.

### 3.8 · Portes que cal passar després d'aplicar

| Porta | Per què afecta | Resultat esperat |
| --- | --- | --- |
| `npm run porta:classes` | classes `sdp-consola__*` noves | verd si §3.5 s'aplica sencer |
| `npm run porta:design-guard` | prohibix `style={{}}` i Tailwind | verd: la secció no en té |
| `npm run porta:inlinestyles` | idem | verd |
| `npm run porta:rutes` | literals de rutes a `tooling/` | verd: el plugin usa la SSOT |
| `npm run porta:rutes-web` | ruta `/consola` nova | [SUPÒSIT] pot exigir declarar-la a la SSOT de rutes web; no he pogut confirmar-ne la regla sense executar-la |
| `npm run test` | `UniversalCard.test.jsx` | verd després de §2.1 |

---

## §4 · Ordre d'aplicació recomanat

1. §1.4 (matar el zombi, netejar caché, `npm run dev`) → comprovar `grep -c preact` = 0.
2. §2.1 i §2.2 (test i comentari).
3. §3.2 + registre a `vite.config.js` → `curl -s localhost:3340/__iaia/consola.json | head -c 400` ha de retornar JSON amb `rebuts` (38 entrades) i `skills`.
4. §3.3, §3.4, §3.5, §3.6.
5. Entrar com a superadmin a `/consola`.
6. Portes de §3.8 i entrada al `LEDGER.md`.

---

## Incògnites

- [SUPÒSIT §1.3] La seqüència exacta (edició de `vite.config.js` vs `npm install`) que va deixar el procés 68956 amb la configuració antiga. Irrellevant per a la solució; rellevant per a evitar-ho: **tanqueu el dev server abans de canviar de plugin de framework.**
- [SUPÒSIT §3.8] Si `tractor-rutes-web.mjs` exigix declarar `/consola` en alguna SSOT. Executar la porta ho dirà.
- El rol `superadmin` en `dataMode: 'seed'` (`src/main.jsx:31`): no he verificat com resol `useSession` el rol en mode llavor. Si en dev no hi ha sessió, la ruta redirigix a `/registre` per disseny (`RequireAuth.jsx:39-42`). Alternativa dev-only: `import.meta.env.DEV ? <ConsolaSection /> : <RequireAuth …>`. Ho deixe com a decisió de la IAIA.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura (config, lockfile, `node_modules`, procés viu, fitxer servit, components, portes).
- [x] He citat ruta i línies de tot el codi original referenciat.
- [x] Cap nom de fitxer, funció o variable inventat: els fitxers nous estan marcats com a «(fitxer nou)».
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites.
- [x] El document passa `tractor-frontmatter.mjs --estricte`: executat amb `--mostra=500`, **cap** troballa (F1-F8) nomena este fitxer. La porta global ix roja per deute previ d'altres nodes (`.agents/BIOS.md`, `SKILL.md` de skills, etc.), no per este document.
