/* Gestoria · Tauler · CabinaAvio: la vista Cabina d'Avió (ordre del Mestre,
   13-10-2026, pla 261013_1405, front E), pintada amb el model de veres
   (dadesDelTauler) i amb models fets a mà per als estats de privacitat.
   Extractes sintètics de la Norma 43 (l'entitat 9999 de prova, comptes
   inventats, «TITULAR SINTETIC») i factures de prova. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { resumHisenda } from '../impostos/nucli/impostos.js';
import { llegeixC43 } from '../nucli/c43.js';
import { crearFactura } from '../nucli/model.js';
import { CabinaAvio } from './CabinaAvio.jsx';
import { cabinaDelTauler, diesDeCobertura } from './nucli/cabinaAvio.js';
import { dadesDelTauler, hisendaSobreCaixa } from './nucli/targetesTauler.js';
import { reduixC43 } from './nucli/tractorTauler.js';
import { ContextTrimestre, VISTES_PANELL, VISTES_TAULER, vistaDelModul } from './Tauler.jsx';

afterEach(() => cleanup());

/* ── Norma 43 sintètica (les posicions de c43.js, com a resumTauler.test.js) ── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE_A = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const r11 = (c, { inici, fi, dh = '2', saldo = 0, divisa = '978' }) =>
  `11${c.entitat}${c.oficina}${c.compte}${inici}${fi}${dh}${xifres(saldo, 14)}${divisa}3${text('TITULAR SINTETIC', 26)}${text('', 3)}`;
const r22 = ({ op, dh = '1', centims, comu = '99' }) =>
  `22${text('', 4)}0001${op}${op}${comu}000${dh}${xifres(centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`;
const r33 = (c, { nDeure, deure, nHaver, haver, dh = '2', saldo, divisa = '978' }) =>
  `33${c.entitat}${c.oficina}${c.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(nHaver, 5)}${xifres(haver, 14)}${dh}${xifres(saldo, 14)}${divisa}${text('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${text('', 54)}`;
const fitxer = (linies) => `${[...linies, r88(linies.length)].join('\r\n')}\r\n`;
const lecturaDe = (...extractes) => ({
  extractes: extractes.map((linies) => ({ lectura: reduixC43(llegeixC43(fitxer(linies))) })), csv: [], identitat: null, avisos: []
});

/* Del 01/04/26 al 30/06/26: 5.000,00 € d'inici, quatre càrrecs i un abonament; acaba amb 4.400,00 €. */
const TRIMESTRE_A = [
  r11(COMPTE_A, { inici: '260401', fi: '260630', saldo: 500000 }),
  r22({ op: '260410', centims: 60000 }),
  r22({ op: '260510', centims: 60000 }),
  r22({ op: '260605', dh: '2', centims: 150000 }),
  r22({ op: '260610', centims: 60000 }),
  r22({ op: '260620', centims: 30000 }),
  r33(COMPTE_A, { nDeure: 4, deure: 210000, nHaver: 1, haver: 150000, saldo: 440000 })
];
const d = (a, m, dia) => ({ a, m, d: dia });
const AVUI = d(2026, 10, 4);
const VENDA_3T = crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0201', contrapart: 'Client de Prova', subtotal: '1000,00', iva: '210,00', total: '1210,00' });
const DADES = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), factures: [VENDA_3T], avui: AVUI, periode: { any: 2026, t: 3 } });
/* Totes les xifres que el model sap: cap pot ser al DOM amb l'ull tancat. */
const IMPORTS = /4\.400,00|410,00|210,00|200,00|702,39|1\.500,00|600,00|900,00|10,73|\d vegades/;
const DIES = diesDeCobertura({ saldo: 440000, despesaMensual: DADES.resum.cobertura.despesaMensual });

const serialitzat = (node) => new XMLSerializer().serializeToString(node);
const encapcalaments = (node) => [...node.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => h.textContent);
const ESTATICS = ['Cabina d’Avió', 'Instruments', 'Flux de caixa per mes', 'Venciments'];

function munta(dades, visible = false) {
  const onObri = vi.fn();
  const vista = render(<CabinaAvio dades={dades} visible={visible} onObri={onObri} />);
  return { ...vista, onObri, cabina: vista.container.querySelector('.sdp-gestoria-cabina') };
}

