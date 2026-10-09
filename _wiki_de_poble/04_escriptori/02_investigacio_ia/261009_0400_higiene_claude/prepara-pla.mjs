#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261009 «Higiene» (Onada 6, front
 * d'higiene): motor de l'Escriptori net (porta Olivera v4, convocatòria), tancament i
 * despertar amb la porta, cron d'higiene (cron_higiene.mjs, plist, registre de tasques i
 * deduplicació de receptes a Plaquetes), les skills core-higiene-escriptori 4.0.0,
 * wiki-documentacio-i-reflex (lliçó 261009) i core-empaquetat-wp, i dos fragments de
 * l'arrel (script higiene:cron i .gitignore).
 *
 * Adaptat del de 261006_0300_ledger_claude/t6_higiene, amb una diferència: els fitxers
 * instal·lats no es copien sencers, es canvien amb substitucions exactes
 * (substitucions.json i el text literal de PECES.txt). Cada «abans» ha d'aparéixer una sola
 * vegada; si el resultat ja hi és, el canvi està aplicat. Els fitxers nous viuen sencers a
 * nous/ amb la ruta real (`.md.txt` → `.md`, `.plist.txt` → `.plist`).
 *
 * Deriva: cada fitxer substituït porta el sha256 que tenia quan es va preparar el paquet
 * (bases). Un altre sha vol dir que una altra mà l'ha tocat, i el pla es nega encara que
 * els ancoratges casen; amb --sobre-base-nova el Mestre ho accepta conscientment. Els
 * fitxers de l'arrel (package.json i .gitignore) només depenen dels seus ancoratges.
 * Quan l'executor ja ha deixat la transacció del paquet (operationId
 * `sdp-higiene-261009-paquet-*`), el pla es nega.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap fitxer del
 * repositori: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho escriu per stdout, i
 * la redirecció `>` la fa el Mestre amb les ordres que imprimix `comprova --session=ID`.
 * L'única escriptura és una còpia mínima de .agents/ a os.tmpdir() per a calcular la
 * projecció del catàleg, que es retira sempre.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID] [--sobre-base-nova]   # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID] [--sobre-base-nova]
 *   node LAB/prepara-pla.mjs petorreta --session=ID                      # Petorreta del bootstrap
 *   node LAB/prepara-pla.mjs manifest                                    # context.json del bootstrap
 *   node LAB/prepara-pla.mjs mostra RUTA                                 # el fitxer tal com quedaria
 *   node LAB/prepara-pla.mjs comprova --fase [--session=ID]              # flux de lease de la fase 2
 *   node LAB/prepara-pla.mjs fase-bloqueig [--session=ID]                # pla de la fase 2 (bandera)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_higiene_claude';
export const NOUS = path.join(LAB, 'nous');
export const SUBSTITUCIONS = path.join(LAB, 'substitucions.json');
export const PECES = path.join(LAB, 'PECES.txt');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Prefix de l'operationId del paquet i del de la fase 2: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-higiene-261009-paquet-';
export const OPERACIO_FASE = 'sdp-higiene-261009-fase-';
export const BANDERA = '.agents/olivera-fase.json';
export const INTENT = 'Paquet 261009 Higiene: porta Olivera v4 amb convocatoria, tancament i despertar amb la porta, cron d higiene amb launchd, receptes de Plaquetes sense duplicats, tres skills i dos fragments de l arrel, amb executor-mutacio';
export const INTENT_FASE = 'Paquet 261009 Higiene, fase 2: la convocatoria v4 de la porta Olivera passa de avis a bloqueig, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const INVENTARI = `${REL_LAB}/INVENTARI_BROSSA.txt`;
export const FLUX = `${REL_LAB}/FLUX_APROVACIO.txt`;
/** reflex_petorreta.mjs:807-812 exigix YYMMDD_HHMM_PROMPT_ i un títol de 8 a 12 paraules: estos en tenen 10 i 9. */
export const NOM_PETORRETA = '261009_0400_PROMPT_convocatoria_v4_cron_d_higiene_i_escriptori_net_amb_executor.md';
export const NOM_PETORRETA_FASE = '261009_0400_PROMPT_fase_de_bloqueig_de_la_convocatoria_amb_executor.md';
/** Projeccions del catàleg que la description nova de core-higiene-escriptori pot canviar. */
export const PROJECCIONS = Object.freeze(['.agents/manifest.yaml', '.agents/skills/00_INDEX_SKILLS.md']);
const TRANSACCIONS = '.agents/seal-transactions';
const FONTS_CATALEG = Object.freeze(['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']);
const US = `Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest|fase-bloqueig] [--session=ID] [--sobre-base-nova] | mostra RUTA`;

