// @vitest-environment node
import { expect, test } from 'vitest';
import { preparaDadesObertesMunicipi } from './exportaMunicipiOpenData.js';
import { FONTS_SNAPSHOT, MUNICIPI_SNAPSHOT, empremtaTextNoticia, preparaSnapshotOpenDataPublic, validaSnapshotOpenDataPublic } from '../../tooling/seo/snapshot-opendata-public.mjs';

const noticia = { id: 'node-zero-mac-mini-m4', title: 'Node 0', body: '<p>Servidor de La Torre de les Maçanes.</p>', author_entity_id: 'socdepoble', author_id: 'no-exportar', email: 'no-exportar@example.test' };
const prepara = x => preparaSnapshotOpenDataPublic({ feedPosts: [noticia], events: [{ id: 'aplec-2023', location: 'Benillup' }], ara: '2026-11-03T15:33:02Z', ...x });
const curacio = () => ({
  tipus: 'resum-editorial-contrastat', fontCapturadaEl: '2026-11-03T15:00:00Z', elaboratEl: '2026-11-03T15:30:00Z',
  fontTextSha256: empremtaTextNoticia(noticia), criteri: 'Resum amb observació històrica datada; no modifica la font remota.',
  observacions: [{ url: 'https://socdepoble.org/', consultatEl: '2026-11-03T15:20:00Z', httpStatus: 200 }],
  textos: { subtitle: 'Dos punts públics i un pilot físic', lead: 'A La Torre de les Maçanes el pilot continua en preparació.',
    entradilla: 'A La Torre de les Maçanes el pilot continua en preparació.', body: 'Resum editorial: el pilot físic encara no té servei públic acreditat a La Torre de les Maçanes.' },
});

test('snapshot públic contrastat: tres col·leccions reals, fonts, cap fals relat oral ni trasllat de l’Aplec', () => {
  const s = prepara();
  expect(s.entrada.municipi).toEqual(MUNICIPI_SNAPSHOT);
  const p = preparaDadesObertesMunicipi(s.entrada);
  expect(p.comptes).toEqual({ noticies: 1, agenda: 1, directori: 3, memoria: 1, memoriaOral: 0 });
  expect(s.entrada.agenda[0]).toMatchObject({ inici: '2023-11-26T10:30:00+01:00', location: expect.stringContaining('Casa Alta') });
  expect(s.entrada.agenda.some(x => x.id === 'aplec-2023')).toBe(false);
  expect(s.entrada.memoria[0].text).toContain(FONTS_SNAPSHOT.memoria);
  expect(s.entrada.pendents.find(x => x.coleccio === 'memoriaOral').motiu).toContain('revisió humana');
  expect(JSON.stringify(s)).not.toContain('no-exportar');
  expect(s.provinencia.map(x => x.url)).toEqual(Object.values(FONTS_SNAPSHOT));
});

test('no admet una notícia privada, de persona, esborrany, duplicada ni que haja perdut el lloc contrastat', () => {
  for (const x of [{ ...noticia, visibility: 'private' }, { ...noticia, owner_user_id: null }, { ...noticia, status: 'draft' }, { ...noticia, body: 'Un altre poble' }, { ...noticia, author_entity_id: 'altra-entitat' }]) {
    expect(() => prepara({ feedPosts: [x] })).toThrow();
  }
  expect(() => prepara({ feedPosts: [noticia, noticia] })).toThrow(/duplicada/);
  expect(() => prepara({ events: null })).toThrow(/completes/);
});


test('reproduir no publica propietats privades que el ZIP descartaria', () => {
  const bo = prepara(); expect(() => validaSnapshotOpenDataPublic(bo)).not.toThrow();
  for (const contamina of [s => { s.privateNotes = ['privat']; }, s => { s.entrada.noticies[0].owner_user_id = null; }, s => { s.entrada.entitats[0].email = 'privat@example.test'; }, s => { s.provinencia[0].clau = 'privada'; }, s => { s.entrada.noticies[0].visibility = 'private'; }, s => { s.entrada.actorsPublicats = ['PRIVATE_SENTINEL']; }, s => { s.entrada.noticies[0].author_entity_id = 'persona-privada'; }]) {
    const s = structuredClone(bo); contamina(s); expect(() => validaSnapshotOpenDataPublic(s)).toThrow(/no publicables/);
  }
});

