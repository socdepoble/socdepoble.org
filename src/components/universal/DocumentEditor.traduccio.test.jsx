import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Gauntlet 261030 (cicle 3, traduir-perfil-lectura-fitxa-no-publica; TC3.2) ·
   L'estat buit de DocumentEditor (EmptyDocumentPage) és la fitxa en lectura
   de /el-meu-perfil: una organització on la persona només és membre, o la
   pròpia fitxa amb una baixa en curs o de reserva. Abans hi portava Traduir
   actiu per defecte (PageFrame, traduccio = true) i el lema i la presentació
   d'una entitat només per als membres eixien cap a Apertium o MyMemory.
   Ara Traduir només és actiu amb `traduccio: true` a l'emptyDocument (la nota
   de benvinguda del Bloc i una fitxa pública, PerfilEditor · fitxaPublicada);
   sense, el botó no canvia (Llei del Píxel), avisa i no ix cap text. Les
   dades són inventades i fetch és fals: cap petició real. */
const m = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('./richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div />,
  UniversalRichTextContent: () => <div />
}));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../app/contexts/UIContext', async (original) => ({
  ...(await original()),
  useUIActions: () => ({ t: (_clau, text) => text }),
  useUIState: () => ({ externalConfig: {} }),
  useUIActionsOpcional: () => null
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a', useLocation: () => ({ pathname: '/el-meu-perfil' }) }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../config/assetResolver', async (original) => ({ ...(await original()), resolveAsset: (ref) => ref }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from './PageFrame.jsx';
import { buidaCauTraduccions } from '../PedraSeca/hooks/useTraduccioPagina.js';
import { NOM_MENU_TRADUIR } from './traduccio/MenuTraduir.jsx';
import { APERTIUM_BETA, buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { fitxaDeLectura, fitxaPublicada } from '../../sections/profile/perfilCamps.js';
import { potEditarFitxa } from '../../sections/profile/fitxaDePerfil.js';

const org = (role, visibility) => ({
  id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre',
  dades: { name: 'Forn & Cia', description: 'Subtítol inventat', lema: 'Lema inventat per a membres', presentacio_html: '<p>Acta interna inventada</p>', visibility, role }
});
/* El que PerfilEditor passa en lectura (fitxaDeLectura + traduccio). */
const lectura = (identitat) => ({ document: null, emptyDocument: { ...fitxaDeLectura(identitat), labels: [{ text: 'Membre' }], traduccio: fitxaPublicada(identitat) } });
const traduir = (container) => container.querySelector('header.bar-blue button[aria-label="Traduir"]');
const menu = () => screen.queryByRole('menu', { name: NOM_MENU_TRADUIR });
const fetch = vi.fn();

beforeEach(() => {
  m.toast.mockReset();
  buidaCauTraduccions();
  buidaSessioLliure();
  /* La via de socdepoble.org (main.jsx): Apertium des del navegador. */
  fixaTraductorLliure('apertium');
  fetch.mockReset();
  fetch.mockImplementation(async (_url, { body } = {}) => ({
    ok: true, status: 200, json: async () => ({ responseData: { translatedText: `spa:${body?.get?.('q') ?? ''}` }, responseDetails: null, responseStatus: 200 })
  }));
  vi.stubGlobal('fetch', fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fixaTraductorLliure(null);
});

test('TC3.2 · la fitxa en lectura d’una entitat només per als membres: Traduir avisa i no envia res', async () => {
  for (const visibility of ['members', 'private']) {
    const identitat = org('member', visibility);
    expect([visibility, potEditarFitxa(identitat), fitxaPublicada(identitat)]).toEqual([visibility, false, false]);
    m.toast.mockClear();
    const { container, unmount } = render(<DocumentEditor adapter={lectura(identitat)} />);
    expect(container.querySelector('h1').textContent).toBe('Forn & Cia');
    const boto = traduir(container);
    // Llei del Píxel: el botó continua ací; només deixa d'obrir el menú.
    expect(boto).toBeTruthy();
    expect(boto.hasAttribute('aria-haspopup')).toBe(false);
    await act(async () => { fireEvent.click(boto); });
    expect(m.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
    expect(menu()).toBeNull();
    unmount();
  }
  expect(fetch).not.toHaveBeenCalled();
});

test('TC3.2 · sense la marca `traduccio` a l’emptyDocument, tampoc (fallada tancada)', async () => {
  const { container } = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Forn & Cia', lead: 'Només per als membres', content: '<p>Acta interna inventada</p>' } }} />);
  await act(async () => { fireEvent.click(traduir(container)); });
  expect(m.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
  expect(menu()).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('TC3.2 · la fitxa en lectura d’una entitat pública es continua traduint (menú de llengües i Apertium)', async () => {
  const identitat = org('member', 'public');
  expect(fitxaPublicada(identitat)).toBe(true);
  const { container } = render(<DocumentEditor adapter={lectura(identitat)} />);
  const boto = traduir(container);
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(boto);
  await act(async () => {
    fireEvent.click(within(menu()).getByRole('menuitemradio', { name: 'Castellà' }));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  expect(m.toast).not.toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
  const enviats = fetch.mock.calls.map(([url, { body }]) => [url, body.get('q')]);
  expect(enviats.some(([url, q]) => url === APERTIUM_BETA && /Acta interna inventada/.test(q))).toBe(true);
});
