/** Optional coordination for asynchronous callers. Journal commits also work
 * when the capability is unavailable; an executed callback is never retried. */
export function ambPanyMapaRevisions(operacio) {
  let locks, request;
  try { locks = globalThis.navigator?.locks; request = locks?.request; }
  catch (error) { if (error?.name === 'SecurityError') return operacio(); throw error; }
  if (typeof request !== 'function') return operacio();
  let iniciada = false;
  const reserva = error => { if (!iniciada && error?.name === 'SecurityError') return operacio(); throw error; };
  try { return Promise.resolve(request.call(locks, 'sdp:publicacions.revisions.v1', { mode: 'exclusive' }, () => { iniciada = true; return operacio(); })).catch(reserva); }
  catch (error) { return reserva(error); }
}
