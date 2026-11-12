import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { LLIBRES_ARBRES_MONUMENTALS, modelLlibresArbres } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import * as importacio from '../../data/importacio/paginesTrilogiaIMoliEditorial.js';
import { carregaFitxesCanoniques } from '../../data/fitxesCanoniquesCataleg.js';
import { textosArbresWorkspace } from './textosArbresWorkspace.js';
import NaturaPatrimoniWorkspaceSection from './NaturaPatrimoniWorkspaceSection.jsx';

const ui = vi.hoisted(() => ({ language: 'ca', rows: [] }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(),
  useUIActions: () => ({ language: ui.language, t: (_clau, reserva) => reserva }),
  useUIActionsOpcional: () => ({ language: ui.language, t: (_clau, reserva) => reserva }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO() {} }));
vi.mock('../../components/universal/workspace/ProjeccionsCatalegContext.js', () => ({
  useProjeccionsCatalegContext: () => ({ projeccions: ui.rows, ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5',
    autoritzat: false, persistent: true, error: null, desa: async () => {} })
}));
vi.mock('./FitxaArbreMonumental.jsx', () => ({ default: ({ arbre, fontDoctoral, onTanca, etiquetaTornada, amagaTitol }) =>
  <article>{!amagaTitol && <header className="page-title"><h1>{arbre.nom}</h1></header>}<p>{fontDoctoral?.titol}</p><button onClick={onTanca}>{etiquetaTornada}</button></article> }));

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); ui.language = 'ca'; ui.rows = []; });

