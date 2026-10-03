// @vitest-environment-options {"url": "https://poble.test/control?fitxa=snippet"}
/* CU (Onada 3, 261003) · La fitxa del Snippet a Control › Utilitats: què és,
   com funciona, què necessita, la privacitat i el botó principal (primari i
   gran de Pedra Seca). El destí del botó es llig de la capa del paquet
   (capaDelPaquet), substituïda ací per una capa de prova; jsdom viu a
   https://poble.test (la capçalera) perquè hi haja un «mateix origen» https.
   Sense destí, el botó es veu desactivat i diu per què. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ capa: {} }));
vi.mock('../../config/capaDelPaquet.js', () => ({ capaDelPaquet: () => estat.capa }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <section data-pagina="fitxa">
      <p data-titol="pagina">{title}</p>
      <p data-subtitol="pagina">{subtitle}</p>
      <p data-lead="pagina">{lead}</p>
      {children}
    </section>
  )
}));

import { FitxaSnippet } from './FitxaSnippet.jsx';

const BOTIGA = 'https://chromewebstore.google.com/detail/snippet/abcdefghijklmnop';

beforeEach(() => { estat.capa = {}; });
afterEach(cleanup);

test('la fitxa explica què és, com funciona en 3 passos, què necessita i la privacitat', () => {
  render(<FitxaSnippet />);
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Snippet');
  expect(document.querySelector('[data-subtitol="pagina"]').textContent).toBe('Desa qualsevol web d’un clic');
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent))
    .toEqual(['Què és', 'Com funciona', 'Què necessites', 'Privacitat']);

  const seccio = (nom) => screen.getByRole('heading', { level: 2, name: nom }).closest('section');
  expect(seccio('Què és').textContent).toMatch(/botó al teu navegador/);
  expect(seccio('Què és').textContent).toMatch(/arriba al teu Bloc de notes de Sóc de Poble/);
  expect(seccio('Què és').textContent).toMatch(/es desa com una nota teua que podràs editar/);
  /* Correcció de la revisió · Només la destinació que hi és per a tothom: el
     Curador oferix el Lector de notícies només on l'app és disponible
     (SnippetCurador.jsx, useDestinacioEnllac), i en producció el Lector és
     només de desenvolupament (apps/lector/manifest.js). */
  expect(seccio('Què és').textContent).not.toMatch(/Notícies|lector|font nova/i);

  const passos = within(seccio('Com funciona')).getAllByRole('listitem');
  expect(passos).toHaveLength(3);
  expect(passos[0].textContent).toMatch(/^Instal·la el Snippet a Chrome/);
  expect(passos[2].textContent).toMatch(/tria la carpeta i prem «Desar»/);

  expect(within(seccio('Què necessites')).getAllByRole('listitem').map((li) => li.textContent))
    .toEqual(['Google Chrome a l’ordinador.', 'El teu compte de Sóc de Poble. Si no has entrat, el Snippet t’ho demana abans de desar.']);

  /* Correcció de la revisió · Les dades arriben al servidor que servix l'app
     (modeDesa.js), que en el Model B pot ser el de l'amfitrió: no es diu de
     qui és. I res del que farà una extensió que encara no existix (el #). */
  const privacitat = seccio('Privacitat').textContent;
  expect(privacitat).toMatch(/només actua quan el prems/);
  expect(privacitat).toMatch(/arriben al servidor que servix l’app on desaràs la nota, que pot ser el del teu poble/);
  expect(privacitat).toMatch(/poden quedar als seus registres/);
  expect(privacitat).toMatch(/no es crea fins que prems «Desar»/);
  expect(privacitat).not.toMatch(/servidor de Sóc de Poble|#/);
});

