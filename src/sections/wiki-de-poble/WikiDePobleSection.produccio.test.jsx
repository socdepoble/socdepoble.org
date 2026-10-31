/* 261002 · La Wiki en mode producció: import.meta.env.DEV és fals ABANS
   d'importar-la (vi.hoisted), com quan Vite el reemplaça al build. Cap
   categoria ni ítem de les eines locals, i un ?item= d'una eina no pinta
   res. Que el build no porte el codi dels Tractors (ni, ja en cap mode, el de
   la Gestoria) ho comprova gestoria/privacitat.test.js compilant la Wiki amb
   Vite. Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Gestoria ja no és de la Wiki; els seus ids vells són
   ítems desconeguts, també en producció.
   261006 (MarIA, WikiDePobleSection.jsx de les 01:46; prompt 261006_0224, T6):
   la Consola ja no té carpeta pròpia i penja de «Maquinària de la IAIA». En
   producció, eixa carpeta només porta la Consola.
   Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   Proves actualitzades a propòsit. En producció, la carpeta «Maquinària de la
   IAIA» (i la Consola incrustada) només ix per a qui és superadmin, com la
   ruta /consola: abans la veia qualsevol visitant de la Wiki pública.
   Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical. Proves
   actualitzades a propòsit: fora de desenvolupament, la carpeta porta la
   documentació pública de les tres peces (Tractors, Sentinelles i el BIOS),
   amb els mateixos ids, i ix per a tothom; la Consola continua sent només de
   qui és superadmin. Les pàgines de documentació no porten cap acció ni
   carreguen cap panell (els dobles de dalt en serien la prova), i la D3 es
   manté: ni /tractors ni /gestoria (gestoria/privacitat.test.js). Derogat:
   «cap categoria ni ítem de les eines locals» i «un ?item= d'una eina no
   pinta res».
   Revisió adversarial del bloc B (Guarda Nocturna 261027) · Proves
   actualitzades a propòsit: T51 («Cap document existeix sense data»), la
   pastilla de la barra taronja porta la data del text de la porta i dels
   Sentinelles (DATA_DOCUMENTACIO), i el BIOS, sense data a AGENTS.md, cap;
   el subtítol dels Sentinelles ja no convida a aprovar; la porta diu què fa
   cada tractor; i els títols del BIOS ixen en h3 davall de l'H2 de la pàgina,
   sense saltar-se cap esglaó. Derogat: «la mateixa capçalera que l'eina»
   (subtítol inclòs) i «els títols del BIOS ixen com al panell dels Agents». */
import React from 'react';
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

const fixture = vi.hoisted(() => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('PROD', true);
  return { itemId: 'gestoria_panell', search: '?item=gestoria_panell', props: null, sessio: null };
});
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => fixture.sessio,
}));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: (props) => {
    fixture.props = props;
    const { model, renderDetail, className } = props;
    return <div className={className}>{renderDetail({ item: model.items.find(item => item.id === fixture.itemId) })}</div>;
  }
}));
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: fixture.search }), Link: 'a',
  Navigate: () => { throw new Error('La Wiki no redirigix cap URL d’una eina.'); }
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => <p>Doble de la Consola</p> }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
vi.mock('../tractors/PanellAgents.jsx', () => ({ default: () => <p>Doble dels Agents</p> }));
/* Sondes: la Wiki ja no les importa (ordre del Mestre, 261004); si ho tornara a fer, es veurien. */
vi.mock('../gestoria/tauler/ShellGestoria.jsx', () => ({ default: () => <p>Doble de la Gestoria</p> }));
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));

import WikiDePobleSection, {
  DATA_DOCUMENTACIO, TIPUS_DOCUMENTACIO, documentacioMaquinariaActiva, modulsLocalsActius
} from './WikiDePobleSection.jsx';
import { AVIS_NOMES_EN_LOCAL } from './documentacioMaquinaria.js';
import { ICONES_ITEMS_WIKI } from './iconesWiki.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { PAGE_COPY } from '../text/pageContent';

afterEach(() => {
  cleanup();
  fixture.sessio = null;
  fixture.itemId = 'gestoria_panell';
  fixture.search = '?item=gestoria_panell';
});
afterAll(() => vi.unstubAllEnvs());

