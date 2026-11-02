#!/usr/bin/env node
/**
 * Dieta d'arrencada (P2-15): mesura l'entrada de `.agents/cervell.json` i prepara
 * capítols d'ESTAT sense esborrar ni reordenar res.
 *
 * Ús: node tooling/documental/capitol-estat.mjs --mesura [--json]
 *     node tooling/documental/capitol-estat.mjs --pla [--conserva=N]
 *     node tooling/documental/capitol-estat.mjs --escriu --ara=<iso> --autoritza=<sha256Pla> [--conserva=N]
 *
 * Model de segments (B10-GOVERN §2.3, B10G-ARB-01): ESTAT es talla a cada H1/H2 fora de
 * tanques de codi i de comentaris HTML, i a les línies dels dos marcadors. Una entrada
 * `## ESTAT_ACTUAL` acaba al tall següent, siga del tipus que siga, de manera que mai
 * s'emporta el marcador de tancament, `## Vincles` ni les seccions llegades.
 *
 * `--mesura` i `--pla` només lligen. `--escriu` exigix l'`ara` i el sha256 que ha emés
 * `--pla` (no consulta el rellotge), crea el capítol amb `wx`, fa CAS sobre ESTAT i el
 * reemplaça per temporal + rename. Executar la rotació és decisió del Mestre (D-9).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { arrelSegura, esMain, CAMINS } from '../lib/arrel.mjs';

export const BYTES_PER_TOKEN = 3.5; // estimació declarada, no un recompte de tokenitzador
export const MARCADOR_OBRI = '<!-- SDP:ESTAT_ACTUAL -->';
export const MARCADOR_TANCA = '<!-- /SDP:ESTAT_ACTUAL -->';
export const SECCIO_CAPITOLS = "## Capítols arxivats d'ESTAT";
export const ESQUEMA = 'sdp.capitol-estat.v1';
// Camins relatius des de la SSOT (CAMINS de tooling/lib/arrel.mjs; Porta Rutes R1).
export const ESTAT = CAMINS.estat;
export const CERVELL = `${CAMINS.agents}/cervell.json`;
export const DIR_CAPITOLS = `${CAMINS.arxiuHistoric}/estat`;
export const CONSERVA_PER_DEFECTE = 20;
/** Amb una sola entrada, `operationalDocumentText` (document-corpus.mjs) ja no talla ESTAT. */
export const CONSERVA_MINIMA = 2;
const ZONA = 'Europe/Madrid';
const US = 'Ús: node tooling/documental/capitol-estat.mjs --mesura [--json] | --pla [--conserva=N] | --escriu --ara=<iso> --autoritza=<sha256Pla> [--conserva=N]';

// Mateixos criteris que liveMarkdown (tooling/wiki/core/parse.mjs), que és el que jutja Vincles.
const OBRI_CODI = /^\s{0,3}(`{3,}|~{3,})/;
const TANCA_CODI = /^\s{0,3}(`{3,}|~{3,})\s*$/;
const CAPCALERA = /^ {0,3}#{1,2}[ \t]/;
const ENTRADA = /^##[ \t]+ESTAT_ACTUAL\b/;
const VINCLES = /^ {0,3}##[ \t]+Vincles(?:[ \t]+#+)?[ \t]*$/;
const DATA = /\d{4}-\d{2}-\d{2}/;
// Data just darrere del separador, ISO o compacta `aammdd[_hhmm]`, com dataEstat (fonts-vigilancia.mjs).
const DATA_ANCORADA = /^##[ \t]+ESTAT_ACTUAL\b[\s·|:—–-]*(?:(\d{4}-\d{2}-\d{2})|(\d{2})(\d{2})(\d{2})(?:_\d{4})?(?![\d_]))/;
const TORN = /torn_[A-Za-z0-9-]+/g;
const ISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d{1,9})?)?(?:Z|([+-])(\d{2}):(\d{2}))$/;
const SHA = /^[0-9a-f]{64}$/;

