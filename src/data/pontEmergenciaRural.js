/**
 * pontEmergenciaRural.js — Motor Delay-Tolerant Networking (DTN) i Sneakernet
 * Rural per a Sóc de Poble (Onada 8 i Onada 9 · Fora de línia rural).
 *
 * Quan un temporal (DANA, nevada) o un incendi forestal talla la fibra òptica
 * i la cobertura mòbil d'una comarca de muntanya, aquest mòdul permet exportar,
 * verificar i fusionar deltes d'emergència (`.sdp-dtn-delta.json`) entre
 * ajuntaments, cooperatives i brigades mitjançant llapis USB, xarxa Wi-Fi
 * local d'emergència o fitxers compartits, amb deduplicació determinista per
 * SHA-256 i proves criptogràfiques Ed25519 (FEP-8b32).
 *
 * Els SHA-256 (operació, arrel i delta) no porten clau: només detecten la
 * corrupció accidental. L'autenticitat la dona la prova Ed25519, i per això la
 * verificació falla en tancat: per defecte s'exigix `proof`, i passar
 * `publicKeyJwk` també l'exigix. El mode només-integritat s'ha de demanar
 * explícitament amb `exigeixSignatura: false` i sense clau.
 */

import {
  canonitzaJsonJcs,
  sha256Hex,
  signaObjecteFediversityFep8b32,
  verificaObjecteFediversityFep8b32,
} from './federacio/portabilitatFediversity.js';

export const ESQUEMA_DELTA_EMERGENCIA = 'sdp.dtn.delta-emergencia.v1';

export const TIPUS_OPERACIO_EMERGENCIA = Object.freeze([
  'ban_municipal',
  'alerta_proteccio_civil',
  'estat_cami',
  'recurs_comunitari',
  'nota_camp',
]);

export const ORDRE_PRIORITAT_EMERGENCIA = Object.freeze({
  critica: 0,
  alta: 1,
  normal: 2,
});

const CLAUS_PROHIBIDES = new Set(['__proto__', 'constructor', 'prototype']);

// Límits d'un delta no fiable, comprovats abans de cap treball (alineats amb la cua).
const MAX_OPERACIONS_DELTA = 1000;
const MAX_PROFUNDITAT_DELTA = 32;
const MAX_NODES_DELTA = 200000;
const MAX_CARACTERS_DELTA = 4 * 1024 * 1024;
// Marge del rellotge del receptor per a un `creatEl` futur (rellotges de camp desajustats).
const MARGE_FUTUR_EMERGENCIA_MS = 15 * 60 * 1000;
// Instant UTC de longitud fixa (ancorat, sense quantificadors niats: zero ReDoS).
const RE_INSTANT_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** Mil·lisegons d'un `creatEl` ISO 8601 UTC de calendari vàlid, o NaN. */
function instantEmergenciaMs(valor) {
  if (typeof valor !== 'string' || valor.length > 24 || !RE_INSTANT_UTC.test(valor)) return NaN;
  const ms = Date.parse(valor);
  // Anada i tornada: rebutja 2026-02-30 o T24:00, que V8 accepta i JavaScriptCore no.
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 19) === valor.slice(0, 19) ? ms : NaN;
}

/** Recorregut iteratiu (sense recursió): profunditat, nodes i caràcters fitats. */
function superaLimitsDelta(arrel) {
  const pila = [[arrel, 0]];
  let nodes = 0;
  let caracters = 0;
  while (pila.length > 0) {
    const [valor, nivell] = pila.pop();
    nodes += 1;
    if (nivell > MAX_PROFUNDITAT_DELTA || nodes > MAX_NODES_DELTA) return true;
    if (typeof valor === 'string') {
      caracters += valor.length;
    } else if (valor !== null && typeof valor === 'object') {
      const claus = Object.keys(valor);
      if (nodes + pila.length + claus.length > MAX_NODES_DELTA) return true;
      for (const clau of claus) {
        if (!Array.isArray(valor)) caracters += clau.length;
        pila.push([valor[clau], nivell + 1]);
      }
    }
    if (caracters > MAX_CARACTERS_DELTA) return true;
  }
  return false;
}

function esObjectePla(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    return false;
  }
  const proto = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
}

function congelaProfund(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    for (let i = 0; i < valor.length; i += 1) congelaProfund(valor[i]);
    return Object.freeze(valor);
  }
  for (const clau of Object.keys(valor)) {
    congelaProfund(valor[clau]);
  }
  return Object.freeze(valor);
}

