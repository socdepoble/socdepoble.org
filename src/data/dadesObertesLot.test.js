// @vitest-environment node
/* T2 · D04/D10 (assalt 261101) · src/data/dadesObertesLot.js: la forma de les
   dades obertes, el lot de restauració i la fusió atòmica i idempotent que
   servix l'adaptador local. Pur: cap xarxa. */
import { describe, expect, test } from 'vitest';
import { COLECCIONS_DADES_OBERTES, LIMIT_DADES_OBERTES } from './contracte.js';
import {
  CAMPS_DEL_LOT, COLECCIONS_DEL_LOT, FORMAT_LOT, entitatsDeLEstat, estatBuitDeDadesObertes, fallesDeDadesObertes,
  fusionaLotDadesObertes, llegixDeLEstat, poblesDeLEstat, totesDeLEstat, validaLotDadesObertes
} from './dadesObertesLot.js';
import { FORMAT_DADES_OBERTES } from './exportaMunicipiOpenData.js';

const TORRE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const SELLA = Object.freeze({ slug: 'sella', nom: 'Sella' });
const fm = (municipi = TORRE.slug) => ({ type: 'Memòria oral', title: 'La collita', status: 'stable', municipi });
const lot = (municipi = TORRE, extra = {}) => ({
  format: FORMAT_LOT,
  versio: '1.2.0',
  municipi: { ...municipi },
  entitats: [{ id: 'org-1', name: 'Rentonar', kind: 'entity', town_name: municipi.nom, visibility: 'public' }],
  noticies: [{ id: 'n-1', title: 'Ban', author_org_id: 'org-1', poble_id: municipi.slug, visibility: 'public' }],
  agenda: [{ id: 'a-1', title: 'Festa', inici: '2026-08-15', author_org_id: 'org-1', poble_id: municipi.slug, visibility: 'public' }],
  memoria: [{ id: 'm-1', title: 'Llegenda', author_org_id: 'org-1', poble_id: municipi.slug, visibility: 'public' }],
  memoriaOral: [{ id: 'o-1', okf: { cami: `memoria-oral/${municipi.slug}/la-collita-0a1b2c3d.md`, frontmatter: fm(municipi.slug), cos: '# Resum\n' }, author_org_id: 'org-1', visibility: 'public' }],
  ...extra
});
const zero = () => Object.fromEntries(COLECCIONS_DEL_LOT.map((c) => [c, 0]));
const uns = () => Object.fromEntries(COLECCIONS_DEL_LOT.map((c) => [c, 1]));

describe('formes', () => {
  test('el format del lot és el del paquet i les col·leccions són les del contracte més el directori', () => {
    expect(FORMAT_LOT).toBe(FORMAT_DADES_OBERTES);
    expect(COLECCIONS_DEL_LOT).toEqual(['entitats', ...COLECCIONS_DADES_OBERTES]);
    expect(Object.keys(CAMPS_DEL_LOT)).toEqual(COLECCIONS_DEL_LOT);
    // Cap camp de persona ni de correu a la llista blanca.
    for (const camps of Object.values(CAMPS_DEL_LOT)) {
      expect(camps.filter((camp) => /owner|user|email|correu|author_id|author_name|membres/i.test(camp))).toEqual([]);
    }
  });

  test('fallesDeDadesObertes: les quatre claus, null o llistes d’objectes, i cap més', () => {
    expect(fallesDeDadesObertes({ noticies: [], agenda: [{ id: 1 }], memoria: null, memoriaOral: null })).toEqual([]);
    expect(fallesDeDadesObertes({ noticies: [], agenda: [], memoria: null })).toEqual(['falta memoriaOral']);
    expect(fallesDeDadesObertes({ noticies: [], agenda: [], memoria: null, memoriaOral: null, xat: [] })).toEqual(['clau de més: xat']);
    expect(fallesDeDadesObertes({ noticies: 'x', agenda: [3], memoria: null, memoriaOral: null }))
      .toEqual(['noticies havia de ser una llista o null i és string', 'agenda té elements que no són objectes']);
    expect(fallesDeDadesObertes([])).toEqual(['havia de ser un objecte i és array']);
    expect(fallesDeDadesObertes(null)).toEqual(['havia de ser un objecte i és null']);
  });
});

