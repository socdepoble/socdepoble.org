/**
 * llavorPrivada.js — lectura local de la llavor privada d'un arbre
 * (esquema 'sdp.genealogia.privat.v1') i detecció del format d'un fitxer.
 *
 * P0-114b (ordre del Mestre, 261111): la persona carrega el SEU arbre privat
 * amb un sol clic. El text arriba del fitxer que tria al seu dispositiu i no
 * ix d'ací: no hi ha xarxa, i res d'este mòdul porta cap dada d'eixe fitxer.
 *
 * La lectura és defensiva, amb les mateixes guardes que llegeixCopiaJson:
 *   · límit de mida abans de llegir, reviver que rebutja __proto__,
 *     constructor i prototype, esquema comprovat i límits de persones;
 *   · només es lligen les claus conegudes (llista blanca), i cada persona i
 *     cada relació passen pels netejadors del nucli; un registre invàlid es
 *     descarta amb un avís i la resta continua;
 *   · els ids del fitxer viuen en un Map i mai es reaprofiten: tots els ids
 *     són nous (nouId), i les fonts només porten una URL si passa urlSegura.
 *
 * Vincles: només els declarats (pare_id, mare_id) i els de la numeració
 * ahnentafel (el pare de n és 2n i la mare, 2n+1). L'estat del vincle és el
 * més feble de les dues persones. Llei «Cognom ≠ Parentiu»: les pistes
 * col·laterals entren com a persones candidates [FALTA CONFIRMAR], sense cap
 * vincle de parentiu, encara que compartisquen cognoms.
 *
 * Errors i avisos són codis ('codi' o 'codi:índex'); la interfície els
 * traduïx. Mai porten text del fitxer.
 */

import {
  GENERACIONS,
  MAX_FONTS_PER_PERSONA,
  MAX_PERSONES,
  MAX_RELACIONS,
  MIDA_MAXIMA_IMPORTACIO,
  TIPUS_FONT,
  creaArbre,
  creaPersona,
  creaRelacio,
  enter,
  esClauSegura,
  llegeixData,
  netejaArbre,
  netejaPersona,
  netejaRelacio,
  objectePla,
  revivorSegur,
  text,
  urlSegura
} from '../nucli/index.js';
import { MAX_AVISOS, estatMesFeble } from './comu.js';
import { descodificaFitxerArbre } from './codificacio.js';
import { superaMidaImportacio } from './comu.js';
import { llegeixCopiaJson } from './copiaJson.js';
import { llegeixGedcom } from './llegeixGedcom.js';

export const ESQUEMA_LLAVOR = 'sdp.genealogia.privat.v1';

/** Grups de pistes col·laterals com a màxim. */
export const MAX_PISTES = 500;
const MAX_VARIANTS = 20;
const MAX_NOMS_PER_PISTA = 500;
const MAX_REGISTRES_PER_PISTA = 500;
const MAX_AHNENTAFEL = 2 ** 30;
const MAX_TOKENS_NOM = 6;

/* Els estats epistemològics, com els escriu la llavor (sense claudàtors ni accents). */
const ESTAT_DE_LLAVOR = new Map([
  ['CONFIRMAT', 'confirmat'],
  ['APROXIMAT', 'aproximat'],
  ['FALTA CONFIRMAR', 'falta-confirmar'],
  ['CONTRADICCIO', 'contradiccio'],
  ['CONTRADICCIO DETECTADA', 'contradiccio']
]);
const VIVA_DE_LLAVOR = new Map([
  ['viu', 'si'], ['viva', 'si'], ['vivo', 'si'], ['alive', 'si'], ['living', 'si'],
  ['mort', 'no'], ['morta', 'no'], ['difunt', 'no'], ['difunta', 'no'], ['muerto', 'no'], ['muerta', 'no'], ['deceased', 'no']
]);
/* L'evidència de cada estat (la mateixa equivalència que llegeixGedcom). */
const EVIDENCIA = Object.freeze({
  confirmat: Object.freeze({ fontEscrita: true, memoriaOral: false, vincleExplicit: true }),
  aproximat: Object.freeze({ fontEscrita: false, memoriaOral: true, vincleExplicit: true }),
  'falta-confirmar': Object.freeze({ fontEscrita: false, memoriaOral: false, vincleExplicit: false }),
  contradiccio: Object.freeze({ fontEscrita: false, memoriaOral: false, vincleExplicit: false })
});

