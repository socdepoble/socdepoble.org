/* Onada R14 · El receptari «Què dinem?»: /page/receptes (ReceptesQueDinemSection) i /receptes/:slug
   (ReceptaDetailSection, pel comodí d'ItemDetailSection i el seu tros diferit). Es pinta amb les dades literals del
   llibre, els recomptes ixen de les dades, el quadrat de la targeta és un botó que obri la recepta, els quadrats del
   detall filtren amb aria-pressed, un slug que no existix dona el «no trobat» canònic i cap text inventat arriba al
   DOM (al·lèrgens, escandall, preus, comensals, sinònims ni noms que el llibre no porta). */
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM, RECOMPTES_QUE_DINEM, laminaDeRecepta, liniesIngredients } from '../../data/patrimoni/queDinem.js';
import { fixaTraductorLliure } from '../../data/traductorDelLloc.js';
import { PAGINES_PATRIMONI_R14 } from '../text/pageContent.patrimoniR14.js';
import ReceptesQueDinemSection from './ReceptesQueDinemSection.jsx';
import ItemDetailSection from '../detail/ItemDetailSection.jsx';
import { filtraReceptes, normalitzaCerca } from './cercaReceptes.js';

const m = vi.hoisted(() => ({ dic: null, seo: [] }));
vi.mock('../../app/contexts/UIContext', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ({ t: (clau, reserva) => (m.dic && Object.hasOwn(m.dic, clau) ? m.dic[clau] : reserva), language: 'ca' })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: (dades) => { m.seo.push(dades); } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); m.dic = null; m.seo = []; });

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
/* El que el kit afegia per damunt del llibre i que no pot arribar ni a les dades ni a la interfície. */
const PROHIBIT = /cap dels 14|\btraces\b|escandall|\bKM ?0\b|\bPVP\b|La Parr[òo]quia|Cooperativa|comensals|escalador|NanoBanana|pebrass|Segellat|Cascant|\bPep\b|mas[i]a|lliure de|sense gluten/i;

