/* Gestoria · VistaPreviaFull: el full maquetat com una taula HTML que imita
   el de la gestoria, fila per fila i amb les cel·les combinades. Dades
   sintètiques: empreses fictícies i CIF calculats. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { maquetaFull } from './nucli/fullModel.js';
import { crearFactura } from './nucli/model.js';
import { PLANTILLA_GESTORIA, PLANTILLA_VERDA_ANTIGA } from './nucli/plantilla.js';
import VistaPreviaFull, { combinacionsPerFila, textCel } from './VistaPreviaFull.jsx';

afterEach(cleanup);

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const DADES = {
  titular: 'Cooperativa Exemple del Poble',
  any: 2026,
  t: 3,
  ingressos: [crearFactura({
    tipus: 'ingres', data: '10/08/2026', num: 'F26-0003', contrapart: 'Exemple Distribucions SL', nif: cif('B', '7100008'),
    descripcio: 'Taller de pedra seca', subtotal: 20000, iva: 4200, total: 24200
  })],
  despeses: [crearFactura({
    tipus: 'despesa', data: '28/07/2026', num: 'EL-2026-07', contrapart: 'Exemple Llum SL', nif: cif('B', '7100001'),
    descripcio: 'Subministrament elèctric', subtotal: 10000, iva: 2100, total: 12100
  })]
};
const FULL = maquetaFull(PLANTILLA_GESTORIA, DADES);

describe('VistaPreviaFull', () => {
  test('una fila HTML per fila del full, dins d’una regió amb nom', () => {
    const { container } = render(<VistaPreviaFull full={FULL} titol="Vista prèvia del full del 3T de 2026" />);
    const regio = screen.getByRole('region', { name: 'Vista prèvia del full del 3T de 2026' });
    expect(regio.getAttribute('tabindex')).toBe('0');
    expect(container.querySelectorAll('tr')).toHaveLength(FULL.files.length);
  });

  test('el títol i les barres ocupen tota la fila; les barres són capçaleres de grup', () => {
    const { container } = render(<VistaPreviaFull full={FULL} />);
    const titol = container.querySelector('tr.sdp-gestoria-full__titol > td');
    expect(titol.textContent).toBe('Cooperativa Exemple del Poble - 01/07/2026 - 30/09/2026 - 3T');
    expect(titol.colSpan).toBe(8);
    const barres = [...container.querySelectorAll('tr.sdp-gestoria-full__barra > th')];
    expect(barres.map((th) => [th.textContent, th.getAttribute('scope'), th.colSpan])).toEqual([
      ['INGRESSOS', 'colgroup', 8], ['GASTOS', 'colgroup', 8]
    ]);
  });

  test('capçaleres de columna, dades amb el format del full i totals', () => {
    const { container } = render(<VistaPreviaFull full={FULL} />);
    const columnes = screen.getAllByRole('columnheader').filter((th) => th.getAttribute('scope') === 'col');
    expect(columnes).toHaveLength(16);
    const [ingressos, despeses] = [...container.querySelectorAll('tr.sdp-gestoria-full__capcalera')]
      .map((tr) => [...tr.children].map((th) => th.textContent));
    expect(ingressos).toEqual(['Data', 'Núm', 'Client', 'NIF - CIF', 'Descripció', 'Subtotal', 'IVA', 'Total']);
    expect(despeses[2]).toBe('Proveïdor');
    const fila = screen.getByText('F26-0003').closest('tr');
    expect(fila.className).toBe('sdp-gestoria-full__dada');
    expect(within(fila).getByText('10/08/26').getAttribute('data-tipus')).toBe('data');
    expect(within(fila).getByText('242,00 €').getAttribute('data-tipus')).toBe('import');
    const totals = [...document.querySelectorAll('tr.sdp-gestoria-full__totals')];
    expect(totals.map((tr) => tr.textContent)).toEqual(['Totals200,00 €42,00 €242,00 €', 'Totals100,00 €21,00 €121,00 €']);
  });

  test('les files buides no compten per al lector de pantalla', () => {
    const { container } = render(<VistaPreviaFull full={FULL} />);
    const buides = [...container.querySelectorAll('tr.sdp-gestoria-full__buida')];
    expect(buides).toHaveLength(FULL.files.filter((f) => f.rol === 'buida').length);
    for (const tr of buides) expect(tr.getAttribute('aria-hidden')).toBe('true');
  });

  test('una altra plantilla també es pinta, amb la seua fila de títol solta', () => {
    const verda = maquetaFull(PLANTILLA_VERDA_ANTIGA, DADES);
    const { container } = render(<VistaPreviaFull full={verda} />);
    expect(container.querySelectorAll('tr')).toHaveLength(verda.files.length);
    expect(screen.getByText('2026-FACTURACIO-Cooperativa_Exemple_del_Poble')).toBeTruthy();
  });

  test('sense full, no pinta res', () => {
    const { container } = render(<VistaPreviaFull full={null} />);
    expect(container.childElementCount).toBe(0);
  });
});

describe('ajudants', () => {
  test('combinacionsPerFila llig els rangs d’una fila i descarta els altres', () => {
    const mapa = combinacionsPerFila(['A1:H1', 'B4:C4', 'A2:B3', 'brossa']);
    expect([...mapa]).toEqual([[0, [{ inici: 0, fi: 7 }]], [3, [{ inici: 1, fi: 2 }]]]);
    expect(combinacionsPerFila(null).size).toBe(0);
  });

  test('textCel escriu com el full: data curta, import amb euro i buit si no hi ha valor', () => {
    expect(textCel({ tipus: 'data', valor: { a: 2026, m: 7, d: 1 } }, { dataText: 'dd/mm/aa' })).toBe('01/07/26');
    expect(textCel({ tipus: 'import', valor: -1250 }, {})).toBe('-12,50 €');
    expect(textCel({ tipus: 'text', valor: 'x' }, {})).toBe('x');
    expect(textCel({ tipus: 'import', valor: null }, {})).toBe('');
    expect(textCel(null, {})).toBe('');
  });
});
