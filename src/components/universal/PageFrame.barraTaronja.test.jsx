/* Ordre del Mestre, 261004 (segona decisió: barra taronja universal) · Tota
   pàgina, sense excepció i de manera universal, porta la barra taronja de Sóc
   de Poble amb el logotip i l'autor, clicable cap a la pàgina de l'autor,
   encara que no tinga portada. També les de sistema (chrome 'system': la
   Consola, «El pols del cervell», el Mur, el Control…) i les que no porten
   barra blava ('page' i 'none'). Les excepcions, només per ordre del Mestre:
   la via és senseBarraTaronja, i hui no la passa ningú.
   La pastilla de data és la que du la pàgina: PageFrame no n'inventa cap (ni
   la d'ara ni guionets; barraTaronjaData.contracte.test.jsx). */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { ContentProvider } from './ContentProvider.jsx';
import { DEFAULT_AUTHOR, PAGE_CHROME_MODES } from './UniversalUtils.js';

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/consola');
});
afterEach(cleanup);

const barra = (container) => container.querySelector('section.bar-orange');
const autor = (container) => barra(container).firstElementChild;
const fills = (container) => [...container.querySelector('.sdp-universal-page-container').children].map((e) => e.className);
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

/* Tots els modes que coneix PageFrame, i un que no (cau a 'page'). */
const MODES = [...PAGE_CHROME_MODES, 'inventat'];

