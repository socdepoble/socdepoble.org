// @vitest-environment node
/* Fixture sintètica de purchase/recently observat al client públic.
   Les captures visuals proven estats, no sincronització entre comptes.
   Gauntlet 261022_0225 (crítica Claude): `name` és la clau alemanya del
   catàleg de Bring!; ARTICLES_ES és un tros literal del fitxer públic
   locale/articles.es-ES.json (363 claus) que el client carrega per a una
   llista en castellà. */
import { describe, expect, test } from 'vitest';
import { EQUIVALENTS_BRING, ESQUEMA_CAPTURA_BRING, importaBring } from './bring.js';
import { ARTICLES_BASE, ARTICLES_PRODUCTES, LIMITS, afig, clauDeNom, creaArticlePropi, creaLlista, estatInicial, llistaPerId, marcaACasa, normalitzaEstat } from './nucli/index.js';

const ARTICLES_ES = Object.freeze({
  Milch: 'Leche', Brot: 'Pan', Bier: 'Cerveza', Tofu: 'Tofu', Waschmittel: 'Detergente de lavadora',
  Frischhaltefolie: 'Film transparente', Servietten: 'Servilletas', Haushaltspapier: 'Toallas de papel',
  'WC-Papier': 'Papel higiénico', Katzensnack: 'Golosinas para gatos', 'Eigene Artikel': 'Productos propios',
  Ketchup: 'Ketchup', Limette: 'Lima'
});
const captura = () => ({
  esquema: ESQUEMA_CAPTURA_BRING, uuid: 'llista-remota-sintetica', idioma: 'es-ES', articles: { ...ARTICLES_ES },
  purchase: [{ name: 'Milch', specification: 'sense lactosa' }, { name: 'Tofu del dia', specification: 'dos paquets' }],
  recently: [{ name: 'Brot', specification: 'integral' }]
});
const importa = (c, estat) => importaBring(c, { nom: 'La compra importada', estat });
const codis = (resultat) => resultat.avisos.map((avis) => avis.codi);
function congela(valor) {
  if (valor && typeof valor === 'object') {
    Object.freeze(valor);
    Object.values(valor).forEach(congela);
  }
  return valor;
}

