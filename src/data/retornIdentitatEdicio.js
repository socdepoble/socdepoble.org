/**
 * retornIdentitatEdicio.js — R32.45 · IDEA-324 v3 · Memòria efímera de
 * l'actor previ quan `useEdicioEnLloc` commuta automàticament la identitat
 * activa (p. ex. `Javi Llinares -> Sóc de Poble` o `Javi -> El Rentonar`) per
 * editar una pàgina o publicació in situ.
 *
 * Viu en memòria + sessionStorage perquè sobrevisca a recàrregues dins de la
 * mateixa pestanya sense contaminar altres pestanyes ni persistir en tancar-la.
 *
 * v1.2.23 · costura Porta Persistència (ordre del Mestre 261123) · la capa de
 * sessió es toca només a través de la capa efímera de src/config/storage.js
 * (getEfimer/setEfimer/delEfimer), com mana tractor-persistencia.mjs (L2).
 * La clau real passa a ser `sdp_embed_edicio:retorn_identitat:v1`: el kit
 * R32.45 no ha eixit mai a producció, així que no hi ha cap valor antic a
 * migrar.
 *
 * v1.2.23 · L5-04 (Gauntlet R1) · La memòria porta el nom i l'id de l'actor
 * previ: no pot sobreviure a l'eixida de sessió ni passar a una altra persona
 * en la mateixa pestanya. Guarda qui tenia la sessió en registrar-la
 * (`persona`) i escolta el servei de sessió (sessionService.js, que ja viatja
 * a l'arrencada: +0 B a pesDelNucli): amb la sessió fora o amb una altra
 * persona dins, s'oblida (memòria i capa efímera). Mentre la sessió es
 * comprova (recàrrega, renovació) no se sap qui és: no s'oblida res. També ho
 * fa una renovació fallida que acaba fora: cal tornar a entrar, i el retorn
 * no es conserva.
 */

import { delEfimer, getEfimer, setEfimer } from '../config/storage.js';
import { getSessionState, subscribeSession } from './sessionService.js';

const CLAU_SESSIO = 'edicio:retorn_identitat:v1';

let memoria = null;

function normalitzaActor(actor) {
  if (!actor || typeof actor !== 'object') return null;
  const tipus = actor.tipus === 'entitat' ? 'entitat' : 'persona';
  const id = actor.id != null ? String(actor.id).trim() : '';
  const nom = typeof actor.nom === 'string' ? actor.nom.trim() : '';
  if (!nom && !id) return null;
  return Object.freeze({ tipus, id, nom: nom || (tipus === 'persona' ? 'Persona' : 'Entitat') });
}

function lligStorage() {
  if (memoria) return memoria;
  try {
    const parsed = getEfimer(CLAU_SESSIO, null);
    if (!parsed || typeof parsed !== 'object') return null;
    const anterior = normalitzaActor(parsed?.anterior);
    const desti = normalitzaActor(parsed?.desti);
    if (!anterior || !desti) return null;
    memoria = Object.freeze({
      anterior,
      desti,
      retorn: typeof parsed.retorn === 'string' ? parsed.retorn : '',
      notaId: typeof parsed.notaId === 'string' ? parsed.notaId : '',
      persona: typeof parsed.persona === 'string' ? parsed.persona : ''
    });
    return memoria;
  } catch {
    return null;
  }
}

export function registraCanviIdentitatEdicio({ anterior, desti, retorn = '', notaId = '' } = {}) {
  const ant = normalitzaActor(anterior);
  const dst = normalitzaActor(desti);
  if (!ant || !dst) return false;
  if (ant.tipus === dst.tipus && ant.id && dst.id && ant.id === dst.id) return false;
  memoria = Object.freeze({
    anterior: ant,
    desti: dst,
    retorn: typeof retorn === 'string' ? retorn : '',
    notaId: typeof notaId === 'string' ? notaId : '',
    persona: personaDeLEstat(estatDeLaSessio()) ?? ''
  });
  /* Si la capa de sessió no hi és o la quota falla, setEfimer torna false: queda en memòria. */
  setEfimer(CLAU_SESSIO, memoria);
  return true;
}

export function llegixCanviIdentitatEdicio({ retorn = '', notaId = '' } = {}) {
  const actual = lligStorage();
  if (!actual) return null;
  if (retorn && actual.retorn && actual.retorn !== retorn) return null;
  if (notaId && actual.notaId && actual.notaId !== notaId && !retorn) return null;
  return actual;
}

export function netejaCanviIdentitatEdicio() {
  memoria = null;
  delEfimer(CLAU_SESSIO);
}

export function _reiniciaRetornIdentitatPerAProves() {
  netejaCanviIdentitatEdicio();
}

/* v1.2.23 · L5-04 (Gauntlet R1) · L'id de la persona amb sessió, o null si encara
   no se sap (comprovant) o no n'hi ha. */
function personaDeLEstat(estat) {
  const id = estat?.usuari?.id;
  return id != null && id !== '' ? String(id) : null;
}

function estatDeLaSessio() {
  try { return getSessionState(); } catch { return null; }
}

/** v1.2.23 · L5-04 (Gauntlet R1) · Oblida el retorn si la sessió és fora o si ara hi ha dins una altra persona. */
function vigilaSessioDelRetorn(estat) {
  const actual = lligStorage();
  if (!actual) return;
  const ara = personaDeLEstat(estat);
  if (estat?.estat === 'fora' || (ara !== null && ara !== actual.persona)) netejaCanviIdentitatEdicio();
}

try {
  subscribeSession(vigilaSessioDelRetorn);
} catch {
  /* v1.2.23 · L5-04 (Gauntlet R1) · Sense servei de sessió (una prova que el simula sense subscripció): res a escoltar. */
}
