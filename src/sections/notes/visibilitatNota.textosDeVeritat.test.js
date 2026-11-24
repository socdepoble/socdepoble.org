/**
 * F4F (v1.2.24, Assaig a la Plaça · canvi 1, «Textos de veritat») · En el mode
 * de proves (dataMode 'seed' o 'local') no s'envia res al servidor ni es
 * publica res, i el panell de publicar del Bloc ho explica davall del botó
 * apagat. Abans deia «Connecta un backend per a publicar al Mur»: una paraula
 * de tècnic i una cosa que la persona no pot fer. A l'assaig ix en 11 captures
 * de 4 veïns (punt 3.2 de les conclusions), i el canvi 1 el demanen els huit.
 * Ara diu el que passa: en el mode de proves no s'envia a ningú ni es publica.
 *
 * Revisió adversarial · El motiu de la nota no nomena el Mur: el panell del
 * Mercat diu «Publicar al Mercat» (textosEnLiniaDeNota amb seccio 'mercat') i
 * bloqueigDeNota no sap la secció. Tampoc no diu que la nota s'haja desat: en
 * una publicació oberta en memòria (PublicacioEditable, desatEnMemoria) la
 * línia d'estat diu que no es desa, i és ella la que diu on es queda.
 *
 * Fixa el text de la reserva, que el diccionari valencià pinta el mateix
 * (Llei del Píxel), que cap motiu de visibilitat no torna a dir «backend» i
 * el text de cada llengua (la costura de src/config/idiomes, kit F4F).
 */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
/* Sense els diccionaris carregats, createTranslator('en') tornaria el valencià i la prova passaria en buit. */
import '../../../tests/helpers/diccionaris.js';
import CA_DIC from '../../config/idiomes/ca.js';
import { estatHonestNota } from './honestedatDesat.js';
import {
  MOTIU_LOCAL, MOTIU_LOCAL_CONNEXIO, TEXTOS_VISIBILITAT_NOTA, bloqueigDeNota, motiuModeLocal, textosEnLiniaDeNota
} from './visibilitatNota.js';

const CLAU_NOTA = 'section.notes.visibilitat.motiu.local';
const CLAU_CONNEXIO = 'section.notes.visibilitat.motiu.localConnexio';
const ARGOT = /backend/i;
/* El nom del Mur en cada llengua, el dels diccionaris («Publicar al Mur», «Publish to the Wall»…). */
const MUR = Object.freeze({ ca: /\bMur\b/, es: /\bMuro\b/, en: /\bWall\b/, eu: /Horma/, gl: /\bMuro\b/ });
/* El verb de desar en cada llengua: el motiu no ha d'afirmar cap desat. */
const DESAT = Object.freeze({ ca: /desad|guardad/i, es: /guardad/i, en: /\bsaved\b/i, eu: /gorde/i, gl: /gardad/i });

/* [nota, connexió] en cada llengua de l'app. */
const TEXTOS = Object.freeze({
  ca: ['En el mode de proves, la nota no s’envia a ningú ni es publica.',
    'En el mode de proves, la connexió no s’envia a ningú ni es compartix al Mur.'],
  es: ['En el modo de pruebas, la nota no se envía a nadie ni se publica.',
    'En el modo de pruebas, la conexión no se envía a nadie ni se comparte en el Muro.'],
  en: ['In test mode, the note is not sent to anyone or published.',
    'In test mode, the connection is not sent to anyone or shared to the Wall.'],
  eu: ['Proba-moduan, oharra ez zaio inori bidaltzen eta ez da argitaratzen.',
    'Proba-moduan, konexioa ez zaio inori bidaltzen eta ez da Horman partekatzen.'],
  gl: ['No modo de probas, a nota non se envía a ninguén nin se publica.',
    'No modo de probas, a conexión non se envía a ninguén nin se comparte no Muro.'],
});

