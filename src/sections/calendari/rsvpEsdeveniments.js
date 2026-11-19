import { useSyncExternalStore } from 'react';
import { STORAGE_PREFIX, getVal, setVal } from '../../config/storage.js';
import { aplicaRsvp, creaEstatRsvp, resumAforamentRsvp } from './estatCalendari.js';

export const CLAU_RSVP_ESDEVENIMENTS = 'rsvp-esdeveniments-v1';
const AFORAMENT_GENERIC = 10000;
const NOTA_MAXIMA = 500;
const INTENCIONS_VALIDES = new Set(['si', 'potser', 'no']);

let memoriaRsvp = null;
const oientsRsvp = new Set();

const esObjectePla = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clauNeta = (v) => (typeof v === 'string' ? v.trim().slice(0, 180) : '');

function aforamentDe(item) {
  const candidat = Number(item?.aforament ?? item?.dades?.aforament);
  return Number.isSafeInteger(candidat) && candidat > 0 ? candidat : AFORAMENT_GENERIC;
}

function aRespostaMotor(intencio) {
  if (intencio === 'si') return { resposta: 'assistire', places: 1 };
  if (intencio === 'no') return { resposta: 'no-assistire', places: 0 };
  return { resposta: 'pendent', places: 0 };
}

function normalitzaMagatzem(cru) {
  if (!esObjectePla(cru) || !esObjectePla(cru.actes)) return Object.freeze({ actes: Object.freeze({}) });
  const actes = {};
  for (const [idActe, fitxa] of Object.entries(cru.actes)) {
    const id = clauNeta(idActe);
    if (!id || !esObjectePla(fitxa) || !esObjectePla(fitxa.participants)) continue;
    const participants = {};
    for (const [idPersona, dada] of Object.entries(fitxa.participants)) {
      const pid = clauNeta(idPersona);
      if (!pid || !esObjectePla(dada) || !INTENCIONS_VALIDES.has(dada.intencio)) continue;
      participants[pid] = Object.freeze({
        intencio: dada.intencio,
        nota: typeof dada.nota === 'string' ? dada.nota.trim().slice(0, NOTA_MAXIMA) : '',
        actualitzatAl: typeof dada.actualitzatAl === 'string' ? dada.actualitzatAl : ''
      });
    }
    actes[id] = Object.freeze({ participants: Object.freeze(participants) });
  }
  return Object.freeze({ actes: Object.freeze(actes) });
}

function llegeixMagatzem() {
  if (memoriaRsvp === null) memoriaRsvp = normalitzaMagatzem(getVal(CLAU_RSVP_ESDEVENIMENTS, null));
  return memoriaRsvp;
}

function subscriuMagatzem(oient) {
  oientsRsvp.add(oient);
  const finestra = globalThis.window;
  const enStorage = (event) => {
    const clau = event?.key ?? null;
    if (clau !== null && clau !== STORAGE_PREFIX + CLAU_RSVP_ESDEVENIMENTS) return;
    memoriaRsvp = null;
    oient();
  };
  finestra?.addEventListener('storage', enStorage);
  return () => {
    oientsRsvp.delete(oient);
    finestra?.removeEventListener('storage', enStorage);
  };
}

export function _reiniciaRsvpEsdeveniments() {
  memoriaRsvp = null;
}

export function participantRsvpActual(currentUser) {
  const idUsuari = clauNeta(String(currentUser?.id ?? ''));
  return idUsuari ? `u:${idUsuari}` : 'navegador-local';
}

export function llegeixRsvpEsdeveniment(item, idParticipant = 'navegador-local', magatzem = llegeixMagatzem()) {
  const idEsdeveniment = clauNeta(String(item?.id ?? ''));
  if (!idEsdeveniment) {
    return { confirmats: 0, potser: 0, intencio: null, nota: '', complet: false };
  }
  const aforament = aforamentDe(item);
  const participants = magatzem.actes[idEsdeveniment]?.participants ?? {};
  let estat = creaEstatRsvp({ idEsdeveniment, aforament });
  let potser = 0;
  for (const [pid, dada] of Object.entries(participants)) {
    if (dada.intencio === 'potser') potser += 1;
    const { resposta, places } = aRespostaMotor(dada.intencio);
    const pas = aplicaRsvp(estat, { idParticipant: pid, resposta, places, revisioEsperada: estat.revisio });
    if (pas.ok) estat = pas.estat;
  }
  const resum = resumAforamentRsvp(estat);
  const meu = participants[clauNeta(idParticipant)] ?? null;
  return {
    confirmats: resum.ocupades,
    potser,
    aforament: Number.isSafeInteger(Number(item?.aforament ?? item?.dades?.aforament)) ? resum.aforament : null,
    complet: resum.complet,
    intencio: meu?.intencio ?? null,
    nota: meu?.nota ?? ''
  };
}

export function desaRsvpEsdeveniment(item, { idParticipant = 'navegador-local', intencio, nota = '' } = {}) {
  const idEsdeveniment = clauNeta(String(item?.id ?? ''));
  const pid = clauNeta(idParticipant);
  if (!idEsdeveniment || !pid || !INTENCIONS_VALIDES.has(intencio)) return { ok: false };

  const actual = llegeixMagatzem();
  const anteriors = actual.actes[idEsdeveniment]?.participants ?? {};
  const candidats = {
    ...anteriors,
    [pid]: {
      intencio,
      nota: typeof nota === 'string' ? nota.trim().slice(0, NOTA_MAXIMA) : '',
      actualitzatAl: new Date().toISOString()
    }
  };

  /* Valida amb el motor pur d'aforament abans de desar. */
  const aforament = aforamentDe(item);
  let estat = creaEstatRsvp({ idEsdeveniment, aforament });
  for (const [clauParticipant, dada] of Object.entries(candidats)) {
    const { resposta, places } = aRespostaMotor(dada.intencio);
    const pas = aplicaRsvp(estat, {
      idParticipant: clauParticipant,
      resposta,
      places,
      revisioEsperada: estat.revisio
    });
    if (!pas.ok) return { ok: false, codi: pas.codi };
    estat = pas.estat;
  }

  memoriaRsvp = normalitzaMagatzem({
    actes: {
      ...actual.actes,
      [idEsdeveniment]: { participants: candidats }
    }
  });
  setVal(CLAU_RSVP_ESDEVENIMENTS, memoriaRsvp);
  for (const oient of [...oientsRsvp]) oient();
  return { ok: true, resum: resumAforamentRsvp(estat) };
}

export function useRsvpEsdeveniment(item, idParticipant = 'navegador-local') {
  const magatzem = useSyncExternalStore(subscriuMagatzem, llegeixMagatzem, llegeixMagatzem);
  return llegeixRsvpEsdeveniment(item, idParticipant, magatzem);
}

export function useMagatzemRsvpEsdeveniments() {
  return useSyncExternalStore(subscriuMagatzem, llegeixMagatzem, llegeixMagatzem);
}
