import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localXat, reiniciaLocalXat } from './localXat.js';
import { XAT_SEED_IDS } from './xatSeed.js';
import { ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG } from './identitatsSeed.js';
import { createLocalPerfilsAdapter } from './localPerfils.js';
import { objecteDePerfil } from '../config/navigation.js';
import { rutaXatDePagina } from '../config/objecteConnectable.js';

/* T63.2 i T67 · El magatzem local del Xat: fils de pàgina i comunitats.
   La sessió es controla des d'ací: amb sessió, qui mira és propietari de
   l'entitat pilot (regla del mode seed); sense, és el convidat. */
const mock = vi.hoisted(() => ({ user: { id: 'jo-A' } }));
vi.mock('./identitat.js', () => ({ usuariDeSessio: () => mock.user, getDefaultUserId: () => 'convidat-seed' }));

const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
const LOCAL = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
const PUBLICACIO = { tipus: 'publicacio', id: 'p-1', titol: 'Festa de la tomaca', ruta: '/mur/p-1', seccio: 'mur', autor: null };

beforeEach(() => { reiniciaLocalXat(); mock.user = { id: 'jo-A' }; });

describe('obriFilDePagina · grup d’un element', () => {
  it('crea un grup amb el subjecte de la pàgina, hi entra qui l’obri i és idempotent', async () => {
    const obert = await localXat.obriFilDePagina(PUBLICACIO, LOCAL);
    expect(obert.fils).toHaveLength(1);
    const [grup] = obert.fils;
    expect(obert.filId).toBe(grup.id);
    expect(grup).toMatchObject({
      tipus: 'grup', titol: 'Festa de la tomaca', comunitatId: null, participant: true, rol: 'membre', participants: 1,
      subjecte: { tipus: 'publicacio', id: 'p-1', ruta: '/mur/p-1', titol: 'Festa de la tomaca' },
      altres: [], altresNoms: [], ultimSeq: 0, noLlegits: 0
    });
    /* Tornar a obrir-lo, fins i tot amb un altre títol, porta al mateix fil. */
    const altra = await localXat.obriFilDePagina({ ...PUBLICACIO, titol: 'Un altre títol' }, LOCAL);
    expect(altra.filId).toBe(obert.filId);
    expect(altra.fils[0].titol).toBe('Festa de la tomaca');
    const fils = await localXat.loadFils(LOCAL);
    expect(fils.map((f) => f.id)).toEqual([obert.filId]);
    /* Cap missatge de sistema, com al servidor: el grup naix buit i s'hi pot escriure. */
    expect(await localXat.loadMissatges(obert.filId, LOCAL)).toEqual([]);
    const meu = await localXat.enviaMissatge(obert.filId, { id: 'm-1', text: 'Jo porte la llenya' }, LOCAL);
    expect(meu).toMatchObject({ seq: 1, usuariId: 'jo-A', comOrgId: null, autorNom: null });
  });

  it('una pàgina sense id propi té xat només si és de la llista tancada, amb el títol de la llista', async () => {
    const obert = await localXat.obriFilDePagina({ tipus: 'pagina', id: '/constitucio', ruta: '/constitucio', titol: 'Avís oficial' }, LOCAL);
    expect(obert.fils[0]).toMatchObject({
      tipus: 'grup', titol: 'Constitució', subjecte: { tipus: 'pagina', id: '/constitucio', ruta: '/constitucio', titol: 'Constitució' }
    });
    expect(await localXat.obriFilDePagina({ tipus: 'pagina', id: 'Constitució', ruta: '', titol: 'Constitució' }, LOCAL)).toBeNull();
    /* Una nota, una persona, una vista pròpia o una ruta inventada: cap fil. */
    for (const ruta of ['/notes/n-1', '/gent/0001', '/xat/f1', '/a1']) {
      expect(await localXat.obriFilDePagina({ tipus: 'pagina', id: ruta, ruta, titol: 'Avís oficial' }, LOCAL), ruta).toBeNull();
    }
    expect((await localXat.loadFils(LOCAL)).map((f) => f.id)).toEqual([obert.filId]);
  });

  it('la ruta del subjecte és la canònica, no la del client, com al servidor', async () => {
    const obert = await localXat.obriFilDePagina({ ...PUBLICACIO, ruta: '/notes/n-1' }, LOCAL);
    expect(obert.fils[0].subjecte).toMatchObject({ tipus: 'publicacio', id: 'p-1', ruta: '/mur/p-1' });
    const rar = await localXat.obriFilDePagina({ tipus: 'producte', id: 'a b', ruta: '/mercat/a' }, LOCAL);
    expect(rar.fils[0].subjecte).toMatchObject({ id: 'a b', ruta: null });
  });

  it('els subjectes sense xat tornen null i no creen res', async () => {
    for (const objecte of [
      { tipus: 'nota', id: 'n-1' }, { tipus: 'carpeta', id: 'c' }, { tipus: 'categoria', id: 'c' }, { tipus: 'etiqueta', id: 'e' },
      { tipus: 'persona', id: '0001' }, { tipus: 'ia', id: XAT_SEED_IDS.iaia }, { tipus: 'publicacio', id: '' }, null
    ]) {
      expect(await localXat.obriFilDePagina(objecte, LOCAL)).toBeNull();
    }
    expect(await localXat.loadFils(LOCAL)).toEqual([]);
  });
});

