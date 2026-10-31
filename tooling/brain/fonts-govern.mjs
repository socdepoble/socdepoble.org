/**
 * fonts-govern.mjs — el compilador de GET /__iaia/govern.json (sdp.govern.v1),
 * la matriu viva del Govern del Mestre (/consola/govern/*).
 *
 * Ordre del Mestre del 30-10-2026 (B2) · «GET /__iaia/govern.json en viu […]
 * compilant la matriu viva des del Llibre Mestre i el HEAD actual, perquè les
 * 4 targetes de Govern i les 4 subpàgines mostren totes les files i estats en
 * temps real. Només lectura del Llibre i de git; cap escriptura; només en
 * desenvolupament.» Camí de govern (tooling/) escrit per ordre explícita del
 * Mestre. El servix el connector de Vite (tooling/vite/consola-iaia.mjs), que
 * el torna a carregar quan canvia; el build no el coneix.
 *
 * Forma (la que espera normalitzaGovern, src/sections/consola/govern/governContent.js):
 *   { schema: 'sdp.govern.v1', generat, head, mcr, trasllat, font, avisos }
 *   · mcr · la matriu en l'esquema de Codex (normalitzaMcr, matriuGovern.js):
 *     { at, baseline_head, scope, pla, requirements: [{ id, source, requirement,
 *     status, evidence, owner, priority, acceptance }] }.
 *   · trasllat · null: el trasllat és un fitxer de Codex, i el Llibre no en porta.
 *   · avisos · el que el compilador ha hagut de tolerar (una taula partida per
 *     una línia en blanc, una fila amb més o menys cel·les, una capçalera
 *     repetida, una taula aliena dins d'una secció de matriu, un H2 que esmenta
 *     una matriu sense ser-ne la secció, un identificador repetit). El client no
 *     els llig; són per a qui obri el JSON i per a les proves.
 *
 * D'on ix cada camp, sense inventar-ne cap:
 *   · Les files són les de les taules de les seccions H2 del Llibre que es diuen
 *     «Matriu P0», «Matriu P1» i «Matriu P2» (el Banc d'Idees no és cap matriu).
 *     Gauntlet f4b (govern, «parser-seccions-fragil») · «Es diuen» vol dir que
 *     el títol comença per eixes paraules, darrere de l'emoji i del número de
 *     secció («## 🔴 2. Matriu P0 · Bloquejants»), i només la primera de cada
 *     P. Un H2 que només l'esmenta («## Rèplica de Codex sobre la Matriu P1»,
 *     amb taula o sense) o una segona secció de la mateixa P no hi afigen res
 *     ni tomben la matriu: es diuen a `avisos` ('seccio-ignorada',
 *     'seccio-repetida'). Dins de la secció, la taula de la matriu s'acaba en
 *     el primer encapçalament (H3 a H6) o en una capçalera amb unes altres
 *     columnes: una taula de darrere (unes notes, un registre de canvis) no en
 *     porta cap fila ('taula-estranya'). Derogat: qualsevol H2 amb «Matriu
 *     P<n>» en qualsevol lloc del títol, i les seues taules, com a matriu.
 *     `priority` és la P de la secció; `requirement`, l'àmbit i la descripció;
 *     `evidence`, l'estat literal del Llibre, el que s'ha comprovat amb git i els
 *     fitxers afectats; `owner` i `acceptance`, null (el Llibre no els diu).
 *     Cap camp porta números de línia: un canvi a dalt del Llibre no canvia
 *     l'empremta de cap fila (certificacions.js), i una decisió del Mestre
 *     continua valent per a la fila que no ha canviat.
 *   · `status` tradueix el vocabulari del Llibre al de la matriu amb una regla
 *     tancada (estatDelLlibre). Només és [FET I SEGELLAT] (verd) una fila que
 *     el Llibre dona per «FET» amb un o més commits i, com a molt, una data, i
 *     tots els seus commits són a la història del HEAD (git rev-list): el
 *     segell es comprova, no es creu. «PARCIAL…» és [PARCIAL]; «PENDENT…» (o un
 *     segment «PENDENT») i «BACKLOG» són [NO FET / PENDENT]. Qualsevol altre
 *     estat passa literal i la Consola el pinta obsolet, amb el seu text al
 *     costat (EstatDeFila); un literal que la Consola llegiria com a fet sense
 *     cap commit comprovat ix sense estat (null), i l'evidència diu per què.
 *     Gauntlet f4b (govern, «vocabulari-en-cache») · «La Consola llegiria»
 *     amb el vocabulari d'ara: el connector passa l'estatDeStatus de
 *     matriuGovern.js carregat amb la marca del seu mtime (vocabulariGovern),
 *     el mateix que rep el client, i no el que Node va guardar en arrencar.
 *     Gauntlet f4b (govern, «commits-rebasats-fals-negatiu») · Un commit que
 *     el Llibre cita i que no és a la història del HEAD es busca reescrit
 *     (rebase, filter-branch: el mateix autor, data, assumpte i canvi --raw,
 *     equivalentsDe): si hi és, l'evidència ho diu amb el commit d'ara, però
 *     la fila no es segella (el segell és el commit que el Llibre cita; pintar
 *     de verd per equivalència és decisió del Mestre).
 *   · `at` és l'última escriptura del Llibre (mtime): un Llibre que fa més d'un
 *     dia que no es toca fa la matriu obsoleta (LLINDAR_MATRIU_HORES), com una
 *     matriu de Codex vella. `baseline_head` i `head` són el HEAD d'ara.
 *   · `pla` és «llibre-mestre», declarat: la identitat amb què el Mestre apunta
 *     les seues decisions no canvia a cada lectura (normalitzaMcr, textDelPla).
 *
 * Lectura i prou: un readFileSync del Llibre (un fitxer normal, mai un enllaç
 * simbòlic) i els `git` de només lectura (rev-parse i rev-list; i, només si el
 * Llibre cita commits de fora de la història, rev-parse i log per a buscar-ne
 * l'equivalent) amb execFile i arguments (mai una shell), sense
 * bloquejos opcionals (GIT_OPTIONAL_LOCKS=0) i sense pujar per damunt de
 * l'arrel (GIT_CEILING_DIRECTORIES). Els errors controlats són ErrorGovern amb
 * un `codi` i un text fix sense camins: 'llibre-absent', 'llibre-massa-gran',
 * 'git-absent', 'sense-matriu' i 'taula-mal-formada'.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { estatDeStatus } from '../../src/sections/consola/govern/matriuGovern.js';
import { CAMINS } from '../lib/arrel.mjs';

export const ESQUEMA_GOVERN = 'sdp.govern.v1';
/** El Llibre Mestre, des de l'arrel del repositori. Ordre del Mestre (30-10-2026) ·
 *  la carpeta de l'Escriptori ve de la SSOT de rutes (Porta Rutes, R1). */