const sha256 = (dades) => createHash('sha256').update(dades).digest('hex');
const bytes = (text) => Buffer.byteLength(text, 'utf8');
const tokens = (n) => Math.round(n / BYTES_PER_TOKEN);
const senseSalt = (linia) => linia.replace(/\r?\n$/, '');
const dos = (n) => String(n).padStart(2, '0');
const ordena = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Data `aaaa-mm-dd` d'una capçalera d'entrada (N09-ARB-03). Mana la que va just darrere del
 * separador, ISO o compacta `aammdd[_hhmm]` (`260923_2358`, `260924`) passada a `20aa-mm-dd`; si no
 * n'hi ha cap, la primera ISO de la capçalera, com fins ara. Una compacta que no és una data real
 * (mes 13, 31 d'abril) no data res.
 */
export function dataDeCapcalera(capcalera) {
  const m = DATA_ANCORADA.exec(capcalera);
  if (m?.[1]) return m[1];
  if (m) {
    const [any, mes, dia] = [2000 + Number(m[2]), Number(m[3]), Number(m[4])];
    const d = new Date(Date.UTC(any, mes - 1, dia));
    if (d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia) return `${any}-${m[3]}-${m[4]}`;
  }
  return DATA.exec(capcalera)?.[0] ?? null;
}

/** Error amb codi per a la CLI: AUTORITZACIO, CAS, EEXIST… */
export class ErrorCapitol extends Error {
  constructor(codi, missatge) { super(missatge); this.codi = codi; }
}

/** Compta aparicions literals (sense solapaments). */
function aparicions(text, agulla) {
  let n = 0;
  for (let i = text.indexOf(agulla); i >= 0; i = text.indexOf(agulla, i + agulla.length)) n += 1;
  return n;
}

/** Estat de comentari HTML al final de la línia, partint de `dins`. */
function comentariDespres(linia, dins) {
  let i = 0;
  for (;;) {
    if (dins) {
      const f = linia.indexOf('-->', i);
      if (f < 0) return true;
      dins = false; i = f + 3;
    } else {
      const o = linia.indexOf('<!--', i);
      if (o < 0) return false;
      dins = true; i = o + 4;
    }
  }
}

function tipusDe(linia) {
  const l = senseSalt(linia);
  if (l.startsWith(MARCADOR_OBRI) || l.startsWith(MARCADOR_TANCA)) return 'marcador';
  if (ENTRADA.test(l)) return 'entrada';
  if (VINCLES.test(l)) return 'vincles';
  if (l.trimEnd() === SECCIO_CAPITOLS) return 'capitols';
  return 'altra';
}

/**
 * Trams d'ESTAT: [{ tipus, inici, fi, capcalera, text }] (índexs del string).
 * No talla dins del frontmatter, de tanques ``` / ~~~ ni de comentaris HTML de diverses línies.
 * Invariant: concatenar els `text` torna l'original byte a byte.
 */
export function segmentsEstat(text) {
  if (typeof text !== 'string') throw new TypeError('segmentsEstat: cal un text');
  const linies = text.split(/(?<=\n)/);
  const trams = [];
  let actual = { tipus: 'preambul', inici: 0, capcalera: '' };
  let pos = 0;
  let k = 0;
  if (linies.length && senseSalt(linies[0]) === '---') {
    let fi = 1;
    while (fi < linies.length && senseSalt(linies[fi]).trimEnd() !== '---') fi += 1;
    if (fi >= linies.length) throw new Error('Frontmatter obert sense tancar');
    for (; k <= fi; k += 1) pos += linies[k].length;
  }
  let codi = null;
  let comentari = false;
  for (; k < linies.length; k += 1) {
    const linia = linies[k];
    // Com liveMarkdown: primer les tanques (també dins d'un comentari), després els comentaris.
    if (codi) {
      const m = TANCA_CODI.exec(senseSalt(linia));
      if (m && m[1][0] === codi.caracter && m[1].length >= codi.llarg) codi = null;
    } else if (OBRI_CODI.test(linia)) {
      const m = OBRI_CODI.exec(linia);
      codi = { caracter: m[1][0], llarg: m[1].length };
    } else {
      const tall = !comentari && (CAPCALERA.test(linia) || linia.startsWith(MARCADOR_OBRI) || linia.startsWith(MARCADOR_TANCA));
      if (tall) {
        if (pos > actual.inici) trams.push({ ...actual, fi: pos, text: text.slice(actual.inici, pos) });
        actual = { tipus: tipusDe(linia), inici: pos, capcalera: senseSalt(linia).trimEnd() };
      }
      comentari = comentariDespres(linia, comentari);
    }
    pos += linia.length;
  }
  if (pos > actual.inici || !trams.length) trams.push({ ...actual, fi: pos, text: text.slice(actual.inici, pos) });
  return trams;
}

/** Estructura obligatòria; llança si no es pot rotar sense trencar ESTAT. */
function estructura(text, trams) {
  for (const marcador of [MARCADOR_OBRI, MARCADOR_TANCA]) {
    const n = aparicions(text, marcador);
    if (n !== 1) throw new Error(`Cal exactament un ${marcador} (n'hi ha ${n})`);
  }
  const iObri = trams.findIndex((s) => s.tipus === 'marcador' && s.capcalera.startsWith(MARCADOR_OBRI));
  const iTanca = trams.findIndex((s) => s.tipus === 'marcador' && s.capcalera.startsWith(MARCADOR_TANCA));
  if (iObri < 0 || iTanca < 0) throw new Error('Els marcadors han de començar línia fora de tanques i comentaris');
  if (iTanca < iObri) throw new Error('El marcador de tancament va abans del d’obertura');
  const vincles = trams.filter((s) => s.tipus === 'vincles').length;
  if (vincles !== 1) throw new Error(`Cal exactament una secció ## Vincles (n'hi ha ${vincles})`);
  const capitols = trams.filter((s) => s.tipus === 'capitols').length;
  if (capitols > 1) throw new Error(`Hi ha ${capitols} seccions «${SECCIO_CAPITOLS}»`);
  return { iObri, iTanca };
}

function partsMadrid(data) {
  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  return Object.fromEntries(format.formatToParts(data).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
}

/** ISO 8601 amb desplaçament explícit i data real (Date.parse accepta el 30 de febrer i el desplaça). */
export function esAraValida(ara) {
  const m = typeof ara === 'string' ? ISO.exec(ara) : null;
  if (!m) return false;
  const t = Date.parse(ara);
  if (!Number.isFinite(t)) return false;
  const desplacament = m[2] ? (m[2] === '-' ? -1 : 1) * (Number(m[3]) * 60 + Number(m[4])) : 0;
  return new Date(t + desplacament * 60000).toISOString().slice(0, 16) === m[1];
}

/** `aammdd_hhmm` d'un instant en Europe/Madrid, independent del TZ del procés. */
export function segellDeAra(ara) {
  if (!esAraValida(ara)) throw new Error(`ara no vàlida: ${ara}`);
  const p = partsMadrid(new Date(ara));
  return `${p.year.slice(2)}${p.month}${p.day}_${p.hour}${p.minute}`;
}

/** Instant truncat al minut i formatat en ISO amb el desplaçament d'Europe/Madrid. */
export function araMadrid(data) {
  const t = new Date(Math.floor(data.getTime() / 60000) * 60000);
  if (!Number.isFinite(t.getTime())) throw new Error('Rellotge no vàlid');
  const p = partsMadrid(t);
  const local = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  const minuts = Math.round((local - t.getTime()) / 60000);
  const abs = Math.abs(minuts);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00${minuts < 0 ? '-' : '+'}${dos(Math.floor(abs / 60))}:${dos(abs % 60)}`;
}

function frontmatterCapitol({ n, ara, finsA }) {
  const descripcio = `Capítol arxivat d'ESTAT: ${n} entrades ESTAT_ACTUAL mogudes de .agents/ESTAT.md (fins a ${finsA}), rotació de ${ara}.`;
  return `---\ntype: registre\nstatus: arxivat\ndescription: ${JSON.stringify(descripcio)}\n---\n`;
}

/** Afig la línia de l'àncora a ESTAT (segment `capitols` o just després de MARCADOR_TANCA). */
function ambAncora(trams, linia, desti) {
  const iCapitols = trams.findIndex((s) => s.tipus === 'capitols');
  if (iCapitols >= 0) {
    const s = trams[iCapitols];
    if (s.text.includes(`\`${desti}\``)) throw new Error(`El destí ja és a l'àncora: ${desti}`);
    const linies = s.text.split(/(?<=\n)/);
    let on = 0; // sense llista, just després de la capçalera
    linies.forEach((l, i) => { if (l.startsWith('- `')) on = i; });
    const prefix = linies[on].endsWith('\n') ? '' : '\n';
    const inserit = on === 0 ? `${prefix}\n${linia}\n` : `${prefix}${linia}\n`;
    linies.splice(on + 1, 0, inserit);
    return { trams: trams.map((t, i) => (i === iCapitols ? { ...t, text: linies.join('') } : t)), inserit };
  }
  const iTanca = trams.findIndex((s) => s.tipus === 'marcador' && s.capcalera.startsWith(MARCADOR_TANCA));
  const s = trams[iTanca];
  const salt = s.text.indexOf('\n');
  const cap = salt >= 0 ? s.text.slice(0, salt + 1) : `${s.text}\n`;
  const resta = salt >= 0 ? s.text.slice(salt + 1) : '';
  const inserit = `\n${SECCIO_CAPITOLS}\n\n${linia}\n`;
  const nou = salt >= 0 ? `${cap}${inserit}${resta}` : `${cap}${inserit}`;
  return { trams: trams.map((t, i) => (i === iTanca ? { ...t, text: nou } : t)), inserit: salt >= 0 ? inserit : `\n${inserit}` };
}

/**
 * Pla pur de rotació. `ara` és obligatori (ISO amb desplaçament): no hi ha rellotge per defecte.
 * Torna `{ buit: true, motiu }` si hi ha `conserva + 1` entrades o menys.
 */
export function planCapitolEstat(text, { conserva = CONSERVA_PER_DEFECTE, ara } = {}) {
  if (!esAraValida(ara)) throw new Error('ara és obligatori: ISO 8601 amb desplaçament (p. ex. 2026-11-02T00:50:00+01:00)');
  if (!Number.isInteger(conserva) || conserva < CONSERVA_MINIMA) throw new Error(`conserva ha de ser un enter >= ${CONSERVA_MINIMA}`);
  const trams = segmentsEstat(text);
  const { iObri, iTanca } = estructura(text, trams);
  const entrades = trams.map((s, i) => ({ ...s, index: i })).filter((s) => s.tipus === 'entrada');
  if (entrades.length <= conserva + 1) return { ara, conserva, buit: true, entrades: entrades.length, motiu: 'res a moure' };

  const conservades = entrades.slice(0, conserva);
  const mogudes = entrades.slice(conserva);
  const dates = mogudes.map((s) => dataDeCapcalera(s.capcalera)).filter(Boolean);
  if (!dates.length) throw new Error('Cap data aaaa-mm-dd ni aammdd[_hhmm] a les capçaleres mogudes: no hi ha nom de destí');
  const finsA = dates[0];
  const ordenades = [...dates].sort(ordena);
  const rang = [ordenades[0], ordenades.at(-1)];
  const desti = `${DIR_CAPITOLS}/${segellDeAra(ara)}_estat_capitol_fins_${finsA.replaceAll('-', '')}.md`;
  const capitol = frontmatterCapitol({ n: mogudes.length, ara, finsA }) + mogudes.map((s) => s.text).join('');
  const torns = [...new Set(mogudes.flatMap((s) => s.text.match(TORN) || []))].sort(ordena);
  const sha256Capitol = sha256(capitol);
  const linia = `- \`${desti}\` · sha256 ${sha256Capitol} · ${mogudes.length} entrades · ${rang[0]}..${rang[1]} · torns: ${torns.length ? torns.join(' ') : 'cap'}`;

  const moguts = new Set(mogudes.map((s) => s.index));
  const queden = trams.filter((_, i) => !moguts.has(i));
  const { trams: ambLinia, inserit } = ambAncora(queden, linia, desti);
  const estatNou = ambLinia.map((s) => s.text).join('');

  // Comprovació defensiva de les invariants abans de tornar res.
  const nous = segmentsEstat(estatNou);
  estructura(estatNou, nous);
  const vincles = (ts) => ts.find((s) => s.tipus === 'vincles').text;
  if (vincles(nous) !== vincles(trams)) throw new Error('Invariant trencat: ## Vincles ha canviat');
  if (estatNou.replace(inserit, '') !== queden.map((s) => s.text).join('')) throw new Error('Invariant trencat: àncora no reversible');
  if (!verificaCapitolEstat(estatNou, capitol, desti)) throw new Error('Invariant trencat: l’àncora no verifica el capítol');

  const sha256Font = sha256(text);
  const sha256EstatNou = sha256(estatNou);
  const sha256Pla = sha256(JSON.stringify({ esquema: ESQUEMA, ara, conserva, desti, sha256Font, sha256Capitol, sha256EstatNou }));
  return {
    ara, conserva, buit: false, entrades: entrades.length,
    conservades, mogudes,
    mogudesDinsDelBloc: mogudes.filter((s) => s.index > iObri && s.index < iTanca).length,
    capitol, estatNou, ancora: inserit, torns, rang, finsA, desti,
    sha256Font, sha256Capitol, sha256EstatNou, sha256Pla,
    ordreEscriu: `node tooling/documental/capitol-estat.mjs --escriu --ara=${ara} --autoritza=${sha256Pla} --conserva=${conserva}`
  };
}

/** La línia de l'àncora per a `desti` casa amb el sha256 i el recompte d'entrades del capítol. */
export function verificaCapitolEstat(estat, capitol, desti) {
  try {
    const capitols = segmentsEstat(estat).filter((s) => s.tipus === 'capitols');
    if (capitols.length !== 1) return false;
    const prefix = `- \`${desti}\` · `;
    const linies = capitols[0].text.split(/\r?\n/).filter((l) => l.startsWith(prefix));
    if (linies.length !== 1) return false;
    const m = /· sha256 ([0-9a-f]{64}) · (\d+) entrades · /.exec(linies[0]);
    if (!m) return false;
    const trams = segmentsEstat(capitol);
    if (trams.some((s) => s.tipus !== 'preambul' && s.tipus !== 'entrada')) return false;
    return sha256(capitol) === m[1] && trams.filter((s) => s.tipus === 'entrada').length === Number(m[2]);
  } catch {
    return false;
  }
}

/** Camí relatiu confinat a l'arrel (també després de resoldre symlinks). */
function confinat(arrel, rel, { crea = false } = {}) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel)) throw new Error(`Camí no relatiu: ${rel}`);
  const base = fs.realpathSync(arrel);
  const abs = path.resolve(base, rel);
  const fora = (p) => { const r = path.relative(base, p); return r.startsWith('..') || path.isAbsolute(r); };
  if (fora(abs)) throw new Error(`Camí fora de l'arrel: ${rel}`);
  let creat;
  if (crea) {
    // C-B10-01 (kit Codex, N09-ARB-02): l'ancestre que ja existix es resol ABANS del mkdir.
    // Si no, un symlink cap a fora rebria el directori `estat/` abans del rebuig.
    let ancestre = path.dirname(abs);
    for (;;) {
      try { fs.lstatSync(ancestre); }
      catch (e) {
        if (e.code !== 'ENOENT') throw e;
        const pare = path.dirname(ancestre);
        if (pare === ancestre) throw new Error(`Camí fora de l'arrel: ${rel}`);
        ancestre = pare;
        continue;
      }
      if (fora(fs.realpathSync(ancestre))) throw new Error(`Camí fora de l'arrel (symlink): ${rel}`);
      break;
    }
    creat = fs.mkdirSync(path.dirname(abs), { recursive: true });
  }
  let real;
  try { real = fs.realpathSync(abs); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    real = path.join(fs.realpathSync(path.dirname(abs)), path.basename(abs));
  }
  if (fora(real)) throw new Error(`Camí fora de l'arrel (symlink): ${rel}`);
  return { abs, creat };
}

