/**
 * La Nevera de Casa · Resum determinista i honest d'al·lèrgens UE 1169/2011
 * per a la vista de detall d'una recepta casolana.
 *
 * Pur (zero React, zero DOM, zero rellotge, zero xarxa). Llig primer qualsevol
 * projecció canònica del nucli (`matriuDeRecepta` / `alergensDeRecepta` /
 * `recepta.matriuAlergens` / `recepta.alergens`) i aplica com a suport
 * determinista la correspondència d'ingredients de llavor del receptari.
 * Mai certifica absències ni substitueix l'etiqueta comercial de cada envàs.
 */
import * as nucli from '../nucli/index.js';

export const ALERGENS_UE_1169 = Object.freeze([
  'gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja', 'llet',
  'fruits-closca', 'api', 'mostassa', 'sesam', 'sulfits', 'tramussos', 'molluscs'
]);

const ALERGENS_PER_INGREDIENT = Object.freeze({
  pa: Object.freeze(['gluten']),
  farina: Object.freeze(['gluten']),
  ou: Object.freeze(['ous']),
  tonyina: Object.freeze(['peix']),
  bacalla: Object.freeze(['peix'])
});

const INGREDIENTS_ELABORATS = new Set([
  'pa', 'farina', 'botifarra', 'cansalada', 'llevat', 'tonyina', 'bacalla'
]);

function normalitzaIdAlergen(id) {
  return String(id || '').trim().toLowerCase().replace(/_/g, '-');
}

function lligMatriuExterna(recepta) {
  let candidat = null;
  try {
    const fnMatriu = nucli['matriuDeRecepta'];
    const fnAlergens = nucli['alergensDeRecepta'];
    candidat = (typeof fnMatriu === 'function' ? fnMatriu(recepta) : null)
      || (typeof fnAlergens === 'function' ? fnAlergens(recepta) : null)
      || recepta?.matriuAlergens
      || recepta?.matriuFinal
      || recepta?.alergens
      || null;
  } catch {
    candidat = null;
  }

  if (!candidat || typeof candidat !== 'object') return null;

  if (Array.isArray(candidat)) {
    const obligatoris = candidat.map(normalitzaIdAlergen).filter((id) => ALERGENS_UE_1169.includes(id));
    return { obligatoris, opcionalsOTraces: [] };
  }

  const fontMatriu = candidat.matriu && typeof candidat.matriu === 'object' ? candidat.matriu : candidat;
  const obligatoris = [];
  const opcionalsOTraces = [];

  if (Array.isArray(candidat.alergens) || Array.isArray(candidat.obligatoris)) {
    const llistaObl = candidat.obligatoris || candidat.alergens || [];
    for (const raw of llistaObl) {
      const id = normalitzaIdAlergen(raw);
      if (ALERGENS_UE_1169.includes(id) && !obligatoris.includes(id)) obligatoris.push(id);
    }
    const llistaOpc = candidat.traces || candidat.opcionals || [];
    for (const raw of llistaOpc) {
      const id = normalitzaIdAlergen(raw);
      if (ALERGENS_UE_1169.includes(id) && !obligatoris.includes(id) && !opcionalsOTraces.includes(id)) {
        opcionalsOTraces.push(id);
      }
    }
    return { obligatoris, opcionalsOTraces };
  }

  let reconegut = false;
  for (const id of ALERGENS_UE_1169) {
    const clauGuioBaix = id.replace(/-/g, '_');
    const valor = fontMatriu[id] ?? fontMatriu[clauGuioBaix];
    if (typeof valor === 'string') reconegut = true;
    if (valor === 'ingredient' || valor === 'conte') obligatoris.push(id);
    else if (valor === 'traca') opcionalsOTraces.push(id);
  }
  return reconegut ? { obligatoris, opcionalsOTraces } : null;
}

export function resumAlergensRecepta(recepta) {
  if (!recepta || !Array.isArray(recepta.ingredients)) return null;

  const setObligatoris = new Set();
  const setOpcionals = new Set();
  let teLlentilla = false;
  let tePinyo = false;
  let teElaborats = false;

  const extern = lligMatriuExterna(recepta);
  if (extern) {
    for (const id of extern.obligatoris) setObligatoris.add(id);
    for (const id of extern.opcionalsOTraces) setOpcionals.add(id);
  }

  for (const linia of recepta.ingredients) {
    const alternatives = Array.isArray(linia.o) ? linia.o : [];
    const totsIds = [linia.id, ...alternatives].filter(Boolean);
    const esFix = linia.opcional !== true && alternatives.length === 0;

    for (const ingId of totsIds) {
      if (ingId === 'llentilla') teLlentilla = true;
      if (ingId === 'pinyo') tePinyo = true;
      if (INGREDIENTS_ELABORATS.has(ingId)) teElaborats = true;

      if (!extern) {
        const grup = ALERGENS_PER_INGREDIENT[ingId] || [];
        for (const alergenId of grup) {
          if (esFix && ingId === linia.id) setObligatoris.add(alergenId);
          else setOpcionals.add(alergenId);
        }
      }
    }
  }

  const obligatoris = ALERGENS_UE_1169.filter((id) => setObligatoris.has(id));
  const opcionalsOTraces = ALERGENS_UE_1169.filter((id) => setOpcionals.has(id) && !setObligatoris.has(id));

  return Object.freeze({
    obligatoris: Object.freeze(obligatoris),
    opcionalsOTraces: Object.freeze(opcionalsOTraces),
    teLlentilla,
    tePinyo,
    teElaborats
  });
}

export function llistaNomsAlergens(ids, tx) {
  const mapa = tx?.nomsAlergens || {};
  return ids.map((id) => mapa[id] || id).join(', ');
}
