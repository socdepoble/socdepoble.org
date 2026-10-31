// @vitest-environment node
/* Gauntlet 261030 (Fase 3, TC3.2; troballa P1 `traduir-contingut-de-membres`)
   · Quan una superfície amb contingut de la gent es pot traduir. Pur i al
   precommit (*.seguretat.test.*): la regla (visibilitatTraduible.js) i que
   cada superfície que pinta contingut del veïnat la fa servir. Les proves de
   pintat, al costat de cada secció (*.traduccio.test.jsx). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { SECCIONS_AMB_CONTINGUT_PUBLIC, elementTraduible, esElementPublic, totsPublics } from './visibilitatTraduible.js';

test('públic: sense marca de persona propietària i amb visibility absent o «public»', () => {
  expect(esElementPublic({ id: 'a', title: 'Festa' })).toBe(true);
  expect(esElementPublic({ id: 'a', visibility: 'public' })).toBe(true);
  // elementDeFilaPublicada posa SEMPRE ownerUserId a una fila del veïnat, encara que siga null.
  for (const marca of [{ ownerUserId: null }, { ownerUserId: 'u' }, { owner_user_id: 'u' }, { author_user_id: 'u' }, { owner_user_id: undefined }])
    expect(esElementPublic({ id: 'a', ...marca }), JSON.stringify(marca)).toBe(false);
  for (const visibility of ['members', 'private', '', null, 'PUBLIC'])
    expect(esElementPublic({ id: 'a', visibility }), String(visibility)).toBe(false);
  for (const res of [null, undefined, 'a', 3, [], [{ id: 'a' }]]) expect(esElementPublic(res)).toBe(false);
});

test('totsPublics: una sola llista dolenta o un sol element no públic ho apaga tot (fallada tancada)', () => {
  expect(totsPublics()).toBe(true);
  expect(totsPublics([], [{ id: 'a' }])).toBe(true);
  expect(totsPublics([{ id: 'a' }], [{ id: 'b', ownerUserId: null }])).toBe(false);
  expect(totsPublics([{ id: 'a' }], undefined)).toBe(false);
  expect(totsPublics(null)).toBe(false);
});

test('elementTraduible: només les seccions que poden tindre contingut públic; notes i desconegudes, mai', () => {
  expect([...SECCIONS_AMB_CONTINGUT_PUBLIC]).toEqual(['mur', 'mercat', 'events', 'pobles', 'multimedia']);
  for (const seccio of SECCIONS_AMB_CONTINGUT_PUBLIC) expect(elementTraduible(seccio, { id: 'a' }), seccio).toBe(true);
  for (const seccio of ['notes', 'xat', 'perfil', '', undefined, 'MUR']) expect(elementTraduible(seccio, { id: 'a' }), String(seccio)).toBe(false);
  expect(elementTraduible('mur', { id: 'a', ownerUserId: null })).toBe(false);
});

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const llig = (rel) => senseComentaris(fs.readFileSync(path.join(SRC, rel), 'utf8'));

/* Cada superfície que pinta contingut del veïnat decidix Traduir amb la regla
   (i no amb un `true` per defecte): si algú la lleva, açò cau. */
test('les superfícies del veïnat passen la visibilitat real a traduccio=', () => {
  const SUPERFICIES = {
    'sections/mur/MurSection.jsx': 'traduccio={totsPublics(allItems)}',
    'sections/mercat/MercatSection.jsx': 'traduccio={totsPublics(sortedMarketItems)}',
    'sections/calendari/CalendariSection.jsx': 'traduccio={traduible}',
    'sections/detail/ItemDetailSection.jsx': 'traduccio={traduible}',
    'sections/notes/PublicacioDetall.jsx': 'traduccio={elementTraduible(seccio, publicacio)}',
    'sections/multimedia/PaginesEspaiMultimedia.jsx': 'traduccio={esElementPublic(item)}',
    'sections/profile/PerfilPublicSection.jsx': 'traduccio={fitxaTraduible}'
  };
  for (const [rel, prop] of Object.entries(SUPERFICIES)) expect(llig(rel), rel).toContain(prop);
  expect(llig('sections/calendari/CalendariSection.jsx')).toContain("totsPublics(sortedEvents, sortedFeedPosts, sortedMarketItems)\n    && !teCapacitat('agenda') && !configFontsDeLEntorn().configurades");
  expect(llig('sections/detail/ItemDetailSection.jsx')).toContain("elementTraduible(sectionId, item) && (sectionId !== 'pobles' || totsPublics(");
  expect(llig('sections/profile/PerfilPublicSection.jsx')).toContain('const fitxaTraduible = perfil.publicat === true && !ambVeinatConnectat;');
  expect(llig('sections/multimedia/PaginesEspaiMultimedia.jsx')).toContain('traduccio={totsPublics(categoria === GALERIA_CRONOLOGIA ? cataleg.totes : membres)}');
});
