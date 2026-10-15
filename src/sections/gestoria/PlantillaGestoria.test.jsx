/* Gestoria · PlantillaGestoria: la secció «Plantilla Gestoria» del Quadre de
   comandament (ordre del Mestre, 14-10-2026, prompt 261014_2015, punt 3).
   Els entregables són de veres (generaEntregables amb el subtle de webcrypto),
   com els que el Full trimestral passa pel cable després de la segona
   aprovació. Empreses fictícies i CIF calculats; cap dada de cap persona. Els
   patrons es componen a trossos perquè les portes que llegixen src/ no els
   troben ací. */
import { createHash, webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TIPUS_XLSX, generaEntregables } from './nucli/entregables.js';
import { crearFactura } from './nucli/model.js';
import { PlantillaGestoria } from './PlantillaGestoria.jsx';
import font from './PlantillaGestoria.jsx?raw';
import { combinacionsPerFila, textCel } from './VistaPreviaFull.jsx';

afterEach(cleanup);

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const TITULAR = 'Cooperativa Exemple del Poble';
const NIF_CLIENT = cif('B', '7100008');
const NIF_PROVEIDOR = cif('B', '7100001');
const PROPOSTA = Object.freeze({
  titular: TITULAR,
  any: 2026,
  t: 3,
  ingressos: [crearFactura({
    tipus: 'ingres', data: '10/08/2026', num: 'F26-0003', contrapart: 'Exemple Distribucions SL', nif: NIF_CLIENT,
    descripcio: 'Taller de pedra seca', subtotal: 20000, iva: 4200, total: 24200
  })],
  despeses: [crearFactura({
    tipus: 'despesa', data: '28/07/2026', num: 'EL-2026-07', contrapart: 'Exemple Llum SL', nif: NIF_PROVEIDOR,
    descripcio: 'Subministrament elèctric', subtotal: 10000, iva: 2100, total: 12100
  })]
});
const ENTREGABLES = await generaEntregables({ proposta: PROPOSTA, subtle: webcrypto.subtle });
/* El cable de PanellGestoria.jsx amb el full generat. */
const CABLE = Object.freeze({
  any: 2026, t: 3, titular: TITULAR, factures: [...PROPOSTA.ingressos, ...PROPOSTA.despeses], historial: [], entregables: ENTREGABLES
});
const NOM_XLSX = '2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_3T.xlsx';
const NOM_CANONIC = /^\d{4}-FACTURACIO-[\w-]+_-_[1-4]T\.xlsx$/;

function munta(props = {}) {
  const descarrega = vi.fn();
  const onObreFull = vi.fn();
  const vista = render(<PlantillaGestoria full={CABLE} descarrega={descarrega} onObreFull={onObreFull} {...props} />);
  return { ...vista, descarrega, onObreFull };
}
const boto = (nom) => screen.getByRole('button', { name: nom });
const BOTO_CORREU = 'Prepara el correu per a la gestoria';
const serialitza = (node) => new XMLSerializer().serializeToString(node);
const encapcalament = new RegExp(['<h', '[1-6][\\s>]'].join(''));

