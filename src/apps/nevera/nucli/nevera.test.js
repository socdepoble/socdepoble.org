// @vitest-environment node
/* La Nevera de Casa · el nucli: cada operació, les invariants i la llista
   blanca. Cap dada real: articles del catàleg sintètic i noms inventats. */
import { describe, expect, test } from 'vitest';
import {
  ARTICLES_BASE, CATEGORIES, ESQUEMA_ESTAT, ID_PROPIS, LIMITS, afig, afigPerNom, afigPropostes, amagaSeccio, articlePerId,
  articlePerNom, articlesDe, categoriesDeLlista, clauDeNom, commuta, creaArticlePropi, creaLlista, esIdNevera,
  esborraArticlePropi, esborraLlista, estatACasa, estatInicial, lleva, liniesOrdenades, llistaPerId, marcaACasa,
  marcaComprat, mouSeccio, netejaText, normalitzaEstat, propostesDeCasa, reanomenaLlista, recentsDisponibles,
  restableixSeccions, triaLlista
} from './index.js';

const IDS_CATEGORIES = CATEGORIES.map((c) => c.id);

function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const fill of Object.values(valor)) congela(fill);
  }
  return valor;
}

/* Un estat congelat: cap operació el pot tocar sense petar. */
const inicial = () => congela(estatInicial());
const linies = (estat, llistaId = 'casa') => llistaPerId(estat, llistaId).linies;

/** Les invariants que normalitzaEstat promet i que cap operació ha de trencar. */
function comprovaInvariants(estat) {
  expect(estat.esquema).toBe(ESQUEMA_ESTAT);
  expect(estat.llistes.length).toBeGreaterThan(0);
  expect(estat.llistes.length).toBeLessThanOrEqual(LIMITS.llistes);
  const idsLlistes = estat.llistes.map((l) => l.id);
  expect(new Set(idsLlistes).size).toBe(idsLlistes.length);
  for (const id of idsLlistes) expect(esIdNevera(id), id).toBe(true);
  expect(idsLlistes).toContain(estat.darreraLlista);
  const existents = new Set(articlesDe(estat).map((a) => a.id));
  for (const llista of estat.llistes) {
    for (const files of [llista.linies, llista.recents]) {
      const ids = files.map((f) => f.articleId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(existents.has(id), id).toBe(true);
      for (const f of files) expect(f.especificacio.length).toBeLessThanOrEqual(LIMITS.especificacio);
    }
    expect(llista.recents.length).toBeLessThanOrEqual(LIMITS.recents);
    expect([...llista.ordre].sort()).toEqual([...IDS_CATEGORIES].sort());
    for (const id of llista.amagades) expect(IDS_CATEGORIES).toContain(id);
    expect(llista.nom.length).toBeGreaterThan(0);
  }
  const casa = estat.casa.map((c) => c.articleId);
  expect(new Set(casa).size).toBe(casa.length);
  for (const id of casa) expect(existents.has(id), id).toBe(true);
  const usats = [...estat.propis, ...estat.llistes].map((f) => f.id.match(/^[lp]-(\d+)$/)).filter(Boolean).map((m) => Number(m[1]));
  for (const n of usats) expect(estat.seq).toBeGreaterThan(n);
  expect(normalitzaEstat(estat)).toEqual(estat);
}

describe('el catàleg de base', () => {
  test('catorze seccions en l’ordre de La Compra, amb «Articles propis» al final', () => {
    expect(CATEGORIES.map((c) => c.nom)).toEqual([
      'Fruita i verdura', 'Pa i pastissos', 'Llet i formatge', 'Carn i peix', 'Ingredients i espècies', 'Congelats',
      'Cereals i pasta', 'Picar i dolços', 'Begudes', 'Casa', 'Higiene i salut', 'Mascotes', 'Jardí', 'Articles propis'
    ]);
    expect(IDS_CATEGORIES.at(-1)).toBe(ID_PROPIS);
  });

  test('ids únics i segurs per a la URL, cap amb el prefix dels propis, i cada secció de base té articles', () => {
    const ids = ARTICLES_BASE.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const article of ARTICLES_BASE) {
      expect(esIdNevera(article.id), article.id).toBe(true);
      expect(article.id).not.toMatch(/^p-\d/);
      expect(IDS_CATEGORIES).toContain(article.categoriaId);
      expect(article.categoriaId).not.toBe(ID_PROPIS);
      expect(netejaText(article.nom, LIMITS.nom)).toBe(article.nom);
    }
    for (const id of IDS_CATEGORIES.filter((c) => c !== ID_PROPIS)) {
      expect(ARTICLES_BASE.some((a) => a.categoriaId === id), id).toBe(true);
    }
    expect(new Set(ARTICLES_BASE.map((a) => clauDeNom(a.nom))).size).toBe(ARTICLES_BASE.length);
  });
});