describe('la Cabina d’Avió amb l’ull tancat', () => {
  test('cap xifra, cap Histograma ni cap avís d’estimació: «Gràfics amagats» i els imports amagats', () => {
    const { cabina } = munta(DADES);
    expect(cabina.querySelector('.sdp-histograma')).toBeNull();
    expect(within(cabina).getByText('Gràfics amagats')).toBeTruthy();
    expect(serialitzat(cabina)).not.toMatch(IMPORTS);
    expect(serialitzat(cabina)).not.toMatch(new RegExp(`\\b${DIES} dies`));
    expect(within(cabina).queryByText('Estimació incompleta')).toBeNull();
    const valors = [...cabina.querySelectorAll('.sdp-gestoria-cabina__valor')].map((dd) => dd.textContent);
    expect(valors).toEqual([
      'Import amagat', 'Import amagat', 'Xifra amagada', 'Import amagat', 'Import amagat', 'Import amagat', 'Xifra amagada', 'Xifra amagada'
    ]);
    /* La Taula del flux hi és, amb els imports amagats; la cobertura de cada mes no és cap xifra. */
    const flux = within(cabina).getByRole('region', { name: 'Taula · Flux de caixa per mes' });
    expect(within(flux).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Abril 2026', 'Maig 2026', 'Juny 2026']);
    expect(within(flux).getAllByText('Mes sencer')).toHaveLength(3);
    expect(within(flux).getAllByText('Import amagat')).toHaveLength(9);
  });

  test('les dates es veuen: el dia de referència, els extractes antics i els venciments', () => {
    const { cabina } = munta(DADES);
    expect(within(cabina).getByText('Les xifres del banc són del 30/06/2026, l’últim dia dels extractes.')).toBeTruthy();
    expect(within(cabina).getByText('Extractes antics')).toBeTruthy();
    expect(within(cabina).getByText(/^L’últim dia dels extractes és de fa 96 dies/)).toBeTruthy();
    expect(within(cabina).getByText('303 i 130 · 3T 2026').tagName).toBe('P');
    expect(within(cabina).getByText('La presentació acaba el 20/10/2026: queden 16 dies.')).toBeTruthy();
    expect(within(cabina).getByText('La presentació va del 01/01/2027 al 30/01/2027.')).toBeTruthy();
    expect(within(cabina).getByText('Terminis orientatius: a verificar amb la gestoria.')).toBeTruthy();
    /* La presentació oberta és un avís; la propera, informació. Cap regió viva: no s'anuncien soles. */
    const alertes = [...cabina.querySelectorAll('.sdp-gestoria-cabina__venciments .sdp-alerta')];
    expect(alertes.map((a) => a.className)).toEqual(['sdp-alerta sdp-alerta--avis', 'sdp-alerta sdp-alerta--info']);
    expect(alertes.every((a) => !a.hasAttribute('role'))).toBe(true);
  });
});

describe('la Cabina d’Avió amb l’ull obert', () => {
  test('les xifres, amb la seua unitat, i els dos gràfics del flux amb el mateix sostre', () => {
    const { cabina } = munta(DADES, true);
    const valorDe = (nom) => within(cabina).getByRole('button', { name: nom }).closest('.sdp-gestoria-cabina__instrument')
      .querySelector('.sdp-gestoria-cabina__valor').textContent;
    expect(valorDe('Caixa real')).toBe('4.400,00 €');
    expect(valorDe('Despesa mensual mitjana')).toBe('702,39 €');
    expect(valorDe('Dies de cobertura')).toBe(`${DIES} dies`);
    expect(valorDe('IVA · model 303')).toBe('210,00 €');
    expect(valorDe('IRPF · model 130')).toBe('200,00 €');
    expect(valorDe('Hisenda a pagar')).toBe('410,00 €');
    expect(valorDe('Liquiditat davant de Hisenda')).toBe('10,73 vegades');
    expect(within(cabina).getAllByText('Estimació incompleta').length).toBeGreaterThan(0);
    const grafics = [...cabina.querySelectorAll('figure.sdp-histograma')];
    expect(grafics.map((g) => g.querySelector('figcaption').textContent)).toEqual(['Entrades per mes', 'Eixides per mes']);
    expect(grafics.map((g) => g.querySelectorAll('li').length)).toEqual([3, 3]);
    /* El sostre comú: les eixides de juny (900,00 €) davant de les entrades de juny (1.500,00 €), al 60 %. */
    expect(grafics[1].querySelectorAll('li')[2].querySelector('.sdp-histograma__barra').className).toMatch(/--n6$/);
    expect(grafics[0].querySelectorAll('li')[2].querySelector('.sdp-histograma__barra').className).toMatch(/--n10$/);
    expect(within(grafics[1]).getByText('Juny 2026: 900,00 €')).toBeTruthy();
    expect(within(cabina).queryByText('Gràfics amagats')).toBeNull();
    /* El net negatiu, que el gràfic no pinta, és a la Taula. */
    const flux = within(cabina).getByRole('region', { name: 'Taula · Flux de caixa per mes' });
    expect(within(flux).getAllByText('-600,00 €')).toHaveLength(2);
  });

  test('cada instrument obri la pàgina de la seua targeta', () => {
    const { cabina, onObri } = munta(DADES, true);
    const targetes = new Set(DADES.targetes.map((t) => t.id));
    for (const instrument of DADES.cabina.instruments) {
      fireEvent.click(within(cabina).getByRole('button', { name: instrument.titol }));
      expect(onObri).toHaveBeenLastCalledWith(instrument.targeta);
      expect(targetes.has(instrument.targeta), instrument.id).toBe(true);
    }
    expect(onObri).toHaveBeenCalledTimes(8);
  });
});

describe('Pedra Seca i privacitat de la Cabina', () => {
  test('cap encapçalament porta dades, amb l’ull tancat i obert, amb dades i sense', () => {
    for (const dades of [DADES, dadesDelTauler({ avui: AVUI })]) {
      for (const visible of [false, true]) {
        const { cabina } = munta(dades, visible);
        expect(encapcalaments(cabina)).toEqual(ESTATICS);
        expect(cabina.querySelector('h1')).toBeNull();
        expect(cabina.querySelectorAll('[style]')).toHaveLength(0);
        cleanup();
      }
    }
  });

  test('el codi no porta cap style= ni cap h1', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler/CabinaAvio.jsx'), 'utf8');
    expect(codi).not.toMatch(/\sstyle=/);
    expect(codi).not.toMatch(new RegExp(['<h', '1[\\s>]'].join('')));
  });

  /* Mirall de la capçalera de context (ShellGestoria.test.jsx, revisió adversarial del 261012): amb l'ull tancat,
     la Cabina no pot dir si hi ha res a pagar ni si la caixa és en descobert. */
  test('res a pagar, una ràtio i una caixa en descobert es pinten igual amb l’ull tancat, i diferent amb l’ull obert', () => {
    const cabinaAmb = (saldo, total, completa) => {
      const caixa = { saldo, completa: true };
      const hisenda = { total, completa };
      return {
        avisos: [],
        cabina: cabinaDelTauler({
          resum: { caixa, cobertura: { despesaMensual: 100000 } }, hisenda,
          liquidacio: hisendaSobreCaixa({ hisenda, caixa }), avui: AVUI, finestres: [{ any: 2026, t: 3 }]
        })
      };
    };
    const estats = [cabinaAmb(10000, 0, false), cabinaAmb(10000, 3000, true), cabinaAmb(-500, 3000, true)];
    const instruments = (dades, visible) => {
      const { cabina } = munta(dades, visible);
      const resultat = serialitzat(cabina.querySelector('.sdp-gestoria-cabina__instruments'));
      cleanup();
      return resultat;
    };
    const amagats = estats.map((dades) => instruments(dades, false));
    expect(new Set(amagats).size).toBe(1);
    expect(amagats[0]).not.toMatch(/surten a pagar|descobert|incompleta|\d vegades|1\.000,00|100,00|30,00|5,00/);
    const oberts = estats.map((dades) => instruments(dades, true));
    expect(new Set(oberts).size).toBe(3);
    expect(oberts[0]).toMatch(/Ni el 303 ni el 130 d’este trimestre surten a pagar/);
    expect(oberts[1]).toMatch(/3,33 vegades/);
    expect(oberts[2]).toMatch(/zero o en descobert/);
  });

  /* Revisió adversarial 13-10-2026, troballa FIN-3: amb un model sense estimació, el «res» no diu que cap dels dos
     surt a pagar, i una estimació incompleta ho avisa al «res» i al descobert; amb l'ull tancat, tot igual. */
  test('liquiditat amb un model sense estimació: amb l’ull tancat, igual que la resta; amb l’ull obert, el que se sap i l’avís', () => {
    const model = (resultat, completa = true) => ({ resultat, completa });
    const cabinaAmb = ({ saldo = 10000, iva = null, irpf = null, hisenda = resumHisenda({ iva, irpf }) }) => {
      const caixa = { saldo, completa: true };
      return {
        avisos: [],
        cabina: cabinaDelTauler({
          resum: { caixa, cobertura: { despesaMensual: 100000 } }, iva, irpf, hisenda,
          liquidacio: hisendaSobreCaixa({ hisenda, caixa, iva, irpf }), avui: AVUI, finestres: [{ any: 2026, t: 3 }]
        })
      };
    };
    const estats = [
      cabinaAmb({ iva: model(-50000), irpf: model(0) }),
      cabinaAmb({ iva: model(-50000), irpf: model(null, false) }),
      cabinaAmb({ iva: model(null, false), irpf: model(0) }),
      cabinaAmb({ saldo: -500, hisenda: { total: 3000, completa: false } })
    ];
    const liquiditat = (dades, visible) => {
      const { cabina } = munta(dades, visible);
      const resultat = serialitzat(within(cabina).getByRole('button', { name: 'Liquiditat davant de Hisenda' }).closest('.sdp-gestoria-cabina__instrument'));
      cleanup();
      return resultat;
    };
    const amagats = estats.map((dades) => liquiditat(dades, false));
    expect(new Set(amagats).size).toBe(1);
    expect(amagats[0]).toMatch(/Xifra amagada/);
    expect(amagats[0]).not.toMatch(/surten a pagar|no surt a pagar|encara no hi ha estimació|descobert|incompleta/);
    const oberts = estats.map((dades) => liquiditat(dades, true));
    expect(oberts[0]).toMatch(/Ni el 303 ni el 130 d’este trimestre surten a pagar/);
    expect(oberts[0]).not.toMatch(/incompleta/);
    expect(oberts[1]).toMatch(/El 303 d’este trimestre no surt a pagar, i del 130 encara no hi ha estimació/);
    expect(oberts[2]).toMatch(/El 130 d’este trimestre no surt a pagar, i del 303 encara no hi ha estimació/);
    expect(oberts[3]).toMatch(/zero o en descobert/);
    for (const obert of oberts.slice(1)) expect(obert).toMatch(/Estimació incompleta/);
    for (const obert of oberts.slice(1, 3)) expect(obert).not.toMatch(/Ni el 303 ni el 130/);
  });

  test('sense extractes: cap gràfic ni cap Taula, el perquè de cada instrument i els venciments d’avui', () => {
    const dades = dadesDelTauler({ avui: AVUI });
    const { cabina } = munta(dades);
    expect(cabina.querySelector('.sdp-histograma, table')).toBeNull();
    expect(within(cabina).getByText('Encara no hi ha cap mes amb moviments en euros')).toBeTruthy();
    expect(within(cabina).queryByText('Gràfics amagats')).toBeNull();
    expect(within(cabina).getByText(/^Encara no hi ha cap extracte amb data/)).toBeTruthy();
    expect(cabina.querySelectorAll('.sdp-gestoria-cabina__valor')).toHaveLength(0);
    expect(cabina.querySelectorAll('.sdp-gestoria-cabina__motiu')).toHaveLength(8);
    expect(within(cabina).getByText('303 i 130 · 4T 2026')).toBeTruthy();
    expect(within(cabina).queryByText('Extractes antics')).toBeNull();
  });

  test('un mes sense extractes no és cap zero: «Sense extractes» i cap barra; un mes cobert sense moviments ho diu', () => {
    const gener = [r11(COMPTE_A, { inici: '260101', fi: '260131', saldo: 100000 }), r22({ op: '260115', centims: 10000 }),
      r33(COMPTE_A, { nDeure: 1, deure: 10000, nHaver: 0, haver: 0, saldo: 90000 })];
    const marcIAbril = [r11(COMPTE_A, { inici: '260301', fi: '260430', saldo: 90000 }), r22({ op: '260410', dh: '2', centims: 20000 }),
      r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 1, haver: 20000, saldo: 110000 })];
    const dades = dadesDelTauler({ lectura: lecturaDe(gener, marcIAbril), avui: d(2026, 5, 4) });
    const { cabina } = munta(dades, true);
    const files = within(within(cabina).getByRole('region', { name: 'Taula · Flux de caixa per mes' })).getAllByRole('row').slice(1)
      .map((tr) => [...tr.children].map((c) => c.textContent));
    expect(files).toEqual([
      ['Gener 2026', 'Mes sencer', '0,00 €', '100,00 €', '-100,00 €'],
      ['Febrer 2026', 'Sense extractes', 'Sense dades', 'Sense dades', 'Sense dades'],
      ['Març 2026', 'Mes sencer', 'Sense moviments', 'Sense moviments', 'Sense moviments'],
      ['Abril 2026', 'Mes sencer', '200,00 €', '0,00 €', '200,00 €']
    ]);
    /* Només els mesos amb moviments tenen barra: ni febrer (sense extractes) ni març (sense moviments). */
    const marques = [...cabina.querySelectorAll('figure.sdp-histograma')].map((g) => [...g.querySelectorAll('.sdp-histograma__marca')].map((m) => m.textContent));
    expect(marques).toEqual([['2026', 'abr'], ['2026', 'abr']]);
  });
});

