import { capturaBaixaRevisioPatrimoni, capturaConsultaRevisionsPatrimoni, capturaEdicioRevisioPatrimoni,
  errorRevisioPatrimoni } from './revisionsPatrimoni.js';

const clauPeca = ({ entitatTipus, entitatSlug }) => `${entitatTipus}:${entitatSlug}`;

export function creaRevisionsPatrimoniLocal(usuari, nouId = () => globalThis.crypto.randomUUID()) {
  const peces = new Map();
  function exigeixAutor(previ) {
    const actor = usuari()?.id;
    if (!actor) throw errorRevisioPatrimoni('sense-sessio');
    // El mode local només coneix l'autoria que ell mateix ha registrat.
    if (previ && previ.autor !== actor) throw errorRevisioPatrimoni('revisio-no-vigent');
    return actor;
  }
  function comprovaSenyal(config) {
    if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
  }
  function versioVigent(previ, entrada) {
    if ((previ?.revisio.versio ?? 0) !== entrada.versio || previ?.revisio.id !== entrada.id) {
      throw errorRevisioPatrimoni('revisio-no-vigent');
    }
  }
  return {
    llistaRevisionsPatrimoni(input, config = {}) {
      const consulta = capturaConsultaRevisionsPatrimoni(input);
      comprovaSenyal(config);
      const campanyes = peces.get(clauPeca(consulta));
      return Array.from(campanyes?.values() ?? [], ({ revisio }) => revisio)
        .filter(({ campanyaAny }) => consulta.abansAny === null || campanyaAny < consulta.abansAny)
        .sort((a, b) => b.campanyaAny - a.campanyaAny)
        .slice(0, consulta.limit);
    },
    desaRevisioPatrimoni(input, config = {}) {
      const entrada = capturaEdicioRevisioPatrimoni(input);
      comprovaSenyal(config);
      const clau = clauPeca(entrada);
      const campanyes = peces.get(clau) ?? new Map();
      const previ = campanyes.get(entrada.campanyaAny);
      const autor = exigeixAutor(previ);
      versioVigent(previ, entrada);
      if (entrada.versio === 2147483647) throw errorRevisioPatrimoni('revisio-no-vigent');
      const revisio = Object.freeze({ ...entrada, id: entrada.id ?? nouId(), versio: entrada.versio + 1 });
      campanyes.set(revisio.campanyaAny, { autor, revisio });
      peces.set(clau, campanyes);
      return revisio;
    },
    esborraRevisioPatrimoni(input, config = {}) {
      const entrada = capturaBaixaRevisioPatrimoni(input);
      comprovaSenyal(config);
      const clau = clauPeca(entrada);
      const campanyes = peces.get(clau);
      const previ = campanyes?.get(entrada.campanyaAny);
      exigeixAutor(previ);
      versioVigent(previ, entrada);
      campanyes.delete(entrada.campanyaAny);
      if (!campanyes.size) peces.delete(clau);
      return true;
    }
  };
}
