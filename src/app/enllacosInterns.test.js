/**
 * Interceptor d'enllaços interns (enxufe, 260929): la decisió és pura i es
 * prova per taula; la cerca de l'<a> es prova amb clics de veres (dins i fora
 * de l'arrel, i dins d'un shadow root com el de <soc-de-poble>).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ancoraDelClic, desplacadorDelClic, fragmentDelDesti, hrefInternDeClic, preparaRecolocacio } from './enllacosInterns.js';

afterEach(() => { document.body.replaceChildren(); });

function ancora(atributs = {}) {
  const a = document.createElement('a');
  for (const [nom, valor] of Object.entries(atributs)) a.setAttribute(nom, valor);
  return a;
}

const CLIC = Object.freeze({ button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, defaultPrevented: false });
const clic = (canvis = {}) => ({ ...CLIC, ...canvis });

describe('hrefInternDeClic · quins href passen al router', () => {
  it.each([
    ['?item=x', '?item=x'],
    ['?vista=comunitats&x=1', '?vista=comunitats&x=1'],
    ['/events/manifest-de-poble', '/events/manifest-de-poble'],
    ['/xat?vista=comunitats', '/xat?vista=comunitats'],
    ['/', '/'],
    ['/mercat/samarreta#preu', '/mercat/samarreta#preu']
  ])('%s → %s (l’href cru)', (href, esperat) => {
    expect(hrefInternDeClic(clic(), ancora({ href }))).toBe(esperat);
  });

  it.each([
    ['protocol relatiu', '//evil.test/x'],
    ['barra invertida', '/\\evil.test'],
    ['tabulador que el parser lleva', '/\t/evil.test'],
    ['salt de línia que el parser lleva', '/\n/evil.test'],
    ['absolut https', 'https://exemple.org/recepta'],
    ['mailto', 'mailto:veina@exemple.org'],
    ['javascript', 'javascript:alert(1)'],
    ['àncora', '#main-content'],
    ['buit', ''],
    ['relatiu sense barra', 'xat'],
    ['relatiu amb punts', '../wikidepoble'],
    ['recurs estàtic', '/assets/doc.pdf'],
    ['recurs estàtic arrel', '/assets/']
  ])('%s (%s) → null', (_, href) => {
    expect(hrefInternDeClic(clic(), ancora({ href }))).toBeNull();
  });

  it('sense atribut href → null', () => {
    expect(hrefInternDeClic(clic(), ancora())).toBeNull();
  });

  it.each([
    ['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']
  ])('amb %s → null (pestanya o finestra nova: natiu)', (tecla) => {
    expect(hrefInternDeClic(clic({ [tecla]: true }), ancora({ href: '?item=x' }))).toBeNull();
  });

  it.each([[1], [2]])('botó %s → null', (button) => {
    expect(hrefInternDeClic(clic({ button }), ancora({ href: '/xat' }))).toBeNull();
  });

  it('un clic ja atés (defaultPrevented, com fa un <Link>) → null', () => {
    expect(hrefInternDeClic(clic({ defaultPrevented: true }), ancora({ href: '/xat' }))).toBeNull();
  });

  it('amb download → null', () => {
    expect(hrefInternDeClic(clic(), ancora({ href: '/xat', download: '' }))).toBeNull();
    expect(hrefInternDeClic(clic(), ancora({ href: '/xat', download: 'x.txt' }))).toBeNull();
  });

  it.each([
    ['', '/xat'],
    ['_self', '/xat'],
    ['_SELF', '/xat'],
    [' _self ', '/xat'],
    ['_blank', null],
    ['_top', null],
    ['_parent', null],
    ['marc', null]
  ])('target «%s» → %s', (target, esperat) => {
    expect(hrefInternDeClic(clic(), ancora({ href: '/xat', target }))).toBe(esperat);
  });

  it('dins de contingut editable → null (l’editor no segueix enllaços)', () => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const a = ancora({ href: '/xat' });
    editor.append(a);
    document.body.append(editor);
    expect(hrefInternDeClic(clic(), a)).toBeNull();
    editor.setAttribute('contenteditable', 'false');
    expect(hrefInternDeClic(clic(), a)).toBe('/xat');
  });

  it('sense esdeveniment o sense <a> → null', () => {
    expect(hrefInternDeClic(null, ancora({ href: '/xat' }))).toBeNull();
    expect(hrefInternDeClic(clic(), null)).toBeNull();
    expect(hrefInternDeClic(clic(), {})).toBeNull();
  });
});

/* Amb base declarada (router de navegador sota '/comunitat'), el contingut
   escriu rutes de l'app sense la base: arriben al router tal qual i navigate hi
   posa la base una vegada. Si l'href ja porta la base, se li lleva abans. Una
   pàgina de l'amfitrió és una URL completa i la segueix el navegador. */