describe('obriFilDePagina · comunitat (T67)', () => {
  it('un poble naix com a comunitat amb Avisos i General; torna General i qui l’obri entra als tres', async () => {
    const obert = await localXat.obriFilDePagina({ tipus: 'poble', id: 'la-torre', titol: 'La Torre de les Maçanes', ruta: '/pobles/la-torre' }, LOCAL);
    const [comunitat, avisos, general] = obert.fils;
    expect(obert.filId).toBe(general.id);
    const subjecte = { tipus: 'poble', id: 'la-torre', ruta: '/pobles/la-torre', titol: 'La Torre de les Maçanes' };
    expect(comunitat).toMatchObject({ tipus: 'comunitat', titol: 'La Torre de les Maçanes', comunitatId: null, subjecte, ultimSeq: 0 });
    expect(avisos).toMatchObject({ tipus: 'canal', titol: 'Avisos', comunitatId: comunitat.id, subjecte, rol: 'membre' });
    expect(general).toMatchObject({ tipus: 'grup', titol: 'General', comunitatId: comunitat.id, subjecte, participant: true });
    expect((await localXat.loadFils(LOCAL)).map((f) => f.id).sort()).toEqual([comunitat.id, avisos.id, general.id].sort());
    /* Idempotent: la mateixa comunitat i els mateixos fills. */
    const altra = await localXat.obriFilDePagina({ tipus: 'poble', id: 'la-torre' }, LOCAL);
    expect(altra.fils.map((f) => f.id)).toEqual([comunitat.id, avisos.id, general.id]);
  });

  it('la comunitat no té missatges propis i als Avisos d’un poble sense administració no hi escriu ningú', async () => {
    const { fils: [comunitat, avisos, general] } = await localXat.obriFilDePagina({ tipus: 'poble', id: 'la-torre' }, LOCAL);
    await expect(localXat.enviaMissatge(comunitat.id, { id: 'x-1', text: 'Hola' }, LOCAL))
      .rejects.toMatchObject({ code: 'SDP-XAT-011', message: expect.stringMatching(/^SDP-XAT-011: la comunitat no té missatges propis/) });
    await expect(localXat.enviaMissatge(avisos.id, { id: 'x-2', text: 'Avís' }, LOCAL))
      .rejects.toMatchObject({ code: 'SDP-XAT-011', message: expect.stringMatching(/només escriuen els administradors/) });
    expect(await localXat.enviaMissatge(general.id, { id: 'x-3', text: 'Bon dia, veïns' }, LOCAL)).toMatchObject({ seq: 1 });
  });

  it('organització és un àlies d’entitat: la mateixa organització no té dos comunitats', async () => {
    const entitat = await localXat.obriFilDePagina({ tipus: 'entitat', id: 'coop' }, LOCAL);
    const organitzacio = await localXat.obriFilDePagina({ tipus: 'organitzacio', id: 'coop' }, LOCAL);
    expect(organitzacio.filId).toBe(entitat.filId);
    expect(organitzacio.fils[0].subjecte.tipus).toBe('entitat');
  });
});

