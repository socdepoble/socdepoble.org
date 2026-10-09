/**
 * autobloqueig.js — el vigilant que tanca el cofre quan ningú no el mira.
 *
 * Onada 6, ordre del Mestre (261009): cofre xifrat. Mentre el cofre és
 * obert, es bloqueja sol:
 *   · després de 10 minuts sense activitat (tecla, punter, roda o toc);
 *   · si la pestanya està amagada més de 5 minuts;
 *   · en pagehide (tancar, recarregar, navegar fora o entrar a la memòria
 *     cau d'anada i tornada).
 * Els temporitzadors dormen quan l'ordinador dorm i el navegador els
 * alenteix en les pestanyes amagades: per això no es refia només d'ells. Cada
 * activitat, cada tornada a la vista i cada pageshow o focus comparen el
 * rellotge amb l'última activitat i amb l'instant en què es va amagar, i
 * bloquegen abans de renovar res si el temps ja havia passat.
 * L'entorn (la finestra, amb el seu document), el rellotge i els
 * temporitzadors s'injecten per a les proves. Sense xarxa ni emmagatzematge.
 */

export const TEMPS_AUTOBLOQUEIG = Object.freeze({ inactivitat: 10 * 60 * 1000, oculta: 5 * 60 * 1000 });
const ACTIVITAT = Object.freeze(['pointerdown', 'keydown', 'wheel', 'touchstart']);
const REVISIO = Object.freeze(['pageshow', 'focus']);
const ESCOLTA = Object.freeze({ capture: true, passive: true });

const potEscoltar = (objecte) => typeof objecte?.addEventListener === 'function' && typeof objecte?.removeEventListener === 'function';

/**
 * Arrenca el vigilant.
 * @param {object} opcions
 * @param {(motiu: 'inactivitat'|'oculta'|'pagehide') => void} opcions.bloqueja
 * @param {object} [opcions.entorn] per defecte globalThis (la finestra)
 * @param {{ inactivitat: number, oculta: number }} [opcions.temps]
 * @param {() => number} [opcions.rellotge]
 * @param {{ setTimeout: Function, clearTimeout: Function }} [opcions.temporitzadors]
 * @returns {{ atura: () => void, activitat: () => void, readonly actiu: boolean }}
 */
export function vigilaInactivitat({
  bloqueja, entorn = globalThis, temps = TEMPS_AUTOBLOQUEIG, rellotge = () => Date.now(), temporitzadors = globalThis
}) {
  if (typeof bloqueja !== 'function') throw new TypeError('El vigilant necessita bloqueja().');
  const doc = entorn?.document ?? null;
  let actiu = true;
  let darrera = rellotge();
  let ocultaDes = null;
  let tInactivitat = null;
  let tOculta = null;

  const neteja = () => {
    temporitzadors.clearTimeout(tInactivitat);
    temporitzadors.clearTimeout(tOculta);
    tInactivitat = null;
    tOculta = null;
  };

  function atura() {
    if (!actiu) return;
    actiu = false;
    neteja();
    if (potEscoltar(entorn)) {
      for (const tipus of ACTIVITAT) entorn.removeEventListener(tipus, activitat, ESCOLTA);
      for (const tipus of REVISIO) entorn.removeEventListener(tipus, revisa);
      entorn.removeEventListener('pagehide', enPagehide);
    }
    if (potEscoltar(doc)) doc.removeEventListener('visibilitychange', enVisibilitat);
  }

  function bloquejaAra(motiu) {
    if (!actiu) return;
    atura();
    bloqueja(motiu);
  }

  function programaInactivitat() {
    temporitzadors.clearTimeout(tInactivitat);
    tInactivitat = temporitzadors.setTimeout(revisa, Math.max(0, darrera + temps.inactivitat - rellotge()));
  }

  /* Compara el rellotge amb els dos límits; si cap no ha passat, torna a programar. */
  function revisa() {
    if (!actiu) return;
    const ara = rellotge();
    if (ara - darrera >= temps.inactivitat) {
      bloquejaAra('inactivitat');
      return;
    }
    if (ocultaDes !== null && ara - ocultaDes >= temps.oculta) {
      bloquejaAra('oculta');
      return;
    }
    programaInactivitat();
  }

  function activitat() {
    if (!actiu) return;
    // Un despertar després d'un son llarg no renova la sessió: la tanca.
    if (rellotge() - darrera >= temps.inactivitat) {
      bloquejaAra('inactivitat');
      return;
    }
    darrera = rellotge();
    programaInactivitat();
  }

  function enVisibilitat() {
    if (!actiu) return;
    if (doc?.visibilityState === 'hidden') {
      ocultaDes = rellotge();
      temporitzadors.clearTimeout(tOculta);
      tOculta = temporitzadors.setTimeout(revisa, temps.oculta);
      return;
    }
    const des = ocultaDes;
    ocultaDes = null;
    temporitzadors.clearTimeout(tOculta);
    tOculta = null;
    if (des !== null && rellotge() - des >= temps.oculta) {
      bloquejaAra('oculta');
      return;
    }
    revisa();
  }

  function enPagehide() {
    bloquejaAra('pagehide');
  }

  if (potEscoltar(entorn)) {
    for (const tipus of ACTIVITAT) entorn.addEventListener(tipus, activitat, ESCOLTA);
    for (const tipus of REVISIO) entorn.addEventListener(tipus, revisa);
    entorn.addEventListener('pagehide', enPagehide);
  }
  if (potEscoltar(doc)) doc.addEventListener('visibilitychange', enVisibilitat);
  programaInactivitat();
  if (doc?.visibilityState === 'hidden') enVisibilitat();

  return Object.freeze({
    atura,
    activitat,
    get actiu() {
      return actiu;
    }
  });
}
