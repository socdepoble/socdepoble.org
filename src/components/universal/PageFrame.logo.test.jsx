/* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · Tota pàgina
   creada per una entitat, també les de sistema, porta dalt de l'H1, gran
   (fins a 600px) i responsiu, el logotip de l'entitat. Només es lleva per
   excepció explícita del Mestre (senseLogo, hui sense cap ús).
   Qui decidix és qui signa (PageFrame), per ordre de prioritat:
     a) la ranura de l'editor (topBarData.logoComponent);
     b) senseLogo === true: cap logotip;
     c) logoEntitat: el de l'entitat que signa;
     d) signa Sóc de Poble (la boina enllaça a DEFAULT_AUTHOR.href; Onada 8,
        261009: el seu perfil, /empresa/socdepoble, o la vella /projecte):
        el seu logotip rectangular, amb el marcatge de sempre byte a byte;
     e) compatibilitat: showLogos === true continua pintant el de Sóc de Poble;
     f) altrament, cap logotip (una persona, una font de fora). Una persona o
        la IA porten el seu avatar redó si la pàgina el passa (avatarAutor,
        ordre del Mestre, 261004: PageFrame.avatar.test.jsx).
   El resolutor de recursos és el de veres: així es prova també la base del
   paquet (fixaBaseRecursos), la de WordPress i Sollutia. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { fixaBaseRecursos, resolveAsset } from '../../config/assetResolver';
import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { ContentProvider } from './ContentProvider.jsx';
import { DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES, PAGE_CHROME_MODES } from './UniversalUtils.js';

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/consola');
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

/* Onada 8 (261009) · El logotip de Sóc de Poble és el PNG de 985x256 (abans,
   l'SVG). Els SVG d'abans es reconeixen encara (MARQUES_SVG_ANTIGUES). */
const NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png';
const BLANC = '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png';
const capcalera = (container) => container.querySelector('header.page-title');
const logos = (container) => [...(capcalera(container)?.querySelectorAll('img') ?? [])];
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
const DOS_LOGOS_SDP = ['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only'];

/* El marcatge que pintava PageFrame abans d'esta norma (showLogos), copiat
   tal qual: el logotip de Sóc de Poble ha de ser byte a byte este.
   Derogat en part (ordre del Mestre, 261004, correcció final del risc de
   Safari 16 en el salt de ?seccio=): les dues imatges porten ara, al final,
   width="300" height="78", la mida natural de l'SVG, perquè el navegador en
   reserve el lloc abans de carregar-lo. La resta (ordre d'atributs, classes,
   alt i src) continua sent byte a byte la d'abans; el CSS en mana l'ample i
   els píxels finals no canvien (comprovat al navegador a 320, 375 i 1280).
   Onada 8 (261009) · Derogat el src: els PNG de 985x256 en lloc dels SVG, amb
   la mateixa proporció. La resta del marcatge continua sent el d'abans. */
function LogoDAbans() {
  return (
    <>
      <img alt="Logotip Sóc de Poble" className="page-title-logo light-only" src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-negre-985x256.png")} width="300" height="78" />
      <img alt="Logotip Sóc de Poble" className="page-title-logo dark-only" src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png")} width="300" height="78" />
    </>
  );
}
const marcatgeDAbans = () => {
  const { container, unmount } = render(<div data-abans="">{<LogoDAbans />}</div>);
  const html = [...container.querySelector('[data-abans]').children].map((img) => img.outerHTML);
  unmount();
  return html;
};

