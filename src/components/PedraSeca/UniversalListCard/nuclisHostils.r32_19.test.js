// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { taulaDe, csvDe, textWhatsAppDe } from './exportaComu.js';
import { fusionaEspecificacions, quantitatDe, sumaEspecificacio } from './extractorEspecificacio.js';
import { IDS_MODES_COMU, LIMITS_COMU, aplicaAccio } from './nucliComu.js';
import { formatEuros } from '../../../utils/diners.js';
import { comercDelConcepte } from '../../../sections/gestoria/nucli/movimentsBanc.js';
import { comercDelConcepte as comercFulla } from '../../../sections/gestoria/nucli/comercBanc.js';

const tr = (clau) => clau;
const llista = (mode = 'rebost', elementsComu = []) => ({ id: 'llista', titol: 'Mostra', mode, propietariId: 'u', revisio: 2, elementsComu });
function congela(valor) {
  if (!valor || typeof valor !== 'object' || Object.isFrozen(valor)) return valor;
  for (const v of Object.values(valor)) congela(v);
  return Object.freeze(valor);
}
const elementBar = (quantitat, preuCents = null) => ({ id: 'e', nom: 'Pa', capaMode: { estat: 'demanat', quantitat, preuCents, desti: 'barra', demanatPer: { nom: 'Pau' } } });
const cela = (l, clau) => {
  const taula = taulaDe(l, { tr, gestor: true });
  return taula.files[0].celes[taula.capcalera.indexOf(`columna.${clau}`)];
};

describe('exportaComu · textDeCela per les APIs públiques', () => {
  test.each([null, undefined, '', NaN, Infinity, -Infinity, 1.2, '123.45', {}, 1n])('cèntims invàlids (%s) no inventen imports', (valor) => {
    expect(cela(llista('bar_tpv', [elementBar(1, valor)]), 'preu')).toBe('');
  });

  test.each([0, -1, 1, 123456, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER])('els cèntims enters (%s) conserven tots els decimals', (valor) => {
    expect(cela(llista('bar_tpv', [elementBar(1, valor)]), 'preu')).toBe(formatEuros(valor));
  });

  test('la coma decimal només canvia nombres: les cadenes amb punts ixen literals', () => {
    for (const valor of ['1.234.567', 'v1.2.14', 'a.b.c', '1.25']) {
      const l = congela(llista('bar_tpv', [elementBar(valor)]));
      expect(cela(l, 'quantitat')).toBe(valor);
    }
    expect(cela(llista('bar_tpv', [elementBar(1.25)]), 'quantitat')).toBe('1,25');
    expect(cela(llista('bar_tpv', [elementBar(Number.MAX_SAFE_INTEGER)]), 'quantitat')).toBe('9007199254740991');
    for (const valor of [NaN, Infinity, -Infinity]) expect(cela(llista('bar_tpv', [elementBar(valor)]), 'quantitat')).toBe('');
  });

  test('CSV i WhatsApp conserven els punts del text i CSV neutralitza fórmules', () => {
    const l = congela(llista('rebost', [{ id: 'e', nom: '=1+1', capaMode: { estat: 'falta', especificacio: 'versio.1.2', demanatPer: [] } }]));
    const abans = JSON.stringify(l);
    expect(csvDe(l, { tr })).toContain("'=1+1;versio.1.2");
    expect(textWhatsAppDe(l, { tr })).toContain('versio.1.2');
    expect(JSON.stringify(l)).toBe(abans);
  });
});

