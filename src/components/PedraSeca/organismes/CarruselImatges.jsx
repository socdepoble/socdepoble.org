/**
 * CarruselImatges.jsx — passar les fotos d'un element sense eixir de la
 * imatge principal (ordre del Mestre, 261007: «aquest producte té 8 imatges.
 * Implementa un carrusel a la imatge principal d'aquesta pàgina universal
 * perquè l'usuari puga passar les fotos»). Estils a src/css/components.css
 * (§ CARRUSEL D'IMATGES).
 *
 * COM ÉS. Una pista amb desplaçament horitzontal i scroll-snap: cada foto
 * ocupa l'amplada sencera i el dit, la roda o el trackpad la passen com
 * sempre, sense cap llibreria. Damunt, els botons «Imatge anterior» i
 * «Imatge següent» (àrea de --sdp-touch) i el comptador «1 / 8». Els botons i
 * les fletxes del teclat donen la volta: després de l'última ve la primera.
 * Inici i Fi porten a la primera i a l'última.
 *
 * CONTRACTE
 *   imatges   [{ src, alt }] | string[] · les fotos, en ordre. La primera és
 *             la principal: es pinta sense loading="lazy" i la resta, amb.
 *             Les que no porten src es descarten. Els src han d'arribar ja
 *             resolts (resolveAsset): la peça no en sap res, d'amfitrions.
 *   etiqueta  string · el nom del carrusel («Imatges de …»). Per defecte,
 *             «Imatges».
 *   etiquetes { anterior, seguent, diapositives, posicio, carrusel,
 *             diapositiva } · els textos per al lector, ja traduïts per qui el
 *             munta (revisió del 261007, M9: la peça és presentacional i no
 *             llig cap context). anterior i seguent, el nom dels dos botons;
 *             diapositives, el de la pista; posicio, la plantilla «Imatge {n}
 *             de {total}» de cada diapositiva i del comptador; carrusel i
 *             diapositiva, els aria-roledescription. Per defecte, en valencià.
 *   className classes de més per a l'arrel.
 * Amb una sola imatge, la imatge tal qual, sense pista ni controls: el mateix
 * marcatge que la portada de PageFrame (Llei del Píxel). Sense cap, res.
 *
 * ACCESSIBILITAT (el patró Carousel de l'APG). L'arrel és una <section> amb
 * nom i aria-roledescription="carrusel"; cada diapositiva, un role="group"
 * amb aria-roledescription="diapositiva" i el nom «Imatge X de N». El
 * comptador és una regió viva educada: diu «Imatge 2 de 8» en canviar. La
 * pista rep el focus (es desplaça: el teclat hi ha d'arribar) i les fletxes
 * hi funcionen, com als botons. Revisió S5 (261007): un element que rep el
 * focus porta rol i nom; la pista és el grup «Diapositives», que conté les
 * diapositives. Cap rotació automàtica.
 *
 * MOVIMENT. El pas és suau, llevat que la persona demane moviment reduït
 * (prefers-reduced-motion): llavors salta. El comptador seguix el dit: quan
 * la pista para, diu la foto que es veu.
 *
 * ON VA. A la portada de la Pàgina Universal (PageFrame, ranura
 * topBarData.heroComponent): ItemDetailSection el munta per als productes
 * amb més d'una foto. La primera diapositiva ÉS la portada: no es pinta dues
 * vegades (pla 261006_1140).
 *
 * Dins de PedraSeca/, esta peça importa per camí directe (mai per index.js):
 * la porta de dependències circulars de Pedra Seca ho exigix. Qui la munta
 * des de fora de PedraSeca/ (ItemDetailSection, l'espècimen) la pren de la
 * façana, index.js, com qualsevol altra peça.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';

const ETIQUETA = 'Imatges';
const ETIQUETES = Object.freeze({
  anterior: 'Imatge anterior',
  seguent: 'Imatge següent',
  diapositives: 'Diapositives',
  posicio: 'Imatge {n} de {total}',
  carrusel: 'carrusel',
  diapositiva: 'diapositiva'
});

/* «Imatge {n} de {total}» amb els números. El reemplaçador és una funció: una
   plantilla traduïda amb «$» no fa res d'estrany. */
const posicioDe = (plantilla, n, total) => plantilla
  .replace('{n}', () => String(n))
  .replace('{total}', () => String(total));

/* Quant ha d'estar quieta la pista per a donar-la per parada: el comptador
   no salta de número a mitjan pas. */
const ESPERA_PARADA_MS = 100;

const textDe = (valor, reserva) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : reserva);

