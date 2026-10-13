/* Gestoria · Escàner Local · el panell (ordre del Mestre, 13-10-2026, pla
   261013_1405, front D; mapa D, §4): la porta pròpia, la nota del Tauler, el
   selector (amb l'alternativa webkitdirectory), el progrés, la radiografia
   (tessel·les amb aria-pressed i una Taula de detall), els extractes per al
   Tauler, l'ull de la boina i les pistes de la identitat i del Full. Els
   models del hook i del Tauler es fan ací; la radiografia ix del nucli pur de
   veres (analitzaCarpeta) sobre un arbre SINTÈTIC: cap nom ni valor real. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { analitzaCarpeta } from './nucli/escaner.js';
import { PanellEscaner } from './PanellEscaner.jsx';

const MODIFICAT = 1760000000000;
const AVUI = { a: 2026, m: 10, d: 13 };
const F = '02_Facturacio';
const B = `${F}/2026_Bancs`;
const N43_RUTA = `${B}/moviments_compte.n43`;
const CSV_RUTA = `${B}/bancpoble.csv`;
const XLS_RUTA = `${B}/moviments_export.xls`;
const e = (ruta, mida = 1000, extra = {}) => ({ ruta, mida, modificat: MODIFICAT, ...extra });
const ENTRADES = [
  e(N43_RUTA, 4000),
  e(CSV_RUTA, 1200),
  e(XLS_RUTA, 8000),
  e(`${F}/2025_4T/2025-4T-llibre_exemple.pdf`, 6000, { sha256: 'a'.repeat(64) }),
  e(`${F}/2026_1T/2025-4T-llibre_exemple.pdf`, 6000, { sha256: 'a'.repeat(64) }),
  e(`${F}/2026_1T/proveidor-exemple-11-2025.pdf`, 5000),
  e(`${F}/2026_3T/proveidor_alfa.pdf`, 1000),
  e('01_Identitat_Legal/Persona/document_escanejat.pdf', 5000),
  e('03_Burocracia/SUMA/rebut_ibi_2026.pdf', 1700),
  e('90_Arxiu_Historic/certificat_antic.pfx', 3000),
  e('04_Quarantena_Llegat_Web/web/app.js', 2300)
];
const FORMATS = Object.freeze({ [N43_RUTA]: 'n43', [CSV_RUTA]: 'csv-tauler' });
const RESULTAT = Object.freeze({ ...analitzaCarpeta({ nom: 'Gestoria_Prova', entrades: ENTRADES, formats: FORMATS, avui: AVUI }), illegibles: [] });
const SENSE_IDENTITAT = Object.freeze({
  ...analitzaCarpeta({ nom: 'Gestoria_Prova', entrades: ENTRADES.filter((x) => !x.ruta.startsWith('01_')), formats: FORMATS, avui: AVUI }),
  illegibles: []
});
/* Revisió adversarial 13-10-2026, troballes PRIV-2, ORD-1 i FP-1: un certificat i una clau dins de la carpeta de la
   identitat legal (una en una subcarpeta) i un document d'una carpeta de la identitat dins de l'arxiu. Noms sintètics
   que no han d'aparéixer enlloc del panell. */
const NOMS_DE_LA_IDENTITAT = Object.freeze([
  'certificat_titular_prova', 'clau_signatura_prova', 'Titular_Prova', 'copia_identitat_antiga', 'document_escanejat'
]);
const AMB_CREDENCIALS_IDENTITAT = Object.freeze({
  ...analitzaCarpeta({
    nom: 'Gestoria_Prova',
    entrades: [
      ...ENTRADES,
      e('01_Identitat_Legal/certificat_titular_prova.p12', 3100),
      e('01_Identitat_Legal/Titular_Prova/clau_signatura_prova.pfx', 3200),
      e('90_Arxiu_Historic/01_Identitat_Legal/copia_identitat_antiga.pdf', 4100)
    ],
    formats: FORMATS,
    avui: AVUI
  }),
  illegibles: []
});

