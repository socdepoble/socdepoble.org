/* P1-64 (pla 261028_1526 §3.7.1; decisions 1 i 9 del Mestre, 261028) · El
   renderitzador del Mapa Fotogràfic amb Leaflet 1.9.4 de veres dins de jsdom.
   jsdom no fa disseny: el llenç del mapa diu que fa 800 × 600 (clientWidth i
   clientHeight), que és el que Leaflet mesura. Les tessel·les es comproven pel
   seu <img> (jsdom no les descarrega mai). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ nativa: false, resol: null }));
vi.mock('../../config/origenPublic.js', async (original) => ({ ...(await original()), esAppNativa: () => mocks.nativa }));
/* D3 (261028) · El port de mitjans: només el que la prova li diga. */
vi.mock('../../data/backendPort.js', async (original) => ({ ...(await original()), resolveAsset: (ref) => (mocks.resol ? mocks.resol(ref) : Promise.reject(new Error('sense port'))) }));
import MapaFotografic from './MapaFotografic.jsx';

const FOTO = (nom) => `/assets/uploads/gent/veina/mur/${nom}.webp`;
const GPS = (lat, lng) => ({ lat, lng, precisio: 'exacta', precisio_m: 1, origen: 'exif' });
const FONTS = {
  id: 'fonts', type: 'feed', title: 'Les fonts de la Torre', poble_id: 'la-torre-de-les-macanes',
  image_url: FOTO('f1'), geolocalitzacio: GPS(38.5919, -0.4184), dataCaptura: '2026-10-12T10:00:00+02:00',
  fotos_geo: [
    { src: FOTO('f2'), lat: 38.5921, lng: -0.4181, precisio: 'exacta', precisio_m: 1, dataCaptura: '2026-10-12T10:20:00+02:00' },
    { src: FOTO('f3'), dataCaptura: '2026-10-12T10:25:00+02:00' }
  ]
};
const PENAGUILA = { id: 'castell', type: 'feed', title: 'El castell', poble_id: 'penaguila', image_url: FOTO('p1') };
const FRANCA = {
  id: 'pont', type: 'event', title: '<img src=x onerror=alert(1)>', image_url: FOTO('pont'),
  geolocalitzacio: GPS(43.9475, 4.535), dataCaptura: '2026-10-14T12:00:00+02:00'
};
const ITEMS = [FONTS, PENAGUILA, FRANCA];
/* A 28 km de la Torre: amb 100 km, al mateix grup, però el requadre no cap en el zoom 12. */
const ALACANT = { id: 'platja', type: 'feed', title: 'La platja', image_url: FOTO('al1'), geolocalitzacio: GPS(38.345, -0.481), dataCaptura: '2026-10-13T09:00:00+02:00' };
/* Un GPS de veres que l'autor va arrodonir al poble. */
const MIRADOR = {
  id: 'mirador', type: 'feed', title: 'El mirador', image_url: FOTO('m1'),
  geolocalitzacio: { lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000, origen: 'exif' }, dataCaptura: '2026-10-12T12:00:00+02:00'
};

const MIDA = { clientWidth: 800, clientHeight: 600 };
beforeAll(() => {
  for (const [nom, valor] of Object.entries(MIDA)) {
    Object.defineProperty(HTMLElement.prototype, nom, {
      configurable: true,
      get() { return this.classList?.contains('sdp-mapa__llenc') ? valor : 0; }
    });
  }
});
afterAll(() => {
  for (const nom of Object.keys(MIDA)) delete HTMLElement.prototype[nom];
});

let mapa;
let fetchEspia;
beforeEach(() => {
  mocks.nativa = false;
  mapa = null;
  window.localStorage.clear();
  fetchEspia = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('cap xarxa a les proves')));
});
afterEach(() => {
  cleanup();
  fetchEspia.mockRestore();
});

async function munta(props = {}) {
  const resultat = render(<MapaFotografic items={ITEMS} onMapa={(instancia) => { mapa = instancia; }} {...props} />);
  await waitFor(() => expect(mapa).toBeTruthy());
  await waitFor(() => expect(document.querySelector('.sdp-mapa-targeta, .sdp-mapa-foto')).not.toBeNull());
  return resultat;
}

