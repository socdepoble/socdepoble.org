import { describe, expect, test } from 'vitest';
import {
  aplicaRsvp, canviaAforamentRsvp, creaEstatRsvp, datesDeLEsdeveniment, resumAforamentRsvp
} from './estatCalendari.js';
import { acteAEsdeveniment } from '../mur/agendaMur.js';

const nou = (aforament = 2, altres = {}) => creaEstatRsvp({ idEsdeveniment: 'fira-2026', aforament, ...altres });
const resposta = (idParticipant, places = 1, revisioEsperada = 0) => ({ idParticipant, resposta: 'assistire', places, revisioEsperada });

describe('R32.5 · publicació i acte són dates independents', () => {
  test('l’anunci anticipat conserva cada data; el model existent situa l’acte, no la publicació', () => {
    const item = { id: 'fira', title: 'Fira', publish_date: '2026-11-17T10:30:00+01:00', date: '2026-12-01', time: '17:00' };
    expect(datesDeLEsdeveniment(item)).toEqual({ dataPublicacio: item.publish_date, dataActe: item.date });
    expect(acteAEsdeveniment(item).inici.dataHora).toBe('2026-12-01T17:00');
    expect(datesDeLEsdeveniment({ ...item, updated_at: '2030-01-01' })).toEqual(datesDeLEsdeveniment(item));
  });

  test('una crònica posterior a l’acte és legítima; no imposa un ordre inventat', () => {
    expect(datesDeLEsdeveniment({ dataPublicacio: '2026-11-17', dataActe: '2026-11-01' }))
      .toEqual({ dataPublicacio: '2026-11-17', dataActe: '2026-11-01' });
  });

  test('mai substituïx una data absent per l’altra ni per updated_at', () => {
    expect(datesDeLEsdeveniment({ date: '2026-11-17' })).toEqual({ dataPublicacio: null, dataActe: '2026-11-17' });
    expect(datesDeLEsdeveniment({ created_at: '2026-11-17T00:00Z' })).toEqual({ dataPublicacio: '2026-11-17T00:00Z', dataActe: null });
    expect(datesDeLEsdeveniment({ updated_at: '2026-11-17' })).toEqual({ dataPublicacio: null, dataActe: null });
    expect(datesDeLEsdeveniment()).toEqual({ dataPublicacio: null, dataActe: null });
  });

  test('l’inici del model i l’antic payload data_inici es lligen en el seu camp', () => {
    expect(datesDeLEsdeveniment({ inici: { data: '2028-02-29' } }).dataActe).toBe('2028-02-29');
    expect(datesDeLEsdeveniment({ inici: { dataHora: '2026-12-01T23:30:00-03:00' } }).dataActe).toBe('2026-12-01T23:30:00-03:00');
    expect(datesDeLEsdeveniment({ dades: { data_inici: '2026-11-19' } }).dataActe).toBe('2026-11-19');
  });

  test.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-11-17T25:00Z', '2026-11-17T00:00+99:00', '', 'demà', 123, {}])('rebutja la data invàlida %j sense normalitzar-la silenciosament', valor => {
    expect(() => datesDeLEsdeveniment({ dataActe: valor })).toThrow(TypeError);
    expect(() => datesDeLEsdeveniment({ publish_date: valor, created_at: '2026-11-17' })).toThrow(TypeError);
  });
});

