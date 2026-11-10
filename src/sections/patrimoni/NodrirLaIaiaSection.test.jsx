import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ sessio: null, ui: null, capacitat: true, estat: vi.fn(), llista: vi.fn(), envia: vi.fn(), revisa: vi.fn(), teCapacitat: vi.fn() }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIActionsOpcional: () => m.ui }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: m.teCapacitat, estatCuradoriaCultural: m.estat, llistaAportacionsCulturals: m.llista, enviaAportacioCultural: m.envia, revisaAportacioCultural: m.revisa }));
import Nodrir from './NodrirLaIaiaSection.jsx';
import { PAGINA_NODRIR_IAIA } from '../text/pageContent.nodrirIaia.js';
const fila = { id: '11111111-1111-4111-8111-111111111111', titol: 'Recepta de casa', autoria: 'Veïna', poble: 'La Torre', contingut: 'Memòria de poble', nota: '', estat: 'pendent_revisio', creatA: '2026-11-09T14:00:00Z' };
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
/* SEG-R15b-02, PRODNM-03 i DISSENY_PUNT3 §P7 · Cap persona real ni cap promesa d'un servei no desplegat. */
const PROHIBIT = /Cascant|pepcascant|\bPep\b|blogspot|Node ?0|ingesti|ingest(?:ed|ion)/i;
beforeEach(() => {
  m.sessio = null; m.ui = null; m.capacitat = true;
  Object.values(m).forEach(v => { if (typeof v?.mockReset === 'function') v.mockReset(); });
  m.teCapacitat.mockImplementation(cap => cap === 'curadoriaCultural' && m.capacitat);
  m.estat.mockResolvedValue({ autenticat: true, potCurar: false, ingestioDisponible: false }); m.llista.mockResolvedValue([fila]);
});
afterEach(cleanup);
test('sense sessió ni props de revisor hi ha accés a la safata privada', () => {
  render(<Nodrir esRevisorAutoritzat />);
  expect(screen.queryByText(fila.contingut)).toBeNull();
  expect(screen.getByRole('button', { name: 'Envia a revisió' }).disabled).toBe(true);
  expect(m.estat).not.toHaveBeenCalled();
  expect(screen.getByText(/La revisió la fa una persona amb rol de curadoria verificat al servidor/)).toBeTruthy();
});
test('un usuari ordinari veu les seues aportacions, sense botons de revisió', async () => {
  m.sessio = { currentUser: { id: 'usuari-a' }, esSuperadmin: true };
  render(<Nodrir esRevisorAutoritzat />);
  expect(await screen.findByText(fila.contingut)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Aprova' })).toBeNull();
});
test('el rol confirmat pel servidor permet revisar i l’aprovació no promet cap publicació', async () => {
  m.sessio = { currentUser: { id: 'curador-a' } }; m.estat.mockResolvedValue({ autenticat: true, potCurar: true, ingestioDisponible: false });
  m.revisa.mockResolvedValue({ ...fila, estat: 'aprovat' });
  render(<Nodrir />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aprova' }));
  expect(await screen.findByText('Aprovat per la curadoria')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toMatch(/no la publica ni la incorpora al coneixement de la IAIA/);
  expect(m.revisa).toHaveBeenCalledWith({ id: fila.id, estat: 'aprovat', nota: '' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
});
test('rol revocat pel servidor refusa el canvi i no presenta aprovació', async () => {
  m.sessio = { currentUser: { id: 'curador-a' } }; m.estat.mockResolvedValue({ autenticat: true, potCurar: true, ingestioDisponible: false });
  m.revisa.mockRejectedValue(Object.assign(new Error('denegat'), { status: 403 }));
  render(<Nodrir />); fireEvent.click(await screen.findByRole('button', { name: 'Aprova' }));
  expect(await screen.findByText(/El servidor ha refusat/)).toBeTruthy();
  expect(screen.queryByText('Aprovat per la curadoria')).toBeNull();
});
test('SEG-R15b-04: el servidor refusa decidir una aportació pròpia i enviar sense normes, amb text clar', async () => {
  m.sessio = { currentUser: { id: 'curador-a' } }; m.estat.mockResolvedValue({ autenticat: true, potCurar: true, ingestioDisponible: false });
  m.revisa.mockRejectedValue(Object.assign(new Error('Supabase 403: {"code":"42501","message":"SDP-CULTURA-PROPIA: una aportació pròpia la revisa una altra persona."}'), { status: 403 }));
  render(<Nodrir />); fireEvent.click(await screen.findByRole('button', { name: 'Aprova' }));
  expect(await screen.findByText('Una aportació teua l’ha de revisar una altra persona amb rol de curadoria.')).toBeTruthy();
  m.envia.mockRejectedValue(Object.assign(new Error('Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes de convivència."}'), { status: 403 }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Títol de l’aportació' }), { target: { value: 'T' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Autoria o informant' }), { target: { value: 'A' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Poble o comarca' }), { target: { value: 'P' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Text cultural o enllaç documentat' }), { target: { value: 'C' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Envia a revisió' }));
  expect(await screen.findByText('Cal acceptar les normes de convivència abans d’enviar una aportació.')).toBeTruthy();
});
test('migra pendent es mostra amb el formulari bloquejat', async () => {
  m.sessio = { currentUser: { id: 'a' } }; m.estat.mockRejectedValue(Object.assign(new Error('missing'), { status: 404 }));
  render(<Nodrir />);
  expect(await screen.findByText(/migració de curadoria 2611091500/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Envia a revisió' }).disabled).toBe(true);
});
test('PRODNM-07: sense la capacitat de curadoria no hi ha cap petició ni formulari, i la pàgina ho diu', async () => {
  m.capacitat = false;
  for (const sessio of [null, { currentUser: { id: 'a' } }]) {
    m.sessio = sessio;
    const v = render(<Nodrir />);
    expect(screen.getByText('Este servidor encara no té activa la curadoria cultural. Esta pàgina no recull cap aportació fins que s’active.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Envia a revisió' })).toBeNull();
    expect(screen.queryByText(/Inicia sessió/)).toBeNull();
    await Promise.resolve();
    v.unmount();
  }
  for (const f of [m.estat, m.llista, m.envia, m.revisa]) expect(f).not.toHaveBeenCalled();
});
/* PRODUCCIO-02 (revisió R15b) · Sense la capacitat (producció), cap invitació a aportar, cap «formulari» que no es
   pinta i cap revisió en present: només l'estat honest, en les 5 llengües. Amb la capacitat, tot com abans. */
test('PRODUCCIO-02: sense la capacitat, només l’estat honest en 5 llengües; amb la capacitat, la invitació i l’avís de revisió', () => {
  const HONEST = {
    ca: 'Este servidor encara no té activa la curadoria cultural. Esta pàgina no recull cap aportació fins que s’active.',
    es: 'Este servidor aún no tiene activa la curaduría cultural. Esta página no recoge ninguna aportación hasta que se active.',
    en: 'This server does not have cultural curation enabled yet. This page does not collect any contributions until it is enabled.',
    eu: 'Zerbitzari honek ez du oraindik kultura-berrikuspena aktibatuta. Orri honek ez du ekarpenik jasotzen aktibatu arte.',
    gl: 'Este servidor aínda non ten activa a curadoría cultural. Esta páxina non recolle ningunha achega ata que se active.'
  };
  /* Amb la capacitat: l'avís de revisió (en present, ara veraç) i la invitació a aportar. */
  const AMB_CAPACITAT = {
    ca: ['La revisió la fa una persona', 'Pots aportar receptes'], es: ['La revisión la hace una persona', 'Puedes aportar recetas'],
    en: ['Review is done by a person', 'You can contribute recipes'], eu: ['Berrikuspena zerbitzarian', 'ekar ditzakezu'],
    gl: ['A revisión faina unha persoa', 'Podes achegar receitas']
  };
  for (const llengua of LLENGUES) {
    m.ui = { language: llengua };
    for (const sessio of [null, { currentUser: { id: 'a' } }]) {
      m.sessio = sessio; m.capacitat = false;
      const v = render(<Nodrir />);
      expect([llengua, v.container.textContent]).toEqual([llengua, HONEST[llengua]]);
      expect(v.container.querySelectorAll('h3, form, input, textarea, button')).toHaveLength(0);
      v.unmount();
    }
    m.sessio = null; m.capacitat = true;
    const amb = render(<Nodrir />);
    expect(amb.container.querySelector('form')).toBeTruthy();
    for (const tros of AMB_CAPACITAT[llengua]) expect([llengua, amb.container.textContent.includes(tros)]).toEqual([llengua, true]);
    expect(amb.container.textContent).not.toContain(HONEST[llengua]);
    amb.unmount();
  }
  for (const f of [m.estat, m.llista, m.envia, m.revisa]) expect(f).not.toHaveBeenCalled();
});
test('canvi de compte neteja safata i descarta resposta antiga', async () => {
  m.sessio = { currentUser: { id: 'a' } }; let resol;
  m.estat.mockImplementationOnce(() => new Promise(r => { resol = r; }));
  const v = render(<Nodrir />); await waitFor(() => expect(resol).toBeTypeOf('function'));
  m.sessio = null; v.rerender(<Nodrir />); resol({ autenticat: true, potCurar: true, ingestioDisponible: false });
  await waitFor(() => expect(screen.queryByText(fila.contingut)).toBeNull());
  expect(screen.queryByRole('button', { name: 'Aprova' })).toBeNull();
});
test('5 llengües: la secció segueix la llengua de la interfície', async () => {
  const envia = { ca: 'Envia a revisió', es: 'Enviar a revisión', en: 'Send for review', eu: 'Bidali berrikustera', gl: 'Enviar a revisión' };
  for (const llengua of LLENGUES) {
    m.ui = { language: llengua };
    const v = render(<Nodrir />);
    expect(screen.getByRole('button', { name: envia[llengua] })).toBeTruthy();
    v.unmount();
  }
});
test('SEG-R15b-02 · P7: cap text de la secció ni de PAGE_COPY nomena una persona real ni promet el Node 0, en cap llengua', async () => {
  m.sessio = { currentUser: { id: 'curador-a' } }; m.estat.mockResolvedValue({ autenticat: true, potCurar: true, ingestioDisponible: false });
  m.llista.mockResolvedValue([{ ...fila, estat: 'aprovat' }]);
  for (const llengua of LLENGUES) {
    m.ui = { language: llengua };
    for (const capacitat of [true, false]) {
      m.capacitat = capacitat;
      const v = render(<Nodrir />);
      if (capacitat) await screen.findByText(fila.contingut);
      expect(v.container.textContent, `${llengua}/${capacitat}`).not.toMatch(PROHIBIT);
      expect(v.container.querySelectorAll('a')).toHaveLength(0);
      v.unmount();
    }
  }
  const pagina = PAGINA_NODRIR_IAIA['la-iaia-sabuda'];
  expect(pagina.title.startsWith('La IAIA Sabuda')).toBe(true);
  /* R16b (tercera ronda) · El subtítol neutre de R16a, en les cinc llengües: no afirma cap acció que
     el lead (curadoria encara no activa) negue. */
  expect(pagina.subtitle).toBe('Aportacions culturals amb curadoria humana');
  expect(pagina.image).toBe('/assets/ui/plugins/nodrir_la_iaia_vinyeta.webp');
  expect(pagina.imageAlt.length).toBeGreaterThan(20);
  expect(Object.keys(pagina.translations).sort()).toEqual(['en', 'es', 'eu', 'gl']);
  expect(Object.fromEntries(Object.entries(pagina.translations).map(([llengua, copia]) => [llengua, copia.subtitle]))).toEqual({
    es: 'Aportaciones culturales con revisión humana',
    en: 'Cultural contributions with human review',
    eu: 'Kultura ekarpenak, giza berrikuspenarekin',
    gl: 'Achegas culturais con revisión humana'
  });
  for (const copia of [pagina, ...Object.values(pagina.translations)]) {
    expect(copia.imageAlt?.length).toBeGreaterThan(20);
    expect(JSON.stringify(copia)).not.toMatch(PROHIBIT);
    expect(copia.html).toMatch(/<h3>[^<]+<\/h3><p>[^<]+<\/p>/);
  }
});
