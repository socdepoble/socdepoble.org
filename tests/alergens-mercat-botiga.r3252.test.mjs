import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { ALERGENS, matriuDeProducte } from '../src/data/menjarIBeure/allergens.js';
import { FONT, PRODUCTES } from '../src/apps/nevera/nucli/productes.js';
import { ARTICLES_PRODUCTES } from '../src/apps/nevera/nucli/cataleg.js';
import { PRODUCTES_AMB_ALERGENS, producteBotigaPerId, matriuBotigaPerId } from '../src/apps/nevera/nucli/alergensProductes.js';
import { producteBotigaAmbAlergens, matriuProducteBotiga } from '../src/data/menjarIBeure/alergensMercatBotiga.js';
import { alimentMercat, matriuAlimentMercat } from '../src/sections/mercat/alergensMercat.js';

const oli = () => ({
  id: 'oli-prova-250-ml', type: 'product', title: 'Oli de prova · 250 ml', category_slug: 'alimentacio',
  description: '<p>Naturalment lliure de gluten i al·lèrgens. Notes d’ametla; sobre pa torrat.</p>',
  author_org_id: 'entitat-de-prova', external_url: 'https://example.invalid/oli'
});
const desconeguda = (matriu) => {
  assert.deepEqual(Object.keys(matriu), ALERGENS);
  for (const cell of Object.values(matriu)) assert.deepEqual(cell, { estat: 'desconegut', simbol: '?', font: null });
};
const pendent = (producte) => {
  assert.ok(producte);
  assert.ok(Object.isFrozen(producte));
  for (const camp of ['alergens', 'tracesAlergens', 'alergensAbsents']) {
    assert.deepEqual(producte[camp], []);
    assert.ok(Object.isFrozen(producte[camp]));
  }
  assert.equal(producte.fontAlergens, null);
  assert.equal(producte.estatEvidenciaAlergens, 'sense_fitxa_envas_acreditada');
  assert.equal(producte.acreditatPerAlConsum, false);
  assert.match(producte.avisAlergens, /Desconegut no acredita absència/);
  assert.match(producte.avisAlergens, /aptitud per al consum/);
  assert.ok(Object.isFrozen(producte.procedenciaAlergens));
  desconeguda(matriuDeProducte(producte));
};

test('Corpus 6: les 592 files de huit columnes continuen congelades i amb els ids publicats', () => {
  assert.equal(PRODUCTES.length, 592);
  assert.ok(Object.isFrozen(PRODUCTES));
  let hash = 0x811c9dc5;
  for (const c of PRODUCTES.map(([id]) => id).join('\n')) hash = Math.imul(hash ^ c.codePointAt(0), 0x01000193) >>> 0;
  assert.equal(hash.toString(16).padStart(8, '0'), '111b1e71');
  for (const fila of PRODUCTES) {
    assert.equal(fila.length, 8);
    assert.ok(Object.isFrozen(fila));
    assert.deepEqual(Object.keys(fila), ['0', '1', '2', '3', '4', '5', '6', '7']);
  }
});

test('Corpus 6: projecció completa de totes les files, inclosos els articles no alimentaris', () => {
  assert.equal(PRODUCTES_AMB_ALERGENS.length, PRODUCTES.length);
  assert.ok(Object.isFrozen(PRODUCTES_AMB_ALERGENS));
  const abans = JSON.stringify(PRODUCTES);
  for (const [index, fila] of PRODUCTES.entries()) {
    const [id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims] = fila;
    const projectat = PRODUCTES_AMB_ALERGENS[index];
    pendent(projectat);
    for (const [camp, valor] of Object.entries({ id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims })) assert.equal(projectat[camp], valor);
    assert.equal(projectat.procedenciaAlergens.canal, 'botiga');
    assert.equal(projectat.procedenciaAlergens.fitxer, 'src/apps/nevera/nucli/productes.js');
    assert.equal(projectat.procedenciaAlergens.tall, FONT.tall);
    assert.equal(projectat.procedenciaAlergens.origenVerificat, true);
    assert.equal(producteBotigaPerId(id), projectat);
    assert.equal(ARTICLES_PRODUCTES[index].id, projectat.id);
    desconeguda(matriuBotigaPerId(id));
    desconeguda(matriuProducteBotiga(fila));
  }
  assert.equal(JSON.stringify(PRODUCTES), abans);
});

