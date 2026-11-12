import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from './patrimoni/herbariLaTorre117.js';
import { FONTS_BANC_LLAVORS, VARIETATS_CATALEG_VALENCIA, VARIETATS_AVL_MALLORCA, ESPECIES_ATLES_CATALUNYA } from './patrimoni/bancLlavors.js';
import { LLIBRES_ARBRES_MONUMENTALS } from './patrimoni/llibresArbresMonumentals.js';
import { RECEPTES_QUE_DINEM } from './patrimoni/queDinem.js';

const SQL = readFileSync('supabase/migrations/2611111735_copublicacio_registrada.sql', 'utf8');

test('el registre SQL cobreix els identificadors reals de les set superfícies del contracte', () => {
  const idsPerTipus = new Map();
  const origensRentonar = new Map();
  for (const [, tipus, bloc, origen] of SQL.matchAll(/\('([a-z_]+)', array\[([\s\S]*?)\], (null|'rentonar')\)/g)) {
    const ids = [...bloc.matchAll(/'([^']+)'/g)].map(m => m[1]);
    idsPerTipus.set(tipus, [...(idsPerTipus.get(tipus) ?? []), ...ids]);
    if (origen === "'rentonar'") origensRentonar.set(tipus, ids);
  }
  const catalegs = LLIBRES_ARBRES_MONUMENTALS.map(llibre => llibre.id);
  const arbres = LLIBRES_ARBRES_MONUMENTALS.flatMap(llibre => llibre.exemplars.map(arbre => `${llibre.id}:${arbre.id}`));
  const ids = {
    pagina: Object.keys(PAGE_COPY),
    llibre_cataleg: ['que-dinem', 'herbari', 'banc-de-llavors', ...catalegs, ...FONTS_BANC_LLAVORS.map(font => font.id)],
    recepta: RECEPTES_QUE_DINEM.map(recepta => recepta.slug),
    arbre: arbres,
    planta: ESPECIES_HERBARI_LA_TORRE_117.map(planta => planta.id),
    llavor: [...VARIETATS_CATALEG_VALENCIA, ...VARIETATS_AVL_MALLORCA, ...ESPECIES_ATLES_CATALUNYA].map(llavor => llavor.id)
  };
  expect([...idsPerTipus.keys()].sort()).toEqual(Object.keys(ids).sort());
  for (const [tipus, valors] of Object.entries(ids)) expect(idsPerTipus.get(tipus).sort(), tipus).toEqual(valors.sort());
  expect(origensRentonar.get('llibre_cataleg')).toEqual(catalegs.sort());
  expect(origensRentonar.get('arbre').sort()).toEqual(arbres.sort());
  expect(SQL).toMatch(/p_tipus = 'article'[\s\S]*public\.section_submissions/);
});
