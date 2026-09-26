import { useEffect, useRef } from 'react';

/**
 * usePullToRefresh — «lliscar cap avall per recarregar la pàgina» (mòbil).
 *
 * La Llei de Scroll de Pedra Seca deixa el body quiet (overscroll-behavior:
 * none) i això anul·la el refresc natiu del navegador: este hook el suplix.
 * Una recàrrega que l'usuari no volia és pitjor que cap, per això el gest
 * només s'arma quan no hi ha cap dubte:
 *   · al touchstart, CAP contenidor entre el dit i la superfície pot tindre
 *     contingut per damunt. A Notes, Mur i Xat el scroll viu en columnes
 *     internes: mirar només el contenidor general armava el gest a mitja
 *     llista i, en passar el llindar, recarregava quan l'usuari volia pujar;
 *   · bloqueig de direcció: el primer moviment decidix. Horitzontal, en
 *     diagonal o cap amunt → el gest és del navegador fins que s'alce el dit;
 *   · preventDefault només amb el gest enganxat (i si es pot cancel·lar);
 *   · resistència: el contingut baixa menys que el dit;
 *   · touchcancel o un segon dit reinicien sense recarregar;
 *   · exclusions: camps de text, select, contenteditable, diàlegs oberts,
 *     canvas, el graf de la Wiki i tot allò amb touch-action: none;
 *   · dins d'un ShadowRoot (<soc-de-poble> incrustat) no s'activa: la
 *     recàrrega s'enduria la pàgina amfitriona.
 *
 * El DOM es toca directament (transform dins d'un rAF, data-* i el text de
 * l'indicador): un setState per touchmove repintaria el shell sencer. La
 * presentació (opacitat, transicions, moviment reduït) viu a navegacio.css.
 *
 * Contracte de DOM:
 *   indicador[data-estat] = repos | estirant | llest | recarregant
 *   contingut[data-ptr]   = actiu (seguint el dit) | solt (tornant o fixat)
 */

export const LLINDAR_PTR = 100;          // px de recorregut visible per a recarregar
export const RESISTENCIA_PTR = 0.55;     // el contingut baixa el 55 % del que baixa el dit
const RECORREGUT_MAX = LLINDAR_PTR + 40; // tope visual del contingut
const MARGE_DECISIO = 8;                 // px de moviment abans de decidir la direcció
const DURADA_TORNADA = 400;              // ms: una mica més que --sdp-t-lenta (0,3 s)

const TEXTOS_PER_DEFECTE = Object.freeze({
  estirant: 'Estira per recarregar…',
  llest: 'Deixa anar per recarregar…',
  recarregant: 'Recarregant…'
});

const SELECTOR_EXCLOS = [
  'input', 'textarea', 'select',
  '[contenteditable]:not([contenteditable="false"])',
  'dialog[open]', 'canvas', '.sdp-wiki-graf'
].join(', ');

/* Cert si `el` encara té contingut per damunt (no és a dalt de tot). Els
   contenidors invertits (flex column-reverse, com un xat que arranca per
   baix) tenen el cim a -(scrollHeight - clientHeight), no a 0. */
function teContingutPerDamunt(el, vista) {
  const top = el.scrollTop;
  if (top > 0) return true;
  const recorregut = el.scrollHeight - el.clientHeight;
  if (recorregut <= 0) return false;
  const estil = vista.getComputedStyle(el);
  const invers = /(auto|scroll|overlay)/.test(estil.overflowY)
    && estil.flexDirection === 'column-reverse'
    && estil.display.includes('flex');
  return invers && top > 1 - recorregut;
}

/* El gest només pot nàixer on el dit no toca res que tinga el seu propi
   significat tàctil i on tot el camí fins a la superfície està a dalt. */
function gestPermes(objectiu, superficie, vista) {
  if (objectiu.closest(SELECTOR_EXCLOS)) return false;
  for (let node = objectiu; node; node = node.parentElement) {
    if (teContingutPerDamunt(node, vista)) return false;
    if (vista.getComputedStyle(node).touchAction === 'none') return false;
    if (node === superficie) break;
  }
  // El body no fa scroll (Llei de Scroll); si mai en fa, també es respecta.
  const doc = superficie.ownerDocument;
  return !((doc?.scrollingElement?.scrollTop || 0) > 0);
}

function elementDe(objectiu) {
  if (!objectiu) return null;
  return objectiu.nodeType === 1 ? objectiu : objectiu.parentElement || null;
}

