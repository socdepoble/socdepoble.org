import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { CANALS_DE_BOTIGA } from '../../config/canalsDeBotiga.js';
import { CONSELL_PUBLIC } from './consellPublic.js';
import { BOTIGUES_SISTEMA_META } from './botiguesSistemaMeta.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { COMPTADORS_COMUNICATS, MODEL_BOTIGUES, VERSIO_WORDPRESS_LOCAL, creaModelBotigues, fraseEstatLocalAvisos, urlOptInDePlay, validaComptadorsComunicats } from './botiguesSistemaModel.js';

test('2/12 i14web són comunicacions diferents, datades, sempre separades d’un recompte en viu', () => {
  expect(MODEL_BOTIGUES.play.comptador).toBe('2/12');
  expect(MODEL_BOTIGUES.play.web).toBe('14');
  expect(MODEL_BOTIGUES.play.font).toContain('Javi Llinares');
  expect(MODEL_BOTIGUES.play.font).toMatch(/\b0?3:26\b/);
  expect(validaComptadorsComunicats(COMPTADORS_COMUNICATS).observatPlay).toBe('2026-11-08T02:26:00.000Z');
  expect(MODEL_BOTIGUES.play.font).toContain('sense hora, unitat o finestra');
  expect(MODEL_BOTIGUES.play.live).toBe(false);
  const ara = vi.spyOn(Date, 'now').mockReturnValue(0);
  try { expect(creaModelBotigues()).toEqual(MODEL_BOTIGUES); } finally { ara.mockRestore(); }
});

test.each([
  null, undefined, [], {},
  { ...COMPTADORS_COMUNICATS, play: -1 },
  { ...COMPTADORS_COMUNICATS, play: '2' },
  { ...COMPTADORS_COMUNICATS, objectiu: 0 },
  { ...COMPTADORS_COMUNICATS, web: 1.5 },
  { ...COMPTADORS_COMUNICATS, web: Infinity },
  { ...COMPTADORS_COMUNICATS, fontPlay: '' },
  { ...COMPTADORS_COMUNICATS, fontWeb: null },
  { ...COMPTADORS_COMUNICATS, observatPlay: '2026-02-30T03:26:00Z' },
  { ...COMPTADORS_COMUNICATS, observatPlay: '2026-11-08' },
  { ...COMPTADORS_COMUNICATS, observatPlay: '2026-11-08T03:26:00' },
])('un recompte invàlid no es convertix en zero o èxit:%j', (comptadors) => {
  expect(validaComptadorsComunicats(comptadors)).toBeNull();
  const model = creaModelBotigues({ comptadors: comptadors === undefined ? null : comptadors });
  expect(model.play.comptador).toBe('Sense dada');
  expect(model.play.web).toBe('Sense dada');
  expect(model.play.live).toBe(false);
});

test('zero comunicat és vàlid, més participants que l’objectiu també; cap getter defectuós ix del validador', () => {
  expect(validaComptadorsComunicats({ ...COMPTADORS_COMUNICATS, play: 0, web: 0 }).play).toBe(0);
  expect(validaComptadorsComunicats({ ...COMPTADORS_COMUNICATS, play: 15 }).play).toBe(15);
  expect(validaComptadorsComunicats(Object.defineProperty({}, 'play', { get() { throw Error('invalid'); } }))).toBeNull();
});

test('un accessor variable o camps heretats no són una instantània de dades pròpies', () => {
  let lectures = 0;
  const variable = Object.defineProperty({ ...COMPTADORS_COMUNICATS }, 'play', { get() { lectures++; return lectures <= 3 ? 2 : -1; } });
  expect(creaModelBotigues({ comptadors: variable }).play.comptador).toBe('Sense dada');
  expect(lectures).toBe(0);
  expect(validaComptadorsComunicats(Object.create(COMPTADORS_COMUNICATS))).toBeNull();
});

describe('enllaç de proves separat del canal públic', () => {
  test('només la forma del nostre appId; no s’atribuïx track actiu', () => {
    expect(urlOptInDePlay('https://play.google.com/apps/testing/org.socdepoble.app')).toBe('https://play.google.com/apps/testing/org.socdepoble.app');
    expect(MODEL_BOTIGUES.canals.find(c => c.id === 'google-play').url).toBeNull();
  });
  test.each([
    null, {}, 'javascript:alert(1)', 'http://play.google.com/apps/testing/org.socdepoble.app',
    'https://play.google.com.example.org/apps/testing/org.socdepoble.app',
    'https://play.google.com/apps/testing/org.other.app',
    'https://play.google.com:8443/apps/testing/org.socdepoble.app',
    'https://u:p@play.google.com/apps/testing/org.socdepoble.app',
    'https://play.google.com/apps/testing/org.socdepoble.app?beta=1',
    'https://play.google.com/apps/testing/org.socdepoble.app#token',
    'https://play.google.com/store/apps/details?id=org.socdepoble.app',
    'https://play.google.com/apps/testing/%6frg.socdepoble.app',
  ])('tanca la forma invàlida:%j', (url) => expect(urlOptInDePlay(url)).toBeNull());
});

