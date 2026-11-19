import { expect, test } from 'vitest';
import { ordreTokenPublicacio, esTokenPublicacio } from './publicacionsCas.js';
test('exact microsecond order remains exact at both ends of supported civil calendar',()=>{
 for(const year of ['0001','2026','9999']){
  const a=ordreTokenPublicacio(`${year}-12-30T01:02:03.123456Z`),b=ordreTokenPublicacio(`${year}-12-30T01:02:03.123457Z`);expect(b-a).toBe(1n);
 }expect(ordreTokenPublicacio('2026-11-18T02:02:03.123456+01:00')).toBe(ordreTokenPublicacio('2026-11-18T01:02:03.123456Z'));
 expect(ordreTokenPublicacio('2026-11-17T22:02:03.123456-03:00')).toBe(ordreTokenPublicacio('2026-11-18T01:02:03.123456Z'));
});
test('invalid calendar, leap days, clock fields, offsets and nonprimitive values fail closed',()=>{
 for(const input of ['2026-02-30T01:00:00.123456Z','2026-02-29T00:00:00Z','0000-01-01T00:00:00Z','2026-13-01T00:00:00Z','2026-01-01T24:00:00Z','2026-01-01T00:00:60Z','2026-01-01T00:00:00+16:00','2026-01-01T00:00:00+01:60','2026-01-01T00:00:00.1234567Z',null,0,{},[]]) expect(esTokenPublicacio(input),String(input)).toBe(false);
 expect(esTokenPublicacio('2024-02-29T23:59:59.999999Z')).toBe(true);
});