export const RUTA_LLIBRE = path.posix.join(CAMINS.escriptori, '03_llibre_mestre_tasques_i_idees.md');
/** La identitat de la matriu viva: les decisions del Mestre s'hi apunten (certificacions.js). */
export const PLA_LLIBRE = 'llibre-mestre';
export const ABAST_LLIBRE = 'Llibre Mestre: les matrius P0, P1 i P2';
/** Un Llibre de més d'açò no es llig (el d'ara en fa uns 400 kB). */
export const MIDA_MAXIMA_LLIBRE = 8 * 1024 * 1024;
/** Els estats de la matriu que el compilador escriu (els de mcr.json de Codex). */
export const STATUS_MATRIU = Object.freeze({ fet: '[FET I SEGELLAT]', parcial: '[PARCIAL]', pendent: '[NO FET / PENDENT]' });

export class ErrorGovern extends Error {
  constructor(codi, missatge) {
    super(missatge);
    this.name = 'ErrorGovern';
    this.codi = codi;
  }
}

/* ── Les taules del Llibre ─────────────────────────────────────────────── */

/**
 * Les cel·les d'una fila de taula Markdown: parteix per «|» fora del codi en
 * línia (un o més accents greus) i sense comptar «\|». Les vores es lleven.
 */
export function celles(linia) {
  let s = String(linia).trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const eixida = [];
  let actual = '';
  let codi = 0;
  for (let i = 0; i < s.length;) {
    if (s[i] === '`') {
      let j = i;
      while (s[j] === '`') j += 1;
      const n = j - i;
      if (codi === 0) codi = n;
      else if (codi === n) codi = 0;
      actual += s.slice(i, j);
      i = j;
    } else if (s[i] === '\\' && s[i + 1] === '|') {
      actual += '|';
      i += 2;
    } else if (s[i] === '|' && codi === 0) {
      eixida.push(actual.trim());
      actual = '';
      i += 1;
    } else {
      actual += s[i];
      i += 1;
    }
  }
  eixida.push(actual.trim());
  return eixida;
}

