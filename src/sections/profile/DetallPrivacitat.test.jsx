import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  caps: new Set(), navigate: vi.fn(),
  exporta: vi.fn(), estatBaixa: vi.fn(), demana: vi.fn(), cancela: vi.fn(),
  estatConsentiment: vi.fn(), registra: vi.fn(), revoca: vi.fn(),
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, topBarData, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      <p>{lead}</p><p>{topBarData?.authorName}</p>{children}
    </main>
  ),
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, demanaBaixa: m.demana, cancelaBaixa: m.cancela,
  estatConsentiment: m.estatConsentiment, registraConsentiment: m.registra, revocaConsentiment: m.revoca,
}));
import { DetallPrivacitat, nomFitxerExportacio, dataLlegible, pagina } from './DetallPrivacitat.jsx';

const config = { tenantId: 'T' };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' } };
const SENSE_BAIXA = { demanada: false, demanadaAl: null, purgaPrevistaAl: null };
const ACCEPTAT = { versioVigent: 'v1', url: '/legal', textSha256: null, calReconsentir: false,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] };

let props;
function pinta(identitat = jo, extra = {}) {
  props = { identitat, config, onPerfilCanviat: vi.fn(), onSessioTancada: vi.fn(), ...extra };
  return render(<DetallPrivacitat {...props} />);
}
const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');

beforeEach(() => {
  m.caps = new Set();
  for (const f of [m.navigate, m.exporta, m.estatBaixa, m.demana, m.cancela, m.estatConsentiment, m.registra, m.revoca]) f.mockReset();
  m.estatBaixa.mockResolvedValue(SENSE_BAIXA);
  m.estatConsentiment.mockResolvedValue(ACCEPTAT);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('amb les dues capacitats, tres blocs en ordre: dades, consentiment i baixa', async () => {
  m.caps = new Set(['compte', 'consentiment']);
  pinta();
  expect(screen.getByRole('heading', { level: 1, name: 'Privacitat i dades' })).toBeTruthy();
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols).toEqual(['Les meues dades', 'Consentiment', 'Donar-se de baixa']);
  await within(seccio('Donar-se de baixa')).findByRole('button', { name: 'Donar-me de baixa' });
  expect(screen.getByText('Pep')).toBeTruthy();
});

test('només «consentiment»: ni dades ni baixa, i cap crida a la baixa', async () => {
  m.caps = new Set(['consentiment']);
  pinta();
  await within(seccio('Consentiment')).findByText(/Política de privacitat vigent/);
  expect(screen.queryByRole('heading', { name: 'Les meues dades' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Donar-se de baixa' })).toBeNull();
  expect(m.estatBaixa).not.toHaveBeenCalled();
});

test('sense capacitats, cap bloc ni cap crida al servidor, i ho diu', () => {
  pinta();
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  expect(screen.getByText('Este node encara no oferix cap d’estes opcions.')).toBeTruthy();
  expect(m.estatBaixa).not.toHaveBeenCalled();
  expect(m.estatConsentiment).not.toHaveBeenCalled();
});

test('una organització no té pàgina de privacitat', () => {
  m.caps = new Set(['compte', 'consentiment']);
  const { container } = pinta(forn);
  expect(container.innerHTML).toBe('');
  expect(m.estatBaixa).not.toHaveBeenCalled();
});

test('«Les meues dades» descarrega el JSON amb el nom del dia', async () => {
  m.caps = new Set(['compte']);
  const dades = { format: 'socdepoble.exportacio.v1', perfil: { full_name: 'Pep' } };
  m.exporta.mockResolvedValue(dades);
  let blob = null, descarregat = null;
  URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:x'; });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { descarregat = { nom: this.download, href: this.getAttribute('href'), penjat: this.isConnected }; });
  pinta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
  expect(m.exporta).toHaveBeenCalledWith(config);
  // Llei 06 (encapsulament): l'enllaç no es penja de document.body.
  expect(descarregat).toEqual({ nom: nomFitxerExportacio(), href: 'blob:x', penjat: false });
  expect(blob.type).toBe('application/json');
  expect(JSON.parse(await blob.text())).toEqual(dades);
  expect(screen.getByText(`Ja tens el fitxer ${nomFitxerExportacio()} a les descàrregues.`)).toBeTruthy();
  expect(nomFitxerExportacio(new Date(2026, 8, 5))).toBe('socdepoble-dades-2026-09-05.json');
});

test('si l’exportació falla, ho diu amb el missatge del servidor', async () => {
  m.caps = new Set(['compte']);
  m.exporta.mockRejectedValue(new Error('Supabase 401: {"message":"SDP-EXPORT-000: cal la sessió iniciada."}'));
  pinta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
  expect(within(seccio('Les meues dades')).getByRole('alert').textContent).toContain('SDP-EXPORT-000: cal la sessió iniciada.');
});

test('demanar la baixa: confirmació, motiu opcional i sessió tancada', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  pinta();
  const boto = await within(seccio('Donar-se de baixa')).findByRole('button', { name: 'Donar-me de baixa' });
  expect(m.estatBaixa).toHaveBeenCalledWith(config);
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
  expect(within(dialeg).getByText(/30 dies pots cancel·lar-la: entra de nou/)).toBeTruthy();
  expect(within(dialeg).getByText(/torna a «Privacitat i dades»/)).toBeTruthy();
  expect(within(dialeg).getByText(/el perfil s’anonimitza/)).toBeTruthy();
  fireEvent.change(within(dialeg).getByLabelText(/Per què te’n vas/), { target: { value: '  Me’n vaig a ciutat  ' } });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.demana).toHaveBeenCalledWith({ motiu: 'Me’n vaig a ciutat' }, config);
  expect(props.onSessioTancada).toHaveBeenCalledTimes(1);
});

test('si la baixa no es pot demanar, la sessió continua i l’error es veu DINS del diàleg obert', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockRejectedValue(new Error('Sense xarxa'));
  pinta();
  fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.demana).toHaveBeenCalledWith({}, config);
  expect(props.onSessioTancada).not.toHaveBeenCalled();
  /* showModal() deixa inert tot el que és fora del diàleg: una alerta fora no arriba. */
  const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
  expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});

