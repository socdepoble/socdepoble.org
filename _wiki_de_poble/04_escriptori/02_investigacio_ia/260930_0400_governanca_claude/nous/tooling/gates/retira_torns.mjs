#!/usr/bin/env node
/** retira_torns.mjs — retirada dels torns caducats, sense fingir cap tancament.
 *
 *  Un torn caducat no es pot tornar a escriure (readTurn diu «Torn caducat»), i
 *  per tant no es pot tancar mai: el 260930 el Mapa de la Consola en comptava
 *  101. Retirar-lo el deixa en l'estat terminal `retired`, que no és `closed`:
 *  no acredita cap verificació, conserva rebuts, pla i inventari, i deixa una
 *  línia a `history` amb la nota de qui ho ordena. L'escriptura és la de
 *  `retireExpiredTurn` (tooling/documental/turns.mjs): el mateix pany i la
 *  mateixa escriptura atòmica que qualsevol altra mutació d'un torn.
 *
 *  Ús (des de l'arrel):
 *    node tooling/gates/retira_torns.mjs [--sec]                # només llista; és el mode per defecte
 *    node tooling/gates/retira_torns.mjs --escriu --nota TEXT   # retira els de la llista
 *
 *  Mai toca un torn viu, un de tancat ni un de ja retirat: la llista els deixa
 *  fora, i `retireExpiredTurn` ho torna a comprovar davall del pany de cada
 *  registre. Un registre il·legible es diu i no es toca. Eixida JSON per stdout;
 *  codi 0 si tot ha anat bé, 1 si algun torn no s'ha pogut retirar (el JSON diu
 *  quin i per què) i 2 per a un ús incorrecte.
 */
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { OPEN_STATES, retireExpiredTurn } from '../documental/turns.mjs';

export const DIR_TORNS = '.agents/runtime/turns';
const US = 'Ús: retira_torns.mjs [--sec] | --escriu --nota TEXT';

/** Torns oberts i caducats (o sense caducitat llegible): els únics retirables. */
export function retirables(root, { now = Date.now() } = {}) {
  const out = { retirables: [], illegibles: [] };
  let noms;
  // Només registres: ni els `.lock` ni els `.tmp` de l'escriptura atòmica.
  try { noms = fs.readdirSync(path.join(root, DIR_TORNS)).filter((n) => /^torn_.+\.json$/.test(n)).sort(); }
  catch { return out; }
  for (const nom of noms) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(root, DIR_TORNS, nom), 'utf8')); }
    catch (e) { out.illegibles.push({ fitxer: nom, motiu: e.message }); continue; }
    if (!t || typeof t !== 'object' || `${t.turn_id}.json` !== nom) {
      out.illegibles.push({ fitxer: nom, motiu: 'turn_id absent o diferent del nom del fitxer' });
      continue;
    }
    if (!OPEN_STATES.includes(t.state)) continue;
    const expira = Date.parse(t.expiresAt);
    if (Number.isFinite(expira) && expira > now) continue;
    out.retirables.push({
      id: t.turn_id, actor: t.actor ?? null, scope: t.scope ?? null, state: t.state,
      createdAt: t.createdAt ?? null, expiresAt: t.expiresAt ?? null,
      rebuts: t.receipts && typeof t.receipts === 'object' ? Object.keys(t.receipts).length : 0,
      ambPla: t.plan !== null && t.plan !== undefined
    });
  }
  return out;
}

/** Retira els de `retirables`. Un que falla (pany ocupat, torn tancat entretant) va a `errors` i la resta continua. */
export function retira(root, { nota, now = Date.now() } = {}) {
  if (typeof nota !== 'string' || !nota.trim()) throw new Error(`--escriu necessita --nota TEXT: la retirada diu qui l'ordena i per què. ${US}`);
  const { retirables: llista, illegibles } = retirables(root, { now });
  const retirats = [];
  const errors = [];
  for (const t of llista) {
    try { retireExpiredTurn(root, t.id, { note: nota, now }); retirats.push(t); }
    catch (e) { errors.push({ id: t.id, motiu: e.message }); }
  }
  return { retirats, errors, illegibles };
}

/** Banderes. Una de desconeguda, o una combinació sense sentit, falla: mai es llig com a --sec ni com a --escriu. */
function opcions(argv) {
  const o = { sec: false, escriu: false, nota: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sec') o.sec = true;
    else if (a === '--escriu') o.escriu = true;
    else if (a === '--nota' || a.startsWith('--nota=')) {
      const valor = a === '--nota' ? argv[++i] : a.slice('--nota='.length);
      if (!valor || valor.startsWith('--')) throw new Error(`--nota necessita un text. ${US}`);
      o.nota = valor;
    } else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  if (o.sec && o.escriu) throw new Error(`Tria --sec o --escriu, no tots dos. ${US}`);
  if (o.nota !== null && !o.escriu) throw new Error(`--nota només val amb --escriu. ${US}`);
  if (o.escriu && !o.nota?.trim()) throw new Error(`--escriu necessita --nota TEXT. ${US}`);
  return o;
}

function main(argv) {
  const o = opcions(argv);
  const root = arrelSegura();
  const now = Date.now();
  const ara = new Date(now).toISOString();
  if (!o.escriu) {
    console.log(JSON.stringify({ mode: 'sec', ara, ...retirables(root, { now }) }, null, 2));
    return 0;
  }
  const r = retira(root, { nota: o.nota, now });
  console.log(JSON.stringify({ mode: 'escriu', ara, nota: o.nota.trim(), ...r }, null, 2));
  return r.errors.length ? 1 : 0;
}

if (esMain(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (e) {
    console.error(`[retira_torns] ${typeof e.informe === 'function' ? e.informe() : e.message}`);
    process.exitCode = 2;
  }
}