describe('estatInicial i normalitzaEstat (la llista blanca)', () => {
  test('el primer dia: una llista «Casa» buida, activa, amb totes les seccions en l’ordre de base', () => {
    const estat = estatInicial();
    expect(estat).toEqual({
      esquema: ESQUEMA_ESTAT, seq: 1, propis: [], casa: [], darreraLlista: 'casa',
      llistes: [{ id: 'casa', nom: 'Casa', linies: [], recents: [], ordre: IDS_CATEGORIES, amagades: [] }]
    });
    comprovaInvariants(estat);
  });

  test.each([null, undefined, 42, 'text', [], { llistes: 'no' }, { llistes: [null, 3, []] }])('%j dona l’estat inicial', (cru) => {
    expect(normalitzaEstat(cru)).toEqual(estatInicial());
  });

  test('descarta camps desconeguts, articles inexistents, repetits, ids reservats o insegurs i llistes sobrants', () => {
    const cru = {
      seq: 2,
      secret: 'no passa',
      darreraLlista: 'fantasma',
      propis: [{ id: 'p-7', nom: '  Tofu   fresc ', extra: 1 }, { id: 'p-7', nom: 'Repetit' }, { id: 'tofu', nom: 'Sense prefix' }, { id: 'p-8', nom: '   ' }],
      llistes: [
        { id: 'Mercat', nom: 'Majúscules' },
        { id: 'cataleg', nom: 'Reservat' },
        { id: '../x', nom: 'Insegur' },
        {
          id: 'mercat', nom: 'Mercat\u0000 del\u{200B} dijous', foto: 'x',
          linies: [{ articleId: 'llet', especificacio: 'sense\u{202E} lactosa', preu: 3 }, { articleId: 'llet' }, { articleId: 'inventat' }, { articleId: 'p-7' }],
          recents: [{ articleId: 'pa', especificacio: 7 }],
          ordre: ['begudes', 'begudes', 'no-existix'],
          amagades: ['mascotes', 'mascotes', 'fantasma']
        },
        { id: 'mercat', nom: 'Repetida' }
      ],
      casa: [{ articleId: 'ous', estat: 'acabat' }, { articleId: 'ous', estat: 'hi-ha' }, { articleId: 'llet', estat: 'potser' }, { articleId: 'cap', estat: 'acabat' }]
    };
    const estat = normalitzaEstat(cru);
    expect(Object.keys(estat).sort()).toEqual(['casa', 'darreraLlista', 'esquema', 'llistes', 'propis', 'seq']);
    expect(estat.propis).toEqual([{ id: 'p-7', nom: 'Tofu fresc' }]);
    expect(estat.llistes.map((l) => l.id)).toEqual(['mercat']);
    const [mercat] = estat.llistes;
    expect(Object.keys(mercat).sort()).toEqual(['amagades', 'id', 'linies', 'nom', 'ordre', 'recents']);
    expect(mercat.nom).toBe('Mercat del dijous');
    expect(mercat.linies).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }, { articleId: 'p-7', especificacio: '' }]);
    expect(mercat.recents).toEqual([{ articleId: 'pa', especificacio: '' }]);
    expect(mercat.ordre[0]).toBe('begudes');
    expect(mercat.ordre).toHaveLength(IDS_CATEGORIES.length);
    expect(mercat.amagades).toEqual(['mascotes']);
    expect(estat.casa).toEqual([{ articleId: 'ous', estat: 'acabat' }]);
    expect(estat.darreraLlista).toBe('mercat');
    expect(estat.seq).toBe(8);
    comprovaInvariants(estat);
  });

  test('respecta els límits: llistes, línies, recents i textos llargs', () => {
    const moltes = Array.from({ length: LIMITS.llistes + 5 }, (_, i) => ({ id: `l-${i + 1}`, nom: `Llista ${i + 1}` }));
    expect(normalitzaEstat({ llistes: moltes }).llistes).toHaveLength(LIMITS.llistes);
    const recents = ARTICLES_BASE.slice(0, LIMITS.recents + 5).map((a) => ({ articleId: a.id }));
    const llarg = 'x'.repeat(500);
    const estat = normalitzaEstat({ llistes: [{ id: 'l-1', nom: llarg, recents, linies: [{ articleId: 'pa', especificacio: llarg }] }] });
    expect(estat.llistes[0].recents).toHaveLength(LIMITS.recents);
    expect(estat.llistes[0].nom).toHaveLength(LIMITS.nom);
    expect(estat.llistes[0].linies[0].especificacio).toHaveLength(LIMITS.especificacio);
    expect(estat.seq).toBe(2);
  });

  test('és idempotent i no toca l’entrada', () => {
    const cru = congela({ llistes: [{ id: 'l-3', nom: 'A', linies: [{ articleId: 'ous' }] }], seq: 1 });
    const una = normalitzaEstat(cru);
    expect(normalitzaEstat(una)).toEqual(una);
    expect(una.seq).toBe(4);
  });

  test('netejaText i clauDeNom', () => {
    expect(netejaText('  a\u0007 b\t\nc\u{FEFF}\u{AD}\u{2028} ', 10)).toBe('a b c');
    /* Els invisibles desapareixen sense partir la paraula; els controls separen. */
    expect(netejaText('Ca\u{AD}ra\u{200B}bas\u{2066}só', 20)).toBe('Carabassó');
    expect(netejaText('Pa\u0000de\u{2029}motle', 20)).toBe('Pa de motle');
    expect(netejaText(42, 10)).toBe('');
    expect(netejaText('àèòú', 2)).toBe('àè');
    expect(clauDeNom(' CREÏLLES ')).toBe(clauDeNom('creilles'));
  });
});

