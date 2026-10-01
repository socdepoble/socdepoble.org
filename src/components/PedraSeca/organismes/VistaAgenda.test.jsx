/* Fase visual (prompt 261001_0445) · La vista Agenda: només els dies amb
   actes, la data curta a la vista i la llarga per al lector, hui en cercle
   (aria-current), files amb el punt de la font, l'hora i el títol, i la línia
   d'«ara» dins del grup de hui. Llavor neutra (cap dada de les captures).
   Al final, el contrast WCAG de l'agenda, l'any i la navegació, resolt des de
   tokens.css (clar i fosc) i les regles reals de modules.css. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { VistaAgenda } from './VistaAgenda.jsx';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(cleanup);

const DESDE = new Date(2026, 9, 1, 8, 0);
const FINS = new Date(2026, 10, 1);
const AVUI = new Date(2026, 9, 1, 12, 0);
const ARA = new Date(2026, 9, 1, 12, 0);
const acteA = creaEsdeveniment({ id: 'a', titol: 'Acte A', inici: { dataHora: '2026-10-01T09:00' }, fi: { dataHora: '2026-10-01T10:30' }, font: { tipus: 'esdeveniment' } });
const acteB = creaEsdeveniment({ id: 'b', titol: 'Acte B', inici: { dataHora: '2026-10-01T16:00' }, font: { tipus: 'producte' } });
const acteC = creaEsdeveniment({ id: 'c', titol: 'Acte C', inici: { data: '2026-10-01' }, font: { tipus: 'pagina' } });
const mercat = creaEsdeveniment({ id: 'mercat', titol: 'Mercat dels dissabtes', inici: { data: '2026-09-05' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] });
const ball = creaEsdeveniment({ id: 'ball', titol: 'Ball de nit', inici: { dataHora: '2026-10-02T22:00' }, fi: { dataHora: '2026-10-03T02:00' }, font: { tipus: 'agenda' } });
const fira = creaEsdeveniment({ id: 'fira', titol: 'Fira de tardor', inici: { data: '2026-10-16' }, fi: { data: '2026-10-18' } });
const vell = creaEsdeveniment({ id: 'vell', titol: 'Acte vell', inici: { dataHora: '2026-09-30T10:00' } });
const ESDEVENIMENTS = [acteB, null, mercat, acteA, ball, fira, vell, acteC];
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const pinta = (props = {}) => render(
  <VistaAgenda esdeveniments={ESDEVENIMENTS} desde={DESDE} fins={FINS} avui={AVUI} ara={ARA} locale="ca-ES" titol="Agenda del poble" {...props} />
);
const textos = (llista) => [...llista.children].map((li) => (li.classList.contains('sdp-cal-agenda__ara') ? '— ara —' : li.textContent));

test('només els dies del rang amb actes, cada un amb un encapçalament que diu la data llarga', () => {
  const { getByRole } = pinta();
  const regio = getByRole('region', { name: 'Agenda del poble' });
  // El nom accessible de cada encapçalament: la data llarga (la curta és aria-hidden).
  expect(within(regio).getAllByRole('heading', { level: 3 }).map((h) => h.querySelector('.sdp-sr-only').textContent)).toEqual([
    `${dataLlarga(new Date(2026, 9, 1))} (hui)`, ...[2, 3, 10, 16, 17, 24, 31].map((d) => dataLlarga(new Date(2026, 9, d)))
  ]);
  expect(within(regio).getByRole('heading', { level: 3, name: `${dataLlarga(new Date(2026, 9, 1))} (hui)` })).toBeTruthy();
  // L'acte de setembre (abans del rang) no hi és, encara que el rang comence a les 08:00.
  expect(regio.textContent).not.toContain('Acte vell');
});

test('la data curta es veu (número i «oct., dj.») i és aria-hidden; hui porta aria-current i el cercle', () => {
  const { container } = pinta();
  const [primer, segon] = container.querySelectorAll('.sdp-cal-agenda__dia');
  expect(primer.getAttribute('aria-current')).toBe('date');
  expect(segon.hasAttribute('aria-current')).toBe(false);
  expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  const numero = primer.querySelector('.sdp-cal-agenda__numero');
  const curta = primer.querySelector('.sdp-cal-agenda__data');
  expect(numero.textContent).toBe('1');
  expect(curta.textContent).toBe(`${new Date(2026, 9, 1).toLocaleDateString('ca-ES', { month: 'short' })}, dj.`);
  expect([numero, curta].map((el) => el.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
  expect(segon.querySelector('.sdp-cal-agenda__data').textContent).toMatch(/, dv\.$/);
});

test('cada dia és una llista ordenada amb el nom del seu encapçalament; primer el de tot el dia i després per hora', () => {
  const { getByRole } = pinta({ ara: new Date(2026, 9, 5, 9, 0) });
  const dijous = getByRole('list', { name: `${dataLlarga(new Date(2026, 9, 1))} (hui)` });
  expect(dijous.tagName).toBe('OL');
  expect(textos(dijous)).toEqual(['Tot el dia Acte C', '09:00–10:30 Acte A', '16:00 Acte B']);
  // Un acte que passa de mitjanit diu les seues hores reals els dos dies.
  expect(textos(getByRole('list', { name: dataLlarga(new Date(2026, 9, 2)) }))).toEqual(['22:00–02:00 Ball de nit']);
  expect(textos(getByRole('list', { name: dataLlarga(new Date(2026, 9, 3)) }))).toEqual(['Tot el dia Mercat dels dissabtes', '22:00–02:00 Ball de nit']);
  // Un de diversos dies (la fi és exclusiva): el 16 i el 17, no el 18.
  expect(textos(getByRole('list', { name: dataLlarga(new Date(2026, 9, 17)) }))).toEqual(['Tot el dia Fira de tardor', 'Tot el dia Mercat dels dissabtes']);
});

/* Correcció de la revisió · Un acte de 24 h de paret o més va a la franja de
   VistaSetmana (separaFranja): l'agenda diu «Tot el dia» a cada dia, com la
   barra. Abans, un acte de 25 h que comença a les 22:00 deia «22:00–23:00»
   els dos dies, i un de 24 h justes, «10:00–10:00». */
