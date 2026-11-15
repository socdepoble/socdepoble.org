/* Onada R28 (pla 261115_0135, Lot C3) · La peça pura entre el xat i el motor
   `.sdpbackup`: l'àmbit es llig de la clau de dades del xat, el contingut és
   el de la vista tornat a la llista blanca del motor (res de la vista, cap
   secret, cap bombolla pendent, esborrada o bloquejada), la còpia ix i torna a
   entrar pel motor de veres sense cap escriptura, i cada CODI_* arriba en
   paraules de la gent. Verificació X2: cap reserva de la vista (els noms
   units, 'Conversa', el nom i la foto del fil propi, «Veí») viatja com a
   dada, i ni el xat de mostra amb Javi ni cap bombolla sintètica hi entren. */
import { describe, expect, test } from 'vitest';
import { backendScope } from '../../config/backendConfig.js';
import {
  CODI_ARXIU_NO_DESAT, CODI_BASE_ABSENT, CODI_CADENA_DIVERGENT, CODI_CLAU_FEBLE, CODI_CLAU_INCORRECTA, CODI_COPIA_CORRUPTA,
  CODI_DEGRADACIO, CODI_IDENTITAT_DIVERGENT, CODI_LIMIT_SUPERAT, CODI_MATERIAL_SENSIBLE, CODI_NONCE_REPETIT,
  exportaCopiaSeguretatXat, exportaCopiaSeguretatXatAmbRebut, importaCopiaSeguretatXat,
} from '../../data/xat/copiaSeguretatPortatil.js';
import { ID_FIL_DE_MOSTRA_DE_JAVI, MISSATGE_AUTOMATIC_DE_JAVI, filDeMostraDeJavi, missatgesDeMostraDeJavi } from '../../data/xatsPerDefecte.js';
import {
  TEXTOS_COPIA, abastDeLaCopia, contingutDeLaCopia, contrasenyaProuLlarga, dtoDeFil, dtoDeMissatge, errorDeLaCopia, formataData,
  missatgeEntraALaCopia, resumDeLaCopia, textAmb, titolDelServidor,
} from './copiaSeguretatXat.js';
import { mapejaFil, mapejaMissatge } from './missatges.js';

const JO = '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70';
const ROSA = '1c7b2a6f-7b3d-4a4f-8e2b-3c4d5e6f7081';
const TENANT = '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192';
const FIL_ROSA = '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3';
const FIL_GRUP = '4fae5d92-ae60-4d72-9b5e-6f708192a3b4';
const AMBIT = JSON.stringify([`backend:${JSON.stringify(['supabase', 'https://exemple.supabase.co', TENANT, 'remote'])}`, JO, null]);
const CONTRASENYA = 'farcell de la iaia 2026';
/* Un JWT sintètic (capçalera, cos i signatura falsos): el motor el reconeix per la forma i el rebutja. */
const JWT_SINTETIC = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiJ4In0', 'c2lnbmF0dXJh'].join('.');
const ABAST = { usuariId: JO, tenantId: TENANT };