export const sha = (valor) => createHash('sha256').update(valor).digest('hex');

// Mateixos patrons que reflex_petorreta.mjs (SENSITIVE_PATTERNS): si casen, el seal fallaria.
export const PATRONS_SENSIBLES = [
  ['clau privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['secret assignat', /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/i],
  ['IBAN', /\b[A-Z]{2}\d{2}(?:[ ]?\d{4}){4,7}\b/],
  ['correu electrònic', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['DNI o NIE', /\b(?:\d{8}|[XYZ]\d{7})[A-Z]\b/i],
  ['telèfon personal probable', /(?<![A-Za-z0-9])(?:\+34[ .-]?)?[6789]\d{2}(?:[ .-]?\d{3}){2}(?![A-Za-z0-9])/],
];
export function sensibles(text) {
  return PATRONS_SENSIBLES.filter(([, re]) => re.test(text)).map(([tipus]) => tipus);
}

function rutaSegura(ruta) {
  if (typeof ruta !== 'string' || !ruta || path.isAbsolute(ruta) || ruta.includes('\\')
    || ruta.split('/').some((p) => !p || p === '.' || p === '..')) throw new Error(`Ruta no canònica: ${String(ruta)}`);
  return ruta;
}

/* ── Peces i substitucions ────────────────────────────────────────────────── */

/** Peces de PECES.txt: nom → text literal (amb el salt final, llevat de «· sense salt»). */
export function llegeixPeces(text = fs.readFileSync(PECES, 'utf8')) {
  const peces = new Map();
  const marca = /^=== PECA ([A-Za-z0-9.-]+)( · sense salt)? ===\n/gm;
  const trobades = [...text.matchAll(marca)];
  trobades.forEach((m, i) => {
    const inici = m.index + m[0].length;
    const final = i + 1 < trobades.length ? trobades[i + 1].index : text.length;
    let cos = text.slice(inici, final);
    if (m[2]) cos = cos.replace(/\n$/, '');
    if (peces.has(m[1])) throw new Error(`Peça repetida a PECES.txt: ${m[1]}`);
    peces.set(m[1], cos);
  });
  return peces;
}

/** substitucions.json amb les peces resoltes: per a cada fitxer, les alternatives d'«abans» i el resultat de cada una. */
export function substitucions({ fitxer = SUBSTITUCIONS, peces = llegeixPeces() } = {}) {
  const dades = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  if (dades.schema !== 'sdp.higiene.substitucions.v1' || !Array.isArray(dades.fitxers)) throw new Error('substitucions.json: esquema desconegut');
  const peca = (nom) => {
    if (!peces.has(nom)) throw new Error(`Peça absent a PECES.txt: ${nom}`);
    return peces.get(nom);
  };
  return dades.fitxers.map((f) => ({
    ruta: rutaSegura(f.ruta),
    bases: f.bases === null ? null : [...f.bases],
    canvis: f.canvis.map((c) => {
      const alternatives = c.abansPeca ? [peca(c.abansPeca)] : [].concat(c.abans);
      if (!alternatives.length || alternatives.some((a) => typeof a !== 'string' || !a)) throw new Error(`${f.ruta}: canvi sense «abans» (${c.motiu})`);
      const mode = c.mode ?? 'substituix';
      if (!['substituix', 'davant', 'darrere'].includes(mode)) throw new Error(`${f.ruta}: mode desconegut ${mode}`);
      const despres = (abans) => {
        if (!c.peca) {
          if (typeof c.despres !== 'string') throw new Error(`${f.ruta}: canvi sense «despres» ni «peca» (${c.motiu})`);
          return c.despres;
        }
        const p = peca(c.peca);
        return mode === 'davant' ? `${p}${abans}` : mode === 'darrere' ? `${abans}${p}` : p;
      };
      return { motiu: c.motiu, alternatives: alternatives.map((abans) => ({ abans, despres: despres(abans) })) };
    }),
  }));
}

const vegades = (text, tros) => text.split(tros).length - 1;

/**
 * Aplica els canvis en ordre sobre `text`. Cada canvi està aplicat (el resultat hi és una
 * vegada i cap «abans» solt) o pendent (exactament una alternativa hi és una sola vegada);
 * qualsevol altra cosa llança, sense tocar res. Torna el text nou i quants canvis s'han fet.
 */
export function aplicaCanvis(text, canvis, ruta = '') {
  let actual = text;
  let fets = 0;
  let aplicats = 0;
  for (const c of canvis) {
    const ja = c.alternatives.some(({ abans, despres }) => vegades(actual, despres) === 1 && (despres.includes(abans) || vegades(actual, abans) === 0));
    if (ja) { aplicats += 1; continue; }
    const presents = c.alternatives.filter(({ abans }) => vegades(actual, abans) === 1);
    if (presents.length !== 1) {
      const recompte = c.alternatives.map(({ abans }) => vegades(actual, abans)).join('/');
      throw new Error(`${ruta}: l'ancoratge de «${c.motiu}» no hi és exactament una vegada (${recompte}). Algú ha tocat el fitxer: refés el paquet, no el forces.`);
    }
    const [{ abans, despres }] = presents;
    const i = actual.indexOf(abans);
    actual = `${actual.slice(0, i)}${despres}${actual.slice(i + abans.length)}`;
    fets += 1;
  }
  return { text: actual, fets, aplicats };
}

/** Ruta real d'un fitxer de nous/: `.md.txt` → `.md` i `.plist.txt` → `.plist`. */
export function rutaReal(relNous) {
  return /\.(?:md|plist)\.txt$/.test(relNous) ? relNous.slice(0, -'.txt'.length) : relNous;
}

/** Fitxers de nous/, en ordre estable, amb la ruta real. El `.DS_Store` del Finder no compta. */
export function fitxersNous(nous = NOUS) {
  const out = [];
  (function recorre(rel) {
    const entrades = fs.readdirSync(rel ? path.join(nous, rel) : nous, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entrades) {
      if (e.name === '.DS_Store') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) recorre(r);
      else if (e.isFile()) out.push({ nou: r, ruta: rutaSegura(rutaReal(r)) });
      else throw new Error(`nous/${r}: només s'admeten fitxers regulars`);
    }
  })('');
  return out;
}

/**
 * Estat de cada fitxer del paquet contra el disc. Nous: `pendent` (no existix), `aplicat`
 * (idèntic) o `deriva` (existix i és un altre). Substituïts: `aplicat` (tots els canvis hi
 * són), `pendent` (cap no hi és i la base és la fixada, o no en té), `deriva-base` (els
 * ancoratges casen però el sha no és el fixat) o `deriva` (els ancoratges no casen). Només llig.
 */
export function estat(root = ARREL, { nous = NOUS, subst = substitucions() } = {}) {
  const out = [];
  for (const f of fitxersNous(nous)) {
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    if (original === null) out.push({ ...f, tipus: 'nou', contingut, before: null, estat: 'pendent' });
    else if (original.toString('utf8') === contingut) out.push({ ...f, tipus: 'nou', contingut, before: sha(original), estat: 'aplicat' });
    else out.push({ ...f, tipus: 'nou', contingut, before: sha(original), estat: 'deriva', motiu: `fitxer nou que ja existix al disc amb un altre contingut (sha ${sha(original)}): refés el paquet, no el forces` });
  }
  for (const s of subst) {
    const abs = path.join(root, s.ruta);
    if (!fs.existsSync(abs)) { out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'deriva', before: null, motiu: 'el fitxer no és al disc' }); continue; }
    const original = fs.readFileSync(abs);
    const actual = sha(original);
    let r;
    try { r = aplicaCanvis(original.toString('utf8'), s.canvis, s.ruta); }
    catch (error) { out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'deriva', before: actual, motiu: error.message }); continue; }
    if (r.fets === 0) { out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'aplicat', before: actual, contingut: r.text }); continue; }
    if (r.aplicats > 0) { out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'deriva', before: actual, motiu: `${r.aplicats} canvi(s) ja hi són i ${r.fets} no: aplicació a mitges` }); continue; }
    if (s.bases !== null && !s.bases.includes(actual)) {
      out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'deriva-base', before: actual, contingut: r.text, motiu: `els ancoratges casen, però el disc no és cap de les bases fixades (actual ${actual}); una altra mà l'ha tocat` });
      continue;
    }
    out.push({ ruta: s.ruta, tipus: 'substitucio', estat: 'pendent', before: actual, contingut: r.text });
  }
  return out;
}

