/**
 * LotG1XatV1225.test.jsx — Bateria de proves del Lot G1 (Onada v1.2.25):
 *   1. VistaDestacats: càrrega, cerca amb plegat d'accents, desdestacar, salt al missatge i 5 llengües.
 *   2. BarraCercaConversa dins Conversa: lupa a la capçalera, ↑/↓, Enter/Shift+Enter, Escape amb retorn de focus.
 *   3. Documents al Xat: preparaDocument (PDF/CSV/ODT/DOCX/TXT <= 10 MB + magic bytes), TargetaDocument i PanellAdjuntsConversa.
 *   4. VistaMultimedia viva: cerca, ordenació recent/antic, selecció i miniatures segures via urlAdjuntXat.
 *   5. Restauració guiada .sdpbackup a PaginaCopiaSeguretatXat (confirmació explícita + desduplicació UUID + 5 llengües).
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { exportaCopiaSeguretatXat } from '../../data/xat/copiaSeguretatPortatil.js';
import { TEXTOS_XAT_V1225, textXatV1225 } from './i18nVistesXatV1225.js';
import { LIMIT_DOCUMENT_BYTES, preparaDocument } from './adjuntLocal.js';
import VistaDestacats from './components/VistaDestacats.jsx';
import Conversa from './components/Conversa.jsx';
import AdjuntXat from './components/AdjuntXat.jsx';
import { extrauContingutConversa } from './components/PanellAdjuntsConversa.jsx';
import VistaMultimedia from './components/VistaMultimedia.jsx';
import { CosCopiaSeguretatXat, MOTOR_COPIA, restauraCopiaLocal } from './components/PaginaCopiaSeguretatXat.jsx';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';

const mocks = vi.hoisted(() => ({
  urlAdjuntXat: vi.fn(async (id) => `https://node.test/signed/${id}`),
  /* SV-02 (Gauntlet de la integració v1.2.25) · Els bytes que torna el transport del port, per a cada prova. */
  bytesAdjuntXat: vi.fn(async () => Uint8Array.from(new TextEncoder().encode('concepte;euros\nfusta;24,50\n')))
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    teCapacitat: () => true,
    urlAdjuntXat: mocks.urlAdjuntXat,
    bytesAdjuntXat: mocks.bytesAdjuntXat
  };
});

const t = (_, fallback) => fallback;

afterEach(() => {
  cleanup();
  mocks.urlAdjuntXat.mockClear();
  mocks.bytesAdjuntXat.mockClear();
});

describe('Simetria i18n de 5 llengües (ca, es, en, eu, gl)', () => {
  test('totes les claus de TEXTOS_XAT_V1225 existixen en les 5 llengües sense buits ni termes vetats', () => {
    const clausCa = Object.keys(TEXTOS_XAT_V1225.ca).sort();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_XAT_V1225[lang]).sort()).toEqual(clausCa);
      for (const clau of clausCa) {
        const val = TEXTOS_XAT_V1225[lang][clau];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
        expect(val).not.toMatch(/La Masia|sobirana|\busa\b/i);
      }
    }
  });
});

