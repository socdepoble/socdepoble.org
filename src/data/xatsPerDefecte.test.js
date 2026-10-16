/* Ordre del Mestre (261007) · Els xats d'ajuda per defecte (xatsPerDefecte.js):
   la regla neutra que l'adaptador de Supabase crida a loadFils i el context
   del xat torna a aplicar sense afegir. */
import { describe, expect, test, vi } from 'vitest';
import {
  ACTORS_PERMANENTS, AJUDA, AJUDA_PER_CLAU, CARA_DE_LA_IAIA, CONTACTE_HUMA, ID_FIL_DE_MOSTRA_DE_JAVI, MISSATGE_AUTOMATIC_DE_JAVI, PREFIX_PER_DEFECTE,
  ambXatsPerDefecte, caraDeLaIAIA, esIdPerDefecte, esLaIdentitatDAjuda, esLaPersonaDeContacte,
  esXatDeLaIAIA, filDeMostraDeJavi, gestionaLEntitatPilot, jaTeElXat, missatgesDeMostraDeJavi, senseLaIAIA, senseXatPerDefecte, vestixLaIAIA
} from './xatsPerDefecte.js';
import { AGENTS_IA_SEED, ENTITAT_PILOT_ID, IAIA_ID, PERSONA_PILOT } from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { PAGINES_AMB_XAT } from './contracte.js';

/* El literal de l'ordre del Mestre: el logo quadrat, a foc.
   Onada 8 (261009) · En PNG de 256x256 (requeriments, punt 1; abans, l'SVG). */
const LOGO_QUADRAT = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
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

/* Gauntlet 261016 (prompt, Bloc 3.6; pla, Onada 1.2) · «Hi ha d'haver
   permanentment 4 converses visibles». Tres són directes i viuen ací. */
/* Un compte remot qualsevol: el frontend no sap quin és el de Javi (el
   servidor no en declara cap), i per això no pot ser mai Javi. */
const UUID_HOMONIM = '5a5a5a5a-0000-4000-8000-00000000000a';
const JAVI_FOTO = '/assets/fotos/javi-llinares-perfil-1200px.jpg';