const PORTA = Object.freeze({ carregant: false, error: null, tractors: [] });
const escanerDe = (canvis = {}) => ({
  porta: PORTA, fila: { estat: 'aprovat' }, aprovat: true, potTriarCarpeta: true, teCarpeta: false, nomCarpeta: '', ocupat: null,
  progres: null, error: null, resultat: null, seleccio: [], triaCarpeta: vi.fn(), usaFitxers: vi.fn(), commutaExtracte: vi.fn(),
  fitxersPerAlTauler: vi.fn(() => ['fitxers-de-la-font']), oblida: vi.fn(), ...canvis
});
const ambResultat = (canvis = {}) => escanerDe({
  teCarpeta: true, nomCarpeta: 'Gestoria_Prova', resultat: RESULTAT, seleccio: [CSV_RUTA, N43_RUTA], ...canvis
});
const taulerDe = (canvis = {}) => ({
  porta: PORTA, aprovat: true, llegint: false, error: null, lectura: null, generacio: 0, llig: vi.fn(), oblida: vi.fn(), ...canvis
});
const DADES = Object.freeze({
  comptes: [{ id: 'c43-prova', desde: { a: 2026, m: 6, d: 1 }, fins: { a: 2026, m: 6, d: 30 } }],
  resum: { conciliacio: { ambFactures: true, moviments: 7, factures: 4, parelles: 3 } }
});
const literal = (text) => new RegExp(text.replace(/[.]/g, '[.]'));

function munta({ escaner = ambResultat(), tauler = taulerDe(), dades = null, visible = false, onObreIdentitat = vi.fn() } = {}) {
  const onObreTractors = vi.fn();
  const vista = render(<PanellEscaner escaner={escaner} tauler={tauler} dades={dades} visible={visible}
    onObreTractors={onObreTractors} onObreIdentitat={onObreIdentitat} />);
  return { ...vista, escaner, tauler, onObreTractors, onObreIdentitat };
}

afterEach(cleanup);

describe('la porta del tractor de l’Escàner', () => {
  test('mentre es lligen les aprovacions, només l’estat de càrrega', () => {
    munta({ escaner: escanerDe({ porta: { ...PORTA, carregant: true }, aprovat: false }) });
    expect(screen.getByRole('status').textContent).toContain('Llegint les aprovacions dels tractors…');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  test.each([
    [{ estat: 'pendent' }, 'encara no està aprovat'],
    [{ estat: 'empremta-divergent' }, 'ha canviat des que el vas aprovar'],
    [null, 'encara no està aprovat']
  ])('sense aprovar (%o): «Cal aprovar el tractor», el camí al panell de Tractors i cap selector', (fila, diu) => {
    const { onObreTractors } = munta({ escaner: escanerDe({ aprovat: false, fila }) });
    expect(screen.getByText('Cal aprovar el tractor')).toBeTruthy();
    expect(screen.getByText(new RegExp(diu))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(onObreTractors).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Tria la carpeta/ })).toBeNull();
    expect(screen.queryByLabelText(/Tria la carpeta/)).toBeNull();
  });

  test('amb l’Escàner aprovat i el Tauler sense aprovar: una nota, l’anàlisi sí, i «Aboca» desactivat', () => {
    munta({ tauler: taulerDe({ aprovat: false }) });
    expect(screen.getByText('Per a abocar els extractes cal també el Tauler')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Radiografia de la carpeta' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aboca 2 extractes al Tauler' }).disabled).toBe(true);
  });
});

describe('el selector i el progrés', () => {
  test('amb selector de carpetes, el botó; sense, l’<input webkitdirectory> passa els fitxers al hook', () => {
    const amb = munta({ escaner: escanerDe() });
    fireEvent.click(screen.getByRole('button', { name: 'Tria la carpeta arrel' }));
    expect(amb.escaner.triaCarpeta).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { name: 'Radiografia de la carpeta' })).toBeNull();
    cleanup();
    const sense = munta({ escaner: escanerDe({ potTriarCarpeta: false }) });
    const input = screen.getByLabelText('Tria la carpeta arrel');
    expect(input.getAttribute('type')).toBe('file');
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    expect(input.multiple).toBe(true);
    const triat = new File(['x'], 'moviments_compte.n43');
    fireEvent.change(input, { target: { files: [triat] } });
    expect(sense.escaner.usaFitxers).toHaveBeenCalledTimes(1);
    expect(Array.from(sense.escaner.usaFitxers.mock.calls[0][0])).toEqual([triat]);
  });

  test('amb una carpeta ja triada, el botó diu «Tria una altra carpeta», i la carpeta triada va en un paràgraf', () => {
    munta();
    expect(screen.getByRole('button', { name: 'Tria una altra carpeta' })).toBeTruthy();
    expect(screen.getByText('Carpeta triada: «Gestoria_Prova».').tagName).toBe('P');
  });

  test('mentre analitza, el progrés de la fase; amb un error, l’alerta', () => {
    munta({ escaner: escanerDe({ ocupat: 'escaneig', teCarpeta: true, progres: { fase: 'empremtes', fet: 2, total: 5 } }) });
    const barra = screen.getByRole('progressbar', { name: 'Comparant els fitxers que tenen la mateixa mida…' });
    expect(barra.getAttribute('value')).toBe('2');
    expect(barra.getAttribute('max')).toBe('5');
    cleanup();
    munta({ escaner: escanerDe({ ocupat: 'escaneig', teCarpeta: true, progres: { fase: 'llistant', fet: 0, total: null } }) });
    expect(screen.getByRole('progressbar', { name: 'Llistant els fitxers de la carpeta…' }).hasAttribute('value')).toBe(false);
    cleanup();
    munta({ escaner: escanerDe({ error: 'La carpeta no té cap fitxer per a analitzar.' }) });
    expect(screen.getByRole('alert').textContent).toContain('La carpeta no té cap fitxer per a analitzar.');
  });
});

