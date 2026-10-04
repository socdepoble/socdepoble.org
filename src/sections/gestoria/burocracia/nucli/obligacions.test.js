// @vitest-environment node
/* Burocràcia · el catàleg d'obligacions i el calendari per any. Perfils
   sintètics; les finestres externes de SUMA de les proves són inventades
   (el catàleg no en porta cap: es carreguen). */
import { describe, expect, test } from 'vitest';
import { identificadorsDe, VERIFICAR } from '../../identitat/nucli/guardes.js';
import { ORGANISMES } from '../../identitat/nucli/document.js';
import { creaTitular } from '../../identitat/nucli/titular.js';
import { aplicabilitat, calendariObligacions, OBLIGACIONS, PRESENTADORS, validaPerfil } from './obligacions.js';
import { AVIS_SENSE_FESTIUS, CATEGORIES, creaCalendari } from './terminis.js';

const codis = (errors) => errors.map((e) => e.codi);
const LLAR = creaTitular({ id: 'tit_prova_llar', tipus: 'persona', ambit: 'LLAR', alies: 'Casa de prova' });
const ACTIVITAT = creaTitular({ id: 'tit_prova_activitat', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat de prova', persona: 'tit_prova_llar' });
const ENTITAT = creaTitular({ id: 'tit_prova_entitat', tipus: 'entitat', ambit: 'ENTITAT', alies: 'Associació de prova', formaJuridica: 'associacio' });

const AUTONOMA = Object.freeze({
  titular: ACTIVITAT,
  regimIva: 'general',
  estimacioIrpf: 'directa',
  retencio70: false,
  intracomunitari: false,
  operacionsAmbTercers: null,
  reta: true,
  tributsLocals: true,
  marques: [{ id: 'marca_prova', sollicitud: '2016-09-15' }]
});

const perId = (calendari) => Object.fromEntries(calendari.ocurrencies.map((o) => [o.id, o]));

describe('el catàleg', () => {
  test('porta els models i les obligacions de l’ordre, cada una amb organisme, font, qui la presenta i «a verificar»', () => {
    // L'ordre del MAPA §4 pas 4: …, tributs locals, demanda d'ocupació, OEPM.
    expect(OBLIGACIONS.map((ob) => ob.id)).toEqual([
      'aeat-303', 'aeat-130', 'aeat-349', 'aeat-390', 'aeat-347', 'aeat-100', 'tgss-reta', 'suma-tributs-locals', 'ocupacio-renovacio-demanda',
      'oepm-renovacio-marca'
    ]);
    for (const ob of OBLIGACIONS) {
      expect(ob.verificar, ob.id).toBe(VERIFICAR);
      expect(PRESENTADORS, ob.id).toContain(ob.presentaPerDefecte);
      expect(ORGANISMES, ob.id).toContain(ob.organisme);
      expect(CATEGORIES, ob.id).toContain(ob.categoria);
      expect(ob.font.norma.length, ob.id).toBeGreaterThan(10);
      expect(ob.font.consulta.length, ob.id).toBeGreaterThan(10);
      expect(ob.aQui.length, ob.id).toBeGreaterThan(20);
      expect(Object.isFrozen(ob.font), ob.id).toBe(true);
    }
  });

  test('cap text del catàleg porta un identificador ni una adreça web', () => {
    const textos = OBLIGACIONS.flatMap((ob) => [ob.nom, ob.aQui, ob.nota, ob.font.norma, ob.font.consulta, ob.carrega ?? '']);
    expect(textos.filter((text) => identificadorsDe(text).length > 0 || /https?:/.test(text))).toEqual([]);
  });
});

describe('a qui s’aplica', () => {
  test('la persona autònoma', () => {
    const a = Object.fromEntries(aplicabilitat(AUTONOMA).map((x) => [x.obligacio, x.aplica]));
    expect(a).toEqual({
      'aeat-303': 'si', 'aeat-130': 'si', 'aeat-349': 'no', 'aeat-390': 'si', 'aeat-347': 'cal-verificar', 'aeat-100': 'si',
      'tgss-reta': 'si', 'suma-tributs-locals': 'si', 'ocupacio-renovacio-demanda': 'cal-verificar', 'oepm-renovacio-marca': 'si'
    });
  });

  test('la llar: ni IVA, ni 130, ni RETA; la renda i la demanda d’ocupació, a verificar', () => {
    const a = aplicabilitat({ titular: LLAR, tributsLocals: false });
    expect(a.filter((x) => x.aplica !== 'no').map((x) => [x.obligacio, x.aplica])).toEqual([['aeat-100', 'cal-verificar'], ['ocupacio-renovacio-demanda', 'cal-verificar']]);
    expect(a.find((x) => x.obligacio === 'aeat-303').motiu).toMatch(/no de la llar/);
  });

  test('l’entitat: IVA i 347 sí; ni renda, ni 130, ni RETA, ni demanda d’ocupació', () => {
    const a = Object.fromEntries(aplicabilitat({ titular: ENTITAT, regimIva: 'general', operacionsAmbTercers: true, intracomunitari: false, marques: [] }).map((x) => [x.obligacio, x.aplica]));
    expect(a).toMatchObject({
      'aeat-303': 'si', 'aeat-390': 'si', 'aeat-347': 'si', 'aeat-130': 'no', 'aeat-100': 'no', 'tgss-reta': 'no', 'ocupacio-renovacio-demanda': 'no', 'oepm-renovacio-marca': 'no'
    });
  });

  test('les excepcions: exempta, recàrrec, mòduls i professional amb retenció', () => {
    const aplica = (canvis, id) => aplicabilitat({ ...AUTONOMA, ...canvis }).find((x) => x.obligacio === id);
    expect(aplica({ regimIva: 'exempt' }, 'aeat-303').aplica).toBe('no');
    expect(aplica({ regimIva: 'exempt' }, 'aeat-390').aplica).toBe('no');
    expect(aplica({ regimIva: 'recarrec' }, 'aeat-303').aplica).toBe('no');
    expect(aplica({ estimacioIrpf: 'objectiva' }, 'aeat-130').motiu).toMatch(/131/);
    expect(aplica({ retencio70: true }, 'aeat-130').aplica).toBe('no');
    expect(aplica({ retencio70: null }, 'aeat-130').aplica).toBe('cal-verificar');
  });

  test('fail-closed: sense dades, res desapareix; tot queda «cal-verificar»', () => {
    const a = aplicabilitat({ titular: ACTIVITAT });
    expect(a.filter((x) => x.aplica === 'no')).toEqual([]);
    expect(a.filter((x) => x.aplica === 'si').map((x) => x.obligacio)).toEqual(['aeat-100']);
  });

  test('qui la presenta: la gestoria per defecte als models, el titular on el perfil ho diu', () => {
    const a = aplicabilitat({ ...AUTONOMA, quiPresenta: { 'aeat-130': 'titular' } });
    expect(a.find((x) => x.obligacio === 'aeat-303').presenta).toBe('gestoria');
    expect(a.find((x) => x.obligacio === 'aeat-130').presenta).toBe('titular');
    expect(a.find((x) => x.obligacio === 'tgss-reta').presenta).toBe('titular');
  });
});

describe('validaPerfil', () => {
  test('cada error amb el seu codi; una dada absent no és un error', () => {
    expect(validaPerfil({ titular: ACTIVITAT })).toEqual([]);
    expect(codis(validaPerfil({ titular: { id: 'tit_prova' } }))).toEqual(['TITULAR_INVALID']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, regimIva: 'altre' }))).toEqual(['VALOR_INVALID']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, reta: 'si' }))).toEqual(['VALOR_INVALID']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, marques: [{ id: 'marca_prova', sollicitud: '2016-02-30' }] }))).toEqual(['DATA_INVALIDA']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, marques: [{ id: 'marca_prova', sollicitud: '2016-09-15' }, { id: 'marca_prova', sollicitud: '2018-01-10' }] }))).toEqual(['ID_REPETIT']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, quiPresenta: { 'aeat-999': 'gestoria', 'aeat-303': 'veïna' } }))).toEqual(['OBLIGACIO_DESCONEGUDA', 'VALOR_INVALID']);
    expect(codis(validaPerfil({ titular: ACTIVITAT, iban: 'x' }))).toEqual(['CAMP_DESCONEGUT']);
    expect(() => aplicabilitat({})).toThrow(/El perfil no és vàlid/);
  });
});

