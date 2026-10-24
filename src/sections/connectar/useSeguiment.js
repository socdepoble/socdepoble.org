/**
 * useSeguiment.js — «Connectar amb {nom}», una persona o una entitat, des de
 * /connectar (IDEA-14, Directiva del Mestre, 261024; auditoria Gemini G-04).
 *
 *   · P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · «A Sóc
 *     de Poble no se seguix, es connecta»: la gent llig «Connectar amb {nom}»,
 *     «Connectat amb {nom}.» i «veïnat connectat». Per davall, el model no
 *     canvia: és un seguiment d'un sol sentit, i els noms d'ací (segueix,
 *     deixa, estats, avisos) i les claus section.connectar.seguir.* es queden.
 *   · Connectar és una relació humana: no et fa membre de res i no és posar
 *     un element a les teues notes. Es desa amb la capacitat 'seguiments' del port
 *     (segueix, deixaDeSeguir, estatSeguiment), sempre a través de
 *     backendPort.js. Sense la capacitat (un port sense implementació, un
 *     mock) no es crida res i l'estat ho diu ('no-disponible').
 *   · L'altra banda ho sap: la PRIMERA vegada que t'hi connectes, UN missatge
 *     curt al xat privat (missatgeAlXat.js), amb el text que la vista ja ha
 *     dit abans del clic. 261024 correccions (R4-01) · deixar_de_seguir
 *     esborra la fila, i un segon seguiment torna `nou: true`: per això
 *     l'avís va només amb `primer: true` (cap seguiment abans, mai); un
 *     servidor que encara no diu `primer` cau a `nou`. Tornar-s'hi a connectar
 *     ('represa', o 'ja-seguies' si no s'havia deixat) no envia res. Un avís
 *     que no ix no desfà la connexió: es diu ('sense-avis').
 *   · Deixar la connexió no avisa ningú.
 *   · Qui: `contacte.seguiment` ({ tipus: 'persona'|'entitat', id }), que la
 *     vista deriva del contacte de confiança (autorPerConnectar o
 *     perfilPerConnectar), mai de l'URL. Sense sessió no es connecta amb ningú.
 *   · Tot el que es llig o es fa porta la CLAU (persona de la sessió + tipus +
 *     id): si canvia, el que hi havia no es pinta.
 *
 * Torna { estat, avis, error, errorLectura, ocupat, segueix, deixa }:
 *   estat · 'no-disponible' | 'no-seguible' | 'sense-sessio' | 'comprovant'
 *           | 'no-segueix' | 'segueix'
 *   avis  · el resultat de l'última acció: 'avisat' | 'sense-avis' |
 *           'represa' | 'ja-seguies' | 'deixat' | null
 *   error · { accio: 'segueix' | 'deixa', codi } de l'acció que ha fallat, o
 *           null. `codi` és un de TEXTOS_ERROR_SEGUIMENT (codiDelSeguiment)
 *           o null; la vista el traduïx (261024 correccions, R3-12).
 *   Un servidor sense l'esquema (NO-DISPONIBLE en llegir) es diu igual que
 *   sense la capacitat.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../../app/contexts/SessionContext';
/* T6b (261024) · la capacitat 'seguiments' (contracte.js · CAPACITATS). */
import { deixaDeSeguir, estatSeguiment, segueix as segueixAlPort, teCapacitat } from '../../data/backendPort.js';
import { useMissatgeAlXat } from './missatgeAlXat.js';

/* Un port sense la capacitat (o un mock) no ha de fer caure la vista. */
function capacitat(nom) {
  try { return teCapacitat(nom); } catch { return false; }
}

/* El servidor encara no té l'esquema (2610241430_seguiments.sql, NO aplicada): com sense la capacitat. */
const esNoDisponible = (error) => error?.code === 'NO-DISPONIBLE';

