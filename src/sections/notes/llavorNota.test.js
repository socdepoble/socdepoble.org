/* Correcció de la revisió adversarial (261016) · esLlavorDeNota és al camí
   calent d'escriure: la llista del Bloc ho pregunta per a CADA nota a cada
   tecla (NotesSection · toWorkspaceNote). La reserva de text pla passa per
   DOMPurify i DOMParser (utils/contentAdapter · extractPlainText):
     · un cos més llarg que el doble de la llavor més llarga no es saneja ni
       es parseja (en seed i local un cos pot portar imatges data: de
       megabytes) i no és cap llavor;
     · la resposta de la reserva es recorda per cadena: una nota que no canvia
       no es torna a parsejar;
     · el que reconeixia abans, ho continua reconeixent. */
import { beforeEach, expect, test, vi } from 'vitest';

const espia = vi.hoisted(() => ({ crides: 0 }));
vi.mock('../../utils/contentAdapter.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    extractPlainText: (...args) => {
      espia.crides += 1;
      return real.extractPlainText(...args);
    }
  };
});
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA, LLAVORS_NOTA, MIDA_MAXIMA_LLAVOR, esLlavorDeNota } from './llavorNota.js';

const compacta = (html) => html.replace(/>\s+</g, '><');

beforeEach(() => {
  // La primera crida calcula els textos de les llavors: fora del compte.
  esLlavorDeNota('<p>escalfament</p>');
  espia.crides = 0;
});

test('reconeix les dues llavors, escrites o tal com les torna TipTap, i amb un atribut afegit pel camí', () => {
  for (const llavor of LLAVORS_NOTA) {
    expect(esLlavorDeNota(llavor)).toBe(true);
    expect(esLlavorDeNota(`${compacta(llavor)}<p></p>`)).toBe(true);
  }
  // Un atribut que posa un sanejador o un endoll: la reserva de text pla.
  expect(esLlavorDeNota(LLAVOR_NOTA.replace('<h3>', '<h3 dir="auto" class="sdp-prose">'))).toBe(true);
  expect(esLlavorDeNota(LLAVOR_NOTA_ANTIGA.replace('<h4>', '<h4 dir="auto">'))).toBe(true);
  // Qualsevol canvi de text, no.
  expect(esLlavorDeNota(LLAVOR_NOTA.replace('Una llista amb pics', 'Comprar planter'))).toBe(false);
  expect(esLlavorDeNota('<p>Hola, poble</p>')).toBe(false);
  expect(esLlavorDeNota('')).toBe(false);
  expect(esLlavorDeNota(null)).toBe(false);
});

test('un cos més llarg que el doble de la llavor més llarga no és cap llavor, i no es saneja ni es parseja', () => {
  expect(MIDA_MAXIMA_LLAVOR).toBe(2 * Math.max(...LLAVORS_NOTA.map((llavor) => llavor.length)));
  // Una nota en seed o local amb una imatge data: d'un megabyte.
  const ambImatge = `<p>Foto de l’hort</p><img src="data:image/webp;base64,${'A'.repeat(1024 * 1024)}">`;
  expect(esLlavorDeNota(ambImatge)).toBe(false);
  // La llavor sencera seguida d'una imatge, tampoc: ja hi ha alguna cosa de la persona.
  expect(esLlavorDeNota(`${LLAVOR_NOTA}<img src="data:image/png;base64,${'B'.repeat(MIDA_MAXIMA_LLAVOR)}">`)).toBe(false);
  expect(espia.crides).toBe(0);
});

test('la reserva es recorda per cadena: escriure en una nota no torna a parsejar les altres', () => {
  const llista = Array.from({ length: 40 }, (_, i) => `<p>Nota curta número ${i}</p>`);
  for (const cos of llista) expect(esLlavorDeNota(cos)).toBe(false);
  expect(espia.crides).toBe(llista.length);
  // Una tecla en una nota: la llista sencera torna a preguntar.
  for (let tecla = 0; tecla < 5; tecla += 1) {
    for (const cos of llista) esLlavorDeNota(cos);
    esLlavorDeNota(`<p>La que s’escriu${'a'.repeat(tecla)}</p>`);
  }
  // Només la nota que canvia es parseja, una vegada per tecla.
  expect(espia.crides).toBe(llista.length + 5);
});