describe('261004 · la barra taronja es pinta en tots els modes de chrome', () => {
  test('els modes que es proven són tots els de PAGE_CHROME_MODES', () => {
    expect([...PAGE_CHROME_MODES].sort()).toEqual(['context', 'full', 'none', 'page', 'system']);
  });

  test.each(MODES)('chrome="%s": barra taronja amb el logo, el nom i el poble de Sóc de Poble, enllaçada a /projecte', (chrome) => {
    const { container } = render(<PageFrame chrome={chrome} title="Pàgina de sistema" />);
    expect(barra(container)).not.toBeNull();
    expect(barra(container).getAttribute('aria-label')).toBe('Autoria i data');
    expect(autor(container).tagName).toBe('A');
    expect(autor(container).getAttribute('href')).toBe('/projecte');
    expect(autor(container).getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
    expect(autor(container).querySelector('img.sp-card-avatar').getAttribute('src')).toBe(LOGO);
    expect(autor(container).querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(autor(container).querySelector('.sp-card-author-location').textContent).toBe(DEFAULT_AUTHOR.location);
  });

  test('sense chrome (el de sempre, \'page\'): també la porta', () => {
    const { container } = render(<PageFrame title="Ací no hi ha res" />);
    expect(autor(container).getAttribute('href')).toBe('/projecte');
  });

  test('una pàgina de sistema sense portada: blava, taronja, títol i article, en este ordre', () => {
    const { container } = render(<UniversalPage chrome="system" title="El pols del cervell" lead="Una mirada a la màquina." />);
    expect(fills(container)).toEqual(['bar-blue', 'bar-orange', 'page-title', 'content-wrapper']);
    expect(container.querySelector('.hero-image')).toBeNull();
    expect(autor(container).getAttribute('href')).toBe('/projecte');
  });

  test('UniversalPage en mode sistema, amb portada: la barra va davall de la portada, com a la resta de pàgines', () => {
    const { container } = render(<UniversalPage chrome="system" title="Consola" heroImage="/assets/x.png" heroAlt="" />);
    expect(fills(container)).toEqual(['bar-blue', 'hero-image', 'bar-orange', 'page-title', 'content-wrapper']);
  });

  test('un autor propi mana també en mode sistema (nom, poble, avatar i ruta)', () => {
    const { container } = render(<PageFrame chrome="system" title="Fitxa" authorName="Pepa" authorLocation="La Torre"
      authorAvatar="/assets/pepa.png" authorHref="/gent/pepa" />);
    expect(autor(container).getAttribute('href')).toBe('/gent/pepa');
    expect(autor(container).querySelector('.sp-card-author-name').textContent).toBe('Pepa');
    expect(autor(container).querySelector('.sp-card-author-location').textContent).toBe('La Torre');
    expect(autor(container).querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/pepa.png');
  });
});

describe('261004 · la pastilla de data és la de la pàgina: mai inventada', () => {
  test('una pàgina de sistema amb data la pinta (abans, amagada amb tota la barra)', () => {
    const { container } = render(<PageFrame chrome="system" title="Consola" time="10:30" date="24/09/26" dateTime="2026-09-24T10:30" />);
    const pastilla = barra(container).querySelector('.btn-date-time');
    expect([...pastilla.querySelectorAll('span')].map((s) => s.textContent)).toEqual(['10:30', '24/09/26']);
  });

  test.each(['system', 'page', 'none'])('chrome="%s" sense cap data: cap pastilla, cap guionet ni la data d’ara', (chrome) => {
    const { container } = render(<PageFrame chrome={chrome} title="Cercador" />);
    expect(barra(container).querySelector('.btn-date-time')).toBeNull();
    expect(barra(container).querySelector('.bar-actions').textContent).toBe('');
    expect(barra(container).textContent).not.toMatch(/--|—|\d{2}\/\d{2}\/\d{2}/);
  });
});

describe('261004 · sense barra blava, la taronja puja a dalt de tot', () => {
  test.each(['page', 'none', 'inventat'])('chrome="%s": el contenidor porta el modificador sense-blava', (chrome) => {
    const { container } = render(<PageFrame chrome={chrome} title="T" />);
    expect(container.querySelector('.sdp-universal-page-container').classList.contains('sdp-universal-page-container--sense-blava')).toBe(true);
    expect(container.querySelector('header.bar-blue')).toBeNull();
  });

  test.each(['system', 'context', 'full'])('chrome="%s": amb la blava, les classes de sempre (Llei del Píxel)', (chrome) => {
    const { container } = render(<PageFrame chrome={chrome} title="T" layout="contained" className="sdp-propia" />);
    expect(container.querySelector('.sdp-universal-page-container').className)
      .toBe('sdp-universal-page-container sdp-universal-page-container--contained sdp-propia');
  });
});

/* ── La via d'excepció ─────────────────────────────────────────────────── */
const NOM_PROP = ['sense', 'Barra', 'Taronja'].join('');

describe('261004 · la via d’excepció (senseBarraTaronja), només per ordre del Mestre', () => {
  test('amb true explícit, la barra no es pinta; la resta de la pàgina, igual', () => {
    const { container } = render(<PageFrame chrome="system" title="Mur" {...{ [NOM_PROP]: true }} />);
    expect(barra(container)).toBeNull();
    expect(fills(container)).toEqual(['bar-blue', 'page-title', 'content-wrapper']);
    cleanup();
    const sensePagina = render(<PageFrame chrome="page" title="T" {...{ [NOM_PROP]: true }} />).container;
    expect(sensePagina.querySelector('.sdp-universal-page-container').className).toBe('sdp-universal-page-container sdp-universal-page-container--page');
  });

  test('cap altre valor no l’apaga (ni un text, ni un 1, ni false)', () => {
    for (const valor of ['sí', 1, false, null, undefined]) {
      const { container, unmount } = render(<PageFrame chrome="system" title="T" {...{ [NOM_PROP]: valor }} />);
      expect(barra(container), String(valor)).not.toBeNull();
      unmount();
    }
  });

  test('UniversalPage la passa a PageFrame (la pàgina que el Mestre diga només ha de posar la prop)', () => {
    const { container } = render(<UniversalPage chrome="system" title="Mercat" {...{ [NOM_PROP]: true }} />);
    expect(barra(container)).toBeNull();
  });

  /* M2 (verificació del front «barra-autoria», 261004) · La via d'excepció és
     una prop explícita del codi de la pàgina. Una config del ContentProvider
     (que UniversalPage escampa damunt de PageFrame) o la topBarData no la
     poden apagar, encara que porten la clau amb `true`. */
  test('una config del ContentProvider amb la clau a true no l’apaga', () => {
    const { container } = render(
      <ContentProvider initialConfig={{ chrome: 'system', title: 'Mercat', [NOM_PROP]: true }}>
        <UniversalPage />
      </ContentProvider>
    );
    expect(barra(container)).not.toBeNull();
    expect(autor(container).getAttribute('href')).toBe('/projecte');
  });

  test('la topBarData amb la clau a true tampoc l’apaga (ni a UniversalPage ni a PageFrame)', () => {
    const dades = { [NOM_PROP]: true };
    expect(barra(render(<UniversalPage chrome="system" title="T" topBarData={dades} />).container)).not.toBeNull();
    cleanup();
    expect(barra(render(<PageFrame chrome="system" title="T" topBarData={dades} />).container)).not.toBeNull();
  });

  test('amb la config a true, només la prop explícita de la pàgina la lleva', () => {
    const { container } = render(
      <ContentProvider initialConfig={{ chrome: 'system', [NOM_PROP]: true }}>
        <UniversalPage title="Mur" {...{ [NOM_PROP]: true }} />
      </ContentProvider>
    );
    expect(barra(container)).toBeNull();
  });

  /* Hui no la passa cap pàgina: si algú l'hi posa, esta prova cau i obliga a
     escriure ací l'ordre del Mestre que ho autoritza. Compta el codi, no la
     documentació: els comentaris i les cadenes de prosa (el contracte de
     l'espècimen de Disseny la nomena en una taula) no són consumidors. Una
     cadena que és exactament el nom i fa de clau ('…': o ['…']) sí que ho és:
     una clau entre cometes no enganya la prova. Límit conegut: un nom compost
     en temps d'execució (trossos units) no es pot veure per text; per això la
     prop només s'obeïx amb `true` i la config no hi arriba (M2). */
  const AUTORITZADES = [];
  /* Els dos fitxers que la fan funcionar: PageFrame la llig i UniversalPage
     només la torna a escriure des de les props (prova de baix). */
  const MECANISME = ['src/components/universal/PageFrame.jsx', 'src/components/universal/UniversalPage.jsx'];
  const ARREL_SRC = path.join(process.cwd(), 'src');
  const fitxers = (dir) => readdirSync(dir).flatMap((nom) => {
    const ruta = path.join(dir, nom);
    return statSync(ruta).isDirectory() ? fitxers(ruta) : [ruta];
  });
  const CLAU = '«CLAU»';
  const nomesCodi = (codi) => codi
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, (cadena) => (cadena.slice(1, -1) === NOM_PROP ? CLAU : "''"))
    .replace(/\/\/.*$/gm, '');
  const consumeix = (codi) => {
    const net = nomesCodi(codi);
    return new RegExp(`\\b${NOM_PROP}\\b`).test(net) || new RegExp(`${CLAU}\\s*[:\\]]`).test(net);
  };

  test('el filtre de codi veu la prop en JSX i en objectes, i no en comentaris ni cadenes', () => {
    expect(consumeix(`<UniversalPage title="T" ${NOM_PROP} />`)).toBe(true);
    expect(consumeix(`const p = { ${NOM_PROP}: true };`)).toBe(true);
    expect(consumeix(`/* ${NOM_PROP} */ // ${NOM_PROP}\nconst a = ['Diu ${NOM_PROP}', "${NOM_PROP} és l’excepció"];`)).toBe(false);
  });

  test('una clau entre cometes (literal o calculada) també és un consumidor; una fila de la taula de props, no', () => {
    expect(consumeix(`const p = { '${NOM_PROP}': true };`)).toBe(true);
    expect(consumeix(`const p = { "${NOM_PROP}" : true };`)).toBe(true);
    expect(consumeix(`const p = { ['${NOM_PROP}']: true };`)).toBe(true);
    expect(consumeix(`const p = { [\`${NOM_PROP}\`]: true };`)).toBe(true);
    expect(consumeix(`config['${NOM_PROP}'] = true;`)).toBe(true);
    expect(consumeix(`<UniversalPage {...{ '${NOM_PROP}': true }} />`)).toBe(true);
    // La taula de l'espècimen de Disseny: [nom, tipus, valor per defecte, què fa].
    expect(consumeix(`const PROPS = [['${NOM_PROP}', 'boolean', 'false', 'L’única excepció']];`)).toBe(false);
  });

  test('UniversalPage només la torna a escriure des de les props de la pàgina, i amb `true` explícit', () => {
    const net = nomesCodi(readFileSync(path.join(process.cwd(), MECANISME[1]), 'utf8'));
    expect(net.match(new RegExp(`\\b${NOM_PROP}\\b`, 'g'))).toHaveLength(2);
    expect(net).toContain(`${NOM_PROP}={props.${NOM_PROP} === true}`);
  });

  test('cap consumidor de src/ la passa hui (fora de PageFrame, d’UniversalPage i de les proves)', () => {
    const consumidors = fitxers(ARREL_SRC)
      .filter((ruta) => /\.(jsx?|mjs|tsx?)$/.test(ruta) && !/\.test\.[jt]sx?$/.test(ruta))
      .map((ruta) => path.relative(process.cwd(), ruta).split(path.sep).join('/'))
      .filter((ruta) => !MECANISME.includes(ruta))
      .filter((ruta) => consumeix(readFileSync(path.join(process.cwd(), ruta), 'utf8')));
    expect(consumidors).toEqual(AUTORITZADES);
  });
});
