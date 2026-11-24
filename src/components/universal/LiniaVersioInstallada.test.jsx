/**
 * Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · La línia de /versions i /control:
 * «Instal·lada al dispositiu: X (build N) · Última publicada: Y (build M)», en cinc llengües. Casos:
 * l'App nativa (socdepoble.org), la web pròpia (el mateix origen), el connector (cap consulta), un
 * manifest d'abans, un manifest dolent o sense xarxa; i que les dues pàgines la pinten.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { VERSIO_CLIENT_NATIU } from '../../data/contracte.js';
import LiniaVersioInstallada, {
  SENSE_CONSULTA_MANIFEST,
  TEXTOS_LINIA_VERSIO,
  publicadaDelManifest,
  textLiniaVersio,
  urlManifestPublic
} from './LiniaVersioInstallada.jsx';

const SHA = 'a'.repeat(64);
const resposta = (cos, { ok = true } = {}) => ({ ok, status: ok ? 200 : 503, text: async () => (typeof cos === 'string' ? cos : JSON.stringify(cos)) });
const ambProves = { version: '1.2.7', androidBuild: 1, iosBuild: 1, testflightIosBuild: 12, apkDirectBuild: 12, apkSha256: SHA, latestBuild: 12, entries: [] };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('les peces pures', () => {
  test('urlManifestPublic: socdepoble.org dins de l\'App; el mateix origen a socdepoble.org i a socdepoble.cat; enlloc més', () => {
    for (const plataforma of ['android', 'ios']) {
      expect(urlManifestPublic({ plataforma, origen: 'capacitor://localhost' })).toBe('https://socdepoble.org/.well-known/ard.json');
    }
    expect(urlManifestPublic({ plataforma: 'web', origen: 'https://socdepoble.org' })).toBe('https://socdepoble.org/.well-known/ard.json');
    expect(urlManifestPublic({ plataforma: 'web', origen: 'https://socdepoble.cat' })).toBe('https://socdepoble.cat/.well-known/ard.json');
    for (const origen of ['https://un-poble.example', 'http://localhost:3340', null]) expect(urlManifestPublic({ plataforma: 'web', origen }), String(origen)).toBeNull();
  });

  test('textLiniaVersio: el format del Mestre, en les cinc llengües, a l\'App i a la web', () => {
    expect(textLiniaVersio({ llengua: 'ca', plataforma: 'ios', versio: '1.2.6', build: 11, publicada: { versio: '1.2.7', build: 12 } }))
      .toBe('Instal·lada al dispositiu: 1.2.6 (build 11) · Última publicada: 1.2.7 (build 12)');
    expect(textLiniaVersio({ llengua: 'ca', plataforma: 'web', versio: '1.2.6', publicada: { versio: '1.2.7', build: 12 } }))
      .toBe('Instal·lada al dispositiu: 1.2.6 (web) · Última publicada: 1.2.7 (build 12)');
    expect(textLiniaVersio({ llengua: 'ca', plataforma: 'android', versio: '1.2.6', build: 11, publicada: null })).toMatch(/· Última publicada: s’està comprovant…$/);
    expect(textLiniaVersio({ llengua: 'ca', plataforma: 'android', versio: '1.2.6', build: 11, publicada: false })).toMatch(/· Última publicada: no s’ha pogut comprovar$/);
    expect(textLiniaVersio({ llengua: 'ca', plataforma: 'web', versio: '1.2.6', publicada: SENSE_CONSULTA_MANIFEST }))
      .toBe('Instal·lada al dispositiu: 1.2.6 (web)');
    expect(Object.keys(TEXTOS_LINIA_VERSIO)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    const claus = Object.keys(TEXTOS_LINIA_VERSIO.ca);
    for (const [llengua, textos] of Object.entries(TEXTOS_LINIA_VERSIO)) {
      expect(Object.keys(textos), llengua).toEqual(claus);
      const text = textLiniaVersio({ llengua, plataforma: 'android', versio: '1.2.6', build: 11, publicada: { versio: '1.2.7', build: 12 } });
      expect(text, llengua).toMatch(/1\.2\.6 \(build 11\) · .*1\.2\.7 \(build 12\)$/);
      expect(text, llengua).not.toMatch(/\{|\}/);
    }
    expect(textLiniaVersio({ llengua: 'en', plataforma: 'ios', versio: '1.2.6', build: 11, publicada: { versio: '1.2.7', build: 12 } }))
      .toBe('Installed on this device: 1.2.6 (build 11) · Latest published: 1.2.7 (build 12)');
    expect(textLiniaVersio({ llengua: 'fr', plataforma: 'ios', versio: '1', build: 1, publicada: false })).toMatch(/^Instal·lada al dispositiu/);
  });
});

describe('P0123-06 · publicadaDelManifest: el build de la plataforma del dispositiu', () => {
  const local = { versio: '1.2.7', build: 12 };
  test('cada plataforma, els seus canals; mai els de l\'altra ni un latestBuild escrit a mà', () => {
    const tots = { version: '1.2.7', androidBuild: 12, iosBuild: 12, testflightIosBuild: 14, apkDirectBuild: 13, apkSha256: SHA, latestBuild: 99, entries: [] };
    expect(publicadaDelManifest(tots, { plataforma: 'ios', ...local })).toEqual({ versio: '1.2.7', build: 14 });
    /* v1.2.16 (ZERO APK fora de botiga, ordre del Mestre 261121) · L'apkDirectBuild 13 heretat ja no es llig
       (config/manifestVersio.js): a Android, el build de Google Play, 12. Fins a la v1.2.15 esta línia deia 13. */
    expect(publicadaDelManifest(tots, { plataforma: 'android', ...local })).toEqual({ versio: '1.2.7', build: 12 });
    expect(publicadaDelManifest({ ...tots, testflightIosBuild: undefined }, { plataforma: 'ios', ...local })).toEqual({ versio: '1.2.7', build: 12 });
    // A la web, només la versió.
    expect(publicadaDelManifest(tots, { plataforma: 'web', ...local })).toEqual({ versio: '1.2.7' });
  });

  test('un manifest endarrerit (el build 1 de la 1.0.0 amb la versió 1.2.7) no es diu: només la versió', () => {
    const arbre = { version: '1.2.7', androidBuild: 1, iosBuild: 1, entries: [] };
    for (const plataforma of ['android', 'ios']) {
      expect(publicadaDelManifest(arbre, { plataforma, ...local }), plataforma).toEqual({ versio: '1.2.7' });
      expect(textLiniaVersio({ llengua: 'ca', plataforma, ...local, publicada: publicadaDelManifest(arbre, { plataforma, ...local }) }), plataforma)
        .toBe('Instal·lada al dispositiu: 1.2.7 (build 12) · Última publicada: 1.2.7');
    }
    // Amb una versió més nova i un build més baix, tampoc.
    expect(publicadaDelManifest({ ...arbre, version: '1.2.8' }, { plataforma: 'ios', ...local })).toEqual({ versio: '1.2.8' });
    // Un servidor amb una versió més vella i un build més baix és cert (un mòbil de proves que va davant): es diu.
    expect(publicadaDelManifest({ ...arbre, version: '1.2.6', iosBuild: 11 }, { plataforma: 'ios', ...local })).toEqual({ versio: '1.2.6', build: 11 });
    // Sense cap build de la plataforma, o sense versió: sense dades.
    expect(publicadaDelManifest({ version: '1.2.7', androidBuild: 3, entries: [] }, { plataforma: 'ios', ...local })).toBe(false);
    expect(publicadaDelManifest({ androidBuild: 3, iosBuild: 3, entries: [] }, { plataforma: 'web', ...local })).toBe(false);
    expect(publicadaDelManifest(null, { plataforma: 'web', ...local })).toBe(false);
  });

  test('la plantilla sense build, en les cinc llengües', () => {
    for (const [llengua, textos] of Object.entries(TEXTOS_LINIA_VERSIO)) {
      const text = textLiniaVersio({ llengua, plataforma: 'web', versio: '1.2.7', publicada: { versio: '1.2.7' } });
      expect(text, llengua).toBe(`${textos.installadaWeb.replace('{versio}', '1.2.7')} · ${textos.publicadaSenseBuild.replace('{versio}', '1.2.7')}`);
      expect(text, llengua).not.toMatch(/\{|\}|build/);
    }
  });
});

