/**
 * recursos.js — Registre dels recursos de Sollutia que consumim.
 *
 * HONESTEDAT DE CONTRACTE: el bundle 260911 no conté cap resposta real de
 * Sollutia. No inventem rutes ni camps. Cada recurs arriba ací en tres passes:
 *   1. Captura: tooling/sollutia/captura-contracte.mjs desa la FORMA
 *      anonimitzada a tests/frontissa/fixtures/sollutia/<recurs>.json.
 *   2. Traductor: forma d'entrada literal + mapa cap a un DTO de dto.js.
 *   3. Porta: tractor-frontissa valida cada fixture contra el seu traductor.
 * Mentre `ruta` o `traductor` siguen null, `llig()` falla tancat.
 */
export const RECURSOS = {
  // exemple: perfil: { ruta: null, llista: false, traductor: null, fixture: 'perfil.json' },
};