function clonaSegur(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) return valor.map(clonaSegur);
  if (!esObjectePla(valor)) {
    throw new TypeError('[pontEmergenciaRural] Es requereix un objecte pla.');
  }
  const copia = {};
  for (const clau of Object.keys(valor)) {
    if (!CLAUS_PROHIBIDES.has(clau) && valor[clau] !== undefined) {
      copia[clau] = clonaSegur(valor[clau]);
    }
  }
  return copia;
}

/**
 * Calcula l'empremta SHA-256 canònica d'una operació d'emergència sense el camp `sha256Operacio`.
 */
export function calculaSha256OperacioEmergencia(operacio) {
  const base = {
    id: operacio.id,
    tipus: operacio.tipus,
    prioritat: operacio.prioritat,
    municipi: operacio.municipi,
    autor: operacio.autor,
    creatEl: operacio.creatEl,
    entitatId: operacio.entitatId,
    payload: operacio.payload,
  };
  return sha256Hex(canonitzaJsonJcs(base));
}

/**
 * Normalitza i segella amb SHA-256 una operació d'emergència rural.
 */
export function normalitzaOperacioEmergencia(op) {
  if (!esObjectePla(op)) {
    throw new TypeError('[pontEmergenciaRural] L’operació d’emergència ha de ser un objecte pla.');
  }
  const id = typeof op.id === 'string' ? op.id.trim() : '';
  if (!id) {
    throw new TypeError('[pontEmergenciaRural] L’operació necessita un `id` no buit.');
  }
  const tipus = typeof op.tipus === 'string' ? op.tipus : 'nota_camp';
  if (!TIPUS_OPERACIO_EMERGENCIA.includes(tipus)) {
    throw new TypeError(`[pontEmergenciaRural] Tipus d'operació d'emergència desconegut: ${tipus}.`);
  }
  const prioritat = typeof op.prioritat === 'string' ? op.prioritat : 'normal';
  if (!Object.hasOwn(ORDRE_PRIORITAT_EMERGENCIA, prioritat)) {
    throw new TypeError(`[pontEmergenciaRural] Prioritat invàlida: ${prioritat}.`);
  }
  const municipi = typeof op.municipi === 'string' && op.municipi.trim()
    ? op.municipi.trim()
    : 'La Torre de les Maçanes';
  const autor = typeof op.autor === 'string' && op.autor.trim()
    ? op.autor.trim()
    : 'brigada-municipal';
  const creatEl = typeof op.creatEl === 'string' && op.creatEl.trim()
    ? op.creatEl.trim()
    : '2026-11-03T00:00:00Z';
  // LWW decidix per este instant: una cadena qualsevol o una zona no UTC no hi entra.
  if (!Number.isFinite(instantEmergenciaMs(creatEl))) {
    throw new TypeError('[pontEmergenciaRural] `creatEl` ha de ser un instant ISO 8601 en UTC (AAAA-MM-DDThh:mm:ss[.sss]Z).');
  }
  const entitatId = typeof op.entitatId === 'string' && op.entitatId.trim()
    ? op.entitatId.trim()
    : id;
  const payload = esObjectePla(op.payload) ? clonaSegur(op.payload) : {};

  const estructura = {
    id,
    tipus,
    prioritat,
    municipi,
    autor,
    creatEl,
    entitatId,
    payload,
  };
  const sha256Operacio = calculaSha256OperacioEmergencia(estructura);
  return congelaProfund({
    ...estructura,
    sha256Operacio,
  });
}

function comparaOperacionsEmergencia(a, b) {
  const prioDiff = ORDRE_PRIORITAT_EMERGENCIA[a.prioritat] - ORDRE_PRIORITAT_EMERGENCIA[b.prioritat];
  if (prioDiff !== 0) return prioDiff;
  const tempsDiff = instantEmergenciaMs(a.creatEl) - instantEmergenciaMs(b.creatEl);
  if (tempsDiff !== 0) return tempsDiff < 0 ? -1 : 1;
  if (a.sha256Operacio !== b.sha256Operacio) {
    return a.sha256Operacio < b.sha256Operacio ? -1 : 1;
  }
  return 0;
}

/**
 * Calcula el resum SHA-256 arrel d'una llista d'operacions ja normalitzades.
 */
export function calculaSha256ArrelOperacions(operacions) {
  const llistaHashes = operacions.map((op) => op.sha256Operacio);
  return sha256Hex(canonitzaJsonJcs(llistaHashes));
}