describe('validaLotDadesObertes', () => {
  test('un lot complet és vàlid', () => {
    expect(validaLotDadesObertes(lot())).toEqual([]);
  });

  test('sense municipi, amb claus de més, format o versió dolents', () => {
    const sense = lot();
    delete sense.municipi;
    expect(validaLotDadesObertes(sense)).toContain('falta el municipi');
    expect(validaLotDadesObertes({ ...lot(), mercat: [] })).toContain('clau de més: mercat');
    expect(validaLotDadesObertes({ ...lot(), format: 'altre' })).toContain(`format havia de ser ${FORMAT_LOT}`);
    expect(validaLotDadesObertes({ ...lot(), versio: 'v1' })).toContain('versio ha de ser una versió x.y.z');
    expect(validaLotDadesObertes({ ...lot(), noticies: undefined })).toContain('noticies havia de ser una llista');
    expect(validaLotDadesObertes({ ...lot(), municipi: { slug: 'La Torre', nom: 'La Torre' } })).toContain('municipi.slug no és cap slug');
    expect(validaLotDadesObertes({ ...lot(), municipi: { ...TORRE, email: 'x@poble.invalid' } })).toContain('municipi: clau de més email');
  });

  test('camps fora de la llista blanca, ids repetits o amb angles, visibility no pública', () => {
    const l = lot();
    l.noticies.push({ ...l.noticies[0] });
    l.noticies[0].email = 'veina@poble.invalid';
    l.agenda[0].id = '<script>';
    l.memoria[0].visibility = 'members';
    l.entitats[0].owner_user_id = 'persona';
    const falles = validaLotDadesObertes(l);
    expect(falles).toEqual(expect.arrayContaining([
      'noticies[0]: camp no admés email', 'noticies: id repetit n-1', 'agenda[0].id no és cap identificador opac',
      "memoria[0].visibility ha de ser 'public'", 'entitats[0]: camp no admés owner_user_id'
    ]));
  });

  test('el poble ha de quadrar a cada fila, i cada element ha de portar l’entitat que el signa', () => {
    const l = lot();
    l.entitats[0].town_name = 'Sella';
    l.noticies[0].poble_id = 'sella';
    delete l.agenda[0].author_org_id;
    l.memoriaOral[0].okf.frontmatter.municipi = 'sella';
    expect(validaLotDadesObertes(l)).toEqual(expect.arrayContaining([
      'entitats[0].town_name no és el del municipi', 'noticies[0].poble_id no és el del municipi',
      "agenda[0].author_org_id: cal l'entitat que la signa", 'memoriaOral[0].okf.frontmatter.municipi no és el del municipi'
    ]));
  });

  test('valors que no són text ni null, okf mal format i un pare que no és del lot', () => {
    const l = lot();
    l.noticies[0].title = { html: '<b>' };
    l.memoriaOral[0].okf = { cami: 'x.md', frontmatter: fm(), cos: 'a', extra: 1 };
    l.entitats[0].parent_organization_id = 'org-absent';
    expect(validaLotDadesObertes(l)).toEqual(expect.arrayContaining([
      'noticies[0].title ha de ser text o null', 'memoriaOral[0].okf ha de ser { cami, frontmatter, cos }',
      'entitats[0].parent_organization_id no és cap entitat del lot'
    ]));
  });

  test('cap __proto__, constructor ni prototype, tampoc dins del frontmatter; i Object.prototype intacte', () => {
    const contaminat = JSON.parse(`{"format":"${FORMAT_LOT}","versio":"1.2.0","municipi":{"slug":"sella","nom":"Sella"},"__proto__":{"admin":true},`
      + '"entitats":[],"noticies":[],"agenda":[],"memoria":[],"memoriaOral":[]}');
    expect(validaLotDadesObertes(contaminat)).toEqual(['clau prohibida __proto__']);
    const fila = JSON.parse('{"id":"n-1","author_org_id":"o","poble_id":"sella","visibility":"public","__proto__":{"x":1}}');
    expect(validaLotDadesObertes({ ...lot(SELLA, { entitats: [] }), noticies: [fila], memoriaOral: [], agenda: [], memoria: [] }))
      .toEqual(['noticies[0]: clau prohibida __proto__']);
    const l = lot();
    l.memoriaOral[0].okf.frontmatter = JSON.parse('{"type":"Memòria oral","municipi":"la-torre-de-les-macanes","generated":{"constructor":{"prototype":1}}}');
    expect(validaLotDadesObertes(l)).toEqual(['memoriaOral[0].okf.frontmatter.generated: clau prohibida constructor']);
    expect({}.admin).toBeUndefined();
    expect({}.x).toBeUndefined();
  });

  test('el sostre de cada col·lecció', () => {
    const llarga = Array.from({ length: LIMIT_DADES_OBERTES + 1 }, (_, i) => ({ id: `n-${i}`, author_org_id: 'o', poble_id: TORRE.slug, visibility: 'public' }));
    expect(validaLotDadesObertes({ ...lot(), noticies: llarga })).toEqual([`noticies passa de ${LIMIT_DADES_OBERTES} elements`]);
  });

  test('T2-G03 · dues fitxes OKF amb el mateix camí dins del lot', () => {
    const l = lot();
    l.memoriaOral.push({ ...structuredClone(l.memoriaOral[0]), id: 'o-2' });
    expect(validaLotDadesObertes(l)).toEqual([`memoriaOral: camí OKF repetit ${l.memoriaOral[0].okf.cami}`]);
  });
});

