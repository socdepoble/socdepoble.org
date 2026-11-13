// @vitest-environment node
// The real CLI router with fixture-only native entry points. Never runs a
// native compiler, signing utility, credential lookup or upload.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  android: vi.fn(), ios: vi.fn(), preflight: vi.fn(), external: vi.fn(),
  hygiene: { valid: true, fitxers: 0, examinades: [], incidencies: [] }
}));
vi.mock('../scripts/botigues/puja-android.mjs', () => ({ main: fixture.android }));
vi.mock('../scripts/botigues/puja-ios.mjs', () => ({ main: fixture.ios }));
vi.mock('../scripts/botigues/preflight.mjs', () => ({ arrelComprovada: () => '/synthetic-r21-2', preflight: fixture.preflight }));
vi.mock('../scripts/botigues/entorn.mjs', async importOriginal => ({ ...(await importOriginal()), executa: fixture.external }));
vi.mock('../tooling/vite/consola-iaia.mjs', () => ({
  CANALS_JARVIS: ['web', 'wordpress', 'android', 'ios'],
  recullEmpaquetats: () => ({ canonica: '1.1.12', plataformes: { android: { builds: ['3'] } } })
}));
vi.mock('../tooling/gates/tractor-higiene-paquets.mjs', () => ({ inspeccionaHigienePaquets: () => fixture.hygiene }));

