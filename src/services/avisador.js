import { esFilSintetic } from '../data/ambitXat.js';
import { IAIA_UUID } from '../config/xifratXat.js';
import { generaId } from '../sections/xat/missatges.js';

export const HORES_AVISADOR = Object.freeze([4, 8, 12, 24]);
export const AJUSTOS_AVISADOR = Object.freeze({ horesImmobilitat: 8, horaIniciNit: '22:00', horaFiNit: '08:00' });
export const MAXIM_DESCANS_MINUTS = 720;
const HORA_MS = 3_600_000;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ESTATS = ['pendent', 'enviat', 'fallit'];

const esTextId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 256
  && id.trim() === id && !esFilSintetic(id);
const esHora = (hora) => typeof hora === 'string' && HORA.test(hora);
const minutsDe = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
// El descans nocturn dura com a màxim 12 hores. Un descans més llarg deixaria
// l'Avisador en pausa quasi tot el dia mentre la pàgina diu que està activat.
export const esDescansValid = (inici, fi) => esHora(inici) && esHora(fi) && inici !== fi
  && (minutsDe(fi) - minutsDe(inici) + 1440) % 1440 <= MAXIM_DESCANS_MINUTS;
const ajustosValids = (p) => HORES_AVISADOR.includes(p?.horesImmobilitat)
  && esDescansValid(p.horaIniciNit, p.horaFiNit);

const ESQUEMA_AJUSTOS = 'sdp.avisador.horari.v1';
export const MAX_BYTES_AJUSTOS_AVISADOR = 1024;

function horari(ajustos) {
  return {
    horesImmobilitat: ajustos.horesImmobilitat,
    horaIniciNit: ajustos.horaIniciNit,
    horaFiNit: ajustos.horaFiNit
  };
}

/** Identifica la configuració, al marge dels batecs i els enviaments. */
export function clauConfiguracioAvisador(estat) {
  return estat ? JSON.stringify([horari(estat), estat.personesConfiansa
    .map(({ filId, personaId }) => [filId, personaId])]) : null;
}

export function exportaHorariAvisador(ajustos) {
  if (!ajustosValids(ajustos)) return null;
  return JSON.stringify({ esquema: ESQUEMA_AJUSTOS, ...horari(ajustos) }, null, 2);
}

export function importaHorariAvisador(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES_AJUSTOS_AVISADOR
    || new TextEncoder().encode(text).byteLength > MAX_BYTES_AJUSTOS_AVISADOR) return null;
  try {
    const copia = JSON.parse(text);
    if (copia?.esquema !== ESQUEMA_AJUSTOS || !ajustosValids(copia)
      || Object.keys(copia).length !== 4) return null;
    return horari(copia);
  } catch {
    return null;
  }
}

export function estatAvisador(valor) {
  if (valor?.actiu !== true || !ajustosValids(valor)) return null;
  if (!Number.isSafeInteger(valor.ultimBatec) || valor.ultimBatec < 0 || valor.ultimBatec > 8_640_000_000_000_000) return null;
  const persones = valor.personesConfiansa;
  if (!Array.isArray(persones) || persones.length < 1 || persones.length > 3) return null;
  const ids = new Set();
  const missatges = new Set();
  for (const contacte of persones) {
    if (!esTextId(contacte?.filId) || !esTextId(contacte.personaId) || ids.has(contacte.personaId)
      || typeof contacte.idMissatge !== 'string' || !UUID.test(contacte.idMissatge)
      || missatges.has(contacte.idMissatge) || !ESTATS.includes(contacte.estat)) return null;
    ids.add(contacte.personaId);
    missatges.add(contacte.idMissatge);
  }
  return {
    actiu: true,
    horesImmobilitat: valor.horesImmobilitat,
    horaIniciNit: valor.horaIniciNit,
    horaFiNit: valor.horaFiNit,
    ultimBatec: valor.ultimBatec,
    personesConfiansa: persones.map(({ filId, personaId, idMissatge, estat }) => ({ filId, personaId, idMissatge, estat }))
  };
}

