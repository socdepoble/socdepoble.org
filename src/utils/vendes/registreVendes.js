/**
 * Vendes · utils/vendes/registreVendes.js — el contracte neutre de vendes
 * sdp.vendes.v1: el que una app que ven (hui, el Bar) entrega a la Gestoria
 * de Poble (ordre del Mestre, 261006: el model de productes i vendes ha de
 * ser fàcil de connectar a la Gestoria, que alterna perfils i és local).
 *
 *   registre {
 *     esquema   'sdp.vendes.v1'
 *     moneda    'EUR'
 *     titular   { tipus: 'persona' | 'entitat', id, alies, ambit } | null
 *               El posa qui crida (la Gestoria, que alterna perfils): el TPV
 *               no decidix el perfil. L'id és opac amb el mateix patró que el
 *               titular de la Gestoria (sdp.gestoria.titular.v1) i l'àlies és
 *               el text que tria la persona, d'1 a 80 caràcters. L'àmbit és
 *               el de la Gestoria i va lligat al tipus: una persona ven com a
 *               'ACTIVITAT' i una entitat, com a 'ENTITAT'. MAI 'LLAR': res de
 *               la llar entra en un registre de l'activitat (frontera de
 *               gestoria/identitat/nucli/titular.js), i el registre ho diu.
 *     origen    { app: 'bar', establiment: slug }
 *     vendes    [{
 *                 id, numero (≥ 1), tipus: 'venda' | 'devolucio',
 *                 data: { a, m, d }, hora: 'HH:MM',
 *                 canal: 'barra' | 'taula' | 'emportar',
 *                 totalCents (≥ 0),
 *                 perIva: [{ ivaPercent, totalCents }],
 *                 pagaments: [{ metode: 'efectiu' | 'targeta' | 'altre', importCents }],
 *                 tiquetOrigenId   només, i sempre, en una devolució
 *               }]
 *   }
 *
 * PRINCIPI 4 DE LA GESTORIA (gestoria/impostos/nucli/impostos.js): tota regla
 * de càlcul d'impostos viu només dins de la Gestoria, i el TPV només exporta
 * dades. `perIva` porta, per cada tipus d'IVA, el total venut amb l'IVA
 * inclòs: cap base ni cap quota, que són el resultat d'una regla i les
 * calcula la Gestoria amb la seua. El contracte no recalcula res, no coneix
 * cap tipus vigent ni parla de cap model de declaració. Només comprova que
 * les xifres quadren entre elles: el desglossament i els pagaments sumen el
 * total de la venda.
 *
 * DEVOLUCIONS: imports en positiu i tipus 'devolucio', enllaçada al tiquet
 * de venda amb `tiquetOrigenId`. Qui consumix el registre (la Gestoria)
 * resta: cap signe amagat dins dels imports.
 *
 * DATA I HORA: el dia del calendari { a, m, d } i l'hora 'HH:MM' LOCALS de
 * l'establiment que ven, tal com les dona qui fa el registre (l'adaptador del
 * Bar les trau de tancatA en la zona IANA de l'establiment, no en la del
 * dispositiu que exporta). Cap instant ni zona: com a la Gestoria
 * (gestoria/nucli/dates.js), una venda és d'un dia del calendari.
 *
 * LLISTA BLANCA: cap clau desconeguda, a cap nivell. Cap nom de persona ni
 * cap text lliure de la caixa: ni qui atén (atesPer), ni qui obri el torn
 * (obertPer), ni les notes, ni el motiu d'una devolució; tampoc la taula, les
 * línies, el lliurat ni el canvi de l'efectiu. creaRegistreVendes en torna una
 * còpia nova congelada en profunditat.
 *
 * FRONTERA: src/utils no importa res de fora (apps/plataforma/fronteres.test.js).
 * El patró de l'id opac del titular i les formes d'identificador personal de
 * la Gestoria (gestoria/identitat/nucli/guardes.js) es reproduïxen ací, i la
 * prova les contrasta amb les originals perquè no se'n separen. Els ids de
 * les vendes són els del Bar (nucli/comu.js, esId).
 *
 * PENDENT (relleu del 261006): cap pantalla no l'usa. El consumidor serà la
 * Gestoria de Poble (pas següent), que triarà el titular i llegirà el
 * registre; hui només el produïx l'adaptador del Bar (apps/bar/nucli/vendes.js)
 * i les proves en validen el contracte, no cap flux. Quan es puga tocar la
 * Gestoria, guardes.js i este mòdul haurien de compartir les formes vetades
 * des d'un sol lloc.
 *
 * JS pur: cap React, cap xarxa, cap emmagatzematge, cap rellotge ni atzar, cap import.
 */