/* Majúscules sense accents ni claudàtors: «[Contradicció]» → 'CONTRADICCIO'. */
function clauEstat(valor) {
  if (typeof valor !== 'string') return '';
  let net = valor.trim();
  if (net.startsWith('[') && net.endsWith(']')) net = net.slice(1, -1).trim();
  return net.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().split(' ').filter((t) => t !== '').join(' ');
}

/* Un text del fitxer: només primitius; un objecte o una llista és un error. */
const textDe = (valor, max) => text(valor, max);

/* Un «nom» entre claudàtors és un forat («[pendent]»), no un nom. */
function nomDe(valor) {
  const net = textDe(valor, 200);
  return net.startsWith('[') && net.endsWith(']') ? '' : net.slice(0, 80);
}

/* La generació (G1 a G4) que dona l'ahnentafel: 1 → G4, 2-3 → G3, 4-7 → G2, 8-15 → G1. */
function generacioDe(cru, ahnentafel) {
  if (GENERACIONS.includes(cru)) return cru;
  if (ahnentafel === null) return null;
  const profunditat = Math.floor(Math.log2(ahnentafel));
  return GENERACIONS[3 - profunditat] ?? null;
}

/* Les fonts d'una persona: { titol, url, tipus, citacio }; una URL que no passa urlSegura es descarta. */
function fontsDe(llista, index, { nouId, avisa }) {
  if (llista === undefined || llista === null) return [];
  if (!Array.isArray(llista)) throw new TypeError('fonts');
  const fonts = [];
  for (const cru of llista) {
    if (fonts.length >= MAX_FONTS_PER_PERSONA) {
      avisa('massa-fonts', index);
      break;
    }
    if (!objectePla(cru)) {
      avisa('font-invalida', index);
      continue;
    }
    const urlCrua = textDe(cru.url, 2048);
    const url = urlSegura(urlCrua);
    if (urlCrua !== '' && url === '') avisa('url-descartada', index);
    const tipus = textDe(cru.tipus, 40);
    const font = {
      id: nouId(),
      tipus: TIPUS_FONT.includes(tipus) ? tipus : 'altra',
      titol: textDe(cru.titol, 200),
      url,
      arxiuId: null,
      citacio: textDe(cru.citacio, 500),
      transcripcio: textDe(cru.transcripcio, 4000),
      consultada: null
    };
    if (font.titol || font.url || font.citacio || font.transcripcio) fonts.push(font);
  }
  return fonts;
}

/* Les variants documentals d'un nom, una per línia i marcades amb «≈». */
function variantsDe(llista) {
  if (llista === undefined || llista === null) return [];
  if (!Array.isArray(llista)) throw new TypeError('variants');
  return llista.slice(0, MAX_VARIANTS).map((v) => textDe(v, 200)).filter((v) => v !== '').map((v) => `≈ ${v}`);
}

/* Una data de la llavor (text o any) a la forma del nucli; null si no n'hi ha. */
function dataDe(valor, index, { anyActual, avisa }) {
  if (valor === undefined || valor === null || valor === '') return null;
  const llegida = llegeixData(typeof valor === 'number' ? valor : textDe(valor, 40), { anyActual });
  if (!llegida.ok) {
    avisa('data-invalida', index);
    return null;
  }
  return llegida.data;
}

/**
 * Parteix un nom complet d'una pista: «Nom [Nom2] Cognom1 Cognom2». Un text
 * que no té forma de nom (parèntesis, comes, «i», massa paraules) es queda
 * sencer al nom: la pista és [FALTA CONFIRMAR] i la persona el revisa.
 */
