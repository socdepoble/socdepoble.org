/* T7 · P1-22 (261101) · «Privacitat i dades» del Perfil, en la llengua de
   la interfície: el títol (section.perfil.privacitat.pagina.titol, el mateix
   de la seua pàgina) i el subtítol (section.perfil.privacitat.llista.subtitol)
   es tradueixen en pintar la llista (PerfilShell). El model (perfilModel.js)
   continua pur, amb la reserva. Fora de l'app (sense traductor), el
   valencià de sempre; la cerca i la resta de la fila no canvien.
   Gauntlet 2 · 261101 (G2-T7-01) · En una altra llengua, la cerca de la
   columna també troba el que es veu: els textos traduïts s'afigen al
   searchText de sempre (que continua). En valencià, la fila és la del model. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const m = vi.hoisted(() => ({ workspace: null, perfil: null, caps: new Set(), ui: null, t: null }));
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => null,
}));
vi.mock('../../components/universal/workspace', () => ({ UniversalWorkspace: (props) => { m.workspace = props; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({
  PerfilProvider: ({ children }) => children,
  usePerfil: () => m.perfil,
}));
vi.mock('./PerfilEditor.jsx', () => ({ PerfilEditor: () => null }));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: () => null }));
vi.mock('./DetallVistes.jsx', () => ({ DetallVistes: () => null }));
vi.mock('./DetallMultimedia.jsx', () => ({ DetallMultimedia: () => null }));
vi.mock('./DetallPrivacitat.jsx', () => ({ DetallPrivacitat: () => null }));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({ DialegNovaOrganitzacio: () => null }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ refresh: vi.fn(), actor: null, error: null }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUI: () => m.ui,
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null),
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: '/el-meu-perfil', search: '', state: null, hash: '' }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: (cap) => m.caps.has(cap) }));
vi.mock('./PerfilPublicSection.jsx', () => ({ PaginaDeLAgent: () => null }));
import PerfilShell from './PerfilShell.jsx';
import { TEXTOS_PRIVACITAT_LLISTA, itemsDePerfil } from './perfilModel.js';
import { ALL_CATEGORY_ID, filterWorkspaceItems } from '../../components/universal/workspace/workspaceState.js';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: 'a.webp', dades: {} };
const item = (id) => m.workspace.model.items.find((i) => i.id === id);
/* Els títols de les files que troba la cerca de la columna, amb el filtre real. */
const busca = (query) => filterWorkspaceItems(m.workspace.model.items, { query, activeCategoryId: ALL_CATEGORY_ID, activeTagIds: [] })
  .map((i) => i.id);
const fila = () => {
  const { title, subtitle } = item('jo-privacitat');
  return [title, subtitle];
};

beforeEach(() => {
  m.workspace = null;
  m.t = null;
  m.caps = new Set(['compte']);
  m.ui = { externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } };
  m.perfil = {
    identitats: [jo], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
});
afterEach(cleanup);

describe('«Privacitat i dades» a la llista del Perfil', () => {
  test('les reserves són el valencià del diccionari, i el model pur les porta', () => {
    const ca = createTranslator('ca');
    for (const [clau, reserva] of Object.values(TEXTOS_PRIVACITAT_LLISTA)) expect([clau, ca(clau)]).toEqual([clau, reserva]);
    expect(itemsDePerfil([jo], { ambPrivacitat: true }).find((i) => i.id === 'jo-privacitat')).toMatchObject({
      title: 'Privacitat i dades', subtitle: 'Les teues dades, el consentiment i la baixa',
    });
  });

  test('anglés i castellà: títol i subtítol traduïts; la vista, la de sempre; la cerca troba el que es veu', () => {
    m.t = createTranslator('en');
    render(<PerfilShell />);
    expect(fila()).toEqual(['Privacy and data', 'Your data, consent and closing your account']);
    expect(item('jo-privacitat')).toMatchObject({
      searchText: 'privacitat dades consentiment baixa Pep Privacy and data Your data, consent and closing your account',
      data: { vista: 'privacitat', identitatId: 'jo' },
    });
    // G2-T7-01 · El que es veu, i el de sempre.
    expect(busca('privacy')).toEqual(['jo-privacitat']);
    expect(busca('consent')).toEqual(['jo-privacitat']);
    expect(busca('privacitat')).toEqual(['jo-privacitat']);
    // La resta de la llista no es toca.
    expect(item('jo-fitxa').title).toBe('La fitxa');
    expect(item('jo-fitxa')).toEqual(itemsDePerfil([jo], { ambPrivacitat: true }).find((i) => i.id === 'jo-fitxa'));
    cleanup();
    m.t = createTranslator('es');
    render(<PerfilShell />);
    expect(fila()).toEqual(['Privacidad y datos', 'Tus datos, el consentimiento y la baja']);
    expect(busca('privacidad')).toEqual(['jo-privacitat']);
  });

  test('en valencià (amb traductor): la fila és la del model, també el searchText', () => {
    m.t = createTranslator('ca');
    render(<PerfilShell />);
    expect(item('jo-privacitat')).toEqual(itemsDePerfil([jo], { ambPrivacitat: true }).find((i) => i.id === 'jo-privacitat'));
    expect(busca('privacitat')).toEqual(['jo-privacitat']);
  });

  test('sense traductor (fora de l’app): el valencià de sempre', () => {
    render(<PerfilShell />);
    expect(fila()).toEqual(['Privacitat i dades', 'Les teues dades, el consentiment i la baixa']);
    expect(item('jo-privacitat').searchText).toBe('privacitat dades consentiment baixa Pep');
  });
});
