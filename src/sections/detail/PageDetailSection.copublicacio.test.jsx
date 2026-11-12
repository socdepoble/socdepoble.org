import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ slug: 'receptes', itemSlug: '', sessio: null, llig: vi.fn(), capacitat: true }));
vi.mock('../../app/contexts/RouterContext', () => ({
  Navigate: ({ to }) => <p>{to}</p>,
  useParams: () => ({ slug: m.slug, itemSlug: m.itemSlug })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pageCopy: {
    [m.slug]: { title: m.slug, html: '<p>Cos del document</p>', copyright: 'Autoria i llicència de l’obra' }
  } })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/UIContext', async original => ({
  ...(await original()),
  useUIActions: () => ({ t: (_clau, alternativa) => alternativa }),
  useUIActionsOpcional: () => null
}));
vi.mock('../../app/contexts/ProveidorProjeccionsCataleg.jsx', () => ({ default: ({ children }) => children }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: cap => cap === 'copublicacio' && m.capacitat,
  lligPublicadorsRegistrats: (...args) => m.llig(...args)
}));
vi.mock('../control/PublicarDeLaPagina.jsx', () => ({ PublicarDeLaPagina: () => null }));
vi.mock('./InstalaLaPwa.jsx', () => ({ InstalaLaPwa: () => null, useInstalacioDeLaPagina: () => null }));
vi.mock('../admin/PanellTraspasPublicacioInline.jsx', () => ({
  default: ({ recursTipusInicial, recursIdInicial, onRespostaAutoritativa }) => <>
    <p>{recursTipusInicial} / {recursIdInicial}</p>
    <button onClick={() => onRespostaAutoritativa({ recursTipus: 'llibre_cataleg', recursId: recursIdInicial })}>Desar un llibre</button>
    <button onClick={() => onRespostaAutoritativa({ recursTipus: recursTipusInicial, recursId: recursIdInicial })}>Desar la pàgina</button>
  </>
}));
vi.mock('../../components/universal/UniversalPage', async () => {
  const { BarraTaronja } = await import('../../components/universal/barres/BarraTaronja.jsx');
  return { UniversalPage: ({ children, copyright, topBarData }) => <>
    <BarraTaronja authorName="Publicació de reserva" {...topBarData} />
    <footer>{copyright}</footer>
    {children}
  </> };
});
async function visorText() {
  const { default: TextSection } = await import('../text/TextSection.jsx');
  return { default: ({ page, children, itemSlug }) => itemSlug ? <p>Fitxa {itemSlug}</p>
    : <TextSection page={page} pageKey={m.slug}>{children}</TextSection> };
}
vi.mock('../patrimoni/ReceptesWorkspaceSection.jsx', () => visorText());
vi.mock('../patrimoni/HerbariWorkspaceSection.jsx', () => visorText());
vi.mock('../patrimoni/BancLlavorsWorkspaceSection.jsx', () => visorText());
vi.mock('../patrimoni/NaturaPatrimoniWorkspaceSection.jsx', () => visorText());

import { SessionContext, UIContext } from '../../app/contexts/objectesDeContext.js';
import PageDetailSection from './PageDetailSection.jsx';

const ID = 'b0000000-0000-4000-8000-000000000001';
const CONFIG = { tenantId: 'b0000000-0000-4000-8000-000000000009', backendUrl: 'https://poble.invalid' };
const PUBLICADORS = [{ actor_id: ID, slug_ruta: `/perfil/${ID}?registre=organitzacio`, nom: 'Editora del catàleg', avatar_url: null,
  poble_nom: 'Muro', rol_publicacio: 'principal' }];
const component = (config = CONFIG) => <UIContext.Provider value={{ externalConfig: config }}>
  <SessionContext.Provider value={m.sessio}><PageDetailSection /></SessionContext.Provider>
</UIContext.Provider>;

beforeEach(() => {
  m.slug = 'receptes';
  m.itemSlug = '';
  m.sessio = null;
  m.capacitat = true;
  m.llig.mockReset().mockImplementation(async recurs => ({ ...recurs, versio: 1, publicadorsRegistrats: PUBLICADORS }));
});
afterEach(cleanup);