const llenc = () => document.querySelector('.sdp-mapa__llenc');
const tesseles = () => [...document.querySelectorAll('img')].filter((img) => (img.getAttribute('src') || '').includes('tile.openstreetmap.org'));
const lliscador = () => screen.getByRole('slider', { name: 'Agrupació per distància' });
const valor = () => document.querySelector('.sdp-mapa__valor').textContent;
const ajuda = () => document.querySelector('.sdp-mapa__ajuda').textContent;
const posicioDe = (targeta) => {
  const icona = targeta.closest('.leaflet-marker-icon');
  return [parseFloat(icona.style.left), parseFloat(icona.style.top)];
};
const pinta = async (fes) => {
  await act(async () => { fes(); });
  await act(async () => { await new Promise((resol) => setTimeout(resol, 40)); });
};
const punter = (element, tipus, x, y) => element.dispatchEvent(new PointerEvent(tipus, { bubbles: true, cancelable: true, button: 0, pointerId: 7, clientX: x, clientY: y }));

describe('miniatures pujades (sdp-media://)', () => {
  const PUJADA = 'sdp-media://mitjans/veina/mur/pujada.webp';
  const AMB_PUJADA = { id: 'pujada', type: 'feed', title: 'La pujada', image_url: PUJADA, geolocalitzacio: GPS(38.5919, -0.4184), dataCaptura: '2026-10-12T10:00:00+02:00' };
  const imatgesDeLaPujada = () => [...document.querySelectorAll('.sdp-mapa-targeta img, .sdp-mapa-foto img')];

  test('el port la resol i la miniatura pinta la URL resolta; mai la referència crua', async () => {
    mocks.resol = vi.fn(async () => '/assets/uploads/resolta/pujada.webp');
    await munta({ items: [AMB_PUJADA] });
    await waitFor(() => expect(imatgesDeLaPujada().some((img) => img.getAttribute('src') === '/assets/uploads/resolta/pujada.webp')).toBe(true));
    expect([...document.querySelectorAll('img')].some((img) => (img.getAttribute('src') || '').startsWith('sdp-media:'))).toBe(false);
    expect(mocks.resol).toHaveBeenCalledWith(PUJADA);
    mocks.resol = null;
  });

  test('si el port falla o torna una adreça que no és segura, cap imatge es demana', async () => {
    mocks.resol = vi.fn(async () => 'javascript:alert(1)');
    await munta({ items: [{ ...AMB_PUJADA, image_url: 'sdp-media://mitjans/veina/mur/dolenta.webp' }] });
    await act(async () => { await new Promise((resol) => setTimeout(resol, 40)); });
    const imgs = imatgesDeLaPujada();
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs.every((img) => !img.getAttribute('src') && img.hidden)).toBe(true);
    mocks.resol = null;
  });
});

