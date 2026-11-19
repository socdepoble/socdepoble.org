import { describe, expect, test } from 'vitest';
import { construeixActor, construeixOutbox, construeixWebFinger, urlsDeMunicipi } from '../activitypub.js';
import { validaActivityPub, validaWebFinger } from './conformitat.js';
import { verificaPerfilFederat } from '../../../tooling/gates/conformitat-federacio.mjs';

const origen = 'https://federacio.example';
const actors = [{ slug: 'la-torre', nom: 'La Torre', alies: ['latorre'], elements: [
  { id: 'article', tipus: 'Article', nom: 'Notícia pública', url: `${origen}/noticies/article`, publicat: '2026-11-18T12:00:00Z' },
  { id: 'nota', tipus: 'Note', text: 'Text públic', publicat: '2026-11-18T11:00:00Z' },
  { id: 'acte', tipus: 'Event', nom: 'Acte', inici: '2026-11-19T12:00:00Z' }
] }];
const urls = urlsDeMunicipi('la-torre', { origen });
const options = { origen, actorIds: [urls.actor] };
const wfOptions = { resource: urls.acct, origen, municipis: actors };
const copy = (value) => JSON.parse(JSON.stringify(value));

describe('R32.11 · RFC7033 public same-origin profile', () => {
  test('production constructors, alias and canonical reverse lookup all agree', () => {
    const report = verificaPerfilFederat({ origen, actors });
    expect(report.valid).toBe(true); expect(report.documents).toHaveLength(7);
    expect(report.webfinger).toHaveLength(4); expect(report.remoteInteropVerified).toBe(false);
  });
  test.each(['acct:la-torre@other.example', 'acct:other@federacio.example', 'acct:', 'not-a-uri', 'acct:la-torre%ZZ@federacio.example'])('reject unavailable or malformed resource %s', (resource) => {
    expect(() => validaWebFinger(construeixWebFinger(urls.acct, wfOptions), { ...wfOptions, resource })).toThrow();
  });
  test.each([
    (d) => { d.subject = 'acct:admin@federacio.example'; },
    (d) => { d.aliases[0] = 'https://other.example/actor'; },
    (d) => { d.aliases.push(d.aliases[0]); },
    (d) => { d.links[0].href = 'https://other.example/actor'; },
    (d) => { d.links[0].type = 'text/html'; },
    (d) => { d.links.push(d.links[0]); },
    (d) => { d.links = []; },
    (d) => { d.links[0].properties = { authorization: 'synthetic-private-value' }; }
  ])('reject identity/link substitution', (change) => {
    const d = copy(construeixWebFinger(urls.acct, wfOptions)); change(d);
    expect(() => validaWebFinger(d, wfOptions)).toThrow();
  });
});

describe('R32.11 · ActivityPub public JSON-LD profile', () => {
  test.each([
    (d) => { d['@context'] = ['https://attacker.example/context']; },
    (d) => { d['@context'] = { '@vocab': 'https://attacker.example/' }; },
    (d) => { d.orderedItems[0].actor = 'https://other.example/actor'; },
    (d) => { d.orderedItems[0].object.to = ['https://other.example/private-user']; },
    (d) => { d.orderedItems[0].object.email = 'private@example.test'; },
    (d) => { d.orderedItems[0].object.bcc = []; },
    (d) => { d.orderedItems[0].object.url = `${origen}/../secret`; },
    (d) => { d.totalItems = 300; },
    (d) => { d.orderedItems[0].object.published = '2026-02-30T00:00:00Z'; },
    (d) => { d.orderedItems[0].object.content = { text: 'hostile JSONB' }; },
    (d) => { d.orderedItems[0].object.contentMap = { ca: { text: 'nested data' } }; },
    (d) => { d.orderedItems[0].object.location = { type: 'Place', name: 'Plaça', coordinates: [38, 0] }; }
  ])('reject context, privacy and canonical identity bypasses', (change) => {
    const d = copy(construeixOutbox('la-torre', actors[0].elements, { origen })); change(d);
    expect(() => validaActivityPub(d, options)).toThrow();
  });
  test('does not execute getters or recurse cyclic data', () => {
    const d = construeixActor(actors[0], { origen }); let calls = 0;
    Object.defineProperty(d, 'content', { enumerable: true, get() { calls++; throw Error('must not execute'); } });
    expect(() => validaActivityPub(d, options)).toThrow(); expect(calls).toBe(0);
    const cyclic = {}; cyclic.self = cyclic;
    expect(() => validaActivityPub(cyclic, options)).toThrow();
  });
  test('Tombstone retains identity and former type while withholding old content', () => {
    const tombstone = { '@context': 'https://www.w3.org/ns/activitystreams', id: `${origen}/ap/objectes/la-torre/article.json`, type: 'Tombstone', formerType: 'Article', deleted: '2026-11-18T12:00:00Z' };
    expect(validaActivityPub(tombstone, options).valid).toBe(true);
    expect(() => validaActivityPub({ ...tombstone, content: 'retired content' }, options)).toThrow();
    expect(() => validaActivityPub({ ...tombstone, contentMap: { ca: 'retired content' } }, options)).toThrow();
  });
  test('independent review: actor names, icons, sparse arrays and deletion remain bound to the actor', () => {
    const actor = construeixActor(actors[0], { origen });
    for (const changed of [
      { ...actor, preferredUsername: 'admin' },
      { ...actor, icon: { type: 'Image', url: 'javascript:synthetic' } },
      { ...actor, icon: { type: 'Image', url: `${origen}/icon.png`, credentials: 'synthetic' } },
      { ...actor, to: new Array(30_000) },
      { ...actor, outbox: `${origen}/ap/outbox/another-actor.json` }
    ]) expect(() => validaActivityPub(changed, options)).toThrow();
    expect(() => validaActivityPub({ ...actor, publicKey: { id: `${actor.id}#main-key`, owner: actor.id,
      publicKeyPem: '-----BEGIN PUBLIC KEY-----\nnot base64 at all !\n-----END PUBLIC KEY-----' } }, options)).toThrow();
    const other = urlsDeMunicipi('other-actor', { origen });
    const id = `${other.objectes}article.json`;
    expect(() => validaActivityPub({ '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${id}#delete`, type: 'Delete', actor: urls.actor,
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      object: { id, type: 'Tombstone', formerType: 'Article', deleted: '2026-11-18T12:00:00Z' }
    }, { origen, actorIds: [urls.actor, other.actor] })).toThrow();
  });
  test('independent review: collections have their own namespace and cannot mix actor outboxes', () => {
    const outbox = construeixOutbox('la-torre', actors[0].elements, { origen });
    expect(() => validaActivityPub({ ...outbox, id: urls.actor }, options)).toThrow();
    expect(() => validaActivityPub({ ...outbox, id: urls.followers }, options)).toThrow();
    const other = urlsDeMunicipi('other-actor', { origen });
    const otherBox = construeixOutbox('other-actor', actors[0].elements, { origen });
    expect(() => validaActivityPub({ ...outbox, orderedItems: otherBox.orderedItems }, { origen, actorIds: [urls.actor, other.actor] })).toThrow();
  });
});