describe('VistaDestacats (v1.2.25)', () => {
  const fils = [
    { id: 'f1', name: 'Regants de la Torre', tipus: 'grup' },
    { id: 'f2', name: 'Pepica', tipus: 'directe' }
  ];
  const missatges = {
    f1: [
      { id: 'm1', seq: 1, sender: 'other', author: 'Vicent', text: 'Reunió de tanda a les set', creatAl: '2026-11-20T10:00:00Z', destacat: true },
      { id: 'm2', seq: 2, sender: 'me', text: 'No destacat', creatAl: '2026-11-21T10:00:00Z', destacat: false }
    ],
    f2: [
      { id: 'm3', seq: 1, sender: 'other', author: 'Pepica', text: 'Porta oli d’oliva verge', creatAl: '2026-11-22T09:00:00Z', destacat: true }
    ]
  };

  test('carrega destacats, filtra amb plegat d’accents, obri el missatge i permet desdestacar', () => {
    const onCarregaDestacats = vi.fn();
    const onObriMissatge = vi.fn();
    const onAlternaDestacat = vi.fn();
    render(
      <VistaDestacats
        titol="Destacats"
        fils={fils}
        missatgesPerFil={(id) => missatges[id] || []}
        onCarregaDestacats={onCarregaDestacats}
        onObriMissatge={onObriMissatge}
        onAlternaDestacat={onAlternaDestacat}
        idioma="ca"
        t={t}
      />
    );
    expect(onCarregaDestacats).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2 missatges destacats')).toBeTruthy();

    // Cerca sense accent («reunio» troba «Reunió»)
    const cerca = screen.getByRole('searchbox', { name: 'Cerca als missatges destacats' });
    fireEvent.change(cerca, { target: { value: 'reunio' } });
    expect(screen.getByText('1 missatge destacat')).toBeTruthy();
    expect(screen.queryByText(/oli d’oliva/)).toBeNull();

    // Salt directe al missatge
    fireEvent.click(screen.getByRole('button', { name: 'Obri el missatge a Regants de la Torre' }));
    expect(onObriMissatge).toHaveBeenCalledWith('f1', 'm1');

    // Desdestacar
    fireEvent.click(screen.getByRole('button', { name: 'Lleva dels destacats' }));
    expect(onAlternaDestacat).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1', filId: 'f1' }), false);
  });

  test('sense destacats mostra EstatBuit i Alerta canònics en la llengua triada (es)', () => {
    render(<VistaDestacats titol="Destacados" fils={fils} missatgesPerFil={() => []} idioma="es" t={t} />);
    expect(screen.getByText(textXatV1225('es', 'destacats.buit.titol'))).toBeTruthy();
    expect(document.querySelector('.sdp-buit')).toBeTruthy();
    expect(document.querySelector('.sdp-alerta')).toBeTruthy();
  });
});

describe('Cerca intra-conversa (BarraCercaConversa dins Conversa)', () => {
  const fil = { id: 'f-cerca', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 10 };
  const msgs = [
    { id: '1', seq: 1, sender: 'other', author: 'Pep', text: 'Cal portar aigua al bancal', creatAl: '2026-11-24T08:00:00Z' },
    { id: '2', seq: 2, sender: 'me', text: 'D’acord, porte pa', creatAl: '2026-11-24T08:05:00Z' },
    { id: '3', seq: 3, sender: 'other', author: 'Rosa', text: 'Jo també porte AIGUA fresca', creatAl: '2026-11-24T08:10:00Z' },
    { id: '4', seq: 4, sender: 'other', author: 'Pep', text: 'Aigua xifrada no oberta', creatAl: '2026-11-24T08:12:00Z', seguretat: { xifrat: true, verificat: false } }
  ];

  test('la lupa obri la barra, compta coincidències, navega amb ↑/↓ i Escape retorna el focus a la lupa', () => {
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa
            fil={fil}
            messages={msgs}
            onSendMessage={vi.fn()}
            onBack={vi.fn()}
            onEnviaAlBloc={vi.fn()}
            onCopia={vi.fn()}
            hiHaMes={false}
            carregantMes={false}
            onCarregaMes={vi.fn()}
            onReintenta={vi.fn()}
            onDescarta={vi.fn()}
            onMarcaVist={vi.fn()}
            locale="ca-ES"
            t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );

    const lupa = screen.getByRole('button', { name: 'Cerca en esta conversa' });
    fireEvent.click(lupa);
    const camp = screen.getByRole('searchbox', { name: 'Cerca missatges en esta conversa' });
    expect(document.activeElement).toBe(camp);

    fireEvent.change(camp, { target: { value: 'aigua' } });
    // Exclou el missatge 4 xifrat no verificat -> 2 coincidències (3 i 1)
    expect(screen.getByText('1 de 2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Coincidència anterior (més antiga)' }));
    expect(screen.getByText('2 de 2')).toBeTruthy();

    fireEvent.keyDown(camp, { key: 'Escape' });
    expect(screen.queryByRole('searchbox', { name: 'Cerca missatges en esta conversa' })).toBeNull();
    expect(document.activeElement).toBe(lupa);
  });
});

