/* Onada 3B (captures 19.41.49, 19.41.58 i 19.42.17) · Les vistes que encara
   no fan res: la fila de títol calcada de cada captura, els controls inerts
   (aria-disabled i «En construcció» en prémer-los) i la targeta honesta. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Phone } from 'lucide-react';
import VistaEnConstruccio, { VISTES_EN_CONSTRUCCIO, textosDeVista } from './VistaEnConstruccio.jsx';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

test('textosDeVista: les tres vistes en construcció, i res per a les altres', () => {
  expect(Object.keys(VISTES_EN_CONSTRUCCIO)).toEqual(['telefonades', 'multimedia', 'destacats']);
  expect(textosDeVista('comunitats', t)).toBeNull();
  expect(textosDeVista('telefonades', t)).toEqual(expect.objectContaining({
    accio: { tipus: 'nou', etiqueta: 'Nova telefonada' }, cerca: "Nom, número o @nom d'usuari", segments: null, subtitol: ''
  }));
  expect(textosDeVista('multimedia', t)).toEqual(expect.objectContaining({
    accio: null,
    /* Captura 19.41.58: cap cercador en píndola; la cerca és una icona. */
    cerca: '',
    subtitol: 'Contingut multimèdia de totes les converses',
    segments: { etiqueta: 'Tipus de contingut', opcions: ['Fitxers', 'Enllaços', 'Documents'] }
  }));
  expect(textosDeVista('multimedia', t).icones.map((i) => i.etiqueta)).toEqual(['Cerca', 'Ordena', 'Selecciona']);
  expect(textosDeVista('telefonades', t).icones).toEqual([]);
  expect(textosDeVista('destacats', t).icones).toEqual([]);
  expect(textosDeVista('destacats', t).accio).toEqual({ tipus: 'pindola', etiqueta: 'Editar' });
  /* Tradueix amb la clau: el t de l'app rep la clau i18n. */
  const tr = vi.fn((clau) => `«${clau}»`);
  expect(textosDeVista('destacats', tr).descripcio).toBe('«section.xat.vista.destacats.text»');
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

  const cerca = screen.getByRole('searchbox', { name: "Nom, número o @nom d'usuari" });
  expect(cerca.readOnly).toBe(true);
  expect(cerca.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(cerca);
  fireEvent.keyDown(cerca, { key: 'a' });
  fireEvent.keyDown(cerca, { key: 'Tab' });
  expect(onEnConstruccio).toHaveBeenCalledTimes(3);

  const targeta = screen.getByRole('region', { name: 'En construcció' });
  expect(targeta.textContent).toContain('Ací hi haurà les telefonades');
  expect(targeta.textContent).toContain('Encara no està disponible: es construirà en una fase següent del xat.');
  expect(within(targeta).getByRole('heading', { level: 3 }).textContent).toBe('En construcció');
  expect(document.querySelector('.sdp-xat-segments')).toBeNull();
});

test('Contingut multimèdia: la lupa, ordenar i seleccionar a la fila de títol, subtítol i control segmentat, tot inert', () => {
  const onEnConstruccio = vi.fn();
  render(<VistaEnConstruccio titol="Contingut multimèdia" {...textosDeVista('multimedia', t)} onEnConstruccio={onEnConstruccio} t={t} />);
  expect(screen.getByText('Contingut multimèdia de totes les converses').tagName).toBe('P');
  const grup = screen.getByRole('group', { name: 'Tipus de contingut' });
  const opcions = within(grup).getAllByRole('button');
  expect(opcions.map((b) => [b.textContent, b.getAttribute('aria-pressed'), b.getAttribute('aria-disabled')]))
    .toEqual([['Fitxers', 'true', 'true'], ['Enllaços', 'false', 'true'], ['Documents', 'false', 'true']]);
  opcions.forEach((b) => fireEvent.click(b));
  expect(onEnConstruccio).toHaveBeenCalledTimes(3);

  /* Captura 19.41.58: a la dreta de la fila de títol, tres icones (la lupa,
     ordenar i seleccionar), de 24 en cel·la de 44, enfocables i inertes. */
  const icones = within(document.querySelector('.app-grid-col-header')).getAllByRole('button');
  expect(icones.map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-disabled'), b.disabled])).toEqual([
    ['Cerca', 'true', false], ['Ordena', 'true', false], ['Selecciona', 'true', false]
  ]);
  expect(icones.map((b) => b.querySelector('svg').getAttribute('class'))).toEqual([
    'lucide lucide-search', 'lucide lucide-list-filter', 'lucide lucide-list-checks'
  ]);
  expect(icones.every((b) => b.classList.contains('sdp-xat-icona') && b.querySelector('svg').getAttribute('width') === '24')).toBe(true);
  icones.forEach((b) => fireEvent.click(b));
  expect(onEnConstruccio).toHaveBeenCalledTimes(6);
  /* I cap cercador en píndola. */
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(document.querySelector('.sdp-xat-cerca')).toBeNull();
});

test('el títol «En construcció» és un h3 amb la classe que li neutralitza el coixí editorial', () => {
  render(<VistaEnConstruccio titol="Destacats" {...textosDeVista('destacats', t)} t={t} />);
  const titol = screen.getByRole('heading', { level: 3, name: 'En construcció' });
  expect(titol.classList.contains('sdp-xat-construccio__titol')).toBe(true);
});

test('Destacats: la píndola «Editar» inert i el cercador', () => {
  const onEnConstruccio = vi.fn();
  render(<VistaEnConstruccio titol="Destacats" {...textosDeVista('destacats', t)} onEnConstruccio={onEnConstruccio} t={t} />);
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
  expect(screen.getByRole('region', { name: 'En construcció' }).querySelectorAll('p')).toHaveLength(1);
});