/** Bytes i tokens estimats de cada font de `.agents/cervell.json` `entrada`. */
export function mesuraArrencada(arrel) {
  const cervell = JSON.parse(fs.readFileSync(confinat(arrel, CERVELL).abs, 'utf8'));
  if (!Array.isArray(cervell.entrada) || !cervell.entrada.every((r) => typeof r === 'string')) {
    throw new Error(`${CERVELL}: «entrada» ha de ser una llista de camins`);
  }
  const fonts = cervell.entrada.map((ruta) => {
    let mida = null;
    try {
      const st = fs.statSync(confinat(arrel, ruta).abs);
      if (st.isFile()) mida = st.size;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    return { ruta, bytes: mida, tokensEstimats: mida === null ? null : tokens(mida) };
  });
  const total = fonts.reduce((n, f) => n + (f.bytes || 0), 0);
  return {
    fonts: fonts.map((f) => ({ ...f, percent: f.bytes === null || !total ? null : Math.round((f.bytes / total) * 1000) / 10 })),
    total, tokensEstimats: tokens(total), bytesPerToken: BYTES_PER_TOKEN,
    absents: fonts.filter((f) => f.bytes === null).map((f) => f.ruta)
  };
}

function llegeixEstat(arrel) {
  const { abs } = confinat(arrel, ESTAT);
  const cru = fs.readFileSync(abs);
  const text = cru.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(cru)) throw new Error(`${ESTAT} no és UTF-8 vàlid: no es reescriu`);
  return { abs, cru, text };
}

