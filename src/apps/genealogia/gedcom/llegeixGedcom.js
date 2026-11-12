/**
 * llegeixGedcom.js — lectura local d'un fitxer GEDCOM 5.5, 5.5.1 o 7.0.
 *
 * El text arriba del fitxer que la persona tria al seu dispositiu i no ix
 * d'ací: no hi ha xarxa. La lectura és defensiva:
 *   · límit de mida (MIDA_MAXIMA_IMPORTACIO), de línies (300 000) i de
 *     llargada de línia; regex ancorades sense quantificadors niats;
 *   · els xref viuen en Map, mai en objectes indexats per una clau del
 *     fitxer, i mai es reaprofiten com a ids (els ids nous són de nouId());
 *   · cada persona i cada relació passen per la llista blanca del nucli; un
 *     registre invàlid es descarta amb un avís i la resta continua.
 *
 * Llei «Cognom ≠ Parentiu»: només FAM (HUSB, WIFE, CHIL) i ASSO creen
 * vincles. Cap cognom compartit en crea cap ni fusiona persones.
 *
 * No filtra persones vives: és l'arbre del seu dispositiu. La interfície
 * ensenya el recompte i els avisos abans de desar.
 *
 * Errors i avisos són codis ('codi' o 'codi:línia'); la interfície els
 * traduïx. Mai porten text del fitxer.
 */

import { ESTATS, TIPUS_FONT, TIPUS_RELACIO_TOTS } from '../nucli/constants.js';
import { creaArbre, creaPersona, creaRelacio, netejaArbre, netejaFont, netejaRelacio } from '../nucli/model.js';
import { MIDA_MAXIMA_IMPORTACIO, MAX_FONTS_PER_PERSONA, MAX_PERSONES, MAX_RELACIONS, text, urlSegura } from '../nucli/segur.js';
import { llegeixDataGedcom } from '../nucli/dates.js';
import {
  MAX_LINIES,
  MAX_LLARGADA_LINIA,
  MAX_AVISOS,
  ETIQUETES_LECTURA,
  ETIQUETA_VINCLE,
  COMPTADOR_VINCLES,
  ETIQUETES_VINCLE,
  superaMidaImportacio,
  RELA_LECTURA
} from './comu.js';

/* Línia GEDCOM: nivell, xref opcional, etiqueta i valor opcional. Cada
   grup té una classe tancada o un límit fix: no hi ha backtracking niat. */
const RE_LINIA = /^(\d{1,2}) (?:@([A-Za-z0-9_]{1,64})@ )?([A-Za-z0-9_]{1,31})(?: ([\s\S]*))?$/;
const RE_NIVELL = /^(\d{1,2})(?: |$)/;
const RE_PUNTER = /^@([A-Za-z0-9_]{1,64})@$/;
const RE_COMPTADOR = /^(0|[1-9][0-9]{0,5})$/;
/* ------------------------------------------------------------------ */
/* Entrada i línies                                                    */
/* ------------------------------------------------------------------ */

/** Coacció de l'entrada a string; torna null si no és un tipus admés. */
function aCadena(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  return null;
}

/** Partix per CRLF, LF o CR sense regex; torna null si passa de MAX_LINIES. */
function partixLinies(cadena) {
  const linies = [];
  let inici = 0;
  const n = cadena.length;
  for (let i = 0; i < n; i += 1) {
    const codi = cadena.charCodeAt(i);
    if (codi === 10 || codi === 13) {
      linies.push(cadena.slice(inici, i));
      if (linies.length > MAX_LINIES) return null;
      if (codi === 13 && cadena.charCodeAt(i + 1) === 10) i += 1;
      inici = i + 1;
    }
  }
  if (inici < n) linies.push(cadena.slice(inici));
  return linies.length > MAX_LINIES ? null : linies;
}

/** Lleva espais i tabuladors inicials (alguns programes sagnen les línies). */
function senseSagnat(linia) {
  let i = 0;
  while (i < linia.length && (linia[i] === ' ' || linia[i] === '\t')) i += 1;
  return i === 0 ? linia : linia.slice(i);
}

/**
 * Construïx l'arbre de nodes. Un node és { nivell, xref, tag, valor, fills }
 * amb claus fixes: cap clau ve del fitxer. CONT i CONC s'apleguen al pare
 * en cru; la descodificació de '@@' es fa després, quan ja se sap la versió.
 */
