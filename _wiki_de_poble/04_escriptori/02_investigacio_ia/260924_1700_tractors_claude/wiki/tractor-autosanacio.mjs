#!/usr/bin/env node
/**
 * tractor-autosanacio.mjs — Autosanació d'enllaços de la Wiki.
 *
 * DESTÍ: tooling/wiki/tractor-autosanacio.mjs (en quarantena al laboratori
 * 260924_1700_tractors_claude/wiki). npm: "porta:autosanacio".
 *
 * PER QUÈ EXISTIX
 *   `tractor-orfandat.mjs` compta enllaços trencats i ix 1. No diu per què
 *   s'han trencat ni què fer. El 260924 `00_index_identitat.md` va passar de
 *   `02_saber/` a `01_ser/` i `03_consola_termodinamica.md` es va convertir
 *   en una carpeta: el graf d'Obsidian es va omplir de nodes grisos i cap
 *   eina va proposar la cura. Este tractor la proposa i, quan la cura és
 *   única i mecànica, l'aplica.
 *
 * QUÈ FA
 *   1. Recull totes les fonts (.md operatius) i els destins (fonts + arxiu).
 *   2. Resol cada [[enllaç]] i [text](ruta.md) amb la semàntica d'Obsidian
 *      (sufix de ruta més llarg; lib/resolutor.mjs). El graf operatiu no
 *      inclou 90_arxiu_historic ni 01_produccio com a destí: un enllaç que
 *      només resol a l'arxiu és un enllaç trencat per a qui llig.
 *   3. Per a cada enllaç penjat, busca una cura, en este ordre:
 *        vault     `[[../10_actes/x]]`: el repositori el resol (relatiu a la
 *                  font) però Obsidian no (les rutes són relatives al vault)
 *                  i el pinta en gris → reescriu-lo relatiu al vault. [mecànica]
 *        fora-del-vault  el destí existix però fora de `_wiki_de_poble/`
 *                  (`[[AGENTS]]`, `[[00_INDEX_SKILLS]]`): Obsidian no el pot
 *                  veure. Enllaç Markdown o mirall: decisió humana.
 *        moviment  git diu que el fitxer s'ha mogut (renom, o D + ?? amb el
 *                  mateix nom) → reapunta a la ruta nova.        [mecànica]
 *        carpeta   el destí és ara una carpeta amb un únic índex
 *                  (00_portada, 00_index*, README) → apunta-hi.  [mecànica]
 *        arxiu     només existix a 90_arxiu_historic → reapuntar amb ruta o
 *                  despenjar: decisió humana.
 *        ambigu    diversos candidats → tria humana.
 *        cap       no hi ha cap candidat → decisió humana.
 *   4. `--aplica` reescriu només les cures mecàniques (vault, moviment, carpeta),
 *      conserva àlies i àncora (`[[x#s|Àlies]]`), i mai toca 01_produccio ni
 *      90_arxiu_historic. Tot el que requerix decisió es reporta.
 *
 * ÚS
 *   node tooling/wiki/tractor-autosanacio.mjs            # informe; exit 1 si hi ha penjats
 *   node tooling/wiki/tractor-autosanacio.mjs --aplica   # aplica les cures mecàniques
 *   node tooling/wiki/tractor-autosanacio.mjs --json
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, idempotent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain, CAMINS } from '../lib/arrel.mjs';
import { construeixIndex, resol, netejaDesti } from './lib/resolutor.mjs';

export const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|coverage|\.sdp-paperera|\.sdp-reflex|runtime)(\/|$)/;
const ARXIU = CAMINS.arxiuHistoric;
const HUMANA = `${CAMINS.escriptori}/01_produccio`;
const INDEXS_DE_CARPETA = [/^00_portada\.md$/i, /^00_index[^/]*\.md$/i, /^readme\.md$/i];

const posix = (p) => p.split(path.sep).join('/');
const esArxiu = (rel) => rel === ARXIU || rel.startsWith(`${ARXIU}/`);
const esHumana = (rel) => rel.toLowerCase().startsWith(`${HUMANA.toLowerCase()}/`);
const dinsVault = (rel) => rel === CAMINS.wiki || rel.startsWith(`${CAMINS.wiki}/`);

/** Tots els .md sota les arrels donades. `destins` inclou l'arxiu; `fonts` no. */
export function recull(root, arrels = [CAMINS.wiki, '.agents', 'AGENTS.md', 'CLAUDE.md']) {
  const destins = [];
  const walk = (rel) => {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs) || EXCLOU.test(rel)) return;
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) { for (const e of fs.readdirSync(abs).sort()) walk(posix(path.join(rel, e))); return; }
    if (/\.md$/i.test(rel)) destins.push(rel);
  };
  for (const a of arrels) walk(a);
  const operatius = destins.filter((r) => !esArxiu(r) && !esHumana(r));
  return { fonts: operatius, destins, operatius };
}

