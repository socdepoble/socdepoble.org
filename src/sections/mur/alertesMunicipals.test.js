/**
 * T3.3 (marató nocturna 261101, carril B3) · Qui és una alerta municipal del
 * Mur i qui la pot marcar (alertesMunicipals.js), pur.
 *  · les etiquetes (alerta, emergència, bàndol urgent) es normalitzen:
 *    majúscules, accents, espais, guions i un «#» no compten;
 *  · només una publicació del Mur (mai un acte, un producte ni el sistema);
 *  · només si la signa una entitat que el resolutor diu que és un ajuntament:
 *    una persona, una entitat qualsevol o un payload que diu de si mateix que
 *    és un ajuntament no en fan cap;
 *  · la vigència (72 h des de la data de la targeta, o futura) i l'ordre.
 */
import { describe, expect, test } from 'vitest';
import {
  alertaMunicipalDe, candidatsAAlerta, entitatQueSigna, esPublicacioDelMur, esVigent, normalitzaEtiqueta,
  tipusDAlerta, TIPUS_ALERTA, VIGENCIA_ALERTA_MS, vigentsDalt
} from './alertesMunicipals.js';
import { elementDeFilaPublicada } from '../../data/mapejadorSeccions.js';

const AJUNTAMENT = '7d2c1a40-0000-4000-8000-00000000a1a1';
const FORN = '7d2c1a40-0000-4000-8000-00000000f0f0';
const esAjuntament = (id) => id === AJUNTAMENT;
const publicacio = (camps) => ({ id: 'p', type: 'feed', title: 'Avís', ...camps });

describe('normalitzaEtiqueta', () => {
  test.each([
    ['Bàndol urgent', 'bandol_urgent'],
    ['BÀNDOL URGENT!', 'bandol_urgent'],
    ['bandol-urgent', 'bandol_urgent'],
    ['  bàndol   urgent  ', 'bandol_urgent'],
    ['#Emergència', 'emergencia'],
    ['EMERGÈNCIA MUNICIPAL', 'emergencia_municipal'],
    ['Alerta', 'alerta'],
    [{ text: 'Alerta municipal', className: 'sdp-badge-category' }, 'alerta_municipal']
  ])('%j → %s', (etiqueta, esperada) => {
    expect(normalitzaEtiqueta(etiqueta)).toBe(esperada);
  });

  test('el que no és text, o és massa llarg, no és cap etiqueta', () => {
    for (const valor of [null, undefined, 3, true, {}, { text: 5 }, ['alerta'], 'a'.repeat(65)]) {
      expect(normalitzaEtiqueta(valor)).toBe('');
    }
  });
});

describe('tipusDAlerta (només les etiquetes)', () => {
  test('alerta i emergència són «Alerta municipal»; bàndol urgent, «Bàndol urgent»', () => {
    expect(tipusDAlerta(publicacio({ labels: [{ text: 'Emergència' }] }))).toBe('alerta');
    expect(tipusDAlerta(publicacio({ labels: ['ALERTA'] }))).toBe('alerta');
    expect(tipusDAlerta(publicacio({ labels: [{ text: 'Bàndol Urgent' }] }))).toBe('bandol_urgent');
    expect(TIPUS_ALERTA.alerta).toMatchObject({ text: 'Alerta municipal', to: 'error' });
    expect(TIPUS_ALERTA.bandol_urgent).toMatchObject({ text: 'Bàndol urgent', to: 'avis' });
  });

  test('també a category, categories, tags i tag del contingut de l’administració', () => {
    expect(tipusDAlerta(publicacio({ category: 'emergencia' }))).toBe('alerta');
    expect(tipusDAlerta(publicacio({ categories: ['Bàndol urgent'] }))).toBe('bandol_urgent');
    expect(tipusDAlerta(publicacio({ tags: ['bandol_urgent'] }))).toBe('bandol_urgent');
    expect(tipusDAlerta(publicacio({ tag: 'Alerta' }))).toBe('alerta');
  });

  test('si en porta de les dues, mana l’alerta', () => {
    expect(tipusDAlerta(publicacio({ labels: ['Bàndol urgent', 'Emergència'] }))).toBe('alerta');
  });

  test('una etiqueta semblant no ho és («bàndol», «urgent», «alertes», «sense alerta»)', () => {
    for (const etiqueta of ['Bàndol', 'Urgent', 'Alertes', 'Sense alerta', 'bàndol urgentíssim', 'Publicació']) {
      expect(tipusDAlerta(publicacio({ labels: [etiqueta] })), etiqueta).toBeNull();
    }
  });

  test('mai un acte, un producte, un poble ni una pàgina del sistema', () => {
    for (const fora of [{ type: 'event' }, { type: 'market' }, { type: 'product' }, { type: 'poble' }, { type: 'sistema' }, { isSystem: true }]) {
      expect(esPublicacioDelMur(publicacio(fora))).toBe(false);
      expect(tipusDAlerta(publicacio({ ...fora, labels: ['Alerta'] }))).toBeNull();
    }
    expect(tipusDAlerta(null)).toBeNull();
    expect(tipusDAlerta([])).toBeNull();
  });

  test('una llista d’etiquetes enorme no es recorre sencera', () => {
    const labels = [...Array.from({ length: 40 }, () => 'Festa'), 'Alerta'];
    expect(tipusDAlerta(publicacio({ labels }))).toBeNull();
  });
});

