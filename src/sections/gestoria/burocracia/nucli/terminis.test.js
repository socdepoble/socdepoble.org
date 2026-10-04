// @vitest-environment node
/* Burocràcia · el motor de terminis relatius, amb dates fixes: cap de
   setmana, festiu, canvi de mes i canvi d'any. Cap rellotge real. Els
   festius de les proves són els que passe cada prova, no un calendari oficial. */
import { describe, expect, test } from 'vitest';
import { VERIFICAR } from '../../identitat/nucli/guardes.js';
import {
  AVIS_SENSE_FESTIUS, calculaTermini, creaCalendari, diaDeLaSetmana, diesEntre, habilCapArrere, MARGE_SENSE_FESTIUS, primerHabil, sumaDies, sumaMesos,
  ultimDiaDelMes, ultimHabilDelMes, validaTermini
} from './terminis.js';

const tros = (...parts) => parts.join('');
const codis = (errors) => errors.map((e) => e.codi);
function codiDe(fn) {
  try { fn(); } catch (e) { return e.codi; }
  return null;
}
const termini =(canvis = {}) => ({ origen: { tipus: 'notificacio', data: '2026-10-02' }, durada: 10, unitat: 'dies-habils', ...canvis });

describe('l’aritmètica de dates', () => {
  test('dies, mesos i setmanes, sense horari d’estiu', () => {
    expect(sumaDies('2026-03-28', 2)).toBe('2026-03-30');
    expect(sumaDies('2026-10-24', 2)).toBe('2026-10-26');
    expect(sumaDies('2026-01-01', -1)).toBe('2025-12-31');
    expect(sumaMesos('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumaMesos('2024-02-29', 12)).toBe('2025-02-28');
    expect(sumaMesos('2026-03-31', -1)).toBe('2026-02-28');
    expect(sumaMesos('2026-01-15', 23)).toBe('2027-12-15');
    expect(diesEntre('2026-10-05', '2026-10-20')).toBe(15);
    expect(diesEntre('2026-10-20', '2026-10-05')).toBe(-15);
    expect(diaDeLaSetmana('2026-10-04')).toBe(0);
    expect(diaDeLaSetmana('2026-10-03')).toBe(6);
    expect(ultimDiaDelMes(2024, 2)).toBe('2024-02-29');
    expect(() => sumaDies('2026-02-30', 1)).toThrow(/aaaa-mm-dd/);
  });

  test('el primer hàbil, avant i arrere, i l’últim hàbil del mes, amb els festius carregats', () => {
    const amb = { calendari: creaCalendari({ festius: ['2026-01-01'] }) };
    expect(primerHabil('2026-10-03')).toBe('2026-10-05');
    expect(primerHabil('2026-10-03', { ...amb, sentit: -1 })).toBe('2026-10-02');
    expect(primerHabil('2026-10-05')).toBe('2026-10-05');
    expect(ultimHabilDelMes(2026, 1, amb)).toBe('2026-01-30');
    expect(ultimHabilDelMes(2026, 5, amb)).toBe('2026-05-29');
    expect(ultimHabilDelMes(2026, 12, { calendari: creaCalendari({ festius: ['2026-12-31'] }) })).toBe('2026-12-30');
  });

  test('cap arrere sense festius: la data prudent, MARGE_SENSE_FESTIUS hàbils abans, i ho diu', () => {
    expect(MARGE_SENSE_FESTIUS).toBe(2);
    expect(primerHabil('2026-10-03', { sentit: -1 })).toBe('2026-09-30');
    expect(ultimHabilDelMes(2026, 1)).toBe('2026-01-28');
    expect(ultimHabilDelMes(2026, 5)).toBe('2026-05-27');
    expect(habilCapArrere('2026-01-31')).toEqual({ data: '2026-01-28', exacte: false, avis: AVIS_SENSE_FESTIUS });
    expect(habilCapArrere('2026-01-31', { calendari: creaCalendari({ festius: ['2026-01-01'] }) })).toEqual({ data: '2026-01-30', exacte: true, avis: null });
  });

  test('2029: el Divendres Sant cau el 30 de març; sense festius, l’últim hàbil mai ix posterior al real', () => {
    const real = habilCapArrere('2029-03-31', { calendari: creaCalendari({ festius: ['2029-03-30'] }) });
    expect(real).toMatchObject({ data: '2029-03-29', exacte: true });
    const senseFestius = habilCapArrere('2029-03-31');
    expect(senseFestius.exacte).toBe(false);
    expect(senseFestius.avis).toBe(AVIS_SENSE_FESTIUS);
    expect(senseFestius.data <= real.data).toBe(true);
    expect(ultimHabilDelMes(2029, 3) <= '2029-03-29').toBe(true);
    // Amb el Dijous Sant també festiu (en altres comunitats), el marge encara hi cap.
    expect(habilCapArrere('2029-03-31', { calendari: creaCalendari({ festius: ['2029-03-29', '2029-03-30'] }) }).data >= senseFestius.data).toBe(true);
  });
});

describe('el calendari d’inhàbils és injectable', () => {
  test('per defecte, dissabtes i diumenges i cap festiu', () => {
    const cal = creaCalendari();
    expect(cal.esInhabil('2026-10-03')).toBe(true);
    expect(cal.esInhabil('2026-10-12')).toBe(false);
    expect(cal.festius).toEqual([]);
  });

  test('amb festius i sense caps de setmana', () => {
    const cal = creaCalendari({ festius: ['2026-10-12', '2026-10-12'], capsDeSetmana: false });
    expect(cal.festius).toEqual(['2026-10-12']);
    expect(cal.esInhabil('2026-10-12')).toBe(true);
    expect(cal.esInhabil('2026-10-03')).toBe(false);
    expect(() => creaCalendari({ festius: ['2026-02-30'] })).toThrow(/festiu/);
    expect(() => creaCalendari({ festius: 'no' })).toThrow(TypeError);
  });

  test('un calendari sense cap dia hàbil para el càlcul, no el penja', () => {
    const tancat = { festius: [], esInhabil: () => true };
    expect(codiDe(() => primerHabil('2026-10-05', { calendari: tancat }))).toBe('CALENDARI_SENSE_HABILS');
    expect(codiDe(() => calculaTermini(termini(), { calendari: tancat }))).toBe('CALENDARI_SENSE_HABILS');
    expect(() => calculaTermini(termini(), { calendari: {} })).toThrow(TypeError);
  });
});

describe('calculaTermini', () => {
  test('dies hàbils: des de l’endemà, saltant el cap de setmana', () => {
    const t = calculaTermini(termini());
    expect(t).toMatchObject({
      inici: '2026-10-03', venciment: '2026-10-16', vencimentSenseCorrer: '2026-10-16', corregut: false,
      unitat: 'dies-habils', durada: 10, qui: 'titular', categoria: 'administratiu', festiusCarregats: false, verificar: VERIFICAR
    });
    expect(t.regla).toMatch(/Llei 39\/2015, art\. 30/);
    expect(Object.isFrozen(t)).toBe(true);
  });

  test('dies hàbils: un festiu del calendari també se salta', () => {
    const t = calculaTermini(termini(), { calendari: creaCalendari({ festius: ['2026-10-12'] }) });
    expect(t.venciment).toBe('2026-10-19');
    expect(t.festiusCarregats).toBe(true);
  });

  test('dies hàbils: el canvi d’any', () => {
    const origen = { tipus: 'notificacio', data: '2026-12-28' };
    expect(calculaTermini(termini({ origen, durada: 5 })).venciment).toBe('2027-01-04');
    expect(calculaTermini(termini({ origen, durada: 5 }), { calendari: creaCalendari({ festius: ['2027-01-01'] }) }).venciment).toBe('2027-01-05');
  });

  test('dies naturals: si l’últim dia és dissabte, es corre a dilluns', () => {
    const t = calculaTermini(termini({ durada: 15, unitat: 'dies-naturals' }));
    expect(t).toMatchObject({ venciment: '2026-10-19', vencimentSenseCorrer: '2026-10-17', corregut: true });
    expect(calculaTermini(termini({ durada: 15, unitat: 'dies-naturals', correSiInhabil: false })).venciment).toBe('2026-10-17');
  });

  test('dies naturals: el canvi de mes', () => {
    expect(calculaTermini(termini({ origen: { tipus: 'factura', data: '2026-01-25' }, durada: 10, unitat: 'dies-naturals' })).venciment).toBe('2026-02-04');
  });

  test('mesos: el mateix dia, o l’últim del mes, i corregut si cau en cap de setmana', () => {
    const suspens = calculaTermini(termini({ origen: { tipus: 'publicacio', data: '2026-03-16' }, durada: 1, unitat: 'mesos', categoria: 'propietat-industrial' }));
    expect(suspens).toMatchObject({ venciment: '2026-04-16', corregut: false, categoria: 'propietat-industrial' });
    const curt = calculaTermini(termini({ origen: { tipus: 'resolucio', data: '2026-01-31' }, durada: 1, unitat: 'mesos' }));
    expect(curt).toMatchObject({ vencimentSenseCorrer: '2026-02-28', venciment: '2026-03-02', corregut: true });
  });

  test('porta la conseqüència i qui el fa', () => {
    const t = calculaTermini(termini({ consequencia: '  Es perd el dret a recórrer. ', qui: 'gestoria', id: 'termini_prova' }));
    expect(t).toMatchObject({ id: 'termini_prova', consequencia: 'Es perd el dret a recórrer.', qui: 'gestoria' });
  });
});

describe('validaTermini', () => {
  test('cada error amb el seu codi', () => {
    expect(validaTermini(termini())).toEqual([]);
    expect(codis(validaTermini(termini({ durada: 0 })))).toEqual(['DURADA_INVALIDA']);
    expect(codis(validaTermini(termini({ durada: 1201, unitat: 'mesos' })))).toEqual(['DURADA_INVALIDA']);
    expect(codis(validaTermini(termini({ unitat: 'setmanes' })))).toEqual(['UNITAT_INVALIDA']);
    expect(codis(validaTermini(termini({ origen: { tipus: 'rumor', data: '2026-10-02' } })))).toEqual(['ORIGEN_INVALID']);
    expect(codis(validaTermini(termini({ origen: { tipus: 'notificacio', data: '2026-02-30' } })))).toEqual(['DATA_INVALIDA']);
    expect(codis(validaTermini(termini({ origen: '2026-10-02' })))).toEqual(['ORIGEN_INVALID']);
    expect(codis(validaTermini(termini({ qui: 'veïna' })))).toEqual(['QUI_INVALID']);
    expect(codis(validaTermini(termini({ categoria: 'oci' })))).toEqual(['CATEGORIA_INVALIDA']);
    expect(codis(validaTermini(termini({ correSiInhabil: 'si' })))).toEqual(['CORRE_INVALID']);
    expect(codis(validaTermini(termini({ nom: 'x' })))).toEqual(['CAMP_DESCONEGUT']);
    expect(codis(validaTermini(null))).toEqual(['TERMINI_INVALID']);
  });

  test('la conseqüència no pot portar cap identificador personal', () => {
    expect(codis(validaTermini(termini({ consequencia: tros('Avisar ', '600 ', '000 ', '000') })))).toEqual(['IDENTIFICADOR_PERSONAL']);
  });

  test('un termini invàlid llança TERMINI_INVALID amb els detalls', () => {
    let error;
    try { calculaTermini(termini({ durada: -3 })); } catch (e) { error = e; }
    expect(error.codi).toBe('TERMINI_INVALID');
    expect(codis(error.detalls)).toEqual(['DURADA_INVALIDA']);
  });
});