/** El fitxer tal com quedaria amb el paquet (per a llegir-lo sencer abans d'aprovar). */
export function mostra(root, ruta, { subst = substitucions() } = {}) {
  const nou = fitxersNous().find((f) => f.ruta === ruta);
  if (nou) return fs.readFileSync(path.join(NOUS, nou.nou), 'utf8');
  const s = subst.find((x) => x.ruta === ruta);
  if (!s) throw new Error(`${ruta} no és del paquet`);
  return aplicaCanvis(fs.readFileSync(path.join(root, ruta), 'utf8'), s.canvis, ruta).text;
}

/** Primera transacció acceptada amb un prefix d'operationId, o null. Un registre il·legible no compta. */
function transaccioAmb(root, prefix) {
  const dir = path.join(root, TRANSACCIONS);
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(prefix) && Array.isArray(t.files)) return t;
  }
  return null;
}
export function transaccio(root = ARREL) {
  return transaccioAmb(root, OPERACIO);
}

/**
 * Projecció del catàleg de skills amb el paquet superposat: una còpia mínima de .agents/ a
 * os.tmpdir() (les skills del disc amb les substitucions del paquet i les quatre fonts de
 * cataleg_skills.mjs), amb inventari() i projeccions() del mòdul instal·lat. Si el catàleg
 * no carrega, ho diu; si el del disc ja no és la seua projecció, deriva; si no, les
 * projeccions que canvien amb la seua CAS. Es retira sempre la còpia.
 */
