#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
/**
 * neteja_brain.mjs — Poda Termodinàmica del "brain" d'Antigravity
 *
 * PRINCIPI (Trellat): automatitzar allò REVERSIBLE, barrar allò IRREVERSIBLE.
 *  - Moure a quarantena = reversible → es pot programar setmanalment.
 *  - Buidar la quarantena = destrucció → sempre manual, amb doble senyal
 *    (--buida-quarantena --procedeix), en compliment de la Llei 3 del
 *    Genotip (Wait Paradigm / DEFCON 1).
 *
 * QUÈ ÉS SAGRAT (mai es toca):
 *  - .md / .canvas (memòria històrica i context estructural)
 *  - .json (estat, manifests) — excepte .jsonl dins de carpetes de logs
 *  - Qualsevol carpeta amb nom de memòria: wiki, memoria, actes, knowledge
 *
 * QUÈ ES PODA (per antiguitat, mtime):
 *  - Gravacions de navegador  .webm .mp4 .mov .mkv .gif      > 7 dies
 *  - Captures dins de carpetes screenshots/captures/frames    > 14 dies
 *  - Artefactes de depuració  .heapsnapshot .cpuprofile .har .trace > 3 dies
 *  - Logs .log .jsonl (i .txt dins de carpetes log*)           > 7 dies → gzip
 *    Logs ja comprimits .gz                                    > 30 dies → quarantena
 *
 * FLUX:
 *   node neteja_brain.mjs /ruta/al/brain                # dry-run + acta
 *   node neteja_brain.mjs /ruta/al/brain --procedeix    # gzip + quarantena
 *   node neteja_brain.mjs /ruta --agressiu --procedeix  # llindars curts
 *   node neteja_brain.mjs /ruta --buida-quarantena --procedeix  # DESTRUEIX lots > 15 dies
 *   node neteja_brain.mjs /ruta --restaura=<carpeta_lot>        # desfà un lot sencer
 *
 * Programació suggerida (El Gran Batec, diumenge 04:00, només reversible):
 *   0 4 * * 0  node /ruta/scripts/neteja_brain.mjs /ruta/brain --procedeix --json >> neteja.log
 *
 * Zero dependències externes (Pedra Seca). Node >= 20.
 */
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import path from 'node:path';
import os from 'node:os';

/* ----------------------------- POLÍTICA ----------------------------- */
const POLITICA = (agressiu) => ({
  gravacions: { ext: ['.webm', '.mp4', '.mov', '.mkv', '.gif'], dies: agressiu ? 2 : 7 },
  captures:   { ext: ['.png', '.jpg', '.jpeg', '.webp'], dies: agressiu ? 5 : 14,
                nomesDins: /^(screenshots?|captures?|frames?|artifacts?)$/i },
  depuracio:  { ext: ['.heapsnapshot', '.cpuprofile', '.har', '.trace'], dies: agressiu ? 1 : 3 },
  logsGzip:   { ext: ['.log', '.jsonl'], extDinsLogs: ['.txt'], dies: agressiu ? 2 : 7 },
  gzVells:    { ext: ['.gz'], dies: agressiu ? 10 : 30 },
});
const DIES_QUARANTENA = 15;
const EXT_SAGRADES = new Set(['.md', '.markdown', '.canvas', '.json']);
const DIRS_SAGRATS = /^(wiki|memoria|memòria|actes|knowledge|_wiki_de_poble)$/i;
const DIR_QUARANTENA = '_quarantena_termodinamica';
const NOM_DIR_LOGS = /^(logs?|sessions?|traces?)$/i;

const MS_DIA = 86_400_000;
const araTs = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};
const gb = (b) => (b / 1024 ** 3).toFixed(2);
const mb = (b) => (b / 1024 ** 2).toFixed(1);

