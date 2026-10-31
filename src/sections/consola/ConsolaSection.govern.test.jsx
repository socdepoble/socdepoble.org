import React from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Pla 261016_1530, Onada 0.5 (Mandat Suprem: la Consola com a quadre de
   comandament del Mestre) · El Govern del Mestre a /consola, amb el router de
   veres i les targetes de veres: la secció del tauler (un H2 propi i quatre
   targetes damunt de les nou de la maquinària), les quatre pàgines
   /consola/govern/<id> (molla, contingut sense <pre> ni tipografia de
   màquina, peu de dades), l'estat buit honest quan govern.json no arriba,
   el fitxer obert en este navegador, la caducitat que no pinta mai de verd, el
   balanç amb el trasllat, la certificació on només s'afig i els resums en
   paraules planes.
   Pla 261027_0845 (Guarda Nocturna), §3 · La Consola incrustada de la Wiki
   pinta el mateix govern, amb el mateix cap que /consola, i el llig una sola
   vegada. Derogat: «La Consola incrustada de la Wiki no el pinta ni el llig».
   Només es falsegen les fonts, la sessió i el que no té res a vore (SEO,
   avisos, graf, la closca de la UniversalPage). */
const fonts = vi.hoisted(() => ({ govern: null, sessio: null }));
const seo = vi.hoisted(() => ({ crides: [] }));
const carregaGovern = vi.hoisted(() => ({ crides: 0 }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => fonts.sessio }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (args) => { seo.crides.push(args); } }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      {(subtitle || lead) && <div className="page-intro">{subtitle && <h2>{subtitle}</h2>}{lead && <p className="lead">{lead}</p>}</div>}
      {children}
    </main>
  )
}));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
vi.mock('./govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => { carregaGovern.crides += 1; return Promise.resolve(fonts.govern); }
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection, { ConsolaIncrustada } from './ConsolaSection.jsx';
import { CLAU_PRIVACITAT } from './consolaPagines.js';
import { IMATGES_CONSOLA } from './imatgesConsola.js';
import { LIMIT_DESCRIPCIO, LIMIT_TITOL, textPla } from '../../config/metadadesSocials.js';
import { normalitzaGovern } from './govern/governContent.js';
import { ETIQUETA_NAV_GOVERN, TITOL_GOVERN, TITOL_SALA_MAQUINES, paginesGovern } from './govern/governConsola.js';
import {
  TEXT_CERTIFICACIO_LOCAL, TEXT_CERTIFICACIO_PUBLICADA, TEXT_REGISTRE_PUBLICADA, TEXT_SENSE_MATRIU, TEXT_VERBS_PUBLICADA
} from './govern/GovernConsola.jsx';
import { TEXT_CERTIFICADA_SENSE_FET } from './govern/certificacions.js';

// Les empremtes de les files es calculen amb WebCrypto, com al navegador (https o localhost).
if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);

