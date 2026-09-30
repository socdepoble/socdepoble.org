/**
 * T71 · La fitxa d'una connexió al llistat del Bloc: compacta, de lectura,
 * amb el títol, l'autor i la imatge de l'ORIGINAL. Mai el Foraster, els
 * textos de llavor, la targeta viva de l'editor ni la ploma.
 */
import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mur: null, core: null, media: { status: 'ready', mediaItems: [] }, t: (_, alternativa) => alternativa
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
import { ConnexioFitxa } from './ConnexioFitxa.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { EMOTICONA_PER_DEFECTE } from '../../utils/emoji.js';

const ANIMA_IMATGE = '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp';
const SAMARRETA = { id: 'samarreta-socdepoble', title: 'Samarreta', image_url: '/assets/x.png', author_name: 'Forn de la Torre' };

/* L'element del model de vista tal com el fa NotesSection (kind 'connexio', sense icon).
   Revisió de D4 (260930) · Ara el títol de la NOTA mana a la fitxa (és el
   que la persona ha pogut reanomenar). Abans la nota d'esta fixture duia
   'Títol de l’URL' i la fitxa l'havia d'ignorar; ara la nota ve sense títol,
   de manera que estes proves continuen provant la caiguda a l'original i que
   el títol de l'URL que recorda l'origen (origen.titol) no ix mai si
   l'original es resol. El títol propi té la seua prova (més avall). */
const fitxa = (origen, nota = {}) => ({
  id: 'c1', kind: 'connexio', title: 'Títol de l’URL', excerpt: 'Element connectat des de Sóc de Poble.',
  categoryIds: ['f-connectats'], icon: undefined, image: '',
  data: { id: 'c1', title: '', content: '<p>Element connectat des de Sóc de Poble.</p>', createdAt: '2026-09-20T10:00:00.000Z', origen, ...nota }
});
const ORIGEN_ANIMA = { tipus: 'connexio', sectionId: '', itemId: '/ia', ruta: '/ia', objecte: 'pagina', titol: 'Títol de l’URL', autorNom: 'Foraster' };

afterEach(cleanup);
beforeEach(() => {
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [SAMARRETA] };
  mocks.core = { status: 'ready', towns: [] };
});

function senseEdicio(container) {
  expect(container.textContent).not.toContain('Foraster');
  for (const llavor of Object.values(TEXTOS_LLAVOR)) expect(container.textContent).not.toContain(llavor);
  expect(container.textContent).not.toContain(EMOTICONA_PER_DEFECTE);
  expect(container.querySelector('.sdp-targeta-viva-carta, .sdp-nota-fitxa-viva')).toBeNull();
  expect(container.querySelector('input, textarea, [contenteditable]')).toBeNull();
}