describe('F4F · el motiu de no publicar en el mode de proves diu la veritat', () => {
  test('la reserva valenciana: no s’envia a ningú ni es publica, sense «backend»', () => {
    const [nota, connexio] = TEXTOS.ca;
    expect(MOTIU_LOCAL).toBe(nota);
    expect(MOTIU_LOCAL_CONNEXIO).toBe(connexio);
    expect(motiuModeLocal()).toBe(nota);
    expect(motiuModeLocal({ connexio: true })).toBe(connexio);
    expect(bloqueigDeNota({ modeLocal: true })).toEqual({ opcio: 'publica', motiu: nota });
    expect(bloqueigDeNota({ modeLocal: true, connexio: true })).toEqual({ opcio: 'publica', motiu: connexio });
  });

  test('cap reserva dels motius de visibilitat no diu «backend»', () => {
    const ambArgot = Object.values(TEXTOS_VISIBILITAT_NOTA).filter(([, reserva]) => ARGOT.test(reserva));
    expect(ambArgot).toEqual([]);
  });

  test('Llei del Píxel · el diccionari valencià porta el mateix text que la reserva', () => {
    expect(CA_DIC[CLAU_NOTA]).toBe(MOTIU_LOCAL);
    expect(CA_DIC[CLAU_CONNEXIO]).toBe(MOTIU_LOCAL_CONNEXIO);
  });

  /* Revisió adversarial (IMPORTANT) · Carme a /mercat (carme_02__notes_ambit_mercat): el botó apagat diu
     «Publicar al Mercat», i el motiu de davall, en el mateix panell, no pot dir «…al Mur». */
  test('al Mercat, el motiu de davall del botó no parla del Mur', () => {
    const panell = textosEnLiniaDeNota({ seccio: 'mercat' });
    expect(panell.publica.accio).toBe('Publicar al Mercat');
    expect(bloqueigDeNota({ modeLocal: true }).motiu).not.toMatch(MUR.ca);
  });

  /* Revisió adversarial (NIT) · Una publicació oberta en memòria (PublicacioEditable, desatEnMemoria) arriba
     a l'editor amb modeLocal: la línia d'estat diu «no es desen», i el motiu no pot dir el contrari. */
  test('el motiu no afirma cap desat: la línia d’estat en memòria diu que no es desa', () => {
    expect(estatHonestNota({ memoria: true, local: true })).toMatch(/no es desen/);
    expect(motiuModeLocal()).not.toMatch(DESAT.ca);
    expect(motiuModeLocal({ connexio: true })).not.toMatch(DESAT.ca);
  });

  test.each(SUPPORTED_LANGUAGES.map(({ code }) => code))('%s: el motiu en la llengua de l\'app, sense «backend», sense desat i sense el Mur en la nota', (codi) => {
    const t = createTranslator(codi);
    const [nota, connexio] = TEXTOS[codi];
    const motiuNota = motiuModeLocal({ t });
    const motiuConnexio = motiuModeLocal({ connexio: true, t });
    expect(motiuNota).toBe(nota);
    expect(motiuConnexio).toBe(connexio);
    /* Sobre l'eixida del traductor, no sobre la taula TEXTOS. */
    for (const text of [motiuNota, motiuConnexio]) {
      expect(text).not.toMatch(ARGOT);
      expect(text).not.toMatch(DESAT[codi]);
    }
    /* El motiu de la nota val igual per al Mur, el Mercat i el Calendari: no nomena el Mur. */
    expect(bloqueigDeNota({ modeLocal: true, t }).motiu).not.toMatch(MUR[codi]);
    expect(textosEnLiniaDeNota({ seccio: 'mercat', t }).publica.accio).not.toMatch(MUR[codi]);
    if (codi !== 'ca') {
      /* Traduït de veres: el traductor no torna la reserva valenciana. */
      expect(motiuNota).not.toBe(MOTIU_LOCAL);
      expect(motiuConnexio).not.toBe(MOTIU_LOCAL_CONNEXIO);
    }
  });
});
