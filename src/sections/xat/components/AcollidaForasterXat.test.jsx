/**
 * v1.2.17 · IDEA-313 · La benvinguda del Foraster a /xat amb el literal exacte del Mestre
 * (261121 16:03): títol, dues línies amb CONNECTAR destacat, un sol «Entrar» i la ✕, que la tanca,
 * ho recorda en aquest dispositiu i no deixa cap pastilla.
 * v1.2.17 · Gauntlet R1 (L1-02, L1-04, L1-05, L1-06, L1-09) · El lang dels textos, la mostra que no
 * toca la clau real, la reserva en memòria, «Entrar» sense navegació i el nom de la ✕.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AcollidaForasterXat } from './AcollidaForasterXat.jsx';
import {
  LLENGUES_BENVINGUDA_FORASTER,
  TEXTOS_BENVINGUDA_FORASTER,
  benvingudaForasterTancada,
  desaBenvingudaForasterTancada,
  llenguaBenvingudaForaster,
  partsDeLinia,
  textosBenvingudaForaster,
} from './acollidaForasterXatModel.js';
import EspecimenAcollidaForasterXat from '../../disseny/cataleg/detalls/EspecimenAcollidaForasterXat.jsx';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';
import { getVal } from '../../../config/storage.js';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';

const DICCIONARIS = { ca, es, en, eu, gl };
const CLAU = 'acollida_foraster_xat_tancada_v1';
/* Les crides a l'emmagatzematge que nomenen la clau de la targeta real. */
const cridesDeLaClau = (espia) => espia.mock.calls.filter(([clau]) => String(clau).includes(CLAU));

/* IDEA-313 · D'on ve el literal: copiat sense tocar-ne cap caràcter del bloc
   SDP:MARIA_FORASTER_SIMPLIFICACIO_2LINIES_IDEA313_261121 del Llibre Mestre (21-11-2026, ordre del Mestre
   de les 16:03). Si canvia, canvia allí primer. v1.2.17 · Gauntlet R1 (L1-07). */
const LITERAL = {
  ca: ['Benvinguda al Projecte Sóc de Poble', 'Passeja al teu ritme, com a foraster pots veure qualsevol informació pública.', 'Entra quan vulgues CONNECTAR amb la teua gent, o treballar en privat.', 'Entrar'],
  es: ['Bienvenida al Proyecto Sóc de Poble', 'Pasea a tu ritmo, como forastero puedes ver cualquier información pública.', 'Entra cuando quieras CONECTAR con tu gente, o trabajar en privado.', 'Entrar'],
  en: ['Welcome to the Sóc de Poble Project', 'Stroll at your own pace, as a guest you can view any public information.', 'Sign in whenever you want to CONNECT with your people, or work in private.', 'Sign in'],
  eu: ['Ongi etorri Sóc de Poble Proiektura', 'Ibili zure erritmoan, kanpotar gisa edozein informazio publiko ikus dezakezu.', 'Sartu zure jendearekin KONEKTATU nahi duzunean, edo pribatuan lan egiteko.', 'Sartu'],
  gl: ['Benvida ao Proxecto Sóc de Poble', 'Pasea ao teu ritmo, como forasteiro podes ver calquera información pública.', 'Entra cando queiras CONECTAR coa túa xente, ou traballar en privado.', 'Entrar'],
};

beforeEach(() => { desaBenvingudaForasterTancada(false); });
afterEach(() => { cleanup(); desaBenvingudaForasterTancada(false); });

