// @vitest-environment node
/* P1-23 · src/data/activitypub.js, el pont federat de la fase 1. Cada bloc
   cau amb un mutant (gauntlet p123): host aliè acceptat, ordre de l'outbox,
   escapament, claus buides, dates impossibles, mediaType fix, tall d'entrada,
   filtre rel, inbox absent i ordre dels fitxers. Les dades d'exemple són
   les dels exemples de les especificacions (example.org) o del repositori:
   cap publicació real inventada. Cap xarxa. */
import { describe, expect, test } from 'vitest';
import {
  CONTEXT_AS, LIMITS, PUBLIC, REL_PERFIL, TIPUS_AP, aliesWebFinger, analitzaRecursWebFinger, comparaInstants, construeixActor, construeixEnllacosNodeInfo,
  construeixFitxersFederats, construeixFollowers, construeixInbox, construeixNodeInfo, construeixObjectes, construeixOutbox,
  construeixWebFinger, dataIso, escapaHtml, esSlugFederat, htmlDeText, normalitzaOrigen, normalitzaSlugMunicipi, serialitzaJson,
  tipusDImatge, urlsDeMunicipi
} from './activitypub.js';

const ORIGEN = 'https://socdepoble.org';
const TORRE = 'la-torre-de-les-macanes';
const MUNICIPIS = [{ slug: 'socdepoble', perfil: '/projecte' }, { slug: TORRE }, { slug: 'penaguila' }];
const ACTOR_TORRE = { slug: TORRE, nom: 'La Torre de les Maçanes · Sóc de Poble', resum: ['Pàgina pública.', 'Fase 1.'] };

/* Cap clau amb undefined, null o '' en tot l'arbre (defecte 9 del codi de Gemini). */
function clausBuides(valor, cami = '$') {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => clausBuides(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clau, v]) => (v === undefined || v === null || v === ''
      ? [`${cami}.${clau}`] : clausBuides(v, `${cami}.${clau}`)));
  }
  return [];
}

const tempsDe = (funcio) => { const t0 = performance.now(); funcio(); return performance.now() - t0; };

describe('slug i origen', () => {
  test('normalitzaSlugMunicipi: diacrítics, apòstrofs, punt volat, idempotent', () => {
    expect(normalitzaSlugMunicipi('La Torre de les Maçanes')).toBe(TORRE);
    expect(normalitzaSlugMunicipi('Penàguila')).toBe('penaguila');
    expect(normalitzaSlugMunicipi('Vall d’Alcalà')).toBe('vall-d-alcala');
    expect(normalitzaSlugMunicipi('Gel·la')).toBe('gella');
    expect(normalitzaSlugMunicipi('  --Xixona!!  ')).toBe('xixona');
    expect(normalitzaSlugMunicipi(TORRE)).toBe(TORRE);
    for (const buit of ['', '   ', '···', null, undefined, {}, ['a']]) expect(normalitzaSlugMunicipi(buit)).toBe('');
    expect(esSlugFederat(TORRE)).toBe(true);
    expect(esSlugFederat('La-Torre')).toBe(false);
  });

  test('normalitzaSlugMunicipi: talla l’entrada abans de cap regex i no retalla el slug (cap col·lisió)', () => {
    expect(normalitzaSlugMunicipi('a'.repeat(257))).toBe('');
    expect(normalitzaSlugMunicipi('a'.repeat(65))).toBe('');
    expect(normalitzaSlugMunicipi('a'.repeat(64))).toBe('a'.repeat(64));
    // Una entrada llarga que plegaria a un slug curt («a-b»): el tall és per l'entrada, no pel slug.
    expect(normalitzaSlugMunicipi(`a${' '.repeat(300)}b`)).toBe('');
    expect(normalitzaSlugMunicipi(`a${' '.repeat(200)}b`)).toBe('a-b');
    expect(tempsDe(() => normalitzaSlugMunicipi('a-'.repeat(50000)))).toBeLessThan(50);
  });

  test('normalitzaOrigen: https net, o http només en loopback', () => {
    expect(normalitzaOrigen('https://socdepoble.org/')).toBe(ORIGEN);
    expect(normalitzaOrigen('http://localhost:3340')).toBe('http://localhost:3340');
    expect(normalitzaOrigen('http://127.0.0.1:3340')).toBe('http://127.0.0.1:3340');
    expect(normalitzaOrigen('http://[::1]:3340')).toBe('http://[::1]:3340');
    for (const dolent of ['http://socdepoble.org', 'https://socdepoble.org/app', 'https://u:p@socdepoble.org', 'https://socdepoble.org/?x=1',
      'ftp://socdepoble.org', 'socdepoble.org', '', null, `https://${'a'.repeat(100000)}.org/x`]) {
      expect(() => normalitzaOrigen(dolent), String(dolent).slice(0, 40)).toThrow(TypeError);
    }
  });

  test('urlsDeMunicipi: l’esquema /ap/ únic, ids absoluts https i cap reassignació silenciosa', () => {
    expect(urlsDeMunicipi(TORRE, { origen: ORIGEN })).toEqual({
      actor: `${ORIGEN}/ap/actors/${TORRE}.json`,
      outbox: `${ORIGEN}/ap/outbox/${TORRE}.json`,
      followers: `${ORIGEN}/ap/followers/${TORRE}.json`,
      inbox: `${ORIGEN}/ap/inbox/${TORRE}`,
      objectes: `${ORIGEN}/ap/objectes/${TORRE}/`,
      perfil: `${ORIGEN}/pobles/${TORRE}`,
      acct: `acct:${TORRE}@socdepoble.org`,
      webfinger: `${ORIGEN}/.well-known/webfinger?resource=acct%3A${TORRE}%40socdepoble.org`
    });
    expect(urlsDeMunicipi('socdepoble', { origen: 'http://localhost:3340', perfil: '/projecte' }).acct).toBe('acct:socdepoble@localhost:3340');
    expect(() => urlsDeMunicipi('La Torre', { origen: ORIGEN })).toThrow(TypeError);
    expect(() => urlsDeMunicipi(TORRE, { origen: ORIGEN, perfil: '//evil.example/x' })).toThrow(TypeError);
    expect(() => urlsDeMunicipi(TORRE, { origen: ORIGEN, perfil: '/a/../b' })).toThrow(TypeError);
  });
});