test('curació explícita conserva la font i verifica el CAS abans de substituir els quatre camps editorials', () => {
  const c = curacio(); const s = prepara({ curacioNoticia: c });
  expect(() => validaSnapshotOpenDataPublic(s)).not.toThrow();
  expect(s.entrada.noticies[0]).toMatchObject({ title: noticia.title, subtitle: c.textos.subtitle, lead: c.textos.lead, entradilla: c.textos.entradilla });
  expect(s.entrada.noticies[0].body).toContain(c.textos.body);
  expect(s.provinencia[0]).toMatchObject({ url: FONTS_SNAPSHOT.noticia, curacio: { fontTextSha256: empremtaTextNoticia(noticia), textCuratSha256: empremtaTextNoticia(s.entrada.noticies[0]) } });
  expect(c).not.toHaveProperty('textCuratSha256');
  for (const canvi of [{ ...noticia, title: 'Títol canviat' }, { ...noticia, body: 'Cos canviat a La Torre de les Maçanes.' }]) {
    expect(() => prepara({ feedPosts: [canvi], curacioNoticia: c })).toThrow(/font pública ha canviat/);
  }
});

test('el replay rebutja el relat antic en qualsevol camp i una empremta editorial manipulada', () => {
  for (const camp of ['title', 'subtitle', 'entradilla', 'lead', 'body', 'content']) {
    for (const fals of ['És el tercer node de la nostra xarxa.', 'Hi ha tres nodes actius.', 'Node connectat a socdepoble.cat.', 'Hem posat en marxa el Node 0.', '<strong>tercer</strong> node', 'tres\nnodes\nactius', 'connectat a http://socdepoble.cat']) {
      const s = prepara({ curacioNoticia: curacio() }); s.entrada.noticies[0][camp] = fals;
      s.provinencia[0].curacio.textCuratSha256 = empremtaTextNoticia(s.entrada.noticies[0]);
      expect(() => validaSnapshotOpenDataPublic(s)).toThrow(/Snapshot públic invàlid/);
    }
  }
  const s = prepara({ curacioNoticia: curacio() }); s.entrada.noticies[0].lead = 'Una revisió posterior sense empremta actualitzada.';
  expect(() => validaSnapshotOpenDataPublic(s)).toThrow(/Snapshot públic invàlid/);
});

test('la procedència tipada rebutja dades privades, fonts alienes, dates impossibles i resultats contradictoris', () => {
  for (const canvia of [
    c => { c.owner_user_id = 'PRIVATE_SENTINEL'; }, c => { c.observacions[0].privateNotes = ['PRIVATE_SENTINEL']; },
    c => { c.observacions[0].url = 'http://localhost/'; }, c => { c.observacions[0].url = 'https://socdepoble.org/?secret=PRIVATE_SENTINEL'; },
    c => { c.fontTextSha256 = 'no-és-un-hash'; }, c => { c.textCuratSha256 = '0'.repeat(64); },
    c => { c.elaboratEl = '2026-02-31T00:00:00Z'; }, c => { c.elaboratEl = '2026-11-04T00:00:00Z'; },
    c => { c.fontCapturadaEl = '2026-11-04T00:00:00Z'; }, c => { c.observacions[0].consultatEl = '2026-11-04T00:00:00Z'; },
    c => { c.observacions[0].error = 'ENOTFOUND'; }, c => { c.observacions[0].redireccio = 'https://gentdelatorre.net/'; },
  ]) {
    const s = prepara({ curacioNoticia: curacio() }); canvia(s.provinencia[0].curacio);
    expect(() => validaSnapshotOpenDataPublic(s)).toThrow(/Snapshot públic invàlid/);
  }
});

test('una revisió editorial honesta amb procedència coherent no queda fixada a un text immutable', () => {
  const s = prepara({ curacioNoticia: curacio() });
  s.entrada.noticies[0].lead = 'Revisió documental posterior del pilot en preparació.';
  s.provinencia[0].curacio.textCuratSha256 = empremtaTextNoticia(s.entrada.noticies[0]);
  expect(() => validaSnapshotOpenDataPublic(s)).not.toThrow();
});
