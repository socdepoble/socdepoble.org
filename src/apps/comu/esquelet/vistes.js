/**
 * Esquelet comú de catàleg i col·lecció · l'estat de vista a la URL.
 *
 * Clàusula dels Slugs: tot el que diu què es veu viu a la URL, i la URL només
 * porta slugs i ids opacs (mai noms ni text lliure: el que s'escriu a
 * l'afegit ràpid no hi va).
 *   ?categoria=<id>   el filtre de categoria (sense: totes)
 *   ?vista=llista     graella o llista (la per defecte no s'escriu)
 *   ?article=<id>     el detall obert d'un article
 *   …/<tram>          el panell secundari en pantalla estreta: per defecte,
 *                     'colleccio' si el catàleg va primer i 'cataleg' si va
 *                     primer la col·lecció (rutesCatalegColleccio.js)
 * Navegar fa push (useParametresConsulta de la plataforma): arrere desfà.
 */
import { useMemo } from 'react';
import { useLocation, useNavigate, useRouter } from '../../../app/contexts/RouterContext';
import { esIdOpac, useParametresConsulta } from '../../plataforma/index.js';

export const VISTES_CATALEG = Object.freeze(['graella', 'llista']);
export const esVistaCataleg = (valor) => VISTES_CATALEG.includes(valor);

/** Els paràmetres de consulta de l'esquelet, amb els seus validadors. */
export const PARAMETRES_CATALEG = Object.freeze({ categoria: esIdOpac, vista: esVistaCataleg, article: esIdOpac });

/** Quina columna veu primer la persona en pantalla estreta. */
export const PRIMERS = Object.freeze(['cataleg', 'colleccio']);
const TRAM_SECUNDARI = Object.freeze({ cataleg: 'colleccio', colleccio: 'cataleg' });

export const primerDe = (primer) => (PRIMERS.includes(primer) ? primer : 'cataleg');

/** El tram del panell secundari: el que diu l'app o el per defecte del primer. */
export const tramDe = (primer, tram) => (typeof tram === 'string' && tram !== '' ? tram : TRAM_SECUNDARI[primerDe(primer)]);

/**
 * La vista del catàleg segons la URL: { categoria, vista, article } i les
 * accions que l'escriuen (push). Triar una categoria tanca el detall.
 * Tornar a triar el que ja es veu (la pastilla activa, el detall ja obert o
 * ja tancat) no navega: cada entrada de l'historial és una vista diferent i
 * el primer «arrere» sempre fa alguna cosa. Les accions tornen si han navegat.
 */
export function useVistaCataleg(vistaPerDefecte = 'graella') {
  const [valors, posa] = useParametresConsulta(PARAMETRES_CATALEG);
  const perDefecte = esVistaCataleg(vistaPerDefecte) ? vistaPerDefecte : 'graella';
  return useMemo(() => {
    const vista = valors.vista || perDefecte;
    return Object.freeze({
      categoria: valors.categoria,
      vista,
      article: valors.article,
      triaCategoria: (id) => {
        const nova = id || null;
        if (nova === valors.categoria && valors.article === null) return false;
        return posa({ categoria: nova, article: null });
      },
      triaVista: (nova) => (nova === vista ? false : posa({ vista: nova === perDefecte ? null : nova })),
      obriArticle: (id) => (id === valors.article ? false : posa({ article: id })),
      tancaArticle: () => (valors.article === null ? false : posa({ article: null }))
    });
  }, [valors, posa, perDefecte]);
}

/**
 * On és la persona (catàleg o col·lecció) i com es va a l'altra banda, a
 * partir del camí: el panell secundari és el camí d'entrada més `/<tram>`.
 * Els href són per a l'atribut (amb la base del router); vesA navega (push).
 * Canviar de banda conserva categoria i vista, i tanca el detall obert.
 */
export function useVistesEsquelet({ primer, tram } = {}) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { basename = '' } = useRouter();
  const primerNet = primerDe(primer);
  const tramNet = tramDe(primerNet, tram);
  return useMemo(() => {
    const cami = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const secundari = cami.endsWith(`/${tramNet}`);
    const base = secundari ? cami.slice(0, -(tramNet.length + 1)) : cami;
    const consulta = new URLSearchParams(search);
    consulta.delete('article');
    const text = consulta.toString();
    const amb = (desti) => (text ? `${desti}?${text}` : desti);
    const primerCami = amb(base || '/');
    const secundariCami = amb(`${base}/${tramNet}`);
    const cataleg = primerNet === 'cataleg' ? primerCami : secundariCami;
    const colleccio = primerNet === 'cataleg' ? secundariCami : primerCami;
    const altre = primerNet === 'cataleg' ? 'colleccio' : 'cataleg';
    return Object.freeze({
      primer: primerNet,
      tram: tramNet,
      veient: secundari ? altre : primerNet,
      cataleg: Object.freeze({ cami: cataleg, href: basename + cataleg, vesA: () => navigate(cataleg) }),
      colleccio: Object.freeze({ cami: colleccio, href: basename + colleccio, vesA: () => navigate(colleccio) })
    });
  }, [pathname, search, primerNet, tramNet, basename, navigate]);
}
