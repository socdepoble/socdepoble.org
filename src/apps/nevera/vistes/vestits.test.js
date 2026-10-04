// @vitest-environment node
/* La Nevera de Casa · el vestit dels productes de botiga: la línia de davall
   (marca · envàs i quantitat). Articles sintètics. */
import { describe, expect, test } from 'vitest';
import { afig, creaArticlePropi, estatInicial, llegixCopia, serialitzaCopia } from '../nucli/index.js';
import { articlesVestits, detallDeProducte, entradetaDe, liniesVestides } from './vestits.js';

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

/* REGLA D'OR 1 (ordre del Mestre, 261004) · La boina de cada targeta la decidix la vista
   (autoria.js, que entra a la plataforma): el vestit només la passa, per a cada article, amb
   l'article sencer (propi o no). Sense, cap boina. */
describe('l’autoria dels vestits', () => {
  const estat = afig(creaArticlePropi(estatInicial(), 'Kombutxa'), 'casa', 'p-1');
  const autoria = (art) => ({ nom: art?.propi ? 'Persona' : 'Projecte' });

  test('articlesVestits: la boina de qui signa cada article, o cap', () => {
    const vestits = articlesVestits(estat, { autoria });
    expect(vestits.find((a) => a.id === 'llet').autoria).toEqual({ nom: 'Projecte' });
    expect(vestits.find((a) => a.id === 'p-1').autoria).toEqual({ nom: 'Persona' });
    expect(articlesVestits(estat).every((a) => a.autoria === undefined)).toBe(true);
  });

  test('liniesVestides: la boina de l’article de cada línia, o cap', () => {
    const files = [{ articleId: 'p-1', especificacio: '' }, { articleId: 'llet', especificacio: '' }];
    expect(liniesVestides(estat, files, { autoria }).map((l) => l.autoria)).toEqual([{ nom: 'Persona' }, { nom: 'Projecte' }]);
    expect(liniesVestides(estat, files).map((l) => l.autoria)).toEqual([undefined, undefined]);
  });
});

/* Arreglo del verificador (ordre del Mestre, 261004, «l'entradeta que pot mentir») · Un article
   propi no diu on s'ha creat: una còpia feta en un altre dispositiu i recuperada ací (Ajustos,
   «Recupera una còpia») porta articles propis que no s'han creat en este. Mai s'inventen dades. */
describe('l’entradeta d’un article propi', () => {
  test('diu «Article propi», també després de recuperar una còpia d’un altre dispositiu', () => {
    const altre = afig(creaArticlePropi(estatInicial(), 'Kombutxa'), 'casa', 'p-1');
    const recuperada = llegixCopia(serialitzaCopia(altre));
    expect(recuperada.ok).toBe(true);
    for (const estatDeLaCopia of [altre, recuperada.estat]) {
      const propi = articlesVestits(estatDeLaCopia).find((a) => a.id === 'p-1');
      expect(propi.entradeta).toBe('Article propi');
      expect(propi.entradeta).not.toMatch(/dispositiu|creat/);
    }
    expect(liniesVestides(recuperada.estat, [{ articleId: 'p-1', especificacio: '' }])[0].entradeta).toBe('Article propi');
    /* Els altres orígens, com eren. */
    expect(entradetaDe({ id: 'llet' })).toBe('Article de base del catàleg');
    expect(entradetaDe(undefined)).toBeUndefined();
  });
});