describe('el que falta comprar', () => {
  test('afig: posa una vegada, canvia l’especificació i torna el mateix estat si no canvia res', () => {
    const e0 = inicial();
    const e1 = afig(e0, 'casa', 'llet', { especificacio: '  sense   lactosa ' });
    expect(linies(e1)).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]);
    expect(linies(e0)).toEqual([]);
    expect(afig(e1, 'casa', 'llet')).toBe(e1);
    expect(afig(e1, 'casa', 'llet', { especificacio: 'sense lactosa' })).toBe(e1);
    const e2 = afig(e1, 'casa', 'llet', { especificacio: '2 l' });
    expect(linies(e2)).toEqual([{ articleId: 'llet', especificacio: '2 l' }]);
    expect(afig(e0, 'casa', 'inventat')).toBe(e0);
    expect(afig(e0, 'fantasma', 'llet')).toBe(e0);
    comprovaInvariants(e2);
  });

  test('lleva i commuta', () => {
    const e1 = congela(commuta(inicial(), 'casa', 'ous'));
    expect(linies(e1).map((l) => l.articleId)).toEqual(['ous']);
    const e2 = commuta(e1, 'casa', 'ous');
    expect(linies(e2)).toEqual([]);
    expect(lleva(e2, 'casa', 'ous')).toBe(e2);
    expect(commuta(e1, 'fantasma', 'ous')).toBe(e1);
  });

  test('marcaComprat: ix de la llista i passa el primer als recents, sense repetits i amb límit', () => {
    let estat = congela(afig(afig(inicial(), 'casa', 'llet', { especificacio: 'sense lactosa' }), 'casa', 'pa'));
    estat = congela(marcaComprat(estat, 'casa', 'llet'));
    expect(linies(estat).map((l) => l.articleId)).toEqual(['pa']);
    expect(llistaPerId(estat, 'casa').recents).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]);
    expect(marcaComprat(estat, 'casa', 'llet')).toBe(estat);
    estat = marcaComprat(estat, 'casa', 'pa');
    estat = marcaComprat(afig(estat, 'casa', 'llet'), 'casa', 'llet');
    expect(llistaPerId(estat, 'casa').recents.map((r) => r.articleId)).toEqual(['llet', 'pa']);
    for (const article of ARTICLES_BASE.slice(0, LIMITS.recents + 3)) estat = marcaComprat(afig(estat, 'casa', article.id), 'casa', article.id);
    expect(llistaPerId(estat, 'casa').recents).toHaveLength(LIMITS.recents);
    comprovaInvariants(estat);
  });

  test('tornar a posar un recent recupera la seua especificació; recentsDisponibles no repetix el que ja hi és', () => {
    let estat = marcaComprat(afig(inicial(), 'casa', 'llet', { especificacio: 'sense lactosa' }), 'casa', 'llet');
    expect(recentsDisponibles(estat, 'casa').map((r) => r.articleId)).toEqual(['llet']);
    estat = commuta(estat, 'casa', 'llet');
    expect(linies(estat)).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]);
    expect(recentsDisponibles(estat, 'casa')).toEqual([]);
    expect(recentsDisponibles(estat, 'fantasma')).toEqual([]);
  });

  test('liniesOrdenades: en l’ordre de les seccions de la llista i, dins, en l’ordre d’arribada', () => {
    let estat = inicial();
    for (const id of ['paper-higienic', 'llet', 'tomaques', 'ous', 'pomes']) estat = afig(estat, 'casa', id);
    expect(liniesOrdenades(estat, 'casa').map((l) => l.articleId)).toEqual(['tomaques', 'pomes', 'llet', 'ous', 'paper-higienic']);
    estat = mouSeccio(mouSeccio(estat, 'casa', 'llet-formatge', -1), 'casa', 'llet-formatge', -1);
    expect(liniesOrdenades(estat, 'casa').map((l) => l.articleId)).toEqual(['llet', 'ous', 'tomaques', 'pomes', 'paper-higienic']);
    expect(liniesOrdenades(estat, 'fantasma')).toEqual([]);
  });
});

