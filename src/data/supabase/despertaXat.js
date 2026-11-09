/** Best-effort wake after durable confirmation. It never retries a send,
 * exposes a worker credential, or turns a relay response into delivery. */
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function despertaXatConfirmat(client, { missatgeId, seq, signal }, vigent) {
  /* Sanejament R15 (B2 · P1-01, Q-06) · notifica-xat-desperta (amb 2611080431) no és a
     producció: sense la bandera literal del xat R54 (la mateixa porta client-xat-r54
     que el ritme), cap petició. Vite la plega i el cos de baix cau del paquet. */
  if (import.meta.env.VITE_SDP_XAT_RITME !== '1') return false;
  try {
    if (!UUID.test(missatgeId) || !Number.isSafeInteger(seq) || seq < 1 || signal?.aborted
      || typeof client?.functions?.invoke !== 'function' || !vigent()) return false;
    void Promise.resolve().then(() => {
      if (signal?.aborted || !vigent()) return;
      // This installed SDK supports timeout and signal; no JWT is read here.
      return client.functions.invoke('notifica-xat-desperta', {
        body: { missatgeId }, timeout: 8000, ...(signal ? { signal } : {})
      });
    }).catch(() => {});
    return true;
  } catch { return false; }
}
