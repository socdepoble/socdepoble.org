/* P0-31 / IDEA-121 (Onada R10, K1, 2a ronda; troballa K1V-T6) · La fitxa d'un article importat de WordPress
   ja no torna al mode del Mur (/mur?revisio=wordpress): torna a «📥 Importació i Revisió Editorial»
   d'«🛡️ Administració del sistema» a /el-meu-perfil, per l'enrutador de l'App i en la llengua de la
   interfície (els cinc diccionaris). */
import { FONTS_PER_IDIOMA } from '../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { BrowserRouter } from '../../app/contexts/RouterContext.jsx';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import * as perfilModel from '../profile/perfilModel.js';
import { buildMurDetailSectionMeta } from './detailSectionMeta.jsx';

const CLAU = 'section.detail.mur.revisioWp.tornaBancada';
const RESERVA = '← Tornar a Importació i Revisió Editorial';
const ITEM = Object.freeze({
  id: 'wp-prova-1',
  esImportatWp: true,
  wp_id: 1,
  title: 'Article importat de prova',
  ruta_canonica: '/mur/wp-prova-1',
  source_url: 'https://socdepoble.net/article-de-prova/',
  created_at: '2020-01-01T00:00:00Z',
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

const pinta = (t) => render(<BrowserRouter>{buildMurDetailSectionMeta({ t }).renderBody(ITEM)}</BrowserRouter>);

test('la fitxa torna a l’apartat de la bancada d’«Administració del sistema», no al mode del Mur', () => {
  pinta((_clau, reserva) => reserva);
  const enllac = screen.getByRole('link', { name: RESERVA });
  const url = new URL(enllac.getAttribute('href'), 'https://socdepoble.org');
  expect(url.pathname).toBe('/el-meu-perfil');
  expect(url.searchParams.get(perfilModel.PARAM_FITXA_ORGANITZACIO)).toBe(perfilModel.ID_ADMINISTRACIO_SISTEMA);
  /* ?apartat= (IDEA-132): l'id ha de ser un apartat d'administració que pinte la bancada. */
  const apartat = url.searchParams.get(perfilModel.PARAM_APARTAT_PERFIL ?? 'apartat');
  const element = perfilModel.itemsDAdministracioSistema().find((item) => item.id === apartat);
  expect(element?.data?.vista).toBe('admin-importacio');
  const perfilShell = readFileSync(path.join(process.cwd(), 'src/sections/profile/PerfilShell.jsx'), 'utf8');
  expect(perfilShell).toMatch(/vista === 'admin-importacio'\)[^\n]*<BancImportacioEditorial \/>/);
  /* Mateix lloc i mateixa forma que el botó de tornada de R9 (Llei del Píxel). */
  expect(enllac.className).toBe('sdp-boto sdp-boto--secundari');
  expect(document.querySelector('a[href*="revisio=wordpress"]')).toBeNull();
});

test('«Tornar» navega dins de l’App (enrutador), sense recarregar la pàgina', () => {
  pinta((_clau, reserva) => reserva);
  fireEvent.click(screen.getByRole('link', { name: RESERVA }));
  expect(window.location.pathname).toBe('/el-meu-perfil');
  expect(new URLSearchParams(window.location.search).get('apartat')).toBe('admin-importacio');
});

test('el text de «Tornar» passa per la clau i18n i és als cinc diccionaris, traduït', () => {
  const claus = [];
  pinta((clau, reserva) => { claus.push(clau); return reserva; });
  expect(claus).toContain(CLAU);
  cleanup();
  const valencia = createTranslator('ca')(CLAU, '');
  expect(valencia).toBe(RESERVA);
  const llengues = SUPPORTED_LANGUAGES.map(({ code }) => code);
  expect(llengues).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
  for (const llengua of llengues) {
    const font = FONTS_PER_IDIOMA[llengua];
    expect(font.split(`'${CLAU}':`).length - 1, llengua).toBe(1);
    const text = createTranslator(llengua)(CLAU, '');
    expect(text.trim(), llengua).not.toBe('');
    if (llengua !== 'ca') expect(text, llengua).not.toBe(valencia);
    pinta(createTranslator(llengua));
    expect(screen.getByRole('link', { name: text }).getAttribute('href'), llengua).toContain('apartat=admin-importacio');
    cleanup();
  }
});
