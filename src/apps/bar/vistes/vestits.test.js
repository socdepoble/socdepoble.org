// @vitest-environment node
/* El Bar · vistes/vestits.js — els al·lèrgens a les rajoles del TPV (ordre
   del Mestre, 261006: «el contracte de dades d'un producte ha de contemplar
   una llista d'al·lèrgens»). articlesDelTpv porta a cada article una còpia
   dels al·lèrgens del producte en l'ordre del Reglament (ordenaAlergens del
   contracte comú) i només si en té; la Caixa (articlesDeCarta) no canvia. Les
   insígnies i la carta per emportar continuen com eren. */
import { describe, expect, test } from 'vitest';
import { ALERGENS } from '../nucli/cataleg.js';
import { afegeixProducte, creaComanda } from '../nucli/comanda.js';
import { llavorCarta } from '../nucli/llavor.js';
import { articlesDeCarta, articlesDelTpv } from './vestits.js';

const ARA = '2026-10-02T07:30:00.000Z';
const perId = (articles) => new Map(articles.map((a) => [a.id, a]));
const senseAlergens = ({ alergens, ...resta }) => {
  void alergens;
  return resta;
};

/* Una comanda de prova amb unes quantes unitats de cada producte. */
function comandaAmb(carta, origen, unitats) {
  let comanda = creaComanda({ id: 'c-prova', tornId: 'torn-prova', origen, ara: ARA, per: 'Cambrer 1' });
  for (const [id, quantitat] of unitats) {
    const producte = carta.productes.find((p) => p.id === id);
    comanda = afegeixProducte(comanda, { producte, quantitat, ivaPerDefecte: 10 }, { ara: ARA, idLinia: `l-${id}` });
  }
  return comanda;
}

describe('articlesDelTpv: els al·lèrgens de cada producte', () => {
  test('un producte amb al·lèrgens els porta en l’ordre del Reglament; un sense, no en porta la clau', () => {
    const articles = perId(articlesDelTpv(llavorCarta()));
    /* La llavor els desa en un altre ordre: croquetes [gluten, llet, ous] i calamars [molluscs, gluten]. */
    expect(articles.get('croquetes').alergens).toEqual(['gluten', 'ous', 'llet']);
    expect(articles.get('calamars').alergens).toEqual(['gluten', 'molluscs']);
    expect(articles.get('flam').alergens).toEqual(['ous', 'llet']);
    expect(articles.get('vi-negre').alergens).toEqual(['sulfits']);
    for (const id of ['cafe-sol', 'olives', 'aigua', 'varis']) expect(articles.get(id), id).not.toHaveProperty('alergens');
  });

  test('cada article de la llavor: els al·lèrgens del seu producte, ni més ni menys, en l’ordre canònic', () => {
    const carta = llavorCarta();
    const productes = new Map(carta.productes.map((p) => [p.id, p]));
    for (const article of articlesDelTpv(carta)) {
      const desats = productes.get(article.id).alergens;
      if (desats.length === 0) {
        expect(article, article.id).not.toHaveProperty('alergens');
        continue;
      }
      expect([...article.alergens].sort(), article.id).toEqual([...desats].sort());
      const posicions = article.alergens.map((a) => ALERGENS.indexOf(a));
      expect(posicions, article.id).toEqual([...posicions].sort((a, b) => a - b));
    }
  });

  test('una còpia: canviar la de l’article no toca la carta, i la carta no canvia', () => {
    const carta = llavorCarta();
    const abans = JSON.stringify(carta);
    const flam = perId(articlesDelTpv(carta)).get('flam');
    expect(flam.alergens).not.toBe(carta.productes.find((p) => p.id === 'flam').alergens);
    flam.alergens.push('peix');
    expect(JSON.stringify(carta)).toBe(abans);
  });

  test('una carta que no s’ha validat: sense repetits ni ids desconeguts; si no en queda cap, sense la clau', () => {
    const carta = llavorCarta();
    carta.productes.find((p) => p.id === 'flam').alergens = ['llet', 'ous', 'llet'];
    carta.productes.find((p) => p.id === 'cafe-sol').alergens = ['xocolata'];
    carta.productes.find((p) => p.id === 'olives').alergens = undefined;
    const articles = perId(articlesDelTpv(carta));
    expect(articles.get('flam').alergens).toEqual(['ous', 'llet']);
    expect(articles.get('cafe-sol')).not.toHaveProperty('alergens');
    expect(articles.get('olives')).not.toHaveProperty('alergens');
  });
});

describe('articlesDelTpv: la resta no canvia', () => {
  test('sense comanda, el TPV és la Caixa més els al·lèrgens; la Caixa no en porta cap', () => {
    const carta = llavorCarta();
    const caixa = articlesDeCarta(carta);
    expect(caixa.some((article) => Object.hasOwn(article, 'alergens'))).toBe(false);
    expect(articlesDelTpv(carta).map(senseAlergens)).toEqual(caixa);
  });

  test('amb comanda: la insígnia, el text per al lector i l’estat, al costat dels al·lèrgens', () => {
    const carta = llavorCarta();
    const comanda = comandaAmb(carta, { tipus: 'barra' }, [['croquetes', 2], ['cafe-sol', 1]]);
    const articles = perId(articlesDelTpv(carta, { comanda }));
    expect(articles.get('croquetes')).toMatchObject({
      estat: 'en-colleccio', insignia: '2', insigniaLector: '2 unitats a la comanda', alergens: ['gluten', 'ous', 'llet']
    });
    expect(articles.get('cafe-sol')).toMatchObject({ estat: 'en-colleccio', insignia: '1', insigniaLector: '1 unitat a la comanda' });
    expect(articles.get('cafe-sol')).not.toHaveProperty('alergens');
    expect(articles.get('flam')).not.toHaveProperty('insignia');
    expect(articles.get('flam').alergens).toEqual(['ous', 'llet']);
  });

  test('per emportar: només el canal, i els que hi són porten els seus al·lèrgens', () => {
    const carta = llavorCarta();
    carta.productes.find((p) => p.id === 'cava').canals = { cartaDigital: true, perEmportar: false };
    const comanda = comandaAmb(carta, { tipus: 'emportar' }, []);
    const articles = perId(articlesDelTpv(carta, { comanda }));
    expect(articles.has('cava')).toBe(false);
    expect(articles.get('vi-negre').alergens).toEqual(['sulfits']);
    expect(articles.get('calamars').alergens).toEqual(['gluten', 'molluscs']);
  });
});
