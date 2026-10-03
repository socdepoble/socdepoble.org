/* El panell dels sentinelles amb el nucli de veres i el catàleg real: magatzem
   en memòria, WebCrypto de Node i un navegador sense WebAuthn (només la
   confirmació escrita, que és la que admeten els sentinelles sense dades
   personals). L'aprovació es fa a la porta de dalt, com la faria el Mestre,
   i el panell de baix s'hi sincronitza pel magatzem compartit. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { crearMagatzemMemoria } from './nucli/magatzem.js';
import PanellSentinelles, { magatzemAmbAvis, textErrorSentinella } from './PanellSentinelles.jsx';
import { SENTINELLES } from './registreSentinelles.js';
import { ErrorSentinella } from './sentinelles/contracte.js';
import { ErrorAprovacio } from './nucli/aprovacio.js';

afterEach(cleanup);

const subtle = webcrypto.subtle;
const T0 = Date.UTC(2026, 9, 2, 8);
const rellotge = () => T0;
const ENTORN = { location: { origin: 'https://app.example.org', hostname: 'app.example.org' }, navigator: {} };
const POLICIA = 'Sentinella Policia del Disseny';
const ESPERA = { timeout: 20000 };

/* La URL que veu el router en memòria, i el botó d'arrere del navegador. */
let arrere = () => {};
function Ubicacio() {
  const { search } = useLocation();
  const navega = useNavigate();
  arrere = () => navega(-1);
  return <output aria-label="Ubicació">{search}</output>;
}
const consulta = () => new URLSearchParams(screen.getByLabelText('Ubicació').textContent);

/* Com a la Wiki: dins del router, amb l'ítem de la Wiki a la consulta. */
async function munta(magatzem = crearMagatzemMemoria(), rutaInicial = '/wiki?item=sentinelles_panell') {
  const vista = render(
    <MemoryRouter rutaInicial={rutaInicial}>
      <PanellSentinelles magatzem={magatzem} subtle={subtle} entorn={ENTORN} rellotge={rellotge} />
      <Ubicacio />
    </MemoryRouter>
  );
  await screen.findByRole('list', { name: 'Tractors' }, ESPERA);
  await screen.findByRole('list', { name: 'Sentinelles' }, ESPERA);
  return { ...vista, magatzem };
}

const porta = () => screen.getByRole('region', { name: 'Porta d’aprovació de tractors' });
const sentinelles = () => screen.getByRole('region', { name: 'Sentinelles: què observen' });
const delLlistat = (regio, llista, nom) => within(within(regio).getByRole('list', { name: llista })).getByRole('button', { name: new RegExp(`^${nom}`) });