describe('les llistes', () => {
  test('creaLlista: id l-<seq>, passa a ser l’activa, nom net o «Llista nova»', () => {
    const e1 = congela(creaLlista(inicial(), '  Mercat del dijous '));
    expect(e1.llistes.map((l) => [l.id, l.nom])).toEqual([['casa', 'Casa'], ['l-1', 'Mercat del dijous']]);
    expect(e1.darreraLlista).toBe('l-1');
    expect(e1.seq).toBe(2);
    const e2 = creaLlista(e1, '   ');
    expect(e2.llistes.at(-1)).toMatchObject({ id: 'l-2', nom: 'Llista nova', linies: [], ordre: IDS_CATEGORIES });
    comprovaInvariants(e2);
  });

  test('creaLlista salta un id ja pres (una còpia recuperada) i no passa del límit', () => {
    const importat = congela(normalitzaEstat({ seq: 1, llistes: [{ id: 'l-1', nom: 'A' }] }));
    expect(importat.seq).toBe(2);
    const forçat = { ...importat, seq: 1 };
    expect(creaLlista(forçat, 'B').llistes.at(-1).id).toBe('l-2');
    let ple = inicial();
    for (let i = 0; i < LIMITS.llistes + 2; i += 1) ple = creaLlista(ple, `L${i}`);
    expect(ple.llistes).toHaveLength(LIMITS.llistes);
    expect(creaLlista(ple, 'Una més')).toBe(ple);
  });

  test('reanomena, tria i esborra (mai l’última)', () => {
    const e1 = congela(creaLlista(inicial(), 'Mercat'));
    expect(reanomenaLlista(e1, 'l-1', '  ')).toBe(e1);
    expect(reanomenaLlista(e1, 'l-1', 'Mercat')).toBe(e1);
    expect(llistaPerId(reanomenaLlista(e1, 'l-1', 'Fira'), 'l-1').nom).toBe('Fira');
    expect(triaLlista(e1, 'casa').darreraLlista).toBe('casa');
    expect(triaLlista(e1, 'l-1')).toBe(e1);
    expect(triaLlista(e1, 'fantasma')).toBe(e1);
    const e2 = congela(esborraLlista(e1, 'l-1'));
    expect(e2.llistes.map((l) => l.id)).toEqual(['casa']);
    expect(e2.darreraLlista).toBe('casa');
    expect(esborraLlista(e2, 'casa')).toBe(e2);
    expect(esborraLlista(e1, 'fantasma')).toBe(e1);
    comprovaInvariants(e2);
  });
});