test('Corpus 6: ni nom, marca, secció ni envàs donen presència, absència, traça o origen verificat', () => {
  const noms = ['Llet sencera', 'Ous', 'Cacaus', 'Pa de blat', 'Sin gluten', 'Sense traces', 'Sin alérgenos', 'Oli amb aroma d’ametla'];
  for (const nom of noms) {
    const producte = producteBotigaAmbAlergens(['mer-prova', nom, 'llet-formatge', 'Marca sense gluten', 'Fitxa certificada', 1, 'u', 1]);
    pendent(producte);
    assert.equal(producte.procedenciaAlergens.origenVerificat, false);
    assert.equal(producte.procedenciaAlergens.fitxer, null);
    assert.equal(producte.procedenciaAlergens.tall, null);
  }
});

test('Corpus 6: DTO real Mercat conserva identitat descriptiva, cap prosa ni contacte ni acreditació', () => {
  const entrada = oli();
  const abans = structuredClone(entrada);
  const projectat = alimentMercat(entrada);
  pendent(projectat);
  assert.equal(projectat.id, entrada.id);
  assert.equal(projectat.nom, entrada.title);
  assert.equal(projectat.categoriaId, 'alimentacio');
  assert.deepEqual(projectat.procedenciaAlergens, {
    canal: 'mercat', fitxer: null, colleccio: null, tall: null, origenVerificat: false,
    abast: 'identitat declarada del payload rebut; origen, vigència, composició i etiqueta d’envàs sense acreditar'
  });
  for (const clau of ['description', 'author_org_id', 'external_url', 'contacte']) assert.equal(Object.hasOwn(projectat, clau), false);
  assert.deepEqual(entrada, abans);
  desconeguda(matriuAlimentMercat(entrada));
});

test('Corpus 6: fontAlergens lliure, URL oficial, matriu i fals envàs verificat no són evidència', () => {
  const falsesFonts = ['', 'Reglament (UE) 1169/2011', 'https://example.invalid/etiqueta.pdf', 'Fitxa d’envàs acreditada pel fabricant'];
  for (const fontAlergens of falsesFonts) {
    const entrada = { ...oli(), fontAlergens, alergens: ['llet'], tracesAlergens: ['ous'], alergensAbsents: ALERGENS,
      matriu: { gluten: { estat: 'absent', font: fontAlergens } },
      evidenciaEnvas: { verificada: true, tipus: 'envas', lot: 'lot-prova', sha256: 'a'.repeat(64), font: fontAlergens },
      acreditatPerAlConsum: true, estatEvidenciaAlergens: 'acreditada' };
    pendent(alimentMercat(entrada));
    desconeguda(matriuAlimentMercat(entrada));
  }
});

test('Corpus 6: camps de declaració hostils no s’executen ni s’iteren', () => {
  let crides = 0;
  const hostil = { toString() { crides++; throw new Error('coerció'); }, [Symbol.iterator]() { crides++; throw new Error('iteració'); } };
  const entrada = { ...oli(), alergens: hostil, tracesAlergens: hostil, alergensAbsents: hostil, fontAlergens: hostil };
  for (const camp of ['description', 'evidenciaEnvas', 'matriu', 'acreditatPerAlConsum']) Object.defineProperty(entrada, camp, { get() { crides++; throw new Error('getter'); } });
  pendent(alimentMercat(entrada));
  desconeguda(matriuAlimentMercat(entrada));
  assert.equal(crides, 0);
});

test('Corpus 6: primitius, instàncies, arrays, ids especials i DTO malformat fallen cap a desconegut', () => {
  const revocat = Proxy.revocable({}, {}); revocat.revoke();
  const entrades = [null, undefined, true, 1, 1n, Symbol('id'), 'oli', [], new Date(), new Map(), revocat.proxy,
    {}, { ...oli(), id: {} }, { ...oli(), id: '__proto__' },
    { ...oli(), id: 'a'.repeat(161) }, { ...oli(), title: '' }, { ...oli(), title: 'a\u202eb' },
    { ...oli(), type: {} }, Object.create(oli()), new Proxy({}, { ownKeys() { throw new Error('trap'); } })];
  /* «constructor» és un id textual vàlid: només és una identitat, mai una clau d'objecte amb autoritat. */
  for (const entrada of entrades) {
    assert.equal(alimentMercat(entrada), null);
    desconeguda(matriuAlimentMercat(entrada));
  }
  pendent(alimentMercat({ ...oli(), id: 'constructor' }));
});

