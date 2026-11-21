// @vitest-environment node
/* La Nevera de Casa · el vestit dels productes de botiga: la línia de davall
   (marca · envàs i quantitat). Articles sintètics. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { defecteSafari16 } from '../../../../tests/helpers/guardaEmojisSafari16.js';
import {
  afig, ARTICLES_BASE, ARTICLES_PRODUCTES, CATEGORIES, creaArticlePropi, estatInicial, llegixCopia, serialitzaCopia
} from '../nucli/index.js';
import { articlesVestits, detallDeProducte, entradetaDe, liniesVestides, pictogramaDe, pictogramaDeSeccio } from './vestits.js';

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

/* v1.2.17 · Gauntlet R1 (L3-09) · Els pictogrames de les rajoles del Rebost i de La compra
   (IDEA-303) es veuen a Safari 16 (Baseline 2022): RGI complets, sense ZWJ i d'Unicode 13 o
   anteriors, amb la mateixa guarda que iconesWiki.test.js. Es miren els de cada article de base,
   cada producte de botiga i cada secció, i també tots els glifs escrits a vestits.js. */
describe('els pictogrames de la Nevera', () => {
  const DEL_CODI = [...readFileSync(path.join(process.cwd(), 'src/apps/nevera/vistes/vestits.js'), 'utf8')
    .matchAll(/'([^'\n]*\p{Extended_Pictographic}[^'\n]*)'/gu)].map((m) => m[1]);

  test('tots es veuen a Safari 16', () => {
    expect(DEL_CODI.length).toBeGreaterThanOrEqual(100);
    const tots = [...new Set([
      ...DEL_CODI,
      ...[...ARTICLES_BASE, ...ARTICLES_PRODUCTES].map(pictogramaDe),
      ...CATEGORIES.map((categoria) => pictogramaDeSeccio(categoria.id)),
      pictogramaDe(null), pictogramaDeSeccio('desconeguda')
    ])];
    expect(tots.map((glif) => [glif, defecteSafari16(glif)]).filter(([, defecte]) => defecte)).toEqual([]);
  });

  test('sonda: la guarda refusa els glifs d’Emoji 14 i 15 que hi havia (abocar, beina, mongetes i bombolles)', () => {
    const vells = [0x1FAD7, 0x1FADB, 0x1FAD8, 0x1FAE7].map((punt) => String.fromCodePoint(punt));
    expect(vells.map(defecteSafari16)).toEqual(Array(4).fill('és posterior a Unicode 13'));
    expect(DEL_CODI.filter((glif) => vells.includes(glif))).toEqual([]);
  });
});

/* v1.2.17 · Gauntlet R2 (L3R2-02) · El pictograma (IDEA-303) només el demanen les vistes aprovades:
   La compra (Compra.jsx, ambPictograma) i el Rebost (modelRebostWorkspace.js, a part). Sense l'opció,
   els vestits del Catàleg i d'A casa no porten cap camp `pictograma`: la graella, la llista i el
   diàleg de detall pinten la icona de la secció i les inicials, com a la v1.2.16. */
describe('el pictograma, només a les vistes aprovades', () => {
  const estat = afig(estatInicial(), 'casa', 'llet');

  test('articlesVestits: sense ambPictograma, cap pictograma; amb ambPictograma: true, el de l’article', () => {
    const sense = articlesVestits(estat);
    expect(sense.length).toBeGreaterThan(50);
    expect(sense.filter((vestit) => Object.hasOwn(vestit, 'pictograma'))).toEqual([]);
    /* Sonda: només `true` l'encén (una cadena o un 1 no). */
    expect(articlesVestits(estat, { ambPictograma: 'sí' }).some((vestit) => Object.hasOwn(vestit, 'pictograma'))).toBe(false);
    const amb = articlesVestits(estat, { ambPictograma: true });
    expect(amb.find((vestit) => vestit.id === 'llet').pictograma).toBe('🥛');
    expect(amb.every((vestit) => typeof vestit.pictograma === 'string' && vestit.pictograma !== '')).toBe(true);
  });

  test('liniesVestides: igual, i la icona de la secció hi és sempre', () => {
    const files = [{ articleId: 'llet', especificacio: '' }];
    const [sense] = liniesVestides(estat, files);
    expect(Object.hasOwn(sense, 'pictograma')).toBe(false);
    expect(sense.icona).toBeTruthy();
    const [amb] = liniesVestides(estat, files, { ambPictograma: true });
    expect(amb.pictograma).toBe('🥛');
    expect(amb.icona).toBe(sense.icona);
  });

  test('a les vistes, només Compra.jsx passa ambPictograma (sonda de font)', () => {
    const VISTES = path.join(process.cwd(), 'src/apps/nevera/vistes');
    const demanen = ['Cataleg.jsx', 'Casa.jsx', 'Compra.jsx', 'Receptes.jsx', 'Temporada.jsx', 'Ajustos.jsx']
      .filter((fitxer) => /ambPictograma:\s*true/.test(readFileSync(path.join(VISTES, fitxer), 'utf8')));
    expect(demanen).toEqual(['Compra.jsx']);
  });
});