function partixNom(complet) {
  const tokens = complet.split(' ').filter((t) => t !== '');
  const compost = tokens.length > MAX_TOKENS_NOM || tokens.some((t) => ['i', 'y', 'e', 'and', 'eta'].includes(t.toLowerCase()))
    || ['(', ')', ',', ';', '/', '[', ']'].some((signe) => complet.includes(signe));
  if (compost || tokens.length === 1) return { nom: complet.slice(0, 80), cognom1: '', cognom2: '' };
  if (tokens.length === 2) return { nom: tokens[0].slice(0, 80), cognom1: tokens[1].slice(0, 80), cognom2: '' };
  return {
    nom: tokens.slice(0, -2).join(' ').slice(0, 80),
    cognom1: tokens[tokens.length - 2].slice(0, 80),
    cognom2: tokens[tokens.length - 1].slice(0, 80)
  };
}

/**
 * Llig la llavor ja analitzada (un objecte pla). La crida llegeixLlavorPrivada
 * i també llegeixFitxerArbre, que ja l'ha analitzada per a triar el format.
 */
function llavorDesDe(dades, { nouId, ara, anyActual, titol = '' }) {
  const avisos = [];
  let avisosPerduts = 0;
  const avisa = (codi, index) => {
    if (avisos.length >= MAX_AVISOS) {
      avisosPerduts += 1;
      return;
    }
    avisos.push(index === undefined ? codi : `${codi}:${index}`);
  };
  const recompte = { persones: 0, candidates: 0, relacions: 0 };
  const falla = (codi) => ({ ok: false, errors: [codi], avisos, versio: 'JSON', complet: null, recompte });

  if (!objectePla(dades) || dades.schema !== ESQUEMA_LLAVOR) return falla('esquema');
  const confirmades = dades.persones_confirmades_pel_mestre ?? [];
  const pistes = dades.pistes_col_laterals_fan_club_pendents_confirmar ?? [];
  if (!Array.isArray(confirmades) || !Array.isArray(pistes)) return falla('esquema');
  if (dades.poble_arrel !== undefined && dades.poble_arrel !== null && !objectePla(dades.poble_arrel)) return falla('esquema');
  if (confirmades.length > MAX_PERSONES || pistes.length > MAX_PISTES) return falla('limit');

  const arbreId = nouId();
  const persones = [];
  /* Per a cada persona: l'id nou, l'id del fitxer, l'ahnentafel i els progenitors declarats. */
  const fitxes = [];
  const perIdFitxer = new Map();
  const perAhnentafel = new Map();

  confirmades.forEach((cru, index) => {
    if (!objectePla(cru)) {
      avisa('persona-invalida', index);
      return;
    }
    const idFitxer = typeof cru.id === 'string' && cru.id !== '' && cru.id.length <= 200 && esClauSegura(cru.id) ? cru.id : null;
    if (idFitxer !== null && perIdFitxer.has(idFitxer)) {
      avisa('persona-invalida', index);
      return;
    }
    let ahnentafel = cru.ahnentafel === undefined || cru.ahnentafel === null ? null : enter(cru.ahnentafel, { min: 1, max: MAX_AHNENTAFEL });
    if (cru.ahnentafel !== undefined && cru.ahnentafel !== null && ahnentafel === null) avisa('ahnentafel-invalid', index);
    if (ahnentafel !== null && perAhnentafel.has(ahnentafel)) {
      avisa('ahnentafel-repetit', index);
      ahnentafel = null;
    }
    try {
      const clau = clauEstat(cru.estat_epistemologic);
      let estat = ESTAT_DE_LLAVOR.get(clau) ?? null;
      if (estat === null) {
        if (clau !== '') avisa('estat-desconegut', index);
        estat = 'falta-confirmar';
      }
      const viva = VIVA_DE_LLAVOR.get(textDe(cru.estat_vital, 40).toLowerCase()) ?? 'desconegut';
      const sexeCru = textDe(cru.sexe, 1).toUpperCase();
      let sexe = sexeCru === 'M' || sexeCru === 'F' ? sexeCru : 'U';
      if (sexe === 'U' && ahnentafel !== null && ahnentafel > 1) sexe = ahnentafel % 2 === 0 ? 'M' : 'F';
      const naixement = dataDe(cru.naixement, index, { anyActual, avisa });
      const defuncio = dataDe(cru.defuncio, index, { anyActual, avisa });
      const notes = [textDe(cru.nota_genealogica, 2000), ...variantsDe(cru.variants_documentals)].filter((n) => n !== '').join('\n');
      const camps = {
        id: nouId(),
        arbreId,
        ara,
        nom: nomDe(cru.nom),
        cognom1: textDe(cru.primer_cognom ?? cru.cognom1, 80),
        cognom2: textDe(cru.segon_cognom ?? cru.cognom2, 80),
        malnom: textDe(cru.malnom, 80),
        casa: textDe(cru.casa, 80),
        lloc: textDe(cru.lloc ?? cru.poble, 120),
        sexe,
        viva,
        ofici: textDe(cru.ofici, 80),
        generacio: generacioDe(cru.generacio, ahnentafel),
        estat,
        fonts: fontsDe(cru.fonts_verificades, index, { nouId, avisa }),
        notes: notes.slice(0, 2000),
        origen: 'llavor'
      };
      if (naixement) camps.naixement = naixement;
      camps.defuncio = defuncio;
      const persona = netejaPersona(creaPersona(camps, { anyActual }), { anyActual });
      persones.push(persona);
      const fitxa = {
        index, id: persona.id, estat: persona.estat, ahnentafel,
        pare: textDe(cru.pare_id, 200), mare: textDe(cru.mare_id, 200)
      };
      fitxes.push(fitxa);
      if (idFitxer !== null) perIdFitxer.set(idFitxer, fitxa);
      if (ahnentafel !== null) perAhnentafel.set(ahnentafel, fitxa);
    } catch {
      avisa('persona-invalida', index);
    }
  });

  /* Vincles de progenitor: els declarats manen; l'ahnentafel els completa. */
  const relacions = [];
  const vistes = new Set();
  const afigProgenitor = (progenitor, fill) => {
    const clau = `${progenitor.id}|${fill.id}`;
    if (progenitor.id === fill.id || vistes.has(clau)) return;
    if (relacions.length >= MAX_RELACIONS) {
      avisa('massa-relacions');
      return;
    }
    vistes.add(clau);
    const estat = estatMesFeble([progenitor.estat, fill.estat]) ?? 'falta-confirmar';
    try {
      const relacio = creaRelacio({ id: nouId(), arbreId, tipus: 'progenitor', de: progenitor.id, a: fill.id, evidencia: EVIDENCIA[estat], ara });
      relacions.push(netejaRelacio({ ...relacio, estat }));
    } catch {
      avisa('relacio-invalida', fill.index);
    }
  };
  const progenitorDe = (fill, declarat, posicio) => {
    const perNumero = fill.ahnentafel !== null && fill.ahnentafel * 2 + posicio <= MAX_AHNENTAFEL
      ? perAhnentafel.get(fill.ahnentafel * 2 + posicio) ?? null
      : null;
    if (declarat === '') return perNumero;
    const perId = perIdFitxer.get(declarat) ?? null;
    if (!perId) {
      avisa('referencia-trencada', fill.index);
      return perNumero;
    }
    if (perNumero && perNumero !== perId) avisa('ahnentafel-discordant', fill.index);
    return perId;
  };
  for (const fill of fitxes) {
    const pare = progenitorDe(fill, fill.pare, 0);
    const mare = progenitorDe(fill, fill.mare, 1);
    if (pare) afigProgenitor(pare, fill);
    if (mare && mare !== pare) afigProgenitor(mare, fill);
    else if (mare) avisa('relacio-invalida', fill.index);
  }

  /* Pistes col·laterals: candidates [FALTA CONFIRMAR], sense cap vincle. */
  const candidata = (nomComplet, notes, urls, index) => {
    if (persones.length >= MAX_PERSONES) {
      avisa('massa-persones');
      return false;
    }
    try {
      const fonts = [];
      for (const urlCrua of urls) {
        if (urlCrua === '') continue;
        const url = urlSegura(urlCrua);
        if (url === '') avisa('url-descartada', index);
        else if (fonts.length < MAX_FONTS_PER_PERSONA && !fonts.some((f) => f.url === url)) {
          fonts.push({ id: nouId(), tipus: 'altra', titol: '', url, arxiuId: null, citacio: '', transcripcio: '', consultada: null });
        }
      }
      const persona = netejaPersona(creaPersona({
        id: nouId(), arbreId, ara, ...partixNom(nomComplet), viva: 'desconegut', generacio: null, estat: 'falta-confirmar',
        fonts, notes: notes.filter((n) => n !== '').join('\n').slice(0, 2000), origen: 'llavor:pista'
      }, { anyActual }), { anyActual });
      persones.push(persona);
      recompte.candidates += 1;
    } catch {
      avisa('pista-invalida', index);
    }
    return true;
  };
  for (let index = 0; index < pistes.length; index += 1) {
    const grup = pistes[index];
    if (!objectePla(grup)) {
      avisa('pista-invalida', index);
      continue;
    }
    let notesGrup;
    let urlGrup;
    let noms;
    let registres;
    try {
      /* Les notes del grup: la descripció i les claus «nota_…», i res més. */
      notesGrup = [textDe(grup.grup, 500), ...Object.keys(grup).filter((clau) => clau.startsWith('nota_')).map((clau) => textDe(grup[clau], 1000))];
      urlGrup = textDe(grup.font_url, 2048);
      noms = grup.persones ?? [];
      registres = grup.registres ?? [];
      if (!Array.isArray(noms) || !Array.isArray(registres)) throw new TypeError('pista');
    } catch {
      avisa('pista-invalida', index);
      continue;
    }
    if (noms.length > MAX_NOMS_PER_PISTA || registres.length > MAX_REGISTRES_PER_PISTA) {
      avisa('pista-invalida', index);
      continue;
    }
    let segueix = true;
    for (const nom of noms) {
      if (!segueix) break;
      let complet;
      try {
        complet = textDe(nom, 200);
      } catch {
        avisa('pista-invalida', index);
        continue;
      }
      if (complet !== '') segueix = candidata(complet, notesGrup, [urlGrup], index);
    }
    for (const registre of registres) {
      if (!segueix) break;
      if (!objectePla(registre)) {
        avisa('pista-invalida', index);
        continue;
      }
      let complet;
      let notes;
      let url;
      try {
        complet = textDe(registre.persona, 200);
        notes = [complet, textDe(registre.epoca, 200), textDe(registre.lloc, 200), textDe(registre.detall, 1000), ...notesGrup];
        url = textDe(registre.url, 2048);
      } catch {
        avisa('pista-invalida', index);
        continue;
      }
      if (complet !== '') segueix = candidata(complet, notes, [url, urlGrup], index);
    }
  }

  if (persones.length === 0) avisa('sense-persones');
  if (avisosPerduts > 0) avisos.push(`mes-avisos:${avisosPerduts}`);

  let arbre;
  try {
    const arrel = perAhnentafel.get(1) ?? fitxes[0] ?? null;
    let poble = '';
    if (objectePla(dades.poble_arrel)) poble = textDe(dades.poble_arrel.municipi_oficial ?? dades.poble_arrel.poble, 120);
    arbre = netejaArbre({ ...creaArbre({ id: arbreId, titol: textDe(titol, 80), ara }), poble, arrelId: arrel?.id ?? null });
  } catch {
    return falla('arbre');
  }
  recompte.persones = persones.length;
  recompte.relacions = relacions.length;
  return { ok: true, errors: [], avisos, versio: 'JSON', complet: { arbre, persones, relacions, entrevista: null }, recompte };
}

