/**
 * useEnquadramentDeImatge.js — P0-80 / IDEA-211 (llei del Mestre, 09-11-2026):
 * ENQUADRAMENT NO DESTRUCTIU. El pintor del marc: una foto pujada és sencera
 * i el marc que va triar la persona viu al fragment #sdp-crop= de la seua
 * adreça (utils/enquadramentUrl.js). Este ganxo el llig i el pinta amb CSS
 * (object-fit: cover, object-position, transform: scale i clip-path al mateix
 * punt), amb propietats pròpies escrites des d'una ref (usePropietatsCss: cap
 * atribut style). Les regles viuen a modules.css (bloc ENQUADRAMENT NO
 * DESTRUCTIU).
 *
 *   const pintor = useEnquadramentDeImatge(src, { caixa, ref, onLoad });
 *   <img ref={pintor.ref} src={pintor.src} className={…pintor.className}
 *        onLoad={pintor.onLoad} />
 *
 * caixa ('mesura', de sèrie) · La caixa ja té la seua forma (la targeta, la
 *   miniatura del llistat): es mesura en carregar la foto (i en canviar de
 *   mida), amb l'object-position que la caixa ja donava (la targeta s'ancora
 *   dalt), i es pinta el que la caixa ensenyava del fitxer retallat d'abans
 *   (posicioEnCaixa).
 * caixa ('marc') · La caixa pren la forma del marc (la portada de la fitxa,
 *   que s'ensenyava sencera): --enquadrament-forma en dona l'aspect-ratio en
 *   carregar la foto (abans, sense mida natural, no ocupa res).
 * ref · una ref d'objecte de la peça, si en té (rep el mateix node). El ganxo
 *   torna la seua pròpia ref de funció, que és la que va a l'<img>.
 * onLoad · el de la peça, que es continua cridant.
 *
 * Sense fragment, el ganxo no fa res: el src, la classe i l'onLoad de sempre
 * (Llei del Píxel per a totes les imatges d'abans, també les ja retallades).
 * Torna { ref, src, className, onLoad, enquadrament, ratioMarc }: `src` és la
 * base (sense fragment), `className` les classes que cal afegir ('' sense
 * marc) i `ratioMarc` la proporció del marc (o null), per a qui decidix si
 * una portada és vertical.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { posicioEnCaixa, ratioDelMarc, retallCssDelZoom, separaEnquadrament } from '../utils/enquadramentUrl.js';
import { usePropietatsCss } from './usePropietatsCss.js';

export const CLASSE_IMATGE_ENQUADRADA = 'sdp-imatge-enquadrada';
export const CLASSE_IMATGE_ENQUADRADA_MARC = 'sdp-imatge-enquadrada--marc';

const PARAULES = Object.freeze({ left: 0, top: 0, center: 0.5, right: 1, bottom: 1 });
const MIG = Object.freeze({ x: 0.5, y: 0.5 });

/* Un component d'object-position en fracció: un percentatge o una paraula
   clau; una longitud (px) no es pot passar a fracció sense la mida: el mig. */
function fraccio(tros) {
  if (Object.hasOwn(PARAULES, tros)) return PARAULES[tros];
  const percentatge = /^(-?\d+(?:\.\d+)?)%$/.exec(tros);
  return percentatge ? Math.min(1, Math.max(0, Number(percentatge[1]) / 100)) : 0.5;
}

/** L'object-position que la caixa dona a la imatge (calculat: «50% 0%» per a top), en fraccions. */
export function alineacioDe(img) {
  try {
    const trossos = String(globalThis.getComputedStyle?.(img)?.objectPosition || '').trim().split(/\s+/);
    return trossos.length === 2 ? { x: fraccio(trossos[0]), y: fraccio(trossos[1]) } : MIG;
  } catch {
    return MIG;
  }
}

