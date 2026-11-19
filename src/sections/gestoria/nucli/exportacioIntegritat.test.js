// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { expect, test } from 'vitest';
import { jsonCanonic, utf8 } from '../../tractors/nucli/canonic.js';
import { parseCsv } from './csv.js';
import { afegixRegistreIntegritat } from './registreIntegritat.js';
import { generaExportacioIntegritat, periodeIntegritat, validaExportacioIntegritat } from './exportacioIntegritat.js';

const subtle = webcrypto.subtle;
const text = (v) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(v);
const sha = (v) => createHash('sha256').update(v).digest('hex');
const periode = { any: 2026, trimestre: 3 };
const reescriu = (f, dades) => ({ ...f, dades: typeof dades === 'string' ? utf8(dades) : dades });
async function llibre() {
  let r = [];
  for (const [i, data] of ['2025-12-31', '2026-01-01', '2026-07-01', '2026-09-30', '2026-10-01'].entries()) {
    r = await afegixRegistreIntegritat(r, { id: i === 2 ? '=SUM(1;2)' : `document-${i}`, tipus: i % 2 ? 'tiquet' : 'assentament', data, instant: null,
      dades: { text: 'Accents ç é; cometes " i\nsalt de línia', import: -101, camps: { retencio: null } } }, { hashEsperat: r.at(-1)?.hash_actual ?? null, subtle });
  }
  return r;
}
const annex = () => ({ nom: 'full-original.csv', tipus: 'text/csv', dades: utf8('document;import\r\nExemple;121,00\r\n') });

test('CSV trimestral i anual, JSON complet i manifest de tots els bytes amb SHA independent', async () => {
  const registres = await llibre();
  const paquet = await generaExportacioIntegritat({ registres, periode, adjunts: [annex()], subtle });
  const json = JSON.parse(text(paquet.json.dades));
  expect(json.abast).toBe('llibre_complet_amb_seleccio_periode');
  expect(json.registres).toEqual(registres);
  expect(json.seleccio).toEqual([3, 4]);
  expect(JSON.parse(text(paquet.manifest.dades))).toMatchObject({ registres: 5, seleccionats: 2, ultima: { ordre: 5, hash_actual: registres[4].hash_actual } });
  const files = [paquet.csv, paquet.json, ...paquet.adjunts];
  for (const f of JSON.parse(text(paquet.manifest.dades)).fitxers) {
    const original = files.find((v) => v.nom === f.nom);
    expect(f).toEqual({ nom: original.nom, tipus: original.tipus, bytes: original.dades.length, sha256: sha(original.dades) });
  }
  expect(paquet.empremtaManifest).toBe(sha(paquet.manifest.dades));
  expect(await validaExportacioIntegritat(paquet, { periode, empremtaManifest: paquet.empremtaManifest, subtle })).toEqual({ valida: true, codi: null });
  const anual = await generaExportacioIntegritat({ registres, periode: { any: 2026 }, subtle });
  expect(JSON.parse(text(anual.json.dades)).seleccio).toEqual([2, 3, 4, 5]);
  expect(await validaExportacioIntegritat(anual, { periode: { any: 2026 }, subtle })).toEqual({ valida: true, codi: null });
});

test('determinisme, noms sense dades personals i bytes privats a cada lectura', async () => {
  const registres = await llibre();
  const a = annex();
  const primer = generaExportacioIntegritat({ registres, periode, adjunts: [a], subtle });
  a.dades.fill(0);
  const r = await primer;
  const segon = await generaExportacioIntegritat({ registres, periode, adjunts: [annex()], subtle });
  expect(r.empremtaManifest).toBe(segon.empremtaManifest);
  expect(r.json.nom).toBe('gestoria-integritat-2026-3t.json');
  for (const f of [r.csv, r.json, r.manifest, ...r.adjunts]) {
    const abans = f.dades; f.dades.fill(0);
    expect(f.dades).toEqual(abans);
  }
});

test('CSV interoperable, accents, JSON complet i fórmules neutralitzades', async () => {
  const r = await generaExportacioIntegritat({ registres: await llibre(), periode, subtle });
  expect([...r.csv.dades.slice(0, 3)]).toEqual([239, 187, 191]);
  const files = parseCsv(text(r.csv.dades), { delimitador: ';' });
  expect(files).toHaveLength(3);
  expect(files[1][1]).toBe("'=SUM(1;2)");
  expect(JSON.parse(files[1][5])).toEqual({ text: 'Accents ç é; cometes " i\nsalt de línia', import: -101, camps: { retencio: null } });
  expect(text(r.csv.dades)).toContain('\r\n');
});

