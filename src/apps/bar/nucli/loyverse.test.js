// @vitest-environment node
/* Onada 3 · T2 · l'importador genèric de Loyverse (nucli/loyverse.js) sobre
   una exportació sintètica: noms genèrics, cap marca i cap dada personal.
   La capçalera és la de l'exportació en castellà amb una botiga «[Botiga]»;
   les files es componen amb `producte` i `variant` perquè cada cas diga
   només el que el distingix. */
import { describe, expect, test } from 'vitest';
import { validaCataleg, variantDe } from './cataleg.js';
import { importaLoyverse, slugDe } from './loyverse.js';

const CAPCALERA = [
  'Handle', 'REF', 'Nombre', 'Categoria', 'Descripción', 'Vendido por peso', 'Opción 1 nombre', 'Opción 1 valor', 'Opción 2 nombre',
  'Opción 2 valor', 'Opción 3 nombre', 'Opción 3 valor', 'Coste', 'Codigo de barras', 'REF del componente', 'Cantidad del componente',
  'Seguir el Inventario', 'Disponibles para la venta [Botiga]', 'Precio [Botiga]', 'En inventario [Botiga]', 'Existencias bajas [Botiga]',
  'modificador - "Llet"', 'impuesto - "IVA" (10%)', 'impuesto - "IVA" (21%)'
];
const CLAUS = ['handle', 'ref', 'nom', 'categoria', 'descripcio', 'perPes', 'opcio1', 'valor1', 'opcio2', 'valor2', 'opcio3', 'valor3', 'cost',
  'codiBarres', 'refComponent', 'quantitatComponent', 'inventari', 'disponible', 'preu', 'existencies', 'baixes', 'llet', 'iva10', 'iva21'];