describe('captura Bring! → llista local independent', () => {
  test('conserva pendents, recents i especificacions amb esquema canònic', () => {
    const c = congela(captura());
    const resultat = importa(c);
    const llista = llistaPerId(resultat.estat, resultat.llistaId);
    expect(llista).toMatchObject({ nom: 'La compra importada',
      linies: [{ articleId: 'llet', especificacio: 'sense lactosa' }, { especificacio: 'dos paquets' }],
      recents: [{ articleId: 'pa', especificacio: 'integral' }] });
    expect(resultat.estat.propis).toEqual([{ id: llista.linies[1].articleId, nom: 'Tofu del dia' }]);
    expect(normalitzaEstat(resultat.estat)).toEqual(resultat.estat);
    expect(resultat).toMatchObject({ avisos: [], origen: { proveidor: 'bring', idExtern: c.uuid, idioma: 'es-ES' } });
    expect(importa(c)).toEqual(resultat);
  });

  test('la llista «Mercadona» de les captures: cap article propi en alemany', () => {
    const c = captura();
    c.purchase = ['Bier', 'Waschmittel', 'Frischhaltefolie', 'Servietten', 'Haushaltspapier', 'WC-Papier', 'Katzensnack']
      .map((name) => ({ name, specification: name === 'Bier' ? 'Pack' : '' }));
    c.recently = [];
    const resultat = importa(c);
    const llista = llistaPerId(resultat.estat, resultat.llistaId);
    const [propi] = resultat.estat.propis;
    expect(llista.linies.map((l) => l.articleId)).toEqual(['cervesa', 'detergent', propi.id, 'tovallons', 'paper-cuina', 'paper-higienic', 'llaminadures-gat']);
    expect(llista.linies[0].especificacio).toBe('Pack');
    expect(resultat.estat.propis).toEqual([{ id: propi.id, nom: 'Film transparente' }]);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'SENSE_EQUIVALENT', clau: 'Frischhaltefolie', nom: 'Film transparente' })]);
  });

  test('una clau traduïda que ja és un article propi s’hi enllaça: reimportar no en crea cap més', () => {
    const estat = congela(creaArticlePropi(estatInicial(), 'Film transparente'));
    const c = captura();
    c.purchase = [{ name: 'Frischhaltefolie' }, { name: 'Tofu' }];
    const resultat = importa(c, estat);
    expect(resultat.estat.propis.map((p) => p.nom)).toEqual(['Film transparente', 'Tofu']);
    expect(llistaPerId(resultat.estat, resultat.llistaId).linies[0].articleId).toBe(estat.propis[0].id);
    expect(codis(resultat)).toEqual(['SENSE_EQUIVALENT']);
  });

  test('les llistes prèvies i «A casa» es conserven; l’historial no simula una compra nova', () => {
    const estat = congela(marcaACasa(afig(estatInicial(), 'casa', 'pa'), 'pa', 'acabat'));
    const abans = structuredClone(estat);
    const resultat = importa(captura(), estat);
    expect(resultat.estat.llistes[0]).toEqual(estat.llistes[0]);
    expect(resultat.estat.casa).toEqual([{ articleId: 'pa', estat: 'acabat' }]);
    expect(estat).toEqual(abans);
    expect(resultat.estat.llistes).toHaveLength(2);
  });

  test('el mateix article entre estats queda pendent i ho avisa', () => {
    const c = captura();
    c.recently.push({ name: 'Milch', specification: 'antiga' }, { name: 'TOFU DEL DIA', specification: 'vell' });
    const resultat = importa(c);
    const llista = llistaPerId(resultat.estat, resultat.llistaId);
    expect(llista.recents).toEqual([{ articleId: 'pa', especificacio: 'integral' }]);
    expect(llista.linies[0]).toEqual({ articleId: 'llet', especificacio: 'sense lactosa' });
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'PENDENT_I_RECENT', n: 2 })]);
  });

  test('dos línies que acaben en el mateix article en fan una, amb avís', () => {
    const c = captura();
    c.purchase = [{ name: 'Bier', specification: 'Pack' }, { name: 'Cervesa', specification: 'sense alcohol' }];
    const resultat = importa(c);
    expect(llistaPerId(resultat.estat, resultat.llistaId).linies).toEqual([{ articleId: 'cervesa', especificacio: 'Pack' }]);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'ARTICLE_FUSIONAT', clau: 'Cervesa' })]);
  });

  test('pendent i recent es comparen per l’article resolt, no per la clau', () => {
    const c = { ...captura(), purchase: [{ name: 'Bier' }], recently: [{ name: 'Cervesa' }] };
    const resultat = importa(c);
    const llista = llistaPerId(resultat.estat, resultat.llistaId);
    expect(llista.linies.map((l) => l.articleId)).toEqual(['cervesa']);
    expect(llista.recents).toEqual([]);
    expect(resultat.avisos).toEqual([expect.objectContaining({ codi: 'PENDENT_I_RECENT', n: 1 })]);
  });

  test('una clau sense equivalent i el seu nom traduït són un sol article propi nou', () => {
    const c = { ...captura(), purchase: [{ name: 'Frischhaltefolie' }, { name: 'Film transparente' }], recently: [] };
    const resultat = importa(c);
    expect(llistaPerId(resultat.estat, resultat.llistaId).linies).toHaveLength(1);
    expect(resultat.estat.propis.map((p) => p.nom)).toEqual(['Film transparente']);
    expect(codis(resultat)).toEqual(['ARTICLE_FUSIONAT', 'SENSE_EQUIVALENT']);
  });

  test('una clau que per nom és un producte de botiga s’hi enllaça, però ho avisa', () => {
    const producte = (nom) => ARTICLES_PRODUCTES.find((article) => clauDeNom(article.nom) === clauDeNom(nom)).id;
    const c = { ...captura(), purchase: [{ name: 'Ketchup' }, { name: 'Limette' }], recently: [] };
    const resultat = importa(c);
    expect(llistaPerId(resultat.estat, resultat.llistaId).linies.map((l) => l.articleId)).toEqual([producte('Ketchup'), producte('Lima')]);
    expect(resultat.estat.propis).toEqual([]);
    expect(resultat.avisos).toEqual([
      expect.objectContaining({ codi: 'PRODUCTE_DE_BOTIGA', clau: 'Ketchup', articleId: producte('Ketchup') }),
      expect.objectContaining({ codi: 'PRODUCTE_DE_BOTIGA', clau: 'Limette', articleId: producte('Lima') })
    ]);
  });

  test('nom i especificació es netegen abans de mesurar-los', () => {
    const c = { ...captura(), recently: [],
      purchase: [{ name: `${'x'.repeat(LIMITS.nom)} `, specification: `${'y'.repeat(LIMITS.especificacio)}  ` }] };
    const resultat = importa(c);
    expect(resultat.estat.propis.map((p) => p.nom)).toEqual(['x'.repeat(LIMITS.nom)]);
    expect(llistaPerId(resultat.estat, resultat.llistaId).linies[0].especificacio).toBe('y'.repeat(LIMITS.especificacio));
  });

  test('admet una llista buida però exigix nom; no importa camps aliens', () => {
    const c = { ...captura(), uuid: 'buida', purchase: [], recently: [], members: ['no-traslladar'] };
    const resultat = importa(c);
    expect(llistaPerId(resultat.estat, resultat.llistaId)).toMatchObject({ linies: [], recents: [] });
    expect(JSON.stringify(resultat)).not.toContain('no-traslladar');
    expect(() => importaBring(c)).toThrow();
  });

  test('la taula de la casa només apunta a articles de base, i cada un una sola vegada', () => {
    const base = new Set(ARTICLES_BASE.map((a) => a.id));
    const destins = Object.values(EQUIVALENTS_BRING);
    expect(destins.filter((id) => !base.has(id))).toEqual([]);
    expect(new Set(destins).size).toBe(destins.length);
  });
});

