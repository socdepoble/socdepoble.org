import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const m = vi.hoisted(() => ({
  navigate: vi.fn(),
  language: 'ca',
  setLanguage: vi.fn(),
  t: null,
  logout: vi.fn(),
  preparaEixida: vi.fn(),
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIStateOpcional: () => ({ language: m.language, externalConfig: {} }),
  useUIActionsOpcional: () => ({ language: m.language, setLanguage: m.setLanguage, t: m.t }),
  useUIState: () => ({ language: m.language, externalConfig: {} }),
  useUIActions: () => ({ language: m.language, setLanguage: m.setLanguage, t: m.t }),
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => ({ currentUser: { id: 'U' }, logout: m.logout, preparaEixida: m.preparaEixida }),
  useSession: () => ({ currentUser: { id: 'U' }, logout: m.logout, preparaEixida: m.preparaEixida }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pep' } }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import { DetallEixir, DetallIdioma } from './DetallEspai.jsx';
import { itemsDePerfil } from './perfilModel.js';

const persona = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: '', dades: { id: 'U', town_name: 'La Torre' } };

beforeEach(() => {
  m.language = 'ca';
  m.t = createTranslator('ca');
  m.navigate.mockReset();
  m.setLanguage.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
});
afterEach(cleanup);

describe('Onada R32.4 · Idioma del Sistema i Eixir de Sóc de Poble als apartats personals', () => {
  test('Eixir és sempre l’últim apartat personal, just darrere d’Idioma del Sistema', () => {
    const fills = itemsDePerfil([persona], { ambPrivacitat: true }).filter((i) => i.categoryIds.includes('jo'));
    expect(fills.slice(-2).map((i) => i.id)).toEqual(['jo-idioma', 'jo-eixir']);
  });

  test('DetallIdioma pinta les 5 llengües oficials, canvia d’idioma en 1 clic i enllaça a /traduccions', () => {
    render(<DetallIdioma persona={persona} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Idioma del Sistema' })).toBeTruthy();
    for (const nom of ['Valencià', 'Castellà', 'English', 'Euskara', 'Galego']) {
      expect(screen.getByRole('radio', { name: new RegExp(nom) })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('radio', { name: /English/ }));
    expect(m.setLanguage).toHaveBeenCalledWith('en');
    expect(screen.getByRole('link', { name: 'Traductor de Poble per a Pàgines' }).getAttribute('href')).toBe('/traduccions');
  });

  test('DetallEixir comprova esborranys pendents abans d’eixir i redirigeix a /registre en tancar sessió', async () => {
    m.preparaEixida.mockResolvedValueOnce([{ entitat: 'fitxa', camps: ['lead'] }]);
    render(<DetallEixir persona={persona} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Eixir de Sóc de Poble' })).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Eixir de Sóc de Poble' }));
    });
    expect(m.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Encara hi ha canvis sense desar')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Eixir igualment' }));
    });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(m.navigate).toHaveBeenCalledWith('/registre', { replace: true });
  });

  test.each([
    ['es', 'Idioma del sistema', 'Salir de Sóc de Poble'],
    ['en', 'System language', 'Sign out of Sóc de Poble'],
    ['eu', 'Sistemaren hizkuntza', 'Irten Sóc de Pobletik'],
    ['gl', 'Idioma do sistema', 'Saír de Sóc de Poble'],
  ])('en %s, DetallIdioma i DetallEixir es pinten en la llengua triada', (codi, titolIdioma, titolEixir) => {
    m.language = codi;
    m.t = createTranslator(codi);
    const v1 = render(<DetallIdioma persona={persona} />);
    expect(screen.getByRole('heading', { level: 1, name: titolIdioma })).toBeTruthy();
    v1.unmount();

    render(<DetallEixir persona={persona} />);
    expect(screen.getByRole('heading', { level: 1, name: titolEixir })).toBeTruthy();
  });

  /* Gauntlet R32.6 (PERFIL-01 i I18N-02) · El cos de l'avís (el que diu QUÈ
     s'esborrarà) i l'error també ixen en la llengua de la interfície. */
  test.each([
    ['en', {
      eixir: 'Sign out of Sóc de Poble',
      titol: 'You still have unsaved changes',
      noEixir: 'Stay signed in',
      igualment: 'Sign out anyway',
      cos: 'You have 2 changes that the server does not have yet (in the profile: the standfirst; in Notes: 1 note). If you sign out now, they will be deleted from this device.',
      error: 'Could not sign out.',
    }],
    ['eu', {
      eixir: 'Irten Sóc de Pobletik',
      titol: 'Oraindik gorde gabeko aldaketak daude',
      noEixir: 'Ez irten oraindik',
      igualment: 'Irten hala ere',
      cos: 'Zerbitzariak oraindik ez dituen 2 aldaketa dituzu (fitxan: sarrera; Oharretan: ohar 1). Orain irteten bazara, gailu honetatik ezabatuko dira.',
      error: 'Ezin izan da saioa itxi.',
    }],
  ])('PERFIL-01 · en %s, el títol, els botons, el cos i l’error de l’avís ixen en la llengua triada', async (codi, textos) => {
    m.language = codi;
    m.t = createTranslator(codi);
    m.preparaEixida.mockResolvedValueOnce([{ entitat: 'fitxa', camps: ['lead'] }, { entitat: 'nota', camps: ['content'] }]);
    const { container } = render(<DetallEixir persona={persona} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: textos.eixir })); });
    expect(screen.getByText(textos.titol)).toBeTruthy();
    expect(screen.getByText(textos.cos)).toBeTruthy();
    expect(screen.getByRole('button', { name: textos.noEixir })).toBeTruthy();

    m.logout.mockRejectedValueOnce(new Error('xarxa'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: textos.igualment })); });
    expect(screen.getByText(textos.error)).toBeTruthy();
    expect(m.navigate).not.toHaveBeenCalled();
    for (const literal of ['Encara hi ha canvis sense desar', 'No eixir encara', 'Eixir igualment', 'Tens ', 'Si ixes ara', 'No s’ha pogut tancar la sessió.']) {
      expect(container.textContent).not.toContain(literal);
    }
  });

  /* Gauntlet R32.6 (PERFIL-02) · «No eixir encara» desmunta l'Alerta amb el
     botó enfocat a dins: el focus torna a «Eixir de Sóc de Poble». */
  test.each([
    ['ca', 'Eixir de Sóc de Poble', 'No eixir encara'],
    ['es', 'Salir de Sóc de Poble', 'No salir todavía'],
  ])('PERFIL-02 · en %s, després de «No eixir encara» el focus torna al botó d’eixir', async (codi, nomEixir, nomNoEixir) => {
    m.language = codi;
    m.t = createTranslator(codi);
    m.preparaEixida.mockResolvedValueOnce([{ entitat: 'nota', camps: ['content'] }]);
    render(<DetallEixir persona={persona} />);
    const eixir = screen.getByRole('button', { name: nomEixir });
    await act(async () => { fireEvent.click(eixir); });
    const noEixir = screen.getByRole('button', { name: nomNoEixir });
    expect(document.activeElement).toBe(noEixir);
    await act(async () => { fireEvent.click(noEixir); });
    expect(screen.queryByRole('button', { name: nomNoEixir })).toBeNull();
    expect(m.logout).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(eixir);
  });

  /* Gauntlet R32.6 (PERFIL-03) · Eixir tanca la SESSIÓ d'este dispositiu (logout
     amb scope 'local'), no el compte: «tancar el compte» és la baixa. */
  test.each([
    ['ca', 'Es tancarà la sessió del teu compte en este navegador o aplicació i tornaràs a la pantalla d’entrada. Les teues dades al poble continuen guardades.', 'Es tancarà el teu compte'],
    ['es', 'Se cerrará la sesión de tu cuenta en este navegador o aplicación y volverás a la pantalla de entrada. Tus datos en el pueblo siguen guardados.', 'Se cerrará tu cuenta'],
    ['gl', 'Pecharase a sesión da túa conta neste navegador ou aplicación e volverás á pantalla de entrada. Os teus datos no pobo seguen gardados.', 'Pecharase a túa conta'],
  ])('PERFIL-03 · en %s, el cos diu que es tanca la sessió, no el compte', (codi, cos, vell) => {
    m.language = codi;
    m.t = createTranslator(codi);
    const { container } = render(<DetallEixir persona={persona} />);
    expect(screen.getByText(cos)).toBeTruthy();
    expect(container.textContent).not.toContain(vell);
  });
});