const paginaGeneral = { title: 'Presentació multipoble de prova', html: '<p>Una llibreria per als pobles.</p>' };
const primer = ARBRES_MONUMENTALS_2020[0];
function Ruta() {
  const { pathname, search } = useLocation();
  return <output data-testid="ruta">{pathname}{search ? `?${search}` : ''}</output>;
}
function munta({ ruta = '/page/arbres-monumentals', llibres } = {}) {
  return render(<MemoryRouter rutaInicial={ruta}>
    <NaturaPatrimoniWorkspaceSection page={paginaGeneral} llibres={llibres} />
    <Ruta />
  </MemoryRouter>);
}
const llista = container => within(container.querySelector('#app-grid-list'));
const triaLlibre = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${LLIBRES_ARBRES_MONUMENTALS[0].etiquetaNavegacio}`) }));

describe('R18 · Llibreria, exemplars i portada original dins del Workspace', () => {
  test('l’arrel mostra la presentació i espera un llibre abans de carregar WordPress o els 19 exemplars', () => {
    const carrega = vi.spyOn(importacio, 'carregaPortadaImportadaPublica');
    const { container } = munta();
    expect(screen.getByRole('heading', { name: paginaGeneral.title })).toBeTruthy();
    expect(container.querySelector('#app-grid-sidebar')).toBeTruthy();
    expect(container.querySelector('#app-grid-list')).toBeTruthy();
    expect(container.querySelector('.sdp-workspace-detail')).toBeTruthy();
    expect(llista(container).queryByRole('heading', { name: `#1 · ${primer.nom}` })).toBeNull();
    expect(carrega).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: new RegExp(`^${LLIBRES_ARBRES_MONUMENTALS[0].etiquetaNavegacio}`) })).toBeTruthy();
  });

  test('triar La Torre obri la pàgina original WP #619 i el llistat dels 19 exemplars', async () => {
    const carrega = vi.spyOn(importacio, 'carregaPortadaImportadaPublica');
    const { container } = munta();
    triaLlibre();
    await screen.findByRole('heading', { name: 'Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes', level: 1 }, { timeout: 5000 });
    expect(carrega).toHaveBeenCalledWith(619, { signal: expect.any(AbortSignal) });
    const capcaleres = [...container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')];
    expect(capcaleres).toHaveLength(19);
    expect(capcaleres[0].querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(`#1 · ${ARBRES_MONUMENTALS_2020[0].nom}`);
    for (const arbre of ARBRES_MONUMENTALS_2020) {
      expect(llista(container).getByRole('button', { name: `#${arbre.ordre} · ${arbre.nom}`, exact: true })).toBeTruthy();
    }
    const body = container.querySelector('.cms-preview');
    expect(body.textContent).toContain('Font original:');
    expect(body.textContent).toContain('WP #619');
    expect(body.innerHTML).not.toMatch(/<iframe|<script|data:image|onerror=/i);
    for (const img of body.querySelectorAll('img')) expect(img.getAttribute('src')).toContain('/assets/importacio-wp/');
    expect(screen.queryByRole('heading', { name: paginaGeneral.title })).toBeNull();
  });

  test('la fitxa torna a la portada del llibre i «Tots els arbres» torna a la presentació', async () => {
    const { container } = munta();
    triaLlibre();
    await screen.findByText(/WP #619/, {}, { timeout: 5000 });
    fireEvent.click(llista(container).getByRole('button', { name: `#1 · ${primer.nom}` }));
    expect(screen.getByRole('heading', { name: `#1 · ${primer.nom}`, level: 1 })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByText(/WP #619/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Torna a la portada del llibre' }));
    await screen.findByText(/WP #619/, {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /^Tots els arbres/ }));
    expect(screen.getByRole('heading', { name: paginaGeneral.title })).toBeTruthy();
    expect(llista(container).queryByRole('heading', { name: `#1 · ${primer.nom}` })).toBeNull();
  });

  test('un enllaç a un exemplar obri el seu llibre i «Tots els arbres» retira llibre i fitxa de la ruta', async () => {
    munta({ ruta: `/page/arbres-monumentals?llibre=arbres&fitxa=${primer.id}&conserva=1` });
    await screen.findByRole('heading', { name: `#1 · ${primer.nom}`, level: 1 });
    fireEvent.click(screen.getByRole('button', { name: /^Tots els arbres/ }));
    expect(screen.getByRole('heading', { name: paginaGeneral.title })).toBeTruthy();
    expect(screen.getByTestId('ruta').textContent).toBe('/page/arbres-monumentals?conserva=1');
  });

  test('afegir un segon poble només requerix injectar el seu paquet de dades', async () => {
    const segon = {
      id: 'poble-de-prova', titol: 'Llibre del poble de prova', poble: 'Poble de prova',
      portada: { pagina: { title: 'Portada del poble de prova', html: '<p>Document del segon llibre.</p>' } },
      fontDoctoral: { ...LLIBRES_ARBRES_MONUMENTALS[0].fontDoctoral,
        id: 'font-del-poble-de-prova', titol: 'Font del poble de prova' },
      exemplars: [{ ...primer, nom: 'Exemplar del segon llibre' }]
    };
    const { container } = munta({ llibres: [...LLIBRES_ARBRES_MONUMENTALS, segon] });
    fireEvent.click(screen.getByRole('button', { name: /^Llibre del poble de prova/ }));
    expect(screen.getByRole('heading', { name: 'Portada del poble de prova', level: 1 })).toBeTruthy();
    expect([...container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')]).toHaveLength(1);
    expect(llista(container).queryByRole('heading', { name: `#1 · ${primer.nom}` })).toBeNull();
    fireEvent.click(llista(container).getByRole('button', { name: '#1 · Exemplar del segon llibre' }));
    expect(screen.getByRole('heading', { name: '#1 · Exemplar del segon llibre', level: 1 })).toBeTruthy();
    expect(screen.getByText('Font del poble de prova')).toBeTruthy();
  });

  test.each([
    ['un id antic ambigu', '', false],
    ['un id antic amb llibre explícit', 'llibre=poble-de-prova&', true],
    ['un id amb el seu espai de noms', '', true]
  ])('%s manté separades les identitats de dos pobles', async (cas, prefix, resolt) => {
    const segon = { ...LLIBRES_ARBRES_MONUMENTALS[0], id: 'poble-de-prova', titol: 'Llibre del poble de prova',
      poble: 'Poble de prova', portada: { pagina: { title: 'Portada del poble de prova', html: '<p>Segon poble.</p>' } },
      fontDoctoral: { ...LLIBRES_ARBRES_MONUMENTALS[0].fontDoctoral, id: 'font-del-poble-de-prova' },
      exemplars: [{ ...primer, nom: 'Exemplar del segon llibre' }] };
    const id = cas === 'un id amb el seu espai de noms' ? `poble-de-prova:${primer.id}` : primer.id;
    munta({ ruta: `/page/arbres-monumentals?${prefix}fitxa=${encodeURIComponent(id)}`,
      llibres: [...LLIBRES_ARBRES_MONUMENTALS, segon] });
    if (resolt) {
      expect(await screen.findByRole('heading', { name: '#1 · Exemplar del segon llibre', level: 1 })).toBeTruthy();
    } else {
      expect(screen.getByRole('heading', { name: paginaGeneral.title, level: 1 })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: `#1 · ${primer.nom}`, level: 1 })).toBeNull();
    }
  });

  test('un muntatge retirat avorta la lectura pendent de la portada', async () => {
    const carrega = vi.spyOn(importacio, 'carregaPortadaImportadaPublica').mockImplementation(() => new Promise(() => {}));
    const view = munta();
    triaLlibre();
    await waitFor(() => expect(carrega).toHaveBeenCalledTimes(1));
    const signal = carrega.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  test('l’error de portada té reintent i conserva el llibre', async () => {
    const carrega = vi.spyOn(importacio, 'carregaPortadaImportadaPublica').mockRejectedValueOnce(new Error('fallada de prova'));
    munta();
    triaLlibre();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText(/WP #619/, {}, { timeout: 5000 });
    expect(carrega).toHaveBeenCalledTimes(2);
  });

  test('la referència publicada de WP #619 reutilitza la portada i altres originals conserven el seu enllaç', async () => {
    const canoniques = await carregaFitxesCanoniques('importacio-wp', 'ca');
    expect(canoniques.has('619')).toBe(true);
    expect(canoniques.has('2002')).toBe(true);
    ui.rows = ['619', '2002'].map(id => ({ id: `prova-${id}`, ownerUserId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5',
      sectionId: 'mur', title: `Text de fila ${id}`,
      projeccioCataleg: { v: 1, font: 'importacio-wp', id, destins: ['arbres-monumentals'], audiencia: 'publica' } }));
    const { container } = munta();
    fireEvent.click(screen.getByRole('button', { name: /Referències publicades/ }));
    expect([...container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')]).toHaveLength(1);
    fireEvent.click(llista(container).getByRole('button', { name: canoniques.get('2002').title }));
    expect(screen.getByRole('link', { name: 'Obri la fitxa original' }).getAttribute('href')).toBe('/mur/2002');
    expect(container.textContent).not.toContain('Text de fila');
  });

  test.each([280, 380, 520, 960])('a %i px la portada s’obri en el mateix Workspace', async ample => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(ample);
    const { container } = munta();
    triaLlibre();
    await screen.findByRole('heading', { name: 'Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes', level: 1 }, { timeout: 5000 });
    expect(container.querySelectorAll('.sdp-workspace--universal')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  test.each([['herbari', '/page/herbari'], ['rutes', '/page/rutes-de-poble']])(
    'l’enllaç de llibre %s d’R17 continua arribant a la seua pàgina', async (llibre, desti) => {
      munta({ ruta: `/page/arbres-monumentals?llibre=${llibre}` });
      await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe(desti));
    });

  test.each(['ca', 'es', 'en', 'gl', 'eu'])('els controls de la llibreria són localitzats en %s', language => {
    ui.language = language;
    const textos = textosArbresWorkspace(language);
    expect(modelLlibresArbres(LLIBRES_ARBRES_MONUMENTALS, textos).items[0].lang).toBe(language);
    munta();
    expect(screen.getByRole('button', { name: new RegExp(textos.tots) })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: textos.exemplars })).toBeTruthy();
  });
});

test('la projecció de dades manté els exemplars originals i rebutja identificadors ambigus', () => {
  const model = modelLlibresArbres(LLIBRES_ARBRES_MONUMENTALS, textosArbresWorkspace());
  expect(model.categories).toHaveLength(5);
  expect(model.categories[0].count).toBe(19);
  expect(model.items).toHaveLength(20);
  expect(model.items[0].fontImportada).toEqual({ font: 'importacio-wp', id: '619' });
  expect(model.items[1].arbre).toBe(ARBRES_MONUMENTALS_2020[0]);
  expect(() => modelLlibresArbres([...LLIBRES_ARBRES_MONUMENTALS, LLIBRES_ARBRES_MONUMENTALS[0]], textosArbresWorkspace())).toThrow(TypeError);
});


test('P115 · portada i cadascuna de les 19 fitxes mantenen autoria i drets del llibre', async () => {
  const { container } = munta();
  triaLlibre();
  await screen.findByText(/WP #619/, {}, { timeout: 5000 });
  const detall = container.querySelector('#app-grid-main');
  const autoriaCorrecta = () => {
    expect(detall.textContent).toContain('Associació El Rentonar');
    expect(detall.textContent).toContain('Pedro Ferrer');
    expect(detall.querySelector('a[href="/rentonar"]')).toBeTruthy();
    expect(detall.textContent).not.toContain('Fet per la IAIA i Nano Banana');
  };
  autoriaCorrecta();
  for (const arbre of ARBRES_MONUMENTALS_2020) {
    fireEvent.click(llista(container).getByRole('button', { name: `#${arbre.ordre} · ${arbre.nom}`, exact: true }));
    expect(within(detall).getByRole('heading', { name: `#${arbre.ordre} · ${arbre.nom}`, level: 1 })).toBeTruthy();
    autoriaCorrecta();
  }
});

test('P116 · carpeta nativa desplega quatre filtres reals i un únic CTA porta al banc existent', async () => {
  const { container } = munta();
  expect(screen.getByRole('complementary', { name: 'Catàlegs' })).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Arbres' })).toBeTruthy();
  expect(screen.queryByLabelText('Pàgina de destinació')).toBeNull();
  const book = screen.getByRole('button', { name: new RegExp(`^${LLIBRES_ARBRES_MONUMENTALS[0].etiquetaNavegacio}`) });
  expect(book.getAttribute('aria-expanded')).toBe('false');
  triaLlibre();
  await screen.findByText(/WP #619/, {}, { timeout: 5000 });
  expect(book.getAttribute('aria-expanded')).toBe('true');
  for (const [nom, predicat] of [
    ['Monumentals (Llei 4/2006)', arbre => arbre.monumental === true],
    ['Emblemàtics d’Interés Local', arbre => arbre.monumental === false],
    ['Accés lliure públic', arbre => arbre.accesLliure === true],
    ['Seguiment fotogràfic 2020', arbre => Boolean(arbre.fotos?.foto2020)]
  ]) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(nom.replace(/[()]/g, '\\$&')) }));
    const visibles = [...container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')];
    expect(visibles).toHaveLength(ARBRES_MONUMENTALS_2020.filter(predicat).length);
    for (const arbre of ARBRES_MONUMENTALS_2020.filter(predicat)) expect(llista(container).getByRole('button', { name: `#${arbre.ordre} · ${arbre.nom}`, exact: true })).toBeTruthy();
  }
  expect(screen.getAllByRole('button', { name: '+ Afegir catàleg', exact: true })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '+ Afegir catàleg', exact: true }));
  expect(screen.getByTestId('ruta').textContent).toBe('/el-meu-perfil?vista=admin-importacio');
});


test('les categories generades no poden col·lidir amb el paquet d’un altre poble', () => {
  const primerLlibre = LLIBRES_ARBRES_MONUMENTALS[0];
  const segon = { ...primerLlibre, id: `${primerLlibre.id}:monumentals` };
  expect(() => modelLlibresArbres([primerLlibre, segon], textosArbresWorkspace())).toThrow(TypeError);
});

test('un segon llibre amb autoria explícita conserva la seua signatura també en la portada injectada', () => {
  const segon = {
    id: 'llibre-segon', titol: 'Catàleg del segon poble', poble: 'Poble de prova',
    autoria: { nom: 'Entitat de prova', poble: 'Poble de prova', ruta: '/entitat-de-prova', drets: 'Drets de prova' },
    fontDoctoral: { ...LLIBRES_ARBRES_MONUMENTALS[0].fontDoctoral, id: 'font-segon-poble-prova', municipi: 'Poble de prova', entitatPromotora: 'Entitat de prova', autoriaTecnica: 'Autor de prova', llicencia: 'Drets de prova' },
    portada: { pagina: { title: 'Portada injectada', html: '<p>Font de prova.</p>' } },
    exemplars: [{ ...primer, nom: 'Arbre de prova' }]
  };
  munta({ llibres: [segon], ruta: '/page/arbres-monumentals?llibre=llibre-segon' });
  expect(screen.getByRole('heading', { name: 'Portada injectada', level: 1 })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Drets de prova' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Entitat de prova/ }).getAttribute('href')).toBe('/entitat-de-prova');
  expect(document.querySelector('#app-grid-main').textContent).not.toContain('Sóc de Poble');
});


test('P116 · el comptador de l’arrel suma identitats de font i els enllaços de portada continuen obrint WP619', async () => {
  const base = LLIBRES_ARBRES_MONUMENTALS[0];
  const segon = { ...base, id: 'segon-poble', fontDoctoral: { ...base.fontDoctoral, id: 'font-segon-poble' }, exemplars: [primer] };
  const view = munta({ llibres: [base, segon] });
  expect(screen.getByRole('button', { name: 'Tots els arbres (20)', exact: true })).toBeTruthy();
  view.unmount();
  const { container } = munta({ ruta: `/page/arbres-monumentals?fitxa=portada-${base.id}` });
  await screen.findByText(/WP #619/, {}, { timeout: 5000 });
  expect(screen.getByRole('button', { name: 'Tots els arbres (19)', exact: true })).toBeTruthy();
  expect(container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(19);
});


test.each([undefined, {}, { id: '' }, { id: '   ' }, { id: 'MAJUSCULES' }, { id: 'font/incorrecta' }, { id: 'a'.repeat(129) }])('un llibre sense font explícita vàlida es rebutja abans de mostrar o exportar dades', fontDoctoral => {
  const llibre = { ...LLIBRES_ARBRES_MONUMENTALS[0], id: 'poble-sense-font', fontDoctoral };
  expect(() => modelLlibresArbres([llibre], textosArbresWorkspace())).toThrow(/font doctoral/);
});


test('P116 · tornar a clicar la carpeta activa reobri la portada i conserva el desplegament', async () => {
  const { container } = munta();
  triaLlibre();
  await screen.findByText(/WP #619/, {}, { timeout: 5000 });
  fireEvent.click(llista(container).getByRole('button', { name: `#1 · ${primer.nom}`, exact: true }));
  expect(screen.getByRole('heading', { name: `#1 · ${primer.nom}`, level: 1 })).toBeTruthy();
  triaLlibre();
  await screen.findByText(/WP #619/, {}, { timeout: 5000 });
  expect(screen.getByRole('button', { name: /^Catàleg d’Arbres Monumentals de La Torre de les Maçanes/ }).getAttribute('aria-expanded')).toBe('true');
});
