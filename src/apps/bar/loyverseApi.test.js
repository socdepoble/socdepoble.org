// @vitest-environment node
/* Contracte API amb dades sintètiques: cap captura autenticada ni secret.
   Gauntlet 261022_0225 (crítica Claude): modificadors, IVA sense 0 callat,
   paritat amb el CSV i un article que falla no para els altres. */
import { describe, expect, test } from 'vitest';
import { validaCataleg } from './nucli/cataleg.js';
import { importaLoyverse } from './nucli/loyverse.js';
import { OPCIONS_LA_PARROQUIA } from './llavors/laParroquia.js';
import { ESQUEMA_CAPTURA_LOYVERSE, importaLoyverseApi } from './loyverseApi.js';

const ITEM = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CATEGORIA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const BOTIGA = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const VARIANT = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TAXA = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const ALTRA_BOTIGA = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const ALTRA_VARIANT = 'abababab-abab-abab-abab-abababababab';
const ALTRE_ITEM = 'acacacac-acac-acac-acac-acacacacacac';
const VARIANT_BO = 'adadadad-adad-adad-adad-adadadadadad';
const MODIFICADOR = '12121212-1212-1212-1212-121212121212';
const OPCIO_1 = '13131313-1313-1313-1313-131313131313';
const OPCIO_2 = '14141414-1414-1414-1414-141414141414';
const OPCIONS = { botigaId: BOTIGA, moneda: 'EUR' };

function captura() {
  return {
    esquema: ESQUEMA_CAPTURA_LOYVERSE,
    items: { items: [{
      id: ITEM, item_name: 'Café', category_id: CATEGORIA, tax_ids: [TAXA],
      modifiers_ids: [], components: [], sold_by_weight: false, is_composite: false, track_stock: false,
      variants: [{
        variant_id: VARIANT, item_id: ITEM, option1_value: 'Gran',
        default_pricing_type: 'FIXED', default_price: 1.25, cost: 0.3,
        stores: [{ store_id: BOTIGA, available_for_sale: true }]
      }]
    }] },
    categories: { categories: [{ id: CATEGORIA, name: 'Begudes' }] },
    taxes: { taxes: [{ id: TAXA, type: 'INCLUDED', rate: 10, stores: [BOTIGA] }] },
    modifiers: { modifiers: [] }
  };
}
const article = (c) => c.items.items[0];
const variant = (c) => article(c).variants[0];
const importa = (c, mes = {}) => importaLoyverseApi(c, { ...OPCIONS, ...mes });
const producte = (c, mes) => importa(c, mes).carta.productes[0];
const codis = (resultat) => resultat.avisos.map((avis) => avis.codi);
function congela(valor) {
  if (valor && typeof valor === 'object') {
    Object.freeze(valor);
    Object.values(valor).forEach(congela);
  }
  return valor;
}
/* Un segon article vàlid («Aigua»), per a provar que un de dolent no para la resta. */
function ambUnAltre(c) {
  c.items.items.push({
    id: ALTRE_ITEM, item_name: 'Aigua', category_id: CATEGORIA, tax_ids: [TAXA], modifiers_ids: [],
    variants: [{ variant_id: VARIANT_BO, item_id: ALTRE_ITEM, default_pricing_type: 'FIXED', default_price: 1, stores: [{ store_id: BOTIGA }] }]
  });
  return c;
}
function modificador() {
  return {
    id: MODIFICADOR, name: 'Extres', stores: [BOTIGA],
    modifier_options: [
      { id: OPCIO_2, name: 'Doble de nata', price: 0.5, position: 2 },
      { id: OPCIO_1, name: 'Sense sucre', position: 1 },
      { id: ALTRA_VARIANT, name: 'Retirada', price: 9, position: 0, deleted_at: '2026-01-01T00:00:00Z' }
    ]
  };
}

