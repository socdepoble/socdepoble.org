/**
 * Claus del torn T1–T4 (260930): cada clau té valor propi en les cinc llengües
 * de SUPPORTED_LANGUAGES, i en valencià coincidix amb el text ordenat.
 * Fa de guarda local de la paritat (LLEI_07 de tractor-pedra-seca), que el
 * hook de l'implementador no deixa executar.
 * El traductor és el real (createTranslator); el diccionari no s'exporta i el
 * recompte d'aparicions es fa sobre el text de la font.
 */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from './i18n.js';
import fontI18n from './i18n.js?raw';
import fontNotesEditor from '../sections/notes/NotesEditor.jsx?raw';
import fontControl from '../sections/control/ControlSection.jsx?raw';
import fontEstatError from '../sections/mur/EstatErrorDades.jsx?raw';

const CLAUS = {
  'nav.panel': {
    ca: 'Panell de Control',
    es: 'Panel de control',
    en: 'Control panel',
    eu: 'Kontrol panela',
    gl: 'Panel de control'
  },
  'nav.telefonades.avis': {
    // Literal del Mestre: no es toca.
    ca: 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.',
    es: 'Este es un proyecto libre CC. Esta función está prevista para cuando podamos mantenerla económicamente.',
    en: 'This is a free CC project. This feature is planned for when we can afford to maintain it.',
    eu: 'Hau CC proiektu librea da. Funtzio hau ekonomikoki mantendu ahal izango dugunerako aurreikusita dago.',
    gl: 'Este é un proxecto libre CC. Esta función está prevista para cando poidamos mantela economicamente.'
  },
  'common.entesos': {
    ca: 'Entesos', es: 'Entendido', en: 'Got it', eu: 'Ulertuta', gl: 'Entendido'
  },
  'common.reintenta': {
    ca: 'Torna-ho a provar', es: 'Vuelve a intentarlo', en: 'Try again', eu: 'Saiatu berriro', gl: 'Téntao de novo'
  },
  'error.backendInabastable': {
    ca: 'El servidor del poble no respon ara mateix. El contingut no s’ha pogut carregar.',
    es: 'El servidor del pueblo no responde ahora mismo. No se ha podido cargar el contenido.',
    en: 'The town server is not responding right now. The content could not be loaded.',
    eu: 'Herriko zerbitzariak ez du erantzuten oraintxe. Ezin izan da edukia kargatu.',
    gl: 'O servidor da vila non responde agora mesmo. Non se puido cargar o contido.'
  },
  'error.tornaDemostracio': {
    ca: 'Tornar al mode de proves',
    es: 'Volver al modo de pruebas',
    en: 'Back to demo mode',
    eu: 'Itzuli proba modura',
    gl: 'Volver ao modo de probas'
  },
  'section.control.lead': {
    ca: 'Publica, connecta i ajusta el teu espai des d’un sol lloc.',
    es: 'Publica, conecta y ajusta tu espacio desde un solo lugar.',
    en: 'Publish, connect and adjust your space from one place.',
    eu: 'Argitaratu, konektatu eta doitu zure espazioa leku bakarretik.',
    gl: 'Publica, conecta e axusta o teu espazo dende un só lugar.'
  },
  /* Correcció de la revisió (260930) · Claus que la UI ja cridava sense cap
     entrada al diccionari (connexió editable, D4) i les noves del Panell i de
     l'estat d'error. El valor valencià és el text de reserva del codi. */
  'section.notes.connexio.titol': {
    ca: 'Element connectat',
    es: 'Elemento conectado',
    en: 'Connected item',
    eu: 'Konektatutako elementua',
    gl: 'Elemento conectado'
  },
  'section.notes.connexio.altri': {
    ca: 'una altra persona',
    es: 'otra persona',
    en: 'someone else',
    eu: 'beste pertsona bat',
    gl: 'outra persoa'
  },
  'section.notes.compartir': {
    ca: 'Compartir', es: 'Compartir', en: 'Share', eu: 'Partekatu', gl: 'Compartir'
  },
  'section.control.ajustosXat.titol': {
    ca: 'Ajustos del xat',
    es: 'Ajustes del chat',
    en: 'Chat settings',
    eu: 'Txataren ezarpenak',
    gl: 'Axustes do chat'
  },
  'section.control.ajustosXat.subtitol': {
    ca: 'Amplària de les columnes i preferències del xat',
    es: 'Anchura de las columnas y preferencias del chat',
    en: 'Column width and chat preferences',
    eu: 'Zutabeen zabalera eta txataren hobespenak',
    gl: 'Largura das columnas e preferencias do chat'
  },
  'error.servidor': {
    ca: 'El servidor del poble ha tornat un error. Torna-ho a provar més tard.',
    es: 'El servidor del pueblo ha devuelto un error. Vuelve a intentarlo más tarde.',
    en: 'The town server returned an error. Try again later.',
    eu: 'Herriko zerbitzariak errore bat itzuli du. Saiatu berriro geroago.',
    gl: 'O servidor da vila devolveu un erro. Téntao de novo máis tarde.'
  },
  'error.connectarBloc': {
    ca: 'No s’ha pogut obrir el teu Bloc.',
    es: 'No se ha podido abrir tu Bloc.',
    en: 'Your Notebook could not be opened.',
    eu: 'Ezin izan da zure Koadernoa ireki.',
    gl: 'Non se puido abrir o teu Caderno.'
  },
  /* D4 · Els drets de l'original a l'editor d'una connexió ({drets} literal). */
  'section.notes.drets.original': {
    ca: 'Drets de l’original: {drets}',
    es: 'Derechos del original: {drets}',
    en: 'Rights of the original: {drets}',
    eu: 'Jatorrizkoaren eskubideak: {drets}',
    gl: 'Dereitos do orixinal: {drets}'
  },
  'section.notes.drets.originalSenseDeclarar': {
    ca: 'L’original no declara drets',
    es: 'El original no declara derechos',
    en: 'The original does not declare any rights',
    eu: 'Jatorrizkoak ez du eskubiderik adierazten',
    gl: 'O orixinal non declara dereitos'
  }
};

