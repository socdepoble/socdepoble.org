// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { creaServeiNoticies } from './client.js';
const dto = { font: 'observatori-mestres', xml: '<rss/>', obtingut: null, obsoleta: false };
const crea = (o = {}) => creaServeiNoticies({ apiOrigin: 'https://example.org', ...o });

test('Observatori mai va al GET públic; permís absent, fals, revocat o que llança falla tancat', async () => {
  const fetchImpl = vi.fn(); const feed = vi.fn(async () => dto); let autoritzat = true;
  const servei = crea({ fetchImpl, observatori: { autoritzat: () => autoritzat, feed } });
  expect((await servei.fonts()).fonts.some((f) => f.id === dto.font)).toBe(true);
  expect(await servei.feed(dto.font)).toEqual(dto);
  autoritzat = false;
  expect((await servei.fonts()).fonts.some((f) => f.id === dto.font)).toBe(false);
  await expect(servei.feed(dto.font)).rejects.toMatchObject({ motiu: 'font' });
  await expect(crea({ fetchImpl }).feed(dto.font)).rejects.toMatchObject({ motiu: 'font' });
  await expect(crea({ fetchImpl, observatori: { autoritzat: () => { throw Error('x'); }, feed } }).feed(dto.font)).rejects.toMatchObject({ motiu: 'font' });
  expect(fetchImpl).not.toHaveBeenCalled(); expect(feed).toHaveBeenCalledOnce();
});

test('transport privat no pot tornar el feed d’una altra font ni un DTO invàlid', async () => {
  const autoritzat = () => true;
  await expect(crea({ observatori: { autoritzat, feed: async () => ({ ...dto, font: 'emowe' }) } }).feed(dto.font)).rejects.toMatchObject({ motiu: 'servidor' });
  await expect(crea({ observatori: { autoritzat, feed: async () => ({ ...dto, xml: '' }) } }).feed(dto.font)).rejects.toMatchObject({ motiu: 'servidor' });
});

test('un catàleg injectat no pot publicar accidentalment l’observatori sense transport privat', async () => {
  const servei = crea({ categories: [{ id: 'observatori', nom: 'Privat' }], fonts: [{ id: dto.font, nom: 'Privat', categoriaId: 'observatori' }] });
  expect(await servei.fonts()).toEqual({ categories: [], fonts: [] });
  await expect(servei.feed(dto.font)).rejects.toMatchObject({ motiu: 'font' });
});

test('[DEFECTE] una resposta privada tardana no sobreviu una cancel·lació encara que el transport ignore el senyal', async () => {
  for (const rebutja of [false, true]) {
    let acaba, falla;
    const pendent = new Promise((resolve, reject) => { acaba = resolve; falla = reject; });
    const controller = new AbortController();
    const servei = crea({ observatori: { autoritzat: () => true, feed: () => pendent } });
    const resposta = servei.feed(dto.font, { signal: controller.signal });
    const negativa = expect(resposta).rejects.toMatchObject({ code: 'CANCELLED' });
    controller.abort();
    if (rebutja) falla(new DOMException('Avortat', 'AbortError')); else acaba(dto);
    await negativa;
  }
});
