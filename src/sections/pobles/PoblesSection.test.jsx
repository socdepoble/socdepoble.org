/**
 * T2 (prompt 1140, ordre del Mestre, 261001) · «Pobles mutilat»: les targetes
 * de /pobles pinten l'avatar del poble i la pastilla de data i hora sencera.
 *
 * Abans la pastilla llegia `dynamic_time` i `dynamic_date`, camps que no
 * escriu cap codi: la targeta eixia sense pastilla. Ara és la regla de Pedra
 * Seca §10 (editorial.js · dataDElement): la data de creació del poble, o la
 * de l'última versió si és posterior. Les proves s'executen a Europe/Madrid
 * (vite.config.js), i per això les hores literals són les de València.
 */
import React from 'react';
import { createTranslator } from '../../config/i18n.js';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {}, entitats: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('')],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
/* PS-07 · El toast d'una porta inerta, per a comprovar que avisa i no navega. */
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
/* PS-07 · La graella d'entitats d'un poble (/pobles/:id) amb dades fixes: el
   ganxo de dades és l'únic que es substituïx; la targeta és la de veres. */
vi.mock('./useEntitatsDelPoble.js', async (original) => ({ ...(await original()), useEntitatsDelPoble: () => mocks.entitats }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
/* Onada 6 · Les publicacions del Mur, per al naixement de cada poble. */
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));