export function usePullToRefresh({
  superficieRef,
  contingutRef,
  indicadorRef,
  textos,
  onRecarrega,
  actiu = true
}) {
  // Textos i acció canvien d'identitat amb l'idioma: es lligen en viu sense
  // tornar a enganxar els listeners.
  const textosRef = useRef(textos);
  const onRecarregaRef = useRef(onRecarrega);
  useEffect(() => {
    textosRef.current = textos;
    onRecarregaRef.current = onRecarrega;
  });

  useEffect(() => {
    const superficie = superficieRef.current;
    const contingut = contingutRef.current;
    const indicador = indicadorRef.current;
    if (!actiu || !superficie || !contingut || !indicador) return undefined;

    // Incrustat dins d'un ShadowRoot: la pàgina no és nostra.
    const arrel = superficie.getRootNode?.();
    if (typeof ShadowRoot !== 'undefined' && arrel instanceof ShadowRoot) return undefined;

    const vista = superficie.ownerDocument?.defaultView || window;
    const demanaMarc = vista.requestAnimationFrame
      ? (fn) => vista.requestAnimationFrame(fn)
      : (fn) => vista.setTimeout(fn, 16);
    const cancelaMarc = vista.cancelAnimationFrame
      ? (id) => vista.cancelAnimationFrame(id)
      : (id) => vista.clearTimeout(id);

    let gest = null;       // { x0, y0, fase: 'possible' | 'enganxat' | 'descartat', recorregut }
    let estat = 'repos';
    let marc = null;
    let rellotge = null;
    let viu = true;

    const posaEstat = (nou) => {
      if (estat === nou) return;
      estat = nou;
      indicador.dataset.estat = nou;
      indicador.textContent = nou === 'repos'
        ? ''
        : (textosRef.current?.[nou] || TEXTOS_PER_DEFECTE[nou]);
    };

    const posaRecorregut = (px) => {
      contingut.style.transform = px > 0 ? `translateY(${px}px)` : '';
      indicador.style.transform = px > 0 ? `translateY(calc(${px}px - 100%))` : '';
    };

    const pinta = () => {
      marc = null;
      if (gest?.fase === 'enganxat') posaRecorregut(gest.recorregut);
    };

    const aturaMarc = () => {
      if (marc != null) {
        cancelaMarc(marc);
        marc = null;
      }
    };

    // Deixa anar el contingut: la transició de tornada (o de fixació) és del
    // CSS; passat el temps, el contingut torna a no dur cap atribut.
    const solta = () => {
      contingut.dataset.ptr = 'solt';
      vista.clearTimeout(rellotge);
      // Un gest nou que s'enganxa cancel·la este rellotge (torna a «actiu»).
      rellotge = vista.setTimeout(() => {
        if (estat === 'repos') delete contingut.dataset.ptr;
      }, DURADA_TORNADA);
    };

    const reinicia = () => {
      if (!viu) return;
      gest = null;
      aturaMarc();
      if (estat === 'repos') return;
      solta();
      posaRecorregut(0);
      posaEstat('repos');
    };

    const recarrega = () => {
      gest = null;
      aturaMarc();
      solta();
      posaRecorregut(LLINDAR_PTR);
      posaEstat('recarregant');
      let resultat;
      try {
        resultat = (onRecarregaRef.current || (() => vista.location.reload()))();
      } catch (error) {
        reinicia();
        console.error('[usePullToRefresh] La recàrrega ha fallat:', error);
        return;
      }
      // Una acció asíncrona torna l'indicador a repòs quan acaba; la recàrrega
      // de la pàgina el deixa dient «Recarregant…» fins que la pàgina se'n va.
      if (resultat && typeof resultat.then === 'function') resultat.then(reinicia, reinicia);
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) {
        // Un segon dit (zoom) desfà qualsevol gest en curs.
        if (gest?.fase === 'enganxat') reinicia();
        else gest = null;
        return;
      }
      // Una recàrrega que no s'ha arribat a fer (cancel·lada) no queda penjada.
      if (estat === 'recarregant') reinicia();
      gest = null;
      const objectiu = elementDe(e.target);
      if (!objectiu || !gestPermes(objectiu, superficie, vista)) return;
      const toc = e.touches[0];
      gest = { x0: toc.clientX, y0: toc.clientY, fase: 'possible', recorregut: 0 };
    };

    const onTouchMove = (e) => {
      if (!gest || gest.fase === 'descartat') return;
      if (e.touches.length !== 1) {
        reinicia();
        return;
      }
      const toc = e.touches[0];
      const dx = toc.clientX - gest.x0;
      const dy = toc.clientY - gest.y0;

      if (gest.fase === 'possible') {
        if (Math.abs(dx) < MARGE_DECISIO && Math.abs(dy) < MARGE_DECISIO) return;
        if (dy <= 0 || Math.abs(dx) >= dy) {
          gest.fase = 'descartat';
          return;
        }
        gest.fase = 'enganxat';
        vista.clearTimeout(rellotge);
        contingut.dataset.ptr = 'actiu';
      }

      if (e.cancelable) e.preventDefault();
      gest.recorregut = Math.min(RECORREGUT_MAX, Math.max(0, dy * RESISTENCIA_PTR));
      posaEstat(gest.recorregut >= LLINDAR_PTR ? 'llest' : 'estirant');
      if (marc == null) marc = demanaMarc(pinta);
    };

    const onTouchEnd = (e) => {
      if (!gest) return;
      if (e.touches && e.touches.length > 0) return; // encara queda algun dit
      if (gest.fase !== 'enganxat') {
        gest = null;
        return;
      }
      if (gest.recorregut >= LLINDAR_PTR) recarrega();
      else reinicia();
    };

    const onTouchCancel = () => {
      if (gest?.fase === 'enganxat') reinicia();
      gest = null;
    };

    indicador.dataset.estat = 'repos';
    superficie.addEventListener('touchstart', onTouchStart, { passive: true });
    superficie.addEventListener('touchmove', onTouchMove, { passive: false });
    superficie.addEventListener('touchend', onTouchEnd, { passive: true });
    superficie.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      viu = false;
      superficie.removeEventListener('touchstart', onTouchStart);
      superficie.removeEventListener('touchmove', onTouchMove);
      superficie.removeEventListener('touchend', onTouchEnd);
      superficie.removeEventListener('touchcancel', onTouchCancel);
      aturaMarc();
      vista.clearTimeout(rellotge);
      contingut.style.transform = '';
      delete contingut.dataset.ptr;
      indicador.style.transform = '';
      indicador.textContent = '';
      delete indicador.dataset.estat;
    };
  }, [superficieRef, contingutRef, indicadorRef, actiu]);
}