const H2 = /^##(?!#)\s+(.*)$/;
const H1 = /^#(?!#)\s/;
/* Un encapçalament de dins d'una secció (H3 a H6): acaba la taula de la matriu. */
const SUBTITOL = /^#{3,6}\s/;
/* La secció d'una matriu: el títol comença per «Matriu P<n>», darrere de l'emoji i del número de secció. */
const MATRIU = /^[^\p{L}\p{N}]*(?:\d+\.\s+)?Matriu\s+(P\d+)\b/u;
/* Un títol que només l'esmenta (una crònica, una rèplica): no és cap matriu, i es diu. */
const ESMENT_MATRIU = /\bMatriu\s+(P\d+)\b/u;
const SEPARADOR = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const nomColumna = (c) => c.normalize('NFC').replace(/\*\*|`/g, '').trim().toLocaleLowerCase('ca');
const capcaleraDe = (linia) => celles(linia).map(nomColumna).join('|');
/** L'identificador d'una fila: la cel·la «ID» sense accents greus ni negretes; null si és buida. */
export const idDeFila = (fila, columnes) => {
  const v = columnes?.id === null || columnes?.id === undefined ? null : fila.celles[columnes.id];
  return typeof v === 'string' ? v.replace(/`|\*\*/g, '').trim() || null : null;
};

/* Quina columna fa cada cosa, pel seu nom (les de P0 i P1 en tenen cinc; la de P2, quatre). */
function columnesDe(capcalera) {
  const noms = capcalera.map(nomColumna);
  const troba = (prova) => { const i = noms.findIndex(prova); return i === -1 ? null : i; };
  return {
    id: troba((n) => n === 'id'),
    ambit: troba((n) => n === 'àmbit'),
    estat: troba((n) => n === 'estat'),
    descripcio: troba((n) => n.startsWith('descripció')),
    fitxers: troba((n) => n.startsWith('fitxers')),
    total: noms.length
  };
}

/**
 * Les taules de les seccions «Matriu P<n>» del Llibre: [{ prioritat, titol,
 * columnes, files: [{ linia, celles }] }] i els avisos del que s'ha tolerat.
 * Llança ErrorGovern si no n'hi ha cap o si una no té la capçalera amb «ID» i
 * «Estat». Una línia en blanc dins de la taula (que en Markdown la talla) no
 * perd les files de darrere: es diu a `avisos`. Un H2 que només esmenta una
 * matriu, una segona secció de la mateixa P i una taula aliena dins de la
 * secció (darrere d'un H3 o amb unes altres columnes) no hi afigen cap fila,
 * i també es diuen. Un identificador repetit es diu ('id-repetit') i la fila
 * passa: la Consola es queda la primera i ho diu (normalitzaMcr, «Identificadors
 * repetits»), on el Mestre ho veu.
 */
