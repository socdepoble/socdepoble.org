// @vitest-environment node
/* Onada 3 · T2 · la llavor real de La Parròquia (llavors/laParroquia.js)
   sobre la còpia del CSV del repo, i el registre de llavors (llavors/index.js).
   · Fidelitat: si l'exportació original de 01_produccio és al disc, la còpia
     és idèntica octet a octet (si no hi és, la prova se salta). Si el Mestre
     hi deixa una exportació nova, esta prova es posa roja a propòsit: cal
     refrescar la còpia de src (MarIA o el Mestre, amb cp) i els recomptes.
   · Recomptes de la decisió D4: 327 productes, 564 variants, 12 categories,
     7 inactius, 11 de preu obert i l'IVA dels 4 productes que no en porten.
   · El preu obert amb més d'una variant (Malibú, Coquetes fregides): la caixa
     en fa triar la variant abans del preu, i el cost és el de la triada.
   · Les fotos: cada slug d'IMATGES_DISPONIBLES té el seu webp a public/, i
     cada destí del mapa d'imatges del laboratori és un slug real.
   · El literal de compilació: fora del servidor de desenvolupament, La
     Parròquia només hi és amb VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1.
   Cap asserció mostra cap valor del CSV quan falla, només recomptes i ids. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { validaCataleg, variantDe } from '../nucli/cataleg.js';
import { costDeVenda } from '../nucli/escandall.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from '../nucli/llavor.js';
import { DENOMINACIONS } from '../nucli/torn.js';
import { necessitaTria, triaLaVariant } from '../vistes/vestits.js';
import { IMATGES_DISPONIBLES, codiDe, importaLaParroquia, llavorLaParroquia, netejaNom } from './laParroquia.js';
import { LLAVORS, nomDeLlavor, obteLlavor } from './index.js';

const ARREL = process.cwd();
const COPIA = path.join(ARREL, 'src/apps/bar/llavors/la-parroquia-loyverse.csv');
const PRODUCCIO = path.join(ARREL, '_wiki_de_poble/04_escriptori/01_produccio');
const ORIGINAL = path.join(PRODUCCIO, 'la_parroquia/export_items.csv');
const MAPA = path.join(ARREL, '_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_parroquia_claude/MAPA_IMATGES.txt');
const FOTOS = path.join(ARREL, 'public/assets/uploads/empresa/la-parroquia/bar');

const LLAVOR = llavorLaParroquia();
const { carta, avisos, resum } = LLAVOR;
const perId = new Map(carta.productes.map((p) => [p.id, p]));
const compta = (llista, clau) => llista.reduce((n, element) => ({ ...n, [clau(element)]: (n[clau(element)] || 0) + 1 }), {});

/* On és la primera diferència entre dos textos (línia i columna), sense mostrar-ne el contingut. */
function primeraDiferencia(a, b) {
  const posicio = (i) => {
    const linies = a.slice(0, i).split('\n');
    return { linia: linies.length, columna: linies[linies.length - 1].length + 1 };
  };
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) return posicio(i);
  return a.length === b.length ? null : posicio(n);
}

describe('la còpia del CSV', () => {
  test.skipIf(!existsSync(ORIGINAL))('és idèntica a l’exportació de 01_produccio, octet a octet', () => {
    const copia = readFileSync(COPIA);
    const original = readFileSync(ORIGINAL);
    expect(primeraDiferencia(copia.toString('utf8'), original.toString('utf8'))).toBeNull();
    expect(copia.equals(original)).toBe(true);
  });
});

