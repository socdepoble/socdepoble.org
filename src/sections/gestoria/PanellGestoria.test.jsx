/* Gestoria · PanellGestoria: els cinc passos sobre el tractor de veres, amb
   una carpeta sintètica servida per un selector de carpetes simulat (el
   contracte de File System Access que fa servir fontNavegador.js). Empreses
   fictícies, CIF calculats i adreces example.org; cap dada de cap persona. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../tests/helpers/autenticadorSimulat.js';
import { TIPUS_XLSX } from './nucli/entregables.js';
import { fullACsv, maquetaFull } from './nucli/fullModel.js';
import { crearFactura } from './nucli/model.js';
import { PLANTILLA_GESTORIA } from './nucli/plantilla.js';
import PanellGestoria, { estatTractorsDe } from './PanellGestoria.jsx';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from './tractors.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;

/* ── Dades sintètiques (com a useGestoria.test.jsx) ─────────────────────── */

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;
const bytes = (text) => new TextEncoder().encode(text);

const TITULAR = 'Cooperativa Exemple del Poble';
const historica = (dades) => crearFactura({ origen: { metode: 'manual' }, ...dades });
const FULL_2T = fullACsv(maquetaFull(PLANTILLA_GESTORIA, {
  titular: TITULAR,
  any: 2026,
  t: 2,
  ingressos: [],
  despeses: [4, 5, 6].map((m) => historica({
    tipus: 'despesa', data: { a: 2026, m, d: 28 }, num: `EL-2026-0${m}`, contrapart: 'Exemple Llum SL', nif: cif('B', '7100001'),
    descripcio: 'Subministrament elèctric', subtotal: 10000, iva: 2100, total: 12100
  }))
}));
const CSV_PROVEIDOR = [
  'Número de factura,7777777777',
  'Fecha de la factura,31 jul 2026',
  'Importe de la factura,"12,10 €"',
  '',
  'Descripción,Intervalo,Cantidad,Importe(€)',
  'Servei al núvol,1 jul 2026 - 31 jul 2026,1,"10,00"',
  'Subtotal en EUR,,,"10,00"',
  'I.V.A. (21%),,,"2,10"',
  'Total en EUR,,,"12,10"'
].join('\r\n');
const CARPETA = Object.freeze({
  '2026_2T/2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_2T.csv': bytes(FULL_2T),
  '2026_3T/7777777777.csv': bytes(CSV_PROVEIDOR)
});
const NOM_XLSX = '2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_3T.xlsx';