function exigeixOpcions({ nouId, ara, anyActual } = {}) {
  if (typeof nouId !== 'function') throw new TypeError('nouId');
  if (!Number.isSafeInteger(anyActual)) throw new TypeError('anyActual');
  if (typeof ara !== 'string') throw new TypeError('ara');
}

/* Analitza un JSON amb el reviver segur; torna { dades } o { falla: codi }. */
function analitza(cadena) {
  try {
    return { dades: JSON.parse(cadena, revivorSegur) };
  } catch (error) {
    return { falla: error instanceof TypeError ? 'clau-perillosa' : 'json' };
  }
}

/* El text sense BOM, o el codi d'error si no es pot llegir. */
function preparaText(cru) {
  if (cru === null || cru === undefined) return { falla: 'buit' };
  if (typeof cru !== 'string') return { falla: 'tipus' };
  if (superaMidaImportacio(cru, MIDA_MAXIMA_IMPORTACIO)) return { falla: 'mida' };
  const cadena = cru.charCodeAt(0) === 0xfeff ? cru.slice(1) : cru;
  if (cadena.trim() === '') return { falla: 'buit' };
  return { cadena };
}

/**
 * Llig una llavor privada ('sdp.genealogia.privat.v1') i torna un
 * ArbreComplet nou (ids nous) sense desar res.
 * @returns {{ ok: boolean, errors: string[], avisos: string[], versio: 'JSON',
 *   complet: object|null, recompte: { persones: number, candidates: number, relacions: number } }}
 */
