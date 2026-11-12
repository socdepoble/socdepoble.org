/**
 * escriuGedcom.js — escriptura de l'arbre en GEDCOM 7.0 o 5.5.1.
 *
 * «Prepara, no publica»: torna el text perquè la interfície l'ensenye a la
 * persona abans de descarregar-lo; ací no hi ha cap descàrrega ni xarxa.
 *
 * Privacitat: primer passa per filtraVius en mode 'anonimitza'. Una persona
 * viva (sense incloureVius) només porta un NAME genèric, RESN i els enllaços
 * de família; cap nom, data, lloc, nota ni font.
 *
 * Fidelitat: cada persona porta la seua NOTE amb l'etiqueta d'estat
 * ([CONFIRMAT], [APROXIMAT], [FALTA CONFIRMAR], [CONTRADICCIÓ]), cada FAM
 * l'estat més feble dels seus vincles i cada ASSO (padrins, testimonis,
 * veïns i germans) el del seu, de manera que llegeixGedcom ho recupera.
 * Cap valor per defecte inventat: el que no consta no s'escriu.
 *
 * Desviacions conscients de l'estàndard, documentades:
 *   · _URL conserva l'adreça de SOUR, fora del conjunt de camps estàndard;
 *   · les etiquetes _SDP conserven els cognoms, l'arrel i l'evidència de cada
 *     vincle, que l'estructura FAM estàndard agrupa i simplifica.
 */

import { MIDA_MAXIMA_IMPORTACIO } from '../nucli/segur.js';
import { ETIQUETES_ESTAT } from '../nucli/constants.js';
import { comparaOrdreSosa } from '../nucli/sosa.js';
import { preparaIntercanvi } from './privacitatIntercanvi.js';
import { escriuDataGedcom, MESOS_GEDCOM } from '../nucli/dates.js';
import { COMPTADOR_VINCLES, ETIQUETA_VINCLE, ETIQUETES_VINCLE, MAX_LINIES, ROL_FAN, estatMesFeble, senseControl, superaMidaImportacio } from './comu.js';

export const VERSIONS_ESCRIPTURA = Object.freeze(['7.0', '5.5.1']);

/** Llargada màxima d'una línia en 5.5.1. */
const MAX_LINIA_551 = 255;

const RE_ISO_DATA = /^(\d{4})-(\d{2})-(\d{2})/;

/** Data de capçalera ('D MON AAAA') a partir d'una ISO; '' si no és vàlida. */
function dataCapcalera(ara) {
  const m = RE_ISO_DATA.exec(typeof ara === 'string' ? ara : '');
  if (!m) return '';
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return '';
  return `${dia} ${MESOS_GEDCOM[mes - 1]} ${m[1]}`;
}

/** DataGen a valor de DATE; '' per a una data desconeguda o absent. */
export const dataGedcom = escriuDataGedcom;

/** Un valor d'una sola línia (sense salts ni barres en el NAME). */
const unaLinia = (valor) => senseControl(valor ?? '').split('\n').join(' ').split('\t').join(' ').trim();
const perNom = (valor) => unaLinia(valor).split('/').join(' ').trim();

function bytesUtf8(codi) {
  if (codi <= 0x7f) return 1;
  if (codi <= 0x7ff) return 2;
  return codi <= 0xffff ? 3 : 4;
}

/** CONC no parteix caràcters multibyte i respecta 255 octets per interoperabilitat. */
function trosseja(valor, max) {
  const trossos = [];
  let resta = valor;
  for (;;) {
    let mida = 0;
    let tall = 0;
    let tallNet = 0;
    for (const car of resta) {
      mida += bytesUtf8(car.codePointAt(0));
      if (mida > max) break;
      tall += car.length;
      const seguent = resta[tall];
      if (car !== ' ' && seguent !== ' ' && !(car === '@' && seguent === '@')) tallNet = tall;
    }
    if (tall === resta.length) {
      trossos.push(resta);
      return trossos;
    }
    const particio = tallNet > 0 && tall - tallNet < 40 ? tallNet : tall;
    trossos.push(resta.slice(0, particio));
    resta = resta.slice(particio);
  }
}

/** Ordre estable: l'arrel primer (és @I1@) i la resta per id. */
function ordenaPersones(persones, arrelId) {
  return [...persones].sort((x, y) => {
    if (x.id === arrelId) return -1;
    if (y.id === arrelId) return 1;
    return comparaOrdreSosa(x, y);
  });
}

