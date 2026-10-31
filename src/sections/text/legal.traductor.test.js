// @vitest-environment node
/* Gauntlet 261030, cicle 2 · Decisió 1 del Mestre (30-10-2026, «Política de
   privacitat: SÍ») i decisions del traductor de l'orquestrador (§1, §4 i §6):
   la pàgina «Legal i privacitat» diu què passa quan prems «Traduir». El
   paràgraf va a l'apartat 21 (contingut d'altres llocs) i l'apartat 11 en
   nomena l'excepció; Apertium i MyMemory NO són encarregats del tractament
   (cap contracte de l'article 28), i per això no van a la llista de l'11.
   Cada afirmació s'ancora al codi: si el transport canvia (galetes, Referer,
   l'app nativa o el Xat comencen a traduir), esta prova cau i el text legal
   s'ha de tornar a escriure. L'empremta nova de PAGE_COPY.legal l'aprova el
   Mestre (frontissa). */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import * as lliure from '../../data/traductorLliure.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
function apartat(numero) {
  const html = legalContent.html;
  const inici = html.indexOf(`<h4>${numero}. `);
  const fi = html.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return html.slice(inici, fi);
}
const paragrafTraduir = () => textDe(apartat(21).split('<p>').find((p) => p.startsWith('<strong>El botó «Traduir».</strong>')) ?? '');

describe('Legal · el botó «Traduir» (apartat 21)', () => {
  test('diu quin servei rep el text, per a quines llengües, i que només ix quan prems Traduir', () => {
    const text = paragrafTraduir();
    expect(text).not.toBe('');
    for (const tros of [
      'Només quan el prems i tries una llengua, el teu navegador envia el text de la pàgina que estàs llegint',
      'Apertium (beta.apertium.org o apertium.org), que és programari lliure, per al castellà, l\'anglés, el francés i el gallec',
      'MyMemory, de l\'empresa italiana Translated S.r.l., per al basc i l\'alemany',
      'el servei rep el text i la teua adreça IP',
      'pot registrar l\'adreça IP i guardar durant molt de temps els textos que rep',
      'Si no prems «Traduir», no ix cap text.'
    ]) expect([tros, text.includes(tros)]).toEqual([tros, true]);
    // Cap promesa sobre Google: MyMemory no diu quin motor automàtic fa servir.
    expect(text).not.toMatch(/Google/);
  });

  test('l’apartat 11 en nomena l’excepció, i la llista d’encarregats continua sense els traductors', () => {
    const onze = apartat(11);
    /* Gauntlet 261030, cicle 3 (legal-11-eixides-sense-wikimedia) · l'excepció
       ja no és només el traductor: és tot el que el navegador envia als serveis
       de fora d'un botó (legal.viquipedia.test.js en fixa la resta). */
    expect(textDe(onze)).toContain('Fora d\'aquesta llista, les teues dades no ixen d\'ací, excepte el que el teu navegador envia, amb la teua adreça IP, als serveis de fora que tries fer servir amb un botó (apartat 21): el text de les pàgines que tries traduir amb el botó «Traduir»');
    const llista = onze.slice(onze.indexOf('<ul>'), onze.indexOf('</ul>'));
    expect(llista).not.toMatch(/Apertium|MyMemory|Translated/);
  });

  test('«sense galetes ni l’adreça de la pàgina»: el transport del navegador va amb credentials omit i sense Referer', () => {
    expect(paragrafTraduir()).toContain('Sóc de Poble no hi envia galetes, cap identificador teu ni l\'adreça de la pàgina: el servei només pot saber de quin lloc web ve la petició');
    const transport = llig('src/data/traductorLliure.js');
    expect(transport).toContain("credentials: 'omit'");
    expect(transport).toContain("referrerPolicy: 'no-referrer'");
    // Els dos extrems d'Apertium que nomena el text.
    expect([lliure.APERTIUM_BETA, lliure.APERTIUM_RESERVA]).toEqual(['https://beta.apertium.org/apy/translate', 'https://apertium.org/apy/translate']);
  });

  test('on tradueix i on no: socdepoble.org des del navegador, l’app nativa encara no, i ni el Xat ni les apps', () => {
    const text = paragrafTraduir();
    // socdepoble.org (entrada pròpia) fixa el transport lliure; l'app nativa no el fixa ni rep cap servei.
    expect(llig('src/main.jsx')).toContain("fixaTraductorLliure('apertium')");
    const natiu = llig('src/natiu/entrada.jsx');
    expect(natiu).not.toMatch(/fixaTraductorLliure|traductorUrl/);
    expect(text).toContain('A l\'aplicació nativa, de moment, el botó encara no fa cap traducció.');
    // Les pàgines de les apps no es traduïxen, i el Xat no munta cap barra amb «Traduir» (PageFrame).
    expect(llig('src/components/PedraSeca/organismes/PaginaApp.jsx')).toContain('traduccio={false}');
    const xat = resolve(process.cwd(), 'src/sections/xat');
    const ambBarra = readdirSync(xat, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer))
      .filter((fitxer) => /\b(?:PageFrame|UniversalPage|PaginaApp|useTraduccioPagina)\b/.test(readFileSync(resolve(xat, fitxer), 'utf8')));
    expect(ambBarra).toEqual([]);
    expect(text).toContain('Els missatges del Xat i les pàgines de les aplicacions no passen mai pel traductor.');
    // Al lloc amb servidor propi (el connector de WordPress), el text passa per eixe servidor.
    expect(llig('wordpress-plugin/includes/traduccio.php')).toMatch(/apertium/i);
    expect(text).toContain('En un portal amb servidor propi, com els de WordPress, el text passa per eixe servidor');
  });

  /* Contracte amb l'àrea A1 (decisió 9 de l'orquestrador): MOTORS_TRADUCCIO
     és la font única de quin motor fa cada destí. Mentre A1 no l'exporte, es
     queda en espera; quan l'exporte, el text legal ha de dir el mateix. */
  test.skipIf(!lliure.MOTORS_TRADUCCIO)('[contracte A1] les llengües de cada servei són les de MOTORS_TRADUCCIO', () => {
    const perMotor = (motor) => Object.entries(lliure.MOTORS_TRADUCCIO).filter(([, m]) => m.motor === motor).map(([desti]) => desti).sort();
    expect(perMotor('apertium')).toEqual(['EN-GB', 'ES', 'FR', 'GL']);
    expect(perMotor('mymemory')).toEqual(['DE', 'EU']);
  });
});
