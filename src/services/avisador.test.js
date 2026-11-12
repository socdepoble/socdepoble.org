import { describe, expect, it, vi } from 'vitest';
import { activaAvisador, AJUSTOS_AVISADOR, esDirecteDeConfianca, estatAvisador, exportaHorariAvisador, importaHorariAvisador, tempsActiuEntre, tocaAvisar } from './avisador.js';
import { creaEnviamentAvisador } from './avisadorEnviament.js';

const a = (dia, h, m = 0) => new Date(2026, 10, dia, h, m).getTime();
const H = 3_600_000;
const directe = (id) => ({ id: `fil-${id}`, tipus: 'directe', participants: 2, altres: [{ id, tipus: 'persona' }] });
const op = { ...AJUSTOS_AVISADOR, horesImmobilitat: 4 };

describe('Avisador · temps actiu', () => {
  it('descompta la nit sencera que creua mitjanit i comprova els dos límits', () => {
    const estat = activaAvisador(op, [directe('veina')], 'jo', a(10, 20));
    expect(tempsActiuEntre(a(10, 20), a(11, 10), '22:00', '08:00')).toBe(4 * H);
    expect(tocaAvisar(estat, a(11, 9, 59))).toBe(false);
    expect(tocaAvisar(estat, a(11, 10))).toBe(true);
    const abans = { ...estat, ultimBatec: a(10, 18) };
    expect(tocaAvisar(abans, a(10, 22))).toBe(false);
    expect(tocaAvisar(abans, a(11, 8))).toBe(true);
  });

  it('admet descans dins del mateix dia, diverses nits i dies de 23 o 25 hores', () => {
    expect(tempsActiuEntre(a(10, 1), a(11, 10), '02:00', '09:00')).toBe(19 * H);
    expect(tempsActiuEntre(a(10, 20), a(12, 16), '22:00', '08:00')).toBe(24 * H);
    const primavera = (dia, h) => new Date(2026, 2, dia, h).getTime();
    const tardor = (dia, h) => new Date(2026, 9, dia, h).getTime();
    expect(primavera(29, 8) - primavera(28, 22)).toBe(9 * H);
    expect(tardor(25, 8) - tardor(24, 22)).toBe(11 * H);
    expect(tempsActiuEntre(primavera(28, 20), primavera(29, 10), '22:00', '08:00')).toBe(4 * H);
    expect(tempsActiuEntre(tardor(24, 20), tardor(25, 10), '22:00', '08:00')).toBe(4 * H);
  });

  it('rebutja ajustos o contactes corruptes, bots, grups, files de mostra i autoavisos', () => {
    const estat = activaAvisador(op, [directe('veina')], 'jo', a(10, 20));
    expect(activaAvisador({ ...op, horaFiNit: '22:00' }, [directe('veina')], 'jo')).toBeNull();
    expect(activaAvisador(op, [], 'jo')).toBeNull();
    expect(activaAvisador(op, Array.from({ length: 4 }, (_, i) => directe(`v-${i}`)), 'jo')).toBeNull();
    expect(estatAvisador({ ...estat, horesImmobilitat: '4' })).toBeNull();
    expect(estatAvisador({ ...estat, personesConfiansa: [{ ...estat.personesConfiansa[0], idMissatge: 'text' }] })).toBeNull();
    expect(esDirecteDeConfianca(directe('jo'), 'jo')).toBe(false);
    expect(esDirecteDeConfianca(directe('11111111-1a1a-0000-0000-000000000000'), 'jo')).toBe(false);
    expect(esDirecteDeConfianca({ ...directe('veina'), perDefecte: 'javi' }, 'jo')).toBe(false);
    expect(esDirecteDeConfianca({ ...directe('veina'), tipus: 'grup' }, 'jo')).toBe(false);
    expect(esDirecteDeConfianca({ ...directe('veina'), altres: { length: 1 } }, 'jo')).toBe(false);
  });

  it('rebutja un descans nocturn de més de 12 hores, també dins del mateix dia', () => {
    const amb = (horaIniciNit, horaFiNit) => activaAvisador({ ...op, horaIniciNit, horaFiNit }, [directe('veina')], 'jo');
    expect(amb('08:00', '07:59')).toBeNull();
    expect(amb('20:00', '08:01')).toBeNull();
    expect(amb('01:00', '13:01')).toBeNull();
    expect(amb('20:00', '08:00')).not.toBeNull();
    expect(amb('01:00', '13:00')).not.toBeNull();
    expect(estatAvisador({ ...activaAvisador(op, [directe('veina')], 'jo'), horaIniciNit: '08:00', horaFiNit: '07:59' })).toBeNull();
  });
});

