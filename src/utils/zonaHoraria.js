/**
 * zonaHoraria.js — R51 (P0-49 / IDEA-180) · L'adaptador de zona del selector
 * de data i hora de publicació (SelectorDataHora).
 *
 * El mòdul pur del contracte (publicationDateControl.js) rep una hora de
 * paret i un desfasament explícit: no endevina cap zona ni consulta cap
 * rellotge. Ací es resol la zona IANA i els canvis d'hora:
 *  · una hora que no existix eixe dia (la que el canvi d'estiu se salta) es
 *    rebutja, i qui crida no desa res;
 *  · una hora que passa dues vegades (la que el canvi d'hivern repetix) és
 *    ambigua: torna els dos desfasaments i la persona en tria un.
 * Els candidats són els desfasaments de la zona un dia abans, el mateix
 * instant llegit en UTC i un dia després; cada un es comprova d'anada i
 * tornada (l'instant que en resulta ha de tindre eixe mateix desfasament).
 * Pur llevat d'Intl: cap Date.now, cap emmagatzematge, cap xarxa.
 */
import { publicationDateFromLocal } from './publicationDateControl.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const formatadors = new Map();

function formatador(zona) {
  if (!formatadors.has(zona)) {
    formatadors.set(zona, new Intl.DateTimeFormat('en-US', {
      timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }));
  }
  return formatadors.get(zona);
}

/** La zona és un identificador IANA que este motor coneix? */
export function esZonaValida(zona) {
  if (typeof zona !== 'string' || !zona.trim()) return false;
  try {
    formatador(zona);
    return true;
  } catch {
    return false;
  }
}

/** La zona IANA del dispositiu, o 'UTC' si el motor no en diu cap de vàlida. */
export function zonaDelDispositiu() {
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return esZonaValida(zona) ? zona : 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Les parts de paret (any, mes 0-11, dia, hora, minut, segon) d'un instant en una zona. */
export function partsALaZona(instantMs, zona) {
  const parts = Object.fromEntries(formatador(zona).formatToParts(new Date(instantMs)).map((p) => [p.type, p.value]));
  return {
    any: Number(parts.year), mes: Number(parts.month) - 1, dia: Number(parts.day),
    hora: Number(parts.hour) % 24, minut: Number(parts.minute), segon: Number(parts.second)
  };
}

/** El desfasament (minuts a l'est d'UTC) d'una zona en un instant. */
export function desfasamentA(instantMs, zona) {
  const segons = Math.floor(instantMs / 1000) * 1000;
  const p = partsALaZona(segons, zona);
  return Math.round((Date.UTC(p.any, p.mes, p.dia, p.hora, p.minut, p.segon) - segons) / 60000);
}

const dosDigits = (n) => String(n).padStart(2, '0');

/** «UTC+01:00», «UTC-03:30», «UTC+05:45». */
export function textDesfasament(minuts) {
  const signe = minuts < 0 ? '-' : '+';
  const absolut = Math.abs(minuts);
  return `UTC${signe}${dosDigits(Math.floor(absolut / 60))}:${dosDigits(absolut % 60)}`;
}

/** L'hora de paret «AAAA-MM-DDThh:mm» d'un dia del calendari (mes 0-11) i una hora «hh:mm». */
export function horaDeParet(any, mes, dia, hhmm) {
  return `${String(any).padStart(4, '0')}-${dosDigits(mes + 1)}-${dosDigits(dia)}T${hhmm}`;
}

/**
 * Resol una hora de paret («AAAA-MM-DDThh:mm[:ss]») en una zona IANA:
 *  · { estat: 'valida', iso, desfasament }
 *  · { estat: 'ambigua', opcions: [{ desfasament, iso }, …] } (el primer, l'horari d'estiu)
 *  · { estat: 'inexistent' } (el canvi d'hora se la salta)
 *  · { estat: 'invalida' } (no és una hora de paret real, o la zona no existix)
 */
export function resolHoraDeParet(local, zona) {
  const m = typeof local === 'string' ? LOCAL.exec(local) : null;
  if (!m || !esZonaValida(zona)) return Object.freeze({ estat: 'invalida' });
  try {
    publicationDateFromLocal(local, 0);
  } catch {
    return Object.freeze({ estat: 'invalida' });
  }
  const [any, mes, dia, hora, minut, segon] = m.slice(1, 7).map((x) => Number(x ?? 0));
  const paret = Date.UTC(any, mes - 1, dia, hora, minut, segon);
  const candidats = [...new Set([paret - DIA_MS, paret, paret + DIA_MS].map((ms) => desfasamentA(ms, zona)))];
  const opcions = [];
  for (const desfasament of candidats.sort((a, b) => b - a)) {
    if (desfasamentA(paret - desfasament * 60000, zona) !== desfasament) continue;
    try {
      opcions.push(Object.freeze({ desfasament, iso: publicationDateFromLocal(local, desfasament) }));
    } catch {
      return Object.freeze({ estat: 'invalida' });
    }
  }
  if (!opcions.length) return Object.freeze({ estat: 'inexistent' });
  if (opcions.length > 1) return Object.freeze({ estat: 'ambigua', opcions: Object.freeze(opcions) });
  return Object.freeze({ estat: 'valida', ...opcions[0] });
}