test('mutació JSON/CSV/adjunt/manifest, fitxer absent o extra fallen; l’original continua verd', async () => {
  const paquet = await generaExportacioIntegritat({ registres: await llibre(), periode, adjunts: [annex()], subtle });
  const json = JSON.parse(text(paquet.json.dades)); json.registres[2].dades.text = 'Canvi retroactiu';
  const mutants = [
    { ...paquet, json: reescriu(paquet.json, jsonCanonic(json)) },
    { ...paquet, csv: reescriu(paquet.csv, text(paquet.csv.dades).replace('Accents', 'Canviat')) },
    { ...paquet, adjunts: [reescriu(paquet.adjunts[0], 'Canviat')] },
    { ...paquet, manifest: reescriu(paquet.manifest, '{}') },
    { ...paquet, csv: null }, { ...paquet, adjunts: [] },
    { ...paquet, adjunts: [...paquet.adjunts, { nom: 'extra.txt', tipus: 'text/plain', dades: utf8('extra') }] }
  ];
  for (const mutant of mutants) expect((await validaExportacioIntegritat(mutant, { subtle })).valida).toBe(false);
  expect((await validaExportacioIntegritat(paquet, { subtle })).valida).toBe(true);
});

test('CSV fals amb suma del manifest refeta continua sent incoherent amb el JSON', async () => {
  const paquet = await generaExportacioIntegritat({ registres: await llibre(), periode, subtle });
  const csv = reescriu(paquet.csv, text(paquet.csv.dades).replace('Accents', 'Altre text'));
  const manifest = JSON.parse(text(paquet.manifest.dades));
  const entrada = manifest.fitxers.find((f) => f.nom === csv.nom);
  entrada.sha256 = sha(csv.dades); entrada.bytes = csv.dades.length;
  expect((await validaExportacioIntegritat({ ...paquet, csv, manifest: reescriu(paquet.manifest, jsonCanonic(manifest)) }, { subtle })).valida).toBe(false);
});

test('període esperat i àncora externa descobrixen substitució coherent i truncament', async () => {
  const registres = await llibre();
  const bo = await generaExportacioIntegritat({ registres, periode, subtle });
  const truncat = await generaExportacioIntegritat({ registres: registres.slice(0, 3), periode, subtle });
  expect((await validaExportacioIntegritat(truncat, { subtle })).valida).toBe(true);
  expect((await validaExportacioIntegritat(truncat, { empremtaManifest: bo.empremtaManifest, subtle })).valida).toBe(false);
  expect((await validaExportacioIntegritat(truncat, { ancora: { ordre: 5, hash_actual: registres[4].hash_actual }, subtle })).valida).toBe(false);
  expect((await validaExportacioIntegritat(bo, { periode: { any: 2026, trimestre: 4 }, subtle })).valida).toBe(false);
});

test('períodes i noms estrictes, JSON canònic i UTF-8 invàlid fallen tancats', async () => {
  for (const p of [null, [], { any: '2026' }, { any: 2026, trimestre: false }, { any: 2026, trimestre: 0 }, { any: 2026, trimestre: 5 }, { any: 999 }, { any: 2026, trimestre: 3, extra: true }]) expect(() => periodeIntegritat(p)).toThrow();
  expect(periodeIntegritat({ any: 2024, trimestre: 1 }).fi).toBe('2024-03-31');
  const r = await generaExportacioIntegritat({ registres: [], periode, subtle });
  expect((await validaExportacioIntegritat(r, { subtle })).valida).toBe(true);
  for (const dades of [utf8(JSON.stringify(JSON.parse(text(r.json.dades)), null, 2)), new Uint8Array([0xff, 0xfe])]) expect((await validaExportacioIntegritat({ ...r, json: reescriu(r.json, dades) }, { subtle })).valida).toBe(false);
  for (const nom of ['../secret.csv', 'a\\b', '', r.csv.nom]) await expect(generaExportacioIntegritat({ registres: [], periode, adjunts: [{ ...annex(), nom }], subtle })).rejects.toThrow();
  await expect(generaExportacioIntegritat({ registres: [], periode, adjunts: new Array(14).fill(annex()), subtle })).rejects.toMatchObject({ codi: 'ADJUNTS_INVALIDS' });
});