describe('IDEA-313 · el model', () => {
  test('les 5 llengües porten el literal exacte del Mestre', () => {
    expect(LLENGUES_BENVINGUDA_FORASTER).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    for (const llengua of LLENGUES_BENVINGUDA_FORASTER) {
      const tx = TEXTOS_BENVINGUDA_FORASTER[llengua];
      expect([tx.titol, tx.linia1, tx.linia2, tx.entrar]).toEqual(LITERAL[llengua]);
      expect(tx.linia2).toContain(tx.emfasi);
      expect(tx.emfasi).toBe(tx.emfasi.toUpperCase());
    }
  });

  test('«Entrar» és el verb únic de B9: el de section.login.loginButton en cada llengua', () => {
    for (const llengua of LLENGUES_BENVINGUDA_FORASTER) {
      expect(TEXTOS_BENVINGUDA_FORASTER[llengua].entrar).toBe(DICCIONARIS[llengua]['section.login.loginButton']);
    }
  });

  test('una llengua desconeguda o una variant regional recauen bé', () => {
    expect(textosBenvingudaForaster('fr')).toBe(TEXTOS_BENVINGUDA_FORASTER.ca);
    expect(textosBenvingudaForaster(undefined)).toBe(TEXTOS_BENVINGUDA_FORASTER.ca);
    expect(textosBenvingudaForaster('es-ES')).toBe(TEXTOS_BENVINGUDA_FORASTER.es);
    /* v1.2.17 · Gauntlet R1 (L1-02) · El codi efectiu, el que porta el lang de la targeta. */
    expect(['fr', undefined, '', 'es-ES', 'GL'].map(llenguaBenvingudaForaster)).toEqual(['ca', 'ca', 'ca', 'es', 'gl']);
  });

  /* v1.2.17 · Gauntlet R1 (L1-09) · El nom de la ✕ pren el verb de `section.xat.tancaCerca` de cada
     diccionari («Tanca la cerca», «Cerrar la búsqueda», «Close search», «Itxi bilaketa», «Pechar a busca»). */
  test('el nom de la ✕ segueix la forma de section.xat.tancaCerca en cada llengua', () => {
    expect(Object.fromEntries(LLENGUES_BENVINGUDA_FORASTER.map((l) => [l, TEXTOS_BENVINGUDA_FORASTER[l].tanca]))).toEqual({
      ca: 'Tanca la benvinguda',
      es: 'Cerrar la bienvenida',
      en: 'Close welcome',
      eu: 'Itxi ongietorria',
      gl: 'Pechar a benvida',
    });
    for (const llengua of LLENGUES_BENVINGUDA_FORASTER) {
      const verb = DICCIONARIS[llengua]['section.xat.tancaCerca'].split(' ')[0];
      expect(TEXTOS_BENVINGUDA_FORASTER[llengua].tanca.split(' ')[0], llengua).toBe(verb);
    }
  });

  /* v1.2.17 · Gauntlet R1 (L1-05) · Amb l'emmagatzematge bloquejat (setVal torna false), la ✕ es
     recorda igualment dins de la sessió; tornar-la a mostrar l'oblida també en memòria. */
  test('amb l’emmagatzematge bloquejat, la ✕ es recorda en memòria dins de la sessió', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Emmagatzematge bloquejat', 'SecurityError');
    });
    try {
      expect(desaBenvingudaForasterTancada(true)).toBe(false);
      expect(getVal(CLAU, null)).toBeNull();
      expect(benvingudaForasterTancada()).toBe(true);
      desaBenvingudaForasterTancada(false);
      expect(benvingudaForasterTancada()).toBe(false);
    } finally {
      setItem.mockRestore();
    }
  });

  test('partsDeLinia no inventa cap èmfasi si la paraula no hi és', () => {
    expect(partsDeLinia('Entra quan vulgues CONNECTAR amb la teua gent.', 'CONNECTAR')).toEqual({ abans: 'Entra quan vulgues ', paraula: 'CONNECTAR', despres: ' amb la teua gent.' });
    expect(partsDeLinia('Sense èmfasi.', 'CONNECTAR')).toEqual({ abans: 'Sense èmfasi.', paraula: '', despres: '' });
  });
});