describe('d) qui signa Sóc de Poble porta el seu logotip, també les pàgines de sistema', () => {
  test.each([...PAGE_CHROME_MODES].filter((mode) => mode !== 'none').concat('inventat'))(
    'chrome="%s", sense autor: dos logotips (negre per al clar, blanc per al fosc) davant de l’H1', (chrome) => {
      const { container } = render(<PageFrame chrome={chrome} title="Consola" />);
      expect(fills(capcalera(container))).toEqual([...DOS_LOGOS_SDP, 'H1.']);
      const [clar, fosc] = logos(container);
      expect([clar.getAttribute('src'), fosc.getAttribute('src')]).toEqual([NEGRE, BLANC]);
      expect([clar.getAttribute('alt'), fosc.getAttribute('alt')]).toEqual(['Logotip Sóc de Poble', 'Logotip Sóc de Poble']);
    });

  /* Derogat en part (ordre del Mestre, 261004): el marcatge d'abans més
     width="300" height="78" al final de cada imatge (vegeu LogoDAbans). */
  test('Llei del Píxel: el marcatge és el d’abans (el que pintava showLogos), amb la mida natural reservada', () => {
    const { container } = render(<PageFrame chrome="system" title="Projecte" />);
    expect(logos(container).map((img) => img.outerHTML)).toEqual(marcatgeDAbans());
    expect(capcalera(container).outerHTML).toBe('<header class="page-title">'
      + `<img alt="Logotip Sóc de Poble" class="page-title-logo light-only" src="${NEGRE}" width="300" height="78">`
      + `<img alt="Logotip Sóc de Poble" class="page-title-logo dark-only" src="${BLANC}" width="300" height="78">`
      + '<h1>Projecte</h1></header>');
  });

  /* Correcció final (ordre del Mestre, 261004) · La mida natural reserva el
     lloc del logotip de Sóc de Poble abans que carregue (Safari 16 i el salt
     de ?seccio=). Només el seu: el logotip d'una altra entitat té la seua
     mida, que PageFrame no sap, i no en porta. */
  test('el logotip de Sóc de Poble porta width="300" height="78"; el de dues imatges d’una altra entitat, no', () => {
    let { container } = render(<PageFrame chrome="system" title="Consola" />);
    expect(logos(container).map((img) => [img.getAttribute('width'), img.getAttribute('height')])).toEqual([['300', '78'], ['300', '78']]);
    cleanup();
    ({ container } = render(<PageFrame chrome="full" title="Cooperativa"
      logoEntitat={{ clar: '/assets/coop-negre.svg', fosc: '/assets/coop-blanc.svg', alt: 'Logotip Cooperativa' }} />));
    expect(logos(container).map((img) => [img.hasAttribute('width'), img.hasAttribute('height')])).toEqual([[false, false], [false, false]]);
    cleanup();
    ({ container } = render(<PageFrame chrome="full" title="Forn" logoEntitat={{ clar: '/assets/forn.png', alt: '' }} />));
    expect(logos(container)[0].hasAttribute('width')).toBe(false);
  });

  test('amb un nom explícit, el reconeix la ruta /projecte (també des de topBarData), mai el nom', () => {
    let { container } = render(<PageFrame chrome="full" title="Xifra" authorName="Sóc de Poble" authorHref="/projecte" />);
    expect(fills(capcalera(container))).toEqual([...DOS_LOGOS_SDP, 'H1.']);
    cleanup();
    ({ container } = render(<PageFrame chrome="full" title="Xifra" topBarData={{ authorName: 'Sóc de Poble', authorHref: DEFAULT_AUTHOR.href }} />));
    expect(logos(container)).toHaveLength(2);
    cleanup();
    /* El nom sol no signa: sense ruta, la boina no diu qui és. */
    ({ container } = render(<PageFrame chrome="full" title="Xifra" authorName="Sóc de Poble" />));
    expect(logos(container)).toHaveLength(0);
  });

  test('una ruta nul·la explícita amb l’autor per defecte continua signant el projecte', () => {
    const { container } = render(<PageFrame chrome="context" title="Pàgina" authorHref={null} />);
    expect(logos(container)).toHaveLength(2);
  });

  test('sense títol, el logotip sol ja fa aparéixer el bloc del títol', () => {
    const { container } = render(<PageFrame chrome="system" />);
    expect(fills(capcalera(container))).toEqual(DOS_LOGOS_SDP);
  });

  test('chrome="none" continua sense bloc del títol, ni logotip', () => {
    const { container } = render(<PageFrame chrome="none" title="T" />);
    expect(capcalera(container)).toBeNull();
    expect(container.querySelector('img.page-title-logo')).toBeNull();
  });

  test('amb la base del paquet (WordPress, Sollutia), els src pengen d’ella', () => {
    fixaBaseRecursos('/wp-content/plugins/socdepoble/dist');
    const { container } = render(<PageFrame chrome="system" title="Consola" />);
    expect(logos(container).map((img) => img.getAttribute('src'))).toEqual([
      `/wp-content/plugins/socdepoble/dist${NEGRE}`,
      `/wp-content/plugins/socdepoble/dist${BLANC}`
    ]);
    expect(logos(container).map((img) => img.outerHTML)).toEqual(marcatgeDAbans());
  });
});

