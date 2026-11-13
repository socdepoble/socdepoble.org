import { expect, test } from 'vitest';
import { elementDeMurPublic } from './murPublic.js';
import { projeccioCatalegDe, perDestiCataleg } from './projeccionsCataleg.js';
test('R21 · el DTO no confia en payload desconegut, owner, contacte o EXIF', () => {
  const item = elementDeMurPublic({ id: 'p', title: 'Fira', description: {}, public_content: '<p>Públic</p>',
    owner_user_id: 'private', ownerUserId: 'private', payload: { phone: 'private', image: '/unsafe.jpg' },
    catalog_font: 'importacio-wp', catalog_id: '619', catalog_destins: ['herbari'], destinacio_workspace: 'herbari' }, 'mur');
  expect(item.ownerUserId).toBe(null); expect(item).not.toHaveProperty('payload'); expect(item).not.toHaveProperty('image');
  expect(JSON.stringify(item)).not.toContain('private');
  expect(projeccioCatalegDe(item)).toMatchObject({ ownerId: null, audiencia: 'publica', destins: ['herbari'] });
  expect(perDestiCataleg([item], 'herbari')).toHaveLength(1);
  expect(perDestiCataleg([item], 'bar', { ownerId: 'private' })).toEqual([]);
  expect(projeccioCatalegDe({ ...item, projeccioCataleg: { ...item.projeccioCataleg, audiencia: 'privada', destins: ['bar'] } })).toBe(null);
});
