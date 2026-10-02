// @vitest-environment node
/* Gestoria · nucli · catàleg de proveïdors: forma de cada entrada, NIF
   públics vàlids i cerca per domini, NIF i nom de fitxer. Els números de
   factura de prova són sintètics. */
import { describe, expect, test } from 'vitest';
import { CATALEG_PROVEIDORS, proveidorPerDomini, proveidorPerNif, proveidorPerNomFitxer } from './cataleg.js';
import { validaNif } from './nif.js';

const CADENCIES = ['mensual', 'trimestral', 'anual', 'puntual', null];
const clauDe = (p) => p?.clau ?? null;
const xifres = (n) => '7'.repeat(n);

describe('CATALEG_PROVEIDORS: forma', () => {
  test('hi són els proveïdors demanats', () => {
    const claus = CATALEG_PROVEIDORS.map(clauDe);
    for (const clau of [
      'google-cloud', 'som-energia', 'lowi', 'siteground', 'dondominio', 'adobe', 'fal-ai', 'sollutia', 'iberdrola', 'endesa',
      'movistar', 'orange', 'amazon', 'apple', 'microsoft', 'openai', 'anthropic', 'github', 'cloudflare', 'ionos', 'hostinger',
      'ovhcloud', 'digitalocean'
    ]) expect(claus).toContain(clau);
  });

  test('claus úniques', () => {
    const claus = CATALEG_PROVEIDORS.map(clauDe);
    expect(new Set(claus).size).toBe(claus.length);
  });

  test.each(CATALEG_PROVEIDORS.map((p) => [p.clau, p]))('%s té la forma del contracte', (_, p) => {
    expect(typeof p.nom).toBe('string');
    expect(p.nom.length).toBeGreaterThan(0);
    expect(p.nif === null || typeof p.nif === 'string').toBe(true);
    expect(CADENCIES).toContain(p.cadencia);
    expect(p.ivaHabitual === null || [0, 4, 5, 10, 21].includes(p.ivaHabitual)).toBe(true);
    for (const camp of ['dominis', 'patronsFitxer', 'patronsNum', 'paraulesText']) expect(Array.isArray(p[camp])).toBe(true);
    for (const d of p.dominis) expect(d).toMatch(/^(?!www\.)[a-z0-9-]+(\.[a-z0-9-]+)+$/);
    for (const patro of [...p.patronsFitxer, ...p.patronsNum]) {
      expect(patro).toBeInstanceOf(RegExp);
      expect(patro.global || patro.sticky).toBe(false);
    }
    for (const paraula of p.paraulesText) expect(typeof paraula).toBe('string');
    if ('notes' in p) expect(typeof p.notes).toBe('string');
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.dominis)).toBe(true);
  });

  test('els NIF publicats són vàlids', () => {
    const ambNif = CATALEG_PROVEIDORS.filter((p) => p.nif);
    expect(ambNif.map(clauDe)).toEqual(['google-cloud', 'som-energia', 'lowi', 'siteground', 'dondominio', 'adobe']);
    for (const p of ambNif) expect(validaNif(p.nif).valid).toBe(true);
  });

  test('dades fixades pel contracte', () => {
    const per = Object.fromEntries(CATALEG_PROVEIDORS.map((p) => [p.clau, p]));
    expect(per['google-cloud']).toMatchObject({ cadencia: 'mensual', ivaHabitual: 0 });
    expect(per['google-cloud'].notes).toMatch(/subjecte passiu/);
    expect(per['som-energia']).toMatchObject({ cadencia: 'mensual', ivaHabitual: null });
    expect(per.lowi).toMatchObject({ cadencia: 'mensual', ivaHabitual: 21 });
    expect(per.siteground.cadencia).toBe('anual');
    expect(per.dondominio.cadencia).toBe('anual');
    expect(per.adobe).toMatchObject({ cadencia: 'mensual', ivaHabitual: 0 });
    for (const clau of ['fal-ai', 'sollutia', 'iberdrola', 'openai', 'digitalocean']) expect(per[clau].nif).toBeNull();
  });

  test('el catàleg no es pot modificar', () => {
    expect(Object.isFrozen(CATALEG_PROVEIDORS)).toBe(true);
    expect(() => CATALEG_PROVEIDORS.push({})).toThrow(TypeError);
  });

  test('els patrons de número reconeixen els seus formats', () => {
    const per = Object.fromEntries(CATALEG_PROVEIDORS.map((p) => [p.clau, p]));
    expect(per['som-energia'].patronsNum[0].test(`FE${xifres(10)}`)).toBe(true);
    expect(per['som-energia'].patronsNum[0].test(`FE${xifres(9)}`)).toBe(false);
    expect(per.lowi.patronsNum[0].test(`CI${xifres(14)}`)).toBe(true);
    expect(per.lowi.patronsNum[0].test(`CI${xifres(13)}`)).toBe(false);
    expect(per.dondominio.patronsNum[0].test('DD2026-77')).toBe(true);
    expect(per.dondominio.patronsNum[0].test('DD26-77')).toBe(false);
  });
});

