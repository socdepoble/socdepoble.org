/**
 * client.js — Client de SOLLUTIA. Només lectura, per construcció.
 *
 * ZERO EXIGÈNCIES (Mestre, 260911): consumim els endpoints i el JSON que
 * Sollutia ja oferix, amb el token de la persona usuària. No demanem cap
 * endpoint a mida i no escrivim a la seua casa.
 *
 * · Només GET. `escriu()` existix per a fallar: no hi ha llista blanca
 *   d'escriptures fins que una ADR la signe (ESCRIPTURES_PERMESES = []).
 * · Mai DDL, mai clau de servei: el token és el de la sessió de l'usuari.
 * · Tota resposta passa per un traductor; el client no torna JSON cru.
 */
import { ErrorFrontera } from '../traductor.js';
import { RECURSOS } from './recursos.js';

export const ESCRIPTURES_PERMESES = Object.freeze([]);

export function creaClientSollutia({ baseUrl, obtenToken, fetchImpl = globalThis.fetch, onAvis = () => {} }) {
  if (!baseUrl) throw new ErrorFrontera('falta baseUrl de Sollutia');
  if (!baseUrl.startsWith('https://')) throw new ErrorFrontera('baseUrl de Sollutia ha de ser HTTPS');

  async function llig(nomRecurs, params = {}, { signal } = {}) {
    const r = RECURSOS[nomRecurs];
    if (!r) throw new ErrorFrontera(`recurs desconegut «${nomRecurs}»`);
    if (!r.ruta || !r.traductor) throw new ErrorFrontera(`recurs «${nomRecurs}» pendent de contracte (sense captura real)`);
    const url = new URL(r.ruta, baseUrl);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const token = await obtenToken?.();
    const resp = await fetchImpl(url, {
      method: 'GET', signal, credentials: 'omit',
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!resp.ok) throw new ErrorFrontera(`${nomRecurs}: HTTP ${resp.status}`, { status: resp.status });
    const cru = await resp.json();
    const { dtos, dto, avisos } = r.llista ? r.traductor.llista(r.extrau ? r.extrau(cru) : cru) : r.traductor(cru);
    avisos.forEach(onAvis);
    return r.llista ? dtos : dto;
  }

  function escriu(nomRecurs) {
    if (!ESCRIPTURES_PERMESES.includes(nomRecurs)) {
      throw new ErrorFrontera(`escriptura no permesa a Sollutia: «${nomRecurs}». Cal una ADR que l'afija a ESCRIPTURES_PERMESES.`);
    }
    throw new ErrorFrontera('escriptures encara no implementades');
  }

  return Object.freeze({ llig, escriu });
}