test('un acte de 24 h o més diu «Tot el dia» a cada dia; un de menys que passa de mitjanit, les seues hores', () => {
  const llarg = creaEsdeveniment({ id: 'llarg', titol: 'Acte llarg', inici: { dataHora: '2026-10-06T22:00' }, fi: { dataHora: '2026-10-07T23:00' } });
  const just = creaEsdeveniment({ id: 'just', titol: 'Acte d’un dia', inici: { dataHora: '2026-10-13T10:00' }, fi: { dataHora: '2026-10-14T10:00' } });
  const curt = creaEsdeveniment({ id: 'curt', titol: 'Acte curt', inici: { dataHora: '2026-10-20T10:00' }, fi: { dataHora: '2026-10-21T09:59' } });
  const { getByRole } = render(<VistaAgenda esdeveniments={[llarg, just, curt]} desde={DESDE} fins={FINS} avui={AVUI} ara={ARA} locale="ca-ES" />);
  const delDia = (d) => textos(getByRole('list', { name: dataLlarga(new Date(2026, 9, d)) }));
  expect([6, 7].map(delDia)).toEqual([['Tot el dia Acte llarg'], ['Tot el dia Acte llarg']]);
  expect([13, 14].map(delDia)).toEqual([['Tot el dia Acte d’un dia'], ['Tot el dia Acte d’un dia']]);
  // Un minut menys de 24 h: graella a VistaSetmana, hores reals a l'agenda.
  expect([20, 21].map(delDia)).toEqual([['10:00–09:59 Acte curt'], ['10:00–09:59 Acte curt']]);
});

