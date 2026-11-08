import { describe, expect, it } from 'vitest';
import { normalizePublicationDate as iso, publicationDateFromLocal as local, publicationDateNow as now, publicationSortKey as key, sortPublications as sort } from './publicationDateControl.js';
describe('R51 date validation', () => {
  it.each([
    ['2026-11-07T11:30:15.123+01:00', '2026-11-07T10:30:15.123Z'],
    ['2026-11-07T00:30-03:00', '2026-11-07T03:30:00.000Z'],
    ['2026-11-07T00:15+05:45', '2026-11-06T18:30:00.000Z'],
    ['2024-02-29T12:00:00.1Z', '2024-02-29T12:00:00.100Z'],
    ['2000-02-29T12:00:00.12Z', '2000-02-29T12:00:00.120Z'],
    ['1000-01-01T00:00Z', '1000-01-01T00:00:00.000Z'],
    ['9999-12-31T23:59:59.999Z', '9999-12-31T23:59:59.999Z']
  ])('normalitza %s sense perdre l’instant', (input, expected) => expect(iso(input)).toBe(expected));
  it.each(['2026-02-30T10:00Z', '2026-02-29T10:00Z', '1900-02-29T10:00Z', '2026-13-01T10:00Z', '2026-00-01T10:00Z', '2026-01-00T10:00Z', '2026-11-07', '2026-11-07T10:00', '2026-11-07T24:00Z', '2026-11-07T10:60Z', '2026-11-07T10:00:60Z', '2026-11-07T10:00+12:60', '2026-11-07T10:00+14:01', '2026-11-07T10:00+15:00', '2026-11-07T10:00+01', '2026-11-07T10:00:00.1234Z', ' 2026-11-07T10:00Z', '2026-11-07T10:00Zx', '0999-12-31T23:00Z', '1000-01-01T00:00+14:00', '9999-12-31T23:59-14:00', null, 0, {}])('rebutja %j sense normalització silenciosa', value => expect(() => iso(value)).toThrow('R51_PUBLICATION_DATE_INVALID'));
  it('una hora ambigua és dos instants segons l’offset explícit', () => {
    expect(local('2026-10-25T02:30', 120)).toBe('2026-10-25T00:30:00.000Z');
    expect(local('2026-10-25T02:30', 60)).toBe('2026-10-25T01:30:00.000Z');
  });
  it('accepta segons locals i offset negatiu', () => expect(local('2026-11-07T10:20:30', -210)).toBe('2026-11-07T13:50:30.000Z'));
  it.each([undefined, null, '60', 0.5, 841, -841, NaN, Infinity])('rebutja offset local %s', offset => expect(() => local('2026-11-07T10:00', offset)).toThrow());
  it('ara captura exactament el rellotge injectat i els mil·lisegons', () => {
    const tick = Date.UTC(2026, 10, 7, 10, 30, 1, 234);
    expect(now(tick)).toBe('2026-11-07T10:30:01.234Z');
    expect(now(tick)).toBe(now(tick));
    expect(now(0)).toBe('1970-01-01T00:00:00.000Z');
  });
  it.each([undefined, null, '0', 0.1, NaN, Infinity, 1e20, Date.UTC(999, 0, 1)])('rebutja rellotge %s', value => expect(() => now(value)).toThrow());
});
describe('R51 editorial order', () => {
  it('publish_date mana i updated_at no puja la peça', () => {
    expect(key({ publish_date: '2026-01-01T10:00Z', created_at: '2026-02-01T10:00Z', updated_at: '2099-01-01T10:00Z' })).toBe(Date.parse('2026-01-01T10:00Z'));
  });
  it.each([undefined, null, ''])('fallback creat per data absent %s', publish_date => expect(key({ publish_date, created_at: '2026-01-01T10:00Z' })).toBe(Date.parse('2026-01-01T10:00Z')));
  it('absència real és null; valor invàlid no fa fallback', () => {
    expect(key({})).toBeNull();
    expect(() => key({ publish_date: 'demà', created_at: '2026-01-01T10:00Z' })).toThrow();
    expect(() => key({ created_at: 'demà' })).toThrow();
    expect(key({ publish_date: '2026-01-01T10:00Z', created_at: 'demà' })).toBe(Date.parse('2026-01-01T10:00Z'));
  });
  it('ordre editorial descendent, empat per ID, sense data al final; no muta', () => {
    const records = Object.freeze([
      Object.freeze({ id: 'z', publish_date: '2026-11-01T10:00Z', updated_at: '2099-01-01T00:00Z' }),
      Object.freeze({ id: 'a', publish_date: '2026-11-01T11:00+01:00' }),
      Object.freeze({ id: 'future', publish_date: '2099-01-01T00:00Z', status: 'published' }),
      Object.freeze({ id: 'old', created_at: '2020-01-01T00:00Z' }),
      Object.freeze({ id: 'missing' })
    ]);
    expect(sort(records).map(r => r.id)).toEqual(['future', 'a', 'z', 'old', 'missing']);
    expect(records.map(r => r.id)).toEqual(['z', 'a', 'future', 'old', 'missing']);
    expect(sort(records)[0]).toBe(records[2]);
  });
  it('no inferix excepcions de títol, lloc, ID o secció', () => {
    expect(sort([{ id: 'torre', title: 'La Torre', created_at: '2020-01-01T00:00Z' }, { id: 'other', title: 'Altre', created_at: '2026-01-01T00:00Z' }]).map(r => r.id)).toEqual(['other', 'torre']);
  });
  it.each([[{ id: 'x' }, { id: 'x' }], [{ id: '' }], [{}], [null]])('rebutja identitats/records invàlids %j', rows => expect(() => sort(rows)).toThrow());
  it('no executa getters ni usa dates heretades', () => {
    const inherited = Object.create({ publish_date: '2099-01-01T00:00Z' });
    expect(key(inherited)).toBeNull();
    let called = false;
    expect(() => key({ get publish_date() { called = true; return ''; } })).toThrow('R51_RECORD_INVALID');
    expect(called).toBe(false);
  });
});