test('Corpus 6: getters d’identitat i coercions d’objecte són refusats sense executar-los', () => {
  let crides = 0;
  const objecte = { toString() { crides++; return 'oli-prova'; }, valueOf() { crides++; return 1; }, [Symbol.toPrimitive]() { crides++; return 'oli-prova'; } };
  for (const camp of ['id', 'title', 'type']) {
    const entrada = { ...oli(), [camp]: objecte };
    assert.equal(alimentMercat(entrada), null);
    Object.defineProperty(entrada, camp, { get() { crides++; return 'oli-prova'; } });
    assert.equal(alimentMercat(entrada), null);
    desconeguda(matriuAlimentMercat(entrada));
  }
  assert.equal(producteBotigaPerId(objecte), null);
  desconeguda(matriuBotigaPerId(objecte));
  assert.equal(crides, 0);
});

test('Corpus 6: files parcials, camps d’objecte, accessors i nombres fora de contracte no es projecten', () => {
  const bona = ['mer-prova', 'Nom', 'begudes', 'Marca', 'Botella', 1, 'l', 100];
  const entrades = [null, {}, [], bona.slice(0, 7), [...bona, 'extra'], { ...bona }, new Set(bona)];
  for (const [index, valor] of [[0, {}], [1, {}], [2, {}], [3, {}], [4, {}], [5, '1'], [5, NaN], [5, Infinity], [5, -1], [6, {}], [6, 'litres'], [7, 1.5], [7, 0], [7, Number.MAX_SAFE_INTEGER + 1]]) {
    const fila = [...bona]; fila[index] = valor; entrades.push(fila);
  }
  let crides = 0;
  const getter = [...bona]; Object.defineProperty(getter, '0', { get() { crides++; return 'mer-prova'; } }); entrades.push(getter);
  for (const fila of entrades) {
    assert.equal(producteBotigaAmbAlergens(fila), null);
    desconeguda(matriuProducteBotiga(fila));
  }
  assert.equal(crides, 0);
});

test('Corpus 6: id desconegut i noms de propietats no resolen el catàleg ni inventen dades', () => {
  for (const id of [null, undefined, 1, {}, [], Symbol('id'), '', '__proto__', 'constructor', 'toString', 'mer-inexistent']) {
    assert.equal(producteBotigaPerId(id), null);
    desconeguda(matriuBotigaPerId(id));
  }
});

test('Corpus 6: les matrius i les declaracions no es poden contaminar entre lectures', () => {
  const producte = producteBotigaPerId(PRODUCTES[0][0]);
  assert.throws(() => producte.alergens.push('llet'), TypeError);
  assert.throws(() => { producte.procedenciaAlergens.abast = 'acreditat'; }, TypeError);
  const primera = matriuBotigaPerId(producte.id), segona = matriuBotigaPerId(producte.id);
  assert.notEqual(primera, segona);
  assert.ok(Object.isFrozen(primera));
  for (const cell of Object.values(primera)) assert.ok(Object.isFrozen(cell));
  assert.throws(() => { primera.gluten.estat = 'absent'; }, TypeError);
  desconeguda(segona);
});

test('Corpus 6: mòduls de producció tancats a imports purs i cap efecte de xarxa en importar o consultar', () => {
  const camins = [
    'src/data/menjarIBeure/alergensMercatBotiga.js', 'src/apps/nevera/nucli/alergensProductes.js',
    'src/sections/mercat/alergensMercat.js'
  ];
  for (const cami of camins) {
    const codi = readFileSync(new URL(`../${cami}`, import.meta.url), 'utf8');
    assert.doesNotMatch(codi, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\s*\(/);
    assert.doesNotMatch(codi, /(?:from\s*|import\s*\()['"][^'"]*(?:iaia|unanimitat|backend|supabase|node:)/i);
  }
  const script = `globalThis.fetch = () => { throw new Error('xarxa prohibida'); };
    const { PRODUCTES_AMB_ALERGENS, matriuBotigaPerId } = await import('./src/apps/nevera/nucli/alergensProductes.js');
    const { matriuAlimentMercat } = await import('./src/sections/mercat/alergensMercat.js');
    for (const producte of PRODUCTES_AMB_ALERGENS) matriuBotigaPerId(producte.id);
    matriuAlimentMercat({id:'oli-prova',title:'Oli de prova',type:'product',category_slug:'alimentacio'});`;
  const execucio = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 15000 });
  assert.equal(execucio.status, 0, execucio.stderr);
  assert.equal(execucio.stdout, '');
});
