/* Gauntlet 261017 (M07) · La branca multimèdia de resolveItemPath
   (config/navigation.js): la foto d'un poble porta a /pobles/<slug>, mai a
   /multimedia/town-<slug>. La regla del prefix viu dues vegades a posta
   (config no importa de sections/, i rutesMultimedia.js no importa res):
   esta prova vigila que no es desfasen. getSectionItemPath, en canvi, es
   queda amb /multimedia/<id>: és la ruta del fil de xat de la foto, la que
   el servidor mirall (contracte.js · rutaDeSubjecte). */
import { describe, expect, test } from 'vitest';
import { getSectionItemPath, resolveItemPath } from './navigation.js';
import { destiDeMultimedia } from '../sections/multimedia/rutesMultimedia.js';
import { MEDIA_ITEMS, fotosDelsPobles } from '../sections/multimedia/mediaContent.js';

describe('resolveItemPath · multimèdia', () => {
  test('la foto d’un poble porta a la pàgina del poble, per l’article o pel prefix d’una fila vella', () => {
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'town-tibi', article: { sectionId: 'pobles', id: 'tibi' } })).toBe('/pobles/tibi');
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'town-sella' })).toBe('/pobles/sella');
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'town-penàguila' })).toBe('/pobles/pen%C3%A0guila');
  });

  test('la resta continua a /multimedia/<id>', () => {
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'town-' })).toBe('/multimedia/town-');
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'nano-mur' })).toBe('/multimedia/nano-mur');
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'feed-p', article: { sectionId: 'mur', id: 'p' } })).toBe('/multimedia/feed-p');
    expect(resolveItemPath({ sectionId: 'multimedia', id: 'town-x', article: { sectionId: 'pobles', id: '' } })).toBe('/pobles/x');
  });

  test('getSectionItemPath no canvia: el fil de xat de la foto és el de /multimedia/<id>', () => {
    expect(getSectionItemPath('multimedia', 'town-benifallim')).toBe('/multimedia/town-benifallim');
  });
});

describe('paritat amb destiDeMultimedia (rutesMultimedia.js)', () => {
  test('cada foto de poble de la llavor porta al mateix lloc per l’enllaç i per la redirecció', () => {
    const delsPobles = MEDIA_ITEMS.filter((item) => String(item.id).startsWith('town-'));
    expect(delsPobles.length).toBeGreaterThan(0);
    for (const item of delsPobles) {
      const enllac = resolveItemPath(item);
      expect([item.id, enllac]).toEqual([item.id, destiDeMultimedia(item.id)]);
      // I la ruta del fil (getSectionItemPath), un cop redirigida, també.
      const fil = getSectionItemPath('multimedia', item.id);
      expect([item.id, destiDeMultimedia(decodeURIComponent(fil.split('/').pop()))]).toEqual([item.id, enllac]);
    }
  });

  test('també amb ids fora de la forma de la llavor (accents, majúscules, barres)', () => {
    const pobles = [{ id: 'penàguila', title: 'Penàguila' }, { id: 'Benifallim', title: 'Benifallim' }, { id: 'a/b', title: 'A/B' }];
    for (const item of fotosDelsPobles(pobles)) {
      expect([item.id, resolveItemPath(item)]).toEqual([item.id, destiDeMultimedia(item.id)]);
    }
  });
});
