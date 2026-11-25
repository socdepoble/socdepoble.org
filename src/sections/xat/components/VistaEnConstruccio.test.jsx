/* Onada 3B (captures 19.41.49 i 19.42.17) · Les vistes que encara no fan
   res: la fila de títol de cada captura de referència, els controls inerts
   (aria-disabled i «En construcció» en prémer-los) i la targeta honesta.
   Contingut multimèdia (captura 19.41.58) ja no n'és una: derogat per
   l'ordre del Mestre del 261004 (prompt 261004_0515). Les seues proves
   viuen a VistaMultimedia.test.jsx. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ListChecks, Phone, Search } from 'lucide-react';
import VistaEnConstruccio from './VistaEnConstruccio.jsx';
import { VISTES_EN_CONSTRUCCIO, textosDeVista } from './vistaEnConstruccioModel.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const AVIS_D17 = 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.';
const AVIS_GENERIC = 'Encara no està disponible: es construirà en una fase següent del xat.';

/* D17 (ordre del Mestre, 260930): el text de Telefonades té una sola font,
   VISTES_EN_CONSTRUCCIO.telefonades.avis, amb la clau nav.telefonades.avis.
   Destacats conserva l'avís genèric. */
test('D17 · textosDeVista: Telefonades porta el seu avís propi; Destacats ja no és en construcció (v1.2.25)', () => {
  expect(VISTES_EN_CONSTRUCCIO.telefonades.avis).toEqual(['nav.telefonades.avis', AVIS_D17]);
  expect(textosDeVista('telefonades', t).avis).toBe(AVIS_D17);
  expect(textosDeVista('destacats', t)).toBeNull();
  const tr = vi.fn((clau) => `«${clau}»`);
  expect(textosDeVista('telefonades', tr).avis).toBe('«nav.telefonades.avis»');
});

test('D17 · la targeta de Telefonades pinta el seu avís amb EstatBuit + Alerta; una vista genèrica, l’avís genèric', () => {
  const { unmount } = render(<VistaEnConstruccio titol="Telefonades" {...textosDeVista('telefonades', t)} t={t} />);
  const targeta = screen.getByRole('region', { name: 'En construcció' });
  expect(targeta.querySelector('.sdp-buit')).toBeTruthy();
  expect(targeta.querySelector('.sdp-alerta.sdp-xat-construccio__avis').textContent).toBe(AVIS_D17);
  expect(targeta.textContent).not.toContain(AVIS_GENERIC);
  unmount();
  render(<VistaEnConstruccio titol="Prova" descripcio="Text de prova" t={t} />);
  expect(screen.getByRole('region', { name: 'En construcció' }).querySelector('.sdp-xat-construccio__avis').textContent).toBe(AVIS_GENERIC);
});

/* v1.2.25 · Lot G1 · Destacats ja és operativa (VistaDestacats): només Telefonades queda en construcció. */
test('textosDeVista: només Telefonades és en construcció, i res per a les altres', () => {
  expect(Object.keys(VISTES_EN_CONSTRUCCIO)).toEqual(['telefonades']);
  expect(textosDeVista('comunitats', t)).toBeNull();
  expect(textosDeVista('multimedia', t)).toBeNull();
  expect(textosDeVista('destacats', t)).toBeNull();
  expect(textosDeVista('telefonades', t)).toEqual(expect.objectContaining({
    accio: { tipus: 'nou', etiqueta: 'Nova telefonada' }, cerca: 'Nom del contacte', segments: null, subtitol: ''
  }));
  expect(textosDeVista('telefonades', t).icones).toEqual([]);
  const tr = vi.fn((clau) => `«${clau}»`);
  expect(textosDeVista('telefonades', tr).descripcio).toBe('«section.xat.vista.telefonades.text»');
});

