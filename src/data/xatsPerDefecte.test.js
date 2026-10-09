/* Ordre del Mestre (261007) · Els xats d'ajuda per defecte (xatsPerDefecte.js):
   la regla neutra que l'adaptador de Supabase crida a loadFils i el context
   del xat torna a aplicar sense afegir. */
import { describe, expect, test, vi } from 'vitest';
import {
  AJUDA, AJUDA_PER_CLAU, CARA_DE_LA_IAIA, PREFIX_PER_DEFECTE, ambXatsPerDefecte, caraDeLaIAIA, esIdPerDefecte, esLaIdentitatDAjuda,
  esXatDeLaIAIA, gestionaLEntitatPilot, jaTeElXat, senseLaIAIA, senseXatPerDefecte, vestixLaIAIA
} from './xatsPerDefecte.js';
import { AGENTS_IA_SEED, ENTITAT_PILOT_ID, IAIA_ID } from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { PAGINES_AMB_XAT } from './contracte.js';

/* El literal de l'ordre del Mestre: el logo quadrat, a foc. */
const LOGO_QUADRAT = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* El mateix patró que l'adaptador (supabase/xat.js, W4-10). */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_ENTITAT = '7d1e5c2a-0000-4000-8000-0000000000aa';

const real = (extra = {}) => ({ id: 'f-real', tipus: 'directe', altres: [], subjecte: null, entitatId: null, ultimSeq: 3, ...extra });
const claus = (llista) => llista.map((c) => c.perDefecte ?? c.id);

describe('AJUDA, la font única dels dos contactes', () => {
  test('Sóc de Poble porta el logo quadrat que ha fixat el Mestre; la IAIA, la cara del padró', () => {
    expect(AJUDA.map((c) => [c.clau, c.nom, c.tipus])).toEqual([
      ['socdepoble', 'Sóc de Poble', 'entitat'],
      ['iaia', 'IAIA MarIA', 'ia']
    ]);
    expect(AJUDA_PER_CLAU.socdepoble.avatar).toBe(LOGO_QUADRAT);
    expect(AJUDA_PER_CLAU.iaia.avatar).toBe(AGENTS_IA_SEED[0].avatar_url);
    expect(Object.isFrozen(AJUDA) && AJUDA.every(Object.isFrozen)).toBe(true);
  });
});

