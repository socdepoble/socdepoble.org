// @vitest-environment node
import { expect, test } from 'vitest';
import { fusionaModelProjeccionsCataleg } from './modelProjeccionsCataleg.js';
test('cap reserva de noms implícita: categoria i id de referència poden existir al domini sense col·lisió ni pèrdua', () => {
  const model = { status: 'ready', categories: [{ id: '__projeccions__', label: 'Categoria de la font' }, { id: '__projeccions__-1', label: 'Altra' }],
    items: [{ id: 'projeccio-uuid', title: 'Original', categoryIds: ['__projeccions__'] }, { id: 'projeccio-uuid-1', title: 'Altre original' }] };
  const references = [{ id: 'projeccio-uuid', title: 'Referència 1', categoryIds: ['__projeccions__'] }, { id: 'projeccio-uuid', title: 'Referència 2' }];
  const before = structuredClone({ model, references });
  const result = fusionaModelProjeccionsCataleg(model, references);
  expect(result.categories.map(row => row.id)).toEqual(['__projeccions__', '__projeccions__-1', '__projeccions__-2']);
  expect(result.items.map(item => item.id)).toEqual(['projeccio-uuid', 'projeccio-uuid-1', 'projeccio-uuid-2', 'projeccio-uuid-3']);
  expect(result.items.slice(2).every(item => item.categoryIds[0] === '__projeccions__-2')).toBe(true);
  expect(result.items.map(item => item.title)).toEqual(['Original', 'Altre original', 'Referència 1', 'Referència 2']);
  expect({ model, references }).toEqual(before);
  expect(fusionaModelProjeccionsCataleg(model, references)).toEqual(result);
});
test('cap referència: es conserva el model original; ids numèrics també ocupen el seu nom normalitzat', () => {
  const model = { items: [{ id: 4, title: 'Original' }], categories: [] };
  expect(fusionaModelProjeccionsCataleg(model, [])).toBe(model);
  expect(fusionaModelProjeccionsCataleg(model, [{ id: '4' }], 'Published references').items[1].id).toBe('4-1');
  expect(fusionaModelProjeccionsCataleg(model, [{ id: '4' }], 'Published references').categories[0].label).toBe('Published references');
});
