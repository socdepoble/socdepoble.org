/** The four preview fields come from ONE server-visible message. Explicit null
 * is authoritative: do not restore stale cached text when all messages hide. */
export function previaFilServidor(fila) {
  const text = value => typeof value === 'string' ? value : null;
  return {
    ultimText: text(fila.ultim_text),
    ultimAl: text(fila.ultim_al),
    ultimAutorId: text(fila.ultim_autor_id),
    ultimTipus: text(Object.hasOwn(fila, 'ultim_tipus') ? fila.ultim_tipus : fila.ultimTipus)
  };
}
