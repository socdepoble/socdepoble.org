#!/usr/bin/env node
/**
 * tractor-coherencia-editorial-viva.mjs — Porta de Coherència Editorial i Didàctica Viva
 *
 * Vinculat a la skill canònica `core-coherencia-editorial-viva` i governat pel
 * mapa declaratiu `.agents/coherencia-editorial-mapa.json` (IDEA-273, Onada R31).
 *
 * LLEIS MECÀNIQUES (fail-closed):
 *   CEV-1 · Mapa declaratiu vàlid i fonts presents al disc: esquema, les 5 llengües
 *           exactes, lèxic i pàgines no buits, patrons compilables, i cada ruta de
 *           versions, censos i dominis de propagació present (la barra final és un
 *           directori). Un mapa invàlid atura la porta abans de les altres lleis.
 *   CEV-2 · Paritat viva de versions i builds (package.json ↔ versio-viva.json ↔
 *           Android build.gradle ↔ iOS project.pbxproj ↔ VERSIO_CLIENT_NATIU ↔
 *           píndola i subtítol de /versions en les 5 llengües).
 *   CEV-3 · Veracitat de censos entre codi, web i Wiki (12 membres del Consell,
 *           43 skills a .agents/skills, 8 escoles del Node 0 en 5 llengües ancorades
 *           al substantiu de cada llengua, en xifra o en lletra, React major real i
 *           vigència ADR-2026-10 a 00_arquitectura_tecnica_unificada.md).
 *   CEV-4 · Zero lèxic prohibit (Llei 0) en PAGE_COPY (5 llengües), articles vius,
 *           public/llms.txt, public/md/*.md i Wiki viva (01_ser, 02_saber, 03_actuar).
 *           I llms.txt és la projecció de publication-policy.mjs (genera-llms.mjs):
 *           el text de public/llms.txt i la llista de fitxers de public/md han de
 *           ser els de la projecció (P0-CONSOLIDACIO-3-CATEDRES). El cos de cada .md
 *           el comprova sencer «genera-llms.mjs --comprova», no esta porta.
 *   CEV-5 · Paritat estructural i rutes internes verificades en les 5 llengües
 *           (ca, es, en, eu, gl), sense marcadors {placeholder} oblidats ni hrefs trencats.
 *   CEV-6 · Propagació editorial per dominis (--changed f1,f2 o --git-diff [ref],
 *           amb --strict-propagation per bloquejar canvis de codi orfes de revisió editorial).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PROJECT_DIR, WIKI_DIR } from '../wiki/lib/project_paths.mjs';
import { esMain } from '../lib/arrel.mjs';
import { projectaLlms, RUTA_LLMS, CARPETA_MD } from '../seo/genera-llms.mjs';

const ESQUEMA_ESPERAT = 'sdp.coherencia-editorial-viva.v1';
const MAPA_REL = '.agents/coherencia-editorial-mapa.json';
const WIKI_REL = path.relative(PROJECT_DIR, WIKI_DIR);
const LLENGUES_ESPERADES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const CLAUS_VERSIONS = Object.freeze(['packageJson', 'versioVivaJson', 'androidBuildGradle', 'iosProjectPbxproj', 'contracteNatiu', 'versionsPage']);
const CLAUS_CENS = Object.freeze(['consellJson', 'wikiEquipIa', 'skillsDir', 'wikiFullDeRuta', 'wikiInventariSkills', 'wikiArquitecturaUnificada']);

/* R32 · Nombres escrits en lletra que el text pot fer servir per al cens d'escoles
   («Huit escoles locals», «Eight local review schools»). Llista tancada: una paraula
   que no hi és (un article, per exemple) no és una xifra i no compta. */
const NOMBRES_ESCRITS = Object.freeze({
  ca: { un: 1, una: 1, dos: 2, dues: 2, tres: 3, quatre: 4, cinc: 5, sis: 6, set: 7, huit: 8, vuit: 8, nou: 9, deu: 10, onze: 11, dotze: 12 },
  es: { uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12 },
  en: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 },
  eu: { bi: 2, hiru: 3, lau: 4, bost: 5, sei: 6, zazpi: 7, zortzi: 8, bederatzi: 9, hamar: 10, hamaika: 11, hamabi: 12 },
  gl: { un: 1, unha: 1, dous: 2, 'dúas': 2, tres: 3, catro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, once: 11, doce: 12 },
});