describe('Loyverse API → carta local canònica', () => {
  test('imports exactes, IVA i identitat estable, sense tocar la captura', () => {
    const entrada = congela(captura());
    const resultat = importa(entrada);
    expect(validaCataleg(resultat.carta)).toEqual({ ok: true, errors: [] });
    expect(resultat).toMatchObject({ avisos: [], origen: { proveidor: 'loyverse', botigaId: BOTIGA, moneda: 'EUR' } });
    expect(resultat.carta.productes[0]).toMatchObject({
      id: `lv-${ITEM}`, nom: 'Café', categoriaId: `lv-${CATEGORIA}`, ivaPercent: 10,
      preuObert: false, actiu: true, exemple: false, handle: ITEM,
      variants: [{ id: `lv-${VARIANT}`, nom: 'Gran', preuCents: 125, costCents: 30, ref: VARIANT }]
    });
    expect(importa(entrada)).toEqual(resultat);
    const reanomenada = captura();
    article(reanomenada).item_name = 'Café del dia';
    variant(reanomenada).option1_value = 'Tassa gran';
    expect(producte(reanomenada).id).toBe(`lv-${ITEM}`);
    expect(producte(reanomenada).variants[0].id).toBe(`lv-${VARIANT}`);
  });

  test('selecciona la botiga explícita i respecta el seu preu i disponibilitat', () => {
    const c = captura();
    variant(c).stores.unshift({ store_id: ALTRA_BOTIGA, price: 9, available_for_sale: true });
    variant(c).stores[1] = { store_id: BOTIGA, pricing_type: 'FIXED', price: 2.5, available_for_sale: false };
    expect(producte(c)).toMatchObject({ actiu: false, variants: [{ preuCents: 250 }] });
    expect(() => importaLoyverseApi(c, { moneda: 'EUR' })).toThrow();
  });

  test('el tipus de preu de la botiga mana sobre el per defecte, en els dos sentits', () => {
    const oberta = captura();
    variant(oberta).stores[0].pricing_type = 'VARIABLE';
    expect(producte(oberta)).toMatchObject({ preuObert: true, variants: [{ preuCents: 0 }] });
    const fixa = captura();
    Object.assign(variant(fixa), { default_pricing_type: 'VARIABLE', default_price: null });
    Object.assign(variant(fixa).stores[0], { pricing_type: 'FIXED', price: 2.5 });
    expect(producte(fixa)).toMatchObject({ preuObert: false, variants: [{ preuCents: 250 }] });
  });

  test('preu variable és obert; categoria absent és explícita; inventari emet avís', () => {
    const c = captura();
    variant(c).default_pricing_type = 'VARIABLE';
    variant(c).default_price = null;
    article(c).category_id = null;
    article(c).track_stock = true;
    expect(importa(c)).toMatchObject({
      carta: { categories: [{ id: 'lv-sense-categoria', nom: 'Sense categoria' }],
        productes: [{ preuObert: true, ivaPercent: 10, variants: [{ preuCents: 0 }] }] },
      avisos: [{ codi: 'INVENTARI_NO_IMPORTAT', id: ITEM }]
    });
  });

  test('descarta baixes i camps aliens sense traslladar membres, imatges ni credencials', () => {
    const c = captura();
    c.credentials = 'no-traslladar';
    article(c).image_url = 'no-traslladar';
    article(c).variants.push({ variant_id: ALTRA_VARIANT, deleted_at: '2026-01-01T00:00:00Z' });
    c.items.items.push({ id: ALTRA_BOTIGA, deleted_at: '2026-01-01T00:00:00Z' });
    const resultat = importa(c);
    expect(resultat.carta.productes).toHaveLength(1);
    expect(resultat.carta.productes[0].variants).toHaveLength(1);
    expect(JSON.stringify(resultat)).not.toContain('no-traslladar');
  });
});

