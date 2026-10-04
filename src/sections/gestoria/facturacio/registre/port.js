/**
 * port.js — el contracte del llibre de registres de facturació: només afegir.
 *
 * Quatre mètodes i cap més que toque dades:
 *   afegix(registre)      desa un registre que va just darrere de l'últim del seu emissor
 *   ultim(idEmisor)       l'últim registre de la cadena d'un emissor, o null
 *   llig({ idEmisor, des }) els registres en l'ordre de la cadena (tots, o d'un emissor des d'un ordre)
 *   exporta()             el llibre sencer en JSON canònic, per a fer-ne còpia
 * No hi ha actualitza, esborra ni buida, ni n'hi pot haver: validaPort és una
 * llista BLANCA i refusa qualsevol altre mètode, es diga com es diga.
 * Opcionals: ambEscriptor(fn), la secció d'un sol escriptor que fa servir
 * cadena.js (no es pot niar), i demanaPersistencia() i tanca() de l'IndexedDB.
 *
 * afegix() fa primer una còpia congelada del registre i treballa sempre sobre
 * eixa còpia: la que verifica és la que desa, encara que qui crida canvie el
 * seu objecte mentre es calcula el resum.
 *
 * afegix() comprova, en la mateixa operació que desa, que el registre va
 * just darrere de l'últim (si no, CADENA_CANVIADA: algú hi ha escrit abans),
 * que el seu encadenament nomena eixe últim sencer, emissor, número, data i
 * empremta (ENCADENAMENT_INCOHERENT), que l'alta no està duplicada
 * (DUPLICAT) i que l'anul·lació té alta (FACTURA_INEXISTENT). Tots dos
 * adaptadors (memòria, ací; IndexedDB, a
 * portIndexedDB.js) usen la mateixa comprovació, comprovaAfegit.
 *
 * El port del backend (fase 3, amb ordre del Mestre) serà la capacitat
 * opcional 'facturacio' de src/data/contracte.js amb este mateix contracte;
 * la remissió a l'AEAT la fa el servidor, mai el navegador.
 * JS pur: sense DOM, React ni xarxa.
 */
import { jsonCanonic } from '../../../tractors/nucli/canonic.js';
import { copiaCongelada, errorAmbCodi } from '../comu.js';
import { empremtaDeRegistre } from './empremta.js';
import { clauFactura, encadenamentDe, validaRegistre } from './validacio.js';

export const METODES_PORT = Object.freeze(['afegix', 'ultim', 'llig', 'exporta']);
/* Els únics mètodes que un adaptador pot portar a més dels quatre: cap toca dades. */
export const METODES_OPCIONALS = Object.freeze(['ambEscriptor', 'demanaPersistencia', 'tanca']);
/* Noms que un port de només afegir no pot tindre, ni com a funció ni com a cap altra cosa. */
export const METODES_VETATS = Object.freeze([
  'actualitza', 'edita', 'modifica', 'substituix', 'reemplaca', 'esborra', 'elimina', 'buida', 'buidaTot',
  'desa', 'put', 'update', 'delete', 'remove', 'clear', 'set', 'esborraTot'
]);
export const ESQUEMA_LLIBRE = 'sdp.gestoria.verifactu.llibre.v1';

/* Les claus de les funcions (i de les propietats calculades) d'un objecte, també
   les heretades d'una classe, fins a Object.prototype. Reflect.ownKeys torna
   també les claus Symbol: un mètode amb clau Symbol és un mètode més, i la
   llista blanca no el pot deixar passar per no tindre nom de text. */
function funcionsDe(port) {
  const claus = new Set();
  for (let objecte = port; objecte && objecte !== Object.prototype; objecte = Object.getPrototypeOf(objecte)) {
    for (const clau of Reflect.ownKeys(objecte)) {
      const descriptor = Object.getOwnPropertyDescriptor(objecte, clau);
      if (clau !== 'constructor' && (typeof descriptor.value === 'function' || descriptor.get || descriptor.set)) claus.add(clau);
    }
  }
  return [...claus];
}

/**
 * Comprova que un adaptador complix el contracte de només afegir. Llança si no.
 * És una llista blanca: qualsevol funció que no siga dels quatre mètodes o
 * dels opcionals (reescriu, trunca, purga…) fa refusar l'adaptador.
 * @param {object} port
 * @returns {object} el mateix port
 */