const retira = (abs) => { try { fs.rmSync(abs, { force: true }); } catch { /* ja no hi és */ } };

/**
 * Escriptura autoritzada: recalcula el pla amb `ara`, exigix `autoritza === sha256Pla`,
 * crea el capítol amb `wx`, rellig ESTAT (CAS) i el reemplaça per temporal + rename.
 * Qualsevol fallada retira el capítol i el temporal. Les opcions `rename` i
 * `despresDelCapitol` només existixen per a les proves.
 */
export function escriuCapitolEstat(arrel, { ara, conserva = CONSERVA_PER_DEFECTE, autoritza }, { rename = fs.renameSync, despresDelCapitol = null } = {}) {
  if (!esAraValida(ara)) throw new ErrorCapitol('US', 'Falta --ara=<iso> (la mateixa que ha emés --pla)');
  if (typeof autoritza !== 'string' || !SHA.test(autoritza)) throw new ErrorCapitol('US', 'Falta --autoritza=<sha256Pla>');
  const estat = llegeixEstat(arrel);
  const pla = planCapitolEstat(estat.text, { conserva, ara });
  if (pla.buit) return { escrit: false, buit: true, motiu: pla.motiu };
  if (autoritza !== pla.sha256Pla) throw new ErrorCapitol('AUTORITZACIO', 'L’autorització no casa amb el pla actual: torna a executar --pla');
  const { abs: absDesti, creat } = confinat(arrel, pla.desti, { crea: true });
  const temporal = `${estat.abs}.capitol-${randomBytes(6).toString('hex')}.tmp`;
  let capitolCreat = false;
  let fet = false;
  try {
    try { fs.writeFileSync(absDesti, pla.capitol, { flag: 'wx' }); } catch (e) {
      if (e.code === 'EEXIST') throw new ErrorCapitol('EEXIST', `El destí ja existix: ${pla.desti}`);
      throw e;
    }
    capitolCreat = true;
    if (despresDelCapitol) despresDelCapitol();
    if (sha256(fs.readFileSync(estat.abs)) !== pla.sha256Font) throw new ErrorCapitol('CAS', 'ESTAT ha canviat des del pla: avortat i capítol retirat');
    fs.writeFileSync(temporal, pla.estatNou, { flag: 'wx', mode: fs.statSync(estat.abs).mode & 0o777 });
    rename(temporal, estat.abs);
    fet = true;
  } finally {
    if (!fet) {
      retira(temporal);
      if (capitolCreat) retira(absDesti);
      // Directoris buits que acabem de crear (mkdir recursiu torna el primer creat).
      if (creat) {
        for (let dir = path.dirname(absDesti); dir.length >= creat.length; dir = path.dirname(dir)) {
          try { fs.rmdirSync(dir); } catch { break; }
        }
      }
    }
  }
  return { escrit: true, desti: pla.desti, sha256Capitol: pla.sha256Capitol, mogudes: pla.mogudes.length, conservades: pla.conservades.length };
}

