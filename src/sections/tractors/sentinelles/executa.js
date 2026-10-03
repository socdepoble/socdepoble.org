/**
 * executa.js — el corredor dels sentinelles. FAIL-CLOSED.
 *
 * L'ordre no es pot canviar:
 *   1. el descriptor complix el contracte sdp.sentinella.v1 i és L0;
 *   2. l'aprovació vigent és la del manifest d'esta versió exacta
 *      (exigeixAprovacio, la mateixa porta que els tractors de la Gestoria);
 *   3. només llavors es preparen els fitxers triats i s'observa;
 *   4. l'eixida es valida abans de tornar-la.
 * Qualsevol dubte és un error en valencià i no s'observa res. El sentinella
 * no escriu, no envia i no paga: torna banderes i, si en fa, un informe.
 */
import { ErrorAprovacio, exigeixAprovacio } from '../nucli/aprovacio.js';
import { jsonCanonic } from '../nucli/canonic.js';
import { manifestNet } from '../nucli/empremta.js';
import { instantDe } from '../nucli/registre.js';
import { ErrorSentinella, NIVELLS_EXECUTABLES, SEVERITATS, banderaDe, validaEixida, validaSentinella } from './contracte.js';

function mateixManifest(rebut, propi) {
  try {
    return jsonCanonic(manifestNet(rebut)) === jsonCanonic(manifestNet(propi));
  } catch {
    return false;
  }
}

/* La porta: l'aprovació vigent, i que siga la del manifest d'este sentinella. */
async function exigeixSentinella(aprovacio, subtle, propi) {
  try {
    await exigeixAprovacio({ ...aprovacio, subtle });
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut comprovar l'aprovació de ${propi.id}.`, { cause: error });
  }
  const id = aprovacio?.manifest?.id;
  if (id !== propi.id) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `L'aprovació rebuda és ${typeof id === 'string' ? `de «${id}»` : "d'un tractor sense identificador"}, no d'este sentinella (${propi.id}).`);
  }
  if (!mateixManifest(aprovacio.manifest, propi)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `El manifest aprovat no és el d'esta versió de ${propi.id}: torna a llegir-ne la fitxa i a aprovar-lo.`);
  }
}

const copiaAvis = ({ codi, severitat, missatge, font }) => Object.freeze({ codi, severitat, missatge, font });

/**
 * Executa un sentinella L0 sobre el que ha triat la persona.
 * @param {object} p
 * @param {object} p.sentinella el descriptor (definixSentinella)
 * @param {object} [p.entrada] les dades ja preparades; o bé
 * @param {object[]} [p.fitxers] els fitxers triats ({ nom, bytes }): es preparen amb entrada.prepara DESPRÉS de la porta
 * @param {object} p.aprovacio el de contextAprovacio(id): { manifest, empremta, registres, claus, origen, rpId, ara }
 * @param {SubtleCrypto} [p.subtle]
 * @param {number|string|Date} p.ara l'instant de l'observació
 * @returns {Promise<Readonly<{ id: string, versio: string, ara: string, bandera: 'roja'|'groga'|'cap',
 *   resum: { roja: number, groga: number, info: number }, avisos: object[], informe?: string }>>}
 */
export async function executaSentinella({ sentinella, entrada, fitxers, aprovacio, subtle, ara } = {}) {
  const errors = validaSentinella(sentinella);
  if (errors.length) {
    throw new ErrorSentinella('CONTRACTE_INVALID', `El sentinella no complix el contracte sdp.sentinella.v1: ${errors[0]}`);
  }
  if (!NIVELLS_EXECUTABLES.includes(sentinella.nivell)) {
    throw new ErrorSentinella('NIVELL_NO_EXECUTABLE', `Este carril només executa sentinelles L0 (diagnostiquen i proposen). «${sentinella.nom}» és ${sentinella.nivell}.`);
  }
  await exigeixSentinella(aprovacio, subtle, sentinella.manifest);

  const ms = instantDe(ara);
  if (!Number.isFinite(ms)) throw new ErrorSentinella('PARAMETRES_INVALIDS', 'Cal l’instant d’ara per a observar: no s’ha observat res.');
  if (entrada !== undefined && fitxers !== undefined) {
    throw new ErrorSentinella('PARAMETRES_INVALIDS', 'Passa l’entrada preparada o els fitxers triats, no les dues coses.');
  }

  let eixida;
  try {
    const dades = fitxers !== undefined ? sentinella.entrada.prepara(fitxers) : entrada;
    eixida = sentinella.observa(dades, { ara: ms });
  } catch (error) {
    if (error instanceof ErrorSentinella) throw error;
    throw new ErrorSentinella('ERROR_INTERN', `«${sentinella.nom}» s'ha aturat sense acabar d'observar. No s'ha escrit ni enviat res.`, { cause: error });
  }
  const errorsEixida = validaEixida(eixida);
  if (errorsEixida.length) {
    throw new ErrorSentinella('EIXIDA_INVALIDA', `L'eixida de «${sentinella.nom}» no complix el contracte: ${errorsEixida[0]}`);
  }

  const avisos = Object.freeze(eixida.avisos.map(copiaAvis));
  const resum = Object.freeze(Object.fromEntries(SEVERITATS.map((s) => [s, avisos.filter((a) => a.severitat === s).length])));
  return Object.freeze({
    id: sentinella.id,
    versio: sentinella.manifest.versio,
    ara: new Date(ms).toISOString(),
    bandera: banderaDe(avisos),
    resum,
    avisos,
    ...(eixida.informe !== undefined ? { informe: eixida.informe } : {})
  });
}
