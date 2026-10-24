import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* T6b (IDEA-14; decisió del Mestre, 261024) · L'altra banda ho sap: «Veïnat
   connectat amb tu» a la fitxa pròpia d'una persona i «Veïnat connectat amb
   {nom}» a la gestió dels membres d'una organització. Sense la capacitat, res
   i cap crida; amb ella, quiEmSegueix amb la configuració i el senyal, la
   llista tal com la torna el port (per data), el buit i els errors honestos.
   Les claus section.perfil.seguidors.* són a les cinc llengües.
   Actualitzada a posta (P1-11, pla 261024_2230; G1945-04 de Gemini, ordre del
   Mestre): només canvien els textos, no el model ni els noms de les peces. */
const m = vi.hoisted(() => ({ caps: new Set(['seguiments']), qui: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  quiEmSegueix: (...args) => m.qui(...args)
}));
import { GentQueEtSegueix, QuiSegueixOrganitzacio, dataDelSeguiment, textDErrorDeSeguidors } from './Seguidors.jsx';
import { GestioMembres } from './GestioMembres.jsx';
import { MISSATGES_SEGUIMENTS, errorDeSeguiment } from '../../data/contracte.js';

const SEGUIDORS = [
  { id: 'u-2', nom: 'Pepa Garcia', creatAl: '2026-10-24T09:00:00Z' },
  { id: 'u-1', nom: null, creatAl: null }
];
const ambCodi = (code, message = 'Missatge del port.') => Object.assign(new Error(message), { code });

afterEach(cleanup);
beforeEach(() => {
  m.caps = new Set(['seguiments']);
  m.qui.mockReset();
  m.qui.mockResolvedValue(SEGUIDORS);
});