const esTextNoBuit = (x) => typeof x === 'string' && x.trim().length > 0;
const esLlistaDeTextos = (x) => Array.isArray(x) && x.length > 0 && x.every(esTextNoBuit);

function compila(patro, flags) {
  try {
    return new RegExp(patro, flags);
  } catch {
    return null;
  }
}

/** Una ruta del mapa és relativa a l'arrel, no hi ix, i existix amb el tipus declarat
 *  (amb barra final, directori; sense, qualsevol entrada present). */
function rutaDelMapaPresent(arrel, rel, { directori = false } = {}) {
  if (!esTextNoBuit(rel) || path.isAbsolute(rel) || rel.split('/').includes('..')) return false;
  const abs = path.join(arrel, rel);
  if (!fs.existsSync(abs)) return false;
  return directori ? fs.statSync(abs).isDirectory() : true;
}

/**
 * CEV-1 · Valida el mapa declaratiu sencer. Torna una llista de { fitxer, detall };
 * buida vol dir mapa vàlid. Pura llevat de les comprovacions d'existència al disc.
 */
export function validaMapaCoherencia(mapa, arrel) {
  const errors = [];
  const err = (fitxer, detall) => errors.push({ fitxer, detall });
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) {
    err(MAPA_REL, 'El mapa ha de ser un objecte JSON');
    return errors;
  }
  if (mapa.schema !== ESQUEMA_ESPERAT || mapa.skillCanonica !== 'core-coherencia-editorial-viva') {
    err(MAPA_REL, `Esquema o skillCanonica invàlids (esperat ${ESQUEMA_ESPERAT} / core-coherencia-editorial-viva)`);
  }
  if (!Array.isArray(mapa.llengues) || mapa.llengues.join(',') !== LLENGUES_ESPERADES.join(',')) {
    err(MAPA_REL, `llengues ha de ser exactament [${LLENGUES_ESPERADES.join(', ')}]`);
  }

  for (const [grup, claus] of [['versions', CLAUS_VERSIONS], ['invariantsCens', CLAUS_CENS]]) {
    for (const clau of claus) {
      const rel = mapa[grup]?.[clau];
      if (!esTextNoBuit(rel)) err(MAPA_REL, `Falta ${grup}.${clau}`);
      else if (!rutaDelMapaPresent(arrel, rel)) err(rel, `Ruta referenciada al mapa inexistent al disc: ${rel}`);
    }
  }

  const nEscoles = mapa.invariantsCens?.escolesNode0;
  if (!Number.isSafeInteger(nEscoles) || nEscoles <= 0) err(MAPA_REL, 'invariantsCens.escolesNode0 ha de ser un enter positiu');
  for (const lang of LLENGUES_ESPERADES) {
    const patro = mapa.invariantsCens?.escolesNode0Patrons?.[lang];
    const re = esTextNoBuit(patro) ? compila(`${patro}|`, 'u') : null;
    if (!re || re.exec('').length < 2) {
      err(MAPA_REL, `invariantsCens.escolesNode0Patrons.${lang} ha de ser un patró vàlid amb un grup que capture la xifra`);
    }
  }

  if (!Array.isArray(mapa.lexicProhibit) || mapa.lexicProhibit.length === 0) {
    err(MAPA_REL, 'lexicProhibit no pot ser buit');
  } else {
    const ids = new Set();
    for (const regla of mapa.lexicProhibit) {
      if (!esTextNoBuit(regla?.id) || ids.has(regla.id)) err(MAPA_REL, `Regla de lèxic sense id o amb id repetit: ${regla?.id}`);
      else ids.add(regla.id);
      if (!esTextNoBuit(regla?.patro) || !compila(regla.patro, 'i')) err(MAPA_REL, `Patró de lèxic invàlid a ${regla?.id}`);
      if (!esTextNoBuit(regla?.motiu)) err(MAPA_REL, `Regla de lèxic sense motiu: ${regla?.id}`);
    }
  }

  if (!esLlistaDeTextos(mapa.paginesMultilingues)) err(MAPA_REL, 'paginesMultilingues no pot ser buit');

  if (!Array.isArray(mapa.dominisPropagacio) || mapa.dominisPropagacio.length === 0) {
    err(MAPA_REL, 'dominisPropagacio no pot ser buit');
  } else {
    const ids = new Set();
    for (const domini of mapa.dominisPropagacio) {
      if (!esTextNoBuit(domini?.id) || ids.has(domini.id)) err(MAPA_REL, `Domini de propagació sense id o amb id repetit: ${domini?.id}`);
      else ids.add(domini.id);
      for (const camp of ['fontsCodi', 'destinsEditorials']) {
        if (!esLlistaDeTextos(domini?.[camp])) {
          err(MAPA_REL, `El domini «${domini?.id}» necessita ${camp} no buit`);
          continue;
        }
        for (const rel of domini[camp]) {
          if (!rutaDelMapaPresent(arrel, rel, { directori: rel.endsWith('/') })) {
            err(rel, `El domini «${domini.id}» declara a ${camp} una ruta inexistent al disc: ${rel}`);
          }
        }
      }
    }
  }
  return errors;
}

