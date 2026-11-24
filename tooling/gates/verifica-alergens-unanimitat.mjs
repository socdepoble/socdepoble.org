#!/usr/bin/env node
/** Read-only deterministic CLI. It never discovers, imports, starts or contacts
 * the live study. --file reads an explicit immutable checkpoint supplied by you. */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { CORPUS_UNANIMITAT, LIMITS_UNANIMITAT, ingereixResultatsUnanimitat, normalitzaCorpusUnanimitat } from '../../src/data/menjarIBeure/alergensPatrimoni.js';

function llegeixCheckpoint(fitxer) {
  let contingut = null, bytes = null, sha256 = null, errorLectura = null;
  if (fitxer !== null) {
    let fd;
    try {
      if (!fs.lstatSync(fitxer).isFile()) throw new Error('tipus_o_enllac');
      fd = fs.openSync(fitxer, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | fs.constants.O_NOFOLLOW);
      const stat = fs.fstatSync(fd);
      if (!stat.isFile() || stat.size > LIMITS_UNANIMITAT.entrada) throw new Error('tipus_o_limit');
      const buffer = Buffer.alloc(stat.size + 1);
      let llegits = 0, n;
      while (llegits < buffer.length && (n = fs.readSync(fd, buffer, llegits, buffer.length - llegits, null)) > 0) llegits += n;
      if (llegits !== stat.size) throw new Error('fitxer_canviant');
      const final = fs.fstatSync(fd);
      if (final.size !== stat.size || final.mtimeMs !== stat.mtimeMs || final.ctimeMs !== stat.ctimeMs) throw new Error('fitxer_canviant');
      const dades = buffer.subarray(0, llegits);
      bytes = dades.length; sha256 = createHash('sha256').update(dades).digest('hex');
      contingut = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(dades);
    } catch (e) { if (e?.code !== 'ENOENT') errorLectura = 'lectura_tipus_limit_canvi_o_utf8'; }
    finally { if (fd !== undefined) fs.closeSync(fd); }
  }
  return { contingut, bytes, sha256, errorLectura };
}
function resumeixCheckpoint({ contingut, bytes, sha256, errorLectura }) {
  const index = errorLectura ? { estat: 'malformat', registres: [], errors: [{ linia: 0, codi: errorLectura }], avisos: ['No es pot verificar el checkpoint.'] } : ingereixResultatsUnanimitat(contingut);
  return {
    estat: index.estat, bytes, sha256, registres: index.registres.length,
    consolidats: index.registres.filter(r => r.estatConsens !== 'PRECAUCIO_MAXIMA_REVISIO_MESTRE').length,
    pendentsRevisio: index.registres.filter(r => r.estatConsens === 'PRECAUCIO_MAXIMA_REVISIO_MESTRE').length,
    corpus: Object.fromEntries(CORPUS_UNANIMITAT.map(c => [c, index.registres.filter(r => normalitzaCorpusUnanimitat(r.corpus) === c).length])),
    errors: index.errors, avisos: index.avisos, certificacioExperta: false, coberturaEstudi: 'no_acreditada', identitatCatalegVerificada: 'nomes_herbari'
  };
}
export function verificaFitxerUnanimitat(fitxer = null) { return resumeixCheckpoint(llegeixCheckpoint(fitxer)); }
export async function preparaActualitzacioFitxerUnanimitat(fitxer = null, sha256Esperat = null) {
  const snapshot = llegeixCheckpoint(fitxer), summary = resumeixCheckpoint(snapshot);
  if (sha256Esperat !== null && (typeof sha256Esperat !== 'string' || !/^[a-f0-9]{64}$/.test(sha256Esperat) || sha256Esperat !== snapshot.sha256)) return { estat: 'malformat', errors: [{ linia: 0, codi: 'hash_checkpoint' }] };
  if (!['pendent', 'validat'].includes(summary.estat)) return summary;
  const [{ creaActualitzacioUnanimitat }, { CATALEG_UNANIMITAT }] = await Promise.all([
    import('../../src/data/menjarIBeure/actualitzacioUnanimitat.js'), import('./lib/cataleg-unanimitat.mjs')
  ]);
  const update = creaActualitzacioUnanimitat(snapshot.contingut, CATALEG_UNANIMITAT);
  if (update.estat !== 'parcial') return update;
  return { ...update, font: { bytes: snapshot.bytes, sha256: snapshot.sha256 },
    catalegSha256: createHash('sha256').update(JSON.stringify(CATALEG_UNANIMITAT)).digest('hex'),
    jsonlSha256: createHash('sha256').update(update.jsonl).digest('hex') };
}
export function executaVerificadorUnanimitat(args, escriu = s => process.stdout.write(s)) {
  let fitxer = null, estricte = false, parcial = false, sha256 = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') continue;
    if (args[i] === '--strict') { estricte = true; continue; }
    if (args[i] === '--partial' && !parcial) { parcial = true; continue; }
    if (args[i] === '--sha256' && sha256 === null && /^[a-f0-9]{64}$/.test(args[i + 1] || '')) { sha256 = args[++i]; continue; }
    if (args[i] === '--file' && i + 1 < args.length && !args[i + 1].startsWith('--') && fitxer === null) { fitxer = args[++i]; continue; }
    if (args[i] === '--help') { escriu('Ús: node tooling/gates/verifica-alergens-unanimitat.mjs [--file CAMÍ] [--strict | --partial [--sha256 HASH]] [--json]\nSense fitxer: avís absent; dades pendents no bloquegen llevat de --strict. --partial valida tot el checkpoint i el catàleg abans de projectar només consolidats; no es combina amb --strict. Malformat: exit 1. Eixida JSON determinista, només lectura.\n'); return 0; }
    escriu(`${JSON.stringify({ estat: 'arguments_invalids', errors: ['Opció desconeguda, duplicada o incompleta.'] })}\n`); return 2;
  }
  if (parcial && estricte || sha256 !== null && !parcial) { escriu(`${JSON.stringify({ estat: 'arguments_invalids', errors: ['Modes incompatibles.'] })}\n`); return 2; }
  if (parcial) return preparaActualitzacioFitxerUnanimitat(fitxer, sha256).then(resultat => {
    escriu(`${JSON.stringify(resultat)}\n`); return resultat.estat === 'parcial' ? 0 : 1;
  });
  const resultat = verificaFitxerUnanimitat(fitxer);
  escriu(`${JSON.stringify(resultat)}\n`);
  return resultat.estat === 'malformat' || estricte && resultat.estat !== 'validat' ? 1 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await executaVerificadorUnanimitat(process.argv.slice(2));
