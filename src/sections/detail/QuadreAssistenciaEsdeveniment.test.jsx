import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../mur/eventsSeed.js';
import { _reiniciaRsvpEsdeveniments } from '../calendari/rsvpEsdeveniments.js';
import {
  oblidaReferenciaPaginaXat,
  prenEsborranyReferenciaXat,
  referenciaPaginaXatActual
} from '../xat/referenciaPaginaXat.js';
import { QuadreAssistenciaEsdeveniment } from './QuadreAssistenciaEsdeveniment.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  sessio: null
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useRouter: () => null
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.toast })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa })
}));

const OBJECTE_XAT = {
  tipus: 'esdeveniment',
  id: CURSOS_PEDRA_EN_SEC_2026_EVENT.id,
  titol: CURSOS_PEDRA_EN_SEC_2026_EVENT.title,
  ruta: `/events/${CURSOS_PEDRA_EN_SEC_2026_EVENT.id}`,
  autor: { tipus: 'entitat', id: 'el-rentonar', nom: 'El Rentonar', projecte: false }
};

beforeEach(() => {
  localStorage.clear();
  _reiniciaRsvpEsdeveniments();
  oblidaReferenciaPaginaXat();
  vi.clearAllMocks();
  mocks.sessio = null;
});

afterEach(() => {
  cleanup();
  oblidaReferenciaPaginaXat();
});

test('mostra el quadrat de data, el resum de Fageca i Alcosser, i guarda «Sí, compta amb mi» + nota opcional', () => {
  const { container, unmount } = render(
    <QuadreAssistenciaEsdeveniment
      item={CURSOS_PEDRA_EN_SEC_2026_EVENT}
      badge={CURSOS_PEDRA_EN_SEC_2026_EVENT.calendar_badge}
      objecteXat={OBJECTE_XAT}
    />
  );

  expect(container.querySelector('.sp-card-calendar-badge')).toBeTruthy();
  expect(screen.getByText('Compta amb mi: 0')).toBeTruthy();
  expect(screen.getAllByText(/Fageca/).length).toBeGreaterThanOrEqual(2);

  fireEvent.click(screen.getByRole('button', { name: /Sí, compta amb mi/ }));
  expect(screen.getByText('Compta amb mi: 1')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Sí, compta amb mi/, pressed: true })).toBeTruthy();

  fireEvent.change(screen.getByLabelText(/Vols afegir un comentari o motiu/), {
    target: { value: 'Anirem dos des de la Torre!' }
  });
  fireEvent.click(screen.getByRole('button', { name: /Desar resposta/ }));
  expect(screen.getByRole('status').textContent).toMatch(/S’ha desat la teua resposta/);

  unmount();
  render(
    <QuadreAssistenciaEsdeveniment
      item={CURSOS_PEDRA_EN_SEC_2026_EVENT}
      badge={CURSOS_PEDRA_EN_SEC_2026_EVENT.calendar_badge}
      objecteXat={OBJECTE_XAT}
    />
  );
  expect(screen.getByText('Compta amb mi: 1')).toBeTruthy();
  expect(screen.getByDisplayValue('Anirem dos des de la Torre!')).toBeTruthy();
});

test('oferix xat públic de grup i xat privat amb l’organitzador, passant referència i esborrany sense peticions directes 403', () => {
  render(
    <QuadreAssistenciaEsdeveniment
      item={CURSOS_PEDRA_EN_SEC_2026_EVENT}
      badge={CURSOS_PEDRA_EN_SEC_2026_EVENT.calendar_badge}
      objecteXat={OBJECTE_XAT}
    />
  );

  expect(screen.getByRole('button', { name: /Xat públic de l’esdeveniment/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Preguntar en privat a El Rentonar/ })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: /No podré anar-hi/ }));
  fireEvent.change(screen.getByLabelText(/Vols afegir un comentari o motiu/), {
    target: { value: 'Eixes dates coincidixen al meu poble amb la fira' }
  });

  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /Comentar al xat públic/ }));
  });

  expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('/xat?sobre=esdeveniment:cursos-pedra-en-sec-fageca-alcosser-2026'));
  expect(referenciaPaginaXatActual()).toEqual({
    tipus: 'esdeveniment',
    id: 'cursos-pedra-en-sec-fageca-alcosser-2026',
    titol: 'Cursos de pedra en sec a Fageca i Alcosser',
    ruta: '/events/cursos-pedra-en-sec-fageca-alcosser-2026'
  });
  expect(prenEsborranyReferenciaXat()).toBe('❌ No podré anar-hi — Eixes dates coincidixen al meu poble amb la fira');

  mocks.navigate.mockClear();
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /Preguntar en privat a El Rentonar/ }));
  });
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=el-rentonar');
  expect(prenEsborranyReferenciaXat()).toBe('❌ No podré anar-hi — Eixes dates coincidixen al meu poble amb la fira');
});