describe('hrefInternDeClic · amb base declarada, la base no es dobla', () => {
  const BASE = '/comunitat';

  it.each([
    ['/comunitat/xat', '/xat'],
    ['/comunitat', '/'],
    ['/comunitat/', '/'],
    ['/comunitat/xat?vista=comunitats', '/xat?vista=comunitats'],
    ['/comunitat/mercat/samarreta#preu', '/mercat/samarreta#preu'],
    ['/comunitat/events/manifest-de-poble', '/events/manifest-de-poble'],
    // Els punts es resolen com ho faria el navegador: el destí és el mateix lloc.
    ['/comunitat/pobles/../xat', '/xat']
  ])('%s → %s (sense la base)', (href, esperat) => {
    expect(hrefInternDeClic(clic(), ancora({ href }), BASE)).toBe(esperat);
  });

  it.each([
    ['?item=x'],
    ['?vista=comunitats&x=1']
  ])('la consulta %s es passa tal qual (es resol sobre la ruta de l’app)', (href) => {
    expect(hrefInternDeClic(clic(), ancora({ href }), BASE)).toBe(href);
  });

  it.each([
    ['camí de l’app sense base', '/pobles', '/pobles'],
    ['arrel de l’app', '/', '/'],
    ['límit de segment: no és la base, és una ruta de l’app', '/comunitats/xat', '/comunitats/xat'],
    ['la base amb una altra caixa no és la base', '/Comunitat/xat', '/Comunitat/xat'],
    ['punts que ixen de la base', '/comunitat/../pobles', '/pobles'],
    ['%2e que ix de la base', '/comunitat/%2e%2e/pobles', '/pobles'],
    ['l’article de l’Aplec', '/events/manifest-de-poble', '/events/manifest-de-poble']
  ])('%s (%s) → %s: ruta de l’app, el router hi posa la base', (_, href, esperat) => {
    expect(hrefInternDeClic(clic(), ancora({ href }), BASE)).toBe(esperat);
  });

  it.each([
    ['recurs estàtic de l’amfitrió', '/assets/doc.pdf'],
    ['recurs estàtic sota la base', '/comunitat/assets/doc.pdf'],
    ['protocol relatiu', '//evil.test/comunitat/xat'],
    ['barra invertida', '/\\evil.test/comunitat/xat'],
    ['absolut https', 'https://exemple.org/comunitat/xat']
  ])('%s (%s) → null: el segueix el navegador', (_, href) => {
    expect(hrefInternDeClic(clic(), ancora({ href }), BASE)).toBeNull();
  });

  it('una base amb barra final val el mateix que sense', () => {
    expect(hrefInternDeClic(clic(), ancora({ href: '/comunitat/xat' }), '/comunitat/')).toBe('/xat');
    expect(hrefInternDeClic(clic(), ancora({ href: '/pobles' }), '/comunitat/')).toBe('/pobles');
  });

  it.each([
    ['buida', ''],
    ['arrel', '/'],
    ['relativa (invàlida)', 'comunitat'],
    ['protocol relatiu (invàlida)', '//evil.test'],
    ['no és text', undefined]
  ])('sense base efectiva (%s) l’href cru passa sencer', (_, base) => {
    expect(hrefInternDeClic(clic(), ancora({ href: '/comunitat/xat' }), base)).toBe('/comunitat/xat');
    expect(hrefInternDeClic(clic(), ancora({ href: '/pobles' }), base)).toBe('/pobles');
  });

  it('la base no afluixa cap altra condició: modificadors, target i editable continuen sent natius', () => {
    const a = ancora({ href: '/comunitat/xat' });
    expect(hrefInternDeClic(clic({ ctrlKey: true }), a, BASE)).toBeNull();
    expect(hrefInternDeClic(clic(), ancora({ href: '/comunitat/xat', target: '_blank' }), BASE)).toBeNull();
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.append(a);
    document.body.append(editor);
    expect(hrefInternDeClic(clic(), a, BASE)).toBeNull();
  });
});

