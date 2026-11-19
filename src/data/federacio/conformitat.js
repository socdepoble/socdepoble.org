/** R32.11: executable conformance of our public, same-origin federation profile.
 * This is not a general JSON-LD processor or proof of remote interoperability.
 * No context is fetched; callers supply the trusted origin and actor catalogue.
 * Sources: RFC7033 §4.4; ActivityPub §3–5, B.11; AS2 Vocabulary Tombstone.
 */
import { CONTEXT_AS, CONTEXT_SEGURETAT, PUBLIC, TIPUS_AP, construeixWebFinger,
  normalitzaOrigen, dataIso, comparaInstants } from '../activitypub.js';

const forbidden = new Set(['__proto__', 'prototype', 'constructor', 'email', 'phone',
  'telephone', 'contact_email', 'user_id', 'owner_user_id', 'privateKey', 'privateKeyPem',
  'access_token', 'refresh_token', 'bto', 'bcc', 'latitude', 'longitude', 'gps']);
const actors = new Set(['Person', 'Organization', 'Service', 'Application', 'Group']);
const objects = new Set(['Article', 'Note', 'Event']);
const commonFields = ['@context', 'id', 'type'];
const fail = (code) => { throw Object.assign(new TypeError(code), { code }); };
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && [Object.prototype, null].includes(Object.getPrototypeOf(v));

// Bound the full tree, reject accessors and cycles before reading properties.
// The limits describe this local publication profile, not the RFC's vocabulary.
function tree(root) {
  const stack = [[root, 0]], seen = new Set(); let nodes = 0, chars = 0;
  while (stack.length) {
    const [value, depth] = stack.pop();
    if (++nodes > 20_000 || depth > 16) fail('FED_TREE_LIMIT');
    if (typeof value === 'string') { chars += value.length; if (chars > 1_048_576) fail('FED_TEXT_LIMIT'); continue; }
    if (value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) continue;
    if (!plain(value) && !Array.isArray(value)) fail('FED_JSON_REQUIRED');
    if (Array.isArray(value) && (value.length > 20_000 || Reflect.ownKeys(value).length !== value.length + 1)) fail('FED_TREE_LIMIT');
    if (seen.has(value)) fail('FED_TREE_REFERENCE'); seen.add(value);
    for (const key of Reflect.ownKeys(value)) {
      if (Array.isArray(value) && key === 'length') continue;
      if (typeof key !== 'string' || forbidden.has(key)) fail('FED_PRIVATE_FIELD');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('FED_JSON_REQUIRED');
      stack.push([descriptor.value, depth + 1]);
    }
  }
}

function url(value, origin, { fragment = false } = {}) {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\s\u0000-\u001f\u007f]/u.test(value)) fail('FED_URL_INVALID');
  let parsed; try { parsed = new URL(value); } catch { fail('FED_URL_INVALID'); }
  if (parsed.origin !== origin || parsed.username || parsed.password || parsed.search
    || !fragment && parsed.hash || parsed.href !== value || /%|\\/.test(value)
    || value.split('/').some((part) => part === '.' || part === '..')) fail('FED_URL_INVALID');
  return value;
}

function context(value) {
  const list = typeof value === 'string' ? [value] : value;
  if (!Array.isArray(list) || list.length < 1 || list.length > 2 || list[0] !== CONTEXT_AS
    || list.length === 2 && list[1] !== CONTEXT_SEGURETAT) fail('FED_CONTEXT_INVALID');
}

/** Validate the complete, unfiltered JRD emitted by this project's producer.
 * Same-origin aliases/self and the exact known actor are project restrictions;
 * RFC7033 itself also permits other URI schemes and hosted discovery services.
 */
export function validaWebFinger(document, { resource, origen, municipis } = {}) {
  tree(document);
  const expected = construeixWebFinger(resource, { origen, municipis });
  if (!plain(document) || !expected) fail('WF_RESOURCE_UNAVAILABLE');
  if (Object.keys(document).some((key) => !['subject', 'aliases', 'links'].includes(key))) fail('WF_FIELDS_INVALID');
  if (document.subject !== expected.subject) fail('WF_SUBJECT_MISMATCH');
  if (!Array.isArray(document.aliases) || document.aliases.length !== expected.aliases.length
    || new Set(document.aliases).size !== document.aliases.length
    || expected.aliases.some((alias) => !document.aliases.includes(alias))) fail('WF_ALIASES_MISMATCH');
  if (!Array.isArray(document.links) || document.links.length !== expected.links.length) fail('WF_LINKS_INVALID');
  const self = document.links.filter((link) => plain(link) && link.rel === 'self');
  if (self.length !== 1 || self[0].type !== TIPUS_AP || self[0].href !== expected.links[0].href) fail('WF_SELF_INVALID');
  for (const link of expected.links) {
    if (!document.links.some((entry) => plain(entry) && entry.rel === link.rel
      && entry.type === link.type && entry.href === link.href)) fail('WF_LINKS_INVALID');
  }
  if (document.links.some((entry) => Object.keys(entry).some((key) => !['rel', 'type', 'href'].includes(key)))) fail('WF_FIELDS_INVALID');
  return Object.freeze({ valid: true, subject: expected.subject, actor: self[0].href });
}

