/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 12) · El canal de
 * veres: l'amfitrió declara l'adreça amb configura({ config }), que la deixa
 * congelada a la política d'execució (runtimePolicy.js, rawHostConfig), i la
 * configuració de les fonts la llig d'allí sense que ningú li la passe. La
 * política és immutable: una sola per fitxer de proves.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { setRuntimePolicy } from '../../../config/runtimePolicy.js';
import { CLAU_RETORN_AMFITRIO, configFontsDeLEntorn, retornDeclaratPerLAmfitrio } from './configFonts.js';

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const RETORN = 'http://localhost:3000/amfitrio/tornada-google.html';

afterEach(() => document.querySelectorAll('soc-de-poble').forEach((element) => element.remove()));

test('incrustada, amb l’adreça declarada per l’amfitrió a configura(): Google s’activa amb eixa adreça', () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  setRuntimePolicy({ rawHostConfig: { [CLAU_RETORN_AMFITRIO]: RETORN } });
  document.body.append(document.createElement('soc-de-poble'));
  expect(retornDeclaratPerLAmfitrio()).toBe(RETORN);
  const config = configFontsDeLEntorn({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT }, { origen: 'http://localhost:3000' });
  expect(config).toMatchObject({ configurades: true, motiu: null, redirectUri: RETORN });
  avis.mockRestore();
});
