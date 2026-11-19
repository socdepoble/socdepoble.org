/** IDEA-284 · Quantitats d'estoc en unitats enteres mínimes (p. ex. grams).
 * Les taxes/terminis admeten enters segurs o decimals textuals de 6 xifres.
 * Tot càlcul intermedi és BigInt; s'arredonix cap amunt una sola vegada.
 * La reserva de clau ha de ser atòmica al backend: este motor pur no escriu.
 */
const ESCALA = 1_000_000n;
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
function enter(v, camp, minim = 0) {
  if (!Number.isSafeInteger(v) || v < minim) throw new TypeError(`${camp}: cal un enter segur >= ${minim}`);
  return BigInt(v);
}
function decimal(v, camp) {
  if (Number.isSafeInteger(v) && v >= 0) return BigInt(v) * ESCALA;
  if (typeof v !== 'string' || v.length > 24 || !/^(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,6})?$/.test(v)) {
    throw new TypeError(`${camp}: cal un decimal positiu textual (fins a 6 decimals)`);
  }
  const [unitats, fraccio = ''] = v.split('.');
  const resultat = BigInt(unitats) * ESCALA + BigInt(fraccio.padEnd(6, '0'));
  if (resultat > MAX * ESCALA) throw new RangeError(`${camp}: fora de rang`);
  return resultat;
}
function numero(v) {
  if (v < 0n || v > MAX) throw new RangeError('Resultat fora de les unitats enteres segures');
  return Number(v);
}
const sostre = (a, b) => (a + b - 1n) / b;
function identificador(v, camp) {
  if (typeof v !== 'string' || !v || v.length > 160 || v !== v.normalize('NFC') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(v)) {
    throw new TypeError(`${camp}: identificador no canònic`);
  }
  return `${v.length}:${v}`;
}

/** Clau sense hash ni col·lisions: (tenant, magatzem, article, cicle).
 * Un canvi de quantitat no canvia la identitat d'una ordre del mateix cicle.
 * El consumidor obri un cicle nou només després de reconciliar l'anterior.
 */
export function clauReposicio({ tenantId, magatzemId, articleId, cicle }) {
  return `reposicio:v1:${[identificador(tenantId, 'tenantId'), identificador(magatzemId, 'magatzemId'),
    identificador(articleId, 'articleId'), identificador(cicle, 'cicle')].join('|')}`;
}

/** Fórmula conservadora: ceil(maxDemanda × maxTermini − mitjana × termini).
 * Una estimació màxima no pot ser inferior a la seua mitjana.
 */
export function calculaEstocSeguretat({ demandaDiaria, terminiDies, demandaMaximaDiaria, terminiMaximDies }) {
  const d = decimal(demandaDiaria, 'demandaDiaria'), t = decimal(terminiDies, 'terminiDies');
  const dm = decimal(demandaMaximaDiaria, 'demandaMaximaDiaria'), tm = decimal(terminiMaximDies, 'terminiMaximDies');
  if (dm < d || tm < t) throw new RangeError('Els màxims han de ser >= les mitjanes');
  return numero(sostre(dm * tm - d * t, ESCALA * ESCALA));
}

/** Punt de comanda = ceil(demanda × termini + seguretat).
 * Posició = existències + en trànsit − reserves. A igualtat es reposa.
 * L'objectiu per defecte és el punt + un lot; una comanda es redondeja
 * a múltiples de lot, respectant el mínim. Cancel·lades no bloquegen retry.
 */
export function reposicioAntiDobleComanda(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw new TypeError('Cal una entrada');
  const { demandaDiaria, terminiDies, estocActual, enComanda = 0, reservat = 0,
    lot = 1, minimComanda = 1, comandes = [] } = entrada;
  const clauIdempotencia = clauReposicio(entrada);
  const seguretat = entrada.estocSeguretat === undefined
    ? calculaEstocSeguretat(entrada) : numero(enter(entrada.estocSeguretat, 'estocSeguretat'));
  const punt = sostre(decimal(demandaDiaria, 'demandaDiaria') * decimal(terminiDies, 'terminiDies')
    + BigInt(seguretat) * ESCALA * ESCALA, ESCALA * ESCALA);
  const actual = enter(estocActual, 'estocActual'), pendent = enter(enComanda, 'enComanda');
  const reserves = enter(reservat, 'reservat'), midaLot = enter(lot, 'lot', 1), minim = enter(minimComanda, 'minimComanda', 1);
  const posicio = actual + pendent - reserves;
  if (posicio < -MAX || posicio > MAX) throw new RangeError('Posició fora de rang');
  const objectiu = entrada.estocObjectiu === undefined ? punt + midaLot : enter(entrada.estocObjectiu, 'estocObjectiu');
  if (objectiu <= punt) throw new RangeError('estocObjectiu ha de superar el punt de comanda');
  if (!Array.isArray(comandes) || comandes.length > 100_000) throw new TypeError('Comandes no acotades');
  let duplicada = false;
  for (const ordre of comandes) {
    if (!ordre || typeof ordre !== 'object' || typeof ordre.clauIdempotencia !== 'string'
      || !['pendent', 'enviada', 'confirmada', 'rebuda', 'cancel_lada', 'fallida'].includes(ordre.estat)) {
      throw new TypeError('Estat de comanda desconegut');
    }
    if (ordre.clauIdempotencia === clauIdempotencia && ordre.estat !== 'cancel_lada' && ordre.estat !== 'fallida') duplicada = true;
  }
  const necessita = posicio <= punt;
  const delta = objectiu - posicio;
  const quantitat = necessita && !duplicada ? sostre(delta > minim ? delta : minim, midaLot) * midaLot : 0n;
  return Object.freeze({ clauIdempotencia, estocSeguretat: seguretat, puntComanda: numero(punt),
    estocObjectiu: numero(objectiu), posicioEstoc: Number(posicio), quantitatComanda: numero(quantitat),
    calComandar: quantitat > 0n, motiu: duplicada ? 'comanda_ja_registrada' : necessita ? 'punt_assolit' : 'estoc_suficient' });
}
