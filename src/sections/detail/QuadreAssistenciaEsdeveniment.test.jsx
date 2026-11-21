import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CALENDAR_EVENTS, CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../mur/eventsSeed.js';
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

/* P0-ANDROID-PUSH (v1.2.16) · B10b (D-12) · Rellotge fix a l'1-10-2026: els cursos (del 23-10 al
   14-11-2026) encara han de vindre. Sense, les proves que trien «Sí, compta amb mi» depenien del
   dia en què es passaven: des del 15-11-2026 els cursos ja s'han fet i el quadre no pregunta res. */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  localStorage.clear();
  _reiniciaRsvpEsdeveniments();
  oblidaReferenciaPaginaXat();
  vi.clearAllMocks();
  mocks.sessio = null;
});

afterEach(() => {
  cleanup();
  oblidaReferenciaPaginaXat();
  vi.useRealTimers();
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

/* P0-ANDROID-PUSH (v1.2.16) · B10b (decisió del Mestre D-12, criteri CA-P9) · Cap «Assistiré» en un
   acte que ja s'ha fet: ni la pregunta, ni els tres botons, ni la nota, ni «Desar resposta». */
const APLEC_2023 = CALENDAR_EVENTS.find((item) => item.id === 'aplec-2023');
const botonsRsvp = (container) => container.querySelectorAll('button[aria-pressed]');

test('B10b · un acte del 2023 no pinta cap botó RSVP ni la nota: diu que ja s’ha fet i conserva els xats', () => {
  expect(APLEC_2023).toBeTruthy();
  const objecte = { ...OBJECTE_XAT, id: APLEC_2023.id, titol: APLEC_2023.title, ruta: `/events/${APLEC_2023.id}` };
  const { container } = render(<QuadreAssistenciaEsdeveniment item={APLEC_2023} objecteXat={objecte} />);

  expect(botonsRsvp(container)).toHaveLength(0);
  expect(screen.queryByRole('button', { name: /Sí, compta amb mi|Potser|No podré anar-hi|Desar resposta/ })).toBeNull();
  expect(screen.queryByText('Assistiràs a este esdeveniment?')).toBeNull();
  expect(screen.queryByLabelText(/Vols afegir un comentari o motiu/)).toBeNull();
  expect(screen.getByText('Este acte ja s’ha fet.')).toBeTruthy();
  expect(screen.getByTestId('quadre-assistencia-esdeveniment').getAttribute('aria-label')).toBe('Este acte ja s’ha fet.');
  // El recompte i els xats públic i privat es queden; el públic no hereta cap resposta.
  expect(screen.getByText('Compta amb mi: 0')).toBeTruthy();
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /Xat públic de l’esdeveniment/ }));
  });
  expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('/xat?sobre=esdeveniment:aplec-2023'));
  expect(prenEsborranyReferenciaXat()).toBe('');
  expect(screen.getByRole('button', { name: /Preguntar en privat a El Rentonar/ })).toBeTruthy();
});

test('B10b · una resposta desada abans que l’acte passara no torna a oferir «Desar» ni s’envia al xat', () => {
  const objecte = { ...OBJECTE_XAT };
  const { unmount } = render(<QuadreAssistenciaEsdeveniment item={CURSOS_PEDRA_EN_SEC_2026_EVENT} objecteXat={objecte} />);
  fireEvent.click(screen.getByRole('button', { name: /Sí, compta amb mi/ }));
  expect(screen.getByText('Compta amb mi: 1')).toBeTruthy();
  unmount();

  vi.setSystemTime(new Date(2026, 10, 20, 12, 0));
  const { container } = render(<QuadreAssistenciaEsdeveniment item={CURSOS_PEDRA_EN_SEC_2026_EVENT} objecteXat={objecte} />);
  expect(botonsRsvp(container)).toHaveLength(0);
  expect(screen.getByText('Compta amb mi: 1')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Desar resposta|Comentar al xat públic/ })).toBeNull();
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /Xat públic de l’esdeveniment/ }));
  });
  expect(prenEsborranyReferenciaXat()).toBe('');
});

test('B10b · un acte de demà pinta els tres botons; un de repetit amb la primera data passada, també', () => {
  const dema = { id: 'ball-dema', type: 'event', title: 'Ball de plaça', date: '2026-10-02' };
  const { container, unmount } = render(<QuadreAssistenciaEsdeveniment item={dema} />);
  expect(botonsRsvp(container)).toHaveLength(3);
  expect(screen.getByText('Assistiràs a este esdeveniment?')).toBeTruthy();
  expect(screen.queryByText('Este acte ja s’ha fet.')).toBeNull();
  unmount();

  const mercat = { id: 'mercat-dissabtes', type: 'event', title: 'Mercat dels dissabtes', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY'] };
  const repetit = render(<QuadreAssistenciaEsdeveniment item={mercat} />);
  expect(botonsRsvp(repetit.container)).toHaveLength(3);
});

/* Gauntlet R1 de la v1.2.16 (L2-01 i L2-04) · Hui és l'1-10-2026 a les 12:00. Abans, l'acte de les
   10:00 sense fi «ja s'havia fet» a les 11:00, i el mercat amb UNTIL passat encara preguntava. */
test('[L2-01] un acte de hui a les 10:00 sense fi continua preguntant a les 12:00', () => {
  const avui = { id: 'ball-mati', type: 'event', title: 'Ball del matí', date: '2026-10-01', time: '10:00' };
  const { container } = render(<QuadreAssistenciaEsdeveniment item={avui} />);
  expect(botonsRsvp(container)).toHaveLength(3);
  expect(screen.getByText('Assistiràs a este esdeveniment?')).toBeTruthy();
  expect(screen.queryByText('Este acte ja s’ha fet.')).toBeNull();
});

test('[L2-04] un mercat amb UNTIL passat no oferix l’RSVP; el setmanal sense fi, sí', () => {
  const acabat = { id: 'mercat-vell', type: 'event', title: 'Mercat d’hivern', date: '2026-01-10', recurrencia: ['RRULE:FREQ=WEEKLY;UNTIL=20260301'] };
  const { container, unmount } = render(<QuadreAssistenciaEsdeveniment item={acabat} />);
  expect(botonsRsvp(container)).toHaveLength(0);
  expect(screen.getByText('Este acte ja s’ha fet.')).toBeTruthy();
  unmount();

  const setmanal = { ...acabat, id: 'mercat-dissabtes', title: 'Mercat dels dissabtes', recurrencia: ['RRULE:FREQ=WEEKLY'] };
  const viu = render(<QuadreAssistenciaEsdeveniment item={setmanal} />);
  expect(botonsRsvp(viu.container)).toHaveLength(3);
  expect(screen.queryByText('Este acte ja s’ha fet.')).toBeNull();
});