/* Els fils i les bombolles com els té XatContext: els de mapejaFil i mapejaMissatge. */
const filRosa = mapejaFil({
  id: FIL_ROSA, tipus: 'directe', titol: null, altresNoms: ['Rosa'], altres: [{ id: ROSA, nom: 'Rosa', tipus: 'persona', avatar: null }],
  ultimText: 'Fins demà', ultimAl: '2026-11-14T10:00:00.000Z', ultimAutorId: ROSA, ultimSeq: 3, llegitFinsSeq: 3,
  rebutPelsAltresFinsSeq: 2, noLlegits: 0, preferitAl: '2026-11-01T00:00:00.000Z', participants: 2, participant: true, rol: 'membre'
});
const filGrup = mapejaFil({ id: FIL_GRUP, tipus: 'grup', titol: 'Regants de la Torre', ultimSeq: 1, participants: 9 });
const bombolla = (id, filId, seq, usuariId, text, creatAl, extra = {}) => ({
  ...mapejaMissatge({ id, filId, seq, usuariId, autorNom: usuariId === ROSA ? 'Rosa' : 'Javi', text, tipus: 'text', creatAl, metadades: {} }, JO),
  ...extra
});
const MISSATGES = {
  [FIL_ROSA]: [
    bombolla('5a0b6ea3-0b71-4e83-8c6f-708192a3b4c5', FIL_ROSA, 1, JO, 'Bon dia, Rosa!', '2026-11-10T08:00:00.000Z'),
    bombolla('6b1c7fb4-1c82-4f94-9d70-8192a3b4c5d6', FIL_ROSA, 2, ROSA, 'Fins demà', '2026-11-14T10:00:00.000Z'),
    /* Fora: un esborrat, un d'una persona bloquejada, un pendent i un fallit (sense seq). */
    bombolla('7c2d80c5-2d93-4aa5-8e81-92a3b4c5d6e7', FIL_ROSA, 3, ROSA, '', '2026-11-14T11:00:00.000Z', { esborrat: true }),
    bombolla('8d3e91d6-3ea4-4bb6-9f92-a3b4c5d6e7f8', FIL_ROSA, 4, ROSA, '', '2026-11-14T12:00:00.000Z', { bloquejat: true }),
    { ...bombolla('9e4fa2e7-4fb5-4cc7-8aa3-b4c5d6e7f809', FIL_ROSA, null, JO, 'encara no', '2026-11-14T13:00:00.000Z'), estatEnviament: 'pendent' },
    { ...bombolla('af50b3f8-50c6-4dd8-9bb4-c5d6e7f8091a', FIL_ROSA, null, JO, 'ha fallat', '2026-11-14T13:01:00.000Z'), estatEnviament: 'error' },
    /* Una seq repetida: es queda la primera. */
    bombolla('b061c409-61d7-4ee9-8cc5-d6e7f8091a2b', FIL_ROSA, 2, ROSA, 'repetida', '2026-11-14T10:00:01.000Z')
  ],
  [FIL_GRUP]: [bombolla('c172d51a-72e8-4ffa-9dd6-e7f8091a2b3c', FIL_GRUP, 1, ROSA, 'Demà toca tanda', '2026-11-12T16:00:00.000Z')]
};
const getThreadMessages = (filId) => MISSATGES[filId] || [];

describe('abastDeLaCopia', () => {
  test('la persona és joId i el tenant ix de la clau de dades del xat (backendScope de veres)', () => {
    expect(abastDeLaCopia({ joId: JO, ambitEstable: AMBIT })).toEqual({ usuariId: JO, tenantId: TENANT });
    const real = JSON.stringify([backendScope({ backend_url: 'https://exemple.supabase.co', tenant_id: TENANT.toUpperCase() }), JO, 'org:1']);
    expect(abastDeLaCopia({ joId: JO, ambitEstable: real })).toEqual({ usuariId: JO, tenantId: TENANT });
  });

  test('sense tenant: el backend, el mode i l’amfitrió; sense persona o amb una clau il·legible, cap còpia', () => {
    const sense = JSON.stringify([`backend:${JSON.stringify(['supabase', 'https://exemple.supabase.co', null, 'local'])}`, JO, null]);
    expect(abastDeLaCopia({ joId: JO, ambitEstable: sense })).toEqual({ usuariId: JO, tenantId: 'supabase:local:exemple.supabase.co' });
    expect(abastDeLaCopia({ joId: null, ambitEstable: AMBIT })).toBeNull();
    expect(abastDeLaCopia({ joId: '  ', ambitEstable: AMBIT })).toBeNull();
    expect(abastDeLaCopia({ joId: JO, ambitEstable: '' })).toBeNull();
    expect(abastDeLaCopia({ joId: JO, ambitEstable: '{no és json' })).toBeNull();
    expect(abastDeLaCopia({ joId: JO, ambitEstable: JSON.stringify(['un altre format', JO]) })).toBeNull();
  });
});

