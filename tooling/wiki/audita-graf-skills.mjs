#!/usr/bin/env node
/**
 * audita-graf-skills.mjs — Diagnòstic determinista i no destructiu del graf de
 * skills, propietats frontmatter, contractes i ancoretges (`R25-C` · MaxMaxData
 * + Obsidian `1.15.1` Bases).
 *
 * Compliment estricte `R25-SK01..SK05`:
 *   - Zero mutacions sobre `.agents/skills/` ni sobre la Wiki (100 % lectura).
 *   - Diccionaris amb `Object.create(null)` contra col·lisions de prototip.
 *   - Escàner Markdown *fence-aware* (suporta tanques ```` ``` ```` i `~~~`/`~~~~~`
 *     de longitud arbitrària >= 3, ignorant `#` i `[[...]]` dins de blocs de codi).
 *   - Verifica contractes de `cataleg_skills.mjs`, àncores de sistema en
 *     `.agents/cervell.json`, `.agents/protocolledge.json` i `AGENTS.md`,
 *     col·lisions de `triggers_on` i `contracte.escriu`, i `[[wikilinks]]` orfes.
 *
 * Onada R26 (auditoria Codex `R25.2-G01/G02`): tipus crus validats com fa
 * `cataleg_skills.mjs`; nom curt resolt només si és únic o des de la carpeta
 * d'origen (`WIKILINK_AMBIGU` si no); camins de contracte normalitzats abans de
 * comparar; un `<!--` dins de codi en línia no obri cap comentari; cobertura
 * de les àncores declarada a l'informe. L'arrel per defecte la dona
 * `tooling/lib/arrel.mjs`, mai el `cwd`.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain, CAMINS } from '../lib/arrel.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const RE_ID_SKILL = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RE_OBERTURA_FENCE = /^ {0,3}(`{3,}|~{3,})([^\n]*)$/;
const RE_INLINE_CODE = /`+[^`]*`+/g;
const RE_PERILL_HOOK = /\b(?:python3?\s+-c|node\s+-e|bash\s+-c|sh\s+-c)\b/;

function sha256Hex(bufferOText) {
  return createHash('sha256').update(bufferOText).digest('hex');
}

function normalitzaTrigger(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Camí de contracte canònic: sense `./` inicial, barres repetides ni barra final. */
export function normalitzaRutaContracte(ruta) {
  return String(ruta ?? '').trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '').replace(/\/{2,}/g, '/').replace(/\/+$/, '');
}

/** Trams de codi en línia (CommonMark: tancament amb el mateix nombre de backticks). */
function spansCodiEnLinia(linia) {
  const spans = [];
  let i = 0;
  while (i < linia.length) {
    const p = linia.indexOf('`', i);
    if (p === -1) break;
    let q = p;
    while (linia[q] === '`') q += 1;
    const run = q - p;
    let k = q;
    let tancat = -1;
    while (k < linia.length) {
      const r = linia.indexOf('`', k);
      if (r === -1) break;
      let e = r;
      while (linia[e] === '`') e += 1;
      if (e - r === run) { tancat = e; break; }
      k = e;
    }
    if (tancat === -1) { i = q; continue; }
    spans.push([p, tancat]);
    i = tancat;
  }
  return spans;
}

function indexForaDeCodi(linia, agulla, desDe, spans) {
  let idx = linia.indexOf(agulla, desDe);
  while (idx !== -1) {
    const span = spans.find(([a, b]) => idx >= a && idx < b);
    if (!span) return idx;
    idx = linia.indexOf(agulla, span[1]);
  }
  return -1;
}

function llistaNormalitzada(valor) {
  if (Array.isArray(valor)) {
    return valor.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof valor === 'string' && valor.trim()) {
    return [valor.trim()];
  }
  return [];
}

/**
 * Escaneja el cos Markdown respectant tanques de codi (` ``` ` i `~~~` de >= 3
 * caràcters) perquè cap exemple literal es confonga amb un H1 real o un wikilink viu.
 */
