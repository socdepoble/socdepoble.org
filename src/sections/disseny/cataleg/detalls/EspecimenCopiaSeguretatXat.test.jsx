/* Onada R28 (pla 261115_0135, Lot C3; sdp-clon-whatsapp §4.4) · L'espècimen de
   les dos pàgines de la còpia `.sdpbackup` dels Ajustos del Xat: el catàleg el
   coneix (ítem del manifest amb 💾 i carregador), es munta sol (sense XatContext
   ni UIProvider), cada mostra es diu mostra i cap no promet restaurar; i el
   motor de veres no corre mai: ací se substituïx per uns que fallen si algú
   els crida, i tots els camins de les mostres (desar, compartir, l'error, la
   comprovació bona, la clau incorrecta i l'altre compte) acaben sense tocar-lo. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  desaArxiuCopiaSeguretatXat, descriuCopiaSeguretatXat, exportaCopiaSeguretatXatAmbRebut, importaCopiaSeguretatXat,
  llegixArxiuCopiaSeguretatXat,
} from '../../../../data/xat/copiaSeguretatPortatil.js';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import EspecimenCopiaSeguretatXat from './EspecimenCopiaSeguretatXat.jsx';

/* El motor de veres, prohibit: cada funció falla si l'espècimen la crida. */
vi.mock('../../../../data/xat/copiaSeguretatPortatil.js', async (importOriginal) => {
  const original = await importOriginal();
  const prohibida = (nom) => vi.fn(() => { throw new Error(`L’espècimen ha cridat el motor de veres: ${nom}`); });
  return {
    ...original,
    exportaCopiaSeguretatXatAmbRebut: prohibida('exporta'),
    desaArxiuCopiaSeguretatXat: prohibida('desa'),
    llegixArxiuCopiaSeguretatXat: prohibida('llegix'),
    descriuCopiaSeguretatXat: prohibida('descriu'),
    importaCopiaSeguretatXat: prohibida('importa'),
  };
});

const CONTRASENYA = 'una frase de prova 2026';
const MOTOR_DE_VERES = [
  exportaCopiaSeguretatXatAmbRebut, desaArxiuCopiaSeguretatXat, llegixArxiuCopiaSeguretatXat,
  descriuCopiaSeguretatXat, importaCopiaSeguretatXat,
];

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  for (const funcio of MOTOR_DE_VERES) funcio.mockClear();
  expect(crides).toEqual([]);
});

/* La mostra que porta el títol `titol` (l'h4 «Mostra · …» i la caixa de després). */
function mostra(titol) {
  return screen.getByRole('heading', { level: 4, name: `Mostra · ${titol}` }).nextElementSibling;
}

function capCridaAlMotorDeVeres() {
  for (const funcio of MOTOR_DE_VERES) expect(funcio).not.toHaveBeenCalled();
}

async function preparaLaCopia(caixa) {
  fireEvent.change(within(caixa).getByLabelText('Contrasenya de la còpia'), { target: { value: CONTRASENYA } });
  fireEvent.change(within(caixa).getByLabelText('Repetix la contrasenya'), { target: { value: CONTRASENYA } });
  fireEvent.click(within(caixa).getByRole('button', { name: 'Prepara la còpia' }));
}

/* Un fitxer triat que el motor de mostra no ha de llegir. */
function triaUnArxiu(caixa) {
  const arrayBuffer = vi.fn(async () => new ArrayBuffer(4));
  fireEvent.change(within(caixa).getByLabelText('Arxiu de la còpia'), {
    target: { files: [{ name: 'casa.sdpbackup', size: 4, arrayBuffer }] }
  });
  return arrayBuffer;
}

test('el catàleg el coneix: l’ítem del manifest amb 💾 i el carregador', () => {
  expect(CATALOG_ITEMS.find((i) => i.id === 'superposicions-xat-copia-seguretat'))
    .toMatchObject({ detailKey: 'superposicions/xat-copia-seguretat', icon: '💾', title: 'Xat · Còpia de seguretat' });
  expect(CATALOG_DETAIL_LOADERS['superposicions/xat-copia-seguretat']).toBeTruthy();
});

test('es munta sol, cada mostra es diu mostra, diu que el motor és de mostra i cap no promet restaurar', () => {
  const { container } = render(<EspecimenCopiaSeguretatXat />);
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  expect([...container.querySelectorAll('.sdp-especimen__nom')].map((n) => n.textContent))
    .toEqual(['CosCopiaSeguretatXat · Desa', 'CosCopiaSeguretatXat · Comprova']);
  const descripcions = [...container.querySelectorAll('.sdp-especimen > p')].map((p) => p.textContent);
  expect(descripcions).toHaveLength(2);
  for (const text of descripcions) {
    expect(text).toMatch(/motor de mostra/);
    expect(text).toMatch(/encara no és possible/);
  }
  const titols = [...container.querySelectorAll('.sdp-especimen__viu > h4')].map((h) => h.textContent);
  expect(titols).toHaveLength(10);
  expect(titols.every((titol) => titol.startsWith('Mostra · '))).toBe(true);
  /* Les mostres sense tocar res: el recompte, el buit, l'app sense full de compartir i sense compte. */
  expect(within(mostra('Al navegador (es pot tocar)')).getByText('Converses: 3 · Missatges: 47')).toBeTruthy();
  expect(within(mostra('Cap conversa carregada')).getByText('Este dispositiu encara no té cap conversa carregada: no hi ha res per a copiar.')).toBeTruthy();
  expect(within(mostra('Cap conversa carregada')).queryByRole('button')).toBeNull();
  const senseFull = mostra('Dins de l’app, sense full de compartir');
  expect(within(senseFull).getByText(/^En l’app d’este mòbil no es pot desar l’arxiu de la còpia/)).toBeTruthy();
  expect(within(senseFull).queryByLabelText('Contrasenya de la còpia')).toBeNull();
  expect(screen.getAllByText('Entra al xat amb el teu compte per a fer o comprovar una còpia.')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: /restaura/i })).toBeNull();
  capCridaAlMotorDeVeres();
});

