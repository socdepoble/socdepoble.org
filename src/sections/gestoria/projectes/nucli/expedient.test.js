// @vitest-environment node
/* Projectes i subvencions · l'expedient: fases, fites, terminis del Kit
   Digital, justificació, codi comptable, conservació i doble finançament.
   Dades sintètiques; els imports són cèntims de prova. */
import { describe, expect, test } from 'vitest';
import { VERIFICAR } from '../../identitat/nucli/guardes.js';
import { avisosDe } from '../../burocracia/nucli/avisos.js';
import { icsDeTerminis, TITOLS } from '../../burocracia/nucli/icsTerminis.js';
import {
  avisosExpedient, avisosFinancament, comprovaDobleFinancament, conservacioExpedient, creaExpedient, faseActual, idTerminiExpedient, MISSATGE_DOBLE_UE,
  potImputar, PROGRAMES, terminisExpedient, validaExpedient
} from './expedient.js';

const tros = (...parts) => parts.join('');
const codis = (errors) => errors.map((e) => e.codi);

const KIT = {
  id: 'exp_kit_prova',
  titular: 'tit_prova_activitat',
  programa: 'kit-digital',
  alies: 'Bo digital de prova',
  codiComptable: 'kd_prova',
  importConcedit: 200000,
  dates: { sollicitud: '2026-01-15', concessio: '2026-03-16', factura: '2026-05-29' },
  fites: [
    { id: 'sollicitud', fase: 'sollicitud', feta: '2026-01-15' },
    { id: 'concessio', fase: 'concessio', feta: '2026-03-16' },
    { id: 'signatura-acords', fase: 'acord', prevista: '2026-06-01' }
  ],
  imputacions: [{ factura: 'fac_prova_001', importFactura: 300000, importImputat: 200000 }]
};

const SUBVENCIO = {
  id: 'exp_subvencio_prova',
  titular: 'tit_prova_entitat',
  programa: 'subvencio',
  alies: 'Ajuda de prova',
  organisme: 'GENERALITAT',
  dates: { concessio: '2026-04-01' },
  terminis: [{ id: 'justificacio', fase: 'justificacio', origen: 'concessio', durada: 3, unitat: 'mesos', consequencia: 'Sense justificar, cal reintegrar.' }],
  imputacions: [{ factura: 'fac_prova_002', importFactura: 100000, importImputat: 50000 }]
};

