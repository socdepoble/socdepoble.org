#!/usr/bin/env node
/** R32.9: read-only structural audit. It does not install hooks, close turns or certify daemon liveness. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { recullMapa, recullFonts } from '../brain/mapa-consola.mjs';
import { productorsDeLaInstantania, rebutsAcreditats } from '../vite/consola-iaia.mjs';
import { comprovaPublicabilitat } from '../vite/instantania-consola.mjs';
import { IMATGES_CONSOLA } from '../../src/sections/consola/imatgesConsola.js';

export function reutilitzacionsImatges(root, imatges = IMATGES_CONSOLA) {
  const grups = new Map(), absents = [];
  for (const [id, item] of Object.entries(imatges).sort(([a], [b]) => a.localeCompare(b))) {
    const ruta = item?.imatge;
    if (typeof ruta !== 'string' || !ruta.startsWith('/assets/') || ruta.split('/').includes('..')) { absents.push(id); continue; }
    try {
      const bytes = fs.readFileSync(path.join(root, 'public', ruta));
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      grups.set(hash, [...(grups.get(hash) ?? []), id]);
    } catch { absents.push(id); }
  }
  const grupsRepetits = [...grups.values()].filter(ids => ids.length > 1).sort((a, b) => a[0].localeCompare(b[0]));
  return { reutilitzacions: grupsRepetits.reduce((n, ids) => n + ids.length - 1, 0), grups: grupsRepetits, absents };
}

/** Same inputs and explicit clock produce identical JSON. The clock is never counted as pulse. */
export async function auditaConsola(root, { ara = Date.now(), estricte = false, imatges = IMATGES_CONSOLA } = {}) {
  if (!Number.isFinite(ara)) throw new Error('Rellotge invàlid');
  const opcions = { ara, diagnostic: false, instantania: true, home: path.join(root, '.agents/runtime/home'), plataforma: 'linux' };
  const fonts = recullFonts(root, opcions), mapa = recullMapa(root, { ...opcions, fonts });
  const skills = mapa.nodes.filter(n => n.tipus === 'skill');
  const avisos = mapa.avisos.map(a => ({ node: a.node, codi: a.codi, severitat: a.severitat }));
  const dimensions = fonts.cervell?.dimensions ?? [];
  const assignades = dimensions.flatMap(d => d.skills ?? []);
  const noms = fonts.skillsDisc?.map(s => s.nom) ?? [];
  const dimensionsValides = dimensions.length === 8 && new Set(dimensions.map(d => d.id)).size === 8
    && assignades.length === noms.length && new Set(assignades).size === noms.length && noms.every(n => assignades.includes(n));
  let perduts = null;
  try {
    perduts = execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', 'ls-files', '--deleted', '-z'],
      { cwd: root, encoding: 'utf8', timeout: 1000, maxBuffer: 1024 * 1024 }).split('\0').filter(Boolean).sort();
  } catch { /* An unreadable repository is not a clean repository. */ }
  const productors = { ...productorsDeLaInstantania({ arrel: root, ara }), mapa: () => mapa };
  const publicabilitat = await comprovaPublicabilitat({ productors, usuari: null });
  const images = reutilitzacionsImatges(root, imatges);
  const errorsProductors = publicabilitat.fonts.filter(f => f.estat !== 'ok').map(f => ({ font: f.font, estat: f.estat }));
  const perdutsReferenciats = perduts?.filter(ruta => mapa.nodes.some(n => n.font === ruta || n.id === `document:${ruta}` || n.id === `script:${ruta}`) || ['AGENTS.md', 'CLAUDE.md', 'package.json'].includes(ruta)) ?? null;
  const motorValid = avisos.length === 0 && skills.length > 0 && dimensionsValides && perdutsReferenciats !== null && perdutsReferenciats.length === 0 && errorsProductors.length === 0;
  const imatgesValides = images.reutilitzacions === 0 && images.absents.length === 0;
  const rebuts = rebutsAcreditats(root, ara);
  return {
    schema: 'sdp.consola-neta.v1', valid: motorValid && (!estricte || imatgesValides), mode: estricte ? 'estricte' : 'motor',
    tornsHistoricsPreRebut: mapa.tornsHistoricsPreRebut,
    motor: { valid: motorValid, skills: skills.length, roges: skills.filter(n => avisos.some(a => a.node === n.id && a.severitat === 'alta')).length,
      orfenes: avisos.filter(a => a.codi === 'orfe').length, dimensions: dimensions.length, dimensionsValides,
      fontsGenerades: fonts.derivades, perdutsVersionats: perduts, perdutsReferenciats, avisos },
    documentacio: { esborranysEnCurs: fonts.portaDocuments?.enCurs ?? [],
      caducatsNoVerificats: fonts.portaDocuments?.caducatsNoVerificats ?? [],
      limit: 'Inventari públic de treball vigent o abandonat; mai certificació de tancament documental.' },
    publicabilitat: { valid: publicabilitat.publicable && errorsProductors.length === 0, fonts: publicabilitat.fonts.map(f => ({ font: f.font, estat: f.estat })) },
    pols: { rebutsAcreditats: rebuts.length, ultim: rebuts[0]?.t ?? null },
    imatges: { valid: imatgesValides, ...images, dependencia: imatgesValides ? null : 'Integració de portades diferenciades de Gemini pendent; --estricte continua roig.' },
    noCertifica: ['Instal·lació o execució dels serveis locals i dels hooks programats', 'Tancament documental; el mode públic només identifica drafts acreditats en curs', 'Retirades versionades sense referències: es reporten i cal revisar-les amb el manifest del kit']
  };
}

if (esMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some(a => !['--json', '--estricte'].includes(a) && !a.startsWith('--arrel=') && !a.startsWith('--ara='))) throw new Error('Ús: [--json] [--estricte] [--arrel=RUTA] [--ara=ISO]');
    const arrel = args.find(a => a.startsWith('--arrel='))?.slice(8);
    const ara = args.find(a => a.startsWith('--ara='))?.slice(6);
    const result = await auditaConsola(arrel ? path.resolve(arrel) : arrelSegura(), { estricte: args.includes('--estricte'), ...(ara ? { ara: Date.parse(ara) } : {}) });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.valid ? 0 : 1;
  } catch { console.log(JSON.stringify({ schema: 'sdp.consola-neta.v1', valid: false, error: 'No s’ha pogut completar l’auditoria de lectura.' })); process.exitCode = 2; }
}
