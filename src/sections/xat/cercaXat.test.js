import { describe, expect, test } from 'vitest';
import * as lucide from 'lucide-react';
import { FILTRES_CERCA_XAT, classificaMissatge, cercaXat } from './cercaXat.js';

/* ── Fixtures amb la forma de mapejaFil / mapejaMissatge i del padró ── */

const JO = 'u-jo';

const fil = (id, extra = {}) => ({
  id, tipus: 'directe', name: id, title: id, altresNoms: [], entitatNom: null,
  ultimText: '', ultimAl: null, arxivat: false, ...extra
});

const msg = (id, extra = {}) => ({
  id, threadId: null, seq: 1, usuariId: 'u-altre', text: '', tipus: 'text', sender: 'other',
  creatAl: '2026-09-28T10:00:00.000Z', esborrat: false, metadades: {}, estatEnviament: 'enviat', ...extra
});

const FIL_JOSE = fil('f-jose', {
  name: 'José Pérez', title: 'José Pérez', altresNoms: ['José Pérez'],
  ultimText: 'Ens veiem al col·legi', ultimAl: '2026-09-28T09:00:00.000Z'
});
const FIL_GRUP = fil('f-grup', {
  tipus: 'grup', name: 'Comissió de festes', title: 'Comissió de festes', altresNoms: ['Pepa', 'Vicent'],
  ultimText: 'Adeu', ultimAl: '2026-09-28T11:00:00.000Z'
});
const FIL_ARXIVAT = fil('f-arx', {
  name: 'Àngela Soler', title: 'Àngela Soler', ultimText: 'Fins demà', ultimAl: '2026-09-01T08:00:00.000Z', arxivat: true
});
const FILS = [FIL_JOSE, FIL_GRUP, FIL_ARXIVAT];

const MISSATGES = {
  'f-grup': [
    msg('m1', { seq: 1, text: 'Demà sopar al COL·LEGI', creatAl: '2026-09-28T08:00:00.000Z' }),
    msg('m2', { seq: 2, text: 'Mireu https://socdepoble.org/festes', creatAl: '2026-09-28T09:30:00.000Z' }),
    msg('m3', { seq: 3, text: 'collegi esborrat', esborrat: true, creatAl: '2026-09-28T09:40:00.000Z' }),
    msg('m4', { seq: 4, tipus: 'imatge', text: 'Foto del collegi', creatAl: '2026-09-28T10:30:00.000Z' }),
    msg('m5', { seq: 5, tipus: 'sistema', text: 'collegi del sistema', metadades: { clau: 'section.xat.sistema.entra' } }),
    msg('m6', { seq: 6, text: 'Adeu', creatAl: '2026-09-28T11:00:00.000Z', sender: 'me', usuariId: JO })
  ],
  'f-jose': [
    msg('j1', { seq: 1, text: "Hola José, t'envie http://xn--pple-43d.com/entra", creatAl: '2026-09-27T12:00:00.000Z' })
  ]
};

const MEMBRES = [
  { usuari_id: JO, nom: 'Jo Mateix', fil_id: null },
  { usuari_id: 'u-jose', nom: 'José Pérez', fil_id: 'f-jose' },
  { usuari_id: 'u-josep', nom: 'Josep Martí', fil_id: null },
  { usuari_id: 'u-correu', nom: 'josep@exemple.cat', fil_id: null },
  { usuari_id: 'u-josep', nom: 'Josep Martí', fil_id: null },
  { usuari_id: 'u-anna', nom: 'Ànna Josefa', fil_id: null },
  { usuari_id: 'u-vicent', nom: 'Vicent Ferrer', fil_id: 'f-vicent' }
];

const cerca = (extra = {}) => cercaXat({ fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: JO, ...extra });
const marcat = (parts) => parts.filter((part) => part.marca).map((part) => part.text);
const idsConverses = (resultat) => resultat.converses.map(({ fil: f }) => f.id);
const idsPersones = (resultat) => resultat.persones.map(({ membre }) => membre.usuari_id);
const idsMissatges = (resultat) => resultat.missatges.map(({ missatge }) => missatge.id);