describe('calendariObligacions', () => {
  const calendari = calendariObligacions(2026, AUTONOMA);
  const o = perId(calendari);

  test('els trimestrals: el 4T de l’any anterior al gener i els altres tres als seus mesos', () => {
    expect(['2025:4T', '2026:1T', '2026:2T', '2026:3T'].map((clau) => o[`aeat-303:${clau}`].venciment)).toEqual(['2026-01-30', '2026-04-20', '2026-07-20', '2026-10-20']);
    expect(o['aeat-130:2026:1T']).toMatchObject({ inici: '2026-04-01', exercici: 2026, periode: '1T', presenta: 'gestoria', aplica: 'si', verificar: VERIFICAR, titular: 'tit_prova_activitat' });
    expect(o['aeat-303:2025:4T'].exercici).toBe(2025);
  });

  test('els anuals, la renda i el 347 que cau en dissabte i es corre', () => {
    expect(o['aeat-390:2025:anual'].venciment).toBe('2026-01-30');
    expect(o['aeat-100:2025:anual']).toMatchObject({ inici: null, venciment: '2026-06-30', corregut: false });
    expect(o['aeat-347:2025:anual']).toMatchObject({ vencimentSenseCorrer: '2026-02-28', venciment: '2026-03-02', corregut: true, aplica: 'cal-verificar' });
  });

  test('el RETA sense festius: la data prudent de cada mes, cap arrere, i ho diu', () => {
    const reta = calendari.ocurrencies.filter((x) => x.obligacio === 'tgss-reta');
    expect(reta).toHaveLength(12);
    expect(o['tgss-reta:2026:01']).toMatchObject({
      vencimentSenseCorrer: '2026-01-31', venciment: '2026-01-28', corregut: true, presenta: 'titular', prudencia: AVIS_SENSE_FESTIUS
    });
    expect(o['tgss-reta:2026:05'].venciment).toBe('2026-05-27');
    expect(o['tgss-reta:2026:10'].venciment).toBe('2026-10-28');
    expect(o['tgss-reta:2026:12'].venciment).toBe('2026-12-29');
    expect(reta.filter((x) => x.prudencia !== AVIS_SENSE_FESTIUS)).toEqual([]);
    // Cap avant no cal prudència: un festiu que no se sap només faria el real més tard.
    expect(o['aeat-303:2025:4T'].prudencia).toBeNull();
  });

  test('el RETA amb els festius carregats: l’últim dia hàbil exacte de cada mes', () => {
    const amb = perId(calendariObligacions(2026, AUTONOMA, { calendari: creaCalendari({ festius: ['2026-01-01'] }) }));
    expect(amb['tgss-reta:2026:01']).toMatchObject({ venciment: '2026-01-30', corregut: true, prudencia: null });
    expect(amb['tgss-reta:2026:05'].venciment).toBe('2026-05-29');
    expect(amb['tgss-reta:2026:10'].venciment).toBe('2026-10-30');
    expect(amb['tgss-reta:2026:12'].venciment).toBe('2026-12-31');
  });

  test('2029: el 30 de març és Divendres Sant; sense festius, el RETA de març mai ix posterior al real', () => {
    const real = perId(calendariObligacions(2029, AUTONOMA, { calendari: creaCalendari({ festius: ['2029-03-30'] }) }))['tgss-reta:2029:03'];
    expect(real).toMatchObject({ venciment: '2029-03-29', prudencia: null });
    const senseFestius = perId(calendariObligacions(2029, AUTONOMA))['tgss-reta:2029:03'];
    expect(senseFestius.venciment <= real.venciment).toBe(true);
    expect(senseFestius.prudencia).toBe(AVIS_SENSE_FESTIUS);
  });

  test('la marca: venciment als 10 anys, finestra de 6 mesos abans i gràcia de 6 després', () => {
    expect(o['oepm-renovacio-marca:marca_prova:2026-09-15']).toMatchObject({
      inici: '2026-03-15', venciment: '2026-09-15', periode: '10 anys', gracia: { fins: '2027-03-15', ambRecarrec: true }, presenta: 'titular'
    });
    expect(perId(calendariObligacions(2027, AUTONOMA))['oepm-renovacio-marca:marca_prova:2026-09-15']).toBeDefined();
    expect(Object.keys(perId(calendariObligacions(2028, AUTONOMA))).filter((id) => id.startsWith('oepm'))).toEqual([]);
  });

  test('SUMA sense calendari carregat: una ocurrència pendent, sense venciment, al final', () => {
    const sumaPendent = calendari.ocurrencies[calendari.ocurrencies.length - 1];
    expect(sumaPendent).toMatchObject({ id: 'suma-tributs-locals:2026:pendent', venciment: null, corregut: false });
    expect(sumaPendent.pendent).toMatch(/calendari fiscal de SUMA/);
  });

  test('ordenat per venciment; les descartades diuen per què', () => {
    expect(calendari.ocurrencies).toHaveLength(26);
    expect(calendari.ocurrencies.slice(0, 4).map((x) => x.id)).toEqual(['tgss-reta:2026:01', 'aeat-130:2025:4T', 'aeat-303:2025:4T', 'aeat-390:2025:anual']);
    const datades = calendari.ocurrencies.filter((x) => x.venciment);
    expect(datades.map((x) => x.venciment)).toEqual([...datades.map((x) => x.venciment)].sort());
    expect(calendari.descartades).toEqual([{ obligacio: 'aeat-349', motiu: 'Sense operacions intracomunitàries.' }]);
    expect(calendari).toMatchObject({ any: 2026, titular: 'tit_prova_activitat', festiusCarregats: false, verificar: VERIFICAR });
    expect(Object.isFrozen(calendari.ocurrencies[0])).toBe(true);
  });

  test('el 30 de gener de 2027 és dissabte: el 4T de 2026 es corre a dilluns', () => {
    expect(perId(calendariObligacions(2027, AUTONOMA))['aeat-303:2026:4T']).toMatchObject({ venciment: '2027-02-01', corregut: true });
  });

  test('el 30 de juny de 2024 era diumenge: la renda es corre a l’1 de juliol', () => {
    expect(perId(calendariObligacions(2024, AUTONOMA))['aeat-100:2023:anual'].venciment).toBe('2024-07-01');
  });

  test('un festiu del calendari injectat també corre el venciment', () => {
    const ambFestiu = perId(calendariObligacions(2026, AUTONOMA, { calendari: creaCalendari({ festius: ['2026-07-20'] }) }));
    expect(ambFestiu['aeat-303:2026:2T']).toMatchObject({ venciment: '2026-07-21', corregut: true });
  });

  test('els períodes de SUMA es carreguen de fora, només els de l’any', () => {
    const finestresExternes = {
      'suma-tributs-locals': [
        { periode: ' IBI ', inici: '2026-03-02', fi: '2026-05-04' },
        { periode: 'Vehicles', fi: '2026-06-01' },
        { periode: 'IBI', inici: '2025-03-03', fi: '2025-05-05' }
      ]
    };
    const ambSuma = calendariObligacions(2026, AUTONOMA, { finestresExternes });
    const suma = ambSuma.ocurrencies.filter((x) => x.obligacio === 'suma-tributs-locals');
    expect(suma.map((x) => [x.periode, x.inici, x.venciment])).toEqual([['IBI', '2026-03-02', '2026-05-04'], ['Vehicles', null, '2026-06-01']]);
  });

  test('les finestres externes es validen', () => {
    expect(() => calendariObligacions(2026, AUTONOMA, { finestresExternes: { 'aeat-303': [] } })).toThrow(/obligació amb calendari extern/);
    expect(() => calendariObligacions(2026, AUTONOMA, { finestresExternes: { 'suma-tributs-locals': [{ periode: 'IBI', inici: '2026-05-04', fi: '2026-03-02' }] } }))
      .toThrow(/comença després d’acabar/);
    expect(() => calendariObligacions(2026, AUTONOMA, { finestresExternes: { 'suma-tributs-locals': 'no' } })).toThrow(/llista de finestres/);
  });

  test('sense dades de marques, de SUMA ni de la demanda d’ocupació, tres ocurrències pendents que diuen què falta', () => {
    const pendents = calendariObligacions(2026, { titular: ACTIVITAT }).ocurrencies.filter((x) => x.venciment === null);
    expect(pendents.map((x) => x.obligacio).sort()).toEqual(['ocupacio-renovacio-demanda', 'oepm-renovacio-marca', 'suma-tributs-locals']);
    expect(pendents.find((x) => x.obligacio === 'oepm-renovacio-marca').pendent).toMatch(/data de sol·licitud/);
    expect(pendents.find((x) => x.obligacio === 'suma-tributs-locals').pendent).toMatch(/calendari fiscal de SUMA/);
  });

  test('la renovació de la demanda d’ocupació: la data del document, carregada, que no es corre mai', () => {
    const perfil = { titular: LLAR, demandaOcupacio: true };
    const pendent = calendariObligacions(2026, perfil).ocurrencies.find((x) => x.obligacio === 'ocupacio-renovacio-demanda');
    expect(pendent).toMatchObject({ venciment: null, aplica: 'si', presenta: 'titular', organisme: 'LABORA', categoria: 'administratiu', verificar: VERIFICAR });
    expect(pendent.pendent).toMatch(/pròxima renovació/);
    expect(pendent.nota).toMatch(/^A verificar/);
    // El 19 de desembre de 2026 és dissabte: la data de l'organisme no es fa mai més tardana.
    const finestresExternes = { 'ocupacio-renovacio-demanda': [{ periode: 'Renovació', fi: '2026-11-12' }, { periode: 'Renovació', fi: '2026-12-19' }] };
    const ocupacio = calendariObligacions(2026, perfil, { finestresExternes }).ocurrencies.filter((x) => x.obligacio === 'ocupacio-renovacio-demanda');
    expect(ocupacio.map((x) => [x.venciment, x.corregut, x.prudencia])).toEqual([['2026-11-12', false, null], ['2026-12-19', false, null]]);
    expect(aplicabilitat({ titular: LLAR, demandaOcupacio: false }).find((x) => x.obligacio === 'ocupacio-renovacio-demanda').aplica).toBe('no');
    expect(codis(validaPerfil({ titular: LLAR, demandaOcupacio: 'si' }))).toEqual(['VALOR_INVALID']);
  });

  test('l’any té quatre xifres', () => {
    expect(() => calendariObligacions(26, AUTONOMA)).toThrow(RangeError);
  });
});