/* Tauler.jsx · el commutador de vistes. Derogat EN PART el de dues vistes de l'ordre del 261012 per l'ordre del
   Mestre, 13-10-2026 (pla 261013_1405, front E): el Tauler en té tres; els Bancs i els Impostos, dues. */
describe('el commutador de vistes', () => {
  const rellotge = { fase: 'trimestre', valor: 4, max: 92, etiqueta: 'El 4T 2026: dia 4 de 92', text: 'Text del rellotge.', obert: null };
  const dades = (liquidacio = { estat: 'sense', motiu: 'Sense estimació de prova.' }) => ({ iva: { any: 2026, t: 4 }, rellotge, liquidacio });
  const periode = { onAnterior: vi.fn(), onHui: vi.fn(), onSeguent: vi.fn() };
  const botons = () => within(screen.getByRole('group', { name: 'Vista del panell' })).getAllByRole('button')
    .map((b) => [b.textContent, b.getAttribute('aria-pressed')]);

  test('el Tauler: «Targetes | Cabina d’Avió | Vista comprimida», Targetes primer; els Bancs i els Impostos, sense la Cabina', () => {
    expect(VISTES_TAULER.map((v) => [v.valor, v.text])).toEqual([['targetes', 'Targetes'], ['cabina', 'Cabina d’Avió'], ['comprimida', 'Vista comprimida']]);
    expect(VISTES_PANELL.map((v) => v.valor)).toEqual(['targetes', 'comprimida']);
    expect(Object.isFrozen(VISTES_TAULER) && Object.isFrozen(VISTES_PANELL)).toBe(true);
  });

  test('vistaDelModul: la triada si el mòdul l’oferix; una densa que no oferix, la densa que sí; si no, la primera', () => {
    expect(vistaDelModul('cabina', VISTES_TAULER)).toBe('cabina');
    expect(vistaDelModul('cabina', VISTES_PANELL)).toBe('comprimida');
    expect(vistaDelModul('cabina')).toBe('comprimida');
    expect(vistaDelModul('comprimida', VISTES_PANELL)).toBe('comprimida');
    expect(vistaDelModul('targetes', VISTES_PANELL)).toBe('targetes');
    expect(vistaDelModul('comprimida', [VISTES_TAULER[0], VISTES_TAULER[1]])).toBe('cabina');
    for (const vista of [undefined, null, 'desconeguda']) expect(vistaDelModul(vista, VISTES_TAULER), String(vista)).toBe('targetes');
    expect(vistaDelModul('cabina', [VISTES_TAULER[0]])).toBe('targetes');
    for (const vistes of [[], null, 'no']) expect(vistaDelModul('cabina', vistes), String(vistes)).toBe('targetes');
  });

  test('ContextTrimestre: per defecte, les dues del panell; amb VISTES_TAULER, les tres, i la triada premuda', () => {
    const onCanviaVista = vi.fn();
    const { rerender } = render(<ContextTrimestre dades={dades()} vista="targetes" onCanviaVista={onCanviaVista} periode={periode} />);
    expect(botons()).toEqual([['Targetes', 'true'], ['Vista comprimida', 'false']]);
    rerender(<ContextTrimestre dades={dades()} vista="targetes" onCanviaVista={onCanviaVista} vistes={VISTES_TAULER} periode={periode} />);
    expect(botons()).toEqual([['Targetes', 'true'], ['Cabina d’Avió', 'false'], ['Vista comprimida', 'false']]);
    fireEvent.click(screen.getByRole('button', { name: 'Cabina d’Avió' }));
    expect(onCanviaVista).toHaveBeenLastCalledWith('cabina');
    rerender(<ContextTrimestre dades={dades()} vista="cabina" onCanviaVista={onCanviaVista} vistes={VISTES_TAULER} periode={periode} />);
    expect(botons()).toEqual([['Targetes', 'false'], ['Cabina d’Avió', 'true'], ['Vista comprimida', 'false']]);
    /* Als Impostos (amb trimestre) i als Bancs (sense), amb la Cabina triada al Tauler: la comprimida, premuda. */
    rerender(<ContextTrimestre dades={dades()} vista="cabina" onCanviaVista={onCanviaVista} periode={periode} />);
    expect(botons()).toEqual([['Targetes', 'false'], ['Vista comprimida', 'true']]);
    rerender(<ContextTrimestre dades={dades()} vista="cabina" onCanviaVista={onCanviaVista} />);
    expect(botons()).toEqual([['Targetes', 'false'], ['Vista comprimida', 'true']]);
  });

  /* Ordre del Mestre, 13-10-2026 (fronts I i E; GES-A5): el total de Hisenda és la part a pagar de cada model, no el net. */
  test('Hisenda sobre la caixa, «res a pagar»: cap dels dos models surt a pagar; amb l’ull tancat, ni això', () => {
    const res = { estat: 'res', completa: false };
    const { container, rerender } = render(<ContextTrimestre dades={dades(res)} visible vista="targetes" onCanviaVista={vi.fn()} periode={periode} />);
    const barres = () => container.querySelector('.sdp-gestoria-context__barres').textContent;
    expect(barres()).toMatch(/Ni el 303 ni el 130 d’este trimestre surten a pagar: el detall de cada model és a la targeta Hisenda\..*Estimació incompleta/);
    expect(barres()).not.toMatch(/El net del 303/);
    rerender(<ContextTrimestre dades={dades(res)} visible={false} vista="targetes" onCanviaVista={vi.fn()} periode={periode} />);
    expect(barres()).not.toMatch(/surten a pagar|incompleta/);
    expect(barres()).toMatch(/Xifra amagada/);
  });

  /* Revisió adversarial 13-10-2026, troballa FIN-3: un «res» amb un model sense estimació no diu que cap dels dos surt
     a pagar; amb l'ull tancat, la capçalera es pinta igual que en qualsevol altre estat amb dada. */
  test('Hisenda sobre la caixa, «res» amb un model sense estimació: només el que se sap, incomplet; amb l’ull tancat, com tots', () => {
    const barresDe = (liquidacio, visible) => {
      const { container, unmount } = render(
        <ContextTrimestre dades={dades(liquidacio)} visible={visible} vista="targetes" onCanviaVista={vi.fn()} periode={periode} />
      );
      const resultat = container.querySelector('.sdp-gestoria-context__barres').textContent;
      unmount();
      return resultat;
    };
    const sense130 = { estat: 'res', completa: false, desconegut: '130' };
    const sense303 = { estat: 'res', completa: false, desconegut: '303' };
    expect(barresDe(sense130, true))
      .toMatch(/El 303 d’este trimestre no surt a pagar, i del 130 encara no hi ha estimació: el detall de cada model és a la targeta Hisenda\..*Estimació incompleta/);
    expect(barresDe(sense303, true))
      .toMatch(/El 130 d’este trimestre no surt a pagar, i del 303 encara no hi ha estimació: el detall de cada model és a la targeta Hisenda\..*Estimació incompleta/);
    for (const parcial of [sense130, sense303]) expect(barresDe(parcial, true)).not.toMatch(/Ni el 303 ni el 130/);
    /* Els dos models coneguts: el text de sempre. */
    expect(barresDe({ estat: 'res', completa: true }, true))
      .toMatch(/Ni el 303 ni el 130 d’este trimestre surten a pagar: el detall de cada model és a la targeta Hisenda\./);
    const tancats = [
      { estat: 'res', completa: true }, sense130, sense303, { estat: 'descobert', completa: false },
      { estat: 'xifra', percentatge: 25, supera: false, completa: true }
    ].map((liquidacio) => barresDe(liquidacio, false));
    expect(new Set(tancats).size).toBe(1);
    expect(tancats[0]).toMatch(/Xifra amagada/);
    expect(tancats[0]).not.toMatch(/surt|encara no hi ha estimació|incompleta|25/);
  });
});
