import { universalItemCataleg } from '../../utils/productes/producteUniversal.js';
import { ESPECIES_HERBARI_LA_TORRE_117, USOS_HERBARI_CANONICS } from '../../data/patrimoni/herbariLaTorre117.js';
const CLAUS_USOS = ['tots', 'aliment', 'aromatica', 'medicinal', 'ornamental', 'artesanal', 'toxic'];
/** Only a workspace projection of the canonical117records, no botanical model. */
export function modelHerbariWorkspace(textos, obteLamina) {
  return {
    status: 'ready', canAutoSelect: () => false,
    categories: USOS_HERBARI_CANONICS.slice(1).map((us, i) => ({ id: `us-${i + 1}`, label: textos[CLAUS_USOS[i + 1]],
      count: ESPECIES_HERBARI_LA_TORRE_117.filter(e => e.usos.includes(us)).length })),
    items: ESPECIES_HERBARI_LA_TORRE_117.map(especie => {
      const lamina = obteLamina?.(especie.id);
      return {
        ...universalItemCataleg({ id: especie.id, tipus: 'planta', nom: especie.nomValencia, font: especie.font, dades: especie }),
        title: especie.nomValencia, subtitle: especie.nomCientific, glyph: '🌿',
        ...(lamina?.imatgePrincipal ? {
          imageUrl: lamina.imatgePrincipal,
          imageAlt: `${especie.nomValencia} (${especie.nomCientific}) · làmina botànica Node 0`
        } : null),
        lead: especie.esToxica === true ? textos.toxicitatAdvertida : textos.toxicitatDesconeguda,
        categoryIds: especie.usos.map(us => `us-${USOS_HERBARI_CANONICS.indexOf(us)}`),
        searchText: [especie.nomValencia, especie.nomCastella, especie.nomAngles, especie.nomCientific, especie.zonaHerbari, ...(especie.zonesHerbari || [])].join(' '),
      };
    }),
  };
}
