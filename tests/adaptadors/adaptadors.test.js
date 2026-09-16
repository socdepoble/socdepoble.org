import { describe, it, expect, vi } from 'vitest';
import { notaDesDeSupabase } from '../../src/data/adaptadors/supabase/notes.js';
import { ErrorFrontera } from '../../src/data/adaptadors/traductor.js';
import { creaClientSollutia } from '../../src/data/adaptadors/sollutia/client.js';
import { forma } from '../../tooling/sollutia/forma.mjs';

const FILA = {
  id: 'n1', folder_id: 'f-mur', title: 'Guia', subtitle: null, lead: null, content: '<p>x</p>',
  categories: ['Sistema'], tags: null, hero_image: null, is_published: true, revision: 3,
  updated_at: '2026-09-11T10:00:00Z',
};

describe('Frontissa · traductor', () => {
  it('fila vàlida → DTO intern congelat, sense noms de l’origen', () => {
    const { dto, avisos } = notaDesDeSupabase(FILA);
    expect(dto).toMatchObject({ id: 'n1', carpetaId: 'f-mur', titol: 'Guia', subtitol: '', categories: ['Sistema'], etiquetes: [], publicada: true, revisio: 3 });
    expect(Object.keys(dto)).not.toContain('folder_id');
    expect(Object.isFrozen(dto) && Object.isFrozen(dto.categories)).toBe(true);
    expect(avisos).toEqual([]);
  });
  it('l’origen canvia un tipus → falla tancat amb el camí exacte', () => {
    expect(() => notaDesDeSupabase({ ...FILA, revision: '3' })).toThrow(ErrorFrontera);
    try { notaDesDeSupabase({ ...FILA, revision: '3', updated_at: undefined }); } catch (e) {
      expect(e.errors).toEqual(expect.arrayContaining(['$.revision: s\'esperava nombre, arriba string', '$.updated_at: falta']));
    }
  });
  it('camp nou a l’origen → avís de deriva, no error', () => {
    const { avisos } = notaDesDeSupabase({ ...FILA, color: 'verd' });
    expect(avisos).toEqual(['supabase/notes@1: camp nou a l\'origen $.color']);
  });
});

describe('Frontissa · client Sollutia', () => {
  const client = creaClientSollutia({ baseUrl: 'https://sollutia.invalid/', fetchImpl: vi.fn() });
  it('les escriptures fallen per construcció', () => {
    expect(() => client.escriu('perfil')).toThrow(/escriptura no permesa/);
  });
  it('un recurs sense contracte capturat no fa cap petició', async () => {
    await expect(client.llig('perfil')).rejects.toThrow(/desconegut|pendent/);
  });
});

describe('Captura de contracte', () => {
  it('conserva la forma i esborra les dades personals', () => {
    const f = forma({ id: '3f2b1c9e-1111-4222-8333-444455556666', nom: 'Maria Llinares', correu: 'maria@poble.cat', edat: 81, alta: '2024-05-01T08:00:00Z', actiu: true, fills: [{ nom: 'A' }, { nom: 'B' }, { nom: 'C' }] });
    expect(f).toEqual({ id: '00000000-0000-0000-0000-000000000000', nom: 'text', correu: 'anonim@exemple.invalid', edat: 0, alta: '1970-01-01T00:00:00.000Z', actiu: true, fills: [{ nom: 'text' }, { nom: 'text' }] });
    expect(JSON.stringify(f)).not.toMatch(/Maria|poble\.cat|81/);
  });
});