describe('contingutDeLaCopia', () => {
  test('els fils de la llista menys les files d’ajuda, les comunitats, els de visitant i els ids que el motor no admet', () => {
    const chatThreads = [
      filRosa, filGrup,
      { ...filGrup, id: 'fake-javi', perDefecte: 'javi' },
      /* El xat de mostra amb Javi tal com XatContext el posa a la llista: sense perDefecte. */
      filDeMostraDeJavi({ avis: 'Registra’t' }),
      mapejaFil({ id: 'comunitat-la-torre', tipus: 'comunitat' }),
      mapejaFil({ id: 'pagina-1', tipus: 'grup', participant: false }),
      { ...filGrup, id: 'poble:la-torre' },
      filRosa
    ];
    const { fils, missatges, filsAmbMissatges } = contingutDeLaCopia({ chatThreads, getThreadMessages, joNom: 'Javi Llinares' });
    expect(fils.map((f) => f.id)).toEqual([FIL_ROSA, FIL_GRUP]);
    expect(filsAmbMissatges).toBe(2);
    /* Només els confirmats, una sola vegada per seq: ni l'esborrat, ni el bloquejat, ni el pendent, ni el fallit. */
    expect(missatges.map((m) => [m.filId, m.seq, m.text])).toEqual([
      [FIL_ROSA, 1, 'Bon dia, Rosa!'], [FIL_ROSA, 2, 'Fins demà'], [FIL_GRUP, 1, 'Demà toca tanda']
    ]);
    /* «Jo» de la vista torna al nom de la persona. */
    expect(missatges[0]).toMatchObject({ usuariId: JO, autorNom: 'Javi Llinares', esIA: false, creatAl: '2026-11-10T08:00:00.000Z' });
    expect(missatges[1]).toMatchObject({ usuariId: ROSA, autorNom: 'Rosa' });
  });

  test('cap camp de la vista ni cap secret passa a la còpia: només la forma del DTO', () => {
    const contaminat = {
      ...filRosa, accessToken: JWT_SINTETIC, privateKeyJwk: { kty: 'EC', d: 'secret' }, sessio: { token: 'x' }
    };
    const bombollaContaminada = { ...MISSATGES[FIL_ROSA][0], refreshToken: 'secret', cos: 'fila crua' };
    const { fils, missatges } = contingutDeLaCopia({
      chatThreads: [contaminat], getThreadMessages: () => [bombollaContaminada], joNom: 'Javi'
    });
    const text = JSON.stringify({ fils, missatges });
    for (const nom of ['accessToken', 'privateKeyJwk', 'sessio', 'refreshToken', 'cos', 'searchText', 'sender', 'estatEnviament', 'threadId', 'is_ai', 'avatar_url', 'preferit', 'name']) {
      expect([nom, text.includes(`"${nom}"`)]).toEqual([nom, false]);
    }
    expect(text).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(fils[0]).toMatchObject({ id: FIL_ROSA, tipus: 'directe', altresNoms: ['Rosa'], ultimText: 'Fins demà', participants: 2, participant: true, rol: 'membre' });
    /* El servidor no hi va donar cap títol: «Rosa» és la reserva de la vista. */
    expect(Object.hasOwn(fils[0], 'titol')).toBe(false);
  });

  test('la vista prèvia amagada d’una persona bloquejada no hi torna', () => {
    const { fils } = contingutDeLaCopia({ chatThreads: [{ ...filRosa, ultimText: '', ultimAmagat: true }], getThreadMessages });
    expect(fils[0].ultimText).toBe('');
  });

  test('el motor de veres l’accepta, la torna a obrir sencera i sense escriure res', async () => {
    const contingut = contingutDeLaCopia({ chatThreads: [filRosa, filGrup], getThreadMessages, joNom: 'Javi' });
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, fils: contingut.fils, missatges: contingut.missatges, contrasenya: CONTRASENYA });
    expect(rebut).toMatchObject({ mode: 'complet', usuariId: JO, tenantId: TENANT });
    /* Sense magatzem ni aplicaImportacio: només valida. */
    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, contrasenya: CONTRASENYA });
    expect(resultat.autenticada).toBe(true);
    expect(resultat.fils.map((f) => f.id).sort()).toEqual([FIL_ROSA, FIL_GRUP].sort());
    expect(resultat.missatges).toHaveLength(3);
    expect(resumDeLaCopia(resultat)).toMatchObject({
      fils: 2, missatges: 3, desDeMs: Date.parse('2026-11-10T08:00:00.000Z'), finsAMs: Date.parse('2026-11-14T10:00:00.000Z')
    });
    expect(resumDeLaCopia(resultat).creatAtMs).toBe(Date.parse(resultat.manifest.creatAt));
  });

  test('un secret dins de les metadades fa fallar la còpia (el motor ho veu) i la persona ho llig en paraules seues', async () => {
    const ambSecret = { ...MISSATGES[FIL_GRUP][0], metadades: { adjunt: { accessToken: JWT_SINTETIC } } };
    const contingut = contingutDeLaCopia({ chatThreads: [filGrup], getThreadMessages: () => [ambSecret] });
    const error = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, ...contingut, contrasenya: CONTRASENYA }).catch((e) => e);
    expect(error.codi).toBe(CODI_MATERIAL_SENSIBLE);
    expect(errorDeLaCopia(error, undefined, 'desa')).toEqual({ camp: null, text: textAmb(TEXTOS_COPIA.errorMaterial) });
  });
});

