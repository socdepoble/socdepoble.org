/* Revisió adversarial 260930 · Els dos àmbits del XatContext.
   `scopeKey` porta la generació de la sessió, que puja a CADA renovació del
   JWT: és la clau de les dades. L'entrada del poble (P1) i els esborranys
   (P2) penjaven d'ella i es perdien (o es repetien) cada hora. Ací es prova
   la guarda de veres del proveïdor, no una guarda simulada. */
import { StrictMode } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';
import { buidaEsborranys, desaEsborrany, llegixEsborrany } from './esborranys.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
let value;
function Sonda() {
  value = useXat();
  return null;
}
const arbre = (config = CONFIG) => <StrictMode><XatProvider config={config}><Sonda /></XatProvider></StrictMode>;

async function muntat() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  return vista;
}
/* Una renovació del JWT: la mateixa persona, generacio+1. */
function renova(vista) {
  mock.session = { ...mock.session, generacio: (mock.session.generacio || 0) + 1 };
  vista.rerender(arbre());
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.loadFils.mockResolvedValue([]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
  buidaEsborranys();
});
afterEach(cleanup);

describe('P1 · l’entrada del poble, una sola vegada per sessió', () => {
  it('una renovació del JWT no torna a obrir l’entrada', async () => {
    const vista = await muntat();
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
    expect(value.consumixEntrada('poble:la-torre')).toBe(false);
    const scopeAbans = value.scopeKey;
    renova(vista);
    /* La prova només val si la renovació ha mogut de veres l'àmbit de les dades. */
    expect(value.scopeKey).not.toBe(scopeAbans);
    expect(value.consumixEntrada('poble:la-torre')).toBe(false);
  });

  it('passar de persona a entitat (canvi d’actor) no torna a obrir l’entrada', async () => {
    const vista = await muntat();
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
    mock.actorKey = 'entitat::forn';
    vista.rerender(arbre());
    expect(value.consumixEntrada('poble:la-torre')).toBe(false);
  });

  it('una sessió nova sí: eixir i tornar a entrar, o entrar una altra persona', async () => {
    const vista = await muntat();
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
    mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
    vista.rerender(arbre());
    mock.session = { currentUser: { id: 'A' }, generacio: 3 };
    vista.rerender(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
    mock.session = { currentUser: { id: 'B' }, generacio: 4 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
  });

  it('un altre poble és una altra entrada', async () => {
    await muntat();
    expect(value.consumixEntrada('poble:la-torre')).toBe(true);
    expect(value.consumixEntrada('poble:sella')).toBe(true);
  });
});

describe('P2 · ambitEstable, la clau dels esborranys', () => {
  it('no canvia amb la renovació del JWT i sí amb la persona, l’actor o el backend', async () => {
    const vista = await muntat();
    const ambit = value.ambitEstable;
    expect(typeof ambit).toBe('string');
    expect(ambit).toContain('persona::A');
    renova(vista);
    expect(value.ambitEstable).toBe(ambit);

    mock.actorKey = 'entitat::forn';
    vista.rerender(arbre());
    const ambitEntitat = value.ambitEstable;
    expect(ambitEntitat).not.toBe(ambit);

    vista.rerender(arbre({ ...CONFIG, tenantId: '00000000-0000-0000-0000-00000000000b' }));
    expect(value.ambitEstable).not.toBe(ambitEntitat);

    mock.session = { currentUser: { id: 'B' }, generacio: 9 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    expect(value.ambitEstable).not.toBe(ambit);
  });

  it('l’esborrany desat sota ambitEstable sobreviu a la renovació', async () => {
    const vista = await muntat();
    const clau = `${value.ambitEstable}::fil-A`;
    desaEsborrany(clau, 'mig escrit');
    renova(vista);
    expect(`${value.ambitEstable}::fil-A`).toBe(clau);
    expect(llegixEsborrany(clau)).toBe('mig escrit');
  });

  it('eixir de la sessió oblida els esborranys (esborranys.js: «en tancar la sessió»)', async () => {
    const vista = await muntat();
    const clau = `${value.ambitEstable}::fil-A`;
    desaEsborrany(clau, 'privat de A');
    mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
    vista.rerender(arbre());
    expect(llegixEsborrany(clau)).toBe('');
  });

  it('el doble efecte de StrictMode en muntar no buida res', async () => {
    desaEsborrany('previ::fil', 'no el toques');
    await muntat();
    expect(llegixEsborrany('previ::fil')).toBe('no el toques');
  });
});
