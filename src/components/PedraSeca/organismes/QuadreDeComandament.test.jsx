/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · El Quadre de
   Comandament compacte: capçalera d'estat, targetes KPI d'etiqueta i xifra,
   l'explicació fora de les caixes, la gràfica de dues sèries amb el detall
   del punt sota el ratolí, el dit o el teclat, el rànquing d'una línia i el
   peu. Dades sintètiques; la peça no demana res a ningú. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { QuadreDeComandament, fraccioQuadre } from './QuadreDeComandament.jsx';

afterEach(() => cleanup());

const SERIES = [{ clau: 'visitants', nom: 'Visitants' }, { clau: 'vistes', nom: 'Vistes' }];
const VISTES = [92, 26, 15, 136, 0, 22, 26, 0, 7, 0, 0, 0, 18, 41, 32, 26, 5, 55, 2, 33, 31, 26, 32, 5];
const VISITANTS = [6, 6, 5, 9, 0, 3, 3, 0, 3, 0, 0, 0, 3, 3, 3, 5, 2, 3, 2, 7, 6, 4, 6, 3];
const PUNTS = VISTES.map((vistes, h) => {
  const hh = String(h).padStart(2, '0');
  return { id: `h${hh}`, etiqueta: `${hh}:00 h`, marca: h % 6 === 0 ? hh : '', valors: { vistes, visitants: VISITANTS[h] } };
});
const detall = ({ etiqueta, valors }) => `${etiqueta}: ${valors.vistes} vistes · ${valors.visitants} visitants`;
const GRAFICA = { titol: 'Visitants i vistes de cada hora', series: SERIES, punts: PUNTS, destacat: 'h23', detall, buit: 'Cap vista.', falta: 'No ha arribat.' };
const XIFRES = [
  { clau: 'visitants', nom: 'Visitants', valor: '16' },
  { clau: 'temps', nom: 'Temps mitjà', valor: '20 min', lector: '20 minuts' }
];
const RANQUING = {
  titol: 'Les seccions més visitades',
  intro: 'Visitants per secció.',
  files: [
    { clau: 'xat', nom: 'Xat', codi: '/xat', valor: '11 visitants', proporcio: 1 },
    { clau: 'notes', nom: 'Bloc de notes', codi: '/notes', valor: '8 visitants', proporcio: 8 / 11 },
    { clau: 'altres', nom: 'Altres adreces', valor: '2 adreces' }
  ],
  buit: 'Cap secció.',
  falta: 'La llista no ha arribat.',
  nota: <p>Les altres no es copien.</p>
};

const pinta = (props = {}) => render(
  <QuadreDeComandament
    estat={{ viu: true, text: 'En línia: 2 persones' }}
    periode="Les últimes 24 hores."
    xifres={XIFRES}
    explicacio={<ul><li><strong>Visitants</strong>: navegadors diferents.</li></ul>}
    grafica={GRAFICA}
    ranquing={RANQUING}
    peu={<p>Peu del quadre.</p>}
    nivell={5}
    {...props}
  />
).container;

const detallVisible = (arrel) => arrel.querySelector('.sdp-quadre__detall').textContent;
const botons = () => within(screen.getByRole('figure', { name: GRAFICA.titol })).getAllByRole('button');
/* Fracció de la pista que pinta una barra (<rect> dins d'una regió <svg>):
   la regió de dalt en fa `height` i la barra hi puja des de baix fins a y;
   la de baix comença en el zero i la barra (el doble d'alta, retallada) hi
   baixa fins a y + 200 %. El <rect> sempre travessa la vora del zero. */
const pc = (valor) => Number.parseFloat(valor) / 100;
const alcada = (rect) => {
  const regio = rect.closest('svg.sdp-quadre__regio');
  const y = pc(rect.getAttribute('y'));
  expect(rect.getAttribute('height')).toBe('200%');
  return pc(regio.getAttribute('height')) * (regio.hasAttribute('y') ? 2 + y : 1 - y);
};
const PISTA_PX = 128; // 8rem a 16px