export const ESQUEMA_VENDES = 'sdp.vendes.v1';
export const MONEDA_VENDES = 'EUR';
export const TIPUS_TITULAR = Object.freeze(['persona', 'entitat']);
export const APPS_ORIGEN = Object.freeze(['bar']);
export const TIPUS_VENDA = Object.freeze(['venda', 'devolucio']);
export const CANALS_VENDA = Object.freeze(['barra', 'taula', 'emportar']);
export const METODES_PAGAMENT = Object.freeze(['efectiu', 'targeta', 'altre']);
export const MAX_ALIES = 80;
/* L'àmbit de la Gestoria que correspon a cada tipus de titular que ven. La llar no ven. */
export const AMBIT_DEL_TIPUS = Object.freeze({ persona: 'ACTIVITAT', entitat: 'ENTITAT' });

const CLAUS_REGISTRE = Object.freeze(['esquema', 'moneda', 'titular', 'origen', 'vendes']);
const CLAUS_TITULAR = Object.freeze(['tipus', 'id', 'alies', 'ambit']);
const CLAUS_ORIGEN = Object.freeze(['app', 'establiment']);
const CLAUS_VENDA = Object.freeze(['id', 'numero', 'tipus', 'data', 'hora', 'canal', 'totalCents', 'perIva', 'pagaments', 'tiquetOrigenId']);
const CLAUS_DATA = Object.freeze(['a', 'm', 'd']);
const CLAUS_IVA = Object.freeze(['ivaPercent', 'totalCents']);
const CLAUS_PAGAMENT = Object.freeze(['metode', 'importCents']);
/* Claus de la caixa que porten una persona o un text seu: el missatge ho diu. */
const CLAUS_DE_PERSONA = Object.freeze(['atesPer', 'obertPer', 'tancatPer', 'per', 'nota', 'notes', 'motiu']);

/* Els ids de les vendes: els del Bar (nucli/comu.js, esId). */
const PATRO_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
/* L'id del titular: el de la Gestoria (guardes.js, ID_OPAC). */
const PATRO_ID_TITULAR = /^[a-z][a-z0-9_-]{3,95}$/;
const PATRO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG = 64;
const PATRO_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
/* Caràcters de control (inclosos els salts de línia): com CONTROL de guardes.js. */
const CONTROL = /[\u0000-\u001F\u007F]/;

/* Les formes d'identificador personal que cap text del titular pot portar:
   còpia literal de FORMES_VETADES de gestoria/identitat/nucli/guardes.js (la
   prova en vigila la paritat). Fallen cap al costat segur: un text que ho
   sembla es refusa, encara que siga un fals positiu. */