function bancDeProves(envia, inicial = a(11, 10)) {
  let estat = activaAvisador(op, [directe('a'), directe('b')], 'jo', a(10, 20));
  let ara = inicial;
  let potEnviar = true;
  const adaptadors = {
    llegix: () => estat,
    desa: (valor) => { estat = valor; return true; },
    potEnviar: () => potEnviar,
    envia,
    ara: () => ara
  };
  return { ...adaptadors, fixaHora: (hora) => { ara = hora; }, habilita: (pot) => { potEnviar = pot; } };
}

describe('Avisador · enviament', () => {
  it('espera la connexió, reintenta el mateix id i només considera confirmada una resposta amb seq', async () => {
    const envia = vi.fn()
      .mockImplementationOnce(async ({ idMissatge }) => ({ id: idMissatge, encuat: true }))
      .mockImplementation(async ({ idMissatge }) => ({ id: idMissatge, seq: 7 }));
    const banc = bancDeProves(envia, a(11, 7));
    const primera = creaEnviamentAvisador(banc);
    await primera.avalua();
    banc.fixaHora(a(11, 10));
    banc.habilita(false);
    await primera.avalua();
    expect(envia).not.toHaveBeenCalled();
    banc.habilita(true);
    await primera.avalua();
    expect(banc.llegix().personesConfiansa.map((p) => p.estat)).toEqual(['fallit', 'enviat']);
    const recarregat = creaEnviamentAvisador(banc);
    await recarregat.avalua();
    await recarregat.avalua();
    expect(envia).toHaveBeenCalledTimes(3);
    expect(envia.mock.calls[2][0].idMissatge).toBe(envia.mock.calls[0][0].idMissatge);
    expect(banc.llegix().personesConfiansa.map((p) => p.estat)).toEqual(['enviat', 'enviat']);
  });

  it('un batec nou avorta un enviament i no trasllada la confirmació al cicle següent', async () => {
    let confirma;
    const envia = vi.fn(({ idMissatge }) => new Promise((resol) => {
      confirma = () => resol({ id: idMissatge, seq: 7 });
    }));
    const banc = bancDeProves(envia);
    const monitor = creaEnviamentAvisador(banc);
    const vol = monitor.avalua();
    const anterior = envia.mock.calls[0][0].idMissatge;
    monitor.activitat();
    expect(envia.mock.calls[0][2].aborted).toBe(true);
    confirma();
    await vol;
    expect(envia).toHaveBeenCalledOnce();
    expect(banc.llegix().personesConfiansa[0]).toMatchObject({ estat: 'pendent' });
    expect(banc.llegix().personesConfiansa[0].idMissatge).not.toBe(anterior);
  });

  it('una activitat dins del mateix minut del batec no torna a desar', () => {
    const banc = bancDeProves(vi.fn(), a(10, 20) + 30_000);
    const desa = vi.spyOn(banc, 'desa');
    const monitor = creaEnviamentAvisador(banc);
    monitor.activitat();
    expect(desa).not.toHaveBeenCalled();
    banc.fixaHora(a(10, 20, 1));
    monitor.activitat();
    expect(desa).toHaveBeenCalledOnce();
    expect(banc.llegix().ultimBatec).toBe(a(10, 20, 1));
  });

  it('avorta la cua pròpia si una altra pestanya desactiva l’Avisador', async () => {
    let confirma;
    const envia = vi.fn(({ idMissatge }) => new Promise((resol) => {
      confirma = () => resol({ id: idMissatge, seq: 9 });
    }));
    const banc = bancDeProves(envia);
    const monitor = creaEnviamentAvisador(banc);
    const vol = monitor.avalua();
    banc.desa(null);
    monitor.comprova();
    expect(envia.mock.calls[0][2].aborted).toBe(true);
    confirma();
    await vol;
    expect(envia).toHaveBeenCalledOnce();
    expect(banc.llegix()).toBeNull();
  });
});

it('la còpia de l’horari no revela contactes ni activa enviaments en importar-la', () => {
  const estat = activaAvisador(op, [directe('contacte-sintetic')], 'jo');
  const copia = exportaHorariAvisador(estat);
  expect(copia).not.toMatch(/contacte|ultimBatec|actiu|idMissatge/);
  expect(importaHorariAvisador(copia)).toEqual(op);
  expect(importaHorariAvisador(JSON.stringify({ ...JSON.parse(copia), actiu: true }))).toBeNull();
});

it('un batec encuat no restaura un Avisador que una altra pestanya ja ha desactivat', async () => {
  const banc = bancDeProves(vi.fn());
  let acaba;
  const monitor = creaEnviamentAvisador({
    ...banc,
    transaccio: (fn) => new Promise((resol) => { acaba = () => resol(fn()); })
  });
  monitor.activitat();
  banc.desa(null);
  acaba();
  await Promise.resolve();
  expect(banc.llegix()).toBeNull();
  await monitor.avalua();
  expect(banc.envia).not.toHaveBeenCalled();
});
