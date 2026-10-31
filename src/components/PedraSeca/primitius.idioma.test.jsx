/* Gauntlet 261029 (cicle 1, àrea i18n-a11y; troballa
   textos-en-dur-catala-al-gestor, WCAG 3.1.2) · Els textos fixos de les
   peces compartides, en la llengua de la interfície:
     · Alerta: el nom de la creu («Tancar l'avís»);
     · Boto carregant: «Treballant…»;
     · Dialeg: el nom de la X («Tancar»);
     · PageFrame amb traduccio={false}: l'avís de Traduir.
   Fora de l'app (sense traductor) i en valencià, el text de sempre: cap píxel. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null, toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => mocks.ui,
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { Alerta } from './molecules/Alerta.jsx';
import { Boto } from './atoms/Boto.jsx';
import { Dialeg } from './organismes/Dialeg.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO, PageFrame } from '../universal/PageFrame.jsx';

beforeEach(() => {
  mocks.t = null;
  mocks.toast.mockClear();
});
afterEach(() => cleanup());

const enAngles = () => { mocks.t = createTranslator('en'); };
const tancaDelDialeg = () => document.querySelector('.sdp-dialeg__tanca');

describe('en anglés', () => {
  test('Alerta: «Close the notice»', () => {
    enAngles();
    render(<Alerta to="avis" onTanca={() => {}}>Avís</Alerta>);
    expect(screen.getByRole('button', { name: 'Close the notice' })).toBeTruthy();
  });

  test('Boto carregant: «Working…»', () => {
    enAngles();
    render(<Boto carregant>Desar</Boto>);
    expect(screen.getByRole('button').textContent).toBe('Working…');
  });

  test('Dialeg: la X es diu «Close»', () => {
    enAngles();
    render(<Dialeg obert={false} titol="Prova" onTanca={() => {}}><p>Cos</p></Dialeg>);
    expect(tancaDelDialeg().getAttribute('aria-label')).toBe('Close');
  });

  test('PageFrame amb traduccio={false}: Traduir avisa en anglés', () => {
    enAngles();
    const { container } = render(<PageFrame chrome="full" title="Notícia" traduccio={false}><p>Text.</p></PageFrame>);
    fireEvent.click(container.querySelector('header.bar-blue button[aria-label="Traduir"]'));
    expect(mocks.toast).toHaveBeenCalledWith('This page is not translated: what it shows never leaves this device.');
  });
});

describe('sense traductor (fora de l’app): el valencià de sempre', () => {
  test('Alerta, Boto, Dialeg i PageFrame', () => {
    render(<Alerta to="avis" onTanca={() => {}}>Avís</Alerta>);
    expect(screen.getByRole('button', { name: 'Tancar l\'avís' })).toBeTruthy();
    cleanup();
    render(<Boto carregant>Desar</Boto>);
    expect(screen.getByRole('button').textContent).toBe('Treballant…');
    cleanup();
    render(<Dialeg obert={false} titol="Prova" onTanca={() => {}}><p>Cos</p></Dialeg>);
    expect(tancaDelDialeg().getAttribute('aria-label')).toBe('Tancar');
    cleanup();
    const { container } = render(<PageFrame chrome="full" title="Notícia" traduccio={false}><p>Text.</p></PageFrame>);
    fireEvent.click(container.querySelector('header.bar-blue button[aria-label="Traduir"]'));
    expect(mocks.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
  });
});
