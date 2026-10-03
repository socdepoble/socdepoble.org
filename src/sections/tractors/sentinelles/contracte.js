/**
 * contracte.js — el contracte comú sdp.sentinella.v1 dels sentinelles d'autonomia.
 *
 * Un sentinella és un tractor (sdp.tractor.v1, ../nucli/registre.js) que només
 * observa: rep el que la persona li passa, diagnostica i proposa. No aplica,
 * no esborra, no envia i no paga mai (nivell L0). Si alguna cosa s'ha
 * d'enviar, publicar o pagar, ho fa la persona després de mirar l'eixida.
 *
 * definixSentinella construïx el descriptor i en deriva el manifest
 * d'aprovació: cada valor s'escriu una sola vegada, i l'empremta els cobrix
 * tots dos (el fitxer del sentinella és una de les seues fonts). Les dades
 * personals exigixen signatura: el manifest d'un sentinella que en tracta
 * porta sempre nivellMinim 'signatura'.
 *
 * Pur i síncron. Les validacions no llancen mai: tornen la llista d'errors.
 */
import { SCHEMA_TRACTOR, validaManifest } from '../nucli/registre.js';

export const SCHEMA_SENTINELLA = 'sdp.sentinella.v1';
export const PATRO_ID_SENTINELLA = /^sentinella\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PATRO_CODI_AVIS = /^[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)+$/;
/* L0 diagnostica i proposa; L1 prepararia un esborrany local; L2 aplicaria
   després d'una porta humana. Este carril només executa L0. */
export const NIVELLS_SENTINELLA = Object.freeze(['L0', 'L1', 'L2']);
export const NIVELLS_EXECUTABLES = Object.freeze(['L0']);
export const SEVERITATS = Object.freeze(['roja', 'groga', 'info']);
export const TIPUS_DISPARADOR = Object.freeze([
  'arrencada-sessio', 'pre-commit', 'obrir-tauler', 'carpeta', 'tancament-torn', 'manual'
]);
export const TIPUS_SUPERFICIE = Object.freeze(['tauler-inici', 'departament', 'consola']);
export const TIPUS_EIXIDA = Object.freeze(['bandera', 'informe']);
export const CAMPS_SENTINELLA = Object.freeze([
  'schema', 'id', 'nom', 'descripcio', 'disparador', 'llig', 'escriu', 'xarxa', 'dadesPersonals', 'nivell',
  'eixida', 'superficie', 'portaHumana', 'proves', 'llindars', 'entrada', 'observa', 'manifest'
]);
const CAMPS_DISPARADOR = Object.freeze(['tipus', 'detall']);
const CAMPS_SUPERFICIE = Object.freeze(['tipus', 'departaments']);
const CAMPS_ENTRADA = Object.freeze(['etiqueta', 'ajuda', 'accepta', 'multiple', 'prepara']);
const CAMPS_EIXIDA = Object.freeze(['avisos', 'informe']);
const CAMPS_AVIS = Object.freeze(['codi', 'severitat', 'missatge', 'font']);

/* Les fonts que cobrix l'empremta de TOTS els sentinelles: la porta
   d'aprovació sencera, el registre, el panell que els aplica, el contracte
   amb el corredor i les peces comunes (comu.js, que descodifica els fitxers
   amb csv.js de la Gestoria). Qui toca una d'estes, toca tots els sentinelles. */
export const FONTS_COMUNES = Object.freeze([
  'src/sections/gestoria/nucli/csv.js',
  'src/sections/tractors/DialegAprovacio.jsx',
  'src/sections/tractors/PanellSentinelles.jsx',
  'src/sections/tractors/PanellTractors.jsx',
  'src/sections/tractors/nucli/aprovacio.js',
  'src/sections/tractors/nucli/canonic.js',
  'src/sections/tractors/nucli/empremta.js',
  'src/sections/tractors/nucli/magatzem.js',
  'src/sections/tractors/nucli/registre.js',
  'src/sections/tractors/nucli/webauthn.js',
  'src/sections/tractors/registreSentinelles.js',
  'src/sections/tractors/registreTractors.js',
  'src/sections/tractors/sentinelles/comu.js',
  'src/sections/tractors/sentinelles/contracte.js',
  'src/sections/tractors/sentinelles/executa.js',
  'src/sections/tractors/useTractors.js'
]);

