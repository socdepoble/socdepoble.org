/* P1-12 pas 17 i IDEA-48 (pla 261101_1246, T7 · S7; Pedra Seca §9) · L'espècimen
   del xifratge per conversa i de «Persones de confiança»: el catàleg el coneix
   (registre en maqueta, ítem del manifest amb icona pròpia i carregador),
   es munta sol (sense UIProvider ni servei), diu que és una maqueta no activa,
   no importa cap mòdul del xifratge de src/data, i la marca de la mostra canvia.
   M02 (marató 261101_2143; disseny §4.4) · L'espècimen d'AvisClauCanviada (canvi
   fort, verificat i canviat, suau, alarma pròpia i bifurcació) i el número d'una
   clau nova sense confirmar. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenXatSeguretat from './EspecimenXatSeguretat.jsx';

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

test('el catàleg el coneix: les dues peces en maqueta, l’ítem del manifest amb 🔐 i el carregador', () => {
  expect(REGISTRE.find((e) => e.nom === 'CosSeguretatXat')).toMatchObject({ fitxer: 'sections/xat/components/CosSeguretatXat.jsx', estat: 'maqueta', fora: true });
  expect(REGISTRE.find((e) => e.nom === 'CosPersonesConfianca')).toMatchObject({ fitxer: 'sections/profile/CosPersonesConfianca.jsx', estat: 'maqueta', fora: true });
  expect(CATALOG_ITEMS.find((i) => i.id === 'superposicions-xat-seguretat')).toMatchObject({ detailKey: 'superposicions/xat-seguretat', icon: '🔐' });
  expect(CATALOG_DETAIL_LOADERS['superposicions/xat-seguretat']).toBeTruthy();
});

test('es munta sol, diu que és una maqueta no activa i pinta el número en 12 grups, sense h1 ni style=', () => {
  const { container } = render(<EspecimenXatSeguretat />);
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  expect([...container.querySelectorAll('.sdp-especimen__nom')].map((n) => n.textContent)).toEqual(['CosSeguretatXat', 'AvisClauCanviada', 'CosPersonesConfianca']);
  const descripcions = [...container.querySelectorAll('.sdp-especimen > p')].map((p) => p.textContent);
  expect(descripcions.every((text) => text.startsWith('Maqueta, encara no activa'))).toBe(true);
  expect(descripcions[0]).toMatch(/avui, el xat no és xifrat/);
  /* Cada mostra es diu maqueta: cap captura fora de context sembla un xat xifrat. */
  const titols = [...container.querySelectorAll('.sdp-especimen__viu > h4')].map((h) => h.textContent);
  expect(titols.length).toBe(21);
  expect(titols.every((titol) => titol.startsWith('Maqueta · '))).toBe(true);
  const numeros = screen.getAllByRole('group', { name: 'Número de seguretat' });
  expect(numeros.length).toBeGreaterThanOrEqual(3);
  for (const numero of numeros) {
    expect(numero.querySelectorAll('span')).toHaveLength(12);
    for (const grup of numero.querySelectorAll('span')) expect(grup.textContent).toMatch(/^\d{5}$/);
  }
  /* Els estats sense número: cap grup de xifres. */
  expect(screen.getByText('Calculant el número de seguretat…').getAttribute('role')).toBe('status');
  expect(screen.getByText(/^Pepa encara no ha activat els xats privats xifrats/)).toBeTruthy();
  expect(screen.getByText('Xat amb la IAIA: no està xifrat d’extrem a extrem.')).toBeTruthy();
});

test('la mostra que es pot tocar alterna «Marca com a verificat» i «Lleva la marca de verificat»', () => {
  const { container } = render(<EspecimenXatSeguretat />);
  const primera = container.querySelectorAll('.sdp-especimen__mostra')[0];
  fireEvent.click(within(primera).getByRole('button', { name: 'Marca com a verificat' }));
  expect(within(primera).getByText('Verificat: has comparat este número amb Pepa.')).toBeTruthy();
  fireEvent.click(within(primera).getByRole('button', { name: 'Lleva la marca de verificat' }));
  expect(within(primera).queryByText(/^Verificat:/)).toBeNull();
});

test('cap mòdul del xifratge de src/data: ni l’espècimen ni les peces que munta', () => {
  const arrel = process.cwd();
  for (const fitxer of [
    'src/sections/disseny/cataleg/detalls/EspecimenXatSeguretat.jsx',
    'src/sections/xat/components/CosSeguretatXat.jsx',
    'src/sections/xat/components/AvisClauCanviada.jsx',
    'src/sections/xat/estatXifratgeFil.js',
    'src/sections/profile/CosPersonesConfianca.jsx',
    'src/sections/profile/personesConfianca.js'
  ]) {
    const font = readFileSync(path.join(arrel, fitxer), 'utf8');
    expect(font, fitxer).not.toMatch(/from\s+['"][^'"]*data\/xifratXat/);
    expect(font, fitxer).not.toMatch(/from\s+['"][^'"]*backendPort/);
  }
});

test('M02 · les mostres dels canvis de clau: cada estat amb el seu text i els seus botons, i el suau es tanca', () => {
  const { container } = render(<EspecimenXatSeguretat />);
  const especimen = container.querySelector('#xat-canvi-clau');
  const mostres = [...especimen.querySelectorAll('.sdp-especimen__mostra')];
  expect(mostres).toHaveLength(5);
  const [fort, verificat, suau, alarma, bifurcacio] = mostres;
  expect(within(fort).getByText('Clau nova sense confirmar')).toBeTruthy();
  expect(within(fort).getByRole('button', { name: 'He parlat amb Pepa: continua' })).toBeTruthy();
  expect(within(fort).getByRole('button', { name: 'Número de seguretat' })).toBeTruthy();
  expect(within(verificat).getByText('Havies verificat Pepa i la seua clau ha canviat. Torna-la a verificar per a continuar.')).toBeTruthy();
  expect(within(alarma).getByRole('alert').textContent).toMatch(/^S’ha registrat una clau nova per al teu compte/);
  expect(within(alarma).queryByRole('button')).toBeNull();
  expect(within(bifurcacio).getByRole('alert').textContent).toBe('Les claus d’este xat no coincidixen entre aparells. Compareu el número de seguretat.');
  expect(within(bifurcacio).queryByRole('button')).toBeNull();
  expect(within(suau).getByText('La clau de seguretat de Pepa ha canviat i ho ha confirmat la seua clau anterior.')).toBeTruthy();
  fireEvent.click(within(suau).getByRole('button', { name: "Tancar l'avís" }));
  expect(suau.textContent).toBe('');
  /* El número d'una clau nova sense confirmar, a l'espècimen del cos: l'avís i les dues eixides. */
  const cos = container.querySelector('#xat-seguretat');
  const pendent = [...cos.querySelectorAll('.sdp-especimen__mostra')].find((mostra) => within(mostra).queryByRole('button', { name: 'He parlat amb Pepa: continua' }));
  expect(within(pendent).getByRole('group', { name: 'Número de seguretat' })).toBeTruthy();
  expect(within(pendent).getByRole('button', { name: 'Marca com a verificat' })).toBeTruthy();
  expect(within(pendent).getByText('Clau nova sense confirmar')).toBeTruthy();
});
