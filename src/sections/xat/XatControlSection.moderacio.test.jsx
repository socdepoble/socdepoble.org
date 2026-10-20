/* Fase D (261020, tasca 2; pla 261020_1300; crítiques 261020, 17 i 18) · El
   Control del xat, «Privacitat i seguretat»: amb la moderació de l'app, la
   llista de persones i entitats bloquejades (LlistaBloquejos) i un avís que
   continua dient el que encara falta (silenciar i el xifratge); sense, l'avís
   «pendent» de sempre i res més. La closca i la graella, simulades: només
   compta el contingut de l'opció oberta. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./components/ClosCaXat.jsx', () => ({
  default: ({ middleColumn, rightColumn }) => <div>{middleColumn}{rightColumn}</div>,
  BotoObriRail: () => null
}));
vi.mock('./components/PanellInicialMobil.jsx', () => ({ default: () => null }));
vi.mock('../../components/layout/AppGridColumn.jsx', () => ({ default: () => null }));
vi.mock('../../components/layout/AppGridShell.jsx', () => ({
  useAppGrid: () => ({ mida: 'ample', tancaPanells: () => {}, applyPreset: () => {}, columnWidths: { left: 80, middle: 360 } })
}));
import XatControlSection from './XatControlSection.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

afterEach(cleanup);

const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: null });
const moderacio = (mes = {}) => ({
  disponible: true, potBloquejar: true, estatBloquejos: 'llest', codiErrorBloquejos: null, bloquejats: [PEPA],
  desbloqueja: vi.fn().mockResolvedValue(undefined), ...mes
});
function obriPrivacitat() {
  act(() => { fireEvent.click(screen.getByRole('button', { name: /^Privacitat i seguretat/ })); });
  return screen.getByRole('article', { name: 'Privacitat i seguretat' });
}

test('sense moderació, l’avís «pendent» de sempre i cap llista', () => {
  render(<XatControlSection />);
  const panell = obriPrivacitat();
  expect(within(panell).getByRole('status').textContent)
    .toBe('Esta opció encara no està disponible: es construirà en la fase següent del xat.');
  expect(within(panell).queryByRole('list')).toBeNull();
});

test('amb moderació, la llista de bloquejos amb «Desbloqueja» i l’avís del que encara falta', async () => {
  const valor = moderacio();
  render(<ModeracioContext.Provider value={valor}><XatControlSection /></ModeracioContext.Provider>);
  const panell = obriPrivacitat();
  expect(within(panell).getByRole('heading', { level: 3 }).textContent).toBe('Persones i entitats bloquejades');
  expect(within(panell).getAllByRole('listitem')).toHaveLength(1);
  expect(within(panell).getByRole('status').textContent)
    .toBe('Silenciar les notificacions i el xifratge extrem a extrem encara no estan disponibles: es construiran en la fase següent del xat.');
  await act(async () => { fireEvent.click(within(panell).getByRole('button', { name: 'Desbloqueja Pepa' })); });
  expect(valor.desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
});

test('amb el proveïdor però sense la capacitat, com sense moderació', () => {
  render(<ModeracioContext.Provider value={moderacio({ disponible: false })}><XatControlSection /></ModeracioContext.Provider>);
  const panell = obriPrivacitat();
  expect(within(panell).queryByRole('list')).toBeNull();
  expect(within(panell).getByRole('status').textContent).toContain('Esta opció encara no està disponible');
});