const camp = (valor) => (/[",\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor);
const fila = (valors) => CLAUS.map((clau) => camp(valors[clau] ?? '')).join(',');
const producte = (valors) => fila({ perPes: 'N', cost: '0.00', inventari: 'N', disponible: 'Y', llet: 'N', iva10: 'Y', iva21: 'N', ...valors });
const variant = (valors) => fila({ cost: '0.00', disponible: 'Y', ...valors });
const csv = (files, capcalera = CAPCALERA) => `${[capcalera.map(camp).join(','), ...files].join('\n')}\n`;

const FILES = [
  producte({ handle: 'cafe-sol', ref: '100', nom: 'Cafè sol', categoria: 'Cafeteria', preu: '1.20' }),
  /* Variants en ordre alfabètic, com les exporta Loyverse; Handle entre cometes amb una coma. */
  producte({ handle: 'cervesa-de-barril,gran', ref: '200', nom: 'Cervesa de barril, gran', categoria: 'Cerveseria', opcio1: 'Mida', valor1: 'Gerra', preu: '7.00', iva10: 'N', iva21: 'Y' }),
  variant({ handle: 'cervesa-de-barril,gran', ref: '201', valor1: 'Quint', preu: '1.30' }),
  variant({ handle: 'cervesa-de-barril,gran', ref: '202', valor1: 'Terç', preu: '1.70', cost: '0.50' }),
  producte({ handle: 'varis', ref: '300', nom: 'Varis', preu: 'variable' }),
  producte({ handle: 'licor-d-herbes', ref: '400', nom: 'Licor d’herbes', categoria: 'Licoreria', disponible: 'N', preu: '2.50', iva10: 'N', iva21: 'Y' }),
  producte({ handle: 'aperitiu', ref: '500', nom: 'Aperitiu', categoria: 'Licoreria', preu: '3.00', iva10: 'N' }),
  producte({ handle: 'cafe-amb-llet', ref: '600', nom: 'Cafè amb llet', categoria: 'Cafeteria', preu: '1.50', cost: '0.40', llet: 'Y' }),
  /* El mateix slug que «cafe-sol» (accent) i el mateix nom dins de la categoria. */
  producte({ handle: 'cafè-sol', ref: '700', nom: 'Cafè sol', categoria: 'Cafeteria', preu: '1.30' }),
  producte({ handle: 'pastis', ref: '800', nom: 'Pastís', categoria: 'Postres', descripcio: 'Del dia', inventari: 'Y', existencies: '3.000', preu: '2.00' })
];
const TEXT = csv(FILES);
const codis = (avisos) => avisos.map((a) => a.codi);
const perId = (carta) => new Map(carta.productes.map((p) => [p.id, p]));

describe('lectura bàsica', () => {
  test('un producte sense variants: una variant «Unitat», el preu en cèntims, l’IVA i l’ordre del fitxer', () => {
    const { carta } = importaLoyverse(TEXT);
    const cafe = perId(carta).get('cafe-sol');
    expect(cafe).toMatchObject({
      nom: 'Cafè sol', categoriaId: 'cafeteria', ivaPercent: 10, preuObert: false, actiu: true, ordre: 1, exemple: false,
      grupsModificadors: [], alergens: [], desti: 'barra', reposaNevera: false, handle: 'cafe-sol', imatge: { slug: 'cafe-sol', estat: 'marcador' }
    });
    expect(cafe.variants).toEqual([{ id: 'unitat', nom: 'Unitat', preuCents: 120, ref: '100' }]);
    expect(carta.productes.map((p) => p.ordre)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('les files de continuació són variants; per defecte en l’ordre del fitxer, amb «preu» de més barata a més cara', () => {
    const delFitxer = perId(importaLoyverse(TEXT).carta).get('cervesa-de-barril-gran');
    expect(delFitxer.nom).toBe('Cervesa de barril, gran');
    expect(delFitxer.variants.map((v) => [v.id, v.nom, v.preuCents])).toEqual([['gerra', 'Gerra', 700], ['quint', 'Quint', 130], ['terc', 'Terç', 170]]);
    const perPreu = perId(importaLoyverse(TEXT, { ordreVariants: 'preu' }).carta).get('cervesa-de-barril-gran');
    expect(perPreu.variants.map((v) => v.id)).toEqual(['quint', 'terc', 'gerra']);
    expect(variantDe(perPreu)).toMatchObject({ nom: 'Quint', preuCents: 130 });
    expect(perPreu.variants.find((v) => v.id === 'terc')).toEqual({ id: 'terc', nom: 'Terç', preuCents: 170, costCents: 50, ref: '202' });
  });

  test('preu «variable» → preu obert; Disponible N → inactiu; cost 0 → sense cost; sense categoria → «Altres»', () => {
    const productes = perId(importaLoyverse(TEXT).carta);
    expect(productes.get('varis')).toMatchObject({ preuObert: true, categoriaId: 'altres', variants: [{ id: 'unitat', preuCents: 0 }] });
    expect(productes.get('licor-d-herbes')).toMatchObject({ actiu: false, ivaPercent: 21 });
    expect(productes.get('cafe-sol').variants[0].costCents).toBeUndefined();
    expect(productes.get('cafe-amb-llet').variants[0].costCents).toBe(40);
  });

  test('les categories, en l’ordre en què apareixen, amb ids slug i sense icona', () => {
    const { carta } = importaLoyverse(TEXT);
    expect(carta.categories).toEqual([
      { id: 'cafeteria', nom: 'Cafeteria', ordre: 0, visible: true },
      { id: 'cerveseria', nom: 'Cerveseria', ordre: 1, visible: true },
      { id: 'altres', nom: 'Altres', ordre: 2, visible: true },
      { id: 'licoreria', nom: 'Licoreria', ordre: 3, visible: true },
      { id: 'postres', nom: 'Postres', ordre: 4, visible: true }
    ]);
    expect(carta).toMatchObject({ grups: [], ingredients: [], escandalls: [] });
  });

  test('accepta els bytes del fitxer i torna la mateixa carta', () => {
    expect(importaLoyverse(new TextEncoder().encode(TEXT))).toEqual(importaLoyverse(TEXT));
  });

  test('determinista i vàlida: dues lectures donen el mateix i validaCataleg diu ok', () => {
    const una = importaLoyverse(TEXT);
    expect(JSON.stringify(importaLoyverse(TEXT))).toBe(JSON.stringify(una));
    expect(validaCataleg(una.carta)).toEqual({ ok: true, errors: [] });
  });
});

describe('els defectes de dades ixen com a avisos', () => {
  test('sense IVA: avís SENSE_IVA; amb ivaQuanFalta, el de l’adaptador i avís IVA_CORREGIT', () => {
    const sense = importaLoyverse(TEXT);
    expect(perId(sense.carta).get('aperitiu').ivaPercent).toBeUndefined();
    expect(sense.avisos.filter((a) => a.codi === 'SENSE_IVA')).toEqual([expect.objectContaining({ handle: 'aperitiu', fila: 8 })]);
    expect(sense.resum).toMatchObject({ senseIva: 1, ivaCorregit: 0, perIva: { 10: 5, 21: 2 } });
    const corregit = importaLoyverse(TEXT, { ivaQuanFalta: (info) => (info.handle === 'aperitiu' ? 21 : undefined) });
    expect(perId(corregit.carta).get('aperitiu').ivaPercent).toBe(21);
    expect(codis(corregit.avisos)).toContain('IVA_CORREGIT');
    expect(codis(corregit.avisos)).not.toContain('SENSE_IVA');
    expect(corregit.resum).toMatchObject({ senseIva: 0, ivaCorregit: 1, perIva: { 10: 5, 21: 3 } });
  });

  test('els modificadors no s’importen: cada grup referit és un avís', () => {
    const { carta, avisos, resum } = importaLoyverse(TEXT);
    expect(carta.productes.every((p) => p.grupsModificadors.length === 0)).toBe(true);
    expect(avisos.filter((a) => a.codi === 'MODIFICADORS').map((a) => a.text)).toEqual([
      'El grup de modificadors «Llet» (1 producte) no s’importa: l’exportació no en porta les opcions.'
    ]);
    expect(resum.modificadors).toBe(1);
  });

  test('inventari i descripció: un avís de conjunt per a cada cosa que el Bar no porta', () => {
    const { avisos } = importaLoyverse(TEXT);
    expect(avisos.filter((a) => ['INVENTARI', 'DESCRIPCIO'].includes(a.codi)).map((a) => a.text)).toEqual([
      '1 producte seguix l’inventari a Loyverse: el Bar no en porta; no s’importa.',
      '1 producte porta descripció: la carta del Bar no en té; no s’importa.'
    ]);
  });

  test('un preu que no es llig queda com a preu obert, amb avís PREU', () => {
    const { carta, avisos } = importaLoyverse(csv([producte({ handle: 'rar', ref: '1', nom: 'Rar', preu: '1,234.5' })]));
    expect(carta.productes[0]).toMatchObject({ preuObert: true, variants: [{ preuCents: 0 }] });
    expect(codis(avisos)).toEqual(['PREU']);
  });

  test('files amb defectes: columnes de menys, sense Handle o sense nom ni producte anterior', () => {
    const files = [
      producte({ handle: 'bo', ref: '1', nom: 'Bo', preu: '1.00' }),
      'curt,2,Curt',
      fila({ ref: '3', nom: 'Sense handle', preu: '1.00' }),
      variant({ handle: 'orfe', ref: '4', valor1: 'Gran', preu: '1.00' })
    ];
    const { carta, avisos } = importaLoyverse(csv(files));
    expect(carta.productes.map((p) => p.id)).toEqual(['bo', 'curt']);
    expect(avisos.map((a) => [a.codi, a.fila])).toEqual(expect.arrayContaining([['COLUMNES', 3], ['SENSE_HANDLE', 4], ['SENSE_NOM', 5]]));
  });
});

describe('ids i slugs', () => {
  test('dos Handles amb el mateix slug: el segon porta el REF; la imatge repetida dins de la categoria, -2', () => {
    const productes = perId(importaLoyverse(TEXT).carta);
    expect(productes.get('cafe-sol-700')).toMatchObject({ handle: 'cafè-sol', imatge: { slug: 'cafe-sol-2', estat: 'marcador' } });
    expect(new Set([...productes.keys()]).size).toBe(8);
  });

  test('slugDe: sense diacrítics ni punt volat, emojis i signes en guions, com a molt 64', () => {
    expect(slugDe('Col·la de l’Olivera')).toBe('colla-de-l-olivera');
    expect(slugDe('B1☕️ Cafè «tallat» (1/3)')).toBe('b1-cafe-tallat-1-3');
    expect(slugDe('🍺')).toBe('');
    const llarg = slugDe('paraula '.repeat(20));
    expect(llarg.length).toBeLessThanOrEqual(64);
    expect(llarg).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});

describe('capçaleres i botigues', () => {
  test('una capçalera que no és de Loyverse llança NO_LOYVERSE', () => {
    expect(() => importaLoyverse('a,b\n1,2\n')).toThrow(expect.objectContaining({ codi: 'NO_LOYVERSE' }));
    expect(() => importaLoyverse('')).toThrow(expect.objectContaining({ codi: 'NO_LOYVERSE' }));
  });

  test('una capçalera sense cap producte llança BUIT', () => {
    expect(() => importaLoyverse(csv([]))).toThrow(expect.objectContaining({ codi: 'BUIT' }));
  });

  test('dues botigues: sense triar-ne cap llança BOTIGA; triada, se’n llig el preu i la disponibilitat', () => {
    const capcalera = ['Handle', 'REF', 'Nombre', 'Precio [Nord]', 'Disponibles para la venta [Nord]', 'Precio [Sud]', 'Disponibles para la venta [Sud]'];
    const text = csv(['aigua,1,Aigua,1.00,Y,1.20,N'], capcalera);
    expect(() => importaLoyverse(text)).toThrow(expect.objectContaining({ codi: 'BOTIGA' }));
    expect(() => importaLoyverse(text, { botiga: 'Est' })).toThrow(expect.objectContaining({ codi: 'BOTIGA' }));
    const sud = importaLoyverse(text, { botiga: 'Sud' });
    expect(sud.carta.productes[0]).toMatchObject({ actiu: false, variants: [{ preuCents: 120 }] });
    expect(sud.establiment).toEqual({ nom: 'Sud' });
    expect(sud.resum.botiga).toBe('Sud');
  });

  test('la capçalera en anglès també es llig, i les columnes desconegudes ixen com a avís', () => {
    const capcalera = ['Handle', 'SKU', 'Name', 'Category', 'Option 1 name', 'Option 1 value', 'Cost', 'Available for sale [Shop]', 'Price [Shop]',
      'Modifier - "Milk"', 'Tax - "VAT" (21%)', 'Supplier'];
    const text = csv(['tea,1,Tea,Drinks,Size,Big,0.10,Y,2.00,Y,Y,', 'tea,2,,,,Small,0.05,Y,1.50,,,'], capcalera);
    const { carta, avisos } = importaLoyverse(text, { ordreVariants: 'preu' });
    expect(carta.productes).toEqual([expect.objectContaining({
      id: 'tea', nom: 'Tea', categoriaId: 'drinks', ivaPercent: 21,
      variants: [{ id: 'small', nom: 'Small', preuCents: 150, costCents: 5, ref: '2' }, { id: 'big', nom: 'Big', preuCents: 200, costCents: 10, ref: '1' }]
    })]);
    expect(codis(avisos)).toEqual(['MODIFICADORS', 'COLUMNES_DESCONEGUDES']);
  });
});

describe('les opcions d’un adaptador', () => {
  test('categoria, nom net, destí, nevera, foto i exemple: cada criteri el posa l’adaptador', () => {
    const { carta } = importaLoyverse(TEXT, {
      categoriaDe: (info) => (info.categoria === 'Cafeteria' ? { id: 'cafes', nom: 'Cafés', icona: 'Coffee', ordre: 0 } : null),
      netejaNom: (nom) => nom.replace(/^Cafè /, ''),
      desti: (info) => (info.categoria === 'Postres' ? 'cuina' : 'barra'),
      reposaNevera: (info) => info.categoria === 'Cerveseria',
      imatgeDisponible: (categoriaId, slug) => categoriaId === 'cafes' && slug === 'sol',
      exemple: true
    });
    const productes = perId(carta);
    expect(carta.categories[0]).toEqual({ id: 'cafes', nom: 'Cafés', icona: 'Coffee', ordre: 0, visible: true });
    expect(productes.get('cafe-sol')).toMatchObject({ nom: 'sol', categoriaId: 'cafes', imatge: { slug: 'sol', estat: 'definitiva' }, exemple: true });
    expect(productes.get('pastis').desti).toBe('cuina');
    expect(productes.get('cervesa-de-barril-gran').reposaNevera).toBe(true);
    expect(carta.productes.every((p) => p.exemple === true)).toBe(true);
  });
});