export async function projeccioCataleg(root = ARREL, { modul = root, subst = substitucions() } = {}) {
  const { inventari, projeccions } = await import(pathToFileURL(path.join(modul, 'tooling/brain/cataleg_skills.mjs')).href);
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-higiene-261009-cataleg-')));
  try {
    const munta = (dir, ambPaquet) => {
      fs.cpSync(path.join(root, '.agents/skills'), path.join(dir, '.agents/skills'), { recursive: true, verbatimSymlinks: true });
      for (const f of FONTS_CATALEG) {
        if (fs.existsSync(path.join(root, '.agents', f))) fs.copyFileSync(path.join(root, '.agents', f), path.join(dir, '.agents', f));
      }
      if (!ambPaquet) return;
      for (const s of subst.filter((x) => x.ruta.startsWith('.agents/skills/'))) {
        const abs = path.join(dir, s.ruta);
        fs.writeFileSync(abs, aplicaCanvis(fs.readFileSync(abs, 'utf8'), s.canvis, s.ruta).text);
      }
    };
    const base = path.join(tmp, 'base');
    const paquet = path.join(tmp, 'paquet');
    munta(base, false);
    munta(paquet, true);
    let abans;
    let despres;
    try {
      abans = projeccions(inventari(base));
      despres = projeccions(inventari(paquet));
    } catch (error) {
      return { carrega: false, motiu: error.message, fitxers: [] };
    }
    const llig = (rel) => (fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel)) : null);
    const divergents = [...abans].filter(([rel, text]) => llig(rel)?.toString('utf8') !== text).map(([rel]) => rel);
    if (divergents.length) return { carrega: true, deriva: divergents, fitxers: [] };
    const fitxers = [];
    for (const [rel, text] of despres) {
      const actual = llig(rel);
      if (actual !== null && actual.toString('utf8') === text) continue;
      fitxers.push({ ruta: rel, before: actual === null ? null : sha(actual), contingut: text });
    }
    return { carrega: true, fitxers };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Precondició de l'open (lliçó 261002 de wiki-documentacio-i-reflex, «Aprovació explícita
 * al frontend»): un tractor nou o canviat no és efectiu abans que el Mestre aprove des de
 * la Wiki el document que n'explica el flux (FLUX_APROVACIO.txt). Este script no ho pot
 * comprovar: ho recorda abans de l'ordre d'open.
 */