describe('articles propis', () => {
  test('creaArticlePropi: p-<seq> a «Articles propis»; cap repetit (tampoc d’un de base, sense accents)', () => {
    const e0 = inicial();
    const e1 = congela(creaArticlePropi(e0, ' Tofu '));
    expect(e1.propis).toEqual([{ id: 'p-1', nom: 'Tofu' }]);
    expect(articlePerId(e1, 'p-1')).toEqual({ id: 'p-1', nom: 'Tofu', categoriaId: ID_PROPIS, propi: true });
    expect(creaArticlePropi(e1, 'tofu')).toBe(e1);
    expect(creaArticlePropi(e1, 'CREILLES')).toBe(e1);
    expect(creaArticlePropi(e1, '  ')).toBe(e1);
    expect(articlePerNom(e1, 'creïlles').id).toBe('creilles');
    expect(articlePerNom(e1, '')).toBeNull();
  });

  test('afigPerNom: un article que ja existix va a la llista; un de nou es crea i hi va', () => {
    const e1 = congela(afigPerNom(inicial(), 'casa', 'Llet', { especificacio: '1 l' }));
    expect(linies(e1)).toEqual([{ articleId: 'llet', especificacio: '1 l' }]);
    const e2 = congela(afigPerNom(e1, 'casa', 'Kombutxa'));
    expect(e2.propis).toEqual([{ id: 'p-1', nom: 'Kombutxa' }]);
    expect(linies(e2).map((l) => l.articleId)).toEqual(['llet', 'p-1']);
    expect(afigPerNom(e2, 'fantasma', 'Res')).toBe(e2);
    expect(afigPerNom(e2, 'casa', '   ')).toBe(e2);
    comprovaInvariants(e2);
  });

  test('NEV-R5: l’apòstrof recte, el tipogràfic i el modificador són el mateix nom (cap propi duplicat)', () => {
    const e0 = inicial();
    for (const nom of ['oli d\'oliva', 'Oli d\u{2019}oliva', 'OLI D\u{2018}OLIVA', 'oli d\u{2BC}oliva']) {
      expect(articlePerNom(e0, nom)?.id, nom).toBe('oli-oliva');
      expect(creaArticlePropi(e0, nom), nom).toBe(e0);
    }
    expect(clauDeNom('Paper d\'alumini')).toBe(clauDeNom('Paper d\u{2019}alumini'));
    const e1 = afigPerNom(e0, 'casa', 'paper d\'alumini');
    expect(e1.propis).toEqual([]);
    expect(linies(e1)).toEqual([{ articleId: 'paper-alumini', especificacio: '' }]);
  });

  test('esborraArticlePropi: fora del catàleg, de totes les llistes (recents inclosos) i d’«A casa»', () => {
    let estat = afigPerNom(creaLlista(inicial(), 'Mercat'), 'casa', 'Kombutxa');
    estat = afig(estat, 'l-1', 'p-2');
    estat = marcaComprat(estat, 'l-1', 'p-2');
    estat = congela(marcaACasa(estat, 'p-2', 'acabat'));
    expect(estat.propis.map((p) => p.id)).toEqual(['p-2']);
    const net = esborraArticlePropi(estat, 'p-2');
    expect(net.propis).toEqual([]);
    expect(net.llistes.flatMap((l) => [...l.linies, ...l.recents])).toEqual([]);
    expect(net.casa).toEqual([]);
    expect(esborraArticlePropi(estat, 'llet')).toBe(estat);
    comprovaInvariants(net);
  });
});