describe('Bloc 3.6 · els actors permanents', () => {
  test('Javi Llinares és la persona de contacte, amb la seua foto (mai el logo de l’entitat), i no és cap contacte d’ajuda', () => {
    expect(CONTACTE_HUMA).toEqual({ clau: 'javi', nom: 'Javi Llinares', tipus: 'persona', avatar: JAVI_FOTO });
    expect(CONTACTE_HUMA.avatar).toBe(PERSONA_PILOT.avatar);
    expect(CONTACTE_HUMA.avatar).not.toBe(LOGO_QUADRAT);
    expect(AJUDA.map((c) => c.clau)).not.toContain('javi');
    expect(ACTORS_PERMANENTS.map((c) => c.clau)).toEqual(['socdepoble', 'javi', 'iaia']);
    expect(Object.isFrozen(ACTORS_PERMANENTS) && ACTORS_PERMANENTS.every(Object.isFrozen)).toBe(true);
  });

  test('el missatge automàtic és el literal de l’ordre, amb les seues cometes', () => {
    expect(MISSATGE_AUTOMATIC_DE_JAVI).toBe('«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»');
  });

  /* Auditoria adversarial 261016 (P2, suplantació) · Derogat «en remot, pel
     nom exacte d'una persona»: en remot `altres[].nom` és profiles.full_name
     (xat_fils_meus, 2609282100_xat_de_pagina.sql), que tria i edita el mateix
     usuari, i un homònim o un impostor amb la foto pública de Javi retirava la
     fila oficial. Ara només compten l'id i els àlies del padró pilot: la prova
     d'abans fixava el forat i s'ha girat a posta. */
  test('jaTeElXat(·, javi): un directe amb Javi per id o àlies del padró pilot, mai pel nom', () => {
    expect(jaTeElXat(real({ altres: [{ id: '0001', tipus: 'persona', nom: 'Javi Llinares' }] }), 'javi')).toBe(true);
    expect(jaTeElXat(real({ altres: [{ id: 'javillinares', tipus: 'persona' }] }), 'javi')).toBe(true);
    expect(jaTeElXat(real({ altres: [{ id: UUID_HOMONIM, tipus: 'persona', nom: 'Javi Llinares', avatarUrl: JAVI_FOTO }] }), 'javi')).toBe(false);
    /* Ni un grup on és un més, ni un xat de pàgina, ni una entitat que es diga igual, ni una altra persona. */
    expect(jaTeElXat(real({ tipus: 'grup', altres: [{ id: '0001', tipus: 'persona' }] }), 'javi')).toBe(false);
    expect(jaTeElXat(real({ subjecte: { tipus: 'pagina', id: '/mur' }, altres: [{ id: '0001', tipus: 'persona' }] }), 'javi')).toBe(false);
    expect(jaTeElXat(real({ altres: [{ id: UUID_ENTITAT, tipus: 'entitat', nom: 'Javi Llinares' }] }), 'javi')).toBe(false);
    expect(jaTeElXat(real({ altres: [{ id: UUID_HOMONIM, tipus: 'persona', nom: 'Pepa' }] }), 'javi')).toBe(false);
  });

  /* Auditoria adversarial 261016 (P2) · Derogat «o el nom de la seua sessió»:
     un homònim de bona fe (o qui s'hi posa eixe nom) perdia la fila de Javi a
     la seua pròpia llista. Girada a posta, com la de dalt. */
  test('esLaPersonaDeContacte: Javi per id o àlies del padró pilot; mai pel nom de la sessió', () => {
    for (const id of PERSONA_PILOT.alies) expect(esLaPersonaDeContacte({ id })).toBe(true);
    expect(esLaPersonaDeContacte({ id: UUID_HOMONIM, nom: 'Javi Llinares' })).toBe(false);
    expect(esLaPersonaDeContacte({ id: '', nom: 'Javi Llinares' })).toBe(false);
    expect(esLaPersonaDeContacte({ id: UUID_HOMONIM, nom: 'Pepa' })).toBe(false);
    expect(esLaPersonaDeContacte({ id: 'convidat-seed', nom: null })).toBe(false);
    expect(esLaPersonaDeContacte(null)).toBe(false);
  });

  /* Auditoria adversarial 261016 (P3) · Qui no s'ha registrat i vol parlar
     amb Javi, en qualsevol mode, veu el seu xat de només lectura amb el
     missatge automàtic literal. Una sola peça per al xat de mostra del remot
     (FakeChatOnboarding) i per al convidat de la llavor i del local
     (XatContext). */
  test('filDeMostraDeJavi i missatgesDeMostraDeJavi: el nom i la foto de Javi, el literal, ja llegit i de només lectura', () => {
    expect(ID_FIL_DE_MOSTRA_DE_JAVI).toBe('fake-javi');
    const fil = filDeMostraDeJavi({ ultimAl: '2026-10-16T03:00:00.000Z', avis: 'Registra’t' });
    expect(fil).toEqual({
      id: 'fake-javi', name: 'Javi Llinares', title: 'Javi Llinares', avatar_url: JAVI_FOTO, tipus: 'persona',
      participants: [{ id: 'contacte:persona', nom: 'Javi Llinares', tipus: 'persona' }],
      ultimAl: '2026-10-16T03:00:00.000Z', noLlegits: 0, ultimSeq: 1, llegitFinsSeq: 1,
      ultimText: MISSATGE_AUTOMATIC_DE_JAVI, potEscriure: false, avisNomesLectura: 'Registra’t'
    });
    expect(filDeMostraDeJavi()).toMatchObject({ ultimAl: null, avisNomesLectura: null, potEscriure: false });
    expect(missatgesDeMostraDeJavi('2026-10-16T03:00:00.000Z')).toEqual([
      { id: 'm5', seq: 1, text: MISSATGE_AUTOMATIC_DE_JAVI, sender: 'other', author: 'Javi Llinares', is_ai: false, creatAl: '2026-10-16T03:00:00.000Z' }
    ]);
    /* No és cap fila sintètica ni cap xat de la IAIA. */
    expect(esIdPerDefecte(fil.id)).toBe(false);
    expect(esXatDeLaIAIA(fil)).toBe(false);
  });
});

