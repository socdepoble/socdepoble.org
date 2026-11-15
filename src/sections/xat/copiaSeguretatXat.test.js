/* Onada R28 (pla 261115_0135, Lot C3) · La peça pura entre el xat i el motor
   `.sdpbackup`: l'àmbit es llig de la clau de dades del xat, el contingut és
   el de la vista tornat a la llista blanca del motor (res de la vista, cap
   secret, cap bombolla pendent, esborrada o bloquejada), la còpia ix i torna a
   entrar pel motor de veres sense cap escriptura, i cada CODI_* arriba en
   paraules de la gent. Verificació X2: cap reserva de la vista (els noms
   units, 'Conversa', el nom i la foto del fil propi, «Veí») viatja com a
   dada, i ni el xat de mostra amb Javi ni cap bombolla sintètica hi entren. */
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { backendScope } from '../../config/backendConfig.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import {
  CODI_ARXIU_NO_DESAT, CODI_BASE_ABSENT, CODI_CADENA_DIVERGENT, CODI_CLAU_FEBLE, CODI_CLAU_INCORRECTA, CODI_COPIA_CORRUPTA,
  CODI_DEGRADACIO, CODI_IDENTITAT_DIVERGENT, CODI_LIMIT_SUPERAT, CODI_MATERIAL_SENSIBLE, CODI_NONCE_REPETIT,
  exportaCopiaSeguretatXat, exportaCopiaSeguretatXatAmbRebut, importaCopiaSeguretatXat,
} from '../../data/xat/copiaSeguretatPortatil.js';
import {
  AJUDA_PER_CLAU, ID_FIL_DE_MOSTRA_DE_JAVI, MISSATGE_AUTOMATIC_DE_JAVI, filDeMostraDeJavi, missatgesDeMostraDeJavi, vestixLaIAIA,
} from '../../data/xatsPerDefecte.js';
import {
  TEXTOS_COPIA, abastDeLaCopia, contingutDeLaCopia, contrasenyaProuLlarga, criptoDisponible, dtoDeFil, dtoDeMissatge, errorDeLaCopia, filEntraALaCopia,
  formataData, missatgeEntraALaCopia, resumDeLaCopia, textAmb, titolDelServidor,
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

  /* Onada R28 · revisió · Des del kit R28 de Codex, un JSON serialitzat de més
     de 64 KiB a les metadades fa fallar la còpia: la persona no llig que la
     còpia és «massa gran», perquè no ho és. */
  test('un JSON niat massa gran a les metadades: la persona llig que hi ha dades que la còpia no admet', async () => {
    const ambJsonGran = { ...MISSATGES[FIL_GRUP][0], metadades: { gran: '{"a":1}'.repeat(20_000) } };
    const contingut = contingutDeLaCopia({ chatThreads: [filGrup], getThreadMessages: () => [ambJsonGran] });
    const error = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, ...contingut, contrasenya: CONTRASENYA }).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_LIMIT_SUPERAT, motiu: 'json-niat-massa-gran' });
    expect(errorDeLaCopia(error, undefined, 'desa')).toEqual({ camp: null, text: textAmb(TEXTOS_COPIA.errorDades) });
  });

  /* Onada R28 · copia-xat-02 · El nom que un altre veí s'ha posat (altres[].nom,
     el full_name del seu perfil) i el títol del subjecte són text de la gent:
     pel camí de veres (la vista, dtoDeFil i el motor) la còpia es fa i torna
     sencera. Abans, «Bearer Pepa» deixava sense còpia tothom que parlava amb ella. */
  test('cap fals positiu pel camí de veres: un veí que es diu «Bearer Pepa» i un subjecte «Bearer de la Torre» no impedixen la còpia', async () => {
    const PEPA = '2f8c3d71-8c4e-4b50-9f3c-4d5e6f708193';
    const filAmbPepa = mapejaFil({
      id: FIL_ROSA, tipus: 'directe', altresNoms: ['Bearer Pepa'],
      altres: [{ id: PEPA, nom: 'Bearer Pepa', tipus: 'persona', avatar: null }],
      subjecte: { tipus: 'pagina', id: 'pagina-1', titol: 'Bearer de la Torre' }, ultimSeq: 1
    });
    const contingut = contingutDeLaCopia({ chatThreads: [filAmbPepa], getThreadMessages: () => [MISSATGES[FIL_ROSA][0]], joNom: 'Javi' });
    expect(contingut.fils[0].altres).toEqual([{ id: PEPA, nom: 'Bearer Pepa', tipus: 'persona', avatar: null }]);
    expect(contingut.fils[0].subjecte).toEqual({ tipus: 'pagina', id: 'pagina-1', titol: 'Bearer de la Torre' });
    const { text } = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, fils: contingut.fils, missatges: contingut.missatges, contrasenya: CONTRASENYA });
    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, contrasenya: CONTRASENYA });
    expect(resultat.fils[0].altres[0].nom).toBe('Bearer Pepa');
    expect(resultat.fils[0].subjecte.titol).toBe('Bearer de la Torre');
    expect(resultat.missatges).toHaveLength(1);
  });

  test('pel mateix camí, un secret en un altre camp d’altres continua fent fallar la còpia', async () => {
    const filAmbSecret = mapejaFil({ id: FIL_ROSA, tipus: 'directe', altres: [{ id: ROSA, nom: 'Rosa', tipus: 'persona', avatar: `Bearer ${'x'.repeat(12)}` }] });
    const contingut = contingutDeLaCopia({ chatThreads: [filAmbSecret], getThreadMessages: () => [] });
    const error = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, ...contingut, contrasenya: CONTRASENYA }).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_MATERIAL_SENSIBLE, cami: 'fils[0].altres[0].avatar' });
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

  /* Onada R28 · copia-xat-05 · vestixLaIAIA (supabase/xat.js) tapa el títol i la
     imatge del servidor al xat de la IAIA: eixa presentació no hi va com a dada. */
  test('el títol vestit de la IAIA («IAIA MarIA») i la seua cara no hi van com a dada del servidor; el mateix títol en un altre fil, sí', () => {
    const { nom, avatar } = AJUDA_PER_CLAU.iaia;
    const vestit = mapejaFil(vestixLaIAIA({ id: FIL_GRUP, tipus: 'iaia', titol: 'L’ànima de la iaia', imatgeUrl: 'https://exemple.supabase.co/storage/v1/object/public/avatars/fil.webp' }));
    expect([vestit.title, vestit.avatar_url]).toEqual([nom, avatar]);
    expect(titolDelServidor(vestit)).toBeUndefined();
    const dto = dtoDeFil(vestit);
    expect(Object.hasOwn(dto, 'titol')).toBe(false);
    expect(Object.hasOwn(dto, 'imatgeUrl')).toBe(false);
    /* Un grup qualsevol que el servidor titula igual (i amb la mateixa imatge) no és el xat de la IAIA: hi va tal qual. */
    const altre = mapejaFil({ id: FIL_GRUP, tipus: 'grup', titol: nom, imatgeUrl: avatar });
    expect(dtoDeFil(altre)).toMatchObject({ titol: nom, imatgeUrl: avatar });
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

  /* Onada R28 · copia-xat-04 · Els errors que reintentar no arregla tenen text propi. */
  test('sense WebCrypto (SENSE_CRIPTO), i en desar amb dades que el motor no admet, cap text promet que reintentar ho arregle', () => {
    const senseCripto = Object.assign(new Error('intern'), { codi: 'SENSE_CRIPTO' });
    for (const operacio of ['desa', 'comprova']) {
      expect(errorDeLaCopia(senseCripto, undefined, operacio)).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorSenseCripto) });
    }
    expect(errorDeLaCopia(error(CODI_COPIA_CORRUPTA, 'id'), undefined, 'desa')).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorDades) });
    expect(errorDeLaCopia(error(CODI_IDENTITAT_DIVERGENT, 'ambit'), undefined, 'desa')).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorDades) });
    /* Onada R28 · revisió · Un camp massa niat o un JSON niat massa gran no és una còpia massa gran. */
    for (const motiu of ['json-niat-massa-gran', 'profunditat']) {
      expect(errorDeLaCopia(error(CODI_LIMIT_SUPERAT, motiu), undefined, 'desa')).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorDades) });
    }
    expect(errorDeLaCopia(error(CODI_LIMIT_SUPERAT, 'arxiu-massa-gran'), undefined, 'desa')).toEqual({ camp: null, text: text(TEXTOS_COPIA.errorCopiaMassaGran) });
    for (const parell of [TEXTOS_COPIA.errorSenseCripto, TEXTOS_COPIA.errorDades]) {
      expect(text(parell)).not.toMatch(/Torna-ho a provar/);
    }
    /* En comprovar, els mateixos codis continuen dient-se al camp de l'arxiu. */
    expect(errorDeLaCopia(error(CODI_COPIA_CORRUPTA), undefined, 'comprova')).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorCorrupta) });
    expect(errorDeLaCopia(error(CODI_IDENTITAT_DIVERGENT), undefined, 'comprova')).toEqual({ camp: 'arxiu', text: text(TEXTOS_COPIA.errorAltreCompte) });
  });

  test('el motor de veres sense WebCrypto llança SENSE_CRIPTO, i la persona llig el text propi', async () => {
    const contingut = contingutDeLaCopia({ chatThreads: [filGrup], getThreadMessages });
    const error = await exportaCopiaSeguretatXatAmbRebut({ ...ABAST, ...contingut, contrasenya: CONTRASENYA, cripto: {} }).catch((e) => e);
    expect(error.codi).toBe('SENSE_CRIPTO');
    expect(errorDeLaCopia(error, undefined, 'desa').text).toBe(text(TEXTOS_COPIA.errorSenseCripto));
  });

  test('tradueix i omple els marcadors sense interpretar $', () => {
    const t = (clau, reserva) => (clau === 'section.xat.copia.error.curta' ? 'Al menos {n} caracteres ($&).' : reserva);
    expect(errorDeLaCopia(error(CODI_CLAU_FEBLE, 'contrasenya-curta'), t).text).toBe('Al menos 12 caracteres ($&).');
    expect(textAmb(TEXTOS_COPIA.comprovaArxiuTriat, undefined, { nom: 'a$&b.sdpbackup' })).toBe('Arxiu triat: a$&b.sdpbackup');
  });
});