describe('les seccions de cada llista', () => {
  test('mouSeccio, amagaSeccio i restableixSeccions; categoriesDeLlista les dona en ordre', () => {
    const e1 = congela(mouSeccio(inicial(), 'casa', 'begudes', -1));
    expect(llistaPerId(e1, 'casa').ordre.indexOf('begudes')).toBe(IDS_CATEGORIES.indexOf('begudes') - 1);
    expect(mouSeccio(e1, 'casa', 'fruita-verdura', -1)).toBe(e1);
    expect(mouSeccio(e1, 'casa', ID_PROPIS, 1)).toBe(e1);
    expect(mouSeccio(e1, 'casa', 'fantasma', 1)).toBe(e1);
    const e2 = congela(amagaSeccio(e1, 'casa', 'mascotes', true));
    expect(amagaSeccio(e2, 'casa', 'mascotes', true)).toBe(e2);
    expect(amagaSeccio(e2, 'casa', 'fantasma', true)).toBe(e2);
    const seccions = categoriesDeLlista(e2, 'casa');
    expect(seccions.find((c) => c.id === 'mascotes')).toMatchObject({ nom: 'Mascotes', visible: false });
    expect(seccions.map((c) => c.ordre)).toEqual(IDS_CATEGORIES.map((_, i) => i));
    expect(categoriesDeLlista(e2, 'casa', { totesVisibles: true }).every((c) => c.visible)).toBe(true);
    expect(categoriesDeLlista(e2, 'fantasma').map((c) => c.id)).toEqual(IDS_CATEGORIES);
    const e3 = restableixSeccions(e2, 'casa');
    expect(llistaPerId(e3, 'casa')).toMatchObject({ ordre: IDS_CATEGORIES, amagades: [] });
    expect(restableixSeccions(e3, 'casa')).toBe(e3);
    expect(amagaSeccio(e2, 'casa', 'mascotes', false)).toEqual(e1);
  });
});

