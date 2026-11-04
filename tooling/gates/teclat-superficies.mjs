/** FEDI-09 · Contracte de recorreguts de teclat per superfícies concretes.
 * Executa proves DOM dels components reals. No és un escàner de tot el
 * producte ni certifica WCAG AAA. SC 2.1.3 exigix tota la funcionalitat,
 * sense excepcions ni cadències de pulsació; Tab no és per si sol una prova.
 * Font: https://www.w3.org/WAI/WCAG22/Understanding/keyboard-no-exception.html
 * node tooling/gates/teclat-superficies.mjs [--list|--superficie=graf,...]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

const ARREL = arrelSegura();
const PS = 'src/components/PedraSeca/organismes/';
const U = 'src/components/universal/';
const superficie = (id, recorregut, proves) => Object.freeze({ id, recorregut, proves: Object.freeze(proves) });
export const SUPERFICIES_TECLAT = Object.freeze([
  superficie('dialeg', 'Entrar, recórrer controls visibles, eixir amb Escape i tornar al disparador; també incrustat.',
    [PS + 'Dialeg.test.jsx', PS + 'Dialeg.enrere.test.jsx', PS + 'PantallaCompleta.test.jsx']),
  superficie('identitats', 'Calaix real: focus inicial, Tab/Maj+Tab als extrems, Escape i retorn al disparador; controls natius d’identitat i peu.',
    [U + 'identitat/CalaixIdentitats.test.jsx', U + 'identitat/CalaixIdentitats.teclat.test.jsx']),
  superficie('workspace', 'Arbre, llista, detall i rails; fletxes i Escape sense interferir en camps, també a 375 i 800 px.',
    [U + 'workspace/UniversalWorkspace.teclat.test.jsx', U + 'workspace/UniversalWorkspace.focusDiferit.test.jsx']),
  superficie('calendari', 'Tria de dia i període amb fletxes, Inici/Fi i controls natius, sense alterar les dreceres.',
    [PS + 'VistaMes.test.jsx', PS + 'VistaAny.test.jsx', PS + 'SelectorDataHora.test.jsx']),
  superficie('imatges', 'Carrusel i visor: arribar a la foto, recórrer-la i tancar; selectors i metadades accessibles.',
    [PS + 'CarruselImatges.test.jsx', PS + 'VisorImatges.test.jsx']),
  superficie('enquadrament', 'Equivalent de moure i ampliar una imatge: fletxes, +/−, lliscadors i desat; modes senzill i complet.',
    [U + 'enquadrament/DialegEnquadrament.onada4.test.jsx', U + 'enquadrament/DialegEnquadrament.senzill.test.jsx']),
  superficie('graf', 'Pan de quatre direccions, zoom/pausa/centrat natius i selecció per l’explorador; Tab lliure, amb inspector i sense.',
    [U + 'graph/BrainGraph.test.jsx']),
  superficie('pestanyes', 'Pestanyes amb focus itinerant i recorregut de fletxes, Inici/Fi i Tab cap al panell.',
    [PS + 'Pestanyes.test.jsx']),
  superficie('multimedia', 'Graelles reals de fitxers, fotos i cronologia: moviment 2D i retorn al mestre.',
    ['src/sections/multimedia/graelles.teclat.test.jsx'])
]);

export const LIMITS_TECLAT = Object.freeze([
  'Cobertura DOM de les superfícies enumerades; jsdom no executa la tabulació ni l’activació nativa del navegador.',
  'La tria del graf sense inspector és responsabilitat del selector del consumidor; la Consola el proporciona.',
  'No acredita tots els processos de totes les rutes, editor ric/reordenació, mapes, widgets de tercers ni WebViews mòbils.',
  'La conformitat global 2.1.3 requerix revisar tota funcionalitat, inclosa qualsevol entrada dependent del recorregut.'
]);

export function triaSuperficies(args = []) {
  if (args.length === 1 && args[0] === '--list') return SUPERFICIES_TECLAT;
  if (!args.length) return SUPERFICIES_TECLAT;
  if (args.length !== 1 || !args[0].startsWith('--superficie=')) throw new Error('Ús: teclat-superficies.mjs [--list|--superficie=id,...]');
  const ids = args[0].slice('--superficie='.length).split(',');
  if (ids.some(id => !SUPERFICIES_TECLAT.some(s => s.id === id))) throw new Error('Superfície desconeguda o buida. Usa --list.');
  return SUPERFICIES_TECLAT.filter(s => ids.includes(s.id));
}

export function executaPortaTeclat({ args = [], arrel = ARREL, executar = spawnSync, escriu = console.log } = {}) {
  const superfices = triaSuperficies(args);
  const proves = [...new Set(superfices.flatMap(s => s.proves))];
  // La porta mai pot passar simplement perquè s’ha perdut una ruta o el runner.
  for (const fitxer of [...proves, 'node_modules/vitest/vitest.mjs']) {
    if (!existsSync(path.join(arrel, fitxer))) throw new Error(`Falta un fitxer del contracte: ${fitxer}`);
  }
  for (const s of superfices) escriu(`${s.id}: ${s.recorregut}`);
  for (const limit of LIMITS_TECLAT) escriu(`Límit: ${limit}`);
  if (args[0] === '--list') return 0;
  const resultat = executar(process.execPath, [path.join(arrel, 'node_modules/vitest/vitest.mjs'), 'run',
    '--maxWorkers=2', '--passWithNoTests=false', ...proves], { cwd: arrel, stdio: 'inherit' });
  if (resultat.error) throw resultat.error;
  if (resultat.signal || resultat.status !== 0) throw new Error(`Contracte de teclat fallit (${resultat.signal ?? resultat.status ?? 'sense resultat'}).`);
  escriu(`PASSA: ${superfices.length} superfícies, ${proves.length} fitxers executats. Abast local declarat; cap certificació global.`);
  return 0;
}

if (esMain(import.meta.url)) {
  try { process.exitCode = executaPortaTeclat({ args: process.argv.slice(2) }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
