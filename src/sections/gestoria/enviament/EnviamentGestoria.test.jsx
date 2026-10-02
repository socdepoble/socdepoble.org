import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import EnviamentGestoria from './EnviamentGestoria.jsx';
import { TIPUS_EML, TIPUS_XLSX } from './correuGestoria.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PER = 'gestoria@example.org';
const XLSX = { nom: '2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([0x50, 0x4b, 3, 4, 5]) };

function munta(props = {}) {
  const obri = vi.fn();
  const descarrega = vi.fn();
  const vista = render(
    <EnviamentGestoria any={2026} t={1} adjunts={[XLSX]} obri={obri} descarrega={descarrega} navegador={{}} {...props} />
  );
  return { obri, descarrega, ...vista };
}

const camp = (nom) => screen.getByRole('textbox', { name: nom });
const escriu = (nom, valor) => fireEvent.change(camp(nom), { target: { value: valor } });
const boto = (nom) => screen.getByRole('button', { name: nom });
const casella = () => screen.getByRole('checkbox', { name: 'He revisat el full i l\'adjunt abans d\'enviar-lo' });
const descripcio = (element) => (element.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
  .map((id) => document.getElementById(id)?.textContent ?? '').join(' ');

const DESTINATARI = /^Destinatari/;
const NOM = /^Nom per a l'assumpte/;
const PERSONA = /^Persona de la gestoria/;
const GMAIL = 'Obri la redacció de Gmail';
const EML = 'Descarrega l\'esborrany (.eml)';

/* Marca la casella i espera l'empremta SHA-256: fins que no hi és, no ix res. */
async function revisa() {
  fireEvent.click(casella());
  await waitFor(() => expect(screen.getByText(/^Empremta SHA-256 del que has revisat:/)).toBeTruthy());
}

async function omple() {
  escriu(DESTINATARI, PER);
  escriu(NOM, 'Empresa de Prova');
  await revisa();
}

describe('plantilla i vista prèvia', () => {
  test('pre-omple l’assumpte i el text, i la vista prèvia els seguix', () => {
    const { container } = munta();
    expect(screen.getByRole('heading', { level: 2, name: 'Prepara el correu per a la gestoria' })).toBeTruthy();
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByText(/^Full del 1T de 2026\./)).toBeTruthy();

    expect(camp('Assumpte').value).toBe(' - 1T - 2026');
    escriu(NOM, 'Empresa de Prova');
    expect(camp('Assumpte').value).toBe('Empresa de Prova - 1T - 2026');
    expect(camp('Text del correu').value).toBe('Hola, ací tens la facturació del 1T.\n\nBon dia');
    escriu(PERSONA, 'Gestora');
    expect(camp('Text del correu').value).toBe('Hola Gestora, ací tens la facturació del 1T.\n\nBon dia');

    const vista = within(screen.getByRole('region', { name: 'Vista prèvia' }));
    expect(vista.getByText('Encara no hi ha destinatari.')).toBeTruthy();
    escriu(DESTINATARI, PER);
    expect(vista.getByText(PER)).toBeTruthy();
    expect(vista.getByText('Empresa de Prova - 1T - 2026')).toBeTruthy();
    expect(vista.getByText('2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx (5 bytes)')).toBeTruthy();
    expect(container.querySelector('.sdp-gestoria-enviament__cos').textContent)
      .toBe('Hola Gestora, ací tens la facturació del 1T.\n\nBon dia');
  });

  /* regressio-02: dins del pas 5 del panell (un h2), el títol no pot ser un
     altre h2 germà dels passos. Qui el munta en dona el nivell. */
  test('sol, h2 amb la vista prèvia en h3; amb nivellTitol={3}, h3 i h4', () => {
    munta();
    expect(screen.getByRole('heading', { level: 3, name: 'Vista prèvia' })).toBeTruthy();
    cleanup();

    const { container } = munta({ nivellTitol: 3 });
    expect(screen.getByRole('heading', { level: 3, name: 'Prepara el correu per a la gestoria' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Vista prèvia' })).toBeTruthy();
    expect(container.querySelector('h2')).toBeNull();
    // Els noms accessibles de la secció i de la vista prèvia no canvien.
    expect(screen.getByRole('region', { name: 'Prepara el correu per a la gestoria' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Vista prèvia' })).toBeTruthy();
  });

  test.each([[1], [6], ['3'], [2.5], [null]])('un nivellTitol fora de 2-5 (%s) torna al nivell per defecte', (nivellTitol) => {
    const { container } = munta({ nivellTitol });
    expect(screen.getByRole('heading', { level: 2, name: 'Prepara el correu per a la gestoria' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Vista prèvia' })).toBeTruthy();
    expect(container.querySelector('h1')).toBeNull();
  });

  test('valors inicials en memòria i mida en kB', () => {
    munta({
      inicials: { per: PER, nom: 'Empresa de Prova', persona: 'Gestora' },
      adjunts: [{ ...XLSX, dades: new Uint8Array(2560) }]
    });
    expect(camp(DESTINATARI).value).toBe(PER);
    expect(camp('Assumpte').value).toBe('Empresa de Prova - 1T - 2026');
    expect(screen.getByText('2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx (2,5 kB)')).toBeTruthy();
  });

  test('editar l’assumpte a mà para la plantilla, i «Torna a la plantilla» la restaura', () => {
    munta();
    expect(screen.queryByRole('button', { name: 'Torna a la plantilla' })).toBeNull();
    expect(camp(NOM).required).toBe(true);
    escriu('Assumpte', 'Assumpte propi');
    escriu(NOM, 'Empresa de Prova');
    expect(camp('Assumpte').value).toBe('Assumpte propi');
    expect(camp(NOM).required).toBe(false);
    escriu('Text del correu', 'Text propi');
    escriu(PERSONA, 'Gestora');
    expect(camp('Text del correu').value).toBe('Text propi');

    fireEvent.click(boto('Torna a la plantilla'));
    expect(camp('Assumpte').value).toBe('Empresa de Prova - 1T - 2026');
    expect(camp('Text del correu').value).toBe('Hola Gestora, ací tens la facturació del 1T.\n\nBon dia');
    expect(screen.queryByRole('button', { name: 'Torna a la plantilla' })).toBeNull();
  });

  test('una plantilla pròpia amb marcadors desconeguts ho avisa', () => {
    munta({ plantilla: { assumpte: '{nom} - {trimestre}', cos: 'Hola {gestor}, {trimestre}' } });
    const avis = screen.getByText('La plantilla té marcadors sense valor').closest('.sdp-alerta');
    expect(within(avis).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'El marcador {trimestre} no té valor: s\'ha deixat tal qual.',
      'El marcador {gestor} no té valor: s\'ha deixat tal qual.'
    ]);
    expect(camp('Assumpte').value).toBe(' - {trimestre}');
  });
});

describe('validació en prémer', () => {
  test('errors associats al camp, focus al primer i res no ix', () => {
    const { obri, descarrega } = munta();
    fireEvent.click(boto(GMAIL));
    expect(obri).not.toHaveBeenCalled();
    expect(descarrega).not.toHaveBeenCalled();

    const per = camp(DESTINATARI);
    expect(document.activeElement).toBe(per);
    expect(per.getAttribute('aria-invalid')).toBe('true');
    expect(descripcio(per)).toContain('Escriu l\'adreça de correu de la gestoria.');
    expect(descripcio(camp(NOM))).toContain('Escriu el nom que va a l\'assumpte, o escriu l\'assumpte a mà.');
    expect(casella().getAttribute('aria-invalid')).toBe('true');
    expect(descripcio(casella())).toBe('Marca la casella quan hages revisat el full i l\'adjunt.');

    // Corregir un camp n'esborra l'error; la resta es queden.
    escriu(DESTINATARI, PER);
    expect(camp(DESTINATARI).getAttribute('aria-invalid')).toBeNull();
    expect(camp(NOM).getAttribute('aria-invalid')).toBe('true');
    fireEvent.click(boto(EML));
    expect(document.activeElement).toBe(camp(NOM));
  });

  test('un destinatari amb paràmetres injectats és invàlid', async () => {
    const { obri } = munta();
    await omple();
    escriu(DESTINATARI, 'gestoria@example.org&cc=espia@example.com');
    fireEvent.click(boto(GMAIL));
    expect(obri).not.toHaveBeenCalled();
    expect(descripcio(camp(DESTINATARI))).toContain('Esta adreça no sembla vàlida');
    expect(document.activeElement).toBe(camp(DESTINATARI));
  });

  test('la casella és obligatòria: sense ella no es prepara res', () => {
    const { obri, descarrega } = munta();
    escriu(DESTINATARI, PER);
    escriu(NOM, 'Empresa de Prova');
    fireEvent.click(boto(GMAIL));
    fireEvent.click(boto(EML));
    expect(obri).not.toHaveBeenCalled();
    expect(descarrega).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(casella());
    expect(casella().required).toBe(true);
  });

  test('un assumpte buidat a mà és un error', async () => {
    const { obri } = munta();
    await omple();
    escriu('Assumpte', '   ');
    fireEvent.click(boto(GMAIL));
    expect(obri).not.toHaveBeenCalled();
    expect(descripcio(camp('Assumpte'))).toContain('L\'assumpte no pot quedar buit.');
  });

  test('sense adjunts o amb un període invàlid no es prepara res', async () => {
    const { obri, descarrega } = munta({ adjunts: [] });
    expect(screen.getByText('Encara no hi ha cap full per adjuntar.')).toBeTruthy();
    await omple();
    fireEvent.click(boto(GMAIL));
    expect(obri).not.toHaveBeenCalled();
    expect(descarrega).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('No hi ha cap full per adjuntar');
    cleanup();

    const segon = munta({ t: 7 });
    expect(screen.getAllByRole('alert')[0].textContent).toBe('El trimestre ha de ser 1, 2, 3 o 4.');
    escriu(DESTINATARI, PER);
    escriu('Assumpte', 'Assumpte propi');
    await revisa();
    fireEvent.click(boto(EML));
    expect(segon.descarrega).not.toHaveBeenCalled();
  });
});

describe('les tres eixides (cap s’envia sola)', () => {
  test('Gmail: obri la URL i, després, descarrega l’adjunt, amb l’avís d’arrossegar-lo', async () => {
    const { obri, descarrega } = munta();
    await omple();
    escriu(PERSONA, 'Gestora');
    fireEvent.click(boto(GMAIL));

    expect(obri).toHaveBeenCalledTimes(1);
    const url = new URL(obri.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://mail.google.com/mail/');
    expect(url.searchParams.get('view')).toBe('cm');
    expect(url.searchParams.get('to')).toBe(PER);
    expect(url.searchParams.get('su')).toBe('Empresa de Prova - 1T - 2026');
    expect(url.searchParams.get('body')).toBe('Hola Gestora, ací tens la facturació del 1T.\n\nBon dia');
    expect(obri.mock.calls[0][0]).not.toContain('FACTURACIO');
    expect(descarrega).toHaveBeenCalledTimes(1);
    expect(descarrega).toHaveBeenCalledWith(XLSX);
    expect(obri.mock.invocationCallOrder[0]).toBeLessThan(descarrega.mock.invocationCallOrder[0]);

    const avis = screen.getByText('Falta adjuntar el full').closest('.sdp-alerta');
    expect(avis.getAttribute('role')).toBe('status');
    expect(avis.textContent).toContain('«2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx»');
    expect(avis.textContent).toContain('arrossega el fitxer descarregat a la finestra del correu');
    const enllac = within(avis).getByRole('link', { name: 'obri la redacció de Gmail ací' });
    expect(enllac.getAttribute('href')).toBe(obri.mock.calls[0][0]);
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');

    // Un canvi deixa l'enllaç vell fora: ja no correspondria al que es veu.
    escriu(PERSONA, '');
    expect(screen.queryByText('Falta adjuntar el full')).toBeNull();
  });

  test('Gmail amb compte triat', async () => {
    const { obri } = munta({ compteGmail: 1 });
    await omple();
    fireEvent.click(boto(GMAIL));
    expect(new URL(obri.mock.calls[0][0]).pathname).toBe('/mail/u/1/');
  });

  test('EML: descarrega un esborrany amb X-Unsent i l’adjunt inclòs', async () => {
    const { obri, descarrega } = munta();
    await omple();
    fireEvent.click(boto(EML));
    expect(obri).not.toHaveBeenCalled();
    expect(descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
    expect(nom).toBe('esborrany_gestoria_2026_1T.eml');
    expect(tipus).toBe(TIPUS_EML);
    const eml = new TextDecoder().decode(dades);
    expect(eml).toContain('\r\nX-Unsent: 1\r\n');
    expect(eml.startsWith(`To: ${PER}\r\nSubject: Empresa de Prova - 1T - 2026\r\n`)).toBe(true);
    expect(eml).toContain('filename="2026-FACTURACIO-Empresa_de_Prova_-_1T.xlsx"');
    expect(eml).toContain('\r\n\r\nUEsDBAU=\r\n');
    expect(eml).not.toMatch(/^From:/m);
    const avis = screen.getByText('Esborrany descarregat').closest('.sdp-alerta');
    expect(avis.textContent).toContain('«esborrany_gestoria_2026_1T.eml»');
    expect(avis.textContent).toContain('prem «Envia» tu');
  });

  test('si la descàrrega falla, ho diu', async () => {
    const descarrega = vi.fn(() => { throw new Error('Disc ple.'); });
    munta({ descarrega });
    await omple();
    fireEvent.click(boto(EML));
    const avis = screen.getByText('No s\'ha pogut preparar el correu').closest('.sdp-alerta');
    expect(avis.getAttribute('role')).toBe('alert');
    expect(avis.textContent).toContain('Disc ple.');
  });

  test('Comparteix només apareix si el navegador pot compartir els fitxers', () => {
    munta();
    expect(screen.queryByRole('button', { name: 'Comparteix…' })).toBeNull();
    cleanup();
    munta({ navegador: { share: vi.fn(), canShare: () => false } });
    expect(screen.queryByRole('button', { name: 'Comparteix…' })).toBeNull();
    cleanup();
    const canShare = vi.fn(() => true);
    munta({ navegador: { share: vi.fn(), canShare } });
    expect(boto('Comparteix…')).toBeTruthy();
    expect(canShare.mock.calls[0][0].files[0].name).toBe(XLSX.nom);
  });

  test('Comparteix: files, title i text; no cal destinatari, però sí la casella', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    munta({ navegador: { share, canShare: () => true } });
    escriu(NOM, 'Empresa de Prova');
    await act(async () => { fireEvent.click(boto('Comparteix…')); });
    expect(share).not.toHaveBeenCalled();
    expect(camp(DESTINATARI).getAttribute('aria-invalid')).toBeNull();
    expect(document.activeElement).toBe(casella());

    await revisa();
    await act(async () => { fireEvent.click(boto('Comparteix…')); });
    expect(share).toHaveBeenCalledTimes(1);
    const [{ files, title, text }] = share.mock.calls[0];
    expect(files.map((f) => [f.name, f.type, f.size])).toEqual([[XLSX.nom, TIPUS_XLSX, 5]]);
    expect(title).toBe('Empresa de Prova - 1T - 2026');
    expect(text).toBe('Hola, ací tens la facturació del 1T.\n\nBon dia');
    expect(screen.getByText('Full compartit')).toBeTruthy();
  });

  test('Comparteix cancel·lat o fallit', async () => {
    const abort = Object.assign(new Error('cancel·lat'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValueOnce(abort).mockRejectedValueOnce(new Error('No permés.'));
    munta({ navegador: { share, canShare: () => true } });
    await omple();
    await act(async () => { fireEvent.click(boto('Comparteix…')); });
    expect(screen.getByText('Has tancat el menú de compartir. No s\'ha enviat res.')).toBeTruthy();
    await act(async () => { fireEvent.click(boto('Comparteix…')); });
    expect(screen.getByRole('alert').textContent).toContain('No permés.');
    expect(boto('Comparteix…').disabled).toBe(false);
  });
});

describe('la revisió i la memòria', () => {
  test('la casella val per a la versió exacta del full', () => {
    const props = { any: 2026, t: 1, obri: vi.fn(), descarrega: vi.fn(), navegador: {} };
    const { rerender } = render(<EnviamentGestoria {...props} adjunts={[XLSX]} />);
    fireEvent.click(casella());
    expect(casella().checked).toBe(true);
    // El mateix contingut en una llista nova: la revisió continua valent.
    rerender(<EnviamentGestoria {...props} adjunts={[{ ...XLSX, dades: new Uint8Array(XLSX.dades) }]} />);
    expect(casella().checked).toBe(true);
    // Un byte diferent: cal tornar a revisar.
    rerender(<EnviamentGestoria {...props} adjunts={[{ ...XLSX, dades: new Uint8Array([0x50, 0x4b, 3, 4, 6]) }]} />);
    expect(casella().checked).toBe(false);
  });

  test('res es guarda al navegador', async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    const { obri } = munta();
    await omple();
    fireEvent.click(boto(GMAIL));
    fireEvent.click(boto(EML));
    expect(obri).toHaveBeenCalledTimes(1);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  test('accessibilitat: botons natius descrits i cap tabindex positiu', () => {
    const { container } = munta({ navegador: { share: vi.fn(), canShare: () => true } });
    for (const element of screen.getAllByRole('button')) {
      expect(element.tagName).toBe('BUTTON');
      expect(element.getAttribute('type')).toBe('button');
    }
    expect(descripcio(boto(GMAIL))).toContain('Gmail no admet adjunts per l\'adreça');
    expect(descripcio(boto(EML))).toContain('Mail, Outlook o Thunderbird');
    expect(descripcio(boto('Comparteix…'))).toContain('El destinatari el tries a l\'aplicació');
    expect(container.querySelector('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toBeNull();
    expect(container.querySelectorAll('h2')).toHaveLength(1);
  });
});

describe('eixides per defecte', () => {
  test('obri amb window.open en una pestanya nova, noopener i noreferrer', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const descarrega = vi.fn();
    render(<EnviamentGestoria any={2026} t={1} adjunts={[XLSX]} descarrega={descarrega} navegador={{}} />);
    await omple();
    fireEvent.click(boto(GMAIL));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][1]).toBe('_blank');
    expect(open.mock.calls[0][2]).toBe('noopener,noreferrer');
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&tf=1&to=/);
  });

  test('descarrega amb un Blob i un enllaç temporal, sense penjar-lo del document', async () => {
    const creaUrl = vi.fn(() => 'blob:prova');
    const revoca = vi.fn();
    const originals = { creaUrl: URL.createObjectURL, revoca: URL.revokeObjectURL };
    URL.createObjectURL = creaUrl;
    URL.revokeObjectURL = revoca;
    const clics = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clica() {
      clics.push({ download: this.download, href: this.href, penjat: this.isConnected });
    });
    try {
      render(<EnviamentGestoria any={2026} t={1} adjunts={[XLSX]} obri={vi.fn()} navegador={{}} />);
      // L'empremta s'espera amb rellotges de veres; els falsos, només per al temps de vida de l'enllaç.
      await omple();
      vi.useFakeTimers();
      fireEvent.click(boto(EML));
      expect(creaUrl).toHaveBeenCalledTimes(1);
      expect(creaUrl.mock.calls[0][0].type).toBe(TIPUS_EML);
      expect(clics).toEqual([{ download: 'esborrany_gestoria_2026_1T.eml', href: 'blob:prova', penjat: false }]);
      expect(revoca).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(revoca).toHaveBeenCalledWith('blob:prova');
    } finally {
      vi.useRealTimers();
      URL.createObjectURL = originals.creaUrl;
      URL.revokeObjectURL = originals.revoca;
    }
  });
});
