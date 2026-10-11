// @vitest-environment node
/* La Nevera de Casa · les receptes, la part de dades (perReceptes.js): l'estat
   de la Nevera com a existències del recomanador i les recomanacions com a
   articles i línies de l'esquelet. Onada 12 (261011; ordres 261011_0130,
   punt 6). Articles de base i propis sintètics. */
import { describe, expect, test } from 'vitest';
import { RECEPTES, afig, afigPerNom, creaArticlePropi, estatInicial, marcaACasa, receptaPerId } from '../nucli/index.js';
import {
  SECCIONS_RECEPTES, articleDIngredient, existenciesDeCasa, faltaDeRecepta, liniesQueFalten, receptesVestides, recomanacionsDeCasa,
  seccionsDeReceptes, textosDeRecepta
} from './perReceptes.js';

const aCasa = (parells, estat = estatInicial()) => Object.entries(parells).reduce((acumulat, [id, valor]) => marcaACasa(acumulat, id, valor), estat);
const propi = (estat, nom) => {
  const nou = creaArticlePropi(estat, nom);
  return [nou, nou.propis[nou.propis.length - 1].id];
};

describe('existenciesDeCasa', () => {
  test('«N’hi ha» i «Se n’acaba» són existències; «S’ha acabat» i el que no se seguix, no', () => {
    const estat = aCasa({ tomaques: 'hi-ha', cebes: 'se-n-acaba', alls: 'acabat' });
    expect(existenciesDeCasa(estat)).toEqual([{ ingredient: 'tomaca', estat: 'hi-ha' }, { ingredient: 'ceba', estat: 'se-n-acaba' }]);
    expect(existenciesDeCasa(estatInicial())).toEqual([]);
  });

  test('un article propi casa pel nom (sinònims inclosos); un que no és cap ingredient, no', () => {
    const [ambPatates, patates] = propi(estatInicial(), 'Patates');
    const [ambPenques, penques] = propi(ambPatates, 'Penques');
    const [ambTots, kombutxa] = propi(ambPenques, 'Kombutxa');
    const estat = aCasa({ [patates]: 'hi-ha', [penques]: 'hi-ha', [kombutxa]: 'hi-ha', llet: 'hi-ha', 'tomaca-fregida': 'hi-ha' }, ambTots);
    expect(existenciesDeCasa(estat)).toEqual([{ ingredient: 'creilla', estat: 'hi-ha' }, { ingredient: 'penca', estat: 'hi-ha' }]);
  });

  /* Correcció del refutador (261011, R1) · Els productes de botiga casen per la taula d'ids. */
  test('un producte de botiga que de veres és l’ingredient compta; un plat preparat que es diu igual, no', () => {
    const estat = aCasa({ 'mer-patatas-5-kg': 'hi-ha', 'mer-cebollas-2-kg': 'se-n-acaba', 'mer-lentejas': 'hi-ha', 'mer-tomate-frito-560-g': 'hi-ha' });
    expect(existenciesDeCasa(estat)).toEqual([{ ingredient: 'creilla', estat: 'hi-ha' }, { ingredient: 'ceba', estat: 'se-n-acaba' }]);
  });

  test('cap data ni quantitat: el Rebost no en guarda, i la vista no n’inventa', () => {
    const estat = aCasa({ tomaques: 'hi-ha', pa: 'hi-ha' });
    for (const existencia of existenciesDeCasa(estat)) expect(Object.keys(existencia).sort()).toEqual(['estat', 'ingredient']);
  });
});