import PoblesSection from './PoblesSection.jsx';
import { TOWNS as TOTS_ELS_POBLES } from './townsContent.js';
// Regressió visual de les 9 fitxes completes anteriors a l'Aplec; el lot nou es prova a territori.r10.test.jsx.
const TOWNS = TOTS_ELS_POBLES.filter((poble) => poble.created_at);
import { COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { rutaXatDePagina } from '../../config/navigation';
import { nomDeLaGent } from './nomsDelPoble.js';
import { objecteDelPobleXat } from './xatDelPoble.js';
import { APP_SEED } from '../../data/appSeed.js';
import { llavorAmbDatesDeProva } from '../mur/datesDeProvaMur.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { EntitatsDelPoble } from './EntitatsDelPoble.jsx';
import PanellDeViquipedia from './PanellDeViquipedia.jsx';
import { VistaPublicacionsDeLActor } from '../mur/PublicacionsDeLActor.jsx';

const llavor = (towns) => ({ status: 'ready', error: null, sortedTowns: towns });
const targetes = (arrel) => [...arrel.querySelectorAll('article.sp-card')];
const titol = (targeta) => targeta.querySelector('.sp-card-title').textContent;
const targetaDe = (arrel, nom) => targetes(arrel).find((targeta) => titol(targeta) === nom);
const etiquetes = (targeta) => [...targeta.querySelectorAll('.sp-card-labels > li')]
  .map((li) => [li.textContent, [...li.classList].find((classe) => classe.startsWith('sdp-badge-'))]);
const autor = (targeta) => targeta.querySelector('.sp-card-author-name').textContent;
const viquipedia = (targeta) => targeta.querySelector('.sp-card-labels > li.sdp-badge-neutral a').getAttribute('href');
const drets = (targeta) => targeta.querySelector('.sp-card-copyright').textContent;
const pastilla = (targeta) => {
  const control = targeta.querySelector('.sp-card-meta .btn-date-time');
  return control ? [...control.querySelectorAll('span')].map((s) => s.textContent) : null;
};

beforeEach(() => {
  mocks.t = createTranslator('ca');
  vi.clearAllMocks();
  mocks.core = llavor(TOWNS);
  mocks.mur = { status: 'ready', feedPosts: [], marketItems: [], events: [] };
  // PS-07 · Cada prova munta les seues entitats: res no passa d'una a l'altra.
  mocks.entitats = {};
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('T2 · cada poble conserva avatar; sense publicacions no inventa una pastilla de naixement', () => {
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    expect(targeta.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe(town.avatar_url);
    expect(pastilla(targeta)).toBeNull();
  }
});

test('T2 · la pastilla diu la publicació en hora local i porta al Calendari d’eixe mes', () => {
  mocks.mur.feedPosts = [{ id: 'publicacio', poble_id: 'la-torre-de-les-macanes', created_at: '2026-08-20T08:00:00Z' }];
  render(<PoblesSection />);
  // La Torre: created_at «2026-08-20T08:00:00.000Z» → 10:00 a València.
  const boto = screen.getByRole('button', { name: '10:00 20/08/26 · Obri el calendari d’eixe mes' });
  boto.click();
  expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-08');
});

test('T2 · sense publicació no s’ordena pel naixement: es conserva el directori estable', () => {
  const { container } = render(<PoblesSection />);
  expect(targetes(container).map(titol)).toEqual(TOWNS.map(town => town.title));
});

test('T2 · una edició de fitxa no puja el poble; sense publicació real, cap pastilla inventada', () => {
  mocks.core = llavor([
    { id: 'sense', title: 'Sense data', comarca: 'Enlloc', content: '.' },
    { id: 'vell', title: 'Vell', comarca: 'L’Alcoià', content: '.', created_at: '2026-08-01T08:00:00Z', updated_at: '2026-09-30T16:45:00Z' },
    { id: 'nou', title: 'Nou', comarca: 'L’Alcoià', content: '.', created_at: '2026-09-01T08:00:00Z' }
  ]);
  mocks.mur.feedPosts = [{ id: 'publicacio-nou', poble_id: 'nou', created_at: '2026-09-01T08:00:00Z' }];
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(['Nou', 'Sense data', 'Vell']);
  expect(pastilla(llista[0])).toEqual(['10:00', '01/09/26']);
  expect(pastilla(llista[1])).toBeNull();
  expect(pastilla(llista[2])).toBeNull();
  expect(llista[2].textContent).not.toMatch(/--/);
});

test('T2 · un poble remot sense avatar_url pinta la seua imatge com a avatar; sense cap imatge, el cercle de reserva', () => {
  mocks.core = llavor([
    { id: 'remot', title: 'Remot', comarca: 'La Marina', content: '.', image_url: '/assets/towns/sella/1.jpg', created_at: '2026-09-01T08:00:00Z' },
    { id: 'nu', title: 'Nu', comarca: 'La Marina', content: '.', created_at: '2026-08-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const [remot, nu] = targetes(container);
  expect(remot.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe('/assets/towns/sella/1.jpg');
  expect(nu.querySelector('.sp-card-author img')).toBeNull();
  expect(nu.querySelector('.sp-card-author .sp-card-avatar--fallback')).not.toBeNull();
});

test('T2 · incrustat en un amfitrió, l’avatar del poble penja del paquet (resolRecursPropi)', () => {
  fixaBaseRecursos('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist');
  mocks.core = llavor([TOWNS.find((t) => t.id === 'sella')]);
  const { container } = render(<PoblesSection />);
  /* Ordre del Mestre del 261004 (barra taronja universal) · La pàgina de
     sistema ja porta la seua barra taronja, amb el logo de Sóc de Poble com a
     avatar: l'avatar del poble es busca dins de la seua targeta, no el primer
     del document. */
  const [sella] = targetes(container);
  expect(sella.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src'))
    .toBe('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist/assets/towns/sella/2.jpg');
  // La barra de la pàgina també penja del paquet (Onada 8, 261009: el logo és el PNG).
  expect(container.querySelector('section.bar-orange img.sp-card-avatar').getAttribute('src'))
    .toBe('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
});

/*
 * Onada 5 (ordre del Mestre, 261008) · La caputxa taronja de la targeta de
 * /pobles és l'entitat («Gent de la Torre») i el seu poble («La Torre de les
 * Maçanes»), no la comarca. Té dos objectius de clic germans: la caputxa porta
 * al xat comú del poble (el mateix subjecte poble:<id> que «Comentar · En
 * públic», T63.2) i el cos o la foto, a la pàgina del poble. La targeta es
 * classifica per província (categoria) i comarca (etiqueta).
 * Onada 8 (261009) · La caputxa porta a la fitxa del poble; el xat, al botó
 * «Anar al xat» de dins de la targeta.
 */
test('Onada 5 · la caputxa de La Torre diu «Gent de la Torre» i el seu poble, no la comarca', () => {
  const { container } = render(<PoblesSection />);
  const torre = targetaDe(container, 'La Torre de les Maçanes');
  expect(torre.querySelector('.sp-card-author-name').textContent).toBe('Gent de la Torre');
  expect(torre.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  // La comarca continua al subtítol del cos.
  expect(torre.querySelector('.sp-card-subtitle').textContent).toBe('L\'Alacantí');
});

/* Onada 8 (261009; requeriments, punts 3 i 4: «Zero excepcions») · Derogat
   per l'Onada 8: la caputxa ja no porta al xat. La boina porta a la fitxa del
   poble (/pobles/<id>), com el cos; al xat de la gent s'hi entra pel botó gran
   «Anar al xat» de dins de la targeta (la ranura `accio` d'UniversalCard). */
test('Onada 8 · la caputxa i el cos porten a la fitxa del poble; el botó «Anar al xat», al xat comú del poble', () => {
  const { container } = render(<PoblesSection />);
  const town = TOWNS.find((t) => t.id === 'la-torre-de-les-macanes');
  const torre = targetaDe(container, town.title);
  const autor = torre.querySelector('a.sp-card-author-link');
  const vel = torre.querySelector('a.sp-card-link-overlay');
  expect(autor.getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
  expect(autor.getAttribute('href')).toBe(objecteDelPobleXat(town).ruta);
  expect(vel.getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
  // Dos objectius germans: la caputxa no està dins del vel, ni el vel dins de la caputxa.
  expect(autor.closest('.sp-card-link-overlay')).toBeNull();
  expect(vel.contains(autor)).toBe(false);
  expect(autor.contains(vel)).toBe(false);
  /* El botó gran, d'una banda a l'altra (la porta de Pedra Seca, ple), dins
     de la targeta. Onada 6 (pla 261009_0245, ítem 4) · El fil es diu com la
     gent del poble. */
  const boto = within(torre).getByRole('link', { name: 'Anar al xat' });
  expect(boto.getAttribute('href')).toBe(rutaXatDePagina(objecteDelPobleXat(town)));
  expect(boto.getAttribute('href')).toMatch(/^\/xat\?sobre=poble:la-torre-de-les-macanes&titol=Gent%20de%20la%20Torre&/);
  /* PS-07 (B7, marató 261101_2143) · Expectativa girada a propòsit: un sol
     primari per vista. El botó continua gran i a l'ample, però secundari. */
  expect(boto.className).toBe('sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple');
  expect(boto.closest('.sp-card-accio')).not.toBeNull();
  expect(vel.contains(boto)).toBe(false);
});

/* PS-07 (B7, marató 261101_2143; spec B7-PEDRA §2.6) · Un sol primari per
   vista a /pobles. Abans, nou «Anar al xat» blaus (sdp-boto--primari) a la
   graella, perquè PortaDePagina ignorava la varietat. Ara cap primari dins
   de la graella, i cada targeta conserva el seu botó gran, secundari. */
test('PS-07 · cap primari dins de la graella de /pobles: cada targeta porta «Anar al xat» gran i secundari', () => {
  const { container } = render(<PoblesSection />);
  const graella = container.querySelector('.sdp-card-grid');
  expect(graella.querySelectorAll('.sdp-boto--primari')).toHaveLength(0);
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const botons = within(targeta).getAllByRole('link', { name: 'Anar al xat' });
    expect(botons.map((b) => b.className)).toEqual(['sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple']);
  }
  // Sonda: el selector veu un primari si n'hi ha.
  graella.querySelector('.sp-card-accio a').classList.add('sdp-boto--primari');
  expect(graella.querySelectorAll('.sdp-boto--primari')).toHaveLength(1);
});

/* PS-07 · La varietat de PortaDePagina és una prop explícita: per defecte, la
   porta blava de sempre (la resta de pàgines no canvien); amb
   varietat="secundari", la mateixa porta gran i a l'ample en secundari, oberta
   o inerta. porta.varietat no la gira: normalitzaPortes hi posa 'secundari'
   per defecte i giraria totes les portes de pàgina. */
test('PS-07 · PortaDePagina: primari per defecte; varietat="secundari" gira el color, oberta i inerta; porta.varietat no gira res', () => {
  const PRIMARI = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';
  const SECUNDARI = 'sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple';
  const oberta = { id: 'xat', verb: 'Anar al xat', desti: '/xat' };
  const inerta = { id: 'mapa', verb: 'Obrir', nom: 'Obrir el mapa', desti: null };
  render(
    <>
      <div data-cas="defecte"><PortaDePagina porta={oberta} /></div>
      <div data-cas="secundari"><PortaDePagina porta={oberta} varietat="secundari" /></div>
      <div data-cas="dada"><PortaDePagina porta={{ ...oberta, varietat: 'secundari' }} /></div>
      <div data-cas="desconeguda"><PortaDePagina porta={oberta} varietat="perill" /></div>
      <div data-cas="inerta-defecte"><PortaDePagina porta={inerta} /></div>
      <div data-cas="inerta-secundari"><PortaDePagina porta={inerta} varietat="secundari" /></div>
    </>
  );
  const cas = (nom) => document.querySelector(`[data-cas="${nom}"]`).firstElementChild;
  expect([cas('defecte'), cas('dada'), cas('desconeguda')].map((e) => [e.tagName, e.className, e.getAttribute('href')]))
    .toEqual(Array(3).fill(['A', PRIMARI, '/xat']));
  expect([cas('secundari').tagName, cas('secundari').className, cas('secundari').getAttribute('href')]).toEqual(['A', SECUNDARI, '/xat']);
  expect(within(cas('secundari').parentElement).getByRole('link', { name: 'Anar al xat' })).toBe(cas('secundari'));
  // Inerta: el mateix button aria-disabled, el nom «(en obres)» i el toast; mai navega.
  expect(cas('inerta-defecte').className).toBe(PRIMARI);
  const boto = cas('inerta-secundari');
  expect([boto.tagName, boto.className, boto.getAttribute('aria-disabled')]).toEqual(['BUTTON', SECUNDARI, 'true']);
  expect(within(boto.parentElement).getByRole('button', { name: 'Obrir el mapa (en obres)' })).toBe(boto);
  fireEvent.click(boto);
  expect(mocks.toast).toHaveBeenCalledWith('“Obrir el mapa” encara està en obres.');
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* PS-07 · La pestanya «Empreses i entitats» de /pobles/:id: la mateixa regla.
   El blau és de l'acció de la pàgina del poble (detailSectionMeta, fora
   d'esta graella); el de cada entitat, secundari. */
test('PS-07 · a la graella d’entitats d’un poble, «Anar al xat» de cada entitat és gran i secundari, cap primari', () => {
  const fila = (id, name, kind) => ({ id, name, kind, lema: '', description: '.', logo_url: '', hero_url: '', town_name: 'Vilanova de Prova SdP' });
  mocks.entitats = { estat: 'ready', entitats: [fila('org-forn', 'Forn de la Plaça', 'company'), fila('org-colla', 'Colla de la Serra', 'group')], error: null, refresh: vi.fn() };
  const { container } = render(<EntitatsDelPoble poble={{ id: 'vilanova-de-prova-sdp', title: 'Vilanova de Prova SdP' }} />);
  const botons = screen.getAllByRole('link', { name: 'Anar al xat' });
  expect(botons).toHaveLength(2);
  expect(botons.map((b) => b.className)).toEqual(Array(2).fill('sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple'));
  expect(botons.every((b) => b.closest('.sp-card-accio') && b.getAttribute('href').startsWith('/xat?'))).toBe(true);
  expect(container.querySelectorAll('.sdp-boto--primari')).toHaveLength(0);
});

test('PS-07 · a /pobles/:id, «Porta-ho de la Viquipèdia» i les targetes amb porta dins de PublicacionsDelPoble són secundaris (cap primari extra)', () => {
  const { container: vq } = render(
    <PanellDeViquipedia poble={{ id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', provincia: 'Alacant' }} t={mocks.t} llig={vi.fn()} />
  );
  const botoPorta = vq.querySelector('[data-viquipedia="porta"]');
  expect(botoPorta).not.toBeNull();
  expect(botoPorta.className).toContain('sdp-boto--secundari');
  expect(vq.querySelectorAll('.sdp-boto--primari')).toHaveLength(0);

  const { container: pub } = render(
    <VistaPublicacionsDeLActor
      elements={[{ id: 'sys-xat', seccio: 'mur', item: { id: 'xat', type: 'sistema', isSystem: true, title: 'El Xat', mainHref: '/xat', description: '.' } }]}
      estat="ready"
      textos={{ titol: '', buit: 'Buit', carregant: 'Carregant', error: 'Error' }}
      varietatPorta="secundari"
    />
  );
  expect(pub.querySelectorAll('.sdp-boto--primari')).toHaveLength(0);
  const accioXat = pub.querySelector('.sp-card-accio a');
  expect(accioXat).not.toBeNull();
  expect(accioXat.className).toBe('sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple');
});

test('Onada 8 · cap boina de poble porta al xat: totes a la seua fitxa, i cada targeta porta el seu «Anar al xat»', () => {
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    const boina = targeta.querySelector('a.sp-card-author-link').getAttribute('href');
    expect([town.id, boina]).toEqual([town.id, `/pobles/${encodeURIComponent(town.id)}`]);
    expect(boina.startsWith('/xat')).toBe(false);
    expect(within(targeta).getByRole('link', { name: 'Anar al xat' }).getAttribute('href')).toBe(rutaXatDePagina(objecteDelPobleXat(town)));
  }
});

/* Onada 5 (F5, fase 3) · Sense author, la caputxa signa amb la regla única
   de nomsDelPoble.js (nomDeLaGent), la mateixa de l'H1 i de la barra taronja
   de la pàgina. El nom curt «Gent de la Torre» és una dada de la llavor, no
   un literal del codi: una Torre sense author rep el nom sencer. */
test('Onada 5 · un poble remot sense author rep nomDeLaGent del seu nom i obri el seu xat', () => {
  const orxeta = { id: 'orxeta', title: 'Orxeta', content: '.', created_at: '2026-09-01T08:00:00Z' };
  const torre = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', content: '.', created_at: '2026-08-01T08:00:00Z' };
  const campello = { id: 'el-campello', title: 'El Campello', content: '.', created_at: '2026-07-01T08:00:00Z' };
  mocks.core = llavor([orxeta, torre, campello]);
  const { container } = render(<PoblesSection />);
  const [targetaOrxeta, targetaTorre, targetaCampello] = targetes(container);
  expect(autor(targetaOrxeta)).toBe(nomDeLaGent('Orxeta'));
  expect(autor(targetaOrxeta)).toBe('Gent d\'Orxeta');
  expect(targetaOrxeta.querySelector('.sp-card-author-location').textContent).toBe('Orxeta');
  /* Onada 8 (261009) · El xat, pel botó «Anar al xat»; la caputxa, a la fitxa. */
  expect(within(targetaOrxeta).getByRole('link', { name: 'Anar al xat' }).getAttribute('href'))
    .toBe(rutaXatDePagina(objecteDelPobleXat(orxeta)));
  expect(within(targetaOrxeta).getByRole('link', { name: 'Anar al xat' }).getAttribute('href')).toMatch(/^\/xat\?sobre=poble:orxeta&/);
  expect(targetaOrxeta.querySelector('a.sp-card-author-link').getAttribute('href')).toBe('/pobles/orxeta');
  expect(autor(targetaTorre)).toBe('Gent de la Torre de les Maçanes');
  // L'article del topònim es contrau: «del Campello», no «de El Campello».
  expect(autor(targetaCampello)).toBe('Gent del Campello');
});

/* Llei del Píxel · Els 8 pobles sense enriquiment AH-27 conserven els drets
   anteriors. R5-D5: la Torre conserva autor, article i la seua foto pròpia,
   sense atribuir-la a Commons ni a una llicència CC que no té. */
test('Onada 5 · la llavor conserva author i article; R5-D5 la Torre no acredita a Commons la seua foto pròpia', () => {
  const { container } = render(<PoblesSection />);
  const ARTICLES = {
    'la-torre-de-les-macanes': 'La_Torre_de_les_Ma%C3%A7anes',
    penaguila: 'Pen%C3%A0guila',
    benifallim: 'Benifallim',
    sella: 'Sella_(Marina_Baixa)',
    orxeta: 'Orxeta',
    relleu: 'Relleu_(municipi)',
    alcoleja: 'Alcoleja',
    xixona: 'Xixona',
    tibi: 'Tibi'
  };
  expect(Object.keys(ARTICLES).sort()).toEqual(TOWNS.map((town) => town.id).sort());
  for (const town of TOWNS) {
    const targeta = targetaDe(container, town.title);
    expect(autor(targeta)).toBe(town.author);
    expect(viquipedia(targeta)).toBe(`https://ca.wikipedia.org/wiki/${ARTICLES[town.id]}`);
    // R5-D5 · La Torre conserva la seua foto pròpia (1.jpg): no s'acredita a Commons.
    if (town.id === 'la-torre-de-les-macanes') expect(town.wikipedia_provenance.photo).toBeNull();
    expect(drets(targeta)).toBe('© Viquipèdia / Wikimedia Commons (CC BY-SA)');
  }
  expect(autor(targetaDe(container, 'La Torre de les Maçanes'))).toBe('Gent de la Torre');
});

test('Onada 5 · les dades manen: el wikipedia_title de la fitxa i els seus drets; sense, la reserva', () => {
  mocks.core = llavor([
    { id: 'sella', title: 'Sella', wikipedia_title: 'Sella (municipi)', copyright: 'CC BY 4.0 Ajuntament de Sella', created_at: '2026-09-01T08:00:00Z' },
    { id: 'vila', title: 'La Vila Joiosa', wikipedia_title: 'la Vila Joiosa', created_at: '2026-08-01T08:00:00Z' },
    { id: 'relleu', title: 'Relleu', created_at: '2026-07-01T08:00:00Z' },
    { id: 'penaguila', title: 'Penàguila', created_at: '2026-06-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const [sella, vila, relleu, penaguila] = targetes(container);
  // El títol de la fitxa guanya a la desambiguació fixada al codi.
  expect(viquipedia(sella)).toBe('https://ca.wikipedia.org/wiki/Sella_(municipi)');
  expect(drets(sella)).toBe('CC BY 4.0 Ajuntament de Sella');
  expect(viquipedia(vila)).toBe('https://ca.wikipedia.org/wiki/la_Vila_Joiosa');
  expect(drets(vila)).toBe(COPYRIGHT_VIQUIPEDIA);
  /* Sense wikipedia_title, el títol del poble. Onada 6 (prompt 261009_0230,
     punt 6: cap poble escrit al codi) · La desambiguació de Relleu ja no és
     una reserva del codi sinó una dada de la llavor (townsSeed.js i
     supabase/seed.sql); una fitxa que no la porta enllaça el seu títol. */
  expect(viquipedia(relleu)).toBe('https://ca.wikipedia.org/wiki/Relleu');
  expect(viquipedia(penaguila)).toBe('https://ca.wikipedia.org/wiki/Pen%C3%A0guila');
});

/* Revisió adversarial de l'Onada 6 · Cap id ni nom de poble, amb qualsevol
   delimitador (cometes simples, dobles o plantilla de text). */
test('Onada 6 · cap id ni nom de poble escrit a PoblesSection.jsx', async () => {
  const { readFileSync } = await import('node:fs');
  const codi = readFileSync(`${process.cwd()}/src/sections/pobles/PoblesSection.jsx`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const town of TOWNS) {
    for (const valor of [town.id, town.title]) {
      expect(codi, valor).not.toMatch(new RegExp(`['"\`]${escapa(valor)}['"\`]`));
    }
  }
  // Sonda: el patró veu un nom entre cometes dobles i dins d'una plantilla.
  expect(`const a = "sella";`).toMatch(new RegExp(`['"\`]${escapa('sella')}['"\`]`));
  expect('const b = `Sella`;').toMatch(new RegExp(`['"\`]${escapa('Sella')}['"\`]`));
});

/* P0-39 / IDEA-166 · Ordenació dinàmica de /pobles per l'última publicació
   pública (Mur, Mercat, Esdeveniments), mostrant el rellotge de l'última
   activitat i situant La Torre de les Maçanes en #1, més el botó desplegable
   centrat de Xarxa de Pobles davall de l'entradilla. */
test('P0-39 / IDEA-166 · el bloc de Xarxa de Pobles és un botó desplegable centrat davall de l’entradilla', () => {
  const { container } = render(<PoblesSection />);
  const nav = container.querySelector('nav.sdp-xarxa-pobles');
  expect(nav).not.toBeNull();
  const boto = nav.querySelector('details.sdp-xarxa-pobles__desplegable > summary.sdp-xarxa-pobles__boto');
  expect(boto).not.toBeNull();
  expect(boto.textContent).toBe('Xarxa de Pobles');
  expect(boto.className).toContain('sdp-boto--secundari');
});

test('P0-39 / IDEA-166 · la pastilla diu l’última publicació pública del poble i l’ordre la seguix', () => {
  mocks.core = llavor([
    { id: 'nou', title: 'Nou', content: '.', created_at: '2026-09-01T08:00:00Z' },
    { id: 'vell', title: 'Vell', content: '.', created_at: '2026-08-01T08:00:00Z' }
  ]);
  mocks.mur = {
    status: 'ready',
    feedPosts: [
      // La publicació conserva la seua data encara que precedisca la fitxa del poble.
      { id: 'p1', poble_id: 'nou', created_at: '2026-07-01T08:00:00Z' },
      // Una publicació posterior de «Vell» el fa pujar per davant.
      { id: 'p2', poble_id: 'vell', created_at: '2026-09-15T08:00:00Z' },
      // La data triada al calendari no és la creació real: mana el created_at de l'última publicació.
      { id: 'p3', poble_id: 'vell', publish_date: '1950-01-01T08:00:00Z', created_at: '2026-09-20T08:00:00Z' },
      // Revisió adversarial · El text del lloc d'abans no data cap poble.
      { id: 'p4', author_location: 'Vell', created_at: '2026-10-01T08:00:00Z' }
    ],
    marketItems: [],
    events: []
  };
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(['Vell', 'Nou']);
  expect(pastilla(llista[0])).toEqual(['10:00', '20/09/26']);
  expect(pastilla(llista[1])).toEqual(['10:00', '01/07/26']);
});

test('P0-39 / IDEA-166 · un poble sense data a la fitxa mostra la seua última publicació declarada; un sense res, sense pastilla', () => {
  mocks.core = llavor([
    { id: 'el-campello', title: 'El Campello', content: '.' },
    { id: 'buit', title: 'Buit', content: '.' },
    { id: 'nomes-text', title: 'Només Text', content: '.' }
  ]);
  mocks.mur = {
    status: 'ready',
    feedPosts: [
      { id: 'c1', poble_id: 'el-campello', author_location: 'El Campello', created_at: '2026-09-02T16:45:00Z' },
      { id: 't1', author_location: 'Només Text', created_at: '2026-09-03T08:00:00Z' }
    ],
    marketItems: [{ id: 'm1', poble_id: 'el-campello', population: 'El Campello', created_at: '2026-09-05T08:00:00Z' }],
    events: []
  };
  const { container } = render(<PoblesSection />);
  const [campello, buit, nomesText] = targetes(container);
  expect(titol(campello)).toBe('El Campello');
  expect(pastilla(campello)).toEqual(['10:00', '05/09/26']);
  expect(pastilla(buit)).toBeNull();
  // Casat només pel text: sense pastilla.
  expect(titol(nomesText)).toBe('Només Text');
  expect(pastilla(nomesText)).toBeNull();
});

test.each([
  ['dates crues de la llavor (supabase/seed.sql)', () => APP_SEED, ['14:29', '06/11/26']],
  ['dates del mode seed (llavorAmbDatesDeProva)', () => llavorAmbDatesDeProva(APP_SEED, new Date(2026, 9, 9, 4, 0)), ['19:40', '08/10/26']]
])('P0-39 / IDEA-166 · La Torre de les Maçanes és #1 amb el rellotge de l’última publicació (%s)', (_, llavorDelMur, rellotgeTorre) => {
  const { feedPosts, marketItems, events } = llavorDelMur();
  expect(marketItems.some((item) => item.population === 'La Torre de les Maçanes')).toBe(true);
  mocks.mur = { status: 'ready', feedPosts, marketItems, events };
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(TOWNS.map(town => town.title));
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    if (town.id === 'la-torre-de-les-macanes') expect(pastilla(targeta)).toEqual(rellotgeTorre);
    else expect(pastilla(targeta), town.id).toBeNull();
  }
  expect(pastilla(llista[0])).toEqual(rellotgeTorre);
});

test('Onada 6 · «Comentar · En públic» de la targeta porta al xat de la gent; Connectar, com sempre', () => {
  mocks.core = llavor([TOWNS.find((t) => t.id === 'sella')]);
  const { container } = render(<PoblesSection />);
  const [sella] = targetes(container);
  /* Onada 8 (261009) · La caputxa ja no és el xat: es mira «Comentar · En
     públic» de veres, i el botó «Anar al xat», que porta al mateix fil. */
  fireEvent.click(within(sella).getByRole('button', { name: /^Comentar/ }));
  fireEvent.click(within(sella).getByRole('menuitem', { name: 'En públic' }));
  expect(mocks.navigate.mock.calls.at(-1)[0]).toContain('titol=Gent%20de%20Sella');
  expect(within(sella).getByRole('link', { name: 'Anar al xat' }).getAttribute('href')).toBe(mocks.navigate.mock.calls.at(-1)[0]);
  mocks.navigate.mockClear();
  within(sella).getByRole('button', { name: /Connectar/ }).click();
  const connectar = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(connectar.searchParams.get('title')).toBe('Sella');
});

test('Onada 5 · la targeta es classifica per província (categoria) i comarca (etiqueta), només si hi són', () => {
  const remot = { id: 'remot', title: 'Remot', content: '.', created_at: '2026-07-01T08:00:00Z' };
  mocks.core = llavor([TOWNS.find((t) => t.id === 'la-torre-de-les-macanes'), remot]);
  const { container } = render(<PoblesSection />);
  expect(etiquetes(targetaDe(container, 'La Torre de les Maçanes'))).toEqual([
    ['Pobles', 'sdp-badge-system'],
    ['Alacant', 'sdp-badge-category'],
    ['L\'Alacantí', 'sdp-badge-tag'],
    ['700 hab', 'sdp-badge-accent'],
    ['Enllaç a Wikipedia', 'sdp-badge-neutral']
  ]);
  expect(etiquetes(targetaDe(container, 'Remot'))).toEqual([
    ['Pobles', 'sdp-badge-system'],
    ['Enllaç a Wikipedia', 'sdp-badge-neutral']
  ]);
});

test('IDEA-58 · les fletxes recorren les fitxes del directori', () => {
  const { container } = render(<PoblesSection />);
  const graella = container.querySelector('.sdp-card-grid');
  const botons = [...graella.children].map(c => c.querySelector('a,button')).filter(Boolean);
  expect(botons.length).toBeGreaterThan(1);
  botons[0].focus(); fireEvent.keyDown(botons[0], { key: 'End' }); expect(document.activeElement).toBe(botons.at(-1));
  fireEvent.keyDown(botons.at(-1), { key: 'Home' }); expect(document.activeElement).toBe(botons[0]);
  fireEvent.keyDown(botons[0], { key: 'ArrowDown' }); expect(document.activeElement).toBe(botons[1]);
  fireEvent.keyDown(botons[1], { key: 'ArrowUp' }); expect(document.activeElement).toBe(botons[0]);
});
