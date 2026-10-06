import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Puzzle } from 'lucide-react';

const navega = vi.hoisted(() => vi.fn());
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => navega,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import {
  Desplegable, Mono, Privat, PrivacitatConsola, TargetaConsola, TargetaResum, Xifra, tornaAlCim
} from './peces.jsx';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';

afterEach(cleanup);

/* La recepta del Panell de Control (src/sections/control/ControlSection.jsx):
   UniversalCard «action», icona lucide de 40 px amb traç 1,5, títol h3 i la
   descripció com a subtítol. Cap variant: només `sdp-consola__quieta` quan
   la targeta no obri res, perquè no pretenga ser clicable.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · TargetaResum i Xifra
   són OBSOLETS: cap pàgina de la Consola no els pinta
   (ConsolaSection.test.jsx · capXifraSolta ho vigila). Estes proves només
   guarden el que fan mentre es conserven al codi; no autoritzen a fer-los
   servir. */
function esTargetaDeControl(article, { quieta = false } = {}) {
  expect(article.className).toBe(quieta ? 'sp-card sp-card--action sdp-consola__quieta' : 'sp-card sp-card--action');
  const icona = article.querySelector('.sp-card-heading-with-icon .sp-card-title-icon svg');
  expect(icona.getAttribute('width')).toBe('40');
  expect(icona.getAttribute('stroke-width')).toBe('1.5');
  expect(article.querySelector('h3.sp-card-title')).not.toBeNull();
  expect(article.querySelector('h4.sp-card-subtitle')).not.toBeNull();
  expect(article.querySelector('.sp-card-footer')).toBeNull();
}

test('TargetaResum pinta exactament la targeta del Panell de Control', () => {
  render(<TargetaResum icona={Puzzle} titol="Inventari de skills" descripcio="22 skills al Mapa" a="/consola/inventari" />);
  const article = screen.getByRole('article');
  esTargetaDeControl(article);
  expect(article.querySelector('h3').textContent).toBe('Inventari de skills');
  expect(article.querySelector('h4').textContent).toBe('22 skills al Mapa');
  expect(screen.getByRole('link', { name: 'Inventari de skills' }).getAttribute('href')).toBe('/consola/inventari');
});