/* X2 (verificació del carril .sdpbackup) · Cap reserva de la vista no viatja
   com si fora una dada del servidor, i cap mostra sintètica entra a la còpia. */
describe('fidelitat de les dades: res de les reserves de la vista ni de les mostres', () => {
  const JO_AVATAR = 'https://exemple.supabase.co/storage/v1/object/public/avatars/jo.webp';
  /* El fil propi tal com el deixa XatContext (filsDeLaLlista): el primer dels
     altresNoms o el nom de la persona, i la seua foto si el servidor no en dona. */
  const filPropi = (fil, nomPropi = 'Javi Llinares') => {
    const vista = mapejaFil({ id: '5bf06ea3-0b71-4e83-8c6f-708192a3b4c6', tipus: 'personal', esPropi: true, ...fil });
    const nom = (vista.altresNoms.length && vista.altresNoms[0]) || nomPropi;
    return { ...vista, name: nom, title: nom, avatar_url: vista.avatar_url || JO_AVATAR };
  };

  test('el títol només quan el servidor l’ha donat: ni els noms units, ni «Conversa», ni el nom propi del fil personal', () => {
    expect(titolDelServidor(filGrup)).toBe('Regants de la Torre');
    expect(dtoDeFil(filGrup).titol).toBe('Regants de la Torre');
    /* Sense títol, mapejaFil hi posa els altres units per comes… */
    const dos = mapejaFil({ id: FIL_GRUP, tipus: 'grup', titol: null, altresNoms: ['Rosa', 'Pep'] });
    expect(dos.title).toBe('Rosa, Pep');
    expect(Object.hasOwn(dtoDeFil(dos), 'titol')).toBe(false);
    expect(Object.hasOwn(dtoDeFil(filRosa), 'titol')).toBe(false);
    /* …i, sense ningú, el literal 'Conversa'. */
    const sola = mapejaFil({ id: FIL_GRUP, tipus: 'grup', titol: '', altresNoms: [] });
    expect(sola.title).toBe('Conversa');
    expect(Object.hasOwn(dtoDeFil(sola), 'titol')).toBe(false);
    /* El fil personal: el nom que hi posa la vista no és cap títol del servidor. */
    expect(filPropi({}).title).toBe('Javi Llinares');
    expect(Object.hasOwn(dtoDeFil(filPropi({})), 'titol')).toBe(false);
    expect(Object.hasOwn(dtoDeFil(filPropi({ titol: 'Les meues notes' })), 'titol')).toBe(false);
  });

  test('la foto del fil personal que la vista hi posa (la de la persona) no hi va; la del servidor, sí', () => {
    expect(Object.hasOwn(dtoDeFil(filPropi({}), { joAvatar: JO_AVATAR }), 'imatgeUrl')).toBe(false);
    const ambFoto = filPropi({ imatgeUrl: 'https://exemple.supabase.co/storage/v1/object/public/avatars/fil.webp' });
    expect(dtoDeFil(ambFoto, { joAvatar: JO_AVATAR }).imatgeUrl).toBe('https://exemple.supabase.co/storage/v1/object/public/avatars/fil.webp');
    /* En un fil que no és propi, la foto és la del servidor encara que coincidisca. */
    expect(dtoDeFil({ ...filGrup, avatar_url: JO_AVATAR }, { joAvatar: JO_AVATAR }).imatgeUrl).toBe(JO_AVATAR);
  });

  test('l’autor sense nom (la reserva «Veí») i el «Jo» sense el nom de la persona no hi van com a nom', () => {
    const senseNom = mapejaMissatge({ id: 'd283e62b-83f9-4a0b-8ee7-f8091a2b3c4d', filId: FIL_GRUP, seq: 2, usuariId: ROSA, autorNom: null, text: 'Hola', creatAl: '2026-11-12T16:01:00.000Z' }, JO);
    expect(senseNom.author).toBe('Veí');
    expect(Object.hasOwn(dtoDeMissatge(senseNom, FIL_GRUP), 'autorNom')).toBe(false);
    const meu = mapejaMissatge({ id: 'e394f73c-94fa-4b1c-9ff8-091a2b3c4d5e', filId: FIL_GRUP, seq: 3, usuariId: JO, text: 'Bon dia', creatAl: '2026-11-12T16:02:00.000Z' }, JO);
    expect(meu.author).toBe('Jo');
    expect(Object.hasOwn(dtoDeMissatge(meu, FIL_GRUP, null), 'autorNom')).toBe(false);
    expect(dtoDeMissatge(meu, FIL_GRUP, 'Javi Llinares').autorNom).toBe('Javi Llinares');
    expect(dtoDeMissatge(MISSATGES[FIL_GRUP][0], FIL_GRUP).autorNom).toBe('Rosa');
  });

  /* Onada R28 (verificador) · Un missatge propi signat com a entitat no porta el nom de la persona. */
  test('un missatge propi signat com a entitat no ix amb el nom de la persona', () => {
    const comEntitat = mapejaMissatge({ id: 'f4a5b6c7-a5b6-4c7d-8e9f-0a1b2c3d4e5f', filId: FIL_GRUP, seq: 4, usuariId: JO, autorNom: 'Forn de Dalt', comOrgId: 'org-1', text: 'Hui hi ha coca', creatAl: '2026-11-12T16:03:00.000Z' }, JO);
    expect(comEntitat.comEntitat).toBe(true);
    expect(Object.hasOwn(dtoDeMissatge(comEntitat, FIL_GRUP, 'Javi Llinares'), 'autorNom')).toBe(false);
  });

  test('el xat de mostra amb Javi (fake-javi) i les seues bombolles no hi entren; una bombolla sintètica dins d’un fil de veres, tampoc', () => {
    expect(filDeMostraDeJavi().id).toBe(ID_FIL_DE_MOSTRA_DE_JAVI);
    const [mostra] = missatgesDeMostraDeJavi('2026-11-14T09:00:00.000Z');
    /* La mostra no ha eixit de mapejaMissatge: no porta threadId. */
    expect(missatgeEntraALaCopia(mostra, ID_FIL_DE_MOSTRA_DE_JAVI)).toBe(false);
    expect(missatgeEntraALaCopia({ ...mostra, id: 'f4a5084d-a50b-4c2d-80aa-1a2b3c4d5e6f' }, FIL_ROSA)).toBe(false);
    /* Una bombolla d'un altre fil tampoc no entra en este. */
    expect(missatgeEntraALaCopia(MISSATGES[FIL_GRUP][0], FIL_ROSA)).toBe(false);
    expect(missatgeEntraALaCopia(MISSATGES[FIL_GRUP][0], FIL_GRUP)).toBe(true);

    const perFil = {
      [ID_FIL_DE_MOSTRA_DE_JAVI]: missatgesDeMostraDeJavi('2026-11-14T09:00:00.000Z'),
      [FIL_ROSA]: [...MISSATGES[FIL_ROSA], { ...mostra, id: 'f4a5084d-a50b-4c2d-80aa-1a2b3c4d5e6f', seq: 9 }]
    };
    const { fils, missatges } = contingutDeLaCopia({
      chatThreads: [filDeMostraDeJavi({ avis: 'Registra’t' }), filRosa], getThreadMessages: (id) => perFil[id] || [], joNom: 'Javi'
    });
    expect(fils.map((f) => f.id)).toEqual([FIL_ROSA]);
    expect(missatges.map((m) => m.seq)).toEqual([1, 2]);
    expect(JSON.stringify({ fils, missatges })).not.toContain(MISSATGE_AUTOMATIC_DE_JAVI);
  });

  test('per la còpia de veres: cap títol inventat, cap «Veí» ni cap mostra torna en obrir-la', async () => {
    const senseNom = mapejaMissatge({ id: 'd283e62b-83f9-4a0b-8ee7-f8091a2b3c4d', filId: FIL_ROSA, seq: 5, usuariId: ROSA, autorNom: null, text: 'Sense nom', creatAl: '2026-11-14T14:00:00.000Z' }, JO);
    const perFil = { ...MISSATGES, [FIL_ROSA]: [...MISSATGES[FIL_ROSA], senseNom], [ID_FIL_DE_MOSTRA_DE_JAVI]: missatgesDeMostraDeJavi() };
    const contingut = contingutDeLaCopia({
      chatThreads: [filDeMostraDeJavi(), filRosa, filGrup], getThreadMessages: (id) => perFil[id] || [], joNom: 'Javi'
    });
    const text = await exportaCopiaSeguretatXat({ ...ABAST, fils: contingut.fils, missatges: contingut.missatges, contrasenya: CONTRASENYA });
    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, contrasenya: CONTRASENYA });
    const rosa = resultat.fils.find((f) => f.id === FIL_ROSA);
    expect(rosa.titol ?? null).toBeNull();
    expect(resultat.fils.find((f) => f.id === FIL_GRUP).titol).toBe('Regants de la Torre');
    expect(resultat.fils.map((f) => f.id)).not.toContain(ID_FIL_DE_MOSTRA_DE_JAVI);
    const tornat = resultat.missatges.find((m) => m.seq === 5 && m.filId === FIL_ROSA);
    expect(tornat.text).toBe('Sense nom');
    expect(tornat.autorNom ?? null).toBeNull();
    const dades = JSON.stringify({ fils: resultat.fils, missatges: resultat.missatges });
    for (const reserva of ['"Veí"', '"Conversa"', '"Jo"', MISSATGE_AUTOMATIC_DE_JAVI]) expect([reserva, dades.includes(reserva)]).toEqual([reserva, false]);
  });
});

