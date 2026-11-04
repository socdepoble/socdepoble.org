/* Revisió del Panell de Control (lot «control», 261104) · Restaurar dades
   obertes.

   control-02 · El municipi actiu es buscava amb `towns.find(x => x.id ===
   tenantId)`, però el tenant és l'UUID de public.towns i les fitxes de `towns`
   porten l'id slug (configAmfitrio.js; migració 2610282100): no casava mai i
   un superadmin aal2 no podia restaurar mai. Ara, primer la fitxa que declara
   el tenant (`id` o `tenant_id`) i, si no n'hi ha, la llista autoritzada dels
   pobles administrables del port (adminLlistaPobles, capacitat
   'administracioMultipoble'), la mateixa porta de pobleAdministrat.jsx:
   superadmin amb el segon factor. Sense resoldre, es continua tancant en fals.
   Mai es fa servir el poble que declara l'amfitrió.

   Les fitxes són les de la llavor (MOCK_TOWNS) i el tenant, un UUID. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';

const TENANT = '11111111-2222-3333-4444-555555555555';
const ALTRE = '22222222-2222-4222-8222-222222222222';
const TORRE = Object.freeze({ id: TENANT, slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const m = vi.hoisted(() => ({ config: null, towns: [], sessio: null, props: [], capacitats: new Set(), llista: null }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIState: () => ({ externalConfig: m.config }), useUIActionsOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: m.towns }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ actorKey: 'persona:a' }) }));
vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
vi.mock('../../data/backendPort.js', async (original) => ({
  ...await original(),
  teCapacitat: (capacitat) => m.capacitats.has(capacitat),
  adminLlistaPobles: (...args) => m.llista(...args)
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <section><header className="page-title"><h1>{title}</h1></header>{children}</section> }));
vi.mock('../pobles/RestauradorOpenData.jsx', async (original) => ({
  ...await original(),
  default: function MockRestaurador(props) {
    m.props.push(props);
    return <output>{JSON.stringify({ municipi: props.municipi, autoritzat: props.autoritzat })}</output>;
  }
}));

import FitxaOpenData from './FitxaOpenData.jsx';

const ultima = () => m.props.at(-1);
beforeEach(() => {
  m.config = { tenantId: TENANT, backendUrl: 'https://backend-a.example', dataMode: 'remote' };
  m.towns = MOCK_TOWNS;
  m.sessio = { currentUser: { id: 'persona-a' }, esSuperadmin: true, nivell: 'aal2' };
  m.props = [];
  m.capacitats = new Set();
  m.llista = vi.fn(async () => [TORRE, { id: ALTRE, slug: 'xixona', nom: 'Xixona' }]);
});
afterEach(cleanup);

test('control-02 · sense cap correspondència ni llista administrable, municipi null i cap autorització (es tanca en fals)', () => {
  render(<FitxaOpenData />);
  expect(ultima()).toMatchObject({ municipi: null, autoritzat: false });
  expect(m.llista).not.toHaveBeenCalled();
});

test('control-02 · amb la llista administrable del port, el superadmin aal2 té el municipi del tenant i queda autoritzat', async () => {
  m.capacitats = new Set(['administracioMultipoble']);
  render(<FitxaOpenData />);
  await waitFor(() => expect(ultima()).toMatchObject({ municipi: { slug: TORRE.slug, nom: TORRE.nom }, autoritzat: true }));
  expect(m.llista).toHaveBeenCalledTimes(1);
  expect(m.llista.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
});

test('control-02 · aal1, sense superadmin o sense sessió no demanen la llista ni autoritzen', async () => {
  m.capacitats = new Set(['administracioMultipoble']);
  for (const sessio of [null, { currentUser: { id: 'persona-a' }, esSuperadmin: true, nivell: 'aal1' }, { currentUser: { id: 'persona-a' }, esSuperadmin: false, nivell: 'aal2' }]) {
    m.sessio = sessio; m.props = [];
    render(<FitxaOpenData />);
    await act(async () => {});
    expect(ultima()).toMatchObject({ municipi: null, autoritzat: false });
    cleanup();
  }
  expect(m.llista).not.toHaveBeenCalled();
});

test('control-02 · una llista sense el tenant actiu, una fila invàlida o un error no inventen cap municipi', async () => {
  m.capacitats = new Set(['administracioMultipoble']);
  for (const llista of [
    async () => [{ id: ALTRE, slug: 'xixona', nom: 'Xixona' }],
    async () => [{ id: TENANT, slug: 'Slug Invalid', nom: 'La Torre' }],
    async () => [{ id: TENANT, slug: 'la-torre-de-les-macanes', nom: '<La Torre>' }],
    async () => { throw Object.assign(new Error('403'), { status: 403 }); }
  ]) {
    m.llista = vi.fn(llista); m.props = [];
    render(<FitxaOpenData />);
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(ultima()).toMatchObject({ municipi: null, autoritzat: false });
    cleanup();
  }
});

test('control-02 · la resposta d’un abast anterior es descarta i la crida s’avorta', async () => {
  m.capacitats = new Set(['administracioMultipoble']);
  let resol;
  m.llista = vi.fn(() => new Promise((r) => { resol = r; }));
  const { rerender } = render(<FitxaOpenData />);
  await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
  const { signal } = m.llista.mock.calls[0][0];
  m.config = { ...m.config, tenantId: ALTRE };
  m.llista = vi.fn(() => new Promise(() => {}));
  rerender(<FitxaOpenData />);
  expect(signal.aborted).toBe(true);
  await act(async () => { resol([TORRE]); });
  expect(ultima()).toMatchObject({ municipi: null, autoritzat: false });
});

test('control-02 · la fitxa que declara el tenant (`tenant_id`) resol sense cap crida', () => {
  m.capacitats = new Set(['administracioMultipoble']);
  m.towns = MOCK_TOWNS.map((town) => (town.id === 'la-torre-de-les-macanes' ? { ...town, tenant_id: TENANT } : town));
  render(<FitxaOpenData />);
  expect(ultima()).toMatchObject({ municipi: { slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' }, autoritzat: true });
  expect(m.llista).not.toHaveBeenCalled();
});

test('control-02 · el poble que declara l’amfitrió no autoritza res', () => {
  m.config = { ...m.config, poble: 'la-torre-de-les-macanes', nomPoble: 'La Torre de les Maçanes' };
  render(<FitxaOpenData />);
  expect(ultima()).toMatchObject({ municipi: null, autoritzat: false });
});

test('control-03 · el cos de la vista porta el ref que li passa el Panell', () => {
  const vistaRef = createRef();
  render(<FitxaOpenData vistaRef={vistaRef} />);
  expect(vistaRef.current?.classList.contains('content-wrapper')).toBe(true);
});