describe('proveidorPerDomini', () => {
  test.each([
    ['google.com', 'google-cloud'],
    ['payments.google.com', 'google-cloud'],
    ['payments-noreply@google.com', 'google-cloud'],
    ['Google Payments <payments-noreply@google.com>', 'google-cloud'],
    ['https://www.somenergia.coop/ca/factures', 'som-energia'],
    ['factures@somenergia.coop', 'som-energia'],
    ['LOWI.ES', 'lowi'],
    ['clients.lowi.es', 'lowi'],
    ['vodafone.es', 'lowi'],
    ['www.siteground.es', 'siteground'],
    ['dondominio.com.', 'dondominio'],
    ['http://adobe.com:443/factura', 'adobe'],
    ['fal.ai', 'fal-ai'],
    ['amazon.es', 'amazon'],
    ['aws.amazon.com', 'amazon'],
    ['ovh.es', 'ovhcloud']
  ])('«%s» → %s', (domini, clau) => {
    expect(clauDe(proveidorPerDomini(domini))).toBe(clau);
  });

  test.each(['notgoogle.com', 'google.com.example.org', 'example.org', 'exemple@example.com', '', '   ', null, undefined])('«%s» → null', (domini) => {
    expect(proveidorPerDomini(domini)).toBeNull();
  });
});

describe('proveidorPerNif', () => {
  test.each([
    ['F55091367', 'som-energia'],
    ['ESF55091367', 'som-energia'],
    ['f-55091367', 'som-energia'],
    ['IE3668997OH', 'google-cloud'],
    ['ie 3668997 oh', 'google-cloud'],
    ['A80907397', 'lowi'],
    ['B87194171', 'siteground'],
    ['B57333601', 'dondominio'],
    ['IE6364992H', 'adobe']
  ])('«%s» → %s', (nif, clau) => {
    expect(clauDe(proveidorPerNif(nif))).toBe(clau);
  });

  test.each(['A12345674', '', null, undefined])('«%s» → null', (nif) => {
    expect(proveidorPerNif(nif)).toBeNull();
  });
});

describe('proveidorPerNomFitxer', () => {
  test.each([
    [`${xifres(10)}.pdf`, 'google-cloud'],
    [`${xifres(10)}.csv`, 'google-cloud'],
    [`gestoria/2026/${xifres(10)}.pdf`, 'google-cloud'],
    [`gestoria\\2026\\${xifres(10)}.pdf`, 'google-cloud'],
    ['Google_factura.pdf', 'google-cloud'],
    [`FE${xifres(10)}.pdf`, 'som-energia'],
    [`factura_FE${xifres(10)}.PDF`, 'som-energia'],
    ['fal-invoice-ABC-0001.pdf', 'fal-ai'],
    ['FAL-RECEIPT-1.pdf', 'fal-ai'],
    ['2026-04-sollutia.pdf', 'sollutia'],
    ['siteground-factura.pdf', 'siteground'],
    ['Factura-DonDominio-2026.pdf', 'dondominio'],
    ['lowi_abril.pdf', 'lowi'],
    ['factura-digital-ocean.pdf', 'digitalocean']
  ])('«%s» → %s', (nom, clau) => {
    expect(clauDe(proveidorPerNomFitxer(nom))).toBe(clau);
  });

  test.each([`${xifres(9)}.pdf`, `${xifres(10)}.txt`, `x${xifres(10)}.pdf`, 'factura.pdf', 'sollutia.pdf', 'carpeta/', '', null])('«%s» → null', (nom) => {
    expect(proveidorPerNomFitxer(nom)).toBeNull();
  });
});