test('cada fila porta la classe de color de la seua font i un punt aria-hidden; les files no són interactives', () => {
  const { container, getByRole } = pinta();
  const files = [...getByRole('list', { name: `${dataLlarga(new Date(2026, 9, 1))} (hui)` }).querySelectorAll('.sdp-cal-agenda__acte')];
  expect(files.map((li) => li.className)).toEqual([
    'sdp-cal-agenda__acte sdp-cal-font--pagina', 'sdp-cal-agenda__acte sdp-cal-font--esdeveniment', 'sdp-cal-agenda__acte sdp-cal-font--producte'
  ]);
  expect(container.querySelector('.sdp-cal-font--agenda').textContent).toContain('Ball de nit');
  // Sense font, el color de publicació.
  expect([...container.querySelectorAll('.sdp-cal-font--publicacio')].map((li) => li.textContent)).toContain('Tot el dia Mercat dels dissabtes');
  expect([...container.querySelectorAll('.sdp-cal-agenda__punt')].every((punt) => punt.getAttribute('aria-hidden') === 'true')).toBe(true);
  expect(container.querySelector('button, a, [tabindex]')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
});

test('la línia d’«ara»: davant del primer acte que encara no ha començat, només el dia d’ara', () => {
  const llista = (props) => {
    const { getByRole, container } = pinta(props);
    const textosDelDia = textos(getByRole('list', { name: `${dataLlarga(new Date(2026, 9, 1))} (hui)` }));
    const linies = container.querySelectorAll('.sdp-cal-agenda__ara');
    const resultat = { textosDelDia, linies: linies.length, amagada: [...linies].every((l) => l.getAttribute('aria-hidden') === 'true') };
    cleanup();
    return resultat;
  };
  expect(llista({ ara: ARA })).toEqual({ textosDelDia: ['Tot el dia Acte C', '09:00–10:30 Acte A', '— ara —', '16:00 Acte B'], linies: 1, amagada: true });
  // De matí: després del de tot el dia; de nit, al final.
  expect(llista({ ara: new Date(2026, 9, 1, 6, 0) }).textosDelDia).toEqual(['Tot el dia Acte C', '— ara —', '09:00–10:30 Acte A', '16:00 Acte B']);
  expect(llista({ ara: new Date(2026, 9, 1, 18, 0) }).textosDelDia).toEqual(['Tot el dia Acte C', '09:00–10:30 Acte A', '16:00 Acte B', '— ara —']);
  // Un acte que ja corre queda damunt de la línia.
  expect(llista({ ara: new Date(2026, 9, 1, 9, 30) }).textosDelDia).toEqual(['Tot el dia Acte C', '09:00–10:30 Acte A', '— ara —', '16:00 Acte B']);
  // Un dia sense actes no té grup ni línia.
  expect(llista({ ara: new Date(2026, 9, 5, 9, 0) })).toMatchObject({ linies: 0 });
});

test('sense cap acte, el missatge de buit; el nom per defecte diu el rang', () => {
  const { getByRole, container } = render(<VistaAgenda esdeveniments={[]} desde={DESDE} fins={FINS} avui={AVUI} ara={ARA} locale="ca-ES" buit="Res a l’agenda." />);
  const dataCurta = (d) => d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const regio = getByRole('region', { name: `Agenda del ${dataCurta(new Date(2026, 9, 1))} al ${dataCurta(new Date(2026, 9, 31))}` });
  expect(regio.querySelector('ol')).toBeNull();
  expect(container.querySelector('.sdp-cal-agenda__buit').textContent).toBe('Res a l’agenda.');
});

test('nivellTitol tria l’encapçalament; un nivell fora de rang torna al 3', () => {
  const { container } = pinta({ nivellTitol: 2 });
  expect(container.querySelectorAll('h2.sdp-cal-agenda__cap')).toHaveLength(8);
  cleanup();
  const altre = pinta({ nivellTitol: 9 });
  expect(altre.container.querySelectorAll('h3.sdp-cal-agenda__cap')).toHaveLength(8);
});

test('un acte que es repetix massa sovint ho diu', () => {
  const campanades = creaEsdeveniment({ id: 'campanades', titol: 'Campanades', inici: { dataHora: '2026-10-01T00:00' }, recurrencia: ['RRULE:FREQ=HOURLY'] });
  const { getByText } = render(<VistaAgenda esdeveniments={[campanades]} desde={DESDE} fins={FINS} avui={AVUI} ara={ARA} locale="ca-ES" />);
  expect(getByText('Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.')).toBeTruthy();
});

/* ── Contrast WCAG 2.x, en clar i en fosc ─────────────────────────────────
   Els tokens es resolen des de tokens.css (i els cànons de design-tokens.css):
   el tema clar, les declaracions abans del bloc fosc; el fosc, les mateixes
   amb el bloc fosc damunt. Els àlies --sdp-cal-* i els colors de cada font
   es lligen del bloc SDP:calendari-vistes de modules.css, i cada parella, de
   la regla que de veres la pinta: si algú canvia un token de la regla, la
   prova ho mesura. Text: 4,5:1. Objectes i estats (punts, línia, vores,
   cercles): 3:1 (WCAG 1.4.11). */
const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llegix('src/css/tokens.css');
const CANONS = llegix('src/css/design-tokens.css');
const FULLS = `${llegix('src/css/components.css')}\n${llegix('src/css/modules.css')}`;
const declaracions = (text) => Object.fromEntries([...text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const iniciFosc = TOKENS.indexOf(':root[data-theme="dark"]');
const TEMES = {
  clar: { ...declaracions(CANONS), ...declaracions(TOKENS.slice(0, iniciFosc)) },
  fosc: { ...declaracions(CANONS), ...declaracions(TOKENS.slice(0, iniciFosc)), ...declaracions(TOKENS.slice(iniciFosc)) }
};
/* Les regles finals de components.css i modules.css: [{ selectors, cos (les custom properties), text }]. */
const REGLES = [...FULLS.matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(([, sel, cos]) => ({ selectors: sel.split(',').map((s) => s.trim()), cos: declaracions(`${cos};`), text: cos }));
const propietats = (cos) => Object.fromEntries(cos.split(';').map((d) => /^\s*([\w-]+)\s*:\s*(.+)$/.exec(d)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
/** La declaració d'una propietat a la primera regla amb eixe selector que la porta. */
function valor(selector, propietat) {
  const regla = REGLES.find((r) => r.selectors.includes(selector) && propietats(r.text)[propietat] !== undefined);
  expect(regla, `${selector} { ${propietat} }`).toBeTruthy();
  return propietats(regla.text)[propietat];
}
/* Els àlies de les vistes noves i els de cada font (--sdp-cal-bloc-*). */
const ALIES = REGLES.find((r) => r.selectors.includes('.sdp-cal-agenda') && r.cos['--sdp-cal-hui-fons']).cos;
const deLaFont = (font) => REGLES.find((r) => r.selectors.includes(`.sdp-cal-font--${font}`)).cos;
function hex(text, mapa, vist = new Set()) {
  const net = text.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vist.has(nom), `cicle ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeTruthy();
    return hex(mapa[nom], mapa, new Set([...vist, nom]));
  }).trim();
  return net.length === 4 ? `#${[...net.slice(1)].map((c) => c + c).join('')}` : net.toLowerCase();
}
const lluminancia = (color) => {
  expect(color).toMatch(/^#[0-9a-f]{6}$/);
  const [r, g, b] = color.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [la, lb] = [lluminancia(a), lluminancia(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

describe('contrast WCAG de l’agenda, l’any i la navegació (clar i fosc)', () => {
  const FONTS = ['esdeveniment', 'publicacio', 'producte', 'pagina', 'agenda'];
  for (const tema of ['clar', 'fosc']) {
    const mapa = { ...TEMES[tema], ...ALIES };
    const de = (selector, propietat, extra = {}) => hex(valor(selector, propietat), { ...mapa, ...extra });
    const targeta = de('.sdp-cal-agenda', 'background');

    test(`${tema}: la superfície de l’agenda i de l’any és la targeta`, () => {
      expect(de('.sdp-cal-any', 'background')).toBe(targeta);
      expect(targeta).toBe(hex('var(--sdp-fons-targeta)', mapa));
    });

    test(`${tema}: textos sobre la targeta (≥ 4,5:1)`, () => {
      const parelles = {
        'agenda · hora': de('.sdp-cal-agenda__hora', 'color'),
        'agenda · títol': de('.sdp-cal-agenda__titol', 'color'),
        'agenda · data curta': de('.sdp-cal-agenda__cap', 'color'),
        'agenda · número': de('.sdp-cal-agenda__numero', 'color'),
        'agenda · buit': de('.sdp-cal-agenda__buit', 'color'),
        'any · dia': de('.sdp-cal-any__dia', 'color'),
        'any · dia veí': de('.sdp-cal-any__dia--fora', 'color'),
        'any · nom del mes': de('.sdp-cal-any__nom', 'color'),
        'navegació · títol': de('.sdp-cal-navegacio__titol', 'color')
      };
      for (const [nom, color] of Object.entries(parelles)) expect(contrast(color, targeta), `${tema} ${nom}`).toBeGreaterThanOrEqual(4.5);
    });

    test(`${tema}: hui, el triat i la vista premuda (≥ 4,5:1 el text; ≥ 3:1 el senyal)`, () => {
      for (const selector of ['.sdp-cal-agenda__dia[aria-current="date"] .sdp-cal-agenda__numero', '.sdp-cal-any__dia[aria-current="date"] .sdp-cal-any__numero']) {
        const [fons, text] = [de(selector, 'background'), de(selector, 'color')];
        expect(contrast(text, fons), `${tema} ${selector} text`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fons, targeta), `${tema} ${selector} cercle`).toBeGreaterThanOrEqual(3);
      }
      const triat = '.sdp-cal-any__dia--triat .sdp-cal-any__numero';
      expect(contrast(de(triat, 'color'), de(triat, 'background')), `${tema} triat text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(de(triat, 'border-color'), targeta), `${tema} triat vora`).toBeGreaterThanOrEqual(3);
      const premuda = '.sdp-cal-vistes .sdp-pindola__opcio[aria-pressed="true"]';
      expect(contrast(de(premuda, 'color'), de(premuda, 'background')), `${tema} vista premuda`).toBeGreaterThanOrEqual(4.5);
      // L'estat de la premuda també es llig sense color: subratllada.
      expect(valor(premuda, 'text-decoration')).toBe('underline');
    });

    test(`${tema}: la línia d’«ara», les fletxes i el punt de cada font (≥ 3:1 sobre la targeta)`, () => {
      expect(contrast(de('.sdp-cal-agenda__ara', 'background'), targeta), `${tema} ara`).toBeGreaterThanOrEqual(3);
      expect(contrast(de('.sdp-boto--fantasma', 'color'), targeta), `${tema} fletxes`).toBeGreaterThanOrEqual(3);
      for (const font of FONTS) {
        const punt = de('.sdp-cal-agenda__punt', 'background', deLaFont(font));
        expect(contrast(punt, targeta), `${tema} punt ${font}`).toBeGreaterThanOrEqual(3);
      }
    });
  }
});

/* ── Els valors per defecte dels elements nus ─────────────────────────────
   Correcció de la revisió · base.css (capa legacy) posa a tot h3 una ratlla i
   12px de coixí de baix, a tot li 4px de sagnat i a tot botó un min-width de
   44px; sdp.css ratlla les setmanes parelles de tota taula, la pinta amb el
   ratolí damunt i, en pantalla estreta (max-width: 40rem), la passa a bloc amb
   scroll horitzontal propi. La capa components guanya, però només en les
   propietats que declara. jsdom no maqueta: es comproven les regles del full,
   com taules.capes.test.js. */
describe('l’agenda i l’any desfan els valors per defecte de base.css i sdp.css', () => {
  test('h3: ni ratlla ni coixí de baix a la data de l’agenda ni al nom del mes', () => {
    for (const selector of ['.sdp-cal-agenda__cap', '.sdp-cal-any__nom']) {
      expect(valor(selector, 'border-block-end'), selector).toBe('0');
      expect(valor(selector, 'padding-block-end'), selector).toBe('0');
    }
  });

  test('li: les files de l’agenda, sense sagnat, alineades amb la línia d’«ara»', () => {
    expect(valor('.sdp-cal-agenda__acte', 'padding').split(/\s+/)).toEqual(['var(--sdp-space-1)', '0']);
    expect(valor('.sdp-cal-agenda__ara', 'padding')).toBe('0');
  });

  test('botó: el dia de l’any no hereta el min-width de 44px (amb ratolí la cel·la fa 2rem)', () => {
    expect(valor('.sdp-cal-any__dia', 'min-inline-size')).toBe('0');
  });

  test('taula: la de cada mes es queda taula, sense scroll propi, sense zebra i sense hover de fila', () => {
    expect(valor('.sdp-cal-any__graella', 'display')).toBe('table');
    expect(valor('.sdp-cal-any__graella', 'overflow')).toBe('visible');
    expect(valor('.sdp-cal-any__graella tbody tr', 'background')).toBe('transparent');
  });
});