/* Les tres peces, amb la capçalera que tenen les eines en desenvolupament
   (modulsLocalsActius és pura: es pot cridar amb DEV cert també ací). */
const DE_LES_EINES = modulsLocalsActius({ DEV: true }).items;
const DOCUMENTACIO = DE_LES_EINES.map((eina) => eina.id);
/* Les fitxes de la documentació (pura, com modulsLocalsActius). */
const DOCS = documentacioMaquinariaActiva({ DEV: false }).items;
const SUBTITOL_SENTINELLES = 'Els set sentinelles d’autonomia: què observen i com s’aproven';
/* La pastilla de la barra taronja: [hora, dia]. */
const pastilla = (arrel) => [...(arrel.querySelector('.bar-orange .btn-date-time')?.querySelectorAll('span') || [])].map((s) => s.textContent);
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')]
  .map((li) => [li.textContent, li.className.replace('sp-card-label ', '')]);
/* Cap botó de les eines: aprovar, revocar, oblidar, exportar, copiar l'empremta, aprovar-los tots. */
const BOTONS_DE_LES_EINES = /^(?:Aprova esta versió|Revoca|Oblida les aprovacions|Exporta el registre|Copia l’empremta curta|Aprovar tots els pendents)/;

test('l’entorn de la prova és el de producció', () => {
  expect(import.meta.env.DEV).toBe(false);
  expect(DOCUMENTACIO).toEqual(['tractors_aprovacio', 'sentinelles_panell', 'agents_panell']);
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Proves actualitzades a
   propòsit: la Consola incrustada és de tothom (maquinaria.js), també sense
   sessió; les eines amb botons, no (cap ítem ni cap panell fora de DEV).
   Derogat: «sense superadmin, ni la Consola». */
test('sense superadmin: la Maquinària de la IAIA amb la Consola i la documentació de les tres peces, i cap eina', () => {
  const esperat = () => {
    expect(fixture.props.model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'maquinaria_cat']);
    expect(fixture.props.model.items.map((i) => i.id)).toEqual(['__intro', 'consola_termodinamica', ...DOCUMENTACIO]);
  };
  render(<WikiDePobleSection />);
  esperat();
  /* La mateixa fitxa que l'eina (id, títol, entradilla, etiquetes i emoji),
     dins de la Maquinària, amb el tipus de la documentació. El subtítol, el
     de l'eina, menys el dels Sentinelles, que ja no convida a aprovar. */
  const docs = fixture.props.model.items.filter((i) => i.categoryId === 'maquinaria_cat' && i.id !== 'consola_termodinamica');
  expect(docs.map((d) => [d.id, d.title, d.lead, d.tags, d.icon]))
    .toEqual(DE_LES_EINES.map((e) => [e.id, e.title, e.lead, e.tags, ICONES_ITEMS_WIKI[e.id]]));
  expect(docs.map((d) => d.subtitle))
    .toEqual(DE_LES_EINES.map((e) => (e.id === 'sentinelles_panell' ? SUBTITOL_SENTINELLES : e.subtitle)));
  // T51 · La data del text a la fitxa; el BIOS, sense.
  expect(docs.map((d) => d.attributes.date))
    .toEqual([DATA_DOCUMENTACIO.tractors_aprovacio, DATA_DOCUMENTACIO.sentinelles_panell, undefined]);
  for (const doc of docs) {
    expect(doc, doc.id).toMatchObject({ categoryIds: ['maquinaria_cat'], attributes: { type: TIPUS_DOCUMENTACIO, author: 'Sistema' }, content: '' });
  }
  /* Una sessió que no és superadmin, o un valor que no és un true: igual, amb la Consola. */
  for (const sessio of [{ esSuperadmin: false }, { esSuperadmin: 'true' }, { rol: 'veí' }]) {
    cleanup();
    fixture.sessio = sessio;
    render(<WikiDePobleSection />);
    esperat();
  }
});

test('Bloc 3.4 · amb superadmin, la Consola encapçala la Maquinària; darrere, la documentació, i cap eina', () => {
  fixture.sessio = { esSuperadmin: true };
  render(<WikiDePobleSection />);
  const { model } = fixture.props;
  expect(model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'maquinaria_cat']);
  expect(model.items.map((i) => i.id)).toEqual(['__intro', 'consola_termodinamica', ...DOCUMENTACIO]);
  expect(model.items.filter((i) => i.categoryId === 'maquinaria_cat').map((i) => i.attributes.type))
    .toEqual(['Eina Interactiva', TIPUS_DOCUMENTACIO, TIPUS_DOCUMENTACIO, TIPUS_DOCUMENTACIO]);
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Prova actualitzada a
   propòsit: l'enllaç de la Consola la pinta a qualsevol visitant, sense
   sessió o amb una sessió que no és superadmin, i sense cap eina.
   Derogat: «una URL vella amb ?item=consola_termodinamica no pinta la
   Consola a qui no és superadmin» (Bloc 3.4). */
test('l’enllaç ?item=consola_termodinamica pinta la Consola també a qui no té sessió ni és superadmin', async () => {
  for (const sessio of [null, { esSuperadmin: false }]) {
    cleanup();
    fixture.sessio = sessio;
    fixture.itemId = 'consola_termodinamica';
    fixture.search = '?categoria=maquinaria_cat&item=consola_termodinamica';
    const arrel = render(<WikiDePobleSection />).container;
    expect(await screen.findByText('Doble de la Consola')).toBeTruthy();
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.consola.title);
    expect(fixture.props.model.items.map((i) => i.id)).toContain('consola_termodinamica');
    expect(fixture.props.selection.categoryId).toBe('maquinaria_cat');
    expect(screen.queryByText(/^Doble (dels|d’|de la Gestoria)/)).toBeNull();
  }
});

test('una URL vella de la Gestoria no la pinta: l’ítem no existix i es veu la portada', async () => {
  for (const id of ['gestoria_panell', 'gestoria_aprendre']) {
    fixture.itemId = id;
    fixture.search = `?item=${id}`;
    const arrel = render(<WikiDePobleSection />).container;
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.wikidepoble.title);
    cleanup();
  }
  await Promise.resolve();
  expect(screen.queryByText(/^Doble /)).toBeNull();
});