describe('a casa', () => {
  test('marcaACasa: hi ha, se n’acaba, s’ha acabat o deixar de seguir-lo', () => {
    const e1 = congela(marcaACasa(inicial(), 'ous', 'se-n-acaba'));
    expect(estatACasa(e1, 'ous')).toBe('se-n-acaba');
    expect(marcaACasa(e1, 'ous', 'se-n-acaba')).toBe(e1);
    expect(marcaACasa(e1, 'ous', 'potser')).toBe(e1);
    expect(marcaACasa(e1, 'inventat', 'acabat')).toBe(e1);
    expect(estatACasa(marcaACasa(e1, 'ous', 'acabat'), 'ous')).toBe('acabat');
    const e2 = marcaACasa(e1, 'ous', null);
    expect(estatACasa(e2, 'ous')).toBeNull();
    expect(marcaACasa(e2, 'ous', null)).toBe(e2);
  });

  test('propostesDeCasa: el que s’ha acabat primer, després el que se n’acaba, i res del que ja és a la llista', () => {
    let estat = inicial();
    estat = marcaACasa(estat, 'sal', 'se-n-acaba');
    estat = marcaACasa(estat, 'ous', 'acabat');
    estat = marcaACasa(estat, 'arros', 'se-n-acaba');
    estat = marcaACasa(estat, 'llet', 'hi-ha');
    estat = congela(marcaACasa(estat, 'pa', 'acabat'));
    expect(propostesDeCasa(estat, 'casa')).toEqual([
      { articleId: 'ous', estat: 'acabat' }, { articleId: 'pa', estat: 'acabat' },
      { articleId: 'arros', estat: 'se-n-acaba' }, { articleId: 'sal', estat: 'se-n-acaba' }
    ]);
    const amb = afig(estat, 'casa', 'pa');
    expect(propostesDeCasa(amb, 'casa').map((p) => p.articleId)).toEqual(['ous', 'arros', 'sal']);
    const totes = afigPropostes(amb, 'casa');
    expect(linies(totes).map((l) => l.articleId)).toEqual(['pa', 'ous', 'arros', 'sal']);
    expect(propostesDeCasa(totes, 'casa')).toEqual([]);
    expect(afigPropostes(totes, 'casa')).toBe(totes);
  });

  test('comprar un article que se seguix a casa el torna a «N’hi ha»; un que no se seguix no el comença a seguir', () => {
    let estat = afig(afig(marcaACasa(inicial(), 'ous', 'acabat'), 'casa', 'ous'), 'casa', 'pa');
    estat = marcaComprat(marcaComprat(estat, 'casa', 'ous'), 'casa', 'pa');
    expect(estat.casa).toEqual([{ articleId: 'ous', estat: 'hi-ha' }]);
  });
});

describe('invariants sota una seqüència llarga d’operacions', () => {
  test('600 operacions pseudoaleatòries (llavor fixa) mai trenquen les invariants ni toquen l’estat d’entrada', () => {
    let llavor = 20261002;
    const atzar = (n) => {
      llavor = (llavor * 1103515245 + 12345) % 2147483648;
      return llavor % n;
    };
    const tria = (llista) => llista[atzar(llista.length)];
    const ids = () => [...ARTICLES_BASE.slice(0, 30).map((a) => a.id), 'inventat'];
    let estat = inicial();
    for (let i = 0; i < 600; i += 1) {
      const llistes = [...estat.llistes.map((l) => l.id), 'fantasma'];
      const article = tria([...ids(), ...estat.propis.map((p) => p.id)]);
      const llista = tria(llistes);
      const operacions = [
        () => afig(estat, llista, article, atzar(2) ? { especificacio: `spec ${i}` } : {}),
        () => lleva(estat, llista, article),
        () => commuta(estat, llista, article),
        () => marcaComprat(estat, llista, article),
        () => creaLlista(estat, `Llista ${i}`),
        () => esborraLlista(estat, llista),
        () => triaLlista(estat, llista),
        () => reanomenaLlista(estat, llista, `Nom ${i}`),
        () => afigPerNom(estat, llista, tria(['Kombutxa', 'Tofu', 'llet', 'Creïlles', ''])),
        () => esborraArticlePropi(estat, tria(estat.propis.map((p) => p.id).concat('p-999'))),
        () => mouSeccio(estat, llista, tria(IDS_CATEGORIES), atzar(2) ? 1 : -1),
        () => amagaSeccio(estat, llista, tria(IDS_CATEGORIES), Boolean(atzar(2))),
        () => restableixSeccions(estat, llista),
        () => marcaACasa(estat, article, tria(['hi-ha', 'se-n-acaba', 'acabat', null])),
        () => afigPropostes(estat, llista)
      ];
      congela(estat);
      estat = tria(operacions)();
      if (i % 50 === 0) comprovaInvariants(estat);
    }
    comprovaInvariants(estat);
  });
});
