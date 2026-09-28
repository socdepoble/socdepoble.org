/* ═══════════════════════════════════════════════════════════════════
   T47b (ordre del Mestre, 260928) · COLUMNES OPCIONALS D'UNA TAULA

   Un camp nou del client (l'emoticona `icon` de T23; després, la data de
   publicació) pot arribar abans que la migració que li fa lloc. Sense
   això, PostgREST rebutja TOT el cos amb PGRST204 (o 42703) i cap altre
   camp del mateix desat arriba: la cua de Notes es quedava bloquejada.

   Quan el servidor nomena una columna OPCIONAL que va dins del cos:
     1. es recorda (en este mòdul, mentre dure la pàgina);
     2. es torna a enviar la resta, amb la mateixa petició (el PATCH no ha
        escrit res: PostgREST valida les columnes abans d'executar);
     3. qui crida rep `descartats` (noms del port) per a no donar-los per
        desats: la cua els conserva a l'esborrany del dispositiu.
   Si, llevat eixos camps, no queda res per enviar, no hi ha petició:
   ErrorColumnaAbsent (la cua el classifica com a 'columna').

   Una columna que no és opcional continua sent un error: mai s'amaga.
   Reutilitzable: creaColumnesOpcionals('taula', { campDelPort: 'columna' }).
   ═══════════════════════════════════════════════════════════════════ */
import { ErrorColumnaAbsent, columnaAbsent } from '../autodesament/errors.js';

export function creaColumnesOpcionals(taula, mapa) {
  const campDe = new Map(Object.entries(mapa).map(([camp, columna]) => [columna, camp]));
  const absents = new Set();

  /** El cos sense les columnes que el servidor ja ha dit que no té. */
  function filtra(cos) {
    const net = { ...cos };
    const descartats = [];
    for (const columna of absents) {
      if (!Object.hasOwn(net, columna)) continue;
      delete net[columna];
      descartats.push(campDe.get(columna));
    }
    return { cos: net, descartats };
  }

  /** Si l'error nomena una columna opcional que anava al cos, la recorda i torna true. */
  function recorda(error, cos) {
    const columna = columnaAbsent(error?.message);
    if (!columna || !campDe.has(columna) || !Object.hasOwn(cos, columna) || absents.has(columna)) return false;
    absents.add(columna);
    return true;
  }

  /**
   * Envia `cos` (claus = columnes) amb `peticio(cos)`. Torna { resultat,
   * descartats }. Com a molt, un reintent per columna opcional.
   */
  async function envia(cos, peticio) {
    for (;;) {
      const { cos: net, descartats } = filtra(cos);
      if (descartats.length && !Object.keys(net).length) {
        const columnes = descartats.map((camp) => mapa[camp]);
        throw new ErrorColumnaAbsent(
          `El servidor encara no té ${columnes.length > 1 ? 'les columnes' : 'la columna'} `
            + `${columnes.map((c) => `«${c}»`).join(', ')} de ${taula}: no queda res més per desar.`,
          { columna: columnes[0], camps: descartats },
        );
      }
      try {
        return { resultat: await peticio(net), descartats };
      } catch (error) {
        if (!recorda(error, net)) throw error;
      }
    }
  }

  return {
    filtra,
    recorda,
    envia,
    /** Les columnes que el servidor ha dit que no té (per a diagnosi i proves). */
    absents: () => [...absents],
  };
}

/** El DTO del port avisa dels camps que no s'han desat (no s'han de donar per confirmats). */
export function ambDescartats(dto, descartats) {
  return descartats?.length ? { ...dto, campsNoDesats: [...descartats] } : dto;
}