/** Les imatges netes: [{ src, alt }], sense les que no porten src. */
export function imatgesDelCarrusel(imatges) {
  if (!Array.isArray(imatges)) return [];
  return imatges
    .map((imatge) => (typeof imatge === 'string' ? { src: imatge } : imatge))
    .filter((imatge) => imatge && typeof imatge.src === 'string' && imatge.src.trim() !== '')
    .map((imatge) => ({ src: imatge.src.trim(), alt: typeof imatge.alt === 'string' ? imatge.alt : '' }));
}

/* La finestra de la pista: dins d'un amfitrió (WordPress), la del document
   on viu l'arrel ombra, no cap global endevinada. */
function movimentReduit(node) {
  try {
    const finestra = node?.ownerDocument?.defaultView;
    return Boolean(finestra?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

export function CarruselImatges({ imatges, etiqueta, etiquetes, className }) {
  const llista = imatgesDelCarrusel(imatges);
  const total = llista.length;
  const pistaRef = useRef(null);
  const paradaRef = useRef(null);
  const [actual, setActual] = useState(0);
  const index = Math.min(actual, Math.max(0, total - 1));

  useEffect(() => () => clearTimeout(paradaRef.current), []);

  /* Porta la pista a la diapositiva `desti`, amb la volta: abans de la
     primera, l'última; després de l'última, la primera. */
  const vesA = useCallback((desti) => {
    if (total < 2) return;
    const seguent = ((desti % total) + total) % total;
    setActual(seguent);
    const pista = pistaRef.current;
    if (!pista) return;
    const left = seguent * pista.clientWidth;
    if (typeof pista.scrollTo === 'function') {
      pista.scrollTo({ left, behavior: movimentReduit(pista) ? 'auto' : 'smooth' });
    } else {
      pista.scrollLeft = left;
    }
  }, [total]);

  /* El dit, la roda o el trackpad: quan la pista para, la foto que es veu. */
  const enDesplacar = () => {
    clearTimeout(paradaRef.current);
    paradaRef.current = setTimeout(() => {
      const pista = pistaRef.current;
      if (!pista || !pista.clientWidth) return;
      const vista = Math.round(pista.scrollLeft / pista.clientWidth);
      setActual(Math.min(Math.max(vista, 0), total - 1));
    }, ESPERA_PARADA_MS);
  };

  /* Les fletxes, Inici i Fi, des de la pista o des dels botons. Amb una
     tecla modificadora no es toca res (Alt+fletxa és «arrere» al navegador). */
  const enTecla = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const destins = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: total - 1 };
    if (!Object.hasOwn(destins, event.key)) return;
    event.preventDefault();
    vesA(destins[event.key]);
  };

  if (!total) return null;
  if (total === 1) return <img src={llista[0].src} alt={llista[0].alt} />;

  const text = Object.fromEntries(Object.entries(ETIQUETES).map(([clau, reserva]) => [clau, textDe(etiquetes?.[clau], reserva)]));
  const classes = ['sdp-carrusel', className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-roledescription={text.carrusel} aria-label={textDe(etiqueta, ETIQUETA)} onKeyDown={enTecla}>
      <div className="sdp-carrusel__pista" ref={pistaRef} tabIndex={0} onScroll={enDesplacar}
        role="group" aria-label={text.diapositives}>
        {llista.map((imatge, i) => (
          <div key={`${i}-${imatge.src}`} className="sdp-carrusel__diapositiva" role="group"
            aria-roledescription={text.diapositiva} aria-label={posicioDe(text.posicio, i + 1, total)}>
            <img className="sdp-carrusel__imatge" src={imatge.src} alt={imatge.alt} draggable="false"
              loading={i === 0 ? undefined : 'lazy'} decoding={i === 0 ? undefined : 'async'} />
          </div>
        ))}
      </div>
      <div className="sdp-carrusel__controls">
        <Boto varietat="secundari" className="sdp-carrusel__boto" icona={ChevronLeft}
          aria-label={text.anterior} onClick={() => vesA(index - 1)} />
        <Boto varietat="secundari" className="sdp-carrusel__boto" icona={ChevronRight}
          aria-label={text.seguent} onClick={() => vesA(index + 1)} />
      </div>
      <p className="sdp-carrusel__comptador" aria-live="polite" aria-atomic="true">
        <span aria-hidden="true">{`${index + 1} / ${total}`}</span>
        <span className="sdp-nomes-lector">{posicioDe(text.posicio, index + 1, total)}</span>
      </p>
    </section>
  );
}