async function aprovaPerConfirmacio(nom) {
  fireEvent.click(delLlistat(porta(), 'Tractors', nom));
  const article = within(within(porta()).getByRole('article'));
  await waitFor(() => expect(article.getByRole('heading', { level: 3, name: nom })).toBeTruthy());
  const curta = article.getByText(/^[0-9A-F]{4}-[0-9A-F]{4}$/).textContent;
  fireEvent.click(within(porta()).getByRole('button', { name: 'Aprova esta versió' }));
  const dialeg = screen.getByRole('dialog', { name: `Aprova «${nom}»` });
  fireEvent.click(within(dialeg).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
  fireEvent.change(within(dialeg).getByRole('textbox', { name: /Escriu l’empremta curta/ }), { target: { value: curta } });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Aprova amb confirmació escrita' }));
  await waitFor(() => expect(within(porta()).getByText(/^Aprovat: /)).toBeTruthy(), ESPERA);
}

const fitxerJsx = (text) => new File([text], 'Prova.jsx', { type: 'text/jsx' });
const AMB_ESTIL = ['export const P = () => <p ', ['sty', 'le='].join(''), '{{ margin: 0 }}>x</p>;\n'].join('');

describe('abans d’aprovar', () => {
  test('les dues parts: la porta amb els set sentinelles i el llistat, tots sense aprovar', async () => {
    await munta();
    const tractors = within(within(porta()).getByRole('list', { name: 'Tractors' })).getAllByRole('button');
    expect(tractors.map((b) => b.textContent)).toEqual(SENTINELLES.map((s) => `${s.manifest.nom}Pendent`));
    const llista = within(within(sentinelles()).getByRole('list', { name: 'Sentinelles' })).getAllByRole('button');
    expect(llista.map((b) => b.textContent)).toEqual(SENTINELLES.map((s) => `${s.nom}Sense aprovar`));
  }, 30000);

  test('el detall diu què observa i no deixa triar cap fitxer', async () => {
    await munta();
    const regio = within(sentinelles());
    expect(regio.getByRole('heading', { level: 3, name: SENTINELLES[0].nom })).toBeTruthy();
    expect(regio.getByText('Consola')).toBeTruthy();
    expect(regio.getByText(/^L0 · diagnostica i proposa/)).toBeTruthy();
    expect(regio.getByText('Cal aprovar-lo abans d’observar')).toBeTruthy();
    expect(sentinelles().querySelector('input[type="file"]')).toBeNull();
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', 'Sentinella Triturador Financer'));
    expect(regio.getByText('Departament de l’App Grid Shell: Bancs, Facturació, Impostos')).toBeTruthy();
  }, 30000);
});

describe('aprovat a la porta de dalt', () => {
  test('el panell de baix es sincronitza, deixa triar fitxers i mostra les banderes', async () => {
    await munta();
    await aprovaPerConfirmacio(POLICIA);
    await waitFor(() => expect(delLlistat(sentinelles(), 'Sentinelles', POLICIA).textContent).toContain('Aprovat'), ESPERA);
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', POLICIA));
    const regio = within(sentinelles());
    const entrada = regio.getByLabelText('Fitxers de codi (JSX, JS, HTML o CSS)');
    expect(entrada.getAttribute('accept')).toBe('.js,.jsx,.mjs,.css,.html');
    fireEvent.change(entrada, { target: { files: [fitxerJsx(AMB_ESTIL)] } });
    await waitFor(() => expect(regio.getByText('Bandera roja')).toBeTruthy(), ESPERA);
    const avisos = within(regio.getByRole('list', { name: 'Avisos' }));
    expect(avisos.getByText(/Estil en línia/)).toBeTruthy();
    expect(avisos.getByText('Prova.jsx:1')).toBeTruthy();
    expect(sentinelles().querySelector('pre').textContent).toMatch(/^1 fitxers revisats/);
  }, 60000);

  test('un fitxer net: sense banderes', async () => {
    await munta();
    await aprovaPerConfirmacio(POLICIA);
    await waitFor(() => expect(delLlistat(sentinelles(), 'Sentinelles', POLICIA).textContent).toContain('Aprovat'), ESPERA);
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', POLICIA));
    fireEvent.change(within(sentinelles()).getByLabelText('Fitxers de codi (JSX, JS, HTML o CSS)'), {
      target: { files: [fitxerJsx('export const P = () => <p className="sdp-x">x</p>;\n')] }
    });
    await waitFor(() => expect(within(sentinelles()).getByText('Sense banderes')).toBeTruthy(), ESPERA);
    expect(within(sentinelles()).getByText('Cap avís.')).toBeTruthy();
  }, 60000);

  test('revocar a dalt torna el de baix a «sense aprovar» i amaga el selector', async () => {
    await munta();
    await aprovaPerConfirmacio(POLICIA);
    fireEvent.click(within(porta()).getByRole('button', { name: 'Revoca' }));
    await waitFor(() => expect(delLlistat(sentinelles(), 'Sentinelles', POLICIA).textContent).toContain('Sense aprovar'), ESPERA);
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', POLICIA));
    expect(sentinelles().querySelector('input[type="file"]')).toBeNull();
  }, 60000);

  test('fail-closed: si l’aprovació desapareix per darrere, el corredor no observa res', async () => {
    const { magatzem } = await munta();
    await aprovaPerConfirmacio(POLICIA);
    await waitFor(() => expect(delLlistat(sentinelles(), 'Sentinelles', POLICIA).textContent).toContain('Aprovat'), ESPERA);
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', POLICIA));
    await magatzem.esborraTot();
    fireEvent.change(within(sentinelles()).getByLabelText('Fitxers de codi (JSX, JS, HTML o CSS)'), { target: { files: [fitxerJsx(AMB_ESTIL)] } });
    await waitFor(() => expect(within(sentinelles()).getByText('Este tractor no té cap aprovació vigent.')).toBeTruthy(), ESPERA);
    expect(within(sentinelles()).queryByText('Bandera roja')).toBeNull();
  }, 60000);
});

describe('la Clàusula dels Slugs: el sentinella triat viu a la URL', () => {
  const titol = () => within(sentinelles()).getByRole('heading', { level: 3 }).textContent;
  const CONSOL = SENTINELLES.find((s) => s.id === 'sentinella.consol-vendes');
  const DETECTIU = SENTINELLES.find((s) => s.id === 'sentinella.detectiu-poble');

  test('un enllaç copiat obri el sentinella que diu, no el primer', async () => {
    await munta(undefined, '/wiki?item=sentinelles_panell&sentinella=consol-vendes');
    expect(titol()).toBe(CONSOL.nom);
    expect(delLlistat(sentinelles(), 'Sentinelles', CONSOL.nom).getAttribute('aria-current')).toBe('true');
  }, 30000);

  test('triar-ne un l’escriu a la consulta sense tocar l’ítem de la Wiki, i arrere torna a l’anterior', async () => {
    await munta();
    expect(consulta().get('sentinella')).toBeNull();
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', CONSOL.nom));
    expect(titol()).toBe(CONSOL.nom);
    expect(Object.fromEntries(consulta())).toEqual({ item: 'sentinelles_panell', sentinella: 'consol-vendes' });
    fireEvent.click(delLlistat(sentinelles(), 'Sentinelles', DETECTIU.nom));
    expect(consulta().get('sentinella')).toBe('detectiu-poble');
    act(() => arrere());
    expect(titol()).toBe(CONSOL.nom);
    expect(consulta().get('sentinella')).toBe('consol-vendes');
  }, 30000);

  test('un slug desconegut obri el primer, com sense slug', async () => {
    await munta(undefined, '/wiki?item=sentinelles_panell&sentinella=no-existix');
    expect(titol()).toBe(SENTINELLES[0].nom);
  }, 30000);
});

describe('peces del panell', () => {
  test('magatzemAmbAvis avisa després de cada escriptura, no de les lectures, i conserva persistent', async () => {
    const avisa = vi.fn();
    const base = crearMagatzemMemoria();
    const m = magatzemAmbAvis(base, avisa);
    expect(m.persistent).toBe(false);
    expect(m.tipus).toBe('memoria');
    await m.registres();
    await m.claus();
    await m.exporta();
    expect(avisa).not.toHaveBeenCalled();
    await m.esborraTot();
    expect(avisa).toHaveBeenCalledTimes(1);
    await expect(m.afegixClau({})).rejects.toThrow();
    expect(avisa).toHaveBeenCalledTimes(1);
  });

  test('un avís que falla no desfà l’escriptura', async () => {
    const m = magatzemAmbAvis(crearMagatzemMemoria(), () => { throw new Error('avís trencat'); });
    await expect(m.esborraTot()).resolves.toBeUndefined();
  });

  test('textErrorSentinella: els codis dels sentinelles amb paraules, la resta com la porta', () => {
    expect(textErrorSentinella(new ErrorSentinella('ENTRADA_INVALIDA', '«x.json» no és un JSON vàlid.'))).toEqual({
      titol: 'Els fitxers triats no es poden llegir: no s’ha observat res.', detall: '«x.json» no és un JSON vàlid.'
    });
    expect(textErrorSentinella(new ErrorAprovacio('APROVACIO_REVOCADA', 'Revocada.')).titol).toBe('L’aprovació està revocada: cal tornar a aprovar el tractor.');
  });
});