describe('f) una persona o una font de fora no porta logotip', () => {
  test('una persona amb la seua ruta: el bloc del títol comença per l’H1', () => {
    const { container } = render(<PageFrame chrome="full" title="Mac Mini" authorName="Pepa" authorHref="/gent/pepa" />);
    expect(fills(capcalera(container))).toEqual(['H1.']);
  });

  test('una font de fora (el Lector) o una autoria sense ruta, tampoc', () => {
    let { container } = render(<PageFrame chrome="full" title="Notícia" authorName="La Veu de la Plaça" authorHref="/app/lector/fonts" />);
    expect(logos(container)).toHaveLength(0);
    cleanup();
    ({ container } = render(<PageFrame chrome="full" title="Notícia" authorName="" />));
    expect(logos(container)).toHaveLength(0);
  });

  test('una persona sense res més que el nom: cap bloc del títol', () => {
    const { container } = render(<PageFrame chrome="full" authorName="Pepa" authorHref="/gent/pepa" />);
    expect(capcalera(container)).toBeNull();
  });
});

describe('e) compatibilitat: showLogos ja no decidix sol', () => {
  test('showLogos={false} no lleva el logotip a una pàgina que signa Sóc de Poble', () => {
    const { container } = render(<PageFrame chrome="system" title="Realitat" showLogos={false} />);
    expect(fills(capcalera(container))).toEqual([...DOS_LOGOS_SDP, 'H1.']);
  });

  test('showLogos={true} continua pintant el de Sóc de Poble com abans, siga qui siga l’autor', () => {
    const { container } = render(<PageFrame chrome="full" title="Mac Mini" authorName="Javi" authorHref="/gent/javi" showLogos={true} />);
    expect(logos(container).map((img) => img.outerHTML)).toEqual(marcatgeDAbans());
  });

  test('només amb el booleà true: un text o un 1 no el posen a una persona', () => {
    for (const valor of ['true', 1, 'sí']) {
      const { container, unmount } = render(<PageFrame chrome="full" title="T" authorName="Pepa" authorHref="/gent/pepa" showLogos={valor} />);
      expect(logos(container), String(valor)).toHaveLength(0);
      unmount();
    }
  });
});