function Ubicacio() {
  const { pathname } = useLocation();
  return <span data-testid="ubicacio">{pathname}</span>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const llista = () => render(
  <MemoryRouter rutaInicial="/page/receptes">
    <Routes>
      <Route path="/page/receptes" element={<ReceptesQueDinemSection />} />
      <Route path="/receptes/:itemId" element={<p>detall</p>} />
    </Routes>
    <Ubicacio />
  </MemoryRouter>
);

const detall = (slug) => render(
  <MemoryRouter rutaInicial={`/receptes/${slug}`}>
    <Routes>
      <Route path="/page/receptes" element={<p>llista</p>} />
      <Route path="/:sectionId/:itemId" element={<ItemDetailSection />} />
    </Routes>
    <Ubicacio />
  </MemoryRouter>
);

const ambVideoILamina = RECEPTES_QUE_DINEM.find((r) => r.youtubeId && r.lamina && r.notes.length > 0);
const senseVideoNiNotes = RECEPTES_QUE_DINEM.find((r) => !r.youtubeId && r.lamina && r.notes.length === 0);
const senseLamina = RECEPTES_QUE_DINEM.find((r) => !r.lamina);

describe('/page/receptes · ReceptesQueDinemSection', () => {
  test('els recomptes ixen de les dades i la cerca i el filtre són locals', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { container } = llista();
    const total = RECEPTES_QUE_DINEM.length;
    expect(total).toBe(149);
    expect(screen.getByRole('heading', { level: 3, name: `Les ${total} receptes del llibre` })).toBeTruthy();
    expect(container.textContent).toContain(`${RECOMPTES_QUE_DINEM.receptesAmbVideo} tenen vídeo i ${RECEPTES_QUE_DINEM.filter((r) => r.lamina).length} porten la làmina del llibre.`);
    expect(screen.getByRole('status').textContent).toBe(`${total} de ${total}`);
    expect(container.querySelectorAll('.sdp-card-grid > article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra’n més' }));
    expect(container.querySelectorAll('.sdp-card-grid > article')).toHaveLength(48);
    // El filtre per apartat: l'agrupació de l'índex del llibre, amb el recompte de cada una.
    const opcions = within(screen.getByRole('combobox')).getAllByRole('option').map((o) => o.textContent);
    expect(opcions).toEqual([
      `Tots els apartats (${total})`,
      ...OBRA_QUE_DINEM.apartats.map((a) => `${{ entrades: 'Entrades', plats: 'Plats', postres: 'Postres i pastes', licors: 'Licors' }[a.id]} (${RECOMPTES_QUE_DINEM.perApartat[a.id]})`)
    ]);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'licors' } });
    expect(screen.getByRole('status').textContent).toBe(`${RECOMPTES_QUE_DINEM.perApartat.licors} de ${total}`);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    // La cerca: títol o ingredient, sense accents ni distinció entre «l·l» i «l.l».
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'OLLETA MURERA' } });
    expect(screen.getByRole('status').textContent).toBe(`1 de ${total}`);
    expect(screen.getByRole('heading', { name: 'Olleta murera' }).getAttribute('lang')).toBe('ca');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-hi-ha-cap-recepta-aixi' } });
    expect(screen.getByText('No hi ha cap resultat amb esta cerca.')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('la cerca normalitza accents i la ela geminada, i busca als ingredients', () => {
    expect(normalitzaCerca('Col·loqueu ÀÉÍ')).toBe('colloqueu aei');
    expect(normalitzaCerca('col.loqueu')).toBe('colloqueu');
    const herbero = RECEPTES_QUE_DINEM.find((r) => r.slug === 'herbero');
    expect(liniesIngredients(herbero).join(' ')).toContain('cristal.litzar');
    expect(filtraReceptes('', 'cristal·litzar').map((r) => r.slug)).toContain('herbero');
    expect(filtraReceptes('licors', '').every((r) => r.apartat === 'licors')).toBe(true);
    expect(filtraReceptes('', '')).toHaveLength(RECEPTES_QUE_DINEM.length);
  });

  test('cada targeta: la làmina, l’enllaç a la recepta i el quadrat-botó que l’obri', () => {
    const { container } = llista();
    const primera = RECEPTES_QUE_DINEM[0];
    const targeta = container.querySelector('.sdp-card-grid > article');
    expect(targeta.querySelector('img').getAttribute('src')).toBe(primera.lamina);
    expect(targeta.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe(`/receptes/${primera.slug}`);
    const quadrat = within(targeta).getByRole('button', { name: new RegExp(`^Obri la recepta ${primera.numero}: ${primera.titol}`) });
    expect(quadrat.className).toContain('sp-card-calendar-badge');
    expect(quadrat.textContent).toContain('🍲 RECEPTA');
    expect(quadrat.textContent).toContain(String(primera.numero));
    fireEvent.click(quadrat);
    expect(ubicacio()).toBe(`/receptes/${primera.slug}`);
  });

  test('el quadrat diu «▶ VÍDEO» només a les receptes que en tenen', () => {
    const { container } = llista();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ambVideoILamina.titol } });
    const ambVideo = within(container.querySelector('.sdp-card-grid')).getByRole('button', { name: new RegExp(`^Obri la recepta ${ambVideoILamina.numero}:`) });
    expect(ambVideo.getAttribute('aria-label')).toMatch(/\(amb vídeo\)$/);
    expect(ambVideo.textContent).toContain('▶ VÍDEO');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: senseVideoNiNotes.titol } });
    const sense = within(container.querySelector('.sdp-card-grid')).getByRole('button', { name: new RegExp(`^Obri la recepta ${senseVideoNiNotes.numero}:`) });
    expect(sense.textContent).not.toContain('VÍDEO');
  });

  test('crèdits de l’obra i PDF descarregable', () => {
    const { container } = llista();
    const pdf = screen.getByRole('link', { name: 'Descarrega el llibre sencer (PDF, 7,6 MB)' });
    expect(pdf.getAttribute('href')).toBe('/assets/uploads/patrimoni/que-dinem/llibre-que-dinem.pdf');
    expect(pdf.hasAttribute('download')).toBe(true);
    expect(container.textContent).toContain('Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»');
    expect(container.textContent).toContain('A 373-2019');
    expect(container.textContent).toContain(OBRA_QUE_DINEM.isbnImpres);
    expect(container.textContent).toContain('Text i làmines amb permís d’ús.');
    expect(container.textContent).toContain('Del canal «Sangonereta Gastronomia», a YouTube');
  });

  test('el botó del PDF diu la mida del fitxer; dins de l’app nativa no hi ha <a download> i es diu on es descarrega', () => {
    expect(OBRA_QUE_DINEM.pdfBytes).toBe(7560366);
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const { container } = llista();
    expect(container.querySelector('a[download]')).toBeNull();
    expect(container.textContent).toContain('Dins de l’app el llibre en PDF (7,6 MB) no es pot desar a les descàrregues: descarrega’l des de socdepoble.org.');
  });

  test('en castellà canvia la interfície i el text del llibre es queda en l’original amb lang="ca"', () => {
    m.dic = ES;
    const { container } = llista();
    expect(screen.getByRole('heading', { level: 3, name: `Las ${RECEPTES_QUE_DINEM.length} recetas del libro` })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Descarga el libro completo (PDF, 7,6 MB)' })).toBeTruthy();
    const titol = container.querySelector('.sdp-card-grid > article .sp-card-title');
    expect(titol.textContent).toBe(RECEPTES_QUE_DINEM[0].titol);
    expect(titol.getAttribute('lang')).toBe('ca');
  });

  /* Onada R15 (P3-6) · «El botó Traduir en dona una traducció automàtica» era fals a l'app nativa, on el botó diu que
     no està disponible. La frase segueix el mateix criteri que el botó (traduccioDePaginesDisponible): sense servei
     ni transport lliure (l'app nativa no en fixa cap), diu que no n'hi ha; al web propi (main.jsx fixa Apertium), sí. */
  test('la frase de Traduir diu el que fa el botó, al web i a l’app nativa', () => {
    const { container, unmount } = llista();
    expect(container.textContent).toContain('Ací la traducció automàtica no està disponible.');
    expect(container.textContent).not.toContain('El botó Traduir');
    unmount();
    fixaTraductorLliure('apertium');
    try {
      const web = llista();
      expect(web.container.textContent).toContain('El botó Traduir en dona una traducció automàtica.');
      expect(web.container.textContent).not.toContain('no està disponible');
    } finally {
      fixaTraductorLliure(null);
    }
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      // La frase literal ja no parla de Traduir: ho diu la clau que tria el criteri del botó.
      expect(dic['patrimoni.receptes.literal'], llengua).not.toMatch(/Tradu|Translate|Itzulpen/);
    }
  });

  /* Onada R15 (P3-2) · El lead i el cos de /page/receptes deien «cada recepta amb … la làmina del llibre», però la 126
     no en té (148 de 149), i no totes porten notes. En les cinc llengües, la làmina, les notes i el vídeo van «quan en té». */
  test('el lead i el cos no diuen que cada recepta porte làmina ni notes, en les cinc llengües', () => {
    expect(RECOMPTES_QUE_DINEM.lamines).toBeLessThan(RECOMPTES_QUE_DINEM.receptes);
    expect(RECEPTES_QUE_DINEM.some((r) => r.notes.length === 0)).toBe(true);
    const pagina = PAGINES_PATRIMONI_R14.receptes;
    const TEXTOS = {
      ca: [pagina, 'i, quan en té, la làmina del llibre i el vídeo', 'i, si en té, les <strong>notes</strong>, la <strong>làmina</strong> i el <strong>vídeo</strong>', /amb la seua <strong>làmina<|l’elaboració i la làmina del llibre/],
      es: [pagina.translations.es, 'y, cuando los tiene, la lámina del libro y el vídeo', 'y, si los tiene, las <strong>notas</strong>, la <strong>lámina</strong> y el <strong>vídeo</strong>', /con su <strong>lámina<|la elaboración y la lámina del libro/],
      en: [pagina.translations.en, 'and, when it has them, the plate from the book and the video', 'and, if it has them, the <strong>notes</strong>, the <strong>plate</strong> and the <strong>video</strong>', /with its <strong>plate<|the method and the plate from the book/],
      eu: [pagina.translations.eu, 'eta, baldin baditu, liburuko irudiarekin eta elkartearen kanaleko bideoarekin', 'eta, baldin baditu, <strong>oharrak</strong>, <strong>irudia</strong> eta <strong>bideoa</strong>', /bere <strong>irudiarekin<|prestaketarekin eta liburuko irudiarekin/],
      gl: [pagina.translations.gl, 'e, cando os ten, a lámina do libro e o vídeo', 'e, se os ten, as <strong>notas</strong>, a <strong>lámina</strong> e o <strong>vídeo</strong>', /coa súa <strong>lámina<|a elaboración e a lámina do libro/]
    };
    for (const [llengua, [p, lead, cos, vell]] of Object.entries(TEXTOS)) {
      expect([llengua, p.lead.includes(lead), p.html.includes(cos)]).toEqual([llengua, true, true]);
      expect([llengua, vell.test(p.lead) || vell.test(p.html)]).toEqual([llengua, false]);
    }
  });

  test('cap text prohibit al DOM de la llista sencera', () => {
    const { container } = llista();
    while (screen.queryByRole('button', { name: 'Mostra’n més' })) fireEvent.click(screen.getByRole('button', { name: 'Mostra’n més' }));
    expect(container.querySelectorAll('.sdp-card-grid > article')).toHaveLength(RECEPTES_QUE_DINEM.length);
    expect(container.textContent).not.toMatch(PROHIBIT);
  });
});