test.each(['receptes', 'arbres-monumentals', 'herbari', 'banc-de-llavors'])('la portada %s llig la publicació tipada i conserva els crèdits', async slug => {
  m.slug = slug;
  render(component());
  const enllac = await screen.findByRole('link', { name: /^Editora del catàleg/ });
  expect(enllac.getAttribute('href')).toBe(`/perfil/${ID}?registre=organitzacio`);
  expect(screen.getByText('Autoria i llicència de l’obra')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /configurar traspàs/i })).toBeNull();
  expect(m.llig).toHaveBeenCalledWith({ recursTipus: 'pagina', recursId: slug }, { ...CONFIG, signal: expect.any(AbortSignal) });
});

test('el panell reclama AAL2 i només un desat del mateix recurs rellegeix la portada', async () => {
  m.sessio = { currentUser: { id: 'admin' }, generacio: 1, esSuperadmin: true, nivell: 'aal1' };
  const { rerender } = render(component());
  await screen.findByRole('link', { name: /^Editora del catàleg/ });
  expect(screen.queryByRole('button', { name: /configurar traspàs/i })).toBeNull();
  m.sessio = { ...m.sessio, nivell: 'aal2' };
  rerender(component());
  fireEvent.click(screen.getByRole('button', { name: /configurar traspàs/i }));
  await screen.findByText('pagina / receptes');
  fireEvent.click(screen.getByRole('button', { name: 'Desar un llibre' }));
  expect(m.llig).toHaveBeenCalledOnce();
  m.llig.mockResolvedValueOnce({ recursTipus: 'pagina', recursId: 'receptes', versio: 2, publicadorsRegistrats: [] });
  fireEvent.click(screen.getByRole('button', { name: 'Desar la pàgina' }));
  expect((await screen.findByRole('link', { name: /^Sóc de Poble/ })).getAttribute('href')).toBe('/socdepoble');
  expect(screen.queryByRole('link', { name: /^Editora del catàleg/ })).toBeNull();
  expect(m.llig).toHaveBeenCalledTimes(2);
});

test('una resposta de la portada abandonada és descartada, i la fitxa conserva l’abast propi', async () => {
  let acaba;
  m.llig.mockImplementationOnce(recurs => new Promise(resolve => {
    acaba = () => resolve({ ...recurs, versio: 1, publicadorsRegistrats: PUBLICADORS });
  }));
  const { rerender } = render(component());
  await waitFor(() => expect(acaba).toBeTypeOf('function'));
  m.itemSlug = 'fitxa-sintetica';
  rerender(component());
  await screen.findByText('Fitxa fitxa-sintetica');
  expect(m.llig.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => acaba());
  expect(screen.queryByRole('link', { name: /^Editora del catàleg/ })).toBeNull();
  expect(m.llig).toHaveBeenCalledOnce();
});

test('sense capacitat es conserva la barra anterior i no hi ha cap lectura', async () => {
  m.capacitat = false;
  render(component());
  await screen.findByText('Publicació de reserva');
  expect(m.llig).not.toHaveBeenCalled();
});


test('dos pobles del mateix backend no compartixen la lectura pública ni les respostes tardanes', async () => {
  const altrePoble = { ...CONFIG, tenantId: 'b0000000-0000-4000-8000-000000000008' };
  let acabaPrimerPoble;
  m.llig.mockImplementationOnce(recurs => new Promise(resolve => {
    acabaPrimerPoble = () => resolve({ ...recurs, versio: 1, publicadorsRegistrats: PUBLICADORS });
  })).mockImplementationOnce(async recurs => ({
    ...recurs, versio: 2, publicadorsRegistrats: [{ ...PUBLICADORS[0], nom: 'Editora de l’altre poble' }]
  }));
  const { rerender } = render(component());
  await waitFor(() => expect(acabaPrimerPoble).toBeTypeOf('function'));
  rerender(component(altrePoble));
  await screen.findByRole('link', { name: /^Editora de l’altre poble/ });
  expect(m.llig.mock.calls[0][1].signal.aborted).toBe(true);
  expect(m.llig.mock.calls[1][1]).toMatchObject(altrePoble);
  await act(async () => acabaPrimerPoble());
  expect(screen.queryByRole('link', { name: /^Editora del catàleg/ })).toBeNull();
});