describe('creaExpedient', () => {
  test('un expedient congelat, amb l’organisme del programa i les dates normalitzades', () => {
    const exp = creaExpedient(KIT);
    expect(exp).toMatchObject({
      schema: 'sdp.gestoria.expedient.v1', id: 'exp_kit_prova', organisme: 'RED.ES', codiComptable: 'kd_prova', importConcedit: 200000,
      dates: { sollicitud: '2026-01-15', concessio: '2026-03-16', acord: null, factura: '2026-05-29', justificacio: null, pagament: null }
    });
    expect(Object.isFrozen(exp.imputacions[0])).toBe(true);
    expect(faseActual(exp)).toBe('concessio');
    expect(faseActual(creaExpedient({ ...KIT, fites: [] }))).toBe('sollicitud');
  });

  test('cap identificador personal: ni a l’àlies, ni al codi comptable, ni a la factura', () => {
    expect(codis(validaExpedient({ ...KIT, alies: tros('Bo ', 'ES91 ', '2100 0418 ', '4502 0005 1332') }))).toEqual(['IDENTIFICADOR_PERSONAL']);
    expect(codis(validaExpedient({ ...KIT, codiComptable: tros('kd-', '1234', '5678', 'z') }))).toEqual(['ID_INVALID']);
    expect(codis(validaExpedient({ ...KIT, imputacions: [{ factura: 'Factura 1', importFactura: 1, importImputat: 1 }] }))).toEqual(['ID_INVALID']);
    expect(codis(validaExpedient({ ...KIT, beneficiari: 'x' }))).toEqual(['CAMP_DESCONEGUT']);
  });

  test('programa, organisme, dates, fites i terminis propis', () => {
    expect(codis(validaExpedient({ ...KIT, programa: 'loteria' }))).toEqual(['PROGRAMA_DESCONEGUT', 'ORGANISME_DESCONEGUT']);
    expect(codis(validaExpedient({ ...SUBVENCIO, organisme: undefined }))).toEqual(['ORGANISME_DESCONEGUT']);
    expect(codis(validaExpedient({ ...KIT, dates: { sollicitud: '2026-03-17', concessio: '2026-03-16' } }))).toEqual(['DATES_INCOHERENTS']);
    expect(codis(validaExpedient({ ...KIT, dates: { firma: '2026-03-16' } }))).toEqual(['CAMP_DESCONEGUT']);
    expect(codis(validaExpedient({ ...KIT, fites: [{ id: 'a_prova', fase: 'festa' }, { id: 'a_prova', fase: 'acord' }] }))).toEqual(['FASE_INVALIDA', 'ID_REPETIT']);
    expect(codis(validaExpedient({ ...SUBVENCIO, terminis: [{ id: 'j_prova', fase: 'justificacio', origen: 'rumor', durada: 0, unitat: 'anys' }] })))
      .toEqual(['ORIGEN_INVALID', 'UNITAT_INVALIDA', 'DURADA_INVALIDA']);
    expect(codis(validaExpedient({ ...KIT, importConcedit: 12.5 }))).toEqual(['IMPORT_INVALID']);
  });

  test('dins d’un expedient: cap factura dues vegades ni per damunt del 100 %', () => {
    const imputacions = [
      { factura: 'fac_prova_001', importFactura: 1000, importImputat: 1001 },
      { factura: 'fac_prova_001', importFactura: 1000, importImputat: 10 }
    ];
    expect(codis(validaExpedient({ ...KIT, imputacions }))).toEqual(['IMPUTACIO_EXCESSIVA', 'FACTURA_REPETIDA']);
  });

  test('un expedient invàlid llança EXPEDIENT_INVALID', () => {
    let error;
    try { creaExpedient({ ...KIT, alies: '' }); } catch (e) { error = e; }
    expect(error.codi).toBe('EXPEDIENT_INVALID');
    expect(codis(validaExpedient(null))).toEqual(['EXPEDIENT_INVALID']);
  });
});