describe('fons i atribució', () => {
  test('«Vore mapa» apagat de sèrie: cap tessel·la fins a prémer-lo; l’atribució d’OSM sempre a la vista', async () => {
    await munta();
    const vore = screen.getByRole('button', { name: 'Vore mapa' });
    expect(vore.getAttribute('aria-pressed')).toBe('false');
    expect(tesseles()).toEqual([]);
    expect(document.querySelector('.leaflet-control-attribution').textContent).toContain('OpenStreetMap');

    await pinta(() => vore.click());
    const ocultar = screen.getByRole('button', { name: 'Ocultar mapa' });
    expect(ocultar.getAttribute('aria-pressed')).toBe('true');
    expect(tesseles().length).toBeGreaterThan(0);
    expect(tesseles().every((img) => /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(img.getAttribute('src')))).toBe(true);
    expect(window.localStorage.getItem('sdp-mapa-fons')).toBe('1');
    expect(document.querySelector('.sdp-mapa__estat').textContent).toContain('Carregant el fons detallat…');

    await pinta(() => ocultar.click());
    expect(tesseles()).toEqual([]);
    expect(window.localStorage.getItem('sdp-mapa-fons')).toBeNull();
    expect(document.querySelector('.leaflet-control-attribution').textContent).toContain('OpenStreetMap');
  });

  test('la tria es recorda en este navegador', async () => {
    window.localStorage.setItem('sdp-mapa-fons', '1');
    await munta();
    await waitFor(() => expect(tesseles().length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Ocultar mapa' }).getAttribute('aria-pressed')).toBe('true');
  });

  test('a l’app nativa no hi ha «Vore mapa» ni cap tessel·la, encara que el navegador la recorde', async () => {
    mocks.nativa = true;
    window.localStorage.setItem('sdp-mapa-fons', '1');
    await munta();
    expect(screen.queryByRole('button', { name: /Vore mapa|Ocultar mapa/ })).toBeNull();
    expect(tesseles()).toEqual([]);
    expect(document.querySelector('.leaflet-control-attribution').textContent).toContain('OpenStreetMap');
  });
});

describe('agrupació i nivells', () => {
  test('obri amb tot a la vista: grups numerats per la primera visita, i el de Penàguila amb la vora ocre', async () => {
    await munta();
    expect(document.querySelector('.sdp-mapa__estat').textContent).not.toContain('aproximada');
    const targetes = [...document.querySelectorAll('.sdp-mapa-targeta')];
    expect(targetes.length).toBeGreaterThan(0);
    const numeros = targetes.map((t) => Number(t.querySelector('.sdp-mapa-targeta__num').textContent)).sort((a, b) => a - b);
    expect(numeros).toEqual([...new Set(numeros)]);
    // Penàguila no porta GPS: ocre. Les fonts de la Torre en tenen una d'estimada (f3): també ocre.
    const ocres = targetes.filter((t) => t.classList.contains('sdp-mapa-targeta--ocre'));
    expect(ocres.length).toBeGreaterThan(0);
    // Cap color en línia: els punts porten la classe del seu to.
    const punts = [...llenc().querySelectorAll('path.sdp-mapa-punt')];
    expect(punts.length).toBeGreaterThan(0);
    expect(punts.every((p) => /sdp-mapa-punt--(verd|ocre)/.test(p.getAttribute('class')))).toBe(true);
  });

  test('el lliscador a la posició 5 tria 6 km sense canviar el zoom ni el centre', async () => {
    await munta();
    const zoom = mapa.getZoom();
    const centre = mapa.getCenter();
    expect(valor()).toBe('Automàtica segons el zoom');
    await pinta(() => fireEvent.change(lliscador(), { target: { value: '5' } }));
    expect(valor()).toBe('6 km');
    expect(ajuda()).toBe('Agrupem en un mateix node les parades que estan a 6 km o menys entre si. Les més allunyades queden en nodes separats.');
    expect(mapa.getZoom()).toBe(zoom);
    expect(mapa.getCenter().equals(centre)).toBe(true);
    expect(screen.getByRole('button', { name: 'Segons el zoom' }).getAttribute('aria-pressed')).toBe('false');
    await pinta(() => screen.getByRole('button', { name: 'Segons el zoom' }).click());
    expect(valor()).toBe('Automàtica segons el zoom');
  });

  test('des del zoom 16, foto a foto encara que hi haja un llindar manual de 30 km; en tornar al 12, els 30 km', async () => {
    await munta();
    await pinta(() => fireEvent.change(lliscador(), { target: { value: '3' } }));
    expect(valor()).toBe('30 km');
    await pinta(() => mapa.setView([38.592, -0.4183], 16, { animate: false }));
    expect(valor()).toBe('30 km · Detall local actiu');
    expect(ajuda()).toContain('Detall local actiu: cada foto conserva la seua ubicació.');
    const fotos = [...document.querySelectorAll('.sdp-mapa-foto')];
    // Les tres fotos de la Torre, cada una en el seu punt (f3, estimada al lloc de f2).
    expect(fotos).toHaveLength(3);
    expect(fotos.filter((f) => f.classList.contains('sdp-mapa-foto--ocre'))).toHaveLength(1);
    expect(llenc().querySelectorAll('path.sdp-mapa-recorregut')).toHaveLength(2);
    await pinta(() => mapa.setZoom(12, { animate: false }));
    expect(valor()).toBe('30 km');
    expect(ajuda()).toContain('30 km o menys');
    expect(document.querySelector('.sdp-mapa-foto')).toBeNull();
  });

  test('del 13 al 15 en automàtic, una targeta per parada', async () => {
    await munta();
    await pinta(() => mapa.setView([38.5919, -0.4184], 14, { animate: false }));
    expect(document.querySelector('.sdp-mapa__estat').textContent).toContain('Detall de parades');
    expect(document.querySelectorAll('.sdp-mapa-targeta').length).toBeGreaterThan(0);
  });
});

describe('acostar i teclat', () => {
  const cap = () => document.querySelector('.sdp-mapa-targeta .sdp-mapa-targeta__cap');

  test('«Acosta el mapa» sempre acosta: també «Tot junt» de lluny, amb França i la Torre', async () => {
    await munta();
    const abans = mapa.getZoom();
    expect(abans).toBeLessThanOrEqual(6);
    expect(document.querySelector('.sdp-mapa__estat').textContent).toContain('Tot junt');
    await pinta(() => cap().click());
    expect(mapa.getZoom()).toBe(abans + 2);
    // A la primera parada del grup (la més antiga): les fonts de la Torre, no el mig del Mediterrani.
    expect(mapa.getCenter().distanceTo([38.5919, -0.4184])).toBeLessThan(1);
  });

  test('«Acosta el mapa» amb un grup que no cap en el zoom 12 (100 km): acosta, no allunya', async () => {
    await munta({ items: [...ITEMS, ALACANT] });
    await pinta(() => mapa.setView([38.47, -0.45], 12, { animate: false }));
    await pinta(() => fireEvent.change(lliscador(), { target: { value: '1' } }));
    expect(valor()).toBe('100 km');
    await pinta(() => cap().click());
    expect(mapa.getZoom()).toBeGreaterThan(12);
  });

  test('«Acosta el mapa» amb un grup que hi cap: el requadre sencer, com a molt al zoom 13 o z + 2', async () => {
    await munta();
    await pinta(() => mapa.setView([38.6, -0.41], 9, { animate: false }));
    await pinta(() => fireEvent.change(lliscador(), { target: { value: '4' } }));
    const torre = [...document.querySelectorAll('.sdp-mapa-targeta')].find((t) => !t.textContent.includes('<img'));
    await pinta(() => torre.querySelector('.sdp-mapa-targeta__cap').click());
    expect(mapa.getZoom()).toBeGreaterThan(9);
    expect(mapa.getZoom()).toBeLessThanOrEqual(13);
    expect(mapa.getBounds().contains([38.6315, -0.3892])).toBe(true);
    expect(mapa.getBounds().contains([38.5919, -0.4184])).toBe(true);
  });

  test('ordre del teclat: l’agrupació i els controls de Leaflet abans de les targetes', async () => {
    await munta();
    const davant = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const targeta = document.querySelector('.sdp-mapa-targeta');
    expect(davant(lliscador(), llenc())).toBe(true);
    expect(davant(screen.getByRole('button', { name: 'Segons el zoom' }), llenc())).toBe(true);
    expect(davant(document.querySelector('.leaflet-control-zoom-in'), targeta)).toBe(true);
    expect(davant(document.querySelector('.leaflet-control-attribution'), targeta)).toBe(true);
  });

  test('una targeta sencera fora del mapa no entra en l’ordre del teclat; «Recol·locar grups» la torna', async () => {
    await munta();
    const clau = document.querySelector('.sdp-mapa-targeta').dataset.clau;
    const targeta = () => [...document.querySelectorAll('.sdp-mapa-targeta')].find((t) => t.dataset.clau === clau);
    const botons = () => [...targeta().querySelectorAll('button')];
    expect(botons().length).toBeGreaterThan(0);
    expect(botons().every((b) => b.tabIndex === 0)).toBe(true);
    act(() => {
      punter(targeta(), 'pointerdown', 10, 10);
      punter(targeta(), 'pointermove', 3010, 10);
      punter(targeta(), 'pointerup', 3010, 10);
    });
    await pinta(() => mapa.fire('moveend'));
    expect(botons().every((b) => b.tabIndex === -1)).toBe(true);
    await pinta(() => screen.getByRole('button', { name: 'Recol·locar grups' }).click());
    expect(botons().every((b) => b.tabIndex === 0)).toBe(true);
  });

  test('amb disseny (el navegador), cada botó que la vora del mapa tapa sencer ix de l’ordre del teclat', async () => {
    // jsdom no fa disseny: el llenç fa 800 × 600, el cap de cada targeta hi és dins i les miniatures, on diga foraX.
    const original = HTMLElement.prototype.getBoundingClientRect;
    const caixa = (x, y, width, height) => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height });
    let foraX = 5000;
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList?.contains('sdp-mapa__llenc')) return caixa(0, 0, 800, 600);
      if (this.closest?.('.sdp-mapa-targeta__miniatures')) return caixa(foraX, 10, 48, 48);
      if (this.closest?.('.sdp-mapa-targeta')) return caixa(10, 10, 160, 48);
      return original.call(this);
    };
    try {
      await munta();
      const miniatures = () => [...document.querySelectorAll('.sdp-mapa-targeta__miniatura')];
      expect(miniatures().length).toBeGreaterThan(0);
      expect(miniatures().every((b) => b.tabIndex === -1)).toBe(true);
      expect([...document.querySelectorAll('.sdp-mapa-targeta__cap')].every((b) => b.tabIndex === 0)).toBe(true);
      foraX = 100;
      await pinta(() => mapa.fire('moveend'));
      expect(miniatures().every((b) => b.tabIndex === 0)).toBe(true);
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original;
    }
  });

  test('si la targeta amb el focus ja no hi és després de repintar, el focus va al mapa (no al buit)', async () => {
    await munta();
    act(() => cap().focus());
    expect(document.activeElement).toBe(cap());
    await pinta(() => cap().click());
    expect(document.activeElement).toBe(llenc());
  });
});