export function llegeixLlavorPrivada(textJson, opcions = {}) {
  exigeixOpcions(opcions);
  const buit = { ok: false, avisos: [], versio: 'JSON', complet: null, recompte: { persones: 0, candidates: 0, relacions: 0 } };
  const { cadena, falla } = preparaText(textJson);
  if (falla) return { ...buit, errors: [falla] };
  const analitzat = analitza(cadena);
  if (analitzat.falla) return { ...buit, errors: [analitzat.falla] };
  return llavorDesDe(analitzat.dades, opcions);
}

/**
 * Llig un fitxer d'arbre triant el format pel CONTINGUT (no pel nom):
 *   · un JSON amb schema 'sdp.genealogia.privat.v1' → la llavor privada;
 *   · qualsevol altre JSON → la còpia de l'app (llegeixCopiaJson);
 *   · la resta → GEDCOM 5.5, 5.5.1 o 7.0 (llegeixGedcom).
 * @returns {{ format: 'llavor'|'copia'|'gedcom'|null, ok: boolean, errors: string[],
 *   avisos: string[], versio: string|null, complet: object|null }}
 */
export function llegeixFitxerArbre(cru, opcions = {}) {
  exigeixOpcions(opcions);
  const { nouId, ara, anyActual, titol = '' } = opcions;
  const { cadena, falla } = preparaText(cru);
  if (falla) return { format: null, ok: false, errors: [falla], avisos: [], versio: null, complet: null };
  if (cadena.trimStart().startsWith('{')) {
    const analitzat = analitza(cadena);
    if (analitzat.falla) return { format: 'copia', ok: false, errors: [analitzat.falla], avisos: [], versio: 'JSON', complet: null };
    if (objectePla(analitzat.dades) && analitzat.dades.schema === ESQUEMA_LLAVOR) {
      return { format: 'llavor', ...llavorDesDe(analitzat.dades, { nouId, ara, anyActual, titol }) };
    }
    return { format: 'copia', ...llegeixCopiaJson(cadena, { nouId, anyActual }), versio: 'JSON' };
  }
  return { format: 'gedcom', ...llegeixGedcom(cadena, { nouId, ara, anyActual, titol }) };
}

/** Llig els bytes del fitxer local abans de decidir-ne el format. */
export async function lligTextFitxerArbre(fitxer) {
  if (typeof fitxer.arrayBuffer !== 'function') return fitxer.text();
  const bytes = new Uint8Array(await fitxer.arrayBuffer());
  if (bytes.length > MIDA_MAXIMA_IMPORTACIO) throw Object.assign(new TypeError('Mida'), { codiLectura: 'mida' });
  try {
    return descodificaFitxerArbre(bytes);
  } catch {
    throw Object.assign(new TypeError('Codificació'), { codiLectura: 'codificacio-invalida' });
  }
}