export const PRECONDICIO_WIKI = Object.freeze([
  "Precondició (lliçó 261002 de wiki-documentacio-i-reflex): abans d'este open, MarIA publica a la Wiki el flux de",
  `${FLUX} (porta Olivera v4, cron d'higiene i fase de bloqueig) i el Mestre l'aprova des de la pàgina.`,
  "Sense eixa aprovació no es fa l'open.",
]);

export function liniesOpen(scopes, { intent = INTENT } = {}) {
  return [
    ...PRECONDICIO_WIKI,
    '',
    "Ordre d'open (només amb la Wiki aprovada):",
    `node tooling/wiki/reflex_petorreta.mjs open --intent="${intent}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`,
  ];
}

/** Directori existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/**
 * Pla dels fitxers pendents, validat amb el mateix validatePlan de l'executor. Cap
 * escriptura al repositori. `sobreBaseNova` accepta els `deriva-base` (decisió del Mestre).
 */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true, sobreBaseNova = false, subst = substitucions() } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet 261009 Higiene ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root, { subst });
  const deriva = fitxers.filter((f) => f.estat === 'deriva' || (f.estat === 'deriva-base' && !sobreBaseNova));
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const pendents = fitxers.filter((f) => f.estat === 'pendent' || f.estat === 'deriva-base');
  if (!pendents.length) throw new Error('Res a aplicar: tots els fitxers del paquet ja són al disc. Arxiveu el laboratori.');
  const cat = await projeccioCataleg(root, { subst });
  if (cat.deriva) throw new Error(`Deriva del catàleg: ${cat.deriva.join(', ')} ja no és la projecció de les skills del disc. Una altra mà l'ha canviat; refés el paquet, no el forces.`);
  const avisos = cat.carrega ? [] : [`El catàleg de skills no carrega (${cat.motiu}): la description nova de core-higiene-escriptori no es projecta a .agents/skills/00_INDEX_SKILLS.md. Quan carregue (paquet 261009_0400_consola_claude, G5), node tooling/brain/cataleg_skills.mjs --escriu amb una lease.`];
  const plan = {
    schema: 'sdp.mutation.v1',
    session: sessio,
    operationId: `${OPERACIO}${sessio.slice(0, 8)}`,
    files: [
      ...pendents.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut })),
      ...cat.fitxers.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut })),
    ],
  };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = plan.files.map((f) => f.path);
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta), avisos };
}

/**
 * Fase 2: la bandera passa a «bloqueig». Només quan el paquet ja és al disc i la bandera diu
 * «avis»; el text conserva el comentari i canvia el valor.
 */
