/** v1.2.8 · El validador d'espais, sol: el lligen carpetesVisibles.js i columnesPlegades.js (P0-127).
 * Separat perquè la persistència de columnes, que App.jsx carrega a l'arrencada, no hi porte tot el
 * magatzem de carpetes visibles (pes de l'arrencada estàtica del connector de WordPress).
 * La mateixa forma que la clau del mestre-detall (nivellMestreDetall.js). */
const PATRO_ESPAI = /^[a-z][a-z0-9-]{0,39}$/;

/** Un nom d'espai vàlid: minúscules, xifres i guions, com la clau del mestre-detall. */
export const esEspaiValid = (espai) => typeof espai === 'string' && PATRO_ESPAI.test(espai);
