import { expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { exportaMunicipiOpenData, preparaDadesObertesMunicipi, verificaPaquetOpenData } from './exportaMunicipiOpenData.js';
import { construeixOutbox } from './activitypub.js';
import { entradaOpenDataDelPoble } from './entradaOpenDataDelPoble.js';
const origen = 'https://socdepoble.org';
const port = { teCapacitat: () => true, listPublicOrganizations: vi.fn(async () => []) };
/* Decisió del Mestre del 31-10-2026 (Ronda 2): només La Torre té actor i outbox. */
const TORRE = 'la-torre-de-les-macanes';
const opcions = () => ({ municipi: { slug: TORRE, nom: 'La Torre de les Maçanes' }, port, ara: '2026-10-31T12:00:00Z', origen,
  fetchImpl: vi.fn(async () => new Response(JSON.stringify(construeixOutbox(TORRE, [], { origen })), { headers: { 'content-type': 'application/activity+json' } })), subtle: webcrypto.subtle });
test('API de slug: paquet BagIt verificable amb JSON-LD i ActivityStreams, sense inventar notícies', async () => {
  const paquet = await exportaMunicipiOpenData(TORRE, opcions());
  expect(paquet.datapackage.resources.some(r => r.path === 'activitystreams.json')).toBe(true);
  expect(paquet.comptes.noticies).toBe(0);
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
});
test('no exporta un outbox d’un altre poble, ni una lectura fallida', async () => {
  const op = opcions(); op.fetchImpl = async () => new Response(JSON.stringify(construeixOutbox('tibi', [], { origen })));
  await expect(entradaOpenDataDelPoble(TORRE, op)).rejects.toThrow('Outbox municipal');
  op.fetchImpl = async () => new Response('', { status: 404 });
  await expect(entradaOpenDataDelPoble(TORRE, op)).rejects.toThrow('no està disponible');
});
test('un poble de mostra no demana cap outbox i el paquet no porta ActivityStreams ni enllaç federat', async () => {
  const op = { ...opcions(), municipi: { slug: 'sella', nom: 'Sella' } };
  const paquet = await exportaMunicipiOpenData('sella', op);
  expect(op.fetchImpl).not.toHaveBeenCalled();
  expect(paquet.datapackage.resources.some(r => r.path === 'activitystreams.json')).toBe(false);
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
});
test('memoria.md i llicencies.md compten les publicacions d’activitystreams.json', async () => {
  const nota = { id: 'avis-1', tipus: 'Note', nom: 'Avís', text: 'Text públic', llengua: 'ca', publicat: '2026-10-01T10:00:00Z' };
  const op = opcions(); op.fetchImpl = async () => new Response(JSON.stringify(construeixOutbox(TORRE, [nota], { origen })));
  const preparat = preparaDadesObertesMunicipi(await entradaOpenDataDelPoble(TORRE, op));
  const text = (nom) => preparat.fitxers.find((f) => f.nom === nom).text;
  expect(text('memoria.md')).toContain('| `activitystreams.json` | 1 |');
  expect(text('llicencies.md')).toContain('Publicacions federades (`activitystreams.json`): 1 element sense llicència declarada');
  const paquet = await exportaMunicipiOpenData(TORRE, op);
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
});
/* R2-COR-03 / R-01: la memòria diu què NO s'exporta i per què, en lloc d'un «Sense elements» i un «Res.» que semblen un poble sense notícies. */
test('memoria.md: les fonts pendents, amb el motiu, i cap «sense elements» per a una col·lecció que no s’ha llegit', async () => {
  const op = { ...opcions(), municipi: { slug: 'sella', nom: 'Sella' } };
  const entrada = await entradaOpenDataDelPoble('sella', op);
  expect(entrada.pendents.map(p => p.coleccio)).toEqual(['noticies', 'agenda', 'memoria', 'memoriaOral', 'configuracio']);
  const memoria = preparaDadesObertesMunicipi(entrada).fitxers.find((f) => f.nom === 'memoria.md').text;
  expect(memoria).toContain('## Fonts pendents');
  expect(memoria).toContain("- Notícies i avisos: encara no hi ha cap lectura pública garantida d'estes dades.");
  expect(memoria).toContain('- Memòria cultural: el Mas no té cap mòdul de memòria cultural.');
  expect(memoria).toContain("- Configuració del poble: la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou.");
  /* V2-02 · La configuració no s'ha llegit: la taula no diu «sense personalització», que semblaria un poble sense. */
  expect(memoria).toContain("| `configuracio.json` | no s'exporta |");
  expect(memoria).not.toContain('sense personalització');
  expect(memoria).toMatch(/## Notícies i avisos \(0\)\n\nNo s'exporta en esta versió: encara no hi ha cap lectura pública garantida d'estes dades\.\n/);
  /* V1-02 · Amb fonts pendents, «Què queda fora» no diu «Res.» a seques: parla només de les col·leccions exportades. */
  expect(memoria).not.toMatch(/## Què queda fora\n\nNomés recomptes, mai valors\.\n\n- Res\.\n/);
  expect(memoria).toContain("- Res entre les col·leccions exportades. El que encara no s'exporta és a «Fonts pendents».");
  // Cap línia de les fonts pendents porta dos dos punts, ni noms de codi, ni decisions internes, ni anglés.
  const fontsPendents = memoria.split('## Fonts pendents')[1].split('## Verificació')[0].split('\n').filter((l) => l.startsWith('- '));
  expect(fontsPendents).toHaveLength(5);
  for (const linia of fontsPendents) {
    expect(linia.split(':'), linia).toHaveLength(2);
    expect(linia, linia).not.toMatch(/[a-z][A-Z]|\bD-[A-Z]\d|\b(?:tenant|backend|port|capacitat|dadesObertes|directoriEntitats)\b/);
  }
  // El directori sí que s'ha llegit: buit és buit.
  expect(memoria).toMatch(/## Directori d'entitats i comerços \(0\)\n\nSense elements en esta exportació\./);
  expect(memoria).toContain('generat pel Mas (Sóc de Poble)');
  expect(memoria).not.toMatch(/per el Mas/);
  const paquet = await exportaMunicipiOpenData('sella', op);
  expect(paquet.datapackage.description).toContain('exportat pel Mas (Sóc de Poble)');
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
});
/* R2-COR-04: un backend sense directoriEntitats dona entitats null; el paquet ix i la memòria diu que el directori no hi és. */
test('sense la capacitat directoriEntitats: paquet verificable i el directori consta com a pendent', async () => {
  const op = { ...opcions(), municipi: { slug: 'sella', nom: 'Sella' }, port: { teCapacitat: () => false } };
  const paquet = await exportaMunicipiOpenData('sella', op);
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
  const memoria = preparaDadesObertesMunicipi(await entradaOpenDataDelPoble('sella', op)).fitxers.find((f) => f.nom === 'memoria.md').text;
  expect(memoria).toContain("- Directori d'entitats i comerços: este servidor de dades no oferix el directori d'entitats.");
  expect(memoria).not.toMatch(/backend|directoriEntitats/);
});
/* T3.1 · Amb l'agenda pendent la descàrrega no porta cap agenda.ics ni el promet. T2 · D04/D10: l'esquema és el 1.2.0. */
test('API de slug: esquema 1.2.0; amb l’agenda pendent, cap agenda.ics ni cap menció del calendari', async () => {
  for (const op of [{ ...opcions(), municipi: { slug: 'sella', nom: 'Sella' } }, opcions()]) {
    const paquet = await exportaMunicipiOpenData(op.municipi.slug, op);
    expect(paquet.datapackage.socdepoble).toMatchObject({ schemaVersion: '1.2.0', versio: '1.2.0' });
    /* Gauntlet 261101 (B1-07) · Cap recompte del calendari d'una agenda que no s'ha llegit, ni cap omissió que en parle. */
    expect(paquet.datapackage.socdepoble).not.toHaveProperty('calendari');
    expect(paquet.datapackage.socdepoble.omissions.agenda).toEqual({});
    expect(paquet.datapackage.resources.map((r) => r.path)).not.toContain('agenda.ics');
    expect(paquet.fitxers.map((f) => f.cami)).not.toContain('data/agenda.ics');
    const memoria = preparaDadesObertesMunicipi(await entradaOpenDataDelPoble(op.municipi.slug, op)).fitxers.find((f) => f.nom === 'memoria.md').text;
    expect(memoria).toContain('(versió 1.2.0)');
    expect(memoria).not.toMatch(/agenda\.ics|iCalendar/);
    await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
  }
});
test('«pendents» invàlid atura l’exportació', () => {
  const base = { municipi: { slug: 'sella', nom: 'Sella' }, ara: '2026-10-31T12:00:00Z' };
  for (const pendents of ['noticies', [null], [{ coleccio: 'mercat', motiu: 'x' }], [{ coleccio: 'agenda', motiu: '' }], [{ coleccio: 'agenda', motiu: 'a' }, { coleccio: 'agenda', motiu: 'b' }]]) {
    expect(() => preparaDadesObertesMunicipi({ ...base, pendents })).toThrow('«pendents»');
  }
  // Sense «pendents», cap secció inventada, i «Res.» vol dir res.
  const senseFonts = preparaDadesObertesMunicipi(base).fitxers.find((f) => f.nom === 'memoria.md').text;
  expect(senseFonts).not.toContain('## Fonts pendents');
  expect(senseFonts).toMatch(/## Què queda fora\n\nNomés recomptes, mai valors\.\n\n- Res\.\n/);
  // Sense «pendents» ni personalització, la configuració s'ha llegit i és buida.
  expect(senseFonts).toContain('| `configuracio.json` | sense personalització |');
});
/* T2 · D04/D10 (assalt 261101) · Amb la capacitat 'dadesObertes', l'entrada porta les col·leccions llegides i els pendents
   només les que el servidor no té; el paquet es verifica. */
test('amb dadesObertes: l’entrada porta notícies i agenda signades, i només la memòria i la memòria oral són pendents', async () => {
  const noticia = { id: 'ban', title: 'Ban', author_org_id: 'ajuntament-de-sella', poble_id: 'sella', created_at: '2026-10-30T10:00:00Z' };
  const acte = { id: 'festa', title: 'Festa', inici: { data: '2026-11-15' }, author_org_id: 'ajuntament-de-sella', poble_id: 'sella' };
  const portObert = {
    teCapacitat: (cap) => ['directoriEntitats', 'dadesObertes'].includes(cap),
    listPublicOrganizations: vi.fn(async () => [{ id: 'ajuntament-de-sella', name: 'Ajuntament de Sella', town_name: 'Sella' }]),
    llegixDadesObertes: vi.fn(async () => ({ noticies: [noticia], agenda: [acte], memoria: null, memoriaOral: null }))
  };
  const op = { ...opcions(), municipi: { slug: 'sella', nom: 'Sella' }, port: portObert };
  const entrada = await entradaOpenDataDelPoble('sella', op);
  expect(entrada).toMatchObject({ noticies: [noticia], agenda: [acte] });
  expect(entrada).not.toHaveProperty('memoria');
  expect(entrada.pendents.map((p) => p.coleccio)).toEqual(['memoria', 'memoriaOral', 'configuracio']);
  expect(portObert.llegixDadesObertes.mock.calls[0][0].poble).toEqual({ slug: 'sella', nom: 'Sella' });
  const paquet = await exportaMunicipiOpenData('sella', op);
  expect(paquet.comptes).toMatchObject({ noticies: 1, agenda: 1, directori: 1, memoria: 0, memoriaOral: 0 });
  expect(paquet.pendents).toEqual(['memoria', 'memoriaOral', 'configuracio']);
  expect(paquet.fitxers.map((f) => f.cami)).toContain('data/agenda.ics');
  await expect(verificaPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle })).resolves.toBeTruthy();
});