export function analitzaCosMarkdownFenceAware(body = '') {
  const linies = String(body || '').split(/\r?\n/);
  const h1 = [];
  const wikilinks = [];
  const mencionsInlineExec = [];

  let caracterFence = null;
  let longitudFence = 0;
  let enComentariHtml = false;

  for (let idx = 0; idx < linies.length; idx += 1) {
    const linia = linies[idx];
    const numLinia = idx + 1;

    if (caracterFence !== null) {
      const reTancament = new RegExp(`^ {0,3}${caracterFence}{${longitudFence},}[ \\t]*$`);
      if (reTancament.test(linia)) {
        caracterFence = null;
        longitudFence = 0;
      }
      if (RE_PERILL_HOOK.test(linia)) {
        mencionsInlineExec.push({ linia: numLinia, dinsFence: true, mostra: linia.trim().slice(0, 120) });
      }
      continue;
    }

    const mFence = RE_OBERTURA_FENCE.exec(linia);
    if (mFence && !enComentariHtml) {
      const seq = mFence[1];
      const info = mFence[2] || '';
      // En CommonMark una tanca de backticks no pot contindre backticks en la cadena d'info.
      if (!(seq[0] === '`' && info.includes('`'))) {
        caracterFence = seq[0];
        longitudFence = seq.length;
        continue;
      }
    }

    // R25.2-G02: Suprimeix comentaris HTML (d'una línia o multilínia) fora de tanques de codi.
    // Un «<!--» dins de codi en línia és text literal i no obri cap comentari.
    const spans = enComentariHtml ? [] : spansCodiEnLinia(linia);
    let liniaForaComentari = '';
    let cursor = 0;
    while (cursor < linia.length) {
      if (enComentariHtml) {
        const idxFi = linia.indexOf('-->', cursor);
        if (idxFi === -1) {
          cursor = linia.length;
        } else {
          enComentariHtml = false;
          cursor = idxFi + 3;
        }
      } else {
        const idxInici = indexForaDeCodi(linia, '<!--', cursor, spans);
        if (idxInici === -1) {
          liniaForaComentari += linia.slice(cursor);
          cursor = linia.length;
        } else {
          liniaForaComentari += linia.slice(cursor, idxInici);
          enComentariHtml = true;
          cursor = idxInici + 4;
        }
      }
    }

    if (!liniaForaComentari.trim()) {
      continue;
    }

    const mH1 = /^#[ \t]+(.+?)[ \t]*$/.exec(liniaForaComentari);
    if (mH1) {
      h1.push({ linia: numLinia, titol: mH1[1].trim() });
    }

    if (RE_PERILL_HOOK.test(liniaForaComentari)) {
      mencionsInlineExec.push({ linia: numLinia, dinsFence: false, mostra: liniaForaComentari.trim().slice(0, 120) });
    }

    const liniaSenseInlineCode = liniaForaComentari.replace(RE_INLINE_CODE, ' ');
    const reWiki = /\[\[([^[\]\n]+)\]\]/g;
    let mWiki;
    while ((mWiki = reWiki.exec(liniaSenseInlineCode)) !== null) {
      const brut = mWiki[1].trim();
      const [destiAmbAncora] = brut.split('|');
      const [destiCru] = destiAmbAncora.split('#');
      const desti = destiCru.trim();
      if (desti) {
        wikilinks.push({ linia: numLinia, brut, desti });
      }
    }
  }

  return { h1, wikilinks, mencionsInlineExec };
}

function indexaMarkdownsResolubles(arrelAbs) {
  const rutesRelatives = new Set();
  const perNomCurt = Object.create(null);

  function camina(dirAbs) {
    if (!fs.existsSync(dirAbs)) return;
    for (const entrada of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      if (entrada.isSymbolicLink()) continue;
      const abs = path.join(dirAbs, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === 'node_modules' || entrada.name === '.git' || entrada.name === '90_arxiu_historic') {
          continue;
        }
        camina(abs);
      } else if (entrada.isFile() && entrada.name.endsWith('.md')) {
        const rel = path.relative(arrelAbs, abs).split(path.sep).join('/');
        const senseExt = rel.slice(0, -3);
        rutesRelatives.add(rel);
        rutesRelatives.add(senseExt);

        const base = path.basename(entrada.name, '.md');
        if (!Object.hasOwn(perNomCurt, base)) {
          perNomCurt[base] = [];
        }
        perNomCurt[base].push(rel);
      }
    }
  }

  if (fs.existsSync(path.join(arrelAbs, 'AGENTS.md'))) {
    rutesRelatives.add('AGENTS.md');
    rutesRelatives.add('AGENTS');
    perNomCurt.AGENTS = ['AGENTS.md'];
  }
  camina(path.join(arrelAbs, '.agents'));
  camina(path.join(arrelAbs, CAMINS.wiki));

  return { rutesRelatives, perNomCurt };
}