describe('/receptes/:slug · ReceptaDetailSection', () => {
  test('capçalera amb la làmina com a hero, el vídeo en el seu bloc amb la façana i text literal amb lang="ca"', async () => {
    const r = ambVideoILamina;
    const { container } = detall(r.slug);
    const h1 = await screen.findByRole('heading', { level: 1, name: r.titol });
    expect(h1).toBeTruthy();
    expect(m.seo.at(-1)).toMatchObject({ title: `${r.titol} · ${OBRA_QUE_DINEM.titol}`, index: true });
    // Onada R15 (P3-4 i LCP) · La làmina és la capçalera: candidata a LCP, amb les mides de la WebP i demanada de seguida.
    const img = container.querySelector('.sdp-recepta__capcalera img');
    const lamina = laminaDeRecepta(r);
    expect(img.getAttribute('src')).toBe(r.lamina);
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual([String(lamina.ample), String(lamina.alt)]);
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
    // El vídeo, en el seu bloc: la façana de VideoEditorial i cap iframe abans del clic. Cap commutador.
    expect(container.querySelector('section[data-bloc="video"] .video-editorial__facana')).toBeTruthy();
    expect(container.querySelector('.sdp-recepta__capcalera .video-editorial__facana')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Què vols vore a dalt?' })).toBeNull();
    // Text literal del llibre, en blocs amb lang="ca".
    const ingredients = container.querySelector('section[data-bloc="ingredients"]');
    expect([...ingredients.querySelectorAll('ul[lang="ca"] > li')].map((li) => li.textContent)).toEqual(liniesIngredients(r));
    const notes = container.querySelector('section[data-bloc="notes"] ul');
    expect(notes.getAttribute('lang')).toBe('ca');
    expect([...notes.querySelectorAll('li')].map((li) => li.textContent)).toEqual([...r.notes]);
    expect(screen.getByRole('link', { name: 'Totes les receptes' }).getAttribute('href')).toBe('/page/receptes');
    expect(screen.getByRole('link', { name: 'Descarrega el llibre sencer (PDF, 7,6 MB)' }).getAttribute('href')).toBe(OBRA_QUE_DINEM.pdf);
  });

  test('els quadrats-botó filtren amb aria-pressed: un sol bloc, i tornar-lo a prémer ho mostra tot', async () => {
    const r = ambVideoILamina;
    const { container } = detall(r.slug);
    const grup = await screen.findByRole('group', { name: 'Tria què vols vore' });
    const quadrats = within(grup).getAllByRole('button');
    expect(quadrats.map((b) => b.textContent)).toEqual(['🧺Ingredients', '🥘Elaboració', '📝Notes', '▶️Vídeo', '🖼️Làmina', '⚠️Al·lèrgens']);
    expect(quadrats.every((b) => b.getAttribute('aria-pressed') === 'false' && b.className.includes('sp-card-calendar-badge'))).toBe(true);
    const blocs = () => [...container.querySelectorAll('section[data-bloc]')].map((s) => s.dataset.bloc);
    expect(blocs()).toEqual(['ingredients', 'elaboracio', 'notes', 'video', 'alergens']);
    const ingredients = within(grup).getByRole('button', { name: 'Ingredients' });
    fireEvent.click(ingredients);
    expect(ingredients.getAttribute('aria-pressed')).toBe('true');
    expect(blocs()).toEqual(['ingredients']);
    expect(container.querySelector('.sdp-recepta__capcalera')).toBeNull();
    fireEvent.click(ingredients);
    expect(ingredients.getAttribute('aria-pressed')).toBe('false');
    expect(blocs()).toEqual(['ingredients', 'elaboracio', 'notes', 'video', 'alergens']);
    // Al·lèrgens: només l'avís honest.
    fireEvent.click(within(grup).getByRole('button', { name: 'Al·lèrgens' }));
    expect(blocs()).toEqual(['alergens']);
    expect(container.querySelector('section[data-bloc="alergens"]').textContent)
      .toContain('Al·lèrgens no revisats: consulta la llista d’ingredients; si tens una al·lèrgia, pregunta-ho a qui cuina.');
    // Vídeo: només el bloc del vídeo (la façana, sense la làmina); Làmina: només la làmina de capçalera.
    fireEvent.click(within(grup).getByRole('button', { name: 'Vídeo' }));
    expect(blocs()).toEqual(['video']);
    expect(container.querySelector('section[data-bloc="video"] .video-editorial__facana')).toBeTruthy();
    expect(container.querySelector('.sdp-recepta__capcalera')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(within(grup).getByRole('button', { name: 'Làmina' }));
    expect(blocs()).toEqual([]);
    expect(container.querySelector('.sdp-recepta__capcalera img')).toBeTruthy();
    expect(within(grup).getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)).toEqual(['🖼️Làmina']);
  });

  /* Onada R15 (P3-4) · Abans hi havia dos botons «Vídeo»: el quadrat i el del commutador de la capçalera. Ara n'hi ha un,
     el quadrat; i el vídeo només es carrega (iframe de youtube-nocookie) quan el veí prem «Veure el vídeo» a la façana. */
  test('un sol botó «Vídeo», i el vídeo només es carrega quan el veí ho demana', async () => {
    const r = ambVideoILamina;
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { container } = detall(r.slug);
    await screen.findByRole('group', { name: 'Tria què vols vore' });
    expect(screen.getAllByRole('button', { name: /^Vídeo$/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Làmina del llibre/ })).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    const facana = container.querySelector('section[data-bloc="video"]');
    fireEvent.click(within(facana).getByRole('button', { name: /^Veure el vídeo/ }));
    const iframe = container.querySelector('section[data-bloc="video"] iframe');
    expect(iframe.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${r.youtubeId}`);
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  /* Onada R15 (P3-1) · El text alternatiu de la làmina diu la pàgina on és impresa, que no sempre és la primera de la
     recepta: l'olla de carn (la 79, p. 88-89) té la làmina a la p. 89 i els cocotets (la 115, p. 126-127), a la p. 127. */
  test.each([[79, 89], [115, 127]])('la làmina de la recepta %i porta la pàgina %i al text alternatiu, al detall i a la llista', async (numero, pagina) => {
    const r = RECEPTES_QUE_DINEM[numero - 1];
    expect(r.pagina).not.toBe(pagina);
    expect(laminaDeRecepta(r).pagina).toBe(pagina);
    const { container, unmount } = detall(r.slug);
    await screen.findByRole('group', { name: 'Tria què vols vore' });
    expect(container.querySelector('.sdp-recepta__capcalera img').getAttribute('alt')).toBe(`Làmina de la pàgina ${pagina} del llibre`);
    unmount();
    const vista = llista();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: r.titol } });
    const targeta = [...vista.container.querySelectorAll('.sdp-card-grid > article')].find((a) => a.querySelector('.sp-card-title')?.textContent === r.titol);
    expect(targeta.querySelector('img').getAttribute('alt')).toBe(`Làmina de la pàgina ${pagina} del llibre`);
  });

  test('sense vídeo ni notes: la làmina com a hero, cap commutador i cap quadrat de vídeo ni de notes', async () => {
    const r = senseVideoNiNotes;
    const { container } = detall(r.slug);
    const grup = await screen.findByRole('group', { name: 'Tria què vols vore' });
    expect(within(grup).getAllByRole('button').map((b) => b.dataset.bloc)).toEqual(['ingredients', 'elaboracio', 'lamina', 'alergens']);
    expect(container.querySelector('.sdp-recepta__capcalera img').getAttribute('src')).toBe(r.lamina);
    expect(container.querySelector('section[data-bloc="video"]')).toBeNull();
    expect(container.querySelector('.video-editorial__facana')).toBeNull();
  });

  test('una recepta sense làmina no en pinta cap ni té el quadrat', async () => {
    const { container } = detall(senseLamina.slug);
    const grup = await screen.findByRole('group', { name: 'Tria què vols vore' });
    expect(within(grup).getAllByRole('button').map((b) => b.dataset.bloc)).not.toContain('lamina');
    expect(container.querySelector('.sdp-recepta__capcalera img')).toBeNull();
    // La 126 té vídeo: la façana va en el seu bloc, sense cap capçalera ni iframe.
    expect(senseLamina.youtubeId).toBeTruthy();
    expect(container.querySelector('.sdp-recepta__capcalera')).toBeNull();
    expect(container.querySelector('section[data-bloc="video"] .video-editorial__facana')).toBeTruthy();
    expect(container.querySelector('iframe')).toBeNull();
  });

  test.each(['no-existix', 'olleta', 'constructor', '__proto__', 'Olleta-murera'])('slug inexistent «%s» → el «no trobat» canònic, mai una altra recepta', async (slug) => {
    const { container } = detall(slug);
    expect(await screen.findByRole('heading', { level: 1, name: 'Ací no hi ha res' })).toBeTruthy();
    expect(m.seo.at(-1)).toMatchObject({ index: false });
    expect(container.querySelector('.sdp-recepta')).toBeNull();
    for (const r of RECEPTES_QUE_DINEM.slice(0, 5)) expect(container.textContent).not.toContain(r.titol);
  });

  test('cap text prohibit al DOM de cap recepta ni a les dades, el copy o les claus', async () => {
    for (const r of [ambVideoILamina, senseVideoNiNotes, senseLamina]) {
      const { container, unmount } = detall(r.slug);
      await screen.findByRole('group', { name: 'Tria què vols vore' });
      expect(container.textContent).not.toMatch(PROHIBIT);
      unmount();
    }
    expect(JSON.stringify(RECEPTES_QUE_DINEM)).not.toMatch(PROHIBIT);
    expect(JSON.stringify(OBRA_QUE_DINEM)).not.toMatch(PROHIBIT);
    expect(JSON.stringify(PAGINES_PATRIMONI_R14)).not.toMatch(PROHIBIT);
    for (const dic of Object.values(DICCIONARIS)) {
      const claus = Object.keys(dic).filter((clau) => clau.startsWith('patrimoni.receptes.'));
      expect(claus.map((clau) => dic[clau]).join('\n')).not.toMatch(PROHIBIT);
    }
  });

  /* Onada R15 (P1-02, R15-REG-06) · El build públic (sense VITE_SDP_APP_NEVERA=1, fora de DEV) torna a ser el R14:
     la capa de compra amb Mercadona no hi és ni plegada. Una instància nova de la pàgina, amb l'entorn del build. */
  test('build públic sense la bandera de la Nevera: cap capa de compra i cap text prohibit', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_APP_NEVERA', undefined);
    const { default: Pagina } = await import(/* @vite-ignore */ './ReceptaDetailSection.jsx?publica-r14');
    for (const r of [ambVideoILamina, senseVideoNiNotes, senseLamina]) {
      const { container, unmount } = render(
        <MemoryRouter rutaInicial={`/receptes/${r.slug}`}>
          <Routes><Route path="/receptes/:itemId" element={<Pagina />} /></Routes>
        </MemoryRouter>
      );
      await screen.findByRole('group', { name: 'Tria què vols vore' });
      expect(screen.queryByRole('button', { name: 'Calcula i prepara la compra' })).toBeNull();
      expect(container.querySelector('[aria-label="Prepara una compra amb esta recepta"]')).toBeNull();
      expect(container.textContent).not.toMatch(PROHIBIT);
      expect(container.textContent).not.toMatch(/Mercadona/i);
      unmount();
    }
  });
});

/* Onada R15 (P3-3) · Amb 1rem, «Ingredientes» (es, gl) eixia del quadrat de 96 px (92 px útils): mesurat en Chrome amb
   la Noto Sans del repositori, 102,5 px a 16 px i 89,7 px a 14 px. L'etiqueta va al sòl de mida (--sdp-text-meta) i,
   si un dia no hi cap, parteix dins del quadrat. El quadrat no canvia de mida. */
describe('P3-3 · l’etiqueta del quadrat-botó cap dins del quadrat', () => {
  const css = readFileSync(`${process.cwd()}/src/css/modules.css`, 'utf8');
  const regla = (selector) => css.match(new RegExp(`\\n\\s*${selector.replace(/[.[\]"=]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';
  test('font al sòl de mida, amplada màxima del quadrat i partició dins', () => {
    const text = regla('.sdp-recepta__quadrat-text');
    expect(text).toMatch(/font-size: var\(--sdp-text-meta\);/);
    expect(text).toMatch(/max-width: 100%;/);
    expect(text).toMatch(/overflow-wrap: anywhere;/);
    expect(text).not.toMatch(/font-size: 1rem/);
    const quadrat = regla('.sdp-recepta__quadrats .sp-card-calendar-badge');
    expect(quadrat).toMatch(/width: 96px;/);
    expect(quadrat).toMatch(/height: 96px;/);
    expect(css).not.toContain('.sdp-recepta__commutador');
  });
});

describe('les claus de la interfície del receptari', () => {
  const FITXERS = ['ReceptesQueDinemSection.jsx', 'ReceptaDetailSection.jsx', 'CreditsQueDinem.jsx', 'cercaReceptes.js'];
  const crides = FITXERS.flatMap((fitxer) => [...readFileSync(`${process.cwd()}/src/sections/patrimoni/${fitxer}`, 'utf8')
    .matchAll(/tr\('(patrimoni\.[\w.-]+)', '([^']*)'/g)].map(([, clau, reserva]) => [clau, reserva]));
  test('cada clau usada és als 5 diccionaris i la reserva és el valor valencià', () => {
    expect(crides.length).toBeGreaterThan(35);
    for (const [clau, reserva] of crides) {
      expect([clau, CA[clau]]).toEqual([clau, reserva]);
      for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
        expect(typeof dic[clau] === 'string' && dic[clau].trim().length > 0, `${llengua}: ${clau}`).toBe(true);
      }
    }
  });
  test('cap clau patrimoni.receptes.* sense ús', () => {
    const usades = new Set(crides.map(([clau]) => clau));
    expect(Object.keys(CA).filter((clau) => clau.startsWith('patrimoni.receptes.') && !usades.has(clau))).toEqual([]);
  });
});