test('canals nuls, invàlids o duplicats no s’obrin; el directori WordPress conserva la seua configuració', () => {
  expect(MODEL_BOTIGUES.canals.filter(c => c.url).map(c => c.id)).toEqual(['app-store', 'wordpress-org']);
  const canals = [...CANALS_DE_BOTIGA, { id: 'wordpress-org', url: 'https://wordpress.org/plugins/socdepoble/' }];
  expect(creaModelBotigues({ canals }).canals.filter(c => c.url).map(c => c.id)).toEqual(['app-store']);
  expect(creaModelBotigues({ canals: [{ id: 'google-play', url: MODEL_BOTIGUES.play.optInUrl }] }).canals.every(c => c.url === null)).toBe(true);
  expect(creaModelBotigues({ canals: null }).canals.every(c => c.url === null)).toBe(true);
});

test('la projecció del cens és exacta i sanejada, sense importar el BIOS o afirmar salut', () => {
  const bytes = readFileSync('.agents/consell.json');
  const original = JSON.parse(bytes);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('29c7ab87c1c0b72749957f501b47d8d4ff414ff1497ed6fe85152bd8a9f33ac4');
  expect(CONSELL_PUBLIC.membres).toEqual(original.membres.filter(m => m.actiu === true).map(({id, nom, url}) => ({id, nom, url})));
  expect(CONSELL_PUBLIC.membres).toHaveLength(12);
  for (const membre of CONSELL_PUBLIC.membres) expect(Object.keys(membre).sort()).toEqual(['id', 'nom', 'url']);
  expect(CONSELL_PUBLIC.dataDeclarada).toBe(original.meta.actualitzat);
  expect(MODEL_BOTIGUES.flota.runtimeVerified).toBe(false);
});

/* R16b (tercera ronda) · La font de VERSIO_WORDPRESS_LOCAL és el connector: la capçalera PHP
   (Version) i el Stable tag del readme. La versió de la web (package.json) en va a part: la prova no
   imposa que siguen iguals ni diferents. */
test('versió del connector comprovada contra la capçalera PHP i el Stable tag, sense lligar-la a la de la web', () => {
  const php = readFileSync('wordpress-plugin/socdepoble-enxufe.php','utf8');
  const readme = readFileSync('wordpress-plugin/readme.txt','utf8');
  expect(php.match(/^\s*\*?\s*Version:\s*(\S+)/m)?.[1]).toBe(VERSIO_WORDPRESS_LOCAL);
  expect(readme.match(/^Stable tag:\s*(\S+)/m)?.[1]).toBe(VERSIO_WORDPRESS_LOCAL);
});

test('la nova fitxa reutilitza el recurs aprovat i el seu alt sense modificar la font original', () => {
  expect(BOTIGUES_SISTEMA_META.image).toBe(PAGE_COPY.descarregues.image);
  expect(BOTIGUES_SISTEMA_META.imageAlt).toBe(PAGE_COPY.descarregues.imageAlt);
});

test('l’estat local no exposa errors/tokens i no acredita recepció; estats aliens fallen tancats', () => {
  expect(fraseEstatLocalAvisos({ disponible: true, estat: 'actiu', token: 'canary-private' })).toContain('no comprovada');
  for (const estat of ['constructor', '__proto__', 'token-canary', null]) expect(fraseEstatLocalAvisos({ disponible: true, estat })).toBe('Registre d’avisos sense confirmació operativa en esta instància.');
  expect(fraseEstatLocalAvisos(null)).toContain('Cap adaptador');
});

/* Sanejament R15 (B3/B4) · L'app nativa sense VITE_SDP_PUSH_NATIU=1 (motiu 'sense-config') o sense el
   connector no diu que els avisos natius funcionen, encara que el registre diga 'inactiu'. */
test('push natiu apagat o sense connector: no s’oferix, i ho diu', () => {
  expect(fraseEstatLocalAvisos({ disponible: true, tipus: 'natiu', motiu: 'sense-config', estat: 'inactiu' })).toBe('Els avisos push natius no s’oferixen: este build de l’app no porta la configuració d’FCM i APNs.');
  expect(fraseEstatLocalAvisos({ disponible: true, tipus: 'natiu', motiu: 'sense-connector', estat: 'inactiu' })).toMatch(/no s’oferixen: este binari no porta el connector/);
  for (const motiu of ['sense-config', 'sense-connector']) expect(fraseEstatLocalAvisos({ disponible: true, motiu, estat: 'actiu' })).not.toMatch(/Activats/);
});
