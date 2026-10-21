/**
 * origenDelXat.js — Ordre del Mestre (261021, pla 261021_0015 §8.5) · La
 * pàgina de l'app d'on s'ha entrat a una conversa, per a tornar-hi des de la
 * capçalera (CapcaleraConversa, la fletxa ArrowLeft).
 *
 * Qui entra al Xat des de /iaia («Parla amb la IAIA») o des d'una altra fitxa
 * de perfil (/xat?amb=<id>, el xat de pàgina ?sobre= o /xat/<fil>), en ample
 * no tenia cap porta dins de l'app per a tornar-hi: la fletxa de la capçalera
 * era només d'estret i tornava a la llista. Ara, si hi ha origen, la fletxa
 * es veu a totes les amplàries i porta a eixa pàgina. Sense origen, la
 * capçalera de sempre, píxel a píxel (Llei del Píxel).
 *
 * D'on ix l'origen: el router propi no guarda l'anterior ni el navegador el
 * diu (document.referrer no canvia amb pushState). El recorda AvisadorXat
 * (XatContext.jsx), que viu per damunt de les rutes i veu cada canvi: la
 * darrera ruta de l'app fora del Xat, amb la consulta, el mateix lloc on
 * informeDError.js pren la seua (sense dades, per a l'informe). Només en
 * memòria, en esta pestanya: una càrrega directa (un enllaç, recarregar) no
 * en té, i la capçalera és la de sempre. L'àlies /chat (RedireccioXat,
 * App.jsx) també és del Xat: un pas que es reescriu sol no és cap origen.
 *
 * Fins quan val (seguentOrigen, pur): XatSection el pren en entrar al Xat
 * amb una conversa demanada (/xat/<fil>, ?amb= o ?sobre=); entrar a la
 * llista nua no en porta cap. Es lliga a la primera conversa que s'obri, també
 * després dels replace que resolen ?amb= i ?sobre= (i de les files d'ajuda,
 * /xat/sdp-per-defecte:<clau>, que encara no són cap conversa). Tria una
 * altra conversa o tornar a la llista, a una vista o a una fitxa l'oblida per
 * a sempre: en estret la fletxa d'una conversa oberta des de la llista
 * continua tornant a la llista, com sempre.
 *
 * La fletxa NAVEGA a l'origen (una entrada nova) i no fa navigate(-1): qui
 * torna al Xat amb Arrere del navegador no té l'origen a l'entrada d'abans, i
 * un salt enrere el podria traure de l'app.
 */
import { useState } from 'react';

/* El Xat i el seu àlies anglés: /xat, /xat/<fil>, /chat, /e/<entitat>/xat… */
const RE_RUTA_XAT = /(^|\/)(?:xat|chat)(\/|$)/;

/* Revisió adversarial (261021, pla 261021_0015 §8.5) · L'entrada tampoc és
   cap origen: /registre i els àlies que hi porten amb replace (App.jsx ·
   RedireccioDEntrada). Qui torna al Xat amb Arrere des del «Registra't» del
   convidat no ha de tindre la fletxa cap al formulari (en estret, abans era la
   llista): conserva la pàgina d'abans de l'entrada. */
const RE_RUTA_D_ENTRADA = /^\/(?:registre|registra|login|accedir|entrar|crear-compte)(\/|$)/;

let darreraForaDelXat = null;

/**
 * Recorda `pathname` (amb `search`, la consulta sense «?» de useLocation) si
 * és una ruta de l'app fora del Xat i de l'entrada. Una ruta buida (fora de
 * base), relativa o que comença per «//» no compta.
 */
export function recordaOrigenDelXat(pathname, search = '') {
  const cami = typeof pathname === 'string' ? pathname : '';
  if (!cami.startsWith('/') || cami.startsWith('//') || RE_RUTA_XAT.test(cami) || RE_RUTA_D_ENTRADA.test(cami)) return;
  const consulta = String(search || '').replace(/^\?/, '');
  darreraForaDelXat = consulta ? `${cami}?${consulta}` : cami;
}

/** La darrera ruta de l'app fora del Xat, o null. */
export function origenDelXat() {
  return darreraForaDelXat;
}

/** Per a les proves. */
export function oblidaOrigenDelXat() {
  darreraForaDelXat = null;
}

/** Cap origen: la capçalera de sempre. */
export const SENSE_ORIGEN = Object.freeze({ ruta: null, fil: null });

/**
 * L'estat següent ({ ruta, fil }) a partir de l'actual i de la URL del Xat:
 * `intencio` (hi ha una conversa demanada: /xat/<fil>, ?amb= o ?sobre=) i
 * `fil` (l'id de /xat/<fil> que ja és una conversa, o null). Pura i
 * idempotent: tornar-la a cridar amb el seu resultat el torna igual.
 */
export function seguentOrigen(estat, { intencio = false, fil = null } = {}) {
  if (!estat?.ruta) return SENSE_ORIGEN;
  if (!intencio) return SENSE_ORIGEN;
  if (fil == null || fil === '') return estat;
  const id = String(fil);
  if (estat.fil == null) return { ruta: estat.ruta, fil: id };
  return estat.fil === id ? estat : SENSE_ORIGEN;
}

/**
 * La ruta on torna la fletxa de la conversa `fil`, o null (la de sempre).
 * L'origen es pren en muntar (entrar al Xat) i es reajusta en pintar, sense
 * efecte. XatSection el crida per damunt de XatWorkspace: canviar d'àmbit
 * (la clau de l'espai) no el torna a prendre.
 */
export function useOrigenDelXat({ intencio = false, fil = null } = {}) {
  const [estat, setEstat] = useState(() => {
    const ruta = intencio ? origenDelXat() : null;
    return ruta ? { ruta, fil: null } : SENSE_ORIGEN;
  });
  const seguent = seguentOrigen(estat, { intencio, fil });
  if (seguent !== estat) setEstat(seguent);
  return seguent.ruta && fil != null && seguent.fil === String(fil) ? seguent.ruta : null;
}
