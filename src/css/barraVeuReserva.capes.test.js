import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/* Onada R28 · veu-editorial-04 (revisió adversarial) · La barra de veu és fixa i tapava el final de la
   pàgina: amb la barra oberta, el contenidor de PageFrame (data-sdp-veu-reserva, la prova de DOM és a
   BarraReproductorVeu.test.jsx) reserva al final l'alçada que la barra ocupa per damunt de la reserva
   que ja té el scroller. jsdom no calcula ni capes, ni pseudoelements, ni position: fixed: es comprova
   la regla escrita i que la suma de la reserva és la mateixa distància a què seu la barra. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const full = net('src/css/diferit-barra-veu.css');
const layout = net('src/css/layout.css');

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. */
const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

/** Regles fulla { selectors, cos } d'un full (sense blocs niats dins del cos). */
const reglesFulla = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, prelud, cos]) => ({
  selectors: prelud.split(',').map((sel) => sel.trim()).filter(Boolean),
  cos: cos.trim(),
}));
const reglaDe = (css, selector) => reglesFulla(css).find((r) => r.selectors.includes(selector)) || null;
const valor = (regla, propietat) => regla?.cos.match(new RegExp(`(?:^|;)\\s*${propietat}:\\s*([^;]+)`))?.[1].trim() ?? null;
/** Els sumands d'un calc(a + b + c), ordenats: la suma no depén de l'ordre. */
const sumands = (expressio) => String(expressio || '').replace(/^calc\(/, '').replace(/\)$/, '')
  .split(' + ').map((terme) => terme.trim()).filter(Boolean).sort();

const ALCADA = 'var(--barra-veu-alcada, 0px)';
const RESERVA = '.sdp-universal-page-container[data-sdp-veu-reserva="true"]::after';
const RESERVA_COMPACTA = `:where(.sdp-root.is-compact) ${RESERVA}`;

describe('Onada R28 · veu-editorial-04 · reserva d’alçada amb la barra de veu oberta', () => {
  test('la reserva és un bloc buit al final del contenidor, dins de @layer components', () => {
    const regla = reglaDe(full, RESERVA);
    expect(regla, RESERVA).not.toBeNull();
    expect(valor(regla, 'content')).toBe('""');
    expect(valor(regla, 'display')).toBe('block');
    /* En mode «contained» el contenidor és flex: la reserva no s'encongix ni creix. */
    expect(valor(regla, 'flex')).toBe('none');
    expect(blocDe(full, '@layer components {', RESERVA)).not.toBe('');
    expect(blocDe(full, '@layer components {', RESERVA_COMPACTA)).not.toBe('');
  });

  test('escriptori · la reserva suma l’alçada mesurada a la mateixa distància a què seu la barra (el visor no en reserva cap)', () => {
    const reserva = valor(reglaDe(full, RESERVA), 'block-size');
    expect(reserva).toContain(ALCADA);
    const barra = valor(reglaDe(full, '.sdp-barra-veu'), 'bottom');
    expect(barra).toBeTruthy();
    expect(sumands(reserva)).toEqual(sumands(`${barra.replace(/\)$/, '')} + ${ALCADA})`));
  });

  test('compacte · la reserva més el coixí del scroller (nav.mobile-nav + zona segura) és la distància de la barra', () => {
    const reserva = valor(reglaDe(full, RESERVA_COMPACTA), 'block-size');
    expect(reserva).toContain(ALCADA);
    const barraCompacta = valor(reglaDe(full, '.sdp-barra-veu[data-compacte="true"]'), 'bottom');
    const visor = valor(reglaDe(layout, ':where(.sdp-root.is-compact) .app-main__content'), 'padding-bottom');
    const contingut = valor(reglaDe(layout, ':where(.sdp-root.is-compact) .app-main__content > .sdp-universal-page-container--contained'), 'bottom');
    expect(barraCompacta).toBeTruthy();
    expect(visor).toBeTruthy();
    /* Els dos scrollers de PageFrame en compacte acaben a la mateixa reserva de la barra inferior. */
    expect(sumands(contingut)).toEqual(sumands(visor));
    const sumaReserva = [...sumands(visor), ...sumands(reserva).filter((terme) => terme !== ALCADA)].sort();
    expect(sumaReserva).toEqual(sumands(barraCompacta));
  });

  test('la regla compacta va darrere de la d’escriptori: la mateixa especificitat (:where() pesa 0) i guanya per ordre', () => {
    expect(full.indexOf(RESERVA_COMPACTA)).toBeGreaterThan(full.indexOf(`${RESERVA} {`));
  });

  test('el focus que es mou amb el teclat tampoc no queda davall de la barra: scroll-padding-bottom als dos scrollers', () => {
    const escriptori = [
      '.sdp-root[data-sdp-veu-oberta="true"] .app-main__content',
      '.sdp-root[data-sdp-veu-oberta="true"] .sdp-universal-page-container--contained',
    ];
    for (const selector of escriptori) {
      expect(valor(reglaDe(full, selector), 'scroll-padding-bottom'), selector).toContain(ALCADA);
    }
    const visor = valor(reglaDe(full, '.sdp-root.is-compact[data-sdp-veu-oberta="true"] .app-main__content'), 'scroll-padding-bottom');
    expect(visor).toContain(ALCADA);
    expect(visor).toContain('var(--sdp-alt-nav-mobil)');
    const contingut = valor(reglaDe(full, '.sdp-root.is-compact[data-sdp-veu-oberta="true"] .sdp-universal-page-container--contained'), 'scroll-padding-bottom');
    expect(contingut).toContain(ALCADA);
    /* El contenidor «contained» compacte ja acaba damunt de nav.mobile-nav: no la torna a sumar. */
    expect(contingut).not.toContain('--sdp-alt-nav-mobil');
  });

  test('en paper no hi ha barra ni reserva', () => {
    expect(blocDe(full, '@media print {', RESERVA)).toContain(`${RESERVA} { display: none; }`);
  });
});
