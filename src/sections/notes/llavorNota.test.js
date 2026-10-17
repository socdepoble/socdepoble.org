/* Correcció de la revisió adversarial (261016) · esLlavorDeNota és al camí
   calent d'escriure: la llista del Bloc ho pregunta per a CADA nota a cada
   tecla (NotesSection · toWorkspaceNote). La reserva passa per DOMParser:
     · un cos més llarg que el doble de la llavor més llarga no es parseja (en
       seed i local un cos pot portar imatges data: de megabytes) i no és cap
       llavor;
     · la resposta de la reserva es recorda per cadena: una nota que no canvia
       no es torna a parsejar;
     · el que reconeixia abans, ho continua reconeixent.
   Gauntlet 261017 (C02, auditoria Codex) · La reserva ja no és el text pla
   (DOMPurify i DOMParser, extractPlainText) sinó l'estructura, amb un sol
   DOMParser: el compte d'abans (una crida a extractPlainText per cadena nova)
   és ara una crida a parseFromString per cadena nova. */
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA, LLAVORS_NOTA, MIDA_MAXIMA_LLAVOR, esLlavorDeNota } from './llavorNota.js';

const compacta = (html) => html.replace(/>\s+</g, '><');
let parseja;

beforeAll(() => {
  parseja = vi.spyOn(DOMParser.prototype, 'parseFromString');
});
afterAll(() => parseja.mockRestore());
beforeEach(() => {
  // La primera crida calcula les firmes de les llavors: fora del compte.
  esLlavorDeNota('<p>escalfament</p>');
  parseja.mockClear();
});

test('reconeix les dues llavors, escrites o tal com les torna TipTap, i amb un atribut afegit pel camí', () => {
  for (const llavor of LLAVORS_NOTA) {
    expect(esLlavorDeNota(llavor)).toBe(true);
    expect(esLlavorDeNota(`${compacta(llavor)}<p></p>`)).toBe(true);
  }
  // Un atribut que posa un sanejador o un endoll: la reserva estructural.
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
  expect(parseja).not.toHaveBeenCalled();
});

test('la reserva es recorda per cadena: escriure en una nota no torna a parsejar les altres', () => {
  const llista = Array.from({ length: 40 }, (_, i) => `<p>Nota curta número ${i}</p>`);
  for (const cos of llista) expect(esLlavorDeNota(cos)).toBe(false);
  expect(parseja).toHaveBeenCalledTimes(llista.length);
  // Una tecla en una nota: la llista sencera torna a preguntar.
  for (let tecla = 0; tecla < 5; tecla += 1) {
    for (const cos of llista) esLlavorDeNota(cos);
    esLlavorDeNota(`<p>La que s’escriu${'a'.repeat(tecla)}</p>`);
  }
  // Només la nota que canvia es parseja, una vegada per tecla.
  expect(parseja).toHaveBeenCalledTimes(llista.length + 5);
});

/* Gauntlet 261017 (C02, auditoria Codex: la plantilla amb una fotografia o un
   enllaç propis era «verge», i publishNote en publicava el cos buit) · Una
   coincidència de text no és la llavor: l'etiqueta, els atributs semàntics i
   les marques compten, a la cadena com a l'editor (esLlavorVerge). */
test.each([
  ['amb una fotografia afegida', `${LLAVOR_NOTA}<p><img src="/assets/fotos/hort.jpg" alt="La meua foto"></p>`],
  ['amb un enllaç propi', LLAVOR_NOTA.replace('Una llista amb pics', '<a href="https://example.org/personal">Una llista amb pics</a>')],
  ['amb una negreta', LLAVOR_NOTA.replace('El segon pas de la llista', '<strong>El segon pas de la llista</strong>')],
  ['amb l’H3 passat a paràgraf', LLAVOR_NOTA.replace('<h3>', '<p>').replace('</h3>', '</p>')],
  ['amb l’H3 passat a H2', LLAVOR_NOTA.replace('<h3>', '<h2>').replace('</h3>', '</h2>')],
  ['amb la llista numerada començant en 10', LLAVOR_NOTA.replace('<ol>', '<ol start="10">')],
  ['amb un estil que l’editor llig com a negreta', LLAVOR_NOTA.replace('<h4>', '<h4 style="font-weight: bold">')],
  ['d’abans amb un enllaç propi', LLAVOR_NOTA_ANTIGA.replace('Heading 4', '<a href="https://example.org">Heading 4</a>')]
])('la plantilla %s ja no és la llavor, en cap forma', (_cas, html) => {
  expect(esLlavorDeNota(html)).toBe(false);
  expect(esLlavorDeNota(compacta(html))).toBe(false);
  expect(esLlavorDeNota(`${compacta(html)}<p></p>`)).toBe(false);
});

test('les normalitzacions conegudes continuen sent la llavor: espais entre etiquetes, atributs editorials, paràgrafs buits del final i entitats', () => {
  const compacte = compacta(LLAVOR_NOTA);
  // Un sanejador que sagna: espais i salts entre etiquetes, també dins de les llistes.
  expect(esLlavorDeNota(compacte.replace(/<\/(h3|h4|p|li|ul|ol)>/g, '</$1>\n  '))).toBe(true);
  // Atributs editorials (class, dir, id, data-*) i paràgrafs buits del final amb atributs.
  expect(esLlavorDeNota(compacte.replace('<ul>', '<ul id="llista" data-origen="plantilla" class="sdp-prose">'))).toBe(true);
  expect(esLlavorDeNota(`${compacte}<p dir="auto"></p><p></p>`)).toBe(true);
  // Les entitats es lligen com el text que són.
  expect(esLlavorDeNota(compacte.replaceAll('’', '&rsquo;'))).toBe(true);
  // Un paràgraf buit enmig, en canvi, ja és un canvi d'estructura.
  expect(esLlavorDeNota(compacte.replace('<h4>', '<p></p><h4>'))).toBe(false);
});