function llegeixArgs(argv) {
  const opc = { mode: null, json: false, conserva: CONSERVA_PER_DEFECTE, ara: null, autoritza: null };
  const vistes = new Set();
  for (const arg of argv) {
    const igual = arg.indexOf('=');
    const clau = igual < 0 ? arg : arg.slice(0, igual);
    const valor = igual < 0 ? null : arg.slice(igual + 1);
    if (vistes.has(clau)) return null;
    vistes.add(clau);
    if (['--mesura', '--pla', '--escriu'].includes(clau) && valor === null) {
      if (opc.mode) return null;
      opc.mode = clau.slice(2);
    } else if (clau === '--json' && valor === null) opc.json = true;
    else if (clau === '--conserva' && valor !== null && /^\d+$/.test(valor)) opc.conserva = Number(valor);
    else if (clau === '--ara' && valor !== null) opc.ara = valor;
    else if (clau === '--autoritza' && valor !== null) opc.autoritza = valor;
    else return null;
  }
  if (!opc.mode) return null;
  if (opc.json && opc.mode !== 'mesura') return null;
  if (opc.mode !== 'mesura' && opc.conserva < CONSERVA_MINIMA) return null;
  if (opc.mode === 'mesura' && (vistes.has('--conserva') || vistes.has('--ara') || vistes.has('--autoritza'))) return null;
  if (opc.mode === 'pla' && (vistes.has('--ara') || vistes.has('--autoritza'))) return null;
  if (opc.mode === 'escriu' && (!esAraValida(opc.ara) || !SHA.test(opc.autoritza || ''))) return null;
  return opc;
}