describe('la carta de La Parròquia', () => {
  test('327 productes, 564 variants, 12 categories, 7 inactius i 11 de preu obert; validaCataleg ok', () => {
    expect(resum).toMatchObject({ productes: 327, variants: 564, categories: 12, inactius: 7, preuObert: 11, botiga: 'La Parròquia' });
    expect(carta.productes).toHaveLength(327);
    expect(carta.productes.flatMap((p) => p.variants)).toHaveLength(564);
    expect(carta.productes.filter((p) => !p.actiu).map((p) => p.id)).toEqual([
      'licors-angostura-aromatic-bitters-200ml', 'tapa-ensaladilla-amb-carxofa', 'tapa-ensaladilla-amb-formatge', 'm5-iogurt',
      'm5-tarta-de-figa', 'm5-tarta-de-formatge', 'm5-tarta-de-tres-xocolates'
    ]);
    expect(carta.productes.filter((p) => p.preuObert).map((p) => p.id)).toEqual([
      'b1-cafe', 'licors-angostura-aromatic-bitters-200ml', 'b5-malibu', 'm4-coquetes-fregides', 'm4-calamar-a-la-planxa',
      'm4-sepia-a-la-planxa', 'm4-verdura-a-la-planxa', 'm5-fruita-dels-temps', 'm5-iogurt', 'altres-al-10', 'altres-al-21'
    ]);
    expect(validaCataleg(carta)).toEqual({ ok: true, errors: [] });
  });

  test('les 12 categories pel codi del prefix, en ordre, amb les icones del Bar', () => {
    expect(carta.categories.map((c) => [c.id, c.nom, c.icona ?? null, c.ordre])).toEqual([
      ['cafeteria', 'Cafeteria', 'Coffee', 0], ['refrescs', 'Refrescs', 'CupSoda', 1], ['cerveseria', 'Cerveseria', 'Beer', 2],
      ['vins-i-caves', 'Vins i caves', 'Wine', 3], ['combinats', 'Combinats', 'GlassWater', 4], ['licoreria', 'Licoreria', 'Martini', 5],
      ['plats-combinats', 'Plats combinats', 'UtensilsCrossed', 6], ['entrepans', 'Entrepans', 'Sandwich', 7], ['torrades', 'Torrades', 'Wheat', 8],
      ['tapes', 'Tapes', 'Utensils', 9], ['postres', 'Postres i gelats', 'IceCreamCone', 10], ['altres', 'Altres', null, 11]
    ]);
    expect(compta(carta.productes, (p) => p.categoriaId)).toEqual({
      cafeteria: 14, refrescs: 26, cerveseria: 18, 'vins-i-caves': 21, combinats: 9, licoreria: 57,
      'plats-combinats': 27, entrepans: 33, torrades: 8, tapes: 71, postres: 41, altres: 2
    });
  });

  test('IVA: 220 al 10 % i 107 al 21 %, amb els 4 sense impost corregits i avisats', () => {
    expect(resum).toMatchObject({ perIva: { 10: 220, 21: 107 }, ivaCorregit: 4, senseIva: 0 });
    expect(carta.productes.every((p) => Number.isSafeInteger(p.ivaPercent))).toBe(true);
    expect(['b5-combinats-vodkatonic', 'b5-malibu', 'm2-calamar-a-la-romana', 'm4-olives-partides'].map((id) => perId.get(id).ivaPercent)).toEqual([21, 21, 10, 10]);
    expect(avisos.filter((a) => a.codi === 'IVA_CORREGIT')).toHaveLength(4);
  });

  test('els avisos: l’IVA corregit, els 13 grups de modificadors i l’inventari; cap més', () => {
    expect(compta(avisos, (a) => a.codi)).toEqual({ IVA_CORREGIT: 4, MODIFICADORS: 13, INVENTARI: 1 });
    expect(resum.modificadors).toBe(13);
    expect(carta.grups).toEqual([]);
    expect(carta.productes.every((p) => p.grupsModificadors.length === 0)).toBe(true);
  });

  test('variants per preu: la més barata és la del toc i les de preu obert van al final', () => {
    const barril = perId.get('tanque-estrella-damm');
    expect(barril).toMatchObject({ nom: 'Barril Estrella Damm', categoriaId: 'cerveseria', reposaNevera: false, desti: 'barra' });
    expect(barril.variants.map((v) => [v.nom, v.preuCents])).toEqual([
      ['Penalti', 100], ['Quint', 130], ['Terç', 170], ['Tanc', 300], ['Litre', 500], ['Gerra', 700]
    ]);
    expect(variantDe(barril)).toMatchObject({ nom: 'Penalti', preuCents: 100 });
    for (const p of carta.productes.filter((x) => !x.preuObert && x.variants.length > 1)) {
      const preus = p.variants.map((v) => v.preuCents);
      expect(preus, p.id).toEqual([...preus].sort((a, b) => a - b));
    }
  });

  test('preu obert amb més d’una variant: només el Malibú i les Coquetes, que es trien abans del preu; el cost és el de la variant', () => {
    const triar = carta.productes.filter((p) => necessitaTria(p, carta.grups));
    expect(triar.map((p) => p.id)).toEqual(['b5-malibu', 'm4-coquetes-fregides']);
    expect(triar.every(triaLaVariant)).toBe(true);
    const malibu = perId.get('b5-malibu');
    expect(malibu).toMatchObject({ preuObert: true, ivaPercent: 21 });
    expect(malibu.variants.map((v) => [v.id, v.nom, v.costCents])).toEqual([
      ['botella', 'Botella', 1800], ['copa', 'Copa', 200], ['glopet', 'Glopet', 100], ['got', 'Got', 300]
    ]);
    expect(costDeVenda(carta, malibu, 'copa').costCents).toBe(200);
    expect(perId.get('m4-coquetes-fregides').variants.map((v) => [v.id, v.costCents ?? null])).toEqual([['mitja-coca', null], ['sencera', null]]);
    /* Una sola variant de preu obert (com «Varis»): el toc va directe al preu. */
    expect(triaLaVariant(perId.get('altres-al-10'))).toBe(false);
  });

  test('el Bombó: cafeteria, 1,50 €, preu real (exemple: false), barra', () => {
    expect(perId.get('bombo')).toMatchObject({
      nom: 'Bombó', categoriaId: 'cafeteria', ivaPercent: 10, preuObert: false, actiu: true, exemple: false, desti: 'barra',
      reposaNevera: false, alergens: [], handle: 'bombó', imatge: { slug: 'bombo', estat: 'marcador' }, ordre: 1
    });
    expect(perId.get('bombo').variants).toEqual([{ id: 'unitat', nom: 'Unitat', preuCents: 150, ref: '10034' }]);
  });

  test('cuina per a M1–M4, nevera per als refrescs i les cerveses que no són de barril; cap preu d’exemple', () => {
    expect(carta.productes.filter((p) => p.desti === 'cuina')).toHaveLength(27 + 33 + 8 + 71);
    expect(carta.productes.filter((p) => p.reposaNevera)).toHaveLength(26 + 15);
    expect(carta.productes.every((p) => p.exemple === false && p.alergens.length === 0)).toBe(true);
  });

  test('ids únics, imatges úniques dins de cada categoria, el Handle i el REF conservats', () => {
    expect(perId.size).toBe(327);
    const imatges = carta.productes.map((p) => `${p.categoriaId}/${p.imatge.slug}`);
    expect(new Set(imatges).size).toBe(327);
    expect(carta.productes.every((p) => typeof p.handle === 'string' && p.handle !== '')).toBe(true);
    const refs = carta.productes.flatMap((p) => p.variants.map((v) => v.ref));
    expect(new Set(refs).size).toBe(564);
  });

  test('determinista: dues càrregues donen la mateixa llavor, i els bytes del CSV també', () => {
    expect(JSON.stringify(llavorLaParroquia())).toBe(JSON.stringify(LLAVOR));
    expect(JSON.stringify(importaLaParroquia(new Uint8Array(readFileSync(COPIA))))).toBe(JSON.stringify(LLAVOR));
  });

  test('l’establiment de La Parròquia, amb les denominacions de la caixa', () => {
    expect(LLAVOR.establiment).toEqual({ nom: 'La Parròquia · Menjar i Beure', slug: 'la-parroquia', ivaPerDefecte: 10, denominacions: [...DENOMINACIONS] });
  });

  test('el prefix dels noms: el codi i el nom net', () => {
    expect([codiDe('B1☕️ Bombó'), codiDe('B5C🥃 Calimotxo'), codiDe('B3🍺 - Barril Turia'), codiDe('x Altres al 10%'), codiDe('Sense prefix')])
      .toEqual(['B1', 'B5C', 'B3', 'x', null]);
    expect([netejaNom('B3🍺 - Barril Turia'), netejaNom('M4🍢 Xoriset picant'), netejaNom('x Altres al 21%')])
      .toEqual(['Barril Turia', 'Xoriset picant', 'Altres al 21%']);
  });
});