export function validaPort(port) {
  if (!port || typeof port !== 'object') throw errorAmbCodi('PORT_INVALID', 'Cal un port de registre: { afegix, ultim, llig, exporta }.');
  const falten = METODES_PORT.filter((m) => typeof port[m] !== 'function');
  if (falten.length) throw errorAmbCodi('PORT_INVALID', `Al port li falten mètodes: ${falten.join(', ')}.`, falten);
  const permesos = new Set([...METODES_PORT, ...METODES_OPCIONALS]);
  /* String() fa llegible una clau Symbol («Symbol(reescriu)»): un join directe llançaria. */
  const sobrants = [...new Set([...METODES_VETATS.filter((m) => m in port), ...funcionsDe(port).filter((m) => !permesos.has(m))])].map(String);
  if (sobrants.length) throw errorAmbCodi('PORT_INVALID', `Un llibre de facturació només admet afegir: sobren ${sobrants.join(', ')}.`, sobrants);
  const noFuncions = METODES_OPCIONALS.filter((m) => m in port && typeof port[m] !== 'function');
  if (noFuncions.length) throw errorAmbCodi('PORT_INVALID', `${noFuncions.join(', ')}, si hi és, ha de ser una funció.`, noFuncions);
  return port;
}

/**
 * La còpia congelada amb què treballa afegix(): es verifica i es desa sempre
 * esta, mai l'objecte de qui crida, que podria canviar durant l'await del resum.
 * El que no és un objecte es torna tal qual, perquè el refuse la comprovació.
 * Un registre que no es pot copiar en JSON (un BigInt, una referència
 * circular, un getter que llança) no és un registre vàlid: REGISTRE_INVALID,
 * el mateix codi que la UI rebria de la validació, i no l'error sense codi
 * de JSON.stringify. El missatge original no es propaga: no cal, i podria
 * portar noms de camps de qui crida.
 * @param {unknown} registre
 * @returns {unknown}
 */
export function instantania(registre) {
  if (registre === null || typeof registre !== 'object') return registre;
  try {
    return copiaCongelada(registre);
  } catch {
    const motiu = 'El registre no es pot copiar en JSON (porta un BigInt, una referència circular o un valor que no es pot llegir).';
    throw errorAmbCodi('REGISTRE_INVALID', `Registre no vàlid: ${motiu}`, [motiu]);
  }
}

/* Un NIF que identifique la cadena: llegir amb una clau buida tornaria la d'un altre emissor. */
export function comprovaIdEmisor(idEmisor) {
  if (typeof idEmisor !== 'string' || idEmisor === '') throw new TypeError('Cal l\'idEmisor (el NIF de la cadena).');
}

/**
 * Abans de desar: el registre té la forma bona i l'empremta correspon als seus
 * camps. Amb la instantània d'afegix(), el llibre no guarda mai un registre
 * que no es puga verificar: el que es comprova ací és el que es desa.
 * Es fa fora de la transacció: un resum és asíncron i tancaria la d'IndexedDB.
 * @param {object} registre
 * @param {SubtleCrypto} [subtle]
 */
export async function comprovaEmpremta(registre, subtle) {
  const errors = validaRegistre(registre);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `Registre no vàlid: ${errors.join(' ')}`, errors);
  if ((await empremtaDeRegistre(registre, subtle)) !== registre.empremta) {
    throw errorAmbCodi('EMPREMTA_ALTERADA', 'L\'empremta no correspon als camps del registre: no es desa.');
  }
}

/**
 * La comprovació d'afegit que comparteixen els adaptadors. `estat` és el que
 * l'adaptador ha llegit en la MATEIXA operació en què desarà: l'últim registre
 * de l'emissor, l'alta de la mateixa factura i l'anul·lació, si n'hi ha.
 * Llança l'error amb codi; si no llança, el registre es pot desar.
 *
 * L'encadenament (RegistroAnterior) es compara SENCER amb el que tocaria,
 * encadenamentDe(ultim): emissor, número, data i empremta. L'empremta pròpia
 * del registre no cobrix el número ni la data de l'anterior (no entren al hash
 * de l'AEAT), i verificaCadena el refusaria després com a TRENCAMENT: ací es
 * refusa abans d'escriure (ENCADENAMENT_INCOHERENT), dins de la mateixa
 * operació. El hash oficial no es toca.
 * @param {object} registre
 * @param {{ ultim: object|null, alta: object|null, anulacio: object|null }} estat
 */