test('sense destí no hi ha cap enllaç, i les etiquetes són les del Control', () => {
  render(<TargetaResum icona={Puzzle} titol="Tauler" descripcio="—" etiquetes={[{ text: 'FALTA', className: 'sdp-badge-tag' }]} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  esTargetaDeControl(screen.getByRole('article'), { quieta: true });
  expect(document.querySelector('.sp-card-label.sdp-badge-tag').textContent).toBe('FALTA');
});

test('una etiqueta amb `to` porta les classes d’Insignia', () => {
  render(<TargetaResum icona={Puzzle} titol="Avisos" descripcio="2 avisos" a="/consola/salut"
    etiquetes={[{ text: 'Cal reparar', to: 'error' }, { text: 'Canvis nous', to: 'info' }]} />);
  const etiquetes = [...document.querySelectorAll('.sp-card-label')];
  expect(etiquetes.map((l) => [l.textContent, l.className])).toEqual([
    ['Cal reparar', 'sp-card-label sdp-insignia sdp-insignia--error'],
    ['Canvis nous', 'sp-card-label sdp-insignia sdp-insignia--info']
  ]);
});

test('amb onObri la targeta és un botó que porta el títol', () => {
  const onObri = vi.fn();
  render(<TargetaResum icona={Puzzle} titol="Consums" descripcio="3 registres" onObri={onObri} />);
  esTargetaDeControl(screen.getByRole('article'));
  screen.getByRole('button', { name: 'Consums' }).click();
  expect(onObri).toHaveBeenCalledTimes(1);
});

test('Xifra és una targeta de Control amb la xifra de títol i l’etiqueta de subtítol', () => {
  render(<Xifra icona={Puzzle} valor={22} etiqueta="skills al cens" />);
  const article = screen.getByRole('article');
  esTargetaDeControl(article, { quieta: true });
  expect(article.querySelector('h3').textContent).toBe('22');
  expect(article.querySelector('h4').textContent).toBe('skills al cens');
  expect(document.querySelector('.sdp-consola__xifra')).toBeNull();
});

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   La targeta explicativa porta la boina de l'autor real, l'entitat Sóc de
   Poble (logo, nom i poble; l'autor porta a /projecte), mai «Consola
   Termodinàmica» ni «Font: …», i la data a la pastilla de la boina (T51):
   un <time> sense clic, perquè una instantània de dades no és cap
   publicació del Calendari. Icona a la insígnia lateral en lloc de foto,
   títol, subtítol, entradilla, dada viva, etiquetes, tota clicable i el peu
   de la barra blava amb el verb canònic.
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la targeta de sistema sense boina i amb la data a
   l'última línia del cos (prompt 261004_0515, §6/T8). Ja ho estava el peu
   «Compartir + Obrir». */
test('TargetaConsola amb destí: boina de Sóc de Poble amb la data, tota clicable i el peu de la barra blava', () => {
  render(<TargetaConsola icona={Puzzle} titol="Inventari de skills" subtitol="Per a saber quines skills cal cuidar"
    entradilla="Semàfor de cada skill segons els avisos que en fa el Mapa del Mas." dada="22 skills al Mapa"
    generat="2026-09-25T13:12:23.715Z" a="/consola/inventari"
    etiquetes={[{ text: 'Important', to: 'avis' }]} />);
  const article = screen.getByRole('article');
  expect(article.className).toBe('sp-card sdp-consola__targeta');
  const ordre = [...article.children].map((el) => el.className.split(' ')[0]);
  expect(ordre).toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-body', 'sp-card-footer']);
  // La boina és la de l'entitat: enllaç a la pàgina del projecte, logo, nom i poble.
  const autor = article.querySelector('.sp-card-header > a.sp-card-author-link');
  expect(autor.getAttribute('href')).toBe('/projecte');
  expect(autor.querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
  expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(autor.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  expect(screen.getByRole('link', { name: /Sóc de Poble/ })).toBe(autor);
  expect(article.textContent).not.toContain('Consola Termodinàmica');
  expect(article.textContent).not.toContain('Font:');
  // La data, a la pastilla de la boina: un <time> sense clic, amb hora i dia.
  const { time, date, dateTime } = dataHoraDeBarra({ modificat: '2026-09-25T13:12:23.715Z' });
  const pastillaBoina = article.querySelector('.sp-card-header .sp-card-meta > time.btn-date-time');
  expect(pastillaBoina.getAttribute('datetime')).toBe(dateTime);
  expect([...pastillaBoina.querySelectorAll('span')].map((s) => s.textContent)).toEqual([time, date]);
  expect(article.querySelector('.sp-card-header button')).toBeNull();
  expect(article.querySelector('.sp-card-media-container')).toBeNull();
  const icona = article.querySelector('.sp-card-body.has-aside .sp-card-calendar-badge svg');
  expect([icona.getAttribute('width'), icona.getAttribute('stroke-width'), icona.getAttribute('aria-hidden')]).toEqual(['48', '1.5', 'true']);
  expect(article.querySelector('h3.sp-card-title').textContent).toBe('Inventari de skills');
  expect(article.querySelector('h4.sp-card-subtitle').textContent).toBe('Per a saber quines skills cal cuidar');
  // El cos ja no porta cap línia de data: només l'entradilla i la dada viva.
  expect([...article.querySelectorAll('.sp-card-text > p')].map((p) => [p.className, p.textContent])).toEqual([
    ['', 'Semàfor de cada skill segons els avisos que en fa el Mapa del Mas.'],
    ['sdp-consola__dada', '22 skills al Mapa']
  ]);
  expect(article.querySelector('.sp-card-text time, .sdp-consola__data')).toBeNull();
  const etiquetes = [...article.querySelectorAll('.sp-card-label')];
  expect(etiquetes).toHaveLength(1);
  expect(etiquetes[0].className).toBe('sp-card-label sdp-insignia sdp-insignia--avis');
  expect(etiquetes[0].textContent).toBe('Important');
  // Tota la targeta porta a la seua pàgina.
  expect(screen.getByRole('link', { name: 'Inventari de skills' }).getAttribute('href')).toBe('/consola/inventari');
  const peu = article.querySelector('.sp-card-footer');
  expect([...peu.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual([
    'Traduir Inventari de skills', 'Comentar Inventari de skills', 'Compartir Inventari de skills', 'Connectar amb Inventari de skills'
  ]);
  expect(peu.querySelector('.sp-card-connect-text').textContent).toBe('Connectar');
  expect(peu.textContent).not.toMatch(/Obrir|Veure detall/);
  // Connectar porta de veritat a la pàgina de la targeta.
  navega.mockClear();
  screen.getByRole('button', { name: 'Connectar amb Inventari de skills' }).click();
  expect(navega).toHaveBeenCalledWith('/consola/inventari');
});

/* T2 (ordre del Mestre, 260930) · Efecte tauler: cada mètrica és un h5
   centrat (ho fa la classe, a modules.css) dins d'un bloc propi que esquiva
   la insígnia flotant. Els missatges d'estat no són mètriques: paràgraf. */
test('T2 · TargetaConsola amb mètriques: un h5 per mètrica, en ordre, i cap paràgraf de dada', () => {
  render(<TargetaConsola icona={Puzzle} titol="Calendari de processos" subtitol="Per a vigilar el que corre sense ningú davant"
    entradilla="Què corre sol al Mas, quan, qui ho llança i si continua viu." dada="10 tasques · 2 vives · 1 mortes"
    metriques={['10 tasques', '2 vives', '1 mortes']} font="Font: el Mapa del Mas" a="/consola/calendari" />);
  const text = document.querySelector('.sp-card-text');
  expect([...text.children].map((el) => `${el.tagName}.${el.className}`)).toEqual(['P.', 'DIV.sdp-consola__metriques']);
  const metriques = [...text.querySelectorAll('.sdp-consola__metriques > *')];
  expect(metriques.map((h) => [h.tagName, h.className, h.textContent])).toEqual([
    ['H5', 'sdp-consola__metrica', '10 tasques'],
    ['H5', 'sdp-consola__metrica', '2 vives'],
    ['H5', 'sdp-consola__metrica', '1 mortes']
  ]);
  expect(document.querySelector('.sdp-consola__dada')).toBeNull();
  // La jerarquia de la targeta continua sense salts: h3 (títol) → h4 (subtítol) → h5.
  expect(screen.getAllByRole('heading').map((h) => h.tagName)).toEqual(['H3', 'H4', 'H5', 'H5', 'H5']);
});

test('T2 · TargetaConsola sense mètriques (null o llista buida): el paràgraf de dada de sempre', () => {
  const { unmount } = render(<TargetaConsola icona={Puzzle} titol="Crèdits" subtitol="Per a saber quant queda"
    entradilla="Saldo consumit de cada proveïdor." dada="Saldo desconegut" metriques={null} font="Font: consola.json" />);
  expect(document.querySelector('.sdp-consola__metriques')).toBeNull();
  expect(document.querySelector('p.sdp-consola__dada').textContent).toBe('Saldo desconegut');
  unmount();
  render(<TargetaConsola icona={Puzzle} titol="Crèdits" subtitol="Per a saber quant queda"
    entradilla="Saldo consumit de cada proveïdor." dada="Saldo desconegut" metriques={[]} font="Font: consola.json" />);
  expect(document.querySelector('h5')).toBeNull();
  expect(document.querySelector('p.sdp-consola__dada').textContent).toBe('Saldo desconegut');
});

/* T3 (ordre del Mestre, 260930) · La coberta desglossa els estats de dins
   de la pàgina, el més greu primer: una llista d'insígnies darrere de les
   mètriques. Ni capçaleres (l'Índex de la Consola no les ha de recollir)
   ni etiquetes de la targeta (el nivell i «Canvis nous» viuen a part). */
const ESTATS = [
  { clau: 'mort', n: 1, text: '1 tasca morta', to: 'error' },
  { clau: 'sense-llancador', n: 2, text: '2 tasques sense llançador', to: 'avis' },
  { clau: 'desconegut', n: 1, text: '1 tasca d’estat desconegut', to: 'info' }
];

test('T3 · TargetaConsola amb estats: una llista d’insígnies darrere de les mètriques, en ordre', () => {
  render(<TargetaConsola icona={Puzzle} titol="Calendari de processos" subtitol="Per a vigilar el que corre sense ningú davant"
    entradilla="Què corre sol al Mas, quan, qui ho llança i si continua viu." dada="10 tasques · 2 vives · 1 mortes"
    metriques={['10 tasques', '2 vives', '1 mortes']} estats={ESTATS} font="Font: el Mapa del Mas" a="/consola/calendari"
    etiquetes={[{ text: 'Cal reparar', to: 'error' }]} />);
  const text = document.querySelector('.sp-card-text');
  expect([...text.children].map((el) => `${el.tagName}.${el.className}`))
    .toEqual(['P.', 'DIV.sdp-consola__metriques', 'UL.sdp-consola__estats']);
  const llista = text.querySelector('ul.sdp-consola__estats');
  expect(llista.getAttribute('aria-label')).toBe('Estat per dins, el més greu primer');
  expect([...llista.children].map((li) => [li.tagName, li.children.length, li.firstElementChild.tagName,
    li.firstElementChild.className, li.textContent])).toEqual([
    ['LI', 1, 'SPAN', 'sdp-insignia sdp-insignia--error', '1 tasca morta'],
    ['LI', 1, 'SPAN', 'sdp-insignia sdp-insignia--avis', '2 tasques sense llançador'],
    ['LI', 1, 'SPAN', 'sdp-insignia sdp-insignia--info', '1 tasca d’estat desconegut']
  ]);
  // Cap capçalera nova i cap etiqueta nova: la jerarquia i les etiquetes són les de sempre.
  expect(screen.getAllByRole('heading').map((h) => h.tagName)).toEqual(['H3', 'H4', 'H5', 'H5', 'H5']);
  expect([...document.querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['Cal reparar']);
  expect(llista.querySelector('.sp-card-label')).toBeNull();
});

test('T3 · TargetaConsola sense estats (sense prop, null o llista buida): el cos de sempre, sense llista', () => {
  const targeta = (estats) => (
    <TargetaConsola icona={Puzzle} titol="Explorador del cervell" subtitol="Per a vore qui es relaciona amb qui"
      entradilla="El graf del Mas: peces, relacions i confiança." dada="3 nodes · 0 arestes"
      metriques={['3 nodes', '0 arestes']} estats={estats} font="Font: el Mapa del Mas" a="/consola/explorador" />
  );
  for (const estats of [undefined, null, []]) {
    const { unmount } = render(targeta(estats));
    expect([...document.querySelector('.sp-card-text').children].map((el) => `${el.tagName}.${el.className}`))
      .toEqual(['P.', 'DIV.sdp-consola__metriques']);
    expect(document.querySelector('ul.sdp-consola__estats')).toBeNull();
    unmount();
  }
});

/* T3 · La llista d'estats no és prosa: cada li perd el marge i el sagnat que
   base.css (@layer legacy) posa a tot li, que doblaven el buit entre files
   d'insígnies i desplaçaven cada una 2px del centre, i s'ajusta a l'alt de la
   insígnia. jsdom no calcula estils: es comprova la regla escrita, amb el
   patró de metriques.capes.test.js. */
const cssNet = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

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

test('T3 · la llista d’estats i cada element es reinicien a @layer components, amb tokens', () => {
  const moduls = cssNet('src/css/modules.css');
  const LLISTA = '.sdp-consola__estats { clear: both; display: flex; flex-wrap: wrap; justify-content: center; '
    + 'gap: var(--sdp-space-2); margin: var(--sdp-space-2) 0 0; padding: 0; list-style: none; }';
  const ELEMENT = '.sdp-consola__estats > li { display: flex; margin: 0; padding: 0; }';
  // Guanyen al li de base.css (legacy) per capa, sense apujar l'especificitat.
  const capa = blocDe(moduls, '@layer components {', LLISTA);
  expect(capa).toContain(LLISTA);
  expect(capa).toContain(ELEMENT);
  // Pedra Seca: cap valor cru (px, hex) a les dues regles.
  expect(`${LLISTA} ${ELEMENT}`).not.toMatch(/\d+px|#[0-9a-f]{3,6}\b/i);
});

/* Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la línia de data del cos i les seues regles. La data
   torna a la pastilla de la boina: cap regla de .sdp-consola__data queda
   viva al full (cap targeta la pinta). */
test('261004 · sense línia de data al cos, el full ja no en porta cap regla', () => {
  const moduls = cssNet('src/css/modules.css');
  expect(moduls).not.toMatch(/\.sdp-consola__data(?![\w-])/);
});

/* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): el peu
   «Veure detall» sense Compartir. Ara és el de la barra blava, i Connectar
   obri el mateix detall que la targeta. */
test('TargetaConsola amb onObri: tota la targeta obri el detall, i Connectar també', () => {
  const onObri = vi.fn();
  render(<TargetaConsola icona={Puzzle} titol="Consums" subtitol="Per a saber qui gasta tòkens i quants"
    entradilla="Tòkens d’entrada i d’eixida que cada agent anota al diari de sessió." dada="3 registres"
    onObri={onObri} />);
  // Cap enllaç de tota la targeta: és un botó. L'únic enllaç és el de l'autor de la boina.
  expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/projecte']);
  expect([...document.querySelectorAll('.sp-card-footer button')].map((b) => b.getAttribute('aria-label')))
    .toEqual(['Traduir Consums', 'Comentar Consums', 'Compartir Consums', 'Connectar amb Consums']);
  // Sense `creat` ni instantània la targeta no té cap data, i no se n'inventa
  // cap: la boina porta només l'autor.
  expect(document.querySelector('.btn-date-time, time')).toBeNull();
  expect(document.querySelector('.sp-card-header .sp-card-author-name').textContent).toBe('Sóc de Poble');
  screen.getByRole('button', { name: 'Consums' }).click();
  screen.getByRole('button', { name: 'Connectar amb Consums' }).click();
  expect(onObri).toHaveBeenCalledTimes(2);
});

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · cap pàgina de la Consola
   no pinta ja una targeta quieta: el pols, sense consola.json, continua
   portant a la pàgina del seu panell (ConsolaSection.test.jsx). Esta prova
   només guarda que el component no pinta un peu buit si algú no li dona
   destí. */
test('TargetaConsola sense acció: explicació quieta, sense peu buit; la boina sí que enllaça a l’autor', () => {
  render(<TargetaConsola icona={Puzzle} titol="Càrrega documental" subtitol="Per a saber quan s’embossa el context"
    entradilla="Compta els artefactes actius del cervell." dada="Recompte encara no disponible" />);
  const article = screen.getByRole('article');
  expect(article.className).toBe('sp-card sdp-consola__targeta sdp-consola__quieta');
  expect(article.querySelector('.sp-card-footer')).toBeNull();
  expect(article.querySelector('.sp-card-link-overlay')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  // L'únic enllaç és el de l'autor (la boina de sempre), mai la targeta sencera.
  expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/projecte']);
});

/* T51 · Regla del Mestre (260928): cap document sense data. La targeta porta
   la data de redacció del seu text (`creat`) o, si és més recent, la de la
   instantània (`generat`). T4 del prompt 1140 (ordre del Mestre, 261001: la
   pastilla completa, Data + Hora) · La redacció del copy (mitjanit UTC
   exacta) és un instant i es pinta amb l'hora i el dia locals, com la
   instantània; abans (D5) era un dia sol sense hora.
   Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   La data torna a la pastilla de la boina: hora i dia, en este ordre, dins
   d'un <time> sense clic. */
const pastilla = () => [...(document.querySelector('.sp-card-header time.btn-date-time')?.querySelectorAll('span') ?? [])]
  .map((s) => s.textContent);

test('T51 · TargetaConsola sense instantània: la data de redacció, sencera (T4: hora i dia locals)', () => {
  render(<TargetaConsola icona={Puzzle} titol="Consums" subtitol="Per a saber qui gasta tòkens i quants"
    entradilla="Tòkens d’entrada i d’eixida." dada="Sense mesura"
    creat="2026-09-24T00:00:00.000Z" generat={null} />);
  expect(pastilla()).toEqual(['02:00', '24/09/26']);
  expect(document.querySelector('.sp-card-header time.btn-date-time').getAttribute('datetime')).toBe('2026-09-24T02:00:00+02:00');
  // La mateixa font, el mateix lector que la resta de pastilles.
  const { time, date } = dataHoraDeBarra({ creat: '2026-09-24T00:00:00.000Z' });
  expect([time, date].filter(Boolean)).toEqual(pastilla());
  // Al cos no hi ha cap data: és a la boina.
  expect(document.querySelector('.sp-card-text time')).toBeNull();
});

test('T51 · TargetaConsola amb instantània més recent: mana la instantània; amb una instantània invàlida, la redacció', () => {
  const iso = '2026-09-25T13:12:23.715Z';
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  const { unmount } = render(<TargetaConsola icona={Puzzle} titol="Rebuts" subtitol="Per a comprovar"
    entradilla="Cada lectura deixa un rebut." dada="2 rebuts"
    creat="2026-09-24T00:00:00.000Z" generat={iso} />);
  expect(pastilla()).toEqual([`${dos(d.getHours())}:${dos(d.getMinutes())}`, `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/26`]);
  unmount();
  render(<TargetaConsola icona={Puzzle} titol="Rebuts" subtitol="Per a comprovar"
    entradilla="Cada lectura deixa un rebut." dada="2 rebuts"
    creat="2026-09-24T00:00:00.000Z" generat="no és una data" />);
  // T4 · La redacció (mitjanit UTC) és un instant: hora i dia locals.
  expect(pastilla()).toEqual(['02:00', '24/09/26']);
});

test('el mode privacitat amaga les rutes, dins i fora del codi', () => {
  render(
    <PrivacitatConsola.Provider value>
      <Mono>tooling/gates/hooks-local.mjs</Mono>
      <p><Privat>04_escriptori</Privat></p>
    </PrivacitatConsola.Provider>
  );
  expect(document.body.textContent).not.toContain('hooks-local');
  expect(document.body.textContent).not.toContain('04_escriptori');
  expect(screen.getAllByText('dada amagada pel mode privacitat')).toHaveLength(2);
});

test('sense privacitat, Privat deixa el text tal qual', () => {
  render(<p><Privat>04_escriptori</Privat></p>);
  expect(document.querySelector('p').innerHTML).toBe('04_escriptori');
});

test('Desplegable: <details> natiu, amb summary de fila i xebró decoratiu', () => {
  render(<Desplegable id="pols-rebuts" titol="Veure detall de rebuts"><p>taula</p></Desplegable>);
  const detall = document.getElementById('pols-rebuts');
  expect(detall.tagName).toBe('DETAILS');
  expect(detall.className).toBe('sdp-consola__detall');
  const cap = detall.querySelector('summary');
  expect(cap.className).toBe('sdp-consola__detall-cap');
  expect(cap.textContent).toBe('Veure detall de rebuts');
  expect(cap.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(detall.querySelector('.sdp-consola__detall-cos').textContent).toBe('taula');
});

test('tornaAlCim torna a dalt el primer contenidor desplaçat i res més', () => {
  const app = { scrollTop: 40, parentElement: null };
  const contingut = { scrollTop: 620, parentElement: app };
  const pagina = { scrollTop: 0, parentElement: contingut };
  expect(tornaAlCim({ parentElement: pagina })).toBe(contingut);
  expect(contingut.scrollTop).toBe(0);
  expect(app.scrollTop).toBe(40);                  // un sol contenidor per crida
  expect(tornaAlCim({ parentElement: pagina })).toBe(app);
  expect(app.scrollTop).toBe(0);
  expect(tornaAlCim({ parentElement: pagina })).toBeNull();
  expect(tornaAlCim(null)).toBeNull();
});
