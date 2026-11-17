#!/usr/bin/env node
/** JARVIS 2: només lectura per defecte. Diagnòstic POSIX amb descriptors i O_NOFOLLOW.
 * Neteja bloquejada: falta exclusió atòmica d’escriptors amb el mateix UID.
 * Windows: diagnòstic de disc, neteja bloquejada fins adaptador natiu segur.
 * No toca mai snapshots, clons, repositoris, DerivedData, Gradle ni documents.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

export function validaComponentPortable(value) {
  if (typeof value !== 'string' || !value || value === '.' || value === '..'
    || /[\\/<>:"|?*\p{Cc}]/u.test(value) || /[ .]$/.test(value)
    || /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu.test(value)) throw new TypeError('COMPONENT_NO_PORTABLE');
  return value;
}
export function diagnosticar({ home = os.homedir(), plataforma = process.platform, neteja = false } = {}) {
  let disc = { totalBytes: null, lliureBytes: null }; const avisos = [];
  try {
    // statfs és natiu de Node: no depén de df ni de l'idioma de Windows.
    const s = fs.statfsSync(home, { bigint: true });
    const total = s.blocks * s.bsize; const lliure = s.bavail * s.bsize;
    if (total <= BigInt(Number.MAX_SAFE_INTEGER) && lliure <= BigInt(Number.MAX_SAFE_INTEGER))
      disc = { totalBytes: Number(total), lliureBytes: Number(lliure) };
    else avisos.push('DISC_FORA_DE_RANG_SEGUR');
  } catch (error) { avisos.push(`DISC_NO_MESURAT:${error.code ?? error.name}`); }
  if (neteja) avisos.push('NETEJA_ATOMICA_NO_DISPONIBLE');
  let bosses = [];
  if (!['darwin', 'linux'].includes(plataforma)) avisos.push('NETEJA_NO_DISPONIBLE_EN_AQUESTA_PLATAFORMA');
  else {
    try {
      const raw = execFileSync('python3', [path.join(HERE, 'sentinella-posix.py')], {
        input: JSON.stringify({ home, neteja }), encoding: 'utf8', timeout: 55000,
        maxBuffer: 65536, stdio: ['pipe', 'pipe', 'pipe']
      });
      const r = JSON.parse(raw);
      if (!Array.isArray(r.bosses)) throw new Error('RESPOSTA_INVALIDA');
      bosses = r.bosses;
    } catch (error) {
      // R32.3 · El helper escriu {"error":"CODI"} a stdout i ix amb 1: es conserva el codi, no un «Error» mut.
      let codi = error.code ?? error.name;
      try {
        const motiu = JSON.parse(error.stdout ?? '')?.error;
        if (typeof motiu === 'string' && /^[A-Za-z_]{1,64}$/.test(motiu)) codi = motiu;
      } catch { /* stdout sense JSON: es conserva el codi del procés */ }
      avisos.push(`INVENTARI_NO_DISPONIBLE:${codi}`);
    }
  }
  const bytesEliminats = bosses.reduce((s, b) => s + b.bytesEliminats, 0);
  return { versio: 2, plataforma, mode: neteja ? 'neteja-segura' : 'lectura', disc, bosses, bytesEliminats,
    bytesAlliberats: null, avisos,
    resum: avisos.length || bosses.some((b) => ['bloquejat', 'parcial'].includes(b.estat))
      ? 'Diagnòstic parcial: revisa els avisos abans de continuar.'
      : 'Lectura local completada. Les dades personals es conserven.' };
}
export function main(args = process.argv.slice(2)) {
  if (args.some((arg) => !['--json', '--neteja-segura'].includes(arg)) || new Set(args).size !== args.length) {
    throw new TypeError('Ús: sentinella-jarvis-espai.mjs [--json] [--neteja-segura]');
  }
  const r = diagnosticar({ neteja: args.includes('--neteja-segura') });
  console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : [r.resum,
    `Disc lliure: ${r.disc.lliureBytes === null ? 'desconegut' : `${r.disc.lliureBytes} B`}`,
    ...r.bosses.map((b) => `${b.id}: ${b.estat}; ${b.bytes ?? 'desconegut'} B; eliminats ${b.bytesEliminats} B${b.error ? `; ${b.error}` : ''}`),
    ...r.avisos].join('\n'));
  return r;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
