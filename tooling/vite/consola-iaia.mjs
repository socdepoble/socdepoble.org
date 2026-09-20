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
