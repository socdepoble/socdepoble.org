/* Porta Enxufe (E1, «El port és l'única porta cap al backend») · Les dues proves de /versions que es proven pel
   comportament de l'adaptador Supabase de veritat (content.js i storage.js) viuen ací, dins de src/data/supabase/:
   fora del port, cap mòdul no importa l'adaptador. Són les del bloc «R21 C5» de
   src/sections/text/pageContent.versions.test.js, traslladades sense canviar-ne la lògica: la frase de cada llengua
   és present si i només si el codi ho fa. Els ajudants de lectura del text (text, apartats, blocEn i INICIS_R21_C5)
   copien els d'aquell fitxer; les frases que proven (LECTURA_SENSE_MIGRACIONS_C5, NOTES_SENSE_2200_C5,
   METADADES_C5 i les seues negacions) només viuen ací. */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import { CODI_ESQUEMA_ABSENT } from '../errorsBackend.js';
import { PAGE_COPY } from '../../sections/text/pageContent.js';
import { localitzaPagina } from '../../sections/text/pageContent.r10.js';

const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
/* El text que es llig: un bloc (h3, h4, p…) és un espai; una etiqueta de línia (strong, code, a), res. */
const text = (fragment) => fragment
  .replace(/<\/?(?:h[1-6]|p|ul|ol|li|div|img)\b[^>]*>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ');
/* Els apartats d'una entrega: cada <h4> amb el <p> que el seguix. */
const apartats = (entrega) => [...entrega.matchAll(/<h4>([\s\S]*?)<\/h4>\n {6}<p>([\s\S]*?)<\/p>/g)]
  .map((m) => ({ titol: text(m[1]).trim(), cos: m[2] }));
const INICIS_R21_C5 = { ca: '13 de novembre de 2026 · Onada R21 (COMMIT 5)', es: '13 de noviembre de 2026 · Oleada R21 (COMMIT 5)',
  en: '13 November 2026 · Wave R21 (COMMIT 5)', eu: '2026ko azaroaren 13a · R21 olatua (COMMIT 5)', gl: '13 de novembro de 2026 · Onda R21 (COMMIT 5)' };

describe('R21 C5 · /versions diu el que fan content.js i storage.js, en les cinc llengües', () => {
  const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
  /* Onada R22, segona ronda (dades-01) · Sense cap migració, les quatre seccions es lligen com abans, i les tres
     migracions van, en ordre, abans del codi. Cap llengua no torna a dir que «no carreguen». */
  const LECTURA_SENSE_MIGRACIONS_C5 = {
    ca: 'Sense cap d’elles, el Mur, el Mercat, el Calendari i Multimèdia es lligen com abans, sense la lectura mínima; les tres s’han d’aplicar, en ordre, abans de publicar este codi.',
    es: 'Sin ninguna de ellas, el Muro, el Mercado, el Calendario y Multimedia se leen como antes, sin la lectura mínima; las tres deben aplicarse, en orden, antes de publicar este código.',
    en: 'Without any of them, the Wall, Market, Calendar and Media are read as before, without the minimal reading; all three must be applied, in order, before this code is published.',
    eu: 'Horietako bat ere gabe, Horma, Merkatua, Egutegia eta Multimedia lehen bezala irakurtzen dira, irakurketa minimorik gabe; hiru migrazioak ordenan aplikatu behar dira kode hau argitaratu aurretik.',
    gl: 'Sen ningunha delas, o Muro, o Mercado, o Calendario e Multimedia lense coma antes, sen a lectura mínima; as tres deben aplicarse, en orde, antes de publicar este código.'
  };
  const NO_CARREGUEN = /no carreguen|no cargan|do not load|ez dira kargatzen|non cargan/i;
  /* Onada R22, segona ronda (dades-01) · Sense 2611122200, el Bloc de Notes no publica res al Mur i ho diu. */
  const NOTES_SENSE_2200_C5 = {
    ca: 'També depén de la migració 2611122200: sense ella, el Bloc de Notes no publica res al Mur i ho diu.',
    es: 'También depende de la migración 2611122200: sin ella, el Bloc de Notas no publica nada en el Muro y lo dice.',
    en: 'It also depends on migration 2611122200: without it, the Notebook publishes nothing to the Wall and says so.',
    eu: '2611122200 migrazioaren mende ere badago: hura gabe, Koadernoak ez du ezer argitaratzen Horman, eta hala esaten du.',
    gl: 'Tamén depende da migración 2611122200: sen ela, o Caderno de Notas non publica nada no Muro e dío.'
  };
  /* Onada R22, segona ronda (dades-06, honestedat-06) · La còpia pública, neta de tota metadada llevat del que la
     casella de l'editor ha deixat conservar. La frase d'abans («netes de metadades de càmera i de lloc») ja no és certa.
     Tercera ronda (regressió del crític; carril dades3) · «Llevat de la ubicació, la data i la càmera» prometia més
     neteja de la que hi havia: preparaTiff hi tornava a posar el bloc EXIF sencer (descripció, programari, autoria,
     drets, números de sèrie, MakerNote). De la còpia pública només en poden quedar, si la persona ha triat
     conservar-les, la ubicació i la data (el GPS i les dates) i la marca i el model de la càmera; res més. */
  const METADADES_C5 = {
    ca: 'ixen netes de metadades: si la persona ha triat conservar-les, només hi poden quedar la ubicació i la data de la foto i la marca i el model de la càmera.',
    es: 'salen limpias de metadatos: si la persona ha elegido conservarlos, solo pueden quedar la ubicación y la fecha de la foto y la marca y el modelo de la cámara.',
    en: 'come out clean of metadata: if the person has chosen to keep it, only the photo’s location and date and the camera’s make and model can remain.',
    eu: 'metadaturik gabe ateratzen dira: pertsonak gordetzea aukeratu badu, argazkiaren kokapena eta data eta kameraren marka eta modeloa bakarrik gera daitezke.',
    gl: 'saen limpas de metadatos: se a persoa escolleu conservalos, só poden quedar a localización e a data da foto e a marca e o modelo da cámara.'
  };
  const METADADES_SEMPRE_NETES = /netes de metadades de càmera|limpias de metadatos de cámara|clean of camera and location|kamera eta kokapen metadaturik|limpas de metadatos de cámara/i;
  /* La promesa de la segona ronda, en cada llengua: no pot tornar mentre la còpia porte res més que el triat. */
  const NETES_DE_TOT_LLEVAT = /netes de tota metadada, llevat|limpias de todo metadato, salvo|clean of all metadata, except|metadatu guztiak kenduta|limpas de todo metadato, agás/i;
  const blocEn = (llengua) => {
    const cos = localitzaPagina(PAGE_COPY.versions, llengua).html.trimStart();
    expect([llengua, cos.startsWith(`<h3>${INICIS_R21_C5[llengua]}`)]).toEqual([llengua, true]);
    return cos.slice(0, cos.indexOf('<h3>', 1));
  };

  /* Onada R22 (honestedat-03), reescrita a la segona ronda (dades-01) · Provat pel comportament, amb el content.js
     de veritat i un servidor fals que encara no té cap funció de R21 (cada RPC respon 404 PGRST202): loadMur (Mur,
     Calendari i Mercat) i loadMultimedia llegixen com abans, de section_submissions, amb l'autoria de les columnes;
     i publicar una nota (publica_nota_al_mur, de 2611122200) no fa cap altra escriptura i falla amb
     CODI_ESQUEMA_ABSENT, que NotesContext mostra amb el motiu «servidor» (no s'ha publicat res). Per això el text ja
     no diu que les seccions «no carreguen»: diu que es lligen com abans, sense la lectura mínima, i que sense 2200 el
     Bloc de Notes no publica res al Mur i ho diu. Cada frase és present si i només si el codi ho fa. (La guarda de la
     primera ronda buscava `async function lligPublicacions` sense el parèntesi, trobava lligPublicacionsAnteriors i
     ja no podia dir res de la lectura.) */
  test('la dependència del Mur, sencera: sense cap migració les quatre seccions es lligen com abans, sense 2611122200 les Notes no publiquen i ho diuen, i les migracions van abans del codi', async () => {
    const TENANT = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
    const UID = '0f1e2d3c-4b5a-4968-8776-655443322110';
    const MOCKS = ['./runtime.js', './xat.js', './copublicacioMur.js'];
    const crides = [];
    const fila = (seccio) => ({ id: `6c7d8e9f-a0b1-4c2d-8e3f-${String(seccio.length).padStart(12, '0')}`, title: `Crònica ${seccio}`,
      created_at: '2026-11-01T10:00:00.000000+00:00', updated_at: '2026-11-01T10:00:00.000000+00:00', owner_user_id: UID, author_org_id: null,
      payload: { title: `Crònica ${seccio}`, content: '<p>Cos sencer</p>', author_name: 'Veïna' } });
    vi.resetModules();
    vi.doMock(MOCKS[0], () => ({
      getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: TENANT, runtimeDataMode: 'remote' }),
      getCurrentUser: () => ({ id: UID }), generateUUID: () => crypto.randomUUID(), buildSeedAppData: vi.fn(), mapContentRowsToData: vi.fn(),
      request: async (url, _config, opcions = {}) => {
        crides.push(url);
        if (url.includes('/rpc/')) throw Object.assign(new Error('Supabase 404'), { status: 404, postgrestCode: 'PGRST202' });
        if (url.includes('app_content')) return [];
        const seccio = /section_id=eq\.(\w+)/.exec(url)?.[1];
        opcions.onResponseMetadata?.({ contentRange: '0-0/1' });
        return seccio ? [fila(seccio)] : [];
      }
    }));
    vi.doMock(MOCKS[1], () => ({ enviaMissatge: vi.fn() }));
    vi.doMock(MOCKS[2], () => ({ drenaRevocacionsMur: vi.fn(async () => ({ pendents: 0, seguentIntent: null })), comprovaPublicacioNoRetirada: vi.fn(async () => {}) }));
    let llegixComAbans = false;
    let publicacioDiuEsquema = false;
    try {
      const { appendSectionSubmissionNetworkOnly, loadMultimedia, loadMur } = await import('./content.js');
      const mur = await loadMur('U', {});
      const media = await loadMultimedia('U', {});
      const elements = [...Object.values(mur).filter(Array.isArray).flat(), ...media.mediaItems];
      llegixComAbans = ['mur', 'events', 'mercat', 'multimedia'].every((seccio) => crides.some((url) => url.startsWith('/rest/v1/section_submissions?') && url.includes(`section_id=eq.${seccio}`)))
        && ['mur', 'events', 'mercat', 'multimedia'].every((seccio) => elements.some((element) => element?.id === fila(seccio).id && element?.ownerUserId === UID));
      crides.length = 0;
      const error = await appendSectionSubmissionNetworkOnly({ id: '44000000-0000-4000-8000-000000000001', noteId: '55000000-0000-4000-8000-000000000001',
        operationId: '66000000-0000-4000-8000-000000000001', expectedNoteRevision: 7, sectionId: 'mur', payload: { title: 'Bancal', content: '<p>Cos</p>' } })
        .then(() => null, (motiu) => motiu);
      publicacioDiuEsquema = error?.codi === CODI_ESQUEMA_ABSENT && crides.length === 1 && crides[0] === '/rest/v1/rpc/publica_nota_al_mur';
    } finally {
      for (const ruta of MOCKS) vi.doUnmock(ruta);
      vi.resetModules();
    }
    const notesHoDiuen = publicacioDiuEsquema
      && /error\?\.codi === CODI_ESQUEMA_ABSENT\) \{[\s\S]*?motiuPublicacioNoFeta\('servidor', t\)[\s\S]*?showToast\(motiu, 'error'\)/.test(llegix('src/sections/notes/NotesContext.jsx'));
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations'));
    for (const [id, funcio] of [['2611121430', /create or replace function public\.llig_mur_public\(/], ['2611122200', /create or replace function public\.llig_mur_membres\(/], ['2611122200', /create or replace function public\.publica_nota_al_mur\(/]]) {
      expect([id, funcio.test(llegix(`supabase/migrations/${migracions.find((nom) => nom.startsWith(`${id}_`))}`))]).toEqual([id, true]);
    }
    for (const llengua of LLENGUES) {
      const [mur, notes] = apartats(blocEn(llengua));
      const plaMur = text(mur.cos);
      expect([llengua, plaMur.includes(LECTURA_SENSE_MIGRACIONS_C5[llengua])]).toEqual([llengua, llegixComAbans]);
      if (llegixComAbans) expect([llengua, NO_CARREGUEN.test(plaMur)]).toEqual([llengua, false]);
      expect([llengua, text(notes.cos).includes(NOTES_SENSE_2200_C5[llengua])]).toEqual([llengua, notesHoDiuen]);
    }
  });

  /* Onada R22, segona ronda (dades-06, honestedat-06) · promouSenseMarc (storage.js) passa la còpia pública per
     netejaImatgePublica i hi torna a posar, amb ambExifTriat, el bloc EXIF del fitxer privat: el que la casella de
     l'editor («Conserva la ubicació i la data de la foto» o «Conserva les dades de la càmera de la foto») ha deixat
     conservar. Només ho crida la publicació d'una nota al Mur (NotesContext).
     Tercera ronda (regressió del crític; carril dades3) · La guarda d'abans mirava la forma del codi
     (preparaTiff(extreuTiff(original))) i no el que ix: el bloc passava sencer i el text deia «llevat de la ubicació,
     la data i la càmera». Ara es prova pel comportament, amb el promoteToPublic de veres i un Storage fals, en els dos
     modes de la casella (la de la ubicació i la data, i la de la càmera quan la foto no porta ni ubicació ni data): un
     JPEG privat amb el bloc que la casella deixa (preparaTiff) i, dins, a més del que la casella nomena, descripció,
     programari, autoria, drets, propietari i número de sèrie. La frase és una cota («només hi poden quedar»): és
     present si i només si la còpia pujada porta, en cada mode, el que la casella nomena (el GPS i la data; la marca i
     el model) i cap dels altres camps. Mentre en porte cap altre, cap llengua no pot tornar a dir «netes de tota
     metadada, llevat de…». */
  test('les metadades de les còpies públiques: si la persona les conserva, només hi poden quedar la ubicació, la data, la marca i el model', async () => {
    const MOCKS = ['./runtime.js', '../identitat.js', './config.js'];
    const DIR = '11000000-0000-4000-8000-000000000001/33000000-0000-4000-8000-000000000001/notes/';
    const { tiff, gpsTorre, app1Exif, concatena, TIPUS } = await import('../../../tests/helpers/jpegProva.js');
    const { JPEG_NET } = await import('../../../tests/helpers/mitjansPublicsNets.js');
    const { preparaTiff } = await import('../../components/universal/enquadrament/exifIncrustat.js');
    const { llegixExif } = await import('../../components/universal/enquadrament/exif.js');
    const ascii = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
    const latin1 = (bytes) => new TextDecoder('latin1').decode(bytes);
    const DATA = '2026:10:16 10:00:00';
    const ALTRES = ['DESCRIPCIO-PRIVADA', 'PROGRAMARI-PRIVAT', 'AUTORIA-PRIVADA', 'DRETS-PRIVATS', 'PROPIETARI-PRIVAT', 'SERIE-PRIVADA'];
    const altres0 = [ascii(0x010e, ALTRES[0]), ascii(0x0131, ALTRES[1]), ascii(0x013b, ALTRES[2]), ascii(0x8298, ALTRES[3])];
    const altresExif = [ascii(0xa430, ALTRES[4]), ascii(0xa431, ALTRES[5])];
    const camera = [ascii(0x010f, 'MARCA-PROVA'), ascii(0x0110, 'MODEL-PROVA')];
    // La casella de la ubicació i la data (la foto en porta), i la de la càmera (la foto només porta la càmera).
    const MODES = {
      ubicacio: preparaTiff(tiff({ ifd0: [...altres0, ...camera, ascii(0x0132, DATA)], exif: [ascii(0x9003, DATA), ...altresExif], gps: gpsTorre() })),
      camera: preparaTiff(tiff({ ifd0: [...altres0, ...camera], exif: altresExif }))
    };
    // El bloc que el diàleg desa al fitxer privat porta tot això: si no, la prova no diria res.
    for (const [mode, bloc] of Object.entries(MODES)) {
      expect([mode, bloc instanceof Uint8Array, ALTRES.every((valor) => latin1(bloc).includes(valor))]).toEqual([mode, true, true]);
    }
    const pujats = new Map();
    let privat = null;
    const publicats = {};
    vi.resetModules();
    vi.doMock(MOCKS[0], () => ({ getResolvedConfig: (config) => config }));
    vi.doMock(MOCKS[1], () => ({ usuariDeSessio: () => null, capturaSessio: () => () => {} }));
    vi.doMock(MOCKS[2], () => ({ getClient: async () => ({ storage: { from: (bucket) => ({
      download: async () => ({ data: bucket === 'mitjans_privats' ? privat : null, error: null }),
      upload: async (path, blob) => { pujats.set(`${bucket}/${path}`, blob); return { data: { path }, error: null }; }
    }) } }) }));
    try {
      const { promoteToPublic } = await import('./storage.js');
      for (const [mode, bloc] of Object.entries(MODES)) {
        privat = new Blob([concatena(JPEG_NET.subarray(0, 2), app1Exif(bloc), JPEG_NET.subarray(2))], { type: 'image/jpeg' });
        const ref = await promoteToPublic(`sdp-media://mitjans_privats/${DIR}${mode}.jpg`);
        const blob = pujats.get(String(ref).replace('sdp-media://', ''));
        publicats[mode] = blob ? new Uint8Array(await blob.arrayBuffer()) : null;
      }
    } finally {
      for (const ruta of MOCKS) vi.doUnmock(ruta);
      vi.resetModules();
    }
    expect([publicats.ubicacio instanceof Uint8Array, publicats.camera instanceof Uint8Array]).toEqual([true, true]);
    const conservaElTriat = llegixExif(publicats.ubicacio).gps != null && latin1(publicats.ubicacio).includes(DATA)
      && ['MARCA-PROVA', 'MODEL-PROVA'].every((valor) => latin1(publicats.camera).includes(valor));
    const resMes = Object.values(publicats).every((bytes) => ALTRES.every((valor) => !latin1(bytes).includes(valor)));
    const casella = CA['editor.enquadrament.exifEtiqueta'] === 'Conserva la ubicació i la data de la foto'
      && CA['editor.enquadrament.exifEtiquetaCamera'] === 'Conserva les dades de la càmera de la foto';
    expect(llegix('src/sections/notes/NotesContext.jsx')).toMatch(/await promoteToPublic\(finalHeroImage, config\)/);
    for (const llengua of LLENGUES) {
      const pla = text(apartats(blocEn(llengua))[0].cos);
      expect([llengua, pla.includes(METADADES_C5[llengua])]).toEqual([llengua, conservaElTriat && resMes && casella]);
      if (!resMes) expect([llengua, NETES_DE_TOT_LLEVAT.test(pla)]).toEqual([llengua, false]);
      if (conservaElTriat) expect([llengua, METADADES_SEMPRE_NETES.test(pla)]).toEqual([llengua, false]);
    }
  });
});
