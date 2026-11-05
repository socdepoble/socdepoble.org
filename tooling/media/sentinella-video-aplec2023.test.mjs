import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificaVideoAplec, OEMBED_URL, VIDEO_ID } from './sentinella-video-aplec2023.mjs';

const metadata = { type: 'video', provider_name: 'YouTube', title: '2n Aplec pel Territori - Benillup: NTC À Punt', html: `<iframe src="https://www.youtube.com/embed/${VIDEO_ID}?feature=oembed"></iframe>` };
const response = (status, data = metadata) => ({ status, text: async () => JSON.stringify(data) });

test('consulta només oEmbed del vídeo fixat i no afirma reproducció', async () => {
  const result = await verificaVideoAplec({ fetchImpl: async (url, options) => {
    assert.equal(url, OEMBED_URL);
    assert.equal(options.redirect, 'error');
    assert.equal(options.signal.aborted, false);
    return response(200);
  } });
  assert.equal(result.status, 'disponible');
  assert.equal(result.metadataAvailable, true);
  assert.equal(result.playbackVerified, false);
});

for (const status of [401, 403, 404, 410]) {
  test(`avisa amb eixida lògica caigut per HTTP ${status}`, async () => {
    assert.equal((await verificaVideoAplec({ fetchImpl: async () => response(status) })).status, 'caigut');
  });
}
for (const status of [429, 500, 503]) {
  test(`no confon un error transitori HTTP ${status} amb vídeo esborrat`, async () => {
    assert.equal((await verificaVideoAplec({ fetchImpl: async () => response(status) })).status, 'indeterminat');
  });
}
for (const invalid of [null, {}, { ...metadata, provider_name: 'Other' }, { ...metadata, html: '<iframe src="https://attacker.test/embed/TlZWYbnGuCE"></iframe>' }, { ...metadata, html: '<iframe src="https://www.youtube.com/embed/AAAAAAAAAAA"></iframe>' }]) {
  test('una resposta invàlida no acredita disponibilitat', async () => {
    assert.equal((await verificaVideoAplec({ fetchImpl: async () => response(200, invalid) })).status, 'indeterminat');
  });
}
test('el temps límit cancel·la la petició i avisa', async () => {
  const result = await verificaVideoAplec({ timeoutMs: 5, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')))) });
  assert.equal(result.status, 'indeterminat');
});
