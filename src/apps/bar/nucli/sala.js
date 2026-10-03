/**
 * El Bar · nucli/sala.js — zones i taules (disseny del Bar §A.3).
 *
 *   sala { zones: [{ id, nom }], taules: [{ id (slug: 't5', 'terrassa-3'), nom, zonaId, places, posicio: { fila, columna } }] }
 *
 * El plànol és una graella de files i columnes: sense coordenades lliures.
 * L'id d'una taula va al camí (/app/bar/taules/t5): només és un slug.
 */
import { esSlug } from './comu.js';

/** @returns {{ ok: boolean, errors: string[] }} */
export function validaSala(sala) {
  const errors = [];
  if (!sala || !Array.isArray(sala.zones) || !Array.isArray(sala.taules)) return { ok: false, errors: ['la sala és { zones, taules }'] };
  const zones = new Set();
  sala.zones.forEach((z, i) => {
    if (!esSlug(z?.id)) errors.push(`zones[${i}]: l'id ha de ser un slug`);
    else if (zones.has(z.id)) errors.push(`zones[${i}]: id repetit`);
    zones.add(z?.id);
    if (!(typeof z?.nom === 'string' && z.nom.trim())) errors.push(`zones[${i}]: cal un nom`);
  });
  const taules = new Set();
  sala.taules.forEach((t, i) => {
    if (!esSlug(t?.id)) errors.push(`taules[${i}]: l'id ha de ser un slug`);
    else if (taules.has(t.id)) errors.push(`taules[${i}]: id repetit`);
    taules.add(t?.id);
    if (!(typeof t?.nom === 'string' && t.nom.trim())) errors.push(`taules[${i}]: cal un nom`);
    if (!zones.has(t?.zonaId)) errors.push(`taules[${i}]: la zona no existix`);
    if (!(Number.isSafeInteger(t?.places) && t.places >= 1 && t.places <= 99)) errors.push(`taules[${i}]: places d'1 a 99`);
    const { fila, columna } = t?.posicio || {};
    if (!(Number.isSafeInteger(fila) && fila >= 1 && Number.isSafeInteger(columna) && columna >= 1)) errors.push(`taules[${i}]: posició { fila, columna } ≥ 1`);
  });
  return { ok: errors.length === 0, errors };
}

/** Les taules d'una sala en l'ordre del plànol: zona, fila i columna. */
export function taulesEnOrdre(sala) {
  const ordreZona = new Map((sala?.zones || []).map((z, i) => [z.id, i]));
  return [...(sala?.taules || [])].sort((a, b) => (ordreZona.get(a.zonaId) ?? 0) - (ordreZona.get(b.zonaId) ?? 0)
    || a.posicio.fila - b.posicio.fila || a.posicio.columna - b.posicio.columna);
}
