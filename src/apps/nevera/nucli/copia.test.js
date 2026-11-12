// @vitest-environment node
/* La Nevera de Casa · la còpia sdp.nevera.copia.v1: anar i tornar, i tot el
   que no és una còpia es rebutja amb una raó que la persona entén. */
import { describe, expect, test } from 'vitest';
import {
  ESQUEMA_COPIA, LIMITS, MAX_COPIA, afig, afigPerNom, creaCopia, creaLlista, estatInicial, llegixCopia, marcaACasa, normalitzaEstat, serialitzaCopia
} from './index.js';

function estatDeMostra() {
  let estat = creaLlista(estatInicial(), 'Mercat del dijous');
  estat = afig(estat, 'l-1', 'tomaques', { especificacio: '1 kg' });
  estat = afigPerNom(estat, 'casa', 'Kombutxa');
  return marcaACasa(estat, 'ous', 'se-n-acaba');
}

describe('creaCopia i serialitzaCopia', () => {
  test('la forma: esquema, creada si es dona, i les dades netes (sense l’esquema intern)', () => {
    const copia = creaCopia(estatDeMostra(), { creada: '2026-10-02T10:00:00.000Z' });
    expect(Object.keys(copia)).toEqual(['esquema', 'creada', 'dades']);
    expect(copia.esquema).toBe(ESQUEMA_COPIA);
    expect(Object.keys(copia.dades).sort()).toEqual(['casa', 'darreraLlista', 'llistes', 'propis', 'seq']);
    expect(creaCopia(estatInicial())).not.toHaveProperty('creada');
  });

  test('una nevera plena dins dels límits pot recuperar la seua pròpia còpia amb text multibyte', () => {
    const propis = Array.from({ length: LIMITS.propis }, (_, i) => ({ id: `p-${i + 1}`, nom: `Producte ${i} ${'🥕'.repeat(LIMITS.nom)}` }));
    const linies = propis.map(({ id }) => ({ articleId: id, especificacio: '🥕'.repeat(LIMITS.especificacio) }));
    const estat = normalitzaEstat({
      propis,
      llistes: Array.from({ length: LIMITS.llistes }, (_, i) => ({
        id: `l-${i + 1}`, nom: `Llista ${i}`, linies, recents: linies.slice(0, LIMITS.recents)
      }))
    });
    const text = serialitzaCopia(estat);
    expect(new TextEncoder().encode(text).byteLength).toBeGreaterThan(1000000);
    const llegida = llegixCopia(text);
    expect(llegida.ok).toBe(true);
    expect(llegida.estat).toEqual(estat);
  });

  test('anar i tornar: serialitzar i llegir dona el mateix estat', () => {
    const estat = estatDeMostra();
    const text = serialitzaCopia(estat, { creada: '2026-10-02T10:00:00.000Z' });
    expect(text.endsWith('}\n')).toBe(true);
    const llegida = llegixCopia(text);
    expect(llegida.ok).toBe(true);
    expect(llegida.estat).toEqual(estat);
    expect(llegida.resum).toEqual({ llistes: 2, articles: 2, propis: 1 });
  });
});

describe('llegixCopia rebutja el que no és una còpia', () => {
  test.each([
    ['', 'El fitxer és buit.'],
    ['   ', 'El fitxer és buit.'],
    ['{ no és json', 'El fitxer no és un JSON vàlid.'],
    ['[]', `No és una còpia de La Nevera de Casa (${ESQUEMA_COPIA}).`],
    ['{"esquema":"sdp.altra.v1","dades":{}}', `No és una còpia de La Nevera de Casa (${ESQUEMA_COPIA}).`],
    [`{"esquema":"${ESQUEMA_COPIA}","dades":[]}`, `No és una còpia de La Nevera de Casa (${ESQUEMA_COPIA}).`]
  ])('%j', (text, error) => {
    expect(llegixCopia(text)).toEqual({ ok: false, error });
  });

  test('un fitxer massa gran o que no és text', () => {
    expect(llegixCopia('x'.repeat(MAX_COPIA + 1)).ok).toBe(false);
    expect(llegixCopia('é'.repeat(MAX_COPIA / 2 + 1))).toEqual({ ok: false, error: 'El fitxer és massa gran per a ser una còpia de la nevera.' });
    expect(llegixCopia(null)).toEqual({ ok: false, error: 'El fitxer és buit.' });
  });

  test('les dades passen per la llista blanca: el que no s’entén es descarta i __proto__ no contamina res', () => {
    const text = JSON.stringify({
      esquema: ESQUEMA_COPIA,
      dades: { llistes: [{ id: 'mercat', nom: 'Mercat', linies: [{ articleId: 'llet' }, { articleId: 'inventat' }], script: 'x' }] }
    }).replace('"script"', '"__proto__":{"contaminat":true},"script"');
    const llegida = llegixCopia(text);
    expect(llegida.ok).toBe(true);
    expect(llegida.estat.llistes).toEqual([expect.objectContaining({ id: 'mercat', linies: [{ articleId: 'llet', especificacio: '' }] })]);
    expect(Object.keys(llegida.estat.llistes[0])).not.toContain('script');
    expect({}.contaminat).toBeUndefined();
  });
});