describe('els terminis de l’expedient', () => {
  test('els del Kit Digital, amb el motor de Burocràcia, i el que cau en cap de setmana es corre', () => {
    const t = Object.fromEntries(terminisExpedient(creaExpedient(KIT)).map((x) => [x.termini, x]));
    expect(t['signatura-acords']).toMatchObject({
      id: idTerminiExpedient('exp_kit_prova', 'signatura-acords'), expedient: 'exp_kit_prova', venciment: '2026-09-16', corregut: false, qui: 'titular',
      categoria: 'expedient', complit: false
    });
    expect(t['primera-justificacio']).toMatchObject({ vencimentSenseCorrer: '2026-08-29', venciment: '2026-08-31', corregut: true, qui: 'agent' });
    expect(t['segona-justificacio']).toMatchObject({ vencimentSenseCorrer: '2027-08-29', venciment: '2027-08-30' });
    expect(t['signatura-acords'].font).toBe(PROGRAMES['kit-digital'].font);
    expect(t['signatura-acords'].verificar).toBe(VERIFICAR);
  });

  test('sense la data d’origen, pendent; amb la fita feta, complit', () => {
    const exp = creaExpedient({
      ...KIT,
      dates: { sollicitud: '2026-01-15', concessio: '2026-03-16' },
      fites: [...KIT.fites.slice(0, 2), { id: 'signatura-acords', fase: 'acord', feta: '2026-06-01' }]
    });
    const t = Object.fromEntries(terminisExpedient(exp).map((x) => [x.termini, x]));
    expect(t['signatura-acords'].complit).toBe(true);
    expect(t['primera-justificacio']).toMatchObject({ venciment: null, complit: false });
    expect(t['primera-justificacio'].pendent).toMatch(/factura/);
    expect(faseActual(exp)).toBe('acord');
  });

  test('els terminis propis de la convocatòria', () => {
    const [justificacio] = terminisExpedient(creaExpedient(SUBVENCIO));
    expect(justificacio).toMatchObject({
      id: idTerminiExpedient('exp_subvencio_prova', 'justificacio'), termini: 'justificacio', venciment: '2026-07-01', consequencia: 'Sense justificar, cal reintegrar.'
    });
  });

  test('l’id compost és opac i curt: dos ids llargs i vàlids no passen mai del límit del motor', () => {
    const llarg = creaExpedient({
      ...SUBVENCIO,
      id: `exp_${'a'.repeat(92)}`,
      terminis: [{ id: `j_${'b'.repeat(94)}`, fase: 'justificacio', origen: 'concessio', durada: 3, unitat: 'mesos' }]
    });
    const [t] = terminisExpedient(llarg);
    expect(t.id).toMatch(/^texp_[a-p]{16}$/);
    expect(t).toMatchObject({ expedient: llarg.id, termini: `j_${'b'.repeat(94)}`, venciment: '2026-07-01' });
    expect(idTerminiExpedient(llarg.id, t.termini)).toBe(t.id);
    expect(idTerminiExpedient('exp_kit_prova', 'signatura-acords')).not.toBe(idTerminiExpedient('exp_kit_prova', 'primera-justificacio'));
  });

  test('avisos i .ics: el mateix camí que les obligacions, sense el nom de l’expedient', () => {
    const terminis = terminisExpedient(creaExpedient(KIT));
    // El 8 de setembre: la signatura vence d'ací a 8 dies; la primera justificació va véncer fa 8 i ja no s'avisa.
    expect(avisosDe(terminis, '2026-09-08').map((a) => [a.id, a.nivell, a.categoria])).toEqual([[idTerminiExpedient('exp_kit_prova', 'signatura-acords'), 'avis', 'expedient']]);
    const ics = icsDeTerminis(terminis, { ara: new Date(Date.UTC(2026, 9, 4)) });
    expect(ics).toContain(`SUMMARY:${TITOLS.expedient}`);
    expect(ics).not.toContain('exp_kit_prova');
    expect(ics).not.toContain('Bo digital');
  });
});

describe('conservació i avisos de forma', () => {
  test('mentre és viu, protegit i sense data; després, 5 anys (Kit Digital) o 4 (subvenció)', () => {
    expect(conservacioExpedient(creaExpedient(KIT))).toMatchObject({ fins: null, protegit: true, verificar: VERIFICAR });
    expect(conservacioExpedient(creaExpedient({ ...KIT, dates: { ...KIT.dates, justificacio: '2027-09-01' } })).fins).toBe('2032-09-01');
    expect(conservacioExpedient(creaExpedient({ ...KIT, dates: { ...KIT.dates, justificacio: '2027-09-01', pagament: '2027-12-01' } })).fins).toBe('2032-12-01');
    expect(conservacioExpedient(creaExpedient({ ...SUBVENCIO, dates: { concessio: '2026-04-01', justificacio: '2026-07-01' } })).fins).toBe('2030-07-01');
  });

  test('el Kit Digital demana un codi comptable diferenciat', () => {
    expect(avisosExpedient(creaExpedient(KIT))).toEqual([]);
    expect(avisosExpedient(creaExpedient({ ...KIT, codiComptable: undefined })).map((a) => a.codi)).toEqual(['SENSE_CODI_COMPTABLE']);
    expect(avisosExpedient(creaExpedient(SUBVENCIO))).toEqual([]);
  });
});