test('si retirar el consentiment falla, l’error es veu dins del diàleg', async () => {
  m.caps = new Set(['consentiment']);
  m.revoca.mockRejectedValue(new Error('Sense xarxa'));
  pinta();
  fireEvent.click(await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retirar-lo' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
  expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});

test('sense onSessioTancada (com la munta PerfilShell), la baixa porta a /xat i recarrega la pàgina', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  const recarrega = vi.spyOn(pagina, 'recarrega').mockImplementation(() => {});
  pinta(jo, { onSessioTancada: undefined });
  fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(recarrega).toHaveBeenCalledTimes(1);
  expect(m.navigate.mock.invocationCallOrder[0]).toBeLessThan(recarrega.mock.invocationCallOrder[0]);
});

test('amb una baixa pendent es veu la data i es pot cancel·lar', async () => {
  m.caps = new Set(['compte']);
  const pendent = { demanada: true, demanadaAl: '2026-09-20T10:00:00Z', purgaPrevistaAl: '2026-10-20T10:00:00Z' };
  m.estatBaixa.mockResolvedValue(pendent);
  m.cancela.mockResolvedValue(SENSE_BAIXA);
  pinta();
  const boto = await screen.findByRole('button', { name: 'Cancel·lar la baixa' });
  expect(screen.getByText(new RegExp(dataLlegible(pendent.purgaPrevistaAl)))).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Donar-me de baixa' })).toBeNull();
  await act(async () => { fireEvent.click(boto); });
  expect(m.cancela).toHaveBeenCalledWith(config);
  expect(props.onPerfilCanviat).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Baixa cancel·lada. El teu perfil torna a ser com era.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Donar-me de baixa' })).toBeTruthy();
});

test('consentiment: versió vigent, darrera acció i retirada amb confirmació', async () => {
  m.caps = new Set(['consentiment']);
  m.revoca.mockResolvedValue(undefined);
  pinta();
  const bloc = seccio('Consentiment');
  expect(await within(bloc).findByText(/Política de privacitat vigent: versió v1/)).toBeTruthy();
  expect(within(bloc).getByText(`L’has acceptada (versió v1) el ${dataLlegible('2026-09-15T10:00:00Z')}.`)).toBeTruthy();
  expect(within(bloc).getByRole('link', { name: 'Llegir la política' }).getAttribute('href')).toBe('/legal');
  fireEvent.click(within(bloc).getByRole('button', { name: 'Retirar el consentiment' }));
  m.estatConsentiment.mockResolvedValue({ ...ACCEPTAT, calReconsentir: true,
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'revoca', versio: 'v1', al: '2026-09-26T10:00:00Z' }] });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retirar-lo' })); });
  expect(m.revoca).toHaveBeenCalledWith('rgpd_acepta', config);
  expect(m.estatConsentiment).toHaveBeenCalledTimes(2);
  expect(within(bloc).getByText(/La vas retirar el/)).toBeTruthy();
  expect(within(bloc).getByRole('button', { name: 'Acceptar la versió v1' })).toBeTruthy();
});

test('consentiment: si cal reconsentir, s’accepta la versió vigent', async () => {
  m.caps = new Set(['consentiment']);
  m.estatConsentiment.mockResolvedValue({ versioVigent: 'v2', url: 'https://poble.test/privacitat', textSha256: 'a'.repeat(64), calReconsentir: true,
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] });
  m.registra.mockResolvedValue(undefined);
  pinta();
  const boto = await screen.findByRole('button', { name: 'Acceptar la versió v2' });
  expect(screen.getByRole('link', { name: 'Llegir la política' }).getAttribute('target')).toBe('_blank');
  await act(async () => { fireEvent.click(boto); });
  expect(m.registra).toHaveBeenCalledWith('rgpd_acepta', 'v2', config);
  expect(m.estatConsentiment).toHaveBeenCalledTimes(2);
});