describe('Pla 261027_0845 · la documentació de cada peça, amb la seua adreça de sempre i sense cap acció', () => {
  const obri = (id) => {
    fixture.itemId = id;
    fixture.search = `?categoria=maquinaria_cat&item=${id}`;
    return render(<WikiDePobleSection />).container;
  };

  test.each(DOCS.map((d) => [d.id, d]))('%s: la capçalera de la documentació, la píndola de la documentació i cap panell', async (id, eina) => {
    const arrel = obri(id);
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(eina.title);
    expect(arrel.querySelector('.page-intro h2').textContent).toBe(eina.subtitle);
    if (eina.lead) expect(arrel.querySelector('.page-intro p.lead').textContent).toBe(eina.lead);
    expect(pindoles(arrel)).toEqual([
      ['WIKI DE POBLE', 'sdp-badge-system'],
      [TIPUS_DOCUMENTACIO, 'sdp-badge-category'],
      [eina.tags[0], 'sdp-badge-tag']
    ]);
    expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
    const cos = await screen.findByText((_, el) => el?.classList?.contains('sdp-prose--encoixinada') && el.textContent.length > 200);
    expect(cos.closest('.sdp-tractors-panell')).not.toBeNull();
    expect(arrel.querySelectorAll('h1')).toHaveLength(1);
    // Cap panell de desenvolupament (els dobles ho dirien) i cap botó de les eines.
    expect(screen.queryByText(/^Doble /)).toBeNull();
    expect(screen.queryAllByRole('button').map((b) => b.textContent).filter((t) => BOTONS_DE_LES_EINES.test(t))).toEqual([]);
    expect(arrel.querySelector('.sdp-tractors-panell button, .sdp-tractors-panell input, .sdp-tractors-panell dialog')).toBeNull();
  });

  /* T51 · La pastilla de la barra taronja, amb la data i l'hora del text; el
     BIOS no en porta (AGENTS.md no té data: deute de DADES), i mai la d'ara. */
  test.each(['tractors_aprovacio', 'sentinelles_panell'])('T51 · %s: la pastilla porta la data i l’hora del text', (id) => {
    const arrel = obri(id);
    const { time, date } = dataHoraDeBarra({ creat: DATA_DOCUMENTACIO[id] });
    expect(time).not.toBe('');
    expect(date).toBe('27/10/26');
    expect(pastilla(arrel)).toEqual([time, date]);
  });

  test('T51 · agents_panell: sense cap data a AGENTS.md, cap pastilla (mai la d’ara)', () => {
    const arrel = obri('agents_panell');
    expect(arrel.querySelector('.bar-orange')).not.toBeNull();
    expect(arrel.querySelector('.btn-date-time')).toBeNull();
  });

  test.each([
    ['tractors_aprovacio', ['Per què hi ha una porta', 'Què fa cada tractor', 'L’empremta', 'Com s’aprova', 'Els estats', 'On es guarda']],
    ['sentinelles_panell', ['Què fa un sentinella', 'La mateixa porta', 'Els set sentinelles']]
  ])('%s: l’avís que les accions només funcionen en local, i la documentació en H3', async (id, titols) => {
    const arrel = obri(id);
    const avis = (await screen.findByText(AVIS_NOMES_EN_LOCAL.titol)).closest('.sdp-alerta');
    expect(avis.className).toBe('sdp-alerta sdp-alerta--info');
    // Una explicació, no una regió viva.
    expect(avis.getAttribute('role')).toBeNull();
    expect(within(avis).getByText(AVIS_NOMES_EN_LOCAL.text)).toBeTruthy();
    expect(AVIS_NOMES_EN_LOCAL.text).toMatch(/només funciona al servidor local de desenvolupament/);
    const panell = arrel.querySelector('.sdp-tractors-panell');
    expect(panell.firstElementChild).toBe(avis);
    expect([...panell.querySelectorAll('.sdp-prose h3')].map((h) => h.textContent)).toEqual(titols);
    expect(panell.querySelectorAll('.sdp-prose h1, .sdp-prose h2')).toHaveLength(0);
  });

  /* Els títols del BIOS: cada «## » d'AGENTS.md, un h3 davall de l'H2 de la
     pàgina, i el «### », un h4, sense saltar-se cap esglaó (el text, el del
     panell dels Agents: DocumentacioMaquinaria.test.jsx en compara l'HTML). */
  test('agents_panell: el BIOS sencer (AGENTS.md), de lectura i sense avís, perquè no té cap acció ni en local', async () => {
    const arrel = obri('agents_panell');
    await screen.findByText(/UN SOL CERVELL/);
    const panell = arrel.querySelector('.sdp-tractors-panell');
    expect(panell.querySelector('.sdp-alerta')).toBeNull();
    const titols = [...panell.querySelectorAll('.sdp-prose h3, .sdp-prose h4, .sdp-prose h5, .sdp-prose h6')];
    expect(titols.length).toBeGreaterThan(5);
    expect(titols[0].tagName).toBe('H3');
    expect(titols.find((h) => /REGLA 0/.test(h.textContent))?.tagName).toBe('H3');
    expect(titols.find((h) => /UN SOL CERVELL/.test(h.textContent))?.tagName).toBe('H3');
    // Cap esglaó saltat: cada títol baixa com a molt un nivell respecte de l'anterior.
    const nivells = titols.map((h) => Number(h.tagName.slice(1)));
    expect(nivells.filter((n, i) => i > 0 && n > nivells[i - 1] + 1)).toEqual([]);
    expect(panell.querySelectorAll('.sdp-prose h1, .sdp-prose h2')).toHaveLength(0);
    // L'H1 d'AGENTS.md no es repetix: el títol és el de la pàgina.
    expect(arrel.querySelectorAll('h1')).toHaveLength(1);
  });
});

/* Pla 261028_1526 (P1-61, Fase 2) · WikiDetail registra el seu <head> amb
   useSEO, que necessita UIProvider. Els contractes visuals d'esta suite són
   independents del head: el real té la seua suite (WikiDePobleSection.seo.test.jsx). */
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