export async function preparaFaseBloqueig(root = ARREL, { sessio = SESSIO_ZERO, validar = true } = {}) {
  const abs = path.join(root, BANDERA);
  if (!fs.existsSync(abs)) throw new Error(`${BANDERA} no hi és: primer s'aplica el paquet (fase «avis»).`);
  const actual = fs.readFileSync(abs, 'utf8');
  let fase;
  try { fase = JSON.parse(actual).fase; } catch { throw new Error(`${BANDERA} il·legible: la porta ja la llig com a «bloqueig»; reviseu-la a mà.`); }
  if (fase === 'bloqueig') throw new Error(`${BANDERA} ja diu «bloqueig».`);
  if (fase !== 'avis') throw new Error(`${BANDERA} diu «${fase}»: reviseu-la a mà.`);
  const contingut = actual.replace(/"fase":\s*"avis"/, '"fase": "bloqueig"');
  const plan = { schema: 'sdp.mutation.v1', session: sessio, operationId: `${OPERACIO_FASE}${sessio.slice(0, 8)}`, files: [{ path: BANDERA, before: sha(actual), content: contingut }] };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  return { plan, scopes: scopesDe(root, [BANDERA]), targets: [BANDERA], avisos: [] };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER, el flux d'aprovació i l'inventari, que porten el què, el perquè i les decisions. */
export function manifest() {
  const sources = [
    { path: LLEGIU, reason: 'Què canvia el paquet 261009 Higiene, ordre d’aplicació, com es desfà, decisions per defecte i límits.', classification: 'internal', role: 'reference' },
    { path: FLUX, reason: 'Flux dels tractors nous (porta Olivera v4, cron d’higiene) per a l’aprovació a la Wiki (lliçó 261002).', classification: 'internal', role: 'reference' },
    { path: INVENTARI, reason: 'Inventari de brossa verificat amb veredicte i ordres per al Mestre.', classification: 'internal', role: 'reference' },
  ];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets, fase = false }) {
  const titol = fase ? 'Higiene 261009, fase 2: la convocatòria v4 passa a bloqueig' : 'Higiene 261009: convocatòria v4, cron d’higiene i Escriptori net';
  const context = fase
    ? `El paquet 261009 Higiene ja és al disc amb la convocatòria v4 de la porta Olivera en fase «avis»: durant una Onada sencera les troballes (àncora repetida, viu sense motiu, trinitat, secció 0 i pla incomplet) han eixit com a avisos a l'informe, al briefing, al despertar i al tancament. El Mestre decidix que ja poden bloquejar. El pla només canvia el valor de la bandera ${BANDERA}; el codi no canvia.`
    : `La lectura de l'Onada 6 (punts 2 i 3 del prompt 261009_0230) troba que la porta Olivera dona verd a tot el que està declarat viu, que la declaració no caduca, que les àncores repetides no es veuen, que la trinitat (el pla abans que el prompt) no la comprova cap circuit de creació, que una secció 0 amb [pendent] passa, que el tancament no passa la porta i que el despertar no la llig. Tampoc hi ha cap cron que netege: Plaquetes només diagnostica i escriu una recepta idèntica a cada execució. El paquet complet viu al laboratori ${REL_LAB}: substitucions exactes sobre els fitxers instal·lats (substitucions.json i PECES.txt) i fitxers nous a nous/, provats a tests/laboratori-higiene-261009.test.js contra una còpia del repositori.`;
  const tasques = fase
    ? `- ${BANDERA}: «avis» passa a «bloqueig».`
    : [
      '- tooling/gates/porta-olivera.mjs: checkConvocatoria (vida justificada amb motiu, àncores repetides, trinitat, secció 0 feta, pla complet i sediment com a mètrica), checkEscriptori, checkTancament i el mode --tancament; --arxiva se’n du la línia de declaració sencera.',
      '- tooling/documental/draft-write.mjs i turns.mjs: context i create de prompt passen per la convocatòria i en tornen els avisos; tooling/wiki/document.mjs els escriu per stderr.',
      '- tooling/gates/antigravity-hook.mjs: briefing amb qui necessita cada viu; la taula de pre-invocation és checkEscriptori.',
      '- tooling/gates/tancament.mjs: comprovació olivera a environmentChecks amb el torn que es tanca; tooling/brain/despertar.mjs: informe Olivera al canal fresc i segell de l’ESTAT en format llarg.',
      '- tooling/higiene/cron_higiene.mjs, scripts/immunitari/org.socdepoble.higiene.plist i .agents/cron/registre_tasques.json: cron d’higiene L0, L1 i L2; scripts/immunitari/plaquetes.mjs: una recepta nova només si l’empremta canvia; tooling/brain/mapa-consola.mjs: interval dels plist amb StartCalendarInterval.',
      '- .agents/olivera-fase.json en fase avis; les skills core-higiene-escriptori 4.0.0, wiki-documentacio-i-reflex (lliçó 261009) i core-empaquetat-wp (destinació única i retenció); tests/backend_consolidacio.test.mjs aïlla la comprovació nova; package.json (higiene:cron) i .gitignore.',
    ].join('\n');
  const riscos = fase
    ? '- En fase de bloqueig, un viu sense motiu o un pla incomplet aturen context i create de prompts, els hooks d’escriptura de petorretes, l’informe i el tancament. Si bloqueja a mitja Onada, el Mestre pot tornar la bandera a avis.'
    : [
      '- Entre el seal i l’executor no pot canviar res del repositori: el Reflex compara HEAD i l’estat de git sencer.',
      '- El tancament passa la porta Olivera: amb l’Escriptori brut, tancament.mjs --check ix amb 1, també en fase avis (el pre-commit ja ho feia per run-portes.mjs, porta-olivera --informe); en fase bloqueig, també per les troballes de la convocatòria.',
      '- Fins que el Mestre instal·le el plist, la Consola mostra higiene-diaria i higiene-basica com a tasques sense llançador.',
      '- Si el catàleg de skills no carrega quan s’aplica, la description nova queda sense projectar fins a cataleg_skills.mjs --escriu.',
      '- Si l’executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.',
    ].join('\n');
  const criteris = fase
    ? `- L'executor torna valid:true i deixa una transacció amb operationId ${OPERACIO_FASE}.\n- npm run porta:olivera diu «fase «bloqueig»» i, si la taula és neta, ix amb 0.`
    : [
      `- L’executor torna valid:true i deixa una transacció a ${TRANSACCIONS} amb operationId ${OPERACIO}.`,
      '- Passen tests/porta-olivera-v3.test.mjs, tests/cognitive-preflight.test.mjs, tests/antigravity-hook.test.mjs, tests/olivera-arxiva-261002.test.mjs i tests/sistema_nervios.test.mjs sense cap fallada nova.',
      '- npm run porta:olivera mostra la convocatòria v4 en fase avis i node tooling/higiene/cron_higiene.mjs escriu l’informe del dia a .immunitari/higiene/.',
      '- node tooling/gates/segella.mjs diu intacte i el corredor tests/laboratori-higiene-261009.test.js es retira.',
    ].join('\n');
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261009 Higiene${fase ? ', fase de bloqueig' : ''}, aplicat amb executor-mutacio i lease del Mestre.
---
# ${titol}

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

${context}

## Tasques

${tasques}

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

${riscos}

## Criteris d'acceptació

${criteris}
`;
}

function llegeixSessio(root, sessio) {
  if (!/^[0-9a-f-]{36}$/i.test(sessio ?? '')) throw new Error(`Cal --session=ID (el que ha imprés open). ${US}`);
  const s = JSON.parse(fs.readFileSync(path.join(root, '.sdp-reflex/sessions', `${sessio}.json`), 'utf8'));
  if (s.status !== 'open') throw new Error(`La sessió no està oberta: ${s.status}`);
  if (!s.operations?.includes('governance-write') || s.risk !== 'high') throw new Error('La sessió ha de ser --risk=high amb --operation=governance-write');
  return s;
}

/** Pla de la sessió, Petorreta i manifest, amb les mateixes comprovacions que farà el seal. */
async function preparaSessio(root, sessio, { fase = false, sobreBaseNova = false } = {}) {
  const s = llegeixSessio(root, sessio);
  const { plan, targets } = fase ? await preparaFaseBloqueig(root, { sessio }) : await preparaPla(root, { sessio, sobreBaseNova });
  const fora = targets.filter((t) => !s.scopes.some((sc) => sc === '.' || t === sc || t.startsWith(`${sc}/`)));
  if (fora.length) throw new Error(`Targets fora dels scopes de la sessió: ${fora.join(', ')}`);
  const petorreta = construeixPetorreta({ sessio, intentSha256: s.intentSha256, rulesSha256: s.rulesDigest, planSha256: sha(JSON.stringify(plan)), targets, fase });
  const text = manifest();
  const nom = fase ? NOM_PETORRETA_FASE : NOM_PETORRETA;
  const { validatePetorreta } = await import(pathToFileURL(path.join(root, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const errors = validatePetorreta(path.join(root, s.bootstrap.path, nom), petorreta);
  const fonts = JSON.parse(text).sources.map((f) => fs.readFileSync(path.join(root, f.path), 'utf8'));
  const perills = [...sensibles(petorreta), ...sensibles(text), ...fonts.flatMap(sensibles)];
  if (errors.length || perills.length) throw new Error(`La Petorreta o el manifest no passarien el seal: ${[...errors, ...perills].join('; ')}`);
  return { s, plan, targets, petorreta, manifest: text, nom };
}

async function comprova(root, sessio, { fase = false, sobreBaseNova = false } = {}) {
  const { plan, scopes, targets, aplicats = [], avisos } = fase
    ? await preparaFaseBloqueig(root, { sessio: sessio ?? SESSIO_ZERO })
    : await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO, sobreBaseNova });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  for (const a of avisos) console.log(`Avís: ${a}`);
  if (!sessio) {
    console.log('');
    for (const linia of liniesOpen(scopes, { intent: fase ? INTENT_FASE : INTENT })) console.log(linia);
    return;
  }
  const { s, nom } = await preparaSessio(root, sessio, { fase, sobreBaseNova });
  const dirBootstrap = path.join(root, s.bootstrap.path);
  if (!fs.statSync(dirBootstrap).isDirectory() || fs.readdirSync(dirBootstrap).length) throw new Error('El bootstrap reservat no existix o no és buit');
  const relB = s.bootstrap.path;
  const lab = `node ${REL_LAB}/prepara-pla.mjs`;
  const ordre = fase ? 'fase-bloqueig' : 'pla';
  const extra = sobreBaseNova ? ' --sobre-base-nova' : '';
  console.log('\nSessió vàlida. Petorreta i manifest passarien el seal. Ordres següents (des de l’arrel):');
  console.log('mkdir -p -m 700 .sdp-reflex/plans');
  console.log(`${lab} ${ordre} --session=${sessio}${extra} > .sdp-reflex/plans/${sessio}.json`);
  console.log(`${lab} petorreta --session=${sessio}${fase ? ' --fase' : ''}${extra} > ${relB}/${nom}`);
  console.log(`${lab} manifest > ${relB}/context.json`);
  console.log(`node tooling/wiki/reflex_petorreta.mjs seal --session=${sessio} --nonce=NONCE --petorreta=${relB}/${nom} --manifest=${relB}/context.json`);
  console.log(`node tooling/gates/executor-mutacio.mjs .sdp-reflex/plans/${sessio}.json .sdp-reflex/sessions/${sessio}.json`);
}

function parseArgs(argv) {
  const ordre = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'pla';
  const resta = argv[0] && !argv[0].startsWith('--') ? argv.slice(1) : argv;
  const opts = { sobreBaseNova: false, fase: false, ruta: null };
  for (const a of resta) {
    const m = /^--session=([0-9a-f-]{36})$/i.exec(a);
    if (m) opts.sessio = m[1];
    else if (a === '--sobre-base-nova') opts.sobreBaseNova = true;
    else if (a === '--fase') opts.fase = true;
    else if (ordre === 'mostra' && !a.startsWith('--') && opts.ruta === null) opts.ruta = a;
    else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  return { ordre, ...opts };
}

/**
 * La CLI. `root` només el canvien les proves (un taller amb el paquet aplicat); el Mestre
 * l'executa des de l'arrel. `comprova --fase` és el flux de lease de la fase 2: l'ordre
 * d'open amb INTENT_FASE i, amb --session, les ordres de pla, Petorreta, seal i executor.
 */
export async function main(argv, { root = ARREL } = {}) {
  const { ordre, sessio, sobreBaseNova, fase, ruta } = parseArgs(argv);
  if (ordre === 'pla') {
    if (!sessio) console.error('[prepara-pla] Sense --session: pla amb la sessió zero, només per a revisar-lo.');
    const { plan } = sessio ? await preparaSessio(root, sessio, { sobreBaseNova }) : await preparaPla(root, { sobreBaseNova });
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  } else if (ordre === 'fase-bloqueig') {
    const { plan } = sessio ? await preparaSessio(root, sessio, { fase: true }) : await preparaFaseBloqueig(root);
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  } else if (ordre === 'comprova') await comprova(root, sessio, { fase, sobreBaseNova });
  else if (ordre === 'petorreta') process.stdout.write((await preparaSessio(root, sessio, { fase, sobreBaseNova })).petorreta);
  else if (ordre === 'manifest') process.stdout.write(manifest());
  else if (ordre === 'mostra') {
    if (!ruta) throw new Error(`Cal la RUTA del fitxer. ${US}`);
    process.stdout.write(mostra(root, ruta));
  } else throw new Error(US);
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais.
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
