/**
 * publicacioUniversal.js · IDEA-61 (T0, prompt 261102_1532) · El contracte pur
 * del Flux Universal de Publicació (Mur <-> Mercat · Compartir cotxe · Treball
 * · Habitatge).
 *
 * UNA SOLA FILA, DUES VISTES. L'única escriptura de la UI continua sent
 * publishNote (sections/notes/NotesContext.jsx) → sendSectionSubmission →
 * appendSectionSubmissionNetworkOnly (data/backendPort.js) → una fila de
 * section_submissions. La RLS del servidor
 * (supabase/migrations/2609080000_initial_schema.sql, polítiques d'insert i
 * d'update) només admet section_id ∈ {mur, mercat, events, multimedia, notes}:
 * CAP section_id nou. Una fitxa de vehicle, treball o habitatge viu a la
 * secció 'mur' amb `ambit`, `estat` i `dades` al payload jsonb; una de mercat,
 * a la seua secció de sempre. La «doble projecció atòmica» és de LECTURA:
 * loadMur ja barreja feedPosts i marketItems, i cada vertical filtra amb
 * perAmbit. Ací no hi ha cap migració ni cap clau de servidor.
 *
 * LLEI DEL PÍXEL. Una publicació SENSE àmbit (el Mur de sempre: type 'feed',
 * sense `ambit`) no rep cap clau nova (projeccioPayload torna la resta
 * byte a byte), cap etiqueta (etiquetesDAmbit → []) i cap resum ('').
 *
 * SEGURETAT (core-seguretat-audit). El payload és un jsonb que un veí pot
 * escriure directament per l'API: tot el que entra a `dades` es coacciona
 * a primitius (text amb netejaText i retall, enters amb Number.isSafeInteger
 * dins de rang, enums tancats, dates i hores de forma fixa) en escriure
 * (projeccioPayload) i en llegir (coaccionaAmbit, des del mapejador). Cap
 * regex amb retrocés: anclades, sense quantificadors imbricats. El camp
 * `contacte` (treball) és privat: mai entra a textCercable ni a resumDeFitxa.
 * idea61-05 (Gauntlet T7a, 261104) · `privat` vol dir fora de l'índex de cerca
 * i del resum de la targeta, NO secret: la fitxa de lectura del detall el
 * mostra a qui pot llegir la fila (la gent del poble, RLS is_town_member),
 * perquè la fitxa és per a contactar, i el formulari (BlocAmbit) ho avisa.
 *
 * JS PUR: cap React, cap xarxa, cap rellotge. L'única importació és
 * netejaText (utils/sanitize.js). Cap funció llança: tornen valors.
 */
import { netejaText } from './sanitize.js';

/* ── Vocabulari tancat ─────────────────────────────────────────────── */

