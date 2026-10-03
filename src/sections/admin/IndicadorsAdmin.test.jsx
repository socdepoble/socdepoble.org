/* El bloc «Indicadors» del Tauler (decisió del Mestre 261003, «Graphfy»):
   render amb jsdom i el port simulat. jsdom no pinta: es comproven els noms
   accessibles, el text per al lector, els estats, la crida al port i que
   cap persona arriba a la pantalla, no alçades ni colors. Dades sintètiques. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ caps: new Set(), usuaris: vi.fn(), entitats: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args)
}));
import { IndicadorsAdmin, LIMIT_PERSONES } from './IndicadorsAdmin.jsx';

const ARA = new Date('2026-10-15T10:00:00Z');
const DIA = 24 * 60 * 60 * 1000;
let seq = 0;
const persona = (created_at, dies = 3) => {
  seq += 1;
  return { id: `p-${seq}`, email: `persona${seq}@poble.test`, created_at, last_sign_in_at: dies === null ? null : new Date(ARA.getTime() - dies * DIA).toISOString() };
};
const repetix = (n, fes) => Array.from({ length: n }, fes);
const entitat = (kind, i) => ({ id: `o-${i}`, name: `Entitat sintètica ${i}`, slug: `entitat-${i}`, kind, description: '', created_at: '2026-01-01T00:00:00Z' });

/* 31 persones: 9 al juny (fa 100 dies), 7 al juliol (fa 40), 3 a l'agost
   (mai) i 12 al setembre (fa 3). */
const PERSONES = [
  ...repetix(9, () => persona('2026-06-10T08:00:00Z', 100)),
  ...repetix(7, () => persona('2026-07-05T08:00:00Z', 40)),
  ...repetix(3, () => persona('2026-08-02T08:00:00Z', null)),
  ...repetix(12, () => persona('2026-09-12T16:00:00Z', 3))
];
const ENTITATS = [entitat('company', 1), entitat('company', 2), entitat('group', 3)];

const PREGUNTES = [
  'Quantes persones s’han donat d’alta cada mes?',
  'Quan van entrar per última vegada?',
  'De quin tipus són les entitats?'
];
const lector = (figura) => [...figura.querySelectorAll('.sdp-nomes-lector')].map((s) => s.textContent);
const TEXT_PROTEGIDES = 'Algunes xifres es protegixen: sense això, restant del total es podria saber la d’un grup de menys de 5.';

/* Demana els indicadors amb el botó, com ho faria el superadmin. */
function calcula() {
  fireEvent.click(screen.getByRole('button', { name: 'Calcula els indicadors' }));
}

/* Les files d'una Taula: { etiqueta, text }. */
const files = (titol) => [...screen.getByRole('region', { name: titol }).querySelectorAll('tbody tr')]
  .map((tr) => ({ etiqueta: tr.querySelector('th').textContent, text: tr.querySelector('td').textContent }));

/* L'intrús que llig una Taula i sap el total de la sèrie: d'una xifra en sap
   el valor; d'un «menys de 5», que va d'1 a 4; d'una «xifra protegida», que
   és 5 o més. Torna, per a cada «menys de 5», els valors que encaixen. */
function valorsPossibles(celles, total) {
  const domini = (text) => {
    if (text === 'menys de 5') return [1, 4];
    if (text === 'xifra protegida') return [5, Infinity];
    const n = Number(text.replace('.', ''));
    return [n, n];
  };
  return celles.flatMap((cella, i) => {
    if (cella !== 'menys de 5') return [];
    const altres = celles.filter((_, j) => j !== i).map(domini);
    const minim = altres.reduce((s, [a]) => s + a, 0);
    const maxim = altres.reduce((s, [, b]) => s + b, 0);
    return [[1, 2, 3, 4].filter((v) => total - v >= minim && total - v <= maxim)];
  });
}

beforeEach(() => {
  m.caps = new Set(['admin']);
  m.usuaris.mockReset().mockResolvedValue(PERSONES);
  m.entitats.mockReset().mockResolvedValue(ENTITATS);
});
afterEach(cleanup);

