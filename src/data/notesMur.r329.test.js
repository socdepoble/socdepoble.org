import { expect, test } from 'vitest';
import { createLocalNotesAdapter } from './localNotes.js';
import { getDefaultUserId } from './appSeed.js';
import { mapSectionSubmissionToItem, elementDeFilaPublicada } from './mapejadorSeccions.js';
import { esVisibleAlMur } from './visibilitatMur.js';
const config = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
const disk = () => {
  const state = new Map();
  return { read: async key => structuredClone(state.get(key) || {}), mutate: async (key, fn) => { const next = fn(structuredClone(state.get(key))); state.set(key, structuredClone(next)); return next; } };
};
test('Notes: mostrar/ocultar persistix amb CAS i la carpeta i el document continuen accessibles', async () => {
  const storage = disk(), a = createLocalNotesAdapter(storage);
  const note = await a.create({ title: 'Document', content: '<p>Íntegre</p>', folderId: 'llibre', mostrarAlMur: false }, config);
  expect(note).toMatchObject({ mostrarAlMur: false, ocultarDelMur: true, folderId: 'llibre', isPublished: false });
  const saved = await a.update(note.id, { ocultarDelMur: false }, 0, config);
  expect(saved).toMatchObject({ mostrarAlMur: true, ocultarDelMur: false, content: '<p>Íntegre</p>', folderId: 'llibre', isPublished: false });
  await expect(a.update(note.id, { mostrarAlMur: false }, 0, config)).rejects.toMatchObject({ status: 409 });
  const b = createLocalNotesAdapter(storage);
  expect((await b.load(getDefaultUserId(), config)).notes).toEqual([saved]);
});
test('Notes: cap coacció ni parell contradictori i cap escriptura després d’error', async () => {
  const a = createLocalNotesAdapter(disk());
  for (const input of [{ mostrarAlMur: 'false' }, { mostrarAlMur: null }, { ocultarDelMur: 1 }, { mostrarAlMur: false, ocultarDelMur: false }]) {
    await expect(a.create({ title: 'Invàlida', ...input }, config)).rejects.toMatchObject({ code: 'mur-visibilitat-invalida' });
  }
  expect((await a.load(getDefaultUserId(), config)).notes).toEqual([]);
});
test('Publicació: el booleà viatja al payload; false no és esborrat, retirada ni ampliació de permisos', () => {
  const payload = mapSectionSubmissionToItem({ id: 'publicada', sectionId: 'mur', payload: { title: 'Document', content: '<p>Íntegre</p>', ocultarDelMur: true } });
  const row = elementDeFilaPublicada({ id: 'publicada', payload, ownerUserId: 'autor', sectionId: 'mur' });
  expect(row).toMatchObject({ mostrarAlMur: false, ocultarDelMur: true, content: '<p>Íntegre</p>', ownerUserId: 'autor' });
  expect(esVisibleAlMur(row)).toBe(false);
  expect(() => mapSectionSubmissionToItem({ sectionId: 'mur', payload: { mostrarAlMur: 'false' } })).toThrow();
  expect(esVisibleAlMur(elementDeFilaPublicada({ id: 'malmesa', payload: { mostrarAlMur: 'false' }, sectionId: 'mur' }))).toBe(false);
});