/* ----------------------------- INVENTARI ---------------------------- */
async function inventaria(arrel) {
  const fitxers = [];
  async function camina(dir, dinsSagrat) {
    let items;
    try { items = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (it.name === DIR_QUARANTENA || it.name === '.git' || it.name === 'node_modules') continue;
      const ple = path.join(dir, it.name);
      if (it.isDirectory()) {
        await camina(ple, dinsSagrat || DIRS_SAGRATS.test(it.name));
      } else if (it.isFile()) {
        let st;
        try { st = await fs.stat(ple); } catch { continue; }
        fitxers.push({
          ple, rel: path.relative(arrel, ple), nom: it.name,
          ext: path.extname(it.name).toLowerCase(),
          dirPare: path.basename(dir),
          dinsLogs: NOM_DIR_LOGS.test(path.basename(dir)),
          dinsSagrat, bytes: st.size, mtime: st.mtimeMs,
          edatDies: (Date.now() - st.mtimeMs) / MS_DIA,
        });
      }
    }
  }
  await camina(arrel, false);
  return fitxers;
}

/* --------------------------- CLASSIFICACIÓ -------------------------- */
function classifica(f, P) {
  if (f.dinsSagrat) return { accio: 'sagrat', motiu: 'carpeta de memòria' };
  if (EXT_SAGRADES.has(f.ext) && !(f.ext === '.json' && f.dinsLogs)) {
    return { accio: 'sagrat', motiu: 'extensió sagrada' };
  }
  if (P.gravacions.ext.includes(f.ext)) {
    return f.edatDies > P.gravacions.dies
      ? { accio: 'quarantena', motiu: `gravació > ${P.gravacions.dies} dies` }
      : { accio: 'espera', motiu: 'gravació recent' };
  }
  if (P.captures.ext.includes(f.ext)) {
    if (!P.captures.nomesDins.test(f.dirPare)) return { accio: 'avis', motiu: 'imatge fora de carpeta de captures (revisió manual)' };
    return f.edatDies > P.captures.dies
      ? { accio: 'quarantena', motiu: `captura > ${P.captures.dies} dies` }
      : { accio: 'espera', motiu: 'captura recent' };
  }
  if (P.depuracio.ext.includes(f.ext)) {
    return f.edatDies > P.depuracio.dies
      ? { accio: 'quarantena', motiu: `artefacte de depuració > ${P.depuracio.dies} dies` }
      : { accio: 'espera', motiu: 'depuració recent' };
  }
  const esLog = P.logsGzip.ext.includes(f.ext) || (f.dinsLogs && P.logsGzip.extDinsLogs.includes(f.ext));
  if (esLog) {
    return f.edatDies > P.logsGzip.dies
      ? { accio: 'gzip', motiu: `log > ${P.logsGzip.dies} dies` }
      : { accio: 'espera', motiu: 'log recent' };
  }
  if (P.gzVells.ext.includes(f.ext)) {
    return f.edatDies > P.gzVells.dies
      ? { accio: 'quarantena', motiu: `.gz > ${P.gzVells.dies} dies` }
      : { accio: 'espera', motiu: '.gz recent' };
  }
  return { accio: 'ignora', motiu: 'fora de política' };
}

/* ----------------------------- OPERACIONS --------------------------- */
async function mouASalvaguarda(f, dirLot, arrel) {
  const desti = path.join(dirLot, f.rel);
  await fs.mkdir(path.dirname(desti), { recursive: true });
  try { await fs.rename(f.ple, desti); }
  catch { await fs.copyFile(f.ple, desti); await fs.unlink(f.ple); }
  return { origen: f.rel, quarantena: path.relative(arrel, desti), bytes: f.bytes, mtime: f.mtime };
}

async function comprimix(f) {
  const desti = `${f.ple}.gz`;
  await pipeline(createReadStream(f.ple), createGzip({ level: 9 }), createWriteStream(desti));
  const st = await fs.stat(desti);
  if (st.size <= 0) throw new Error(`gzip buit: ${f.rel}`);
  await fs.unlink(f.ple);
  return f.bytes - st.size;
}

