/** Shared path-based resolver. A Markdown URL is always relative to its source. */
import { CAMINS } from './arrel.mjs';
import { markdownProse } from './markdown-prose.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {canonical, inside} from '../documental/core.mjs';
const webCatalogs = new WeakMap();

/** Només fitxers regulars confinats, també sense symlinks interns. */
function confined(root, candidate, label = candidate) {
  const base = path.resolve(root), rel = path.relative(base, candidate);
  if (!rel || !inside(base, candidate) || !inside(canonical(root), canonical(candidate))) throw new Error(`Enllaç fora de l’arrel: ${label}`);
  let cursor = canonical(root);
  for (const segment of rel.split(path.sep)) {
    cursor = path.join(cursor, segment);
    try { if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Enllaç fora de l’arrel o symlink: ${label}`); }
    catch (e) { if (e.code === 'ENOENT') return false; throw e; }
  }
  return fs.statSync(cursor).isFile();
}

function cleanWebTarget(target) {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.length > 8192 || /[\p{Cc}\p{Cf}\\]/u.test(target)) return false;
  const raw = target.split(/[?#]/)[0];
  try {
    const decoded = decodeURIComponent(raw);
    return !/[\\\p{Cc}\p{Cf}]/u.test(decoded) && !/%(?:2e|2f|5c|25)/i.test(decoded)
      && !/%(?:2f|5c)/i.test(raw) && !decoded.split('/').some(s => s === '.' || s === '..');
  } catch { return false; }
}

/** Una sola certificació estàtica en batch, sense HTTP ni escriptures.
 * El catàleg opac és per auditoria/arrel: el caller no pot inventar ni mutar
 * una whitelist. Router i resolutors PAGE_COPY/Consola són les fonts reals.
 */
export async function prepareDocumentWebLinks(root, links) {
  const physical = target => {
    try {
      const file = decodeURIComponent(target.split(/[?#]/)[0]);
      return inside(path.resolve(root), file) || inside(canonical(root), file);
    } catch { return false; }
  };
  const targets = [...new Set(links.filter(l => l.kind === 'markdown' && l.target.startsWith('/') && !physical(l.target)).map(l => l.target))];
  const results = new Map(targets.map(t => [t, { ok: false, reason: 'Ruta web no acreditada' }]));
  const catalog = Object.freeze({ schema: 'sdp.document-web-links.v1', count: targets.length });
  webCatalogs.set(catalog, { root: canonical(root), results });
  if (!targets.length) return catalog;
  const validTargets = targets.filter(cleanWebTarget);
  if (!validTargets.length) return catalog;
  try {
    // Els mòduls importats pel certificador són fonts de codi de l'arbre.
    // Un symlink, també cap a dins, no pot aportar una prova de ruta.
    const scan = dir => {
      if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Font web amb symlink');
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isSymbolicLink()) throw new Error('Font web amb symlink');
        if (e.isDirectory()) scan(path.join(dir, e.name));
      }
    };
    for (const rel of ['src/app/App.jsx', 'tooling/vite/federacio-iaia.mjs', 'tooling/vite/opendata-publica.mjs']) {
      if (!confined(root, path.join(root, rel))) throw new Error('Font web absent');
    }
    scan(path.join(root, 'src')); scan(path.join(root, 'tooling/vite'));
    // Procés fresc per auditoria: ESM no pot conservar un PAGE_COPY o un
    // catàleg de Consola retirat entre dos runAudits del mateix procés.
    const worker = `
      const root=process.argv[1],targets=JSON.parse(process.argv[2]);
      const [{certificaEnllacos},{extrauRutes,patroARegex}]=await Promise.all([
        import(${JSON.stringify(new URL('../gates/certifica-enllacos.mjs', import.meta.url).href)}),
        import(${JSON.stringify(new URL('../seo/rutes-del-router.mjs', import.meta.url).href)})
      ]);
      const router=await extrauRutes({root});
      if(router.infraccions.length)throw new Error('Inventari del Router no acreditat');
      const certificate=await certificaEnllacos({arrel:root,urls:targets,remot:false});
      const results=certificate.resultats.map(entry=>{
        const parsed=new URL(entry.url,'https://socdepoble.org'),cami=parsed.pathname;
        const mounted=router.rutes.some(r=>r.component&&r.component!=='NotFoundPage'&&!r.guarda&&patroARegex(r.patro).test(cami));
        const items=parsed.searchParams.getAll('item');
        const queryValid=!['/wiki','/wikidepoble'].includes(cami)||!items.length||(items.length===1&&items[0].length>0);
        return [entry.url,{ok:queryValid&&entry.ok&&mounted&&entry.arbre.tipus!=='externa'&&!entry.arbre.pendentDades,
          reason:entry.arbre.motiu||'Ruta web no acreditada pel Router i el seu resolutor'}];
      });
      process.stdout.write(JSON.stringify(results));
    `;
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', worker, root, JSON.stringify(validTargets)], {
      cwd: root, env: { ...process.env, SDP_ARREL: root }, encoding: 'utf8', timeout: 15_000, maxBuffer: 2 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']
    });
    for (const [target, result] of JSON.parse(output)) results.set(target, result);
  } catch (e) { for (const target of validTargets) results.set(target, { ok: false, reason: e.code === 'ETIMEDOUT' ? 'Context web no acreditat: temps excedit' : 'Context web no acreditat: fonts confinades o inventari del Router il·legibles' }); }
  return catalog;
}
export function extractDocumentLinks(content) {
  const clean = markdownProse(content);
  const links = [];
  for (const m of clean.matchAll(/\[\[([^\]]+)\]\]/g)) links.push({kind: 'wiki', target: m[1].replace(/\\(?=[|#])/g, '').split('|')[0].split('#')[0].trim()});
  for (const m of clean.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].trim().replace(/^<|>$/g, '').split('#')[0];
    links.push({kind: 'markdown', target: target.startsWith('/') ? target : target.split('?')[0]});
  }
  return links.filter(l => l.target && !/^[a-z][a-z0-9+.-]*:/i.test(l.target));
}
export function resolveDocumentLink(link, source, files, root, { webLinks } = {}) {
  const catalog = webLinks && webCatalogs.get(webLinks);
  if (webLinks && (!catalog || catalog.root !== canonical(root))) throw new Error('Catàleg web no acreditat per a esta arrel');
  if (link.kind === 'markdown' && link.target.startsWith('/') && catalog?.results.has(link.target)) {
    if (!confined(root, path.resolve(source))) throw new Error('Font documental no confinada');
    const result = catalog.results.get(link.target);
    if (!result.ok) throw new Error(`Enllaç web invàlid: ${link.target} · ${result.reason}`);
    return `web:${link.target}`;
  }
  let target;
  try { target = decodeURIComponent(link.target.split('?')[0]); } catch { throw new Error(`URL invàlida: ${link.target}`); }
  if (link.kind === 'wiki' && !path.extname(target)) {
    // Un camí relatiu explícit identifica primer el recurs exacte, també sense
    // extensió. Si no hi és, conserva l'abreviatura Markdown habitual.
    let exact = false;
    if (target.startsWith('./') || target.startsWith('../')) {
      const local = path.resolve(path.dirname(source), target);
      if (!inside(path.resolve(root), local) || !inside(canonical(root), canonical(local))) throw new Error(`Enllaç fora de l’arrel: ${target}`);
      exact = fs.existsSync(local) && fs.statSync(local).isFile();
    }
    if (!exact) target += '.md';
  }
  let candidates;
  if (link.kind === 'markdown' || target.startsWith('./') || target.startsWith('../')) candidates = [path.resolve(path.dirname(source), target)];
  else if (target.includes('/')) candidates = [...new Set([path.resolve(root, target), path.resolve(root, CAMINS.wiki, target), path.resolve(path.dirname(source), target)])];
  else candidates = files.filter(f => path.basename(f) === target);
  if (link.kind === 'wiki' && !target.startsWith('.') && !path.isAbsolute(target)) {
    const local = path.resolve(path.dirname(source), target);
    if (files.includes(local)) candidates = [local];
    else if (!candidates.some(f => fs.existsSync(f))) {
      candidates = files.filter(f => f.endsWith('/' + target));
      if (!candidates.length && !target.includes('/')) {
        const skillDir = target.replace(/\.md$/i, '');
        candidates = files.filter(f => f.endsWith('/' + skillDir + '/SKILL.md'));
      }
    }
  }
  const found = candidates.filter(f => {
    return confined(root, f, target);
  });
  const skill = link.kind === 'wiki' && /^([a-z][a-z0-9-]{0,79})_SKILL(?:\.md)?$/.exec(target);
  if (skill) {
    const candidate = path.resolve(root, CAMINS.agents, 'skills', skill[1], 'SKILL.md');
    if (confined(root, candidate, target) && !found.includes(candidate)) found.push(candidate);
  }
  if (found.length !== 1) throw new Error(`${found.length ? 'Enllaç ambigu' : 'Enllaç inexistent'}: ${target}`);
  return nomsDelDisc(found[0], root);
}
/* 261031 (ordre del Mestre, Ronda 1) · APFS no distingix la normalització Unicode:
   un enllaç NFC («Gestió», com el guarda Git) obri una carpeta que el Finder ha
   escrit NFD, però les portes comparen el camí amb els noms del directori. Es torna
   el camí amb cada segment tal com és al disc; els segments ASCII no es miren. */
function nomsDelDisc(fitxer, root) {
  const base = path.resolve(root);
  const rel = path.relative(base, fitxer);
  if (!/[^\x00-\x7f]/.test(rel)) return fitxer;
  let actual = base;
  for (const segment of rel.split(path.sep)) {
    let nom = segment;
    if (/[^\x00-\x7f]/.test(segment)) {
      const entrades = fs.readdirSync(actual);
      if (!entrades.includes(segment)) nom = entrades.find(e => e.normalize('NFC') === segment.normalize('NFC')) ?? segment;
    }
    actual = path.join(actual, nom);
  }
  return actual;
}