describe('ancoraDelClic · l’<a> del clic, sense eixir de l’arrel', () => {
  /* composedPath() només té contingut mentre es despatxa: es llig dins de
     l'escoltador, com fa AppShell. El clic es cancel·la perquè jsdom no
     intente seguir l'enllaç. */
  function clicaI(node, arrel, escoltador = arrel) {
    let trobada;
    escoltador.addEventListener('click', (e) => { trobada = ancoraDelClic(e, arrel); e.preventDefault(); }, { once: true });
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    return trobada;
  }

  it('troba l’<a> encara que el clic caiga en un fill', () => {
    const arrel = document.createElement('div');
    const a = ancora({ href: '?item=x' });
    const span = document.createElement('span');
    a.append(span);
    arrel.append(a);
    document.body.append(arrel);
    expect(clicaI(span, arrel)).toBe(a);
  });

  it('un <a> de l’amfitrió que embolcalla l’arrel no és nostre', () => {
    const fora = ancora({ href: '/pagina-de-lamfitrio' });
    const arrel = document.createElement('div');
    const boto = document.createElement('button');
    arrel.append(boto);
    fora.append(arrel);
    document.body.append(fora);
    expect(clicaI(boto, arrel, fora)).toBeNull();
  });

  it('sense cap <a> al camí → null', () => {
    const arrel = document.createElement('div');
    const p = document.createElement('p');
    arrel.append(p);
    document.body.append(arrel);
    expect(clicaI(p, arrel)).toBeNull();
  });

  it('travessa el shadow root: l’<a> de dins es troba des de l’arrel de l’app', () => {
    const host = document.createElement('soc-de-poble-prova');
    document.body.append(host);
    const ombra = host.attachShadow({ mode: 'open' });
    const arrel = document.createElement('div');
    const a = ancora({ href: '/events/manifest-de-poble' });
    const text = document.createElement('strong');
    a.append(text);
    arrel.append(a);
    ombra.append(arrel);
    expect(clicaI(text, arrel)).toBe(a);
  });

  it('sense composedPath (o ja despatxat) recorre a target.closest(\'a\') i respecta l’arrel', () => {
    const arrel = document.createElement('div');
    const a = ancora({ href: '/xat' });
    const span = document.createElement('span');
    a.append(span);
    arrel.append(a);
    document.body.append(arrel);
    expect(ancoraDelClic({ target: span }, arrel)).toBe(a);
    expect(ancoraDelClic({ target: span, composedPath: () => [] }, arrel)).toBe(a);
    expect(ancoraDelClic({ target: span }, document.createElement('div'))).toBeNull();
    expect(ancoraDelClic(null)).toBeNull();
  });
});

/* ── Recol·locació de la vista (Llei del Píxel, C1) ─────────────────────────
   Una navegació de router no carrega cap document: el desplaçador de l'enllaç
   es queda on era (.sdp-workspace-detail a 12242 px). jsdom no fa maquetació:
   un desplaçador és un element amb overflow-y (el llig getComputedStyle) i
   unes mides fixades a mà; scrollTop sí que es guarda. */
function caixa({ overflow = 'visible', alt = 500, visible = 500, posicio = 0 } = {}) {
  const el = document.createElement('div');
  el.style.setProperty('overflow-y', overflow);
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: alt });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: visible });
  el.scrollTop = posicio;
  return el;
}
const desplacador = (canvis = {}) => caixa({ overflow: 'auto', alt: 5000, visible: 500, posicio: 1200, ...canvis });

/* Arrel > ... > <a>, niat en l'ordre donat, i penjat de `pare`. */
function niu(pare, ...nodes) {
  nodes.reduce((dalt, node) => { dalt.append(node); return node; });
  pare.append(nodes[0]);
  return nodes;
}

/* Com a ancoraDelClic: el camí compost es llig dins de l'escoltador. */
function alClic(node, arrel, fes) {
  let resultat;
  arrel.addEventListener('click', (e) => { resultat = fes(e); e.preventDefault(); }, { once: true });
  node.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return resultat;
}
const desplacadorAlClic = (node, arrel) => alClic(node, arrel, (e) => desplacadorDelClic(e, ancoraDelClic(e, arrel), arrel));
const recolocacioAlClic = (node, arrel, desti) => alClic(node, arrel, (e) => preparaRecolocacio(e, ancoraDelClic(e, arrel), arrel, desti));