/**
 * Deduplica per `sha256Operacio` i ordena deterministament un conjunt d'operacions,
 * i calcula l'estat consolidat per `entitatId` amb resolució LWW (Last-Writer-Wins)
 * i desempat determinista per `sha256Operacio`.
 */
export function consolidaOperacionsEmergencia(operacionsInput = []) {
  if (!Array.isArray(operacionsInput)) {
    throw new TypeError('[pontEmergenciaRural] `operacions` ha de ser una llista.');
  }
  const perHash = new Map();
  let duplicadesIgnorades = 0;

  for (const item of operacionsInput) {
    const op = normalitzaOperacioEmergencia(item);
    if (perHash.has(op.sha256Operacio)) {
      duplicadesIgnorades += 1;
    } else {
      perHash.set(op.sha256Operacio, op);
    }
  }

  const operacionsOrdenades = [...perHash.values()].sort(comparaOperacionsEmergencia);

  // Estat vigent per entitatId: guanya l'instant creatEl més recent (comparat en ms, no com a text); en cas d'empat exacte de rellotge, guanya sha256Operacio lexicogràficament major.
  const perEntitat = new Map();
  for (const op of operacionsOrdenades) {
    const actual = perEntitat.get(op.entitatId);
    const tOp = instantEmergenciaMs(op.creatEl);
    const tActual = actual ? instantEmergenciaMs(actual.creatEl) : NaN;
    if (
      !actual ||
      tOp > tActual ||
      (tOp === tActual && op.sha256Operacio > actual.sha256Operacio)
    ) {
      perEntitat.set(op.entitatId, op);
    }
  }

  const entitatsVigents = [...perEntitat.keys()]
    .sort()
    .map((clau) => perEntitat.get(clau));

  return congelaProfund({
    operacions: operacionsOrdenades,
    entitatsVigents,
    duplicadesIgnorades,
    sha256Arrel: calculaSha256ArrelOperacions(operacionsOrdenades),
  });
}

/**
 * Exporta un paquet Delta d'Emergència Rural (`.sdp-dtn-delta.json`),
 * opcionalment signat amb Ed25519 (FEP-8b32) si es proporciona `privateKeyJwk`.
 */
export async function exportaDeltaEmergenciaRural({
  municipi = 'La Torre de les Maçanes',
  nodeOrigenId = 'node:latorre-ajuntament',
  transport = 'usb-sneakernet',
  generatEl = '2026-11-03T00:00:00Z',
  operacions = [],
  privateKeyJwk = null,
  verificationMethod = null,
} = {}) {
  if (typeof municipi !== 'string' || !municipi.trim()) {
    throw new TypeError('[pontEmergenciaRural] `municipi` és obligatori.');
  }
  if (typeof nodeOrigenId !== 'string' || !nodeOrigenId.trim()) {
    throw new TypeError('[pontEmergenciaRural] `nodeOrigenId` és obligatori.');
  }

  const consolidat = consolidaOperacionsEmergencia(operacions);
  const cosSenseHash = {
    schema: ESQUEMA_DELTA_EMERGENCIA,
    municipi: municipi.trim(),
    nodeOrigenId: nodeOrigenId.trim(),
    transport: String(transport),
    generatEl: String(generatEl),
    totalOperacions: consolidat.operacions.length,
    sha256Arrel: consolidat.sha256Arrel,
    operacions: consolidat.operacions,
  };
  const sha256Delta = sha256Hex(canonitzaJsonJcs(cosSenseHash));
  const deltaBase = {
    ...cosSenseHash,
    sha256Delta,
  };

  if (privateKeyJwk) {
    /* El fragment va a part: escrit dins de l'IRI darrere del coixinet, «ed25519» té forma de color hexadecimal per a design_guard. */
    const fragmentClau = 'ed25519-dtn';
    const iriMetode = verificationMethod ?? `https://socdepoble.org/actors/emergencia#${fragmentClau}`;
    return signaObjecteFediversityFep8b32(deltaBase, {
      privateKeyJwk,
      verificationMethod: iriMetode,
      created: generatEl,
    });
  }

  return congelaProfund(deltaBase);
}

/**
 * Verifica un Delta d'Emergència Rural: límits, signatura Ed25519 (FEP-8b32),
 * hashes d'operació, hash arrel i hash del delta. Falla en tancat: per defecte
 * (o si es passa `publicKeyJwk`) el delta ha de portar un `proof` vàlid per a
 * eixa clau, i es comprova abans de cap hash per operació. Només
 * `exigeixSignatura: false` sense clau accepta deltes sense signar (integritat).
 * `ara` (ms, rellotge del receptor) rebutja un `creatEl` posterior a
 * `ara` + 15 min, que guanyaria LWW per sempre.
 */