describe('fusionaLotDadesObertes i la lectura', () => {
  test('primera vegada: tot creat; segona: tot igual, i l’estat no canvia', () => {
    const buit = estatBuitDeDadesObertes();
    const primera = fusionaLotDadesObertes(buit, lot());
    expect(primera.informe).toEqual({ creats: uns(), actualitzats: zero(), iguals: zero() });
    const segona = fusionaLotDadesObertes(primera.estat, lot());
    expect(segona.informe).toEqual({ creats: zero(), actualitzats: zero(), iguals: uns() });
    expect(llegixDeLEstat(segona.estat, { poble: TORRE })).toEqual(llegixDeLEstat(primera.estat, { poble: TORRE }));
    // L'estat d'entrada no es toca mai.
    expect(buit.noticies.size).toBe(0);
  });

  test('un camp canviat compta com a actualitzat; mai s’esborra cap fila que el lot no porta', () => {
    const { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot());
    const nou = lot();
    nou.noticies[0].title = 'Ban nou';
    nou.agenda = [];
    const r = fusionaLotDadesObertes(estat, nou);
    expect(r.informe.actualitzats.noticies).toBe(1);
    expect(r.informe.iguals.agenda).toBe(0);
    expect(llegixDeLEstat(r.estat, { poble: TORRE }).agenda.map((a) => a.id)).toEqual(['a-1']);
    expect(llegixDeLEstat(r.estat, { poble: TORRE }).noticies[0].title).toBe('Ban nou');
  });

  test('atòmica: un lot invàlid o un conflicte no escriu res', () => {
    const { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot());
    const invalid = lot(SELLA);
    invalid.memoria[0].poble_id = 'altre';
    expect(() => fusionaLotDadesObertes(estat, invalid)).toThrow(TypeError);
    // Un id que ja és de La Torre, en un lot de Sella: conflicte, i Sella no entra.
    const robat = lot(SELLA);
    robat.noticies[0].id = 'n-1';
    robat.entitats[0].id = 'org-sella';
    for (const c of ['noticies', 'agenda', 'memoria', 'memoriaOral']) robat[c].forEach((f) => { f.author_org_id = 'org-sella'; });
    let error = null;
    try { fusionaLotDadesObertes(estat, robat); } catch (e) { error = e; }
    expect(error).toMatchObject({ code: 'conflicte-identificador' });
    expect(poblesDeLEstat(estat).map((p) => p.slug)).toEqual([TORRE.slug]);
    // El mateix slug amb un altre nom, o el mateix nom amb un altre slug: conflicte.
    expect(() => fusionaLotDadesObertes(estat, lot({ slug: TORRE.slug, nom: 'Una altra Torre' }))).toThrow(expect.objectContaining({ code: 'conflicte-identificador' }));
    expect(() => fusionaLotDadesObertes(estat, lot({ slug: 'la-torre', nom: TORRE.nom }))).toThrow(expect.objectContaining({ code: 'conflicte-identificador' }));
  });

  test('T2-G03 · una fitxa OKF nova amb el camí d’una desada: conflicte i res escrit; moure-la de camí sí que val', () => {
    const { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot());
    const recreada = lot();
    recreada.memoriaOral[0].id = 'o-recreada';
    let error = null;
    try { fusionaLotDadesObertes(estat, recreada); } catch (e) { error = e; }
    expect(error).toMatchObject({ code: 'conflicte-identificador', message: expect.stringContaining('camí OKF') });
    expect(llegixDeLEstat(estat, { poble: TORRE }).memoriaOral.map((f) => f.id)).toEqual(['o-1']);
    // El mateix camí en un altre poble no és cap conflicte (el camí porta el slug, però es mira poble a poble).
    const deSella = lot(SELLA);
    for (const c of COLECCIONS_DEL_LOT) deSella[c].forEach((f) => { f.id = `s-${f.id}`; if (f.author_org_id) f.author_org_id = 's-org-1'; });
    deSella.memoriaOral[0].okf.cami = lot().memoriaOral[0].okf.cami;
    expect(() => fusionaLotDadesObertes(estat, deSella)).not.toThrow();
    // La mateixa fitxa (mateix id) amb un camí nou, i una altra que ocupa el camí vell, en un sol lot: el resultat final no es repetix.
    const mou = lot();
    mou.memoriaOral = [
      { ...structuredClone(mou.memoriaOral[0]), okf: { ...structuredClone(mou.memoriaOral[0].okf), cami: `memoria-oral/${TORRE.slug}/la-collita-nova.md` } },
      { ...structuredClone(mou.memoriaOral[0]), id: 'o-2' }
    ];
    const r = fusionaLotDadesObertes(estat, mou);
    expect(llegixDeLEstat(r.estat, { poble: TORRE }).memoriaOral.map((f) => [f.id, f.okf.cami])).toEqual([
      ['o-1', `memoria-oral/${TORRE.slug}/la-collita-nova.md`], ['o-2', lot().memoriaOral[0].okf.cami]
    ]);
  });

  test('clona: mutar el lot després, o el que es llig, no canvia l’estat', () => {
    const l = lot();
    const { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), l);
    l.noticies[0].title = 'Mutat després';
    l.memoriaOral[0].okf.frontmatter.title = 'Mutat després';
    const llegit = llegixDeLEstat(estat, { poble: TORRE });
    llegit.agenda[0].title = 'Mutat en llegir';
    expect(llegixDeLEstat(estat, { poble: TORRE })).toMatchObject({
      noticies: [{ title: 'Ban' }], agenda: [{ title: 'Festa' }], memoriaOral: [{ okf: { frontmatter: { title: 'La collita' } } }]
    });
  });

  test('llegixDeLEstat filtra pel poble i ordena per id; entitats, pobles i totes', () => {
    let { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot());
    const sella = lot(SELLA);
    for (const c of COLECCIONS_DEL_LOT) sella[c].forEach((f) => { f.id = `s-${f.id}`; if (f.author_org_id) f.author_org_id = 's-org-1'; });
    ({ estat } = fusionaLotDadesObertes(estat, sella));
    const z = lot(TORRE, { noticies: [{ id: 'n-0', title: 'Primera', author_org_id: 'org-1', poble_id: TORRE.slug, visibility: 'public' }] });
    ({ estat } = fusionaLotDadesObertes(estat, z));
    expect(llegixDeLEstat(estat, { poble: TORRE }).noticies.map((n) => n.id)).toEqual(['n-0', 'n-1']);
    expect(llegixDeLEstat(estat, { poble: SELLA }).memoriaOral.map((n) => n.id)).toEqual(['s-o-1']);
    expect(llegixDeLEstat(estat, { poble: { slug: 'cap', nom: 'Cap' } })).toEqual({ noticies: [], agenda: [], memoria: [], memoriaOral: [] });
    expect(entitatsDeLEstat(estat, { nom: 'Sella' }).map((f) => f.id)).toEqual(['s-org-1']);
    expect(entitatsDeLEstat(estat).map((f) => f.id)).toEqual(['org-1', 's-org-1']);
    expect(poblesDeLEstat(estat)).toEqual([TORRE, SELLA].map((p) => ({ ...p })));
    expect(totesDeLEstat(estat, 'noticies').map((n) => n.id)).toEqual(['n-0', 'n-1', 's-n-1']);
    expect(() => totesDeLEstat(estat, 'xat')).toThrow(TypeError);
  });
});