/* ── Els filtres ── */

describe('FILTRES_CERCA_XAT', () => {
  test('són els huit de la captura 19.13.56, en el mateix ordre i en valencià', () => {
    expect(FILTRES_CERCA_XAT.map((f) => f.id)).toEqual([
      'fotos', 'gif', 'enllacos', 'videos', 'documents', 'audio', 'enquestes', 'esdeveniments'
    ]);
    expect(FILTRES_CERCA_XAT.map((f) => f.etiqueta)).toEqual([
      'Fotos', 'GIF', 'Enllaços', 'Vídeos', 'Documents', 'Àudio', 'Enquestes', 'Esdeveniments'
    ]);
  });

  test('«Converses» i «Persones» són grups de resultats, no filtres', () => {
    const ids = FILTRES_CERCA_XAT.map((f) => f.id);
    expect(ids).not.toContain('converses');
    expect(ids).not.toContain('persones');
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('cada filtre porta la seua clau i18n section.xat.cerca.filtre.<id>', () => {
    for (const filtre of FILTRES_CERCA_XAT) {
      expect(filtre.clauI18n).toBe(`section.xat.cerca.filtre.${filtre.id}`);
    }
  });

  test('cada icona és un export real del lucide-react instal·lat', () => {
    for (const { icona } of FILTRES_CERCA_XAT) {
      expect(typeof icona).toBe('string');
      expect(lucide[icona], `lucide-react no exporta «${icona}»`).toBeTruthy();
    }
  });

  test('la llista i cada filtre són immutables', () => {
    expect(Object.isFrozen(FILTRES_CERCA_XAT)).toBe(true);
    for (const filtre of FILTRES_CERCA_XAT) expect(Object.isFrozen(filtre)).toBe(true);
  });
});

/* ── La classificació d'un missatge ── */

describe('classificaMissatge', () => {
  test.each([
    ['imatge', ['fotos']],
    ['video', ['videos']],
    ['nota_video', ['videos']],
    ['document', ['documents']],
    ['veu', ['audio']],
    ['enquesta', ['enquestes']],
    ['esdeveniment', ['esdeveniments']],
    ['text', []],
    ['ubicacio', []],
    ['contacte', []],
    ['adhesiu', []]
  ])('el tipus «%s» de la BD cau en %j', (tipus, esperat) => {
    expect([...classificaMissatge(msg('x', { tipus, text: 'sense enllaç' }))]).toEqual(esperat);
  });

  test('un GIF és una imatge amb metadades.mime image/gif: GIF i no Fotos', () => {
    expect([...classificaMissatge(msg('g', { tipus: 'imatge', metadades: { mime: 'image/gif' } }))]).toEqual(['gif']);
    expect([...classificaMissatge(msg('g', { tipus: 'imatge', metadades: { mime: ' IMAGE/GIF ' } }))]).toEqual(['gif']);
    expect([...classificaMissatge(msg('p', { tipus: 'imatge', metadades: { mime: 'image/png' } }))]).toEqual(['fotos']);
    /* El mime només decidix entre Fotos i GIF: un vídeo continua sent Vídeos. */
    expect([...classificaMissatge(msg('v', { tipus: 'video', metadades: { mime: 'image/gif' } }))]).toEqual(['videos']);
  });

  test('els enllaços ixen del text, de qualsevol tipus, també els sospitosos', () => {
    expect([...classificaMissatge(msg('t', { text: 'Mira https://socdepoble.org/mur.' }))]).toEqual(['enllacos']);
    expect([...classificaMissatge(msg('t', { text: 'http://xn--pple-43d.com/entra' }))]).toEqual(['enllacos']);
    expect([...classificaMissatge(msg('f', { tipus: 'imatge', text: 'Peu: https://exemple.cat' }))].sort())
      .toEqual(['enllacos', 'fotos']);
    expect(classificaMissatge(msg('t', { text: 'Sense cap adreça, ni ftp://res ni javascript:alert(1)' })).size).toBe(0);
  });

  test('un missatge esborrat o del sistema no cau en cap filtre', () => {
    expect(classificaMissatge(msg('e', { tipus: 'imatge', esborrat: true, text: 'https://a.cat' })).size).toBe(0);
    expect(classificaMissatge(msg('e', { tipus: 'imatge', esborrat: false, esborratAl: '2026-09-28T10:00:00Z' })).size).toBe(0);
    expect(classificaMissatge(msg('s', { tipus: 'sistema', text: 'https://a.cat' })).size).toBe(0);
  });

  test('una entrada que no és un missatge torna un Set buit', () => {
    for (const valor of [null, undefined, 'text', 42]) {
      const resultat = classificaMissatge(valor);
      expect(resultat).toBeInstanceOf(Set);
      expect(resultat.size).toBe(0);
    }
  });

  test('sense tipus val com a text; un tipus desconegut no fa pujar res del prototip', () => {
    expect(classificaMissatge({ text: 'https://a.cat' }).has('enllacos')).toBe(true);
    expect(classificaMissatge(msg('p', { tipus: 'constructor' })).size).toBe(0);
    expect(classificaMissatge(msg('p', { tipus: 'toString', metadades: null })).size).toBe(0);
  });
});

/* ── La cerca ── */

describe('cercaXat', () => {
  test('sense terme ni filtre no hi ha res: buit, i l\'avís local sempre hi és', () => {
    for (const resultat of [cerca(), cerca({ terme: '   ' }), cerca({ terme: ' ¿? · ' }), cercaXat(), cercaXat({})]) {
      expect(resultat.converses).toEqual([]);
      expect(resultat.persones).toEqual([]);
      expect(resultat.missatges).toEqual([]);
      expect(resultat.buit).toBe(true);
      expect(resultat.avisLocal).toBe(true);
    }
  });

  test('plega accents i majúscules als dos costats i ressalta el text original', () => {
    for (const terme of ['jose', 'JOSÉ', 'José', 'josé']) {
      const resultat = cerca({ terme });
      expect(idsConverses(resultat)).toContain('f-jose');
      const conversa = resultat.converses.find(({ fil: f }) => f.id === 'f-jose');
      expect(marcat(conversa.parts)).toEqual(['José']);
    }
    expect(idsConverses(cerca({ terme: 'PEREZ' }))).toEqual(['f-jose']);
    expect(idsConverses(cerca({ terme: 'angela' }))).toEqual(['f-arx']);
  });

  test('el punt volat no separa: «collegi» troba «col·legi» i «COL·LEGI»', () => {
    const resultat = cerca({ terme: 'collegi' });
    expect(idsMissatges(resultat)).toEqual(['m4', 'm1']);
    const m1 = resultat.missatges.find(({ missatge }) => missatge.id === 'm1');
    expect(marcat(m1.parts)).toEqual(['COL·LEGI']);
    /* L'últim missatge de la conversa de José també ho diu. */
    expect(idsConverses(resultat)).toEqual(['f-jose']);
    expect(marcat(resultat.converses[0].partsUltim)).toEqual(['col·legi']);
    expect(idsMissatges(cerca({ terme: 'col·legi' }))).toEqual(['m4', 'm1']);
  });

  test('busca a tot arreu per defecte i torna tres grups', () => {
    const resultat = cerca({ terme: 'jose' });
    expect(idsConverses(resultat)).toEqual(['f-jose']);
    /* José Pérez ja ix com a conversa; «jose» també casa amb Josep i Josefa. */
    expect(idsPersones(resultat)).toEqual(['u-anna', 'u-josep']);
    expect(marcat(resultat.persones[1].parts)).toEqual(['Jose']);
    expect(idsMissatges(resultat)).toEqual(['j1']);
    expect(marcat(resultat.missatges[0].parts)).toEqual(['José']);
    expect(resultat.missatges[0].fil).toBe(FIL_JOSE);
    expect(resultat.buit).toBe(false);
  });

  test('una conversa es troba pel nom, pels participants, per l\'entitat i per l\'últim missatge', () => {
    expect(idsConverses(cerca({ terme: 'comissio' }))).toEqual(['f-grup']);
    expect(idsConverses(cerca({ terme: 'vicent' }))).toEqual(['f-grup']);
    const perUltim = cerca({ terme: 'adeu' });
    expect(idsConverses(perUltim)).toEqual(['f-grup']);
    expect(marcat(perUltim.converses[0].parts)).toEqual([]);
    expect(marcat(perUltim.converses[0].partsUltim)).toEqual(['Adeu']);
    /* El missatge propi també es troba, al seu grup. */
    expect(idsMissatges(perUltim)).toEqual(['m6']);
    const ambEntitat = cercaXat({ terme: 'cooperativa', fils: [fil('f-ent', { name: 'Maria', entitatNom: 'Cooperativa del Poble' })] });
    expect(idsConverses(ambEntitat)).toEqual(['f-ent']);
  });

  test('lògica AND per paraula, entre tots els camps d\'una conversa', () => {
    expect(idsConverses(cerca({ terme: 'pepa adeu' }))).toEqual(['f-grup']);
    expect(idsConverses(cerca({ terme: 'pepa hola' }))).toEqual([]);
    expect(idsMissatges(cerca({ terme: 'sopar collegi' }))).toEqual(['m1']);
    expect(idsMissatges(cerca({ terme: 'sopar foto' }))).toEqual([]);
  });

  test('les persones: mai un mateix, mai un correu, una sola fila, i per nom', () => {
    expect(idsPersones(cerca({ terme: 'mateix' }))).toEqual([]);
    expect(idsPersones(cercaXat({ terme: 'mateix', membres: MEMBRES, joId: null }))).toEqual([JO]);
    expect(idsPersones(cerca({ terme: 'exemple' }))).toEqual([]);
    expect(idsPersones(cerca({ terme: 'josep' }))).toEqual(['u-josep']);
    /* L'id pot arribar com a número i el padró de la llavor com a usuariId. */
    const variants = cercaXat({
      terme: 'rosa',
      membres: [{ usuariId: 7, name: 'Rosa' }, { usuari_id: 8, nom: 'Rosa Vidal' }, { nom: 'Rosa sense id' }],
      joId: 8
    });
    expect(variants.persones.map(({ membre }) => membre.usuariId ?? membre.usuari_id)).toEqual([7]);
  });

  test('una persona que ja ix com a conversa no es repetix; la resta, sí', () => {
    const resultat = cerca({ terme: 'perez' });
    expect(idsConverses(resultat)).toEqual(['f-jose']);
    expect(idsPersones(resultat)).toEqual([]);
    /* Vicent té conversa directa (f-vicent) però no és entre els resultats: es queda. */
    expect(idsPersones(cerca({ terme: 'ferrer' }))).toEqual(['u-vicent']);
  });

  test('els missatges esborrats i els del sistema no es troben', () => {
    expect(idsMissatges(cerca({ terme: 'esborrat' }))).toEqual([]);
    expect(idsMissatges(cerca({ terme: 'sistema' }))).toEqual([]);
    const ambData = cercaXat({
      terme: 'secret',
      fils: [FIL_GRUP],
      missatgesPerFil: { 'f-grup': [msg('d', { text: 'un secret', esborratAl: '2026-09-28T10:00:00Z' })] }
    });
    expect(ambData.missatges).toEqual([]);
    expect(ambData.buit).toBe(true);
  });

  test('les converses arxivades també es troben i ho diuen', () => {
    const resultat = cerca({ terme: 'soler' });
    expect(idsConverses(resultat)).toEqual(['f-arx']);
    expect(resultat.converses[0].fil.arxivat).toBe(true);
  });

  test('un filtre sense terme llista tots els missatges carregats d\'eixe tipus', () => {
    const enllacos = cerca({ filtre: 'enllacos' });
    expect(idsMissatges(enllacos)).toEqual(['m2', 'j1']);
    expect(enllacos.converses).toEqual([]);
    expect(enllacos.persones).toEqual([]);
    expect(enllacos.buit).toBe(false);
    expect(marcat(enllacos.missatges[0].parts)).toEqual([]);
    expect(idsMissatges(cerca({ filtre: 'fotos' }))).toEqual(['m4']);
  });

  test('un filtre sense dades de veres queda buit, sense inventar res', () => {
    for (const filtre of ['gif', 'videos', 'documents', 'audio', 'enquestes', 'esdeveniments']) {
      const resultat = cerca({ filtre });
      expect(resultat.missatges).toEqual([]);
      expect(resultat.buit).toBe(true);
      expect(resultat.avisLocal).toBe(true);
    }
  });

  test('filtre i terme: la intersecció', () => {
    expect(idsMissatges(cerca({ filtre: 'enllacos', terme: 'festes' }))).toEqual(['m2']);
    expect(idsMissatges(cerca({ filtre: 'enllacos', terme: 'jose' }))).toEqual(['j1']);
    expect(idsMissatges(cerca({ filtre: 'enllacos', terme: 'collegi' }))).toEqual([]);
    expect(idsMissatges(cerca({ filtre: 'fotos', terme: 'collegi' }))).toEqual(['m4']);
    /* Amb un filtre, ni converses ni persones, encara que el nom case. */
    const ambNom = cerca({ filtre: 'enllacos', terme: 'jose' });
    expect(ambNom.converses).toEqual([]);
    expect(ambNom.persones).toEqual([]);
  });

  test('un GIF es troba al filtre GIF i no al de Fotos', () => {
    const missatgesPerFil = {
      'f-grup': [
        msg('gif', { tipus: 'imatge', metadades: { mime: 'image/gif' }, creatAl: '2026-09-28T10:00:00Z' }),
        msg('foto', { tipus: 'imatge', metadades: { mime: 'image/jpeg' }, creatAl: '2026-09-28T09:00:00Z' })
      ]
    };
    expect(idsMissatges(cercaXat({ filtre: 'gif', fils: [FIL_GRUP], missatgesPerFil }))).toEqual(['gif']);
    expect(idsMissatges(cercaXat({ filtre: 'fotos', fils: [FIL_GRUP], missatgesPerFil }))).toEqual(['foto']);
  });

  test('un filtre desconegut no filtra', () => {
    expect(cerca({ filtre: 'converses', terme: 'adeu' })).toEqual(cerca({ terme: 'adeu' }));
    expect(cerca({ filtre: 'persones' }).buit).toBe(true);
    expect(cerca({ filtre: 'constructor' }).buit).toBe(true);
  });

  test('ordre per recència: converses per l\'últim missatge i missatges per la data', () => {
    const fils = [
      fil('a', { name: 'Forn de dalt', ultimAl: '2026-09-28T10:00:00Z' }),
      fil('b', { name: 'Forn de baix', ultimAl: '2026-09-28T12:00:00Z' }),
      fil('c', { name: 'Forn vell', ultimAl: null }),
      fil('d', { name: 'Forn antic', ultimAl: '2026-09-20T12:00:00Z' })
    ];
    const missatgesPerFil = {
      a: [msg('a1', { seq: 1, text: 'forn', creatAl: '2026-09-28T08:00:00Z' })],
      b: [
        msg('b1', { seq: 1, text: 'forn', creatAl: '2026-09-28T09:00:00Z' }),
        msg('b2', { seq: 2, text: 'forn', creatAl: '2026-09-28T09:00:00Z' }),
        msg('b3', { seq: null, text: 'forn pendent', creatAl: '2026-09-28T13:00:00Z', estatEnviament: 'pendent' })
      ]
    };
    const resultat = cercaXat({ terme: 'forn', fils, missatgesPerFil });
    expect(idsConverses(resultat)).toEqual(['b', 'a', 'd', 'c']);
    /* A la mateixa hora mana el número d'ordre; un pendent (sense seq) també es troba. */
    expect(idsMissatges(resultat)).toEqual(['b3', 'b2', 'b1', 'a1']);
  });

  test('missatgesPerFil pot ser un objecte, un Map o getThreadMessages', () => {
    const perObjecte = idsMissatges(cerca({ terme: 'collegi' }));
    const perMap = idsMissatges(cerca({ terme: 'collegi', missatgesPerFil: new Map(Object.entries(MISSATGES)) }));
    const perFuncio = idsMissatges(cerca({ terme: 'collegi', missatgesPerFil: (filId) => MISSATGES[filId] }));
    expect(perMap).toEqual(perObjecte);
    expect(perFuncio).toEqual(perObjecte);
    expect(cerca({ terme: 'collegi', missatgesPerFil: null }).missatges).toEqual([]);
  });

  test('només es busca dins dels fils coneguts, i un missatge repetit compta una vegada', () => {
    const missatgesPerFil = {
      'f-grup': [msg('r1', { text: 'rovellons' }), msg('r1', { text: 'rovellons' })],
      'f-desconegut': [msg('r2', { text: 'rovellons' })]
    };
    const resultat = cercaXat({ terme: 'rovellons', fils: [FIL_GRUP, null, { name: 'sense id' }], missatgesPerFil });
    expect(idsMissatges(resultat)).toEqual(['r1']);
    expect(resultat.converses).toEqual([]);
  });

  test('l\'extracte d\'un missatge llarg s\'acosta a la coincidència i va en una línia', () => {
    const llarg = `${'paraula '.repeat(40)}\n\nal final hi ha la Tomaca de Penjar`;
    const resultat = cercaXat({ terme: 'tomaca', fils: [FIL_GRUP], missatgesPerFil: { 'f-grup': [msg('l', { text: llarg })] } });
    const [{ parts }] = resultat.missatges;
    const text = parts.map((part) => part.text).join('');
    expect(text.startsWith('…')).toBe(true);
    expect(text).not.toContain('\n');
    expect(text.length).toBeLessThanOrEqual(162);
    expect(marcat(parts)).toEqual(['Tomaca']);
  });

  /* IDEA-53 (pla 261029_1605, Bloc B) · L'extracte es mostra sense les
     marques de la negreta; la coincidència continua sobre el text cru. */
  test('la negreta: es troba igual i l’extracte no porta les marques', () => {
    const fils = [fil('f-festa', { name: 'Festes', ultimText: '**Festa** major', ultimAl: '2026-09-28T09:00:00.000Z' })];
    const missatges = { 'f-festa': [msg('n1', { text: '*Festa* major, i 2 * 3 = 6' })] };
    const resultat = cercaXat({ terme: 'festa', fils, missatgesPerFil: missatges });
    expect(resultat.missatges[0].parts).toEqual([{ text: 'Festa', marca: true }, { text: ' major, i 2 * 3 = 6', marca: false }]);
    expect(resultat.converses[0].partsUltim).toEqual([{ text: 'Festa', marca: true }, { text: ' major', marca: false }]);
  });

  /* Gauntlet del Bloc B (QA-B03) · L'extracte conserva sencera una adreça
     amb asteriscs: només es lleven les marques de fora. */
  test('QA-B03 · l’extracte conserva sencera l’adreça amb asteriscs', () => {
    const fils = [fil('f-festa', { name: 'Festes', ultimText: '**Festa** a https://example.test/?q=*x*', ultimAl: '2026-09-28T09:00:00.000Z' })];
    const missatges = { 'f-festa': [msg('n1', { text: 'Festa: https://example.test/?q=*x*' })] };
    const resultat = cercaXat({ terme: 'festa', fils, missatgesPerFil: missatges });
    expect(resultat.missatges[0].parts).toEqual([{ text: 'Festa', marca: true }, { text: ': https://example.test/?q=*x*', marca: false }]);
    expect(resultat.converses[0].partsUltim).toEqual([{ text: 'Festa', marca: true }, { text: ' a https://example.test/?q=*x*', marca: false }]);
  });

  test('no muta les entrades', () => {
    const fils = [fil('z', { name: 'Zeta', ultimAl: '2026-09-01T00:00:00Z' }), fil('y', { name: 'Zeta', ultimAl: '2026-09-02T00:00:00Z' })];
    const copia = JSON.parse(JSON.stringify(fils));
    cercaXat({ terme: 'zeta', fils });
    expect(fils).toEqual(copia);
  });
});