const FORMES_VETADES = Object.freeze([
  ['DNI', /(?:^|\D)\d{1,2}\.?\d{3}\.?\d{3}[-\s.]?[A-HJ-NP-TV-Z]/i],
  ['NIE', /[XYZ][-\s.]?\d{7}[-\s.]?[A-HJ-NP-TV-Z]/i],
  ['NIF_ENTITAT', /[ABCDEFGHJNPQRSUVW][-\s.]?\d{7}[-\s.]?[0-9A-J](?!\d)/i],
  ['IBAN', /[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){3,7}(?:[\s-]?[A-Z0-9]{1,3})?/i],
  ['COMPTE', /(?:^|\D)\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}(?!\d)/],
  ['AFILIACIO', /(?:^|\D)\d{2}[\s/-]?\d{8}[\s/-]?\d{2}(?!\d)/],
  ['TARGETA', /(?:^|\D)\d(?:[\s-]?\d){12,18}(?!\d)/],
  ['TELEFON', /(?:^|\D)(?:\+?\d{2}[\s.-]?)?[6-9](?:[\s.-]?\d){8}(?!\d)/],
  ['CORREU', /[^\s@]+@[^\s@]+\.[a-z]{2,}/i]
]);

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esCentsNoNegatius = (valor) => Number.isSafeInteger(valor) && valor >= 0;
const esIdVenda = (valor) => typeof valor === 'string' && PATRO_ID.test(valor);
const esSlug = (valor) => typeof valor === 'string' && valor.length <= MAX_SLUG && PATRO_SLUG.test(valor);

/* Les formes d'identificador personal d'un text ([] si cap); «_» compta com a separador. */
function identificadorsDe(text) {
  if (typeof text !== 'string' || text === '') return [];
  const pla = text.replace(/_/g, ' ');
  return FORMES_VETADES.filter(([, patro]) => patro.test(pla)).map(([forma]) => forma);
}

/* Cert si el valor és un id opac de titular, com esIdOpac de guardes.js. */
const esIdTitular = (valor) => typeof valor === 'string' && PATRO_ID_TITULAR.test(valor) && identificadorsDe(valor).length === 0;

/** Any de traspàs del calendari gregorià. */
const esBixest = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

/** Dies del mes m (1-12) de l'any a. */
function diesDelMes(a, m) {
  if (m === 2) return esBixest(a) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/**
 * Cert si el valor és un dia { a, m, d } que existix al calendari (any de
 * quatre xifres), com esDataValida de gestoria/nucli/dates.js.
 * @returns {boolean}
 */
export function esDataValida(valor) {
  if (!esObjecte(valor)) return false;
  const { a, m, d } = valor;
  return Number.isInteger(a) && a >= 1000 && a <= 9999 && Number.isInteger(m) && m >= 1 && m <= 12
    && Number.isInteger(d) && d >= 1 && d <= diesDelMes(a, m);
}

/* Congela un objecte i tot el que penja d'ell. Torna el mateix valor. */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const fill of Object.values(valor)) congela(fill);
  }
  return valor;
}

/* Un error amb codi estable i, a `detalls`, la llista d'errors de validació. */
function errorAmbCodi(codi, missatge, detalls) {
  return Object.assign(new Error(missatge), { codi, detalls });
}

/* Afig un error per cada clau que el model no coneix: res s'hi cola d'amagat. */
function comprovaClaus(dades, permeses, camp, errors) {
  for (const clau of Object.keys(dades)) {
    if (permeses.includes(clau)) continue;
    const persona = CLAUS_DE_PERSONA.includes(clau) ? ': cap nom de persona ni cap text de la caixa va al registre' : '';
    errors.push({ codi: 'CAMP_DESCONEGUT', camp: `${camp}.${clau}`, missatge: `${camp} no admet el camp «${clau}»${persona}.` });
  }
}

/* L'àlies del titular, amb les mateixes regles que comprovaText de guardes.js (obligatori, 80 caràcters). */
function comprovaAlies(valor, camp, errors) {
  if (valor === undefined || valor === null || valor === '') {
    errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: `Falta ${camp}.` });
    return;
  }
  if (typeof valor !== 'string') {
    errors.push({ codi: 'TEXT_INVALID', camp, missatge: `${camp} ha de ser un text.` });
    return;
  }
  const net = valor.trim();
  if (net === '') errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: `Falta ${camp}.` });
  if (net.length > MAX_ALIES) errors.push({ codi: 'TEXT_MASSA_LLARG', camp, missatge: `${camp} passa de ${MAX_ALIES} caràcters.` });
  if (CONTROL.test(net)) errors.push({ codi: 'TEXT_INVALID', camp, missatge: `${camp} porta salts de línia o caràcters de control.` });
  const formes = identificadorsDe(net);
  if (formes.length) {
    errors.push({ codi: 'IDENTIFICADOR_PERSONAL', camp, missatge: `${camp} sembla portar un identificador personal (${formes.join(', ')}): no va mai en este registre.` });
  }
}

