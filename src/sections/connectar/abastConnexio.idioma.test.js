/**
 * P1-22 (assalt 261101, T5b) · Els mòduls purs de Connectar en cinc llengües:
 * amb el traductor de veres (createTranslator, amb els cinc diccionaris), cada
 * text visible ix en la llengua demanada amb els marcadors resolts; sense
 * traductor (o amb un `t` null), el valencià de sempre, lletra per lletra.
 */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
/* Sense els diccionaris carregats, createTranslator('es') tornaria el valencià i la prova passaria en buit. */
import '../../../tests/helpers/diccionaris.js';
import {
  ETIQUETA_OBJECTE, LIMIT_GRUPS, LIMIT_PERSONES, MAXIM_MISSATGE, etiquetaObjecte, grupsDeXat, missatgeDeConnexio,
  missatgeDeLError, opcionsDAbast, passosDAplicacio
} from './abastConnexio.js';
import { CODI_ESQUEMA_ABSENT } from '../../data/errorsBackend.js';

const ES = createTranslator('es');
const EN = createTranslator('en');
const EU = createTranslator('eu');
const GL = createTranslator('gl');
const CODIS = SUPPORTED_LANGUAGES.map(({ code }) => code);
const perValor = (opcions) => Object.fromEntries(opcions.map((o) => [o.valor, o]));
const GRUPS = [{ id: 'g1', nom: 'Comissió de Festes' }];
const ORIGEN = { titol: 'Samarreta', autorNom: 'Sóc de Poble' };
const URL_ELEMENT = 'https://socdepoble.org/mercat/samarreta-socdepoble';

describe('opcionsDAbast · «Qui ho pot vore?»', () => {
  test('en castellà: les quatre etiquetes, les ajudes i els límits amb {n} resolt', () => {
    const opcions = perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: GRUPS, t: ES }));
    expect(Object.values(opcions).map((o) => o.etiqueta)).toEqual(['Privada', 'Personas concretas', 'Grupos de chat', 'Todo el pueblo']);
    expect(opcions.privada.ajuda).toBe('Se queda en tus notas. Nadie más la ve.');
    expect(opcions.persones.detall).toBe(`Hasta ${LIMIT_PERSONES} personas.`);
    expect(opcions.grups.detall).toBe(`Hasta ${LIMIT_GRUPS} grupos.`);
    expect(opcions.poble.ajuda).toContain('«Compartir en el Muro»');
  });

  test('els motius de les desactivades també es traduïxen (sense sessió, sense servidor, xat carregant)', () => {
    const senseSessio = perValor(opcionsDAbast({ dataMode: 'remote', teSessio: false, grups: GRUPS, t: EN }));
    expect(senseSessio.persones.detall).toBe('Sign in to your account to send it by chat.');
    expect(senseSessio.poble.detall).toBe('Sign in to your account to share it to the Wall.');
    const local = perValor(opcionsDAbast({ dataMode: 'local', teSessio: true, grups: GRUPS, t: GL }));
    expect(local.privada.detall).toBe('Sen servidor, queda só neste dispositivo.');
    expect(local.persones.detall).toBe('Sen servidor, a mensaxe queda neste dispositivo: ninguén máis a recibe.');
    expect(local.poble.detall).toBe('Sen servidor non se pode compartir no Muro.');
    const carregant = perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: [], xat: 'carregant', t: EU }));
    expect(carregant.grups.detall).toBe('Zure txat-taldeak kargatzen…');
  });

  test('cap text de cap llengua es queda amb un marcador sense omplir ni amb «MAS»', () => {
    for (const code of CODIS) {
      const t = createTranslator(code);
      for (const args of [
        { dataMode: 'remote', teSessio: true, grups: GRUPS }, { dataMode: 'remote', teSessio: false },
        { dataMode: 'seed', teSessio: true, grups: [], xat: 'error' }, { dataMode: 'local', teSessio: true, grups: GRUPS }
      ]) {
        const textos = opcionsDAbast({ ...args, t }).flatMap((o) => [o.etiqueta, o.ajuda, o.detall]).filter(Boolean);
        for (const text of textos) {
          expect(text, `${code} ${text}`).not.toMatch(/\{\w+\}/);
          expect(text, `${code} ${text}`).not.toMatch(/\bMAS/);
        }
      }
    }
  });

  test('sense traductor, o amb un `t` null, el valencià de sempre', () => {
    for (const t of [undefined, null]) {
      const opcions = perValor(opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: GRUPS, t }));
      expect(Object.values(opcions).map((o) => o.etiqueta)).toEqual(['Privada', 'Persones concretes', 'Grups de xat', 'Tot el poble']);
      expect(opcions.persones.detall).toBe(`Fins a ${LIMIT_PERSONES} persones.`);
    }
  });
});