describe('fragmentDelDesti · el #fragment del destí', () => {
  it.each([
    ['/mercat/samarreta#preu', 'preu'],
    ['?item=x#seccio-2', 'seccio-2'],
    ['?item=x#pl%C3%A0tan', 'pl%C3%A0tan'],
    ['/a#b#c', 'b#c'],
    ['?item=x', ''],
    ['/xat', ''],
    ['/xat#', ''],
    [null, '']
  ])('%s → «%s»', (desti, esperat) => {
    expect(fragmentDelDesti(desti)).toBe(esperat);
  });
});

describe('desplacadorDelClic · el desplaçador més pròxim a l’<a>, dins de l’arrel', () => {
  it('el primer ascendent amb overflow-y auto/scroll i contingut amagat, no el de més amunt', () => {
    const arrel = document.createElement('div');
    const [, interior, , a] = niu(arrel, desplacador({ overflow: 'scroll' }), desplacador(), caixa(), ancora({ href: '?item=x' }));
    document.body.append(arrel);
    expect(desplacadorAlClic(a, arrel)).toBe(interior);
  });

  it('salta el que no desborda i el que té overflow hidden o visible', () => {
    const arrel = document.createElement('div');
    const [exterior, , , , a] = niu(arrel,
      desplacador(),
      caixa({ overflow: 'auto', alt: 500, visible: 500 }),
      caixa({ overflow: 'hidden', alt: 5000 }),
      caixa({ overflow: 'visible', alt: 5000 }),
      ancora({ href: '?item=x' }));
    document.body.append(arrel);
    expect(desplacadorAlClic(a, arrel)).toBe(exterior);
  });

  it('l’arrel mateixa compta; el desplaçador de l’amfitrió que l’embolcalla no és nostre', () => {
    const amfitrio = desplacador();
    const arrel = document.createElement('div');
    const [a] = niu(arrel, ancora({ href: '?item=x' }));
    amfitrio.append(arrel);
    document.body.append(amfitrio);
    expect(desplacadorAlClic(a, arrel)).toBeNull();

    const arrelDesplacadora = desplacador();
    const [b] = niu(arrelDesplacadora, ancora({ href: '?item=x' }));
    document.body.append(arrelDesplacadora);
    expect(desplacadorAlClic(b, arrelDesplacadora)).toBe(arrelDesplacadora);
  });

  it('travessa el shadow root de <soc-de-poble> i no ix del host', () => {
    const fora = desplacador();
    const host = document.createElement('soc-de-poble-prova');
    fora.append(host);
    document.body.append(fora);
    const ombra = host.attachShadow({ mode: 'open' });
    const arrel = document.createElement('div');
    const [detall, a, text] = niu(arrel, desplacador(), ancora({ href: '/events/aplec' }), document.createElement('strong'));
    ombra.append(arrel);
    expect(desplacadorAlClic(text, arrel)).toBe(detall);
    expect(a.getRootNode()).toBe(ombra);
  });

  it('sense camí compost recorre als pares, també a través del shadow root', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=x' }));
    document.body.append(arrel);
    expect(desplacadorDelClic({}, a, arrel)).toBe(detall);
    expect(desplacadorDelClic({ composedPath: () => [] }, a, arrel)).toBe(detall);

    const host = document.createElement('soc-de-poble-prova');
    const ombra = host.attachShadow({ mode: 'open' });
    const arrelOmbra = document.createElement('div');
    const [, b] = niu(arrelOmbra, caixa(), ancora({ href: '?item=x' }));
    ombra.append(arrelOmbra);
    const fora = desplacador();
    fora.append(host);
    document.body.append(fora);
    // Sense arrel que l'aturara, puja fins al desplaçador de fora pel host.
    expect(desplacadorDelClic({}, b, null)).toBe(fora);
    expect(desplacadorDelClic({}, b, arrelOmbra)).toBeNull();
  });

  it('sense <a> → null', () => {
    expect(desplacadorDelClic({}, null, document.body)).toBeNull();
  });
});

