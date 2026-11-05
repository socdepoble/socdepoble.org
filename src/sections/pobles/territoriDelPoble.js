/** AH-17 · Xarxa → demarcació → comarca → poble; les pedanies conserven el municipi pare. */
import { slugDelPoble } from './nomsDelPoble.js';

export const DEMARCACIONS = Object.freeze([
  { id: 'alacant', nom: 'Alacant', etiqueta: "Comarques d'Alacant" },
  { id: 'valencia', nom: 'València', etiqueta: 'Comarques de València' },
  { id: 'castello', nom: 'Castelló', etiqueta: 'Comarques de Castelló' }
]);
export const provinciaDelPoble = (poble) => slugDelPoble(poble?.provincia);
export const comarcaDelPoble = (poble) => slugDelPoble(poble?.comarca);
export function rutaTerritorial(provincia, comarca) {
  const params = new URLSearchParams();
  if (provincia) params.set('provincia', provincia);
  if (comarca) params.set('comarca', comarca);
  const q = params.toString();
  return q ? `/pobles?${q}` : '/pobles';
}
export function arbreTerritorial(pobles = []) {
  return DEMARCACIONS.map((provincia) => {
    const locals = pobles.filter((poble) => provinciaDelPoble(poble) === provincia.id);
    const comarques = [...new Set(locals.map((poble) => poble.comarca).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'ca'))
      .map((nom) => ({ id: slugDelPoble(nom), nom, pobles: locals.filter((poble) => poble.comarca === nom)
        .sort((a, b) => String(a.title || a.name).localeCompare(String(b.title || b.name), 'ca')) }));
    return { ...provincia, comarques };
  });
}
export function filtraTerritori(pobles, provincia, comarca) {
  return pobles.filter((poble) => (!provincia || provinciaDelPoble(poble) === provincia)
    && (!comarca || comarcaDelPoble(poble) === comarca));
}