describe('el component', () => {
  test('dins de l\'App: el build instal·lat i el més alt publicat (latestBuild), del manifest de socdepoble.org', async () => {
    /* v1.2.16 (ZERO APK fora de botiga) · El build 12 d'Android és ara el de Google Play (androidBuild): fins a la
       v1.2.15 venia de l'apkDirectBuild 12 d'ambProves, que config/manifestVersio.js ja no llig. */
    const fetchImpl = vi.fn(async () => resposta({ ...ambProves, androidBuild: 12 }));
    render(<LiniaVersioInstallada plataforma="android" origen="https://localhost" fetchImpl={fetchImpl} />);
    expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/s’està comprovant/);
    await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent)
      .toBe(`Instal·lada al dispositiu: ${VERSIO_SISTEMA} (build ${VERSIO_CLIENT_NATIU}) · Última publicada: 1.2.7 (build 12)`));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://socdepoble.org/.well-known/ard.json');
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
  });

  test('un manifest d\'abans (sense latestBuild ni canals de proves): el més alt de les botigues públiques', async () => {
    const fetchImpl = vi.fn(async () => resposta({ version: '1.2.6', androidBuild: 1, iosBuild: 3, entries: [] }));
    render(<LiniaVersioInstallada plataforma="ios" origen="capacitor://localhost" fetchImpl={fetchImpl} llengua="es" />);
    await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/· Última publicada: 1\.2\.6 \(build 3\)$/));
    expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/^Instalada en el dispositivo:/);
  });

  test('P0123-06 · a la web pròpia, el manifest del mateix origen, «(web)» i la versió publicada sense cap build natiu', async () => {
    const fetchImpl = vi.fn(async () => resposta(ambProves));
    render(<LiniaVersioInstallada plataforma="web" origen="https://socdepoble.org" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent)
      .toBe(`Instal·lada al dispositiu: ${VERSIO_SISTEMA} (web) · Última publicada: 1.2.7`));
  });

  test('P0123-06 · en un iPhone, el build d\'iOS: mai el de l\'APK d\'Android ni el latestBuild', async () => {
    const fetchImpl = vi.fn(async () => resposta({ ...ambProves, testflightIosBuild: null, iosBuild: VERSIO_CLIENT_NATIU, apkDirectBuild: VERSIO_CLIENT_NATIU + 1, latestBuild: 99 }));
    render(<LiniaVersioInstallada plataforma="ios" origen="capacitor://localhost" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent)
      .toBe(`Instal·lada al dispositiu: ${VERSIO_SISTEMA} (build ${VERSIO_CLIENT_NATIU}) · Última publicada: 1.2.7 (build ${VERSIO_CLIENT_NATIU})`));
  });

  test('IDEA-332 · al connector i a localhost cap consulta ni falsa alarma («només la instal·lada»); sense xarxa o amb un manifest dolent quan sí es consulta, «no s\'ha pogut comprovar»', async () => {
    const fetchImpl = vi.fn(async () => resposta(ambProves));
    for (const origen of ['https://un-poble.example', 'http://localhost:3340']) {
      render(<LiniaVersioInstallada plataforma="web" origen={origen} fetchImpl={fetchImpl} />);
      expect(screen.getByTestId('linia-versio-installada').textContent, origen)
        .toBe(`Instal·lada al dispositiu: ${VERSIO_SISTEMA} (web)`);
      expect(screen.getByTestId('linia-versio-installada').textContent, origen).not.toMatch(/no s’ha pogut comprovar/);
      cleanup();
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    for (const dolent of [
      async () => { throw new TypeError('Failed to fetch'); },
      async () => resposta('x', { ok: false }),
      async () => resposta({ version: '1.2', androidBuild: 1, entries: [] }),
      async () => resposta({ version: '1.2.7', entries: [] })
    ]) {
      render(<LiniaVersioInstallada plataforma="android" origen="https://localhost" fetchImpl={dolent} />);
      await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/no s’ha pogut comprovar$/));
      cleanup();
    }
  });

  test('cap pintat no torna a preguntar (la funció per defecte és estable)', async () => {
    // v1.2.16 · El build 12 d'Android, de Google Play (l'apkDirectBuild ja no es llig).
    const fetchImpl = vi.fn(async () => resposta({ ...ambProves, androidBuild: 12 }));
    const { rerender } = render(<LiniaVersioInstallada plataforma="android" origen="https://localhost" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/build 12\)$/));
    rerender(<LiniaVersioInstallada plataforma="android" origen="https://localhost" fetchImpl={fetchImpl} llengua="en" />);
    expect(screen.getByTestId('linia-versio-installada').textContent).toMatch(/^Installed on this device/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('les pàgines', () => {
  const arrel = path.resolve(import.meta.dirname, '..', '..', '..');
  test('/versions (TextSection) i /control (ControlSection) la pinten amb la llengua de la interfície; PAGE_COPY no la porta', async () => {
    const text = readFileSync(path.join(arrel, 'src', 'sections', 'text', 'TextSection.jsx'), 'utf8');
    expect(text).toContain('<Suspense fallback={<LiniaVersioInstallada llengua={language} />}>');
    expect(text).toContain('<QuadreEstatCanalsVersions llengua={language} etiquetes={page.labels} />');
    const control = readFileSync(path.join(arrel, 'src', 'sections', 'control', 'ControlSection.jsx'), 'utf8');
    expect(control).toContain('<LiniaVersioInstallada llengua={idioma} />');
    const { PAGE_COPY } = await import('../../sections/text/pageContent.js');
    /* Onada v1.2.7 · La crònica de /versions nomena els rètols («Instal·lada al dispositiu» i «Última publicada»); el
       que PAGE_COPY no ha de portar és la línia pintada, rètol amb dos punts i versió (TEXTOS_LINIA_VERSIO). */
    expect(JSON.stringify(PAGE_COPY.versions)).not.toMatch(/Instal·lada al dispositiu: |Última publicada: /);
  });
});
