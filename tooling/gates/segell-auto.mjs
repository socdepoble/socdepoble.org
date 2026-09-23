#!/usr/bin/env node
/** Resegellat automàtic de les skills després d'una escriptura amb eina.
 *
 *  El problema: `CLAUDE.md` ordena escriure la lliçó del Mestre dins de la
 *  `SKILL.md` corresponent, i cap dels quatre passos del REFLEX DE CORRECCIÓ
 *  resegella. Com que la Porta Segell és la tercera de 48, aprendre una cosa
 *  apagava tota la cadena fins que algú se'n recordava. El sistema immunitari
 *  s'apagava justament quan el Mestre ensenyava alguna cosa.
 *
 *  Per què açò no afluixa la Llei Z: el segell declara que protegix contra
 *  modificacions «d'amagat». Una escriptura feta amb l'eina de l'agent no és
 *  amagada —queda al transcript i al `git diff`—, i a més es deixa traça ací:
 *  `.agents/runtime/segell.log` (JSONL append-only, hash anterior i nou). El
 *  que continua trencant el segell, i ha de trencar-lo, és tot allò que entra
 *  per fora: un editor manual, un `git checkout`, un altre procés.
 *
 *  Mai falla l'operació: un hook `PostToolUse` que ix ≠ 0 convertiria una
 *  comoditat en un maldecap. Sempre exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { verificaSegell } from './segella.mjs';

const ARREL = process.env.SDP_ARREL || process.cwd();
const TRACA = '.agents/runtime/segell.log';

/** L'escriptura toca una regla segellada? */
export function tocaSkill(fitxer, arrel = ARREL) {
  if (typeof fitxer !== 'string' || !fitxer) return false;
  const rel = (path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer)
    .split(path.sep).join('/');
  return rel.startsWith('.agents/skills/') && rel.endsWith('.md');
}

function rutaDelPayload(payload) {
  const ti = payload.tool_input;
  const ta = payload.toolArgs;
  return ti?.file_path || ti?.notebook_path || ta?.TargetFile || null;
}

function traca(arrel, registre) {
  const fitxer = path.join(arrel, TRACA);
  fs.mkdirSync(path.dirname(fitxer), { recursive: true });
  fs.appendFileSync(fitxer, `${JSON.stringify(registre)}\n`, 'utf8');
}

export function resegellaSiCal(fitxer, arrel = ARREL) {
  if (!tocaSkill(fitxer, arrel)) return { fet: false, motiu: 'fora de la superfície segellada' };
  const estat = verificaSegell(arrel);
  if (estat.ok) return { fet: false, motiu: 'segell intacte' };

  const nou = verificaSegell(arrel, { update: true });
  traca(arrel, {
    quan: new Date().toISOString(),
    fitxer,
    anterior: nou.anterior,
    nou: nou.hash,
    motiu: 'escriptura amb eina sobre .agents/skills/'
  });
  return { fet: true, anterior: nou.anterior, nou: nou.hash };
}

function main() {
  let payload = {};
  try { payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* sense payload, res a fer */ }
  const fitxer = rutaDelPayload(payload);
  if (!fitxer) return;
  const r = resegellaSiCal(fitxer, ARREL);
  if (r.fet) {
    console.error(`[Llei Z] Skills resegellades automàticament (${String(r.anterior).substring(0, 8)} → ${r.nou.substring(0, 8)}). Traça a ${TRACA}.`);
  }
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch (e) { console.error(`[segell-auto] ${e.message}`); }
  process.exitCode = 0;
}