describe('qui la pot marcar: només un ajuntament que signa', () => {
  test('signada per l’ajuntament (author_org_id), alerta; per una altra entitat, no', () => {
    expect(alertaMunicipalDe(publicacio({ labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT }), esAjuntament)).toBe('bandol_urgent');
    expect(alertaMunicipalDe(publicacio({ labels: ['Bàndol urgent'], author_org_id: FORN }), esAjuntament)).toBeNull();
  });

  test('una persona no la pot marcar, encara que el payload diga que és un ajuntament', () => {
    const vei = publicacio({ labels: ['Emergència'], ownerUserId: 'u-veí', kind: 'city_hall', author_kind: 'city_hall', author_name: 'Ajuntament' });
    expect(entitatQueSigna(vei)).toBeNull();
    expect(alertaMunicipalDe(vei, () => true)).toBeNull();
  });

  test('l’ajuntament que un veí escriu al payload no arriba a la publicació (elementDeFilaPublicada)', () => {
    const fila = elementDeFilaPublicada({
      id: 'f1', titol: 'Tall d’aigua', createdAt: '2026-11-01T08:00:00.000Z', ownerUserId: 'u-veí', authorOrgId: null,
      payload: { type: 'feed', title: 'Tall d’aigua', labels: [{ text: 'Bàndol urgent' }], author_org_id: AJUNTAMENT, authorOrgId: AJUNTAMENT, author_entity_id: AJUNTAMENT }
    });
    expect(tipusDAlerta(fila)).toBe('bandol_urgent');
    expect(entitatQueSigna(fila)).toBeNull();
    expect(alertaMunicipalDe(fila, esAjuntament)).toBeNull();
    expect(candidatsAAlerta([fila])).toEqual([]);
  });

  test('la fila signada de veres per l’ajuntament (la columna) sí', () => {
    const fila = elementDeFilaPublicada({
      id: 'f2', titol: 'Pluges', createdAt: '2026-11-01T08:00:00.000Z', ownerUserId: 'u-alcaldia', authorOrgId: AJUNTAMENT,
      payload: { type: 'feed', title: 'Pluges', labels: [{ text: 'Emergència', className: 'sdp-badge-category' }] }
    });
    expect(alertaMunicipalDe(fila, esAjuntament)).toBe('alerta');
  });

  test('sense resolutor, o si no diu exactament cert, cap alerta', () => {
    const item = publicacio({ labels: ['Alerta'], author_org_id: AJUNTAMENT });
    expect(alertaMunicipalDe(item, undefined)).toBeNull();
    expect(alertaMunicipalDe(item, () => 'sí')).toBeNull();
    expect(alertaMunicipalDe(item, () => 1)).toBeNull();
  });

  test('candidats: només les entitats que signen una etiqueta d’alerta, sense repetir i en ordre', () => {
    const items = [
      publicacio({ id: 'a', labels: ['Alerta'], author_org_id: FORN }),
      publicacio({ id: 'b', labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'c', labels: ['Emergència'], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'd', labels: ['Festa'], author_org_id: 'una-altra' }),
      publicacio({ id: 'e', labels: ['Alerta'], ownerUserId: 'u-1' }),
      { id: 'f', type: 'market', labels: ['Alerta'], author_org_id: 'botiga' }
    ];
    expect(candidatsAAlerta(items)).toEqual([AJUNTAMENT, FORN].sort());
    expect(candidatsAAlerta(null)).toEqual([]);
  });
});

describe('vigència i ordre', () => {
  const ARA = Date.parse('2026-11-01T12:00:00.000Z');

  test('vigent fins a 72 h des de la data de la targeta, i també si és futura; sense data, no', () => {
    expect(VIGENCIA_ALERTA_MS).toBe(72 * 3600 * 1000);
    expect(esVigent(ARA, ARA)).toBe(true);
    expect(esVigent(ARA - VIGENCIA_ALERTA_MS, ARA)).toBe(true);
    expect(esVigent(ARA - VIGENCIA_ALERTA_MS - 1, ARA)).toBe(false);
    expect(esVigent(ARA + 86_400_000, ARA)).toBe(true);
    expect(esVigent(null, ARA)).toBe(false);
    expect(esVigent(Number.NaN, ARA)).toBe(false);
  });

  test('vigentsDalt: les que complixen pugen, en el seu ordre; la resta no es mou', () => {
    const entrades = ['a', 'B1', 'c', 'B2', 'd'].map((id) => ({ id }));
    expect(vigentsDalt(entrades, ({ id }) => id.startsWith('B')).map(({ id }) => id)).toEqual(['B1', 'B2', 'a', 'c', 'd']);
    expect(vigentsDalt(entrades, () => false)).toBe(entrades);
    expect(vigentsDalt(null, () => true)).toEqual([]);
  });
});