describe('extractorEspecificacio · límits i incompatibilitat', () => {
  test('fins al límit conserva les peticions i només plega quan el supera', () => {
    const abans = 'a'.repeat(LIMITS_COMU.especificacio - 4);
    expect(fusionaEspecificacions(abans, 'b')).toHaveLength(LIMITS_COMU.especificacio);
    expect(fusionaEspecificacions(abans + 'a', 'b')).toBe(abans + 'a');
    expect(fusionaEspecificacions('x'.repeat(100), 'y'.repeat(100))).toBe('x'.repeat(LIMITS_COMU.especificacio));
    expect(fusionaEspecificacions('1 kg', 'y'.repeat(100), { pendent: false })).toBe('y'.repeat(LIMITS_COMU.especificacio));
  });

  test('plega unitats de la mateixa magnitud sense sumar kg amb litres o envasos diferents', () => {
    const existent = Array(11).fill('1 kg').join(' + ');
    expect(fusionaEspecificacions(existent, '500 g')).toBe('11,5 kg');
    expect(fusionaEspecificacions(existent, '1 l')).toBe(`${existent} + 1 l`);
    for (const incompatible of ['1 litre', '1 paquet', '1 barra']) {
      expect(fusionaEspecificacions(existent, incompatible)).toBe(existent);
      expect(sumaEspecificacio(`${existent} + ${incompatible}`)).toBeNull();
    }
  });

  test('la suma plegada continua sent una quantitat llegible dins de 80 caràcters', () => {
    const enorme = '9'.repeat(76) + ' kg';
    const resultat = fusionaEspecificacions(enorme, enorme);
    expect(resultat).toBe(enorme);
    expect(resultat.length).toBeLessThanOrEqual(LIMITS_COMU.especificacio);
    expect(resultat).not.toMatch(/Infinity|NaN|e\+/);
    const plegada = fusionaEspecificacions(Array(11).fill('1 kg').join(' + '), '500 g');
    expect(quantitatDe(plegada)).toEqual({ valor: 11.5, unitat: 'kg' });
  });
});

describe('nucliComu · context incomplet i congelat', () => {
  test('tots els modes refusen actor absent sense llançar ni mutar', () => {
    for (const mode of IDS_MODES_COMU) {
      const l = congela(llista(mode));
      const accio = congela({ tipus: 'afegeix', entrada: { nom: 'Pa' } });
      for (const ctx of [undefined, null, {}, { actor: null }, { actor: {} }, { actor: { nom: 'Pau' } }, { actor: { id: '' } }]) {
        expect(aplicaAccio(l, accio, congela(ctx))).toMatchObject({ ok: false, error: { codi: 'no-autoritzat' } });
        expect(l.elementsComu).toEqual([]);
        expect(l.revisio).toBe(2);
      }
    }
  });

  test('actor sense nom i context congelat funcionen sense escriure sobre les entrades', () => {
    const l = congela(llista());
    const accio = congela({ tipus: 'afegeix', entrada: { nom: 'Pa' } });
    const ctx = congela({ actor: { id: 'u' }, nouId: () => 'nou', ara: '2026-11-20T12:00:00Z' });
    const r = aplicaAccio(l, accio, ctx);
    expect(r).toMatchObject({ ok: true, llista: { revisio: 3 } });
    expect(r.llista.elementsComu[0].capaMode.demanatPer[0]).toEqual({ usuariId: 'u', nom: '', at: ctx.ara, especificacio: '' });
    expect(l.elementsComu).toEqual([]);
    expect(ctx.actor).toEqual({ id: 'u' });
  });

  test('sense generador d’id la frontera pública torna error estable i cap escriptura parcial', () => {
    const l = congela(llista());
    expect(aplicaAccio(l, { tipus: 'afegeix', entrada: { nom: 'Pa' } }, congela({ actor: { id: 'u' } })))
      .toMatchObject({ ok: false, error: { codi: 'valor-invalid' } });
    expect(l.elementsComu).toEqual([]);
    expect(l.revisio).toBe(2);
  });
});

test('el helper fulla conserva identitat del reexport públic i comerços multilínia', () => {
  expect(comercDelConcepte).toBe(comercFulla);
  expect(comercFulla('OP.TARJ.COMPRA COMERCIO\r\n123456******9876 FORN\rDEL POBLE')).toBe('FORN DEL POBLE');
  for (const concepte of [null, '', 'transferència', 'TARGETA\nFORN']) expect(comercFulla(concepte)).toBeNull();
});