/** Nom net d'un destí de wikilink: sense el `./` inicial ni l'extensió `.md`. Font única per a classificar i informar. */
export function nomNetWikilink(desti) {
  return String(desti || '').replace(/^\.\//, '').replace(/\.md$/i, '');
}

/**
 * R25.2-G01: `resolt`, `trencat` o `ambigu`. Una ruta qualificada (amb `/`)
 * només es resol amb el camí exacte (caixa inclosa) dins de les arrels
 * autoritzades; un nom curt, des de la carpeta d'origen o si és únic.
 */
export function classificaWikilink(desti, indexMd, dirOrigen = '') {
  const net = nomNetWikilink(desti);
  if (!net) return 'resolt';
  if (net.split('/').includes('..') || net.startsWith('/')) return 'trencat';

  const candidats = [
    net,
    `${net}.md`,
    `.agents/skills/${net}`,
    `.agents/skills/${net}.md`,
    `.agents/${net}`,
    `.agents/${net}.md`,
    `${CAMINS.wiki}/${net}`,
    `${CAMINS.wiki}/${net}.md`,
  ];

  for (const c of candidats) {
    if (indexMd.rutesRelatives.has(c)) return 'resolt';
  }

  // Si la ruta és qualificada (conté '/'), MAI fer fallback pel basename d'un
  // altre fitxer (`does-not-exist/SKILL` no resol contra una altra SKILL.md).
  if (net.includes('/')) return 'trencat';

  if (dirOrigen && indexMd.rutesRelatives.has(`${dirOrigen}/${net}.md`)) return 'resolt';
  const mateixNom = Object.hasOwn(indexMd.perNomCurt, net) ? indexMd.perNomCurt[net] : [];
  if (mateixNom.length === 1) return 'resolt';
  return mateixNom.length > 1 ? 'ambigu' : 'trencat';
}

export function resolWikilinkSkill(desti, indexMd, dirOrigen = '') {
  return classificaWikilink(desti, indexMd, dirOrigen) === 'resolt';
}

// Cobertura declarada: els directoris es recorren sense baixar a subcarpetes.
const FITXERS_ANCORES = Object.freeze(['.agents/cervell.json', '.agents/protocolledge.json', 'AGENTS.md', 'package.json']);
const DIRECTORIS_ANCORES = Object.freeze(['tooling/gates', 'tooling/brain', 'tooling/wiki']);

function detectaAncoresSistema(arrelAbs) {
  const ancores = Object.create(null);
  const afigAncora = (skillId, font) => {
    if (!skillId) return;
    if (!Object.hasOwn(ancores, skillId)) {
      ancores[skillId] = [];
    }
    if (!ancores[skillId].includes(font)) {
      ancores[skillId].push(font);
    }
  };

  const extreuIdsSkillDeText = (text, etiquetaFont) => {
    const re = /\.agents\/skills\/([a-z0-9-]+)\/SKILL\.md/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      afigAncora(m[1], etiquetaFont);
    }
  };

  for (const rel of FITXERS_ANCORES) {
    const abs = path.join(arrelAbs, rel);
    if (fs.existsSync(abs)) {
      extreuIdsSkillDeText(fs.readFileSync(abs, 'utf8'), rel);
    }
  }

  // Escaneig lleuger d'scripts de tooling/gates i tooling/brain que puguen referenciar una skill literal
  for (const dirRel of DIRECTORIS_ANCORES) {
    const dirAbs = path.join(arrelAbs, dirRel);
    if (!fs.existsSync(dirAbs)) continue;
    for (const e of fs.readdirSync(dirAbs, { withFileTypes: true })) {
      if (!e.isFile() || e.name.startsWith('.') || !/\.(?:mjs|js|json)$/.test(e.name)) continue;
      if (e.name === '00_INDEX_SKILLS.md') continue;
      const rel = `${dirRel}/${e.name}`;
      extreuIdsSkillDeText(fs.readFileSync(path.join(dirAbs, e.name), 'utf8'), rel);
    }
  }

  return ancores;
}

