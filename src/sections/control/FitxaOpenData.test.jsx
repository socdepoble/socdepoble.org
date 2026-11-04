import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const m = vi.hoisted(() => ({ config: null, towns: [], sessio: null, actor: 'persona:a', props: [], muntatges: 0, desmuntatges: 0 }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIState: () => ({ externalConfig: m.config }), useUIActionsOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: m.towns }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ actorKey: m.actor }) }));
vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, lead, onBack, children }) => <section><header className="page-title"><h1>{title}</h1></header><p>{lead}</p><button onClick={onBack}>Tornar</button>{children}</section> }));
vi.mock('../pobles/RestauradorOpenData.jsx', async importOriginal => {
  const actual = await importOriginal(); const { useEffect } = await import('react');
  return { ...actual, default: function MockRestaurador(props) {
    m.props.push(props);
    useEffect(() => { m.muntatges += 1; return () => { m.desmuntatges += 1; }; }, []);
    return <output>{JSON.stringify({ municipi: props.municipi, autoritzat: props.autoritzat, scopeKey: props.scopeKey })}</output>;
  } };
});
import FitxaOpenData from './FitxaOpenData.jsx';
const ultima = () => m.props.at(-1);
beforeEach(() => {
  m.config = { tenantId: A, backendUrl: 'https://backend-a.example', dataMode: 'remote' };
  m.towns = [{ id: A, slug: 'la-torre-de-les-macanes', name: 'La Torre de les Maçanes' }, { id: B, slug: 'xixona', name: 'Xixona' }];
  m.sessio = { currentUser: { id: 'persona-a' }, esSuperadmin: true, nivell: 'aal2' };
  m.actor = 'persona:a'; m.props = []; m.muntatges = 0; m.desmuntatges = 0;
});
afterEach(cleanup);

test('municipi prové només de towns[id===tenantId], config estable i sessió superadmin aal2', () => {
  const onBack = vi.fn(); const { rerender } = render(<FitxaOpenData onBack={onBack} />);
  const config = ultima().config;
  expect(ultima()).toMatchObject({ municipi: { slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' }, autoritzat: true, introduccio: false });
  expect(ultima().scopeKey).toContain('persona-a::persona:a');
  rerender(<FitxaOpenData onBack={onBack} />); expect(ultima().config).toBe(config);
  fireEvent.click(screen.getByRole('button', { name: 'Tornar' })); expect(onBack).toHaveBeenCalledOnce();
});
test('sense tenant coincident, sense nom/slug vàlid o configuració invàlida no inventa La Torre', () => {
  const { rerender } = render(<FitxaOpenData />);
  for (const config of [{ ...m.config, tenantId: null }, { ...m.config, tenantId: '33333333-3333-4333-8333-333333333333' }, { ...m.config, tenantId: 'id-invalid' }]) {
    m.config = config; rerender(<FitxaOpenData />); expect(ultima().municipi).toBeNull(); expect(ultima().autoritzat).toBe(false);
  }
  m.config = { tenantId: A, dataMode: 'remote' };
  for (const town of [{ id: A, name: '' }, { id: A, name: '<La Torre>' }, { id: A, name: 'La Torre', slug: 'Slug Invalid' }]) {
    m.towns = [town]; rerender(<FitxaOpenData />); expect(ultima().municipi).toBeNull(); expect(ultima().autoritzat).toBe(false);
  }
});
test('convidat, rol insuficient i aal1 mantenen comprovació local però no autoritzen restauració', () => {
  const { rerender } = render(<FitxaOpenData />);
  for (const sessio of [null, { currentUser: null, esSuperadmin: true, nivell: 'aal2' }, { currentUser: { id: 'persona-a' }, esSuperadmin: false, nivell: 'aal2' }, { currentUser: { id: 'persona-a' }, esSuperadmin: true, nivell: 'aal1' }]) {
    m.sessio = sessio; rerender(<FitxaOpenData />); expect(ultima().autoritzat).toBe(false); expect(ultima().municipi).toBeTruthy();
  }
});
test('persona, actor, tenant i backend nous desmunten el restaurador anterior', () => {
  const { rerender } = render(<FitxaOpenData />); let scope = ultima().scopeKey;
  for (const canvia of [() => { m.sessio = { ...m.sessio, currentUser: { id: 'persona-b' } }; }, () => { m.actor = 'entitat:rentonar'; }, () => { m.config = { ...m.config, tenantId: B }; }, () => { m.config = { ...m.config, backendUrl: 'https://backend-b.example' }; }]) {
    const abans = m.desmuntatges; canvia(); rerender(<FitxaOpenData />); expect(ultima().scopeKey).not.toBe(scope); expect(m.desmuntatges).toBe(abans + 1); scope = ultima().scopeKey;
  }
  expect(ultima().municipi).toEqual({ slug: 'xixona', nom: 'Xixona' });
});
