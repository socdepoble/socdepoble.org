import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* Fase D (261020, tasca 2; pla 261020_1300; crítica 261020, 18) · «Privacitat
   i dades» del perfil porta també les persones i entitats bloquejades, amb
   «Desbloqueja» (LlistaBloquejos, la mateixa del Control del xat), darrere
   del consentiment i davant de la baixa: el text del diàleg de bloqueig diu
   que es desfà ací. Sense la moderació, el DOM de sempre. Els mateixos
   dobles que DetallPrivacitat.test.jsx. */
const m = vi.hoisted(() => ({
  caps: new Set(), navigate: vi.fn(), estatBaixa: vi.fn(), estatConsentiment: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: vi.fn(), estatBaixa: m.estatBaixa, demanaBaixa: vi.fn(), cancelaBaixa: vi.fn(),
  estatConsentiment: m.estatConsentiment, registraConsentiment: vi.fn(), revocaConsentiment: vi.fn()
}));
import { DetallPrivacitat } from './DetallPrivacitat.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { id: 'jo', full_name: 'Pep', email: 'pep@poble.test' } };
const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: null });
const moderacio = (mes = {}) => ({
  disponible: true, potBloquejar: true, estatBloquejos: 'llest', codiErrorBloquejos: null, bloquejats: [PEPA],
  desbloqueja: vi.fn().mockResolvedValue(undefined), ...mes
});
const pagina = () => <DetallPrivacitat identitat={jo} config={config} onPerfilCanviat={vi.fn()} onSessioTancada={vi.fn()} />;

beforeEach(() => {
  m.caps = new Set(['compte', 'consentiment']);
  m.estatBaixa.mockReset().mockResolvedValue({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
  m.estatConsentiment.mockReset().mockResolvedValue({ versioVigent: 'v1', url: '/legal', textSha256: null, calReconsentir: false, consentiments: [] });
});
afterEach(cleanup);

const titols = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
/* L'HTML sense els ids de useId, que canvien d'un muntatge a l'altre. */
const dom = (container) => container.firstChild.outerHTML.replace(/:r[0-9a-z]+:/g, ':id:');

test('amb la moderació, el bloc dels bloquejos va darrere del consentiment i davant de la baixa', async () => {
  const valor = moderacio();
  render(<ModeracioContext.Provider value={valor}>{pagina()}</ModeracioContext.Provider>);
  await waitFor(() => expect(m.estatBaixa).toHaveBeenCalled());
  expect(titols()).toEqual(['Les meues dades', 'Consentiment', 'Persones i entitats bloquejades', 'Donar-se de baixa']);
  /* El títol és el del bloc: la llista no en posa cap altre. */
  expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desbloqueja Pepa' })); });
  expect(valor.desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
});

test('sense proveïdor o sense la capacitat, el DOM de sempre', async () => {
  const sense = render(pagina());
  await waitFor(() => expect(m.estatBaixa).toHaveBeenCalled());
  const base = dom(sense.container);
  cleanup();
  const ambNull = render(<ModeracioContext.Provider value={moderacio({ disponible: false })}>{pagina()}</ModeracioContext.Provider>);
  await waitFor(() => expect(m.estatBaixa).toHaveBeenCalledTimes(2));
  expect(dom(ambNull.container)).toBe(base);
});

test('un node sense compte ni consentiment però amb la moderació no diu que no oferix res', () => {
  m.caps = new Set();
  render(<ModeracioContext.Provider value={moderacio()}>{pagina()}</ModeracioContext.Provider>);
  expect(titols()).toEqual(['Persones i entitats bloquejades']);
  expect(screen.queryByText('Este node encara no oferix cap d’estes opcions.')).toBeNull();
});
