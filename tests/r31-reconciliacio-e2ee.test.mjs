/* Codex R31 (lot_01, reconciliació E2EE) · Fusionat a l'Onada R32 sobre R29-E2EE-02 (decisió tancada
   del Mestre): els codis estructurals sense prova criptogràfica no inventen una causa d'integritat ni
   «un altre dispositiu», i la família de clau absent és la dels codis que el motor emet de veres.
   Els textos es lligen dels cinc diccionaris (L1), no d'una còpia al mòdul. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEXT_XIFRAT_NO_OBERT, TEXT_XIFRAT_TANCAT, causaMissatgeXifratTancat, textMissatgeXifratTancat, textXifratTancat
} from '../src/sections/xat/missatgeXifratHonest.js';
import ca from '../src/config/idiomes/ca.js';
import es from '../src/config/idiomes/es.js';
import en from '../src/config/idiomes/en.js';
import eu from '../src/config/idiomes/eu.js';
import gl from '../src/config/idiomes/gl.js';

const DICCIONARIS = { ca, es, en, eu, gl };
const msg = (codi, extra = {}) => ({ text: 'privat', seguretat: { xifrat: true, verificat: false, codi }, ...extra });

test('R31: els codis sense prova criptogràfica no inventen una causa d’integritat ni un altre dispositiu', () => {
  for (const codi of ['etiqueta-invalida', 'longitud-invalida', 'sobre-invalid']) {
    assert.equal(causaMissatgeXifratTancat(msg(codi)), 'no-disponible', codi);
    assert.equal(textXifratTancat(msg(codi)), TEXT_XIFRAT_NO_OBERT, codi);
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      const t = (clau, reserva) => dic[clau] ?? reserva;
      const text = textMissatgeXifratTancat(msg(codi), t);
      assert.equal(text, dic[TEXT_XIFRAT_NO_OBERT[0]], `${llengua}: la clau neutra és al diccionari`);
      assert.ok(text.length > 10, llengua);
      assert.ok(!text.includes(codi), llengua);
      assert.ok(!text.includes('privat'), llengua);
      assert.notEqual(text, dic[TEXT_XIFRAT_TANCAT[0]], `${llengua}: mai «un altre dispositiu»`);
    }
  }
});

test('R31: separa la clau absent al dispositiu i una autenticació fallida de sobre invàlid', () => {
  assert.equal(causaMissatgeXifratTancat(msg('epoca-desconeguda')), 'clau-absent');
  assert.equal(causaMissatgeXifratTancat(msg('claus-bloquejades')), 'clau-absent');
  assert.equal(causaMissatgeXifratTancat(msg('xifrat-manipulat')), 'integritat');
  assert.equal(causaMissatgeXifratTancat(msg('farciment-invalid')), 'integritat');
  assert.equal(causaMissatgeXifratTancat(msg('codi-futur')), 'no-disponible');
  /* La clau del contacte (CODI_MOTOR.clauAbsent) i el codi literal del kit, que no emet cap productor. */
  assert.equal(causaMissatgeXifratTancat(msg('clau-absent-del-contacte')), 'no-disponible');
  assert.equal(causaMissatgeXifratTancat(msg('clau-absent')), 'no-disponible');
  assert.equal(causaMissatgeXifratTancat({ seguretat: { xifrat: true, verificat: true } }), null);
  /* R29-E2EE-02 · Dos textos visibles: la integritat diu el neutre, com la resta. */
  assert.equal(textXifratTancat(msg('epoca-desconeguda')), TEXT_XIFRAT_TANCAT);
  assert.equal(textXifratTancat(msg('xifrat-manipulat')), TEXT_XIFRAT_NO_OBERT);
});

test('R32: les dues claus del text serè són a les cinc llengües, amb text propi i sense duplicar-se', () => {
  for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
    const tancat = dic[TEXT_XIFRAT_TANCAT[0]];
    const noObert = dic[TEXT_XIFRAT_NO_OBERT[0]];
    assert.equal(typeof tancat, 'string', llengua);
    assert.equal(typeof noObert, 'string', llengua);
    assert.notEqual(tancat, noObert, llengua);
    for (const clau of ['section.xat.missatge.xifratTancat', 'section.xat.missatge.xifratIntegritatNoVerificada', 'section.xat.missatge.xifratNoDisponible']) {
      assert.equal(Object.hasOwn(dic, clau), false, `${llengua}: ${clau} no hi ha de tornar (duplicat o orfe)`);
    }
  }
  assert.equal(ca[TEXT_XIFRAT_TANCAT[0]], TEXT_XIFRAT_TANCAT[1]);
  assert.equal(ca[TEXT_XIFRAT_NO_OBERT[0]], TEXT_XIFRAT_NO_OBERT[1]);
});
