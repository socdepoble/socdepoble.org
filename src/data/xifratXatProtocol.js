/**
 * xifratXatProtocol.js — la màquina d'estats del protocol `sdp-xat-v1` (P1-12 /
 * IDEA-19, pas 7 de §16 del disseny final: `_investigacio_ia_de_poble/
 * 261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` §4.3-§4.10 i §8.6, amb les
 * esmenes `esmenes_qa_261029.md` §3 (QA-E07, àmbit d'actor), §4 (QA-S01, SAS amb
 * compromís), §6 (QA-S03, l'AAD porta tots els camps que lliguen), §7 (QA-S04,
 * estats finals explícits de la cadena), QA-S05 (navigator.locks) i QA-S06
 * (sanejament a text pla després de desxifrar)).
 *
 * Qui fa què: xifratXatCripto.js té les primitives, xifratXatFormats.js els bytes
 * de cada format, xifratXatMagatzem.js on dormen les claus, i ací va la lògica
 * que els lliga: qui pot signar què, quin `kid` està fixat, si una època
 * encadena amb l'anterior i quin membre pot derivar la `CK`. Res d'ací té cap
 * consumidor encara, no activa cap bandera i no importa res de l'app: tot entra
 * per ports injectats (`cripto`, `rellotge`, `locks`, `ambit`, `purificador`) i
 * cap funció pren cap global. El magatzem no s'importa: l'estat és un objecte
 * pla que qui crida desa i torna a carregar.
 *
 * Què hi ha:
 *   · identitat (§4.3): les dues parelles, el `kid` i la declaració SDPK amb
 *     l'autofirma i la firma de continuïtat; la classificació d'un canvi de clau
 *     (suau, fort, igual, nova; §4.4) i la regla de bifurcació: dos SDPK amb el
 *     mateix kidAnterior no nul són alarma;
 *   · èpoques (§4.5): la gènesi i la rotació d'un fil (directe, entitat o grup),
 *     un sobre HPKE per membre amb l'info SDPS, el compromís ckCommit, la cadena
 *     (e = última + 1, prevHash, autor membre de l'última vàlida, regles de
 *     membres per tipus de fil, kids fixats) i IS-12: una època invàlida es
 *     marca i la següent la supera; un membre fora d'una època no rep cap sobre
 *     i no pot derivar la `CK` nova;
 *   · missatges (§4.6): `mk` per missatge des de la `CK` i el hash de la
 *     capçalera, farciment en blocs de 256 B, franqueig `tf` dins de l'AAD,
 *     signatura SDPG en entitats i grups, i la recepció en l'ordre de §4.6.4
 *     (forma, kid, capçalera, desxifrar, farciment, càrrega, franqueig, firma)
 *     amb la repetició per id i la marca «clau antiga» (§4.10, §4.6.4.6);
 *   · adjunts (§4.7): `FK` per fitxer, Padmé, AAD SDPA i el hash del blob
 *     comprovat abans de desxifrar;
 *   · equip signat d'una entitat (§4.8): versions encadenades que només una
 *     propietària pot avançar;
 *   · SAS del parell (§4.4 i esmenes §4): 12 xifres en 4 grups de 3 derivades del
 *     número de seguretat (60 xifres) i d'una transcripció ordenada, amb el
 *     compromís previ al nonce de qui comença;
 *   · la guarda d'àmbit (§8.6, QA-E07): captura {ambitEstable, actorKey,
 *     generacio} en entrar i torna `ambit-canviat` després de qualsevol await
 *     en què l'actor haja canviat;
 *   · els panys (QA-S05): navigator.locks si hi és, una cua en memòria si no;
 *   · el sanejament (QA-S06): el text desxifrat passa a text pla sempre, mai
 *     abans de xifrar.
 * Una fallada és un Error amb `codi` estable (CODI), en minúscules i guions; els
 * codis dels mòduls de baix (FORMAT_INVALID, SOBRE_INVALID…) hi viatgen com a
 * `cause`. El text que ve de fora no entra mai als missatges d'error.
 */
import { MIME_XAT } from './xatMultimedia.js';
import {
  BYTES_CLAU, BYTES_IV, aleatori, ajunta, bytesIguals, derivaBitsHkdf, derivaClauAesHkdf, desxifraAesGcm, exigixCripto, exportaPublica,
  farcixPadme, generaParellaDh, generaParellaSignatura, hkdfExpand, hkdfExtract, hmacSha256, importaClauHkdf, infoHkdf,
  llevaFarcimentPadme, numeroSeguretatParell, obriBaseAClauHkdf, segellaBase, sha256, signa, uuid16, verificaSignatura, xifraAesGcm
} from './xifratXatCripto.js';
import {
  BYTES_HASH, BYTES_KID, BYTES_NONCE_FRANQUEIG, CLASSE_ADJUNT, MAXIM_CLAR_ADJUNT, MAX_EPOCA, MAX_MEMBRES_EPOCA, MAX_MEMBRES_EQUIP,
  MOTIU_EPOCA, ROL_EPOCA, ROL_EQUIP, TIPUS_FIL, construeixAadAdjunt, construeixCapcalera, construeixCarrega, construeixCos,
  construeixDeclaracioClau, construeixEntradaFirmaMissatge, construeixEntradaFranqueig, construeixEpoca, construeixEquip,
  construeixInfoSobre, desfarceixCarrega, esMidaXifratMissatge, farceixCarrega, hashCapcalera, hashCos, hashEpoca, hashEquip,
  hashSobre, infoClauAdjunt, infoClauMissatge, infoCompromisEpoca, kidDe, kidQuadra, llegixCarrega, llegixDeclaracioClau, llegixEpoca,
  llegixEquip
} from './xifratXatFormats.js';

export { MAX_MEMBRES_EPOCA, MAX_MEMBRES_EQUIP, MOTIU_EPOCA, ROL_EPOCA, ROL_EQUIP, TIPUS_FIL } from './xifratXatFormats.js';

/* Els codis d'error del protocol, estables i en minúscules (el de QA-E07 el fixa l'esmena). */
export const CODI = Object.freeze({
  ambitCanviat: 'ambit-canviat', senseAmbit: 'sense-ambit',
  declaracioInvalida: 'declaracio-invalida', firmaInvalida: 'firma-invalida', kidNoQuadra: 'kid-no-quadra', kidNoFixat: 'kid-no-fixat',
  bifurcacio: 'bifurcacio',
  massaMembres: 'massa-membres', membresInvalids: 'membres-invalids', membresImmutables: 'membres-immutables',
  autorNoAutoritzat: 'autor-no-autoritzat', membreForaDEquip: 'membre-fora-d-equip', equipNoVigent: 'equip-no-vigent',
  epocaForaDOrdre: 'epoca-fora-d-ordre', epocaConflicte: 'epoca-conflicte', epocaDesconeguda: 'epoca-desconeguda', senseEpoca: 'sense-epoca',
  sobreAbsent: 'sobre-absent', sobreInvalid: 'sobre-invalid', compromisInvalid: 'compromis-invalid',
  filaInvalida: 'fila-invalida', contingutInvalid: 'contingut-invalid', xifratManipulat: 'xifrat-manipulat', farcimentInvalid: 'farciment-invalid',
  carregaInvalida: 'carrega-invalida', franqueigInvalid: 'franqueig-invalid', repeticio: 'repeticio',
  adjuntInvalid: 'adjunt-invalid', adjuntManipulat: 'adjunt-manipulat', adjuntIncoherent: 'adjunt-incoherent',
  equipInvalid: 'equip-invalid', versioForaDOrdre: 'versio-fora-d-ordre',
  sasOrdre: 'sas-ordre', sasCompromis: 'sas-compromis', sasInvalid: 'sas-invalid'
});
const CODIS = new Set(Object.values(CODI));

/* §4.4: com es classifica la declaració nova d'un contacte respecte de la fixada. */
export const CANVI_CLAU = Object.freeze({ nova: 'nova', igual: 'igual', suau: 'suau', fort: 'fort' });
/* §4.4 (esmena 261029): després d'una recuperació social o d'un «No sóc jo», 7 dies de canvis forts. */
export const FINESTRA_RECUPERACIO_MS = 7 * 24 * 60 * 60 * 1000;
/* El SAS del parell: 12 xifres en 4 grups de 3 (pla 261029_0216, pas 6.3), nonces de 32 B. */
export const SAS_XIFRES = 12;
export const SAS_GRUP = 3;
export const BYTES_NONCE_SAS = 32;
export const ROL_SAS = Object.freeze({ compromet: 'compromet', respon: 'respon' });
export const FASE_SAS = Object.freeze({ inici: 'inici', compromes: 'compromes', respost: 'respost', acabat: 'acabat', rebutjat: 'rebutjat' });
/* QA-E07: l'actor personal quan no hi ha cap entitat. */
export const ACTOR_PERSONAL = 'personal';
/* QA-S05: tots els panys del protocol van amb este prefix. */
export const PREFIX_PANY = 'sdp-xat-v1';