async function buidaQuarantena(arrel, procedeix) {
  const base = path.join(arrel, DIR_QUARANTENA);
  let lots = [];
  try { lots = (await fs.readdir(base, { withFileTypes: true })).filter((d) => d.isDirectory()); }
  catch { console.log('   Quarantena inexistent: res a buidar.'); return 0; }
  let alliberats = 0;
  for (const lot of lots) {
    const ruta = path.join(base, lot.name);
    const st = await fs.stat(ruta);
    const edat = (Date.now() - st.mtimeMs) / MS_DIA;
    if (edat <= DIES_QUARANTENA) { console.log(`   Lot ${lot.name}: ${edat.toFixed(0)} dies, es conserva.`); continue; }
    if (procedeix) {
      await fs.rm(ruta, { recursive: true, force: true });
      console.log(`   🔥 DESTRUÏT lot ${lot.name} (> ${DIES_QUARANTENA} dies).`);
    } else {
      console.log(`   [DRY-RUN] Es destruiria el lot ${lot.name} (> ${DIES_QUARANTENA} dies).`);
    }
    alliberats++;
  }
  return alliberats;
}

async function restaura(arrel, carpetaLot) {
  const manifest = JSON.parse(await fs.readFile(path.join(carpetaLot, 'MANIFEST_QUARANTENA.json'), 'utf8'));
  for (const e of manifest.fitxers) {
    const origen = path.join(arrel, e.quarantena);
    const desti = path.join(arrel, e.origen);
    await fs.mkdir(path.dirname(desti), { recursive: true });
    await fs.rename(origen, desti);
  }
  console.log(`✅ Restaurats ${manifest.fitxers.length} fitxers del lot.`);
}

