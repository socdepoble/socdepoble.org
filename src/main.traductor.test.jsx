/* IDEA-31 (QA-R2-13) · main.jsx declara el Traductor Sobirà del lloc propi:
   VITE_TRADUCTOR_URL en qualsevol build; SDP_TRADUCTOR_DEV, que només definix
   el servidor de desenvolupament (tooling/vite/traductor-iaia.mjs); i cap clau
   sense cap dels dos (la web publicada, l'app nativa i Vitest), on Traduir
   continua dient «no disponible». host.js i l'App s'espien, com a
   entrades.capaDelPaquet.test.jsx. */
import { afterEach, expect, test, vi } from 'vitest';

const pintats = vi.hoisted(() => []);

vi.mock('./host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(async () => ({ fase: 'segellat' })), arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: (node) => pintats.push(node) }) }));
vi.mock('./PedraSecaEmbed.jsx', () => ({ default: () => null }));
vi.mock('./css/index.css?inline', () => ({ default: '' }));

/** La config del lloc que main.jsx passa a configura() i a l'App, en un registre de mòduls nou. */
async function configDeMain() {
  vi.resetModules();
  pintats.length = 0;
  const arrel = document.createElement('div');
  arrel.setAttribute('id', 'root');
  document.body.replaceChildren(arrel);
  await import('./main.jsx');
  const host = await import('./host.js');
  const { traductorLliureDelLloc } = await import('./data/traductorLliure.js');
  const [[opcions]] = host.configura.mock.calls;
  return { config: opcions.config, pintat: pintats[0].props.config, lliure: traductorLliureDelLloc() };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  document.body.replaceChildren();
});

test('sense VITE_TRADUCTOR_URL ni servidor de desenvolupament: cap traductorUrl, com abans', async () => {
  vi.stubEnv('VITE_TRADUCTOR_URL', '');
  vi.stubEnv('SDP_TRADUCTOR_DEV', '');
  const { config, pintat } = await configDeMain();
  expect(config).toEqual({ pluginUrl: '/', manageDocumentHead: true, routerType: 'browser' });
  expect(config).not.toHaveProperty('traductorUrl');
  expect(pintat).not.toHaveProperty('traductorUrl');
});

test('el servidor de desenvolupament (SDP_TRADUCTOR_DEV) porta Traduir a /__iaia/traduir', async () => {
  vi.stubEnv('VITE_TRADUCTOR_URL', '');
  vi.stubEnv('SDP_TRADUCTOR_DEV', '/__iaia/traduir');
  const { config, pintat } = await configDeMain();
  expect(config).toEqual({ pluginUrl: '/', manageDocumentHead: true, routerType: 'browser', traductorUrl: '/__iaia/traduir' });
  expect(pintat.traductorUrl).toBe('/__iaia/traduir');
});

/* Ampliació del Mestre (261030) · socdepoble.org és estàtic: l'entrada pròpia
   fixa el transport lliure d'Apertium per la via interna, mai per la config
   que també podria escriure un amfitrió. */
test('l’entrada pròpia fixa el transport lliure d’Apertium per la via interna, fora de la config', async () => {
  vi.stubEnv('VITE_TRADUCTOR_URL', '');
  vi.stubEnv('SDP_TRADUCTOR_DEV', '');
  const { config, pintat, lliure } = await configDeMain();
  expect(lliure).toBe('apertium');
  expect(Object.keys(config).filter((clau) => /lliure|apertium/i.test(clau))).toEqual([]);
  expect(Object.keys(pintat).filter((clau) => /lliure|apertium/i.test(clau))).toEqual([]);
});

test('VITE_TRADUCTOR_URL l’activa en qualsevol build i mana damunt del de desenvolupament', async () => {
  vi.stubEnv('SDP_TRADUCTOR_DEV', '/__iaia/traduir');
  vi.stubEnv('VITE_TRADUCTOR_URL', '/wp-json/socdepoble/v1/traduir');
  const { config } = await configDeMain();
  expect(config.traductorUrl).toBe('/wp-json/socdepoble/v1/traduir');
});

/* Gauntlet 261030 (Fase 3, TC3.1) · El connector de desenvolupament declara
   els destins que servix (SDP_TRADUCTOR_DEV_LLENGUES) i main.jsx els passa al
   nucli amb el seu traductorUrl. Un VITE_TRADUCTOR_URL no en porta cap: els
   d'un altre servei no s'hi apliquen. */
test('TC3.1 · els destins del servidor de desenvolupament van amb el seu traductorUrl, i només amb ell', async () => {
  vi.stubEnv('VITE_TRADUCTOR_URL', '');
  vi.stubEnv('SDP_TRADUCTOR_DEV', '/__iaia/traduir');
  vi.stubEnv('SDP_TRADUCTOR_DEV_LLENGUES', 'ES GL EN-GB FR');
  const dev = await configDeMain();
  expect(dev.config).toEqual({ pluginUrl: '/', manageDocumentHead: true, routerType: 'browser', traductorUrl: '/__iaia/traduir', traductorLlengues: 'ES GL EN-GB FR' });
  expect(dev.pintat.traductorLlengues).toBe('ES GL EN-GB FR');
  vi.clearAllMocks();
  vi.stubEnv('VITE_TRADUCTOR_URL', '/wp-json/socdepoble/v1/traduir');
  const propi = await configDeMain();
  expect(propi.config.traductorUrl).toBe('/wp-json/socdepoble/v1/traduir');
  expect(propi.config).not.toHaveProperty('traductorLlengues');
  vi.clearAllMocks();
  vi.stubEnv('VITE_TRADUCTOR_URL', '');
  vi.stubEnv('SDP_TRADUCTOR_DEV', '');
  expect((await configDeMain()).config).not.toHaveProperty('traductorLlengues');
});
