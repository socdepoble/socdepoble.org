/* v1.2.22 · Gauntlet R1 (L5-04) · La pàgina del Banc de llavors diu les quatre fonts de FONTS_BANC_LLAVORS (els tres
   catàlegs i l'estudi d'oliveres de Codex R32.42 lot 02), amb el recompte de cada una tal com el donen les dades.
   v1.2.22 · Gauntlet R2 · M4-08: el recompte es comprova amb la frase sencera i un límit de dígit a l'esquerra, en les
   cinc llengües (un «3» ja no passa per dins d'un «45» ni d'un «13»). M4-01: el cos diu l'excepció de l'estudi
   d'oliveres, i la font sense extracte rotula l'empremta com a declarada i l'adreça com a registre del document.
   M5-02: el rètol de la pestanya del Banc és el total calculat de les dades. M5-06: el títol castellà de l'estudi porta
   lang="es", i l'autoria, en català, va a part. */
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { PAGINES_PATRIMONI_R9 } from './pageContent.patrimoniR9.js';
import { FONTS_BANC_LLAVORS, VARIETATS_OLIVERA_GVA_IVIA, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { CODIS_LLENGUA_BIBLIOTECA_AGRICOLA, textosBibliotecaAgricola } from '../patrimoni/i18nBibliotecaAgricola.js';
import { TOTAL_FITXES_BANC_LLAVORS, rotolDelLlibre } from '../patrimoni/BancLlavorsWorkspaceSection.jsx';
import { Fitxa, FitxaDeLaFont } from '../patrimoni/BancLlavorsSection.jsx';
import EmpremtaFont from '../patrimoni/EmpremtaFont.jsx';

afterEach(cleanup);

const tr = (_clau, reserva, valors = null) => {
  let text = reserva;
  if (valors) for (const [nom, valor] of Object.entries(valors)) text = text.split(`{${nom}}`).join(String(valor));
  return text;
};
const font = (id) => FONTS_BANC_LLAVORS.find((f) => f.id === id);
const OLIVERES = font('oliveres-gva-ivia');
const textDe = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ancorada = (frase) => new RegExp(`(^|\\D)${escapa(frase)}`);

describe('v1.2.22 · /page/banc-de-llavors, les quatre fonts', () => {
  const pagina = PAGINES_PATRIMONI_R9['banc-de-llavors'];
  const traduccions = pagina.translations || {};
  const lleng = { ca: pagina, ...traduccions };
  const n = (id) => entradesDelCataleg(id).length;
  const RECOMPTES = ['cataleg-valencia', 'avl-mallorca', 'atles-catalunya', 'oliveres-gva-ivia'].map(n);
  /* Les frases de cada llengua, llegides del lead real; [V, M, A, O] = Catàleg valencià, AVL, Atles i oliveres. */
  const frases = ([V, M, A, O]) => ({
    ca: [`${V} varietats del Catàleg valencià`, `${M} del Catàleg de llavors 2020`, `${A} fitxes d’espècie`, `${O} varietats d’olivera`],
    es: [`${V} variedades del Catàleg valencià`, `${M} del Catàleg de llavors 2020`, `${A} fichas de especie`, `${O} variedades de olivo`],
    en: [`${V} varieties from the Valencian catalogue`, `${M} from the 2020 seed catalogue`, `${A} species records`, `${O} olive varieties`],
    eu: [`katalogoko ${V} barietate`, `hazi katalogoko ${M},`, `atlaseko ${A} espezie fitxa`, `azterlaneko ${O} olibondo-barietate`],
    gl: [`${V} variedades do catálogo valenciano`, `${M} do catálogo de sementes 2020`, `${A} fichas de especie`, `${O} variedades de oliveira`]
  });

  test('el lead de cada llengua porta el recompte de cada font en la seua frase, també les tres oliveres', () => {
    expect(FONTS_BANC_LLAVORS).toHaveLength(4);
    expect(FONTS_BANC_LLAVORS.map((f) => f.id)).toEqual(['cataleg-valencia', 'avl-mallorca', 'atles-catalunya', 'oliveres-gva-ivia']);
    expect(Object.keys(lleng).sort()).toEqual([...CODIS_LLENGUA_BIBLIOTECA_AGRICOLA].sort());
    const reals = frases(RECOMPTES);
    for (const [codi, llista] of Object.entries(reals)) {
      expect(llista, codi).toHaveLength(FONTS_BANC_LLAVORS.length);
      for (const frase of llista) expect(lleng[codi].lead, `${codi} · ${frase}`).toMatch(ancorada(frase));
      // Un recompte fals (una fitxa de més en qualsevol font) no casa: la prova ja no mira només la xifra.
      RECOMPTES.forEach((_, i) => {
        const fals = frases(RECOMPTES.map((x, j) => (j === i ? x + 1 : x)))[codi][i];
        expect(lleng[codi].lead, `${codi} · ${fals}`).not.toMatch(ancorada(fals));
      });
    }
    for (const nom of ['Alfafarenca', 'Blanqueta', 'Villalonga']) expect(pagina.lead).toContain(nom);
    expect(pagina.subtitle).not.toMatch(/^Tres catàlegs de varietats tradicionals, amb la seua font$/);
  });

  test('cap llengua no diu només «tres catàlegs»: totes nomenen les oliveres', () => {
    for (const [codi, p] of Object.entries(lleng)) {
      expect(p?.lead, codi).toBeTruthy();
      expect(p.lead, codi).toMatch(/Alfafarenca/);
      expect(p.subtitle, codi).toMatch(/olive|olivo|oliveira|olibondo|olivera/i);
    }
  });

  test('M4-01 · el cos diu en les cinc llengües que de l’estudi d’oliveres no se’n transcriu res (les fitxes porten el nom, l’espècie i la pàgina), i que Alfafarenca és la sinonímia d’Alfafara', () => {
    // La dada que ho sosté: la font llista «Alfafara» a la pàgina 78 i dona «Alfafarenca» com a sinonímia local.
    const alfafarenca = VARIETATS_OLIVERA_GVA_IVIA.find((v) => v.id === 'olivera-alfafarenca');
    expect(alfafarenca.llista).toEqual(['Alfafara']);
    expect(alfafarenca.sinonimies).toContain('Alfafarenca');
    expect(alfafarenca.pagina).toBe(78);
    expect(OLIVERES.discrepancies.join(' ')).toContain('Alfafarenca és una sinonímia local d’Alfafara');
    const EXCEPCIO = {
      ca: 'De l’estudi d’oliveres no se’n transcriu res: les seues tres fitxes porten el nom de la varietat, l’espècie (Olea europaea L.) i la pàgina del PDF; «Alfafarenca» és la sinonímia local que l’estudi dona d’«Alfafara».',
      es: 'Del estudio de olivos no se transcribe nada: sus tres fichas llevan el nombre de la variedad, la especie (Olea europaea L.) y la página del PDF; «Alfafarenca» es la sinonimia local que el estudio da de «Alfafara».',
      en: 'Nothing is transcribed from the olive study: its three records carry the variety name, the species (Olea europaea L.) and the PDF page; «Alfafarenca» is the local synonym the study gives for «Alfafara».',
      eu: 'Olibondoei buruzko azterlanetik ez da ezer transkribatzen: haren hiru fitxek barietatearen izena, espeziea (Olea europaea L.) eta PDFko orrialdea dituzte; «Alfafarenca» azterlanak «Alfafara» barietatearentzat ematen duen tokiko sinonimoa da.',
      gl: 'Do estudo de oliveiras non se transcribe nada: as súas tres fichas levan o nome da variedade, a especie (Olea europaea L.) e a páxina do PDF; «Alfafarenca» é a sinonimia local que o estudo dá de «Alfafara».'
    };
    const TRES = { ca: 'Cada fitxa dels tres catàlegs', es: 'Cada ficha de los tres catálogos', en: 'Each record from the three catalogues', eu: 'Hiru katalogoetako fitxa bakoitzak', gl: 'Cada ficha dos tres catálogos' };
    for (const [codi, p] of Object.entries(lleng)) {
      const cos = textDe(p.html);
      expect(cos, codi).toContain(EXCEPCIO[codi]);
      expect(cos, codi).toContain(TRES[codi]);
    }
  });

  test('M4-01 · la font sense extracte rotula l’empremta com a declarada i l’adreça com a registre del document, en les cinc llengües', () => {
    // Només l'estudi d'oliveres porta els camps: les altres fonts es contrasten amb tests/fixtures/patrimoni/.
    expect(FONTS_BANC_LLAVORS.filter((f) => f.empremtaContrastada === false).map((f) => f.id)).toEqual(['oliveres-gva-ivia']);
    expect(FONTS_BANC_LLAVORS.filter((f) => f.webEsRegistreDocument === true).map((f) => f.id)).toEqual(['oliveres-gva-ivia']);
    for (const codi of CODIS_LLENGUA_BIBLIOTECA_AGRICOLA) {
      const tx = textosBibliotecaAgricola(codi);
      expect(tx.empremtaDeclarada, codi).toMatch(/SHA-256/);
      const empremta = render(createElement(EmpremtaFont, { font: OLIVERES, tr, llengua: codi }));
      expect(empremta.container.querySelector('summary').textContent, codi).toBe(tx.empremtaDeclarada);
      expect(empremta.container.textContent, codi).toContain(`${tx.registreDocument}: ${OLIVERES.document}`);
      expect(empremta.container.textContent, codi).toContain(OLIVERES.sha256.slice(0, 8));
      const fitxaFont = render(createElement(FitxaDeLaFont, { font: OLIVERES, tr, llengua: codi }));
      const termes = [...fitxaFont.container.querySelectorAll('tbody th[scope="row"]')].map((th) => th.textContent);
      expect(termes, codi).toContain(tx.registreDocument);
      expect(termes, codi).not.toContain('Web de l’entitat');
      cleanup();
    }
    // Una font amb extracte conserva els rètols de sempre.
    const valencia = render(createElement(EmpremtaFont, { font: font('cataleg-valencia'), tr, llengua: 'es' }));
    expect(valencia.container.querySelector('summary').textContent).toBe('Empremta SHA-256 de la font');
    expect(valencia.container.textContent).toContain(`Document: ${font('cataleg-valencia').document}`);
    const avl = render(createElement(FitxaDeLaFont, { font: font('avl-mallorca'), tr, llengua: 'es' }));
    expect([...avl.container.querySelectorAll('tbody th[scope="row"]')].map((th) => th.textContent)).toContain('Web de l’entitat');
  });

  test('M5-02 · el rètol de la pestanya del Banc és el total calculat de les dades, en les cinc llengües', () => {
    const total = FONTS_BANC_LLAVORS.reduce((suma, f) => suma + entradesDelCataleg(f.id).length, 0);
    expect(total).toBe(128);
    expect(TOTAL_FITXES_BANC_LLAVORS).toBe(total);
    for (const codi of CODIS_LLENGUA_BIBLIOTECA_AGRICOLA) {
      const tx = textosBibliotecaAgricola(codi);
      expect(typeof tx.llibreLlavors, codi).toBe('function');
      const rotol = rotolDelLlibre(tx, 'llibreLlavors');
      expect(rotol, codi).toMatch(ancorada(`(${total} `));
      expect(rotol, codi).not.toMatch(/125/);
      // Els altres dos llibres continuen sent cadenes.
      expect(rotolDelLlibre(tx, 'llibreCalendari'), codi).toBe(tx.llibreCalendari);
    }
  });

  test('M5-06 · el títol castellà de l’estudi d’oliveres porta lang="es"; l’autoria, en català, va a part', () => {
    expect(OLIVERES.llenguaTitol).toBe('es');
    expect(FONTS_BANC_LLAVORS.filter((f) => f.llenguaTitol !== undefined).map((f) => f.id)).toEqual(['oliveres-gva-ivia']);
    const fitxaFont = render(createElement(FitxaDeLaFont, { font: OLIVERES, tr }));
    const titol = [...fitxaFont.container.querySelectorAll('tbody td')].find((td) => td.textContent === OLIVERES.titol);
    expect(titol?.getAttribute('lang')).toBe('es');
    const autoria = [...fitxaFont.container.querySelectorAll('tbody td')].find((td) => td.textContent === OLIVERES.autoria);
    expect(autoria?.getAttribute('lang')).toBe('ca');
    cleanup();
    const alfafarenca = entradesDelCataleg(OLIVERES.id).find((e) => e.id === 'olivera-alfafarenca');
    const fitxa = render(createElement(Fitxa, {
      entrada: alfafarenca, totes: entradesDelCataleg(OLIVERES.id), font: OLIVERES, tr,
      onTriaEntrada: () => {}, onTanca: () => {}, autoFocus: false
    }));
    const spans = [...fitxa.container.querySelectorAll('span[lang]')];
    expect(spans.find((s) => s.textContent === OLIVERES.titol)?.getAttribute('lang')).toBe('es');
    expect(spans.find((s) => s.textContent === OLIVERES.autoria)?.getAttribute('lang')).toBe('ca');
    expect(fitxa.container.textContent).toContain(`${OLIVERES.autoria} · ${OLIVERES.titol} · Pàgina 78 del PDF`);
    cleanup();
    // Les altres fonts tenen el títol en català i el conserven amb lang="ca".
    const valencia = render(createElement(FitxaDeLaFont, { font: font('cataleg-valencia'), tr }));
    const titolCa = [...valencia.container.querySelectorAll('tbody td')].find((td) => td.textContent === font('cataleg-valencia').titol);
    expect(titolCa?.getAttribute('lang')).toBe('ca');
  });
});