describe('criptoDisponible', () => {
  test('la mateixa regla que el motor: WebCrypto complet, sí; sense subtle o sense getRandomValues, no', () => {
    expect(criptoDisponible(webcrypto)).toBe(true);
    expect(criptoDisponible(null)).toBe(false);
    expect(criptoDisponible({})).toBe(false);
    expect(criptoDisponible({ subtle: webcrypto.subtle })).toBe(false);
    expect(criptoDisponible({ getRandomValues: () => {}, subtle: { digest: () => {} } })).toBe(false);
  });
});

/* Onada R28 · Els textos de la còpia, en les cinc llengües: cada clau
   section.xat.copia.* de TEXTOS_COPIA té valor propi a cada diccionari, el
   valencià és la reserva del codi i tots porten els mateixos marcadors. */
describe('els textos de la còpia en les cinc llengües', () => {
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  const marcadors = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const PROPIS = Object.entries(TEXTOS_COPIA).filter(([, [clau]]) => clau.startsWith('section.xat.copia.'));

  test('cada clau és als cinc diccionaris, amb els marcadors de la reserva', () => {
    expect(PROPIS.length).toBeGreaterThan(50);
    for (const [nom, [clau, reserva]] of PROPIS) {
      expect([nom, CA[clau]]).toEqual([nom, reserva]);
      for (const [llengua, diccionari] of Object.entries(DICCIONARIS)) {
        expect([nom, llengua, typeof diccionari[clau] === 'string' && diccionari[clau].trim() !== '']).toEqual([nom, llengua, true]);
        expect([nom, llengua, marcadors(diccionari[clau])]).toEqual([nom, llengua, marcadors(reserva)]);
      }
    }
  });

  test('les claus noves de l’Onada R28 no es queden en valencià en cap altra llengua', () => {
    const NOVES = ['section.xat.copia.desa.abast', 'section.xat.copia.desa.senseMissatges', 'section.xat.copia.desa.ambMissatges',
      'section.xat.copia.error.senseCripto', 'section.xat.copia.error.dades', 'section.xat.copia.noCarrega'];
    for (const clau of NOVES) {
      for (const [llengua, diccionari] of Object.entries(DICCIONARIS)) {
        if (llengua !== 'ca') expect([clau, llengua, diccionari[clau] === CA[clau]]).toEqual([clau, llengua, false]);
      }
    }
  });
});