/* Gauntlet D-01/D-02 (assalt 261101) · El que el node ja té fora del magatzem
   (ocupats) i el slug únic de cada entitat. Un conflicte no escriu res. */
describe('ocupats i slugs d’entitat', () => {
  const conflicteDe = (fn) => {
    try { fn(); } catch (error) { return error; }
    return null;
  };
  /* El lot de Sella amb ids propis (cap col·lisió amb el de La Torre). */
  const deSella = () => {
    const l = lot(SELLA);
    for (const c of COLECCIONS_DEL_LOT) l[c].forEach((f) => { f.id = `s-${f.id}`; if (f.author_org_id) f.author_org_id = 's-org-1'; });
    return l;
  };

  test('D-02 · validaLotDadesObertes: dues entitats del lot amb el mateix slug', () => {
    const l = lot();
    l.entitats = [
      { ...l.entitats[0], slug: 'banda' },
      { id: 'org-2', slug: 'banda', name: 'Banda B', town_name: TORRE.nom, visibility: 'public' }
    ];
    expect(validaLotDadesObertes(l)).toEqual(['entitats: slug repetit banda']);
    l.entitats[1].slug = 'banda-2';
    expect(validaLotDadesObertes(l)).toEqual([]);
  });

  test('D-02 · el slug d’una entitat desada d’un altre poble, o del padró: conflicte i res escrit; la mateixa entitat sí', () => {
    const torre = lot();
    torre.entitats[0].slug = 'banda';
    const { estat } = fusionaLotDadesObertes(estatBuitDeDadesObertes(), torre);
    const sella = deSella();
    sella.entitats[0].slug = 'banda';
    const error = conflicteDe(() => fusionaLotDadesObertes(estat, sella));
    expect(error).toMatchObject({ code: 'conflicte-identificador', message: "El slug banda ja és d'una altra entitat." });
    expect(poblesDeLEstat(estat).map((p) => p.slug)).toEqual([TORRE.slug]);
    // La mateixa entitat (mateix id) torna amb el seu slug: igual, cap conflicte.
    expect(fusionaLotDadesObertes(estat, torre).informe.iguals.entitats).toBe(1);
    // Es mira el resultat final: si l'entitat desada canvia de slug en el mateix lot, una altra pot prendre el vell.
    const mou = lot();
    mou.entitats = [{ ...mou.entitats[0], slug: 'banda-vella' }, { id: 'org-2', slug: 'banda', name: 'Banda nova', town_name: TORRE.nom, visibility: 'public' }];
    expect(entitatsDeLEstat(fusionaLotDadesObertes(estat, mou).estat).map((f) => [f.id, f.slug])).toEqual([['org-1', 'banda-vella'], ['org-2', 'banda']]);
    // El padró: el slug d'una altra entitat (un altre id) no es pot prendre; el de la mateixa, sí.
    const padro = { slugsEntitats: new Map([['banda', 'org-del-padro']]) };
    expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), torre, { ocupats: padro }))).toMatchObject({ code: 'conflicte-identificador' });
    expect(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), torre, { ocupats: { slugsEntitats: new Map([['banda', 'org-1']]) } })).not.toThrow();
  });

  test('D-01 · un id de la base és del seu poble: el lot d’un altre poble no se’l queda; una fila sense poble no és de ningú', () => {
    const ocupats = { noticies: new Map([['n-1', TORRE.slug]]), agenda: new Map([['a-1', null]]), entitats: new Map([['org-1', TORRE.slug]]) };
    // La Torre pot tornar a portar la seua notícia i la seua entitat, però no l'acte sense poble.
    const torre = lot();
    expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), torre, { ocupats })))
      .toMatchObject({ code: 'conflicte-identificador', message: expect.stringContaining('a-1 de «agenda»') });
    torre.agenda = [];
    expect(fusionaLotDadesObertes(estatBuitDeDadesObertes(), torre, { ocupats }).informe.creats).toMatchObject({ entitats: 1, noticies: 1 });
    // Sella no es queda ni la notícia ni l'entitat de La Torre.
    for (const coleccio of ['noticies', 'entitats']) {
      const sella = deSella();
      sella.agenda = [];
      sella[coleccio][0].id = coleccio === 'noticies' ? 'n-1' : 'org-1';
      if (coleccio === 'entitats') for (const c of COLECCIONS_DADES_OBERTES) sella[c].forEach((f) => { f.author_org_id = 'org-1'; });
      expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), sella, { ocupats })), coleccio)
        .toMatchObject({ code: 'conflicte-identificador', message: expect.stringContaining(`de «${coleccio}» ja és d'un altre poble`) });
    }
  });

  test('D-01 · els pobles de la base: el mateix slug amb un altre nom, o el mateix nom amb un altre slug, és conflicte', () => {
    const ocupats = { pobles: new Map([[TORRE.slug, TORRE.nom], ['sella', 'Sella']]) };
    expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot({ slug: TORRE.slug, nom: 'Torre Falsa' }), { ocupats })))
      .toMatchObject({ code: 'conflicte-identificador', message: `El poble ${TORRE.slug} ja és en este servidor amb un altre nom.` });
    expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot({ slug: 'torre-falsa', nom: TORRE.nom }), { ocupats })))
      .toMatchObject({ code: 'conflicte-identificador', message: `Ja hi ha un altre poble amb el nom ${TORRE.nom}.` });
    expect(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot(), { ocupats })).not.toThrow();
    expect(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot({ slug: 'benillup', nom: 'Benillup' }), { ocupats })).not.toThrow();
  });

  test('V-A01 · un slug reservat de la base (null) no és de cap lot, amb cap nom; el canònic del mateix poble sí', () => {
    const ocupats = { pobles: new Map([['latorre', 'La Torre'], ['la-torre', null], ['t1', null]]) };
    for (const municipi of [{ slug: 'la-torre', nom: 'La Torre' }, { slug: 't1', nom: 'Un altre poble' }]) {
      expect(conflicteDe(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot(municipi), { ocupats })), municipi.slug)
        .toMatchObject({ code: 'conflicte-identificador', message: `El slug ${municipi.slug} ja és d'un altre poble d'este servidor.` });
    }
    expect(fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot({ slug: 'latorre', nom: 'La Torre' }), { ocupats }).informe.creats).toEqual(uns());
    // Una reserva no és cap nom: no bloqueja un poble nou amb un nom qualsevol.
    expect(() => fusionaLotDadesObertes(estatBuitDeDadesObertes(), lot({ slug: 'benillup', nom: 'Benillup' }), { ocupats })).not.toThrow();
  });
});