describe('la peça', () => {
  /* El barril (PedraSeca/index.js) el porta l'espècimen del catàleg: des de dins de PedraSeca no s'hi importa. */
  test('no hi ha cap style= ni cap fetch', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('cap fetch'); });
    const arrel = pinta();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
    expect(arrel.querySelector('[style]')).toBeNull();
  });

  test('capçalera: la píndola viva amb el punt, i el període en cos de paràgraf', () => {
    const arrel = pinta();
    const estat = arrel.querySelector('.sdp-quadre__estat');
    expect(estat.textContent).toBe('En línia: 2 persones');
    expect(estat.classList.contains('sdp-quadre__estat--viu')).toBe(true);
    expect(estat.querySelector('.sdp-quadre__punt').getAttribute('aria-hidden')).toBe('true');
    expect(arrel.querySelector('.sdp-quadre__periode').tagName).toBe('P');
    cleanup();
    const sense = pinta({ estat: { viu: false, text: 'No se sap' } });
    expect(sense.querySelector('.sdp-quadre__estat').classList.contains('sdp-quadre__estat--viu')).toBe(false);
  });

  test('targetes KPI compactes: només etiqueta i xifra; el text sencer, per al lector', () => {
    const arrel = pinta();
    const targetes = [...arrel.querySelectorAll('.sdp-quadre__xifres > .sdp-quadre__xifra')];
    expect(targetes).toHaveLength(2);
    for (const targeta of targetes) {
      expect([...targeta.children].map((fill) => fill.tagName)).toEqual(['DT', 'DD']);
      expect(targeta.querySelector('dd').className).toBe('sdp-quadre__valor');
    }
    expect(targetes[1].querySelector('[aria-hidden="true"]').textContent).toBe('20 min');
    expect(targetes[1].querySelector('.sdp-nomes-lector').textContent).toBe('20 minuts');
  });

  test('l’explicació viu fora de les caixes: germana de la graella, no filla', () => {
    const arrel = pinta();
    const explicacio = arrel.querySelector('.sdp-quadre__explicacio');
    expect(explicacio.parentElement.classList.contains('sdp-quadre')).toBe(true);
    expect(explicacio.closest('.sdp-quadre__xifra, .sdp-quadre__xifres, .sdp-quadre__grafica')).toBeNull();
    expect(explicacio.previousElementSibling.classList.contains('sdp-quadre__xifres')).toBe(true);
    expect(explicacio.textContent).toBe('Visitants: navegadors diferents.');
    expect(arrel.querySelector('.sdp-quadre__peu').textContent).toBe('Peu del quadre.');
  });
});