function validaTitular(titular, errors) {
  const camp = 'registre.titular';
  if (titular === undefined) {
    errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: 'Falta el titular: un objecte { tipus, id, alies, ambit }, o null si no n’hi ha.' });
    return;
  }
  if (titular === null) return;
  if (!esObjecte(titular)) {
    errors.push({ codi: 'TITULAR_INVALID', camp, missatge: 'El titular és un objecte { tipus, id, alies, ambit }, o null.' });
    return;
  }
  comprovaClaus(titular, CLAUS_TITULAR, camp, errors);
  const tipusValid = TIPUS_TITULAR.includes(titular.tipus);
  if (!tipusValid) {
    errors.push({ codi: 'TIPUS_INVALID', camp: `${camp}.tipus`, missatge: `El tipus de titular és ${TIPUS_TITULAR.join(' o ')}.` });
  }
  if (!esIdTitular(titular.id)) {
    errors.push({ codi: 'ID_INVALID', camp: `${camp}.id`, missatge: `${camp}.id ha de ser un id opac (minúscules, xifres, «_» i «-»), sense cap dada personal.` });
  }
  comprovaAlies(titular.alies, `${camp}.alies`, errors);
  if (titular.ambit === undefined || titular.ambit === null) {
    errors.push({ codi: 'CAMP_OBLIGATORI', camp: `${camp}.ambit`, missatge: 'Falta l’àmbit del titular: ACTIVITAT per a una persona, ENTITAT per a una entitat.' });
  } else if (titular.ambit === 'LLAR') {
    errors.push({ codi: 'AMBIT_INVALID', camp: `${camp}.ambit`, missatge: 'La llar no ven: les vendes són d’una activitat o d’una entitat, mai de la llar.' });
  } else if (tipusValid && titular.ambit !== AMBIT_DEL_TIPUS[titular.tipus]) {
    errors.push({ codi: 'AMBIT_INVALID', camp: `${camp}.ambit`, missatge: `Una ${titular.tipus} ven amb l’àmbit ${AMBIT_DEL_TIPUS[titular.tipus]}.` });
  } else if (!tipusValid && !Object.values(AMBIT_DEL_TIPUS).includes(titular.ambit)) {
    errors.push({ codi: 'AMBIT_INVALID', camp: `${camp}.ambit`, missatge: 'L’àmbit del titular és ACTIVITAT o ENTITAT.' });
  }
}

function validaOrigen(origen, errors) {
  const camp = 'registre.origen';
  if (!esObjecte(origen)) {
    errors.push({ codi: 'ORIGEN_INVALID', camp, missatge: 'L’origen és un objecte { app, establiment }.' });
    return;
  }
  comprovaClaus(origen, CLAUS_ORIGEN, camp, errors);
  if (!APPS_ORIGEN.includes(origen.app)) {
    errors.push({ codi: 'APP_INVALIDA', camp: `${camp}.app`, missatge: `L’app d’origen és una de: ${APPS_ORIGEN.join(', ')}.` });
  }
  if (!esSlug(origen.establiment)) {
    errors.push({ codi: 'SLUG_INVALID', camp: `${camp}.establiment`, missatge: 'L’establiment és un slug: minúscules, xifres i guions solts.' });
  }
}

