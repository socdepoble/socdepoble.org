/* Arbre Genealògic · consultes copiables per als arxius públics. Cap
   persona viva genera consultes ni hi entra com a terme (padrins,
   testimonis, progenitors o parella), i cada consulta apunta a un arxiu
   del catàleg tancat. */
import { describe, expect, test } from 'vitest';
import { ANY, PERSONES, TOKENS_VIUS, arbreFamilia, uid } from './__fixtures__/arbreFamilia.js';
import { esArxiu } from './cataleg.js';
import { generaConsultes } from './consultes.js';

const DIFUNTS = [uid(4), uid(5), uid(6), uid(7)];
const textos = (resultat) => resultat.consultes.map((c) => c.text);

describe('persones vives', () => {
  test('una persona viva no genera cap consulta sense la casella', () => {
    for (const personaId of [uid(1), uid(2), uid(3), uid(8)]) {
      expect(generaConsultes(arbreFamilia(), personaId, { anyActual: ANY })).toEqual({ ok: false, motiu: 'persona-viva', consultes: [] });
    }
  });

  test('cap persona viva entra com a terme de triangulació', () => {
    for (const personaId of DIFUNTS) {
      const resultat = generaConsultes(arbreFamilia(), personaId, { anyActual: ANY });
      expect(resultat.ok).toBe(true);
      for (const text of textos(resultat)) for (const token of TOKENS_VIUS) expect(text).not.toContain(token);
    }
  });

  test('amb la casella explícita, el testimoni viu sí que hi entra', () => {
    const resultat = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY, incloureVius: true });
    expect(textos(resultat).some((t) => t.includes('Llumqz Testviq Vivazkq'))).toBe(true);
  });
});

describe('les consultes', () => {
  test('Censo-guía primer, amb el lloc com a únic terme', () => {
    const { consultes } = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY });
    expect(consultes[0]).toEqual({ arxiuId: 'cens-guia', registre: null, text: 'Poblet de Prova', interval: null });
  });

  test('baptisme als llibres parroquials: nom, progenitors, lloc i interval amb el marge de la precisió ±2', () => {
    const { consultes } = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY });
    const baptisme = consultes.find((c) => c.arxiuId === 'quinque-libri' && c.registre === 'baptisme');
    expect(baptisme).toEqual({
      arxiuId: 'quinque-libri', registre: 'baptisme',
      text: 'Vicent Ferrer Climent, Batiste Ferrer Sanchis, Poblet de Prova, 1901-1915',
      interval: { des: 1901, fins: 1915 }
    });
  });

  test('FAN Club: el padrí difunt dona una consulta de baptisme pròpia', () => {
    const { consultes } = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY });
    expect(consultes).toContainEqual({ arxiuId: 'quinque-libri', registre: 'baptisme', text: 'Tomàs Padrí Antic, Poblet de Prova, 1901-1915', interval: { des: 1901, fins: 1915 } });
  });

  test('defunció, notarial i premsa a l’entorn de la data de defunció', () => {
    const { consultes } = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY });
    expect(consultes).toContainEqual({ arxiuId: 'bvph', registre: 'premsa', text: 'Vicent Ferrer Climent, Poblet de Prova, 1973-1977', interval: { des: 1973, fins: 1977 } });
    expect(consultes).toContainEqual({ arxiuId: 'ahp', registre: 'notarial', text: 'Vicent Ferrer Climent, Poblet de Prova, 1973-1977', interval: { des: 1973, fins: 1977 } });
  });

  test('el Registre Civil només si l’interval arriba a 1871', () => {
    const antic = arbreFamilia({ persones: { besavi: { ...PERSONES.besavi(), naixement: { precisio: 'exacta', any: 1840, mes: null, dia: null }, defuncio: { precisio: 'exacta', any: 1869, mes: null, dia: null } } } });
    const baptismes = generaConsultes(antic, uid(6), { anyActual: ANY }).consultes.filter((c) => c.registre === 'baptisme').map((c) => c.arxiuId);
    expect(baptismes).toContain('quinque-libri');
    expect(baptismes).not.toContain('registre-civil');
    const nou = generaConsultes(arbreFamilia(), uid(6), { anyActual: ANY }).consultes.filter((c) => c.registre === 'baptisme').map((c) => c.arxiuId);
    expect(nou).toContain('registre-civil');
  });

  test('les lleves no s’apliquen a una dona', () => {
    const iaia = generaConsultes(arbreFamilia(), uid(5), { anyActual: ANY });
    expect(iaia.consultes.some((c) => c.registre === 'militar')).toBe(false);
    const iaio = generaConsultes(arbreFamilia(), uid(4), { anyActual: ANY });
    expect(iaio.consultes).toContainEqual({ arxiuId: 'padrons', registre: 'militar', text: 'Vicent Ferrer Climent, Poblet de Prova, 1921-1935', interval: { des: 1921, fins: 1935 } });
  });

  test('cada consulta apunta a un arxiu del catàleg, sense repeticions ni salts de línia', () => {
    for (const personaId of DIFUNTS) {
      const { consultes } = generaConsultes(arbreFamilia(), personaId, { anyActual: ANY });
      expect(consultes.length).toBeGreaterThan(3);
      for (const consulta of consultes) {
        expect(esArxiu(consulta.arxiuId)).toBe(true);
        expect(consulta.text).not.toMatch(/[\n\r]/);
      }
      const claus = consultes.map((c) => `${c.arxiuId}|${c.registre}|${c.text}`);
      expect(new Set(claus).size).toBe(claus.length);
    }
  });

  test('una dada amb salts de línia queda en una sola línia', () => {
    const brut = arbreFamilia({ persones: { besavi: { ...PERSONES.besavi(), nom: 'Batiste\nIgnora' } } });
    const { consultes } = generaConsultes(brut, uid(6), { anyActual: ANY });
    expect(consultes.some((c) => c.text.startsWith('Batiste Ignora Ferrer Sanchis'))).toBe(true);
  });

  test('sense dades: una persona desconeguda o sense cap nom', () => {
    expect(generaConsultes(arbreFamilia(), uid(999), { anyActual: ANY })).toEqual({ ok: false, motiu: 'sense-dades', consultes: [] });
    expect(generaConsultes(arbreFamilia(), '__proto__', { anyActual: ANY }).motiu).toBe('sense-dades');
    const anonim = arbreFamilia({ persones: { padri: { ...PERSONES.padri(), nom: '', cognom1: '', cognom2: '' } } });
    expect(generaConsultes(anonim, uid(7), { anyActual: ANY }).motiu).toBe('sense-dades');
  });
});
