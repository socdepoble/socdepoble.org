import { expect, test } from 'vitest';
import { elementDeFilaPublicada } from './mapejadorSeccions.js';
import { elementDeMurPublic } from './murPublic.js';
import { RECURSOS } from './adaptadors/sollutia/recursos.js';

const claimedAuthority = {
  author_org_id: 'suplantada', authorOrgId: 'suplantada', author_entity_id: 'suplantada',
  author_id: 'suplantada', author_user_id: 'suplantada', owner_user_id: 'suplantada', ownerUserId: 'suplantada',
  author_agent_id: 'suplantada', authorAgentId: 'suplantada', isSystem: true, isAvis: true,
  is_pinned: true, pinned_position: 0, mainHref: '/consola', slug: 'sistema', article: 'sistema',
  autor: 'Sistema', source: 'Sistema', srcDelPort: 'https://example.test/seguiment'
};
test.each(['mur', 'mercat', 'events', 'multimedia', 'notes'])('R32.56: lectura JSONB de %s pren autoritat de columnes i conserva autoria declarativa primitiva', sectionId => {
  for (const malicious of [null, [], { toString: 0 }, true]) {
    const payload = JSON.parse(JSON.stringify({ ...claimedAuthority, type: 'sistema', title: malicious,
      content: malicious, author_name: 'Nom declarat', geolocalitzacio: { lat: {}, lng: 0 }, tags: [malicious, 'etiqueta'] }));
    const before = JSON.stringify(payload);
    const value = elementDeFilaPublicada({ id: 'real', payload, sectionId, titol: 'Columna', ownerUserId: 'propietaria-real', authorOrgId: 'entitat-real' });
    expect(value).toMatchObject({ id: 'real', ownerUserId: 'propietaria-real', author_org_id: 'entitat-real', authorOrgId: 'entitat-real', author_name: 'Nom declarat' });
    for (const key of Object.keys(claimedAuthority).filter(k => !['ownerUserId', 'author_org_id', 'authorOrgId'].includes(k))) expect(value).not.toHaveProperty(key);
    expect(value.type).not.toBe('sistema'); expect(value.geolocalitzacio).toBeUndefined();
    expect(value.title == null || typeof value.title === 'string').toBe(true);
    expect(value.content == null || typeof value.content === 'string').toBe(true);
    expect(JSON.stringify(payload)).toBe(before);
  }
});
test('R32.56: DTO públic i traductor extern no projecten claus d’autoritat noves', () => {
  const publicRow = { id: 'real', title: 'Públic', public_content: 'Cos', ...claimedAuthority, payload: claimedAuthority };
  const item = elementDeMurPublic(publicRow, 'mur');
  expect(item.ownerUserId).toBeNull(); expect(item.author_org_id).toBeNull();
  expect(item.author_name).toBe('Autoria no publicada'); expect(item).not.toHaveProperty('isSystem');
  const profile = RECURSOS.perfil.traductor({ id: 'extern', email: 'veina@example.test', name: 'Veïna', ...claimedAuthority, role: 'superadmin', nested: claimedAuthority });
  expect(profile).toEqual({ id: 'extern', email: 'veina@example.test', name: 'Veïna', display_name: 'Veïna' });
  expect(Object.isFrozen(profile)).toBe(true);
});