describe('la contrasenya', () => {
  test('la regla del motor: 12 caràcters en NFC, sense els espais dels extrems', () => {
    expect(contrasenyaProuLlarga('onze-caract')).toBe(false);
    expect(contrasenyaProuLlarga('dotze-caract')).toBe(true);
    expect(contrasenyaProuLlarga('   onze-caract   ')).toBe(false);
    expect(contrasenyaProuLlarga(null)).toBe(false);
  });
});

describe('errorDeLaCopia', () => {
  const error = (codi, motiu = 'x') => Object.assign(new Error('intern'), { codi, motiu });
  const text = (parell, valors) => textAmb(parell, undefined, valors);

  test('desa: la clau curta va al camp; la resta, a l’avís, sense cap missatge intern', () => {
    expect(errorDeLaCopia(error(CODI_CLAU_FEBLE, 'contrasenya-curta'))).toEqual({ camp: 'contrasenya', text: text(TEXTOS_COPIA.errorCurta, { n: 12 }) });
    expect(errorDeLaCopia(error(CODI_LIMIT_SUPERAT))).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorCopiaMassaGran) });
    expect(errorDeLaCopia(error(CODI_NONCE_REPETIT))).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorAtzar) });
    expect(errorDeLaCopia(error(CODI_ARXIU_NO_DESAT, 'descarrega'))).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorNoDesat) });
    /* Sense cap mecanisme per a desar: només dins de l'app ho diu de l'app. */
    expect(errorDeLaCopia(error(CODI_ARXIU_NO_DESAT, 'sense-mecanisme'))).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorNoDesat) });
    expect(errorDeLaCopia(error(CODI_ARXIU_NO_DESAT, 'sense-mecanisme'), undefined, 'desa', { natiu: true })).toEqual({ camp: null, text: text(TEXTOS_COPIA.desaNatiu) });
    expect(errorDeLaCopia(new Error('Failed to fetch'))).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorGeneric) });
  });

  test('comprova: la clau incorrecta o absent, al camp de la contrasenya; l’arxiu dolent, al de l’arxiu', () => {
    const comprova = (e) => errorDeLaCopia(e, undefined, 'comprova');
    expect(comprova(error(CODI_CLAU_INCORRECTA, 'aead'))).toEqual({ camp: 'contrasenya', text: text(TEXTOS_COPIA.errorIncorrecta) });
    expect(comprova(error(CODI_CLAU_INCORRECTA, 'contrasenya-absent'))).toEqual({ camp: 'contrasenya', text: text(TEXTOS_COPIA.errorBuida) });
    expect(comprova(error(CODI_COPIA_CORRUPTA))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorCorrupta) });
    expect(comprova(error(CODI_MATERIAL_SENSIBLE))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorCorrupta) });
    expect(comprova(error(CODI_DEGRADACIO))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorFormat) });
    expect(comprova(error(CODI_CLAU_FEBLE, 'sense-xifrar'))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorFormat) });
    expect(comprova(error(CODI_IDENTITAT_DIVERGENT))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorAltreCompte) });
    expect(comprova(error(CODI_BASE_ABSENT))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorPart) });
    expect(comprova(error(CODI_CADENA_DIVERGENT))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorPart) });
    expect(comprova(error(CODI_LIMIT_SUPERAT))).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorArxiuMassaGran) });
  });

  test('tradueix i omple els marcadors sense interpretar $', () => {
    const t = (clau, reserva) => (clau === 'section.xat.copia.error.curta' ? 'Al menos {n} caracteres ($&).' : reserva);
    expect(errorDeLaCopia(error(CODI_CLAU_FEBLE, 'contrasenya-curta'), t).text).toBe('Al menos 12 caracteres ($&).');
    expect(textAmb(TEXTOS_COPIA.comprovaArxiuTriat, undefined, { nom: 'a$&b.sdpbackup' })).toBe('Arxiu triat: a$&b.sdpbackup');
  });
});

describe('resumDeLaCopia i formataData', () => {
  test('sense missatges ni dates llegibles, cap instant', () => {
    expect(resumDeLaCopia({ fils: [{}], missatges: [{ creatAl: null }], manifest: { creatAt: 'no' } }))
      .toEqual({ fils: 1, missatges: 1, desDeMs: null, finsAMs: null, creatAtMs: null });
    expect(resumDeLaCopia(null)).toEqual({ fils: 0, missatges: 0, desDeMs: null, finsAMs: null, creatAtMs: null });
  });

  test('la data en la llengua de la interfície; un instant invàlid no pinta res', () => {
    const ms = Date.parse('2026-11-14T10:00:00.000Z');
    expect(formataData(ms, 'ca-ES')).toMatch(/2026/);
    expect(formataData(ms, 'ca-ES', true)).toMatch(/2026/);
    expect(formataData(NaN, 'ca-ES')).toBe('');
    expect(formataData(null, 'ca-ES')).toBe('');
  });
});