/** Enllaços d'un text amb línia, fora de blocs i codi inline. */
export function enllacos(text) {
  const out = [];
  let dinsCodi = false;
  text.split('\n').forEach((linia, i) => {
    if (/^\s*(```|~~~)/.test(linia)) { dinsCodi = !dinsCodi; return; }
    if (dinsCodi) return;
    const neta = linia.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
    for (const m of neta.matchAll(/\[\[([^\]]+)\]\]/g)) out.push({ tipus: 'wiki', linia: i + 1, cru: m[0], desti: m[1] });
    for (const m of neta.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const d = m[1].replace(/^<|>$/g, '');
      if (/^[a-z][a-z0-9+.-]*:/i.test(d) || d.startsWith('#')) continue;
      if (!/\.md(#.*)?$/i.test(d)) continue;
      out.push({ tipus: 'markdown', linia: i + 1, cru: m[0], desti: d });
    }
  });
  return out;
}

/**
 * Moviments coneguts per git: nom de fitxer → rutes noves. Sense git (o fora
 * d'un repositori) torna un mapa buit; no inventa cures.
 */
export function movimentsGit(root) {
  const mapa = new Map();
  const afig = (vell, nou) => {
    const clau = path.posix.basename(vell);
    if (!mapa.has(clau)) mapa.set(clau, new Set());
    mapa.get(clau).add(posix(nou));
  };
  const neteja = (p) => p.trim().replace(/^"(.*)"$/, '$1').replace(/\\(.)/g, '$1');
  try {
    const estat = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    const esborrats = [], nous = [];
    for (const l of estat.split('\n')) {
      if (!l.trim()) continue;
      const xy = l.slice(0, 2), resta = l.slice(3);
      if (/R/.test(xy)) { const [vell, nou] = resta.split(' -> ').map(neteja); if (vell && nou) afig(vell, nou); continue; }
      if (/D/.test(xy)) esborrats.push(neteja(resta));
      else if (xy === '??' || /A/.test(xy)) nous.push(neteja(resta));
    }
    const nousExpandits = nous.flatMap((n) => {
      const abs = path.join(root, n);
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        const acc = [];
        const walk = (d) => { for (const e of fs.readdirSync(d)) { const a = path.join(d, e); if (fs.statSync(a).isDirectory()) walk(a); else acc.push(posix(path.relative(root, a))); } };
        walk(abs);
        return acc;
      }
      return [n];
    });
    for (const vell of esborrats) for (const nou of nousExpandits) if (path.posix.basename(vell) === path.posix.basename(nou)) afig(vell, nou);
    const log = execFileSync('git', ['log', '--diff-filter=R', '--name-status', '-M', '--format=', '-n', '300'], { cwd: root, encoding: 'utf8' });
    for (const l of log.split('\n')) {
      const m = /^R\d*\t(.+)\t(.+)$/.exec(l);
      if (m) afig(m[1], m[2]);
    }
  } catch { /* sense git: cap cura per moviment */ }
  return mapa;
}

function indexDeCarpeta(root, dirRel) {
  const abs = path.join(root, dirRel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return null;
  const fitxers = fs.readdirSync(abs).filter((n) => /\.md$/i.test(n));
  const propi = fitxers.find((n) => n.toLowerCase() === `${path.posix.basename(dirRel).toLowerCase()}.md`);
  if (propi) return `${dirRel}/${propi}`;
  for (const patro of INDEXS_DE_CARPETA) {
    const cands = fitxers.filter((n) => patro.test(n));
    if (cands.length === 1) return `${dirRel}/${cands[0]}`;
    if (cands.length > 1) return null;
  }
  return null;
}

/** Ruta tal com l'escriu Obsidian dins de la Wiki: relativa al vault i sense .md. */
export function rutaObsidian(rel) {
  let r = rel.replace(/\.md$/i, '');
  if (r.startsWith(`${CAMINS.wiki}/`)) r = r.slice(CAMINS.wiki.length + 1);
  return r;
}

/** Diagnòstic d'un enllaç penjat: la cura més segura que es puga afirmar. */
export function cura(root, enllac, { idxOperatiu, idxArxiu, destins, moviments, font, operatius = destins }) {
  const net = netejaDesti(enllac.tipus === 'wiki' ? enllac.desti : path.posix.normalize(path.posix.join(path.posix.dirname(font), enllac.desti.split('#')[0])));
  if (enllac.tipus === 'wiki' && /^\.\.?\//.test(netejaDesti(enllac.desti))) {
    // El repositori resol `../` des de la font; Obsidian, no. Si el destí existix, la cura és la ruta del vault.
    const abs = `${path.posix.normalize(path.posix.join(path.posix.dirname(font), net))}.md`;
    if (operatius.includes(abs)) {
      if (!dinsVault(font)) return { motiu: 'ok' }; // fora del vault ningú pinta res en gris
      return dinsVault(abs) ? { motiu: 'vault', nou: abs, aplicable: true }
        : { motiu: 'fora-del-vault', nou: abs, aplicable: false, requires_human_decision: true };
    }
  }
  const base = path.posix.basename(net);
  const nous = [...(moviments.get(`${base}.md`) || [])].filter((n) => destins.includes(n) && !esArxiu(n) && !esHumana(n));
  if (nous.length === 1) return { motiu: 'moviment', nou: nous[0], aplicable: true };
  if (nous.length > 1) return { motiu: 'ambigu', candidats: nous, aplicable: false };
  const carpetes = destins.map((d) => path.posix.dirname(d)).filter((d, i, a) => a.indexOf(d) === i && path.posix.basename(d) === base);
  const indexs = carpetes.map((c) => indexDeCarpeta(root, c)).filter(Boolean);
  if (indexs.length === 1) return { motiu: 'carpeta', nou: indexs[0], aplicable: true };
  const r = resol(idxArxiu, net);
  if (r.ok) return { motiu: 'arxiu', nou: r.node, aplicable: false, requires_human_decision: true };
  const op = resol(idxOperatiu, net);
  if (!op.ok && op.motiu === 'ambigu') return { motiu: 'ambigu', candidats: op.candidats, aplicable: false, requires_human_decision: true };
  return { motiu: 'cap', aplicable: false, requires_human_decision: true };
}

/** Reescriu un enllaç conservant àncora i àlies (wiki) o el text (markdown). */
export function reescriu(enllac, nou, font) {
  if (enllac.tipus === 'wiki') {
    const [sensAlies, alies] = enllac.desti.split('|');
    const ancora = sensAlies.includes('#') ? `#${sensAlies.split('#').slice(1).join('#')}` : '';
    return `[[${rutaObsidian(nou)}${ancora}${alies !== undefined ? `|${alies}` : ''}]]`;
  }
  const ancora = enllac.desti.includes('#') ? `#${enllac.desti.split('#').slice(1).join('#')}` : '';
  let relatiu = posix(path.relative(path.posix.dirname(font), nou));
  if (!relatiu.startsWith('.')) relatiu = `./${relatiu}`;
  return enllac.cru.replace(/\(([^)]+)\)$/, `(${relatiu}${ancora})`);
}

/** Analitza el graf. `moviments` s'injecta a les proves; per defecte ve de git. */
export function analitza(root, { moviments = movimentsGit(root), arrels } = {}) {
  const { fonts, destins, operatius } = recull(root, arrels);
  const idxOperatiu = construeixIndex(operatius);
  const idxArxiu = construeixIndex(destins.filter(esArxiu));
  const troballes = [];
  for (const font of fonts) {
    const text = fs.readFileSync(path.join(root, font), 'utf8');
    for (const e of enllacos(text)) {
      let ok;
      if (e.tipus === 'wiki') {
        const r = resol(idxOperatiu, e.desti);
        if (r.ok) {
          // Des de dins del vault, un destí que viu fora és un node gris per a qui llig la Wiki a Obsidian.
          if (dinsVault(font) && !dinsVault(r.node)) troballes.push({ font, linia: e.linia, enllac: e.cru, motiu: 'fora-del-vault', nou: r.node, aplicable: false, requires_human_decision: true });
          continue;
        }
        ok = false;
      } else {
        const abs = path.posix.normalize(path.posix.join(path.posix.dirname(font), e.desti.split('#')[0]));
        ok = operatius.includes(abs);
      }
      if (ok) continue;
      const c = cura(root, e, { idxOperatiu, idxArxiu, destins, moviments, font, operatius });
      if (c.motiu === 'ok') continue;
      troballes.push({ font, linia: e.linia, enllac: e.cru, ...c, ...(c.nou ? { reescriptura: reescriu(e, c.nou, font) } : {}) });
    }
  }
  return { fonts: fonts.length, destins: destins.length, troballes, aplicables: troballes.filter((t) => t.aplicable).length };
}

/** Aplica les cures mecàniques. Torna els fitxers tocats. Mai escriu fora de les fonts. */
export function aplica(root, troballes) {
  const perFont = new Map();
  for (const t of troballes.filter((x) => x.aplicable && x.reescriptura)) {
    if (!perFont.has(t.font)) perFont.set(t.font, []);
    perFont.get(t.font).push(t);
  }
  const tocats = [];
  for (const [font, llista] of perFont) {
    if (esArxiu(font) || esHumana(font)) continue;
    const abs = path.join(root, font);
    const linies = fs.readFileSync(abs, 'utf8').split('\n');
    let canviat = false;
    for (const t of llista) {
      const i = t.linia - 1;
      if (linies[i]?.includes(t.enllac)) { linies[i] = linies[i].replace(t.enllac, t.reescriptura); canviat = true; }
    }
    if (canviat) { fs.writeFileSync(abs, linies.join('\n')); tocats.push(font); }
  }
  return tocats;
}

function main() {
  const argv = process.argv.slice(2);
  const root = arrelSegura();
  const r = analitza(root);
  let tocats = [];
  if (argv.includes('--aplica')) { tocats = aplica(root, r.troballes); Object.assign(r, analitza(root)); }
  if (argv.includes('--json')) { console.log(JSON.stringify({ ...r, tocats }, null, 2)); process.exitCode = r.troballes.length ? 1 : 0; return; }
  console.log(`🩹 [Autosanació] ${r.fonts} fonts · ${r.destins} destins · ${r.troballes.length} enllaç(os) penjat(s) · ${r.aplicables} amb cura mecànica`);
  for (const t of r.troballes) {
    const cua = t.aplicable ? `→ ${t.reescriptura}`
      : t.motiu === 'fora-del-vault' ? `existix fora del vault d'Obsidian (${t.nou}): enllaç Markdown o mirall, decisió humana`
        : t.motiu === 'arxiu' ? `només a l'arxiu: ${t.nou} (reapuntar amb ruta o despenjar: decisió humana)`
          : t.motiu === 'ambigu' ? `ambigu: ${t.candidats.join(' | ')}` : 'cap candidat: decisió humana';
    console.log(`   ${t.font}:${t.linia}  ${t.enllac}  [${t.motiu}] ${cua}`);
  }
  if (tocats.length) console.log(`✍️  Reescrits ${tocats.length} fitxer(s): ${tocats.join(', ')}`);
  else if (r.aplicables) console.log('Res escrit. Executa amb --aplica per a aplicar les cures mecàniques.');
  process.exitCode = r.troballes.length ? 1 : 0;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`[Autosanació] ${e.message}`); process.exitCode = 2; }
}