describe('R32.5 · invariants pures RSVP i aforament finit', () => {
  test('l’última plaça s’accepta i la següent es rebutja sense mutació', () => {
    const inici = nou(1);
    const primera = aplicaRsvp(inici, resposta('anna'));
    expect(primera).toMatchObject({ ok: true, codi: 'actualitzat', estat: { revisio: 1 } });
    expect(resumAforamentRsvp(primera.estat)).toEqual({ aforament: 1, ocupades: 1, disponibles: 0, complet: true });
    const segona = aplicaRsvp(primera.estat, resposta('bernat', 1, 1));
    expect(segona).toEqual({ ok: false, codi: 'aforament-complet', estat: primera.estat });
    expect(segona.estat).toBe(primera.estat);
    expect(resumAforamentRsvp(inici).ocupades).toBe(0);
  });

  test('dos tocs de la mateixa resposta no acumulen places ni revisió', () => {
    const una = aplicaRsvp(nou(5), resposta('anna', 2)).estat;
    const repetida = aplicaRsvp(una, resposta('anna', 2, 1));
    expect(repetida).toEqual({ ok: true, codi: 'sense-canvis', estat: una });
    expect(repetida.estat).toBe(una);
    expect(resumAforamentRsvp(una).ocupades).toBe(2);
    expect(aplicaRsvp(una, resposta('anna', 2)).codi).toBe('revisio-divergent');
  });

  test('augmentar una reserva compta només la diferència; reduir-la allibera places', () => {
    let estat = aplicaRsvp(nou(3), resposta('anna', 2)).estat;
    estat = aplicaRsvp(estat, resposta('bernat', 1, 1)).estat;
    expect(aplicaRsvp(estat, resposta('anna', 3, 2)).codi).toBe('aforament-complet');
    estat = aplicaRsvp(estat, resposta('anna', 1, 2)).estat;
    expect(resumAforamentRsvp(estat).disponibles).toBe(1);
    expect(aplicaRsvp(estat, resposta('bernat', 2, 3)).ok).toBe(true);
  });

  test.each(['no-assistire', 'pendent'])('passar a %s allibera places; després pot tornar a reservar', canvi => {
    const ple = aplicaRsvp(nou(2), resposta('anna', 2)).estat;
    const alliberat = aplicaRsvp(ple, { idParticipant: 'anna', resposta: canvi, revisioEsperada: 1 }).estat;
    expect(alliberat.respostes).toEqual([{ idParticipant: 'anna', resposta: canvi, places: 0 }]);
    expect(resumAforamentRsvp(alliberat).disponibles).toBe(2);
    expect(aplicaRsvp(alliberat, resposta('anna', 2, 2)).ok).toBe(true);
    expect(ple.respostes[0].places).toBe(2);
  });

  test('aforament zero està tancat; una resposta negativa no ocupa', () => {
    const zero = nou(0);
    expect(aplicaRsvp(zero, resposta('anna')).codi).toBe('aforament-complet');
    expect(resumAforamentRsvp(zero)).toEqual({ aforament: 0, ocupades: 0, disponibles: 0, complet: true });
    const negativa = aplicaRsvp(zero, { idParticipant: 'anna', resposta: 'no-assistire', revisioEsperada: 0 });
    expect(negativa.ok).toBe(true);
    expect(resumAforamentRsvp(negativa.estat).ocupades).toBe(0);
  });

  test('una còpia antiga no pot substituir la resposta o capacitat més nova', () => {
    const estat = aplicaRsvp(nou(), resposta('anna')).estat;
    expect(aplicaRsvp(estat, resposta('bernat', 1, 0))).toMatchObject({ ok: false, codi: 'revisio-divergent' });
    expect(canviaAforamentRsvp(estat, { aforament: 10, revisioEsperada: 0 })).toMatchObject({ ok: false, codi: 'revisio-divergent' });
    expect(() => aplicaRsvp(estat, { idParticipant: 'anna', resposta: 'pendent' })).toThrow(TypeError);
  });

  test('dos candidats de la mateixa instantània necessiten CAS remot: només un es reaplica a revisió vigent', () => {
    const inicial = nou(1);
    const a = aplicaRsvp(inicial, resposta('anna'));
    const b = aplicaRsvp(inicial, resposta('bernat'));
    expect(a.ok && b.ok).toBe(true);
    expect(a.estat.revisio).toBe(b.estat.revisio);
    // El motor pur no és un servidor. Després de confirmar A, el CAS de B falla.
    expect(aplicaRsvp(a.estat, resposta('bernat')).codi).toBe('revisio-divergent');
    expect(aplicaRsvp(a.estat, resposta('bernat', 1, 1)).codi).toBe('aforament-complet');
  });

  test('no deixa reduir per baix de l’ocupació ni per davall de zero', () => {
    const estat = aplicaRsvp(nou(4), resposta('anna', 3)).estat;
    expect(canviaAforamentRsvp(estat, { aforament: 2, revisioEsperada: 1 }))
      .toEqual({ ok: false, codi: 'aforament-inferior-ocupacio', estat });
    const ajustat = canviaAforamentRsvp(estat, { aforament: 3, revisioEsperada: 1 }).estat;
    expect(ajustat.revisio).toBe(2);
    expect(resumAforamentRsvp(ajustat).complet).toBe(true);
    expect(canviaAforamentRsvp(ajustat, { aforament: 3, revisioEsperada: 2 }).estat).toBe(ajustat);
    expect(() => canviaAforamentRsvp(estat, { aforament: -1, revisioEsperada: 1 })).toThrow(TypeError);
  });

  test('aritmètica exacta en el màxim enter segur, també davant una instantània desbordada', () => {
    const maxim = Number.MAX_SAFE_INTEGER;
    const ple = aplicaRsvp(nou(maxim), resposta('anna', maxim)).estat;
    expect(resumAforamentRsvp(ple).ocupades).toBe(maxim);
    expect(aplicaRsvp(ple, resposta('bernat', 1, 1)).codi).toBe('aforament-complet');
    const corrupte = { ...ple, respostes: [...ple.respostes, { idParticipant: 'bernat', resposta: 'assistire', places: maxim }] };
    expect(() => resumAforamentRsvp(corrupte)).toThrow('sobrevenda');
  });

  test('estat i respostes són còpies congelades, ordenades sense dependre del locale', () => {
    const respostes = [
      { idParticipant: 'zoe', resposta: 'assistire', places: 1 },
      { idParticipant: '__proto__', resposta: 'pendent', places: 0 }
    ];
    const estat = nou(2, { respostes });
    respostes[0].places = 100;
    respostes.push({ idParticipant: 'nova', resposta: 'assistire', places: 100 });
    expect(estat.respostes.map(x => x.idParticipant)).toEqual(['__proto__', 'zoe']);
    expect(estat.respostes[1].places).toBe(1);
    for (const objecte of [estat, estat.respostes, ...estat.respostes]) expect(Object.isFrozen(objecte)).toBe(true);
    expect(nou(2, { respostes: [...estat.respostes].reverse() })).toEqual(estat);
  });

  test.each([null, -1, 1.1, Infinity, NaN, '2', Number.MAX_SAFE_INTEGER + 1])('rebutja aforament i places insegurs %j', valor => {
    expect(() => nou(valor)).toThrow(TypeError);
    expect(() => aplicaRsvp(nou(), resposta('anna', valor))).toThrow(TypeError);
  });

  test.each(['', ' anna', 'anna ', 'a\nb', 'x'.repeat(201), 4, {}, null])('rebutja participant invàlid %j', id => {
    expect(() => aplicaRsvp(nou(), resposta(id))).toThrow(TypeError);
  });

  test('rebutja respostes desconegudes, places incoherents, duplicats i revisió exhaurida', () => {
    for (const [resposta, places] of [['potser', 0], ['assistire', 0], ['pendent', 1], ['no-assistire', 1]]) {
      expect(() => aplicaRsvp(nou(), { idParticipant: 'anna', resposta, places, revisioEsperada: 0 })).toThrow(TypeError);
    }
    const duplicada = { idParticipant: 'anna', resposta: 'assistire', places: 1 };
    expect(() => nou(4, { respostes: [duplicada, duplicada] })).toThrow('duplicat');
    expect(() => resumAforamentRsvp({ ...nou(), respostes: [duplicada, duplicada] })).toThrow('duplicat');
    expect(() => nou(2, { revisio: -1 })).toThrow(TypeError);
    expect(() => creaEstatRsvp({ idEsdeveniment: 'fira' })).toThrow(TypeError);
    expect(() => resumAforamentRsvp({ ...nou(), respostes: [{ idParticipant: 'anna', resposta: 'assistire' }] })).toThrow(TypeError);
    expect(() => aplicaRsvp(nou(2, { revisio: Number.MAX_SAFE_INTEGER }), resposta('anna', 1, Number.MAX_SAFE_INTEGER))).toThrow(RangeError);
  });

  test('3.000 transicions deterministes conserven unicitat, revisió, ocupació i puresa', () => {
    let estat = nou(17);
    let generador = 325;
    for (let pas = 0; pas < 3000; pas += 1) {
      generador = (generador * 1664525 + 1013904223) >>> 0;
      const anterior = estat;
      const abans = JSON.stringify(estat);
      const idParticipant = `participant-${generador % 29}`;
      const places = 1 + (generador % 4);
      const positiva = generador % 5 !== 0;
      const canvi = { idParticipant, resposta: positiva ? 'assistire' : 'no-assistire', places: positiva ? places : 0, revisioEsperada: estat.revisio };
      const resultat = pas % 13 === 0
        ? canviaAforamentRsvp(estat, { aforament: generador % 24, revisioEsperada: estat.revisio })
        : aplicaRsvp(estat, canvi);
      estat = resultat.estat;
      const resum = resumAforamentRsvp(estat);
      expect(JSON.stringify(anterior)).toBe(abans);
      expect(resum.ocupades).toBe(estat.respostes.reduce((n, r) => n + r.places, 0));
      expect(resum.disponibles).toBeGreaterThanOrEqual(0);
      expect(new Set(estat.respostes.map(r => r.idParticipant)).size).toBe(estat.respostes.length);
      expect(estat.revisio).toBe(anterior.revisio + Number(estat !== anterior));
      if (!resultat.ok) expect(estat).toBe(anterior);
    }
  });
});
