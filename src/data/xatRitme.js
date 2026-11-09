/** Optional xatRitme DTO. Only explicit peer watermarks certify delivery. */
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const cursor = n => Number.isSafeInteger(n) && n >= 0;
const invalid = () => Object.assign(new Error('Resposta de ritme del xat invàlida.'), { code: 'BACKEND_RESPOSTA_INVALIDA', codi: 'BACKEND_RESPOSTA_INVALIDA' });
export function validaRitmeXat(value) {
  if (!value || !cursor(value.rebutPelsAltresFinsSeq) || !cursor(value.llegitPelsAltresFinsSeq)
    || value.llegitPelsAltresFinsSeq > value.rebutPelsAltresFinsSeq || !Array.isArray(value.escrivint) || value.escrivint.length > 20) throw invalid();
  const ids = new Set();
  const escrivint = value.escrivint.map(p => {
    if (!p || !uuid.test(p.usuariId) || !Number.isSafeInteger(p.vigentMs) || p.vigentMs < 1 || p.vigentMs > 8000 || ids.has(p.usuariId)) throw invalid();
    ids.add(p.usuariId);
    return { usuariId: p.usuariId, vigentMs: p.vigentMs };
  });
  return { rebutPelsAltresFinsSeq: value.rebutPelsAltresFinsSeq, llegitPelsAltresFinsSeq: value.llegitPelsAltresFinsSeq, escrivint };
}
export function validaPresenciaXat(value) {
  if (!value || !uuid.test(value.instancia) || !cursor(value.revisio) || typeof value.escrivint !== 'boolean') throw new TypeError('Presència del xat invàlida.');
  return { instancia: value.instancia, revisio: value.revisio, escrivint: value.escrivint };
}