test('sense URL configurada (la capa d’ara), el botó principal es veu desactivat i diu per què', () => {
  render(<FitxaSnippet />);
  const boto = screen.getByRole('button', { name: 'Instal·la a Chrome' });
  expect(boto.disabled).toBe(true);
  expect(boto.classList.contains('sdp-boto--primari')).toBe(true);
  expect(boto.classList.contains('sdp-boto--gran')).toBe(true);
  expect(boto.closest('.sdp-control-actions')).toBeTruthy();

  const avis = document.getElementById(boto.getAttribute('aria-describedby'));
  expect(avis.textContent).toMatch(/no té encara cap versió per a instal·lar/);
  expect(avis.textContent).toMatch(/este botó s’activarà ací mateix/);
  expect(avis.closest('.sdp-alerta--info').textContent).toMatch(/^Encara no està publicada/);
  /* Text de pàgina, no una regió viva. */
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
});

test('amb la botiga de Chrome configurada, el botó és un enllaç a una pestanya nova', () => {
  estat.capa = { snippetChromeUrl: BOTIGA };
  render(<FitxaSnippet />);
  const enllac = screen.getByRole('link', { name: /Instal·la a Chrome/ });
  expect(enllac.getAttribute('href')).toBe(BOTIGA);
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
  expect(enllac.hasAttribute('download')).toBe(false);
  expect(enllac.className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran sdp-btn-ample');
  expect(within(enllac).getByText('(s’obri en una pestanya nova)').className).toBe('sdp-nomes-lector');
  expect(screen.queryByRole('button', { name: 'Instal·la a Chrome' })).toBeNull();
  expect(screen.queryByText('Encara no està publicada')).toBeNull();
});

test('amb un .zip del mateix origen, el botó el descarrega sense obrir cap pestanya', () => {
  estat.capa = { snippetChromeUrl: 'https://poble.test/extensio/snippet.zip' };
  render(<FitxaSnippet />);
  const enllac = screen.getByRole('link', { name: 'Descarrega l’extensió' });
  expect(enllac.getAttribute('href')).toBe('https://poble.test/extensio/snippet.zip');
  expect(enllac.hasAttribute('download')).toBe(true);
  expect(enllac.hasAttribute('target')).toBe(false);
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
});

/* Correcció de la revisió · Entre orígens el navegador no fa cas de
   `download`: l'enllaç s'obri a part i el fitxer arriba com qualsevol .zip. */
test('un .zip d’un altre origen s’obri en una pestanya nova', () => {
  estat.capa = { snippetChromeUrl: 'https://paquets.test/snippet.zip' };
  render(<FitxaSnippet />);
  const enllac = screen.getByRole('link', { name: /Descarrega l’extensió/ });
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
  expect(within(enllac).getByText('(s’obri en una pestanya nova)')).toBeTruthy();
});

/* Correcció de la revisió · Un .zip no s'instal·la sol: la fitxa diu com
   carregar-lo a Chrome, i el primer pas ja no diu «Instal·la». */
test('amb un .zip, «Com funciona» explica com carregar-lo desempaquetat abans de fer-lo servir', () => {
  estat.capa = { snippetChromeUrl: 'https://poble.test/extensio/snippet.zip' };
  render(<FitxaSnippet />);
  const passos = within(screen.getByRole('heading', { level: 2, name: 'Com funciona' }).closest('section'))
    .getAllByRole('listitem').map((li) => li.textContent);
  expect(passos).toHaveLength(4);
  expect(passos[0]).toMatch(/^Descarrega el Snippet amb el botó d’esta pàgina i descomprimix el fitxer/);
  expect(passos[1]).toMatch(/chrome:\/\/extensions/);
  expect(passos[1]).toMatch(/mode de desenvolupador/);
  expect(passos[1]).toMatch(/extensió desempaquetada/);
  expect(passos[3]).toMatch(/prem «Desar»/);
  expect(passos.some((pas) => pas.startsWith('Instal·la'))).toBe(false);
});

test('una URL que no és https, que no és una adreça o que és un .crx no activa el botó', () => {
  for (const url of ['http://paquets.test/snippet.zip', 'javascript:alert(1)', 'chromewebstore', 'https://paquets.test/snippet.crx']) {
    estat.capa = { snippetChromeUrl: url };
    render(<FitxaSnippet />);
    expect(screen.getByRole('button', { name: 'Instal·la a Chrome' }).disabled, url).toBe(true);
    expect(screen.queryByRole('link'), url).toBeNull();
    cleanup();
  }
});