test('connexió a /ia, activa: el títol, l’autor, el subtítol i la foto de l’Ànima de la IAIA, amb aria-current', async () => {
  const onSelect = vi.fn();
  const { container } = render(<ConnexioFitxa item={fitxa(ORIGEN_ANIMA)} active onSelect={onSelect} />);
  const boto = container.querySelector('button.sdp-gestor-fitxa');
  expect(boto.getAttribute('aria-current')).toBe('true');
  expect(boto.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe("L'Ànima de la IAIA");
  expect(boto.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe(`De Sóc de Poble · ${PAGE_COPY.anima.subtitle}`);
  await waitFor(() => expect(boto.querySelector('img.sdp-gestor-fitxa__imatge').getAttribute('src')).toBe(ANIMA_IMATGE));
  // La data de lectura de l'original (§10), no la de la connexió.
  const data = dataHoraDeBarra({ creat: PAGE_COPY.anima.date });
  expect(boto.querySelector('time.sdp-nota-fitxa__data').textContent).toBe(data.date);
  expect(boto.querySelector('time.sdp-nota-fitxa__data').getAttribute('datetime')).toBe(data.dateTime);
  expect(container.textContent).not.toContain('Títol de l’URL');
  expect(container.textContent).not.toContain('Element connectat');
  senseEdicio(container);
  fireEvent.click(boto);
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test('inactiva: la mateixa fitxa, sense aria-current', () => {
  const { container } = render(<ConnexioFitxa item={fitxa(ORIGEN_ANIMA)} active={false} onSelect={() => {}} />);
  expect(container.querySelector('button.sdp-gestor-fitxa').hasAttribute('aria-current')).toBe(false);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe("L'Ànima de la IAIA");
  senseEdicio(container);
});

test('connexió al Mercat: la foto, el títol i qui signa l’article, no qui mira', async () => {
  const origen = { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Una altra cosa', autorNom: 'Foraster', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte' };
  const { container } = render(<ConnexioFitxa item={fitxa(origen)} active onSelect={() => {}} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Samarreta');
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toMatch(/^De Forn de la Torre/);
  await waitFor(() => expect(container.querySelector('img.sdp-gestor-fitxa__imatge').getAttribute('src')).toBe('/assets/x.png'));
  senseEdicio(container);
});

test('sense l’original (un perfil): el títol desat i el perfil que el signa; la data, la de la connexió', () => {
  const origen = { tipus: 'connexio', sectionId: 'perfil', itemId: 'u1', titol: 'Pepa Soler', ruta: '/gent/u1', objecte: 'persona' };
  const { container } = render(<ConnexioFitxa item={fitxa(origen)} active onSelect={() => {}} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Pepa Soler');
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('De Pepa Soler');
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('time').textContent).toBe(dataHoraDeBarra({ creat: '2026-09-20T10:00:00.000Z' }).date);
  senseEdicio(container);
});

/* Revisió de D4 (260930) · La connexió és editable: reanomenar-la o triar-li
   una emoticona es veu a la fitxa, i l'autoria i la foto continuen sent les
   de l'original. */
test('D4 · el títol i l’emoticona de la nota manen; l’autoria, el subtítol i la foto són de l’original', async () => {
  const origen = { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte' };
  const { container } = render(<ConnexioFitxa item={fitxa(origen, { title: '<p>Regal per a la iaia</p>', icon: '🎁' })} active onSelect={() => {}} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Regal per a la iaia');
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toMatch(/^De Forn de la Torre/);
  expect(container.textContent).not.toContain('Samarreta');
  // Amb la foto de l'original, la foto; si falla, l'emoticona triada fa de glif.
  await waitFor(() => expect(container.querySelector('img.sdp-gestor-fitxa__imatge').getAttribute('src')).toBe('/assets/x.png'));
  fireEvent.error(container.querySelector('img.sdp-gestor-fitxa__imatge'));
  expect(container.querySelector('.sdp-gestor-fitxa__media').textContent).toBe('🎁');
  senseEdicio(container);
  cleanup();
  // Sense foto (un original que no es resol), l'emoticona triada és el glif de la fitxa.
  const perfil = { tipus: 'connexio', sectionId: 'perfil', itemId: 'u1', titol: 'Pepa Soler', ruta: '/gent/u1', objecte: 'persona' };
  const { container: senseFoto } = render(<ConnexioFitxa item={fitxa(perfil, { title: 'La Pepa', icon: '🌻' })} active onSelect={() => {}} />);
  expect(senseFoto.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('La Pepa');
  expect(senseFoto.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('De Pepa Soler');
  expect(senseFoto.querySelector('.sdp-gestor-fitxa__media').textContent).toBe('🌻');
});

test('sense l’original ni autor conegut: QUÈ és, mai «Sóc de Poble» ni el Foraster per defecte', () => {
  const origen = { tipus: 'connexio', sectionId: '', itemId: '/wikidepoble?item=x', ruta: '/wikidepoble?item=x', objecte: 'pagina', titol: 'Fitxa de la Wiki' };
  const { container } = render(<ConnexioFitxa item={fitxa(origen, { title: '' })} active onSelect={() => {}} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Fitxa de la Wiki');
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Pàgina');
  expect(container.textContent).not.toContain('Sóc de Poble');
  senseEdicio(container);
});