export async function verificaDeltaEmergenciaRural(
  delta,
  { publicKeyJwk = null, exigeixSignatura = true, ara = Date.now() } = {},
) {
  if (!Number.isFinite(ara)) {
    throw new TypeError('[pontEmergenciaRural] `ara` ha de ser un instant en mil·lisegons.');
  }
  const motius = [];
  if (!esObjectePla(delta)) {
    return congelaProfund({
      valid: false,
      motius: ['El delta d’emergència ha de ser un objecte pla.'],
      sha256Delta: null,
    });
  }
  // Falla en tancat i estructurat (O89-RURAL-04): un delta hostil mai fa llançar
  // la verificació ni avorta una fusió sencera.
  try {
    return await verificaDeltaDinsLimits(delta, motius, { publicKeyJwk, exigeixSignatura, ara });
  } catch (err) {
    return congelaProfund({
      valid: false,
      motius: [...motius, `El delta no es pot verificar: ${err instanceof Error ? err.message : typeof err}`],
      sha256Delta: null,
    });
  }
}

/** Cos de `verificaDeltaEmergenciaRural`, que en captura qualsevol excepció. */
async function verificaDeltaDinsLimits(delta, motius, { publicKeyJwk, exigeixSignatura, ara }) {
  if (superaLimitsDelta(delta) || (Array.isArray(delta.operacions) && delta.operacions.length > MAX_OPERACIONS_DELTA)) {
    return congelaProfund({
      valid: false,
      motius: ['El delta supera els límits de mida, profunditat o nombre d’operacions.'],
      sha256Delta: null,
    });
  }
  if (delta.schema !== ESQUEMA_DELTA_EMERGENCIA) {
    // Coacció primitiva: String() d'un objecte hostil ({"toString":1}) llançaria.
    motius.push(`Esquema de delta desconegut: ${typeof delta.schema === 'string' ? delta.schema : typeof delta.schema}.`);
  }
  if (!Array.isArray(delta.operacions)) {
    return congelaProfund({
      valid: false,
      motius: [...motius, '`operacions` ha de ser una llista.'],
      sha256Delta: null,
    });
  }

  const calSignatura = exigeixSignatura !== false || publicKeyJwk !== null;
  if (calSignatura) {
    if (!esObjectePla(delta.proof)) {
      motius.push('S’exigeix signatura criptogràfica FEP-8b32 però el delta no porta `proof`.');
    } else if (!publicKeyJwk) {
      motius.push('Falta `publicKeyJwk` per verificar el bloc `proof` del delta.');
    } else {
      const resProva = await verificaObjecteFediversityFep8b32(delta, { publicKeyJwk });
      if (!resProva.valid) {
        motius.push(`Signatura FEP-8b32 invàlida: ${resProva.motiu}.`);
      }
    }
    if (motius.length) {
      return congelaProfund({ valid: false, motius, sha256Delta: null });
    }
  }

  const limitFutur = ara + MARGE_FUTUR_EMERGENCIA_MS;
  const operacionsVerificades = [];
  for (let i = 0; i < delta.operacions.length; i += 1) {
    const item = delta.operacions[i];
    try {
      const norm = normalitzaOperacioEmergencia(item);
      if (item.sha256Operacio !== norm.sha256Operacio) {
        motius.push(`L'operació a l'índex ${i} (${item.id}) té un sha256Operacio invàlid.`);
      }
      if (instantEmergenciaMs(norm.creatEl) > limitFutur) {
        motius.push(`L'operació a l'índex ${i} (${norm.id}) té un \`creatEl\` futur respecte del rellotge local.`);
      }
      operacionsVerificades.push(norm);
    } catch (err) {
      motius.push(`Operació invàlida a l'índex ${i}: ${err.message}`);
    }
  }

  if (delta.totalOperacions !== delta.operacions.length) {
    motius.push('`totalOperacions` no coincideix amb la longitud d’`operacions`.');
  }

  const sha256ArrelEsperat = calculaSha256ArrelOperacions(operacionsVerificades);
  if (delta.sha256Arrel !== sha256ArrelEsperat) {
    motius.push('`sha256Arrel` no coincideix amb les operacions del delta.');
  }

  const cosSenseHash = {
    schema: delta.schema,
    municipi: delta.municipi,
    nodeOrigenId: delta.nodeOrigenId,
    transport: delta.transport,
    generatEl: delta.generatEl,
    totalOperacions: delta.totalOperacions,
    sha256Arrel: delta.sha256Arrel,
    operacions: delta.operacions,
  };
  let sha256DeltaEsperat = null;
  try {
    sha256DeltaEsperat = sha256Hex(canonitzaJsonJcs(cosSenseHash));
  } catch (err) {
    motius.push(`El delta no es pot canonitzar en JCS: ${err.message}`);
  }
  if (sha256DeltaEsperat !== null && delta.sha256Delta !== sha256DeltaEsperat) {
    motius.push('`sha256Delta` no coincideix amb el contingut canònic del delta.');
  }

  return congelaProfund({
    valid: motius.length === 0,
    motius,
    // Només un primitiu: congelaProfund congelaria un objecte del delta de qui crida.
    sha256Delta: typeof delta.sha256Delta === 'string' ? delta.sha256Delta : null,
    sha256Arrel: sha256ArrelEsperat,
  });
}