describe('les fotos', () => {
  test('cada foto marcada com a disponible té el seu webp a public/ i és la d’un producte', () => {
    const definitives = carta.productes.filter((p) => p.imatge.estat === 'definitiva').map((p) => `${p.categoriaId}/${p.imatge.slug}`).sort();
    const llistades = Object.entries(IMATGES_DISPONIBLES).flatMap(([categoria, slugs]) => slugs.map((slug) => `${categoria}/${slug}`)).sort();
    expect(definitives).toEqual(llistades);
    for (const cami of llistades) expect(existsSync(path.join(FOTOS, `${cami}.webp`)), cami).toBe(true);
  });

  test.skipIf(!existsSync(MAPA))('cada destí del mapa d’imatges del laboratori és un slug real i el seu origen existix', () => {
    const reals = new Set(carta.productes.map((p) => `${p.categoriaId}/${p.imatge.slug}`));
    const entrades = readFileSync(MAPA, 'utf8').split('\n')
      .map((l) => /^\s*([a-z0-9-]+\/[a-z0-9-]+)\.webp\s+<-\s+(\S.*\S)\s*$/.exec(l)).filter(Boolean).map((m) => [m[1], m[2]]);
    expect(entrades.length).toBeGreaterThan(0);
    expect(entrades.map(([desti]) => desti).filter((desti) => !reals.has(desti))).toEqual([]);
    expect(new Set(entrades.map(([desti]) => desti)).size).toBe(entrades.length);
    if (existsSync(PRODUCCIO)) expect(entrades.map(([, origen]) => origen).filter((origen) => !existsSync(path.join(PRODUCCIO, origen)))).toEqual([]);
  });
});

