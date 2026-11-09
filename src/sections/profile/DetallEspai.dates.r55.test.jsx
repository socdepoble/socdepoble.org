import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pep' } }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import { DetallAdministracio, DetallAplicacio } from './DetallEspai.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { itemsDAdministracioSistema } from './perfilModel.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { PAGE_COPY } from '../text/pageContent.js';

const IDS_ADMIN = ['admin-taxonomia', 'admin-importacio', 'admin-crom', 'admin-vistes-columnes', 'admin-nodes-fedivers', 'admin-empaquetats'];
const datesApps = [
  ['gestoria', ['00:15', '04/10/26'], '2026-10'],
  ['rebost', ['00:15', '04/10/26'], '2026-10'],
  ['salut', ['00:15', '04/10/26'], '2026-10'],
  ['genealogia', ['00:15', '04/10/26'], '2026-10'],
  ['lector-rss', ['00:15', '04/10/26'], '2026-10'],
  ['tpv', ['00:15', '04/10/26'], '2026-10'],
  ['snippet', ['03/10/26'], '2026-10'],
  ['metriques', ['00:00', '08/09/26'], '2026-09'],
  ['cervell', ['00:00', '09/09/26'], '2026-09'],
];
const pill = container => container.querySelector('section.bar-orange .btn-date-time');
const textParts = element => [...element.querySelectorAll('span')].map(x => x.textContent);
function expectAuth(container) {
  const author = container.querySelector('section.bar-orange .sp-card-author');
  expect(author.getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
  expect(author.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(author.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  expect(author.querySelector('img').getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
}
beforeEach(() => {
  mocks.navigate.mockClear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2032-05-17T10:11:12Z'));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('R55 · dates de les fitxes locals amb UniversalPage real', () => {
  test.each(datesApps)('%s reutilitza la font canònica i navega al seu mes', (id, expected, month) => {
    const app = aplicacionsValides(APLICACIONS).find(x => x.id === id);
    const { container } = render(<DetallAplicacio aplicacio={app} />);
    expectAuth(container);
    expect(pill(container)).not.toBeNull();
    expect(textParts(pill(container))).toEqual(expected);
    expect(pill(container).getAttribute('aria-label')).toContain('calendari');
    fireEvent.click(pill(container));
    expect(mocks.navigate).toHaveBeenCalledWith(`/calendari?mes=${month}`);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    if (app.panell === null) expect(container.querySelector('.perfil-aplicacio-panell')).toBeNull();
  });

  test.each(IDS_ADMIN)('%s conserva títol/lead sense H2 nou i usa creació Git', id => {
    const item = itemsDAdministracioSistema().find(x => x.id === id);
    const { container } = render(<DetallAdministracio item={item}><h3>Cos de prova</h3></DetallAdministracio>);
    expectAuth(container);
    expect(container.querySelector('h1').textContent).toBe(item.title);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('.page-intro h2')).toBeNull();
    expect(container.querySelector('.hero-image img')).toBeNull();
    expect(container.querySelector('.page-intro .lead').textContent).toBe(item.subtitle);
    expect(textParts(pill(container))).toEqual(['16:40', '05/11/26']);
    expect(pill(container).getAttribute('aria-label')).not.toMatch(/publicad|publicaci/i);
    fireEvent.click(pill(container));
    expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-11');
  });

  test('el rellotge de muntatge no canvia la data Git de lectura', () => {
    const item = itemsDAdministracioSistema().find(x => x.id === 'admin-taxonomia');
    const first = render(<DetallAdministracio item={item} />);
    expect(textParts(pill(first.container))).toEqual(['16:40', '05/11/26']);
    first.unmount();
    vi.setSystemTime(new Date('2041-01-01T00:00:00Z'));
    const second = render(<DetallAdministracio item={item} />);
    expect(textParts(pill(second.container))).toEqual(['16:40', '05/11/26']);
  });

  test('una entrada nova amb entradilla separa subtítol/lead i conserva la data explícita', () => {
    const item = { id:'admin-botigues-prova', title:'Seguiment', subtitle:'Canals i verificadors', entradilla:'Una instantània amb procedència.', creat:'2026-11-08T03:26:00+01:00' };
    const { container } = render(<DetallAdministracio item={item}><h3>Detalls</h3></DetallAdministracio>);
    expect(container.querySelector('h1').textContent).toBe(item.title);
    expect(container.querySelector('.page-intro h2')?.textContent).toBe(item.subtitle);
    expect(container.querySelector('.page-intro .lead').textContent).toBe(item.entradilla);
    expect(textParts(pill(container))).toEqual(['03:26', '08/11/26']);
  });

  test('entradilla buida no altera l’anatomia antiga', () => {
    const item = { id:'admin-taxonomia', title:'Títol', subtitle:'Lead antic', entradilla:'   ' };
    const { container } = render(<DetallAdministracio item={item} />);
    expect(container.querySelector('.page-intro h2')).toBeNull();
    expect(container.querySelector('.page-intro .lead').textContent).toBe('Lead antic');
  });

  test('la card nova passa la portada una sola vegada, alt exacte i data de dia sense hora', () => {
    const item = { id:'admin-botigues-prova', title:'Botigues', subtitle:'Canals', entradilla:'Snapshot declarat.', creat:'2026-11-08', image:PAGE_COPY.descarregues.image, imageAlt:PAGE_COPY.descarregues.imageAlt };
    const { container } = render(<DetallAdministracio item={item}><h3>Detalls</h3></DetallAdministracio>);
    const images = [...container.querySelectorAll('img')].filter(img => img.getAttribute('src') === item.image);
    expect(item.image).toBeTruthy();
    expect(item.imageAlt).toBeTruthy();
    expect(images).toHaveLength(1);
    expect(images[0].closest('.hero-image')).not.toBeNull();
    expect(images[0].getAttribute('alt')).toBe(item.imageAlt);
    expect(container.querySelector('.page-intro h2').textContent).toBe(item.subtitle);
    expect(container.querySelector('.page-intro .lead').textContent).toBe(item.entradilla);
    expect(textParts(pill(container))).toEqual(['08/11/26']);
  });

  test('una administració desconeguda i sense font no rep hui', () => {
    const { container } = render(<DetallAdministracio item={{ id:'admin-fora', title:'Sense font' }} />);
    expectAuth(container);
    expect(pill(container)).toBeNull();
  });

  test.each(['gestoria', 'snippet', 'metriques', 'fora'])('una app federada amb id %s no hereta la data local', id => {
    const [app] = aplicacionsValides([{ id, nom:'Utilitat independent', panell:null }]);
    const { container } = render(<DetallAplicacio aplicacio={app} />);
    expect(pill(container)).toBeNull();
  });

  test('una app federada conserva la seua data explícita de dia i ruta', () => {
    const [app] = aplicacionsValides([{ id:'gestoria', nom:'Gestoria d’un altre node', creat:'2025-02-03', estat:'connectada', ruta:'/gestoria' }]);
    const { container } = render(<DetallAplicacio aplicacio={app} />);
    expect(textParts(pill(container))).toEqual(['03/02/25']);
    expect(app).toMatchObject({ estat:'connectada', ruta:'/gestoria', panell:'gestoria' });
  });
});