function construixNodes(linies, avisa) {
  const arrels = [];
  const pila = [];
  let descarta = -1;
  for (let index = 0; index < linies.length; index += 1) {
    const numero = index + 1;
    const linia = senseSagnat(linies[index]);
    if (linia === '') continue;
    if (linia.length > MAX_LLARGADA_LINIA) {
      avisa('linia-massa-llarga', numero);
      const nivell = RE_NIVELL.exec(linia.slice(0, 3));
      if (nivell) {
        descarta = Number(nivell[1]);
        pila.length = Math.min(pila.length, descarta);
      }
      continue;
    }
    if (descarta >= 0) {
      const nivell = RE_NIVELL.exec(linia.slice(0, 3));
      if (nivell && Number(nivell[1]) > descarta) continue;
      descarta = -1;
    }
    const m = RE_LINIA.exec(linia);
    if (!m) {
      avisa('linia-malformada', numero);
      const nivell = RE_NIVELL.exec(linia.slice(0, 3));
      if (nivell) {
        descarta = Number(nivell[1]);
        pila.length = Math.min(pila.length, descarta);
      }
      continue;
    }
    const nivell = Number(m[1]);
    if (nivell > pila.length) {
      avisa('salt-de-nivell', numero);
      descarta = nivell;
      continue;
    }
    const tag = m[3].toUpperCase();
    const valor = m[4] ?? '';
    if (tag === 'CONT' || tag === 'CONC') {
      const pare = nivell > 0 ? pila[nivell - 1] : null;
      if (!pare || m[2]) {
        avisa('linia-malformada', numero);
        continue;
      }
      pare.valor += (tag === 'CONT' ? '\n' : '') + valor;
      pila.length = nivell;
      continue;
    }
    const node = { nivell, xref: m[2] ?? null, tag, valor, linia: numero, fills: [] };
    if (nivell === 0) arrels.push(node);
    else pila[nivell - 1].fills.push(node);
    pila.length = nivell;
    pila.push(node);
  }
  return arrels;
}

/* ------------------------------------------------------------------ */
/* Accés als nodes                                                     */
/* ------------------------------------------------------------------ */

const fill = (node, tag) => (node ? node.fills.find((f) => f.tag === tag) ?? null : null);
const fills = (node, tag) => (node ? node.fills.filter((f) => f.tag === tag) : []);

/** Descodifica l'escapament de '@': 5.5.x dobla tots els '@'; 7.0 només l'inicial de cada línia. */
function descodifica(cru, versio) {
  if (versio === '7.0') {
    return cru.split('\n').map((l) => (l.startsWith('@@') ? l.slice(1) : l)).join('\n');
  }
  return cru.split('@@').join('@');
}

