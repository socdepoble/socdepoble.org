import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { BarraTaronja } from './BarraTaronja.jsx';
import { isSafeUrl, rutaDAutorSegura } from '../UniversalUtils.js';
import { BotoVisibilitat } from './BotoVisibilitat.jsx';
import { PageFrame } from '../PageFrame.jsx';
import { IconaEstatDesament } from '../EstatDesament.jsx';
import { DateTimeControl, IconButton, PinIcon } from '../../PedraSeca/index.js';

/* T51 (ordre del Mestre, 260928) · La barra taronja és un component propi:
   graella de tres columnes (autoria · espai central · accions i data). jsdom
   no pinta ni calcula colors: es comprova el DOM que la CSS necessita. */
afterEach(cleanup);

const AUTORIA = { authorName: 'Pepa', authorLocation: 'Benifallim', authorAvatar: '/assets/pepa.webp' };
const barra = (props = {}) => render(<BarraTaronja {...AUTORIA} {...props} />).container.querySelector('section.bar-orange');
const fills = (seccio) => [...seccio.children].map((e) => e.className);

test('tres fills en l’ordre de la graella: autoria, espai central i accions', () => {
  const seccio = barra();
  expect(seccio.getAttribute('aria-label')).toBe('Autoria i data');
  expect(fills(seccio)).toEqual(['sp-card-author', 'sdp-emoticona-barra sdp-emoticona-barra--buida', 'bar-actions']);
  expect(seccio.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
  expect(seccio.querySelector('.sp-card-author-location').textContent).toBe('Benifallim');
});

test('espai central en lectura: l’emoticona triada; sense, la cel·la buida; mai la ploma', () => {
  expect(barra({ emoticona: '🍅' }).children[1].getAttribute('aria-label')).toBe('Emoticona del document: 🍅');
  cleanup();
  const sense = barra({ emoticona: '' });
  expect(sense.children[1].className).toBe('sdp-emoticona-barra sdp-emoticona-barra--buida');
  expect(sense.querySelector('svg.lucide-feather')).toBeNull();
});

test('espai central en edició: el botó que obri el diàleg, amb la ploma blanca sense emoticona', () => {
  const onObriEmoticona = vi.fn();
  const seccio = barra({ onObriEmoticona });
  const boto = seccio.children[1];
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.querySelector('svg.lucide-feather')).not.toBeNull();
  act(() => { fireEvent.click(boto); });
  expect(onObriEmoticona).toHaveBeenCalledTimes(1);
});

test('la data: amb hora i data es pinta la pastilla (botó si té onDateTime, <time> si no)', () => {
  const onDateTime = vi.fn();
  const boto = barra({ time: '10:00', date: '28/09/26', dateTime: '2026-09-28T10:00', onDateTime }).querySelector('.bar-actions .btn-date-time');
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.textContent).toBe('10:0028/09/26');
  act(() => { fireEvent.click(boto); });
  expect(onDateTime).toHaveBeenCalledTimes(1);
  cleanup();
  const temps = barra({ time: '10:00', date: '28/09/26', dateTime: '2026-09-28T10:00' }).querySelector('.bar-actions .btn-date-time');
  expect(temps.tagName).toBe('TIME');
  expect(temps.getAttribute('datetime')).toBe('2026-09-28T10:00');
});

test('barActions mana sobre la pastilla per defecte (qui el passa hi posa la seua)', () => {
  const accions = barra({ time: '10:00', barActions: <DateTimeControl time="11:11" date="01/01/26" /> }).querySelector('.bar-actions');
  expect(accions.querySelectorAll('.btn-date-time')).toHaveLength(1);
  expect(accions.textContent).toBe('11:1101/01/26');
});

/* T51 · Totes les icones de la barra (pin, món, cadenat, ploma, glif de
   l'autodesament) viuen dins d'una classe que components.css o modules.css
   pinten de blanc sobre el vel fosc (PageFrame.capes.test.js ho comprova). */
const CLASSES_BLANQUES = ['btn-icon-orange', 'sdp-emoticona-barra--boto', 'sdp-estat-desament'];
test('icones blanques: cada icona de la barra (fora de l’avatar) va dins d’una classe de la família blanca', () => {
  const seccio = barra({
    onObriEmoticona: () => {},
    barActions: (
      <>
        <IconaEstatDesament estat="pendent" />
        <IconButton label="Ancorar" className="btn-icon-orange" onClick={() => {}}><PinIcon className="icon" /></IconButton>
        <BotoVisibilitat etiqueta="Privat" onObri={() => {}} />
        <BotoVisibilitat publicat etiqueta="Públic" onObri={() => {}} />
        <DateTimeControl time="10:00" date="28/09/26" />
      </>
    ),
  });
  const icones = [...seccio.querySelectorAll('svg')].filter((svg) => !svg.closest('.sp-card-author'));
  expect(icones.length).toBe(5);
  for (const svg of icones) {
    const pare = svg.parentElement;
    expect(CLASSES_BLANQUES.some((classe) => pare.classList.contains(classe)), pare.className).toBe(true);
  }
  expect(seccio.querySelector('svg.lucide-lock')).not.toBeNull();
  expect(seccio.querySelector('svg.lucide-globe')).not.toBeNull();
  expect(seccio.querySelector('svg.lucide-cloud-upload')).not.toBeNull();
});