function validaData(data, camp, errors) {
  if (!esObjecte(data)) {
    errors.push({ codi: 'DATA_INVALIDA', camp, missatge: `${camp} ha de ser un dia { a, m, d } que existisca.` });
    return;
  }
  comprovaClaus(data, CLAUS_DATA, camp, errors);
  if (!esDataValida(data)) errors.push({ codi: 'DATA_INVALIDA', camp, missatge: `${camp} ha de ser un dia { a, m, d } que existisca.` });
}

/* Les tres llistes del registre (vendes, desglossament i pagaments) es recorren
   per índex, no amb forEach: un forat ([ , x]) arriba com a undefined i és un
   error. Si no, el registre passaria la validació i, després d'un JSON (que
   el convertix en null), ja no. */

/* El desglossament per IVA d'una venda. Torna la suma dels totals, o null si no es pot sumar. */
function validaPerIva(perIva, camp, errors) {
  if (!Array.isArray(perIva)) {
    errors.push({ codi: 'DESGLOSSAMENT_INVALID', camp, missatge: `${camp} és una llista (buida si la venda val zero).` });
    return null;
  }
  let suma = 0;
  let sumable = true;
  const tipus = new Set();
  for (let j = 0; j < perIva.length; j += 1) {
    const grup = perIva[j];
    const on = `${camp}[${j}]`;
    if (!esObjecte(grup)) {
      errors.push({ codi: 'DESGLOSSAMENT_INVALID', camp: on, missatge: `${on} és { ivaPercent, totalCents }.` });
      sumable = false;
      continue;
    }
    comprovaClaus(grup, CLAUS_IVA, on, errors);
    if (!Number.isSafeInteger(grup.ivaPercent) || grup.ivaPercent < 0 || grup.ivaPercent > 100) {
      errors.push({ codi: 'IVA_INVALID', camp: `${on}.ivaPercent`, missatge: `${on}.ivaPercent és un enter de 0 a 100.` });
    } else if (tipus.has(grup.ivaPercent)) {
      errors.push({ codi: 'IVA_REPETIT', camp: `${on}.ivaPercent`, missatge: `El tipus ${grup.ivaPercent} % es repetix al desglossament.` });
    } else {
      tipus.add(grup.ivaPercent);
    }
    if (!esCentsNoNegatius(grup.totalCents)) {
      errors.push({ codi: 'IMPORT_INVALID', camp: `${on}.totalCents`, missatge: `${on}.totalCents és un enter de cèntims no negatiu.` });
      sumable = false;
      continue;
    }
    suma += grup.totalCents;
  }
  return sumable && Number.isSafeInteger(suma) ? suma : null;
}

/* Els pagaments d'una venda. Torna la suma, o null si no es pot sumar. */
function validaPagaments(pagaments, camp, errors) {
  if (!Array.isArray(pagaments)) {
    errors.push({ codi: 'PAGAMENTS_INVALIDS', camp, missatge: `${camp} és una llista (buida si la venda val zero).` });
    return null;
  }
  let suma = 0;
  let sumable = true;
  for (let j = 0; j < pagaments.length; j += 1) {
    const pagament = pagaments[j];
    const on = `${camp}[${j}]`;
    if (!esObjecte(pagament)) {
      errors.push({ codi: 'PAGAMENTS_INVALIDS', camp: on, missatge: `${on} és { metode, importCents }.` });
      sumable = false;
      continue;
    }
    comprovaClaus(pagament, CLAUS_PAGAMENT, on, errors);
    if (!METODES_PAGAMENT.includes(pagament.metode)) {
      errors.push({ codi: 'METODE_INVALID', camp: `${on}.metode`, missatge: `El mètode és ${METODES_PAGAMENT.join(', ')}.` });
    }
    if (!esCentsNoNegatius(pagament.importCents)) {
      errors.push({ codi: 'IMPORT_INVALID', camp: `${on}.importCents`, missatge: `${on}.importCents és un enter de cèntims no negatiu.` });
      sumable = false;
      continue;
    }
    suma += pagament.importCents;
  }
  return sumable && Number.isSafeInteger(suma) ? suma : null;
}