export function comprovaAfegit(registre, { ultim, alta, anulacio }) {
  const errors = validaRegistre(registre);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `Registre no vàlid: ${errors.join(' ')}`, errors);
  const esperat = ultim ? { ordre: ultim.ordre + 1, empremta: ultim.empremta } : { ordre: 1, empremta: null };
  if (registre.ordre !== esperat.ordre || (registre.encadenament?.empremta ?? null) !== esperat.empremta) {
    throw errorAmbCodi('CADENA_CANVIADA', 'El registre no va just darrere de l\'últim del llibre: algú hi ha escrit abans. Torna a llegir l\'últim i genera\'l de nou.');
  }
  const referencia = encadenamentDe(ultim);
  const discrepants = referencia ? Object.keys(referencia).filter((camp) => registre.encadenament[camp] !== referencia[camp]) : [];
  if (discrepants.length) {
    throw errorAmbCodi('ENCADENAMENT_INCOHERENT', `L'encadenament no diu quin és el registre anterior del llibre (${discrepants.join(', ')}): no es desa.`, discrepants);
  }
  if (registre.tipusRegistre === 'alta' && alta) {
    throw errorAmbCodi('DUPLICAT', `La factura ${registre.numSerie} del ${registre.dataExpedicio} ja està registrada.`);
  }
  if (registre.tipusRegistre === 'anulacio') {
    if (!alta) throw errorAmbCodi('FACTURA_INEXISTENT', `La factura ${registre.numSerie} no és al llibre: no es pot anul·lar.`);
    if (anulacio) throw errorAmbCodi('DUPLICAT', `La factura ${registre.numSerie} ja està anul·lada.`);
  }
}

/* Ordre del llibre: per emissor i, dins de cada emissor, per ordre de la cadena. */
export const perCadena = (a, b) => (a.idEmisor === b.idEmisor ? a.ordre - b.ordre : (a.idEmisor < b.idEmisor ? -1 : 1));

/**
 * El llibre en JSON canònic (claus ordenades, sense espais): la mateixa
 * còpia dona sempre els mateixos bytes, i se'n pot guardar l'empremta.
 * @param {object[]} registres
 * @returns {string}
 */
export function exportaLlibre(registres) {
  return jsonCanonic({ esquema: ESQUEMA_LLIBRE, registres: [...registres].sort(perCadena) });
}

/**
 * Llig una còpia del llibre i en torna els registres congelats, en l'ordre del llibre.
 * Valida l'estructura de cada registre; la cadena la verifica verificaCadena.
 * @param {string} text
 * @returns {ReadonlyArray<object>}
 */
export function llibreDesDeJson(text) {
  let llibre;
  try {
    llibre = JSON.parse(text);
  } catch {
    throw errorAmbCodi('COPIA_INVALIDA', 'La còpia del llibre no és JSON.');
  }
  if (llibre?.esquema !== ESQUEMA_LLIBRE || !Array.isArray(llibre.registres)) {
    throw errorAmbCodi('COPIA_INVALIDA', `La còpia no és un llibre de facturació (${ESQUEMA_LLIBRE}).`);
  }
  const errors = llibre.registres.flatMap((r, i) => validaRegistre(r).map((e) => `Registre ${i + 1}: ${e}`));
  if (errors.length) throw errorAmbCodi('COPIA_INVALIDA', `La còpia porta registres no vàlids: ${errors.slice(0, 5).join(' ')}`, errors);
  return copiaCongelada(llibre.registres);
}

/* Una fila d'execució: les operacions d'esta pestanya passen d'una en una. */
export function creaFila() {
  let cua = Promise.resolve();
  return (operacio) => {
    const pas = cua.then(operacio);
    cua = pas.catch(() => undefined);
    return pas;
  };
}

/**
 * Port en memòria: per a les proves i per a provar l'app sense desar res.
 * persistent: false; la UI ho ha de dir, perquè el llibre es perd en tancar.
 * @param {{ subtle?: SubtleCrypto }} [opcions]
 * @returns {Readonly<object>}
 */
export function creaPortMemoria({ subtle } = {}) {
  const registres = [];
  const enFila = creaFila();
  const deEmisor = (idEmisor) => registres.filter((r) => r.idEmisor === idEmisor);
  const busca = (tipusRegistre, r) => registres.find((x) => x.tipusRegistre === tipusRegistre && clauFactura(x) === clauFactura(r)) ?? null;
  return validaPort(Object.freeze({
    tipus: 'memoria',
    persistent: false,
    coordinacio: 'pestanya',
    async afegix(registre) {
      const propi = instantania(registre);
      comprovaIdEmisor(propi?.idEmisor);
      await comprovaEmpremta(propi, subtle);
      /* Des d'ací fins a desar no hi ha cap await: ningú no hi pot escriure entremig. */
      const propis = deEmisor(propi.idEmisor);
      comprovaAfegit(propi, {
        ultim: propis.length ? propis[propis.length - 1] : null,
        alta: busca('alta', propi),
        anulacio: busca('anulacio', propi)
      });
      registres.push(propi);
      return propi;
    },
    async ultim(idEmisor) {
      comprovaIdEmisor(idEmisor);
      const propis = deEmisor(idEmisor);
      return propis.length ? propis[propis.length - 1] : null;
    },
    async llig({ idEmisor, des = 1 } = {}) {
      if (idEmisor !== undefined) comprovaIdEmisor(idEmisor);
      const triats = idEmisor === undefined ? [...registres] : deEmisor(idEmisor);
      return Object.freeze(triats.filter((r) => r.ordre >= des).sort(perCadena));
    },
    async exporta() {
      return exportaLlibre(registres);
    },
    ambEscriptor(fn) {
      return enFila(fn);
    }
  }));
}

