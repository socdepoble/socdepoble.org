/** PRIVADESA-01 (R15b) · Les fonts canòniques del catàleg (l'Herbari, el Banc de llavors i Què dinem?) són al
 * codi: el títol, el subtítol i l'entradilla d'una referència a una d'elles ixen de la fitxa canònica pel seu id, mai
 * de la fila publicada. Una fila amb text fals es pinta amb el text canònic, i una que no casa amb cap fitxa no es
 * pinta. Les fonts de la persona (el Rebost i el Bar) no tenen fitxa al codi: passen tal qual, amb la moderació.
 *
 * Els textos són els mateixos que el catàleg pinta i publica (capturaFontCataleg de CatalegWorkspace): l'Herbari, els
 * de modelHerbariWorkspace en la llengua de qui mira; el Banc de llavors, el nom, el nom científic i l'autoria de la
 * font (BancLlavorsWorkspaceSection); Què dinem?, el títol de la recepta (ReceptesWorkspaceSection). Les dades són
 * mòduls grossos: es carreguen a demanda (import()), només la font que una fila demana i una sola vegada per font i
 * llengua; mentre no han arribat, o si no arriben, la fila no es pinta (mai el text de la fila).
 */
import { projeccioCatalegDe } from './projeccionsCataleg.js';
import { objecteDe } from '../config/navigation.js';

export const FONTS_CANONIQUES_CATALEG = Object.freeze(['herbari', 'llavors', 'receptes']);

const fitxa = (title, subtitle, lead) => Object.freeze({ title: String(title), subtitle: subtitle ? String(subtitle) : '', lead: lead ? String(lead) : '' });
/* El primer id guanya, com a la llista del catàleg. */
const perId = (parells) => {
  const mapa = new Map();
  for (const [id, valor] of parells) if (!mapa.has(String(id))) mapa.set(String(id), valor);
  return mapa;
};

const CARREGADORS = Object.freeze({
  herbari: async (llengua) => {
    const [{ modelHerbariWorkspace }, { textosHerbari }] = await Promise.all([
      import('../sections/patrimoni/modelHerbariWorkspace.js'), import('../sections/patrimoni/textosHerbari.js')]);
    return perId(modelHerbariWorkspace(textosHerbari(llengua)).items.map(item => [item.id, fitxa(item.title, item.subtitle, item.lead)]));
  },
  llavors: async () => {
    const { FONTS_BANC_LLAVORS, entradesDelCataleg } = await import('./patrimoni/bancLlavors.js');
    return perId(FONTS_BANC_LLAVORS.flatMap(font => entradesDelCataleg(font.id)
      .map(entrada => [entrada.id, fitxa(entrada.nom, entrada.nomCientific, font.autoria)])));
  },
  receptes: async () => {
    const { RECEPTES_QUE_DINEM } = await import('./patrimoni/queDinem.js');
    return perId(RECEPTES_QUE_DINEM.map(recepta => [recepta.slug, fitxa(recepta.titol, '', '')]));
  }
});

/* Només l'entradilla de l'Herbari depén de la llengua. */
const clauDe = (font, llengua) => (font === 'herbari' ? `herbari:${String(llengua || 'ca')}` : font);
const enCurs = new Map();
const carregades = new Map();

/** La font canònica ja carregada (Map id → { title, subtitle, lead }), o undefined. */
export const fitxesCanoniquesCarregades = (font, llengua) => carregades.get(clauDe(font, llengua));

/** Carrega una font canònica (una sola vegada per font i llengua). Una fallada es pot tornar a provar. */
export function carregaFitxesCanoniques(font, llengua = 'ca') {
  if (!FONTS_CANONIQUES_CATALEG.includes(font)) return Promise.resolve(null);
  const clau = clauDe(font, llengua);
  if (carregades.has(clau)) return Promise.resolve(carregades.get(clau));
  if (!enCurs.has(clau)) {
    enCurs.set(clau, CARREGADORS[font](llengua).then(mapa => { carregades.set(clau, mapa); return mapa; })
      .finally(() => { enCurs.delete(clau); }));
  }
  return enCurs.get(clau);
}

/** Les fonts canòniques (font i llengua) que demanen estes files i encara no s'han carregat. */
export function fontsCanoniquesPendents(items, llengua) {
  const pendents = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const font = projeccioCatalegDe(item)?.font.font;
    if (FONTS_CANONIQUES_CATALEG.includes(font) && !fitxesCanoniquesCarregades(font, llengua)) pendents.add(font);
  }
  return [...pendents].sort();
}

/** L'objecte moderable d'una referència d'una altra persona (el de TargetaDelMur: objecteDe de la fila, secció
 * 'mur'), o undefined si és pròpia o local. La fila no porta cap nom fiable de qui la signa (el mapejador hi posa el
 * títol): el menú i els diàlegs de denúncia i bloqueig diuen `autoria` («qui ha publicat esta referència»). */
export function objecteDeProjeccioCataleg(item, ownerId, autoria) {
  const row = projeccioCatalegDe(item);
  if (!row || row.local || (typeof ownerId === 'string' && row.ownerId === ownerId.toLowerCase())) return undefined;
  return objecteDe({ ...item, author_name: autoria }, 'mur');
}

/** La fila amb el text de la seua fitxa canònica; la mateixa fila si la font no és canònica; null si la fila no és
 * cap referència vàlida, si no casa amb cap fitxa o si la font encara no s'ha carregat. Pura (llig la memòria). */
export function ambTextCanonic(item, llengua) {
  const row = projeccioCatalegDe(item);
  if (!row) return null;
  if (!FONTS_CANONIQUES_CATALEG.includes(row.font.font)) return item;
  const canonica = fitxesCanoniquesCarregades(row.font.font, llengua)?.get(row.font.id);
  if (!canonica) return null;
  return { ...item, title: canonica.title, subtitle: canonica.subtitle, entradilla: canonica.lead, description: canonica.lead };
}