describe('targetes arrossegables', () => {
  test('arrossegar (40, 30) px mou la targeta, no el mapa ni el punt; la línia la seguix i cap clic no obri el visor', async () => {
    await munta();
    const targeta = document.querySelector('.sdp-mapa-targeta');
    const [x, y] = posicioDe(targeta);
    const centre = mapa.getCenter();
    const linia = () => [...llenc().querySelectorAll('path.sdp-mapa-linia')].map((p) => p.getAttribute('d')).join('|');
    const abans = linia();
    const punts = [...llenc().querySelectorAll('path.sdp-mapa-punt')].map((p) => p.getAttribute('d')).join('|');

    act(() => {
      punter(targeta, 'pointerdown', 100, 100);
      expect(mapa.dragging.enabled()).toBe(false);
      punter(targeta, 'pointermove', 120, 110);
      punter(targeta, 'pointermove', 140, 130);
      punter(targeta, 'pointerup', 140, 130);
    });
    const [x2, y2] = posicioDe(targeta);
    expect([Math.round(x2 - x), Math.round(y2 - y)]).toEqual([40, 30]);
    expect(linia()).not.toBe(abans);
    expect([...llenc().querySelectorAll('path.sdp-mapa-punt')].map((p) => p.getAttribute('d')).join('|')).toBe(punts);
    expect(mapa.getCenter().equals(centre)).toBe(true);
    expect(mapa.dragging.enabled()).toBe(true);
    const desat = JSON.parse(window.localStorage.getItem('sdp-mapa-posicions-v1'));
    expect(Object.values(desat.posicions)).toHaveLength(1);

    // El clic que el navegador envia en deixar-la no obri cap foto.
    const peca = targeta.querySelector('.sdp-mapa-targeta__miniatura') || targeta.querySelector('.sdp-mapa-targeta__cap');
    act(() => peca.click());
    expect(document.querySelector('dialog[open]')).toBeNull();
  });

  test('la posició sobreviu al repintat i «Recol·locar grups» l’oblida', async () => {
    await munta();
    const clau = () => document.querySelector('.sdp-mapa-targeta').dataset.clau;
    const primera = clau();
    const targeta = () => [...document.querySelectorAll('.sdp-mapa-targeta')].find((t) => t.dataset.clau === primera);
    const [x, y] = posicioDe(targeta());
    act(() => {
      punter(targeta(), 'pointerdown', 10, 10);
      punter(targeta(), 'pointermove', 10, 70);
      punter(targeta(), 'pointerup', 10, 70);
    });
    await pinta(() => fireEvent.change(lliscador(), { target: { value: '0' } }));
    await pinta(() => screen.getByRole('button', { name: 'Segons el zoom' }).click());
    expect(posicioDe(targeta())[1] - y).toBeCloseTo(60, 0);
    await pinta(() => screen.getByRole('button', { name: 'Recol·locar grups' }).click());
    expect(window.localStorage.getItem('sdp-mapa-posicions-v1')).toBeNull();
    expect(posicioDe(targeta())).toEqual([x, y]);
  });

  test('Alt + fletxa mou la targeta 20 px des del teclat', async () => {
    await munta();
    const targeta = document.querySelector('.sdp-mapa-targeta');
    const [x] = posicioDe(targeta);
    act(() => { fireEvent.keyDown(targeta.querySelector('.sdp-mapa-targeta__cap'), { key: 'ArrowRight', altKey: true }); });
    expect(Math.round(posicioDe(targeta)[0] - x)).toBe(20);
  });
});