/* Cert si els dos registres fan el mateix JSON canònic; fals si un no es pot serialitzar. */
function igualCanonic(a, b) {
  try {
    return jsonCanonic(a) === jsonCanonic(b);
  } catch {
    return false;
  }
}

/**
 * La integritat de la còpia, separada de la verificació fiscal: la part de
 * la cadena d'un emissor que tenen el port i la còpia alhora ha de ser la
 * MATEIXA, registre a registre i sencera (JSON canònic), no només l'última
 * empremta. L'empremta de l'AEAT no cobrix el text de la factura (descripció,
 * noms, domicilis) ni el motiu d'una anul·lació: dos registres amb la mateixa
 * empremta poden portar textos diferents, i una «còpia exacta» no ho és.
 * Llança COPIA_DIVERGENT si les empremtes no coincidixen (una altra cadena) i
 * COPIA_ALTERADA si coincidixen però el contingut no (un dels dos llibres
 * s'ha retocat fora de l'empremta; d'ací no se sap quin, i no s'hi toca res).
 * Detectar un truncament o autenticar el llibre demana un punt de control
 * independent (ultimsConeguts de verificaCadena, la remissió a l'AEAT).
 * @param {string} idEmisor
 * @param {ReadonlyArray<object>} delPort la cadena de l'emissor al port, en ordre
 * @param {ReadonlyArray<object>} deLaCopia la de la còpia, en ordre i ja verificada
 */
export function comprovaSolapament(idEmisor, delPort, deLaCopia) {
  const comuns = Math.min(delPort.length, deLaCopia.length);
  for (let i = 0; i < comuns; i += 1) {
    if (delPort[i]?.ordre !== i + 1 || delPort[i].empremta !== deLaCopia[i].empremta) {
      throw errorAmbCodi('COPIA_DIVERGENT', `La cadena de ${idEmisor} del port no és la de la còpia: no s'hi toca res.`);
    }
    if (!igualCanonic(delPort[i], deLaCopia[i])) {
      throw errorAmbCodi('COPIA_ALTERADA', `El registre ${i + 1} de ${idEmisor} té la mateixa empremta al port i a la còpia, però no el mateix contingut: `
        + 'un dels dos llibres s\'ha retocat fora de l\'empremta. No s\'hi toca res.', [i + 1]);
    }
  }
}

/**
 * Bolca una còpia del llibre en un port, en dos passos separats:
 *   1. verificació fiscal: la còpia passa verifica (verificaCadena); si no, COPIA_INVALIDA;
 *   2. integritat de la còpia: la part que el port ja té de cada emissor ha de
 *      ser idèntica a la de la còpia (comprovaSolapament: COPIA_DIVERGENT o
 *      COPIA_ALTERADA), i només s'afig el que falta. Una còpia més vella que el
 *      port (el seu principi exacte) no hi afig res.
 * Si qualsevol emissor falla, no s'hi toca res.
 * @param {object} port
 * @param {string} text el JSON d'exportaLlibre
 * @param {{ verifica: (registres: object[]) => Promise<{ valida: boolean, incidencies: object[] }> }} p
 *   verificaCadena de cadena.js (s'injecta per a no fer de port.js un mòdul circular)
 * @returns {Promise<{ afegits: number }>}
 */
export async function restauraCopia(port, text, { verifica } = {}) {
  validaPort(port);
  if (typeof verifica !== 'function') throw new TypeError('restauraCopia necessita verifica (verificaCadena).');
  const registres = llibreDesDeJson(text);
  const informe = await verifica(registres);
  if (!informe.valida) throw errorAmbCodi('COPIA_INVALIDA', 'La còpia no passa la verificació de la cadena: no es restaura.', informe.incidencies);
  const perEmisor = new Map();
  for (const r of registres) {
    if (!perEmisor.has(r.idEmisor)) perEmisor.set(r.idEmisor, []);
    perEmisor.get(r.idEmisor).push(r);
  }
  const bolca = async () => {
    const pendents = [];
    for (const [idEmisor, cadena] of perEmisor) {
      const delPort = await port.llig({ idEmisor });
      comprovaSolapament(idEmisor, delPort, cadena);
      pendents.push(...cadena.slice(delPort.length));
    }
    for (const r of pendents) await port.afegix(r);
    return { afegits: pendents.length };
  };
  return typeof port.ambEscriptor === 'function' ? port.ambEscriptor(bolca) : bolca();
}