/* Un PDF d'una pàgina sense comprimir (com els de nucli/tractor.test.js): sense descompressor també es llig. */
function pdfPla(linies) {
  const contingut = linies.map((l, i) => `BT /F1 10 Tf 72 ${780 - i * 16} Td (${l.replace(/[\\()]/g, '\\$&')}) Tj ET`).join('\n');
  const objectes = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${contingut.length} >>\nstream\n${contingut}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  ];
  let text = '%PDF-1.7\n';
  const posicions = objectes.map((objecte) => {
    const posicio = text.length;
    text += objecte;
    return posicio;
  });
  const xref = `xref\n0 6\n0000000000 65535 f \n${posicions.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return bytes(`${text}${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${text.length}\n%%EOF\n`);
}
const PDF_DOLARS = pdfPla([
  'Example Cloud Inc', 'Invoice number INV-2026-0907', 'Invoice date: 30/08/2026',
  'Subtotal $20.00', 'VAT (21%) $4.20', 'Total $24.20'
]);

/* Un handle de carpeta en memòria, amb escriptura i permisos com els de Chrome. */
function handleDe(nom, fitxers, escrits) {
  const subcarpetes = new Map();
  const propis = new Map();
  for (const [ruta, dades] of Object.entries(fitxers)) {
    const tall = ruta.indexOf('/');
    if (tall < 0) propis.set(ruta, dades);
    else subcarpetes.set(ruta.slice(0, tall), { ...(subcarpetes.get(ruta.slice(0, tall)) ?? {}), [ruta.slice(tall + 1)]: dades });
  }
  const fills = new Map([...subcarpetes].map(([n, f]) => [n, handleDe(n, f, escrits)]));
  const fitxer = (n) => ({
    kind: 'file',
    name: n,
    getFile: async () => {
      const dades = propis.get(n);
      return { size: dades.length, lastModified: 0, arrayBuffer: async () => dades.slice().buffer };
    },
    createWritable: async () => ({
      write: async (dades) => {
        propis.set(n, dades);
        escrits.push({ carpeta: nom, nom: n, dades });
      },
      close: async () => {},
      abort: async () => {}
    })
  });
  const noTrobat = () => new DOMException('No hi és.', 'NotFoundError');
  return {
    kind: 'directory',
    name: nom,
    async *entries() {
      for (const n of propis.keys()) yield [n, fitxer(n)];
      for (const [n, h] of fills) yield [n, h];
    },
    async getDirectoryHandle(n) {
      if (!fills.has(n)) throw noTrobat();
      return fills.get(n);
    },
    async getFileHandle(n, { create = false } = {}) {
      if (!propis.has(n) && !create) throw noTrobat();
      if (!propis.has(n)) propis.set(n, new Uint8Array(0));
      return fitxer(n);
    },
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted'
  };
}

function entornAmbCarpeta(fitxers = CARPETA) {
  const escrits = [];
  const showDirectoryPicker = vi.fn(async () => handleDe('Facturacio', fitxers, escrits));
  return { entorn: { showDirectoryPicker }, escrits, showDirectoryPicker };
}

/* La porta de prova (el model de nucli/tractor.test.js). Els dos tractors
   exigixen signatura: un autenticador WebAuthn simulat signa de veres. */
const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat({ subtle });
const SIGNATS = Object.freeze({
  [TRACTOR_FACTURES.id]: await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta: EMPREMTA, ara: ARA - 60000 }),
  [TRACTOR_CORREUS.id]: await autenticador.signa({ manifest: TRACTOR_CORREUS, empremta: EMPREMTA, ara: ARA - 60000 })
});
const aprovacioDe = (manifest) => ({
  manifest,
  empremta: EMPREMTA,
  registres: [SIGNATS[manifest.id]],
  claus: autenticador.claus,
  origen: autenticador.origen,
  rpId: autenticador.rpId,
  ara: ARA
});
const MANIFESTS = { 'gestoria.factures': TRACTOR_FACTURES, 'gestoria.correus': TRACTOR_CORREUS };
const obteAprovacio = vi.fn(async (id) => aprovacioDe(MANIFESTS[id]));
const ESTAT_APROVAT = {
  'gestoria.factures': { estat: 'aprovat', curta: 'AB12-CD34' },
  'gestoria.correus': { estat: 'aprovat', curta: 'EF56-AB78' }
};
const AVUI = () => new Date(2026, 9, 2, 12, 0, 0);

function munta({ estatTractors = ESTAT_APROVAT, entorn, descarrega = vi.fn(), onObreTractors = vi.fn() } = {}) {
  const carpeta = entorn ? { entorn, escrits: [] } : entornAmbCarpeta();
  const vista = render(
    <PanellGestoria obteAprovacio={obteAprovacio} estatTractors={estatTractors} onObreTractors={onObreTractors}
      subtle={subtle} inflate={null} entorn={carpeta.entorn} avui={AVUI} descarrega={descarrega} />
  );
  return { ...vista, ...carpeta, descarrega, onObreTractors };
}

const boto = (nom) => screen.getByRole('button', { name: nom });
const pas = (n) => screen.getByRole('heading', { level: 2, name: new RegExp(`^${n}\\. `) }).closest('section');
const status = () => screen.getAllByRole('status').find((el) => el.classList.contains('sdp-gestoria-panell__avis'));

async function analitzat(opcions) {
  const muntat = munta(opcions);
  fireEvent.click(boto('Tria la carpeta de factures'));
  await screen.findByText('«Facturacio»');
  fireEvent.click(boto('Analitza el 3T de 2026'));
  await screen.findByRole('region', { name: 'Despeses de la proposta' });
  return muntat;
}

async function generat(opcions) {
  const muntat = await analitzat(opcions);
  fireEvent.click(screen.getByRole('checkbox', { name: /He revisat la proposta/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Genera-la igualment/ }));
  fireEvent.click(boto('Genera el full'));
  await screen.findByRole('heading', { level: 3, name: 'Fitxers generats' });
  return muntat;
}

/* ── Proves ─────────────────────────────────────────────────────────────── */

describe('pas 1: sense l’aprovació del tractor no es continua', () => {
  test('no es pot triar carpeta, i el botó porta al panell de Tractors', () => {
    const { showDirectoryPicker, onObreTractors } = munta({
      estatTractors: { 'gestoria.factures': { estat: 'pendent', curta: 'AB12-CD34' }, 'gestoria.correus': { estat: 'revocat' } }
    });
    const primer = within(pas(1));
    expect(primer.getByText('Cal aprovar el tractor de factures')).toBeTruthy();
    expect(primer.getByText('Pendent')).toBeTruthy();
    expect(primer.getByText('Revocat')).toBeTruthy();
    fireEvent.click(primer.getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(onObreTractors).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Tria la carpeta de factures' })).toBeNull();
    expect(within(pas(2)).getByText('Primer cal aprovar el tractor de factures (pas 1).')).toBeTruthy();
    expect(showDirectoryPicker).not.toHaveBeenCalled();
  });

  test('estatTractorsDe tradueix les files de useTractors', () => {
    expect(estatTractorsDe([{ id: 'gestoria.factures', estat: 'aprovat', curta: 'AB12-CD34', manifest: {} }, null]))
      .toEqual({ 'gestoria.factures': { estat: 'aprovat', curta: 'AB12-CD34' } });
    expect(estatTractorsDe(undefined)).toEqual({});
  });
});

describe('pas 2: carpeta i trimestre', () => {
  test('per defecte, el trimestre anterior a avui; no s’analitza sense carpeta', () => {
    munta();
    expect(screen.getByRole('combobox', { name: 'Any' }).value).toBe('2026');
    expect(screen.getByRole('combobox', { name: 'Trimestre' }).value).toBe('3');
    expect(boto('Analitza el 3T de 2026').disabled).toBe(true);
    fireEvent.change(screen.getByRole('combobox', { name: 'Trimestre' }), { target: { value: '2' } });
    expect(boto('Analitza el 2T de 2026').disabled).toBe(true);
  });

  test('l’avís de privacitat parla de l’anàlisi i diu que l’únic que ix és el correu del pas 5 (Codex, punt 31)', () => {
    munta();
    const segon = within(pas(2));
    expect(segon.queryByText('Res ix d’este ordinador')).toBeNull();
    expect(segon.getByText('L’anàlisi no ix d’este ordinador')).toBeTruthy();
    expect(segon.getByText(/L’únic pas que ix d’este ordinador és el correu per a la gestoria, que inicies tu al pas 5\./)).toBeTruthy();
  });

  test('sense selector de carpetes, un camp de fitxers amb etiqueta i webkitdirectory', async () => {
    munta({ entorn: {} });
    const camp = screen.getByLabelText('Tria la carpeta de factures');
    expect(camp.getAttribute('type')).toBe('file');
    expect(camp.hasAttribute('webkitdirectory')).toBe(true);
    expect(camp.multiple).toBe(true);
    const fitxers = Object.entries(CARPETA).map(([ruta, dades]) => ({
      name: ruta.split('/').pop(), webkitRelativePath: `Facturacio/${ruta}`, size: dades.length, lastModified: 0,
      arrayBuffer: async () => dades.slice().buffer
    }));
    fireEvent.change(camp, { target: { files: fitxers } });
    expect(await screen.findByText('«Facturacio»')).toBeTruthy();
    expect(screen.getByText(/Des d’este navegador no s’hi pot escriure/)).toBeTruthy();
  });

  test('l’anàlisi porta el focus a la revisió i ho anuncia', async () => {
    await analitzat();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: '3. Revisió' })));
    expect(status().textContent).toMatch(/^Anàlisi del 3T de 2026 acabada/);
    expect(obteAprovacio).toHaveBeenLastCalledWith('gestoria.factures');
  });
});

describe('pas 3: revisió', () => {
  test('incidències per severitat, documents, cobertura i taules editables', async () => {
    await analitzat();
    const revisio = within(pas(3));
    expect(revisio.getByRole('heading', { level: 4, name: /^Severitat alta/ })).toBeTruthy();
    expect(revisio.getAllByText('Falta una factura mensual').length).toBeGreaterThan(0);
    expect(revisio.getByText('Correu no revisat', { selector: '.sdp-alerta__titol' })).toBeTruthy();
    expect(revisio.queryByText(/complet\b/)).toBeNull();
    expect(revisio.getByText('Documents de la carpeta (2)')).toBeTruthy();
    expect(revisio.getByText('2026_3T/7777777777.csv')).toBeTruthy();
    const despeses = within(revisio.getByRole('region', { name: 'Despeses de la proposta' }));
    expect(despeses.getByRole('textbox', { name: 'Núm, despesa 1' }).value).toBe('7777777777');
    expect(despeses.getByRole('textbox', { name: 'Total, despesa 1' }).value).toBe('12,10 €');
    expect(revisio.getByRole('textbox', { name: /Titular del full/ }).value).toBe(TITULAR);
  });

  test('editar una cel·la recalcula; un import il·legible es diu al costat', async () => {
    await analitzat();
    const total = screen.getByRole('textbox', { name: 'Total, despesa 1' });
    fireEvent.change(total, { target: { value: '15,00' } });
    fireEvent.blur(total);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Total, despesa 1' }).value).toBe('15,00 €'));
    expect(within(pas(3)).getAllByText('L’IVA no quadra').length).toBeGreaterThan(0);
    fireEvent.change(total, { target: { value: 'dotze' } });
    fireEvent.blur(total);
    await waitFor(() => expect(total.getAttribute('aria-invalid')).toBe('true'));
    expect(total.value).toBe('dotze');
    expect(screen.getByText('No s’entén l’import: escriu-lo com 1.234,56.').id).toBe(total.getAttribute('aria-describedby'));
  });

  test('una factura en dòlars: la incidència, la nota i el control «Els imports ja són en euros» (format-fiscal-02)', async () => {
    const { entorn } = entornAmbCarpeta({ ...CARPETA, '2026_3T/example_cloud.pdf': PDF_DOLARS });
    await analitzat({ entorn });
    const revisio = within(pas(3));
    expect(revisio.getAllByText('Moneda estrangera').length).toBeGreaterThan(0);
    expect(revisio.getByText('Imports en USD.')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /He revisat la proposta/ }));
    fireEvent.click(revisio.getByRole('button', { name: 'Els imports ja són en euros, la despesa 2 («INV-2026-0907»)' }));
    await waitFor(() => expect(within(pas(3)).queryByText('Moneda estrangera')).toBeNull());
    expect(screen.queryByText('Imports en USD.')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Els imports ja són en euros/ })).toBeNull();
    // Com qualsevol edició, la proposta s'ha de tornar a revisar.
    expect(screen.getByRole('checkbox', { name: /He revisat la proposta/ }).checked).toBe(false);
  });

  test('afegir una despesa porta el focus a la fila nova; excloure-la i tornar-la', async () => {
    await analitzat();
    fireEvent.click(boto('Afig una despesa'));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Data, despesa 2' })));
    fireEvent.click(boto(/^Exclou la despesa 1/));
    expect(screen.getByText('Excloses de la proposta (1): no aniran al full.')).toBeTruthy();
    expect(status().textContent).toBe('S’ha exclòs la factura «7777777777»: no anirà al full.');
    fireEvent.click(boto('Torna a la proposta la factura 7777777777'));
    expect(screen.queryByText(/Excloses de la proposta/)).toBeNull();
  });

  test('el correu: sense la seua aprovació, explicació i botó; amb ella, el creuament', async () => {
    const { unmount } = await analitzat({ estatTractors: { 'gestoria.factures': ESTAT_APROVAT['gestoria.factures'] } });
    expect(within(pas(3)).getByText('Cal aprovar el tractor del correu')).toBeTruthy();
    expect(screen.queryByLabelText('Exportació del correu (.mbox o .eml)')).toBeNull();
    unmount();

    await analitzat();
    const mbox = [
      'From factures@example.org Mon Aug 31 09:00:00 2026',
      'From: Exemple Llum <factures@example.org>',
      "Subject: La teua factura d'agost",
      'Date: Mon, 31 Aug 2026 09:00:00 +0200',
      'Content-Type: multipart/mixed; boundary="LIMIT"',
      '',
      '--LIMIT',
      'Content-Type: application/pdf; name="factura_agost.pdf"',
      'Content-Disposition: attachment; filename="factura_agost.pdf"',
      '',
      'x',
      '--LIMIT--',
      ''
    ].join('\n');
    fireEvent.change(screen.getByLabelText('Exportació del correu (.mbox o .eml)'), {
      target: { files: [new File([mbox], 'correu.mbox', { type: 'application/mbox' })] }
    });
    await waitFor(() => expect(within(pas(3)).getAllByText('Correu sense factura').length).toBeGreaterThan(0));
    expect(within(pas(3)).getByText(/^Revisat: un missatge/)).toBeTruthy();
    expect(within(pas(3)).queryByText('Correu no revisat', { selector: '.sdp-alerta__titol' })).toBeNull();
  });
});

describe('pas 4 i 5: la proposta, els fitxers i el correu', () => {
  test('el flux sencer: vista prèvia, revisió, generació, descàrrega, desar i enviament', async () => {
    const { descarrega, escrits } = await analitzat();
    const proposta = within(pas(4));
    const vista = proposta.getByRole('region', { name: 'Vista prèvia del full del 3T de 2026' });
    expect(within(vista).getByText('INGRESSOS')).toBeTruthy();
    expect(within(vista).getByText('GASTOS')).toBeTruthy();
    expect(within(vista).getByText(`${TITULAR} - 01/07/2026 - 30/09/2026 - 3T`)).toBeTruthy();

    const genera = proposta.getByRole('button', { name: 'Genera el full' });
    expect(genera.disabled).toBe(true);
    fireEvent.click(proposta.getByRole('checkbox', { name: /He revisat la proposta/ }));
    expect(genera.disabled).toBe(true);
    fireEvent.click(proposta.getByRole('checkbox', { name: /Genera-la igualment/ }));
    expect(genera.disabled).toBe(false);
    expect(within(pas(5)).queryByRole('heading', { name: 'Prepara el correu per a la gestoria' })).toBeNull();
    fireEvent.click(genera);
    const fitxers = await proposta.findByRole('heading', { level: 3, name: 'Fitxers generats' });
    await waitFor(() => expect(document.activeElement).toBe(fitxers));
    expect(proposta.getByText(NOM_XLSX)).toBeTruthy();
    expect(proposta.getByText('Generat amb estes incidències acceptades:')).toBeTruthy();

    fireEvent.click(proposta.getByRole('button', { name: 'Descarrega l’XLSX' }));
    expect(descarrega).toHaveBeenCalledWith({ nom: NOM_XLSX, tipus: TIPUS_XLSX, dades: expect.any(Uint8Array) });
    expect(status().textContent).toBe(`S’ha descarregat «${NOM_XLSX}».`);

    fireEvent.click(proposta.getByRole('button', { name: 'Desa l’XLSX a la carpeta del trimestre' }));
    await waitFor(() => expect(escrits).toHaveLength(1));
    expect(escrits[0]).toMatchObject({ carpeta: '2026_3T', nom: NOM_XLSX });
    expect(escrits[0].dades).toEqual(descarrega.mock.calls[0][0].dades);
    await proposta.findByText(`Desat a «2026_3T/${NOM_XLSX}».`);

    const envia = within(pas(5));
    /* regressio-02: dins del pas 5 (h2), el títol del correu és h3 i la vista prèvia, h4. Abans fixava un h2 germà dels passos. */
    expect(envia.queryByRole('heading', { level: 2, name: 'Prepara el correu per a la gestoria' })).toBeNull();
    expect(envia.getByRole('heading', { level: 3, name: 'Prepara el correu per a la gestoria' })).toBeTruthy();
    expect(envia.getByRole('heading', { level: 4, name: 'Vista prèvia' })).toBeTruthy();
    expect(envia.getByRole('textbox', { name: /Nom per a l'assumpte/ }).value).toBe(TITULAR);
    expect(envia.getByText(new RegExp(`^${NOM_XLSX} \\(`))).toBeTruthy();
  });

  test('una edició després d’aprovar la proposta l’anul·la: fora fitxers i correu, i a revisar de nou', async () => {
    await generat();
    const descripcio = screen.getByRole('textbox', { name: 'Descripció, despesa 1' });
    fireEvent.change(descripcio, { target: { value: 'Servei al núvol de juliol' } });
    fireEvent.blur(descripcio);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Fitxers generats' })).toBeNull());
    expect(screen.getByRole('checkbox', { name: /He revisat la proposta/ }).checked).toBe(false);
    expect(boto('Genera el full').disabled).toBe(true);
    expect(within(pas(5)).queryByRole('heading', { name: 'Prepara el correu per a la gestoria' })).toBeNull();
    expect(within(pas(5)).getByText(/Quan hages generat el full/)).toBeTruthy();
  });

  test('desar sobre un fitxer que ja hi és demana confirmació explícita', async () => {
    const existent = { ...CARPETA, [`2026_3T/${NOM_XLSX}`]: bytes('vell') };
    const { entorn, escrits } = entornAmbCarpeta(existent);
    await generat({ entorn });
    fireEvent.click(boto('Desa l’XLSX a la carpeta del trimestre'));
    const dialeg = await screen.findByRole('dialog', { name: 'Ja hi ha este fitxer a la carpeta' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'No, deixa’l' }));
    await waitFor(() => expect(status().textContent).toBe('No s’ha substituït res.'));
    expect(escrits).toEqual([]);
    fireEvent.click(boto('Desa l’XLSX a la carpeta del trimestre'));
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Ja hi ha este fitxer a la carpeta' })).getByRole('button', { name: 'Sí, substituïx-lo' }));
    await waitFor(() => expect(escrits).toHaveLength(1));
    expect(status().textContent).toBe(`Substituït: «2026_3T/${NOM_XLSX}».`);
  });
});

describe('desenxufa', () => {
  test('sempre visible, amb confirmació; buida la carpeta, la proposta i els fitxers', async () => {
    munta();
    expect(boto('Desenxufa')).toBeTruthy();
    cleanup();

    await generat();
    fireEvent.click(boto('Desenxufa'));
    const dialeg = screen.getByRole('dialog', { name: 'Vols desenxufar la Gestoria?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(screen.getByRole('heading', { name: 'Fitxers generats' })).toBeTruthy();

    fireEvent.click(boto('Desenxufa'));
    await act(async () => {
      fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, desenxufa' }));
    });
    expect(status().textContent).toMatch(/^Desenxufat/);
    expect(screen.queryByRole('heading', { name: 'Fitxers generats' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Despeses de la proposta' })).toBeNull();
    expect(within(pas(3)).getByText(/Quan analitzes la carpeta/)).toBeTruthy();
    expect(screen.queryByText('«Facturacio»')).toBeNull();
    expect(boto('Analitza el 3T de 2026').disabled).toBe(true);
    expect(boto('Tria la carpeta de factures')).toBeTruthy();
  });
});

describe('accessibilitat bàsica', () => {
  test('cinc passos en una llista ordenada, títols h2 i cap h1', async () => {
    const { container } = await analitzat();
    const passos = container.querySelector('ol.sdp-gestoria-panell__passos');
    expect(within(passos).getAllByRole('listitem').filter((li) => li.parentElement === passos)).toHaveLength(5);
    expect([...passos.querySelectorAll(':scope > li > section > div > h2')].map((h) => h.textContent)).toEqual([
      '1. Aprovació dels tractors', '2. Carpeta i trimestre', '3. Revisió', '4. Proposta del full', '5. Envia a la gestoria'
    ]);
    expect(container.querySelector('h1')).toBeNull();
    for (const h of passos.querySelectorAll(':scope > li > section')) {
      expect(h.getAttribute('aria-labelledby')).toBe(h.querySelector('h2').id);
    }
  });

  test('cada camp i cada botó té nom accessible; les taules tenen regió amb nom', async () => {
    await analitzat();
    for (const camp of screen.getAllByRole('textbox')) expect(camp.getAttribute('aria-label') || camp.labels?.length, camp.name).toBeTruthy();
    for (const b of screen.getAllByRole('button')) expect(b.textContent.trim() || b.getAttribute('aria-label')).toBeTruthy();
    for (const nom of ['Ingressos de la proposta', 'Despeses de la proposta', 'Documents de la carpeta']) {
      expect(screen.getByRole('region', { name: nom }).getAttribute('tabindex')).toBe('0');
    }
    expect(screen.getByRole('button', { name: /^Mou a ingressos la despesa 1/ })).toBeTruthy();
  });

  test('un error d’aprovació es mostra al pas on passa, amb la via cap als Tractors', async () => {
    obteAprovacio.mockImplementationOnce(async () => aprovacioDe(TRACTOR_CORREUS));
    const { onObreTractors } = munta();
    fireEvent.click(boto('Tria la carpeta de factures'));
    await screen.findByText('«Facturacio»');
    fireEvent.click(boto('Analitza el 3T de 2026'));
    const alerta = await within(pas(2)).findByRole('alert');
    expect(within(alerta).getByText('Este tractor no té cap aprovació vigent.')).toBeTruthy();
    fireEvent.click(within(alerta).getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(onObreTractors).toHaveBeenCalledTimes(1);
    fireEvent.click(within(alerta).getByRole('button', { name: 'Tancar l\'avís' }));
    expect(within(pas(2)).queryByRole('alert')).toBeNull();
  });
});