describe('IVA: mai un 0 callat', () => {
  test('sense cap impost, l’IVA queda per a l’establiment i ho avisa', () => {
    const c = captura();
    article(c).tax_ids = [];
    const resultat = importa(c);
    expect(resultat.carta.productes[0]).not.toHaveProperty('ivaPercent');
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'SENSE_IVA', id: ITEM })]);
  });

  test('l’impost d’una altra botiga no s’aplica a esta: avís, no el seu tipus', () => {
    const c = captura();
    c.taxes.taxes[0].stores = [ALTRA_BOTIGA];
    const resultat = importa(c);
    expect(resultat.carta.productes[0]).not.toHaveProperty('ivaPercent');
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'SENSE_IVA', id: ITEM, impostos: [TAXA] })]);
  });

  test('amb un impost per botiga, pren el de la triada sense avís', () => {
    const c = captura();
    c.taxes.taxes.push({ id: ALTRA_VARIANT, type: 'INCLUDED', rate: 21, stores: [ALTRA_BOTIGA] });
    article(c).tax_ids.unshift(ALTRA_VARIANT);
    expect(importa(c)).toMatchObject({ avisos: [], carta: { productes: [{ ivaPercent: 10 }] } });
  });

  test('un impost referit que no és a la captura (o de baixa) s’assenyala', () => {
    const c = captura();
    c.taxes.taxes[0].deleted_at = '2026-01-01T00:00:00Z';
    expect(codis(importa(c))).toEqual(['IMPOST_DESCONEGUT', 'SENSE_IVA']);
    expect(importa(c).avisos[0]).toMatchObject({ id: ITEM, impostos: [TAXA] });
  });

  test('ivaQuanFalta de la casa, com al CSV, amb avís IVA_CORREGIT', () => {
    const c = captura();
    article(c).tax_ids = [];
    const resultat = importa(c, { ivaQuanFalta: (info) => (info.id === ITEM ? 21 : undefined) });
    expect(resultat.carta.productes[0].ivaPercent).toBe(21);
    expect(codis(resultat)).toEqual(['IVA_CORREGIT']);
  });

  test('un impost absent al costat del de la botiga: mana el de la botiga i l’absent s’assenyala', () => {
    const c = captura();
    article(c).tax_ids = [ALTRA_VARIANT, TAXA];
    const resultat = importa(c);
    expect(resultat.carta.productes[0].ivaPercent).toBe(10);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'IMPOST_DESCONEGUT', id: ITEM, impostos: [ALTRA_VARIANT] })]);
  });
});

