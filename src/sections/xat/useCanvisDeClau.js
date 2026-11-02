/**
 * useCanvisDeClau.js — Els canvis de clau dels contactes d'una conversa per a la
 * interfície: l'alerta al fil, el compositor bloquejat i l'acceptació expressa
 * «He parlat amb {nom}: continua» (P1-12; disseny E2EE §4.4, CS-01, D-05 a;
 * marató 261101_2143, B2b · M02).
 *
 * Darrere de la bandera compilada E2EE_ACTIU_PER_DEFECTE (apagada): sense ella, ni
 * el port ni el servei es lligen i el hook torna sempre el mateix objecte inert.
 * Conversa.jsx només l'importa a través d'una constant plegada per la bandera:
 * apagada, el paquet de producció no en porta res
 * (Conversa.e2eeApagat.produccio.test.js).
 *
 * Contracte amb el motor (especificació B2 §2.1.6): servei.canvisDeClau(filId,
 * config) i servei.acceptaCanviClau(filId, { usuari, kid }, config) tornen
 * { pendents, suaus, alarmes }, amb els kid en base64url. Un servei sense estos
 * mètodes (un motor d'abans de B2a) deixa el hook inert: cap crida, cap avís.
 *
 * Regles:
 *   · Un resultat és d'un abast (fil, instància del servei, backend i tenant de
 *     la config, persona): la mateixa clau que el número de seguretat
 *     (clauDAbastDelNumero, PC155-02). Un resultat tardà o d'un altre abast no
 *     es pinta ni un sol render.
 *   · Es refà en obrir el fil, en acceptar i quan canvia l'últim seq, com a molt
 *     una vegada cada MS_REFRESC_CANVIS (el ritme del sondeig).
 *   · Una lectura que falla no desbloqueja res: es queden els pendents d'abans.
 *   · Només s'accepta el canvi que es mostra (usuari i kid nou del pendent);
 *     si la clau ha tornat a canviar (kid-canviat), es torna a llegir.
 *   · Els canvis suaus es conserven a la vista fins que la persona tanca l'avís.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBackendImplementation } from '../../data/backendPort.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { TEXTOS_XIFRATGE } from './estatXifratgeFil.js';
import { clauDAbastDelNumero } from './useSeguretatDelFil.js';

/** Els estats dels canvis de clau d'una conversa. */
export const ESTAT_CANVIS = Object.freeze({
  inactiu: 'inactiu',
  carregant: 'carregant',
  net: 'net',
  pendent: 'pendent',
  alarma: 'alarma',
  suau: 'suau',
  error: 'error'
});

/** Com a molt una lectura per este interval quan canvia l'últim seq (el sondeig del xat). */
export const MS_REFRESC_CANVIS = 25000;

/* Un grup gran no pot inundar la pantalla d'avisos. */
const MAXIM_FILES = 256;
/* Errors del context que són manipulació: alarma i bloqueig, cap acceptació. */
const CODIS_MANIPULACIO = Object.freeze(['bifurcacio', 'kid-no-quadra', 'historia-incoherent']);
const BUIDA = Object.freeze([]);
const RES = () => {};
const RES_ASYNC = async () => false;

/** Si un codi d'error és de manipulació del registre de claus. */
export const esManipulacio = (codi) => typeof codi === 'string' && CODIS_MANIPULACIO.includes(codi);

/** L'objecte que torna el hook amb la bandera apagada o sense res a mirar (sempre el mateix). */
export const CANVIS_INERTS = Object.freeze({
  estat: ESTAT_CANVIS.inactiu, pendents: BUIDA, suaus: BUIDA, alarmes: BUIDA, error: null,
  ocupat: false, bloquejat: false, avis: false, accepta: RES_ASYNC, refresca: RES, tancaSuau: RES
});

/* El servei del decorador del backend instal·lat; null amb la bandera apagada. */
const serveiActual = () => (E2EE_ACTIU_PER_DEFECTE ? serveiXifratXat(getBackendImplementation()) : null);
/* Un canvi d'àmbit (la persona o l'actor han canviat): el resultat ja no és de ningú. */
const esCanviDAmbit = (error) => error?.code === 'AMBIT_CANVIAT' || error?.codi === 'ambit-canviat';
const text = (valor) => (typeof valor === 'string' && valor ? valor : null);
const llista = (valor) => (Array.isArray(valor) ? valor.slice(0, MAXIM_FILES) : BUIDA);
const clauDeSuau = (usuari, kidNou) => `${usuari}\u0000${kidNou}`;