/**
 * Audita de forma no destructiva totes les skills de `.agents/skills/` i les
 * seues relacions amb el sistema.
 */
export function auditaGrafSkills(arrel = arrelSegura()) {
  const arrelAbs = path.resolve(arrel);
  const dirSkills = path.join(arrelAbs, '.agents/skills');
  if (!fs.existsSync(dirSkills)) {
    throw new Error(`[audita-graf-skills] No existeix el directori ${dirSkills}`);
  }

  const indexMd = indexaMarkdownsResolubles(arrelAbs);
  const ancoresSistema = detectaAncoresSistema(arrelAbs);

  const mapTriggersExactes = Object.create(null);
  const mapTriggersNormalitzats = Object.create(null);
  const mapContracteEscriu = Object.create(null);
  const mapContracteLlig = Object.create(null);

  const skills = [];
  const anomalies = [];

  const entrades = fs.readdirSync(dirSkills, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const entrada of entrades) {
    if (entrada.name === '00_INDEX_SKILLS.md' || entrada.name.startsWith('.')) {
      continue;
    }

    if (entrada.isSymbolicLink()) {
      anomalies.push({
        tipus: 'SYMLINK_PROHIBIT',
        skill: entrada.name,
        detall: 'cataleg_skills.mjs prohibeix symlinks dins de .agents/skills/.',
      });
      continue;
    }

    if (!entrada.isDirectory()) {
      continue;
    }

    const dirId = entrada.name;
    const rutaRel = `.agents/skills/${dirId}/SKILL.md`;
    const rutaAbs = path.join(dirSkills, dirId, 'SKILL.md');

    if (!RE_ID_SKILL.test(dirId)) {
      anomalies.push({
        tipus: 'ID_CARPETA_INVALID',
        skill: dirId,
        detall: `El nom de carpeta "${dirId}" incompleix kebab-case i trencarà cataleg_skills.mjs.`,
      });
    }

    if (!fs.existsSync(rutaAbs)) {
      anomalies.push({
        tipus: 'SENSE_SKILL_MD',
        skill: dirId,
        detall: `Falta ${rutaRel}.`,
      });
      continue;
    }

    const bytesBuf = fs.readFileSync(rutaAbs);
    const sha256 = sha256Hex(bytesBuf);
    const text = bytesBuf.toString('utf8');
    const fm = parseFrontmatter(text);
    const d = fm.data || {};

    if (!fm.hasFrontmatter || fm.errors.length > 0) {
      anomalies.push({
        tipus: 'FRONTMATTER_INVALID',
        skill: dirId,
        detall: fm.errors.join('; ') || 'Sense bloc YAML frontmatter.',
      });
    }

    // R25.2-G02: tipus crus, mateixes regles que `cataleg_skills.mjs` (cap coerció amb String()).
    const statusCru = d.status ?? d.estat;
    const typeCru = d.type ?? d.tipus;
    const status = typeof statusCru === 'string' ? statusCru : JSON.stringify(statusCru ?? '');
    const type = typeof typeCru === 'string' ? typeCru : JSON.stringify(typeCru ?? '');
    const name = typeof d.name === 'string' ? d.name : JSON.stringify(d.name ?? '');
    const description = typeof d.description === 'string' ? d.description.replace(/\s+/g, ' ').trim() : '';
    const triggersCru = d.triggers_on;
    const triggersValids = Array.isArray(triggersCru) && triggersCru.length > 0
      && triggersCru.every((t) => typeof t === 'string' && t.trim());
    const triggers = triggersValids ? triggersCru.map((t) => t.trim()) : [];
    const contracteLlig = llistaNormalitzada(d['contracte.llig']).map(normalitzaRutaContracte).filter(Boolean);
    const contracteEscriu = llistaNormalitzada(d['contracte.escriu']).map(normalitzaRutaContracte).filter(Boolean);
    const tags = llistaNormalitzada(d.tags);
    const core = d.core === 'true';
    const prioritat = d.prioritat !== undefined && d.prioritat !== '' ? Number(d.prioritat) : 50;

    if (name !== dirId) {
      anomalies.push({
        tipus: 'IDENTITAT_DIVERGENT',
        skill: dirId,
        detall: `name ("${name}") difereix de la carpeta ("${dirId}").`,
      });
    }
    if (type !== 'skill') {
      anomalies.push({
        tipus: 'TIPUS_INVALID',
        skill: dirId,
        detall: `type ("${type}") ha de ser "skill".`,
      });
    }
    if (!['actiu', 'canonic'].includes(status)) {
      anomalies.push({
        tipus: 'ESTAT_NO_CATALOGABLE',
        skill: dirId,
        detall: `status ("${status}") trencaria cataleg_skills.mjs (només admet actiu o canonic).`,
      });
    }
    if (!description) {
      anomalies.push({
        tipus: 'SENSE_DESCRIPCIO',
        skill: dirId,
        detall: 'Falta description al frontmatter.',
      });
    }
    if (triggersCru === undefined || triggersCru === '') {
      anomalies.push({
        tipus: 'SENSE_TRIGGERS',
        skill: dirId,
        detall: 'Falta llista triggers_on vàlida.',
      });
    } else if (!triggersValids) {
      anomalies.push({
        tipus: 'TRIGGERS_TIPUS_INVALID',
        skill: dirId,
        detall: `triggers_on ha de ser una llista de cadenes no buides (rebut ${Array.isArray(triggersCru) ? 'una llista amb elements no vàlids' : typeof triggersCru}); cataleg_skills.mjs la rebutjaria.`,
      });
    }
    if (d.core !== undefined && !/^core:[ \t]*(true|false)[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter || '')) {
      anomalies.push({ tipus: 'CORE_INVALID', skill: dirId, detall: 'core ha de ser literalment true o false; cataleg_skills.mjs el rebutjaria.' });
    }
    if (d.prioritat !== undefined && !/^prioritat:[ \t]*-?\d+[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter || '')) {
      anomalies.push({ tipus: 'PRIORITAT_INVALIDA', skill: dirId, detall: 'prioritat ha de ser un enter; cataleg_skills.mjs la rebutjaria.' });
    }

    const analisiCos = analitzaCosMarkdownFenceAware(fm.body);
    if (analisiCos.h1.length !== 1) {
      anomalies.push({
        tipus: analisiCos.h1.length === 0 ? 'SENSE_H1' : 'MULTIPLES_H1_REALS',
        skill: dirId,
        detall: `Trobats ${analisiCos.h1.length} encapçalaments H1 fora de tanques de codi.`,
      });
    }

    const wikilinksTrencats = [];
    const dirOrigen = `.agents/skills/${dirId}`;
    for (const wl of analisiCos.wikilinks) {
      const estat = classificaWikilink(wl.desti, indexMd, dirOrigen);
      if (estat === 'trencat') {
        wikilinksTrencats.push(wl);
        anomalies.push({
          tipus: 'WIKILINK_TRENCAT',
          skill: dirId,
          detall: `Línia ${wl.linia}: [[${wl.brut}]] no resol a cap fitxer viu.`,
        });
      } else if (estat === 'ambigu') {
        wikilinksTrencats.push(wl);
        anomalies.push({
          tipus: 'WIKILINK_AMBIGU',
          skill: dirId,
          detall: `Línia ${wl.linia}: [[${wl.brut}]] coincidix amb ${(indexMd.perNomCurt[nomNetWikilink(wl.desti)] || []).length} fitxers i cap és a la carpeta d'origen; cal la ruta qualificada.`,
        });
      }
    }

    for (const tr of triggers) {
      const clauExacta = tr.toLowerCase();
      if (!Object.hasOwn(mapTriggersExactes, clauExacta)) mapTriggersExactes[clauExacta] = [];
      if (!mapTriggersExactes[clauExacta].includes(dirId)) mapTriggersExactes[clauExacta].push(dirId);

      const clauNorm = normalitzaTrigger(tr);
      if (clauNorm) {
        if (!Object.hasOwn(mapTriggersNormalitzats, clauNorm)) mapTriggersNormalitzats[clauNorm] = [];
        if (!mapTriggersNormalitzats[clauNorm].includes(dirId)) mapTriggersNormalitzats[clauNorm].push(dirId);
      }
    }

    for (const rutaEsc of contracteEscriu) {
      if (!Object.hasOwn(mapContracteEscriu, rutaEsc)) mapContracteEscriu[rutaEsc] = [];
      if (!mapContracteEscriu[rutaEsc].includes(dirId)) mapContracteEscriu[rutaEsc].push(dirId);
    }
    for (const rutaLl of contracteLlig) {
      if (!Object.hasOwn(mapContracteLlig, rutaLl)) mapContracteLlig[rutaLl] = [];
      if (!mapContracteLlig[rutaLl].includes(dirId)) mapContracteLlig[rutaLl].push(dirId);
    }

    const ancores = Object.hasOwn(ancoresSistema, dirId) ? ancoresSistema[dirId] : [];

    skills.push({
      id: dirId,
      ruta: rutaRel,
      sha256,
      bytes: bytesBuf.length,
      linies: text.split(/\r?\n/).length,
      status,
      core,
      prioritat,
      description,
      tags,
      triggers,
      contracteLlig,
      contracteEscriu,
      teContracteExplicit: contracteLlig.length > 0 || contracteEscriu.length > 0,
      h1Count: analisiCos.h1.length,
      h1Titol: analisiCos.h1[0]?.titol || null,
      wikilinksTotal: analisiCos.wikilinks.length,
      wikilinksTrencats: wikilinksTrencats.map((w) => w.brut),
      mencionsExecInline: analisiCos.mencionsInlineExec,
      ancoresSistema: ancores,
      protegidaPelSistema: ancores.length > 0,
    });
  }

  const triggersDuplicatsExactes = Object.keys(mapTriggersExactes)
    .filter((k) => mapTriggersExactes[k].length > 1)
    .sort()
    .map((trigger) => ({ trigger, skills: mapTriggersExactes[trigger] }));

  const triggersDuplicatsNormalitzats = Object.keys(mapTriggersNormalitzats)
    .filter((k) => mapTriggersNormalitzats[k].length > 1)
    .sort()
    .map((triggerNorm) => ({ triggerNormalitzat: triggerNorm, skills: mapTriggersNormalitzats[triggerNorm] }));

  // Detecció de solapaments per subcadena significativa (>= 5 caràcters) entre skills distintes
  const solapamentsSemanticsTriggers = [];
  const llistaClausNorm = Object.keys(mapTriggersNormalitzats).filter((k) => k.length >= 5).sort();
  for (let i = 0; i < llistaClausNorm.length; i += 1) {
    for (let j = i + 1; j < llistaClausNorm.length; j += 1) {
      const a = llistaClausNorm[i];
      const b = llistaClausNorm[j];
      const tokensA = a.split(' ');
      const tokensB = b.split(' ');
      const esSubfrase = (b.includes(a) || a.includes(b)) && (tokensA.length >= 2 || a.length >= 7);
      if (!esSubfrase && !(tokensA.length === 1 && tokensB.includes(a) && a.length >= 6)) {
        continue;
      }
      const unio = [...new Set([...mapTriggersNormalitzats[a], ...mapTriggersNormalitzats[b]])];
      if (unio.length > 1) {
        solapamentsSemanticsTriggers.push({
          termeCurt: a,
          termeLlarg: b,
          skills: unio.sort(),
        });
      }
    }
  }

  const escripturesCompartides = Object.keys(mapContracteEscriu)
    .filter((ruta) => mapContracteEscriu[ruta].length > 1)
    .sort()
    .map((ruta) => ({ ruta, skills: mapContracteEscriu[ruta] }));

  // R25.2-G02: Detecta solapaments jeràrquics pare/fill en contracte.escriu
  const rutesEscriuOrdenades = Object.keys(mapContracteEscriu).sort();
  for (let i = 0; i < rutesEscriuOrdenades.length; i += 1) {
    for (let j = i + 1; j < rutesEscriuOrdenades.length; j += 1) {
      const pare = rutesEscriuOrdenades[i].replace(/\/+$/, '');
      const fill = rutesEscriuOrdenades[j].replace(/\/+$/, '');
      if (pare && fill.startsWith(`${pare}/`)) {
        const unio = [...new Set([...mapContracteEscriu[rutesEscriuOrdenades[i]], ...mapContracteEscriu[rutesEscriuOrdenades[j]]])];
        if (unio.length > 1) {
          escripturesCompartides.push({
            ruta: `${pare}/* <-> ${fill}`,
            skills: unio.sort(),
          });
        }
      }
    }
  }

  // R25.2-G02: Àncores del sistema que apunten a una skill inexistent
  const idsSkillsExistents = new Set(skills.map((s) => s.id));
  for (const skillAncorada of Object.keys(ancoresSistema)) {
    if (!idsSkillsExistents.has(skillAncorada)) {
      anomalies.push({
        tipus: 'ANCORA_SISTEMA_ABSENT',
        skill: skillAncorada,
        detall: `Referenciada per [${ancoresSistema[skillAncorada].join(', ')}], però no existeix a .agents/skills/${skillAncorada}/SKILL.md.`,
      });
    }
  }

  const skillsSenseContracte = skills
    .filter((s) => !s.teContracteExplicit)
    .map((s) => s.id);

  const anomaliesCritiques = anomalies.filter((a) =>
    [
      'SYMLINK_PROHIBIT',
      'ID_CARPETA_INVALID',
      'SENSE_SKILL_MD',
      'FRONTMATTER_INVALID',
      'IDENTITAT_DIVERGENT',
      'TIPUS_INVALID',
      'ESTAT_NO_CATALOGABLE',
      'SENSE_DESCRIPCIO',
      'SENSE_TRIGGERS',
      'TRIGGERS_TIPUS_INVALID',
      'CORE_INVALID',
      'PRIORITAT_INVALIDA',
      'ANCORA_SISTEMA_ABSENT',
    ].includes(a.tipus),
  );

  return {
    eina: 'audita-graf-skills',
    ok: anomaliesCritiques.length === 0,
    arrel: arrelAbs,
    resum: {
      totalSkills: skills.length,
      skillsCore: skills.filter((s) => s.core).length,
      skillsAmbContracteExplicit: skills.length - skillsSenseContracte.length,
      skillsSenseContracte: skillsSenseContracte.length,
      skillsProtegidesPelSistema: skills.filter((s) => s.protegidaPelSistema).length,
      triggersDuplicatsExactes: triggersDuplicatsExactes.length,
      triggersDuplicatsNormalitzats: triggersDuplicatsNormalitzats.length,
      solapamentsSemanticsTriggers: solapamentsSemanticsTriggers.length,
      escripturesCompartides: escripturesCompartides.length,
      anomaliesTotals: anomalies.length,
      anomaliesCritiques: anomaliesCritiques.length,
    },
    ancoresSistema,
    coberturaAncores: {
      fitxers: [...FITXERS_ANCORES],
      directorisPlans: [...DIRECTORIS_ANCORES],
      recursiu: false,
      nota: 'Les subcarpetes (lib/, __tests__/, …) no es recorren: una àncora citada només allà no protegix cap skill.',
    },
    triggersDuplicatsExactes,
    triggersDuplicatsNormalitzats,
    solapamentsSemanticsTriggers,
    escripturesCompartides,
    skillsSenseContracte,
    anomalies,
    skills,
  };
}

