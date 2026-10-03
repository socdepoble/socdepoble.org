// @vitest-environment node
/* La Nevera de Casa · el vestit dels productes de botiga: la línia de davall
   (marca · envàs i quantitat). Articles sintètics. */
import { describe, expect, test } from 'vitest';
import { detallDeProducte } from './vestits.js';

const article = (envas, quantitat, unitat, marca = 'Marca Inventada') => ({ marca, envas, quantitat, unitat });

describe('detallDeProducte', () => {
  test('marca · envàs i quantitat, amb la coma decimal', () => {
    expect(detallDeProducte(article('Bote', 600, 'g'))).toBe('Marca Inventada · Bote 600 g');
    expect(detallDeProducte(article('Brik', 1.5, 'l'))).toBe('Marca Inventada · Brik 1,5 l');
  });

  test('la quantitat no es repetix si l’envàs ja la diu', () => {
    expect(detallDeProducte(article('Botella 500 ml', 500, 'ml'))).toBe('Marca Inventada · Botella 500 ml');
    expect(detallDeProducte(article('Paquete 3 u', 3, 'u'))).toBe('Marca Inventada · Paquete 3 u');
    expect(detallDeProducte(article('4 tarrinas x 62,5 g', 62.5, 'g'))).toBe('Marca Inventada · 4 tarrinas x 62,5 g');
  });

  test('si l’envàs en diu una altra (el pes brut, la de cada unitat), es conserven les dues', () => {
    expect(detallDeProducte(article('2 paquetes x 200 g', 400, 'g'))).toBe('Marca Inventada · 2 paquetes x 200 g 400 g');
    expect(detallDeProducte(article('Paquete 1500 g', 150, 'g'))).toBe('Marca Inventada · Paquete 1500 g 150 g');
  });

  test('sense marca, sense envàs o sense quantitat, només el que hi ha', () => {
    expect(detallDeProducte(article('Bote', null, 'g', ''))).toBe('Bote');
    expect(detallDeProducte(article('', 2, 'kg'))).toBe('Marca Inventada · 2 kg');
    expect(detallDeProducte({})).toBe('');
  });
});
