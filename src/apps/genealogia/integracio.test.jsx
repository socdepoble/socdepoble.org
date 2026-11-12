/* Arbre Genealògic · la prova d'integració dels quatre grups (nucli, gedcom,
   arxius i interfície) dins de la plataforma real: el registre de proves
   (creaRegistre), la barra lateral de l'app i RutaApps, en un node de
   producció obert (ENTORN_OBERT, P0-114). Un sol recorregut com el faria una
   persona: l'avís, l'entrevista d'una pregunta per torn (casa, mas, G4 → G2,
   d'on ho saps), l'arbre amb la numeració Sosa, les consultes per a un arxiu,
   la còpia JSON i el GEDCOM 7.0 revisats abans de descarregar, i el GEDCOM
   tornat a importar com a arbre nou. Dades inventades, magatzem en memòria. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { BarraLateral } from '../plataforma/BarraLateral.jsx';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import RutaApps from '../plataforma/RutaApps.jsx';
import manifestGenealogia from './manifest.js';
import AppGenealogia from './AppGenealogia.jsx';
import { carregaArbre, creaMagatzemGenealogia, llistaArbres } from './magatzem.js';
import { PASSOS_ENTREVISTA } from './nucli/index.js';
import { arxiuPerId } from './arxius/index.js';

const ARA = new Date(2026, 10, 11, 21, 0);
let magatzem;
let n;

const pregunta = (id) => PASSOS_ENTREVISTA.find((pas) => pas.id === id).pregunta.ca;
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const navegacio = () => screen.getByRole('navigation', { name: 'Navegació principal' });

/* L'app amb el manifest real (la `carrega` es canvia per una que injecta el
   magatzem en memòria, el rellotge i els ids), la barra lateral i /app/*. */
function munta(url, { entorn = ENTORN_OBERT } = {}) {
  const App = () => (
    <AppGenealogia magatzem={magatzem} rellotge={() => ARA}
      nouId={() => { n += 1; return `00000000-0000-4000-8000-${String(7000 + n).padStart(12, '0')}`; }} />
  );
  const carrega = vi.fn(() => Promise.resolve({ default: App }));
  muntaPlataforma(url, {
    registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega }] }),
    entorn,
    fills: (
      <>
        <nav aria-label="Navegació principal"><BarraLateral /></nav>
        <Routes>
          <Route path="/app/*" element={<RutaApps />} />
          <Route path="/*" element={<p>Fora de les apps</p>} />
        </Routes>
      </>
    )
  });
  return carrega;
}

async function esperaPregunta(id) {
  await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(pregunta(id)));
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
}

