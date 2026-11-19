import { describe, it, expect } from 'vitest';
import { instantMadrid, disponibilitatSenseSolapament, assignaPlacesRsvp } from './disponibilitatSenseSolapament.js';
const interval = (id, inici, fi, places = 1) => ({ id, inici, fi, places });
describe('IDEA-284 disponibilitat [inici, fi) i Madrid DST', () => {
  it('franges consecutives no se solapen', () => {
    expect(disponibilitatSenseSolapament([interval('a', 0, 10), interval('b', 10, 20)])).toEqual({ disponible: true, maxOcupacio: 1, conflictes: [] });
  });
  it('agrupa segments exactes i capacitat ponderada', () => {
    expect(disponibilitatSenseSolapament([interval('a', 0, 10, 2), interval('b', 5, 15)], { capacitat: 2 })).toEqual({ disponible: false, maxOcupacio: 3,
      conflictes: [{ inici: 5, fi: 10, ocupacio: 3, capacitat: 2 }] });
  });
  it('distingeix les dues 02:30 de la tardor', () => {
    const a = instantMadrid('2026-10-25T02:30:00+02:00'), b = instantMadrid('2026-10-25T02:30:00+01:00');
    expect(b - a).toBe(3_600_000);
    expect(disponibilitatSenseSolapament([interval('a', '2026-10-25T02:15:00+02:00', '2026-10-25T02:45:00+02:00'),
      interval('b', '2026-10-25T02:15:00+01:00', '2026-10-25T02:45:00+01:00')]).disponible).toBe(true);
  });
  it('el salt de primavera té una hora real', () => {
    expect(instantMadrid('2026-03-29T03:30:00+02:00') - instantMadrid('2026-03-29T01:30:00+01:00')).toBe(3_600_000);
  });
  it.each(['2026-03-29T02:30:00+01:00', '2026-03-29T02:30:00+02:00', '2026-07-01T12:00:00+01:00',
    '2026-02-30T12:00:00Z', '2026-10-25T02:30:00', '2026-11-19', '2026-01-01T24:00:00Z'])('rebutja hora inexistent/ambigua %s', v => expect(() => instantMadrid(v)).toThrow());
  it('accepta UTC absolut i fraccions sense dependre de TZ del procés', () => {
    expect(instantMadrid('2026-11-19T00:30:00.1Z')).toBe(Date.UTC(2026, 10, 19, 0, 30, 0, 100));
    expect(instantMadrid('2026-11-19T01:30:00+01:00')).toBe(instantMadrid('2026-11-19T00:30:00Z'));
  });
  it('refusa IDs duplicats, franges buides, capacitats falses i overflow', () => {
    expect(() => disponibilitatSenseSolapament([interval('a', 0, 1), interval('a', 0, 2)])).toThrow();
    expect(() => disponibilitatSenseSolapament([interval('a', 1, 1)])).toThrow();
    expect(() => disponibilitatSenseSolapament([], { capacitat: 0 })).toThrow();
    expect(() => disponibilitatSenseSolapament([interval('a', 0, 1, Number.MAX_SAFE_INTEGER), interval('b', 0, 2)])).toThrow();
  });
  it('fuzz: 1000 franges contra oracle discret independent; entrada immutable', () => {
    let seed = 284;
    const rand = n => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed % n; };
    for (let ronda = 0; ronda < 100; ronda++) {
      const llista = Array.from({ length: 10 }, (_, i) => { const a = rand(30); return interval(`i${i}`, a, a + 1 + rand(10), 1 + rand(3)); });
      const text = JSON.stringify(llista), capacitat = 1 + rand(9);
      const oracle = Array.from({ length: 40 }, (_, t) => llista.reduce((a, b) => a + (b.inici <= t && t < b.fi ? b.places : 0), 0));
      const r = disponibilitatSenseSolapament(llista, { capacitat });
      expect(r.maxOcupacio).toBe(Math.max(...oracle));
      expect(r.disponible).toBe(Math.max(...oracle) <= capacitat);
      for (let t = 0; t < 40; t++) expect(r.conflictes.some(c => c.inici <= t && t < c.fi)).toBe(oracle[t] > capacitat);
      expect(JSON.stringify(llista)).toBe(text);
    }
  });
  it('100k intervals congestionats generen un segment, no parelles quadràtiques', () => {
    const r = disponibilitatSenseSolapament(Array.from({ length: 100_000 }, (_, i) => interval(`i${i}`, 0, 100)));
    expect(r.maxOcupacio).toBe(100_000); expect(r.conflictes).toHaveLength(1);
  });
});
describe('RSVP capacitat i espera FIFO determinista', () => {
  const rsvp = (id, places = 1, creada = 0, estat = 'activa') => ({ id, personaId: `p-${id}`, places, creada, estat });
  it('manté ordre temporal i desempat estable sense locale', () => {
    const r = assignaPlacesRsvp({ capacitat: 2, inscripcions: [rsvp('z'), rsvp('a'), rsvp('b')] });
    expect(r.confirmades.map(x => x.id)).toEqual(['a', 'b']); expect(r.espera.map(x => x.id)).toEqual(['z']);
  });
  it('grup que no cap encapçala espera i no el supera ningú', () => {
    const r = assignaPlacesRsvp({ capacitat: 3, inscripcions: [rsvp('a', 2), rsvp('b', 2), rsvp('c', 1)] });
    expect(r.confirmades.map(x => x.id)).toEqual(['a']); expect(r.espera.map(x => x.id)).toEqual(['b', 'c']); expect(r.placesLliures).toBe(1);
  });
  it('cancel·lació allibera capacitat i promou la cua', () => {
    const r = assignaPlacesRsvp({ capacitat: 2, inscripcions: [rsvp('a', 2, 0, 'cancel_lada'), rsvp('b', 2, 1)] });
    expect(r.confirmades.map(x => x.id)).toEqual(['b']); expect(r.placesOcupades).toBe(2);
  });
  it('capacitat zero produeix espera i refusa persona duplicada', () => {
    expect(assignaPlacesRsvp({ capacitat: 0, inscripcions: [rsvp('a')] }).espera).toHaveLength(1);
    expect(() => assignaPlacesRsvp({ capacitat: 2, inscripcions: [rsvp('a'), { ...rsvp('b'), personaId: 'p-a' }] })).toThrow();
  });
  it('fuzz: 1000 persones, capacitat mai excedida i permutació invariant', () => {
    const inscripcions = Array.from({ length: 1000 }, (_, i) => rsvp(String(i).padStart(4, '0'), i % 4 + 1, i % 17));
    const a = assignaPlacesRsvp({ capacitat: 478, inscripcions });
    const b = assignaPlacesRsvp({ capacitat: 478, inscripcions: inscripcions.toReversed() });
    expect(a).toEqual(b); expect(a.placesOcupades).toBeLessThanOrEqual(478);
    expect(a.confirmades.length + a.espera.length).toBe(1000);
  });
});
