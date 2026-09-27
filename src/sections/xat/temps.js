/**
 * temps.js — etiquetes de temps del xat (XAT-P11, UX-A07).
 *
 * Funcions pures sobre `Intl` (dins del baseline 2022): cap dependència,
 * cap estat i cap text escrit a mà. Els literals («Hui», «Ahir») els posa
 * qui crida a través de `t(clau, alternativa)`; sense `t` s'usa l'alternativa.
 */

const DIA_MS = 86400000;

function aData(valor) {
  if (valor == null || valor === '') return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function iniciDia(valor) {
  const d = new Date(valor);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function textDe(t, clau, alternativa) {
  return typeof t === 'function' ? t(clau, alternativa) : alternativa;
}

/** Dies sencers entre el dia de `iso` i el dia d'`ara` (0 = hui, 1 = ahir). */
export function diesDeDiferencia(iso, ara = Date.now()) {
  const d = aData(iso);
  if (!d) return null;
  return Math.round((iniciDia(ara) - iniciDia(d)) / DIA_MS);
}

/** Clau estable del dia local («2026-09-27») per a agrupar missatges. */
export function clauDia(iso) {
  const d = aData(iso);
  if (!d) return '';
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** «14:32» amb el locale de la llengua de la interfície. */
export function etiquetaHora(iso, locale = 'ca-ES') {
  const d = aData(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);
}

/**
 * Hora de la fila de la llista de converses: «14:32» hui, «Ahir», el dia de
 * la setmana si fa menys d'una setmana i la data curta si fa més.
 */
export function etiquetaLlista(iso, { locale = 'ca-ES', t = null, ara = Date.now() } = {}) {
  const d = aData(iso);
  if (!d) return '';
  const dies = diesDeDiferencia(d, ara);
  if (dies <= 0) return etiquetaHora(d, locale);
  if (dies === 1) return textDe(t, 'section.xat.temps.ahir', 'Ahir');
  if (dies < 7) return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d);
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);
}

/**
 * Text del separador de dia dins d'una conversa: «Hui», «Ahir», el dia de la
 * setmana o la data llarga («4 de setembre de 2026»).
 */
export function etiquetaDia(iso, { locale = 'ca-ES', t = null, ara = Date.now() } = {}) {
  const d = aData(iso);
  if (!d) return '';
  const dies = diesDeDiferencia(d, ara);
  if (dies <= 0) return textDe(t, 'section.xat.temps.hui', 'Hui');
  if (dies === 1) return textDe(t, 'section.xat.temps.ahir', 'Ahir');
  if (dies < 7) return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