describe('c) logoEntitat: el logotip de l’entitat que signa', () => {
  test('sense fosc: una sola imatge per als dos temes, fins a 600x600 i sense Referer', () => {
    const { container } = render(<PageFrame chrome="full" title="Forn de la Torre"
      logoEntitat={{ clar: '/assets/forn.png', alt: 'Logotip de Forn de la Torre' }} />);
    expect(fills(capcalera(container))).toEqual(['IMG.page-title-logo page-title-logo--entitat', 'H1.']);
    const [logo] = logos(container);
    expect(logo.getAttribute('src')).toBe('/assets/forn.png');
    expect(logo.getAttribute('alt')).toBe('Logotip de Forn de la Torre');
    expect(logo.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  test('amb fosc: una imatge per tema, amb les classes de sempre', () => {
    const { container } = render(<PageFrame chrome="full" title="Cooperativa"
      logoEntitat={{ clar: '/assets/coop-negre.svg', fosc: '/assets/coop-blanc.svg', alt: 'Logotip Cooperativa' }} />);
    expect(fills(capcalera(container))).toEqual([...DOS_LOGOS_SDP, 'H1.']);
    expect(logos(container).map((img) => img.getAttribute('src'))).toEqual(['/assets/coop-negre.svg', '/assets/coop-blanc.svg']);
  });

  test('DEFAULT_AUTHOR.logo com a logoEntitat dona el mateix marcatge que la signatura de Sóc de Poble', () => {
    const { container } = render(<PageFrame chrome="full" title="Sóc de Poble" authorName="Sóc de Poble" logoEntitat={DEFAULT_AUTHOR.logo} />);
    expect(logos(container).map((img) => img.outerHTML)).toEqual(marcatgeDAbans());
  });

  /* Onada 8 (261009) · Una pàgina desada amb els SVG d'abans els pinta tal
     qual, i amb la mida natural reservada: no salta en carregar-los. */
  test('el logotip d’abans (els SVG de MARQUES_SVG_ANTIGUES) continua portant width="300" height="78"', () => {
    for (const base of ['/', '/wp-content/plugins/socdepoble/dist']) {
      fixaBaseRecursos(base);
      const { container, unmount } = render(<PageFrame chrome="full" title="Sóc de Poble"
        logoEntitat={{ clar: MARQUES_SVG_ANTIGUES.clar, fosc: MARQUES_SVG_ANTIGUES.fosc, alt: 'Logotip Sóc de Poble' }} />);
      expect(logos(container).map((img) => [img.getAttribute('src'), img.getAttribute('width'), img.getAttribute('height')]), base).toEqual([
        [resolveAsset(MARQUES_SVG_ANTIGUES.clar), '300', '78'],
        [resolveAsset(MARQUES_SVG_ANTIGUES.fosc), '300', '78']
      ]);
      unmount();
    }
  });

  test('mana sobre la signatura de Sóc de Poble; un descriptor sense imatge clara és com si no n’hi haguera', () => {
    let { container } = render(<PageFrame chrome="system" title="T" logoEntitat={{ clar: '/assets/forn.png', alt: '' }} />);
    expect(fills(capcalera(container))).toEqual(['IMG.page-title-logo page-title-logo--entitat', 'H1.']);
    cleanup();
    for (const buit of [{}, { clar: '' }, { clar: '   ', fosc: '/assets/x.svg' }, 'logo.png', null]) {
      ({ container } = render(<PageFrame chrome="system" title="T" logoEntitat={buit} />));
      expect(fills(capcalera(container)), JSON.stringify(buit)).toEqual([...DOS_LOGOS_SDP, 'H1.']);
      cleanup();
      ({ container } = render(<PageFrame chrome="full" title="T" authorName="Pepa" authorHref="/gent/pepa" logoEntitat={buit} />));
      expect(logos(container), JSON.stringify(buit)).toHaveLength(0);
      cleanup();
    }
  });

  test('un src ja resolt amb la base del paquet no es torna a prefixar', () => {
    fixaBaseRecursos('/wp-content/plugins/socdepoble/dist');
    const resolt = resolveAsset('/assets/forn.png');
    const { container } = render(<PageFrame chrome="full" title="Forn" logoEntitat={{ clar: resolt, alt: '' }} />);
    expect(logos(container)[0].getAttribute('src')).toBe('/wp-content/plugins/socdepoble/dist/assets/forn.png');
  });
});

describe('a) la ranura de l’editor mana sobre tot', () => {
  test('logoComponent es pinta tal qual; cap logotip automàtic, ni amb logoEntitat ni amb senseLogo', () => {
    const ranura = { logoComponent: <button type="button">Editar logotip</button> };
    for (const extra of [{}, { logoEntitat: { clar: '/assets/forn.png' } }, { senseLogo: true }]) {
      const { container, unmount } = render(<PageFrame chrome="context" title="Nota" topBarData={ranura} {...extra} />);
      expect(fills(capcalera(container)), JSON.stringify(Object.keys(extra))).toEqual(['DIV.page-title-logo-personalitzat', 'H1.']);
      expect(container.querySelector('img.page-title-logo')).toBeNull();
      unmount();
    }
  });
});

/* ── b) La via d'excepció ──────────────────────────────────────────────── */
const NOM_PROP = ['sense', 'Logo'].join('');

describe('b) la via d’excepció (senseLogo), només per ordre del Mestre', () => {
  test('amb true explícit, cap logotip: ni el de Sóc de Poble, ni logoEntitat, ni el de compatibilitat', () => {
    for (const extra of [{}, { logoEntitat: { clar: '/assets/forn.png' } }, { showLogos: true }]) {
      const { container, unmount } = render(<PageFrame chrome="system" title="T" {...extra} {...{ [NOM_PROP]: true }} />);
      expect(fills(capcalera(container)), JSON.stringify(Object.keys(extra))).toEqual(['H1.']);
      unmount();
    }
  });

  test('cap altre valor no el lleva (ni un text, ni un 1, ni false)', () => {
    for (const valor of ['true', 'sí', 1, false, null, undefined]) {
      const { container, unmount } = render(<PageFrame chrome="system" title="T" {...{ [NOM_PROP]: valor }} />);
      expect(logos(container), String(valor)).toHaveLength(2);
      unmount();
    }
  });

  test('UniversalPage la passa a PageFrame (la pàgina que el Mestre diga només ha de posar la prop)', () => {
    let { container } = render(<UniversalPage chrome="system" title="Consola" />);
    expect(logos(container)).toHaveLength(2);
    cleanup();
    ({ container } = render(<UniversalPage chrome="system" title="Consola" {...{ [NOM_PROP]: true }} />));
    expect(logos(container)).toHaveLength(0);
  });

  test('una config del ContentProvider amb la clau a true no el lleva', () => {
    const { container } = render(
      <ContentProvider initialConfig={{ chrome: 'system', title: 'Mur', [NOM_PROP]: true }}>
        <UniversalPage />
      </ContentProvider>
    );
    expect(logos(container)).toHaveLength(2);
  });

  test('la topBarData amb la clau a true tampoc el lleva (ni a UniversalPage ni a PageFrame)', () => {
    const dades = { [NOM_PROP]: true };
    expect(logos(render(<UniversalPage chrome="system" title="T" topBarData={dades} />).container)).toHaveLength(2);
    cleanup();
    expect(logos(render(<PageFrame chrome="system" title="T" topBarData={dades} />).container)).toHaveLength(2);
  });

  test('amb la config a true, només la prop explícita de la pàgina el lleva', () => {
    const { container } = render(
      <ContentProvider initialConfig={{ chrome: 'system', [NOM_PROP]: true }}>
        <UniversalPage title="Mur" {...{ [NOM_PROP]: true }} />
      </ContentProvider>
    );
    expect(logos(container)).toHaveLength(0);
  });

  /* Hui no la passa cap pàgina: si algú l'hi posa, esta prova cau i obliga a
     escriure ací l'ordre del Mestre que ho autoritza, amb el motiu. Mateix
     filtre que PageFrame.barraTaronja.test.jsx: compta el codi, no la
     documentació (comentaris i cadenes de prosa, com la fila de la taula del
     contracte d'EspecimenPage), i sí una clau entre cometes. */
  const AUTORITZADES = [];
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

  test('el filtre de codi veu la prop en JSX, en objectes i en claus entre cometes, i no en comentaris, prosa ni la taula de props', () => {
    expect(consumeix(`<UniversalPage title="T" ${NOM_PROP} />`)).toBe(true);
    expect(consumeix(`const p = { ${NOM_PROP}: true };`)).toBe(true);
    expect(consumeix(`const p = { '${NOM_PROP}': true };`)).toBe(true);
    expect(consumeix(`config['${NOM_PROP}'] = true;`)).toBe(true);
    expect(consumeix(`/* ${NOM_PROP} */ // ${NOM_PROP}\nconst a = ['Diu ${NOM_PROP}'];`)).toBe(false);
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

/* ── La mida (modules.css, @layer components) ──────────────────────────── */
describe('la mida: fins a 600px, responsiu, i fins a 600x600 per a una altra entitat', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
  /* Les capes que envolten una posició del full (els comentaris no compten). */
  const capesDe = (posicio) => {
    const net = css.replace(/\/\*[\s\S]*?\*\//g, (comentari) => ' '.repeat(comentari.length));
    const pila = [];
    let inici = 0;
    for (let i = 0; i < posicio; i += 1) {
      if (net[i] === '{') { pila.push(net.slice(inici, i).trim()); inici = i + 1; }
      else if (net[i] === '}') { pila.pop(); inici = i + 1; }
      else if (net[i] === ';') inici = i + 1;
    }
    return pila;
  };
  const regla = (patro) => {
    const trobada = css.match(patro);
    expect(trobada, String(patro)).not.toBeNull();
    return trobada.index;
  };

  test('.page-title-logo: min(100%, 600px) d’ample, dins de @layer components', () => {
    expect(capesDe(regla(/\.page-title-logo \{ width: min\(100%, 600px\); min-width: min\(100%, 260px\); \}/))).toEqual(['@layer components']);
  });

  test('.page-title-logo--entitat: max-height 600px, al mateix bloc @layer components', () => {
    const posicio = regla(/\.page-title-logo--entitat \{ max-height: 600px; \}/);
    expect(capesDe(posicio)).toEqual(['@layer components']);
    const bloc = css.slice(css.lastIndexOf('@layer components {', posicio), posicio);
    expect(bloc).toContain('.page-title-logo { width: min(100%, 600px)');
  });
});