/* Correcció de la revisió (260930) · Parelles on la traducció correcta és la
   mateixa paraula que en valencià (es i gl «Compartir»). La comprovació
   «≠ valencià» de baix servix per a detectar una llengua que cau al valencià
   per falta d'entrada; per a estes parelles, eixa falta la detecta igualment
   el recompte «una sola aparició per llengua», que continua obligatori, i el
   text exacte es continua comprovant. Les claus anteriors no en tenen cap. */
const IGUALS_AL_VALENCIA = Object.freeze({ 'section.notes.compartir': ['es', 'gl'] });

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

describe('claus i18n del torn T1–T4', () => {
  test('les cinc llengües de la taula són les del selector', () => {
    for (const textos of Object.values(CLAUS)) expect(Object.keys(textos).sort()).toEqual([...LLENGUES].sort());
  });

  for (const [clau, textos] of Object.entries(CLAUS)) {
    test(`${clau}: valor propi en cada llengua i text exacte`, () => {
      const valenciana = createTranslator('ca')(clau);
      expect(valenciana).toBe(textos.ca);
      for (const codi of LLENGUES) {
        const valor = createTranslator(codi)(clau);
        expect([codi, valor === clau]).toEqual([codi, false]);
        expect([codi, valor]).toEqual([codi, textos[codi]]);
        // Una llengua sense entrada cauria en el valencià: ha de tindre la seua.
        const igualPermes = IGUALS_AL_VALENCIA[clau]?.includes(codi) ?? false;
        if (codi !== 'ca' && !igualPermes) expect([codi, valor === valenciana]).toEqual([codi, false]);
      }
    });

    test(`${clau}: una sola aparició per llengua al diccionari`, () => {
      const vegades = fontI18n.split(`'${clau}':`).length - 1;
      expect([clau, vegades]).toEqual([clau, LLENGUES.length]);
    });
  }

  /* Correcció de la revisió (260930) · El text de reserva de qui crida la
     clau és el valor valencià: si divergixen, el valencià depén de si la clau
     existix o no al diccionari. */
  const FONTS = { NotesEditor: fontNotesEditor, ControlSection: fontControl, EstatErrorDades: fontEstatError };
  test.each([
    ['section.notes.connexio.titol', 'NotesEditor'],
    ['section.notes.connexio.altri', 'NotesEditor'],
    ['section.notes.compartir', 'NotesEditor'],
    ['section.control.ajustosXat.titol', 'ControlSection'],
    ['section.control.ajustosXat.subtitol', 'ControlSection'],
    ['error.servidor', 'EstatErrorDades']
  ])('%s: la reserva de %s és el valor valencià', (clau, fitxer) => {
    const font = FONTS[fitxer];
    expect([clau, font.includes(`t('${clau}', '${CLAUS[clau].ca}')`)]).toEqual([clau, true]);
  });
});