test('un avatar insegur cau al cercle de reserva; una ruta segura enllaça l’autoria al perfil', () => {
  const insegur = barra({ authorAvatar: 'javascript:alert(1)' });
  expect(insegur.querySelector('img.sp-card-avatar')).toBeNull();
  expect(insegur.querySelector('.sp-card-avatar--fallback.sp-card-avatar--amagat')).toBeNull();
  cleanup();
  const enllac = barra({ authorHref: '/perfil/pepa' }).firstElementChild;
  expect(enllac.tagName).toBe('A');
  expect(enllac.getAttribute('href')).toBe('/perfil/pepa');
  expect(enllac.className).toBe('sp-card-author sp-card-author-link');
  cleanup();
  const insegura = barra({ authorHref: 'javascript:alert(1)' }).firstElementChild;
  expect(insegura.tagName).toBe('DIV');
});

/* Correcció D4 (revisió de T51a) · El marcatge LITERAL d'abans de l'extracció
   (fills, classes, etiquetes i ordre), no la barra comparada amb si mateixa:
   PageFrame ja pinta este mateix component. */
const etiquetes = (el) => [...el.children].map((e) => e.tagName.toLowerCase());
const comprovaMarcatge = (seccio) => {
  expect(seccio.getAttribute('aria-label')).toBe('Autoria i data');
  expect(etiquetes(seccio)).toEqual(['a', 'span', 'div']);
  expect(fills(seccio)).toEqual(['sp-card-author sp-card-author-link', 'sdp-emoticona-barra sdp-emoticona-barra--glif', 'bar-actions']);
  const [autor, centre, accions] = seccio.children;
  expect(autor.getAttribute('href')).toBe('/perfil/pepa');
  expect(etiquetes(autor)).toEqual(['img', 'div', 'div']);
  expect(fills(autor)).toEqual(['sp-card-avatar', 'sp-card-avatar sp-card-avatar--fallback sp-card-avatar--amagat', 'sp-card-author-info']);
  expect(autor.children[0].getAttribute('src')).toBe('/assets/pepa.webp');
  /* Ordre del Mestre, 261004 (prompt 261004_0515; privacitat) · l'avatar no envia cap Referer. */
  expect(autor.children[0].getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(etiquetes(autor.children[1])).toEqual(['svg']);
  expect(autor.children[1].querySelector('svg.lucide-user-round')).not.toBeNull();
  expect(etiquetes(autor.children[2])).toEqual(['div', 'div']);
  expect(fills(autor.children[2])).toEqual(['sp-card-author-name', 'sp-card-author-location']);
  expect(centre.getAttribute('role')).toBe('img');
  expect(centre.getAttribute('aria-label')).toBe('Emoticona del document: 🌿');
  expect(etiquetes(centre)).toEqual(['span']);
  expect(fills(centre)).toEqual(['sdp-emoticona-barra__glif']);
  expect(centre.textContent).toBe('🌿');
  expect(etiquetes(accions)).toEqual(['time']);
  expect(fills(accions)).toEqual(['btn-date-time']);
  const temps = accions.firstElementChild;
  expect(temps.getAttribute('datetime')).toBe('2026-09-28T10:00');
  expect(etiquetes(temps)).toEqual(['span', 'span']);
  expect([...temps.children].map((s) => s.textContent)).toEqual(['10:00', '28/09/26']);
};

test('D4 · PageFrame pinta la barra amb el marcatge literal, amb l’emoticona de topBarData', () => {
  const props = { ...AUTORIA, authorHref: '/perfil/pepa', time: '10:00', date: '28/09/26', dateTime: '2026-09-28T10:00' };
  comprovaMarcatge(render(<PageFrame chrome="context" title="Pàgina" {...props} topBarData={{ emoticona: '🌿' }} />)
    .container.querySelector('section.bar-orange'));
  cleanup();
  comprovaMarcatge(barra({ ...props, emoticona: '🌿' }));
});

/* Poliment T51 (260928) · jsdom no pinta l'anell: es comprova la regla
   escrita. El botó d'emoticona penja de la barra, fora de .bar-actions (on
   viu la C15 de modules.css): té la seua regla, dins de @layer components, i
   amb el mateix color d'anell que la C15. */
const cssNet = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const ANELL_EMOTICONA = /section\.bar-orange > \.sdp-emoticona-barra--boto:focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/;
test('el botó d’emoticona porta l’anell de focus de la barra taronja (C15), dins de @layer components', () => {
  const components = cssNet('src/css/components.css');
  const anell = components.match(ANELL_EMOTICONA);
  expect(anell).not.toBeNull();
  const abans = components.slice(0, anell.index);
  const capa = abans.lastIndexOf('@layer components {');
  expect(capa).toBeGreaterThan(-1);
  const tram = abans.slice(capa);
  expect(tram.split('{').length - tram.split('}').length).toBe(1);
  const c15 = cssNet('src/css/modules.css').match(/section\.bar-orange \.bar-actions :focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/);
  expect(c15).not.toBeNull();
  expect(anell[1]).toBe(c15[1]);
  // El selector casa amb el DOM de veres: el botó és fill directe de la barra.
  const boto = barra({ onObriEmoticona: () => {} }).querySelector('.sdp-emoticona-barra--boto');
  expect(boto.matches('section.bar-orange > .sdp-emoticona-barra--boto')).toBe(true);
  expect(boto.closest('.bar-actions')).toBeNull();
});

/* T6 (ordre del Mestre, 261004) · La ruta de l'autoria de la barra passa per
   la regla de la boina de la targeta (rutaDAutorSegura, W4-07): una ruta de
   l'app enllaça també a l'app nativa (capacitor://localhost), on isSafeUrl la
   deixava sense enllaç. Una adreça absoluta, per isSafeUrl com sempre. */
const ORIGENS = Object.freeze({
  https: { origin: 'https://socdepoble.org', protocol: 'https:', host: 'socdepoble.org', hostname: 'socdepoble.org', href: 'https://socdepoble.org/page/x', pathname: '/page/x', search: '', hash: '' },
  capacitor: { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost', href: 'capacitor://localhost/page/x', pathname: '/page/x', search: '', hash: '' }
});
for (const [nom, origen] of Object.entries(ORIGENS)) {
  test(`T6 · origen ${nom}: una ruta de l’app enllaça l’autoria; una contrabarra o un esquema, no`, () => {
    vi.stubGlobal('location', origen);
    try {
      expect(isSafeUrl('/projecte')).toBe(nom !== 'capacitor');
      for (const ruta of ['/projecte', '/gent/javillinares', '/empresa/forn?x=1']) {
        expect([ruta, rutaDAutorSegura(ruta)]).toEqual([ruta, ruta]);
        const autor = barra({ authorHref: ruta }).firstElementChild;
        expect([ruta, autor.tagName, autor.getAttribute('href')]).toEqual([ruta, 'A', ruta]);
        cleanup();
      }
      for (const dolenta of ['/\\altra.example/x', '//altra.example/x', '/mur x', 'javascript:alert(1)', '', null, 42]) {
        expect([dolenta, rutaDAutorSegura(dolenta)]).toEqual([dolenta, null]);
        expect(barra({ authorHref: dolenta }).firstElementChild.tagName).toBe('DIV');
        cleanup();
      }
      /* Una adreça absoluta continua amb isSafeUrl: http(s) sí, un altre esquema no. */
      expect(rutaDAutorSegura('https://exemple.org/autora')).toBe('https://exemple.org/autora');
      expect(rutaDAutorSegura('capacitor://localhost/mur')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
}

/* Ordre del Mestre, 261004 (prompt 261004_0515; privacitat) · L'avatar de la
   barra no envia cap Referer: el detall del Lector hi pot passar el logo
   d'una font de fora. Només l'atribut: la resta de l'<img>, la de sempre. */
test('l’avatar porta referrerPolicy="no-referrer" i la resta d’atributs de sempre', () => {
  const img = barra({ authorAvatar: 'https://diari.example/logo.png' }).querySelector('img.sp-card-avatar');
  expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(img.getAttributeNames().sort()).toEqual(['alt', 'class', 'decoding', 'height', 'referrerpolicy', 'src', 'width']);
  expect(img.getAttribute('src')).toBe('https://diari.example/logo.png');
});

test('PageFrame passa onObriEmoticona de topBarData a l’espai central', () => {
  const onObriEmoticona = vi.fn();
  const { container } = render(<PageFrame chrome="context" title="Pàgina" topBarData={{ onObriEmoticona }} />);
  act(() => { fireEvent.click(container.querySelector('.bar-orange > .sdp-emoticona-barra--boto')); });
  expect(onObriEmoticona).toHaveBeenCalledTimes(1);
});
