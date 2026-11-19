import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { PAGE_ROUTE_MAP } from '../config/navigation.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from './patrimoni/herbariLaTorre117.js';
import { FONTS_BANC_LLAVORS, VARIETATS_CATALEG_VALENCIA, VARIETATS_AVL_MALLORCA, ESPECIES_ATLES_CATALUNYA } from './patrimoni/bancLlavors.js';
import { LLIBRES_ARBRES_MONUMENTALS } from './patrimoni/llibresArbresMonumentals.js';
import { RECEPTES_QUE_DINEM } from './patrimoni/queDinem.js';

/* El registre de 2611111735 i les seues ampliacions (cada una amb la seua migració): R32.4 · /page/sistema-nervios. */
const SQL = ['2611111735_copublicacio_registrada.sql', '20261117150000_r324_copublicacio_pagina_sistema_nervios.sql']
  .map((fitxer) => readFileSync(`supabase/migrations/${fitxer}`, 'utf8')).join('\n');

/* IDEA-287 · /page/tot-el-que-pots-fer és a PAGE_COPY, però la seua fila del registre necessita una migració pròpia
   (com 20261117150000 per a sistema-nervios) i, amb ella, un pin POSSE nou del Node 0 (tooling/node0/posse/posse-ledger.sql,
   tests/r32-posse-cataleg.test.mjs). Les dues coses són de l'integrador i del Mestre, que l'aplica. Mentrestant la clau
   queda declarada ací com a pendent: fora del registre, private.copub_recurs no la reconeix com a peça del paquet, i la
   prova falla el dia que la migració arribe sense que algú lleve la clau d'esta llista. */
const PAGINES_PENDENTS_DE_REGISTRE = ['tot-el-que-pots-fer'];

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
    /* v1.2.8 · Codex R32.9 · /page/sistema-nervios passa al llibre de la Wiki (PAGE_ROUTE_MAP, Navigate amb replace):
       la clau ja no és a PAGE_COPY, però el registre de 20261117150000 (R32.4, fixat al pin POSSE) la conserva. */
    pagina: [...Object.keys(PAGE_COPY).filter((clau) => !PAGINES_PENDENTS_DE_REGISTRE.includes(clau)), ...['sistema-nervios'].filter((clau) => PAGE_ROUTE_MAP[clau]?.startsWith('/wikidepoble?item='))],
    llibre_cataleg: ['que-dinem', 'herbari', 'banc-de-llavors', ...catalegs, ...FONTS_BANC_LLAVORS.map(font => font.id)],
    recepta: RECEPTES_QUE_DINEM.map(recepta => recepta.slug),
    arbre: arbres,
    planta: ESPECIES_HERBARI_LA_TORRE_117.map(planta => planta.id),
    llavor: [...VARIETATS_CATALEG_VALENCIA, ...VARIETATS_AVL_MALLORCA, ...ESPECIES_ATLES_CATALUNYA].map(llavor => llavor.id)
  };
  // Cada pendent és una pàgina real de PAGE_COPY i encara no és al registre SQL.
  for (const clau of PAGINES_PENDENTS_DE_REGISTRE) {
    expect(Object.hasOwn(PAGE_COPY, clau), clau).toBe(true);
    expect(SQL.includes(`'${clau}'`), clau).toBe(false);
  }
  expect([...idsPerTipus.keys()].sort()).toEqual(Object.keys(ids).sort());
  for (const [tipus, valors] of Object.entries(ids)) expect(idsPerTipus.get(tipus).sort(), tipus).toEqual(valors.sort());
  expect(origensRentonar.get('llibre_cataleg')).toEqual(catalegs.sort());
  expect(origensRentonar.get('arbre').sort()).toEqual(arbres.sort());
  expect(SQL).toMatch(/p_tipus = 'article'[\s\S]*public\.section_submissions/);
});