describe('GentQueEtSegueix · a la fitxa pròpia', () => {
  test('sense la capacitat, ni bloc ni crida', () => {
    m.caps = new Set();
    const { container } = render(<GentQueEtSegueix config={{ dataMode: 'seed' }} />);
    expect(container.innerHTML).toBe('');
    expect(m.qui).not.toHaveBeenCalled();
  });

  test('demana el veïnat connectat amb tu (sense entitat) amb la configuració i el senyal, i pinta la llista en l’ordre del port', async () => {
    render(<GentQueEtSegueix config={{ dataMode: 'seed' }} />);
    const seccio = screen.getByRole('region', { name: 'Veïnat connectat amb tu' });
    expect(within(seccio).getByText('Carregant el veïnat connectat amb tu…')).toBeTruthy();
    await waitFor(() => expect(m.qui).toHaveBeenCalledWith({}, expect.objectContaining({ dataMode: 'seed', signal: expect.any(AbortSignal) })));
    const llista = await within(seccio).findByRole('list', { name: 'Veïnat connectat amb tu' });
    const files = within(llista).getAllByRole('listitem').map((li) => li.textContent);
    expect(files).toEqual([`Pepa Garcia · ${dataDelSeguiment('2026-10-24T09:00:00Z')}`, 'Sense nom']);
    expect(llista.querySelector('time').getAttribute('datetime')).toBe('2026-10-24T09:00:00Z');
    expect(within(seccio).getByText(/cap algoritme no hi decidix res/)).toBeTruthy();
    /* Cap regió viva: és una lectura, no la resposta a cap acció. */
    expect(seccio.querySelector('[role="status"], [role="alert"], [aria-live]')).toBeNull();
  });

  test('el buit, el servidor sense l’esquema i una fallada qualsevol', async () => {
    m.qui.mockResolvedValueOnce([]);
    render(<GentQueEtSegueix />);
    expect(await screen.findByText('Encara no s’ha connectat ningú amb tu.')).toBeTruthy();
    cleanup();
    m.qui.mockRejectedValueOnce(ambCodi('NO-DISPONIBLE'));
    render(<GentQueEtSegueix />);
    expect(await screen.findByText('Este servidor encara no guarda el veïnat connectat amb tu.')).toBeTruthy();
    cleanup();
    m.qui.mockRejectedValueOnce(new Error('cru'));
    render(<GentQueEtSegueix />);
    expect(await screen.findByText('No s’ha pogut llegir el veïnat connectat amb tu. Torna-ho a provar més tard.')).toBeTruthy();
  });

  test('un port sense el mètode (llança de manera síncrona) és un error honest, no una pantalla trencada', async () => {
    m.qui.mockImplementation(() => { throw new Error('[backendPort] El mètode "quiEmSegueix" no està implementat al backend actual.'); });
    render(<GentQueEtSegueix />);
    expect(await screen.findByText(/No s’ha pogut llegir el veïnat connectat amb tu/)).toBeTruthy();
  });

  test('parla la llengua de la fitxa: el traductor i el locale arriben per props', async () => {
    const t = vi.fn((clau, reserva) => (clau === 'section.perfil.seguidors.titol' ? 'Neighbours connected with you' : reserva));
    render(<GentQueEtSegueix t={t} locale="en-GB" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Neighbours connected with you' })).toBeTruthy();
    await screen.findByRole('list');
    expect(screen.getByText(/Pepa Garcia/).textContent).toBe(`Pepa Garcia · ${dataDelSeguiment('2026-10-24T09:00:00Z', 'en-GB')}`);
    expect(t).toHaveBeenCalledWith('section.perfil.seguidors.ajuda', expect.any(String));
  });

  test('desmuntar-lo avorta la lectura i una resposta tardana no escriu res', async () => {
    let resol;
    m.qui.mockImplementationOnce((_opcions, config) => new Promise((r) => { resol = r; config.signal.addEventListener('abort', () => r([])); }));
    const { unmount } = render(<GentQueEtSegueix />);
    await waitFor(() => expect(m.qui).toHaveBeenCalledTimes(1));
    const [[, config]] = m.qui.mock.calls;
    expect(config.signal.aborted).toBe(false);
    unmount();
    expect(config.signal.aborted).toBe(true);
    resol(SEGUIDORS);
    await Promise.resolve();
  });
});

describe('QuiSegueixOrganitzacio · per a qui administra', () => {
  test('demana el veïnat connectat amb l’entitat i pinta la taula «Veïnat connectat amb {nom}»', async () => {
    render(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Veïnat connectat amb Forn' })).toBeTruthy();
    expect(screen.getByText('Carregant el veïnat connectat amb Forn…')).toBeTruthy();
    await waitFor(() => expect(m.qui).toHaveBeenCalledWith({ orgId: 'O' }, expect.objectContaining({ signal: expect.any(AbortSignal) })));
    const taula = await screen.findByRole('region', { name: 'Veïnat connectat amb Forn' });
    const files = [...taula.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent));
    expect(files).toEqual([['Pepa Garcia', dataDelSeguiment('2026-10-24T09:00:00Z')], ['Sense nom', '']]);
    expect(screen.getByText('Cada persona d’esta llista ha triat connectar amb Forn. Esta llista només la veu qui l’administra.')).toBeTruthy();
  });

  /* Actualitzada a posta (261024 correccions): motiu, R3-12. El text de l'error ve del
     `code`, mai del `message`: el de NO-DISPONIBLE era per a qui desplega. */
  test('el buit i els errors pel seu codi: cap error no pinta el seu message', async () => {
    m.qui.mockResolvedValueOnce([]);
    render(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(await screen.findByText('Encara no s’ha connectat ningú amb Forn.')).toBeTruthy();
    cleanup();
    m.qui.mockRejectedValueOnce(ambCodi('SDP-SEG-005', 'Només qui administra l’entitat veu qui la seguix.'));
    render(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(await screen.findByText('Només qui administra Forn pot vore esta llista.')).toBeTruthy();
    cleanup();
    m.qui.mockRejectedValueOnce(errorDeSeguiment('NO-DISPONIBLE'));
    render(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(await screen.findByText('Este servidor encara no guarda el veïnat connectat amb Forn.')).toBeTruthy();
    expect(screen.queryByText(/migració/)).toBeNull();
    cleanup();
    m.qui.mockRejectedValueOnce(new Error('[vitest] sense codi'));
    render(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(await screen.findByText('No s’ha pogut llegir el veïnat connectat amb Forn.')).toBeTruthy();
  });

  test('R3-12 · cap codi del contracte (ni un de desconegut amb text de servidor) no arriba en cru a cap de les dues llistes', async () => {
    const errors = [...Object.keys(MISSATGES_SEGUIMENTS).map((code) => errorDeSeguiment(code)),
      ambCodi('PGRST202', 'Could not find the function public.qui_em_segueix in the schema cache')];
    for (const error of errors) {
      for (const peca of [<QuiSegueixOrganitzacio key="o" orgId="O" nom="Forn" />, <GentQueEtSegueix key="p" />]) {
        m.qui.mockRejectedValueOnce(error);
        const { container } = render(peca);
        await waitFor(() => expect(container.querySelector('.sdp-camp__error')).not.toBeNull());
        expect(container.textContent, `${error.code}`).not.toContain(error.message);
        expect(container.textContent, `${error.code}`).not.toMatch(/migració|schema cache|SDP-SEG|NO-DISPONIBLE/);
        cleanup();
      }
    }
  });

  test('textDErrorDeSeguidors: un text per codi, i el genèric per a la resta', () => {
    expect(textDErrorDeSeguidors({ code: 'SDP-SEG-000' }, 'Forn')).toBe('Cal entrar al compte per a vore el veïnat connectat amb Forn.');
    expect(textDErrorDeSeguidors({ code: 'DESCONEGUT', message: 'No s’ha pogut completar. Torna-ho a provar.' }, 'Forn')).toBe('No s’ha pogut llegir el veïnat connectat amb Forn.');
    expect(textDErrorDeSeguidors(null, 'Forn')).toBe('No s’ha pogut llegir el veïnat connectat amb Forn.');
  });

  test('sense capacitat o sense organització, res', () => {
    const { container, rerender } = render(<QuiSegueixOrganitzacio orgId={null} nom="Forn" />);
    expect(container.innerHTML).toBe('');
    m.caps = new Set();
    rerender(<QuiSegueixOrganitzacio orgId="O" nom="Forn" />);
    expect(container.innerHTML).toBe('');
    expect(m.qui).not.toHaveBeenCalled();
  });

  test('GestioMembres la pinta davall de la gestió, amb el nom de l’organització', async () => {
    const accions = {
      usuariId: 'JO',
      llistaMembres: vi.fn(async () => [{ tipus: 'persona', id: 'JO', nom: 'Jo', avatar: '', rol: 'owner', desDe: null }]),
      desaMembre: vi.fn(), llevaMembre: vi.fn(), cercaCandidats: vi.fn(async () => [])
    };
    render(<GestioMembres organitzacio={{ id: 'O', mena: 'empresa', nom: 'Forn', dades: { id: 'O', name: 'Forn', role: 'owner' } }} accions={accions} />);
    expect(await screen.findByRole('region', { name: 'Membres de Forn' })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Veïnat connectat amb Forn' })).toBeTruthy();
    expect(m.qui).toHaveBeenCalledWith({ orgId: 'O' }, expect.any(Object));
    /* L'únic role="status" continua sent el de la gestió («Carregant els membres…» o els avisos). */
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });
});

test('dataDelSeguiment: la data llarga de la llengua, o buida si no n’hi ha', () => {
  expect(dataDelSeguiment('2026-10-24T09:00:00Z')).toBe(new Date('2026-10-24T09:00:00Z').toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
  for (const buida of [null, '', 'no-es-cap-data']) expect(dataDelSeguiment(buida)).toBe('');
  expect(dataDelSeguiment('2026-10-24T09:00:00Z', 'xx-invalid-locale-!!')).not.toBe('');
});

/* Les claus de cada llengua es lligen del text de la font, com
   src/config/i18n.moderacio.test.js: el diccionari no s'exporta. */
describe('section.perfil.seguidors.* a les cinc llengües', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  const clausDe = (llengua) => new Map([...readFileSync(path.join(process.cwd(), `src/config/idiomes/${llengua}.js`), 'utf8')
    .matchAll(/^\s*'(section\.perfil\.seguidors\.[\w.]+)'\s*:\s*(['"])(.*)\2,?\s*$/gm)].map((x) => [x[1], x[3]]));
  const font = readFileSync(path.join(process.cwd(), 'src/sections/profile/Seguidors.jsx'), 'utf8');
  const usades = new Map([...font.matchAll(/t\('(section\.perfil\.seguidors\.[\w.]+)', '([^']*)'\)/g)].map((x) => [x[1], x[2]]));

  test('totes les claus que llig el bloc són a les cinc llengües, cap de buida, i el valencià és la reserva del codi', () => {
    expect([...usades.keys()].sort()).toEqual(['ajuda', 'buit', 'carregant', 'error', 'noDisponible', 'senseNom', 'titol'].map((c) => `section.perfil.seguidors.${c}`));
    const ca = clausDe('ca');
    for (const [clau, reserva] of usades) expect(ca.get(clau), clau).toBe(reserva);
    for (const llengua of LLENGUES) {
      const claus = clausDe(llengua);
      expect([...claus.keys()].sort(), llengua).toEqual([...usades.keys()].sort());
      for (const [clau, valor] of claus) {
        expect(valor.trim(), `${llengua}: ${clau}`).not.toBe('');
        expect(valor, `${llengua}: ${clau}`).not.toMatch(/\{\w+\}/);
      }
      if (llengua !== 'ca') for (const clau of claus.keys()) expect(claus.get(clau), `${llengua}: ${clau}`).not.toBe(ca.get(clau));
    }
  });
});