function informeMesura(m) {
  const linies = [`Arrencada (${CERVELL} · entrada): ${m.total} B · ~${m.tokensEstimats} tokens estimats (${BYTES_PER_TOKEN} B/token; estimació, no recompte de tokenitzador)`];
  for (const f of m.fonts) {
    linies.push(f.bytes === null ? `  ${f.ruta}: ABSENT` : `  ${f.ruta}: ${f.bytes} B · ~${f.tokensEstimats} tokens · ${f.percent} %`);
  }
  return linies.join('\n');
}

function projeccio(arrel, pla) {
  try {
    const m = mesuraArrencada(arrel);
    const font = m.fonts.find((f) => f.ruta === ESTAT);
    if (!font || font.bytes === null) return null;
    const despres = m.total - font.bytes + bytes(pla.estatNou);
    return { abans: m.total, tokensAbans: m.tokensEstimats, despres, tokensDespres: tokens(despres) };
  } catch { return null; }
}

export function main(argv = process.argv.slice(2), { arrel = null, sortida = console, rellotge = () => new Date() } = {}) {
  const opc = llegeixArgs(argv);
  if (!opc) { sortida.error(US); return 2; }
  try {
    const base = arrel || arrelSegura();
    if (opc.mode === 'mesura') {
      const m = mesuraArrencada(base);
      sortida.log(opc.json ? JSON.stringify(m, null, 2) : informeMesura(m));
      return m.absents.length ? 1 : 0;
    }
    if (opc.mode === 'pla') {
      const ara = araMadrid(rellotge());
      const { text } = llegeixEstat(base);
      const pla = planCapitolEstat(text, { conserva: opc.conserva, ara });
      if (pla.buit) { sortida.log(JSON.stringify({ esquema: ESQUEMA, ara, conserva: opc.conserva, buit: true, entrades: pla.entrades, motiu: pla.motiu }, null, 2)); return 0; }
      sortida.log(JSON.stringify({
        esquema: ESQUEMA, ara: pla.ara, conserva: pla.conserva, entrades: pla.entrades,
        conservades: pla.conservades.length, mogudes: pla.mogudes.length,
        mogudesDinsDelBloc: pla.mogudesDinsDelBloc, mogudesForaDelBloc: pla.mogudes.length - pla.mogudesDinsDelBloc,
        bytes: { font: bytes(text), capitol: bytes(pla.capitol), estatNou: bytes(pla.estatNou), ancora: bytes(pla.ancora) },
        torns: pla.torns.length, rang: pla.rang, desti: pla.desti,
        sha256Font: pla.sha256Font, sha256Capitol: pla.sha256Capitol, sha256EstatNou: pla.sha256EstatNou,
        sha256Pla: pla.sha256Pla, arrencada: projeccio(base, pla), ordreEscriu: pla.ordreEscriu
      }, null, 2));
      return 0;
    }
    const fet = escriuCapitolEstat(base, { ara: opc.ara, conserva: opc.conserva, autoritza: opc.autoritza });
    if (fet.buit) { sortida.log(`[capitol-estat] ${fet.motiu}`); return 0; }
    sortida.log(`[capitol-estat] Capítol escrit: ${fet.desti} (${fet.mogudes} entrades mogudes, ${fet.conservades} conservades, sha256 ${fet.sha256Capitol}). Recalcula el lock del Reflex en el mateix commit.`);
    return 0;
  } catch (e) {
    sortida.error(`[capitol-estat] ${e.message}`);
    return e instanceof ErrorCapitol && e.codi === 'US' ? 2 : 1;
  }
}

if (esMain(import.meta.url)) process.exitCode = main();