describe('ambXatsPerDefecte', () => {
  /* Gauntlet 261016 (Bloc 3.6) · Abans «les dues files»: ara són tres, amb
     Javi entre Sóc de Poble i la IAIA. Les proves que fixaven dues files
     s'actualitzen a posta. */
  test('una llista buida rep les tres files a la cua, en l’ordre dels actors i amb la cara exacta', () => {
    const fils = ambXatsPerDefecte([]);
    expect(claus(fils)).toEqual(['socdepoble', 'javi', 'iaia']);
    expect(fils[0]).toEqual({
      id: `${PREFIX_PER_DEFECTE}socdepoble`, tipus: 'directe', titol: 'Sóc de Poble', altresNoms: [], altres: [],
      entitatId: null, entitatNom: null, comEntitat: false, imatgeUrl: LOGO_QUADRAT, actualitzatAl: null,
      ultimText: null, ultimAl: null, ultimAutorId: null, ultimSeq: 0, llegitFinsSeq: 0, rebutFinsSeq: 0,
      llegitPelsAltresFinsSeq: 0, noLlegits: 0, arxivatAl: null, fixatAl: null, silenciatFinsAl: null,
      preferitAl: null, noLlegitManual: false, comunitatId: null, subjecte: null, perDefecte: 'socdepoble'
    });
    expect(fils[1]).toMatchObject({ id: 'sdp-per-defecte:javi', tipus: 'directe', titol: 'Javi Llinares', imatgeUrl: JAVI_FOTO, perDefecte: 'javi', altres: [] });
    expect(fils[2]).toMatchObject({ id: 'sdp-per-defecte:iaia', titol: 'IAIA MarIA', imatgeUrl: AGENTS_IA_SEED[0].avatar_url, perDefecte: 'iaia' });
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
    expect(claus(ambXatsPerDefecte([a, b]))).toEqual(['a', 'b', 'socdepoble', 'javi', 'iaia']);
  });

  test('el missatge directe amb l’entitat (per slug o per id) treu Sóc de Poble', () => {
    const perSlug = real({ altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'socdepoble', nom: 'Sóc de Poble' }], entitatId: UUID_ENTITAT });
    expect(claus(ambXatsPerDefecte([perSlug]))).toEqual(['f-real', 'javi', 'iaia']);
    const perId = real({ altres: [{ id: ENTITAT_PILOT_ID, tipus: 'entitat', nom: 'Sóc de Poble' }] });
    expect(claus(ambXatsPerDefecte([perId]))).toEqual(['f-real', 'javi', 'iaia']);
  });

  test('Bloc 3.6 · el directe real amb Javi treu la seua fila, i només la seua', () => {
    const ambJavi = real({ id: 'j', altres: [{ id: '0001', tipus: 'persona', nom: 'Javi Llinares' }] });
    expect(claus(ambXatsPerDefecte([ambJavi]))).toEqual(['j', 'socdepoble', 'iaia']);
  });

  /* Auditoria adversarial 261016 (P2, suplantació) · Qui es posa de nom
     «Javi Llinares» i la seua foto i obri un directe ja no fa desaparéixer la
     fila oficial: les quatre converses permanents no les trenca cap camp que
     tria l'usuari. */
  test('un directe amb un homònim de Javi (un altre id, el mateix nom i la mateixa foto) no li pren la fila', () => {
    const impostor = real({ id: 'm', imatgeUrl: JAVI_FOTO, altres: [{ id: UUID_HOMONIM, tipus: 'persona', nom: 'Javi Llinares', avatarUrl: JAVI_FOTO }] });
    expect(claus(ambXatsPerDefecte([impostor]))).toEqual(['m', 'socdepoble', 'javi', 'iaia']);
    expect(claus(ambXatsPerDefecte([impostor, ...ambXatsPerDefecte([])], { afig: false }))).toEqual(['m', 'socdepoble', 'javi', 'iaia']);
  });

  /* Auditoria adversarial 261016 (P2) · En llavor i en local el xat públic de
     /iaia és un grup on la IAIA no contesta (localXat només fa respondre el
     fil 'iaia'): comentar a /iaia no ha de llevar la fila «IAIA MarIA», que hi
     porta al directe. El fil 'iaia' i un directe amb ella continuen comptant.
     Sense l'opció (el remot), com sempre. */
  test('amb paginaDeLaIAIA: false, el xat públic de /iaia no treu la fila de la IAIA; el fil de la llavor i el directe, sí', () => {
    const pagina = real({ id: 'p', tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' } });
    const local = { paginaDeLaIAIA: false };
    expect(jaTeElXat(pagina, 'iaia', local)).toBe(false);
    expect(claus(ambXatsPerDefecte([pagina], local))).toEqual(['p', 'socdepoble', 'javi', 'iaia']);
    expect(claus(ambXatsPerDefecte([...ambXatsPerDefecte([]), pagina], { ...local, afig: false }))).toEqual(['p', 'socdepoble', 'javi', 'iaia']);
    expect(claus(ambXatsPerDefecte([real({ tipus: 'iaia' })], local))).toEqual(['f-real', 'socdepoble', 'javi']);
    expect(claus(ambXatsPerDefecte([real({ altres: [{ id: IAIA_ID, tipus: 'ia' }] })], local))).toEqual(['f-real', 'socdepoble', 'javi']);
    expect(jaTeElXat(pagina, 'iaia')).toBe(true);
    expect(claus(ambXatsPerDefecte([pagina]))).toEqual(['p', 'socdepoble', 'javi']);
  });

  test('entitatId de l’entitat pilot sense subjecte compta; la COMUNITAT de l’entitat (amb subjecte) no', () => {
    expect(claus(ambXatsPerDefecte([real({ tipus: 'entitat', entitatId: ENTITAT_PILOT_ID })]))).toEqual(['f-real', 'javi', 'iaia']);
    const subjecte = { tipus: 'entitat', id: UUID_ENTITAT, ruta: '/empresa/socdepoble', titol: 'Sóc de Poble' };
    const comunitat = [
      real({ id: 'c', tipus: 'comunitat', subjecte, entitatId: UUID_ENTITAT }),
      real({ id: 'av', tipus: 'canal', subjecte, comunitatId: 'c', altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'socdepoble' }] }),
      real({ id: 'g', tipus: 'grup', subjecte, comunitatId: 'c', entitatId: ENTITAT_PILOT_ID })
    ];
    expect(claus(ambXatsPerDefecte(comunitat))).toEqual(['c', 'av', 'g', 'socdepoble', 'javi', 'iaia']);
  });

  test('una altra entitat, o una persona que es diu «Sóc de Poble», no compten (mai pel nom)', () => {
    const altra = real({ altres: [{ id: UUID_ENTITAT, tipus: 'entitat', slug: 'cooperativa', nom: 'Sóc de Poble' }] });
    const persona = real({ id: 'p', altres: [{ id: 'socdepoble', tipus: 'persona', nom: 'Sóc de Poble' }] });
    expect(claus(ambXatsPerDefecte([altra, persona]))).toEqual(['f-real', 'p', 'socdepoble', 'javi', 'iaia']);
  });

  test('el fil de la llavor, la IAIA entre els altres o el xat públic de /iaia o /ia treuen la IAIA', () => {
    const casos = [
      real({ tipus: 'iaia' }),
      real({ altres: [{ id: IAIA_ID, tipus: 'ia', nom: 'IAIA MarIA' }] }),
      real({ tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' } }),
      real({ tipus: 'grup', subjecte: { tipus: 'pagina', id: '/ia', ruta: '/ia' } })
    ];
    for (const fil of casos) expect(claus(ambXatsPerDefecte([fil]))).toEqual(['f-real', 'socdepoble', 'javi']);
    /* Una altra pàgina no és el xat de la IAIA. */
    expect(claus(ambXatsPerDefecte([real({ subjecte: { tipus: 'pagina', id: '/mur' } })]))).toEqual(['f-real', 'socdepoble', 'javi', 'iaia']);
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

  test('idempotent: dos passades donen la MATEIXA referència, i amb les tres reals també', () => {
    const una = ambXatsPerDefecte([real()]);
    expect(ambXatsPerDefecte(una)).toBe(una);
    const totes = [real({ tipus: 'iaia', id: 'i' }), real({ entitatId: ENTITAT_PILOT_ID }), real({ id: 'j', altres: [{ id: '0001', tipus: 'persona' }] })];
    expect(ambXatsPerDefecte(totes)).toBe(totes);
  });

  test('quan arriba la conversa real, la fila sintètica se’n va', () => {
    const abans = ambXatsPerDefecte([]);
    const despres = ambXatsPerDefecte([real({ tipus: 'iaia', id: 'i' }), ...abans]);
    expect(claus(despres)).toEqual(['i', 'socdepoble', 'javi']);
    /* Les sintètiques que es queden són les mateixes (ni es dupliquen ni es refan). */
    expect(despres[1]).toBe(abans[0]);
    expect(despres[2]).toBe(abans[1]);
  });

  test('amb afig: false només lleva, mai afig', () => {
    const fils = [real()];
    expect(ambXatsPerDefecte(fils, { afig: false })).toBe(fils);
    const ambSintetiques = ambXatsPerDefecte([]);
    const visitant = real({ id: 'v', tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia' } });
    expect(claus(ambXatsPerDefecte([...ambSintetiques, visitant], { afig: false }))).toEqual(['v', 'socdepoble', 'javi']);
  });

  test('una entrada que no és una llista es tracta com a buida', () => {
    expect(claus(ambXatsPerDefecte(null))).toEqual(['socdepoble', 'javi', 'iaia']);
    expect(ambXatsPerDefecte(undefined, { afig: false })).toEqual([]);
  });
});

describe('jaTeElXat i esLaIdentitatDAjuda', () => {
  test('una fila sintètica no és mai el xat real de res', () => {
    for (const fil of ambXatsPerDefecte([])) {
      expect(jaTeElXat(fil, 'socdepoble')).toBe(false);
      expect(jaTeElXat(fil, 'javi')).toBe(false);
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
    expect(claus(senseXatPerDefecte(fils, 'socdepoble'))).toEqual(['f-real', 'javi', 'iaia']);
    expect(claus(senseXatPerDefecte(fils, 'javi'))).toEqual(['f-real', 'socdepoble', 'iaia']);
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
    const fila = ambXatsPerDefecte([]).find((f) => f.perDefecte === 'iaia');
    expect(vestixLaIAIA(fila)).toBe(fila);
    expect(vestixLaIAIA(null)).toBeNull();
  });
});

describe('tasca 12 · amb el nivell d’IA a 0 la IAIA no apareix', () => {
  test('esXatDeLaIAIA: la fila per defecte, la llavor, el directe i el xat de /iaia; no un grup on és una més', () => {
    const [sdp, javi, iaia] = ambXatsPerDefecte([]);
    expect(esXatDeLaIAIA(iaia)).toBe(true);
    expect(esXatDeLaIAIA(sdp)).toBe(false);
    expect(esXatDeLaIAIA(javi)).toBe(false);
    expect(esXatDeLaIAIA(real({ tipus: 'iaia' }))).toBe(true);
    expect(esXatDeLaIAIA(real({ altres: [{ id: IAIA_ID, tipus: 'ia' }] }))).toBe(true);
    expect(esXatDeLaIAIA(real({ tipus: 'grup', subjecte: PAGINA_IAIA }))).toBe(true);
    expect(esXatDeLaIAIA(real({ tipus: 'grup', altres: [{ id: IAIA_ID, tipus: 'ia' }] }))).toBe(false);
    expect(esXatDeLaIAIA(real())).toBe(false);
    expect(esXatDeLaIAIA(null)).toBe(false);
  });

  test('senseLaIAIA lleva totes les seues files i, si no n’hi ha cap, torna la mateixa referència', () => {
    const fils = [real({ id: 'a' }), real({ id: 'i', tipus: 'iaia' }), real({ id: 'p', tipus: 'grup', subjecte: PAGINA_IAIA }), ...ambXatsPerDefecte([])];
    expect(claus(senseLaIAIA(fils))).toEqual(['a', 'socdepoble', 'javi']);
    const sense = [real({ id: 'a' })];
    expect(senseLaIAIA(sense)).toBe(sense);
    expect(senseLaIAIA(null)).toBeNull();
  });
});