function validaVenda(venda, i, ids, errors) {
  const camp = `registre.vendes[${i}]`;
  if (!esObjecte(venda)) {
    errors.push({ codi: 'VENDA_INVALIDA', camp, missatge: `${camp} ha de ser un objecte.` });
    return;
  }
  comprovaClaus(venda, CLAUS_VENDA, camp, errors);
  if (!esIdVenda(venda.id)) {
    errors.push({ codi: 'ID_INVALID', camp: `${camp}.id`, missatge: `${camp}.id ha de ser un id opac (minúscules, xifres, «_» i «-»).` });
  } else if (ids.has(venda.id)) {
    errors.push({ codi: 'ID_REPETIT', camp: `${camp}.id`, missatge: `L’id ${venda.id} es repetix.` });
  } else {
    ids.add(venda.id);
  }
  if (!Number.isSafeInteger(venda.numero) || venda.numero < 1) {
    errors.push({ codi: 'NUMERO_INVALID', camp: `${camp}.numero`, missatge: `${camp}.numero és un enter positiu.` });
  }
  if (!TIPUS_VENDA.includes(venda.tipus)) {
    errors.push({ codi: 'TIPUS_INVALID', camp: `${camp}.tipus`, missatge: `El tipus és ${TIPUS_VENDA.join(' o ')}.` });
  }
  validaData(venda.data, `${camp}.data`, errors);
  if (typeof venda.hora !== 'string' || !PATRO_HORA.test(venda.hora)) {
    errors.push({ codi: 'HORA_INVALIDA', camp: `${camp}.hora`, missatge: `${camp}.hora és «HH:MM», de 00:00 a 23:59.` });
  }
  if (!CANALS_VENDA.includes(venda.canal)) {
    errors.push({ codi: 'CANAL_INVALID', camp: `${camp}.canal`, missatge: `El canal és ${CANALS_VENDA.join(', ')}.` });
  }
  const total = esCentsNoNegatius(venda.totalCents) ? venda.totalCents : null;
  if (total === null) {
    errors.push({ codi: 'IMPORT_INVALID', camp: `${camp}.totalCents`, missatge: `${camp}.totalCents és un enter de cèntims no negatiu (les devolucions també).` });
  }
  const sumaIva = validaPerIva(venda.perIva, `${camp}.perIva`, errors);
  const sumaPagaments = validaPagaments(venda.pagaments, `${camp}.pagaments`, errors);
  if (total !== null && sumaIva !== null && sumaIva !== total) {
    errors.push({ codi: 'DESGLOSSAMENT_NO_QUADRA', camp: `${camp}.perIva`, missatge: `El desglossament per IVA de ${camp} no suma el total.` });
  }
  if (total !== null && sumaPagaments !== null && sumaPagaments !== total) {
    errors.push({ codi: 'PAGAMENTS_NO_QUADREN', camp: `${camp}.pagaments`, missatge: `Els pagaments de ${camp} no sumen el total.` });
  }
  if (venda.tipus === 'devolucio') {
    if (venda.tiquetOrigenId === undefined || venda.tiquetOrigenId === null) {
      errors.push({ codi: 'CAMP_OBLIGATORI', camp: `${camp}.tiquetOrigenId`, missatge: 'Una devolució diu de quin tiquet de venda ve.' });
    } else if (!esIdVenda(venda.tiquetOrigenId) || venda.tiquetOrigenId === venda.id) {
      errors.push({ codi: 'ID_INVALID', camp: `${camp}.tiquetOrigenId`, missatge: 'El tiquet d’origen és l’id opac d’una altra venda.' });
    }
  } else if (venda.tiquetOrigenId !== undefined) {
    errors.push({ codi: 'CAMP_SOBRANT', camp: `${camp}.tiquetOrigenId`, missatge: 'Només una devolució porta tiquet d’origen.' });
  }
}