const CLASSE_DEL_TIPUS = Object.freeze({ imatge: CLASSE_ADJUNT.foto, veu: CLASSE_ADJUNT.veu, video: CLASSE_ADJUNT.video });
const TIPUS_FIL_VALIDS = Object.freeze(Object.values(TIPUS_FIL));
const MOTIUS_VALIDS = Object.freeze(Object.values(MOTIU_EPOCA));

/* ── Errors ────────────────────────────────────────────────────────────── */

/** Un error del protocol: `codi` de CODI i, si ve d'un mòdul de baix, la seua causa. */
export function errorProtocol(codi, missatge, cause) {
  if (!CODIS.has(codi)) throw new TypeError('Un codi d’error del protocol ha de ser de CODI.');
  const error = cause === undefined ? new Error(missatge) : new Error(missatge, { cause });
  error.codi = codi;
  return error;
}

export const esErrorProtocol = (error) => error instanceof Error && CODIS.has(error.codi);

/* Un error d'un mòdul de baix (o qualsevol altre) embolcallat amb un codi del protocol; els del protocol passen tal qual. */
function embolcalla(error, codi, missatge) {
  return esErrorProtocol(error) ? error : errorProtocol(codi, missatge, error);
}

const ambCodi = (fn, codi, missatge) => {
  try {
    return fn();
  } catch (error) {
    throw embolcalla(error, codi, missatge);
  }
};

/* ── Bytes i formes ────────────────────────────────────────────────────── */

const esBytes = (valor) => Object.prototype.toString.call(valor) === '[object Uint8Array]';
const esBytesDe = (valor, mida) => esBytes(valor) && valor.length === mida;
const copia = (bytes) => Uint8Array.from(bytes);
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const ascii = (text) => new TextEncoder().encode(text);
const esUuid = (valor) => {
  try {
    uuid16(valor);
    return true;
  } catch {
    return false;
  }
};
/* Dos hash opcionals (null quan no n'hi ha) iguals. */
const hashIgual = (a, b) => (a === null || b === null ? a === b : bytesIguals(a, b));

