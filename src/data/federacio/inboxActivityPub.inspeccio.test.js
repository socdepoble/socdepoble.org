// @vitest-environment node
/* Inspecció de Codex de l'1-11-2026 (Kit Onada 2, correccions-inspeccio-claude.patch) · Reproductors
   d'O2-F01 i O2-F03, adaptats a la inbox integrada: un `expires` que no forma part de la cadena
   signada no allarga la finestra, i una fi declarada (endTime) vençuda no es reviscola. */
import { test, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  clauDeDocumentActor, signaPeticioHttpActivityPub, verificaSignaturaHttpActivityPub,
  processaActivitatInbox, creaMagatzemInboxEnMemoria
} from './inboxActivityPub.js';

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 10, 1, 12);
const ACTOR = 'https://remot.example/users/anna';
const KEY_ID = `${ACTOR}#key`;

test('O2-F01 · un expires afegit sense signar no amplia una signatura RSA vençuda', async () => {
  const claus = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const pem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(await subtle.exportKey('spki', claus.publicKey)).toString('base64')}\n-----END PUBLIC KEY-----`;
  const document = { id: ACTOR, publicKey: { id: KEY_ID, owner: ACTOR, publicKeyPem: pem } };
  const cos = '{}';
  const capcaleres = await signaPeticioHttpActivityPub({ url: 'https://socdepoble.org/ap/inbox/sella', cos, keyId: KEY_ID, clauPrivada: claus.privateKey, ara: ARA - 2 * 3_600_000, subtle });
  const verifica = () => verificaSignaturaHttpActivityPub({
    metode: 'POST', cami: '/ap/inbox/sella', cos, capcaleres,
    obtenClauPublica: async () => ({ clau: clauDeDocumentActor(document, KEY_ID), documentActor: document }),
    hostEsperat: 'socdepoble.org', ara: ARA, subtle
  });
  expect((await verifica()).valida).toBe(false);
  capcaleres.signature += `,expires=${ARA / 1000 + 3600}`;
  expect((await verifica()).valida).toBe(false);
});

test.each([undefined, new Date(ARA - 1000).toISOString()])('O2-F03 · un endTime vençut es respecta (published=%s)', async (published) => {
  const objecte = {
    id: `${ACTOR}/notes/1`, type: 'Note', attributedTo: ACTOR, to: ['https://www.w3.org/ns/activitystreams#Public'],
    tag: [{ type: 'Hashtag', name: '#Alerta' }], content: 'Avís', endTime: new Date(ARA - 1000).toISOString(),
    ...(published ? { published } : {})
  };
  const magatzem = creaMagatzemInboxEnMemoria();
  const r = await processaActivitatInbox(
    { id: `${ACTOR}/activities/1`, actor: ACTOR, type: 'Create', object: objecte },
    { slug: 'sella', origen: 'https://socdepoble.org', actorsLocals: ['sella'], signant: { actor: ACTOR }, magatzem, nodesDeConfianca: ['https://remot.example'], ara: ARA, subtle }
  );
  expect(r.motiu).toBe('alert_expired');
  expect(await magatzem.llistaAlertesVigents(ARA)).toEqual([]);
});