/**
 * 261024 correccions (R3-12) · El text de cada codi del contracte
 * (MISSATGES_SEGUIMENTS de contracte.js, el mateix joc de codis) com a
 * [clau, reserva] de t(): les cinc llengües, i per a NO-DISPONIBLE un text
 * per a la gent, no el del desenvolupador. La reserva valenciana és la del
 * diccionari ca (P1-11, pla 261024_2230: amb el vocabulari de connectar).
 */
export const TEXTOS_ERROR_SEGUIMENT = Object.freeze({
  'SDP-SEG-000': ['section.connectar.seguir.error.SDP-SEG-000', 'Cal entrar al compte per a connectar amb algú.'],
  'SDP-SEG-001': ['section.connectar.seguir.error.SDP-SEG-001', 'La persona o l’entitat no són vàlides.'],
  'SDP-SEG-002': ['section.connectar.seguir.error.SDP-SEG-002', 'No trobem esta persona o esta entitat, o no t’hi pots connectar.'],
  'SDP-SEG-003': ['section.connectar.seguir.error.SDP-SEG-003', 'No pots connectar amb el teu propi perfil ni amb una entitat que administres.'],
  'SDP-SEG-004': ['section.connectar.seguir.error.SDP-SEG-004', 'L’has bloquejada: desbloqueja-la abans de connectar-t’hi.'],
  'SDP-SEG-005': ['section.connectar.seguir.error.SDP-SEG-005', 'Només qui administra l’entitat veu el veïnat connectat amb ella.'],
  'SDP-SEG-006': ['section.connectar.seguir.error.SDP-SEG-006', 'Massa connexions en poc de temps. Torna-ho a provar d’ací a una estona.'],
  'NO-DISPONIBLE': ['section.connectar.seguir.error.NO-DISPONIBLE', 'Este poble encara no permet connectar amb ningú des de l’app.'],
  DESCONEGUT: ['section.connectar.seguir.error.DESCONEGUT', 'No s’ha pogut completar. Torna-ho a provar.']
});

/**
 * El codi concret d'un error del port (una clau de TEXTOS_ERROR_SEGUIMENT), o
 * null si no n'hi ha cap de concret (DESCONEGUT, xarxa, un error sense codi):
 * aleshores la vista diu el seu text de sempre, que nomena l'acció i la
 * persona («No s’ha pogut connectar amb {nom}…»). Mai el text cru del servidor.
 */
export function codiDelSeguiment(error) {
  const codi = error?.code;
  if (typeof codi !== 'string' || codi === 'DESCONEGUT' || !Object.hasOwn(TEXTOS_ERROR_SEGUIMENT, codi)) return null;
  return codi;
}

/**
 * R4-01 · Si este seguiment ha d'avisar l'altra banda: només el primer de
 * tots (`primer: true`). Un servidor que encara no diu `primer` (undefined)
 * cau a `nou`, com abans.
 */
export function avisaDelSeguiment(fet) {
  if (fet?.primer === true) return true;
  if (fet?.primer === undefined) return fet?.nou === true;
  return false;
}

/* Acabada una acció, només s'allibera la de la seua clau. */
const allibera = (setOcupat, perA) => setOcupat((actual) => (actual?.clau === perA ? null : actual));

export const ESTATS_SEGUIMENT = Object.freeze([
  'no-disponible', 'no-seguible', 'sense-sessio', 'comprovant', 'no-segueix', 'segueix'
]);

/** L'objectiu del seguiment, si és ben format: { tipus, id } o null. */
export function objectiuDelSeguiment(contacte) {
  const objectiu = contacte?.seguiment;
  if (!objectiu || !['persona', 'entitat'].includes(objectiu.tipus)) return null;
  const id = String(objectiu.id ?? '').trim();
  return id ? { tipus: objectiu.tipus, id } : null;
}

