/**
 * Esquelet comú de catàleg i col·lecció · l'estat de vista a la URL.
 *
 * Clàusula dels Slugs: tot el que diu què es veu viu a la URL, i la URL només
 * porta slugs i ids opacs (mai noms ni text lliure: el que s'escriu a
 * l'afegit ràpid no hi va).
 *   ?categoria=<id>   el filtre de categoria (sense: totes)
 *   ?vista=llista     graella o llista (la per defecte no s'escriu)
 *   ?article=<id>     el detall obert d'un article
 *   ?seccio=<slug>    la secció de la Pàgina Universal de l'article (l'escriu
 *                     l'Índex); l'esquelet només l'esborra en deixar l'article
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

/* Ordre del Mestre, 261004 (auditoria 0605, «?seccio= sobreviu al tancament de
   l'article») · La secció de la Pàgina Universal (?seccio=, la clau que hi
   escriu l'Índex, seleccioUrl.js) és de l'article obert: «una secció és d'un
   document». L'esquelet no la llig ni l'escriu mai; només l'esborra quan
   l'article canvia o es tanca. El validador ho refusa tot: un valor ni es llig
   ni s'escriu, i null l'esborra (useParametresConsulta). */
const NOMES_S_ESBORRA = () => false;
/* Ordre del Mestre, 261004 (integració final, F04 de Codex) · ?fitxa=<id>: la pàgina pròpia
   d'un article (PaginaApp a la columna del catàleg, forma="targetes"), compartible i que es pot
   recarregar. Només un id opac (un article propi és «p-<n>»: cap nom ni dada personal a la URL).
   No és de PARAMETRES_CATALEG: qui no fa servir les targetes no la veu. */
const PARAMETRES_DE_LA_VISTA = Object.freeze({ ...PARAMETRES_CATALEG, seccio: NOMES_S_ESBORRA, fitxa: esIdOpac });
const SENSE_SECCIO = Object.freeze({ seccio: null });

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
 * Obrir un altre article, tancar-lo o triar una categoria esborren també la
 * secció de l'article que es deixa (?seccio=): no passa a la notícia següent.
 */
export function useVistaCataleg(vistaPerDefecte = 'graella') {
  const [valors, posa] = useParametresConsulta(PARAMETRES_DE_LA_VISTA);
  const { currentPath, searchParams } = useRouter();
  const consulta = searchParams ? searchParams.toString() : '';
  const perDefecte = esVistaCataleg(vistaPerDefecte) ? vistaPerDefecte : 'graella';
  return useMemo(() => {
    const vista = valors.vista || perDefecte;
    /* La fitxa oberta es tanca amb la categoria (la pàgina ocupa el lloc de la graella). Sense
       fitxa, l'esborrat no canvia res de la URL: el Bar i la Salut no la fan servir. */
    const senseFitxa = valors.fitxa === null ? null : { fitxa: null };
    return Object.freeze({
      categoria: valors.categoria,
      vista,
      article: valors.article,
      fitxa: valors.fitxa,
      triaCategoria: (id) => {
        const nova = id || null;
        if (nova === valors.categoria && valors.article === null && valors.fitxa === null) return false;
        return posa({ categoria: nova, article: null, ...SENSE_SECCIO, ...senseFitxa });
      },
      /* La fitxa: obrir-la tanca el diàleg del detall (?article=); tancar-la, tots dos. */
      obriFitxa: (id) => (id === valors.fitxa && valors.article === null ? false : posa({ fitxa: id, article: null, ...SENSE_SECCIO })),
      tancaFitxa: () => (valors.fitxa === null ? false : posa({ fitxa: null, article: null, ...SENSE_SECCIO })),
      triaVista: (nova) => (nova === vista ? false : posa({ vista: nova === perDefecte ? null : nova })),
      obriArticle: (id) => (id === valors.article ? false : posa({ article: id, ...SENSE_SECCIO })),
      tancaArticle: () => (valors.article === null ? false : posa({ article: null, ...SENSE_SECCIO })),
      /* Ordre del Mestre, 261004 (integració final, F05 de Codex: «Compartir una notícia des de
         la targeta compartix la llista») · La ruta del detall d'un article (camí de l'app i
         consulta, sense la base: la hi posen el Link i Compartir), la mateixa a què porta
         obriArticle, sense navegar: l'href de la targeta i la URL de Compartir del seu peu.
         `cami` (opcional): el camí canònic de la llista, si no és l'actual (l'entrada de l'app,
         que després es canonitzaria). Conserva la resta de la consulta (vista, categoria) i
         esborra la secció de l'article que es deixa. null si l'id no és opac o l'app és fora de
         la seua base. */
      rutaArticle: (id, cami = currentPath) => {
        if (!esIdOpac(id) || typeof cami !== 'string' || !cami.startsWith('/')) return null;
        const nous = new URLSearchParams(consulta);
        nous.set('article', id);
        nous.delete('seccio');
        return `${cami}?${nous.toString()}`;
      }
    });
  }, [valors, posa, perDefecte, currentPath, consulta]);
}

/**
 * On és la persona (catàleg o col·lecció) i com es va a l'altra banda, a
 * partir del camí: el panell secundari és el camí d'entrada més `/<tram>`.
 * Els href són per a l'atribut (amb la base del router); vesA navega (push).
 * Canviar de banda conserva categoria i vista, i tanca el detall obert (amb
 * la seua secció, ?seccio=, que és d'eixe article).
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
    consulta.delete('seccio');
    /* Ordre del Mestre, 261004 (integració final) · La fitxa també és del catàleg que es deixa. */
    consulta.delete('fitxa');
    const text = consulta.toString();
    const amb = (desti) => (text ? `${desti}?${text}` : desti);
    const primerCami = amb(base || '/');
    const secundariCami = amb(`${base}/${tramNet}`);
    const cataleg = primerNet === 'cataleg' ? primerCami : secundariCami;
    const colleccio = primerNet === 'cataleg' ? secundariCami : primerCami;
    const altre = primerNet === 'cataleg' ? 'colleccio' : 'cataleg';
    /* Arreglo del verificador (ordre del Mestre, 261004, «la fitxa no és compartible entre
       amplades») · La fitxa (?fitxa=<id>) viu a la columna del catàleg. Quan el catàleg no és la
       columna primera (La compra: primer la col·lecció), en estret el camí sense tram obri el
       panell de la col·lecció damunt de la fitxa. `fitxa(id)` porta al camí del catàleg amb la
       fitxa (push; `{ replace: true }` per a canonitzar un enllaç), i conserva categoria i vista.
       false si l'id no és opac. */
    const fitxa = (id, opcions) => {
      if (!esIdOpac(id)) return false;
      const ambFitxa = new URLSearchParams(text);
      ambFitxa.set('fitxa', id);
      const desti = primerNet === 'cataleg' ? (base || '/') : `${base}/${tramNet}`;
      navigate(`${desti}?${ambFitxa.toString()}`, opcions);
      return true;
    };
    return Object.freeze({
      primer: primerNet,
      tram: tramNet,
      veient: secundari ? altre : primerNet,
      cataleg: Object.freeze({ cami: cataleg, href: basename + cataleg, vesA: () => navigate(cataleg), fitxa }),
      colleccio: Object.freeze({ cami: colleccio, href: basename + colleccio, vesA: () => navigate(colleccio) })
    });
  }, [pathname, search, primerNet, tramNet, basename, navigate]);
}