test('Desa al navegador: prepara la còpia i el pas 2 diu el text de l’app, amb el motor de mostra', async () => {
  render(<EspecimenCopiaSeguretatXat />);
  const caixa = mostra('Al navegador (es pot tocar)');
  await preparaLaCopia(caixa);
  const boto = await within(caixa).findByRole('button', { name: 'Desa l’arxiu' });
  expect(within(caixa).getByText('Còpia xifrada preparada')).toBeTruthy();
  fireEvent.click(boto);
  expect(await within(caixa).findByText(/^Ha començat la descàrrega de l’arxiu socdepoble-xat-20261115-0230\.sdpbackup\./)).toBeTruthy();
  /* La nota de davall diu el que el motor de mostra ha fet de veres. */
  expect(caixa.nextElementSibling.textContent).toMatch(/no desa ni descarrega cap arxiu/);
  capCridaAlMotorDeVeres();
});

test('Desa dins de l’app: «Comparteix l’arxiu» i el full tancat sense guardar', async () => {
  render(<EspecimenCopiaSeguretatXat />);
  const caixa = mostra('Dins de l’app, amb el full de compartir (es pot tocar)');
  await preparaLaCopia(caixa);
  fireEvent.click(await within(caixa).findByRole('button', { name: 'Comparteix l’arxiu' }));
  expect(await within(caixa).findByText('Has cancel·lat: no s’ha desat cap arxiu.')).toBeTruthy();
  capCridaAlMotorDeVeres();
});

test('Desa amb un error del motor: l’avís d’error de la pàgina, sense cap botó de desar', async () => {
  render(<EspecimenCopiaSeguretatXat />);
  const caixa = mostra('El motor no pot fer la còpia (es pot tocar)');
  await preparaLaCopia(caixa);
  expect(await within(caixa).findByText('La còpia seria massa gran per a un sol arxiu. No s’ha desat res.')).toBeTruthy();
  expect(within(caixa).queryByRole('button', { name: 'Desa l’arxiu' })).toBeNull();
  capCridaAlMotorDeVeres();
});

test('Comprova: el motor de mostra no llig l’arxiu triat i el resum diu converses, missatges, dates i que no es restaura', async () => {
  render(<EspecimenCopiaSeguretatXat />);
  const caixa = mostra('Una còpia que s’obri (es pot tocar)');
  const arrayBuffer = triaUnArxiu(caixa);
  expect(await within(caixa).findByText('Arxiu triat: casa.sdpbackup')).toBeTruthy();
  expect(arrayBuffer).not.toHaveBeenCalled();
  fireEvent.change(within(caixa).getByLabelText('Contrasenya de la còpia'), { target: { value: CONTRASENYA } });
  fireEvent.click(within(caixa).getByRole('button', { name: 'Comprova la còpia' }));
  expect(await within(caixa).findByText('La còpia s’obri i està intacta')).toBeTruthy();
  expect(within(caixa).getByText('Converses: 3 · Missatges: 47')).toBeTruthy();
  expect(within(caixa).getByText(/^Missatges del .+ al .+$/)).toBeTruthy();
  expect(within(caixa).getByText(/^Còpia feta el .+$/)).toBeTruthy();
  expect(within(caixa).getByText('Restaurar una còpia dins de l’app encara no és possible: ara la pots desar i comprovar.')).toBeTruthy();
  capCridaAlMotorDeVeres();
});

test('Comprova: la clau incorrecta va al camp de la contrasenya i l’altre compte, al de l’arxiu', async () => {
  render(<EspecimenCopiaSeguretatXat />);
  const clau = mostra('La contrasenya no obri la còpia (es pot tocar)');
  triaUnArxiu(clau);
  await within(clau).findByText('Arxiu triat: casa.sdpbackup');
  const control = within(clau).getByLabelText('Contrasenya de la còpia');
  fireEvent.change(control, { target: { value: CONTRASENYA } });
  fireEvent.click(within(clau).getByRole('button', { name: 'Comprova la còpia' }));
  expect(await within(clau).findByText(/^Esta contrasenya no obri la còpia/)).toBeTruthy();
  expect(control.getAttribute('aria-invalid')).toBe('true');

  const altre = mostra('Una còpia d’un altre compte (es pot tocar)');
  triaUnArxiu(altre);
  expect(await within(altre).findByText('Esta còpia és d’un altre compte o d’un altre poble.')).toBeTruthy();
  expect(within(altre).getByLabelText('Arxiu de la còpia').getAttribute('aria-invalid')).toBe('true');
  expect(within(altre).getByText('Cap arxiu triat')).toBeTruthy();
  capCridaAlMotorDeVeres();
});