const HEAD = '7a1828ca779ef74284846c9e5a4122cd23945689';
const fila = (id, status, extra = {}) => ({
  id, source: '§0.5', requirement: `Requeriment ${id}`, status, evidence: 'Prova verda.',
  owner: 'Claude implementa; Codex verifica', priority: 'P2', acceptance: 'Prova del flux d’usuari.', ...extra
});
/* Una matriu de prova amb la forma de mcr.json de Codex, d'ara fa una hora. */
const MCR = (extra = {}) => ({
  at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  baseline_head: HEAD,
  scope: 'local-audit',
  statuses: { '[FET I SEGELLAT]': 1, '[PARCIAL]': 1, '[NO FET / PENDENT]': 2 },
  requirements: [
    fila('F04', '[FET I SEGELLAT]', {
      evidence: '[src/sections/profile/PerfilEditor.jsx:821](</Users/mestre/Som de Poble/socdepoble.org/src/sections/profile/PerfilEditor.jsx:821>) passa `ambDrets:false`.'
    }),
    fila('F01', '[PARCIAL]', { priority: 'P1' }),
    fila('I09', '[NO FET / PENDENT]', { priority: 'P1', owner: 'Claude implementa; Gemini arquitectura; Codex verifica' }),
    fila('G04', '[NO FET / PENDENT]', { owner: 'Codex' })
  ],
  ...extra
});
const delServidor = (extra = {}) => normalitzaGovern({ schema: 'sdp.govern.v1', head: HEAD, mcr: MCR(), trasllat: null, ...extra });

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  seo.crides = [];
  carregaGovern.crides = 0;
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  vi.restoreAllMocks();
  localStorage.clear();
  fonts.govern = null;
  fonts.sessio = null;
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
const seccio = () => screen.getByRole('region', { name: TITOL_GOVERN });
const navGovern = () => screen.getByRole('navigation', { name: ETIQUETA_NAV_GOVERN });
const peu = () => document.querySelector('.sdp-consola__peu');
const main = () => document.querySelector('main');
const metriques = (targeta) => [...targeta.querySelectorAll('.sdp-consola__metriques > h5')].map((h) => h.textContent);
const perTitol = (dins) => Object.fromEntries([...dins.querySelectorAll('article.sp-card')].map((t) => [t.querySelector('h3').textContent, t]));
const files = (taula) => [...taula.querySelectorAll('tbody > tr')].map((tr) => tr.querySelector('th').textContent);
/* La línia d'estat de cada selector de fitxers del peu (CampFitxer). */
const estatsDelsSelectors = () => [...peu().querySelectorAll('.sdp-camp-fitxer__estat')].map((p) => p.textContent);
/* Obri un fitxer amb el selector de Pedra Seca del peu, com ho faria el Mestre. */
async function obriFitxer(etiqueta, contingut, nom) {
  const input = screen.getByLabelText(etiqueta);
  const fitxer = new File([typeof contingut === 'string' ? contingut : JSON.stringify(contingut)], nom, { type: 'application/json' });
  await act(async () => { fireEvent.change(input, { target: { files: [fitxer] } }); });
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
/* Cap <pre>, cap <code>, cap tipografia de màquina dins de la pàgina del govern. */
function senseTipografiaDeMaquina() {
  expect(main().querySelectorAll('pre, code, .sdp-consola__mono, .sdp-consola__diagnosi-text')).toHaveLength(0);
}

describe('el tauler de /consola', () => {
  test('sense matriu: el Govern del Mestre és una secció pròpia damunt de les nou targetes, amb quatre targetes honestes', async () => {
    await obri('/consola');
    const s = seccio();
    expect(s.tagName).toBe('SECTION');
    // Darrere de la introducció i abans del tauler de la maquinària.
    expect(main().querySelector('.page-intro').nextElementSibling).toBe(s);
    const maquinaria = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
    expect(Boolean(s.compareDocumentPosition(maquinaria) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(s.contains(maquinaria)).toBe(false);
    expect([...s.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([TITOL_GOVERN]);
    /* Ordre del Mestre del 30-10-2026 (B1) · Expectativa actualitzada a
       propòsit: cada targeta del Govern porta la portada de la seua pàgina
       (la miniatura .webp d'imatgesConsola.js) al mitjà, i ja no la icona a la
       insígnia lateral. Abans: «sense imatge» (.sp-card-media-container nul). */
    const targetes = [...navGovern().querySelectorAll('article.sp-card')];
    expect(targetes).toHaveLength(4);
    expect(navGovern().className).toBe('sdp-card-grid sdp-consola__graella');
    for (const [i, t] of targetes.entries()) {
      const id = paginesGovern()[i].id;
      expect(t.className).toBe('sp-card sdp-consola__targeta');
      expect(t.querySelector(':scope > .sp-card-header .sp-card-author-name').textContent).toBe('Sóc de Poble');
      expect(t.querySelector('h4.sp-card-subtitle').textContent).toMatch(/^Per a /);
      const img = t.querySelector('.sp-card-media-container > img.sp-card-media');
      expect([img?.getAttribute('src'), img?.getAttribute('alt')], id)
        .toEqual([`/assets/nano_cards/govern_${id}_nano_card.webp`, IMATGES_CONSOLA[id].imatgeAlt]);
      expect(img.getAttribute('loading'), id).toBe('lazy');
      expect(t.querySelector('.sp-card-calendar-badge'), id).toBeNull();
      expect(t.querySelector('.sp-card-footer .sp-card-connect')).not.toBeNull();
    }
    expect([...navGovern().querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href')))
      .toEqual(paginesGovern().map((p) => p.ruta));
    // Sense matriu, cada una diu per què, i cap número inventat; la Certificació compta les decisions d'este navegador.
    const t = perTitol(navGovern());
    for (const titol of ['Estat dels requeriments', 'Balanç de la sessió', 'Comunicació amb les IAs']) {
      expect(t[titol].querySelector('.sdp-consola__dada').textContent, titol).toBe('Encara no hi ha cap matriu connectada');
      expect(metriques(t[titol]), titol).toEqual([]);
      expect(t[titol].querySelector('.sp-card-label').textContent, titol).toBe('Sense font');
    }
    expect(metriques(t['Certificació del Mestre'])).toEqual(['0 decisions apuntades en este navegador']);
    // jsdom no té IndexedDB: la targeta avisa que no es desa.
    expect(t['Certificació del Mestre'].querySelector('.sp-card-label').textContent).toBe('Sense desar');
    /* Revisió adversarial del carril F1 (problemes 2 i 9) · La sala de màquines
       porta el seu H2, darrere de la secció del govern i just damunt de les nou
       targetes: les nou ja no pengen de l'H2 del govern. Derogat: el separador
       (Divisor) que tancava la secció del govern. Cap alerta al tauler. */
    const sala = s.nextElementSibling;
    expect(sala.tagName).toBe('H2');
    expect(sala.textContent).toBe(TITOL_SALA_MAQUINES);
    expect(sala.nextElementSibling).toBe(maquinaria);
    expect(main().querySelector('[role="separator"], hr')).toBeNull();
    expect(document.querySelector('.sdp-alerta')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  test('amb la matriu del servidor: les mètriques de cada targeta, comptades de la matriu', async () => {
    fonts.govern = delServidor();
    await obri('/consola');
    const t = perTitol(navGovern());
    expect(metriques(t['Estat dels requeriments'])).toEqual(['1 fet i segellat', '1 a mitges', '2 per a la tanda següent']);
    expect(metriques(t['Balanç de la sessió'])).toEqual(['4 demanats', '1 fet', '3 a la tanda següent']);
    /* Revisió adversarial del carril F1 (problema 12) · Tres responsables per nom
       (Claude, Codex i Gemini), no per combinació de `owner`. Derogat: «el text
       de `owner`, sense interpretar-lo». */
    expect(metriques(t['Comunicació amb les IAs'])).toEqual(['2 P1 obertes', '3 responsables']);
    expect([...t['Comunicació amb les IAs'].querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['Hi ha P1 obertes']);
    expect(t['Estat dels requeriments'].querySelector('.sp-card-label')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  /* Ordre del Mestre, 30-10-2026 (/consola, punt 2.3: «Redacció DIDÀCTICA,
     viva i ben lligada amb les dades reals de les targetes») · L'Índex de la
     Consola calcula el govern amb les mateixes funcions pures que les
     cobertes (recompteVist, balancDe, resumsExecutius i el registre de
     decisions): cada mètrica de cada targeta del govern es llig, igual, en el
     seu H4 de l'Índex. Si un dia una canvia i l'altra no, esta prova ho diu. */
  test('l’Índex de la Consola diu del govern el mateix que les seues quatre targetes', async () => {
    for (const govern of [null, delServidor()]) {
      fonts.govern = govern;
      await obri('/consola');
      const index = screen.getByRole('region', { name: 'Índex de la Consola' });
      for (const [titol, targeta] of Object.entries(perTitol(navGovern()))) {
        const h4 = [...index.querySelectorAll('h4')].find((h) => h.textContent === titol);
        expect(h4, titol).toBeTruthy();
        const cos = [h4.nextElementSibling, h4.nextElementSibling.nextElementSibling, h4.nextElementSibling.nextElementSibling.nextElementSibling]
          .map((p) => p.textContent).join(' ');
        for (const m of metriques(targeta)) expect(cos, `${titol}: ${m}`).toContain(m);
        /* Gauntlet 261030 (cicle 4, corrector de la Consola) · Expectativa
           actualitzada a propòsit: sense matriu, l'H4 diu què hi dirà quan
           arribe i porta l'etiqueta de la seua targeta («Sense font»). Abans:
           «Sense matriu en este entorn» i «Sense semàfor». */
        if (!metriques(targeta).length) {
          expect(cos, titol).toMatch(/Sense matriu: quan arribe|Sense registre en este entorn/);
          const etiquetes = [...targeta.querySelectorAll('.sp-card-labels .sp-card-label')].map((e) => e.textContent);
          if (titol === 'Estat dels requeriments') expect(etiquetes).toEqual(['Sense font']);
          for (const e of etiquetes) expect(cos, `${titol}: ${e}`).toContain(e);
        }
      }
      cleanup();
    }
    expect(errors).not.toHaveBeenCalled();
  });

  /* Revisió adversarial del carril F1 (mètrica de la targeta) · El grup «Sense
     responsable» no és cap responsable: les files sense owner es diuen a banda.
     Derogat: «4 responsables» per a tres IAs i una fila sense owner. */
  test('una fila sense responsable no compta com un responsable més: es diu a banda', async () => {
    fonts.govern = delServidor({ mcr: MCR({ requirements: [...MCR().requirements, fila('G05', '[PARCIAL]', { owner: null })] }) });
    await obri('/consola');
    expect(metriques(perTitol(navGovern())['Comunicació amb les IAs'])).toEqual(['2 P1 obertes', '3 responsables', '1 fila sense responsable']);
  });

  /* Pla 261027_0845 (Guarda Nocturna), §3 · La Consola incrustada de la Wiki
     pinta les mateixes quatre targetes que /consola, amb les mateixes xifres,
     i porten a /consola/govern/<id> (la ruta de la Consola, com les nou porten
     a /consola/<pàgina>), no a cap ítem de la Wiki. La matriu es llig una sola
     vegada per a tota la fitxa, també quan la Wiki la torna a pintar. Derogat:
     «la Consola incrustada de la Wiki no llig ni pinta el govern». */
  test('la Consola incrustada de la Wiki pinta el mateix govern que /consola, el llig una sola vegada i les targetes porten a /consola/govern/<id>', async () => {
    fonts.govern = delServidor();
    await obri('/consola');
    const deLaConsola = [...navGovern().querySelectorAll('article.sp-card')].map((t) => [
      t.querySelector('h3').textContent, metriques(t), t.querySelector('a.sp-card-link-overlay').getAttribute('href')
    ]);
    const sala = seccio().nextElementSibling;
    expect(sala.textContent).toBe(TITOL_SALA_MAQUINES);
    cleanup();
    carregaGovern.crides = 0;

    window.history.replaceState(null, '', '/wikidepoble?item=consola_termodinamica');
    const vista = render(<RouterProvider><ConsolaIncrustada /></RouterProvider>);
    await act(async () => {});
    await waitFor(() => expect(metriques(perTitol(navGovern())['Estat dels requeriments'])).not.toEqual([]));
    const s = seccio();
    expect(s.tagName).toBe('SECTION');
    expect([...s.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([TITOL_GOVERN]);
    const targetes = [...navGovern().querySelectorAll('article.sp-card')];
    expect(targetes).toHaveLength(4);
    expect(targetes.map((t) => [
      t.querySelector('h3').textContent, metriques(t), t.querySelector('a.sp-card-link-overlay').getAttribute('href')
    ])).toEqual(deLaConsola);
    expect(targetes.map((t) => t.querySelector('a.sp-card-link-overlay').getAttribute('href'))).toEqual(paginesGovern().map((p) => p.ruta));
    // Darrere, l'H2 de la sala de màquines i les nou targetes, com a /consola; sense il·lustracions.
    const maquinaria = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
    expect(s.nextElementSibling.tagName).toBe('H2');
    expect(s.nextElementSibling.textContent).toBe(TITOL_SALA_MAQUINES);
    expect(s.nextElementSibling.nextElementSibling).toBe(maquinaria);
    expect(s.contains(maquinaria)).toBe(false);
    expect(document.querySelectorAll('img.sp-card-media')).toHaveLength(0);
    // Una sola lectura per a tota la fitxa: tornar a pintar no torna a llegir.
    expect(carregaGovern.crides).toBe(1);
    vista.rerender(<RouterProvider><ConsolaIncrustada /></RouterProvider>);
    await act(async () => {});
    expect(carregaGovern.crides).toBe(1);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('les quatre pàgines del govern', () => {
  test.each(paginesGovern().map((p) => [p.id, p]))('/consola/govern/%s sense matriu: H1, un sol H2, molla al cim, estat buit honest, peu al final', async (_id, p) => {
    await obri(p.ruta);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(p.title);
    const h2 = [...document.querySelectorAll('h2')].filter((h) => !h.closest('dialog'));
    expect(h2.map((h) => h.textContent)).toEqual([p.subtitle]);
    const molla = screen.getByRole('navigation', { name: 'Molla de pa' });
    expect(main().querySelector('.page-intro').nextElementSibling).toBe(molla);
    expect(within(molla).getByRole('link', { name: 'Consola Termodinàmica' }).getAttribute('href')).toBe('/consola');
    // El text literal de l'encàrrec, i on es pot obrir el fitxer mentrestant.
    if (p.id !== 'certificacio') expect(screen.getByText(`${TEXT_SENSE_MATRIU}.`).className).toBe('sdp-buit__titol');
    /* Gauntlet f4b (govern, «text-falta-un-pas-de-maria-ara-fals») · Des de B2 la ruta existix: l'estat
       buit diu per què no arriba la matriu, i cap pas pendent de MarIA. */
    expect(TEXT_SENSE_MATRIU).toMatch(/: la matriu viva només la servix el servidor de desenvolupament$/);
    expect(main().textContent).not.toMatch(/falta un pas/);
    expect(peu().querySelector('[role="status"]').textContent).toBe('Encara no hi ha cap matriu connectada.');
    expect(within(peu()).getByRole('button', { name: 'La matriu de requeriments: Obri una matriu (mcr.json)' })).toBeTruthy();
    expect(within(peu()).getByRole('button', { name: /Refrescar/ })).toBeTruthy();
    expect(within(peu()).getByRole('switch')).toBeTruthy();
    expect([...main().children].filter((el) => el.tagName !== 'DIALOG').at(-1)).toBe(peu());
    senseTipografiaDeMaquina();
    /* El SEO de la pàgina és el seu. Ordre del Mestre del 30-10-2026 (B1) ·
       Expectativa actualitzada a propòsit: amb la portada de la seua targeta
       (el .jpg de la taula, no la miniatura), com les pàgines de la sala de
       màquines. Abans: sense imatge. */
    /* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · Expectativa actualitzada a
       posta: el head és el que prerenderitza el build (seoConsola.js): la portada,
       per la seua variant social de 1200x630 (≤300 KB) i amb el seu alt, i
       l'entradeta en text pla, fitada a 300. Abans: el .jpg de 1024x1024 cru. */
    expect(seo.crides.at(-1)).toEqual({
      title: `${p.title} · Consola Termodinàmica`, description: textPla(p.lead, LIMIT_DESCRIPCIO), image: {
        url: `https://socdepoble.org/assets/nano_cards/govern_${p.id}_nano_card-social-1200x630.jpg`,
        alt: textPla(IMATGES_CONSOLA[p.id].imatgeAlt, LIMIT_TITOL)
      }
    });
    expect(errors).not.toHaveBeenCalled();
  });

  /* Gauntlet f4b (govern, «error-json-ignorat» i «text-falta-un-pas-de-maria-ara-fals») · Un error del
     connector es pinta amb el text del compilador (carregaGovern), i sense l'estat buit, que diria que
     no hi ha cap matriu connectada quan el que passa és que la del Llibre no es pot llegir. */
  test.each(paginesGovern().map((p) => [p.id, p]))('/consola/govern/%s amb un error del servidor: l’Alerta amb el text del compilador i cap estat buit', async (_id, p) => {
    const TEXT = 'La taula de la «Matriu P1» del Llibre Mestre no té les columnes «ID» i «Estat».';
    fonts.govern = { then: (_resol, rebutja) => rebutja(Object.assign(new Error(TEXT), { codi: 'taula-mal-formada' })) };
    await obri(p.ruta);
    const alerta = screen.getByRole('alert');
    expect(alerta.querySelector('.sdp-alerta__titol').textContent).toBe('No s’ha pogut llegir la matriu del servidor');
    expect(alerta.querySelector('.sdp-alerta__text').textContent).toBe(TEXT);
    expect(screen.queryByText(`${TEXT_SENSE_MATRIU}.`)).toBeNull();
    expect([...main().querySelectorAll('.sdp-buit__titol')].map((el) => el.textContent).filter((t) => /matriu/.test(t))).toEqual([]);
    expect(main().textContent).not.toMatch(/falta un pas/);
  });

  test('una pàgina del govern que no existix ho diu i no s’indexa', async () => {
    await obri('/consola/govern/res');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pàgina no trobada');
    expect(screen.getByText('Cap pàgina del govern amb este nom')).toBeTruthy();
    expect(seo.crides.at(-1)).toMatchObject({ index: false });
  });

  test('de la targeta del tauler a la pàgina i, per la molla, al tauler: el fitxer obert no es perd', async () => {
    await obri('/consola');
    fireEvent.click(navGovern().querySelector('a.sp-card-link-overlay[href="/consola/govern/requeriments"]'));
    expect(window.location.pathname).toBe('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', MCR(), 'mcr.json');
    expect(files(screen.getByRole('region', { name: 'Matriu de requeriments' }))).toEqual(['F04', 'F01', 'I09', 'G04']);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));
    expect(window.location.pathname).toBe('/consola');
    expect(metriques(perTitol(navGovern())['Estat dels requeriments'])).toEqual(['1 fet i segellat', '1 a mitges', '2 per a la tanda següent']);
    /* Revisió adversarial del carril F1 (selectors del peu) · I de tornada a la
       pàgina (el peu es torna a muntar), cap selector diu «Cap fitxer triat» al
       costat de la matriu oberta: mentre hi ha un fitxer obert, el selector no es
       pinta, la instantània diu d'on ve la matriu i el botó de tancar la torna. */
    fireEvent.click(navGovern().querySelector('a.sp-card-link-overlay[href="/consola/govern/requeriments"]'));
    expect(window.location.pathname).toBe('/consola/govern/requeriments');
    expect(peu().querySelector('[role="status"]').textContent)
      .toMatch(/^Matriu oberta d’un fitxer d’este ordinador \(mcr\.json\), feta el .+\. Per a obrir-ne una altra, tanca primer els fitxers oberts\.$/);
    expect(estatsDelsSelectors()).toEqual([]);
    expect(within(peu()).queryByRole('button', { name: /Obri una matriu/ })).toBeNull();
    expect(within(peu()).getByRole('button', { name: 'Tanca els fitxers oberts' })).toBeTruthy();
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('Estat dels requeriments', () => {
  test('el fitxer obert es pinta fila per fila, amb el vocabulari del pla i el filtre', async () => {
    await obri('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', MCR(), 'mcr.json');
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu oberta d’un fitxer d’este ordinador \(mcr\.json\), feta el /);
    const taula = screen.getByRole('region', { name: 'Matriu de requeriments' });
    const estats = [...taula.querySelectorAll('tbody td .sdp-insignia')].map((i) => `${i.textContent}:${[...i.classList].find((c) => c.startsWith('sdp-insignia--')).slice(14)}`);
    expect(estats).toEqual(['[FET I SEGELLAT]:exit', '[PARCIAL]:avis', '[PENDENT DE SEGÜENT TANDA]:avis', '[PENDENT DE SEGÜENT TANDA]:avis']);
    // Cap estat de la matriu és roig.
    expect(taula.querySelector('.sdp-insignia--error')).toBeNull();
    // Sense el commit d'ara (cap servidor), ho diu.
    expect(main().textContent).toContain('Des d’ací la Consola no pot saber si el codi ha canviat després');
    fireEvent.click(within(screen.getByRole('group', { name: 'Quines files es veuen' })).getByRole('button', { name: 'Pendents (2)' }));
    expect(files(screen.getByRole('region', { name: 'Matriu de requeriments' }))).toEqual(['I09', 'G04']);
    senseTipografiaDeMaquina();
    expect(errors).not.toHaveBeenCalled();
  });

  test('les rutes de l’evidència van dins de <Privat>: cap directori personal, i el mode privacitat les amaga', async () => {
    await obri('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', MCR(), 'mcr_del_mestre.json');
    expect(main().textContent).not.toContain('/Users/');
    const evidencia = () => [...screen.getByRole('region', { name: 'Matriu de requeriments' }).querySelectorAll('tbody tr:first-child td p')]
      .find((p) => p.textContent.startsWith('Evidència: '));
    expect(evidencia().textContent).toBe('Evidència: src/sections/profile/PerfilEditor.jsx:821 passa ambDrets:false.');
    /* Revisió adversarial del carril F1 (problema 4) · La línia d'estat del
       selector del peu no diu mai el nom del fitxer: el nom és una dada privada
       i ja el diu la instantània, dins de <Privat>.
       Revisió adversarial del carril F1 (selectors del peu) · Amb el fitxer
       obert, el selector no es pinta (la instantània diu d'on ve la matriu).
       Derogat: «1 fitxer» al costat de la matriu oberta. */
    expect(estatsDelsSelectors()).toEqual([]);
    expect(peu().querySelector('[role="status"]').textContent).toContain('(mcr_del_mestre.json)');
    fireEvent.click(within(peu()).getByRole('switch'));
    expect(evidencia().textContent).toBe('Evidència: ••••••dada amagada pel mode privacitat');
    expect(main().textContent).not.toContain('PerfilEditor.jsx');
    // El nom del fitxer obert també és una dada privada: ni la instantània ni cap altra part del peu o de la pàgina el diuen.
    expect(peu().querySelector('[role="status"]').textContent).not.toContain('mcr_del_mestre');
    expect(peu().textContent).not.toContain('mcr_del_mestre');
    expect(main().textContent).not.toContain('mcr_del_mestre');
    expect(localStorage.getItem(CLAU_PRIVACITAT)).toBe('1');
  });

  test('una matriu del servidor sobre un altre codi és obsoleta: ho diu i no pinta cap fila de verd', async () => {
    fonts.govern = delServidor({ head: 'deadbeefcafe' });
    await obri('/consola/govern/requeriments');
    const avis = screen.getByText('La matriu és obsoleta').closest('.sdp-alerta');
    expect(avis.className).toBe('sdp-alerta sdp-alerta--avis');
    expect(avis.textContent).toContain('El codi ha canviat des que es va fer la matriu.');
    const taula = screen.getByRole('region', { name: 'Matriu de requeriments' });
    expect(taula.querySelector('.sdp-insignia--exit')).toBeNull();
    expect(taula.querySelector('tbody tr').textContent).toContain('Obsolet Deia [FET I SEGELLAT].');
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu del servidor de desenvolupament, feta el /);
  });

  test('un estat que no s’entén es pinta obsolet i diu què posava', async () => {
    await obri('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', MCR({ requirements: [fila('X1', '[QUASI]')] }), 'mcr.json');
    const fila1 = screen.getByRole('region', { name: 'Matriu de requeriments' }).querySelector('tbody tr');
    expect(fila1.querySelector('.sdp-insignia').className).toBe('sdp-insignia sdp-insignia--avis');
    expect(fila1.textContent).toContain('Obsolet La matriu diu «[QUASI]», que no s’entén.');
  });

  /* Revisió adversarial del carril F1 (selectors del peu) · Amb un fitxer obert
     el selector no es pinta (per a obrir-ne un altre, es tanca primer): la
     matriu que un fitxer rebutjat no esborra és la del servidor. I el selector
     torna a començar, perquè no diga que hi ha un fitxer triat quan no s'ha
     obert res. Derogat: obrir un fitxer damunt d'un altre fitxer obert, i «1
     fitxer» després d'un fitxer rebutjat. */
  test('un fitxer que no és cap matriu es diu en paraules planes i no esborra la que hi havia', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', 'no és json', 'notes.txt');
    expect(screen.getByText('No s’ha pogut obrir el fitxer').closest('.sdp-alerta').textContent).toContain('Este fitxer no és JSON');
    expect(files(screen.getByRole('region', { name: 'Matriu de requeriments' }))).toHaveLength(4);
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat']);
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu del servidor de desenvolupament, feta el /);
    await obriFitxer('La matriu de requeriments', { ids: ['F01'] }, 'trasllat.json');
    expect(screen.getByText('No s’ha pogut obrir el fitxer').closest('.sdp-alerta').textContent).toContain('Este fitxer és un trasllat, no una matriu');
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat']);
  });

  test('sense cap matriu, un fitxer rebutjat no deixa el selector dient que n’hi ha un de triat', async () => {
    await obri('/consola/govern/requeriments');
    await obriFitxer('La matriu de requeriments', '{"a":1}', 'altre.json');
    expect(screen.getByText('No s’ha pogut obrir el fitxer')).toBeTruthy();
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat']);
    expect(peu().querySelector('[role="status"]').textContent).toBe('Encara no hi ha cap matriu connectada.');
  });

  test('amb un fitxer obert, per a obrir-ne un altre es tanca primer; el focus no es perd pel camí', async () => {
    await obri('/consola/govern/requeriments');
    const selector = () => within(peu()).getByRole('button', { name: 'La matriu de requeriments: Obri una matriu (mcr.json)' });
    selector().focus();
    await obriFitxer('La matriu de requeriments', MCR(), 'mcr.json');
    // El selector s'ha amagat amb el focus a dins: el focus passa al botó que el torna.
    expect(estatsDelsSelectors()).toEqual([]);
    const tanca = within(peu()).getByRole('button', { name: 'Tanca els fitxers oberts' });
    expect(document.activeElement).toBe(tanca);
    fireEvent.click(tanca);
    expect(peu().querySelector('[role="status"]').textContent).toBe('Encara no hi ha cap matriu connectada.');
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat']);
    expect(document.activeElement).toBe(selector());
    // Un fitxer rebutjat fa tornar a començar el selector, i el focus s'hi queda.
    await obriFitxer('La matriu de requeriments', 'no és json', 'notes.txt');
    expect(document.activeElement).toBe(selector());
    // Si el focus és en un altre lloc, no es toca.
    const privacitat = within(peu()).getByRole('switch');
    privacitat.focus();
    await obriFitxer('La matriu de requeriments', MCR(), 'mcr.json');
    expect(document.activeElement).toBe(privacitat);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('Balanç de la sessió', () => {
  test('demanat, fet i traslladat, i el trasllat del servidor quadra', async () => {
    fonts.govern = delServidor({ trasllat: { at: MCR().at, source: 'mcr.json', ids: ['F01', 'I09', 'G04'] } });
    await obri('/consola/govern/balanc');
    expect(main().textContent).toContain('S’han demanat 4 requeriments. 1 està fet i segellat i 3 passen a la tanda següent, cada un amb el seu identificador.');
    expect(main().textContent).toContain('La Consola no mou res ni esborra res');
    expect(screen.getByText('El trasllat quadra').closest('.sdp-alerta').className).toBe('sdp-alerta sdp-alerta--exit');
    expect(files(screen.getByRole('region', { name: 'Requeriments que passen a la tanda següent' }))).toEqual(['F01', 'I09', 'G04']);
    senseTipografiaDeMaquina();
  });

  test('amb una matriu obsoleta, res no es dona per fet, i que el trasllat quadre no es pinta de verd', async () => {
    fonts.govern = delServidor({ head: 'deadbeefcafe', trasllat: { ids: ['F01', 'I09', 'G04'] } });
    await obri('/consola/govern/balanc');
    expect(main().textContent).toContain('1 fila que deia fet també es trasllada per a tornar-la a comprovar.');
    expect(files(screen.getByRole('region', { name: 'Requeriments que passen a la tanda següent' }))).toEqual(['F04', 'F01', 'I09', 'G04']);
    expect(screen.getByText('El trasllat quadra').closest('.sdp-alerta').className).toBe('sdp-alerta sdp-alerta--info');
    expect(main().querySelector('.sdp-insignia--exit, .sdp-alerta--exit')).toBeNull();
  });

  test('un trasllat obert d’un fitxer que no quadra diu què falta i què sobra', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/balanc');
    expect(main().textContent).toContain('Encara no s’ha obert cap trasllat.');
    await obriFitxer('El trasllat a la tanda següent', { at: '2026-10-16T10:00:00Z', ids: ['F01', 'F04', 'F01'] }, 'trasllat.json');
    const avis = screen.getByText('El trasllat no quadra amb la matriu').closest('.sdp-alerta');
    expect([...avis.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Falten al trasllat (es quedarien en l’oblit): I09, G04.',
      'Sobren al trasllat (la matriu no els té oberts): F04.',
      'Repetits al trasllat: F01.'
    ]);
    expect(main().textContent).toContain('Atenció: el trasllat i la matriu no són del mateix moment.');
    /* Revisió adversarial del carril F1 (selectors del peu) · Amb el trasllat
       obert d'un fitxer, el seu selector no es pinta: la instantània diu d'on ve
       i com se n'obri un altre. La matriu continua sent la del servidor, i el seu
       selector és al seu lloc. Derogat: ['Cap fitxer triat', '1 fitxer']. */
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat']);
    expect(peu().querySelector('[role="status"]').textContent)
      .toMatch(/^Matriu del servidor de desenvolupament, feta el .+\. Trasllat obert d’un fitxer d’este ordinador \(trasllat\.json\)\. Per a obrir-ne un altre, tanca primer els fitxers oberts\.$/);
    // Tancar els fitxers torna a la font del servidor.
    fireEvent.click(within(peu()).getByRole('button', { name: 'Tanca els fitxers oberts' }));
    expect(main().textContent).toContain('Encara no s’ha obert cap trasllat.');
    // Revisió adversarial del carril F1 (problema 4) · I els selectors ja no diuen que hi ha un fitxer triat.
    expect(estatsDelsSelectors()).toEqual(['Cap fitxer triat', 'Cap fitxer triat']);
    // El focus, que ha caigut amb el botó de tancar, va al selector que torna: el del trasllat.
    expect(document.activeElement).toBe(within(peu()).getByRole('button', { name: 'El trasllat a la tanda següent: Obri un trasllat (trasllat.json)' }));
  });
});

describe('Certificació del Mestre', () => {
  /* Revisió adversarial del carril F1 (problema 13) · L'encàrrec diu «tres verbs
     per fila»: «Certifica» ix a totes; només és el botó primari on la matriu
     ja dona la fila per feta i segellada. Derogat: «Certifica només a les
     files fetes i segellades». */
  test('el text honest, i els tres verbs a cada fila', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/certificacio');
    expect(screen.getByText(TEXT_CERTIFICACIO_LOCAL)).toBeTruthy();
    expect(screen.getByText('Este navegador no deixa desar').closest('.sdp-alerta').className).toBe('sdp-alerta sdp-alerta--avis');
    expect(main().textContent).toContain('No hi ha cap sessió amb nom oberta: les decisions es desaran sense nom.');
    expect(main().textContent).toContain('Els tres verbs ixen a totes les files.');
    /* Revisió adversarial del carril F1 (problema 7 i correcció del camp «pla») · La
       matriu de Codex no diu de quin pla és, i la pàgina ho diu: les decisions es
       desen amb la data de la matriu. Derogat: «es desen sense pla». */
    expect(main().textContent).toContain('La matriu no diu de quin pla és: les decisions es desen amb la seua data (');
    expect(main().textContent).toContain('i només valen per a esta matriu. Una matriu d’una altra data comença sense decisions, i les d’abans continuen al registre.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F04' }).disabled).toBe(false));
    const taula = screen.getByRole('region', { name: 'Decisions sobre cada fila' });
    const verbs = Object.fromEntries([...taula.querySelectorAll('tbody tr')].map((tr) => [
      tr.querySelector('th').textContent, [...tr.querySelectorAll('button')].map((b) => b.textContent)]));
    const tres = ['Valida', 'Certifica', 'Retorna amb nota'];
    expect(verbs).toEqual({ F04: tres, F01: tres, I09: tres, G04: tres });
    const primaris = [...taula.querySelectorAll('button.sdp-boto--primari')].map((b) => b.getAttribute('aria-label'));
    expect(primaris).toEqual(['Certifica F04']);
    senseTipografiaDeMaquina();
  });

  /* Revisió adversarial del carril F1 (correcció del camp «pla») · El pla el
     diu la matriu, no el servidor: és el mateix si el Mestre l'obri d'un fitxer.
     Derogat: «amb el pla que diu el servidor, les decisions es desen amb el seu pla». */
  test('amb el pla que declara la matriu, les decisions es desen amb el seu pla; el del servidor no el canvia', async () => {
    fonts.govern = delServidor({ pla: '261016_1632_auditoria_codex_evidencies', mcr: MCR({ pla: '261016_1530' }) });
    await obri('/consola/govern/certificacio');
    expect(main().textContent).toContain('Les decisions es desen amb el pla de la matriu: 261016_1530.');
    expect(main().textContent).not.toContain('261016_1632_auditoria_codex_evidencies');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F01' }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Valida F01' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Valida F01' })).getByRole('button', { name: 'Valida' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: F01, validada.')).toBeTruthy());
    // La mateixa matriu oberta d'un fitxer reconeix la decisió.
    await obriFitxer('La matriu de requeriments', MCR({ pla: '261016_1530' }), 'mcr.json');
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu oberta d’un fitxer d’este ordinador/);
    const filaF01 = () => [...screen.getByRole('region', { name: 'Decisions sobre cada fila' }).querySelectorAll('tbody tr')]
      .find((tr) => tr.querySelector('th').textContent === 'F01');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F01' }).disabled).toBe(false));
    await waitFor(() => expect(filaF01().querySelector('td:nth-of-type(3) .sdp-insignia').textContent).toBe('Validada'));
    expect(filaF01().querySelector('td:nth-of-type(3)').textContent).not.toMatch(/versió anterior|encara no s’ha comprovat/);
  });

  /* Revisió adversarial del carril F1 (correcció del camp «pla») · Una matriu
     d'una altra data que no diu de quin pla és no hereta les decisions d'una
     altra: el seu F01 pot ser una altra tasca. Les decisions continuen al
     registre. */
  test('una matriu d’una altra data comença sense decisions; les d’abans continuen al registre', async () => {
    const dimecres = MCR({ at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() });
    fonts.govern = delServidor({ mcr: dimecres });
    await obri('/consola/govern/certificacio');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F01' }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Valida F01' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Valida F01' })).getByRole('button', { name: 'Valida' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: F01, validada.')).toBeTruthy());
    // La matriu nova (una hora després) reutilitza F01 per a una altra tasca.
    const nova = MCR({ at: new Date(Date.now() - 60 * 60 * 1000).toISOString() });
    nova.requirements[1] = { ...nova.requirements[1], requirement: 'Una altra tasca' };
    await obriFitxer('La matriu de requeriments', nova, 'mcr.json');
    const filaF01 = () => [...screen.getByRole('region', { name: 'Decisions sobre cada fila' }).querySelectorAll('tbody tr')]
      .find((tr) => tr.querySelector('th').textContent === 'F01');
    await waitFor(() => expect(filaF01().querySelector('td:nth-of-type(1)').textContent).toBe('Una altra tasca'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F01' }).disabled).toBe(false));
    expect(filaF01().querySelector('td:nth-of-type(3)').textContent).toBe('Sense decisió');
    const registre = screen.getByRole('list', { name: 'Decisions del Mestre, la més nova primer' });
    expect([...registre.querySelectorAll('.sdp-linia-temps__titol')].map((t) => t.textContent)).toEqual(['Validada · F01']);
  });

  test('certificar una fila que la matriu no dona per feta s’apunta, es diu i no es pinta de verd', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/certificacio');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Certifica F01' }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Certifica F01' }));
    const dialeg = screen.getByRole('dialog', { name: 'Certifica F01' });
    expect(dialeg.textContent).toContain('La matriu no dona esta fila per feta ([PARCIAL])');
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Certifica' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: F01, certificada.')).toBeTruthy());
    const filaF01 = [...screen.getByRole('region', { name: 'Decisions sobre cada fila' }).querySelectorAll('tbody tr')]
      .find((tr) => tr.querySelector('th').textContent === 'F01');
    const decisio = filaF01.querySelector('td:nth-of-type(3) .sdp-insignia');
    expect(decisio.textContent).toBe(TEXT_CERTIFICADA_SENSE_FET);
    expect(decisio.className).toBe('sdp-insignia sdp-insignia--avis');
    // L'estat de la matriu no canvia.
    expect(filaF01.querySelector('td:nth-of-type(2) .sdp-insignia').textContent).toBe('[PARCIAL]');
    expect(filaF01.querySelector('.sdp-insignia--exit')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  /* Revisió adversarial del carril F1 (problema 3) · El diàleg és de la fila que
     s'ha vist: si mentre està obert arriba una matriu nova on la fila és una
     altra, confirmar no apunta res i ho diu. */
  test('si la fila canvia mentre el diàleg és obert, no s’apunta res', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/certificacio');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Certifica F04' }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Certifica F04' }));
    const dialeg = screen.getByRole('dialog', { name: 'Certifica F04' });
    // Arriba una matriu nova on F04 va a mitges.
    const nova = MCR();
    nova.requirements[0] = { ...nova.requirements[0], status: '[PARCIAL]' };
    await obriFitxer('La matriu de requeriments', nova, 'mcr.json');
    const filaF04 = () => [...screen.getByRole('region', { name: 'Decisions sobre cada fila' }).querySelectorAll('tbody tr')]
      .find((tr) => tr.querySelector('th').textContent === 'F04');
    await waitFor(() => expect(filaF04().querySelector('td:nth-of-type(2) .sdp-insignia').textContent).toBe('[PARCIAL]'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F04' }).disabled).toBe(false));
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Certifica' })); });
    expect(within(dialeg).getByText('La fila ha canviat mentre decidies: torna-la a mirar. No s’ha apuntat res.')).toBeTruthy();
    expect(main().textContent).toContain('Encara no hi ha cap decisió en este navegador.');
    expect(filaF04().querySelector('td:nth-of-type(3)').textContent).toBe('Sense decisió');
  });

  test('cada decisió s’apunta amb l’actor de la sessió i no canvia l’estat de la matriu; s’exporta en JSONL', async () => {
    fonts.govern = delServidor();
    fonts.sessio = { currentUser: { email: 'mestre@exemple.org', user_metadata: { full_name: 'Mestre de prova' } } };
    await obri('/consola/govern/certificacio');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Certifica F04' }).disabled).toBe(false));

    // Certifica F04.
    fireEvent.click(screen.getByRole('button', { name: 'Certifica F04' }));
    const dialeg = screen.getByRole('dialog', { name: 'Certifica F04' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Certifica' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: F04, certificada.')).toBeTruthy());

    // Retorna I09: sense nota no es pot.
    fireEvent.click(screen.getByRole('button', { name: 'Retorna amb nota I09' }));
    const retorn = screen.getByRole('dialog', { name: 'Retorna amb nota I09' });
    await act(async () => { fireEvent.click(within(retorn).getByRole('button', { name: 'Retorna amb nota' })); });
    expect(within(retorn).getByText('Escriu la nota: diu a les IAs què cal canviar.')).toBeTruthy();
    fireEvent.change(within(retorn).getByLabelText(/Nota per a les IAs/), { target: { value: 'Falta la prova del flux.' } });
    await act(async () => { fireEvent.click(within(retorn).getByRole('button', { name: 'Retorna amb nota' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: I09, retornada amb nota.')).toBeTruthy());

    const taula = screen.getByRole('region', { name: 'Decisions sobre cada fila' });
    const perFila = Object.fromEntries([...taula.querySelectorAll('tbody tr')].map((tr) => [tr.querySelector('th').textContent, tr]));
    expect(perFila.F04.querySelector('td:nth-of-type(3) .sdp-insignia').textContent).toBe('Certificada');
    expect(perFila.F04.querySelector('td:nth-of-type(3)').textContent).toContain('Mestre de prova');
    expect(perFila.I09.querySelector('td:nth-of-type(3) .sdp-insignia').textContent).toBe('Retornada amb nota');
    // L'estat automàtic de la matriu no canvia per cap decisió.
    expect(perFila.I09.querySelector('td:nth-of-type(2) .sdp-insignia').textContent).toBe('[PENDENT DE SEGÜENT TANDA]');
    expect(perFila.F01.querySelector('td:nth-of-type(3)').textContent).toBe('Sense decisió');
    // El registre, la més nova primer.
    const registre = screen.getByRole('list', { name: 'Decisions del Mestre, la més nova primer' });
    expect([...registre.querySelectorAll('.sdp-linia-temps__titol')].map((t) => t.textContent)).toEqual(['Retornada amb nota · I09', 'Certificada · F04']);
    expect(registre.textContent).toContain('Falta la prova del flux.');
    expect(registre.textContent).not.toContain('mestre@exemple.org');

    // Exporta: un JSONL amb una línia per decisió, amb l'empremta de la fila.
    const crea = vi.fn(() => 'blob:certificacions-1');
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: crea },
      revokeObjectURL: { configurable: true, value: vi.fn() }
    });
    const clics = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { clics.push(this.download); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Exporta les certificacions (JSONL)' })); });
    await waitFor(() => expect(clics).toHaveLength(1));
    expect(clics[0]).toMatch(/^certificacions_govern_\d{4}-\d{2}-\d{2}\.jsonl$/);
    const text = await new Promise((resol) => {
      const lector = new FileReader();
      lector.onload = () => resol(lector.result);
      lector.readAsText(crea.mock.calls[0][0]);
    });
    const linies = text.trim().split('\n').map((l) => JSON.parse(l));
    expect(linies.map((l) => [l.schema, l.id, l.decisio, l.actor, l.nota])).toEqual([
      ['sdp.certificacio.v1', 'F04', 'certificat', 'Mestre de prova', null],
      ['sdp.certificacio.v1', 'I09', 'retornat', 'Mestre de prova', 'Falta la prova del flux.']
    ]);
    expect(linies.every((l) => /^sha256:[0-9a-f]{64}$/.test(l.empremta))).toBe(true);
    expect(text).not.toContain('mestre@exemple.org');
    expect(errors).not.toHaveBeenCalled();
  });

  /* Revisió adversarial del carril F1 (correcció del camp «pla») · La fila
     canviada és de la mateixa matriu (la mateixa data, el mateix pla): una
     matriu d'una altra data no hereta les decisions (prova d'ací damunt). */
  test('si la fila canvia després, la decisió és «d’una versió anterior»', async () => {
    const base = MCR();
    fonts.govern = delServidor({ mcr: base });
    await obri('/consola/govern/certificacio');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F01' }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Valida F01' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Valida F01' })).getByRole('button', { name: 'Valida' })); });
    await waitFor(() => expect(screen.getByText('Apuntat: F01, validada.')).toBeTruthy());
    // La mateixa matriu, amb F01 ja fet.
    const nova = { ...base, requirements: [...base.requirements] };
    nova.requirements[1] = { ...nova.requirements[1], status: '[FET I SEGELLAT]' };
    await obriFitxer('La matriu de requeriments', nova, 'mcr.json');
    const filaF01 = () => [...screen.getByRole('region', { name: 'Decisions sobre cada fila' }).querySelectorAll('tbody tr')]
      .find((tr) => tr.querySelector('th').textContent === 'F01');
    await waitFor(() => expect(filaF01().querySelector('td:nth-of-type(3) .sdp-insignia').textContent).toBe('Certificació d’una versió anterior'));
    expect(filaF01().querySelector('td:nth-of-type(3)').textContent).toContain('era validada');
  });
});

describe('Comunicació amb les IAs', () => {
  test('resums executius en text pla, per responsable, per prioritat i les P1 obertes', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/comunicacio');
    const seccions = Object.fromEntries([...main().querySelectorAll('section > h3')].map((h) => [h.textContent, h.parentElement]));
    expect(Object.keys(seccions)).toEqual(['Com va la tanda', 'Per responsable', 'Per prioritat', 'Les P1 que queden obertes']);
    expect(seccions['Com va la tanda'].textContent).toContain('La matriu té 4 requeriments: 1 fet i segellat, 1 a mitges i 2 per a la tanda següent.');
    expect([...seccions['Per prioritat'].querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'P1: 2 requeriments, 0 fets i segellats, 1 a mitges i 1 per a la tanda següent.',
      'P2: 2 requeriments, 1 fet i segellat, 0 a mitges i 1 per a la tanda següent.'
    ]);
    expect([...seccions['Les P1 que queden obertes'].querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'F01: Requeriment F01. Va a mitges. Responsables: Claude implementa; Codex verifica.',
      'I09: Requeriment I09. Pendent per a la tanda següent. Responsables: Claude implementa; Gemini arquitectura; Codex verifica.'
    ]);
    senseTipografiaDeMaquina();
    expect(main().textContent).not.toMatch(/\/Users\/|sha256/);
    expect(errors).not.toHaveBeenCalled();
  });
});

/* Decisió del Mestre (31-10-2026) · A la web publicada (build web: DEV fals i
   la bandera SDP_CONSOLA_INSTANTANIA que segella el connector
   sdp:consola-instantania), la matriu és la de la instantània sanejada:
   1. es data amb l'instant en què es va generar, no amb el rellotge de qui la
      mira (una instantània no envellix sola), i diu d'on ve;
   2. la certificació es veu sencera, però cap botó hi actua: les escriptures
      només en desenvolupament (ambEscriptures, fontsConsola.js). */
describe('la instantània publicada (decisió del Mestre, 31-10-2026)', () => {
  const aLaWebPublicada = () => { vi.stubEnv('DEV', false); vi.stubEnv('SDP_CONSOLA_INSTANTANIA', '1'); };
  afterEach(() => { vi.unstubAllEnvs(); });
  /* Una matriu feta una hora abans de la instantània, que es va publicar fa cinc dies. */
  const publicada = () => {
    const generat = Date.now() - 5 * 24 * 60 * 60 * 1000;
    return delServidor({ generat: new Date(generat).toISOString(), mcr: MCR({ at: new Date(generat - 60 * 60 * 1000).toISOString() }) });
  };

  test('cinc dies després no és obsoleta, pinta el verd que tenia i diu d’on ve', async () => {
    aLaWebPublicada();
    fonts.govern = publicada();
    await obri('/consola/govern/requeriments');
    expect(screen.queryByText('La matriu és obsoleta')).toBeNull();
    expect(main().textContent).toContain('De la instantània sanejada que es va publicar amb esta versió de la web, el ');
    expect(main().textContent).toContain('La versió del codi s’ha comprovat amb la del moment de la instantània.');
    // Gauntlet f9 (F3) · El peu diu de quin dia és la instantània, a més de quan es va fer la matriu.
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu de la instantània publicada el .+, feta el /);
    expect(screen.getByRole('region', { name: 'Matriu de requeriments' }).querySelector('.sdp-insignia--exit')).not.toBeNull();
  });

  test('el contrast: la mateixa matriu, al servidor de desenvolupament, sí que és obsoleta (rellotge d’ara)', async () => {
    fonts.govern = publicada();
    await obri('/consola/govern/requeriments');
    expect(screen.getByText('La matriu és obsoleta')).toBeTruthy();
    expect(peu().querySelector('[role="status"]').textContent).toMatch(/^Matriu del servidor de desenvolupament, feta el /);
  });

  /* Gauntlet f9 (F4-certificacio-publicada-amb-textos-contradictoris) · Només el que hi és
     cert: cap decisió s'hi apunta, i cap text de sessió, signatura ni persistència, ni cap
     botó desactivat per fila. Derogat: «els tres verbs a cada fila i cap no hi actua». */
  test('la certificació: la matriu sencera, cap botó per fila i cap text que prometa apuntar res', async () => {
    aLaWebPublicada();
    fonts.govern = publicada();
    await obri('/consola/govern/certificacio');
    expect(screen.getByText(TEXT_CERTIFICACIO_PUBLICADA)).toBeTruthy();
    expect(screen.getByText(TEXT_VERBS_PUBLICADA)).toBeTruthy();
    expect(screen.getByText(TEXT_REGISTRE_PUBLICADA)).toBeTruthy();
    expect(screen.queryByText(TEXT_CERTIFICACIO_LOCAL)).toBeNull();
    await act(async () => { await new Promise((resol) => setTimeout(resol, 50)); });
    const text = main().textContent;
    for (const fals of ['la pot apuntar', 'es desaran sense nom', 'es desen amb el nom', 'Este navegador no deixa desar', 'exporta-les', 'No es pot apuntar cap decisió']) {
      expect(text, fals).not.toContain(fals);
    }
    const taula = screen.getByRole('region', { name: 'Decisions sobre cada fila' });
    expect(taula.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(taula.querySelectorAll('button')).toHaveLength(0);
    expect([...taula.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Fila', 'Requeriment', 'Estat de la matriu', 'Decisió del Mestre']);
    expect(screen.queryByRole('button', { name: /Exporta les certificacions/ })).toBeNull();
  });

  test('la targeta de la certificació al tauler no compta decisions d’este navegador', async () => {
    aLaWebPublicada();
    fonts.govern = publicada();
    await obri('/consola');
    expect(main().textContent).toContain('cap decisió a la web publicada');
    expect(main().textContent).not.toContain('decisions apuntades en este navegador');
  });

  test('al servidor de desenvolupament, el text de la web publicada no hi és', async () => {
    fonts.govern = delServidor();
    await obri('/consola/govern/certificacio');
    expect(screen.queryByText(TEXT_CERTIFICACIO_PUBLICADA)).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valida F04' }).disabled).toBe(false));
  });
});
