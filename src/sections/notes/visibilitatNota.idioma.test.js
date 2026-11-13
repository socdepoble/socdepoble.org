import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
/**
 * P1-22 (marató 261101_2143, B3-I18N §3.A) · El selector de visibilitat del
 * Bloc en la llengua de l'app. Amb el traductor de veres (createTranslator,
 * amb els cinc diccionaris), cada text ix traduït i amb els marcadors
 * resolts; sense traductor, el valencià de sempre i els mateixos objectes; i
 * el traductor valencià pinta, lletra per lletra, el mateix que les reserves
 * (Llei del Píxel).
 *
 * Després, el cablejat dels tres consumidors, que passen `t` al mòdul pur: el
 * lector d'una connexió (ConnexioDetall, que abans deia el rebuig per les
 * normes sempre en valencià), l'editor del Bloc (NotesEditor) i el proveïdor
 * (NotesProvider, el de veres). Correcció ARB-M05-01: sense estes proves,
 * llevar un sol `t` d'un consumidor passava en verd.
 */
import { createElement } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
/* Sense els diccionaris carregats, createTranslator('en') tornaria el valencià i la prova passaria en buit. */
import '../../../tests/helpers/diccionaris.js';

/* Només per als consumidors (els tres últims describe): el mòdul pur no en depén. */
const mocks = vi.hoisted(() => ({
  t: null, user: { id: 'U' }, actor: { tipus: 'persona', id: 'U', nom: 'Pep' },
  selector: null, carpeta: null, adapter: null, toast: vi.fn(), send: vi.fn(), feed: [],
  notes: { noteFolders: [], setLocalNoteField: null, mouNota: null, esborraNota: null, compartirNota: null, potEsborrar: false, config: {} },
  dades: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => () => {}, Link: ({ children }) => children }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ t: mocks.t, normalizeSearchText: (text) => text })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.user }), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => ({ actor: mocks.actor }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
/* El lector i l'editor lligen useNotes d'ací; el proveïdor de veres es carrega a part (vi.importActual). */
vi.mock('./NotesContext.jsx', () => ({ useNotes: () => mocks.notes, etiquetesDeNota: () => [] }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => mocks.dades }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: mocks.feed, events: [], marketItems: [], sendSectionSubmission: mocks.send }) }));
/* Com NotesContext.test.jsx: el gestor de desament amb una persistència en memòria. */
vi.mock('./GlobalSaveManager.js', async (importOriginal) => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));
vi.mock('../detail/elementDeSeccio.js', () => ({ paginaDElement: () => ({}), useOriginalDeConnexio: () => ({ estat: 'absent' }) }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => createElement('div', null, children) }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../components/universal/SelectorVisibilitat.jsx', () => ({ SelectorVisibilitat: (props) => { mocks.selector = props; return null; } }));
vi.mock('../../components/universal/classificacio/DialegCarpeta.jsx', async (importOriginal) => ({ ...(await importOriginal()), DialegCarpeta: (props) => { mocks.carpeta = props; return null; } }));

import {
  AVIS_DRETS_RESERVATS, ErrorPublicacio, MOTIU_NORMES, MUR_PUBLIC_FILTRAT, avisDretsReservats, bloqueigDeNota, motiuDesatPendent,
  motiuModeLocal, motiuSignaturaAliena, publicaAmbMotiu, textosAmbDrets, textosDeNota, textosExtern
} from './visibilitatNota.js';
import { TEXTOS_RETIRADA, bloqueigDeNota as bloqueigAmbRetirada, errorDeRetirada, textosEnLiniaDeNota } from './visibilitatNota.js';
import { TEXTOS_ESBORRAR_PUBLICADA } from './DialegEsborrarNota.jsx';
import CA_DIC from '../../config/idiomes/ca.js';
import ES_DIC from '../../config/idiomes/es.js';
import EN_DIC from '../../config/idiomes/en.js';
import EU_DIC from '../../config/idiomes/eu.js';
import GL_DIC from '../../config/idiomes/gl.js';
import { ConnexioDetall } from './ConnexioDetall.jsx';
import NotesEditor from './NotesEditor.jsx';

const CA = createTranslator('ca');
const EN = createTranslator('en');
const EU = createTranslator('eu');
const ALTRES = SUPPORTED_LANGUAGES.map(({ code }) => code).filter((codi) => codi !== 'ca');
const textos = (objecte) => Object.values(objecte || {}).flatMap((valor) => (typeof valor === 'string' ? [valor] : (valor && typeof valor === 'object' ? textos(valor) : [])));
const REBUIG_NORMES = 'Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes de convivència."}';
/* Els textos anglesos que diuen els consumidors (els mateixos que les proves del mòdul pur). */
const EN_NORMES = 'To post, you need to accept the community guidelines.';
const EN_XARXA = 'Could not publish to the Wall.';
const EN_LOCAL = 'Note saved on this device. Connect a backend to publish to the Wall.';
const EN_LOCAL_CONNEXIO = 'Connection saved on this device. Connect a backend to share it to the Wall.';
const EN_PUBLICADA = 'Removing a note from the Wall has no data contract with the server yet: you can update it, but not make it private again.';
/* D1 Opció A (261112) · Darrere de publicar o compartir, qui ho pot llegir; amb MUR_PUBLIC_FILTRAT, la versió pública. */
const EN_DARRERE = MUR_PUBLIC_FILTRAT
  ? 'Anyone, even without an account, can read the filtered anonymous version. Town members can read the complete publication. Without an account, a filtered version shows the title, available public text and date, without photos, links or signature. The anonymous version never exposes internal identifiers, private contact details or photo locations.'
  : 'Anyone can read it, even without an account.';
const EU_DARRERE = MUR_PUBLIC_FILTRAT
  ? 'Edonork irakur dezake bertsio anonimo iragazia, konturik gabe ere. Herriko kideek argitalpen osoa irakur dezakete. Konturik gabe bertsio iragaziak izenburua, eskuragarri dagoen testu publikoa eta data erakusten ditu, argazki, esteka eta sinadurarik gabe. Bertsio anonimoak ez du inoiz barne-identifikatzailerik, harremanetarako datu pribaturik edo argazkien kokapenik erakusten.'
  : 'Edonork irakur dezake, konturik gabe ere.';

describe('textosDeNota · «Qui pot vore esta nota?»', () => {
  test('en anglés, la nota sencera amb la mateixa forma', () => {
    expect(textosDeNota({ t: EN })).toEqual({
      titol: 'Who can see this note?',
      descripcio: 'Until you publish it, the note is yours alone. Publishing it takes it to the town’s Wall.',
      llegenda: 'Note visibility',
      publica: {
        etiqueta: 'Published on the Wall',
        /* D1 Opció A (261112) · on ix i, darrere, qui ho pot llegir. */
        explicacio: `It appears on the town’s Wall. ${EN_DARRERE}`,
        accio: 'Publish to the Wall',
        accioIgual: 'Update on the Wall',
      },
      privada: {
        etiqueta: 'Private (only visible to you)',
        explicacio: 'With the padlock, only you see it in your Notebook: write and try out whatever you like.',
        accio: 'Keep it private',
        accioIgual: 'Keep it private',
      },
      reversible: null,
      irreversible: 'Once on the Wall, it cannot be removed yet: you will be able to update it, but not make it private again.',
      avisPublica: null,
    });
  });

  test('en basc, la connexió sencera; les accions de compartir són les claus del botó del lector', () => {
    expect(textosDeNota({ connexio: true, t: EU })).toEqual({
      titol: 'Nork ikus dezake eduki hau?',
      // Gauntlet R22 (notes-06) · jatorria eta esteka, ez egilea (el Mur no cita el nom de qui signa l'original).
      descripcio: 'Besteren edukia da: zure oharretan irakurri eta karpetaz alda dezakezu, eta zure kopia gisa edita dezakezu; partekatzeak zure Hormara eramaten du, jatorria eta esteka aipatuz.',
      llegenda: 'Edukiaren ikusgarritasuna',
      publica: {
        etiqueta: 'Zure Horman partekatua',
        explicacio: `Zure Horman agertzen da, jatorria aipatuz. ${EU_DARRERE}`,
        accio: EU('section.notes.connexio.mur.comparteix'),
        accioIgual: EU('section.notes.connexio.mur.actualitza'),
      },
      privada: {
        etiqueta: 'Pribatua (zuk bakarrik ikus dezakezu)',
        explicacio: 'Giltzarrapoarekin, zuk bakarrik ikusten duzu, zure Koadernoan ordenatuta eta etiketatuta.',
        accio: 'Pribatu utzi',
        accioIgual: 'Pribatu utzi',
      },
      reversible: null,
      irreversible: 'Horman dagoenean, oraindik ezin da kendu: eguneratu ahal izango duzu, baina ez berriro pribatu egin.',
      avisPublica: null,
    });
    expect(EU('section.notes.connexio.mur.comparteix')).toBe('Partekatu Horman');
  });

  test('sense traductor, els mateixos objectes de sempre; amb traductor, un de nou, també congelat', () => {
    for (const connexio of [false, true]) {
      const base = textosDeNota({ connexio });
      for (const senseT of [null, undefined, 'en', {}]) expect(textosDeNota({ connexio, t: senseT })).toBe(base);
      const traduit = textosDeNota({ connexio, t: EN });
      expect(traduit).not.toBe(base);
      expect([traduit, traduit.publica, traduit.privada].every(Object.isFrozen)).toBe(true);
    }
    expect(textosExtern()).toBe(textosExtern(null));
  });

  test('Llei del Píxel · el traductor valencià pinta exactament les reserves', () => {
    for (const connexio of [false, true]) expect(textosDeNota({ connexio, t: CA })).toEqual(textosDeNota({ connexio }));
    expect(textosExtern(CA)).toEqual(textosExtern());
    expect(avisDretsReservats(CA)).toBe(AVIS_DRETS_RESERVATS);
    const casos = [{ modeLocal: true }, { modeLocal: true, connexio: true }, { foraster: true }, { publicada: true },
      { preparada: true }, { preparada: 'enviant' }, { preparada: 'error' }, { preparada: 'pendent' }];
    for (const cas of casos) expect(bloqueigDeNota({ ...cas, t: CA })).toEqual(bloqueigDeNota(cas));
    expect(motiuSignaturaAliena('', CA)).toBe(motiuSignaturaAliena(''));
    expect(motiuDesatPendent('Hi ha un conflicte.', CA)).toBe(motiuDesatPendent('Hi ha un conflicte.'));
    expect(motiuDesatPendent('', CA)).toBe(motiuDesatPendent(''));
  });

  test.each(ALTRES)('%s: cap text del selector, de la nota ni de la connexió, no es queda en valencià', (codi) => {
    const t = createTranslator(codi);
    for (const connexio of [false, true]) {
      const valencians = textos(textosAmbDrets(textosDeNota({ connexio }), true));
      const traduits = textos(textosAmbDrets(textosDeNota({ connexio, t }), true, t));
      expect(traduits).toHaveLength(valencians.length);
      expect(traduits.filter((text, i) => text === valencians[i])).toEqual([]);
    }
    expect(textosExtern(t).descripcio).not.toBe(textosExtern().descripcio);
  });
});

/* F03-UI (Onada R21) · Retirar del Mur: cada text nou té valor propi en les
   cinc llengües (paritat de claus), la reserva és el valencià del diccionari
   (Llei del Píxel) i cap no es queda en valencià en una altra llengua. */
describe('F03-UI · retirar del Mur en les cinc llengües', () => {
  const DICS = { ca: CA_DIC, es: ES_DIC, en: EN_DIC, eu: EU_DIC, gl: GL_DIC };
  const PARELLS = [
    ...Object.values(TEXTOS_RETIRADA),
    ...Object.values(TEXTOS_ESBORRAR_PUBLICADA),
    ['section.notes.visibilitat.nota.reversible', textosDeNota({ retirable: true }).reversible],
    ['section.notes.visibilitat.connexio.reversible', textosDeNota({ connexio: true, retirable: true }).reversible],
    ['section.notes.visibilitat.motiu.retiraDesDelBloc', bloqueigAmbRetirada({ publicada: true, retirada: 'bloc' }).motiu],
    ['section.notes.visibilitat.motiu.retiraDesDelBlocConnexio', bloqueigAmbRetirada({ publicada: true, connexio: true, retirada: 'bloc' }).motiu],
    ['section.notes.visibilitat.motiu.retiraSenseNota', bloqueigAmbRetirada({ publicada: true, retirada: 'senseNota' }).motiu],
  ];

  test.each(PARELLS.map(([clau]) => clau))('%s: valor propi en cada llengua', (clau) => {
    for (const [codi, dic] of Object.entries(DICS)) {
      expect(typeof dic[clau], `${codi}/${clau}`).toBe('string');
      expect(dic[clau].trim(), `${codi}/${clau}`).not.toBe('');
    }
  });

  test('Llei del Píxel · cada reserva és el valencià del diccionari', () => {
    for (const [clau, reserva] of PARELLS) expect(CA_DIC[clau], clau).toBe(reserva);
    expect(textosEnLiniaDeNota({ retirable: true, t: CA })).toEqual(textosEnLiniaDeNota({ retirable: true }));
    expect(textosDeNota({ connexio: true, retirable: true, t: CA })).toEqual(textosDeNota({ connexio: true, retirable: true }));
  });

  test.each(ALTRES)('%s: la confirmació, els errors i els avisos de la retirada, traduïts', (codi) => {
    const t = createTranslator(codi);
    for (const cas of [{}, { seccio: 'mercat' }, { connexio: true }, { extern: true }]) {
      const valencia = textosEnLiniaDeNota({ ...cas, retirable: true });
      const traduit = textosEnLiniaDeNota({ ...cas, retirable: true, t });
      for (const camp of ['avis', 'accio', 'feta']) expect(traduit.retirada[camp], `${codi}/${camp}`).not.toBe(valencia.retirada[camp]);
      expect(traduit.reversible).not.toBe(valencia.reversible);
      expect(traduit.irreversible).toBeNull();
    }
    for (const [clau, reserva] of Object.values(TEXTOS_RETIRADA)) expect(t(clau, reserva), `${codi}/${clau}`).not.toBe(reserva);
    expect(bloqueigAmbRetirada({ publicada: true, retirada: 'senseNota', t }).motiu).not.toBe(bloqueigAmbRetirada({ publicada: true, retirada: 'senseNota' }).motiu);
    for (const [clau, reserva] of Object.values(TEXTOS_ESBORRAR_PUBLICADA)) expect(t(clau, reserva), `${codi}/${clau}`).not.toBe(reserva);
    expect(errorDeRetirada({ revocacioPendent: true }, t).message).toBe(t(TEXTOS_RETIRADA.pendent[0], TEXTOS_RETIRADA.pendent[1]));
  });
});

describe('els motius i els errors de publicar', () => {
  test('bloqueigDeNota: cada motiu en anglés, amb el mateix ordre de sempre', () => {
    expect(bloqueigDeNota({ preparada: 'enviant', t: EN })).toEqual({
      opcio: 'publica', motiu: 'The note is being created on the server. In a moment you will be able to publish it to the Wall.'
    });
    expect(bloqueigDeNota({ modeLocal: true, connexio: true, t: EN })).toEqual({ opcio: 'publica', motiu: EN_LOCAL_CONNEXIO });
    expect(bloqueigDeNota({ preparada: 'error', modeLocal: true, t: EN }).motiu).toBe(motiuModeLocal({ t: EN }));
    expect(motiuModeLocal({ t: EN })).toBe(EN_LOCAL);
    expect(bloqueigDeNota({ foraster: true, t: EN }).motiu).toBe('Sign in to your account to publish the note to the Wall.');
    expect(bloqueigDeNota({ publicada: true, t: EN })).toEqual({ opcio: 'privada', motiu: EN_PUBLICADA });
    // Un estat desconegut cau en el motiu de sempre, també traduït.
    expect(bloqueigDeNota({ preparada: 'toString', t: EN }).motiu).toBe('Write something in the note so you can publish it to the Wall.');
    expect(bloqueigDeNota({ t: EN })).toBeNull();
  });

  test('motiuSignaturaAliena: la identitat desconeguda traduïda, i el nom es pinta tal qual', () => {
    expect(motiuSignaturaAliena('', EU)).toBe('Argitalpen honen sinatzailea beste identitate bat da: aldatu identitate horretara eguneratzeko.');
    expect(motiuSignaturaAliena('Forn de la Torre', EN)).toBe('This post is signed by Forn de la Torre: switch to that identity to update it.');
    // omple() fa una sola passada amb funció: ni «$&» ni un altre buit del nom no es tornen a omplir.
    expect(motiuSignaturaAliena('Bar $& {qui}', EN)).toBe('This post is signed by Bar $& {qui}: switch to that identity to update it.');
  });

  test('motiuDesatPendent: amb el detall de la ploma, i sense', () => {
    expect(motiuDesatPendent('Hi ha un conflicte.', EN)).toBe('It cannot be published until the changes are saved. Hi ha un conflicte.');
    expect(motiuDesatPendent('', EN)).toBe('It cannot be published until the pending changes are saved. Try again in a moment.');
  });

  test('publicaAmbMotiu: la xarxa i les normes en la llengua de t; un motiuNormes explícit i un ErrorPublicacio manen', async () => {
    const xarxa = 'Could not publish to the Wall. Try again: if it had already arrived, the same post will be updated, with no duplicates.';
    await expect(publicaAmbMotiu(async () => false, { t: EN })).rejects.toThrow(xarxa);
    await expect(publicaAmbMotiu(async () => { throw new TypeError('Failed to fetch'); }, { t: EN })).rejects.toThrow(xarxa);
    const normes = vi.fn().mockRejectedValue(new Error(REBUIG_NORMES));
    await expect(publicaAmbMotiu(normes, { t: EN })).rejects.toThrow(EN('section.moderacio.normes.calAcceptar'));
    expect(EN('section.moderacio.normes.calAcceptar')).toBe(EN_NORMES);
    expect(EN_NORMES).not.toBe(MOTIU_NORMES);
    await expect(publicaAmbMotiu(normes, { t: EN, motiuNormes: 'Hay que aceptar las normas.' })).rejects.toThrow('Hay que aceptar las normas.');
    const motiu = 'Un motiu que ja ve dit.';
    await expect(publicaAmbMotiu(async () => { throw new ErrorPublicacio(motiu); }, { t: EN })).rejects.toThrow(motiu);
    await expect(publicaAmbMotiu(async () => true, { t: EN })).resolves.toBe(true);
  });

  test('els drets reservats i el contingut de fora, en anglés', () => {
    // Gauntlet R22 (notes-06) · source, link and rights of the original; not the authorship.
    const avis = 'Content with all rights reserved. You can connect it for yourself. If you republish it, its source, link and the rights of the original will be cited; do not copy the whole content without permission from whoever signs it.';
    expect(avisDretsReservats(EN)).toBe(avis);
    const base = textosDeNota({ connexio: true, t: EN });
    expect(textosAmbDrets(base, true, EN).descripcio).toBe(`${base.descripcio} ${avis}`);
    expect(textosAmbDrets(base, false, EN)).toBe(base);
    const extern = textosExtern(EN);
    expect(extern.descripcio).toBe('This outside content is your own copy: you can edit it, and sharing it takes it to your Wall citing its source.');
    expect({ ...extern, descripcio: base.descripcio }).toEqual(base);
    expect(textosExtern().descripcio).toBe('Este contingut de fora és una còpia teua: el pots editar, i compartir-lo el porta al teu Mur citant-ne l’origen.');
  });
});

/* El lector d'una connexió (ConnexioDetall): el selector rep els textos
   traduïts i, quan el servidor rebutja per les normes, el motiu ix en la
   llengua de l'app. Abans no passava `t` ni `motiuNormes` a publicaAmbMotiu,
   i el rebuig eixia en valencià en totes les llengües (B3-I18N §0.5). */
describe('ConnexioDetall · el selector i el rebuig per les normes en la llengua de l’app', () => {
  const ORIGEN = { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta', objecte: 'producte' };
  const NOTA = { id: 'n-9', title: 'Samarreta', folderId: 'f-mur', content: '<p>Element connectat.</p>', origen: ORIGEN };

  afterEach(cleanup);
  beforeEach(() => {
    mocks.selector = null;
    mocks.carpeta = null;
    mocks.user = { id: 'U' };
    mocks.notes = {
      noteFolders: [], potEsborrar: false, config: {}, setLocalNoteField: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(),
      compartirNota: vi.fn().mockRejectedValue(new Error(REBUIG_NORMES))
    };
  });

  test('en anglés: textos, rebuig per les normes, error de xarxa i noms de les carpetes de sèrie', async () => {
    globalThis.indexedDB = creaIdbFalsEstructurat();
    mocks.t = EN;
    render(createElement(ConnexioDetall, { nota: NOTA }));
    expect(screen.getByRole('button', { name: 'Share to the Wall' })).toBeTruthy();
    expect(mocks.selector.textos).toEqual(textosDeNota({ connexio: true, t: EN }));
    expect(mocks.selector.textos.titol).toBe('Who can see this content?');
    expect(mocks.selector.bloqueig).toBeNull();
    await expect(mocks.selector.onTria(true)).rejects.toThrow(EN_NORMES);
    mocks.notes.compartirNota.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(mocks.selector.onTria(true)).rejects.toThrow(EN_XARXA);
    // T5 · P1-22 (261102, kit de Codex): «Carpeta:» ja es traduïx (section.notes.connexio.carpeta); el nom de la carpeta de sèrie també.
    fireEvent.click(screen.getByRole('button', { name: 'Folder: Wall' }));
    expect(mocks.carpeta.opcions).toEqual(expect.arrayContaining([{ id: 'f-mur', nom: 'Wall' }, { id: 'f-connectats', nom: 'Safata d’Entrada' }]));
    expect(mocks.carpeta.seleccionada).toBe('f-mur');
  });

  /* ARB-M05-01 (C11) · El bloqueig només arriba al selector si es pot compartir:
     amb sessió i amb Mur. Sense sessió o en local el botó no ix; per això el cas
     que el mostra és una connexió ja compartida («privada» bloquejada). */
  test('una connexió ja compartida, en anglés: el botó d’actualitzar i el motiu de no retirar-la', () => {
    globalThis.indexedDB = creaIdbFalsEstructurat();
    mocks.t = EN;
    render(createElement(ConnexioDetall, { nota: { ...NOTA, isPublished: true } }));
    expect(screen.getByRole('button', { name: 'Update on the Wall' })).toBeTruthy();
    expect(mocks.selector.bloqueig).toEqual({ opcio: 'privada', motiu: EN_PUBLICADA });
  });

  /* F03-UI (Onada R21) · Amb la capacitat de retirar, este lector continua
     sense retirar-la (el seu selector és la finestra SelectorVisibilitat; la
     retirada viu a l'editor del Bloc), però el motiu ja no diu «encara no té
     contracte»: diu on es fa. */
  test('F03-UI · amb la capacitat de retirar, el lector diu on es retira, en anglés', () => {
    globalThis.indexedDB = creaIdbFalsEstructurat();
    mocks.t = EN;
    mocks.notes = { ...mocks.notes, potRetirarDelMur: true };
    render(createElement(ConnexioDetall, { nota: { ...NOTA, isPublished: true } }));
    expect(mocks.selector.bloqueig).toEqual({
      opcio: 'privada', motiu: 'It cannot be removed from this reader: open the content in the editor of your Notebook to remove it from the Wall. Here you can only update it.'
    });
    expect(mocks.selector.bloqueig.motiu).not.toBe(EN_PUBLICADA);
  });

  test('amb un traductor que torna la reserva, el valencià de sempre', async () => {
    mocks.t = (_clau, reserva) => reserva;
    render(createElement(ConnexioDetall, { nota: { ...NOTA, isPublished: true } }));
    expect(mocks.selector.textos).toEqual(textosDeNota({ connexio: true }));
    expect(mocks.selector.bloqueig).toEqual(bloqueigDeNota({ publicada: true, connexio: true }));
    await expect(mocks.selector.onTria(true)).rejects.toThrow(MOTIU_NORMES);
  });
});

/* L'editor del Bloc (NotesEditor) llig `t` de useNotes i el passa al bloqueig,
   als textos del selector (nota pròpia i contingut de fora), al rebuig de
   publicar i als noms de les carpetes de sèrie. Fins a P1-22 traduïa el
   rebuig per les normes amb un motiuNormes propi: ara només depén del `t`. */
describe('NotesEditor · el selector, els motius i les carpetes en la llengua de l’app', () => {
  const TENANT = '00000000-0000-4000-8000-0000000000a1';
  const NOTA = Object.freeze({ id: 'n1', folderId: 'f-mur', categories: [], tags: [], title: 'Fira' });
  const publica = vi.fn();
  const compartir = vi.fn();
  const pinta = (nota, config = { tenantId: TENANT }) => {
    mocks.notes = {
      noteFolders: [], t: EN, config, workspaceKey: TENANT, notes: [], setLocalNoteField: vi.fn(), notesComplete: true,
      mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false, publishNote: publica, compartirNota: compartir, scopeKey: undefined
    };
    return render(createElement(NotesEditor, { activeNote: nota }));
  };

  afterEach(cleanup);
  beforeEach(() => {
    mocks.adapter = null;
    mocks.carpeta = null;
    mocks.user = { id: 'U' };
    globalThis.indexedDB = creaIdbFalsEstructurat();
    mocks.t = EN;
    publica.mockReset();
    compartir.mockReset();
  });

  test('una nota pròpia: els textos, el rebuig per les normes, la xarxa i la carpeta de sèrie', async () => {
    pinta(NOTA);
    const { visibilitat } = mocks.adapter;
    expect(visibilitat.textos).toEqual(textosDeNota({ t: EN }));
    expect(visibilitat.textos.titol).toBe('Who can see this note?');
    expect(visibilitat.bloqueig).toBeNull();
    publica.mockRejectedValueOnce(new Error(REBUIG_NORMES));
    await expect(visibilitat.onTria(true, NOTA)).rejects.toThrow(EN_NORMES);
    publica.mockResolvedValueOnce(false);
    await expect(visibilitat.onTria(true, NOTA)).rejects.toThrow(EN_XARXA);
    expect(publica).toHaveBeenCalledTimes(2);
    // La classificació en línia (AH-16, r49) pinta el nom de sèrie traduït al selector de carpeta i hi desa l'id de sempre.
    const { container } = render(mocks.adapter.classificacio);
    const opcions = [...container.querySelectorAll('option')];
    const carpeta = opcions.find((opcio) => opcio.textContent === 'Wall');
    expect(carpeta, opcions.map((opcio) => `${opcio.value}=${opcio.textContent}`).join(' | ')).toBeDefined();
    expect(carpeta.getAttribute('value')).toBe('f-mur');
    expect(opcions.some((opcio) => opcio.getAttribute('value') === 'f-connectats' && opcio.textContent === 'Safata d’Entrada')).toBe(true);
    expect(container.querySelector('select').value).toBe('f-mur');
  });

  test('els motius del bloqueig: en mode local i amb la nota ja publicada', () => {
    const vista = pinta(NOTA, { tenantId: TENANT, dataMode: 'local' });
    expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: EN_LOCAL });
    vista.unmount();
    pinta({ ...NOTA, isPublished: true });
    expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'privada', motiu: EN_PUBLICADA });
  });

  test('un contingut de fora: la descripció de la còpia teua i el motiu de compartir, traduïts', () => {
    const extern = { ...NOTA, id: 'x1', origen: { tipus: 'extern', url: 'https://exemple.org/recepta', lloc: 'exemple.org' } };
    const vista = pinta(extern);
    expect(mocks.adapter.visibilitat.textos).toEqual(textosExtern(EN));
    expect(mocks.adapter.visibilitat.textos.descripcio).toBe('This outside content is your own copy: you can edit it, and sharing it takes it to your Wall citing its source.');
    vista.unmount();
    pinta(extern, { tenantId: TENANT, dataMode: 'local' });
    expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: EN_LOCAL_CONNEXIO });
  });
});