export function esDirecteDeConfianca(fil, joId) {
  if (fil?.tipus !== 'directe' || fil.esIA || fil.perDefecte || fil.subjecte || fil.comEntitat || fil.entitatId
    || fil.participant === false || fil.potEscriure === false || !esTextId(fil.id)
    || (fil.participants != null && fil.participants !== 2)
    || !Array.isArray(fil.altres) || fil.altres.length !== 1) return false;
  const altra = fil.altres[0];
  return altra?.tipus === 'persona' && esTextId(altra.id) && altra.id !== joId && altra.id.toLowerCase() !== IAIA_UUID;
}

export function activaAvisador(ajustos, fils, joId, ara = Date.now()) {
  const persones = fils.filter((fil) => esDirecteDeConfianca(fil, joId)).map((fil) => ({
    filId: fil.id,
    personaId: fil.altres[0].id,
    idMissatge: generaId(),
    estat: 'pendent'
  }));
  return estatAvisador({
    actiu: true,
    horesImmobilitat: ajustos.horesImmobilitat,
    horaIniciNit: ajustos.horaIniciNit,
    horaFiNit: ajustos.horaFiNit,
    ultimBatec: ara,
    personesConfiansa: persones
  });
}

export function ambBatec(estat, ara = Date.now()) {
  const conservaIds = estat.personesConfiansa.every((contacte) => contacte.estat === 'pendent');
  return {
    ...estat,
    ultimBatec: ara,
    personesConfiansa: conservaIds ? estat.personesConfiansa : estat.personesConfiansa.map((contacte) => ({
      ...contacte, idMissatge: generaId(), estat: 'pendent'
    }))
  };
}

function horaDe(data, hora, offset = 0) {
  const [h, m] = hora.split(':').map(Number);
  const local = new Date(data);
  local.setDate(local.getDate() + offset);
  return local.setHours(h, m, 0, 0);
}

function fiDeNit(data, inici, fi, offset) {
  return horaDe(data, fi, inici > fi ? offset + 1 : offset);
}

// Cada límit es resol en hora civil local. Restar instants conserva l'hora real
// guanyada o perduda pels canvis d'horari, també en una nit que creua mitjanit.
export function tempsActiuEntre(desDe, fins, inici, fi, maxim = Infinity) {
  if (!Number.isFinite(desDe) || !Number.isFinite(fins) || fins <= desDe
    || !esHora(inici) || !esHora(fi) || inici === fi) return 0;
  let actiu = 0;
  let cursor = fins;
  const dia = new Date(fins);
  for (let offset = 0; cursor > desDe; offset -= 1) {
    const nit = horaDe(dia, inici, offset);
    const final = fiDeNit(dia, inici, fi, offset);
    if (!Number.isFinite(nit) || final <= desDe) return Math.min(maxim, actiu + cursor - desDe);
    if (nit >= cursor || final <= nit) continue;
    actiu += Math.max(0, cursor - final);
    if (actiu >= maxim) return maxim;
    cursor = nit;
  }
  return actiu;
}

export function iniciDeLaNitSeguent(hora, ara) {
  const hui = horaDe(ara, hora);
  return hui > ara ? hui : horaDe(ara, hora, 1);
}

export function tocaAvisar(estat, ara = Date.now()) {
  if (!estat || ara < estat.ultimBatec) return false;
  const { horaIniciNit: inici, horaFiNit: fi } = estat;
  const data = new Date(ara);
  const offset = ara < horaDe(data, inici) ? -1 : 0;
  if (ara < fiDeNit(data, inici, fi, offset)) return false;
  const llindar = estat.horesImmobilitat * HORA_MS;
  return tempsActiuEntre(estat.ultimBatec, ara, inici, fi, llindar) >= llindar;
}

export const MISSATGE_AVISADOR = 'Avís automàtic del meu Avisador. Fa unes hores que l’app no registra activitat meua. Si pots, posa’t en contacte amb mi.';