describe('ambXatsPerDefecte', () => {
  test('una llista buida rep les dues files a la cua, en l’ordre d’AJUDA i amb la cara exacta', () => {
    const fils = ambXatsPerDefecte([]);
    expect(claus(fils)).toEqual(['socdepoble', 'iaia']);
    expect(fils[0]).toEqual({
      id: `${PREFIX_PER_DEFECTE}socdepoble`, tipus: 'directe', titol: 'Sóc de Poble', altresNoms: [], altres: [],
      entitatId: null, entitatNom: null, comEntitat: false, imatgeUrl: LOGO_QUADRAT, actualitzatAl: null,
      ultimText: null, ultimAl: null, ultimAutorId: null, ultimSeq: 0, llegitFinsSeq: 0, rebutFinsSeq: 0,
      llegitPelsAltresFinsSeq: 0, noLlegits: 0, arxivatAl: null, fixatAl: null, silenciatFinsAl: null,
      preferitAl: null, noLlegitManual: false, comunitatId: null, subjecte: null, perDefecte: 'socdepoble'
    });
    expect(fils[1]).toMatchObject({ id: 'sdp-per-defecte:iaia', titol: 'IAIA MarIA', imatgeUrl: AGENTS_IA_SEED[0].avatar_url, perDefecte: 'iaia' });
    /* Ni rol, ni participants, ni participant: no és cap fil del servidor. */
    for (const fil of fils) for (const clau of ['rol', 'participants', 'participant']) expect(fil).not.toHaveProperty(clau);
  });

  test('cap id sintètic passa el RE_UUID de l’adaptador i tots porten el prefix', () => {
    for (const fil of ambXatsPerDefecte([])) {
      expect(RE_UUID.test(fil.id)).toBe(false);
      expect(esIdPerDefecte(fil.id)).toBe(true);
    }
    expect(esIdPerDefecte(UUID_ENTITAT)).toBe(false);
    expect(esIdPerDefecte(null)).toBe(false);
  });

  test('les files reals conserven l’ordre i les sintètiques van darrere', () => {
    const a = real({ id: 'a' });
    const b = real({ id: 'b' });
    expect(claus(ambXatsPerDefecte([a, b]))).toEqual(['a', 'b', 'socdepoble', 'iaia']);
  });

  test('el missatge directe amb l’entitat (per slug o per id) treu Sóc de Poble', () => {
    const perSlug = real({ altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'socdepoble', nom: 'Sóc de Poble' }], entitatId: UUID_ENTITAT });
    expect(claus(ambXatsPerDefecte([perSlug]))).toEqual(['f-real', 'iaia']);
    const perId = real({ altres: [{ id: ENTITAT_PILOT_ID, tipus: 'entitat', nom: 'Sóc de Poble' }] });
    expect(claus(ambXatsPerDefecte([perId]))).toEqual(['f-real', 'iaia']);
  });

  test('entitatId de l’entitat pilot sense subjecte compta; la COMUNITAT de l’entitat (amb subjecte) no', () => {
    expect(claus(ambXatsPerDefecte([real({ tipus: 'entitat', entitatId: ENTITAT_PILOT_ID })]))).toEqual(['f-real', 'iaia']);
    const subjecte = { tipus: 'entitat', id: UUID_ENTITAT, ruta: '/empresa/socdepoble', titol: 'Sóc de Poble' };
    const comunitat = [
      real({ id: 'c', tipus: 'comunitat', subjecte, entitatId: UUID_ENTITAT }),
      real({ id: 'av', tipus: 'canal', subjecte, comunitatId: 'c', altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'socdepoble' }] }),
      real({ id: 'g', tipus: 'grup', subjecte, comunitatId: 'c', entitatId: ENTITAT_PILOT_ID })
    ];
    expect(claus(ambXatsPerDefecte(comunitat))).toEqual(['c', 'av', 'g', 'socdepoble', 'iaia']);
  });

  test('una altra entitat, o una persona que es diu «Sóc de Poble», no compten (mai pel nom)', () => {
    const altra = real({ altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'cooperativa', nom: 'Sóc de Poble' }] });
    const persona = real({ id: 'p', altres: [{ id: 'socdepoble', tipus: 'persona', nom: 'Sóc de Poble' }] });
    expect(claus(ambXatsPerDefecte([altra, persona]))).toEqual(['f-real', 'p', 'socdepoble', 'iaia']);
  });

  test('el fil de la llavor, la IAIA entre els altres o el xat públic de /iaia o /ia treuen la IAIA', () => {
    const casos = [
      real({ tipus: 'iaia' }),
      real({ altres: [{ id: IAIA_ID, tipus: 'ia', nom: 'IAIA MarIA' }] }),
      real({ tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' } }),
      real({ tipus: 'grup', subjecte: { tipus: 'pagina', id: '/ia', ruta: '/ia' } })
    ];
    for (const fil of casos) expect(claus(ambXatsPerDefecte([fil]))).toEqual(['f-real', 'socdepoble']);
    /* Una altra pàgina no és el xat de la IAIA. */
    expect(claus(ambXatsPerDefecte([real({ subjecte: { tipus: 'pagina', id: '/mur' } })]))).toEqual(['f-real', 'socdepoble', 'iaia']);
  });

  /* Auditoria 261007 (B) · La clau de la pàgina de la IAIA es valida contra
     la llista tancada del contracte. La primera prova fixa que el contracte
     la porta; la segona, que la regla en depén de veres: amb un contracte
     sense '/iaia', cap fil de pàgina no és el xat de la IAIA. */
  test('la pàgina de la IAIA és a la llista tancada de pàgines amb xat del contracte', () => {
    expect(Object.hasOwn(PAGINES_AMB_XAT, '/iaia')).toBe(true);
  });

  test('si el contracte retira /iaia de PAGINES_AMB_XAT, el xat públic de /iaia o /ia ja no treu la IAIA', async () => {
    vi.resetModules();
    vi.doMock('./contracte.js', async (importOriginal) => ({ ...(await importOriginal()), PAGINES_AMB_XAT: {} }));
    try {
      const { jaTeElXat: jaTeElXatSenseLaPagina } = await import('./xatsPerDefecte.js');
      for (const id of ['/iaia', '/ia']) {
        expect(jaTeElXatSenseLaPagina({ tipus: 'grup', subjecte: { tipus: 'pagina', id } }, 'iaia')).toBe(false);
      }
      /* Els altres camins no depenen de la llista. */
      expect(jaTeElXatSenseLaPagina({ tipus: 'iaia' }, 'iaia')).toBe(true);
    } finally {
      vi.doUnmock('./contracte.js');
      vi.resetModules();
    }
  });

  test('idempotent: dos passades donen la MATEIXA referència, i amb les dues reals també', () => {
    const una = ambXatsPerDefecte([real()]);
    expect(ambXatsPerDefecte(una)).toBe(una);
    const totes = [real({ tipus: 'iaia', id: 'i' }), real({ entitatId: ENTITAT_PILOT_ID })];
    expect(ambXatsPerDefecte(totes)).toBe(totes);
  });

  test('quan arriba la conversa real, la fila sintètica se’n va', () => {
    const abans = ambXatsPerDefecte([]);
    const despres = ambXatsPerDefecte([real({ tipus: 'iaia', id: 'i' }), ...abans]);
    expect(claus(despres)).toEqual(['i', 'socdepoble']);
    /* La sintètica que es queda és la mateixa (ni es duplica ni es refà). */
    expect(despres[1]).toBe(abans[0]);
  });

  test('amb afig: false només lleva, mai afig', () => {
    const fils = [real()];
    expect(ambXatsPerDefecte(fils, { afig: false })).toBe(fils);
    const ambSintetiques = ambXatsPerDefecte([]);
    const visitant = real({ id: 'v', tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia' } });
    expect(claus(ambXatsPerDefecte([...ambSintetiques, visitant], { afig: false }))).toEqual(['v', 'socdepoble']);
  });

  test('una entrada que no és una llista es tracta com a buida', () => {
    expect(claus(ambXatsPerDefecte(null))).toEqual(['socdepoble', 'iaia']);
    expect(ambXatsPerDefecte(undefined, { afig: false })).toEqual([]);
  });
});

describe('jaTeElXat i esLaIdentitatDAjuda', () => {
  test('una fila sintètica no és mai el xat real de res', () => {
    for (const fil of ambXatsPerDefecte([])) {
      expect(jaTeElXat(fil, 'socdepoble')).toBe(false);
      expect(jaTeElXat(fil, 'iaia')).toBe(false);
    }
    expect(jaTeElXat(null, 'iaia')).toBe(false);
    expect(jaTeElXat(real({ tipus: 'iaia' }), 'una-altra')).toBe(false);
  });

  test('reconeix les files del padró per id o slug (usuari_id, usuariId o id)', () => {
    expect(esLaIdentitatDAjuda({ usuari_id: ENTITAT_PILOT_ID, tipus: 'entitat' }, 'socdepoble')).toBe(true);
    expect(esLaIdentitatDAjuda({ usuari_id: UUID_ENTITAT, tipus: 'entitat', slug: 'socdepoble' }, 'socdepoble')).toBe(true);
    expect(esLaIdentitatDAjuda({ usuari_id: UUID_ENTITAT, tipus: 'entitat', nom: 'Sóc de Poble' }, 'socdepoble')).toBe(false);
    expect(esLaIdentitatDAjuda({ usuariId: IAIA_ID, tipus: 'ia' }, 'iaia')).toBe(true);
    expect(esLaIdentitatDAjuda({ id: 'iaia', tipus: 'ia', nom: 'IAIA MarIA' }, 'iaia')).toBe(false);
    expect(esLaIdentitatDAjuda(null, 'iaia')).toBe(false);
  });
});

describe('senseXatPerDefecte i gestionaLEntitatPilot', () => {
  test('lleva només la clau demanada i, si no n’hi ha, torna la mateixa referència', () => {
    const fils = ambXatsPerDefecte([real()]);
    expect(claus(senseXatPerDefecte(fils, 'socdepoble'))).toEqual(['f-real', 'iaia']);
    const sense = [real()];
    expect(senseXatPerDefecte(sense, 'socdepoble')).toBe(sense);
  });

  test('només qui és propietària o administradora de l’entitat pilot (per slug o per id) la gestiona', () => {
    const entitat = (extra) => ({ tipus: 'entitat', id: UUID_ENTITAT, slug: 'socdepoble', rol: 'owner', ...extra });
    expect(gestionaLEntitatPilot([{ tipus: 'persona', id: 'A', rol: 'persona' }, entitat()])).toBe(true);
    expect(gestionaLEntitatPilot([entitat({ rol: 'admin' })])).toBe(true);
    expect(gestionaLEntitatPilot([entitat({ slug: null, id: ENTITAT_PILOT_ID })])).toBe(true);
    expect(gestionaLEntitatPilot([entitat({ rol: 'member' })])).toBe(false);
    expect(gestionaLEntitatPilot([entitat({ slug: 'cooperativa' })])).toBe(false);
    expect(gestionaLEntitatPilot([{ tipus: 'persona', id: ENTITAT_PILOT_ID, slug: 'socdepoble', rol: 'owner' }])).toBe(false);
    expect(gestionaLEntitatPilot(undefined)).toBe(false);
  });
});

/* Onada 6 · Tasca 12 del pla 261009_0245: «Canviar el nom del xat de "L'ànima
   de la iaia" per "IAIA MarIA". Crear-li un avatar propi retallant la cara
   d'una de les iaies amb mòbil de la il·lustració "Festa del Poble". Si el
   nivell d'IA és 0 (apagada), la IAIA no hauria d'aparéixer al llistat de xats.» */
const PAGINA_IAIA = { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" };

describe('tasca 12 · la cara de la IAIA', () => {
  test('el seu avatar del padró es pinta amb la cara retallada de «Festa del Poble»; cap altra font', () => {
    expect(CARA_DE_LA_IAIA).toEqual({ src: '/assets/uploads/brain/xat_portada.jpg', enquadrament: 'iaia' });
    expect(Object.isFrozen(CARA_DE_LA_IAIA)).toBe(true);
    expect(caraDeLaIAIA(AJUDA_PER_CLAU.iaia.avatar)).toBe(CARA_DE_LA_IAIA);
    expect(caraDeLaIAIA(AGENTS_MAP.IAIA.avatar_url)).toBe(CARA_DE_LA_IAIA);
    expect(caraDeLaIAIA(` ${AGENTS_MAP.IAIA.avatar_url} `)).toBe(CARA_DE_LA_IAIA);
    for (const altra of [AJUDA_PER_CLAU.socdepoble.avatar, '/assets/fotos/iaia-maria.png', CARA_DE_LA_IAIA.src, '', null, undefined, 7]) {
      expect(caraDeLaIAIA(altra)).toBeNull();
    }
  });
});

describe('tasca 12 · el xat de la IAIA es diu «IAIA MarIA»', () => {
  test('el xat públic de /iaia (el que obri la fila en remot) porta el nom i la cara d’AJUDA; el subjecte no es toca', () => {
    const fil = real({ id: 'p-iaia', tipus: 'grup', titol: "L'ànima de la iaia", imatgeUrl: null, subjecte: PAGINA_IAIA });
    const vestit = vestixLaIAIA(fil);
    expect(vestit).not.toBe(fil);
    expect(vestit).toEqual({ ...fil, titol: 'IAIA MarIA', imatgeUrl: AJUDA_PER_CLAU.iaia.avatar });
    expect(vestit.subjecte).toBe(fil.subjecte);
    expect(fil.titol).toBe("L'ànima de la iaia");
    /* La clau antiga de la llista del servidor, també. */
    expect(vestixLaIAIA(real({ tipus: 'grup', titol: 'x', subjecte: { tipus: 'pagina', id: '/ia' } })).titol).toBe('IAIA MarIA');
  });

  test('el fil de la llavor i un directe amb ella també; ja vestit, la mateixa referència', () => {
    expect(vestixLaIAIA(real({ tipus: 'iaia', titol: null })).titol).toBe('IAIA MarIA');
    expect(vestixLaIAIA(real({ altres: [{ id: IAIA_ID, tipus: 'ia' }] })).imatgeUrl).toBe(AJUDA_PER_CLAU.iaia.avatar);
    const vestit = vestixLaIAIA(real({ tipus: 'iaia' }));
    expect(vestixLaIAIA(vestit)).toBe(vestit);
  });

  test('una altra conversa, un grup on la IAIA és una més, la fila per defecte i null no canvien', () => {
    const altra = real({ titol: 'Pepa' });
    expect(vestixLaIAIA(altra)).toBe(altra);
    const grup = real({ tipus: 'grup', titol: 'Colla', altres: [{ id: IAIA_ID, tipus: 'ia' }] });
    expect(vestixLaIAIA(grup)).toBe(grup);
    const mur = real({ tipus: 'grup', titol: 'Mur', subjecte: { tipus: 'pagina', id: '/mur' } });
    expect(vestixLaIAIA(mur)).toBe(mur);
    const [, fila] = ambXatsPerDefecte([]);
    expect(vestixLaIAIA(fila)).toBe(fila);
    expect(vestixLaIAIA(null)).toBeNull();
  });
});

describe('tasca 12 · amb el nivell d’IA a 0 la IAIA no apareix', () => {
  test('esXatDeLaIAIA: la fila per defecte, la llavor, el directe i el xat de /iaia; no un grup on és una més', () => {
    const [sdp, iaia] = ambXatsPerDefecte([]);
    expect(esXatDeLaIAIA(iaia)).toBe(true);
    expect(esXatDeLaIAIA(sdp)).toBe(false);
    expect(esXatDeLaIAIA(real({ tipus: 'iaia' }))).toBe(true);
    expect(esXatDeLaIAIA(real({ altres: [{ id: IAIA_ID, tipus: 'ia' }] }))).toBe(true);
    expect(esXatDeLaIAIA(real({ tipus: 'grup', subjecte: PAGINA_IAIA }))).toBe(true);
    expect(esXatDeLaIAIA(real({ tipus: 'grup', altres: [{ id: IAIA_ID, tipus: 'ia' }] }))).toBe(false);
    expect(esXatDeLaIAIA(real())).toBe(false);
    expect(esXatDeLaIAIA(null)).toBe(false);
  });

  test('senseLaIAIA lleva totes les seues files i, si no n’hi ha cap, torna la mateixa referència', () => {
    const fils = [real({ id: 'a' }), real({ id: 'i', tipus: 'iaia' }), real({ id: 'p', tipus: 'grup', subjecte: PAGINA_IAIA }), ...ambXatsPerDefecte([])];
    expect(claus(senseLaIAIA(fils))).toEqual(['a', 'socdepoble']);
    const sense = [real({ id: 'a' })];
    expect(senseLaIAIA(sense)).toBe(sense);
    expect(senseLaIAIA(null)).toBeNull();
  });
});
