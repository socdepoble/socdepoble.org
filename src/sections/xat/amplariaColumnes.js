/**
 * amplariaColumnes.js — els tres valors predefinits de l'amplària de les
 * columnes del Xat, compartits pel Control del xat (/control-xat,
 * XatControlSection) i pel full «Ajustos» (torn 260930, T1). Abans vivien
 * dins de XatControlSection; ara una sola llista servix les dos portes.
 *
 * Les mides NO són ací: les posa AppGridShell (PRESETS_COLUMNES i
 * applyPreset). Este mòdul no importa res: només l'id del preset, la clau
 * i18n i el text, i la funció que diu quin preset són unes mides.
 */

/** [id del preset d'AppGridShell, clau i18n, text en valencià], en l'ordre de sempre. */
export const PRESETS_AMPLARIA = Object.freeze([
  Object.freeze(['compacta', 'section.xat.control.espai.compacta', 'Compacta']),
  Object.freeze(['defecte', 'section.xat.control.espai.defecte', 'Per defecte']),
  Object.freeze(['ampla', 'section.xat.control.espai.ampla', 'Ampla'])
]);

/**
 * L'id del preset que coincidix exactament amb `mides` ({ left, middle }),
 * dins de `taula` ({ [id]: { left, middle } }, AppGridShell.PRESETS_COLUMNES).
 * Null si la persona ha arrossegat els separadors a una mida pròpia: llavors
 * cap opció porta el ✓, perquè cap no és la de veres.
 */
export function presetDeMides(mides, taula = {}) {
  if (!mides) return null;
  for (const [id] of PRESETS_AMPLARIA) {
    const preset = taula[id];
    if (preset && preset.left === mides.left && preset.middle === mides.middle) return id;
  }
  return null;
}