export function taulesDeMatriu(text) {
  const linies = String(text).split(/\r?\n/);
  const taules = [];
  const avisos = [];
  const vistes = new Set();
  let seccio = null;
  const tanca = () => {
    if (seccio && !seccio.columnes) {
      throw new ErrorGovern('taula-mal-formada', `La secció «Matriu ${seccio.prioritat}» del Llibre Mestre no té cap taula amb capçalera.`);
    }
    seccio = null;
  };
  for (let i = 0; i < linies.length; i += 1) {
    const linia = linies[i];
    const h2 = H2.exec(linia);
    if (h2 || H1.test(linia)) {
      tanca();
      const titol = h2 ? h2[1].trim() : '';
      const m = MATRIU.exec(titol);
      if (m && !vistes.has(m[1])) {
        vistes.add(m[1]);
        seccio = { prioritat: m[1], titol, columnes: null, capcalera: null, files: [], interrompuda: null, acabada: false, aliena: false };
        taules.push(seccio);
      } else {
        // Un H2 que esmenta una matriu sense ser-ne la secció, o una segona secció de la mateixa P: no s'hi llig res.
        const esment = m ?? ESMENT_MATRIU.exec(titol);
        if (esment) avisos.push({ codi: m ? 'seccio-repetida' : 'seccio-ignorada', prioritat: esment[1], linia: i + 1 });
      }
      continue;
    }
    if (!seccio) continue;
    const esFila = linia.trimStart().startsWith('|');
    if (!seccio.columnes) {
      if (!esFila) continue;
      if (!SEPARADOR.test(linies[i + 1] ?? '')) {
        throw new ErrorGovern('taula-mal-formada', `La taula de la «Matriu ${seccio.prioritat}» del Llibre Mestre no té la línia de separació davall de la capçalera.`);
      }
      const columnes = columnesDe(celles(linia));
      if (columnes.id === null || columnes.estat === null) {
        throw new ErrorGovern('taula-mal-formada', `La taula de la «Matriu ${seccio.prioritat}» del Llibre Mestre no té les columnes «ID» i «Estat».`);
      }
      seccio.columnes = columnes;
      seccio.capcalera = capcaleraDe(linia);
      i += 1;
      continue;
    }
    // Un encapçalament de dins (H3 a H6) acaba la taula de la matriu: el que ve darrere ja no en són files.
    if (SUBTITOL.test(linia)) {
      seccio.acabada = true;
      seccio.aliena = false;
      continue;
    }
    // Una línia que no és de taula (en blanc o de text) talla la taula en Markdown: si darrere vénen més files, es diu.
    if (!esFila) {
      if (seccio.files.length) seccio.interrompuda ??= i + 1;
      seccio.aliena = false;
      continue;
    }
    // Una taula de darrere de la de la matriu (unes notes, un registre de canvis) no en porta cap fila.
    if (seccio.acabada) {
      if (!seccio.aliena) avisos.push({ codi: 'taula-estranya', prioritat: seccio.prioritat, linia: i + 1 });
      seccio.aliena = true;
      continue;
    }
    if (SEPARADOR.test(linia)) continue;
    // Una fila seguida d'un separador és una capçalera: la mateixa, repetida, no és cap fila; una altra obri una taula aliena.
    if (SEPARADOR.test(linies[i + 1] ?? '')) {
      const repetida = capcaleraDe(linia) === seccio.capcalera;
      avisos.push({ codi: repetida ? 'capcalera-repetida' : 'taula-estranya', prioritat: seccio.prioritat, linia: i + 1 });
      if (!repetida) {
        seccio.acabada = true;
        seccio.aliena = true;
      }
      i += 1;
      continue;
    }
    if (seccio.interrompuda) {
      avisos.push({ codi: 'taula-partida', prioritat: seccio.prioritat, linia: seccio.interrompuda });
      seccio.interrompuda = null;
    }
    let cs = celles(linia);
    const { total } = seccio.columnes;
    if (cs.length !== total) {
      avisos.push({ codi: 'fila-desquadrada', prioritat: seccio.prioritat, linia: i + 1, celles: cs.length, columnes: total });
      // Les cel·les de més s'ajunten a l'última columna, amb la barra que les partia.
      if (cs.length > total) cs = [...cs.slice(0, total - 1), cs.slice(total - 1).join(' | ')];
    }
    seccio.files.push({ linia: i + 1, celles: cs });
  }
  tanca();
  if (!taules.length) throw new ErrorGovern('sense-matriu', 'El Llibre Mestre no té cap secció «Matriu P0», «Matriu P1» o «Matriu P2».');
  const ids = new Set();
  for (const t of taules) {
    for (const fila of t.files) {
      const id = idDeFila(fila, t.columnes);
      if (id === null) continue;
      if (ids.has(id)) avisos.push({ codi: 'id-repetit', prioritat: t.prioritat, linia: fila.linia, id });
      ids.add(id);
    }
  }
  return {
    taules: taules.map((t) => ({ prioritat: t.prioritat, titol: t.titol, columnes: t.columnes, files: t.files })),
    avisos
  };
}