export const CODIS_SENTINELLA = Object.freeze([
  'CONTRACTE_INVALID', 'NIVELL_NO_EXECUTABLE', 'PARAMETRES_INVALIDS', 'ENTRADA_INVALIDA', 'ERROR_INTERN', 'EIXIDA_INVALIDA'
]);

export class ErrorSentinella extends Error {
  constructor(codi, missatge, { cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorSentinella';
    this.codi = codi;
  }
}

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const textPle = (valor) => typeof valor === 'string' && valor.trim().length > 0;
const llistaDeText = (valor) => Array.isArray(valor) && valor.length > 0 && valor.every(textPle);
const esRutaRelativa = (ruta) => typeof ruta === 'string' && ruta.length > 0 && !ruta.startsWith('/') && !ruta.includes('\\')
  && ruta.split('/').every((tros) => tros !== '' && tros !== '.' && tros !== '..');

function campsDesconeguts(objecte, permesos, on) {
  return Object.keys(objecte).filter((clau) => !permesos.includes(clau)).map((clau) => `Camp desconegut${on}: «${clau}».`);
}

function congela(valor) {
  if (Array.isArray(valor)) return Object.freeze(valor.map(congela));
  if (esObjecte(valor)) return Object.freeze(Object.fromEntries(Object.entries(valor).map(([clau, v]) => [clau, congela(v)])));
  return valor;
}

/* Les dades personals exigixen signatura; la resta es pot aprovar amb la confirmació escrita. */
export const nivellMinimDe = (dadesPersonals) => (dadesPersonals === true ? 'signatura' : 'confirmacio');

/**
 * Descriptor sdp.sentinella.v1 amb el seu manifest sdp.tractor.v1 derivat.
 * No llança: un descriptor mal format es pot registrar, però no passa
 * validaSentinella i, per tant, executaSentinella no l'executa mai.
 * @param {object} d els camps del contracte, `observa`, `entrada` i, per al
 *   manifest, `versio`, `fitxa`, `fonts` i `caducitatDies`
 * @returns {Readonly<object>}
 */
export function definixSentinella(d = {}) {
  const { versio, fitxa, fonts, caducitatDies = 90, observa, entrada, ...dades } = d ?? {};
  const manifest = {
    schema: SCHEMA_TRACTOR,
    id: dades.id,
    nom: dades.nom,
    versio,
    descripcio: dades.descripcio,
    fitxa,
    fonts: Array.isArray(fonts) ? [...new Set(fonts)].sort() : fonts,
    llig: dades.llig,
    escriu: dades.escriu,
    xarxa: dades.xarxa,
    dadesPersonals: dades.dadesPersonals,
    nivellMinim: nivellMinimDe(dades.dadesPersonals),
    caducitatDies
  };
  return Object.freeze({
    ...congela({ schema: SCHEMA_SENTINELLA, ...dades }),
    entrada: esObjecte(entrada) ? Object.freeze({ ...entrada }) : entrada,
    observa,
    manifest: congela(manifest)
  });
}

function validaDisparador(disparador) {
  if (!Array.isArray(disparador) || disparador.length === 0) return ['disparador ha de llistar almenys un disparador.'];
  return disparador.flatMap((d, i) => {
    if (!esObjecte(d)) return [`disparador[${i}] ha de ser un objecte.`];
    const errors = campsDesconeguts(d, CAMPS_DISPARADOR, ` a disparador[${i}]`);
    if (!TIPUS_DISPARADOR.includes(d.tipus)) errors.push(`disparador[${i}].tipus ha de ser ${TIPUS_DISPARADOR.join(', ')}.`);
    if (!textPle(d.detall)) errors.push(`disparador[${i}].detall és obligatori.`);
    return errors;
  });
}

function validaSuperficie(superficie) {
  if (!esObjecte(superficie)) return ['superficie ha de ser un objecte.'];
  const errors = campsDesconeguts(superficie, CAMPS_SUPERFICIE, ' a superficie');
  if (!TIPUS_SUPERFICIE.includes(superficie.tipus)) errors.push(`superficie.tipus ha de ser ${TIPUS_SUPERFICIE.join(', ')}.`);
  if (superficie.tipus === 'departament') {
    if (!llistaDeText(superficie.departaments)) errors.push('Un departament de l’App Grid Shell ha de nomenar almenys un departament.');
  } else if (superficie.departaments !== undefined) {
    errors.push('Només una superfície de tipus departament porta departaments.');
  }
  return errors;
}

function validaEntrada(entrada) {
  if (!esObjecte(entrada)) return ['entrada ha de descriure com tria la persona els fitxers.'];
  const errors = campsDesconeguts(entrada, CAMPS_ENTRADA, ' a entrada');
  if (!textPle(entrada.etiqueta)) errors.push('entrada.etiqueta és obligatòria.');
  if (entrada.ajuda !== undefined && !textPle(entrada.ajuda)) errors.push('entrada.ajuda, si hi és, ha de ser text.');
  if (!textPle(entrada.accepta)) errors.push('entrada.accepta ha de dir quins fitxers admet.');
  if (typeof entrada.multiple !== 'boolean') errors.push('entrada.multiple ha de ser booleà.');
  if (typeof entrada.prepara !== 'function') errors.push('entrada.prepara ha de ser una funció pura.');
  return errors;
}

function validaLlindars(llindars) {
  if (!esObjecte(llindars)) return ['llindars ha de ser un objecte (pot ser buit).'];
  return Object.entries(llindars).filter(([, valor]) => !Number.isFinite(valor)).map(([clau]) => `llindars.${clau} ha de ser un número.`);
}

function validaProves(proves) {
  if (!Array.isArray(proves) || proves.length === 0) return ['proves ha de llistar almenys un fitxer de proves.'];
  const errors = [];
  if (!proves.every((ruta) => esRutaRelativa(ruta) && /\.test\.jsx?$/.test(ruta))) errors.push('proves només admet rutes relatives de fitxers .test.js o .test.jsx.');
  if (new Set(proves).size !== proves.length) errors.push('proves té rutes repetides.');
  return errors;
}

function igualsJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* El manifest ha de ser el derivat del descriptor: cap valor pot divergir. */
function validaCoherencia(s) {
  const m = s.manifest;
  if (!esObjecte(m)) return ['Falta el manifest sdp.tractor.v1 que acompanya el sentinella.'];
  const errors = validaManifest(m).map((error) => `Manifest: ${error}`);
  for (const camp of ['id', 'nom', 'descripcio', 'llig', 'escriu', 'xarxa', 'dadesPersonals']) {
    if (!igualsJson(m[camp], s[camp])) errors.push(`El manifest i el descriptor no coincidixen en «${camp}».`);
  }
  if (m.nivellMinim !== nivellMinimDe(s.dadesPersonals)) {
    errors.push(`Un sentinella ${s.dadesPersonals ? 'que tracta dades personals exigix signatura' : 'sense dades personals s’aprova amb confirmació'}: nivellMinim ha de ser «${nivellMinimDe(s.dadesPersonals)}».`);
  }
  if (Array.isArray(m.fonts)) {
    const falten = FONTS_COMUNES.filter((ruta) => !m.fonts.includes(ruta));
    if (falten.length) errors.push(`Les fonts no cobrixen la porta comuna: falta ${falten[0]}.`);
  }
  return errors;
}

/**
 * Errors del descriptor sdp.sentinella.v1 i del seu manifest (llista buida si és vàlid).
 * @param {object} s
 * @returns {string[]}
 */
export function validaSentinella(s) {
  if (!esObjecte(s)) return ['El sentinella ha de ser un objecte.'];
  const errors = campsDesconeguts(s, CAMPS_SENTINELLA, '');
  if (s.schema !== SCHEMA_SENTINELLA) errors.push(`schema ha de ser «${SCHEMA_SENTINELLA}».`);
  if (typeof s.id !== 'string' || !PATRO_ID_SENTINELLA.test(s.id)) errors.push('id ha de tindre la forma «sentinella.nom» (minúscules, xifres i guions).');
  if (!textPle(s.nom)) errors.push('nom és obligatori.');
  if (!textPle(s.descripcio)) errors.push('descripcio és obligatòria.');
  errors.push(...validaDisparador(s.disparador));
  if (!llistaDeText(s.llig)) errors.push('llig ha de dir què llig.');
  if (!llistaDeText(s.escriu)) errors.push('escriu ha de dir què escriu (o «Res»).');
  if (!textPle(s.xarxa)) errors.push('xarxa ha de ser «cap» o dir on es connecta.');
  if (typeof s.dadesPersonals !== 'boolean') errors.push('dadesPersonals ha de ser booleà.');
  if (!NIVELLS_SENTINELLA.includes(s.nivell)) errors.push(`nivell ha de ser ${NIVELLS_SENTINELLA.join(', ')}.`);
  if (s.nivell === 'L0' && s.xarxa !== 'cap') errors.push('Un sentinella L0 no es connecta enlloc: xarxa ha de ser «cap».');
  if (!Array.isArray(s.eixida) || s.eixida.length === 0 || !s.eixida.every((e) => TIPUS_EIXIDA.includes(e)) || new Set(s.eixida).size !== s.eixida.length) {
    errors.push(`eixida ha de ser una llista sense repetits de ${TIPUS_EIXIDA.join(' i ')}.`);
  }
  errors.push(...validaSuperficie(s.superficie));
  if (!textPle(s.portaHumana)) errors.push('portaHumana ha de dir què aprova l’humà abans d’enviar, publicar o pagar.');
  errors.push(...validaProves(s.proves));
  errors.push(...validaLlindars(s.llindars));
  errors.push(...validaEntrada(s.entrada));
  if (typeof s.observa !== 'function') errors.push('observa ha de ser una funció pura.');
  errors.push(...validaCoherencia(s));
  return errors;
}

/**
 * Errors de l'eixida d'observa: { avisos: [{ codi, severitat, missatge, font }], informe? }.
 * @param {object} eixida
 * @returns {string[]}
 */
export function validaEixida(eixida) {
  if (!esObjecte(eixida)) return ['L’eixida ha de ser un objecte.'];
  const errors = campsDesconeguts(eixida, CAMPS_EIXIDA, ' a l’eixida');
  if (!Array.isArray(eixida.avisos)) return [...errors, 'avisos ha de ser una llista.'];
  eixida.avisos.forEach((a, i) => {
    if (!esObjecte(a)) {
      errors.push(`avisos[${i}] ha de ser un objecte.`);
      return;
    }
    errors.push(...campsDesconeguts(a, CAMPS_AVIS, ` a avisos[${i}]`));
    if (typeof a.codi !== 'string' || !PATRO_CODI_AVIS.test(a.codi)) errors.push(`avisos[${i}].codi ha de ser un codi en majúscules (p. ex. «EST-SENSE-PERFIL»).`);
    if (!SEVERITATS.includes(a.severitat)) errors.push(`avisos[${i}].severitat ha de ser ${SEVERITATS.join(', ')}.`);
    if (!textPle(a.missatge)) errors.push(`avisos[${i}].missatge és obligatori.`);
    if (!textPle(a.font)) errors.push(`avisos[${i}].font ha de dir d’on ix l’avís.`);
  });
  if (eixida.informe !== undefined && typeof eixida.informe !== 'string') errors.push('informe, si hi és, ha de ser text.');
  return errors;
}

/* La bandera d'una eixida: la severitat més alta dels avisos. */
export function banderaDe(avisos) {
  if (avisos.some((a) => a.severitat === 'roja')) return 'roja';
  if (avisos.some((a) => a.severitat === 'groga')) return 'groga';
  return 'cap';
}