describe('Documents al Xat (PDF/CSV/ODT/DOCX/TXT <= 10 MB)', () => {
  test('preparaDocument valida PDF, CSV i rebutja executables, falsos PDF o > 10 MB', async () => {
    const pdfValid = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])], 'acta.pdf', { type: 'application/pdf' });
    const prep = await preparaDocument(pdfValid);
    expect(prep).toMatchObject({ tipus: 'document', nom: 'acta.pdf', extensio: 'pdf', mime: 'application/pdf' });

    const pdfFals = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04])], 'fals.pdf', { type: 'application/pdf' });
    await expect(preparaDocument(pdfFals)).rejects.toMatchObject({ code: 'document-contingut' });

    const exe = new File(['MZ'], 'virus.exe', { type: 'application/octet-stream' });
    await expect(preparaDocument(exe)).rejects.toMatchObject({ code: 'document-format' });

    const gran = new Blob([new Uint8Array(10)], { type: 'text/plain' });
    Object.defineProperty(gran, 'size', { value: LIMIT_DOCUMENT_BYTES + 1 });
    Object.defineProperty(gran, 'name', { value: 'enorme.txt' });
    await expect(preparaDocument(gran)).rejects.toMatchObject({ code: 'document-mida' });
  });

  /* SV-02 (Gauntlet de la integració v1.2.25) · Abans la prova demanava urlAdjuntXat en prémer Baixa i l'enllaç anava a la
     URL signada, sense cap validació en rebre. Ara la targeta demana els bytes al port (bytesAdjuntXat), els valida i
     l'enllaç porta un Blob amb eixos bytes i el MIME de la fila: res abans de prémer, cap URL signada ni cap fetch. */
  test('AdjuntXat pinta TargetaDocument i només demana els bytes en prémer Baixa; PanellAdjuntsConversa l’inclou', async () => {
    const doc = { id: 'doc-1', nom: 'pressupost.csv', bytes: 24_500, mime: 'text/csv', extensio: 'csv' };
    render(<AdjuntXat adjunt={doc} tipus="document" externalConfig={{ dataMode: 'remote' }} usuariId="u1" locale="ca-ES" t={t} />);
    expect(screen.getByText('pressupost.csv')).toBeTruthy();
    expect(screen.getByText('CSV · 25 kB')).toBeTruthy();
    expect(mocks.urlAdjuntXat).not.toHaveBeenCalled();
    expect(mocks.bytesAdjuntXat).not.toHaveBeenCalled();

    const fetchFals = vi.fn();
    const creat = vi.fn(() => 'blob:node.test/doc-1');
    vi.stubGlobal('fetch', fetchFals);
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: creat, revokeObjectURL: vi.fn() }));
    const clics = [];
    const clicSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clica() { clics.push([this.href, this.download]); });
    fireEvent.click(screen.getByRole('button', { name: 'Baixa el document: pressupost.csv' }));
    await waitFor(() => expect(mocks.bytesAdjuntXat).toHaveBeenCalledWith('doc-1', { dataMode: 'remote' }));
    await waitFor(() => expect(clicSpy).toHaveBeenCalledTimes(1));
    expect(mocks.urlAdjuntXat).not.toHaveBeenCalled();
    expect(fetchFals).not.toHaveBeenCalled();
    expect(creat).toHaveBeenCalledTimes(1);
    expect(creat.mock.calls[0][0].type).toBe('text/csv');
    expect(clics).toEqual([['blob:node.test/doc-1', 'pressupost.csv']]);
    clicSpy.mockRestore();
    vi.unstubAllGlobals();

    const extret = extrauContingutConversa([
      { id: 'm-doc', seq: 3, sender: 'other', author: 'Pep', tipus: 'document', creatAl: '2026-11-24T10:00:00Z', metadades: { adjunt: doc } }
    ], t);
    expect(extret.altres).toHaveLength(1);
    expect(extret.altres[0]).toMatchObject({ tipus: 'document', titolLlista: 'pressupost.csv' });
  });

  /* SV-02 (Gauntlet de la integració v1.2.25) · Un veí que no passa per l'App pot lliurar per la RPC i Storage uns bytes
     que la validació de l'enviament haguera refusat (ací, HTML dins d'un text/csv): qui rep no els baixa i la targeta diu,
     en la seua llengua, que l'arxiu no coincidix amb un document vàlid (documents.errorContingut, ja als 5 idiomes).
     Els bytes vénen del port (bytesAdjuntXat), cap fetch nou. */
  test.each([
    ['ca-ES', 'L’arxiu no coincidix amb un document vàlid.'],
    ['es-ES', 'El archivo no coincide con un documento válido.'],
    ['en-GB', 'The file does not match a valid document.'],
    ['eu-ES', 'Fitxategia ez dator bat baliozko dokumentu batekin.'],
    ['gl-ES', 'O arquivo non coincide cun documento válido.']
  ])('SV-02 · %s: un document que no passa la validació en rebre’l no es baixa', async (locale, avis) => {
    const doc = { id: 'doc-2', nom: 'factura.csv', bytes: 64, mime: 'text/csv', extensio: 'csv' };
    mocks.bytesAdjuntXat.mockImplementationOnce(async () => Uint8Array.from(new TextEncoder().encode('concepte;euros\n<script>alert(1)</script>;1\n')));
    const fetchFals = vi.fn();
    const creat = vi.fn(() => 'blob:node.test/doc-2');
    vi.stubGlobal('fetch', fetchFals);
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: creat, revokeObjectURL: vi.fn() }));
    const clicSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<AdjuntXat adjunt={doc} tipus="document" externalConfig={{ dataMode: 'remote' }} usuariId="u1" locale={locale} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(': factura\\.csv$') }));
    expect(await screen.findByText(avis)).toBeTruthy();
    expect(mocks.bytesAdjuntXat).toHaveBeenCalledTimes(1);
    expect(fetchFals).not.toHaveBeenCalled();
    expect(creat).not.toHaveBeenCalled();
    expect(clicSpy).not.toHaveBeenCalled();
    clicSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('VistaMultimedia viva (cerca, ordenació i miniatures segures)', () => {
  test('filtra amb Cerca, invertix amb Ordena i resol miniatura només per adjunt.id', async () => {
    const fils = [{ id: 'f1', name: 'Hort de dalt', tipus: 'grup' }];
    const msgs = {
      f1: [
        { id: 'i1', seq: 1, tipus: 'imatge', text: 'Tomaques velles', creatAl: '2026-09-01T10:00:00Z', metadades: { adjunt: { id: 'adj-img-1' } } },
        { id: 'i2', seq: 2, tipus: 'imatge', text: 'Pebreres noves', creatAl: '2026-10-05T10:00:00Z', metadades: { url: 'https://extern-espia.test/pixel.png' } }
      ]
    };
    render(<VistaMultimedia titol="Contingut multimèdia" fils={fils} missatgesPerFil={msgs} locale="ca-ES" idioma="ca" t={t} />);

    // Miniatura només per adj-img-1; la URL externa de metadades NO es carrega mai
    await waitFor(() => expect(document.querySelector('img.sdp-xat-multimedia__miniatura')?.getAttribute('src')).toBe('https://node.test/signed/adj-img-1'));
    expect(document.querySelectorAll('img.sdp-xat-multimedia__miniatura')).toHaveLength(1);
    expect(mocks.urlAdjuntXat).toHaveBeenCalledTimes(1);

    // Ordenació recent vs antic
    const textosInicials = [...document.querySelectorAll('.sdp-xat-fila__previa')].map((n) => n.textContent);
    expect(textosInicials[0]).toContain('Pebreres noves');
    fireEvent.click(screen.getByRole('button', { name: 'Ordena' }));
    const textosInvertits = [...document.querySelectorAll('.sdp-xat-fila__previa')].map((n) => n.textContent);
    expect(textosInvertits[0]).toContain('Tomaques velles');

    // Cerca activa
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca' }), { target: { value: 'pebreres' } });
    expect([...document.querySelectorAll('.sdp-xat-fila__previa')].map((n) => n.textContent)).toEqual(['Fotos · Pebreres noves']);
  });
});

