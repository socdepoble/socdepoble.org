import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { generaOpenData } from './genera-opendata.mjs';
import { llegeixPaquetOpenData } from '../../src/data/importaMunicipiOpenData.js';

const captura = JSON.parse(await fs.readFile(new URL('../../public/opendata/snapshot-public.json', import.meta.url), 'utf8'));
test('snapshot públic versionat → ZIP reproduïble, SHA-256 i restaurador canònic reals, cap xarxa', async () => {
  let xarxa = 0;
  const opcions = { snapshot: captura, escriu: false, fetchImpl: () => { xarxa += 1; throw new Error('xarxa prohibida'); } };
  const a = await generaOpenData(opcions), b = await generaOpenData(opcions);
  assert.equal(a.paquet.sha256, b.paquet.sha256);
  assert.equal(a.paquet.sha256, createHash('sha256').update(a.paquet.zip).digest('hex'));
  const verificat = await llegeixPaquetOpenData(a.paquet.zip, { sha256Esperat: a.paquet.sha256, subtle: webcrypto.subtle });
  assert.deepEqual(verificat.comptes, { noticies: 1, agenda: 1, directori: 3, memoria: 1, memoriaOral: 0 });
  assert.equal(verificat.lot.memoriaOral.length, 0);
  assert.match(verificat.lot.memoria[0].text, /rentonar\.blogspot\.com/);
  assert.equal(xarxa, 0);
});
test('una entrada sense captura ni instant explícit falla abans de llegir la configuració', async () => {
  await assert.rejects(generaOpenData(), /--ara/);
  await assert.rejects(generaOpenData({ snapshot: { format: 'altre' }, escriu: false }), /invàlid/);
  await assert.rejects(generaOpenData({ snapshot: captura, curacioNoticia: {} }), /Tria un snapshot/);
});

test('el replay rebutja sentinelles de privadesa en totes les branques abans de publicar', async () => {
  for (const contamina of [
    s => { s.entrada.activityStreams.privateNotes = ['PRIVATE_SENTINEL']; },
    s => { s.entrada.activityStreams.orderedItems[0].object.privateNotes = ['PRIVATE_SENTINEL']; },
    s => { s.entrada.activityStreams.orderedItems[0].object.summaryMap.private = 'PRIVATE_SENTINEL'; },
    s => { s.entrada.activityStreams.orderedItems[0].to = ['https://privat.example']; },
    s => { s.entrada.noticies[0].visibility = 'private'; },
    s => { s.entrada.entitats[0].visibility = 'private'; },
    s => { s.entrada.actorsPublicats = ['PRIVATE_SENTINEL']; },
    s => { s.entrada.noticies[0].poble_id = 'xixona'; },
  ]) {
    const s = structuredClone(captura); contamina(s);
    // arrel inexistent: la validació ha de fallar abans d'intentar obrir cap destí.
    await assert.rejects(generaOpenData({ snapshot: s, arrel: '/no-existix-desti-public', escriu: true }), /Snapshot públic invàlid/);
  }
});

test('notícia, memòria Markdown i ZIP expliquen els dos accessos i el pilot com a observació històrica', async () => {
  const { paquet } = await generaOpenData({ snapshot: captura, escriu: false });
  const { llegeixZip } = await import('../../src/utils/fulls/zip.js');
  const fitxers = llegeixZip(paquet.zip);
  for (const nom of ['noticies.jsonld', 'memoria.md']) {
    const text = new TextDecoder().decode(fitxers.find(f => f.nom.endsWith(`/data/${nom}`)).dades);
    assert.match(text, /dos punts d’accés públic/iu);
    assert.match(text, /pilot físic en preparació/iu);
    assert.doesNotMatch(text, /tercer node|tres nodes actius|connectat a socdepoble\.cat|hem posat en marxa/iu);
  }
  const noticia = captura.entrada.noticies[0];
  assert.match(noticia.body, /17:23 UTC/); assert.match(noticia.body, /HTTP 302/); assert.match(noticia.body, /ENOTFOUND/);
  assert.match(noticia.body, /no és un monitor de disponibilitat actual/);
  assert.equal(captura.provinencia[0].curacio.tipus, 'resum-editorial-contrastat');
});

test('reintroduir el relat remot antic o alterar la procedència falla abans d’obrir el destí', async () => {
  for (const canvia of [
    s => { s.entrada.noticies[0].lead = 'És el tercer node de la nostra xarxa.'; },
    s => { s.provinencia[0].curacio.observacions[0].owner_user_id = 'PRIVATE_SENTINEL'; },
    s => { s.provinencia[0].curacio.textCuratSha256 = '0'.repeat(64); },
  ]) {
    const s = structuredClone(captura); canvia(s);
    await assert.rejects(generaOpenData({ snapshot: s, arrel: '/no-existix-desti-public', escriu: true }), /Snapshot públic invàlid/);
  }
});