describe('missatgeDeConnexio · el text que reben pel xat', () => {
  test.each([
    ['es', ES, 'Te envío «Samarreta» (de Sóc de Poble), que he guardado en mis notas. Puedes verlo aquí: '],
    ['eu', EU, 'Hau bidaltzen dizut: «Samarreta» (egilea: Sóc de Poble). Nire oharretan gorde dut. Hemen ikus dezakezu: ']
  ])('%s · les quatre variants, sense cap {x} pendent', (_code, t, ambTot) => {
    expect(missatgeDeConnexio(ORIGEN, URL_ELEMENT, t)).toBe(`${ambTot}${URL_ELEMENT}`);
    const variants = [
      missatgeDeConnexio(ORIGEN, '', t),
      missatgeDeConnexio({ titol: 'Samarreta' }, URL_ELEMENT, t),
      missatgeDeConnexio({ titol: 'Samarreta' }, '', t)
    ];
    expect(new Set(variants).size).toBe(3);
    for (const text of [...variants, missatgeDeConnexio(ORIGEN, URL_ELEMENT, t)]) {
      expect(text).toContain('«Samarreta»');
      expect(text).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/\bMAS/);
    }
    expect(variants[1]).toContain(URL_ELEMENT);
    expect(variants[2]).not.toContain('Sóc de Poble');
  });

  test('sense títol, «un element» en la llengua; sense traductor, la frase valenciana d’abans', () => {
    expect(missatgeDeConnexio({}, '', ES)).toBe('Te envío «un elemento», que he guardado en mis notas.');
    expect(missatgeDeConnexio({}, '', GL)).toBe('Envíoche «un elemento», que gardei nas miñas notas.');
    expect(missatgeDeConnexio(ORIGEN, URL_ELEMENT)).toBe(`T’envie «Samarreta» (de Sóc de Poble), que he guardat a les meues notes. Ho pots vore ací: ${URL_ELEMENT}`);
  });

  test('un títol amb «{url}» o «$&» no s’interpola dues vegades, i el tall de 4096 caràcters es manté', () => {
    expect(missatgeDeConnexio({ titol: 'Trampa {url} $&' }, URL_ELEMENT, EN))
      .toBe(`I’m sending you “Trampa {url} $&”, which I saved in my notes. You can see it here: ${URL_ELEMENT}`);
    for (const t of [undefined, ES, EU]) expect(missatgeDeConnexio({ titol: 'x' }, `https://x.org/${'a'.repeat(6000)}`, t).length).toBe(MAXIM_MISSATGE);
  });
});

describe('missatgeDeLError, etiquetaObjecte, grupsDeXat i passosDAplicacio', () => {
  test('l’error d’esquema i el genèric, traduïts; un missatge cru passa tal qual', () => {
    expect(missatgeDeLError({ codi: CODI_ESQUEMA_ABSENT }, EN)).toBe('This town’s server does not accept connections yet: the note-origin migration still has to be applied. The connection was not made.');
    expect(missatgeDeLError({}, ES)).toBe('No se ha podido conectar. Vuelve a intentarlo.');
    expect(missatgeDeLError(new Error('Conflicte de revisió.'), ES)).toBe('Conflicte de revisió.');
    expect(missatgeDeLError({})).toBe('No s’ha pogut connectar. Torna-ho a provar.');
  });

  test('etiquetaObjecte: cada objecte en la llengua, un desconegut (o «toString») és «Element»', () => {
    expect(etiquetaObjecte('producte', ES)).toBe('Producto del Mercado');
    expect(etiquetaObjecte('publicacio', EN)).toBe('Wall post');
    expect(etiquetaObjecte('raro', ES)).toBe('Elemento');
    expect(etiquetaObjecte('toString', EU)).toBe('Elementua');
    /* Sense traductor, la taula de sempre (la que llig Notes). */
    for (const [objecte, etiqueta] of Object.entries(ETIQUETA_OBJECTE)) expect(etiquetaObjecte(objecte)).toBe(etiqueta);
    expect(etiquetaObjecte(undefined)).toBe('Element');
    /* Les catorze tenen clau pròpia a les cinc llengües: cap cau a la reserva valenciana fora del valencià. */
    for (const objecte of Object.keys(ETIQUETA_OBJECTE)) {
      expect(etiquetaObjecte(objecte, (clau) => clau), objecte).toBe(`section.connectar.objecte.${objecte}`);
    }
  });

  test('un grup de xat sense nom i el pas del Mur, en la llengua de qui mira', () => {
    expect(grupsDeXat([{ id: 'g1', tipus: 'grup' }], ES)).toEqual([{ id: 'g1', nom: 'Grupo sin nombre' }]);
    expect(grupsDeXat([{ id: 'g1', tipus: 'grup' }])).toEqual([{ id: 'g1', nom: 'Grup sense nom' }]);
    expect(passosDAplicacio({ mode: 'poble' }, ES)).toEqual([{ tipus: 'mur', desti: { id: 'mur', nom: 'Tu muro' } }]);
    expect(passosDAplicacio({ mode: 'poble' }, null)[0].desti.nom).toBe('El teu mur');
  });
});