describe('modificadors: grups del Bar, no un rebuig de la captura', () => {
  test('un Modifier de la botiga és un grup { min 0, max n } amb les opcions per position', () => {
    const c = captura();
    c.modifiers.modifiers.push(modificador());
    article(c).modifiers_ids = [MODIFICADOR];
    const resultat = importa(c);
    expect(validaCataleg(resultat.carta).ok).toBe(true);
    expect(resultat.avisos).toEqual([]);
    expect(resultat.carta.grups).toEqual([{
      id: `lv-${MODIFICADOR}`, nom: 'Extres', min: 0, max: 2,
      opcions: [{ id: `lv-${OPCIO_1}`, nom: 'Sense sucre', deltaCents: 0 }, { id: `lv-${OPCIO_2}`, nom: 'Doble de nata', deltaCents: 50 }]
    }]);
    expect(resultat.carta.productes[0].grupsModificadors).toEqual([`lv-${MODIFICADOR}`]);
  });

  test('un grup compartit entra una sola vegada; el d’una altra botiga no hi és', () => {
    const c = ambUnAltre(captura());
    c.modifiers.modifiers.push(modificador(), { ...modificador(), id: ALTRA_VARIANT, stores: [ALTRA_BOTIGA] });
    c.items.items.forEach((item) => { item.modifiers_ids = [MODIFICADOR, ALTRA_VARIANT]; });
    const resultat = importa(c);
    expect(resultat.carta.grups.map((g) => g.id)).toEqual([`lv-${MODIFICADOR}`]);
    expect(resultat.carta.productes.map((p) => p.grupsModificadors)).toEqual([[`lv-${MODIFICADOR}`], [`lv-${MODIFICADOR}`]]);
    expect(resultat.avisos).toEqual([]);
  });

  test.each([
    ['una opció que resta', (m) => { m.modifier_options[0].price = -0.5; }, /resta/],
    ['una opció amb preu inexacte', (m) => { m.modifier_options[0].price = 0.505; }, /cèntims/],
    ['cap opció vigent', (m) => { m.modifier_options = []; }, /cap opció/],
    ['una opció repetida', (m) => { m.modifier_options[1].id = OPCIO_2; }, /repetix/]
  ])('%s: el grup no entra, l’article sí, i ho diu una vegada', (_cas, trenca, motiu) => {
    const c = ambUnAltre(captura());
    const m = modificador();
    trenca(m);
    c.modifiers.modifiers.push(m);
    c.items.items.forEach((item) => { item.modifiers_ids = [MODIFICADOR]; });
    const resultat = importa(c);
    expect(resultat.carta.productes).toHaveLength(2);
    expect(resultat.carta.grups).toEqual([]);
    expect(resultat.carta.productes.every((p) => p.grupsModificadors.length === 0)).toBe(true);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'MODIFICADOR_NO_IMPORTAT', modificador: MODIFICADOR, nom: 'Extres', productes: 2 })]);
    expect(resultat.avisos[0].text).toMatch(motiu);
  });

  test('un modificador referit que no és a la captura s’assenyala i l’article entra', () => {
    const c = captura();
    article(c).modifiers_ids = [MODIFICADOR];
    const resultat = importa(c);
    expect(resultat.carta.productes[0].grupsModificadors).toEqual([]);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'MODIFICADOR_DESCONEGUT', id: ITEM, modificador: MODIFICADOR })]);
  });
});