function punter(node) {
  if (!node) return null;
  const m = RE_PUNTER.exec(node.valor.trim());
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/* Notes, estats i fonts                                               */
/* ------------------------------------------------------------------ */

/** Busca l'etiqueta d'estat d'una nota; si va al principi, la lleva del text. */
function estatDeNota(nota) {
  for (const [etiqueta, estat] of ETIQUETES_LECTURA) {
    const posicio = nota.indexOf(etiqueta);
    if (posicio < 0) continue;
    const resta = posicio === 0 ? nota.slice(etiqueta.length).trim() : nota;
    return { estat, resta };
  }
  return { estat: null, resta: nota };
}

/** Normalitza un rol lliure (RELA o PHRASE) per a comparar-lo per igualtat. */
function tipusDeRol(rol) {
  const net = rol.trim().toLowerCase();
  for (const tipus of ['padri', 'testimoni', 'vei', 'germa']) {
    if (RELA_LECTURA[tipus].includes(net)) return tipus;
  }
  return null;
}

/** Evidència d'un vincle: l'etiqueta d'una NOTE (escrita per l'exportació) mana. */
function evidenciaDe(estatNota, teFont) {
  if (estatNota === 'confirmat') return { fontEscrita: true, memoriaOral: false, vincleExplicit: true };
  if (estatNota === 'aproximat') return { fontEscrita: false, memoriaOral: true, vincleExplicit: true };
  if (estatNota === 'falta-confirmar') return { fontEscrita: false, memoriaOral: false, vincleExplicit: false };
  return { fontEscrita: teFont, memoriaOral: false, vincleExplicit: true };
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

/**
 * Llig un GEDCOM i torna un ArbreComplet nou (ids nous) sense desar res.
 * @returns {{ ok: boolean, errors: string[], avisos: string[], versio: '7.0'|'5.5.1'|'5.5'|null,
 *   complet: object|null, recompte: { persones: number, families: number, fonts: number } }}
 */
export function llegeixGedcom(textGed, { arbreId, nouId, ara, anyActual, titol } = {}) {
  if (typeof nouId !== 'function') throw new TypeError('nouId');
  if (!Number.isSafeInteger(anyActual)) throw new TypeError('anyActual');
  if (typeof ara !== 'string') throw new TypeError('ara');
  const recompte = { persones: 0, families: 0, fonts: 0 };
  const avisos = [];
  let avisosPerduts = 0;
  const avisa = (codi, linia) => {
    if (avisos.length >= MAX_AVISOS) {
      avisosPerduts += 1;
      return;
    }
    avisos.push(linia === undefined ? codi : `${codi}:${linia}`);
  };
  const falla = (codi, versio = null) => ({ ok: false, errors: [codi], avisos, versio, complet: null, recompte });

  let cadena = aCadena(textGed);
  if (cadena === null) return falla('tipus');
  if (superaMidaImportacio(cadena, MIDA_MAXIMA_IMPORTACIO)) return falla('mida');
  if (cadena.charCodeAt(0) === 0xfeff) cadena = cadena.slice(1);
  if (cadena.trim() === '') return falla('buit');

  const linies = partixLinies(cadena);
  if (linies === null) return falla('massa-linies');
  const arrels = construixNodes(linies, avisa);
  const cap = arrels[0];
  if (!cap || cap.tag !== 'HEAD' || cap.xref) return falla('capcalera');

  /* Versió i joc de caràcters. */
  const vers = (fill(fill(cap, 'GEDC'), 'VERS')?.valor ?? '').trim();
  let versio = null;
  if (vers.startsWith('7.')) versio = '7.0';
  else if (vers === '5.5.1') versio = '5.5.1';
  else if (vers === '5.5') versio = '5.5';
  else if (vers === '5.5.5') {
    versio = '5.5.1';
    avisa('versio-5.5.5');
  } else avisa('versio-desconeguda');
  const joc = (fill(cap, 'CHAR')?.valor ?? '').trim().toUpperCase();
  if (versio === '7.0' && joc !== '' && joc !== 'UTF-8' && joc !== 'UTF8') return falla('codificacio-invalida', versio);
  if (joc !== '' && joc !== 'UTF-8' && joc !== 'UTF8' && joc !== 'UNICODE' && joc !== 'ASCII' && joc !== 'ANSEL') avisa('codificacio');
  if (arrels[arrels.length - 1].tag !== 'TRLR') avisa('sense-trlr');

  const valor = (node) => (node ? descodifica(node.valor, versio) : '');
  const propi = valor(fill(cap, 'SOUR')) === 'SOC_DE_POBLE';
  const comptadorVincles = propi ? fill(cap, COMPTADOR_VINCLES) : null;
  const totalVincles = comptadorVincles && RE_COMPTADOR.test(comptadorVincles.valor) ? Number(comptadorVincles.valor) : null;
  if (comptadorVincles && (totalVincles === null || totalVincles > MAX_RELACIONS)) return falla('vincles-extension', versio);

  /* Registres per xref (Map: cap clau del fitxer toca un objecte). */
  const indis = [];
  const indisPerXref = new Map();
  const fams = [];
  const sours = new Map();
  const notes = new Map();
  for (const node of arrels.slice(1)) {
    if (node.tag === 'INDI') {
      if (node.xref && indisPerXref.has(node.xref)) {
        avisa('xref-duplicat');
        continue;
      }
      indis.push(node);
      if (node.xref) indisPerXref.set(node.xref, node);
    } else if (node.tag === 'FAM') fams.push(node);
    else if (node.tag === 'SOUR' && node.xref && !sours.has(node.xref)) sours.set(node.xref, node);
    else if ((node.tag === 'NOTE' || node.tag === 'SNOTE') && node.xref && !notes.has(node.xref)) notes.set(node.xref, node);
  }

  /** Text d'una NOTE o SNOTE en línia o per punter. */
  const textNota = (node) => {
    const p = punter(node);
    if (p) return notes.has(p) ? valor(notes.get(p)) : '';
    return valor(node);
  };
  /** Estat i text de les notes en l'ordre del document. */
  const notesDe = (node, ambEstat = true) => {
    let estat = null;
    const parts = [];
    for (const nota of node.fills.filter((f) => f.tag === 'NOTE' || f.tag === 'SNOTE')) {
      const cru = textNota(nota);
      const trobat = ambEstat ? estatDeNota(cru) : { estat: null, resta: cru };
      estat ??= trobat.estat;
      if (trobat.resta.trim() !== '') parts.push(trobat.resta.trim());
    }
    return { estat, notes: parts.join('\n') };
  };

  /* La casa de la família (_SDPCASA o NICK del FAM) passa als seus membres. */
  const casaPerXref = new Map();
  for (const fam of fams) {
    const casa = valor(fill(fam, '_SDPCASA') ?? fill(fam, 'NICK')).trim();
    if (casa === '') continue;
    for (const tag of ['HUSB', 'WIFE', 'CHIL']) {
      for (const membre of fills(fam, tag)) {
        const p = punter(membre);
        if (p && !casaPerXref.has(p)) casaPerXref.set(p, casa);
      }
    }
  }

  /** Fonts d'una persona: SOUR de l'INDI i dels seus BIRT i DEAT. */
  const fontIdPerXref = new Map();
  const fontsDe = (indi) => {
    const citacions = [...fills(indi, 'SOUR'), ...fills(fill(indi, 'BIRT'), 'SOUR'), ...fills(fill(indi, 'DEAT'), 'SOUR')];
    const fonts = [];
    for (const citacio of citacions) {
      if (fonts.length >= MAX_FONTS_PER_PERSONA) {
        avisa('massa-fonts');
        break;
      }
      const p = punter(citacio);
      const registre = p && sours.has(p) ? sours.get(p) : null;
      const titol = registre
        ? valor(fill(registre, 'TITL') ?? fill(registre, 'ABBR'))
        : (p ? '' : valor(citacio));
      const tipusCru = valor(fill(registre, '_SDPTIPUS')).trim();
      const url = valor(fill(registre, '_URL') ?? fill(registre, 'WWW') ?? fill(registre, 'URL') ?? fill(citacio, 'WWW'));
      const transcripcio = valor(fill(registre, 'TEXT') ?? fill(fill(citacio, 'DATA'), 'TEXT') ?? fill(citacio, 'TEXT'));
      if (registre && !fontIdPerXref.has(p)) fontIdPerXref.set(p, nouId());
      const font = {
        id: registre ? fontIdPerXref.get(p) : nouId(),
        tipus: TIPUS_FONT.includes(tipusCru) ? tipusCru : 'altra',
        titol: text(titol, 200),
        url: urlSegura(url.trim()),
        arxiuId: propi ? valor(fill(registre, '_SDPARXIU')) || null : null,
        citacio: text(valor(fill(citacio, 'PAGE')), 500),
        transcripcio: text(transcripcio, 4000),
        consultada: propi ? valor(fill(registre, '_SDPCONSULTADA')) || null : null
      };
      /* Una citació sense cap dada no és una font. */
      if (!registre && !(font.titol || font.url || font.citacio || font.transcripcio)) continue;
      if (fonts.some((existent) => existent.id === font.id)) font.id = nouId();
      try {
        fonts.push(netejaFont(font));
      } catch {
        avisa('font-invalida', citacio.linia);
      }
    }
    return fonts;
  };

  /** Nom i cognoms: NAME 'Nom /Cognom1 Cognom2/', amb GIVN i SURN d'ajuda. */
  const nomDe = (indi) => {
    const nomNode = fill(indi, 'NAME');
    const cru = valor(nomNode).replace(/\n/g, ' ');
    const givn = valor(fill(nomNode, 'GIVN')).trim();
    const surn = valor(fill(nomNode, 'SURN')).trim();
    let nom = cru;
    let cognoms = '';
    const barra = cru.indexOf('/');
    if (barra >= 0) {
      nom = cru.slice(0, barra);
      const tanca = cru.indexOf('/', barra + 1);
      cognoms = tanca >= 0 ? cru.slice(barra + 1, tanca) : cru.slice(barra + 1);
    } else if (givn !== '' || surn !== '') {
      nom = givn;
      cognoms = surn;
    }
    nom = nom.trim();
    cognoms = cognoms.trim().split(' ').filter((t) => t !== '').join(' ');
    let cognom1 = cognoms;
    let cognom2 = '';
    if (propi && totalVincles !== null) {
      cognom1 = valor(fill(indi, '_SDPCOGNOM1'));
      cognom2 = valor(fill(indi, '_SDPCOGNOM2'));
    } else if (surn !== '' && surn !== cognoms && cognoms.startsWith(`${surn} `)) {
      cognom1 = surn;
      cognom2 = cognoms.slice(surn.length + 1);
    } else if (surn === '') {
      const espai = cognoms.indexOf(' ');
      if (espai > 0) {
        cognom1 = cognoms.slice(0, espai);
        cognom2 = cognoms.slice(espai + 1);
      }
    }
    const malnom = valor(fill(nomNode, 'NICK') ?? fill(indi, 'NICK'));
    return { nom, cognom1, cognom2, malnom };
  };

  /** Data d'un esdeveniment (BIRT o DEAT); null si no té data. */
  const dataDe = (esdeveniment) => {
    const dataNode = fill(esdeveniment, 'DATE');
    if (!dataNode) return null;
    const { data, avis } = llegeixDataGedcom(valor(dataNode), anyActual);
    if (avis) avisa(avis, dataNode.linia);
    return data;
  };

  /* Persones. */
  const arbreFinal = typeof arbreId === 'string' && arbreId !== '' ? arbreId : nouId();
  const idPerXref = new Map();
  const persones = [];
  for (const [ordre, indi] of indis.entries()) {
    if (persones.length >= MAX_PERSONES) {
      avisa('massa-persones');
      break;
    }
    try {
      const { nom, cognom1, cognom2, malnom } = nomDe(indi);
      const birt = fill(indi, 'BIRT');
      const deat = fill(indi, 'DEAT');
      const naixement = dataDe(birt);
      const defuncio = deat ? dataDe(deat) : null;
      const resn = valor(fill(indi, 'RESN')).trim().toUpperCase();
      let viva = 'desconegut';
      if (resn.split(',').some((v) => ['PRIVACY', 'CONFIDENTIAL', 'LOCKED'].includes(v.trim()))) viva = 'si';
      else if (defuncio || valor(deat).trim().toUpperCase() === 'Y' || valor(fill(deat, 'PLAC')).trim()) viva = 'no';
      const sexeCru = valor(fill(indi, 'SEX')).trim().toUpperCase();
      const { estat, notes } = notesDe(indi);
      const rang = propi ? valor(fill(indi, '_SDPORDRE')) : '';
      const ordreSosa = RE_COMPTADOR.test(rang) ? Number(rang) : ordre;
      const fonts = fontsDe(indi);
      const camps = {
        id: nouId(),
        arbreId: arbreFinal,
        ara,
        nom: text(nom, 80),
        cognom1: text(cognom1, 80),
        cognom2: text(cognom2, 80),
        malnom: text(malnom, 80),
        casa: text(valor(fill(indi, '_SDPCASA')) || (indi.xref ? casaPerXref.get(indi.xref) ?? '' : ''), 80),
        lloc: text(valor(fill(birt, 'PLAC')), 120),
        sexe: sexeCru === 'M' || sexeCru === 'F' ? sexeCru : 'U',
        viva,
        ofici: text(valor(fill(indi, 'OCCU')), 80),
        generacio: null,
        estat: estat ?? 'falta-confirmar',
        fonts,
        notes: text(notes, 2000),
        ordreSosa,
        origen: 'gedcom'
      };
      if (naixement) camps.naixement = naixement;
      camps.defuncio = defuncio;
      const persona = creaPersona(camps, { anyActual });
      persones.push(persona);
      recompte.fonts += persona.fonts.length;
      if (indi.xref) idPerXref.set(indi.xref, persona.id);
    } catch {
      avisa('persona-invalida', indi.linia);
    }
  }

  /* Relacions: només FAM i ASSO (mai cognoms). */
  const relacions = [];
  const vistes = new Set();
  const afigRelacio = (tipus, de, a, evidencia, { estat, notes, fontIds = [] } = {}) => {
    if (!de || !a || de === a) return;
    const simetrica = tipus === 'parella' || tipus === 'germa';
    const clau = simetrica ? `${tipus}|${[de, a].sort().join('|')}` : `${tipus}|${de}|${a}`;
    if (totalVincles === null && vistes.has(clau)) return;
    if (relacions.length >= MAX_RELACIONS) {
      avisa('massa-relacions');
      return;
    }
    vistes.add(clau);
    try {
      const base = creaRelacio({ id: nouId(), arbreId: arbreFinal, tipus, de, a, evidencia, notes: text(notes, 1000), fontIds, ara });
      relacions.push(estat ? netejaRelacio({ ...base, estat }) : base);
    } catch {
      avisa('relacio-invalida');
    }
  };
  const idDe = (node) => {
    const p = punter(node);
    if (!p || p === 'VOID') return null;
    if (!idPerXref.has(p)) {
      avisa('referencia-trencada');
      return null;
    }
    return idPerXref.get(p);
  };

  recompte.families = fams.length;
  if (totalVincles === null) {
    for (const fam of fams) {
      const dades = notesDe(fam);
      const evidencia = evidenciaDe(dades.estat, fills(fam, 'SOUR').length > 0);
      const husb = idDe(fill(fam, 'HUSB'));
      const wife = idDe(fill(fam, 'WIFE'));
      if (husb && wife) afigRelacio('parella', husb, wife, evidencia, dades);
      for (const chil of fills(fam, 'CHIL')) {
        const fillId = idDe(chil);
        if (!fillId) continue;
        if (husb) afigRelacio('progenitor', husb, fillId, evidencia, dades);
        if (wife) afigRelacio('progenitor', wife, fillId, evidencia, dades);
      }
    }

    for (const indi of indis) {
      const subjecte = idPerXref.get(indi.xref);
      if (!subjecte) continue;
      for (const asso of fills(indi, 'ASSO')) {
        const altra = idDe(asso);
        if (!altra) continue;
        const role = valor(fill(asso, 'ROLE')).trim().toUpperCase();
        let tipus = null;
        if (role === 'GODP') tipus = 'padri';
        else if (role === 'WITN') tipus = 'testimoni';
        else if (role === 'NGHBR') tipus = 'vei';
        else if (role !== '') tipus = tipusDeRol(valor(fill(fill(asso, 'ROLE'), 'PHRASE')));
        else tipus = tipusDeRol(valor(fill(asso, 'RELA')));
        if (!tipus) {
          avisa('asso-desconegut');
          continue;
        }
        const dades = notesDe(asso);
        afigRelacio(tipus, altra, subjecte, evidenciaDe(dades.estat, fills(asso, 'SOUR').length > 0), dades);
      }
    }
  } else {
    const teFont = new Set(persones.flatMap((persona) => persona.fonts.map((font) => font.id)));
    for (const indi of indis) {
      const subjecte = idPerXref.get(indi.xref);
      for (const vincle of fills(indi, ETIQUETA_VINCLE)) {
        const altra = idDe(vincle);
        const tipus = valor(fill(vincle, 'TYPE'));
        const estat = valor(fill(vincle, '_SDPESTAT'));
        const flags = valor(fill(vincle, '_SDPEVIDENCIA'));
        const fontIds = fills(vincle, 'SOUR').map((f) => fontIdPerXref.get(punter(f)));
        if (!subjecte || !altra || !TIPUS_RELACIO_TOTS.includes(tipus) || !ESTATS.includes(estat) || !/^[01]{3}$/.test(flags)
          || fontIds.length > MAX_FONTS_PER_PERSONA || fontIds.some((id) => !teFont.has(id))) return falla('vincles-extension', versio);
        const evidencia = Object.fromEntries(ETIQUETES_VINCLE.map((clau, i) => [clau, flags[i] === '1']));
        afigRelacio(tipus, altra, subjecte, evidencia, { estat, notes: notesDe(vincle, false).notes, fontIds });
      }
    }
    if (relacions.length !== totalVincles) return falla('vincles-extension', versio);
  }

  if (persones.length === 0) avisa('sense-persones');
  if (avisosPerduts > 0) avisos.push(`mes-avisos:${avisosPerduts}`);

  let arbre;
  try {
    const titolNet = text(aCadena(titol) ?? '', 80) || 'GEDCOM';
    const arrel = propi ? fill(cap, '_SDPARREL') : null;
    const arrelId = arrel ? idPerXref.get(punter(arrel)) ?? null : persones[0]?.id ?? null;
    if (arrel && arrel.valor !== 'NONE' && !arrelId) return falla('referencia-trencada', versio);
    arbre = netejaArbre({ ...creaArbre({ id: arbreFinal, titol: titolNet, ara }), arrelId });
  } catch {
    return falla('arbre', versio);
  }
  recompte.persones = persones.length;
  return {
    ok: true,
    errors: [],
    avisos,
    versio,
    complet: { arbre, persones, relacions, entrevista: null },
    recompte
  };
}
