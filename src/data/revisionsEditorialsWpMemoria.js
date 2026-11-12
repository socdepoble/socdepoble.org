const ESTATS_REVISIO_WP_REMOT = Object.freeze(['pendent_admin', 'amb_observacions', 'aprovat']);
const RE_DESTI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function creaRevisionsEditorialsWpLocal(usuari, ara = () => new Date().toISOString()) {
  const files = new Map();

  function comprovaSenyal(config) {
    if (config?.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  }

  function exigeixSessio() {
    const actor = usuari?.();
    if (!actor?.id) {
      throw Object.assign(new Error('Cal sessió d’administració per desar revisions editorials.'), {
        code: 'sense-permis',
        status: 403
      });
    }
    return actor;
  }

  return {
    llistaRevisionsEditorialsWp(config = {}) {
      comprovaSenyal(config);
      exigeixSessio();
      return Array.from(files.values()).map((f) => ({ ...f })).sort((a, b) => a.wpId - b.wpId);
    },
    desaRevisioEditorialWp(entrada, config = {}) {
      if (
        !entrada
        || typeof entrada !== 'object'
        || Array.isArray(entrada)
        || !Number.isInteger(entrada.wpId)
        || entrada.wpId <= 0
        || !ESTATS_REVISIO_WP_REMOT.includes(entrada.estat)
        || (entrada.nota !== undefined && (typeof entrada.nota !== 'string' || entrada.nota.length > 4000))
        || (entrada.autoria !== undefined && (typeof entrada.autoria !== 'string' || !entrada.autoria.trim() || entrada.autoria.length > 256))
        || (entrada.desti !== undefined && (typeof entrada.desti !== 'string' || entrada.desti.length > 64 || !RE_DESTI.test(entrada.desti)))
      ) {
        throw new TypeError('Entrada de revisió editorial WordPress invàlida.');
      }
      comprovaSenyal(config);
      exigeixSessio();
      const fila = Object.freeze({
        wpId: entrada.wpId,
        estat: entrada.estat,
        nota: entrada.nota ?? '',
        autoria: entrada.autoria ? entrada.autoria.trim() : 'Sóc de Poble',
        desti: entrada.desti ?? 'mur',
        actualitzatA: String(ara())
      });
      files.set(fila.wpId, fila);
      return { ...fila };
    }
  };
}