describe('límits d’importació sense pèrdua silenciosa', () => {
  test.each([
    ['esquema desconegut', (c) => { c.esquema = 'altre'; }],
    ['esquema v1, sense traduccions', (c) => { c.esquema = 'sdp.bring.captura.v1'; }],
    ['identitat buida', (c) => { c.uuid = ' '; }],
    ['idioma absent', (c) => { delete c.idioma; }],
    ['idioma invàlid', (c) => { c.idioma = 'castellà'; }],
    ['fitxer d’articles absent', (c) => { delete c.articles; }],
    ['fitxer d’articles buit', (c) => { c.articles = {}; }],
    ['fitxer d’articles que no és un objecte', (c) => { c.articles = ['Milch']; }],
    ['traducció que no és text', (c) => { c.articles.Milch = 7; }],
    ['pendents absents', (c) => { delete c.purchase; }],
    ['recents absents', (c) => { delete c.recently; }],
    ['línia invàlida', (c) => { c.purchase.push(null); }],
    ['nom buit', (c) => { c.purchase[0].name = ' '; }],
    ['nom llarg', (c) => { c.purchase[0].name = 'x'.repeat(LIMITS.nom + 1); }],
    ['nom llarg amb un espai abans de l’última lletra', (c) => { c.purchase[0].name = `${'x'.repeat(LIMITS.nom)} y`; }],
    ['especificació llarga', (c) => { c.purchase[0].specification = 'x'.repeat(LIMITS.especificacio + 1); }],
    ['duplicat normalitzat', (c) => { c.purchase.push({ name: 'MILCH' }); }],
    ['recents duplicats', (c) => { c.recently.push({ name: 'BROT' }); }],
    ['massa pendents', (c) => { c.purchase = Array.from({ length: LIMITS.linies + 1 }, (_, i) => ({ name: `Article ${i}` })); }],
    ['massa recents', (c) => { c.recently = Array.from({ length: LIMITS.recents + 1 }, (_, i) => ({ name: `Article ${i}` })); }]
  ])('rebutja %s sense tocar l’estat existent', (_cas, modifica) => {
    const c = captura();
    modifica(c);
    const estat = congela(estatInicial());
    expect(() => importa(c, estat)).toThrow(TypeError);
    expect(estat).toEqual(estatInicial());
  });

  test('el límit de llistes no sobreescriu ni reutilitza una llista existent', () => {
    let estat = estatInicial();
    while (estat.llistes.length < LIMITS.llistes) estat = creaLlista(estat, 'Llista');
    congela(estat);
    expect(() => importa(captura(), estat)).toThrow(/llista nova/);
    expect(estat.llistes).toHaveLength(LIMITS.llistes);
  });

  test('el límit d’articles propis rebutja tota la captura, sense importació parcial', () => {
    const estat = normalitzaEstat({ ...estatInicial(),
      propis: Array.from({ length: LIMITS.propis }, (_, i) => ({ id: `p-${i + 1}`, nom: `Propi ${i}` })) });
    const abans = structuredClone(estat);
    congela(estat);
    expect(() => importa(captura(), estat)).toThrow(/tots els articles/);
    expect(estat).toEqual(abans);
  });
});