/**
 * Els errors d'un registre de vendes, sense llançar: [] si és vàlid.
 * @param {object} registre
 * @returns {{ codi: string, camp: string, missatge: string }[]}
 */
export function validaRegistreVendes(registre) {
  if (!esObjecte(registre)) return [{ codi: 'REGISTRE_INVALID', camp: 'registre', missatge: 'El registre de vendes ha de ser un objecte.' }];
  const errors = [];
  comprovaClaus(registre, CLAUS_REGISTRE, 'registre', errors);
  if (registre.esquema !== ESQUEMA_VENDES) {
    errors.push({ codi: 'ESQUEMA_INVALID', camp: 'registre.esquema', missatge: `L’esquema és ${ESQUEMA_VENDES}.` });
  }
  if (registre.moneda !== MONEDA_VENDES) {
    errors.push({ codi: 'MONEDA_INVALIDA', camp: 'registre.moneda', missatge: `La moneda és ${MONEDA_VENDES}.` });
  }
  validaTitular(registre.titular, errors);
  validaOrigen(registre.origen, errors);
  if (!Array.isArray(registre.vendes)) {
    errors.push({ codi: 'VENDES_INVALIDES', camp: 'registre.vendes', missatge: 'Les vendes són una llista (buida si no n’hi ha cap).' });
  } else {
    const ids = new Set();
    for (let i = 0; i < registre.vendes.length; i += 1) validaVenda(registre.vendes[i], i, ids, errors);
  }
  return errors;
}

/* La còpia d'una venda ja validada, amb les claus en l'ordre del contracte. */
function copiaVenda(venda) {
  return {
    id: venda.id,
    numero: venda.numero,
    tipus: venda.tipus,
    data: { a: venda.data.a, m: venda.data.m, d: venda.data.d },
    hora: venda.hora,
    canal: venda.canal,
    totalCents: venda.totalCents,
    perIva: venda.perIva.map(({ ivaPercent, totalCents }) => ({ ivaPercent, totalCents })),
    pagaments: venda.pagaments.map(({ metode, importCents }) => ({ metode, importCents })),
    ...(venda.tipus === 'devolucio' ? { tiquetOrigenId: venda.tiquetOrigenId } : {})
  };
}

/**
 * El registre de vendes validat, en una còpia nova congelada en profunditat
 * (l'àlies del titular, sense espais als extrems). Si no és vàlid, llança un
 * error amb codi REGISTRE_INVALID i la llista d'errors a `detalls`.
 * @param {object} dades
 * @returns {Readonly<object>}
 */
export function creaRegistreVendes(dades) {
  const errors = validaRegistreVendes(dades);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `El registre de vendes no és vàlid: ${errors.map((e) => e.missatge).join(' ')}`, errors);
  const { titular, origen } = dades;
  return congela({
    esquema: ESQUEMA_VENDES,
    moneda: MONEDA_VENDES,
    titular: titular === null ? null : { tipus: titular.tipus, id: titular.id, alies: titular.alies.trim(), ambit: titular.ambit },
    origen: { app: origen.app, establiment: origen.establiment },
    vendes: dades.vendes.map(copiaVenda)
  });
}

/**
 * El titular tal com el porta el registre: { tipus, id, alies, ambit } d'un
 * titular de la Gestoria (sdp.gestoria.titular.v1, creaTitular) o de
 * qualsevol objecte amb eixos camps; null si no n'hi ha. L'àmbit passa tal
 * qual, perquè la validació refuse la llar ('LLAR'); la forma jurídica i els
 * representants es queden a la Gestoria. No valida (ho fa
 * validaRegistreVendes): un valor que no és un objecte passa tal qual, perquè
 * la validació el trobe.
 * @param {object|null|undefined} titular
 * @returns {object|null}
 */
export function titularDelRegistre(titular) {
  if (titular === null || titular === undefined) return null;
  if (!esObjecte(titular)) return titular;
  return { tipus: titular.tipus, id: titular.id, alies: titular.alies, ambit: titular.ambit };
}
