// @vitest-environment node
/* Gestoria · Tauler · targetesTauler: el model de cada targeta del Tauler
   (regla d'or 1: títol, subtítol, entradeta, xifra o el perquè, etiquetes,
   detall i d'on ix). Dades sintètiques. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { crearFactura } from '../../nucli/model.js';
import { BLOCS_TAULER, dadesDelTauler, etiquetaXifra, nomsDelsComptes, textAmagat, textXifra } from './targetesTauler.js';
import { reduixC43 } from './tractorTauler.js';

const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
/* La lectura tal com la torna el tractor: la reduïda. */
const LECTURA = { extractes: [{ lectura: reduixC43(llegeixC43(N43)) }], csv: [], identitat: null, avisos: [] };
/* Un compte en dòlars (divisa 840), sense cap moviment: res en euros. */
const N43_DOLARS = [
  `119999000200000087652606012606302${xifres(100000, 14)}8403${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `3399990002000000876500000${xifres(0, 14)}00000${xifres(0, 14)}2${xifres(100000, 14)}840${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(2, 6)}${text('', 54)}`
].join('\r\n');
const LECTURA_DOLARS = { extractes: [{ lectura: reduixC43(llegeixC43(N43_DOLARS)) }], csv: [], identitat: null, avisos: [] };
const AVUI = { a: 2026, m: 10, d: 4 };
const ids = (dades) => dades.targetes.map((t) => t.id);
/* Tots els imports que una targeta pot pintar: el del quadrat i els del detall. */
const imports = (t) => [t.xifra, ...t.detall.map((fila) => fila.xifra)].filter((x) => x?.tipus === 'import');

describe('dadesDelTauler', () => {
  test('sense lectura: totes les targetes del Tauler hi són, sense cap xifra i amb el perquè', () => {
    const dades = dadesDelTauler({ avui: AVUI });
    expect(ids(dades)).toEqual(['caixa', 'hisenda', 'cobertura', 'factures', 'ingressos', 'despeses', 'rendiment', 'conciliacio', 'iva-303', 'irpf-130']);
    for (const t of dades.targetes) {
      expect(t.xifra, t.id).toBeNull();
      expect(t.senseXifra, t.id).toMatch(/\S/);
      expect(t.titol && t.subtitol && t.entradeta && t.font, t.id).toBeTruthy();
      expect(Object.keys(BLOCS_TAULER)).toContain(t.bloc);
    }
    expect(dades.iva).toMatchObject({ any: 2026, t: 4, completa: false });
  });

  test('amb un extracte: la caixa, el compte i el flux dels 30 dies; la cobertura diu que falta un mes', () => {
    const dades = dadesDelTauler({ lectura: LECTURA, avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    expect(per.caixa.xifra).toEqual({ tipus: 'import', valor: 97500, moneda: 'EUR' });
    expect(per.caixa.entradeta).toMatch(/30\/06\/2026/);
    expect(per['compte-c43-9999-4321']).toMatchObject({ bloc: 'bancs', titol: 'Compte 1', subtitol: 'Saldo bancari · extracte del banc' });
    expect(per['compte-c43-9999-4321'].entradeta).toMatch(/^De l’entitat 9999, acabat en 4321\. El saldo/);
    expect(per.caixa.detall.map((fila) => fila.etiqueta)).toEqual(['Compte 1']);
    expect(per.despeses.xifra).toEqual({ tipus: 'import', valor: 2500, moneda: 'EUR' });
    expect(per.despeses.etiquetes.map((e) => e.text)).toEqual(['Banc']);
    expect(per.cobertura).toMatchObject({ xifra: null, senseXifra: 'Cal almenys un mes de moviments per a calcular-la.' });
    expect(per.conciliacio.xifra).toEqual({ tipus: 'recompte', valor: 1 });
    expect(per.hisenda.etiquetes.map((e) => e.text)).toEqual(['Impostos', 'Estimació incompleta', 'Termini 30/01/2027']);
    expect(JSON.stringify(dades.targetes)).not.toMatch(/0000004321|TITULAR SINTETIC/);
  });

  /* Ordre del Mestre, 261004 (privacitat): l'Índex escriu a la URL el títol de
     la secció triada, i el títol i el subtítol d'una targeta en són dos. */
  test('cap títol ni subtítol porta dades: els comptes es diuen «Compte 1, 2…»', () => {
    const dos = { extractes: [...LECTURA.extractes, ...LECTURA_DOLARS.extractes], csv: [], identitat: null, avisos: [] };
    const dades = dadesDelTauler({ lectura: dos, avui: AVUI });
    const comptes = dades.targetes.filter((t) => t.bloc === 'bancs' && t.id !== 'conciliacio');
    expect(comptes.map((t) => t.titol)).toEqual(['Compte 1', 'Compte 2']);
    expect(comptes.map((t) => t.entradeta.split('.')[0])).toEqual(['De l’entitat 9999, acabat en 4321', 'De l’entitat 9999, acabat en 8765']);
    for (const t of dades.targetes) {
      expect(`${t.titol} ${t.subtitol}`, t.id).not.toMatch(/4321|8765|9999|TITULAR/);
    }
    expect(nomsDelsComptes([{ id: 'csv' }])).toEqual(new Map([['csv', 'Moviments en CSV']]));
    expect(nomsDelsComptes(null)).toEqual(new Map());
  });

  /* Ordre del Mestre, 261004 (zeros falsos). */
  test('sense res en euros: «Sense mesura en euros», mai «0,00 €» ni al quadrat ni al detall', () => {
    const dades = dadesDelTauler({ lectura: LECTURA_DOLARS, avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    for (const id of ['caixa', 'cobertura', 'ingressos', 'despeses', 'rendiment']) {
      expect(per[id].xifra, id).toBeNull();
      expect(per[id].senseXifra, id).toMatch(/^Sense mesura en euros: /);
    }
    for (const t of dades.targetes) {
      for (const xifra of imports(t)) expect(textXifra(xifra), t.id).not.toMatch(/^0,00/);
    }
    /* El compte en dòlars sí que té el seu saldo; de la finestra sense moviments, només el recompte. */
    expect(per['compte-c43-9999-8765'].detall.map((fila) => [fila.etiqueta, textXifra(fila.xifra)]))
      .toEqual([['Saldo', '1.000,00 USD'], ['Moviments (30 dies)', '0']]);
  });

  test('factures sense cap import en euros: el 303, el 130, Hisenda i les finances diuen «Sense mesura en euros»', () => {
    /* Una del trimestre de les estimacions (4T) i una de la finestra de les finances (juny), les dues en dòlars. */
    const enDolars = (data, num) => ({
      ...crearFactura({ tipus: 'ingres', data, num, contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00' }),
      moneda: 'USD'
    });
    const dades = dadesDelTauler({ lectura: LECTURA, factures: [enDolars('2026-10-02', 'A-0009'), enDolars('2026-06-20', 'A-0008')], avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    for (const id of ['hisenda', 'iva-303', 'irpf-130', 'ingressos', 'despeses', 'rendiment']) {
      expect(per[id].xifra, id).toBeNull();
      expect(per[id].senseXifra, id).toMatch(/^Sense mesura en euros: /);
    }
    expect(per.factures.detall.map((fila) => fila.etiqueta)).toEqual(['Factures emeses']);
  });

  test('les xifres fiscals porten sempre la llegenda d’estimació', () => {
    const dades = dadesDelTauler({ lectura: LECTURA, avui: AVUI });
    for (const id of ['hisenda', 'iva-303', 'irpf-130']) {
      expect(dades.targetes.find((t) => t.id === id).notes.at(-1), id).toMatch(/^Estimació per a revisar amb la gestoria/);
    }
  });
});

describe('el text de les xifres', () => {
  test('imports, mesos i recomptes; en una altra moneda, el codi', () => {
    expect(textXifra({ tipus: 'import', valor: 123456, moneda: 'EUR' })).toBe('1.234,56 €');
    expect(textXifra({ tipus: 'import', valor: -5000 })).toBe('-50,00 €');
    expect(textXifra({ tipus: 'import', valor: 100000, moneda: 'USD' })).toBe('1.000,00 USD');
    expect(textXifra({ tipus: 'mesos', valor: 6.3 })).toBe('6,3');
    expect(etiquetaXifra({ tipus: 'mesos', valor: 1 })).toBe('1,0 mes');
    expect(etiquetaXifra({ tipus: 'mesos', valor: 6.3 })).toBe('6,3 mesos');
    expect(textXifra({ tipus: 'recompte', valor: 7 })).toBe('7');
    expect(textXifra(null)).toBe('');
    expect(textAmagat({ tipus: 'import' })).toBe('Import amagat');
    expect(textAmagat({ tipus: 'mesos' })).toBe('Xifra amagada');
  });

  test('cap xifra escrita al codi del model: totes ixen de les lectures', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler/nucli/targetesTauler.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codi).not.toMatch(/\d+,\d{2} ?€|\d{4,}/);
  });
});