/**
 * La resposta del servei, coaccionada: cap camp que no siga del contracte, un
 * pendent per persona, cap suau ni alarma sense els seus camps. Pura.
 */
export function normalitzaCanvis(cru) {
  const vistos = new Set();
  const pendents = [];
  for (const p of llista(cru?.pendents)) {
    const usuari = text(p?.usuari);
    if (!usuari || vistos.has(usuari)) continue;
    vistos.add(usuari);
    pendents.push(Object.freeze({ usuari, motiu: text(p.motiu) ?? 'sense-continuitat', kidFixat: text(p.kidFixat), kidNou: text(p.kidNou) }));
  }
  const suaus = llista(cru?.suaus)
    .filter((s) => text(s?.usuari) && text(s?.kidNou))
    .map((s) => Object.freeze({ usuari: s.usuari, kidAnterior: text(s.kidAnterior), kidNou: s.kidNou }));
  const alarmes = llista(cru?.alarmes)
    .filter((a) => a?.tipus === 'clau-propia')
    .map((a) => Object.freeze({ tipus: 'clau-propia', kidActiu: text(a.kidActiu) }));
  return Object.freeze({ pendents: Object.freeze(pendents), suaus: Object.freeze(suaus), alarmes: Object.freeze(alarmes) });
}

/* L'estat a la vista a partir de les llistes i de l'error. */
function estatDe({ pendents, suaus, alarmes, error }) {
  if (esManipulacio(error)) return ESTAT_CANVIS.error;
  if (alarmes.length) return ESTAT_CANVIS.alarma;
  if (pendents.length) return ESTAT_CANVIS.pendent;
  if (suaus.length) return ESTAT_CANVIS.suau;
  return error ? ESTAT_CANVIS.error : ESTAT_CANVIS.net;
}

/** El text [clau, reserva] de la barra del compositor quan els canvis bloquegen l'enviament, o null. */
export function avisDelBloqueig(canvis) {
  if (canvis?.bloquejat !== true) return null;
  return esManipulacio(canvis.error) ? TEXTOS_XIFRATGE.canviInesperat : TEXTOS_XIFRATGE.clauNovaSenseConfirmar;
}

/**
 * El nom d'un membre de la conversa per a {nom}: el de la llista de participants
 * (fil.altres) i, en un directe, la reserva o el nom del fil. Mai llança.
 */
export function nomDelMembre(fil, usuari, reserva = '') {
  const membre = Array.isArray(fil?.altres) ? fil.altres.find((p) => p?.id === usuari) : null;
  const nom = typeof membre?.nom === 'string' ? membre.nom.trim() : '';
  if (nom) return nom;
  if (fil?.tipus !== 'directe') return '';
  const alternatives = [reserva, fil.name, fil.title];
  return String(alternatives.find((valor) => typeof valor === 'string' && valor.trim()) ?? '').trim();
}

const SENSE_LLEGIR = Object.freeze({ carregat: false, apagat: false, pendents: BUIDA, suaus: BUIDA, alarmes: BUIDA, error: null, ocupat: false });

/**
 * Els canvis de clau del fil `fil` mentre la conversa és xifrada (`actiu`).
 * Torna { estat, pendents, suaus, alarmes, error, ocupat, bloquejat, avis,
 * accepta(usuari, kid), refresca(), tancaSuau(usuari, kidNou) }.
 *   · error: null | 'lectura' | 'acceptacio' | 'bifurcacio' | 'kid-no-quadra' | 'historia-incoherent'.
 *   · bloquejat: no s'hi pot escriure (pendent, alarma de la clau pròpia o manipulació).
 *   · avis: hi ha alguna cosa que dir al fil.
 *   · accepta torna una promesa amb true si el canvi s'ha acceptat.
 * `ambit` (opcional): la persona de la sessió (l'usuariId de la clau d'abast).
 */