describe('la captura és tot o res; l’article que falla no para els altres', () => {
  test.each(['items', 'categories', 'taxes', 'modifiers'])('rebutja %s pendent de paginar', (recurs) => {
    const c = captura();
    c[recurs].cursor = 'pagina-seguent';
    expect(() => importa(c)).toThrow(/pàgines pendents/);
  });

  test.each([undefined, 'USD'])('exigix confirmació explícita de moneda: %s', (moneda) => {
    expect(() => importaLoyverseApi(captura(), { botigaId: BOTIGA, moneda })).toThrow(/euros/);
  });

  test.each([
    ['identitat repetida', (c) => { c.items.items.push(article(c)); }],
    ['fila invàlida', (c) => { c.items.items.push(null); }],
    ['recurs absent', (c) => { delete c.modifiers; }],
    ['esquema antic', (c) => { c.esquema = 'sdp.loyverse.captura.v1'; }]
  ])('rebutja la captura sencera: %s', (_cas, modifica) => {
    const c = ambUnAltre(captura());
    modifica(c);
    expect(() => importa(c)).toThrow();
  });

  test.each([
    ['impost afegit', (c) => { c.taxes.taxes.push({ ...c.taxes.taxes[0], id: ALTRA_VARIANT, type: 'ADDED' }); article(c).tax_ids = [ALTRA_VARIANT]; }],
    ['tipus fraccionari', (c) => { c.taxes.taxes.push({ ...c.taxes.taxes[0], id: ALTRA_VARIANT, rate: 5.5 }); article(c).tax_ids = [ALTRA_VARIANT]; }],
    ['més d’un impost', (c) => { c.taxes.taxes.push({ ...c.taxes.taxes[0], id: ALTRA_VARIANT }); article(c).tax_ids.push(ALTRA_VARIANT); }],
    ['venda per pes', (c) => { article(c).sold_by_weight = true; }],
    ['compost', (c) => { article(c).is_composite = true; }],
    ['producció', (c) => { article(c).use_production = true; }],
    ['categoria absent', (c) => { article(c).category_id = ALTRA_BOTIGA; }],
    ['botiga absent', (c) => { variant(c).stores = []; }],
    ['botiga repetida', (c) => { variant(c).stores.push({ ...variant(c).stores[0] }); }],
    ['disponibilitat invàlida', (c) => { variant(c).stores[0].available_for_sale = 'si'; }],
    ['variant d’un altre article', (c) => { variant(c).item_id = CATEGORIA; }],
    ['variant repetida', (c) => { article(c).variants.push({ ...variant(c) }); }],
    ['variant d’un altre article ja importat', (c) => { variant(c).variant_id = VARIANT_BO; delete variant(c).item_id; }],
    ['opció que no és text', (c) => { variant(c).option1_value = {}; }],
    ['indicador invàlid', (c) => { article(c).sold_by_weight = 'false'; }],
    ['llista invàlida', (c) => { article(c).modifiers_ids = {}; }],
    ['preu mixt', (c) => { article(c).variants.push({ ...structuredClone(variant(c)), variant_id: ALTRA_VARIANT, default_pricing_type: 'VARIABLE' }); }],
    ...[null, -1, NaN, Infinity, 1.001, '1.25', 100000.01].map((preu) => [`preu fix ${String(preu)}`, (c) => { variant(c).default_price = preu; }])
  ])('%s: avís amb l’id i el nom, i la resta entra', (_cas, modifica) => {
    const c = ambUnAltre(captura());
    modifica(c);
    const resultat = importa(c);
    expect(resultat.carta.productes.map((p) => p.id)).toEqual([`lv-${ALTRE_ITEM}`]);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'ARTICLE_NO_IMPORTAT', id: ITEM, nom: 'Café' })]);
    expect(resultat.avisos[0].text).toMatch(/^«Café» no s’importa: /);
  });

  test.each([0.4166, -0.1])('un cost %s que no es pot llegir no para l’article: entra sense cost, amb avís COST', (cost) => {
    const c = ambUnAltre(captura());
    variant(c).cost = cost;
    const resultat = importa(c);
    expect(resultat.carta.productes.map((p) => p.id)).toEqual([`lv-${ALTRE_ITEM}`, `lv-${ITEM}`]);
    expect(resultat.carta.productes[1].variants[0]).not.toHaveProperty('costCents');
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'COST', id: ITEM, variant: VARIANT })]);
  });

  test('si cap article no es pot importar, llança amb els avisos de cada un', () => {
    const c = captura();
    article(c).sold_by_weight = true;
    let error;
    try { importa(c); } catch (llancat) { error = llancat; }
    expect(error).toMatchObject({
      codi: 'LOYVERSE_API', avisos: [expect.objectContaining({ codi: 'ARTICLE_NO_IMPORTAT', id: ITEM, nom: 'Café' })]
    });
  });

  test('available_for_sale absent val true, com diu la documentació', () => {
    const c = captura();
    delete variant(c).stores[0].available_for_sale;
    expect(producte(c).actiu).toBe(true);
  });

  test('la variant no disponible a la botiga no entra, ho avisa, i el producte queda actiu', () => {
    const c = captura();
    const segona = { ...structuredClone(variant(c)), variant_id: ALTRA_VARIANT, option1_value: 'Menuda' };
    segona.stores[0].available_for_sale = false;
    article(c).variants.push(segona);
    const resultat = importa(c);
    expect(resultat.carta.productes[0]).toMatchObject({ actiu: true, variants: [{ nom: 'Gran' }] });
    expect(resultat.carta.productes[0].variants).toHaveLength(1);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'VARIANT_NO_DISPONIBLE', id: ITEM })]);
  });

  test('els noms es netegen abans de mesurar-los; si no caben, es retallen amb avís', () => {
    const net = captura();
    article(net).item_name = `${'y'.repeat(60)}  `;
    expect(importa(net)).toMatchObject({ avisos: [], carta: { productes: [{ nom: 'y'.repeat(60) }] } });
    const llarg = captura();
    article(llarg).item_name = 'x'.repeat(64);
    llarg.categories.categories[0].name = 'c'.repeat(64);
    const resultat = importa(llarg);
    expect(resultat.carta.productes[0].nom).toBe('x'.repeat(60));
    expect(resultat.carta.categories[0].nom).toBe('c'.repeat(40));
    expect(resultat.avisos).toEqual([
      expect.objectContaining({ codi: 'NOM_RETALLAT', categoria: `lv-${CATEGORIA}` }),
      expect.objectContaining({ codi: 'NOM_RETALLAT', id: ITEM })
    ]);
  });

  test('la variant, el modificador i l’opció retallats també ho avisen, cada un amb el seu lloc', () => {
    const c = captura();
    Object.assign(variant(c), { option1_value: 'a'.repeat(20), option2_value: 'b'.repeat(20), option3_value: 'c'.repeat(20) });
    const m = { ...modificador(), name: 'm'.repeat(45) };
    m.modifier_options[0].name = 'o'.repeat(45);
    c.modifiers.modifiers.push(m);
    article(c).modifiers_ids = [MODIFICADOR];
    const resultat = importa(c);
    expect(resultat.carta.productes[0].variants[0].nom).toBe(`${'a'.repeat(20)} · ${'b'.repeat(17)}`);
    expect(resultat.carta.grups[0]).toMatchObject({ nom: 'm'.repeat(40), opcions: [{ nom: 'Sense sucre' }, { nom: 'o'.repeat(40) }] });
    expect(resultat.avisos).toEqual([
      { codi: 'NOM_RETALLAT', id: ITEM, variant: VARIANT, text: expect.any(String) },
      { codi: 'NOM_RETALLAT', modificador: MODIFICADOR, text: expect.any(String) },
      { codi: 'NOM_RETALLAT', modificador: MODIFICADOR, opcio: OPCIO_2, text: expect.any(String) }
    ]);
  });
});