import { main } from '../scripts/botigues/publica-tot.mjs';
import { analitzaConfirmacio, EIXIDA } from '../scripts/botigues/entorn.mjs';
const base = ['--versio', '1.1.12', '--build', '3'];
beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  fixture.hygiene = { valid: true, fitxers: 0, examinades: [], incidencies: [] };
  fixture.preflight.mockReturnValue({ codi: EIXIDA.BE, linies: [], valors: {}, jdk: { home: '/synthetic-jdk' } });
  fixture.android.mockResolvedValue(EIXIDA.BE);
  fixture.ios.mockResolvedValue(EIXIDA.BE);
  fixture.external.mockResolvedValue({ codi: EIXIDA.EXTERNA });
});
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('R21.2 publica-tot native delegation', () => {
  test('iOS --compila reaches the existing builder with push and channel, without external tools in the router', async () => {
    expect(await main([...base, '--plataforma', 'ios', '--canal', 'produccio', '--push', '--compila'])).toBe(EIXIDA.BE);
    expect(fixture.ios).toHaveBeenCalledExactlyOnceWith([...base, '--canal', 'produccio', '--push', '--compila']);
    expect(fixture.android).not.toHaveBeenCalled();
    expect(fixture.external).not.toHaveBeenCalled();
  });
  test('an invalid confirmation is delegated to the existing confirmation guard and cannot become success', async () => {
    fixture.ios.mockImplementation(async args => {
      const confirmation = args.find(a => a.startsWith('--confirma='))?.slice('--confirma='.length);
      return analitzaConfirmacio(confirmation, { versio: '1.1.12', build: '3', canal: 'intern' }).valida ? EIXIDA.BE : EIXIDA.CONFIRMACIO;
    });
    expect(await main([...base, '--plataforma', 'ios', '--confirma=invalid'])).toBe(EIXIDA.CONFIRMACIO);
    expect(fixture.ios).toHaveBeenCalledExactlyOnceWith([...base, '--canal', 'intern', '--confirma=invalid']);
    expect(fixture.external).not.toHaveBeenCalled();
  });
  test.each(['android', 'ios'])('%s errors propagate from the native script before any APK work', async platform => {
    fixture[platform].mockResolvedValue(EIXIDA.FALTA);
    expect(await main([...base, '--plataforma', platform, '--compila', '--push'])).toBe(EIXIDA.FALTA);
    expect(fixture.external).not.toHaveBeenCalled();
  });
  test('Android confirmation preserves the artefact-specific sha12 and does not compile an APK', async () => {
    const confirmation = 'produccio:1.1.12+3@abcdef012345';
    expect(await main([...base, '--plataforma', 'android', '--canal', 'produccio', '--push', `--confirma=${confirmation}`])).toBe(EIXIDA.BE);
    expect(fixture.android).toHaveBeenCalledExactlyOnceWith([...base, '--canal', 'produccio', '--push', `--confirma=${confirmation}`]);
    expect(fixture.external).not.toHaveBeenCalled();
  });
  test('Android compiles the AAB via the existing entry point before the direct APK and propagates APK failure', async () => {
    expect(await main([...base, '--plataforma', 'android', '--compila'])).toBe(EIXIDA.EXTERNA);
    expect(fixture.android).toHaveBeenCalledExactlyOnceWith([...base, '--canal', 'intern', '--compila']);
    expect(fixture.external.mock.calls[0][1]).toEqual(['--no-daemon', 'assembleRelease']);
    expect(fixture.android.mock.invocationCallOrder[0]).toBeLessThan(fixture.external.mock.invocationCallOrder[0]);
  });
  test.each(['--compila', '--confirma=invalid'])('all-platform %s is refused before any native action', async action => {
    expect(await main([...base, '--plataforma', 'totes', action])).toBe(EIXIDA.US);
    expect(fixture.android).not.toHaveBeenCalled();
    expect(fixture.ios).not.toHaveBeenCalled();
    expect(fixture.external).not.toHaveBeenCalled();
  });
  test.each(['web', 'wordpress'])('%s unsupported publication reports an error instead of doing nothing successfully', async platform => {
    expect(await main([...base, '--plataforma', platform, '--compila'])).toBe(EIXIDA.EINA);
    expect(fixture.android).not.toHaveBeenCalled();
    expect(fixture.ios).not.toHaveBeenCalled();
  });
  test('a dry summary returns the failing native preflight code and forwards push', async () => {
    fixture.preflight.mockReturnValue({ codi: EIXIDA.FALTA, linies: ['fixture: missing credentials'], valors: {} });
    expect(await main([...base, '--plataforma', 'ios', '--push', '--json'])).toBe(EIXIDA.FALTA);
    expect(fixture.preflight).toHaveBeenCalledWith(expect.objectContaining({ push: true, plataformes: ['ios'] }));
    expect(fixture.ios).not.toHaveBeenCalled();
  });
  test('mixed Jarvis and native flags cannot silently discard an explicit confirmation', async () => {
    expect(await main(['--notes', 'fixture', '--sec', '--confirma=invalid'])).toBe(EIXIDA.US);
    expect(fixture.android).not.toHaveBeenCalled();
    expect(fixture.ios).not.toHaveBeenCalled();
  });
  test('the existing Jarvis dry protocol remains available without native actions', async () => {
    expect(await main(['--notes', 'fixture', '--canals', 'web,wordpress,ios', '--sec'])).toBe(EIXIDA.BE);
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('"pas":"ios","estat":"fet"'));
    expect(fixture.external).not.toHaveBeenCalled();
    expect(fixture.ios).not.toHaveBeenCalled();
  });
  test('the existing non-dry Jarvis native command contract is preserved', async () => {
    expect(await main(['--notes', 'fixture', '--canals', 'ios'])).toBe(EIXIDA.EXTERNA);
    expect(fixture.external).toHaveBeenCalledWith(process.execPath,
      ['scripts/botigues/puja-ios.mjs', '--versio', '1.1.12', '--build', '1', '--confirma=1.1.12+1'],
      expect.objectContaining({ mostra: false, eco: false }));
    expect(fixture.ios).not.toHaveBeenCalled();
  });
  test('JSON mode cannot be silently ignored by a real action', async () => {
    expect(await main([...base, '--plataforma', 'ios', '--compila', '--json'])).toBe(EIXIDA.US);
    expect(fixture.ios).not.toHaveBeenCalled();
  });
});
