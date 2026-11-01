/* K1 suplementari: finestres de memòria, corrupció de TOTS els membres i
   fallada del proveïdor criptogràfic. Cap xarxa ni dada real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { exportaMunicipiOpenData, verificaPaquetOpenData } from '../src/data/exportaMunicipiOpenData.js';
import { creaZip, llegeixZip } from '../src/utils/fulls/zip.js';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const entrada = () => ({
  municipi: { slug: 'sella', nom: 'Sella' }, ara: '2026-11-01T00:00:00Z',
  noticies: [{ id: 'ban-fixture', title: 'Memòria · café i muntanya 🌱', poble_id: 'sella',
    author_entity_id: 'org-fixture', body: 'Relat públic de prova.', copyright: 'CC BY 4.0' }]
});
const exporta = () => exportaMunicipiOpenData(entrada(), { subtle: webcrypto.subtle });
const verifica = zip => verificaPaquetOpenData(zip, { subtle: webcrypto.subtle });

test('K1 export: una vista amb byteOffset i sentinelles fora de la vista conserva la bossa', async () => {
  const paquet = await exporta();
  const backing = new Uint8Array(paquet.zip.length + 37).fill(0xe7);
  backing.set(paquet.zip, 19);
  const window = backing.subarray(19, 19 + paquet.zip.length);
  const before = sha(backing);
  assert.equal((await verifica(window)).slug, 'sella');
  assert.equal(sha(backing), before, 'verificar no ha de mutar cap byte del buffer compartit');
  assert.notEqual(sha(window), sha(backing), 'la prova realment usa una finestra');
});

test('K1 export: cada membre de la bossa rebutja una corrupció amb CRC ZIP recalculat', async t => {
  const paquet = await exporta();
  const entries = llegeixZip(paquet.zip);
  for (const entry of entries) {
    await t.test(entry.nom, async () => {
      const mutated = entries.map(item => ({ nom: item.nom, dades: new Uint8Array(item.dades) }));
      const selected = mutated.find(item => item.nom === entry.nom);
      assert.ok(selected.dades.length > 0);
      selected.dades[Math.floor(selected.dades.length / 2)] ^= 1;
      await assert.rejects(verifica(creaZip(mutated)));
    });
  }
});

test('K1 export: els truncaments d’envolupant no es presenten com un paquet buit vàlid', async () => {
  const { zip } = await exporta();
  for (const end of [0, 1, 4, Math.floor(zip.length / 2), zip.length - 1, zip.length - 18]) {
    await assert.rejects(verifica(zip.slice(0, end)), `truncament a ${end}`);
  }
});

test('K1 export: una fallada de digest no produeix un ZIP amb hash de reserva', async () => {
  let calls = 0;
  const subtle = { digest: async () => { calls++; throw new Error('fixture-digest-no-disponible'); } };
  await assert.rejects(exportaMunicipiOpenData(entrada(), { subtle }), /fixture-digest-no-disponible/);
  assert.ok(calls > 0);
  assert.equal((await verifica((await exporta()).zip)).slug, 'sella', 'una crida fallida no contamina la següent');
});

test('K1 export: dues bosses legítimes diferents poden passar integritat; el hash no és una signatura', async () => {
  const first = await exporta();
  const secondInput = entrada();
  secondInput.noticies[0].body = 'Un altre relat públic coherent, creat per una altra execució.';
  const second = await exportaMunicipiOpenData(secondInput, { subtle: webcrypto.subtle });
  assert.notEqual(first.sha256, second.sha256);
  assert.equal((await verifica(first.zip)).slug, 'sella');
  assert.equal((await verifica(second.zip)).slug, 'sella');
  assert.equal(sha(second.zip), second.sha256);
});