describe('sense cap full generat', () => {
  test.each([
    ['sense cable', null],
    ['amb la proposta però sense generar', { ...CABLE, entregables: null }]
  ])('%s: l’estat buit porta al Full trimestral i no hi ha cap taula', (_, full) => {
    const { container, onObreFull, descarrega } = munta({ full });
    expect(screen.getByText('Encara no hi ha cap full generat')).toBeTruthy();
    expect(screen.getByText(/analitza el trimestre, revisa la proposta i prem «Genera el full»/)).toBeTruthy();
    expect(container.querySelector('table')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Descarrega l’XLSX' })).toBeNull();
    fireEvent.click(boto('Obri el Full trimestral'));
    expect(onObreFull).toHaveBeenCalledTimes(1);
    expect(onObreFull).toHaveBeenCalledWith();
    expect(descarrega).not.toHaveBeenCalled();
  });

  test('sense onObreFull, cap botó', () => {
    render(<PlantillaGestoria full={null} descarrega={vi.fn()} />);
    expect(screen.getByText('Encara no hi ha cap full generat')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toEqual([]);
  });
});

describe('amb el full generat i l’ull tancat', () => {
  test('cap cel·la del full arriba al DOM: ni imports, ni NIF, ni noms, ni el titular', () => {
    const { container } = munta();
    expect(container.querySelector('table')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByText('Full amagat')).toBeTruthy();
    expect(screen.getByText('Prem l’ull de la boina per a veure’l: el full porta imports, noms i NIF.')).toBeTruthy();
    expect(screen.getByText('El full generat del 3T de 2026: és el que es descarrega i s’adjunta.')).toBeTruthy();
    const serialitzat = serialitza(container);
    for (const prohibit of [TITULAR, NIF_CLIENT, NIF_PROVEIDOR, 'Exemple Distribucions SL', 'Exemple Llum SL', 'Taller de pedra seca']) {
      expect(serialitzat, prohibit).not.toContain(prohibit);
    }
    expect(serialitzat).not.toContain('€');
    expect(serialitzat).not.toMatch(/\d,\d{2}/);
    // Cap cel·la amb dades del full (títol, files i totals), tal com la pinta la vista prèvia.
    const deDades = ENTREGABLES.full.files.filter((fila) => ['titol', 'dada', 'totals'].includes(fila.rol));
    for (const fila of deDades) {
      for (const cel of fila.celles) {
        const text = textCel(cel, ENTREGABLES.full.formats);
        if (text !== '' && text !== 'Totals') expect(serialitzat, text).not.toContain(text);
      }
    }
    /* El nom canònic del fitxer porta el titular en forma de slug: es veu amb l'ull tancat perquè és el que es
       descarrega i s'adjunta (disseny arbitrat de la tanda). Ho diu esta asserció, perquè no passe per alt. */
    expect(serialitzat).toContain(NOM_XLSX);
  });

  test('sense encapçalament propi: el títol de la secció el posa el Quadre de comandament', () => {
    const { container } = munta();
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });
});

describe('amb l’ull obert', () => {
  test('la taula és el full generat, cel·la per cel·la, amb INGRESSOS i GASTOS', () => {
    const { container } = munta({ visible: true });
    const regio = screen.getByRole('region', { name: 'Taula · Plantilla Gestoria' });
    const files = [...regio.querySelectorAll('tr')];
    expect(files).toHaveLength(ENTREGABLES.full.files.length);
    const combinades = combinacionsPerFila(ENTREGABLES.full.combinacions);
    ENTREGABLES.full.files.forEach((fila, i) => {
      const esperades = fila.celles.map((cel) => textCel(cel, ENTREGABLES.full.formats));
      const reals = [...files[i].children].map((cel) => cel.textContent);
      if (combinades.has(i)) expect(reals, `fila ${i + 1}`).toEqual([esperades[0]]);
      else expect(reals, `fila ${i + 1}`).toEqual(esperades);
    });
    expect(within(regio).getByText('INGRESSOS')).toBeTruthy();
    expect(within(regio).getByText('GASTOS')).toBeTruthy();
    expect(within(regio).getByText(`${TITULAR} - 01/07/2026 - 30/09/2026 - 3T`)).toBeTruthy();
    expect(within(regio).getByText(NIF_PROVEIDOR)).toBeTruthy();
    expect(screen.queryByText('Full amagat')).toBeNull();
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });
});

describe('la descàrrega', () => {
  test('un clic descarrega els bytes exactes de la segona aprovació, amb el nom canònic, també amb l’ull tancat', () => {
    const { descarrega } = munta();
    fireEvent.click(boto('Descarrega l’XLSX'));
    expect(descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
    expect(nom).toMatch(NOM_CANONIC);
    expect(nom).toBe(ENTREGABLES.xlsx.nom);
    expect(nom).toBe(NOM_XLSX);
    expect(tipus).toBe(ENTREGABLES.xlsx.tipus);
    expect(tipus).toBe(TIPUS_XLSX);
    expect(dades).toEqual(ENTREGABLES.xlsx.dades);
    expect(createHash('sha256').update(dades).digest('hex')).toBe(ENTREGABLES.empremtes.xlsx);
    expect(screen.getByRole('status').textContent).toBe(`S’ha descarregat «${NOM_XLSX}».`);
    expect(screen.getByText(NOM_XLSX).tagName).toBe('CODE');
  });

  test('si el navegador no deixa descarregar, l’anunci ho diu', () => {
    const descarrega = vi.fn(() => {
      throw new Error('Descàrrega bloquejada.');
    });
    munta({ descarrega });
    fireEvent.click(boto('Descarrega l’XLSX'));
    expect(descarrega).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent)
      .toBe(`No s’ha pogut descarregar «${NOM_XLSX}»: este navegador no deixa descarregar fitxers generats.`);
  });
});

describe('el correu per a la gestoria', () => {
  test('«Prepara el correu» commuta aria-expanded i mostra el correu amb l’adjunt pel nom', () => {
    munta();
    const prepara = boto(BOTO_CORREU);
    expect(prepara.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('heading', { name: BOTO_CORREU })).toBeNull();

    fireEvent.click(prepara);
    expect(prepara.getAttribute('aria-expanded')).toBe('true');
    const correu = screen.getByRole('heading', { level: 4, name: BOTO_CORREU }).closest('section');
    expect(document.getElementById(prepara.getAttribute('aria-controls')).contains(correu)).toBe(true);
    expect(within(correu).getByRole('heading', { level: 5, name: 'Vista prèvia' })).toBeTruthy();
    expect(within(correu).getByText(new RegExp(`^${NOM_XLSX.replace(/\./g, '\\.')} \\(`))).toBeTruthy();
    expect(within(correu).getByRole('textbox', { name: /Nom per a l'assumpte/ }).value).toBe(TITULAR);
    expect(within(correu).getByText(/Full del 3T de 2026\./)).toBeTruthy();

    fireEvent.click(prepara);
    expect(prepara.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('heading', { name: BOTO_CORREU })).toBeNull();
  });

  test('la tercera aprovació continua intacta: sense revisar el full, el correu no descarrega res', () => {
    const { descarrega } = munta();
    fireEvent.click(boto(BOTO_CORREU));
    const correu = screen.getByRole('heading', { level: 4, name: BOTO_CORREU }).closest('section');
    fireEvent.click(within(correu).getByRole('button', { name: 'Descarrega l\'esborrany (.eml)' }));
    expect(descarrega).not.toHaveBeenCalled();
    expect(within(correu).getByRole('checkbox', { name: /He revisat el full i l'adjunt/ }).checked).toBe(false);
  });

  test('uns entregables nous tanquen el correu obert i esborren l’anunci', () => {
    const descarrega = vi.fn();
    const { rerender } = render(<PlantillaGestoria full={CABLE} descarrega={descarrega} />);
    fireEvent.click(boto('Descarrega l’XLSX'));
    fireEvent.click(boto(BOTO_CORREU));
    expect(screen.getByRole('heading', { level: 4, name: BOTO_CORREU })).toBeTruthy();

    rerender(<PlantillaGestoria full={{ ...CABLE, entregables: null }} descarrega={descarrega} />);
    expect(screen.getByText('Encara no hi ha cap full generat')).toBeTruthy();
    rerender(<PlantillaGestoria full={CABLE} descarrega={descarrega} />);
    expect(boto(BOTO_CORREU).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('heading', { name: BOTO_CORREU })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('el codi', () => {
  test('cap style= ni encapçalament, i no genera ni aprova res: només importa la UI que mostra els entregables', () => {
    expect(/\sstyle=[{"]/.test(font)).toBe(false);
    expect(encapcalament.test(font)).toBe(false);
    const especificadors = [...font.matchAll(/\bfrom\s*'([^']+)'/g)].map((m) => m[1]);
    expect(especificadors).toEqual([
      'react', 'lucide-react', '../../components/PedraSeca/atoms/Boto.jsx', '../../components/PedraSeca/atoms/estats.jsx',
      './enviament/EnviamentGestoria.jsx', './PanellGestoria.jsx', './VistaPreviaFull.jsx'
    ]);
    const senseComentaris = font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(senseComentaris).not.toMatch(/maquetaFull|fullAXlsx|fullACsv|nomsFitxers|generaEntregables|aprovaProposta|PLANTILLA_GESTORIA/);
    // El nom del fitxer és el d'entregables.xlsx: no se'n compon cap.
    expect(senseComentaris).not.toMatch(/FACTURACIO/);
  });
});