describe('preparaRecolocacio · on queda la vista després de navegar', () => {
  it('sense fragment, el desplaçador torna a dalt en cridar-la (no abans)', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=x' }));
    document.body.append(arrel);
    const recoloca = recolocacioAlClic(a, arrel, '?item=x');
    expect(detall.scrollTop).toBe(1200);
    recoloca();
    expect(detall.scrollTop).toBe(0);
  });

  it('amb scrollTo, a dalt de colp (instant), sense el scroll suau del contenidor', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '/events/aplec' }));
    detall.scrollTo = vi.fn();
    document.body.append(arrel);
    recolocacioAlClic(a, arrel, '/events/aplec')();
    expect(detall.scrollTo).toHaveBeenCalledTimes(1);
    expect(detall.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('un navegador que rebutja «instant» cau a scrollTop', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=x' }));
    detall.scrollTo = vi.fn(() => { throw new TypeError('behavior'); });
    document.body.append(arrel);
    recolocacioAlClic(a, arrel, '?item=x')();
    expect(detall.scrollTop).toBe(0);
  });

  it('amb fragment, porta a la vista l’element amb eixe id i no toca el desplaçador', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '/mercat/samarreta#preu' }));
    const preu = document.createElement('h2');
    preu.id = 'preu';
    preu.scrollIntoView = vi.fn();
    detall.append(preu);
    document.body.append(arrel);
    recolocacioAlClic(a, arrel, '/mercat/samarreta#preu')();
    expect(preu.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(detall.scrollTop).toBe(1200);
  });

  it('un fragment codificat troba l’id descodificat, com el navegador', () => {
    const arrel = document.createElement('div');
    const [, a] = niu(arrel, desplacador(), ancora({ href: '?item=x#pl%C3%A0tan' }));
    const platan = document.createElement('h3');
    platan.id = 'plàtan';
    platan.scrollIntoView = vi.fn();
    arrel.append(platan);
    document.body.append(arrel);
    recolocacioAlClic(a, arrel, '?item=x#pl%C3%A0tan')();
    expect(platan.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('dins del shadow root, el fragment es busca al mateix node arrel que l’<a>, no al document', () => {
    const delDocument = document.createElement('h2');
    delDocument.id = 'preu';
    delDocument.scrollIntoView = vi.fn();
    document.body.append(delDocument);
    const host = document.createElement('soc-de-poble-prova');
    document.body.append(host);
    const ombra = host.attachShadow({ mode: 'open' });
    const arrel = document.createElement('div');
    const [, a] = niu(arrel, desplacador(), ancora({ href: '?item=x#preu' }));
    const deLOmbra = document.createElement('h2');
    deLOmbra.id = 'preu';
    deLOmbra.scrollIntoView = vi.fn();
    arrel.append(deLOmbra);
    ombra.append(arrel);
    recolocacioAlClic(a, arrel, '?item=x#preu')();
    expect(deLOmbra.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(delDocument.scrollIntoView).not.toHaveBeenCalled();
  });

  it('un fragment que no hi és torna el desplaçador a dalt', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=x#no-hi-es' }));
    document.body.append(arrel);
    recolocacioAlClic(a, arrel, '?item=x#no-hi-es')();
    expect(detall.scrollTop).toBe(0);
  });

  it('el fragment es busca en cridar-la: l’element que pinta la ruta nova també val', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=y#seccio' }));
    document.body.append(arrel);
    const recoloca = recolocacioAlClic(a, arrel, '?item=y#seccio');
    const seccio = document.createElement('section');
    seccio.id = 'seccio';
    seccio.scrollIntoView = vi.fn();
    detall.append(seccio);
    recoloca();
    expect(seccio.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('un desplaçador que la ruta nova ha tret del document no es toca', () => {
    const arrel = document.createElement('div');
    const [detall, a] = niu(arrel, desplacador(), ancora({ href: '?item=x' }));
    document.body.append(arrel);
    const recoloca = recolocacioAlClic(a, arrel, '?item=x');
    detall.remove();
    recoloca();
    expect(detall.scrollTop).toBe(1200);
  });

  it('sense desplaçador ni fragment, no fa res i no peta', () => {
    const arrel = document.createElement('div');
    const [a] = niu(arrel, ancora({ href: '?item=x' }));
    document.body.append(arrel);
    expect(() => recolocacioAlClic(a, arrel, '?item=x')()).not.toThrow();
  });
});