/* ── L'estat de cada fila ──────────────────────────────────────────────── */

const COMMIT = /^[0-9a-f]{7,64}$/i;
const DATA = /^\d{6}$/;
const net = (v) => (typeof v === 'string' ? v.replace(/`/g, '').trim() : '');
const interiorDe = (literal) => {
  const m = /^\[(.*)\]$/s.exec(literal);
  return (m ? m[1] : literal).trim();
};

/**
 * Els commits que són a la història del HEAD, per prefix i sense ambigüitat.
 * `equivalents` (equivalentsDe) diu, per a un prefix de fora de la història,
 * el commit de la història amb el mateix canvi; per defecte, cap.
 */
export function historiaDe(shas, equivalents = null) {
  const llista = [...new Set((shas ?? []).map((s) => String(s).trim().toLowerCase()).filter((s) => /^[0-9a-f]{40,64}$/.test(s)))];
  return {
    mida: llista.length,
    resol(prefix) {
      const p = String(prefix).toLowerCase();
      const trobats = llista.filter((s) => s.startsWith(p));
      return trobats.length === 1 ? trobats[0] : null;
    },
    equivalent(prefix) {
      return equivalents?.get(String(prefix).toLowerCase()) ?? null;
    }
  };
}

const enumera = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} i ${xs.at(-1)}`);
const textCommits = (cs) => (cs.length === 1 ? `el commit ${cs[0]} és` : `els commits ${enumera(cs)} són`);

/* Les parts d'un estat del Llibre: el text, els segments separats per «·», la
   primera paraula i, si és FET, els commits que cita (en minúscules) i si és
   pur (un o més commits i, com a molt, una data). */
function partsDe(literal) {
  const text = net(literal);
  const segments = interiorDe(text).split('·').map((s) => s.trim()).filter(Boolean);
  const paraula = (segments[0] ?? '').normalize('NFC').toLocaleUpperCase('ca');
  const commits = [];
  let pur = paraula === 'FET' && segments.length > 1;
  if (paraula === 'FET') {
    for (const seg of segments.slice(1)) {
      if (DATA.test(seg)) continue;
      const fitxes = seg.split(/[\s/,]+/).filter(Boolean);
      if (fitxes.length && fitxes.every((f) => COMMIT.test(f))) commits.push(...fitxes.map((f) => f.toLowerCase()));
      else pur = false;
    }
  }
  return { text, segments, paraula, commits, pur: pur && commits.length > 0 };
}

/** Els commits d'un «FET · …» pur que la història del HEAD no resol: els que equivalentsDe busca. */
export function commitsForaDe(literal, historia) {
  const { commits, pur } = partsDe(literal);
  return pur ? commits.filter((c) => !historia?.resol(c)) : [];
}

/* El que es diu d'uns commits de fora que tenen el mateix canvi a la història
   del HEAD (equivalentsDe): on són ara i què cal fer. No segella res. */
function textEquivalents(fora, historia) {
  const parells = fora.map((c) => [c, historia?.equivalent?.(c) ?? null]).filter(([, e]) => e);
  if (!parells.length) return '';
  const un = parells.length === 1;
  return ` ${un ? 'El canvi' : 'Els canvis'} de ${enumera(parells.map(([c]) => c))} sí que ${un ? 'hi és' : 'hi són'}, amb ${un ? 'un altre commit' : 'uns altres commits'} (${enumera(parells.map(([, e]) => e.slice(0, 9)))}): el mateix autor, la mateixa data, el mateix assumpte i el mateix canvi als mateixos fitxers. Cal corregir ${un ? 'el commit' : 'els commits'} al Llibre.`;
}

/**
 * L'estat d'una fila del Llibre en el vocabulari de la matriu: { status,
 * evidencia }. `literal` és el text de la cel·la «Estat» (amb claudàtors o
 * sense); `historia`, historiaDe(git rev-list HEAD). Cap estat s'inventa: el
 * que no és FET segellat, PARCIAL, PENDENT o BACKLOG passa literal.
 * `estatDeStatus` és el vocabulari amb què la Consola llegirà l'estat (per
 * defecte, el de matriuGovern.js d'este procés; el connector passa el d'ara).
 */
export function estatDelLlibre(literal, historia, { estatDeStatus: llegeix = estatDeStatus } = {}) {
  const { text, segments, paraula, commits, pur } = partsDe(literal);
  const diu = `El Llibre diu «${text || 'res'}».`;
  if (paraula === 'FET') {
    if (pur) {
      const resolts = commits.map((c) => historia?.resol(c) ?? null);
      if (resolts.every(Boolean)) {
        return { status: STATUS_MATRIU.fet, evidencia: `${diu} Segellat: ${textCommits(commits)} a la història del HEAD.` };
      }
      const fora = commits.filter((_c, i) => !resolts[i]);
      return {
        status: text,
        evidencia: `${diu} No es dona per segellat: ${textCommits(fora).replace(/ (és|són)$/, '')} no ${fora.length === 1 ? 'és' : 'són'} a la història del HEAD.${textEquivalents(fora, historia)}`
      };
    }
    const motiu = commits.length ? 'porta més que un commit i una data' : 'no porta cap commit que es puga comprovar';
    return { status: text, evidencia: `${diu} No es dona per segellat: ${motiu}.` };
  }
  if (paraula.startsWith('PARCIAL')) return { status: STATUS_MATRIU.parcial, evidencia: diu };
  if (paraula === 'BACKLOG' || segments.some((s) => s.normalize('NFC').toLocaleUpperCase('ca').startsWith('PENDENT'))) {
    return { status: STATUS_MATRIU.pendent, evidencia: diu };
  }
  // Un literal que la Consola llegiria com a fet sense cap commit comprovat no ix com a fet.
  if (llegeix(text) === 'fet') {
    return { status: null, evidencia: `${diu} No es dona per segellat: cap commit comprovat a la història del HEAD.` };
  }
  return { status: text || null, evidencia: diu };
}

/* ── Les files de la matriu ────────────────────────────────────────────── */

const cella = (fila, i) => (i === null || i === undefined ? null : (fila.celles[i] ?? null));
const textONul = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * Les files de la matriu (l'esquema de Codex) a partir de les taules del
 * Llibre. `opcions.estatDeStatus`, el vocabulari de la Consola (estatDelLlibre).
 */
export function requerimentsDe(taules, historia, opcions = {}) {
  return taules.flatMap((t) => t.files.map((fila) => {
    const c = t.columnes;
    const id = idDeFila(fila, c);
    const ambit = textONul(cella(fila, c.ambit));
    const descripcio = textONul(cella(fila, c.descripcio));
    const fitxers = textONul(cella(fila, c.fitxers));
    const { status, evidencia } = estatDelLlibre(cella(fila, c.estat), historia, opcions);
    return {
      id,
      source: `Llibre Mestre · Matriu ${t.prioritat}`,
      requirement: [ambit, descripcio].filter(Boolean).join(': ') || null,
      status,
      evidence: fitxers ? `${evidencia} Fitxers afectats: ${fitxers}` : evidencia,
      owner: null,
      priority: t.prioritat,
      acceptance: null
    };
  }));
}

/* ── Les dues lectures: el Llibre i git ───────────────────────────────── */

/** El Llibre, només de lectura i només si és un fitxer normal: { text, mtime }. */
export function llegixLlibre(arrel, ruta = RUTA_LLIBRE) {
  const fitxer = path.join(arrel, ruta);
  let estat;
  try { estat = fs.lstatSync(fitxer); } catch { estat = null; }
  if (!estat || !estat.isFile()) throw new ErrorGovern('llibre-absent', 'No es troba el Llibre Mestre com a fitxer normal.');
  if (estat.size > MIDA_MAXIMA_LLIBRE) throw new ErrorGovern('llibre-massa-gran', 'El Llibre Mestre és massa gran per a compilar-ne la matriu.');
  let text;
  try { text = fs.readFileSync(fitxer, 'utf8'); } catch { throw new ErrorGovern('llibre-absent', 'No s’ha pogut llegir el Llibre Mestre.'); }
  return { text, mtime: estat.mtime };
}

/**
 * Un `git` de només lectura per a una arrel: execFile amb arguments (cap
 * shell), sense bloquejos opcionals, sense preguntar res i sense pujar per
 * damunt de l'arrel. Torna l'eixida estàndard.
 */
export function gitDe(arrel) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C', GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(arrel)) };
  for (const clau of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[clau];
  const opcions = { cwd: arrel, env, encoding: 'utf8', timeout: 10_000, maxBuffer: 32 * 1024 * 1024, windowsHide: true, shell: false };
  return (args) => new Promise((resol, rebutja) => {
    execFile('git', args, opcions, (error, stdout) => (error ? rebutja(error) : resol(String(stdout))));
  });
}

const PATRO_SHA = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;

/** El HEAD d'ara i la seua història: { head, historia }. Llança 'git-absent' si git no respon. */
export async function llegixHead(git) {
  let head;
  let llista;
  try {
    head = (await git(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'])).trim().toLowerCase();
    if (!PATRO_SHA.test(head)) throw new Error('HEAD');
    llista = (await git(['rev-list', head])).split('\n');
  } catch {
    throw new ErrorGovern('git-absent', 'No s’ha pogut llegir el HEAD amb git.');
  }
  return { head, historia: historiaDe(llista) };
}

/** Quants commits de fora de la història es busquen per equivalència en cada lectura, com a molt. */
export const MAX_EQUIVALENTS = 32;
const FORMAT_LOG = '--format=%x00%H%x09%at%x09%ae%x09%s';
const LOG_NET = ['--no-show-signature', '--no-color'];
const AMB_CANVI = ['--raw', '--no-renames', '--no-abbrev'];

/* Els blocs d'un `git log` amb FORMAT_LOG: [{ sha, meta, canvi }]; `meta` és
   la data d'autor, el correu d'autor i l'assumpte, i `canvi`, les línies
   --raw ordenades (modes, contingut d'abans i de després, estat i camí). */
function blocsDeLog(eixida) {
  return String(eixida).split('\0').slice(1).map((bloc) => {
    const [cap = '', ...resta] = bloc.split('\n');
    const tab = cap.indexOf('\t');
    return {
      sha: (tab === -1 ? cap : cap.slice(0, tab)).trim().toLowerCase(),
      meta: tab === -1 ? '' : cap.slice(tab + 1),
      canvi: resta.filter((l) => l.startsWith(':')).sort().join('\n')
    };
  });
}

/**
 * Per a cada commit que el Llibre cita i que no és a la història del HEAD
 * (commitsForaDe), el commit de la història que porta el mateix canvi: el
 * deixa una reescriptura (rebase, filter-branch) amb un altre SHA. Ha de tindre
 * el mateix autor, la mateixa data d'autor, el mateix assumpte i el mateix
 * canvi --raw (els mateixos fitxers, amb els mateixos continguts d'abans i de
 * després), i ha de ser l'únic. Torna un Map prefix → sha. Només lectura
 * (rev-parse i log); un commit que no és al repositori, un prefix ambigu o un
 * git que falla no tenen equivalent, i la fila es queda com estava.
 */
export async function equivalentsDe(git, head, prefixos) {
  const equivalents = new Map();
  if (!PATRO_SHA.test(String(head ?? ''))) return equivalents;
  const vells = new Map();
  for (const prefix of [...new Set((prefixos ?? []).map((p) => String(p).toLowerCase()))].filter((p) => COMMIT.test(p)).slice(0, MAX_EQUIVALENTS)) {
    try {
      const sha = (await git(['rev-parse', '--verify', '--quiet', `${prefix}^{commit}`])).trim().toLowerCase();
      if (PATRO_SHA.test(sha)) vells.set(prefix, sha);
    } catch { /* no és al repositori, o el prefix és ambigu */ }
  }
  if (!vells.size) return equivalents;
  try {
    const shas = [...new Set(vells.values())];
    const deVells = new Map(blocsDeLog(await git(['log', '--no-walk', ...LOG_NET, ...AMB_CANVI, FORMAT_LOG, ...shas])).map((b) => [b.sha, b]));
    const metes = new Set([...deVells.values()].filter((b) => b.canvi && b.meta).map((b) => b.meta));
    if (!metes.size) return equivalents;
    const candidats = blocsDeLog(await git(['log', '--no-merges', ...LOG_NET, FORMAT_LOG, head, '--not', ...shas]))
      .filter((b) => metes.has(b.meta)).map((b) => b.sha);
    if (!candidats.length) return equivalents;
    const ambCanvi = blocsDeLog(await git(['log', '--no-walk', ...LOG_NET, ...AMB_CANVI, FORMAT_LOG, ...candidats]));
    for (const [prefix, sha] of vells) {
      const vell = deVells.get(sha);
      if (!vell?.canvi) continue;
      const iguals = ambCanvi.filter((b) => b.meta === vell.meta && b.canvi === vell.canvi);
      if (iguals.length === 1) equivalents.set(prefix, iguals[0].sha);
    }
  } catch {
    return new Map();
  }
  return equivalents;
}

/**
 * sdp.govern.v1 compilat ara: el Llibre de `arrel` i el seu HEAD. `git` i `ara`
 * són per a les proves (per defecte, gitDe(arrel) i el rellotge);
 * `estatDeStatus`, el vocabulari de la Consola (estatDelLlibre; el connector
 * passa el de matriuGovern.js d'ara).
 */
export async function recullGovern(arrel, { ara = new Date(), git = gitDe(arrel), ruta = RUTA_LLIBRE, estatDeStatus: vocabulari = estatDeStatus } = {}) {
  const { text, mtime } = llegixLlibre(arrel, ruta);
  const { taules, avisos } = taulesDeMatriu(text);
  const { head, historia: delHead } = await llegixHead(git);
  const fora = taules.flatMap((t) => t.files.flatMap((fila) => commitsForaDe(cella(fila, t.columnes.estat), delHead)));
  const equivalents = fora.length ? await equivalentsDe(git, head, fora) : new Map();
  const historia = { ...delHead, equivalent: (prefix) => equivalents.get(String(prefix).toLowerCase()) ?? null };
  return {
    schema: ESQUEMA_GOVERN,
    generat: ara.toISOString(),
    head,
    mcr: {
      at: mtime.toISOString(),
      baseline_head: head,
      scope: ABAST_LLIBRE,
      pla: PLA_LLIBRE,
      requirements: requerimentsDe(taules, historia, { estatDeStatus: vocabulari })
    },
    trasllat: null,
    font: ruta,
    avisos
  };
}