describe('IndicadorsAdmin', () => {
  test('en muntar-se no crida el port: diu què es baixarà i espera que es demane', () => {
    render(<IndicadorsAdmin ara={ARA} />);
    const regio = screen.getByRole('region', { name: 'Indicadors' });
    expect(within(regio).getByText('Els indicadors es calculen quan els demanes')).toBeTruthy();
    expect(regio.textContent).toContain(`la llista de fins a ${LIMIT_PERSONES} persones, amb el correu de cadascuna`);
    expect(within(regio).getByRole('button', { name: 'Calcula els indicadors' })).toBeTruthy();
    expect(m.usuaris).not.toHaveBeenCalled();
    expect(m.entitats).not.toHaveBeenCalled();
    expect(screen.queryByRole('figure')).toBeNull();
  });

  test('en demanar-ho, carrega i després tres preguntes amb la seua figura i la seua taula', async () => {
    const { container } = render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect(screen.getByRole('status')).toHaveProperty('textContent', 'Carregant els indicadors…');
    expect(screen.queryByRole('button', { name: 'Calcula els indicadors' })).toBeNull();

    const figures = await screen.findAllByRole('figure');
    expect(figures).toHaveLength(3);
    PREGUNTES.forEach((pregunta, i) => expect(screen.getByRole('figure', { name: pregunta })).toBe(figures[i]));
    expect(m.usuaris).toHaveBeenCalledTimes(1);
    expect(m.usuaris).toHaveBeenCalledWith(LIMIT_PERSONES, 0);
    expect(m.entitats).toHaveBeenCalledTimes(1);
    expect(LIMIT_PERSONES).toBe(500);

    const [altes, accessos, tipus] = figures;
    expect(within(altes).getAllByRole('listitem')).toHaveLength(12);
    expect(lector(altes).slice(7)).toEqual([
      'juny de 2026: 9 altes', 'juliol de 2026: xifra protegida', 'agost de 2026: menys de 5 altes',
      'setembre de 2026: 12 altes', 'octubre de 2026 (mes en curs, parcial): 0 altes'
    ]);
    expect(lector(accessos)).toEqual([
      'Fa 30 dies o menys: 12 persones', 'Fa de 31 a 90 dies: 7 persones', 'Fa de 91 a 365 dies: xifra protegida',
      'Fa més d’un any: 0 persones', 'No han entrat mai: menys de 5 persones'
    ]);
    expect(lector(tipus)).toEqual(['Empreses o negocis: 2 entitats', 'Grups: 1 entitat', 'Entitats: 0 entitats', 'Ajuntaments: 0 entitats']);

    // La xifra no va damunt de les barres: és a la Taula.
    expect([...container.querySelectorAll('.sdp-histograma__valor')].every((v) => v.textContent === '')).toBe(true);
    for (const nom of ['Altes per mes, en xifres', 'Última entrada, en xifres', 'Entitats per tipus, en xifres']) {
      expect(screen.getByRole('region', { name: nom }).querySelector('table')).not.toBeNull();
    }
    expect(files('Altes per mes, en xifres').slice(7).map((f) => f.text)).toEqual(['9', 'xifra protegida', 'menys de 5', '12', '0']);
    // Amb grups amagats, cap total que els delate per resta; les entitats sí que en porten.
    expect(screen.getByRole('region', { name: 'Altes per mes, en xifres' }).querySelector('tfoot')).toBeNull();
    expect(screen.getByRole('region', { name: 'Última entrada, en xifres' }).querySelector('tfoot')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Entitats per tipus, en xifres' })).getByRole('rowheader', { name: 'Total' }).nextElementSibling.textContent).toBe('3');
    expect(screen.getAllByText(TEXT_PROTEGIDES)).toHaveLength(2);
  });

  test('el mes en curs, que encara no ha acabat, va remarcat i amb el seu nom davall', async () => {
    const novembre = new Date('2026-11-20T10:00:00Z');
    render(<IndicadorsAdmin ara={novembre} />);
    calcula();
    const [altes] = await screen.findAllByRole('figure');
    const columnes = within(altes).getAllByRole('listitem');
    const remarcades = columnes.filter((li) => li.classList.contains('sdp-histograma__columna--destacada'));
    expect(remarcades).toHaveLength(1);
    expect(remarcades[0]).toBe(columnes[11]);
    expect(remarcades[0].querySelector('.sdp-histograma__marca').textContent).toBe('nov.');
    expect(remarcades[0].querySelector('.sdp-nomes-lector').textContent).toBe('novembre de 2026 (mes en curs, parcial): 0 altes');
    // La marca d'octubre li cedix el lloc: dos marques juntes se solaparien.
    expect(columnes[10].querySelector('.sdp-histograma__marca').textContent).toBe('');
    expect(files('Altes per mes, en xifres')[11].etiqueta).toBe('novembre de 2026 (mes en curs, parcial)');
  });

  /* Els dos casos dels revisors, llegint només la pantalla: un intrús que sap
     el total de persones (totes les altes cauen dins de la finestra) no pot
     traure restant cap xifra «menys de 5», en cap de les dues taules. */
  const casosRevisors = {
    'tots donats d’alta al setembre, 3 sense entrar mai': [
      ...repetix(10, () => persona('2026-09-12T16:00:00Z', 3)),
      ...repetix(3, () => persona('2026-09-12T16:00:00Z', null))
    ],
    '6 altes al setembre i 3 a l’agost, tots recents': [
      ...repetix(6, () => persona('2026-09-12T16:00:00Z', 3)),
      ...repetix(3, () => persona('2026-08-02T08:00:00Z', 3))
    ]
  };
  for (const [nom, persones] of Object.entries(casosRevisors)) {
    test(`el bloc sencer, ${nom}: cap xifra amagada ix restant, ni creuant les taules`, async () => {
      m.usuaris.mockResolvedValue(persones);
      render(<IndicadorsAdmin ara={ARA} />);
      calcula();
      await screen.findAllByRole('figure');
      const taules = ['Altes per mes, en xifres', 'Última entrada, en xifres'].map((titol) => files(titol).map((f) => f.text));
      expect(taules.flat()).toContain('menys de 5');
      for (const celles of taules) {
        for (const valors of valorsPossibles(celles, persones.length)) expect(valors).toEqual([1, 2, 3, 4]);
      }
    });
  }

  test('privacitat i Pedra Seca: cap correu, cap identificador i cap style=', async () => {
    const { container } = render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    await screen.findAllByRole('figure');
    const text = container.textContent;
    for (const p of PERSONES) {
      expect(text).not.toContain(p.email);
      expect(text).not.toContain(p.id);
    }
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense la capacitat «admin», ho diu, no oferix el botó i no crida el port', () => {
    m.caps = new Set();
    render(<IndicadorsAdmin ara={ARA} />);
    expect(screen.getByText('Este node no oferix les dades d’administració: no hi ha indicadors per mostrar.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(m.usuaris).not.toHaveBeenCalled();
    expect(m.entitats).not.toHaveBeenCalled();
    expect(screen.queryByRole('figure')).toBeNull();
  });

  test('error de permisos o de xarxa: una alerta, cap gràfic i un reintent', async () => {
    m.usuaris.mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: '42501' }));
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No s’han pogut carregar els indicadors');
    expect(screen.queryByRole('figure')).toBeNull();
    fireEvent.click(within(alerta).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await screen.findAllByRole('figure')).toHaveLength(3);
    expect(m.usuaris).toHaveBeenCalledTimes(2);
  });

  test('un port que llança de manera síncrona també acaba en l’alerta', async () => {
    m.entitats.mockImplementation(() => { throw new Error('[backendPort] El mètode no està implementat'); });
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect((await screen.findByRole('alert')).textContent).toContain('No s’han pogut carregar els indicadors');
  });

  test('buit: l’estat buit de cada pregunta i cap taula', async () => {
    m.usuaris.mockResolvedValue([]);
    m.entitats.mockResolvedValue(null);
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect(await screen.findAllByText('Encara no hi ha cap persona registrada.')).toHaveLength(2);
    expect(screen.getByText('Encara no hi ha cap entitat.')).toBeTruthy();
    expect(screen.queryByRole('figure')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  test('zeros i un sol tipus: totes les barres hi són, a zero les que no en tenen', async () => {
    m.usuaris.mockResolvedValue(repetix(5, () => persona('2025-01-01T00:00:00Z', 500)));
    m.entitats.mockResolvedValue([entitat('city_hall', 1)]);
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    const [altes, , tipus] = await screen.findAllByRole('figure');
    expect(lector(altes).every((t) => t.endsWith(': 0 altes'))).toBe(true);
    expect(lector(tipus)[0]).toBe('Ajuntaments: 1 entitat');
    expect(within(tipus).getAllByRole('listitem')).toHaveLength(4);
    // Sense grups amagats, el total dels 12 mesos (zero) sí que hi és.
    expect(within(screen.getByRole('region', { name: 'Altes per mes, en xifres' })).getByRole('rowheader', { name: 'Total dels 12 mesos' }).nextElementSibling.textContent).toBe('0');
    expect(screen.queryByText(TEXT_PROTEGIDES)).toBeNull();
  });

  test('tan poques persones que una pregunta no es pot mostrar: ho diu, sense figura ni taula', async () => {
    m.usuaris.mockResolvedValue(repetix(3, () => persona('2026-09-12T16:00:00Z', null)));
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect(await screen.findAllByText(/^No es mostra: amb tan poques persones/)).toHaveLength(2);
    expect(screen.getByText(PREGUNTES[0])).toBeTruthy();
    expect(screen.getByText(PREGUNTES[1])).toBeTruthy();
    expect(screen.getAllByRole('figure').map((f) => f.querySelector('figcaption').textContent)).toEqual([PREGUNTES[2]]);
    expect(screen.queryByRole('region', { name: 'Altes per mes, en xifres' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Última entrada, en xifres' })).toBeNull();
  });

  test('dates il·legibles: un avís amb el recompte, protegit si és petit', async () => {
    // Sis altes il·legibles i dotze bones; dues de les bones, amb una entrada il·legible.
    m.usuaris.mockResolvedValue([
      ...repetix(6, () => persona('no és una data')),
      ...repetix(10, () => persona('2026-09-01T00:00:00Z')),
      ...repetix(2, () => ({ ...persona('2026-09-01T00:00:00Z'), last_sign_in_at: 'ahir' }))
    ]);
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect(await screen.findByText('Registres sense data vàlida, que no s’han comptat: 6.')).toBeTruthy();
    expect(screen.getByText('Registres sense data vàlida, que no s’han comptat: menys de 5.')).toBeTruthy();
    // El tram que cobrix les dues entrades il·legibles queda protegit.
    expect(files('Última entrada, en xifres')[0].text).toBe('xifra protegida');
  });

  test('al sostre del servidor, avisa que les xifres de persones són parcials', async () => {
    m.usuaris.mockResolvedValue(repetix(LIMIT_PERSONES, () => persona('2026-09-12T16:00:00Z')));
    render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    expect(await screen.findByText('Xifres parcials')).toBeTruthy();
  });

  test('un muntatge nou torna a esperar: no es baixa res sense demanar-ho', async () => {
    const { unmount } = render(<IndicadorsAdmin ara={ARA} />);
    calcula();
    await screen.findAllByRole('figure');
    unmount();
    render(<IndicadorsAdmin ara={ARA} />);
    expect(screen.getByRole('button', { name: 'Calcula els indicadors' })).toBeTruthy();
    expect(screen.queryByRole('figure')).toBeNull();
    expect(m.usuaris).toHaveBeenCalledTimes(1);
  });
});
