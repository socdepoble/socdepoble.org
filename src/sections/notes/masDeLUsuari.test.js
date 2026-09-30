import { expect, test } from 'vitest';
import { itemsPublicatsDe, pertanyALActor } from './masDeLUsuari.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';

/* T1 · el MAS ensenya només el que ha publicat l'actor. */
const samarreta = { id: 'samarreta-socdepoble', title: 'Samarreta', author_id: 'soc-de-poble_official', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z', images: ['/a.png'], description: 'Mapa del tresor' };
const mac = { id: 'mac-mini-m4', title: 'Mac Mini', author_id: 'javillinares', seller: 'Javi', created_at: '2026-02-15T12:00:00.000Z' };
const remotEntitat = { id: 'r1', title: 'Fira', ownerUserId: 'u-javi', authorOrgId: 'org-1' };
const remotPersona = { id: 'r2', title: 'Ruta', ownerUserId: 'u-javi', authorOrgId: null };

test('en seed, l’entitat pilot veu la samarreta i la persona pilot el Mac Mini', () => {
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble' }, { dataMode: 'seed' });
  const persona = aliesDeLActor({ tipus: 'persona', id: 'u-javi', rol: 'persona' }, { dataMode: 'seed' });
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, entitat).map((i) => i.id)).toEqual(['publicacio:mercat:samarreta-socdepoble']);
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, persona).map((i) => i.title)).toEqual(['Mac Mini']);
});

test('el convidat no hereta res de la persona pilot, i sense àlies no hi ha res', () => {
  const convidat = aliesDeLActor({ tipus: 'persona', id: 'convidat', rol: 'convidat' }, { dataMode: 'seed' });
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, convidat)).toEqual([]);
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, new Set())).toEqual([]);
  expect(pertanyALActor(samarreta, null)).toBe(false);
});

test('en remot manen les columnes: una publicació signada per l’entitat no és de la persona', () => {
  const persona = aliesDeLActor({ tipus: 'persona', id: 'u-javi' });
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'org-1' });
  expect(pertanyALActor(remotEntitat, persona)).toBe(false);
  expect(pertanyALActor(remotEntitat, entitat)).toBe(true);
  expect(pertanyALActor(remotPersona, persona)).toBe(true);
  const [ruta] = itemsPublicatsDe({ feedPosts: [remotEntitat, remotPersona] }, persona);
  expect(ruta).toMatchObject({ categoryIds: ['f-mur'], kind: 'publicacio', data: { seccio: 'mur', ruta: '/mur/r2' } });
});

test('l’element de l’espai de treball és de lectura: sense etiquetes, amb imatge, secció i data', () => {
  const [item] = itemsPublicatsDe({ marketItems: [samarreta] }, new Set(['socdepoble']));
  expect(item).toMatchObject({ title: 'Samarreta', image: '/a.png', tags: [], excerpt: 'Mapa del tresor', labels: [{ text: 'Mercat', className: 'sdp-badge-system' }] });
  expect(item.subtitle).toMatch(/15\/08\/26/);
  /* Les pàgines de sistema del Mur no són de ningú. */
  expect(itemsPublicatsDe({ feedPosts: [{ id: 'legal', isSystem: true, author_id: 'javillinares' }] }, new Set(['javillinares']))).toEqual([]);
});