export function useCanvisDeClau({ fil, config = null, actiu = false, ambit = null } = {}) {
  const filId = typeof fil?.id === 'string' ? fil.id : '';
  const ultimSeq = fil?.ultimSeq ?? null;
  const servei = E2EE_ACTIU_PER_DEFECTE === true && actiu === true && filId ? serveiActual() : null;
  const capac = Boolean(servei) && typeof servei.canvisDeClau === 'function';
  const clau = capac ? clauDAbastDelNumero({ filId, servei, config, ambit: typeof ambit === 'string' ? ambit : null }) : '';

  const [estat, setEstat] = useState(() => ({ ...SENSE_LLEGIR, clau: '' }));
  const generacio = useRef(0);
  /* La generació de l'acceptació en vol (0: cap). */
  const acceptant = useRef(0);
  const ultimaLectura = useRef(0);
  const temporitzador = useRef(null);
  const tancats = useRef(new Set());
  const seqVist = useRef(ultimSeq);
  const ultimSeqRef = useRef(ultimSeq);
  ultimSeqRef.current = ultimSeq;
  const configRef = useRef(config);
  configRef.current = config;
  const serveiRef = useRef(servei);
  serveiRef.current = servei;
  const clauRef = useRef(clau);
  clauRef.current = clau;
  const estatRef = useRef(estat);
  estatRef.current = estat;

  /* Una resposta bona del servei: llistes noves i els suaus d'abans que no s'han tancat. */
  const aplica = useCallback((cru) => {
    const nous = normalitzaCanvis(cru);
    setEstat((previ) => {
      const suaus = previ.clau === clau ? [...previ.suaus] : [];
      for (const s of nous.suaus) {
        const id = clauDeSuau(s.usuari, s.kidNou);
        if (!tancats.current.has(id) && !suaus.some((v) => clauDeSuau(v.usuari, v.kidNou) === id)) suaus.push(s);
      }
      return { ...SENSE_LLEGIR, clau, carregat: true, pendents: nous.pendents, alarmes: nous.alarmes, suaus: Object.freeze(suaus.slice(-MAXIM_FILES)) };
    });
  }, [clau]);

  /* Un error: l'àmbit nou apaga en silenci; la manipulació bloqueja sense res a acceptar;
     una lectura fallida conserva el que hi havia (cap desbloqueig per error). */
  const aplicaError = useCallback((error, { acceptant: enAcceptar = false } = {}) => {
    const codi = typeof error?.codi === 'string' ? error.codi : null;
    setEstat((previ) => {
      const meu = previ.clau === clau ? previ : { ...SENSE_LLEGIR, clau };
      if (esCanviDAmbit(error)) return { ...SENSE_LLEGIR, clau, apagat: true };
      if (codi === 'clau-propia-alarma') {
        return { ...meu, carregat: true, ocupat: false, error: null, alarmes: meu.alarmes.length ? meu.alarmes : Object.freeze([Object.freeze({ tipus: 'clau-propia', kidActiu: null })]) };
      }
      if (esManipulacio(codi)) return { ...meu, carregat: true, ocupat: false, error: codi, pendents: BUIDA, alarmes: BUIDA };
      return { ...meu, carregat: true, ocupat: false, error: enAcceptar ? 'acceptacio' : 'lectura' };
    });
  }, [clau]);

  const llig = useCallback(async () => {
    const serveiAra = serveiRef.current;
    /* Mentre s'accepta, la resposta de l'acceptació ja és la lectura nova. */
    if (!serveiAra || typeof serveiAra.canvisDeClau !== 'function' || acceptant.current !== 0) return;
    const meua = ++generacio.current;
    ultimaLectura.current = Date.now();
    try {
      const cru = await serveiAra.canvisDeClau(filId, configRef.current ?? {});
      if (meua !== generacio.current) return;
      aplica(cru);
    } catch (error) {
      if (meua !== generacio.current) return;
      aplicaError(error);
    }
  }, [filId, aplica, aplicaError]);

  /* Un abast nou (o obrir el fil): tot torna a començar i es llig. La neteja descarta
     la promesa en vol i el refresc programat. */
  useEffect(() => {
    tancats.current = new Set();
    acceptant.current = 0;
    seqVist.current = ultimSeqRef.current;
    if (!clau) {
      generacio.current += 1;
      return undefined;
    }
    llig();
    return () => {
      generacio.current += 1;
      if (temporitzador.current) {
        clearTimeout(temporitzador.current);
        temporitzador.current = null;
      }
    };
  }, [clau, llig]);

  /* L'últim seq ha canviat: es torna a llegir, com a molt una vegada cada MS_REFRESC_CANVIS. */
  useEffect(() => {
    if (!clau || seqVist.current === ultimSeq) return;
    seqVist.current = ultimSeq;
    if (temporitzador.current) return;
    const resta = MS_REFRESC_CANVIS - (Date.now() - ultimaLectura.current);
    if (resta <= 0) {
      llig();
      return;
    }
    temporitzador.current = setTimeout(() => {
      temporitzador.current = null;
      llig();
    }, resta);
  }, [clau, ultimSeq, llig]);

  const accepta = useCallback(async (usuari, kid) => {
    const serveiAra = serveiRef.current;
    const ara = estatRef.current;
    if (!serveiAra || typeof serveiAra.acceptaCanviClau !== 'function' || !clau || ara.clau !== clauRef.current) return false;
    if (ara.ocupat || acceptant.current !== 0) return false;
    /* Només el canvi que es mostra: mai una clau que la persona no ha vist. */
    if (!ara.pendents.some((p) => p.usuari === usuari && p.kidNou !== null && p.kidNou === kid)) return false;
    const meua = ++generacio.current;
    acceptant.current = meua;
    setEstat((previ) => ({ ...previ, ocupat: true, error: null }));
    try {
      const cru = await serveiAra.acceptaCanviClau(filId, { usuari, kid }, configRef.current ?? {});
      if (meua !== generacio.current) return false;
      acceptant.current = 0;
      ultimaLectura.current = Date.now();
      aplica(cru);
      return true;
    } catch (error) {
      if (meua !== generacio.current) return false;
      acceptant.current = 0;
      if (error?.codi === 'kid-canviat') {
        /* La clau ha tornat a canviar mentre es mirava: cap acceptació, i el canvi nou a la vista. */
        setEstat((previ) => ({ ...previ, ocupat: false }));
        await llig();
        return false;
      }
      aplicaError(error, { acceptant: true });
      return false;
    } finally {
      if (acceptant.current === meua) acceptant.current = 0;
    }
  }, [clau, filId, aplica, aplicaError, llig]);

  const refresca = useCallback(() => {
    if (clauRef.current) llig();
  }, [llig]);

  const tancaSuau = useCallback((usuari, kidNou) => {
    tancats.current.add(clauDeSuau(usuari, kidNou));
    setEstat((previ) => ({ ...previ, suaus: Object.freeze(previ.suaus.filter((s) => s.usuari !== usuari || s.kidNou !== kidNou)) }));
  }, []);

  const resultat = useMemo(() => {
    if (!clau || estat.apagat) return CANVIS_INERTS;
    /* PC155-02 · Derivat en pintar: res d'un altre abast, ni un sol render. */
    if (estat.clau !== clau || !estat.carregat) {
      return Object.freeze({ ...CANVIS_INERTS, estat: ESTAT_CANVIS.carregant, ocupat: estat.clau === clau && estat.ocupat, accepta, refresca, tancaSuau });
    }
    const estatVista = estatDe(estat);
    const bloquejat = estatVista === ESTAT_CANVIS.pendent || estatVista === ESTAT_CANVIS.alarma || esManipulacio(estat.error);
    const avis = estat.alarmes.length > 0 || estat.pendents.length > 0 || estat.suaus.length > 0
      || esManipulacio(estat.error) || estat.error === 'acceptacio';
    return Object.freeze({
      estat: estatVista, pendents: estat.pendents, suaus: estat.suaus, alarmes: estat.alarmes, error: estat.error,
      ocupat: estat.ocupat, bloquejat, avis, accepta, refresca, tancaSuau
    });
  }, [clau, estat, accepta, refresca, tancaSuau]);

  return resultat;
}