describe('recomanacionsDeCasa i receptesVestides', () => {
  test('pa, tomaques i oli a casa: el pa amb tomaca va el primer i «Ho tens tot»', () => {
    const estat = aCasa({ pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' });
    const recomanacions = recomanacionsDeCasa(estat);
    expect(recomanacions).toHaveLength(RECEPTES.length);
    expect(recomanacions[0]).toMatchObject({ receptaId: 'pa-amb-tomaca', grup: 'a-punt' });
    const [primera] = receptesVestides(recomanacions);
    expect(primera).toEqual({
      id: 'pa-amb-tomaca',
      nom: 'Pa amb tomaca',
      categoriaId: 'a-punt',
      subtitol: receptaPerId('pa-amb-tomaca').resum,
      secundari: 'Tens els 3 ingredients. Aprofites el fresc que tens: tomaques.',
      estat: 'normal'
    });
  });

  test('cada recepta és un article d’una de les tres seccions, amb l’explicació a la línia de davall', () => {
    const articles = receptesVestides(recomanacionsDeCasa(estatInicial()));
    const seccions = new Set(SECCIONS_RECEPTES.map((seccio) => seccio.id));
    expect(articles.map((a) => a.id).sort()).toEqual(RECEPTES.map((r) => r.id).sort());
    for (const article of articles) {
      expect(seccions.has(article.categoriaId), article.id).toBe(true);
      expect(article.secundari, article.id).toMatch(/^No tens cap dels \d+ ingredients\. Falten: /);
      expect(article.subtitol, article.id).toBe(receptaPerId(article.id).resum);
    }
    expect(seccionsDeReceptes()).toEqual([
      { id: 'a-punt', nom: 'Ho tens tot', ordre: 0, visible: true },
      { id: 'quasi', nom: 'Et falta poc', ordre: 1, visible: true },
      { id: 'lluny', nom: 'Et falta més', ordre: 2, visible: true }
    ]);
  });

  test('«Se n’acaba» compta i s’avisa', () => {
    const estat = aCasa({ pa: 'hi-ha', tomaques: 'se-n-acaba', 'oli-oliva': 'hi-ha' });
    const pa = receptesVestides(recomanacionsDeCasa(estat)).find((a) => a.id === 'pa-amb-tomaca');
    expect(pa.categoriaId).toBe('a-punt');
    expect(pa.secundari).toContain('Se n’acaben: tomaques.');
  });
});

describe('el que cal comprar per a cuinar', () => {
  test('articleDIngredient: el de base si n’hi ha; si no, un de propi; si no, null', () => {
    expect(articleDIngredient(estatInicial(), 'tomaca')).toMatchObject({ id: 'tomaques' });
    expect(articleDIngredient(estatInicial(), 'penca')).toBeNull();
    const [estat, id] = propi(estatInicial(), 'Card');
    expect(articleDIngredient(estat, 'penca')).toMatchObject({ id, propi: true });
    /* R1 · Encara que a casa hi haja les creïlles de la botiga, afegir a la llista oferix l'article de base. */
    const ambBotiga = aCasa({ 'mer-patatas-5-kg': 'acabat' });
    expect(articleDIngredient(ambBotiga, 'creilla')).toMatchObject({ id: 'creilles' });
    expect(articleDIngredient(ambBotiga, 'creilla').font).toBeUndefined();
  });

  test('R1 · una línia d’un producte de botiga ja compta com a «és a la llista»', () => {
    const base = aCasa({ pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' });
    const ambOusDeBotiga = afig(base, 'casa', 'mer-huevos-grandes-l');
    expect(liniesQueFalten(ambOusDeBotiga, 'casa', recomanacionsDeCasa(ambOusDeBotiga)).map((linia) => linia.id)).not.toContain('ou');
  });

  test('liniesQueFalten: els que falten a les receptes «Et falta poc», amb l’article que els posarà i per a què', () => {
    const estat = aCasa({ pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' });
    const linies = liniesQueFalten(estat, 'casa', recomanacionsDeCasa(estat));
    const ous = linies.find((linia) => linia.id === 'ou');
    expect(ous).toMatchObject({ articleId: 'ous', nom: 'Ous' });
    expect(ous.detall).toMatch(/^Per a: /);
    expect(ous.detall).toContain('Ous amb tomaca');
    for (const linia of linies) expect(typeof linia.id).toBe('string');
    expect(new Set(linies.map((linia) => linia.id)).size).toBe(linies.length);
  });

  test('el que ja és a la llista no es torna a proposar (encara que hi siga amb un altre nom)', () => {
    const base = aCasa({ pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' });
    const abans = liniesQueFalten(base, 'casa', recomanacionsDeCasa(base)).map((linia) => linia.id);
    expect(abans).toEqual(expect.arrayContaining(['ou', 'all']));
    const ambOus = afig(base, 'casa', 'ous');
    expect(liniesQueFalten(ambOus, 'casa', recomanacionsDeCasa(ambOus)).map((linia) => linia.id)).not.toContain('ou');
    const ambAjos = afigPerNom(base, 'casa', 'Ajos');
    expect(liniesQueFalten(ambAjos, 'casa', recomanacionsDeCasa(ambAjos)).map((linia) => linia.id)).not.toContain('all');
  });

  test('faltaDeRecepta: els obligatoris d’una recepta que no són a la llista; un ingredient sense article porta articleId null', () => {
    const estat = aCasa({ cigrons: 'hi-ha', creilles: 'hi-ha' });
    const olla = recomanacionsDeCasa(estat).find((r) => r.receptaId === 'olla');
    expect(faltaDeRecepta(estat, 'casa', olla)).toEqual([
      { id: 'nap', articleId: null, nom: 'Naps', detall: undefined },
      { id: 'penca', articleId: null, nom: 'Penques', detall: undefined }
    ]);
    const ambNaps = afigPerNom(estat, 'casa', 'Naps');
    expect(faltaDeRecepta(ambNaps, 'casa', olla).map((linia) => linia.id)).toEqual(['penca']);
    expect(faltaDeRecepta(estat, 'casa', undefined)).toEqual([]);
  });

  test('afegir el que falta pel nom posa l’article de base de sempre, no un de propi repetit', () => {
    const estat = aCasa({ pa: 'hi-ha', tomaques: 'hi-ha', 'oli-oliva': 'hi-ha' });
    const ous = liniesQueFalten(estat, 'casa', recomanacionsDeCasa(estat)).find((linia) => linia.id === 'ou');
    const nou = afigPerNom(estat, 'casa', ous.nom);
    expect(nou.propis).toEqual([]);
    expect(nou.llistes[0].linies).toEqual([{ articleId: 'ous', especificacio: '' }]);
  });
});

describe('textosDeRecepta', () => {
  test('els obligatoris amb la quantitat, els opcionals a part, i la nota que diu que és orientatiu', () => {
    expect(textosDeRecepta(receptaPerId('pa-amb-tomaca'))).toEqual({
      ingredients: 'Per a 4 racions: pa (4 llesques); tomaques (2 de madures); oli d’oliva (un raig).',
      opcionals: 'Si en tens, també: sal (un pessic); alls (1 gra).',
      nota: 'Receptari orientatiu: les quantitats són aproximades i cada casa el fa a la seua manera.'
    });
  });

  test('un substitut es diu amb «o», i sense recepta no hi ha textos', () => {
    expect(textosDeRecepta(receptaPerId('olla')).ingredients).toContain('penques o bledes (3)');
    expect(textosDeRecepta(null)).toBeNull();
  });
});