describe('paritat amb el CSV: les decisions de la casa valen igual', () => {
  /* La mateixa carta per les dues vies: l'exportació (ordenada pel nom en
     minúscules, com la de La Parròquia) i l'API (per creació, de més nova a
     més vella). OPCIONS_LA_PARROQUIA és la de la llavor real. */
  const CSV = [
    'Handle,REF,Nombre,Categoria,Opción 1 nombre,Opción 1 valor,Coste,Disponibles para la venta [La Parròquia],Precio [La Parròquia],"impuesto - ""IVA"" (10%)"',
    'b1-cafe-sol,10001,B1☕️ Cafè sol,Cafeteria,,,0.00,Y,1.10,Y',
    'b3-barril-estrella,10042,B3🍺 - Barril Estrella,Cerveseria,Mida,Gerra,0.00,Y,4.50,Y',
    'b3-barril-estrella,10043,,,,Canya,0.00,Y,1.80,',
    'b3-estrella-galicia,10050,B3🍺 Estrella Galicia,Cerveseria,,,0.90,Y,2.20,Y',
    'm2-calamar-a-la-romana,10060,M2🥖 Calamar a la romana,Entrepans,,,,Y,5.00,N'
  ].join('\n');
  const uuid = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`;
  const variantApi = (n, sku, preu, opcio, cost = 0) => ({
    variant_id: uuid(n), sku, option1_value: opcio, default_pricing_type: 'FIXED', default_price: preu, cost, stores: [{ store_id: BOTIGA }]
  });
  const itemApi = (n, handle, nom, impostos, variants) => ({ id: uuid(n), handle, item_name: nom, category_id: null, tax_ids: impostos, modifiers_ids: [], variants });
  const capturaParroquia = () => ({
    ...captura(),
    items: { items: [
      itemApi(1, 'm2-calamar-a-la-romana', 'M2🥖 Calamar a la romana', [], [variantApi(5, '10060', 5)]),
      itemApi(2, 'b3-estrella-galicia', 'B3🍺 Estrella Galicia', [TAXA], [variantApi(6, '10050', 2.2, undefined, 0.9)]),
      itemApi(3, 'b3-barril-estrella', 'B3🍺 - Barril Estrella', [TAXA], [variantApi(7, '10042', 4.5, 'Gerra'), variantApi(8, '10043', 1.8, 'Canya')]),
      itemApi(4, 'b1-cafe-sol', 'B1☕️ Cafè sol', [TAXA], [variantApi(9, '10001', 1.1)])
    ] }
  });
  /* Els ids són els UUID a posta; handle i ref són la traça compartida amb una carta del CSV. */
  const comparable = (p) => ({
    nom: p.nom, categoriaId: p.categoriaId, ivaPercent: p.ivaPercent, imatge: p.imatge, reposaNevera: p.reposaNevera,
    desti: p.desti, preuObert: p.preuObert, actiu: p.actiu, ordre: p.ordre, handle: p.handle,
    variants: p.variants.map((v) => ({ nom: v.nom, preuCents: v.preuCents, costCents: v.costCents, ref: v.ref }))
  });

  test('noms, categories, destí, nevera, IVA corregit, ordre de variants i imatges coincidixen', () => {
    const perCsv = importaLoyverse(CSV, OPCIONS_LA_PARROQUIA);
    const perApi = importa(capturaParroquia(), OPCIONS_LA_PARROQUIA);
    expect(validaCataleg(perApi.carta).ok).toBe(true);
    expect(perApi.carta.categories).toEqual(perCsv.carta.categories);
    expect(perApi.carta.productes.map(comparable)).toEqual(perCsv.carta.productes.map(comparable));
    expect(codis(perApi)).toEqual(codis(perCsv));
    expect(perApi.carta.productes.find((p) => p.nom === 'Calamar a la romana')).toMatchObject({ desti: 'cuina', ivaPercent: 10 });
    expect(perApi.carta.productes.find((p) => p.nom === 'Barril Estrella').variants.map((v) => v.nom)).toEqual(['Canya', 'Gerra']);
  });

  test('imatgeDisponible rep el mateix slug que al CSV; sense opcions, el comportament per defecte de l’API', () => {
    const vistos = [];
    importa(capturaParroquia(), { ...OPCIONS_LA_PARROQUIA, imatgeDisponible: (categoria, slug) => vistos.push(`${categoria}/${slug}`) && slug === 'cafe-sol' });
    expect(vistos).toEqual(['cafeteria/cafe-sol', 'cerveseria/barril-estrella', 'cerveseria/estrella-galicia', 'entrepans/calamar-a-la-romana']);
    const perDefecte = importa(capturaParroquia());
    expect(perDefecte.carta.productes.map((p) => [p.nom, p.desti, p.reposaNevera])[0]).toEqual(['B1☕️ Cafè sol', 'barra', false]);
    expect(codis(perDefecte)).toEqual(['SENSE_IVA']);
  });

  test('les categories van per l’ordre de la casa abans que per l’aparició', () => {
    const categoriaDe = (info) => (info.nom === 'Aigua' ? { id: 'begudes', nom: 'Begudes', ordre: 1 } : { id: 'cafeteria', nom: 'Cafeteria', ordre: 0 });
    const resultat = importa(ambUnAltre(captura()), { categoriaDe });
    expect(resultat.carta.productes.map((p) => p.categoriaId)).toEqual(['begudes', 'cafeteria']);
    expect(resultat.carta.categories.map((categoria) => categoria.id)).toEqual(['cafeteria', 'begudes']);
  });

  test('dos productes amb el mateix nom en una categoria no compartixen el slug d’imatge', () => {
    const c = ambUnAltre(captura());
    article(c).item_name = 'Aigua';
    expect(importa(c).carta.productes.map((p) => p.imatge.slug)).toEqual(['aigua', 'aigua-2']);
  });
});