function comparaBytes(a, b) {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/* QA-E07: cada await del protocol passa per ací; `vigent` torna a comprovar l'àmbit en tornar. */
function ambPas(vigent) {
  if (vigent !== null && typeof vigent !== 'function') throw new TypeError('`vigent` és una funció que llança si l’àmbit ha canviat.');
  return async (promesa) => {
    const resultat = await promesa;
    if (vigent !== null) vigent();
    return resultat;
  };
}

/* ── QA-E07 · L'àmbit d'actor (§8.6, esmenes §3) ───────────────────────── */

/** actorKey = `${backendId}|${userId}|${orgId ?? 'personal'}`: cap tros porta «|» ni és buit. */
export function actorKeyDe({ backendId, userId, orgId = null } = {}) {
  const tros = (valor, nom) => {
    if (typeof valor !== 'string' || valor.length === 0 || valor.includes('|')) throw new TypeError(`${nom} és un text no buit sense «|».`);
    return valor;
  };
  const org = orgId === null || orgId === undefined ? ACTOR_PERSONAL : tros(orgId, 'orgId');
  return `${tros(backendId, 'backendId')}|${tros(userId, 'userId')}|${org}`;
}

/** ambitEstable = JSON.stringify([backendScope, joId, actorKey]), la mateixa forma de XatContext.jsx:609. */
export function ambitEstableDe({ backendScope, joId, actorKey } = {}) {
  if (typeof backendScope !== 'string' || !esUuid(joId) || typeof actorKey !== 'string' || actorKey.length === 0) {
    throw new TypeError('L’àmbit estable porta backendScope, joId (uuid) i actorKey.');
  }
  return JSON.stringify([backendScope, joId, actorKey]);
}

/**
 * La guarda d'àmbit. `ambit` és el port que torna el vigent ({ambitEstable,
 * actorKey, generacio}) o null quan no n'hi ha cap fixat (SENSE_AMBIT: falla
 * tancat). Sense port (null), la guarda no vigila res: és per a les proves de
 * les primitives del protocol, no per a l'app.
 */
export function creaGuardaAmbit(ambit = null) {
  if (ambit !== null && typeof ambit !== 'function') throw new TypeError('El port d’àmbit és una funció.');
  const llig = () => {
    const v = ambit();
    if (!esObjecte(v) || typeof v.ambitEstable !== 'string' || typeof v.actorKey !== 'string' || !Number.isSafeInteger(v.generacio)) {
      throw errorProtocol(CODI.senseAmbit, 'No hi ha cap àmbit fixat: el xat xifrat falla tancat.');
    }
    return Object.freeze({ ambitEstable: v.ambitEstable, actorKey: v.actorKey, generacio: v.generacio });
  };
  const captura = () => (ambit === null ? null : llig());
  const esVigent = (c) => {
    if (c === null) return ambit === null;
    try {
      const v = llig();
      return v.ambitEstable === c.ambitEstable && v.actorKey === c.actorKey && v.generacio === c.generacio;
    } catch {
      return false;
    }
  };
  const exigixVigent = (c) => {
    if (!esVigent(c)) throw errorProtocol(CODI.ambitCanviat, 'L’actor o la persona han canviat mentre l’operació era en vol: es descarta.');
  };
  /* L'operació rep `vigent` (per a després de cada await) i es torna a comprovar en acabar. */
  const ambAmbit = async (fn) => {
    const c = captura();
    const vigent = c === null ? null : () => exigixVigent(c);
    const resultat = await fn(vigent, c);
    if (vigent !== null) vigent();
    return resultat;
  };
  return Object.freeze({ captura, esVigent, exigixVigent, ambAmbit });
}

/* ── QA-S05 · Panys: navigator.locks o una cua en memòria ──────────────── */

/** El pany d'un fil (les mutacions de la seua cadena). */
export function nomPanyFil(fil) {
  if (!esUuid(fil)) throw new TypeError('El fil és un uuid.');
  return `${PREFIX_PANY}/fil/${fil}`;
}

/** El pany d'una identitat (el desbloqueig i la publicació, entre pestanyes). */
export function nomPanyIdentitat(clauIdentitat) {
  if (typeof clauIdentitat !== 'string' || clauIdentitat.length === 0) throw new TypeError('La clauIdentitat és un text.');
  return `${PREFIX_PANY}/identitat/${clauIdentitat}`;
}

/**
 * `locks` té la forma de navigator.locks ({ request(nom, cb) }); sense port, una
 * cua per nom en memòria (una sola pestanya). Les mutacions d'època i el
 * desbloqueig passen per ambPany(nom, fn): la segona crida espera la primera.
 */
export function creaPanys({ locks = null } = {}) {
  if (locks !== null && typeof locks?.request !== 'function') throw new TypeError('El port de panys té request(nom, cb).');
  const cues = new Map();
  const enMemoria = (nom, fn) => {
    const anterior = cues.get(nom) ?? Promise.resolve();
    const propi = anterior.then(() => fn());
    const cua = propi.then(() => undefined, () => undefined).then(() => {
      if (cues.get(nom) === cua) cues.delete(nom);
    });
    cues.set(nom, cua);
    return propi;
  };
  const ambPany = (nom, fn) => {
    if (typeof nom !== 'string' || !nom.startsWith(`${PREFIX_PANY}/`)) throw new TypeError('Un pany del protocol comença per sdp-xat-v1/.');
    if (typeof fn !== 'function') throw new TypeError('ambPany rep una funció.');
    return locks === null ? enMemoria(nom, fn) : Promise.resolve(locks.request(nom, () => fn()));
  };
  return Object.freeze({ ambPany, enMemoria: locks === null });
}

/* ── QA-S06 · Text pla després de desxifrar ────────────────────────────── */

/* El que un analitzador d'HTML prendria per etiqueta: «<» seguit de lletra, «/», «!» o «?» fins al «>»
   (o fins al final si no n'hi ha). Un «<» seguit d'espai o xifra («a < b», «<3») és text. */
const COMENTARI_HTML = /<!--[\s\S]*?(?:-->|$)/g;
const ETIQUETA_AMB_CONTINGUT = /<(script|style|iframe|object|embed|template|noscript|textarea|title|xmp|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const ETIQUETA_HTML = /<\/?[a-z!?][^>]*>?/gi;
/* Els controls C0 i C1 fora de la tabulació i el salt de línia (els únics que admet `cos`, §4.6.1). */
const CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
/* El que la serialització d'un node de text escapa (i només això): es desfà després de DOMPurify. */
const ENTITATS_TEXT = Object.freeze({ amp: '&', lt: '<', gt: '>', nbsp: ' ' });
const OPCIONS_PURIFICADOR = Object.freeze({ ALLOWED_TAGS: Object.freeze([]), ALLOWED_ATTR: Object.freeze([]), KEEP_CONTENT: true });

const esPurificadorUsable = (purificador) => purificador !== null && purificador !== undefined
  && typeof purificador.sanitize === 'function' && purificador.isSupported !== false;

/**
 * El text d'un missatge desxifrat, a text pla: fora etiquetes (també les
 * niades: cada volta en lleva una capa fins que no canvia), comentaris,
 * contingut de script i companyia, i controls. Amb un `purificador` usable
 * (DOMPurify amb isSupported), s'hi passa a més
 * `sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })` i es desfan les
 * quatre entitats que la serialització del text crea. Sense DOM (Node, un
 * worker), DOMPurify diu isSupported false i la guarda pura és l'única: per
 * això mai no s'omet. Només s'aplica en rebre, nunca abans de xifrar: el
 * franqueig i la firma cobrixen el text que l'autor ha escrit.
 */
export function sanejaTextPla(text, { purificador = null } = {}) {
  if (typeof text !== 'string') throw new TypeError('El text a sanejar és una cadena.');
  let net = text;
  for (;;) {
    const abans = net;
    net = net.replace(COMENTARI_HTML, '').replace(ETIQUETA_AMB_CONTINGUT, '').replace(ETIQUETA_HTML, '');
    if (net === abans) break;
  }
  net = net.replace(CONTROLS, '');
  if (esPurificadorUsable(purificador)) {
    const eixida = purificador.sanitize(net, { ...OPCIONS_PURIFICADOR });
    if (typeof eixida !== 'string') throw new TypeError('El purificador ha de tornar un text.');
    net = eixida.replace(/&(amp|lt|gt|nbsp);/g, (tot, nom) => ENTITATS_TEXT[nom]);
  }
  return net;
}

/* ── Identitat (§4.3) i canvis de clau (§4.4) ──────────────────────────── */

function exigixIdentitat(jo) {
  if (!esObjecte(jo) || !esUuid(jo.usuari) || !esBytesDe(jo.kid, BYTES_KID) || !esBytes(jo.sigPub) || !esBytes(jo.dhPub)
    || typeof jo.sigPriv !== 'object' || typeof jo.dhPriv !== 'object') {
    throw new TypeError('La identitat porta usuari, kid, sigPub, dhPub, sigPriv i dhPriv.');
  }
  return jo;
}

/** Les públiques d'una identitat, el que es fixa d'un contacte. */
export const publiquesDe = ({ usuari, kid, sigPub, dhPub }) => Object.freeze({ usuari, kid: copia(kid), sigPub: copia(sigPub), dhPub: copia(dhPub) });

/**
 * Una identitat nova: IK_sig i IK_dh no extraïbles (la còpia extraïble és de la
 * recuperació, §5.1), el kid i la declaració SDPK autofirmada; amb `anterior`
 * (la identitat vella del mateix compte), també la firma de continuïtat.
 */
export async function creaIdentitat(cripto, { usuari, creatMs, anterior = null } = {}) {
  exigixCripto(cripto);
  if (!esUuid(usuari)) throw new TypeError('L’usuari és un uuid canònic.');
  if (anterior !== null && (exigixIdentitat(anterior).usuari !== usuari)) throw new TypeError('La identitat anterior és del mateix compte.');
  const sig = await generaParellaSignatura(cripto);
  const dh = await generaParellaDh(cripto);
  const sigPub = await exportaPublica(cripto, sig.publicKey);
  const dhPub = await exportaPublica(cripto, dh.publicKey);
  const kid = await kidDe(cripto, { usuari, sigPub, dhPub });
  const kidAnterior = anterior === null ? null : copia(anterior.kid);
  const declaracio = ambCodi(() => construeixDeclaracioClau({ usuari, sigPub, dhPub, kidAnterior, creatMs }), CODI.declaracioInvalida,
    'La declaració de clau no es pot construir.');
  const autofirma = await signa(cripto, sig.privateKey, declaracio);
  const firmaContinuitat = anterior === null ? null : await signa(cripto, anterior.sigPriv, declaracio);
  return Object.freeze({
    usuari, kid, sigPub, dhPub, sigPriv: sig.privateKey, dhPriv: dh.privateKey, creatMs, kidAnterior, declaracio, autofirma, firmaContinuitat
  });
}

/**
 * Una declaració SDPK d'un contacte, tal com la servix el servidor. Comprova
 * l'autofirma i que el kid servit és el de les claus de veres (IS-03:
 * kid-no-quadra és manipulació). Amb `fixada` ({kid, sigPub, verificat}),
 * classifica el canvi (§4.4): igual; suau si la continuïtat la signa la clau
 * fixada i kidAnterior és el fixat; fort si no, si el contacte està verificat
 * o dins dels 7 dies d'una alerta de recuperació (`alertaRecuperacioMs`, amb
 * el rellotge `ara`).
 */
export async function verificaDeclaracioClau(cripto, {
  declaracio, autofirma, firmaContinuitat = null, kidServit = null, fixada = null, ara = null, alertaRecuperacioMs = null
} = {}) {
  exigixCripto(cripto);
  const v = ambCodi(() => llegixDeclaracioClau(declaracio), CODI.declaracioInvalida, 'La declaració de clau no té la forma SDPK.');
  const kid = await kidDe(cripto, { usuari: v.usuari, sigPub: v.sigPub, dhPub: v.dhPub });
  if (kidServit !== null && !(esBytesDe(kidServit, BYTES_KID) && bytesIguals(kidServit, kid))) {
    throw errorProtocol(CODI.kidNoQuadra, 'El kid servit no és el de les claus declarades: manipulació.');
  }
  if (!(await verificaSignatura(cripto, v.sigPub, autofirma, declaracio))) throw errorProtocol(CODI.firmaInvalida, 'L’autofirma de la declaració no verifica.');
  let canvi = CANVI_CLAU.nova;
  let continuitat = false;
  if (fixada !== null) {
    if (!esObjecte(fixada) || fixada.usuari !== v.usuari || !esBytesDe(fixada.kid, BYTES_KID) || !esBytes(fixada.sigPub)) {
      throw new TypeError('La fixació és {usuari, kid, sigPub, verificat} del mateix compte.');
    }
    if (bytesIguals(fixada.kid, kid)) {
      canvi = CANVI_CLAU.igual;
    } else {
      continuitat = v.kidAnterior !== null && bytesIguals(v.kidAnterior, fixada.kid) && firmaContinuitat !== null
        && await verificaSignatura(cripto, fixada.sigPub, firmaContinuitat, declaracio);
      const enFinestra = alertaRecuperacioMs !== null && Number.isSafeInteger(ara) && Number.isSafeInteger(alertaRecuperacioMs)
        && ara >= alertaRecuperacioMs && ara - alertaRecuperacioMs < FINESTRA_RECUPERACIO_MS;
      canvi = continuitat && fixada.verificat !== true && !enFinestra ? CANVI_CLAU.suau : CANVI_CLAU.fort;
    }
  }
  return Object.freeze({ valors: v, kid, canvi, continuitat });
}

/** §4.4 (esmena 261029): dos SDPK diferents amb el mateix kidAnterior no nul són una bifurcació (alarma i bloqueig). */
export function exigixSenseBifurcacio(declaracions) {
  if (!Array.isArray(declaracions)) throw new TypeError('Calen les declaracions en una llista.');
  const vistes = new Map();
  for (const declaracio of declaracions) {
    const v = ambCodi(() => llegixDeclaracioClau(declaracio), CODI.declaracioInvalida, 'Una declaració no té la forma SDPK.');
    if (v.kidAnterior === null) continue;
    const clau = hex(v.kidAnterior);
    const anterior = vistes.get(clau);
    if (anterior !== undefined && !bytesIguals(anterior, declaracio)) {
      throw errorProtocol(CODI.bifurcacio, 'Dues declaracions de clau successores de la mateixa clau: bifurcació.');
    }
    vistes.set(clau, declaracio);
  }
  return declaracions.length;
}

/* ── El directori de fixacions (§4.4, TOFU) ────────────────────────────── */

/**
 * Les públiques fixades de cada contacte (i de la persona mateixa). El kid es
 * recalcula sempre (IS-03). Un kid diferent del fixat només entra amb
 * `substituix: true`, que és la decisió de §4.4 (canvi suau o fort acceptat).
 */
export function creaDirectori(cripto) {
  exigixCripto(cripto);
  const fixacions = new Map();
  return Object.freeze({
    async fixa({ usuari, kid, sigPub, dhPub, verificat = false } = {}, { substituix = false } = {}) {
      if (!esUuid(usuari)) throw new TypeError('L’usuari és un uuid canònic.');
      let quadra = false;
      try {
        quadra = await kidQuadra(cripto, { usuari, kid, sigPub, dhPub });
      } catch (error) {
        throw embolcalla(error, CODI.kidNoQuadra, 'Les claus a fixar no tenen la forma esperada.');
      }
      if (!quadra) throw errorProtocol(CODI.kidNoQuadra, 'El kid no és el de les claus: no es fixa res.');
      const previa = fixacions.get(usuari);
      if (previa !== undefined && !bytesIguals(previa.kid, kid) && substituix !== true) {
        throw errorProtocol(CODI.kidNoFixat, 'Este contacte ja té una clau fixada diferent: cal acceptar el canvi.');
      }
      const entrada = Object.freeze({ usuari, kid: copia(kid), sigPub: copia(sigPub), dhPub: copia(dhPub), verificat: verificat === true });
      fixacions.set(usuari, entrada);
      return entrada;
    },
    de: (usuari) => fixacions.get(usuari) ?? null,
    usuaris: () => Object.freeze([...fixacions.keys()])
  });
}

function exigixDirectori(directori) {
  if (!esObjecte(directori) || typeof directori.de !== 'function') throw new TypeError('Cal el directori de fixacions.');
  return directori;
}

/* La fixació d'un usuari amb exactament este kid; si no, kid-no-fixat (§4.5.3.4). */
function fixadaAmb(directori, usuari, kid) {
  const fixada = directori.de(usuari);
  if (fixada === null || !bytesIguals(fixada.kid, kid)) throw errorProtocol(CODI.kidNoFixat, 'Un membre porta una clau que no és la fixada en este aparell.');
  return fixada;
}

/* ── Equip signat d'una entitat (§4.8) ─────────────────────────────────── */

/** L'estat de l'equip d'una entitat: la versió vigent (cap) i res més. */
export function estatEquipNou({ org } = {}) {
  if (!esUuid(org)) throw new TypeError('L’org és un uuid canònic.');
  return { org, cap: null };
}

function exigixEstatEquip(estat) {
  if (!esObjecte(estat) || !esUuid(estat.org) || !('cap' in estat)) throw new TypeError('Cal un estat d’equip (estatEquipNou).');
  return estat;
}

/* La llista de membres d'entrada: {usuari, rol}, sense repetir, amb el sostre comprovat ABANS de cap crida criptogràfica. */
function exigixLlistaMembres(membres, maxim, rols) {
  if (!Array.isArray(membres) || membres.length < 1) throw new TypeError('Cal almenys un membre.');
  if (membres.length > maxim) throw errorProtocol(CODI.massaMembres, `Com a molt ${maxim} membres.`);
  const vistos = new Set();
  for (const membre of membres) {
    if (!esObjecte(membre) || !esUuid(membre.usuari) || !rols.includes(membre.rol)) {
      throw errorProtocol(CODI.membresInvalids, 'Cada membre porta un uuid i un rol vàlid.');
    }
    if (vistos.has(membre.usuari)) throw errorProtocol(CODI.membresInvalids, 'Un membre repetit.');
    vistos.add(membre.usuari);
  }
  return membres;
}

/** Una versió nova de l'equip (v = cap + 1), signada per `jo`, amb els kids fixats de cada membre. */
export async function creaEquip(cripto, { estat, jo, membres, creatMs, directori, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatEquip(estat);
  exigixIdentitat(jo);
  exigixDirectori(directori);
  const pas = ambPas(vigent);
  exigixLlistaMembres(membres, MAX_MEMBRES_EQUIP, Object.values(ROL_EQUIP));
  const versio = (estat.cap?.versio ?? 0) + 1;
  const prevHash = estat.cap?.hash ?? null;
  const entrades = membres.map(({ usuari, rol }) => {
    const fixada = directori.de(usuari);
    if (fixada === null) throw errorProtocol(CODI.kidNoFixat, 'Un membre de l’equip no té cap clau fixada.');
    return { usuari, kid: fixada.kid, rol };
  });
  const declaracio = ambCodi(() => construeixEquip({
    org: estat.org, versio, prevHash, autor: jo.usuari, kidAutor: jo.kid, sigPubAutor: jo.sigPub, dhPubAutor: jo.dhPub, creatMs, membres: entrades
  }), CODI.equipInvalid, 'La declaració d’equip no es pot construir.');
  const firma = await pas(signa(cripto, jo.sigPriv, declaracio));
  const hash = await pas(hashEquip(cripto, declaracio));
  return Object.freeze({ versio, declaracio, firma, hash });
}

/**
 * Una versió d'equip rebuda: forma, org, v = cap + 1 i prevHash; kid de
 * l'autor recalculat i fixat; la v = 1 la fixa per TOFU (la signa una
 * propietària de la llista: ho comprova el format), les següents només una
 * propietària de la versió anterior; firma; kids dels membres fixats.
 */
export async function aplicaEquip(cripto, { estat, declaracio, firma, directori, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatEquip(estat);
  exigixDirectori(directori);
  const pas = ambPas(vigent);
  const v = ambCodi(() => llegixEquip(declaracio), CODI.equipInvalid, 'La declaració d’equip no té la forma SDPQ.');
  if (v.org !== estat.org) throw errorProtocol(CODI.equipInvalid, 'La declaració és d’una altra entitat.');
  if (v.versio !== (estat.cap?.versio ?? 0) + 1 || !hashIgual(v.prevHash, estat.cap?.hash ?? null)) {
    throw errorProtocol(CODI.versioForaDOrdre, 'La versió d’equip no encadena amb la vigent.');
  }
  if (!(await pas(kidQuadra(cripto, { usuari: v.autor, kid: v.kidAutor, sigPub: v.sigPubAutor, dhPub: v.dhPubAutor })))) {
    throw errorProtocol(CODI.kidNoQuadra, 'El kid de l’autor de l’equip no és el de les seues claus.');
  }
  fixadaAmb(directori, v.autor, v.kidAutor);
  if (estat.cap !== null && estat.cap.membres.get(v.autor)?.rol !== ROL_EQUIP.propietaria) {
    throw errorProtocol(CODI.autorNoAutoritzat, 'Només una propietària de la versió anterior pot signar la versió nova de l’equip.');
  }
  if (!(await pas(verificaSignatura(cripto, v.sigPubAutor, firma, declaracio)))) throw errorProtocol(CODI.firmaInvalida, 'La firma de l’equip no verifica.');
  for (const membre of v.membres) fixadaAmb(directori, membre.usuari, membre.kid);
  const hash = await pas(hashEquip(cripto, declaracio));
  const membres = new Map(v.membres.map((membre) => [membre.usuari, Object.freeze({ kid: membre.kid, rol: membre.rol })]));
  estat.cap = Object.freeze({ versio: v.versio, hash, declaracio: copia(declaracio), valors: v, membres });
  return Object.freeze({ versio: v.versio, hash });
}

/* ── L'estat d'un fil i la cadena d'èpoques (§4.5) ─────────────────────── */

/**
 * L'estat d'un fil xifrat: `cap` és l'última època VÀLIDA (amb la seua CK si
 * en som membres), `ultima` l'última vista (vàlida o saltada, IS-12), `epoques`
 * totes les vàlides per número, `vistos` els ids de missatge ja oberts. Un fil
 * amb una entitat porta l'interlocutor i l'estat de l'equip signat.
 */
export function estatFilNou({ fil, tipusFil, interlocutor = null, equip = null } = {}) {
  if (!esUuid(fil)) throw new TypeError('El fil és un uuid canònic.');
  if (!TIPUS_FIL_VALIDS.includes(tipusFil)) throw new TypeError('tipusFil és 1 (directe), 2 (entitat) o 3 (grup).');
  if (tipusFil === TIPUS_FIL.entitat) {
    if (!esUuid(interlocutor)) throw new TypeError('Un fil amb una entitat porta l’interlocutor.');
    exigixEstatEquip(equip);
  } else if (interlocutor !== null || equip !== null) {
    throw new TypeError('Només un fil amb una entitat porta interlocutor i equip.');
  }
  return { fil, tipusFil, interlocutor, equip, cap: null, ultima: null, epoques: new Map(), vistos: new Set() };
}

function exigixEstatFil(estat) {
  if (!esObjecte(estat) || !esUuid(estat.fil) || !TIPUS_FIL_VALIDS.includes(estat.tipusFil) || !(estat.epoques instanceof Map)
    || !(estat.vistos instanceof Set)) {
    throw new TypeError('Cal un estat de fil (estatFilNou).');
  }
  return estat;
}

/* §4.5.3.3: qui pot canviar què, respecte de l'última època vàlida. */
function comprovaTransicio(estat, v) {
  const cap = estat.cap;
  if (estat.tipusFil === TIPUS_FIL.entitat) {
    const equip = estat.equip.cap;
    if (equip === null || !hashIgual(v.refEquip, equip.hash)) {
      throw errorProtocol(CODI.equipNoVigent, 'L’època no cita la versió vigent de l’equip signat.');
    }
    for (const membre of v.membres) {
      if (membre.usuari !== estat.interlocutor && !equip.membres.has(membre.usuari)) {
        throw errorProtocol(CODI.membreForaDEquip, 'Un membre de l’època no és l’interlocutor ni és a l’equip signat.');
      }
    }
  }
  if (cap === null) return;
  const autorAbans = cap.membres.get(v.autor);
  if (autorAbans === undefined) throw errorProtocol(CODI.autorNoAutoritzat, 'L’autor de l’època no era membre de l’última època vàlida.');
  const nous = v.membres.filter((membre) => !cap.membres.has(membre.usuari));
  const eixits = [...cap.membres.keys()].filter((usuari) => !v.membres.some((membre) => membre.usuari === usuari));
  const rolsCanviats = v.membres.filter((membre) => cap.membres.has(membre.usuari) && cap.membres.get(membre.usuari).rol !== membre.rol);
  if (estat.tipusFil === TIPUS_FIL.directe && (nous.length > 0 || eixits.length > 0)) {
    throw errorProtocol(CODI.membresImmutables, 'En un directe entre persones els dos membres no canvien mai.');
  }
  if (estat.tipusFil === TIPUS_FIL.grup && (nous.length > 0 || rolsCanviats.length > 0) && autorAbans.rol === ROL_EPOCA.membre) {
    throw errorProtocol(CODI.autorNoAutoritzat, 'Les altes i els canvis d’administradores només els fa una administradora de l’època anterior.');
  }
}

/**
 * La candidata d'època e = última + 1 (§4.5.4): una CK nova, un sobre HPKE per
 * membre (l'autor inclòs) amb l'info SDPS, el ckCommit, la declaració SDPE
 * signada i el seu hash. No toca l'estat: s'aplica amb aplicaEpoca, com les dels
 * altres, i qui perd la cursa del servidor la descarta (QA-E05). Els bytes de la
 * CK es posen a zero en tornar: l'autor la recupera obrint el seu sobre.
 */
export async function creaEpoca(cripto, { estat, jo, membres, motiu = null, refEquip = null, creatMs, directori, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatFil(estat);
  exigixIdentitat(jo);
  exigixDirectori(directori);
  const pas = ambPas(vigent);
  exigixLlistaMembres(membres, MAX_MEMBRES_EPOCA, Object.values(ROL_EPOCA));
  const epoca = (estat.ultima?.epoca ?? 0) + 1;
  if (epoca > MAX_EPOCA) throw errorProtocol(CODI.epocaForaDOrdre, 'El fil ha arribat a l’última època possible.');
  const motiuFinal = motiu ?? (epoca === 1 ? MOTIU_EPOCA.genesi : null);
  if (!MOTIUS_VALIDS.includes(motiuFinal)) throw new TypeError('El motiu és un de MOTIU_EPOCA.');
  const prevHash = estat.ultima?.hash ?? null;
  const resolts = membres.map(({ usuari, rol }) => {
    const fixada = directori.de(usuari);
    if (fixada === null) throw errorProtocol(CODI.kidNoFixat, 'Un membre no té cap clau fixada: no se li pot embolcallar cap sobre.');
    return { usuari, rol, kid: fixada.kid, dhPub: fixada.dhPub };
  });
  const ck = aleatori(cripto, BYTES_CLAU);
  try {
    const clauCk = await pas(importaClauHkdf(cripto, ck));
    const ckCommit = await pas(derivaBitsHkdf(cripto, clauCk, uuid16(estat.fil), infoCompromisEpoca(epoca), BYTES_HASH));
    const sobres = [];
    const entrades = [];
    for (const membre of resolts) {
      const info = construeixInfoSobre({ fil: estat.fil, epoca, receptor: membre.usuari, kidReceptor: membre.kid, autor: jo.usuari, kidAutor: jo.kid });
      const { enc, ct } = await pas(segellaBase(cripto, { pkR: membre.dhPub, info, pt: ck }));
      sobres.push(Object.freeze({ receptor: membre.usuari, kidReceptor: copia(membre.kid), enc, ct }));
      entrades.push({ usuari: membre.usuari, kid: membre.kid, rol: membre.rol, envHash: await pas(hashSobre(cripto, enc, ct)) });
    }
    const declaracio = ambCodi(() => construeixEpoca({
      fil: estat.fil, epoca, tipusFil: estat.tipusFil, prevHash, autor: jo.usuari, kidAutor: jo.kid, sigPubAutor: jo.sigPub, dhPubAutor: jo.dhPub,
      motiu: motiuFinal, creatMs, ckCommit, refEquip, membres: entrades
    }), CODI.membresInvalids, 'La declaració d’època no es pot construir amb estos membres.');
    const firma = await pas(signa(cripto, jo.sigPriv, declaracio));
    const hash = await pas(hashEpoca(cripto, declaracio));
    return Object.freeze({ epoca, declaracio, firma, hash, sobres: Object.freeze(sobres) });
  } finally {
    ck.fill(0);
  }
}

/**
 * Una època rebuda (o la pròpia candidata): forma i fil; e = última + 1 amb
 * prevHash = hash de l'última (vàlida o saltada: IS-12); kid de l'autor
 * recalculat i fixat; firma; kids dels membres fixats; transició permesa
 * (§4.5.3.3); el meu sobre (envHash, obertura directa a una clau HKDF: la CK no
 * passa per JavaScript, G-18) i el ckCommit (CS-25). Si no en som membres,
 * l'època avança igual, sense CK: sabem que som fora. Una fallada després de
 * l'ordre marca l'època com a saltada perquè la següent la supere; un canvi
 * d'àmbit no marca res.
 */
export async function aplicaEpoca(cripto, { estat, jo, declaracio, firma, sobres, directori, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatFil(estat);
  exigixIdentitat(jo);
  exigixDirectori(directori);
  const pas = ambPas(vigent);
  const v = ambCodi(() => llegixEpoca(declaracio), CODI.declaracioInvalida, 'La declaració d’època no té la forma SDPE.');
  if (v.fil !== estat.fil || v.tipusFil !== estat.tipusFil) throw errorProtocol(CODI.declaracioInvalida, 'La declaració és d’un altre fil o d’un altre tipus.');
  if (v.epoca !== (estat.ultima?.epoca ?? 0) + 1 || !hashIgual(v.prevHash, estat.ultima?.hash ?? null)) {
    throw errorProtocol(CODI.epocaForaDOrdre, 'L’època no encadena amb l’última vista: fora d’ordre o bifurcació.');
  }
  const hash = await pas(hashEpoca(cripto, declaracio));
  try {
    if (!(await pas(kidQuadra(cripto, { usuari: v.autor, kid: v.kidAutor, sigPub: v.sigPubAutor, dhPub: v.dhPubAutor })))) {
      throw errorProtocol(CODI.kidNoQuadra, 'El kid de l’autor de l’època no és el de les seues claus.');
    }
    fixadaAmb(directori, v.autor, v.kidAutor);
    if (!(await pas(verificaSignatura(cripto, v.sigPubAutor, firma, declaracio)))) throw errorProtocol(CODI.firmaInvalida, 'La firma de l’època no verifica.');
    for (const membre of v.membres) fixadaAmb(directori, membre.usuari, membre.kid);
    comprovaTransicio(estat, v);
    const meu = v.membres.find((membre) => membre.usuari === jo.usuari) ?? null;
    let ck = null;
    if (meu !== null) {
      if (!bytesIguals(meu.kid, jo.kid)) throw errorProtocol(CODI.kidNoFixat, 'L’època em llista amb una clau que no és esta.');
      const llista = Array.isArray(sobres) ? sobres : [];
      const sobre = llista.find((s) => esObjecte(s) && s.receptor === jo.usuari) ?? null;
      if (sobre === null) throw errorProtocol(CODI.sobreAbsent, 'L’època em llista però no porta cap sobre per a mi.');
      let envHash;
      try {
        envHash = await pas(hashSobre(cripto, sobre.enc, sobre.ct));
      } catch (error) {
        throw embolcalla(error, CODI.sobreInvalid, 'El sobre no té la forma esperada.');
      }
      if (!bytesIguals(envHash, meu.envHash)) throw errorProtocol(CODI.sobreInvalid, 'El sobre no és el que la declaració signa.');
      const info = construeixInfoSobre({ fil: estat.fil, epoca: v.epoca, receptor: jo.usuari, kidReceptor: jo.kid, autor: v.autor, kidAutor: v.kidAutor });
      try {
        ck = await pas(obriBaseAClauHkdf(cripto, { skR: jo.dhPriv, pkR: jo.dhPub, enc: sobre.enc, info, ct: sobre.ct }));
      } catch (error) {
        throw embolcalla(error, CODI.sobreInvalid, 'El sobre no s’ha pogut obrir amb esta clau.');
      }
      const compromis = await pas(derivaBitsHkdf(cripto, ck, uuid16(estat.fil), infoCompromisEpoca(v.epoca), BYTES_HASH));
      if (!bytesIguals(compromis, v.ckCommit)) throw errorProtocol(CODI.compromisInvalid, 'La CK del sobre no casa amb el compromís de l’època.');
    }
    const membres = new Map(v.membres.map((membre) => [membre.usuari, Object.freeze({ kid: membre.kid, rol: membre.rol })]));
    const entrada = Object.freeze({ epoca: v.epoca, hash, declaracio: copia(declaracio), valors: v, membres, ck });
    estat.epoques.set(v.epoca, entrada);
    estat.cap = entrada;
    estat.ultima = Object.freeze({ epoca: v.epoca, hash, saltada: false });
    return Object.freeze({ epoca: v.epoca, hash, membre: ck !== null });
  } catch (error) {
    if (esErrorProtocol(error) && error.codi !== CODI.ambitCanviat) estat.ultima = Object.freeze({ epoca: v.epoca, hash, saltada: true });
    throw error;
  }
}

/* ── Missatges (§4.6, §4.10) ───────────────────────────────────────────── */

/* En un directe o un grup ningú no escriu en nom d'una entitat; en un fil amb una entitat, l'equip sí i l'interlocutor no. */
function comprovaComOrg(estat, emissor, comOrg) {
  const esperat = estat.tipusFil === TIPUS_FIL.entitat && emissor !== estat.interlocutor ? estat.equip.org : null;
  if (comOrg !== esperat) throw errorProtocol(CODI.filaInvalida, 'comOrg no correspon a qui escriu en este fil.');
}

/* La fila xifrada tal com torna el servidor, només de propietats pròpies i amb les mides exactes. */
function exigixFila(estat, fila) {
  const falla = (motiu) => errorProtocol(CODI.filaInvalida, `La fila xifrada no té la forma esperada (${motiu}).`);
  if (!esObjecte(fila)) throw falla('tipus');
  const propi = (clau) => (Object.hasOwn(fila, clau) ? fila[clau] : undefined);
  const { fil, id, emissor, kid, epoca, tf, iv, ct } = Object.fromEntries(['fil', 'id', 'emissor', 'kid', 'epoca', 'tf', 'iv', 'ct'].map((clau) => [clau, propi(clau)]));
  const comOrg = propi('comOrg') ?? null;
  const respostaA = propi('respostaA') ?? null;
  if (fil !== estat.fil) throw falla('fil');
  if (!esUuid(id)) throw falla('id');
  if (!esUuid(emissor)) throw falla('emissor');
  if (comOrg !== null && !esUuid(comOrg)) throw falla('comOrg');
  if (respostaA !== null && !esUuid(respostaA)) throw falla('respostaA');
  if (!esBytesDe(kid, BYTES_KID)) throw falla('kid');
  if (!Number.isSafeInteger(epoca) || epoca < 1 || epoca > MAX_EPOCA) throw falla('epoca');
  if (!esBytesDe(tf, BYTES_HASH)) throw falla('tf');
  if (!esBytesDe(iv, BYTES_IV)) throw falla('iv');
  if (!esBytes(ct) || !esMidaXifratMissatge(ct.length)) throw falla('ct');
  return Object.freeze({ fil, id, emissor, kid, comOrg, epoca, respostaA, tf, iv, ct });
}

/**
 * Xifra un missatge amb l'època vigent (§4.6.3): cos canònic, σ (SDPG) en
 * entitats i grups, nf i la càrrega P, tf = HMAC(nf, SDPF), la capçalera H (que
 * és l'AAD i porta el hash_e vigent), mk per HKDF des de la CK amb SHA-256(H),
 * farciment en blocs de 256 B i AES-256-GCM. Torna la fila per al servidor
 * (text nul, tot binari). El text NO es saneja: se signa i es franqueja tal com
 * l'autor l'ha escrit.
 */
export async function xifraMissatge(cripto, { estat, jo, id, contingut, comOrg = null, respostaA = null, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatFil(estat);
  exigixIdentitat(jo);
  const pas = ambPas(vigent);
  if (!esUuid(id)) throw new TypeError('L’id del missatge és un uuid canònic.');
  if (respostaA !== null && !esUuid(respostaA)) throw new TypeError('respostaA és un uuid o null.');
  const cap = estat.cap;
  if (cap === null || cap.ck === null) throw errorProtocol(CODI.senseEpoca, 'No hi ha cap època vigent amb una CK meua en este fil.');
  const meu = cap.membres.get(jo.usuari);
  if (meu === undefined || !bytesIguals(meu.kid, jo.kid)) throw errorProtocol(CODI.autorNoAutoritzat, 'No sóc membre de l’època vigent amb esta clau.');
  comprovaComOrg(estat, jo.usuari, comOrg);
  const cos = ambCodi(() => construeixCos(contingut), CODI.contingutInvalid, 'El contingut del missatge no és vàlid.');
  const base = { fil: estat.fil, id, emissor: jo.usuari, kidEmissor: jo.kid, comOrg, epoca: cap.epoca, respostaA };
  let firma = null;
  if (estat.tipusFil !== TIPUS_FIL.directe) {
    const hashDelCos = await pas(hashCos(cripto, cos));
    firma = await pas(signa(cripto, jo.sigPriv, construeixEntradaFirmaMissatge({ ...base, hashCos: hashDelCos })));
  }
  const nf = aleatori(cripto, BYTES_NONCE_FRANQUEIG);
  const carrega = construeixCarrega({ cos, nf, firma });
  let farcit = null;
  try {
    const tf = await pas(hmacSha256(cripto, nf, construeixEntradaFranqueig({ fil: estat.fil, id, emissor: jo.usuari, epoca: cap.epoca, carrega })));
    const capcalera = construeixCapcalera({ ...base, hashEpoca: cap.hash, tf });
    const hashH = await pas(hashCapcalera(cripto, capcalera));
    const mk = await pas(derivaClauAesHkdf(cripto, cap.ck, uuid16(id), infoClauMissatge(hashH), ['encrypt']));
    farcit = farceixCarrega(carrega);
    const { iv, xifrat } = await pas(xifraAesGcm(cripto, mk, { dades: farcit, aad: capcalera }));
    return Object.freeze({ fil: estat.fil, id, emissor: jo.usuari, kid: copia(jo.kid), comOrg, epoca: cap.epoca, respostaA, tf, iv, ct: xifrat });
  } finally {
    // La càrrega porta el text i, si n'hi ha, la FK de l'adjunt: res no queda viu.
    cos.fill(0);
    nf.fill(0);
    carrega.fill(0);
    farcit?.fill(0);
  }
}

/**
 * Obri una fila xifrada en l'ordre de §4.6.4: (1) forma de la fila i repetició
 * per id (§4.10); (2) l'època és coneguda, amb CK, i l'autor n'és membre amb el
 * kid de la fila; (3) H reconstruïda amb les columnes del servidor i el hash_e
 * verificat (una bifurcació no es pot llegir entre branques); (4) mk,
 * desxifrar i llevar el farciment estricte; (5) P estricta, tf, i en entitats
 * i grups σ amb la clau fixada de l'autor. Un missatge d'una època anterior al
 * cap torna `clauAntiga: true` (§4.6.4.6). El text ix sanejat (QA-S06).
 * Qualsevol fallada deixa l'estat intacte: l'id no es marca com a vist.
 */
export async function obriMissatge(cripto, { estat, fila, directori, purificador = null, vigent = null } = {}) {
  exigixCripto(cripto);
  exigixEstatFil(estat);
  exigixDirectori(directori);
  const pas = ambPas(vigent);
  const f = exigixFila(estat, fila);
  comprovaComOrg(estat, f.emissor, f.comOrg);
  if (estat.vistos.has(f.id)) throw errorProtocol(CODI.repeticio, 'Este id de missatge ja s’ha obert en este fil.');
  const epoca = estat.epoques.get(f.epoca) ?? null;
  if (epoca === null || epoca.ck === null) throw errorProtocol(CODI.epocaDesconeguda, 'El missatge és d’una època que este aparell no té.');
  const membre = epoca.membres.get(f.emissor);
  if (membre === undefined || !bytesIguals(membre.kid, f.kid)) throw errorProtocol(CODI.kidNoQuadra, 'L’autor no és membre d’eixa època amb este kid.');
  const base = { fil: estat.fil, id: f.id, emissor: f.emissor, kidEmissor: f.kid, comOrg: f.comOrg, epoca: f.epoca, respostaA: f.respostaA };
  const capcalera = ambCodi(() => construeixCapcalera({ ...base, hashEpoca: epoca.hash, tf: f.tf }), CODI.filaInvalida, 'La capçalera no es pot reconstruir.');
  const hashH = await pas(hashCapcalera(cripto, capcalera));
  const mk = await pas(derivaClauAesHkdf(cripto, epoca.ck, uuid16(f.id), infoClauMissatge(hashH), ['decrypt']));
  let farcit = null;
  let carrega = null;
  try {
    try {
      farcit = await pas(desxifraAesGcm(cripto, mk, { xifrat: f.ct, aad: capcalera, iv: f.iv }));
    } catch (error) {
      throw embolcalla(error, CODI.xifratManipulat, 'El xifrat no supera la comprovació d’integritat amb esta capçalera.');
    }
    try {
      carrega = desfarceixCarrega(farcit);
    } catch (error) {
      throw embolcalla(error, error?.format === 'Pf' ? CODI.farcimentInvalid : CODI.carregaInvalida, 'El farciment o la càrrega no són canònics.');
    }
    // desfarceixCarrega ja ha validat P: ací només se'n lligen els camps.
    const p = ambCodi(() => llegixCarrega(carrega), CODI.carregaInvalida, 'La càrrega no és canònica.');
    const tf = await pas(hmacSha256(cripto, p.nf, construeixEntradaFranqueig({ fil: estat.fil, id: f.id, emissor: f.emissor, epoca: f.epoca, carrega })));
    if (!bytesIguals(tf, f.tf)) throw errorProtocol(CODI.franqueigInvalid, 'El franqueig de la fila no és el de la càrrega.');
    if (estat.tipusFil !== TIPUS_FIL.directe || p.signada) {
      if (!p.signada) throw errorProtocol(CODI.firmaInvalida, 'Un missatge d’entitat o de grup va signat.');
      const fixada = fixadaAmb(directori, f.emissor, f.kid);
      const hashDelCos = await pas(hashCos(cripto, p.cos));
      const entrada = construeixEntradaFirmaMissatge({ ...base, hashCos: hashDelCos });
      if (!(await pas(verificaSignatura(cripto, fixada.sigPub, p.firma, entrada)))) throw errorProtocol(CODI.firmaInvalida, 'La firma del missatge no verifica.');
    }
    const { t, a, mini } = p.contingut;
    estat.vistos.add(f.id);
    return Object.freeze({
      id: f.id, emissor: f.emissor, kid: copia(f.kid), epoca: f.epoca, comOrg: f.comOrg, respostaA: f.respostaA, firmada: p.signada,
      clauAntiga: f.epoca < estat.cap.epoca, contingut: Object.freeze({ t: t === null ? null : sanejaTextPla(t, { purificador }), a, mini })
    });
  } finally {
    farcit?.fill(0);
    carrega?.fill(0);
  }
}

/* ── Adjunts (§4.7) ────────────────────────────────────────────────────── */

/**
 * Xifra un adjunt: FK de 32 B, Kenc_A = HKDF(FK, sal = adjunt16, info =
 * "adjunt" ‖ fil16), AAD SDPA (fil, adjunt, emissor), farciment Padmé i
 * blob = iv ‖ xifrat. Torna el blob i `a` (el que va dins de `cos`: id, classe,
 * MIME real, bytes en clar, durada, FK i SHA-256 del blob). La FK és secreta:
 * qui construïx `cos` la posa a zero després.
 */
export async function xifraAdjunt(cripto, { fil, adjunt, emissor, bytes, mime, durada = null, vigent = null } = {}) {
  exigixCripto(cripto);
  const pas = ambPas(vigent);
  const falla = (motiu) => errorProtocol(CODI.adjuntInvalid, `L’adjunt no es pot xifrar (${motiu}).`);
  if (!esUuid(fil) || !esUuid(adjunt) || !esUuid(emissor)) throw falla('uuid');
  const classe = typeof mime === 'string' && Object.hasOwn(MIME_XAT, mime) ? CLASSE_DEL_TIPUS[MIME_XAT[mime]] : undefined;
  if (classe === undefined) throw falla('mime');
  if (!esBytes(bytes) || bytes.length < 1 || bytes.length > MAXIM_CLAR_ADJUNT[classe]) throw falla('mida');
  const fk = aleatori(cripto, BYTES_CLAU);
  const clauFk = await pas(importaClauHkdf(cripto, fk));
  const kenc = await pas(derivaClauAesHkdf(cripto, clauFk, uuid16(adjunt), infoClauAdjunt(fil), ['encrypt']));
  const aad = construeixAadAdjunt({ fil, adjunt, emissor });
  const farcit = farcixPadme(bytes);
  try {
    const { iv, xifrat } = await pas(xifraAesGcm(cripto, kenc, { dades: farcit, aad }));
    const blob = ajunta(iv, xifrat);
    const h = await pas(sha256(cripto, blob));
    return Object.freeze({ blob, a: Object.freeze({ id: adjunt, c: classe, m: mime, b: bytes.length, d: durada, k: fk, h }) });
  } finally {
    farcit.fill(0);
  }
}

/**
 * Obri un adjunt amb el `a` que venia dins del missatge (ja autenticat per tf i
 * σ): el hash del blob es comprova ABANS de desxifrar (IS-15), després Kenc_A,
 * l'AAD SDPA, el farciment Padmé estricte i que la mida i la classe són les
 * declarades. El MIME que es torna és el declarat dins del xifrat, mai cap del
 * servidor.
 */
export async function obriAdjunt(cripto, { fil, emissor, a, blob, vigent = null } = {}) {
  exigixCripto(cripto);
  const pas = ambPas(vigent);
  const falla = (motiu) => errorProtocol(CODI.adjuntInvalid, `L’adjunt no té la forma esperada (${motiu}).`);
  if (!esUuid(fil) || !esUuid(emissor)) throw falla('uuid');
  if (!esObjecte(a) || !esUuid(a.id) || !esBytesDe(a.k, BYTES_CLAU) || !esBytesDe(a.h, BYTES_HASH) || !Number.isSafeInteger(a.b) || a.b < 1) throw falla('a');
  if (!esBytes(blob) || blob.length < BYTES_IV + 16 + 1) throw falla('blob');
  const h = await pas(sha256(cripto, blob));
  if (!bytesIguals(h, a.h)) throw errorProtocol(CODI.adjuntManipulat, 'El blob no és el que el missatge declara: no es desxifra.');
  const clauFk = await pas(importaClauHkdf(cripto, a.k));
  const kenc = await pas(derivaClauAesHkdf(cripto, clauFk, uuid16(a.id), infoClauAdjunt(fil), ['decrypt']));
  const aad = construeixAadAdjunt({ fil, adjunt: a.id, emissor });
  let farcit = null;
  try {
    try {
      farcit = await pas(desxifraAesGcm(cripto, kenc, { xifrat: blob.subarray(BYTES_IV), aad, iv: blob.subarray(0, BYTES_IV) }));
    } catch (error) {
      throw embolcalla(error, CODI.adjuntManipulat, 'El blob no supera la comprovació d’integritat amb este fil i este emissor.');
    }
    let bytes;
    try {
      bytes = llevaFarcimentPadme(farcit);
    } catch (error) {
      throw embolcalla(error, CODI.adjuntIncoherent, 'El farciment de l’adjunt no és canònic.');
    }
    if (bytes.length !== a.b || CLASSE_DEL_TIPUS[MIME_XAT[a.m]] !== a.c) {
      bytes.fill(0);
      throw errorProtocol(CODI.adjuntIncoherent, 'La mida o la classe de l’adjunt no són les declarades.');
    }
    return Object.freeze({ bytes, mime: a.m, classe: a.c, durada: a.d ?? null });
  } finally {
    farcit?.fill(0);
  }
}

/* ── SAS del parell (§4.4 i esmenes §4) ────────────────────────────────── */

const exigixPubliques = (persona) => {
  if (!esObjecte(persona) || !esUuid(persona.usuari) || !esBytesDe(persona.kid, BYTES_KID) || !esBytes(persona.sigPub) || !esBytes(persona.dhPub)) {
    throw new TypeError('Cada persona del SAS porta usuari, kid, sigPub i dhPub.');
  }
  return persona;
};

/**
 * hT: el hash de la transcripció del parell, igual als dos aparells siga qui
 * siga qui comença: "sdp-xat-v1/sas-parell" ‖ 0 ‖ uuid16 i kid de la menor ‖
 * uuid16 i kid de la major ‖ les 60 xifres del número de seguretat.
 */
export async function transcripcioSas(cripto, { a, b } = {}) {
  exigixCripto(cripto);
  exigixPubliques(a);
  exigixPubliques(b);
  let numero;
  try {
    numero = (await numeroSeguretatParell(cripto, a, b)).replaceAll(' ', '');
  } catch (error) {
    throw embolcalla(error, CODI.sasInvalid, 'El número de seguretat del parell no es pot calcular.');
  }
  const [menor, major] = comparaBytes(uuid16(a.usuari), uuid16(b.usuari)) < 0 ? [a, b] : [b, a];
  return sha256(cripto, infoHkdf('sas-parell', uuid16(menor.usuari), menor.kid, uuid16(major.usuari), major.kid, ascii(numero)));
}

/** El compromís de qui comença: SHA-256("sdp-xat-v1/sas-compromis" ‖ 0 ‖ hT ‖ nonce). */
export async function compromisSas(cripto, hT, nonce) {
  if (!esBytesDe(hT, BYTES_HASH) || !esBytesDe(nonce, BYTES_NONCE_SAS)) throw new TypeError('hT fa 32 B i el nonce 32 B.');
  return sha256(cripto, infoHkdf('sas-compromis', hT, nonce));
}

/** 12 xifres en 4 grups de 3: «ddd ddd ddd ddd». */
export function formatejaSas(xifres) {
  if (typeof xifres !== 'string' || !/^\d{12}$/.test(xifres)) throw new TypeError(`El SAS són ${SAS_XIFRES} xifres.`);
  return xifres.match(/\d{3}/g).join(' ');
}

/**
 * El codi: HKDF-SHA256(sal = hT, ikm = nonceCompromis ‖ nonceResposta, info =
 * "sdp-xat-v1/sas-codi" ‖ 0) → 8 B → u64 mod 10¹² (biaix ≈ 5·10⁻⁸, negligible).
 * Depén dels dos nonces i de la transcripció: qui és al mig només té una
 * oportunitat d'1 entre 10¹² per intent (esmenes §4.3).
 */
export async function codiSas(cripto, { hT, nonceCompromis, nonceResposta } = {}) {
  exigixCripto(cripto);
  if (!esBytesDe(hT, BYTES_HASH) || !esBytesDe(nonceCompromis, BYTES_NONCE_SAS) || !esBytesDe(nonceResposta, BYTES_NONCE_SAS)) {
    throw new TypeError('hT i els dos nonces fan 32 B.');
  }
  const prk = await hkdfExtract(cripto, hT, ajunta(nonceCompromis, nonceResposta));
  let okm;
  try {
    okm = await hkdfExpand(cripto, prk, infoHkdf('sas-codi'), 8);
  } finally {
    prk.fill(0);
  }
  let n = 0n;
  for (const byte of okm) n = (n << 8n) | BigInt(byte);
  const xifres = String(n % (10n ** BigInt(SAS_XIFRES))).padStart(SAS_XIFRES, '0');
  return Object.freeze({ xifres, text: formatejaSas(xifres) });
}

/**
 * La verificació del parell com a màquina d'estats (esmenes §4.2): qui
 * `compromet` envia primer el compromís del seu nonce; qui `respon` guarda el
 * compromís i envia el seu nonce; qui compromet revela el nonce; qui respon
 * comprova el compromís i tots dos tenen el codi. Cada pas només val en la seua
 * fase (sas-ordre); un compromís que no casa rebutja l'intent (sas-compromis).
 */
export function creaVerificacioSas(cripto, { jo, altre, rol } = {}) {
  exigixCripto(cripto);
  exigixPubliques(jo);
  exigixPubliques(altre);
  if (!Object.values(ROL_SAS).includes(rol)) throw new TypeError('El rol del SAS és «compromet» o «respon».');
  let fase = FASE_SAS.inici;
  let hT = null;
  let propi = null;
  let compromis = null;
  let codi = null;
  const exigix = (rolEsperat, faseEsperada) => {
    if (rol !== rolEsperat || fase !== faseEsperada) throw errorProtocol(CODI.sasOrdre, 'Este pas de la verificació no toca ara.');
  };
  const nonceDe = (valor) => {
    if (!esBytesDe(valor, BYTES_NONCE_SAS)) throw errorProtocol(CODI.sasInvalid, 'El nonce de l’altra banda no fa 32 B.');
    return copia(valor);
  };
  const transcripcio = async () => {
    hT ??= await transcripcioSas(cripto, { a: jo, b: altre });
    return hT;
  };
  return Object.freeze({
    get rol() { return rol; },
    get fase() { return fase; },
    get codi() { return codi; },
    /** Pas 1 (compromet): el compromís del nonce propi. */
    async compromet() {
      exigix(ROL_SAS.compromet, FASE_SAS.inici);
      propi = aleatori(cripto, BYTES_NONCE_SAS);
      compromis = await compromisSas(cripto, await transcripcio(), propi);
      fase = FASE_SAS.compromes;
      return Object.freeze({ compromis: copia(compromis) });
    },
    /** Pas 2 (respon): guarda el compromís rebut i torna el nonce propi. */
    async respon({ compromis: rebut } = {}) {
      exigix(ROL_SAS.respon, FASE_SAS.inici);
      if (!esBytesDe(rebut, BYTES_HASH)) throw errorProtocol(CODI.sasInvalid, 'El compromís rebut no fa 32 B.');
      await transcripcio();
      compromis = copia(rebut);
      propi = aleatori(cripto, BYTES_NONCE_SAS);
      fase = FASE_SAS.respost;
      return Object.freeze({ nonce: copia(propi) });
    },
    /** Pas 3 (compromet): amb el nonce de l'altra banda, revela el propi i ja té el codi. */
    async revela({ nonce } = {}) {
      exigix(ROL_SAS.compromet, FASE_SAS.compromes);
      const alie = nonceDe(nonce);
      codi = await codiSas(cripto, { hT, nonceCompromis: propi, nonceResposta: alie });
      fase = FASE_SAS.acabat;
      return Object.freeze({ nonce: copia(propi) });
    },
    /** Pas 4 (respon): comprova que el nonce revelat és el compromés i calcula el codi. */
    async comprova({ nonce } = {}) {
      exigix(ROL_SAS.respon, FASE_SAS.respost);
      const alie = nonceDe(nonce);
      if (!bytesIguals(await compromisSas(cripto, hT, alie), compromis)) {
        fase = FASE_SAS.rebutjat;
        throw errorProtocol(CODI.sasCompromis, 'El nonce revelat no és el que s’havia compromés: intent rebutjat.');
      }
      codi = await codiSas(cripto, { hT, nonceCompromis: alie, nonceResposta: propi });
      fase = FASE_SAS.acabat;
      return codi;
    }
  });
}

/* ── La porta d'entrada: tot lligat als ports ──────────────────────────── */

/**
 * El protocol lligat als seus ports: `cripto` (WebCrypto), `rellotge` (() →
 * ms), `locks` (navigator.locks o null: cua en memòria), `ambit` (() →
 * {ambitEstable, actorKey, generacio}, o null: sense guarda, només per a
 * proves), `purificador` (DOMPurify o null) i el `directori` de fixacions.
 * Cada operació captura l'àmbit en entrar, el torna a comprovar després de
 * cada await i en acabar (QA-E07); les mutacions de la cadena van sota el
 * pany del fil (QA-S05); avancaEpoca és el comparar-i-canviar local de QA-E05:
 * qui arriba amb un `desDe` que ja no és el cap perd amb epoca-conflicte i no
 * deixa cap CK candidata viva.
 */
export function creaProtocolXat({ cripto, rellotge, locks = null, ambit = null, purificador = null, directori = null } = {}) {
  exigixCripto(cripto);
  if (typeof rellotge !== 'function') throw new TypeError('El rellotge és una funció que torna mil·lisegons.');
  const guarda = creaGuardaAmbit(ambit);
  const panys = creaPanys({ locks });
  const fixacions = directori ?? creaDirectori(cripto);
  exigixDirectori(fixacions);
  const ara = () => {
    const ms = rellotge();
    if (!Number.isSafeInteger(ms) || ms < 0) throw new TypeError('El rellotge torna un enter de mil·lisegons.');
    return ms;
  };
  const sotaPanyDelFil = (estat, fn) => guarda.ambAmbit((vigent) => panys.ambPany(nomPanyFil(exigixEstatFil(estat).fil), () => {
    // La cua també és asíncrona: conserva l'àmbit de qui va iniciar l'operació.
    if (vigent !== null) vigent();
    return fn(vigent);
  }));
  return Object.freeze({
    CODI, directori: fixacions, guarda, panys, ara,
    creaIdentitat: (opcions = {}) => creaIdentitat(cripto, { creatMs: ara(), ...opcions }),
    verificaDeclaracioClau: (opcions = {}) => verificaDeclaracioClau(cripto, { ara: ara(), ...opcions }),
    exigixSenseBifurcacio,
    estatFilNou, estatEquipNou,
    creaEquip: (opcions = {}) => guarda.ambAmbit((vigent) => creaEquip(cripto, { creatMs: ara(), ...opcions, directori: fixacions, vigent })),
    aplicaEquip: (opcions = {}) => guarda.ambAmbit((vigent) => aplicaEquip(cripto, { ...opcions, directori: fixacions, vigent })),
    creaEpoca: (opcions = {}) => guarda.ambAmbit((vigent) => creaEpoca(cripto, { creatMs: ara(), ...opcions, directori: fixacions, vigent })),
    aplicaEpoca: (opcions = {}) => sotaPanyDelFil(opcions.estat, (vigent) => aplicaEpoca(cripto, { ...opcions, directori: fixacions, vigent })),
    avancaEpoca: ({ estat, desDe, ...opcions } = {}) => sotaPanyDelFil(estat, async (vigent) => {
      if (!Number.isSafeInteger(desDe) || desDe < 0) throw new TypeError('desDe és l’època que es creia vigent.');
      if ((estat.cap?.epoca ?? 0) !== desDe) throw errorProtocol(CODI.epocaConflicte, 'Una altra pestanya ja ha avançat l’època: rellig i torna-ho a provar.');
      const candidata = await creaEpoca(cripto, { creatMs: ara(), ...opcions, estat, directori: fixacions, vigent });
      await aplicaEpoca(cripto, { estat, jo: opcions.jo, ...candidata, directori: fixacions, vigent });
      return candidata;
    }),
    xifraMissatge: (opcions = {}) => guarda.ambAmbit((vigent) => xifraMissatge(cripto, { ...opcions, vigent })),
    obriMissatge: (opcions = {}) => guarda.ambAmbit((vigent) => obriMissatge(cripto, { ...opcions, directori: fixacions, purificador, vigent })),
    xifraAdjunt: (opcions = {}) => guarda.ambAmbit((vigent) => xifraAdjunt(cripto, { ...opcions, vigent })),
    obriAdjunt: (opcions = {}) => guarda.ambAmbit((vigent) => obriAdjunt(cripto, { ...opcions, vigent })),
    verificacioSas: (opcions = {}) => creaVerificacioSas(cripto, opcions),
    sanejaTextPla: (text) => sanejaTextPla(text, { purificador }),
    ambPanyIdentitat: (clauIdentitat, fn) => panys.ambPany(nomPanyIdentitat(clauIdentitat), fn)
  });
}