describe('la radiografia', () => {
  test('tres H2 fixos, i cap encapçalament porta dades (trimestres, carpetes ni fitxers): l’Índex els escriu a l’adreça', () => {
    munta();
    const titols = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(titols).toEqual(['Tria la carpeta', 'Radiografia de la carpeta', 'Extractes per al Tauler']);
    for (const titol of titols) expect(titol).not.toMatch(/\d|_|\.|«/);
  });

  test('una tessel·la per apartat amb aria-pressed; prémer-ne una canvia la Taula del detall', () => {
    munta();
    const bancs = screen.getByRole('button', { name: /^Bancs/ });
    expect(bancs.getAttribute('aria-pressed')).toBe('true');
    expect(bancs.textContent).toContain('3 extractes');
    const taulaBancs = screen.getByRole('region', { name: 'Taula · Bancs' });
    expect(within(taulaBancs).getByRole('rowheader', { name: XLS_RUTA })).toBeTruthy();
    expect(within(taulaBancs).getByText('No llegible')).toBeTruthy();

    const duplicats = screen.getByRole('button', { name: /^Duplicats/ });
    fireEvent.click(duplicats);
    expect(duplicats.getAttribute('aria-pressed')).toBe('true');
    expect(bancs.getAttribute('aria-pressed')).toBe('false');
    expect(screen.queryByRole('region', { name: 'Taula · Bancs' })).toBeNull();
    const taula = screen.getByRole('region', { name: 'Taula · Duplicats' });
    expect(within(taula).getByRole('rowheader', { name: `${F}/2025_4T/2025-4T-llibre_exemple.pdf` })).toBeTruthy();
    expect(within(taula).getByText('Alta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Factures/ }));
    expect(within(screen.getByRole('region', { name: 'Taula · Factures' })).getByRole('rowheader', { name: '1T de 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Dates/ }));
    expect(within(screen.getByRole('region', { name: 'Taula · Dates' }))
      .getByRole('rowheader', { name: `${F}/2026_1T/proveidor-exemple-11-2025.pdf` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Alertes/ }));
    expect(within(screen.getByRole('region', { name: 'Taula · Alertes' }))
      .getByRole('rowheader', { name: '90_Arxiu_Historic/certificat_antic.pfx' })).toBeTruthy();
  });

  test('la identitat només es compta per carpetes: cap nom dels seus fitxers enlloc, i la pista cap a «Identitat i Finestreta»', () => {
    const { container, onObreIdentitat } = munta();
    fireEvent.click(screen.getByRole('button', { name: /^Identitat/ }));
    const taula = screen.getByRole('region', { name: 'Taula · Identitat' });
    expect(within(taula).getByRole('rowheader', { name: '01_Identitat_Legal' })).toBeTruthy();
    expect(container.textContent).not.toContain('document_escanejat');
    fireEvent.click(screen.getByRole('button', { name: 'Obri Identitat i Finestreta' }));
    expect(onObreIdentitat).toHaveBeenCalledTimes(1);
    cleanup();
    munta({ escaner: ambResultat({ resultat: SENSE_IDENTITAT }) });
    expect(screen.queryByRole('button', { name: 'Obri Identitat i Finestreta' })).toBeNull();
    expect(screen.queryByText('La identitat legal té la seua vista')).toBeNull();
  });

  /* Revisió adversarial 13-10-2026, troballes PRIV-2, ORD-1 i FP-1. Sense el canvi, «Alertes» pintava la ruta del
     certificat de 01_Identitat_Legal i «Arxiu i altres» la del document de la identitat de dins de l'arxiu. */
  test('cap nom ni ruta de la identitat en cap tessel·la ni detall, tampoc a «Alertes» ni a l’arxiu: la carpeta i el recompte', () => {
    const { container } = munta({ escaner: ambResultat({ resultat: AMB_CREDENCIALS_IDENTITAT }) });
    /* El text i també els atributs (aria-label, title, value…), que no són al textContent. */
    const capNom = () => {
      const atributs = Array.from(container.querySelectorAll('*'))
        .flatMap((el) => Array.from(el.attributes, (a) => a.value)).join('\n');
      for (const tros of NOMS_DE_LA_IDENTITAT) {
        expect(container.textContent).not.toContain(tros);
        expect(atributs).not.toContain(tros);
      }
    };
    capNom();
    const tesseles = within(screen.getByRole('group', { name: 'Apartats de la radiografia' })).getAllByRole('button');
    expect(tesseles).toHaveLength(9);
    for (const tessela of tesseles) {
      fireEvent.click(tessela);
      expect(tessela.getAttribute('aria-pressed')).toBe('true');
      capNom();
    }

    // Les credencials es compten totes (dos de la identitat i la de l'arxiu), però la identitat és una fila per carpeta.
    expect(screen.getByText(/^3 fitxers pareixen un certificat o una clau privada/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Alertes/ }));
    const alertes = screen.getByRole('region', { name: 'Taula · Alertes' });
    const carpeta = within(alertes).getByRole('rowheader', { name: '01_Identitat_Legal' });
    expect(carpeta.closest('tr').textContent).toContain('2 fitxers de la carpeta de la identitat legal pareixen credencials');
    // Una credencial que no és de la identitat continua dient-se pel seu camí, com abans.
    expect(within(alertes).getByRole('rowheader', { name: '90_Arxiu_Historic/certificat_antic.pfx' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Arxiu i altres/ }));
    const arxiu = screen.getByRole('region', { name: 'Taula · Arxiu i altres' });
    const carpetaArxiu = within(arxiu).getByRole('rowheader', { name: '90_Arxiu_Historic/01_Identitat_Legal' });
    expect(carpetaArxiu.closest('tr').textContent).toContain('1 fitxer de la identitat legal');
    expect(within(arxiu).getByRole('rowheader', { name: '90_Arxiu_Historic/certificat_antic.pfx' })).toBeTruthy();
  });

  /* Revisió adversarial 13-10-2026, troballa PRIV-3: sense el selector del sistema, el Full tria amb un <input> que diu
     el nom dels primers fitxers. Sense el canvi, la pista hi enviava sempre la carpeta arrel («esta mateixa carpeta»). */
  test('les credencials soltes s’avisen, i la pista del Full només envia a l’arrel amb el selector del sistema', () => {
    munta();
    expect(screen.getByText('Hi ha credencials soltes en la carpeta')).toBeTruthy();
    expect(screen.getByText('Les factures van al Full trimestral')).toBeTruthy();
    expect(screen.getByText(/tria esta mateixa carpeta/)).toBeTruthy();
    cleanup();
    munta({ escaner: ambResultat({ potTriarCarpeta: false }) });
    expect(screen.getByText('Les factures van al Full trimestral')).toBeTruthy();
    expect(screen.getByText(/^Al Full trimestral/).textContent)
      .toContain('tria la carpeta del trimestre que prepares, com 2026_3T, i no la carpeta arrel');
    expect(screen.queryByText(/esta mateixa carpeta/)).toBeNull();
  });
});

describe('els extractes per al Tauler', () => {
  test('una casella per extracte: els triats marcats, el full del banc desactivat, i commutar crida el hook', () => {
    const { escaner } = munta();
    expect(screen.getByRole('checkbox', { name: literal(N43_RUTA) }).checked).toBe(true);
    const xls = screen.getByRole('checkbox', { name: literal(XLS_RUTA) });
    expect(xls.disabled).toBe(true);
    expect(xls.checked).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: literal(CSV_RUTA) }));
    expect(escaner.commutaExtracte).toHaveBeenCalledWith(CSV_RUTA);
  });

  test('«Aboca» passa al Tauler els fitxers del hook; desactivat sense selecció, mentre llig, mentre analitza', () => {
    const { escaner, tauler } = munta();
    fireEvent.click(screen.getByRole('button', { name: 'Aboca 2 extractes al Tauler' }));
    expect(escaner.fitxersPerAlTauler).toHaveBeenCalledTimes(1);
    expect(tauler.llig).toHaveBeenCalledWith(['fitxers-de-la-font']);
    cleanup();
    munta({ escaner: ambResultat({ seleccio: [N43_RUTA] }) });
    expect(screen.getByRole('button', { name: 'Aboca 1 extracte al Tauler' }).disabled).toBe(false);
    cleanup();
    munta({ escaner: ambResultat({ seleccio: [] }) });
    expect(screen.getByRole('button', { name: 'Aboca 0 extractes al Tauler' }).disabled).toBe(true);
    cleanup();
    munta({ tauler: taulerDe({ llegint: true }) });
    expect(screen.getByRole('button', { name: 'Treballant…' }).disabled).toBe(true);
    cleanup();
    munta({ escaner: ambResultat({ ocupat: 'escaneig' }) });
    expect(screen.getByRole('button', { name: 'Aboca 2 extractes al Tauler' }).disabled).toBe(true);
  });

  test('després de llegir: les dates de cada compte sempre; els moviments i les parelles, només amb l’ull obert', () => {
    munta({ tauler: taulerDe({ lectura: { extractes: [], csv: [], avisos: [] } }), dades: DADES, visible: false });
    expect(screen.getByText('Compte 1: del 01/06/2026 al 30/06/2026.')).toBeTruthy();
    expect(screen.getByText(/ja tenen les xifres/)).toBeTruthy();
    expect(screen.getByText('Moviments llegits:').textContent).toBe('Moviments llegits: Xifra amagada');
    expect(screen.getByText('Moviments aparellats amb factures:').textContent).toBe('Moviments aparellats amb factures: Xifra amagada');
    cleanup();
    munta({ tauler: taulerDe({ lectura: { extractes: [], csv: [], avisos: [] } }), dades: DADES, visible: true });
    expect(screen.queryByText('Xifra amagada')).toBeNull();
    expect(screen.getByText('Moviments llegits:').textContent).toBe('Moviments llegits: 7');
    expect(screen.getByText('Moviments aparellats amb factures:').textContent).toBe('Moviments aparellats amb factures: 3');
  });

  test('sense factures del Full, les parelles ho diuen en paraules (cap zero inventat); sense lectura, cap resum', () => {
    const dades = { ...DADES, resum: { conciliacio: { ambFactures: false, moviments: 7, factures: 0 } } };
    munta({ tauler: taulerDe({ lectura: { avisos: [] } }), dades, visible: true });
    expect(screen.getByText('Moviments aparellats amb factures:').textContent).toBe('Moviments aparellats amb factures: sense factures del Full trimestral');
    cleanup();
    munta({ dades: DADES, visible: true });
    expect(screen.queryByText('Moviments llegits:')).toBeNull();
  });

  test('l’error i els avisos de la lectura del Tauler es diuen ací també', () => {
    munta({ tauler: taulerDe({ error: 'Lectura fallida sintètica.', lectura: { avisos: [{ codi: 'FITXER_ILLEGIBLE', missatge: 'Un fitxer no s’ha pogut llegir.' }] } }) });
    expect(screen.getByRole('alert').textContent).toContain('Lectura fallida sintètica.');
    expect(screen.getByText('Un fitxer no s’ha pogut llegir.')).toBeTruthy();
  });

  test('«Oblida la carpeta» crida el hook; si el Tauler en llegia els extractes, també cancel·la eixa lectura', () => {
    const quiet = munta();
    fireEvent.click(screen.getByRole('button', { name: 'Oblida la carpeta' }));
    expect(quiet.escaner.oblida).toHaveBeenCalledTimes(1);
    expect(quiet.tauler.oblida).not.toHaveBeenCalled();
    cleanup();
    const llegint = munta({ tauler: taulerDe({ llegint: true }) });
    fireEvent.click(screen.getByRole('button', { name: 'Oblida la carpeta' }));
    expect(llegint.escaner.oblida).toHaveBeenCalledTimes(1);
    expect(llegint.tauler.oblida).toHaveBeenCalledTimes(1);
    cleanup();
    munta({ escaner: escanerDe() });
    expect(screen.queryByRole('button', { name: 'Oblida la carpeta' })).toBeNull();
  });
});
