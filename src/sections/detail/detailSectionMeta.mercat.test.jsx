/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · «Unifica el
 * producte en un únic node canònic […] Elimina la llista vertical de targetes
 * duplicades. Aplica el selector compacte de variants en píndoles
 * (role="radiogroup" accessible) […], amb un sol botó «Afegeix al cabàs» i
 * estat d'estoc («Esgotat»).» Auditoria Codex 2030 (§3.2 i §4.1): selecció
 * per id estable, mai per la posició ni pel nom; sdp-media:// resolt pel port
 * abans del filtre d'imatges pròpies, mai pintat cru; «Esgotat» del
 * stock_status, cap estoc inventat; cap compra nova.
 *
 * El cos del Mercat (buildMercatDetailSectionMeta · renderBody), el mateix que
 * pinten la pàgina /mercat/:id i el lector del MAS. Els orígens són sintètics.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mitjans: false, resol: vi.fn() }));
/* El port de mitjans només quan una prova el demana (mocks.mitjans). */
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    teCapacitat: (capacitat) => capacitat === 'mitjans' && mocks.mitjans,
    resolveAsset: (...args) => mocks.resol(...args)
  };
});

import { buildMercatDetailSectionMeta } from './detailSectionMeta.jsx';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const t = (_, alternativa) => alternativa;
const STORAGE = 'https://mercat-1.supabase.test';
const SDP_MEDIA = 'sdp-media://mitjans/poble/u/mercat/verda.webp';
const FOTO_DEL_PORT = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/mercat/verda.webp`;

const samarreta = (variations, extra) => ({
  id: 'samarreta', title: 'Samarreta', price: '15.00€', seller: 'Sóc de Poble',
  description: 'Cotó resistent.', variations, ...extra
});
const GRIS = { id: 'gris-plom', name: 'Edició Gris Plom', price: '15.00€', description: 'Cotó Roly Gris.', image: '/assets/mercat/gris.png' };
const VERDA = { id: 'verda-pi', name: 'Edició Verda', price: '16.00€', description: 'Verd pi.', image: '/assets/mercat/verda.jpg', stock_status: 'Esgotat' };

const pinta = (item, opcions = {}) => render(buildMercatDetailSectionMeta({ t, ...opcions }).renderBody(item));
const grup = (container) => within(container).getByRole('radiogroup', { name: 'Tria la variant' });
const radios = (container) => within(grup(container)).getAllByRole('radio');
const triat = (container) => radios(container).find((radio) => radio.checked);
const botonsDelCabas = (container) => within(container).queryAllByRole('button')
  .filter((boto) => /cabàs/.test(boto.textContent));
const fonts = (container) => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
const fotoActiva = (container) => container.querySelector('.sdp-compra__foto')?.getAttribute('src') ?? null;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mitjans = false;
});
afterEach(cleanup);

describe('un sol node: cap targeta per variació', () => {
  test('una caixa de compra, cap .note-card, un sol botó «Afegeix al cabàs»', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    expect(container.querySelectorAll('.sdp-compra')).toHaveLength(1);
    expect(container.querySelector('.note-card')).toBeNull();
    expect(container.querySelector('h3')).toBeNull();
    expect(botonsDelCabas(container)).toHaveLength(1);
    expect(within(container).getAllByRole('button')).toHaveLength(1);
    // La descripció del producte, una vegada; la de la variant triada, una vegada.
    expect(container.textContent.split('Cotó resistent.')).toHaveLength(2);
    expect(container.textContent.split('Cotó Roly Gris.')).toHaveLength(2);
    expect(container.textContent).not.toContain('Verd pi.');
    // Qui ven, una sola vegada.
    expect(container.querySelectorAll('.detail-seller')).toHaveLength(1);
    expect(container.querySelector('.detail-seller').textContent).toBe('Venedor: Sóc de Poble');
  });

  test('un producte sense variacions es pinta com abans: la descripció i res més (cap caixa ni botó)', () => {
    const { container } = pinta(samarreta([]));
    expect(container.querySelector('.sdp-compra')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toBe('Cotó resistent.');
  });

  test('sense venedor declarat, cap línia de venedor (mai la marca de Sóc de Poble per defecte)', () => {
    const { container } = pinta(samarreta([GRIS], { seller: '' }));
    expect(container.querySelector('.detail-seller')).toBeNull();
    expect(container.textContent).not.toContain('Sóc de Poble');
  });
});

describe('el selector: píndoles amb role="radiogroup"', () => {
  test('un grup amb nom, ràdios natius amb un mateix name (les fletxes del navegador) i una sola triada', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    const elGrup = grup(container);
    expect(elGrup.tagName).toBe('FIELDSET');
    expect(elGrup.querySelector('legend').textContent).toBe('Tria la variant');
    const llista = radios(container);
    expect(llista.map((radio) => radio.labels[0].textContent)).toEqual(['Edició Gris Plom', 'Edició Verda Esgotat']);
    expect(llista.every((radio) => radio.tagName === 'INPUT' && radio.type === 'radio')).toBe(true);
    expect(new Set(llista.map((radio) => radio.name)).size).toBe(1);
    expect(llista[0].name).not.toBe('');
    expect(llista.filter((radio) => radio.checked)).toHaveLength(1);
    // La zona tàctil és la píndola sencera: el label del seu ràdio.
    expect(llista.every((radio) => radio.labels[0].classList.contains('sdp-variant__pindola'))).toBe(true);
  });

  test('el valor de cada ràdio és l’id estable de la variació, mai la posició ni el nom', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    expect(radios(container).map((radio) => radio.value)).toEqual(['gris-plom', 'verda-pi']);
  });

  test('triar una variant actualitza la fitxa: foto, preu, descripció i estat', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    expect(fotoActiva(container)).toBe('/assets/mercat/gris.png');
    expect(container.querySelector('.sp-card-price').textContent).toBe('15.00€');
    fireEvent.click(within(container).getByRole('radio', { name: /Edició Verda/ }));
    expect(triat(container).value).toBe('verda-pi');
    expect(fotoActiva(container)).toBe('/assets/mercat/verda.jpg');
    expect(container.querySelector('.sp-card-price').textContent).toBe('16.00€');
    expect(container.querySelector('.sdp-compra__nom').textContent).toBe('Edició Verda');
    expect(container.textContent).toContain('Verd pi.');
    expect(container.textContent).not.toContain('Cotó Roly Gris.');
    /* La fitxa canvia en una regió viva, sense robar el focus.
       Expectativa actualitzada a propòsit (correcció de la revisió, Pla 2000):
       la regió viva ja no és la fitxa (el preu viu fora, al peu) sinó un
       resum amagat de la variant triada: el nom, el preu, l'estat i la
       descripció. Buida a l'entrada, perquè no es llija dues vegades. */
    const viva = container.querySelector('.sdp-compra [aria-live="polite"]');
    expect(viva.classList.contains('sdp-sr-only')).toBe(true);
    expect(viva.textContent).toBe('Edició Verda, 16.00€, Esgotat. Verd pi.');
    expect(container.querySelector('.sdp-compra__text').hasAttribute('aria-live')).toBe(false);
    fireEvent.click(within(container).getByRole('radio', { name: 'Edició Gris Plom' }));
    expect(viva.textContent).toBe('Edició Gris Plom, 15.00€. Cotó Roly Gris.');
  });

  test('a l’entrada, la regió viva és buida: res no es llig dues vegades', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    expect(container.querySelector('.sdp-compra [aria-live="polite"]').textContent).toBe('');
  });

  test('sense preu a la variant, el preu del producte', () => {
    const { container } = pinta(samarreta([{ id: 'blanca', name: 'Blanca' }]));
    expect(container.querySelector('.sp-card-price').textContent).toBe('15.00€');
  });

  test('reordenar i reanomenar les variacions no canvia la triada: va per l’id', () => {
    const meta = buildMercatDetailSectionMeta({ t });
    const { container, rerender } = render(meta.renderBody(samarreta([GRIS, { ...VERDA, stock_status: '' }])));
    fireEvent.click(within(container).getByRole('radio', { name: 'Edició Verda' }));
    expect(triat(container).value).toBe('verda-pi');
    const reanomenada = { ...VERDA, stock_status: '', name: 'Verd Pi (nova)' };
    rerender(meta.renderBody(samarreta([reanomenada, GRIS])));
    expect(triat(container).value).toBe('verda-pi');
    expect(triat(container).labels[0].textContent).toBe('Verd Pi (nova)');
    expect(container.querySelector('.sdp-compra__nom').textContent).toBe('Verd Pi (nova)');
    // Si la triada desapareix, la d'entrada.
    rerender(meta.renderBody(samarreta([GRIS])));
    expect(triat(container).value).toBe('gris-plom');
  });
});

describe('«Esgotat»: del stock_status, marcada però es pot triar', () => {
  test('la píndola esgotada es marca i no es desactiva; la d’entrada és la primera disponible', () => {
    const { container } = pinta(samarreta([VERDA, GRIS]));
    const [verda, gris] = radios(container);
    expect(verda.disabled).toBe(false);
    expect(verda.closest('.sdp-variant').classList.contains('sdp-variant--esgotada')).toBe(true);
    expect(gris.closest('.sdp-variant').classList.contains('sdp-variant--esgotada')).toBe(false);
    expect(within(verda.labels[0]).getByText('Esgotat').classList.contains('sdp-insignia--avis')).toBe(true);
    expect(gris.checked).toBe(true);
  });

  test('triar-la desactiva l’únic botó amb el text explícit; tornar a una disponible el reactiva', () => {
    const { container } = pinta(samarreta([GRIS, VERDA]));
    const [boto] = botonsDelCabas(container);
    expect(boto.disabled).toBe(false);
    expect(boto.textContent).toBe('Afegeix al cabàs');
    fireEvent.click(within(container).getByRole('radio', { name: /Edició Verda/ }));
    expect(botonsDelCabas(container)).toHaveLength(1);
    expect(botonsDelCabas(container)[0].disabled).toBe(true);
    expect(botonsDelCabas(container)[0].textContent).toBe('Esgotat · no es pot afegir al cabàs');
    expect(within(container.querySelector('.sdp-compra__text')).getByText('Esgotat')).toBeTruthy();
    fireEvent.click(within(container).getByRole('radio', { name: 'Edició Gris Plom' }));
    expect(botonsDelCabas(container)[0].disabled).toBe(false);
  });

  test.each(['esgotat', ' ESGOTADA ', 'Agotado', 'out_of_stock', 'Sold out'])('«%s» és esgotat', (estat) => {
    const { container } = pinta(samarreta([{ ...GRIS, stock_status: estat }]));
    expect(botonsDelCabas(container)[0].disabled).toBe(true);
  });

  test.each(['', 'Disponible', 'Últimes unitats', null])('«%s» no és esgotat: cap estat inventat', (estat) => {
    const { container } = pinta(samarreta([{ ...GRIS, stock_status: estat }]));
    expect(botonsDelCabas(container)[0].disabled).toBe(false);
    expect(container.textContent).not.toContain('Esgotat');
  });
});

describe('el botó: cap compra nova', () => {
  test('sense acció declarada, el botó no fa res (com abans) i no peta', () => {
    const { container } = pinta(samarreta([GRIS]));
    expect(() => fireEvent.click(botonsDelCabas(container)[0])).not.toThrow();
  });

  test('amb onAfegeixAlCabas (opcional), rep el producte i la variant triada per l’id estable', () => {
    const onAfegeixAlCabas = vi.fn();
    const { container } = pinta(samarreta([GRIS, { ...VERDA, stock_status: '' }]), { onAfegeixAlCabas });
    fireEvent.click(within(container).getByRole('radio', { name: 'Edició Verda' }));
    fireEvent.click(botonsDelCabas(container)[0]);
    expect(onAfegeixAlCabas).toHaveBeenCalledTimes(1);
    expect(onAfegeixAlCabas).toHaveBeenCalledWith({ productId: 'samarreta', variantId: 'verda-pi', quantitat: 1 });
  });

  test('una variació de llegat (sense id, o amb el d’una altra) es pot triar, però l’acció no rep cap id inventat', () => {
    const onAfegeixAlCabas = vi.fn();
    const { container } = pinta(samarreta([GRIS, { ...GRIS, name: 'Còpia' }, 'Blanca']), { onAfegeixAlCabas });
    expect(radios(container).map((radio) => radio.labels[0].textContent)).toEqual(['Edició Gris Plom', 'Còpia', 'Blanca']);
    fireEvent.click(within(container).getByRole('radio', { name: 'Còpia' }));
    expect(triat(container).labels[0].textContent).toBe('Còpia');
    fireEvent.click(botonsDelCabas(container)[0]);
    fireEvent.click(within(container).getByRole('radio', { name: 'Blanca' }));
    fireEvent.click(botonsDelCabas(container)[0]);
    expect(onAfegeixAlCabas.mock.calls.map(([crida]) => crida.variantId)).toEqual([null, null]);
  });
});

describe('la foto de la variant: sdp-media:// pel port, abans del filtre; mai crua', () => {
  test('amb el port, la URL que en torna (del nostre Storage) es pinta; la referència opaca, mai', async () => {
    permetOrigenMitjans(STORAGE);
    mocks.mitjans = true;
    mocks.resol.mockResolvedValue(FOTO_DEL_PORT);
    const { container } = pinta(samarreta([{ ...GRIS, image: ` SDP-MEDIA://mitjans/poble/u/mercat/verda.webp ` }]));
    await waitFor(() => expect(fotoActiva(container)).toBe(FOTO_DEL_PORT));
    // Al port, la forma canònica.
    expect(mocks.resol.mock.calls[0][0]).toBe(SDP_MEDIA);
    expect(fonts(container).some((font) => /sdp-media:/i.test(font))).toBe(false);
  });

  test('una URL del port de fora del nostre Storage, o encara opaca, no es pinta', async () => {
    permetOrigenMitjans(STORAGE);
    mocks.mitjans = true;
    /* La primera tornada és el control: amb la mateixa espera, la bona sí que
       es pinta (l'espera basta perquè el port haja contestat). */
    const casos = [[FOTO_DEL_PORT, FOTO_DEL_PORT], ['https://rastreig.example/p.gif', null], [SDP_MEDIA, null], ['', null]];
    for (const [tornada, esperada] of casos) {
      mocks.resol.mockResolvedValue(tornada);
      const { container } = pinta(samarreta([{ ...GRIS, image: SDP_MEDIA }]));
      await act(async () => { await new Promise((resol) => { setTimeout(resol, 0); }); });
      expect(mocks.resol, tornada).toHaveBeenCalledTimes(1);
      expect(fotoActiva(container), tornada).toBe(esperada);
      expect(fonts(container), tornada).toEqual(esperada ? [esperada] : []);
      cleanup();
      mocks.resol.mockClear();
    }
  });

  /* Correcció F5 de la revisió · Una publicació la llig tothom: només una
     foto del bucket PÚBLIC amb el camí net (fotoDelBucketPublic) es demana al
     port. La del bucket privat del venedor, o un camí amb '..', mai: la
     variant es pinta sense foto. */
  test.each([
    ['del bucket privat', 'sdp-media://mitjans_privats/poble/u/mercat/verda.webp'],
    ['amb un camí que puja', 'sdp-media://mitjans/../mitjans_privats/poble/u/mercat/verda.webp'],
  ])('una referència %s no es demana al port ni es pinta', async (_cas, image) => {
    permetOrigenMitjans(STORAGE);
    mocks.mitjans = true;
    mocks.resol.mockResolvedValue(FOTO_DEL_PORT);
    const { container } = pinta(samarreta([{ ...GRIS, image }]));
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 0); }); });
    expect(mocks.resol).not.toHaveBeenCalled();
    expect(container.querySelector('.sdp-compra__foto')).toBeNull();
  });

  test('sense la capacitat de mitjans, cap petició i cap foto', () => {
    const { container } = pinta(samarreta([{ ...GRIS, image: SDP_MEDIA }]));
    expect(fotoActiva(container)).toBeNull();
    expect(mocks.resol).not.toHaveBeenCalled();
  });

  test('una foto directa no passa pel port', () => {
    mocks.mitjans = true;
    const { container } = pinta(samarreta([GRIS]));
    expect(fotoActiva(container)).toBe('/assets/mercat/gris.png');
    expect(mocks.resol).not.toHaveBeenCalled();
  });
});