export const AMBITS = Object.freeze(['mur', 'mercat', 'calendari', 'mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);
export const ESTATS = Object.freeze(['disponible', 'reservat', 'complet', 'tancat']);
export const ESTAT_PER_DEFECTE = 'disponible';

/* IDEA-61 · Cap migració: les verticals viuen a la secció 'mur'
   amb l'àmbit al payload; el mercat, a la seua. Només 'mur' i 'mercat'. */
export const SECTION_ID_PER_AMBIT = Object.freeze({
  mur: 'mur', mercat: 'mercat', calendari: 'mur', mapa: 'mur',
  vehicle: 'mur', animalets: 'mur', treball: 'mur', habitatge: 'mur'
});

/* El `type` del payload que decidix la targeta del Mur (TargetaDelMur.jsx:
   'product' és Mercat). 'feed' és el de publishNote: per a 'mur' no
   s'escriu mai (Llei del Píxel), només es documenta. */
export const TYPE_PER_AMBIT = Object.freeze({
  mur: 'feed', mercat: 'product', calendari: 'calendari', mapa: 'mapa',
  vehicle: 'vehicle', animalets: 'animalets', treball: 'treball', habitatge: 'habitatge'
});

export const MODALITATS = Object.freeze({
  mapa: Object.freeze(['punt_interes', 'incidencia', 'patrimoni', 'ruta']),
  vehicle: Object.freeze(['oferisc_places', 'busque_lloc', 'recarrec_comunitari']),
  animalets: Object.freeze(['adopcio', 'perdut', 'trobat', 'cura']),
  treball: Object.freeze(['oferta_feina', 'oferisc_ofici', 'jornal_agricola', 'relleu_generacional']),
  habitatge: Object.freeze(['lloguer', 'venda', 'compartir_casa', 'masoveria_urbana'])
});
export const ESTATS_IMMOBLE = Object.freeze(['llest_per_entrar', 'a_reformar']);

/* El to de la insígnia de cada estat (components.css · .sdp-insignia--*). */
export const TO_PER_ESTAT = Object.freeze({ disponible: 'exit', reservat: 'avis', complet: 'neutre', tancat: 'error' });

/* IDEA-61 · Claus que el mapejador (data/mapejadorSeccions.js ·
   CLAUS_D_AUTORITAT) lleva en llegir i que una fitxa d'àmbit no escriu mai.
   `origen` i `author_name`/`author_avatar` NO hi són: les escriu publishNote i
   el mapejador les reinterpreta (origenPublic, avatarDeLaPublicacio). */
export const CLAUS_RESERVADES = Object.freeze([
  '__proto__', 'constructor', 'prototype',
  'author_org_id', 'authorOrgId', 'author_entity_id', 'author_id', 'author_user_id',
  'owner_user_id', 'ownerUserId', 'author_agent_id', 'authorAgentId', 'isSystem', 'isAvis',
  'is_pinned', 'pinned_position', 'mainHref', 'slug', 'article', 'autor', 'source', 'srcDelPort'
]);

/* ── Reserves i18n (idèntiques a ca.js; les claus les escriu el carril L3) ── */

export const RESERVES_I18N = Object.freeze({
  'ambit.mur': 'Mur',
  'ambit.mercat': 'Mercat',
  'ambit.calendari': 'Calendari',
  'ambit.mapa': 'Mapa',
  'ambit.vehicle': 'Compartir cotxe',
  'ambit.animalets': 'Animalets',
  'ambit.treball': 'Treball',
  'ambit.habitatge': 'Habitatge',
  'ambit.estat.disponible': 'Disponible',
  'ambit.estat.reservat': 'Reservat',
  'ambit.estat.complet': 'Complet',
  'ambit.estat.tancat': 'Tancat',
  'ambit.modalitat.punt_interes': 'Punt d’interès',
  'ambit.modalitat.incidencia': 'Incidència al terme',
  'ambit.modalitat.patrimoni': 'Patrimoni i memòria',
  'ambit.modalitat.ruta': 'Camí o ruta',
  'ambit.modalitat.oferisc_places': 'Oferisc places',
  'ambit.modalitat.busque_lloc': 'Busque lloc',
  'ambit.modalitat.recarrec_comunitari': 'Recàrrec comunitari',
  'ambit.modalitat.adopcio': 'En adopció',
  'ambit.modalitat.perdut': 'Animal perdut',
  'ambit.modalitat.trobat': 'Animal trobat',
  'ambit.modalitat.cura': 'Cura o ajuda',
  'ambit.modalitat.oferta_feina': 'Oferta de feina',
  'ambit.modalitat.oferisc_ofici': 'Oferisc el meu ofici',
  'ambit.modalitat.jornal_agricola': 'Jornal agrícola',
  'ambit.modalitat.relleu_generacional': 'Relleu generacional',
  'ambit.modalitat.lloguer': 'Lloguer',
  'ambit.modalitat.venda': 'Venda',
  'ambit.modalitat.compartir_casa': 'Compartir casa',
  'ambit.modalitat.masoveria_urbana': 'Masoveria urbana',
  'ambit.estatImmoble.llest_per_entrar': 'Llest per a entrar',
  'ambit.estatImmoble.a_reformar': 'Per a reformar',
  'ambit.camp.modalitat': 'Modalitat',
  'ambit.camp.estat': 'Estat',
  'ambit.camp.data_inici': 'Dia d’inici',
  'ambit.camp.hora_inici': 'Hora d’inici',
  'ambit.camp.data_fi': 'Dia de finalització',
  'ambit.camp.hora_fi': 'Hora de finalització',
  'ambit.camp.lloc': 'Lloc o adreça',
  'ambit.camp.coordenades': 'Coordenades o referència',
  'ambit.camp.especie': 'Animal o espècie',
  'ambit.camp.lloc_eixida': 'Lloc d’eixida',
  'ambit.camp.lloc_arribada': 'Lloc d’arribada',
  'ambit.camp.data_eixida': 'Dia d’eixida',
  'ambit.camp.hora_eixida': 'Hora d’eixida',
  'ambit.camp.data_tornada': 'Dia de tornada',
  'ambit.camp.hora_tornada': 'Hora de tornada',
  'ambit.camp.places': 'Places disponibles',
  'ambit.camp.aportacio': 'Aportació per plaça',
  'ambit.camp.punt_trobada': 'Punt de trobada',
  'ambit.camp.preu': 'Preu',
  'ambit.camp.unitat': 'Unitat',
  'ambit.camp.categoria': 'Categoria',
  'ambit.camp.estoc': 'Disponibilitat',
  'ambit.camp.ofici': 'Ofici o sector',
  'ambit.camp.municipi': 'Municipi',
  'ambit.camp.dedicacio': 'Dedicació',
  'ambit.camp.remuneracio': 'Remuneració orientativa',
  'ambit.camp.contacte': 'Com contactar',
  'ambit.camp.superficie_m2': 'Superfície (m²)',
  'ambit.camp.habitacions': 'Habitacions',
  'ambit.camp.estat_immoble': 'Estat de l’immoble',
  'ambit.camp.condicions': 'Condicions'
});

/* ── Els camps de cada àmbit ───────────────────────────────────────── */

const MAXIM_TEXT = 120;
const MAXIM_TEXT_LLARG = 500;

/* Un camp: { id, tipus, obligatori, clau, reserva, maxim, opcions?,
   clauOpcions?, min?, max?, obligatoriSi?, privat? }. `privat`: fora de
   textCercable i de resumDeFitxa, però visible al detall (idea61-05). */
function camp(id, tipus, extra = {}) {
  const clau = `ambit.camp.${id}`;
  return Object.freeze({
    id,
    tipus,
    obligatori: extra.obligatori === true,
    clau,
    reserva: RESERVES_I18N[clau],
    maxim: extra.maxim ?? MAXIM_TEXT,
    ...(extra.opcions ? { opcions: extra.opcions, clauOpcions: extra.clauOpcions } : {}),
    ...(extra.min !== undefined ? { min: extra.min, max: extra.max } : {}),
    ...(extra.obligatoriSi ? { obligatoriSi: Object.freeze({ ...extra.obligatoriSi }) } : {}),
    ...(extra.privat ? { privat: true } : {})
  });
}

export const CAMPS = Object.freeze({
  mur: Object.freeze([]),
  mercat: Object.freeze([
    camp('preu', 'preu', { obligatori: true }),
    camp('unitat', 'text'),
    camp('categoria', 'text'),
    camp('estoc', 'text')
  ]),
  calendari: Object.freeze([
    camp('data_inici', 'data', { obligatori: true }),
    camp('hora_inici', 'hora'),
    camp('data_fi', 'data'),
    camp('hora_fi', 'hora'),
    camp('lloc', 'text', { obligatori: true }),
    camp('municipi', 'text')
  ]),
  mapa: Object.freeze([
    camp('modalitat', 'enum', { obligatori: true, opcions: MODALITATS.mapa, clauOpcions: 'ambit.modalitat' }),
    camp('lloc', 'text', { obligatori: true }),
    camp('municipi', 'text'),
    camp('coordenades', 'text')
  ]),
  vehicle: Object.freeze([
    camp('modalitat', 'enum', { obligatori: true, opcions: MODALITATS.vehicle, clauOpcions: 'ambit.modalitat' }),
    camp('lloc_eixida', 'text', { obligatori: true }),
    camp('lloc_arribada', 'text', { obligatori: true }),
    camp('data_eixida', 'data', { obligatori: true }),
    camp('hora_eixida', 'hora'),
    camp('data_tornada', 'data'),
    camp('hora_tornada', 'hora'),
    camp('places', 'enter', { min: 1, max: 9, obligatoriSi: { camp: 'modalitat', valor: 'oferisc_places' } }),
    camp('aportacio', 'preu'),
    camp('punt_trobada', 'text')
  ]),
  animalets: Object.freeze([
    camp('modalitat', 'enum', { obligatori: true, opcions: MODALITATS.animalets, clauOpcions: 'ambit.modalitat' }),
    camp('especie', 'text', { obligatori: true }),
    camp('municipi', 'text', { obligatori: true }),
    camp('contacte', 'text', { privat: true })
  ]),
  treball: Object.freeze([
    camp('modalitat', 'enum', { obligatori: true, opcions: MODALITATS.treball, clauOpcions: 'ambit.modalitat' }),
    camp('ofici', 'text', { obligatori: true }),
    camp('municipi', 'text'),
    camp('dedicacio', 'text', { maxim: MAXIM_TEXT_LLARG }),
    camp('remuneracio', 'text', { maxim: MAXIM_TEXT_LLARG }),
    camp('contacte', 'text', { privat: true })
  ]),
  habitatge: Object.freeze([
    camp('modalitat', 'enum', { obligatori: true, opcions: MODALITATS.habitatge, clauOpcions: 'ambit.modalitat' }),
    camp('preu', 'preu', { obligatori: true }),
    camp('superficie_m2', 'enter', { min: 1, max: 100000 }),
    camp('habitacions', 'enter', { min: 0, max: 50 }),
    camp('estat_immoble', 'enum', { opcions: ESTATS_IMMOBLE, clauOpcions: 'ambit.estatImmoble' }),
    camp('municipi', 'text'),
    camp('condicions', 'text', { maxim: MAXIM_TEXT_LLARG })
  ])
});

/* ── Coacció primitiva ─────────────────────────────────────────────── */

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esAmbit = (valor) => typeof valor === 'string' && AMBITS.includes(valor);
const esTextOPrimitiu = (valor) => typeof valor === 'string' || (typeof valor === 'number' && Number.isFinite(valor));

/* PostgreSQL rebutja qualsevol surrogat desaparellat en JSONB, també dins
   del text o un de baix. Conserva els parells (emoticones) i lleva només
   unitats soltes en una passada lineal, després del retall UTF-16. */
function senseSurrogatsSolts(text) {
  let net = '';
  let inici = 0;
  for (let i = 0; i < text.length; i += 1) {
    const codi = text.charCodeAt(i);
    if (codi >= 0xd800 && codi <= 0xdbff) {
      const seguent = text.charCodeAt(i + 1);
      if (seguent >= 0xdc00 && seguent <= 0xdfff) { i += 1; continue; }
    } else if (codi < 0xdc00 || codi > 0xdfff) continue;
    net += text.slice(inici, i);
    inici = i + 1;
  }
  return net + text.slice(inici);
}

/* Text net i retallat. El trim de després del retall fa el punt fix:
   netejaText talla després de trim i podia deixar un espai final, també
   quan cau la meitat solta d'una emoticona. */
function textNet(valor, maxim) {
  if (!esTextOPrimitiu(valor)) return null;
  const text = senseSurrogatsSolts(netejaText(valor, maxim)).trim();
  return text === '' ? null : text;
}

const FORMA_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIES_DEL_MES = Object.freeze([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);

/* aaaa-mm-dd de calendari (any de traspàs inclòs), o null. Sense Date. */
function dataNeta(valor) {
  if (typeof valor !== 'string') return null;
  const m = FORMA_DATA.exec(valor.trim());
  if (!m) return null;
  const any = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1) return null;
  const traspas = (any % 4 === 0 && any % 100 !== 0) || any % 400 === 0;
  const dies = mes === 2 && traspas ? 29 : DIES_DEL_MES[mes - 1];
  return dia <= dies ? m[0] : null;
}

const FORMA_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function horaNeta(valor) {
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  return FORMA_HORA.test(text) ? text : null;
}

const FORMA_ENTER = /^-?\d{1,15}$/;

/* Un enter segur (número o text de xifres, '3'), o NaN. */
function enterDe(valor) {
  if (typeof valor === 'number') return Number.isSafeInteger(valor) ? valor : NaN;
  if (typeof valor !== 'string') return NaN;
  const text = valor.trim();
  return FORMA_ENTER.test(text) ? Number(text) : NaN;
}

function enterNet(valor, min, max) {
  const n = enterDe(valor);
  if (!Number.isSafeInteger(n) || n < min || n > max) return null;
  return n === 0 ? 0 : n;
}

function coacciona(campDef, valor) {
  switch (campDef.tipus) {
    case 'text':
    case 'preu':
      return textNet(valor, campDef.maxim);
    case 'data':
      return dataNeta(valor);
    case 'hora':
      return horaNeta(valor);
    case 'enter':
      return enterNet(valor, campDef.min, campDef.max);
    case 'enum':
      return typeof valor === 'string' && campDef.opcions.includes(valor) ? valor : null;
    default:
      return null;
  }
}

/* Buit = no hi ha res a validar: null, undefined o un text que queda en res. */
function esBuit(campDef, valor) {
  if (valor == null) return true;
  if (typeof valor !== 'string') return false;
  return campDef.tipus === 'text' || campDef.tipus === 'preu' ? netejaText(valor) === '' : valor.trim() === '';
}

/* El codi d'error d'un valor present que no passa, o null. */
function codiDError(campDef, valor) {
  switch (campDef.tipus) {
    case 'text':
    case 'preu': {
      if (!esTextOPrimitiu(valor)) return 'format';
      return netejaText(valor, Number.MAX_SAFE_INTEGER).length > campDef.maxim ? 'llargaria' : null;
    }
    case 'data':
      return dataNeta(valor) === null ? 'format' : null;
    case 'hora':
      return horaNeta(valor) === null ? 'format' : null;
    case 'enter': {
      const n = enterDe(valor);
      if (!Number.isSafeInteger(n)) return 'format';
      return n < campDef.min || n > campDef.max ? 'rang' : null;
    }
    case 'enum':
      return typeof valor === 'string' && campDef.opcions.includes(valor) ? null : 'enum';
    default:
      return 'format';
  }
}

/* Traducció tolerant: el traductor de l'app (t(clau, reserva)) o la reserva. */
function tradueix(t, clau) {
  const reserva = Object.hasOwn(RESERVES_I18N, clau) ? RESERVES_I18N[clau] : '';
  if (typeof t !== 'function') return reserva;
  try {
    const text = t(clau, reserva);
    return typeof text === 'string' && text !== '' ? text : reserva;
  } catch {
    return reserva;
  }
}

/* Les marques combinants (U+0300..U+036F) que l'NFD separa dels accents. Es
   construïx des dels punts de codi: cap caràcter combinant en cru al fitxer. */
const MARQUES_COMBINANTS = new RegExp(`[${String.fromCodePoint(0x300)}-${String.fromCodePoint(0x36f)}]`, 'g');

/* Un slug de categoria del Mercat (category_slug), lineal i sense retrocés. */
function slugDe(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(MARQUES_COMBINANTS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    .slice(0, 80);
}

/* ── Classificació ─────────────────────────────────────────────────── */

/** L'àmbit d'un payload o d'un element: `ambit` vàlid, o Mercat pel type ('product' | 'market'), o 'mur'. */
export function ambitDe(valor) {
  if (!esObjecte(valor)) return 'mur';
  if (esAmbit(valor.ambit)) return valor.ambit;
  return valor.type === 'product' || valor.type === 'market' ? 'mercat' : 'mur';
}

/** Un element amb àmbit vertical explícit (mercat, vehicle, treball o habitatge): el que ha publicat el flux universal. */
export function esFitxaDAmbit(item) {
  return esObjecte(item) && esAmbit(item.ambit) && item.ambit !== 'mur';
}

/** L'element és d'este àmbit? Un no-objecte o un àmbit desconegut, mai. */
export function esDeLAmbit(item, ambit) {
  return esObjecte(item) && esAmbit(ambit) && ambitDe(item) === ambit;
}

/** Els elements d'un àmbit, en el mateix ordre. Una no-llista dona []. */
export function perAmbit(items, ambit) {
  return Array.isArray(items) ? items.filter((item) => esDeLAmbit(item, ambit)) : [];
}

/**
 * Ix a la llista de la seua vertical i del Mercat? Una fila 'tancada' no, però
 * continua existint (el port no esborra). idea61-04 (Gauntlet T7a, 261104) ·
 * Ho apliquen SeccioVertical i MercatSection (només a les fitxes d'àmbit). El
 * Mur i la cerca la pinten amb la insígnia «Tancat» (ARB-L4-02): si el Mur
 * l'ha d'amagar, ho decidix el Mestre.
 */
export function esVisibleALaLlista(item) {
  return esObjecte(item) && normalitzaEstat(item.estat) !== 'tancat';
}

/** El camp `id` de l'àmbit, o null. */
export function campDe(ambit, id) {
  if (!esAmbit(ambit)) return null;
  return CAMPS[ambit].find((campDef) => campDef.id === id) ?? null;
}

/* ── Validació i normalització ─────────────────────────────────────── */

/* G3-g2-matriu-05 (AH-04.3: calendari multi-dia) · Les regles entre camps:
   la fi d'un interval no pot ser anterior a l'inici. Sense dia de fi l'acte
   acaba el dia d'inici (agendaMur.js · acteAEsdeveniment), i llavors mana
   l'hora. Una fi igual a l'inici és vàlida. Les dates (aaaa-mm-dd) i les hores
   (HH:MM) netes es comparen com a text: cap Date. */
const INTERVALS = Object.freeze({
  calendari: Object.freeze({ dataInici: 'data_inici', horaInici: 'hora_inici', dataFi: 'data_fi', horaFi: 'hora_fi' })
});

/* L'error 'ordre' del camp de la fi, o null. Un camp que ja porta el seu
   error (format), o buit, no entra en la comparació. */
function errorDOrdre(ambit, font, errors) {
  const interval = Object.hasOwn(INTERVALS, ambit) ? INTERVALS[ambit] : null;
  if (!interval) return null;
  const ambError = new Set(errors.map((error) => error.camp));
  if (ambError.has(interval.dataInici) || ambError.has(interval.dataFi)) return null;
  const llig = (id, neta) => (Object.hasOwn(font, id) && !ambError.has(id) ? neta(font[id]) : null);
  const dataInici = llig(interval.dataInici, dataNeta);
  if (dataInici === null) return null;
  const dataFi = llig(interval.dataFi, dataNeta);
  if (dataFi !== null && dataFi !== dataInici) return dataFi < dataInici ? { camp: interval.dataFi, codi: 'ordre' } : null;
  const horaInici = llig(interval.horaInici, horaNeta);
  const horaFi = llig(interval.horaFi, horaNeta);
  return horaInici !== null && horaFi !== null && horaFi < horaInici ? { camp: interval.horaFi, codi: 'ordre' } : null;
}

/**
 * { ok, errors: [{ camp, codi }] } amb codi ∈ obligatori | format | rang |
 * enum | llargaria | ordre ('ordre': la fi d'un interval, anterior a
 * l'inici; vegeu INTERVALS). Un àmbit desconegut: { camp: 'ambit', codi: 'enum' }.
 */
export function validaFitxa(ambit, dades) {
  if (!esAmbit(ambit)) return { ok: false, errors: [{ camp: 'ambit', codi: 'enum' }] };
  const font = esObjecte(dades) ? dades : {};
  const errors = [];
  for (const campDef of CAMPS[ambit]) {
    const valor = Object.hasOwn(font, campDef.id) ? font[campDef.id] : undefined;
    const condicio = campDef.obligatoriSi;
    /* La condició mira només propietats pròpies, com el camp mateix. */
    const obligatori = campDef.obligatori || (condicio !== undefined && Object.hasOwn(font, condicio.camp) && font[condicio.camp] === condicio.valor);
    if (esBuit(campDef, valor)) {
      if (obligatori) errors.push({ camp: campDef.id, codi: 'obligatori' });
      continue;
    }
    const codi = codiDError(campDef, valor);
    if (codi) errors.push({ camp: campDef.id, codi });
  }
  const ordre = errorDOrdre(ambit, font, errors);
  if (ordre) errors.push(ordre);
  return { ok: errors.length === 0, errors };
}

/**
 * NOMÉS els camps de CAMPS[ambit], coaccionats; el que no passa, fora.
 * Idempotent: normalitzaDades(a, normalitzaDades(a, x)) és igual.
 */
export function normalitzaDades(ambit, dades) {
  const netes = {};
  if (!esAmbit(ambit) || !esObjecte(dades)) return netes;
  for (const campDef of CAMPS[ambit]) {
    if (!Object.hasOwn(dades, campDef.id)) continue;
    const net = coacciona(campDef, dades[campDef.id]);
    if (net !== null) netes[campDef.id] = net;
  }
  return netes;
}

/** Un estat d'ESTATS, o el de sèrie. */
export function normalitzaEstat(valor) {
  return typeof valor === 'string' && ESTATS.includes(valor) ? valor : ESTAT_PER_DEFECTE;
}

/**
 * { ambit, estat, dades } net, o null sense àmbit vàlid. Per al mapejador,
 * en escriure i en llegir. Amb `sectionId` (el section_id de la fila), l'àmbit
 * ha de viure a eixa secció (SECTION_ID_PER_AMBIT): una fila de 'mur' amb
 * ambit 'mercat', o una de 'mercat' amb ambit 'vehicle', escrita per l'API,
 * torna null. Sense sectionId (o si no és text), només es mira l'àmbit.
 */
export function coaccionaAmbit(payload, sectionId) {
  if (!esObjecte(payload) || !esAmbit(payload.ambit)) return null;
  if (typeof sectionId === 'string' && SECTION_ID_PER_AMBIT[payload.ambit] !== sectionId) return null;
  return {
    ambit: payload.ambit,
    estat: normalitzaEstat(payload.estat),
    dades: normalitzaDades(payload.ambit, payload.dades)
  };
}

/* ── Projecció cap al port ─────────────────────────────────────────── */

/**
 * El payload per al port. Sense àmbit vàlid o amb 'mur': la resta tal qual,
 * sense cap clau nova (Llei del Píxel). Amb àmbit vertical: la resta sense
 * CLAUS_RESERVADES + ambit, estat, dades (normalitzades) i type; per a
 * 'mercat', també price (= dades.preu) i tag/category_slug (de categoria),
 * perquè la targeta i el detall del Mercat de hui continuen funcionant.
 */
export function projeccioPayload(entrada) {
  if (!esObjecte(entrada)) return {};
  const { ambit, estat, dades, ...resta } = entrada;
  if (!esAmbit(ambit) || ambit === 'mur') return resta;
  const net = {};
  for (const clau of Object.keys(resta)) {
    if (!CLAUS_RESERVADES.includes(clau)) net[clau] = resta[clau];
  }
  const fitxa = normalitzaDades(ambit, dades);
  net.ambit = ambit;
  net.estat = normalitzaEstat(estat);
  net.dades = fitxa;
  net.type = TYPE_PER_AMBIT[ambit];
  if (ambit === 'mercat') {
    if (fitxa.preu !== undefined) net.price = fitxa.preu;
    if (fitxa.categoria !== undefined) {
      net.tag = fitxa.categoria;
      const slug = slugDe(fitxa.categoria);
      if (slug) net.category_slug = slug;
    }
  }
  return net;
}

/** El section_id de la fila: 'mercat' o 'mur'. */
export function seccioDAmbit(ambit) {
  return esAmbit(ambit) ? SECTION_ID_PER_AMBIT[ambit] : 'mur';
}

/** El `type` del payload de l'àmbit ('feed' per a 'mur', que no s'escriu mai). */
export function tipusDAmbit(ambit) {
  return esAmbit(ambit) ? TYPE_PER_AMBIT[ambit] : TYPE_PER_AMBIT.mur;
}

/** La ruta del detall, com getSectionItemPath (config/navigation.js): /<ambit>/<id>. Un id que no és text ni número, buit. */
export function rutaDAmbit(ambit, id) {
  const base = esAmbit(ambit) ? ambit : 'mur';
  const clau = typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  try { return `/${base}/${encodeURIComponent(clau)}`; }
  catch { return `/${base}/`; } // UTF-16 malmés: cap id representable ni URIError en pintar.
}

/** Una còpia del payload amb l'estat nou; un estat fora d'ESTATS no canvia res. */
export function canviaEstat(payload, estat) {
  if (!esObjecte(payload)) return {};
  const copia = { ...payload };
  if (typeof estat === 'string' && ESTATS.includes(estat)) copia.estat = estat;
  return copia;
}

/* ── Pintura (text i classes que ja existixen) ─────────────────────── */

/** El nom de l'àmbit, traduït. */
export function etiquetaDAmbit(ambit, t) {
  return tradueix(t, `ambit.${esAmbit(ambit) ? ambit : 'mur'}`);
}

/** El nom de l'estat, traduït. */
export function etiquetaDEstat(estat, t) {
  return tradueix(t, `ambit.estat.${normalitzaEstat(estat)}`);
}

/** El rètol d'un camp (ambit.camp.<id>), traduït. */
export function etiquetaDeCamp(campDef, t) {
  return esObjecte(campDef) && typeof campDef.clau === 'string' ? tradueix(t, campDef.clau) : '';
}

/** El rètol d'una opció d'enum (ambit.modalitat.<id>, ambit.estatImmoble.<id>), traduït; '' si no és de la llista. */
export function etiquetaDOpcio(campDef, valor, t) {
  if (!esObjecte(campDef) || !Array.isArray(campDef.opcions) || typeof valor !== 'string' || !campDef.opcions.includes(valor)) return '';
  return tradueix(t, `${campDef.clauOpcions}.${valor}`);
}

/**
 * Les dues etiquetes d'una fitxa d'àmbit per a la targeta: l'àmbit
 * (sdp-badge-system) i l'estat (sdp-insignia sdp-insignia--<to>). Es
 * calculen en pintar, mai es desen a `labels`. Sense àmbit vertical
 * explícit (el Mur de sempre, un producte de llegat): [] (cap píxel nou).
 */
export function etiquetesDAmbit(item, t) {
  if (!esFitxaDAmbit(item)) return [];
  const estat = normalitzaEstat(item.estat);
  return [
    { text: tradueix(t, `ambit.${item.ambit}`), className: 'sdp-badge-system' },
    { text: tradueix(t, `ambit.estat.${estat}`), className: `sdp-insignia sdp-insignia--${TO_PER_ESTAT[estat]}` }
  ];
}

const MAXIM_TROS_DE_RESUM = 60;

/* Un tros de resum: la primera línia d'un text, retallada per punts de codi
   (cap emoticona partida en dos surrogats). */
function primeraLinia(text) {
  const punts = Array.from(text.split('\n')[0].trim());
  return punts.length > MAXIM_TROS_DE_RESUM ? `${punts.slice(0, MAXIM_TROS_DE_RESUM - 1).join('')}…` : punts.join('');
}

function trosDeResum(ambit, id, dades, t) {
  const campDef = campDe(ambit, id);
  const valor = dades[id];
  if (!campDef || valor === undefined || campDef.privat) return '';
  switch (campDef.tipus) {
    case 'enum':
      return etiquetaDOpcio(campDef, valor, t);
    case 'enter':
      return id === 'superficie_m2' ? `${valor} m²` : `${etiquetaDeCamp(campDef, t)}: ${valor}`;
    default:
      return primeraLinia(String(valor));
  }
}

/** Una línia curta per a la targeta («Oferisc places · La Torre → Alcoi · Places disponibles: 3 · 5 €»); '' per a 'mur'. Mai el contacte. */
export function resumDeFitxa(item, t) {
  if (!esFitxaDAmbit(item)) return '';
  const { ambit } = item;
  const dades = normalitzaDades(ambit, item.dades);
  const tros = (id) => trosDeResum(ambit, id, dades, t);
  let parts = [];
  if (ambit === 'vehicle') {
    parts = [
      tros('modalitat'),
      [tros('lloc_eixida'), tros('lloc_arribada')].filter(Boolean).join(' → '),
      [tros('data_eixida'), tros('hora_eixida')].filter(Boolean).join(' '),
      tros('places'),
      tros('aportacio')
    ];
  } else if (ambit === 'calendari') {
    parts = [
      [tros('data_inici'), tros('hora_inici')].filter(Boolean).join(' '),
      [tros('data_fi'), tros('hora_fi')].filter(Boolean).join(' '),
      tros('lloc'),
      tros('municipi')
    ];
  } else if (ambit === 'mapa') {
    parts = [tros('modalitat'), tros('lloc'), tros('municipi'), tros('coordenades')];
  } else if (ambit === 'animalets') {
    parts = [tros('modalitat'), tros('especie'), tros('municipi')];
  } else if (ambit === 'treball') {
    parts = [tros('modalitat'), tros('ofici'), tros('municipi'), tros('remuneracio')];
  } else if (ambit === 'habitatge') {
    parts = [tros('modalitat'), tros('preu'), tros('superficie_m2'), tros('habitacions'), tros('estat_immoble'), tros('municipi')];
  } else if (ambit === 'mercat') {
    parts = [tros('preu'), tros('unitat'), tros('categoria'), tros('estoc')];
  }
  return parts.filter(Boolean).join(' · ');
}

/** El text per a l'índex de cerca: l'àmbit i els camps estructurats (ids i reserves dels enums), mai el contacte; '' per a 'mur'. */
export function textCercable(item) {
  if (!esFitxaDAmbit(item)) return '';
  const { ambit } = item;
  const dades = normalitzaDades(ambit, item.dades);
  const parts = [RESERVES_I18N[`ambit.${ambit}`]];
  for (const campDef of CAMPS[ambit]) {
    if (campDef.privat || dades[campDef.id] === undefined) continue;
    const valor = dades[campDef.id];
    parts.push(String(valor));
    if (campDef.tipus === 'enum') parts.push(RESERVES_I18N[`${campDef.clauOpcions}.${valor}`]);
  }
  return parts.filter(Boolean).join(' ');
}