describe('WebFinger (RFC 7033) i la comprovació inversa de Mastodon', () => {
  test('el JRD de l’exemple de l’RFC 7033 §3.1: subject, aliases i links amb rel, type i href', () => {
    const jrd = construeixWebFinger(`acct:${TORRE}@socdepoble.org`, { origen: ORIGEN, municipis: MUNICIPIS });
    expect(jrd).toEqual({
      subject: `acct:${TORRE}@socdepoble.org`,
      aliases: [`${ORIGEN}/ap/actors/${TORRE}.json`, `${ORIGEN}/pobles/${TORRE}`],
      links: [
        { rel: 'self', type: TIPUS_AP, href: `${ORIGEN}/ap/actors/${TORRE}.json` },
        { rel: REL_PERFIL, type: 'text/html', href: `${ORIGEN}/pobles/${TORRE}` }
      ]
    });
  });

  test('Mastodon: subject ↔ preferredUsername@host de l’actor i rel=self cap a l’id de l’actor', () => {
    for (const origen of [ORIGEN, 'http://localhost:3340']) {
      const actor = construeixActor(ACTOR_TORRE, { origen });
      const jrd = construeixWebFinger(`acct:${actor.preferredUsername}@${new URL(actor.id).host}`, { origen, municipis: MUNICIPIS });
      expect(jrd.subject).toBe(`acct:${actor.preferredUsername}@${new URL(actor.id).host}`);
      expect(jrd.links.find((l) => l.rel === 'self')).toEqual({ rel: 'self', type: TIPUS_AP, href: actor.id });
    }
  });

  test('també respon per l’URL de l’actor i del perfil; majúscules a l’usuari i al host', () => {
    expect(construeixWebFinger(`${ORIGEN}/ap/actors/${TORRE}.json`, { origen: ORIGEN, municipis: MUNICIPIS })?.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    expect(construeixWebFinger(`${ORIGEN}/projecte`, { origen: ORIGEN, municipis: MUNICIPIS })?.subject).toBe('acct:socdepoble@socdepoble.org');
    expect(construeixWebFinger('ACCT:La-Torre-De-Les-Macanes@SocDePoble.org', { origen: ORIGEN, municipis: MUNICIPIS })?.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    expect(construeixWebFinger(`acct:${TORRE}%40x@socdepoble.org`, { origen: ORIGEN, municipis: MUNICIPIS })).toBeNull();
  });

  /* Ordre del Mestre del 30-10-2026: @latorredelesmacanes, sense guions, és La Torre. El JRD és el de l'actor,
     amb el subject canònic (Mastodon, resolve_account_service.rb, torna a preguntar pel subject). */
  test('àlies: el JRD de l’actor amb el subject canònic; cap àlies invàlid, repetit o que siga un altre actor', () => {
    const ambAlies = [{ slug: 'socdepoble', perfil: '/projecte' }, { slug: TORRE, alies: ['latorredelesmacanes'] }, { slug: 'penaguila' }];
    const canonic = construeixWebFinger(`acct:${TORRE}@socdepoble.org`, { origen: ORIGEN, municipis: ambAlies });
    expect(construeixWebFinger('acct:latorredelesmacanes@socdepoble.org', { origen: ORIGEN, municipis: ambAlies })).toEqual(canonic);
    expect(construeixWebFinger('ACCT:LaTorreDeLesMacanes@SocDePoble.org', { origen: ORIGEN, municipis: ambAlies })?.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    expect(canonic.subject).toBe(`acct:${TORRE}@socdepoble.org`);
    // Sense l'àlies declarat, res; i un àlies d'un altre host, tampoc.
    expect(construeixWebFinger('acct:latorredelesmacanes@socdepoble.org', { origen: ORIGEN, municipis: MUNICIPIS })).toBeNull();
    expect(construeixWebFinger('acct:latorredelesmacanes@mastodon.social', { origen: ORIGEN, municipis: ambAlies })).toBeNull();
    expect(aliesWebFinger(ambAlies)).toEqual(new Map([['latorredelesmacanes', TORRE]]));
    expect(() => aliesWebFinger([{ slug: TORRE, alies: ['penaguila'] }, { slug: 'penaguila' }])).toThrow(/d'un altre actor: penaguila/);
    expect(() => aliesWebFinger([{ slug: 'a', alies: ['x'] }, { slug: 'b', alies: ['x'] }])).toThrow(/repetit/);
    expect(() => aliesWebFinger([{ slug: 'a', alies: ['La Torre'] }])).toThrow(/invàlid/);
    expect(() => aliesWebFinger([{ slug: 'a', alies: 'x' }])).toThrow(/llista/);
  });

  test('rebutja hosts aliens, slugs desconeguts, esquemes estranys i recursos malformats', () => {
    const dolents = [
      `acct:${TORRE}@mastodon.social`, `acct:${TORRE}@socdepoble.org.evil.example`, `acct:${TORRE}@localhost:3340`,
      'acct:benifallim@socdepoble.org', 'acct:@socdepoble.org', 'acct:socdepoble.org', `mailto:${TORRE}@socdepoble.org`,
      `https://evil.example/ap/actors/${TORRE}.json`, `${ORIGEN}/ap/actors/benifallim.json`, 'acct:%E0%A4%A@socdepoble.org',
      '', 42, null, `acct:${TORRE}@socdepoble.org`.padEnd(513, 'x')
    ];
    for (const recurs of dolents) expect(construeixWebFinger(recurs, { origen: ORIGEN, municipis: MUNICIPIS }), String(recurs).slice(0, 60)).toBeNull();
  });

  test('RFC 7033 §4.2: el resource malformat (400) es distingix del ben format però desconegut (404)', () => {
    const malformats = [
      '', 'acct:', 'notauri', `acct:${TORRE}`, 'acct:@socdepoble.org', `acct:${TORRE}@`, 'acct:a@b@socdepoble.org',
      `acct:${TORRE} @socdepoble.org`, 'acct:%E0%A4%A@socdepoble.org', 'acct:%E0%A4@socdepoble.org', '://x', '1acct:x@y',
      'https://socdepoble.org/a b', 'https://socdepoble.org/<x>', 42, null, undefined
    ];
    for (const recurs of malformats) {
      expect(analitzaRecursWebFinger(recurs), String(recurs).slice(0, 40)).toBeNull();
      expect(construeixWebFinger(recurs, { origen: ORIGEN, municipis: MUNICIPIS }), String(recurs).slice(0, 40)).toBeNull();
    }
    expect(analitzaRecursWebFinger('ACCT:La-Torre@SocDePoble.org')).toEqual({ esquema: 'acct', usuari: 'la-torre', host: 'socdepoble.org' });
    expect(analitzaRecursWebFinger('acct:la%2Dtorre@localhost:3340')).toEqual({ esquema: 'acct', usuari: 'la-torre', host: 'localhost:3340' });
    // Ben formats però no d'este servidor: construeixWebFinger torna null i el servidor, 404.
    expect(analitzaRecursWebFinger(`acct:${TORRE}@mastodon.social`)).toEqual({ esquema: 'acct', usuari: TORRE, host: 'mastodon.social' });
    expect(analitzaRecursWebFinger('mailto:x@socdepoble.org')).toEqual({ esquema: 'mailto', uri: 'mailto:x@socdepoble.org' });
    expect(analitzaRecursWebFinger('acct:benifallim@socdepoble.org')).not.toBeNull();
    // El sostre de LIMITS.recurs: 512 caràcters ben formats passen, 513 són malformats (abans de cap regex).
    const vora = `acct:${'a'.repeat(LIMITS.recurs - 'acct:@socdepoble.org'.length)}@socdepoble.org`;
    expect(vora).toHaveLength(LIMITS.recurs);
    expect(analitzaRecursWebFinger(vora)).not.toBeNull();
    expect(analitzaRecursWebFinger(`${vora}x`)).toBeNull();
  });

  test('cap ReDoS: un resource de 100.000 caràcters es rebutja en menys de 50 ms', () => {
    const llarg = `acct:${'a-'.repeat(50000)}@socdepoble.org`;
    let resultat;
    expect(tempsDe(() => { resultat = construeixWebFinger(llarg, { origen: ORIGEN, municipis: MUNICIPIS }); })).toBeLessThan(50);
    expect(resultat).toBeNull();
  });

  test('rel (RFC 7033 §4.3): només els enllaços demanats; subject i aliases sempre', () => {
    const nomesSelf = construeixWebFinger(`acct:${TORRE}@socdepoble.org`, { origen: ORIGEN, municipis: MUNICIPIS, rel: ['self'] });
    expect(nomesSelf.links.map((l) => l.rel)).toEqual(['self']);
    expect(nomesSelf.aliases).toHaveLength(2);
    expect(construeixWebFinger(`acct:${TORRE}@socdepoble.org`, { origen: ORIGEN, municipis: MUNICIPIS, rel: 'http://example.org/rel/x' }).links).toEqual([]);
    expect(construeixWebFinger(`acct:${TORRE}@socdepoble.org`, { origen: ORIGEN, municipis: MUNICIPIS, rel: [] }).links).toHaveLength(2);
  });
});

describe('actor (ActivityPub §4.1, AS2 Organization)', () => {
  test('inbox i outbox (MUST), followers, Organization i cap data inventada', () => {
    const actor = construeixActor(ACTOR_TORRE, { origen: ORIGEN });
    expect(actor).toEqual({
      '@context': CONTEXT_AS,
      id: `${ORIGEN}/ap/actors/${TORRE}.json`,
      type: 'Organization',
      preferredUsername: TORRE,
      name: 'La Torre de les Maçanes · Sóc de Poble',
      summary: '<p>Pàgina pública.</p><p>Fase 1.</p>',
      url: `${ORIGEN}/pobles/${TORRE}`,
      inbox: `${ORIGEN}/ap/inbox/${TORRE}`,
      outbox: `${ORIGEN}/ap/outbox/${TORRE}.json`,
      followers: `${ORIGEN}/ap/followers/${TORRE}.json`
    });
    expect(clausBuides(actor)).toEqual([]);
    expect(actor).not.toHaveProperty('published');
    expect(actor).not.toHaveProperty('publicKey');
  });

  test('cap clau buida encara que falten el resum i la icona', () => {
    const actor = construeixActor({ slug: 'penaguila', nom: 'Penàguila', resum: '', icona: null }, { origen: ORIGEN });
    expect(clausBuides(actor)).toEqual([]);
    expect(Object.keys(actor)).not.toContain('summary');
    expect(Object.keys(actor)).not.toContain('icon');
  });

  test('icona: el mediaType ix de l’extensió (mai un image/webp fix) i s’omet si no es coneix', () => {
    const icona = (url) => construeixActor({ ...ACTOR_TORRE, icona: url }, { origen: ORIGEN }).icon;
    expect(icona(`${ORIGEN}/icona-app-512.png`)).toEqual({ type: 'Image', mediaType: 'image/png', url: `${ORIGEN}/icona-app-512.png` });
    expect(icona(`${ORIGEN}/a/b.JPG`).mediaType).toBe('image/jpeg');
    expect(icona(`${ORIGEN}/a/b.webp`).mediaType).toBe('image/webp');
    expect(icona(`${ORIGEN}/a/logo`)).toEqual({ type: 'Image', url: `${ORIGEN}/a/logo` });
    expect(tipusDImatge(`${ORIGEN}/a.svg`)).toBeNull();
    expect(() => icona('javascript:alert(1)')).toThrow(TypeError);
    // http només en loopback (el servidor de desenvolupament); cap credencial a l'URL.
    expect(icona('http://localhost:3340/icona.png').url).toBe('http://localhost:3340/icona.png');
    for (const dolenta of ['http://example.org/a.png', 'https://u:p@example.org/a.png', 'https://u@example.org/a.png']) {
      expect(() => icona(dolenta), dolenta).toThrow(TypeError);
    }
  });

  test('tipus admesos i clau: només una clau PÚBLICA en PEM, amb el context de seguretat', () => {
    expect(construeixActor({ ...ACTOR_TORRE, tipus: 'Service' }, { origen: ORIGEN }).type).toBe('Service');
    expect(() => construeixActor({ ...ACTOR_TORRE, tipus: 'Person' }, { origen: ORIGEN })).toThrow(TypeError);
    expect(() => construeixActor({ ...ACTOR_TORRE, nom: '  ' }, { origen: ORIGEN })).toThrow(TypeError);
    const pem = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----\n';
    const ambClau = construeixActor({ ...ACTOR_TORRE, clauPublicaPem: pem }, { origen: ORIGEN });
    expect(ambClau['@context']).toEqual([CONTEXT_AS, 'https://w3id.org/security/v1']);
    expect(ambClau.publicKey).toEqual({ id: `${ambClau.id}#main-key`, owner: ambClau.id, publicKeyPem: pem });
    expect(() => construeixActor({ ...ACTOR_TORRE, clauPublicaPem: pem.replaceAll('PUBLIC', 'PRIVATE') }, { origen: ORIGEN })).toThrow(TypeError);
  });

  test('el resum és text pla escapat: cap HTML d’origen passa', () => {
    const actor = construeixActor({ ...ACTOR_TORRE, resum: '<script>alert(1)</script> & "cometes" \'simples\'' }, { origen: ORIGEN });
    expect(actor.summary).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;cometes&quot; &#39;simples&#39;</p>');
  });
});

describe('outbox i objectes (ActivityPub §5.1, AS2)', () => {
  const ELEMENTS = [
    { id: 'pagina-a', tipus: 'Article', nom: 'A', text: 'Primer', url: `${ORIGEN}/a`, publicat: '2026-08-20T00:00:00.000Z', llengua: 'ca' },
    { id: 'avis-b', tipus: 'Note', nom: 'Avís', text: 'Línia 1\nLínia 2\n\nParàgraf 2', publicat: '2026-10-30T00:06:00+01:00' },
    { id: 'sense-data', tipus: 'Article', nom: 'Sense data' },
    { id: 'pagina-c', tipus: 'Article', nom: 'C', publicat: '2026-09-09T00:00:00+02:00' }
  ];

  test('OrderedCollection en ordre cronològic invers; sense data, darrere; Create públic amb ids estables', () => {
    const outbox = construeixOutbox(TORRE, ELEMENTS, { origen: ORIGEN });
    expect(outbox).toMatchObject({ '@context': CONTEXT_AS, id: `${ORIGEN}/ap/outbox/${TORRE}.json`, type: 'OrderedCollection', totalItems: 4 });
    expect(outbox.orderedItems.map((a) => a.object.id.split('/').at(-1))).toEqual(['avis-b.json', 'pagina-c.json', 'pagina-a.json', 'sense-data.json']);
    const datades = outbox.orderedItems.map((a) => a.published).filter(Boolean).map(Date.parse);
    expect(datades).toEqual([...datades].sort((a, b) => b - a));
    for (const activitat of outbox.orderedItems) {
      expect(activitat).toMatchObject({ type: 'Create', actor: `${ORIGEN}/ap/actors/${TORRE}.json`, to: [PUBLIC], cc: [`${ORIGEN}/ap/followers/${TORRE}.json`] });
      expect(activitat.id).toBe(`${activitat.object.id}#create`);
      expect(activitat.object.attributedTo).toBe(activitat.actor);
      // L'objecte també és públic: quan Mastodon el resol per URL, en deduïx la visibilitat del seu to/cc.
      expect(activitat.object.to).toEqual([PUBLIC]);
      expect(activitat.object.cc).toEqual([`${ORIGEN}/ap/followers/${TORRE}.json`]);
      // El Create porta la data de l'objecte quan n'hi ha, i cap si no.
      if (activitat.object.published) expect(activitat.published).toBe(activitat.object.published);
      else expect(activitat).not.toHaveProperty('published');
    }
    expect(outbox.orderedItems.filter((a) => a.published)).toHaveLength(3);
    expect(outbox.orderedItems.find((a) => a.object.id.endsWith('/pagina-a.json')).object.contentMap).toEqual({ ca: '<p>Primer</p>' });
    expect(new Set(outbox.orderedItems.map((a) => a.id)).size).toBe(4);
    expect(clausBuides(outbox)).toEqual([]);
    // L'ordre d'entrada no canvia l'eixida.
    expect(serialitzaJson(construeixOutbox(TORRE, [...ELEMENTS].reverse(), { origen: ORIGEN }))).toBe(serialitzaJson(outbox));
  });

  test('a igual data (també el mateix instant en una altra zona), l’ordre és per id i no depén de l’entrada', () => {
    const iguals = [
      { id: 'b-segon', tipus: 'Article', nom: 'B', publicat: '2026-10-30T10:00:00Z' },
      { id: 'a-primer', tipus: 'Article', nom: 'A', publicat: '2026-10-30T11:00:00+01:00' },
      { id: 'c-sense', tipus: 'Article', nom: 'C' },
      { id: 'a-sense', tipus: 'Article', nom: 'S' }
    ];
    const ids = (llista) => construeixOutbox(TORRE, llista, { origen: ORIGEN }).orderedItems.map((a) => a.object.id.split('/').at(-1));
    expect(ids(iguals)).toEqual(['a-primer.json', 'b-segon.json', 'a-sense.json', 'c-sense.json']);
    expect(ids([...iguals].reverse())).toEqual(ids(iguals));
  });

  test('dates: instant en UTC, el desplaçament conservat a l’hora d’un acte, cap data impossible', () => {
    expect(dataIso('2026-10-30T00:06:00+01:00')).toBe('2026-10-29T23:06:00Z');
    expect(dataIso('2023-01-29T10:00:00+01:00', { conservaDesplacament: true })).toBe('2023-01-29T10:00:00+01:00');
    for (const dolenta of ['2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-10-30T24:00:00Z', '2026-10-30T10:00:00', '2026-10-30',
      '0026-01-01T00:00:00Z', '2026-10-30T10:00:00+25:00', '2026-10-30T10:00:00+01:60', '2026-10-30T10:00:60Z', '2026-10-30T10:60:00Z', 'demà']) {
      expect(dataIso(dolenta), dolenta).toBeNull();
    }
    expect(() => construeixOutbox(TORRE, [{ id: 'x', tipus: 'Article', nom: 'X', publicat: '2026-02-30T00:00:00Z' }], { origen: ORIGEN })).toThrow(TypeError);
  });

  /* Gauntlet 261030 (C8 de Codex): .123Z i .987Z eren el mateix instant serialitzat. */
  test('dates: la fracció de segon es conserva en els dos modes (forma canònica) i es compara sense truncar', () => {
    expect(dataIso('2026-10-30T10:00:00.123Z')).toBe('2026-10-30T10:00:00.123Z');
    expect(dataIso('2026-10-30T10:00:00.987Z')).toBe('2026-10-30T10:00:00.987Z');
    // Postgres (timestamptz) en dona microsegons; la zona passa a UTC i la fracció no es toca.
    expect(dataIso('2026-10-30T10:00:00.123456+01:00')).toBe('2026-10-30T09:00:00.123456Z');
    expect(dataIso('2026-10-30T10:00:00.123456789Z')).toBe('2026-10-30T10:00:00.123456789Z');
    // Forma canònica d'xsd:dateTime: cap zero al final, i .000 no n'escriu cap (els mateixos bytes que abans).
    expect(dataIso('2026-10-30T10:00:00.120Z')).toBe('2026-10-30T10:00:00.12Z');
    expect(dataIso('2026-08-20T00:00:00.000Z')).toBe('2026-08-20T00:00:00Z');
    expect(dataIso('2026-10-30T10:00:00.50+01:00', { conservaDesplacament: true })).toBe('2026-10-30T10:00:00.5+01:00');
    expect(dataIso('2026-10-30T10:00:00.000+01:00', { conservaDesplacament: true })).toBe('2026-10-30T10:00:00+01:00');
    expect(dataIso('2026-10-30T10:00:00.1234567890Z')).toBeNull();
    // comparaInstants: el segon UTC i després la fracció, fins al nanosegon; el mateix instant en una altra zona és 0.
    expect(comparaInstants('2026-10-30T10:00:00.123Z', '2026-10-30T10:00:00.987Z')).toBe(-1);
    expect(comparaInstants('2026-10-30T10:00:00.0009Z', '2026-10-30T10:00:00.0001Z')).toBe(1);
    expect(comparaInstants('2026-10-30T10:00:00.1Z', '2026-10-30T10:00:00.100000001Z')).toBe(-1);
    expect(comparaInstants('2026-10-30T11:00:00.5+01:00', '2026-10-30T10:00:00.500Z')).toBe(0);
    // L'ordre del text no és el del temps: '…:00Z' va darrere de '…:00.5Z' com a text i és anterior.
    expect(comparaInstants('2026-10-30T10:00:00Z', '2026-10-30T10:00:00.5Z')).toBe(-1);
    expect(comparaInstants('2026-10-30T10:00:00Z', 'demà')).toBeNaN();
  });

  test('outbox: dins del mateix mil·lisegon mana la fracció, no l’id; un Event no acaba abans de començar', () => {
    const mateixMilisegon = [
      { id: 'a-abans', tipus: 'Article', nom: 'A', publicat: '2026-10-30T10:00:00.0001Z' },
      { id: 'b-despres', tipus: 'Article', nom: 'B', publicat: '2026-10-30T10:00:00.0009Z' }
    ];
    const outbox = construeixOutbox(TORRE, mateixMilisegon, { origen: ORIGEN });
    expect(outbox.orderedItems.map((a) => [a.object.id.split('/').at(-1), a.published])).toEqual([
      ['b-despres.json', '2026-10-30T10:00:00.0009Z'], ['a-abans.json', '2026-10-30T10:00:00.0001Z']
    ]);
    // Dins del mateix mil·lisegon, també: Date.parse no hi veu cap diferència.
    const acte = { id: 'acte', tipus: 'Event', nom: 'Acte', inici: '2026-10-30T10:00:00.0009+01:00' };
    expect(() => construeixObjectes(TORRE, [{ ...acte, fi: '2026-10-30T10:00:00.0001+01:00' }], { origen: ORIGEN })).toThrow(/Hora de fi invàlida/);
    const [bo] = construeixObjectes(TORRE, [{ ...acte, fi: '2026-10-30T10:00:00.000950+01:00' }], { origen: ORIGEN });
    expect([bo.startTime, bo.endTime]).toEqual(['2026-10-30T10:00:00.0009+01:00', '2026-10-30T10:00:00.00095+01:00']);
  });

  test('Note: el títol dins del content; paràgrafs i salts escapats', () => {
    const [note] = construeixObjectes(TORRE, [ELEMENTS[1]], { origen: ORIGEN });
    expect(note).not.toHaveProperty('name');
    expect(note.content).toBe('<p><strong>Avís</strong></p><p>Línia 1<br>Línia 2</p><p>Paràgraf 2</p>');
    expect(() => construeixObjectes(TORRE, [{ id: 'buida', tipus: 'Note' }], { origen: ORIGEN })).toThrow(TypeError);
    // Un títol hostil també s'escapa (mai HTML cru d'usuari al content).
    const [hostil] = construeixObjectes(TORRE, [{ id: 'hostil', tipus: 'Note', nom: '<img src=x onerror=alert(1)> & "c" \'s\'', text: 'x' }], { origen: ORIGEN });
    expect(hostil.content).toBe('<p><strong>&lt;img src=x onerror=alert(1)&gt; &amp; &quot;c&quot; &#39;s&#39;</strong></p><p>x</p>');
  });

  test('Article i Event: l’entradeta és summary (el que Mastodon en mostra), escapada i amb summaryMap; una Note no en porta', () => {
    const [article] = construeixObjectes(TORRE, [{ id: 'pagina-x', tipus: 'Article', nom: 'Títol', resum: 'Entradeta <b>crua</b> & més', llengua: 'ca', url: `${ORIGEN}/x` }], { origen: ORIGEN });
    expect(article.summary).toBe('<p>Entradeta &lt;b&gt;crua&lt;/b&gt; &amp; més</p>');
    expect(article.summaryMap).toEqual({ ca: article.summary });
    expect(article).not.toHaveProperty('content');
    expect(article).not.toHaveProperty('contentMap');
    const [ambCos] = construeixObjectes(TORRE, [{ id: 'pagina-y', tipus: 'Article', nom: 'T', resum: 'Resum', text: 'Cos' }], { origen: ORIGEN });
    expect([ambCos.summary, ambCos.content]).toEqual(['<p>Resum</p>', '<p>Cos</p>']);
    expect(ambCos).not.toHaveProperty('summaryMap');
    const [acte] = construeixObjectes(TORRE, [{ id: 'acte', tipus: 'Event', nom: 'Acte', resum: 'Resum', inici: '2026-11-01T10:00:00+01:00' }], { origen: ORIGEN });
    expect(acte.summary).toBe('<p>Resum</p>');
    // En una Note, Mastodon mostra el summary com a avís de contingut i amaga el text.
    expect(() => construeixObjectes(TORRE, [{ id: 'nota', tipus: 'Note', text: 'x', resum: 'avís' }], { origen: ORIGEN })).toThrow(TypeError);
  });

  test('Event (AS2 i Mobilizon): name, startTime, endTime i location Place només si el lloc és real', () => {
    const [acte] = construeixObjectes(TORRE, [{
      id: 'acte-exemple', tipus: 'Event', nom: 'Going-Away Party for Jim', text: 'Exemple de l’AS2 Vocabulary (Example 56).',
      inici: '2014-12-31T23:00:00-08:00', fi: '2015-01-01T06:00:00-08:00', lloc: { nom: 'Plaça Major' }, url: 'https://example.org/acte'
    }], { origen: ORIGEN });
    expect(acte).toMatchObject({ type: 'Event', name: 'Going-Away Party for Jim', startTime: '2014-12-31T23:00:00-08:00',
      endTime: '2015-01-01T06:00:00-08:00', location: { type: 'Place', name: 'Plaça Major' }, url: 'https://example.org/acte' });
    const [senseLloc] = construeixObjectes(TORRE, [{ id: 'acte-2', tipus: 'Event', nom: 'Acte', inici: '2026-11-01T10:00:00+01:00' }], { origen: ORIGEN });
    expect(senseLloc).not.toHaveProperty('location');
    expect(senseLloc).not.toHaveProperty('endTime');
    expect(() => construeixObjectes(TORRE, [{ id: 'acte-3', tipus: 'Event', nom: 'Sense hora' }], { origen: ORIGEN })).toThrow(TypeError);
    expect(() => construeixObjectes(TORRE, [{ id: 'acte-4', tipus: 'Event', nom: 'Al revés', inici: '2026-11-01T10:00:00+01:00', fi: '2026-11-01T09:00:00+01:00' }], { origen: ORIGEN })).toThrow(TypeError);
  });

  test('privacitat: cap camp fora de la llista ix (correu, usuari, autoria de persona, coordenades)', () => {
    const privat = { id: 'pub', tipus: 'Article', nom: 'Públic', text: 'Text', email: 'anna@example.org', owner_user_id: 'u-123',
      author_name: 'Anna Persona', lat: 38.59, lng: -0.41, visibility: 'members', telefon: '600000000' };
    const text = serialitzaJson(construeixOutbox(TORRE, [privat], { origen: ORIGEN }));
    for (const fuita of ['anna@example.org', 'u-123', 'Anna Persona', '38.59', 'members', '600000000', 'owner_user_id', 'email']) expect(text).not.toContain(fuita);
  });

  test('identificadors: nets, únics i obligatoris; tipus i URL validats', () => {
    for (const dolent of [[{ id: 'A B', tipus: 'Article', nom: 'x' }], [{ tipus: 'Article', nom: 'x' }], [{ id: 'x', tipus: 'Person', nom: 'x' }],
      [{ id: 'x', tipus: 'Article', nom: 'x', url: 'javascript:alert(1)' }], [{ id: 'x', tipus: 'Article', nom: 'x', llengua: 'català' }],
      [{ id: 'x', tipus: 'Article', nom: 'x', url: 'http://example.org/x' }], [{ id: 'x', tipus: 'Article', nom: 'x', url: 'https://u:p@example.org/x' }],
      [{ id: 'x', tipus: 'Article', nom: 'x' }, { id: 'x', tipus: 'Article', nom: 'y' }]]) {
      expect(() => construeixObjectes(TORRE, dolent, { origen: ORIGEN })).toThrow(TypeError);
    }
  });

  test('escapament: htmlDeText i escapaHtml', () => {
    expect(escapaHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    expect(htmlDeText('\r\n  a \u0000 b \r\n\r\n\r\n c ')).toBe('<p>a b</p><p>c</p>');
    expect(htmlDeText('')).toBe('');
  });

  test('followers: buida i honesta', () => {
    expect(construeixFollowers(TORRE, { origen: ORIGEN })).toEqual({
      '@context': CONTEXT_AS, id: `${ORIGEN}/ap/followers/${TORRE}.json`, type: 'OrderedCollection', totalItems: 0, orderedItems: []
    });
  });

  test('inbox (§5.2): una OrderedCollection buida i certa a l’URL que l’actor declara', () => {
    expect(construeixInbox(TORRE, { origen: ORIGEN })).toEqual({
      '@context': CONTEXT_AS, id: `${ORIGEN}/ap/inbox/${TORRE}`, type: 'OrderedCollection', totalItems: 0, orderedItems: []
    });
    expect(construeixInbox(TORRE, { origen: ORIGEN }).id).toBe(construeixActor(ACTOR_TORRE, { origen: ORIGEN }).inbox);
  });
});

describe('fitxers federats i NodeInfo', () => {
  const ACTORS = [
    { slug: 'socdepoble', nom: 'Sóc de Poble', perfil: '/projecte', icona: `${ORIGEN}/icona-app-512.png`,
      elements: [{ id: 'pagina-a', tipus: 'Article', nom: 'A', publicat: '2026-08-20T00:00:00Z' }] },
    { ...ACTOR_TORRE, elements: [] }
  ];

  test('un mapa ordenat per camí amb actor, outbox, followers i cada objecte amb el seu @context', () => {
    const fitxers = construeixFitxersFederats({ origen: ORIGEN, actors: ACTORS });
    expect([...fitxers.keys()]).toEqual([
      `ap/actors/${TORRE}.json`, 'ap/actors/socdepoble.json', `ap/followers/${TORRE}.json`, 'ap/followers/socdepoble.json',
      `ap/inbox/${TORRE}`, 'ap/inbox/socdepoble', 'ap/objectes/socdepoble/pagina-a.json', `ap/outbox/${TORRE}.json`, 'ap/outbox/socdepoble.json'
    ]);
    for (const [cami, document] of fitxers) {
      expect(document.id, cami).toBe(`${ORIGEN}/${cami}`);
      expect(document['@context'], cami).toBe(CONTEXT_AS);
      expect(clausBuides(document), cami).toEqual([]);
    }
    expect(fitxers.get(`ap/outbox/${TORRE}.json`)).toMatchObject({ totalItems: 0, orderedItems: [] });
    expect(fitxers.get(`ap/inbox/${TORRE}`)).toMatchObject({ type: 'OrderedCollection', totalItems: 0, orderedItems: [] });
    // L'objecte servit per URL és públic per ell mateix (to/cc), no només dins del Create.
    const objecte = fitxers.get('ap/objectes/socdepoble/pagina-a.json');
    expect([objecte.to, objecte.cc]).toEqual([[PUBLIC], [`${ORIGEN}/ap/followers/socdepoble.json`]]);
  });

  test('determinisme: dues crides (i els actors en un altre ordre) donen els mateixos bytes', () => {
    const bytes = (actors) => [...construeixFitxersFederats({ origen: ORIGEN, actors })].map(([c, d]) => `${c}\n${serialitzaJson(d)}`).join('');
    expect(bytes(ACTORS)).toBe(bytes(ACTORS));
    expect(bytes([...ACTORS].reverse())).toBe(bytes(ACTORS));
    expect(() => construeixFitxersFederats({ origen: ORIGEN, actors: [ACTORS[1], ACTORS[1]] })).toThrow(TypeError);
  });

  test('NodeInfo 2.1: els camps obligatoris de l’esquema i cap recompte de persones', () => {
    const info = construeixNodeInfo({ origen: ORIGEN, versio: '1.0.0' });
    expect(Object.keys(info).sort()).toEqual(['metadata', 'openRegistrations', 'protocols', 'services', 'software', 'usage', 'version']);
    expect(info).toMatchObject({ version: '2.1', protocols: ['activitypub'], openRegistrations: false, usage: { users: {} } });
    expect(info.software.name).toMatch(/^[a-z0-9-]+$/);
    expect(construeixEnllacosNodeInfo({ origen: ORIGEN })).toEqual({ links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: `${ORIGEN}/nodeinfo/2.1.json` }] });
    expect(() => construeixNodeInfo({ origen: ORIGEN, versio: 'x' })).toThrow(TypeError);
  });
});