describe('la comunitat «Sóc de Poble» de la llavor', () => {
  it('obrir la pàgina de l’entitat (per slug o per id) porta al General de la llavor, sense crear-ne cap', async () => {
    /* Ordre del Mestre (261007) · El slug declarat ('socdepoble') és ara el
       mateix text que l'id: localXat busca per id o per slug al padró
       (identitatsSeed.js), i la clau del fil continua sent l'id. Les dues
       crides d'esta prova casen ja per id i exercitzen el mateix camí; la
       cerca per slug la cobrix la prova següent, amb un padró de prova. */
    const perSlug = await localXat.obriFilDePagina({ tipus: 'entitat', id: ENTITAT_PILOT_SLUG, titol: 'Sóc de Poble' }, SEED);
    expect(perSlug.filId).toBe(XAT_SEED_IDS.filGeneral);
    expect(perSlug.fils.map((f) => f.id)).toEqual([XAT_SEED_IDS.filComunitat, XAT_SEED_IDS.filAvisos, XAT_SEED_IDS.filGeneral]);
    expect((await localXat.obriFilDePagina({ tipus: 'entitat', id: XAT_SEED_IDS.entitat }, SEED)).filId).toBe(XAT_SEED_IDS.filGeneral);
    const fils = await localXat.loadFils(SEED);
    expect(fils).toHaveLength(5);
    expect(fils.find((f) => f.id === XAT_SEED_IDS.filBetaTesters)).toMatchObject({
      tipus: 'grup', titol: 'Beta testers', comunitatId: XAT_SEED_IDS.filComunitat, subjecte: { tipus: 'entitat', id: XAT_SEED_IDS.entitat }
    });
  });

  /* Ordre del Mestre (261007) · Amb slug i id iguals, cap prova no passa per
     la cerca per slug de localXat (obriFilDePagina: `e.slug ===
     subjecte.id`). Un padró de prova, idèntic al de la llavor tret del slug
     de l'entitat pilot, la torna a exercitar: si la branca es perdera, el
     slug obriria una comunitat nova en lloc del General de la llavor. El
     mòdul es carrega de nou només per a esta prova, i la resta continua amb
     el padró real. Front 3 (261013) · Només canvia el de la pilot: el padró ja
     porta Rentonar, i dos entitats amb el mateix slug no serien cap llavor. */
  it('amb un slug distint de l’id, obrir la pàgina de l’entitat pel slug porta al mateix General', async () => {
    vi.resetModules();
    vi.doMock('./identitatsSeed.js', async (importOriginal) => {
      const original = await importOriginal();
      const ambSlugDeProva = (e) => (e.id === original.ENTITAT_PILOT_ID ? { ...e, slug: 'slug-de-prova' } : e);
      return { ...original, ENTITATS_SEED: Object.freeze(original.ENTITATS_SEED.map(ambSlugDeProva)) };
    });
    try {
      const { localXat: ambPadroDeProva, reiniciaLocalXat: reinicia } = await import('./localXat.js');
      reinicia();
      const perSlug = await ambPadroDeProva.obriFilDePagina({ tipus: 'entitat', id: 'slug-de-prova' }, SEED);
      expect(perSlug.filId).toBe(XAT_SEED_IDS.filGeneral);
      expect(perSlug.fils.map((f) => f.id)).toEqual([XAT_SEED_IDS.filComunitat, XAT_SEED_IDS.filAvisos, XAT_SEED_IDS.filGeneral]);
      expect(await ambPadroDeProva.loadFils(SEED)).toHaveLength(5);
    } finally {
      vi.doUnmock('./identitatsSeed.js');
      vi.resetModules();
    }
  });

  it('els fils de la llavor conserven comunitatId i subjecte; un fil de pàgina no llista les persones', async () => {
    const perId = new Map((await localXat.loadFils(SEED)).map((f) => [f.id, f]));
    expect(perId.get(XAT_SEED_IDS.filIaia)).toMatchObject({ comunitatId: null, subjecte: null });
    expect(perId.get(XAT_SEED_IDS.filGeneral)).toMatchObject({
      comunitatId: XAT_SEED_IDS.filComunitat, subjecte: { tipus: 'entitat', id: XAT_SEED_IDS.entitat }, altres: [], participants: 1
    });
    /* A la comunitat i als Avisos, l'altra part és l'entitat, no les persones. */
    expect(perId.get(XAT_SEED_IDS.filAvisos).altres.map((a) => a.id)).toEqual([XAT_SEED_IDS.entitat]);
  });

  it('amb sessió (propietari de l’entitat pilot) escriu als Avisos i hi signa l’entitat', async () => {
    const avisos = (await localXat.loadFils(SEED)).find((f) => f.id === XAT_SEED_IDS.filAvisos);
    expect(avisos.rol).toBe('admin');
    const avis = await localXat.enviaMissatge(XAT_SEED_IDS.filAvisos, { id: 'avis-1', text: 'Dissabte, quedada a la plaça' }, SEED);
    expect(avis).toMatchObject({ seq: 4, usuariId: 'jo-A', comOrgId: XAT_SEED_IDS.entitat, autorNom: 'Sóc de Poble' });
    expect(avis.metadades).toHaveProperty('autorPersona');
  });

  it('sense sessió (convidat) llig els Avisos però no hi escriu; al General, sí', async () => {
    mock.user = null;
    const avisos = (await localXat.loadFils(SEED)).find((f) => f.id === XAT_SEED_IDS.filAvisos);
    expect(avisos.rol).toBe('membre');
    expect(await localXat.loadMissatges(XAT_SEED_IDS.filAvisos, SEED)).toHaveLength(3);
    await expect(localXat.enviaMissatge(XAT_SEED_IDS.filAvisos, { id: 'avis-convidat', text: 'Hola' }, SEED))
      .rejects.toMatchObject({ code: 'SDP-XAT-011' });
    expect(await localXat.enviaMissatge(XAT_SEED_IDS.filGeneral, { id: 'general-convidat', text: 'Hola' }, SEED))
      .toMatchObject({ usuariId: 'convidat-seed', comOrgId: null });
  });
});