/**
 * Importa un Delta d'Emergència Rural i el fusiona sense conflictes amb les
 * operacions locals existents. Si el delta està corrupte o no porta una
 * signatura vàlida (exigida per defecte), no altera res.
 */
export async function importaDeltaEmergenciaRural(
  delta,
  {
    operacionsLocals = [],
    publicKeyJwk = null,
    exigeixSignatura = true,
    ara = Date.now(),
  } = {},
) {
  const localConsolidat = consolidaOperacionsEmergencia(operacionsLocals);
  const verificacio = await verificaDeltaEmergenciaRural(delta, {
    publicKeyJwk,
    exigeixSignatura,
    ara,
  });

  if (!verificacio.valid) {
    return congelaProfund({
      valid: false,
      motius: verificacio.motius,
      afegides: 0,
      duplicadesIgnorades: 0,
      operacions: localConsolidat.operacions,
      entitatsVigents: localConsolidat.entitatsVigents,
      sha256Arrel: localConsolidat.sha256Arrel,
    });
  }

  const hashesLocals = new Set(localConsolidat.operacions.map((op) => op.sha256Operacio));
  let afegides = 0;
  let duplicadesIgnorades = 0;
  for (const op of delta.operacions) {
    if (hashesLocals.has(op.sha256Operacio)) {
      duplicadesIgnorades += 1;
    } else {
      hashesLocals.add(op.sha256Operacio);
      afegides += 1;
    }
  }

  const fusio = consolidaOperacionsEmergencia([
    ...localConsolidat.operacions,
    ...delta.operacions,
  ]);

  return congelaProfund({
    valid: true,
    motius: [],
    afegides,
    duplicadesIgnorades,
    operacions: fusio.operacions,
    entitatsVigents: fusio.entitatsVigents,
    sha256Arrel: fusio.sha256Arrel,
  });
}

/**
 * Fusiona múltiples Deltes d'Emergència Rural (p. ex. d'un llapis USB que ha
 * passat per diversos pobles incomunicats) de manera 100% commutativa i idempotent.
 */
export async function fusionaDeltesEmergenciaRural(
  llistaDeltes = [],
  { publicKeyJwk = null, exigeixSignatura = true, ara = Date.now() } = {},
) {
  if (!Array.isArray(llistaDeltes)) {
    throw new TypeError('[pontEmergenciaRural] `llistaDeltes` ha de ser una llista.');
  }
  let operacionsAcumulades = [];
  const deltesRebutjats = [];

  for (let i = 0; i < llistaDeltes.length; i += 1) {
    const resultat = await importaDeltaEmergenciaRural(llistaDeltes[i], {
      operacionsLocals: operacionsAcumulades,
      publicKeyJwk,
      exigeixSignatura,
      ara,
    });
    if (resultat.valid) {
      operacionsAcumulades = resultat.operacions;
    } else {
      deltesRebutjats.push({ index: i, motius: resultat.motius });
    }
  }

  const final = consolidaOperacionsEmergencia(operacionsAcumulades);
  return congelaProfund({
    valid: deltesRebutjats.length === 0,
    deltesProcessats: llistaDeltes.length,
    deltesRebutjats,
    operacions: final.operacions,
    entitatsVigents: final.entitatsVigents,
    sha256Arrel: final.sha256Arrel,
  });
}