describe('textos, privacitat i visor', () => {
  test('el títol de la zona ix dels pobles de la llavor, sense cap crida a la xarxa', async () => {
    await munta();
    await pinta(() => mapa.setView([38.5925, -0.419], 14, { animate: false }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('La Torre de les Maçanes · rodalia');
    await pinta(() => mapa.setView([38.5925, -0.419], 9, { animate: false }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe("L'Alacantí");
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  test('el text de les targetes és text: un títol «<img onerror>» es llig tal qual', async () => {
    await munta();
    await pinta(() => mapa.setView([43.9475, 4.535], 16, { animate: false }));
    const foto = document.querySelector('.sdp-mapa-foto');
    expect(foto.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  test('una miniatura obri el visor amb eixa mateixa foto i les seues dades', async () => {
    await munta();
    await pinta(() => mapa.setView([38.592, -0.4183], 16, { animate: false }));
    const ocre = document.querySelector('.sdp-mapa-foto--ocre');
    await pinta(() => ocre.click());
    const dialeg = document.querySelector('dialog[open]');
    expect(dialeg).not.toBeNull();
    expect(within(dialeg).getAllByRole('img').some((img) => img.getAttribute('src') === FOTO('f3'))).toBe(true);
    expect(dialeg.textContent).toContain('Estimada a partir de la foto');
  });

  test('un GPS arrodonit al poble és verd i la targeta en diu la precisió; un d’exacte, no', async () => {
    await munta({ items: [...ITEMS, MIRADOR] });
    await pinta(() => mapa.setView([38.591, -0.419], 16, { animate: false }));
    const fotos = [...document.querySelectorAll('.sdp-mapa-foto')];
    const mirador = fotos.find((f) => f.textContent.includes('El mirador'));
    expect(mirador.classList.contains('sdp-mapa-foto--verd')).toBe(true);
    expect(mirador.textContent).toContain('GPS només del poble');
    expect(mirador.getAttribute('aria-label')).toContain('GPS només del poble');
    expect(fotos.filter((f) => f !== mirador).some((f) => /GPS (a uns|només)/.test(f.textContent))).toBe(false);
    await pinta(() => mapa.setZoom(14, { animate: false }));
    const parada = [...document.querySelectorAll('.sdp-mapa-targeta')].find((t) => t.textContent.includes('El mirador'));
    expect(parada.textContent).toContain('GPS només del poble');
    // La foto de Penàguila, posada al centre del poble, no porta cap GPS: ocre i sense precisió de GPS.
    await pinta(() => mapa.setView([38.6315, -0.3892], 16, { animate: false }));
    const alPoble = document.querySelector('.sdp-mapa-foto');
    expect(alPoble.classList.contains('sdp-mapa-foto--ocre')).toBe(true);
    expect(alPoble.textContent).toContain('al poble');
    expect(alPoble.textContent).not.toContain('GPS');
  });

  test('amb massa parades diferents, l’agrupació aproximada es diu a l’estat', async () => {
    const rnd = (() => { let e = 17; return () => (e = (e * 16807) % 2147483647) / 2147483647; })();
    const molts = Array.from({ length: 1600 }, (_, i) => ({
      id: `m${i}`, type: 'feed', image_url: FOTO(`m${i}`), geolocalitzacio: GPS(36 + rnd() * 10, -4 + rnd() * 10),
      dataCaptura: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}T10:00:00+02:00`
    }));
    await munta({ items: molts });
    expect(mapa.getZoom()).toBeLessThanOrEqual(6);
    expect(document.querySelector('.sdp-mapa__estat').textContent).toMatch(/Agrupació aproximada: hi ha massa parades diferents \(precisió ≈ \d/);
  }, 20000);

  test('sense cap foto amb lloc ho diu, i les fotos sense GPS ni poble queden pendents', async () => {
    render(<MapaFotografic items={[{ id: 'o', type: 'feed', image_url: FOTO('o') }]} onMapa={(instancia) => { mapa = instancia; }} />);
    await waitFor(() => expect(mapa).toBeTruthy());
    expect(screen.getByText(/Encara no hi ha cap foto del Mur amb lloc/)).toBeTruthy();
    expect(screen.getByText('1 foto pendent d’ubicar: no porta GPS ni poble.')).toBeTruthy();
  });

  test('dins d’un shadow root, els fulls s’hi adopten (o hi van amb un <style>), no al document', async () => {
    const amfitrio = document.createElement('div');
    document.body.append(amfitrio);
    const ombra = amfitrio.attachShadow({ mode: 'open' });
    const dins = document.createElement('div');
    ombra.append(dins);
    render(<MapaFotografic items={ITEMS} onMapa={(instancia) => { mapa = instancia; }} />, { container: dins });
    await waitFor(() => expect(mapa).toBeTruthy());
    expect(ombra.querySelector('style[data-sdp-mapa]') || ombra.adoptedStyleSheets?.length).toBeTruthy();
    amfitrio.remove();
  });
});