describe('Onada R29 · la còpia no porta el que no és del servidor ni promet el que no porta', () => {
  test('R29-E2EE-01 · les converses locals amb la IAIA (la forma d’IAIALocalProvider) no hi entren', () => {
    const iaiaLocal = {
      id: 'iaia-local', tipus: 'iaia', name: 'IAIA MarIA', title: 'IAIA MarIA', filLocalIAIA: true, sessioLocalIAIA: false, potEscriure: true,
      noLlegits: 0, ultimSeq: 0, llegitFinsSeq: 0, participants: [], altres: [], ultimText: null, ultimAl: null
    };
    const sessio = {
      ...iaiaLocal, id: 'iaia-local-5b6c7d8e-9f00-4a1b-8c2d-3e4f5a6b7c8d', sessioLocalIAIA: true, name: 'el meu pin del banc', title: 'el meu pin del banc',
      ultimText: 'El meu PIN és 4321 i el telèfon 600 11 22 33, què en faig?', ultimAl: '2026-11-15T09:00:00.000Z'
    };
    const delaSessio = [{ id: 'q-1', threadId: sessio.id, seq: 1, text: sessio.ultimText, sender: 'me', estatEnviament: 'enviat' }];
    expect([filEntraALaCopia(iaiaLocal), filEntraALaCopia(sessio), filEntraALaCopia(filRosa)]).toEqual([false, false, true]);
    const contingut = contingutDeLaCopia({
      chatThreads: [iaiaLocal, sessio, filRosa], getThreadMessages: (id) => (id === sessio.id ? delaSessio : getThreadMessages(id)), joNom: 'Javi'
    });
    expect(contingut.fils.map((f) => f.id)).toEqual([FIL_ROSA]);
    expect(contingut.filsAmbMissatges).toBe(1);
    const text = JSON.stringify(contingut);
    for (const rastre of ['4321', '600 11 22 33', 'iaia-local']) expect([rastre, text.includes(rastre)]).toEqual([rastre, false]);
  });

  test('R29-E2EE-02 · un missatge xifrat que no s’obri no entra a la còpia com un missatge buit; un d’obert, sí', () => {
    const tancat = mapejaMissatge({
      id: 'e3f40516-a7b8-4c9d-8e0f-1a2b3c4d5e6f', filId: FIL_ROSA, seq: 5, usuariId: ROSA, autorNom: 'Rosa', text: null,
      creatAl: '2026-11-14T14:00:00.000Z', seguretat: { xifrat: true, verificat: false, codi: 'xifrat-manipulat' }
    }, JO);
    const obert = mapejaMissatge({
      id: 'f4051627-b8c9-4dae-9f10-2b3c4d5e6f70', filId: FIL_ROSA, seq: 6, usuariId: ROSA, autorNom: 'Rosa', text: 'Xifrat i obert',
      creatAl: '2026-11-14T14:01:00.000Z', seguretat: { xifrat: true, verificat: true, firmada: true, clauAntiga: false }
    }, JO);
    expect(missatgeEntraALaCopia(tancat, FIL_ROSA)).toBe(false);
    expect(missatgeEntraALaCopia({ ...tancat, seguretat: { xifrat: true, codi: 'claus-bloquejades' } }, FIL_ROSA)).toBe(false);
    expect(missatgeEntraALaCopia(obert, FIL_ROSA)).toBe(true);
    const { missatges } = contingutDeLaCopia({
      chatThreads: [filRosa], getThreadMessages: () => [...MISSATGES[FIL_ROSA], tancat, obert], joNom: 'Javi'
    });
    expect(missatges.map((m) => [m.seq, m.text])).toEqual([[1, 'Bon dia, Rosa!'], [2, 'Fins demà'], [6, 'Xifrat i obert']]);
  });

  /* La vista d'una conversa llarga: només la pàgina de les 50 últimes (951–1000). */
  const finestra = (filId, des, fins) => Array.from({ length: fins - des + 1 }, (_, i) => bombolla(
    `a0000000-0000-4000-8000-${String(des + i).padStart(12, '0')}`, filId, des + i, ROSA, `missatge ${des + i}`, '2026-11-14T10:00:00.000Z'
  ));
  const FIL_BUIT = '5a0b6ea3-0b71-4e83-8c6f-000000000001';
  const filBuit = mapejaFil({ id: FIL_BUIT, tipus: 'directe', altresNoms: ['Pepa'], ultimText: 'Ja ho parlarem', ultimSeq: 40 });

  test('R29-E2EE-03 · amb tots els fils carregats des de la seq 1, cap cursor: la còpia és completa de veres', () => {
    const { desDeSeqPerFil } = contingutDeLaCopia({ chatThreads: [filRosa, filGrup, filBuit], getThreadMessages, joNom: 'Javi' });
    expect(desDeSeqPerFil).toBeNull();
  });

  test('R29-E2EE-03 · amb només les 50 últimes d’un fil, la còpia es declara parcial, conserva totes les converses i no pot fer de base', async () => {
    const perFil = { [FIL_ROSA]: finestra(FIL_ROSA, 951, 1000), [FIL_GRUP]: MISSATGES[FIL_GRUP] };
    const contingut = contingutDeLaCopia({ chatThreads: [filRosa, filGrup, filBuit], getThreadMessages: (id) => perFil[id] || [], joNom: 'Javi' });
    expect(contingut.desDeSeqPerFil).toEqual({ [FIL_ROSA]: 950, [FIL_GRUP]: 0, [FIL_BUIT]: 0 });
    const { text, rebut } = await exportaCopiaSeguretatXatAmbRebut({
      ...ABAST, fils: contingut.fils, missatges: contingut.missatges, desDeSeqPerFil: contingut.desDeSeqPerFil, permetSenseXifrar: true
    });
    /* Abans: mode «complet» i ultimSeqPerFil {rosa: 1000} sense cap punt de partida (seq 1–950 promeses i absents). */
    expect(rebut.mode).toBe('parcial');
    const sobre = JSON.parse(text);
    expect(sobre.pla.manifest.cursors.desDeSeqPerFil).toEqual({ [FIL_ROSA]: 950, [FIL_GRUP]: 0, [FIL_BUIT]: 0 });
    expect(sobre.pla.manifest.cursors.ultimSeqPerFil).toEqual({ [FIL_ROSA]: 1000, [FIL_GRUP]: 1, [FIL_BUIT]: 0 });
    /* La conversa sense cap missatge carregat hi continua anant (el text desaAbast ho promet). */
    expect(sobre.pla.dades.fils.map((f) => f.id).sort()).toEqual([FIL_ROSA, FIL_GRUP, FIL_BUIT].sort());
    expect(sobre.pla.dades.missatges).toHaveLength(51);
    /* La comprovació l'obri sencera. */
    const resultat = await importaCopiaSeguretatXat(text, { usuariIdEsperat: JO, tenantIdEsperat: TENANT, permetSenseXifrar: true });
    expect(resultat.fils).toHaveLength(3);
    expect(resultat.missatges).toHaveLength(51);
    /* Cap incremental no la pot prendre com a completa: les seq 1–950 no queden cobertes per cap còpia. */
    await expect(exportaCopiaSeguretatXatAmbRebut({ ...ABAST, fils: contingut.fils, missatges: [], base: rebut, permetSenseXifrar: true }))
      .rejects.toMatchObject({ codi: CODI_CADENA_DIVERGENT, motiu: 'base-parcial' });
  });

  test('R29-E2EE-03 · un forat al mig de les seq carregades (o un fil que no comença per la 1) també la fa parcial', () => {
    const ambForat = [...finestra(FIL_ROSA, 1, 50), ...finestra(FIL_ROSA, 120, 130)];
    expect(contingutDeLaCopia({ chatThreads: [filRosa], getThreadMessages: () => ambForat }).desDeSeqPerFil).toEqual({ [FIL_ROSA]: 0 });
    expect(contingutDeLaCopia({ chatThreads: [filRosa], getThreadMessages: () => finestra(FIL_ROSA, 2, 3) }).desDeSeqPerFil).toEqual({ [FIL_ROSA]: 1 });
    /* Un esborrat o un bloquejat carregats són a la cadena del servidor: no fan cap forat. */
    expect(contingutDeLaCopia({ chatThreads: [filRosa], getThreadMessages }).desDeSeqPerFil).toBeNull();
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