describe('la gràfica de dues sèries', () => {
  test('figura amb nom i llegenda; un botó per punt amb el detall sencer per nom', () => {
    const arrel = pinta();
    const figura = screen.getByRole('figure', { name: GRAFICA.titol });
    expect([...figura.querySelectorAll('.sdp-quadre__llegenda > li')].map((li) => li.textContent)).toEqual(['Visitants', 'Vistes']);
    expect(figura.querySelector('.sdp-quadre__mostra--davant')).not.toBeNull();
    expect(figura.querySelector('.sdp-quadre__mostra--darrere')).not.toBeNull();
    const llista = botons();
    expect(llista).toHaveLength(24);
    expect(screen.getByRole('button', { name: '03:00 h: 136 vistes · 9 visitants' })).toBe(llista[3]);
    for (const amagat of figura.querySelectorAll('.sdp-quadre__pista, .sdp-quadre__marca')) expect(amagat.getAttribute('aria-hidden')).toBe('true');
    expect([...figura.querySelectorAll('.sdp-quadre__marca')].map((m) => m.textContent).filter(Boolean)).toEqual(['00', '06', '12', '18']);
    // Per defecte, el detall del punt destacat (l'hora en curs).
    expect(detallVisible(arrel)).toBe('23:00 h: 5 vistes · 3 visitants');
    expect(llista[23].getAttribute('aria-current')).toBe('true');
    expect(llista[23].closest('li').classList.contains('sdp-quadre__columna--destacada')).toBe(true);
    expect(llista.every((boto) => boto.getAttribute('aria-controls') === arrel.querySelector('.sdp-quadre__detall').id)).toBe(true);
  });

  test('barres bicolors sobre la mateixa escala: la primera sèrie davant, la segona darrere', () => {
    const arrel = pinta();
    const columna = botons()[3];
    const darrere = columna.querySelector('.sdp-quadre__barra--darrere');
    const davant = columna.querySelector('.sdp-quadre__barra--davant');
    expect(darrere.tagName.toLowerCase()).toBe('rect');
    expect(alcada(darrere)).toBe(1); // 136 de 136
    expect(alcada(davant)).toBeCloseTo(9 / 136, 5); // 9 de 136, exacte
    expect(darrere.compareDocumentPosition(davant) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([darrere.getAttribute('x'), darrere.getAttribute('width')]).toEqual(['10%', '80%']);
    expect([davant.getAttribute('x'), davant.getAttribute('width')]).toEqual(['30%', '40%']);
    // Zero no pinta res; sense negatius, ni línia del zero ni regió de baix.
    expect(botons()[4].querySelector('rect')).toBeNull();
    expect(arrel.querySelector('.sdp-quadre__eix, .sdp-quadre__barres--negatius')).toBeNull();
    expect(arrel.querySelectorAll('svg.sdp-quadre__regio[y]')).toHaveLength(0);
    for (const dibuix of arrel.querySelectorAll('.sdp-quadre__dibuix')) expect(dibuix.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  /* Gauntlet f8, F8-CRIT-01 · Amb 20 escalons de 6,4 px, 2 i 9 visitants de
     136 pintaven la mateixa barra (n1). Ara l'alçada és la fracció exacta:
     dos valors que en pantalla es distancien més d'1 px fan dues barres
     diferents, i cap valor positiu desapareix (mínim, l'1 %). */
  test('geometria exacta: monotonia estricta a 1 px i la fracció de veres', () => {
    pinta();
    const mesures = botons().flatMap((boto, h) => [
      ['vistes', VISTES[h], boto.querySelector('.sdp-quadre__barra--darrere')],
      ['visitants', VISITANTS[h], boto.querySelector('.sdp-quadre__barra--davant')]
    ]).filter(([, valor]) => valor > 0);
    expect(mesures.length).toBeGreaterThan(30);
    for (const [serie, valor, rect] of mesures) expect(alcada(rect), `${serie} ${valor}`).toBeCloseTo(Math.max(0.01, valor / 136), 5);
    for (const [, a, ra] of mesures) {
      for (const [, b, rb] of mesures) {
        if ((Math.abs(a - b) / 136) * PISTA_PX > 1) expect(alcada(ra), `${a} i ${b}`).not.toBeCloseTo(alcada(rb), 3);
      }
    }
    const visitantsDe = (h) => alcada(botons()[h].querySelector('.sdp-quadre__barra--davant'));
    expect(visitantsDe(16)).toBeLessThan(visitantsDe(2)); // 2 i 5
    expect(visitantsDe(2)).toBeLessThan(visitantsDe(19)); // 5 i 7
    expect(visitantsDe(19)).toBeLessThan(visitantsDe(3)); // 7 i 9
    // 08:00 h, 7 vistes i 3 visitants: dues alçades, no la mateixa.
    expect(alcada(botons()[8].querySelector('.sdp-quadre__barra--darrere'))).toBeGreaterThan(visitantsDe(8));
  });

  test('ratolí: el detall segueix el punter i torna al triat en eixir', () => {
    const arrel = pinta();
    fireEvent.pointerEnter(botons()[3], { pointerType: 'mouse' });
    expect(detallVisible(arrel)).toBe('03:00 h: 136 vistes · 9 visitants');
    expect(botons()[3].getAttribute('aria-current')).toBe('true');
    expect(botons()[3].closest('li').classList.contains('sdp-quadre__columna--triada')).toBe(true);
    fireEvent.pointerLeave(arrel.querySelector('.sdp-quadre__barres'), { pointerType: 'mouse' });
    expect(detallVisible(arrel)).toBe('23:00 h: 5 vistes · 3 visitants');
    // Un clic el fixa: eixir ja no el desfà.
    fireEvent.click(botons()[13]);
    fireEvent.pointerLeave(arrel.querySelector('.sdp-quadre__barres'), { pointerType: 'mouse' });
    expect(detallVisible(arrel)).toBe('13:00 h: 41 vistes · 3 visitants');
  });

  test('tacte: tocar fixa el punt, i el dit arrossegat recorre la gràfica sencera', () => {
    const arrel = pinta();
    const barres = arrel.querySelector('.sdp-quadre__barres');
    barres.getBoundingClientRect = () => ({ left: 10, width: 240, top: 0, right: 250, bottom: 150, height: 150, x: 10, y: 0 });
    fireEvent.pointerDown(barres, { pointerId: 1, pointerType: 'touch', clientX: 10 + 35 });
    expect(detallVisible(arrel)).toBe('03:00 h: 136 vistes · 9 visitants');
    fireEvent.pointerMove(barres, { pointerId: 1, pointerType: 'touch', clientX: 10 + 175 });
    expect(detallVisible(arrel)).toBe('17:00 h: 55 vistes · 3 visitants');
    fireEvent.pointerMove(barres, { pointerId: 1, pointerType: 'touch', clientX: 999 });
    expect(detallVisible(arrel)).toBe('23:00 h: 5 vistes · 3 visitants');
    fireEvent.pointerMove(barres, { pointerId: 1, pointerType: 'touch', clientX: 10 + 5 });
    fireEvent.pointerLeave(barres, { pointerId: 1, pointerType: 'touch' });
    expect(detallVisible(arrel)).toBe('00:00 h: 92 vistes · 6 visitants');
    // El toc sobre una barra (el clic que el segueix) també la fixa.
    fireEvent.click(botons()[19]);
    expect(detallVisible(arrel)).toBe('19:00 h: 33 vistes · 7 visitants');
    // El ratolí no fixa res en moure's: només previsualitza.
    fireEvent.pointerMove(barres, { pointerType: 'mouse', clientX: 10 + 35 });
    expect(detallVisible(arrel)).toBe('19:00 h: 33 vistes · 7 visitants');
  });

  test('teclat: un sol tabulador entra al grup i les fletxes, Inici i Fi el recorren', () => {
    const arrel = pinta();
    const enfocables = () => botons().filter((boto) => boto.tabIndex === 0);
    expect(enfocables()).toEqual([botons()[23]]);
    act(() => { botons()[23].focus(); });
    fireEvent.keyDown(botons()[23], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(botons()[22]);
    expect(detallVisible(arrel)).toBe('22:00 h: 32 vistes · 6 visitants');
    expect(enfocables()).toEqual([botons()[22]]);
    fireEvent.keyDown(botons()[22], { key: 'Home' });
    expect(document.activeElement).toBe(botons()[0]);
    fireEvent.keyDown(botons()[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(botons()[0]);
    fireEvent.keyDown(botons()[0], { key: 'ArrowRight' });
    expect(detallVisible(arrel)).toBe('01:00 h: 26 vistes · 6 visitants');
    fireEvent.keyDown(botons()[1], { key: 'End' });
    expect(document.activeElement).toBe(botons()[23]);
    const tecla = fireEvent.keyDown(botons()[23], { key: 'a' });
    expect(tecla).toBe(true); // cap altra tecla es queda
  });

  /* Gauntlet f8, F8-CRIT-02 i QDC-01 · Clic amb el ratolí i, sense moure'l,
     les fletxes: el focus avançava i el detall es quedava a l'hora del clic.
     Mana l'última interacció. */
  test('ratolí i teclat junts: amb el ratolí quiet, les fletxes mouen el detall', () => {
    const arrel = pinta();
    const estat = () => ({
      focus: botons().indexOf(document.activeElement),
      actual: botons().findIndex((boto) => boto.getAttribute('aria-current') === 'true'),
      triada: botons().findIndex((boto) => boto.closest('li').classList.contains('sdp-quadre__columna--triada')),
      detall: detallVisible(arrel)
    });
    fireEvent.pointerEnter(botons()[1], { pointerType: 'mouse' });
    fireEvent.pointerDown(botons()[1], { pointerType: 'mouse' });
    act(() => { botons()[1].focus(); });
    fireEvent.click(botons()[1]);
    expect(estat()).toEqual({ focus: 1, actual: 1, triada: 1, detall: '01:00 h: 26 vistes · 6 visitants' });
    fireEvent.keyDown(botons()[1], { key: 'ArrowRight' });
    fireEvent.keyDown(botons()[2], { key: 'ArrowRight' });
    expect(estat()).toEqual({ focus: 3, actual: 3, triada: 3, detall: '03:00 h: 136 vistes · 9 visitants' });
    // El ratolí torna a manar en entrar en una altra columna, i el teclat després.
    fireEvent.pointerEnter(botons()[5], { pointerType: 'mouse' });
    expect(detallVisible(arrel)).toBe('05:00 h: 22 vistes · 3 visitants');
    fireEvent.keyDown(botons()[3], { key: 'ArrowLeft' });
    expect(estat()).toEqual({ focus: 2, actual: 2, triada: 2, detall: '02:00 h: 15 vistes · 5 visitants' });
    // Una fletxa que no mou el focus (Inici a la primera) també desfà la previsualització.
    fireEvent.keyDown(botons()[2], { key: 'Home' });
    fireEvent.pointerEnter(botons()[9], { pointerType: 'mouse' });
    fireEvent.keyDown(botons()[0], { key: 'ArrowLeft' });
    expect(estat()).toEqual({ focus: 0, actual: 0, triada: 0, detall: '00:00 h: 92 vistes · 6 visitants' });
  });

  test('una sola sèrie: la barra ampla, sense la de davant, i el detall per defecte', () => {
    const punts = [{ id: 'a', etiqueta: 'dilluns', valors: { apunts: 3 } }, { id: 'b', etiqueta: 'dimarts', valors: { apunts: 0 } }];
    const arrel = pinta({ grafica: { titol: 'Apunts', series: [{ clau: 'apunts', nom: 'Apunts' }], punts, buit: 'Cap.' } });
    expect(arrel.querySelector('.sdp-quadre__barra--davant')).toBeNull();
    // La barra ampla per al 3; el 0 no pinta res.
    expect(arrel.querySelectorAll('.sdp-quadre__barra--darrere')).toHaveLength(1);
    expect(alcada(arrel.querySelector('.sdp-quadre__barra--darrere'))).toBe(1);
    expect(arrel.querySelectorAll('.sdp-quadre__llegenda > li')).toHaveLength(1);
    expect(detallVisible(arrel)).toBe('dimarts: Apunts 0');
    expect(screen.getByRole('button', { name: 'dilluns: Apunts 3' })).toBeTruthy();
  });

  /* Gauntlet f8, F8-CRIT-03 · Per a la Gestoria: un saldo de -320 no és
     «0», tot negatiu no és «buit» i una dada absent no és un zero. */
  describe('negatius i absents (Gestoria)', () => {
    const SALDO = [{ clau: 'saldo', nom: 'Saldo' }];
    const mesos = (...valors) => valors.map((saldo, i) => ({ id: `m${i}`, etiqueta: ['Gener', 'Febrer', 'Març'][i], valors: { saldo } }));
    const saldo = () => within(screen.getByRole('figure', { name: 'Saldo' })).getAllByRole('button');

    test('el detall per defecte diu el valor de veres, amb el format de la llengua donada', () => {
      const arrel = pinta({ grafica: { titol: 'Saldo', series: SALDO, punts: mesos(-320, 1320.5), destacat: 'm0', llengua: 'ca', buit: 'Cap.' } });
      expect(detallVisible(arrel)).toBe('Gener: Saldo -320');
      expect(screen.getByRole('button', { name: 'Febrer: Saldo 1.320,5' })).toBeTruthy();
      // Una llengua no vàlida no trenca res: el format del navegador.
      cleanup();
      pinta({ grafica: { titol: 'Saldo', series: SALDO, punts: mesos(-320), llengua: 'no_vàlida', buit: 'Cap.' } });
      expect(saldo()).toHaveLength(1);
      expect(saldo()[0].textContent).toMatch(/^Gener: Saldo -320/);
    });

    test('els negatius baixen des de la línia del zero, a escala amb els positius', () => {
      const arrel = pinta({ grafica: { titol: 'Saldo', series: SALDO, punts: mesos(-320, 1280, 0), buit: 'Cap.' } });
      expect(saldo()).toHaveLength(3);
      expect(arrel.querySelector('.sdp-quadre__barres').classList.contains('sdp-quadre__barres--negatius')).toBe(true);
      // El zero, a 1280 / 1600 de dalt: la línia i les dues regions hi casen.
      const linia = arrel.querySelector('.sdp-quadre__eix .sdp-quadre__zero');
      expect([linia.getAttribute('y1'), linia.getAttribute('y2')]).toEqual(['80%', '80%']);
      const [dalt, baix] = saldo()[0].querySelectorAll('svg.sdp-quadre__regio');
      expect([dalt.getAttribute('height'), baix.getAttribute('y'), baix.getAttribute('height')]).toEqual(['80%', '80%', '20%']);
      // -320 omple la regió de baix (el mínim) i 1280 la de dalt (el màxim).
      const negativa = saldo()[0].querySelector('.sdp-quadre__barra');
      expect(negativa.closest('svg.sdp-quadre__regio')).toBe(baix);
      expect(alcada(negativa)).toBeCloseTo(0.2, 5);
      // La base, retallada: el <rect> negatiu comença per damunt del zero.
      expect(pc(negativa.getAttribute('y'))).toBeLessThanOrEqual(-1);
      expect(alcada(saldo()[1].querySelector('.sdp-quadre__barra'))).toBeCloseTo(0.8, 5);
      expect(saldo()[2].querySelector('rect')).toBeNull();
    });

    test('tot negatiu es dibuixa: ni «buit» ni zeros', () => {
      const arrel = pinta({ grafica: { titol: 'Saldo', series: SALDO, punts: mesos(-320, -40), buit: 'Cap moviment.', falta: 'No ha arribat.' } });
      expect(screen.queryByText('Cap moviment.')).toBeNull();
      expect(saldo()).toHaveLength(2);
      expect(detallVisible(arrel)).toBe('Febrer: Saldo -40');
      expect(alcada(saldo()[0].querySelector('.sdp-quadre__barra'))).toBeCloseTo(1, 5);
      expect(alcada(saldo()[1].querySelector('.sdp-quadre__barra'))).toBeCloseTo(40 / 320, 5);
      expect(saldo()[0].querySelectorAll('svg.sdp-quadre__regio')).toHaveLength(1);
    });

    test('un valor absent no pinta barra i el detall diu «—»; cap valor numèric és «falta»', () => {
      const punts = [{ id: 'a', etiqueta: '03:00 h', valors: { visitants: null, vistes: 12 } }];
      const arrel = pinta({ grafica: { ...GRAFICA, punts, destacat: 'a', detall: undefined } });
      expect(detallVisible(arrel)).toBe('03:00 h: Visitants — · Vistes 12');
      expect(botons()[0].querySelector('.sdp-quadre__barra--davant')).toBeNull();
      expect(alcada(botons()[0].querySelector('.sdp-quadre__barra--darrere'))).toBe(1);
      cleanup();
      pinta({ grafica: { ...GRAFICA, punts: [{ id: 'a', etiqueta: '03:00 h', valors: { visitants: null, vistes: undefined } }] } });
      expect(screen.getByText('No ha arribat.')).toBeTruthy();
      expect(screen.queryByText('Cap vista.')).toBeNull();
    });
  });

  test('buit (tot a zero o sense punts) i falta (la dada no ha arribat): text, cap botó', () => {
    const zeros = PUNTS.map((punt) => ({ ...punt, valors: { vistes: 0, visitants: 0 } }));
    let arrel = pinta({ grafica: { ...GRAFICA, punts: zeros } });
    expect(screen.getByRole('figure', { name: GRAFICA.titol }).textContent).toMatch(/Cap vista\.$/);
    expect(arrel.querySelector('.sdp-quadre__boto')).toBeNull();
    cleanup();
    arrel = pinta({ grafica: { ...GRAFICA, punts: [] } });
    expect(screen.getByText('Cap vista.')).toBeTruthy();
    cleanup();
    arrel = pinta({ grafica: { ...GRAFICA, punts: null } });
    expect(screen.getByText('No ha arribat.')).toBeTruthy();
    expect(arrel.querySelector('.sdp-quadre__grafica')).toBeNull();
  });
});

describe('el rànquing compacte', () => {
  test('títol del nivell demanat, la llista amb el seu nom i una línia per fila', () => {
    const arrel = pinta();
    const titol = screen.getByRole('heading', { level: 5, name: 'Les seccions més visitades' });
    const llista = screen.getByRole('list', { name: 'Les seccions més visitades' });
    expect(llista.classList.contains('sdp-quadre__ranquing')).toBe(true);
    expect(titol.nextElementSibling.textContent).toBe('Visitants per secció.');
    const files = within(llista).getAllByRole('listitem');
    expect(files.map((fila) => fila.querySelector('.sdp-quadre__nom').textContent)).toEqual(['Xat', 'Bloc de notes', 'Altres adreces']);
    // Nom i codi en línia, dins de la mateixa etiqueta; el comptador, a la dreta.
    expect(files[0].querySelector('.sdp-quadre__etiqueta').textContent).toBe('Xat /xat');
    expect(files[0].querySelector('.sdp-quadre__etiqueta code').textContent).toBe('/xat');
    expect(files.map((fila) => fila.querySelector('.sdp-quadre__compte').textContent)).toEqual(['11 visitants', '8 visitants', '2 adreces']);
    expect(files.map((fila) => fila.querySelector('.sdp-quadre__proporcio-barra')?.getAttribute('width') ?? null))
      .toEqual(['100%', '72.727%', null]);
    expect(files[0].querySelector('.sdp-quadre__proporcio').getAttribute('aria-hidden')).toBe('true');
    expect(files[0].querySelector('.sdp-quadre__proporcio').tagName.toLowerCase()).toBe('svg');
    expect(files[0].querySelector('.sdp-quadre__proporcio-barra').getAttribute('ry')).toBe('50%');
    expect(files[2].querySelector('code')).toBeNull();
    expect(arrel.querySelector('.sdp-quadre__nota').textContent).toBe('Les altres no es copien.');
  });

  /* Gauntlet f8, F8-CRIT-05 · Amb 10 escalons, 5 i 6 de 11 feien la mateixa
     barra (n5). Ara l'amplada és exacta: cada enter de l'1 a l'11, la seua. */
  test('la barra de proporció és exacta: dos comptes diferents, dues amplades', () => {
    const files = Array.from({ length: 11 }, (_, i) => ({ clau: `s${i}`, nom: `Secció ${i + 1}`, valor: `${i + 1}`, proporcio: (i + 1) / 11 }));
    pinta({ ranquing: { ...RANQUING, files } });
    const amplades = screen.getAllByRole('listitem')
      .map((fila) => fila.querySelector('.sdp-quadre__proporcio-barra'))
      .filter(Boolean)
      .map((rect) => Number.parseFloat(rect.getAttribute('width')));
    expect(amplades).toHaveLength(11);
    expect(new Set(amplades).size).toBe(11);
    amplades.forEach((amplada, i) => expect(amplada).toBeCloseTo(((i + 1) / 11) * 100, 2));
    // Zero no pinta barra; la pista queda.
    cleanup();
    pinta({ ranquing: { ...RANQUING, files: [{ clau: 'z', nom: 'Res', valor: '0', proporcio: 0 }] } });
    expect(document.querySelector('.sdp-quadre__proporcio')).toBeTruthy();
    expect(document.querySelector('.sdp-quadre__proporcio-barra')).toBeNull();
  });

  test('sense files, el text de buit; sense la dada, el de falta', () => {
    pinta({ ranquing: { ...RANQUING, files: [] } });
    expect(screen.getByText('Cap secció.')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Les seccions més visitades' })).toBeNull();
    cleanup();
    pinta({ ranquing: { ...RANQUING, files: null } });
    expect(screen.getByText('La llista no ha arribat.')).toBeTruthy();
  });
});

test('quadre buit: sense props no pinta cap caixa', () => {
  const { container } = render(<QuadreDeComandament />);
  expect(container.querySelector('.sdp-quadre').children).toHaveLength(0);
});

test('fraccioQuadre: exacta de 0 a 1, sense escalons; un valor positiu sempre es veu (1 %)', () => {
  expect(fraccioQuadre(136, 136)).toBe(1);
  expect(fraccioQuadre(9, 136)).toBe(9 / 136);
  expect(fraccioQuadre(2, 136)).not.toBe(fraccioQuadre(9, 136));
  expect(fraccioQuadre(5 / 11, 1)).not.toBe(fraccioQuadre(6 / 11, 1));
  expect(fraccioQuadre(1, 1000)).toBe(0.01);
  expect(fraccioQuadre(200, 136)).toBe(1);
  expect(fraccioQuadre(0, 136)).toBe(0);
  expect(fraccioQuadre(-3, 136)).toBe(0);
  expect(fraccioQuadre(3, 0)).toBe(0);
  expect(fraccioQuadre(Number.NaN, 5)).toBe(0);
});