/* El proveïdor del Bloc (NotesProvider, el de veres) diu en la llengua de
   l'app els motius de no publicar que publishNote dona pel toast i per
   ErrorPublicacio (el selector els diu en línia). */
describe('NotesProvider · els motius de no publicar en la llengua de l’app', () => {
  let NotesProvider;
  let useNotes;
  const PEP = Object.freeze({ tipus: 'persona', id: 'u-pep', rol: 'persona' });
  /* Com elementDeFilaPublicada (mapejadorSeccions.js): l'autoria, de les columnes. */
  const delForn = (id) => ({ id, title: 'Pa de cada dia', ownerUserId: 'u-pep', author_org_id: 'org-forn', authorOrgId: 'org-forn', author_name: 'Forn de la Torre' });
  const update = vi.fn();
  const publicaAmb = async (nota, opcions) => {
    const { result } = renderHook(() => useNotes(), { wrapper: NotesProvider });
    let resultat;
    await act(async () => { resultat = await result.current.publishNote(nota, opcions).catch((error) => error); });
    return resultat;
  };

  beforeAll(async () => {
    ({ NotesProvider, useNotes } = await vi.importActual('./NotesContext.jsx'));
  });
  afterEach(cleanup);
  beforeEach(() => {
    globalThis.indexedDB = creaIdbFalsEstructurat();
    mocks.t = EN;
    mocks.user = { id: 'U' };
    mocks.actor = { tipus: 'persona', id: 'U', nom: 'Pep' };
    mocks.feed = [];
    mocks.toast.mockReset();
    mocks.send.mockReset().mockResolvedValue(undefined);
    update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: (revision ?? 1) + 1 }));
    mocks.dades = {
      notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
      status: 'ready', updateNote: update, confirmaPublicacioNota: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn()
    };
  });

  test('en mode local: el motiu de la nota i el de la connexió, al toast i a l’error', async () => {
    mocks.dades.config = { tenantId: 'tenant', dataMode: 'seed' };
    const nota = await publicaAmb({ id: 'local-1', title: 'Hort', content: '', revision: 1 });
    expect(nota).toBeInstanceOf(ErrorPublicacio);
    expect(nota.message).toBe(EN_LOCAL);
    expect(mocks.toast).toHaveBeenCalledWith(EN_LOCAL, 'info');
    const connexio = await publicaAmb({ id: 'local-2', title: 'Hort', content: '', revision: 1 }, { mode: 'compartir' });
    expect(connexio.message).toBe(EN_LOCAL_CONNEXIO);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('una publicació que signa una altra identitat: el motiu en anglés, amb el nom tal qual', async () => {
    Object.assign(mocks, { actor: PEP, feed: [delForn('g-1')] });
    const motiu = 'This post is signed by Forn de la Torre: switch to that identity to update it.';
    const error = await publicaAmb({ id: 'g-1', title: 'Pa de cada dia', content: '<p>Cos</p>', revision: 1, isPublished: true, publishedSubmissionId: 'g-1' });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'info');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('amb el desat previ en conflicte: la frase de no publicar en anglés', async () => {
    update.mockReset().mockRejectedValue(Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 }));
    const error = await publicaAmb({ id: 'en-conflicte', title: 'Meu', revision: 1 });
    expect(error).toBeInstanceOf(ErrorPublicacio);
    // El detall de la ploma (estatPerAlEditor) encara és residu en valencià (B3-I18N §9); la frase que el porta, ja no.
    expect(error.message).toMatch(/^It cannot be published until the changes are saved\. \S/);
    expect(mocks.toast).toHaveBeenCalledWith(error.message, 'error');
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