export function executaCliAuditaSkills(argv = process.argv.slice(2)) {
  let arrel = null;
  let modeJson = false;
  let fitxerSortida = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      modeJson = true;
    } else if (arg.startsWith('--arrel=')) {
      arrel = arg.slice('--arrel='.length);
    } else if (arg === '--arrel' && argv[i + 1]) {
      arrel = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--output=')) {
      fitxerSortida = arg.slice('--output='.length);
    } else if (arg === '--output' && argv[i + 1]) {
      fitxerSortida = argv[i + 1];
      i += 1;
    }
  }

  const informe = auditaGrafSkills(arrel ?? arrelSegura());
  if (fitxerSortida) {
    fs.writeFileSync(path.resolve(fitxerSortida), `${JSON.stringify(informe, null, 2)}\n`, 'utf8');
  }

  if (modeJson) {
    console.log(JSON.stringify(informe, null, 2));
  } else {
    console.log(
      `📊 [GRAF SKILLS] ${informe.resum.totalSkills} skills · `
      + `${informe.resum.skillsProtegidesPelSistema} ancorades · `
      + `${informe.resum.triggersDuplicatsExactes} triggers duplicats exactes · `
      + `${informe.resum.escripturesCompartides} carrils d'escriptura compartits · `
      + `${informe.resum.anomaliesCritiques} anomalies crítiques.`,
    );
  }
  return informe.ok ? 0 : 1;
}

if (esMain(import.meta.url)) {
  process.exitCode = executaCliAuditaSkills();
}