/* Ordre del Mestre (261013; pla 261013_1930, Front 3) · Rentonar, la segona
   entitat fundacional del padró, pels dos camins que ofereix la seua fitxa.
   La fitxa és de tipus 'grup' (localPerfils · publicDEntitat, amb kind
   'group'):
   · «Comentar → En públic» porta a /xat?sobre=grup:rentonar, un grup pla
     sense comunitat ni Avisos ('grup' és de la classe grup a
     contracte.js · TIPUS_SUBJECTE_XAT);
   · «Escriu-li al xat» porta a /xat?amb=rentonar (PerfilPublicSection), un fil
     amb l'entitat on qui té sessió és client: la regla del mode seed només
     la fa propietària de la pilot (identitatsSeed · rolALEntitat). */
describe('Rentonar, la segona entitat de la llavor (Front 3)', () => {
  const fitxa = () => createLocalPerfilsAdapter().loadPerfilPublic(ENTITAT_RENTONAR_SLUG, null);

  it('«Comentar» de /grup/rentonar obri un grup pla de la pàgina, sense comunitat ni Avisos, on es pot escriure', async () => {
    const objecte = objecteDePerfil(fitxa());
    expect(objecte).toMatchObject({ tipus: 'grup', id: 'rentonar', titol: 'Rentonar', ruta: '/grup/rentonar' });
    expect(rutaXatDePagina(objecte)).toBe('/xat?sobre=grup:rentonar&titol=Rentonar&ruta=%2Fgrup%2Frentonar');
    /* El descriptor que XatSection en trau (objecteDeSobre) i passa a obriFilDePagina. */
    const obert = await localXat.obriFilDePagina({ tipus: 'grup', id: 'rentonar', titol: 'Rentonar', ruta: '/grup/rentonar' }, SEED);
    expect(obert.fils).toHaveLength(1);
    const [grup] = obert.fils;
    expect(obert.filId).toBe(grup.id);
    expect(grup).toMatchObject({
      tipus: 'grup', titol: 'Rentonar', comunitatId: null, entitatId: null, rol: 'membre', participant: true,
      subjecte: { tipus: 'grup', id: 'rentonar', ruta: '/grup/rentonar', titol: 'Rentonar' }
    });
    const delSubjecte = (await localXat.loadFils(SEED)).filter((f) => f.subjecte?.id === ENTITAT_RENTONAR_SLUG);
    expect(delSubjecte.map((f) => f.tipus)).toEqual(['grup']);
    expect(await localXat.enviaMissatge(grup.id, { id: 'rentonar-public', text: 'Bon dia' }, SEED))
      .toMatchObject({ seq: 1, usuariId: 'jo-A', comOrgId: null, autorNom: null });
  });

  it('«Escriu-li al xat» (/xat?amb=rentonar) obri el fil amb l’entitat, com crea_fil_directe; qui té sessió no l’administra', async () => {
    const amb = fitxa().id;
    expect(amb).toBe(ENTITAT_RENTONAR_SLUG);
    const filId = await localXat.creaFilDirecte(amb, null, SEED);
    expect(await localXat.creaFilDirecte(amb, null, SEED)).toBe(filId);
    expect((await localXat.loadFils(SEED)).find((f) => f.id === filId)).toMatchObject({
      tipus: 'entitat', entitatId: 'rentonar', entitatNom: 'Rentonar', comEntitat: false, rol: 'membre',
      comunitatId: null, subjecte: null, altres: [{ id: 'rentonar', nom: 'Rentonar', tipus: 'entitat', avatarUrl: '' }]
    });
    expect(await localXat.enviaMissatge(filId, { id: 'rentonar-privat', text: 'Hola, Rentonar' }, SEED))
      .toMatchObject({ seq: 1, usuariId: 'jo-A', comOrgId: null, autorNom: null });
    /* El padró que es llista no canvia (xatSeed.js), i un id que no és cap
       entitat del padró continua sent forastera. */
    expect((await localXat.carregaMembres(null, SEED)).map((m) => m.usuari_id)).not.toContain(ENTITAT_RENTONAR_SLUG);
    await expect(localXat.creaFilDirecte('coop', null, SEED)).rejects.toMatchObject({ code: 'SDP-XAT-004' });
  });
});