/* ------------------------------- MAIN ------------------------------- */
export async function netejaBrain(brainDir, opts = {}) {
  const { procedeix = false, agressiu = false, json = false } = opts;
  if (procedeix) {
    throw new Error('SDP-LOCK: --procedeix retirat fins integrar esta operació externa amb rebut i rollback del Reflex.');
  }
  const arrel = path.resolve(brainDir);

  // Barreres de seguretat físiques
  if (arrel === path.parse(arrel).root || arrel === os.homedir()) {
    throw new Error('SDP-LOCK: em negue a operar sobre l\'arrel del sistema o el home.');
  }
  await fs.access(arrel);
  if (!/brain/i.test(path.basename(arrel)) && !opts.confirmaRuta) {
    throw new Error(`SDP-LOCK: "${path.basename(arrel)}" no pareix un brain. Usa --confirma-ruta si n'estàs segur.`);
  }

  const P = POLITICA(agressiu);
  const fitxers = await inventaria(arrel);
  const total = fitxers.reduce((s, f) => s + f.bytes, 0);

  const pla = fitxers.map((f) => ({ f, ...classifica(f, P) }));
  const per = (a) => pla.filter((x) => x.accio === a);
  const bytesDe = (xs) => xs.reduce((s, x) => s + x.f.bytes, 0);

  const aQuarantena = per('quarantena');
  const aGzip = per('gzip');
  const avisos = per('avis');
  const top10 = [...fitxers].sort((a, b) => b.bytes - a.bytes).slice(0, 10);

  console.log(`\n🧠 Brain: ${arrel}`);
  console.log(`   Volum total: ${gb(total)} GB en ${fitxers.length} fitxers ${agressiu ? '(MODE AGRESSIU)' : ''}`);
  console.log(`   → Quarantena (reversible): ${aQuarantena.length} fitxers, ${gb(bytesDe(aQuarantena))} GB`);
  console.log(`   → Gzip de logs:            ${aGzip.length} fitxers, ${gb(bytesDe(aGzip))} GB abans de comprimir`);
  console.log(`   → Sagrats intocables:      ${per('sagrat').length} · En espera: ${per('espera').length} · Avisos: ${avisos.length}`);
  console.log(`\n   TOP 10 més pesats (informatiu):`);
  top10.forEach((f) => console.log(`     ${mb(f.bytes).padStart(8)} MB  ${f.rel}`));

  const ts = araTs();
  const dirLot = path.join(arrel, DIR_QUARANTENA, ts);
  const manifest = { creat: ts, agressiu, fitxers: [] };
  let bytesGzipEstalviats = 0;

  if (procedeix) {
    for (const x of aQuarantena) manifest.fitxers.push(await mouASalvaguarda(x.f, dirLot, arrel));
    for (const x of aGzip) {
      try { bytesGzipEstalviats += await comprimix(x.f); }
      catch (e) { console.warn(`   ⚠️ gzip fallit (${x.f.rel}): ${e.message}`); }
    }
    if (manifest.fitxers.length) {
      await fs.mkdir(dirLot, { recursive: true });
      await fs.writeFile(path.join(dirLot, 'MANIFEST_QUARANTENA.json'), JSON.stringify(manifest, null, 2));
    }
  }

  // El dry-run és literal: no crea actes ni directoris.
  const acta = [
    `# ${ts} — ACTA Neteja Termodinàmica del Brain`,
    `Mode: ${procedeix ? 'EXECUTAT' : 'DRY-RUN'} · Agressiu: ${agressiu}`,
    `Volum inicial: ${gb(total)} GB`,
    `Quarantena: ${aQuarantena.length} fitxers (${gb(bytesDe(aQuarantena))} GB) → ${procedeix ? path.relative(arrel, dirLot) : '(proposta)'}`,
    `Gzip: ${aGzip.length} logs${procedeix ? ` · estalvi real ${gb(bytesGzipEstalviats)} GB` : ''}`,
    ``,
    `## Avisos (revisió humana)`,
    ...avisos.map((x) => `- ${x.f.rel} — ${x.motiu}`),
    ``,
    `## Detall quarantena`,
    ...aQuarantena.map((x) => `- ${mb(x.f.bytes)} MB · ${x.f.rel} — ${x.motiu}`),
  ].join('\n');
  if (procedeix) {
    const dirActes = path.join(arrel, DIR_QUARANTENA);
    await fs.mkdir(dirActes, { recursive: true });
    await fs.writeFile(path.join(dirActes, `${ts}_ACTA_Neteja.md`), acta, 'utf8');
  }

  const resum = {
    mode: procedeix ? 'EXECUTAT' : 'DRY-RUN',
    volumGB: Number(gb(total)),
    quarantena: { fitxers: aQuarantena.length, gb: Number(gb(bytesDe(aQuarantena))) },
    gzip: { fitxers: aGzip.length, gbEstalviats: Number(gb(bytesGzipEstalviats)) },
    avisos: avisos.length,
  };
  if (json) console.log(JSON.stringify(resum, null, 2));
  else if (!procedeix) console.log(`\n   🐑 DRY-RUN: res tocat. Revisa l'acta i llança amb --procedeix.`);
  return resum;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const ruta = args.find((a) => !a.startsWith('--'));
  const flags = {
    procedeix: args.includes('--procedeix'),
    agressiu: args.includes('--agressiu'),
    json: args.includes('--json'),
    confirmaRuta: args.includes('--confirma-ruta'),
  };
  const restauraArg = args.find((a) => a.startsWith('--restaura='));

  (async () => {
    if (!ruta) throw new Error('Ús: node neteja_brain.mjs <ruta_al_brain> [--procedeix] [--agressiu] [--buida-quarantena] [--restaura=<lot>]');
    if (restauraArg) throw new Error('SDP-LOCK: --restaura requerix una operació Reflex específica.');
    if (args.includes('--buida-quarantena')) {
      throw new Error('SDP-LOCK: el buidatge irreversible de quarantena està retirat.');
    }
    return netejaBrain(ruta, flags);
  })().catch((err) => { console.error('❌ [NETEJA BRAIN]', err.message); process.exit(1); });
}