describe('Restauració guiada .sdpbackup (PaginaCopiaSeguretatXat)', () => {
  const ABAST = { usuariId: '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70', tenantId: '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192' };
  const CLAU = 'clau-segura-poble-2026';

  test('desxifra, demana confirmació explícita i restaura localment desduplicant per UUID', async () => {
    const copia = await exportaCopiaSeguretatXat({
      ...ABAST,
      fils: [{ id: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', tipus: 'directe', titol: 'Rosa' }],
      missatges: [
        { id: '5a0b6ea3-0b71-4e83-8c6f-708192a3b4c5', filId: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', seq: 1, usuariId: ABAST.usuariId, text: 'Bon dia!', creatAl: '2026-11-10T08:00:00.000Z' }
      ],
      contrasenya: CLAU
    });
    const bytes = new TextEncoder().encode(copia);
    const arxiu = { name: 'copia.sdpbackup', size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(0) };

    const { idb } = creaIdbFals();
    const motorProva = {
      ...MOTOR_COPIA,
      restaura: (resultat, opcions) => restauraCopiaLocal(resultat, { ...opcions, indexedDB: idb }),
    };

    render(<CosCopiaSeguretatXat accio="restaura" abast={ABAST} idioma="ca" locale="ca-ES" motor={motorProva} />);
    fireEvent.change(screen.getByLabelText('Arxiu de la còpia'), { target: { files: [arxiu] } });
    await screen.findByText('Arxiu triat: copia.sdpbackup', {}, { timeout: 10000 });
    fireEvent.change(screen.getByLabelText('Contrasenya de la còpia'), { target: { value: CLAU } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisa la còpia' }));

    // Confirmació explícita abans d'escriure
    const botoConfirma = await screen.findByRole('button', { name: 'Restaura en este aparell' }, { timeout: 10000 });
    expect(screen.getByText(/El servidor remot no es sobreescriu/)).toBeTruthy();

    fireEvent.click(botoConfirma);
    expect(await screen.findByText('Còpia restaurada en este aparell', {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getByText(/1 converses i 1 missatges nous \(0 duplicats omesos\)/)).toBeTruthy();
  });

  test('sense IndexedDB disponible informa honestament i no fingix restauració en memòria', async () => {
    const copia = await exportaCopiaSeguretatXat({
      ...ABAST,
      fils: [{ id: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', tipus: 'directe', titol: 'Rosa' }],
      missatges: [
        { id: '5a0b6ea3-0b71-4e83-8c6f-708192a3b4c5', filId: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', seq: 1, usuariId: ABAST.usuariId, text: 'Bon dia!', creatAl: '2026-11-10T08:00:00.000Z' }
      ],
      contrasenya: CLAU
    });
    const bytes = new TextEncoder().encode(copia);
    const arxiu = { name: 'copia.sdpbackup', size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(0) };

    render(<CosCopiaSeguretatXat accio="restaura" abast={ABAST} idioma="ca" locale="ca-ES" motor={MOTOR_COPIA} />);
    fireEvent.change(screen.getByLabelText('Arxiu de la còpia'), { target: { files: [arxiu] } });
    await screen.findByText('Arxiu triat: copia.sdpbackup', {}, { timeout: 10000 });
    fireEvent.change(screen.getByLabelText('Contrasenya de la còpia'), { target: { value: CLAU } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisa la còpia' }));
    const botoConfirma = await screen.findByRole('button', { name: 'Restaura en este aparell' }, { timeout: 10000 });
    fireEvent.click(botoConfirma);
    expect(await screen.findByText(/IndexedDB/i, {}, { timeout: 10000 })).toBeTruthy();
  });
});