/**
 * Escriu un ArbreComplet en GEDCOM.
 * @returns {{ text: string, ocultes: number, avisos: string[] }}
 */
export function escriuGedcom(complet, { versio = '7.0', incloureVius = false, anyActual, ara, etiquetaViva = 'Persona viva' } = {}) {
  if (!VERSIONS_ESCRIPTURA.includes(versio)) throw new TypeError('versio');
  if (!complet || !Array.isArray(complet.persones) || !Array.isArray(complet.relacions)) throw new TypeError('complet');
  const { complet: filtrat, ocultes } = preparaIntercanvi(complet, { incloureVius, anyActual });
  const es7 = versio === '7.0';
  const avisos = [];
  const linies = [];

  const escapa = (peca) => (es7 ? (peca.startsWith('@') ? `@${peca}` : peca) : peca.split('@').join('@@'));

  /** Afig una línia amb valor de text: CONT per als salts i, en 5.5.1, CONC per a les línies llargues. */
  const afig = (nivell, tag, valor = '', xref = null) => {
    const prefix = `${nivell}${xref ? ` @${xref}@` : ''} ${tag}`;
    const peces = senseControl(valor ?? '').split('\n');
    const maxim = MAX_LINIA_551 - Math.max(prefix.length, `${nivell + 1} CONC`.length) - 1;
    peces.forEach((peca, index) => {
      const escapada = escapa(peca);
      const trossos = es7 ? [escapada] : trosseja(escapada, maxim);
      trossos.forEach((tros, t) => {
        const cap = index === 0 && t === 0 ? prefix : `${nivell + 1} ${t === 0 ? 'CONT' : 'CONC'}`;
        linies.push(tros === '' ? cap : `${cap} ${tros}`);
      });
    });
  };
  const afigPunter = (nivell, tag, xref) => linies.push(`${nivell} ${tag} @${xref}@`);

  /* Persones i xrefs. */
  const persones = ordenaPersones(filtrat.persones, filtrat.arbre?.arrelId ?? null);
  const rangSosa = new Map([...persones].sort(comparaOrdreSosa).map((p, index) => [p.id, index]));
  const perId = new Map(persones.map((p) => [p.id, p]));
  const xrefDe = new Map(persones.map((p, i) => [p.id, `I${i + 1}`]));
  const ordre = new Map(persones.map((p, i) => [p.id, i]));

  /* Famílies: una per parella de progenitors (o progenitor sol) i per parella. */
  const families = new Map();
  const familia = (membres) => {
    const ordenats = [...membres].sort();
    const clau = ordenats.join('|');
    if (!families.has(clau)) families.set(clau, { clau, membres: ordenats, fills: [], estats: [] });
    return families.get(clau);
  };
  const progenitors = new Map();
  const fan = new Map();
  const vinclesPerPersona = new Map();
  const relacions = [...filtrat.relacions].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const afigLlista = (mapa, clau, valor) => {
    if (!mapa.has(clau)) mapa.set(clau, []);
    mapa.get(clau).push(valor);
  };
  for (const relacio of relacions) {
    if (!perId.has(relacio.de) || !perId.has(relacio.a)) {
      avisos.push('relacio-sense-persona');
      continue;
    }
    afigLlista(vinclesPerPersona, relacio.a, relacio);
    if (relacio.tipus === 'progenitor') {
      afigLlista(progenitors, relacio.a, relacio);
    } else if (relacio.tipus === 'parella') {
      familia([relacio.de, relacio.a]).estats.push(relacio.estat);
    } else if (Object.hasOwn(ROL_FAN, relacio.tipus)) {
      afigLlista(fan, relacio.a, relacio);
    }
  }
  for (const [fillId, rels] of progenitors) {
    const unics = [...new Set(rels.map((r) => r.de))].sort();
    if (unics.length > 2) avisos.push('mes-de-dos-progenitors');
    for (const membres of [unics.slice(0, 2), ...unics.slice(2).map((id) => [id])]) {
      const fam = familia(membres);
      fam.fills.push(fillId);
      for (const r of rels) if (membres.includes(r.de)) fam.estats.push(r.estat);
    }
  }
  const llistaFamilies = [...families.values()].sort((x, y) => (x.clau < y.clau ? -1 : x.clau > y.clau ? 1 : 0));
  const famcDe = new Map();
  const famsDe = new Map();
  llistaFamilies.forEach((fam, i) => {
    fam.xref = `F${i + 1}`;
    fam.fills.sort((x, y) => ordre.get(x) - ordre.get(y));
    for (const m of fam.membres) afigLlista(famsDe, m, fam.xref);
    for (const f of fam.fills) afigLlista(famcDe, f, fam.xref);
    /* HUSB i WIFE: la dona a WIFE; el sexe desconegut va a HUSB amb un avís. */
    const [x, y] = fam.membres.map((id) => perId.get(id));
    let husb = null;
    let wife = null;
    if (!y) {
      if (x.sexe === 'F') wife = x;
      else husb = x;
    } else if (x.sexe === 'F' && y.sexe !== 'F') {
      husb = y;
      wife = x;
    } else {
      husb = x;
      wife = y;
    }
    if (husb && husb.sexe === 'U') avisos.push('sexe-desconegut-fam');
    fam.husb = husb;
    fam.wife = wife;
  });

  /* Fonts: comparteixen xref quan les fitxes comparteixen la font. */
  const sours = new Map();
  for (const persona of persones) {
    for (const font of persona.fonts ?? []) {
      if (!sours.has(font.id)) sours.set(font.id, { xref: `S${sours.size + 1}`, font });
    }
  }

  /* Capçalera. */
  afig(0, 'HEAD');
  afig(1, 'GEDC');
  afig(2, 'VERS', versio);
  if (!es7) {
    afig(2, 'FORM', 'LINEAGE-LINKED');
    afig(1, 'CHAR', 'UTF-8');
  }
  afig(1, 'SOUR', 'SOC_DE_POBLE');
  afig(2, 'NAME', 'Arbre Genealògic');
  const dataCap = dataCapcalera(ara);
  if (dataCap) afig(1, 'DATE', dataCap);
  const arrel = xrefDe.get(filtrat.arbre?.arrelId);
  if (arrel) afigPunter(1, '_SDPARREL', arrel);
  else afig(1, '_SDPARREL', 'NONE');
  afig(1, COMPTADOR_VINCLES, String([...vinclesPerPersona.values()].reduce((total, grup) => total + grup.length, 0)));
  if (!es7) {
    afigPunter(1, 'SUBM', 'U1');
    afig(0, 'SUBM', '', 'U1');
    afig(1, 'NAME', 'Sóc de Poble');
  }

  /* Individus. */
  const resn = es7 ? 'PRIVACY' : 'privacy';
  for (const persona of persones) {
    afig(0, 'INDI', '', xrefDe.get(persona.id));
    if (persona.privada === true) {
      afig(1, 'NAME', `${perNom(etiquetaViva) || 'Persona viva'} //`);
      afig(1, 'RESN', resn);
    } else {
      const nom = perNom(persona.nom);
      const cognom1 = perNom(persona.cognom1);
      const cognoms = [cognom1, perNom(persona.cognom2)].filter((c) => c !== '').join(' ');
      afig(1, 'NAME', `${nom}${nom ? ' ' : ''}/${cognoms}/`);
      if (nom) afig(2, 'GIVN', nom);
      if (cognoms) afig(2, 'SURN', cognoms);
      const malnom = unaLinia(persona.malnom);
      if (malnom) afig(2, 'NICK', malnom);
      if (cognom1) afig(1, '_SDPCOGNOM1', cognom1);
      if (persona.cognom2) afig(1, '_SDPCOGNOM2', perNom(persona.cognom2));
      afig(1, 'SEX', persona.sexe === 'M' || persona.sexe === 'F' ? persona.sexe : 'U');
      if (persona.viva === 'si') afig(1, 'RESN', resn);
      const dataNaix = dataGedcom(persona.naixement);
      const lloc = unaLinia(persona.lloc);
      if (dataNaix || lloc) {
        afig(1, 'BIRT');
        if (dataNaix) afig(2, 'DATE', dataNaix);
        if (lloc) afig(2, 'PLAC', lloc);
      }
      const dataDef = dataGedcom(persona.defuncio);
      if (dataDef) {
        afig(1, 'DEAT');
        afig(2, 'DATE', dataDef);
      } else if (persona.viva === 'no') {
        /* Difunta sense data coneguda: l'esdeveniment consta, la data no. */
        afig(1, 'DEAT', 'Y');
      }
      const ofici = unaLinia(persona.ofici);
      if (ofici) afig(1, 'OCCU', ofici);
      const casa = unaLinia(persona.casa);
      if (casa) afig(1, '_SDPCASA', casa);
      const etiqueta = ETIQUETES_ESTAT[persona.estat] ?? ETIQUETES_ESTAT['falta-confirmar'];
      const notes = senseControl(persona.notes ?? '').trim();
      afig(1, 'NOTE', notes ? `${etiqueta} ${notes}` : etiqueta);
      for (const font of Array.isArray(persona.fonts) ? persona.fonts : []) {
        afigPunter(1, 'SOUR', sours.get(font.id).xref);
        if (font.citacio) afig(2, 'PAGE', font.citacio);
      }
    }
    for (const relacio of fan.get(persona.id) ?? []) {
      const rol = ROL_FAN[relacio.tipus];
      afigPunter(1, 'ASSO', xrefDe.get(relacio.de));
      if (es7) {
        afig(2, 'ROLE', rol.role);
        if (rol.role === 'OTHER') afig(3, 'PHRASE', rol.rela);
      } else {
        afig(2, 'RELA', rol.rela);
      }
      const estat = ETIQUETES_ESTAT[relacio.estat] ?? ETIQUETES_ESTAT['falta-confirmar'];
      afig(2, 'NOTE', relacio.notes ? `${estat} ${relacio.notes}` : estat);
    }
    for (const xref of famcDe.get(persona.id) ?? []) afigPunter(1, 'FAMC', xref);
    for (const xref of famsDe.get(persona.id) ?? []) afigPunter(1, 'FAMS', xref);
    afig(1, '_SDPORDRE', String(rangSosa.get(persona.id)));

    // El FAM estàndard agrupa els vincles i no en conserva l'estat individual.
    for (const relacio of vinclesPerPersona.get(persona.id) ?? []) {
      afigPunter(1, ETIQUETA_VINCLE, xrefDe.get(relacio.de));
      afig(2, 'TYPE', relacio.tipus);
      afig(2, '_SDPESTAT', relacio.estat);
      const flags = ETIQUETES_VINCLE.map((clau) => relacio.evidencia?.[clau] ? '1' : '0').join('');
      afig(2, '_SDPEVIDENCIA', flags);
      if (relacio.notes) afig(2, 'NOTE', relacio.notes);
      for (const id of relacio.fontIds ?? []) {
        if (sours.has(id)) afigPunter(2, 'SOUR', sours.get(id).xref);
      }
    }
  }

  /* Famílies. */
  for (const fam of llistaFamilies) {
    afig(0, 'FAM', '', fam.xref);
    if (fam.husb) afigPunter(1, 'HUSB', xrefDe.get(fam.husb.id));
    if (fam.wife) afigPunter(1, 'WIFE', xrefDe.get(fam.wife.id));
    for (const f of fam.fills) afigPunter(1, 'CHIL', xrefDe.get(f));
    const estat = estatMesFeble(fam.estats);
    if (estat) afig(1, 'NOTE', ETIQUETES_ESTAT[estat]);
  }

  /* Fonts. */
  for (const { xref, font } of sours.values()) {
    afig(0, 'SOUR', '', xref);
    const titol = font.titol;
    if (titol) afig(1, 'TITL', titol);
    const transcripcio = senseControl(font.transcripcio ?? '').trim();
    if (transcripcio) afig(1, 'TEXT', transcripcio);
    const url = unaLinia(font.url);
    if (url) afig(1, '_URL', url);
    if (font.tipus && font.tipus !== 'altra') afig(1, '_SDPTIPUS', unaLinia(font.tipus));
    if (font.arxiuId) afig(1, '_SDPARXIU', font.arxiuId);
    if (font.consultada) afig(1, '_SDPCONSULTADA', font.consultada);
  }

  afig(0, 'TRLR');
  const text = `${linies.join('\n')}\n`;
  if (linies.length > MAX_LINIES || superaMidaImportacio(text, MIDA_MAXIMA_IMPORTACIO)) {
    throw Object.assign(new TypeError('Mida'), { codiLectura: 'mida' });
  }
  return { text, ocultes, avisos: [...new Set(avisos)] };
}
