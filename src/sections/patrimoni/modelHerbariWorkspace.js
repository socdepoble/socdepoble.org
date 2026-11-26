import { llibreDeLaFont } from '../../data/patrimoni/catalegsMultipoble.js';
import { universalItemCataleg } from '../../utils/productes/producteUniversal.js';
import { ESPECIES_HERBARI_LA_TORRE_117, USOS_HERBARI_CANONICS } from '../../data/patrimoni/herbariLaTorre117.js';
const CLAUS_USOS = ['tots', 'aliment', 'aromatica', 'medicinal', 'ornamental', 'artesanal', 'toxic'];
/** Only a workspace projection of the canonical117records, no botanical model. */
export function modelHerbariWorkspace(textos, obteLamina) {
  const llibre = llibreHerbariLaTorre();
  return {
    status: 'ready', canAutoSelect: () => false,
    llibres: [llibre],
    presentacions: [llibre.presentacio],
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

/** Primer llibre d’una biblioteca multipoble. Els usos continuen sent filtres, no llibres.
 * C26-2 #13 · La font no declara qui l'ha elaborada: l'autoria ho diu, i no es reutilitza el títol del document.
 * La font original és el PDF transcrit (el títol del document i la seua SHA-256, les de cada fitxa), mai /page/herbari. */
export function llibreHerbariLaTorre() {
 const {document,sha256}=ESPECIES_HERBARI_LA_TORRE_117[0].font;
 const font={id:'herbari-la-torre',titol:'Herbari de La Torre',autoria:'Autoria no declarada a la font',ambit:'La Torre de les Maçanes',
  document:`${document} (PDF)`,sha256,nota:'117 plantes documentades. Les fitxes conserven la font i els usos tradicionals transcrits; no són recomanacions de consum.'};
 return llibreDeLaFont(font,ESPECIES_HERBARI_LA_TORRE_117.map(e=>({id:e.id,title:e.nomValencia,dades:e})),'/page/herbari');
}