/** Validate our closed public JSON-LD profile, including reviewed optional
 * Person/Announce DTOs. Producers do not automatically enable those types.
 * Unknown actor
 * identities, private recipients, remote context definitions and cross-origin
 * canonical objects fail closed. No incoming remote ActivityPub is authorized.
 */
export function validaActivityPub(document, { origen, actorIds = [] } = {}) {
  tree(document);
  const origin = normalitzaOrigen(origen);
  if (!Array.isArray(actorIds) || !actorIds.length || actorIds.length > 256) fail('FED_ACTOR_CATALOGUE_REQUIRED');
  const known = new Set(actorIds);
  if (known.size !== actorIds.length) fail('FED_ACTOR_CATALOGUE_REQUIRED');
  for (const id of known) {
    url(id, origin);
    if (!/^\/ap\/actors\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(new URL(id).pathname)) fail('FED_ACTOR_CATALOGUE_REQUIRED');
  }
  context(document?.['@context']);
  const inspect = (node, top = false) => {
    if (!plain(node)) fail('FED_OBJECT_REQUIRED');
    if (node['@context'] !== undefined) context(node['@context']);
    const type = node.type;
    const isActor = actors.has(type), isObject = objects.has(type);
    const specific = isActor ? ['name', 'summary', 'url', 'preferredUsername', 'inbox', 'outbox', 'followers', 'icon', 'publicKey']
      : isObject ? ['name', 'summary', 'content', 'summaryMap', 'contentMap', 'url', 'published', 'updated', 'to', 'cc', 'attributedTo', 'startTime', 'endTime', 'location']
        : ['Create', 'Delete', 'Announce'].includes(type) ? ['actor', 'object', 'published', 'to', 'cc']
          : type === 'Tombstone' ? ['formerType', 'deleted']
            : type === 'OrderedCollection' ? ['totalItems', 'orderedItems'] : [];
    const allowed = type === 'Tombstone' ? ['@context', 'id', 'type', 'formerType', 'deleted'] : [...commonFields, ...specific];
    if (Object.keys(node).some((key) => !allowed.includes(key))) fail('FED_FIELD_UNSUPPORTED');
    const fragment = type === 'Create' || type === 'Delete';
    url(node.id, origin, { fragment });
    if (node.url !== undefined) url(node.url, origin);
    for (const field of ['published', 'updated', 'deleted', 'startTime', 'endTime']) {
      if (node[field] !== undefined && !dataIso(node[field])) fail('FED_DATE_INVALID');
    }
    for (const field of ['name', 'summary', 'content', 'preferredUsername']) {
      if (node[field] !== undefined && typeof node[field] !== 'string') fail('FED_TEXT_REQUIRED');
    }
    for (const field of ['contentMap', 'summaryMap']) {
      const map = node[field];
      if (map !== undefined && (!plain(map) || Object.keys(map).length > 16
        || Object.entries(map).some(([key, text]) => !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(key) || typeof text !== 'string'))) fail('FED_TEXT_REQUIRED');
    }
    for (const field of ['to', 'cc']) {
      if (node[field] !== undefined && (!Array.isArray(node[field])
        || node[field].some((recipient) => recipient !== PUBLIC && ![...known].some((id) => recipient === id.replace('/actors/', '/followers/'))))) fail('FED_RECIPIENT_INVALID');
    }
    if (isActor) {
      if (!known.has(node.id) || typeof node.preferredUsername !== 'string' || !node.preferredUsername) fail('FED_ACTOR_UNKNOWN');
      if (node.preferredUsername !== new URL(node.id).pathname.split('/').at(-1).slice(0, -5)) fail('FED_ACTOR_USERNAME_MISMATCH');
      for (const field of ['inbox', 'outbox', 'followers']) {
        url(node[field], origin);
        const expected = node.id.replace('/actors/', `/${field}/`);
        if (node[field] !== (field === 'inbox' ? expected.slice(0, -5) : expected)) fail('FED_ACTOR_ENDPOINT_MISMATCH');
      }
      if (node.publicKey !== undefined) {
        if (!plain(node.publicKey) || node.publicKey.owner !== node.id
          || Object.keys(node.publicKey).some((key) => !['id', 'owner', 'publicKeyPem'].includes(key))
          || node.publicKey.id !== `${node.id}#main-key` || typeof node.publicKey.publicKeyPem !== 'string'
          || node.publicKey.publicKeyPem.length > 4096
          || !/^-----BEGIN PUBLIC KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC KEY-----\n?$/.test(node.publicKey.publicKeyPem)) fail('FED_PUBLIC_KEY_INVALID');
      }
      if (node.icon !== undefined) {
        if (!plain(node.icon) || node.icon.type !== 'Image'
          || Object.keys(node.icon).some((key) => !['type', 'mediaType', 'url'].includes(key))
          || node.icon.mediaType !== undefined && !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(node.icon.mediaType)) fail('FED_ICON_INVALID');
        url(node.icon.url, origin);
      }
    } else if (isObject) {
      if (!known.has(node.attributedTo) || !node.to?.includes(PUBLIC)) fail('FED_ATTRIBUTION_INVALID');
      const namespace = node.attributedTo.replace('/actors/', '/objectes/').slice(0, -5) + '/';
      if (!node.id.startsWith(namespace) || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(node.id.slice(namespace.length))) fail('FED_OBJECT_NAMESPACE_INVALID');
      if (type === 'Event' && !dataIso(node.startTime)) fail('FED_DATE_INVALID');
      if (node.endTime !== undefined && (!node.startTime || comparaInstants(node.endTime, node.startTime) < 0)) fail('FED_DATE_INVALID');
      if (node.location !== undefined && (!plain(node.location) || node.location.type !== 'Place'
        || typeof node.location.name !== 'string' || Object.keys(node.location).some((key) => !['type', 'name'].includes(key)))) fail('FED_PRIVATE_FIELD');
    } else if (type === 'Announce') {
      if (!known.has(node.actor) || !node.to?.includes(PUBLIC) || !dataIso(node.published)) fail('FED_ATTRIBUTION_INVALID');
      url(node.object, origin);
      const activityNamespace = node.actor.replace('/actors/', '/activitats/').slice(0, -5) + '/';
      if (!node.id.startsWith(activityNamespace) || !/^announce-[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(node.id.slice(activityNamespace.length))) fail('FED_ACTIVITY_NAMESPACE_INVALID');
      if (![...known].some(id => {
        const namespace = id.replace('/actors/', '/objectes/').slice(0, -5) + '/';
        return node.object.startsWith(namespace) && /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(node.object.slice(namespace.length));
      })) fail('FED_OBJECT_NAMESPACE_INVALID');
    } else if (type === 'Create' || type === 'Delete') {
      if (!known.has(node.actor) || !node.to?.includes(PUBLIC)) fail('FED_ATTRIBUTION_INVALID');
      inspect(node.object);
      if (type === 'Create' && !objects.has(node.object.type)
        || type === 'Delete' && node.object.type !== 'Tombstone'
        || type === 'Create' && node.object.attributedTo !== node.actor) fail('FED_ACTIVITY_OBJECT_INVALID');
      if (node.id !== `${node.object.id}#${type.toLowerCase()}`) fail('FED_ACTIVITY_OBJECT_INVALID');
      if (type === 'Delete' && !node.object.id.startsWith(node.actor.replace('/actors/', '/objectes/').slice(0, -5) + '/')) fail('FED_ACTIVITY_OBJECT_INVALID');
    } else if (type === 'Tombstone') {
      if (!objects.has(node.formerType) || !dataIso(node.deleted)) fail('FED_TOMBSTONE_INVALID');
      if (node.content !== undefined || node.summary !== undefined || node.name !== undefined) fail('FED_TOMBSTONE_CONTENT');
      if (![...known].some((id) => {
        const namespace = id.replace('/actors/', '/objectes/').slice(0, -5) + '/';
        return node.id.startsWith(namespace) && /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(node.id.slice(namespace.length));
      })) fail('FED_OBJECT_NAMESPACE_INVALID');
    } else if (type === 'OrderedCollection') {
      if (!Array.isArray(node.orderedItems) || node.totalItems !== node.orderedItems.length
        || !Number.isSafeInteger(node.totalItems)) fail('FED_COLLECTION_INVALID');
      let owner = null, kind = null;
      for (const id of known) {
        for (const collection of ['outbox', 'followers', 'inbox']) {
          const candidate = id.replace('/actors/', `/${collection}/`);
          if (node.id === (collection === 'inbox' ? candidate.slice(0, -5) : candidate)) { owner = id; kind = collection; }
        }
      }
      if (!owner) fail('FED_COLLECTION_NAMESPACE_INVALID');
      if (kind !== 'outbox' && node.totalItems !== 0) fail('FED_COLLECTION_PROFILE_INVALID');
      for (const child of node.orderedItems) {
        inspect(child);
        if (!['Create', 'Delete', 'Announce'].includes(child.type) || child.actor !== owner) fail('FED_COLLECTION_ATTRIBUTION_INVALID');
      }
    } else fail('FED_TYPE_UNSUPPORTED');
    if (top && node.type === 'Tombstone' && known.has(node.id)) fail('FED_TYPE_UNSUPPORTED');
  };
  inspect(document, true);
  return Object.freeze({ valid: true, id: document.id, type: document.type, profile: 'sdp.public.same-origin.v1' });
}
