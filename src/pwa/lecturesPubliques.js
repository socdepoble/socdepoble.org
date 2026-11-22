/* Memòria volàtil de lectures iniciades i acabades sense sessió. Cap disc ni
   fallback de dades: només el registrador propi en pot fer una còpia de text. */
const fonts = new Map();
const oients = new Set();
export function registraLecturaPublica(font, payload, generacio) {
  // Còpia pròpia: cap transformació posterior de la vista pot canviar la
  // font ni conservar una data antiga sobre una revisió local nova.
  const copia = structuredClone(Object.fromEntries(['feedPosts', 'events', 'marketItems', 'towns']
    .filter(clau => Array.isArray(payload?.[clau])).map(clau => [clau, payload[clau].slice(0, 50)])));
  fonts.set(font, { payload: copia, generacio, capturadaEl: new Date().toISOString() });
  for (const oient of oients) { try { oient(); } catch { /* ajuda opcional */ } }
}
const lectura = Object.freeze({ get: font => structuredClone(fonts.get(font)) });
export const lecturesPubliques = () => lectura;
export function subscriuLecturesPubliques(oient) {
  oients.add(oient);
  return () => oients.delete(oient);
}