/* Emplena el formulari de persona del pas d'ara. La data, amb la seua precisió. */
function emplenaPersona({ nom, cognom1, cognom2, precisio = null, any = '', difunta = false }) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Nom' }), { target: { value: nom } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Primer cognom' }), { target: { value: cognom1 } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Cognom matern (segon cognom)' }), { target: { value: cognom2 } });
  if (precisio) {
    fireEvent.click(screen.getByRole('radio', { name: precisio }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Any (o AAAA-MM-DD)' }), { target: { value: any } });
  }
  if (difunta) fireEvent.click(screen.getByRole('radio', { name: 'No, ja ha mort' }));
}

const seguent = () => fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
const saltaPas = () => fireEvent.click(screen.getByRole('button', { name: 'Salta' }));

beforeEach(() => {
  n = 0;
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('el manifest davant del validador real de la plataforma', () => {
  test('és vàlid com a app interna: gratuïta, oberta en producció i amb la guarda de document propi', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestGenealogia, { origen: 'interna' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest).toMatchObject({
      id: 'genealogia', origen: 'interna', nivell: 'gratuit', actiuPerDefecte: true, entorn: 'produccio',
      dadesPersonals: 'salut', entradaPerDefecte: 'entrevista', permisos: { veure: 'public' }
    });
    expect(manifest.entrades.map((e) => e.slug)).toEqual(['entrevista', 'persones', 'arbre', 'fan', 'arxius', 'prompts', 'intercanvi', 'avis']);
  });

  test('la càrrega diferida del manifest porta exactament AppGenealogia', async () => {
    expect(typeof manifestGenealogia.carrega).toBe('function');
    const modul = await manifestGenealogia.carrega();
    expect(modul.default).toBe(AppGenealogia);
  });

  test('en un node de producció, fora del document propi (encastada), no es carrega', async () => {
    const carrega = munta('/app/genealogia/entrevista', { entorn: { ...ENTORN_OBERT, amaDelDocument: false } });
    expect(await screen.findByText('Esta app no es pot obrir ací')).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });
});

describe('un recorregut sencer: entrevista → arbre → arxius → intercanvi', () => {
  test('la persona fa l’entrevista, mira l’arbre Sosa, prepara consultes i exporta i reimporta el GEDCOM', async () => {
    const carrega = munta('/app/genealogia');

    /* 1 · Producció: l'app s'obri, i la porta de l'avís mana abans que res. */
    /* La primera càrrega diferida (lazy) pot tardar més d'un segon amb la suite en paral·lel. */
    const entesos = await screen.findByRole('button', { name: 'Entesos' }, { timeout: 10000 });
    expect(carrega).toHaveBeenCalledTimes(1);
    expect(ubicacio()).toBe('/app/genealogia/avis');
    expect(within(navegacio()).getByRole('link', { name: 'Arbre i Sosa' }).getAttribute('href')).toBe('/app/genealogia/arbre');
    fireEvent.click(entesos);
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/entrevista'));

    /* 2 · L'entrevista: una sola pregunta per torn. */
    await esperaPregunta('casa');
    fireEvent.change(screen.getByRole('textbox', { name: 'La teua resposta' }), { target: { value: 'Ca la Prova' } });
    seguent();
    await esperaPregunta('lloc');
    /* El focus no cau a <body>: va a la pregunta nova (WCAG 2.4.3). */
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 })));
    fireEvent.change(screen.getByRole('textbox', { name: 'La teua resposta' }), { target: { value: 'Mas Inventat' } });
    seguent();
    await esperaPregunta('g4-jo');
    expect(screen.getByText(/Cognom ≠ Parentiu/)).toBeTruthy();
    /* Per a tu, la resposta de partida és «viu»; la casella de difunt ja no existix. */
    expect(screen.getByRole('radio', { name: 'Sí, viu' }).checked).toBe(true);
    emplenaPersona({ nom: 'Jo', cognom1: 'Exemple', cognom2: 'Mostra' });
    seguent();
    await esperaPregunta('g4-germa');
    seguent();
    await esperaPregunta('g3-pare');
    emplenaPersona({ nom: 'Pere', cognom1: 'Exemple', cognom2: 'Antic', precisio: 'Estimada (1908?)', any: '1960', difunta: true });
    seguent();
    await esperaPregunta('g3-mare');
    emplenaPersona({ nom: 'Maria', cognom1: 'Mostra', cognom2: 'Vella', precisio: 'Aproximada (~1908)', any: '1962', difunta: true });
    seguent();
    await esperaPregunta('g2-pare-pare');
    emplenaPersona({ nom: 'Josep', cognom1: 'Exemple', cognom2: 'Roca', precisio: 'Exacta (1908)', any: '1930', difunta: true });
    seguent();
    for (const id of ['g2-mare-pare', 'g2-pare-mare', 'g2-mare-mare']) {
      await esperaPregunta(id);
      saltaPas();
    }
    await esperaPregunta('g1-besavi');
    seguent();
    await esperaPregunta('font');
    fireEvent.click(screen.getByRole('radio', { name: 'Ho sé de memòria o m’ho han contat' }));
    seguent();
    expect(await screen.findByText('Entrevista acabada')).toBeTruthy();

    /* Al magatzem: quatre persones i els vincles de l'entrevista, cap per cognom. */
    const [arbreEntrevista] = await llistaArbres(magatzem);
    const desat = await carregaArbre(magatzem, arbreEntrevista.id);
    expect(desat.arbre).toMatchObject({ malnomCasa: 'Ca la Prova', poble: 'Mas Inventat' });
    const perNom = Object.fromEntries(desat.persones.map((p) => [p.nom, p]));
    expect(Object.keys(perNom).sort()).toEqual(['Jo', 'Josep', 'Maria', 'Pere']);
    expect(desat.arbre.arrelId).toBe(perNom.Jo.id);
    const progenitors = desat.relacions.filter((r) => r.tipus === 'progenitor').map((r) => `${r.de}>${r.a}`).sort();
    expect(progenitors).toEqual([`${perNom.Josep.id}>${perNom.Pere.id}`, `${perNom.Maria.id}>${perNom.Jo.id}`, `${perNom.Pere.id}>${perNom.Jo.id}`].sort());
    expect(desat.relacions.every((r) => r.estat === 'aproximat')).toBe(true);

    /* 3 · L'arbre: la numeració Sosa, les precisions, els estats i els forats. */
    fireEvent.click(screen.getByRole('link', { name: 'Mira l’arbre' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arbre'));
    const g1 = await screen.findByRole('region', { name: 'Generació 1 · la persona 1' });
    expect(within(g1).getByRole('link', { name: 'Jo Exemple Mostra' })).toBeTruthy();
    const g2 = screen.getByRole('region', { name: 'Generació 2 · pares' });
    const fila2 = within(g2).getByRole('rowheader', { name: '2' }).closest('tr');
    expect(within(fila2).getByText('Pere Exemple Antic')).toBeTruthy();
    expect(within(fila2).getByText('1960?')).toBeTruthy();
    expect(within(fila2).getByText('[APROXIMAT]')).toBeTruthy();
    const fila3 = within(g2).getByRole('rowheader', { name: '3' }).closest('tr');
    expect(within(fila3).getByText('Maria Mostra Vella')).toBeTruthy();
    expect(within(fila3).getByText('~1962')).toBeTruthy();
    const g3 = screen.getByRole('region', { name: 'Generació 3 · iaios' });
    expect(within(within(g3).getByRole('rowheader', { name: '4' }).closest('tr')).getByText('Josep Exemple Roca')).toBeTruthy();
    for (const forat of ['5', '6', '7']) {
      expect(within(within(g3).getByRole('rowheader', { name: forat }).closest('tr')).getByRole('link', { name: 'Falta: afig-la' })).toBeTruthy();
    }
    /* Tres persones compartixen «Exemple», però estan lligades a l'arbre: cap avís de cognom ni cap contradicció. */
    expect(await screen.findByText('✓ Cap contradicció ni cap avís.')).toBeTruthy();

    /* 4 · Els arxius: consultes per a copiar, mai d'una persona viva per defecte. */
    fireEvent.click(within(navegacio()).getByRole('link', { name: 'Arxius públics' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arxius'));
    fireEvent.click(await screen.findByRole('link', { name: arxiuPerId('quinque-libri').nom.ca }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arxius/quinque-libri'));
    expect(await screen.findByText(/l’app no posa cap enllaç fins que algú la confirme/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Obri la web oficial' })).toBeNull();
    const persona = screen.getByRole('combobox', { name: 'Persona' });
    expect(persona.value).toBe(perNom.Pere.id);
    const consultes = screen.getAllByRole('textbox', { name: /^Consulta \d+ · / }).map((area) => area.value);
    expect(consultes.length).toBeGreaterThan(0);
    expect(consultes.some((text) => text.includes('Pere') && text.includes('Exemple'))).toBe(true);
    expect(consultes.every((text) => !/\bJo\b/.test(text))).toBe(true);
    expect(screen.getByRole('checkbox', { name: /Inclou persones vives/ }).checked).toBe(false);
    fireEvent.change(persona, { target: { value: perNom.Jo.id } });
    expect(await screen.findByText('Esta persona pot estar viva: les seues dades no ixen sense el teu permís.')).toBeTruthy();
    expect(screen.queryAllByRole('textbox', { name: /^Consulta \d+ · / })).toEqual([]);

    /* 5 · L'intercanvi: «Prepara, no publica», còpia JSON i GEDCOM 7.0 amb la persona viva anonimitzada. */
    fireEvent.click(within(navegacio()).getByRole('link', { name: 'GEDCOM i còpia' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/intercanvi'));
    expect(await screen.findByText('Prepara, no publica')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Còpia JSON (per a tornar-la a importar ací)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prepara el fitxer' }));
    const copia = JSON.parse((await screen.findByRole('textbox', { name: 'Revisa el contingut' })).value);
    expect(copia.schema).toBe('sdp.genealogia.copia.v1');
    expect(copia.incloureVius).toBe(false);
    expect(copia.entrevista).toBeNull();
    expect(copia.persones.map((p) => p.nom).sort()).toEqual(['', 'Josep', 'Maria', 'Pere']);
    expect(screen.getByText('1 persones vives ixen anonimitzades.')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'GEDCOM 7.0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prepara el fitxer' }));
    let ged = '';
    await waitFor(() => {
      ged = screen.getByRole('textbox', { name: 'Revisa el contingut' }).value;
      expect(ged).toMatch(/^0 HEAD\n1 GEDC\n2 VERS 7\.0\n/);
    });
    expect(ged).toMatch(/0 TRLR\s*$/);
    expect(ged).toMatch(/Pere/);
    expect(ged).toMatch(/1 NAME Persona viva \/\//);
    expect(ged).not.toMatch(/\bJo\b/);
    expect(ged).not.toMatch(/Mostra \/\/|\/Exemple Mostra\//);

    /* 6 · Reimportar el GEDCOM preparat: un arbre nou, sense xafar el de l'entrevista. */
    fireEvent.click(screen.getByRole('link', { name: 'Importa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/intercanvi/importa'));
    fireEvent.change(await screen.findByLabelText('Fitxer GEDCOM (.ged) o còpia (.json)'), { target: { files: [new File([ged], 'arbre.ged')] } });
    /* El recompte de la lectura (el del panell dels arbres diu el mateix de l'arbre que es mira). */
    const versio = await screen.findByText('Versió: 7.0');
    expect(within(versio.parentElement).getByText('4 persones · 4 vincles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desa com a arbre nou' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arbre'));
    const arbres = await llistaArbres(magatzem);
    expect(arbres).toHaveLength(2);
    const importat = await carregaArbre(magatzem, arbres.find((a) => a.id !== arbreEntrevista.id).id);
    expect(importat.persones.map((p) => p.nom).sort()).toEqual(['Josep', 'Maria', 'Pere', 'Persona viva']);
    expect((await carregaArbre(magatzem, arbreEntrevista.id)).persones).toHaveLength(4);
  }, 30000);
});