describe('el registre de llavors', () => {
  test('dos botons: La Parròquia i la carta d’exemple; sense id, la d’exemple', () => {
    expect(LLAVORS.map((l) => [l.id, l.accio, l.nomDelBar])).toEqual([
      ['la-parroquia', 'Carrega la carta de La Parròquia', 'La Parròquia · Menjar i Beure'], ['exemple', 'Torna a la carta d’exemple', null]
    ]);
    expect([nomDeLlavor(undefined), nomDeLlavor('exemple'), nomDeLlavor('la-parroquia'), nomDeLlavor('una-altra')])
      .toEqual(['Carta d’exemple', 'Carta d’exemple', 'La Parròquia · Menjar i Beure', 'Carta pròpia']);
  });

  test('la d’exemple és la de la primera càrrega i no porta nom; La Parròquia, la de l’adaptador; una que no existix rebutja amb LLAVOR', async () => {
    expect(await obteLlavor('exemple')).toEqual({ carta: llavorCarta(), establiment: { slug: ESTABLIMENT_EXEMPLE.slug }, avisos: [], resum: null });
    expect(JSON.stringify(await obteLlavor('la-parroquia'))).toBe(JSON.stringify(LLAVOR));
    await expect(obteLlavor('cap')).rejects.toMatchObject({ codi: 'LLAVOR' });
    await expect(obteLlavor('toString')).rejects.toMatchObject({ codi: 'LLAVOR' });
  });

  test('el nom que diu el botó (nomDelBar) és el que la llavor posa a l’establiment', async () => {
    for (const llavor of LLAVORS) expect((await obteLlavor(llavor.id)).establiment.nom ?? null, llavor.id).toBe(llavor.nomDelBar);
  });
});

describe('el literal de compilació de La Parròquia', () => {
  /* El registre es torna a avaluar amb l'entorn de compilació de cada cas. */
  const registreAmb = async (entorn) => {
    for (const [nom, valor] of Object.entries(entorn)) vi.stubEnv(nom, valor);
    vi.resetModules();
    return import('./index.js');
  };
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('fora del servidor de desenvolupament i sense VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1 no hi és: cap botó i LLAVOR', async () => {
    const registre = await registreAmb({ DEV: false });
    expect(registre.LLAVORS.map((l) => l.id)).toEqual(['exemple']);
    await expect(registre.obteLlavor('la-parroquia')).rejects.toMatchObject({ codi: 'LLAVOR' });
    /* Un dispositiu que ja la té carregada en conserva el nom. */
    expect(registre.nomDeLlavor('la-parroquia')).toBe('La Parròquia · Menjar i Beure');
  });

  test('amb VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1, sí', async () => {
    const registre = await registreAmb({ DEV: false, VITE_SDP_BAR_LLAVOR_LA_PARROQUIA: '1' });
    expect(registre.LLAVORS.map((l) => l.id)).toEqual(['la-parroquia', 'exemple']);
  });
});