/**
 * CEV-3 · Xifres d'escoles locals del Node 0 que declara un text en una llengua.
 * El patró del mapa ancora la xifra al substantiu («8 escoles locals», «Node 0ko 8
 * eskola lokal»), en xifra o en lletra; un «8» d'una altra frase no hi compta.
 */
export function xifresEscolesNode0(text, lang, patro) {
  const pla = String(text || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ');
  const xifres = [];
  for (const m of pla.matchAll(new RegExp(patro, 'giu'))) {
    const token = String(m[1] || '').toLocaleLowerCase(lang);
    const n = /^\d+$/.test(token) ? Number(token) : NOMBRES_ESCRITS[lang]?.[token];
    if (n !== undefined) xifres.push(n);
  }
  return xifres;
}

function parseArgs(argv) {
  const opts = {
    arrel: process.cwd(),
    json: false,
    strictPropagation: false,
    changed: [],
    gitDiff: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const valor = () => {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new TypeError(`Falta el valor de ${a}`);
      return argv[++i];
    };
    if (a === '--json') opts.json = true;
    else if (a === '--strict-propagation') opts.strictPropagation = true;
    else if (a === '--arrel') { opts.arrel = path.resolve(valor()); }
    else if (a.startsWith('--arrel=')) {
      if (!a.slice('--arrel='.length)) throw new TypeError('Falta el valor de --arrel');
      opts.arrel = path.resolve(a.slice('--arrel='.length));
    }
    else if (a === '--changed') {
      const files = valor().split(',').map((s) => s.trim()).filter(Boolean);
      if (!files.length) throw new TypeError('Falten els fitxers de --changed');
      opts.changed.push(...files);
    } else if (a.startsWith('--changed=')) {
      const files = a.slice('--changed='.length).split(',').map((s) => s.trim()).filter(Boolean);
      if (!files.length) throw new TypeError('Falten els fitxers de --changed');
      opts.changed.push(...files);
    } else if (a === '--git-diff') {
      opts.gitDiff = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'HEAD';
    } else if (a.startsWith('--git-diff=')) {
      opts.gitDiff = a.slice('--git-diff='.length) || 'HEAD';
    } else throw new TypeError(`Argument desconegut: ${a}`);
  }
  return opts;
}

function caminaMarkdown(dirAbs, out = []) {
  if (!fs.existsSync(dirAbs)) return out;
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const full = path.join(dirAbs, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) caminaMarkdown(full, out);
    else if (ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function llevaBlocsCodiMarkdown(md) {
  const lines = md.split('\n');
  let dinsCodi = false;
  return lines.map((l) => {
    if (/^\s*(?:```|~~~)/.test(l)) {
      dinsCodi = !dinsCodi;
      return '';
    }
    return dinsCodi ? '' : l;
  }).join('\n');
}

function rutaInternaValida(href, { rutesApp, pageCopy, arrel }) {
  const cami = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (cami === '/') return true;
  if (fs.existsSync(path.join(arrel, 'public', cami.slice(1)))) return true;
  if (cami.startsWith('/opendata/') && cami.endsWith('.zip') && fs.existsSync(path.join(arrel, 'public', `${cami.slice(1)}.sha256`))) return true;
  const mPage = /^\/page\/([^/]+)$/.exec(cami);
  if (mPage) {
    return rutesApp.includes(`path="${cami}"`) || Object.hasOwn(pageCopy, mPage[1]);
  }
  const primer = cami.slice(1).split('/')[0];
  if (!primer) return true;
  return new RegExp(`path="/?${primer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/[^"]*|\\*)?"`).test(rutesApp);
}

export async function avaluaCoherenciaEditorial({
  arrel = process.cwd(),
  changed = [],
  gitDiff = null,
  strictPropagation = false,
} = {}) {
  const infraccions = [];
  const avisosPropagacio = [];
  const lleisVerdes = [];
  const R = (rel) => path.join(arrel, rel);

  const falla = (llei, fitxer, detall) => {
    infraccions.push({ llei, fitxer, detall });
  };

  // ── CEV-1 · Mapa declaratiu vàlid ──
  const mapaAbs = R(MAPA_REL);
  if (!fs.existsSync(mapaAbs)) {
    falla('CEV-1', MAPA_REL, 'Falta el mapa declaratiu .agents/coherencia-editorial-mapa.json');
    return { valid: false, infraccions, avisosPropagacio, lleisVerdes };
  }

  let mapa;
  try {
    mapa = JSON.parse(fs.readFileSync(mapaAbs, 'utf8'));
  } catch (err) {
    falla('CEV-1', MAPA_REL, `JSON invàlid: ${err.message}`);
    return { valid: false, infraccions, avisosPropagacio, lleisVerdes };
  }

  // Un mapa incomplet no pot certificar res: ni llengües buides, ni lèxic buit, ni
  // dominis que vigilen camins inexistents. Fail-closed abans de les altres lleis.
  for (const { fitxer, detall } of validaMapaCoherencia(mapa, arrel)) falla('CEV-1', fitxer, detall);
  if (infraccions.length > 0) return { valid: false, infraccions, avisosPropagacio, lleisVerdes };
  lleisVerdes.push('CEV-1');

  // Importa mòduls vius del projecte des d'arrel
  const bust = `?t=${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const { PAGE_COPY } = await import(pathToFileURL(R('src/sections/text/pageContent.js')).href + bust);
  const { localitzaPagina } = await import(pathToFileURL(R('src/sections/text/pageContent.r10.js')).href + bust);
  const { VERSIO_CLIENT_NATIU } = await import(pathToFileURL(R('src/data/contracte.js')).href + bust);
  let LA_VEU_DE_SOC_DE_POBLE_COPY = null;
  if (fs.existsSync(R('src/sections/mur/articles/laVeuDeSocDePobleContent.js'))) {
    ({ LA_VEU_DE_SOC_DE_POBLE_COPY } = await import(pathToFileURL(R('src/sections/mur/articles/laVeuDeSocDePobleContent.js')).href + bust));
  }

  // ── CEV-2 · Paritat viva de versions i builds ──
  const pkg = JSON.parse(fs.readFileSync(R(mapa.versions.packageJson), 'utf8'));
  const versioViva = JSON.parse(fs.readFileSync(R(mapa.versions.versioVivaJson), 'utf8'));
  const gradleTxt = fs.readFileSync(R(mapa.versions.androidBuildGradle), 'utf8');
  const pbxTxt = fs.readFileSync(R(mapa.versions.iosProjectPbxproj), 'utf8');

  const vPkg = String(pkg.version || '').trim();
  const vViva = String(versioViva.versioSistema || '').trim();
  const vAndroid = gradleTxt.match(/\bversionName\s+"([^"]+)"/)?.[1]?.trim() ?? '';
  const codeAndroid = Number(gradleTxt.match(/\bversionCode\s+(\d+)/)?.[1] ?? NaN);
  const marketingIos = [...new Set([...pbxTxt.matchAll(/\bMARKETING_VERSION\s*=\s*([0-9.]+)\s*;/g)].map((m) => m[1]))];
  const projectVerIos = [...new Set([...pbxTxt.matchAll(/\bCURRENT_PROJECT_VERSION\s*=\s*(\d+)\s*;/g)].map((m) => Number(m[1])))];

  if (vViva !== vPkg) {
    falla('CEV-2', mapa.versions.versioVivaJson, `versioSistema (${vViva}) != package.json (${vPkg})`);
  }
  if (vAndroid !== vPkg) {
    falla('CEV-2', mapa.versions.androidBuildGradle, `versionName (${vAndroid}) != package.json (${vPkg})`);
  }
  if (marketingIos.length !== 1 || marketingIos[0] !== vPkg) {
    falla('CEV-2', mapa.versions.iosProjectPbxproj, `MARKETING_VERSION (${marketingIos.join(',')}) != package.json (${vPkg})`);
  }
  if (codeAndroid !== VERSIO_CLIENT_NATIU) {
    falla('CEV-2', mapa.versions.androidBuildGradle, `versionCode (${codeAndroid}) != VERSIO_CLIENT_NATIU (${VERSIO_CLIENT_NATIU})`);
  }
  if (projectVerIos.length !== 1 || projectVerIos[0] !== VERSIO_CLIENT_NATIU) {
    falla('CEV-2', mapa.versions.iosProjectPbxproj, `CURRENT_PROJECT_VERSION (${projectVerIos.join(',')}) != VERSIO_CLIENT_NATIU (${VERSIO_CLIENT_NATIU})`);
  }

  const pindolaVersions = PAGE_COPY.versions?.labels?.[0]?.text ?? '';
  if (!pindolaVersions.startsWith(`v${vPkg} `)) {
    falla('CEV-2', mapa.versions.versionsPage, `Píndola de /versions («${pindolaVersions}») no comença per v${vPkg}`);
  }
  for (const lang of mapa.llengues) {
    const loc = localitzaPagina(PAGE_COPY.versions, lang, 'versions');
    if (!String(loc?.subtitle || '').includes(`v${vPkg}`)) {
      falla('CEV-2', `PAGE_COPY.versions.${lang}`, `El subtítol de /versions en ${lang} («${loc?.subtitle}») no anuncia v${vPkg}`);
    }
  }
  if (!infraccions.some((x) => x.llei === 'CEV-2')) lleisVerdes.push('CEV-2');

  // ── CEV-3 · Veracitat de censos entre codi, web i Wiki ──
  const consell = JSON.parse(fs.readFileSync(R(mapa.invariantsCens.consellJson), 'utf8'));
  const membresActius = (consell.membres || []).filter((m) => m.actiu !== false);
  const equipMd = fs.readFileSync(R(mapa.invariantsCens.wikiEquipIa), 'utf8');
  const filesTaulaEquip = equipMd
    .split('\n')
    .filter((l) => /^\|\s*[a-z0-9-]+\s*\|/i.test(l) && !/^\|\s*Identificador\s*\|/i.test(l) && !/^\|\s*---/.test(l));
  if (filesTaulaEquip.length !== membresActius.length) {
    falla(
      'CEV-3',
      mapa.invariantsCens.wikiEquipIa,
      `La taula d’Equip IA llista ${filesTaulaEquip.length} membres però consell.json té ${membresActius.length} actius`,
    );
  }

  const skillsReals = fs.readdirSync(R(mapa.invariantsCens.skillsDir), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && fs.existsSync(path.join(R(mapa.invariantsCens.skillsDir), d.name, 'SKILL.md')));
  const nSkills = skillsReals.length;

  const fullDeRutaMd = fs.readFileSync(R(mapa.invariantsCens.wikiFullDeRuta), 'utf8');
  const mFullSkills = fullDeRutaMd.match(/\b(\d+)\s+skills\b/i);
  if (!mFullSkills || Number(mFullSkills[1]) !== nSkills) {
    falla(
      'CEV-3',
      mapa.invariantsCens.wikiFullDeRuta,
      `00_full_de_ruta.md declara «${mFullSkills?.[0] ?? 'cap recompte'}» però .agents/skills té ${nSkills} skills`,
    );
  }

  const invSkillsMd = fs.readFileSync(R(mapa.invariantsCens.wikiInventariSkills), 'utf8');
  const mInvSkills = invSkillsMd.match(/\|\s*skills actives\s*\|\s*(\d+)\s*\|/i);
  if (!mInvSkills || Number(mInvSkills[1]) !== nSkills) {
    falla(
      'CEV-3',
      mapa.invariantsCens.wikiInventariSkills,
      `03_inventari_skills.md declara ${mInvSkills?.[1] ?? 'cap'} skills actives però .agents/skills té ${nSkills}`,
    );
  }

  const reactSpec = String(pkg.dependencies?.react || '');
  const reactMajor = reactSpec.match(/(\d+)/)?.[1] ?? '';
  const arqMd = fs.readFileSync(R(mapa.invariantsCens.wikiArquitecturaUnificada), 'utf8');
  const mReactDoc = arqMd.match(/\bReact\s+(\d+)\b/);
  if (!mReactDoc || mReactDoc[1] !== reactMajor) {
    falla(
      'CEV-3',
      mapa.invariantsCens.wikiArquitecturaUnificada,
      `00_arquitectura_tecnica_unificada.md declara «React ${mReactDoc?.[1] ?? '?'}» però package.json usa React ${reactMajor}`,
    );
  }
  if (!arqMd.includes('ADR-2026-10')) {
    falla(
      'CEV-3',
      mapa.invariantsCens.wikiArquitecturaUnificada,
      '00_arquitectura_tecnica_unificada.md ha de reflectir la vigència d’ADR-2026-10 (PWA de closca i IndexedDB d’apps del dispositiu)',
    );
  }

  // R32 · La xifra s'ancora al substantiu de cada llengua: el text de node-zero ja
  // conté altres «8» (àmbits de publicació, 8.132 municipis) que no acrediten el cens.
  const nEscoles = mapa.invariantsCens.escolesNode0;
  for (const lang of mapa.llengues) {
    const nz = localitzaPagina(PAGE_COPY['node-zero'], lang, 'node-zero');
    const xifres = xifresEscolesNode0(
      `${nz?.title || ''} ${nz?.lead || ''} ${nz?.html || ''}`,
      lang,
      mapa.invariantsCens.escolesNode0Patrons[lang],
    );
    if (xifres.length === 0 || xifres.some((n) => n !== nEscoles)) {
      falla(
        'CEV-3',
        `PAGE_COPY.node-zero.${lang}`,
        `/page/node-zero (${lang}) ha d’esmentar les ${nEscoles} escoles locals del Node 0 i cap altra xifra (trobades: ${xifres.join(', ') || 'cap'})`,
      );
    }
  }
  if (!infraccions.some((x) => x.llei === 'CEV-3')) lleisVerdes.push('CEV-3');

  // ── CEV-4 · Zero lèxic prohibit (Llei 0) ──
  const reglesLexic = (mapa.lexicProhibit || []).map((r) => ({ ...r, re: new RegExp(r.patro, 'i') }));

  for (const [clau, pagina] of Object.entries(PAGE_COPY)) {
    for (const lang of mapa.llengues) {
      const loc = localitzaPagina(pagina, lang, clau);
      const mostra = [loc?.title, loc?.subtitle, loc?.lead, loc?.html].filter(Boolean).join('\n');
      for (const regla of reglesLexic) {
        const hit = regla.re.exec(mostra);
        if (hit) {
          falla('CEV-4', `PAGE_COPY.${clau} (${lang})`, `[${regla.id}] «${hit[0]}» — ${regla.motiu}`);
        }
      }
    }
  }

  if (LA_VEU_DE_SOC_DE_POBLE_COPY) {
    for (const lang of mapa.llengues) {
      const v = LA_VEU_DE_SOC_DE_POBLE_COPY[lang];
      const mostra = [v?.title, v?.subtitle, v?.lead, v?.html].filter(Boolean).join('\n');
      for (const regla of reglesLexic) {
        const hit = regla.re.exec(mostra);
        if (hit) {
          falla('CEV-4', `LA_VEU_DE_SOC_DE_POBLE_COPY (${lang})`, `[${regla.id}] «${hit[0]}» — ${regla.motiu}`);
        }
      }
    }
  }

  if (fs.existsSync(R('public/llms.txt'))) {
    const llmsTxt = fs.readFileSync(R('public/llms.txt'), 'utf8');
    for (const regla of reglesLexic) {
      const hit = regla.re.exec(llmsTxt);
      if (hit) falla('CEV-4', 'public/llms.txt', `[${regla.id}] «${hit[0]}» — ${regla.motiu}`);
    }
  }

  /* P0-CONSOLIDACIO-3-CATEDRES · La còpia Markdown de la Wiki passa pel mateix
     lèxic que la Wiki (sense blocs de codi), i llms.txt no s'edita a mà: el seu
     text i la llista de public/md són els de la projecció de publication-policy.mjs. */
  const carpetaMd = R(CARPETA_MD);
  /* Els noms amb punt inicial (.DS_Store del Finder) els governa .gitignore, no la projecció. */
  const mdAlDisc = fs.existsSync(carpetaMd) ? fs.readdirSync(carpetaMd).filter((n) => !n.startsWith('.')).sort() : [];
  for (const nom of mdAlDisc.filter((n) => n.endsWith('.md'))) {
    const net = llevaBlocsCodiMarkdown(fs.readFileSync(path.join(carpetaMd, nom), 'utf8'));
    for (const regla of reglesLexic) {
      const hit = regla.re.exec(net);
      if (hit) falla('CEV-4', `${CARPETA_MD}/${nom}`, `[${regla.id}] «${hit[0]}» — ${regla.motiu}`);
    }
  }
  try {
    const projeccio = projectaLlms({ root: arrel });
    const llmsAlDisc = fs.existsSync(R(RUTA_LLMS)) ? fs.readFileSync(R(RUTA_LLMS), 'utf8') : null;
    if (llmsAlDisc !== projeccio.llms) {
      falla('CEV-4', RUTA_LLMS, 'llms.txt editat a mà o desfasat: no és la projecció de publication-policy.mjs (npm run llms:build)');
    }
    const esperats = [...projeccio.fitxers.keys()].map((slug) => `${slug}.md`).sort();
    const sobren = mdAlDisc.filter((nom) => !esperats.includes(nom));
    const falten = esperats.filter((nom) => !mdAlDisc.includes(nom));
    if (sobren.length || falten.length) {
      falla('CEV-4', CARPETA_MD, `${CARPETA_MD} no és la projecció pública (sobren: ${sobren.join(', ') || 'cap'}; falten: ${falten.join(', ') || 'cap'}; npm run llms:build)`);
    }
  } catch (e) {
    falla('CEV-4', RUTA_LLMS, `La projecció de llms.txt no es pot calcular: ${e.message}`);
  }

  const wikiViva = [
    ...caminaMarkdown(R(path.join(WIKI_REL, '01_ser'))),
    ...caminaMarkdown(R(path.join(WIKI_REL, '02_saber'))),
    ...caminaMarkdown(R(path.join(WIKI_REL, '03_actuar'))),
  ];
  for (const abs of wikiViva) {
    const relFitxer = path.relative(arrel, abs).split(path.sep).join('/');
    const net = llevaBlocsCodiMarkdown(fs.readFileSync(abs, 'utf8'));
    for (const regla of reglesLexic) {
      const hit = regla.re.exec(net);
      if (hit) falla('CEV-4', relFitxer, `[${regla.id}] «${hit[0]}» — ${regla.motiu}`);
    }
  }
  if (!infraccions.some((x) => x.llei === 'CEV-4')) lleisVerdes.push('CEV-4');

  // ── CEV-5 · Paritat 5 llengües i rutes internes vives ──
  const rutesApp = fs.readFileSync(R('src/app/App.jsx'), 'utf8');
  for (const clau of mapa.paginesMultilingues || []) {
    const base = PAGE_COPY[clau];
    if (!base) {
      falla('CEV-5', `PAGE_COPY.${clau}`, `La pàgina multilingüe «${clau}» no existix a PAGE_COPY`);
      continue;
    }
    for (const lang of mapa.llengues) {
      const loc = localitzaPagina(base, lang, clau);
      if (!loc?.title || String(loc.title).trim().length < 3) {
        falla('CEV-5', `PAGE_COPY.${clau}.${lang}`, 'Títol buit o massa curt');
      }
      if (!loc?.html || String(loc.html).trim().length < 40) {
        falla('CEV-5', `PAGE_COPY.${clau}.${lang}`, 'Cos HTML buit o truncat');
      }
      const textComplet = [loc?.title, loc?.subtitle, loc?.lead, loc?.html].filter(Boolean).join(' ');
      const placeholder = textComplet.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/);
      if (placeholder) {
        falla('CEV-5', `PAGE_COPY.${clau}.${lang}`, `Marcador sense interpolar: ${placeholder[0]}`);
      }
    }
  }

  for (const [clau, pagina] of Object.entries(PAGE_COPY)) {
    for (const lang of mapa.llengues) {
      const loc = localitzaPagina(pagina, lang, clau);
      const html = String(loc?.html || '');
      for (const m of html.matchAll(/\bhref="(\/[^"]*)"/g)) {
        const href = m[1];
        if (!rutaInternaValida(href, { rutesApp, pageCopy: PAGE_COPY, arrel })) {
          falla('CEV-5', `PAGE_COPY.${clau}.${lang}`, `Enllaç intern trencat o sense ruta declarada: ${href}`);
        }
      }
    }
  }
  if (!infraccions.some((x) => x.llei === 'CEV-5')) lleisVerdes.push('CEV-5');

  // ── CEV-6 · Propagació editorial per dominis ──
  const canviats = new Set(changed.map((c) => c.replace(/\\/g, '/').replace(/^\.\//, '')));
  if (gitDiff) {
    try {
      if (typeof gitDiff !== 'string' || gitDiff.startsWith('-')) throw new TypeError('Referència Git invàlida');
      const diffOut = execFileSync('git', ['diff', '--name-only', '-z', gitDiff, '--'], {
        cwd: arrel,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      for (const line of diffOut.split('\0').filter(Boolean)) {
        canviats.add(line);
      }
    } catch (error) {
      // Una lectura de canvis sol·licitada que falla no acredita propagació,
      // tampoc en un arbre exportat ni quan no s'ha demanat mode estricte.
      falla('CEV-6', '.git', `No s’ha pogut determinar els canvis de la referència Git «${gitDiff}» (${error.code || error.status || 'referència invàlida'}).`);
    }
  }

  if (canviats.size > 0) {
    const llistaCanviats = [...canviats];
    for (const domini of mapa.dominisPropagacio || []) {
      const fontsTocades = llistaCanviats.filter((f) =>
        (domini.fontsCodi || []).some((font) => (font.endsWith('/') ? f.startsWith(font) : f === font))
      );
      if (fontsTocades.length === 0) continue;
      const destinsTocats = llistaCanviats.filter((f) =>
        (domini.destinsEditorials || []).some((dest) => (dest.endsWith('/') ? f.startsWith(dest) : f === dest))
      );
      if (destinsTocats.length === 0) {
        const detall = `Domini «${domini.id}» modificat (${fontsTocades.join(', ')}) sense revisar cap destí editorial vinculat (${domini.destinsEditorials.join(', ')})`;
        avisosPropagacio.push({ domini: domini.id, fontsTocades, destinsEditorials: domini.destinsEditorials, detall });
        if (strictPropagation) {
          falla('CEV-6', fontsTocades[0], detall);
        }
      }
    }
  }
  if (!infraccions.some((x) => x.llei === 'CEV-6')) lleisVerdes.push('CEV-6');

  return {
    valid: infraccions.length === 0,
    resum: {
      versioViva: vPkg,
      buildNatiu: VERSIO_CLIENT_NATIU,
      membresConsell: membresActius.length,
      skillsActives: nSkills,
      paginesCopy: Object.keys(PAGE_COPY).length,
      wikiVivaRevisada: wikiViva.length,
    },
    lleisVerdes,
    avisosPropagacio,
    infraccions,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const resultat = await avaluaCoherenciaEditorial(opts);

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(resultat, null, 2)}\n`);
    process.exit(resultat.valid ? 0 : 1);
  }

  console.log('📖 TRACTOR DE COHERÈNCIA EDITORIAL I DIDÀCTICA VIVA (core-coherencia-editorial-viva)');
  if (resultat.resum) {
    console.log(
      `   v${resultat.resum.versioViva} (build ${resultat.resum.buildNatiu}) · `
      + `${resultat.resum.membresConsell} membres Consell · ${resultat.resum.skillsActives} skills · `
      + `${resultat.resum.paginesCopy} pàgines web · ${resultat.resum.wikiVivaRevisada} docs Wiki viva`
    );
  }
  console.log('──────────────────────────────────────────────────────────────────────────');
  for (const llei of ['CEV-1', 'CEV-2', 'CEV-3', 'CEV-4', 'CEV-5', 'CEV-6']) {
    const ok = resultat.lleisVerdes.includes(llei);
    console.log(`  ${ok ? '✅' : '❌'} ${llei}`);
  }
  if (resultat.avisosPropagacio.length > 0) {
    console.log('──────────────────────────────────────────────────────────────────────────');
    for (const a of resultat.avisosPropagacio) {
      console.warn(`  ⚠️  [PROPAGACIÓ] ${a.detall}`);
    }
  }
  if (!resultat.valid) {
    console.error('──────────────────────────────────────────────────────────────────────────');
    for (const inf of resultat.infraccions) {
      console.error(`  ✖ [${inf.llei}] ${inf.fitxer}: ${inf.detall}`);
    }
    process.exit(1);
  }
  console.log('──────────────────────────────────────────────────────────────────────────');
  console.log('Coherència editorial viva verificada en les 5 llengües i a la Wiki.');
}

if (esMain(import.meta.url)) {
  main().catch((err) => {
    console.error('❌ [COHERÈNCIA EDITORIAL VIVA] Error d’execució:', err.message);
    process.exit(2);
  });
}
