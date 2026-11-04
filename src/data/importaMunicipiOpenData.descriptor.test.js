// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { exportaMunicipiOpenData, verificaPaquetOpenData } from './exportaMunicipiOpenData.js';
import { importaMunicipiOpenData, llegeixPaquetOpenData } from './importaMunicipiOpenData.js';
import { creaZip, llegeixZip } from '../utils/fulls/zip.js';

const subtle = webcrypto.subtle;
const enc = new TextEncoder(), dec = new TextDecoder();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const genera = () => exportaMunicipiOpenData({
  municipi: { slug: 'poble-de-prova', nom: 'Poble de prova' }, ara: '2026-11-03T10:00:00Z',
  origen: 'https://node.example.invalid', noticies: [], agenda: [], entitats: [], memoria: [], memoriaOral: [],
}, { subtle });

/* L'atacant refà tots els hashes del descriptor i de BagIt. No és una mera
 * corrupció de bytes: el restaurador ha de comprovar el significat legal i
 * el perfil declarat fins i tot quan SHA-256 és coherent. */
function reescriuDescriptor(zip, canvia) {
  const entrades = llegeixZip(zip);
  const arrel = entrades[0].nom.split('/')[0];
  const fitxers = new Map(entrades.map(({ nom, dades }) => [nom.slice(arrel.length + 1), dec.decode(dades)]));
  const dp = JSON.parse(fitxers.get('data/datapackage.json'));
  // JSON cru conserva també els camps nuls hostils: el serialitzador del
  // productor els eliminaria i la prova no entregaria l'atac al verificador.
  canvia(dp); fitxers.set('data/datapackage.json', `${JSON.stringify(dp, null, 2)}\n`);
  const carrega = [...fitxers.keys()].filter(p => p.startsWith('data/')).sort();
  fitxers.set('manifest-sha256.txt', carrega.map(p => `${sha(enc.encode(fitxers.get(p)))}  ${p}\n`).join(''));
  const octets = carrega.reduce((n, p) => n + enc.encode(fitxers.get(p)).length, 0);
  fitxers.set('bag-info.txt', fitxers.get('bag-info.txt').replace(/Payload-Oxum: .*\n/, `Payload-Oxum: ${octets}.${carrega.length}\n`));
  fitxers.set('tagmanifest-sha256.txt', ['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt'].map(p => `${sha(enc.encode(fitxers.get(p)))}  ${p}\n`).join(''));
  return creaZip([...fitxers].sort(([a], [b]) => a < b ? -1 : 1).map(([nom, text]) => ({ nom: `${arrel}/${nom}`, dades: enc.encode(text) })));
}

test('el productor i el restaurador compartixen un perfil DataPackagev2 coherent', async () => {
  const bo = await genera();
  expect((await llegeixPaquetOpenData(bo.zip, { subtle, sha256Esperat: bo.sha256 })).slug).toBe('poble-de-prova');
});

test.each([
  ['perfil fals', dp => { dp.$schema = 'https://attacker.invalid/datapackage.json'; }],
  ['perfil absent', dp => { delete dp.$schema; }],
  ['llicència col·lectiva inventada', dp => { dp.licenses = [{ name: 'CC0-1.0' }]; }],
  ['llicència absent', dp => { delete dp.licenses; }],
  ['camp de llicència nul no admés', dp => { dp.licenses[0].name = null; }],
  ['llicència remota substituïda', dp => { dp.licenses = [{ path: 'https://attacker.invalid/license', title: 'Lliure' }]; }],
  ['drets sobre un recurs inventats', dp => { dp.resources[0].licenses = [{ name: 'CC0-1.0' }]; }],
  ['tipus de recurs fals', dp => { dp.resources[0].mediatype = 'application/x-executable'; }],
  ['JSON-LD disfressat de JSON', dp => { const recurs = dp.resources.find(r => r.path === 'directori.jsonld'); recurs.format = 'json'; recurs.mediatype = 'application/json'; }],
  ['llicències disfressades de calendari', dp => { const recurs = dp.resources.find(r => r.path === 'llicencies.md'); recurs.format = 'ics'; recurs.mediatype = 'text/calendar'; }],
])('rebutja %s encara amb tots els hashes refets i cap escriptura', async (_nom, canvia) => {
  const bo = await genera(); const fals = reescriuDescriptor(bo.zip, canvia);
  const restauraDadesObertes = vi.fn(async () => ({ creats: 0, actualitzats: 0, iguals: 0 }));
  await expect(verificaPaquetOpenData(fals, { subtle })).rejects.toThrow(/Data Package|datapackage|llic|recurs|perfil/i);
  await expect(importaMunicipiOpenData(fals, { teCapacitat: () => true, restauraDadesObertes }, { subtle, sha256Esperat: sha(fals) })).rejects.toThrow();
  expect(restauraDadesObertes).not.toHaveBeenCalled();
});