test('Telefonades: títol i «+» redó inert, cercador de només lectura i la targeta «En construcció»', () => {
  const onEnConstruccio = vi.fn();
  render(<VistaEnConstruccio titol="Telefonades" icona={Phone} {...textosDeVista('telefonades', t)} onEnConstruccio={onEnConstruccio} t={t} />);
  const capcalera = document.querySelector('.app-grid-col-header');
  expect(within(capcalera).getByText('Telefonades')).toBeTruthy();
  expect(capcalera.querySelector('svg.lucide-phone')).toBeTruthy();
  const nova = within(capcalera).getByRole('button', { name: 'Nova telefonada' });
  expect(nova.getAttribute('aria-disabled')).toBe('true');
  expect(nova.disabled).toBe(false);
  expect(nova.classList.contains('sdp-xat-nova')).toBe(true);
  fireEvent.click(nova);
  expect(onEnConstruccio).toHaveBeenCalledTimes(1);

  const cerca = screen.getByRole('searchbox', { name: 'Nom del contacte' });
  expect(cerca.readOnly).toBe(true);
  expect(cerca.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(cerca);
  fireEvent.keyDown(cerca, { key: 'a' });
  fireEvent.keyDown(cerca, { key: 'Tab' });
  expect(onEnConstruccio).toHaveBeenCalledTimes(3);

  const targeta = screen.getByRole('region', { name: 'En construcció' });
  expect(targeta.textContent).toContain('Ací hi haurà les telefonades');
  /* D17: Telefonades ja no porta l'avís genèric sinó el seu. */
  expect(targeta.textContent).toContain(AVIS_D17);
  expect(within(targeta).getByRole('heading', { level: 3 }).textContent).toBe('En construcció');
  expect(document.querySelector('.sdp-xat-segments')).toBeNull();
});

/* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): esta prova
   fixava Contingut multimèdia inerta. La vista ja és VistaMultimedia; ací
   queda el contracte de la peça: una vista en construcció amb icones,
   subtítol i segments els pinta tots inerts, amb el primer segment premut. */
test('amb icones, subtítol i segments (contracte de la peça): tot inert, el primer segment premut', () => {
  const onEnConstruccio = vi.fn();
  render(
    <VistaEnConstruccio
      titol="Prova"
      icones={[{ etiqueta: 'Cerca', Icona: Search }, { etiqueta: 'Selecciona', Icona: ListChecks }]}
      subtitol="Subtítol de prova"
      segments={{ etiqueta: 'Tipus', opcions: ['A', 'B'] }}
      onEnConstruccio={onEnConstruccio}
      t={t}
    />
  );
  expect(screen.getByText('Subtítol de prova').tagName).toBe('P');
  const opcions = within(screen.getByRole('group', { name: 'Tipus' })).getAllByRole('button');
  expect(opcions.map((b) => [b.textContent, b.getAttribute('aria-pressed'), b.getAttribute('aria-disabled'), b.classList.contains('sdp-xat-inert')]))
    .toEqual([['A', 'true', 'true', true], ['B', 'false', 'true', true]]);
  opcions.forEach((b) => fireEvent.click(b));
  expect(onEnConstruccio).toHaveBeenCalledTimes(2);
  const icones = within(document.querySelector('.app-grid-col-header')).getAllByRole('button');
  expect(icones.map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-disabled'), b.disabled])).toEqual([
    ['Cerca', 'true', false], ['Selecciona', 'true', false]
  ]);
  expect(icones.every((b) => b.classList.contains('sdp-xat-icona') && b.querySelector('svg').getAttribute('width') === '24')).toBe(true);
  icones.forEach((b) => fireEvent.click(b));
  expect(onEnConstruccio).toHaveBeenCalledTimes(4);
  expect(screen.queryByRole('searchbox')).toBeNull();
});

test('el títol «En construcció» té rol heading nivell 3 amb la classe canònica dins EstatBuit', () => {
  render(<VistaEnConstruccio titol="Telefonades" {...textosDeVista('telefonades', t)} t={t} />);
  const titol = screen.getByRole('heading', { level: 3, name: 'En construcció' });
  expect(titol.classList.contains('sdp-xat-construccio__titol')).toBe(true);
});

test('una vista amb acció píndola inert i cercador els pinta inerts', () => {
  const onEnConstruccio = vi.fn();
  render(<VistaEnConstruccio titol="Prova" accio={{ tipus: 'pindola', etiqueta: 'Editar' }} cerca="Cerca" onEnConstruccio={onEnConstruccio} t={t} />);
  const editar = screen.getByRole('button', { name: 'Editar' });
  expect(editar.classList.contains('sdp-xat-vista__pindola')).toBe(true);
  expect(editar.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(editar);
  expect(onEnConstruccio).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('searchbox', { name: 'Cerca' })).toBeTruthy();
});

test('sense textos, només el títol (amb el botó del rail a l’esquerra) i la targeta', () => {
  render(<VistaEnConstruccio titol="Prova" t={t} esquerra={<button type="button">Menú</button>} />);
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(screen.queryByRole('group')).toBeNull();
  expect(document.querySelector('.app-grid-col-header').firstElementChild.textContent).toBe('Menú');
  const regio = screen.getByRole('region', { name: 'En construcció' });
  expect(regio.querySelector('.sdp-buit')).toBeTruthy();
  expect(regio.querySelector('.sdp-alerta.sdp-xat-construccio__avis').textContent).toBe(AVIS_GENERIC);
});