describe('el doble finançament', () => {
  const kit = creaExpedient(KIT);
  const ambLaMateixa = (importImputat, importFactura = 300000) => creaExpedient({
    ...SUBVENCIO, imputacions: [{ factura: 'fac_prova_001', importFactura, importImputat }]
  });

  test('dos expedients poden compartir una factura mentre la suma no passe del 100 %', () => {
    expect(comprovaDobleFinancament([kit, ambLaMateixa(100000)])).toEqual([]);
  });

  test('per damunt del 100 %, error amb l’excés i els expedients', () => {
    expect(comprovaDobleFinancament([kit, ambLaMateixa(100001)])).toEqual([{
      codi: 'DOBLE_FINANCAMENT', factura: 'fac_prova_001', importFactura: 300000, sumaImputada: 300001, exces: 1,
      expedients: ['exp_kit_prova', 'exp_subvencio_prova']
    }]);
  });

  test('la mateixa factura amb imports diferents, i dos expedients amb el mateix id', () => {
    expect(comprovaDobleFinancament([kit, ambLaMateixa(1000, 299999)]).map((i) => i.codi)).toEqual(['IMPORT_FACTURA_INCOHERENT']);
    expect(comprovaDobleFinancament([kit, kit]).map((i) => i.codi)).toEqual(['EXPEDIENT_REPETIT', 'DOBLE_FINANCAMENT']);
    expect(() => comprovaDobleFinancament('no')).toThrow(TypeError);
  });

  test('potImputar diu quant en queda, sense crear res', () => {
    const subvencio = creaExpedient(SUBVENCIO);
    const nova = { expedient: 'exp_subvencio_prova', factura: 'fac_prova_001', importFactura: 300000 };
    expect(potImputar([kit, subvencio], { ...nova, importImputat: 100000 })).toMatchObject({ possible: true, disponible: 100000, codi: null });
    expect(potImputar([kit, subvencio], { ...nova, importImputat: 100001 })).toMatchObject({ possible: false, disponible: 100000, codi: 'DOBLE_FINANCAMENT' });
    expect(potImputar([kit, subvencio], { ...nova, importFactura: 1, importImputat: 1 }).codi).toBe('IMPORT_FACTURA_INCOHERENT');
    expect(potImputar([kit], { ...nova, expedient: 'exp_kit_prova', importImputat: 1 }).codi).toBe('FACTURA_REPETIDA');
    expect(() => potImputar([kit], { ...nova, importImputat: 0 })).toThrow(TypeError);
  });

  test('fons europeus: el Kit Digital i una altra ajuda sobre la mateixa factura avisen, encara que no passen del 100 %', () => {
    const subvencio = ambLaMateixa(100000);
    // La guarda del 100 % no veu res: no bloqueja.
    expect(comprovaDobleFinancament([kit, subvencio])).toEqual([]);
    expect(avisosFinancament([kit, subvencio])).toEqual([{
      codi: 'POSSIBLE_DOBLE_FINANCAMENT_UE', factura: 'fac_prova_001', expedients: ['exp_kit_prova', 'exp_subvencio_prova'], bloqueja: false,
      missatge: MISSATGE_DOBLE_UE, verificar: VERIFICAR
    }]);
    expect(MISSATGE_DOBLE_UE).toMatch(/Reglament \(UE\) 2021\/241/);
    // potImputar també ho diu, i continua dient que cap.
    const nova = { expedient: 'exp_subvencio_prova', factura: 'fac_prova_001', importFactura: 300000, importImputat: 50000 };
    const resposta = potImputar([kit, creaExpedient(SUBVENCIO)], nova);
    expect(resposta).toMatchObject({ possible: true, codi: null });
    expect(resposta.avisos.map((a) => [a.codi, a.bloqueja])).toEqual([['POSSIBLE_DOBLE_FINANCAMENT_UE', false]]);
  });

  test('sense cap expedient amb fons europeus segurs, o amb una sola imputació, no hi ha avís', () => {
    const una = creaExpedient(SUBVENCIO);
    const altra = creaExpedient({ ...SUBVENCIO, id: 'exp_subvencio_dos', imputacions: [{ factura: 'fac_prova_002', importFactura: 100000, importImputat: 10000 }] });
    expect(avisosFinancament([una, altra])).toEqual([]);
    expect(avisosFinancament([kit])).toEqual([]);
    expect(potImputar([kit], { expedient: 'exp_kit_prova_dos', factura: 'fac_prova_009', importFactura: 1000, importImputat: 1000 }).avisos).toEqual([]);
    expect(() => avisosFinancament('no')).toThrow(TypeError);
  });
});
