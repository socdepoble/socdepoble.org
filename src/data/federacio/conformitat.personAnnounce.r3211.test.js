import { expect, test } from 'vitest';
import { validaActivityPub } from './conformitat.js';
import { construeixActor, PUBLIC } from '../activitypub.js';

const origen = 'https://socdepoble.example';
const actor = construeixActor({ slug: 'la-torre', nom: 'La Torre' }, { origen });
const options = { origen, actorIds: [actor.id] };
const person = () => ({ ...actor, type: 'Person', name: 'Persona pública consentida' });
const announce = () => ({ '@context': 'https://www.w3.org/ns/activitystreams', type: 'Announce',
  id: `${origen}/ap/activitats/la-torre/announce-nota.json`, actor: actor.id,
  object: `${origen}/ap/objectes/la-torre/nota.json`, published: '2026-11-18T12:00:00Z', to: [PUBLIC] });

test('the explicit public Person profile retains the same closed identity and endpoint contract', () => {
  expect(validaActivityPub(person(), options)).toMatchObject({ valid: true, type: 'Person' });
  expect(() => validaActivityPub({ ...person(), email: 'private@example.invalid' }, options)).toThrow();
  expect(() => validaActivityPub({ ...person(), inbox: `${origen}/ap/inbox/someone-else` }, options)).toThrow();
});
test('a local public Announce binds its activity namespace to the known actor and object', () => {
  expect(validaActivityPub(announce(), options)).toMatchObject({ valid: true, type: 'Announce' });
  const collection = { '@context': 'https://www.w3.org/ns/activitystreams', id: actor.outbox, type: 'OrderedCollection', totalItems: 1, orderedItems: [announce()] };
  expect(validaActivityPub(collection, options).valid).toBe(true);
});
test('Announce refuses remote/private/unknown objects, hidden recipients and rewritten ownership', () => {
  for (const patch of [
    { object: 'https://other.example/ap/objectes/la-torre/nota.json' },
    { object: `${origen}/api/private/note.json` },
    { object: `${origen}/ap/objectes/unknown/nota.json` },
    { object: { id: announce().object, content: 'unexpected embedded object' } },
    { to: [] }, { bcc: [actor.id] }, { actor: `${origen}/ap/actors/unknown.json` },
    { id: `${origen}/ap/activitats/unknown/announce-nota.json` },
    { id: `${origen}/ap/activitats/la-torre/announce-nota.json#changed` },
    { published: 'not-an-instant' }, { published: undefined },
  ]) expect(() => validaActivityPub({ ...announce(), ...patch }, options)).toThrow();
});