describe('IDEA-313 · la targeta', () => {
  test.each(LLENGUES_BENVINGUDA_FORASTER)('en «%s»: títol, dues línies, CONNECTAR destacat, un sol botó d’acció i zero soroll', (llengua) => {
    const [titol, linia1, linia2, entrar] = LITERAL[llengua];
    const tx = TEXTOS_BENVINGUDA_FORASTER[llengua];
    render(<AcollidaForasterXat idioma={llengua} onNavega={() => {}} />);
    const regio = screen.getByRole('region', { name: titol });
    expect(within(regio).getByRole('heading', { level: 2 }).textContent).toBe(titol);
    const paragrafs = [...regio.querySelectorAll('p')].map((p) => p.textContent);
    expect(paragrafs).toEqual([linia1, linia2]);
    expect(regio.querySelector('strong').textContent).toBe(tx.emfasi);
    const botons = within(regio).getAllByRole('button');
    expect(botons.map((b) => b.getAttribute('aria-label') || b.textContent)).toEqual([tx.tanca, entrar]);
    /* Zero soroll: ni insígnia, ni frase defensiva, ni desplegable, ni llista de passos, ni poble cablejat. */
    expect(regio.querySelector('ol, ul, [aria-expanded]')).toBeNull();
    expect(regio.textContent).not.toMatch(/Mode Foraster|inventad|Amaga els passos|La Torre|IAIA/);
  });

  test('«Entrar» porta a /registre amb la tornada al Xat, per la navegació que rep', () => {
    const onNavega = vi.fn();
    render(<AcollidaForasterXat idioma="ca" tornar="/xat?vista=" onNavega={onNavega} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onNavega).toHaveBeenCalledTimes(1);
    expect(onNavega).toHaveBeenCalledWith(rutaDEntrada({ tornar: '/xat?vista=' }));
    expect(onNavega.mock.calls[0][0]).toMatch(/^\/registre\?/);
  });

  test('la ✕ la tanca, ho recorda i no deixa cap pastilla; el focus passa al control següent', () => {
    const { unmount } = render(
      <div>
        <AcollidaForasterXat idioma="ca" onNavega={() => {}} />
        <button type="button">Primera conversa</button>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tanca la benvinguda' }));
    expect(benvingudaForasterTancada()).toBe(true);
    expect(document.querySelector('[data-sdp-foraster]')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Primera conversa' }));
    unmount();
    /* Tornar a aterrar: res, ni targeta ni pastilla. */
    const { container } = render(<AcollidaForasterXat idioma="ca" onNavega={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  /* v1.2.17 · Gauntlet R1 (L1-02) · La <section> diu la llengua dels textos que pinta: la demanada si
     en té, el valencià si no (el lector de pantalla no llegix castellà amb veu valenciana). */
  test.each([['ca', 'ca'], ['es', 'es'], ['en', 'en'], ['eu', 'eu'], ['gl', 'gl'], ['es-ES', 'es'], ['fr', 'ca']])(
    'amb idioma «%s», el lang de la targeta és «%s» i els textos hi casen',
    (idioma, codi) => {
      render(<AcollidaForasterXat idioma={idioma} onNavega={() => {}} />);
      const regio = screen.getByRole('region', { name: TEXTOS_BENVINGUDA_FORASTER[codi].titol });
      expect(regio.tagName).toBe('SECTION');
      expect(regio.getAttribute('lang')).toBe(codi);
    },
  );

  /* v1.2.17 · Gauntlet R1 (L1-05) · Pel component: amb l'emmagatzematge bloquejat, la ✕ continua
     recordada en tornar a aterrar dins de la mateixa sessió. */
  test('amb l’emmagatzematge bloquejat, tornar a aterrar dins de la sessió no la torna a mostrar', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Emmagatzematge bloquejat', 'SecurityError');
    });
    try {
      const { unmount } = render(<AcollidaForasterXat idioma="ca" onNavega={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'Tanca la benvinguda' }));
      expect(document.querySelector('[data-sdp-foraster]')).toBeNull();
      expect(getVal(CLAU, null)).toBeNull();
      unmount();
      const { container } = render(<AcollidaForasterXat idioma="ca" onNavega={() => {}} />);
      expect(container.innerHTML).toBe('');
    } finally {
      setItem.mockRestore();
    }
  });

  /* v1.2.17 · Gauntlet R1 (L1-04) · recorda={false} (l'espècimen de /disseny): ni llig ni escriu la
     clau de la targeta real; la ✕ la tanca només en memòria. */
  test('recorda={false}: la ✕ la tanca sense llegir ni escriure la clau real', () => {
    desaBenvingudaForasterTancada(true);
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    try {
      /* La real ja és tancada en aquest dispositiu, i la mostra es veu igualment. */
      const { unmount } = render(<AcollidaForasterXat idioma="ca" onNavega={() => {}} recorda={false} />);
      expect(screen.getByRole('region', { name: TEXTOS_BENVINGUDA_FORASTER.ca.titol })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Tanca la benvinguda' }));
      expect(document.querySelector('[data-sdp-foraster]')).toBeNull();
      unmount();
      for (const espia of [getItem, setItem, removeItem]) expect(cridesDeLaClau(espia)).toEqual([]);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
      removeItem.mockRestore();
    }
    /* I a l'inrevés: tancar la mostra no tanca la real. */
    desaBenvingudaForasterTancada(false);
    render(<AcollidaForasterXat idioma="ca" onNavega={() => {}} recorda={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tanca la benvinguda' }));
    expect(benvingudaForasterTancada()).toBe(false);
    expect(getVal(CLAU, null)).toBeNull();
  });

  test('l’espècimen de /disseny va amb recorda={false}: la seua ✕ no tanca la targeta real i «Torna a mostrar-la» la torna', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    try {
      render(<EspecimenAcollidaForasterXat />);
      fireEvent.click(screen.getByRole('button', { name: 'Tanca la benvinguda' }));
      expect(document.querySelector('[data-sdp-foraster]')).toBeNull();
      expect(benvingudaForasterTancada()).toBe(false);
      expect(cridesDeLaClau(setItem)).toEqual([]);
      fireEvent.click(screen.getByRole('button', { name: 'Torna a mostrar-la' }));
      expect(screen.getByRole('region', { name: TEXTOS_BENVINGUDA_FORASTER.ca.titol })).toBeTruthy();
    } finally {
      setItem.mockRestore();
    }
  });

  /* v1.2.17 · Gauntlet R1 (L1-06) · Sense onNavega, «Entrar» no navega: dins d'un amfitrió (WordPress,
     Sollutia) una navegació del document trauria la persona de la pàgina. */
  test('sense onNavega, «Entrar» no fa res: ni navega ni tanca la targeta', () => {
    const abans = window.location.href;
    render(<AcollidaForasterXat idioma="ca" />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(window.location.href).toBe(abans);
    expect(screen.getByRole('region', { name: TEXTOS_BENVINGUDA_FORASTER.ca.titol })).toBeTruthy();
    /* jsdom no navega mai fora del hash: el codi tampoc no ho ha d'intentar. */
    const font = readFileSync(resolve(process.cwd(), 'src/sections/xat/components/AcollidaForasterXat.jsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(font).not.toMatch(/location\s*\.\s*(assign|replace|href)|window\.open/);
  });
});