export function useSeguiment(contacte, { config = {}, missatgeAvis = '' } = {}) {
  const { currentUser } = useSession();
  const disponible = capacitat('seguiments');
  const objectiu = objectiuDelSeguiment(contacte);
  const tipus = objectiu?.tipus ?? null;
  const id = objectiu?.id ?? null;
  const usuariId = currentUser?.id != null ? String(currentUser.id) : null;
  const clau = disponible && usuariId && tipus && id ? [usuariId, tipus, id].join('\u0000') : null;

  /* { clau, seguint, error } · { clau, avis, error } · { clau, accio }: vegeu la capçalera. */
  const [lectura, setLectura] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [ocupat, setOcupat] = useState(null);
  const ocupatVigent = clau && ocupat?.clau === clau ? ocupat.accio : null;
  const configRef = useRef(config);
  configRef.current = config;
  const missatgeRef = useRef(missatgeAvis);
  missatgeRef.current = missatgeAvis;
  const envia = useMissatgeAlXat(contacte);

  useEffect(() => {
    if (!clau) return undefined;
    let viu = true;
    const perA = clau;
    Promise.resolve()
      .then(() => estatSeguiment({ tipus, id }, configRef.current))
      .then((estat) => { if (viu) setLectura({ clau: perA, seguint: estat?.seguint === true, error: null }); })
      /* També un error acaba la lectura: mai 'comprovant' per sempre. */
      .catch((error) => { if (viu) setLectura({ clau: perA, seguint: false, error }); });
    return () => { viu = false; };
  }, [clau, tipus, id]);

  const segueix = useCallback(async () => {
    if (!clau || ocupatVigent) return false;
    const perA = clau;
    setOcupat({ clau: perA, accio: 'segueix' });
    setResultat(null);
    let fet;
    try {
      fet = await segueixAlPort({ tipus, id }, configRef.current);
    } catch (error) {
      setResultat({ clau: perA, avis: null, error: { accio: 'segueix', codi: codiDelSeguiment(error) } });
      allibera(setOcupat, perA);
      return false;
    }
    setLectura({ clau: perA, seguint: fet?.seguint !== false, error: null });
    /* R4-01 · 'represa': l'havia deixat i hi torna, sense cap altre avís. */
    let avis = fet?.nou === true ? 'represa' : 'ja-seguies';
    if (avisaDelSeguiment(fet)) {
      /* L'avís a l'altra banda, una sola vegada: el seguiment ja està fet i no es desfà si l'avís no ix. */
      try {
        avis = (await envia(missatgeRef.current)).enviat ? 'avisat' : 'sense-avis';
      } catch {
        avis = 'sense-avis';
      }
    }
    setResultat({ clau: perA, avis, error: null });
    allibera(setOcupat, perA);
    return true;
  }, [clau, ocupatVigent, tipus, id, envia]);

  const deixa = useCallback(async () => {
    if (!clau || ocupatVigent) return false;
    const perA = clau;
    setOcupat({ clau: perA, accio: 'deixa' });
    setResultat(null);
    try {
      await deixaDeSeguir({ tipus, id }, configRef.current);
    } catch (error) {
      setResultat({ clau: perA, avis: null, error: { accio: 'deixa', codi: codiDelSeguiment(error) } });
      allibera(setOcupat, perA);
      return false;
    }
    setLectura({ clau: perA, seguint: false, error: null });
    setResultat({ clau: perA, avis: 'deixat', error: null });
    allibera(setOcupat, perA);
    return true;
  }, [clau, ocupatVigent, tipus, id]);

  const lecturaVigent = lectura?.clau === clau ? lectura : null;
  const resultatVigent = clau && resultat?.clau === clau ? resultat : null;
  let estat;
  if (!disponible || esNoDisponible(lecturaVigent?.error)) estat = 'no-disponible';
  else if (!objectiu) estat = 'no-seguible';
  else if (!usuariId) estat = 'sense-sessio';
  else if (!lecturaVigent) estat = 'comprovant';
  else estat = lecturaVigent.seguint ? 'segueix' : 'no-segueix';

  return {
    estat,
    avis: resultatVigent?.avis ?? null,
    error: resultatVigent?.error ?? null,
    errorLectura: lecturaVigent?.error ?? null,
    ocupat: ocupatVigent,
    segueix,
    deixa
  };
}

export default useSeguiment;