export function useEnquadramentDeImatge(src, { caixa = 'mesura', ref: refDeFora = null, onLoad = undefined } = {}) {
  const marc = caixa === 'marc';
  const { base, enquadrament } = separaEnquadrament(src);
  /* L'<img> viu en una ref de funció: si la peça la torna a muntar (la
     capçalera de l'editor, en acabar d'editar), les propietats van al node
     nou. Només una imatge amb marc demana un pintat més per a saber-ho; la
     resta, cap (els llistats de targetes no paguen res). La ref de la peça
     (`ref`), si n'hi ha, rep el mateix node. */
  const nodeRef = useRef(null);
  const ambMarcRef = useRef(false);
  ambMarcRef.current = Boolean(enquadrament);
  const [versioNode, setVersioNode] = useState(0);
  const ref = useCallback((node) => {
    if (refDeFora && typeof refDeFora === 'object') refDeFora.current = node;
    if (nodeRef.current === node) return;
    nodeRef.current = node;
    if (node && ambMarcRef.current) setVersioNode((v) => v + 1);
  }, [refDeFora]);
  /* La ref que llig usePropietatsCss: un objecte nou quan canvia el node (o
     quan la imatge guanya el marc), perquè el seu efecte hi torne a escriure. */
  const ambMarc = Boolean(enquadrament);
  const refDelNode = useMemo(() => ({ current: nodeRef.current, versio: versioNode, ambMarc }), [versioNode, ambMarc]);
  /* La lectura de la foto carregada, lligada a la seua base: { base,
     ratioImatge, ratioCaixa, alineacio }. Una foto nova torna a començar. */
  const [lectura, setLectura] = useState(null);
  const actual = enquadrament && lectura?.base === base ? lectura : null;
  const ratioMarc = enquadrament ? ratioDelMarc(enquadrament.format, actual?.ratioImatge ?? null) : null;
  const punt = actual
    ? posicioEnCaixa(enquadrament, actual.ratioImatge, marc ? null : actual.ratioCaixa, { alineacio: actual.alineacio })
    : null;
  /* Les propietats arriben amb la foto carregada (abans, la caixa no té mida
     i res no es pinta): el load les escriu en la mateixa tasca. */
  usePropietatsCss(refDelNode, punt ? {
    '--enquadrament-x': `${punt.x}%`,
    '--enquadrament-y': `${punt.y}%`,
    '--enquadrament-zoom': punt.zoom,
    '--enquadrament-retall': retallCssDelZoom(punt),
    '--enquadrament-forma': marc && ratioMarc ? Math.round(ratioMarc * 10000) / 10000 : null,
  } : {});

  /* L'alineació de la caixa es llig una sola vegada, sense la classe del
     marc (que la trepitja): és de la caixa, no de cada foto. */
  const alineacioRef = useRef(null);
  const llig = useCallback((img) => {
    if (!enquadrament || !img) return null;
    const { naturalWidth: amplada, naturalHeight: alcada } = img;
    if (!(amplada > 0 && alcada > 0)) return null;
    if (!marc && !alineacioRef.current && !img.classList.contains(CLASSE_IMATGE_ENQUADRADA)) alineacioRef.current = alineacioDe(img);
    const ample = img.clientWidth;
    const alt = img.clientHeight;
    return {
      base,
      ratioImatge: amplada / alcada,
      ratioCaixa: !marc && ample > 0 && alt > 0 ? ample / alt : null,
      alineacio: marc ? null : (alineacioRef.current || MIG),
    };
  }, [enquadrament, marc, base]);

  /* Una foto que ja era a la memòria cau pot haver carregat abans que React
     hi escolte el load: es llig ací, abans de pintar. */
  useLayoutEffect(() => {
    const img = refDelNode.current;
    if (!enquadrament || !img?.complete || lectura?.base === base) return;
    const nova = llig(img);
    if (nova) setLectura(nova);
  }, [refDelNode, enquadrament, base, lectura, llig]);

  /* La caixa pot canviar de forma (una graella que passa d'una a dues
     columnes): es torna a mesurar, amb la mateixa alineació. */
  useLayoutEffect(() => {
    const img = refDelNode.current;
    if (marc || !enquadrament || !img || typeof ResizeObserver !== 'function') return undefined;
    const observador = new ResizeObserver(() => {
      const ample = img.clientWidth;
      const alt = img.clientHeight;
      if (!(ample > 0 && alt > 0)) return;
      setLectura((previa) => (previa && previa.base === base && Math.abs((previa.ratioCaixa ?? 0) - ample / alt) > 1e-3
        ? { ...previa, ratioCaixa: ample / alt } : previa));
    });
    observador.observe(img);
    return () => observador.disconnect();
  }, [refDelNode, marc, enquadrament, base]);

  /* Com MitjaEnquadrada (UniversalCard): el load es confirma dins de la
     mateixa tasca (flushSync), perquè la foto no es pinte ni un fotograma
     sense el seu marc. */
  const onLoadAmbMarc = (ev) => {
    const nova = llig(ev.currentTarget);
    if (nova) flushSync(() => setLectura(nova));
    onLoad?.(ev);
  };

  const classes = enquadrament && (marc || punt)
    ? [CLASSE_IMATGE_ENQUADRADA, marc ? CLASSE_IMATGE_ENQUADRADA_MARC : null].filter(Boolean).join(' ')
    : '';
  return {
    ref,
    src: enquadrament ? base : src,
    className: classes,
    onLoad: enquadrament ? onLoadAmbMarc : onLoad,
    enquadrament,
    ratioMarc,
  };
}

/** Les classes d'una imatge amb les del marc (sense cap espai de més ni cap classe buida). */
export const ambClassesDelMarc = (...classes) => classes.filter(Boolean).join(' ') || undefined;

/**
 * La proporció que es veu d'una foto de `amplada` × `alcada` (les naturals):
 * la del seu marc si l'adreça en porta (#sdp-crop=), o la de la foto. Per a
 * qui decidix si una portada és vertical (PageFrame, VisorDePublicacio): una
 * panoràmica enquadrada en 9:16 es pinta vertical, com el seu retall d'abans.
 */
export function proporcioVisible(src, amplada, alcada) {
  const ratio = amplada / alcada;
  const { enquadrament } = separaEnquadrament(src);
  return (enquadrament && ratioDelMarc(enquadrament.format, ratio)) || ratio;
}
