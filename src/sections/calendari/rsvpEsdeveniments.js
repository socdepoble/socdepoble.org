import { useSyncExternalStore } from 'react';
import { STORAGE_PREFIX, getVal, setVal } from '../../config/storage.js';
import { fiEfectiva, llegixDataHora } from '../../utils/esdeveniment.js';
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import { aplicaRsvp, creaEstatRsvp, resumAforamentRsvp } from './estatCalendari.js';

export const CLAU_RSVP_ESDEVENIMENTS = 'rsvp-esdeveniments-v1';
const AFORAMENT_GENERIC = 10000;
const NOTA_MAXIMA = 500;
const HORA_MS = 3_600_000;
const INTENCIONS_VALIDES = new Set(['si', 'potser', 'no']);
const REGEX_DIA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

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

function mitjanitLocalDeClau(clauData) {
  const m = REGEX_DIA_ISO.exec(typeof clauData === 'string' ? clauData.trim() : '');
  if (!m) return null;
  const any = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  const d = new Date(any, mes, dia);
  if (d.getFullYear() !== any || d.getMonth() !== mes || d.getDate() !== dia) return null;
  return d.getTime();
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

export function participantRsvpActual(currentUser, identitatActiva = null) {
  if (identitatActiva && typeof identitatActiva === 'object') {
    const tipus = clauNeta(String(identitatActiva.actorType ?? identitatActiva.actor?.tipus ?? ''));
    const idEntitat = clauNeta(String(identitatActiva.actorId ?? identitatActiva.actor?.id ?? ''));
    if (tipus === 'entitat' && idEntitat) return `e:${idEntitat}`;
    const actorKey = clauNeta(String(identitatActiva.actorKey ?? ''));
    if (actorKey.startsWith('entitat:') && actorKey.length > 8) return `e:${actorKey.slice(8)}`;
  } else if (typeof identitatActiva === 'string' && identitatActiva.startsWith('entitat:') && identitatActiva.length > 8) {
    return `e:${clauNeta(identitatActiva.slice(8))}`;
  }
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

/**
 * Interval temporal semiobert [iniciMs, fiMs) d'una entrada del calendari o
 * d'un element d'esdeveniment. Torna null si l'acte no porta data real o està
 * cancel·lat. Els actes adjacents (10:00–11:00 i 11:00–12:00) tenen fi === inici
 * i NO se solapen.
 */
export function intervalRsvpDe(entradaOItem) {
  if (!entradaOItem || typeof entradaOItem !== 'object') return null;
  const esEntrada = 'esdeveniment' in entradaOItem || 'acte' in entradaOItem || 'item' in entradaOItem;
  const item = esEntrada ? entradaOItem.item : entradaOItem;
  const esd = (esEntrada ? (entradaOItem.acte ?? entradaOItem.esdeveniment) : null) ?? acteAEsdeveniment(item);
  if (!esd || esd.estat === 'cancellat') return null;

  const id = clauNeta(String(item?.id ?? esd.id ?? ''));
  if (!id) return null;
  const titol = clauNeta(String(item?.title ?? item?.name ?? esd.titol ?? '')) || id;

  if (esd.totElDia) {
    const fi = fiEfectiva(esd);
    const iniciMs = mitjanitLocalDeClau(esd.inici?.data);
    const fiMs = mitjanitLocalDeClau(fi?.data);
    if (!Number.isFinite(iniciMs) || !Number.isFinite(fiMs) || fiMs <= iniciMs) return null;
    return Object.freeze({ id, titol, totElDia: true, iniciMs, fiMs });
  }

  const iniciMs = llegixDataHora(esd.inici?.dataHora)?.instant ?? null;
  if (!Number.isFinite(iniciMs)) return null;
  const fi = fiEfectiva(esd);
  const fiCandidata = llegixDataHora(fi?.dataHora)?.instant ?? (iniciMs + HORA_MS);
  const fiMs = fiCandidata > iniciMs ? fiCandidata : iniciMs + HORA_MS;
  return Object.freeze({ id, titol, totElDia: false, iniciMs, fiMs });
}

/**
 * Detector pur O(n log n) de solapaments horaris entre els esdeveniments on el
 * participant actiu ha marcat «Assistiré» ('si'). Mai bloqueja la tria: només
 * informa de quins actes confirmats coincidixen en la mateixa franja.
 */
export function detectaSolapamentsRsvp(
  entradesOItems = [],
  { idParticipant = 'navegador-local', magatzem = llegeixMagatzem() } = {}
) {
  const pid = clauNeta(idParticipant);
  if (!pid || !Array.isArray(entradesOItems) || entradesOItems.length < 2) {
    return Object.freeze({ perActe: Object.freeze({}), parelles: Object.freeze([]) });
  }

  const vistos = new Set();
  const confirmats = [];
  for (const entrada of entradesOItems) {
    const interval = intervalRsvpDe(entrada);
    if (!interval || vistos.has(interval.id)) continue;
    vistos.add(interval.id);
    const resposta = magatzem?.actes?.[interval.id]?.participants?.[pid]?.intencio ?? null;
    if (resposta === 'si') confirmats.push(interval);
  }

  if (confirmats.length < 2) {
    return Object.freeze({ perActe: Object.freeze({}), parelles: Object.freeze([]) });
  }

  confirmats.sort((a, b) => (a.iniciMs - b.iniciMs) || (a.fiMs - b.fiMs) || a.id.localeCompare(b.id));

  const perActe = new Map();
  const parelles = [];
  const actius = [];

  const registra = (origen, altre, tipus) => {
    if (!perActe.has(origen.id)) perActe.set(origen.id, []);
    perActe.get(origen.id).push(Object.freeze({
      id: altre.id,
      titol: altre.titol,
      tipus,
      iniciMs: altre.iniciMs,
      fiMs: altre.fiMs
    }));
  };

  for (const actual of confirmats) {
    for (let i = actius.length - 1; i >= 0; i -= 1) {
      if (actius[i].fiMs <= actual.iniciMs) actius.splice(i, 1);
    }
    for (const obert of actius) {
      if (obert.iniciMs < actual.fiMs && actual.iniciMs < obert.fiMs) {
        const tipus = !obert.totElDia && !actual.totElDia ? 'horari' : 'mateix-dia';
        registra(obert, actual, tipus);
        registra(actual, obert, tipus);
        parelles.push(Object.freeze({ primerId: obert.id, segonId: actual.id, tipus }));
      }
    }
    actius.push(actual);
  }

  const perActeCongelat = {};
  for (const [idActe, llista] of perActe.entries()) {
    perActeCongelat[idActe] = Object.freeze(llista);
  }

  return Object.freeze({
    perActe: Object.freeze(perActeCongelat),
    parelles: Object.freeze(parelles)
  });
}

export function useRsvpEsdeveniment(item, idParticipant = 'navegador-local') {
  const magatzem = useSyncExternalStore(subscriuMagatzem, llegeixMagatzem, llegeixMagatzem);
  return llegeixRsvpEsdeveniment(item, idParticipant, magatzem);
}

export function useMagatzemRsvpEsdeveniments() {
  return useSyncExternalStore(subscriuMagatzem, llegeixMagatzem, llegeixMagatzem);
}
