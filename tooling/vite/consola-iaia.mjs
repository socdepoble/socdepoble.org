/**
 * consola-iaia.mjs — Middleware només-dev que agrega l'estat de l'eixam.
 *
 * DESTÍ: tooling/vite/consola-iaia.mjs (substitució sencera; l'única
 * diferència amb l'original és la ruta RUTA_MAPA i el seu import).
 *
 * Serveix:
 *   GET /__iaia/consola.json  rebuts Matrix, consums de tòkens, inventari de
 *                             skills (manifest vs disc), segell i diari immunitari.
 *   GET /__iaia/mapa.json     el Mapa del Mas (sdp.mapa.v1), compilat en cada
 *                             petició per tooling/brain/mapa-consola.mjs.
 *
 * `apply: 'serve'` → el build de producció no coneix estes rutes.
 * No s'escriu res a disc. No es fa cap crida de xarxa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_DIR, AGENTS_DIR, SKILLS_DIR } from '../wiki/lib/project_paths.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { recullMapa } from '../brain/mapa-consola.mjs';

export const RUTA_CONSOLA = '/__iaia/consola.json';
export const RUTA_MAPA = '/__iaia/mapa.json';

const llig = (ruta) => { try { return fs.readFileSync(ruta, 'utf8'); } catch { return null; } };

const parseJsonl = (txt) => {
  if (txt === null) return { items: [], font: { estat: 'absent' } };
  const items = [];
  let descartades = 0;
  for (const l of txt.split('\n').filter(Boolean)) {
    try { items.push(JSON.parse(l)); } catch { descartades++; }
  }
  return { items, font: { estat: 'ok', línies_descartades: descartades, h: Date.now() } };
};

/* Correcció 261026 («El pols del cervell: No s’han pogut llegir les dades») ·
   El parser mínim d'abans (còpia d'un tooling/brain/matrix.mjs que ja no el
   porta) no acceptava claus amb punt: les llistes de `contracte.llig:` i
   `contracte.escriu:` s'enganxaven a la clau anterior. En core-automillora,
   core-estrategia-ia i core-telemetria-huma eixa clau és `description`, que
   arribava com a llista, i normalitza (src/sections/consola/consolaContent.js)
   rebutjava consola.json sencer. Ara es llig amb l'únic parser lleuger del
   frontmatter (tooling/wiki/lib/frontmatter.mjs), el de cataleg_skills.mjs i
   build_skills_index.mjs, que coneix les claus amb punt i els blocs `>`/`|`. */
const frontmatter = (txt) => parseFrontmatter(txt ?? '').data;

export function recullConsola() {
  const diariData = parseJsonl(llig(path.join(AGENTS_DIR, '.diari_sessio.jsonl')));
  const diari = diariData.items;

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

  let credits = null;
  try {
    const txtCredits = llig(path.join(AGENTS_DIR, 'credits.json'));
    if (txtCredits) credits = JSON.parse(txtCredits);
  } catch { /* no hi ha */ }

  let estrategia_consum = null;
  try {
    estrategia_consum = llig(path.join(AGENTS_DIR, 'estrategia_consum.txt'));
  } catch { /* no hi ha */ }

  const immunitariData = parseJsonl(llig(path.join(PROJECT_DIR, '.immunitari', 'journal.ndjson')));
  const immunitari = immunitariData.items;

  return {
    generat: new Date().toISOString(),
    rebuts,
    consums,
    credits,
    estrategia_consum,
    skills,
    segell,
    immunitari: { operacions: immunitari.length, ultima: immunitari.at(-1) ?? null },
    fonts: { diari: diariData.font, immunitari: immunitariData.font }
  };
}

/* Només el mateix ordinador: la Consola descriu la maquinària interna. */
function local(req) {
  const ip = req.socket.remoteAddress;
  return req.method === 'GET' && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');
}

function servix(res, estat, cos) {
  res.statusCode = estat;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(cos));
}

export default function consolaIaia() {
  return {
    name: 'sdp:consola-iaia',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(RUTA_CONSOLA, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        servix(res, 200, recullConsola());
      });
      server.middlewares.use(RUTA_MAPA, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        // Un error del compilador es diu amb 500: la UI el pinta com a error, no com a buit.
        try { servix(res, 200, recullMapa(PROJECT_DIR)); }
        catch (e) { servix(res, 500, { error: e.message }); }
      });
    }
  };
}
