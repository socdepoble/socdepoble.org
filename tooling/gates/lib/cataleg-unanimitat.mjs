/** Catalogue identities from the six versioned sources. Only the explicit
 * offline partial-ingestion CLI imports this module, never application startup. */
import { RECEPTES_QUE_DINEM } from '../../../src/data/patrimoni/queDinem.js';
import { llavorCarta } from '../../../src/apps/bar/nucli/llavor.js';
import { INGREDIENTS } from '../../../src/apps/nevera/nucli/ingredients.js';
import { RECEPTES } from '../../../src/apps/nevera/nucli/receptes.js';
import { VARIETATS_CATALEG_VALENCIA, VARIETATS_AVL_MALLORCA, ESPECIES_ATLES_CATALUNYA, VARIETATS_OLIVERA_GVA_IVIA } from '../../../src/data/patrimoni/bancLlavors.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../../src/data/patrimoni/herbariLaTorre117.js';
export const FONTS_CATALEG_UNANIMITAT = Object.freeze([
  'src/data/patrimoni/queDinem.js', 'src/apps/bar/nucli/llavor.js',
  'src/apps/nevera/nucli/ingredients.js', 'src/apps/nevera/nucli/receptes.js',
  'src/data/patrimoni/bancLlavors.js', 'src/data/patrimoni/herbariLaTorre117.js'
]);
export const CATALEG_UNANIMITAT = Object.freeze([
  ...RECEPTES_QUE_DINEM.map(r => ({ corpus: 'quedinem', uid: `quedinem:${r.slug}` })),
  ...llavorCarta().productes.map(r => ({ corpus: 'bar', uid: `bar-producte:${r.id}` })),
  ...INGREDIENTS.map(r => ({ corpus: 'nevera-ing', uid: `nevera-ingredient:${r.id}` })),
  ...RECEPTES.map(r => ({ corpus: 'nevera-rec', uid: `nevera-recepta:${r.id}` })),
  ...VARIETATS_CATALEG_VALENCIA.map(r => ({ corpus: 'llavors', uid: `llavor-cv:${r.id}` })),
  ...VARIETATS_AVL_MALLORCA.map(r => ({ corpus: 'llavors', uid: `llavor-avl:${r.id}` })),
  ...ESPECIES_ATLES_CATALUNYA.map(r => ({ corpus: 'llavors', uid: `llavor-atles:${r.id}` })),
  ...VARIETATS_OLIVERA_GVA_IVIA.map(r => ({ corpus: 'llavors', uid: `olivera-gva:${r.id}` })),
  ...ESPECIES_HERBARI_LA_TORRE_117.map(r => ({ corpus: 'herbari', uid: `herbari:${r.slug}` }))
].map(Object.freeze));
